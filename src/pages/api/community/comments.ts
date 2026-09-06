import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';
import { createComment } from '../../../lib/community';

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
