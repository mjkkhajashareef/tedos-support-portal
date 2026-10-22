import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useApp } from '../../context/AppContext';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { language } = useApp();
  const isUrdu = language === 'ur';
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed or running in standalone mode, do not render
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer select-none animate-pulse-subtle"
        title={isUrdu ? 'موبائل یا ڈیسک ٹاپ پر ایپ انسٹال کریں' : 'Install TEDOS on Mobile/Desktop'}
      >
        <Download size={14} className="text-white shrink-0" />
        <span className="hidden sm:inline">{isUrdu ? 'ایپ انسٹال کریں' : 'Install App'}</span>
        <span className="sm:hidden">{isUrdu ? 'انسٹال' : 'Install'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-install-ios-btn"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer select-none"
          title={isUrdu ? 'آئی فون پر ایپ انسٹال کریں' : 'Install on iPhone / iPad'}
        >
          <Smartphone size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="hidden sm:inline">{isUrdu ? 'آئی فون ایپ' : 'iOS App'}</span>
          <span className="sm:hidden">iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="text-emerald-600" size={20} />
                  <h3 className="font-bold text-sm">
                    {isUrdu ? 'آئی فون / آئی پیڈ پر انسٹالیشن' : 'Install on iPhone / iPad'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">1</span>
                  <span>{isUrdu ? 'سفاری براؤزر کے نیچے شیئر (Share) آئیکن پر کلک کریں۔' : 'Tap the Share icon in Safari toolbar below.'}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">2</span>
                  <span>{isUrdu ? 'نیچے اسکرول کر کے "Add to Home Screen" منتخب کریں۔' : 'Scroll down and select "Add to Home Screen".'}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">3</span>
                  <span>{isUrdu ? 'اب یہ ایپ آپ کی ہوم اسکرین پر نیٹو ایپ کی طرح چلے گی۔' : 'TEDOS will appear on your home screen ready to use.'}</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
              >
                {isUrdu ? 'سمجھ گیا' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
