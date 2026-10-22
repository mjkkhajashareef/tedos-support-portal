/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showTagline = true,
}) => {
  const [customLogo, setCustomLogo] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tedos_custom_logo_url') || '';
    }
    return '';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setCustomLogo(localStorage.getItem('tedos_custom_logo_url') || '');
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tedos_logo_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tedos_logo_updated', handleStorageChange);
    };
  }, []);

  const sizeMap = {
    sm: { grid: 'gap-0.5', dot: 'w-2 h-2', text: 'text-base', sub: 'text-[9px]', imgHeight: 'h-8' },
    md: { grid: 'gap-1', dot: 'w-3 h-3', text: 'text-xl', sub: 'text-[11px]', imgHeight: 'h-10' },
    lg: { grid: 'gap-1.5', dot: 'w-4 h-4', text: 'text-3xl', sub: 'text-xs', imgHeight: 'h-14' },
    xl: { grid: 'gap-2', dot: 'w-5 h-5', text: 'text-4xl', sub: 'text-sm', imgHeight: 'h-18' },
  };

  const s = sizeMap[size];

  // If user uploaded/configured a custom logo (Requirement #9)
  if (customLogo) {
    return (
      <div className={`flex items-center gap-3 select-none ${className}`}>
        <img
          src={customLogo}
          alt="Custom Organization Logo"
          className={`${s.imgHeight} w-auto object-contain max-w-[200px] rounded-lg`}
          onError={() => setCustomLogo('')}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* 4x4 Colored Dot Matrix Brand Symbol */}
      <div className={`grid grid-cols-4 ${s.grid} shrink-0 p-1`}>
        {/* Row 1 */}
        <span className={`${s.dot} rounded-full bg-[#0074c8]`}></span>
        <span className={`${s.dot} rounded-full bg-[#0074c8]`}></span>
        <span className={`${s.dot} rounded-full bg-[#0074c8]`}></span>
        <span className={`${s.dot} rounded-full bg-[#0074c8]`}></span>

        {/* Row 2 */}
        <span className={`${s.dot} rounded-full bg-[#0074c8]`}></span>
        <span className={`${s.dot} rounded-full bg-[#00a859]`}></span>
        <span className={`${s.dot} rounded-full bg-[#00a859]`}></span>
        <span className={`${s.dot} rounded-full bg-[#00a859]`}></span>

        {/* Row 3 */}
        <span className={`${s.dot} rounded-full bg-[#0074c8]`}></span>
        <span className={`${s.dot} rounded-full bg-[#0074c8]`}></span>
        <span className={`${s.dot} rounded-full bg-[#0074c8]`}></span>
        <span className={`${s.dot} rounded-full bg-[#0074c8]`}></span>

        {/* Row 4 */}
        <span className={`${s.dot} rounded-full bg-[#0074c8]`}></span>
        <span className={`${s.dot} rounded-full bg-[#00a859]`}></span>
        <span className={`${s.dot} rounded-full bg-[#00a859]`}></span>
        <span className={`${s.dot} rounded-full bg-[#00a859]`}></span>

        {/* Row 5 */}
        <span className={`${s.dot} rounded-full bg-[#0074c8]`}></span>
        <span className={`${s.dot} rounded-full bg-[#0074c8]`}></span>
        <span className={`${s.dot} rounded-full bg-[#0074c8]`}></span>
        <span className={`${s.dot} rounded-full bg-[#0074c8]`}></span>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <span className="font-light tracking-[0.25em] text-xs sm:text-sm text-md-on-surface uppercase">
          TECHNO
        </span>
        <span className={`font-black tracking-tight text-[#0073c6] leading-none ${s.text}`}>
          Evident
        </span>
        {showTagline && (
          <span className={`italic font-serif text-md-outline/80 mt-0.5 ${s.sub}`}>
            Solutions for nonprofit organizations
          </span>
        )}
      </div>
    </div>
  );
};
