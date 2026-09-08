import type { APIRoute } from 'astro';
import {
  createSupabaseServerClient,
  getOrCreateUserProfile,
  autoConfirmUserEmail,
} from '../../../lib/supabase';
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
    let email = (body.email || '').trim();
    const password = body.password || '';

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email atau username dan kata sandi wajib diisi.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Dukung login dengan username (misal: "calvinadministrator")
    if (!email.includes('@')) {
      if (email.toLowerCase() === 'calvinadministrator') {
        email = 'calvinadministrator@phinisilearn.web.id';
      } else {
        email = `${email.toLowerCase()}@phinisilearn.web.id`;
      }
    }

    let { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Jika ditolak karena email belum dikonfirmasi, lakukan auto-confirm fallback via admin helper
    if (error && /email not confirmed/i.test(error.message)) {
      const isConfirmed = await autoConfirmUserEmail(email);
      if (isConfirmed) {
        // Coba login kembali setelah dikonfirmasi
        const retry = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        data = retry.data;
        error = retry.error;
      }
    }

    if (error || !data.session) {
      const isUnconfirmed = Boolean(error && /email not confirmed/i.test(error.message));
      const friendlyMessage = translateAuthError(error?.message);

      return new Response(
        JSON.stringify({
          error: friendlyMessage,
          isEmailUnconfirmed: isUnconfirmed,
          email,
          rawError: error?.message,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (data.user) {
      await getOrCreateUserProfile(supabase, data.user);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error API login:', err);
    return new Response(JSON.stringify({ error: 'Terjadi kesalahan sistem saat masuk.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

