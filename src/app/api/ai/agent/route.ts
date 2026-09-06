import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { 
      mode, 
      prompt, 
      subject, 
      body, 
      from, 
      tone = "professional", 
      customInstructions = "",
      emailDate
    } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyCpVLmwi5oDz94e2nvSAuhlQZul0XoHdSc";

    // 1. MODO RESUMO EXECUTIVO E TAREFAS
    if (mode === "summarize_and_tasks") {
      const systemInstruction = `És o Assistente Executivo de IA do RapiEmail.
Analisa o e-mail abaixo e devolve EXCLUSIVAMENTE um JSON puro sem markdown com a seguinte estrutura:
{
  "summary": "Resumo claro em 2 a 3 pontos essenciais",
  "urgency": "HIGH" | "MEDIUM" | "LOW",
  "sentiment": "positive" | "neutral" | "negative" | "urgent",
  "actionItems": ["Ação 1 requerida", "Ação 2 requerida"]
}`;

      const text = `Assunto: ${subject || ''}\nDe: ${from || ''}\nMensagem:\n${body || ''}`;
      const aiResult = await callGemini(apiKey, systemInstruction, text);
      const parsed = safeJsonParse(aiResult);

      if (parsed && parsed.summary) {
        return NextResponse.json(parsed);
      }

      // Fallback inteligente se a IA não devolver JSON
      return NextResponse.json({
        summary: body ? `Resumo: Comunicação referente a "${subject || 'assunto geral'}".` : "Mensagem analisada.",
        urgency: (subject?.toLowerCase().includes("urgente") || body?.toLowerCase().includes("urgente")) ? "HIGH" : "MEDIUM",
        sentiment: "neutral",
        actionItems: ["Rever conteúdo do e-mail e responder"]
      });
    }

    // 2. MODO DETETAR E AGENDAR REUNIÃO
    if (mode === "extract_meeting") {
      const systemInstruction = `És o Especialista em Calendário e Agendamento do RapiEmail.
Analisa o e-mail e extrai todos os dados de reunião se houver. Devolve EXCLUSIVAMENTE um JSON puro sem markdown:
{
  "hasMeeting": true/false,
  "title": "Título da Reunião",
  "proposedDate": "YYYY-MM-DD" (ou data descrita no e-mail),
  "proposedTime": "HH:MM",
  "durationMinutes": 30 ou 60,
  "location": "Google Meet / Presencial / Zoom",
  "notes": "Notas ou tópicos da reunião"
}`;

      const text = `Data do E-mail: ${emailDate || new Date().toISOString()}\nAssunto: ${subject || ''}\nDe: ${from || ''}\nCorpo:\n${body || ''}`;
      const aiResult = await callGemini(apiKey, systemInstruction, text);
      const parsed = safeJsonParse(aiResult);

      if (parsed) {
        return NextResponse.json(parsed);
      }

      const lower = ((subject || '') + ' ' + (body || '')).toLowerCase();
      const hasKeywords = lower.includes("reuniao") || lower.includes("reunião") || lower.includes("meeting") || lower.includes("call") || lower.includes("agenda");

      return NextResponse.json({
        hasMeeting: hasKeywords,
        title: subject ? `Reunião: ${subject.replace(/re:/i, '').trim()}` : "Reunião de Alinhamento",
        proposedDate: new Date().toISOString().split('T')[0],
        proposedTime: "10:00",
        durationMinutes: 30,
        location: "Google Meet",
        notes: "Discussão de tópicos e alinhamento de projeto."
      });
    }

    // 3. MODO RESPOSTA INTELIGENTE (SMART REPLY)
    if (mode === "smart_reply") {
      const toneMap: Record<string, string> = {
        professional: "formal, cortês e altamente profissional",
        friendly: "simpático, caloroso e colaborativo",
        concise: "extremamente direto, objetivo e conciso (máximo 3 frases)",
        urgent: "prioritário, assertivo e focado em resolução imediata"
      };

      const toneDesc = toneMap[tone] || toneMap.professional;
      const systemInstruction = `És o Assistente Executivo de E-mail do RapiEmail.
Redige uma resposta completa para o e-mail fornecido.
Tom de voz requerido: ${toneDesc}.
${customInstructions ? `Instruções Adicionais do Utilizador: ${customInstructions}` : ''}
Regras Obrigatórias:
1. Devolve EXCLUSIVAMENTE um JSON puro sem markdown com:
{
  "subject": "Re: ${subject || 'Mensagem'}",
  "body": "Texto completo da resposta com saudações e despedida profissional (usa \\n para quebras de linha)"
}`;

      const text = `E-mail Recebido:\nDe: ${from || ''}\nAssunto: ${subject || ''}\nMensagem:\n${body || ''}`;
      const aiResult = await callGemini(apiKey, systemInstruction, text);
      const parsed = safeJsonParse(aiResult);

      if (parsed && (parsed.body || parsed.subject)) {
        return NextResponse.json({
          subject: parsed.subject || `Re: ${subject || ''}`,
          body: parsed.body || aiResult
        });
      }

      return NextResponse.json({
        subject: `Re: ${subject || 'Comunicação'}`,
        body: `Olá,\n\nAgradeço a sua mensagem. Analisei os detalhes e confirmo que estamos a dar seguimento ao processo.\n\nFico à total disposição para qualquer detalhe adicional.\n\nCom os melhores cumprimentos,\nRapiEmail Team`
      });
    }

    // 4. MODO GERAL (ASSISTENTE / CHAT / PROPOSTAS)
    const generalSystem = `És a RapiAI / Assistente Executivo do RapiEmail. Responde com clareza, português impecável e foco em negócios B2B.`;
    const genResult = await callGemini(apiKey, generalSystem, prompt || body || "Como posso ajudar?");
    return NextResponse.json({ response: genResult });

  } catch (error: any) {
    console.error("AI Agent Route Error:", error);
    return NextResponse.json({ error: error.message || "Erro no processamento do agente de IA" }, { status: 500 });
  }
}

// Helper para invocar Gemini com fallback de modelos
async function callGemini(apiKey: string, systemInstruction: string, userText: string): Promise<string> {
  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: `${systemInstruction}\n\n${userText}` }]
      }
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1000,
    }
  };

  const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"];

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    } catch (e) {}
  }

  return "";
}

// Helper para parse JSON seguro
function safeJsonParse(text: string): any {
  if (!text) return null;
  let clean = text.trim();
  if (clean.startsWith("```json")) {
    clean = clean.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
  } else if (clean.startsWith("```")) {
    clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
  }
  try {
    return JSON.parse(clean);
  } catch (e) {
    return null;
  }
}
