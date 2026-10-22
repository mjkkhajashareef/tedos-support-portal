/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MaterialCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'filled' | 'outlined';
  children: React.ReactNode;
  id?: string;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({
  variant = 'elevated',
  children,
  className = '',
  id,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return 'bg-md-surface-container-low border border-transparent';
      case 'outlined':
        return 'bg-md-surface border border-md-surface-variant';
      case 'elevated':
      default:
        return 'bg-md-surface-container-lowest border border-transparent shadow-xs hover:shadow-md transition-shadow duration-200';
    }
  };

  return (
    <div
      id={id}
      className={`rounded-2xl p-5 ${getVariantStyles()} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
