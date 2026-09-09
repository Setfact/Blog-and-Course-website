import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { HttpError, textField, RateLimiter } from './security';

const exec = promisify(execFile);
const redisScript = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n";
const memoryLimiter = new RateLimiter(20_000);
const hasRedisCli = existsSync('/usr/bin/redis-cli');

export async function limit(key: string, max: number, seconds: number): Promise<void> {
  const digest = createHash('sha256').update(key).digest('hex');
  const redisKey = `phinisi:limit:${digest}`;

  if (hasRedisCli) {
    try {
      const { stdout } = await exec(
        '/usr/bin/redis-cli',
        ['-h', '127.0.0.1', '--raw', 'EVAL', redisScript, '1', redisKey, String(seconds)],
        { timeout: 1500, maxBuffer: 1024 }
      );
      const count = Number(stdout.trim());
      if (Number.isFinite(count) && count >= 1) {
        if (count > max) {
          throw new HttpError(429, 'Terlalu banyak percobaan. Coba kembali nanti');
        }
        return;
      }
    } catch (err) {
      if (err instanceof HttpError) throw err;
      // Fallback ke in-memory jika redis-cli sementara gagal atau timeout
    }
  }

  // Fallback in-memory rate limiter
  const allowed = memoryLimiter.allow(key, max, seconds * 1000);
  if (!allowed) {
    throw new HttpError(429, 'Terlalu banyak percobaan. Coba kembali nanti');
  }
}

export function emailField(value: unknown): string {
  const email = textField(value, 'Email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'Masukkan alamat email yang valid');
  }
  return email;
}

export function passwordField(value: unknown, registration = false): string {
  if (
    typeof value !== 'string' ||
    value.length < (registration ? 12 : 1) ||
    value.length > 128
  ) {
    throw new HttpError(
      400,
      registration
        ? 'Gunakan kata sandi 12–128 karakter'
        : 'Email atau kata sandi tidak sesuai'
    );
  }
  return value;
}

export const authFailure =
  'Email atau kata sandi tidak sesuai, atau akun belum dapat digunakan. Periksa email verifikasi Anda.';
