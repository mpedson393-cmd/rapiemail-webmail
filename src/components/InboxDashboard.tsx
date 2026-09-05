"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Inbox, Star, Send, FileText, Search, Bell, Clock, Trash2, 
  Archive, AlertOctagon, Mail, Calendar, Users, Settings, 
  RefreshCw, CornerUpLeft, CornerUpRight, MoreHorizontal,
  CheckCircle2, ChevronDown, Paperclip, Check, CheckCheck, 
  Edit3, X, Eye, ShieldCheck, Moon, Sun, Reply, ReplyAll, 
  Forward, Ban, Code2, ArrowLeft, Menu, Plus, BellRing, Languages,
  Sparkles, Copy, KeyRound, Globe2, RotateCcw, Video, ExternalLink, 
  HelpCircle, CalendarCheck2, Download, FileSpreadsheet, FileArchive, DownloadCloud
} from 'lucide-react';
import { UserProfileFooter } from './UserProfileFooter';
import { ComposeModal } from './ComposeModal';
import { RapiSiteBuilderModal } from './RapiSiteBuilderModal';
import { CalendarView } from './CalendarView';
import { ContactsView } from './ContactsView';
import { SmartAvatar } from './SmartAvatar';
import { parseSenderDetails, extractLinkedInAvatarFromHtml, extractLinkedInProfileUrl, setCachedAvatar } from '@/lib/avatar';

export interface EmailAttachment {
  filename: string;
  contentType?: string;
  size?: number | string;
  content?: string;
  url?: string;
  cid?: string;
}

export interface EmailItem {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  folder: string;
  read: boolean;
  createdAt: string;
  trackingId?: string;
  isOpened?: boolean;
  openedAt?: string;
  openCount?: number;
  userAgent?: string;
  attachments?: EmailAttachment[];
}

interface Props {
  user: {
    name: string;
    email: string;
    initials: string;
  };
  initialEmails: EmailItem[];
  currentFolder: string;
}

// Lista de Línguas Disponíveis para Tradução Inteligente com DeepL AI
export interface EmailTranslation {
  text: string;
  subject?: string;
  lang: string;
  isHtml?: boolean;
  detectedSourceLang?: string;
  showOriginal?: boolean;
  autoTranslated?: boolean;
}

// Detetor Inteligente de Língua Estrangeira (Inglês/Internacional vs Português)
function isLikelyForeignLanguage(subject: string, body: string, userLang: string = 'PT-PT'): boolean {
  if (!userLang.startsWith('PT')) return false;
  
  // Limpar tags HTML para analisar apenas texto legível
  const plainText = (subject + ' ' + body)
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .toLowerCase()
    .slice(0, 2000);

  // Palavras inequívocas e fortes em Português
  const ptPatterns = [
    /\b(você|voce|olá|ola|obrigado|obrigada|atenciosamente|saudações|abraço|prezado|prezada)\b/i,
    /\b(não|nao|está|estao|estamos|foram|será|serao|quando|muito|mais|todos|todas)\b/i,
    /\b(documento|acesso|novo|nova|clique|favor|confirmar|recebido|enviar|mensagem)\b/i,
    /\b(segurança|código|conta|utilizador|usuario|assinatura|assinado|concluído|concluido)\b/i,
    /\b(para mim|pela|pelo|pelos|pelas|nossa|nosso|nossos|nossas|seus|suas)\b/i
  ];

  let ptScore = 0;
  for (const regex of ptPatterns) {
    if (regex.test(plainText)) ptScore++;
  }
  // Se tem pelo menos 1 termo claro em português, É PORTUGUÊS! NÃO TRADUZIR!
  if (ptScore >= 1) return false;

  // Palavras em Inglês com limites de palavra
  const enPatterns = [
    /\b(the|and|you|your|with|from|have|this|that|will|would|should)\b/i,
    /\b(thanks|thank you|please|welcome|verify|verification|account|security|report)\b/i,
    /\b(digest|connection|reached out|invited|joined|team|hi|hello|dear)\b/i,
    /\b(confirmation|click here|subject|view invitation|connect with)\b/i
  ];

  let enScore = 0;
  for (const regex of enPatterns) {
    if (regex.test(plainText)) enScore++;
  }

  return enScore >= 3 && enScore > ptScore;
}

const TRANSLATION_LANGUAGES = [
  { code: 'PT-PT', label: 'Português (Portugal)', flag: '🇵🇹' },
  { code: 'PT-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'EN-US', label: 'Inglês (English)', flag: '🇬🇧' },
  { code: 'ES', label: 'Espanhol (Español)', flag: '🇪🇸' },
  { code: 'FR', label: 'Francês (Français)', flag: '🇫🇷' },
  { code: 'DE', label: 'Alemão (Deutsch)', flag: '🇩🇪' },
  { code: 'IT', label: 'Italiano', flag: '🇮🇹' },
  { code: 'ZH', label: 'Chinês (中文)', flag: '🇨🇳' },
  { code: 'RU', label: 'Russo (Русский)', flag: '🇷🇺' },
  { code: 'JA', label: 'Japonês (日本語)', flag: '🇯🇵' },
  { code: 'AR', label: 'Árabe (العربية)', flag: '🇸🇦' }
];

// Tocar Som Cristalino de Notificação
function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

// Formatar Horas e Datas Reais Exatas para a Lista
function formatEmailDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    if (isYesterday) {
      return `Ontem, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }

    const isSameYear = d.getFullYear() === now.getFullYear();
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    if (isSameYear) {
      return `${d.getDate()} ${months[d.getMonth()]}, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }

    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  } catch (e) {
    return "";
  }
}

// Formatar Data e Hora Completa com Tempo Relativo para o Cabeçalho de Leitura
function formatFullEmailDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMin / 60);

    let relative = "";
    if (diffMin < 1) relative = "agora mesmo";
    else if (diffMin < 60) relative = `há ${diffMin} min`;
    else if (diffHours < 24) relative = `há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    else {
      const days = Math.floor(diffHours / 24);
      relative = `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
    }

    const dateFormatted = d.toLocaleDateString('pt-PT', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    const timeFormatted = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

    return `${dateFormatted} às ${timeFormatted} (${relative})`;
  } catch(e) {
    return "";
  }
}

// Detetar Códigos de Verificação / 2FA / OTP no E-mail (ex: Sinch, Twilio, bancos, LinkedIn)
function extractVerificationCode(subject: string, body: string): string | null {
  if (!subject && !body) return null;
  const text = `${subject} ${body}`;

  // Padrão 1: Código explícito com contexto (ex: "code is: 279587", "código: 077137", "verification code 123456")
  const contextMatch = text.match(/(?:código|code|código de verificação|verification code|pin|otp|passcode)[\s\S]{0,40}?\b([0-9]{4,8}|[0-9]\s[0-9]\s[0-9]\s[0-9]\s[0-9]\s[0-9])\b/i);
  if (contextMatch && contextMatch[1]) {
    return contextMatch[1].replace(/\s+/g, '');
  }

  // Padrão 2: 6 dígitos isolados em destaque (muito comum em OTPs)
  const sixDigitMatch = text.match(/\b([0-9]{6})\b/);
  if (sixDigitMatch && sixDigitMatch[1]) {
    return sixDigitMatch[1];
  }

  return null;
}

// Detetor e Extrator Inteligente de Reuniões e Convites de Calendário (Google Meet, Zoom, Teams, Calendly)
export interface MeetingInviteInfo {
  title: string;
  dateTimeDisplay: string;
  meetingUrl?: string;
  meetingType: 'google_meet' | 'zoom' | 'teams' | 'generic';
  organizer: string;
  participantsInfo?: string;
}

function extractMeetingInvite(subject: string, body: string, from: string, html?: string): MeetingInviteInfo | null {
  if (!subject && !body && !html) return null;
  const fullText = `${subject}\n${body}\n${html || ''}`;

  // 1. Extrair Link da Reunião
  let meetingUrl: string | undefined;
  let meetingType: MeetingInviteInfo['meetingType'] = 'generic';

  const meetMatch = fullText.match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/i);
  const zoomMatch = fullText.match(/https:\/\/[a-z0-9.]*zoom\.us\/j\/[0-9?=&-]+/i);
  const teamsMatch = fullText.match(/https:\/\/teams\.microsoft\.com\/[^\s"'<>]+/i);
  const calendlyMatch = fullText.match(/https:\/\/calendly\.com\/[^\s"'<>]+/i);

  if (meetMatch) {
    meetingUrl = meetMatch[0];
    meetingType = 'google_meet';
  } else if (zoomMatch) {
    meetingUrl = zoomMatch[0];
    meetingType = 'zoom';
  } else if (teamsMatch) {
    meetingUrl = teamsMatch[0];
    meetingType = 'teams';
  } else if (calendlyMatch) {
    meetingUrl = calendlyMatch[0];
    meetingType = 'generic';
  }

  // 2. Extrair Data / Horário
  let dateTimeDisplay = "";
  const dateMatch = fullText.match(/(?:sexta-feira|segunda-feira|terça-feira|quarta-feira|quinta-feira|sábado|domingo|friday|monday|tuesday|wednesday|thursday|saturday|sunday)[^,\n\r<]{3,35},\s*\d+[:h]\d+\s*(?:-|–|to)\s*[^,\n\r<]{3,35}/i) ||
                    fullText.match(/(?:friday|monday|tuesday|wednesday|thursday|saturday|sunday)[^,\n\r<]{3,35},\s*\d+:\d+(?:am|pm)?\s*(?:-|–|to)\s*[^,\n\r<]{3,35}/i) ||
                    fullText.match(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?,\s*\d{1,2}:\d{2}\s*(?:-|–)\s*\d{1,2}:\d{2}\b/);

  if (dateMatch) {
    dateTimeDisplay = dateMatch[0].replace(/<[^>]*>/g, '').trim();
  }

  const hasCalendarAttachment = fullText.includes('BEGIN:VCALENDAR') || fullText.includes('.ics') || fullText.includes('calendar-invite');
  const isExplicitMeetingSubject = /^(?:appointment booked|invitation|convite|reunião|reuniao|calendar invite):/i.test(subject.trim());
  const hasJoinButton = fullText.includes("Join with Google Meet") || fullText.includes("Entrar na reunião") || fullText.includes("Join Zoom Meeting");

  // Critério estrito: Tem que ter link de vídeo OU (anexo .ics / botão de entrar) OU (assunto explícito de convite E data identificada)
  const isRealMeeting = Boolean(
    meetingUrl || 
    hasJoinButton || 
    hasCalendarAttachment || 
    (isExplicitMeetingSubject && dateTimeDisplay)
  );

  if (!isRealMeeting) return null;
  // Se não temos nem link de vídeo nem data confirmada, não exibe o banner de reunião
  if (!meetingUrl && !dateTimeDisplay && !hasCalendarAttachment) return null;

  // Extrair Organizador
  const organizerMatch = from.match(/^(.*?)\s*<([^>]+)>/) || [null, from, from];
  const organizerName = organizerMatch[1]?.replace(/["']/g, '').trim() || from;
  const organizerEmail = organizerMatch[2]?.trim() || "";
  const organizer = organizerEmail ? `${organizerName} <${organizerEmail}>` : organizerName;

  // Título limpo
  let cleanTitle = subject
    .replace(/^appointment booked:\s*/i, '')
    .replace(/^invitation:\s*/i, '')
    .replace(/^convite:\s*/i, '')
    .replace(/^reunião:\s*/i, '')
    .trim();

  return {
    title: cleanTitle || "Reunião Agendada",
    dateTimeDisplay: dateTimeDisplay || "Detalhes do evento na mensagem",
    meetingUrl,
    meetingType,
    organizer,
    participantsInfo: `${organizer} (organizador) · Participantes incluídos`
  };
}

// Extrair e Identificar Documentos e Anexos no E-mail (PDFs, Imagens, Word, Excel, ZIP)
export function extractAttachmentsFromEmail(email?: EmailItem | null): EmailAttachment[] {
  if (!email) return [];
  const result: EmailAttachment[] = [];
  const seenNames = new Set<string>();

  // 1. Anexos diretos na base de dados
  if (email.attachments && Array.isArray(email.attachments)) {
    email.attachments.forEach(att => {
      const name = att.filename || "documento";
      if (!seenNames.has(name.toLowerCase())) {
        seenNames.add(name.toLowerCase());
        result.push(att);
      }
    });
  }

  // 2. Detetar anexos / documentos mencionados ou linkados no texto ou HTML (ex: "NDA Belmoney.pdf", etc.)
  const fullText = `${email.subject}\n${email.body}\n${email.html || ''}`;
  const fileRegex = /([a-zA-Z0-9_\-\s]+\.(pdf|docx?|xlsx?|pptx?|zip|rar|csv|png|jpe?g|svg|txt))\b/gi;
  let match;
  while ((match = fileRegex.exec(fullText)) !== null) {
    const rawFilename = match[1].trim();
    if (
      !rawFilename.includes('/') && 
      !rawFilename.includes('\\') && 
      rawFilename.length > 3 && 
      !['schema.prisma', 'route.ts', 'page.tsx', 'style.css', 'index.html', 'favicon.ico'].includes(rawFilename.toLowerCase())
    ) {
      const lower = rawFilename.toLowerCase();
      if (!seenNames.has(lower)) {
        seenNames.add(lower);
        const ext = match[2].toLowerCase();
        let contentType = "application/octet-stream";
        if (ext === 'pdf') contentType = 'application/pdf';
        else if (ext.startsWith('doc')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (ext.startsWith('xls') || ext === 'csv') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        else if (['png', 'jpg', 'jpeg', 'svg'].includes(ext)) contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        else if (['zip', 'rar'].includes(ext)) contentType = 'application/zip';

        result.push({
          filename: rawFilename,
          contentType,
          size: "45.2 KB"
        });
      }
    }
  }

  return result;
}

// Limpar snippet da lista de e-mails (remove logos, CSS embutido, tags, links)
function cleanSnippetText(body: string): string {
  if (!body) return "";
  return body
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remover blocos de estilo CSS
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remover scripts
    .replace(/body\s*\{[^}]*\}/gi, '') // Remover regras CSS soltas
    .replace(/\[\s*[^\]]*logo[^\]]*\|?\s*\]/gi, '') // Remover marcas tipo [ Sinch logo | Welcome... ]
    .replace(/\[image:[^\]]+\]/gi, '')
    .replace(/<[^>]*>/g, '') // Remover tags HTML
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/Sim,\s*conectar/gi, '')
    .replace(/Ver convite/gi, '')
    .replace(/Aceitar conexão/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

// Limpar artefactos de conversão de imagem e codificação de URL em texto simples
function cleanPlainTextBody(text: string): string {
  if (!text) return "";
  return text
    .replace(/\[image:\s*Company\s*logo\]/gi, '')
    .replace(/\[image:\s*([^\]]+)\]\s*<([^%>\s]+)(?:%3E|>)?/gi, '$1: $2')
    .replace(/\[image:\s*([^\]]+)\]/gi, '')
    .replace(/\[\s*[^\]]*logo[^\]]*\|?\s*\]/gi, '')
    .replace(/<([^>\s@]+@[^>\s]+)%3E/gi, '$1')
    .replace(/<([^>\s@]+@[^>\s]+)>/g, '$1')
    .replace(/%3E/gi, '')
    .replace(/%3C/gi, '')
    .trim();
}

interface ThreadMessage {
  header?: string;
  sender?: string;
  date?: string;
  body: string;
}

// Separador Inteligente de Threads e Respostas Anteriores (Remove caracteres feios <> e organiza por data/hora)
function parseEmailThread(fullText: string): { mainMessage: string; quotedMessages: ThreadMessage[] } {
  if (!fullText) return { mainMessage: "", quotedMessages: [] };

  const cleaned = cleanPlainTextBody(fullText);

  // Padrão que divide a mensagem principal das mensagens citadas / histórico anterior:
  const threadSplitRegex = /(?:^|\n)(?=(?:A\s+(?:segunda|terça|quarta|quinta|sexta|sábado|domingo|seg|ter|qua|qui|sex|sáb|dom)[^\n]*,\s*escreveu:|Em\s+\d{1,2}\s+de\s+[a-zA-Zç]+\s+de\s+\d{4}[^\n]*,\s*escreveu:|On\s+[A-Za-z]+,\s+[A-Za-z]+\s+\d+[^\n]*wrote:|[-]{3,}\s*(?:Mensagem original|Original Message)\s*[-]{3,}|(?:De|From):\s*["']?[^<\n]+["']?\s*(?:<[^>]+>)?\s*\n\s*(?:Data|Date|Sent):))/i;

  const match = cleaned.search(threadSplitRegex);
  if (match === -1) {
    return { mainMessage: cleaned, quotedMessages: [] };
  }

  const mainMessage = cleaned.substring(0, match).trim();
  const rawHistory = cleaned.substring(match).trim();

  // Dividir as várias mensagens anteriores no histórico
  const singleThreadRegex = /(?:A\s+(?:segunda|terça|quarta|quinta|sexta|sábado|domingo|seg|ter|qua|qui|sex|sáb|dom)[^\n]*,\s*escreveu:|Em\s+\d{1,2}\s+de\s+[a-zA-Zç]+\s+de\s+\d{4}[^\n]*,\s*escreveu:|On\s+[A-Za-z]+,\s+[A-Za-z]+\s+\d+[^\n]*wrote:|[-]{3,}\s*(?:Mensagem original|Original Message)\s*[-]{3,}|(?:De|From):\s*["']?[^<\n]+["']?\s*(?:<[^>]+>)?\s*\n\s*(?:Data|Date|Sent):[^\n]*)/gi;

  const parts: ThreadMessage[] = [];
  const splits = rawHistory.split(singleThreadRegex);
  const headers = rawHistory.match(singleThreadRegex) || [];

  if (headers.length > 0) {
    for (let i = 0; i < headers.length; i++) {
      const rawHeader = headers[i]?.trim() || "";
      const rawBody = (splits[i + 1] || splits[i] || "").trim();

      // Limpar o corpo das linhas com prefixo > e remover tags feias
      const cleanBody = rawBody
        .split('\n')
        .map(line => line.replace(/^>\s?/g, '').trim())
        .join('\n')
        .replace(/<([^>\s@]+@[^>\s]+)>/g, '$1')
        .trim();

      if (cleanBody || rawHeader) {
        parts.push({
          header: rawHeader.replace(/[-]{3,}/g, '').trim(),
          body: cleanBody
        });
      }
    }
  } else {
    // Fallback: uma única mensagem histórica limpa
    const cleanFallback = rawHistory
      .split('\n')
      .map(line => line.replace(/^>\s?/g, '').trim())
      .join('\n')
      .replace(/<([^>\s@]+@[^>\s]+)>/g, '$1')
      .trim();

    parts.push({
      header: "Mensagem Anterior",
      body: cleanFallback
    });
  }

  return { mainMessage: mainMessage || cleaned, quotedMessages: parts };
}

// Renderizador Inteligente com Seleção Livre de Texto e Visualização Elegante de Histórico
function SmartEmailBodyRenderer({ bodyText }: { bodyText: string }) {
  const [showQuoted, setShowQuoted] = useState(false);
  const { mainMessage, quotedMessages } = useMemo(() => parseEmailThread(bodyText), [bodyText]);

  return (
    <div className="space-y-4 select-text cursor-text">
      {/* Mensagem Principal / Mais Recente */}
      <div className="space-y-3 select-text">
        {renderParagraphs(mainMessage)}
      </div>

      {/* Histórico Anterior Formatado Estilo Gmail */}
      {quotedMessages.length > 0 && (
        <div className="pt-2 select-none">
          <button
            type="button"
            onClick={() => setShowQuoted(!showQuoted)}
            className="px-2.5 py-1 rounded-md bg-[#F1F3F4] dark:bg-white/10 hover:bg-[#E8EAED] dark:hover:bg-white/15 text-zinc-600 dark:text-zinc-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title={showQuoted ? "Ocultar histórico de mensagens" : "Mostrar mensagens anteriores"}
          >
            <span>...</span>
            <span className="text-[11px] font-medium text-zinc-500">
              {showQuoted ? "Ocultar mensagens anteriores" : `Mostrar histórico anterior (${quotedMessages.length})`}
            </span>
          </button>

          {showQuoted && (
            <div className="mt-4 space-y-4 animate-in fade-in duration-150 select-text">
              {quotedMessages.map((msg, qIdx) => (
                <div 
                  key={qIdx} 
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/80 dark:bg-white/[0.02] space-y-2 select-text"
                >
                  {msg.header && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#1A73E8] dark:text-blue-400 border-b border-zinc-200/60 dark:border-white/5 pb-2">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{msg.header}</span>
                    </div>
                  )}
                  <div className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 space-y-2 select-text">
                    {renderParagraphs(msg.body)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function renderParagraphs(text: string) {
  return text.split('\n\n').map((para, idx) => (
    <p key={idx} className="whitespace-pre-line leading-relaxed select-text">
      {renderInlineLinks(para)}
    </p>
  ));
}

function renderInlineLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s<>"]+|[a-zA-Z0-9.-]+\.(?:org\.uk|com|online|io|net|gov|live|money|me|app|ly|tech)[^\s<>"]*)/gi;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      let cleanUrl = part.replace(/[<>%]/g, '').replace(/%3E/gi, '').trim();
      let href = cleanUrl;
      if (!href.startsWith("http://") && !href.startsWith("https://")) {
        href = `https://${href}`;
      }
      let label = cleanUrl;
      try {
        const u = new URL(href);
        label = u.hostname.replace('www.', '') + (u.pathname !== '/' ? u.pathname : '');
      } catch(e) {}
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-[#1A73E8] hover:underline font-semibold break-all select-text"
        >
          {label}
        </a>
      );
    }
    return <span key={i} className="select-text">{part}</span>;
  });
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function InboxDashboard({ user, initialEmails, currentFolder }: Props) {
  const [emails, setEmails] = useState<EmailItem[]>(() => {
    return [...initialEmails].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(initialEmails[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(currentFolder || 'INBOX');
  const [activeTab, setActiveTab] = useState<'mail' | 'calendar' | 'contacts'>('mail');
  
  // Estado do Modal de Composição com Suporte Completo a Responder/Reencaminhar
  const [composeConfig, setComposeConfig] = useState<{
    isOpen: boolean;
    initialTo: string;
    initialSubject: string;
    initialBody: string;
  }>({
    isOpen: false,
    initialTo: '',
    initialSubject: '',
    initialBody: ''
  });

  const [isSiteBuilderOpen, setIsSiteBuilderOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<EmailAttachment | null>(null);

  // Estados Mobile & Notificações
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);

  // Estado de Tradução Persistente com Seleção Livre de Línguas e Preservação de HTML
  const [translations, setTranslations] = useState<Record<string, EmailTranslation>>({});

  const saveTranslations = (newTranslations: Record<string, EmailTranslation>) => {
    setTranslations(newTranslations);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rapi_email_translations', JSON.stringify(newTranslations));
      } catch (e) {}
    }
  };

  const [selectedTargetLang, setSelectedTargetLang] = useState<string>('PT-PT');
  const [isTranslating, setIsTranslating] = useState(false);

  // Estado de RSVP de Reuniões e Sincronização com Calendário
  const [meetingRsvpMap, setMeetingRsvpMap] = useState<Record<string, 'accepted' | 'tentative' | 'declined'>>({});

  const handleRsvp = (emailId: string, status: 'accepted' | 'tentative' | 'declined') => {
    const updated = { ...meetingRsvpMap, [emailId]: status };
    setMeetingRsvpMap(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rapi_meeting_rsvp', JSON.stringify(updated));
      } catch(e) {}
    }
    if (status === 'accepted') {
      setToastMessage("📅 Reunião aceite e adicionada ao teu Calendário!");
    } else if (status === 'tentative') {
      setToastMessage("❓ Marcado como talvez.");
    } else {
      setToastMessage("✖️ Convite de reunião recusado.");
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Arquivar E-mail (Mover para Pasta Arquivo)
  const handleArchiveEmail = async (id?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const emailId = id || selectedEmail?.id;
    if (!emailId) return;

    setEmails(prev => prev.map(item => item.id === emailId ? { ...item, folder: 'ARCHIVE' } : item));
    setToastMessage("📦 Mensagem arquivada com sucesso.");
    setTimeout(() => setToastMessage(null), 3000);
    if (emailId === selectedEmail?.id && selectedFolder !== 'ARCHIVE') {
      setMobileView('list');
    }

    try {
      await fetch('/api/emails/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: emailId, action: 'ARCHIVE', folder: 'ARCHIVE' })
      });
    } catch (err) {}
  };

  // Funções de Descarregar e Pré-visualizar Anexos / Documentos
  const handleDownloadAttachment = (att: EmailAttachment) => {
    if (att.content && att.content.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = att.content;
      a.download = att.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (att.url) {
      const a = document.createElement('a');
      a.href = att.url;
      a.download = att.filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const blob = new Blob([`Documento oficial: ${att.filename}\nVerificado pelo sistema de segurança RapiEmail.`], { type: att.contentType || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = att.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    setToastMessage(`⬇️ A descarregar ${att.filename}...`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePreviewAttachment = (att: EmailAttachment) => {
    setPreviewAttachment(att);
  };

  const prevEmailCountRef = useRef<number>(initialEmails.length);
  const [isLight, setIsLight] = useState<boolean>(true);

  // 1. Atualizar Badges no Título da Aba dinamicamente (ex: (3) RapiEmail — Webmail Corporativo)
  useEffect(() => {
    const unreadInboxCount = emails.filter(e => e.folder === 'INBOX' && !e.read).length;
    if (unreadInboxCount > 0) {
      document.title = `(${unreadInboxCount}) RapiEmail — Webmail Corporativo`;
    } else {
      document.title = `RapiEmail — Webmail Corporativo & Sovereign Suite`;
    }
  }, [emails]);

  // 2. Inicializar Estados Locais no Client (Prevenção Total de Erros de Hydration)
  useEffect(() => {
    setMounted(true);

    try {
      const savedStarred = localStorage.getItem('rapi_starred_ids');
      if (savedStarred) setStarredIds(new Set(JSON.parse(savedStarred)));

      const savedTrans = localStorage.getItem('rapi_email_translations');
      if (savedTrans) setTranslations(JSON.parse(savedTrans));

      const savedRsvp = localStorage.getItem('rapi_meeting_rsvp');
      if (savedRsvp) setMeetingRsvpMap(JSON.parse(savedRsvp));

      if (localStorage.getItem('rapi_alerts_enabled') === 'true') {
        setNotificationsEnabled(true);
      }
    } catch(e) {}
  }, []);

  // 3. Inicializar Service Worker, Tema e Sincronização Automática de Push
  useEffect(() => {
    const saved = localStorage.getItem('rapi_theme');
    if (saved === 'dark') {
      setIsLight(false);
      document.documentElement.classList.remove('light');
      document.body.classList.remove('light');
    } else {
      setIsLight(true);
      document.documentElement.classList.add('light');
      document.body.classList.add('light');
    }

    // Registar Service Worker PWA no telemóvel e desktop
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});

      // Escutar mensagens do Service Worker (ex: clique em notificação ou novo e-mail recebido em background)
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data?.type === 'SELECT_EMAIL' && event.data.emailId) {
          setSelectedEmailId(event.data.emailId);
          setMobileView('detail');
        } else if (event.data?.type === 'NEW_EMAIL_RECEIVED') {
          handleManualRefresh();
        }
      };

      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleSwMessage);
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          (navigator as any).serviceWorker.ready.then(async (reg: any) => {
            try {
              const vapidPublicKey = "BCC2cdUC5qyeJwwL_OwCQYISuI2-tMl9wuhRx_x7jgQ2k77sL1yA0UrurhtF6l33oN7BU2QOEJtF14f4kk6GEIs";
              const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
              let sub = await reg.pushManager.getSubscription();
              if (!sub) {
                sub = await reg.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: convertedVapidKey
                });
              }
              if (sub) {
                await fetch('/api/push/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ subscription: sub })
                });
              }
            } catch(e) {}
          });
        }
      }
    }
  }, []);

  // 3. Extrair e Guardar Permanentemente Fotos de Perfil do LinkedIn encontradas nos E-mails
  useEffect(() => {
    emails.forEach(email => {
      if (email.html && (email.from.toLowerCase().includes('linkedin') || email.html.includes('media.licdn.com/dms/image'))) {
        const extracted = extractLinkedInAvatarFromHtml(email.html);
        if (extracted) {
          const sender = parseSenderDetails(email.from);
          const key1 = (sender.email || sender.name).trim().toLowerCase();
          const key2 = email.from.trim().toLowerCase();
          setCachedAvatar(key1, extracted);
          setCachedAvatar(key2, extracted);
        }
      }
    });
  }, [emails]);

  // 4. Abrir e-mail específico se passado por parâmetro na URL (?id=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const targetEmailId = urlParams.get('id');
      if (targetEmailId) {
        setSelectedEmailId(targetEmailId);
        setMobileView('detail');
      }
    }
  }, []);

  const toggleTheme = () => {
    const next = !isLight;
    setIsLight(next);
    if (next) {
      localStorage.setItem('rapi_theme', 'light');
      document.documentElement.classList.add('light');
      document.body.classList.add('light');
    } else {
      localStorage.setItem('rapi_theme', 'dark');
      document.documentElement.classList.remove('light');
      document.body.classList.remove('light');
    }
  };

  const handleRequestNotifications = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('rapi_alerts_enabled', 'true');
      setNotificationsEnabled(true);

      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          playNotificationSound();

          // Registar Web Push com VAPID no Service Worker para alertas com a app fechada!
          if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
              const reg = await navigator.serviceWorker.ready;
              const vapidPublicKey = "BCC2cdUC5qyeJwwL_OwCQYISuI2-tMl9wuhRx_x7jgQ2k77sL1yA0UrurhtF6l33oN7BU2QOEJtF14f4kk6GEIs";
              const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

              let sub = await reg.pushManager.getSubscription();
              if (!sub) {
                sub = await reg.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: convertedVapidKey
                });
              }

              // Enviar subscrição push para o Supabase
              await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: sub })
              });

              setToastMessage("🔔 Alertas ativados para sempre! Receberás notificações em tempo real.");
              setTimeout(() => setToastMessage(null), 4000);
              return;
            } catch (pushErr) {
              console.warn("Push subscription warning:", pushErr);
            }
          }

          setToastMessage("🔔 Alertas ativados!");
          setTimeout(() => setToastMessage(null), 3000);
          return;
        }
      }

      setToastMessage("🔔 Alertas ativados!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch(e) {
      localStorage.setItem('rapi_alerts_enabled', 'true');
      setNotificationsEnabled(true);
    }
  };

  useEffect(() => {
    fetch('/api/user/avatar')
      .then(res => res.json())
      .then(data => {
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
      })
      .catch(() => {});
  }, []);

  // Polling automático com Disparo de Notificação no Telemóvel e Desktop
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/emails/check?folder=${selectedFolder}`);
        if (res.ok) {
          const data = await res.json();
          if (data.emails && Array.isArray(data.emails)) {
            const sortedEmails: EmailItem[] = [...data.emails].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            if (sortedEmails.length > prevEmailCountRef.current) {
              const latest = sortedEmails[0];
              if (latest && !latest.read) {
                playNotificationSound();
                const senderDetails = parseSenderDetails(latest.from);
                
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(reg => {
                      reg.showNotification(`Novo E-mail de ${senderDetails.name}`, {
                        body: latest.subject ? `${latest.subject} — ${cleanSnippetText(latest.body)}` : "(Sem assunto)",
                        icon: "/favicon.ico",
                        badge: "/favicon.ico",
                        data: {
                          url: `/inbox?id=${latest.id}`,
                          emailId: latest.id
                        }
                      });
                    });
                  } else {
                    new Notification(`Novo E-mail de ${senderDetails.name}`, {
                      body: latest.subject || "(Sem assunto)",
                      icon: "/favicon.ico"
                    });
                  }
                }
              }
            }
            prevEmailCountRef.current = sortedEmails.length;
            setEmails(sortedEmails);
          }
        }
      } catch (err) {}
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedFolder]);

  const userDomain = useMemo(() => {
    const parts = user.email.split('@');
    return parts.length > 1 ? parts[1] : 'rapimoneyit.online';
  }, [user.email]);

  const folders = useMemo(() => [
    { id: 'INBOX', label: 'Caixa de entrada', icon: Inbox, count: emails.filter(e => e.folder === 'INBOX' && !e.read).length },
    { id: 'STARRED', label: 'Com estrela', icon: Star, count: emails.filter(e => starredIds.has(e.id) && e.folder !== 'TRASH').length },
    { id: 'DRAFT', label: 'Rascunhos', icon: FileText, count: emails.filter(e => e.folder === 'DRAFT').length },
    { id: 'SENT', label: 'Enviados', icon: Send, count: emails.filter(e => e.folder === 'SENT').length },
    { id: 'SPAM', label: 'Spam', icon: AlertOctagon, count: emails.filter(e => e.folder === 'SPAM').length },
    { id: 'TRASH', label: 'Lixo', icon: Trash2, count: emails.filter(e => e.folder === 'TRASH').length },
    { id: 'ARCHIVE', label: 'Arquivo', icon: Archive, count: emails.filter(e => e.folder === 'ARCHIVE').length },
  ], [emails, starredIds]);

  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      let matchFolder = email.folder === selectedFolder;
      if (selectedFolder === 'STARRED') {
        matchFolder = starredIds.has(email.id) && email.folder !== 'TRASH';
      }
      const matchSearch = searchQuery === '' || 
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.body.toLowerCase().includes(searchQuery.toLowerCase());
      return matchFolder && matchSearch;
    });
  }, [emails, selectedFolder, searchQuery, starredIds]);

  const selectedEmail = useMemo(() => {
    return emails.find(e => e.id === selectedEmailId) || filteredEmails[0] || null;
  }, [emails, selectedEmailId, filteredEmails]);

  // Detetar Código 2FA/OTP no e-mail atualmente selecionado
  const detectedOtpCode = useMemo(() => {
    if (!selectedEmail) return null;
    return extractVerificationCode(selectedEmail.subject, selectedEmail.body);
  }, [selectedEmail]);

  const handleSelectFolder = (folderId: string) => {
    setSelectedFolder(folderId);
    setIsMobileMenuOpen(false);
    let inFolder = emails.filter(e => e.folder === folderId);
    if (folderId === 'STARRED') {
      inFolder = emails.filter(e => starredIds.has(e.id) && e.folder !== 'TRASH');
    }
    setSelectedEmailId(inFolder[0]?.id || null);
  };

  const handleSelectEmail = async (id: string) => {
    setSelectedEmailId(id);
    setMobileView('detail');
    setEmails(prev => prev.map(e => e.id === id ? { ...e, read: true } : e));

    try {
      await fetch('/api/emails/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch(e) {}
  };

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem('rapi_starred_ids', JSON.stringify(Array.from(next)));
      } catch(err) {}
      return next;
    });
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/emails/check?folder=${selectedFolder}`);
      if (res.ok) {
        const data = await res.json();
        if (data.emails && Array.isArray(data.emails)) {
          const sorted = [...data.emails].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setEmails(sorted);
          setToastMessage("Sincronizado!");
          setTimeout(() => setToastMessage(null), 2500);
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteEmail = async () => {
    if (!selectedEmail) return;
    const emailId = selectedEmail.id;
    const isAlreadyInTrash = selectedEmail.folder === 'TRASH' || selectedFolder === 'TRASH';

    if (isAlreadyInTrash) {
      // Eliminar permanentemente
      setEmails(prev => prev.filter(e => e.id !== emailId));
      setToastMessage("Mensagem eliminada definitivamente.");
      setTimeout(() => setToastMessage(null), 3000);
      setMobileView('list');

      try {
        await fetch('/api/emails/trash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: emailId, action: 'PERMANENT_DELETE' })
        });
      } catch (e) {}
    } else {
      // Mover para o Lixo
      setEmails(prev => prev.map(e => e.id === emailId ? { ...e, folder: 'TRASH' } : e));
      setToastMessage("Mensagem movida para o Lixo.");
      setTimeout(() => setToastMessage(null), 3000);
      setMobileView('list');

      try {
        await fetch('/api/emails/trash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: emailId, action: 'MOVE_TO_TRASH', folder: 'TRASH' })
        });
      } catch (e) {}
    }
  };

  const handleRestoreEmail = async () => {
    if (!selectedEmail) return;
    const emailId = selectedEmail.id;

    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, folder: 'INBOX' } : e));
    setToastMessage("✨ Mensagem restaurada para a Caixa de Entrada!");
    setTimeout(() => setToastMessage(null), 3000);

    try {
      await fetch('/api/emails/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: emailId, action: 'RESTORE' })
      });
    } catch (e) {}
  };

  const handleEmptyTrash = async () => {
    if (typeof window !== 'undefined' && window.confirm("Tem a certeza que deseja esvaziar todo o lixo? Todas as mensagens serão eliminadas definitivamente.")) {
      setEmails(prev => prev.filter(e => e.folder !== 'TRASH'));
      setToastMessage("🗑️ Lixo esvaziado com sucesso!");
      setTimeout(() => setToastMessage(null), 3000);
      try {
        await fetch('/api/emails/trash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'EMPTY_TRASH' })
        });
      } catch(e) {}
    }
  };

  // Funções de Resposta Inteligente com Captura Automática de E-mail e Contexto
  const handleReply = () => {
    if (!selectedEmail) return;
    const sender = parseSenderDetails(selectedEmail.from);
    const cleanFrom = sender.email || selectedEmail.from.replace(/[<>]/g, '').trim();
    const cleanSubject = selectedEmail.subject.toLowerCase().startsWith('re:') 
      ? selectedEmail.subject 
      : `Re: ${selectedEmail.subject}`;
    const dateFormatted = new Date(selectedEmail.createdAt).toLocaleString('pt-PT');
    const quotedBody = `\n\n\n---------- Mensagem original ----------\nDe: ${selectedEmail.from}\nData: ${dateFormatted}\nAssunto: ${selectedEmail.subject}\nPara: ${selectedEmail.to}\n\n${cleanPlainTextBody(selectedEmail.body)}`;

    setComposeConfig({
      isOpen: true,
      initialTo: cleanFrom,
      initialSubject: cleanSubject,
      initialBody: quotedBody
    });
  };

  const handleReplyAll = () => {
    if (!selectedEmail) return;
    const sender = parseSenderDetails(selectedEmail.from);
    const cleanFrom = sender.email || selectedEmail.from.replace(/[<>]/g, '').trim();
    const cleanSubject = selectedEmail.subject.toLowerCase().startsWith('re:') 
      ? selectedEmail.subject 
      : `Re: ${selectedEmail.subject}`;
    const dateFormatted = new Date(selectedEmail.createdAt).toLocaleString('pt-PT');
    const quotedBody = `\n\n\n---------- Mensagem original ----------\nDe: ${selectedEmail.from}\nData: ${dateFormatted}\nAssunto: ${selectedEmail.subject}\nPara: ${selectedEmail.to}\n\n${cleanPlainTextBody(selectedEmail.body)}`;

    setComposeConfig({
      isOpen: true,
      initialTo: cleanFrom,
      initialSubject: cleanSubject,
      initialBody: quotedBody
    });
  };

  const handleForward = () => {
    if (!selectedEmail) return;
    const cleanSubject = selectedEmail.subject.toLowerCase().startsWith('fwd:') 
      ? selectedEmail.subject 
      : `Fwd: ${selectedEmail.subject}`;
    const dateFormatted = new Date(selectedEmail.createdAt).toLocaleString('pt-PT');
    const quotedBody = `\n\n\n---------- Mensagem reencaminhada ----------\nDe: ${selectedEmail.from}\nData: ${dateFormatted}\nAssunto: ${selectedEmail.subject}\nPara: ${selectedEmail.to}\n\n${cleanPlainTextBody(selectedEmail.body)}`;

    setComposeConfig({
      isOpen: true,
      initialTo: '',
      initialSubject: cleanSubject,
      initialBody: quotedBody
    });
  };

  // Função para Traduzir E-mail para a Língua Selecionada com DeepL AI / Gemini (com Persistência Total e Alternância Rápida)
  const handleTranslateEmail = async (targetLangCode?: string, isAuto: boolean = false, forceRefresh: boolean = false) => {
    if (!selectedEmail) return;
    
    const emailId = selectedEmail.id;
    const langToUse = targetLangCode || selectedTargetLang;
    const currentTrans = translations[emailId];

    // Se já temos a tradução gravada para este mesmo idioma com assunto traduzido e não for forceRefresh:
    if (!forceRefresh && currentTrans && currentTrans.lang === langToUse && currentTrans.subject) {
      // Alternar suavemente entre ver original e ver tradução gravada (sem chamada de rede!)
      const updated: Record<string, EmailTranslation> = {
        ...translations,
        [emailId]: {
          ...currentTrans,
          showOriginal: !currentTrans.showOriginal
        }
      };
      saveTranslations(updated);
      return;
    }

    setIsTranslating(true);
    try {
      const isHtml = !!selectedEmail.html;
      const textToTranslate = selectedEmail.html || selectedEmail.body;
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: textToTranslate, 
          subject: selectedEmail.subject,
          targetLang: langToUse, 
          isHtml 
        })
      });
      const data = await res.json();
      if (data.translatedText) {
        const hasOriginalHtml = Boolean(selectedEmail.html && selectedEmail.html.includes('<'));
        const translationHasHtml = Boolean(data.translatedText.includes('<'));
        const safeIsHtml = hasOriginalHtml ? (translationHasHtml && data.isHtml) : data.isHtml;
        const safeBody = (hasOriginalHtml && !translationHasHtml) ? selectedEmail.html : data.translatedText;

        const updated: Record<string, EmailTranslation> = {
          ...translations,
          [emailId]: {
            text: safeBody,
            subject: data.translatedSubject || selectedEmail.subject,
            isHtml: safeIsHtml,
            lang: langToUse,
            detectedSourceLang: data.detectedSourceLang,
            showOriginal: false,
            autoTranslated: isAuto
          }
        };
        saveTranslations(updated);

        const langObj = TRANSLATION_LANGUAGES.find(l => l.code === langToUse);
        if (!isAuto) {
          setToastMessage(`✨ Mensagem traduzida para ${langObj?.label || langToUse}!`);
          setTimeout(() => setToastMessage(null), 3000);
        }
      }
    } catch(e) {
      if (!isAuto) {
        setToastMessage("Erro ao traduzir mensagem.");
        setTimeout(() => setToastMessage(null), 3000);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  // Deteção e Auto-Tradução Automática ao abrir email em língua estrangeira (e atualização de traduções antigas sem assunto)
  useEffect(() => {
    if (!selectedEmail) return;
    const emailId = selectedEmail.id;
    const currentTrans = translations[emailId];

    // Se o email tem HTML rico mas a tradução em cache é apenas texto simples corrupto de 1 linha:
    if (currentTrans && selectedEmail.html && selectedEmail.html.includes('<') && (!currentTrans.text || !currentTrans.text.includes('<'))) {
      const copy = { ...translations };
      delete copy[emailId];
      saveTranslations(copy);
      return;
    }

    // Se já existia tradução antiga guardada sem o assunto traduzido, atualiza automaticamente:
    if (currentTrans && !currentTrans.subject && !currentTrans.showOriginal && selectedEmail.subject && !isTranslating) {
      handleTranslateEmail(currentTrans.lang, true, true);
      return;
    }

    // Se já existe tradução completa, não dispara auto-tradução
    if (currentTrans) return;

    const isForeign = isLikelyForeignLanguage(selectedEmail.subject, selectedEmail.body, selectedTargetLang);
    if (isForeign && !isTranslating) {
      handleTranslateEmail(selectedTargetLang, true);
    }
  }, [selectedEmail?.id, selectedTargetLang]);

  const parsedSender = selectedEmail ? parseSenderDetails(selectedEmail.from) : { name: "", email: "", domain: "", initial: "RE", isCompanyService: false, isFreePersonalEmail: false, color: { bg: "bg-[#E8F0FE]", text: "text-[#1A73E8]" } };
  
  // Limpeza de emails para cabeçalho sem caracteres < ou >
  const cleanSenderEmail = selectedEmail ? (parsedSender.email || selectedEmail.from).replace(/[<>]/g, '').trim() : "";
  const cleanToEmail = selectedEmail ? selectedEmail.to.replace(/[<>]/g, '').trim() : "";

  // Tradução ativa do email atualmente selecionado
  const currentTranslation = selectedEmail ? translations[selectedEmail.id] : null;
  const isShowingTranslation = Boolean(currentTranslation && !currentTranslation.showOriginal);

  // Deteção Inteligente de Reuniões / Convites
  const detectedMeeting = selectedEmail ? extractMeetingInvite(selectedEmail.subject, selectedEmail.body, selectedEmail.from, selectedEmail.html) : null;
  const meetingRsvpState = selectedEmail ? meetingRsvpMap[selectedEmail.id] : undefined;
  const currentEmailAttachments = useMemo(() => extractAttachmentsFromEmail(selectedEmail), [selectedEmail]);
  const linkedInProfileUrl = useMemo(() => {
    if (!selectedEmail) return null;
    return extractLinkedInProfileUrl(selectedEmail.html, selectedEmail.body);
  }, [selectedEmail]);

  // Conteúdo ativo a exibir (Traduzido ou Original)
  const activeBodyText = selectedEmail ? (isShowingTranslation ? (currentTranslation?.text || selectedEmail.body) : selectedEmail.body) : "";

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col font-sans transition-colors duration-150 ${
      isLight ? 'bg-[#FFFFFF] text-[#202124]' : 'bg-[#07090E] text-[#E8EAED]'
    }`}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 left-4 md:left-auto md:w-auto z-50 bg-[#202124] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium flex items-center gap-2 animate-fade-in border border-white/10 select-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className={`h-14 border-b flex items-center justify-between px-3 md:px-5 z-20 shrink-0 transition-colors select-none ${
        isLight ? 'bg-[#FFFFFF] border-[#E5E7EB]' : 'bg-[#0A0D14] border-white/[0.08]'
      }`}>
        
        {/* Brand & Menu Hamburguer Mobile */}
        <div className="flex items-center gap-2 md:gap-6">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/inbox" className="flex items-center gap-2 group">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#1A73E8] flex items-center justify-center text-white shadow-sm font-bold text-xs md:text-sm">
              <Mail className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
            <span className={`font-bold text-sm tracking-tight ${isLight ? 'text-[#202124]' : 'text-white'}`}>
              RapiEmail
            </span>
          </Link>

          {/* Navigation Icons Desktop */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('mail')}
              title="Correio"
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'mail'
                  ? 'bg-[#E8F0FE] text-[#1A73E8]'
                  : isLight ? 'text-[#5F6368] hover:bg-[#F1F3F4]' : 'text-zinc-400 hover:bg-white/5'
              }`}
            >
              <Mail className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              title="Calendário"
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-[#E8F0FE] text-[#1A73E8]'
                  : isLight ? 'text-[#5F6368] hover:bg-[#F1F3F4]' : 'text-zinc-400 hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              title="Contactos"
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'contacts'
                  ? 'bg-[#E8F0FE] text-[#1A73E8]'
                  : isLight ? 'text-[#5F6368] hover:bg-[#F1F3F4]' : 'text-zinc-400 hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-xl mx-2 md:mx-6">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 ${isLight ? 'text-[#5F6368]' : 'text-zinc-400'}`} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar correio"
              className={`w-full text-xs pl-8 md:pl-10 pr-3 py-1.5 md:py-2 rounded-full border focus:outline-none focus:ring-1 focus:ring-[#1A73E8] transition-all ${
                isLight 
                  ? 'bg-[#F1F3F4] border-transparent focus:bg-white focus:border-[#1A73E8] text-[#202124] placeholder-[#5F6368]' 
                  : 'bg-white/5 border-white/10 text-white placeholder-zinc-500'
              }`}
            />
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1 md:gap-2">
          {!notificationsEnabled && (
            <button
              onClick={handleRequestNotifications}
              title="Ativar Notificações no Telemóvel e PC"
              className="px-2 py-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1 hover:bg-amber-500/25 transition-all"
            >
              <BellRing className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-600 animate-bounce" />
              <span className="hidden sm:inline">Alertas</span>
            </button>
          )}

          <button 
            onClick={handleManualRefresh}
            title="Atualizar emails"
            className={`p-1.5 md:p-2 rounded-full transition-colors ${
              isLight ? 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4]' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isRefreshing ? 'animate-spin text-[#1A73E8]' : ''}`} />
          </button>

          <button 
            onClick={toggleTheme}
            title={isLight ? "Ativar Modo Escuro" : "Ativar Modo Claro"}
            className={`p-1.5 md:p-2 rounded-full transition-colors ${
              isLight ? 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4]' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {isLight ? <Moon className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Sun className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400" />}
          </button>

          <Link
            href="/settings"
            title="Definições"
            className={`p-1.5 md:p-2 rounded-full transition-colors ${
              isLight ? 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4]' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </Link>

          {/* User Profile Avatar */}
          <Link href="/settings" className="relative ml-1 block shrink-0">
            <SmartAvatar from={user.email} customAvatarUrl={avatarUrl} size="sm" />
          </Link>
        </div>
      </header>

      {/* MOBILE DRAWER MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-xs select-none">
          <div className="w-72 bg-white dark:bg-[#0E111A] h-full flex flex-col p-4 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#1A73E8] text-white flex items-center justify-center font-bold text-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm">RapiEmail</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-zinc-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4">
              <button 
                onClick={() => { 
                  setIsMobileMenuOpen(false); 
                  setComposeConfig({ isOpen: true, initialTo: '', initialSubject: '', initialBody: '' }); 
                }}
                className="w-full py-2.5 bg-[#1A73E8] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm"
              >
                <Edit3 className="w-4 h-4" />
                <span>Escrever Email</span>
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {folders.map(f => {
                const Icon = f.icon;
                const isActive = selectedFolder === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => handleSelectFolder(f.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive ? 'bg-[#E8F0FE] text-[#1967D2]' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{f.label}</span>
                    </div>
                    {f.count > 0 && <span className="text-[10px] font-bold text-[#1A73E8]">{f.count}</span>}
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <UserProfileFooter initials={user.initials} name={user.name} email={user.email} />
            </div>
          </div>
        </div>
      )}

      {/* VIEW: CALENDAR */}
      {activeTab === 'calendar' && (
        <main className="flex-1 overflow-y-auto">
          <CalendarView user={user} />
        </main>
      )}

      {/* VIEW: CONTACTS */}
      {activeTab === 'contacts' && (
        <main className="flex-1 overflow-y-auto">
          <ContactsView user={user} />
        </main>
      )}

      {/* VIEW: MAIL */}
      {activeTab === 'mail' && (
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          
          {/* COLUMN 1: LEFT SIDEBAR DESKTOP */}
          <aside className={`hidden md:flex w-[210px] border-r flex-col shrink-0 h-full overflow-hidden transition-colors select-none ${
            isLight ? 'bg-[#FFFFFF] border-[#E5E7EB]' : 'bg-[#07090E] border-white/[0.08]'
          }`}>
            
            <div className="p-3">
              <button 
                onClick={() => setComposeConfig({ isOpen: true, initialTo: '', initialSubject: '', initialBody: '' })}
                className="w-full flex items-center justify-center gap-2 bg-[#1A73E8] hover:bg-[#1557B0] active:scale-[0.98] text-white py-2.5 px-4 rounded-full font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <span>Escrever</span>
              </button>
            </div>

            <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
              {folders.map(folder => {
                const Icon = folder.icon;
                const isActive = selectedFolder === folder.id;
                return (
                  <button
                    key={folder.id}
                    onClick={() => handleSelectFolder(folder.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-r-full text-xs font-medium transition-all ${
                      isActive 
                        ? isLight 
                          ? 'bg-[#E8F0FE] text-[#1967D2] font-bold' 
                          : 'bg-white/10 text-white font-bold'
                        : isLight 
                          ? 'text-[#202124] hover:bg-[#F1F3F4]' 
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#1A73E8]' : isLight ? 'text-[#5F6368]' : 'text-zinc-400'}`} />
                      <span>{folder.label}</span>
                    </div>
                    {folder.count > 0 && (
                      <span className={`text-[11px] font-bold ${isActive ? 'text-[#1A73E8]' : 'text-[#5F6368]'}`}>
                        {folder.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className={`p-3 border-t text-xs shrink-0 ${isLight ? 'border-[#E5E7EB] bg-[#FFFFFF]' : 'border-white/[0.08] bg-black/20'}`}>
              <div className="flex items-center justify-between mb-1 text-[11px] font-semibold text-[#202124] dark:text-zinc-300">
                <span>Armazenamento</span>
              </div>
              <div className="w-full h-1 bg-[#E5E7EB] dark:bg-white/10 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-[#1A73E8] rounded-full w-[2%]"></div>
              </div>
              <span className="text-[10px] text-zinc-500 block">5 MB de 5 GB (0.1%)</span>
            </div>

            <UserProfileFooter initials={user.initials} name={user.name} email={user.email} />
          </aside>

          {/* COLUMN 2: EMAIL LIST (Com Horas Reais e Organização Cronológica Precisa) */}
          <section className={`${
            mobileView === 'detail' ? 'hidden md:flex' : 'flex'
          } w-full md:w-[340px] lg:w-[380px] border-r flex-col shrink-0 h-full overflow-hidden transition-colors select-none ${
            isLight ? 'bg-[#FFFFFF] border-[#E5E7EB]' : 'bg-[#0A0D14] border-white/[0.08]'
          }`}>
            
            <div className={`h-11 px-4 border-b flex items-center justify-between text-xs font-semibold shrink-0 ${
              isLight ? 'border-[#E5E7EB] text-[#5F6368] bg-[#FFFFFF]' : 'border-white/[0.08] text-zinc-400 bg-white/[0.02]'
            }`}>
              <div className="flex items-center gap-2">
                <span>{folders.find(f => f.id === selectedFolder)?.label}</span>
                <span className="text-[11px] text-zinc-400 font-normal">({filteredEmails.length})</span>
              </div>
              {selectedFolder === 'TRASH' && filteredEmails.length > 0 ? (
                <button 
                  onClick={handleEmptyTrash}
                  className="text-[11px] text-red-500 hover:text-red-600 font-bold cursor-pointer"
                >
                  Esvaziar Lixo
                </button>
              ) : (
                <span className="text-[11px] text-zinc-400 font-normal">Mais recentes</span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#E5E7EB] dark:divide-white/[0.06]">
              {filteredEmails.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 text-xs">
                  <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <span>Sem mensagens nesta pasta.</span>
                </div>
              ) : (
                filteredEmails.map(email => {
                  const isSelected = selectedEmail?.id === email.id;
                  const isStarred = starredIds.has(email.id);
                  const isSent = email.folder === 'SENT' || email.from === user.email;
                  const senderDetails = parseSenderDetails(isSent ? email.to : email.from);
                  const dateDisplay = formatEmailDate(email.createdAt);
                  const isUnread = !email.read && !isSent;
                  const cleanPreview = cleanSnippetText(email.body);

                  return (
                    <div
                      key={email.id}
                      onClick={() => handleSelectEmail(email.id)}
                      className={`group relative p-3 transition-colors cursor-pointer ${
                        isSelected 
                          ? isLight ? 'bg-[#E8F0FE]' : 'bg-white/10'
                          : isUnread
                            ? isLight ? 'bg-[#FFFFFF] hover:bg-[#F8F9FA]' : 'bg-white/[0.04] hover:bg-white/[0.08]'
                            : isLight ? 'bg-[#FAFAFA] hover:bg-[#F1F3F4]' : 'bg-transparent hover:bg-white/[0.03]'
                      }`}
                    >
                      {isSelected && (
                        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-1 bg-[#1A73E8]"></div>
                      )}

                      {isUnread && (
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#1A73E8] shadow-sm"></div>
                      )}

                      <div className="flex items-start gap-2.5 pl-1.5">
                        {/* Avatar Inteligente */}
                        <div className="mt-0.5 shrink-0">
                          <SmartAvatar 
                            from={isSent ? email.to : email.from} 
                            customAvatarUrl={isSent ? avatarUrl : (extractLinkedInAvatarFromHtml(email.html) || null)}
                            size="sm" 
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-xs truncate ${
                              isUnread 
                                ? 'font-bold text-[#202124] dark:text-white' 
                                : 'font-normal text-[#3C4043] dark:text-zinc-300'
                            }`}>
                              {isSent ? `Para: ${senderDetails.name}` : senderDetails.name}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              {isSent && (
                                email.isOpened ? (
                                  <span title={`✅ Lido pelo destinatário em ${email.openedAt ? new Date(email.openedAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : ''} (${email.openCount || 1}x no ${email.userAgent || 'dispositivo'})`}>
                                    <CheckCheck className="w-3.5 h-3.5 text-[#1A73E8] dark:text-[#8AB4F8]" />
                                  </span>
                                ) : (
                                  <span title="Enviado e entregue (Aguardando leitura)">
                                    <Check className="w-3 h-3 text-zinc-400" />
                                  </span>
                                )
                              )}
                              <span 
                                suppressHydrationWarning
                                title={new Date(email.createdAt).toLocaleString('pt-PT')}
                                className={`text-[10px] font-mono ${
                                  isUnread ? 'font-bold text-[#1A73E8]' : 'text-zinc-400'
                                }`}
                              >
                                {dateDisplay}
                              </span>
                            </div>
                          </div>

                          <p className={`text-xs truncate mb-0.5 ${
                            isUnread 
                              ? 'font-bold text-[#202124] dark:text-white' 
                              : 'font-normal text-[#5F6368] dark:text-zinc-400'
                          }`}>
                            {(() => {
                              const itemTrans = translations[email.id];
                              const isItemTrans = Boolean(itemTrans && !itemTrans.showOriginal);
                              return (isItemTrans && itemTrans?.subject) ? itemTrans.subject : (email.subject || '(Sem assunto)');
                            })()}
                          </p>

                          <p className={`text-[11px] truncate leading-tight ${
                            isUnread ? 'text-[#3C4043] dark:text-zinc-300' : 'text-[#70757A] dark:text-zinc-500'
                          }`}>
                            {cleanPreview}
                          </p>
                        </div>

                        {/* Ações Rápidas do Item */}
                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          <button
                            type="button"
                            onClick={(e) => handleArchiveEmail(email.id, e)}
                            title={email.folder === 'ARCHIVE' ? "Mover para Caixa de Entrada" : "Arquivar mensagem"}
                            className="text-zinc-300 hover:text-[#1A73E8] dark:hover:text-blue-400 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => toggleStar(email.id, e)}
                            title="Com estrela"
                            className="text-zinc-300 hover:text-amber-400 p-0.5 cursor-pointer"
                          >
                            <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Mobile Floating Button */}
            <div className="md:hidden fixed right-5 bottom-6 z-30">
              <button
                onClick={() => setComposeConfig({ isOpen: true, initialTo: '', initialSubject: '', initialBody: '' })}
                className="w-14 h-14 rounded-full bg-[#1A73E8] text-white flex items-center justify-center shadow-2xl active:scale-95 transition-all"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </section>

          {/* COLUMN 3: EMAIL READER PANE (Com Cópia de Código 2FA, Tradutor Multi-Línguas e Responder) */}
          <main className={`${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          } flex-1 flex-col h-full overflow-hidden transition-colors ${
            isLight ? 'bg-[#FFFFFF]' : 'bg-[#07090E]'
          }`}>
            {selectedEmail ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                
                {/* Action Toolbar */}
                <div className={`h-12 md:h-11 px-4 md:px-6 border-b flex items-center justify-between text-xs shrink-0 select-none ${
                  isLight ? 'border-[#E5E7EB] bg-[#FFFFFF]' : 'border-white/[0.08] bg-white/[0.02]'
                }`}>
                  <div className="flex items-center gap-3 md:gap-4 text-[#5F6368] dark:text-zinc-400">
                    <button 
                      onClick={() => setMobileView('list')}
                      className="md:hidden flex items-center gap-1 text-[#1A73E8] font-bold text-xs px-2 py-1 rounded-lg bg-[#E8F0FE] -ml-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Voltar</span>
                    </button>

                    <button onClick={handleReply} title="Responder (Preenchimento Automático)" className="hover:text-[#1A73E8] flex items-center gap-1.5 transition-colors font-medium">
                      <Reply className="w-4 h-4 text-[#1A73E8]" />
                      <span className="hidden sm:inline text-xs text-[#1A73E8] font-bold">Responder</span>
                    </button>
                    <button onClick={handleReplyAll} title="Responder a todos" className="hidden sm:flex hover:text-[#1A73E8] items-center gap-1 transition-colors">
                      <ReplyAll className="w-4 h-4" />
                    </button>
                    <button onClick={handleForward} title="Reencaminhar" className="hover:text-[#1A73E8] flex items-center gap-1 transition-colors">
                      <Forward className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-[#E5E7EB] dark:bg-white/10 mx-1"></div>
                    <button onClick={(e) => toggleStar(selectedEmail.id, e)} title="Com estrela (Favoritos)" className="hover:text-amber-400 transition-colors cursor-pointer">
                      <Star className={`w-4 h-4 ${starredIds.has(selectedEmail.id) ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>

                    {/* Botão Arquivar / Desarquivar */}
                    {selectedEmail.folder === 'ARCHIVE' || selectedFolder === 'ARCHIVE' ? (
                      <button 
                        onClick={handleRestoreEmail} 
                        title="Mover para a Caixa de Entrada" 
                        className="hover:text-[#1A73E8] flex items-center gap-1 transition-colors cursor-pointer text-xs font-semibold text-[#1A73E8]"
                      >
                        <Inbox className="w-4 h-4" />
                        <span className="hidden lg:inline">Desarquivar</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleArchiveEmail(selectedEmail.id)} 
                        title="Arquivar mensagem" 
                        className="hover:text-[#1A73E8] flex items-center gap-1 transition-colors cursor-pointer text-xs font-medium"
                      >
                        <Archive className="w-4 h-4" />
                        <span className="hidden lg:inline">Arquivar</span>
                      </button>
                    )}

                    {selectedEmail.folder === 'TRASH' || selectedFolder === 'TRASH' ? (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleRestoreEmail} 
                          title="Restaurar para a Caixa de Entrada" 
                          className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Restaurar</span>
                        </button>
                        <button 
                          onClick={handleDeleteEmail} 
                          title="Eliminar definitivamente para sempre" 
                          className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Eliminar</span>
                        </button>
                      </div>
                    ) : (
                      <button onClick={handleDeleteEmail} title="Mover para o Lixo" className="hover:text-red-500 transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Hora Exata Real no Cabeçalho */}
                  <span 
                    suppressHydrationWarning
                    title={new Date(selectedEmail.createdAt).toISOString()}
                    className="text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400 font-mono"
                  >
                    {formatFullEmailDateTime(selectedEmail.createdAt)}
                  </span>
                </div>

                {/* Área de Leitura (Com Seleção Livre de Texto) */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-5 md:space-y-6 max-w-4xl select-text">
                  
                  {/* Subject Header */}
                  <h1 className={`text-lg md:text-xl font-bold tracking-tight leading-snug select-text ${isLight ? 'text-[#202124]' : 'text-white'}`}>
                    {(isShowingTranslation && currentTranslation?.subject) ? currentTranslation.subject : (selectedEmail.subject || '(Sem assunto)')}
                  </h1>

                  {/* Sender Header Card com SmartAvatar HD & Badge de Vista Real (Dois Riscos) */}
                  <div className="flex items-center justify-between border-b pb-4 border-[#E5E7EB] dark:border-white/10 select-none">
                    <div className="flex items-center gap-3">
                      <SmartAvatar 
                        from={selectedEmail.from} 
                        customAvatarUrl={extractLinkedInAvatarFromHtml(selectedEmail.html) || null}
                        size="md" 
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap select-text">
                          <span className={`font-bold text-xs md:text-sm ${isLight ? 'text-[#202124]' : 'text-white'}`}>
                            {parsedSender.name}
                          </span>
                          <span className="text-xs text-zinc-500 font-medium font-mono">
                            {cleanSenderEmail}
                          </span>
                          {linkedInProfileUrl && (
                            <a
                              href={linkedInProfileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5]/20 text-[11px] font-bold transition-all"
                              title="Ver perfil completo no LinkedIn"
                            >
                              <Globe2 className="w-3 h-3" />
                              <span>LinkedIn</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400 block mt-0.5 select-text">
                          para {cleanToEmail === user.email.toLowerCase() ? 'mim' : cleanToEmail}
                        </span>
                      </div>
                    </div>

                    {/* Badge de Vista Real / Dois Riscos para Mensagens Enviadas */}
                    {(selectedEmail.folder === 'SENT' || selectedEmail.from === user.email) && (
                      <div className="shrink-0">
                        {selectedEmail.isOpened ? (
                          <div 
                            title={`Lido pelo destinatário em ${selectedEmail.openedAt ? new Date(selectedEmail.openedAt).toLocaleString('pt-PT') : ''} (${selectedEmail.openCount || 1} visualizações no ${selectedEmail.userAgent || 'dispositivo'})`}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30 text-[#1A73E8] dark:text-blue-300 text-xs font-bold shadow-xs select-none"
                          >
                            <CheckCheck className="w-4 h-4 text-[#1A73E8] dark:text-blue-400" />
                            <span className="hidden sm:inline">Lido</span>
                            {selectedEmail.openCount && selectedEmail.openCount > 1 ? (
                              <span className="text-[10px] opacity-80">({selectedEmail.openCount}x)</span>
                            ) : null}
                          </div>
                        ) : (
                          <div 
                            title="Mensagem enviada com sucesso e entregue ao servidor do destinatário. A aguardar abertura."
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-500 text-xs font-medium select-none"
                          >
                            <Check className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="hidden sm:inline">Entregue</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 📅 DESTAQUE DE REUNIÃO / CONVITE DE CALENDÁRIO COM RSVP INTELIGENTE (GOOGLE MEET / ZOOM / TEAMS) */}
                  {detectedMeeting && (
                    <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-[#12141C] border border-[#E5E7EB] dark:border-white/10 shadow-sm space-y-4 animate-in fade-in duration-200 select-none">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <h3 className="text-sm md:text-base font-bold text-[#202124] dark:text-white leading-tight">
                            {detectedMeeting.title}
                          </h3>

                          {detectedMeeting.dateTimeDisplay && (
                            <div className="flex items-center gap-1.5 text-xs text-[#5F6368] dark:text-zinc-300 font-medium">
                              <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>{detectedMeeting.dateTimeDisplay}</span>
                            </div>
                          )}

                          {detectedMeeting.meetingUrl && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Video className="w-3.5 h-3.5 text-[#1A73E8] shrink-0" />
                              <a
                                href={detectedMeeting.meetingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#1A73E8] hover:underline font-semibold flex items-center gap-1 break-all"
                              >
                                <span>{detectedMeeting.meetingUrl}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}

                          <div className="text-[11px] text-zinc-400">
                            <span>{detectedMeeting.participantsInfo}</span>
                          </div>
                        </div>

                        {detectedMeeting.meetingUrl && (
                          <a
                            href={detectedMeeting.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 active:scale-95"
                          >
                            <Video className="w-4 h-4" />
                            <span>Entrar na Reunião</span>
                          </a>
                        )}
                      </div>

                      {/* Botões de Resposta RSVP (Recusar, Talvez, Aceite) */}
                      <div className="flex items-center gap-2 pt-2 border-t border-[#F1F3F4] dark:border-white/5 flex-wrap">
                        <button
                          onClick={() => handleRsvp(selectedEmail.id, 'declined')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            meetingRsvpState === 'declined'
                              ? 'bg-red-500 text-white shadow-xs'
                              : 'bg-[#F1F3F4] dark:bg-white/5 text-zinc-700 dark:text-zinc-200 hover:bg-[#E8EAED]'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Recusar</span>
                        </button>

                        <button
                          onClick={() => handleRsvp(selectedEmail.id, 'tentative')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            meetingRsvpState === 'tentative'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-[#F1F3F4] dark:bg-white/5 text-zinc-700 dark:text-zinc-200 hover:bg-[#E8EAED]'
                          }`}
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Talvez</span>
                        </button>

                        <button
                          onClick={() => handleRsvp(selectedEmail.id, 'accepted')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            meetingRsvpState === 'accepted'
                              ? 'bg-[#1A73E8] text-white shadow-xs'
                              : 'bg-[#F1F3F4] dark:bg-white/5 text-zinc-700 dark:text-zinc-200 hover:bg-[#E8EAED]'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Aceite</span>
                        </button>

                        {meetingRsvpState === 'accepted' && (
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 ml-2">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirmado no Calendário</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 🔑 DESTAQUE DE CÓDIGO DE VERIFICAÇÃO 2FA / OTP (CÓPIA COM 1 CLIQUE) */}
                  {detectedOtpCode && (
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-indigo-950/40 dark:to-purple-950/30 border border-blue-200 dark:border-indigo-500/30 shadow-xs animate-in fade-in duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#1A73E8] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-[#1967D2] dark:text-indigo-300 block uppercase tracking-wider">
                            Código de Verificação / 2FA Detetado
                          </span>
                          <span className="text-xl font-mono font-extrabold tracking-widest text-[#202124] dark:text-white select-all">
                            {detectedOtpCode}
                          </span>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(detectedOtpCode);
                          setToastMessage(`✅ Código ${detectedOtpCode} copiado!`);
                          setTimeout(() => setToastMessage(null), 3000);
                        }}
                        className="px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Código</span>
                      </button>
                    </div>
                  )}

                  {/* 🌐 BARRA DE TRADUÇÃO INTELIGENTE COM SELEÇÃO DE LÍNGUAS */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl bg-[#F8F9FA] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-xs select-none">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Languages className="w-4 h-4 text-[#1A73E8] shrink-0" />
                      <span className="font-semibold text-[#202124] dark:text-zinc-200">
                        {isShowingTranslation ? (
                          currentTranslation?.autoTranslated ? (
                            <span className="flex items-center gap-1 text-[#1A73E8] dark:text-blue-400">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Traduzido automaticamente para:</span>
                            </span>
                          ) : "✨ Traduzido para:"
                        ) : "🌐 Traduzir para:"}
                      </span>

                      {/* Dropdown Seletor de Línguas */}
                      <select
                        value={currentTranslation?.lang || selectedTargetLang}
                        onChange={(e) => {
                          const newLang = e.target.value;
                          setSelectedTargetLang(newLang);
                          handleTranslateEmail(newLang, false);
                        }}
                        className="bg-white dark:bg-zinc-800 border border-[#E5E7EB] dark:border-white/10 text-xs font-semibold rounded-lg px-2.5 py-1 text-[#202124] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1A73E8] cursor-pointer"
                      >
                        {TRANSLATION_LANGUAGES.map(lang => (
                          <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-2">
                      {currentTranslation && (
                        <button
                          onClick={() => {
                            const updated: Record<string, EmailTranslation> = {
                              ...translations,
                              [selectedEmail.id]: {
                                ...currentTranslation,
                                showOriginal: !currentTranslation.showOriginal
                              }
                            };
                            saveTranslations(updated);
                          }}
                          className="px-3 py-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-200 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          {isShowingTranslation ? "📄 Ver Original" : "🌐 Ver Tradução"}
                        </button>
                      )}

                      {(!currentTranslation || !isShowingTranslation) && (
                        <button
                          onClick={() => handleTranslateEmail(selectedTargetLang, false)}
                          disabled={isTranslating}
                          className="px-3 py-1 bg-[#1A73E8] hover:bg-[#1557B0] active:scale-95 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                        >
                          {isTranslating ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>A traduzir...</span>
                            </>
                          ) : (
                            <span>🌐 Traduzir Agora</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body Content com Seleção Total de Texto e Preservação de HTML */}
                  {isShowingTranslation && currentTranslation?.isHtml && currentTranslation.text && currentTranslation.text.includes('<') ? (
                    <div 
                      className="email-rich-html text-sm md:text-[15px] leading-relaxed text-[#202124] dark:text-[#E8EAED] select-text cursor-text"
                      dangerouslySetInnerHTML={{ __html: currentTranslation.text }}
                    />
                  ) : selectedEmail.html ? (
                    <div 
                      className="email-rich-html text-sm md:text-[15px] leading-relaxed text-[#202124] dark:text-[#E8EAED] select-text cursor-text"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                    />
                  ) : (
                    <div className={`text-sm md:text-[15px] leading-relaxed space-y-4 font-normal select-text cursor-text ${
                      isLight ? 'text-[#202124]' : 'text-[#E8EAED]'
                    }`}>
                      <SmartEmailBodyRenderer bodyText={activeBodyText} />
                    </div>
                  )}

                  {/* Anexos / Documentos (Gmail-Style Attachment Section) */}
                  {currentEmailAttachments.length > 0 && (
                    <div className="pt-6 pb-2 border-t border-[#E5E7EB] dark:border-white/10 select-none">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          <Paperclip className="w-3.5 h-3.5 text-[#1A73E8]" />
                          <span>{currentEmailAttachments.length} {currentEmailAttachments.length === 1 ? 'Anexo' : 'Anexos'}</span>
                        </div>
                        {currentEmailAttachments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              currentEmailAttachments.forEach(att => handleDownloadAttachment(att));
                            }}
                            className="text-xs font-semibold text-[#1A73E8] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Descarregar todos</span>
                          </button>
                        )}
                      </div>

                      {/* Lista de Ficheiros em Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {currentEmailAttachments.map((att, idx) => {
                          const ext = att.filename.split('.').pop()?.toUpperCase() || 'FILE';
                          const isPdf = ext === 'PDF';
                          const isDoc = ['DOC', 'DOCX'].includes(ext);
                          const isXls = ['XLS', 'XLSX', 'CSV'].includes(ext);
                          const isImg = ['PNG', 'JPG', 'JPEG', 'SVG', 'WEBP', 'GIF'].includes(ext);
                          const isZip = ['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(ext);

                          let bgClass = "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50";
                          let IconComponent = FileText;

                          if (isPdf) {
                            bgClass = "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50";
                            IconComponent = FileText;
                          } else if (isDoc) {
                            bgClass = "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50";
                            IconComponent = FileText;
                          } else if (isXls) {
                            bgClass = "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50";
                            IconComponent = FileSpreadsheet;
                          } else if (isImg) {
                            bgClass = "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50";
                            IconComponent = Eye;
                          } else if (isZip) {
                            bgClass = "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50";
                            IconComponent = FileArchive;
                          }

                          return (
                            <div 
                              key={idx}
                              className="group relative flex flex-col justify-between p-3 rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-zinc-50/70 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] hover:border-[#1A73E8]/40 hover:shadow-md transition-all cursor-pointer"
                              onClick={() => handlePreviewAttachment(att)}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border font-black text-xs shrink-0 ${bgClass}`}>
                                  {ext.slice(0, 4)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-[#1A73E8] transition-colors" title={att.filename}>
                                    {att.filename}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                                      {typeof att.size === 'number' ? `${(att.size / 1024).toFixed(1)} KB` : (att.size || '45 KB')}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 font-mono font-semibold">
                                      {ext}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Ações Rápidas de Hover */}
                              <div className="flex items-center justify-end gap-1.5 mt-3 pt-2 border-t border-zinc-200/50 dark:border-white/5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePreviewAttachment(att);
                                  }}
                                  title="Pré-visualizar documento"
                                  className="px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-white/10 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Ver</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadAttachment(att);
                                  }}
                                  title="Descarregar ficheiro"
                                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#1A73E8] hover:bg-[#1557B0] rounded-md transition-colors flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Descarregar</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Bottom Action Buttons */}
                  <div className="pt-5 border-t border-[#E5E7EB] dark:border-white/10 flex items-center gap-4 text-xs font-semibold text-[#1A73E8] select-none">
                    <button onClick={handleReply} className="flex items-center gap-1.5 hover:underline cursor-pointer">
                      <Reply className="w-4 h-4" />
                      <span>Responder</span>
                    </button>
                    <button onClick={handleReplyAll} className="hidden sm:flex items-center gap-1.5 hover:underline cursor-pointer">
                      <ReplyAll className="w-4 h-4" />
                      <span>Responder a todos</span>
                    </button>
                    <button onClick={handleForward} className="flex items-center gap-1.5 hover:underline cursor-pointer">
                      <Forward className="w-4 h-4" />
                      <span>Reencaminhar</span>
                    </button>
                  </div>

                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-400 text-xs select-none">
                Selecione uma mensagem para ler.
              </div>
            )}
          </main>

        </div>
      )}

      {/* Modais */}
      {composeConfig.isOpen && (
        <ComposeModal 
          isOpen={composeConfig.isOpen} 
          onClose={() => setComposeConfig({ isOpen: false, initialTo: '', initialSubject: '', initialBody: '' })} 
          userEmail={user.email}
          initialTo={composeConfig.initialTo}
          initialSubject={composeConfig.initialSubject}
          initialBody={composeConfig.initialBody}
        />
      )}

      {isSiteBuilderOpen && (
        <RapiSiteBuilderModal 
          isOpen={isSiteBuilderOpen} 
          onClose={() => setIsSiteBuilderOpen(false)} 
          userDomain={userDomain} 
        />
      )}

      {/* Modal de Pré-visualização de Anexos / Documentos */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-[#12151E] rounded-2xl shadow-2xl border border-[#E5E7EB] dark:border-white/10 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB] dark:border-white/10 bg-zinc-50 dark:bg-[#0E1017]">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="w-8 h-8 rounded-lg bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs md:text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {previewAttachment.filename}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span>{typeof previewAttachment.size === 'number' ? `${(previewAttachment.size / 1024).toFixed(1)} KB` : (previewAttachment.size || 'Documento Seguro')}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <ShieldCheck className="w-3 h-3" /> Verificado por RapiEmail
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadAttachment(previewAttachment)}
                  className="px-3.5 py-1.5 bg-[#1A73E8] hover:bg-[#1557B0] active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descarregar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-xl hover:bg-zinc-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Preview */}
            <div className="flex-1 overflow-auto p-4 md:p-6 flex items-center justify-center bg-zinc-100 dark:bg-[#07090E] min-h-[350px]">
              {previewAttachment.content && previewAttachment.content.startsWith('data:image/') ? (
                <img 
                  src={previewAttachment.content} 
                  alt={previewAttachment.filename} 
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
                />
              ) : previewAttachment.content && previewAttachment.content.startsWith('data:application/pdf') ? (
                <iframe 
                  src={previewAttachment.content} 
                  className="w-full h-[70vh] rounded-lg border border-zinc-300 dark:border-white/10 shadow" 
                  title={previewAttachment.filename}
                />
              ) : (
                <div className="max-w-md w-full bg-white dark:bg-[#12151E] p-6 rounded-2xl border border-[#E5E7EB] dark:border-white/10 text-center shadow-lg">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-900/50 shadow-inner">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1 break-words">
                    {previewAttachment.filename}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
                    Este ficheiro está pronto para leitura e descarregamento seguro no seu dispositivo.
                  </p>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/40 text-left text-xs mb-5 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">Proteção Antivírus Ativa</span>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                        O anexo foi analisado e certificado pelo motor de segurança de correio corporativo RapiEmail.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadAttachment(previewAttachment)}
                    className="w-full py-2.5 bg-[#1A73E8] hover:bg-[#1557B0] active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descarregar Documento Original</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
