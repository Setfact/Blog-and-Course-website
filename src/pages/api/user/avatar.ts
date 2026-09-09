export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createSupabaseServerClient } from '../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient({
    request: context.request,
    cookies: context.cookies,
  });

  let userId = context.locals.user?.id;

  if (!userId && supabase) {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        userId = authUser.id;
      }
    } catch {}
  }

  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Harap masuk terlebih dahulu untuk memperbarui foto profil.' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const formData = await context.request.formData();
    const imageFile = (formData.get('image') ||
      formData.get('file') ||
      formData.get('avatar')) as File | null;

    if (!imageFile || !(imageFile instanceof File) || imageFile.size === 0) {
      return new Response(
        JSON.stringify({ error: 'Tidak ada berkas gambar yang dipilih.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validasi tipe berkas gambar
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimes.includes(imageFile.type)) {
      return new Response(
        JSON.stringify({ error: 'Format berkas tidak didukung. Gunakan format JPG, PNG, atau WebP.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Batas ukuran maksimal 3 MB
    const maxBytes = 3 * 1024 * 1024;
    if (imageFile.size > maxBytes) {
      return new Response(
        JSON.stringify({ error: 'Ukuran berkas gambar maksimal 3 MB.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const timestamp = Date.now();
    let ext = path.extname(imageFile.name).toLowerCase();
    if (!ext || ext === '.') {
      ext = imageFile.type === 'image/webp' ? '.webp' : imageFile.type === 'image/jpeg' ? '.jpg' : '.png';
    }

    const cleanName = `avatar-${userId}-${timestamp}${ext}`;
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let avatarUrl = '';

    // Tingkat 1: Simpan ke sistem file lokal public/uploads/avatars/
    try {
      const publicUploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
      await fs.mkdir(publicUploadDir, { recursive: true });
      await fs.writeFile(path.join(publicUploadDir, cleanName), buffer);
      avatarUrl = `/uploads/avatars/${cleanName}`;

      // Salin ke dist/client/uploads/avatars/ untuk mode server standalone
      try {
        const distUploadDir = path.join(process.cwd(), 'dist', 'client', 'uploads', 'avatars');
        await fs.mkdir(distUploadDir, { recursive: true });
        await fs.writeFile(path.join(distUploadDir, cleanName), buffer);
      } catch {}
    } catch (fsErr) {
      console.warn('Peringatan penyimpanan gambar lokal:', fsErr);
    }

    // Tingkat 2: Unggah ke Supabase Storage (bucket: community-media)
    if (supabase) {
      try {
        const storagePath = `avatars/${userId}/${cleanName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('community-media')
          .upload(storagePath, buffer, {
            contentType: imageFile.type,
            upsert: true,
          });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('community-media')
            .getPublicUrl(storagePath);

          if (publicUrlData && publicUrlData.publicUrl) {
            avatarUrl = publicUrlData.publicUrl;
          }
        } else if (uploadError) {
          console.warn('Gagal unggah ke Supabase Storage, menggunakan jalur berkas lokal:', uploadError.message);
        }
      } catch (storageErr) {
        console.warn('Pengecualian Supabase Storage:', storageErr);
      }
    }

    if (!avatarUrl) {
      return new Response(
        JSON.stringify({ error: 'Gagal menyimpan berkas gambar ke penyimpanan server.' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Tingkat 3: Perbarui basis data profiles
    if (supabase) {
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (dbError) {
        console.error('Gagal memperbarui avatar_url di tabel profiles:', dbError);
        return new Response(
          JSON.stringify({ error: 'Gagal memperbarui data foto profil di basis data.' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        avatar_url: avatarUrl,
        message: 'Foto profil berhasil diperbarui.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Avatar upload exception:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Terjadi kesalahan saat memproses foto profil.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const DELETE: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient({
    request: context.request,
    cookies: context.cookies,
  });

  let userId = context.locals.user?.id;

  if (!userId && supabase) {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        userId = authUser.id;
      }
    } catch {}
  }

  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Harap masuk terlebih dahulu.' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    if (supabase) {
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          avatar_url: '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (dbError) {
        console.error('Gagal menghapus avatar_url di tabel profiles:', dbError);
        return new Response(
          JSON.stringify({ error: 'Gagal menghapus data foto profil di basis data.' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        avatar_url: '',
        message: 'Foto profil berhasil dihapus dan dikembalikan ke inisial nama.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Avatar delete exception:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Terjadi kesalahan saat menghapus foto profil.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
