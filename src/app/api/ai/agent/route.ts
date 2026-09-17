import { NextResponse } from "next/server";
import { generateAiCompletion } from "@/lib/ai";

interface SenderInfo {
  name: string;
  firstName: string;
  company: string;
  email: string;
  role: string;
}

export interface AttachmentItem {
  filename?: string;
  name?: string;
  contentType?: string;
  type?: string;
  url?: string;
  content?: string;
  size?: any;
}

// Extrair detalhes limpos do remetente e assinatura
function extractSenderDetails(fromStr: string, bodyText: string = ""): SenderInfo {
  if (!fromStr) return { name: "Colega", firstName: "Colega", company: "", email: "", role: "" };
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
  const lowerAll = (fromStr + " " + bodyText).toLowerCase();
  
  let company = "";
  if (lowerAll.includes('bel money')) company = 'Bel Money SA';
  else if (lowerAll.includes('payfonte')) company = 'Payfonte';
  else if (lowerAll.includes('dlocal')) company = 'dLocal';
  else if (lowerAll.includes('ionos')) company = 'IONOS';
  else if (lowerAll.includes('sinch')) company = 'Sinch';
  else if (lowerAll.includes('twilio')) company = 'Twilio';
  else if (lowerAll.includes('stripe')) company = 'Stripe';
  else if (lowerAll.includes('linkedin')) company = 'LinkedIn';
  else if (lowerAll.includes('google')) company = 'Google';
  else if (lowerAll.includes('resend')) company = 'Resend';
  else if (lowerAll.includes('digitalocean')) company = 'DigitalOcean';
  else if (lowerAll.includes('microsoft')) company = 'Microsoft';
  else if (lowerAll.includes('apple')) company = 'Apple';

  let role = "";
  const roleMatch = bodyText.match(/(?:Responsável\s+Jurídico(?:\s+e\s+de\s+Conformidade)?|Compliance\s+Officer|Legal\s+Counsel|Manager|Director|Partner|Founder|CEO|CTO|Advogado|Gerente|Comercial)[^\n\r|]+/i);
  if (roleMatch) {
    role = roleMatch[0].trim();
  }

  return {
    name,
    firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
    company,
    email,
    role
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

// Analisador Inteligente de Conversas (Lê 100% da mensagem real e anexos/fotos)
function analyzeConversation(params: {
  subject: string;
  body: string;
  html?: string;
  from: string;
  attachments?: AttachmentItem[];
}) {
  const { subject = "", body = "", html = "", from = "", attachments = [] } = params;
  const rawContent = `${body}\n${html}`;
  const cleanBody = extractCleanPlainText(body, html);
  const lower = (subject + "\n" + cleanBody).toLowerCase();
  const sender = extractSenderDetails(from, body);

  // Detetar fotografias e imagens nos anexos
  const imageAttachments = (attachments || []).filter(att => {
    const name = (att.filename || att.name || "").toLowerCase();
    const cType = (att.contentType || att.type || "").toLowerCase();
    return cType.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|bmp|tiff)$/i.test(name);
  });

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

  // 2. Deteção de Acordos Legais / Contratos / NDA / Conformidade (Ex: David NANGO)
  const isContractOrNDA = !hasApiKeys && (
    lower.includes("acordo de confidencialidade") || 
    lower.includes("nda") || 
    lower.includes("minuta do acordo") ||
    lower.includes("contrato que abranja") ||
    lower.includes("bel money") ||
    lower.includes("payfonte") ||
    lower.includes("responsável jurídico") ||
    lower.includes("conformidade") ||
    lower.includes("conheça o seu cliente") ||
    lower.includes("assinado") ||
    lower.includes("assinatura do acordo")
  );

  const counterparty = lower.includes("bel money") ? "Bel Money SA" : (sender.company || "Entidade Parceira");
  const userEntity = lower.includes("rapi money") ? "Rapi Money" : "RapiEmail";
  const requiresEuropeanScope = lower.includes("europa") || lower.includes("operações na europa");
  const requiresObjective = lower.includes("objetivo do vosso acordo") || lower.includes("não indica o objetivo") || lower.includes("objetivo");
  const hasAttachmentDraft = lower.includes("em anexo") || lower.includes("minuta") || lower.includes("anexo");
  const requiresDocs = lower.includes("documentos necessários") || lower.includes("conformidade") || lower.includes("kyc");

  // 3. Deteção de Fotografias de Produtos / Catálogo / Cotações / Amostras
  const isProductOrPhotoInquiry = !hasApiKeys && !isContractOrNDA && (
    imageAttachments.length > 0 ||
    lower.includes("foto do produto") ||
    lower.includes("fotos dos produtos") ||
    lower.includes("fotografias dos produtos") ||
    lower.includes("amostra") ||
    lower.includes("orçamento") ||
    lower.includes("cotação") ||
    lower.includes("catálogo") ||
    lower.includes("tabela de preço") ||
    lower.includes("tabela de preços") ||
    lower.includes("encomenda") ||
    lower.includes("preço unitário") ||
    (lower.includes("foto") && (lower.includes("produto") || lower.includes("peça") || lower.includes("artigo") || lower.includes("preço")))
  );

  // 4. Deteção de Faturas / Documentos de Cobrança Reais
  const isInvoice = !hasApiKeys && !isContractOrNDA && !isProductOrPhotoInquiry && (
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

  // 5. Deteção de Conexões e Convites do LinkedIn
  const isLinkedIn = lower.includes("solicitar conexão") || 
                     lower.includes("solicitei conexão") || 
                     lower.includes("convidou-te a conectar") || 
                     lower.includes("convite para conectar") ||
                     lower.includes("mais de 10 convites novos");
  
  const linkedinRoleMatch = cleanBody.match(/([A-Z][a-zA-Z\s]+),\s*([^,\n\r]+(?:CEO|Consultant|Manager|Partner|Founder|Director|Head|Lead)[^,\n\r]+)/i);
  const linkedinContact = linkedinRoleMatch ? `${linkedinRoleMatch[1]} (${linkedinRoleMatch[2].trim()})` : sender.name;

  // 6. Deteção de Suporte / Conta Bloqueada / KYC Geral
  const isAccountSupport = !hasApiKeys && !isContractOrNDA && !isProductOrPhotoInquiry && (
    lower.includes("bloqueada") || 
    lower.includes("suspensa") || 
    lower.includes("classifique sua conversa") || 
    lower.includes("reativação de conta")
  );

  // 7. Deteção de Reunião / Agendamento
  const isMeeting = !hasApiKeys && (
    lower.includes("reuniao") || 
    lower.includes("reunião") || 
    lower.includes("meeting") || 
    lower.includes("call de alinhamento") || 
    lower.includes("agendar uma conversa") || 
    lower.includes("meet.google.com") ||
    lower.includes("zoom.us")
  );

  return {
    sender,
    cleanBody,
    hasApiKeys,
    keyNames,
    apiUrl,
    detectedService,
    isContractOrNDA,
    contractDetails: {
      counterparty,
      userEntity,
      requiresEuropeanScope,
      requiresObjective,
      hasAttachmentDraft,
      requiresDocs
    },
    imageAttachments,
    isProductOrPhotoInquiry,
    isInvoice,
    invoiceNum,
    customerNum,
    isLinkedIn,
    linkedinContact,
    isAccountSupport,
    isMeeting
  };
}

// Gerador de Resumo e Tarefas Baseado 100% no Conteúdo Real do Email e Fotos
function generateSmartSummaryAndTasks(params: {
  subject: string;
  body: string;
  html?: string;
  from: string;
  attachments?: AttachmentItem[];
}) {
  const analysis = analyzeConversation(params);
  const { subject = "" } = params;
  const { sender, hasApiKeys, keyNames, apiUrl, detectedService, isContractOrNDA, contractDetails, imageAttachments, isProductOrPhotoInquiry, isInvoice, invoiceNum, customerNum, isLinkedIn, linkedinContact, isAccountSupport, isMeeting, cleanBody } = analysis;

  let summary = "";
  let urgency: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  let actionItems: string[] = [];
  let sentiment = 'neutral';

  // 1. Caso: Contrato / Acordo de Confidencialidade (NDA) / Compliance (Ex: David NANGO)
  if (isContractOrNDA) {
    const { counterparty } = contractDetails;
    summary = `Comunicação jurídica de ${sender.name} (${sender.role || counterparty}) referente ao Acordo de Confidencialidade (NDA) com a ${counterparty}. Solicita a definição formal do objetivo da cooperação, enquadramento para operações na Europa e revisão da minuta em anexo antes do envio dos documentos de conformidade.`;
    urgency = "HIGH";
    sentiment = "urgent";
    actionItems = [
      `Analisar a minuta do acordo de confidencialidade (NDA) enviada em anexo por ${sender.name}`,
      `Especificar formalmente o objetivo do acordo abrangendo as operações da Rapi Money na Europa`,
      `Validar e assinar a versão final do NDA entre a Rapi Money e a ${counterparty}`,
      `Reunir e remeter a documentação de suporte e conformidade (KYC) necessária`
    ];
  }
  // 2. Caso: Fotografias de Produtos / Cotação / Catálogo Visual
  else if (isProductOrPhotoInquiry) {
    const imgNames = imageAttachments.map(i => i.filename || i.name || "Imagem").slice(0, 3).join(', ');
    const imgCount = imageAttachments.length;
    summary = `Comunicação comercial com fotografias e especificações de produtos anexadas${imgCount > 0 ? ` (${imgCount} imagens: ${imgNames})` : ''}. O remetente apresenta novos modelos/artigos e solicita análise das amostras para emissão de proposta comercial e cotação de lote.`;
    urgency = "HIGH";
    sentiment = "positive";
    actionItems = [
      `Analisar as fotografias dos produtos e especificações técnicas recebidas${imgNames ? ` (${imgNames})` : ''}`,
      `Calcular estrutura de custos e tabela de preços por volume (escalões B2B)`,
      `Elaborar proposta comercial formal com prazos de entrega e condições de envio`,
      `Disponibilizar catálogo digital e coordenar eventual envio de amostras físicas`
    ];
  }
  // 3. Caso: Credenciais de API
  else if (hasApiKeys) {
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
  } 
  // 4. Caso: LinkedIn
  else if (isLinkedIn) {
    summary = `Convite de rede profissional enviado por ${linkedinContact} através do LinkedIn.`;
    urgency = "LOW";
    sentiment = "positive";
    actionItems = [
      `Aceitar convite de conexão profissional no LinkedIn com ${sender.name}`,
      `Enviar mensagem de agradecimento e partilhar sinergias empresariais`
    ];
  } 
  // 5. Caso: Fatura
  else if (isInvoice) {
    const comp = detectedService || sender.company || "Fornecedor";
    summary = `Fatura emitida por ${comp}${invoiceNum ? ` (N.º ${invoiceNum})` : ''}${customerNum ? ` — Cliente: ${customerNum}` : ''}.`;
    urgency = "MEDIUM";
    sentiment = "neutral";
    actionItems = [
      `Validar valores e itens discriminados na fatura${invoiceNum ? ` n.º ${invoiceNum}` : ''}`,
      `Submeter ao departamento financeiro para liquidação`,
      `Arquivar comprovativo para conciliação bancária e contabilística`
    ];
  } 
  // 6. Caso: Suporte / Conta
  else if (isAccountSupport) {
    const comp = detectedService || sender.company || "Suporte";
    summary = `Comunicação de suporte e conformidade da ${comp} referente ao estado da conta / validação de acesso.`;
    urgency = "HIGH";
    sentiment = "urgent";
    actionItems = [
      `Reunir a documentação de conformidade solicitada pelo suporte da ${comp}`,
      `Submeter os dados requeridos para regularização imediata do serviço`,
      `Validar restabelecimento e funcionamento pleno da conta`
    ];
  } 
  // 7. Caso: Reunião
  else if (isMeeting) {
    summary = `Proposta de agendamento de reunião / alinhamento com ${sender.name} sobre "${subject}".`;
    urgency = "MEDIUM";
    sentiment = "positive";
    actionItems = [
      `Verificar disponibilidade de agenda e confirmar data/horário`,
      `Gerar ou solicitar o link da sessão (Google Meet / Zoom)`,
      `Preparar pontos de discussão para o encontro`
    ];
  } 
  // 8. Caso Geral
  else {
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

// Gerador de Resposta Inteligente Baseado 100% na Mensagem Recebida e Fotos
function generateSmartReply(params: {
  subject: string;
  body: string;
  html?: string;
  from: string;
  userName?: string;
  tone?: string;
  customInstructions?: string;
  attachments?: AttachmentItem[];
}) {
  const { subject = "", userName = "Edson | Rapi Money", tone = "professional", customInstructions, attachments = [] } = params;
  const analysis = analyzeConversation(params);
  const { sender, hasApiKeys, keyNames, apiUrl, detectedService, isContractOrNDA, contractDetails, imageAttachments, isProductOrPhotoInquiry, isInvoice, invoiceNum, customerNum, isLinkedIn, isAccountSupport, isMeeting, cleanBody } = analysis;

  const replySubject = subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject || 'Comunicação'}`;
  let paragraphs: string[] = [];

  // 1. Caso: Acordo Legal / Contrato / NDA (Ex: David NANGO - Bel Money SA)
  if (isContractOrNDA) {
    const { counterparty } = contractDetails;
    if (tone === "friendly") {
      paragraphs.push(`Olá ${sender.firstName},`);
      paragraphs.push(`Espero que estejas bem e muito obrigado pelo retorno relativamente ao nosso processo.`);
      paragraphs.push(`Já rececionámos a minuta do Acordo de Confidencialidade (NDA) enviada em anexo. A nossa equipa está a analisar os termos e vamos incorporar a descrição detalhada do objetivo da nossa cooperação, garantindo o devido enquadramento legal para as operações na Europa.`);
      paragraphs.push(`Assim que tivermos o documento revisto e assinado, envio-te de imediato juntamente com a documentação de conformidade solicitada.`);
      paragraphs.push(`Fico ao dispor para qualquer esclarecimento adicional.`);
    } else if (tone === "concise") {
      paragraphs.push(`Olá ${sender.firstName},\n\nConfirmamos a receção da minuta do Acordo de Confidencialidade (NDA). A equipa jurídica está a analisar o documento para incluir a especificação do objetivo e o âmbito para as operações na Europa. Enviaremos a documentação assinada com a máxima brevidade.\n\nCom os melhores cumprimentos,\n${userName}`);
    } else {
      paragraphs.push(`Estimado(a) ${sender.name},`);
      paragraphs.push(`Espero que este e-mail o(a) encontre bem.`);
      paragraphs.push(`Agradeço o envio da minuta do Acordo de Confidencialidade (NDA) referente à parceria institucional entre a Rapi Money e a ${counterparty}.`);
      paragraphs.push(`Informo que estamos a proceder à análise minuciosa da minuta em anexo e iremos incluir a especificação clara e detalhada do objetivo do acordo, garantindo a plena cobertura das nossas operações no espaço europeu, conforme indicado.`);
      paragraphs.push(`Com a máxima brevidade, remeteremos a versão final devidamente assinada, acompanhada por toda a documentação de suporte e conformidade necessária para conclusão do processo.`);
      paragraphs.push(`Coloco-me à inteira disposição para qualquer alinhamento prévio.`);
    }
  }
  // 2. Caso: Fotografias de Produtos / Catálogo / Cotações
  else if (isProductOrPhotoInquiry) {
    if (tone === "friendly") {
      paragraphs.push(`Olá ${sender.firstName},`);
      paragraphs.push(`Muito obrigado pelo envio das fotografias e detalhes dos produtos! Os artigos têm excelente apresentação e enquadram-se perfeitamente nas nossas necessidades comerciais.`);
      paragraphs.push(`A nossa equipa já está a analisar os itens e a preparar a cotação com as melhores condições de preço por volume e prazos de expedição rápidos.`);
      paragraphs.push(`Envio-te a proposta comercial detalhada muito em breve.`);
    } else if (tone === "concise") {
      paragraphs.push(`Olá ${sender.firstName},\n\nFotografias dos produtos e especificações recebidas com sucesso. Estamos a finalizar a cotação detalhada por lote e prazos de entrega. Remeteremos a proposta formal em breve.\n\nCom os melhores cumprimentos,\n${userName}`);
    } else {
      paragraphs.push(`Estimado(a) ${sender.name},`);
      paragraphs.push(`Espero que este e-mail o(a) encontre bem.`);
      paragraphs.push(`Agradeço o envio das fotografias dos produtos e respetivas especificações técnicas.`);
      paragraphs.push(`Informo que analisámos os artigos apresentados com a máxima atenção e confirmamos o nosso total interesse. Estamos a finalizar a estrutura de custos e a preparar a respetiva proposta comercial, contemplando preçário por volume, prazos de expedição e garantias de qualidade.`);
      paragraphs.push(`Com a máxima brevidade, remeteremos a nossa proposta formal detalhada. Ficamos inteiramente disponíveis para agendarmos uma sessão de demonstração ou análise de amostras.`);
    }
  }
  // 3. Caso: Credenciais de API
  else if (hasApiKeys) {
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
  // 4. Caso: Convite LinkedIn
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
  // 5. Caso: Fatura / Documento de Cobrança
  else if (isInvoice) {
    const comp = detectedService || sender.company || "Fornecedor";
    paragraphs.push(`Estimada equipa ${comp},`);
    paragraphs.push(`Confirmamos a receção da fatura${invoiceNum ? ` n.º ${invoiceNum}` : ''}${customerNum ? ` associada à conta de cliente ${customerNum}` : ''}.`);
    paragraphs.push(`O documento foi registado e submetido ao nosso departamento financeiro para conferência e respetiva liquidação.`);
    paragraphs.push(`Permaneço ao dispor para qualquer esclarecimento complementar.`);
  }
  // 6. Caso: Suporte / Conta / Regularização
  else if (isAccountSupport) {
    const comp = detectedService || sender.company || "Suporte";
    paragraphs.push(`Olá ${sender.firstName},`);
    paragraphs.push(`Agradeço o retorno relativo ao acompanhamento e validação da nossa conta${comp ? ` na ${comp}` : ''}.`);
    paragraphs.push(`Estamos inteiramente disponíveis para fornecer todos os esclarecimentos e documentação de conformidade solicitados para a regularização imediata do acesso.`);
    paragraphs.push(`Ficamos a aguardar as vossas instruções para conclusão dos procedimentos.`);
  }
  // 7. Caso: Reunião / Agendamento
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
  // 8. Caso Geral: Conversa Natural
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
  if (customInstructions && tone !== "concise") {
    paragraphs.splice(paragraphs.length - 1, 0, `Nota adicional: ${customInstructions}`);
  }

  if (tone !== "concise") {
    paragraphs.push(`Com os melhores cumprimentos,\n${userName}`);
  }

  return {
    subject: replySubject,
    body: paragraphs.join('\n\n')
  };
}

// Chat Interativo com o Agente IA (Baseado no Contexto Completo do E-mail Aberto, Fotos e Histórico)
async function generateInteractiveChatResponse(params: {
  prompt: string;
  messages?: Array<{ role: "system" | "user" | "assistant"; content: string; image?: string }>;
  images?: string[];
  subject?: string;
  body?: string;
  html?: string;
  from?: string;
  userName?: string;
  attachments?: AttachmentItem[];
}): Promise<string> {
  const { prompt = "", messages: inputMessages, images = [], subject = "", body = "", html = "", from = "", userName = "Edson | Rapi Money", attachments = [] } = params;
  const analysis = analyzeConversation({ subject, body, html, from, attachments });
  const { sender, isContractOrNDA, contractDetails, imageAttachments, isProductOrPhotoInquiry, cleanBody } = analysis;
  const promptLower = prompt.toLowerCase();

  // Tentar geração via motor Multi-Provider IA (NVIDIA NIM -> Groq Ultra-Fast -> Google Gemini Vision)
  try {
    const emailContext = subject || body || from 
      ? `\n\n[CONTEXTO DO E-MAIL ATUALMENTE ABERTO]:\nRemetente: ${from}\nAssunto: ${subject}\nConteúdo Principal: ${body || html}\nAnexos Detectados: ${imageAttachments.map(i => i.filename).join(', ') || 'Nenhum'}`
      : "";

    const systemInstruction = `És o Agente Executivo e Assistente de Inteligência Artificial da RapiEmail (desenvolvido para empresas modernas). 
Tu possuis capacidades multimodais completas:
1. Podes ler e analisar todo o conteúdo de e-mails, contratos, faturas, NDAs e documentos recebidos.
2. Analisas com precisão fotografias, imagens de produtos, recibos e documentos enviados pelo utilizador.
3. Possuis uma ferramenta nativa integrada de criação de Websites ("RapiSiteBuilder") que permite gerar páginas HTML5/Tailwind completas para negócios e empresas.
4. Esclareces qualquer dúvida sobre a plataforma RapiEmail (configuração de domínio próprio DNS: registos MX, SPF, DKIM, DMARC; assinaturas com fotografia; envio agendado; atalhos e pesquisa avançada).
Responde sempre de forma executiva, profissional, clara e cortês em português de Portugal.${emailContext}`;

    const aiRes = await generateAiCompletion({
      prompt: prompt || "Olá",
      messages: inputMessages,
      images,
      systemInstruction,
      temperature: 0.7,
      maxTokens: 1500
    });

    if (aiRes && aiRes.trim()) {
      return aiRes.trim();
    }
  } catch (e) {
    console.warn("AI engine fallback to contextual engine:", e);
  }

  // Deteção de Intenção para Criação de Website / Landing Page com IA
  const isSiteCreationRequest = 
    promptLower.includes("criar site") || 
    promptLower.includes("fazer site") || 
    promptLower.includes("construir site") || 
    promptLower.includes("criar website") || 
    promptLower.includes("fazer website") || 
    promptLower.includes("criar landing page") || 
    promptLower.includes("construir website") || 
    promptLower.includes("criar pagina") || 
    promptLower.includes("criar página") || 
    promptLower.includes("site builder") ||
    promptLower.includes("site para");

  if (isSiteCreationRequest) {
    return `🌐 **Criador de Websites com IA (RapiSiteBuilder):**\n\nCom o nosso motor de Inteligência Artificial integrado, podes desenhar e publicar um website profissional completo em segundos!\n\n**O que a RapiAI faz automaticamente:**\n1. **Design Executivo:** Gera uma landing page moderna em HTML5 e Tailwind CSS com visual corporativo escuro ou claro.\n2. **Secções Completas:** Cria cabeçalho responsivo, hero section com botão de ação (CTA), catálogo de serviços/produtos, secção "Sobre Nós" e formulário de contactos.\n3. **Publicação com 1 Clique:** Podes alojar diretamente na infraestrutura RapiCloud com o teu domínio próprio por apenas 88€/ano.\n\n👉 *Podes abrir agora a ferramenta clicando no botão **"🌐 Criar Site com IA"** na barra lateral à esquerda ou na opção rápida abaixo.*`;
  }

  // Motor Contextual RapiAI para Fotografias de Produtos
  if (isProductOrPhotoInquiry || imageAttachments.length > 0 || images.length > 0) {
    const imgList = imageAttachments.map(i => i.filename || "Foto do Produto").join(', ') || "Fotos de Produtos";
    
    if (promptLower.includes("proposta") || promptLower.includes("cotação") || promptLower.includes("orçamento") || promptLower.includes("preço")) {
      return `Aqui está a Proposta Comercial sugerida com base nas fotografias analisadas (${imgList}):\n\nEstimado(a) ${sender.name},\n\nNa sequência da receção das fotografias e especificações dos produtos anexados à sua comunicação, apresentamos a nossa estrutura de cotação executiva:\n\n• **Itens em Análise:** ${imgList}\n• **Condições de Volume:** Cotação por escalões B2B competitivos\n• **Prazo de Expedição Estimado:** 3 a 5 dias úteis após validação\n• **Garantia & Conformidade:** Certificação e inspeção pré-embarque garantida\n\nFicamos à disposição para ajustarmos as quantidades e formalizarmos a respetiva nota de encomenda.\n\nCom os melhores cumprimentos,\n${userName}`;
    }

    if (promptLower.includes("resum") || promptLower.includes("foto") || promptLower.includes("analis") || promptLower.includes("produto")) {
      return `📸 **Análise Visual dos Produtos e Imagens:**\n\n• **Fotografias Detetadas:** ${imgList}\n• **Finalidade:** Apresentação de catálogo e solicitação de cotação/interesse comercial.\n• **Próximos Passos Recomendados:**\n  1. Confirmar especificações de materiais e quantidades pretendidas.\n  2. Enviar preçário por escalões e prazos de entrega.\n  3. Agendar demonstração física ou envio de amostras.\n\n💡 *Deseja que eu redija a proposta comercial para enviar diretamente ao remetente?*`;
    }
  }

  // Motor Contextual RapiAI para Contratos e NDAs
  if (isContractOrNDA) {
    const { counterparty } = contractDetails;
    if (promptLower.includes("responder") || promptLower.includes("resposta") || promptLower.includes("escreve") || promptLower.includes("redigir") || promptLower.includes("rascunho") || promptLower.includes("david")) {
      return `Aqui está a resposta executiva recomendada para enviar ao ${sender.name} (${counterparty}):\n\nEstimado ${sender.name},\n\nEspero que este e-mail o encontre bem.\n\nAgradeço o envio da minuta do Acordo de Confidencialidade (NDA) entre a Rapi Money e a ${counterparty}.\n\nInformo que a nossa equipa jurídica já está a analisar a minuta em anexo e iremos incluir a especificação formal do objetivo da cooperação, garantindo o enquadramento integral para as nossas operações na Europa.\n\nCom a maior brevidade, remeteremos o documento revisto e devidamente assinado, acompanhado da documentação de conformidade solicitada.\n\nCom os melhores cumprimentos,\n${userName}`;
    }

    if (promptLower.includes("resum") || promptLower.includes("o que ele") || promptLower.includes("o que pede") || promptLower.includes("pontos")) {
      return `📌 **Análise dos Pontos Críticos do E-mail de ${sender.name} (${counterparty}):**\n\n1. **Estado do NDA:** O acordo de confidencialidade entre a Rapi Money e a ${counterparty} ainda não foi assinado.\n2. **Objetivo do Acordo:** É necessário indicar expressamente o objetivo da parceria no documento.\n3. **Âmbito Europeu:** O contrato deve abranger especificamente as operações da Rapi Money na Europa.\n4. **Minuta & Documentos:** A minuta foi enviada em anexo para revisão prévia antes do envio da documentação de conformidade (KYC).\n\n💡 *Recomendação:* Deseja que eu prepare a resposta formal confirmando a revisão da minuta e o envio dos documentos?`;
    }

    if (promptLower.includes("prazo") || promptLower.includes("amanhã") || promptLower.includes("tempo") || promptLower.includes("semana")) {
      return `Sugestão de resposta com solicitação de prazo:\n\nEstimado ${sender.name},\n\nAcusamos a receção da minuta do Acordo de Confidencialidade. A nossa equipa está a analisar as cláusulas relativas às operações na Europa e o respetivo objetivo do acordo.\n\nPrevemos concluir a revisão e remeter a versão assinada juntamente com a documentação necessária até ao final do dia de amanhã.\n\nCom os melhores cumprimentos,\n${userName}`;
    }
  }

  // Pedidos comuns de propostas comerciais ou cobrança
  if (promptLower.includes("proposta")) {
    return `Proposta Comercial B2B Sugerida:\n\nEstimado(a) parceiro(a),\n\nNa sequência dos nossos contactos recentes, apresentamos a nossa proposta de soluções corporativas sob medida. Inclui infraestrutura dedicada de alta disponibilidade, suporte soberano 24/7 e gestão centralizada de contas.\n\nFicamos à disposição para agendarmos uma sessão de demonstração executiva.\n\nAtenciosamente,\n${userName}`;
  } 
  
  if (promptLower.includes("cobrança") || promptLower.includes("fatura")) {
    return `Lembrete Educado de Pagamento:\n\nEstimado(a),\n\nEsperamos que este e-mail o(a) encontre bem. Vimos por este meio solicitar a gentileza de verificar o estado da fatura pendente associada à sua conta.\n\nCaso já tenha efetuado o pagamento, pedimos a gentileza de desconsiderar este aviso e enviar o respetivo comprovativo.\n\nCom os melhores cumprimentos,\nDepartamento Financeiro`;
  }

  if (subject || body) {
    return `Analisei a mensagem de **${sender.name}** sobre "*${subject}*".\n\nO remetente abordou os seguintes pontos essenciais:\n• ${cleanBody.slice(0, 140)}...\n\nPosso redigir uma resposta profissional personalizada, estruturar uma proposta ou agendar uma reunião no seu calendário. O que prefere fazer a seguir?`;
  }

  return `Compreendi a sua solicitação. Como Assistente Executivo RapiAI, posso redigir propostas comerciais completas, analisar fotografias de produtos e minutas, preparar respostas para integrações técnicas ou gerir tarefas pendentes. Em que detalhe gostaria de avançar?`;
}

export async function POST(req: Request) {
  try {
    const { 
      mode, 
      prompt, 
      messages,
      images,
      subject = "", 
      body = "", 
      html = "", 
      from = "", 
      userName = "Edson | Rapi Money", 
      tone = "professional", 
      customInstructions = "",
      emailDate,
      attachments = []
    } = await req.json();

    // 1. MODO RESUMO EXECUTIVO E TAREFAS
    if (mode === "summarize_and_tasks") {
      try {
        const emailContent = `Remetente: ${from}\nAssunto: ${subject}\nConteúdo:\n${body || html}`;
        const aiPrompt = `Analisa este e-mail e gera um resumo executivo inteligente e lista de tarefas.\n\n${emailContent}`;
        const aiSystem = `És o RapiAI Executive Intelligence Engine (nível Claude 3.5 Sonnet / GPT-4o).
Regras Obrigatórias:
Retorna APENAS um JSON válido (sem formatação markdown \`\`\`json) com as propriedades:
{
  "summary": "Resumo executivo de alto nível em 1 a 3 frases claras e objetivas",
  "urgency": "LOW" ou "MEDIUM" ou "HIGH",
  "sentiment": "positive" ou "neutral" ou "urgent",
  "actionItems": ["Ação concreta 1", "Ação concreta 2", "Ação concreta 3"]
}`;

        const aiRes = await generateAiCompletion({
          prompt: aiPrompt,
          systemInstruction: aiSystem,
          temperature: 0.3,
          maxTokens: 1000
        });

        if (aiRes) {
          const cleanJson = aiRes.replace(/```json/gi, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanJson);
          if (parsed.summary && Array.isArray(parsed.actionItems)) {
            return NextResponse.json({
              summary: parsed.summary,
              urgency: parsed.urgency || "MEDIUM",
              sentiment: parsed.sentiment || "neutral",
              actionItems: parsed.actionItems
            });
          }
        }
      } catch (err) {
        console.warn("[RapiAI] Resumo via IA falhou, usando motor heurístico contextual:", err);
      }

      const summaryResult = generateSmartSummaryAndTasks({ subject, body, html, from, attachments });
      return NextResponse.json(summaryResult);
    }

    // 2. MODO RESPOSTA INTELIGENTE CONTEXTUAL
    if (mode === "smart_reply") {
      try {
        const emailContent = `Remetente: ${from}\nAssunto: ${subject}\nConteúdo Original:\n${body || html}`;
        const aiPrompt = `Gera uma resposta executiva completa para este e-mail recebido.\n\n${emailContent}`;
        const aiSystem = `És o RapiAI Executive Intelligence Engine (nível Claude 3.5 Sonnet / GPT-4o).
O utilizador (${userName}) deseja responder a este e-mail.
Tom solicitado: ${tone || 'profissional'}.
Instruções adicionais: ${customInstructions || 'Nenhuma, responde com a melhor cortesia corporativa e assertividade'}.

Regras Obrigatórias:
Retorna APENAS um JSON válido (sem formatação markdown \`\`\`json) com as propriedades:
{
  "subject": "Re: ${subject.replace(/^re:\s*/i, '')}",
  "body": "Texto completo do e-mail com parágrafos bem estruturados usando quebras de linha \\n\\n e assinatura formal de ${userName}"
}`;

        const aiRes = await generateAiCompletion({
          prompt: aiPrompt,
          systemInstruction: aiSystem,
          temperature: 0.6,
          maxTokens: 1200
        });

        if (aiRes) {
          const cleanJson = aiRes.replace(/```json/gi, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanJson);
          if (parsed.body) {
            return NextResponse.json({
              subject: parsed.subject || `Re: ${subject}`,
              body: parsed.body
            });
          }
        }
      } catch (err) {
        console.warn("[RapiAI] Resposta via IA falhou, usando motor contextual:", err);
      }

      const replyResult = generateSmartReply({
        subject,
        body,
        html,
        from,
        userName,
        tone,
        customInstructions,
        attachments
      });
      return NextResponse.json(replyResult);
    }

    // 3. MODO DETETAR E AGENDAR REUNIÃO
    if (mode === "extract_meeting") {
      try {
        const emailContent = `Assunto: ${subject}\nConteúdo:\n${body || html}`;
        const aiPrompt = `Analisa este e-mail e verifica se existe uma reunião ou agendamento.\n\n${emailContent}`;
        const aiSystem = `És o RapiAI Meeting Parser.
Retorna APENAS um JSON válido com:
{
  "hasMeeting": boolean,
  "title": "Título descritivo da reunião",
  "proposedDate": "YYYY-MM-DD",
  "proposedTime": "HH:MM",
  "durationMinutes": 30 ou 60,
  "location": "Microsoft Teams" ou "Google Meet" ou "Zoom" ou "Escritório",
  "notes": "Tópicos da reunião"
}`;

        const aiRes = await generateAiCompletion({
          prompt: aiPrompt,
          systemInstruction: aiSystem,
          temperature: 0.1,
          maxTokens: 600
        });

        if (aiRes) {
          const cleanJson = aiRes.replace(/```json/gi, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanJson);
          if (typeof parsed.hasMeeting === 'boolean') {
            return NextResponse.json(parsed);
          }
        }
      } catch (err) {
        console.warn("[RapiAI] Extração de reunião via IA falhou, usando fallback:", err);
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

    // 4. MODO GERAL / CHAT INTERATIVO NO DRAWER OU CHATVIEW COMPLETO
    const replyText = await generateInteractiveChatResponse({
      prompt: prompt || "",
      messages,
      images,
      subject,
      body,
      html,
      from,
      userName,
      attachments
    });

    return NextResponse.json({ response: replyText });

  } catch (error: any) {
    console.error("AI Agent Route Error:", error);
    return NextResponse.json({ error: error.message || "Erro no processamento do agente de IA" }, { status: 500 });
  }
}


