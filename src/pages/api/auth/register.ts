import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';
import { HttpError, json, readBody, safeRedirect, getPublicOrigin } from '../../../lib/security';
import { emailField, passwordField, limit } from '../../../lib/auth-security';

export const POST: APIRoute = async (context) => {
  const body = await readBody(context.request);
  const email = emailField(body.email);
  const password = passwordField(body.password, true);

  await limit(`register:account:${email}`, 3, 3600);

  const supabase = createSupabaseServerClient(context);
  if (!supabase) {
    throw new HttpError(503, 'Layanan autentikasi database belum siap.');
  }

  const targetRedirect = safeRedirect(body.redirect, '/dashboard');
  const publicOrigin = getPublicOrigin(context.request);
  const emailRedirectTo = `${publicOrigin}/api/auth/callback?redirect=${encodeURIComponent(targetRedirect)}`;

  const { data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: email.split('@')[0],
      },
      emailRedirectTo,
    },
  });

  if (data?.session) {
    await supabase.auth.signOut({ scope: 'local' });
  }

  return json({
    success: true,
    hasSession: false,
    requiresConfirmation: true,
    message: 'Jika pendaftaran dapat diproses, petunjuk verifikasi dikirim ke email Anda.',
  });
};
