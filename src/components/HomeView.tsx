import React, { useState } from 'react';
import { 
  ArrowRight, 
  ChevronRight, 
  ChevronLeft, 
  ThumbsUp
} from 'lucide-react';
import type { Complaint } from '../types';
import { formatRelativeTime } from '../utils/crypto';

interface HomeViewProps {
  complaints: Complaint[];
  onSelectComplaint: (complaint: Complaint) => void;
  onNavigateToList: () => void;
  onNavigateToLookup: () => void;
  onOpenWriteModal: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  complaints,
  onSelectComplaint,
  onNavigateToList,
  onNavigateToLookup,
  onOpenWriteModal,
}) => {
  // 최신 등록된 3건 (Just in! 섹션용)
  const recentComplaints = complaints.slice(0, 3);

  // 공감(좋아요) 많은 추천 안건들
  const popularComplaints = [...complaints]
    .sort((a, b) => b.likes_count - a.likes_count)
    .slice(0, 4);

  const [carouselIndex, setCarouselIndex] = useState(0);

  const handlePrev = () => {
    setCarouselIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, popularComplaints.length - 2)));
  };

  const handleNext = () => {
    setCarouselIndex((prev) => (prev < popularComplaints.length - 2 ? prev + 1 : 0));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-16 animate-fade-in text-zinc-900">
      
      {/* ============================================================ */}
      {/* 1. HERO SECTION (와이어프레임 좌측 대형 이미지 + 우측 텍스트 분할 구조) */}
      {/* ============================================================ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* 좌측: 모던 그레이 비주얼 카드 플레이스홀더 */}
        <div className="lg:col-span-7 bg-zinc-100 rounded-lg border border-zinc-200 aspect-[16/10] sm:aspect-[16/9] flex flex-col justify-between p-6 sm:p-8 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold px-2.5 py-1 bg-white border border-zinc-200 rounded text-zinc-800 uppercase tracking-wider">
              ANONYMOUS VOICE PORTAL
            </span>
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>100% 완전 익명 보장</span>
            </div>
          </div>

          <div className="space-y-3 max-w-md">
            <div className="text-3xl sm:text-4xl">📢 💬 🛡️</div>
            <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 leading-snug">
              불편을 솔직하게 말하고,<br />
              대화형으로 함께 해결합니다.
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
              IP나 계정 기록 없이 안전하게 전달되며, 담당 부서의 공식 답변과 실시간 후속 질의응답을 지원합니다.
            </p>
          </div>

          <div className="pt-4 border-t border-zinc-200/60 flex items-center justify-between text-xs text-zinc-500">
            <span>실시간 누적 접수 <strong>{complaints.length}건</strong></span>
            <button 
              onClick={onNavigateToList}
              className="font-bold text-zinc-900 hover:underline flex items-center gap-1"
            >
              <span>전체 목록 보러가기</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 우측: 헤드라인 + 본문 + 액션 버튼 (와이어프레임 우측) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400">
              OPEN COMMUNITY
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 leading-tight">
              Welcome to our<br />
              Voice Box Community!
            </h1>
            <p className="text-sm text-zinc-600 leading-relaxed pt-1">
              더 나은 사내 문화와 쾌적한 근무 환경을 만들기 위해 마련된 열린 익명 신문고입니다.
              사소한 불편부터 중대한 프로세스 개선 건의까지 어떤 주제든 자유롭게 들려주세요.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenWriteModal}
              className="px-6 py-3 bg-zinc-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded shadow-sm transition-all active:scale-95"
            >
              지금 불만 접수하기
            </button>
            <button
              onClick={onNavigateToLookup}
              className="px-5 py-3 border border-zinc-300 hover:border-zinc-900 text-zinc-800 text-xs sm:text-sm font-semibold rounded transition-all"
            >
              내 접수번호 조회
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. CATEGORY TILES (와이어프레임 가로 3개 사각 카드 구조) */}
      {/* ============================================================ */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* 타일 1 */}
          <div 
            onClick={onNavigateToList}
            className="group cursor-pointer space-y-3"
          >
            <div className="bg-zinc-100 rounded-lg aspect-[16/10] border border-zinc-200 group-hover:border-zinc-400 flex items-center justify-center transition-colors">
              <span className="text-2xl text-zinc-400 group-hover:scale-110 transition-transform">🏢</span>
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-zinc-900 group-hover:underline">시설 및 환경 개선</h4>
              <p className="text-xs text-zinc-500">휴게 공간, 커피머신, 회의실, 냉난방 등</p>
            </div>
          </div>

          {/* 타일 2 */}
          <div 
            onClick={onNavigateToList}
            className="group cursor-pointer space-y-3"
          >
            <div className="bg-zinc-100 rounded-lg aspect-[16/10] border border-zinc-200 group-hover:border-zinc-400 flex items-center justify-center transition-colors">
              <span className="text-2xl text-zinc-400 group-hover:scale-110 transition-transform">⚙️</span>
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-zinc-900 group-hover:underline">업무 및 프로세스 혁신</h4>
              <p className="text-xs text-zinc-500">보고 체계, 시스템 지연, 불필요한 절차 간소화</p>
            </div>
          </div>

          {/* 타일 3 */}
          <div 
            onClick={onNavigateToList}
            className="group cursor-pointer space-y-3"
          >
            <div className="bg-zinc-100 rounded-lg aspect-[16/10] border border-zinc-200 group-hover:border-zinc-400 flex items-center justify-center transition-colors">
              <span className="text-2xl text-zinc-400 group-hover:scale-110 transition-transform">🎁</span>
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-zinc-900 group-hover:underline">복지 및 인사 제도</h4>
              <p className="text-xs text-zinc-500">식대 현실화, 야근 지원, 유연근무 제도 건의</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. "Just in!" FEATURED SECTION (와이어프레임 3컬럼 카드 + 상단 NEW 뱃지) */}
      {/* ============================================================ */}
      <section className="space-y-6 pt-6 border-t border-zinc-200">
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Just in!</h2>
          <p className="text-xs sm:text-sm text-zinc-500">실시간으로 접수되어 검토 및 답변이 진행 중인 최신 안건입니다.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentComplaints.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-zinc-200 rounded-lg p-5 flex flex-col justify-between hover:border-zinc-400 transition-all shadow-sm"
            >
              <div className="space-y-4">
                {/* 상단 썸네일 박스 + 원형 NEW 뱃지 (와이어프레임 구조) */}
                <div className="bg-zinc-100 rounded aspect-[16/9] border border-zinc-200 relative flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-300 flex items-center justify-center text-[10px] font-bold font-mono tracking-tighter text-zinc-700 shadow-xs absolute left-3 top-3">
                    NEW
                  </div>
                  <div className="font-mono text-xs text-zinc-400">
                    {item.ticket_number}
                  </div>
                  <div className="absolute right-3 bottom-3">
                    {item.status === 'answered' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        답변 완료
                      </span>
                    )}
                    {item.status === 'follow_up' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        대화 중
                      </span>
                    )}
                    {item.status === 'in_progress' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        처리 중
                      </span>
                    )}
                    {item.status === 'pending' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 text-zinc-700">
                        접수 대기
                      </span>
                    )}
                  </div>
                </div>

                {/* 제목 & 본문 내용 */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-zinc-400">#{item.category}</div>
                  <h3 className="font-bold text-base text-zinc-900 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed">
                    {item.is_secret ? '🔒 작성자와 관리자만 볼 수 있는 비밀글입니다.' : item.content}
                  </p>
                </div>
              </div>

              {/* 하단 메타 & 와이어프레임의 솔리드 블랙 버튼 */}
              <div className="pt-5 mt-4 border-t border-zinc-100 flex items-center justify-between">
                <div className="text-[11px] text-zinc-400">
                  <span>{item.author_alias}</span> • <span>{formatRelativeTime(item.created_at)}</span>
                </div>
                <button
                  onClick={() => onSelectComplaint(item)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded transition-colors active:scale-95"
                >
                  답변 & 대화 보기
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. VALUE PROPOSITION ROW (와이어프레임 3개 아이콘 + 텍스트 구성) */}
      {/* ============================================================ */}
      <section className="bg-zinc-50 rounded-xl p-8 sm:p-12 border border-zinc-200 space-y-8 text-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">익명 소리함의 3대 안심 원칙</h2>
          <p className="text-xs sm:text-sm text-zinc-500">누구도 당신의 신원을 추적할 수 없으며, 제기된 문제는 끝까지 책임집니다.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-4">
          {/* 원칙 1 */}
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-white border border-zinc-300 flex items-center justify-center mx-auto text-xl shadow-xs">
              🛡️
            </div>
            <h4 className="text-sm font-bold text-zinc-900">100% 완전 익명 보장</h4>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
              IP 주소, 로그인 세션, 브라우저 정보 등 어떠한 개인 식별자도 데이터베이스에 저장하지 않습니다.
            </p>
          </div>

          {/* 원칙 2 */}
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-white border border-zinc-300 flex items-center justify-center mx-auto text-xl shadow-xs">
              💬
            </div>
            <h4 className="text-sm font-bold text-zinc-900">대화형 추가 문의 스레드</h4>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
              일방적인 답변으로 끝나지 않고 메신저 채팅창처럼 작성자와 운영팀이 추가 질의응답을 이어갑니다.
            </p>
          </div>

          {/* 원칙 3 */}
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-white border border-zinc-300 flex items-center justify-center mx-auto text-xl shadow-xs">
              🔍
            </div>
            <h4 className="text-sm font-bold text-zinc-900">실시간 처리 현황 추적</h4>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
              발급된 고유 접수번호(Ticket #)로 전용 메뉴에서 언제든 진행 단계를 투명하게 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. BOTTOM SPOTLIGHT CAROUSEL (와이어프레임 하단 "Try our bestsellers" 배치) */}
      {/* ============================================================ */}
      <section className="bg-zinc-100 rounded-xl p-6 sm:p-8 border border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-md">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
            TOP EMPATHY
          </span>
          <h3 className="text-xl font-bold text-zinc-900">많은 동료들이 공감한 주요 안건</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            사내 구성원들의 가장 많은 추천과 지지를 받은 건의사항입니다. 운영팀에서 우선 검토 과제로 관리합니다.
          </p>
        </div>

        {/* 하단 미니 카드 캐러셀 */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {popularComplaints.slice(carouselIndex, carouselIndex + 2).map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectComplaint(item)}
                className="bg-white p-4 rounded-lg border border-zinc-200 hover:border-zinc-400 transition-colors cursor-pointer w-full sm:w-56 space-y-2 shadow-xs"
              >
                <div className="bg-zinc-50 rounded aspect-[16/10] border border-zinc-100 flex items-center justify-center text-xs font-mono text-zinc-400">
                  {item.ticket_number}
                </div>
                <div>
                  <h5 className="font-bold text-xs text-zinc-900 truncate">{item.title}</h5>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                    <span className="flex items-center gap-1 text-rose-600 font-bold">
                      <ThumbsUp className="w-3 h-3" />
                      {item.likes_count}명 공감
                    </span>
                    <span>{item.author_alias}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 캐러셀 화살표 */}
          <div className="flex flex-col gap-1">
            <button
              onClick={handlePrev}
              className="p-2 rounded bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-600 transition-colors"
              title="이전"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-600 transition-colors"
              title="다음"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
