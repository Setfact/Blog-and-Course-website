import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';
import { translateAuthError } from '../../../lib/auth-errors';
import { sanitizeRedirectPath } from '../../../lib/security';

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ request, cookies });
  if (!supabase) {
    return new Response(JSON.stringify({ error: 'Supabase belum dikonfigurasi pada server.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const email = (body.email || '').trim();
    const targetRedirect = sanitizeRedirectPath(body.redirect, '/dashboard');
    const emailRedirectTo = `${url.origin}/api/auth/callback?redirect=${encodeURIComponent(targetRedirect)}`;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Alamat email wajib diisi.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      const friendlyError = translateAuthError(error.message);
      return new Response(JSON.stringify({ error: friendlyError, rawError: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tautan konfirmasi baru berhasil dikirimkan ke email Anda. Silakan periksa kotak masuk atau spam di Gmail.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Error API resend:', err);
    return new Response(JSON.stringify({ error: 'Terjadi kesalahan sistem saat mengirim ulang email konfirmasi.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
