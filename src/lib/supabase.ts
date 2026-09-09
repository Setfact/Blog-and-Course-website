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

    if (
      error ||
      !profile ||
      profile.id !== authUser.id ||
      !['student', 'moderator', 'admin'].includes(profile.role) ||
      !['active', 'suspended'].includes(profile.status)
    ) {
      return null;
    }

    return profile as Profile;
  } catch (err) {
    console.error('Error saat mengambil data profil:', err);
    return null;
  }
};
