import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, CheckCircle2, Sparkles, Share, PlusSquare } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Detect standalone display mode
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(iosDevice);

    if (iosDevice && !isInstalled) {
      setCanInstall(true);
    }

    // Check if prompt was already captured
    if (window.deferredPwaPrompt) {
      setCanInstall(true);
    }

    // Listener for custom event dispatched from main.tsx
    const handlePwaAvailable = () => {
      setCanInstall(true);
    };

    window.addEventListener('pwaInstallAvailable', handlePwaAvailable);
    return () => {
      window.removeEventListener('pwaInstallAvailable', handlePwaAvailable);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    const promptEvent = window.deferredPwaPrompt;
    if (!promptEvent) {
      // Fallback
      alert('تطبيق آدم جاهز للتثبيت! يمكنك ضغط قائمة الخيارات في متصفحك واختيار "إضافة إلى الشاشة الرئيسية".');
      return;
    }

    promptEvent.prompt();
    const choiceResult = await promptEvent.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
      setIsInstalled(true);
      setCanInstall(false);
    }
    window.deferredPwaPrompt = null;
  };

  if (isInstalled || dismissed || (!canInstall && !isIos)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[9999] animate-in slide-in-from-bottom duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md border-2 border-emerald-500/50 rounded-2xl p-4 shadow-2xl text-slate-100 flex flex-col gap-3 relative overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-slate-900 border border-emerald-400/40 p-1 flex items-center justify-center shrink-0 shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=128&h=128&fit=crop&q=95&auto=format"
                alt="Adam Mobility App Icon"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-white">تثبيت تطبيق آدم للنقل الذكي</h4>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> PWA
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                ثبّت التطبيق المباشر كـ تطبيق مستقل بدقة عالية وسرعة فائقة بدون متجر.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showIosGuide ? (
          <div className="bg-slate-950/90 rounded-xl p-3 text-xs text-slate-200 border border-slate-800 space-y-2 dir-rtl">
            <p className="font-bold text-amber-400 flex items-center gap-1.5">
              <Share className="w-4 h-4" /> خطوات التثبيت على أجهزة iPhone / iPad:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
              <li>اضغط زر <span className="text-amber-300 font-bold">المشاركة (Share)</span> في متصفح Safari أسفل الشاشة.</li>
              <li>اختر <span className="text-emerald-300 font-bold flex-inline items-center gap-1"><PlusSquare className="w-3 h-3 inline" /> إضافة إلى الشاشة الرئيسية (Add to Home Screen)</span>.</li>
              <li>اضغط <span className="text-white font-bold">إضافة (Add)</span> أعلى الشاشة للبدء فوراً.</li>
            </ol>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              تثبيت التطبيق الآن على الهاتف
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 px-3 rounded-xl border border-slate-700 font-medium transition-colors"
            >
              لاحقاً
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
