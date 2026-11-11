import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, EyeOff, MessageSquareText, Plus, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PostCard } from '../components/common/PostCard';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import type { Board, Post } from '../types/community';

export function HomePage() {
  const { user, profile } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [samplePosts, setSamplePosts] = useState<Post[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    Promise.all([
      supabase.from('boards').select('*').order('created_at'),
      supabase.from('posts').select('*,author:profiles!posts_author_id_fkey(id,nickname,avatar_url),board:boards!posts_board_id_fkey(title)').eq('is_sample', false).order('created_at', { ascending: false }).limit(5),
      supabase.from('posts').select('*,author:profiles!posts_author_id_fkey(id,nickname,avatar_url),board:boards!posts_board_id_fkey(title)').eq('is_sample', true).order('created_at', { ascending: false }),
    ]).then(([boardResult, postResult, sampleResult]) => {
      if (!active) return;
      if (boardResult.error || postResult.error || sampleResult.error) {
        setError(boardResult.error?.message ?? postResult.error?.message ?? sampleResult.error?.message ?? '게시판 정보를 불러오지 못했습니다.');
        return;
      }
      setBoards((boardResult.data ?? []) as Board[]);
      setPosts(((postResult.data ?? []) as Post[]).filter((post) => !post.is_sample));
      setSamplePosts((sampleResult.data ?? []) as Post[]);
    });
    return () => { active = false; };
  }, [user?.id]);

  return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-700 px-6 py-10 text-white sm:px-12 sm:py-14">
      <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border-[34px] border-white/5" />
      <div className="relative max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100"><Sparkles size={14} />함께 나누고, 더 나은 커뮤니티를 만들어요</span>
        <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-5xl">좋은 대화가 모이는<br />우리들의 게시판</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-indigo-100 sm:text-base">관심 있는 주제로 이야기를 나누고, 서로의 생각을 존중하며 새로운 인사이트를 발견해 보세요.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="#boards" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 hover:bg-indigo-50">게시판 둘러보기<ArrowRight size={16} /></a>
          {user ? <Link to="/write" className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20"><Plus size={16} />글쓰기</Link> : <Link to="/login" className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20">로그인하고 참여하기</Link>}
        </div>
      </div>
    </section>

    {profile?.is_suspended && <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">계정이 이용 정지 상태입니다. 게시글 및 댓글 작성이 제한됩니다.</div>}
    <section id="boards" className="mt-12">
      <div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-indigo-600">Explore</p><h2 className="mt-1 text-2xl font-extrabold text-slate-900">게시판 둘러보기</h2></div></div>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">게시판을 불러오지 못했습니다: {error}</p>}
      {!error && boards.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500"><BookOpen className="mx-auto mb-2" />아직 게시판이 없습니다. 관리자 권한으로 첫 게시판을 만들어 주세요.</div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {boards.map((board) => <Link key={board.id} to={`/boards/${board.id}`} className="flex min-h-36 items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-md"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><MessageSquareText /></span><span className="min-w-0 flex-1"><span className="block font-bold text-slate-900">{board.title}</span><span className="mt-2 block text-sm leading-6 text-slate-500">{board.description || '자유롭게 이야기를 나눠 보세요.'}</span>{(board.is_admin_only || board.is_anonymous) && <span className="mt-3 flex flex-wrap gap-3">{board.is_admin_only && <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600"><ShieldCheck size={13} />관리자 전용</span>}{board.is_anonymous && <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"><EyeOff size={13} />익명 게시판</span>}</span>}</span><ArrowRight size={16} className="mt-1 text-slate-300" /></Link>)}
      </div>
    </section>
    {samplePosts.length > 0 && <section className="mt-12">
      <div className="mb-5"><p className="text-xs font-bold uppercase tracking-[.18em] text-indigo-600">Get inspired</p><h2 className="mt-1 text-2xl font-extrabold text-slate-900">이런 이야기를 나눠 보세요</h2><p className="mt-2 text-sm text-slate-500">게시판을 둘러볼 수 있도록 준비한 예시 게시글입니다.</p></div>
      <div className="grid gap-4 md:grid-cols-2">{samplePosts.map((post) => <PostCard key={post.id} post={post} />)}</div>
    </section>}
    <section className="mt-12">
      <div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-indigo-600">Community</p><h2 className="mt-1 text-2xl font-extrabold text-slate-900">최근 게시글</h2></div></div>
      {posts.length > 0 ? <div className="grid gap-4 md:grid-cols-2">{posts.map((post) => <PostCard key={post.id} post={post} />)}</div> : !error && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">첫 게시글을 기다리고 있어요.</div>}
    </section>
    <p className="mt-10 flex items-center justify-center gap-2 text-xs text-slate-400"><ShieldCheck size={14} />안전한 커뮤니티를 위해 신고 및 운영자 검토 기능을 제공합니다.</p>
  </main>;
}
