'use client';

import React from 'react';
import logoImg from '../../assets/images/icon-192.png';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  appName?: string;
  tagline?: string;
  className?: string;
}

export function AppLogo({
  size = 'md',
  showText = false,
  appName = 'स्मार्ट खाता',
  tagline = 'डिजिटल कृषि व बटाई बहीखाता',
  className = '',
}: AppLogoProps) {
  const sizeMap = {
    xs: 'w-7 h-7 rounded-lg',
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl',
    xl: 'w-20 h-20 rounded-3xl',
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 ${className}`}>
      <div
        className={`relative shrink-0 overflow-hidden shadow-md shadow-emerald-950/80 border border-emerald-500/40 bg-[#07150e] ${sizeMap[size]} group`}
      >
        <img
          src={logoImg}
          alt={appName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-amber-400/20 pointer-events-none" />
      </div>

      {showText && (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-extrabold text-base sm:text-lg text-white tracking-tight leading-tight">
              {appName}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
              बटाई बहीखाता
            </span>
          </div>
          {tagline && (
            <p className="text-[10px] sm:text-[11px] text-slate-400 -mt-0.5 truncate">
              {tagline}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
