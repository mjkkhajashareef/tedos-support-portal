/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, X, CloudOff } from 'lucide-react';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

const TOAST_EVENT_NAME = 'tedos_toast_event';

export const emitSystemToast = (toast: Omit<ToastItem, 'id'>) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ToastItem>(TOAST_EVENT_NAME, {
      detail: {
        ...toast,
        id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      }
    })
  );
};

export const SystemToastStack: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const custom = e as CustomEvent<ToastItem>;
      if (!custom.detail) return;
      const item = custom.detail;
      setToasts(prev => [item, ...prev].slice(0, 4));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== item.id));
      }, 5000);
    };

    window.addEventListener(TOAST_EVENT_NAME, handleToast);
    return () => window.removeEventListener(TOAST_EVENT_NAME, handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => {
          const styleMap = {
            success: 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100',
            warning: 'bg-amber-950/95 border-amber-500/50 text-amber-100',
            error: 'bg-red-950/95 border-red-500/50 text-red-100',
            info: 'bg-slate-900/95 border-blue-500/50 text-slate-100'
          }[toast.type];

          const IconNode =
            toast.type === 'success'
              ? CheckCircle2
              : toast.type === 'warning'
              ? AlertTriangle
              : toast.type === 'error'
              ? CloudOff
              : Info;

          const iconColor =
            toast.type === 'success'
              ? 'text-emerald-400'
              : toast.type === 'warning'
              ? 'text-amber-400'
              : toast.type === 'error'
              ? 'text-red-400'
              : 'text-blue-400';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              className={`pointer-events-auto rounded-2xl border p-3.5 shadow-2xl backdrop-blur-md flex items-start gap-2.5 ${styleMap}`}
            >
              <IconNode size={16} className={`${iconColor} shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black tracking-tight truncate">{toast.title}</p>
                <p className="text-[11px] opacity-90 leading-snug mt-0.5">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white shrink-0 cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X size={13} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
