import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';
import { createComment, deleteComment } from '../../../lib/community';

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Harap masuk terlebih dahulu' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createSupabaseServerClient({
    request: context.request,
    cookies: context.cookies,
  });

  const contentType = context.request.headers.get('content-type') || '';
  let postId = '';
  let content = '';

  if (contentType.includes('application/json')) {
    const body = await context.request.json();
    postId = body.post_id || '';
    content = body.content?.trim() || '';
  } else {
    const formData = await context.request.formData();
    postId = String(formData.get('post_id') || '');
    content = String(formData.get('content') || '').trim();
  }

  if (!postId || !content) {
    return new Response(JSON.stringify({ error: 'Post ID dan isi komentar wajib diisi' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const newComment = await createComment(supabase, {
    author: user,
    postId,
    content,
  });

  if (!contentType.includes('application/json')) {
    return context.redirect(`/community/${postId}`);
  }

  return new Response(JSON.stringify({ success: true, comment: newComment }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Harap masuk terlebih dahulu' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let commentId = '';
  const url = new URL(context.request.url);
  commentId = url.searchParams.get('id') || url.searchParams.get('comment_id') || '';

  if (!commentId) {
    try {
      const contentType = context.request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await context.request.json();
        commentId = body.comment_id || body.id || '';
      }
    } catch {}
  }

  if (!commentId) {
    return new Response(JSON.stringify({ error: 'ID komentar diperlukan' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createSupabaseServerClient({
    request: context.request,
    cookies: context.cookies,
  });

  const result = await deleteComment(supabase, commentId, user);
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error || 'Gagal menghapus komentar' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Komentar berhasil dihapus', postId: result.postId }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

