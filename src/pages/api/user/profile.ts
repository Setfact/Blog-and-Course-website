import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ request, cookies });
  if (!supabase) {
    return new Response(JSON.stringify({ error: 'Database client tidak tersedia' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: Record<string, any> = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Format JSON request tidak valid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const full_name = (body.full_name || '').trim();
  const bio = (body.bio || '').trim();
  const phone_number = (body.phone_number || '').trim();
  const birth_date = body.birth_date ? String(body.birth_date).trim() : null;
  const gender = (body.gender || '').trim();
  const country = (body.country || 'Indonesia').trim();
  const country_code = (body.country_code || 'ID').trim();
  const dial_code = (body.dial_code || '+62').trim();
  const province = (body.province || '').trim();
  const city = (body.city || '').trim();
  const occupation = (body.occupation || '').trim();
  const institution_name = (body.institution_name || '').trim();
  const referral_source = (body.referral_source || '').trim();
  const avatar_url = body.avatar_url !== undefined ? String(body.avatar_url).trim() : undefined;

  if (!full_name) {
    return new Response(JSON.stringify({ error: 'Nama lengkap resmi wajib diisi untuk penerbitan sertifikat.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (full_name.length > 80) {
    return new Response(JSON.stringify({ error: 'Nama lengkap maksimal 80 karakter.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (bio.length > 300) {
    return new Response(JSON.stringify({ error: 'Bio maksimal 300 karakter.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (phone_number.length > 25) {
    return new Response(JSON.stringify({ error: 'Nomor telepon maksimal 25 karakter.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (institution_name.length > 120) {
    return new Response(JSON.stringify({ error: 'Nama institusi maksimal 120 karakter.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Profil dianggap lengkap jika memiliki nama resmi, negara, wilayah, dan profesi
  const is_profile_complete = Boolean(
    full_name &&
    country &&
    (province || city) &&
    occupation &&
    institution_name
  );

  const updatePayload: Record<string, any> = {
    full_name,
    bio,
    phone_number,
    gender: gender || null,
    country,
    country_code,
    dial_code,
    province,
    city,
    occupation,
    institution_name,
    referral_source,
    is_profile_complete,
    updated_at: new Date().toISOString(),
  };

  if (birth_date) {
    updatePayload.birth_date = birth_date;
  }

  if (avatar_url !== undefined) {
    updatePayload.avatar_url = avatar_url;
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        profile: updatePayload,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Error saat update profil siswa:', err);
    return new Response(JSON.stringify({ error: err.message || 'Gagal memperbarui profil' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
