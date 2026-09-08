import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient, getOrCreateUserProfile } from './lib/supabase';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  // Pengalihan otomatis seluruh rute /en ke versi Bahasa Indonesia
  if (url.pathname === '/en' || url.pathname.startsWith('/en/')) {
    const cleanPath = url.pathname.replace(/^\/en(\/|$)/, '/') || '/';
    return context.redirect(cleanPath + url.search, 301);
  }

  // Inisialisasi locals user
  context.locals.user = null;

  // Coba ambil session pengguna dari cookie Supabase jika terkonfigurasi
  const supabase = createSupabaseServerClient({
    request: context.request,
    cookies: context.cookies,
  });

  if (supabase) {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        context.locals.user = await getOrCreateUserProfile(supabase, authUser);
        if (context.locals.user?.status === 'suspended' && url.pathname !== '/api/auth/signout') {
          return new Response('Akun Anda sedang ditangguhkan.', { status: 403 });
        }
      }
    } catch (err) {
      console.error('Middleware auth check error:', err);
    }
  }

  // Proteksi Keystatic CMS & API: Khusus Administrator
  if (url.pathname.startsWith('/keystatic') || url.pathname.startsWith('/api/keystatic')) {
    const isLocalDevelopment = import.meta.env.DEV && (url.hostname === '127.0.0.1' || url.hostname === 'localhost');
    if (isLocalDevelopment) {
      return next();
    }

    // 1. Izinkan jika user sudah login dan memiliki role admin
    if (context.locals.user && context.locals.user.role === 'admin') {
      return next();
    }

    // 2. Fallback Basic Auth untuk keperluan otomasi / script deploy
    const authHeader = context.request.headers.get('authorization');
    const adminUser = process.env.ADMIN_USERNAME || 'calvinadministrator';
    const adminPass = process.env.ADMIN_PASSWORD || 'calvin126@ganteng';

    if (authHeader) {
      const allowedCredentials = [
        `Basic ${Buffer.from(`${adminUser}:${adminPass}`).toString('base64')}`,
        `Basic ${Buffer.from('calvinadministrator:calvin126@ganteng').toString('base64')}`,
        `Basic ${Buffer.from('calvin:Calvindea82@').toString('base64')}`,
      ];
      if (allowedCredentials.includes(authHeader)) {
        return next();
      }
    }

    // 3. Jika belum login sama sekali -> arahkan ke halaman login
    if (!context.locals.user) {
      if (url.pathname.startsWith('/api/keystatic')) {
        return new Response(JSON.stringify({ error: 'Akses ditolak: login administrator diperlukan' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return context.redirect(`/login?redirect=${encodeURIComponent(url.pathname)}`);
    }

    // 4. Jika sudah login tetapi perannya bukan admin (misalnya siswa biasa) -> tolak akses
    if (url.pathname.startsWith('/api/keystatic')) {
      return new Response(JSON.stringify({ error: 'Akses terlarang: hanya administrator yang diizinkan' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect('/dashboard?error=unauthorized_keystatic');
  }

  // Proteksi Rute Komunitas (Wajib Login sesuai arahan)
  if (url.pathname.startsWith('/community') && !context.locals.user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(url.pathname)}`);
  }

  // Proteksi Rute Dashboard Siswa (Wajib Login)
  if (url.pathname.startsWith('/dashboard') && !context.locals.user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(url.pathname)}`);
  }

  // Proteksi Rute Administrator (Wajib Login dan Role Admin)
  if (url.pathname.startsWith('/admin')) {
    if (!context.locals.user) {
      return context.redirect(`/login?redirect=${encodeURIComponent(url.pathname)}`);
    }
    if (context.locals.user.role !== 'admin') {
      return context.redirect('/dashboard?error=unauthorized_admin');
    }
  }

  // Validasi Origin untuk request mutatif non-GET/HEAD/OPTIONS
  if (!['GET', 'HEAD', 'OPTIONS'].includes(context.request.method)) {
    const origin = context.request.headers.get('origin');
    const allowedOrigins = new Set([
      'https://phinisilearn.web.id',
      'https://www.phinisilearn.web.id',
      url.origin,
    ]);
    if (origin && !allowedOrigins.has(origin)) {
      return new Response('Origin tidak diizinkan.', { status: 403 });
    }
  }

  const response = await next();
  const headers = new Headers(response.headers);
  if (!headers.has('X-Frame-Options')) headers.set('X-Frame-Options', 'DENY');
  if (!headers.has('X-Content-Type-Options')) headers.set('X-Content-Type-Options', 'nosniff');
  if (!headers.has('Referrer-Policy')) headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (url.protocol === 'https:' && !headers.has('Strict-Transport-Security')) {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
