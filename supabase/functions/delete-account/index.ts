import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // JWTからユーザーIDを取得
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // ユーザーのJWTを使ってユーザーIDを確認
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    // サービスロールクライアント（管理操作用）
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. ユーザーの画像メッセージのmedia_urlを取得（Storage削除用）
    const { data: imageMessages } = await adminClient
      .from('messages')
      .select('media_url')
      .eq('sender_id', userId)
      .eq('type', 'image')
      .not('media_url', 'is', null);

    // 2. messagesテーブルからユーザーの送信メッセージ削除
    await adminClient
      .from('messages')
      .delete()
      .eq('sender_id', userId);

    // 3. conversation_membersからユーザーを削除
    await adminClient
      .from('conversation_members')
      .delete()
      .eq('user_id', userId);

    // 4. 空になったconversationsを削除
    const { data: allConvos } = await adminClient
      .from('conversations')
      .select('id');

    if (allConvos) {
      for (const convo of allConvos) {
        const { data: members } = await adminClient
          .from('conversation_members')
          .select('user_id')
          .eq('conversation_id', convo.id);

        if (!members || members.length === 0) {
          await adminClient
            .from('conversations')
            .delete()
            .eq('id', convo.id);
        }
      }
    }

    // 5. friendshipsからユーザー関連レコード削除
    await adminClient
      .from('friendships')
      .delete()
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    // 6. reportsからユーザー関連レコード削除
    await adminClient
      .from('reports')
      .delete()
      .eq('reporter_id', userId);

    // 7. profilesからユーザー削除
    await adminClient
      .from('profiles')
      .delete()
      .eq('id', userId);

    // 8. Storageからアバター削除
    const { data: avatarFiles } = await adminClient.storage
      .from('avatars')
      .list(userId);

    if (avatarFiles && avatarFiles.length > 0) {
      const paths = avatarFiles.map((f) => `${userId}/${f.name}`);
      await adminClient.storage.from('avatars').remove(paths);
    }

    // 9. Storageからチャット画像削除
    if (imageMessages) {
      for (const msg of imageMessages) {
        if (msg.media_url) {
          // URLからStorageパスを抽出
          const match = msg.media_url.match(/chat-images\/(.+?)(\?|$)/);
          if (match) {
            await adminClient.storage.from('chat-images').remove([match[1]]);
          }
        }
      }
    }

    // 10. Auth ユーザー削除
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Failed to delete auth user:', deleteError);
      return new Response(JSON.stringify({ error: 'Failed to delete account' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Delete account error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
