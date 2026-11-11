import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Post, SortOrder } from '../types/community';

async function fetchPosts(boardId: string, search: string, sort: SortOrder) {
  if (!supabase) throw new Error('Supabase 환경 변수를 먼저 설정해 주세요.');
  let query = supabase
    .from('posts')
    .select('*,author:profiles!posts_author_id_fkey(id,nickname,avatar_url),board:boards!posts_board_id_fkey(title)')
    .eq('board_id', boardId);
  if (search.trim()) {
    const escaped = search.trim().replace(/[,()%_*\\"]/g, ' ');
    query = query.or(`title.ilike."%${escaped}%",content.ilike."%${escaped}%"`);
  }
  if (sort === 'likes') query = query.order('like_count', { ascending: false });
  else if (sort === 'views') query = query.order('view_count', { ascending: false });
  else query = query.order('created_at', { ascending: false });
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Post[]).sort((a, b) => Number(b.is_notice) - Number(a.is_notice));
}

export function usePosts(boardId: string, search: string, sort: SortOrder, userId?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(Boolean(boardId));
  const [error, setError] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!boardId) { setPosts([]); setLoading(false); return; }
    let active = true;
    setLoading(true);
    setError('');
    void fetchPosts(boardId, debouncedSearch, sort)
      .then((result) => { if (active) setPosts(result); })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : '게시글을 불러오지 못했습니다.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [boardId, debouncedSearch, sort, userId]);

  return { posts, loading, error };
}
