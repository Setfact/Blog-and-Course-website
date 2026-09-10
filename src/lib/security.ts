import { createHash, timingSafeEqual } from 'node:crypto';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
    },
  });

export const safeRedirect = (value: unknown, fallback = '/dashboard'): string => {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }
  let decoded = value;
  try {
    for (let i = 0; i < 5; i++) {
      if (/[\\\u0000-\u0020\u007f]/.test(decoded) || decoded.startsWith('//')) return fallback;
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
    if (/%|\\|[\u0000-\u0020\u007f]/.test(decoded) || decoded.startsWith('//')) return fallback;
    const parsed = new URL(value, 'https://local.invalid');
    if (parsed.origin !== 'https://local.invalid') return fallback;
    if (/^\/(?:login|api\/auth)(?:\/|$)/.test(parsed.pathname)) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
};

export const sanitizeRedirectPath = safeRedirect;

export const routeMatches = (pathname: string, prefix: string): boolean =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export const getTrustedOrigins = (request?: Request): Set<string> => {
  const trusted = new Set<string>();

  // Domain resmi produksi
  trusted.add('https://phinisilearn.web.id');
  trusted.add('https://www.phinisilearn.web.id');
  trusted.add('http://phinisilearn.web.id');
  trusted.add('http://www.phinisilearn.web.id');

  // Asal autentikasi Google Identity Services & OAuth
  trusted.add('https://accounts.google.com');

  // Lingkungan pengembangan lokal
  trusted.add('http://localhost:3000');
  trusted.add('http://localhost:4321');
  trusted.add('http://127.0.0.1:3000');
  trusted.add('http://127.0.0.1:4321');

  const envUrl = process.env.PUBLIC_SITE_URL || (import.meta as any).env?.PUBLIC_SITE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http')) {
    try {
      trusted.add(new URL(envUrl).origin);
    } catch {}
  }

  if (request) {
    try {
      const reqOrigin = new URL(request.url).origin;
      if (reqOrigin && reqOrigin !== 'null') {
        trusted.add(reqOrigin);
      }
    } catch {}

    const forwardedHost = request.headers.get('x-forwarded-host');
    const rawHost = request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'https';

    for (const hostHeader of [forwardedHost, rawHost]) {
      if (hostHeader) {
        const cleanHost = hostHeader.split(',')[0].trim();
        trusted.add(`${proto}://${cleanHost}`);
        trusted.add(`https://${cleanHost}`);
        trusted.add(`http://${cleanHost}`);
      }
    }
  }

  return trusted;
};

export const assertSameOrigin = (request: Request): void => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;

  const trustedOrigins = getTrustedOrigins(request);
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const site = request.headers.get('sec-fetch-site');

  // 1. Jika header Origin tersedia, verifikasi terhadap daftar asal tepercaya
  if (origin) {
    if (trustedOrigins.has(origin)) {
      return;
    }
    try {
      const parsedOrigin = new URL(origin).origin;
      if (trustedOrigins.has(parsedOrigin)) {
        return;
      }
    } catch {}
    throw new HttpError(403, 'Asal permintaan tidak diizinkan');
  }

  // 2. Jika Origin tidak disertakan, verifikasi asal melalui Referer
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (trustedOrigins.has(refererOrigin)) {
        return;
      }
    } catch {}
    throw new HttpError(403, 'Asal permintaan tidak diizinkan');
  }

  // 3. Jika Origin dan Referer keduanya tidak ada, cegah mutasi lintas-situs terlarang
  if (site && site === 'cross-site') {
    throw new HttpError(403, 'Asal permintaan tidak diizinkan');
  }
};

export const validBasicAuth = (header: string | null, username?: string, password?: string): boolean => {
  if (!header || !username || !password || header.length > 2048) return false;
  const expected = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  const digest = (value: string) => createHash('sha256').update(value).digest();
  try {
    return timingSafeEqual(digest(header), digest(expected));
  } catch {
    return false;
  }
};

export const readBody = async (request: Request, maxBytes = 64 * 1024): Promise<Record<string, unknown>> => {
  const contentType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (!['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'].includes(contentType || '')) {
    throw new HttpError(415, 'Format permintaan tidak didukung');
  }
  const contentLength = Number(request.headers.get('content-length'));
  if (contentLength > maxBytes) {
    throw new HttpError(413, 'Permintaan terlalu besar');
  }
  const reader = request.body?.getReader();
  if (!reader) {
    throw new HttpError(400, 'Isi permintaan wajib disertakan');
  }
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > maxBytes) {
        void reader.cancel();
        throw new HttpError(413, 'Permintaan terlalu besar');
      }
      chunks.push(value);
    }
    const body = Buffer.concat(chunks);
    if (contentType === 'application/json') {
      const parsed = JSON.parse(body.toString('utf8'));
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        throw new Error('Invalid JSON structure');
      }
      return parsed;
    }
    const form = await new Response(body, {
      headers: { 'Content-Type': request.headers.get('content-type')! },
    }).formData();
    const result: Record<string, unknown> = Object.create(null);
    for (const [key, val] of form) {
      if (typeof val !== 'string' || Object.hasOwn(result, key)) {
        throw new HttpError(400, 'Field duplikat atau berkas tidak didukung');
      }
      result[key] = val;
    }
    return result;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'Isi permintaan tidak valid');
  } finally {
    reader.releaseLock();
  }
};

export const textField = (value: unknown, name: string, max: number): string => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max || value.includes('\u0000')) {
    throw new HttpError(400, `${name} wajib berupa teks sepanjang 1–${max} karakter`);
  }
  return value.trim();
};

export const uuidField = (value: unknown): string => {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new HttpError(400, 'ID tidak valid');
  }
  return value;
};

export const enumField = <T extends string>(value: unknown, choices: readonly T[]): T => {
  if (typeof value !== 'string' || !choices.includes(value as T)) {
    throw new HttpError(400, 'Pilihan tidak valid');
  }
  return value as T;
};

export const databaseError = (error: { code?: string; message?: string } | null): never => {
  if (!error) throw new HttpError(500, 'Terjadi kesalahan sistem');
  if (error.code === '42501') throw new HttpError(403, 'Operasi tidak diizinkan');
  if (error.code === '23503' || error.code === 'P0002') throw new HttpError(404, 'Data tidak ditemukan');
  if (error.code === '23505' || error.code === '23514') throw new HttpError(409, 'Data bertentangan dengan kondisi saat ini');
  if (error.code === '22023') throw new HttpError(400, 'Parameter tidak valid');
  throw new HttpError(503, 'Layanan data sedang tidak tersedia');
};

export class RateLimiter {
  private entries = new Map<string, { count: number; until: number }>();
  constructor(private maxEntries = 10_000) {}

  allow(key: string, limit: number, windowMs = 60_000, now = Date.now()): boolean {
    const entry = this.entries.get(key);
    if (entry && entry.until > now) {
      return ++entry.count <= limit;
    }
    if (this.entries.size >= this.maxEntries) {
      for (const [id, item] of this.entries) {
        if (item.until <= now) this.entries.delete(id);
      }
      if (this.entries.size >= this.maxEntries && !entry) {
        return false;
      }
    }
    this.entries.set(key, { count: 1, until: now + windowMs });
    return true;
  }
}

export function searchPattern(value: string): string {
  const term = value.slice(0, 120).replace(/[%_*]/g, '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"%${term}%"`;
}

export function csvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

export function getPublicOrigin(request?: Request): string {
  const envUrl = process.env.PUBLIC_SITE_URL || import.meta.env?.PUBLIC_SITE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http')) {
    return envUrl.replace(/\/$/, '');
  }
  if (import.meta.env?.DEV && request) {
    try {
      return new URL(request.url).origin;
    } catch {
      return 'http://localhost:4321';
    }
  }
  return 'https://phinisilearn.web.id';
}
