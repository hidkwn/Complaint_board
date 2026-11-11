import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, Download, Eye, Heart, LoaderCircle, MessageCircle, Pencil, Send, ShieldAlert, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import type { Attachment, CommunityComment, Post } from '../types/community';

function isStaff(role?: string) {
  return role === 'admin' || role === 'moderator';
}

export function PostDetailPage() {
  const { postId = '' } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const viewedPostId = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) { setError('Supabase 환경 변수를 먼저 설정해 주세요.'); return; }
    const [postResult, attachmentResult, commentResult] = await Promise.all([
      supabase.from('posts').select('*,author:profiles!posts_author_id_fkey(id,nickname,avatar_url),board:boards!posts_board_id_fkey(title)').eq('id', postId).single(),
      supabase.from('attachments').select('*').eq('post_id', postId).order('created_at'),
      supabase.from('comments').select('*,author:profiles!comments_author_id_fkey(id,nickname,avatar_url)').eq('post_id', postId).order('created_at'),
    ]);
    if (postResult.error) throw postResult.error;
    if (attachmentResult.error) throw attachmentResult.error;
    if (commentResult.error) throw commentResult.error;
    setPost(postResult.data as Post);
    setAttachments((attachmentResult.data ?? []) as Attachment[]);
    setComments((commentResult.data ?? []) as CommunityComment[]);
    if (user) {
      const { data: likeRow, error: likeError } = await supabase.from('post_likes').select('post_id').eq('post_id', postId).eq('user_id', user.id).maybeSingle();
      if (likeError) throw likeError;
      setLiked(Boolean(likeRow));
    }
  }, [postId, user?.id]);

  useEffect(() => {
    let active = true;
    void load().then(async () => {
      if (active && supabase && viewedPostId.current !== postId) {
        viewedPostId.current = postId;
        const { error: viewError } = await supabase.rpc('increment_post_view', { target_post_id: postId });
        if (viewError) console.error('조회수를 업데이트하지 못했습니다.', viewError);
        else setPost((current) => current ? { ...current, view_count: current.view_count + 1 } : current);
      }
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : '게시글을 불러오지 못했습니다.');
    });
    return () => { active = false; };
  }, [load]);

  const run = async (action: () => Promise<void>) => {
    setError('');
    setBusy(true);
    try { await action(); }
    catch (actionError) {
      const message = actionError instanceof Error
        ? actionError.message
        : typeof actionError === 'object' && actionError !== null && 'message' in actionError && typeof actionError.message === 'string'
          ? actionError.message
          : '요청을 처리하지 못했습니다.';
      setError(message);
    }
    finally { setBusy(false); }
  };

  const toggleLike = () => run(async () => {
    if (!supabase || !user) throw new Error('추천하려면 먼저 로그인해 주세요.');
    if (profile?.is_suspended) throw new Error('이용 정지된 계정은 추천할 수 없습니다.');
    if (liked) {
      const { error: deleteError } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      if (deleteError) throw deleteError;
    } else {
      const { error: insertError } = await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
      if (insertError) throw insertError;
    }
    setLiked(!liked);
    setPost((current) => current ? { ...current, like_count: current.like_count + (liked ? -1 : 1) } : current);
  });

  const submitComment = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      if (!supabase || !user) throw new Error('댓글을 작성하려면 로그인해 주세요.');
      if (profile?.is_suspended) throw new Error('이용 정지된 계정은 댓글을 작성할 수 없습니다.');
      const content = commentText.trim();
      if (!content) throw new Error('댓글 내용을 입력해 주세요.');
      const { error: insertError } = await supabase.from('comments').insert({
        post_id: postId, author_id: user.id, parent_id: replyTo, content, is_anonymous: post?.is_anonymous ?? false,
      });
      if (insertError) throw insertError;
      setCommentText('');
      setReplyTo(null);
      await load();
    });
  };

  const saveComment = (commentId: string, value: string) => run(async () => {
    if (!supabase) throw new Error('Supabase에 연결할 수 없습니다.');
    if (!value.trim()) throw new Error('댓글 내용을 입력해 주세요.');
    const { error: updateError } = await supabase.from('comments').update({ content: value.trim() }).eq('id', commentId);
    if (updateError) throw updateError;
    setEditingComment(null);
    await load();
  });

  const report = (targetType: 'post' | 'comment', targetId: string) => {
    const reason = window.prompt('신고 사유를 입력해 주세요.');
    if (!reason?.trim()) return;
    void run(async () => {
      if (!supabase || !user) throw new Error('신고하려면 로그인해 주세요.');
      const { error: reportError } = await supabase.from('reports').insert({
        reporter_id: user.id, target_type: targetType, target_id: targetId, reason: reason.trim(),
      });
      if (reportError) throw reportError;
    });
  };

  const moderate = (type: 'post' | 'comment', id: string, hidden: boolean) => run(async () => {
    if (!supabase || !isStaff(profile?.role)) throw new Error('운영자 권한이 필요합니다.');
    const table = type === 'post' ? 'posts' : 'comments';
    const { error: updateError } = await supabase.from(table).update({ is_hidden: hidden }).eq('id', id);
    if (updateError) throw updateError;
    if (type === 'post') setPost((current) => current ? { ...current, is_hidden: hidden } : current);
    else await load();
  });

  const deleteComment = (id: string) => {
    if (!window.confirm('이 댓글을 삭제할까요?')) return;
    void run(async () => {
      if (!supabase) throw new Error('Supabase에 연결할 수 없습니다.');
      const { error: deleteError } = await supabase.from('comments').delete().eq('id', id);
      if (deleteError) throw deleteError;
      await load();
    });
  };

  const deletePost = () => {
    if (!post || !window.confirm('게시글과 첨부 파일, 댓글을 모두 삭제할까요?')) return;
    void run(async () => {
      if (!supabase) throw new Error('Supabase에 연결할 수 없습니다.');
      const { data: fileRows, error: filesError } = await supabase.from('attachments').select('file_path').eq('post_id', post.id);
      if (filesError) throw filesError;
      const paths = (fileRows ?? []).map((file) => file.file_path as string);
      if (paths.length) {
        const { error: storageError } = await supabase.storage.from('board-files').remove(paths);
        if (storageError) throw storageError;
      }
      const { error: deleteError } = await supabase.from('posts').delete().eq('id', post.id);
      if (deleteError) throw deleteError;
      navigate(`/boards/${post.board_id}`);
    });
  };

  const downloadAttachment = async (file: Attachment) => {
    if (!supabase) return;
    const { data, error: urlError } = await supabase.storage.from('board-files').createSignedUrl(file.file_path, 60);
    if (urlError) { setError(`파일을 다운로드할 수 없습니다: ${urlError.message}`); return; }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const rootComments = comments.filter((comment) => !comment.parent_id);

  return <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
    <Link to={post ? `/boards/${post.board_id}` : '/'} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-700"><ArrowLeft size={16} />게시판으로</Link>
    {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
    {!post && !error && <div className="flex justify-center p-16"><LoaderCircle className="animate-spin text-indigo-600" /></div>}
    {post && <>
      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">{post.is_notice && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">공지</span>}{post.is_sample && <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700">예시 글</span>}{post.is_anonymous && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">익명</span>}<span>{post.board?.title}</span><span>·</span><span>{post.is_sample ? '모아보드 예시' : post.is_anonymous ? '익명' : post.author?.nickname ?? '회원'}</span><span>·</span><time>{new Date(post.created_at).toLocaleString('ko-KR')}</time></div>
        {post.is_hidden ? <div className="my-9 rounded-2xl bg-slate-50 p-8 text-center text-slate-500">관리자에 의해 블라인드 처리된 게시물입니다.</div> : <>
          <h1 className="mt-5 break-words text-2xl font-black leading-snug text-slate-900 sm:text-3xl">{post.title}</h1>
          <p className="mt-6 min-h-32 whitespace-pre-wrap break-words text-[15px] leading-8 text-slate-700">{post.content}</p>
        </>}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-400"><div className="flex items-center gap-4"><span className="inline-flex items-center gap-1"><Eye size={16} />{post.view_count}</span><span className="inline-flex items-center gap-1"><MessageCircle size={16} />{comments.length}</span></div>
          <div className="flex items-center gap-2">
            {!post.is_hidden && <button onClick={() => void toggleLike()} disabled={busy} className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-bold ${liked ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Heart size={16} fill={liked ? 'currentColor' : 'none'} />{post.like_count}</button>}
            {user && user.id !== post.author_id && !isStaff(profile?.role) && <button onClick={() => report('post', post.id)} className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="게시글 신고"><ShieldAlert size={17} /></button>}
            {user?.id === post.author_id && <Link to={`/posts/${post.id}/edit`} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600" title="수정"><Pencil size={17} /></Link>}
            {(user?.id === post.author_id || isStaff(profile?.role)) && <button onClick={deletePost} className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="삭제"><Trash2 size={17} /></button>}
            {isStaff(profile?.role) && <button onClick={() => void moderate('post', post.id, !post.is_hidden)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">{post.is_hidden ? '블라인드 해제' : '블라인드'}</button>}
          </div>
        </div>
        {attachments.length > 0 && <div className="mt-5 border-t border-slate-100 pt-4"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">첨부 파일</p>{attachments.map((file) => <button key={file.id} onClick={() => void downloadAttachment(file)} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm text-indigo-700 hover:bg-indigo-50"><span className="truncate">{file.file_name} <span className="text-xs text-slate-400">({Math.ceil(file.file_size / 1024)} KB)</span></span><Download size={15} /></button>)}</div>}
      </article>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900"><MessageCircle size={19} />댓글 <span className="text-indigo-600">{comments.length}</span></h2>
        {user ? <form onSubmit={submitComment} className="mt-5">
          {replyTo && <div className="mb-2 flex items-center justify-between text-xs font-semibold text-indigo-700">답글 작성 중<button type="button" onClick={() => setReplyTo(null)} className="text-slate-400">취소</button></div>}
          <textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} rows={3} maxLength={5000} placeholder="따뜻한 댓글을 남겨 주세요." className="w-full resize-y rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-indigo-400" />
          <button disabled={busy || profile?.is_suspended} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Send size={15} />댓글 등록</button>
        </form> : <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500"><Link to="/login" className="font-bold text-indigo-700 underline">로그인</Link> 후 댓글을 작성할 수 있습니다.</p>}
        <div className="mt-6 divide-y divide-slate-100">
          {rootComments.map((comment) => {
            const replies = comments.filter((reply) => reply.parent_id === comment.id);
            return <div key={comment.id} className="py-5">
              <CommentRow comment={comment} own={user?.id === comment.author_id && !comment.is_sample} staff={isStaff(profile?.role)} editing={editingComment === comment.id} onEdit={() => setEditingComment(comment.id)} onCancelEdit={() => setEditingComment(null)} onSave={(value) => void saveComment(comment.id, value)} onDelete={() => deleteComment(comment.id)} onReport={() => report('comment', comment.id)} onModerate={() => void moderate('comment', comment.id, !comment.is_hidden)} />
              {user && !comment.is_hidden && <button onClick={() => { setReplyTo(comment.id); document.querySelector('textarea')?.focus(); }} className="ml-10 mt-2 text-xs font-bold text-indigo-600 hover:underline">답글 달기</button>}
              {replies.map((reply) => <div key={reply.id} className="ml-6 mt-4 border-l-2 border-indigo-100 pl-4 sm:ml-10"><CommentRow comment={reply} own={user?.id === reply.author_id && !reply.is_sample} staff={isStaff(profile?.role)} editing={editingComment === reply.id} onEdit={() => setEditingComment(reply.id)} onCancelEdit={() => setEditingComment(null)} onSave={(value) => void saveComment(reply.id, value)} onDelete={() => deleteComment(reply.id)} onReport={() => report('comment', reply.id)} onModerate={() => void moderate('comment', reply.id, !reply.is_hidden)} /></div>)}
            </div>;
          })}
          {rootComments.length === 0 && <p className="py-8 text-center text-sm text-slate-400">첫 댓글을 남겨 보세요.</p>}
        </div>
      </section>
    </>}
  </main>;
}

interface CommentRowProps {
  comment: CommunityComment;
  own: boolean;
  staff: boolean;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (content: string) => void;
  onDelete: () => void;
  onReport: () => void;
  onModerate: () => void;
}

function CommentRow({ comment, own, staff, editing, onEdit, onCancelEdit, onSave, onDelete, onReport, onModerate }: CommentRowProps) {
  const [value, setValue] = useState(comment.content);
  return <div className="flex gap-3">
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">{comment.author?.nickname?.slice(0, 1) ?? 'U'}</span>
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-slate-800">{comment.is_sample ? '모아보드 예시' : comment.is_anonymous ? '익명' : comment.author?.nickname ?? '회원'}</span>{comment.is_sample && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">예시 댓글</span>}{comment.is_anonymous && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">익명</span>}<time className="text-xs text-slate-400">{new Date(comment.created_at).toLocaleString('ko-KR')}</time></div>
      {comment.is_hidden ? <p className="mt-2 text-sm italic text-slate-400">관리자에 의해 블라인드 처리된 댓글입니다.</p> : editing ? <div className="mt-2"><textarea value={value} onChange={(event) => setValue(event.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 p-3 text-sm" /><div className="mt-2 flex gap-2"><button onClick={() => onSave(value)} className="text-xs font-bold text-indigo-700">저장</button><button onClick={onCancelEdit} className="text-xs text-slate-500">취소</button></div></div> : <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{comment.content}</p>}
      <div className="mt-2 flex flex-wrap gap-3">{own && !editing && <button onClick={onEdit} className="text-xs text-slate-400 hover:text-indigo-600">수정</button>}{(own || staff) && <button onClick={onDelete} className="text-xs text-slate-400 hover:text-rose-600">삭제</button>}{staff && <button onClick={onModerate} className="text-xs text-slate-400 hover:text-indigo-600">{comment.is_hidden ? '블라인드 해제' : '블라인드'}</button>}{!own && !staff && !comment.is_sample && <button onClick={onReport} className="text-xs text-slate-400 hover:text-rose-600">신고</button>}</div>
    </div>
  </div>;
}
