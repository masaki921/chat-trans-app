import { useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import { MessageWithSender } from '../types/chat';
import { Message } from '../types/database';

export function useMessages(conversationId: string) {
  const { currentMessages, setCurrentMessages, addMessage, updateMessageTranslations } =
    useChatStore();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      setCurrentMessages(data as MessageWithSender[]);
    }

    // 未読カウントをリセット
    if (user) {
      supabase
        .from('conversation_members')
        .update({ unread_count: 0, last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .then();
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchMessages();

    return () => {
      setCurrentMessages([]);
    };
  }, [fetchMessages]);

  // Realtime: 新着メッセージと翻訳更新を監視
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;

          // 自分が送ったメッセージはすでにローカルに追加済みの場合スキップ
          const exists = useChatStore.getState().currentMessages.some(
            (m) => m.id === newMsg.id
          );
          if (exists) return;

          // 送信者のプロフィールを取得
          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMsg.sender_id)
            .single();

          if (sender) {
            addMessage({ ...newMsg, sender } as MessageWithSender);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          if (updated.translations) {
            updateMessageTranslations(updated.id, updated.translations);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // メッセージ送信
  const sendMessage = useCallback(
    async (content: string) => {
      if (!user || !profile || !content.trim()) return;

      const messageId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        (c) => {
          const r = (Math.random() * 16) | 0;
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        }
      );

      const now = new Date().toISOString();
      const trimmedContent = content.trim();

      // ローカルに即座に追加（楽観的更新）
      const localMessage: MessageWithSender = {
        id: messageId,
        conversation_id: conversationId,
        sender_id: user.id,
        type: 'text',
        content: trimmedContent,
        media_url: null,
        original_language: profile.primary_language,
        translations: null,
        read_by: [],
        created_at: now,
        sender: profile,
      };
      addMessage(localMessage);

      // DBにinsert（selectなし）
      const { error } = await supabase
        .from('messages')
        .insert({
          id: messageId,
          conversation_id: conversationId,
          sender_id: user.id,
          type: 'text',
          content: trimmedContent,
          original_language: profile.primary_language,
        });

      if (error) {
        console.error('Message send error:', error);
        return;
      }

      // 翻訳をリクエスト（非同期）
      requestTranslation(messageId, trimmedContent, profile.primary_language, conversationId);
    },
    [user, profile, conversationId]
  );

  return { messages: currentMessages, sendMessage, refetch: fetchMessages };
}

// 翻訳リクエスト（Edge Functionを呼び出し）
async function requestTranslation(
  messageId: string,
  text: string,
  sourceLang: string,
  conversationId: string
) {
  try {
    // 会話メンバーの言語を取得
    const { data: members } = await supabase
      .from('conversation_members')
      .select('user_id, profile:profiles(primary_language)')
      .eq('conversation_id', conversationId);

    if (!members) return;

    const targetLanguages = members
      .map((m: any) => m.profile?.primary_language)
      .filter((lang: string) => lang && lang !== sourceLang);

    const uniqueTargetLangs = [...new Set(targetLanguages)] as string[];

    if (uniqueTargetLangs.length === 0) return;

    const { data } = await supabase.functions.invoke('translate-message', {
      body: { text, sourceLang, targetLanguages: uniqueTargetLangs },
    });

    if (data?.translations) {
      await supabase
        .from('messages')
        .update({ translations: data.translations })
        .eq('id', messageId);
    }
  } catch (err) {
    console.error('Translation error:', err);
  }
}
