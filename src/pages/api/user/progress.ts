import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';
import { awardXp } from '../../../lib/xp';
import { getRankTier } from '../../../lib/rank';
import { getCourseBySlug } from '../../../data/learning';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ request, cookies });
  if (!supabase) {
    return new Response(JSON.stringify({ error: 'Database client tidak tersedia' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const [progressRes, profileRes] = await Promise.all([
      supabase.from('user_lesson_progress').select('course_slug, lesson_id').eq('user_id', user.id),
      supabase.from('profiles').select('xp, streak, last_study_date').eq('id', user.id).single(),
    ]);

    const completedLessons = (progressRes.data || []).map((row) => `${row.course_slug}/${row.lesson_id}`);
    const profile = profileRes.data || { xp: 0, streak: 0, last_study_date: null };
    const rankTier = getRankTier(profile.xp ?? 0);

    return new Response(
      JSON.stringify({
        completedLessons,
        xp: profile.xp ?? 0,
        streak: profile.streak ?? 0,
        lastStudyDate: profile.last_study_date ?? null,
        rankTier,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Gagal memuat progres pengguna' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ request, cookies });
  if (!supabase) {
    return new Response(JSON.stringify({ error: 'Database client tidak tersedia' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: {
    courseSlug?: string;
    lessonId?: string;
    activityId?: string;
    activityTitle?: string;
    xpAwarded?: number;
    completesLesson?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Format JSON request tidak valid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const {
    courseSlug,
    lessonId,
    activityId,
    activityTitle,
    xpAwarded = 25,
    completesLesson = true,
  } = body;

  if (!courseSlug || !lessonId) {
    return new Response(JSON.stringify({ error: 'Parameter courseSlug dan lessonId wajib disertakan' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Cek apakah lesson ini sudah pernah selesai sebelumnya
    const { data: existing } = await supabase
      .from('user_lesson_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_slug', courseSlug)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    const isFirstTime = !existing;

    if (isFirstTime && completesLesson) {
      // Masukkan ke user_lesson_progress
      await supabase.from('user_lesson_progress').insert({
        user_id: user.id,
        course_slug: courseSlug,
        lesson_id: lessonId,
      });

      // Ambil profile saat ini untuk perhitungan streak
      const { data: profile } = await supabase
        .from('profiles')
        .select('streak, last_study_date')
        .eq('id', user.id)
        .single();

      const currentStreak = profile?.streak ?? 0;
      const lastStudy = profile?.last_study_date;

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const yesterdayDate = new Date(Date.now() - 86400000);
      const yesterday = yesterdayDate.toISOString().split('T')[0];

      let newStreak = currentStreak;
      if (lastStudy !== today) {
        newStreak = lastStudy === yesterday ? currentStreak + 1 : 1;
      }

      // Update streak dan tanggal belajar
      await supabase
        .from('profiles')
        .update({
          streak: newStreak,
          last_study_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      // Award XP via central XP engine
      const source = activityId ? 'quiz_pass' : 'lesson_complete';
      const itemTitle = activityTitle || (activityId ? `Kuis Lab Selesai (+${xpAwarded} XP)` : `Lesson Selesai: ${courseSlug}/${lessonId}`);

      const xpResult = await awardXp(supabase, {
        userId: user.id,
        amount: Number(xpAwarded) || 25,
        source,
        title: itemTitle,
        referenceId: `${courseSlug}/${lessonId}`,
      });

      // 2. Cek milestone: apakah seluruh modul kursus sudah selesai 100%?
      let courseMilestoneAwarded = false;
      try {
        const course = await getCourseBySlug(courseSlug);
        if (course && course.lessonCount > 0) {
          const { count } = await supabase
            .from('user_lesson_progress')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('course_slug', courseSlug);

          if (count && count >= course.lessonCount) {
            // Berikan bonus milestone tamat kursus +100 XP
            await awardXp(supabase, {
              userId: user.id,
              amount: 100,
              source: 'course_completion',
              title: `Milestone Kursus: Tamat ${course.title} (+100 XP)`,
              referenceId: courseSlug,
            });
            courseMilestoneAwarded = true;
          }
        }
      } catch (milestoneErr) {
        console.warn('Gagal memproses milestone kursus:', milestoneErr);
      }

      return new Response(
        JSON.stringify({
          success: true,
          firstCompletion: true,
          awardedXp: xpResult.awardedAmount + (courseMilestoneAwarded ? 100 : 0),
          newXp: xpResult.newXp + (courseMilestoneAwarded ? 100 : 0),
          newStreak,
          currentTier: xpResult.currentTier,
          leveledUp: xpResult.leveledUp,
          courseMilestoneAwarded,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        firstCompletion: false,
        awardedXp: 0,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Gagal menyimpan progres belajar' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
