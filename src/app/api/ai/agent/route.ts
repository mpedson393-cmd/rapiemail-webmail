import { NextResponse } from "next/server";

interface SenderInfo {
  name: string;
  firstName: string;
  company: string;
  email: string;
}

// Extrair detalhes limpos do remetente
function extractSenderDetails(fromStr: string): SenderInfo {
  if (!fromStr) return { name: "Colega", firstName: "Colega", company: "", email: "" };
  let name = fromStr.trim();
  let email = "";
  const match = name.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    name = match[1].replace(/["']/g, '').trim();
    email = match[2].trim().toLowerCase();
  } else if (name.includes('@')) {
    email = name.replace(/[<>]/g, '').trim().toLowerCase();
    name = email.split('@')[0].replace(/[._-]/g, ' ');
  }
  const firstName = name.split(/\s+/)[0] || name;
  const lowerFrom = fromStr.toLowerCase();
  
  let company = "";
  if (lowerFrom.includes('dlocal')) company = 'dLocal';
  else if (lowerFrom.includes('ionos')) company = 'IONOS';
  else if (lowerFrom.includes('sinch')) company = 'Sinch';
  else if (lowerFrom.includes('twilio')) company = 'Twilio';
  else if (lowerFrom.includes('stripe')) company = 'Stripe';
  else if (lowerFrom.includes('linkedin')) company = 'LinkedIn';
  else if (lowerFrom.includes('google')) company = 'Google';
  else if (lowerFrom.includes('resend')) company = 'Resend';
  else if (lowerFrom.includes('digitalocean')) company = 'DigitalOcean';
  else if (lowerFrom.includes('microsoft')) company = 'Microsoft';
  else if (lowerFrom.includes('apple')) company = 'Apple';

  return {
    name,
    firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
    company,
    email
  };
}

// Limpar tags HTML e formatar texto simples
function extractCleanPlainText(text: string, html?: string): string {
  const source = `${text || ''} ${html || ''}`;
  return source
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/https?:\/\/[^\s]+/g, url => url)
    .replace(/\s+/g, ' ')
    .trim();
}

// Analisador Inteligente de Conversas (Analisa a mensagem real enviada)
function analyzeConversation(params: {
  subject: string;
  body: string;
  html?: string;
  from: string;
}) {
  const { subject = "", body = "", html = "", from = "" } = params;
  const rawContent = `${body}\n${html}`;
  const cleanBody = extractCleanPlainText(body, html);
  const lower = (subject + "\n" + cleanBody).toLowerCase();
  const sender = extractSenderDetails(from);

  // 1. Deteção de Credenciais / Chaves de API / Integração Técnica
  const apiMatches = Array.from(rawContent.matchAll(/([A-Z0-9_]{3,35})\s*=\s*([^\s\n\r"']+)/g));
  const hasApiKeys = apiMatches.length > 0 || 
                     lower.includes("secret_key") || 
                     lower.includes("login=") || 
                     lower.includes("trans_key") || 
                     lower.includes("api_key=") ||
                     lower.includes("token=");

  const keyNames = Array.from(new Set(apiMatches.map(m => m[1])));
  const apiUrlMatch = rawContent.match(/https?:\/\/[a-zA-Z0-9.\-_/:]+/);
  const apiUrl = apiUrlMatch ? apiUrlMatch[0] : "";
  
  let detectedService = sender.company;
  if (!detectedService) {
    if (lower.includes("dlocal")) detectedService = "dLocal";
    else if (lower.includes("stripe")) detectedService = "Stripe";
    else if (lower.includes("resend")) detectedService = "Resend";
    else if (lower.includes("digitalocean")) detectedService = "DigitalOcean";
    else if (lower.includes("porkbun")) detectedService = "Porkbun";
    else if (lower.includes("twilio")) detectedService = "Twilio";
    else if (lower.includes("sinch")) detectedService = "Sinch";
    else if (lower.includes("ionos")) detectedService = "IONOS";
  }

  // 2. Deteção de Faturas / Documentos de Cobrança Reais (Sem chaves de API)
  const isInvoice = !hasApiKeys && (
    lower.includes("a sua fatura") || 
    lower.includes("fatura ionos") || 
    lower.includes("fatura n.") || 
    lower.includes("factura n.") || 
    lower.includes("invoice #") || 
    lower.includes("customer number:") || 
    lower.includes("dados de pagamento")
  );
  
  const invoiceNumMatch = subject.match(/(?:n[º°.\s]*|#)\s*([0-9A-Z\-_/]{4,25})/i) || cleanBody.match(/(?:fatura|factura|invoice)\s*(?:n[º°.\s]*|number|#)?\s*:?\s*([0-9A-Z\-_/]{4,25})/i);
  const invoiceNum = invoiceNumMatch ? invoiceNumMatch[1] : "";
  const customerNumMatch = cleanBody.match(/customer\s*number\s*:\s*([0-9A-Z\-_]+)/i);
  const customerNum = customerNumMatch ? customerNumMatch[1] : "";

  // 3. Deteção de Conexões e Convites do LinkedIn
  const isLinkedIn = lower.includes("solicitar conexão") || 
                     lower.includes("solicitei conexão") || 
                     lower.includes("convidou-te a conectar") || 
                     lower.includes("convite para conectar") ||
                     lower.includes("mais de 10 convites novos");
  
  const linkedinRoleMatch = cleanBody.match(/([A-Z][a-zA-Z\s]+),\s*([^,\n\r]+(?:CEO|Consultant|Manager|Partner|Founder|Director|Head|Lead)[^,\n\r]+)/i);
  const linkedinContact = linkedinRoleMatch ? `${linkedinRoleMatch[1]} (${linkedinRoleMatch[2].trim()})` : sender.name;

  // 4. Deteção de Suporte / Conta Bloqueada / Conformidade (KYC)
  const isAccountSupport = !hasApiKeys && (
    lower.includes("bloqueada") || 
    lower.includes("suspensa") || 
    lower.includes("classifique sua conversa") || 
    lower.includes("documentos de conformidade") || 
    lower.includes("reativação de conta")
  );

  // 5. Deteção de Reunião / Agendamento
  const isMeeting = !hasApiKeys && (
    lower.includes("reuniao") || 
    lower.includes("reunião") || 
    lower.includes("meeting") || 
    lower.includes("call de alinhamento") || 
    lower.includes("agendar uma conversa") || 
    lower.includes("meet.google.com") ||
    lower.includes("zoom.us")
  );

  // 6. Perguntas diretas na conversa
  const hasQuestions = cleanBody.includes("?") || lower.includes("qual") || lower.includes("como") || lower.includes("quando") || lower.includes("quanto");

  return {
    sender,
    cleanBody,
    hasApiKeys,
    keyNames,
    apiUrl,
    detectedService,
    isInvoice,
    invoiceNum,
    customerNum,
    isLinkedIn,
    linkedinContact,
    isAccountSupport,
    isMeeting,
    hasQuestions
  };
}

// Gerador de Resumo e Tarefas Baseado 100% no Conteúdo Real do Email
function generateSmartSummaryAndTasks(params: {
  subject: string;
  body: string;
  html?: string;
  from: string;
}) {
  const analysis = analyzeConversation(params);
  const { subject = "" } = params;
  const { sender, hasApiKeys, keyNames, apiUrl, detectedService, isInvoice, invoiceNum, customerNum, isLinkedIn, linkedinContact, isAccountSupport, isMeeting, cleanBody } = analysis;

  let summary = "";
  let urgency: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  let actionItems: string[] = [];
  let sentiment = 'neutral';

  if (hasApiKeys) {
    const sName = detectedService ? `${detectedService}` : "de Integração";
    const keysPreview = keyNames.length > 0 ? ` (${keyNames.slice(0, 4).join(', ')})` : "";
    summary = `Envio de parâmetros e credenciais técnicas da API ${sName}${keysPreview}.`;
    urgency = "HIGH";
    sentiment = "positive";
    actionItems = [
      `Guardar as credenciais da API ${sName} de forma segura no ficheiro de ambiente (.env)`,
      `Configurar o endpoint de integração${apiUrl ? ` (${apiUrl})` : ''} no backend`,
      `Executar chamadas de teste e validar autenticação das transações`
    ];
  } else if (isLinkedIn) {
    summary = `Convite de rede profissional enviado por ${linkedinContact} através do LinkedIn.`;
    urgency = "LOW";
    sentiment = "positive";
    actionItems = [
      `Aceitar convite de conexão profissional no LinkedIn com ${sender.name}`,
      `Enviar mensagem de agradecimento e partilhar sinergias empresariais`
    ];
  } else if (isInvoice) {
    const comp = detectedService || sender.company || "Fornecedor";
    summary = `Fatura emitida por ${comp}${invoiceNum ? ` (N.º ${invoiceNum})` : ''}${customerNum ? ` — Cliente: ${customerNum}` : ''}.`;
    urgency = "MEDIUM";
    sentiment = "neutral";
    actionItems = [
      `Validar valores e itens discriminados na fatura${invoiceNum ? ` n.º ${invoiceNum}` : ''}`,
      `Submeter ao departamento financeiro para liquidação`,
      `Arquivar comprovativo para conciliação bancária e contabilística`
    ];
  } else if (isAccountSupport) {
    const comp = detectedService || sender.company || "Suporte";
    summary = `Comunicação de suporte e conformidade da ${comp} referente ao estado da conta / validação de acesso.`;
    urgency = "HIGH";
    sentiment = "urgent";
    actionItems = [
      `Reunir a documentação de conformidade solicitada pelo suporte da ${comp}`,
      `Submeter os dados requeridos para regularização imediata do serviço`,
      `Validar restabelecimento e funcionamento pleno da conta`
    ];
  } else if (isMeeting) {
    summary = `Proposta de agendamento de reunião / alinhamento com ${sender.name} sobre "${subject}".`;
    urgency = "MEDIUM";
    sentiment = "positive";
    actionItems = [
      `Verificar disponibilidade de agenda e confirmar data/horário`,
      `Gerar ou solicitar o link da sessão (Google Meet / Zoom)`,
      `Preparar pontos de discussão para o encontro`
    ];
  } else {
    const snippet = cleanBody.length > 20 ? cleanBody.slice(0, 160) : subject;
    summary = `Comunicação enviada por ${sender.name} sobre "${subject}": ${snippet}...`;
    urgency = "MEDIUM";
    sentiment = "positive";
    actionItems = [
      `Analisar o conteúdo e requisitos enviados por ${sender.name}`,
      `Elaborar resposta e validar os próximos passos do projeto`
    ];
  }

  return { summary, urgency, sentiment, actionItems };
}

// Gerador de Resposta Inteligente Baseado 100% na Mensagem Recebida
function generateSmartReply(params: {
  subject: string;
  body: string;
  html?: string;
  from: string;
  userName?: string;
  tone?: string;
  customInstructions?: string;
}) {
  const { subject = "", userName = "Edson RapiMoney IT", tone = "professional", customInstructions } = params;
  const analysis = analyzeConversation(params);
  const { sender, hasApiKeys, keyNames, apiUrl, detectedService, isInvoice, invoiceNum, customerNum, isLinkedIn, isAccountSupport, isMeeting, cleanBody } = analysis;

  const replySubject = subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject || 'Comunicação'}`;
  let paragraphs: string[] = [];

  // 1. Caso: Credenciais de API
  if (hasApiKeys) {
    const sName = detectedService ? `da API ${detectedService}` : "da API";
    const keysList = keyNames.length > 0 ? ` (${keyNames.slice(0, 3).join(', ')})` : "";
    
    if (tone === "friendly") {
      paragraphs.push(`Olá ${sender.firstName},`);
      paragraphs.push(`Confirmamos a receção das credenciais e parâmetros de configuração ${sName}${keysList}.`);
      paragraphs.push(`A nossa equipa técnica já está a integrar as chaves e a testar a comunicação com o endpoint${apiUrl ? ` (${apiUrl})` : ''} no nosso ambiente de desenvolvimento.`);
      paragraphs.push(`Assim que tivermos os testes concluídos e o fluxo validado, aviso-te de imediato.`);
    } else if (tone === "concise") {
      paragraphs.push(`Olá ${sender.firstName},\n\nCredenciais de API recebidas com sucesso. A equipa técnica já está a proceder à parametrização e testes de integração com o endpoint.`);
    } else {
      paragraphs.push(`Estimado(a) ${sender.firstName},`);
      paragraphs.push(`Confirmamos a receção das credenciais e parâmetros de integração ${sName}${keysList}.`);
      paragraphs.push(`Informamos que a nossa equipa técnica já está a proceder à configuração segura e aos respetivos testes de comunicação com o endpoint indicado${apiUrl ? ` (${apiUrl})` : ''}.`);
      paragraphs.push(`Manter-lhe-emos devidamente informado(a) sobre a conclusão dos testes e validação das transações.`);
    }
  }
  // 2. Caso: Convite LinkedIn
  else if (isLinkedIn) {
    if (tone === "friendly" || tone === "concise") {
      paragraphs.push(`Olá ${sender.firstName},`);
      paragraphs.push(`Muito obrigado pelo teu convite de conexão! Aceitei com todo o gosto.`);
      paragraphs.push(`Será um prazer acompanhar o teu percurso e partilharmos sinergias e ideias no nosso setor.`);
    } else {
      paragraphs.push(`Estimado(a) ${sender.name},`);
      paragraphs.push(`Agradeço sinceramente o envio do convite para estabelecermos conexão.`);
      paragraphs.push(`É com enorme satisfação que integro a sua rede profissional. Fico à inteira disposição para a partilha de experiências e potenciais sinergias corporativas.`);
    }
  }
  // 3. Caso: Fatura / Documento de Cobrança
  else if (isInvoice) {
    const comp = detectedService || sender.company || "Fornecedor";
    paragraphs.push(`Estimada equipa ${comp},`);
    paragraphs.push(`Confirmamos a receção da fatura${invoiceNum ? ` n.º ${invoiceNum}` : ''}${customerNum ? ` associada à conta de cliente ${customerNum}` : ''}.`);
    paragraphs.push(`O documento foi registado e submetido ao nosso departamento financeiro para conferência e respetiva liquidação.`);
    paragraphs.push(`Permaneço ao dispor para qualquer esclarecimento complementar.`);
  }
  // 4. Caso: Suporte / Conta / Regularização
  else if (isAccountSupport) {
    const comp = detectedService || sender.company || "Suporte";
    paragraphs.push(`Olá ${sender.firstName},`);
    paragraphs.push(`Agradeço o retorno relativo ao acompanhamento e validação da nossa conta${comp ? ` na ${comp}` : ''}.`);
    paragraphs.push(`Estamos inteiramente disponíveis para fornecer todos os esclarecimentos e documentação de conformidade solicitados para a regularização imediata do acesso.`);
    paragraphs.push(`Ficamos a aguardar as vossas instruções para conclusão dos procedimentos.`);
  }
  // 5. Caso: Reunião / Agendamento
  else if (isMeeting) {
    if (tone === "friendly") {
      paragraphs.push(`Olá ${sender.firstName},`);
      paragraphs.push(`Excelente iniciativa! Confirmo a nossa disponibilidade para realizarmos a reunião.`);
      paragraphs.push(`Por mim o horário indicado funciona perfeitamente. Podes enviar o link do Google Meet/Zoom quando for oportuno.`);
    } else {
      paragraphs.push(`Estimado(a) ${sender.firstName},`);
      paragraphs.push(`Agradeço a proposta para a realização da reunião.`);
      paragraphs.push(`Confirmo a disponibilidade da nossa parte para o encontro no horário estipulado. Solicitamos a gentileza do envio dos dados de acesso à sessão.`);
      paragraphs.push(`Ficamos na expectativa de uma conversa produtiva.`);
    }
  }
  // 6. Caso Geral: Conversa Natural
  else {
    const snippet = cleanBody.length > 20 ? cleanBody.slice(0, 180) : "";
    if (tone === "friendly") {
      paragraphs.push(`Olá ${sender.firstName},`);
      paragraphs.push(`Obrigado pela tua mensagem relativamente a "${subject}".`);
      paragraphs.push(`Analisámos os pontos com toda a atenção e estamos de acordo para avançarmos com os passos necessários.`);
      paragraphs.push(`Fico à disposição para qualquer detalhe adicional.`);
    } else if (tone === "concise") {
      paragraphs.push(`Olá ${sender.firstName},\n\nMensagem recebida e analisada com sucesso. Confirmamos a continuidade dos processos conforme solicitado.`);
    } else {
      paragraphs.push(`Estimado(a) ${sender.firstName},`);
      paragraphs.push(`Agradeço o envio da sua comunicação referente a "${subject}".`);
      paragraphs.push(`Analisámos os parâmetros com a máxima atenção e confirmamos a nossa concordância e total disponibilidade para dar o devido seguimento.`);
      paragraphs.push(`Coloco-me ao inteiro dispor para quaisquer esclarecimentos adicionais.`);
    }
  }

  // Instruções personalizadas do utilizador
  if (customInstructions) {
    paragraphs.splice(paragraphs.length - 1, 0, `Nota adicional: ${customInstructions}`);
  }

  paragraphs.push(`Com os melhores cumprimentos,\n${userName}`);

  return {
    subject: replySubject,
    body: paragraphs.join('\n\n')
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
      userName = "Edson RapiMoney IT", 
      tone = "professional", 
      customInstructions = "",
      emailDate
    } = await req.json();

    // 1. MODO RESUMO EXECUTIVO E TAREFAS
    if (mode === "summarize_and_tasks") {
      const summaryResult = generateSmartSummaryAndTasks({ subject, body, html, from });
      return NextResponse.json(summaryResult);
    }

    // 2. MODO RESPOSTA INTELIGENTE CONTEXTUAL
    if (mode === "smart_reply") {
      const replyResult = generateSmartReply({
        subject,
        body,
        html,
        from,
        userName,
        tone,
        customInstructions
      });
      return NextResponse.json(replyResult);
    }

    // 3. MODO DETETAR E AGENDAR REUNIÃO
    if (mode === "extract_meeting") {
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

    // 4. MODO GERAL / CHAT
    const promptLower = (prompt || "").toLowerCase();
    let replyText = "Compreendi a sua solicitação. Como Assistente Executivo RapiAI, posso redigir propostas comerciais completas, preparar respostas para integrações e credenciais de API, ou analisar documentos e tarefas pendentes. Em que detalhe gostaria de avançar?";
    
    if (promptLower.includes("proposta")) {
      replyText = `Proposta Comercial B2B Sugerida:\n\nEstimado(a) parceiro(a),\n\nNa sequência dos nossos contactos recentes, apresentamos a nossa proposta de soluções corporativas sob medida. Inclui infraestrutura dedicada de alta disponibilidade, suporte soberano 24/7 e gestão centralizada de contas.\n\nFicamos à disposição para agendarmos uma sessão de demonstração executiva.\n\nAtenciosamente,\n${userName}`;
    } else if (promptLower.includes("cobrança") || promptLower.includes("fatura")) {
      replyText = `Lembrete Educado de Pagamento:\n\nEstimado(a),\n\nEsperamos que este e-mail o(a) encontre bem. Vimos por este meio solicitar a gentileza de verificar o estado da fatura pendente associada à sua conta.\n\nCaso já tenha efetuado o pagamento, pedimos a gentileza de desconsiderar este aviso e enviar o respetivo comprovativo.\n\nCom os melhores cumprimentos,\nDepartamento Financeiro`;
    }

    return NextResponse.json({ response: replyText });

  } catch (error: any) {
    console.error("AI Agent Route Error:", error);
    return NextResponse.json({ error: error.message || "Erro no processamento do agente de IA" }, { status: 500 });
  }
}

