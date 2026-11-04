import React from 'react';
import { 
  Search, 
  Plus, 
  ShieldCheck, 
  ShieldAlert
} from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'list' | 'lookup';
  onViewChange: (view: 'home' | 'list' | 'lookup') => void;
  onOpenWriteModal: () => void;
  isAdmin: boolean;
  onOpenAdminModal: () => void;
  onLogoutAdmin: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenWriteModal,
  isAdmin,
  onOpenAdminModal,
  onLogoutAdmin,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* 좌측: 와이어프레임 스타일의 미니멀 로고 박스 */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => onViewChange('home')}
            className="flex items-center justify-center px-4 py-1.5 border border-zinc-900 rounded text-xs font-mono font-bold tracking-wider uppercase text-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors"
          >
            VOICE BOX
          </button>

          {/* 중앙 네비게이션 링크 */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-600">
            <button
              onClick={() => onViewChange('home')}
              className={`hover:text-black transition-colors ${
                currentView === 'home' ? 'text-black font-bold border-b-2 border-black pb-0.5' : ''
              }`}
            >
              홈
            </button>
            <button
              onClick={() => onViewChange('list')}
              className={`hover:text-black transition-colors ${
                currentView === 'list' ? 'text-black font-bold border-b-2 border-black pb-0.5' : ''
              }`}
            >
              게시판 목록
            </button>
            <button
              onClick={() => onViewChange('lookup')}
              className={`hover:text-black transition-colors flex items-center gap-1 ${
                currentView === 'lookup' ? 'text-black font-bold border-b-2 border-black pb-0.5' : ''
              }`}
            >
              <span>불만 바로 조회</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </button>
          </nav>
        </div>

        {/* 우측: 와이어프레임의 상단 우측 검색창 & 액션 버튼 */}
        <div className="flex items-center gap-3">
          {/* 상단 검색창 (와이어프레임 형태) */}
          <div className="relative hidden sm:block w-48 lg:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (currentView !== 'list') onViewChange('list');
              }}
              placeholder="Search complaints..."
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-zinc-200 rounded bg-zinc-50 focus:bg-white focus:outline-none focus:border-zinc-900 transition-colors"
            />
          </div>

          {/* 새 불만 접수 버튼 */}
          <button
            onClick={onOpenWriteModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 text-white rounded text-xs font-medium hover:bg-zinc-800 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>불만 접수</span>
          </button>

          {/* 관리자 모드 토글 */}
          {isAdmin ? (
            <button
              onClick={onLogoutAdmin}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 transition-colors"
              title="관리자 모드 실행 중 (클릭 시 로그아웃)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">관리자 ON</span>
            </button>
          ) : (
            <button
              onClick={onOpenAdminModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium text-zinc-500 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-50 transition-colors"
              title="관리자 인증"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">관리자</span>
            </button>
          )}
        </div>

      </div>

      {/* 모바일 뷰 네비게이션 링크 행 */}
      <div className="md:hidden flex items-center justify-around border-t border-zinc-100 py-2 bg-zinc-50 text-xs font-medium text-zinc-600">
        <button
          onClick={() => onViewChange('home')}
          className={currentView === 'home' ? 'text-black font-bold' : ''}
        >
          홈
        </button>
        <button
          onClick={() => onViewChange('list')}
          className={currentView === 'list' ? 'text-black font-bold' : ''}
        >
          게시판 목록
        </button>
        <button
          onClick={() => onViewChange('lookup')}
          className={currentView === 'lookup' ? 'text-black font-bold' : ''}
        >
          불만 바로 조회
        </button>
      </div>
    </header>
  );
};
