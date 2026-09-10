export function translateAuthError(errorMessage: string | null | undefined): string {
  if (!errorMessage) {
    return 'Terjadi kesalahan autentikasi. Silakan coba kembali.';
  }

  const raw = errorMessage.trim();

  // Deteksi batas waktu pengiriman email Supabase (rate limit seconds)
  const rateLimitMatch = raw.match(/after\s+(\d+)\s+seconds/i);
  if (rateLimitMatch) {
    const seconds = rateLimitMatch[1];
    return `Demi keamanan sistem, Anda baru dapat meminta kembali setelah ${seconds} detik. Silakan tunggu sejenak.`;
  }

  // Batas rate limit umum
  if (/rate limit/i.test(raw) || /over_email_send_rate_limit/i.test(raw)) {
    return 'Batas pengiriman email telah tercapai untuk sementara waktu. Silakan tunggu beberapa saat sebelum mencoba kembali.';
  }

  // Email belum dikonfirmasi
  if (/email not confirmed/i.test(raw)) {
    return 'Email Anda belum diverifikasi. Harap periksa kotak masuk atau folder spam di email Anda untuk mengaktifkan akun.';
  }

  // Kredensial tidak sesuai
  if (/invalid login credentials/i.test(raw) || /invalid_credentials/i.test(raw)) {
    return 'Alamat email atau kata sandi yang Anda masukkan tidak sesuai. Silakan periksa kembali.';
  }

  // Pengguna sudah terdaftar
  if (/user already registered/i.test(raw) || /already exists/i.test(raw)) {
    return 'Alamat email ini sudah terdaftar. Silakan beralih ke tab Masuk untuk mengakses akun Anda.';
  }

  // Panjang kata sandi
  if (/password should be at least/i.test(raw) || /signup requires a valid password/i.test(raw)) {
    return 'Kata sandi harus terdiri dari minimal 8 karakter.';
  }

  // Format email tidak valid
  if (/unable to validate email address/i.test(raw) || /invalid email/i.test(raw)) {
    return 'Format alamat email tidak valid. Pastikan penulisan email sudah benar.';
  }

  // Token konfirmasi kedaluwarsa atau tidak valid
  if (/token is invalid/i.test(raw) || /token has expired/i.test(raw) || /otp expired/i.test(raw)) {
    return 'Tautan konfirmasi telah kedaluwarsa atau tidak valid. Silakan minta tautan verifikasi baru.';
  }

  // Google OAuth dibatalkan atau akses penguji belum diberikan
  if (/access_denied/i.test(raw) || /access blocked/i.test(raw) || /tidak diizinkan/i.test(raw)) {
    return 'Akses login Google dibatalkan atau akun Anda belum ditambahkan sebagai penguji Google oleh pengembang.';
  }

  // Masalah verifikasi Google ID Token atau penyedia OAuth
  if (/google id token/i.test(raw) || /provider is not enabled/i.test(raw) || /oauth provider/i.test(raw)) {
    return 'Penyedia autentikasi Google belum aktif atau kredensial sistem tidak sesuai.';
  }

  // Masalah CSRF atau Origin
  if (/asal permintaan tidak diizinkan/i.test(raw)) {
    return 'Permintaan tidak diizinkan demi keamanan. Silakan muat ulang halaman lalu coba kembali.';
  }

  return raw;
}
