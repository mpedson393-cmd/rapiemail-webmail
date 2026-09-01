"use client";

import React, { useState, useEffect } from 'react';
import { parseSenderDetails, getAvatarCandidateUrls, getCachedAvatar, setCachedAvatar, ParsedSenderInfo } from '@/lib/avatar';

interface SmartAvatarProps {
  from: string;
  customAvatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  xs: { box: "w-6 h-6 text-[10px]", img: "w-6 h-6", logo: "w-3.5 h-3.5" },
  sm: { box: "w-8 h-8 text-xs", img: "w-8 h-8", logo: "w-4 h-4" },
  md: { box: "w-10 h-10 text-sm", img: "w-10 h-10", logo: "w-5 h-5" },
  lg: { box: "w-12 h-12 text-base", img: "w-12 h-12", logo: "w-6 h-6" },
  xl: { box: "w-16 h-16 text-xl", img: "w-16 h-16", logo: "w-8 h-8" },
};

export function SmartAvatar({ from, customAvatarUrl, size = 'sm', className = '' }: SmartAvatarProps) {
  const sender: ParsedSenderInfo = parseSenderDetails(from);
  const cacheKey = (customAvatarUrl || sender.email || sender.name).trim().toLowerCase();

  const [candidates, setCandidates] = useState<string[]>(() => getAvatarCandidateUrls(sender, customAvatarUrl));
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(() => {
    return Boolean(getCachedAvatar(cacheKey));
  });

  // Resetar índice se o remetente mudar
  useEffect(() => {
    const nextCandidates = getAvatarCandidateUrls(sender, customAvatarUrl);
    setCandidates(nextCandidates);
    setCandidateIndex(0);
    const cached = getCachedAvatar(cacheKey);
    setHasLoaded(Boolean(cached));
  }, [from, customAvatarUrl, cacheKey]);

  const currentUrl = candidateIndex < candidates.length ? candidates[candidateIndex] : null;
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.sm;

  const handleImageError = () => {
    setCandidateIndex(prev => prev + 1);
  };

  const handleImageLoad = () => {
    setHasLoaded(true);
    if (currentUrl) {
      setCachedAvatar(cacheKey, currentUrl);
    }
  };

  // Se ainda houver candidatos para testar
  if (currentUrl) {
    const isGoogleFavicon = currentUrl.includes('google.com/s2/favicons');

    return (
      <div 
        className={`relative rounded-full overflow-hidden border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs select-none transition-all ${sizeConfig.box} ${
          isGoogleFavicon ? 'bg-white' : sender.color.bg
        } ${className}`}
      >
        {/* Placeholder / Iniciais enquanto a imagem carrega */}
        {!hasLoaded && (
          <span className={`font-bold ${sender.color.text} absolute inset-0 flex items-center justify-center`}>
            {sender.initial}
          </span>
        )}

        <img
          key={currentUrl}
          src={currentUrl}
          alt={sender.name}
          onError={handleImageError}
          onLoad={handleImageLoad}
          className={`${
            isGoogleFavicon ? sizeConfig.logo : 'w-full h-full object-cover'
          } ${hasLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-150`}
        />
      </div>
    );
  }

  // Fallback Elegante: Monograma estilizado com cores pastel Google
  return (
    <div 
      className={`rounded-full overflow-hidden border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs font-bold select-none transition-all ${sizeConfig.box} ${sender.color.bg} ${sender.color.text} ${className}`}
    >
      <span>{sender.initial}</span>
    </div>
  );
}
