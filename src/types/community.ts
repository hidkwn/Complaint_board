export type Role = 'user' | 'moderator' | 'admin';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';
export type ReportTargetType = 'post' | 'comment';
export type SortOrder = 'latest' | 'likes' | 'views';

export interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  role: Role;
  is_suspended: boolean;
  created_at: string;
}

export interface Board {
  id: string;
  title: string;
  description: string;
  is_admin_only: boolean;
  is_anonymous: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  board_id: string;
  author_id: string;
  title: string;
  content: string;
  is_notice: boolean;
  is_hidden: boolean;
  is_anonymous: boolean;
  is_sample: boolean;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  author?: Pick<Profile, 'id' | 'nickname' | 'avatar_url'>;
  board?: Pick<Board, 'title'>;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  is_hidden: boolean;
  is_anonymous: boolean;
  is_sample: boolean;
  created_at: string;
  author?: Pick<Profile, 'id' | 'nickname' | 'avatar_url'>;
}

export interface Attachment {
  id: string;
  post_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  target_url: string;
  is_read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  status: ReportStatus;
  is_sample: boolean;
  created_at: string;
  reporter?: Pick<Profile, 'nickname'>;
}
