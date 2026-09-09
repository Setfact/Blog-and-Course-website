export const prerender = false;

import type { APIRoute } from 'astro';
import { open, realpath, mkdir } from 'node:fs/promises';
import { constants, existsSync } from 'node:fs';
import path from 'node:path';

export const GET: APIRoute = async ({ request }) => {
  const value = new URL(request.url).searchParams.get('url') || '';
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
  };

  if (!value || value.length > 2048) {
    return new Response('Tautan berkas tidak valid.', { status: 400, headers });
  }

  // 1. Berkas lab lokal: hanya terima pola nama berkas resmi di dalam direktori /labs/
  const localMatch = /^(?:\/public)?\/labs\/([a-zA-Z0-9_-][a-zA-Z0-9_. -]{0,180}\.(?:pkt|pka|pdf))$/i.exec(value);
  if (localMatch) {
    const fileName = localMatch[1];
    let fileHandle;

    try {
      const labsDir = path.join(process.cwd(), 'public', 'labs');
      if (!existsSync(labsDir)) {
        await mkdir(labsDir, { recursive: true });
      }

      const root = await realpath(labsDir);
      const target = path.join(root, fileName);

      if (!existsSync(target)) {
        return new Response('Berkas lab tidak ditemukan.', { status: 404, headers });
      }

      const canonicalTarget = await realpath(target);
      if (canonicalTarget !== target || !canonicalTarget.startsWith(root)) {
        return new Response('Akses berkas tidak diizinkan.', { status: 403, headers });
      }

      fileHandle = await open(canonicalTarget, constants.O_RDONLY | constants.O_NOFOLLOW);
      const stat = await fileHandle.stat();

      if (!stat.isFile() || stat.size > 50 * 1024 * 1024) {
        return new Response('Ukuran berkas melebihi batas atau berkas tidak valid.', { status: 404, headers });
      }

      const buffer = await fileHandle.readFile();
      const isPdf = fileName.toLowerCase().endsWith('.pdf');

      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          ...headers,
          'Content-Type': isPdf ? 'application/pdf' : 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': String(buffer.byteLength),
        },
      });
    } catch (err) {
      console.error('Error saat membaca berkas lab lokal:', err);
      return new Response('Berkas lab tidak tersedia.', { status: 404, headers });
    } finally {
      await fileHandle?.close();
    }
  }

  // 2. Berkas Google Drive: hanya izinkan domain resmi Google Drive
  try {
    const parsed = new URL(value);
    if (
      parsed.protocol !== 'https:' ||
      parsed.username ||
      parsed.password ||
      parsed.port ||
      !['drive.google.com', 'drive.usercontent.google.com'].includes(parsed.hostname)
    ) {
      throw new Error('Host tidak diizinkan');
    }

    const pathMatch = /^\/file\/d\/([\w-]{10,200})(?:\/(?:view|edit|preview))?\/?$/.exec(parsed.pathname);
    const id =
      pathMatch?.[1] ||
      (['/open', '/uc', '/download'].includes(parsed.pathname) ? parsed.searchParams.get('id') : null);

    if (!id || !/^[\w-]{10,200}$/.test(id)) {
      throw new Error('Format Google Drive ID tidak valid');
    }

    const directDownloadUrl = `https://drive.usercontent.google.com/download?export=download&id=${id}`;
    return new Response(null, {
      status: 302,
      headers: {
        ...headers,
        Location: directDownloadUrl,
      },
    });
  } catch {
    return new Response('Tautan unduhan tidak diizinkan atau tidak aman.', { status: 400, headers });
  }
};
