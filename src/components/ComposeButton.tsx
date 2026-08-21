"use client";
import React, { useState } from 'react';
import { Edit3 } from 'lucide-react';
import { ComposeModal } from './ComposeModal';

export function ComposeButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-3 bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-4 mx-4 mb-4 rounded-2xl font-bold text-[15px] shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/40 active:scale-95"
      >
        <Edit3 className="w-5 h-5" />
        <span>Compor Mensagem</span>
      </button>

      <ComposeModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
