"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Inbox, Star, Send, FileText, Search, Bell, Clock, Trash2, 
  Archive, AlertOctagon, Mail, Calendar, Users, Settings, 
  RefreshCw, CornerUpLeft, CornerUpRight, MoreHorizontal,
  HardDrive, Globe, CheckCircle2, ChevronDown, Paperclip,
  Check, CheckCheck, Edit3, X, Eye, EyeOff, Sparkles, ShieldCheck
} from 'lucide-react';
import { UserProfileFooter } from './UserProfileFooter';
import { ComposeModal } from './ComposeModal';
import { CalendarView } from './CalendarView';
import { ContactsView } from './ContactsView';

export interface EmailItem {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
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

export function InboxDashboard({ user, initialEmails, currentFolder: initialFolder }: Props) {
  const [activeTab, setActiveTab] = useState<'mail' | 'calendar' | 'contacts'>('mail');
  const [selectedFolder, setSelectedFolder] = useState<string>(initialFolder || 'INBOX');
  const [emails, setEmails] = useState<EmailItem[]>(initialEmails);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(initialEmails[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());

  // Dynamic domain of user
  const userDomain = user.email.includes('@') ? user.email.split('@')[1] : 'rapimoneyit.online';

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
    return emails.find(e => e.id === selectedEmailId) || null;
  }, [emails, selectedEmailId]);

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

  // Simular Abertura (para testes ao vivo)
  const handleSimulateOpen = async (trackingId: string) => {
    try {
      await fetch(`/api/track/open/${trackingId}`);
      setEmails(prev => prev.map(item => {
        if (item.trackingId === trackingId) {
          return {
            ...item,
            isOpened: true,
            openedAt: new Date().toISOString(),
            openCount: (item.openCount || 0) + 1,
            userAgent: "Mozilla/5.0 (iPhone; Apple Mail)"
          };
        }
        return item;
      }));
    } catch(err) {
      console.error(err);
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
          subject: `Re: ${selectedEmail.subject}`,
          body: replyText
        })
      });
      if (res.ok) {
        setReplySuccess(true);
        setReplyText("");
        setTimeout(() => setReplySuccess(false), 3000);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setSendingReply(false);
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
    <div className="flex flex-col h-screen bg-[#09090b] text-zinc-300 font-sans overflow-hidden select-none">
      
      {/* 1. TOP GLOBAL APP BAR (Style Private Email / Superhuman) */}
      <header className="h-14 border-b border-white/5 bg-[#0e0e11] flex items-center justify-between px-4 z-20 flex-shrink-0">
        
        {/* Left: Brand & App Switcher */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <span className="text-white font-bold text-xs tracking-tight">RE</span>
            </div>
            <span className="text-white font-bold text-base tracking-tight hidden sm:inline">RapiEmail</span>
          </div>

          {/* App Switcher (Mail, Calendar, Contacts) */}
          <div className="flex items-center bg-white/5 border border-white/5 rounded-lg p-0.5">
            <button 
              onClick={() => setActiveTab('mail')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'mail' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Correio</span>
            </button>
            <button 
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'calendar' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendário</span>
            </button>
            <button 
              onClick={() => setActiveTab('contacts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'contacts' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
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
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pesquisar mensagens por remetente, assunto ou texto... (Ctrl+K)" 
              className="w-full bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 focus:border-indigo-500/40 rounded-xl py-1.5 pl-10 pr-4 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:bg-white/[0.06] transition-all"
            />
          </div>
        </div>

        {/* Right: Actions & Status */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.reload()}
            title="Atualizar Correio"
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="relative">
            <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <Bell className="w-4 h-4" />
            </button>
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full"></div>
          </div>
          <Link href="/settings" title="Definições da Conta" className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <Settings className="w-4 h-4" />
          </Link>
          
          <div className="h-4 w-px bg-white/10 mx-1"></div>

          <Link href="/settings" title="Abrir Perfil" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {user.initials}
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

      {/* TAB 3: MAIL VIEW (3-COLUMN WORKSPACE) */}
      {activeTab === 'mail' && (
        <div className="flex-1 flex overflow-hidden">
          
          {/* COLUMN 1: LEFT SIDEBAR (Folders & Storage) */}
          <aside className="w-[240px] border-r border-white/5 bg-[#0b0b0e] flex flex-col flex-shrink-0">
            
            {/* Write Button */}
            <div className="p-3">
              <button 
                onClick={() => setIsComposeOpen(true)}
                className="w-full flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white py-2.5 px-4 rounded-xl font-semibold text-xs shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Edit3 className="w-4 h-4" />
                <span>Escrever Email</span>
              </button>
            </div>

            {/* Folder Navigation */}
            <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
              {folders.map(folder => {
                const Icon = folder.icon;
                const isActive = selectedFolder === folder.id;
                return (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive 
                        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 font-semibold' 
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                      <span>{folder.label}</span>
                    </div>
                    {folder.count > 0 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-indigo-500 text-white' : 'bg-white/10 text-zinc-400'
                      }`}>
                        {folder.count}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Alojamento Web Link (Upsell) */}
              <div className="pt-4 mt-4 border-t border-white/5 px-1">
                <div className="p-3 rounded-xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-medium text-xs">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Alojamento Web</span>
                    </div>
                    <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-md">20€/mês</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    Coloque o seu website online no domínio <span className="text-zinc-200 font-medium">{userDomain}</span> com 1 clique.
                  </p>
                  <button 
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/checkout", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ itemType: "HOSTING_ADDON", domainName: userDomain })
                        });
                        const data = await res.json();
                        if (data.url) {
                          window.location.href = data.url;
                        }
                      } catch (err) {
                        alert("Erro ao iniciar pagamento Stripe.");
                      }
                    }}
                    className="w-full text-center py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] rounded-lg transition-colors shadow-md shadow-indigo-600/20"
                  >
                    Ativar Site no Ar (Stripe)
                  </button>
                </div>
              </div>
            </nav>

            {/* Storage Meter (Real Dynamic Storage) */}
            <div className="p-3 border-t border-white/5 bg-[#09090b]">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
                    <HardDrive className="w-3 h-3 text-zinc-500" />
                    Armazenamento
                  </span>
                  <span className="text-zinc-500 font-mono text-[10px]">{storagePercent}</span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, parseFloat(storagePercent))}%` }}
                  />
                </div>
                
                <p className="text-[10px] text-zinc-500">
                  <strong className="text-zinc-300 font-medium">{formattedStorage}</strong> de 10 GB utilizados
                </p>
              </div>
            </div>

            {/* User Profile Footer (Separate Settings & Logout) */}
            <div className="p-2 border-t border-white/5">
              <UserProfileFooter initials={user.initials} name={user.name} email={user.email} />
            </div>
          </aside>

          {/* COLUMN 2: MIDDLE LIST PANE (Email List) */}
          <section className="w-[380px] border-r border-white/5 flex flex-col bg-[#09090b] flex-shrink-0">
            
            {/* List Header */}
            <div className="h-12 border-b border-white/5 px-4 flex items-center justify-between bg-[#0e0e11]/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
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
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredEmails.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 text-zinc-600">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-medium text-white mb-1">Sem mensagens</h4>
                  <p className="text-xs text-zinc-500">Esta pasta está limpa e vazia.</p>
                </div>
              ) : (
                filteredEmails.map(email => {
                  const isSelected = selectedEmailId === email.id;
                  const isStarred = starredIds.has(email.id);
                  const isSent = email.from === user.email;
                  const displayFrom = isSent ? `Para: ${email.to}` : email.from;
                  const initial = displayFrom.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase() || 'RE';
                  
                  const d = new Date(email.createdAt);
                  const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

                  return (
                    <div
                      key={email.id}
                      onClick={() => handleSelectEmail(email.id)}
                      className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-600/10 border-indigo-500/30 shadow-md shadow-black/40' 
                          : 'bg-[#0e0e11]/40 border-white/[0.04] hover:bg-white/[0.04] hover:border-white/10'
                      }`}
                    >
                      {/* Unread dot */}
                      {!email.read && !isSent && (
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                      )}

                      <div className="flex items-start gap-3">
                        {/* Sender Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-white/5 flex items-center justify-center text-[11px] font-bold text-zinc-300 flex-shrink-0 mt-0.5">
                          {initial}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-xs truncate ${!email.read && !isSent ? 'font-bold text-white' : 'font-medium text-zinc-300'}`}>
                              {displayFrom}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono flex-shrink-0">
                              {time}
                            </span>
                          </div>

                          <p className={`text-xs truncate mb-1 ${!email.read && !isSent ? 'font-semibold text-indigo-300' : 'text-zinc-400'}`}>
                            {email.subject || '(Sem assunto)'}
                          </p>

                          <p className="text-[11px] text-zinc-500 truncate leading-snug">
                            {email.body}
                          </p>

                          {/* Email Tracking Double Checkmark Badge for Sent Emails */}
                          {isSent && (
                            <div className="flex items-center gap-1.5 mt-2">
                              {email.isOpened ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded-md">
                                  <CheckCheck className="w-3 h-3 text-cyan-400" />
                                  <span>Lido {email.openCount && email.openCount > 1 ? `(${email.openCount}x)` : ''}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded-md">
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
                            className="text-zinc-500 hover:text-yellow-400 transition-colors"
                          >
                            <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-yellow-400 text-yellow-400 opacity-100' : ''}`} />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteEmail(email.id, e)} 
                            className="text-zinc-500 hover:text-red-400 transition-colors"
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

          {/* COLUMN 3: RIGHT READING PANE (Split-View Reader) */}
          <main className="flex-1 flex flex-col bg-[#09090b] overflow-hidden">
            
            {selectedEmail ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Email Toolbar Actions */}
                <div className="h-12 border-b border-white/5 px-6 flex items-center justify-between bg-[#0e0e11]/30 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setReplyText(`\n\n--- Mensagem Original ---\n${selectedEmail.body}`);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-white transition-colors"
                    >
                      <CornerUpLeft className="w-3.5 h-3.5" />
                      <span>Responder</span>
                    </button>
                    <button 
                      onClick={() => setIsComposeOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-white transition-colors"
                    >
                      <CornerUpRight className="w-3.5 h-3.5" />
                      <span>Encaminhar</span>
                    </button>
                    <div className="h-4 w-px bg-white/10 mx-1"></div>
                    <button 
                      onClick={() => handleDeleteEmail(selectedEmail.id)}
                      title="Mover para o Lixo"
                      className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      title="Arquivar"
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="font-mono">
                      {new Date(selectedEmail.createdAt).toLocaleDateString('pt-PT', { 
                        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </span>
                    <button className="p-1 text-zinc-400 hover:text-white rounded">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Email Content Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                  
                  {/* Rastreamento de Leitura Banner (Apenas em Emails Enviados) */}
                  {selectedEmail.from === user.email && (
                    <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                      selectedEmail.isOpened 
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200' 
                        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                    }`}>
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md ${
                          selectedEmail.isOpened ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        }`}>
                          {selectedEmail.isOpened ? <CheckCheck className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs">
                              {selectedEmail.isOpened ? '✓✓ Destinatário Leu a Mensagem' : '✓ Entregue com Sucesso (A aguardar abertura)'}
                            </span>
                            {selectedEmail.isOpened && (
                              <span className="text-[10px] bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded-full font-bold">
                                {selectedEmail.openCount || 1} visualização(ões)
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {selectedEmail.isOpened 
                              ? `Lido às ${new Date(selectedEmail.openedAt || '').toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} • Dispositivo: ${selectedEmail.userAgent ? 'Cliente de Email' : 'Apple Mail / Web'}`
                              : 'O pixel stealth do RapiEmail notificará em tempo real quando o destinatário abrir este email.'}
                          </p>
                        </div>
                      </div>

                      {/* Botão de Teste / Simulação */}
                      {!selectedEmail.isOpened && selectedEmail.trackingId && (
                        <button
                          onClick={() => handleSimulateOpen(selectedEmail.trackingId!)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
                        >
                          Simular Leitura
                        </button>
                      )}
                    </div>
                  )}

                  {/* Subject Line */}
                  <h1 className="text-xl font-bold text-white tracking-tight leading-snug">
                    {selectedEmail.subject || '(Sem assunto)'}
                  </h1>

                  {/* Sender Details Card */}
                  <div className="flex items-center justify-between pb-6 border-b border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-400/30 flex items-center justify-center text-sm font-bold text-white shadow-md">
                        {selectedEmail.from.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">
                            {selectedEmail.from}
                          </span>
                          <span className="text-xs text-zinc-500 font-mono">&lt;{selectedEmail.from}&gt;</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          para <span className="text-zinc-400">{selectedEmail.to}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => toggleStar(selectedEmail.id, e)}
                        className="p-2 text-zinc-400 hover:text-yellow-400 hover:bg-white/5 rounded-xl transition-colors"
                      >
                        <Star className={`w-4 h-4 ${starredIds.has(selectedEmail.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="text-sm text-zinc-300 leading-relaxed space-y-4 whitespace-pre-wrap font-normal max-w-3xl">
                    {selectedEmail.body}
                  </div>

                  {/* Inline Quick Reply Box */}
                  <div className="mt-12 pt-6 border-t border-white/5 max-w-3xl">
                    <div className="bg-[#0e0e11] border border-white/5 rounded-2xl p-4 focus-within:border-indigo-500/40 transition-all space-y-3 shadow-xl">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                          <CornerUpLeft className="w-3.5 h-3.5 text-indigo-400" />
                          Responder a {selectedEmail.from}
                        </span>
                      </div>

                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Escreva aqui a sua resposta rápida..."
                        rows={3}
                        className="w-full bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"
                      />

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 text-zinc-500 hover:text-white rounded-lg transition-colors">
                            <Paperclip className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          {replySuccess && (
                            <span className="text-xs text-green-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Resposta enviada com sucesso!
                            </span>
                          )}
                          <button
                            onClick={handleSendReply}
                            disabled={!replyText || sendingReply}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
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
            ) : (
              // Empty State (Style Namecheap Private Email / Superhuman)
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-600 shadow-2xl">
                    <Mail className="w-9 h-9 text-zinc-600" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-1.5 tracking-tight">
                  Nenhum email selecionado
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm leading-relaxed mb-6">
                  Selecione uma mensagem da lista ao lado para ler o conteúdo completo, ou clique no botão para compor um novo email.
                </p>

                <button 
                  onClick={() => setIsComposeOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all border border-white/5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Nova Mensagem</span>
                </button>
              </div>
            )}

          </main>

        </div>
      )}

      {/* Floating Compose Modal */}
      <ComposeModal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} />

    </div>
  );
}
