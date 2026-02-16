// Supabase Edge Function: translate-message
// Gemini APIを使ってメッセージを翻訳する

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface TranslateRequest {
  text: string;
  sourceLang: string;
  targetLanguages: string[];
}

interface TranslateResponse {
  translations: Record<string, string>;
}

Deno.serve(async (req) => {
  // CORSヘッダー
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { text, sourceLang, targetLanguages } = (await req.json()) as TranslateRequest;

    if (!text || !sourceLang || !targetLanguages?.length) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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

    const prompt = `Translate the following text into the specified languages. Return ONLY a JSON object with language codes as keys and translated text as values. Do not include any explanation.

Source language: ${langNames[sourceLang] ?? sourceLang}
Target languages: {${targetLangList}}

Text to translate:
${text}

Response format example:
{"en": "Hello", "ja": "こんにちは"}`;

    // Gemini API呼び出し
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error('Gemini API error:', errorBody);
      return new Response(
        JSON.stringify({ error: 'Translation API error' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    const translationText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!translationText) {
      return new Response(
        JSON.stringify({ error: 'Empty translation response' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const translations = JSON.parse(translationText);

    const response: TranslateResponse = { translations };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
