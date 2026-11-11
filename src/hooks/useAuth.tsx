import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import type { Profile } from '../types/community';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nickname: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = async () => {
    if (!supabase || !session?.user) {
      setProfile(null);
      return;
    }
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('id,nickname,avatar_url,role,is_suspended,created_at')
      .eq('id', session.user.id)
      .single();
    if (profileError) {
      setError(`프로필을 불러오지 못했습니다: ${profileError.message}`);
      setProfile(null);
      return;
    }
    setError(null);
    setProfile(data as Profile);
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    const client = supabase;
    client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(`로그인 상태를 확인하지 못했습니다: ${sessionError.message}`);
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setLoading(false);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [session?.user.id]);

  useEffect(() => {
    if (!supabase || !session?.user.id) return;
    const client = supabase;
    const channel = client
      .channel(`profile:${session.user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${session.user.id}`,
      }, (payload) => {
        setProfile(payload.new as Profile);
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`프로필 실시간 구독에 실패했습니다: ${status}`);
        }
      });
    return () => { void client.removeChannel(channel); };
  }, [session?.user.id]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    profile,
    loading,
    error: !isSupabaseConfigured
      ? 'Supabase 환경 변수가 설정되지 않았습니다. .env.local에 VITE_SUPABASE_URL과 VITE_SUPABASE_PUBLISHABLE_KEY를 입력하세요.'
      : error,
    signIn: async (email, password) => {
      if (!supabase) throw new Error('Supabase 환경 변수를 먼저 설정해 주세요.');
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
    },
    signUp: async (email, password, nickname) => {
      if (!supabase) throw new Error('Supabase 환경 변수를 먼저 설정해 주세요.');
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nickname } },
      });
      if (authError) throw authError;
    },
    signOut: async () => {
      if (!supabase) return;
      const { error: authError } = await supabase.auth.signOut();
      if (authError) throw authError;
      setProfile(null);
    },
    refreshProfile,
  }), [session, profile, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
