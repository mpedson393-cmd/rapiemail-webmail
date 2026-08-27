"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  Inbox, Star, Send, FileText, Search, Bell, Clock, Trash2, 
  Archive, AlertOctagon, Mail, Calendar, Users, Settings, 
  RefreshCw, CornerUpLeft, CornerUpRight, MoreHorizontal,
  CheckCircle2, ChevronDown, Paperclip, Check, CheckCheck, 
  Edit3, X, Eye, ShieldCheck, Moon, Sun, Reply, ReplyAll, 
  Forward, Ban, Code2, ExternalLink
} from 'lucide-react';
import { UserProfileFooter } from './UserProfileFooter';
import { ComposeModal } from './ComposeModal';
import { RapiSiteBuilderModal } from './RapiSiteBuilderModal';
import { CalendarView } from './CalendarView';
import { ContactsView } from './ContactsView';

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

// Utilitário para formatar Remetente e Email Limpos
function parseSender(fromStr: string): { name: string; email: string; initial: string } {
  if (!fromStr) return { name: "Desconhecido", email: "", initial: "RE" };
  
  const match = fromStr.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    const rawName = match[1].replace(/["']/g, '').trim();
    const rawEmail = match[2].trim();
    const displayName = rawName || rawEmail.split('@')[0];
    const initial = displayName.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase() || 'RE';
    return { name: displayName, email: rawEmail, initial };
  }

  if (fromStr.includes('@')) {
    const rawEmail = fromStr.trim();
    const [userPart] = rawEmail.split('@');
    const cleanName = userPart.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const initial = cleanName.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase() || 'RE';
    return { name: cleanName, email: rawEmail, initial };
  }

  return { name: fromStr, email: fromStr, initial: fromStr.substring(0, 2).toUpperCase() || 'RE' };
}

// Obter avatar limpo oficial: Favicon real da empresa ou Monograma corporativo Google/Apple
function getSenderVisual(emailOrFrom: string): { logoUrl?: string; initial: string; bgClass: string; textClass: string } {
  const clean = (emailOrFrom || "").toLowerCase();
  const match = clean.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const domain = match ? match[1] : '';

  const sender = parseSender(emailOrFrom);

  // Paleta de cores corporativas Google/Apple para as iniciais
  const colors = [
    { bg: "bg-[#E8F0FE]", text: "text-[#1A73E8]" }, // Azul Google
    { bg: "bg-[#E6F4EA]", text: "text-[#137333]" }, // Verde
    { bg: "bg-[#FEF7E0]", text: "text-[#B06000]" }, // Âmbar
    { bg: "bg-[#FCE8E6]", text: "text-[#C5221F]" }, // Vermelho
    { bg: "bg-[#F3E8FD]", text: "text-[#9334E6]" }, // Roxo
    { bg: "bg-[#E0F2FE]", text: "text-[#0284C7]" }, // Ciano
  ];

  let hash = 0;
  for (let i = 0; i < sender.name.length; i++) {
    hash = sender.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const chosenColor = colors[colorIndex];

  // Domínios com favicons corporativos conhecidos
  if (domain && !domain.includes("gmail.com") && !domain.includes("outlook.com") && !domain.includes("hotmail.com") && !domain.includes("yahoo.com")) {
    let lookupDomain = domain;
    if (domain.includes("pawapay")) lookupDomain = "pawapay.io";
    if (domain.includes("hubspot")) lookupDomain = "moorwand.com";
    if (domain.includes("currencycloud")) lookupDomain = "currencycloud.com";
    if (domain.includes("termii")) lookupDomain = "termii.com";
    if (domain.includes("stripe")) lookupDomain = "stripe.com";
    if (domain.includes("impact")) lookupDomain = "impact.com";
    if (domain.includes("linkedin")) lookupDomain = "linkedin.com";
    if (domain.includes("bel.money")) lookupDomain = "bel.money";
    if (domain.includes("apple")) lookupDomain = "apple.com";
    if (domain.includes("digitalocean")) lookupDomain = "digitalocean.com";
    if (domain.includes("cloudflare")) lookupDomain = "cloudflare.com";

    return {
      logoUrl: `https://www.google.com/s2/favicons?domain=${lookupDomain}&sz=128`,
      initial: sender.initial,
      bgClass: chosenColor.bg,
      textClass: chosenColor.text
    };
  }

  return {
    initial: sender.initial,
    bgClass: chosenColor.bg,
    textClass: chosenColor.text
  };
}

// Formatar data no estilo Private Email (ex: 31/07 ou 18:13)
function formatEmailDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  } catch (e) {
    return "";
  }
}

// Renderizador Inteligente de Links e Botões de Ação
function renderParagraphsWithActionButtons(text: string) {
  const paragraphs = text.split('\n\n');
  return paragraphs.map((para, idx) => {
    // 1. Detectar links de ativação de conta (PawaPay, etc.)
    const activateMatch = para.match(/(?:Activate Account|Ativar Conta|Confirmar Conta)[:\s]*(https:\/\/[^\s]+)/i);
    if (activateMatch) {
      const url = activateMatch[1];
      const intro = para.split(/(?:Activate Account|Ativar Conta|Confirmar Conta)/i)[0].trim();
      return (
        <div key={idx} className="my-4 space-y-3">
          {intro && <p className="leading-relaxed whitespace-pre-line">{intro}</p>}
          <div>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A73E8] hover:bg-[#1557B0] active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <span>🚀 Ativar Conta no Portal PawaPay</span>
            </a>
          </div>
        </div>
      );
    }

    // 2. Detectar links de agendamento (Stripe discovery call, etc.)
    const calMatch = para.match(/(https:\/\/stripe\.my\.leandata\.com\/[^\s]+|https:\/\/calendly\.com\/[^\s]+)/i);
    if (calMatch) {
      const url = calMatch[1];
      return (
        <div key={idx} className="my-4 space-y-3">
          <div>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#635BFF] hover:bg-[#4E44E5] active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <span>📅 Agendar Chamada com a Stripe</span>
            </a>
          </div>
        </div>
      );
    }

    // 3. Detectar links de verificação de dispositivo (Termii, LinkedIn)
    const verifyMatch = para.match(/(?:verify-device|confirm-device|accounts\.termii\.com)[^\s]*/i);
    if (verifyMatch && para.match(/https:\/\/[^\s]+/)) {
      const url = para.match(/https:\/\/[^\s]+/)?.[0] || '';
      return (
        <div key={idx} className="my-4 space-y-3">
          <div>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <span>🔐 Confirmar Dispositivo Seguro</span>
            </a>
          </div>
        </div>
      );
    }

    // 4. Detectar convites LinkedIn (Aceitar / Conectar)
    if (para.includes("linkedin.com/comm/mynetwork/invite-accept") || para.includes("Sim, conectar") || para.includes("Aceitar conexão") || para.includes("Você conhece")) {
      const acceptUrl = para.match(/(https:\/\/[^\s]*invite-accept[^\s]*)/i)?.[1] ||
                        para.match(/(https:\/\/[^\s]*linkedin\.com\/[^\s]*)/i)?.[1];
      return (
        <div key={idx} className="my-4 p-5 rounded-2xl bg-[#F8F9FA] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 space-y-3">
          <p className="font-semibold text-xs text-[#202124] dark:text-zinc-200">
            {para.replace(/https?:\/\/[^\s]+/g, '').replace(/Sim, conectar/g, '').trim()}
          </p>
          {acceptUrl && (
            <div className="flex items-center gap-3 pt-2">
              <a
                href={acceptUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#0A66C2] hover:bg-[#004182] active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                <span>✓ Aceitar Conexão no LinkedIn</span>
              </a>
            </div>
          )}
        </div>
      );
    }

    // 5. Citações de resposta
    if (para.includes("wrote:") || para.includes("escreveu:") || para.startsWith("----")) {
      return (
        <div key={idx} className="pl-4 border-l-2 border-[#CBD5E1] dark:border-zinc-700 text-[#5F6368] dark:text-zinc-400 text-sm italic my-3 whitespace-pre-line">
          {renderInlineCleanLinks(para)}
        </div>
      );
    }

    // 6. Parágrafo padrão com links limpos inline
    return (
      <p key={idx} className="whitespace-pre-line leading-relaxed">
        {renderInlineCleanLinks(para)}
      </p>
    );
  });
}

function renderInlineCleanLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      let label = part;
      try {
        const u = new URL(part);
        label = u.hostname.replace('www.', '');
      } catch(e) {}
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="text-[#1A73E8] hover:text-[#1557B0] hover:underline font-medium break-all"
        >
          {label}
        </a>
      );
    }
    return part;
  });
}

export function InboxDashboard({ user, initialEmails, currentFolder }: Props) {
  const [emails, setEmails] = useState<EmailItem[]>(initialEmails);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(initialEmails[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(currentFolder || 'INBOX');
  const [activeTab, setActiveTab] = useState<'mail' | 'calendar' | 'contacts'>('mail');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSiteBuilderOpen, setIsSiteBuilderOpen] = useState(false);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [replyText, setReplyText] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Sistema de Tema: Padrão Claro Clean (Claro/Escuro)
  const [isLight, setIsLight] = useState<boolean>(true);

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

  // Carregar Avatar Real do Utilizador
  useEffect(() => {
    fetch('/api/user/avatar')
      .then(res => res.json())
      .then(data => {
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
      })
      .catch(() => {});
  }, []);

  // Polling automático de novos emails em tempo real
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/emails/check?folder=${selectedFolder}`);
        if (res.ok) {
          const data = await res.json();
          if (data.emails && Array.isArray(data.emails)) {
            setEmails(data.emails);
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
    { id: 'DRAFT', label: 'Rascunhos', icon: FileText, count: emails.filter(e => e.folder === 'DRAFT').length },
    { id: 'SENT', label: 'Enviados', icon: Send, count: emails.filter(e => e.folder === 'SENT').length },
    { id: 'SPAM', label: 'Spam', icon: AlertOctagon, count: emails.filter(e => e.folder === 'SPAM').length },
    { id: 'TRASH', label: 'Lixo', icon: Trash2, count: emails.filter(e => e.folder === 'TRASH').length },
    { id: 'ARCHIVE', label: 'Arquivo', icon: Archive, count: emails.filter(e => e.folder === 'ARCHIVE').length },
  ], [emails]);

  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      const matchFolder = email.folder === selectedFolder;
      const matchSearch = searchQuery === '' || 
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.body.toLowerCase().includes(searchQuery.toLowerCase());
      return matchFolder && matchSearch;
    });
  }, [emails, selectedFolder, searchQuery]);

  const selectedEmail = useMemo(() => {
    return emails.find(e => e.id === selectedEmailId) || filteredEmails[0] || null;
  }, [emails, selectedEmailId, filteredEmails]);

  const handleSelectFolder = (folderId: string) => {
    setSelectedFolder(folderId);
    const inFolder = emails.filter(e => e.folder === folderId);
    setSelectedEmailId(inFolder[0]?.id || null);
  };

  const handleSelectEmail = (id: string) => {
    setSelectedEmailId(id);
    setEmails(prev => prev.map(e => e.id === id ? { ...e, read: true } : e));
  };

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
          setEmails(data.emails);
          setToastMessage("Caixa de entrada atualizada!");
          setTimeout(() => setToastMessage(null), 3000);
        }
      }
    } catch (err) {
      setToastMessage("Erro ao sincronizar.");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteEmail = async () => {
    if (!selectedEmail) return;
    setEmails(prev => prev.filter(e => e.id !== selectedEmail.id));
    setToastMessage("Email movido para o lixo.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const parsedSender = selectedEmail ? parseSender(selectedEmail.from) : { name: "", email: "", initial: "RE" };
  const visualSender = selectedEmail ? getSenderVisual(selectedEmail.from) : { initial: "RE", bgClass: "bg-[#E8F0FE]", textClass: "text-[#1A73E8]" };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-150 ${
      isLight ? 'bg-[#FFFFFF] text-[#202124]' : 'bg-[#07090E] text-[#E8EAED]'
    }`}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#202124] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 animate-fade-in border border-white/10">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER (Private Email / Google Standard) */}
      <header className={`h-14 border-b flex items-center justify-between px-5 z-20 flex-shrink-0 transition-colors ${
        isLight ? 'bg-[#FFFFFF] border-[#E5E7EB]' : 'bg-[#0A0D14] border-white/[0.08]'
      }`}>
        
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/inbox" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#1A73E8] flex items-center justify-center text-white shadow-sm font-bold text-sm">
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className={`font-bold text-sm tracking-tight ${isLight ? 'text-[#202124]' : 'text-white'}`}>
                RapiEmail
              </span>
              <span className="text-[10px] text-zinc-400 font-medium -mt-0.5">Enterprise</span>
            </div>
          </Link>

          {/* Navigation Icons (Correio, Calendário, Contactos) */}
          <div className="flex items-center gap-1">
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
        <div className="flex-1 max-w-xl mx-6 hidden md:block">
          <div className="relative">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-[#5F6368]' : 'text-zinc-400'}`} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar correio"
              className={`w-full text-xs pl-10 pr-4 py-2 rounded-full border focus:outline-none focus:ring-1 focus:ring-[#1A73E8] transition-all ${
                isLight 
                  ? 'bg-[#F1F3F4] border-transparent focus:bg-white focus:border-[#1A73E8] text-[#202124] placeholder-[#5F6368]' 
                  : 'bg-white/5 border-white/10 text-white placeholder-zinc-500'
              }`}
            />
          </div>
        </div>

        {/* Right Tools: Refresh, Theme Switcher, Settings, Profile */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleManualRefresh}
            title="Atualizar emails"
            className={`p-2 rounded-full transition-colors ${
              isLight ? 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4]' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#1A73E8]' : ''}`} />
          </button>

          <button 
            onClick={toggleTheme}
            title={isLight ? "Ativar Modo Escuro" : "Ativar Modo Claro"}
            className={`p-2 rounded-full transition-colors ${
              isLight ? 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4]' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          <Link
            href="/settings"
            title="Definições"
            className={`p-2 rounded-full transition-colors ${
              isLight ? 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4]' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4" />
          </Link>

          {/* User Profile Avatar */}
          <Link href="/settings" className="relative ml-2 block">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#E5E7EB] dark:border-white/10 bg-[#1A73E8] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user.initials}</span>
              )}
            </div>
          </Link>
        </div>
      </header>

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

      {/* VIEW: MAIL (3-Column Workspace) */}
      {activeTab === 'mail' && (
        <div className="flex-1 flex overflow-hidden">
          
          {/* COLUMN 1: LEFT SIDEBAR (Folders & Storage) */}
          <aside className={`w-[210px] border-r flex flex-col flex-shrink-0 transition-colors ${
            isLight ? 'bg-[#FFFFFF] border-[#E5E7EB]' : 'bg-[#07090E] border-white/[0.08]'
          }`}>
            
            {/* "Escrever" Button (Solid Royal Blue Capsule) */}
            <div className="p-3">
              <button 
                onClick={() => setIsComposeOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-[#1A73E8] hover:bg-[#1557B0] active:scale-[0.98] text-white py-2.5 px-4 rounded-full font-bold text-xs shadow-sm transition-all"
              >
                <span>Escrever</span>
              </button>
            </div>

            {/* Folders Navigation */}
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

            {/* Storage Meter (Private Email Style) */}
            <div className={`p-3 border-t text-xs ${isLight ? 'border-[#E5E7EB] bg-[#FFFFFF]' : 'border-white/[0.08] bg-black/20'}`}>
              <div className="flex items-center justify-between mb-1 text-[11px] font-semibold text-[#202124] dark:text-zinc-300">
                <span>Armazenamento</span>
              </div>
              <div className="w-full h-1 bg-[#E5E7EB] dark:bg-white/10 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-[#1A73E8] rounded-full w-[2%]"></div>
              </div>
              <span className="text-[10px] text-zinc-500 block">5 MB de 5 GB (0.1%)</span>
            </div>

            {/* User Profile Footer */}
            <UserProfileFooter initials={user.initials} name={user.name} email={user.email} />
          </aside>

          {/* COLUMN 2: EMAIL LIST (Flat Clean Dividers like Private Email) */}
          <section className={`w-[340px] md:w-[380px] border-r flex flex-col flex-shrink-0 transition-colors ${
            isLight ? 'bg-[#FFFFFF] border-[#E5E7EB]' : 'bg-[#0A0D14] border-white/[0.08]'
          }`}>
            
            {/* List Header */}
            <div className={`h-11 px-4 border-b flex items-center justify-between text-xs font-semibold ${
              isLight ? 'border-[#E5E7EB] text-[#5F6368] bg-[#FFFFFF]' : 'border-white/[0.08] text-zinc-400 bg-white/[0.02]'
            }`}>
              <div className="flex items-center gap-2">
                <span>{folders.find(f => f.id === selectedFolder)?.label}</span>
                <span className="text-[11px] text-zinc-400 font-normal">({filteredEmails.length})</span>
              </div>
              <span className="text-[11px] text-zinc-400 font-normal">Mais recentes</span>
            </div>

            {/* List Items */}
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
                  const senderInfo = isSent ? parseSender(email.to) : parseSender(email.from);
                  const visual = getSenderVisual(isSent ? email.to : email.from);
                  const dateDisplay = formatEmailDate(email.createdAt);

                  return (
                    <div
                      key={email.id}
                      onClick={() => handleSelectEmail(email.id)}
                      className={`group relative p-3 transition-colors cursor-pointer ${
                        isSelected 
                          ? isLight ? 'bg-[#E8F0FE]' : 'bg-white/10'
                          : isLight ? 'bg-[#FFFFFF] hover:bg-[#F8F9FA]' : 'bg-transparent hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Active Indicator */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1A73E8]"></div>
                      )}

                      <div className="flex items-start gap-2.5">
                        {/* Avatar Corporativo / Favicon */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 overflow-hidden shadow-xs border border-[#E5E7EB] dark:border-white/10 ${
                          visual.logoUrl ? 'bg-white' : `${visual.bgClass} ${visual.textClass}`
                        }`}>
                          {isSent && avatarUrl ? (
                            <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                          ) : visual.logoUrl ? (
                            <img 
                              src={visual.logoUrl} 
                              alt="" 
                              className="w-4 h-4 object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span>{visual.initial}</span>
                          )}
                        </div>

                        {/* Text Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-xs truncate ${!email.read && !isSent ? 'font-bold text-[#202124] dark:text-white' : 'font-semibold text-[#3C4043] dark:text-zinc-300'}`}>
                              {isSent ? `Para: ${senderInfo.name}` : senderInfo.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 shrink-0 ml-2 font-mono">
                              {dateDisplay}
                            </span>
                          </div>

                          <p className={`text-xs truncate mb-0.5 ${!email.read && !isSent ? 'font-bold text-[#202124] dark:text-white' : 'font-medium text-[#3C4043] dark:text-zinc-300'}`}>
                            {email.subject || '(Sem assunto)'}
                          </p>

                          <p className="text-[11px] text-[#5F6368] dark:text-zinc-400 truncate leading-tight">
                            {email.body.replace(/\s+/g, ' ').slice(0, 80)}
                          </p>
                        </div>

                        {/* Star Button */}
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
          </section>

          {/* COLUMN 3: EMAIL READER PANE (Private Email Exact Toolbar & Layout) */}
          <main className={`flex-1 flex flex-col overflow-hidden transition-colors ${
            isLight ? 'bg-[#FFFFFF]' : 'bg-[#07090E]'
          }`}>
            {selectedEmail ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Top Action Toolbar with Exact Private Email Icons */}
                <div className={`h-11 px-6 border-b flex items-center justify-between text-xs shrink-0 ${
                  isLight ? 'border-[#E5E7EB] bg-[#FFFFFF]' : 'border-white/[0.08] bg-white/[0.02]'
                }`}>
                  <div className="flex items-center gap-4 text-[#5F6368] dark:text-zinc-400">
                    <button onClick={() => setIsComposeOpen(true)} title="Responder" className="hover:text-[#1A73E8] flex items-center gap-1 transition-colors">
                      <Reply className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsComposeOpen(true)} title="Responder a todos" className="hover:text-[#1A73E8] flex items-center gap-1 transition-colors">
                      <ReplyAll className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsComposeOpen(true)} title="Reencaminhar" className="hover:text-[#1A73E8] flex items-center gap-1 transition-colors">
                      <Forward className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-[#E5E7EB] dark:bg-white/10 mx-1"></div>
                    <button onClick={(e) => toggleStar(selectedEmail.id, e)} title="Com estrela" className="hover:text-amber-400 transition-colors">
                      <Star className={`w-4 h-4 ${starredIds.has(selectedEmail.id) ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                    <button onClick={handleDeleteEmail} title="Lixo" className="hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button title="Spam" className="hover:text-amber-500 transition-colors">
                      <Ban className="w-4 h-4" />
                    </button>
                    <button title="Código fonte" className="hover:text-[#1A73E8] transition-colors">
                      <Code2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Email Content Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-4xl">
                  
                  {/* Subject Header */}
                  <h1 className={`text-xl font-bold tracking-tight leading-snug ${isLight ? 'text-[#202124]' : 'text-white'}`}>
                    {selectedEmail.subject || '(Sem assunto)'}
                  </h1>

                  {/* Sender Header Card with Real Company Favicon / Google Monogram */}
                  <div className="flex items-center justify-between border-b pb-4 border-[#E5E7EB] dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-full overflow-hidden border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                        visualSender.logoUrl ? 'bg-white' : `${visualSender.bgClass} ${visualSender.textClass}`
                      }`}>
                        {visualSender.logoUrl ? (
                          <img 
                            src={visualSender.logoUrl} 
                            alt="" 
                            className="w-6 h-6 object-contain" 
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span>{visualSender.initial}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${isLight ? 'text-[#202124]' : 'text-white'}`}>
                            {parsedSender.name}
                          </span>
                          <span className="text-xs text-zinc-400 font-normal">
                            &lt;{parsedSender.email || selectedEmail.from}&gt;
                          </span>
                        </div>
                        <span className="text-xs text-zinc-400">
                          Para: &lt;{selectedEmail.to}&gt;
                        </span>
                      </div>
                    </div>

                    <span className="text-xs text-zinc-400 font-mono">
                      {new Date(selectedEmail.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })} às {new Date(selectedEmail.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Body Content */}
                  {selectedEmail.html ? (
                    <div 
                      className="email-rich-html text-[15px] leading-relaxed text-[#202124] dark:text-[#E8EAED]"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                    />
                  ) : (
                    <div className={`text-[15px] leading-relaxed space-y-4 font-normal ${
                      isLight ? 'text-[#202124]' : 'text-[#E8EAED]'
                    }`}>
                      {/* Thread Format */}
                      {selectedEmail.body.includes("----\nOn ") ? (
                        <div className="space-y-6">
                          <div className="space-y-3">
                            {renderParagraphsWithActionButtons(selectedEmail.body.split("----\nOn ")[0])}
                          </div>

                          <div className="pt-4 border-t border-[#E5E7EB] dark:border-white/10 space-y-3">
                            <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-semibold mb-2">
                              <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center font-bold text-[10px] overflow-hidden">
                                {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : "E"}
                              </div>
                              <span>edson &lt;edson@rapimoneyit.online&gt; escreveu:</span>
                            </div>
                            <div className="pl-4 border-l-2 border-[#CBD5E1] dark:border-zinc-700 text-[#5F6368] dark:text-zinc-400 text-sm whitespace-pre-line leading-relaxed">
                              {renderParagraphsWithActionButtons(selectedEmail.body.split("----\nOn ")[1])}
                            </div>
                          </div>
                        </div>
                      ) : (
                        renderParagraphsWithActionButtons(selectedEmail.body)
                      )}
                    </div>
                  )}

                  {/* Bottom Action Buttons */}
                  <div className="pt-6 border-t border-[#E5E7EB] dark:border-white/10 flex items-center gap-4 text-xs font-semibold text-[#1A73E8]">
                    <button onClick={() => setIsComposeOpen(true)} className="flex items-center gap-1.5 hover:underline">
                      <Reply className="w-4 h-4" />
                      <span>Responder</span>
                    </button>
                    <button onClick={() => setIsComposeOpen(true)} className="flex items-center gap-1.5 hover:underline">
                      <ReplyAll className="w-4 h-4" />
                      <span>Responder a todos</span>
                    </button>
                    <button onClick={() => setIsComposeOpen(true)} className="flex items-center gap-1.5 hover:underline">
                      <Forward className="w-4 h-4" />
                      <span>Reencaminhar</span>
                    </button>
                  </div>

                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-400 text-xs">
                Selecione uma mensagem para ler.
              </div>
            )}
          </main>

        </div>
      )}

      {/* Modais */}
      {isComposeOpen && (
        <ComposeModal 
          isOpen={isComposeOpen} 
          onClose={() => setIsComposeOpen(false)} 
          userEmail={user.email} 
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
