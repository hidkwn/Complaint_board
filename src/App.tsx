import React, { useState, useEffect, useCallback } from 'react';
import type { Complaint, ComplaintStatus } from './types';
import { api } from './lib/supabase';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { ComplaintList } from './components/ComplaintList';
import { ComplaintLookupView } from './components/ComplaintLookupView';
import { ComplaintWriteModal } from './components/ComplaintWriteModal';
import { ComplaintDetailModal } from './components/ComplaintDetailModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { ShieldCheck, Heart } from 'lucide-react';

export const App: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  // 와이어프레임 구조에 맞춘 뷰: 'home' (Screen 1), 'list' (Screen 2 & 3), 'lookup' (전용 조회)
  const [currentView, setCurrentView] = useState<'home' | 'list' | 'lookup'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 모달 상태
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailInitialUnlocked, setDetailInitialUnlocked] = useState(false);
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);

  // 관리자 권한 상태 (세션 저장)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('anon_admin_active') === 'true';
  });

  // 토스트 알림 메시지
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // 불만 목록 갱신
  const loadComplaints = useCallback(async () => {
    const list = await api.getComplaints();
    setComplaints(list);
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  // 불만 선택 (상세 보기 열기)
  const handleSelectComplaint = (complaint: Complaint, initialUnlocked = false) => {
    api.incrementViewCount(complaint.id);
    setSelectedComplaint(complaint);
    setDetailInitialUnlocked(initialUnlocked);
    setIsDetailOpen(true);
    setComplaints(prev => prev.map(c => c.id === complaint.id ? { ...c, view_count: c.view_count + 1 } : c));
  };

  // 불만 신규 등록
  const handleCreateComplaint = async (data: any) => {
    const created = await api.createComplaint(data);
    await loadComplaints();
    showToast(`불만 접수가 완료되었습니다. [${created.ticket_number}]`);
    return created;
  };

  // 등록 완료 후 상세창 바로 열기
  const handleSuccessCreated = (newComplaint: Complaint) => {
    setCurrentView('list');
    handleSelectComplaint(newComplaint, true);
  };

  // 상태 변경 (관리자)
  const handleUpdateStatus = async (id: string, status: ComplaintStatus) => {
    await api.updateComplaintStatus(id, status);
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    if (selectedComplaint && selectedComplaint.id === id) {
      setSelectedComplaint(prev => prev ? { ...prev, status } : null);
    }
    showToast('진행 상태가 변경되었습니다.');
  };

  // 불만 삭제
  const handleDeleteComplaint = async (id: string) => {
    await api.deleteComplaint(id);
    await loadComplaints();
    showToast('불만이 정상 삭제되었습니다.');
  };

  // 공감(좋아요) 토글
  const handleToggleLike = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newCount = await api.toggleLike(id);
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, likes_count: newCount } : c));
    if (selectedComplaint && selectedComplaint.id === id) {
      setSelectedComplaint(prev => prev ? { ...prev, likes_count: newCount } : null);
    }
  };

  // 대화형 메시지 전송
  const handleSendConversationMessage = async (
    complaintId: string, 
    text: string, 
    senderType: 'admin' | 'author', 
    senderName: string
  ) => {
    await api.addConversationMessage({
      complaint_id: complaintId,
      sender_type: senderType,
      sender_name: senderName,
      message: text,
    });
    await loadComplaints();
    if (selectedComplaint && selectedComplaint.id === complaintId) {
      const nextStatus: ComplaintStatus = senderType === 'author' ? 'follow_up' : 'answered';
      setSelectedComplaint(prev => prev ? { ...prev, status: nextStatus } : null);
    }
    showToast(senderType === 'admin' ? '공식 답변이 전송되었습니다.' : '추가 문의가 전송되었습니다.');
  };

  // 댓글 추가
  const handleAddComment = async (complaintId: string, author: string, content: string) => {
    await api.addComment({
      complaint_id: complaintId,
      author_alias: author,
      content,
    });
    showToast('댓글이 등록되었습니다.');
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: string) => {
    await api.deleteComment(commentId);
    showToast('댓글이 삭제되었습니다.');
  };

  // 관리자 모드 활성화
  const handleActivateAdmin = () => {
    setIsAdmin(true);
    sessionStorage.setItem('anon_admin_active', 'true');
    showToast('관리자 모드가 활성화되었습니다. (공식 답변 작성 및 상태 제어 가능)');
  };

  // 관리자 로그아웃
  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('anon_admin_active');
    showToast('관리자 모드가 해제되었습니다.');
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col justify-between selection:bg-zinc-900 selection:text-white">
      
      {/* 1. 상단 글로벌 네비게이션 헤더 (와이어프레임 구조) */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenWriteModal={() => setIsWriteOpen(true)}
        isAdmin={isAdmin}
        onOpenAdminModal={() => setIsAdminAuthOpen(true)}
        onLogoutAdmin={handleLogoutAdmin}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 관리자 활성 상태 알림 바 */}
      {isAdmin && (
        <div className="bg-emerald-600 text-white text-xs py-2 px-4 text-center font-bold flex items-center justify-center gap-2 shadow-sm animate-fade-in">
          <ShieldCheck className="w-4 h-4" />
          <span>운영팀 관리자 모드 활성화됨 (공식 답변 및 진행 상태 제어 가능)</span>
          <button
            onClick={handleLogoutAdmin}
            className="underline ml-2 hover:text-emerald-200"
          >
            종료
          </button>
        </div>
      )}

      {/* 2. 메인 콘텐츠 뷰 */}
      <main className="flex-1 pb-16">
        {currentView === 'home' && (
          <HomeView
            complaints={complaints}
            onSelectComplaint={handleSelectComplaint}
            onNavigateToList={() => setCurrentView('list')}
            onNavigateToLookup={() => setCurrentView('lookup')}
            onOpenWriteModal={() => setIsWriteOpen(true)}
          />
        )}

        {currentView === 'list' && (
          <ComplaintList
            complaints={complaints}
            onSelectComplaint={handleSelectComplaint}
            onOpenWriteModal={() => setIsWriteOpen(true)}
            onToggleLike={handleToggleLike}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {currentView === 'lookup' && (
          <ComplaintLookupView
            complaints={complaints}
            onSelectComplaint={handleSelectComplaint}
            onOpenWriteModal={() => setIsWriteOpen(true)}
          />
        )}
      </main>

      {/* 3. 하단 와이어프레임 스타일 다크/라이트 푸터 */}
      <footer className="bg-zinc-900 text-zinc-400 py-12 px-4 border-t border-zinc-800 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-zinc-800">
          <div className="space-y-3">
            <div className="inline-block px-3 py-1 border border-zinc-700 text-white font-mono font-bold text-xs uppercase">
              VOICE BOX
            </div>
            <p className="text-zinc-500 leading-relaxed text-[11px]">
              사내 구성원의 모든 불편과 제안을 100% 완전 익명으로 수렴하고 소통하는 열린 신문고 플랫폼입니다.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-white font-bold text-xs">바로가기</div>
            <ul className="space-y-1 text-zinc-500">
              <li><button onClick={() => setCurrentView('home')} className="hover:text-white">홈 커버</button></li>
              <li><button onClick={() => setCurrentView('list')} className="hover:text-white">전체 불만 목록</button></li>
              <li><button onClick={() => setCurrentView('lookup')} className="hover:text-white">불만 바로 조회</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="text-white font-bold text-xs">안심 보장 정책</div>
            <ul className="space-y-1 text-zinc-500">
              <li>IP 주소 및 사용자 식별자 미수집</li>
              <li>비밀번호 SHA-256 단방향 암호화</li>
              <li>대화형 실시간 질의응답 보장</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="text-white font-bold text-xs">접수 문의 & 운영</div>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              운영팀 관리자 모드는 상단 [관리자] 버튼을 통해 접속하실 수 있습니다.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-zinc-600 text-[11px]">
          <span>© 2026 VOICE BOX COMMUNITY. ALL RIGHTS RESERVED.</span>
          <span className="flex items-center gap-1">
            <span>Designed with care for a better workplace</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          </span>
        </div>
      </footer>

      {/* 불만 접수 작성 모달 */}
      <ComplaintWriteModal
        isOpen={isWriteOpen}
        onClose={() => setIsWriteOpen(false)}
        onSubmit={handleCreateComplaint}
        onSuccessCreated={handleSuccessCreated}
      />

      {/* 불만 상세 보기 및 대화형 추가 문의 모달 */}
      <ComplaintDetailModal
        complaint={selectedComplaint}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedComplaint(null);
        }}
        isAdmin={isAdmin}
        initialUnlocked={detailInitialUnlocked}
        onUpdateStatus={handleUpdateStatus}
        onDeleteComplaint={handleDeleteComplaint}
        onToggleLike={handleToggleLike}
        getConversationMessages={api.getConversationMessages.bind(api)}
        onSendConversationMessage={handleSendConversationMessage}
        getComments={api.getComments.bind(api)}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
      />

      {/* 관리자 PIN 인증 모달 */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={handleActivateAdmin}
      />

      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded shadow-xl border border-zinc-700 animate-fade-in flex items-center gap-2">
          <span>📢</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
