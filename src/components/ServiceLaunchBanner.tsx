import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, Sparkles, CheckCircle2, ShieldCheck, Wallet, UserCheck, Lock, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ServiceLaunchBannerProps {
  role: 'passenger' | 'driver';
  launchDateTime?: string;
  formattedLaunchDate?: string;
  title?: string;
  customMessage?: string;
  onExploreAction?: () => void;
  compact?: boolean;
}

export const ServiceLaunchBanner: React.FC<ServiceLaunchBannerProps> = ({
  role,
  launchDateTime,
  formattedLaunchDate,
  title,
  customMessage,
  onExploreAction,
  compact = false
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });

  useEffect(() => {
    if (!launchDateTime) return;

    const calculateTime = () => {
      const target = new Date(launchDateTime).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ days, hours, minutes, seconds, totalSeconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [launchDateTime]);

  if (!launchDateTime || timeLeft.totalSeconds <= 0) {
    return null;
  }

  const isDriver = role === 'driver';

  const defaultTitle = isDriver
    ? '🚀 مرحلة تسجيل واعتماد أسطول الكباتن (ما قبل الإطلاق)'
    : '🚀 مرحلة التسجيل المسبق للركاب وبناء الأسطول';

  const defaultMsg = isDriver
    ? 'أهلاً بك كابتن! المنظومة حالياً في مرحلة تسجيل وتدقيق وثائق الكباتن وتجهيز الأسطول. يرجى استكمال رفع وثائق المركبة ورخصة القيادة وتعبئة المحفظة لتكون جاهزاً فور تفعيل استقبال الطلبات.'
    : 'أهلاً بك! نحن حالياً في مرحلة استقبال وتسجيل حسابات الركاب والكباتن لبناء أسطول متكامل. يمكنك استكمال ملفك وتوثيقه وشحن محفظتك، وسيبدأ استقبال طلبات المشاوير رسمياً في الموعد المحدد.';

  const displayTitle = title || defaultTitle;
  const displayMsg = customMessage || defaultMsg;

  if (compact) {
    return (
      <div className={`p-3 rounded-2xl border ${isDriver ? 'bg-amber-950/40 border-amber-500/30 text-amber-200' : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200'} text-right font-sans shadow-lg`}>
        <div className="flex items-center justify-between gap-2 flex-row-reverse mb-2">
          <div className="flex items-center gap-1.5 flex-row-reverse font-bold text-xs">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{displayTitle}</span>
          </div>
          <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full font-mono font-bold text-amber-400">
            {timeLeft.days}ي : {timeLeft.hours}س : {timeLeft.minutes}د : {timeLeft.seconds}ث
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-300 mb-2">
          {displayMsg}
        </p>
        <div className="text-[10px] text-amber-400 font-bold flex items-center justify-end gap-1">
          <span>📅 بدء تفعيل واستقبال الطلبات: {formattedLaunchDate}</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 sm:p-5 shadow-2xl relative overflow-hidden text-right font-sans mb-5 ${
        isDriver
          ? 'bg-gradient-to-l from-slate-900 via-amber-950/40 to-slate-900 border-amber-500/30 shadow-amber-950/20'
          : 'bg-gradient-to-l from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/30 shadow-indigo-950/20'
      }`}
    >
      {/* Glow Effect */}
      <div
        className={`absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isDriver ? 'bg-amber-400' : 'bg-indigo-400'
        }`}
      />

      <div className="relative z-10 flex flex-col gap-3.5">
        {/* Header with Title and Countdown Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-row-reverse border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 flex-row-reverse">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                isDriver
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
              }`}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-1.5 flex-row-reverse">
                <span>{displayTitle}</span>
              </h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 flex-row-reverse mt-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>الموعد الرسمي لتفعيل واستقبال الطلبات:</span>
                <strong className="text-amber-300 font-sans">{formattedLaunchDate}</strong>
              </p>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 px-3 flex items-center gap-2 self-stretch sm:self-auto justify-center flex-row-reverse">
            <div className="text-center min-w-[32px]">
              <span className="block font-mono text-sm sm:text-base font-black text-amber-400 leading-none">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="text-[9px] text-slate-400 font-bold">يوم</span>
            </div>
            <span className="text-slate-600 font-bold text-xs">:</span>
            <div className="text-center min-w-[32px]">
              <span className="block font-mono text-sm sm:text-base font-black text-amber-400 leading-none">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[9px] text-slate-400 font-bold">ساعة</span>
            </div>
            <span className="text-slate-600 font-bold text-xs">:</span>
            <div className="text-center min-w-[32px]">
              <span className="block font-mono text-sm sm:text-base font-black text-amber-400 leading-none">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[9px] text-slate-400 font-bold">دقيقة</span>
            </div>
            <span className="text-slate-600 font-bold text-xs">:</span>
            <div className="text-center min-w-[32px]">
              <span className="block font-mono text-sm sm:text-base font-black text-amber-400 leading-none animate-pulse">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[9px] text-slate-400 font-bold">ثانية</span>
            </div>
          </div>
        </div>

        {/* Message body */}
        <p className="text-xs sm:text-[13px] leading-relaxed text-slate-300 font-normal">
          {displayMsg}
        </p>

        {/* Steps / Activities Available During Pre-Launch */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
          {isDriver ? (
            <>
              <div className="bg-slate-950/60 border border-slate-800/80 p-2 rounded-xl flex items-center gap-2 flex-row-reverse">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">١. استكمال وتدقيق وثائق الكابتن</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 p-2 rounded-xl flex items-center gap-2 flex-row-reverse">
                <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-300">٢. شحن رصيد المحفظة مسبقاً</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 p-2 rounded-xl flex items-center gap-2 flex-row-reverse">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-slate-300">٣. الاستعداد للانطلاق الفوري</span>
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-950/60 border border-slate-800/80 p-2 rounded-xl flex items-center gap-2 flex-row-reverse">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">١. توثيق الحساب ورقم الهاتف</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 p-2 rounded-xl flex items-center gap-2 flex-row-reverse">
                <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-300">٢. تعبئة المحفظة واستلام البونص</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 p-2 rounded-xl flex items-center gap-2 flex-row-reverse">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-slate-300">٣. حجز أول المشاوير فور الإطلاق</span>
              </div>
            </>
          )}
        </div>

        {/* Lock note */}
        <div className="bg-amber-950/30 border border-amber-500/20 px-3 py-2 rounded-xl flex items-center justify-between gap-2 flex-row-reverse text-[11px]">
          <div className="flex items-center gap-1.5 flex-row-reverse text-amber-300 font-bold">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>ملاحظة: إرسال واستقبال طلبات المشاوير معلق حالياً لحين موعد الإطلاق الرسمي.</span>
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:inline">نظام آدم الذكي</span>
        </div>
      </div>
    </motion.div>
  );
};

// Modal that pops up when user tries to make a request during pre-launch period
export const ServiceLaunchGatedModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  role: 'passenger' | 'driver';
  formattedLaunchDate?: string;
  customMessage?: string;
}> = ({ isOpen, onClose, role, formattedLaunchDate, customMessage }) => {
  if (!isOpen) return null;

  const isDriver = role === 'driver';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-right font-sans shadow-2xl relative overflow-hidden"
        >
          <div
            className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 border ${
              isDriver
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
            }`}
          >
            <Lock className="w-7 h-7" />
          </div>

          <h3 className="text-lg font-black text-slate-100 text-center mb-2">
            {isDriver ? 'خدمة استقبال الطلبات تبدأ قريباً! 🚗' : 'فترة التسجيل المسبق نشطة حالياً 🚀'}
          </h3>

          <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3.5 text-center mb-4">
            <span className="text-xs text-slate-400 block mb-1">موعد بدء تفعيل واستقبال الطلبات رسمياً:</span>
            <strong className="text-sm text-amber-300 font-bold block">
              {formattedLaunchDate || 'الموعد المحدد من الإدارة'}
            </strong>
          </div>

          <p className="text-xs leading-relaxed text-slate-300 text-center mb-6">
            {customMessage ||
              (isDriver
                ? 'نحن حالياً في مرحلة تسجيل واعتماد أسطول الكباتن وتدقيق الوثائق. لا يمكن استقبال أو إرسال الطلبات قبل هذا التاريخ. يرجى التأكد من استكمال كافة بياناتك وشحن محفظتك لتكون جاهزاً فور الإطلاق!'
                : 'نحن حالياً في مرحلة تسجيل حسابات الركاب وتجهيز الأسطول. سيبدأ استقبال وإرسال طلبات الرحلات فور حلول التاريخ المحدد أعلاه. يمكنك الآن استكمال بياناتك وشحن رصيدك بكل أمان.')}
          </p>

          <button
            type="button"
            onClick={onClose}
            className={`w-full py-3.5 rounded-2xl text-xs font-black text-white transition cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
              isDriver
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-900/30'
                : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-indigo-900/30'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>حسناً، فهمت ذلك (متابعة في التطبيق)</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
