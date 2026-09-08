import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';
import { getUsersList } from '../../../../lib/admin';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, locals }) => {
  const admin = locals.user;
  if (!admin || admin.role !== 'admin') {
    return new Response('Unauthorized', { status: 403 });
  }

  const supabase = createSupabaseServerClient({ request, cookies });
  const users = await getUsersList(supabase);

  const headers = ['User ID', 'Nama Lengkap', 'Email', 'Role', 'Status', 'Total XP', 'Streak Hari', 'Tanggal Registrasi'];

  const rows = users.map((u) => [
    `"${u.id}"`,
    `"${(u.full_name || '').replace(/"/g, '""')}"`,
    `"${(u.email || '').replace(/"/g, '""')}"`,
    `"${u.role}"`,
    `"${u.status}"`,
    u.xp || 0,
    u.streak || 0,
    `"${new Date(u.created_at).toISOString().split('T')[0]}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const today = new Date().toISOString().split('T')[0];

  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="phinisi_users_${today}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
};
