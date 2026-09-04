import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  const url = new URL(context.request.url);

  // Proteksi panel serta API Keystatic tanpa mengganggu halaman publik.
  if (url.pathname.startsWith('/keystatic') || url.pathname.startsWith('/api/keystatic')) {
    const isLocalDevelopment = import.meta.env.DEV
      && (url.hostname === '127.0.0.1' || url.hostname === 'localhost');

    // Dev server hanya bind ke komputer lokal. Membuka CMS tanpa Basic Auth di
    // sini menghindari dialog login yang tidak didukung in-app browser.
    if (isLocalDevelopment) {
      return next();
    }

    const authHeader = context.request.headers.get('authorization');

    // Deployment selain localhost wajib menyediakan kredensial melalui
    // environment variable.
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (!adminUser || !adminPass) {
      return new Response('Admin credentials are not configured.', {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    }

    const expectedAuth = 'Basic ' + Buffer.from(`${adminUser}:${adminPass}`).toString('base64');

    if (authHeader !== expectedAuth) {
      return new Response('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Keystatic Admin Panel"',
          'Cache-Control': 'no-store',
        },
      });
    }
  }

  return next();
});
