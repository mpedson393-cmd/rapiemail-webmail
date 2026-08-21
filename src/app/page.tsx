"use client";

import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

function TopNavbar() {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 w-full">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
          <span className="text-white font-bold text-sm tracking-tighter">RE</span>
        </div>
        <span className="text-white font-semibold tracking-tight text-lg">RapiEmail</span>
      </div>
      <div className="flex items-center gap-6">
        <a href="/auth/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
          Entrar
        </a>
        <a href="/auth/register" className="text-sm font-medium bg-white text-black px-5 py-2.5 rounded-full hover:bg-zinc-200 transition-colors shadow-lg">
          Criar Conta
        </a>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    setStatus('loading');
    setErrorMessage('');
    const email = (e.currentTarget.elements[0] as HTMLInputElement).value;
    
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (data.success || data.error === 'Este email já está na waitlist!') {
        // Redirecionar diretamente para o registo empresarial (Passo 2)
        router.push(`/auth/register?type=BUSINESS&email=${encodeURIComponent(email)}`);
      } else {
        setStatus('error');
        setErrorMessage(data.error || "Ocorreu um erro.");
      }
    } catch(err) {
      setStatus('error');
      setErrorMessage("Erro na rede. Tenta novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-red-500/30">
      <TopNavbar />
      
      {/* Background Glows to simulate "server fire" and "cool cloud" */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl w-full z-10 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Alerta: Data centers tradicionais em baixo
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
          Os servidores deles derreteram. <br/> O seu email não devia.
        </h1>
        
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          O seu provedor de email tradicional deixou-o pendurado? Junte-se à lista de espera da única plataforma de Webmail B2B de luxo construída para redundância global e velocidade absoluta. 
          <strong className="text-white"> Mantenha o seu domínio, mude de infraestrutura.</strong>
        </p>

        <div className="max-w-md mx-auto mt-10 min-h-[80px]">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center space-y-3 animate-in fade-in zoom-in duration-500">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
              <p className="text-lg font-medium text-white">Lugar garantido na Waitlist!</p>
              <p className="text-sm text-zinc-400">Verifique a sua caixa de entrada para confirmar.</p>
            </div>
          ) : (
            <form className="relative group" onSubmit={handleSubmit}>
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center bg-zinc-900 border border-white/10 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-indigo-500 transition-all shadow-2xl">
                <input 
                  type="email" 
                  placeholder="o-seu-email@empresa.com" 
                  required
                  disabled={status === 'loading'}
                  className="flex-1 bg-transparent border-none outline-none text-white px-4 py-3 placeholder:text-zinc-500 disabled:opacity-50"
                />
                <button 
                  type="submit" 
                  disabled={status === 'loading'}
                  className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? 'A Processar...' : 'Garantir Acesso'}
                </button>
              </div>
              {status === 'error' && (
                <p className="text-red-400 text-sm mt-3 animate-in fade-in">{errorMessage}</p>
              )}
            </form>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left border-t border-white/10 pt-16">
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">Traga o seu Domínio</h3>
            <p className="text-sm text-zinc-400">Continue a usar o seu @empresa.com. Apenas alteramos os DNS (MX) para os nossos servidores ultra-rápidos.</p>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">Zero Downtime</h3>
            <p className="text-sm text-zinc-400">Infraestrutura Serverless apoiada pelas melhores APIs de entrega do mundo (Mailgun).</p>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">Velocidade Superhuman</h3>
            <p className="text-sm text-zinc-400">Navegue, pesquise e escreva emails na velocidade do pensamento. Tudo com atalhos de teclado.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
