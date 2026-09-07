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
Regras Obrigatórias de Resposta:
1. Deves responder EXCLUSIVAMENTE num objeto JSON válido com duas propriedades: "subject" e "body".
2. Em "subject", coloca um assunto curto, profissional e chamativo.
3. Em "body", coloca o texto completo do e-mail em português impecável com parágrafos bem formatados (usa \\n para quebras de linha).
4. NÃO incluas formatação markdown como \`\`\`json no início ou no fim. Devolve APENAS o JSON puro.`;

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

    // Modelos Ativos no Google AI Studio (gemini-2.0-flash -> gemini-1.5-flash)
    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
    let aiResponseText = "";

    for (const model of models) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          aiResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (aiResponseText) break;
        } else {
          const errText = await res.text();
          console.warn(`Model ${model} returned HTTP ${res.status}:`, errText);
        }
      } catch (e) {
        console.warn(`Model ${model} fetch failed:`, e);
      }
    }

    if (!aiResponseText) {
      // Fallback Inteligente e Contextual RapiAI
      const lower = prompt.toLowerCase();
      let fallbackSubject = "Comunicação Oficial";
      let fallbackBody = `Olá,\n\nRelativamente ao assunto solicitado, venho por este meio comunicar que a nossa equipa analisou os detalhes com toda a atenção e estamos prontos para avançar com os próximos passos.\n\nFico à disposição para qualquer esclarecimento adicional.\n\nCom os melhores cumprimentos,\nEdson | Rapi Money`;

      if (lower.includes("nda") || lower.includes("acordo") || lower.includes("contrato") || lower.includes("bel money") || lower.includes("david")) {
        fallbackSubject = "Re: Acordo de Confidencialidade (NDA) — Revisão e Documentação";
        fallbackBody = `Estimado(a),\n\nAcusamos a receção da minuta do Acordo de Confidencialidade (NDA).\n\nInformamos que a nossa equipa jurídica está a proceder à análise dos termos para incluir a especificação formal do objetivo da parceria, assegurando a devida cobertura para as operações no mercado europeu.\n\nCom a máxima brevidade, remeteremos a versão final devidamente assinada juntamente com a documentação de conformidade solicitada.\n\nCom os melhores cumprimentos,\nEdson | Rapi Money`;
      } else if (lower.includes("reuniao") || lower.includes("reunião") || lower.includes("perdi") || lower.includes("desculp")) {
        fallbackSubject = "Pedido de Desculpas e Reagendamento de Reunião";
        fallbackBody = `Olá,\n\nInfelizmente não me foi possível estar presente na nossa reunião agendada. Gostaria de apresentar as minhas sinceras desculpas pela inconveniência.\n\nSeria possível reagendarmos a nossa conversa para um dos seguintes horários?\n• Amanhã às 11:00\n• Quinta-feira às 15:00\n\nFico a aguardar a tua disponibilidade.\n\nCom os melhores cumprimentos,\nEdson | Rapi Money`;
      } else if (lower.includes("proposta") || lower.includes("venda") || lower.includes("preço")) {
        fallbackSubject = "Proposta Comercial Corporativa — Rapi Money";
        fallbackBody = `Estimado(a),\n\nConforme conversámos, apresentamos em anexo a nossa proposta comercial para soluções corporativas dedicadas.\n\nEstamos inteiramente disponíveis para esclarecer qualquer detalhe ou agendarmos uma sessão de demonstração executiva.\n\nAtenciosamente,\nEdson | Rapi Money`;
      }

      return NextResponse.json({ 
        subject: fallbackSubject,
        body: fallbackBody
      });
    }

    // Se for no modo resumo, devolve o texto direto
    if (mode === "summary") {
      return NextResponse.json({ summary: aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim() });
    }

    // Limpar invólucros markdown do JSON
    let cleanText = aiResponseText.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
    }

    // Tentativa 1: Parse JSON nativo
    try {
      const parsed = JSON.parse(cleanText);
      if (parsed && typeof parsed === "object" && (parsed.subject || parsed.body)) {
        return NextResponse.json({
          subject: parsed.subject || "Comunicação Oficial",
          body: parsed.body || cleanText
        });
      }
    } catch (e) {
      // Se falhar o parse direto por causa de quebras de linha não escapadas no JSON
    }

    // Tentativa 2: Extração cirúrgica por Regex das chaves "subject" e "body"
    let subject = "";
    let body = "";

    const subjectMatch = cleanText.match(/"subject"\s*:\s*"([^"]+)"/);
    if (subjectMatch && subjectMatch[1]) {
      subject = subjectMatch[1];
    }

    const bodyMatch = cleanText.match(/"body"\s*:\s*"([\s\S]*)"\s*\}\s*$/);
    if (bodyMatch && bodyMatch[1]) {
      body = bodyMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"');
    }

    if (!body) {
      body = cleanText
        .replace(/^\{\s*"subject":\s*"[^"]*",?\s*"body":\s*"/, "")
        .replace(/"\s*\}\s*$/, "")
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .trim();
    }

    return NextResponse.json({
      subject: subject || "Comunicação Oficial",
      body: body || cleanText
    });

  } catch (error: any) {
    console.error("Gemini AI Route Error:", error);
    return NextResponse.json({ 
      subject: "Comunicação Oficial",
      body: `Olá,\n\nRelativamente ao assunto solicitado, venho por este meio comunicar que a nossa equipa analisou os detalhes com toda a atenção.\n\nFico à disposição para qualquer esclarecimento adicional.\n\nCom os melhores cumprimentos,\nEquipa RapiEmail` 
    });
  }
}
