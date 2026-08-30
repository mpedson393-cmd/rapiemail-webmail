"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Shield, Sparkles, Sliders, Filter, Repeat, 
  MessageSquare, FileSignature, Smartphone, Globe, Users, 
  Key, Moon, Sun, Check, ExternalLink, Keyboard, Edit2, 
  Plus, Trash2, X, CheckCircle2, RefreshCw, Camera, Upload, Image as ImageIcon
} from 'lucide-react';
import { SmartAvatar } from './SmartAvatar';

interface Props {
  user: {
    name: string;
    email: string;
    initials: string;
  };
}

export function SettingsDashboardClient({ user }: Props) {
  // State for toggles and interactive elements
  const [displayName, setDisplayName] = useState(user.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [protocolsEnabled, setProtocolsEnabled] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [language, setLanguage] = useState("Português - PT");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [signature, setSignature] = useState(`Com os melhores cumprimentos,\n${user.name}\n${user.email}`);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [forwardEmail, setForwardEmail] = useState("");
  const [forwardList, setForwardList] = useState<string[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [teamMembers, setTeamMembers] = useState([
    { name: user.name, email: user.email, role: "Administrador / Dono" },
  ]);
  const [toastMessage, setToastMessage] = useState("");

  // Carregar tema e foto salvos no arranque
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

  const handleThemeChange = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    try {
      localStorage.setItem('rapi_theme', newTheme);
      if (newTheme === 'light') {
        document.documentElement.classList.add('light');
        document.body.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.body.classList.remove('light');
      }
    } catch (e) {}
    showToast(newTheme === 'light' ? "Tema Claro Apple ativado!" : "Tema Escuro Obsidian ativado!");
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Upload e Gravação de Foto de Perfil Oficial
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      showToast("Por favor escolha uma imagem menor que 4 MB.");
      return;
    }

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setAvatarUrl(base64Data);
      try {
        localStorage.setItem('rapi_avatar', base64Data);
        const res = await fetch("/api/user/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarUrl: base64Data })
        });
        if (res.ok) {
          showToast("Foto de perfil atualizada e sincronizada com sucesso!");
        }
      } catch (err) {
        showToast("Foto salva localmente no navegador!");
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl(null);
    try {
      localStorage.removeItem('rapi_avatar');
      await fetch("/api/user/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: null })
      });
      showToast("Foto de perfil removida.");
    } catch (e) {}
  };

  const handleAddForward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forwardEmail) return;
    setForwardList([...forwardList, forwardEmail]);
    setForwardEmail("");
    showToast("Endereço de reencaminhamento adicionado!");
  };

  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) return;
    const domain = user.email.includes("@") ? user.email.split("@")[1] : "rapimoneyit.online";
    const fullEmail = newMemberEmail.includes("@") ? newMemberEmail : `${newMemberEmail}@${domain}`;
    setTeamMembers([...teamMembers, { name: newMemberEmail.split("@")[0], email: fullEmail, role: "Membro (+10€/mês)" }]);
    setNewMemberEmail("");
    showToast(`Novo email ${fullEmail} criado com sucesso!`);
  };

  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen w-full overflow-y-auto transition-colors duration-300 font-sans selection:bg-indigo-500/30 ${
      isLight ? 'bg-[#F4F5F8] text-slate-800' : 'bg-[#09090b] text-zinc-300'
    }`}>
      
      {/* Hidden File Input for Avatar Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleAvatarFileChange} 
        accept="image/png, image/jpeg, image/webp, image/gif" 
        className="hidden" 
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-indigo-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-400/30 animate-in fade-in slide-in-from-top-4 select-none">
          <CheckCircle2 className="w-5 h-5 text-indigo-200" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className={`h-16 border-b flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 backdrop-blur-2xl transition-colors select-none ${
        isLight ? 'bg-white/85 border-slate-200 shadow-sm' : 'bg-[#0e0e11]/85 border-white/5'
      }`}>
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link 
            href="/inbox" 
            className={`flex items-center gap-1.5 sm:gap-2 text-xs font-semibold px-2.5 sm:px-3 py-2 rounded-xl transition-all shrink-0 ${
              isLight ? 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200' : 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Voltar</span>
          </Link>
          <div className={`h-4 w-px ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}></div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-zinc-500 truncate">
            <span>Email</span>
            <span>&gt;</span>
            <span className={`font-semibold truncate ${isLight ? 'text-slate-900' : 'text-zinc-300'}`}>Definições</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <SmartAvatar from={user.email} customAvatarUrl={avatarUrl} size="sm" />
          <span className={`text-xs sm:text-sm font-bold tracking-tight hidden sm:inline ${isLight ? 'text-slate-900' : 'text-white'}`}>
            RapiEmail Settings
          </span>
        </div>
      </header>

      {/* Main Settings Body (Scroll Livre com Padding Bottom Confortável) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-28 sm:pb-36 animate-fade-in">
        
        <div>
          <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Definições da Conta
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Gerencie a sua identidade, foto de perfil, segurança, inteligência artificial e domínios da empresa.
          </p>
        </div>

        {/* SETTINGS GRID: Mobile (1 col), Tablet (2 cols), Desktop (3 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">

          {/* 1. PERFIL CARD (COM UPLOAD DE FOTO OFICIAL) */}
          <div className={`border rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-6 transition-all shadow-xl ${
            isLight ? 'bg-white border-slate-200/80 hover:border-slate-300 shadow-slate-200/60' : 'bg-[#121216] border-white/5 hover:border-white/10'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Perfil &amp; Foto</span>
                {avatarUrl && (
                  <button 
                    onClick={handleRemoveAvatar}
                    title="Remover Foto de Perfil"
                    className="text-[10px] text-red-500 hover:text-red-600 font-semibold cursor-pointer"
                  >
                    Remover Foto
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-4 pt-1">
                {/* Foto / Avatar Interativo com Upload */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  title="Clique para alterar a sua Foto de Perfil"
                  className="group relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-400/30 flex items-center justify-center text-2xl font-bold text-white shadow-lg cursor-pointer overflow-hidden flex-shrink-0"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user.initials}</span>
                  )}
                  
                  {/* Overlay ao passar o rato */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span className="text-[9px] font-bold">Mudar</span>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={displayName} 
                        onChange={e => setDisplayName(e.target.value)}
                        className={`border rounded-lg px-2 py-1 text-xs outline-none w-full ${
                          isLight ? 'bg-slate-50 border-indigo-500 text-slate-900' : 'bg-black/60 border-indigo-500/50 text-white'
                        }`}
                      />
                      <button 
                        onClick={() => { setIsEditingName(false); showToast("Nome atualizado!"); }}
                        className="p-1 text-green-500 hover:text-green-400 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className={`text-base font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{displayName}</h3>
                      <button onClick={() => setIsEditingName(true)} className="text-zinc-400 hover:text-indigo-500 cursor-pointer">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-zinc-500 font-mono mt-0.5 truncate">{user.email}</p>
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-indigo-500 hover:text-indigo-600 font-semibold flex items-center gap-1 mt-1.5 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{uploadingAvatar ? "A carregar..." : "Carregar Foto de Perfil"}</span>
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setActiveModal('shortcuts')}
              className={`w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 text-zinc-300'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>Ver atalhos de teclado</span>
            </button>
          </div>

          {/* 2. CENTRO DE SEGURANÇA */}
          <div className={`border rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-6 transition-all shadow-xl ${
            isLight ? 'bg-white border-slate-200/80 hover:border-slate-300 shadow-slate-200/60' : 'bg-[#121216] border-white/5 hover:border-white/10'
          }`}>
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Centro de Segurança</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Gira as suas definições de início de sessão, proteção contra intrusos e sessões ativas.
              </p>
            </div>

            <button 
              onClick={() => setActiveModal('security')}
              className={`w-full text-center py-2.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-white/5 hover:bg-white/10 text-white'
              }`}
            >
              Abrir Centro de Segurança
            </button>
          </div>

          {/* 3. PREFERÊNCIAS DO SISTEMA (MODO CLARO & ESCURO ATIVO) */}
          <div className={`border rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-6 transition-all shadow-xl ${
            isLight ? 'bg-white border-slate-200/80 hover:border-slate-300 shadow-slate-200/60' : 'bg-[#121216] border-white/5 hover:border-white/10'
          }`}>
            <div className="space-y-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Preferências do Sistema</h3>
              
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-medium text-zinc-500 block mb-1">Idioma</label>
                  <select 
                    value={language}
                    onChange={e => { setLanguage(e.target.value); showToast(`Idioma alterado para ${e.target.value}`); }}
                    className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 cursor-pointer ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-black/50 border-white/10 text-white'
                    }`}
                  >
                    <option value="Português - PT">Português - PT</option>
                    <option value="English (US)">English (US)</option>
                    <option value="Español">Español</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-500 block mb-1">Aparência (Tema)</label>
                  <div className={`grid grid-cols-2 gap-2 p-1.5 rounded-xl border ${
                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-white/5'
                  }`}>
                    <button 
                      onClick={() => handleThemeChange('dark')}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                        theme === 'dark' 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                          : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Escuro</span>
                    </button>
                    <button 
                      onClick={() => handleThemeChange('light')}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                        theme === 'light' 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                          : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Claro</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <span className="text-[10px] text-zinc-500 text-center">Preferências gravadas automaticamente</span>
          </div>

          {/* 4. IA (INTELIGÊNCIA ARTIFICIAL) */}
          <div className={`border rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-6 transition-all shadow-xl ${
            isLight ? 'bg-white border-slate-200/80 hover:border-slate-300 shadow-slate-200/60' : 'bg-[#121216] border-white/5 hover:border-white/10'
          }`}>
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>RapiAI (Assistente Inteligente)</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Resumos automáticos de emails longos, correção ortográfica e tradução de mensagens em 1 clique.
              </p>
              
              <div className="flex items-center justify-between pt-2">
                <span className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>Ativar Motor IA</span>
                <button 
                  onClick={() => { setAiEnabled(!aiEnabled); showToast(`RapiAI ${!aiEnabled ? 'Ativado' : 'Desativado'}`); }}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${aiEnabled ? 'bg-indigo-600' : isLight ? 'bg-slate-200' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${aiEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <button 
              onClick={() => showToast("Preferências de IA configuradas para o modelo máximo!")}
              className={`w-full text-center py-2.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-white/5 hover:bg-white/10 text-white'
              }`}
            >
              Gerir Preferências de IA
            </button>
          </div>

          {/* 5. REENCAMINHAMENTO */}
          <div className={`border rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-6 transition-all shadow-xl ${
            isLight ? 'bg-white border-slate-200/80 hover:border-slate-300 shadow-slate-200/60' : 'bg-[#121216] border-white/5 hover:border-white/10'
          }`}>
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
                <Repeat className="w-5 h-5" />
              </div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Reencaminhamento</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Reencaminha automaticamente cópias dos teus emails para o teu Gmail ou outro endereço externo.
              </p>

              {forwardList.length > 0 && (
                <div className="space-y-1 pt-1">
                  {forwardList.map((f, i) => (
                    <div key={i} className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg border ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-black/40 border-white/5 text-zinc-300'
                    }`}>
                      <span className="truncate font-mono text-[11px]">{f}</span>
                      <button onClick={() => setForwardList(forwardList.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-400 cursor-pointer">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => setActiveModal('forwarding')}
              className={`w-full text-center py-2.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-white/5 hover:bg-white/10 text-white'
              }`}
            >
              Adicionar Endereço
            </button>
          </div>

          {/* 6. RESPOSTA AUTOMÁTICA */}
          <div className={`border rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-6 transition-all shadow-xl ${
            isLight ? 'bg-white border-slate-200/80 hover:border-slate-300 shadow-slate-200/60' : 'bg-[#121216] border-white/5 hover:border-white/10'
          }`}>
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Resposta Automática</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Informa automaticamente as pessoas quando estiveres de férias ou fora do escritório.
              </p>

              <div className="flex items-center justify-between pt-2">
                <span className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>Estado</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${autoReplyEnabled ? 'bg-green-500/20 text-green-600 border border-green-500/30' : isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/5 text-zinc-500'}`}>
                  {autoReplyEnabled ? 'Ativo' : 'Desativado'}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setActiveModal('autoreply')}
              className={`w-full text-center py-2.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-white/5 hover:bg-white/10 text-white'
              }`}
            >
              Gerir Resposta Automática
            </button>
          </div>

          {/* 7. ASSINATURA */}
          <div className={`border rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-6 transition-all shadow-xl ${
            isLight ? 'bg-white border-slate-200/80 hover:border-slate-300 shadow-slate-200/60' : 'bg-[#121216] border-white/5 hover:border-white/10'
          }`}>
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
                <FileSignature className="w-5 h-5" />
              </div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Assinatura de Email</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Adiciona automaticamente a tua assinatura de prestígio no rodapé de cada email enviado.
              </p>
              <div className={`p-2.5 rounded-xl border text-[11px] font-mono whitespace-pre-line truncate ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-black/40 border-white/5 text-zinc-400'
              }`}>
                {signature}
              </div>
            </div>

            <button 
              onClick={() => setActiveModal('signature')}
              className={`w-full text-center py-2.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-white/5 hover:bg-white/10 text-white'
              }`}
            >
              Editar Assinatura
            </button>
          </div>

          {/* 8. APLICAÇÕES DE TERCEIROS (IMAP / SMTP / APPLE MAIL) */}
          <div className={`border rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-6 transition-all shadow-xl ${
            isLight ? 'bg-white border-slate-200/80 hover:border-slate-300 shadow-slate-200/60' : 'bg-[#121216] border-white/5 hover:border-white/10'
          }`}>
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Aplicações de Terceiros</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Liga o teu email ao iPhone Mail, Android, Thunderbird ou Microsoft Outlook.
              </p>

              <div className="flex items-center justify-between pt-2">
                <span className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>Protocolos IMAP/SMTP</span>
                <button 
                  onClick={() => { setProtocolsEnabled(!protocolsEnabled); showToast(`Protocolos ${!protocolsEnabled ? 'Ativados' : 'Desativados'}`); }}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${protocolsEnabled ? 'bg-indigo-600' : isLight ? 'bg-slate-200' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${protocolsEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <button 
              onClick={() => setActiveModal('protocols')}
              className={`w-full text-center py-2.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-white/5 hover:bg-white/10 text-white'
              }`}
            >
              Ver Configurações de Conexão
            </button>
          </div>

          {/* 9. GESTÃO DE EQUIPA (10€/mês por membro) */}
          <div className={`border rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-6 transition-all shadow-xl ${
            isLight ? 'bg-gradient-to-br from-white to-indigo-50 border-indigo-200 hover:border-indigo-300 shadow-indigo-100/50' : 'bg-gradient-to-br from-[#121216] to-indigo-950/20 border-indigo-500/20 hover:border-indigo-500/40'
          }`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-500 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-600 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  10€/mês por membro
                </span>
              </div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Gestão da Equipa</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Crie novos emails corporativos para funcionários no domínio <strong className={isLight ? "text-slate-800" : "text-zinc-200"}>rapimoneyit.online</strong>.
              </p>
              <div className="text-xs text-zinc-500">
                <strong className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{teamMembers.length}</strong> conta(s) ativa(s) na empresa.
              </div>
            </div>

            <button 
              onClick={() => setActiveModal('team')}
              className="w-full text-center py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              Gerir Membros &amp; Contas
            </button>
          </div>

        </div>

      </main>

      {/* ================= MODALS ================= */}

      {/* Modal: Team Management */}
      {activeModal === 'team' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className={`border rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#121216] border-white/10'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-indigo-500" />
                <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Membros da Equipa (rapimoneyit.online)</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Member Form */}
            <form onSubmit={handleAddTeamMember} className="space-y-3">
              <label className="text-xs font-medium text-zinc-500">Criar Novo Email para Funcionário</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newMemberEmail}
                  onChange={e => setNewMemberEmail(e.target.value)}
                  placeholder="ex: david (ou david@rapimoneyit.online)"
                  className={`flex-1 border rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-black/60 border-white/10 text-white'
                  }`}
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Criar (+10€)</span>
                </button>
              </div>
            </form>

            {/* List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {teamMembers.map((m, idx) => (
                <div key={idx} className={`flex items-center justify-between p-3 border rounded-xl ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/5'
                }`}>
                  <div>
                    <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{m.name}</p>
                    <p className="text-[11px] text-zinc-500 font-mono">{m.email}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                    isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/5 text-zinc-400'
                  }`}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>

            <button onClick={() => setActiveModal(null)} className={`w-full py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-white/10 hover:bg-white/15 text-white'
            }`}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Signature Editor */}
      {activeModal === 'signature' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className={`border rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#121216] border-white/10'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
              <div className="flex items-center gap-3">
                <FileSignature className="w-5 h-5 text-indigo-500" />
                <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Editar Assinatura Predefinida</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea 
              value={signature}
              onChange={e => setSignature(e.target.value)}
              rows={6}
              className={`w-full border rounded-2xl p-4 text-xs outline-none focus:border-indigo-500 font-mono ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-black/60 border-white/10 text-zinc-200'
              }`}
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs text-zinc-500 hover:text-zinc-700 cursor-pointer">Cancelar</button>
              <button onClick={() => { setActiveModal(null); showToast("Assinatura guardada com sucesso!"); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer">
                Guardar Assinatura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Protocols / IMAP Info */}
      {activeModal === 'protocols' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className={`border rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#121216] border-white/10'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-indigo-500" />
                <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Parâmetros IMAP &amp; SMTP (iPhone / Outlook)</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className={`p-3 rounded-xl border space-y-1 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/50 border-white/5'
              }`}>
                <p className="text-indigo-500 font-bold">Servidor de Receção (IMAP):</p>
                <p className={isLight ? 'text-slate-700' : 'text-zinc-300'}>Servidor: imap.rapiemail.com</p>
                <p className={isLight ? 'text-slate-700' : 'text-zinc-300'}>Porta: 993 (SSL/TLS)</p>
                <p className={isLight ? 'text-slate-700' : 'text-zinc-300'}>Utilizador: {user.email}</p>
              </div>

              <div className={`p-3 rounded-xl border space-y-1 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/50 border-white/5'
              }`}>
                <p className="text-indigo-500 font-bold">Servidor de Envio (SMTP):</p>
                <p className={isLight ? 'text-slate-700' : 'text-zinc-300'}>Servidor: smtp.rapiemail.com (Resend)</p>
                <p className={isLight ? 'text-slate-700' : 'text-zinc-300'}>Porta: 465 ou 587</p>
                <p className={isLight ? 'text-slate-700' : 'text-zinc-300'}>Utilizador: {user.email}</p>
              </div>
            </div>

            <button onClick={() => setActiveModal(null)} className={`w-full py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-white/10 hover:bg-white/15 text-white'
            }`}>
              Concluído
            </button>
          </div>
        </div>
      )}

      {/* Modal: Forwarding */}
      {activeModal === 'forwarding' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className={`border rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#121216] border-white/10'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
              <div className="flex items-center gap-3">
                <Repeat className="w-5 h-5 text-indigo-500" />
                <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Adicionar Reencaminhamento</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddForward} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1.5">Endereço de Destino (Gmail, etc.)</label>
                <input 
                  type="email" 
                  value={forwardEmail}
                  onChange={e => setForwardEmail(e.target.value)}
                  placeholder="ex: edsonpc818@gmail.com"
                  className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-500 ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-black/60 border-white/10 text-white'
                  }`}
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs text-zinc-500 hover:text-zinc-700 cursor-pointer">Cancelar</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer">
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Security */}
      {activeModal === 'security' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className={`border rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#121216] border-white/10'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-indigo-500" />
                <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Centro de Segurança &amp; Acesso</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/50 border-white/5'
              }`}>
                <div>
                  <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Autenticação em Dois Fatores (2FA)</p>
                  <p className="text-[11px] text-zinc-500">Protege a tua conta com código SMS ou Google Authenticator.</p>
                </div>
                <button 
                  onClick={() => { setTwoFactorEnabled(!twoFactorEnabled); showToast(`2FA ${!twoFactorEnabled ? 'Ativado' : 'Desativado'}`); }}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${twoFactorEnabled ? 'bg-green-600' : isLight ? 'bg-slate-200' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${twoFactorEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className={`p-4 rounded-2xl border space-y-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/50 border-white/5'
              }`}>
                <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Sessão Atual</p>
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Navegador Chrome (Windows)</span>
                  <span className="text-green-500 font-bold">Ativa agora</span>
                </div>
              </div>
            </div>

            <button onClick={() => setActiveModal(null)} className={`w-full py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-white/10 hover:bg-white/15 text-white'
            }`}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Keyboard Shortcuts */}
      {activeModal === 'shortcuts' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className={`border rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#121216] border-white/10'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
              <div className="flex items-center gap-3">
                <Keyboard className="w-5 h-5 text-indigo-500" />
                <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Atalhos de Teclado Rápidos</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className={`flex justify-between py-1.5 border-b ${isLight ? 'border-slate-200 text-slate-700' : 'border-white/5 text-zinc-400'}`}>
                <span>Compor Novo Email</span>
                <kbd className={`px-2 py-0.5 rounded font-bold ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-white/10 text-white'}`}>C</kbd>
              </div>
              <div className={`flex justify-between py-1.5 border-b ${isLight ? 'border-slate-200 text-slate-700' : 'border-white/5 text-zinc-400'}`}>
                <span>Pesquisar Emails</span>
                <kbd className={`px-2 py-0.5 rounded font-bold ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-white/10 text-white'}`}>Ctrl + K</kbd>
              </div>
              <div className={`flex justify-between py-1.5 border-b ${isLight ? 'border-slate-200 text-slate-700' : 'border-white/5 text-zinc-400'}`}>
                <span>Responder ao Email</span>
                <kbd className={`px-2 py-0.5 rounded font-bold ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-white/10 text-white'}`}>R</kbd>
              </div>
              <div className={`flex justify-between py-1.5 border-b ${isLight ? 'border-slate-200 text-slate-700' : 'border-white/5 text-zinc-400'}`}>
                <span>Mover para o Lixo</span>
                <kbd className={`px-2 py-0.5 rounded font-bold ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-white/10 text-white'}`}># / Del</kbd>
              </div>
            </div>

            <button onClick={() => setActiveModal(null)} className={`w-full py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-white/10 hover:bg-white/15 text-white'
            }`}>
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
