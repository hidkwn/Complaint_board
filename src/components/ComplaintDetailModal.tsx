import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  KeyRound, 
  ThumbsUp, 
  Trash2, 
  Share2, 
  Check, 
  ShieldCheck, 
  MessageCircle,
  Clock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import type { Complaint, ConversationMessage, Comment, ComplaintStatus } from '../types';
import { formatRelativeTime, hashPassword } from '../utils/crypto';
import { ConversationThread } from './ConversationThread';

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  initialUnlocked?: boolean;
  onUpdateStatus: (id: string, status: ComplaintStatus) => Promise<void>;
  onDeleteComplaint: (id: string) => Promise<void>;
  onToggleLike: (id: string, e: React.MouseEvent) => void;
  // Conversation API
  getConversationMessages: (id: string) => Promise<ConversationMessage[]>;
  onSendConversationMessage: (complaintId: string, text: string, senderType: 'admin' | 'author', senderName: string) => Promise<void>;
  // Comments API
  getComments: (id: string) => Promise<Comment[]>;
  onAddComment: (complaintId: string, author: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  isOpen,
  onClose,
  isAdmin,
  initialUnlocked = false,
  onUpdateStatus,
  onDeleteComplaint,
  onToggleLike,
  getConversationMessages,
  onSendConversationMessage,
  getComments,
  onAddComment,
  onDeleteComment,
}) => {
  if (!isOpen || !complaint) return null;

  const [isUnlocked, setIsUnlocked] = useState(initialUnlocked || isAdmin);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 대화 및 댓글 상태
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // 데이터 로드
  useEffect(() => {
    let active = true;
    const loadData = async () => {
      const [msgs, cmts] = await Promise.all([
        getConversationMessages(complaint.id),
        getComments(complaint.id)
      ]);
      if (active) {
        setMessages(msgs);
        setComments(cmts);
      }
    };
    loadData();
    setIsUnlocked(initialUnlocked || isAdmin || !complaint.is_secret);
    return () => { active = false; };
  }, [complaint.id, isAdmin, initialUnlocked, complaint.is_secret]);

  // 비밀번호 인증
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(false);
    const hashed = await hashPassword(passwordInput.trim());
    if (hashed === complaint.password_hash) {
      setIsUnlocked(true);
      setShowAuthModal(false);
      setPasswordInput('');
    } else {
      setPasswordError(true);
    }
  };

  // 대화 메시지 전송 핸들러
  const handleSendMessage = async (text: string, senderType: 'admin' | 'author', senderName: string) => {
    await onSendConversationMessage(complaint.id, text, senderType, senderName);
    const updated = await getConversationMessages(complaint.id);
    setMessages(updated);
  };

  // 댓글 등록 핸들러
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      await onAddComment(complaint.id, commentAuthor.trim() || '익명', commentText.trim());
      setCommentText('');
      const updated = await getComments(complaint.id);
      setComments(updated);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // 링크 복사
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isLockedSecret = complaint.is_secret && !isUnlocked && !isAdmin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 sm:p-8 shadow-xl border border-zinc-200 my-6 max-h-[90vh] overflow-y-auto text-zinc-900">
        
        {/* 상단 닫기 및 접수번호 헤더 */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
              {complaint.ticket_number}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-50 text-zinc-600 border border-zinc-200">
              #{complaint.category}
            </span>
            {complaint.is_secret && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <Lock className="w-3 h-3" />
                비밀글
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded transition-colors"
              title="링크 복사"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 비밀글 잠금 상태일 때 */}
        {isLockedSecret ? (
          <div className="py-12 px-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-900">비밀글로 보호되어 있습니다</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                작성 시 설정한 비밀번호를 입력하시면 본문 및 대화형 답변을 열람하실 수 있습니다.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="max-w-xs mx-auto space-y-3 pt-2">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="비밀번호 입력"
                className="w-full text-center px-4 py-2 border border-zinc-300 rounded text-xs focus:outline-none focus:border-zinc-900"
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-rose-600 font-medium">비밀번호가 일치하지 않습니다.</p>
              )}
              <button
                type="submit"
                className="w-full py-2 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded transition-colors"
              >
                비밀글 열람하기
              </button>
            </form>
          </div>
        ) : (
          /* 본문 및 상세 콘텐츠 */
          <div className="mt-5 space-y-6">
            
            {/* 글 제목 및 상태 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {complaint.status === 'answered' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    답변 완료
                  </span>
                )}
                {complaint.status === 'follow_up' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    추가 문의 대화 진행 중
                  </span>
                )}
                {complaint.status === 'in_progress' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    처리 검토 중
                  </span>
                )}
                {complaint.status === 'pending' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                    접수 대기 중
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 leading-snug">
                {complaint.title}
              </h2>

              <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-700">{complaint.author_alias}</span>
                  <span>•</span>
                  <span>{formatRelativeTime(complaint.created_at)}</span>
                </div>
                <div>조회수 {complaint.view_count}회</div>
              </div>
            </div>

            {/* 본문 내용 */}
            <div className="p-5 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
              {complaint.content}
            </div>

            {/* 공감 & 관리자 제어 바 */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={(e) => onToggleLike(complaint.id, e)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded border border-zinc-300 bg-white hover:border-zinc-900 transition-colors text-xs font-semibold"
              >
                <ThumbsUp className="w-3.5 h-3.5 text-rose-500" />
                <span>공감해요 {complaint.likes_count}</span>
              </button>

              {/* 관리자 컨트롤 (상태 변경) */}
              {isAdmin && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 p-1.5 rounded text-xs">
                  <span className="font-bold text-emerald-800 pl-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    상태 제어:
                  </span>
                  <select
                    value={complaint.status}
                    onChange={(e) => onUpdateStatus(complaint.id, e.target.value as ComplaintStatus)}
                    className="bg-white border border-emerald-300 rounded px-2 py-1 font-semibold text-emerald-900 focus:outline-none"
                  >
                    <option value="pending">접수 대기</option>
                    <option value="in_progress">처리 중</option>
                    <option value="follow_up">추가 문의 접수</option>
                    <option value="answered">답변 완료</option>
                  </select>

                  <button
                    onClick={() => {
                      if (confirm('정말 이 불만을 삭제하시겠습니까?')) {
                        onDeleteComplaint(complaint.id);
                        onClose();
                      }
                    }}
                    className="p-1 text-rose-600 hover:bg-rose-100 rounded transition-colors ml-1"
                    title="게시글 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* 작성자 본인 인증 시 삭제 버튼 */}
              {!isAdmin && isUnlocked && (
                <button
                  onClick={() => {
                    if (confirm('정말 작성하신 불만을 삭제하시겠습니까?')) {
                      onDeleteComplaint(complaint.id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>내 글 삭제</span>
                </button>
              )}
            </div>

            {/* ============================================================ */}
            {/* 대화형 공식 답변 & 추가 문의 스레드 (Conversational UI) */}
            {/* ============================================================ */}
            <div className="pt-2">
              <ConversationThread
                complaint={complaint}
                messages={messages}
                isAdmin={isAdmin}
                onSendMessage={handleSendMessage}
                isAuthorAuthenticated={isUnlocked}
                onAuthenticateAuthor={() => setShowAuthModal(true)}
              />
            </div>

            {/* ============================================================ */}
            {/* 공개글일 경우: 커뮤니티 익명 댓글 섹션 */}
            {/* ============================================================ */}
            {!complaint.is_secret && (
              <div className="pt-4 border-t border-zinc-200 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-zinc-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                    동료들의 의견 및 응원 ({comments.length})
                  </h4>
                </div>

                {/* 댓글 작성 폼 */}
                <form onSubmit={handleCommentSubmit} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentAuthor}
                      onChange={(e) => setCommentAuthor(e.target.value)}
                      placeholder="익명 닉네임"
                      maxLength={12}
                      className="w-28 text-xs px-3 py-2 border border-zinc-200 rounded bg-zinc-50 focus:bg-white focus:outline-none focus:border-zinc-900"
                    />
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="자유롭게 의견을 남겨주세요..."
                      className="flex-1 text-xs px-3 py-2 border border-zinc-200 rounded bg-zinc-50 focus:bg-white focus:outline-none focus:border-zinc-900"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim() || isSubmittingComment}
                      className="px-4 py-2 rounded text-xs font-semibold text-white bg-zinc-900 hover:bg-black active:scale-95 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-all"
                    >
                      등록
                    </button>
                  </div>
                </form>

                {/* 댓글 리스트 */}
                <div className="space-y-2 pt-1">
                  {comments.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-3 text-center">
                      아직 등록된 댓글이 없습니다.
                    </p>
                  ) : (
                    comments.map(c => (
                      <div
                        key={c.id}
                        className="p-3 rounded bg-zinc-50 border border-zinc-100 flex items-start justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-zinc-800">{c.author_alias}</span>
                            <span className="text-[11px] text-zinc-400">
                              {formatRelativeTime(c.created_at)}
                            </span>
                          </div>
                          <p className="text-zinc-700 leading-relaxed">{c.content}</p>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => onDeleteComment(c.id)}
                            className="text-zinc-400 hover:text-rose-600 transition-colors p-1"
                            title="댓글 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* 작성자 본인 인증 모달 */}
      {showAuthModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                <KeyRound className="w-4 h-4 text-zinc-800" />
                <span>작성자 비밀번호 확인</span>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-zinc-400 hover:text-zinc-600 text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              불만 등록 시 설정하셨던 4자리 이상의 비밀번호를 입력해주세요.
            </p>
            <form onSubmit={handleUnlock} className="space-y-3">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="비밀번호 입력"
                className="w-full text-xs px-3 py-2 rounded border border-zinc-300 focus:outline-none focus:border-zinc-900"
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-rose-600">비밀번호가 일치하지 않습니다.</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-black rounded"
                >
                  확인
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
