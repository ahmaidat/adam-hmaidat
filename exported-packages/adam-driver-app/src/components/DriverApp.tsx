import React, { useState, useEffect } from 'react';
import { useAppState } from '../stateEngine';
import { RideRequest, PooledRide, ChatMessage, JORDAN_PAYMENT_PROVIDERS, ScheduledTrip, DEFAULT_JORDAN_VEHICLES } from '../types';
import { playNotificationTone, startIncomingRideAlarm, stopIncomingRideAlarm, unlockAudioContext } from '../soundUtils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getLocationCoords, DEFAULT_LOCATIONS, getGeoCoords, getCanvasCoordsFromGeo } from '../locationData';
import { motion } from 'motion/react';
import { IntraCityDriverPanel } from './IntraCityDriverPanel';
import { GoogleCalendarManager } from './GoogleCalendarManager';
import { AiSupportChat } from './AiSupportChat';
import { AiAdBanner } from './AiAdBanner';
import { AiSpatial5DView } from './AiSpatial5DView';
import { TripScheduler } from './TripScheduler';
import { DriverDailyChallengesSection } from './DriverDailyChallengesSection';
import { WalletSecurityDashboard } from './WalletSecurityDashboard';
import { WalletRechargeSettlementPanel } from './WalletRechargeSettlementPanel';
import { ServiceLaunchBanner, ServiceLaunchGatedModal } from './ServiceLaunchBanner';
import aiDocVerificationImg from '../assets/images/ai_doc_verification_1784989582075.jpg';
import { 
  Car, 
  MapPin, 
  ShieldCheck, 
  DollarSign, 
  Power, 
  LogOut, 
  Star, 
  History, 
  MessageSquare, 
  Compass, 
  User, 
  Send, 
  ShieldAlert, 
  UserCheck, 
  Check, 
  CheckCircle2,
  ScanLine,
  FileCheck,
  X, 
  CalendarClock, 
  Calendar,
  Clock,
  Info,
  Wallet,
  Lock,
  Moon,
  Settings,
  Mic,
  Sparkles,
  Volume2,
  AlertTriangle,
  Bell,
  Trash2,
  PlusCircle,
  Languages,
  Globe,
  Plus,
  Minus,
  ArrowUpDown,
  Users,
  Megaphone,
  ChevronDown,
  CalendarDays,
  Satellite,
  Locate,
  Radio,
  RefreshCw
} from 'lucide-react';

const VEHICLE_CLASSES = [
  'سيدان اقتصادي (Sedan Economy)',
  'سيدان هجين / هايبرد (Sedan Hybrid)',
  'كهرباء بالكامل (Full Electric EV)',
  'جيب عائلي (SUV Family)',
  'باص صغير / ميني فان (Mini Van / Bus)',
  'فخمة ممتازة (VIP Premium)'
];

const VEHICLE_TYPES = [
  'تويوتا بريوس (Toyota Prius)',
  'تويوتا كامري (Toyota Camry)',
  'هيونداي سوناتا (Hyundai Sonata)',
  'هيونداي أيونيك (Hyundai Ioniq)',
  'كيا نيرو (Kia Niro)',
  'كيا اوبتيما (Kia Optima)',
  'تسلا موديل ٣ (Tesla Model 3)',
  'بي واي دي (BYD)',
  'فولكس فاجن (Volkswagen ID.4/ID.6)',
  'مرسيدس بنز (Mercedes-Benz)',
  'بي إم دبليو (BMW)'
];

interface DriverAppProps {
  fullWidth?: boolean;
}

export const DriverApp: React.FC<DriverAppProps> = ({ fullWidth: initialFullWidth = false }) => {
  const [isFullWidth, setIsFullWidth] = useState<boolean>(initialFullWidth);

  React.useEffect(() => {
    setIsFullWidth(initialFullWidth);
  }, [initialFullWidth]);
  const { 
    drivers, 
    requests,
    passengers,
    saveState,
    rides, 
    messages, 
    settings, 
    scheduledTrips,
    walletTransactions,
    currentDriver, 
    login, 
    logout, 
    registerDriver, 
    resetUserPassword,
    rolloverUnderbookedTrip,
    setDriverOnline, 
    acceptRide, 
    applyDriverPromoToRide,
    rejectRide, 
    startRide, 
    endRide, 
    sendChatMessage, 
    submitRating,
    createDriverScheduledTrip,
    generateHourlyScheduledTrips,
    clearEmptyAutoScheduledTrips,
    acceptScheduledTripByDriver,
    bulkAcceptScheduledTripsByDriver,
    requestScheduledTripByDriver,
    cancelScheduledTrip,
    confirmScheduledTripByDriver,
    cancelScheduledTripByDriver,
    completeScheduledTrip,
    delayScheduledTripBy10Minutes,
    startIncompleteScheduledTrip,
    addWalletTransaction,
    linkPaymentMethod,
    redeemWalletPromoCode,
    claimChallengeReward,
    updateDriverProfile,
    updateUserPassword,
    language,
    setLanguage,
    t,
    activeCountry,
    intraCityRides,
    acceptIntraCityRide,
    declineIntraCityRide,
    startIntraCityRide,
    endIntraCityRide,
    cancelIntraCityRide,
    updateDriverLocation,
    lastEndedRideInfo,
    setLastEndedRideInfo,
    aiPlugins,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    checkServiceLaunchGate,
    rateIntraCityPassenger,
    activeCountryCode,
    syncStateWithLocalStorage,
    setUserPin,
    updateWalletSecuritySettings,
    travelMode,
    setTravelMode,
    commercialAds,
    verifyAndDepositWalletWithBank,
    hasActualActiveRide,
    clearActiveRideConflict
  } = useAppState();

  const [isVerifyingRecharge, setIsVerifyingRecharge] = React.useState(false);

  const currency = language === 'en' ? (activeCountry?.currencyEn || 'JOD') : (activeCountry?.currencyAr || 'د.أ');

  const commercialAdsList = (commercialAds || []).filter(
    (ad) => ad.status === 'active' && (ad.target === 'driver' || ad.target === 'all')
  );

  const isIntercityTrip = (trip: ScheduledTrip) => {
    const fromGov = trip.fromArea.split('-')[0]?.trim() || trip.fromArea.split(' - ')[0]?.trim() || '';
    const toGov = trip.toArea.split('-')[0]?.trim() || trip.toArea.split(' - ')[0]?.trim() || '';
    return fromGov !== toGov;
  };

  // AI Geolocation Detection Simulated States
  const [geoDetecting, setGeoDetecting] = React.useState(true);
  const [geoStatusMsg, setGeoStatusMsg] = React.useState('📡 جاري رصد الإحداثيات الجغرافية وتحديد نطاق الكابتن...');
  const [detectedCountry, setDetectedCountry] = React.useState('JO');

  React.useEffect(() => {
    setGeoDetecting(true);
    const steps = [
      '📡 جاري البحث عن أقمار التموقع الفلكي النشطة...',
      '🤖 يقوم الذكاء الاصطناعي بفصل راديو المركبة وحساب خطوط التوجيه...',
      '🛰️ مطابقة نطاق الكابتن مع الإحداثيات والحدود السيادية المعتمدة...',
      `✅ رصد تلقائي بالـ AI: تم تحديد موقع الكابتن الجغرافي النشط بنجاح!`
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length - 1) {
        setGeoStatusMsg(steps[i]);
        i++;
      } else {
        setGeoStatusMsg(steps[3]);
        setGeoDetecting(false);
        setDetectedCountry(activeCountryCode || 'JO');
        clearInterval(interval);
      }
    }, 400);
    return () => clearInterval(interval);
  }, [activeCountryCode]);

  React.useEffect(() => {
    const handleAdamNavigate = (e: any) => {
      const tab = e.detail?.tab;
      if (tab) {
        // Driver App has 'status' instead of 'request' for the main tab
        if (tab === 'request') {
          setActiveTab('status');
        } else if (tab === 'history' || tab === 'chat' || tab === 'scheduled' || tab === 'wallet' || tab === 'settings' || tab === 'otp') {
          setActiveTab(tab);
        }
      }
    };

    window.addEventListener('adam-navigate', handleAdamNavigate);
    return () => {
      window.removeEventListener('adam-navigate', handleAdamNavigate);
    };
  }, []);

  const [dismissedRideId, setDismissedRideId] = useState<string | null>(null);
  const [dismissedRideIds, setDismissedRideIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("adam_dismissed_rides") || "[]");
    } catch {
      return [];
    }
  });

  const dismissRidePermanently = (rideId: string) => {
    setDismissedRideIds(prev => {
      const updated = Array.from(new Set([...prev, rideId]));
      try {
        localStorage.setItem("adam_dismissed_rides", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setDismissedRideId(rideId);
  };
  const [showNotifications, setShowNotifications] = useState(false);
  const [otpInputValue, setOtpInputValue] = useState<string>('');

  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: '',
    onConfirm: () => {}
  });
  const [activeTab, setActiveTab] = useState<'status' | 'history' | 'chat' | 'scheduled' | 'wallet' | 'settings' | 'otp'>('status');
  const [showLaunchGatedModal, setShowLaunchGatedModal] = useState<boolean>(false);
  const launchGateInfo = checkServiceLaunchGate ? checkServiceLaunchGate('driver') : { isGated: false, msg: '' };
  const [driverThemeMode, setDriverThemeMode] = useState<'auto' | 'dark' | 'light'>(() => {
    return (localStorage.getItem('adam_driver_theme') as any) || 'auto';
  });
  const [currentHour, setCurrentHour] = useState<number>(() => new Date().getHours());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const isDriverAutoNightTime = currentHour >= 20 || currentHour < 6;
  const isDriverDarkModeActive = driverThemeMode === 'dark' 
    ? true 
    : driverThemeMode === 'light' 
      ? false 
      : isDriverAutoNightTime;
  const [translatedChatMsgs, setTranslatedChatMsgs] = useState<Record<string, string>>({});
  const [translatingChatMsgId, setTranslatingChatMsgId] = useState<string | null>(null);
  const [supportSubTab, setSupportSubTab] = useState<'ai' | 'admin'>('ai');
  const [historyType, setHistoryType] = useState<'all' | 'intercity' | 'intracity'>('all');
  const [ratingTripId, setRatingTripId] = useState<string | null>(null);
  const [ratingPassengerId, setRatingPassengerId] = useState<string | null>(null);
  const [ratingVal, setRatingVal] = useState<number>(5);
  const [ratingNote, setRatingNote] = useState<string>('');
  const [usernameInput, setUsernameInput] = useState(''); // Clear pre-fill for test driver
  const [passwordInput, setPasswordInput] = useState(''); // Clear pre-fill for test driver
  const [showReg, setShowReg] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotFeedback, setForgotFeedback] = useState('');
  const [receivedSmsModal, setReceivedSmsModal] = useState<{ show: boolean; phone: string; username: string; body: string; aiLog?: string } | null>(null);

  // E-Wallet Form State
  const [walletNumInput, setWalletNumInput] = useState('');
  const [rechargeAmtInput, setRechargeAmtInput] = useState('');
  const [withdrawAmtInput, setWithdrawAmtInput] = useState('');
  const [walletFeedback, setWalletFeedback] = useState('');
  const [activeWalletSubTab, setActiveWalletSubTab] = useState<'details' | 'recharge' | 'withdraw' | 'link' | 'rewards' | 'pin'>('details');
  const [pinCodeInput, setPinCodeInput] = useState('');
  const [pinSetupInput, setPinSetupInput] = useState('');
  const [pinPromptModal, setPinPromptModal] = useState<{ show: boolean; onSuccess: () => void; amount: number; description: string } | null>(null);
  const [redeemCodeInput, setRedeemCodeInput] = useState('');
  const [redeemStatusMsg, setRedeemStatusMsg] = useState('');
  const [rechargeMethod, setRechargeMethod] = useState<'wallet' | 'cliq' | 'bank'>('wallet');
  const [walletFilterType, setWalletFilterType] = useState<string>('all');
  const [walletFilterDate, setWalletFilterDate] = useState<string>('');
  const [aiAdvisorText, setAiAdvisorText] = useState<string>('');
  const [loadingAiAdvisor, setLoadingAiAdvisor] = useState<boolean>(false);
  const [driverAiFilterText, setDriverAiFilterText] = useState<string>('');
  const [isAnalyzingDriverFilter, setIsAnalyzingDriverFilter] = useState<boolean>(false);
  const [driverAiFilterFeedback, setDriverAiFilterFeedback] = useState<string>('');
  const [aiFilteredRideIds, setAiFilteredRideIds] = useState<string[] | null>(null);
  const [confirmingScheduledTrip, setConfirmingScheduledTrip] = useState<ScheduledTrip | null>(null);

  // AI Smart Ad Layout and Obstruction Prevention Engine (الربط الذكي لمنع حجب الحقول والخدمات)
  const [aiSmartAdOptimization, setAiSmartAdOptimization] = useState<boolean>(true);
  const [isAnyFieldFocused, setIsAnyFieldFocused] = useState<boolean>(false);
  const [adLayoutMode, setAdLayoutMode] = useState<'standard' | 'compact' | 'pip' | 'hidden'>('standard');
  const [selectedAdId, setSelectedAdId] = useState<string>('ad_1');
  const [isAdDropdownOpen, setIsAdDropdownOpen] = useState<boolean>(false);
  const [adReminders, setAdReminders] = useState<Record<string, boolean>>({});
  const [adFeedback, setAdFeedback] = useState<string | null>(null);

  React.useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && ['input', 'textarea', 'select'].includes(target.tagName.toLowerCase())) {
        setIsAnyFieldFocused(true);
      }
    };
    const handleFocusOut = (e: FocusEvent) => {
      setTimeout(() => {
        const activeEl = document.activeElement;
        if (activeEl && ['input', 'textarea', 'select'].includes(activeEl.tagName.toLowerCase())) {
          setIsAnyFieldFocused(true);
        } else {
          setIsAnyFieldFocused(false);
        }
      }, 50);
    };
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // Adam Intelligent Driver Voice Command States
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'done' | 'error'>('idle');
  const [voiceFeedback, setVoiceFeedback] = useState('');
  const [isDriveMode, setIsDriveMode] = useState(false);

  // References and functions for continuous listening in Drive Mode
  const recRef = React.useRef<any>(null);

  const startContinuousDriveListening = React.useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recRef.current) {
      try { recRef.current.abort(); } catch(e){}
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'ar-JO';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = true;

      rec.onstart = () => {
        setVoiceStatus('listening');
        setVoiceTranscript('وضع القيادة نشط 🧭 - جاري الاستماع للأوامر الثابتة تلقائياً...');
      };

      rec.onerror = (err: any) => {
        console.error("Driving mode recognition error", err);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[event.results.length - 1][0].transcript;
        if (resultText) {
          handleProcessVoiceCommand(resultText);
        }
      };

      rec.onend = () => {
        if (isDriveMode) {
          setTimeout(() => {
            if (isDriveMode) {
              try { rec.start(); } catch(e){}
            }
          }, 1000);
        } else {
          setVoiceStatus('idle');
        }
      };

      recRef.current = rec;
      rec.start();
    } catch(e) {
      console.error(e);
    }
  }, [isDriveMode]);

  const stopContinuousDriveListening = React.useCallback(() => {
    if (recRef.current) {
      try {
        recRef.current.abort();
      } catch(e){}
      recRef.current = null;
    }
    setVoiceStatus('idle');
  }, []);

  React.useEffect(() => {
    if (isDriveMode) {
      startContinuousDriveListening();
    } else {
      stopContinuousDriveListening();
    }
    return () => {
      stopContinuousDriveListening();
    };
  }, [isDriveMode, startContinuousDriveListening, stopContinuousDriveListening]);

  React.useEffect(() => {
    const isDriverLoggedIn = currentDriver && currentDriver.role !== 'admin' && currentDriver.licenseExpiry !== undefined;
    const activeDriver = isDriverLoggedIn ? (drivers.find(d => d.id === currentDriver.id) || currentDriver) : null;
    
    if (activeDriver) {
      if (activeDriver.workScope === 'local' && travelMode === 'none') {
        setTravelMode('intracity');
      } else if (activeDriver.workScope === 'intercity' && travelMode === 'none') {
        setTravelMode('intercity');
      }
    }
  }, [currentDriver, drivers, travelMode, setTravelMode]);

  const handleProcessVoiceCommand = (commandText: string) => {
    if (!commandText || commandText.trim().length === 0) return;
    setVoiceTranscript(commandText);
    setVoiceStatus('processing');
    setVoiceFeedback('جاري معالجة الأمر الصوتي الذكي... 📡');

    setTimeout(() => {
      const lower = commandText.toLowerCase().trim();

      // VOICE COMMAND 1: Accept offered ride, pending scheduled, or pending intracity
      if (
        lower.includes('قبول') || 
        lower.includes('اقبل') || 
        lower.includes('موافق') || 
        lower.includes('نعم يا آدم') || 
        lower.includes('نعم يا ادم') || 
        lower.includes('الطلب')
      ) {
        setVoiceStatus('done');
        let processed = false;
        
        const currentOfferedRide = rides.find(r => r.offeredToDriverId === currentDriver?.id && r.status === 'offered');
        const currentPendingSchTrips = scheduledTrips.filter(t => (t.creatorType === 'passenger' || (t.creatorType === 'admin' && !t.driverId)) && t.status === 'pending');
        const currentPendingIntra = intraCityRides.find(r => r.status === 'pending' && !r.driverId);

        if (currentOfferedRide) {
          acceptRide(currentOfferedRide.id, currentDriver.id);
          const feedback = 'أبشر كابتن! تم قبول طلب الرحلة المفتوحة بنجاح بالتحكم الصوتي الآمن. دربك أخضر!';
          setVoiceFeedback(feedback);
          speakOutLoud(feedback);
          processed = true;
        } else if (currentPendingSchTrips.length > 0) {
          const tripToAccept = currentPendingSchTrips[0];
          const res = acceptScheduledTripByDriver(tripToAccept.id, currentDriver.id);
          if (res.success) {
            const feedback = `تم قبول الرحلة المجدولة المفتوحة رقم ${tripToAccept.id.split('_').pop()} بنجاح بالصوت!`;
            setVoiceFeedback(feedback);
            speakOutLoud(feedback);
          } else {
            setVoiceFeedback(res.msg);
            speakOutLoud(res.msg);
          }
          processed = true;
        } else if (currentPendingIntra) {
          const res = acceptIntraCityRide(currentPendingIntra.id, currentDriver.id);
          if (res.success) {
            const feedback = 'تم قبول طلب خدمات التوصيل الداخلي بالتحكم الصوتي بنجاح! توجه الآن للركاب.';
            setVoiceFeedback(feedback);
            speakOutLoud(feedback);
          } else {
            setVoiceFeedback(res.msg);
            speakOutLoud(res.msg);
          }
          processed = true;
        }

        if (!processed) {
          const feedback = 'كابتن، لا تتوفر أي طلبات رحلات معلقة أو عروض حالية بانتظار القبول الصوتي في نظام آدم.';
          setVoiceFeedback(feedback);
          speakOutLoud(feedback);
        }
      }

      // VOICE COMMAND 2: Start Ride
      else if (
        lower.includes('ابدأ') || 
        lower.includes('ابدا') || 
        lower.includes('انقل') || 
        lower.includes('انطلق') || 
        lower.includes('تحرك')
      ) {
        setVoiceStatus('done');
        let processed = false;

        const activeIntercity = rides.find(r => r.driverId === currentDriver?.id && r.status !== 'completed');
        const activeIntraObj = intraCityRides.find(r => r.driverId === currentDriver?.id && r.status === 'accepted');

        if (activeIntercity && activeIntercity.status === 'accepted') {
          startRide(activeIntercity.id);
          const feedback = 'كابتن، انطلقت الرحلة الرسمية الآن! يتمنى لكم تطبيق آدم رحلة رائعة وموفقة.';
          setVoiceFeedback(feedback);
          speakOutLoud(feedback);
          processed = true;
        } else if (activeIntraObj) {
          startIntraCityRide(activeIntraObj.id);
          const feedback = 'تم بدء التوصيل الصوتي لرحلة المشوار الداخلي الفوري!';
          setVoiceFeedback(feedback);
          speakOutLoud(feedback);
          processed = true;
        }

        if (!processed) {
          const feedback = 'لم نجد أي رحلة مؤكدة بوضعية الانتظار للبدء بها حالياً كابتن.';
          setVoiceFeedback(feedback);
          speakOutLoud(feedback);
        }
      }

      // VOICE COMMAND 3: End Ride
      else if (
        lower.includes('إنهاء') || 
        lower.includes('انهاء') || 
        lower.includes('المشوار') || 
        lower.includes('وصلنا') || 
        lower.includes('خلصنا') || 
        lower.includes('الإنهاء') || 
        lower.includes('الانهاء')
      ) {
        setVoiceStatus('done');
        let processed = false;

        const activeIntercity = rides.find(r => r.driverId === currentDriver?.id && r.status === 'started');
        const activeIntraObj = intraCityRides.find(r => r.driverId === currentDriver?.id && r.status === 'started');

        if (activeIntercity) {
          endRide(activeIntercity.id);
          const feedback = 'ألف الحمد لله على السلامة كابتن وجزاك الله كل خير! تم إنهاء المشوار بنجاح بالصوت، وتدوين الأرباح بمحفظتك.';
          setVoiceFeedback(feedback);
          speakOutLoud(feedback);
          processed = true;
        } else if (activeIntraObj) {
          endIntraCityRide(activeIntraObj.id);
          const feedback = 'الحمد لله على السلامة! تم إنهاء رحلة التوصيل الفورية بنجاح بالتحكم الصوتي الآمن كابتن.';
          setVoiceFeedback(feedback);
          speakOutLoud(feedback);
          processed = true;
        }

        if (!processed) {
          const feedback = 'كابتن، لا توجد أي رحلة نشطة جارية بوضع التوصيل حالياً لإنهاء مشوارها.';
          setVoiceFeedback(feedback);
          speakOutLoud(feedback);
        }
      }

      // VOICE COMMAND 4: Driver active online toggle matching "تفعيل" "نشط" "استقبال" "دخول" "اونلاين" "أونلاين"
      else if (
        lower.includes('تفعيل') || 
        lower.includes('نشاط') || 
        lower.includes('استقبال') || 
        lower.includes('اونلاين') || 
        lower.includes('أونلاين') || 
        lower.includes('متصل')
      ) {
        setVoiceStatus('done');
        let speechFeedback = '';
        if (currentDriver && !currentDriver.isOnline) {
          handleToggleOnline();
          speechFeedback = 'تم فك تشفير الصوت بنجاح وتم تحويل حالتك لتكون متصلاً ومتاحاً لاستقبال طلبات الركاب الأردنية الآن!';
        } else {
          speechFeedback = 'أنت بالفعل مسجل بوضعية الاستقبال والاتصال النشط حالياً كابتن!';
        }
        setVoiceFeedback(speechFeedback);
        speakOutLoud(speechFeedback);
      }

      // VOICE COMMAND 5: Password change settings navigation
      else if (lower.includes('سر') || lower.includes('المرور') || lower.includes('كلمة السر')) {
        setActiveTab('settings');
        setVoiceStatus('done');
        const feedback = 'تم توجيهك بنجاح لصفحة تحديث وتأمين كلمة السر الشخصية الخاصة بك كابتن.';
        setVoiceFeedback(feedback);
        speakOutLoud(feedback);
      }

      // VOICE COMMAND 6: E-Wallet and earnings check
      else if (lower.includes('سجل') || lower.includes('محفظ') || lower.includes('رصيد') || lower.includes('اربح')) {
        setActiveTab('wallet');
        setVoiceStatus('done');
        const feedback = 'تم فتح صفحة المحفظة المالية بنجاح كابتن! يمكنك هنا معاينة الأرباح الإجمالية والصافية لمشاويرك.';
        setVoiceFeedback(feedback);
        speakOutLoud(feedback);
      }

      // VOICE COMMAND 7: Driving Mode Toggle Vocal triggers
      else if (lower.includes('وضع القيادة') || lower.includes('قيادة آمنة') || lower.includes('تفعيل القيادة')) {
        setVoiceStatus('done');
        setIsDriveMode(true);
        const feedback = 'تم تفعيل وضع القيادة الآمن بالتحكم الصوتي بنجاح كابتن! مساعد جيميناي الصوتي يستمع إليك تلقائياً الآن دون تشتيت.';
        setVoiceFeedback(feedback);
        speakOutLoud(feedback);
      }

      else {
        setVoiceStatus('done');
        const feedback = `استقبلت نداءك الصوتي كابتن: "${commandText}". تم ربط الأمر بنجاح بذكاء آدم. يمكنك قول "قبول الطلب" أو "إنهاء المشوار" للتحكم.`;
        setVoiceFeedback(feedback);
        speakOutLoud(feedback);
      }
    }, 1200);
  };

  const speakOutLoud = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ar-JO';
      window.speechSynthesis.speak(u);
    }
  };

  const handleStartVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.lang = 'ar-JO';
        rec.interimResults = false;
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          setVoiceStatus('listening');
          setVoiceTranscript('جاري الاستماع لتردد صوت الكابتن... تحدّث بنبرة واضحة 🎙️');
          setVoiceFeedback('');
        };

        rec.onerror = (err: any) => {
          console.error(err);
          setVoiceStatus('error');
          setVoiceFeedback('تنبيه: تعذر التقاط التردد الصوتي الفعلي. لا تقلق كابتن، يمكنك نقر أحد النماذج الجاهزة أو كتابة أمرك الصوتي هنا يدوياً.');
        };

        rec.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          if (resultText) {
            handleProcessVoiceCommand(resultText);
          } else {
            setVoiceStatus('error');
            setVoiceFeedback('فشل تحليل الكلام الصوتي. الرجاء المحاولة مجدداً.');
          }
        };

        rec.start();
      } catch (e) {
        setVoiceStatus('listening');
        setVoiceTranscript('جاري محاكاة الاستماع (الرجاء استخدام الأزرار الجاهزة)');
      }
    } else {
      setVoiceStatus('listening');
      setVoiceTranscript('جاري الاستماع (تكلم الآن، أو اختر أمراً جاهزاً من القائمة أدناه)');
      setVoiceFeedback('');
    }
  };

  // External Bank & Wallet linkage State
  const [linkProvider, setLinkProvider] = useState<'zain' | 'orange' | 'umniah' | 'bank_etihad' | 'arab_bank' | 'cliq'>('zain');
  const [linkAccountName, setLinkAccountName] = useState('');
  const [linkAccountNumber, setLinkAccountNumber] = useState('');

  // Scheduled Tab Trip States (Captain creation)
  const [schFromGov, setSchFromGov] = useState<string>('');
  const [schFromDist, setSchFromDist] = useState<string>('');
  const [schFromVillage, setSchFromVillage] = useState<string>('');
  
  const [schToGov, setSchToGov] = useState<string>('');
  const [schToDist, setSchToDist] = useState<string>('');
  const [schToVillage, setSchToVillage] = useState<string>('');

  const [schSeats, setSchSeats] = useState<number>(4);
  const [schDateTime, setSchDateTime] = useState<string>('');
  
  // Date and Time split state for scheduling in advance with precision
  const [schDate, setSchDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // default to tomorrow
    return d.toISOString().split('T')[0];
  });
  const [schTime, setSchTime] = useState<string>('10:00');

  // Bidirectional sync between (schDate, schTime) and schDateTime
  useEffect(() => {
    if (schDate && schTime) {
      setSchDateTime(`${schDate}T${schTime}`);
    }
  }, [schDate, schTime]);

  useEffect(() => {
    if (schDateTime) {
      const parts = schDateTime.split('T');
      if (parts[0] && parts[0] !== schDate) {
        setSchDate(parts[0]);
      }
      if (parts[1] && parts[1] !== schTime) {
        setSchTime(parts[1].substring(0, 5));
      }
    }
  }, [schDateTime]);

  const [showSchAdvancedFields, setShowSchAdvancedFields] = useState<boolean>(false);

  // AI-Assisted One-Click Fast Scheduling States for Driver
  const [aiSchPromptText, setAiSchPromptText] = useState<string>('');
  const [isParsingAiSch, setIsParsingAiSch] = useState<boolean>(false);
  const [aiSchExplanation, setAiSchExplanation] = useState<string>('');

  const parseAiSchPrompt = async () => {
    if (!aiSchPromptText.trim()) {
      alert("الرجاء كتابة تفاصيل الرحلة المبرزة أولاً ليقوم الذكاء الاصطناعي بتعبئتها كابتن.");
      return;
    }
    try {
      setIsParsingAiSch(true);
      setAiSchExplanation('');
      const response = await fetch("/api/ai-parse-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: aiSchPromptText,
          currentTime: new Date().toISOString()
        })
      });
      const data = await response.json();
      if (data.success) {
        if (data.fromGov) setSchFromGov(data.fromGov);
        if (data.fromDist) setSchFromDist(data.fromDist);
        if (data.fromVillage) setSchFromVillage(data.fromVillage);
        if (data.toGov) setSchToGov(data.toGov);
        if (data.toDist) setSchToDist(data.toDist);
        if (data.toVillage) setSchToVillage(data.toVillage);
        if (data.seats) setSchSeats(Number(data.seats));
        if (data.dateTime) {
          const parts = data.dateTime.split('T');
          if (parts[0]) setSchDate(parts[0]);
          if (parts[1]) setSchTime(parts[1].substring(0, 5));
        }
        if (data.explanation) setAiSchExplanation(data.explanation);
      } else {
        alert("عذراً كابتن، لم نتمكن من تحليل العبارة تلقائياً. يرجى ملء الحقول يدوياً.");
      }
    } catch (error) {
      console.error("AI parsing error for captain:", error);
      alert("حدث خطأ أثناء الاتصال بالذكاء الاصطناعي لتفسير العبارة.");
    } finally {
      setIsParsingAiSch(false);
    }
  };

  const handleSwapSchLocations = () => {
    const tempGov = schFromGov;
    const tempDist = schFromDist;
    const tempVillage = schFromVillage;
    
    setSchFromGov(schToGov);
    setSchFromDist(schToDist);
    setSchFromVillage(schToVillage);
    
    setSchToGov(tempGov);
    setSchToDist(tempDist);
    setSchToVillage(tempVillage);
  };

  const [schSuccessMsg, setSchSuccessMsg] = useState('');
  const [schTabMode, setSchTabMode] = useState<'form' | 'passenger_trips' | 'my_trips' | 'calendar_sync' | 'daily_pinned'>('daily_pinned');

  // AI Interactive Matching Wizard State
  const [aiDriverText, setAiDriverText] = useState("");
  const [aiDriverLoading, setAiDriverLoading] = useState(false);
  const [aiDriverResult, setAiDriverResult] = useState<{
    type: 'group_match' | 'create_scheduled' | 'error';
    matchedTrips?: any[];
    parsedDetails?: {
      fromGov: string;
      fromDist?: string;
      toGov: string;
      toDist?: string;
      seats: number;
      dateTimeStr: string;
    };
    msg: string;
  } | null>(null);

  const handleAiDriverSubmit = async (customPrompt?: string) => {
    const promptToUse = customPrompt || aiDriverText;
    if (!promptToUse.trim()) {
      alert("يرجى كتابة خط سير الرحلة المأمول أو الضغط على أحد الاختصارات");
      return;
    }
    setAiDriverLoading(true);
    setAiDriverResult(null);
    try {
      const response = await fetch("/api/ai-parse-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: promptToUse,
          currentTime: new Date().toISOString()
        })
      });
      const data = await response.json();
      if (data.success) {
        const fGov = data.fromGov || "";
        const tGov = data.toGov || "";

        // Find individual pending passenger requests matching this route
        const matches = scheduledTrips.filter(t => 
          (t.creatorType === 'passenger' || (t.creatorType === 'admin' && !t.driverId)) &&
          t.status === 'pending' &&
          t.fromArea.startsWith(fGov) &&
          t.toArea.startsWith(tGov)
        );

        if (matches.length > 0) {
          setAiDriverResult({
            type: 'group_match',
            matchedTrips: matches,
            parsedDetails: data,
            msg: `🎉 رادار جيميناي نجح في تجميع عريض لـ ${matches.length} طلبات ركاب نشطة على هذا الخط! وبقيمة مالية مقدرة بـ ${matches.length * settings.passengerFarePerSeat} د.أ!`
          });
        } else {
          setAiDriverResult({
            type: 'create_scheduled',
            parsedDetails: data,
            msg: `✨ لم نجد طلبات فردية مسبقة من ركاب على هذا الخط الدقيق حالياً. هل ترغب في تسجيل وعرض موعد رحلة فارغ جديد بالنيابة عنك ليقوم الركاب بالانضمام والحجز فوراً؟`
          });
        }
      } else {
        setAiDriverResult({
          type: 'error',
          msg: data.msg || "عذراً، لم نتمكن من تحليل وتحديد مسار المدينتين الفعلي من العبارة."
        });
      }
    } catch (err) {
      console.error(err);
      setAiDriverResult({
        type: 'error',
        msg: "عذراً، تعطل معالج الذكاء الاصطناعي لغربلة خط الرحلة."
      });
    } finally {
      setAiDriverLoading(false);
    }
  };

  // Match Radar State
  const [radarRouteFilter, setRadarRouteFilter] = useState<string>('');
  const [radarDateFilter, setRadarDateFilter] = useState<string>('all');
  const [showRadarRawRides, setShowRadarRawRides] = useState<boolean>(false);

  // Geographical Return Radar State (رادار التوجيه الجغرافي)
  const [geoManualMode, setGeoManualMode] = useState<boolean>(false);
  const [geoOutboundGov, setGeoOutboundGov] = useState<string>('');
  const [geoReturnGov, setGeoReturnGov] = useState<string>('');

  // Dynamic travel calendar view states for Captain App
  const [schViewFormat, setSchViewFormat] = useState<'list' | 'calendar'>('list');
  const [currentCalendarYear, setCurrentCalendarYear] = useState(2026);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(5); // June
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | null>(null);

  // Dynamic AI Proximity Router loading and advice states for full trips
  const [aiOptimizingTripId, setAiOptimizingTripId] = useState<string | null>(null);
  const [aiSequenceAdvice, setAiSequenceAdvice] = useState<string>('');
  const [aiSortedPassengers, setAiSortedPassengers] = useState<any[]>([]);

  // Registration Form State
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regLicenseExpiry, setRegLicenseExpiry] = useState('2029-05-15');
  const [regCarType, setRegCarType] = useState('تويوتا بريوس (Toyota Prius)');
  const [regCarClass, setRegCarClass] = useState('سيدان هجين / هايبرد (Sedan Hybrid)');
  const [regCarPlate, setRegCarPlate] = useState('50-48202');
  const [regCarModel, setRegCarModel] = useState<number>(2023);
  const [regRegExpiry, setRegRegExpiry] = useState('2029-05-15');
  const [regNoCriminal, setRegNoCriminal] = useState(true);
  const [regGov, setRegGov] = useState('عمان (Amman)');
  const [regDist, setRegDist] = useState('لواء قصبة عمان');
  const [regVillage, setRegVillage] = useState('حي الشميساني');
  const [regPhoto, setRegPhoto] = useState<string>('');
  const [regIdFront, setRegIdFront] = useState<string>('');
  const [regIdBack, setRegIdBack] = useState<string>('');
  const [regLicFront, setRegLicFront] = useState<string>('');
  const [regLicBack, setRegLicBack] = useState<string>('');
  const [regVehFront, setRegVehFront] = useState<string>('');
  const [regVehBack, setRegVehBack] = useState<string>('');
  const [docUploadError, setDocUploadError] = useState<string | null>(null);

  const processAndValidateDocument = (
    file: File, 
    onSuccess: (dataUrl: string) => void
  ) => {
    setDocUploadError(null);
    if (!file.type.startsWith('image/')) {
      setDocUploadError('⚠️ فشل التحليل الآلي للوثيقة: نوع الملف غير مدعوم. يجب رفع صورة بصيغة JPG أو PNG أو WEBP.');
      return;
    }

    if (file.size < 8 * 1024) {
      setDocUploadError('⚠️ خطأ في جودة الوثيقة: الصورة المرفقة منخفضة الدقة وغير واضحة (حجم الملف أقل من 8KB). يرجى التقاط صورة جديدة بوضوح أعلى لتمرير الفحص الآلي.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        if (img.width < 300 || img.height < 300) {
          setDocUploadError(`⚠️ خطأ في مواصفات الوثيقة: أبعاد الصورة المرفقة (${img.width}x${img.height} بكسل) منخفضة جداً ولا تطابق المواصفات المطلوبة. يجب ألا تقل الأبعاد عن 300x300 بكسل لضمان وضوح البيانات والقراءة الآلية.`);
          return;
        }
        onSuccess(dataUrl);
      };
      img.onerror = () => {
        setDocUploadError('⚠️ تعذر تحليل ملف الصورة المرفق. قد تكون الصورة تالفة، يرجى إعادة رفع صورة جديدة.');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };
  
  // AI-powered vehicle brand & model list state
  const [driverVehicleData, setDriverVehicleData] = useState<{ name: string, models: string[] }[]>(DEFAULT_JORDAN_VEHICLES);
  const [driverRegBrandSel, setDriverRegBrandSel] = useState<string>('');
  const [driverRegModelSel, setDriverRegModelSel] = useState<string>('');
  const [driverEditBrandSel, setDriverEditBrandSel] = useState<string>('');
  const [driverEditModelSel, setDriverEditModelSel] = useState<string>('');

  useEffect(() => {
    fetch('/api/get-vehicles')
      .then(res => {
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return null;
        return res.json().catch(() => null);
      })
      .then(data => {
        if (data && data.success && data.brands && data.brands.length > 0) {
          setDriverVehicleData(data.brands);
        }
      })
      .catch(() => {
        // Silently keep default vehicles list
      });
  }, []);

  const [errMessage, setErrMessage] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  // Chat/Rating State
  const [chatText, setChatText] = useState('');

  // Quick Replies State
  const [quickReplies, setQuickReplies] = useState<string[]>(() => {
    const saved = localStorage.getItem('adam_driver_quick_replies');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      'السلام عليكم، أنا في الطريق إليك.',
      'لقد وصلت إلى موقعك الآن.',
      'يرجى الانتظار، دقيقتين وسأكون عندك.',
      'هل يمكنك تأكيد الموقع الدقيق؟',
      'أنا في المكان المحدد تماماً.'
    ];
  });
  const [newQuickReply, setNewQuickReply] = useState('');
  const [showQuickReplyInput, setShowQuickReplyInput] = useState(false);

  const addQuickReply = (text: string) => {
    if (!text.trim()) return;
    const updated = [...quickReplies, text.trim()];
    setQuickReplies(updated);
    localStorage.setItem('adam_driver_quick_replies', JSON.stringify(updated));
    setNewQuickReply('');
    setShowQuickReplyInput(false);
  };

  const deleteQuickReply = (idx: number) => {
    const updated = quickReplies.filter((_, i) => i !== idx);
    setQuickReplies(updated);
    localStorage.setItem('adam_driver_quick_replies', JSON.stringify(updated));
  };

  const [psgRatingScores, setPsgRatingScores] = useState<{ [psgId: string]: number }>({});
  const [psgRatingNotes, setPsgRatingNotes] = useState<{ [psgId: string]: string }>({});
  const [ratingSubmittedList, setRatingSubmittedList] = useState<{ [psgId: string]: boolean }>({});

  // Filter States for Scheduled Trips Search
  const [filterGov, setFilterGov] = useState<string>('');
  const [filterDist, setFilterDist] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterTime, setFilterTime] = useState<string>('');
  const [filterAvailableOnly, setFilterAvailableOnly] = useState<boolean>(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false);

  const getHourOfTrip = (t: any) => {
    const timeStr = t.dailyDepartureHour || t.departureTime || '';
    const timePart = timeStr.includes(' ') ? timeStr.split(' ')[1] : timeStr;
    const hourPart = timePart.split(':')[0];
    return hourPart ? parseInt(hourPart, 10) : NaN;
  };

  const applyUnifiedFilters = (trips: any[]) => {
    return trips.filter(t => {
      // 1. Governorate Filter
      if (filterGov) {
        const inFrom = t.fromArea?.includes(filterGov);
        const inTo = t.toArea?.includes(filterGov);
        if (!inFrom && !inTo) return false;
      }
      // 2. District Filter
      if (filterDist) {
        const inFrom = t.fromArea?.includes(filterDist);
        const inTo = t.toArea?.includes(filterDist);
        if (!inFrom && !inTo) return false;
      }
      // 3. Date From Filter
      if (filterDateFrom && t.departureTime) {
        const tripDate = t.departureTime.substring(0, 10);
        if (tripDate < filterDateFrom) return false;
      }
      // 4. Date To Filter
      if (filterDateTo && t.departureTime) {
        const tripDate = t.departureTime.substring(0, 10);
        if (tripDate > filterDateTo) return false;
      }
      // 5. Time / Hour Filter
      if (filterTime) {
        const hour = getHourOfTrip(t);
        if (!isNaN(hour)) {
          if (filterTime === 'morning' && (hour < 6 || hour >= 12)) return false;
          if (filterTime === 'afternoon' && (hour < 12 || hour >= 17)) return false;
          if (filterTime === 'evening' && (hour < 17 && hour >= 6)) return false;
          if (filterTime !== 'morning' && filterTime !== 'afternoon' && filterTime !== 'evening') {
            if (String(hour).padStart(2, '0') !== filterTime) return false;
          }
        }
      }
      // 6. Available Seats only Filter (hide full rides)
      if (filterAvailableOnly) {
        if (t.availableSeats !== undefined && t.availableSeats <= 0) return false;
      }
      return true;
    });
  };

  const isDriverLoggedIn = currentDriver && currentDriver.role !== 'admin' && currentDriver.licenseExpiry !== undefined;
  const loggedDriver = isDriverLoggedIn ? (drivers.find(d => d.id === currentDriver.id) || currentDriver) : null;

  const driverNotifications = loggedDriver 
    ? notifications.filter(n => n.userId === loggedDriver.id && n.userType === 'driver')
    : [];
  const unreadCount = driverNotifications.filter(n => !n.isRead).length;

  const showCompletedRideModal = !!(loggedDriver && lastEndedRideInfo && 
    (lastEndedRideInfo.driverId === loggedDriver.id || lastEndedRideInfo.forUserId === loggedDriver.id) && 
    lastEndedRideInfo.id !== dismissedRideId && !dismissedRideIds.includes(lastEndedRideInfo.id) && !(lastEndedRideInfo && (Date.now() - new Date(lastEndedRideInfo.timestamp || lastEndedRideInfo.completedAt || 0).getTime() > 60 * 60 * 1000)));

  const totalAmount = lastEndedRideInfo 
    ? (lastEndedRideInfo.totalAmount ?? Object.values(lastEndedRideInfo.passengerFares || {}).reduce((sum: number, fare: any) => sum + (Number(fare) || 0), 0))
    : 0;

  // Completed Ride & Cash / Rating State Maps
  const [driverCashConfirmedMap, setDriverCashConfirmedMap] = useState<{ [rideId: string]: boolean }>({});
  const [driverRatingValMap, setDriverRatingValMap] = useState<{ [rideId: string]: number }>({});
  const [driverRatingTagsMap, setDriverRatingTagsMap] = useState<{ [rideId: string]: string[] }>({});
  const [driverRatingNoteMap, setDriverRatingNoteMap] = useState<{ [rideId: string]: string }>({});

  // Settings Tab State
  const [prefSms, setPrefSms] = useState(true);
  const [prefChat, setPrefChat] = useState(true);
  const [prefReminders, setPrefReminders] = useState(true);

  // Profile fields editing state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCarDesc, setEditCarDesc] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Password changing forms:
  const [newDriverPasswordInput, setNewDriverPasswordInput] = useState('');
  const [driverPasswordFeedback, setDriverPasswordFeedback] = useState('');

  // GPS Coordinates Radar State Variables
  const [radarSubTab, setRadarSubTab] = useState<'pooling' | 'radar'>('pooling');
  const [radarDistance, setRadarDistance] = useState<number>(30); // in kilometers
  const [radarGovFilter, setRadarGovFilter] = useState<string>('');
  const [radarDistFilter, setRadarDistFilter] = useState<string>('');
  const [radarSortKey, setRadarSortKey] = useState<'distance' | 'seats'>('distance');
  const [selectedRoutePreview, setSelectedRoutePreview] = useState<RideRequest | null>(null);
  const [simulatorGov, setSimulatorGov] = useState<string>('');
  const [simulatorDist, setSimulatorDist] = useState<string>('');

  useEffect(() => {
    if (loggedDriver) {
      setEditName(loggedDriver.fullName);
      setEditPhone(loggedDriver.phone);
      setEditEmail(loggedDriver.email);
      setEditCarDesc(loggedDriver.carType || '');
      setEditPhoto(loggedDriver.documents?.photo || '');

      // Guess brand & model based on logged driver carType
      let matchedBrand = '';
      let matchedModel = '';
      if (driverVehicleData && driverVehicleData.length > 0) {
        for (const b of driverVehicleData) {
          if (b.models.includes(loggedDriver.carType)) {
            matchedBrand = b.name;
            matchedModel = loggedDriver.carType;
            break;
          }
        }
        if (!matchedBrand) {
          for (const b of driverVehicleData) {
            const found = b.models.find(m => 
              m.toLowerCase().includes(loggedDriver.carType.toLowerCase()) || 
              loggedDriver.carType.toLowerCase().includes(m.toLowerCase())
            );
            if (found) {
              matchedBrand = b.name;
              matchedModel = found;
              break;
            }
          }
        }
      }
      if (matchedBrand) {
        setDriverEditBrandSel(matchedBrand);
        setDriverEditModelSel(matchedModel);
      } else {
        setDriverEditBrandSel('custom');
        setDriverEditModelSel('custom');
      }
    }
  }, [loggedDriver?.id, driverVehicleData]);

  // Google Calendar Auto-Sync Engine Support
  const [calendarSyncTrigger, setCalendarSyncTrigger] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setCalendarSyncTrigger(prev => prev + 1);
    };
    window.addEventListener('adam_calendar_autosync_updated', handleUpdate);
    window.addEventListener('adam_calendar_synced_updated', handleUpdate);
    return () => {
      window.removeEventListener('adam_calendar_autosync_updated', handleUpdate);
      window.removeEventListener('adam_calendar_synced_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (!loggedDriver) return;

    const autoSyncEnabled = localStorage.getItem('adam_calendar_autosync') === 'true';
    const accessToken = localStorage.getItem('adam_calendar_token');

    if (!autoSyncEnabled || !accessToken) return;

    // Filter scheduled trips accepted by this driver
    const acceptedTrips = scheduledTrips.filter(
      t => t.driverId === loggedDriver.id && t.status === 'accepted'
    );

    if (acceptedTrips.length === 0) return;

    // Load currently synced trips
    let synced: Record<string, string> = {};
    try {
      const stored = localStorage.getItem('adam_calendar_synced_trips');
      synced = stored ? JSON.parse(stored) : {};
    } catch (e) {
      synced = {};
    }

    // Find unsynced ones
    const unsyncedTrips = acceptedTrips.filter(t => !synced[t.id]);
    if (unsyncedTrips.length === 0) return;

    const convertToIso = (depTimeStr: string) => {
      try {
        const sanitized = depTimeStr.trim().replace(' ', 'T');
        if (sanitized.includes('T')) {
          return `${sanitized}:00`;
        }
        return sanitized;
      } catch {
        return new Date().toISOString();
      }
    };

    const getEndTimeIso = (depTimeStr: string) => {
      try {
        const isoStr = convertToIso(depTimeStr);
        const date = new Date(isoStr);
        date.setHours(date.getHours() + 1);
        return date.toISOString().substring(0, 19);
      } catch {
        return new Date().toISOString();
      }
    };

    const syncSingleTrip = async (trip: any) => {
      const cleanFrom = trip.fromArea.split(' - ').slice(-1)[0] || trip.fromArea;
      const cleanTo = trip.toArea.split(' - ').slice(-1)[0] || trip.toArea;

      const eventData = {
        summary: `🚕 رحلة تشاركية مجدولة: ${cleanFrom} ➔ ${cleanTo}`,
        location: `مكان التقاط: ${trip.fromArea} | مكان النزول: ${trip.toArea}`,
        description: `تفاصيل رحلتك المجدولة من تطبيق آدم التشاركي الذكي:\n\n` + 
          `• من: ${trip.fromArea}\n` +
          `• إلى: ${trip.toArea}\n` +
          `• وقت المغادرة: ${trip.departureTime}\n` +
          `• الكابتن: ${trip.driverName || 'بانتظار قبول الرحلة'}\n` +
          `• الركاب: ${trip.passengers?.map((p: any) => `${p.fullName} (${p.seatsCount} مقعد)`).join(', ') || 'لا يوجد ركاب آخرين حالياً'}\n\n` +
          `تمت المزامنة التلقائية الفورية من تطبيق آدم بموافقتك 🚀`,
        start: {
          dateTime: convertToIso(trip.departureTime),
          timeZone: 'Asia/Amman'
        },
        end: {
          dateTime: getEndTimeIso(trip.departureTime),
          timeZone: 'Asia/Amman'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 },
            { method: 'popup', minutes: 120 }
          ]
        }
      };

      try {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        });

        if (response.ok) {
          const resData = await response.json();
          synced[trip.id] = resData.id;
          localStorage.setItem('adam_calendar_synced_trips', JSON.stringify(synced));
          window.dispatchEvent(new Event('adam_calendar_synced_updated'));
          console.log(`[Google Calendar AutoSync] Synced trip ${trip.id} successfully: ${resData.id}`);
        } else {
          console.error(`[Google Calendar AutoSync] Failed to sync trip ${trip.id}:`, response.status);
        }
      } catch (err) {
        console.error(`[Google Calendar AutoSync] Error syncing trip ${trip.id}:`, err);
      }
    };

    const syncAll = async () => {
      for (const trip of unsyncedTrips) {
        await syncSingleTrip(trip);
      }
    };

    syncAll();
  }, [scheduledTrips, loggedDriver?.id, calendarSyncTrigger]);

  // Active Ride for this Driver
  const activeRide = loggedDriver 
    ? rides.find(r => r.driverId === loggedDriver.id && r.status !== 'completed') 
    : null;

  const activeIntraRide = loggedDriver
    ? (intraCityRides || []).find(r => r.driverId === loggedDriver.id && (r.status === 'accepted' || r.status === 'started'))
    : null;

  const [driverGpsTelemetry, setDriverGpsTelemetry] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    speed: number;
    heading: number;
    updatedAt: Date;
    isReal: boolean;
  } | null>(null);
  const [isGpsRefreshing, setIsGpsRefreshing] = useState(false);

  // 🛰️ Uber-Grade Live High-Accuracy Continuous & Periodic GPS Tracking for Driver
  useEffect(() => {
    if (!loggedDriver || !('geolocation' in navigator)) return;

    let watchId: number | null = null;
    let heartbeatInterval: any = null;

    const handleGpsUpdate = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy, speed, heading } = pos.coords;
      const canvasCoords = getCanvasCoordsFromGeo(latitude, longitude);

      const speedKmH = speed ? Math.round(speed * 3.6) : 0;
      const accMeters = Math.round(accuracy || 0);
      const headingDeg = heading ? Math.round(heading) : 0;

      setDriverGpsTelemetry({
        lat: latitude,
        lng: longitude,
        accuracy: accMeters,
        speed: speedKmH,
        heading: headingDeg,
        updatedAt: new Date(),
        isReal: true
      });

      const updatedLocation = {
        x: canvasCoords.x,
        y: canvasCoords.y,
        name: `موقع الكابتن المباشر GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) - دقة ${accMeters}م`,
        lat: latitude,
        lng: longitude,
        accuracy: accMeters,
        speed: speedKmH,
        heading: headingDeg,
        isRealGps: true,
        updatedAt: new Date().toISOString()
      };

      if (updateDriverLocation && loggedDriver.id) {
        updateDriverLocation(loggedDriver.id, updatedLocation);
      }

      const currentActiveRideId = activeRide?.id || activeIntraRide?.id;
      if (currentActiveRideId) {
        window.dispatchEvent(new CustomEvent('adam_ws_telemetry', {
          detail: {
            rideId: currentActiveRideId,
            driverId: loggedDriver.id,
            x: canvasCoords.x,
            y: canvasCoords.y,
            lat: latitude,
            lng: longitude,
            accuracy: accMeters,
            speed: speedKmH,
            heading: headingDeg,
            isRealGps: true,
            timestamp: new Date().toISOString()
          }
        }));
      }
    };

    const startDriverGpsTracking = () => {
      try {
        watchId = navigator.geolocation.watchPosition(
          handleGpsUpdate,
          (err) => {
            console.warn('Driver Live GPS watch notice:', err.message);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 10000
          }
        );

        // Continuous heartbeat polling every 5 seconds to guarantee uninterrupted updates
        heartbeatInterval = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            handleGpsUpdate,
            (err) => console.warn('Driver Periodic GPS sync warning:', err.message),
            {
              enableHighAccuracy: true,
              maximumAge: 2000,
              timeout: 6000
            }
          );
        }, 5000);
      } catch (err) {
        console.warn('Driver GPS watch error:', err);
      }
    };

    startDriverGpsTracking();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, [loggedDriver?.id, loggedDriver?.isOnline, activeRide?.id, activeIntraRide?.id, updateDriverLocation]);

  const handleManualGpsRecalibrate = () => {
    if (!('geolocation' in navigator) || !loggedDriver) return;
    setIsGpsRefreshing(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed, heading } = pos.coords;
        const canvasCoords = getCanvasCoordsFromGeo(latitude, longitude);
        const speedKmH = speed ? Math.round(speed * 3.6) : 0;
        const accMeters = Math.round(accuracy || 0);

        setDriverGpsTelemetry({
          lat: latitude,
          lng: longitude,
          accuracy: accMeters,
          speed: speedKmH,
          heading: heading ? Math.round(heading) : 0,
          updatedAt: new Date(),
          isReal: true
        });

        if (updateDriverLocation && loggedDriver.id) {
          updateDriverLocation(loggedDriver.id, {
            x: canvasCoords.x,
            y: canvasCoords.y,
            name: `موقع الكابتن المباشر GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) - دقة ${accMeters}م`,
            lat: latitude,
            lng: longitude,
            accuracy: accMeters,
            speed: speedKmH,
            heading: heading ? Math.round(heading) : 0,
            isRealGps: true,
            updatedAt: new Date().toISOString()
          });
        }
        setIsGpsRefreshing(false);
      },
      (err) => {
        console.warn('Manual recalibrate error:', err.message);
        setIsGpsRefreshing(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
    );
  };

  // Let's also check if there is an offered ride specifically for this driver to accept/reject
  const offeredRide = loggedDriver
    ? rides.find(r => r.offeredToDriverId === loggedDriver.id && r.status === 'offered')
    : null;

  const [isNewOfferAlert, setIsNewOfferAlert] = useState(false);
  useEffect(() => {
    if (offeredRide?.id) {
      setIsNewOfferAlert(true);
      // Play ringing sound alert configured from admin panel
      playNotificationTone(settings?.notificationSoundTone || 'chime', settings?.notificationSoundVolume ?? 0.45);
      const timer = setTimeout(() => {
        setIsNewOfferAlert(false);
      }, 6000); // 6 seconds alert
      return () => clearTimeout(timer);
    } else {
      setIsNewOfferAlert(false);
    }
  }, [offeredRide?.id, settings?.notificationSoundTone, settings?.notificationSoundVolume]);

  // Priority IntraCity Incoming Ride Request for Online Captains
  const pendingIntraOffer = React.useMemo(() => {
    if (!loggedDriver || !loggedDriver.isOnline) return null;
    if (activeRide || loggedDriver.activeRideId) return null;
    const activeIntra = (intraCityRides || []).find(r => r.driverId === loggedDriver.id && r.status !== 'completed' && r.status !== 'cancelled');
    if (activeIntra) return null;

    const list = (intraCityRides || []).filter(r => 
      r.status === 'pending' && 
      !r.driverId && 
      (!r.declinedDriverIds || !r.declinedDriverIds.includes(loggedDriver.id))
    );
    if (list.length === 0) return null;

    // Direct targeted driver has priority
    const targeted = list.find(r => r.targetedDriverId === loggedDriver.id);
    if (targeted) return targeted;

    // Otherwise return first available pending ride
    return list[0];
  }, [intraCityRides, loggedDriver, activeRide]);

  const [offerCountdown, setOfferCountdown] = useState<number>(20);

  useEffect(() => {
    if (pendingIntraOffer && loggedDriver?.isOnline) {
      setOfferCountdown(20);
      startIncomingRideAlarm(settings?.notificationSoundVolume ?? 0.85);

      const interval = setInterval(() => {
        setOfferCountdown(prev => {
          if (prev <= 1) {
            if (loggedDriver) {
              declineIntraCityRide(pendingIntraOffer.id, loggedDriver.id);
            }
            stopIncomingRideAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(interval);
        stopIncomingRideAlarm();
      };
    } else {
      stopIncomingRideAlarm();
    }
  }, [pendingIntraOffer?.id, loggedDriver?.isOnline, settings?.notificationSoundVolume]);

  // Track new notifications to trigger shake and sound chime alert
  const [isBellShaking, setIsBellShaking] = useState(false);
  const [latestToast, setLatestToast] = useState<{ id: string; title: string; body: string } | null>(null);
  const [toastShake, setToastShake] = useState(false);
  const prevNotificationsLength = React.useRef(driverNotifications.length);

  useEffect(() => {
    if (!loggedDriver) return;
    
    // Check if a new notification has actually been added
    if (driverNotifications.length > prevNotificationsLength.current) {
      // Find the newest one by sorting descending of createdAt
      const sorted = [...driverNotifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const newest = sorted[0];

      if (newest) {
        setIsBellShaking(true);
        setLatestToast({
          id: newest.id,
          title: newest.title,
          body: newest.body
        });
        setToastShake(true);

        // Sound alert sequence using configured tone from admin control panel
        playNotificationTone(settings?.notificationSoundTone || 'chime', settings?.notificationSoundVolume ?? 0.4);

        // Reset shaking states after animation duration
        const shakeTimer = setTimeout(() => {
          setIsBellShaking(false);
        }, 1000);

        const toastShakeTimer = setTimeout(() => {
          setToastShake(false);
        }, 800);

        // Auto-dismiss toast banner after 6 seconds
        const dismissTimer = setTimeout(() => {
          setLatestToast(null);
        }, 6000);

        return () => {
          clearTimeout(shakeTimer);
          clearTimeout(toastShakeTimer);
          clearTimeout(dismissTimer);
        };
      }
    }
    prevNotificationsLength.current = driverNotifications.length;
  }, [driverNotifications.length, loggedDriver?.id]);

  // Auto-launch deep navigation states for Intercity rides
  const [autoLaunchMapPref, setAutoLaunchMapPref] = useState<'none' | 'google' | 'waze'>(() => {
    return (localStorage.getItem('adam_auto_launch_map') as any) || 'none';
  });
  const [lastAutoLaunchedRideId, setLastAutoLaunchedRideId] = useState<string | null>(null);
  const [autoLaunchStatusMsg, setAutoLaunchStatusMsg] = useState<string>('');

  // Auto-listener for intercity ride status === 'accepted'
  React.useEffect(() => {
    if (activeRide && activeRide.status === 'accepted') {
      if (lastAutoLaunchedRideId !== activeRide.id && autoLaunchMapPref !== 'none') {
        setLastAutoLaunchedRideId(activeRide.id);
        const startPoint = activeRide.fromArea;
        const coords = getLocationCoords(startPoint);
        const geo = getGeoCoords(coords.x, coords.y);

        let launchPath = '';
        let appName = '';
        if (autoLaunchMapPref === 'google') {
          launchPath = `https://www.google.com/maps/search/?api=1&query=${geo.lat},${geo.lng}`;
          appName = 'خرائط Google';
        } else if (autoLaunchMapPref === 'waze') {
          launchPath = `https://waze.com/ul?ll=${geo.lat},${geo.lng}&navigate=yes`;
          appName = 'تطبيق Waze';
        }

        if (launchPath) {
          setAutoLaunchStatusMsg(`🚨 جاري تحويلك تلقائياً إلى ${appName} لموقع تجمع ركاب القافلة...`);
          setTimeout(() => {
            window.open(launchPath, '_blank');
            setAutoLaunchStatusMsg('');
          }, 1500);
        }
      }
    }
  }, [activeRide?.id, activeRide?.status, autoLaunchMapPref, lastAutoLaunchedRideId]);

  // Gemini AI automatic ride status summary on opening chat
  const [aiRideSummary, setAiRideSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);

  React.useEffect(() => {
    if (activeTab === 'chat' && activeRide) {
      setLoadingSummary(true);
      fetch('/api/ai-ride-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupName: activeRide.fromArea,
          dropoffName: activeRide.toArea,
          distanceKm: activeRide.distanceKm || '6.5',
          durationMin: activeRide.durationMin || '15',
          price: activeRide.price || '3.50',
          passengerName: activeRide.passengerName || 'عضو مستخدم',
          driverName: loggedDriver?.fullName || 'كابتن آدم',
          status: activeRide.status
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.text) {
          setAiRideSummary(data.text);
        }
      })
      .catch(err => console.error("Error loading Gemini ride summary for driver:", err))
      .finally(() => setLoadingSummary(false));
    } else if (!activeRide) {
      setAiRideSummary('');
    }
  }, [activeTab, activeRide?.id, activeRide?.status]);

  // Animated active ride route progress states
  const [progress, setProgress] = useState(0);
  const [pulse, setPulse] = useState(0);

  // Polling mechanism to automatically refresh incoming ride requests
  const [isPollingActive, setIsPollingActive] = useState(true);
  const [lastAutoRefreshed, setLastAutoRefreshed] = useState<Date>(new Date());

  useEffect(() => {
    if (!isPollingActive) return;

    const interval = setInterval(() => {
      try {
        syncStateWithLocalStorage();
        setLastAutoRefreshed(new Date());
      } catch (e) {
        console.error("Failed to auto-refresh requests", e);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [isPollingActive, syncStateWithLocalStorage]);

  // AI Co-Pilot Speed Trap & Police Radar States
  const [isIntercityVoiceEnabled, setIsIntercityVoiceEnabled] = useState<boolean>(true);
  const [intercityWarnedThreatIds, setIntercityWarnedThreatIds] = useState<Set<string>>(new Set());
  const [intercitySpeedometer, setIntercitySpeedometer] = useState<number>(90);
  const [intercityCommunityThreats, setIntercityCommunityThreats] = useState<any[]>([]);

  // Memoized baseline + community intercity threats
  const activeIntercityRideThreats = React.useMemo(() => {
    if (!activeRide) return [];

    const baseline = [
      {
        id: 'ic-fixed-cam-1',
        type: 'fixed_camera',
        nameAr: 'كاميرا سرعة رادار ثابتة (الطريق السريع الدولي)',
        nameEn: 'Highway Fixed Speed Camera',
        percent: 0.30,
        limit: 100,
        confidence: 100
      },
      {
        id: 'ic-police-patrol-1',
        type: 'police_checkpoint',
        nameAr: 'دورية شرطة السير الخارجية والدوريات المشتركة',
        nameEn: 'External Patrol Police Checkpoint',
        percent: 0.60,
        limit: 80,
        confidence: 95
      },
      {
        id: 'ic-mobile-radar-1',
        type: 'mobile_radar',
        nameAr: 'رادار سرعة خارجي متحرك ومخفي بـ AI',
        nameEn: 'AI Detected Hidden Mobile Radar',
        percent: 0.85,
        limit: 100,
        confidence: 89
      }
    ];

    return [...baseline, ...intercityCommunityThreats.filter(t => t.rideId === activeRide.id)];
  }, [activeRide?.id, intercityCommunityThreats]);

  const handleReportIntercityThreat = (type: 'fixed_camera' | 'mobile_radar' | 'police_checkpoint') => {
    if (!activeRide) return;
    
    let labelAr = '';
    let labelEn = '';
    let speedLimit = 100;

    if (type === 'fixed_camera') {
      labelAr = 'بلاغ فوري: كاميرا خارجية ثابتة';
      labelEn = 'External Fixed Camera Alert';
      speedLimit = 100;
    } else if (type === 'mobile_radar') {
      labelAr = 'بلاغ فوري: رادار متحرك بالليزر';
      labelEn = 'Mobile Laser Radar Alert';
      speedLimit = 100;
    } else {
      labelAr = 'بلاغ فوري: دورية طريق خارجية للشرطة';
      labelEn = 'External Highway Police Checkpoint';
      speedLimit = 80;
    }

    const newThreat = {
      id: `ic-comm-threat-${Date.now()}`,
      rideId: activeRide.id,
      type,
      nameAr: labelAr,
      nameEn: labelEn,
      percent: Math.min(0.95, progress + 0.05), // slightly ahead of current progress position
      limit: speedLimit,
      confidence: 90
    };

    setIntercityCommunityThreats(prev => [...prev, newThreat]);

    if (isIntercityVoiceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('تم تسجيل التبليغ بنجاح وتأكيده بالذكاء الاصطناعي لمجتمع قوافل آدم السريع');
      utterance.lang = 'ar-JO';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Proximity monitor for intercity threats
  useEffect(() => {
    if (!activeRide || activeRide.status !== 'started') return;

    setIntercitySpeedometer(prev => {
      const delta = Math.floor(Math.random() * 9) - 4; // -4 to +4
      const next = prev + delta;
      return next < 75 ? 88 : next > 115 ? 98 : next;
    });

    const upcoming = activeIntercityRideThreats.find(threat => {
      const distance = threat.percent - progress;
      return distance > 0 && distance <= 0.12;
    });

    if (upcoming) {
      if (!intercityWarnedThreatIds.has(upcoming.id)) {
        setIntercityWarnedThreatIds(prev => {
          const next = new Set(prev);
          next.add(upcoming.id);
          return next;
        });

        if (isIntercityVoiceEnabled && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(`تنبيه السلامة الذكي: اقتراب من ${upcoming.nameAr}. السرعة المسموحة ${upcoming.limit} كيلومتر بالساعة. يرجى التمهل.`);
          utterance.lang = 'ar-JO';
          window.speechSynthesis.speak(utterance);
        }
      }
    }
  }, [progress, activeRide?.id, activeRide?.status, activeIntercityRideThreats, isIntercityVoiceEnabled, intercityWarnedThreatIds]);

  useEffect(() => {
    let intervalId: any;
    if (activeRide) {
      intervalId = setInterval(() => {
        setPulse(p => (p + 1) % 360);
      }, 100);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeRide?.id]);

  useEffect(() => {
    if (!activeRide) return;
    if (activeRide.status === 'accepted') {
      setProgress(0);
      return;
    }
    if (activeRide.status === 'started') {
      const interval = setInterval(() => {
        setProgress(p => {
          const next = p + 0.008; // smooth speed
          return next > 1 ? 0 : next;
        });
      }, 80);
      return () => clearInterval(interval);
    }
  }, [activeRide?.id, activeRide?.status]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrMessage('');
    const res = login(usernameInput, passwordInput, 'driver');
    if (!res.success) {
      setErrMessage(res.msg);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrMessage('');
    setRegSuccessMsg('');

    if (!regFullName || !regUsername || !regPhone || !regEmail || !regCarType || !regCarPlate) {
      setErrMessage('يرجى تعبئة كافة الحقول الأساسية لمركبتك ومعلوماتك');
      return;
    }

    // Validate Jordan phone number: must be 10 digits and start with 07
    const jordanPhoneRegex = /^07\d{8}$/;
    if (!jordanPhoneRegex.test(regPhone)) {
      setErrMessage('❌ رقم الهاتف غير صحيح. يجب أن يتكون رقم الهاتف الأردني من 10 أرقام ويبدأ بـ 07 (مثال: 0791234567)');
      return;
    }

    // Car Model rule verification during submission
    if (regCarModel < settings.minCarModel) {
      setErrMessage(`عذراً، يفتقر نظام آدم لقبول موديلات أقدم من سنة ${settings.minCarModel}. شاشة التحكم تمنع هذا حالياً.`);
      return;
    }

    // Require complete set of files to be uploaded
    if (!regPhoto || !regIdFront || !regIdBack || !regLicFront || !regLicBack || !regVehFront || !regVehBack) {
      setErrMessage('يرجى أولاً إرفاق جميع الصور والمستندات الثبوتية المطلوبة للتحقق (الوجه الأمامي والخلفي للهوية، ورخصة القيادة، ورخصة المركبة، وصورتك الشخصية)');
      return;
    }

    const result = registerDriver({
      username: regUsername,
      fullName: regFullName,
      phone: regPhone,
      email: regEmail,
      country: detectedCountry,
      licenseExpiry: regLicenseExpiry,
      carType: regCarType,
      carClass: regCarClass,
      carPlate: regCarPlate,
      carModel: Number(regCarModel),
      carRegistrationExpiry: regRegExpiry,
      noCriminalRecord: regNoCriminal,
      governorate: regGov,
      district: regDist,
      documents: {
        idFront: regIdFront,
        idBack: regIdBack,
        licenseFront: regLicFront,
        licenseBack: regLicBack,
        carRegFront: regVehFront,
        carRegBack: regVehBack,
        photo: regPhoto
      }
    });

    if (!result.success) {
      setErrMessage(result.msg);
      return;
    }

    setRegSuccessMsg(`✅ تم تقديم طلب تسجيلك ككابتن بنجاح! اسم الدخول: ${result.generatedUsername} | تم إرسال كلمة المرور المؤقتة عبر رسالة SMS. الحساب قيد المراجعة والتدقيق الإداري.`);
    
    // Open simulated smartphone SMS notification modal
    setReceivedSmsModal({
      show: true,
      phone: regPhone,
      username: result.generatedUsername || regUsername,
      body: `مرحباً بك كابتن في تطبيق آدم بالأردن! تم استلام طلب تسجيلك ورفع وثائقك بنجاح. حسابك حالياً قيد المراجعة والتدقيق الإداري وسوف يتم تفعيله قريباً من لوحة الإدارة. تفاصيل حسابك المؤقت للدخول لاحقاً بعد التنشيط:\n\nاسم الدخول: ${result.generatedUsername}\nكلمة المرور المؤقتة: ${result.tempPassword}\n\nيرجى الانتظار حتى موافقة الإدارة وتفعيل حسابك لتتمكن من تسجيل الدخول والعمل.`,
      aiLog: result.aiLog
    });

    // Reset Form
    setRegFullName('');
    setRegUsername('');
    setRegPhone('');
    setRegEmail('');
  };

  const handleToggleOnline = () => {
    if (!loggedDriver) return;
    unlockAudioContext();
    setErrMessage('');
    const nextState = !loggedDriver.isOnline;
    if (nextState && launchGateInfo.isGated) {
      setShowLaunchGatedModal(true);
      return;
    }
    const res = setDriverOnline(loggedDriver.id, nextState);
    if (!res.success) {
      setErrMessage(res.msg);
    }
  };

  const handleAcceptRadarRequest = (req: RideRequest) => {
    if (!loggedDriver) return;
    if (!loggedDriver.isOnline) {
      alert(t('يجب أن تكون في وضع الاتصال أولاً لقبول الطلب!', 'You must be in online mode first to accept requests!'));
      return;
    }
    if (loggedDriver.activeRideId) {
      if (hasActualActiveRide(loggedDriver.activeRideId)) {
        alert(t('لديك رحلة نشطة حالياً، لا يمكنك قبول طلبات إضافية قبل إنهاء المشوار الحالي.', 'You already have an active ride and cannot accept additional requests.'));
        return;
      } else {
        clearActiveRideConflict(loggedDriver.id);
        loggedDriver.activeRideId = null;
      }
    }

    const rideId = 'ride_' + Date.now();
    const timestampStart = new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' });
    const timestampEnd = new Date(Date.now() + 30 * 60000).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' });

    const newRide: PooledRide = {
      id: rideId,
      driverId: loggedDriver.id,
      requests: [{ ...req, status: 'accepted', rideId }],
      fromArea: req.fromArea,
      toArea: req.toArea,
      status: 'accepted',
      startTime: timestampStart,
      endTime: null,
      etaStart: timestampStart,
      etaEnd: timestampEnd,
      offeredToDriverId: null,
      rejectedDriverIds: [],
      passengerRatings: {},
      driverRating: null,
      commissionCharged: 0
    };

    const updatedRequests = requests.map(r => {
      if (r.id === req.id) {
        return { ...r, status: 'accepted' as const, rideId };
      }
      return r;
    });

    const updatedDrivers = drivers.map(d => {
      if (d.id === loggedDriver.id) {
        return { ...d, activeRideId: rideId };
      }
      return d;
    });

    const updatedPassengers = passengers.map(p => {
      if (p.id === req.passengerId) {
        return { ...p, activeRideId: rideId };
      }
      return p;
    });

    const updatedRides = [...rides, newRide];

    const adminMsg: ChatMessage = {
      id: 'msg_sys_' + Date.now(),
      rideId,
      sender: 'admin',
      senderId: 'admin_panel',
      senderName: 'نظام رادار آدم الجغرافي',
      message: `تم توجيه الكابتن ${loggedDriver.fullName} بمركبته (${loggedDriver.carType}) للراكب بقبول فوري من الرادار.`,
      timestamp: timestampStart
    };

    const updatedMessages = [...messages, adminMsg];

    if (saveState) {
      saveState(updatedDrivers, updatedPassengers, updatedRequests, updatedRides, updatedMessages, settings, scheduledTrips, walletTransactions);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() || !activeRide) return;
    sendChatMessage(activeRide.id, 'driver', loggedDriver!.id, loggedDriver!.fullName, chatText);
    setChatText('');
  };

  const handleTranslateChatMessage = async (msgId: string, text: string) => {
    if (translatedChatMsgs[msgId]) return;
    setTranslatingChatMsgId(msgId);
    try {
      const target = language || 'ar';
      const res = await fetch("/api/translate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang: target })
      });
      const data = await res.json();
      if (data.success && data.translated) {
        setTranslatedChatMsgs(prev => ({ ...prev, [msgId]: data.translated }));
      }
    } catch (e) {
      console.error("AI chat translation failed:", e);
    } finally {
      setTranslatingChatMsgId(null);
    }
  };

  const handleRatePassenger = (passengerId: string, rating: number, note: string) => {
    if (!activeRide) return;
    submitRating(activeRide.id, 'driver', passengerId, rating, note);
    setRatingSubmittedList(prev => ({ ...prev, [passengerId]: true }));
  };

  // Helper dynamic cascade for Scheduled From location
  const locationsList = settings?.locations || DEFAULT_LOCATIONS;
  const schFromProvinceObj = locationsList.find(l => l.governorate === schFromGov);
  const schFromDistrictObj = schFromProvinceObj?.districts?.find(d => d.name === schFromDist);

  // Helper dynamic cascade for Scheduled To location
  const schToProvinceObj = locationsList.find(l => l.governorate === schToGov);
  const schToDistrictObj = schToProvinceObj?.districts?.find(d => d.name === schToDist);

  // Helper dynamic cascade for Captain registration Governorate/District
  const regProvinceObj = locationsList.find(l => l.governorate === regGov);
  const availableRegDistricts = regProvinceObj?.districts || [];

  const renderSmartDriverAd = () => {
    if (commercialAdsList.length === 0) return null;
    const currentAd = commercialAdsList.find(a => a.id === selectedAdId) || commercialAdsList[0];
    
    // Determine layout mode based on AI smart optimization
    const isOptimized = aiSmartAdOptimization && (isAnyFieldFocused || true);
    const effectiveMode = isOptimized ? 'compact' : adLayoutMode;

    if (effectiveMode === 'hidden') {
      return (
        <div className="bg-slate-950 border border-slate-800/60 p-2 rounded-xl flex justify-between items-center flex-row-reverse text-right font-sans mt-3">
          <div className="flex items-center gap-1.5 flex-row-reverse">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            <span className="text-[9px] text-slate-400">تم إخفاء الرعاية ذكياً لضمان سلامة الطريق</span>
          </div>
          <button 
            type="button"
            onClick={() => {
              setAdLayoutMode('standard');
              setAiSmartAdOptimization(false);
            }}
            className="text-[8.5px] text-violet-400 font-black hover:underline cursor-pointer"
          >
            إظهار 👁️
          </button>
        </div>
      );
    }

    return (
      <div className={`bg-slate-900/95 border ${isOptimized ? 'border-violet-500/30' : 'border-slate-850'} rounded-2xl p-3 flex flex-col gap-2.5 shadow-lg text-right font-sans relative overflow-hidden transition-all duration-300 mt-3`}>
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-l from-violet-600 via-indigo-600 to-amber-500"></div>

        {/* Header Controls */}
        <div className="flex justify-between items-center flex-row flex-wrap-reverse gap-2 border-b border-slate-850 pb-2">
          {/* AI Toggle & Layout switcher */}
          <div className="flex items-center gap-1 flex-row-reverse">
            <button
              type="button"
              onClick={() => setAiSmartAdOptimization(!aiSmartAdOptimization)}
              className={`flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded transition cursor-pointer border ${
                aiSmartAdOptimization
                  ? 'bg-violet-950/80 border-violet-500/40 text-violet-300'
                  : 'bg-slate-950 border-slate-800 text-slate-450 hover:border-slate-700'
              }`}
              title="تعديل موضع الإعلان تلقائياً عند القيادة أو التركيز لسلامة الكابتن"
            >
              <Sparkles className={`w-2.5 h-2.5 ${aiSmartAdOptimization ? 'text-violet-400 animate-pulse' : 'text-slate-500'}`} />
              <span>تعديل AI: {aiSmartAdOptimization ? 'نشط' : 'موقف'}</span>
            </button>

            <div className="flex bg-slate-950 border border-slate-850 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setAdLayoutMode('standard');
                  if (aiSmartAdOptimization) setAiSmartAdOptimization(false);
                }}
                className={`text-[8px] px-1.5 py-0.5 rounded transition ${adLayoutMode === 'standard' && !aiSmartAdOptimization ? 'bg-slate-850 text-white font-extrabold' : 'text-slate-400'}`}
              >
                كامل
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdLayoutMode('compact');
                  if (aiSmartAdOptimization) setAiSmartAdOptimization(false);
                }}
                className={`text-[8px] px-1.5 py-0.5 rounded transition ${adLayoutMode === 'compact' && !aiSmartAdOptimization ? 'bg-slate-850 text-white font-extrabold' : 'text-slate-400'}`}
              >
                مدمج
              </button>
              <button
                type="button"
                onClick={() => setAdLayoutMode('hidden')}
                className="text-[8px] px-1.5 py-0.5 rounded text-rose-400 hover:bg-rose-950/25 transition"
              >
                إخفاء
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-row-reverse">
            <Megaphone className="w-3 h-3 text-violet-400" />
            <h4 className="text-[9.5px] font-black text-slate-100 flex items-center gap-1 flex-row-reverse">
              <span>رعاية نشطة</span>
              {isOptimized && (
                <span className="text-[7px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1 py-0.2 rounded font-black animate-pulse">
                  AI تركيز القيادة 🚗
                </span>
              )}
            </h4>
          </div>
        </div>

        {/* AI Driving Info Alert */}
        {isOptimized && (
          <div className="bg-violet-950/20 border border-violet-500/20 p-1.5 rounded-xl text-[8px] text-violet-300 text-right flex items-center gap-1 flex-row-reverse leading-relaxed font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping shrink-0"></span>
            <p className="m-0">
              <strong>نظام ADAM لسلامة الكابتن:</strong> تم تبسيط الرعاية تلقائياً لضمان رؤية كاملة لواجهة الرحلة وحقول التنسيق والاتصال دون أي تشتيت أثناء القيادة!
            </p>
          </div>
        )}

        {/* Standard Mode */}
        {effectiveMode === 'standard' && (
          <div className="flex flex-col gap-2">
            {/* Image/Video Frame */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black h-20 shrink-0">
              {currentAd.mediaType === 'video' ? (
                <video 
                  src={currentAd.mediaUrl || currentAd.image} 
                  className="w-full h-full object-cover" 
                  controls 
                  playsInline 
                  muted 
                  autoPlay 
                  loop
                />
              ) : (
                <img 
                  referrerPolicy="no-referrer"
                  src={currentAd.image} 
                  alt={currentAd.title} 
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute top-2 right-2 bg-slate-950/85 backdrop-blur-sm border border-slate-800 text-[6.5px] font-black text-amber-400 px-1.5 py-0.5 rounded-full shadow">
                {currentAd.badge}
              </div>
            </div>

            {/* Content text */}
            <div className="space-y-0.5">
              <div className="flex justify-between items-center flex-row-reverse gap-2">
                <h5 className="text-[10px] font-black text-slate-100 truncate">{currentAd.title}</h5>
                {currentAd.companyName && (
                  <span className="text-[7px] text-amber-400 font-bold">🏢 {currentAd.companyName}</span>
                )}
              </div>
              <p className="text-[8.5px] text-slate-350 line-clamp-2 leading-relaxed">{currentAd.description}</p>
            </div>

            {/* Standard Button */}
            <button
              type="button"
              onClick={() => {
                alert(`🚀 تم تسجيل اهتمامك بعرض الراعي: [ ${currentAd.title} ] وسيتم إرسال الكوبون مباشرة!`);
              }}
              className="w-full bg-gradient-to-l from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-[8.5px] py-1.5 rounded-xl transition cursor-pointer"
            >
              {currentAd.buttonText || 'استكشاف العرض الراعي'}
            </button>
          </div>
        )}

        {/* Compact Mode */}
        {effectiveMode === 'compact' && (
          <div className="bg-slate-950 border border-slate-850 p-1.5 rounded-xl flex items-center justify-between flex-row-reverse text-right gap-1.5 transition-all">
            <div className="flex items-center gap-1.5 flex-row-reverse min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-800 bg-black shrink-0">
                <img 
                  referrerPolicy="no-referrer"
                  src={currentAd.image} 
                  alt={currentAd.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 text-right">
                <h5 className="text-[9px] font-black text-slate-100 truncate m-0 leading-tight">{currentAd.title}</h5>
                <p className="text-[8px] text-slate-400 truncate m-0 leading-normal">{currentAd.description}</p>
              </div>
            </div>
            
            <div className="flex gap-1 shrink-0 flex-row-reverse">
              <button
                type="button"
                onClick={() => {
                  alert(`🚀 تم تسجيل اهتمامك بعرض الراعي: [ ${currentAd.title} ] وسيتم إرسال الكوبون مباشرة!`);
                }}
                className="bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-[8px] px-2 py-1 rounded-lg transition cursor-pointer"
              >
                تفعيل ⚡
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdLayoutMode('standard');
                  setAiSmartAdOptimization(false);
                }}
                className="bg-slate-900 border border-slate-800 text-slate-300 text-[8px] px-1.5 py-1 rounded-lg font-bold cursor-pointer"
              >
                المزيد
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`w-full h-full ${isFullWidth ? 'max-w-full rounded-none min-h-0 flex-1 border-0 shadow-none my-0' : 'max-w-md rounded-[28px] sm:rounded-[36px] h-[720px] border-0 sm:border-4 sm:border-slate-800 shadow-2xl my-0 sm:my-2 mx-auto'} bg-slate-950 overflow-hidden relative flex flex-col font-sans select-none transition-all duration-300`}>
      {/* Top Status Bar & View Mode Controller */}
      {!initialFullWidth && (
        <div className="bg-slate-900 border-b border-slate-850 px-4 py-2 z-50 flex justify-between items-center flex-row-reverse text-xs select-none shrink-0">
          <div className="flex items-center gap-2 flex-row-reverse">
            <span className="text-[10px] font-mono text-slate-400">9:56 AM</span>
            <span className="text-[10px] text-slate-400 font-sans">📶 🔋 100%</span>
          </div>

          <div className="flex items-center gap-2 flex-row-reverse">
            <button
              type="button"
              onClick={() => setIsFullWidth(!isFullWidth)}
              className="bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold transition cursor-pointer flex items-center gap-1 shadow-sm"
              title="تغيير العرض بين شاشة كاملة ومحاكي هاتف"
            >
              {isFullWidth ? <span>📱 عرض هاتف محاكي</span> : <span>🖥️ العرض الكامل الشامل</span>}
            </button>
          </div>
        </div>
      )}

      {/* Screen Frame Content Wrapper */}
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-900 text-slate-100">
        
        {/* LOGGED OUT PANEL */}
        {!loggedDriver ? (
          <div className="flex-1 overflow-y-auto p-5 pb-8 flex flex-col justify-center">
            
            {/* Language Selector */}
            <div className="flex justify-center mb-5" id="driver-lang-switch">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-950 border border-slate-850 text-xs text-amber-400 font-extrabold font-sans rounded-xl py-2 px-3 outline-none cursor-pointer text-right shadow-inner min-w-[200px]"
              >
                <option value="ar" className="bg-slate-950 text-slate-200">🇯🇴 العربية (Arabic)</option>
                <option value="en" className="bg-slate-950 text-slate-200">🇬🇧 English</option>
                <option value="fr" className="bg-slate-950 text-slate-200">🇫🇷 Français</option>
                <option value="es" className="bg-slate-950 text-slate-200">🇪🇸 Español [AI]</option>
                <option value="tr" className="bg-slate-950 text-slate-200">🇹🇷 Türkçe [AI]</option>
                <option value="de" className="bg-slate-950 text-slate-200">🇩🇪 Deutsch [AI]</option>
                <option value="ru" className="bg-slate-950 text-slate-200">🇷🇺 Русский [AI]</option>
                <option value="zh" className="bg-slate-950 text-slate-200">🇨🇳 中文 [AI]</option>
                <option value="hi" className="bg-slate-950 text-slate-200">🇮🇳 हिन्दी [AI]</option>
                <option value="ur" className="bg-slate-950 text-slate-200">🇵🇰 اردو [AI]</option>
              </select>
            </div>

            {/* Header Identity */}
            <div className="text-center mb-6">
              {settings.systemLogo ? (
                <div className="w-16 h-16 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2 shadow-lg relative overflow-hidden transition-all duration-300">
                  <img 
                    src={settings.systemLogo} 
                    alt="App Logo" 
                    className="w-full h-full object-contain max-h-full max-w-full rounded" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-amber-600 rounded-xl mx-auto flex items-center justify-center text-white font-black text-xl shadow-lg border border-amber-400/30">
                  م
                </div>
              )}
              <h1 className="text-base font-bold text-slate-100 font-sans tracking-tight mt-2 flex justify-center items-center gap-1 flex-row-reverse">
                <span>{t('آدم تطبيق كابتن', 'ADAM Captain App')}</span>
                <span className="text-[9px] bg-amber-500/25 text-amber-400 px-1.5 py-0.5 rounded-full font-mono font-bold">CAPT</span>
              </h1>
              <p className="text-[10px] text-slate-400 mt-1 font-sans">
                {t('واجهة إدارة طلبات وخدمات الكابتن بالأردن', 'Captain order management & services portal in Jordan')}
              </p>
            </div>

            {/* Pre-Launch Registration Announcement Banner */}
            {launchGateInfo.isGated && (
              <ServiceLaunchBanner 
                role="driver"
                launchDateTime={launchGateInfo.launchDateTime}
                formattedLaunchDate={launchGateInfo.formattedLaunchDate}
                title={launchGateInfo.title}
                customMessage={launchGateInfo.customMessage}
              />
            )}

            {errMessage && (
              <div className="p-2.5 bg-red-900/30 border border-red-800 rounded-lg text-xs text-red-300 text-right mb-4 leading-relaxed font-sans flex items-start gap-1 flex-row-reverse">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{errMessage}</span>
              </div>
            )}

            {regSuccessMsg && (
              <div className="p-3 bg-emerald-900/30 border border-emerald-800 rounded-lg text-xs text-emerald-300 text-right mb-4 leading-relaxed font-sans">
                {regSuccessMsg}
              </div>
            )}

            {!showReg ? (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} className="flex flex-col gap-3 font-sans">
                {/* AI Geolocation Country Indicator (Non-editable) */}
                <div className="bg-indigo-950/25 border border-indigo-500/15 rounded-xl p-3 flex flex-col gap-1.5 text-right font-sans relative overflow-hidden shadow-inner">
                  <div className="absolute top-0 left-0 bg-indigo-500/15 px-1.5 py-0.2 rounded-br text-[7px] text-indigo-300 font-mono uppercase tracking-wider font-bold">
                    AI GPS
                  </div>
                  <div className="flex justify-between items-center flex-row-reverse text-[9px] text-indigo-400 font-black">
                    <span className="flex items-center gap-1">✨ {t('مستكشف الدولة الذكي (Geolocator)', 'AI Country Finder')}</span>
                    {geoDetecting && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>}
                  </div>
                  <p className="text-[9px] text-slate-450 leading-relaxed">
                    {geoStatusMsg}
                  </p>
                  
                  <div className="flex items-center justify-between flex-row-reverse bg-slate-950/60 p-2 rounded-lg border border-slate-900 mt-1">
                    <span className="text-[10px] text-slate-400 font-bold">الدولة المحددة آلياً:</span>
                    <div className="flex items-center gap-1.5 select-none text-xs font-bold text-indigo-350">
                      <span>
                        {detectedCountry === 'JO' ? '🇯🇴 الأردن (JOD)' : 
                         detectedCountry === 'SA' ? '🇸🇦 السعودية (SAR)' : 
                         detectedCountry === 'EG' ? '🇪🇬 مصر (EGP)' : '🇦🇪 الإمارات (AED)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5">
                  <label className="text-[9px] text-slate-400 text-right block uppercase tracking-wider font-bold">
                    {t('اسم مرور الكابتن', 'Captain Username')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={usernameInput} 
                      onChange={e => setUsernameInput(e.target.value)}
                      placeholder={t('أدخل اسم المستخدم', 'Enter username')} 
                      className="bg-transparent text-xs text-slate-100 outline-none flex-1 text-right font-sans"
                    />
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5">
                  <label className="text-[9px] text-slate-400 text-right block uppercase tracking-wider font-bold">
                    {t('كلمة المرور الأمنية', 'Secure Password')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="password" 
                      value={passwordInput} 
                      onChange={e => setPasswordInput(e.target.value)}
                      placeholder={t('أدخل كلمة المرور', 'Enter password')} 
                      className="bg-transparent text-xs text-slate-100 outline-none flex-1 text-right font-sans"
                    />
                    <span className="text-slate-500 text-xs text-right">🔑</span>
                  </div>
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(true); setForgotFeedback(''); setForgotPhone(''); }}
                    className="text-[10px] text-indigo-400 hover:underline hover:text-indigo-300 font-sans cursor-pointer"
                  >
                    {t('نسيت كلمة السر كابتن؟ استعدها آلياً عبر SMS', 'Forgot Captain Password? Recover automatically via SMS')}
                  </button>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black py-2.5 rounded-xl font-bold text-xs transition duration-150 font-sans cursor-pointer"
                >
                  {t('تسجيل الدخول الآمن كـ كابتن', 'Secure Captain Login')}
                </button>

                <div className="text-center mt-3 border-t border-slate-800/80 pt-4">
                  <button 
                    type="button" 
                    onClick={() => { setShowReg(true); setErrMessage(''); }}
                    className="text-[11px] text-indigo-400 hover:underline inline-flex items-center gap-1 font-sans cursor-pointer"
                  >
                    <span>{t('إنشاء حساب كابتن جديد في آدم', 'Create New Captain Account')}</span>
                    <Car className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTRATION FORM FOR DRIVER */
              <form onSubmit={handleRegister} className="flex flex-col gap-3 font-sans h-[380px] overflow-y-auto pr-1 text-right">
                <h3 className="text-xs font-bold text-slate-200 text-right border-b border-slate-800 pb-1 flex justify-end gap-1.5 items-center">
                  <span>طلب تسجيل كابتن جديد</span>
                  <Car className="w-4 h-4 text-amber-500" />
                </h3>

                {/* Full name */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                  <label className="text-[9px] text-slate-500">الاسم الرباعي المكتمل</label>
                  <input 
                    type="text" 
                    value={regFullName} 
                    onChange={e => setRegFullName(e.target.value)}
                    placeholder="خليل كابتن المطار الشهم" 
                    className="bg-transparent text-xs w-full text-slate-100 text-right outline-none mt-1"
                    required
                  />
                </div>

                {/* Username */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                  <label className="text-[9px] text-slate-500">اسم مرور الفريد</label>
                  <input 
                    type="text" 
                    value={regUsername} 
                    onChange={e => setRegUsername(e.target.value)}
                    placeholder="اسم المستخدم" 
                    className="bg-transparent text-xs w-full text-slate-100 text-right outline-none mt-1 font-mono"
                    required
                  />
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                    <label className="text-[9px] text-slate-500">رقم الهاتف</label>
                    <input 
                      type="tel" 
                      value={regPhone} 
                      onChange={e => setRegPhone(e.target.value)}
                      placeholder="0791234567" 
                      className="bg-transparent text-xs w-full text-slate-100 text-right outline-none mt-1 font-mono"
                      required
                    />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                    <label className="text-[9px] text-slate-500">البريد الإلكتروني</label>
                    <input 
                      type="email" 
                      value={regEmail} 
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="khalil@gmail.com" 
                      className="bg-transparent text-xs w-full text-slate-100 text-right outline-none mt-1 font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Lisence validations */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-right font-sans">
                  <label className="text-[9px] text-amber-500 font-bold block">تاريخ انتهاء رخصة القيادة</label>
                  <input 
                    type="date" 
                    value={regLicenseExpiry} 
                    onChange={e => setRegLicenseExpiry(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded p-1.5 w-full mt-1.5 outline-none cursor-pointer text-center"
                    required
                  />
                </div>

                {/* Car info details */}
                <h4 className="text-[10px] font-bold text-slate-400 select-all border-b border-slate-850 pb-1 mt-1 text-right">بيانات المركبة الخاصة بك</h4>
                
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-right font-sans">
                  <span className="text-[10px] font-bold text-amber-500 block">🤖 تكامل الذكاء الاصطناعي لاختيار نوع وطراز المركبة</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5">ماركة السيارة</label>
                      <select 
                        value={driverRegBrandSel} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setDriverRegBrandSel(val);
                          if (val !== 'custom' && val !== '') {
                            const bObj = driverVehicleData.find(b => b.name === val);
                            if (bObj && bObj.models.length > 0) {
                              setDriverRegModelSel(bObj.models[0]);
                              setRegCarType(bObj.models[0]);
                            }
                          } else {
                            setDriverRegModelSel('custom');
                            setRegCarType('');
                          }
                        }}
                        className="bg-slate-950 text-slate-200 border border-slate-800 text-[11px] w-full p-1.5 rounded-lg outline-none cursor-pointer text-right"
                      >
                        <option value="">-- اختر ماركة السيارة --</option>
                        {driverVehicleData.map(brand => (
                          <option key={brand.name} value={brand.name}>{brand.name}</option>
                        ))}
                        <option value="custom">✍️ كتابة يدوية / أخرى</option>
                      </select>
                    </div>

                    {driverRegBrandSel && driverRegBrandSel !== 'custom' && (
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-0.5">الموديل والطراز</label>
                        <select 
                          value={driverRegModelSel} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setDriverRegModelSel(val);
                            if (val !== 'custom') {
                              setRegCarType(val);
                            }
                          }}
                          className="bg-slate-950 text-slate-200 border border-slate-800 text-[11px] w-full p-1.5 rounded-lg outline-none cursor-pointer text-right"
                        >
                          {driverVehicleData.find(b => b.name === driverRegBrandSel)?.models.map(model => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                          <option value="custom">✍️ طراز مخصص آخر</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {(driverRegBrandSel === 'custom' || driverRegModelSel === 'custom') && (
                    <div className="mt-2 pt-1 border-t border-slate-850/50">
                      <label className="text-[9px] text-slate-500 block mb-0.5">اكتب اسم وطراز المركبة يدوياً</label>
                      <input 
                        type="text" 
                        value={regCarType} 
                        onChange={(e) => setRegCarType(e.target.value)} 
                        placeholder="مثال: تويوتا بريوس (Toyota Prius)"
                        className="bg-slate-950 text-slate-100 border border-slate-800 text-xs w-full p-2 rounded-lg outline-none text-right font-sans"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                    <label className="text-[9px] text-slate-500 block text-right font-sans">صنف السيارة للخدمة</label>
                    <select 
                      value={regCarClass} 
                      onChange={e => setRegCarClass(e.target.value)}
                      className="bg-transparent text-xs w-full text-slate-100 text-right outline-none mt-1 cursor-pointer font-sans"
                    >
                      {VEHICLE_CLASSES.map((cls, i) => (
                        <option className="bg-slate-950 text-slate-200" key={i} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                    <label className="text-[9px] text-slate-500">رقم اللوحة</label>
                    <input 
                      type="text" 
                      value={regCarPlate} 
                      onChange={e => setRegCarPlate(e.target.value)}
                      placeholder="34-10294" 
                      className="bg-transparent text-xs w-full text-slate-100 text-right outline-none mt-1 font-mono"
                      required
                    />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                    <label className="text-[9px] text-amber-500 font-bold">موديل السيارة (سنة)</label>
                    <input 
                      type="number" 
                      value={regCarModel} 
                      onChange={e => setRegCarModel(Number(e.target.value))}
                      placeholder="2023" 
                      className="bg-transparent text-xs w-full text-slate-100 text-right outline-none mt-1 font-mono font-bold"
                      required
                    />
                  </div>
                </div>

                {/* Car reg expiry */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-right font-sans">
                  <label className="text-[9px] text-amber-500 font-bold block">تاريخ انتهاء رخصة السيارة</label>
                  <input 
                    type="date" 
                    value={regRegExpiry} 
                    onChange={e => setRegRegExpiry(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded p-1.5 w-full mt-1.5 outline-none cursor-pointer text-center"
                    required
                  />
                </div>

                {/* Criminal certificate check */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex justify-between items-center text-right font-sans">
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="checkbox" 
                      checked={regNoCriminal} 
                      onChange={e => setRegNoCriminal(e.target.checked)}
                      className="w-4 h-4 border border-slate-700 rounded bg-slate-950 accent-amber-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-300">أقر بامتلاكي شهادة عدم محكومية سارية المفعول</span>
                </div>

                {/* Related Location Fields Grid: Governorate, District, Village */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-right">
                    <label className="text-[9px] text-slate-500 block">المحافظة للعمل</label>
                    <select 
                      value={regGov} 
                      onChange={e => {
                        const nextGov = e.target.value;
                        setRegGov(nextGov);
                        const found = settings.locations.find(loc => loc.governorate === nextGov);
                        if (found && found.districts && found.districts.length > 0) {
                          setRegDist(found.districts[0].name);
                        } else {
                          setRegDist('');
                        }
                      }}
                      className="bg-transparent text-[10px] text-slate-200 outline-none w-full text-right mt-1 cursor-pointer"
                    >
                      {settings.locations.map((loc, i) => (
                        <option className="bg-slate-950 text-slate-200" key={i} value={loc.governorate}>{loc.governorate.split(' ')[0]}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-right">
                    <label className="text-[9px] text-slate-500 block">اللواء / المنطقة الإدارية</label>
                    <select 
                      value={regDist} 
                      onChange={e => setRegDist(e.target.value)}
                      className="bg-transparent text-[10px] text-slate-200 outline-none w-full text-right mt-1 cursor-pointer"
                      required
                    >
                      <option className="bg-slate-950 text-slate-200" value="">-- اختر اللواء --</option>
                      {availableRegDistricts.map((dist, i) => (
                        <option className="bg-slate-950 text-slate-200" key={i} value={dist.name}>{dist.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-right">
                    <label className="text-[9px] text-slate-500 block">القرية / الحي السكني</label>
                    <select 
                      value={regVillage} 
                      onChange={e => setRegVillage(e.target.value)}
                      className="bg-transparent text-[10px] text-slate-200 outline-none w-full text-right mt-1 cursor-pointer"
                    >
                      <option className="bg-slate-950 text-slate-200" value="">-- اختر الحي / القرية --</option>
                      {(availableRegDistricts.find(d => d.name === regDist)?.villages || ['حي الشميساني', 'حي الحسين', 'المركز التجاري', 'المنطقة الحرفية']).map((v, i) => (
                        <option className="bg-slate-950 text-slate-200" key={i} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* AI DOCUMENT REVIEW & REAL-TIME VERIFICATION SIMULATION (مراجعة الذكاء الاصطناعي للوثائق) */}
                <div className="bg-gradient-to-br from-indigo-950/70 via-slate-950 to-slate-900 border border-indigo-500/40 rounded-2xl p-3.5 flex flex-col gap-3 text-right shadow-xl">
                  <div className="flex justify-between items-center flex-row-reverse border-b border-indigo-500/20 pb-2">
                    <div className="flex items-center gap-1.5 flex-row-reverse">
                      <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                      <span className="text-xs font-black text-indigo-200">
                        مراجعة الذكاء الاصطناعي للوثائق (AI Document Verification)
                      </span>
                    </div>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      محرك الفحص الفوري شغال
                    </span>
                  </div>

                  {/* Generated Mockup Illustration */}
                  <div className="relative rounded-xl overflow-hidden border border-indigo-500/30 shadow-md">
                    <img 
                      src={aiDocVerificationImg} 
                      alt="AI Document Verification State" 
                      className="w-full h-32 md:h-40 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex items-end p-2.5">
                      <div className="flex justify-between items-center w-full flex-row-reverse">
                        <span className="text-[10px] text-indigo-200 font-black bg-slate-950/80 px-2 py-1 rounded-lg border border-indigo-500/30 flex items-center gap-1">
                          <ScanLine className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                          نظام الماسح الضوئي الذكي والتوثيق اليدوي المباشر
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Animated Real-time Status Badges for each document */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                    {/* 1. National ID */}
                    <div className="bg-slate-950/80 border border-slate-800 p-2 rounded-xl flex justify-between items-center flex-row-reverse">
                      <span className="text-slate-300 font-bold">1. بطاقة الهوية الوطنية:</span>
                      {regIdFront && regIdBack ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 animate-bounce">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          مطابقة بالذكاء الاصطناعي 100%
                        </span>
                      ) : (
                        <span className="text-amber-400 text-[9px] font-bold animate-pulse">
                          ⏳ بانتظار رفع الواجهين...
                        </span>
                      )}
                    </div>

                    {/* 2. Driver License */}
                    <div className="bg-slate-950/80 border border-slate-800 p-2 rounded-xl flex justify-between items-center flex-row-reverse">
                      <span className="text-slate-300 font-bold">2. رخصة القيادة السارية:</span>
                      {regLicFront && regLicBack ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 animate-bounce">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          رخصة معتمدة وفحص آلي ناجح
                        </span>
                      ) : (
                        <span className="text-amber-400 text-[9px] font-bold animate-pulse">
                          ⏳ بانتظار رفع الرخصة...
                        </span>
                      )}
                    </div>

                    {/* 3. Vehicle Registration */}
                    <div className="bg-slate-950/80 border border-slate-800 p-2 rounded-xl flex justify-between items-center flex-row-reverse">
                      <span className="text-slate-300 font-bold">3. رخصة المركبة:</span>
                      {regVehFront && regVehBack ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 animate-bounce">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          مطابقة ملكية وسنة الصنع
                        </span>
                      ) : (
                        <span className="text-amber-400 text-[9px] font-bold animate-pulse">
                          ⏳ بانتظار رفع رخصة المركبة...
                        </span>
                      )}
                    </div>

                    {/* 4. Criminal Record Certificate */}
                    <div className="bg-slate-950/80 border border-slate-800 p-2 rounded-xl flex justify-between items-center flex-row-reverse">
                      <span className="text-slate-300 font-bold">4. شهادة عدم المحكومية:</span>
                      {regNoCriminal ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 animate-bounce">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          سجل أمني وتدقيق نظيف
                        </span>
                      ) : (
                        <span className="text-red-400 text-[9px] font-bold">
                          ⚠️ يتطلب الإقرار
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Document Attachments - Highly Polished & Multi-Doc */}
                <div className="border border-dashed border-slate-800 p-3 rounded-xl flex flex-col gap-3.5 bg-slate-950/45 text-right font-sans">
                  <span className="text-[10px] text-amber-500 font-bold block border-b border-slate-900 pb-1">🗂️ ملف التحقق والتراخيص والوثائق المرتفعة</span>

                  {/* Automated Document Quality Error Notice */}
                  {docUploadError && (
                    <div className="bg-red-950/80 border border-red-500/50 p-2.5 rounded-xl text-right flex flex-col gap-1.5 animate-pulse">
                      <div className="flex items-center justify-between flex-row-reverse gap-1 text-red-400 font-bold text-[10px]">
                        <span className="flex items-center gap-1 flex-row-reverse">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          تنبيه فحص جودة الوثيقة والتحليل الآلي
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setDocUploadError(null)}
                          className="text-slate-400 hover:text-white text-[10px] px-1"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-[9px] text-red-200/90 leading-snug font-sans">
                        {docUploadError}
                      </p>
                    </div>
                  )}

                  {/* ID CARD FRONT/BACK GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* ID Front */}
                    <div className="flex flex-col gap-1 w-full text-right font-sans">
                      <span className="text-[9px] text-slate-300">بطاقة الهوية الشخصية (الوجه الأمامي) <span className="text-red-500">*</span></span>
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file) {
                            processAndValidateDocument(file, (url) => setRegIdFront(url));
                          }
                        }}
                        className="border border-dashed border-slate-800 hover:border-amber-500/50 transition p-2 rounded-lg bg-slate-900/40 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer relative min-h-[70px]"
                      >
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              processAndValidateDocument(file, (url) => setRegIdFront(url));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        {regIdFront ? (
                          <div className="flex items-center gap-1.5 flex-row-reverse w-full justify-between">
                            <img src={regIdFront} className="w-8 h-8 object-cover rounded border border-slate-800" referrerPolicy="no-referrer" />
                            <span className="text-[8px] text-emerald-400 font-mono text-left truncate max-w-[90px]">ID_Front.png ✓</span>
                          </div>
                        ) : (
                          <span className="text-[8px] text-slate-400">سحب أو زر تصفح الهوية</span>
                        )}
                      </div>
                    </div>

                    {/* ID Back */}
                    <div className="flex flex-col gap-1 w-full text-right font-sans">
                      <span className="text-[9px] text-slate-300">بطاقة الهوية الشخصية (الوجه الخلفي) <span className="text-red-500">*</span></span>
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file) {
                            processAndValidateDocument(file, (url) => setRegIdBack(url));
                          }
                        }}
                        className="border border-dashed border-slate-800 hover:border-amber-500/50 transition p-2 rounded-lg bg-slate-900/40 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer relative min-h-[70px]"
                      >
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              processAndValidateDocument(file, (url) => setRegIdBack(url));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        {regIdBack ? (
                          <div className="flex items-center gap-1.5 flex-row-reverse w-full justify-between">
                            <img src={regIdBack} className="w-8 h-8 object-cover rounded border border-slate-800" referrerPolicy="no-referrer" />
                            <span className="text-[8px] text-emerald-400 font-mono text-left truncate max-w-[90px]">ID_Back.png ✓</span>
                          </div>
                        ) : (
                          <span className="text-[8px] text-slate-400">سحب أو زر تصفح الهوية</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* DRIVING LICENSE FRONT/BACK GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-900 pt-2 font-sans">
                    {/* License Front */}
                    <div className="flex flex-col gap-1 w-full text-right">
                      <span className="text-[9px] text-slate-300">رخصة القيادة الكابتن (الوجه الأمامي) <span className="text-red-500">*</span></span>
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file) {
                            processAndValidateDocument(file, (url) => setRegLicFront(url));
                          }
                        }}
                        className="border border-dashed border-slate-800 hover:border-amber-500/50 transition p-2 rounded-lg bg-slate-900/40 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer relative min-h-[70px]"
                      >
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              processAndValidateDocument(file, (url) => setRegLicFront(url));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        {regLicFront ? (
                          <div className="flex items-center gap-1.5 flex-row-reverse w-full justify-between">
                            <img src={regLicFront} className="w-8 h-8 object-cover rounded border border-slate-800" referrerPolicy="no-referrer" />
                            <span className="text-[8px] text-emerald-400 font-mono text-left truncate max-w-[90px]">Lic_Front.png ✓</span>
                          </div>
                        ) : (
                          <span className="text-[8px] text-slate-400">سحب أو زر تصفح الرخصة</span>
                        )}
                      </div>
                    </div>

                    {/* License Back */}
                    <div className="flex flex-col gap-1 w-full text-right">
                      <span className="text-[9px] text-slate-300">رخصة القيادة الكابتن (الوجه الخلفي) <span className="text-red-500">*</span></span>
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file) {
                            processAndValidateDocument(file, (url) => setRegLicBack(url));
                          }
                        }}
                        className="border border-dashed border-slate-800 hover:border-amber-500/50 transition p-2 rounded-lg bg-slate-900/40 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer relative min-h-[70px]"
                      >
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              processAndValidateDocument(file, (url) => setRegLicBack(url));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        {regLicBack ? (
                          <div className="flex items-center gap-1.5 flex-row-reverse w-full justify-between">
                            <img src={regLicBack} className="w-8 h-8 object-cover rounded border border-slate-800" referrerPolicy="no-referrer" />
                            <span className="text-[8px] text-emerald-400 font-mono text-left truncate max-w-[90px]">Lic_Back.png ✓</span>
                          </div>
                        ) : (
                          <span className="text-[8px] text-slate-400">سحب أو زر تصفح الرخصة</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CAR REGISTRATION FRONT/BACK GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-900 pt-2 font-sans">
                    {/* Car Reg Front */}
                    <div className="flex flex-col gap-1 w-full text-right">
                      <span className="text-[9px] text-slate-300">رخصة المركبة (الوجه الأمامي) <span className="text-red-500">*</span></span>
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file) {
                            processAndValidateDocument(file, (url) => setRegVehFront(url));
                          }
                        }}
                        className="border border-dashed border-slate-800 hover:border-amber-500/50 transition p-2 rounded-lg bg-slate-900/40 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer relative min-h-[70px]"
                      >
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              processAndValidateDocument(file, (url) => setRegVehFront(url));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        {regVehFront ? (
                          <div className="flex items-center gap-1.5 flex-row-reverse w-full justify-between">
                            <img src={regVehFront} className="w-8 h-8 object-cover rounded border border-slate-800" referrerPolicy="no-referrer" />
                            <span className="text-[8px] text-emerald-400 font-mono text-left truncate max-w-[90px]">Veh_Front.png ✓</span>
                          </div>
                        ) : (
                          <span className="text-[8px] text-slate-400">سحب أو زر تصفح رخصة المركبة</span>
                        )}
                      </div>
                    </div>

                    {/* Car Reg Back */}
                    <div className="flex flex-col gap-1 w-full text-right">
                      <span className="text-[9px] text-slate-300">رخصة المركبة (الوجه الخلفي) <span className="text-red-500">*</span></span>
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file) {
                            processAndValidateDocument(file, (url) => setRegVehBack(url));
                          }
                        }}
                        className="border border-dashed border-slate-800 hover:border-amber-500/50 transition p-2 rounded-lg bg-slate-900/40 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer relative min-h-[70px]"
                      >
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              processAndValidateDocument(file, (url) => setRegVehBack(url));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        {regVehBack ? (
                          <div className="flex items-center gap-1.5 flex-row-reverse w-full justify-between">
                            <img src={regVehBack} className="w-8 h-8 object-cover rounded border border-slate-800" referrerPolicy="no-referrer" />
                            <span className="text-[8px] text-emerald-400 font-mono text-left truncate max-w-[90px]">Veh_Back.png ✓</span>
                          </div>
                        ) : (
                          <span className="text-[8px] text-slate-400">سحب أو زر تصفح رخصة المركبة</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PERSONAL PROFILE PHOTO */}
                  <div className="flex flex-col gap-1.5 text-right w-full border-t border-slate-900 pt-2 text-right font-sans">
                    <span className="text-[9px] text-slate-300">الصورة البروفايل الشخصية للكابتن <span className="text-red-500">*</span></span>
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) {
                          processAndValidateDocument(file, (url) => setRegPhoto(url));
                        }
                      }}
                      className="border border-dashed border-slate-800 hover:border-amber-500/50 transition p-2.5 rounded-lg bg-slate-900/40 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer relative min-h-[70px]"
                    >
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            processAndValidateDocument(file, (url) => setRegPhoto(url));
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {regPhoto ? (
                        <div className="flex items-center gap-1.5 flex-row-reverse w-full justify-between">
                          <img src={regPhoto} className="w-8 h-8 object-cover rounded border border-slate-800" referrerPolicy="no-referrer" />
                          <span className="text-[8px] text-emerald-400 font-mono text-left truncate max-w-[130px]">Captain_Profile.png ✓</span>
                        </div>
                      ) : (
                        <span className="text-[8px] text-slate-400">سحب صورتك الشخصية للوجه هنا أو اضغط للتصفح</span>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-amber-500 hover:bg-amber-600 font-sans text-black py-2.5 rounded-lg font-bold text-xs"
                >
                  إرسال الطلب وإرفاق الوثائق للإدارة
                </button>

                <button 
                  type="button" 
                  onClick={() => setShowReg(false)}
                  className="text-[10px] text-slate-400 text-center block mt-1 hover:underline cursor-pointer"
                >
                  العودة لتسجيل دخول الكباتن
                </button>
              </form>
            )}
          </div>
        ) : (
          /* LOGGED IN PANEL */
          <div className="flex-1 overflow-hidden flex flex-col">
            
            {/* Top Compact Status Header bar */}
            <div className="px-4 py-2 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => logout('driver')}
                  className="p-1 px-1.5 rounded bg-red-950/40 text-red-400 hover:bg-red-950/80 transition text-[10px] flex items-center gap-1 font-sans shrink-0 cursor-pointer"
                >
                  <span>خروج</span>
                  <LogOut className="w-2.5 h-2.5" />
                </button>
                {/* 🔔 Notification Bell Button */}
                <motion.button 
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-800 text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                  title="تنبيهات وتذكيرات الكبتن"
                  id="driver_notif_bell_btn"
                  animate={isBellShaking ? {
                    x: [0, -6, 6, -6, 6, -3, 3, 0],
                    rotate: [0, -10, 10, -10, 10, -5, 5, 0],
                  } : { x: 0, rotate: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span id="driver_notif_bell_badge" className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-slate-950 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </motion.button>
                {settings.systemLogo && (
                  <div className="w-6 h-6 rounded bg-slate-900 border border-slate-850 flex items-center justify-center p-0.5 overflow-hidden shadow">
                    <img 
                      src={settings.systemLogo} 
                      alt="System Logo" 
                      className="w-full h-full object-contain" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                )}
              </div>

              {/* Quick Online & Offline Toggle in top bar */}
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-full py-1 px-3 shadow-inner">
                <span className={`text-[9px] font-bold font-sans ${loggedDriver.isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {loggedDriver.isOnline ? 'متصل 🟢' : 'مغلق 🔴'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleOnline}
                  className={`w-8 h-4.5 rounded-full transition-colors relative duration-205 outline-none inline-flex items-center cursor-pointer ${
                    loggedDriver.isOnline ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                  title="تغيير حالة الاتصال واستقبال المشاوير"
                >
                  <span
                    className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-all duration-205 ${
                      loggedDriver.isOnline ? 'left-4' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Driver identity status and balance */}
              <div className="text-right flex items-center gap-1.5">
                {/* Mode Switcher Dropdown & Button next to profile */}
                <div className="flex items-center gap-1">
                  <select
                    value={activeTab === 'scheduled' ? 'scheduled' : travelMode}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'scheduled') {
                        setTravelMode('all');
                        setActiveTab('scheduled');
                      } else if (val === 'intracity') {
                        setTravelMode('intracity');
                        setActiveTab('status');
                      } else if (val === 'intercity') {
                        setTravelMode('intercity');
                        setActiveTab('status');
                      } else {
                        setTravelMode('all');
                        setActiveTab('status');
                      }
                    }}
                    title="قائمة منسدلة لاختيار وضع وخدمات الكابتن فوراً"
                    className="bg-slate-900 border border-slate-750 text-slate-200 text-[10.5px] font-bold rounded-lg px-2 py-1 focus:ring-1 focus:ring-amber-400 focus:border-amber-400 cursor-pointer shadow-sm"
                  >
                    <option value="all">✨ جميع الخدمات</option>
                    <option value="intracity">🏢 داخل المدينة</option>
                    <option value="intercity">🛣️ بين المحافظات</option>
                    <option value="scheduled">⏰ رحلات مجدولة</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      const modeCycle: ('all' | 'intercity' | 'intracity')[] = ['all', 'intercity', 'intracity'];
                      const currentIndex = modeCycle.indexOf(travelMode as any);
                      const nextMode = modeCycle[(currentIndex + 1) % modeCycle.length];
                      setTravelMode(nextMode);
                      if (nextMode === 'intracity' && activeTab === 'scheduled') {
                        setActiveTab('status');
                      }
                    }}
                    title="تبديل وضع الكابتن (جميع الخدمات / بين المدن / داخل المدينة)"
                    className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm ${
                      travelMode === 'all'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-slate-800'
                        : travelMode === 'intracity' 
                          ? 'bg-indigo-650/30 border-indigo-500/40 text-indigo-400 hover:bg-slate-800' 
                          : 'bg-amber-650/20 border-amber-500/40 text-amber-500 hover:bg-slate-800'
                    }`}
                  >
                    {travelMode === 'all' ? (
                      <span>✨</span>
                    ) : travelMode === 'intracity' ? (
                      <span>🏢</span>
                    ) : (
                      <span>🛣️</span>
                    )}
                  </button>
                </div>

                <div className="text-right font-sans">
                  <h4 className="text-[10px] font-bold text-slate-200 tracking-tight">{loggedDriver.fullName.split(' ')[0]}</h4>
                  <div className="flex items-center gap-1 text-[8px] justify-end">
                    <span className="text-emerald-400 font-mono tracking-wider font-bold">{(loggedDriver.balance ?? 0).toFixed(2)} د.أ</span>
                    <span className="text-slate-500">مجموع المحفظة</span>
                  </div>
                </div>
                <img 
                  src={loggedDriver.documents.photo} 
                  alt="driver" 
                  className="w-7 h-7 rounded-full border border-amber-400 object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* 🛰️ Live Real-Time GPS Satellite Telemetry Bar */}
            <div className="px-4 py-2 bg-gradient-to-r from-[#0b1329] to-[#080e1e] border-b border-slate-850 flex items-center justify-between flex-wrap gap-2 text-xs select-none">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 px-2.5 py-1 rounded-lg">
                  <div className="relative flex items-center justify-center">
                    <Satellite className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span className="absolute w-2 h-2 rounded-full bg-cyan-400/40 animate-ping"></span>
                  </div>
                  <span className="font-sans font-bold text-[10px]">
                    {driverGpsTelemetry ? 'GPS حقيقي متصل ✓' : 'جاري قفل إشارة الـ GPS...'}
                  </span>
                </div>

                {driverGpsTelemetry && (
                  <div className="flex items-center gap-2 font-mono text-[10px] text-slate-300">
                    <span className="bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded text-cyan-200">
                      {driverGpsTelemetry.lat.toFixed(4)}°N, {driverGpsTelemetry.lng.toFixed(4)}°E
                    </span>
                    <span className="bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded text-emerald-400">
                      دقة: ±{driverGpsTelemetry.accuracy}م
                    </span>
                    {driverGpsTelemetry.speed > 0 && (
                      <span className="bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded text-sky-400 font-bold">
                        {driverGpsTelemetry.speed} كم/س
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleManualGpsRecalibrate}
                disabled={isGpsRefreshing}
                className="px-2.5 py-1 rounded-lg text-[10px] font-sans font-bold flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition cursor-pointer disabled:opacity-50"
                title="إعادة معايرة إحداثيات GPS الفعلية للجهاز فورا"
              >
                <RefreshCw className={`w-3 h-3 text-cyan-400 ${isGpsRefreshing ? 'animate-spin' : ''}`} />
                <span>{isGpsRefreshing ? 'جاري الفحص...' : 'معايرة GPS الآن'}</span>
              </button>
            </div>

            {/* FLOATING SHAKING NOTIFICATION TOAST */}
            {latestToast && (
              <motion.div
                id="driver_live_toast_alert"
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={toastShake ? {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  x: [0, -10, 10, -10, 10, -5, 5, 0],
                } : { opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mx-4 mt-2 bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border-2 border-amber-500/50 rounded-2xl p-3.5 shadow-xl flex items-start gap-3 relative z-30 select-none animate-pulse"
                dir="rtl"
              >
                <div className="bg-amber-500/20 p-2 rounded-xl text-amber-400 shrink-0 self-center">
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
                <div className="flex-1 text-right">
                  <h4 className="text-[11px] font-bold text-amber-300 font-sans flex items-center gap-1">
                    <span>⚠️ تنبيه جديد هام:</span>
                    <span>{latestToast.title}</span>
                  </h4>
                  <p className="text-[9.5px] text-slate-200 font-medium leading-relaxed mt-1 font-sans">
                    {latestToast.body}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifications(true);
                        setLatestToast(null);
                        const el = document.getElementById('driver_notifications_panel');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-[9px] bg-amber-500 text-slate-950 font-extrabold px-3 py-1 rounded-lg hover:bg-amber-450 transition cursor-pointer"
                    >
                      👁️ عرض التفاصيل كاملة
                    </button>
                    <button
                      type="button"
                      onClick={() => setLatestToast(null)}
                      className="text-[9px] bg-slate-900 text-slate-400 border border-slate-800 px-3 py-1 rounded-lg hover:text-slate-300 transition cursor-pointer"
                    >
                      إخفاء
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLatestToast(null)}
                  className="absolute top-2 left-2 text-slate-500 hover:text-slate-350 cursor-pointer text-xs"
                >
                  ✕
                </button>
              </motion.div>
            )}

            {/* NOTIFICATIONS PANEL/OVERLAY FOR CAPTAINS */}
            {showNotifications && loggedDriver && (
              <div 
                id="driver_notifications_panel" 
                className="mx-4 mt-2 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 max-h-[350px] overflow-y-auto animate-fadeIn select-none z-10"
                dir="rtl"
              >
                <div className="flex justify-between items-center border-b border-indigo-950/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-slate-100 flex items-center gap-1.5 font-sans">
                      🔔 إشعارات الكابتن والتنبيهات المواتية 
                      {unreadCount > 0 && (
                        <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-mono px-1.5 py-0.2 rounded-full animate-pulse">
                          {unreadCount} جديد
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {driverNotifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          driverNotifications.forEach(n => markNotificationAsRead(n.id));
                        }}
                        className="text-[9px] font-bold text-slate-400 hover:text-indigo-400 transition bg-slate-900 border border-slate-850 px-2 py-1 rounded-lg cursor-pointer"
                      >
                        ✓ تحديد الكل مقروء
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-250 bg-slate-900 border border-slate-850 w-7 h-7 rounded-lg flex items-center justify-center font-sans cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {driverNotifications.length === 0 ? (
                  <div className="text-center py-10 text-[10px] italic text-slate-500 font-sans leading-relaxed">
                    📭 لا توجد تنبيهات جديدة للكابتن حالياً.<br />
                    <span className="text-[8.5px] text-slate-600 mt-1 block">يرسل لك تطبيق آدم تنبيهات هامة عندما يقترب موعد انطلاق رحلاتك المسندة إليك بـ 30 دقيقة! 🚕</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-slate-500 font-mono font-medium">العدد: {driverNotifications.length}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("هل ترغب في مسح أرشيف التنبيهات المذكورة؟")) {
                            clearAllNotifications(loggedDriver.id);
                          }
                        }}
                        className="text-[8.5px] text-red-400 hover:text-red-350 transition hover:underline cursor-pointer"
                      >
                        🗑️ تفريغ كافة التنبيهات
                      </button>
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {driverNotifications.map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => markNotificationAsRead(n.id)}
                          className={`p-2.5 rounded-xl border transition-all text-right cursor-pointer flex flex-col gap-1 relative ${
                            n.isRead 
                              ? 'bg-slate-950/40 border-slate-900' 
                              : 'bg-indigo-950/20 border-indigo-900/40 hover:bg-indigo-950/30'
                          }`}
                        >
                          {!n.isRead && (
                            <span className="absolute top-2.5 left-2.5 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                          )}
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-100 flex items-center gap-1">
                              <span>{n.title}</span>
                            </span>
                            <span className="text-[8px] text-slate-500 font-mono">
                              {new Date(n.createdAt).toLocaleTimeString('ar-JO', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[9.5px] text-slate-350 leading-normal font-sans">
                            {n.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sub Screens Area with AI Responsive Grid Layout */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 flex flex-col gap-4 text-right transition-all" id="driver-scroll-content">
              
              {/* INSTANT POST-TRIP RATING PROMPT BANNER FOR DRIVERS PER USER REQUEST */}
              {(() => {
                const unratedRide = intraCityRides.find(r => r.driverId === loggedDriver.id && r.status === 'completed' && !r.passengerRatingVal);
                if (unratedRide) {
                  return (
                    <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-emerald-950/60 border-2 border-amber-500 p-4 rounded-2xl flex flex-col gap-3 shadow-xl shadow-amber-950/30 text-right animate-pulse">
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <span className="text-2xl">⭐</span>
                        <div>
                          <h4 className="text-xs font-black text-amber-300">تنبيه تقييم الراكب والرحلة المنتهية فوراً!</h4>
                          <p className="text-[10px] text-slate-200 mt-0.5 leading-relaxed">
                            لقد أوصلت الراكب بنجاح وانتهت الرحلة! يرجى تقييم الراكب وإرسال ملاحظتك الصوتية المباشرة (Voice-to-Text) لضبط السلوك وتحسين جودة الخدمة.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('status');
                          setRatingTripId(unratedRide.id);
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2 rounded-xl text-xs w-full cursor-pointer transition shadow text-center"
                      >
                        ✍️ تقييم الراكب وإرسال الملاحظة الصوتية الآن 🎙️
                      </button>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Pre-Launch Registration Announcement Banner */}
              {launchGateInfo.isGated && (
                <div className="px-1">
                  <ServiceLaunchBanner 
                    role="driver"
                    launchDateTime={launchGateInfo.launchDateTime}
                    formattedLaunchDate={launchGateInfo.formattedLaunchDate}
                    title={launchGateInfo.title}
                    customMessage={launchGateInfo.customMessage}
                  />
                </div>
              )}

              {/* AI-POWERED DYNAMIC COMMERCIAL ADS BANNER FOR CAPTAINS */}
              <div className="px-1">
                <AiAdBanner 
                  userType="driver" 
                  travelMode={travelMode === 'intracity' ? 'intracity' : 'intercity'} 
                  governorate={loggedDriver?.governorate || 'عمان'}
                  locationName={loggedDriver?.governorate || 'عمان'}
                  currentActivity={loggedDriver?.activeRideId ? 'كابتن في رحلة نشطة مع ركاب' : 'كابتن متصل ينتظر تلقي طلبات المشاوير'}
                />
              </div>

              {/* Render dynamic AI-Studio generated widgets for Captains */}
              {aiPlugins?.filter(p => p.status === 'active' && (p.target === 'driver' || p.target === 'all')).map(p => (
                <div 
                  key={p.id} 
                  className="transition duration-200"
                >
                  <div dangerouslySetInnerHTML={{ __html: p.htmlCode }} />
                </div>
              ))}

              {/* DRIVING MODE DASHBOARD (ACTIVE VOICE CONTROLS) */}
              {activeTab === 'status' && isDriveMode && (
                <div className="flex flex-col gap-4 font-sans text-right animate-fade-in relative z-20">
                  {/* Glowing Driver Mode Active Top Header */}
                  <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border-2 border-indigo-500 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
                    {/* Glowing pulse aura */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-x-12 -translate-y-12"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl translate-x-12 translate-y-12"></div>
                    
                    <div className="flex justify-between items-center flex-row-reverse relative z-10 gap-3">
                      <div className="flex items-center gap-3 flex-row-reverse">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-550 shadow-inner animate-pulse">
                          <Compass className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-row-reverse">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute"></span>
                            <h3 className="text-sm font-black text-white leading-none">وضع القيادة الآمن في الأردن نشط 🧭</h3>
                          </div>
                          <p className="text-[10px] text-indigo-300 mt-1 font-sans">تطبيق آدم يصغي لأوامرك الصوتية تلقائياً لمنع تشتيت نظرك عن الطريق.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDriveMode(false);
                          speakOutLoud('تم إيقاف وضع القيادة والعودة للشاشة كابتن.');
                        }}
                        className="bg-red-650 hover:bg-red-750 text-white font-extrabold py-2 px-3 rounded-xl text-[10px] cursor-pointer transition shadow border border-red-500 shrink-0"
                      >
                        إيقاف وضع القيادة 📴
                      </button>
                    </div>

                    {/* Animated Sound Waves Display */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 my-4 flex flex-col items-center justify-center relative">
                      <div className="flex items-center justify-center gap-1.5 mb-2 h-12">
                        <span className="w-1.5 h-6 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                        <span className="w-1.5 h-10 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-1.5 h-14 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                        <span className="w-1.5 h-8 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        <span className="w-1.5 h-12 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></span>
                      </div>
                      <span className="text-[9px] text-indigo-400 font-bold animate-pulse">نظام آدم جيميناي الصوتي يصغي لتردداتك الآن...</span>
                      
                      {/* Active Voice Transcript Display */}
                      <div className="w-full bg-slate-900 border border-slate-850 rounded-xl p-3 mt-3 text-center">
                        <span className="text-[8.5px] text-slate-400 block mb-1">النداء الصوتي الأخير الملتقط:</span>
                        <p className="text-xs text-indigo-200 font-black font-mono">
                          {voiceTranscript ? `"${voiceTranscript}"` : 'تكلم كابتن، مثل: "قبول الطلب" أو "إنهاء المشوار"...'}
                        </p>
                      </div>

                      {/* feedback assistant */}
                      {voiceFeedback && (
                        <div className="mt-3 bg-indigo-950/55 p-3 rounded-xl border border-indigo-500/25 w-full text-right">
                          <span className="text-[8px] text-indigo-300 font-bold block mb-1">📢 نتيجة المعالجة والرد الصوتي:</span>
                          <p className="text-[10px] text-slate-100 font-bold leading-relaxed">{voiceFeedback}</p>
                          <button
                            type="button"
                            onClick={() => speakOutLoud(voiceFeedback)}
                            className="text-[8.5px] text-amber-400 hover:underline mt-1.5 font-extrabold flex items-center gap-1 justify-end ml-auto cursor-pointer"
                          >
                            <span>إعادة قراءة التوجيه الصوتي 🔊</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Predefined Voice Triggers List (Fixed Commands Reference) */}
                    <div className="bg-slate-950/50 border border-slate-850/50 rounded-2xl p-3 text-right">
                      <span className="text-[9.5px] text-amber-400 font-bold block mb-2">📋 الأوامر الصوتية الثابتة والبدائل كابتن (قلها بصوت مسموع):</span>
                      <div className="grid grid-cols-2 gap-2 text-[8.5px]">
                        <div className="bg-slate-900/40 border border-slate-850 p-2 rounded-lg">
                          <span className="text-indigo-400 font-bold text-[9px] block">🟢 قبول الطلب:</span>
                          <p className="text-slate-400 mt-1">"قبول"، "اقبل الطلب"، "موافق"</p>
                        </div>
                        <div className="bg-slate-900/40 border border-slate-850 p-2 rounded-lg">
                          <span className="text-emerald-400 font-bold text-[9px] block">🚀 بدء المشوار:</span>
                          <p className="text-slate-400 mt-1">"ابدأ الرحلة"، "تحرك"، "انطلق"</p>
                        </div>
                        <div className="bg-slate-900/40 border border-slate-850 p-2 rounded-lg">
                          <span className="text-red-400 font-bold text-[9px] block">🛑 إنهاء المشوار:</span>
                          <p className="text-slate-400 mt-1">"إنهاء"، "وصلنا"، "إنهاء المشوار"</p>
                        </div>
                        <div className="bg-slate-900/40 border border-slate-850 p-2 rounded-lg">
                          <span className="text-amber-400 font-bold text-[9px] block">💰 بوابة الرصيد:</span>
                          <p className="text-slate-400 mt-1">"افتح المحفظة"، "شحن الرصيد"</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* HIGH-CONTRAST DYNAMIC ACTIONS (Based on current trip state) */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] text-slate-400 font-bold px-1 block">📌 لوحة التحكم اللاسلكية والتنبيهات المباشرة:</span>
                    
                    {/* CASE 1: THERE IS AN OFFERED RIDE */}
                    {(() => {
                      const currentOfferedRide = rides.find(r => r.offeredToDriverId === loggedDriver?.id && r.status === 'offered');
                      if (currentOfferedRide) {
                        return (
                          <div className="bg-gradient-to-r from-amber-950/20 via-slate-900 to-amber-950/15 border-2 border-amber-500 rounded-3xl p-5 shadow text-right relative animate-pulse-slow">
                            <span className="absolute top-3 left-4 bg-amber-500 text-[8px] font-black text-slate-950 py-0.5 px-3 rounded-full uppercase shadow">
                              🚨 عرض رحلة نشط الآن
                            </span>
                            <h4 className="text-sm font-black text-white mb-2 pt-2">من {currentOfferedRide.fromArea.split('-').pop()} إلى {currentOfferedRide.toArea.split('-').pop()}</h4>
                            <p className="text-[10.5px] text-slate-300 leading-normal mb-3 font-sans">
                              المسافة: {currentOfferedRide.distanceKm} كم | الزمن المقدر: {currentOfferedRide.durationMin} دقيقة
                              <br />
                              الأرباح الإجمالية المقدرة: <strong className="text-amber-400">{(parseFloat(currentOfferedRide.price || '0')).toFixed(2)} د.أ</strong>
                            </p>
                            
                            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-center mb-3">
                              <span className="text-[10px] text-amber-300 font-bold">🗣️ قل: "قبلت الطلب" أو "موافق" لتأكيد التوصيل الصوتي الآمن</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                acceptRide(currentOfferedRide.id, loggedDriver!.id);
                                speakOutLoud('تم قبول المشوار بنظام اللمس الفوري البديل.');
                              }}
                              className="w-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black py-3 rounded-2xl text-[12px] shadow cursor-pointer transition-all duration-200 ease-in-out uppercase"
                            >
                              🤝 نقر بديل للقبول الفوري (يدوياً)
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* CASE 2: ACTIVE RIDE IN PROGRESS (INTERCITY OR INTRACITY) */}
                    {(() => {
                      const activeIntercity = rides.find(r => r.driverId === loggedDriver?.id && r.status !== 'completed');
                      const activeIntraObj = intraCityRides.find(r => r.driverId === loggedDriver?.id && r.status !== 'completed' && r.status !== 'cancelled');

                      if (activeIntercity) {
                        return (
                          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border-2 border-indigo-500 rounded-3xl p-5 shadow text-right font-sans">
                            <div className="flex justify-between items-center flex-row-reverse mb-3 border-b border-slate-800 pb-2.5">
                              <span className="text-xs font-black text-white">🚖 مشوار تجميعي نشط جاري العمل عليه</span>
                              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 py-0.5 px-2.5 rounded-md font-bold">
                                {activeIntercity.status === 'accepted' ? 'قبول المشوار - التحرك للركاب' : 'قيد التوصيل الفعلي حالياً'}
                              </span>
                            </div>
                            
                            <p className="text-[11px] text-slate-300 mb-4 leading-relaxed font-sans">
                              🚗 <strong>المسار:</strong> من <span className="text-white">{activeIntercity.fromArea.split('-').pop()}</span> إلى <span className="text-white">{activeIntercity.toArea.split('-').pop()}</span>
                              <br />
                              👥 <strong>عدد المقاعد:</strong> {activeIntercity.requests.reduce((sum, r) => sum + r.seatsCount, 0)} ركاب مؤمنين في المشوار
                            </p>

                            {activeIntercity.status === 'accepted' ? (
                              <div className="flex flex-col gap-2.5">
                                <div className="bg-slate-950 border border-indigo-500/40 p-3 rounded-2xl flex flex-col gap-2">
                                  <div className="flex justify-between items-center flex-row-reverse text-indigo-300 font-bold text-xs">
                                    <span>🔒 رمز أمان بدء الرحلة (4 أرقام)</span>
                                    <span className="text-[9px] text-slate-400">احصل عليه من الراكب</span>
                                  </div>
                                  <p className="text-[10px] text-slate-300 text-right">
                                    يرجى أخذ الرقم المكون من 4 خانات من هاتف الراكب قبل الانطلاق:
                                  </p>
                                  <input
                                    type="text"
                                    maxLength={4}
                                    value={otpInputValue}
                                    onChange={(e) => setOtpInputValue(e.target.value.replace(/\D/g, ''))}
                                    placeholder="أدخل 4 أرقام (مثال: 5821)"
                                    className="bg-slate-900 border border-indigo-500/50 rounded-xl px-3 py-2 text-center text-indigo-200 font-mono text-lg tracking-widest outline-none focus:border-indigo-400 dir-ltr"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    // Smooth start with OTP validation
                                    if (currentDriver) {
                                      const pickupCoords = getLocationCoords(activeIntercity.fromArea);
                                      currentDriver.currentLocation = pickupCoords;
                                    }
                                    if (!otpInputValue || otpInputValue.length < 4) {
                                      alert('⚠️ يرجى أدخال رمز الأمان المكون من 4 أرقام المزود من الراكب لبدء الرحلة!');
                                      return;
                                    }
                                    const res = startRide(activeIntercity.id, otpInputValue);
                                    if (res && !res.success) {
                                      alert(res.msg);
                                      speakOutLoud(res.msg);
                                    } else {
                                      setOtpInputValue('');
                                      speakOutLoud('تم التحقق من رمز الأمان وتأكيد انطلاق الرحلة بنجاح!');
                                    }
                                  }}
                                  className="w-full bg-indigo-650 hover:bg-indigo-550 active:scale-95 text-white font-extrabold py-3.5 rounded-2xl text-[12px] cursor-pointer shadow transition-all duration-200 ease-in-out"
                                >
                                  🚀 التحقق من الرمز وانطلاق المشوار
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <div className="bg-slate-950 border border-emerald-900/60 p-2 text-center rounded-xl">
                                  <span className="text-[10px] text-emerald-400 font-bold font-sans">🗣️ قل: "إنهاء المشوار" أو "وصلنا" لتسوية المشوار وبدء تفصيل الأرباح</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    endRide(activeIntercity.id);
                                    speakOutLoud('تم إنهاء المشوار وإتمام التوصيل بنجاح.');
                                  }}
                                  className="w-full bg-emerald-600 hover:bg-emerald-555 text-white font-extrabold py-3.5 rounded-2xl text-[12px] cursor-pointer shadow transition animate-pulse"
                                >
                                  🏁 إنهاء المشوار وتأكيد وصول الركاب والأرباح
                                </button>
                              </div>
                            )}

                            {/* Driver Active Trip Sponsorship Ads */}
                            {renderSmartDriverAd()}
                          </div>
                        );
                      }

                      if (activeIntraObj) {
                        return (
                          <div className="bg-gradient-to-r from-slate-900 to-emerald-950 border-2 border-emerald-500 rounded-3xl p-5 shadow text-right font-sans">
                            <div className="flex justify-between items-center flex-row-reverse mb-3 border-b border-slate-800 pb-2.5">
                              <span className="text-xs font-black text-white">⚡ مشوار توصيل داخلي فوري نشط</span>
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 py-0.5 px-2.5 rounded-md font-bold">
                                {activeIntraObj.status === 'accepted' ? 'تم القبول - توجه لموقع الراكب' : 'قيد التوصيل الفوري حالياً'}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-300 mb-4 leading-relaxed font-sans">
                              🚗 <strong>المسار:</strong> من <span className="text-white">{activeIntraObj.fromArea.split('-').pop()}</span> إلى <span className="text-white">{activeIntraObj.toArea.split('-').pop()}</span>
                              <br />
                              👥 <strong>الراكب:</strong> {activeIntraObj.passengerName || 'عضو مستخدم'}
                            </p>

                            {activeIntraObj.status === 'accepted' ? (
                              <div className="flex flex-col gap-2.5">
                                <div className="bg-slate-950 border border-emerald-500/40 p-3 rounded-2xl flex flex-col gap-2">
                                  <div className="flex justify-between items-center flex-row-reverse text-emerald-400 font-bold text-xs">
                                    <span>🔒 رمز أمان بدء المشوار (4 أرقام)</span>
                                    <span className="text-[9px] text-slate-400">من هاتف الراكب</span>
                                  </div>
                                  <p className="text-[10px] text-slate-300 text-right">
                                    احصل على الرمز المكون من 4 أرقام الظاهر في شاشة الراكب لبدء العداد:
                                  </p>
                                  <input
                                    type="text"
                                    maxLength={4}
                                    value={otpInputValue}
                                    onChange={(e) => setOtpInputValue(e.target.value.replace(/\D/g, ''))}
                                    placeholder="أدخل 4 أرقام (مثال: 5821)"
                                    className="bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-center text-emerald-300 font-mono text-lg tracking-widest outline-none focus:border-emerald-400 dir-ltr"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!otpInputValue || otpInputValue.length < 4) {
                                      alert('⚠️ يرجى إدخال رمز الأمان المكون من 4 أرقام المزود من الراكب لبدء الرحلة!');
                                      return;
                                    }
                                    const res = startIntraCityRide(activeIntraObj.id, otpInputValue);
                                    if (res && !res.success) {
                                      alert(res.msg);
                                      speakOutLoud(res.msg);
                                    } else {
                                      setOtpInputValue('');
                                      speakOutLoud('تم التحقق من رمز الأمان وبدء مشوار التوصيل بنجاح!');
                                    }
                                  }}
                                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3.5 rounded-2xl text-[12px] cursor-pointer shadow transition"
                                >
                                  🚀 التحقق من الرمز وبدء المشوار الفوري
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <div className="bg-slate-950 border border-emerald-955 p-2 text-center rounded-xl">
                                  <span className="text-[10px] text-emerald-400 font-bold font-sans">🗣️ قل: "إنهاء المشوار" أو "وصلنا" لإنهاء الرحلة بالصوت</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    endIntraCityRide(activeIntraObj.id);
                                    speakOutLoud('تم إنهاء مشوار التوصيل الفوري بنجاح.');
                                  }}
                                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-2xl text-[12px] cursor-pointer shadow transition animate-pulse"
                                >
                                  🏁 إنهاء المشوار الفوري وتسوية الدفع والأرباح
                                </button>
                              </div>
                            )}

                            {/* Driver Active Trip Sponsorship Ads */}
                            {renderSmartDriverAd()}
                          </div>
                        );
                      }

                      // NO SERVICE CURRENTLY IN PROGRESS
                      return (
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center flex flex-col items-center justify-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mb-1">
                            🚗
                          </div>
                          <span className="text-[11px] font-bold text-slate-200">لا توجد رحلات نشطة قيد التوصيل أو معروضة حالياً</span>
                          <span className="text-[9.5px] text-slate-500 font-sans">سيعرض لك نظام آدم هنا تفاصيل أي طلب جديد فور تلقيه بالهواء ومقترحات التفاعل معه صوتياً.</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* INTRA-CITY WORKSPACE */}
              {(travelMode === 'all' || travelMode === 'intracity') && activeTab === 'status' && !isDriveMode && (
                <div className="flex flex-col gap-2">
                  {travelMode === 'all' && (
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">خدمة الكابتن الفورية ⚡</span>
                      <h3 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                        <span>1. ورشة طلبات داخل المدينة (فوري ومباشر)</span>
                        <span>🏢</span>
                      </h3>
                    </div>
                  )}
                  <IntraCityDriverPanel
                    loggedDriver={loggedDriver}
                    settings={settings}
                    t={t}
                    language={language}
                    setLanguage={setLanguage}
                    intraCityRides={intraCityRides}
                    acceptIntraCityRide={acceptIntraCityRide}
                    declineIntraCityRide={declineIntraCityRide}
                    startIntraCityRide={startIntraCityRide}
                    endIntraCityRide={endIntraCityRide}
                    cancelIntraCityRide={cancelIntraCityRide}
                    setDriverOnline={setDriverOnline}
                    updateDriverLocation={updateDriverLocation}
                  />
                </div>
              )}

              {/* STATUS & ONLINE ENGINE */}
              {(travelMode === 'all' || travelMode === 'intercity') && activeTab === 'status' && !isDriveMode && (
                <div className="flex flex-col gap-3 font-sans">
                  
                  {/* ADAM AI VOICE VOICE COMMAND CONTROL CENTER */}
                  <div className="bg-gradient-to-r from-slate-900 to-indigo-950/60 border border-indigo-500/30 rounded-2xl p-3.5 flex flex-col gap-3 shadow-lg text-right font-sans">
                    <div className="flex justify-between items-center flex-row-reverse">
                      <div className="flex items-center gap-1.5 flex-row-reverse">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 animate-pulse">
                          <Mic className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-black text-slate-100 flex items-center gap-1 flex-row-reverse">
                            <span>مساعد الكابتن الصوتي الذكي (آدم)</span>
                            <span className="text-[7.5px] bg-indigo-550 text-indigo-200 px-1.5 py-0.2 rounded-full font-bold">نشط 🟢</span>
                          </h4>
                          <p className="text-[8.5px] text-indigo-300">تحكم بورشة العمليات، فعل وضع الاتصال، أو انتقل لبوابة أرباحك بالصوت!</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsVoiceOpen(!isVoiceOpen)}
                        className="text-[9.5px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-2.5 rounded-lg transition-colors cursor-pointer text-xs"
                      >
                        {isVoiceOpen ? 'إغلاق ✕' : 'تفعيل الميكروفون 🎙️'}
                      </button>
                    </div>

                    {isVoiceOpen && (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex flex-col gap-3 transition-all duration-300">
                        {/* Status Indicator */}
                        <div className="flex items-center justify-between flex-row-reverse">
                          <span className="text-[9.5px] text-slate-400 font-bold">الحالة:</span>
                          <div className="flex items-center gap-1.5 flex-row-reverse">
                            <span className={`w-2 h-2 rounded-full ${voiceStatus === 'listening' ? 'bg-red-500 animate-ping' : voiceStatus === 'processing' ? 'bg-amber-400 animate-pulse' : voiceStatus === 'done' ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                            <span className="text-[9.5px] text-slate-300 font-black">
                              {voiceStatus === 'idle' ? 'جاهز للاستماع' : 
                               voiceStatus === 'listening' ? 'جاري الاستماع للنداء... 🔴' : 
                               voiceStatus === 'processing' ? 'جاري التحليل والمعالجة...' :
                               voiceStatus === 'done' ? 'تم التنفيذ بنجاح! 🎉' : 'خطأ في التردد الصوتي'}
                            </span>
                          </div>
                        </div>

                        {/* Speech Record Button or Visual Soundwaves */}
                        <div className="flex flex-col items-center justify-center p-3 border-y border-slate-900/60 leading-relaxed">
                          <button
                            type="button"
                            onClick={handleStartVoiceRecording}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${voiceStatus === 'listening' ? 'bg-red-650 text-white animate-pulse shadow shadow-red-500' : 'bg-indigo-900/70 hover:bg-indigo-800 text-indigo-300'} border border-indigo-500/30 cursor-pointer`}
                          >
                            <Mic className="w-6 h-6" />
                          </button>
                          <span className="text-[8px] text-indigo-400 mt-2">انقر للتبديل وتحدث بالصوت (يتطلب سماح المتصفح للميكروفون)</span>
                        </div>

                        {/* Output Text Transcript */}
                        <div className="text-right">
                          <span className="text-[8.5px] text-slate-400 block pr-1">الأمر الصوتي الملتقط :</span>
                          <div className="w-full bg-slate-900 rounded-lg p-2 text-[10px] text-slate-100 font-bold border border-slate-850 font-mono text-right min-h-[30px] flex items-center justify-end">
                            {voiceTranscript || 'اضغط الميكروفون وتكلم، أو اختر من القوالب أدناه...'}
                          </div>
                        </div>

                        {/* NLP Response Feedback with Arabic Speech Voice option */}
                        {voiceFeedback && (
                          <div className="bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-500/20 text-right">
                            <span className="text-[8px] text-indigo-300 font-bold flex items-center gap-1 justify-end flex-row-reverse mb-1">
                              <Sparkles className="w-3 h-3 text-yellow-400" />
                              <span>رد المساعد الرقمي لآدم:</span>
                            </span>
                            <p className="text-[10px] text-slate-200 leading-relaxed font-sans">{voiceFeedback}</p>
                            <button
                              type="button"
                              onClick={() => {
                                if ('speechSynthesis' in window) {
                                  window.speechSynthesis.cancel();
                                  const u = new SpeechSynthesisUtterance(voiceFeedback);
                                  u.lang = 'ar-JO';
                                  window.speechSynthesis.speak(u);
                                }
                              }}
                              className="mt-1.5 flex items-center gap-1 text-[8.5px] text-amber-400 font-bold hover:underline justify-end cursor-pointer ml-auto bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/25"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>استماع للتوجيه الصوتي 🔊</span>
                            </button>
                          </div>
                        )}

                        {/* Predefined Jordanian Commute Phrases */}
                        <div className="text-right">
                          <span className="text-[8.5px] text-amber-500/90 font-bold block mb-1.5">💡 أمثلة الأوامر الصوتية السريعة للكباتن:</span>
                          <div className="flex flex-col gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleProcessVoiceCommand('تفعيل حالة النشاط وجاهز لاستقبال الركاب اونلاين')}
                              className="bg-slate-900 hover:bg-slate-850 text-right p-2 rounded-lg text-[9px] text-slate-300 font-sans border border-slate-800 transition truncate cursor-pointer flex justify-between items-center flex-row-reverse"
                            >
                              <span>🟢 "تفعيل حالة النشاط وجاهز لاستقبال الركاب"</span>
                              <span className="text-[8px] text-emerald-400 font-bold">تشغيل ⚡</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleProcessVoiceCommand('يرجى الانتقال لبوابة أرباح المحفظة')}
                              className="bg-slate-900 hover:bg-slate-850 text-right p-2 rounded-lg text-[9px] text-slate-300 font-sans border border-slate-800 transition truncate cursor-pointer flex justify-between items-center flex-row-reverse"
                            >
                              <span>💰 "الذهاب إلى محفظتي المالية والأرباح"</span>
                              <span className="text-[8px] text-emerald-400 font-bold">تشغيل ⚡</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleProcessVoiceCommand('تغيير كلمة المرور الشخصية')}
                              className="bg-slate-900 hover:bg-slate-850 text-right p-2 rounded-lg text-[9px] text-slate-300 font-sans border border-slate-800 transition truncate cursor-pointer flex justify-between items-center flex-row-reverse"
                            >
                              <span>🔒 "افتح صفحة تغيير كلمة السر للتحقق"</span>
                              <span className="text-[8px] text-emerald-400 font-bold">تشغيل ⚡</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* License and model warning alert block */}
                  {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    const licExpired = loggedDriver.licenseExpiry < today;
                    const carExpired = loggedDriver.carRegistrationExpiry < today;
                    if (licExpired || carExpired) {
                      return (
                        <div className="p-3 bg-red-950/70 border border-red-800 text-[10px] text-red-200 rounded-xl leading-relaxed text-right font-sans flex items-start gap-1 flex-row-reverse">
                          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                          <div>
                            <strong>تنبيه الإدارة: تم حجب حسابك لانتهاء التراخيص!</strong>
                            <div className="text-red-300 font-sans mt-0.5">رخصة القيادة: {loggedDriver.licenseExpiry} | المركبة: {loggedDriver.carRegistrationExpiry}</div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* General online button */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col items-center gap-4 relative shadow-lg overflow-hidden">
                    <div className="absolute top-1 right-1">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${loggedDriver.isOnline ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/30' : 'bg-red-950 text-red-400 border border-red-900/30'}`}>
                        {loggedDriver.isOnline ? 'متاح لاستقبال الطلبات' : 'خارج خط الخدمة'}
                      </span>
                    </div>

                    <button 
                      onClick={handleToggleOnline}
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 border-4 cursor-pointer outline-none ${
                        loggedDriver.isOnline 
                          ? 'bg-emerald-500 text-black border-emerald-400/50 shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 animate-pulse' 
                          : 'bg-red-950 text-red-500 border-red-900/50 hover:bg-red-900 hover:text-red-200 hover:scale-105 active:scale-95'
                      }`}
                      title={loggedDriver.isOnline ? "اضغط للتحول إلى وضع غير متصل" : "اضغط للتحول إلى وضع متصل"}
                    >
                      <Power className="w-6 h-6" />
                    </button>
                    
                    <div className="text-center font-sans w-full">
                      <h4 className="text-xs font-black text-slate-100 flex items-center justify-center gap-1">
                        <span>{loggedDriver.isOnline ? 'أنت متصل بالإنترنت الآن 🟢' : 'أنت غير متصل بالخدمات 🔴'}</span>
                      </h4>
                      
                      {/* Detailed proximity & status rules block */}
                      <div className="mt-3 bg-slate-950 border border-slate-850 p-3 rounded-xl text-right text-[10px] leading-relaxed text-slate-300 flex flex-col gap-2">
                        <div className="flex gap-1.5 items-start flex-row-reverse text-slate-400 border-b border-slate-900 pb-1.5 font-bold">
                          <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>خوارزمية التوزيع وتتبع التواجد الجغرافي:</span>
                        </div>
                        {loggedDriver.isOnline ? (
                          <>
                            <p className="text-amber-400 flex items-center gap-1 flex-row-reverse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                              <strong>📡 تم تفعيل الـ Live Location بنجاح:</strong> موقعك المباشر GPS قيد التتبع للتوجيه الفوري.
                            </p>
                            <p className="text-slate-100">
                              ✔ موقعك الفوري نشط ويقوم بتحويل ومطابقة الطلبات والرحلات المجدولة المكتملة القريبة منك تلقائياً.
                            </p>
                            <p className="text-emerald-400">
                              ✔ مؤهل فورياً لاستقبال طلبات الدمج التجميعي بناءً على <strong>قربك الجغرافي للركاب</strong> في {loggedDriver.governorate}.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-red-400">
                              ✖ لن تتلقى أي عروض لرحلات أو قوافل مجمعة نهائياً مادمت في وضع "غير متصل".
                            </p>
                            <p className="text-slate-400">
                              💡 عندما تصبح جاهزاً، تحول إلى وضع "متصل" لتكون من الكباتن المرشحين الأقرب للركاب.
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {errMessage && (
                      <div className="p-2 bg-red-950/50 border border-red-900 text-[9px] text-red-400 text-right rounded-lg select-all leading-normal">
                        {errMessage}
                      </div>
                    )}
                  </div>

                  {/* Driving Mode Activation Card */}
                  <div className="bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 shadow-lg text-right font-sans">
                    <div className="flex justify-between items-center flex-row-reverse mb-2">
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <Compass className="w-5 h-5 text-indigo-400" />
                        <span className="text-xs font-black text-slate-100">ميزة وضع القيادة الآمن بالصوت 🧭</span>
                      </div>
                      <span className="text-[7.5px] bg-indigo-500/10 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/10">جيميناي نشط</span>
                    </div>
                    <p className="text-[9.5px] text-slate-400 leading-relaxed mb-3">
                      تسمح لك هذه الميزة الحصرية بالتركيز الكامل على قيادة مركبتك؛ حيث يمكنك قبول طلبات الركاب الواردة، تسيير الرحلة، أو إنهاء وتأكيد المشوار بمجرد التحدث بالصوت دون لمس الهاتف!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDriveMode(true);
                        speakOutLoud('تم تفعيل وضع القيادة الآمن بنجاح كابتن! نظام آدم يستمع إليك تلقائياً الآن.');
                      }}
                      className="w-full bg-indigo-650 hover:bg-slate-950 border border-indigo-550 hover:border-indigo-500 text-white font-extrabold py-2.5 rounded-xl text-[10.5px] cursor-pointer shadow transition text-center"
                    >
                      🧭 تفعيل وضع القيادة واستقبال الأوامر الصوتية
                    </button>
                  </div>

                  {/* DAILY RIDE CHALLENGES & PERFORMANCE BONUSES SUMMARY CARD */}
                  <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/50 border border-amber-500/35 rounded-2xl p-4 shadow-lg text-right font-sans flex flex-col gap-2.5">
                    <div className="flex justify-between items-center flex-row-reverse">
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white flex items-center gap-1 flex-row-reverse">
                            <span>تحديات اليوم ومكافآت الأداء المالي 🏆</span>
                          </h4>
                          <p className="text-[9.5px] text-slate-300">حقّق التارجت اليومي واحصل على بونص مالي مباشر برصيدك</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('wallet');
                          setActiveWalletSubTab('rewards');
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded-xl text-[10px] transition cursor-pointer shadow flex items-center gap-1 shrink-0"
                      >
                        <span>عرض التحديات ➔</span>
                      </button>
                    </div>

                    {/* Progress preview */}
                    {(() => {
                      const completedCount = rides.filter(r => r.driverId === loggedDriver.id && r.status === 'completed').length;
                      const dailyTarget = 5;
                      const progressPct = Math.min(100, Math.floor((completedCount / dailyTarget) * 100));

                      return (
                        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                          <div className="flex justify-between text-[9.5px] text-slate-300 font-bold flex-row-reverse">
                            <span>تحدي الـ 5 مشاوير اليومية (+3.50 د.أ بونص كاش):</span>
                            <span className="font-mono text-emerald-400">{completedCount} / {dailyTarget} مشاوير ({progressPct}%)</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                            <div 
                              className="h-full bg-gradient-to-l from-amber-400 to-emerald-400 rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* OFFERED ASSIGNMENT POPUP / REQUEST */}
                  {offeredRide && (
                    <div className="bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] border-2 border-amber-500/40 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl relative overflow-hidden animate-bounce">
                      <div className="absolute top-0 right-0 bg-amber-500 text-black text-[8px] font-bold py-0.5 px-2 rounded-bl">
                        تجميع طلبات آدم جاهز لك!
                      </div>

                      <h4 className="text-xs font-black text-amber-300 text-right mt-1.5 flex justify-end gap-1.5 items-center">
                        <span>طلب مدمج متاح للقبول</span>
                        <Car className="w-4 h-4 animate-bounce" />
                      </h4>

                      <div className="flex flex-col gap-1 text-[11px] text-slate-200 text-right font-sans">
                        <div>🏁 <strong>المسار التجميعي:</strong> من {offeredRide.fromArea.split('-').pop()} إلى {offeredRide.toArea.split('-').pop()}</div>
                        
                        <div className="flex items-center justify-between flex-row-reverse bg-slate-900/50 px-2.5 py-1.5 rounded-xl border border-slate-800/60 text-[10px] mt-1 shadow-inner">
                          <span className="text-slate-400 font-medium">📏 المسافة الإجمالية المقدرة للرحلة:</span>
                          <span className="text-amber-400 font-black font-mono">
                            {(() => {
                              const c1 = getLocationCoords(offeredRide.fromArea);
                              const c2 = getLocationCoords(offeredRide.toArea);
                              const dx = c1.x - c2.x;
                              const dy = c1.y - c2.y;
                              const dist = Math.sqrt(dx * dx + dy * dy) * 0.15;
                              return (dist > 0 ? Math.max(2.5, dist) : 7.2).toFixed(1);
                            })()} كم
                          </span>
                        </div>
                        {offeredRide.requests.some(r => r.isAirportRide) && (
                          <div className="bg-indigo-950/80 border border-indigo-500/40 p-2 rounded-xl text-right mb-1.5 flex items-center justify-between flex-row-reverse">
                            <span className="text-xs font-black text-indigo-300 flex items-center gap-1 flex-row-reverse">
                              <span>✈️ طلب مشوار مطار مميز (Airport Ride)</span>
                            </span>
                            <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold border border-indigo-500/30">
                              سيارات {settings.airportMinCarModel ?? settings.minCarModel ?? 2021}+
                            </span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 mt-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                          <div className="text-right">
                            <span className="text-slate-400 text-[9px] block">💵 إجمالي تحصيل الرحلة:</span>
                            <span className="text-emerald-400 font-extrabold text-[11px] font-mono">
                              {offeredRide.requests.reduce((sum, r) => sum + (r.isAirportRide ? (r.airportFare ?? settings.airportRidePrice ?? 25.0) : (r.seatsCount * settings.passengerFarePerSeat)), 0)} د.أ
                            </span>
                          </div>
                          <div className="text-right border-r border-slate-800 pr-2">
                            <span className="text-slate-400 text-[9px] block">✂️ عمولة التطبيق المخصومة:</span>
                            <span className="text-rose-400 font-extrabold text-[11px] font-mono">
                              {offeredRide.requests.reduce((sum, r) => sum + (r.isAirportRide ? (settings.airportCommissionRate ?? 3.0) : (r.seatsCount * settings.commissionRate)), 0)} د.أ
                            </span>
                          </div>
                        </div>
                        <div className="text-slate-300 text-[9.5px]/none mt-1 mb-1 font-bold">
                          سعر المشوار/المقعد: {settings.passengerFarePerSeat} د.أ | عمولة التطبيق: {settings.commissionRate} د.أ
                        </div>
                        <div className="text-slate-400 text-[9px] mt-1 mb-1 border-t border-b border-slate-850 py-1 flex flex-col gap-1">
                          {offeredRide.requests.map((r, i) => (
                            <div key={i} className="flex justify-between items-center flex-row-reverse text-[9.5px]/none">
                              <span>
                                {r.isAirportRide ? '✈️' : '👤'} {r.passengerName} ({r.seatsCount} مقاعد) {r.isAirportRide && <strong className="text-indigo-400 font-bold">(طلب مطار)</strong>} - الدفع: {r.isAirportRide ? `${r.airportFare ?? settings.airportRidePrice ?? 25.0} د.أ` : `${r.seatsCount * settings.passengerFarePerSeat} د.أ`}
                              </span>
                              {r.requestedTime && (
                                <span className="text-amber-400 font-bold font-mono">⏰ {r.requestedTime.replace('T', ' ')}</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="text-[8.5px] text-slate-500">* موزعين متقاربين بالمنطقة الجغرافية جاري دمجهم</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <motion.button
                          onClick={() => acceptRide(offeredRide.id, loggedDriver.id)}
                          animate={isNewOfferAlert ? {
                            scale: [1, 1.05, 1],
                          } : {}}
                          transition={isNewOfferAlert ? {
                            duration: 1.0,
                            repeat: Infinity,
                            ease: "easeInOut"
                          } : {}}
                          className={`${
                            isNewOfferAlert 
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] font-black' 
                              : 'bg-emerald-500 hover:bg-emerald-600 text-black'
                          } py-2 rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-1 cursor-pointer`}
                        >
                          <Check className={`w-3.5 h-3.5 ${isNewOfferAlert ? 'animate-bounce' : ''}`} />
                          <span>قبول الرحلة كابتن</span>
                          {isNewOfferAlert && (
                            <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-sans font-black mr-1 animate-pulse">
                              جديد 🔔
                            </span>
                          )}
                        </motion.button>
                        <button
                          onClick={() => rejectRide(offeredRide.id, loggedDriver.id)}
                          className="bg-red-950 hover:bg-red-900 text-red-200 py-2 rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>رفض وطلب آخر</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* DUAL-MODE WORKSPACE: PUBLIC POOLING FEED & GPS COORDINATE RADAR */}
                  {loggedDriver.isOnline && !activeRide && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3.5 shadow-md">
                      
                      {/* Sub tab switcher */}
                      <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-850 gap-1.5 flex-row-reverse">
                        <button
                          type="button"
                          onClick={() => setRadarSubTab('pooling')}
                          className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-bold font-sans transition-all cursor-pointer ${
                            radarSubTab === 'pooling'
                              ? 'bg-amber-500 text-black shadow font-black'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          📦 الرحلات المجمعة ({rides.filter(r => r.status === 'pooling').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setRadarSubTab('radar')}
                          className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-bold font-sans transition-all cursor-pointer ${
                            radarSubTab === 'radar'
                              ? 'bg-amber-500 text-black shadow font-black'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          📡 رادار الطلبات القريبة ({requests.filter(r => r.status === 'pending').length})
                        </button>
                      </div>

                      {/* AI ADVISORY & SMART CAPTAIN ASSISTANT */}
                      <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/40 border border-indigo-500/20 p-4 rounded-2xl flex flex-col gap-2.5 text-right font-sans">
                        <div className="flex justify-between items-center flex-row-reverse">
                          <div className="flex items-center gap-1.5 flex-row-reverse">
                            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                            <h4 className="text-[11px] font-black text-slate-100">مساعد الكابتن الذكي للفرز والتوصيات (آدم AI) 🧠</h4>
                          </div>
                          <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-1.5 py-0.5 rounded-full font-bold">بسيط وفوري</span>
                        </div>
                        <p className="text-[9.5px] text-slate-300 leading-normal">
                          بدلاً من البحث في الرحلات الطويلة، اكتب رغبتك بالعامية (مثال: "بدي مشاوير طالعة من عمان" أو "فرز حسب السعر الأعلى") ليقوم المساعد بفرز الطبلونات وتقديم أفضل التوصيات لك فوراً!
                        </p>
                        <div className="flex gap-2 flex-row-reverse">
                          <input
                            type="text"
                            value={driverAiFilterText}
                            onChange={(e) => setDriverAiFilterText(e.target.value)}
                            placeholder="مثال: ورجيني رحلات إربد القريبة..."
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-650 focus:border-indigo-500/50 outline-none text-right font-sans"
                          />
                          <button
                            type="button"
                            disabled={isAnalyzingDriverFilter}
                            onClick={async () => {
                              if (!driverAiFilterText.trim()) {
                                alert("يرجى كتابة سيناريو الفرز أولاً.");
                                return;
                              }
                              try {
                                setIsAnalyzingDriverFilter(true);
                                setDriverAiFilterFeedback('');
                                setAiFilteredRideIds(null);

                                // Simple, fast local natural language matching for robust performance, augmented with clear explanation feedback
                                const lower = driverAiFilterText.toLowerCase();
                                const activePoolingRides = rides.filter(r => r.status === 'pooling' || r.status === 'offered');
                                
                                let matched = [...activePoolingRides];
                                if (lower.includes("عمان")) {
                                  matched = matched.filter(r => r.fromArea.includes("عمان") || r.toArea.includes("عمان"));
                                }
                                if (lower.includes("إربد") || lower.includes("اربد")) {
                                  matched = matched.filter(r => r.fromArea.includes("إربد") || r.toArea.includes("إربد"));
                                }
                                if (lower.includes("الزرقاء") || lower.includes("الزرقا")) {
                                  matched = matched.filter(r => r.fromArea.includes("الزرقاء") || r.toArea.includes("الزرقاء"));
                                }
                                if (lower.includes("الأعلى") || lower.includes("أعلى") || lower.includes("سعر") || lower.includes("ربح")) {
                                  matched.sort((a, b) => b.requests.reduce((sum, r) => sum + r.seatsCount, 0) - a.requests.reduce((sum, r) => sum + r.seatsCount, 0));
                                }

                                const ids = matched.map(r => r.id);
                                setAiFilteredRideIds(ids);
                                setDriverAiFilterFeedback(`✨ فرز ذكي: تم تصفية وعرض عدد (${matched.length}) رحلات مجمعة مطابقة لـ "${driverAiFilterText}". يمكنك إلغاء الفرز في أي وقت لرؤية جميع الطلبات.`);
                              } catch (e) {
                                console.error(e);
                              } finally {
                                setIsAnalyzingDriverFilter(false);
                              }
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition whitespace-nowrap cursor-pointer shrink-0 font-sans shadow"
                          >
                            {isAnalyzingDriverFilter ? "جاري الفرز..." : "فلترة ذكية ⚡"}
                          </button>
                        </div>
                        {driverAiFilterFeedback && (
                          <div className="bg-indigo-950/30 p-2 rounded-xl border border-indigo-500/10 text-[9.5px] text-indigo-300 flex justify-between items-center flex-row-reverse mt-1">
                            <span>{driverAiFilterFeedback}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setDriverAiFilterText('');
                                setDriverAiFilterFeedback('');
                                setAiFilteredRideIds(null);
                              }}
                              className="text-amber-400 font-extrabold hover:underline text-[9px] cursor-pointer"
                            >
                              إلغاء الفرز ✕
                            </button>
                          </div>
                        )}
                      </div>

                      {/* MODE 1: ORIGINAL PUBLIC POOLING RIDES (Available to ALL online drivers) */}
                      {radarSubTab === 'pooling' && (
                        <div className="flex flex-col gap-3">
                          <h4 className="text-xs font-bold text-amber-400 text-right border-b border-slate-850 pb-1.5 flex justify-end gap-1.5 items-center">
                            <span>قائمة طلبات الدمج المتاحة للإقلاع 📡</span>
                            <Car className="w-4 h-4" />
                          </h4>

                          {(() => {
                            const poolingRides = rides.filter(r => r.status === 'pooling').filter(r => aiFilteredRideIds === null || aiFilteredRideIds.includes(r.id));
                            if (poolingRides.length === 0) {
                              return (
                                <p className="text-[10px] text-slate-500 text-center italic py-2 font-sans">
                                  لا توجد طلبات دمج ركاب معلقة حالياً. سيظهر أي طلب يرسله الراكب هنا فوراً لتقبله كابتن.
                                </p>
                              );
                            }

                            return (
                              <div className="flex flex-col gap-2.5">
                                {poolingRides.map(ride => {
                                  const totalSeats = ride.requests.reduce((sum, r) => sum + r.seatsCount, 0);
                                  return (
                                    <div 
                                      key={ride.id} 
                                      className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60 flex flex-col gap-2 font-sans text-right"
                                    >
                                      <div className="flex justify-between items-center flex-row-reverse text-[10px] text-slate-400 border-b border-slate-900 pb-1">
                                        <div className="flex gap-1.5 flex-row-reverse items-center">
                                          <span className="font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px]">
                                            طلب دمج متاح ({totalSeats} مقاعد)
                                          </span>
                                          <span className={`font-black px-1.5 py-0.5 rounded text-[9px] border flex items-center gap-1 ${
                                            (4 - totalSeats) > 0 
                                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                                              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                          }`}>
                                            🪑 {t('المقاعد المتبقية: ', 'Remaining Seats: ')}{4 - totalSeats}
                                          </span>
                                        </div>
                                        <span className="font-mono text-[8px] opacity-60">
                                          #{ride.id.split('_').pop()}
                                        </span>
                                      </div>

                                      <div className="text-[11px] text-slate-200 flex flex-col gap-1">
                                        <div>📍 <strong>من:</strong> {ride.fromArea.split(' - ').slice(-1)[0]}</div>
                                        <div>🏁 <strong>إلى:</strong> {ride.toArea.split(' - ').slice(-1)[0]}</div>
                                        {ride.fromArea.includes(' - ') && (
                                          <div className="text-[9px] text-slate-500">
                                            المحافظة والمنطقة: {ride.fromArea.split(' - ')[0]} / {ride.fromArea.split(' - ')[1]}
                                          </div>
                                        )}
                                        <div className="mt-1.5 border-t border-slate-900 pt-1.5 flex flex-col gap-1">
                                          {ride.requests.map((req, rIdx) => (
                                            <div key={rIdx} className="text-[10px] text-slate-400 flex justify-between items-center flex-row-reverse">
                                              <span>👤 {req.passengerName} ({req.seatsCount} مقاعد) - قيمة المقاعد: {req.seatsCount * settings.passengerFarePerSeat} د.أ</span>
                                              {req.requestedTime && (
                                                <span className="text-amber-450 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded text-[8.5px] font-mono">
                                                  ⏰ {req.requestedTime.replace('T', ' ')}
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                        <div className="mt-1 flex justify-between items-center bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/80 flex-row-reverse text-[10px]">
                                          <span className="text-slate-400 font-sans">قيمة الرحلة المجمعة الكلية:</span>
                                          <span className="text-emerald-400 font-black font-sans">{totalSeats * settings.passengerFarePerSeat} د.أ</span>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => acceptRide(ride.id, loggedDriver.id)}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-black py-1.5 rounded-lg text-xs font-bold font-sans transition flex items-center justify-center gap-1 cursor-pointer mt-1"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>قبول طلب التجميع فوراً 🚕</span>
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* MODE 2: HIGH-FIDELITY GPS COORDINATE RADAR AND FILTERING PANEL */}
                      {radarSubTab === 'radar' && (
                        <div className="flex flex-col gap-3 font-sans text-right">
                          <div className="flex justify-between items-center flex-row-reverse border-b border-slate-850 pb-2">
                            <div className="flex items-center gap-2 flex-row-reverse">
                              <h4 className="text-xs font-black text-amber-400 flex justify-end gap-1.5 items-center">
                                <span>رادار تصفح طلبات الركاب الفردية بـ GPS 📡</span>
                                <Compass className="w-4 h-4 animate-spin text-amber-500" style={{ animationDuration: '6s' }} />
                              </h4>
                              {/* Polling/Sync visual badge */}
                              <button
                                type="button"
                                onClick={() => setIsPollingActive(!isPollingActive)}
                                className={`px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-1 transition-all border cursor-pointer ${
                                  isPollingActive
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                }`}
                                title={isPollingActive ? "انقر لتعطيل التحديث التلقائي" : "انقر لتفعيل التحديث التلقائي"}
                              >
                                {isPollingActive ? (
                                  <>
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                    <span>تحديث تلقائي: نشط (٣ث) 🟢</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
                                    <span>تحديث تلقائي: متوقف 🔴</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* 1. GPS Location Calibration Tool */}
                          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-right">
                            <span className="text-[10px] text-amber-500 font-bold block mb-1">📍 معايرة واختيار موقع الكابتن بالخريطة:</span>
                            <div className="text-[11px] text-slate-300 font-sans leading-relaxed">
                              <span>📍 موقعك المسجل: </span>
                              <strong className="text-white">{loggedDriver?.currentLocation?.name || "غير محدد"}</strong>
                              <span className="text-slate-500 block text-[9.5px] mt-0.5">
                                إحداثيات رادار: <span className="font-mono text-indigo-400">X: {loggedDriver?.currentLocation?.x || 0}, Y: {loggedDriver?.currentLocation?.y || 0}</span>
                              </span>
                            </div>

                            {/* Jump controls */}
                            <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <label className="text-[9px] text-slate-400 block mb-0.5">انتقل إلى محافظة:</label>
                                <select
                                  value={simulatorGov}
                                  onChange={(e) => {
                                    setSimulatorGov(e.target.value);
                                    setSimulatorDist('');
                                  }}
                                  className="w-full bg-slate-900 text-slate-100 p-1.5 rounded border border-slate-800 text-[10px] focus:outline-none"
                                >
                                  <option value="">-- اختر --</option>
                                  {(settings?.locations || DEFAULT_LOCATIONS).map((loc, i) => (
                                    <option key={i} value={loc.governorate}>{loc.governorate}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-[9px] text-slate-400 block mb-0.5">المنطقة الجغرافية:</label>
                                <select
                                  value={simulatorDist}
                                  onChange={(e) => {
                                    const districtName = e.target.value;
                                    setSimulatorDist(districtName);
                                    if (districtName) {
                                      const coords = getLocationCoords(districtName);
                                      if (updateDriverLocation) {
                                        updateDriverLocation(loggedDriver.id, {
                                          x: coords.x,
                                          y: coords.y,
                                          name: `${simulatorGov} - ${districtName}`
                                        });
                                      }
                                    }
                                  }}
                                  className="w-full bg-slate-900 text-slate-100 p-1.5 rounded border border-slate-800 text-[10px] focus:outline-none"
                                >
                                  <option value="">-- اختر تدرج --</option>
                                  {simulatorGov && ((settings?.locations || DEFAULT_LOCATIONS).find(l => l.governorate === simulatorGov)?.districts || []).map((d, i) => (
                                    <option key={i} value={d.name}>{d.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Manual Coordinate Tuner */}
                            <div className="mt-2 border-t border-slate-900 pt-2 flex items-center justify-between flex-row-reverse text-[9.5px]">
                              <span className="text-slate-400">ضبط يدوي دقيق للإحداثيات:</span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const curr = loggedDriver?.currentLocation || { x: 200, y: 200, name: 'موقع تقديري' };
                                    if (updateDriverLocation) {
                                      updateDriverLocation(loggedDriver.id, { ...curr, x: Math.max(0, curr.x - 10) });
                                    }
                                  }}
                                  className="bg-slate-900 text-slate-300 w-6 h-5 rounded hover:bg-slate-850 font-bold"
                                >
                                  X-
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const curr = loggedDriver?.currentLocation || { x: 200, y: 200, name: 'موقع تقديري' };
                                    if (updateDriverLocation) {
                                      updateDriverLocation(loggedDriver.id, { ...curr, x: Math.min(400, curr.x + 10) });
                                    }
                                  }}
                                  className="bg-slate-900 text-slate-300 w-6 h-5 rounded hover:bg-slate-850 font-bold"
                                >
                                  X+
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const curr = loggedDriver?.currentLocation || { x: 200, y: 200, name: 'موقع تقديري' };
                                    if (updateDriverLocation) {
                                      updateDriverLocation(loggedDriver.id, { ...curr, y: Math.max(0, curr.y - 10) });
                                    }
                                  }}
                                  className="bg-slate-900 text-slate-300 w-6 h-5 rounded hover:bg-slate-850 font-bold"
                                >
                                  Y-
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const curr = loggedDriver?.currentLocation || { x: 200, y: 200, name: 'موقع تقديري' };
                                    if (updateDriverLocation) {
                                      updateDriverLocation(loggedDriver.id, { ...curr, y: Math.min(400, curr.y + 10) });
                                    }
                                  }}
                                  className="bg-slate-900 text-slate-300 w-6 h-5 rounded hover:bg-slate-850 font-bold"
                                >
                                  Y+
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 2. Filters & Sorting Control Center */}
                          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-850/60 flex flex-col gap-2">
                            <div className="flex justify-between items-center flex-row-reverse text-[10px]">
                              <span className="text-slate-400 font-bold">🎛️ تصفية وترتيب الرادار الفوري:</span>
                              <span className="text-amber-500 font-mono font-bold">بموجب {radarDistance} كم</span>
                            </div>

                            {/* Distance Slider */}
                            <div className="flex flex-col gap-1">
                              <input
                                type="range"
                                min="5"
                                max="150"
                                value={radarDistance}
                                onChange={(e) => setRadarDistance(parseInt(e.target.value))}
                                className="w-full accent-amber-500 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                              />
                              <div className="flex justify-between text-[8px] text-slate-500 px-0.5">
                                <span>150 كم</span>
                                <span>75 كم</span>
                                <span>5 كم</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] mt-1">
                              {/* Governorate Filter */}
                              <div>
                                <span className="text-slate-400 block mb-0.5">المحافظة:</span>
                                <select
                                  value={radarGovFilter}
                                  onChange={(e) => setRadarGovFilter(e.target.value)}
                                  className="w-full bg-slate-900 text-slate-100 p-1 rounded border border-slate-800 focus:outline-none"
                                >
                                  <option value="">الكل</option>
                                  {(settings?.locations || DEFAULT_LOCATIONS).map((loc, i) => (
                                    <option key={i} value={loc.governorate.split(' ')[0]}>{loc.governorate.split(' ')[0]}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Sorting option */}
                              <div>
                                <span className="text-slate-400 block mb-0.5">فرز النتائج:</span>
                                <select
                                  value={radarSortKey}
                                  onChange={(e) => setRadarSortKey(e.target.value as 'distance' | 'seats')}
                                  className="w-full bg-slate-900 text-slate-100 p-1 rounded border border-slate-800 focus:outline-none"
                                >
                                  <option value="distance">الأقرب جغرافياً أولاً</option>
                                  <option value="seats">الأكثر ركاباً أولاً</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* 3. Requests List */}
                          <div className="flex flex-col gap-2 mt-1">
                            {(() => {
                              const pendingRequestsCandidates = requests.filter(r => r.status === 'pending');
                              const capCoords = loggedDriver?.currentLocation || { x: 200, y: 200 };
                              
                              const mapped = pendingRequestsCandidates.map(req => {
                                const reqX = req.fromCoords?.x ?? getLocationCoords(req.fromArea).x;
                                const reqY = req.fromCoords?.y ?? getLocationCoords(req.fromArea).y;
                                const dx = reqX - capCoords.x;
                                const dy = reqY - capCoords.y;
                                const distanceKm = Math.sqrt(dx * dx + dy * dy) * 0.15;
                                return { ...req, computedDistance: distanceKm };
                              });

                              const filtered = mapped.filter(req => {
                                if (req.computedDistance > radarDistance) return false;
                                if (radarGovFilter && !req.fromArea.toLowerCase().includes(radarGovFilter.toLowerCase())) return false;
                                if (req.isAirportRide) {
                                  const minAirportYear = settings.airportMinCarModel ?? settings.minCarModel ?? 2021;
                                  if ((loggedDriver?.carModel ?? 0) < minAirportYear) return false;
                                }
                                return true;
                              });

                              if (radarSortKey === 'distance') {
                                filtered.sort((a, b) => a.computedDistance - b.computedDistance);
                              } else {
                                filtered.sort((a, b) => b.seatsCount - a.seatsCount);
                              }

                              if (filtered.length === 0) {
                                return (
                                  <div className="bg-slate-950 p-5 rounded-lg border border-slate-850 text-center flex flex-col items-center gap-2">
                                    <Info className="w-5 h-5 text-slate-500" />
                                    <p className="text-[10px] text-slate-400 italic">
                                      لا توجد أي طلبات ركاب معلقة ضمن نطاق الرادار المفتوح ({radarDistance} كم) بموقعك الحالي.
                                    </p>
                                    <p className="text-[9px] text-slate-500">
                                      سيتم تحديث الرادار وتنبيهك صوتياً بمجرد إرسال الركاب القريبين لطلبات جديدة عبر المنظومة.
                                    </p>
                                  </div>
                                );
                              }

                              return filtered.map(req => {
                                const isProximityClose = req.computedDistance <= 12;
                                const isProximityFar = req.computedDistance > 45;
                                
                                return (
                                  <div
                                    key={req.id}
                                    className="bg-slate-950 p-3 rounded-lg border border-slate-850 hover:border-amber-500/20 transition-all text-right flex flex-col gap-2"
                                  >
                                    <div className="flex justify-between items-center flex-row-reverse text-[10px]">
                                      {/* Proximity badge */}
                                      <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
                                        isProximityClose 
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                          : isProximityFar 
                                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                      }`}>
                                        📡 {req.computedDistance.toFixed(1)} كم ({isProximityClose ? 'بالقرب منك' : isProximityFar ? 'بعيد نوعاً ما' : 'مسافة متوسطة'})
                                      </span>

                                      <span className="font-bold text-slate-200">{req.isAirportRide ? '✈️' : '👤'} {req.passengerName} {req.isAirportRide && <span className="text-[8.5px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1 py-0.2 rounded mr-1">طلب مطار</span>}</span>
                                    </div>

                                    {/* Path details */}
                                    <div className="text-[11px] text-slate-300 leading-normal border-y border-slate-900 py-1.5 flex flex-col gap-1">
                                      <div>📍 <strong>البيك اب:</strong> {req.fromArea.split(' - ').pop()}</div>
                                      <div>🏁 <strong>الوجهة:</strong> {req.toArea.split(' - ').pop()}</div>
                                      <div className="text-[9.5px] text-slate-400 flex justify-between flex-row-reverse mt-1">
                                        <span>👥 عدد المقاعد: <strong className="text-white">{req.seatsCount} مقاعد</strong></span>
                                        <span>💵 كلفة المقاعد: <strong className="text-emerald-400 font-mono">{req.isAirportRide ? `${req.airportFare ?? settings.airportRidePrice ?? 25.0} د.أ (مطار)` : `${req.seatsCount * settings.passengerFarePerSeat} د.أ`}</strong></span>
                                      </div>
                                    </div>

                                    {/* Action row */}
                                    <div className="grid grid-cols-2 gap-2 mt-0.5">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedRoutePreview(req)}
                                        className="bg-indigo-950/50 hover:bg-indigo-950/90 text-indigo-300 border border-indigo-500/20 py-1 rounded text-[10px] font-sans font-bold flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <span>عرض مسار المسافة 🗺️</span>
                                      </button>
                                      
                                      <button
                                        type="button"
                                        onClick={() => handleAcceptRadarRequest(req)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-black py-1 rounded text-[10px] font-sans font-black flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        <span>توجيه السيارة والقبول 🚕</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>

                        </div>
                      )}

                    </div>
                  )}

                  {/* ACTIVE PROGRESS RIDE */}
                  {activeRide && (
                    <motion.div
                      key={`active-ride-${activeRide.id}-${activeRide.status}`}
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4 flex flex-col gap-3 shadow-xl"
                    >
                      <h4 className="text-xs font-bold text-blue-400 text-right flex justify-end gap-1 items-center border-b border-slate-800 pb-1">
                        <span>تفاصيل توصيل الركاب النشطة</span>
                        <CalendarClock className="w-4 h-4" />
                      </h4>

                      {/* DYNAMIC SVG ROUTE MINI-MAP PREVIEW */}
                      {(() => {
                        const startCoords = getLocationCoords(activeRide.fromArea);
                        const endCoords = getLocationCoords(activeRide.toArea);
                        
                        // Calculate viewBox dynamically for bounding box framing
                        const minX = Math.min(startCoords.x, endCoords.x);
                        const maxX = Math.max(startCoords.x, endCoords.x);
                        const minY = Math.min(startCoords.y, endCoords.y);
                        const maxY = Math.max(startCoords.y, endCoords.y);
                        
                        const width = maxX - minX;
                        const height = maxY - minY;
                        
                        const paddingX = Math.max(width * 0.4, 40);
                        const paddingY = Math.max(height * 0.4, 40);
                        const vbX = minX - paddingX;
                        const vbY = minY - paddingY;
                        const vbWidth = Math.max(width + paddingX * 2, 80);
                        const vbHeight = Math.max(height + paddingY * 2, 80);
                        
                        // Bezier layout quadratic control point
                        const midX = (startCoords.x + endCoords.x) / 2;
                        const midY = (startCoords.y + endCoords.y) / 2;
                        // Orthogonal curve offset
                        const controlX = midX + (endCoords.y - startCoords.y) * 0.22;
                        const controlY = midY - (endCoords.x - startCoords.x) * 0.22;
                        
                        const pathD = `M ${startCoords.x} ${startCoords.y} Q ${controlX} ${controlY} ${endCoords.x} ${endCoords.y}`;
                        
                        // Precise location along curve for progress t
                        const t = progress;
                        const cx = (1 - t) * (1 - t) * startCoords.x + 2 * (1 - t) * t * controlX + t * t * endCoords.x;
                        const cy = (1 - t) * (1 - t) * startCoords.y + 2 * (1 - t) * t * controlY + t * t * endCoords.y;
                        
                        // Tangent angle
                        const dx = 2 * (1 - t) * (controlX - startCoords.x) + 2 * t * (endCoords.x - controlX);
                        const dy = 2 * (1 - t) * (controlY - startCoords.y) + 2 * t * (endCoords.y - controlY);
                        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                        
                        const pulseRadius = 13 + Math.sin(pulse * 0.15) * 4;

                        const startLabel = activeRide.fromArea.split('-').pop();
                        const endLabel = activeRide.toArea.split('-').pop();

                        // Visual progress calculation based on coordinate distance
                        const totalCoordsDistance = Math.sqrt(dx * dx + dy * dy);
                        const dcx = cx - startCoords.x;
                        const dcy = cy - startCoords.y;
                        const coveredCoordsDistance = Math.sqrt(dcx * dcx + dcy * dcy);
                        
                        const distanceProgressPercentage = totalCoordsDistance > 0 
                          ? Math.min(100, Math.max(0, Math.round((coveredCoordsDistance / totalCoordsDistance) * 105))) // boost slightly for intuitive mapping or scale
                          : 0;

                        // Bound maximum percentage to 100
                        const clampedPercentage = Math.min(100, distanceProgressPercentage);

                        // Simulated physical kilometer details parsed or estimated
                        const totalDistanceKm = activeRide.distanceKm 
                          ? parseFloat(activeRide.distanceKm) 
                          : Number((totalCoordsDistance * 0.05).toFixed(1));
                        
                        const coveredDistanceKm = Number(((clampedPercentage / 100) * totalDistanceKm).toFixed(1));
                        const remainingDistanceKm = Number(Math.max(0, totalDistanceKm - coveredDistanceKm).toFixed(1));
                        
                        return (
                          <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-1 select-none flex flex-col">
                            <div className="absolute top-2 left-2 z-10 font-mono text-[8.5px] bg-slate-900/80 px-1.5 py-0.5 rounded text-blue-400 border border-slate-800/50 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                              <span>
                                {activeRide.status === 'accepted' ? 'جاري التحرك للركاب' : 'قيد التوصيل الآن'}
                              </span>
                              <span>({clampedPercentage}%)</span>
                            </div>

                            <svg viewBox={`${vbX} ${vbY} ${vbWidth} ${vbHeight}`} className="w-full h-36 bg-[#090d16] rounded-xl relative">
                              <defs>
                                <pattern id="driver-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                                  <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(51,65,85,0.12)" strokeWidth="0.8" />
                                </pattern>
                                <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#10b981" />
                                  <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#driver-grid)" />
                              
                              {/* Background route path */}
                              <path 
                                d={pathD} 
                                fill="none" 
                                stroke="#1e293b" 
                                strokeWidth="4" 
                                strokeLinecap="round" 
                              />
                              <path 
                                d={pathD} 
                                fill="none" 
                                stroke="#334155" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeDasharray="5 4" 
                              />

                              {/* Glowing Active Trip Traced Path */}
                              {activeRide.status === 'started' && (
                                <path
                                  d={pathD}
                                  fill="none"
                                  stroke="url(#route-gradient)"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeDasharray="400"
                                  strokeDashoffset={400 * (1 - progress)}
                                  className="transition-all duration-100 ease-linear drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                                />
                              )}

                              {/* Start Node Pulse Ring */}
                              {activeRide.status === 'accepted' && (
                                <circle 
                                  cx={startCoords.x} 
                                  cy={startCoords.y} 
                                  r={pulseRadius} 
                                  fill="none" 
                                  stroke="#10b981" 
                                  strokeWidth="1.5" 
                                  opacity="0.5" 
                                />
                              )}

                              {/* Start (Pickup) Node */}
                              <g transform={`translate(${startCoords.x}, ${startCoords.y})`}>
                                <circle r="7" fill="#10b981" />
                                <circle r="3" fill="#ffffff" />
                              </g>

                              {/* Destination Node Pulse Ring */}
                              {activeRide.status === 'started' && (
                                <circle 
                                  cx={endCoords.x} 
                                  cy={endCoords.y} 
                                  r={pulseRadius} 
                                  fill="none" 
                                  stroke="#3b82f6" 
                                  strokeWidth="1.5" 
                                  opacity="0.4" 
                                />
                              )}

                              {/* Destination Node */}
                              <g transform={`translate(${endCoords.x}, ${endCoords.y})`}>
                                <circle r="7" fill="#3b82f6" />
                                <rect x="-2" y="-2" width="4" height="4" fill="#ffffff" />
                              </g>

                              {/* Rotating GPS Indicator (Car Icon Replacement) */}
                              <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
                                <circle r="8.5" fill="rgba(59, 130, 246, 0.45)" className="animate-pulse" />
                                <path 
                                  d="M-5.5,-4 L7.5,0 L-5.5,4 L-2.5,0 Z" 
                                  fill="#60a5fa" 
                                  stroke="#1d4ed8" 
                                  strokeWidth="1" 
                                  className="drop-shadow-[0_0_3px_rgba(30,58,138,0.8)]"
                                  id="intercity-car-arrow"
                                />
                                <circle r="2" fill="#ffffff" />
                              </g>

                              {/* Render Intercity AI Speed Radar & Checkpoint threats along Bezier Path */}
                              {activeIntercityRideThreats.map(threat => {
                                const tVal = threat.percent;
                                const tx = (1 - tVal) * (1 - tVal) * startCoords.x + 2 * (1 - tVal) * tVal * controlX + tVal * tVal * endCoords.x;
                                const ty = (1 - tVal) * (1 - tVal) * startCoords.y + 2 * (1 - tVal) * tVal * controlY + tVal * tVal * endCoords.y;
                                const color = threat.type === 'police_checkpoint' ? '#ef4444' : threat.type === 'fixed_camera' ? '#3b82f6' : '#f59e0b';
                                const emoji = threat.type === 'police_checkpoint' ? '👮' : threat.type === 'fixed_camera' ? '📷' : '⚡';
                                return (
                                  <g key={threat.id} transform={`translate(${tx}, ${ty})`}>
                                    <circle r="9" fill="none" stroke={color} strokeWidth="0.8" className="animate-ping opacity-60" style={{ animationDuration: '3.5s' }} />
                                    <circle r="6" fill="#080c14" stroke={color} strokeWidth="1" />
                                    <text y="2.2" fontSize="5" textAnchor="middle" className="pointer-events-none">{emoji}</text>
                                    <title>{threat.nameAr} ({threat.limit} كم/س)</title>
                                  </g>
                                );
                              })}

                              {/* Text Labels for locations avoiding overlap */}
                              <text 
                                x={startCoords.x} 
                                y={startCoords.y - 12} 
                                fill="#10b981" 
                                fontSize="9" 
                                fontWeight="bold"
                                textAnchor="middle" 
                                className="font-sans"
                              >
                                {startLabel} (البداية)
                              </text>
                              <text 
                                x={endCoords.x} 
                                y={endCoords.y - 12} 
                                fill="#60a5fa" 
                                fontSize="9" 
                                fontWeight="bold" 
                                textAnchor="middle" 
                                className="font-sans"
                              >
                                {endLabel} (الوجهة)
                              </text>
                            </svg>

                            {/* DYNAMIC PROGRESS BAR COMPONENT */}
                            <div className="p-3 border-t border-slate-800 bg-slate-900 bg-opacity-70 flex flex-col gap-2 font-sans text-right">
                              <div className="flex justify-between items-center flex-row-reverse text-[10px]">
                                <span className="font-extrabold text-blue-400 flex items-center gap-1 flex-row-reverse">
                                  <span>🧭 مسار ومؤشر التقدم الفعلي جغرافياً</span>
                                </span>
                                <span className="text-amber-400 font-extrabold font-mono text-xs bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  {clampedPercentage}% مكتمل
                                </span>
                              </div>

                              {/* Custom Visual progress bar */}
                              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                                <div 
                                  className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
                                  style={{ width: `${clampedPercentage}%` }}
                                />
                                {clampedPercentage > 0 && clampedPercentage < 100 && (
                                  <div 
                                    className="absolute top-0 h-full w-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]"
                                    style={{ left: `calc(${clampedPercentage}% - 4px)` }}
                                  />
                                )}
                              </div>

                              {/* Metric Grid stats */}
                              <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] mt-0.5">
                                <div className="bg-slate-950/40 p-1.5 rounded-lg border border-slate-800">
                                  <span className="text-slate-500 block">المسافة المقدرة</span>
                                  <span className="text-blue-400 font-bold font-mono text-[10px]">{totalDistanceKm.toFixed(1)} كم</span>
                                </div>
                                <div className="bg-slate-950/40 p-1.5 rounded-lg border border-slate-800">
                                  <span className="text-slate-500 block">المقطوع حتى الآن</span>
                                  <span className="text-emerald-400 font-bold font-mono text-[10px]">{coveredDistanceKm.toFixed(1)} كم</span>
                                </div>
                                <div className="bg-slate-950/40 p-1.5 rounded-lg border border-slate-800">
                                  <span className="text-slate-500 block">المتبقي للوجهة</span>
                                  <span className="text-amber-500 font-bold font-mono text-[10px]">{remainingDistanceKm.toFixed(1)} كم</span>
                                </div>
                              </div>

                              {/* Dynamic tip under progress bar based on status & progress */}
                              <div className="text-[8.5px] leading-relaxed text-slate-400 bg-slate-950/20 p-1 px-2 rounded-md border border-slate-800/40 flex items-center gap-1.5 flex-row-reverse mt-0.5">
                                <span className="text-amber-400">💡</span>
                                <span>
                                  {clampedPercentage === 0 ? (
                                    "بانتظار اقلال الركاب وتحريك المركبة لحساب التقدم الملاحي."
                                  ) : clampedPercentage < 35 ? (
                                    "انطلقت الرحلة للتو من نقطة الانطلاق، نتمنى للكابتن والركاب طريقاً سالماً ميسراً."
                                  ) : clampedPercentage < 75 ? (
                                    `كابتن! لقد قطعت مسافة ${coveredDistanceKm.toFixed(1)} كم بنجاح، وتبقى ${remainingDistanceKm.toFixed(1)} كم للنزول.`
                                  ) : clampedPercentage < 100 ? (
                                    "أنت على وشك الوصول إلى الوجهة والإنزال! يرجى الاستعداد لتأكيد إتمام التوصيل."
                                  ) : (
                                    "تم إتمام التوصيل جغرافياً بالكامل! اضغط لتوديع الركاب وتأكيد الرحلة."
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* AI Safety Speed Radar & Police Detector Intercity HUD Dashboard */}
                            {activeRide.status === 'started' && (
                              <div className="bg-slate-950 border-t border-slate-800 p-3.5 flex flex-col gap-3 font-sans text-right">
                                <div className="flex justify-between items-center border-b border-slate-800/60 pb-2 flex-row-reverse">
                                  <div className="flex items-center gap-1.5 flex-row-reverse">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                    <h3 className="text-[10px] font-black text-slate-100">
                                      مساعد الرادار والسلامة الخارجي بـ AI
                                    </h3>
                                  </div>

                                  {/* Voice alert toggle */}
                                  <button
                                    type="button"
                                    onClick={() => setIsIntercityVoiceEnabled(!isIntercityVoiceEnabled)}
                                    className={`px-2 py-0.5 rounded text-[8px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                      isIntercityVoiceEnabled 
                                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                                    }`}
                                  >
                                    {isIntercityVoiceEnabled ? '🔊 صوت نشط' : '🔇 صامت'}
                                  </button>
                                </div>

                                {/* Bento Row: Speedometer + Live Threat Log */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-stretch text-right">
                                  {/* Visual Speedometer & Threat Alert Indicator */}
                                  <div className="bg-slate-900/35 border border-slate-800/40 rounded-xl p-2 flex items-center justify-between flex-row-reverse">
                                    <div className="text-right">
                                      <span className="text-[8px] text-slate-500 block uppercase font-mono">
                                        سرعة الكابتن الفعلية
                                      </span>
                                      <div className="flex items-baseline gap-0.5 flex-row-reverse">
                                        <span className={`text-xl font-black font-mono tracking-tight ${
                                          activeIntercityRideThreats.some(threat => {
                                            const dist = threat.percent - progress;
                                            return dist > 0 && dist <= 0.12 && intercitySpeedometer > threat.limit;
                                          }) ? 'text-red-500 animate-pulse' : 'text-emerald-400'
                                        }`}>
                                          {intercitySpeedometer}
                                        </span>
                                        <span className="text-[8px] text-slate-400">كم/س</span>
                                      </div>
                                    </div>

                                    {/* Icon status */}
                                    <div className="flex flex-col items-center justify-center gap-0.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800/30 min-w-[70px]">
                                      <span className="text-[7px] text-slate-500 block">حد السرعة</span>
                                      {(() => {
                                        const upcoming = activeIntercityRideThreats.find(t => (t.percent - progress) > 0);
                                        const currentLimit = upcoming ? upcoming.limit : 100;
                                        const isSpeeding = intercitySpeedometer > currentLimit;
                                        return (
                                          <>
                                            <span className={`text-[9px] font-black px-1 rounded ${
                                              isSpeeding ? 'bg-red-500 text-slate-950 animate-bounce' : 'bg-slate-800 text-slate-300'
                                            }`}>
                                              {currentLimit} كم/س
                                            </span>
                                            {isSpeeding && (
                                              <span className="text-[7px] text-red-400 font-bold animate-pulse">
                                                ⚠️ خفف السرعة!
                                              </span>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>

                                  {/* AI Threat Scanner Logs */}
                                  <div className="bg-slate-900/35 border border-slate-800/40 rounded-xl p-2 flex flex-col gap-0.5 text-[8.5px] justify-center text-right font-sans">
                                    <div className="text-[7.5px] text-indigo-400 font-mono font-semibold flex justify-between items-center flex-row-reverse mb-1 border-b border-slate-800/20 pb-0.5">
                                      <span>📡 نظام الكشف والاستطلاع الخارجي</span>
                                      <span className="text-slate-500">Confidence 95%</span>
                                    </div>
                                    {(() => {
                                      const upcoming = activeIntercityRideThreats.find(t => (t.percent - progress) > 0);
                                      if (upcoming) {
                                        const distanceKm = Math.round((upcoming.percent - progress) * (parseFloat(activeRide.distanceKm) || 45));
                                        return (
                                          <div className="flex flex-col gap-0.5 text-right">
                                            <div className="text-slate-200 font-bold flex items-center gap-1 justify-end">
                                              <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse"></span>
                                              <span>{upcoming.nameAr}</span>
                                            </div>
                                            <div className="text-indigo-300">
                                              على بعد {distanceKm > 0 ? distanceKm : 1} كم تقريباً • السرعة المسموحة: {upcoming.limit} كم/س
                                            </div>
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <div className="text-slate-500 text-center py-0.5">
                                            🟢 الطريق الخارجي آمن وسالك تماماً من الرادارات والدوريات
                                          </div>
                                        );
                                      }
                                    })()}
                                  </div>
                                </div>

                                {/* Community Alert Reporter Tools */}
                                <div className="border-t border-slate-850 pt-2.5 flex flex-col gap-1 text-right font-sans">
                                  <span className="text-[7.5px] text-slate-500 block">
                                    🚨 الإبلاغ الفوري على الطريق السريع (لتنبيه سائقي القوافل الآخرين):
                                  </span>
                                  <div className="grid grid-cols-3 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleReportIntercityThreat('fixed_camera')}
                                      className="py-1 px-1 bg-blue-950/30 hover:bg-blue-900/30 text-blue-400 hover:text-blue-300 border border-blue-900/40 rounded-md text-[8.5px] font-black transition flex items-center justify-center gap-0.5 cursor-pointer flex-row-reverse"
                                    >
                                      <span>📷 كاميرا ثابتة</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleReportIntercityThreat('mobile_radar')}
                                      className="py-1 px-1 bg-yellow-950/30 hover:bg-yellow-900/30 text-yellow-400 hover:text-yellow-300 border border-yellow-900/40 rounded-md text-[8.5px] font-black transition flex items-center justify-center gap-0.5 cursor-pointer flex-row-reverse"
                                    >
                                      <span>⚡ رادار متحرك</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleReportIntercityThreat('police_checkpoint')}
                                      className="py-1 px-1 bg-red-950/30 hover:bg-red-900/30 text-red-400 hover:text-red-300 border border-red-900/40 rounded-md text-[8.5px] font-black transition flex items-center justify-center gap-0.5 cursor-pointer flex-row-reverse"
                                    >
                                      <span>👮 دورية شرطة</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                       <div className="flex flex-col gap-1 text-[11px] text-slate-300 text-right font-sans">
                        <div>🏁 <strong>مسار الرحلة:</strong> من {activeRide.fromArea.split('-').pop()} إلى {activeRide.toArea.split('-').pop()}</div>
                        <div className="grid grid-cols-2 gap-2 mt-1 mb-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                          <div className="text-right">
                            <span className="text-slate-400 text-[9px] block">💵 إجمالي تحصيل الرحلة:</span>
                            <span className="text-emerald-400 font-extrabold text-[12px] font-mono">
                              {activeRide.requests.reduce((sum, r) => sum + r.seatsCount, 0) * settings.passengerFarePerSeat} د.أ
                            </span>
                          </div>
                          <div className="text-right border-r border-slate-800 pr-2">
                            <span className="text-slate-400 text-[9px] block">✂️ عمولة آدم المقتطعة:</span>
                            <span className="text-rose-400 font-extrabold text-[12px] font-mono">
                              {activeRide.requests.reduce((sum, r) => sum + r.seatsCount, 0) * settings.commissionRate} د.أ
                            </span>
                          </div>
                        </div>
                        <div className="mt-1 pb-1 border-b border-slate-800/80 text-[10px] text-slate-400 select-all font-sans flex flex-col gap-1">
                          {activeRide.requests.map((r, i) => (
                            <div key={i} className="flex justify-between items-center flex-row-reverse bg-slate-950/60 p-1 rounded px-2">
                              <span>• {r.passengerName} (الهاتف: مخفي للخصوصية 💬 تواصل عبر الدردشة) - {r.seatsCount} مقاعد (المستحق: {r.seatsCount * settings.passengerFarePerSeat} د.أ)</span>
                              {r.requestedTime && (
                                <span className="text-amber-400 font-bold font-mono text-[9px] bg-amber-500/10 px-1 py-0.5 rounded">
                                  ⏰ {r.requestedTime.replace('T', ' ')}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* DYNAMIC HIGH-FIDELITY NAVIGATION CARD FOR INTERCITY */}
                      {(() => {
                        const startCoords = getLocationCoords(activeRide.fromArea);
                        const endCoords = getLocationCoords(activeRide.toArea);
                        const pickupGeo = getGeoCoords(startCoords.x, startCoords.y);
                        const dropoffGeo = getGeoCoords(endCoords.x, endCoords.y);
                        
                        const targetGeo = activeRide.status === 'accepted' ? pickupGeo : dropoffGeo;
                        const targetName = activeRide.status === 'accepted' ? activeRide.fromArea : activeRide.toArea;
                        
                        return (
                          <div id="intercity-driver-navigation-card" className="bg-slate-950/90 rounded-2xl p-4 border border-indigo-500/20 flex flex-col gap-3 font-sans text-right animate-fadeIn mt-2 mb-2">
                            <div className="flex justify-between items-center flex-row-reverse border-b border-slate-800 pb-2">
                              <span className="text-[10px] font-black text-indigo-400 flex items-center gap-1 flex-row-reverse">
                                <Compass className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                                {activeRide.status === 'accepted' 
                                  ? '🧭 توجيه خارجي لنقطة تجمع الركاب (الإنطلاق)'
                                  : '🧭 توجيه خارجي لموقع نزول الركاب (الوجهة)'}
                              </span>
                              <span className="text-[8px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono font-bold">
                                {activeRide.status === 'accepted' ? 'إحداثيات التجمع' : 'إحداثيات الوجهة'}
                              </span>
                            </div>

                            {autoLaunchStatusMsg && (
                              <div className="bg-indigo-950 border border-indigo-500/40 p-2.5 rounded-xl text-center text-[9.5px] text-indigo-300 font-bold animate-pulse leading-normal font-sans">
                                {autoLaunchStatusMsg}
                              </div>
                            )}
                            
                            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850 text-right text-[9px] text-slate-400 flex flex-col gap-1">
                              <div className="flex justify-between flex-row-reverse">
                                <span>الموقع الجغرافي:</span>
                                <strong className="text-slate-200">{targetName.split('-').pop()}</strong>
                              </div>
                              <div className="flex justify-between flex-row-reverse font-mono text-[8px] text-slate-500">
                                <span>إحداثيات دقيقة:</span>
                                <strong>{targetGeo.lat.toFixed(6)}, {targetGeo.lng.toFixed(6)}</strong>
                              </div>
                            </div>

                            {/* Targets Google Maps / Waze */}
                            <span className="text-[9px] text-slate-400 block font-bold text-right pt-0.5">
                              {activeRide.status === 'accepted' 
                                ? 'توجيه لعنوان تجمع الركاب الفوري:'
                                : 'توجيه لربط الوجهة النهائية للقافلة:'}
                            </span>
                            
                            <div className="grid grid-cols-2 gap-2">
                              {/* Google Maps */}
                              <a
                                id="intercity-link-google-maps"
                                href={`https://www.google.com/maps/search/?api=1&query=${targetGeo.lat},${targetGeo.lng}`}
                                target="_blank"
                                rel="no-referrer"
                                className="bg-indigo-600/15 hover:bg-indigo-600 border border-indigo-500/25 hover:border-indigo-400 text-indigo-300 hover:text-white py-2 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
                              >
                                📍 خرائط Google
                              </a>

                              {/* Waze */}
                              <a
                                id="intercity-link-waze"
                                href={`waze://?ll=${targetGeo.lat},${targetGeo.lng}&navigate=yes`}
                                target="_blank"
                                rel="no-referrer"
                                className="bg-amber-500/15 hover:bg-amber-500 border border-amber-500/25 hover:border-amber-400 text-amber-300 hover:text-slate-950 py-2 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
                                onClick={(e) => {
                                  // Attempt to launch via native waze scheme; setup immediate timer fallback to web link if unsuccessful
                                  const fallback = `https://waze.com/ul?ll=${targetGeo.lat},${targetGeo.lng}&navigate=yes`;
                                  setTimeout(() => {
                                    window.open(fallback, '_blank');
                                  }, 400);
                                }}
                              >
                                🚗 تطبيق Waze
                              </a>
                            </div>

                            {/* Section 2: Complete Route Routing */}
                            <span className="text-[9px] text-slate-400 block font-bold border-t border-slate-800/80 pt-2 text-right">
                              خيارات تتبع المسار الكامل للرحلة التجميعية:
                            </span>
                            
                            <a
                              id="intercity-link-google-route-full"
                              href={`https://www.google.com/maps/dir/?api=1&origin=${pickupGeo.lat},${pickupGeo.lng}&destination=${dropoffGeo.lat},${dropoffGeo.lng}&travelmode=driving&dir_action=navigate`}
                              target="_blank"
                              rel="no-referrer"
                              className="w-full bg-slate-900 hover:bg-indigo-950 border border-slate-850 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-300 py-2.5 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-2 cursor-pointer text-center"
                            >
                              🗺️ تتبع المسار بالكامل (Google Maps Route)
                            </a>

                            {/* Auto launch preference selector */}
                            <div className="mt-2 pt-3 border-t border-slate-850 flex flex-col gap-1.5 text-right">
                              <div className="flex justify-between items-center flex-row-reverse text-[9.5px]">
                                <span className="font-extrabold text-indigo-400">⚙️ التوجيه الملاحي التلقائي عند قبول الرحلة (Auto-Launch)</span>
                                <span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded font-bold">
                                  مفعل تلقائياً ⚡
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-1.5 mt-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAutoLaunchMapPref('none');
                                    localStorage.setItem('adam_auto_launch_map', 'none');
                                  }}
                                  className={`py-1.5 rounded-lg text-[9px] font-bold transition border cursor-pointer ${
                                    autoLaunchMapPref === 'none'
                                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-md'
                                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                                  }`}
                                >
                                  ❌ معطل (يدوي)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAutoLaunchMapPref('google');
                                    localStorage.setItem('adam_auto_launch_map', 'google');
                                  }}
                                  className={`py-1.5 rounded-lg text-[9px] font-bold transition border cursor-pointer ${
                                    autoLaunchMapPref === 'google'
                                      ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-md'
                                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                                  }`}
                                >
                                  📍 Google تلقائي
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAutoLaunchMapPref('waze');
                                    localStorage.setItem('adam_auto_launch_map', 'waze');
                                  }}
                                  className={`py-1.5 rounded-lg text-[9px] font-bold transition border cursor-pointer ${
                                    autoLaunchMapPref === 'waze'
                                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-md'
                                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                                  }`}
                                >
                                  🚗 Waze تلقائي
                                </button>
                              </div>
                              <p className="text-[8.5px] text-slate-500 leading-normal">
                                * عند تفعيل الخيار التلقائي، سيقوم آدم بتحويلك بضغطة زر إلى نظام التوجيه الملاحي الفوري بمجرد استقبال وقبول الرحلة لضمان وصول سلس وسريع.
                              </p>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="flex flex-col gap-2 mt-1">
                        {activeRide.status === 'accepted' && (
                          <div className="bg-slate-950 border-2 border-indigo-500/40 p-3.5 rounded-2xl flex flex-col gap-2.5 shadow-xl text-right">
                            <div className="flex justify-between items-center flex-row-reverse border-b border-slate-800 pb-1.5">
                              <span className="text-xs font-black text-indigo-300 flex items-center gap-1 flex-row-reverse">
                                <span>🔒 رمز الأمان والبدء (PIN)</span>
                              </span>
                              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">
                                اطلبه من الراكب
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-300">
                              يرجى طلب الرمز السري المكون من 4 أرقام الظاهر على هاتف الراكب وإدخاله للتحقق وبدء الرحلة:
                            </p>
                            <input
                              type="text"
                              maxLength={4}
                              value={otpInputValue}
                              onChange={(e) => setOtpInputValue(e.target.value.replace(/\D/g, ''))}
                              placeholder="أدخل رمز الـ PIN هنا (4 أرقام)"
                              className="bg-slate-900 border-2 border-indigo-400/50 rounded-xl p-2.5 text-center text-lg font-mono tracking-widest text-indigo-200 outline-none focus:border-indigo-400"
                            />
                            <button
                              onClick={() => {
                                const capCoords = currentDriver?.currentLocation || { x: 150, y: 150 };
                                const pickupCoords = getLocationCoords(activeRide.fromArea);
                                const distanceToPassenger = Math.hypot(pickupCoords.x - capCoords.x, pickupCoords.y - capCoords.y);
                                if (distanceToPassenger > 15) {
                                  const msg = `⚠️ عذراً كابتن! لا يمكنك بدء الرحلة حتى تصل أولاً إلى نقطة الإقلال (${activeRide.fromArea.split('-').pop()}). المسافة المتبقية: ${(distanceToPassenger / 10).toFixed(1)} كم.`;
                                  alert(msg);
                                  speakOutLoud(msg);
                                  return;
                                }
                                if (!otpInputValue || otpInputValue.length < 4) {
                                  alert('⚠️ يرجى إدخال رمز الأمان المكون من 4 أرقام المزود من الراكب لبدء الرحلة!');
                                  return;
                                }
                                const res = startRide(activeRide.id, otpInputValue);
                                if (res && !res.success) {
                                  alert(res.msg);
                                  speakOutLoud(res.msg);
                                } else {
                                  setOtpInputValue('');
                                  speakOutLoud('تم التحقق من رمز الأمان وتأكيد انطلاق الرحلة بنجاح!');
                                }
                              }}
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-95 text-white py-3 rounded-xl text-xs font-black font-sans transition-all duration-200 ease-in-out cursor-pointer shadow-lg"
                            >
                              🚀 التحقق من الرمز وانطلاق المشوار
                            </button>
                          </div>
                        )}

                        {activeRide.status === 'started' && (
                          <div className="flex flex-col gap-2">
                            <span className="text-[9px] text-amber-500 text-center animate-pulse leading-relaxed">
                              * اضغط لإنهاء التوصيل بعد اقلالهم وإنزالهم في وجهتهم. سيقوم آدم بخصم عمولة التجميع تلو الآخر.
                            </span>
                            <button
                              onClick={() => {
                                // Close active and reset
                                endRide(activeRide.id);
                                setRatingSubmittedList({});
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold font-sans transition"
                            >
                              إيصال الركاب وإنهاء الرحلة بنجاح ✅
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                </div>
              )}

              {/* TRIP HISTORY */}
              {activeTab === 'history' && (
                <div className="flex flex-col gap-3 font-sans">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 flex-row-reverse">
                    <h3 className="text-xs font-bold text-slate-200 flex justify-end gap-1 items-center">
                      <span>{t('أرشيف وسجل تجميعات كابتن آدم', 'Captain Ride History Archive')}</span>
                      <History className="w-4 h-4 text-amber-500" />
                    </h3>
                    <div className="flex gap-1 flex-row-reverse text-[9px]">
                      <button
                        onClick={() => setHistoryType('all')}
                        className={`px-2 py-1 rounded-md transition cursor-pointer ${historyType === 'all' ? 'bg-amber-500 font-bold text-black' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'}`}
                      >
                        {t('الكل', 'All')}
                      </button>
                      <button
                        onClick={() => setHistoryType('intercity')}
                        className={`px-2 py-1 rounded-md transition cursor-pointer ${historyType === 'intercity' ? 'bg-amber-500 font-bold text-black' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'}`}
                      >
                        {t('بين المحافظات', 'Intercity')}
                      </button>
                      <button
                        onClick={() => setHistoryType('intracity')}
                        className={`px-2 py-1 rounded-md transition cursor-pointer ${historyType === 'intracity' ? 'bg-amber-500 font-bold text-black' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'}`}
                      >
                        {t('داخل المدينة', 'Intracity')}
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const intercityRides = rides.filter(r => r.status === 'completed' && r.driverId === loggedDriver.id);
                    const intracityRidesList = (intraCityRides || []).filter(r => r.status === 'completed' && r.driverId === loggedDriver.id);

                    // Combine and display based on historyType
                    let combined: ({ type: 'intercity', data: any, date: string } | { type: 'intracity', data: any, date: string })[] = [];

                    if (historyType === 'all' || historyType === 'intercity') {
                      intercityRides.forEach(r => {
                        combined.push({ type: 'intercity', data: r, date: r.endTime || r.startTime || '' });
                      });
                    }

                    if (historyType === 'all' || historyType === 'intracity') {
                      intracityRidesList.forEach(r => {
                        combined.push({ type: 'intracity', data: r, date: r.createdAt || '' });
                      });
                    }

                    // Sort newest first
                    combined.sort((a, b) => b.date.localeCompare(a.date));

                    if (combined.length === 0) {
                      return (
                        <div className="text-center py-8 text-xs text-slate-500 font-sans">
                          {t('لا سجّلات لتوصيل الركاب بعد كابتن. ابدأ طلباتك!', 'No ride logs found yet, captain. Start accepting rides!')}
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col gap-3 h-[380px] overflow-y-auto pr-1">
                        {combined.map((trip, idx) => {
                          if (trip.type === 'intercity') {
                            const ride = trip.data;
                            const totalSeats = ride.requests.reduce((sum: number, r: any) => sum + r.seatsCount, 0);

                            return (
                              <div key={`inter-${ride.id}-${idx}`} className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col gap-2 text-right relative overflow-hidden transition hover:border-slate-800">
                                <div className="absolute top-0 left-0 bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-br-lg text-[8px] font-bold">
                                  {t('بين المحافظات 🚌', 'Intercity 🚌')}
                                </div>
                                
                                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 flex-row-reverse">
                                  <span className="font-mono">{ride.endTime || ride.startTime || t('منتهية', 'Completed')}</span>
                                  <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[8.5px] font-bold">
                                    {t(`عمولة آدم: -${ride.commissionCharged.toFixed(2)} د.أ`, `Adam fee: -${ride.commissionCharged.toFixed(2)} JOD`)}
                                  </span>
                                </div>

                                <div className="space-y-0.5 my-1">
                                  <div className="text-xs font-bold text-slate-200 flex items-center justify-end gap-1.5 flex-row-reverse">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                    <span>{t('من:', 'From:')} {ride.fromArea.split('-').pop()}</span>
                                  </div>
                                  <div className="text-xs font-bold text-slate-200 flex items-center justify-end gap-1.5 flex-row-reverse">
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                    <span>{t('إلى:', 'To:')} {ride.toArea.split('-').pop()}</span>
                                  </div>
                                </div>

                                <div className="text-[10px] text-indigo-400 font-sans mt-0.5">
                                  {t(`إجمالي الركاب: ${totalSeats} ركاب دمج في الحافلة`, `Total Passengers: ${totalSeats} pooled customers`)}
                                </div>

                                {/* List of Passengers to Rate */}
                                <div className="bg-slate-900/40 rounded-lg p-2.5 border border-slate-900/80 space-y-2 text-right">
                                  <div className="text-[10px] text-slate-400 font-bold border-b border-slate-800 pb-1 mb-1">
                                    {t('بيانات الركاب وتصنيف العملاء:', 'Passenger Details & Feedbacks:')}
                                  </div>

                                  {ride.requests.map((req: any, rIdx: number) => {
                                    const passengerRatings = ride.passengerRatings || {};
                                    const hasRated = !!passengerRatings[req.passengerId];
                                    const ratingInfo = passengerRatings[req.passengerId];

                                    return (
                                      <div key={rIdx} className="text-[10px] bg-slate-950 p-2 rounded border border-slate-900 flex flex-col gap-1.5">
                                        <div className="flex justify-between items-center flex-row-reverse font-sans">
                                          <div className="text-slate-200 font-bold">
                                            {req.passengerName}
                                          </div>
                                          <div className="text-slate-400 font-mono">
                                            {req.passengerPhone} ({req.seatsCount} {t('مقاعد', 'seats')})
                                          </div>
                                        </div>

                                        {/* Passenger Rating Form / Score */}
                                        <div className="border-t border-slate-900/80 pt-1.5">
                                          {hasRated ? (
                                            <div className="flex items-center gap-1.5 justify-end text-[9.5px] text-amber-400 flex-row-reverse">
                                              <div className="flex">
                                                {Array.from({ length: ratingInfo.rating }).map((_, i) => (
                                                  <span key={i}>★</span>
                                                ))}
                                                {Array.from({ length: 5 - ratingInfo.rating }).map((_, i) => (
                                                  <span key={i} className="text-slate-700">★</span>
                                                ))}
                                              </div>
                                              <span className="text-slate-400 font-medium">"{ratingInfo.note || t('توصيل رائع', 'Great passenger')}"</span>
                                            </div>
                                          ) : (
                                            <div>
                                              {ratingTripId === ride.id && ratingPassengerId === req.passengerId ? (
                                                <div className="space-y-1.5 mt-1">
                                                  <div className="flex items-center justify-between flex-row-reverse text-[9.5px]">
                                                    <span className="text-slate-400 font-bold">{t('قيّم الراكب:', 'Rate Passenger:')}</span>
                                                    <div className="flex gap-1 flex-row-reverse">
                                                      {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                          key={star}
                                                          type="button"
                                                          onClick={() => setRatingVal(star)}
                                                          className="text-base transition cursor-pointer"
                                                        >
                                                          <span className={star <= ratingVal ? "text-amber-400" : "text-slate-700"}>★</span>
                                                        </button>
                                                      ))}
                                                    </div>
                                                  </div>
                                                  <div className="flex gap-1 items-center">
                                                    <input
                                                      type="text"
                                                      value={ratingNote}
                                                      onChange={e => setRatingNote(e.target.value)}
                                                      placeholder={t('أضف ملاحظة أو تسجيل صوتي مباشر...', 'Leave a comment or voice note...')}
                                                      className="w-full bg-slate-900 border border-slate-800 text-[10px] p-1.5 rounded outline-none text-right placeholder-slate-600 font-sans focus:border-amber-500"
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                                                        if (!SpeechRec) {
                                                          alert(t("متصفحك لا يدعم خاصية تحويل الكلام الصوتي إلى نص مباشرة.", "Your browser does not support speech-to-text translation directly."));
                                                          return;
                                                        }
                                                        const recognition = new SpeechRec();
                                                        recognition.lang = language === 'en' ? 'en-US' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : language === 'tr' ? 'tr-TR' : language === 'de' ? 'de-DE' : language === 'ru' ? 'ru-RU' : language === 'zh' ? 'zh-CN' : language === 'hi' ? 'hi-IN' : language === 'ur' ? 'ur-PK' : 'ar-JO';
                                                        recognition.onstart = () => alert(t("🎙️ جارٍ الاستماع لملاحظتك الصوتية باللغة العربية...", "🎙️ Listening to your voice note in your selected active language..."));
                                                        recognition.onresult = (event: any) => {
                                                          const transcript = event.results[0][0].transcript;
                                                          setRatingNote(prev => prev ? `${prev} ${transcript}` : transcript);
                                                        };
                                                        recognition.onerror = () => alert(t("تعذر التقاط الصوت، يرجى المحاولة مرة أخرى.", "Could not capture voice, please try again."));
                                                        recognition.start();
                                                      }}
                                                      title="تسجيل ملاحظة صوتية (تحويل الكلام إلى نص)"
                                                      className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-400 p-1.5 rounded cursor-pointer transition shrink-0 flex items-center justify-center text-[9px]"
                                                    >
                                                      🎙️ {t('صوتي', 'Voice')}
                                                    </button>
                                                  </div>
                                                  <div className="flex gap-1 flex-row-reverse text-[9px]">
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        submitRating(ride.id, 'driver', req.passengerId, ratingVal, ratingNote);
                                                        setRatingTripId(null);
                                                        setRatingPassengerId(null);
                                                        setRatingVal(5);
                                                        setRatingNote('');
                                                      }}
                                                      className="bg-amber-500 hover:bg-amber-600 text-black px-2 py-0.5 rounded font-black cursor-pointer transition whitespace-nowrap border-none"
                                                    >
                                                      {t('حفظ', 'Save')}
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setRatingTripId(null);
                                                        setRatingPassengerId(null);
                                                      }}
                                                      className="bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded cursor-pointer transition whitespace-nowrap border-none"
                                                    >
                                                      {t('إلغاء', 'Cancel')}
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setRatingTripId(ride.id);
                                                    setRatingPassengerId(req.passengerId);
                                                    setRatingVal(5);
                                                    setRatingNote('');
                                                  }}
                                                  className="bg-slate-900 hover:bg-amber-500/10 text-amber-500 text-[9px] px-2 py-1 rounded border border-slate-800 transition cursor-pointer text-center block w-full"
                                                >
                                                  {t('تصنيف وتقييم هذا الراكب ⭐', 'Rate This Passenger ⭐')}
                                                </button>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {ride.driverRating && (
                                  <div className="text-[9.5px] text-amber-400/80 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 mt-1 italic text-right">
                                    {t(`تقييم العميل للتوصيلة والجودة: ${ride.driverRating.rating} ★ (${ride.driverRating.note})`, `Customer Rating for ride: ${ride.driverRating.rating} ★ (${ride.driverRating.note})`)}
                                  </div>
                                )}
                              </div>
                            );
                          } else {
                            // Intracity Ride
                            const ride = trip.data;
                            const isPassengerRated = !!ride.driverRated;

                            return (
                              <div key={`intra-${ride.id}-${idx}`} className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col gap-2 text-right relative overflow-hidden transition hover:border-slate-800">
                                <div className="absolute top-0 left-0 bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-br-lg text-[8px] font-bold">
                                  {t('داخل المدينة 🚗', 'Intracity 🚗')}
                                </div>
                                
                                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 flex-row-reverse">
                                  <span className="font-mono">{ride.createdAt ? ride.createdAt.substring(0, 16).replace('T',' ') : t('منتهية', 'Completed')}</span>
                                  <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[8.5px] font-bold">
                                    {t(`أرباح المشوار: +${(ride.price - ride.commission).toFixed(2)} د.أ`, `Net earning: +${(ride.price - ride.commission).toFixed(2)} JOD`)}
                                  </span>
                                </div>

                                <div className="space-y-0.5 my-1">
                                  <div className="text-xs font-bold text-slate-200 flex items-center justify-end gap-1.5 flex-row-reverse">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                    <span>{t('من:', 'From:')} {ride.pickupName}</span>
                                  </div>
                                  <div className="text-xs font-bold text-slate-200 flex items-center justify-end gap-1.5 flex-row-reverse">
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                    <span>{t('إلى:', 'To:')} {ride.dropoffName}</span>
                                  </div>
                                </div>

                                <div className="text-[10px] text-emerald-400 font-sans mt-0.5 font-mono">
                                  {ride.distanceKm} {t('كم', 'km')} | {ride.durationMin} {t('دقيقة', 'min')}
                                </div>

                                {/* Passenger details and rating form */}
                                <div className="bg-slate-900/40 rounded-lg p-2.5 border border-slate-900/80 space-y-1.5 mt-1 text-right">
                                  <div className="text-[10px] text-slate-400 font-bold border-b border-slate-800 pb-1 mb-1 flex justify-between flex-row-reverse">
                                    <span>{t('معلومات الراكب التوصيل المباشر:', 'Direct Passenger Details:')}</span>
                                    <span className="text-emerald-400 font-mono">{(ride.price || 0).toFixed(2)} {t('د.أ', 'JOD')}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-200 flex justify-between flex-row-reverse font-sans">
                                    <span>{ride.passengerName}</span>
                                    <span className="font-mono">{ride.passengerPhone}</span>
                                  </div>

                                  {/* Star Rating status for the Ride */}
                                  <div className="border-t border-slate-900/80 pt-2 mt-1">
                                    {isPassengerRated ? (
                                      <div className="flex items-center gap-1.5 justify-end text-[9.5px] text-amber-400 flex-row-reverse">
                                        <div className="flex">
                                          {Array.from({ length: ride.passengerRatingVal || 5 }).map((_, i) => (
                                            <span key={i}>★</span>
                                          ))}
                                          {Array.from({ length: 5 - (ride.passengerRatingVal || 5) }).map((_, i) => (
                                            <span key={i} className="text-slate-700">★</span>
                                          ))}
                                        </div>
                                        <span className="text-slate-400 font-medium">"{ride.passengerRatingNote || t('راكب رائع', 'Great passenger')}"</span>
                                      </div>
                                    ) : (
                                      <div>
                                        {ratingTripId === ride.id ? (
                                          <div className="space-y-1.5 mt-1">
                                            <div className="flex items-center justify-between flex-row-reverse text-[9.5px]">
                                              <span className="text-slate-400 font-bold">{t('قيّم الراكب:', 'Rate Passenger:')}</span>
                                              <div className="flex gap-1 flex-row-reverse">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                  <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setRatingVal(star)}
                                                    className="text-base transition cursor-pointer"
                                                  >
                                                    <span className={star <= ratingVal ? "text-amber-400" : "text-slate-700"}>★</span>
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                            <div className="flex gap-1 items-center">
                                              <input
                                                type="text"
                                                value={ratingNote}
                                                onChange={e => setRatingNote(e.target.value)}
                                                placeholder={t('أضف ملاحظة أو تسجيل صوتي مباشر...', 'Leave a comment or voice note...')}
                                                className="w-full bg-slate-900 border border-slate-800 text-[10px] p-1.5 rounded outline-none text-right placeholder-slate-655 font-sans focus:border-amber-500"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                                                  if (!SpeechRec) {
                                                    alert(t("متصفحك لا يدعم خاصية تحويل الكلام الصوتي إلى نص مباشرة.", "Your browser does not support speech-to-text translation directly."));
                                                    return;
                                                  }
                                                  const recognition = new SpeechRec();
                                                  recognition.lang = language === 'en' ? 'en-US' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : language === 'tr' ? 'tr-TR' : language === 'de' ? 'de-DE' : language === 'ru' ? 'ru-RU' : language === 'zh' ? 'zh-CN' : language === 'hi' ? 'hi-IN' : language === 'ur' ? 'ur-PK' : 'ar-JO';
                                                  recognition.onstart = () => alert(t("🎙️ جارٍ الاستماع لملاحظتك الصوتية باللغة العربية...", "🎙️ Listening to your voice note in your selected active language..."));
                                                  recognition.onresult = (event: any) => {
                                                    const transcript = event.results[0][0].transcript;
                                                    setRatingNote(prev => prev ? `${prev} ${transcript}` : transcript);
                                                  };
                                                  recognition.onerror = () => alert(t("تعذر التقاط الصوت، يرجى المحاولة مرة أخرى.", "Could not capture voice, please try again."));
                                                  recognition.start();
                                                }}
                                                title="تسجيل ملاحظة صوتية (تحويل الكلام إلى نص)"
                                                className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-400 p-1.5 rounded cursor-pointer transition shrink-0 flex items-center justify-center text-[9px]"
                                              >
                                                🎙️ {t('صوتي', 'Voice')}
                                              </button>
                                            </div>
                                            <div className="flex gap-1 flex-row-reverse text-[9px]">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  rateIntraCityPassenger(ride.id, ratingVal, ratingNote);
                                                  setRatingTripId(null);
                                                  setRatingVal(5);
                                                  setRatingNote('');
                                                }}
                                                className="bg-amber-500 hover:bg-amber-600 text-black px-2 py-0.5 rounded font-black cursor-pointer transition border-none"
                                              >
                                                {t('حفظ', 'Save')}
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setRatingTripId(null);
                                                }}
                                                className="bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded cursor-pointer transition border-none"
                                              >
                                                {t('إلغاء', 'Cancel')}
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setRatingTripId(ride.id);
                                              setRatingVal(5);
                                              setRatingNote('');
                                            }}
                                            className="bg-slate-900 hover:bg-amber-500/10 text-amber-500 text-[9px] px-2 py-1 rounded border border-slate-800 transition cursor-pointer text-center block w-full"
                                          >
                                            {t('تصنيف وتقييم الراكب ⭐', 'Rate Passenger ⭐')}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {ride.passengerRated && (
                                  <div className="text-[9.5px] text-amber-400/80 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 mt-1 italic text-right">
                                    {t(`تقييم العميل للتوصيلة والجودة: ${ride.driverRatingVal} ★ (${ride.driverRatingNote})`, `Customer Rating for ride: ${ride.driverRatingVal} ★ (${ride.driverRatingNote})`)}
                                  </div>
                                )}
                              </div>
                            );
                          }
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}



              {/* ACTIVE CHAT AND ALERTS WITH SYSTEM */}
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col min-h-[380px] font-sans">
                  <h3 className="text-xs font-bold text-slate-200 text-right border-b border-slate-850 pb-1 flex justify-end gap-1 items-center mb-2.5">
                    <span>دردشة كابتن آدم والدعم</span>
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                  </h3>

                  {/* Select Support Mode */}
                  <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-850 mb-3 gap-1 flex-row-reverse">
                    <button
                      type="button"
                      onClick={() => setSupportSubTab('ai')}
                      className={`flex-1 py-1 px-3 rounded-lg text-[10.5px] font-black tracking-wide text-center transition-all flex items-center justify-center gap-1.5 flex-row-reverse ${
                        supportSubTab === 'ai'
                          ? 'bg-amber-500 text-black shadow-md font-extrabold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-black animate-pulse" />
                      <span>🤖 وكيل الدعم الفني الذكي</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSupportSubTab('admin')}
                      className={`flex-1 py-1 px-3 rounded-lg text-[10.5px] font-black tracking-wide text-center transition-all flex items-center justify-center gap-1.5 flex-row-reverse ${
                        supportSubTab === 'admin'
                          ? 'bg-slate-800 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>💬 غرف وقوافل الدعم المباشر</span>
                    </button>
                  </div>

                  {supportSubTab === 'ai' ? (
                    loggedDriver && (
                      <AiSupportChat 
                        userType="driver" 
                        userId={loggedDriver.id} 
                        userName={loggedDriver.fullName} 
                      />
                    )
                  ) : (
                    (() => {
                      const channelId = activeRide ? activeRide.id : 'support_driver';
                      const channelTitle = activeRide ? `محادثة رحلة آدم الجارية (#${activeRide.id.split('_').pop()})` : 'غرفة دعم ومساعدة كابتن آدم المباشر 📞';
                      
                      return (
                        <div className="flex-1 flex flex-col bg-slate-950 rounded-xl overflow-hidden border border-slate-850">
                          {/* Channel title banner */}
                          <div className="bg-slate-900 border-b border-slate-850 px-3 py-1.5 text-right text-[10px] text-amber-400 font-bold font-sans">
                            {channelTitle}
                          </div>

                          {/* AI Active Indicator Banner */}
                          <div className="bg-emerald-950/30 border-b border-slate-900 px-3 py-2 text-right text-[9.5px] text-amber-400 font-medium font-sans flex items-center justify-between flex-row-reverse gap-2">
                            <span className="flex items-center gap-1.5 flex-row-reverse">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>آدم AI Bot نشط ويجيبك تلقائياً 🤖</span>
                            </span>
                            <span className="text-emerald-400 text-[8px] font-mono leading-none font-bold uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              Gemini 3.5 Active
                            </span>
                          </div>

                          <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2.5 h-[240px]">
                            {/* Gemini AI Smart Ride Summary */}
                            {activeRide && (
                              <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3 flex flex-col gap-2 shadow-lg mb-1 animate-fadeIn relative overflow-hidden">
                                <div className="absolute top-0 left-0 bg-emerald-500/10 px-2 py-0.5 rounded-br-lg text-[7px] font-mono text-emerald-400">
                                  AI ASSISTED BRIEFING
                                </div>
                                <div className="flex items-center gap-2 justify-end text-right">
                                  <span className="text-[10px] font-bold text-slate-200">ملخص الرحلة الجاري الذكي (Gemini AI Summary)</span>
                                  <span className="text-xs">🤖</span>
                                </div>
                                {loadingSummary ? (
                                  <div className="flex items-center justify-center gap-2 py-3">
                                    <span className="w-3.5 h-3.5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></span>
                                    <span className="text-[9.5px] text-slate-400">جاري قراءة حالة الرحلة من خادم Gemini...</span>
                                  </div>
                                ) : aiRideSummary ? (
                                  <p className="text-[10px] text-slate-300 leading-relaxed text-right font-sans whitespace-pre-wrap select-all">
                                    {aiRideSummary}
                                  </p>
                                ) : (
                                  <p className="text-[9px] text-slate-500 text-center italic">لا يوجد ملخص متاح حالياً.</p>
                                )}
                              </div>
                            )}

                            {(() => {
                              const filtered = messages.filter(m => m.rideId === channelId);
                              if (filtered.length === 0) {
                                return (
                                  <p className="text-[10px] text-slate-500 text-center italic my-auto leading-relaxed">
                                    {activeRide 
                                      ? 'بدء المحادثة مع الركاب للرحلة الجارية. يرجى التنسيق بدقة قبل الإقلاع.' 
                                      : 'مرحباً بك في دعم آدم للأردن. اكتب أي استفسار أو مشكلة وسيتم مراجعتها فوراً.'}
                                  </p>
                                );
                              }
                              return filtered.map((msg, i) => {
                                const isMine = msg.senderId === loggedDriver.id;
                                return (
                                  <div key={i} className={`flex flex-col max-w-[80%] p-2 rounded shadow-md text-right ${isMine ? 'self-end bg-amber-600 text-black rounded-l-xl rounded-tr-xl' : 'self-start bg-slate-900 text-slate-300 rounded-r-xl rounded-tl-xl'}`}>
                                    <div className="flex items-center justify-between gap-2 text-[8px] opacity-75 flex-row-reverse w-full">
                                      <span>{msg.senderName} ({msg.sender === 'driver' ? 'كابتن' : msg.sender === 'passenger' ? 'راكب' : 'إدارة'}) • {msg.timestamp}</span>
                                      {!isMine && (
                                        <button
                                          type="button"
                                          onClick={() => handleTranslateChatMessage(msg.id || `msg-${i}`, msg.message)}
                                          disabled={translatingChatMsgId === (msg.id || `msg-${i}`)}
                                          className="text-amber-400 hover:text-amber-300 transition font-black flex items-center gap-0.5"
                                        >
                                          {translatingChatMsgId === (msg.id || `msg-${i}`) ? 'جاري الترجمة...' : translatedChatMsgs[msg.id || `msg-${i}`] ? '✓ مترجم' : '✨ ترجمة AI'}
                                        </button>
                                      )}
                                    </div>
                                    <div className="text-xs mt-0.5 select-all leading-normal font-sans">{msg.message}</div>
                                    {translatedChatMsgs[msg.id || `msg-${i}`] && (
                                      <div className="text-[11px] mt-1.5 pt-1.5 border-t border-slate-800 text-amber-300 font-sans italic leading-relaxed text-right animate-fadeIn">
                                        📢 {translatedChatMsgs[msg.id || `msg-${i}`]}
                                      </div>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>

                          {/* Quick Replies Quick Bar */}
                          <div className="px-3 py-2 border-t border-slate-850/60 bg-slate-950/50 flex flex-col gap-1.5">
                            <div className="flex justify-between items-center flex-row-reverse text-[10px] text-slate-400 font-sans">
                              <button 
                                type="button" 
                                onClick={() => setShowQuickReplyInput(!showQuickReplyInput)}
                                className="text-amber-500 hover:text-amber-400 flex items-center gap-1 flex-row-reverse font-bold transition"
                              >
                                <PlusCircle className="w-3 h-3" />
                                <span>إضافة رد مخصص</span>
                              </button>
                              <span className="flex items-center gap-1 flex-row-reverse text-slate-300">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                <span>الردود السريعة الجاهزة (Quick Replies)</span>
                              </span>
                            </div>

                            {showQuickReplyInput && (
                              <div className="flex gap-1.5 mt-1 animate-fadeIn flex-row-reverse">
                                <input
                                  type="text"
                                  placeholder="اكتب الرد السريع الجديد..."
                                  value={newQuickReply}
                                  onChange={e => setNewQuickReply(e.target.value)}
                                  className="bg-slate-900 border border-slate-800 text-[10.5px] text-slate-100 p-1 px-2 rounded-lg flex-1 outline-none text-right placeholder-slate-600"
                                />
                                <button
                                  type="button"
                                  onClick={() => addQuickReply(newQuickReply)}
                                  className="bg-amber-500 hover:bg-amber-600 text-black text-[10.5px] px-2.5 py-1 rounded-lg font-bold transition"
                                >
                                  حفظ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowQuickReplyInput(false)}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10.5px] px-2 py-1 rounded-lg transition"
                                >
                                  إلغاء
                                </button>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-1.5 justify-end mt-1 max-h-[85px] overflow-y-auto pr-0.5 font-sans">
                              {quickReplies.map((reply, idx) => (
                                <div
                                  key={idx}
                                  className="group flex items-center gap-1 bg-slate-900 hover:bg-amber-950/20 border border-slate-800 hover:border-amber-500/30 text-[10px] text-slate-300 hover:text-amber-200 p-1 px-2 rounded-full cursor-pointer transition duration-150 relative"
                                >
                                  <span 
                                    onClick={() => {
                                      if (loggedDriver) {
                                        sendChatMessage(channelId, 'driver', loggedDriver.id, loggedDriver.fullName, reply);
                                      }
                                    }}
                                    className="font-sans font-medium"
                                  >
                                    {reply}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteQuickReply(idx);
                                    }}
                                    className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition opacity-0 group-hover:opacity-100 ml-1"
                                    title="حذف الرد السريع"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!chatText.trim()) return;
                              sendChatMessage(channelId, 'driver', loggedDriver.id, loggedDriver.fullName, chatText);
                              setChatText('');
                            }} 
                            className="border-t border-slate-850 p-2 flex bg-slate-900 gap-1.5"
                          >
                            <button type="submit" className="p-1 px-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-xs flex items-center justify-center">
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="text"
                              value={chatText}
                              onChange={e => setChatText(e.target.value)}
                              placeholder={activeRide ? "تواصل مع الركاب والإدارة..." : "اكتب سؤالك أو استفسارك للدعم..."}
                              className="bg-slate-950 text-xs text-slate-100 p-1.5 px-2 rounded-lg flex-1 outline-none text-right placeholder-slate-650"
                            />
                          </form>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {/* SCHEDULED RIDES MANAGERS */}
              {activeTab === 'scheduled' && travelMode !== 'intracity' && (
                <div className="flex-1 flex flex-col min-h-[380px] font-sans text-right select-none text-slate-100 overflow-y-auto pr-1">
                  
                  {/* Captain AI Fast Matching Portal */}
                  <div className="bg-gradient-to-r from-violet-950/80 via-indigo-950/80 to-slate-900 border border-violet-500/30 p-4 rounded-3xl mb-5 text-right font-sans relative overflow-hidden shadow-2xl">
                    {/* Background Soft Purple Glow */}
                    <div className="absolute top-0 left-0 w-28 h-28 bg-violet-600/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-3xl"></div>

                    <div className="relative z-10 flex flex-col gap-2.5">
                      <div className="flex justify-between items-center flex-row-reverse">
                        <div className="flex items-center gap-1.5 flex-row-reverse">
                          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                          </div>
                          <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-l from-indigo-300 via-purple-300 to-amber-200">
                            مجمع ركاب آدم الذكي فائق السرعة للكباتن ⚡
                          </span>
                        </div>
                        <span className="bg-violet-900/40 border border-violet-500/30 text-[8.5px] font-black font-mono text-purple-300 py-0.5 px-2 rounded-full uppercase tracking-wider">
                          قوة الذكاء الاصطناعي
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                        اكتب خط سير رحلتك اليوم أو غداً بعبارة بسيطة، وسيقوم جيميناي بتجميع وغربلة ركاب متطابقين في ملف تجميع ذكي واحد تقبله بلمسة واحدة لملء المقاعد 4/4 فوراً!
                      </p>

                      {/* Unified Input Form */}
                      <div className="flex gap-1.5 flex-row-reverse mt-1">
                        <input
                          type="text"
                          value={aiDriverText}
                          onChange={e => setAiDriverText(e.target.value)}
                          placeholder="مثال: أنا طالع من عمان لإربد وبدي تجميع ركاب لخط السير..."
                          className="flex-1 bg-slate-950/90 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-slate-100 placeholder-slate-550 focus:border-violet-500/50 outline-none font-sans text-right font-medium shadow-inner"
                        />
                        <button
                          type="button"
                          disabled={aiDriverLoading}
                          onClick={() => handleAiDriverSubmit()}
                          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-550 text-white font-extrabold px-4 py-2 rounded-2xl text-xs flex items-center justify-center gap-1 cursor-pointer transition shadow-md whitespace-nowrap shrink-0 font-sans border-none"
                        >
                          {aiDriverLoading ? "جاري التجميع..." : "تجميع الركاب ✨"}
                        </button>
                      </div>

                      {/* Direct Clickable Shortcuts */}
                      <div className="flex flex-wrap gap-1 items-center justify-start flex-row-reverse mt-1">
                        <span className="text-[9px] text-slate-450 font-bold font-sans">اقتراحات تجميع سريعة:</span>
                        {[
                          "تجميع ركاب لخط عمان ➔ إربد غداً",
                          "بدي ركاب من الزرقاء إلى عمان اليوم العصر",
                          "رحلة من عمان ➔ العقبة يوم السبت صباحاً"
                        ].map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setAiDriverText(s);
                              handleAiDriverSubmit(s);
                            }}
                            className="bg-slate-900 hover:bg-slate-850 hover:border-slate-700 text-[8.5px] text-slate-350 border border-slate-850 px-2.5 py-1 rounded-xl transition duration-150 cursor-pointer font-sans"
                          >
                            ⭐ {s}
                          </button>
                        ))}
                      </div>

                      {/* AI DRIVER MATCH FEEDBACK & BUNDLES */}
                      {aiDriverResult && (
                        <div className="mt-3 bg-slate-950/85 border border-indigo-900/30 rounded-2xl p-3 animate-fade-in text-right">
                          {aiDriverResult.type === 'error' ? (
                            <div className="text-red-400 font-bold text-[10px]">
                              ⚠️ {aiDriverResult.msg}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <p className="text-[10px] text-emerald-400 font-extrabold leading-relaxed">
                                {aiDriverResult.msg}
                              </p>

                              {/* Details Extracted Badge */}
                              <div className="bg-slate-900 p-2 rounded-xl flex flex-wrap gap-2 justify-end flex-row-reverse text-[9.5px] border border-slate-850 font-sans">
                                <span>📍 المغادرة: <strong className="text-slate-100">{aiDriverResult.parsedDetails?.fromGov.split(' ')[0]}</strong></span>
                                <span>➔ الوصول: <strong className="text-slate-100">{aiDriverResult.parsedDetails?.toGov.split(' ')[0]}</strong></span>
                                <span>📅 الموعد المبرز: <strong className="text-indigo-400 font-mono font-bold">{aiDriverResult.parsedDetails?.dateTimeStr.replace('T', ' ')}</strong></span>
                              </div>

                              {aiDriverResult.type === 'group_match' && aiDriverResult.matchedTrips ? (
                                <div className="bg-indigo-950/40 border border-indigo-900/30 p-2.5 rounded-xl flex flex-col gap-2 mt-1 font-sans">
                                  <span className="font-extrabold text-slate-200 text-[10px]">
                                    👥 الركاب المتاحون للتجميع المباشر:
                                  </span>
                                  <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto">
                                    {aiDriverResult.matchedTrips.map((pTrip: any, idx: number) => (
                                      <div key={pTrip.id} className="bg-slate-950 border border-indigo-900/40 p-2 rounded-lg flex justify-between items-center flex-row-reverse text-[9px]">
                                        <div className="text-right">
                                          <span className="text-slate-100 text-xs font-bold block">{pTrip.creatorName || "راكب آدم"}</span>
                                          <span className="text-slate-400 block">نقطة تجمع: {pTrip.fromArea.split(' - ').slice(-1)[0]}</span>
                                        </div>
                                        <span className="text-amber-400 font-extrabold">{pTrip.passengers[0]?.seatsCount || 1} مقاعد</span>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const tripIds = aiDriverResult.matchedTrips!.map(t => t.id);
                                      const res = bulkAcceptScheduledTripsByDriver(tripIds, loggedDriver!.id);
                                      if (res.success) {
                                        setSchSuccessMsg(`✓ كفو كابتن! تم قبول وتجميع ${tripIds.length} ركاب بنجاح بنقرة واحدة فائقة السرعة!`);
                                        alert(res.msg);
                                        setSchTabMode('my_trips');
                                        setAiDriverResult(null);
                                        setAiDriverText('');
                                      } else {
                                        alert(res.msg);
                                      }
                                    }}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-550 text-slate-950 font-black py-2 rounded-xl text-xs transition cursor-pointer font-sans shadow-md border-none"
                                  >
                                    تأكيد قبول وتجميع الركاب الآن بنقرة واحدة 🤝
                                  </button>
                                </div>
                              ) : (
                                <div className="bg-slate-900 p-2.5 rounded-xl flex flex-col gap-1.5 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const details = aiDriverResult.parsedDetails;
                                      if (!details) return;
                                      const fromAddress = `${details.fromGov} - لواء القصبة - وسط البلد`;
                                      const toAddress = `${details.toGov} - لواء القصبة - وسط البلد`;
                                      const res = createDriverScheduledTrip(
                                        loggedDriver!.id,
                                        fromAddress,
                                        toAddress,
                                        details.dateTimeStr.replace('T', ' '),
                                        4
                                      );
                                      if (res.success) {
                                        setSchSuccessMsg(`✓ تم تسجيل ونشر الموعد العام للرحلة بنجاح! الركاب سينضمون فوراً.`);
                                        setSchTabMode('my_trips');
                                        setAiDriverResult(null);
                                        setAiDriverText('');
                                      } else {
                                        alert(res.msg);
                                      }
                                    }}
                                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-550 text-white font-black py-2 rounded-xl text-xs transition cursor-pointer font-sans shadow-lg border-none"
                                  >
                                    تسجيل ونشر موعد رحلة فارغ جديد ليحجزها الركاب 📡
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* MODE SELECTOR */}
                  <div className="flex flex-wrap sm:flex-nowrap bg-slate-900/60 p-1 rounded-xl mb-4 text-xs font-sans border border-slate-800 flex-row-reverse gap-1">
                    <button 
                      type="button"
                      onClick={() => setSchTabMode('daily_pinned')}
                      className={`flex-1 min-w-[85px] py-1.5 rounded-lg text-center font-bold transition text-[10px] ${schTabMode === 'daily_pinned' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-amber-400/80 hover:text-amber-300'}`}
                    >
                      📌 خطوط يومية {(() => {
                        const count = scheduledTrips.filter(t => (t.isPinnedDaily || t.creatorType === 'admin' || t.aiGenerated) && t.status !== 'cancelled' && t.status !== 'completed').length;
                        return count > 0 ? `(${count})` : '';
                      })()}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSchTabMode('my_trips')}
                      className={`flex-1 min-w-[85px] py-1.5 rounded-lg text-center font-bold transition text-[10px] ${schTabMode === 'my_trips' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      مواعيدي {(() => {
                        const count = scheduledTrips.filter(t => t.driverId === loggedDriver?.id).length;
                        return count > 0 ? `(${count})` : '';
                      })()}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSchTabMode('passenger_trips')}
                      className={`flex-1 min-w-[85px] py-1.5 rounded-lg text-center font-bold transition text-[10px] ${schTabMode === 'passenger_trips' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      طلب الركاب {(() => {
                        const count = scheduledTrips.filter(t => 
                          (t.creatorType === 'passenger' && t.status === 'pending') || 
                          (t.creatorType === 'admin' && !t.driverId && t.status === 'pending')
                        ).length;
                        return count > 0 ? `(${count})` : '';
                      })()}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSchTabMode('form')}
                      className={`flex-1 min-w-[85px] py-1.5 rounded-lg text-center font-bold transition text-[10px] ${schTabMode === 'form' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      إضافة موعد
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSchTabMode('calendar_sync')}
                      className={`flex-1 min-w-[85px] py-1.5 rounded-lg text-center font-bold transition text-[10px] ${schTabMode === 'calendar_sync' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      تقويم Google 📅
                    </button>
                  </div>

                  {schSuccessMsg && (
                    <div className="p-2 bg-amber-950/40 border border-amber-900/30 text-[10px] text-amber-400 rounded-lg text-right mb-3">
                      {schSuccessMsg}
                    </div>
                  )}

                  {/* VIEW FORMAT PICKER */}
                  {schTabMode !== 'form' && schTabMode !== 'calendar_sync' && schTabMode !== 'daily_pinned' && (
                    <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl gap-2 flex-row-reverse mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSchViewFormat('list');
                          setCalendarSelectedDate(null);
                        }}
                        className={`flex-1 py-1 text-[10px] rounded-lg font-bold transition flex justify-center items-center gap-1 ${schViewFormat === 'list' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-300'}`}
                      >
                        📋 عرض القائمة
                      </button>
                      <button
                        type="button"
                        onClick={() => setSchViewFormat('calendar')}
                        className={`flex-1 py-1 text-[10px] rounded-lg font-bold transition flex justify-center items-center gap-1 ${schViewFormat === 'calendar' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-300'}`}
                      >
                        📅 تقويم ومواعيد الرحلات
                      </button>
                    </div>
                  )}

                  {/* CALENDAR VIEW SECTION */}
                  {schTabMode !== 'form' && schTabMode !== 'calendar_sync' && schTabMode !== 'daily_pinned' && schViewFormat === 'calendar' && (() => {
                    const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
                    const firstDayIdx = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay(); // Sun=0, Mon=1...
                    
                    const daysArr = [];
                    for (let x = 0; x < firstDayIdx; x++) daysArr.push(null);
                    for (let day = 1; day <= daysInMonth; day++) daysArr.push(day);

                    const monthArName = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'][currentCalendarMonth];
                    const weekDaysAr = ['أح', 'إث', 'ثل', 'رب', 'خم', 'جم', 'سب'];

                    const handlePrevMonth = () => {
                      if (currentCalendarMonth === 0) {
                        setCurrentCalendarMonth(11);
                        setCurrentCalendarYear(p => p - 1);
                      } else {
                        setCurrentCalendarMonth(p => p - 1);
                      }
                    };
                    const handleNextMonth = () => {
                      if (currentCalendarMonth === 11) {
                        setCurrentCalendarMonth(0);
                        setCurrentCalendarYear(p => p + 1);
                      } else {
                        setCurrentCalendarMonth(p => p + 1);
                      }
                    };

                    return (
                      <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl mb-3 flex flex-col gap-3 text-right">
                        {/* Month Header Nav */}
                        <div className="flex justify-between items-center flex-row-reverse border-b border-slate-900 pb-2">
                          <span className="text-[10.5px] font-extrabold text-amber-500 font-sans">{monthArName} {currentCalendarYear}</span>
                          <div className="flex gap-2.5">
                            <button 
                              type="button" 
                              onClick={handlePrevMonth} 
                              className="text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 p-1 rounded-lg transition"
                            >
                              ◀
                            </button>
                            <button 
                              type="button" 
                              onClick={handleNextMonth} 
                              className="text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 p-1 rounded-lg transition"
                            >
                              ▶
                            </button>
                          </div>
                        </div>

                        {/* Weekly days header */}
                        <div className="grid grid-cols-7 text-center border-b border-slate-900 pb-1.5 flex-row-reverse">
                          {weekDaysAr.map((wd, i) => (
                            <span key={i} className="text-[8.5px] font-bold text-slate-500">{wd}</span>
                          ))}
                        </div>

                        {/* Calendar Grid cells */}
                        <div className="grid grid-cols-7 text-center gap-1.5 flex-row-reverse">
                          {daysArr.map((day, idx) => {
                            if (day === null) {
                              return <div key={`empty-${idx}`} className="h-6"></div>;
                            }

                            const formattedDate = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isSelected = calendarSelectedDate === formattedDate;
                            
                            // Check if there are active scheduled trips on this day in our list
                            const tripsOnDay = scheduledTrips.filter(t => {
                              const matchesCreatorOrPassenger = t.driverId === loggedDriver?.id;
                              const matchesOtherFilters = 
                                (t.creatorType === 'passenger' && t.status === 'pending') || 
                                (t.creatorType === 'admin' && !t.driverId && t.status === 'pending');
                              const isTargetMode = schTabMode === 'my_trips' ? matchesCreatorOrPassenger : matchesOtherFilters;
                              return isTargetMode && t.departureTime.startsWith(formattedDate);
                            });

                            return (
                              <button
                                key={`day-${day}`}
                                type="button"
                                onClick={() => setCalendarSelectedDate(isSelected ? null : formattedDate)}
                                className={`h-6 text-[9.5px] font-mono rounded-lg transition flex flex-col justify-center items-center relative cursor-pointer ${
                                  isSelected 
                                    ? 'bg-amber-500 text-slate-950 font-black shadow-md' 
                                    : 'hover:bg-slate-800 text-slate-300'
                                }`}
                              >
                                <span>{day}</span>
                                {tripsOnDay.length > 0 && (
                                  <span className={`w-1 h-1 rounded-full absolute bottom-0.5 ${isSelected ? 'bg-slate-950' : 'bg-amber-500'}`}></span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Calendar filter clear indicator */}
                        {calendarSelectedDate && (
                          <div className="flex justify-between items-center bg-slate-900/40 border border-slate-850 p-2 rounded-xl mt-1 flex-row-reverse">
                            <span className="text-[9px] text-amber-400 font-medium font-sans">📅 تم تصفية اليوم: <strong className="font-mono text-white">{calendarSelectedDate}</strong></span>
                            <button
                              type="button"
                              onClick={() => setCalendarSelectedDate(null)}
                              className="text-[9px] text-red-400 font-bold hover:underline"
                            >
                              إلغاء التصفية ✖
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Filters System for Driver Scheduled Tabs */}
                  {schTabMode !== 'form' && schTabMode !== 'calendar_sync' && (
                    !isFilterExpanded ? (
                      /* Collapsed Search & Filter Bar */
                      <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl mb-3 flex flex-col gap-2 shadow-lg">
                        <div className="flex justify-between items-center flex-row-reverse gap-2">
                          <div className="flex items-center gap-1.5 flex-row-reverse">
                            <span className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[13px] text-amber-500">🔍</span>
                            <div className="flex flex-col text-right">
                              <span className="text-[10px] font-bold text-slate-200">تصفية وبحث الرحلات المجدولة</span>
                              <span className="text-[8px] text-slate-400 font-sans">
                                {filterGov || filterDist || filterDateFrom || filterDateTo || filterTime || filterAvailableOnly ? (
                                  <span className="text-amber-400 font-bold">
                                    نشط: {[
                                      filterGov && `📍 ${filterGov}`,
                                      filterDist && `🔸 ${filterDist}`,
                                      (filterDateFrom || filterDateTo) && `📅 مخصصة`,
                                      filterTime && `⏰ ${filterTime === 'morning' ? 'صباحاً' : filterTime === 'afternoon' ? 'ظهراً' : filterTime === 'evening' ? 'مساءً' : filterTime + ':00'}`,
                                      filterAvailableOnly && `🟢 المتاحة فقط`
                                    ].filter(Boolean).join(' • ')}
                                  </span>
                                ) : (
                                  "عرض جميع الرحلات دون تصفية"
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-1">
                            {(filterGov || filterDist || filterDateFrom || filterDateTo || filterTime || filterAvailableOnly) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterGov('');
                                  setFilterDist('');
                                  setFilterDateFrom('');
                                  setFilterDateTo('');
                                  setFilterTime('');
                                  setFilterAvailableOnly(false);
                                }}
                                className="px-2 py-1 bg-red-950/40 text-red-400 border border-red-900/30 text-[8.5px] rounded-lg font-bold hover:bg-red-900/20 transition cursor-pointer"
                              >
                                إعادة تعيين ✖
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setIsFilterExpanded(true)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white text-[8.5px] rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              ⚙️ تصفية متقدمة
                            </button>
                          </div>
                        </div>

                        {/* Horizontal Smart Preset Pills */}
                        <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none flex-row-reverse text-right mt-1 border-t border-slate-900/50 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFilterGov('');
                              setFilterDist('');
                              setFilterDateFrom('');
                              setFilterDateTo('');
                              setFilterTime('');
                              setFilterAvailableOnly(false);
                            }}
                            className={`px-2.5 py-1 text-[8.5px] font-bold rounded-full border transition whitespace-nowrap cursor-pointer ${
                              !filterGov && !filterDist && !filterDateFrom && !filterDateTo && !filterTime && !filterAvailableOnly
                                ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm"
                                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300"
                            }`}
                          >
                            🌟 الكل
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const todayStr = new Date().toISOString().split('T')[0];
                              setFilterDateFrom(todayStr);
                              setFilterDateTo(todayStr);
                              setFilterTime('morning');
                            }}
                            className={`px-2.5 py-1 text-[8.5px] font-bold rounded-full border transition whitespace-nowrap cursor-pointer ${
                              filterDateFrom === new Date().toISOString().split('T')[0] && filterTime === 'morning'
                                ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm"
                                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300"
                            }`}
                          >
                            🌅 اليوم صباحاً
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const todayStr = new Date().toISOString().split('T')[0];
                              setFilterDateFrom(todayStr);
                              setFilterDateTo(todayStr);
                              setFilterTime('afternoon');
                            }}
                            className={`px-2.5 py-1 text-[8.5px] font-bold rounded-full border transition whitespace-nowrap cursor-pointer ${
                              filterDateFrom === new Date().toISOString().split('T')[0] && filterTime === 'afternoon'
                                ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm"
                                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300"
                            }`}
                          >
                            ☀️ اليوم ظهراً
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const tom = new Date();
                              tom.setDate(tom.getDate() + 1);
                              const tomStr = tom.toISOString().split('T')[0];
                              setFilterDateFrom(tomStr);
                              setFilterDateTo(tomStr);
                              setFilterTime('');
                            }}
                            className={`px-2.5 py-1 text-[8.5px] font-bold rounded-full border transition whitespace-nowrap cursor-pointer ${
                              filterDateFrom === new Date(Date.now() + 86400000).toISOString().split('T')[0] && !filterTime
                                ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm"
                                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300"
                            }`}
                          >
                            📅 غداً
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFilterAvailableOnly(!filterAvailableOnly);
                            }}
                            className={`px-2.5 py-1 text-[8.5px] font-bold rounded-full border transition whitespace-nowrap cursor-pointer ${
                              filterAvailableOnly
                                ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300"
                            }`}
                          >
                            🟢 الشواغر المتاحة
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Expanded Search & Filter panel */
                      <div className="bg-slate-950 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)] p-3.5 rounded-2xl mb-3 flex flex-col gap-3 text-right">
                        {/* Title & Collapse button */}
                        <div className="flex justify-between items-center flex-row-reverse border-b border-slate-900 pb-2">
                          <div className="flex items-center gap-1.5 flex-row-reverse">
                            <span className="text-[13px]">⚙️</span>
                            <span className="text-[10px] font-black text-amber-400">تخصيص بحث المواعيد المتقدم</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsFilterExpanded(false)}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white text-[8.5px] rounded-lg font-bold transition flex items-center gap-0.5 cursor-pointer"
                          >
                            ✖ إغلاق التصفية
                          </button>
                        </div>

                        {/* Section 1: Geographic Scope */}
                        <div className="bg-slate-900/30 border border-slate-900 p-2 rounded-xl flex flex-col gap-2">
                          <span className="text-[8.5px] text-amber-500/80 font-bold flex items-center gap-1 flex-row-reverse">
                            <span>📍 النطاق الجغرافي:</span>
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-right">
                            {/* Governorate */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] text-slate-400">المحافظة</span>
                              <select
                                value={filterGov}
                                onChange={e => { setFilterGov(e.target.value); setFilterDist(''); }}
                                className="bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-[9.5px] text-slate-100 text-right outline-none cursor-pointer hover:border-amber-500/30 transition"
                              >
                                <option value="">الكل (جميع المحافظات)</option>
                                {settings.locations.map((loc, i) => (
                                  <option key={i} value={loc.governorate}>{loc.governorate}</option>
                                ))}
                              </select>
                            </div>
                            {/* District */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] text-slate-400">اللواء</span>
                              <select
                                value={filterDist}
                                disabled={!filterGov}
                                onChange={e => setFilterDist(e.target.value)}
                                className="bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-[9.5px] text-slate-100 text-right outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:border-amber-500/30 transition"
                              >
                                <option value="">الكل (جميع الألوية)</option>
                                {((settings?.locations || DEFAULT_LOCATIONS).find(l => l.governorate === filterGov)?.districts || []).map((dist, i) => (
                                  <option key={i} value={dist.name}>{dist.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Timeframe & Dates */}
                        <div className="bg-slate-900/30 border border-slate-900 p-2 rounded-xl flex flex-col gap-2">
                          <span className="text-[8.5px] text-amber-500/80 font-bold flex items-center gap-1 flex-row-reverse">
                            <span>📅 التوقيت والمواعيد:</span>
                          </span>
                          <div className="grid grid-cols-3 gap-2 text-right font-sans">
                            {/* Date From */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] text-slate-400 font-sans">من تاريخ</span>
                              <input
                                type="date"
                                value={filterDateFrom}
                                onChange={e => setFilterDateFrom(e.target.value)}
                                className="bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-[9.5px] text-slate-100 text-right outline-none font-mono hover:border-amber-500/30 transition"
                              />
                            </div>
                            {/* Date To */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] text-slate-400 font-sans">إلى تاريخ</span>
                              <input
                                type="date"
                                value={filterDateTo}
                                onChange={e => setFilterDateTo(e.target.value)}
                                className="bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-[9.5px] text-slate-100 text-right outline-none font-mono hover:border-amber-500/30 transition"
                              />
                            </div>
                            {/* Time / Hour */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] text-slate-400">فترة المغادرة</span>
                              <select
                                value={filterTime}
                                onChange={e => setFilterTime(e.target.value)}
                                className="bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-[9.5px] text-slate-100 text-right outline-none cursor-pointer hover:border-amber-500/30 transition"
                              >
                                <option value="">الكل (أي وقت)</option>
                                <option value="morning">🌅 صباحاً (06:00 - 12:00)</option>
                                <option value="afternoon">☀️ ظهراً (12:00 - 17:00)</option>
                                <option value="evening">🌃 مساءً (17:00 - 24:00)</option>
                                <optgroup label="ساعة محددة">
                                  <option value="05">05:00 ص</option>
                                  <option value="06">06:00 ص</option>
                                  <option value="07">07:00 ص</option>
                                  <option value="08">08:00 ص</option>
                                  <option value="09">09:00 ص</option>
                                  <option value="10">10:00 ص</option>
                                  <option value="11">11:00 ص</option>
                                  <option value="12">12:00 م</option>
                                  <option value="13">01:00 م</option>
                                  <option value="14">02:00 م</option>
                                  <option value="15">03:00 م</option>
                                  <option value="16">04:00 م</option>
                                  <option value="17">05:00 م</option>
                                  <option value="18">06:00 م</option>
                                  <option value="19">07:00 م</option>
                                  <option value="20">08:00 م</option>
                                  <option value="21">09:00 م</option>
                                  <option value="22">10:00 م</option>
                                  <option value="23">11:00 م</option>
                                </optgroup>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Bottom controls & toggle */}
                        <div className="flex justify-between items-center mt-1 pt-2 border-t border-slate-900/50 flex-row-reverse">
                          {/* Available Only toggle */}
                          <button
                            type="button"
                            onClick={() => setFilterAvailableOnly(!filterAvailableOnly)}
                            className={`px-3 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[8.5px] rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                              filterAvailableOnly ? "text-emerald-400 border-emerald-500/25 bg-emerald-950/20" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            <span>{filterAvailableOnly ? "✓ إظهار المتاحة فقط مفعل" : "إظهار الرحلات المتاحة فقط"}</span>
                          </button>
                          
                          <div className="flex gap-1.5">
                            {(filterGov || filterDist || filterDateFrom || filterDateTo || filterTime || filterAvailableOnly) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterGov('');
                                  setFilterDist('');
                                  setFilterDateFrom('');
                                  setFilterDateTo('');
                                  setFilterTime('');
                                  setFilterAvailableOnly(false);
                                }}
                                className="px-2.5 py-1 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-950/30 text-[8.5px] rounded-lg font-bold transition cursor-pointer"
                              >
                                تفريغ التصفية
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setIsFilterExpanded(false)}
                              className="px-3 py-1 bg-amber-500 text-slate-950 text-[8.5px] rounded-lg font-black transition cursor-pointer hover:bg-amber-600 shadow-md"
                            >
                              تطبيق البحث 🔍
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  {/* MODE 1: CAPTAIN ADVERTISED TRIP FORM */}
                  {schTabMode === 'form' && (
                    <div className="flex flex-col gap-3">
                      <TripScheduler 
                        onSuccess={(msg) => {
                          setSchSuccessMsg(msg);
                          setSchTabMode('my_trips');
                        }}
                      />
                    </div>
                  )}










                  {schTabMode === 'passenger_trips' && (
                    <div className="flex flex-col gap-3">

                      {/* 🧭 GEOGRAPHICAL ROUTING RADAR (رادار التوجيه الجغرافي الذكي) */}
                      {(() => {
                        // 1. Auto-detect Captain's schedule outbound trips matching "accepted" or custom pending ones with passengers
                        const captainOutboundTrips = scheduledTrips.filter(t => 
                          t.driverId === loggedDriver?.id && 
                          (t.status === 'accepted' || t.status === 'pending') && 
                          t.passengers.length > 0
                        );

                        // Determine current outbound and return cities
                        let activeOutboundSelected = '';
                        let activeReturnSelected = '';
                        let detectedTrip = null;

                        if (captainOutboundTrips.length > 0) {
                          // Take the first active trip as reference
                          detectedTrip = captainOutboundTrips[0];
                          activeOutboundSelected = detectedTrip.toArea.split(' - ')[0] || '';
                          activeReturnSelected = detectedTrip.fromArea.split(' - ')[0] || '';
                        }

                        // Use manual inputs if manually toggled, otherwise use auto-detected
                        const outboundGov = geoManualMode ? geoOutboundGov : activeOutboundSelected;
                        const returnGov = geoManualMode ? geoReturnGov : activeReturnSelected;

                        // Filter matching return path passenger requests
                        const returnPathRequests = scheduledTrips.filter(t => {
                          if ((t.creatorType !== 'passenger' && !(t.creatorType === 'admin' && !t.driverId)) || t.status !== 'pending') return false;
                          
                          // Convert governorates to clean names for comparison
                          const tripFromClean = (t.fromArea || '').split(' - ')[0].trim().split(' ')[0];
                          const tripToClean = (t.toArea || '').split(' - ')[0].trim().split(' ')[0];
                          
                          const targetFromClean = (outboundGov || '').trim().split(' ')[0];
                          const targetToClean = (returnGov || '').trim().split(' ')[0];

                          if (!targetFromClean || !targetToClean) return false;

                          // The return trip must depart from the captain's destination (outboundGov) and head to returnGov
                          return tripFromClean.includes(targetFromClean) && tripToClean.includes(targetToClean);
                        });

                        return (
                          <div className="bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-950 border border-violet-500/40 p-4 rounded-3xl text-right font-sans relative overflow-hidden shadow-2xl">
                            {/* Radial Animated Glow Effect */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="absolute bottom-[-10px] left-[-10px] w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

                            {/* Concentric Pulsing Radar Rings */}
                            <div className="absolute top-4 left-4 flex items-center justify-center pointer-events-none">
                              <span className="absolute inline-flex h-4 w-4 rounded-full bg-indigo-400 opacity-75 animate-ping"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                            </div>

                            <div className="relative z-10 flex flex-col gap-3">
                              {/* Header */}
                              <div className="flex justify-between items-center flex-row-reverse pb-1.5 border-b border-indigo-900/40 pl-6">
                                <div className="flex items-center gap-1.5 flex-row-reverse">
                                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <Compass className="w-4 h-4 text-violet-400" />
                                  </div>
                                  <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-l from-indigo-200 via-violet-200 to-emerald-300">
                                    رادار التوجيه الجغرافي 🧭 (طريق العودة)
                                  </span>
                                </div>
                                <span className="bg-emerald-950/50 border border-emerald-500/30 text-[8px] font-black text-emerald-400 py-0.5 px-2 rounded-full uppercase">
                                  منع العودة فارغاً 🏎️
                                </span>
                              </div>

                              <p className="text-[10px] text-slate-300 leading-relaxed">
                                يفحص النظام تلقائياً رحلات الذهاب المقررة لك، ويقترح فوراً طلبات ركاب متوافقة مع وجهتك النهائية لتبنيها بلمسة واحدة والتأكد من جني أرباح كاملة ذهاباً وإياباً دون إهدار أموالك ومحروقاتك!
                              </p>

                              {/* Toggle Options: Auto Tracker vs Manual Override */}
                              <div className="flex items-center justify-between bg-slate-950/75 p-2 rounded-2xl border border-slate-900 flex-row-reverse shadow-inner">
                                <div className="text-right">
                                  <span className="text-[9.5px] font-extrabold text-slate-100 block">
                                    وضع التتبع الجغرافي للرادار
                                  </span>
                                  <span className="text-[8px] text-slate-500 block">
                                    {geoManualMode 
                                      ? "استخدام تحديد يدوي لخط الظهرات" 
                                      : "التقاط آلي مستمر من رحلات الذهاب المسجلة"
                                    }
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setGeoManualMode(!geoManualMode)}
                                  className={`px-2.5 py-1 rounded-xl text-[8.5px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                    geoManualMode 
                                      ? "bg-purple-600 text-white font-extrabold border-none" 
                                      : "bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800"
                                  }`}
                                >
                                  {geoManualMode ? "🔄 التغيير للآلي" : "⚙️ تعديل يدوي"}
                                </button>
                              </div>

                              {/* Mode Display Component */}
                              {!geoManualMode ? (
                                <div className="bg-slate-950/40 border border-indigo-950/60 p-2.5 rounded-2xl text-[10px] text-right font-sans">
                                  {detectedTrip ? (
                                    <div className="flex flex-col gap-1.5">
                                      <div className="flex justify-between items-center flex-row-reverse">
                                        <span className="text-slate-400 text-[9px]">✅ رصد رحلة ذهاب نشطة لك:</span>
                                        <span className="text-[8.5px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded font-black">نشط ومؤكد</span>
                                      </div>
                                      <div className="flex items-center justify-between flex-row-reverse bg-slate-900/60 p-2 rounded-xl border border-slate-850">
                                        <div className="text-right">
                                          <span className="text-slate-200 font-extrabold block text-xs">
                                            {activeReturnSelected.split(' ')[0]} ➡️ {activeOutboundSelected.split(' ')[0]}
                                          </span>
                                          <span className="text-slate-500 text-[8px] block mt-0.5">موعد الإقلاع: {detectedTrip.departureTime}</span>
                                        </div>
                                        <div className="text-left">
                                          <span className="text-[8.5px] text-slate-400 block font-sans">الوجهة المستهدفة بالرادار:</span>
                                          <span className="text-emerald-400 font-extrabold font-sans text-[11px]">{activeOutboundSelected.split(' ')[0]}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center py-2.5 flex flex-col items-center gap-1">
                                      <span className="text-amber-500 font-bold block text-[10.5px]">⚠️ لا توجد رحلة ذهاب مؤكدة لك حالياً لمسافات طويلة</span>
                                      <p className="text-[8.5px] text-slate-500 leading-normal max-w-[260px] mx-auto">
                                        لأغراض الفحص، يمكنك تفعيل "تعديل يدوي" لتحديد البلد الذي ترغب بالذهاب إليه والعودة منه لرؤية التوجيه الجغرافي الفوري فوراً!
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="bg-slate-950/60 border border-purple-500/10 p-2.5 rounded-2xl flex flex-col gap-2">
                                  <div className="grid grid-cols-2 gap-2 text-right">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[8px] text-slate-400">📍 وجهة الذهاب (الوصول تاليًا):</span>
                                      <select
                                        value={geoOutboundGov}
                                        onChange={(e) => setGeoOutboundGov(e.target.value)}
                                        className="bg-slate-900 border border-slate-800 rounded-lg p-1 text-[10px] text-slate-200 outline-none text-right font-sans"
                                      >
                                        <option value="">-- اختر الوجهة --</option>
                                        {settings.locations.map((loc, idx) => (
                                          <option key={idx} value={loc.governorate}>{loc.governorate.split(' (')[0]}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[8px] text-slate-400">نقطة العودة (البيت/البداية):</span>
                                      <select
                                        value={geoReturnGov}
                                        onChange={(e) => setGeoReturnGov(e.target.value)}
                                        className="bg-slate-900 border border-slate-800 rounded-lg p-1 text-[10px] text-slate-200 outline-none text-right font-sans"
                                      >
                                        <option value="">-- اختر نقطة البدء --</option>
                                        {settings.locations.map((loc, idx) => (
                                          <option key={idx} value={loc.governorate}>{loc.governorate.split(' (')[0]}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* AI SMART MATCH RADAR COMPONENT */}
                      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 border border-indigo-500/25 p-3.5 rounded-2xl text-right font-sans relative overflow-hidden shadow-xl">
                        <div className="absolute top-[-15px] left-[-15px] w-14 h-14 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
                        
                        <div className="flex justify-between items-center flex-row-reverse mb-2">
                          <span className="text-[10.5px] font-black text-indigo-300 flex items-center gap-1">
                            ✨ رادار المطابقة الذكي التجميعي بالذكاء الاصطناعي (AI Radar)
                          </span>
                          <span className="text-[7.5px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded-md font-bold font-mono">طابوقة الرحلات</span>
                        </div>
                        
                        <p className="text-[8.5px] text-slate-300 leading-normal mb-3">
                          حدد اتجاهك المخطط وتاريخ سفرك، وسيقوم الرادار بدمج وتجميع كافة طلبات الركاب الفردية المتوافقة تلقائياً في رحلة تشاركية واحدة عالية الأرباح بنقرة واحدة!
                        </p>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {/* Route Filter */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[8px] text-slate-400">🏁 خط السير المطلوب تصفيته:</span>
                            <select
                              value={radarRouteFilter}
                              onChange={(e) => setRadarRouteFilter(e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded-lg p-1 text-[10px] text-slate-200 outline-none cursor-pointer text-right font-sans"
                            >
                              <option value="">كل الخطوط</option>
                              {settings.locations.map((loc, idx) => (
                                <option key={idx} value={loc.governorate}>{loc.governorate.split(' (')[0]}</option>
                              ))}
                            </select>
                          </div>

                          {/* Date Filter */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[8px] text-slate-400">📅 تاريخ الفلترة:</span>
                            <select
                              value={radarDateFilter}
                              onChange={(e) => setRadarDateFilter(e.target.value as any)}
                              className="bg-slate-950 border border-slate-850 rounded-lg p-1 text-[10px] text-slate-200 outline-none cursor-pointer text-right font-sans"
                            >
                              <option value="all">كل الأيام</option>
                              <option value="today">اليوم فقط</option>
                              <option value="tomorrow">غداً فقط</option>
                            </select>
                          </div>
                        </div>

                        {/* RENDER POOLED AI SUGGESTED PACKAGES */}
                        {(() => {
                          const todayStr = new Date().toISOString().substring(0, 10);
                          const tom = new Date();
                          tom.setDate(tom.getDate() + 1);
                          const tomStr = tom.toISOString().substring(0, 10);

                          const eligibleTrips = scheduledTrips.filter(t => 
                            (t.creatorType === 'passenger' && t.status === 'pending') || 
                            (t.creatorType === 'admin' && !t.driverId && t.status === 'pending')
                          );

                          const filtered = applyUnifiedFilters(eligibleTrips).filter(t => {
                            const tripDate = t.departureTime.substring(0, 10);
                            if (radarDateFilter === 'today' && tripDate !== todayStr) return false;
                            if (radarDateFilter === 'tomorrow' && tripDate !== tomStr) return false;
                            
                            if (radarRouteFilter) {
                              const routeName = radarRouteFilter.split(' (')[0];
                              const fromGovName = t.fromArea.split(' - ')[0] || '';
                              const toGovName = t.toArea.split(' - ')[0] || '';
                              if (!fromGovName.includes(routeName) && !toGovName.includes(routeName)) return false;
                            }
                            return true;
                          });

                          if (filtered.length === 0) {
                            return (
                              <div className="text-center italic text-slate-500 text-[9px] py-4 bg-slate-955/20 rounded-xl border border-slate-900">
                                لا توجد حزم مجمعة مقترحة للخط المحدد حالياً.
                              </div>
                            );
                          }

                          const packagesMap: { [key: string]: typeof scheduledTrips } = {};
                          filtered.forEach(trip => {
                            const fromGov = trip.fromArea.split(' - ')[0];
                            const toGov = trip.toArea.split(' - ')[0];
                            const tripDate = trip.departureTime.substring(0, 10);
                            const key = `${fromGov}_${toGov}_${tripDate}`;
                            if (!packagesMap[key]) {
                              packagesMap[key] = [];
                            }
                            packagesMap[key].push(trip);
                          });

                          return (
                            <div className="flex flex-col gap-3.5 mb-4 max-h-[300px] overflow-y-auto pr-1">
                              {Object.entries(packagesMap).map(([key, groupRides], gIdx) => {
                                const [fromGov, toGov] = key.split('_');
                                let runningSeats = 0;
                                const constituentRides: typeof scheduledTrips = [];
                                groupRides.forEach(r => {
                                  if (runningSeats + r.seatsCount <= 4) {
                                    constituentRides.push(r);
                                    runningSeats += r.seatsCount;
                                  }
                                });

                                if (constituentRides.length === 0) return null;

                                const rideIds = constituentRides.map(r => r.id);
                                const totalFare = constituentRides.reduce((sum, r) => sum + r.fare, 0);
                                
                                const baseDistanceKm = 110; 
                                const fuelPricePerLiter = 0.95;
                                const fuelEfficiency = 10; 
                                const tripFuelCost = (baseDistanceKm / fuelEfficiency) * fuelPricePerLiter;
                                const platformCommission = totalFare * 0.10;
                                const expectedNetProfit = totalFare - tripFuelCost - platformCommission;

                                return (
                                  <div key={gIdx} className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-2 relative">
                                    <div className="absolute top-2.5 left-2.5 bg-indigo-500/10 border border-indigo-400/20 rounded-md px-1.5 py-0.5 text-[8.5px] font-black text-indigo-300">
                                      رقم الحزمة: #{gIdx + 1}
                                    </div>

                                    <div className="text-[10px] font-bold text-slate-200">
                                      📦 حزمة {constituentRides.length} مشاوير ركاب متوافقة جغرافياً
                                    </div>

                                    <div className="text-[8.5px] text-slate-400 flex flex-col gap-1">
                                      <div className="flex justify-between flex-row-reverse">
                                        <span>📍 مسار الحزمة التشاركي المدمج:</span>
                                        <span className="font-extrabold text-indigo-300">{fromGov} ← {toGov}</span>
                                      </div>
                                      <div className="flex justify-between flex-row-reverse">
                                        <span>👥 المقاعد المحجوزة بالحزمة:</span>
                                        <span className="font-bold text-amber-400">{runningSeats} مقاعد من أصل 4</span>
                                      </div>
                                      <div className="flex justify-between flex-row-reverse">
                                        <span>📍 الركاب المشمولين في الحزمة:</span>
                                        <span className="font-bold text-slate-200">
                                          {constituentRides.map(r => `${r.creatorName} (${r.seatsCount}مقعد)`).join(' + ')}
                                        </span>
                                      </div>
                                      <div className="flex justify-between flex-row-reverse">
                                        <span>🕓 التوقيت المقترح التقريبي:</span>
                                        <span className="font-mono text-indigo-300">{constituentRides[0].departureTime}</span>
                                      </div>
                                    </div>

                                    <div className="bg-slate-900/70 p-2 rounded-lg flex justify-between items-center flex-row-reverse border border-slate-850 mb-2">
                                      <div className="text-right">
                                        <span className="text-[7.5px] text-slate-500 block">العائد الإجمالي من الركاب:</span>
                                        <span className="text-[10px] font-bold text-slate-300 leading-none">{totalFare.toFixed(2)} د.أ</span>
                                      </div>
                                      <div className="text-left">
                                        <span className="text-[7.5px] text-emerald-500 block font-black">أرباحك الصافية المتوقعة 💰:</span>
                                        <span className="text-[12px] font-extrabold text-emerald-400 leading-none font-mono">{expectedNetProfit.toFixed(2)} د.أ</span>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm(`هل تؤكد رغبتك في تبني وقبول هذه الحزمة المجمعة المكونة من ${constituentRides.length} ركاب والالتزام بتوصيلهم معاً؟`)) {
                                          const res = bulkAcceptScheduledTripsByDriver(rideIds, loggedDriver!.id);
                                          if (res.success) {
                                            setSchSuccessMsg(res.msg);
                                            setSchTabMode('my_trips');
                                          } else {
                                            alert(res.msg);
                                          }
                                        }
                                      }}
                                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-1.5 rounded-xl cursor-pointer transition text-center shadow-lg hover:scale-[1.01] active:scale-[0.99] text-[9.5px]"
                                    >
                                      قبول وتأكيد تجميع الركاب بنقرة واحدة 🤝
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}

                        {/* RAW INDIVIDUAL TRIPS DISPLAY TOGGLE */}
                        <div className="mt-1 bg-slate-900/30 border border-slate-850 rounded-xl p-2.5 flex justify-between items-center flex-row-reverse text-right">
                          <div>
                            <span className="text-[9.5px] font-bold text-slate-300 block">عرض طلبات السفر الفردية الخام</span>
                            <span className="text-[8px] text-slate-500 block">يمكنك تفعيل هذا الخيار لرؤية الطلبات معزولة فرداً بفرداً وقبولها يدوياً</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowRadarRawRides(!showRadarRawRides)}
                            className={`px-3 py-1 rounded-lg text-[8.5px] font-bold transition flex items-center gap-1 cursor-pointer ${
                              showRadarRawRides 
                                ? "bg-amber-500 text-slate-950" 
                                : "bg-slate-950 text-slate-400 border border-slate-800"
                            }`}
                          >
                            {showRadarRawRides ? "🟢 مفعل (الطلبات الفردية)" : "🔴 معطل (الطلبات الفردية)"}
                          </button>
                        </div>

                        {/* RAW INDIVIDUAL TRIPS LISTING */}
                        {showRadarRawRides && (
                          <div className="flex flex-col gap-2.5 mt-2">
                            {(() => {
                              const todayStr = new Date().toISOString().substring(0, 10);
                              const tom = new Date();
                              tom.setDate(tom.getDate() + 1);
                              const tomStr = tom.toISOString().substring(0, 10);

                              const eligibleTrips = scheduledTrips.filter(t => 
                                (t.creatorType === 'passenger' && t.status === 'pending') || 
                                (t.creatorType === 'admin' && !t.driverId && t.status === 'pending')
                              );

                              const filtered = applyUnifiedFilters(eligibleTrips).filter(t => {
                                const tripDate = t.departureTime.substring(0, 10);
                                if (radarDateFilter === 'today' && tripDate !== todayStr) return false;
                                if (radarDateFilter === 'tomorrow' && tripDate !== tomStr) return false;
                                
                                if (radarRouteFilter) {
                                  const routeName = radarRouteFilter.split(' (')[0];
                                  const fromGovName = t.fromArea.split(' - ')[0] || '';
                                  const toGovName = t.toArea.split(' - ')[0] || '';
                                  if (!fromGovName.includes(routeName) && !toGovName.includes(routeName)) return false;
                                }
                                return true;
                              });

                              if (filtered.length === 0) {
                                return (
                                  <div className="text-center italic text-slate-500 text-[9px] py-4 bg-slate-955/20 rounded-xl border border-slate-900">
                                    لا توجد طلبات فردية تلبي الفلاتر المطابقة حالياً.
                                  </div>
                                );
                              }

                              return filtered.map(trip => (
                                <div key={trip.id} className="bg-slate-900 border border-slate-850 rounded-2xl p-3 flex flex-col gap-2 text-right">
                                  <div className="flex justify-between items-center border-b border-slate-800/60 pb-1.5 flex-row-reverse">
                                    <div>
                                      <span className="text-[10px] font-extrabold text-slate-200 block font-sans">طلب سفر من الراكب</span>
                                      <span className="text-[8px] text-slate-500 font-mono mt-0.5 block">معرف: #{trip.id.split('_').pop()}</span>
                                    </div>
                                    <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded text-[8.5px] font-bold">بانتظار كابتن</span>
                                  </div>
                                  <div className="text-[9px] text-slate-300 space-y-1 font-sans">
                                    <div><strong>الراكب:</strong> {trip.creatorName}</div>
                                    <div><strong>من:</strong> {trip.fromArea}</div>
                                    <div><strong>إلى:</strong> {trip.toArea}</div>
                                    <div><strong>موعد المغادرة:</strong> <span className="font-mono text-indigo-300">{trip.departureTime}</span></div>
                                    <div><strong>المقاعد المطلوبة:</strong> {trip.seatsCount} مقاعد</div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isIntercityTrip(trip)) {
                                        setConfirmingScheduledTrip(trip);
                                      } else {
                                        if (window.confirm(`هل تؤكد رغبتك في قبول طلب الراكب ${trip.creatorName} والالتزام بتوصيله؟`)) {
                                          const res = acceptScheduledTripByDriver(trip.id, loggedDriver!.id);
                                          if (res.success) {
                                            setSchSuccessMsg(res.msg);
                                            setSchTabMode('my_trips');
                                          } else {
                                            alert(res.msg);
                                          }
                                        }
                                      }
                                    }}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-955 font-black py-1.5 rounded-xl cursor-pointer transition text-center shadow-md text-[9.5px]"
                                  >
                                    قبول الطلب والالتزام التام بتوصيل الراكب 🤝
                                  </button>
                                </div>
                              ));
                            })()}
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                );
              })()}
              </div>
            )}

                  {/* MODE 0: DAILY PINNED TRIPS SECTION FOR DRIVERS */}
                  {schTabMode === 'daily_pinned' && (
                    <div className="flex flex-col gap-3.5 animate-fadeIn text-right">
                      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/40 p-4 rounded-2xl shadow-xl shadow-amber-950/10">
                        <div className="flex items-center justify-between flex-row-reverse mb-2">
                          <div className="flex items-center gap-2 flex-row-reverse">
                            <span className="text-2xl">📌</span>
                            <div>
                              <h3 className="text-sm font-black text-amber-300">الرحلات المجدولة اليومية المثبتة (Daily Pinned Trips)</h3>
                              <p className="text-[10px] text-slate-300 mt-0.5">خطوط ومواعيد يومية ثابتة ومصادق عليها من الإدارة، قم بتأكيد قيادتك للرحلة ليظهر اسمك ورقمك للركاب</p>
                            </div>
                          </div>
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl">
                            {applyUnifiedFilters(scheduledTrips.filter(t => (t.isPinnedDaily || t.creatorType === 'admin' || t.aiGenerated) && t.status !== 'cancelled' && t.status !== 'completed')).length} خطوط متاحة
                          </span>
                        </div>
                      </div>

                      {(() => {
                        const pinnedList = applyUnifiedFilters(scheduledTrips.filter(t => (t.isPinnedDaily || t.creatorType === 'admin' || t.aiGenerated) && t.status !== 'cancelled' && t.status !== 'completed'));
                        if (pinnedList.length === 0) {
                          return (
                            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs font-sans italic">
                              لا توجد حالياً رحلات يومية مثبتة معلنة من الإدارة. يمكنك تصفح طلبات الركاب الأخرى أو إعلان موعد خاص بك.
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {pinnedList.map((trip) => {
                              const isMyTrip = trip.driverId === loggedDriver?.id;
                              const isOtherCap = trip.driverId && trip.driverId !== loggedDriver?.id;
                              const govFrom = trip.governorateFrom || trip.fromArea.split('-')[0]?.trim() || 'عمان';
                              const govTo = trip.governorateTo || trip.toArea.split('-')[0]?.trim() || 'إربد';
                              const depHour = trip.dailyDepartureHour || trip.departureTime.split(' ')[1] || trip.departureTime || '08:00';
                              const fare = trip.customFare || 3.50;

                              return (
                                <div key={trip.id} className={`bg-slate-900 border rounded-2xl p-3.5 flex flex-col justify-between gap-3 transition shadow-md relative overflow-hidden ${isMyTrip ? 'border-emerald-500 bg-emerald-950/15 shadow-emerald-950/30' : 'border-slate-800 hover:border-amber-500/50'}`}>
                                  <div className="flex justify-between items-start flex-row-reverse">
                                    <div className="text-right">
                                      <div className="text-xs font-black text-slate-100 flex items-center gap-1.5 flex-row-reverse">
                                        <span className="text-amber-400">{govFrom}</span>
                                        <span className="text-slate-500 text-[10px]">⬅️</span>
                                        <span className="text-emerald-400">{govTo}</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 mt-1 font-sans truncate max-w-[210px]">
                                        {trip.fromArea} ➔ {trip.toArea}
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0">
                                      <span className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono font-black px-2.5 py-0.5 rounded-lg">
                                        🕒 {depHour}
                                      </span>
                                      <span className="text-[10px] font-bold text-emerald-400 mt-1">
                                        💵 {fare} د.أ / مقعد
                                      </span>
                                    </div>
                                  </div>

                                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 flex justify-between items-center flex-row-reverse text-[9.5px]">
                                    <span className="text-slate-300">
                                      👥 الركاب المسجلين: <strong className="text-amber-300 font-mono">{trip.passengers.length} ركاب</strong>
                                    </span>
                                    <span className="text-slate-300">
                                      👨‍✈️ الحالة: <strong className={isMyTrip ? 'text-emerald-400 font-bold' : isOtherCap ? 'text-slate-400' : 'text-amber-300 italic'}>{isMyTrip ? 'أنت الكابتن المعتمد' : isOtherCap ? `كابتن: ${trip.driverName}` : 'بانتظار قبول كابتن'}</strong>
                                    </span>
                                  </div>

                                  {isMyTrip ? (
                                    <button
                                      type="button"
                                      onClick={() => setSchTabMode('my_trips')}
                                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black py-2 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-950/40 text-center"
                                    >
                                      ▶️ إدارة رحلتي ومتابعة الركاب
                                    </button>
                                  ) : isOtherCap ? (
                                    <button disabled className="w-full bg-slate-800/80 text-slate-500 font-bold py-2 rounded-xl text-xs text-center cursor-not-allowed">
                                      🔒 تم قبولها من كابتن آخر ({trip.driverName})
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isIntercityTrip(trip)) {
                                          setConfirmingScheduledTrip(trip);
                                        } else {
                                          if (window.confirm(`هل تؤكد قبولك قيادة هذه الرحلة المثبتة للمغادرة الساعة ${depHour}؟`)) {
                                            const res = acceptScheduledTripByDriver(trip.id, loggedDriver!.id);
                                            if (res.success) {
                                              alert("✅ تم تأكيدك كابتناً لهذه الرحلة بنجاح! ستظهر الآن في تبويب مواعيدي.");
                                            } else {
                                              alert(res.msg || "تم تحديث الرحلة.");
                                            }
                                          }
                                        }
                                      }}
                                      className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black py-2 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-950/40 text-center"
                                    >
                                      🙋‍♂️ تأكيد وقبول قيادة هذه الرحلة الآن
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* MODE 4: MY SCHEDULED TRIPS */}
                  {schTabMode === 'my_trips' && (
                    <div className="flex flex-col gap-3">
                      {(() => {
                        const myTrips = applyUnifiedFilters(
                          scheduledTrips
                            .filter(t => t.driverId === loggedDriver?.id || t.creatorId === loggedDriver?.id)
                            .filter(t => t.status !== 'cancelled')
                        );

                        if (myTrips.length === 0) {
                          return (
                            <div className="text-center italic text-slate-500 text-[10px] py-10 bg-slate-950/20 rounded-2xl border border-slate-900">
                              لا توجد رحلات مجدولة مقبولة في جدولك حالياً. يمكنك قبول بعض طلبات الركاب من التبويب أعلاه!
                            </div>
                          );
                        }

                        return myTrips.map(trip => {
                          const isCreator = trip.creatorId === loggedDriver?.id;
                          const isAdminAuto = trip.creatorType === 'admin';
                          const totalBookedSeats = trip.passengers.reduce((sum, p) => sum + p.seatsCount, 0);
                          const isFull = totalBookedSeats >= 4;
                          const hasConfirmedAsDriver = trip.driverConfirmed || false;

                          return (
                            <div key={trip.id} className={`bg-slate-900 border ${trip.status === 'completed' ? 'border-emerald-500/40 border-l-4 border-l-emerald-500 shadow-lg shadow-emerald-950/10' : trip.status === 'cancelled' ? 'border-rose-500/30 border-l-4 border-l-rose-500/80 shadow-lg shadow-rose-950/10' : isAdminAuto ? 'border-emerald-500/25 shadow-md shadow-emerald-950/10' : 'border-slate-850'} rounded-2xl p-2.5 flex flex-col gap-1 text-right relative overflow-hidden`}>
                              
                              {/* Glowing Accent for full and confirmed Trip by Captain */}
                              {hasConfirmedAsDriver && (
                                <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-emerald-500 to-indigo-600"></div>
                              )}
                              
                              <div className="flex justify-between items-center border-b border-slate-800/60 pb-1 flex-row-reverse">
                                <div>
                                  <span className="text-[10px] font-extrabold text-slate-200 block">
                                    {isAdminAuto ? (
                                      '⚡ رحلة دورية كل ساعة قمت بتبنيها'
                                    ) : isCreator ? (
                                      'رحلة معلن عنها من طرفك'
                                    ) : (
                                      `طلب راكب تبنيته (${trip.creatorName})`
                                    )}
                                  </span>
                                  <span className="text-[8px] text-slate-500 font-mono mt-0.5 block">معرف: #{trip.id.split('_').pop()}</span>
                                </div>
                                <div className="flex items-center gap-1 flex-row-reverse">
                                  {hasConfirmedAsDriver ? (
                                    <span className="bg-emerald-950 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded text-[8px] font-black animate-pulse">✓ تم تأكيدك والتزامك</span>
                                  ) : isFull ? (
                                    <span className="bg-amber-950 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded text-[8px] font-bold font-sans">👥 مكتملة بانتظار تأكيدك</span>
                                  ) : (
                                    <span className="bg-indigo-950 border border-indigo-900/40 text-indigo-400 px-1.5 py-0.5 rounded text-[8px] font-bold font-sans">تجميع ({totalBookedSeats}/٤)</span>
                                  )}
                                  
                                  {trip.status === 'completed' && (
                                    <span className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-400 px-2 py-0.5 rounded text-[8.5px] font-black font-sans flex items-center gap-1 flex-row-reverse shadow-md shadow-emerald-950/40">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                      <span>🟢 مكتملة بنجاح</span>
                                    </span>
                                  )}
                                  {trip.status === 'cancelled' && (
                                    <span className="bg-rose-950/90 border border-rose-500/50 text-rose-400 px-2 py-0.5 rounded text-[8.5px] font-black font-sans flex items-center gap-1 flex-row-reverse shadow-md shadow-rose-950/40">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                      <span>🔴 ملغية</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="text-[9.5px] text-slate-350 leading-relaxed font-sans gap-0.5 flex flex-col">
                                <div><strong>من:</strong> {trip.fromArea.split(' - ').slice(-2).join(' - ') || trip.fromArea}</div>
                                <div><strong>إلى:</strong> {trip.toArea.split(' - ').slice(-2).join(' - ') || trip.toArea}</div>
                                <div><strong>موعد المغادرة:</strong> <span className="font-mono text-amber-500 text-[10px]">{trip.departureTime}</span></div>
                                <div>
                                  <strong>المقاعد المتبقية:</strong> {trip.availableSeats} مقاعد
                                </div>

                                {/* Detailed passenger join list inside the card */}
                                <div className="mt-1 border-t border-slate-850 pt-1 bg-slate-950/50 p-1.5 rounded border">
                                  <span className="text-[8px] font-bold text-slate-400 block mb-1">الركاب المحجوزين في الرحلة:</span>
                                  {trip.passengers.length === 0 ? (
                                    <span className="text-[8px] text-slate-500 italic block">لا يوجد ركاب مسجلين على هذا الموعد حالياً.</span>
                                  ) : (
                                    <div className="flex flex-col gap-1">
                                      {trip.passengers.map((p, pIdx) => (
                                        <div key={pIdx} className="flex flex-col text-[8.5px] bg-slate-900 p-1.5 rounded border border-slate-850 gap-1 mt-0.5 text-right font-sans">
                                          <div className="flex justify-between items-center flex-row-reverse">
                                            <div className="text-right truncate max-w-[140px]">
                                              <span className="text-slate-150 font-extrabold block text-[9.5px]">{p.fullName}</span>
                                              <span className="text-slate-400 block font-mono select-all text-[8.5px]">{p.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-row-reverse">
                                              <span className="text-amber-400 font-extrabold text-[9.5px]">
                                                {p.seatsCount} مقاعد 👥
                                              </span>
                                              {p.confirmed ? (
                                                <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 text-[6.5px] px-1 rounded">✓ ملتزم</span>
                                              ) : (
                                                <span className="bg-slate-950 text-slate-500 border border-slate-900 text-[6.5px] px-1 rounded">قيد التأكيد</span>
                                              )}
                                            </div>
                                          </div>
                                          {/* Passenger Actual Locations for Captain Pickup */}
                                          <div className="mt-1 border-t border-slate-800 pt-1 text-[8px] text-slate-350 flex flex-col gap-0.5">
                                            <div>📍 <strong className="text-emerald-400">موقع الإقلال الفعلي للراكب:</strong> {p.pickupLocation || "الموقف الافتراضي للمنطقة"}</div>
                                            {p.dropoffLocation && <div>🏁 <strong className="text-indigo-400">موقع النزول المفضل:</strong> {p.dropoffLocation}</div>}
                                            {p.customNote && <div>✍️ <strong className="text-amber-500">ملاحظة الراكب:</strong> "{p.customNote}"</div>}
                                          </div>
                                        </div>
                                      ))}

                                      {(() => {
                                        const loggedSeats = trip.passengers.reduce((sum, p) => sum + p.seatsCount, 0);
                                        if (loggedSeats < 4) {
                                          return (
                                            <div className="mt-2 border border-indigo-500/25 bg-indigo-950/20 p-2 rounded-xl text-right">
                                              <span className="text-[8px] text-indigo-300 leading-normal block mb-1">
                                                ⚠️ النصاب غير مكتمل للرحلة (الركاب: {loggedSeats}/٤). في حال عدم تنفيذ المشوار، يمكنك ترحيل الركاب آلياً للرحلة التالية وتنبيههم فوراً.
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (window.confirm('دمج وتأمين ركاب آدم: هل ترغب بنقل الركاب تلقائياً للرحلة المغادرة التالية لضمان تأمين ركابك؟ سنرسل لهم تنبيه SMS آلي.')) {
                                                    const result = rolloverUnderbookedTrip(trip.id);
                                                    if (result.success) {
                                                      setSchSuccessMsg(result.msg);
                                                      setTimeout(() => setSchSuccessMsg(''), 6000);
                                                    } else {
                                                      alert(result.msg);
                                                    }
                                                  }
                                                }}
                                                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-1 px-2 rounded-lg text-[8px] cursor-pointer text-center"
                                              >
                                                🔄 إجراء الترحيل التلقائي ونقل الركاب
                                              </button>
                                            </div>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* INCOMPLETE TRIP TIME-ARRIVED CONTROLS */}
                              {(() => {
                                const now = new Date();
                                const yr = now.getFullYear();
                                const mo = String(now.getMonth() + 1).padStart(2, '0');
                                const dy = String(now.getDate()).padStart(2, '0');
                                const hr = String(now.getHours()).padStart(2, '0');
                                const mn = String(now.getMinutes()).padStart(2, '0');
                                const localTimeStr = `${yr}-${mo}-${dy} ${hr}:${mn}`;

                                const hasArrived = trip.departureTime <= localTimeStr;
                                const isIncompletePending = trip.status === 'accepted' && totalBookedSeats < 4;

                                if (hasArrived && isIncompletePending) {
                                  return (
                                    <div className="mt-2.5 bg-gradient-to-br from-slate-950 to-indigo-950/70 border-2 border-indigo-500 p-3 rounded-2xl text-right font-sans shadow-lg animate-pulse-slow">
                                      <div className="flex items-center justify-between flex-row-reverse mb-2 bg-indigo-900/40 p-1.5 rounded-lg border border-indigo-800/30">
                                        <span className="text-[10px] font-black text-indigo-200">⏱️ حلول توقيت الرحلة المجدولة وجيميناي</span>
                                        <span className="text-[9px] bg-indigo-500/10 text-indigo-300 font-extrabold px-2 py-0.5 rounded-md">المقاعد: {totalBookedSeats}/٤</span>
                                      </div>
                                      <p className="text-[9.5px] text-slate-300 leading-relaxed mb-3">
                                        لقد حان موعد مغادرة الرحلة الفعلي والعدد النهائي للركاب الحاجزين والمؤكدين حالياً هو <strong className="text-indigo-400">({totalBookedSeats}) من أصل ٤</strong>.
                                        <br />
                                        نشامى الأردن يتمتعون بخيارين فوريين لتوفير أعلى كفاءة نقل وسلاسة تواصل:
                                      </p>
                                      <div className="flex flex-col gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (window.confirm("هل ترغب في بدء الرحلة الآن بالركاب المؤمنين الحاليين والتحرك الفوري؟")) {
                                              const result = startIncompleteScheduledTrip(trip.id);
                                              alert(result.msg);
                                            }
                                          }}
                                          className="w-full bg-indigo-600 hover:bg-indigo-505 text-white font-extrabold py-2 px-3 rounded-xl text-[10px] cursor-pointer text-center shadow-md transition"
                                        >
                                          🚀 البدء بالرحلة المغادرة بالعدد الحالي للركاب ({totalBookedSeats})
                                        </button>
                                        
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (window.confirm("يرجى التأكيد: سيتم تمديد موعد مغادرة الرحلة بمقدار 10 دقائق أخرى تلقائياً، وإرسال تنبيه SMS وإشعار فوري لجميع ركاب الخدمة بإبقائهم بالانتظار.")) {
                                              const result = delayScheduledTripBy10Minutes(trip.id);
                                              alert(result.msg);
                                            }
                                          }}
                                          className="w-full bg-slate-900 border border-slate-800 hover:border-amber-500/40 hover:text-amber-400 text-slate-400 font-bold py-1.5 px-3 rounded-xl text-[9px] cursor-pointer text-center transition"
                                        >
                                          ⏱️ جدولة تأجيل المشوار وعمل انتظار 10 دقائق أخرى
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}

                              {(() => {
                                const tripDepDate = new Date(trip.departureTime.replace(' ', 'T'));
                                const diffMs = tripDepDate.getTime() - new Date().getTime();
                                const isWithin30Mins = diffMs > 0 && diffMs <= 30 * 60 * 1000;
                                if (isWithin30Mins) {
                                  return (
                                    <div className="mt-2.5 bg-rose-950/40 border border-rose-500/50 p-3 rounded-2xl flex items-center gap-2 flex-row-reverse shadow-lg shadow-rose-950/20">
                                      <span className="text-base animate-pulse">🚨</span>
                                      <p className="text-[10px] text-rose-200 font-bold leading-relaxed text-right">
                                        تنبيه هام: متبقي أقل من نصف ساعة على انطلاق الرحلة المجدولة! لا يمكن الإلغاء بشكل اعتيادي الآن، وإذا قمت بالإلغاء ستتعرض لرسوم وغرامة إلغاء فورية تخصم من رصيدك.
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              })()}

                              {/* CAPTAIN CONFIRMATION REQUEST (When 4 Passengers complete, but driver hasn't confirmed yet) */}
                              {isFull && !hasConfirmedAsDriver && trip.status !== 'completed' && trip.status !== 'cancelled' && (
                                <div className="mt-2.5 border border-amber-500/40 bg-amber-950/25 rounded-2xl p-3 text-right">
                                  <div className="flex items-center gap-1.5 flex-row-reverse mb-2">
                                    <span className="text-[12px]">🚕</span>
                                    <p className="text-[9.5px] text-amber-300 font-extrabold leading-normal">
                                      إشعار تلبية المسار: لقد تفوقت الرحلة واكتمل ركابها الأربعة (٤ ركاب)! يرجى تأكيد التزامك التام بموعد الانطلاق لتفعيل رادار الخريطة ومباشرة النقل.
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm("✍️ هل أنت ملتزم التزاماً كاملاً بهذه الرحلة بموعدها؟ بمجرد التأكيد، لا يمكنك إلغاء الموعد مطلقاً وفق القوانين، وسيظهر لك رادار الركاب الحقيقي بالخارطة.")) {
                                        const res = confirmScheduledTripByDriver(trip.id, loggedDriver!.id);
                                        if (res.success) {
                                          alert(res.msg);
                                        }
                                      }
                                    }}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2 rounded-xl text-[9.5px] cursor-pointer transition shadow"
                                  >
                                    تأكيد المبيز والالتزام الفوري بالانطلاق كابتن 👍
                                  </button>
                                </div>
                              )}

                              {/* AI PROXIMITY GPS RADAR FOR COMPLETED 4-PASSENGER TRIPS */}
                              {trip.passengers.length >= 4 && (
                                <div className="mt-2 border border-amber-500/30 bg-amber-950/20 rounded-xl p-2 font-sans">
                                  <div className="flex justify-between items-center flex-row-reverse mb-1.5 pb-1 border-b border-amber-500/10">
                                    <span className="text-[9px] font-black text-amber-400">🧭 رادار تتبع الركاب الـ 4 المفرز بالذكاء الاصطناعي (AI GPS Radar)</span>
                                    {hasConfirmedAsDriver ? (
                                      <span className="bg-emerald-500 text-slate-950 px-1 rounded text-[7.5px] font-black">نشط وتأكيد مطلق</span>
                                    ) : (
                                      <span className="bg-amber-500 text-slate-950 px-1 rounded text-[7.5px] font-bold">بانتظار تأكيد الالتزام</span>
                                    )}
                                  </div>
                                  
                                  {aiOptimizingTripId === trip.id || hasConfirmedAsDriver ? (
                                    <div className="flex flex-col gap-2 mt-2">
                                      {/* SCANNED / SORTED LIST */}
                                      {aiSortedPassengers.length > 0 || hasConfirmedAsDriver ? (
                                        <div className="flex flex-col gap-2">
                                          {/* RADAR SVG SCANNER DISPLAY */}
                                          <div className="bg-slate-950 border border-slate-900 rounded-xl p-2 relative overflow-hidden h-36 flex flex-col justify-end">
                                            {/* Scanning Radar sonar background */}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                              <div className="w-28 h-28 border border-emerald-500 rounded-full animate-ping absolute" />
                                              <div className="w-20 h-20 border border-emerald-500/60 rounded-full absolute" />
                                              <div className="w-12 h-12 border border-emerald-500/30 rounded-full absolute" />
                                            </div>
                                            
                                            <svg className="absolute inset-0 w-full h-full" viewBox="100 120 120 110">
                                              {/* Connecting Pickup Route Path */}
                                              <path 
                                                d={`M 160 170 L ${(aiSortedPassengers.length > 0 ? aiSortedPassengers : [
                                                  { name: trip.passengers[0]?.fullName || "الراكب الأول", x: 130, y: 145, nameLoc: "الدوار السابع" },
                                                  { name: trip.passengers[1]?.fullName || "الراكب الثاني", x: 185, y: 150, nameLoc: "محيط شارع مكة" },
                                                  { name: trip.passengers[2]?.fullName || "الراكب الثالث", x: 195, y: 190, nameLoc: "محيط طريق المطار" },
                                                  { name: trip.passengers[3]?.fullName || "الراكب الرابع", x: 145, y: 210, nameLoc: "مرج الحمام" }
                                                ]).map(p => `${p.x} ${p.y}`).join(' L ')}`}
                                                fill="none"
                                                stroke="#f59e0b"
                                                strokeWidth="1.2"
                                                strokeDasharray="2 2"
                                                className="animate-pulse"
                                              />
                                              
                                              {/* Captain Node */}
                                              <circle cx="160" cy="170" r="4.5" fill="#3b82f6" className="animate-pulse" />
                                              <text x="160" y="165" fill="#60a5fa" fontSize="6.5" textAnchor="middle" fontWeight="bold">مركبتك</text>
                                              
                                              {/* Passenger Nodes in Proximity order */}
                                              {(aiSortedPassengers.length > 0 ? aiSortedPassengers : [
                                                { name: trip.passengers[0]?.fullName || "الراكب الأول", x: 130, y: 145, nameLoc: "الدوار السابع" },
                                                { name: trip.passengers[1]?.fullName || "الراكب الثاني", x: 185, y: 150, nameLoc: "محيط شارع مكة" },
                                                { name: trip.passengers[2]?.fullName || "الراكب الثالث", x: 195, y: 190, nameLoc: "محيط طريق المطار" },
                                                { name: trip.passengers[3]?.fullName || "الراكب الرابع", x: 145, y: 210, nameLoc: "مرج الحمام" }
                                              ]).map((p, pIdx) => (
                                                <g key={pIdx}>
                                                  <circle cx={p.x} cy={p.y} r="3.5" fill="#f59e0b" />
                                                  <circle cx={p.x} cy={p.y} r="7" fill="none" stroke="#f59e0b" strokeWidth="0.5" className="animate-ping opacity-70" />
                                                  <text x={p.x} y={p.y - 5.5} fill="#fbbf24" fontSize="6" textAnchor="middle" fontWeight="bold">
                                                    {pIdx + 1}. {p.name.split(' ')[0]}
                                                  </text>
                                                  <text x={p.x} y={p.y + 8} fill="#94a3b8" fontSize="4.5" textAnchor="middle">
                                                    {p.nameLoc || "موقف محدد"}
                                                  </text>
                                                </g>
                                              ))}
                                            </svg>
                                            <div className="relative text-[7.5px] text-emerald-400 bg-slate-950/80 px-1 py-0.5 rounded text-left font-mono z-10">
                                              ★ Active lock: True | Proximity Radar Lock
                                            </div>
                                          </div>

                                          {/* Sorted List Summary */}
                                          <div className="flex flex-col gap-1 text-right mt-1 bg-slate-950/40 p-1.5 rounded-lg border border-slate-900">
                                            <span className="text-[8px] font-bold text-slate-400 block mb-0.5">🚀 مواقع الركاب الفعلية على الخريطة (حسب قربهم الفعلي منك كابتن):</span>
                                            {(aiSortedPassengers.length > 0 ? aiSortedPassengers : [
                                              { name: trip.passengers[0]?.fullName || "الراكب الأول", distance: 1.2, nameLoc: "الدوار السابع" },
                                              { name: trip.passengers[1]?.fullName || "الراكب الثاني", distance: 2.5, nameLoc: "محيط شارع مكة" },
                                              { name: trip.passengers[2]?.fullName || "الراكب الثالث", distance: 4.8, nameLoc: "محيط طريق المطار" },
                                              { name: trip.passengers[3]?.fullName || "الراكب الرابع", distance: 6.1, nameLoc: "مرج الحمام" }
                                            ]).map((p, i) => (
                                              <div key={i} className="flex justify-between items-center text-[8.5px] border-b border-slate-900/40 pb-0.5 flex-row-reverse">
                                                <span className="text-slate-300 font-bold">
                                                  {i + 1}. {p.name} ({p.nameLoc || "نقطة تجميع"})
                                                </span>
                                                <span className="text-amber-400 font-mono">
                                                  {p.distance ? `${p.distance.toFixed(1)} كم` : `${((i + 1) * 1.5).toFixed(1)} كم`}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
 
                                          {/* Close radar (only if not auto-activated by locked confirmation) */}
                                          {!hasConfirmedAsDriver && (
                                            <button
                                              onClick={() => {
                                                setAiOptimizingTripId(null);
                                                setAiSequenceAdvice('');
                                                setAiSortedPassengers([]);
                                              }}
                                              className="mt-1 w-full bg-slate-950/80 hover:bg-slate-900 border border-slate-880 text-[8px] text-slate-400 font-bold py-1 rounded-lg cursor-pointer"
                                            >
                                              إغلاق رادار الذكاء الاصطناعي
                                            </button>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-center py-4 text-[9px] text-amber-500 flex flex-col items-center gap-1.5">
                                          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                          <span>جاري سحب إحداثيات المشتركين والربط مع خوارزمية الذكاء الاصطناعي لإيجاد أقصر مسار...</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="p-1 text-right">
                                      <span className="text-[8px] text-slate-400 leading-normal block mb-1.5">
                                        الرحلة مكتملة ومؤمنة بالكامل بالركاب الأربعة. اضغط تفعيل في الكابين للاطلاع الفوري على أقصر طريق تجميعي مرتب حسب المسافة وتوجيهات الخرائط.
                                      </span>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          setAiOptimizingTripId(trip.id);
                                          try {
                                            const requestPayload = {
                                              captainLoc: { x: 160, y: 170, name: 'موقع الكابتن الحالي' },
                                              passengers: [
                                                { name: trip.passengers[0]?.fullName || "الراكب الأول", phone: trip.passengers[0]?.phone || "078...", x: 130, y: 145, nameLoc: "الدوار السابع" },
                                                { name: trip.passengers[1]?.fullName || "الراكب الثاني", phone: trip.passengers[1]?.phone || "077...", x: 185, y: 150, nameLoc: "محيط شارع مكة" },
                                                { name: trip.passengers[2]?.fullName || "الراكب الثالث", phone: trip.passengers[2]?.phone || "079...", x: 195, y: 190, nameLoc: "محيط طريق المطار" },
                                                { name: trip.passengers[3]?.fullName || "الراكب الرابع", phone: trip.passengers[3]?.phone || "075...", x: 145, y: 210, nameLoc: "مرج الحمام" }
                                              ]
                                            };
                                            const res = await fetch('/api/ai-optimize-pickup', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify(requestPayload)
                                            });
                                            const raw = await res.json();
                                            if (raw.success) {
                                              setAiSortedPassengers(raw.sortedPassengers);
                                              setAiSequenceAdvice(raw.aiAdvice);
                                            } else {
                                              alert('تعذر الاتصال بخيارات الذكاء الاصطناعي للرادار حالياً.');
                                            }
                                          } catch (err) {
                                            console.error('Radar init error:', err);
                                            alert('خطأ في شبكة التتبع الفضائي للرادار.');
                                            setAiOptimizingTripId(null);
                                          }
                                        }}
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-955 font-black py-1 px-2.5 rounded-lg text-[9px] cursor-pointer transition shadow flex justify-center items-center gap-1"
                                      >
                                        🔍 تشغيل تتبع ملاحة الركاب الفوري بالذكاء الاصطناعي
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {trip.status === 'accepted' && (
                                <div className="mt-2 flex gap-1.5 justify-start flex-row-reverse border-t border-slate-800/40 pt-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm('هل أكملت هذه الرحلة المجدولة والمسار بنجاح وترغب في إنهاء وتأكيد التنفيذ؟')) {
                                        const res = completeScheduledTrip(trip.id);
                                        if (res.success) {
                                          setSchSuccessMsg(res.msg);
                                          setTimeout(() => setSchSuccessMsg(''), 4000);
                                        } else {
                                          alert(res.msg);
                                        }
                                      }
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-1 px-3 rounded-xl text-[9.5px] transition cursor-pointer flex items-center gap-1 shadow-md font-sans leading-5"
                                  >
                                    ✅ تم تنفيذ الرحلة بنجاح
                                  </button>
                                  
                                  {hasConfirmedAsDriver ? (
                                    <span className="text-[8px] text-emerald-400 font-extrabold py-1 bg-emerald-950/20 border border-emerald-900 px-2 rounded-xl text-center self-center leading-normal">
                                      🔒 التزام مطلق (تم التأكيد)
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        // Check if any passenger confirmed
                                        const anyPsgConfirmed = trip.passengers.some(p => p.confirmed);
                                        let cancelNote = "هل أنت متأكد من رغبتك في إلغاء قيادتك لهذه الرحلة؟";
                                        if (anyPsgConfirmed) {
                                          cancelNote = "🚨 تنبيه غرامة: لتواجد ركاب أكدوا الموعد مسبقاً، سيتوجب عليك تحمل رسوم إلغاء بمقدار 3.00 د.أ تُخصم من محفظتك. هل أنت متأكد؟";
                                        }
                                        
                                        if (window.confirm(cancelNote)) {
                                          const result = cancelScheduledTripByDriver(trip.id, loggedDriver!.id);
                                          if (result.success) {
                                            setSchSuccessMsg(result.msg);
                                            setTimeout(() => setSchSuccessMsg(''), 4500);
                                          } else {
                                            alert(result.msg);
                                          }
                                        }
                                      }}
                                      className="bg-slate-950 border border-slate-800/50 hover:bg-red-955 hover:text-red-500 text-slate-400 font-bold py-1 px-2.5 rounded-xl text-[8.5px] transition cursor-pointer font-sans"
                                    >
                                      إلغاء الموعد 🚫
                                    </button>
                                  )}
                                </div>
                              )}

                              {trip.status === 'pending' && (
                                <div className="mt-1 text-left">
                                  {hasConfirmedAsDriver ? (
                                    <span className="text-[8.5px] text-emerald-400 font-bold border border-emerald-900 bg-emerald-950/40 py-1 px-2.5 rounded-xl block leading-normal text-right">
                                      🔒 الرحلة مؤكدة بعهدتك كلياً ولا يتاح الإلغاء.
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        const anyPsgConfirmed = trip.passengers.some(p => p.confirmed);
                                        let cancelNote = "هل أنت متأكد من رغبتك في إلغاء هذا المشوار وحذفه؟";
                                        if (anyPsgConfirmed) {
                                          cancelNote = "🚨 تنبيه غرامة: لتواجد ركاب أكدوا الموعد مسبقاً، سيتوجب عليك تحمل رسوم إلغاء بمقدار 3.00 د.أ تُخصم من محفظتك. هل أنت متأكد؟";
                                        }
                                        
                                        if (window.confirm(cancelNote)) {
                                          const result = cancelScheduledTripByDriver(trip.id, loggedDriver!.id);
                                          if (result.success) {
                                            setSchSuccessMsg(result.msg);
                                            setTimeout(() => setSchSuccessMsg(''), 4500);
                                          } else {
                                            alert(result.msg);
                                          }
                                        }
                                      }}
                                      className="bg-red-950/60 hover:bg-red-900 border border-red-900/60 text-red-500 font-bold py-0.5 px-2 rounded-[6px] text-[8px] transition cursor-pointer font-sans"
                                    >
                                      إلغاء الموعد 🗑
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}

                  {/* MODE 3: GOOGLE CALENDAR SYNC MANAGER */}
                  {schTabMode === 'calendar_sync' && (
                    <GoogleCalendarManager userType="driver" userId={loggedDriver!.id} />
                  )}

                </div>
              )}

              {/* E-WALLET TAB */}
              {activeTab === 'wallet' && (
                <div className="flex-1 flex flex-col min-h-[380px] font-sans text-right">
                  <h3 className="text-xs font-bold text-slate-200 text-right border-b border-slate-850 pb-1.5 flex justify-end gap-1.5 items-center mb-2">
                    <span>المحفظة الإلكترونية للكابتن</span>
                    <Wallet className="w-4 h-4 text-amber-500" />
                  </h3>

                  {/* Sub Tab Buttons */}
                  <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl mb-3 flex-row-reverse text-xs gap-1">
                    <button
                      type="button"
                      onClick={() => { setActiveWalletSubTab('details'); setWalletFeedback(''); }}
                      className={`flex-1 py-1.5 rounded-lg text-center font-bold transition text-[9px] ${activeWalletSubTab === 'details' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      تفاصيل الرصيد
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveWalletSubTab('recharge'); setWalletFeedback(''); }}
                      className={`flex-1 py-1.5 rounded-lg text-center font-bold transition text-[9px] ${activeWalletSubTab === 'recharge' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      شحن الرصيد
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveWalletSubTab('withdraw'); setWalletFeedback(''); }}
                      className={`flex-1 py-1.5 rounded-lg text-center font-bold transition text-[9px] ${activeWalletSubTab === 'withdraw' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      سحب الأرباح
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveWalletSubTab('link'); setWalletFeedback(''); }}
                      className={`flex-1 py-1.5 rounded-lg text-center font-bold transition text-[9px] ${activeWalletSubTab === 'link' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      ربط حساب مالي 🔗
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveWalletSubTab('rewards'); setWalletFeedback(''); }}
                      className={`flex-1 py-1.5 rounded-lg text-center font-bold transition text-[9px] ${activeWalletSubTab === 'rewards' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      مكافآت التحدي 🏆
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveWalletSubTab('pin'); setWalletFeedback(''); }}
                      className={`flex-1 py-1.5 rounded-lg text-center font-bold transition text-[9px] ${activeWalletSubTab === 'pin' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      درع الأمان 🛡️
                    </button>
                  </div>

                  {walletFeedback && (
                    <div className="p-2 mb-3 bg-indigo-950/50 border border-indigo-900 text-indigo-300 text-[10px] text-center rounded-lg leading-relaxed">
                      {walletFeedback}
                    </div>
                  )}

                  {/* SUBTAB: BALANCE DETAILS AND TRANSACTIONS HISTORY */}
                  {activeWalletSubTab === 'details' && (() => {
                    const myTx = walletTransactions.filter(ts => ts.userId === loggedDriver.id && ts.userType === 'driver');
                    
                    // Reconstruct balance backwards in time for the chart
                    let runningBalance = loggedDriver.balance ?? 0;
                    const points = [{
                      name: 'الآن',
                      balance: Number(runningBalance.toFixed(2))
                    }];
                    
                    myTx.forEach((tx, idx) => {
                      const isPositive = tx.type === 'deposit' || tx.type === 'fare_payment';
                      if (isPositive) {
                        runningBalance -= tx.amount;
                      } else {
                        runningBalance += tx.amount;
                      }
                      const timeStr = tx.timestamp ? tx.timestamp.split(' ')[1] || tx.timestamp : '';
                      points.push({
                        name: timeStr || `حركة ${myTx.length - idx}`,
                        balance: Number(runningBalance.toFixed(2))
                      });
                    });
                    
                    const chartData = points.reverse();

                    const filteredTx = myTx.filter(ts => {
                      const matchesType = walletFilterType === 'all' || 
                        (walletFilterType === 'deposit' && ts.type === 'deposit') ||
                        (walletFilterType === 'withdraw' && ts.type === 'withdraw') ||
                        (walletFilterType === 'fare_payment' && ts.type === 'fare_payment');
                      
                      const matchesDate = !walletFilterDate || (ts.timestamp && ts.timestamp.startsWith(walletFilterDate));
                      return matchesType && matchesDate;
                    });

                    return (
                      <div className="flex flex-col gap-3">
                        {/* Big Balance Display Card */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-4 rounded-2xl text-center shadow-lg">
                          <span className="text-[10px] text-slate-400 font-bold block mb-1">الرصيد الحالي المتوفر</span>
                          <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight leading-none mb-1">
                            {(loggedDriver.balance ?? 0).toFixed(2)} <span className="text-xs">د.أ</span>
                          </div>
                          <p className="text-[9px] text-slate-500">مجموع الأرباح القابلة للسحب وشحن الرحلات مستقبلاً</p>
                        </div>

                        {/* Line/Area Chart for E-Wallet Balance Over Time */}
                        <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl text-right">
                          <span className="text-[10px] text-slate-400 font-bold block mb-2 border-b border-slate-850 pb-1">مؤشر رصيد المحفظة والأرباح</span>
                          <div className="w-full h-[120px] pb-1">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="driverColorAmt" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.25}/>
                                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                                <XAxis dataKey="name" tick={{ fontSize: 7, fill: '#94a3b8' }} tickLine={false} />
                                <YAxis tick={{ fontSize: 7, fill: '#94a3b8' }} tickLine={false} />
                                <Tooltip
                                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '9px', textAlign: 'right', direction: 'rtl' }}
                                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                                  itemStyle={{ color: '#eab308' }}
                                  formatter={(value: any) => [`${value} د.أ`, 'الرصيد']}
                                />
                                <Area type="monotone" dataKey="balance" stroke="#eab308" fillOpacity={1} fill="url(#driverColorAmt)" strokeWidth={1.5} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Transaction Logs */}
                        <div className="flex flex-col gap-1.5 mt-1 text-right">
                          <span className="text-[10px] font-bold text-slate-400 block border-b border-slate-850 pb-1 flex justify-end items-center gap-1 flex-row-reverse">
                            <span>سجل تاريخ العمليات المالية</span>
                            <span className="text-[8px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold font-mono">
                              {filteredTx.length} من {myTx.length}
                            </span>
                          </span>

                          {/* Filtering Bar */}
                          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850 flex flex-row gap-2 justify-between items-center text-right font-sans">
                            {/* Filter by Date */}
                            <div className="flex flex-col gap-0.5 flex-1 p-1">
                              <label className="text-[8px] text-slate-400 font-bold block mb-0.5 text-right">التصفية بالتاريخ</label>
                              <input
                                type="date"
                                value={walletFilterDate}
                                onChange={(e) => setWalletFilterDate(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg text-[9px] text-slate-200 px-2 py-1 outline-none text-right placeholder-slate-600 focus:border-indigo-500/50"
                              />
                            </div>

                            {/* Filter by Type */}
                            <div className="flex flex-col gap-0.5 flex-1 p-1 items-end">
                              <label className="text-[8px] text-slate-400 font-bold block mb-0.5 text-right">نوع الحركة</label>
                              <select
                                value={walletFilterType}
                                onChange={(e) => setWalletFilterType(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg text-[9px] text-slate-200 px-2 py-1 outline-none text-right focus:border-indigo-500/50"
                                dir="rtl"
                              >
                                <option value="all">الكل</option>
                                <option value="deposit">إيداع / شحن رصيد</option>
                                <option value="withdraw">سحب الأرباح</option>
                                <option value="fare_payment">تحصيل قيمة المشوار</option>
                              </select>
                            </div>

                            {/* Clear Filters Button if active */}
                            {(walletFilterType !== 'all' || walletFilterDate !== '') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setWalletFilterType('all');
                                  setWalletFilterDate('');
                                }}
                                className="self-end mb-1 bg-slate-800 hover:bg-slate-755 text-slate-300 text-[8px] font-bold px-2 py-1.5 rounded-lg transition"
                              >
                                إزالة
                              </button>
                            )}
                          </div>

                          {myTx.length === 0 ? (
                            <p className="text-[10px] text-slate-500 italic text-center py-8">
                              لا يوجد سجلات عمليات مالية أو إيداع سابقة هنا.
                            </p>
                          ) : filteredTx.length === 0 ? (
                            <p className="text-[10px] text-slate-500 italic text-center py-8">
                              لا توجد حركات مطابقة لخيارات التصفية الحالية.
                            </p>
                          ) : (
                            <div className="flex flex-col gap-2 max-h-[170px] overflow-y-auto pr-1">
                              {filteredTx.map((ts) => {
                                const isPositive = ts.type === 'deposit' || ts.type === 'fare_payment';
                                return (
                                  <div key={ts.id} className="bg-slate-900 border border-slate-850 p-2 rounded-xl flex justify-between items-center flex-row-reverse gap-2 font-sans">
                                    <div className="text-right">
                                      <span className="text-[10px] font-bold text-slate-200 block">
                                        {ts.type === 'deposit' ? 'إيداع شحن رصيد' :
                                         ts.type === 'withdraw' ? 'سحب الأرباح المتراكمة' :
                                         ts.type === 'fare_payment' ? 'تحصيل قيمة من ركاب' :
                                         ts.type === 'commission_deduction' ? 'اقتطاع عمولة آدم' : 'رسوم إلغاء رحلة'}
                                      </span>
                                      <span className="text-[8px] text-slate-500 font-mono block mt-0.5">{ts.timestamp}</span>
                                      {ts.walletNumber && (
                                        <span className="text-[8px] text-indigo-400/80 font-mono block mt-0.5">المحفظة: {ts.walletNumber}</span>
                                      )}
                                    </div>
                                    <div className={`text-[11px] font-mono font-bold shrink-0 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {isPositive ? '+' : '-'}{ts.amount.toFixed(2)} د.أ
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* SUBTAB: RECHARGE WALLET (SIMULATION) */}
                  {activeWalletSubTab === 'recharge' && (
                    <WalletRechargeSettlementPanel
                      userType="driver"
                      user={loggedDriver}
                      onVerifyAndDeposit={verifyAndDepositWalletWithBank}
                      settings={settings}
                      themeColor="amber"
                      onCompleted={() => setActiveWalletSubTab('details')}
                    />
                  )}

                  {/* SUBTAB: WITHDRAWAL ACCUMULATED PROFITS */}
                  {activeWalletSubTab === 'withdraw' && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setWalletFeedback('');
                        const amount = parseFloat(withdrawAmtInput);
                        if (!walletNumInput || isNaN(amount) || amount <= 0) {
                          alert('الرجاء إدخال رقم المحفظة وقيمة السحب بصيغة صحيحة.');
                          return;
                        }
                        if (amount > (loggedDriver.balance ?? 0)) {
                          alert(`عذراً كابتن، رصيدك المتوفر حالياً (${(loggedDriver.balance ?? 0).toFixed(2)} د.أ) أقل من القيمة المطلوبة للسحب.`);
                          return;
                        }

                        // PIN Security Check
                        if (!loggedDriver.pin) {
                          if (pinSetupInput.length !== 4) {
                            alert('⚠️ لحماية حسابك المالي، يرجى إنشاء رمز PIN مكون من 4 أرقام لتأكيد عملية السحب الحالية.');
                            return;
                          }
                          setUserPin(loggedDriver.id, 'driver', pinSetupInput);
                          setPinSetupInput('');
                        } else {
                          if (pinCodeInput !== loggedDriver.pin) {
                            alert('⚠️ رمز الأمان PIN غير صحيح! يرجى إدخال الرمز الصحيح المكون من 4 أرقام لحماية حسابك.');
                            return;
                          }
                          setPinCodeInput('');
                        }

                        addWalletTransaction(loggedDriver.id, 'driver', 'withdraw', amount, walletNumInput);
                        setWalletFeedback(`🎉 تم التحقق من رمز PIN بنجاح! وتم قبول طلب سحب الأرباح بقيمة ${amount} د.أ بنجاح لحساب محفظتك رقم ${walletNumInput}`);
                        setActiveWalletSubTab('details');
                        setWithdrawAmtInput('');
                      }}
                      className="flex flex-col gap-3 font-sans text-right"
                    >
                      <span className="text-[9.5px] text-slate-400 block leading-relaxed">
                        اسحب أرباحك وعوائد تجميع وتحصيل الركاب المتراكمة في حسابك إلى محفظتك الإلكترونية الخاصة فوراً:
                      </span>

                      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 block">رقم المحفظة الإلكترونية المستلمة</label>
                        <input
                          type="text"
                          required
                          value={walletNumInput}
                          onChange={e => setWalletNumInput(e.target.value)}
                          placeholder="رقم المستلم 07XXXXXXXX"
                          className="bg-transparent text-xs text-slate-105 outline-none font-mono text-right"
                        />
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex flex-col gap-1">
                        <label className="text-[9px] text-indigo-400 font-bold block">مبلغ السحب المالي (د.أ)</label>
                        <input
                          type="number"
                          required
                          step="0.5"
                          min="1"
                          max={loggedDriver.balance ?? 0}
                          value={withdrawAmtInput}
                          onChange={e => setWithdrawAmtInput(e.target.value)}
                          placeholder={`القيمة المتاحة (بين 1 إلى ${(loggedDriver.balance ?? 0).toFixed(2)})`}
                          className="bg-transparent text-xs text-slate-105 outline-none font-mono text-right font-bold"
                        />
                      </div>

                      {/* Dynamic Security PIN section */}
                      {!loggedDriver.pin ? (
                        <div className="bg-amber-950/25 border border-amber-500/20 p-3 rounded-xl flex flex-col gap-2 animate-fadeIn">
                          <span className="text-[10px] text-amber-400 font-black block flex items-center justify-end gap-1 flex-row-reverse">
                            <span>🔑 إنشاء رمز PIN رباعي الأرقام للأمان</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                          </span>
                          <p className="text-[9px] text-slate-400 leading-normal m-0">
                            لحماية أرباحك وأموالك، يرجى إنشاء رمز PIN مكون من 4 أرقام سيتم استخدامه في جميع المعاملات القادمة:
                          </p>
                          <input
                            type="text"
                            maxLength={4}
                            required
                            value={pinSetupInput}
                            onChange={e => setPinSetupInput(e.target.value.replace(/\D/g, ''))}
                            placeholder="اكتب 4 أرقام لرمز PIN الجديد الخاص بك"
                            className="bg-slate-950 border border-slate-800 text-center font-mono text-xs p-2 rounded-lg text-slate-100 focus:border-amber-500 outline-none font-bold tracking-widest"
                          />
                        </div>
                      ) : (
                        <div className="bg-indigo-950/45 border border-indigo-500/20 p-3 rounded-xl flex flex-col gap-2 animate-fadeIn">
                          <span className="text-[10px] text-indigo-400 font-black block flex items-center justify-end gap-1 flex-row-reverse">
                            <span>🔒 تأكيد هويتك برمز PIN رباعي الأرقام</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                          </span>
                          <p className="text-[9px] text-slate-400 leading-normal m-0">
                            يرجى إدخال رمز الأمان PIN الخاص بك لإتمام عملية سحب الأرباح بأمان:
                          </p>
                          <input
                            type="password"
                            maxLength={4}
                            required
                            value={pinCodeInput}
                            onChange={e => setPinCodeInput(e.target.value.replace(/\D/g, ''))}
                            placeholder="أدخل رمز PIN الخاص بك"
                            className="bg-slate-950 border border-slate-850 text-center font-mono text-xs p-2 rounded-lg text-slate-100 focus:border-indigo-500 outline-none font-bold tracking-widest"
                          />
                        </div>
                      )}

                      <div className="bg-slate-950 border border-slate-850 p-2 text-slate-400 text-[8.5px] rounded-lg">
                        رصيد السحب المتوفر لك: <span className="text-emerald-400 font-mono font-bold">{(loggedDriver.balance ?? 0).toFixed(2)} د.أ</span>. بموجب قوانين سلطة تنظيم قطاع النقل، تقتطع الأموال فور تأكيد البيانات الجغرافية.
                      </div>

                      <button
                        type="submit"
                        disabled={(loggedDriver.balance ?? 0) < 1}
                        className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black py-2 rounded-xl text-xs transition outline-none cursor-pointer leading-relaxed"
                      >
                        تأكيد سحب وتحويل الأرباح (يتطلب PIN) 💸
                      </button>
                    </form>
                  )}

                  {activeWalletSubTab === 'link' && (
                    <div className="flex flex-col gap-3 text-right">
                      <span className="text-[10px] text-slate-400 block leading-relaxed">
                        قم بربط وتأمين حسابات البنك أو محفظتك الجوالة المفضلة (زين، أورنج، أمنية) مباشرة مع التطبيق لتسهيل شحن رحلاتك وسحب مستحقات الكابتن بضغطة زر واحدة.
                      </span>

                      {/* Current linked info */}
                      {loggedDriver?.linkedPaymentProvider ? (
                        <div className="bg-amber-950/25 border border-amber-900/60 p-3 rounded-xl flex flex-col gap-1 text-right">
                          <span className="text-[9px] text-amber-500 font-bold block">✓ الحساب المالي المربوط المفعل حالياً:</span>
                          <div className="flex justify-between items-center flex-row-reverse text-xs mt-1">
                            <span className="text-slate-400">مزود الخدمة:</span>
                            <span className="text-amber-400 font-bold">
                              {JORDAN_PAYMENT_PROVIDERS[loggedDriver.linkedPaymentProvider as keyof typeof JORDAN_PAYMENT_PROVIDERS] || loggedDriver.linkedPaymentProvider}
                            </span>
                          </div>
                          <div className="flex justify-between items-center flex-row-reverse text-xs">
                            <span className="text-slate-400">اسم صاحب الحساب:</span>
                            <span className="text-slate-200">{loggedDriver.linkedAccountName}</span>
                          </div>
                          <div className="flex justify-between items-center flex-row-reverse text-xs">
                            <span className="text-slate-400">رقم الهاتف / الحساب:</span>
                            <span className="text-slate-200 font-mono font-bold">{loggedDriver.linkedAccountNumber}</span>
                          </div>
                          {loggedDriver?.linkedPaymentLog && (
                            <div className={`mt-2 p-2 rounded-lg text-right text-[10px] leading-relaxed border ${
                              loggedDriver?.linkedPaymentStatus === 'verified' 
                                ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400' 
                                : 'bg-amber-950/40 border-amber-500/20 text-amber-400'
                            }`}>
                              {loggedDriver.linkedPaymentLog}
                            </div>
                          )}
                          <div className="border-t border-slate-800/80 my-1.5" />
                          <button
                            type="button"
                            onClick={() => {
                              linkPaymentMethod(loggedDriver.id, 'driver', 'zain', '', '');
                              setWalletFeedback('تم إزالة تفاصيل ربط الحساب المالي بنجاح.');
                            }}
                            className="text-center text-[9px] text-rose-400 hover:text-rose-300 underline mt-0.5 cursor-pointer bg-transparent border-none outline-none"
                          >
                            إلغاء ربط هذا الحساب ✕
                          </button>
                        </div>
                      ) : (
                        <div className="bg-slate-900/40 border border-slate-800 p-2.5 rounded-lg text-slate-400 text-center text-[10px] italic">
                          لا يوجد حساب بنكي أو محفظة إلكترونية مربوطة في الوقت الحالي. يرجى ملء النموذج أدناه للتفعيل والربط الآمن.
                        </div>
                      )}

                      {/* Linking Form */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!linkAccountName || !linkAccountNumber) {
                            alert('الرجاء إدخال اسم صاحب الحساب ورقم المحفظة/الحساب بشكل صحيح لربطه');
                            return;
                          }
                          linkPaymentMethod(loggedDriver.id, 'driver', linkProvider, linkAccountName, linkAccountNumber);
                          setWalletFeedback('تهانينا كابتن! تم ربط وتعميد حسابك المالي بنجاح وبشكل آمن في ADAM. يمكنك الآن شحن وسحب رصيدك الفوري بضغطة زر.');
                          setActiveWalletSubTab('details');
                        }}
                        className="flex flex-col gap-2.5 mt-1"
                      >
                        <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex flex-col gap-1">
                          <label className="text-[9px] text-slate-500">اختر البنك أو المحفظة الإلكترونية لربطها</label>
                          <select
                            value={linkProvider}
                            onChange={(e: any) => setLinkProvider(e.target.value)}
                            className="bg-slate-950 text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-800 outline-none w-full text-right"
                          >
                            {Object.entries(JORDAN_PAYMENT_PROVIDERS).map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex flex-col gap-1">
                          <label className="text-[9px] text-slate-500">الاسم الكامل المعتمد بصاحب الحساب</label>
                          <input
                            type="text"
                            required
                            placeholder="الاسم الرباعي المعتمد"
                            value={linkAccountName}
                            onChange={e => setLinkAccountName(e.target.value)}
                            className="bg-transparent text-xs text-slate-100 outline-none text-right font-sans"
                          />
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex flex-col gap-1">
                          <label className="text-[9px] text-slate-500">رقم الهاتف للمحفظة / رقم الآيبان للحساب / معرف كليك</label>
                          <input
                            type="text"
                            required
                            placeholder="رقم الهاتف / الآيبان / المعرف"
                            value={linkAccountNumber}
                            onChange={e => setLinkAccountNumber(e.target.value)}
                            className="bg-transparent text-xs text-slate-100 outline-none font-mono text-right font-bold"
                          />
                        </div>

                         <button
                          type="submit"
                          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2 rounded-xl text-xs transition outline-none cursor-pointer mt-1 border-none"
                        >
                          تفعيل ربط الحساب الآمن وتعميده ⚡
                        </button>
                      </form>
                    </div>
                  )}

                  {activeWalletSubTab === 'rewards' && (
                    <DriverDailyChallengesSection
                      loggedDriver={loggedDriver}
                      rides={rides}
                      scheduledTrips={scheduledTrips}
                      intraCityRides={intraCityRides}
                      walletTransactions={walletTransactions}
                      settings={settings}
                      claimChallengeReward={claimChallengeReward}
                      addWalletTransaction={addWalletTransaction}
                      saveState={saveState}
                    />
                  )}

                  {activeWalletSubTab === 'pin' && (
                    <WalletSecurityDashboard
                      userType="driver"
                      user={loggedDriver}
                      onUpdatePin={(pin) => setUserPin(loggedDriver.id, 'driver', pin)}
                      onUpdateSecuritySettings={(settings) => updateWalletSecuritySettings(loggedDriver.id, 'driver', settings)}
                      themeColor="amber"
                    />
                  )}
                </div>
              )}

              {activeTab === 'settings' && loggedDriver && (
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-right">
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center justify-between flex-row-reverse gap-3">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black text-sm">
                        {loggedDriver.fullName[0] || 'D'}
                      </div>
                      <div className="text-right">
                        <h4 className="text-xs font-black text-slate-100">{loggedDriver.fullName}</h4>
                        <span className="text-[9px] text-slate-500 block font-mono">@{loggedDriver.username}</span>
                      </div>
                    </div>
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[8px] font-bold">
                      حساب كابتن معتمد
                    </span>
                  </div>

                  {/* Profile Form */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-slate-300 border-b border-slate-850 pb-1.5 block flex items-center gap-1 flex-row-reverse">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span>تحديث الملف الشخصي للكابتن</span>
                    </span>

                    {settingsSuccess && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] p-2 rounded-xl font-bold text-center">
                        {settingsSuccess}
                      </div>
                    )}

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const res = updateDriverProfile(loggedDriver.id, editName, editPhone, editEmail, editCarDesc, editPhoto);
                        if (res.success) {
                          setSettingsSuccess(res.msg);
                          setTimeout(() => setSettingsSuccess(''), 3000);
                        }
                      }}
                      className="flex flex-col gap-3"
                    >
                      {/* Interactive Profile Photo Modifier */}
                      <div className="flex flex-col gap-1.5 text-right w-full">
                        <label className="text-[9px] text-slate-500 pr-1">تغيير الصورة الشخصية للبروفايل</label>
                        <div 
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files[0];
                            if (file) {
                              processAndValidateDocument(file, (url) => setEditPhoto(url));
                            }
                          }}
                          className="border border-dashed border-slate-800 hover:border-amber-500/35 transition p-2.5 rounded-xl bg-slate-950/40 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer relative"
                        >
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                processAndValidateDocument(file, (url) => setEditPhoto(url));
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          {editPhoto ? (
                            <div className="flex items-center gap-2 flex-row-reverse w-full justify-between">
                              <img src={editPhoto} className="w-10 h-10 object-cover rounded-full border border-amber-400" referrerPolicy="no-referrer" />
                              <span className="text-[8px] text-amber-400 font-mono text-left truncate max-w-[150px]">New_Captain_Photo.png ✓</span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-sans">إفلات صورة بروفايل جديدة هنا أو تصفح</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 text-right">
                        <label className="text-[9px] text-slate-500 pr-1">اسم الكابتن المعتمد</label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="bg-slate-950/60 border border-slate-850 focus:border-amber-550 text-xs text-slate-100 p-2 rounded-xl outline-none font-sans text-right"
                        />
                      </div>

                      <div className="flex flex-col gap-1 x�ܗ�n�6���F�$)Y=��N�v�v��À�ms�HW��F.�&m�˽����A� @,7}�-��(Y�?$4@� ��,~���R��i��j�P�k0�"����i�T������w0��aEPݶ����vx��@�:|�EG�������V_5,3`Ʉ��UX�zf�V��'����I��4�ĥ���䰤��O��w����I��q�%����!j��\6L΋�N긍�m�hCK�.�ӿ�j�nC[8��L��k�g]���2��j� Z_�%.0�b���:�H\!Op�tb��[K0�ؗV�T˥�텢Z]��o�����C��:* P�a��Fṡ/��x�M�ѫhtS�R
s�=��^1��.#�=���9/ACt�_ΣQt�c��4w�{��{wsinP����'���H�����s�G��IlJ	^8l��Z-�|�O�����O��������07���&�����>��
N�Kᣞ�\i��.v�>x
�����Ct���ֳ�2	�����(��㙃�����B?'��?c�jߛW���U�)X�I;���c�����6�{�}�oM��JBW��c���ܶ�uM�@+e�2��*�I����T�}��Q^�l��O��gY}	uI嬲:�u��å�4�9���/���(V�\��W[�N&܉���
�{C<��&�����h��^��Ԕ��A9�nw�;��9 �|��gա��y�ސ=�gO�U;>���UFI�:R�O���P?�M+sF��o���%n��[���,���w�U��u.�'z�.�U��㏖�t3FT�j�ST-�33M�B�*��ݶr��(�T�VǓT�ޯ�T���!�~�����E��N��S�L��={]�Z8�Z�  �� 6��