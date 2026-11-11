import { useCallback, useState } from 'react';
import { Bell, LogIn, LogOut, MessageSquareText, Shield, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeNotifications } from '../../hooks/useRealtime';
import type { Notification } from '../../types/community';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState<Notification | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const onNewNotification = useCallback((notification: Notification) => {
    setToast(notification);
    window.setTimeout(() => setToast(null), 4200);
  }, []);
  const { notifications, unreadCount, markRead } = useRealtimeNotifications(onNewNotification);

  const openNotification = async (item: Notification) => {
    try {
      if (!item.is_read) await markRead(item.id);
      setShowNotifications(false);
      navigate(item.target_url);
    } catch (error) {
      console.error('알림을 읽음 처리하지 못했습니다.', error);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2 font-extrabold tracking-tight text-slate-900">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white"><MessageSquareText size={19} /></span>
            <span>모아<span className="text-indigo-600">보드</span></span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 sm:flex">
            <Link to="/" className="hover:text-indigo-600">커뮤니티</Link>
            {profile?.role === 'admin' && <Link to="/admin" className="hover:text-indigo-600">관리자</Link>}
            {(profile?.role === 'moderator' || profile?.role === 'admin') && profile.role !== 'admin' && <Link to="/admin" className="hover:text-indigo-600">운영 도구</Link>}
          </nav>
          <div className="flex items-center gap-2">
            {user && (
              <div className="relative">
                <button aria-label="알림" onClick={() => setShowNotifications((shown) => !shown)} className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100">
                  <Bell size={19} />
                  {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unreadCount}</span>}
                </button>
                {showNotifications && <div className="absolute right-0 top-12 z-40 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b border-slate-100 px-4 py-3 font-bold">알림</div>
                  {notifications.length === 0 ? <p className="p-5 text-sm text-slate-500">새 알림이 없습니다.</p> : <ul className="max-h-80 overflow-y-auto">
                    {notifications.map((item) => <li key={item.id}><button onClick={() => void openNotification(item)} className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-50 ${item.is_read ? 'text-slate-500' : 'bg-indigo-50/60 text-slate-800'}`}><span>{item.message}</span><span className="mt-1 block text-xs text-slate-400">{new Date(item.created_at).toLocaleString('ko-KR')}</span></button></li>)}
                  </ul>}
                </div>}
              </div>
            )}
            {user ? <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 text-sm font-semibold text-slate-700 md:flex"><UserRound size={16} />{profile?.nickname ?? user.email}</span>
              <button onClick={() => void signOut().then(() => navigate('/')).catch((error: unknown) => alert(error instanceof Error ? error.message : '로그아웃에 실패했습니다.'))} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="로그아웃"><LogOut size={17} /></button>
            </div> : <Link to="/login" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><LogIn size={16} />로그인</Link>}
          </div>
        </div>
        <nav className="flex items-center justify-center gap-7 border-t border-slate-100 py-2 text-xs font-semibold text-slate-600 sm:hidden">
          <Link to="/" className="hover:text-indigo-600">커뮤니티</Link>
          {(profile?.role === 'admin' || profile?.role === 'moderator') && <Link to="/admin" className="hover:text-indigo-600">{profile.role === 'admin' ? '관리자' : '운영 도구'}</Link>}
        </nav>
      </header>
      {toast && <button onClick={() => openNotification(toast)} className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl bg-slate-900 px-5 py-4 text-left text-sm text-white shadow-xl"><span className="mb-1 flex items-center gap-2 font-bold"><Bell size={16} />새 알림</span>{toast.message}</button>}
      {(profile?.role === 'admin' || profile?.role === 'moderator') && <div className="border-b border-indigo-100 bg-indigo-50 px-4 py-2 text-center text-xs font-semibold text-indigo-800"><Shield size={13} className="mr-1 inline" />{profile.role === 'admin' ? '관리자 권한' : '운영자 권한'}으로 접속 중</div>}
    </>
  );
}
