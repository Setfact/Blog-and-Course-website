import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';
import { createPost, deletePost } from '../../../lib/community';
import {
  readBody,
  textField,
  enumField,
  HttpError,
  json,
} from '../../../lib/security';
import { uploadForm, publishUpload } from '../../../lib/uploads';

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user) {
    return json({ error: 'Harap masuk terlebih dahulu.' }, 401);
  }

  const supabase = createSupabaseServerClient(context);
  if (!supabase) {
    throw new HttpError(503, 'Layanan basis data belum siap.');
  }

  const contentType = context.request.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let body: Record<string, any>;
  let imageFile: FormDataEntryValue | null = null;

  if (isJson) {
    body = await readBody(context.request);
  } else {
    const form = await uploadForm(context.request, 4 * 1024 * 1024);
    body = Object.fromEntries(form);
    imageFile = form.get('image_file') || form.get('image');
  }

  const title = textField(body.title, 'Judul', 200);
  const content = textField(body.content, 'Konten', 20000);
  const channelId = enumField(body.channel_id || 'networking', [
    'networking',
    'linux-sysadmin',
    'automation',
    'showcase',
    'tanya-jawab',
  ] as const);
  const postType = enumField(body.post_type || 'discussion', [
    'discussion',
    'showcase',
    'milestone',
  ] as const);

  let imageUrl = '';

  if (imageFile && imageFile instanceof File && imageFile.size > 0) {
    const uploadResult = await publishUpload(imageFile, 'community');
    imageUrl = uploadResult.url;
  } else if (body.image_url) {
    // Tolak URL eksternal sewenang-wenang untuk mencegah SSRF / scraper tracking
    const rawImg = String(body.image_url).trim();
    if (rawImg.startsWith('/uploads/community/') || rawImg.startsWith('https://phinisilearn.web.id/uploads/')) {
      imageUrl = rawImg;
    } else {
      throw new HttpError(400, 'Gunakan unggahan berkas gambar langsung, bukan tautan gambar eksternal.');
    }
  }

  const newPost = await createPost(supabase, {
    author: user,
    channelId,
    title,
    content,
    imageUrl,
    postType,
  });

  if (!isJson) {
    return context.redirect(`/community/${newPost.id}`);
  }

  return json({ success: true, post: newPost }, 201);
};

export const DELETE: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user) {
    return json({ error: 'Harap masuk terlebih dahulu.' }, 401);
  }

  const supabase = createSupabaseServerClient(context);
  const url = new URL(context.request.url);
  let postId = url.searchParams.get('id') || url.searchParams.get('post_id') || '';

  if (!postId) {
    const body = (await readBody(context.request).catch(() => ({}))) as Record<string, any>;
    postId = String(body.post_id || body.id || '');
  }

  if (!postId) {
    return json({ error: 'ID postingan wajib disertakan.' }, 400);
  }

  const cleanId = String(postId).trim();
  if (!/^[a-zA-Z0-9_-]{3,64}$/.test(cleanId)) {
    return json({ error: 'Format ID postingan tidak valid.' }, 400);
  }

  const result = await deletePost(supabase, cleanId, user);

  if (!result.success) {
    return json({ error: result.error || 'Gagal menghapus postingan.' }, 403);
  }

  return json({ success: true, message: 'Postingan berhasil dihapus.' }, 200);
};
