import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = createSupabaseServerClient({ request, cookies });
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error saat signout:', err);
    }
  }
  return redirect('/');
};

export const GET: APIRoute = async ({ redirect }) => {
  // Cegah pembatalan sesi tidak disengaja melalui link prefetch atau GET
  return redirect('/');
};
