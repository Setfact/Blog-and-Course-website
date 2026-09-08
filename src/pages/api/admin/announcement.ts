import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';
import { saveAnnouncement } from '../../../lib/admin';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const admin = locals.user;
  if (!admin || admin.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden. Akses admin diperlukan.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { message?: string; type?: 'info' | 'warning' | 'success'; is_active?: boolean };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Request body tidak valid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const message = (body.message || '').trim();
  const type = body.type || 'info';
  const is_active = body.is_active ?? true;

  if (!message) {
    return new Response(JSON.stringify({ error: 'Pesan pengumuman tidak boleh kosong' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createSupabaseServerClient({ request, cookies });
  const result = await saveAnnouncement(supabase, admin.id, message, type, is_active);

  return new Response(JSON.stringify({ success: true, announcement: result }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
