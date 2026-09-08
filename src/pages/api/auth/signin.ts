import type { APIRoute } from 'astro';
import { createSupabaseServerClient, isSupabaseConfigured } from '../../../lib/supabase';
import { sanitizeRedirectPath } from '../../../lib/security';

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const requestUrl = new URL(request.url);
  const redirectTo = sanitizeRedirectPath(requestUrl.searchParams.get('redirect'), '/dashboard');
  const callbackUrl = `${requestUrl.origin}/api/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;

  if (!isSupabaseConfigured()) {
    return new Response(
      `Supabase belum dikonfigurasi. Silakan isi PUBLIC_SUPABASE_URL dan PUBLIC_SUPABASE_ANON_KEY pada file .env untuk mengaktifkan Google Login.`,
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  const supabase = createSupabaseServerClient({ request, cookies });
  if (!supabase) {
    return redirect('/login?error=supabase_unavailable');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error || !data.url) {
    return redirect(`/login?error=${encodeURIComponent(error?.message || 'Gagal memulai login Google')}`);
  }

  return redirect(data.url);
};

export const POST: APIRoute = GET;
