"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  Inbox, Star, Send, FileText, Search, Bell, Clock, Trash2, 
  Archive, AlertOctagon, Mail, Calendar, Users, Settings, 
  RefreshCw, CornerUpLeft, CornerUpRight, MoreHorizontal,
  HardDrive, Globe, CheckCircle2, ChevronDown, Paperclip,
  Check, CheckCheck, Edit3, X, Eye, Sparkles, ShieldCheck,
  Zap, ArrowUpRight, Languages, Building2, Moon, Sun
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

// Obter Logótipo Real da Empresa e Domínio
function getCompanyInfo(emailOrFrom: string): { logoUrl?: string; companyName: string; color: string } {
  const clean = (emailOrFrom || "").toLowerCase();

  if (clean.includes("stripe.com")) {
    return { 
      logoUrl: "https://www.google.com/s2/favicons?domain=stripe.com&sz=128", 
      companyName: "Stripe", 
      color: "from-[#635BFF] to-[#0A2540]" 
    };
  }
  if (clean.includes("crassula.io")) {
    return { 
      logoUrl: "https://www.google.com/s2/favicons?domain=crassula.io&sz=128", 
      companyName: "Crassula Core Banking", 
      color: "from-[#00E599] to-[#0B1528]" 
    };
  }
  if (clean.includes("bel.money")) {
    return { 
      logoUrl: "https://www.google.com/s2/favicons?domain=bel.money&sz=128", 
      companyName: "Belmoney Financial", 
      color: "from-[#0066FF] to-[#001F5C]" 
    };
  }
  if (clean.includes("moorwand.com")) {
    return { 
      logoUrl: "https://www.google.com/s2/favicons?domain=moorwand.com&sz=128", 
      companyName: "Moorwand Cards", 
      color: "from-[#0A0E2A] to-[#1E3A8A]" 
    };
  }
  if (clean.includes("rapiemail.online") || clean.includes("rapimoneyit.online")) {
    return { 
      companyName: "RapiMoney IT", 
      color: "from-indigo-600 to-purple-600" 
    };
  }
  if (clean.includes("linkedin.com")) {
    return { 
      logoUrl: "https://www.google.com/s2/favicons?domain=linkedin.com&sz=128", 
      companyName: "LinkedIn", 
      color: "from-[#0A66C2] to-[#004182]" 
    };
  }
  if (clean.includes("gmail.com") || clean.includes("google.com")) {
    return { 
      logoUrl: "https://www.google.com/s2/favicons?domain=google.com&sz=128", 
      companyName: "Google / Gmail", 
      color: "from-red-500 to-amber-500" 
    };
  }

  // Extração automática de Favicon para qualquer empresa corporativa
  const domainMatch = clean.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (domainMatch && domainMatch[1] && !domainMatch[1].includes("localhost")) {
    const dom = domainMatch[1];
    return {
      logoUrl: `https://www.google.com/s2/favicons?domain=${dom}&sz=128`,
      companyName: dom.split('.')[0].toUpperCase(),
      color: "from-indigo-700 to-zinc-900"
    };
  }

  return { companyName: "Empresa", color: "from-zinc-700 to-zinc-900" };
}

export function InboxDashboard({ user, initialEmails, currentFolder: initialFolder }: Props) {
  const [activeTab, setActiveTab] = useState<'mail' | 'calendar' | 'contacts'>('mail');
  const [selectedFolder, setSelectedFolder] = useState<string>(initialFolder || 'INBOX');
  const [emails, setEmails] = useState<EmailItem[]>(initialEmails);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(initialEmails[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSiteBuilderOpen, setIsSiteBuilderOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Estados de Tradução Automática (DeepL / Google Translate Style)
  const [translations, setTranslations] = useState<Record<string, { text: string; sourceLang: string }>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});

  // Sincronizar Tema e Foto com localStorage e Supabase
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('rapi_theme') as "dark" | "light" | null;
      if (savedTheme) {
        setTheme(savedTheme);
        if (savedTheme === 'light') {
          document.documentElement.classList.add('light');
          document.body.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
          document.body.classList.remove('light');
        }
      }

      const cachedAvatar = localStorage.getItem('rapi_avatar');
      if (cachedAvatar) setAvatarUrl(cachedAvatar);

      fetch("/api/user/avatar")
        .then(r => r.json())
        .then(d => {
          if (d.avatarUrl) {
            setAvatarUrl(d.avatarUrl);
            localStorage.setItem('rapi_avatar', d.avatarUrl);
          }
        })
        .catch(() => {});
    } catch (e) {}
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('rapi_theme', nextTheme);
      if (nextTheme === 'light') {
        document.documentElement.classList.add('light');
        document.body.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.body.classList.remove('light');
      }
    } catch (e) {}
  };

  const isLight = theme === 'light';

  // Dynamic domain of user
  const userDomain = user.email.includes('@') ? user.email.split('@')[1] : 'rapiemail.online';

  // Fetch emails from Supabase
  const refreshEmails = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/emails/check");
      if (res.ok) {
        const data = await res.json();
        if (data.emails && Array.isArray(data.emails)) {
          setEmails(data.emails);
        }
      }
    } catch (err) {
      // Polling silencioso
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Polling automático suave a cada 6 segundos para verificar a chegada de e-mails em tempo real
  useEffect(() => {
    const interval = setInterval(refreshEmails, 6000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic real storage calculation
  const totalBytes = useMemo(() => {
    const emailBytes = emails.reduce((sum, e) => sum + (e.body?.length || 0) + (e.subject?.length || 0) + 2048, 0);
    return Math.max(15360, emailBytes); // At least ~15 KB
  }, [emails]);

  const formattedStorage = useMemo(() => {
    if (totalBytes < 1024 * 1024) {
      return `${(totalBytes / 1024).toFixed(1)} KB`;
    }
    return `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
  }, [totalBytes]);

  const storagePercent = useMemo(() => {
    const maxBytes = 10 * 1024 * 1024 * 1024; // 10 GB
    const pct = (totalBytes / maxBytes) * 100;
    return pct < 0.01 ? "0.01%" : `${pct.toFixed(2)}%`;
  }, [totalBytes]);

  // Filter emails by search query and folder
  const filteredEmails = useMemo(() => {
    return emails.filter(e => {
      const matchesSearch = 
        e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.body.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (selectedFolder === 'STARRED') {
        return starredIds.has(e.id);
      }
      return e.folder === selectedFolder;
    });
  }, [emails, searchQuery, selectedFolder, starredIds]);

  const selectedEmail = useMemo(() => {
    return filteredEmails.find(e => e.id === selectedEmailId) || null;
  }, [filteredEmails, selectedEmailId]);

  const handleSelectFolder = (folderId: string) => {
    setSelectedFolder(folderId);
    const targetFolderEmails = emails.filter(e => {
      if (folderId === 'STARRED') return starredIds.has(e.id);
      return e.folder === folderId;
    });
    setSelectedEmailId(targetFolderEmails[0]?.id || null);
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

  const handleSelectEmail = (id: string) => {
    setSelectedEmailId(id);
    setEmails(prev => prev.map(item => item.id === id ? { ...item, read: true } : item));
  };

  const handleDeleteEmail = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEmails(prev => prev.filter(item => item.id !== id));
    if (selectedEmailId === id) {
      setSelectedEmailId(null);
    }
  };

  const handleSendReply = async () => {
    if (!replyText || !selectedEmail) return;
    setSendingReply(true);
    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedEmail.from === user.email ? selectedEmail.to : selectedEmail.from,
          subject: selectedEmail.subject.startsWith("Re:") ? selectedEmail.subject : `Re: ${selectedEmail.subject}`,
          body: replyText
        })
      });
      if (res.ok) {
        setReplySuccess(true);
        setReplyText("");
        setTimeout(() => setReplySuccess(false), 3000);
        refreshEmails();
      }
    } catch(err) {
      console.error(err);
    } finally {
      setSendingReply(false);
    }
  };

  // Detetar se o email está num idioma estrangeiro (Inglês, Francês, Espanhol, etc.)
  const { isForeignLang, detectedLanguageName } = useMemo(() => {
    if (!selectedEmail) return { isForeignLang: false, detectedLanguageName: "Inglês" };
    const b = selectedEmail.body.toLowerCase();
    
    // Francês
    if (/\b(bonjour|merci|cordialement|salutations|nous|vous|pour|avec|votre)\b/i.test(b)) {
      return { isForeignLang: true, detectedLanguageName: "Francês" };
    }
    // Espanhol
    if (/\b(hola|gracias|saludos|estimado|por favor|buenas|adjunto)\b/i.test(b)) {
      return { isForeignLang: true, detectedLanguageName: "Espanhol" };
    }
    // Inglês
    if (/\b(dear|thank you|hello|hi|please|best regards|regards|sincerely|meeting|setup|partnership|integration|proposal|agreement|pricing|follow up|schedule|review|platform|cards|processing)\b/i.test(b)) {
      return { isForeignLang: true, detectedLanguageName: "Inglês" };
    }

    return { isForeignLang: false, detectedLanguageName: "Inglês" };
  }, [selectedEmail]);

  // Função de Tradução com DeepL Neural Engine
  const handleTranslateEmail = async (emailId: string, content: string) => {
    setTranslatingId(emailId);
    try {
      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content, targetLang: "PT-PT" })
      });
      if (res.ok) {
        const data = await res.json();
        const rawLang = (data.detectedSourceLang || "EN").toUpperCase();
        const readable = rawLang.includes("EN") ? "Inglês" : (rawLang.includes("FR") ? "Francês" : (rawLang.includes("ES") ? "Espanhol" : "Inglês"));
        
        setTranslations(prev => ({
          ...prev,
          [emailId]: {
            text: data.translatedText,
            sourceLang: readable
          }
        }));
        setShowOriginalMap(prev => ({ ...prev, [emailId]: false }));
      }
    } catch(err) {
      console.error("Erro na tradução:", err);
    } finally {
      setTranslatingId(null);
    }
  };

  // Folders definition
  const folders = [
    { id: 'INBOX', label: 'Caixa de entrada', icon: Inbox, count: emails.filter(e => e.folder === 'INBOX' && !e.read).length },
    { id: 'STARRED', label: 'Com estrela', icon: Star, count: starredIds.size },
    { id: 'SENT', label: 'Enviados', icon: Send, count: emails.filter(e => e.folder === 'SENT').length },
    { id: 'DRAFTS', label: 'Rascunhos', icon: FileText, count: 0 },
    { id: 'ARCHIVE', label: 'Arquivo', icon: Archive, count: 0 },
    { id: 'SPAM', label: 'Spam', icon: AlertOctagon, count: 0 },
    { id: 'TRASH', label: 'Lixo', icon: Trash2, count: 0 },
  ];

  return (
    <div className={`flex flex-col h-screen font-sans overflow-hidden select-none transition-colors duration-300 ${
      isLight ? 'bg-[#F8F9FC] text-slate-800' : 'bg-[#06070B] text-zinc-300'
    }`}>
      
      {/* 1. TOP GLOBAL EXECUTIVE APP BAR */}
      <header className={`h-14 border-b flex items-center justify-between px-4 z-20 flex-shrink-0 backdrop-blur-2xl transition-colors ${
        isLight ? 'bg-white/85 border-slate-200 shadow-sm' : 'bg-[#0A0C13]/80 border-white/[0.07]'
      }`}>
        
        {/* Left: Brand & App Switcher */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 border border-indigo-400/30 flex items-center justify-center shadow-lg shadow-indigo-600/25">
              <span className="text-white font-black text-xs tracking-tight">RE</span>
            </div>
            <div className="hidden sm:block">
              <span className={`font-bold text-sm tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>RapiEmail</span>
              <span className="text-[10px] text-zinc-500 font-semibold block leading-none">Enterprise</span>
            </div>
          </div>

          {/* App Switcher (Mail, Calendar, Contacts) */}
          <div className={`flex items-center rounded-xl p-1 shadow-inner border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/[0.04] border-white/[0.06]'
          }`}>
            <button 
              onClick={() => setActiveTab('mail')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'mail' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Correio</span>
            </button>
            <button 
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'calendar' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendário</span>
            </button>
            <button 
              onClick={() => setActiveTab('contacts')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'contacts' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Contactos</span>
            </button>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-xl mx-6">
          <div className="relative group">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pesquisar mensagens por remetente, assunto ou texto... (Ctrl+K)" 
              className={`w-full border rounded-xl py-1.5 pl-10 pr-12 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/25 transition-all shadow-sm ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200/60 border-slate-200 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400' 
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.07] focus:border-indigo-500/50 text-white placeholder:text-zinc-500'
              }`}
            />
            <kbd className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded font-mono pointer-events-none border ${
              isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-zinc-500'
            }`}>
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Actions & Status */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={refreshEmails}
            title="Atualizar Caixa de Correio"
            className={`p-2 rounded-xl transition-all active:scale-95 ${
              isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
          </button>

          {/* Botão Rápido de Alternar Tema Claro / Escuro */}
          <button 
            onClick={toggleTheme}
            title={isLight ? "Ativar Modo Escuro" : "Ativar Modo Claro"}
            className={`p-2 rounded-xl transition-all active:scale-95 ${
              isLight ? 'text-amber-500 hover:bg-amber-50' : 'text-indigo-300 hover:text-white hover:bg-white/5'
            }`}
          >
            {isLight ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="relative">
            <button className={`p-2 rounded-xl transition-all ${
              isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}>
              <Bell className="w-4 h-4" />
            </button>
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-sm shadow-indigo-500" />
          </div>
          
          <Link href="/settings" title="Definições da Conta" className={`p-2 rounded-xl transition-all ${
            isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}>
            <Settings className="w-4 h-4" />
          </Link>
          
          <div className={`h-4 w-px mx-1 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}></div>

          <Link href="/settings" title="Abrir Perfil" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-indigo-600/20 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user.initials}</span>
              )}
            </div>
          </Link>
        </div>
      </header>

      {/* TAB 1: CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <CalendarView user={user} />
      )}

      {/* TAB 2: CONTACTS VIEW */}
      {activeTab === 'contacts' && (
        <ContactsView user={user} />
      )}

      {/* TAB 3: MAIL VIEW (3-COLUMN SPLIT WORKSPACE) */}
      {activeTab === 'mail' && (
        <div className="flex-1 flex overflow-hidden animate-fade-in">
          
          {/* COLUMN 1: LEFT SIDEBAR (Folders & Storage) */}
          <aside className={`w-[245px] border-r flex flex-col flex-shrink-0 transition-colors ${
            isLight ? 'bg-[#F8F9FC] border-slate-200/80' : 'bg-[#07090E] border-white/[0.06]'
          }`}>
            
            {/* Compose Button */}
            <div className="p-3.5">
              <button 
                onClick={() => setIsComposeOpen(true)}
                className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.98] text-white py-2.5 px-4 rounded-xl font-semibold text-xs shadow-lg shadow-indigo-600/25 border border-indigo-400/20 transition-all group"
              >
                <Edit3 className="w-4 h-4 group-hover:rotate-6 transition-transform" />
                <span>Escrever Email</span>
              </button>
            </div>

            {/* Folder Navigation */}
            <nav className="flex-1 px-2.5 py-1 space-y-1 overflow-y-auto">
              {folders.map(folder => {
                const Icon = folder.icon;
                const isActive = selectedFolder === folder.id;
                return (
                  <button
                    key={folder.id}
                    onClick={() => handleSelectFolder(folder.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive 
                        ? isLight 
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold shadow-sm' 
                          : 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/25 font-semibold shadow-sm'
                        : isLight 
                          ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' 
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : isLight ? 'text-slate-400' : 'text-zinc-500'}`} />
                      <span>{folder.label}</span>
                    </div>
                    {folder.count > 0 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-indigo-600 text-white' : isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-zinc-300'
                      }`}>
                        {folder.count}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Alojamento Web Card (Upsell & AI Site Builder) */}
              <div className={`pt-4 mt-4 border-t px-1 ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`}>
                <div className={`p-3.5 rounded-2xl border space-y-2.5 shadow-lg ${
                  isLight ? 'bg-gradient-to-b from-indigo-50 to-white border-indigo-200 shadow-indigo-100/50' : 'bg-gradient-to-b from-indigo-950/40 via-purple-950/20 to-black/40 border-indigo-500/20 shadow-black/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      <Globe className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Criador de Site IA</span>
                    </div>
                    <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-600 border border-indigo-500/30 px-1.5 py-0.5 rounded-md">88€/ano</span>
                  </div>
                  <p className={`text-[11px] leading-snug ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                    Crie o site completo da sua loja em 10 segundos com a RapiAI no domínio <span className={isLight ? 'text-slate-900 font-bold' : 'text-zinc-200 font-medium'}>{userDomain}</span>.
                  </p>
                  <button 
                    onClick={() => setIsSiteBuilderOpen(true)}
                    className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-[11px] rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                    <span>Criar Site com IA</span>
                  </button>
                </div>
              </div>
            </nav>

            {/* Storage Meter (Real Dynamic Storage) */}
            <div className={`p-3.5 border-t ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#06070B] border-white/[0.06]'}`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className={`flex items-center gap-1.5 font-medium ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                    <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
                    Armazenamento
                  </span>
                  <span className={`font-mono text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>{storagePercent}</span>
                </div>
                
                {/* Progress bar */}
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/5'}`}>
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, parseFloat(storagePercent))}%` }}
                  />
                </div>
                
                <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                  <strong className={isLight ? 'text-slate-800 font-bold' : 'text-zinc-300 font-medium'}>{formattedStorage}</strong> de 10 GB utilizados
                </p>
              </div>
            </div>

            {/* User Profile Footer */}
            <div className={`p-2.5 border-t ${isLight ? 'border-slate-200 bg-white' : 'border-white/[0.06]'}`}>
              <UserProfileFooter initials={user.initials} name={user.name} email={user.email} />
            </div>
          </aside>

          {/* COLUMN 2: MIDDLE EMAIL LIST PANE */}
          <section className={`w-[390px] border-r flex flex-col flex-shrink-0 transition-colors ${
            isLight ? 'bg-[#FFFFFF] border-slate-200/80' : 'bg-[#07090E] border-white/[0.06]'
          }`}>
            
            {/* List Header */}
            <div className={`h-12 border-b px-4 flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0C13]/50 border-white/[0.06]'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {folders.find(f => f.id === selectedFolder)?.label || selectedFolder}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">({filteredEmails.length})</span>
              </div>
              
              <div className="flex items-center gap-1 text-zinc-500 text-xs">
                <span>Mais recentes</span>
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>

            {/* Email Scroll List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
              {filteredEmails.length === 0 ? (
                <div className="text-center py-24 px-4 animate-fade-in">
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-3.5 shadow-inner ${
                    isLight ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white/[0.02] border-white/[0.06] text-zinc-600'
                  }`}>
                    <Inbox className="w-6 h-6" />
                  </div>
                  <h4 className={`text-sm font-semibold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Sem mensagens</h4>
                  <p className="text-xs text-zinc-500">Esta pasta está limpa e vazia.</p>
                </div>
              ) : (
                filteredEmails.map(email => {
                  const isSelected = selectedEmailId === email.id;
                  const isStarred = starredIds.has(email.id);
                  const isSent = email.folder === 'SENT' || email.from === user.email;
                  
                  const senderInfo = isSent 
                    ? parseSender(email.to)
                    : parseSender(email.from);
                  
                  const company = getCompanyInfo(isSent ? email.to : email.from);
                  
                  const d = new Date(email.createdAt);
                  const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

                  return (
                    <div
                      key={email.id}
                      onClick={() => handleSelectEmail(email.id)}
                      className={`group relative p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-[0.985] ${
                        isSelected 
                          ? isLight 
                            ? 'bg-indigo-50/80 border-indigo-300 shadow-md shadow-indigo-100/50' 
                            : 'bg-indigo-600/15 border-indigo-500/40 shadow-lg shadow-black/50'
                          : isLight 
                            ? 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300 hover:translate-x-0.5' 
                            : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 hover:translate-x-0.5'
                      }`}
                    >
                      {/* Unread dot */}
                      {!email.read && !isSent && (
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500 shadow-md shadow-indigo-500 animate-pulse"></div>
                      )}

                      <div className="flex items-start gap-3">
                        {/* Company Logo or Sender Avatar */}
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${company.color} border border-white/10 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 mt-0.5 shadow-sm overflow-hidden`}>
                          {isSent && avatarUrl ? (
                            <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                          ) : company.logoUrl ? (
                            <img 
                              src={company.logoUrl} 
                              alt={company.companyName} 
                              className="w-5 h-5 object-contain rounded-md"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span>{senderInfo.initial}</span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-xs truncate ${!email.read && !isSent ? 'font-bold text-indigo-600 dark:text-white' : isLight ? 'font-medium text-slate-800' : 'font-medium text-zinc-300'}`}>
                              {isSent ? `Para: ${senderInfo.name}` : senderInfo.name}
                            </span>
                            <span suppressHydrationWarning className="text-[10px] text-zinc-500 font-mono flex-shrink-0 ml-2">
                              {time}
                            </span>
                          </div>

                          <p className={`text-xs truncate mb-1 ${!email.read && !isSent ? 'font-semibold text-indigo-600 dark:text-indigo-300' : isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                            {email.subject || '(Sem assunto)'}
                          </p>

                          <p className="text-[11px] text-zinc-500 truncate leading-snug">
                            {email.body}
                          </p>

                          {/* Email Tracking Double Checkmark Badge for Sent Emails */}
                          {isSent && (
                            <div className="flex items-center gap-1.5 mt-2">
                              {email.isOpened ? (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm ${
                                  isLight ? 'text-cyan-700 bg-cyan-50 border border-cyan-200' : 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                                }`}>
                                  <CheckCheck className="w-3 h-3 text-cyan-500" />
                                  <span>Lido {email.openCount && email.openCount > 1 ? `(${email.openCount}x)` : ''}</span>
                                </span>
                              ) : (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md ${
                                  isLight ? 'text-slate-500 bg-slate-100' : 'text-zinc-500 bg-white/5'
                                }`}>
                                  <Check className="w-3 h-3 text-zinc-500" />
                                  <span>Enviado</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Quick Actions (Hover) */}
                        <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => toggleStar(email.id, e)} 
                            className="text-zinc-400 hover:text-yellow-500 transition-colors p-0.5"
                          >
                            <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-yellow-400 text-yellow-400 opacity-100' : ''}`} />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteEmail(email.id, e)} 
                            className="text-zinc-400 hover:text-red-500 transition-colors p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* COLUMN 3: RIGHT SPLIT-VIEW READER PANE */}
          <main className={`flex-1 flex flex-col overflow-hidden transition-colors ${
            isLight ? 'bg-[#F8F9FC]' : 'bg-[#05060A]'
          }`}>
            
            {selectedEmail ? (
              (() => {
                const parsedSender = parseSender(selectedEmail.from);
                const parsedRecipient = parseSender(selectedEmail.to);
                const company = getCompanyInfo(selectedEmail.from);
                const isSentByMe = selectedEmail.from === user.email;

                return (
                  <div key={selectedEmail.id} className="flex-1 flex flex-col overflow-hidden animate-fade-in">
                    
                    {/* Email Toolbar Actions */}
                    <div className={`h-12 border-b px-6 flex items-center justify-between backdrop-blur-md flex-shrink-0 ${
                      isLight ? 'bg-white/80 border-slate-200' : 'bg-[#0A0C13]/40 border-white/[0.06]'
                    }`}>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setReplyText(`\n\n--- Mensagem Original ---\n${selectedEmail.body}`);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                            isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200' : 'bg-white/[0.04] hover:bg-white/[0.08] text-white border-white/[0.05]'
                          }`}
                        >
                          <CornerUpLeft className="w-3.5 h-3.5" />
                          <span>Responder</span>
                        </button>
                        <button 
                          onClick={() => setIsComposeOpen(true)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                            isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200' : 'bg-white/[0.04] hover:bg-white/[0.08] text-white border-white/[0.05]'
                          }`}
                        >
                          <CornerUpRight className="w-3.5 h-3.5" />
                          <span>Encaminhar</span>
                        </button>
                        <div className={`h-4 w-px mx-1 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}></div>
                        <button 
                          onClick={() => handleDeleteEmail(selectedEmail.id)}
                          title="Mover para o Lixo"
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-white/5 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          title="Arquivar"
                          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span suppressHydrationWarning className={`font-mono ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                          {new Date(selectedEmail.createdAt).toLocaleDateString('pt-PT', { 
                            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                        <button className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-lg">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Email Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                      
                      {/* Rastreamento de Leitura Real (Apenas em Emails Enviados) */}
                      {selectedEmail.from === user.email && (
                        <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                          selectedEmail.isOpened 
                            ? isLight ? 'bg-cyan-50 border-cyan-200 text-cyan-900' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200' 
                            : isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/[0.02] border-white/10 text-zinc-300'
                        }`}>
                          <div className="flex items-center gap-3.5">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md ${
                              selectedEmail.isOpened 
                                ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30' 
                                : isLight ? 'bg-white text-slate-500 border border-slate-200' : 'bg-white/5 text-zinc-400 border border-white/10'
                            }`}>
                              {selectedEmail.isOpened ? <CheckCheck className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs">
                                  {selectedEmail.isOpened ? '✓✓ Destinatário Abriu e Leu a Mensagem' : '✓ Entregue com Sucesso (A aguardar abertura)'}
                                </span>
                                {selectedEmail.isOpened && (
                                  <span className="text-[10px] bg-cyan-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-300 px-2 py-0.5 rounded-full font-bold">
                                    {selectedEmail.openCount || 1} visualização(ões)
                                  </span>
                                )}
                              </div>
                              <p suppressHydrationWarning className="text-[11px] text-zinc-500 mt-0.5">
                                {selectedEmail.isOpened 
                                  ? `Lido às ${new Date(selectedEmail.openedAt || '').toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} • Dispositivo: ${selectedEmail.userAgent || 'Dispositivo do Destinatário'}`
                                  : 'O pixel stealth do RapiEmail notificará em tempo real quando o destinatário abrir este e-mail.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Subject Line & RapiAI Button */}
                      <div className="flex items-start justify-between gap-4">
                        <h1 className={`text-xl font-bold tracking-tight leading-snug flex-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {selectedEmail.subject || '(Sem assunto)'}
                        </h1>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/ai/generate", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ prompt: `Assunto: ${selectedEmail.subject}\nDe: ${selectedEmail.from}\n\nCorpo:\n${selectedEmail.body}`, mode: "summary" })
                              });
                              const data = await res.json();
                              alert(data.summary || "Erro ao gerar resumo com RapiAI.");
                            } catch(err) {
                              alert("Erro de rede ao comunicar com Google Gemini.");
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm flex-shrink-0 ${
                            isLight 
                              ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700' 
                              : 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border-indigo-500/30 text-indigo-300'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                          <span>Resumir com RapiAI</span>
                        </button>
                      </div>

                      {/* Sender Details Card with Authentic Company Logos or Real Avatar */}
                      <div className={`flex items-center justify-between pb-6 border-b ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${company.color} border border-white/10 flex items-center justify-center text-sm font-bold text-white shadow-lg overflow-hidden shrink-0`}>
                            {isSentByMe && avatarUrl ? (
                              <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                            ) : company.logoUrl ? (
                              <img 
                                src={company.logoUrl} 
                                alt={company.companyName} 
                                className="w-7 h-7 object-contain rounded-md"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <span>{parsedSender.initial}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {parsedSender.name}
                              </span>
                              {company.companyName && (
                                <span className={`text-[10px] border px-2 py-0.5 rounded-md font-semibold ${
                                  isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-zinc-300'
                                }`}>
                                  {company.companyName}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                              <span>&lt;{parsedSender.email}&gt;</span>
                              <span className="text-zinc-400">•</span>
                              <span>para <strong className={isLight ? 'text-slate-700 font-semibold' : 'text-zinc-400 font-medium'}>{parsedRecipient.name}</strong> &lt;{parsedRecipient.email}&gt;</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => toggleStar(selectedEmail.id, e)}
                            className="p-2 text-zinc-400 hover:text-yellow-500 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                          >
                            <Star className={`w-4 h-4 ${starredIds.has(selectedEmail.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* 🌐 Google Translate / DeepL Neural AI Banner */}
                      {isForeignLang && (
                        <div className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-fade-in ${
                          isLight 
                            ? 'bg-gradient-to-r from-indigo-50 via-purple-50 to-white border-indigo-200 shadow-indigo-100/60' 
                            : 'bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-black/40 border-indigo-500/25 shadow-black/30'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0 shadow-sm">
                              <Languages className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                  {translations[selectedEmail.id] && !showOriginalMap[selectedEmail.id] 
                                    ? `Traduzido: ${translations[selectedEmail.id].sourceLang} → Português`
                                    : `Mensagem em ${detectedLanguageName}`}
                                </span>
                                <span className="text-[10px] bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-md font-semibold">DeepL AI</span>
                              </div>
                              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                                {translations[selectedEmail.id] && !showOriginalMap[selectedEmail.id]
                                  ? "Tradução neural oficial ativa com preservação da estrutura e tom comercial."
                                  : "Deseja traduzir esta mensagem para português?"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            {translations[selectedEmail.id] ? (
                              showOriginalMap[selectedEmail.id] ? (
                                <button
                                  onClick={() => setShowOriginalMap(prev => ({ ...prev, [selectedEmail.id]: false }))}
                                  className="text-xs font-bold text-white px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition-all active:scale-95"
                                >
                                  <Languages className="w-3.5 h-3.5" />
                                  <span>Ver Tradução</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setShowOriginalMap(prev => ({ ...prev, [selectedEmail.id]: true }))}
                                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${
                                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200' : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                                  }`}
                                >
                                  Mostrar original
                                </button>
                              )
                            ) : (
                              <button
                                onClick={() => handleTranslateEmail(selectedEmail.id, selectedEmail.body)}
                                disabled={translatingId === selectedEmail.id}
                                className="text-xs font-bold text-white px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95"
                              >
                                <Languages className="w-3.5 h-3.5" />
                                <span>{translatingId === selectedEmail.id ? "A traduzir..." : "Traduzir para Português"}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Body Content (Shows translated or original rich HTML / text smoothly) */}
                      {translations[selectedEmail.id] && !showOriginalMap[selectedEmail.id] ? (
                        <div className={`text-sm leading-relaxed space-y-4 whitespace-pre-wrap font-normal max-w-3xl animate-fade-in ${
                          isLight ? 'text-slate-800' : 'text-zinc-200'
                        }`}>
                          {translations[selectedEmail.id].text}
                        </div>
                      ) : selectedEmail.html ? (
                        <div 
                          className={`email-rich-html text-sm leading-relaxed max-w-3xl rounded-2xl p-4 border overflow-x-auto animate-fade-in ${
                            isLight ? 'bg-white border-slate-200/80 text-slate-900 shadow-sm' : 'bg-[#0a0c13] border-white/5 text-zinc-100'
                          }`}
                          dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                        />
                      ) : (
                        <div className={`text-sm leading-relaxed space-y-4 whitespace-pre-wrap font-normal max-w-3xl animate-fade-in ${
                          isLight ? 'text-slate-800' : 'text-zinc-200'
                        }`}>
                          {selectedEmail.body}
                        </div>
                      )}

                      {/* Inline Quick Reply Box */}
                      <div className={`mt-12 pt-6 border-t max-w-3xl ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`}>
                        <div className={`border rounded-2xl p-4 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/25 transition-all space-y-3 shadow-2xl ${
                          isLight ? 'bg-white border-slate-200' : 'bg-[#0A0C13] border-white/[0.08]'
                        }`}>
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span className={`flex items-center gap-1.5 font-semibold ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>
                              <CornerUpLeft className="w-3.5 h-3.5 text-indigo-500" />
                              Responder a {parsedSender.name}
                            </span>
                          </div>

                          <textarea
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder="Escreva aqui a sua resposta rápida..."
                            rows={3}
                            className={`w-full bg-transparent text-sm focus:outline-none resize-none ${
                              isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-zinc-600'
                            }`}
                          />

                          <div className={`flex items-center justify-between pt-2 border-t ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`}>
                            <div className="flex items-center gap-2">
                              <button className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-lg transition-colors">
                                <Paperclip className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center gap-3">
                              {replySuccess && (
                                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Resposta enviada com sucesso!
                                </span>
                              )}
                              <button
                                onClick={handleSendReply}
                                disabled={!replyText || sendingReply}
                                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/25 active:scale-95"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>{sendingReply ? 'A enviar...' : 'Enviar Resposta'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>
                );
              })()
            ) : (
              // Luxury Empty State
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="relative mb-6">
                  <div className={`w-20 h-20 rounded-3xl border flex items-center justify-center shadow-2xl ${
                    isLight ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white/[0.02] border-white/[0.06] text-zinc-600'
                  }`}>
                    <Mail className="w-9 h-9 text-zinc-500" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500" />
                  </div>
                </div>

                <h3 className={`text-base font-bold mb-1.5 tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Nenhum email selecionado
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm leading-relaxed mb-6">
                  Selecione uma mensagem da lista ao lado para ler o conteúdo completo, ou clique no botão para compor um novo email.
                </p>

                <button 
                  onClick={() => setIsComposeOpen(true)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border shadow-md active:scale-95 ${
                    isLight ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-slate-200/50' : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border-white/[0.08] shadow-black/40'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Nova Mensagem</span>
                </button>
              </div>
            )}

          </main>

        </div>
      )}

      {/* Floating Compose Modal */}
      <ComposeModal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} userEmail={user.email} />

      {/* RapiSite AI Website Builder & DigitalOcean Hosting Modal */}
      <RapiSiteBuilderModal isOpen={isSiteBuilderOpen} onClose={() => setIsSiteBuilderOpen(false)} userDomain={userDomain} />

    </div>
  );
}
