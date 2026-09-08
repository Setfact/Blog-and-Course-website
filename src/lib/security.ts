/**
 * Keamanan Utilitas Phinisi Learn
 * Mencegah Open Redirect (CWE-601) dan manipulasi URL eksternal
 */

/**
 * Memvalidasi dan membersihkan parameter redirect URL agar hanya mengarah
 * ke rute internal aplikasi yang aman.
 *
 * @param target String path tujuan redirect yang diterima dari query string atau body
 * @param fallback Rute default jika path tidak valid atau tidak aman (default: '/dashboard')
 * @returns Path internal yang aman diawali dengan single '/'
 */
export function sanitizeRedirectPath(target: unknown, fallback: string = '/dashboard'): string {
  if (typeof target !== 'string' || !target.trim()) {
    return fallback;
  }

  const trimmed = target.trim();

  // Tolak rute yang tidak diawali '/', atau berpotensi menjadi protocol-relative URL ('//' atau '/\\')
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }

  // Tolak skema berbahaya atau kontrol karakter
  if (/[\r\n\t]/.test(trimmed)) {
    return fallback;
  }

  try {
    // Parse menggunakan dummy origin untuk memastikan origin tidak berubah
    const parsed = new URL(trimmed, 'http://localhost');

    // Pastikan host dan port tetap localhost (tidak ada bypass hostname melalui karakter khusus)
    if (parsed.origin !== 'http://localhost') {
      return fallback;
    }

    // Pastikan pathname diawali '/' dan tidak mengarah ke skema lain
    if (!parsed.pathname.startsWith('/')) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
