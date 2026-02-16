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
    const payload = await req.json();

    // Database Webhookからのペイロード
    const message = payload.record ?? payload;

    if (!message.sender_id || !message.conversation_id) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 送信者のプロフィールを取得
    const { data: sender } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', message.sender_id)
      .single();

    // 会話のメンバー（送信者以外）のpush_tokenを取得
    const { data: members } = await supabase
      .from('conversation_members')
      .select('user_id, profile:profiles(push_token)')
      .eq('conversation_id', message.conversation_id)
      .neq('user_id', message.sender_id);

    if (!members || members.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // push_tokenがあるメンバーにのみ通知を送信
    const pushTokens = members
      .map((m: any) => m.profile?.push_token)
      .filter(Boolean) as string[];

    if (pushTokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 通知本文を決定
    const body =
      message.type === 'image'
        ? '📷 画像'
        : message.content?.substring(0, 100) ?? '';

    // Expo Push APIに送信
    const messages = pushTokens.map((token: string) => ({
      to: token,
      title: sender?.display_name ?? 'ChatTranslate',
      body,
      data: {
        conversationId: message.conversation_id,
        messageId: message.id,
      },
      sound: 'default',
    }));

    const expoPushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await expoPushResponse.json();

    return new Response(JSON.stringify({ sent: pushTokens.length, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Push notification error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
