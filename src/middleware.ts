import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  const url = new URL(context.request.url);
  
  // Hanya proteksi route yang berawalan dengan /keystatic atau /api/keystatic
  if (url.pathname.startsWith('/keystatic') || url.pathname.startsWith('/api/keystatic')) {
    const authHeader = context.request.headers.get('authorization');
    
    // Tarik kredensial dari Environment Variables (disetting di PM2)
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'rahasia';
    
    // Buat expected string (Basic base64(user:pass))
    const expectedAuth = 'Basic ' + Buffer.from(`${adminUser}:${adminPass}`).toString('base64');
    
    if (authHeader !== expectedAuth) {
      return new Response('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Keystatic Admin Panel"',
        },
      });
    }
  }
  
  return next();
});
