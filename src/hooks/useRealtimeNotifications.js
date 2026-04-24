import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { showBrowserNotification } from '@/lib/browserNotifications';

export function useRealtimeNotifications(userId) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`realtime-notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'friendships',
        filter: `receiver_id=eq.${userId}`,
      }, () => {
        showBrowserNotification(
          'Neue Freundschaftsanfrage 🐕',
          'Jemand möchte dein Freund sein!',
          '/Friends'
        );
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'friendships',
        filter: `requester_id=eq.${userId}`,
      }, (payload) => {
        if (payload.new?.status === 'accepted') {
          showBrowserNotification(
            'Freundschaft bestätigt ✅',
            'Deine Anfrage wurde angenommen!',
            '/Friends'
          );
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);
}

