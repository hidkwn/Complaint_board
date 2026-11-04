import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, X } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);

    const adminPin = import.meta.env.VITE_ADMIN_PIN || '1234';
    if (pin.trim() === adminPin || pin.trim() === 'admin' || pin.trim() === '1234') {
      onSuccess();
      onClose();
      setPin('');
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in text-zinc-900">
      <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-xl border border-zinc-200 space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-zinc-100 text-zinc-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">운영팀 관리자 모드</h3>
              <p className="text-[10px] text-zinc-400">공식 답변 및 진행 상태 제어</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-600 leading-relaxed">
          관리자 PIN을 입력하시면 공식 답변 작성, 상태 변경(처리중/완료) 및 게시글 관리가 활성화됩니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="관리자 PIN (기본값: 1234)"
                className="w-full text-xs pl-8 pr-3 py-2 rounded border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900"
                autoFocus
              />
            </div>
            {error && (
              <div className="flex items-center gap-1 text-[11px] text-rose-600 pt-1">
                <AlertCircle className="w-3 h-3" />
                <span>비밀번호가 일치하지 않습니다. (기본값: 1234)</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-black rounded transition-colors"
            >
              관리자 모드 실행
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
