import type { APIRoute } from 'astro';
import { createSupabaseServerClient, getOrCreateUserProfile } from '../../../lib/supabase';
import { sanitizeRedirectPath } from '../../../lib/security';
import { translateAuthError } from '../../../lib/auth-errors';

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ request, cookies });
  if (!supabase) {
    return new Response(JSON.stringify({ error: 'Supabase belum dikonfigurasi pada server.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const idToken = (body.token || '').trim();
    const targetRedirect = sanitizeRedirectPath(body.redirect, '/dashboard');

    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Token identitas Google tidak ditemukan.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error || !data.session || !data.user) {
      const friendlyMessage = translateAuthError(error?.message || 'Gagal memverifikasi token Google.');
      return new Response(
        JSON.stringify({
          error: friendlyMessage,
          rawError: error?.message,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Buat atau perbarui profil pengguna di database Supabase
    const profile = await getOrCreateUserProfile(supabase, data.user);
    if (!profile || profile.status !== 'active') {
      await supabase.auth.signOut({ scope: 'local' });
      return new Response(
        JSON.stringify({
          error: 'Akun Anda sedang dinonaktifkan atau ditangguhkan oleh administrator.',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        redirect: targetRedirect,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Error saat autentikasi Google ID token:', err);
    return new Response(
      JSON.stringify({ error: 'Terjadi kesalahan sistem saat memproses login Google.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
