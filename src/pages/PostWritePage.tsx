import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, EyeOff, LoaderCircle, Paperclip, Send } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import type { Board, Post } from '../types/community';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain']);

export function PostWritePage() {
  const { postId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardId, setBoardId] = useState(searchParams.get('board') ?? '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notice, setNotice] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(postId));
  const canModerate = profile?.role === 'moderator' || profile?.role === 'admin';
  const selectedBoard = boards.find((board) => board.id === boardId);
  const anonymousRequired = Boolean(selectedBoard?.is_anonymous);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.from('boards').select('*').order('title').then(({ data, error: boardError }) => {
      if (!active) return;
      if (boardError) setError(`게시판을 불러오지 못했습니다: ${boardError.message}`);
      else {
        const available = (data ?? []) as Board[];
        const filtered = available.filter((board) => !board.is_admin_only || profile?.role === 'admin');
        setBoards(filtered);
        if (!boardId && filtered[0]) setBoardId(filtered[0].id);
      }
    });
    return () => { active = false; };
  }, [profile?.role]);

  useEffect(() => {
    if (!postId || !supabase) { setLoading(false); return; }
    let active = true;
    void supabase.from('posts').select('*').eq('id', postId).single().then(({ data, error: postError }) => {
      if (!active) return;
      if (postError) setError(`게시글을 불러오지 못했습니다: ${postError.message}`);
      else {
        const post = data as Post;
        if (post.author_id !== user?.id) setError('본인이 작성한 게시글만 수정할 수 있습니다.');
        else {
          setBoardId(post.board_id);
          setTitle(post.title);
          setContent(post.content);
          setNotice(post.is_notice);
          setAnonymous(post.is_anonymous);
        }
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [postId, user?.id]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !user) { setError('게시글을 작성하려면 로그인해 주세요.'); return; }
    if (profile?.is_suspended) { setError('계정 이용이 정지되어 게시글을 작성할 수 없습니다.'); return; }
    if (!boardId) { setError('게시판을 선택해 주세요.'); return; }
    if (!title.trim() || !content.trim()) { setError('제목과 내용을 입력해 주세요.'); return; }
    const invalidFile = files.find((file) => file.size > MAX_FILE_SIZE || !ALLOWED_TYPES.has(file.type));
    if (invalidFile) {
      setError(`${invalidFile.name}: 허용된 파일 형식(PNG/JPEG/GIF/WebP/PDF/TXT)과 10MB 제한을 확인해 주세요.`);
      return;
    }
    setBusy(true);
    setError('');
    const uploadedPaths: string[] = [];
    let newlyCreatedPostId: string | null = null;
    try {
      let savedPost: Post;
      if (postId) {
        const { data, error: updateError } = await supabase.from('posts').update({
          title: title.trim(), content: content.trim(), is_anonymous: anonymous || anonymousRequired, updated_at: new Date().toISOString(),
        }).eq('id', postId).select('*').single();
        if (updateError) throw updateError;
        savedPost = data as Post;
      } else {
        const { data, error: insertError } = await supabase.from('posts').insert({
          board_id: boardId, author_id: user.id, title: title.trim(), content: content.trim(), is_notice: canModerate && notice, is_anonymous: anonymous || anonymousRequired,
        }).select('*').single();
        if (insertError) throw insertError;
        savedPost = data as Post;
        newlyCreatedPostId = savedPost.id;
      }

      for (const file of files) {
        const safeName = file.name.replace(/[^\w.-]/g, '_').slice(-100) || 'attachment';
        const path = `${savedPost.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('board-files').upload(path, file, { upsert: false, contentType: file.type });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
        const { error: attachmentError } = await supabase.from('attachments').insert({
          post_id: savedPost.id, file_path: path, file_name: file.name, file_size: file.size,
        });
        if (attachmentError) throw attachmentError;
      }
      navigate(`/posts/${savedPost.id}`);
    } catch (submitError) {
      if (uploadedPaths.length) {
        const { error: cleanupError } = await supabase.storage.from('board-files').remove(uploadedPaths);
        if (cleanupError) console.error('업로드에 실패한 첨부 파일 정리도 실패했습니다.', cleanupError);
      }
      if (newlyCreatedPostId) {
        const { error: cleanupError } = await supabase.from('posts').delete().eq('id', newlyCreatedPostId);
        if (cleanupError) console.error('업로드 실패 후 게시글 정리도 실패했습니다.', cleanupError);
      }
      setError(submitError instanceof Error ? submitError.message : '게시글 저장에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  if (!user) return <main className="flex flex-1 flex-col items-center justify-center p-8 text-center"><p className="font-bold">로그인이 필요합니다.</p><Link to="/login" className="mt-3 text-indigo-700 underline">로그인하기</Link></main>;
  if (loading) return <main className="flex flex-1 items-center justify-center p-12"><LoaderCircle className="animate-spin text-indigo-600" /></main>;

  return <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
    <Link to={postId ? `/posts/${postId}` : '/'} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-700"><ArrowLeft size={16} />돌아가기</Link>
    <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
      <h1 className="text-2xl font-black text-slate-900">{postId ? '게시글 수정' : '새 게시글'}</h1>
      <p className="mt-2 text-sm text-slate-500">서로 존중하는 마음으로 이야기를 나눠 주세요.</p>
      <label className="mt-7 block text-sm font-bold text-slate-700">게시판<select required disabled={Boolean(postId)} value={boardId} onChange={(event) => {
        const nextBoardId = event.target.value;
        const nextBoard = boards.find((board) => board.id === nextBoardId);
        setBoardId(nextBoardId);
        if (nextBoard?.is_anonymous) setAnonymous(true);
      }} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-indigo-400 disabled:bg-slate-50"><option value="" disabled>게시판 선택</option>{boards.map((board) => <option key={board.id} value={board.id}>{board.title}{board.is_anonymous ? ' · 익명' : ''}</option>)}</select></label>
      <label className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${anonymousRequired ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-slate-50'}`}>
        <input type="checkbox" checked={anonymous || anonymousRequired} disabled={anonymousRequired} onChange={(event) => setAnonymous(event.target.checked)} className="mt-0.5 h-4 w-4 accent-indigo-600" />
        <span><span className="flex items-center gap-1.5 text-sm font-bold text-slate-800"><EyeOff size={15} />익명으로 작성</span><span className="mt-1 block text-xs leading-5 text-slate-500">{anonymousRequired ? '익명 게시판의 글은 항상 익명으로 표시됩니다.' : '다른 이용자에게 작성자 닉네임 대신 익명으로 표시됩니다.'}</span></span>
      </label>
      <label className="mt-5 block text-sm font-bold text-slate-700">제목<input required maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-base font-normal outline-none focus:border-indigo-400" placeholder="제목을 입력해 주세요" /></label>
      <label className="mt-5 block text-sm font-bold text-slate-700">내용<textarea required maxLength={50000} rows={12} value={content} onChange={(event) => setContent(event.target.value)} className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal leading-7 outline-none focus:border-indigo-400" placeholder="내용을 입력해 주세요" /></label>
      {canModerate && <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={notice} onChange={(event) => setNotice(event.target.checked)} className="h-4 w-4 accent-indigo-600" />공지사항으로 등록</label>}
      <label className="mt-5 flex cursor-pointer flex-col gap-2 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 hover:border-indigo-400"><span className="flex items-center gap-2 font-semibold"><Paperclip size={16} />파일 첨부 <span className="text-xs font-normal text-slate-400">(파일당 최대 10MB, 이미지/PDF/TXT)</span></span><input type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} className="text-xs" />{files.map((file) => <span key={`${file.name}-${file.lastModified}`} className="text-xs text-slate-500">{file.name}</span>)}</label>
      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <button disabled={busy || profile?.is_suspended} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin" size={18} /> : <Send size={17} />}{postId ? '수정 완료' : '게시글 등록'}</button>
    </form>
  </main>;
}
