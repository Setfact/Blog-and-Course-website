import { randomUUID } from 'node:crypto';
import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient, getOrCreateUserProfile } from './lib/supabase';
import {
  HttpError,
  assertSameOrigin,
  json,
  routeMatches,
  validBasicAuth,
} from './lib/security';
import { limit } from './lib/auth-security';

export const onRequest = defineMiddleware(async (context, next) => {
  const requestId = randomUUID();
  context.locals.user = null;
  const url = new URL(context.request.url);
  const path = decodeURIComponent(url.pathname).replace(/\/{2,}/g, '/');
  const isApi = path.startsWith('/api/');

  // Pengalihan otomatis seluruh rute /en ke versi Bahasa Indonesia
  if (path === '/en' || path.startsWith('/en/')) {
    const cleanPath = path.replace(/^\/en(\/|$)/, '/') || '/';
    return context.redirect(cleanPath + url.search, 301);
  }

  let response: Response;

  try {
    const isCms = routeMatches(path, '/keystatic') || routeMatches(path, '/api/keystatic');

    if (!context.isPrerendered) {
      // 1. Proteksi CSRF & Origin untuk request mutatif
      assertSameOrigin(context.request);

      const ip =
        context.request.headers.get('cf-connecting-ip') ||
        context.clientAddress ||
        '127.0.0.1';

      // 2. Rate Limiting pada endpoint autentikasi
      if (routeMatches(path, '/api/auth') && path !== '/api/auth/status') {
        const isRegister = path === '/api/auth/register';
        const isResend = path === '/api/auth/resend';
        const routeLimit = isRegister ? 3 : isResend ? 5 : 30;
        const windowSec = isRegister || isResend ? 3600 : 900;
        const limitType = isRegister ? 'register' : isResend ? 'resend' : 'login';

        await limit(`auth:${limitType}:${ip}`, routeLimit, windowSec);
      }

      // 3. Verifikasi sesi pengguna
      const skipSessionCheck = path === '/api/auth/signout' || path === '/api/auth/callback';
      const supabase = skipSessionCheck ? null : createSupabaseServerClient(context);

      if (supabase) {
        const {
          data: { user: authUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (!userError && authUser) {
          if (!authUser.email_confirmed_at) {
            // Sesi ditolak jika email belum diverifikasi
            context.locals.user = null;
          } else {
            const profile = await getOrCreateUserProfile(supabase, authUser);
            if (profile && profile.status === 'active') {
              context.locals.user = profile;
            } else {
              context.locals.user = null;
            }
          }
        }
      }

      // 4. Rate Limiting pada mutasi API umum
      if (isApi && !['GET', 'HEAD', 'OPTIONS'].includes(context.request.method)) {
        const actorKey = context.locals.user?.id || ip;
        await limit(`write:${actorKey}`, 60, 60);
      }
    }

    const user = context.locals.user;
    const isLocalDev =
      import.meta.env?.DEV &&
      (url.hostname === '127.0.0.1' || url.hostname === 'localhost');

    // 5. Pemeriksaan otorisasi Keystatic CMS
    if (isCms) {
      if (isLocalDev) {
        // Akses langsung pada local development
      } else if (user && user.role === 'admin') {
        // Admin aktif melalui sesi
      } else {
        // Cek Basic Auth resmi dari variabel lingkungan
        const authHeader = context.request.headers.get('authorization');
        const adminUser = process.env.ADMIN_USERNAME;
        const adminPass = process.env.ADMIN_PASSWORD;

        if (adminUser && adminPass && validBasicAuth(authHeader, adminUser, adminPass)) {
          // Kredensial valid
        } else {
          if (isApi || path.startsWith('/api/keystatic')) {
            return json({ error: 'Akses ditolak: login administrator diperlukan' }, 401);
          }
          return context.redirect(`/login?redirect=${encodeURIComponent(path)}`);
        }
      }
    }

    // 6. Proteksi Rute Panel Administrator
    const isAdminRoute = routeMatches(path, '/admin') || routeMatches(path, '/api/admin');
    if (isAdminRoute) {
      if (!user) {
        return isApi
          ? json({ error: 'Harap masuk terlebih dahulu' }, 401)
          : context.redirect(`/login?redirect=${encodeURIComponent(path)}`);
      }
      if (user.role !== 'admin') {
        return isApi
          ? json({ error: 'Akses ditolak: hanya administrator yang diizinkan' }, 403)
          : context.redirect('/dashboard?error=unauthorized_admin');
      }
    }

    // 7. Proteksi Rute Siswa & Komunitas
    const isUserRoute =
      ['/dashboard', '/community', '/api/user', '/api/community'].some((prefix) =>
        routeMatches(path, prefix)
      );

    if (isUserRoute && !user) {
      return isApi
        ? json({ error: 'Harap masuk terlebih dahulu' }, 401)
        : context.redirect(`/login?redirect=${encodeURIComponent(path)}`);
    }

    response = await next();
  } catch (err: any) {
    const status = err instanceof HttpError ? err.status : 500;
    const message =
      err instanceof HttpError
        ? err.message
        : 'Terjadi kesalahan sistem internal. Silakan coba kembali.';

    console.error(
      JSON.stringify({
        event: 'request_error',
        requestId,
        path,
        status,
        message: err?.message,
      })
    );

    response = json({ error: message, requestId }, status);
  }

  // 8. Terapkan HTTP Security Headers pada seluruh respons
  const headers = new Headers(response.headers);

  if (!context.isPrerendered) {
    headers.set('Cache-Control', 'private, no-store');
  }

  headers.set('X-Request-ID', requestId);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set(
    'Content-Security-Policy',
    "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'"
  );

  if (url.protocol === 'https:' || context.request.headers.get('x-forwarded-proto') === 'https') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  if (response.status === 429) {
    headers.set('Retry-After', '900');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
