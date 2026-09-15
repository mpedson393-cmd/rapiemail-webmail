"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, Sparkles, Plus, Trash2, Send, Paperclip, 
  Globe, Copy, Check, MessageSquare, ArrowLeft,
  Search, Mail, FileText, X, ExternalLink
} from "lucide-react";
import { EmailItem } from "./InboxDashboard";

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessageItem[];
}

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
  images?: string[];
  hasSiteAction?: boolean;
}

interface Props {
  user: {
    name: string;
    email: string;
    initials: string;
  };
  selectedEmail?: EmailItem | null;
  onOpenEmail?: (emailId: string) => void;
  onOpenSiteBuilder?: () => void;
  onBackToMail?: () => void;
}

const STORAGE_KEY = "rapi_agent_chat_sessions_v1";

export function AgentChatView({ user, selectedEmail, onOpenEmail, onOpenSiteBuilder, onBackToMail }: Props) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState("");
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ChatSession[] = JSON.parse(saved);
        if (parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          return;
        }
      }
    } catch (e) {
      console.warn("Erro ao carregar sessões de chat:", e);
    }
    createNewChat("Primeira Conversa com o Agente");
  }, []);

  const saveSessionsToStorage = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
    } catch (e) {
      console.warn("Erro ao salvar sessões de chat:", e);
    }
  };

  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages, loading]);

  const createNewChat = (customTitle?: string) => {
    const newSession: ChatSession = {
      id: "chat_" + Date.now(),
      title: customTitle || "Nova Conversa",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: "welcome_" + Date.now(),
          role: "assistant",
          content: `Olá **${user.name.split(' ')[0]}**! Sou o **Agente IA da RapiEmail**.\n\nComo posso ajudar hoje? Estou preparado para:\n- 📖 **Ler e responder e-mails inteiros** com contexto profissional.\n- 📸 **Analisar fotos, recibos e documentos** anexados.\n- 🌐 **Criar e publicar websites completos** para o teu negócio.\n- 💡 **Esclarecer dúvidas sobre o app**, configurações de domínio (DNS/SPF/DKIM), faturação ou automações.`,
          time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    const updated = [newSession, ...sessions];
    saveSessionsToStorage(updated);
    setActiveSessionId(newSession.id);
    setIsSidebarOpenMobile(false);
  };

  const deleteChat = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = sessions.filter(s => s.id !== sessionId);
    if (remaining.length === 0) {
      createNewChat();
    } else {
      saveSessionsToStorage(remaining);
      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining[0].id);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (evt.target?.result) {
            setAttachedImages(prev => [...prev, evt.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const textContent = evt.target?.result as string;
          setInputPrompt(prev => prev + `\n[Ficheiro ${file.name}]:\n${textContent.slice(0, 1500)}`);
        };
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (forcedText?: string) => {
    const textToSend = typeof forcedText === "string" ? forcedText : inputPrompt;
    if ((!textToSend.trim() && attachedImages.length === 0) || loading) return;

    const userMessageText = textToSend.trim();
    const imagesPayload = [...attachedImages];
    const timeNow = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

    const newUserMsg: ChatMessageItem = {
      id: "msg_user_" + Date.now(),
      role: "user",
      content: userMessageText,
      time: timeNow,
      images: imagesPayload.length > 0 ? imagesPayload : undefined
    };

    let activeSess = currentSession;
    if (!activeSess) {
      activeSess = {
        id: "chat_" + Date.now(),
        title: userMessageText.slice(0, 30) || "Conversa",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      };
    }

    const updatedMessages = [...activeSess.messages, newUserMsg];
    let newTitle = activeSess.title;
    if (activeSess.messages.length <= 1 && userMessageText) {
      newTitle = userMessageText.slice(0, 35) + (userMessageText.length > 35 ? "..." : "");
    }

    const updatedSession: ChatSession = {
      ...activeSess,
      title: newTitle,
      updatedAt: new Date().toISOString(),
      messages: updatedMessages
    };

    const nextSessions = sessions.map(s => s.id === updatedSession.id ? updatedSession : s);
    saveSessionsToStorage(nextSessions);

    setInputPrompt("");
    setAttachedImages([]);
    setLoading(true);

    try {
      const conversationPayload = updatedMessages.map(m => ({
        role: m.role,
        content: m.content,
        image: m.images?.[0]
      }));

      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationPayload,
          prompt: userMessageText,
          images: imagesPayload,
          subject: selectedEmail?.subject || "",
          body: selectedEmail?.body || "",
          html: selectedEmail?.html || "",
          from: selectedEmail?.from || "",
          userName: user.name
        })
      });

      const data = await res.json();
      const replyContent = data.response || "Compreendi a sua solicitação. Como posso ajudar a prosseguir?";
      const isSiteRelated = replyContent.toLowerCase().includes("website") || replyContent.toLowerCase().includes("site builder") || replyContent.includes("<!DOCTYPE html>");

      const assistantMsg: ChatMessageItem = {
        id: "msg_ai_" + Date.now(),
        role: "assistant",
        content: replyContent,
        time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        hasSiteAction: isSiteRelated
      };

      const finalSession: ChatSession = {
        ...updatedSession,
        messages: [...updatedMessages, assistantMsg]
      };

      saveSessionsToStorage(sessions.map(s => s.id === finalSession.id ? finalSession : s));
    } catch (err) {
      const errorMsg: ChatMessageItem = {
        id: "msg_err_" + Date.now(),
        role: "assistant",
        content: "Não foi possível contactar o Agente de IA neste momento. Por favor tente novamente.",
        time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
      };
      const finalSession: ChatSession = {
        ...updatedSession,
        messages: [...updatedMessages, errorMsg]
      };
      saveSessionsToStorage(sessions.map(s => s.id === finalSession.id ? finalSession : s));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.messages.some(m => m.content.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="flex-1 flex overflow-hidden min-h-0 bg-[#0A0D14] text-zinc-100 relative">
      {/* SIDEBAR DE HISTÓRICO DE CONVERSAS */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 md:static w-72 md:w-64 bg-[#0E131F] border-r border-white/10 flex flex-col shrink-0 transition-transform duration-200 ease-in-out
        ${isSidebarOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header da Sidebar */}
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-blue-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white tracking-wide uppercase">Agente RapiAI</h2>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online & Conectado
              </span>
            </div>
          </div>

          <button 
            onClick={() => setIsSidebarOpenMobile(false)}
            className="md:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Botão Novo Chat */}
        <div className="p-3 space-y-2">
          <button
            onClick={() => createNewChat()}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-98 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Conversa</span>
          </button>

          {/* Botão Acesso Rápido ao Criador de Websites com IA */}
          <button
            onClick={() => {
              if (onOpenSiteBuilder) onOpenSiteBuilder();
              else handleSendMessage("Quero criar e publicar um website profissional completo com IA para o meu negócio.");
            }}
            className="w-full py-2 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold text-xs flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-12 transition-transform" />
              <span>Criar Website com IA</span>
            </div>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
              Builder
            </span>
          </button>
        </div>

        {/* Campo de Pesquisa no Histórico */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs focus-within:border-indigo-500/50 transition-all">
            <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <input 
              type="text"
              placeholder="Pesquisar conversas..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 outline-none"
            />
          </div>
        </div>

        {/* Lista de Sessões Anteriores */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <span className="px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider block my-1">
            Histórico ({filteredSessions.length})
          </span>

          {filteredSessions.map(sess => {
            const isActive = sess.id === currentSession?.id;
            return (
              <div
                key={sess.id}
                onClick={() => {
                  setActiveSessionId(sess.id);
                  setIsSidebarOpenMobile(false);
                }}
                className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                  isActive 
                    ? "bg-indigo-600/20 border border-indigo-500/40 text-white font-medium shadow-xs" 
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-6">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                  <span className="truncate">{sess.title || "Conversa Sem Título"}</span>
                </div>

                <button
                  onClick={(e) => deleteChat(sess.id, e)}
                  title="Eliminar conversa"
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 rounded-md hover:bg-rose-500/10 transition-all absolute right-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Rodapé da Sidebar */}
        <div className="p-3 border-t border-white/10 bg-black/20 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
              {user.initials}
            </div>
            <span className="truncate">{user.name}</span>
          </div>
          {onBackToMail && (
            <button
              onClick={onBackToMail}
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Voltar</span>
            </button>
          )}
        </div>
      </aside>

      {/* OVERLAY MOBILE */}
      {isSidebarOpenMobile && (
        <div 
          onClick={() => setIsSidebarOpenMobile(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      {/* ÁREA PRINCIPAL DO CHAT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0D14]">
        {/* Top Header */}
        <header className="px-4 py-3 border-b border-white/10 bg-[#0E131F]/90 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpenMobile(true)}
              className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white bg-white/5"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white truncate">
                  {currentSession?.title || "Agente IA Executivo"}
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Multimodal RapiAI
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Assistente inteligente para e-mails, visão computacional e criação de sites
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSiteBuilder && (
              <button
                onClick={onOpenSiteBuilder}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Criador de Sites</span>
              </button>
            )}

            {onBackToMail && (
              <button
                onClick={onBackToMail}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Voltar à Caixa de Entrada"
              >
                <Mail className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Context Pill do E-mail Selecionado */}
        {selectedEmail && (
          <div className="px-4 py-2 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-indigo-950/40 border-b border-indigo-500/20 flex items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-zinc-400">E-mail em contexto:</span>
              <span className="font-bold text-white truncate max-w-[200px] sm:max-w-md">
                {selectedEmail.subject || "(Sem assunto)"}
              </span>
              <span className="text-zinc-500 hidden sm:inline truncate">
                de {selectedEmail.from}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleSendMessage(`Lê todo o e-mail selecionado de "${selectedEmail.from}" com o assunto "${selectedEmail.subject}" e faz uma análise executiva dos requisitos e próximos passos.`)}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-semibold text-[11px] border border-indigo-500/30 transition-all cursor-pointer"
              >
                📖 Ler E-mail Inteiro
              </button>
              {onOpenEmail && (
                <button
                  onClick={() => onOpenEmail(selectedEmail.id)}
                  title="Abrir e-mail na caixa de entrada"
                  className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* STREAM DE MENSAGENS */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 select-text">
          {currentSession?.messages.map((msg, idx) => {
            const isAi = msg.role === "assistant";
            return (
              <div 
                key={msg.id || idx}
                className={`flex gap-3 md:gap-4 max-w-4xl mx-auto ${isAi ? '' : 'flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs shadow-md ${
                  isAi 
                    ? 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-blue-500 text-white shadow-indigo-600/20' 
                    : 'bg-emerald-600 text-white shadow-emerald-600/20'
                }`}>
                  {isAi ? <Bot className="w-4 h-4" /> : user.initials}
                </div>

                {/* Card da Mensagem */}
                <div className={`space-y-2 max-w-[85%] sm:max-w-[75%] ${isAi ? '' : 'items-end'}`}>
                  <div className={`rounded-2xl p-4 text-xs md:text-sm leading-relaxed ${
                    isAi 
                      ? 'bg-[#141A28] border border-white/10 text-zinc-200 shadow-xl' 
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg'
                  }`}>
                    {/* Imagens Anexadas */}
                    {msg.images && msg.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {msg.images.map((img, imgIdx) => (
                          <div key={imgIdx} className="relative rounded-lg overflow-hidden border border-white/20 max-w-[200px] max-h-[160px]">
                            <img src={img} alt="Anexo de Visão" className="object-cover w-full h-full" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Conteúdo Textual */}
                    <div className="whitespace-pre-wrap space-y-2 select-text font-normal">
                      {msg.content}
                    </div>

                    {/* Botões de Ação */}
                    {isAi && (
                      <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>

                        {msg.hasSiteAction && onOpenSiteBuilder && (
                          <button
                            onClick={onOpenSiteBuilder}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <Globe className="w-3 h-3" />
                            <span>Abrir no Criador de Websites</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <span className={`text-[10px] text-zinc-500 px-1 block ${isAi ? 'text-left' : 'text-right'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-3 md:gap-4 max-w-4xl mx-auto items-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-blue-500 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl bg-[#141A28] border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span>O Agente RapiAI está a processar a resposta e a analisar o contexto...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* SUGESTÕES RÁPIDAS */}
        <div className="px-4 py-2 bg-[#0E131F] border-t border-white/10 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => handleSendMessage("Quero criar um website moderno para o meu negócio. Como podemos começar?")}
            className="px-3 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold text-xs shrink-0 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Globe className="w-3 h-3 text-indigo-400" />
            <span>🌐 Criar Site com IA</span>
          </button>

          {selectedEmail && (
            <>
              <button
                onClick={() => handleSendMessage(`Analisa o e-mail completo de "${selectedEmail.from}" e elabora uma resposta executiva profissional confirmando o recebimento e detalhando os próximos passos.`)}
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-medium text-xs shrink-0 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Mail className="w-3 h-3 text-emerald-400" />
                <span>✉️ Responder ao E-mail Atual</span>
              </button>
              <button
                onClick={() => handleSendMessage(`Extrai todos os pontos críticos, faturas, prazos e obrigações pendentes deste e-mail de ${selectedEmail.from}.`)}
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-medium text-xs shrink-0 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3 h-3 text-blue-400" />
                <span>📋 Resumo de Tarefas</span>
              </button>
            </>
          )}

          <button
            onClick={() => handleSendMessage("Como configuro o meu domínio próprio (DNS, MX, SPF, DKIM) na RapiEmail?")}
            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-medium text-xs shrink-0 transition-all cursor-pointer"
          >
            ❓ Como configurar Domínio & DNS
          </button>

          <button
            onClick={() => handleSendMessage("Como adicionar uma assinatura profissional com logotipo e foto nos meus e-mails?")}
            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-medium text-xs shrink-0 transition-all cursor-pointer"
          >
            ✍️ Assinatura com Foto
          </button>
        </div>

        {/* INPUT DE MENSAGENS COM UPLOAD */}
        <div className="p-3 md:p-4 bg-[#0E131F] border-t border-white/10 shrink-0">
          <div className="max-w-4xl mx-auto space-y-2">
            {attachedImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {attachedImages.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-indigo-500/40 w-16 h-16 shrink-0">
                    <img src={img} alt="Upload preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-rose-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 bg-[#141A28] border border-white/10 rounded-2xl p-2 focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <input 
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Carregar fotos ou documentos para análise de visão IA"
                className="p-2 text-zinc-400 hover:text-indigo-400 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <textarea
                ref={textareaRef}
                value={inputPrompt}
                onChange={e => setInputPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder={selectedEmail ? `Pergunte sobre o e-mail de ${selectedEmail.from.split('<')[0].trim()} ou anexe uma foto...` : "Pergunte ao Agente, anexe fotos ou ficheiros, ou peça para criar um website..."}
                className="flex-1 bg-transparent text-xs md:text-sm text-white placeholder:text-zinc-500 resize-none outline-none max-h-32 py-1.5 px-1 leading-relaxed"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={(!inputPrompt.trim() && attachedImages.length === 0) || loading}
                className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-500 px-1">
              <span>Carregue fotos ou documentos para análise multimodal (Gemini / NVIDIA / Groq).</span>
              <span>Pressione <kbd className="px-1 py-0.5 rounded bg-white/10 text-zinc-300">Enter</kbd> para enviar</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
