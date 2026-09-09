import type { APIRoute } from 'astro';
import { createSupabaseServerClient, getOrCreateUserProfile } from '../../../lib/supabase';
import { HttpError, json, readBody } from '../../../lib/security';
import { authFailure, emailField, passwordField, limit } from '../../../lib/auth-security';

export const POST: APIRoute = async (context) => {
  const body = await readBody(context.request);
  const email = emailField(body.email);
  const password = passwordField(body.password);

  // Rate limiting per akun target
  await limit(`login:account:${email}`, 20, 900);

  const supabase = createSupabaseServerClient(context);
  if (!supabase) {
    throw new HttpError(503, 'Layanan autentikasi database belum siap.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Verifikasi kredensial dan konfirmasi email
  if (error || !data.session || !data.user?.email_confirmed_at) {
    if (data.session) {
      await supabase.auth.signOut({ scope: 'local' });
    }
    return json({ error: authFailure }, 400);
  }

  const profile = await getOrCreateUserProfile(supabase, data.user);
  if (!profile || profile.status !== 'active') {
    await supabase.auth.signOut({ scope: 'local' });
    return json({ error: authFailure }, 400);
  }

  return json({ success: true });
};
