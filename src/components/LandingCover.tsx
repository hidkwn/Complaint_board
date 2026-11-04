import React, { useState } from 'react';
import { 
  ArrowRight, 
  Menu, 
  X, 
  Search, 
  PlusCircle, 
  ShieldCheck, 
  Sparkles,
  Lock
} from 'lucide-react';
import type { Complaint } from '../types';

interface LandingCoverProps {
  complaints: Complaint[];
  onEnterBoard: () => void;
  onOpenLookup: () => void;
  onOpenWrite: () => void;
  onOpenAdmin: () => void;
}

export const LandingCover: React.FC<LandingCoverProps> = ({
  complaints,
  onEnterBoard,
  onOpenLookup,
  onOpenWrite,
  onOpenAdmin,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 실시간 통계
  const totalCount = complaints.length;
  const answeredCount = complaints.filter(c => c.status === 'answered').length;

  return (
    <div className="relative min-h-screen bg-white text-zinc-900 flex flex-col justify-between overflow-x-hidden select-none">
      
      {/* 1. 상단 미니멀 헤더 */}
      <header className="relative z-40 w-full max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* 브랜드 로고 */}
        <div 
          onClick={onEnterBoard}
          className="cursor-pointer group flex items-baseline gap-1"
        >
          <span className="font-serif font-black text-2xl sm:text-3xl tracking-tight text-zinc-950 group-hover:opacity-75 transition-opacity">
            Voicetalk.
          </span>
          <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase hidden sm:inline">
            익명소리함
          </span>
        </div>

        {/* 햄버거 메뉴 버튼 & 퀵 링크 */}
        <div className="flex items-center gap-3">
          <button
            onClick={onEnterBoard}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-zinc-600 hover:text-black transition-colors px-3 py-1.5 border border-zinc-200 rounded-full hover:border-black"
          >
            <span>게시판 입장</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2.5 text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors focus:outline-none"
            aria-label="메뉴 열기"
          >
            {isMenuOpen ? <X className="w-6 h-6 stroke-[2.2]" /> : <Menu className="w-6 h-6 stroke-[2.2]" />}
          </button>
        </div>
      </header>

      {/* 모바일/드롭다운 슬라이드 메뉴 */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-30 bg-white/98 backdrop-blur-md pt-24 px-8 pb-12 flex flex-col justify-between animate-fade-in sm:max-w-md sm:right-0 sm:left-auto sm:border-l sm:border-zinc-200 sm:shadow-2xl">
          <div className="space-y-6">
            <div className="border-b border-zinc-100 pb-4">
              <span className="text-xs font-mono uppercase text-zinc-400 tracking-widest">Navigation</span>
            </div>
            <nav className="flex flex-col gap-4">
              <button
                onClick={() => { setIsMenuOpen(false); onEnterBoard(); }}
                className="text-left font-serif italic text-2xl sm:text-3xl text-zinc-900 hover:text-indigo-600 transition-colors flex items-center justify-between"
              >
                <span>게시판 전체 목록</span>
                <span className="text-xs font-sans not-italic font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                  {totalCount}건
                </span>
              </button>

              <button
                onClick={() => { setIsMenuOpen(false); onOpenLookup(); }}
                className="text-left font-serif italic text-2xl sm:text-3xl text-zinc-900 hover:text-indigo-600 transition-colors flex items-center justify-between"
              >
                <span>불만 바로 조회 (Ticket)</span>
                <Search className="w-5 h-5 not-italic text-zinc-400" />
              </button>

              <button
                onClick={() => { setIsMenuOpen(false); onOpenWrite(); }}
                className="text-left font-serif italic text-2xl sm:text-3xl text-zinc-900 hover:text-indigo-600 transition-colors flex items-center justify-between"
              >
                <span>새 불만 접수하기</span>
                <PlusCircle className="w-5 h-5 not-italic text-zinc-400" />
              </button>

              <button
                onClick={() => { setIsMenuOpen(false); onOpenAdmin(); }}
                className="text-left font-serif italic text-2xl sm:text-3xl text-zinc-900 hover:text-indigo-600 transition-colors flex items-center justify-between"
              >
                <span>운영팀 관리자 모드</span>
                <ShieldCheck className="w-5 h-5 not-italic text-zinc-400" />
              </button>
            </nav>
          </div>

          <div className="border-t border-zinc-200 pt-6 text-xs text-zinc-400 space-y-1">
            <p className="font-semibold text-zinc-700">Voicetalk Community Archive</p>
            <p>100% 완전 익명으로 안전하게 소통하는 열린 공간</p>
          </div>
        </div>
      )}

      {/* 2. 중앙 메인 섹션 (스크린샷 레이아웃 재현) */}
      <main className="relative flex-1 w-full max-w-4xl mx-auto px-4 flex flex-col items-center justify-center my-4 sm:my-8">
        
        {/* 스크린샷의 상단 중심 수직선 (Vertical Black Line Running Down) */}
        <div className="w-[1px] h-16 sm:h-24 bg-zinc-950 mb-6"></div>

        {/* 대형 에디토리얼 세리프 헤드라인 */}
        <div 
          onClick={onEnterBoard}
          className="text-center cursor-pointer group px-4 z-20 py-2 select-none"
        >
          <h1 className="font-serif italic font-extrabold text-3xl sm:text-5xl md:text-6xl tracking-tight leading-[1.08] text-zinc-950 uppercase group-hover:opacity-80 transition-opacity">
            WELCOME TO<br />
            THE DESIGN TALK<br />
            COMMUNITY
          </h1>
          <p className="mt-3 font-mono text-[11px] sm:text-xs tracking-widest text-zinc-500 uppercase">
            — 익명으로 목소리를 내고 대화로 변화를 만듭니다 —
          </p>
        </div>

        {/* 텍스트 하단으로 이어지는 중심 수직선 */}
        <div className="w-[1px] h-12 sm:h-20 bg-zinc-950 mt-6 mb-8"></div>

        {/* 중앙 CTA 입장 버튼 */}
        <div className="z-20 mb-12">
          <button
            onClick={onEnterBoard}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-zinc-950 text-white font-mono text-xs sm:text-sm uppercase tracking-widest shadow-2xl hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <span>게시판 둘러보기 (ENTER)</span>
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </div>
          </button>
        </div>

        {/* 3. 스크린샷을 모티브로 한 중심선 주변 좌우 에디토리얼 콜라주 카드 그리드 */}
        <div className="relative w-full max-w-3xl min-h-[460px] pb-12">
          
          {/* 하단으로 계속 관통하는 미세한 센터 분할선 */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-6 w-[1px] bg-zinc-950/90 pointer-events-none hidden sm:block"></div>

          {/* 좌측 콜라주 카드들 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-12 w-full">
            
            {/* 좌측 열 */}
            <div className="space-y-6 sm:pr-8 flex flex-col items-center sm:items-end">
              
              {/* 좌측 카드 1: 민트/스카이블루 캔디 모티브 카드 (스크린샷 재현) */}
              <div 
                onClick={onEnterBoard}
                className="w-full max-w-[280px] bg-[#dff3f2] p-4 rounded-2xl border border-zinc-200/80 shadow-md hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
              >
                <div className="aspect-[4/3] rounded-xl bg-gradient-to-tr from-[#99dedc] via-[#b6f0ec] to-[#e4fcfb] p-3 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-teal-800 uppercase tracking-widest">
                      #ANONYMOUS
                    </span>
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
                  </div>
                  {/* 귀여운 그래픽 요소 */}
                  <div className="text-center py-2">
                    <div className="text-3xl filter drop-shadow-sm group-hover:scale-110 transition-transform">🍭✨</div>
                  </div>
                  <div className="text-xs font-bold text-teal-950">
                    신원 노출 0% 완전 보장
                  </div>
                </div>
                <div className="pt-3">
                  <h4 className="font-bold text-sm text-zinc-900 group-hover:text-teal-700 transition-colors">
                    신분 걱정 없이 편하게 말해요
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    IP나 계정 기록 없이 100% 암호화되어 안전합니다.
                  </p>
                </div>
              </div>

              {/* 좌측 카드 2: 볼드한 'Super' 타이포 스티커 카드 */}
              <div 
                onClick={onOpenWrite}
                className="w-full max-w-[280px] bg-white p-5 rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-serif italic font-black text-2xl text-indigo-600 tracking-tight">
                    Super Voice.
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 font-bold">
                    NEW
                  </span>
                </div>
                <p className="text-xs text-zinc-700 font-medium">
                  “작은 불만 하나가 사내 문화를 바꾸는 가장 빠른 지름길입니다.”
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-100">
                  <span className="font-bold text-zinc-900">새 불만 제안하기</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-900" />
                </div>
              </div>

              {/* 좌측 카드 3: 블루/골드 페이퍼 컬 모티브 카드 */}
              <div 
                onClick={onEnterBoard}
                className="w-full max-w-[280px] bg-gradient-to-br from-[#1e40af] to-[#172554] p-5 rounded-2xl text-white shadow-lg hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute right-0 bottom-0 w-16 h-16 bg-[#d97706] rounded-tl-[40px] opacity-90 shadow-inner"></div>
                <div className="relative z-10 space-y-2">
                  <span className="text-[10px] font-mono text-blue-200 tracking-widest uppercase">
                    REALTIME BOARD
                  </span>
                  <div className="font-serif italic font-bold text-xl leading-tight">
                    현재 {totalCount}개의 목소리가<br />등록되어 있습니다
                  </div>
                  <div className="text-[11px] text-blue-200 pt-1">
                    답변 완료 {answeredCount}건 • 실시간 소통 중
                  </div>
                </div>
              </div>

            </div>

            {/* 우측 열 */}
            <div className="space-y-6 sm:pl-8 flex flex-col items-center sm:items-start pt-0 sm:pt-10">
              
              {/* 우측 카드 1: 크라프트 & 비즈니스 카드 미니멀 모티브 */}
              <div 
                onClick={onOpenLookup}
                className="w-full max-w-[280px] bg-[#e7dfd5] p-5 rounded-2xl border border-zinc-300 shadow-md hover:-translate-y-1.5 hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-zinc-400">TICKET LOOKUP</span>
                    <Search className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <div className="font-mono text-sm font-bold text-zinc-900 tracking-wider">
                    CMP-2026-F9A1
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    공식 답변 완료 (클릭 시 조회)
                  </div>
                </div>
                <div className="pt-3">
                  <h4 className="font-bold text-sm text-zinc-900 group-hover:text-amber-800 transition-colors">
                    접수번호로 1초 만에 바로 조회
                  </h4>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    발급된 티켓으로 처리 진행 현황을 즉시 확인하세요.
                  </p>
                </div>
              </div>

              {/* 우측 카드 2: 핑크/레드 스트라이프 구체 모티브 대화형 스레드 카드 */}
              <div 
                onClick={onEnterBoard}
                className="w-full max-w-[280px] bg-[#ffe4e6] p-4 rounded-2xl border border-rose-200 shadow-md hover:-translate-y-1.5 hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="aspect-[4/3] rounded-xl bg-gradient-to-tr from-[#f43f5e] via-[#fb7185] to-[#fda4af] p-3 text-white flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] tracking-widest uppercase font-bold text-rose-100">
                      TALK THREAD
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-rose-100" />
                  </div>
                  <div className="text-center py-1">
                    <div className="text-3xl filter drop-shadow group-hover:scale-110 transition-transform">💬⚡</div>
                  </div>
                  <div className="text-xs font-bold text-rose-50 leading-tight">
                    답변 후 대화형 추가 문의 가능!
                  </div>
                </div>
                <div className="pt-3">
                  <h4 className="font-bold text-sm text-zinc-900 group-hover:text-rose-700 transition-colors">
                    단발성이 아닌 메신저식 대화
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    운영팀 답변 후에도 채팅창처럼 추가 질의를 이어갑니다.
                  </p>
                </div>
              </div>

              {/* 우측 카드 3: 비밀글 프라이버시 미니멀 카드 */}
              <div 
                onClick={onOpenWrite}
                className="w-full max-w-[280px] bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm hover:-translate-y-1 transition-all cursor-pointer flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900">비밀글 잠금 지원</div>
                  <div className="text-[10px] text-zinc-400">민감한 사안은 작성자와 관리자만</div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </main>

      {/* 4. 하단 미니멀 푸터 */}
      <footer className="w-full border-t border-zinc-100 py-6 px-6 text-center text-xs text-zinc-400 flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto gap-2">
        <span className="font-mono text-[11px]">
          © 2026 VOICETALK COMMUNITY. ALL RIGHTS RESERVED.
        </span>
        <div className="flex items-center gap-4 text-zinc-500 text-[11px]">
          <button onClick={onEnterBoard} className="hover:text-black transition-colors">게시판</button>
          <span>•</span>
          <button onClick={onOpenLookup} className="hover:text-black transition-colors">불만 바로 조회</button>
          <span>•</span>
          <button onClick={onOpenAdmin} className="hover:text-black transition-colors">관리자</button>
        </div>
      </footer>

    </div>
  );
};
