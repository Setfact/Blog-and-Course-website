export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createSupabaseServerClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const user = locals.user;
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Akses ditolak: hanya administrator yang diizinkan mengunggah gambar materi.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile || !(imageFile instanceof File) || imageFile.size === 0) {
      return new Response(JSON.stringify({ error: 'Tidak ada berkas gambar yang diunggah.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validasi tipe berkas
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!validMimes.includes(imageFile.type)) {
      return new Response(JSON.stringify({ error: 'Format berkas tidak didukung. Gunakan PNG, JPG, WEBP, atau SVG.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Maksimal 5 MB
    const maxSize = 5 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return new Response(JSON.stringify({ error: 'Ukuran berkas gambar maksimal 5 MB.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const timestamp = Date.now();
    const originalExt = path.extname(imageFile.name) || '.png';
    const rawBaseName = path.basename(imageFile.name, originalExt).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const cleanName = `${rawBaseName}-${timestamp}${originalExt}`;

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    let imageUrl = '';

    // Simpan ke direktori lokal public/uploads/courses/
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'courses');
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, cleanName), Buffer.from(buffer));
      imageUrl = `/uploads/courses/${cleanName}`;
    } catch (fsErr) {
      console.warn('Peringatan penyimpanan gambar lokal:', fsErr);
    }

    // Opsi simpan ke Supabase Storage jika terkonfigurasi
    const supabase = createSupabaseServerClient({ request, cookies });
    if (supabase) {
      try {
        const filePath = `courses/${cleanName}`;
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
        }
      } catch (err) {
        console.error('Error saat upload gambar ke storage:', err);
      }
    }

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'Gagal menyimpan berkas gambar ke penyimpanan server.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      url: imageUrl,
      fileName: cleanName,
      alt: rawBaseName.replace(/-/g, ' '),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Upload gambar error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Terjadi kesalahan saat mengunggah gambar.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
