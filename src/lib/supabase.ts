import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../types/database';

export const getSupabaseUrl = (): string => {
  return (
    process.env.PUBLIC_SUPABASE_URL ||
    import.meta.env?.PUBLIC_SUPABASE_URL ||
    ''
  ).trim();
};

export const getSupabaseAnonKey = (): string => {
  return (
    process.env.PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env?.PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();
};

export const getGoogleClientId = (): string => {
  return (
    process.env.PUBLIC_GOOGLE_CLIENT_ID ||
    import.meta.env?.PUBLIC_GOOGLE_CLIENT_ID ||
    ''
  ).trim();
};

export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key || url.includes('your-project')) return false;
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password) return false;
    if (
      parsed.protocol !== 'https:' &&
      !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname))
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export interface AstroContextLike {
  request: Request;
  cookies: AstroCookies;
}

// Satu client per cookie jar request agar sesi hasil refresh langsung sinkron pada request yang sama
const serverClients = new WeakMap<AstroCookies, ReturnType<typeof createServerClient>>();

export const createSupabaseServerClient = (context: AstroContextLike) => {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!isSupabaseConfigured()) {
    return null;
  }

  const existing = serverClients.get(context.cookies);
  if (existing) return existing;

  const currentCookies = new Map(
    parseCookieHeader(context.request.headers.get('cookie') ?? '').map(({ name, value }) => [name, value ?? ''])
  );

  const isHttps =
    context.request.headers.get('x-forwarded-proto') === 'https' ||
    new URL(context.request.url).protocol === 'https:' ||
    process.env.NODE_ENV === 'production';

  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
    },
    cookies: {
      getAll() {
        return [...currentCookies].map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          if (options.maxAge === 0) {
            currentCookies.delete(name);
          } else {
            currentCookies.set(name, value);
          }
          context.cookies.set(name, value, {
            ...options,
            httpOnly: true,
            secure: isHttps,
            sameSite: 'lax',
            path: '/',
          });
        });
      },
    },
  });

  serverClients.set(context.cookies, client);
  return client;
};

export const getOrCreateUserProfile = async (
  supabase: ReturnType<typeof createServerClient>,
  authUser: User
): Promise<Profile | null> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    const email = (authUser.email || '').toLowerCase().trim();
    const superAdminEmail = (
      process.env.SUPERADMIN_EMAIL ||
      import.meta.env?.SUPERADMIN_EMAIL ||
      'calvinum26@gmail.com'
    ).toLowerCase().trim();
    const isSuperAdmin =
      email === superAdminEmail ||
      email === 'calvinadministrator@phinisilearn.web.id';

    if (profile) {
      if (
        profile.id !== authUser.id ||
        !['student', 'moderator', 'admin'].includes(profile.role) ||
        !['active', 'suspended'].includes(profile.status)
      ) {
        return null;
      }

      // Pastikan akun superadmin selalu memiliki role admin
      if (isSuperAdmin && profile.role !== 'admin') {
        const { data: updated } = await supabase
          .from('profiles')
          .update({ role: 'admin', updated_at: new Date().toISOString() })
          .eq('id', authUser.id)
          .select()
          .maybeSingle();

        return (updated as Profile) ?? (profile as Profile);
      }

      return profile as Profile;
    }

    // Jika pengguna belum memiliki data di tabel profiles, buat data profil baru
    const fullName =
      (authUser.user_metadata?.full_name as string | undefined) ||
      (authUser.user_metadata?.name as string | undefined) ||
      (authUser.user_metadata?.user_name as string | undefined) ||
      (email ? email.split('@')[0] : 'Siswa Phinisi');

    const avatarUrl =
      (authUser.user_metadata?.avatar_url as string | undefined) ||
      (authUser.user_metadata?.picture as string | undefined) ||
      '';

    const newProfile: Profile = {
      id: authUser.id,
      email,
      full_name: fullName,
      avatar_url: avatarUrl,
      role: isSuperAdmin ? 'admin' : 'student',
      status: 'active',
      xp: 0,
      streak: 0,
      last_study_date: null,
      bio: '',
      country: 'Indonesia',
      country_code: 'ID',
      dial_code: '+62',
      is_profile_complete: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .maybeSingle();

    if (insertError) {
      console.error('Peringatan saat membuat profil baru:', insertError.message);

      // Cek kembali jika profil sudah dibuat oleh proses paralel
      const { data: retryProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (retryProfile) {
        return retryProfile as Profile;
      }

      // Kembalikan objek profil baru agar sesi pengguna tidak terblokir
      return newProfile;
    }

    return (inserted as Profile) ?? newProfile;
  } catch (err) {
    console.error('Error saat mengambil data profil:', err);
    return null;
  }
};
