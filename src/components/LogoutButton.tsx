"use client";
import React from 'react';
import { Settings } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface Props {
  initials: string;
  name: string;
  role: string;
}

export function LogoutButton({ initials, name, role }: Props) {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: '/' })}
      className="flex items-center gap-3 w-full hover:bg-white/5 p-2 rounded-xl transition-colors text-left"
    >
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center font-bold text-[13px]">
          {initials}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-[2.5px] border-[#09090b] rounded-full"></div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-zinc-200 truncate">{name}</p>
        <p className="text-[11px] text-zinc-500 truncate">{role}</p>
      </div>
      <Settings className="w-4 h-4 text-zinc-600 flex-shrink-0" />
    </button>
  );
}
