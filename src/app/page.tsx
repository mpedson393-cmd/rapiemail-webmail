"use client";

import React, { useState } from 'react';
import { CheckCircle2, Globe, Mail, Sparkles, CheckCheck, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DomainSearchPicker } from '../components/DomainSearchPicker';

function TopNavbar() {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
          <span className="text-white font-bold text-sm tracking-tighter">RE</span>
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold tracking-tight text-lg leading-none">RapiEmail</span>
          <span className="text-[10px] text-zinc-500 font-mono">by RapiMoney LTD</span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <a href="/auth/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
          Entrar
        </a>
        <a href="/auth/register" className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20">
          Criar Conta
        </a>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [selectedDomain, setSelectedDomain] = useState('');

  const handleSelectDomain = (domain: string) => {
    setSelectedDomain(domain);
    router.push(`/auth/register?type=BUSINESS&domain=${encodeURIComponent(domain)}`);
  };

  const handleCheckoutStripe = async (itemType: string) => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType, domainName: selectedDomain || 'rapiemail.online' })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      alert("Erro ao abrir Stripe Checkout.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-between p-6 relative overflow-hidden selection:bg-indigo-500/30">
      <TopNavbar />
      
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Hero Section */}
      <div className="max-w-4xl w-full z-10 text-center space-y-8 pt-32 pb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          Webmail B2B de Luxo com Rastreamento ✓✓ em Tempo Real
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-100 to-zinc-500 leading-tight">
          O seu Email e o seu Site. <br/>
          <span className="text-indigo-400">Na velocidade do pensamento.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Substitua servidores lentos por infraestrutura de classe mundial. Crie o seu domínio corporativo, receba notificações de leitura instantâneas e coloque a sua página no ar.
        </p>

        {/* Domain Search Widget */}
        <div className="max-w-2xl mx-auto pt-6 text-left">
          <div className="bg-[#0e0e11] border border-white/10 p-6 rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              Pesquisar Disponibilidade de Domínio Corporativo:
            </h3>
            <DomainSearchPicker onSelectDomain={handleSelectDomain} />
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-5xl w-full z-10 py-16 border-t border-white/10 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-white">Planos Transparentes e Sem Fidelização</h2>
          <p className="text-zinc-400 text-sm max-w-lg mx-auto">
            Escolha a solução ideal para a sua empresa. Faturação automática e segura gerida pela RapiMoney LTD via Stripe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Plan 1: Email Pro */}
          <div className="bg-[#0e0e11] border border-white/10 rounded-3xl p-8 flex flex-col justify-between space-y-6 hover:border-indigo-500/40 transition-all">
            <div className="space-y-4">
              <div className="inline-flex px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-zinc-300">
                Caixa de Correio Profissional
              </div>
              <h3 className="text-2xl font-bold text-white">RapiEmail Pro</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">10,00 €</span>
                <span className="text-zinc-400 text-sm">/ mês</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ideal para empresários e profissionais liberais que necessitam de um email corporativo com domínio próprio e rastreador de leitura.
              </p>

              <ul className="space-y-2.5 pt-4 border-t border-white/5 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <CheckCheck className="w-4 h-4 text-cyan-400" />
                  <span>Rastreador de Leitura (Visto Duplo ✓✓ em Tempo Real)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <span>10 GB de Armazenamento de Correio</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Assistente de Escrita e Resumo RapiAI</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  <span>Proteção Anti-Spam e Filtro de Vírus Avançado</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleCheckoutStripe('EMAIL_SUBSCRIPTION')}
              className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span>Subscrever Caixa Postal (Stripe)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Plan 2: Complete Website & Email Bundle */}
          <div className="bg-gradient-to-b from-indigo-950/40 via-[#0e0e11] to-[#0e0e11] border border-indigo-500/40 rounded-3xl p-8 flex flex-col justify-between space-y-6 relative shadow-2xl hover:border-indigo-400 transition-all">
            <div className="absolute -top-3.5 right-8 bg-indigo-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
              Mais Popular
            </div>

            <div className="space-y-4">
              <div className="inline-flex px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-xs font-bold text-indigo-300">
                Email + Alojamento de Website
              </div>
              <h3 className="text-2xl font-bold text-white">Empresa Total + Site no Ar</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">30,00 €</span>
                <span className="text-zinc-400 text-sm">/ mês</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Tudo o que a sua empresa precisa num único pacote: Email de luxo e Website oficial no ar com formulário direto.
              </p>

              <ul className="space-y-2.5 pt-4 border-t border-white/5 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span>Alojamento Web de Alta Velocidade no Domínio Oficial</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCheck className="w-4 h-4 text-cyan-400" />
                  <span>Rastreador de Leitura (Visto Duplo ✓✓ em Tempo Real)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Assistente de IA RapiAI Ilimitado</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Formulário de Contacto Web ligado direto à Caixa de Entrada</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleCheckoutStripe('HOSTING_ADDON')}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
            >
              <span>Ativar Pacote Completo (Stripe)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto py-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
        <p>© 2026 RapiEmail — Operado por RapiMoney LTD. Todos os direitos reservados.</p>
        <div className="flex items-center gap-6">
          <a href="/auth/login" className="hover:text-zinc-300 transition-colors">Entrar</a>
          <a href="/auth/register" className="hover:text-zinc-300 transition-colors">Registar</a>
          <a href="https://rapiemail.online" className="hover:text-zinc-300 transition-colors">rapiemail.online</a>
        </div>
      </footer>
    </div>
  );
}
