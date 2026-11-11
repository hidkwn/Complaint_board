import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle, Check, LoaderCircle, Plus, Shield, Trash2, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import type { Board, Profile, Report } from '../types/community';

interface ReportWithTarget extends Report {
  targetTitle: string;
  targetPreview: string;
}

export function AdminPage() {
  const { profile, user } = useAuth();
  const [reports, setReports] = useState<ReportWithTarget[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [reportPage, setReportPage] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [profilePage, setProfilePage] = useState(0);
  const [profileCount, setProfileCount] = useState(0);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAdminOnly, setNewAdminOnly] = useState(false);
  const [newAnonymous, setNewAnonymous] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isAdmin = profile?.role === 'admin';
  const isStaff = isAdmin || profile?.role === 'moderator';

  const load = useCallback(async () => {
    if (!supabase || !isStaff) return;
    const client = supabase;
    const [reportResult, boardResult, profileResult] = await Promise.all([
      client.from('reports').select('*,reporter:profiles!reports_reporter_id_fkey(nickname)', { count: 'exact' }).eq('status', 'pending').order('created_at', { ascending: false }).range(reportPage * 50, reportPage * 50 + 49),
      client.from('boards').select('*').order('title'),
      isAdmin
        ? client.from('profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(profilePage * 50, profilePage * 50 + 49)
        : Promise.resolve({ data: [], error: null, count: null }),
    ]);
    if (reportResult.error || boardResult.error || profileResult.error) throw reportResult.error ?? boardResult.error ?? profileResult.error;
    const reportPages = Math.ceil((reportResult.count ?? 0) / 50);
    if (reportPage > 0 && reportPage >= reportPages) {
      setReportPage(Math.max(reportPages - 1, 0));
      return;
    }
    const profilePages = Math.ceil((profileResult.count ?? 0) / 50);
    if (isAdmin && profilePage > 0 && profilePage >= profilePages) {
      setProfilePage(Math.max(profilePages - 1, 0));
      return;
    }
    const expanded: ReportWithTarget[] = await Promise.all(((reportResult.data ?? []) as Report[]).map(async (report) => {
      if (report.target_type === 'post') {
        const { data, error: targetError } = await client.from('posts').select('title,content').eq('id', report.target_id).maybeSingle();
        if (targetError) throw targetError;
        return { ...report, targetTitle: data?.title ?? '삭제되었거나 접근할 수 없는 게시글', targetPreview: data?.content ?? '' };
      }
      const { data, error: targetError } = await client.from('comments').select('content,post_id').eq('id', report.target_id).maybeSingle();
      if (targetError) throw targetError;
      if (!data) return { ...report, targetTitle: '삭제되었거나 접근할 수 없는 댓글', targetPreview: '' };
      const { data: parentPost, error: postError } = await client.from('posts').select('title').eq('id', data.post_id).maybeSingle();
      if (postError) throw postError;
      return { ...report, targetTitle: `댓글 · ${parentPost?.title ?? '게시글'}`, targetPreview: data.content };
    }));
    setReports(expanded);
    setReportCount(reportResult.count ?? 0);
    setBoards((boardResult.data ?? []) as Board[]);
    setProfiles((profileResult.data ?? []) as Profile[]);
    setProfileCount(profileResult.count ?? 0);
  }, [isAdmin, isStaff, profilePage, reportPage]);

  useEffect(() => {
    let active = true;
    void load().catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : '운영 정보를 불러오지 못했습니다.');
    });
    return () => { active = false; };
  }, [load]);

  const action = async (operation: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try { await operation(); await load(); }
    catch (actionError) { setError(actionError instanceof Error ? actionError.message : '요청을 처리하지 못했습니다.'); }
    finally { setBusy(false); }
  };

  const resolveReport = (report: ReportWithTarget, status: 'resolved' | 'dismissed') => action(async () => {
    if (!supabase || !isStaff) throw new Error('운영자 권한이 필요합니다.');
    if (status === 'resolved') {
      const table = report.target_type === 'post' ? 'posts' : 'comments';
      const { error: targetError } = await supabase.from(table).update({ is_hidden: true }).eq('id', report.target_id);
      if (targetError) throw targetError;
    }
    const { error: reportError } = await supabase.from('reports').update({ status }).eq('id', report.id);
    if (reportError) throw reportError;
  });

  const createBoard = (event: FormEvent) => {
    event.preventDefault();
    void action(async () => {
      if (!supabase || !isAdmin) throw new Error('관리자 권한이 필요합니다.');
      const { error: insertError } = await supabase.from('boards').insert({
        title: newTitle.trim(), description: newDescription.trim(), is_admin_only: newAdminOnly, is_anonymous: newAnonymous,
      });
      if (insertError) throw insertError;
      setNewTitle('');
      setNewDescription('');
      setNewAdminOnly(false);
      setNewAnonymous(false);
    });
  };

  const updateBoard = (board: Board) => {
    const title = window.prompt('게시판 이름', board.title);
    if (title === null) return;
    const description = window.prompt('게시판 설명', board.description);
    if (description === null) return;
    const adminOnlyAnswer = window.prompt('관리자 전용 여부를 yes 또는 no로 입력해 주세요.', board.is_admin_only ? 'yes' : 'no');
    if (adminOnlyAnswer === null || !['yes', 'no'].includes(adminOnlyAnswer.trim().toLowerCase())) return;
    const adminOnly = adminOnlyAnswer.trim().toLowerCase() === 'yes';
    const anonymousAnswer = window.prompt('익명 게시판으로 설정하려면 yes, 아니면 no를 입력해 주세요.', board.is_anonymous ? 'yes' : 'no');
    if (anonymousAnswer === null || !['yes', 'no'].includes(anonymousAnswer.trim().toLowerCase())) return;
    const anonymous = anonymousAnswer.trim().toLowerCase() === 'yes';
    void action(async () => {
      if (!supabase || !isAdmin) throw new Error('관리자 권한이 필요합니다.');
      const { error: updateError } = await supabase.from('boards').update({
        title: title.trim(), description: description.trim(), is_admin_only: adminOnly, is_anonymous: anonymous,
      }).eq('id', board.id);
      if (updateError) throw updateError;
    });
  };

  const deleteBoard = (board: Board) => {
    if (!window.confirm(`"${board.title}" 게시판과 모든 게시글을 삭제할까요? 삭제는 되돌릴 수 없습니다.`)) return;
    void action(async () => {
      if (!supabase || !isAdmin) throw new Error('관리자 권한이 필요합니다.');
      const { data: posts, error: postsError } = await supabase.from('posts').select('id').eq('board_id', board.id);
      if (postsError) throw postsError;
      const postIds = (posts ?? []).map((row) => row.id as string);
      if (!postIds.length) {
        const { error: deleteError } = await supabase.from('boards').delete().eq('id', board.id);
        if (deleteError) throw deleteError;
        return;
      }
      const { data: attachments, error: attachmentError } = await supabase.from('attachments').select('file_path').in('post_id', postIds);
      if (attachmentError) throw attachmentError;
      const paths = (attachments ?? []).map((file) => file.file_path as string);
      if (paths.length) {
        const { error: storageError } = await supabase.storage.from('board-files').remove(paths);
        if (storageError) throw storageError;
      }
      const { error: deleteError } = await supabase.from('boards').delete().eq('id', board.id);
      if (deleteError) throw deleteError;
    });
  };

  const changeProfile = (member: Profile, changes: Partial<Pick<Profile, 'role' | 'is_suspended'>>) => action(async () => {
    if (!supabase || !isAdmin) throw new Error('관리자 권한이 필요합니다.');
    const { error: updateError } = await supabase.from('profiles').update(changes).eq('id', member.id);
    if (updateError) throw updateError;
  });

  if (!isStaff) return <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center"><Shield className="text-slate-300" size={40} /><h1 className="mt-4 text-xl font-bold">접근 권한이 없습니다</h1><p className="mt-2 text-sm text-slate-500">이 페이지는 운영자와 관리자만 사용할 수 있습니다.</p><Link to="/" className="mt-4 text-sm font-bold text-indigo-700">홈으로</Link></main>;

  return <main className="mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 py-8 sm:px-6">
    <div><p className="text-xs font-bold uppercase tracking-[.18em] text-indigo-600">Control center</p><h1 className="mt-1 text-3xl font-black text-slate-900">운영 대시보드</h1><p className="mt-2 text-sm text-slate-500">신고를 검토하고 커뮤니티를 안전하게 관리합니다.</p></div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
    <section>
      <div className="mb-4 flex items-center gap-2"><AlertTriangle className="text-amber-500" size={20} /><h2 className="text-xl font-extrabold">신고 내역</h2></div>
      <div className="space-y-3">{reports.filter((report) => report.status === 'pending').map((report) => <article key={report.id} className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400">{report.is_sample && <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-bold text-indigo-700">예시 신고</span>}<span>{report.target_type === 'post' ? '게시글' : '댓글'} 신고</span><span>·</span><span>{report.reporter?.nickname ?? '회원'}</span><span>·</span><time>{new Date(report.created_at).toLocaleString('ko-KR')}</time></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">검토 대기</span></div>
        <h3 className="mt-3 font-bold text-slate-900">{report.targetTitle}</h3><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{report.targetPreview}</p><p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700"><b>신고 사유:</b> {report.reason}</p>
        <div className="mt-4 flex gap-2"><button disabled={busy} onClick={() => resolveReport(report, 'resolved')} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Check size={14} />블라인드 처리</button><button disabled={busy} onClick={() => resolveReport(report, 'dismissed')} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-50"><X size={14} />신고 기각</button></div>
      </article>)}
      {reports.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white p-7 text-center text-sm text-slate-500">검토할 신고가 없습니다.</p>}
      {reportCount > 50 && <div className="mt-3 flex items-center justify-center gap-3 text-sm"><button disabled={reportPage === 0} onClick={() => setReportPage((page) => page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">이전</button><span className="text-slate-500">{reportPage + 1} / {Math.ceil(reportCount / 50)}</span><button disabled={reportPage + 1 >= Math.ceil(reportCount / 50)} onClick={() => setReportPage((page) => page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">다음</button></div>}</div>
    </section>

    {isAdmin && <section>
      <div className="mb-4 flex items-center gap-2"><Plus className="text-indigo-600" size={20} /><h2 className="text-xl font-extrabold">게시판 관리</h2></div>
      <form onSubmit={createBoard} className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-[1fr_2fr_auto_auto_auto] md:items-end">
        <label className="text-xs font-bold text-slate-600">이름<input required maxLength={80} value={newTitle} onChange={(event) => setNewTitle(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>
        <label className="text-xs font-bold text-slate-600">설명<input value={newDescription} onChange={(event) => setNewDescription(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>
        <label className="flex items-center gap-2 py-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={newAdminOnly} onChange={(event) => setNewAdminOnly(event.target.checked)} className="accent-indigo-600" />관리자 전용</label>
        <label className="flex items-center gap-2 py-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={newAnonymous} onChange={(event) => setNewAnonymous(event.target.checked)} className="accent-indigo-600" />익명 게시판</label>
        <button disabled={busy} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">추가</button>
      </form>
      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">{boards.map((board) => <div key={board.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-bold text-slate-800">{board.title}{board.is_admin_only && <span className="ml-2 text-xs text-indigo-600">관리자 전용</span>}{board.is_anonymous && <span className="ml-2 text-xs text-slate-500">익명 게시판</span>}</p><p className="mt-1 text-sm text-slate-500">{board.description}</p></div><div className="flex gap-2"><button onClick={() => updateBoard(board)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">수정</button><button onClick={() => deleteBoard(board)} className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50" aria-label="게시판 삭제"><Trash2 size={15} /></button></div></div>)}</div>
    </section>}

    {isAdmin && <section>
      <div className="mb-4 flex items-center gap-2"><Users className="text-indigo-600" size={20} /><h2 className="text-xl font-extrabold">사용자 및 권한</h2><span className="text-xs text-slate-400">가입 계정 {profileCount}명</span></div>
      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">{profiles.map((member) => <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-bold text-slate-800">{member.nickname}{member.id === user?.id && <span className="ml-2 text-xs text-indigo-600">나</span>}</p><p className="mt-1 text-xs text-slate-400">{new Date(member.created_at).toLocaleDateString('ko-KR')} 가입 · {member.is_suspended ? '이용 정지' : '정상'}</p></div><div className="flex flex-wrap items-center gap-2"><select disabled={member.id === user?.id} value={member.role} onChange={(event) => changeProfile(member, { role: event.target.value as Profile['role'] })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"><option value="user">일반 회원</option><option value="moderator">운영자</option><option value="admin">관리자</option></select><button disabled={member.id === user?.id || busy} onClick={() => changeProfile(member, { is_suspended: !member.is_suspended })} className={`rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-40 ${member.is_suspended ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{member.is_suspended ? '정지 해제' : '이용 정지'}</button></div></div>)}
      {profiles.length === 0 && <p className="p-6 text-center text-sm text-slate-500"><LoaderCircle size={16} className="mr-2 inline animate-spin" />사용자가 없습니다.</p>}
      {profileCount > 50 && <div className="mt-3 flex items-center justify-center gap-3 text-sm"><button disabled={profilePage === 0} onClick={() => setProfilePage((page) => page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">이전</button><span className="text-slate-500">{profilePage + 1} / {Math.ceil(profileCount / 50)}</span><button disabled={profilePage + 1 >= Math.ceil(profileCount / 50)} onClick={() => setProfilePage((page) => page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">다음</button></div>}</div>
    </section>}
  </main>;
}
