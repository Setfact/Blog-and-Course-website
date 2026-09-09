import type { APIRoute } from 'astro';
import { createSupabaseServerClient, getOrCreateUserProfile } from '../../../lib/supabase';
import { HttpError, json, readBody } from '../../../lib/security';
import { authFailure, emailField, passwordField, limit } from '../../../lib/auth-security';

export const POST: APIRoute = async (context) => {
  const body = await readBody(context.request);
  let rawIdentifier = typeof body.email === 'string' ? body.email.trim() : '';
  if (rawIdentifier && !rawIdentifier.includes('@') && /^[a-zA-Z0-9._-]+$/.test(rawIdentifier)) {
    rawIdentifier = `${rawIdentifier.toLowerCase()}@phinisilearn.web.id`;
  }
  const email = emailField(rawIdentifier);
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

  // Verifikasi konfirmasi email
  const isUnconfirmed = Boolean(
    (error && /email not confirmed/i.test(error.message)) ||
    (data?.user && !data.user.email_confirmed_at)
  );

  if (isUnconfirmed) {
    if (data?.session) {
      await supabase.auth.signOut({ scope: 'local' });
    }
    return json(
      {
        error: 'Email Anda belum dikonfirmasi. Silakan buka email verifikasi Anda atau kirim ulang tautan.',
        isEmailUnconfirmed: true,
        email,
      },
      400
    );
  }

  // Verifikasi kredensial umum
  if (error || !data?.session || !data.user) {
    return json({ error: authFailure }, 400);
  }

  const profile = await getOrCreateUserProfile(supabase, data.user);
  if (!profile || profile.status !== 'active') {
    await supabase.auth.signOut({ scope: 'local' });
    return json({ error: authFailure }, 400);
  }

  return json({ success: true });
};
