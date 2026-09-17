"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  parseSenderDetails, 
  getAvatarCandidateUrls, 
  getCachedAvatar, 
  setCachedAvatar, 
  markAvatarCandidateFailed,
  ParsedSenderInfo 
} from '@/lib/avatar';

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
  const cacheKey = (
    customAvatarUrl || 
    (sender.isCompanyService && sender.name && sender.name.toLowerCase() !== 'linkedin' 
      ? `${sender.domain}_${sender.name.toLowerCase()}` 
      : (sender.email || sender.name))
  ).trim().toLowerCase();

  const cachedInitial = getCachedAvatar(cacheKey);

  const [candidates, setCandidates] = useState<string[]>(() => getAvatarCandidateUrls(sender, customAvatarUrl));
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(() => cachedInitial);
  const [hasLoaded, setHasLoaded] = useState<boolean>(() => Boolean(cachedInitial));

  // Rastrear se remetente mudou
  const prevFromRef = useRef(from);
  const prevCustomUrlRef = useRef(customAvatarUrl);

  useEffect(() => {
    if (prevFromRef.current !== from || prevCustomUrlRef.current !== customAvatarUrl) {
      prevFromRef.current = from;
      prevCustomUrlRef.current = customAvatarUrl;
      const nextCandidates = getAvatarCandidateUrls(sender, customAvatarUrl);
      setCandidates(nextCandidates);
      setCandidateIndex(0);
      const cached = getCachedAvatar(cacheKey);
      if (cached) {
        setLoadedUrl(cached);
        setHasLoaded(true);
      } else {
        setLoadedUrl(null);
        setHasLoaded(false);
      }
    }
  }, [from, customAvatarUrl, cacheKey, sender]);

  const currentCandidate = candidateIndex < candidates.length ? candidates[candidateIndex] : null;
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.sm;

  // Carregamento e validação assíncrona em background usando window.Image
  // Garante que NUNCA um ícone quebrado do navegador seja pintado no DOM
  useEffect(() => {
    if (hasLoaded || !currentCandidate || typeof window === 'undefined') return;

    let isMounted = true;
    const img = new Image();

    img.onload = () => {
      if (!isMounted) return;
      setLoadedUrl(currentCandidate);
      setHasLoaded(true);
      setCachedAvatar(cacheKey, currentCandidate);
    };

    img.onerror = () => {
      if (!isMounted) return;
      markAvatarCandidateFailed(currentCandidate);
      setCandidateIndex(prev => prev + 1);
    };

    img.src = currentCandidate;

    return () => {
      isMounted = false;
      img.onload = null;
      img.onerror = null;
    };
  }, [currentCandidate, hasLoaded, cacheKey]);

  // Se a imagem já foi validada e carregada com sucesso
  if (hasLoaded && loadedUrl) {
    const isLogo = loadedUrl.includes('google.com/s2/favicons') || 
                  loadedUrl.includes('gstatic.com') || 
                  loadedUrl.includes('devicon') || 
                  loadedUrl.includes('/api/avatar/cache') ||
                  loadedUrl.includes('unavatar.io') ||
                  sender.isCompanyService;

    return (
      <div 
        className={`relative rounded-full overflow-hidden border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs select-none transition-all ${sizeConfig.box} ${
          isLogo ? 'bg-white text-zinc-800' : sender.color.bg
        } ${className}`}
      >
        <img
          src={loadedUrl}
          alt={sender.name}
          className={`${
            isLogo ? 'w-full h-full object-contain p-1' : 'w-full h-full object-cover'
          } animate-in fade-in duration-200`}
          onError={(e) => {
            // Se por algum motivo falhar no DOM, esconde imediatamente sem ícone quebrado
            e.currentTarget.style.display = 'none';
            markAvatarCandidateFailed(loadedUrl);
            setHasLoaded(false);
            setLoadedUrl(null);
            setCandidateIndex(prev => prev + 1);
          }}
        />
      </div>
    );
  }

  // Fallback Elegante: Monograma estilizado com cores pastel Google (exibido enquanto carrega ou se não houver foto)
  return (
    <div 
      className={`rounded-full overflow-hidden border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs font-bold select-none transition-all ${sizeConfig.box} ${sender.color.bg} ${sender.color.text} ${className}`}
      title={sender.name}
    >
      <span>{sender.initial}</span>
    </div>
  );
}
