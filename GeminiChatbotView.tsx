/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ModuleId } from '../../types';
import { 
  Sparkles, 
  Send, 
  Trash2, 
  Copy, 
  Check, 
  Bot, 
  User as UserIcon, 
  RotateCcw, 
  ChevronDown, 
  HelpCircle,
  ExternalLink,
  BookOpen,
  Compass,
  FileCheck,
  ShieldCheck,
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

const STORAGE_KEY = 'tedos_gemini_chat_history';

const SUGGESTED_PROMPTS = [
  {
    title: 'پورٹل کا مکمل ڈیمو اور تعارف',
    prompt: 'مجھے TEDOS سافٹ ویئر کا مکمل ڈیمو اور ٹور دیں کہ اس میں کونسے کونسے پیجز ہیں اور ہر پیج کا کیا مقصد ہے؟',
    icon: Compass,
    badge: 'مکمل ڈیمو'
  },
  {
    title: 'ورک لاگ کیسے فل کریں؟',
    prompt: 'روزانہ ورک لاگ (Daily Work Log) میں کیا کیا فل کرنا ہے؟ اور 5 منٹ سے زیادہ دورانیے پر پروف لنک (Google Meet / Drive) کیوں ضروری ہے؟',
    icon: FileCheck,
    badge: 'ورک لاگ گائیڈ'
  },
  {
    title: 'ٹکٹ سینٹر اور SLA ٹائمر',
    prompt: 'ٹکٹ سینٹر (Tickets) میں کمپلینٹس کیسے ہینڈل کریں؟ ٹکٹ میں لاگ اور فالو اپ کیسے جوڑیں اور SLA کتنا ہوتا ہے؟',
    icon: Layers,
    badge: 'ٹکٹس'
  },
  {
    title: 'کلائنٹ ورک اسپیس اور ہیلتھ اسکور',
    prompt: 'کلائنٹس ڈائریکٹری اور کلائنٹ ورک اسپیس میں کیا کیا ڈیٹا ہوتا ہے؟ کلائنٹ کا ہیلتھ اسکور (Health Score) کیا ہے؟',
    icon: BookOpen,
    badge: 'کلائنٹس'
  },
  {
    title: 'سی او او ڈیش بورڈ اور لاگ کی منظوری',
    prompt: 'سی او او ڈیش بورڈ (COO Dashboard) میں 420 منٹ کا ہدف کیا ہے اور فلگ شدہ لاگز کو Approve یا Reject کیسے کرتے ہیں؟',
    icon: ShieldCheck,
    badge: 'سی او او'
  },
  {
    title: 'رسائی کے اصول (Access Rules) کیسے بدلیں؟',
    prompt: 'یوزر مینجمنٹ میں جا کر مختلف رولز (سپورٹ ایگزیکٹو، ٹیکنیکل وغیرہ) کے ماڈیول اختیارات (Access Rules) کیسے آن یا آف کیے جاتے ہیں؟',
    icon: ShieldCheck,
    badge: 'اختیارات'
  }
];

export const GeminiChatbotView: React.FC = () => {
  const { currentModule, setCurrentModule, currentUser, language } = useApp();
  
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'welcome-1',
        role: 'assistant',
        content: language === 'ur'
          ? `السلام علیکم **${currentUser?.name || 'ساتھی'}**! خوش آمدید! 👋\n\nمیں **TEDOS Gemini ڈیمو اور ٹریننگ گائیڈ** ہوں۔\n\nآپ مجھ سے پورے سافٹ ویئر کے بارے میں کچھ بھی پوچھ سکتے ہیں، مثلاً:\n- 🧭 **کونسے پیج پر کیا ہے اور اسے کیسے استعمال کرنا ہے؟**\n- 📝 **ورک لاگ یا ٹکٹ فارم میں کونسی فیلڈز لازمی ہیں؟**\n- ⏱️ **5 منٹ کے دورانیے پر گوگل میٹ / ڈرائیو پروف لنک کا کیا اصول ہے؟**\n- 👥 **صارفین کے اختیارات اور رول کے اصول کیسے سیٹ ہوتے ہیں؟**\n\nنیچے دیے گئے سوالات پر کلک کریں یا اپنا سوال لکھیے۔ میں آپ کی مکمل رہنمائی کروں گا!`
          : `Hello **${currentUser?.name || 'Team Member'}**! Welcome! 👋\n\nI am the official **TEDOS Gemini AI Guide & Interactive Demo Co-pilot**.\n\nI can guide you step-by-step through every feature of TEDOS:\n- 🧭 **Detailed tour of all pages and workflows**\n- 📝 **How to fill out the Daily Work Log and Ticket forms**\n- ⏱️ **Mandatory proof link policy for sessions > 5 minutes**\n- 👥 **Managing staff and configuring Access Rules (RBAC)**\n\nTap any suggested topic below or type your question in Urdu or English!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.5-flash'
      }
    ];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-2.5-flash'>('gemini-3.8-flash');
  const [activeRole, setActiveRole] = useState<'general_guide' | 'demo_guide' | 'sop_coach' | 'field_helper'>('general_guide');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-execute pending prompt sent from Interactive Demo Guide or Tour
  useEffect(() => {
    try {
      const pendingPrompt = localStorage.getItem('tedos_pending_gemini_prompt');
      if (pendingPrompt && pendingPrompt.trim()) {
        localStorage.removeItem('tedos_pending_gemini_prompt');
        setTimeout(() => {
          handleSendMessage(pendingPrompt.trim());
        }, 300);
      }
    } catch (e) {
      console.error(e);
    }

    const handleAskGeminiEvent = (e: any) => {
      const promptText = e?.detail?.prompt || e?.detail;
      if (promptText && typeof promptText === 'string') {
        handleSendMessage(promptText);
      }
    };
    window.addEventListener('tedos_ask_gemini', handleAskGeminiEvent);

    return () => {
      window.removeEventListener('tedos_ask_gemini', handleAskGeminiEvent);
    };
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content
          })),
          model: selectedModel,
          role: activeRole,
          currentPage: currentModule
        })
      });

      const data = await response.json();

      if (data.success && data.text) {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: data.modelUsed || selectedModel
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        const errorText = data.error || data.fallbackText || 'Gemini سے رابطہ کرنے میں مسئلہ پیش آیا۔';
        const errorMessage: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **توجہ فرمائیں:** ${errorText}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: selectedModel
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **نیٹ ورک کا مسئلہ:** سرور سے رابطہ نہیں ہو سکا۔ برائے مہربانی اپنا انٹرنیٹ کنکشن چیک کریں۔`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm(language === 'ur' ? 'کیا آپ تمام چیٹ ہسٹری صاف کرنا چاہتے ہیں؟' : 'Clear all conversation history?')) {
      localStorage.removeItem(STORAGE_KEY);
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: language === 'ur' 
            ? 'چیٹ ہسٹری صاف کر دی گئی ہے۔ نیا سیشن شروع ہے۔ آپ کیا جاننا چاہتے ہیں؟'
            : 'Conversation cleared. How can I help you navigate TEDOS today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: selectedModel
        }
      ]);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-blue-900/90 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-purple-500/30 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-purple-300 shadow-inner">
              <Sparkles size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  {language === 'ur' ? 'TEDOS Gemini ڈیمو و سافٹ ویئر گائیڈ' : 'TEDOS Gemini Software Guide & Demo'}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-400/20 border border-purple-400/40 text-purple-200 font-bold">
                  AI Co-pilot
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5 max-w-xl leading-relaxed">
                {language === 'ur'
                  ? 'سافٹ ویئر کا مکمل ڈیمو، ہر پیج کی فیلڈز اور بٹن کا طریقہ، اور تمام 28 قوانین کی رہنمائی حاصل کریں۔'
                  : 'Interactive software walkthroughs, step-by-step form instructions, and 28 TE operational rules tutor.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {/* Clear button */}
            <button
              onClick={handleClearHistory}
              title="Clear Chat History"
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/15"
            >
              <Trash2 size={13} />
              <span>{language === 'ur' ? 'نیا سیشن' : 'Clear Chat'}</span>
            </button>

            {/* Attendance quick portal */}
            <a
              href="https://technoevident.xyz/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-bold flex items-center gap-1.5 border border-emerald-400/30 transition-all shadow-sm"
            >
              <ExternalLink size={13} />
              <span>{language === 'ur' ? 'حاضری پورٹل' : 'Payroll Portal'}</span>
            </a>
          </div>
        </div>

        {/* Configuration Bar: Model & Role selection */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Model Selector */}
          <div className="flex items-center gap-2">
            <span className="text-purple-200/70 text-[11px] font-medium">
              {language === 'ur' ? 'ماڈل:' : 'Model:'}
            </span>
            <div className="flex bg-black/30 backdrop-blur-md p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-3.5-flash')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  selectedModel === 'gemini-3.5-flash'
                    ? 'bg-purple-500 text-white shadow-xs'
                    : 'text-purple-200/70 hover:text-white'
                }`}
              >
                gemini-3.5-flash (عام رہنمائی)
              </button>
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  selectedModel === 'gemini-3.1-flash-lite'
                    ? 'bg-purple-500 text-white shadow-xs'
                    : 'text-purple-200/70 hover:text-white'
                }`}
              >
                gemini-3.1-flash-lite (تیز رفتار)
              </button>
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-3.1-pro-preview')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  selectedModel === 'gemini-3.1-pro-preview'
                    ? 'bg-purple-500 text-white shadow-xs'
                    : 'text-purple-200/70 hover:text-white'
                }`}
              >
                gemini-3.1-pro (گہرا تجزیہ)
              </button>
            </div>
          </div>

          {/* Role Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-purple-200/70 text-[11px] font-medium">
              {language === 'ur' ? 'کردار (Role):' : 'Role:'}
            </span>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as any)}
              className="bg-black/30 border border-white/15 rounded-xl px-2.5 py-1 text-[11px] font-bold text-white focus:outline-hidden cursor-pointer"
            >
              <option value="general_guide" className="bg-slate-900 text-white">
                🧭 Master Software Guide (پورٹل ڈیمو و ٹور)
              </option>
              <option value="demo_guide" className="bg-slate-900 text-white">
                🎬 Interactive Walkthrough (مرحلہ وار ایکشنز)
              </option>
              <option value="sop_coach" className="bg-slate-900 text-white">
                📋 TE SOP & 28 Rules Coach (ایس او پی و قوانین)
              </option>
              <option value="field_helper" className="bg-slate-900 text-white">
                💡 Active Page Assistant (موجودہ پیج کا مددگار)
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {SUGGESTED_PROMPTS.map((item, idx) => {
          const IconCmp = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(item.prompt)}
              className="p-3 rounded-2xl bg-md-surface-container-low hover:bg-purple-500/10 border border-md-surface-variant hover:border-purple-400/40 text-left transition-all group flex items-start gap-2.5 cursor-pointer shadow-2xs"
            >
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-300 group-hover:bg-purple-500 group-hover:text-white transition-colors shrink-0 mt-0.5">
                <IconCmp size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-md-on-surface truncate group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-md-surface-container text-md-outline font-mono">
                    {item.badge}
                  </span>
                </div>
                <p className="text-[11px] text-md-outline truncate mt-0.5">
                  {item.prompt}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chat Thread Box */}
      <div className="rounded-3xl border border-md-surface-variant bg-md-surface-container-lowest overflow-hidden shadow-md flex flex-col h-[520px]">
        
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isBot = msg.role === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Bot size={16} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-3xl p-4 text-xs leading-relaxed space-y-2 ${
                    isBot
                      ? 'bg-md-surface-container-low border border-md-surface-variant text-md-on-surface shadow-xs'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md rounded-tr-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] opacity-70 pb-1 border-b border-current/10">
                    <span className="font-bold flex items-center gap-1">
                      {isBot ? 'Gemini AI Co-pilot' : (currentUser?.name || 'آپ')}
                      {isBot && msg.modelUsed && (
                        <span className="font-mono text-[9px] px-1 rounded bg-black/10 dark:bg-white/10">
                          {msg.modelUsed}
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span>{msg.timestamp}</span>
                      {isBot && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="hover:opacity-100 p-0.5 rounded transition-opacity cursor-pointer"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Render content formatted */}
                  <div className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed select-text">
                    {msg.content}
                  </div>
                </div>

                {!isBot && (
                  <div className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200">
                    <UserIcon size={16} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot size={16} />
              </div>
              <div className="p-3.5 rounded-2xl bg-md-surface-container-low border border-md-surface-variant text-xs flex items-center gap-2 text-purple-600 dark:text-purple-300">
                <div className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                <span className="font-medium">
                  {language === 'ur' ? 'Gemini جواب تیار کر رہا ہے...' : 'Gemini is composing response...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-md-surface-container-low border-t border-md-surface-variant">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                language === 'ur'
                  ? 'Gemini سے سافٹ ویئر کے بارے میں کچھ بھی پوچھیں (مثلاً: ورک لاگ کیسے بھریں؟)...'
                  : 'Ask Gemini anything about TEDOS (e.g. How to log a call or set access rules?)...'
              }
              disabled={loading}
              className="flex-1 bg-md-surface border border-md-surface-variant rounded-2xl px-4 py-3 text-xs text-md-on-surface focus:outline-hidden focus:ring-2 focus:ring-purple-500/40 transition-all placeholder:text-md-outline"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold transition-all shadow-md shadow-purple-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
              title="Send Message"
            >
              <Send size={16} />
            </button>
          </form>

          <div className="flex items-center justify-between px-2 pt-2 text-[10px] text-md-outline">
            <span>
              💡 {language === 'ur' ? 'اردو یا انگلش دونوں میں رہنمائی حاصل کی جا سکتی ہے۔' : 'Supports natural queries in both Urdu and English.'}
            </span>
            <span className="font-mono">
              Powered by Google Gemini 3.5 &amp; 3.1
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
