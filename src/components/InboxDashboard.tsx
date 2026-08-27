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

  if (clean.includes("termii.com")) {
    return { 
      logoUrl: "https://www.google.com/s2/favicons?domain=termii.com&sz=128", 
      companyName: "Termii", 
      color: "from-emerald-600 to-teal-800" 
    };
  }
  if (clean.includes("currencycloud.com")) {
    return { 
      logoUrl: "https://www.google.com/s2/favicons?domain=currencycloud.com&sz=128", 
      companyName: "Currencycloud | Visa", 
      color: "from-blue-600 to-indigo-900" 
    };
  }
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
      companyName: "Crassula", 
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
  if (clean.includes("linkedin.com")) {
    return { 
      logoUrl: "https://www.google.com/s2/favicons?domain=linkedin.com&sz=128", 
      companyName: "LinkedIn", 
      color: "from-[#0A66C2] to-[#004182]" 
    };
  }
  if (clean.includes("apple.com")) {
    return { 
      logoUrl: "https://www.google.com/s2/favicons?domain=apple.com&sz=128", 
      companyName: "Apple", 
      color: "from-zinc-800 to-black" 
    };
  }
  if (clean.includes("impact.com")) {
    return { 
      logoUrl: "https://www.google.com/s2/favicons?domain=impact.com&sz=128", 
      companyName: "Impact.com", 
      color: "from-purple-600 to-indigo-900" 
    };
  }

  return { companyName: "Business Contact", color: "from-blue-600 to-indigo-800" };
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

  // Carregar Avatar Real
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
  const companyInfo = selectedEmail ? getCompanyInfo(selectedEmail.from) : { companyName: "", color: "from-blue-600 to-indigo-800" };

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

      {/* TOP EXECUTIVE HEADER (Clean Enterprise Standard) */}
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

          {/* Apps Switcher (Correio, Calendário, Contactos) */}
          <div className={`flex items-center p-0.5 rounded-lg border ${
            isLight ? 'bg-[#F1F3F4] border-[#E5E7EB]' : 'bg-white/5 border-white/10'
          }`}>
            <button
              onClick={() => setActiveTab('mail')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'mail'
                  ? 'bg-[#1A73E8] text-white shadow-sm'
                  : isLight ? 'text-[#5F6368] hover:text-[#202124]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Correio</span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'calendar'
                  ? 'bg-[#1A73E8] text-white shadow-sm'
                  : isLight ? 'text-[#5F6368] hover:text-[#202124]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendário</span>
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'contacts'
                  ? 'bg-[#1A73E8] text-white shadow-sm'
                  : isLight ? 'text-[#5F6368] hover:text-[#202124]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Contactos</span>
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
              placeholder="Pesquisar correio por remetente, assunto ou texto..."
              className={`w-full text-xs pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#1A73E8] transition-all ${
                isLight 
                  ? 'bg-[#F1F3F4] border-transparent focus:bg-white focus:border-[#1A73E8] text-[#202124] placeholder-[#5F6368]' 
                  : 'bg-white/5 border-white/10 text-white placeholder-zinc-500'
              }`}
            />
          </div>
        </div>

        {/* Right Tools: Refresh, Theme Switcher, Settings, Profile */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={handleManualRefresh}
            title="Atualizar emails"
            className={`p-2 rounded-lg transition-colors ${
              isLight ? 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4]' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#1A73E8]' : ''}`} />
          </button>

          <button 
            onClick={toggleTheme}
            title={isLight ? "Ativar Modo Escuro" : "Ativar Modo Claro"}
            className={`p-2 rounded-lg transition-colors ${
              isLight ? 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4]' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          <Link
            href="/settings"
            title="Definições"
            className={`p-2 rounded-lg transition-colors ${
              isLight ? 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4]' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4" />
          </Link>

          {/* User Profile Avatar */}
          <Link href="/settings" className="relative ml-1 block">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#E5E7EB] dark:border-white/10 bg-[#1A73E8] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user.initials}</span>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#07090E]"></div>
          </Link>
        </div>
      </header>

      {/* VIEW: CALENDAR */}
      {activeTab === 'calendar' && (
        <main className="flex-1 overflow-y-auto">
          <CalendarView userEmail={user.email} />
        </main>
      )}

      {/* VIEW: CONTACTS */}
      {activeTab === 'contacts' && (
        <main className="flex-1 overflow-y-auto">
          <ContactsView userEmail={user.email} />
        </main>
      )}

      {/* VIEW: MAIL (3-Column Workspace) */}
      {activeTab === 'mail' && (
        <div className="flex-1 flex overflow-hidden">
          
          {/* COLUMN 1: LEFT SIDEBAR (Folders & Storage) */}
          <aside className={`w-[220px] border-r flex flex-col flex-shrink-0 transition-colors ${
            isLight ? 'bg-[#FFFFFF] border-[#E5E7EB]' : 'bg-[#07090E] border-white/[0.08]'
          }`}>
            
            {/* "Escrever" Button (Clean Royal Blue Pill) */}
            <div className="p-3.5">
              <button 
                onClick={() => setIsComposeOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-[#1A73E8] hover:bg-[#1557B0] active:scale-[0.98] text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-sm transition-all"
              >
                <Edit3 className="w-4 h-4" />
                <span>Escrever</span>
              </button>
            </div>

            {/* Folders Navigation */}
            <nav className="flex-1 px-2.5 py-1 space-y-0.5 overflow-y-auto">
              {folders.map(folder => {
                const Icon = folder.icon;
                const isActive = selectedFolder === folder.id;
                return (
                  <button
                    key={folder.id}
                    onClick={() => handleSelectFolder(folder.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
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
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-[#1A73E8] text-white' : isLight ? 'bg-[#E8EAED] text-[#202124]' : 'bg-white/10 text-zinc-300'
                      }`}>
                        {folder.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Storage Meter (Private Email Style) */}
            <div className={`p-3.5 border-t text-xs ${isLight ? 'border-[#E5E7EB] bg-[#F8F9FA]' : 'border-white/[0.08] bg-black/20'}`}>
              <div className="flex items-center justify-between mb-1 text-[11px] font-semibold text-zinc-500">
                <span>Armazenamento</span>
                <span>0.1%</span>
              </div>
              <div className="w-full h-1.5 bg-[#E5E7EB] dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#1A73E8] rounded-full w-[2%]"></div>
              </div>
              <span className="text-[10px] text-zinc-400 block mt-1">107.2 KB de 10 GB utilizados</span>
            </div>

            {/* User Profile Footer */}
            <UserProfileFooter user={user} userDomain={userDomain} />
          </aside>

          {/* COLUMN 2: EMAIL LIST (Flat Clean Dividers like Private Email) */}
          <section className={`w-[340px] md:w-[380px] border-r flex flex-col flex-shrink-0 transition-colors ${
            isLight ? 'bg-[#FFFFFF] border-[#E5E7EB]' : 'bg-[#0A0D14] border-white/[0.08]'
          }`}>
            
            {/* Header */}
            <div className={`h-11 px-4 border-b flex items-center justify-between text-xs font-semibold ${
              isLight ? 'border-[#E5E7EB] text-[#5F6368] bg-[#FAFAFA]' : 'border-white/[0.08] text-zinc-400 bg-white/[0.02]'
            }`}>
              <div className="flex items-center gap-2">
                <span>{folders.find(f => f.id === selectedFolder)?.label}</span>
                <span className="text-[11px] text-zinc-400">({filteredEmails.length})</span>
              </div>
              <span className="text-[11px]">Mais recentes</span>
            </div>

            {/* List */}
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
                  const company = getCompanyInfo(isSent ? email.to : email.from);
                  const dateDisplay = formatEmailDate(email.createdAt);

                  return (
                    <div
                      key={email.id}
                      onClick={() => handleSelectEmail(email.id)}
                      className={`group relative p-3.5 transition-colors cursor-pointer ${
                        isSelected 
                          ? isLight ? 'bg-[#E8F0FE]' : 'bg-white/10'
                          : isLight ? 'bg-[#FFFFFF] hover:bg-[#F8F9FA]' : 'bg-transparent hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Active Left Indicator */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1A73E8]"></div>
                      )}

                      <div className="flex items-start gap-3">
                        {/* Avatar / Favicon */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 overflow-hidden shadow-xs ${
                          company.logoUrl ? 'bg-white border border-[#E5E7EB]' : 'bg-[#1A73E8]'
                        }`}>
                          {company.logoUrl ? (
                            <img src={company.logoUrl} alt="" className="w-4 h-4 object-contain" />
                          ) : (
                            <span>{senderInfo.initial}</span>
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

          {/* COLUMN 3: EMAIL READER PANE (Pure Clean Reading Experience) */}
          <main className={`flex-1 flex flex-col overflow-hidden transition-colors ${
            isLight ? 'bg-[#FFFFFF]' : 'bg-[#07090E]'
          }`}>
            {selectedEmail ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Action Bar */}
                <div className={`h-11 px-6 border-b flex items-center justify-between text-xs shrink-0 ${
                  isLight ? 'border-[#E5E7EB] bg-[#FAFAFA]' : 'border-white/[0.08] bg-white/[0.02]'
                }`}>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsComposeOpen(true)}
                      className={`px-3 py-1 rounded-md border flex items-center gap-1.5 font-medium transition-all ${
                        isLight ? 'bg-white border-[#E5E7EB] text-[#202124] hover:bg-[#F1F3F4]' : 'bg-white/5 border-white/10 text-white'
                      }`}
                    >
                      <CornerUpLeft className="w-3.5 h-3.5" />
                      <span>Responder</span>
                    </button>
                    <button 
                      onClick={() => setIsComposeOpen(true)}
                      className={`px-3 py-1 rounded-md border flex items-center gap-1.5 font-medium transition-all ${
                        isLight ? 'bg-white border-[#E5E7EB] text-[#202124] hover:bg-[#F1F3F4]' : 'bg-white/5 border-white/10 text-white'
                      }`}
                    >
                      <CornerUpRight className="w-3.5 h-3.5" />
                      <span>Encaminhar</span>
                    </button>
                    <button 
                      onClick={handleDeleteEmail}
                      className={`p-1.5 rounded-md border text-zinc-400 hover:text-red-500 transition-all ${
                        isLight ? 'bg-white border-[#E5E7EB] hover:bg-red-50' : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {new Date(selectedEmail.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })} às {new Date(selectedEmail.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Email Content Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-4xl">
                  
                  {/* Subject */}
                  <h1 className={`text-xl font-bold tracking-tight leading-snug ${isLight ? 'text-[#202124]' : 'text-white'}`}>
                    {selectedEmail.subject || '(Sem assunto)'}
                  </h1>

                  {/* Sender Row */}
                  <div className="flex items-center justify-between border-b pb-4 border-[#E5E7EB] dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1A73E8] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                        {parsedSender.name.charAt(0) || "U"}
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
                          para <strong className={isLight ? 'text-[#202124]' : 'text-white'}>Edson</strong> &lt;{selectedEmail.to}&gt;
                        </span>
                      </div>
                    </div>
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
                      {/* LinkedIn Card if applicable */}
                      {(selectedEmail.body.includes("Aceitar:") || selectedEmail.body.includes("Ver perfil:") || selectedEmail.body.includes("aguarda sua resposta")) ? (
                        <div className={`p-6 rounded-xl border ${
                          isLight ? 'bg-[#FAFAFA] border-[#E5E7EB]' : 'bg-white/5 border-white/10'
                        }`}>
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#0A66C2] text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                              {parsedSender.name.charAt(0)}
                            </div>
                            <div className="flex-1 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <h3 className={`font-bold text-base ${isLight ? 'text-[#202124]' : 'text-white'}`}>
                                  {parsedSender.name}
                                </h3>
                                <span className="text-[10px] bg-[#0A66C2]/10 text-[#0A66C2] font-bold px-2 py-0.5 rounded-full border border-[#0A66C2]/20">
                                  LinkedIn
                                </span>
                              </div>
                              <p className={`text-sm leading-relaxed ${isLight ? 'text-[#3C4043]' : 'text-zinc-300'}`}>
                                {selectedEmail.body
                                  .split(/Aceitar:|Ver perfil:|Ver todas as conexões/i)[0]
                                  .replace(/Olá[^\n]*\n+/gi, '')
                                  .replace(/^[^\n]*aguarda sua resposta[^\n]*/gi, '')
                                  .replace(/https?:\/\/[^\s]+/g, '')
                                  .replace(/sharedKey=[^\s]+/g, '')
                                  .replace(/invitationId=[^\s]+/g, '')
                                  .trim() || "Gostaria de se conectar com você no LinkedIn."}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 pt-4 border-t border-[#E5E7EB] dark:border-white/10 flex flex-wrap items-center gap-3">
                            {selectedEmail.body.match(/(?:Aceitar:\s*|invite-accept[^\s]*\s*)(https:\/\/[^\s]+)/i) && (
                              <a
                                href={selectedEmail.body.match(/(?:Aceitar:\s*|invite-accept[^\s]*\s*)(https:\/\/[^\s]+)/i)?.[1]}
                                target="_blank"
                                rel="noreferrer"
                                className="px-5 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-xs rounded-lg shadow-sm transition-all"
                              >
                                ✓ Aceitar Conexão
                              </a>
                            )}
                            {selectedEmail.body.match(/(?:Ver perfil:\s*|in\/[^\s]*\s*)(https:\/\/[^\s]+)/i) && (
                              <a
                                href={selectedEmail.body.match(/(?:Ver perfil:\s*|in\/[^\s]*\s*)(https:\/\/[^\s]+)/i)?.[1]}
                                target="_blank"
                                rel="noreferrer"
                                className={`px-4 py-2 rounded-lg border text-xs font-semibold transition-all ${
                                  isLight ? 'bg-white border-[#E5E7EB] text-[#202124] hover:bg-[#F1F3F4]' : 'bg-white/5 border-white/10 text-white'
                                }`}
                              >
                                👤 Ver Perfil no LinkedIn
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Standard Clean Email Paragraphs */
                        selectedEmail.body.split('\n\n').map((para, idx) => {
                          // Se for uma citação de resposta (On ..., wrote:)
                          if (para.includes("wrote:") || para.includes("escreveu:") || para.startsWith("----")) {
                            return (
                              <div key={idx} className="pl-4 border-l-2 border-[#CBD5E1] dark:border-zinc-700 text-[#5F6368] dark:text-zinc-400 text-sm italic my-3 whitespace-pre-line">
                                {para}
                              </div>
                            );
                          }

                          return (
                            <p key={idx} className="whitespace-pre-line leading-relaxed">
                              {para}
                            </p>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Inline Quick Reply */}
                  <div className={`mt-10 pt-6 border-t ${isLight ? 'border-[#E5E7EB]' : 'border-white/10'}`}>
                    <div className={`border rounded-xl p-4 shadow-sm ${
                      isLight ? 'bg-[#FAFAFA] border-[#E5E7EB]' : 'bg-white/5 border-white/10'
                    }`}>
                      <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#5F6368] dark:text-zinc-400">
                        <CornerUpLeft className="w-3.5 h-3.5 text-[#1A73E8]" />
                        <span>Responder a {parsedSender.name}</span>
                      </div>
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Escreva aqui a sua resposta..."
                        rows={3}
                        className={`w-full bg-transparent text-sm focus:outline-none resize-none ${
                          isLight ? 'text-[#202124] placeholder-zinc-400' : 'text-white placeholder-zinc-500'
                        }`}
                      />
                      <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] dark:border-white/10 mt-2">
                        <div className="text-zinc-400 text-xs">
                          Pressione Enviar para responder via <span className="font-semibold text-[#1A73E8]">edson@rapimoneyit.online</span>
                        </div>
                        <button
                          onClick={() => {
                            if (!replyText.trim()) return;
                            setToastMessage("Resposta enviada com sucesso!");
                            setReplyText("");
                            setTimeout(() => setToastMessage(null), 3000);
                          }}
                          className="px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                        >
                          Enviar Resposta
                        </button>
                      </div>
                    </div>
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
          userName={user.name} 
        />
      )}

      {isSiteBuilderOpen && (
        <RapiSiteBuilderModal 
          isOpen={isSiteBuilderOpen} 
          onClose={() => setIsSiteBuilderOpen(false)} 
          domainName={userDomain} 
        />
      )}

    </div>
  );
}
