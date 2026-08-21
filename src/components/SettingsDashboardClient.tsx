"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Shield, Sparkles, Sliders, Filter, Repeat, 
  MessageSquare, FileSignature, Smartphone, Globe, Users, 
  Key, Moon, Sun, Check, ExternalLink, Keyboard, Edit2, 
  Plus, Trash2, X, CheckCircle2, RefreshCw
} from 'lucide-react';

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

  // Modals state
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [forwardEmail, setForwardEmail] = useState("");
  const [forwardList, setForwardList] = useState<string[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [teamMembers, setTeamMembers] = useState([
    { name: user.name, email: user.email, role: "Administrador / Dono" },
  ]);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
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

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-indigo-500/30">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-indigo-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-400/30 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-indigo-200" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="h-16 border-b border-white/5 bg-[#0e0e11] flex items-center justify-between px-8 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link 
            href="/inbox" 
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar à Caixa de Entrada</span>
          </Link>
          <div className="h-4 w-px bg-white/10"></div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Email</span>
            <span>&gt;</span>
            <span className="text-zinc-300 font-semibold">Definições</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-500/20">
            RE
          </div>
          <span className="text-sm font-bold text-white tracking-tight">RapiEmail Settings</span>
        </div>
      </header>

      {/* Main Settings Body */}
      <main className="max-w-6xl mx-auto p-8 space-y-8">
        
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Definições da Conta</h1>
          <p className="text-sm text-zinc-500 mt-1">Gerencie a sua identidade, segurança, inteligência artificial e domínios da empresa.</p>
        </div>

        {/* SETTINGS GRID (Clone do Private Email com Dark Mode de Luxo) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* 1. PERFIL CARD */}
          <div className="bg-[#121216] border border-white/5 rounded-3xl p-6 flex flex-col justify-between space-y-6 hover:border-white/10 transition-all shadow-xl">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Perfil</span>
              
              <div className="flex items-center gap-4 pt-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-400/30 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  {user.initials}
                </div>
                <div className="min-w-0 flex-1">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={displayName} 
                        onChange={e => setDisplayName(e.target.value)}
                        className="bg-black/60 border border-indigo-500/50 rounded-lg px-2 py-1 text-xs text-white outline-none w-full"
                      />
                      <button 
                        onClick={() => { setIsEditingName(false); showToast("Nome atualizado!"); }}
                        className="p-1 text-green-400 hover:text-green-300"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white truncate">{displayName}</h3>
                      <button onClick={() => setIsEditingName(true)} className="text-zinc-500 hover:text-white">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate">{user.email}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setActiveModal('shortcuts')}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold rounded-xl transition-colors"
            >
              <Keyboard className="w-4 h-4" />
              <span>Ver atalhos de teclado</span>
            </button>
          </div>

          {/* 2. CENTRO DE SEGURANÇA */}
          <div className="bg-[#121216] border border-white/5 rounded-3xl p-6 flex flex-col justify-between space-y-6 hover:border-white/10 transition-all shadow-xl">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Centro de Segurança</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Gira as suas definições de início de sessão, proteção contra intrusos e sessões ativas.
              </p>
            </div>

            <button 
              onClick={() => setActiveModal('security')}
              className="w-full text-center py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Abrir Centro de Segurança
            </button>
          </div>

          {/* 3. PREFERÊNCIAS DO SISTEMA */}
          <div className="bg-[#121216] border border-white/5 rounded-3xl p-6 flex flex-col justify-between space-y-6 hover:border-white/10 transition-all shadow-xl">
            <div className="space-y-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Preferências do Sistema</h3>
              
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-medium text-zinc-500 block mb-1">Idioma</label>
                  <select 
                    value={language}
                    onChange={e => { setLanguage(e.target.value); showToast(`Idioma alterado para ${e.target.value}`); }}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  >
                    <option value="Português - PT">Português - PT</option>
                    <option value="English (US)">English (US)</option>
                    <option value="Español">Español</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-500 block mb-1">Aparência</label>
                  <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        theme === 'dark' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Moon className="w-3 h-3" />
                      <span>Escuro</span>
                    </button>
                    <button 
                      onClick={() => setTheme('light')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        theme === 'light' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Sun className="w-3 h-3" />
                      <span>Claro</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <span className="text-[10px] text-zinc-500 text-center">Preferências gravadas automaticamente</span>
          </div>

          {/* 4. IA (INTELIGÊNCIA ARTIFICIAL) */}
          <div className="bg-[#121216] border border-white/5 rounded-3xl p-6 flex flex-col justify-between space-y-6 hover:border-white/10 transition-all shadow-xl">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">RapiAI (Assistente Inteligente)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Resumos automáticos de emails longos, correção ortográfica e sugestão de respostas em 1 clique.
              </p>
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-300 font-medium">Ativar Motor IA</span>
                <button 
                  onClick={() => { setAiEnabled(!aiEnabled); showToast(`RapiAI ${!aiEnabled ? 'Ativado' : 'Desativado'}`); }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${aiEnabled ? 'bg-indigo-600' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${aiEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <button 
              onClick={() => showToast("Preferências de IA configuradas para o modelo máximo!")}
              className="w-full text-center py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Gerir Preferências de IA
            </button>
          </div>

          {/* 5. REENCAMINHAMENTO */}
          <div className="bg-[#121216] border border-white/5 rounded-3xl p-6 flex flex-col justify-between space-y-6 hover:border-white/10 transition-all shadow-xl">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Repeat className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Reencaminhamento</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Reencaminha automaticamente cópias dos teus emails para o teu Gmail ou outro endereço externo.
              </p>

              {forwardList.length > 0 && (
                <div className="space-y-1 pt-1">
                  {forwardList.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                      <span className="truncate text-zinc-300 font-mono text-[11px]">{f}</span>
                      <button onClick={() => setForwardList(forwardList.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => setActiveModal('forwarding')}
              className="w-full text-center py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Adicionar Endereço
            </button>
          </div>

          {/* 6. RESPOSTA AUTOMÁTICA */}
          <div className="bg-[#121216] border border-white/5 rounded-3xl p-6 flex flex-col justify-between space-y-6 hover:border-white/10 transition-all shadow-xl">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Resposta Automática</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Informa automaticamente as pessoas quando estiveres de férias ou fora do escritório.
              </p>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-300 font-medium">Estado</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${autoReplyEnabled ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-zinc-500'}`}>
                  {autoReplyEnabled ? 'Ativo' : 'Desativado'}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setActiveModal('autoreply')}
              className="w-full text-center py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Gerir Resposta Automática
            </button>
          </div>

          {/* 7. ASSINATURA */}
          <div className="bg-[#121216] border border-white/5 rounded-3xl p-6 flex flex-col justify-between space-y-6 hover:border-white/10 transition-all shadow-xl">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <FileSignature className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Assinatura de Email</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Adiciona automaticamente a tua assinatura de prestígio no rodapé de cada email enviado.
              </p>
              <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 text-[11px] text-zinc-400 font-mono whitespace-pre-line truncate">
                {signature}
              </div>
            </div>

            <button 
              onClick={() => setActiveModal('signature')}
              className="w-full text-center py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Editar Assinatura
            </button>
          </div>

          {/* 8. APLICAÇÕES DE TERCEIROS (IMAP / SMTP / APPLE MAIL) */}
          <div className="bg-[#121216] border border-white/5 rounded-3xl p-6 flex flex-col justify-between space-y-6 hover:border-white/10 transition-all shadow-xl">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Aplicações de Terceiros</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Liga o teu email ao iPhone Mail, Android, Thunderbird ou Microsoft Outlook.
              </p>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-300 font-medium">Protocolos IMAP/SMTP</span>
                <button 
                  onClick={() => { setProtocolsEnabled(!protocolsEnabled); showToast(`Protocolos ${!protocolsEnabled ? 'Ativados' : 'Desativados'}`); }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${protocolsEnabled ? 'bg-indigo-600' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${protocolsEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <button 
              onClick={() => setActiveModal('protocols')}
              className="w-full text-center py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Ver Configurações de Conexão
            </button>
          </div>

          {/* 9. GESTÃO DE EQUIPA (10€/mês por membro) */}
          <div className="bg-gradient-to-br from-[#121216] to-indigo-950/20 border border-indigo-500/20 rounded-3xl p-6 flex flex-col justify-between space-y-6 hover:border-indigo-500/40 transition-all shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  10€/mês por membro
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Gestão da Equipa</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Crie novos emails corporativos para funcionários no domínio <strong className="text-zinc-200">rapimoneyit.online</strong>.
              </p>
              <div className="text-xs text-zinc-400">
                <strong className="text-white font-bold">{teamMembers.length}</strong> conta(s) ativa(s) na empresa.
              </div>
            </div>

            <button 
              onClick={() => setActiveModal('team')}
              className="w-full text-center py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
            >
              Gerir Membros & Contas
            </button>
          </div>

        </div>

      </main>

      {/* ================= MODALS ================= */}

      {/* Modal: Team Management */}
      {activeModal === 'team' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#121216] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Membros da Equipa (rapimoneyit.online)</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Member Form */}
            <form onSubmit={handleAddTeamMember} className="space-y-3">
              <label className="text-xs font-medium text-zinc-400">Criar Novo Email para Funcionário</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newMemberEmail}
                  onChange={e => setNewMemberEmail(e.target.value)}
                  placeholder="ex: david (ou david@rapimoneyit.online)"
                  className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Criar (+10€)</span>
                </button>
              </div>
            </form>

            {/* List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {teamMembers.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-white">{m.name}</p>
                    <p className="text-[11px] text-zinc-400 font-mono">{m.email}</p>
                  </div>
                  <span className="text-[10px] font-bold bg-white/5 text-zinc-400 px-2 py-1 rounded-md">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>

            <button onClick={() => setActiveModal(null)} className="w-full bg-white/10 hover:bg-white/15 text-white py-2.5 rounded-xl text-xs font-semibold">
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Signature Editor */}
      {activeModal === 'signature' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#121216] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <FileSignature className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Editar Assinatura Predefinida</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea 
              value={signature}
              onChange={e => setSignature(e.target.value)}
              rows={6}
              className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-xs text-zinc-200 outline-none focus:border-indigo-500 font-mono"
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs text-zinc-400 hover:text-white">Cancelar</button>
              <button onClick={() => { setActiveModal(null); showToast("Assinatura guardada com sucesso!"); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20">
                Guardar Assinatura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Protocols / IMAP Info */}
      {activeModal === 'protocols' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#121216] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Parâmetros IMAP &amp; SMTP (iPhone / Outlook)</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-black/50 rounded-xl border border-white/5 space-y-1">
                <p className="text-indigo-400 font-bold">Servidor de Receção (IMAP):</p>
                <p className="text-zinc-300">Servidor: imap.rapiemail.com</p>
                <p className="text-zinc-300">Porta: 993 (SSL/TLS)</p>
                <p className="text-zinc-300">Utilizador: {user.email}</p>
              </div>

              <div className="p-3 bg-black/50 rounded-xl border border-white/5 space-y-1">
                <p className="text-indigo-400 font-bold">Servidor de Envio (SMTP):</p>
                <p className="text-zinc-300">Servidor: smtp.rapiemail.com (Resend)</p>
                <p className="text-zinc-300">Porta: 465 ou 587</p>
                <p className="text-zinc-300">Utilizador: {user.email}</p>
              </div>
            </div>

            <button onClick={() => setActiveModal(null)} className="w-full bg-white/10 hover:bg-white/15 text-white py-2.5 rounded-xl text-xs font-semibold">
              Concluído
            </button>
          </div>
        </div>
      )}

      {/* Modal: Forwarding */}
      {activeModal === 'forwarding' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#121216] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <Repeat className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Adicionar Reencaminhamento</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddForward} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">Endereço de Destino (Gmail, etc.)</label>
                <input 
                  type="email" 
                  value={forwardEmail}
                  onChange={e => setForwardEmail(e.target.value)}
                  placeholder="ex: edsonpc818@gmail.com"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs text-zinc-400 hover:text-white">Cancelar</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20">
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
          <div className="bg-[#121216] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Centro de Segurança &amp; Acesso</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-black/50 rounded-2xl border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Autenticação em Dois Fatores (2FA)</p>
                  <p className="text-[11px] text-zinc-400">Protege a tua conta com código SMS ou Google Authenticator.</p>
                </div>
                <button 
                  onClick={() => { setTwoFactorEnabled(!twoFactorEnabled); showToast(`2FA ${!twoFactorEnabled ? 'Ativado' : 'Desativado'}`); }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${twoFactorEnabled ? 'bg-green-600' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${twoFactorEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="p-4 bg-black/50 rounded-2xl border border-white/5 space-y-2">
                <p className="text-xs font-bold text-white">Sessão Atual</p>
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Navegador Chrome (Windows)</span>
                  <span className="text-green-400 font-bold">Ativa agora</span>
                </div>
              </div>
            </div>

            <button onClick={() => setActiveModal(null)} className="w-full bg-white/10 hover:bg-white/15 text-white py-2.5 rounded-xl text-xs font-semibold">
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Keyboard Shortcuts */}
      {activeModal === 'shortcuts' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#121216] border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <Keyboard className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Atalhos de Teclado Rápidos</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-zinc-400">Compor Novo Email</span>
                <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-bold">C</kbd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-zinc-400">Pesquisar Emails</span>
                <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-bold">Ctrl + K</kbd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-zinc-400">Responder ao Email</span>
                <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-bold">R</kbd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-zinc-400">Mover para o Lixo</span>
                <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-bold"># / Del</kbd>
              </div>
            </div>

            <button onClick={() => setActiveModal(null)} className="w-full bg-white/10 hover:bg-white/15 text-white py-2.5 rounded-xl text-xs font-semibold">
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
