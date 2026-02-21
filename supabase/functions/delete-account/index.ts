import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // === ユーザー認証 ===
    // Authorizationヘッダーから取得、フォールバックとしてボディから取得
    let accessToken: string | null = null;

    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.slice(7);
    }

    if (!accessToken) {
      try {
        const body = await req.json();
        if (body?.access_token) {
          accessToken = body.access_token;
        }
      } catch {
        // bodyが空の場合は無視
      }
    }

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // サービスロールクライアント（管理操作用）
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // JWT署名検証 + ユーザー取得（Supabase Auth APIで検証）
    const { data: authData, error: authError } = await adminClient.auth.getUser(accessToken);
    if (authError || !authData?.user) {
      console.error('Auth verification failed:', authError?.message);
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = authData.user.id;

    // 1. ユーザーの画像メッセージのmedia_urlを取得（Storage削除用）
    const { data: imageMessages } = await adminClient
      .from('messages')
      .select('media_url')
      .eq('sender_id', userId)
      .eq('type', 'image')
      .not('media_url', 'is', null);

    // 2. messagesテーブルからユーザーの送信メッセージ削除
    const { error: msgErr } = await adminClient
      .from('messages')
      .delete()
      .eq('sender_id', userId);
    if (msgErr) console.error('Delete messages failed:', msgErr.message);

    // 3. ユーザーのconversation_idリストを保存してからmembers削除
    const { data: userMemberships } = await adminClient
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId);

    const userConversationIds = (userMemberships ?? []).map((m: any) => m.conversation_id);

    const { error: memberErr } = await adminClient
      .from('conversation_members')
      .delete()
      .eq('user_id', userId);
    if (memberErr) console.error('Delete members failed:', memberErr.message);

    // 4. 保存したIDのみで空会話チェック→削除
    for (const convId of userConversationIds) {
      const { data: members } = await adminClient
        .from('conversation_members')
        .select('user_id')
        .eq('conversation_id', convId);

      if (!members || members.length === 0) {
        await adminClient
          .from('conversations')
          .delete()
          .eq('id', convId);
      }
    }

    // 5. friendshipsからユーザー関連レコード削除
    await adminClient
      .from('friendships')
      .delete()
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    // 6. reportsからユーザー関連レコード削除（reporter側・reported側両方）
    await adminClient
      .from('reports')
      .delete()
      .eq('reporter_id', userId);
    await adminClient
      .from('reports')
      .delete()
      .eq('reported_user_id', userId);

    // 7. profilesからユーザー削除
    await adminClient
      .from('profiles')
      .delete()
      .eq('id', userId);

    // 8. Storageからアバター削除
    try {
      const { data: avatarFiles } = await adminClient.storage
        .from('avatars')
        .list(userId);

      if (avatarFiles && avatarFiles.length > 0) {
        const paths = avatarFiles.map((f: any) => `${userId}/${f.name}`);
        await adminClient.storage.from('avatars').remove(paths);
      }
    } catch {
      // Storage cleanup is non-fatal
    }

    // 9. Storageからチャット画像削除
    try {
      if (imageMessages) {
        for (const msg of imageMessages) {
          if (msg.media_url) {
            const match = msg.media_url.match(/chat-images\/(.+?)(\?|$)/);
            if (match) {
              await adminClient.storage.from('chat-images').remove([match[1]]);
            }
          }
        }
      }
    } catch {
      // Storage cleanup is non-fatal
    }

    // 10. Auth ユーザー削除
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Failed to delete auth user');
      return new Response(JSON.stringify({ error: 'Failed to delete account' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Delete account error');
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
