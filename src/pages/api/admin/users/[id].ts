import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';
import { updateUserRole, updateUserStatus } from '../../../../lib/admin';
import type { UserRole, UserStatus } from '../../../../types/database';

export const POST: APIRoute = async (context) => {
  const currentAdmin = context.locals.user;
  if (!currentAdmin || currentAdmin.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Akses ditolak: hanya administrator yang berwenang' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const targetUserId = context.params.id;
  if (!targetUserId) {
    return new Response(JSON.stringify({ error: 'Target User ID wajib disertakan' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createSupabaseServerClient({
    request: context.request,
    cookies: context.cookies,
  });

  const body = await context.request.json();
  const { role, status } = body;

  let success = true;

  if (role && ['student', 'moderator', 'admin'].includes(role)) {
    const roleUpdated = await updateUserRole(supabase, currentAdmin.id, targetUserId, role as UserRole);
    if (!roleUpdated) success = false;
  }

  if (status && ['active', 'suspended'].includes(status)) {
    const statusUpdated = await updateUserStatus(supabase, currentAdmin.id, targetUserId, status as UserStatus);
    if (!statusUpdated) success = false;
  }

  return new Response(JSON.stringify({ success }), {
    status: success ? 200 : 400,
    headers: { 'Content-Type': 'application/json' },
  });
};
