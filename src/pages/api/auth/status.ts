import type { APIRoute } from 'astro';
import { getRankTier } from '../../../lib/rank';

export const GET: APIRoute = ({ locals }) => {
  const user = locals.user;

  const data = user
    ? {
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        xp: user.xp,
        rankName: getRankTier(user.xp).name,
      }
    : null;

  return new Response(JSON.stringify({ user: data }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
      Vary: 'Cookie',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
