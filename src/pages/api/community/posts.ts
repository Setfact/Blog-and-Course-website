import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';
import { createPost, deletePost } from '../../../lib/community';

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
  let imageUrl = '';

  if (contentType.includes('application/json')) {
    const body = await context.request.json();
    title = body.title?.trim() || '';
    content = body.content?.trim() || '';
    channelId = body.channel_id || 'networking';
    postType = body.post_type || 'discussion';
    imageUrl = body.image_url?.trim() || '';
  } else {
    const formData = await context.request.formData();
    title = String(formData.get('title') || '').trim();
    content = String(formData.get('content') || '').trim();
    channelId = String(formData.get('channel_id') || 'networking');
    postType = (String(formData.get('post_type') || 'discussion') as any) || 'discussion';
    imageUrl = String(formData.get('image_url') || '').trim();

    const file = formData.get('image_file');
    if (file && typeof file === 'object' && 'size' in file && file.size > 0) {
      const imageFile = file as File;

      // Batasi ukuran maksimal 3MB
      const maxBytes = 3 * 1024 * 1024;
      if (imageFile.size > maxBytes) {
        return new Response(JSON.stringify({ error: 'Ukuran file gambar maksimal 3MB' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Validasi tipe MIME
      const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
      if (!allowedMime.includes(imageFile.type)) {
        return new Response(
          JSON.stringify({ error: 'Format gambar harus JPG, PNG, WebP, GIF, atau SVG' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const ext = imageFile.name.split('.').pop() || 'png';
      const cleanName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = `posts/${user.id}/${cleanName}`;

      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      // Tingkat 1: Simpan ke sistem file lokal (public/uploads/community/) sebagai jaminan ketersediaan
      try {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'community');
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, cleanName), Buffer.from(buffer));
        imageUrl = `/uploads/community/${cleanName}`;
      } catch (fsErr) {
        console.warn('Peringatan: Gagal menyimpan gambar lokal:', fsErr);
      }

      // Tingkat 2: Unggah ke Supabase Storage (community-media)
      if (supabase) {
        try {
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('community-media')
            .upload(filePath, buffer, {
              contentType: imageFile.type,
              upsert: true,
            });

          if (!uploadError && uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from('community-media')
              .getPublicUrl(filePath);
            imageUrl = publicUrlData.publicUrl;
          } else {
            console.warn('Gagal upload ke Supabase Storage:', uploadError?.message);
          }
        } catch (err) {
          console.error('Error saat upload ke Supabase Storage:', err);
        }
      }

      // Tingkat 3: Fallback Data URL jika tingkat 1 dan 2 tidak menghasilkan URL
      if (!imageUrl) {
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        imageUrl = `data:${imageFile.type};base64,${base64}`;
      }
    }
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
    imageUrl,
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

export const DELETE: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Harap masuk terlebih dahulu' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let postId = '';
  const url = new URL(context.request.url);
  postId = url.searchParams.get('id') || url.searchParams.get('post_id') || '';

  if (!postId) {
    try {
      const contentType = context.request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await context.request.json();
        postId = body.post_id || body.id || '';
      } else if (
        contentType.includes('application/x-www-form-urlencoded') ||
        contentType.includes('multipart/form-data')
      ) {
        const formData = await context.request.formData();
        postId = String(formData.get('post_id') || formData.get('id') || '');
      }
    } catch {
      // Abaikan kegagalan parsing
    }
  }

  if (!postId) {
    return new Response(JSON.stringify({ error: 'ID postingan tidak ditemukan' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createSupabaseServerClient({
    request: context.request,
    cookies: context.cookies,
  });

  const result = await deletePost(supabase, postId, user);
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error || 'Gagal membatalkan postingan' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Postingan berhasil dibatalkan dan dihapus' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
