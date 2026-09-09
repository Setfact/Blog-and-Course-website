import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';
import { getUsersList } from '../../../../lib/admin';
import { csvCell } from '../../../../lib/security';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, locals }) => {
  const admin = locals.user;
  if (!admin || admin.role !== 'admin') {
    return new Response('Unauthorized', { status: 403 });
  }

  const supabase = createSupabaseServerClient({ request, cookies });
  const users = await getUsersList(supabase);

  const headers = [
    'User ID',
    'Nama Lengkap',
    'Email',
    'Role',
    'Status',
    'Total XP',
    'Streak Hari',
    'Tanggal Registrasi',
  ];

  const rows = users.map((u) =>
    [
      u.id,
      u.full_name,
      u.email,
      u.role,
      u.status,
      u.xp || 0,
      u.streak || 0,
      u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '',
    ].map(csvCell)
  );

  const csvContent = '\uFEFF' + [headers.map(csvCell).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
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
