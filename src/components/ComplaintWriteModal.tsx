import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  KeyRound, 
  Check, 
  Copy, 
  AlertCircle 
} from 'lucide-react';
import type { ComplaintCategory, Complaint } from '../types';
import { hashPassword } from '../utils/crypto';

interface ComplaintWriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    content: string;
    category: Exclude<ComplaintCategory, '전체'>;
    author_alias: string;
    is_secret: boolean;
    password_hash: string;
  }) => Promise<Complaint>;
  onSuccessCreated: (newComplaint: Complaint) => void;
}

const CATEGORIES: Exclude<ComplaintCategory, '전체'>[] = [
  '시설/환경',
  '업무/프로세스',
  '인사/복지',
  'IT/시스템',
  '기타'
];

export const ComplaintWriteModal: React.FC<ComplaintWriteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSuccessCreated,
}) => {
  const [category, setCategory] = useState<Exclude<ComplaintCategory, '전체'>>('시설/환경');
  const [authorAlias, setAuthorAlias] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<Complaint | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('불만 상세 내용을 입력해주세요.');
      return;
    }
    if (!password.trim() || password.length < 4) {
      setErrorMsg('추후 본인 인증 및 대화형 추가 문의를 위해 4자리 이상의 비밀번호를 입력해주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const passwordHash = await hashPassword(password.trim());
      const res = await onSubmit({
        title: title.trim(),
        content: content.trim(),
        category,
        author_alias: authorAlias.trim() || '익명',
        is_secret: isSecret,
        password_hash: passwordHash,
      });

      setCreatedResult(res);
    } catch {
      setErrorMsg('등록 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTicket = () => {
    if (!createdResult) return;
    navigator.clipboard.writeText(createdResult.ticket_number);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFinish = () => {
    if (createdResult) {
      onSuccessCreated(createdResult);
    }
    onClose();
    // Reset state
    setCreatedResult(null);
    setTitle('');
    setContent('');
    setPassword('');
    setPasswordConfirm('');
    setAuthorAlias('');
    setIsSecret(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
        
        {/* 접수 성공 안내 화면 */}
        {createdResult ? (
          <div className="text-center space-y-6 py-4 animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-slate-900">불만이 정상 접수되었습니다!</h3>
              <p className="text-xs sm:text-sm text-slate-500">
                운영팀에서 확인 후 신속하게 공식 답변을 등록할 예정입니다.
              </p>
            </div>

            {/* 발급된 접수번호 카드 */}
            <div className="bg-indigo-50/70 border border-indigo-100 p-5 rounded-2xl space-y-3">
              <div className="text-xs text-indigo-700 font-bold uppercase tracking-wider">
                발급된 전용 접수번호 (Ticket #)
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-2xl font-black text-indigo-900 tracking-wider">
                  {createdResult.ticket_number}
                </span>
                <button
                  onClick={handleCopyTicket}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-indigo-700 text-xs font-bold shadow-sm hover:bg-indigo-100 transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? '복사됨' : '복사'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                상단 <strong>[불만 바로 조회]</strong> 메뉴에서 이 접수번호로 언제든지 처리 현황을 확인하고 <strong>대화형 추가 문의</strong>를 남기실 수 있습니다.
              </p>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-100 transition-all"
            >
              확인 및 상세 보기
            </button>
          </div>
        ) : (
          /* 접수 작성 폼 */
          <div>
            {/* 상단 타이틀 */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  ✍️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">새 불만 및 개선 건의 접수</h3>
                  <p className="text-xs text-slate-400">어떠한 개인 식별 정보도 남지 않습니다.</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 에러 메시지 */}
            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 입력 폼 */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* 카테고리 & 닉네임 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">카테고리 *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">익명 닉네임</label>
                  <input
                    type="text"
                    value={authorAlias}
                    onChange={(e) => setAuthorAlias(e.target.value)}
                    placeholder="미입력 시 '익명'으로 표시"
                    maxLength={15}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* 제목 */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">제목 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="불만 또는 건의사항을 한 줄로 요약해주세요"
                  maxLength={100}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 내용 */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">상세 내용 *</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="발생한 불편 사항이나 구체적인 개선 방안을 작성해주세요..."
                  rows={5}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                />
              </div>

              {/* 비밀글 토글 옵션 */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Lock className={`w-4 h-4 ${isSecret ? 'text-amber-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-xs font-bold text-slate-800">비밀글로 등록</div>
                    <div className="text-[11px] text-slate-500">
                      작성자와 관리자만 본문 및 대화형 답변을 열람할 수 있습니다.
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isSecret}
                  onChange={(e) => setIsSecret(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* 비밀번호 설정 (4자리 이상) */}
              <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  <span>본인 확인 비밀번호 설정 (필수)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  추후 <strong>대화형 추가 문의 작성</strong>, 글 수정/삭제, 비밀글 열람 시 사용됩니다.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 (4자리 이상)"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="비밀번호 확인"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* 버튼 그룹 */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md shadow-indigo-100 transition-all"
                >
                  {isSubmitting ? '접수 등록 중...' : '불만 접수 완료'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
