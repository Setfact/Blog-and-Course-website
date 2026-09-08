import type { APIRoute } from 'astro';
import { createSupabaseServerClient, getOrCreateUserProfile } from '../../../lib/supabase';
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
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const email = (body.email || '').trim();
    const password = body.password || '';
    const targetRedirect = body.redirect || url.searchParams.get('redirect') || '/dashboard';
    const emailRedirectTo = `${url.origin}/api/auth/callback?redirect=${encodeURIComponent(targetRedirect)}`;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email dan kata sandi wajib diisi.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return new Response(JSON.stringify({ error: 'Kata sandi harus terdiri dari minimal 8 karakter.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const derivedName = email.split('@')[0];
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: derivedName,
        },
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

    if (data.user) {
      await getOrCreateUserProfile(supabase, data.user);
    }

    if (data.session) {
      return new Response(JSON.stringify({ success: true, hasSession: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        hasSession: false,
        requiresConfirmation: true,
        email: data.user?.email || email,
        message: 'Tautan konfirmasi telah dikirim ke alamat email Anda. Harap verifikasi email Anda di Gmail sebelum masuk.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Error API register:', err);
    return new Response(JSON.stringify({ error: 'Terjadi kesalahan sistem saat mendaftarkan akun.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

