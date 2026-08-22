"use client";
import React, { useState } from 'react';
import { X, Minus, Maximize2, Paperclip, Image as ImageIcon, Smile, MoreVertical, Send, Sparkles, Loader2 } from 'lucide-react';

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
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

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

  const handleGenerateAi = (type?: string) => {
    setGeneratingAi(true);
    setTimeout(() => {
      if (type === 'proposal') {
        setSubject("Proposta de Parceria & Soluções RapiEmail Pro");
        setBody(`Estimado(a),\n\nEspero que esta mensagem o(a) encontre bem.\n\nGostaria de apresentar a nossa solução corporativa de e-mail e alojamento web no RapiEmail Pro. Oferecemos infraestrutura de alta velocidade, rastreamento de leitura em tempo real (✓✓) e suporte dedicado.\n\nFico à disposição para agendarmos uma breve conversa esta semana.\n\nCom os melhores cumprimentos,\nEquipa RapiEmail`);
      } else if (type === 'meeting') {
        setSubject("Agendamento de Reunião de Acompanhamento");
        setBody(`Olá,\n\nGostaria de agendar uma breve reunião de 15 minutos para alinharmos os próximos passos do nosso projeto.\n\nTens disponibilidade na próxima terça ou quarta-feira às 14:00?\n\nAguardo a tua confirmação.\n\nAbraço,`);
      } else {
        setSubject(`Comunicação Oficial: ${aiPrompt || 'Atualização de Serviço'}`);
        setBody(`Olá,\n\nRelativamente a "${aiPrompt || 'o nosso assunto'}", venho por este meio comunicar que os detalhes foram atualizados com sucesso.\n\nPor favor, confirme a receção desta mensagem.\n\nAtenciosamente,`);
      }
      setGeneratingAi(false);
      setIsAiOpen(false);
      setAiPrompt("");
    }, 600);
  };

  return (
    <div className="fixed bottom-0 right-24 w-[520px] bg-[#18181b] rounded-t-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden z-50 transform transition-transform duration-300 ease-out origin-bottom">
      
      {/* Header */}
      <div className="bg-[#27272a] px-4 py-3 flex items-center justify-between cursor-pointer border-b border-white/5" onClick={onClose}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Nova Mensagem</span>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsAiOpen(!isAiOpen); }}
            className="flex items-center gap-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold text-indigo-300 transition-all"
          >
            <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
            <span>RapiAI Assistant</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-zinc-400 hover:text-white transition-colors"><Minus className="w-4 h-4" /></button>
          <button className="text-zinc-400 hover:text-white transition-colors"><Maximize2 className="w-4 h-4" /></button>
          <button className="text-zinc-400 hover:text-white transition-colors" onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
      </div>

      {/* RapiAI Bar Panel */}
      {isAiOpen && (
        <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border-b border-indigo-500/30 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-indigo-200 font-medium">
            <span className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              O que pretende que a RapiAI redija?
            </span>
            <button onClick={() => setIsAiOpen(false)} className="text-zinc-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
          </div>

          <div className="flex gap-1.5">
            <input 
              type="text" 
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Ex: Pedir orçamento de 50 caixas de email..."
              className="flex-1 bg-black/40 border border-indigo-500/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none"
            />
            <button 
              onClick={() => handleGenerateAi()}
              disabled={generatingAi}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              {generatingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Gerar'}
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-zinc-400">Atalhos rápidos:</span>
            <button 
              onClick={() => handleGenerateAi('proposal')}
              className="text-[10px] bg-white/10 hover:bg-white/15 text-zinc-200 px-2 py-0.5 rounded-md"
            >
              💼 Proposta Comercial
            </button>
            <button 
              onClick={() => handleGenerateAi('meeting')}
              className="text-[10px] bg-white/10 hover:bg-white/15 text-zinc-200 px-2 py-0.5 rounded-md"
            >
              📅 Marcar Reunião
            </button>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="flex-1 flex flex-col bg-[#121215]">
        <div className="border-b border-white/5 px-4 py-2 flex items-center">
          <span className="text-zinc-500 text-xs w-12">Para</span>
          <input 
            type="email" 
            value={to}
            onChange={e => setTo(e.target.value)}
            className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none placeholder-zinc-700" 
            placeholder="destinatario@empresa.com"
          />
        </div>
        <div className="border-b border-white/5 px-4 py-2 flex items-center">
          <span className="text-zinc-500 text-xs w-12">Assunto</span>
          <input 
            type="text" 
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="flex-1 bg-transparent border-none text-xs text-white font-medium focus:outline-none" 
            placeholder="Assunto da mensagem..."
          />
        </div>
        
        {/* Editor Area */}
        <div className="flex-1 p-4 h-[260px]">
          <textarea 
            value={body}
            onChange={e => setBody(e.target.value)}
            className="w-full h-full bg-transparent border-none text-xs text-zinc-300 focus:outline-none resize-none leading-relaxed"
            placeholder="Escreva a sua mensagem aqui ou use a RapiAI no topo..."
          />
        </div>
      </div>

      {/* Footer / Toolbar */}
      <div className="bg-[#18181b] border-t border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSend}
            disabled={sending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            {sending ? "A enviar..." : "Enviar"}
            <Send className="w-3.5 h-3.5" />
          </button>
          
          <div className="h-6 w-px bg-white/10 mx-1"></div>
          
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
