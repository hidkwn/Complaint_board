import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { Header } from './components/common/Header';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { isSupabaseConfigured } from './lib/supabaseClient';

const AdminPage = lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })));
const BoardPage = lazy(() => import('./pages/BoardPage').then((module) => ({ default: module.BoardPage })));
const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage').then((module) => ({ default: module.PostDetailPage })));
const PostWritePage = lazy(() => import('./pages/PostWritePage').then((module) => ({ default: module.PostWritePage })));

function CommunityApp() {
  const { loading, error } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-sm font-semibold text-slate-500">커뮤니티를 준비하고 있습니다…</div>;
  return <div className="flex min-h-screen flex-col">
    <Header />
    {!isSupabaseConfigured && <div role="alert" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">{error}</div>}
    {error && isSupabaseConfigured && <div role="alert" className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-800">{error}</div>}
    <Suspense fallback={<div className="flex flex-1 items-center justify-center p-16 text-sm text-slate-500">페이지를 불러오는 중입니다…</div>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/boards/:boardId" element={<BoardPage />} />
        <Route path="/posts/:postId" element={<PostDetailPage />} />
        <Route path="/posts/:postId/edit" element={<PostWritePage />} />
        <Route path="/write" element={<PostWritePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
    <footer className="mt-12 border-t border-slate-200 bg-white px-4 py-7 text-center text-xs text-slate-400">
      <Link to="/" className="font-bold text-slate-600">모아보드</Link><span className="mx-2">·</span>서로 존중하며 함께 만드는 커뮤니티
    </footer>
  </div>;
}

export default function App() {
  return <BrowserRouter><AuthProvider><CommunityApp /></AuthProvider></BrowserRouter>;
}
