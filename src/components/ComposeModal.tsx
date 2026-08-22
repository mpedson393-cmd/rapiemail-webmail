"use client";
import React, { useState } from 'react';
import { 
  X, Minus, Maximize2, Paperclip, Image as ImageIcon, Smile, 
  Send, Sparkles, Loader2, Bold, Italic, Underline, Strikethrough, 
  Link as LinkIcon, Code, ChevronDown
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export function ComposeModal({ isOpen, onClose, userEmail }: Props) {
  const fromEmail = userEmail || "edson@rapimoneyit.online";

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!to || !subject || !body) {
      setError("Preencha o destinatário, assunto e a mensagem.");
      return;
    }
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Erro ao enviar.");
      } else {
        setTo("");
        setSubject("");
        setBody("");
        onClose();
        window.location.reload();
      }
    } catch(err) {
      setError("Erro de rede ao enviar.");
    } finally {
      setSending(false);
    }
  };

  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) return;
    setGeneratingAi(true);
    setError("");
    
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt.trim() })
      });
      const data = await res.json();
      if (data.subject) setSubject(data.subject);
      if (data.body) setBody(data.body);
    } catch(err) {
      setError("Erro ao gerar com Google Gemini.");
    } finally {
      setGeneratingAi(false);
      setAiPrompt("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      
      {/* Large Centered Modal Box (Matching Private Email / Superhuman design) */}
      <div className="w-[720px] h-[640px] max-h-[90vh] bg-[#141417] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#1e1e24] px-5 py-3.5 flex items-center justify-between border-b border-white/5">
          <span className="text-sm font-semibold text-white tracking-tight">Escrever email</span>
          <div className="flex items-center gap-3 text-zinc-400">
            <button onClick={onClose} className="hover:text-white transition-colors"><Minus className="w-4 h-4" /></button>
            <button className="hover:text-white transition-colors"><Maximize2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="hover:text-white transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Sender & Recipient Fields */}
        <div className="bg-[#18181c] border-b border-white/5 flex flex-col text-xs text-zinc-300">
          
          {/* De: Selector */}
          <div className="px-5 py-2.5 border-b border-white/5 flex items-center gap-3">
            <span className="text-zinc-500 font-medium w-14">De:</span>
            <div className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg cursor-pointer border border-white/5 text-zinc-200">
              <span className="font-semibold">{fromEmail}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </div>
          </div>

          {/* Para: Input */}
          <div className="px-5 py-2.5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-zinc-500 font-medium w-14">Para:</span>
              <input 
                type="email" 
                value={to}
                onChange={e => setTo(e.target.value)}
                className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none placeholder-zinc-600" 
                placeholder="destinatario@empresa.com"
              />
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
              <button onClick={() => setShowCc(!showCc)} className="hover:text-indigo-400 transition-colors">Cc</button>
              <span>/</span>
              <button onClick={() => setShowCc(!showCc)} className="hover:text-indigo-400 transition-colors">Bcc</button>
            </div>
          </div>

          {/* Cc / Bcc Expandable */}
          {showCc && (
            <div className="px-5 py-2 border-b border-white/5 bg-black/20 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 font-medium w-14">Cc:</span>
                <input 
                  type="text" 
                  value={cc}
                  onChange={e => setCc(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-white focus:outline-none" 
                  placeholder="copia@empresa.com"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 font-medium w-14">Bcc:</span>
                <input 
                  type="text" 
                  value={bcc}
                  onChange={e => setBcc(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-white focus:outline-none" 
                  placeholder="oculto@empresa.com"
                />
              </div>
            </div>
          )}

          {/* Assunto: Input */}
          <div className="px-5 py-2.5 flex items-center gap-3">
            <span className="text-zinc-500 font-medium w-14">Assunto:</span>
            <input 
              type="text" 
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="flex-1 bg-transparent border-none text-xs text-white font-medium focus:outline-none placeholder-zinc-600" 
              placeholder="Assunto da mensagem..."
            />
          </div>

        </div>

        {/* Rich Formatting Toolbar (Matching Private Email screenshot) */}
        <div className="bg-[#1a1a20] border-b border-white/5 px-5 py-2 flex items-center gap-3 text-zinc-400 text-xs overflow-x-auto">
          <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded text-zinc-300">
            <span>Arial</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded text-zinc-300">
            <span>14</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </div>

          <div className="h-4 w-px bg-white/10 mx-1"></div>

          <button className="p-1.5 hover:text-white hover:bg-white/5 rounded transition-colors" title="Negrito"><Bold className="w-3.5 h-3.5" /></button>
          <button className="p-1.5 hover:text-white hover:bg-white/5 rounded transition-colors" title="Itálico"><Italic className="w-3.5 h-3.5" /></button>
          <button className="p-1.5 hover:text-white hover:bg-white/5 rounded transition-colors" title="Sublinhado"><Underline className="w-3.5 h-3.5" /></button>
          <button className="p-1.5 hover:text-white hover:bg-white/5 rounded transition-colors" title="Riscado"><Strikethrough className="w-3.5 h-3.5" /></button>
          
          <div className="h-4 w-px bg-white/10 mx-1"></div>

          <button className="p-1.5 hover:text-white hover:bg-white/5 rounded transition-colors" title="Inserir Imagem"><ImageIcon className="w-3.5 h-3.5" /></button>
          <button className="p-1.5 hover:text-white hover:bg-white/5 rounded transition-colors" title="Inserir Link"><LinkIcon className="w-3.5 h-3.5" /></button>
          <button className="p-1.5 hover:text-white hover:bg-white/5 rounded transition-colors" title="Inserir Código"><Code className="w-3.5 h-3.5" /></button>
        </div>

        {/* Large Editor Text Area (Single Scrollbar) */}
        <div className="flex-1 p-6 bg-[#121215] flex flex-col">
          <textarea 
            value={body}
            onChange={e => setBody(e.target.value)}
            className="w-full h-full bg-transparent border-none text-sm text-zinc-200 focus:outline-none resize-none leading-relaxed placeholder:text-zinc-600 font-normal overflow-y-auto"
            placeholder="Escreva a tua mensagem aqui..."
          />
        </div>

        {/* Bottom AI Prompt Bar & Send Toolbar (Matching Private Email Floating Pill) */}
        <div className="bg-[#18181c] border-t border-white/5 px-6 py-3.5 flex items-center justify-between gap-4">
          
          {/* RapiAI Floating Input Pill */}
          <div className="flex-1 flex items-center bg-[#22222a] border border-white/10 rounded-full px-4 py-1.5 focus-within:border-indigo-500/50 transition-all shadow-inner">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse mr-2.5 flex-shrink-0" />
            <input 
              type="text" 
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleGenerateAi(); }}
              placeholder="O que queres escrever? Ex.: convite formal para reunião..."
              className="flex-1 bg-transparent border-none text-xs text-white placeholder:text-zinc-500 focus:outline-none"
            />
            {aiPrompt && (
              <button 
                type="button"
                onClick={handleGenerateAi}
                disabled={generatingAi}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ml-2 shadow-md shadow-indigo-600/30"
              >
                {generatingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Gerar Texto com IA</span>
              </button>
            )}
          </div>

          {/* Attachments & Send Action */}
          <div className="flex items-center gap-3">
            <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Anexar Ficheiro">
              <Paperclip className="w-4 h-4" />
            </button>
            <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">
              <Smile className="w-4 h-4" />
            </button>

            {error && <span className="text-red-400 text-xs">{error}</span>}

            <button 
              onClick={handleSend}
              disabled={sending}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
            >
              <span>{sending ? "A enviar..." : "Enviar"}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
