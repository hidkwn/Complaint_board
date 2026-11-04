import React, { useState } from 'react';
import { 
  Search, 
  KeyRound, 
  Ticket, 
  Lock, 
  ArrowRight, 
  History,
  FileQuestion
} from 'lucide-react';
import type { Complaint } from '../types';
import { formatRelativeTime, hashPassword } from '../utils/crypto';

interface ComplaintLookupViewProps {
  complaints: Complaint[];
  onSelectComplaint: (complaint: Complaint, initialUnlocked?: boolean) => void;
  onOpenWriteModal: () => void;
}

export const ComplaintLookupView: React.FC<ComplaintLookupViewProps> = ({
  complaints,
  onSelectComplaint,
  onOpenWriteModal,
}) => {
  const [ticketInput, setTicketInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchedComplaint, setSearchedComplaint] = useState<Complaint | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // 최근 조회한 접수번호 목록
  const [recentTickets, setRecentTickets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('anon_recent_tickets');
      return saved ? JSON.parse(saved) : ['CMP-2026-F9A1', 'CMP-2026-B4K8'];
    } catch {
      return ['CMP-2026-F9A1'];
    }
  });

  const handleLookup = async (e?: React.FormEvent, directTicket?: string) => {
    if (e) e.preventDefault();
    setSearchError(null);
    setSearchedComplaint(null);
    setIsUnlocked(false);

    const query = (directTicket || ticketInput).trim();
    if (!query) {
      setSearchError('접수번호(Ticket) 또는 검색어를 입력해주세요.');
      return;
    }

    const found = complaints.find(
      c => c.ticket_number.toUpperCase() === query.toUpperCase() ||
           c.title.toLowerCase().includes(query.toLowerCase())
    );

    if (!found) {
      setSearchError(`'${query}'에 해당하는 접수 내역을 찾을 수 없습니다. 접수번호를 다시 확인해주세요.`);
      return;
    }

    let unlocked = false;
    if (passwordInput.trim()) {
      const hashed = await hashPassword(passwordInput.trim());
      if (hashed === found.password_hash) {
        unlocked = true;
      } else {
        setSearchError('비밀번호가 일치하지 않습니다. 기본 정보만 표시합니다.');
      }
    }

    setSearchedComplaint(found);
    setIsUnlocked(unlocked);

    if (!recentTickets.includes(found.ticket_number)) {
      const updated = [found.ticket_number, ...recentTickets].slice(0, 5);
      setRecentTickets(updated);
      try {
        localStorage.setItem('anon_recent_tickets', JSON.stringify(updated));
      } catch {}
    }
  };

  const totalCount = complaints.length;
  const answeredCount = complaints.filter(c => c.status === 'answered').length;
  const inProgressCount = complaints.filter(c => c.status === 'in_progress' || c.status === 'follow_up').length;
  const pendingCount = complaints.filter(c => c.status === 'pending').length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in text-zinc-900">
      
      {/* 타이틀 및 안내 */}
      <div className="space-y-2 border-b border-zinc-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-zinc-300 text-[11px] font-mono font-bold uppercase text-zinc-600">
          <Ticket className="w-3 h-3" />
          <span>Ticket Lookup</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
          불만 접수 현황 바로 조회
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500">
          발급받으신 <strong>고유 접수번호(Ticket #)</strong>를 입력하여 처리 진행 상태와 운영팀의 공식 답변을 실시간으로 확인하세요.
        </p>
      </div>

      {/* 실시간 현황 통계 (4개 카드) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-mono text-zinc-400 uppercase">전체 접수</div>
          <div className="text-2xl font-bold font-mono text-zinc-900">{totalCount}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-mono text-zinc-400 uppercase">접수 대기</div>
          <div className="text-2xl font-bold font-mono text-zinc-700">{pendingCount}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-mono text-zinc-400 uppercase">검토 & 대화중</div>
          <div className="text-2xl font-bold font-mono text-blue-600">{inProgressCount}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-mono text-zinc-400 uppercase">답변 완료</div>
          <div className="text-2xl font-bold font-mono text-emerald-600">{answeredCount}</div>
        </div>
      </div>

      {/* 메인 조회 폼 */}
      <div className="bg-zinc-50 p-6 sm:p-8 rounded-lg border border-zinc-200 space-y-5">
        <form onSubmit={(e) => handleLookup(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
              접수번호 (Ticket #)
            </label>
            <div className="relative">
              <Ticket className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                placeholder="예: CMP-2026-F9A1 또는 키워드 입력"
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 bg-white border border-zinc-300 rounded font-mono uppercase focus:outline-none focus:border-zinc-900 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                비밀번호 (선택 - 본인 글 인증 및 대화형 추가 문의 작성용)
              </label>
              <span className="text-[10px] text-zinc-400">작성 시 설정한 비밀번호</span>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="비밀글이거나 추가 문의를 남기시려면 입력해주세요"
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 bg-white border border-zinc-300 rounded focus:outline-none focus:border-zinc-900 transition-colors"
              />
            </div>
          </div>

          {searchError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded flex items-center gap-2">
              <FileQuestion className="w-4 h-4 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-zinc-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded transition-colors flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]"
          >
            <Search className="w-4 h-4" />
            <span>불만 처리 현황 조회하기</span>
          </button>
        </form>

        {/* 최근 조회 퀵 칩 */}
        {recentTickets.length > 0 && (
          <div className="pt-4 border-t border-zinc-200 flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
              <History className="w-3.5 h-3.5" />
              최근 조회:
            </span>
            {recentTickets.map((ticket) => (
              <button
                key={ticket}
                type="button"
                onClick={() => {
                  setTicketInput(ticket);
                  handleLookup(undefined, ticket);
                }}
                className="text-xs font-mono font-semibold px-2 py-0.5 rounded border border-zinc-300 bg-white hover:border-zinc-900 transition-colors"
              >
                {ticket}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 검색 결과 카드 */}
      {searchedComplaint && (
        <div className="bg-white rounded-lg border-2 border-zinc-900 p-6 space-y-5 animate-fade-in shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-200">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800">
                {searchedComplaint.ticket_number}
              </span>
              <span className="text-xs font-semibold text-zinc-500">
                #{searchedComplaint.category}
              </span>
              {searchedComplaint.is_secret && (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Lock className="w-3 h-3" />
                  비밀글
                </span>
              )}
            </div>

            <div>
              {searchedComplaint.status === 'answered' && (
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  답변 완료
                </span>
              )}
              {searchedComplaint.status === 'follow_up' && (
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  대화 진행 중
                </span>
              )}
              {searchedComplaint.status === 'in_progress' && (
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  처리 검토 중
                </span>
              )}
              {searchedComplaint.status === 'pending' && (
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-zinc-200 text-zinc-700">
                  접수 대기
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-zinc-900">{searchedComplaint.title}</h3>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-4 rounded border border-zinc-200">
              {searchedComplaint.is_secret && !isUnlocked
                ? '🔒 비밀글로 보호되어 있습니다. 상세 모달에서 비밀번호를 입력하시면 열람할 수 있습니다.'
                : searchedComplaint.content}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div className="text-xs text-zinc-400">
              작성자: <strong>{searchedComplaint.author_alias}</strong> • 작성일: {formatRelativeTime(searchedComplaint.created_at)}
            </div>

            <button
              onClick={() => onSelectComplaint(searchedComplaint, isUnlocked)}
              className="px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors"
            >
              <span>상세 보기 및 대화형 답변 확인</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 하단 신규 접수 가이드 */}
      <div className="bg-zinc-100 rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-zinc-200">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-bold text-sm text-zinc-900">새로운 불편이나 개선 건의가 있으신가요?</h4>
          <p className="text-xs text-zinc-500">누구의 눈치도 볼 필요 없이 완전 익명으로 안전하게 전하세요.</p>
        </div>
        <button
          onClick={onOpenWriteModal}
          className="px-5 py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded transition-colors whitespace-nowrap"
        >
          새 불만 접수하기
        </button>
      </div>

    </div>
  );
};
