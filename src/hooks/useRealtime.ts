import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';
import type { Notification } from '../types/community';

export function useRealtimeNotifications(onNewNotification: (notification: Notification) => void) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!supabase || !user) {
      setNotifications([]);
      return;
    }
    let active = true;
    const client = supabase;
    const loadNotifications = async () => {
      const { data, error } = await client
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) {
        console.error('알림을 불러오지 못했습니다.', error);
        return;
      }
      if (active) setNotifications(data as Notification[]);
    };
    void loadNotifications();
    const channel = client
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const notification = payload.new as Notification;
        setNotifications((current) => [notification, ...current].slice(0, 30));
        onNewNotification(notification);
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`알림 실시간 구독에 실패했습니다: ${status}`);
        }
      });
    return () => {
      active = false;
      void client.removeChannel(channel);
    };
  }, [user?.id, onNewNotification]);

  const markRead = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) throw error;
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item));
  };

  return { notifications, unreadCount: notifications.filter((item) => !item.is_read).length, markRead };
}
