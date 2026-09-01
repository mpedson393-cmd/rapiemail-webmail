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
  Sparkles, Copy, KeyRound, Globe2, RotateCcw
} from 'lucide-react';
import { UserProfileFooter } from './UserProfileFooter';
import { ComposeModal } from './ComposeModal';
import { RapiSiteBuilderModal } from './RapiSiteBuilderModal';
import { CalendarView } from './CalendarView';
import { ContactsView } from './ContactsView';
import { SmartAvatar } from './SmartAvatar';
import { parseSenderDetails, extractLinkedInAvatarFromHtml, setCachedAvatar } from '@/lib/avatar';

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
  const sample = (subject + ' ' + body).toLowerCase().slice(0, 1000);
  
  const foreignWords = [
    'the ', 'to ', 'and ', 'you ', 'your ', 'for ', 'with ', 'from ', 
    'have ', 'this ', 'that ', 'will ', 'thanks', 'please', 'welcome', 
    'verify', 'account', 'security', 'report', 'digest', 'message', 
    'connection', 'reached out', 'invited', 'team', 'hi ', 'hello',
    'joined', 'confirmation', 'click here', 'subject:', 'hi edson'
  ];
  
  const ptWords = [
    'você', 'voce', 'para ', 'com ', 'não ', 'nao ', 'está ', 'esta ', 
    'uma ', 'pela ', 'pelo ', 'obrigado', 'olá', 'ola', 'seus', 'sua ', 
    'mensagem', 'enviar', 'recebido', 'código', 'segurança'
  ];

  let foreignScore = 0;
  for (const w of foreignWords) {
    if (sample.includes(w)) foreignScore++;
  }

  let ptScore = 0;
  for (const w of ptWords) {
    if (sample.includes(w)) ptScore++;
  }

  return foreignScore >= 2 && foreignScore > ptScore;
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
    .replace(/<([^>\s]+)%3E/gi, '$1')
    .replace(/<([^>\s]+)>/g, '$1')
    .replace(/%3E/gi, '')
    .trim();
}

// Renderizador Inteligente com Seleção Livre de Texto e Colapso de Quotes
function SmartEmailBodyRenderer({ bodyText }: { bodyText: string }) {
  const [showQuoted, setShowQuoted] = useState(false);
  const cleanedText = cleanPlainTextBody(bodyText);

  const quoteSplitMatch = cleanedText.match(/(?:On\s+[A-Za-z]+,\s+[A-Za-z]+\s+\d+.*wrote:|>+\s+On\s+.*wrote:)/i);
  
  if (quoteSplitMatch && quoteSplitMatch.index !== undefined) {
    const mainMessage = cleanedText.substring(0, quoteSplitMatch.index).trim();
    const quotedContent = cleanedText.substring(quoteSplitMatch.index).trim();

    return (
      <div className="space-y-4 select-text cursor-text">
        <div className="space-y-3 select-text">
          {renderParagraphs(mainMessage)}
        </div>

        <div className="pt-2 select-none">
          <button
            onClick={() => setShowQuoted(!showQuoted)}
            className="px-2.5 py-1 rounded-md bg-[#F1F3F4] dark:bg-white/10 hover:bg-[#E8EAED] dark:hover:bg-white/15 text-zinc-600 dark:text-zinc-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title={showQuoted ? "Ocultar texto citado" : "Mostrar texto citado"}
          >
            <span>...</span>
            <span className="text-[11px] font-medium text-zinc-500">
              {showQuoted ? "Ocultar histórico" : "Mostrar histórico anterior"}
            </span>
          </button>

          {showQuoted && (
            <div className="mt-3 pl-4 border-l-2 border-[#CBD5E1] dark:border-zinc-700 text-[#5F6368] dark:text-zinc-400 text-xs font-mono space-y-2 animate-in fade-in duration-150 select-text">
              {quotedContent.split('\n\n').map((qPara, qIdx) => (
                <p key={qIdx} className="whitespace-pre-line leading-relaxed select-text">
                  {renderInlineLinks(qPara)}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 select-text cursor-text">
      {renderParagraphs(cleanedText)}
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
  const [starredIds, setStarredIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('rapi_starred_ids');
        if (saved) return new Set(JSON.parse(saved));
      } catch(e) {}
    }
    return new Set();
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Estados Mobile & Notificações
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('rapi_alerts_enabled') === 'true') return true;
      if ('Notification' in window && Notification.permission === 'granted') return true;
    }
    return false;
  });

  // Estado de Tradução Persistente com Seleção Livre de Línguas e Preservação de HTML
  const [translations, setTranslations] = useState<Record<string, EmailTranslation>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('rapi_email_translations');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

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

  // 2. Inicializar Service Worker, Tema e Sincronização Automática de Push
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
        const updated: Record<string, EmailTranslation> = {
          ...translations,
          [emailId]: {
            text: data.translatedText,
            subject: data.translatedSubject || selectedEmail.subject,
            isHtml: data.isHtml ?? isHtml,
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
                            customAvatarUrl={isSent ? avatarUrl : null}
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
                            <span 
                              title={new Date(email.createdAt).toLocaleString('pt-PT')}
                              className={`text-[10px] shrink-0 ml-2 font-mono ${
                                isUnread ? 'font-bold text-[#1A73E8]' : 'text-zinc-400'
                              }`}
                            >
                              {dateDisplay}
                            </span>
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

                        <button
                          onClick={(e) => toggleStar(email.id, e)}
                          className="text-zinc-300 hover:text-amber-400 shrink-0 pt-0.5"
                        >
                          <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
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

                  {/* Sender Header Card com SmartAvatar HD */}
                  <div className="flex items-center justify-between border-b pb-4 border-[#E5E7EB] dark:border-white/10 select-none">
                    <div className="flex items-center gap-3">
                      <SmartAvatar 
                        from={selectedEmail.from} 
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
                        </div>
                        <span className="text-[11px] text-zinc-400 block mt-0.5 select-text">
                          para {cleanToEmail === user.email.toLowerCase() ? 'mim' : cleanToEmail}
                        </span>
                      </div>
                    </div>
                  </div>

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
                  {isShowingTranslation && currentTranslation?.isHtml ? (
                    <div 
                      className="email-rich-html text-sm md:text-[15px] leading-relaxed text-[#202124] dark:text-[#E8EAED] select-text cursor-text"
                      dangerouslySetInnerHTML={{ __html: currentTranslation.text }}
                    />
                  ) : selectedEmail.html && !isShowingTranslation ? (
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

    </div>
  );
}
