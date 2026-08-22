import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, targetLang } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Texto inválido." }, { status: 400 });
    }

    const apiKey = process.env.DEEPL_API_KEY || "eca26ca1-db36-43ac-adac-3cdde4f706be:fx";
    const target = (targetLang || "EN").toUpperCase();

    const bodyParams = new URLSearchParams({
      text,
      target_lang: target
    }).toString();

    const res = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        "Authorization": `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: bodyParams
    });

    if (res.ok) {
      const data = await res.json();
      const translatedText = data?.translations?.[0]?.text || text;
      return NextResponse.json({ translatedText });
    } else {
      const errText = await res.text();
      console.warn("DeepL API Error:", res.status, errText);
      return NextResponse.json({ error: "Erro ao traduzir com DeepL." }, { status: 500 });
    }

  } catch (error: any) {
    console.error("DeepL Translation Error:", error);
    return NextResponse.json({ error: "Erro de tradução." }, { status: 500 });
  }
}
