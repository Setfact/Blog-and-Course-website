const STORAGE_KEY = 'phinisi-learning-v1';

export interface LearningState {
  xp: number;
  streak: number;
  lastStudyDate: string | null;
  completedActivities: string[];
  completedLessons: string[];
  badges: string[];
  lastVisitedLessons: Record<string, string>;
}

interface CompleteActivityInput {
  activityId: string;
  courseSlug: string;
  lessonId?: string;
  xp: number;
  completesLesson?: boolean;
}

const emptyState = (): LearningState => ({
  xp: 0,
  streak: 0,
  lastStudyDate: null,
  completedActivities: [],
  completedLessons: [],
  badges: [],
  lastVisitedLessons: {},
});

const localDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const yesterdayKey = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return localDateKey(yesterday);
};

export const deriveBadges = (state: LearningState) => {
  const securityLessons = state.completedLessons.filter((lesson) => lesson.startsWith('security-fundamentals/')).length;
  const ccnaLessons = state.completedLessons.filter((lesson) => lesson.startsWith('ccna-fundamentals/')).length;
  const badges = new Set(state.badges);

  if (state.completedActivities.length >= 1 || state.completedLessons.length >= 1) badges.add('langkah-pertama');
  if (securityLessons >= 1) badges.add('security-starter');
  if (securityLessons >= 5) badges.add('security-guardian');
  if (ccnaLessons >= 1) badges.add('ccna-explorer');
  if (state.streak >= 3) badges.add('streak-3');

  return [...badges];
};

export const getLearningState = (): LearningState => {
  if (typeof window === 'undefined') return emptyState();
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return emptyState();
    const parsed = JSON.parse(saved) as Partial<LearningState>;
    return {
      xp: Number(parsed.xp) || 0,
      streak: Number(parsed.streak) || 0,
      lastStudyDate: parsed.lastStudyDate ?? null,
      completedActivities: Array.isArray(parsed.completedActivities) ? parsed.completedActivities : [],
      completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
      badges: Array.isArray(parsed.badges) ? parsed.badges : [],
      lastVisitedLessons: parsed.lastVisitedLessons && typeof parsed.lastVisitedLessons === 'object'
        ? parsed.lastVisitedLessons
        : {},
    };
  } catch {
    return emptyState();
  }
};

export const saveState = (state: LearningState) => {
  if (typeof window === 'undefined') return;
  state.badges = deriveBadges(state);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('phinisi-progress-updated', { detail: state }));
};

export const dispatchToast = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('phinisi-toast', { detail: { message, type } }));
};

export const syncWithCloud = async () => {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/user/progress');
    if (!res.ok) return;

    const data = await res.json();
    const state = getLearningState();

    const mergedLessons = Array.from(new Set([...state.completedLessons, ...(data.completedLessons || [])]));
    const mergedXp = Math.max(state.xp, Number(data.xp) || 0);
    const mergedStreak = Math.max(state.streak, Number(data.streak) || 0);
    const mergedDate = data.lastStudyDate || state.lastStudyDate;

    state.completedLessons = mergedLessons;
    state.xp = mergedXp;
    state.streak = mergedStreak;
    state.lastStudyDate = mergedDate;
    saveState(state);
  } catch {
    // Abaikan kegagalan jaringan pada background sync
  }
};

export const setLastVisitedLesson = (courseSlug: string, href: string) => {
  const state = getLearningState();
  if (state.lastVisitedLessons[courseSlug] === href) return state;
  state.lastVisitedLessons[courseSlug] = href;
  saveState(state);
  return state;
};

export const getCourseProgress = (courseSlug: string, totalLessons: number) => {
  const state = getLearningState();
  const completedLessons = state.completedLessons.filter((lesson) => lesson.startsWith(`${courseSlug}/`)).length;
  const percent = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
  return {
    completedLessons,
    percent,
    resumeHref: state.lastVisitedLessons[courseSlug],
  };
};

export const completeActivity = ({
  activityId,
  courseSlug,
  lessonId,
  xp,
  completesLesson = false,
}: CompleteActivityInput) => {
  const state = getLearningState();
  const activityKey = `${courseSlug}:${activityId}`;
  const firstCompletion = !state.completedActivities.includes(activityKey);

  if (firstCompletion) {
    state.completedActivities.push(activityKey);
    state.xp += xp;

    const today = localDateKey();
    if (state.lastStudyDate !== today) {
      state.streak = state.lastStudyDate === yesterdayKey() ? state.streak + 1 : 1;
      state.lastStudyDate = today;
    }
  }

  if (completesLesson && lessonId) {
    const lessonKey = `${courseSlug}/${lessonId}`;
    if (!state.completedLessons.includes(lessonKey)) {
      state.completedLessons.push(lessonKey);
    }
  }

  saveState(state);

  if (firstCompletion && xp > 0) {
    dispatchToast(`+${xp} XP berhasil didapatkan!`, 'success');

    // Sinkronkan ke server di background jika terhubung dengan akun
    if (lessonId) {
      fetch('/api/user/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseSlug,
          lessonId,
          activityId,
          activityTitle: `Aktivitas Lab Selesai (+${xp} XP)`,
          xpAwarded: xp,
          completesLesson,
        }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((cloudData) => {
          if (cloudData.newXp && cloudData.newXp > state.xp) {
            state.xp = cloudData.newXp;
            state.streak = cloudData.newStreak ?? state.streak;
            saveState(state);
          }
          if (cloudData.leveledUp && cloudData.currentTier) {
            dispatchToast(`Selamat! Anda naik pangkat menjadi ${cloudData.currentTier.name}!`, 'success');
          }
          if (cloudData.courseMilestoneAwarded) {
            dispatchToast('Selamat! Seluruh materi kursus selesai! Bonus Milestone +100 XP didapatkan!', 'success');
          }
        })
        .catch(() => {});
    }
  }

  return { state, firstCompletion, awardedXp: firstCompletion ? xp : 0 };
};

export const markLessonComplete = async (courseSlug: string, lessonId: string) => {
  const state = getLearningState();
  const lessonKey = `${courseSlug}/${lessonId}`;
  const isFirst = !state.completedLessons.includes(lessonKey);

  if (isFirst) {
    state.completedLessons.push(lessonKey);
    state.xp += 25;
    const today = localDateKey();
    if (state.lastStudyDate !== today) {
      state.streak = state.lastStudyDate === yesterdayKey() ? state.streak + 1 : 1;
      state.lastStudyDate = today;
    }
    saveState(state);
    dispatchToast('+25 XP berhasil didapatkan! Lesson selesai.', 'success');

    // Kirim sinkronisasi ke server di background
    try {
      const res = await fetch('/api/user/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug, lessonId, xpAwarded: 25, completesLesson: true }),
      });

      if (res.ok) {
        const cloudData = await res.json();
        if (cloudData.newXp && cloudData.newXp > state.xp) {
          state.xp = cloudData.newXp;
          state.streak = cloudData.newStreak ?? state.streak;
          saveState(state);
        }
        if (cloudData.leveledUp && cloudData.currentTier) {
          dispatchToast(`Selamat! Anda naik pangkat menjadi ${cloudData.currentTier.name}!`, 'success');
        }
        if (cloudData.courseMilestoneAwarded) {
          dispatchToast('Selamat! Seluruh materi kursus selesai! Bonus Milestone +100 XP didapatkan!', 'success');
        }
      }
    } catch {
      // Offline fallback: data tetap tersimpan di localStorage
    }
  }

  return state;
};

// Panggil syncWithCloud secara otomatis saat modul dimuat di browser
if (typeof window !== 'undefined') {
  syncWithCloud();
}
