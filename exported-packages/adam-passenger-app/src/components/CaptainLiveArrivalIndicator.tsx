import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Phone, MessageSquare, MapPin, Navigation, Clock, ShieldAlert, CheckCircle, RefreshCw, Zap } from 'lucide-react';

interface CaptainLiveArrivalIndicatorProps {
  driverName?: string;
  driverPhone?: string;
  driverPhoto?: string;
  carModel?: string;
  carPlate?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  status: string; // 'accepted' | 'started' | 'pending' | 'arrived'
  initialEtaMinutes?: number;
  initialDistanceKm?: number;
  onCallCaptain?: () => void;
  onOpenChat?: () => void;
  t?: (ar: string, en: string) => string;
}

export const CaptainLiveArrivalIndicator: React.FC<CaptainLiveArrivalIndicatorProps> = ({
  driverName = 'كابتن أحمد النجار',
  driverPhone = '0791234567',
  driverPhoto,
  carModel = 'تويوتا بريوس (Hybrid)',
  carPlate = '34-89024',
  pickupLocation = 'موقع الإقلال المحدد',
  dropoffLocation = 'موقع الوصول النهائي',
  status,
  initialEtaMinutes = 5,
  initialDistanceKm = 2.4,
  onCallCaptain,
  onOpenChat,
  t = (ar, _en) => ar,
}) => {
  // Live simulated ETA countdown state
  const [etaMinutes, setEtaMinutes] = useState<number>(initialEtaMinutes);
  const [etaSeconds, setEtaSeconds] = useState<number>(0);
  const [distanceKm, setDistanceKm] = useState<number>(initialDistanceKm);
  const [speedKmH, setSpeedKmH] = useState<number>(42);
  const [captainStage, setCaptainStage] = useState<'en_route' | 'approaching' | 'arrived' | 'in_trip'>('en_route');

  // Timer effect to dynamically decrease remaining minutes to pickup
  useEffect(() => {
    if (status === 'started') {
      setCaptainStage('in_trip');
      return;
    }

    const interval = setInterval(() => {
      setEtaSeconds((prevSec) => {
        if (prevSec > 0) {
          return prevSec - 1;
        } else {
          setEtaMinutes((prevMin) => {
            if (prevMin > 1) {
              const newMin = prevMin - 1;
              const newDist = parseFloat((newMin * 0.45 + 0.2).toFixed(1));
              setDistanceKm(newDist);
              if (newMin <= 2) {
                setCaptainStage('approaching');
              }
              return newMin;
            } else {
              setCaptainStage('arrived');
              setDistanceKm(0.1);
              return 0;
            }
          });
          return 59;
        }
      });

      // Slightly fluctuate live speed for realism
      setSpeedKmH(Math.floor(38 + Math.random() * 12));
    }, 2000);

    return () => clearInterval(interval);
  }, [status]);

  // Percentage progress to pickup (100% when arrived)
  const pickupProgress = captainStage === 'arrived' || status === 'started'
    ? 100
    : Math.max(10, Math.min(95, Math.round(((initialEtaMinutes - etaMinutes) / initialEtaMinutes) * 100)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl relative overflow-hidden font-sans my-2"
    >
      {/* Top Ambient Glow Accent */}
      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />

      {/* Header Badge & Title */}
      <div className="flex items-center justify-between flex-row-reverse mb-3">
        <div className="flex items-center gap-2 flex-row-reverse text-right">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <h4 className="text-xs font-black text-slate-100 flex items-center gap-1.5 flex-row-reverse">
              <span>{t('مؤشر حالة وتتبع الكابتن المباشر', 'Live Captain Status & Radar')}</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[8.5px] px-2 py-0.5 rounded-full font-extrabold border border-emerald-500/30">
                GPS LIVE
              </span>
            </h4>
            <p className="text-[9.5px] text-slate-400">
              {captainStage === 'arrived'
                ? t('الكابتن متواجد الآن عند موقع الإقلال', 'Captain arrived at pickup location')
                : captainStage === 'in_trip'
                ? t('الرحلة جارية نحو وجهة الوصول', 'Trip in progress to destination')
                : t('جاري تحديث المسافة والوقت المتبقي بدقة متناهية', 'Real-time accurate ETA & distance update')}
            </p>
          </div>
        </div>

        {/* Live Speed Badge */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1 text-center font-mono shrink-0">
          <span className="text-[8px] text-slate-400 block font-sans">{t('السرعة الحالية', 'Speed')}</span>
          <span className="text-xs font-bold text-amber-400">{speedKmH} <span className="text-[8px]">كم/س</span></span>
        </div>
      </div>

      {/* BIG LIVE ETA & DISTANCE HIGHLIGHT BOX */}
      <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-3.5 mb-3 flex flex-col gap-2.5 relative overflow-hidden shadow-inner">
        <div className="flex items-center justify-between flex-row-reverse">
          {/* Main Time Remaining Display */}
          <div className="text-right">
            <span className="text-[9.5px] text-slate-400 font-bold block flex items-center gap-1 flex-row-reverse">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>{t('الوقت التقديري المتبقي للوصول إليك:', 'Estimated Remaining Time to Pickup:')}</span>
            </span>
            <div className="flex items-baseline gap-2 flex-row-reverse mt-0.5">
              {captainStage === 'arrived' ? (
                <span className="text-sm font-black text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-xl border border-emerald-500/40 animate-pulse">
                  📍 الكابتن عند موقعك الان!
                </span>
              ) : captainStage === 'in_trip' ? (
                <span className="text-sm font-black text-indigo-400 bg-indigo-500/20 px-3 py-1 rounded-xl border border-indigo-500/40">
                  🚗 الرحلة بدأت وباتجاه الوجهة
                </span>
              ) : (
                <div className="flex items-baseline gap-1.5 flex-row-reverse">
                  <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight drop-shadow-md">
                    {etaMinutes}
                  </span>
                  <span className="text-xs font-bold text-emerald-300 font-sans">
                    {t('دقائق', 'mins')}
                  </span>
                  <span className="text-xs font-mono text-slate-400 mr-1">
                    ({String(etaSeconds).padStart(2, '0')} ثانية)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Remaining Distance Display */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-center min-w-[90px]">
            <span className="text-[8.5px] text-slate-400 block font-sans font-bold">{t('المسافة المتبقية', 'Distance')}</span>
            <span className="text-sm font-black text-teal-300 font-mono">
              {distanceKm} <span className="text-[9px] font-sans">كم</span>
            </span>
          </div>
        </div>

        {/* VISUAL PROGRESS BAR TOWARDS PICKUP */}
        <div className="space-y-1 mt-1">
          <div className="flex justify-between items-center text-[9px] text-slate-400 font-sans flex-row-reverse font-bold">
            <span className="flex items-center gap-1 text-emerald-400">
              <MapPin className="w-3 h-3" />
              <span>{pickupLocation} (موقعك)</span>
            </span>
            <span className="flex items-center gap-1 text-amber-300">
              <Car className="w-3 h-3" />
              <span>{driverName}</span>
            </span>
          </div>

          <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 via-teal-400 to-emerald-500 rounded-full relative"
              initial={{ width: '10%' }}
              animate={{ width: `${pickupProgress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full animate-ping opacity-75" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* CAPTAIN DETAILS & QUICK ACTIONS */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between flex-row-reverse gap-3">
        {/* Driver Avatar & Name */}
        <div className="flex items-center gap-2.5 flex-row-reverse">
          {driverPhoto ? (
            <img src={driverPhoto} alt={driverName} className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/50" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-300 font-black text-sm">
              <Car className="w-5 h-5 text-emerald-400" />
            </div>
          )}
          <div className="text-right">
            <h5 className="text-xs font-black text-slate-100 flex items-center gap-1 flex-row-reverse">
              <span>{driverName}</span>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
            </h5>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">
              {carModel} • <span className="font-mono text-amber-300 font-bold bg-amber-950/60 px-1 py-0.2 rounded border border-amber-500/20">{carPlate}</span>
            </p>
          </div>
        </div>

        {/* Quick Action Buttons (Call & Chat) with Tactile Active Scale-Down */}
        <div className="flex items-center gap-2">
          {onCallCaptain && (
            <button
              type="button"
              onClick={onCallCaptain}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all duration-150 text-white p-2.5 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer shadow-lg shadow-emerald-950/50 border border-emerald-400/30"
              title={t('اتصال هاتفي بالكابتن', 'Call Captain')}
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">{t('اتصال', 'Call')}</span>
            </button>
          )}

          {onOpenChat && (
            <button
              type="button"
              onClick={onOpenChat}
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all duration-150 text-white p-2.5 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer shadow-lg shadow-indigo-950/50 border border-indigo-400/30"
              title={t('محادثة نصية مباشرة', 'Chat Captain')}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">{t('دردشة', 'Chat')}</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
