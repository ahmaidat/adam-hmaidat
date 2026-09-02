import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Megaphone, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Tag, 
  Clock, 
  Gift, 
  ExternalLink, 
  X, 
  CheckCircle, 
  Copy, 
  Wand2, 
  Loader2, 
  ShieldCheck, 
  Building2,
  Ticket,
  Zap,
  Layers,
  Pause,
  Play
} from 'lucide-react';
import { useAppState } from '../stateEngine';
import { CommercialAd } from '../types';

interface AiAdBannerProps {
  userType: 'passenger' | 'driver' | 'all';
  travelMode: 'intercity' | 'intracity';
  governorate?: string;
  locationName?: string;
  currentActivity?: string;
  coords?: { lat: number; lng: number };
  className?: string;
  isAdmin?: boolean;
  onApplyPromo?: (promoCode: string) => void;
}

export const AiAdBanner: React.FC<AiAdBannerProps> = ({
  userType,
  travelMode,
  governorate = 'عمان',
  locationName = '',
  currentActivity = '',
  coords,
  className = '',
  isAdmin = false,
  onApplyPromo
}) => {
  const { commercialAds, settings, t, language } = useAppState();

  // 1. Strictly filter ACTIVE commercial ads posted by Admin
  const activeCommercialAds = (commercialAds || []).filter(
    (ad) => ad.status === 'active' && (ad.target === userType || ad.target === 'all')
  );

  const [aiAds, setAiAds] = useState<CommercialAd[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAutoLoadingAi, setIsAutoLoadingAi] = useState(false);
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(coords || null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // View mode: 'ticker' (news ticker bar when 2+ ads exist) or 'card'
  const [viewMode, setViewMode] = useState<'ticker' | 'card'>('ticker');

  // Auto-detect HTML5 location coordinates if not passed
  useEffect(() => {
    if (coords) {
      setDetectedCoords(coords);
      return;
    }
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDetectedCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          setDetectedCoords({ lat: 31.9539, lng: 35.9106 });
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    } else {
      setDetectedCoords({ lat: 31.9539, lng: 35.9106 });
    }
  }, [coords]);

  // Contextual AI ads generator - ONLY run if explicit active commercial ads exist
  useEffect(() => {
    let isSubscribed = true;
    const autoFetchContextualAds = async () => {
      // If there are no active commercial ads configured by Admin, do not auto-generate background ads
      if (activeCommercialAds.length === 0) {
        setIsAutoLoadingAi(false);
        return;
      }

      setIsAutoLoadingAi(true);
      try {
        const response = await fetch('/api/ai-generate-ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userType,
            travelMode,
            governorate,
            locationName,
            currentActivity,
            coords: detectedCoords
          })
        });

        const data = await response.json();
        if (isSubscribed && data.success && data.ads && data.ads.length > 0) {
          const generatedList: CommercialAd[] = data.ads.map((item: any, index: number) => ({
            id: item.id || `ai_ad_ctx_${Date.now()}_${index}`,
            title: item.title || `عرض مخصص لـ ${governorate}`,
            badge: item.badge || 'عروض AI لموقعك 📍',
            description: item.description || 'عرض موجه خصيصاً لموقعك ونشاطك الحالي مع آدم.',
            image: item.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
            buttonText: item.buttonText || 'استلم الخصم 🚀',
            timeText: item.timeText || 'متاح لموقعك الآن',
            target: userType,
            createdAt: new Date().toISOString(),
            status: 'active',
            companyName: item.companyName || 'شركاء آدم الإقليمية',
            mediaUrl: item.promoCode || 'ADAM_CTX_SPECIAL'
          }));

          setAiAds(generatedList);
        }
      } catch (err) {
        console.warn("Contextual AI ads fallback");
      } finally {
        if (isSubscribed) setIsAutoLoadingAi(false);
      }
    };

    autoFetchContextualAds();

    return () => {
      isSubscribed = false;
    };
  }, [userType, travelMode, governorate, locationName, currentActivity, detectedCoords?.lat, detectedCoords?.lng, activeCommercialAds.length]);

  // Combined strictly active commercial ads and AI-enriched ads
  const allActiveAds: CommercialAd[] = [
    ...activeCommercialAds, 
    ...aiAds.filter(a => a.status === 'active')
  ];

  const displayAds = allActiveAds;

  // Auto-slide carousel interval for single card view
  useEffect(() => {
    if (isPaused || displayAds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayAds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [displayAds.length, isPaused]);

  // Handle carousel navigation
  const nextSlide = () => {
    if (displayAds.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % displayAds.length);
  };

  const prevSlide = () => {
    if (displayAds.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + displayAds.length) % displayAds.length);
  };

  // AI Prompt Modal / Trigger States
  const [showAiModal, setShowAiModal] = useState(false);
  const [customPromptText, setCustomPromptText] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState('');

  // Ad Details Modal
  const [selectedAdForDetails, setSelectedAdForDetails] = useState<CommercialAd | null>(null);

  // Generate AI Ads API Handler
  const handleGenerateAiAds = async (userPrompt: string = '') => {
    setIsGeneratingAi(true);
    setAiSuccessMsg('');
    try {
      const response = await fetch('/api/ai-generate-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType,
          travelMode,
          governorate,
          locationName,
          currentActivity,
          customPrompt: userPrompt
        })
      });

      const data = await response.json();
      if (data.success && data.ads && data.ads.length > 0) {
        const generatedList: CommercialAd[] = data.ads.map((item: any, index: number) => ({
          id: item.id || `ai_ad_${Date.now()}_${index}`,
          title: item.title || 'عرض AI مخصص',
          badge: item.badge || 'توليد ذكاء اصطناعي 🤖',
          description: item.description || 'عرض ترويجي ذكي صُمم خصيصاً لمسارك وتنقلك مع آدم.',
          image: item.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
          buttonText: item.buttonText || 'احصل على العرض 🎯',
          timeText: item.timeText || 'عرض حصري موجه',
          target: userType,
          createdAt: new Date().toISOString(),
          status: 'active',
          companyName: item.companyName || 'ذكاء آدم الترويجي',
          mediaUrl: item.promoCode || 'ADAM_AI_SPECIAL'
        }));

        setAiAds((prev) => [...generatedList, ...prev]);
        setCurrentIndex(0);
        setAiSuccessMsg('✨ تم توليد العرض المخصص ببرمجية الذكاء الاصطناعي وجلبه لشريط الإعلانات بنجاح!');
        setTimeout(() => setShowAiModal(false), 1500);
      }
    } catch (e) {
      console.error("Failed to generate AI ads:", e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // If there are no active ads available at all, automatically hide the entire banner / news ticker
  if (displayAds.length === 0) {
    return null;
  }

  const currentAd = displayAds[currentIndex] || displayAds[0];

  const handleCopyCode = (code: string) => {
    if (navigator.clipboard && code) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }
    if (onApplyPromo && code) {
      onApplyPromo(code);
    }
  };

  const isMultiAdsMode = displayAds.length > 1;

  return (
    <div className={`relative w-full overflow-hidden my-2 rounded-xl border border-emerald-900/40 shadow-md bg-slate-900 text-white ${className}`}>
      
      {/* Top Header Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-300">
        <div className="flex items-center space-x-2 space-x-reverse overflow-hidden">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Megaphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate font-bold text-emerald-400">
            {isMultiAdsMode 
              ? `شريط العروض والأخبار المباشرة (${displayAds.length} عروض فعالة)` 
              : `إعلان وعرض أدم • ${governorate}`}
          </span>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse shrink-0">
          {/* Mode Switcher if multiple ads exist */}
          {isMultiAdsMode && (
            <button
              type="button"
              onClick={() => setViewMode(prev => prev === 'ticker' ? 'card' : 'ticker')}
              className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-all cursor-pointer flex items-center space-x-1 space-x-reverse"
              title="تبديل طريقة العرض بين شريط الإعلانات العريض والبطاقة"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>{viewMode === 'ticker' ? 'عرض كبطاقات 🗂️' : 'شريط الأخبار 📰'}</span>
            </button>
          )}

          {isAdmin ? (
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="flex items-center space-x-1 space-x-reverse bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-md font-bold text-[10px] transition-all cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>إنشاء بـ AI 🤖</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1 space-x-reverse text-[10px] text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/50">
              <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>عروض فعالة ⚡</span>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 📰 MODE 1: NEWS TICKER BAR (شريط الأخبار والخصومات المتحرك) */}
      {/* Used when 2+ active ads/promos exist & viewMode === 'ticker' */}
      {/* ------------------------------------------------------------- */}
      {isMultiAdsMode && viewMode === 'ticker' ? (
        <div 
          className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 py-2.5 px-3 overflow-hidden cursor-pointer group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Scrolling Ticker Container */}
          <div className="flex items-center space-x-6 space-x-reverse animate-marquee whitespace-nowrap">
            {[...displayAds, ...displayAds].map((ad, idx) => (
              <div 
                key={`${ad.id}_${idx}`}
                onClick={() => setSelectedAdForDetails(ad)}
                className="inline-flex items-center space-x-2 space-x-reverse bg-slate-800/80 hover:bg-emerald-950/90 border border-slate-700/80 hover:border-emerald-500/50 px-3 py-1.5 rounded-xl transition-all shadow-sm shrink-0 active:scale-95 cursor-pointer"
              >
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-slate-950 shrink-0">
                  {ad.badge || 'عرض خاص 🎁'}
                </span>
                
                <span className="text-xs font-bold text-white truncate max-w-[220px]">
                  {ad.title}
                </span>

                {ad.mediaUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyCode(ad.mediaUrl!);
                    }}
                    className="inline-flex items-center space-x-1 space-x-reverse text-[10px] bg-emerald-600/30 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 px-2 py-0.5 rounded font-mono font-bold transition-all border border-emerald-500/30"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCode === ad.mediaUrl ? 'تم النسخ!' : ad.mediaUrl}</span>
                  </button>
                )}

                <span className="text-[10px] text-slate-400">
                  • {ad.buttonText || 'التفاصيل'}
                </span>
              </div>
            ))}
          </div>

          {/* Pause Indicator overlay on hover */}
          {isPaused && (
            <div className="absolute top-1 left-2 bg-slate-900/90 text-emerald-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-800/60 pointer-events-none flex items-center space-x-1 space-x-reverse">
              <Pause className="w-2.5 h-2.5" />
              <span>متوقف مؤقتاً (اضغط لمعاينة العرض)</span>
            </div>
          )}
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* 🎴 MODE 2: SINGLE/CAROUSEL CARD BANNER AREA                   */
        /* ------------------------------------------------------------- */
        <div 
          className="relative p-2.5 sm:p-3 bg-slate-900 hover:bg-slate-850 transition-colors cursor-pointer"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onClick={() => setSelectedAdForDetails(currentAd)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentAd.id || currentIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-between gap-3"
            >
              {/* Left: Thumbnail Image */}
              <div className="relative w-13 h-13 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-slate-800 border border-slate-700 shadow-sm">
                {currentAd.image ? (
                  <img 
                    src={currentAd.image} 
                    alt={currentAd.title}
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-600 to-slate-800 text-white font-bold text-xs">
                    آدم 🚕
                  </div>
                )}
                <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 rounded-bl-md">
                  فعّال
                </div>
              </div>

              {/* Middle: Content Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5 space-x-reverse mb-0.5">
                  <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30 truncate max-w-[140px]">
                    {currentAd.badge || 'عرض خاص ⭐'}
                  </span>
                  {currentAd.companyName && (
                    <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                      • {currentAd.companyName}
                    </span>
                  )}
                </div>

                <h4 className="text-xs sm:text-sm font-extrabold text-white truncate leading-tight">
                  {currentAd.title}
                </h4>

                <p className="text-[11px] text-slate-300 truncate mt-0.5">
                  {currentAd.description}
                </p>
              </div>

              {/* Right: Compact Action Button + Nav Controls */}
              <div className="flex items-center space-x-1 space-x-reverse shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentAd.mediaUrl) {
                      handleCopyCode(currentAd.mediaUrl);
                    }
                    setSelectedAdForDetails(currentAd);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm active:scale-95 flex items-center space-x-1 space-x-reverse cursor-pointer"
                >
                  <span className="whitespace-nowrap">{currentAd.buttonText || 'التفاصيل 🚀'}</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {displayAds.length > 1 && (
                  <div className="hidden sm:flex flex-col space-y-0.5">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                      className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                      className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* AI Ad Generator Modal */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-200 text-slate-800"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                      صانع العروض الذكي بـ AI 🤖
                    </h3>
                    <p className="text-xs text-slate-500">
                      مولد إعلانات وتخفيضات مخصصة لمسارك ونمط تنقلك
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Prompt Chips */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  اختر نوع العرض المقترح أو اكتب طلبك الخاص:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    userType === 'driver' ? 'خصم وقود ومحروقات ⛽' : 'خصم تكت السفر 🎟️',
                    userType === 'driver' ? 'خصم غيار زيت وصيانة 🔧' : 'خصم مشوار التاكسي 🚕',
                    userType === 'driver' ? 'حافز إلغاء العمولة ⚡' : 'وجبة ومشروب مجاني ☕',
                    'خصم الدفع الإلكتروني كليك 💳',
                    'عروض المطار والنقل السريع ✈️'
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setCustomPromptText(chip)}
                      className="text-xs bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-3 py-1.5 rounded-xl border border-slate-200 transition-all font-medium cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Custom Prompt */}
              <div className="mb-4">
                <textarea
                  value={customPromptText}
                  onChange={(e) => setCustomPromptText(e.target.value)}
                  placeholder={userType === 'driver' 
                    ? "مثلاً: أنا كابتن في عمان وأريد خصم على صيانة السيارة أو حافز للرحلات الطويلة..."
                    : "مثلاً: أريد خصم على رحلتي المجدولة من إربد إلى عمان أو كوبون مطعم على الطريق..."}
                  rows={3}
                  className="w-full text-xs sm:text-sm p-3 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none"
                />
              </div>

              {/* Success Notification */}
              {aiSuccessMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{aiSuccessMsg}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  disabled={isGeneratingAi}
                  onClick={() => handleGenerateAiAds(customPromptText)}
                  className="inline-flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isGeneratingAi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري التوليد بـ Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>توليد وإضافة العرض للشريط 🚀</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Selected Ad Details Modal */}
      <AnimatePresence>
        {selectedAdForDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl border border-slate-200 text-slate-800"
            >
              {/* Modal Image Header */}
              <div className="relative h-44 bg-slate-900">
                {selectedAdForDetails.image && (
                  <img
                    src={selectedAdForDetails.image}
                    alt={selectedAdForDetails.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                <button
                  type="button"
                  onClick={() => setSelectedAdForDetails(null)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute bottom-3 right-3 left-3 text-white">
                  <span className="inline-flex items-center space-x-1 space-x-reverse px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 mb-1">
                    <Tag className="w-3 h-3" />
                    <span>{selectedAdForDetails.badge || 'عرض ممتاز'}</span>
                  </span>
                  <h3 className="font-black text-base sm:text-lg leading-tight drop-shadow-sm">
                    {selectedAdForDetails.title}
                  </h3>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5">
                {selectedAdForDetails.companyName && (
                  <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-500 font-bold mb-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>الجهة الراعية: {selectedAdForDetails.companyName}</span>
                  </div>
                )}

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  {selectedAdForDetails.description}
                </p>

                {/* Promo Code Box */}
                {(selectedAdForDetails.mediaUrl || selectedAdForDetails.companyName) && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between mb-4">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">كود الخصم الترويجي:</span>
                      <span className="font-mono text-base font-black text-emerald-700">
                        {selectedAdForDetails.mediaUrl || 'ADAM_SPECIAL'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(selectedAdForDetails.mediaUrl || 'ADAM_SPECIAL')}
                      className="inline-flex items-center space-x-1 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
                    >
                      {copiedCode === (selectedAdForDetails.mediaUrl || 'ADAM_SPECIAL') ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ الكود</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400 flex items-center space-x-1 space-x-reverse">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{selectedAdForDetails.timeText || 'متاح حالياً'}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedAdForDetails.mediaUrl) {
                        handleCopyCode(selectedAdForDetails.mediaUrl);
                      }
                      setSelectedAdForDetails(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    إغلاق وتطبيق الخصم 🚀
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
