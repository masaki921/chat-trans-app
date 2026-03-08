// Supabase Edge Function: translate-message
// Gemini APIを使ってメッセージを翻訳する（文脈対応・課金制限付き）

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const FREE_MONTHLY_LIMIT = 30;
const FREE_FIRST_MONTH_BONUS = 50;

interface TranslateRequest {
  text: string;
  sourceLang: string;
  targetLanguages: string[];
  context?: { content: string; lang: string }[];
  userId?: string;
}

interface TranslateResponse {
  translations: Record<string, string>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, sourceLang, targetLanguages, context, userId } =
      (await req.json()) as TranslateRequest;

    if (!text || !sourceLang || !targetLanguages?.length) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 課金制限チェック
    if (userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // サブスクリプション確認
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('status, plan, created_at')
        .eq('user_id', userId)
        .single();

      if (!subscription || subscription.status === 'free') {
        // 無料ユーザー: 使用量チェック
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const { data: usage } = await supabase
          .from('translation_usage')
          .select('count')
          .eq('user_id', userId)
          .eq('month', currentMonth)
          .single();

        // 初月ボーナス判定
        const createdAt = subscription?.created_at ? new Date(subscription.created_at) : now;
        const createdMonth = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
        const isFirstMonth = currentMonth === createdMonth;
        const limit = isFirstMonth ? FREE_FIRST_MONTH_BONUS : FREE_MONTHLY_LIMIT;

        const currentCount = usage?.count ?? 0;
        if (currentCount >= limit) {
          return new Response(
            JSON.stringify({ error: 'translation_limit_reached', limit, count: currentCount }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 使用量インクリメント
        if (usage) {
          await supabase
            .from('translation_usage')
            .update({ count: currentCount + 1 })
            .eq('user_id', userId)
            .eq('month', currentMonth);
        } else {
          await supabase
            .from('translation_usage')
            .insert({ user_id: userId, month: currentMonth, count: 1 });
        }
      }
    }

    // 翻訳先言語の名前マッピング
    const langNames: Record<string, string> = {
      ja: 'Japanese', en: 'English', zh: 'Chinese', ko: 'Korean',
      es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese',
      it: 'Italian', ru: 'Russian', ar: 'Arabic', th: 'Thai',
      vi: 'Vietnamese', id: 'Indonesian',
    };

    const targetLangList = targetLanguages
      .map((code) => `"${code}": "${langNames[code] ?? code}"`)
      .join(', ');

    // 文脈テキストの構築
    let contextBlock = '';
    if (context && context.length > 0) {
      const contextLines = context
        .map((c) => `[${langNames[c.lang] ?? c.lang}]: ${c.content}`)
        .join('\n');
      contextBlock = `\nRecent conversation context (for reference only, do NOT translate these):\n${contextLines}\n`;
    }

    const prompt = `You are a chat message translator for a casual messaging app between friends.

Rules:
- Translate as if close friends are talking. Use casual, everyday language.
- For Japanese: Use タメ口 (informal speech). NEVER use です/ます/ございます. Use だ/だよ/だね/じゃん/よ/ね instead.
- For Chinese: Use casual 口语. Avoid formal 您, use 你 instead.
- For English: Use contractions (don't, it's, gonna). Avoid formal phrasing.
- For Korean: Use 반말 (informal speech). Avoid 합니다/습니다.
- Keep it short and natural. Don't over-translate or add unnecessary words.
- Preserve emojis, slang tone, and nuance exactly.
- If the message is very short (like "ok", "lol", "www"), keep it short in translation too.
${contextBlock}
Return ONLY a JSON object with language codes as keys and translated text as values.

Source language: ${langNames[sourceLang] ?? sourceLang}
Target languages: {${targetLangList}}

Message: ${text}`;

    // Gemini API呼び出し
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error('Gemini API error:', errorBody);
      return new Response(
        JSON.stringify({ error: 'Translation API error' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    const translationText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!translationText) {
      return new Response(
        JSON.stringify({ error: 'Empty translation response' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const translations = JSON.parse(translationText);

    const response: TranslateResponse = { translations };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
