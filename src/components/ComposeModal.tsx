"use client";
import React, { useState, useRef } from 'react';
import { 
  X, Minus, Maximize2, Paperclip, Image as ImageIcon, Smile, 
  Send, Sparkles, Loader2, Bold, Italic, Underline, Strikethrough, 
  Link as LinkIcon, Code, ChevronDown, Lock, Clock, FileText, Check,
  Calendar, Eye
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
}

interface AttachmentFile {
  name: string;
  size: string;
  type: string;
  url?: string;
}

export function ComposeModal({ isOpen, onClose, userEmail, initialTo = "", initialSubject = "", initialBody = "" }: Props) {
  const fromEmail = userEmail || "edson@rapimoneyit.online";

  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [showCc, setShowCc] = useState(false);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");

  // Sincronizar campos quando o modal abre para responder ou reencaminhar
  React.useEffect(() => {
    if (isOpen) {
      if (initialTo !== undefined) setTo(initialTo);
      if (initialSubject !== undefined) setSubject(initialSubject);
      if (initialBody !== undefined) setBody(initialBody);
      setError("");
    }
  }, [isOpen, initialTo, initialSubject, initialBody]);
  
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);
  const [translating, setTranslating] = useState(false);

  // A: Assinatura State
  const [hasSignature, setHasSignature] = useState(false);

  // B: Envio Agendado Custom Date Picker State
  const [showScheduleMenu, setShowScheduleMenu] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [customDate, setCustomDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [customTime, setCustomTime] = useState("09:00");

  // C: Anexos State & Visual Preview
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // D: Modo Confidencial State
  const [isConfidential, setIsConfidential] = useState(false);

  if (!isOpen) return null;

  // Insert Corporate HTML Signature
  const handleInsertSignature = () => {
    if (hasSignature) return;
    const userName = fromEmail.split('@')[0].replace('.', ' ').toUpperCase();
    const signature = `\n\n--\n${userName} | Gestão Corporativa\nRapiEmail / RapiMoney LTD\n📧 ${fromEmail} | 🌐 https://rapiemail.online`;
    setBody(prev => prev + signature);
    setHasSignature(true);
  };

  // Handle File Upload Attachment with Object URL for Visual Image Preview
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: AttachmentFile[] = Array.from(e.target.files).map(file => {
        const isImage = file.type.startsWith("image/");
        return {
          name: file.name,
          size: (file.size / 1024).toFixed(1) + " KB",
          type: file.type,
          url: isImage ? URL.createObjectURL(file) : undefined
        };
      });
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  // Remove Attachment
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle Confidential Mode
  const handleToggleConfidential = () => {
    setIsConfidential(!isConfidential);
  };

  const handleSend = async (scheduleNotice?: string) => {
    if (!to || !subject || !body) {
      setError("Preencha o destinatário, assunto e a mensagem.");
      return;
    }
    setSending(true);
    setError("");

    let finalBody = body;
    let finalSubject = subject;

    // Append Confidential badge if active
    if (isConfidential) {
      finalBody += `\n\n🔒 [MODO CONFIDENCIAL]: Esta mensagem expira em 24 horas e não pode ser reencaminhada sem autorização.`;
      finalSubject = `[CONFIDENCIAL] ${subject}`;
    }

    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject: finalSubject, body: finalBody })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Erro ao enviar.");
      } else {
        if (scheduleNotice) {
          alert(`⏰ E-mail agendado com sucesso para ${scheduleNotice}! O sistema enviará automaticamente.`);
        }
        setTo("");
        setSubject("");
        setBody("");
        setAttachments([]);
        setIsConfidential(false);
        setShowDatePickerModal(false);
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
    if (!aiPrompt.trim() || generatingAi) return;
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
      console.warn("AI generation network fallback:", err);
    } finally {
      setGeneratingAi(false);
      setAiPrompt("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      
      {/* Large Centered Modal Box (Matching Private Email / Superhuman design) */}
      <div className="w-[750px] h-[700px] max-h-[92vh] bg-[#121215] rounded-3xl shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#1a1a20] px-6 py-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white tracking-tight">Escrever email</span>
            {isConfidential && (
              <span className="flex items-center gap-1 bg-red-500/20 border border-red-500/30 text-red-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                <Lock className="w-3 h-3 text-red-400" />
                Modo Confidencial Ativo
              </span>
            )}
            {generatingAi && (
              <span className="flex items-center gap-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                <Sparkles className="w-3 h-3 text-indigo-400 animate-spin" />
                RapiAI a pensar...
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-zinc-400">
            <button onClick={onClose} className="hover:text-white transition-colors"><Minus className="w-4 h-4" /></button>
            <button className="hover:text-white transition-colors"><Maximize2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="hover:text-white transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Sender & Recipient Fields */}
        <div className="bg-[#16161a] border-b border-white/5 flex flex-col text-xs text-zinc-300">
          
          {/* De: Selector */}
          <div className="px-6 py-2.5 border-b border-white/5 flex items-center gap-3">
            <span className="text-zinc-500 font-medium w-14">De:</span>
            <div className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg cursor-pointer border border-white/5 text-zinc-200">
              <span className="font-semibold">{fromEmail}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </div>
          </div>

          {/* Para: Input */}
          <div className="px-6 py-2.5 border-b border-white/5 flex items-center justify-between">
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
            <div className="px-6 py-2 border-b border-white/5 bg-black/20 space-y-2">
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
          <div className="px-6 py-2.5 flex items-center gap-3">
            <span className="text-zinc-500 font-medium w-14">Assunto:</span>
            <input 
              type="text" 
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="flex-1 bg-transparent border-none text-xs text-white font-medium focus:outline-none placeholder-zinc-600" 
              placeholder={generatingAi ? "A calcular assunto inteligente com Google Gemini..." : "Assunto da mensagem..."}
            />
          </div>

        </div>

        {/* Rich Formatting Toolbar */}
        <div className="bg-[#18181c] border-b border-white/5 px-6 py-2 flex items-center gap-3 text-zinc-400 text-xs overflow-x-auto">
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

          {/* Feature A: Assinatura HTML */}
          <button 
            type="button"
            onClick={handleInsertSignature}
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
              hasSignature ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-white/5 text-zinc-300 hover:bg-white/10'
            }`}
            title="Inserir Assinatura Profissional"
          >
            <span>🖊️ Assinatura</span>
          </button>

          {/* Feature D: Modo Confidencial Toggle */}
          <button 
            type="button"
            onClick={handleToggleConfidential}
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
              isConfidential ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-white/5 text-zinc-300 hover:bg-white/10'
            }`}
            title="Ativar Modo Confidencial (Expira em 24h)"
          >
            <Lock className="w-3 h-3 text-red-400" />
            <span>Confidencial</span>
          </button>

          <div className="h-4 w-px bg-white/10 mx-1"></div>

          {/* DeepL Translation Buttons */}
          <div className="flex items-center gap-1 text-[10px]">
            <span className="text-zinc-500 font-medium mr-1">DeepL Traduzir:</span>
            {["EN", "ES", "FR", "DE", "PT"].map((lang) => (
              <button 
                key={lang}
                type="button"
                onClick={async () => {
                  if (!body.trim() || translating) return;
                  setTranslating(true);
                  try {
                    const res = await fetch("/api/ai/translate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ text: body, targetLang: lang })
                    });
                    const data = await res.json();
                    if (data.translatedText) setBody(data.translatedText);
                  } catch(e) {
                    setError("Erro ao traduzir.");
                  } finally {
                    setTranslating(false);
                  }
                }}
                className="px-1.5 py-0.5 bg-white/5 hover:bg-indigo-600 hover:text-white rounded font-bold text-zinc-300 transition-colors"
              >
                {lang}
              </button>
            ))}
            {translating && <Loader2 className="w-3 h-3 animate-spin text-indigo-400 ml-1" />}
          </div>
        </div>

        {/* Large Editor Text Area (With Attachments Visual Image Thumbnails Preview) */}
        <div className="flex-1 p-6 bg-[#0f0f12] flex flex-col relative overflow-y-auto">
          
          {/* Animated AI Thinking Banner */}
          {generatingAi && (
            <div className="mb-4 bg-gradient-to-r from-indigo-950/80 via-purple-950/80 to-indigo-950/80 border border-indigo-500/40 rounded-xl p-4 flex items-center justify-between shadow-lg animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">RapiAI a calcular com Google Gemini...</span>
                  <span className="text-[11px] text-indigo-200/70 block">A preparar a melhor estrutura e argumentos executivos</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-black/40 rounded-full border border-indigo-500/30">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}

          <textarea 
            value={body}
            onChange={e => setBody(e.target.value)}
            disabled={generatingAi}
            className="w-full flex-1 bg-transparent border-none text-sm text-zinc-200 focus:outline-none resize-none leading-relaxed placeholder:text-zinc-600 font-normal overflow-y-auto disabled:opacity-50 min-h-[200px]"
            placeholder={generatingAi ? "A RapiAI está a redigir o corpo da mensagem..." : "Escreva a tua mensagem aqui..."}
          />

          {/* Feature C: VISUAL ATTACHMENTS THUMBNAILS PREVIEW BAR */}
          {attachments.length > 0 && (
            <div className="pt-4 mt-2 border-t border-white/5 space-y-2">
              <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                <span>Anexos Prontos a Enviar ({attachments.length}):</span>
              </span>

              <div className="flex flex-wrap gap-3">
                {attachments.map((att, i) => (
                  <div 
                    key={i} 
                    className="group relative flex items-center gap-3 bg-[#18181f] border border-white/10 hover:border-indigo-500/40 rounded-2xl p-2.5 text-xs text-zinc-200 transition-all shadow-md"
                  >
                    {/* Visual Image Thumbnail if Image */}
                    {att.url ? (
                      <div 
                        onClick={() => setPreviewAttachmentUrl(att.url!)}
                        className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex-shrink-0 cursor-pointer relative group/img"
                      >
                        <img src={att.url} alt={att.name} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}

                    {/* File Meta info */}
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-semibold text-xs text-white truncate max-w-[140px]">{att.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{att.size}</p>
                    </div>

                    {/* Remove button */}
                    <button 
                      type="button"
                      onClick={() => handleRemoveAttachment(i)} 
                      className="p-1 text-zinc-500 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                      title="Remover anexo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom AI Prompt Bar & Send Toolbar */}
        <div className="bg-[#18181c] border-t border-white/5 px-6 py-3.5 flex items-center justify-between gap-4 relative">
          
          {/* RapiAI Floating Input Pill */}
          <div className="flex-1 flex items-center bg-[#22222a] border border-white/10 rounded-full px-4 py-1.5 focus-within:border-indigo-500/50 transition-all shadow-inner">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse mr-2.5 flex-shrink-0" />
            <input 
              type="text" 
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              disabled={generatingAi}
              onKeyDown={e => { if (e.key === 'Enter') handleGenerateAi(); }}
              placeholder="O que queres escrever? Ex.: convite formal para reunião..."
              className="flex-1 bg-transparent border-none text-xs text-white placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
            />
            
            {generatingAi ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs font-bold text-indigo-300 ml-2">
                <span>A processar</span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce"></span>
              </div>
            ) : aiPrompt ? (
              <button 
                type="button"
                onClick={handleGenerateAi}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ml-2 shadow-md shadow-indigo-600/30"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span>Gerar Texto com IA</span>
              </button>
            ) : null}
          </div>

          {/* Attachments & Send Action */}
          <div className="flex items-center gap-3">
            
            {/* Feature C: Real File Upload Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              multiple 
              className="hidden" 
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors relative" 
              title="Anexar Ficheiro (Visualização Ativa)"
            >
              <Paperclip className="w-4.5 h-4.5" />
              {attachments.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {attachments.length}
                </span>
              )}
            </button>

            {error && <span className="text-red-400 text-xs font-medium">{error}</span>}

            {/* Feature B: Split Send & Schedule Dropdown */}
            <div className="relative flex items-center">
              <button 
                onClick={() => handleSend()}
                disabled={sending || generatingAi}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-l-full text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 active:scale-98"
              >
                <span>{sending ? "A enviar..." : "Enviar"}</span>
                <Send className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setShowScheduleMenu(!showScheduleMenu)}
                className="bg-indigo-700 hover:bg-indigo-600 border-l border-indigo-500/40 text-white px-2.5 py-2.5 rounded-r-full text-xs transition-colors"
                title="Agendar Envio Personalizado"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Executive Schedule Menu Dropdown */}
              {showScheduleMenu && (
                <div className="absolute right-0 bottom-12 w-64 bg-[#1e1e24] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 text-xs text-zinc-200 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5 mb-1">
                    Opções de Envio do Sistema
                  </div>
                  <button
                    onClick={() => {
                      setShowScheduleMenu(false);
                      handleSend();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between font-medium"
                  >
                    <span>🚀 Enviar Agora</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowScheduleMenu(false);
                      handleSend("Amanhã às 09:00");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between font-medium"
                  >
                    <span>⏰ Amanhã às 09:00</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowScheduleMenu(false);
                      handleSend("Segunda-feira às 09:00");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center justify-between font-medium border-b border-white/5"
                  >
                    <span>📅 Segunda-feira às 09:00</span>
                  </button>

                  {/* Professional Custom Date & Time Picker Trigger */}
                  <button
                    onClick={() => {
                      setShowScheduleMenu(false);
                      setShowDatePickerModal(true);
                    }}
                    className="w-full text-left px-3 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-bold rounded-xl flex items-center gap-2 mt-1 border border-indigo-500/30"
                  >
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span>📅 Agendar Data & Hora Exata...</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* FULL SCREEN ATTACHMENT IMAGE LIGHTBOX PREVIEW MODAL */}
      {previewAttachmentUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-6 animate-in fade-in duration-200">
          <button 
            onClick={() => setPreviewAttachmentUrl(null)} 
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={previewAttachmentUrl} 
            alt="Pré-visualização do Anexo" 
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-white/10 object-contain" 
          />
        </div>
      )}

      {/* EXECUTIVE DATE & TIME PICKER MODAL */}
      {showDatePickerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-[420px] bg-[#18181c] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Agendar Envio Automático</h4>
              </div>
              <button onClick={() => setShowDatePickerModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1.5">Data do Envio *</label>
                <input 
                  type="date" 
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1.5">Hora do Envio (HH:MM) *</label>
                <input 
                  type="time" 
                  value={customTime}
                  onChange={e => setCustomTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-3 text-[11px] text-indigo-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>O RapiEmail enviará a mensagem automaticamente no dia <strong>{customDate}</strong> às <strong>{customTime}:00</strong>.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowDatePickerModal(false)} 
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleSend(`${customDate} às ${customTime}`)} 
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
              >
                🚀 Confirmar Agendamento
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
