import { useEffect, useState } from 'react';
import { ArrowLeft, EyeOff, PenLine, Search } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { PostCard } from '../components/common/PostCard';
import { useAuth } from '../hooks/useAuth';
import { usePosts } from '../hooks/usePosts';
import { supabase } from '../lib/supabaseClient';
import type { Board, SortOrder } from '../types/community';

export function BoardPage() {
  const { boardId = '' } = useParams();
  const { user, profile } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOrder>('latest');
  const [boardError, setBoardError] = useState('');
  const [boardLoading, setBoardLoading] = useState(true);
  const { posts, loading: postsLoading, error: postsError } = usePosts(boardId, search, sort, user?.id);
  const error = boardError || postsError;
  const loading = boardLoading || postsLoading;

  useEffect(() => {
    if (!supabase) { setBoardLoading(false); return; }
    const client = supabase;
    let active = true;
    setBoardLoading(true);
    setBoardError('');
    const loadBoard = async () => {
      try {
        const { data, error: loadError } = await client.from('boards').select('*').eq('id', boardId).maybeSingle();
        if (!active) return;
        if (loadError) setBoardError(loadError.message);
        else if (!data) setBoardError('게시판을 찾을 수 없거나 접근 권한이 없습니다.');
        else setBoard(data as Board);
      } catch (loadError) {
        if (active) setBoardError(loadError instanceof Error ? loadError.message : '게시판을 불러오지 못했습니다.');
      } finally {
        if (active) setBoardLoading(false);
      }
    };
    void loadBoard();
    return () => { active = false; };
  }, [boardId, profile?.role]);

  return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
    <Link to="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-700"><ArrowLeft size={16} />게시판 목록</Link>
    <div className="mb-7 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-end sm:justify-between sm:p-8">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-indigo-600">Board</p><h1 className="mt-1 flex flex-wrap items-center gap-2 text-3xl font-black text-slate-900">{board?.title ?? '게시판'}{board?.is_anonymous && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"><EyeOff size={13} />익명</span>}</h1><p className="mt-2 text-sm text-slate-500">{board?.description}</p></div>
      {user && <Link to={`/write?board=${boardId}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700"><PenLine size={16} />새 글 작성</Link>}
    </div>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row">
      <label className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="제목과 내용 검색" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-400" /></label>
      <select value={sort} onChange={(event) => setSort(event.target.value as SortOrder)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400"><option value="latest">최신순</option><option value="likes">추천순</option><option value="views">조회수순</option></select>
    </div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
    {loading ? <p className="py-16 text-center text-sm text-slate-500">게시글을 불러오는 중입니다…</p> : !error && posts.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">검색 결과가 없습니다. 첫 게시글을 작성해 보세요.</div> : <div className="grid gap-4 md:grid-cols-2">{posts.map((post) => <PostCard key={post.id} post={post} />)}</div>}
  </main>;
}
