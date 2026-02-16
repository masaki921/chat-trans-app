import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import { Profile, Friendship } from '../types/database';

type FriendWithProfile = Friendship & {
  friend: Profile;
};

export function useFriendships() {
  const user = useAuthStore((s) => s.user);
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFriends = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    // 承認済みフレンド
    const { data: accepted } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (accepted) {
      const friendsWithProfiles: FriendWithProfile[] = [];
      for (const f of accepted) {
        const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', friendId)
          .single();

        if (profile) {
          friendsWithProfiles.push({ ...f, friend: profile as Profile });
        }
      }
      setFriends(friendsWithProfiles);
    }

    // 受信した保留中リクエスト
    const { data: pending } = await supabase
      .from('friendships')
      .select('*')
      .eq('addressee_id', user.id)
      .eq('status', 'pending');

    if (pending) {
      const pendingWithProfiles: FriendWithProfile[] = [];
      for (const f of pending) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', f.requester_id)
          .single();

        if (profile) {
          pendingWithProfiles.push({ ...f, friend: profile as Profile });
        }
      }
      setPendingRequests(pendingWithProfiles);
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // 友達追加リクエスト送信（フレンドコードで検索）
  const sendFriendRequest = useCallback(
    async (friendCode: string) => {
      if (!user) return { error: new Error('Not authenticated') };

      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('id, display_name')
        .ilike('friend_code', friendCode.trim())
        .single();

      if (!targetProfile) {
        return { error: new Error('ユーザーが見つかりません') };
      }

      if (targetProfile.id === user.id) {
        return { error: new Error('自分自身には送信できません') };
      }

      const { error } = await supabase.from('friendships').insert({
        requester_id: user.id,
        addressee_id: targetProfile.id,
      });

      if (error) {
        if (error.code === '23505') {
          return { error: new Error('すでにリクエスト済みです') };
        }
        return { error: new Error(error.message) };
      }

      return { error: null };
    },
    [user]
  );

  // フレンドリクエスト承認
  const acceptRequest = useCallback(
    async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (!error) fetchFriends();
      return { error: error ? new Error(error.message) : null };
    },
    [fetchFriends]
  );

  // フレンドリクエスト拒否
  const rejectRequest = useCallback(
    async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (!error) fetchFriends();
      return { error: error ? new Error(error.message) : null };
    },
    [fetchFriends]
  );

  // 会話を開始（既存or新規作成）
  const startConversation = useCallback(
    async (friendId: string) => {
      if (!user) return null;

      // 既存のdirect会話を検索
      const { data: myConvos } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (myConvos) {
        for (const mc of myConvos) {
          const { data: members } = await supabase
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', mc.conversation_id);

          const { data: convo } = await supabase
            .from('conversations')
            .select('type')
            .eq('id', mc.conversation_id)
            .single();

          if (
            convo?.type === 'direct' &&
            members?.length === 2 &&
            members.some((m) => m.user_id === friendId)
          ) {
            return mc.conversation_id;
          }
        }
      }

      // 新規会話作成（クライアントでUUID生成し、INSERT→メンバー追加の順で実行）
      const conversationId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        (c) => {
          const r = (Math.random() * 16) | 0;
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        }
      );
      const { error } = await supabase
        .from('conversations')
        .insert({ id: conversationId, type: 'direct', created_by: user.id });

      if (error) return null;

      // メンバー追加
      const { error: memberError } = await supabase
        .from('conversation_members')
        .insert([
          { conversation_id: conversationId, user_id: user.id, role: 'owner' },
          { conversation_id: conversationId, user_id: friendId, role: 'member' },
        ]);

      if (memberError) return null;

      return conversationId;
    },
    [user]
  );

  return {
    friends,
    pendingRequests,
    isLoading,
    sendFriendRequest,
    acceptRequest,
    rejectRequest,
    startConversation,
    refetch: fetchFriends,
  };
}
