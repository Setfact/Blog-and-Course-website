export const prerender = false;

import type { APIRoute } from 'astro';
import { uploadForm, publishUpload } from '../../../lib/uploads';
import { HttpError, json } from '../../../lib/security';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return json({ error: 'Akses ditolak: hanya administrator yang berwenang.' }, 403);
  }

  try {
    const form = await uploadForm(request, 52 * 1024 * 1024);
    const file = form.get('lab') || form.get('file');
    const result = await publishUpload(file, 'labs');

    return json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    const status = error instanceof HttpError ? error.status : 500;
    return json(
      { error: error instanceof HttpError ? error.message : 'Gagal menyimpan berkas lab.' },
      status
    );
  }
};
