"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simula envio de instruções para recuperação de palavra-passe
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative font-sans">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="mb-6">
          <Link 
            href="/auth/login" 
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao login</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/25">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Recuperar Palavra-passe</h1>
          <p className="text-zinc-400 mt-1.5 text-sm">
            Insere o teu email profissional associado à tua conta RapiEmail.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Instruções Enviadas!</h3>
            <p className="text-sm text-zinc-400">
              Se existir uma conta associada a <span className="text-white font-medium">{email}</span>, enviámos um link para redefinir a tua palavra-passe.
            </p>
            <Link
              href="/auth/login"
              className="inline-block w-full bg-white text-black font-semibold rounded-xl px-4 py-3 hover:bg-zinc-200 transition-all mt-4"
            >
              Regressar ao Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email Profissional</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ex: edson@rapimoneyit.online"
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                required 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-black font-semibold rounded-xl px-4 py-3.5 hover:bg-zinc-200 transition-all mt-4 disabled:opacity-50 active:scale-98 shadow-lg shadow-white/5"
            >
              {loading ? "A enviar..." : "Enviar Link de Recuperação"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
