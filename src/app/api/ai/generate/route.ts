import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, mode } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt inválido." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyCpVLmwi5oDz94e2nvSAuhlQZul0XoHdSc";

    const systemInstruction = mode === "summary"
      ? `És a RapiAI, um assistente executivo de e-mail. Analisa o e-mail fornecido e cria um resumo executivo muito claro em 3 pontos-chave e uma recomendação final de ação em português.`
      : `És a RapiAI, o assistente de Inteligência Artificial mais avançado de e-mail corporativo. O utilizador fornecerá uma instrução para escrever um e-mail.
Regras Obrigatórias:
1. Responde EXCLUSIVAMENTE em formato JSON com duas chaves: "subject" (o assunto perfeito, profissional e chamativo) e "body" (o corpo completo do e-mail em português impecável, com saudações executivas e despedida).
2. Não incluas marcações markdown como \`\`\`json no topo ou fim do texto, responde apenas com o JSON limpo.`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemInstruction}\n\nInstrução do Utilizador:\n${prompt}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    };

    // Modelos Ativos no Google AI Studio (gemini-3.6-flash -> gemini-3.5-flash)
    const models = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"];
    let aiResponseText = "";

    for (const model of models) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        });

        if (res.ok) {
          const data = await res.json();
          aiResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (aiResponseText) break;
        } else {
          const errText = await res.text();
          console.warn(`Model ${model} returned HTTP ${res.statusCode}:`, errText);
        }
      } catch (e) {
        console.warn(`Model ${model} fetch failed:`, e);
      }
    }

    if (!aiResponseText) {
      return NextResponse.json({ 
        subject: "Comunicação Oficial",
        body: `Olá,\n\nRelativamente ao assunto solicitado, venho por este meio comunicar que a nossa equipa analisou os detalhes com toda a atenção.\n\nFico à disposição para qualquer esclarecimento adicional.\n\nCom os melhores cumprimentos,\nEquipa RapiEmail`
      });
    }

    // Se for no modo resumo, devolve o texto direto
    if (mode === "summary") {
      return NextResponse.json({ summary: aiResponseText });
    }

    // Limpar possíveis invólucros markdown do JSON
    let cleanJson = aiResponseText.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```/, "").replace(/```$/, "").trim();
    }

    try {
      const parsed = JSON.parse(cleanJson);
      return NextResponse.json({
        subject: parsed.subject || "Comunicação Oficial",
        body: parsed.body || aiResponseText
      });
    } catch (parseErr) {
      return NextResponse.json({
        subject: "Comunicação Oficial",
        body: aiResponseText
      });
    }

  } catch (error: any) {
    console.error("Gemini AI Route Error:", error);
    return NextResponse.json({ error: "Erro na API do Google AI Studio." }, { status: 500 });
  }
}
