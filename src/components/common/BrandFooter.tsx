/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface BrandFooterProps {
  className?: string;
}

export const BRAND_FOOTER_TEXT =
  '© 2026 Techno Evident Pvt. Ltd. All Rights Reserved. | Designed & Developed by Sarwath Maheen, coordinated by COO, Techno Evident Mohammed Khaja Shareef';

export const BrandFooter: React.FC<BrandFooterProps> = ({ className = '' }) => {
  return (
    <footer
      dir="ltr"
      className={`w-full py-3 px-4 border-t border-md-surface-variant/70 bg-md-surface-container-low/70 text-center select-text ${className}`}
    >
      <p
        dir="ltr"
        className="text-[11px] font-medium text-md-on-surface-variant/85 tracking-normal leading-relaxed max-w-4xl mx-auto"
      >
        {BRAND_FOOTER_TEXT}
      </p>
    </footer>
  );
};
