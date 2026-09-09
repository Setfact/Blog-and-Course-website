import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, writeFile, unlink, rmdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { HttpError } from './security';

const exec = promisify(execFile);
const hasClamdscan = existsSync('/usr/bin/clamdscan');
let activeScans = 0;

export async function scanBuffer(buffer: Buffer): Promise<void> {
  if (!hasClamdscan) {
    // Pada lingkungan development tanpa ClamAV terpasang
    return;
  }

  if (activeScans >= 4) {
    throw new HttpError(503, 'Pemindai keamanan sedang sibuk. Silakan coba kembali.');
  }

  activeScans++;
  let scanDir: string | undefined;

  try {
    scanDir = await mkdtemp(path.join(tmpdir(), 'phinisi-scan-'));
    const scanTarget = path.join(scanDir, 'upload.tmp');
    await writeFile(scanTarget, buffer, { flag: 'wx', mode: 0o600 });

    try {
      await exec('/usr/bin/clamdscan', ['--fdpass', '--no-summary', scanTarget], {
        timeout: 30000,
        maxBuffer: 4096,
      });
    } catch (error: any) {
      if (error?.code === 1) {
        throw new HttpError(422, 'Berkas ditolak oleh pemeriksaan keamanan.');
      }
      console.warn('Peringatan pemindai ClamAV:', error?.message);
      if (process.env.NODE_ENV === 'production') {
        throw new HttpError(503, 'Pemeriksaan keamanan belum tersedia. Unggahan dibatalkan.');
      }
    } finally {
      await unlink(scanTarget).catch(() => {});
    }
  } finally {
    if (scanDir) {
      await rmdir(scanDir).catch(() => {});
    }
    activeScans--;
  }
}

export async function uploadForm(request: Request, maxBytes: number): Promise<FormData> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.startsWith('multipart/form-data')) {
    throw new HttpError(415, 'Format permintaan harus berupa form unggahan multipart.');
  }

  const declaredLength = Number(request.headers.get('content-length'));
  if (declaredLength > maxBytes) {
    throw new HttpError(413, 'Ukuran unggahan melebihi batas maksimal.');
  }

  const reader = request.body?.getReader();
  if (!reader) {
    throw new HttpError(400, 'Isi formulir unggahan kosong.');
  }

  let totalSize = 0;
  const chunks: Uint8Array[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalSize += value.length;
      if (totalSize > maxBytes) {
        void reader.cancel();
        throw new HttpError(413, 'Ukuran unggahan melebihi batas maksimal.');
      }
      chunks.push(value);
    }

    const rawBuffer = Buffer.concat(chunks);
    const form = await new Response(rawBuffer, {
      headers: { 'Content-Type': contentType },
    }).formData();

    for (const key of form.keys()) {
      if (form.getAll(key).length !== 1) {
        throw new HttpError(400, 'Field duplikat tidak diizinkan.');
      }
    }

    return form;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'Format formulir unggahan tidak valid.');
  } finally {
    reader.releaseLock();
  }
}

export interface PublishUploadResult {
  url: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: string;
}

export async function publishUpload(
  file: FormDataEntryValue | null,
  kind: 'community' | 'courses' | 'labs' | 'avatars'
): Promise<PublishUploadResult> {
  const maxBytes = (kind === 'labs' ? 50 : kind === 'courses' ? 5 : 4) * 1024 * 1024;

  if (!(file instanceof File) || !file.size) {
    throw new HttpError(400, 'Pilih berkas yang valid untuk diunggah.');
  }

  if (file.size > maxBytes) {
    throw new HttpError(413, `Ukuran berkas melebihi batas maksimal (${kind === 'labs' ? '50 MB' : '5 MB'}).`);
  }

  let buffer = Buffer.from(await file.arrayBuffer());
  let extension = path.extname(file.name).toLowerCase();

  if (kind === 'labs') {
    if (!['.pdf', '.pkt', '.pka'].includes(extension)) {
      throw new HttpError(400, 'Hanya berkas berekstensi .pkt, .pka, atau .pdf yang diizinkan.');
    }
    if (extension === '.pdf' && buffer.subarray(0, 5).toString() !== '%PDF-') {
      throw new HttpError(400, 'Berkas PDF tidak valid.');
    }
    if (extension !== '.pdf' && /^(?:MZ|\x7fELF|#!|\s*<)/.test(buffer.subarray(0, 256).toString())) {
      throw new HttpError(400, 'Isi berkas lab terdeteksi berbahaya atau tidak valid.');
    }
  } else {
    // Validasi gambar murni (Tolak SVG karena risiko SVG XSS)
    const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedImageMimes.includes(file.type)) {
      throw new HttpError(400, 'Gunakan format gambar JPG, PNG, WebP, atau GIF. Berkas SVG tidak diizinkan.');
    }
  }

  // Pindai virus / malware sebelum disimpan
  await scanBuffer(buffer);

  // Transcoding gambar menjadi WebP bersih tanpa metadata EXIF
  if (kind !== 'labs') {
    try {
      const decoded = sharp(buffer, { limitInputPixels: 16000000, failOn: 'warning' });
      const meta = await decoded.metadata();
      if (!['jpeg', 'png', 'webp', 'gif'].includes(meta.format || '')) {
        throw new Error('Unsupported format');
      }
      buffer = Buffer.from(await decoded.rotate().webp({ quality: 85 }).toBuffer());
      extension = '.webp';
    } catch {
      throw new HttpError(400, 'Gambar tidak valid atau resolusi melebihi batas yang diizinkan.');
    }
  }

  const name = `${randomUUID()}${extension}`;
  const relative = kind === 'labs' ? 'labs' : `uploads/${kind}`;

  // Simpan ke direktori public dan dist/client jika direktori build ada
  const targetRoots = ['public'];
  if (existsSync(path.join(process.cwd(), 'dist', 'client'))) {
    targetRoots.push('dist/client');
  }

  for (const root of targetRoots) {
    const targetDir = path.join(process.cwd(), root, relative);
    await mkdir(targetDir, { recursive: true });
    await writeFile(path.join(targetDir, name), buffer, { flag: 'wx', mode: 0o644 });
  }

  const formattedSize =
    file.size >= 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

  return {
    url: `/${relative}/${name}`,
    fileName: name,
    originalName: file.name,
    fileType: extension === '.pdf' ? 'pdf' : extension === '.pkt' ? 'pkt' : 'image',
    fileSize: formattedSize,
  };
}
