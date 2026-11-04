import React, { useState } from 'react';
import { 
  Send, 
  MessageSquare, 
  ShieldCheck, 
  User, 
  Lock
} from 'lucide-react';
import type { Complaint, ConversationMessage } from '../types';
import { formatRelativeTime } from '../utils/crypto';

interface ConversationThreadProps {
  complaint: Complaint;
  messages: ConversationMessage[];
  isAdmin: boolean;
  onSendMessage: (text: string, senderType: 'admin' | 'author', senderName: string) => Promise<void>;
  isAuthorAuthenticated: boolean;
  onAuthenticateAuthor: () => void;
}

export const ConversationThread: React.FC<ConversationThreadProps> = ({
  complaint,
  messages,
  isAdmin,
  onSendMessage,
  isAuthorAuthenticated,
  onAuthenticateAuthor,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isAdmin) {
        await onSendMessage(inputText.trim(), 'admin', '운영팀');
      } else {
        await onSendMessage(inputText.trim(), 'author', `작성자(${complaint.author_alias})`);
      }
      setInputText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="bg-zinc-50 rounded-lg border border-zinc-200 overflow-hidden">
      {/* 헤더 바 */}
      <div className="bg-white px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              대화형 공식 답변 & 후속 질의 스레드
            </h4>
          </div>
        </div>

        <div className="text-[11px] font-mono">
          {complaint.status === 'answered' && (
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              답변 완료
            </span>
          )}
          {complaint.status === 'follow_up' && (
            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              대화 진행 중
            </span>
          )}
          {complaint.status === 'in_progress' && (
            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              검토 진행 중
            </span>
          )}
          {complaint.status === 'pending' && (
            <span className="font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
              접수 대기 중
            </span>
          )}
        </div>
      </div>

      {/* 메시지 리스트 영역 */}
      <div className="p-4 space-y-3.5 max-h-[380px] overflow-y-auto">
        {!hasMessages ? (
          <div className="text-center py-8 px-4 bg-white rounded border border-zinc-200">
            <p className="text-xs font-bold text-zinc-700">현재 담당 부서에서 접수 내용을 검토하고 있습니다.</p>
            <p className="text-[11px] text-zinc-400 mt-1">
              공식 답변이 등록되면 이곳에서 메신저처럼 추가 문의를 이어가실 수 있습니다.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAdminMsg = msg.sender_type === 'admin';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isAdminMsg ? 'justify-start' : 'justify-end'}`}
              >
                {isAdminMsg && (
                  <div className="w-7 h-7 rounded bg-zinc-900 text-white flex-shrink-0 flex items-center justify-center text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`max-w-[85%] ${isAdminMsg ? 'items-start' : 'items-end'}`}>
                  <div className={`flex items-center gap-1.5 mb-1 text-[11px] ${isAdminMsg ? 'justify-start' : 'justify-end'}`}>
                    {isAdminMsg ? (
                      <>
                        <span className="font-bold text-zinc-900">{msg.sender_name}</span>
                        <span className="bg-zinc-900 text-white text-[9px] font-mono px-1 rounded">
                          OFFICIAL
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="bg-zinc-200 text-zinc-700 text-[9px] font-mono px-1 rounded">
                          AUTHOR
                        </span>
                        <span className="font-semibold text-zinc-700">{msg.sender_name}</span>
                      </>
                    )}
                    <span className="text-[10px] text-zinc-400">
                      {formatRelativeTime(msg.created_at)}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded text-xs leading-relaxed whitespace-pre-wrap ${
                      isAdminMsg
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'bg-white border border-zinc-300 text-zinc-800'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>

                {!isAdminMsg && (
                  <div className="w-7 h-7 rounded bg-zinc-200 text-zinc-700 flex-shrink-0 flex items-center justify-center text-xs">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 대화형 메시지 입력 전송 영역 */}
      <div className="p-3 bg-white border-t border-zinc-200">
        {isAdmin || isAuthorAuthenticated ? (
          <form onSubmit={handleSend} className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isAdmin
                    ? '운영팀 공식 답변을 작성하세요...'
                    : '답변 내용에 대해 추가로 궁금한 점을 대화형으로 질문하세요...'
                }
                rows={2}
                className="w-full text-xs px-3 py-2 rounded border border-zinc-300 focus:outline-none focus:border-zinc-900 resize-none bg-zinc-50 focus:bg-white transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <span className="absolute right-2 bottom-1.5 text-[9px] text-zinc-400 hidden sm:inline">
                Enter로 전송
              </span>
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isSubmitting}
              className={`self-end flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded text-xs font-semibold text-white transition-all shadow-xs ${
                isAdmin
                  ? 'bg-emerald-700 hover:bg-emerald-800 disabled:bg-zinc-300'
                  : 'bg-zinc-900 hover:bg-black disabled:bg-zinc-300'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isAdmin ? '답변 전송' : '문의 전송'}</span>
            </button>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 bg-zinc-100 rounded text-xs text-zinc-700">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
              <span>작성자 비밀번호를 인증하시면 <strong>대화형 추가 문의</strong>를 남기실 수 있습니다.</span>
            </div>
            <button
              type="button"
              onClick={onAuthenticateAuthor}
              className="px-3 py-1 text-xs font-semibold text-white bg-zinc-900 hover:bg-black rounded whitespace-nowrap"
            >
              비밀번호 인증
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
