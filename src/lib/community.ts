import type { SupabaseClient } from '@supabase/supabase-js';
import type { CommunityChannel, CommunityPost, CommunityComment, Profile } from '../types/database';

export const DEFAULT_CHANNELS: CommunityChannel[] = [
  {
    id: 'networking',
    name: 'Networking & CCNA',
    description: 'Routing, switching, subnetting, VLAN, OSPF, dan topologi Cisco',
    icon_name: 'router',
    sort_order: 1,
  },
  {
    id: 'linux-sysadmin',
    name: 'Linux & Sysadmin',
    description: 'Server Linux, konfigurasi service, bash scripting, dan manajemen sistem',
    icon_name: 'terminal',
    sort_order: 2,
  },
  {
    id: 'automation',
    name: 'Automation & NetDevOps',
    description: 'Python scripting, Netmiko, Scrapli, Ansible, dan API jaringan',
    icon_name: 'code',
    sort_order: 3,
  },
  {
    id: 'showcase',
    name: 'Project Showcase',
    description: 'Pamerkan topologi lab, diagram jaringan, atau proyek script Anda',
    icon_name: 'workspace_premium',
    sort_order: 4,
  },
  {
    id: 'tanya-jawab',
    name: 'Tanya Jawab & Troubleshooting',
    description: 'Pusat bantuan seputar kendala konfigurasi lab dan materi teknis',
    icon_name: 'help_outline',
    sort_order: 5,
  },
];

// Data mock awal untuk kenyamanan saat pertama kali inisialisasi
const MOCK_PROFILES: Record<string, Profile> = {
  'admin-1': {
    id: 'admin-1',
    email: 'calvinum26@gmail.com',
    full_name: 'Calvin Umboh',
    avatar_url: '',
    role: 'admin',
    status: 'active',
    xp: 650,
    streak: 12,
    last_study_date: new Date().toISOString().split('T')[0],
    bio: 'Founder & Network Enthusiast di Phinisi Learn',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'student-1': {
    id: 'student-1',
    email: 'budi.santoso@example.com',
    full_name: 'Budi Santoso',
    avatar_url: '',
    role: 'student',
    status: 'active',
    xp: 380,
    streak: 5,
    last_study_date: new Date().toISOString().split('T')[0],
    bio: 'Sedang mengejar sertifikasi CCNA 200-301',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'student-2': {
    id: 'student-2',
    email: 'dewi.lestari@example.com',
    full_name: 'Dewi Lestari',
    avatar_url: '',
    role: 'student',
    status: 'active',
    xp: 290,
    streak: 4,
    last_study_date: new Date().toISOString().split('T')[0],
    bio: 'Sysadmin pemula di Bandung',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

let inMemoryPosts: CommunityPost[] = [
  {
    id: 'post-welcome-1',
    author_id: 'admin-1',
    channel_id: 'networking',
    post_type: 'discussion',
    title: 'Selamat datang di Komunitas Siswa Phinisi Learn',
    content: 'Ruang ini didedikasikan untuk bertukar konfigurasi lab Cisco, tips subnetting, otomatisasi Python, serta bertanya jika menemui kendala pada topologi jaringan Anda. Gunakan blok kode untuk melampirkan CLI Cisco atau skrip Python.',
    is_pinned: true,
    upvotes_count: 14,
    comments_count: 2,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    author: MOCK_PROFILES['admin-1'],
    channel: DEFAULT_CHANNELS[0],
  },
  {
    id: 'post-sample-2',
    author_id: 'student-1',
    channel_id: 'showcase',
    post_type: 'showcase',
    title: 'Berhasil menyelesaikan Lab OSPF Multi-Area dengan 4 Router',
    content: 'Setelah mencoba beberapa kali di GNS3/CML, akhirnya routing table di area 0 dan area 1 sudah konvergen dengan cost yang pas! Berikut cuplikan verifikasi:\n\n```ios\nR1#show ip route ospf\nO IA  192.168.20.0/24 [110/3] via 10.1.1.2, GigabitEthernet0/1\n```',
    is_pinned: false,
    upvotes_count: 8,
    comments_count: 1,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    author: MOCK_PROFILES['student-1'],
    channel: DEFAULT_CHANNELS[3],
  },
];

let inMemoryComments: CommunityComment[] = [
  {
    id: 'comment-1',
    post_id: 'post-sample-2',
    author_id: 'admin-1',
    content: 'Keren sekali Budi! Pastikan OSPF Router ID diset secara manual pada loopback interface agar stabil.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    author: MOCK_PROFILES['admin-1'],
  },
];

let inMemoryUpvotes: Record<string, Set<string>> = {
  'post-welcome-1': new Set(['admin-1', 'student-1']),
  'post-sample-2': new Set(['admin-1']),
};

export const getChannels = async (supabase: SupabaseClient | null): Promise<CommunityChannel[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('community_channels')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!error && data && data.length > 0) return data;
    } catch {
      // Fallback to default
    }
  }
  return DEFAULT_CHANNELS;
};

export const getPosts = async (
  supabase: SupabaseClient | null,
  options: { channelId?: string; sort?: 'newest' | 'popular'; currentUserId?: string } = {}
): Promise<CommunityPost[]> => {
  const { channelId, sort = 'newest', currentUserId } = options;

  if (supabase) {
    try {
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          author:profiles(*),
          channel:community_channels(*)
        `);

      if (channelId && channelId !== 'all') {
        query = query.eq('channel_id', channelId);
      }

      if (sort === 'popular') {
        query = query.order('is_pinned', { ascending: false }).order('upvotes_count', { ascending: false });
      } else {
        query = query.order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (!error && data) {
        if (currentUserId) {
          const postIds = data.map((p) => p.id);
          const { data: upvoteData } = await supabase
            .from('community_upvotes')
            .select('post_id')
            .eq('user_id', currentUserId)
            .in('post_id', postIds);

          const upvotedSet = new Set((upvoteData || []).map((u) => u.post_id));
          return data.map((p) => ({ ...p, has_upvoted: upvotedSet.has(p.id) }));
        }
        return data;
      }
    } catch (err) {
      console.error('Error fetching posts from Supabase:', err);
    }
  }

  // Fallback memory data
  let filtered = [...inMemoryPosts];
  if (channelId && channelId !== 'all') {
    filtered = filtered.filter((p) => p.channel_id === channelId);
  }
  if (sort === 'popular') {
    filtered.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0) || b.upvotes_count - a.upvotes_count);
  } else {
    filtered.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return filtered.map((p) => ({
    ...p,
    has_upvoted: currentUserId ? Boolean(inMemoryUpvotes[p.id]?.has(currentUserId)) : false,
  }));
};

export const getPostById = async (
  supabase: SupabaseClient | null,
  id: string,
  currentUserId?: string
): Promise<CommunityPost | null> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          author:profiles(*),
          channel:community_channels(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        let hasUpvoted = false;
        if (currentUserId) {
          const { data: up } = await supabase
            .from('community_upvotes')
            .select('post_id')
            .eq('post_id', id)
            .eq('user_id', currentUserId)
            .maybeSingle();
          hasUpvoted = Boolean(up);
        }
        return { ...data, has_upvoted: hasUpvoted };
      }
    } catch (err) {
      console.error('Error fetching post by id:', err);
    }
  }

  const found = inMemoryPosts.find((p) => p.id === id);
  if (!found) return null;
  return {
    ...found,
    has_upvoted: currentUserId ? Boolean(inMemoryUpvotes[id]?.has(currentUserId)) : false,
  };
};

export const getCommentsByPostId = async (
  supabase: SupabaseClient | null,
  postId: string
): Promise<CommunityComment[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('community_comments')
        .select(`
          *,
          author:profiles(*)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (!error && data) return data;
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  }

  return inMemoryComments
    .filter((c) => c.post_id === postId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
};

export const createPost = async (
  supabase: SupabaseClient | null,
  payload: {
    author: Profile;
    channelId: string;
    title: string;
    content: string;
    postType?: 'discussion' | 'showcase' | 'milestone';
  }
): Promise<CommunityPost> => {
  const { author, channelId, title, content, postType = 'discussion' } = payload;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          author_id: author.id,
          channel_id: channelId,
          title,
          content,
          post_type: postType,
        })
        .select(`*, author:profiles(*), channel:community_channels(*)`)
        .single();

      if (!error && data) return data;
    } catch (err) {
      console.error('Error inserting post in Supabase:', err);
    }
  }

  const newPost: CommunityPost = {
    id: `post-${Date.now()}`,
    author_id: author.id,
    channel_id: channelId,
    post_type: postType,
    title,
    content,
    is_pinned: false,
    upvotes_count: 0,
    comments_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    author,
    channel: DEFAULT_CHANNELS.find((c) => c.id === channelId) ?? DEFAULT_CHANNELS[0],
  };

  inMemoryPosts.unshift(newPost);
  return newPost;
};

export const createComment = async (
  supabase: SupabaseClient | null,
  payload: {
    author: Profile;
    postId: string;
    content: string;
  }
): Promise<CommunityComment> => {
  const { author, postId, content } = payload;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('community_comments')
        .insert({
          post_id: postId,
          author_id: author.id,
          content,
        })
        .select(`*, author:profiles(*)`)
        .single();

      if (!error && data) return data;
    } catch (err) {
      console.error('Error creating comment in Supabase:', err);
    }
  }

  const newComment: CommunityComment = {
    id: `comment-${Date.now()}`,
    post_id: postId,
    author_id: author.id,
    content,
    created_at: new Date().toISOString(),
    author,
  };

  inMemoryComments.push(newComment);
  const targetPost = inMemoryPosts.find((p) => p.id === postId);
  if (targetPost) targetPost.comments_count += 1;

  return newComment;
};

export const toggleUpvote = async (
  supabase: SupabaseClient | null,
  payload: {
    userId: string;
    postId: string;
  }
): Promise<{ hasUpvoted: boolean; count: number }> => {
  const { userId, postId } = payload;

  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from('community_upvotes')
        .select('post_id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        await supabase.from('community_upvotes').delete().eq('post_id', postId).eq('user_id', userId);
        const { data: updatedPost } = await supabase.from('community_posts').select('upvotes_count').eq('id', postId).single();
        return { hasUpvoted: false, count: updatedPost?.upvotes_count ?? 0 };
      } else {
        await supabase.from('community_upvotes').insert({ post_id: postId, user_id: userId });
        const { data: updatedPost } = await supabase.from('community_posts').select('upvotes_count').eq('id', postId).single();
        return { hasUpvoted: true, count: updatedPost?.upvotes_count ?? 1 };
      }
    } catch (err) {
      console.error('Error toggling upvote in Supabase:', err);
    }
  }

  if (!inMemoryUpvotes[postId]) inMemoryUpvotes[postId] = new Set();
  const upvoted = inMemoryUpvotes[postId].has(userId);
  const post = inMemoryPosts.find((p) => p.id === postId);

  if (upvoted) {
    inMemoryUpvotes[postId].delete(userId);
    if (post) post.upvotes_count = Math.max(0, post.upvotes_count - 1);
    return { hasUpvoted: false, count: post?.upvotes_count ?? 0 };
  } else {
    inMemoryUpvotes[postId].add(userId);
    if (post) post.upvotes_count += 1;
    return { hasUpvoted: true, count: post?.upvotes_count ?? 1 };
  }
};

export const getTopLearners = async (
  supabase: SupabaseClient | null,
  limit: number = 5
): Promise<Profile[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('xp', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) return data;
    } catch (err) {
      console.error('Error fetching top learners:', err);
    }
  }

  return Object.values(MOCK_PROFILES)
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);
};
