import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';
import { toggleCommentSolution } from '../../../lib/community';

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Harap masuk terlebih dahulu' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let postId = '';
  let commentId = '';

  try {
    const body = await context.request.json();
    postId = body.post_id || '';
    commentId = body.comment_id || '';
  } catch {}

  if (!postId || !commentId) {
    return new Response(JSON.stringify({ error: 'Post ID dan Comment ID wajib disertakan' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createSupabaseServerClient({
    request: context.request,
    cookies: context.cookies,
  });

  const result = await toggleCommentSolution(supabase, postId, commentId, user);
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error || 'Gagal memperbarui status solusi' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      isSolved: result.isSolved,
      solvedCommentId: result.solvedCommentId,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
