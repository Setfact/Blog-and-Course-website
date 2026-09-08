/**
 * Utilitas Pengurai dan Masking Tautan Google Drive
 * Mengonversi tautan berbagi Google Drive menjadi URL unduhan langsung
 * tanpa menampilkan antarmuka Google Drive ke pengguna.
 */

export interface ParsedDriveFile {
  fileId: string | null;
  directDownloadUrl: string;
  isGoogleDrive: boolean;
}

/**
 * Mengekstrak File ID dari berbagai format tautan Google Drive
 * Contoh yang didukung:
 * - https://drive.google.com/file/d/1A2B3C4D5E.../view?usp=sharing
 * - https://drive.google.com/open?id=1A2B3C4D5E...
 * - https://drive.google.com/uc?id=1A2B3C4D5E...
 * - https://drive.google.com/uc?export=download&id=1A2B3C4D5E...
 */
export function extractDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  // Pola /file/d/{id}
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }

  // Pola ?id={id} atau &id={id}
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }

  return null;
}

/**
 * Mengonversi URL Google Drive menjadi Direct Download Stream URL
 */
export function getDirectDownloadUrl(rawUrl: string): string {
  if (!rawUrl) return '';

  const fileId = extractDriveFileId(rawUrl);
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  }

  // Jika bukan URL Google Drive, kembalikan URL apa adanya (misal direct storage/S3/VPS)
  return rawUrl.trim();
}

/**
 * Menghasilkan URL endpoint unduhan internal platform
 * agar siswa mengunduh lewat /api/labs/download
 */
export function getPlatformDownloadUrl(rawUrl: string, fileName: string): string {
  if (!rawUrl) return '#';
  const encodedUrl = encodeURIComponent(rawUrl.trim());
  const encodedName = encodeURIComponent(fileName.trim() || 'lab-praktik.pkt');
  return `/api/labs/download?url=${encodedUrl}&filename=${encodedName}`;
}
