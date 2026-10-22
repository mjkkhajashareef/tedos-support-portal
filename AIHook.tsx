/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface AIHookProps {
  screenId: string;
  contextMessage?: string;
  className?: string;
  id?: string;
}

export const AIHook: React.FC<AIHookProps> = ({ screenId, contextMessage, className = '', id }) => {
  return (
    <div id={id} className={`flex items-center gap-2 ${className}`}>
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="flex items-center justify-center p-1.5 rounded-full bg-md-tertiary-container text-md-tertiary"
        title={`AI Architecture Hook: ${screenId}`}
      >
        <Sparkles size={14} className="animate-pulse" />
      </motion.div>
      <span className="text-[10px] font-mono font-medium tracking-wide text-md-tertiary/75 uppercase">
        AI Hook: {screenId}
      </span>
      {contextMessage && (
        <span className="hidden sm:inline text-[10px] font-sans text-md-on-surface-variant/60 italic">
          — {contextMessage}
        </span>
      )}
    </div>
  );
};
