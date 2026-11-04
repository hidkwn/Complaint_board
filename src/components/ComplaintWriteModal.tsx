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
      setErrorMsg('본인 인증 및 대화형 추가 문의를 위해 4자리 이상의 비밀번호를 입력해주세요.');
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
      setErrorMsg('접수 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
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
    setCreatedResult(null);
    setTitle('');
    setContent('');
    setPassword('');
    setPasswordConfirm('');
    setAuthorAlias('');
    setIsSecret(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-lg max-w-xl w-full p-6 sm:p-8 shadow-xl border border-zinc-200 my-8 text-zinc-900">
        
        {/* 접수 성공 안내 화면 */}
        {createdResult ? (
          <div className="text-center space-y-6 py-4 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <Check className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-zinc-900">불만이 정상 접수되었습니다</h3>
              <p className="text-xs text-zinc-500">
                담당 부서에서 확인 후 공식 답변을 등록할 예정입니다.
              </p>
            </div>

            {/* 발급된 접수번호 카드 */}
            <div className="bg-zinc-50 border border-zinc-200 p-5 rounded space-y-3">
              <div className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                발급된 접수번호 (TICKET NUMBER)
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-2xl font-bold text-zinc-900 tracking-wider">
                  {createdResult.ticket_number}
                </span>
                <button
                  onClick={handleCopyTicket}
                  className="flex items-center gap-1 px-3 py-1 bg-white border border-zinc-300 text-zinc-800 text-xs font-semibold rounded hover:bg-zinc-50 transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? '복사됨' : '복사'}</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">
                상단 <strong>[불만 바로 조회]</strong> 메뉴에서 접수번호로 진행 상황을 확인하고 대화형으로 추가 문의를 남기실 수 있습니다.
              </p>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded transition-colors"
            >
              확인 및 상세 보기
            </button>
          </div>
        ) : (
          /* 접수 작성 폼 */
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div>
                <h3 className="text-base font-bold text-zinc-900">새 불만 및 개선 건의 접수</h3>
                <p className="text-xs text-zinc-400">어떠한 개인 식별자도 남지 않는 100% 익명 보장</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">카테고리 *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">익명 닉네임</label>
                  <input
                    type="text"
                    value={authorAlias}
                    onChange={(e) => setAuthorAlias(e.target.value)}
                    placeholder="미입력 시 '익명'"
                    maxLength={15}
                    className="w-full text-xs px-3 py-2 rounded border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">제목 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="불만이나 건의사항의 핵심을 요약해주세요"
                  maxLength={100}
                  className="w-full text-xs px-3 py-2 rounded border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">상세 내용 *</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="발생한 불편 사항이나 구체적인 개선 제안을 적어주세요..."
                  rows={5}
                  className="w-full text-xs px-3 py-2 rounded border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900 resize-none leading-relaxed"
                />
              </div>

              {/* 비밀글 토글 */}
              <div className="p-3 bg-zinc-50 rounded border border-zinc-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className={`w-3.5 h-3.5 ${isSecret ? 'text-amber-600' : 'text-zinc-400'}`} />
                  <div>
                    <div className="text-xs font-bold text-zinc-800">비밀글로 등록</div>
                    <div className="text-[10px] text-zinc-500">
                      작성자와 관리자만 본문 및 대화형 답변을 열람할 수 있습니다.
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isSecret}
                  onChange={(e) => setIsSecret(e.target.checked)}
                  className="w-4 h-4 text-zinc-900 rounded focus:ring-zinc-900 cursor-pointer"
                />
              </div>

              {/* 비밀번호 설정 */}
              <div className="p-3 bg-zinc-50 rounded border border-zinc-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>본인 확인 비밀번호 설정 (필수)</span>
                </div>
                <p className="text-[10px] text-zinc-500">
                  대화형 추가 문의 작성, 글 삭제, 비밀글 열람 시 사용됩니다.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 (4자리 이상)"
                    className="w-full text-xs px-3 py-1.5 rounded border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900"
                  />
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="비밀번호 확인"
                    className="w-full text-xs px-3 py-1.5 rounded border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded text-xs font-semibold text-white bg-zinc-900 hover:bg-black active:scale-95 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? '접수 중...' : '불만 접수 완료'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
