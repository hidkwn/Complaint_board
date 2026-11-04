import { createClient } from '@supabase/supabase-js';
import type { Complaint, ConversationMessage, Comment, ComplaintCategory, ComplaintStatus } from '../types';
import { generateTicketNumber } from '../utils/crypto';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://plshighujlmfcebavaqm.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Bo2YH_6ffu-b9SKq0CVzhg_VjlifAo8';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// LocalStorage Fallback Storage Implementation
// ==========================================
const STORAGE_KEY_COMPLAINTS = 'anon_complaints_v1';
const STORAGE_KEY_CONVERSATIONS = 'anon_conversations_v1';
const STORAGE_KEY_COMMENTS = 'anon_comments_v1';

// 초기 샘플 목업 데이터 (대화형 질의응답 및 전용조회 시연용)
const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'cmp-sample-1',
    ticket_number: 'CMP-2026-F9A1',
    title: '3층 휴게실 커피 머신 잦은 추출 오류 및 원두 분쇄 불량',
    content: '3층 중앙 휴게실에 있는 에스프레소 머신이 최근 들어 추출 중에 자꾸 멈추고 에러 코드가 뜹니다. 원두 가루도 너무 굵게 분쇄되어 커피 맛이 많이 연해졌습니다. 많은 분들이 이용하는 기기인 만큼 점검 및 필터 청소 부탁드립니다!',
    category: '시설/환경',
    author_alias: '카페인충전러',
    status: 'answered',
    is_secret: false,
    password_hash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', // 1234
    likes_count: 14,
    view_count: 89,
    created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'cmp-sample-2',
    ticket_number: 'CMP-2026-B4K8',
    title: '원격 근무 시 VPN 대역폭 부족으로 인한 사내 인트라넷 지연 건',
    content: '재택 근무자가 많은 월요일과 금요일 오전 시간대에 VPN 연결이 간헐적으로 끊기거나 파일 업로드 속도가 현저히 저하됩니다. 재택 업무 효율을 위해 게이트웨이 대역폭 증설이나 장비 점검이 가능할까요?',
    category: 'IT/시스템',
    author_alias: '홈오피스러버',
    status: 'follow_up',
    is_secret: false,
    password_hash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', // 1234
    likes_count: 27,
    view_count: 142,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'cmp-sample-3',
    ticket_number: 'CMP-2026-X7M2',
    title: '주간 업무 보고서 양식의 불필요한 중복 항목 간소화 제안',
    content: '현재 부서별로 작성 중인 주간 업무 보고서에 전주 실적과 금주 계획이 지라(Jira) 티켓과 80% 이상 중복됩니다. 지라 대시보드로 자동 대체하거나 텍스트 요약형으로 축소하여 실무 집중도를 높였으면 좋겠습니다.',
    category: '업무/프로세스',
    author_alias: '효율추구자',
    status: 'in_progress',
    is_secret: false,
    password_hash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    likes_count: 35,
    view_count: 198,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'cmp-sample-4',
    ticket_number: 'CMP-2026-Q9L5',
    title: '프로젝트 긴급 야근 시 석식 지원 기준 현실화 건의',
    content: '주변 물가 상승으로 인해 현재 1인당 10,000원으로 책정된 야근 식대로는 식당을 이용하기 매우 어렵습니다. 최소 13,000원 ~ 15,000원 수준으로 현실화 조정을 건의드립니다.',
    category: '인사/복지',
    author_alias: '배고픈야근러',
    status: 'pending',
    is_secret: false,
    password_hash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    likes_count: 42,
    view_count: 220,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'cmp-sample-5',
    ticket_number: 'CMP-2026-Z2W3',
    title: '[비밀글] 특정 층 회의실 예약 선점 및 노쇼(No-show) 관련 건ের',
    content: '이 글은 작성자와 관리자만 볼 수 있는 비밀글입니다. 특정 팀에서 회의실을 하루 종일 블록 예약해두고 실제로는 절반 이상 비워두는 경우가 자주 발생합니다. 자동 취소 시스템이나 페널티 도입 검토 부탁드립니다.',
    category: '시설/환경',
    author_alias: '익명의사원',
    status: 'answered',
    is_secret: true,
    password_hash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    likes_count: 8,
    view_count: 31,
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  }
];

// 대화형 공식 답변 및 추가 질의 스레드 목업 데이터
const INITIAL_CONVERSATIONS: ConversationMessage[] = [
  {
    id: 'msg-1',
    complaint_id: 'cmp-sample-1',
    sender_type: 'admin',
    sender_name: '총무운영팀',
    message: '안녕하세요, 총무운영팀입니다. 불편을 드려 죄송합니다. 11월 4일 오전 기기 렌탈 업체에 AS 기사 방문을 요청하였으며, 금일 오후 3시에 노즐 청소 및 그라인더 칼날 조정을 완료하였습니다. 현재 정상 추출 확인되었습니다.',
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: 'msg-2',
    complaint_id: 'cmp-sample-1',
    sender_type: 'author',
    sender_name: '작성자(카페인충전러)',
    message: '빠른 처리 감사드립니다! 혹시 원두 종류(다크/마일드)도 주기적으로 교체되는지 궁금합니다.',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'msg-3',
    complaint_id: 'cmp-sample-1',
    sender_type: 'admin',
    sender_name: '총무운영팀',
    message: '네! 매월 둘째 주 월요일마다 선호도 조사에 따른 2종류의 신선한 원두로 교체 운영 중입니다. 제안 감사드립니다.',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'msg-4',
    complaint_id: 'cmp-sample-2',
    sender_type: 'admin',
    sender_name: 'IT정보보안팀',
    message: 'VPN 회선 상태 확인 결과, 최근 특정 대용량 빌드 배포 트래픽과 겹쳐 일시적인 병목이 발생했습니다. 1차 조치로 대역폭 QoS 설정을 조정하였습니다.',
    created_at: new Date(Date.now() - 3600000 * 15).toISOString(),
  },
  {
    id: 'msg-5',
    complaint_id: 'cmp-sample-2',
    sender_type: 'author',
    sender_name: '작성자(홈오피스러버)',
    message: '조치 후 속도가 나아졌으나 금일 오전 10시경 재접속 끊김이 1회 발생했습니다. 로그 확인이 추가로 필요할 것 같습니다.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'msg-6',
    complaint_id: 'cmp-sample-5',
    sender_type: 'admin',
    sender_name: '총무운영팀',
    message: '소중한 의견 감사드립니다. 예약 후 15분 내 미입실 시 자동 예약 취소되는 스마트 회의실 연동 모듈을 12월 배포 목표로 개발 중입니다.',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  }
];

// 커뮤니티 익명 댓글 목업
const INITIAL_COMMENTS: Comment[] = [
  {
    id: 'cmt-1',
    complaint_id: 'cmp-sample-1',
    author_alias: '아메리카노파',
    content: '맞아요 3층 커피머신 진짜 맛 이상했었는데 빠른 해결 좋네요!',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'cmt-2',
    complaint_id: 'cmp-sample-1',
    author_alias: '산미극혐',
    content: '디카페인 원두도 하나 생기면 진짜 소원이 없겠습니다.. 총무팀 최고!',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'cmt-3',
    complaint_id: 'cmp-sample-2',
    author_alias: '원격근무자A',
    content: '저도 월요일에 계속 튕겨서 업무 지장 컸어요. 확실한 증설 부탁드립니다.',
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: 'cmt-4',
    complaint_id: 'cmp-sample-4',
    author_alias: '동의합니다',
    content: '요즘 1만원으로 김치찌개 하나 먹기도 빠듯합니다.. 무조건 찬성합니다.',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  }
];

function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

// ==========================================
// DB 및 API 서비스 모듈
// ==========================================
export const api = {
  /**
   * 불만 목록 가져오기
   */
  async getComplaints(): Promise<Complaint[]> {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return getStored<Complaint[]>(STORAGE_KEY_COMPLAINTS, INITIAL_COMPLAINTS);
      }
      return data as Complaint[];
    } catch {
      return getStored<Complaint[]>(STORAGE_KEY_COMPLAINTS, INITIAL_COMPLAINTS);
    }
  },

  /**
   * 접수번호(Ticket) 또는 ID로 단건 조회
   */
  async getComplaintByTicketOrId(identifier: string): Promise<Complaint | null> {
    const cleanId = identifier.trim().toUpperCase();
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .or(`ticket_number.eq.${cleanId},id.eq.${identifier}`)
        .single();

      if (!error && data) {
        return data as Complaint;
      }
    } catch {
      // fallback
    }

    const localList = getStored<Complaint[]>(STORAGE_KEY_COMPLAINTS, INITIAL_COMPLAINTS);
    const found = localList.find(
      c => c.ticket_number.toUpperCase() === cleanId || c.id === identifier
    );
    return found || null;
  },

  /**
   * 새 불만 접수
   */
  async createComplaint(payload: {
    title: string;
    content: string;
    category: Exclude<ComplaintCategory, '전체'>;
    author_alias: string;
    is_secret: boolean;
    password_hash: string;
  }): Promise<Complaint> {
    const newTicket = generateTicketNumber();
    const newComplaint: Complaint = {
      id: 'cmp-' + Date.now().toString(),
      ticket_number: newTicket,
      title: payload.title,
      content: payload.content,
      category: payload.category,
      author_alias: payload.author_alias || '익명',
      status: 'pending',
      is_secret: payload.is_secret,
      password_hash: payload.password_hash,
      likes_count: 0,
      view_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('complaints')
        .insert([newComplaint])
        .select()
        .single();

      if (!error && data) {
        return data as Complaint;
      }
    } catch {
      // fallback to local
    }

    const currentList = getStored<Complaint[]>(STORAGE_KEY_COMPLAINTS, INITIAL_COMPLAINTS);
    const updated = [newComplaint, ...currentList];
    setStored(STORAGE_KEY_COMPLAINTS, updated);
    return newComplaint;
  },

  /**
   * 상태 변경 (관리자 전용)
   */
  async updateComplaintStatus(id: string, status: ComplaintStatus): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (!error) return true;
    } catch {
      // fallback
    }

    const currentList = getStored<Complaint[]>(STORAGE_KEY_COMPLAINTS, INITIAL_COMPLAINTS);
    const updated = currentList.map(c => 
      c.id === id ? { ...c, status, updated_at: new Date().toISOString() } : c
    );
    setStored(STORAGE_KEY_COMPLAINTS, updated);
    return true;
  },

  /**
   * 공감(좋아요) 토글
   */
  async toggleLike(id: string): Promise<number> {
    const currentList = getStored<Complaint[]>(STORAGE_KEY_COMPLAINTS, INITIAL_COMPLAINTS);
    let newCount = 0;
    const updated = currentList.map(c => {
      if (c.id === id) {
        newCount = c.likes_count + 1;
        return { ...c, likes_count: newCount };
      }
      return c;
    });
    setStored(STORAGE_KEY_COMPLAINTS, updated);

    try {
      await supabase
        .from('complaints')
        .update({ likes_count: newCount })
        .eq('id', id);
    } catch {
      // silent
    }
    return newCount;
  },

  /**
   * 조회수 증가
   */
  async incrementViewCount(id: string): Promise<void> {
    const currentList = getStored<Complaint[]>(STORAGE_KEY_COMPLAINTS, INITIAL_COMPLAINTS);
    const updated = currentList.map(c => {
      if (c.id === id) {
        return { ...c, view_count: c.view_count + 1 };
      }
      return c;
    });
    setStored(STORAGE_KEY_COMPLAINTS, updated);
  },

  /**
   * 불만 삭제
   */
  async deleteComplaint(id: string): Promise<boolean> {
    try {
      await supabase.from('complaints').delete().eq('id', id);
    } catch {
      // fallback
    }
    const currentList = getStored<Complaint[]>(STORAGE_KEY_COMPLAINTS, INITIAL_COMPLAINTS);
    setStored(STORAGE_KEY_COMPLAINTS, currentList.filter(c => c.id !== id));
    return true;
  },

  // ==========================================
  // 대화형 공식 답변 및 추가 문의 (Chat Threads)
  // ==========================================
  async getConversationMessages(complaintId: string): Promise<ConversationMessage[]> {
    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as ConversationMessage[];
      }
    } catch {
      // fallback
    }

    const all = getStored<ConversationMessage[]>(STORAGE_KEY_CONVERSATIONS, INITIAL_CONVERSATIONS);
    return all.filter(m => m.complaint_id === complaintId);
  },

  async addConversationMessage(payload: {
    complaint_id: string;
    sender_type: 'admin' | 'author';
    sender_name: string;
    message: string;
  }): Promise<ConversationMessage> {
    const newMsg: ConversationMessage = {
      id: 'msg-' + Date.now().toString(),
      complaint_id: payload.complaint_id,
      sender_type: payload.sender_type,
      sender_name: payload.sender_name,
      message: payload.message,
      created_at: new Date().toISOString(),
    };

    // 추가 문의 시 상태 자동 전환: 작성자가 메시지 보내면 'follow_up', 관리자가 보내면 'answered'
    const newStatus: ComplaintStatus = payload.sender_type === 'author' ? 'follow_up' : 'answered';
    await this.updateComplaintStatus(payload.complaint_id, newStatus);

    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .insert([newMsg])
        .select()
        .single();

      if (!error && data) {
        return data as ConversationMessage;
      }
    } catch {
      // fallback
    }

    const all = getStored<ConversationMessage[]>(STORAGE_KEY_CONVERSATIONS, INITIAL_CONVERSATIONS);
    const updated = [...all, newMsg];
    setStored(STORAGE_KEY_CONVERSATIONS, updated);
    return newMsg;
  },

  // ==========================================
  // 커뮤니티 익명 댓글 (Comments)
  // ==========================================
  async getComments(complaintId: string): Promise<Comment[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Comment[];
      }
    } catch {
      // fallback
    }

    const all = getStored<Comment[]>(STORAGE_KEY_COMMENTS, INITIAL_COMMENTS);
    return all.filter(c => c.complaint_id === complaintId);
  },

  async addComment(payload: {
    complaint_id: string;
    author_alias: string;
    content: string;
    password_hash?: string;
  }): Promise<Comment> {
    const newComment: Comment = {
      id: 'cmt-' + Date.now().toString(),
      complaint_id: payload.complaint_id,
      author_alias: payload.author_alias || '익명',
      content: payload.content,
      password_hash: payload.password_hash,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([newComment])
        .select()
        .single();

      if (!error && data) {
        return data as Comment;
      }
    } catch {
      // fallback
    }

    const all = getStored<Comment[]>(STORAGE_KEY_COMMENTS, INITIAL_COMMENTS);
    const updated = [...all, newComment];
    setStored(STORAGE_KEY_COMMENTS, updated);
    return newComment;
  },

  async deleteComment(id: string): Promise<boolean> {
    try {
      await supabase.from('comments').delete().eq('id', id);
    } catch {
      // fallback
    }
    const all = getStored<Comment[]>(STORAGE_KEY_COMMENTS, INITIAL_COMMENTS);
    setStored(STORAGE_KEY_COMMENTS, all.filter(c => c.id !== id));
    return true;
  }
};

