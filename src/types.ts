export type ComplaintCategory = 
  | '전체'
  | '시설/환경'
  | '업무/프로세스'
  | '인사/복지'
  | 'IT/시스템'
  | '기타';

export type ComplaintStatus = 'pending' | 'in_progress' | 'answered' | 'follow_up';

export interface Complaint {
  id: string;
  ticket_number: string;
  title: string;
  content: string;
  category: Exclude<ComplaintCategory, '전체'>;
  author_alias: string;
  status: ComplaintStatus;
  is_secret: boolean;
  password_hash: string;
  likes_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  complaint_id: string;
  sender_type: 'admin' | 'author';
  sender_name: string;
  message: string;
  created_at: string;
}

export interface Comment {
  id: string;
  complaint_id: string;
  author_alias: string;
  content: string;
  password_hash?: string;
  created_at: string;
}

export interface ComplaintStats {
  total: number;
  pending: number;
  in_progress: number;
  answered: number;
  follow_up: number;
}

