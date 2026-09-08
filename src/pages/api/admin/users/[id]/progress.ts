import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../../lib/supabase';
import { getUserProgressDetails, resetUserProgress } from '../../../../../lib/admin';

export const prerender = false;

export const GET: APIRoute = async ({ params, request, cookies }) => {
  const targetUserId = params.id;
  if (!targetUserId) {
    return new Response(JSON.stringify({ error: 'User ID tidak valid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createSupabaseServerClient({ request, cookies });
  const details = await getUserProgressDetails(supabase, targetUserId);

  return new Response(JSON.stringify(details), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ params, request, cookies, locals }) => {
  const admin = locals.user;
  if (!admin || admin.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden. Akses administrator diperlukan.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const targetUserId = params.id;
  if (!targetUserId) {
    return new Response(JSON.stringify({ error: 'User ID tidak valid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Request body tidak valid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createSupabaseServerClient({ request, cookies });

  if (body.action === 'reset') {
    const success = await resetUserProgress(supabase, admin.id, targetUserId);
    if (success) {
      return new Response(JSON.stringify({ success: true, message: 'Progres siswa berhasil di-reset' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Gagal mereset progres siswa' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Aksi tidak dikenali' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
};
