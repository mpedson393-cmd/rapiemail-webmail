"use client";
import React, { useState } from 'react';
import { X, Minus, Maximize2, Paperclip, Image as ImageIcon, Smile, MoreVertical, Send } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ComposeModal({ isOpen, onClose }: Props) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!to || !subject || !body) {
      setError("Preencha todos os campos.");
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
        // Sucesso
        setTo("");
        setSubject("");
        setBody("");
        onClose();
        window.location.reload();
      }
    } catch(err) {
      setError("Erro de rede.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-0 right-24 w-[500px] bg-[#18181b] rounded-t-xl shadow-2xl border border-white/10 flex flex-col overflow-hidden z-50 transform transition-transform duration-300 ease-out origin-bottom">
      
      {/* Header */}
      <div className="bg-[#27272a] px-4 py-3 flex items-center justify-between cursor-pointer" onClick={onClose}>
        <span className="text-sm font-medium text-white">Nova Mensagem</span>
        <div className="flex items-center gap-3">
          <button className="text-zinc-400 hover:text-white transition-colors"><Minus className="w-4 h-4" /></button>
          <button className="text-zinc-400 hover:text-white transition-colors"><Maximize2 className="w-4 h-4" /></button>
          <button className="text-zinc-400 hover:text-white transition-colors" onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-white/5 px-4 py-2 flex items-center">
          <span className="text-zinc-500 text-sm w-12">Para</span>
          <input 
            type="email" 
            value={to}
            onChange={e => setTo(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none placeholder-zinc-700" 
            placeholder="destinatario@email.com"
          />
        </div>
        <div className="border-b border-white/5 px-4 py-2 flex items-center">
          <span className="text-zinc-500 text-sm w-12">Assunto</span>
          <input 
            type="text" 
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm text-white font-medium focus:outline-none" 
          />
        </div>
        
        {/* Editor Area */}
        <div className="flex-1 p-4 h-[300px]">
          <textarea 
            value={body}
            onChange={e => setBody(e.target.value)}
            className="w-full h-full bg-transparent border-none text-sm text-zinc-300 focus:outline-none resize-none"
            placeholder="Escreva a sua mensagem..."
          />
        </div>
      </div>

      {/* Footer / Toolbar */}
      <div className="bg-[#18181b] border-t border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSend}
            disabled={sending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            {sending ? "A enviar..." : "Enviar"}
            <Send className="w-4 h-4" />
          </button>
          
          <div className="h-6 w-px bg-white/10 mx-2"></div>
          
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">
            <Paperclip className="w-4 h-4" />
          </button>
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">
            <ImageIcon className="w-4 h-4" />
          </button>
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">
            <Smile className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {error && <span className="text-red-400 text-xs">{error}</span>}
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
