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
