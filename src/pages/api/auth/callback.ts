import type { APIRoute } from 'astro';
import { createSupabaseServerClient, getOrCreateUserProfile } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const targetRedirect = requestUrl.searchParams.get('redirect') || '/dashboard';

  if (!code) {
    return redirect('/login?error=invalid_auth_code');
  }

  const supabase = createSupabaseServerClient({ request, cookies });
  if (!supabase) {
    return redirect('/login?error=supabase_unavailable');
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session?.user) {
    return redirect(`/login?error=${encodeURIComponent(error?.message || 'Gagal menukarkan sesi autentikasi')}`);
  }

  await getOrCreateUserProfile(supabase, data.session.user);

  return redirect(targetRedirect.startsWith('/') ? targetRedirect : `/${targetRedirect}`);
};
