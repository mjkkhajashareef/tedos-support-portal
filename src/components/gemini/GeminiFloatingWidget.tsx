/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, X, Send, Bot, User as UserIcon, Maximize2 } from 'lucide-react';
import { ModuleId } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export const GeminiFloatingWidget: React.FC = () => {
  const { currentModule, setCurrentModule, currentUser, language } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; text: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If already on the dedicated AI Assistant page, hide the floating button
  if (currentModule === ModuleId.AI_ASSISTANT) {
    return null;
  }

  // Get readable page name
  const getPageName = () => {
    switch (currentModule) {
      case ModuleId.DAILY_WORK_LOG:
        return language === 'ur' ? 'ورک لاگ (Work Log)' : 'Daily Work Log';
      case ModuleId.TICKETS:
        return language === 'ur' ? 'ٹکٹ سینٹر (Tickets)' : 'Tickets Center';
      case ModuleId.CLIENTS:
      case ModuleId.CLIENT_WORKSPACE:
        return language === 'ur' ? 'کلائنٹ ورک اسپیس' : 'Clients & Workspace';
      case ModuleId.CLIENT_ACTIVATION:
        return language === 'ur' ? 'نیا کلائنٹ شامل کریں' : 'Client Activation';
      case ModuleId.FOLLOW_UP:
        return language === 'ur' ? 'فالو اپ ٹریکر' : 'Follow-up Tracker';
      case ModuleId.COO_DASHBOARD:
        return language === 'ur' ? 'سی او او ڈیش بورڈ' : 'COO Dashboard';
      case ModuleId.USER_MANAGEMENT:
        return language === 'ur' ? 'یوزر مینجمنٹ و اصول' : 'User Management & Access';
      case ModuleId.POLICIES:
        return language === 'ur' ? 'پالیسیز اور قوانین' : 'Policies & SOPs';
      default:
        return language === 'ur' ? 'ڈیش بورڈ' : 'Dashboard';
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      const page = getPageName();
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          text: language === 'ur'
            ? `السلام علیکم **${currentUser?.name || ''}**! 👋\nآپ اس وقت **${page}** پر ہیں۔\nکیا آپ جاننا چاہتے ہیں کہ اس پیج پر کیا کیا بھرنا ہے یا کوئی بٹن کیسے کام کرتا ہے؟ مجھ سے بلا جھجھک پوچھیے!`
            : `Hello **${currentUser?.name || ''}**! 👋\nYou are currently on **${page}**.\nNeed a quick walkthrough of this screen or what to fill in? Ask me anything!`
        }
      ]);
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const query = (customPrompt || input).trim();
    if (!query || loading) return;

    const userMsg = { id: `u-${Date.now()}`, role: 'user' as const, text: query };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.text })),
          model: 'gemini-3.8-flash',
          role: 'field_helper',
          currentPage: currentModule
        })
      });
      const data = await res.json();
      if (data.success && data.text) {
        setMessages(prev => [...prev, { id: `b-${Date.now()}`, role: 'assistant', text: data.text }]);
      } else {
        setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'assistant', text: data.error || 'معذرت، رابطہ نہیں ہو سکا۔' }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'assistant', text: 'سرور سے رابطہ ممکن نہیں۔' }]);
    } finally {
      setLoading(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={handleOpen}
          className="fixed bottom-20 sm:bottom-6 right-5 z-40 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2.5 cursor-pointer border border-white/25 active:scale-95 transition-all group"
          title="Open Gemini Software Guide"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles size={14} className="text-yellow-300 animate-spin" />
          </div>
          <span className="text-xs font-bold font-sans pr-1">
            {language === 'ur' ? 'Gemini ڈیمو و گائیڈ' : 'Gemini Software Guide'}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </motion.button>
      )}

      {/* Slide-over Mini Assistant Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-96 h-[500px] max-h-[85vh] bg-md-surface-container-lowest border border-purple-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-3.5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles size={15} className="text-yellow-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-none">
                    {language === 'ur' ? 'Gemini سافٹ ویئر گائیڈ' : 'Gemini Software Co-pilot'}
                  </h4>
                  <span className="text-[10px] text-purple-200 block mt-0.5 font-mono">
                    {getPageName()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Maximize to full view */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setCurrentModule(ModuleId.AI_ASSISTANT);
                  }}
                  title="Open Full Page"
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 transition-colors"
                >
                  <Maximize2 size={13} />
                </button>
                {/* Close */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Context Quick Tips */}
            <div className="bg-purple-50 dark:bg-purple-950/40 px-3 py-2 border-b border-purple-100 dark:border-purple-900/40 flex items-center justify-between text-[11px] text-purple-800 dark:text-purple-300">
              <span className="font-semibold truncate">
                💡 {language === 'ur' ? 'اس پیج کی رہنمائی چاہیے؟' : 'Need help with this page?'}
              </span>
              <button
                type="button"
                onClick={() => handleSend(`اس پیج (${getPageName()}) پر کیا کیا فل کرنا ہے اور یہ کیسے کام کرتا ہے؟`)}
                className="font-bold underline cursor-pointer hover:opacity-80 shrink-0 text-[10px]"
              >
                {language === 'ur' ? 'طریقہ بتائیں' : 'Show Guide'}
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
              {messages.map((m) => {
                const isBot = m.role === 'assistant';
                return (
                  <div key={m.id} className={`flex items-start gap-2 ${isBot ? 'justify-start' : 'justify-end'}`}>
                    {isBot && (
                      <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Bot size={12} />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-[11px] leading-relaxed whitespace-pre-wrap select-text ${
                        isBot
                          ? 'bg-md-surface-container border border-md-surface-variant text-md-on-surface'
                          : 'bg-purple-600 text-white rounded-tr-none'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2 text-purple-600 text-[11px] p-2">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-ping" />
                  <span>Gemini لکھ رہا ہے...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-2.5 bg-md-surface-container-low border-t border-md-surface-variant">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={language === 'ur' ? 'کچھ بھی پوچھیں...' : 'Ask question...'}
                  className="flex-1 bg-md-surface border border-md-surface-variant rounded-xl px-3 py-2 text-xs text-md-on-surface focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
