import { useState, type FormEvent } from 'react';
import { ArrowLeft, LoaderCircle, LockKeyhole, MessageSquareText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [registering, setRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (registering) {
        await signUp(email.trim(), password, nickname.trim());
        setMessage('가입 요청이 완료되었습니다. 이메일 확인이 필요한 경우 받은 편지함을 확인해 주세요.');
      } else {
        await signIn(email.trim(), password);
        navigate('/');
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '인증 요청에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="flex flex-1 items-center justify-center px-4 py-12">
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-lg sm:p-9">
      <Link to="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-700"><ArrowLeft size={16} />홈으로</Link>
      <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-600 text-white"><MessageSquareText /></div>
      <h1 className="text-2xl font-black text-slate-900">{registering ? '새 계정 만들기' : '다시 오신 것을 환영해요'}</h1>
      <p className="mt-2 text-sm text-slate-500">이메일로 안전하게 커뮤니티에 참여하세요.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        {registering && <label className="block text-sm font-semibold text-slate-700">닉네임<input required maxLength={40} value={nickname} onChange={(event) => setNickname(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-indigo-400" placeholder="커뮤니티에서 사용할 이름" /></label>}
        <label className="block text-sm font-semibold text-slate-700">이메일<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-indigo-400" placeholder="you@example.com" /></label>
        <label className="block text-sm font-semibold text-slate-700">비밀번호<input required minLength={8} type="password" autoComplete={registering ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-indigo-400" placeholder="8자 이상" /></label>
        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin" size={18} /> : <LockKeyhole size={17} />}{registering ? '회원가입' : '로그인'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">{registering ? '이미 계정이 있나요?' : '처음 방문하셨나요?'} <button onClick={() => { setRegistering((value) => !value); setError(''); setMessage(''); }} className="font-bold text-indigo-700 hover:underline">{registering ? '로그인' : '회원가입'}</button></p>
    </div>
  </main>;
}
