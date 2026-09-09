import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';
import { deletePost, togglePostPin } from '../../../../lib/community';
import { json, readBody } from '../../../../lib/security';

export const POST: APIRoute = async (context) => {
  const currentAdmin = context.locals.user;
  if (!currentAdmin || currentAdmin.role !== 'admin') {
    return json({ error: 'Akses ditolak: Hanya administrator yang berwenang.' }, 403);
  }

  const postId = context.params.id;
  if (!postId) {
    return json({ error: 'ID postingan wajib disertakan.' }, 400);
  }

  const supabase = createSupabaseServerClient(context);
  const body = (await readBody(context.request).catch(() => ({}))) as Record<string, any>;
  const action = body.action;

  if (action === 'pin') {
    const result = await togglePostPin(supabase, postId, currentAdmin.id);
    if (!result.success) {
      return json({ error: result.error || 'Gagal mengubah status pin.' }, 400);
    }
    return json({ success: true, isPinned: result.isPinned });
  }

  if (action === 'delete') {
    const result = await deletePost(supabase, postId, currentAdmin);
    if (!result.success) {
      return json({ error: result.error || 'Gagal menghapus postingan.' }, 400);
    }

    if (supabase) {
      try {
        await supabase.from('admin_audit_logs').insert({
          admin_id: currentAdmin.id,
          action: 'DELETE_POST',
          target_type: 'post',
          target_id: postId,
        });
      } catch {}
    }

    return json({ success: true, message: 'Postingan berhasil dihapus.' });
  }

  return json({ error: 'Aksi tidak dikenali.' }, 400);
};
