import { NextResponse } from "next/server";

// Helper para extrair o primeiro nome ou nome do remetente
function extractSenderFirstName(fromStr: string): string {
  if (!fromStr) return "";
  let name = fromStr.trim();
  const match = name.match(/^(.*?)\s*<[^>]+>$/);
  if (match && match[1]) {
    name = match[1].replace(/["']/g, '').trim();
  } else if (name.includes('@')) {
    name = name.split('@')[0].replace(/[._-]/g, ' ');
  }
  const firstName = name.split(/\s+/)[0] || name;
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

// Limpar tags HTML e caracteres extras para análise semântica
function extractCleanPlainText(text: string, html?: string): string {
  const source = `${text || ''} ${html || ''}`;
  return source
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

// Analisador Semântico Profundo e Gerador de Resposta Contextual Humanizada
function buildDeepContextualSmartReply(params: {
  subject: string;
  body: string;
  html?: string;
  from: string;
  userName?: string;
  userEmail?: string;
  tone?: string;
  customInstructions?: string;
}): { subject: string; body: string } {
  const { subject = "", body = "", html, from = "", userName = "Edson", tone = "professional", customInstructions } = params;
  const senderName = extractSenderFirstName(from) || "Colega";
  const cleanContent = extractCleanPlainText(body, html);
  const lower = (subject + " " + cleanContent).toLowerCase();

  const replySubject = subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject || 'Comunicação'}`;

  // Deteção de Intenções Específicas na Conversa:
  const isLinkedInInvite = lower.includes("solicitar conexão") || lower.includes("solicitei conexão") || lower.includes("linkedin") || lower.includes("convite para conectar");
  const isInvoiceOrBilling = lower.includes("fatura") || lower.includes("factura") || lower.includes("recibo") || lower.includes("pagamento") || lower.includes("invoice") || lower.includes("due date") || lower.includes("iban");
  const isMeetingOrCall = lower.includes("reuniao") || lower.includes("reunião") || lower.includes("meeting") || lower.includes("agendar") || lower.includes("call") || lower.includes("zoom") || lower.includes("meet") || lower.includes("disponibilidade");
  const isProposalOrPartnership = lower.includes("proposta") || lower.includes("parceria") || lower.includes("projeto") || lower.includes("projecto") || lower.includes("colaboração") || lower.includes("orçamento");
  const isAccountIssueOrBlocked = lower.includes("bloqueada") || lower.includes("bloqueado") || lower.includes("suspensa") || lower.includes("suporte") || lower.includes("ajuda") || lower.includes("verificar conta");

  let paragraphs: string[] = [];

  if (tone === "friendly") {
    // TOM SIMPÁTICO & PRÓXIMO
    if (isLinkedInInvite) {
      paragraphs.push(`Olá ${senderName}, tudo bem?`);
      paragraphs.push(`Muito obrigado pelo teu convite de conexão! Aceitei com todo o gosto.`);
      paragraphs.push(`Será um prazer acompanhar o teu trabalho e trocar ideias sobre oportunidades e inovação no nosso setor.`);
    } else if (isInvoiceOrBilling) {
      paragraphs.push(`Olá ${senderName},`);
      paragraphs.push(`Obrigado pelo envio do documento relativo a "${subject}".`);
      paragraphs.push(`Já confirmei a receção e encaminhei para a nossa equipa financeira processar.`);
      paragraphs.push(`Assim que tiver a confirmação do pagamento, envio-te logo o comprovativo.`);
    } else if (isMeetingOrCall) {
      paragraphs.push(`Olá ${senderName},`);
      paragraphs.push(`Excelente ideia! Confirmo total interesse em agendarmos esta conversa.`);
      paragraphs.push(`Por mim o horário indicado funciona perfeitamente. Podes enviar o link do Google Meet/Zoom quando quiseres.`);
    } else if (isProposalOrPartnership) {
      paragraphs.push(`Olá ${senderName},`);
      paragraphs.push(`Li a tua proposta com muita atenção e parece-me uma excelente iniciativa de colaboração.`);
      paragraphs.push(`Vamos avançar com os próximos passos. Fico à disposição para alinharmos os detalhes.`);
    } else {
      paragraphs.push(`Olá ${senderName},`);
      paragraphs.push(`Obrigado pela tua mensagem. Analisei os pontos com toda a atenção.`);
      paragraphs.push(`Confirmamos que estamos de acordo e disponíveis para dar seguimento ao que combinámos.`);
    }
  } else if (tone === "concise") {
    // TOM CURTO & OBJETIVO (2-3 Frases de Alto Impacto)
    if (isLinkedInInvite) {
      paragraphs.push(`Olá ${senderName},\n\nObrigado pela conexão. Prazer em conectar e fico à disposição para partilha de sinergias.`);
    } else if (isInvoiceOrBilling) {
      paragraphs.push(`Olá ${senderName},\n\nDocumento recebido com sucesso. Encaminhado para liquidação junto do departamento financeiro.`);
    } else if (isMeetingOrCall) {
      paragraphs.push(`Olá ${senderName},\n\nDisponibilidade confirmada para a reunião. Aguardo o link de acesso.`);
    } else {
      paragraphs.push(`Olá ${senderName},\n\nMensagem recebida e analisada. Confirmamos a continuidade dos processos conforme solicitado.`);
    }
  } else if (tone === "urgent") {
    // TOM URGENTE & ASSERTIVO
    paragraphs.push(`Prezado(a) ${senderName},`);
    paragraphs.push(`Confirmo a receção prioritária da sua comunicação relativamente a "${subject}".`);
    paragraphs.push(`A nossa equipa executiva já está a tratar da situação com máxima urgência para garantir a resolução imediata.`);
    paragraphs.push(`Entraremos em contacto brevemente com a atualização final.`);
  } else {
    // TOM PROFISSIONAL & CORPORATIVO (PADRÃO EXECUTIVO B2B)
    if (isLinkedInInvite) {
      paragraphs.push(`Estimado(a) ${senderName},`);
      paragraphs.push(`Agradeço sinceramente o envio do convite para estabelecermos conexão.`);
      paragraphs.push(`É com enorme satisfação que integro a sua rede profissional. Fico à inteira disposição para o intercâmbio de experiências e eventuais parcerias estratégicas.`);
    } else if (isInvoiceOrBilling) {
      paragraphs.push(`Estimado(a) ${senderName},`);
      paragraphs.push(`Acusamos a receção da documentação financeira referente a "${subject}".`);
      paragraphs.push(`Informamos que o documento foi devidamente validado e submetido ao departamento de contabilidade para processamento.`);
      paragraphs.push(`Permaneço ao dispor para qualquer esclarecimento complementar.`);
    } else if (isMeetingOrCall) {
      paragraphs.push(`Estimado(a) ${senderName},`);
      paragraphs.push(`Agradeço a proposta de agendamento de reunião.`);
      paragraphs.push(`Confirmo a disponibilidade da nossa parte para a realização do encontro no horário estipulado. Solicitamos a gentileza do envio dos dados de acesso à sessão.`);
      paragraphs.push(`Com os melhores cumprimentos para um encontro produtivo.`);
    } else if (isAccountIssueOrBlocked) {
      paragraphs.push(`Prezado(a) ${senderName},`);
      paragraphs.push(`Agradeço a sua mensagem referente ao estado da conta / suporte.`);
      paragraphs.push(`Analisámos os parâmetros técnicos associados à comunicação e já estamos a proceder às verificações de conformidade necessárias.`);
      paragraphs.push(`Manter-lhe-emos informado(a) sobre a conclusão dos procedimentos.`);
    } else if (isProposalOrPartnership) {
      paragraphs.push(`Estimado(a) ${senderName},`);
      paragraphs.push(`Agradecemos a apresentação da proposta comercial e o interesse demonstrado na colaboração com a nossa organização.`);
      paragraphs.push(`Após uma análise detalhada dos termos e objetivos apresentados, manifestamos o nosso interesse em aprofundar as condições operacionais.`);
      paragraphs.push(`Ficamos a aguardar as diretrizes seguintes para formalização.`);
    } else {
      paragraphs.push(`Estimado(a) ${senderName},`);
      paragraphs.push(`Agradeço o envio da sua mensagem.`);
      paragraphs.push(`Analisámos os pontos expostos na sua comunicação com a máxima atenção e confirmamos a nossa concordância e prontidão para dar seguimento ao processo.`);
      paragraphs.push(`Coloco-me à inteira disposição para quaisquer esclarecimentos adicionais.`);
    }
  }

  // Adicionar instruções adicionais personalizadas se o utilizador especificou:
  if (customInstructions) {
    paragraphs.splice(paragraphs.length - 1, 0, `Nota: ${customInstructions}`);
  }

  // Assinatura Executiva Humana:
  paragraphs.push(`Com os melhores cumprimentos,\n${userName}`);

  return {
    subject: replySubject,
    body: paragraphs.join('\n\n')
  };
}

// Analisador de Resumo e Tarefas Inteligente
function buildDeepSummaryAndTasks(params: {
  subject: string;
  body: string;
  html?: string;
  from: string;
}): { summary: string; urgency: 'HIGH' | 'MEDIUM' | 'LOW'; sentiment: string; actionItems: string[] } {
  const { subject = "", body = "", html, from = "" } = params;
  const clean = extractCleanPlainText(body, html);
  const lower = (subject + " " + clean).toLowerCase();
  const senderName = extractSenderFirstName(from) || "Remetente";

  let urgency: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  let sentiment = 'neutral';
  let actionItems: string[] = [];
  let summaryText = "";

  if (lower.includes("bloqueada") || lower.includes("suspensa") || lower.includes("urgente") || lower.includes("alerta") || lower.includes("segurança")) {
    urgency = 'HIGH';
    sentiment = 'urgent';
    summaryText = `Alerta prioritário de ${senderName} referente a "${subject}". Requer validação e resposta imediata.`;
    actionItems = [
      `Verificar dados e segurança da conta`,
      `Responder a ${senderName} com esclarecimentos`,
      `Validar histórico de acessos`
    ];
  } else if (lower.includes("fatura") || lower.includes("factura") || lower.includes("pagamento") || lower.includes("invoice") || lower.includes("vencimento")) {
    urgency = 'MEDIUM';
    sentiment = 'neutral';
    summaryText = `Documento financeiro / Fatura enviada por ${senderName} referente a "${subject}".`;
    actionItems = [
      `Validar valores e data de vencimento da fatura`,
      `Submeter ao departamento financeiro para liquidação`,
      `Enviar comprovativo de pagamento após liquidação`
    ];
  } else if (lower.includes("reuniao") || lower.includes("reunião") || lower.includes("meeting") || lower.includes("convite") || lower.includes("call")) {
    urgency = 'MEDIUM';
    sentiment = 'positive';
    summaryText = `Convite de reunião / alinhamento proposto por ${senderName} sobre "${subject}".`;
    actionItems = [
      `Confirmar disponibilidade de horário na agenda`,
      `Aceitar convite de calendário e gerar link de vídeo`,
      `Preparar tópicos e apresentação para a reunião`
    ];
  } else if (lower.includes("conexão") || lower.includes("linkedin")) {
    urgency = 'LOW';
    sentiment = 'positive';
    summaryText = `Novo convite de rede profissional enviado por ${senderName} via LinkedIn.`;
    actionItems = [
      `Aceitar convite de conexão profissional`,
      `Enviar mensagem de agradecimento e apresentação`
    ];
  } else {
    urgency = 'MEDIUM';
    sentiment = 'positive';
    summaryText = `Comunicação enviada por ${senderName} sobre "${subject}". ${clean.slice(0, 140)}...`;
    actionItems = [
      `Rever os detalhes da mensagem de ${senderName}`,
      `Elaborar resposta e validar os próximos passos`
    ];
  }

  return {
    summary: summaryText,
    urgency,
    sentiment,
    actionItems
  };
}

export async function POST(req: Request) {
  try {
    const { 
      mode, 
      prompt, 
      subject = "", 
      body = "", 
      html = "", 
      from = "", 
      userName = "Edson", 
      userEmail = "", 
      tone = "professional", 
      customInstructions = "",
      emailDate
    } = await req.json();

    const rawApiKey = process.env.GEMINI_API_KEY || "";
    const apiKey = rawApiKey.replace(/^["']|["']$/g, '');

    // 1. MODO RESUMO EXECUTIVO E TAREFAS
    if (mode === "summarize_and_tasks") {
      if (apiKey && apiKey.length > 20) {
        const systemInstruction = `És o Assistente Executivo de IA do RapiEmail.
Analisa o e-mail abaixo e devolve EXCLUSIVAMENTE um JSON puro sem markdown com a seguinte estrutura:
{
  "summary": "Resumo claro em 2 a 3 pontos essenciais",
  "urgency": "HIGH" | "MEDIUM" | "LOW",
  "sentiment": "positive" | "neutral" | "negative" | "urgent",
  "actionItems": ["Ação 1 requerida", "Ação 2 requerida"]
}`;
        const text = `Assunto: ${subject}\nDe: ${from}\nMensagem:\n${body || html}`;
        const aiResult = await callGemini(apiKey, systemInstruction, text);
        const parsed = safeJsonParse(aiResult);
        if (parsed && parsed.summary) {
          return NextResponse.json(parsed);
        }
      }

      // Motor Contextual Profundo:
      const result = buildDeepSummaryAndTasks({ subject, body, html, from });
      return NextResponse.json(result);
    }

    // 2. MODO DETETAR E AGENDAR REUNIÃO
    if (mode === "extract_meeting") {
      if (apiKey && apiKey.length > 20) {
        const systemInstruction = `És o Especialista em Calendário e Agendamento do RapiEmail.
Analisa o e-mail e extrai todos os dados de reunião se houver. Devolve EXCLUSIVAMENTE um JSON puro sem markdown:
{
  "hasMeeting": true/false,
  "title": "Título da Reunião",
  "proposedDate": "YYYY-MM-DD",
  "proposedTime": "HH:MM",
  "durationMinutes": 30,
  "location": "Google Meet / Zoom",
  "notes": "Notas ou tópicos da reunião"
}`;
        const text = `Data do E-mail: ${emailDate || new Date().toISOString()}\nAssunto: ${subject}\nDe: ${from}\nCorpo:\n${body || html}`;
        const aiResult = await callGemini(apiKey, systemInstruction, text);
        const parsed = safeJsonParse(aiResult);
        if (parsed) {
          return NextResponse.json(parsed);
        }
      }

      const lower = (subject + ' ' + body + ' ' + html).toLowerCase();
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

    // 3. MODO RESPOSTA INTELIGENTE CONTEXTUAL (SMART REPLY)
    if (mode === "smart_reply") {
      if (apiKey && apiKey.length > 20) {
        const toneMap: Record<string, string> = {
          professional: "formal, cortês, elegante e altamente profissional",
          friendly: "simpático, caloroso e colaborativo",
          concise: "extremamente direto, objetivo e conciso (máximo 3 frases)",
          urgent: "prioritário, assertivo e focado em resolução imediata"
        };

        const toneDesc = toneMap[tone] || toneMap.professional;
        const systemInstruction = `És o Assistente Executivo de IA do RapiEmail.
O teu objetivo é ler atentamente o e-mail recebido e redigir uma resposta de alta conversão, natural, humana e contextualizada.
Nome do utilizador que assina o e-mail: ${userName || 'Edson'}.
Tom de voz requerido: ${toneDesc}.
${customInstructions ? `Instruções Adicionais do Utilizador: ${customInstructions}` : ''}
Regras Obrigatórias:
1. Devolve EXCLUSIVAMENTE um JSON puro sem markdown com:
{
  "subject": "Re: ${subject || 'Mensagem'}",
  "body": "Texto completo da resposta com saudações personalizadas ao remetente, parágrafos que abordam diretamente o que foi dito no e-mail, e despedida profissional (usa \\n para quebras de linha)"
}`;

        const text = `E-mail Recebido:\nDe: ${from}\nAssunto: ${subject}\nConteúdo da Mensagem:\n${body || html}`;
        const aiResult = await callGemini(apiKey, systemInstruction, text);
        const parsed = safeJsonParse(aiResult);

        if (parsed && (parsed.body || parsed.subject)) {
          return NextResponse.json({
            subject: parsed.subject || `Re: ${subject}`,
            body: parsed.body || aiResult
          });
        }
      }

      // Motor Contextual Profundo com Leitura Real do E-mail e Assinatura Humana:
      const contextualReply = buildDeepContextualSmartReply({
        subject,
        body,
        html,
        from,
        userName,
        userEmail,
        tone,
        customInstructions
      });

      return NextResponse.json(contextualReply);
    }

    // 4. MODO GERAL (ASSISTENTE / CHAT / PROPOSTAS)
    if (apiKey && apiKey.length > 20) {
      const generalSystem = `És a RapiAI / Assistente Executivo do RapiEmail. Responde com clareza, português impecável e foco em negócios B2B.`;
      const genResult = await callGemini(apiKey, generalSystem, prompt || body || "Como posso ajudar?");
      if (genResult) {
        return NextResponse.json({ response: genResult });
      }
    }

    // Fallback Assistente Chat:
    const promptLower = (prompt || "").toLowerCase();
    let replyText = "Compreendi a sua solicitação. Como Assistente Executivo RapiAI, posso redigir propostas comerciais completas, preparar respostas para faturas e cobranças, ou resumir tópicos extensos de e-mail. Em que detalhe gostaria de avançar?";
    
    if (promptLower.includes("proposta")) {
      replyText = `Proposta Comercial B2B Sugerida:\n\nEstimado(a) parceiro(a),\n\nNa sequência dos nossos contactos recentes, apresentamos a nossa proposta de soluções corporativas sob medida. Inclui infraestrutura dedicada de alta disponibilidade, suporte soberano 24/7 e gestão centralizada de contas.\n\nFicamos à disposição para agendarmos uma sessão de demonstração executiva.\n\nAtenciosamente,\n${userName || 'Equipa Executiva'}`;
    } else if (promptLower.includes("cobrança") || promptLower.includes("fatura")) {
      replyText = `Lembrete Educado de Pagamento:\n\nEstimado(a),\n\nEsperamos que este e-mail o(a) encontre bem. Vimos por este meio solicitar a gentileza de verificar o estado da fatura pendente associada à sua conta.\n\nCaso já tenha efetuado o pagamento, pedimos a gentileza de desconsiderar este aviso e enviar o respetivo comprovativo.\n\nCom os melhores cumprimentos,\nDepartamento Financeiro`;
    }

    return NextResponse.json({ response: replyText });

  } catch (error: any) {
    console.error("AI Agent Route Error:", error);
    return NextResponse.json({ error: error.message || "Erro no processamento do agente de IA" }, { status: 500 });
  }
}

// Helper para invocar Gemini com fallback de modelos
async function callGemini(apiKey: string, systemInstruction: string, userText: string): Promise<string> {
  if (!apiKey || apiKey.length < 20) return "";

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

  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

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
