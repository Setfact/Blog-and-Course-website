export const prerender = false;

import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';
import { uploadForm, publishUpload } from '../../../lib/uploads';
import { HttpError, json } from '../../../lib/security';

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user) {
    return json({ error: 'Harap masuk terlebih dahulu untuk memperbarui foto profil.' }, 401);
  }

  try {
    const form = await uploadForm(context.request, 4 * 1024 * 1024);
    const imageFile = form.get('image') || form.get('file') || form.get('avatar');
    const result = await publishUpload(imageFile, 'avatars');

    const supabase = createSupabaseServerClient(context);
    if (supabase) {
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          avatar_url: result.url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (dbError) {
        console.error('Gagal memperbarui avatar_url di tabel profiles:', dbError);
        return json({ error: 'Gagal memperbarui foto profil di basis data.' }, 500);
      }
    }

    return json({
      success: true,
      avatar_url: result.url,
      message: 'Foto profil berhasil diperbarui.',
    });
  } catch (error: any) {
    const status = error instanceof HttpError ? error.status : 500;
    return json(
      { error: error instanceof HttpError ? error.message : 'Terjadi kesalahan saat memproses foto profil.' },
      status
    );
  }
};

export const DELETE: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user) {
    return json({ error: 'Harap masuk terlebih dahulu.' }, 401);
  }

  try {
    const supabase = createSupabaseServerClient(context);
    if (supabase) {
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          avatar_url: '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (dbError) {
        console.error('Gagal menghapus avatar_url di tabel profiles:', dbError);
        return json({ error: 'Gagal menghapus foto profil di basis data.' }, 500);
      }
    }

    return json({
      success: true,
      avatar_url: '',
      message: 'Foto profil berhasil dihapus dan dikembalikan ke inisial nama.',
    });
  } catch (error: any) {
    const status = error instanceof HttpError ? error.status : 500;
    return json(
      { error: error instanceof HttpError ? error.message : 'Terjadi kesalahan saat menghapus foto profil.' },
      status
    );
  }
};
