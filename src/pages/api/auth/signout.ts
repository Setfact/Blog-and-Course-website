import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';

export const ALL: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = createSupabaseServerClient({ request, cookies });
  if (supabase) {
    await supabase.auth.signOut();
  }
  return redirect('/');
};
