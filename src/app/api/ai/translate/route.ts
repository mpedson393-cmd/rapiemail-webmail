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
    const { text, subject, targetLang, isHtml } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Texto inválido." }, { status: 400 });
    }

    const deepLKey = process.env.DEEPL_API_KEY || "eca26ca1-db36-43ac-adac-3cdde4f706be:fx";
    let target = (targetLang || "PT-PT").toUpperCase();
    if (target === "PT") target = "PT-PT";
    if (target === "EN") target = "EN-US";

    const langName = LANGUAGE_NAMES[target] || target;

    // 1. Tradução Oficial com DeepL Neural Engine (Suporte a múltiplos textos: Assunto + Corpo)
    try {
      const params = new URLSearchParams();
      if (subject && typeof subject === "string") {
        params.append("text", subject);
      }
      params.append("text", text);
      params.append("target_lang", target);
      if (isHtml) {
        params.append("tag_handling", "html");
      }

      const res = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: {
          "Authorization": `DeepL-Auth-Key ${deepLKey}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      });

      if (res.ok) {
        const data = await res.json();
        const translations = data?.translations || [];
        
        let translatedSubject = "";
        let translatedBody = "";
        let detectedSourceLang = "EN";

        if (subject && translations.length >= 2) {
          translatedSubject = translations[0].text;
          translatedBody = translations[1].text;
          detectedSourceLang = translations[1].detected_source_language || translations[0].detected_source_language || "EN";
        } else if (translations.length >= 1) {
          translatedBody = translations[0].text;
          detectedSourceLang = translations[0].detected_source_language || "EN";
        }

        if (translatedBody) {
          return NextResponse.json({ 
            translatedText: translatedBody,
            translatedSubject: translatedSubject || subject,
            detectedSourceLang,
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
    
    const prompt = `You are an expert translator. Translate the following email content into ${langName} (${target}).
CRITICAL RULES:
1. Preserve 100% of all HTML tags, attributes, inline styles (CSS), image URLs, table structures, buttons, and layouts intact.
2. Only translate the human-readable text.
3. Return STRICTLY a valid JSON object with keys "translatedSubject" and "translatedBody". Do NOT wrap in markdown fences.

Email Subject: ${subject || ""}
Email Body (HTML/Text):
${text}`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (geminiRes.ok) {
      const geminiData = await geminiRes.json();
      const rawJson = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawJson) {
        try {
          const parsed = JSON.parse(rawJson);
          return NextResponse.json({ 
            translatedText: parsed.translatedBody || text,
            translatedSubject: parsed.translatedSubject || subject,
            detectedSourceLang: "AUTO",
            targetLang: target,
            targetLangName: langName,
            isHtml: !!isHtml
          });
        } catch(e) {}
      }
    }

    return NextResponse.json({ 
      translatedText: text, 
      translatedSubject: subject || "",
      detectedSourceLang: "EN", 
      targetLang: target, 
      isHtml: !!isHtml 
    });

  } catch (error: any) {
    console.error("Translation Server Error:", error);
    return NextResponse.json({ error: "Erro ao traduzir mensagem." }, { status: 500 });
  }
}
