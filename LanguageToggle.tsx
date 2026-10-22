/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { Languages } from 'lucide-react';

interface LanguageToggleProps {
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = '' }) => {
  const { language, setLanguage } = useApp();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  };

  return (
    <button
      id="global-language-toggle-btn"
      onClick={toggleLanguage}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-md-surface-variant bg-md-surface-container-low hover:bg-md-primary-container/20 text-xs font-bold text-md-on-surface transition-all cursor-pointer select-none ${className}`}
      title={language === 'en' ? 'اردو میں تبدیل کریں (Switch to Urdu)' : 'Switch to English'}
    >
      <Languages size={14} className="text-md-primary" />
      <span>{language === 'en' ? 'English ⇋ اردو' : 'اردو ⇋ English'}</span>
    </button>
  );
};
