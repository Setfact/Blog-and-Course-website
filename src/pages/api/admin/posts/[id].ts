import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const currentAdmin = context.locals.user;
  if (!currentAdmin || currentAdmin.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Akses ditolak' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const postId = context.params.id;
  if (!postId) {
    return new Response(JSON.stringify({ error: 'Post ID wajib disertakan' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createSupabaseServerClient({
    request: context.request,
    cookies: context.cookies,
  });

  const body = await context.request.json();
  const { action } = body;

  if (action === 'pin') {
    if (supabase) {
      const { data: post } = await supabase.from('community_posts').select('is_pinned').eq('id', postId).single();
      const nextPinned = !post?.is_pinned;
      await supabase.from('community_posts').update({ is_pinned: nextPinned }).eq('id', postId);
      await supabase.from('admin_audit_logs').insert({
        admin_id: currentAdmin.id,
        action: nextPinned ? 'PIN_POST' : 'UNPIN_POST',
        target_type: 'post',
        target_id: postId,
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'delete') {
    if (supabase) {
      await supabase.from('community_posts').delete().eq('id', postId);
      await supabase.from('admin_audit_logs').insert({
        admin_id: currentAdmin.id,
        action: 'DELETE_POST',
        target_type: 'post',
        target_id: postId,
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Aksi tidak dikenal' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
};
