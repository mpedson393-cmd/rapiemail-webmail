"use client";
import React, { useState, useEffect } from 'react';
import { Settings, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

interface Props {
  initials: string;
  name: string;
  email: string;
}

export function UserProfileFooter({ initials, name, email }: Props) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('rapi_avatar');
      if (cached) setAvatarUrl(cached);

      fetch("/api/user/avatar")
        .then(r => r.json())
        .then(d => {
          if (d.avatarUrl) {
            setAvatarUrl(d.avatarUrl);
            localStorage.setItem('rapi_avatar', d.avatarUrl);
          }
        })
        .catch(() => {});
    } catch(e) {}
  }, []);

  return (
    <div className="flex items-center justify-between gap-2 p-1 rounded-2xl bg-white/[0.02] border border-white/5">
      {/* Clickable Profile that goes to Settings */}
      <Link 
        href="/settings" 
        title="Abrir Definições da Conta"
        className="flex items-center gap-2.5 flex-1 min-w-0 p-1.5 rounded-xl hover:bg-white/5 transition-colors group"
      >
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-400/30 text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-[#09090b] rounded-full"></div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">{name}</p>
          <p className="text-[10px] text-zinc-500 font-mono truncate">{email}</p>
        </div>
      </Link>

      {/* Action Icons: Settings & LogOut */}
      <div className="flex items-center gap-0.5 pr-1">
        <Link 
          href="/settings" 
          title="Definições"
          className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
        </Link>
        <button 
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          title="Terminar Sessão (Sair)"
          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
