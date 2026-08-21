"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { DomainSearchPicker } from "@/components/DomainSearchPicker";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [accountType, setAccountType] = useState<"PERSONAL" | "BUSINESS" | null>(null);
  
  // Shared
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [domainStatus, setDomainStatus] = useState<"EXISTING" | "TO_BUY" | null>(null);
  const [domainName, setDomainName] = useState("");
  
  // Personal Only
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  
  // Business Only
  const [currentEmail, setCurrentEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [employeeCount, setEmployeeCount] = useState("Apenas o utilizador");
  const [region, setRegion] = useState("Portugal");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const type = searchParams.get('type');
    const prefillEmail = searchParams.get('email');
    if (type === 'BUSINESS' && prefillEmail) {
      setAccountType("BUSINESS");
      setCurrentEmail(prefillEmail);
      setStep(1);
    }
  }, [searchParams]);

  const handleNext = () => { setError(""); setStep(s => s + 1); };
  const handleBack = () => { setError(""); setStep(s => s - 1); };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      accountType,
      firstName,
      lastName,
      password,
      domainStatus,
      domainName,
      // Personal
      dateOfBirth: dob,
      gender,
      // Business
      email: currentEmail, // Admin email
      companyName,
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
      
      await signIn("credentials", { redirect: false, email: data.loginEmail, password });
      router.push("/inbox");
    } catch(err) {
      setError("Erro de rede.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm relative">
        <div className="mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-md shadow-indigo-500/20">
            <span className="text-white font-bold text-xs tracking-tighter">RE</span>
          </div>
          {step === 0 && <h1 className="text-3xl font-medium tracking-tight">Criar Conta no RapiEmail</h1>}
          {step > 0 && accountType === "PERSONAL" && <h1 className="text-3xl font-medium tracking-tight">Perfil Pessoal (Freelancer)</h1>}
          {step > 0 && accountType === "BUSINESS" && <h1 className="text-3xl font-medium tracking-tight">Registo Empresarial</h1>}
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm">{error}</div>}

        {/* STEP 0: TYPE SELECTION */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-zinc-600 mb-6">Escolha o seu perfil para começar a configurar o seu Domínio Profissional.</p>
            <button onClick={() => { setAccountType("PERSONAL"); handleNext(); }} className="w-full text-left p-5 border border-zinc-200 rounded-2xl hover:border-indigo-500 hover:shadow-lg transition-all">
              <span className="block font-semibold text-lg text-zinc-800">Pessoal / Freelancer</span>
              <span className="text-sm text-zinc-500">Quero um domínio profissional com o meu nome (ex: edson.com).</span>
            </button>
            <button onClick={() => { setAccountType("BUSINESS"); handleNext(); }} className="w-full text-left p-5 border border-zinc-200 rounded-2xl hover:border-indigo-500 hover:shadow-lg transition-all">
              <span className="block font-semibold text-lg text-zinc-800">Empresarial / Empresa</span>
              <span className="text-sm text-zinc-500">Quero gerir um domínio corporativo para toda a equipa.</span>
            </button>
          </div>
        )}

        {/* --- PERSONAL FLOW --- */}
        {accountType === "PERSONAL" && (
          <>
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <input type="text" placeholder="Nome Próprio" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border border-zinc-300 rounded-xl p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <input type="text" placeholder="Apelido" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border border-zinc-300 rounded-xl p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="flex justify-between pt-6">
                  <button onClick={handleBack} className="text-indigo-600 font-medium">Voltar</button>
                  <button onClick={handleNext} disabled={!firstName || !lastName} className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-medium disabled:opacity-50">Seguinte</button>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex gap-4">
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="flex-1 border border-zinc-300 rounded-xl p-3 outline-none focus:border-indigo-500" />
                  <select value={gender} onChange={e => setGender(e.target.value)} className="flex-1 border border-zinc-300 rounded-xl p-3 outline-none focus:border-indigo-500">
                    <option value="">Género</option><option value="M">Masculino</option><option value="F">Feminino</option>
                  </select>
                </div>
                <div className="flex justify-between pt-6">
                  <button onClick={handleBack} className="text-indigo-600 font-medium">Voltar</button>
                  <button onClick={handleNext} disabled={!dob || !gender} className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-medium disabled:opacity-50">Seguinte</button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg text-zinc-800">O seu Domínio de Email</h3>
                  <p className="text-sm text-zinc-500">Compre um novo domínio oficial ou use um domínio que já possui.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div onClick={() => setDomainStatus("TO_BUY")} className={`p-5 border rounded-2xl cursor-pointer transition-all ${domainStatus === "TO_BUY" ? 'border-indigo-600 bg-indigo-50/70 shadow-sm' : 'border-zinc-200 hover:border-indigo-300'}`}>
                    <h4 className="font-semibold text-sm mb-1 text-zinc-900">Comprar Novo Domínio</h4>
                    <p className="text-xs text-zinc-500">Pesquise com a API Porkbun (.com, .online, .pt, .io).</p>
                  </div>
                  <div onClick={() => setDomainStatus("EXISTING")} className={`p-5 border rounded-2xl cursor-pointer transition-all ${domainStatus === "EXISTING" ? 'border-indigo-600 bg-indigo-50/70 shadow-sm' : 'border-zinc-200 hover:border-indigo-300'}`}>
                    <h4 className="font-semibold text-sm mb-1 text-zinc-900">Usar Domínio Existente</h4>
                    <p className="text-xs text-zinc-500">Já tenho um domínio no Namecheap / etc.</p>
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
                    <label className="text-xs font-semibold text-zinc-600 block mb-1.5">Insira o seu domínio existente</label>
                    <input 
                      type="text" 
                      placeholder="ex: rapimoneyit.online (ou edson@rapimoneyit.online)" 
                      value={domainName} 
                      onChange={e => setDomainName(e.target.value)} 
                      className="w-full border border-zinc-300 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                )}

                <div className="flex justify-between pt-6">
                  <button onClick={handleBack} className="text-indigo-600 font-medium">Voltar</button>
                  <button onClick={handleNext} disabled={!domainStatus || !domainName} className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-medium disabled:opacity-50">Seguinte</button>
                </div>
              </div>
            )}
            {step === 4 && (
              <form onSubmit={handleFinalSubmit} className="space-y-6">
                <p className="text-sm text-zinc-600 mb-2">Para terminar, crie uma palavra-passe forte para proteger a sua caixa de correio.</p>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Palavra-passe" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-zinc-300 rounded-xl p-3 outline-none focus:border-indigo-500 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex justify-between pt-6">
                  <button type="button" onClick={handleBack} className="text-indigo-600 font-medium">Voltar</button>
                  <button type="submit" disabled={!password || loading} className="bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-lg">Concluir Registo</button>
                </div>
              </form>
            )}
          </>
        )}

        {/* --- BUSINESS FLOW --- */}
        {accountType === "BUSINESS" && (
          <>
            {step === 1 && (
              <div className="space-y-6">
                <p className="text-sm text-zinc-600">Para iniciar o processo empresarial, insira o seu email de contacto atual.</p>
                <input type="email" placeholder="Email Atual do Administrador" value={currentEmail} onChange={e => setCurrentEmail(e.target.value)} className="w-full border border-zinc-300 rounded-xl p-3 outline-none focus:border-indigo-500" />
                <div className="flex justify-between pt-6">
                  <button onClick={handleBack} className="text-indigo-600 font-medium">Voltar</button>
                  <button onClick={handleNext} disabled={!currentEmail} className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-medium disabled:opacity-50">Seguinte</button>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-6">
                <input type="text" placeholder="Nome da Empresa" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full border border-zinc-300 rounded-xl p-3 outline-none focus:border-indigo-500" />
                <input type="text" placeholder="Morada da Sede" value={address} onChange={e => setAddress(e.target.value)} className="w-full border border-zinc-300 rounded-xl p-3 outline-none focus:border-indigo-500" />
                <select value={region} onChange={e => setRegion(e.target.value)} className="w-full border border-zinc-300 rounded-xl p-3 outline-none focus:border-indigo-500 text-zinc-700">
                  <option value="Portugal">Portugal</option><option value="Brasil">Brasil</option><option value="Angola">Angola</option><option value="EUA">Estados Unidos</option>
                </select>
                <div className="flex justify-between pt-6">
                  <button onClick={handleBack} className="text-indigo-600 font-medium">Voltar</button>
                  <button onClick={handleNext} disabled={!companyName || !address} className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-medium disabled:opacity-50">Seguinte</button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg text-zinc-800">O Domínio Corporativo</h3>
                  <p className="text-sm text-zinc-500">Escolha o domínio que representará a sua empresa.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div onClick={() => setDomainStatus("TO_BUY")} className={`p-5 border rounded-2xl cursor-pointer transition-all ${domainStatus === "TO_BUY" ? 'border-indigo-600 bg-indigo-50/70 shadow-sm' : 'border-zinc-200 hover:border-indigo-300'}`}>
                    <h4 className="font-semibold text-sm mb-1 text-zinc-900">Comprar Novo Domínio</h4>
                    <p className="text-xs text-zinc-500">Pesquise com a API Porkbun em tempo real.</p>
                  </div>
                  <div onClick={() => setDomainStatus("EXISTING")} className={`p-5 border rounded-2xl cursor-pointer transition-all ${domainStatus === "EXISTING" ? 'border-indigo-600 bg-indigo-50/70 shadow-sm' : 'border-zinc-200 hover:border-indigo-300'}`}>
                    <h4 className="font-semibold text-sm mb-1 text-zinc-900">Usar Domínio Existente</h4>
                    <p className="text-xs text-zinc-500">Transferir ou ligar DNS já registados.</p>
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
                    <label className="text-xs font-semibold text-zinc-600 block mb-1.5">Insira o seu domínio corporativo</label>
                    <input 
                      type="text" 
                      placeholder="ex: payfonte.com (ou admin@payfonte.com)" 
                      value={domainName} 
                      onChange={e => setDomainName(e.target.value)} 
                      className="w-full border border-zinc-300 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                )}

                <div className="flex justify-between pt-6">
                  <button onClick={handleBack} className="text-indigo-600 font-medium">Voltar</button>
                  <button onClick={handleNext} disabled={!domainStatus || !domainName} className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-medium disabled:opacity-50">Seguinte</button>
                </div>
              </div>
            )}
            {step === 4 && (
              <form onSubmit={handleFinalSubmit} className="space-y-6">
                <p className="text-sm text-zinc-600 mb-2">Por fim, crie uma palavra-passe segura para a conta Administrador da {companyName || "sua empresa"}.</p>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Palavra-passe" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-zinc-300 rounded-xl p-3 outline-none focus:border-indigo-500 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex justify-between pt-6">
                  <button type="button" onClick={handleBack} className="text-indigo-600 font-medium">Voltar</button>
                  <button type="submit" disabled={!password || loading} className="bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-lg">Concluir Configuração</button>
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
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 flex items-center justify-center">A carregar...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
