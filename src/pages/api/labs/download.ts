export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { extractDriveFileId } from '../../../lib/drive';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const rawUrl = url.searchParams.get('url') || '';
  const inputFileName = url.searchParams.get('filename') || 'lab-praktik.pkt';

  if (!rawUrl) {
    return new Response('Tautan berkas lab tidak ditemukan.', { status: 400 });
  }

  // Sanitasi nama berkas agar selalu memiliki ekstensi yang tepat
  let safeFileName = inputFileName.trim();
  const lowerName = safeFileName.toLowerCase();
  if (!lowerName.endsWith('.pkt') && !lowerName.endsWith('.pka') && !lowerName.endsWith('.pdf')) {
    safeFileName += '.pkt';
  }

  const cleanUrl = rawUrl.trim();

  // 1. Cek apakah berkas tersimpan di direktori lokal public/
  const relativePath = cleanUrl.replace(/^\/?public\/?/, '/').replace(/^\//, '');
  const localDiskPath = path.join(process.cwd(), 'public', relativePath);

  if (existsSync(localDiskPath)) {
    try {
      const buffer = await fs.readFile(localDiskPath);
      const isPdf = safeFileName.toLowerCase().endsWith('.pdf');
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': isPdf ? 'application/pdf' : 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${safeFileName}"`,
          'Content-Length': String(buffer.byteLength),
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch (readErr) {
      console.error('Gagal membaca berkas lokal lab:', readErr);
    }
  }

  // 2. Jika tautan eksternal atau Google Drive
  const fileId = extractDriveFileId(cleanUrl);
  if (fileId) {
    const directUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
    return new Response(null, {
      status: 302,
      headers: {
        Location: directUrl,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
      },
    });
  }

  // 3. Fallback untuk URL direct HTTP lainnya
  return new Response(null, {
    status: 302,
    headers: {
      Location: cleanUrl,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Content-Disposition': `attachment; filename="${safeFileName}"`,
    },
  });
};
