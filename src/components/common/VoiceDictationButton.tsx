/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, AlertCircle, Globe } from 'lucide-react';

interface VoiceDictationButtonProps {
  onTranscriptChange?: (newText: string) => void;
  onTranscript?: (newText: string) => void;
  currentText?: string;
  lang?: 'ur-PK' | 'en-US' | 'en-IN' | 'hi-IN';
  defaultLang?: string;
  placeholderLabel?: string;
  className?: string;
}

export const VoiceDictationButton: React.FC<VoiceDictationButtonProps> = ({
  onTranscriptChange,
  onTranscript,
  currentText = '',
  lang = 'en-IN',
  defaultLang,
  placeholderLabel,
  className = ''
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [livePreview, setLivePreview] = useState<string>('');
  
  const effectiveInitialLang = (defaultLang || lang) as any;
  const [selectedLang, setSelectedLang] = useState<'en-IN' | 'hi-IN' | 'ur-PK'>(
    effectiveInitialLang === 'ur-PK' || effectiveInitialLang === 'ur' ? 'ur-PK' : 'en-IN'
  );

  const recognitionRef = useRef<any>(null);
  const currentTextRef = useRef<string>(currentText);
  const onTranscriptChangeRef = useRef(onTranscriptChange);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    currentTextRef.current = currentText;
  }, [currentText]);

  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const startListening = () => {
    setErrorMsg(null);
    setLivePreview('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMsg('Voice input not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMsg(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece;
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        setLivePreview(interimTranscript || finalTranscript);

        if (finalTranscript.trim()) {
          const base = (currentTextRef.current || '').trim();
          const updated = base ? `${base} ${finalTranscript.trim()}` : finalTranscript.trim();
          currentTextRef.current = updated;
          if (onTranscriptChangeRef.current) {
            onTranscriptChangeRef.current(updated);
          }
          if (onTranscriptRef.current) {
            onTranscriptRef.current(finalTranscript.trim());
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone permission denied. Please allow mic access in browser settings.');
        } else if (event.error === 'language-not-supported' && selectedLang !== 'en-IN') {
          setSelectedLang('en-IN');
          setErrorMsg('Switched to EN/Hinglish voice mode. Click Voice Note again.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setErrorMsg(`Voice note error (${event.error}). Try speaking clearly.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setLivePreview('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Failed to start voice recognition:', e);
      setErrorMsg('Could not start microphone. Please check mic permissions.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setLivePreview('');
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const cycleLang = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isListening) stopListening();
    setSelectedLang(prev =>
      prev === 'en-IN' ? 'hi-IN' : prev === 'hi-IN' ? 'ur-PK' : 'en-IN'
    );
  };

  if (!isSupported) {
    return (
      <div className="inline-flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
        <AlertCircle size={12} />
        <span>Use Chrome/Edge for Voice Note</span>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={cycleLang}
          title="Switch Voice Recognition Language (EN-IN / Hinglish / Hindi / Urdu)"
          className="px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 transition cursor-pointer flex items-center gap-1"
        >
          <Globe size={11} />
          <span>{selectedLang === 'en-IN' ? 'EN/Hinglish' : selectedLang === 'hi-IN' ? 'Hindi' : 'Urdu'}</span>
        </button>

        <button
          type="button"
          onClick={toggleListening}
          title={isListening ? 'Stop Voice Dictation' : 'Start Voice Note (Bol kar likhein)'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none shadow-2xs ${
            isListening
              ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-500/25'
              : 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/20 border border-emerald-500/30'
          } ${className}`}
        >
          {isListening ? (
            <>
              <Volume2 size={14} className="animate-bounce" />
              <span>{placeholderLabel || 'Listening... (Click to Stop)'}</span>
            </>
          ) : (
            <>
              <Mic size={14} />
              <span>{placeholderLabel || 'Voice Note (بول کر لکھیں)'}</span>
            </>
          )}
        </button>
      </div>

      {livePreview && isListening && (
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium italic max-w-xs truncate">
          🎙️ "{livePreview}"
        </span>
      )}

      {errorMsg && (
        <span className="text-[10px] text-red-500 flex items-center gap-1 font-medium">
          <MicOff size={10} /> {errorMsg}
        </span>
      )}
    </div>
  );
};
