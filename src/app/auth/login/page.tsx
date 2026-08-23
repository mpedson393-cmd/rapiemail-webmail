"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    if (res?.error) {
      setError("Credenciais inválidas. Verifique o seu email e palavra-passe.");
      setLoading(false);
    } else {
      router.push("/inbox");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative font-sans">
      
      <div className="w-full max-w-md bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/25">
            <span className="text-white font-bold text-base tracking-tighter">RE</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">RapiEmail</h1>
          <p className="text-zinc-400 mt-1 text-sm">Insere as tuas credenciais para aceder ao Inbox</p>
        </div>

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
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-zinc-300">Palavra-passe</label>
              <Link 
                href="/auth/forgot-password" 
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                Esqueceu-se da palavra-passe?
              </Link>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white placeholder-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {error && <p className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 py-2.5 px-3 rounded-lg">{error}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white text-black font-semibold rounded-xl px-4 py-3.5 hover:bg-zinc-200 transition-all mt-4 disabled:opacity-50 active:scale-98 shadow-lg shadow-white/5"
          >
            {loading ? "A Entrar..." : "Entrar na Plataforma"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-6">
          Ainda não tens conta? <Link href="/auth/register" className="text-white hover:underline font-medium">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
