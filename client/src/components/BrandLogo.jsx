import React from 'react';
import { Activity } from 'lucide-react';

export default function BrandLogo({ size = 'md', showWordmark = true, darkText = false }) {
  const sizeMap = {
    sm: {
      mark: 'h-11 w-11',
      icon: 'h-5 w-5',
      title: 'text-xl',
      subtitle: 'text-xs'
    },
    md: {
      mark: 'h-12 w-12',
      icon: 'h-6 w-6',
      title: 'text-2xl',
      subtitle: 'text-sm'
    },
    lg: {
      mark: 'h-16 w-16',
      icon: 'h-7 w-7',
      title: 'text-3xl',
      subtitle: 'text-sm'
    }
  };

  const s = sizeMap[size] || sizeMap.md;
  const titleColor = darkText ? 'text-[#123C4A]' : 'text-[#EFFFFD]';
  const subtitleColor = darkText ? 'text-[#325A67]' : 'text-white/85';

  return (
    <div className="inline-flex items-center gap-3.5">
      <div
        className={`${s.mark} rounded-2xl bg-gradient-to-br from-[#0F9D8A] via-[#1F6F8B] to-[#123C4A] flex items-center justify-center shadow-[0_12px_30px_-8px_rgba(18,60,74,0.6)] ring-1 ring-white/25`}
      >
        <Activity className={`${s.icon} text-white`} strokeWidth={2.5} />
      </div>

      {showWordmark && (
        <div className="leading-[1.08]">
          <p className={`${s.title} font-serif font-bold tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)] ${titleColor}`}>NeuroSentinel</p>
          <p className={`${s.subtitle} ${size === 'sm' ? 'hidden md:block' : 'block'} uppercase tracking-[0.12em] font-semibold ${subtitleColor}`}>Connected Care</p>
        </div>
      )}
    </div>
  );
}
