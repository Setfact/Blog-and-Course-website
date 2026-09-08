import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile, AdminAuditLog, UserRole, UserStatus } from '../types/database';

export interface AdminKPIs {
  totalUsers: number;
  activeUsers: number;
  completedLessons: number;
  totalXpDistributed: number;
  totalPosts: number;
}

export const getAdminKPIs = async (supabase: SupabaseClient | null): Promise<AdminKPIs> => {
  if (supabase) {
    try {
      const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: completedLessons } = await supabase.from('user_lesson_progress').select('*', { count: 'exact', head: true });
      const { count: totalPosts } = await supabase.from('community_posts').select('*', { count: 'exact', head: true });

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_study_date', sevenDaysAgo);

      const { data: xpRows } = await supabase.from('profiles').select('xp');
      const totalXpDistributed = (xpRows || []).reduce((sum, r) => sum + (r.xp || 0), 0);

      return {
        totalUsers: totalUsers ?? 3,
        activeUsers: activeUsers ?? 2,
        completedLessons: completedLessons ?? 28,
        totalXpDistributed: totalXpDistributed || 1320,
        totalPosts: totalPosts ?? 2,
      };
    } catch (err) {
      console.error('Error fetching admin KPIs:', err);
    }
  }

  // Fallback metrics
  return {
    totalUsers: 142,
    activeUsers: 87,
    completedLessons: 614,
    totalXpDistributed: 28450,
    totalPosts: 38,
  };
};

let inMemoryUsers: Profile[] = [
  {
    id: 'admin-1',
    email: 'calvinum26@gmail.com',
    full_name: 'Calvin Umboh',
    avatar_url: '',
    role: 'admin',
    status: 'active',
    xp: 650,
    streak: 12,
    last_study_date: new Date().toISOString().split('T')[0],
    bio: 'Superadmin Phinisi Learn',
    created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-budi',
    email: 'budi.santoso@example.com',
    full_name: 'Budi Santoso',
    avatar_url: '',
    role: 'student',
    status: 'active',
    xp: 380,
    streak: 5,
    last_study_date: new Date().toISOString().split('T')[0],
    bio: 'Sedang mengejar sertifikasi CCNA 200-301',
    created_at: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-dewi',
    email: 'dewi.lestari@example.com',
    full_name: 'Dewi Lestari',
    avatar_url: '',
    role: 'student',
    status: 'active',
    xp: 290,
    streak: 4,
    last_study_date: new Date().toISOString().split('T')[0],
    bio: 'Sysadmin pemula di Bandung',
    created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-ahmad',
    email: 'ahmad.fauzi@example.com',
    full_name: 'Ahmad Fauzi',
    avatar_url: '',
    role: 'moderator',
    status: 'active',
    xp: 520,
    streak: 8,
    last_study_date: new Date().toISOString().split('T')[0],
    bio: 'Network Engineer di Surabaya',
    created_at: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-rina',
    email: 'rina.wijaya@example.com',
    full_name: 'Rina Wijaya',
    avatar_url: '',
    role: 'student',
    status: 'active',
    xp: 150,
    streak: 2,
    last_study_date: new Date().toISOString().split('T')[0],
    bio: 'Mempelajari otomatisasi Python',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let inMemoryAuditLogs: AdminAuditLog[] = [
  {
    id: 'log-1',
    admin_id: 'admin-1',
    action: 'PROMOTE_USER',
    target_type: 'user',
    target_id: 'user-ahmad',
    details: { old_role: 'student', new_role: 'moderator' },
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'log-2',
    admin_id: 'admin-1',
    action: 'PIN_POST',
    target_type: 'post',
    target_id: 'post-welcome-1',
    details: { title: 'Selamat datang di Komunitas Siswa Phinisi Learn' },
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

export const getUsersList = async (
  supabase: SupabaseClient | null,
  options: { search?: string; role?: string; status?: string } = {}
): Promise<Profile[]> => {
  const { search, role, status } = options;

  if (supabase) {
    try {
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });

      if (role && role !== 'all') {
        query = query.eq('role', role);
      }
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    } catch (err) {
      console.error('Error fetching users in Supabase:', err);
    }
  }

  let result = [...inMemoryUsers];
  if (role && role !== 'all') {
    result = result.filter((u) => u.role === role);
  }
  if (status && status !== 'all') {
    result = result.filter((u) => u.status === status);
  }
  if (search) {
    const s = search.toLowerCase();
    result = result.filter((u) => u.full_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
  }
  return result;
};

export const updateUserRole = async (
  supabase: SupabaseClient | null,
  adminId: string,
  targetUserId: string,
  newRole: UserRole
): Promise<boolean> => {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', targetUserId);

      if (!error) {
        await supabase.from('admin_audit_logs').insert({
          admin_id: adminId,
          action: 'UPDATE_ROLE',
          target_type: 'user',
          target_id: targetUserId,
          details: { new_role: newRole },
        });
        return true;
      }
    } catch (err) {
      console.error('Error updating user role in Supabase:', err);
    }
  }

  const target = inMemoryUsers.find((u) => u.id === targetUserId);
  if (target) {
    target.role = newRole;
    inMemoryAuditLogs.unshift({
      id: `log-${Date.now()}`,
      admin_id: adminId,
      action: 'UPDATE_ROLE',
      target_type: 'user',
      target_id: targetUserId,
      details: { new_role: newRole },
      created_at: new Date().toISOString(),
    });
    return true;
  }
  return false;
};

export const updateUserStatus = async (
  supabase: SupabaseClient | null,
  adminId: string,
  targetUserId: string,
  newStatus: UserStatus
): Promise<boolean> => {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', targetUserId);

      if (!error) {
        await supabase.from('admin_audit_logs').insert({
          admin_id: adminId,
          action: 'UPDATE_STATUS',
          target_type: 'user',
          target_id: targetUserId,
          details: { new_status: newStatus },
        });
        return true;
      }
    } catch (err) {
      console.error('Error updating user status in Supabase:', err);
    }
  }

  const target = inMemoryUsers.find((u) => u.id === targetUserId);
  if (target) {
    target.status = newStatus;
    inMemoryAuditLogs.unshift({
      id: `log-${Date.now()}`,
      admin_id: adminId,
      action: 'UPDATE_STATUS',
      target_type: 'user',
      target_id: targetUserId,
      details: { new_status: newStatus },
      created_at: new Date().toISOString(),
    });
    return true;
  }
  return false;
};

export const getAuditLogs = async (
  supabase: SupabaseClient | null,
  limit: number = 20
): Promise<AdminAuditLog[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select(`*, admin:profiles(*)`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) return data;
    } catch (err) {
      console.error('Error fetching audit logs in Supabase:', err);
    }
  }

  return inMemoryAuditLogs.slice(0, limit);
};

export interface UserProgressDetails {
  profile: Profile | null;
  completedLessons: { course_slug: string; lesson_id: string; completed_at: string }[];
  totalCompleted: number;
}

export const getUserProgressDetails = async (
  supabase: SupabaseClient | null,
  targetUserId: string
): Promise<UserProgressDetails> => {
  if (supabase) {
    try {
      const [profRes, progRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', targetUserId).single(),
        supabase
          .from('user_lesson_progress')
          .select('course_slug, lesson_id, completed_at')
          .eq('user_id', targetUserId)
          .order('completed_at', { ascending: false }),
      ]);

      return {
        profile: profRes.data || null,
        completedLessons: progRes.data || [],
        totalCompleted: progRes.data ? progRes.data.length : 0,
      };
    } catch (err) {
      console.error('Error getting user progress details:', err);
    }
  }

  const fallbackUser = inMemoryUsers.find((u) => u.id === targetUserId) || null;
  return {
    profile: fallbackUser,
    completedLessons: [
      { course_slug: 'security-fundamentals', lesson_id: 'firewall-basics', completed_at: new Date().toISOString() },
      { course_slug: 'ccna-fundamentals', lesson_id: 'ipv4-subnetting', completed_at: new Date().toISOString() },
    ],
    totalCompleted: 2,
  };
};

export const resetUserProgress = async (
  supabase: SupabaseClient | null,
  adminId: string,
  targetUserId: string
): Promise<boolean> => {
  if (supabase) {
    try {
      await supabase.from('user_lesson_progress').delete().eq('user_id', targetUserId);
      await supabase
        .from('profiles')
        .update({
          xp: 0,
          streak: 0,
          last_study_date: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId);

      await supabase.from('admin_audit_logs').insert({
        admin_id: adminId,
        action: 'RESET_PROGRESS',
        target_type: 'user',
        target_id: targetUserId,
        details: { reset_at: new Date().toISOString() },
      });

      return true;
    } catch (err) {
      console.error('Error resetting user progress:', err);
    }
  }

  inMemoryAuditLogs.unshift({
    id: `log-${Date.now()}`,
    admin_id: adminId,
    action: 'RESET_PROGRESS',
    target_type: 'user',
    target_id: targetUserId,
    details: { reset_at: new Date().toISOString() },
    created_at: new Date().toISOString(),
  });
  return true;
};

export interface CourseAnalyticsData {
  courseSlug: string;
  enrolledStudentsCount: number;
  totalCompletionsCount: number;
}

export const getCourseAnalytics = async (
  supabase: SupabaseClient | null
): Promise<Record<string, CourseAnalyticsData>> => {
  const result: Record<string, CourseAnalyticsData> = {};

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_lesson_progress')
        .select('user_id, course_slug');

      if (!error && data) {
        const studentMap: Record<string, Set<string>> = {};
        const countMap: Record<string, number> = {};

        data.forEach((row) => {
          const slug = row.course_slug;
          if (!studentMap[slug]) studentMap[slug] = new Set();
          studentMap[slug].add(row.user_id);
          countMap[slug] = (countMap[slug] || 0) + 1;
        });

        Object.keys(studentMap).forEach((slug) => {
          result[slug] = {
            courseSlug: slug,
            enrolledStudentsCount: studentMap[slug].size,
            totalCompletionsCount: countMap[slug] || 0,
          };
        });

        return result;
      }
    } catch (err) {
      console.error('Error fetching course analytics in Supabase:', err);
    }
  }

  // Data fallback
  return {
    'ccna-fundamentals': { courseSlug: 'ccna-fundamentals', enrolledStudentsCount: 34, totalCompletionsCount: 248 },
    'security-fundamentals': { courseSlug: 'security-fundamentals', enrolledStudentsCount: 22, totalCompletionsCount: 165 },
    'network-automation': { courseSlug: 'network-automation', enrolledStudentsCount: 18, totalCompletionsCount: 92 },
  };
};

let inMemoryAnnouncement = {
  id: 'ann-1',
  message: 'Selamat datang di Phinisi Learn! Ikuti challenge lab mingguan untuk memperbanyak XP.',
  type: 'info' as 'info' | 'warning' | 'success',
  is_active: true,
  created_at: new Date().toISOString(),
};

export const getActiveAnnouncement = async (supabase: SupabaseClient | null) => {
  if (supabase) {
    try {
      const { data } = await supabase
        .from('platform_announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) return data;
    } catch (err) {
      console.error('Error fetching active announcement:', err);
    }
  }

  return inMemoryAnnouncement;
};

export const saveAnnouncement = async (
  supabase: SupabaseClient | null,
  adminId: string,
  message: string,
  type: 'info' | 'warning' | 'success' = 'info',
  is_active: boolean = true
) => {
  if (supabase) {
    try {
      // Nonaktifkan pengumuman sebelumnya
      if (is_active) {
        await supabase.from('platform_announcements').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
      }

      const { data, error } = await supabase
        .from('platform_announcements')
        .insert({ message, type, is_active })
        .select()
        .single();

      if (!error && data) {
        await supabase.from('admin_audit_logs').insert({
          admin_id: adminId,
          action: 'UPDATE_ANNOUNCEMENT',
          target_type: 'announcement',
          target_id: data.id,
          details: { message, type, is_active },
        });
        return data;
      }
    } catch (err) {
      console.error('Error saving announcement in Supabase:', err);
    }
  }

  inMemoryAnnouncement = {
    id: `ann-${Date.now()}`,
    message,
    type,
    is_active,
    created_at: new Date().toISOString(),
  };

  inMemoryAuditLogs.unshift({
    id: `log-${Date.now()}`,
    admin_id: adminId,
    action: 'UPDATE_ANNOUNCEMENT',
    target_type: 'announcement',
    target_id: inMemoryAnnouncement.id,
    details: { message, type, is_active },
    created_at: new Date().toISOString(),
  });

  return inMemoryAnnouncement;
};

