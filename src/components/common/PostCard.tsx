import { Eye, EyeOff, Heart, MessageCircle, Pin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Post } from '../../types/community';

export function PostCard({ post }: { post: Post }) {
  return (
    <Link to={`/posts/${post.id}`} className="group block rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg sm:p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
        {post.is_notice && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-amber-800"><Pin size={12} />공지</span>}
        {post.is_sample && <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700">예시 글</span>}
        {post.is_anonymous && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600"><EyeOff size={12} />익명</span>}
        <span>{post.board?.title ?? '게시판'}</span><span>·</span><span>{post.is_sample ? '모아보드 예시' : post.is_anonymous ? '익명' : post.author?.nickname ?? '회원'}</span><span>·</span><time>{new Date(post.created_at).toLocaleDateString('ko-KR')}</time>
      </div>
      {post.is_hidden ? <p className="py-2 text-sm italic text-slate-500">관리자에 의해 블라인드 처리된 게시물입니다.</p> : <>
        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700">{post.title}</h3>
        <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{post.content}</p>
      </>}
      <div className="mt-5 flex items-center gap-4 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1"><Heart size={14} />{post.like_count}</span>
        <span className="inline-flex items-center gap-1"><Eye size={14} />{post.view_count}</span>
        <span className="inline-flex items-center gap-1"><MessageCircle size={14} />댓글 보기</span>
      </div>
    </Link>
  );
}
