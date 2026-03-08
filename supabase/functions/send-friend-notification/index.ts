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
    const { accepterId, requesterId } = await req.json();

    if (!accepterId || !requesterId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 承認者の表示名を取得
    const { data: accepter } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', accepterId)
      .single();

    // 申請者のpush_tokenを取得
    const { data: requester } = await supabase
      .from('profiles')
      .select('push_token, primary_language')
      .eq('id', requesterId)
      .single();

    if (!requester?.push_token) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 言語に応じた通知テキスト
    const notificationTexts: Record<string, { title: string; body: string }> = {
      ja: {
        title: 'フレンドリクエスト承認',
        body: `${accepter?.display_name ?? 'ユーザー'}さんがフレンドリクエストを承認しました`,
      },
      en: {
        title: 'Friend Request Accepted',
        body: `${accepter?.display_name ?? 'User'} accepted your friend request`,
      },
      zh: {
        title: '好友请求已接受',
        body: `${accepter?.display_name ?? '用户'}接受了你的好友请求`,
      },
    };

    const lang = requester.primary_language ?? 'en';
    const texts = notificationTexts[lang] ?? notificationTexts.en;

    // Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        to: requester.push_token,
        title: texts.title,
        body: texts.body,
        sound: 'default',
      }),
    });

    const result = await response.json();

    return new Response(JSON.stringify({ sent: 1, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Friend notification error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
