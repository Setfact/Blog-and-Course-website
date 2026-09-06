import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';
import { toggleUpvote } from '../../../lib/community';

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

  if (contentType.includes('application/json')) {
    const body = await context.request.json();
    postId = body.post_id || '';
  } else {
    const formData = await context.request.formData();
    postId = String(formData.get('post_id') || '');
  }

  if (!postId) {
    return new Response(JSON.stringify({ error: 'Post ID wajib disertakan' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await toggleUpvote(supabase, {
    userId: user.id,
    postId,
  });

  return new Response(JSON.stringify({ success: true, ...result }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
