import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ThumbsUp, 
  Eye, 
  Lock, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  SlidersHorizontal,
  ChevronLeft
} from 'lucide-react';
import type { Complaint, ComplaintCategory } from '../types';
import { formatRelativeTime } from '../utils/crypto';

interface ComplaintListProps {
  complaints: Complaint[];
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenWriteModal: () => void;
  onToggleLike: (id: string, e: React.MouseEvent) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const CATEGORIES: ComplaintCategory[] = [
  '전체',
  '시설/환경',
  '업무/프로세스',
  '인사/복지',
  'IT/시스템',
  '기타'
];

export const ComplaintList: React.FC<ComplaintListProps> = ({
  complaints,
  onSelectComplaint,
  onOpenWriteModal,
  onToggleLike,
  searchQuery,
  onSearchChange,
}) => {
  // 필터 상태
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory>('전체');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [onlySecret, setOnlySecret] = useState<boolean>(false);
  const [onlyPublic, setOnlyPublic] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'latest' | 'likes' | 'views'>('latest');

  // 사이드바 아코디언 상태
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isStatusOpen, setIsStatusOpen] = useState(true);
  const [isTypeOpen, setIsTypeOpen] = useState(true);

  // 모바일 사이드바 토글
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // 하단 캐러셀 인덱스
  const [bottomCarouselIdx, setBottomCarouselIdx] = useState(0);

  // 필터링 및 정렬
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (selectedCategory !== '전체' && c.category !== selectedCategory) {
        return false;
      }
      if (selectedStatus !== 'all' && c.status !== selectedStatus) {
        return false;
      }
      if (onlySecret && !c.is_secret) return false;
      if (onlyPublic && c.is_secret) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchContent = c.content.toLowerCase().includes(q);
        const matchTicket = c.ticket_number.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchTicket) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'likes') return b.likes_count - a.likes_count;
      if (sortBy === 'views') return b.view_count - a.view_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [complaints, selectedCategory, selectedStatus, onlySecret, onlyPublic, searchQuery, sortBy]);

  // 답변 완료된 모범 해결 건들 (하단 하이라이트용)
  const resolvedComplaints = complaints.filter(c => c.status === 'answered');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in text-zinc-900">
      
      {/* ============================================================ */}
      {/* 1. 상단 타이틀 & 가로 카테고리 알약 탭 (와이어프레임 Screen 2/3 상단) */}
      {/* ============================================================ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              불만 & 건의사항 목록
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              총 <strong>{filteredComplaints.length}</strong>건의 익명 안건이 실시간 처리 및 대화 진행 중입니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 border border-zinc-300 rounded text-xs font-semibold"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>필터 ({selectedCategory !== '전체' || selectedStatus !== 'all' ? '적용중' : '기본'})</span>
            </button>

            <button
              onClick={onOpenWriteModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 불만 접수</span>
            </button>
          </div>
        </div>

        {/* 상단 가로 카테고리 탭 (와이어프레임 Screen 2/3 상단 알약 필터) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-zinc-200">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 text-xs font-semibold rounded border transition-all ${
                selectedCategory === cat
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. 메인 바디: 좌측 사이드바 필터 + 우측 카드 그리드 (와이어프레임 구조) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* ============================================================ */}
        {/* 좌측 사이드바 필터 컬럼 (Screen 2 & 3 Left Sidebar) */}
        {/* ============================================================ */}
        <aside className={`md:col-span-3 space-y-6 ${isMobileFilterOpen ? 'block' : 'hidden md:block'}`}>
          <div className="bg-white p-5 rounded-lg border border-zinc-200 space-y-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <span className="font-bold text-sm text-zinc-900">Filter</span>
              <button
                onClick={() => {
                  setSelectedCategory('전체');
                  setSelectedStatus('all');
                  setOnlySecret(false);
                  setOnlyPublic(false);
                  setSortBy('latest');
                  onSearchChange('');
                }}
                className="text-[11px] text-zinc-400 hover:text-black underline"
              >
                초기화
              </button>
            </div>

            {/* 필터 1: 카테고리 아코디언 */}
            <div className="space-y-3">
              <button
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="w-full flex items-center justify-between text-xs font-bold text-zinc-800"
              >
                <span>카테고리 구분</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCategoryOpen && (
                <div className="space-y-1.5 pl-1 pt-1 text-xs text-zinc-600">
                  {CATEGORIES.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer hover:text-black">
                      <input
                        type="radio"
                        name="category_filter"
                        checked={selectedCategory === cat}
                        onChange={() => setSelectedCategory(cat)}
                        className="rounded-full text-zinc-900 focus:ring-zinc-900"
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 필터 2: 진행 상태 아코디언 */}
            <div className="space-y-3 pt-3 border-t border-zinc-100">
              <button
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-full flex items-center justify-between text-xs font-bold text-zinc-800"
              >
                <span>처리 진행 상태</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
              </button>
              {isStatusOpen && (
                <div className="space-y-1.5 pl-1 pt-1 text-xs text-zinc-600">
                  {[
                    { val: 'all', label: '전체 상태 보기' },
                    { val: 'pending', label: '접수 대기 중' },
                    { val: 'in_progress', label: '검토 및 처리 중' },
                    { val: 'follow_up', label: '대화형 질의 진행 중' },
                    { val: 'answered', label: '공식 답변 완료' },
                  ].map((st) => (
                    <label key={st.val} className="flex items-center gap-2 cursor-pointer hover:text-black">
                      <input
                        type="radio"
                        name="status_filter"
                        checked={selectedStatus === st.val}
                        onChange={() => setSelectedStatus(st.val)}
                        className="rounded-full text-zinc-900 focus:ring-zinc-900"
                      />
                      <span>{st.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 필터 3: 공개/비밀글 구분 */}
            <div className="space-y-3 pt-3 border-t border-zinc-100">
              <button
                onClick={() => setIsTypeOpen(!isTypeOpen)}
                className="w-full flex items-center justify-between text-xs font-bold text-zinc-800"
              >
                <span>공개 여부</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isTypeOpen ? 'rotate-180' : ''}`} />
              </button>
              {isTypeOpen && (
                <div className="space-y-2 pl-1 pt-1 text-xs text-zinc-600">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlyPublic}
                      onChange={(e) => {
                        setOnlyPublic(e.target.checked);
                        if (e.target.checked) setOnlySecret(false);
                      }}
                      className="rounded text-zinc-900 focus:ring-zinc-900"
                    />
                    <span>공개글만 보기</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlySecret}
                      onChange={(e) => {
                        setOnlySecret(e.target.checked);
                        if (e.target.checked) setOnlyPublic(false);
                      }}
                      className="rounded text-zinc-900 focus:ring-zinc-900"
                    />
                    <span>비밀글만 보기</span>
                  </label>
                </div>
              )}
            </div>

            {/* 정렬 옵션 */}
            <div className="pt-3 border-t border-zinc-100 space-y-2">
              <label className="block text-xs font-bold text-zinc-800">목록 정렬</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded p-2 text-zinc-700 focus:outline-none focus:border-zinc-900"
              >
                <option value="latest">최신 등록순</option>
                <option value="likes">공감 많은 순</option>
                <option value="views">조회수 많은 순</option>
              </select>
            </div>

          </div>
        </aside>

        {/* ============================================================ */}
        {/* 우측 메인 콘텐츠: 카드 그리드 (Screen 2 & 3 Right Grid) */}
        {/* ============================================================ */}
        <main className="md:col-span-9 space-y-6">
          
          {filteredComplaints.length === 0 ? (
            <div className="bg-white rounded-lg border border-zinc-200 p-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">선택된 조건의 불만이 없습니다.</h3>
              <p className="text-xs text-zinc-500">필터를 재설정하시거나 새 불만을 등록해주세요.</p>
              <button
                onClick={onOpenWriteModal}
                className="px-4 py-2 bg-zinc-900 text-white rounded text-xs font-semibold"
              >
                새 불만 접수하기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredComplaints.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectComplaint(item)}
                  className="bg-white rounded-lg border border-zinc-200 p-4 hover:border-zinc-900 transition-colors cursor-pointer flex flex-col justify-between group shadow-2xs"
                >
                  <div className="space-y-3">
                    {/* 카드 상단 회색 비주얼 영역 (와이어프레임 구조) */}
                    <div className="bg-zinc-100 rounded aspect-[16/10] border border-zinc-200 flex flex-col justify-between p-3 relative group-hover:bg-zinc-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-zinc-600 bg-white px-2 py-0.5 rounded border border-zinc-200">
                          {item.ticket_number}
                        </span>
                        {item.is_secret && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            <Lock className="w-3 h-3" />
                            비밀글
                          </span>
                        )}
                      </div>

                      <div className="text-center font-mono text-xs text-zinc-400">
                        VOICE #{item.category}
                      </div>

                      {/* 상태 인디케이터 배지 */}
                      <div className="self-end">
                        {item.status === 'answered' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            답변 완료
                          </span>
                        )}
                        {item.status === 'follow_up' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                            대화 진행 중
                          </span>
                        )}
                        {item.status === 'in_progress' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                            처리 검토 중
                          </span>
                        )}
                        {item.status === 'pending' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 text-zinc-700">
                            접수 대기
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 카드 제목 & 본문 스니펫 */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold text-zinc-400">#{item.category}</div>
                      <h3 className="font-bold text-sm text-zinc-900 group-hover:underline line-clamp-2 leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                        {item.is_secret ? '🔒 작성자와 관리자만 볼 수 있는 비밀글입니다.' : item.content}
                      </p>
                    </div>
                  </div>

                  {/* 카드 하단 메타 바 */}
                  <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
                    <div>
                      <span>{item.author_alias}</span> • <span>{formatRelativeTime(item.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => onToggleLike(item.id, e)}
                        className="flex items-center gap-1 hover:text-rose-600 transition-colors"
                        title="공감하기"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span className="font-semibold text-zinc-700">{item.likes_count}</span>
                      </button>
                      <div className="flex items-center gap-0.5">
                        <Eye className="w-3 h-3" />
                        <span>{item.view_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ============================================================ */}
          {/* 3. 하단 추천/해결 안건 섹션 (와이어프레임 하단 Bestsellers 섹션 구조) */}
          {/* ============================================================ */}
          {resolvedComplaints.length > 0 && (
            <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-200 space-y-4 mt-12">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-zinc-900">신속하게 해결된 대표 안건</h3>
                  <p className="text-xs text-zinc-500">운영팀의 공식 조치와 피드백이 완료된 주요 사례입니다.</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setBottomCarouselIdx(prev => Math.max(0, prev - 1))}
                    disabled={bottomCarouselIdx === 0}
                    className="p-1.5 rounded border border-zinc-300 bg-white hover:bg-zinc-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setBottomCarouselIdx(prev => Math.min(resolvedComplaints.length - 2, prev + 1))}
                    disabled={bottomCarouselIdx >= resolvedComplaints.length - 2}
                    className="p-1.5 rounded border border-zinc-300 bg-white hover:bg-zinc-100 disabled:opacity-40"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resolvedComplaints.slice(bottomCarouselIdx, bottomCarouselIdx + 2).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectComplaint(item)}
                    className="bg-white p-4 rounded border border-zinc-200 hover:border-zinc-900 transition-colors cursor-pointer flex items-center gap-4"
                  >
                    <div className="w-16 h-16 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center font-mono text-[10px] text-zinc-500 flex-shrink-0">
                      RESOLVED
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        조치 완료
                      </span>
                      <h4 className="font-bold text-xs text-zinc-900 truncate">{item.title}</h4>
                      <p className="text-[11px] text-zinc-400">공감 {item.likes_count}명 • {formatRelativeTime(item.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>

      </div>

    </div>
  );
};
