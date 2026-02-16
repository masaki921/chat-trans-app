import { useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import { ConversationWithDetails } from '../types/chat';

export function useConversations() {
  const { conversations, setConversations, isLoadingConversations } = useChatStore();
  const user = useAuthStore((s) => s.user);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    // 自分がメンバーの会話を取得
    const { data: memberRows } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (!memberRows || memberRows.length === 0) {
      setConversations([]);
      return;
    }

    const conversationIds = memberRows.map((r) => r.conversation_id);

    const { data: convos } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (!convos) {
      setConversations([]);
      return;
    }

    // 各会話のメンバー+プロフィールを取得
    const result: ConversationWithDetails[] = [];

    for (const convo of convos) {
      const { data: members } = await supabase
        .from('conversation_members')
        .select('*, profile:profiles(*)')
        .eq('conversation_id', convo.id);

      result.push({
        ...convo,
        members: members ?? [],
      });
    }

    setConversations(result);
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime: conversation_membersの変更を監視（未読カウント更新等）
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_members',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { conversations, isLoading: isLoadingConversations, refetch: fetchConversations };
}
