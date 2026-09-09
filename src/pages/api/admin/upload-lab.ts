export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Akses ditolak: hanya administrator yang diizinkan mengunggah berkas lab.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();
    const labFile = (formData.get('file') || formData.get('lab')) as File | null;

    if (!labFile || !(labFile instanceof File) || labFile.size === 0) {
      return new Response(JSON.stringify({ error: 'Tidak ada berkas lab yang dipilih.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ekstensi yang diizinkan
    const originalExt = path.extname(labFile.name).toLowerCase();
    const validExtensions = ['.pkt', '.pka', '.pdf'];

    if (!validExtensions.includes(originalExt)) {
      return new Response(JSON.stringify({ error: 'Format berkas tidak didukung. Harap unggah berkas berekstensi .pkt, .pka, atau .pdf.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Batas maksimal 50 MB
    const maxSize = 50 * 1024 * 1024;
    if (labFile.size > maxSize) {
      return new Response(JSON.stringify({ error: 'Ukuran berkas melebihi batas maksimal 50 MB.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const timestamp = Date.now();
    const rawBaseName = path.basename(labFile.name, originalExt).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const cleanFileName = `${rawBaseName}-${timestamp}${originalExt}`;

    const arrayBuffer = await labFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Simpan ke direktori public/labs
    const targetDir = path.join(process.cwd(), 'public', 'labs');
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(path.join(targetDir, cleanFileName), buffer);

    // Salin juga ke dist/client/labs untuk ketersediaan instan di server standalone
    try {
      const distTargetDir = path.join(process.cwd(), 'dist', 'client', 'labs');
      await fs.mkdir(distTargetDir, { recursive: true });
      await fs.writeFile(path.join(distTargetDir, cleanFileName), buffer);
    } catch {}

    const publicUrl = `/labs/${cleanFileName}`;
    const detectedType = originalExt === '.pdf' ? 'pdf' : 'pkt';

    // Format ukuran berkas ramah manusia
    const sizeInKb = labFile.size / 1024;
    const fileSizeFormatted = sizeInKb >= 1024
      ? `${(sizeInKb / 1024).toFixed(1)} MB`
      : `${Math.round(sizeInKb)} KB`;

    return new Response(JSON.stringify({
      success: true,
      url: publicUrl,
      fileName: cleanFileName,
      originalName: labFile.name,
      fileType: detectedType,
      fileSize: fileSizeFormatted,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Gagal mengunggah berkas lab:', err);
    return new Response(JSON.stringify({ error: err.message || 'Terjadi kesalahan sistem saat menyimpan berkas lab.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
