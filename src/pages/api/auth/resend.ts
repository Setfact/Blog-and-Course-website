import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';
import { HttpError, json, readBody, safeRedirect, getPublicOrigin } from '../../../lib/security';
import { emailField, limit } from '../../../lib/auth-security';

export const POST: APIRoute = async (context) => {
  const body = await readBody(context.request);
  const email = emailField(body.email);

  await limit(`resend:account:${email}`, 3, 3600);

  const supabase = createSupabaseServerClient(context);
  if (!supabase) {
    throw new HttpError(503, 'Layanan autentikasi database belum siap.');
  }

  const targetRedirect = safeRedirect(body.redirect, '/dashboard');
  const publicOrigin = getPublicOrigin(context.request);
  const emailRedirectTo = `${publicOrigin}/api/auth/callback?redirect=${encodeURIComponent(targetRedirect)}`;

  await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo,
    },
  });

  return json({
    success: true,
    message: 'Jika akun memerlukan verifikasi, petunjuk baru telah dikirim ke email Anda.',
  });
};
