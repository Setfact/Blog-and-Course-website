import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';
import { createPost } from '../../../lib/community';

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
  let title = '';
  let content = '';
  let channelId = 'networking';
  let postType: 'discussion' | 'showcase' | 'milestone' = 'discussion';

  if (contentType.includes('application/json')) {
    const body = await context.request.json();
    title = body.title?.trim() || '';
    content = body.content?.trim() || '';
    channelId = body.channel_id || 'networking';
    postType = body.post_type || 'discussion';
  } else {
    const formData = await context.request.formData();
    title = String(formData.get('title') || '').trim();
    content = String(formData.get('content') || '').trim();
    channelId = String(formData.get('channel_id') || 'networking');
    postType = (String(formData.get('post_type') || 'discussion') as any) || 'discussion';
  }

  if (!title || !content) {
    return new Response(JSON.stringify({ error: 'Judul dan konten tidak boleh kosong' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const newPost = await createPost(supabase, {
    author: user,
    channelId,
    title,
    content,
    postType,
  });

  if (!contentType.includes('application/json')) {
    return context.redirect(`/community/${newPost.id}`);
  }

  return new Response(JSON.stringify({ success: true, post: newPost }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
