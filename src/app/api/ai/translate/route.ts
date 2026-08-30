import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const LANGUAGE_NAMES: Record<string, string> = {
  "PT-PT": "Português (Portugal)",
  "PT-BR": "Português (Brasil)",
  "EN-US": "Inglês (Estados Unidos)",
  "EN-GB": "Inglês (Reino Unido)",
  "ES": "Espanhol",
  "FR": "Francês",
  "DE": "Alemão",
  "IT": "Italiano",
  "ZH": "Chinês (Simplificado)",
  "RU": "Russo",
  "JA": "Japonês",
  "AR": "Árabe"
};

export async function POST(req: Request) {
  try {
    const { text, targetLang, isHtml } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Texto inválido." }, { status: 400 });
    }

    const deepLKey = process.env.DEEPL_API_KEY || "eca26ca1-db36-43ac-adac-3cdde4f706be:fx";
    let target = (targetLang || "PT-PT").toUpperCase();
    if (target === "PT") target = "PT-PT";
    if (target === "EN") target = "EN-US";

    const langName = LANGUAGE_NAMES[target] || target;

    // 1. Tradução Oficial com DeepL Neural Engine (com suporte nativo a tags HTML para manter o layout!)
    try {
      const paramsObj: Record<string, string> = {
        text,
        target_lang: target
      };

      if (isHtml) {
        paramsObj.tag_handling = "html";
      }

      const bodyParams = new URLSearchParams(paramsObj).toString();

      const res = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: {
          "Authorization": `DeepL-Auth-Key ${deepLKey}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: bodyParams
      });

      if (res.ok) {
        const data = await res.json();
        const translation = data?.translations?.[0];
        if (translation?.text) {
          return NextResponse.json({ 
            translatedText: translation.text,
            detectedSourceLang: translation.detected_source_language || "EN",
            targetLang: target,
            targetLangName: langName,
            isHtml: !!isHtml
          });
        }
      }
    } catch (deepLErr) {
      console.warn("DeepL Translation Warning, fallback to Gemini AI:", deepLErr);
    }

    // 2. Fallback Inteligente com Google Gemini AI (Preservando 100% da estrutura HTML e CSS)
    const geminiKey = process.env.GEMINI_API_KEY || "AIzaSyCpVLmwi5oDz94e2nvSAuhlQZul0XoHdSc";
    
    const prompt = isHtml 
      ? `You are an expert HTML-preserving translator. Translate all human-readable text into ${langName} (${target}).
CRITICAL RULES:
1. Preserve 100% of all HTML tags, attributes, inline styles (CSS), image URLs, table structures, buttons, and layouts intact without altering any code.
2. Only translate the text content inside tags.
3. Return strictly the raw valid translated HTML with no markdown code fences (\`\`\`html).

HTML Content to Translate:
${text}`
      : `Translate the following text to ${langName} (${target}). Preserve formatting and clean text:\n\n${text}`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (geminiRes.ok) {
      const geminiData = await geminiRes.json();
      let geminiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || text;
      // Limpar blocos de código se Gemini envolver em ```html
      geminiText = geminiText.replace(/^```html\s*/i, '').replace(/\s*```$/i, '');

      return NextResponse.json({ 
        translatedText: geminiText,
        detectedSourceLang: "AUTO",
        targetLang: target,
        targetLangName: langName,
        isHtml: !!isHtml
      });
    }

    return NextResponse.json({ translatedText: text, detectedSourceLang: "EN", targetLang: target, isHtml: !!isHtml });

  } catch (error: any) {
    console.error("Translation Server Error:", error);
    return NextResponse.json({ error: "Erro ao traduzir mensagem." }, { status: 500 });
  }
}
