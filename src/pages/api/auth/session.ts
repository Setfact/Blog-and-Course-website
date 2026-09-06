import type { APIRoute } from 'astro';
import { createSupabaseServerClient, getOrCreateUserProfile } from '../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient({
    request: context.request,
    cookies: context.cookies,
  });

  if (!supabase) {
    return new Response(JSON.stringify({ error: 'Supabase belum dikonfigurasi' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { access_token, refresh_token } = await context.request.json();

    if (!access_token || !refresh_token) {
      return new Response(JSON.stringify({ error: 'Token tidak lengkap' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error || !data.user) {
      return new Response(JSON.stringify({ error: error?.message || 'Gagal menyimpan sesi' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const profile = await getOrCreateUserProfile(supabase, data.user);

    return new Response(JSON.stringify({ success: true, user: profile }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Kesalahan internal saat menyimpan sesi' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
