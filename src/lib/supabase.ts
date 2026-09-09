import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../types/database';

export const SUPERADMIN_EMAIL = (
  process.env.SUPERADMIN_EMAIL ||
  import.meta.env.SUPERADMIN_EMAIL ||
  'calvinum26@gmail.com'
).trim();

export const getSupabaseUrl = (): string => {
  return (
    process.env.PUBLIC_SUPABASE_URL ||
    import.meta.env.PUBLIC_SUPABASE_URL ||
    ''
  ).trim();
};

export const getSupabaseAnonKey = (): string => {
  return (
    process.env.PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();
};

export const getGoogleClientId = (): string => {
  return (
    process.env.PUBLIC_GOOGLE_CLIENT_ID ||
    import.meta.env.PUBLIC_GOOGLE_CLIENT_ID ||
    '410822825901-tdt0t970sriliv590uup2p8e4dfmkjhh.apps.googleusercontent.com'
  ).trim();
};

export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(url && key && url.startsWith('http') && !url.includes('your-project'));
};

export interface AstroContextLike {
  request: Request;
  cookies: AstroCookies;
}

export const createSupabaseServerClient = (context: AstroContextLike) => {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!isSupabaseConfigured()) {
    return null;
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(context.request.headers.get('cookie') ?? '');
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          context.cookies.set(name, value, options);
        });
      },
    },
  });
};

export const getOrCreateUserProfile = async (
  supabase: ReturnType<typeof createServerClient>,
  authUser: User
): Promise<Profile | null> => {
  try {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    const email = authUser.email || '';
    const adminEmails = [
      SUPERADMIN_EMAIL.toLowerCase(),
      'calvinadministrator@phinisilearn.web.id',
      'calvinum26@gmail.com',
    ];
    const isSuperAdmin = adminEmails.includes(email.toLowerCase());

    if (existingProfile) {
      if (isSuperAdmin && existingProfile.role !== 'admin') {
        const { data: updated } = await supabase
          .from('profiles')
          .update({ role: 'admin', updated_at: new Date().toISOString() })
          .eq('id', authUser.id)
          .select()
          .single();
        return (updated as Profile) ?? existingProfile;
      }
      return existingProfile as Profile;
    }

    const fullName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      email.split('@')[0] ||
      'Siswa Phinisi';

    const avatarUrl =
      authUser.user_metadata?.avatar_url ||
      authUser.user_metadata?.picture ||
      '';

    const newProfile: Partial<Profile> = {
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();

    if (insertError) {
      console.error('Peringatan profil database (RLS):', insertError.message);
      // Gunakan objek profil yang dibangun dari metadata sesi agar alur login tidak terblokir
      return newProfile as Profile;
    }

    return inserted as Profile;
  } catch (err) {
    console.error('Error getOrCreateUserProfile:', err);
    return null;
  }
};

export const getSupabaseAdminClient = () => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const autoConfirmUserEmail = async (email: string): Promise<boolean> => {
  try {
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) return false;

    const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();
    if (listError || !usersData?.users) {
      return false;
    }

    const targetUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
    );

    if (!targetUser) return false;

    if (targetUser.email_confirmed_at) {
      return true;
    }

    const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUser.id, {
      email_confirm: true,
    });

    if (updateError) {
      console.error('Peringatan autoConfirmUserEmail error:', updateError.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error autoConfirmUserEmail:', err);
    return false;
  }
};

