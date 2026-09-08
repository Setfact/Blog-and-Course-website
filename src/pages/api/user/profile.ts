import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';

export const prerender = false;

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

  let body: { full_name?: string; bio?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Format JSON request tidak valid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const full_name = (body.full_name || '').trim();
  const bio = (body.bio || '').trim();

  if (!full_name) {
    return new Response(JSON.stringify({ error: 'Nama lengkap tidak boleh kosong' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (full_name.length > 80) {
    return new Response(JSON.stringify({ error: 'Nama lengkap maksimal 80 karakter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (bio.length > 300) {
    return new Response(JSON.stringify({ error: 'Bio maksimal 300 karakter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name,
        bio,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        full_name,
        bio,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Gagal memperbarui profil' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
