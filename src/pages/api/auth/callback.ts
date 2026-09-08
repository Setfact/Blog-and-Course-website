import type { APIRoute } from 'astro';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createSupabaseServerClient, getOrCreateUserProfile } from '../../../lib/supabase';
import { translateAuthError } from '../../../lib/auth-errors';

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null;
  const targetRedirect = requestUrl.searchParams.get('redirect') || '/dashboard';

  const supabase = createSupabaseServerClient({ request, cookies });
  if (!supabase) {
    return redirect('/login?error=' + encodeURIComponent('Layanan autentikasi database belum siap.'));
  }

  try {
    let authUser = null;

    // 1. Jika dikirim dalam format token_hash dan type (standar email Supabase)
    if (token_hash && type) {
      const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });
      if (error) {
        const msg = translateAuthError(error.message);
        return redirect(`/login?error=${encodeURIComponent(msg)}`);
      }
      authUser = data.user;
    }
    // 2. Jika dikirim dalam format PKCE code
    else if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        const msg = translateAuthError(error.message);
        return redirect(`/login?error=${encodeURIComponent(msg)}`);
      }
      authUser = data.session?.user || data.user;
    } else {
      return redirect('/login?error=' + encodeURIComponent('Kode atau token verifikasi tidak ditemukan.'));
    }

    if (authUser) {
      await getOrCreateUserProfile(supabase, authUser);
    }

    const cleanRedirect = targetRedirect.startsWith('/') ? targetRedirect : `/${targetRedirect}`;
    const destination = cleanRedirect.includes('?')
      ? `${cleanRedirect}&verified=true`
      : `${cleanRedirect}?verified=true`;

    return redirect(destination);
  } catch (err: any) {
    console.error('Error saat verifikasi auth callback:', err);
    return redirect('/login?error=' + encodeURIComponent('Terjadi kesalahan saat memverifikasi akun Anda.'));
  }
};

