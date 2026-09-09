export type UserRole = 'student' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended';
export type PostType = 'discussion' | 'showcase' | 'milestone';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: UserRole;
  status: UserStatus;
  xp: number;
  streak: number;
  last_study_date: string | null;
  bio: string;
  phone_number?: string | null;
  birth_date?: string | null;
  gender?: 'male' | 'female' | 'other' | string | null;
  country?: string | null;
  country_code?: string | null;
  dial_code?: string | null;
  province?: string | null;
  city?: string | null;
  occupation?: string | null;
  institution_name?: string | null;
  referral_source?: string | null;
  is_profile_complete?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityChannel {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  sort_order: number;
}

export interface CommunityPost {
  id: string;
  author_id: string;
  channel_id: string;
  post_type: PostType;
  title: string;
  content: string;
  image_url?: string;
  is_pinned: boolean;
  is_solved?: boolean;
  solved_comment_id?: string | null;
  upvotes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
  channel?: CommunityChannel;
  has_upvoted?: boolean;
}


export interface CommunityComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface CommunityUpvote {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface UserLessonProgress {
  id: string;
  user_id: string;
  course_slug: string;
  lesson_id: string;
  completed_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
  admin?: Profile;
}

export interface PlatformAnnouncement {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  is_active: boolean;
  created_at: string;
}

