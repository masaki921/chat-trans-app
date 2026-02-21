import { useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../services/supabase';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import { ConversationWithDetails } from '../types/chat';

export function useConversations() {
  const { conversations, setConversations, isLoadingConversations, setLoadingConversations } = useChatStore();
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
      setLoadingConversations(false);
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
      setLoadingConversations(false);
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

    // ブロック済みユーザーの会話をフィルタ（自分がブロックした相手のみ）
    const { data: blockedRows } = await supabase
      .from('friendships')
      .select('addressee_id')
      .eq('requester_id', user.id)
      .eq('status', 'blocked');

    if (blockedRows && blockedRows.length > 0) {
      const blockedIds = new Set(
        blockedRows.map((r) => r.addressee_id)
      );
      const filtered = result.filter((convo) => {
        if (convo.type !== 'direct') return true;
        const otherMember = convo.members.find((m) => m.user_id !== user.id);
        return otherMember ? !blockedIds.has(otherMember.user_id) : true;
      });
      setConversations(filtered);
    } else {
      setConversations(result);
    }

    setLoadingConversations(false);
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // タブがフォーカスされるたびにリフレッシュ
  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations])
  );

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

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (!user) return;

      // 自分をメンバーから削除
      await supabase
        .from('conversation_members')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      // 残りメンバーがいなければ会話自体を削除
      const { data: remaining } = await supabase
        .from('conversation_members')
        .select('user_id')
        .eq('conversation_id', conversationId);

      if (!remaining || remaining.length === 0) {
        await supabase
          .from('conversations')
          .delete()
          .eq('id', conversationId);
      }

      fetchConversations();
    },
    [user, fetchConversations]
  );

  return { conversations, isLoading: isLoadingConversations, refetch: fetchConversations, deleteConversation };
}
