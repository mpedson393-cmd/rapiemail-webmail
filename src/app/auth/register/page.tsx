"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Building2, User, Globe, ShieldCheck, Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { DomainSearchPicker } from "@/components/DomainSearchPicker";
import Link from "next/link";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [accountType, setAccountType] = useState<"PERSONAL" | "BUSINESS" | null>(null);
  
  // Informações de Utilizador
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailUsername, setEmailUsername] = useState(""); // Prefixo do email (ex: edson, mario, admin)
  const [recoveryEmail, setRecoveryEmail] = useState(""); // Opcional!
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Domínio
  const [domainStatus, setDomainStatus] = useState<"EXISTING" | "TO_BUY" | null>(null);
  const [domainName, setDomainName] = useState("");
  
  // Pessoal
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  
  // Empresa
  const [companyName, setCompanyName] = useState("");
  const [employeeCount, setEmployeeCount] = useState("1-10");
  const [region, setRegion] = useState("Portugal");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const type = searchParams.get('type');
    const prefillEmail = searchParams.get('email');
    if (type === 'BUSINESS') {
      setAccountType("BUSINESS");
      if (prefillEmail && prefillEmail.includes("@")) {
        setEmailUsername(prefillEmail.split("@")[0]);
        setDomainName(prefillEmail.split("@")[1]);
        setDomainStatus("EXISTING");
      }
      setStep(1);
    }
  }, [searchParams]);

  // Limpeza de domínio
  const cleanDomain = domainName.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^@/, '');
  const cleanUsername = emailUsername.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  const generatedEmail = cleanUsername && cleanDomain ? `${cleanUsername}@${cleanDomain}` : "";

  const handleNext = () => { setError(""); setStep(s => s + 1); };
  const handleBack = () => { setError(""); setStep(s => s - 1); };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const finalLoginEmail = generatedEmail || (cleanDomain.includes("@") ? cleanDomain : `admin@${cleanDomain}`);

    const payload = {
      accountType,
      firstName: firstName || (cleanUsername ? cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1) : "Admin"),
      lastName: lastName || (accountType === "BUSINESS" ? companyName : ""),
      password,
      domainStatus: domainStatus || "EXISTING",
      domainName: cleanDomain.includes("@") ? cleanDomain.split("@")[1] : cleanDomain,
      email: finalLoginEmail,
      recoveryEmail: recoveryEmail || undefined,
      // Personal
      dateOfBirth: dob,
      gender,
      // Business
      companyName: companyName || cleanDomain,
      employeeCount,
      region,
      address
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Ocorreu um erro ao criar conta.");
        setLoading(false);
        return;
      }
      
      const loginRes = await signIn("credentials", { 
        redirect: false, 
        email: data.loginEmail || finalLoginEmail, 
        password 
      });

      if (loginRes?.error) {
        // Se a conta foi criada mas o signIn imediato falhou, redireciona para login com email pré-preenchido
        router.push(`/auth/login?email=${encodeURIComponent(data.loginEmail || finalLoginEmail)}`);
      } else {
        router.push("/inbox");
      }
    } catch(err) {
      setError("Erro de conexão ao servidor. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/10 to-transparent blur-[120px] pointer-events-none rounded-full" />

      <div className="w-full max-w-xl bg-zinc-900/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="text-white font-bold text-sm tracking-tight">RE</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">RapiEmail</h1>
              <p className="text-xs text-zinc-400">Plataforma de E-mail Corporativo & Domínios</p>
            </div>
          </div>
          {step > 0 && (
            <span className="text-xs font-semibold px-3 py-1 bg-white/5 border border-white/10 rounded-full text-zinc-400">
              Passo {step} de {accountType === "BUSINESS" ? "3" : "4"}
            </span>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-6 text-sm flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* STEP 0: TYPE SELECTION */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Criar a sua Conta</h2>
              <p className="text-sm text-zinc-400">Escolha como pretende utilizar a plataforma RapiEmail.</p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => { setAccountType("BUSINESS"); setStep(1); }} 
                className="w-full text-left p-5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-indigo-500/60 rounded-2xl transition-all group relative overflow-hidden"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                    <Building2 className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-base text-white">Conta Empresarial / Empresa</span>
                      <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">Recomendado</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Crie o e-mail oficial da sua empresa, configure domínios corporativos e gira as contas de toda a equipa.
                    </p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => { setAccountType("PERSONAL"); setStep(1); }} 
                className="w-full text-left p-5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-purple-500/60 rounded-2xl transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 group-hover:bg-purple-500/20 transition-colors">
                    <User className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-base text-white">Pessoal / Freelancer</span>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Ideal para profissionais individuais que desejam um e-mail com o seu próprio nome e domínio.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="pt-4 text-center border-t border-white/10">
              <p className="text-xs text-zinc-400">
                Já tem conta no RapiEmail?{" "}
                <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                  Entrar na plataforma
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* --- BUSINESS FLOW (3 SIMPLE STEPS) --- */}
        {accountType === "BUSINESS" && (
          <>
            {/* STEP 1: Empresa & Administrador */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white mb-1.5">Informações da Empresa</h2>
                  <p className="text-xs text-zinc-400">Indique o nome da sua empresa e do responsável pela conta.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Nome da Empresa / Organização *</label>
                    <input 
                      type="text" 
                      placeholder="ex: RapiMoney LTD, Padaria Central" 
                      value={companyName} 
                      onChange={e => setCompanyName(e.target.value)} 
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Nome do Administrador *</label>
                      <input 
                        type="text" 
                        placeholder="Nome próprio" 
                        value={firstName} 
                        onChange={e => setFirstName(e.target.value)} 
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Apelido</label>
                      <input 
                        type="text" 
                        placeholder="Apelido" 
                        value={lastName} 
                        onChange={e => setLastName(e.target.value)} 
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">País / Região</label>
                      <select 
                        value={region} 
                        onChange={e => setRegion(e.target.value)} 
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm"
                      >
                        <option value="Portugal" className="bg-zinc-900">Portugal</option>
                        <option value="Brasil" className="bg-zinc-900">Brasil</option>
                        <option value="Angola" className="bg-zinc-900">Angola</option>
                        <option value="Moçambique" className="bg-zinc-900">Moçambique</option>
                        <option value="Cabo Verde" className="bg-zinc-900">Cabo Verde</option>
                        <option value="Reino Unido" className="bg-zinc-900">Reino Unido</option>
                        <option value="União Europeia" className="bg-zinc-900">Outro País da UE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Nº de Colaboradores</label>
                      <select 
                        value={employeeCount} 
                        onChange={e => setEmployeeCount(e.target.value)} 
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm"
                      >
                        <option value="1-5" className="bg-zinc-900">1 a 5 pessoas</option>
                        <option value="6-20" className="bg-zinc-900">6 a 20 pessoas</option>
                        <option value="21-50" className="bg-zinc-900">21 a 50 pessoas</option>
                        <option value="50+" className="bg-zinc-900">Mais de 50 pessoas</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button onClick={handleBack} className="text-zinc-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-1.5">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                  <button 
                    onClick={handleNext} 
                    disabled={!companyName || !firstName} 
                    className="bg-white text-black font-semibold rounded-xl px-6 py-3 text-sm hover:bg-zinc-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Seguinte <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Domínio Corporativo */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white mb-1.5">O Domínio da Empresa</h2>
                  <p className="text-xs text-zinc-400">Escolha o domínio que irá representar os e-mails da sua empresa.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div 
                    onClick={() => { setDomainStatus("EXISTING"); }} 
                    className={`p-4 border rounded-2xl cursor-pointer transition-all ${domainStatus === "EXISTING" ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Globe className="w-4 h-4 text-indigo-400" />
                      <h3 className="font-semibold text-sm text-white">Usar Domínio Existente</h3>
                    </div>
                    <p className="text-xs text-zinc-400">Tenho um domínio já registado (ex: rapiemail.online ou a minha empresa).</p>
                  </div>

                  <div 
                    onClick={() => { setDomainStatus("TO_BUY"); }} 
                    className={`p-4 border rounded-2xl cursor-pointer transition-all ${domainStatus === "TO_BUY" ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      <h3 className="font-semibold text-sm text-white">Comprar Novo Domínio</h3>
                    </div>
                    <p className="text-xs text-zinc-400">Pesquise com a API Porkbun em tempo real (.com, .online, etc.).</p>
                  </div>
                </div>

                {domainStatus === "TO_BUY" && (
                  <div className="pt-2">
                    <DomainSearchPicker 
                      onSelectDomain={(d) => setDomainName(d)} 
                      selectedDomain={domainName} 
                    />
                  </div>
                )}

                {domainStatus === "EXISTING" && (
                  <div className="pt-2 space-y-2">
                    <label className="block text-xs font-semibold text-zinc-300">Insira o seu domínio corporativo</label>
                    <input 
                      type="text" 
                      placeholder="ex: rapiemail.online ou empresa.com" 
                      value={domainName} 
                      onChange={e => setDomainName(e.target.value)} 
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm"
                    />
                    <p className="text-[11px] text-zinc-500">Pode escrever apenas o domínio (ex: rapiemail.online) ou com e-mail (ex: edson@rapiemail.online).</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button onClick={handleBack} className="text-zinc-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-1.5">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                  <button 
                    onClick={handleNext} 
                    disabled={!domainStatus || !cleanDomain} 
                    className="bg-white text-black font-semibold rounded-xl px-6 py-3 text-sm hover:bg-zinc-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Seguinte <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Criar Email & Palavra-passe */}
            {step === 3 && (
              <form onSubmit={handleFinalSubmit} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white mb-1.5">Criar o seu E-mail Oficial</h2>
                  <p className="text-xs text-zinc-400">Escolha o seu endereço de acesso e defina uma palavra-passe segura.</p>
                </div>

                <div className="space-y-4">
                  {/* Escolha do Prefixo do E-mail */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Endereço de E-mail da Conta</label>
                    <div className="flex items-center bg-black/60 border border-white/10 rounded-xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition">
                      <input 
                        type="text" 
                        placeholder={firstName ? firstName.toLowerCase().replace(/[^a-z0-9]/g, '') : "edson"} 
                        value={emailUsername} 
                        onChange={e => setEmailUsername(e.target.value)} 
                        className="bg-transparent px-4 py-3 text-white placeholder-zinc-600 outline-none text-sm flex-1"
                        required
                      />
                      <span className="px-4 py-3 bg-white/5 border-l border-white/10 text-zinc-400 text-sm font-medium select-none">
                        @{cleanDomain.includes("@") ? cleanDomain.split("@")[1] : cleanDomain}
                      </span>
                    </div>
                  </div>

                  {/* Badge de Pré-visualização ao vivo */}
                  {generatedEmail && (
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div className="text-xs">
                        <span className="text-zinc-400">O seu e-mail de login será: </span>
                        <strong className="text-indigo-300 font-semibold">{generatedEmail}</strong>
                      </div>
                    </div>
                  )}

                  {/* Palavra-passe */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Palavra-passe de Acesso *</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••••••" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white placeholder-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm"
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* E-mail de Recuperação Secundário (100% Opcional!) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-zinc-300">E-mail Secundário de Recuperação</label>
                      <span className="text-[11px] text-zinc-500 font-normal">Opcional</span>
                    </div>
                    <input 
                      type="email" 
                      placeholder="ex: gmail ou outro contacto (apenas se tiver)" 
                      value={recoveryEmail} 
                      onChange={e => setRecoveryEmail(e.target.value)} 
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button type="button" onClick={handleBack} className="text-zinc-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-1.5">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                  <button 
                    type="submit" 
                    disabled={!password || !cleanUsername || loading} 
                    className="bg-white text-black font-semibold rounded-xl px-8 py-3.5 text-sm hover:bg-zinc-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-white/5"
                  >
                    {loading ? "A Criar Conta..." : "Concluir & Entrar no Webmail"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* --- PERSONAL FLOW --- */}
        {accountType === "PERSONAL" && (
          <>
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white mb-1.5">O Seu Nome</h2>
                  <p className="text-xs text-zinc-400">Como prefere ser chamado no seu e-mail pessoal.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Nome Próprio *</label>
                    <input 
                      type="text" 
                      placeholder="ex: Edson" 
                      value={firstName} 
                      onChange={e => setFirstName(e.target.value)} 
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-indigo-500 outline-none transition text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Apelido *</label>
                    <input 
                      type="text" 
                      placeholder="ex: Mendes" 
                      value={lastName} 
                      onChange={e => setLastName(e.target.value)} 
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-indigo-500 outline-none transition text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button onClick={handleBack} className="text-zinc-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-1.5">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                  <button 
                    onClick={handleNext} 
                    disabled={!firstName || !lastName} 
                    className="bg-white text-black font-semibold rounded-xl px-6 py-3 text-sm hover:bg-zinc-200 transition-all disabled:opacity-40 flex items-center gap-2"
                  >
                    Seguinte <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white mb-1.5">Dados Pessoais</h2>
                  <p className="text-xs text-zinc-400">Informações para segurança e verificação da sua conta.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Data de Nascimento</label>
                    <input 
                      type="date" 
                      value={dob} 
                      onChange={e => setDob(e.target.value)} 
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Género</label>
                    <select 
                      value={gender} 
                      onChange={e => setGender(e.target.value)} 
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition text-sm"
                    >
                      <option value="" className="bg-zinc-900">Selecione...</option>
                      <option value="M" className="bg-zinc-900">Masculino</option>
                      <option value="F" className="bg-zinc-900">Feminino</option>
                      <option value="O" className="bg-zinc-900">Outro / Prefiro não dizer</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button onClick={handleBack} className="text-zinc-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-1.5">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                  <button 
                    onClick={handleNext} 
                    className="bg-white text-black font-semibold rounded-xl px-6 py-3 text-sm hover:bg-zinc-200 transition-all flex items-center gap-2"
                  >
                    Seguinte <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white mb-1.5">O Seu Domínio de Email</h2>
                  <p className="text-xs text-zinc-400">Compre um novo domínio oficial ou utilize um domínio que já possui.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div 
                    onClick={() => setDomainStatus("EXISTING")} 
                    className={`p-4 border rounded-2xl cursor-pointer transition-all ${domainStatus === "EXISTING" ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}
                  >
                    <h3 className="font-semibold text-sm text-white mb-1">Usar Domínio Existente</h3>
                    <p className="text-xs text-zinc-400">Já tenho um domínio registado.</p>
                  </div>
                  <div 
                    onClick={() => setDomainStatus("TO_BUY")} 
                    className={`p-4 border rounded-2xl cursor-pointer transition-all ${domainStatus === "TO_BUY" ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}
                  >
                    <h3 className="font-semibold text-sm text-white mb-1">Comprar Novo Domínio</h3>
                    <p className="text-xs text-zinc-400">Pesquise com a API Porkbun em tempo real.</p>
                  </div>
                </div>

                {domainStatus === "TO_BUY" && (
                  <DomainSearchPicker 
                    onSelectDomain={(d) => setDomainName(d)} 
                    selectedDomain={domainName} 
                  />
                )}

                {domainStatus === "EXISTING" && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Insira o seu domínio</label>
                    <input 
                      type="text" 
                      placeholder="ex: edsonmendes.com ou rapiemail.online" 
                      value={domainName} 
                      onChange={e => setDomainName(e.target.value)} 
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-indigo-500 outline-none transition text-sm"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button onClick={handleBack} className="text-zinc-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-1.5">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                  <button 
                    onClick={handleNext} 
                    disabled={!domainStatus || !cleanDomain} 
                    className="bg-white text-black font-semibold rounded-xl px-6 py-3 text-sm hover:bg-zinc-200 transition-all disabled:opacity-40 flex items-center gap-2"
                  >
                    Seguinte <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <form onSubmit={handleFinalSubmit} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white mb-1.5">Criar E-mail & Senha</h2>
                  <p className="text-xs text-zinc-400">Defina o nome de utilizador e a palavra-passe da sua caixa de correio.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Endereço de E-mail</label>
                    <div className="flex items-center bg-black/60 border border-white/10 rounded-xl overflow-hidden focus-within:border-indigo-500 transition">
                      <input 
                        type="text" 
                        placeholder={firstName ? firstName.toLowerCase().replace(/[^a-z0-9]/g, '') : "edson"} 
                        value={emailUsername} 
                        onChange={e => setEmailUsername(e.target.value)} 
                        className="bg-transparent px-4 py-3 text-white placeholder-zinc-600 outline-none text-sm flex-1"
                        required
                      />
                      <span className="px-4 py-3 bg-white/5 border-l border-white/10 text-zinc-400 text-sm font-medium">
                        @{cleanDomain.includes("@") ? cleanDomain.split("@")[1] : cleanDomain}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Palavra-passe *</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••••••" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white placeholder-zinc-600 focus:border-indigo-500 outline-none transition text-sm"
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button type="button" onClick={handleBack} className="text-zinc-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-1.5">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                  <button 
                    type="submit" 
                    disabled={!password || !cleanUsername || loading} 
                    className="bg-white text-black font-semibold rounded-xl px-8 py-3.5 text-sm hover:bg-zinc-200 transition-all disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-white/5"
                  >
                    {loading ? "A Criar Conta..." : "Concluir & Entrar no Webmail"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07090E] flex items-center justify-center text-zinc-400">A carregar...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
