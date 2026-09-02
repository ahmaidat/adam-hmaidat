import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../stateEngine';
import { usePersistedState, getPersistedGeoLocation, savePersistedGeoLocation } from '../hooks/usePersistedState';
import { DraftOrderManager, PassengerDraftRequest } from '../utils/draftOrderManager';
import { clearUrlQueryParams } from '../utils/hotRefreshManager';
import { motion } from 'motion/react';
import { JORDAN_PAYMENT_PROVIDERS } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getLocationCoords, DEFAULT_LOCATIONS, getGeoCoords, getPreciseCurrentLocation } from '../locationData';
import { IntraCityPassengerPanel } from './IntraCityPassengerPanel';
import { CaptainLiveArrivalIndicator } from './CaptainLiveArrivalIndicator';
import { GoogleCalendarManager } from './GoogleCalendarManager';
import { AiSupportChat } from './AiSupportChat';
import { AiAdBanner } from './AiAdBanner';
import { AiSpatial5DView } from './AiSpatial5DView';
import { WalletSecurityDashboard } from './WalletSecurityDashboard';
import { WalletRechargeSettlementPanel } from './WalletRechargeSettlementPanel';
import { ServiceLaunchBanner, ServiceLaunchGatedModal } from './ServiceLaunchBanner';
import { PassengerDailyChallengesSection } from './PassengerDailyChallengesSection';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Camera, 
  Compass, 
  LogOut, 
  Send, 
  Star, 
  Clock, 
  History, 
  MessageSquare, 
  ChevronRight, 
  Users, 
  CheckCircle, 
  UserPlus, 
  UserMinus, 
  ShieldAlert,
  ShieldCheck,
  Calendar,
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
  Check,
  PlusCircle,
  Car,
  Fingerprint,
  Timer,
  Info,
  Share2,
  Megaphone,
  ChevronDown,
  CalendarDays,
  Plus,
  Minus,
  ArrowUpDown,
  CalendarClock,
  Home
} from 'lucide-react';

interface PassengerAppProps {
  fullWidth?: boolean;
}

export const PassengerApp: React.FC<PassengerAppProps> = ({ fullWidth: initialFullWidth = false }) => {
  const [isFullWidth, setIsFullWidth] = useState<boolean>(initialFullWidth);

  React.useEffect(() => {
    setIsFullWidth(initialFullWidth);
  }, [initialFullWidth]);
  const { 
    passengers, 
    requests,
    rides, 
    messages, 
    settings, 
    scheduledTrips,
    walletTransactions,
    currentPassenger, 
    login, 
    logout, 
    registerPassenger, 
    resetUserPassword,
    createRequest, 
    cancelRideRequest,
    sendChatMessage, 
    submitRating,
    createPassengerScheduledTrip,
    bookScheduledTrip,
    cancelScheduledTrip,
    confirmScheduledTripByPassenger,
    cancelPassengerSeatReservation,
    changeScheduledTripReservationTime,
    addWalletTransaction,
    linkPaymentMethod,
    linkAdditionalPaymentMethod,
    removeAdditionalPaymentMethod,
    redeemWalletPromoCode,
    claimChallengeReward,
    updatePassengerProfile,
    updatePassengerLocation,
    savePassengerFavorites,
    savePassengerFavoriteRoutes,
    updatePassengerAutoRechargeSettings,
    savePassengerEmergencyContacts,
    updateUserPassword,
    language,
    setLanguage,
    t,
    activeCountry,
    intraCityRides,
    createIntraCityRide,
    cancelIntraCityRide,
    createDemoActiveRide,
    lastEndedRideInfo,
    setLastEndedRideInfo,
    aiPlugins,
    commercialAds,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    checkServiceLaunchGate,
    drivers,
    rateIntraCityDriver,
    activeCountryCode,
    setUserPin,
    updateWalletSecuritySettings,
    chargePassenger,
    getAreaRates,
    travelMode,
    setTravelMode,
    currentUser,
    employees,
    verifyAndDepositWalletWithBank
  } = useAppState();

  const [isVerifyingRecharge, setIsVerifyingRecharge] = React.useState(false);
  const [lastRechargeReceipt, setLastRechargeReceipt] = React.useState<{ clearanceCode?: string; verificationLog?: string } | null>(null);

  // Active Employee & Role category filter logic for #passenger-scroll-content
  const activeEmployeeUser = currentUser && (currentUser.role === 'employee' || (currentUser as any).permissions || (currentUser as any).roleCategory) ? currentUser : null;
  const [overrideEmployeeRole, setOverrideEmployeeRole] = React.useState<'Admin' | 'Moderator' | 'Support' | null>(null);

  // Local Time Dynamic Dark Mode State for #passenger-scroll-content
  const [passengerThemeMode, setPassengerThemeMode] = React.useState<'auto' | 'dark' | 'light'>(() => {
    return (localStorage.getItem('adam_passenger_theme') as any) || 'auto';
  });
  const [currentHour, setCurrentHour] = React.useState<number>(() => new Date().getHours());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Automatic night mode trigger after 8 PM (20:00) until 6 AM
  const isAutoNightTime = currentHour >= 20 || currentHour < 6;
  const isDarkModeActive = passengerThemeMode === 'dark' 
    ? true 
    : passengerThemeMode === 'light' 
      ? false 
      : isAutoNightTime;

  const effectiveRoleCategory: 'Admin' | 'Moderator' | 'Support' = overrideEmployeeRole || ((activeEmployeeUser as any)?.roleCategory || (activeEmployeeUser?.username === 'admin' ? 'Admin' : 'Support'));

  const isFieldVisible = (fieldKey: string): boolean => {
    // If no employee user is active and no simulation override is selected, show standard fields
    if (!activeEmployeeUser && !overrideEmployeeRole) return true;

    const roleCat = effectiveRoleCategory;
    if (roleCat === 'Admin') return true;

    const perms = (activeEmployeeUser as any)?.permissions;
    if (perms && perms[fieldKey]) {
      const state = perms[fieldKey];
      if (state === 'hidden') return false;
      if (state === 'enabled' || state === 'disabled') return true;
    }

    if (roleCat === 'Moderator') {
      if (fieldKey === 'aiDeveloperStudio' || fieldKey === 'auditPayments' || fieldKey === 'logs') return false;
      return true;
    }

    if (roleCat === 'Support') {
      if (fieldKey === 'userFeedbacks' || fieldKey === 'passengers' || fieldKey === 'allRides' || fieldKey === 'scheduledTrips') return true;
      return false;
    }

    return true;
  };

  // Filter current active user
  const isPassengerLoggedIn = currentPassenger && currentPassenger.role !== 'admin' && currentPassenger.licenseExpiry === undefined;
  const loggedPassenger = isPassengerLoggedIn ? (passengers.find(p => p.id === currentPassenger.id) || currentPassenger) : null;

  const currency = language === 'en' ? (activeCountry?.currencyEn || 'JOD') : (activeCountry?.currencyAr || 'د.أ');

  // AI Geolocation Detection Simulated States
  const [geoDetecting, setGeoDetecting] = React.useState(true);
  const [geoStatusMsg, setGeoStatusMsg] = React.useState('📡 جاري رصد الإحداثيات الجغرافية وتتبع النطاق...');
  const [detectedCountry, setDetectedCountry] = React.useState('JO');

  React.useEffect(() => {
    setGeoDetecting(true);
    const steps = [
      '📡 جاري البحث عن الأقمار الصناعية المتوفرة...',
      '🤖 الذكاء الاصطناعي يقوم بمطابقة عنوان الـ IP والشبكة المتاحة...',
      '🛰️ فحص خطوط العرض والموقع الفلكي الجاري العمل فيه...',
      `✅ رصد تلقائي بالـ AI: تم تحديد موقعك الجغرافي النشط بنجاح!`
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

  // 🛰️ Uber-Grade Live High-Accuracy Continuous GPS Tracking with LocalStorage Persistence
  useEffect(() => {
    // 1. Instant rehydration from last-known GPS location to avoid any loading lag
    const lastSavedGeo = getPersistedGeoLocation();
    if (lastSavedGeo && loggedPassenger?.id && updatePassengerLocation) {
      updatePassengerLocation(loggedPassenger.id, {
        x: lastSavedGeo.x,
        y: lastSavedGeo.y,
        name: lastSavedGeo.name,
        lat: lastSavedGeo.lat,
        lng: lastSavedGeo.lng,
        accuracy: lastSavedGeo.accuracy
      });
    }

    if (!loggedPassenger || !('geolocation' in navigator)) return;

    let watchId: number | null = null;

    const startPassengerGpsTracking = () => {
      try {
        // Quick one-shot background position fetch for instant precision
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            const projectedY = Math.round(70 + ((33.0 - latitude) * 340) / 3.5);
            const projectedX = Math.round(100 + ((longitude - 35.3) * 250) / 3.2);
            const safeX = Math.max(10, Math.min(480, projectedX));
            const safeY = Math.max(10, Math.min(480, projectedY));

            const updatedLocation = {
              x: safeX,
              y: safeY,
              name: `موقع الراكب المباشر GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
              lat: latitude,
              lng: longitude,
              accuracy: accuracy
            };

            // Save to persistent storage immediately
            savePersistedGeoLocation(updatedLocation);

            if (updatePassengerLocation && loggedPassenger.id) {
              updatePassengerLocation(loggedPassenger.id, updatedLocation);
            }
          },
          () => {},
          { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 }
        );

        // Continuous High Accuracy GPS Watcher
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;

            const projectedY = Math.round(70 + ((33.0 - latitude) * 340) / 3.5);
            const projectedX = Math.round(100 + ((longitude - 35.3) * 250) / 3.2);
            const safeX = Math.max(10, Math.min(480, projectedX));
            const safeY = Math.max(10, Math.min(480, projectedY));

            const updatedLocation = {
              x: safeX,
              y: safeY,
              name: `موقع الراكب المباشر GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) - دقة ${Math.round(accuracy)}m`,
              lat: latitude,
              lng: longitude,
              accuracy: accuracy
            };

            // Persist coordinate updates
            savePersistedGeoLocation(updatedLocation);

            if (updatePassengerLocation && loggedPassenger.id) {
              updatePassengerLocation(loggedPassenger.id, updatedLocation);
            }
          },
          (err) => {
            console.warn('Passenger Live GPS watch notice:', err.message);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 2000,
            timeout: 10000
          }
        );
      } catch (err) {
        console.warn('Passenger GPS watch error:', err);
      }
    };

    startPassengerGpsTracking();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [loggedPassenger?.id, updatePassengerLocation]);

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
  const [rechargeAmount, setRechargeAmount] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [changingTripId, setChangingTripId] = useState<string | null>(null);
  const [targetNewTripId, setTargetNewTripId] = useState<string>('');

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
  const [activeTab, setActiveTab] = useState<'request' | 'active_rides' | 'history' | 'chat' | 'scheduled' | 'wallet' | 'settings' | 'otp'>('request');
  const [translatedChatMsgs, setTranslatedChatMsgs] = useState<Record<string, string>>({});
  const [translatingChatMsgId, setTranslatingChatMsgId] = useState<string | null>(null);
  
  // Live inter-city tracking simulation states
  const [showAdditionalRequestForm, setShowAdditionalRequestForm] = useState<boolean>(false);
  const [isPassengerOnline, setIsPassengerOnline] = useState<boolean>(true);
  const [liveSpeed, setLiveSpeed] = useState(88);
  const [liveProgress, setLiveProgress] = useState(35);
  const [gpsSignal, setGpsSignal] = useState<'stable' | 'optimizing' | 'excellent'>('excellent');

  // 🧹 1. Automatic URL Sanitization & Mode Unlock on initial load
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let hasRestrictiveParams = false;
      const restrictiveKeys = ['airport', 'flight', 'luggage', 'airport_dir', 'sch_time', 'to_gov', 'from_gov', 'stopover'];
      
      restrictiveKeys.forEach(k => {
        if (urlParams.has(k)) {
          hasRestrictiveParams = true;
          urlParams.delete(k);
        }
      });

      if (hasRestrictiveParams) {
        const queryStr = urlParams.toString();
        const newPath = window.location.pathname + (queryStr ? `?${queryStr}` : '') + window.location.hash;
        window.history.replaceState({}, '', newPath);
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    const handleSwitchTab = (e: any) => {
      const mode = e.detail;
      if (mode === 'intercity' || mode === 'intracity') {
        setTravelMode(mode);
        setActiveTab('request');
      }
    };
    window.addEventListener('adam_switch_tab', handleSwitchTab);
    return () => window.removeEventListener('adam_switch_tab', handleSwitchTab);
  }, [setTravelMode]);

  React.useEffect(() => {
    let interval: any = null;
    interval = setInterval(() => {
      setLiveSpeed(prev => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const next = prev + delta;
        return next < 75 ? 75 : next > 100 ? 100 : next;
      });
      setLiveProgress(prev => {
        if (prev >= 90) return 10;
        return prev + 1;
      });
      setGpsSignal(prev => {
        const r = Math.random();
        if (r < 0.15) return 'stable';
        if (r < 0.35) return 'optimizing';
        return 'excellent';
      });
    }, 4000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  React.useEffect(() => {
    const handleAdamNavigate = (e: any) => {
      const tab = e.detail?.tab;
      if (tab) {
        setActiveTab(tab);
      }
    };
    
    const handleAdamVoiceBook = (e: any) => {
      const text = e.detail?.text;
      if (text) {
        handleProcessVoiceCommand(text);
      }
    };

    window.addEventListener('adam-navigate', handleAdamNavigate);
    window.addEventListener('adam-voice-book', handleAdamVoiceBook);
    
    return () => {
      window.removeEventListener('adam-navigate', handleAdamNavigate);
      window.removeEventListener('adam-voice-book', handleAdamVoiceBook);
    };
  }, []);

  const [historyType, setHistoryType] = useState<'all' | 'intercity' | 'intracity'>('all');
  const [ratingTripId, setRatingTripId] = useState<string | null>(null);
  const [ratingVal, setRatingVal] = useState<number>(5);
  const [ratingNote, setRatingNote] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [selectedRatingTags, setSelectedRatingTags] = useState<string[]>([]);
  const [ratingSubmittedId, setRatingSubmittedId] = useState<string | null>(null);
  const [aiRatingSentimentMsg, setAiRatingSentimentMsg] = useState<string>('');
  const [requestMode, setRequestMode] = useState<'instant' | 'select_scheduled'>('instant');
  const [usernameInput, setUsernameInput] = useState(''); // Clear pre-fill for test passenger
  const [passwordInput, setPasswordInput] = useState(''); // Clear pre-fill for test passenger
  const [showReg, setShowReg] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showLaunchGatedModal, setShowLaunchGatedModal] = useState<boolean>(false);
  const launchGateInfo = checkServiceLaunchGate ? checkServiceLaunchGate('passenger') : { isGated: false, msg: '' };
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotFeedback, setForgotFeedback] = useState('');
  const [receivedSmsModal, setReceivedSmsModal] = useState<{ show: boolean; phone: string; username: string; body: string; aiLog?: string } | null>(null);

  // Commercial Ads & Reminders State
  const [selectedAdId, setSelectedAdId] = useState<string>('ad_1');
  const [isAdDropdownOpen, setIsAdDropdownOpen] = useState<boolean>(false);
  const [adReminders, setAdReminders] = useState<Record<string, boolean>>({});
  const [adFeedback, setAdFeedback] = useState<string | null>(null);

  // AI Smart Ad Layout and Obstruction Prevention Engine (الربط الذكي لمنع حجب الحقول والخدمات)
  const [aiSmartAdOptimization, setAiSmartAdOptimization] = useState<boolean>(true);
  const [isAnyFieldFocused, setIsAnyFieldFocused] = useState<boolean>(false);
  const [adLayoutMode, setAdLayoutMode] = useState<'standard' | 'compact' | 'pip' | 'hidden'>('standard');

  React.useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && ['input', 'textarea', 'select'].includes(target.tagName.toLowerCase())) {
        setIsAnyFieldFocused(true);
      }
    };
    const handleFocusOut = (e: FocusEvent) => {
      // Small timeout to allow activeElement to update
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

  const commercialAdsList = (commercialAds || []).filter(
    (ad) => ad.status === 'active' && (ad.target === 'passenger' || ad.target === 'all')
  );

  // E-Wallet Form State
  const [walletNumInput, setWalletNumInput] = useState('');
  const [rechargeAmtInput, setRechargeAmtInput] = useState('');
  const [withdrawAmtInput, setWithdrawAmtInput] = useState('');
  const [transferTargetInput, setTransferTargetInput] = useState('');
  const [transferAmtInput, setTransferAmtInput] = useState('');
  const [walletFeedback, setWalletFeedback] = useState('');
  const [activeWalletSubTab, setActiveWalletSubTab] = useState<'details' | 'recharge' | 'link' | 'rewards' | 'withdraw_transfer' | 'pin'>('details');
  const [pinCodeInput, setPinCodeInput] = useState('');
  const [pinSetupInput, setPinSetupInput] = useState('');
  const [redeemCodeInput, setRedeemCodeInput] = useState('');
  const [redeemStatusMsg, setRedeemStatusMsg] = useState('');
  const [walletFilterType, setWalletFilterType] = useState<string>('all');
  const [walletFilterDate, setWalletFilterDate] = useState<string>('');
  const [rechargeMethod, setRechargeMethod] = useState<'wallet' | 'cliq' | 'bank'>('wallet');
  const [rechargeRoutingStep, setRechargeRoutingStep] = useState<'input' | 'routing' | 'allocated'>('input');
  const [allocatedAccount, setAllocatedAccount] = useState<any>(null);
  const [aiAdvisorText, setAiAdvisorText] = useState<string>('');
  const [loadingAiAdvisor, setLoadingAiAdvisor] = useState<boolean>(false);

  // External Bank & Wallet linkage State
  const [linkProvider, setLinkProvider] = useState<string>('zain');
  const [linkAccountName, setLinkAccountName] = useState('');
  const [linkAccountNumber, setLinkAccountNumber] = useState('');

  // Additional Bank & Wallet linkage State
  const [addExtraAccountProvider, setAddExtraAccountProvider] = useState<string>('zain');
  const [addExtraAccountName, setAddExtraAccountName] = useState('');
  const [addExtraAccountNumber, setAddExtraAccountNumber] = useState('');

  // Scheduled Tab Trip Request State with URL query params and local storage persistence
  const [schFromGov, setSchFromGov] = usePersistedState<string>('adam_psg_schFromGov', '', { syncUrlParam: 'sch_from_gov' });
  const [schFromDist, setSchFromDist] = usePersistedState<string>('adam_psg_schFromDist', '', { syncUrlParam: 'sch_from_dist' });
  const [schFromVillage, setSchFromVillage] = usePersistedState<string>('adam_psg_schFromVillage', '', { syncUrlParam: 'sch_from_village' });
  
  const [schToGov, setSchToGov] = usePersistedState<string>('adam_psg_schToGov', '', { syncUrlParam: 'sch_to_gov' });
  const [schToDist, setSchToDist] = usePersistedState<string>('adam_psg_schToDist', '', { syncUrlParam: 'sch_to_dist' });
  const [schToVillage, setSchToVillage] = usePersistedState<string>('adam_psg_schToVillage', '', { syncUrlParam: 'sch_to_village' });

  const [schSeats, setSchSeats] = usePersistedState<number>('adam_psg_schSeats', 1, { syncUrlParam: 'sch_seats' });
  const [schDateTime, setSchDateTime] = usePersistedState<string>('adam_psg_schDateTime', '', { syncUrlParam: 'sch_time' });
  
  // Date and Time split state for scheduling in advance with precision
  const [schDate, setSchDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // default to tomorrow
    return d.toISOString().split('T')[0];
  });
  const [schTime, setSchTime] = useState<string>('10:00');

  // Bidirectional sync between (schDate, schTime) and schDateTime
  React.useEffect(() => {
    if (schDate && schTime) {
      setSchDateTime(`${schDate}T${schTime}`);
    }
  }, [schDate, schTime]);

  React.useEffect(() => {
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

  // Dynamic Auto-Recharge trigger if balance falls below custom threshold
  React.useEffect(() => {
    if (loggedPassenger && loggedPassenger.autoRechargeEnabled) {
      const threshold = loggedPassenger.autoRechargeThreshold ?? 3.0;
      const rechargeAmount = loggedPassenger.autoRechargeAmount ?? 10.0;
      const currentBalance = loggedPassenger.balance ?? 0;
      
      if (currentBalance < threshold) {
        // Trigger auto-recharge if there is a linked payment method
        if (loggedPassenger.linkedAccountNumber) {
          const provider = loggedPassenger.linkedPaymentProvider || 'wallet';
          const walletNum = loggedPassenger.linkedAccountNumber;
          
          verifyAndDepositWalletWithBank(
            loggedPassenger.id,
            'passenger',
            rechargeAmount,
            `شحن تلقائي ذكي من الحساب المربوط (${provider}: ${walletNum})`,
            loggedPassenger.linkedPaymentProvider === 'cliq' ? 'cliq' : 'wallet',
            `AUTO-RECHARGE-${Date.now().toString().slice(-6)}`
          ).then(res => {
            if (res.success) {
              alert(`⚡ تم تفعيل ميزة الشحن التلقائي وتأكيد وصول الأموال بالذكاء الاصطناعي لحساب الشركة!\nرصيدك المالي انخفض عن الحد المعتمد (${threshold.toFixed(2)} د.أ)، وتم تأكيد تحويل ${rechargeAmount.toFixed(2)} د.أ وشحن محفظتك بنجاح.`);
            }
          });
        }
      }
    }
  }, [loggedPassenger?.balance, loggedPassenger?.autoRechargeEnabled, loggedPassenger?.autoRechargeThreshold, loggedPassenger?.autoRechargeAmount]);

  const [schSuccessMsg, setSchSuccessMsg] = useState('');
  const [schTabMode, setSchTabMode] = useState<'form' | 'driver_trips' | 'my_trips' | 'calendar_sync' | 'daily_pinned'>('daily_pinned');

  // AI Interactive Fast Booking Wizard State
  const [aiFastText, setAiFastText] = useState("");
  const [aiFastLoading, setAiFastLoading] = useState(false);
  const [aiFastResult, setAiFastResult] = useState<{
    type: 'match' | 'create_scheduled' | 'error';
    matchedTrip?: any;
    parsedDetails?: {
      fromGov: string;
      fromDist?: string;
      fromVillage?: string;
      toGov: string;
      toDist?: string;
      toVillage?: string;
      seats: number;
      dateTimeStr: string;
    };
    msg: string;
  } | null>(null);

  const handleAiFastSubmit = async (customPrompt?: string) => {
    const promptToUse = customPrompt || aiFastText;
    if (!promptToUse.trim()) {
      alert("يرجى كتابة طلبك أو الضغط على أحد الاختصارات");
      return;
    }
    setAiFastLoading(true);
    setAiFastResult(null);
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
        const requestedSeats = data.seats || 1;

        const matched = scheduledTrips.find(t => 
          (t.status === 'pending' || t.status === 'accepted') &&
          t.availableSeats >= requestedSeats &&
          t.fromArea.startsWith(fGov) &&
          t.toArea.startsWith(tGov)
        );

        if (matched) {
          setAiFastResult({
            type: 'match',
            matchedTrip: matched,
            parsedDetails: data,
            msg: `🎉 عثرنا على رحلة قائمة متطابقة! التوقيت المبرم: ${matched.departureTime}، وبها كابتن نشط مستعد لإجابتكم.`
          });
        } else {
          setAiFastResult({
            type: 'create_scheduled',
            parsedDetails: data,
            msg: `✨ لم نجد رحلة كابتن نشطة متطابقة لهذا التوقيت بدقة. ما رأيك بتسيير وجدولة رحلة جديدة بالنيابة عنك لينطلق معك الركاب فوراً؟`
          });
        }
      } else {
        setAiFastResult({
          type: 'error',
          msg: data.msg || "عذراً، لم نتمكن من تحديد المدن المستهدفة بالكامل من النص المكتوب."
        });
      }
    } catch (err) {
      console.error(err);
      setAiFastResult({
        type: 'error',
        msg: "عذراً، تعطل الاتصال بخدمة ذكاء جيميناي حالياً للتفكيك السريع."
      });
    } finally {
      setAiFastLoading(false);
    }
  };
  
  // Dynamic inter-city travel calendar view states
  const [schViewFormat, setSchViewFormat] = useState<'list' | 'calendar'>('list');
  const [currentCalendarYear, setCurrentCalendarYear] = useState(() => new Date().getFullYear());
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | null>(null);
  const [selectedTripIdForBooking, setSelectedTripIdForBooking] = useState<string | null>(null);
  const [showCalendarFilter, setShowCalendarFilter] = useState<boolean>(true);

  // Registration Form State
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regIdFrontPhoto, setRegIdFrontPhoto] = useState<string>('');
  const [regIdBackPhoto, setRegIdBackPhoto] = useState<string>('');
  const [regUserPhoto, setRegUserPhoto] = useState<string>('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');
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

  // Trip Request State with LocalStorage & URL Query Params Persistence (Form & Map State Persistence)
  const [fromGov, setFromGov, resetFromGov] = usePersistedState<string>('adam_psg_fromGov', '', { syncUrlParam: 'from_gov' });
  const [fromDist, setFromDist, resetFromDist] = usePersistedState<string>('adam_psg_fromDist', '', { syncUrlParam: 'from_dist' });
  const [fromVillage, setFromVillage, resetFromVillage] = usePersistedState<string>('adam_psg_fromVillage', '', { syncUrlParam: 'from_village' });
  
  const [toGov, setToGov, resetToGov] = usePersistedState<string>('adam_psg_toGov', '', { syncUrlParam: 'to_gov' });
  const [toDist, setToDist, resetToDist] = usePersistedState<string>('adam_psg_toDist', '', { syncUrlParam: 'to_dist' });
  const [toVillage, setToVillage, resetToVillage] = usePersistedState<string>('adam_psg_toVillage', '', { syncUrlParam: 'to_village' });

  const [hasStopover, setHasStopover] = usePersistedState<boolean>('adam_psg_hasStopover', false, { syncUrlParam: 'stopover' });
  const [stopoverGov, setStopoverGov] = usePersistedState<string>('adam_psg_stopoverGov', '', { syncUrlParam: 'stop_gov' });
  const [stopoverDist, setStopoverDist] = usePersistedState<string>('adam_psg_stopoverDist', '', { syncUrlParam: 'stop_dist' });
  const [stopoverVillage, setStopoverVillage] = usePersistedState<string>('adam_psg_stopoverVillage', '', { syncUrlParam: 'stop_village' });
  const [stopoverLandmark, setStopoverLandmark] = usePersistedState<string>('adam_psg_stopoverLandmark', '', { syncUrlParam: 'stop_landmark' });

  const [companionCount, setCompanionCount] = usePersistedState<number>('adam_psg_companionCount', 1, { syncUrlParam: 'seats' });
  const [requestedTime, setRequestedTime] = usePersistedState<string>('adam_psg_req_time', '', { syncUrlParam: 'req_time' });
  const [isSearching, setIsSearching] = useState(false);
  const [errMessage, setErrMessage] = useState('');
  const [successRequestMsg, setSuccessRequestMsg] = useState('');
  const [promoCodeInput, setPromoCodeInput] = usePersistedState<string>('adam_psg_promo', '', { syncUrlParam: 'promo' });
  const [isAirportRide, setIsAirportRide] = usePersistedState<boolean>('adam_psg_is_airport', false, { syncUrlParam: 'airport' });
  const [flightNumberInput, setFlightNumberInput] = usePersistedState<string>('adam_psg_flight_num', '', { syncUrlParam: 'flight' });
  const [luggageCountInput, setLuggageCountInput] = usePersistedState<number>('adam_psg_luggage', 2, { syncUrlParam: 'luggage' });
  const [airportTripDirection, setAirportTripDirection] = usePersistedState<'to_airport' | 'from_airport'>('adam_psg_airport_dir', 'to_airport', { syncUrlParam: 'airport_dir' });
  const [seatsToBookMap, setSeatsToBookMap] = useState<Record<string, number>>({});
  const [schPickupMap, setSchPickupMap] = useState<Record<string, string>>({});
  const [schDropoffMap, setSchDropoffMap] = useState<Record<string, string>>({});
  const [schNoteMap, setSchNoteMap] = useState<Record<string, string>>({});

  // 🔄 Initial Load Fetch & Backend Draft Order Recovery
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [draftBannerNotice, setDraftBannerNotice] = useState<string | null>(null);

  useEffect(() => {
    const passengerId = loggedPassenger?.id || 'psg_ahmad';
    DraftOrderManager.fetchServerDraft(passengerId).then((draft) => {
      if (draft && !hasRestoredDraft) {
        // If current state is empty, restore draft automatically
        if (!fromGov && !toGov && (draft.fromGov || draft.toGov)) {
          if (draft.fromGov) setFromGov(draft.fromGov);
          if (draft.fromDist) setFromDist(draft.fromDist);
          if (draft.fromVillage) setFromVillage(draft.fromVillage);
          if (draft.toGov) setToGov(draft.toGov);
          if (draft.toDist) setToDist(draft.toDist);
          if (draft.toVillage) setToVillage(draft.toVillage);
          if (draft.companionCount) setCompanionCount(draft.companionCount);
          if (draft.promoCode) setPromoCodeInput(draft.promoCode);
          if (draft.isAirportRide !== undefined) setIsAirportRide(draft.isAirportRide);
          if (draft.hasStopover) {
            setHasStopover(true);
            if (draft.stopoverGov) setStopoverGov(draft.stopoverGov);
            if (draft.stopoverDist) setStopoverDist(draft.stopoverDist);
            if (draft.stopoverVillage) setStopoverVillage(draft.stopoverVillage);
            if (draft.stopoverLandmark) setStopoverLandmark(draft.stopoverLandmark);
          }
          setDraftBannerNotice('✨ تم استعادة مسودة طلبك السابقة تلقائياً من السيرفر بنجاح');
          setTimeout(() => setDraftBannerNotice(null), 6000);
        }
        setHasRestoredDraft(true);
      }
    });
  }, [loggedPassenger?.id]);

  // 📝 Auto-Save Draft to Backend & LocalStorage on every input adjustment (Debounced)
  const draftSaveTimeoutRef = useRef<any>(null);
  useEffect(() => {
    if (!fromGov && !toGov) return;

    if (draftSaveTimeoutRef.current) clearTimeout(draftSaveTimeoutRef.current);

    draftSaveTimeoutRef.current = setTimeout(() => {
      const passengerId = loggedPassenger?.id || 'psg_ahmad';
      const draftPayload: PassengerDraftRequest = {
        passengerId,
        fromGov,
        fromDist,
        fromVillage,
        toGov,
        toDist,
        toVillage,
        companionCount,
        travelMode: travelMode === 'intracity' ? 'intracity' : 'intercity',
        isAirportRide,
        flightNumber: flightNumberInput,
        luggageCount: luggageCountInput,
        promoCode: promoCodeInput,
        hasStopover,
        stopoverGov,
        stopoverDist,
        stopoverVillage,
        stopoverLandmark,
        updatedAt: Date.now()
      };
      DraftOrderManager.saveServerDraft(draftPayload);
    }, 600);

    return () => {
      if (draftSaveTimeoutRef.current) clearTimeout(draftSaveTimeoutRef.current);
    };
  }, [
    fromGov, fromDist, fromVillage, 
    toGov, toDist, toVillage, 
    companionCount, travelMode, 
    isAirportRide, flightNumberInput, luggageCountInput, 
    promoCodeInput, hasStopover, stopoverGov, stopoverDist, stopoverVillage, stopoverLandmark,
    loggedPassenger?.id
  ]);

  // AI Smart search suggestions states
  const [isAiSearchingSuggestions, setIsAiSearchingSuggestions] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[] | null>(null);
  const [aiInsights, setAiInsights] = useState<string>('');

  const fetchAiSmartSearchSuggestions = async () => {
    try {
      setIsAiSearchingSuggestions(true);
      const response = await fetch("/api/ai-smart-search-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passengerId: loggedPassenger?.id || "anonymous_psg",
          passengerName: loggedPassenger?.fullName || "راكب آدم",
          availableTrips: scheduledTrips.filter(t => (t.status === 'pending' || t.status === 'accepted') && t.availableSeats > 0 && t.creatorId !== loggedPassenger?.id)
        })
      });
      const data = await response.json();
      if (data.success) {
        setAiSuggestions(data.suggestions || []);
        setAiInsights(data.insights || '');
      } else {
        console.error("Failed to fetch smart search recommendations:", data);
      }
    } catch (e) {
      console.error("AI smart search error:", e);
    } finally {
      setIsAiSearchingSuggestions(false);
    }
  };

  // AI-Assisted One-Click Fast Booking States
  const [aiBookingPromptText, setAiBookingPromptText] = useState<string>('');
  const [isParsingAiBooking, setIsParsingAiBooking] = useState<boolean>(false);
  const [aiBookingExplanation, setAiBookingExplanation] = useState<string>('');
  const [showSchAdvancedFields, setShowSchAdvancedFields] = useState<boolean>(false);

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

  const parseAiBookingPrompt = async () => {
    if (!aiBookingPromptText.trim()) {
      alert("الرجاء كتابة تفاصيل مشوارك أولاً ليقوم الذكاء الاصطناعي بتعبئتها.");
      return;
    }
    try {
      setIsParsingAiBooking(true);
      setAiBookingExplanation('');
      const response = await fetch("/api/ai-parse-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: aiBookingPromptText,
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
        if (data.dateTime) setSchDateTime(data.dateTime);
        if (data.explanation) setAiBookingExplanation(data.explanation);
      } else {
        alert("عذراً، لم نتمكن من تحليل العبارة تلقائياً. يرجى ملء الحقول يدوياً.");
      }
    } catch (error) {
      console.error("AI parsing error:", error);
      alert("حدث خطأ أثناء الاتصال بالذكاء الاصطناعي لتفسير العبارة.");
    } finally {
      setIsParsingAiBooking(false);
    }
  };

  // Adam Intelligent Voice Command Simulation States
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'done' | 'error'>('idle');
  const [voiceFeedback, setVoiceFeedback] = useState('');

  const handleProcessVoiceCommand = (commandText: string) => {
    if (!commandText || commandText.trim().length === 0) return;
    setVoiceTranscript(commandText);
    setVoiceStatus('processing');
    setVoiceFeedback('جاري معالجة الطلب الصوتي ومطابقة الخرائط وربط المحافظ... 🔐');

    setTimeout(() => {
      const lower = commandText.toLowerCase();

      // Check for Intercity trip matching "سموع" / "الكورة" / "إربد" / "الدوار السابع" / "عمان"
      if (
        lower.includes('سموع') || 
        lower.includes('كورة') || 
        lower.includes('الكورة') || 
        lower.includes('إربد') || 
        lower.includes('اربد') || 
        lower.includes('السابع') ||
        lower.includes('عمان')
      ) {
        // Set departure to Samou', Al-Koura, Irbid
        setFromGov('إربد (Irbid)');
        setFromDist('لواء الكورة');
        setFromVillage('سموع');

        // Set arrival to 7th Circle, Qasaba Amman, Amman
        setToGov('عمان (Amman)');
        setToDist('لواء قصبة عمان');
        setToVillage('الدوار السابع');

        setTravelMode('intercity');
        setActiveTab('request');
        setRequestMode('instant');
        setVoiceStatus('done');

        const speechFeedback = 'تم تفعيل ذكاء التعرف الصوتي لـ آدم! نجحنا في رصد نيتك ومطابقة خط السير: من بلدة سموع لواء الكورة إلى الدوار السابع عمان. لقد قمنا بتعبئة نموذج الرحلة التجميعية فوراً. نرجو النقر على زر طلب فوري بالأسفل لتثبيت الرحلة.';
        setVoiceFeedback(speechFeedback);

        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(speechFeedback);
          u.lang = 'ar-JO';
          window.speechSynthesis.speak(u);
        }
      }
      else if (lower.includes('شحن') || lower.includes('محفظ') || lower.includes('رصيد')) {
        // Navigate to E-Wallet Tab
        setActiveTab('wallet');
        setActiveWalletSubTab('details');
        setRechargeAmtInput('50');
        setVoiceStatus('done');

        const speechFeedback = 'مرحباً بك في البوابة المالية! قمنا بتوجيهك فوراً إلى صغحة رصيد المحفظة مع تعبئة قيمة خمسين دينار أردني. تفضل بتأكيد عملية الدفع بكل سهولة.';
        setVoiceFeedback(speechFeedback);

        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(speechFeedback);
          u.lang = 'ar-JO';
          window.speechSynthesis.speak(u);
        }
      }
      else if (lower.includes('سر') || lower.includes('كلمة السر') || lower.includes('المرور')) {
        // Navigate to Settings Tab
        setActiveTab('settings');
        setVoiceStatus('done');

        const speechFeedback = 'تم رصد رغبتك الأمنية! قمنا بفتح صفحة الإعدادات وتوجيهك مباشرة إلى بند تحديث كلمة السر الفوري. أمانك هو أولويتنا القصوى.';
        setVoiceFeedback(speechFeedback);

        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(speechFeedback);
          u.lang = 'ar-JO';
          window.speechSynthesis.speak(u);
        }
      }
      else {
        // Default smart fallback or match other Jordanian governorate if possible, else error
        setVoiceStatus('done');
        const speechFeedback = `استقبلت أمرك الصوتي: "${commandText}". تم فحص الطلب لربطه بخوارزمية آدم الذكية ولكن يرجى استخدام القوالب الصوتية الجاهزة بالأسفل لمحاكاة دقيقة تتبع الأنماط المعتمدة.`;
        setVoiceFeedback(speechFeedback);

        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(speechFeedback);
          u.lang = 'ar-JO';
          window.speechSynthesis.speak(u);
        }
      }
    }, 1600);
  };

  const handleStartVoiceRecording = () => {
    // Attempt actual browser speech recognition in Arabic! Excellent for premium demo!
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.lang = 'ar-JO';
        rec.interimResults = false;
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          setVoiceStatus('listening');
          setVoiceTranscript('جاري الاستماع لصوتك العذب الآن... تحدث بحرية متناهية 🎙️');
          setVoiceFeedback('');
        };

        rec.onerror = (err: any) => {
          console.error(err);
          setVoiceStatus('error');
          setVoiceFeedback('تنبيه: تعذر التقاط التردد الصوتي الفعلي. لا تقلق، يمكنك نقر أحد النماذج الجاهزة أو كتابة أمرك الصوتي هنا يدوياً.');
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
      // Fallback fallback simulated listening
      setVoiceStatus('listening');
      setVoiceTranscript('جاري الاستماع (تكلم الآن، أو اختر أمراً جاهزاً من القائمة أدناه)');
      setVoiceFeedback('');
    }
  };

  // Filter States for Scheduled Trips Search
  const [filterGov, setFilterGov] = useState<string>('');
  const [filterDist, setFilterDist] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterTime, setFilterTime] = useState<string>('');
  const [filterAvailableOnly, setFilterAvailableOnly] = useState<boolean>(false);
  const [filterVehicleType, setFilterVehicleType] = useState<string>('all'); // 'all' | 'ev' | 'hybrid' | 'sedan'
  const [filterAirportOnly, setFilterAirportOnly] = useState<boolean>(false);
  const [schVehicleType, setSchVehicleType] = useState<string>('all'); // Preferred vehicle type in booking form
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
      // 7. Vehicle Type Filter (نوع المركبة: كهرباء، هايبرد، سيدان)
      if (filterVehicleType && filterVehicleType !== 'all') {
        const driverObj = t.driverId ? drivers.find(d => d.id === t.driverId) : null;
        const carTypeStr = (driverObj?.carType || t.carType || t.preferredVehicleType || t.vehicleType || '').toLowerCase();

        if (filterVehicleType === 'ev') {
          const isEv = carTypeStr.includes('كهرباء') || carTypeStr.includes('ev') || carTypeStr.includes('electric') || 
                       carTypeStr.includes('تسلا') || carTypeStr.includes('tesla') || carTypeStr.includes('id.4') || 
                       carTypeStr.includes('id4') || carTypeStr.includes('byd') || carTypeStr.includes('يونيك') || 
                       carTypeStr.includes('ioniq') || carTypeStr.includes('e-tron');
          if (!isEv) return false;
        } else if (filterVehicleType === 'hybrid') {
          const isHybrid = carTypeStr.includes('هايبرد') || carTypeStr.includes('هجين') || carTypeStr.includes('hybrid') || 
                           carTypeStr.includes('بريوس') || carTypeStr.includes('prius') || carTypeStr.includes('نيرو') || 
                           carTypeStr.includes('niro') || carTypeStr.includes('كامري') || carTypeStr.includes('camry') ||
                           carTypeStr.includes('سوناتا') || carTypeStr.includes('sonata');
          if (!isHybrid) return false;
        } else if (filterVehicleType === 'sedan') {
          const isSedan = carTypeStr.includes('سيدان') || carTypeStr.includes('sedan') || carTypeStr.includes('صالون') || 
                          carTypeStr.includes('سيراتو') || carTypeStr.includes('cerato') || carTypeStr.includes('إلنترا') || 
                          carTypeStr.includes('elantra') || carTypeStr.includes('أريزو') || carTypeStr.includes('arrizo') ||
                          carTypeStr.includes('تويوتا') || carTypeStr.includes('كيا') || carTypeStr.includes('هيونداي') || 
                          carTypeStr.includes('هوندا') || carTypeStr.includes('كامري') || carTypeStr.includes('سوناتا');
          if (!isSedan) return false;
        }
      }
      // 8. Airport VIP Category Rides Only Filter
      if (filterAirportOnly) {
        const isAirport = t.isAirportRide || t.isAirportTrip || (t.fromArea && t.fromArea.includes('مطار')) || (t.toArea && t.toArea.includes('مطار')) || (t.category === 'airport');
        if (!isAirport) return false;
      }
      return true;
    });
  };

  // Rating State
  const [driverRatingScore, setDriverRatingScore] = useState(5);
  const [driverRatingNote, setDriverRatingNote] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Chat state
  const [chatText, setChatText] = useState('');
  const [supportSubTab, setSupportSubTab] = useState<'admin' | 'ai'>('ai');

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

  // Quick Replies State
  const [quickReplies, setQuickReplies] = useState<string[]>(() => {
    const saved = localStorage.getItem('adam_passenger_quick_replies');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      'السلام عليكم، أنا في مكان الانتظار.',
      'أنا جاهز وموجود بالشارع.',
      'كم تحتاج من الوقت للوصول؟',
      'تأخرت قليلاً، سأصل خلال دقيقتين.',
      'شكراً لك كابتن، يعطيك العافية.'
    ];
  });
  const [newQuickReply, setNewQuickReply] = useState('');
  const [showQuickReplyInput, setShowQuickReplyInput] = useState(false);

  const addQuickReply = (text: string) => {
    if (!text.trim()) return;
    const updated = [...quickReplies, text.trim()];
    setQuickReplies(updated);
    localStorage.setItem('adam_passenger_quick_replies', JSON.stringify(updated));
    setNewQuickReply('');
    setShowQuickReplyInput(false);
  };

  const deleteQuickReply = (idx: number) => {
    const updated = quickReplies.filter((_, i) => i !== idx);
    setQuickReplies(updated);
    localStorage.setItem('adam_passenger_quick_replies', JSON.stringify(updated));
  };

  // Settings Tab State
  const [prefSms, setPrefSms] = useState(true);
  const [prefChat, setPrefChat] = useState(true);
  const [prefReminders, setPrefReminders] = useState(true);

  // Profile fields editing state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Password changing forms:
  const [newPassengerPasswordInput, setNewPassengerPasswordInput] = useState('');
  const [passengerPasswordFeedback, setPassengerPasswordFeedback] = useState('');

  // Favorite Places States:
  const [favLabelInput, setFavLabelInput] = useState('');
  const [favGov, setFavGov] = useState('');
  const [favDist, setFavDist] = useState('');
  const [favVillage, setFavVillage] = useState('');
  const [favFeedback, setFavFeedback] = useState('');
  const [showQuickSaveFromFavForm, setShowQuickSaveFromFavForm] = useState(false);
  const [showQuickSaveToFavForm, setShowQuickSaveToFavForm] = useState(false);
  const [quickSaveFromLabel, setQuickSaveFromLabel] = useState('');
  const [quickSaveToLabel, setQuickSaveToLabel] = useState('');

  // Favorite Routes States:
  const [favRouteLabel, setFavRouteLabel] = useState('');
  const [favRouteFromGov, setFavRouteFromGov] = useState('');
  const [favRouteFromDist, setFavRouteFromDist] = useState('');
  const [favRouteFromVillage, setFavRouteFromVillage] = useState('');
  const [favRouteToGov, setFavRouteToGov] = useState('');
  const [favRouteToDist, setFavRouteToDist] = useState('');
  const [favRouteToVillage, setFavRouteToVillage] = useState('');
  const [favRouteFeedback, setFavRouteFeedback] = useState('');

  // Emergency Contacts States:
  const [emergencyNameInput, setEmergencyNameInput] = useState('');
  const [emergencyPhoneInput, setEmergencyPhoneInput] = useState('');
  const [emergencyFeedback, setEmergencyFeedback] = useState('');
  const [sosActiveAlert, setSosActiveAlert] = useState(false);
  const [lastSosSentContact, setLastSosSentContact] = useState<string | null>(null);

  // Real-time Fare and Pooling Demand calculation block
  const getLiveFareEstimate = () => {
    if (!fromGov || !toGov) {
      return {
        hasRoute: false,
        baseFarePerSeat: settings.passengerFarePerSeat,
        rawSubtotal: companionCount * settings.passengerFarePerSeat,
        routeOverlapCount: 0,
        poolingDiscount: 0,
        promoDiscount: 0,
        finalEstimate: companionCount * settings.passengerFarePerSeat,
        estimatedDistance: 0,
        estimatedDuration: 0,
        demandLevel: 'low',
        demandLabel: 'اعتيادي 👤'
      };
    }

    const fromAddress = fromVillage ? `${fromGov} - ${fromDist} - ${fromVillage}` : (fromDist ? `${fromGov} - ${fromDist}` : fromGov);
    const toAddress = toVillage ? `${toGov} - ${toDist} - ${toVillage}` : (toDist ? `${toGov} - ${toDist}` : toGov);
    
    // 1. Base fare per seat from pricing engine
    const rates = getAreaRates(fromAddress, toAddress);
    const baseFarePerSeat = rates.fare;
    const rawSubtotal = companionCount * baseFarePerSeat;

    // 2. Geolocation distance & duration estimation
    const fromCoords = getLocationCoords(fromAddress);
    const toCoords = getLocationCoords(toAddress);
    const dx = toCoords.x - fromCoords.x;
    const dy = toCoords.y - fromCoords.y;
    const distPx = Math.sqrt(dx * dx + dy * dy);
    const estimatedDistance = Math.max(12, Math.min(180, Number((distPx * 0.4).toFixed(1))));
    const estimatedDuration = Math.round(estimatedDistance * 1.15);

    // 3. Dynamic Pooling Demand based on actual matching pending requests
    const sameRouteRequests = requests.filter(r => 
      r.passengerId !== loggedPassenger?.id && 
      r.fromArea.startsWith(fromGov) && 
      r.toArea.startsWith(toGov) && 
      r.status === 'pending'
    );
    const routeOverlapCount = sameRouteRequests.length;

    let poolingDiscount = 0;
    let demandLevel: 'low' | 'medium' | 'high' = 'low';
    let demandLabel = 'اعتيادي 👤';

    if (routeOverlapCount >= 2) {
      demandLevel = 'high';
      demandLabel = 'مرتفع جداً 🔥 (مشاركة فائقة)';
      poolingDiscount = rawSubtotal * 0.15; // 15% discount
    } else if (routeOverlapCount === 1) {
      demandLevel = 'medium';
      demandLabel = 'نشط 📈 (ربط تجميعي متوفر)';
      poolingDiscount = rawSubtotal * 0.10; // 10% discount
    } else {
      demandLevel = 'low';
      demandLabel = 'اعتيادي 👤 (جاهز للتجميع)';
    }

    // 4. Promo Code Validation
    let promoDiscount = 0;
    let promoOffer = null;
    let promoErrorMsg = '';

    if (promoCodeInput && promoCodeInput.trim() !== '') {
      const codeClean = promoCodeInput.trim().toUpperCase();
      const offer = settings.systemOffers?.find(o => o.code === codeClean && o.isActive && (o.targetType === 'passenger' || o.targetType === 'both'));
      if (offer) {
        const currentPriceAfterPool = rawSubtotal - poolingDiscount;
        const isIntercityTrip = fromGov !== toGov;
        
        if (offer.travelScope === 'intracity' && isIntercityTrip) {
          promoErrorMsg = 'هذا الكوبون مخصص للرحلات داخل المدينة فقط!';
        } else if (offer.travelScope === 'intercity' && !isIntercityTrip) {
          promoErrorMsg = 'هذا الكوبون مخصص لرحلات السفر بين المحافظات فقط!';
        } else if (offer.minRideAmount && currentPriceAfterPool < offer.minRideAmount) {
          promoErrorMsg = `الحد الأدنى للخصم هو ${offer.minRideAmount} د.أ`;
        } else {
          promoOffer = offer;
          if (offer.discountType === 'percentage') {
            promoDiscount = currentPriceAfterPool * (offer.value / 100);
          } else {
            promoDiscount = offer.value;
          }
          promoDiscount = Math.min(currentPriceAfterPool, promoDiscount);
        }
      }
    }

    if (isAirportRide) {
      const airportPrice = settings.airportRidePrice ?? 25.0;
      return {
        hasRoute: true,
        baseFarePerSeat: airportPrice,
        rawSubtotal: airportPrice,
        routeOverlapCount: 0,
        poolingDiscount: 0,
        promoDiscount,
        finalEstimate: Math.max(0, Number((airportPrice - promoDiscount).toFixed(2))),
        estimatedDistance,
        estimatedDuration,
        demandLevel: 'high' as const,
        demandLabel: 'طلب مطار مميز ✈️',
        promoOffer,
        promoErrorMsg
      };
    }

    const finalEstimate = Math.max(0, Number((rawSubtotal - poolingDiscount - promoDiscount).toFixed(2)));

    return {
      hasRoute: true,
      baseFarePerSeat,
      rawSubtotal,
      routeOverlapCount,
      poolingDiscount,
      promoDiscount,
      finalEstimate,
      estimatedDistance,
      estimatedDuration,
      demandLevel,
      demandLabel,
      promoOffer,
      promoErrorMsg
    };
  };

  const passengerNotifications = loggedPassenger 
    ? notifications.filter(n => n.userId === loggedPassenger.id && n.userType === 'passenger')
    : [];
  const unreadCount = passengerNotifications.filter(n => !n.isRead).length;

  const showCompletedRideModal = !!(loggedPassenger && lastEndedRideInfo && 
    ((lastEndedRideInfo.passengerFares && lastEndedRideInfo.passengerFares[loggedPassenger.id] !== undefined) || 
      lastEndedRideInfo.passengerId === loggedPassenger.id || 
      lastEndedRideInfo.forUserId === loggedPassenger.id) && 
    lastEndedRideInfo.id !== dismissedRideId && !dismissedRideIds.includes(lastEndedRideInfo.id) && !(lastEndedRideInfo && (Date.now() - new Date(lastEndedRideInfo.timestamp || lastEndedRideInfo.completedAt || 0).getTime() > 60 * 60 * 1000)));

  React.useEffect(() => {
    if (loggedPassenger) {
      setEditName(loggedPassenger.fullName);
      setEditPhone(loggedPassenger.phone);
      setEditEmail(loggedPassenger.email);
      setEditPhoto(loggedPassenger.documents?.photo || '');
    }
  }, [loggedPassenger?.id]);

  // Active Ride for this Passenger
  const activeRide = loggedPassenger 
    ? rides.find(r => (r.status !== 'completed') && r.requests.some(req => req.passengerId === loggedPassenger.id)) 
    : null;

  const currentPassengerRequest = activeRide 
    ? activeRide.requests.find(req => req.passengerId === loggedPassenger?.id)
    : null;

  // Comprehensive active rides computation for the logged-in passenger
  const passengerActiveIntraRides = React.useMemo(() => {
    const currentId = loggedPassenger?.id;
    return (intraCityRides || []).filter(
      r => (r.passengerId === currentId || !currentId || r.passengerId === 'psg_ahmad') && 
           (r.status === 'pending' || r.status === 'accepted' || r.status === 'started')
    );
  }, [intraCityRides, loggedPassenger?.id]);

  const passengerActiveInterRide = React.useMemo(() => {
    if (!loggedPassenger?.id) return null;
    return rides.find(
      r => (r.status !== 'completed') && r.requests.some(req => req.passengerId === loggedPassenger.id)
    ) || null;
  }, [rides, loggedPassenger?.id]);

  const passengerActiveInterRequest = React.useMemo(() => {
    if (!loggedPassenger?.id || passengerActiveInterRide) return null;
    return requests.find(
      req => req.passengerId === loggedPassenger.id && 
             (req.status === 'pending' || req.status === 'pooling' || req.status === 'offered' || req.status === 'accepted' || req.status === 'started')
    ) || null;
  }, [requests, loggedPassenger?.id, passengerActiveInterRide]);

  const passengerActiveScheduledBookings = React.useMemo(() => {
    if (!loggedPassenger?.id) return [];
    return (scheduledTrips || []).filter(
      t => t.status !== 'completed' && t.status !== 'cancelled' && 
           (t.creatorId === loggedPassenger.id || t.passengers.some(p => p.passengerId === loggedPassenger.id))
    );
  }, [scheduledTrips, loggedPassenger?.id]);

  const totalPassengerActiveCount = 
    passengerActiveIntraRides.length + 
    (passengerActiveInterRide || passengerActiveInterRequest ? 1 : 0) + 
    passengerActiveScheduledBookings.length;

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
          passengerName: loggedPassenger?.fullName || 'عضو مستخدم',
          driverName: activeRide.driverName || 'آدم',
          status: activeRide.status
        })
      })
      .then(res => {
        if (!res.ok) return null;
        return res.json().catch(() => null);
      })
      .then(data => {
        if (data && data.text) {
          setAiRideSummary(data.text);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSummary(false));
    } else if (!activeRide) {
      setAiRideSummary('');
    }
  }, [activeTab, activeRide?.id, activeRide?.status]);

  // Jordan Governorates reference coordinates match system for Geolocation API
  const GOV_COORDS_REF = [
    {
      governorate: "عمان (Amman)",
      lat: 31.95,
      lon: 35.91,
      districts: [
        { name: "لواء قصبة عمان", lat: 31.95, lon: 35.91, village: "جبل عمان" },
        { name: "لواء الجامعة", lat: 32.01, lon: 35.87, village: "الجبيهة" },
        { name: "لواء ماركا", lat: 31.98, lon: 35.98, village: "ماركا الشمالية" },
        { name: "لواء القويسمة", lat: 31.91, lon: 35.94, village: "القويسمة" }
      ]
    },
    {
      governorate: "إربد (Irbid)",
      lat: 32.55,
      lon: 35.85,
      districts: [
        { name: "لواء قصبة إربد", lat: 32.55, lon: 35.85, village: "الحصن" },
        { name: "لواء بني عبيد", lat: 32.48, lon: 35.89, village: "النعيمة" },
        { name: "لواء الرمثا", lat: 32.56, lon: 36.01, village: "الرمثا" },
        { name: "لواء الكورة", lat: 32.43, lon: 35.73, village: "دير أبي سعيد" }
      ]
    },
    {
      governorate: "الزرقاء (Zarqa)",
      lat: 32.08,
      lon: 36.10,
      districts: [
        { name: "لواء قصبة الزرقاء", lat: 32.08, lon: 36.10, village: "الوسط التجاري" },
        { name: "لواء الرصيفة", lat: 32.02, lon: 36.05, village: "حي الرشيد" },
        { name: "لواء الهاشمية", lat: 32.14, lon: 36.11, village: "الهاشمية" }
      ]
    },
    {
      governorate: "البلقاء (Balqa)",
      lat: 32.04,
      lon: 35.73,
      districts: [
        { name: "لواء قصبة السلط", lat: 32.04, lon: 35.73, village: "السلالم" },
        { name: "لواء عين الباشا", lat: 32.03, lon: 35.83, village: "عين الباشا" },
        { name: "لواء الشونة الجنوبية", lat: 31.89, lon: 35.62, village: "الشونة الجنوبية" }
      ]
    },
    {
      governorate: "المفرق (Mafraq)",
      lat: 32.34,
      lon: 36.21,
      districts: [
        { name: "لواء قصبة المفرق", lat: 32.34, lon: 36.21, village: "المفرق البلد" },
        { name: "لواء الرويشد", lat: 32.50, lon: 38.20, village: "الرويشد البلد" },
        { name: "لواء البادية الشمالية", lat: 32.25, lon: 36.50, village: "صبحا" }
      ]
    },
    {
      governorate: "جرش (Jerash)",
      lat: 32.27,
      lon: 35.89,
      districts: [
        { name: "لواء قصبة جرش", lat: 32.27, lon: 35.89, village: "جرش البلد" },
        { name: "لواء المعراض", lat: 32.25, lon: 35.84, village: "الكتة" }
      ]
    },
    {
      governorate: "عجلون (Ajloun)",
      lat: 32.33,
      lon: 35.75,
      districts: [
        { name: "لواء قصبة عجلون", lat: 32.33, lon: 35.75, village: "عجلون البلد" },
        { name: "لواء كفرنجة", lat: 32.30, lon: 35.70, village: "كفرنجة" }
      ]
    },
    {
      governorate: "مأدبا (Madaba)",
      lat: 31.72,
      lon: 35.79,
      districts: [
        { name: "لواء قصبة مأدبا", lat: 31.72, lon: 35.79, village: "مأدبا البلد" },
        { name: "لواء ذيبان", lat: 31.50, lon: 35.69, village: "ذيبان" }
      ]
    },
    {
      governorate: "الكرك (Karak)",
      lat: 31.18,
      lon: 35.70,
      districts: [
        { name: "لواء قصبة الكرك", lat: 31.18, lon: 35.70, village: "الكرك البلد" },
        { name: "لواء المزار الجنوبي", lat: 31.06, lon: 35.69, village: "المزار" },
        { name: "لواء القصر", lat: 31.31, lon: 35.74, village: "القصر" }
      ]
    },
    {
      governorate: "الطفيلة (Tafilah)",
      lat: 30.84,
      lon: 35.61,
      districts: [
        { name: "لواء قصبة الطفيلة", lat: 30.84, lon: 35.61, village: "الطفيلة البلد" },
        { name: "لواء الحسا", lat: 30.82, lon: 35.98, village: "الحسا" }
      ]
    },
    {
      governorate: "معان (Ma'an)",
      lat: 30.19,
      lon: 35.73,
      districts: [
        { name: "لواء قصبة معان", lat: 30.19, lon: 35.73, village: "معان البلد" },
        { name: "لواء البتراء", lat: 30.32, lon: 35.47, village: "وادي موسى" },
        { name: "لواء الشوبك", lat: 30.52, lon: 35.56, village: "الشوبك" }
      ]
    },
    {
      governorate: "العقبة (Aqaba)",
      lat: 29.53,
      lon: 35.01,
      districts: [
        { name: "لواء قصبة العقبة", lat: 29.53, lon: 35.01, village: "العقبة البلد" },
        { name: "لواء القويرة", lat: 29.80, lon: 35.13, village: "القويرة" }
      ]
    }
  ];

  const [detectingLocation, setDetectingLocation] = useState(false);
  const [detectionSuccess, setDetectionSuccess] = useState<string | null>(null);

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    setErrMessage('');
    setDetectionSuccess(null);

    try {
      const loc = await getPreciseCurrentLocation();
      setDetectingLocation(false);

      if (loc && loc.success) {
        // Find matching governorate from settings
        const matchedGovObj = settings.locations.find(l => 
          l.governorate === loc.governorate || 
          l.governorate.includes(loc.governorate) || 
          loc.governorate.includes(l.governorate.split(' ')[0])
        ) || settings.locations[0];

        const govVal = matchedGovObj ? matchedGovObj.governorate : loc.governorate || "عمان (Amman)";
        setFromGov(govVal);

        // Find matching district
        const matchedDistObj = matchedGovObj?.districts.find(d => 
          d.name === loc.district || 
          d.name.includes(loc.district) || 
          loc.district.includes(d.name.replace('لواء ', ''))
        ) || matchedGovObj?.districts[0];

        const distVal = matchedDistObj ? matchedDistObj.name : loc.district || "لواء قصبة عمان";
        setFromDist(distVal);

        // Find matching village or use real detected neighborhood
        const matchedVillage = matchedDistObj?.villages.find(v => 
          v === loc.village || v.includes(loc.village) || loc.village.includes(v)
        ) || loc.village || matchedDistObj?.villages[0] || "الدوار السابع";

        setFromVillage(matchedVillage);

        setDetectionSuccess(loc.msg || `🎯 تم رصد موقعك الفعلي بدقة: ${loc.formattedAddress}`);
      } else {
        setErrMessage(loc?.msg || '⚠️ تعذر الوصول إلى الـ GPS. يرجى تفعيل إذن الموقع الجغرافي بالمتصفح أو تحديد منطقتك من القوائم.');
      }
    } catch (e: any) {
      setDetectingLocation(false);
      setErrMessage(e?.message || '⚠️ حدث خطأ أثناء محاولة رصد الموقع الجغرافي. يرجى تفعيل الـ GPS.');
    }
  };

  const handleMapClick = (govName: string) => {
    setFromGov(govName);
    setFromDist('');
    setFromVillage('');
    setDetectionSuccess(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrMessage('');
    const res = login(usernameInput, passwordInput, 'passenger');
    if (!res.success) {
      setErrMessage(res.msg);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrMessage('');
    setRegSuccessMsg('');

    if (!regFullName || !regUsername || !regPassword || !regPhone || !regEmail) {
      setErrMessage('يرجى ملء كافة الحقول الأساسية لراكب آدم وتعيين كلمة المرور');
      return;
    }

    // Validate Jordan phone number: must be 10 digits and start with 07
    const jordanPhoneRegex = /^07\d{8}$/;
    if (!jordanPhoneRegex.test(regPhone)) {
      setErrMessage('❌ رقم الهاتف غير صحيح. يجب أن يتكون رقم الهاتف الأردني من 10 أرقام ويبدأ بـ 07 (مثال: 0791234567)');
      return;
    }

    // Require both sides of ID and personal photo to be uploaded
    if (!regIdFrontPhoto || !regIdBackPhoto || !regUserPhoto) {
      setErrMessage('يرجى أولاً إرفاق جميع الصور والمستندات الثبوتية المطلوبة للتحقق (الوجه الأمامي والخلفي وصورتك الشخصية)');
      return;
    }

    const result = registerPassenger({
      username: regUsername,
      fullName: regFullName,
      password: regPassword,
      phone: regPhone,
      email: regEmail,
      country: detectedCountry,
      documents: {
        idFront: regIdFrontPhoto,
        idBack: regIdBackPhoto,
        photo: regUserPhoto
      }
    });

    if (!result.success) {
      setErrMessage(result.msg);
      return;
    }

    setRegSuccessMsg(`✅ تم تقديم طلب تسجيل الراكب بنجاح! حسابك الآن بانتظار مراجعة وتفعيل الإدارة الفيدرالية لشبكة آدم.`);
    
    // Open simulated smartphone SMS notification modal
    setReceivedSmsModal({
      show: true,
      phone: regPhone,
      username: result.generatedUsername || regUsername,
      body: `مرحباً بك في تطبيق آدم للأردن! تم تقديم طلب تسجيلك بنجاح. حسابك الآن قيد المراجعة والتدقيق الإداري من قبل الإدارة، ولن تتمكن من الدخول حتى تتم الموافقة عليه وتفعيله. \n\nاسم الدخول: ${result.generatedUsername}\nكلمة المرور: ${regPassword}`,
      aiLog: result.aiLog
    });

    // Clear form
    setRegFullName('');
    setRegUsername('');
    setRegPassword('');
    setRegPhone('');
    setRegEmail('');
  };

  const handleTripRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setErrMessage('');
    setSuccessRequestMsg('');

    if (!fromVillage || !toVillage) {
      setErrMessage('يرجى تحديد مواقع الانطلاق والوصول والقرية بدقة');
      return;
    }

    const fromAddress = `${fromGov} - ${fromDist} - ${fromVillage}`;
    let toAddress = `${toGov} - ${toDist} - ${toVillage}`;

    if (hasStopover && (stopoverVillage || stopoverLandmark || stopoverDist)) {
      const stopoverParts = [stopoverGov, stopoverDist, stopoverVillage, stopoverLandmark].filter(Boolean).join(' - ');
      toAddress = `${toAddress} (محطة توقف: ${stopoverParts})`;
    }

    if (fromAddress === toAddress) {
      setErrMessage('لا يمكن أن تكون نقطة الانطلاق والوصول متطابقتين تماماً');
      return;
    }

    if (loggedPassenger) {
      const currentBalance = loggedPassenger.balance ?? 0;
      
      if (loggedPassenger.autoRechargeEnabled) {
        const threshold = loggedPassenger.autoRechargeThreshold ?? 3.0;
        const est = getLiveFareEstimate();
        
        if (currentBalance < threshold || currentBalance < est.finalEstimate) {
          const amountToRecharge = loggedPassenger.autoRechargeAmount ?? 10.0;
          const linkedAcc = loggedPassenger.linkedAccountNumber || "079XXXXXXX";
          const linkedMethod = loggedPassenger.linkedPaymentProvider || "wallet";
          
          verifyAndDepositWalletWithBank(
            loggedPassenger.id,
            'passenger',
            amountToRecharge,
            `شحن تلقائي ذكي من حساب الدفع المربوط (${linkedMethod}: ${linkedAcc})`,
            linkedMethod === 'cliq' ? 'cliq' : 'wallet',
            `AUTO-TRIP-${Date.now().toString().slice(-6)}`
          ).then(res => {
            if (res.success) {
              alert(`⚡ تم تفعيل الشحن التلقائي الذكي بالذكاء الاصطناعي وتأكيد تحويل المبلغ لحساب الشركة بنجاح!\nتم شحن محفظتك بمبلغ ${amountToRecharge} د.أ من حساب الدفع المربوط (${linkedMethod}: ${linkedAcc}) لتغطية رحلتك المقدرة بـ ${est.finalEstimate} د.أ.`);
            }
          });
        }
      } else if (currentBalance < 2) {
        if (!window.confirm(`⚠️ تنبيه رصيد محفظة منخفض: رصيدك الحالي هو (${currentBalance.toFixed(2)} د.أ)، وهو أقل من الحد الأدنى المقترح (2 د.أ).\n\nنوصي بشدة بشحن محفظتك الإلكترونية الآن لضمان معالجة وتغطية تكلفة رحلاتك بكفاءة ودون أي تعطيل. هل ترغب بالاستمرار في طلب الرحلة على أي حال؟`)) {
          return;
        }
      }
    }

    if (launchGateInfo.isGated) {
      setShowLaunchGatedModal(true);
      return;
    }

    const res = createRequest(loggedPassenger!.id, fromAddress, toAddress, companionCount, requestedTime, promoCodeInput, isAirportRide);
    if (res.success) {
      setSuccessRequestMsg(res.msg);
      setPromoCodeInput(''); // clear promotional input code on success
      // Clear server and local draft after request submission
      if (loggedPassenger?.id) {
        DraftOrderManager.clearServerDraft(loggedPassenger.id);
      }
    } else {
      setErrMessage(res.msg);
    }
  };

  // Helper dynamic cascade for From location
  const locationsList = settings?.locations || DEFAULT_LOCATIONS;
  const fromProvinceObj = locationsList.find(l => 
    l.governorate === fromGov || 
    l.governorate.includes(fromGov) || 
    (fromGov && fromGov.includes(l.governorate.split(' ')[0]))
  );
  const fromDistrictObj = fromProvinceObj?.districts?.find(d => 
    d.name === fromDist || 
    d.name.includes(fromDist) || 
    (fromDist && fromDist.includes(d.name.replace('لواء ', '')))
  );
  const pickupLocationLabel = fromVillage ? `${fromGov} - ${fromDist} - ${fromVillage}` : (fromDist ? `${fromGov} - ${fromDist}` : fromGov);

  // Helper dynamic cascade for To location
  const toProvinceObj = locationsList.find(l => l.governorate === toGov);
  const toDistrictObj = toProvinceObj?.districts?.find(d => d.name === toDist);

  // Reactive cascading reconciliation for instant and scheduled fields:
  // Automatically validate and harmonize dependent districts/villages when governorate updates
  useEffect(() => {
    if (fromGov && fromProvinceObj) {
      const validDist = fromProvinceObj.districts.some(d => d.name === fromDist || fromDist.includes(d.name.replace('لواء ', '')));
      if (fromDist && !validDist) {
        setFromDist('');
        setFromVillage('');
      }
    }
  }, [fromGov, fromProvinceObj, fromDist]);

  useEffect(() => {
    if (toGov && toProvinceObj) {
      const validDist = toProvinceObj.districts.some(d => d.name === toDist);
      if (toDist && !validDist) {
        setToDist('');
        setToVillage('');
      }
    }
  }, [toGov, toProvinceObj, toDist]);

  // Helper dynamic cascade for Stopover location
  const stopoverProvinceObj = locationsList.find(l => l.governorate === stopoverGov);
  const stopoverDistrictObj = stopoverProvinceObj?.districts?.find(d => d.name === stopoverDist);

  // Helper dynamic cascade for Favorite location
  const favProvinceObj = locationsList.find(l => l.governorate === favGov);
  const favDistrictObj = favProvinceObj?.districts?.find(d => d.name === favDist);

  // Helper dynamic cascades for Favorite Route locations
  const favRouteFromProvinceObj = locationsList.find(l => l.governorate === favRouteFromGov);
  const favRouteFromDistrictObj = favRouteFromProvinceObj?.districts?.find(d => d.name === favRouteFromDist);
  const favRouteToProvinceObj = locationsList.find(l => l.governorate === favRouteToGov);
  const favRouteToDistrictObj = favRouteToProvinceObj?.districts?.find(d => d.name === favRouteToDist);

  // Helper dynamic cascade for Scheduled From location
  const schFromProvinceObj = locationsList.find(l => l.governorate === schFromGov);
  const schFromDistrictObj = schFromProvinceObj?.districts?.find(d => d.name === schFromDist);

  // Helper dynamic cascade for Scheduled To location
  const schToProvinceObj = locationsList.find(l => l.governorate === schToGov);
  const schToDistrictObj = schToProvinceObj?.districts?.find(d => d.name === schToDist);

  return (
    <div className={`PassengerApp w-full h-full ${isFullWidth ? 'max-w-full rounded-none min-h-0 flex-1 border-0 shadow-none my-0' : 'max-w-md rounded-[28px] sm:rounded-[36px] h-[720px] border-0 sm:border-4 sm:border-slate-800 shadow-2xl my-0 sm:my-2 mx-auto'} bg-slate-950 overflow-hidden relative flex flex-col font-sans select-none transition-all duration-300`}>
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
              className="bg-slate-950 hover:bg-slate-800 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold transition cursor-pointer flex items-center gap-1 shadow-sm"
              title="تغيير العرض بين شاشة كاملة ومحاكي هاتف"
            >
              {isFullWidth ? <span>📱 عرض هاتف محاكي</span> : <span>🖥️ العرض الكامل الشامل</span>}
            </button>
          </div>
        </div>
      )}

      {/* Main Screen Frame */}
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-900 text-slate-100">
        
        {/* LOGGED OUT VIEW */}
        {!loggedPassenger ? (
          <div className="flex-1 overflow-y-auto p-5 pb-8 flex flex-col justify-center">
            
            {/* Language Selector Selector */}
            <div className="flex justify-center mb-5" id="passenger-lang-switch">
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
                <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded-xl mx-auto flex items-center justify-center text-white font-black text-xl shadow-lg border border-emerald-400/30">
                  آ
                </div>
              )}
              <h1 className="text-base font-bold text-slate-100 font-sans tracking-tight mt-2 flex justify-center items-center gap-1 flex-row-reverse">
                <span>{t('آدم تطبيق راكب', 'ADAM Passenger App')}</span>
                <span className="text-[9px] bg-emerald-500/25 text-emerald-400 px-1.5 py-0.5 rounded-full font-mono font-bold">APP</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-sans mt-1">
                {t('نظام تجميع الركاب الذكي والأوفر بالأردن', 'Vetted & most affordable instant-pool system in Jordan')}
              </p>
            </div>

            {/* Pre-Launch Registration Announcement Banner */}
            {launchGateInfo.isGated && (
              <ServiceLaunchBanner 
                role="passenger"
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
                    {t('اسم مرور الراكب', 'Passenger Username')}
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
                    نسيت كلمة السر؟ استعدها آلياً عبر SMS
                  </button>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-black py-2.5 rounded-xl font-bold text-xs transition duration-150 font-sans cursor-pointer"
                >
                  {t('تسجيل الدخول الآمن كـ راكب', 'Secure Passenger Login')}
                </button>

                <div className="text-center mt-3 border-t border-slate-800/80 pt-4">
                  <button 
                    type="button" 
                    onClick={() => { setShowReg(true); setErrMessage(''); }}
                    className="text-[11px] text-indigo-400 hover:underline inline-flex items-center gap-1 font-sans"
                  >
                    <span>إنشاء حساب راكب جديد في آدم</span>
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegister} className="flex flex-col gap-3 font-sans h-[380px] overflow-y-auto pr-1">
                <h3 className="text-xs font-bold text-indigo-400 text-right border-b border-slate-800 pb-1 flex justify-end gap-1 items-center">
                  <span>طلب تسجيل راكب جديد</span>
                  <UserPlus className="w-3.5 h-3.5" />
                </h3>

                {/* Full name */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                  <label className="text-[9px] text-slate-500 text-right block">الاسم الرباعي</label>
                  <input 
                    type="text" 
                    value={regFullName} 
                    onChange={e => setRegFullName(e.target.value)}
                    placeholder="أحمد محمد علي العبادي" 
                    className="bg-transparent text-xs w-full text-slate-100 text-right outline-none mt-1"
                    required
                  />
                </div>

                {/* Username */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                  <label className="text-[9px] text-slate-500 text-right block">اسم مرور الفريد</label>
                  <input 
                    type="text" 
                    value={regUsername} 
                    onChange={e => setRegUsername(e.target.value)}
                    placeholder="اسم المستخدم" 
                    className="bg-transparent text-xs w-full text-slate-100 text-right outline-none mt-1 font-mono"
                    required
                  />
                </div>

                {/* Password */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                  <label className="text-[9px] text-slate-500 text-right block">كلمة المرور للدخول</label>
                  <input 
                    type="password" 
                    value={regPassword} 
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="bg-transparent text-xs w-full text-slate-100 text-right outline-none mt-1 font-mono"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                  <label className="text-[9px] text-slate-500 text-right block">الهاتف الخلوي</label>
                  <input 
                    type="tel" 
                    value={regPhone} 
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="0799112233" 
                    className="bg-transparent text-xs w-full text-slate-100 text-right outline-none mt-1 font-mono"
                    required
                  />
                </div>

                {/* Email */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                  <label className="text-[9px] text-slate-500 text-right block">البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    value={regEmail} 
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="ahmad@gmail.com" 
                    className="bg-transparent text-xs w-full text-slate-100 text-right outline-none mt-1 font-mono"
                    required
                  />
                </div>

                {/* Document Attachments */}
                <div className="border border-dashed border-slate-800 p-3 rounded-xl flex flex-col gap-3 bg-slate-950/45">
                  <span className="text-[10px] text-amber-500 text-right font-bold block border-b border-slate-900 pb-1">🗂️ ملف التحقق والهوية الشخصية والبروفايل</span>

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

                  {/* ID Front Side */}
                  <div className="flex flex-col gap-1.5 text-right w-full">
                    <span className="text-[10px] text-slate-300">صورة الهوية (الوجه الأمامي) للراكب <span className="text-red-500">*</span></span>
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) {
                          processAndValidateDocument(file, (url) => setRegIdFrontPhoto(url));
                        }
                      }}
                      className="border border-dashed border-slate-800 hover:border-amber-500/50 transition p-2.5 rounded-lg bg-slate-900/40 text-center flex flex-col items-center justify-center gap-2 cursor-pointer relative"
                    >
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            processAndValidateDocument(file, (url) => setRegIdFrontPhoto(url));
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {regIdFrontPhoto ? (
                        <div className="flex items-center gap-2 flex-row-reverse w-full justify-between">
                          <img src={regIdFrontPhoto} className="w-9 h-9 object-cover rounded border border-slate-800" referrerPolicy="no-referrer" />
                          <span className="text-[9px] text-emerald-400 font-mono text-left truncate max-w-[130px]">ID_Front_Uploaded.png ✓</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[9px] text-slate-400">اسحب صورة وجه الهوية الأول هنا أو اضغط للتصفح</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ID Back Side */}
                  <div className="flex flex-col gap-1.5 text-right w-full">
                    <span className="text-[10px] text-slate-300">صورة الهوية (الوجه الخلفي) للراكب <span className="text-red-500">*</span></span>
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) {
                          processAndValidateDocument(file, (url) => setRegIdBackPhoto(url));
                        }
                      }}
                      className="border border-dashed border-slate-800 hover:border-amber-500/50 transition p-2.5 rounded-lg bg-slate-900/40 text-center flex flex-col items-center justify-center gap-2 cursor-pointer relative"
                    >
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            processAndValidateDocument(file, (url) => setRegIdBackPhoto(url));
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {regIdBackPhoto ? (
                        <div className="flex items-center gap-2 flex-row-reverse w-full justify-between">
                          <img src={regIdBackPhoto} className="w-9 h-9 object-cover rounded border border-slate-800" referrerPolicy="no-referrer" />
                           <span className="text-[9px] text-emerald-400 font-mono text-left truncate max-w-[130px]">ID_Back_Uploaded.png ✓</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[9px] text-slate-400">اسحب صورة وجه الهوية الثاني هنا أو اضغط للتصفح</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personal Profile Photo */}
                  <div className="flex flex-col gap-1.5 text-right w-full">
                    <span className="text-[10px] text-slate-300">الصورة الشخصية للبروفايل الحقيقي للراكب <span className="text-red-500">*</span></span>
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) {
                          processAndValidateDocument(file, (url) => setRegUserPhoto(url));
                        }
                      }}
                      className="border border-dashed border-slate-800 hover:border-amber-500/50 transition p-2.5 rounded-lg bg-slate-900/40 text-center flex flex-col items-center justify-center gap-2 cursor-pointer relative"
                    >
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            processAndValidateDocument(file, (url) => setRegUserPhoto(url));
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {regUserPhoto ? (
                        <div className="flex items-center gap-2 flex-row-reverse w-full justify-between">
                          <img src={regUserPhoto} className="w-9 h-9 object-cover rounded border border-slate-800" referrerPolicy="no-referrer" />
                          <span className="text-[9px] text-emerald-400 font-mono text-left truncate max-w-[130px]">Profile_Photo.png ✓</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[9px] text-slate-400">اسحب صورتك الشخصية للوجه هنا أو اضغط للتصفح</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-bold text-xs"
                >
                  إرسال طلب التسجيل للإدارة 
                </button>

                <button 
                  type="button" 
                  onClick={() => setShowReg(false)}
                  className="text-[10px] text-slate-400 underline"
                >
                  العودة لتسجيل الدخول
                </button>
              </form>
            )}
          </div>
        ) : (
          /* LOGGED IN VIEW */
          <div className="flex-1 overflow-hidden flex flex-col">
            
            {/* Top Compact Status header */}
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => logout('passenger')}
                  className="p-1 px-1.5 rounded bg-red-950/40 text-red-400 hover:bg-red-950/80 transition text-[10px] flex items-center gap-1 font-sans cursor-pointer"
                >
                  <span>خروج</span>
                  <LogOut className="w-2.5 h-2.5" />
                </button>
                {/* 🔔 Notification Bell Button */}
                <button 
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-800 text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                  title="الإشعارات والتنبيهات المجدولة"
                  id="notif_bell_btn"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span id="notif_bell_badge" className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-slate-950 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
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

              {/* Passenger Title info */}
              <div className="text-right flex items-center gap-1.5">
                {/* Mode Switcher Dropdown & Button next to profile */}
                <div className="flex items-center gap-1">
                  <select
                    value={activeTab === 'scheduled' ? 'scheduled' : isAirportRide ? 'airport' : travelMode}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'scheduled') {
                        setTravelMode('all');
                        setIsAirportRide(false);
                        setActiveTab('scheduled');
                      } else if (val === 'airport') {
                        setTravelMode('intercity');
                        setIsAirportRide(true);
                        setActiveTab('request');
                        setToGov('عمان (Amman)');
                        setToDist('الجيزة');
                        setToVillage('مطار الملكة علياء الدولي (QAIA)');
                      } else if (val === 'intracity') {
                        setTravelMode('intracity');
                        setIsAirportRide(false);
                        setActiveTab('request');
                        clearUrlQueryParams();
                      } else if (val === 'intercity') {
                        setTravelMode('intercity');
                        setIsAirportRide(false);
                        setActiveTab('request');
                        clearUrlQueryParams(['airport', 'flight', 'luggage', 'airport_dir']);
                      } else {
                        setTravelMode('all');
                        setIsAirportRide(false);
                        setActiveTab('request');
                        clearUrlQueryParams();
                      }
                    }}
                    title="قائمة منسدلة لاختيار الخدمة فوراً"
                    className="bg-slate-900 border border-slate-750 text-slate-200 text-[10.5px] font-bold rounded-lg px-2 py-1 focus:ring-1 focus:ring-amber-400 focus:border-amber-400 cursor-pointer shadow-sm"
                  >
                    <option value="all">✨ جميع الخدمات</option>
                    <option value="intracity">🏢 داخل المدينة</option>
                    <option value="intercity">🚗 بين المحافظات</option>
                    <option value="airport">✈️ المطار VIP</option>
                    <option value="scheduled">⏰ رحلات مجدولة</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      const modeCycle: ('all' | 'intercity' | 'intracity')[] = ['all', 'intercity', 'intracity'];
                      const currentIndex = modeCycle.indexOf(travelMode as any);
                      const nextMode = modeCycle[(currentIndex + 1) % modeCycle.length];
                      setTravelMode(nextMode);
                      clearUrlQueryParams();
                      if (nextMode === 'intracity' && activeTab === 'scheduled') {
                        setActiveTab('request');
                      }
                    }}
                    title="تبديل سريع لوضع الخدمة"
                    className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm ${
                      travelMode === 'all'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-slate-800'
                        : travelMode === 'intracity' 
                          ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400 hover:bg-slate-800' 
                          : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-slate-800'
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

                  {(!settings.uiControls?.hideHomeButton && !settings.uiControls?.hidePassengerHomeButton) && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('request')}
                      title="الرئيسية"
                      className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm ${
                        activeTab === 'request'
                          ? 'bg-amber-500/25 border-amber-500/50 text-amber-300 shadow'
                          : 'bg-slate-900 border-slate-750 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Home className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  )}
                </div>

                <div className="text-right">
                  <h4 className="text-[10px] font-bold text-slate-200 font-sans tracking-tight flex items-center gap-1 justify-end">
                    <span>{loggedPassenger.fullName.split(' ')[0]}</span>
                    <span className={`text-[8px] font-extrabold px-1 py-0.2 rounded ${isPassengerOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                      {isPassengerOnline ? 'متصل 🟢' : 'غير متصل 🔴'}
                    </span>
                  </h4>
                  <div className="flex items-center gap-1 text-[9px] justify-end">
                    <span className="text-emerald-400 font-bold font-mono text-[9.5px] mr-1">{(loggedPassenger.balance ?? 0).toFixed(2)} د.أ</span>
                    <span className="text-amber-400">★ {loggedPassenger.ratingAverage}</span>
                    <span className="text-slate-500">• {loggedPassenger.tripsCount} رحلات</span>
                  </div>
                </div>

                {/* 📍 Passenger Live Tracking Icon with Avatar Photo & Online/Offline Status Indicator */}
                <button
                  type="button"
                  onClick={() => setIsPassengerOnline(!isPassengerOnline)}
                  className="relative p-0.5 rounded-full border-2 border-emerald-400 bg-slate-900 cursor-pointer hover:scale-105 transition-transform"
                  title={`أيقونة تتبع موقع الراكب - انقر لتغيير الحالة (${isPassengerOnline ? 'متصل 🟢' : 'غير متصل 🔴'})`}
                >
                  <img 
                    src={loggedPassenger.documents?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                    alt="passenger profile tracking icon" 
                    className="w-7 h-7 rounded-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  {/* Status Indicator Dot Over the Avatar Icon */}
                  <span 
                    className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border border-slate-950 flex items-center justify-center text-[7px] font-black z-10 ${
                      isPassengerOnline ? 'bg-emerald-500 text-slate-950 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {isPassengerOnline ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping"></span>
                    ) : (
                      '✕'
                    )}
                  </span>
                </button>
              </div>
            </div>

            {/* NOTIFICATIONS PANEL/OVERLAY */}
            {showNotifications && loggedPassenger && (
              <div 
                id="passenger_notifications_panel" 
                className="mx-4 mt-2 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 max-h-[350px] overflow-y-auto animate-fadeIn select-none z-10"
                dir="rtl"
              >
                <div className="flex justify-between items-center border-b border-indigo-950/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-slate-100 flex items-center gap-1.5 font-sans">
                      🔔 إشعارات الرحلات المجدولة والتنبيهات 
                      {unreadCount > 0 && (
                        <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-mono px-1.5 py-0.2 rounded-full animate-pulse">
                          {unreadCount} جديد
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passengerNotifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          passengerNotifications.forEach(n => markNotificationAsRead(n.id));
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

                {passengerNotifications.length === 0 ? (
                  <div className="text-center py-10 text-[10px] italic text-slate-500 font-sans leading-relaxed">
                    📭 لا توجد إشعارات أو تذكيرات للرحلات حالياً.<br />
                    <span className="text-[8.5px] text-slate-600 mt-1 block">نقوم تلقائياً بتذكيرك بموعد انطلاق رحلاتك المجدولة بـ 30 دقيقة! ⚡</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-slate-500 font-mono">العدد: {passengerNotifications.length}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("هل ترغب في تصفير وحذف كافة إشعاراتك؟")) {
                            clearAllNotifications(loggedPassenger.id);
                          }
                        }}
                        className="text-[8.5px] text-red-400 hover:text-red-350 transition hover:underline cursor-pointer"
                      >
                        🗑️ تفريغ كافة التنبيهات
                      </button>
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {passengerNotifications.map((n) => (
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

            {/* Sub Apps Content scroll wrapper with AI Responsive Grid Layout */}
            <div 
              className={`flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 flex flex-col gap-4 text-right transition-all duration-500 rounded-2xl ${
                isDarkModeActive 
                  ? 'bg-slate-950/95 text-slate-100 shadow-2xl border border-indigo-950/60 ring-1 ring-indigo-500/20' 
                  : 'bg-slate-900/90 text-slate-100 border border-slate-800'
              }`} 
              id="passenger-scroll-content"
            >
              {/* Pre-Launch Registration Announcement Banner */}
              {launchGateInfo.isGated && (
                <ServiceLaunchBanner 
                  role="passenger"
                  launchDateTime={launchGateInfo.launchDateTime}
                  formattedLaunchDate={launchGateInfo.formattedLaunchDate}
                  title={launchGateInfo.title}
                  customMessage={launchGateInfo.customMessage}
                />
              )}

              {/* EMPLOYEE ROLE & PERMISSION CONTEXT INDICATOR */}
              {overrideEmployeeRole && (
                <div className="bg-slate-900 border-2 border-indigo-500/40 p-3 rounded-2xl shadow-xl flex flex-col gap-2 font-sans text-right animate-fadeIn">
                  <div className="flex justify-between items-center flex-row-reverse flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <ShieldCheck className="w-5 h-5 text-indigo-400" />
                      <div>
                        <div className="text-xs font-black text-slate-100 flex items-center gap-1.5 flex-row-reverse">
                          <span>تصفية العناصر داخل الشاشة بناءً على صلاحيات الموظف</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                            effectiveRoleCategory === 'Admin' ? 'bg-purple-950 text-purple-300 border-purple-500/50' :
                            effectiveRoleCategory === 'Moderator' ? 'bg-amber-950 text-amber-300 border-amber-500/50' :
                            'bg-indigo-950 text-indigo-300 border-indigo-500/50'
                          }`}>
                            {effectiveRoleCategory === 'Admin' ? '🛡️ Admin (مدير)' : effectiveRoleCategory === 'Moderator' ? '⚙️ Moderator (مشرف)' : '🎧 Support (دعم)'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          المستخدم المسجل: <span className="text-amber-400 font-bold">@{activeEmployeeUser?.username || 'employee_user'}</span> — تظهر العناصر وتختفي في هذا القسم أوتوماتيكياً حسب دور وصلاحية الموظف.
                        </p>
                      </div>
                    </div>

                    {/* Role switch simulator buttons */}
                    <div className="flex items-center gap-1 flex-row-reverse">
                      <span className="text-[9px] text-slate-400 font-bold ml-1">معاينة الشاشة بدور:</span>
                      <button
                        type="button"
                        onClick={() => setOverrideEmployeeRole('Admin')}
                        className={`px-2 py-1 rounded text-[9.5px] font-bold border cursor-pointer transition ${effectiveRoleCategory === 'Admin' ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                      >
                        🛡️ Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => setOverrideEmployeeRole('Moderator')}
                        className={`px-2 py-1 rounded text-[9.5px] font-bold border cursor-pointer transition ${effectiveRoleCategory === 'Moderator' ? 'bg-amber-600 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                      >
                        ⚙️ Moderator
                      </button>
                      <button
                        type="button"
                        onClick={() => setOverrideEmployeeRole('Support')}
                        className={`px-2 py-1 rounded text-[9.5px] font-bold border cursor-pointer transition ${effectiveRoleCategory === 'Support' ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                      >
                        🎧 Support
                      </button>
                      {overrideEmployeeRole && (
                        <button
                          type="button"
                          onClick={() => setOverrideEmployeeRole(null)}
                          className="px-2 py-1 rounded text-[9.5px] font-bold bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
                        >
                          إلغاء المعاينة
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* WELCOME GREETING BANNER PER ADMIN CONFIG */}
              {!settings.uiControls?.hideWelcomeGreeting && !settings.uiControls?.hidePassengerWelcomeGreeting && (
                <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/40 border border-indigo-500/25 p-3 rounded-2xl flex items-center justify-between shadow-md animate-fadeIn text-right">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <span>👋</span>
                        <span>{settings.uiControls?.passengerWelcomeText || `مرحباً بك، ${loggedPassenger.fullName.split(' ')[0]} 👋`}</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        {t('نتمنى لك رحلة مريحة وممتعة مع شبكة آدم بالأردن', 'Wishing you a safe & enjoyable journey with Adam')}
                      </p>
                    </div>
                  </div>

                  {(!settings.uiControls?.hideHomeButton && !settings.uiControls?.hidePassengerHomeButton) && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('request')}
                      title="الانتقال إلى الرئيسية"
                      className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold border transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        activeTab === 'request'
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Home className="w-3.5 h-3.5 text-amber-400" />
                      <span>الرئيسية</span>
                    </button>
                  )}
                </div>
              )}

              {/* INSTANT POST-TRIP RATING PROMPT BANNER PER USER REQUEST */}
              {isFieldVisible('userFeedbacks') && (() => {
                const unratedRide = intraCityRides.find(r => r.passengerId === loggedPassenger?.id && r.status === 'completed' && !r.driverRatingVal);
                if (unratedRide) {
                  return (
                    <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-emerald-950/60 border-2 border-amber-500 p-4 rounded-2xl flex flex-col gap-3 shadow-xl shadow-amber-950/30 text-right animate-pulse">
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <span className="text-2xl">⭐</span>
                        <div>
                          <h4 className="text-xs font-black text-amber-300">تنبيه تقييم الكابتن والرحلة المنتهية فوراً!</h4>
                          <p className="text-[10px] text-slate-200 mt-0.5 leading-relaxed">
                            انتهى مشوارك مع الكابتن للتو! يرجى تقييم الخدمة وإرسال ملاحظتك الصوتية المباشرة (Voice-to-Text) لضبط جودة الكباتن وسلوكهم على المنصة.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRatingTripId(unratedRide.id);
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2 rounded-xl text-xs w-full cursor-pointer transition shadow text-center"
                      >
                        ✍️ تقييم الكابتن وإرسال الملاحظة الصوتية الآن 🎙️
                      </button>
                    </div>
                  );
                }
                return null;
              })()}

              {/* PERSISTENT ACTIVE RIDES QUICK BANNER (FOR ALL TRANSPORT MODES & TABS) */}
              {totalPassengerActiveCount > 0 && activeTab !== 'active_rides' && (
                <div 
                  id="passenger_active_rides_banner"
                  className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-indigo-950/90 border-2 border-emerald-500/80 p-3.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-3 animate-fadeIn text-right"
                  dir="rtl"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative p-2 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-400 shrink-0">
                      <Car className="w-5 h-5 animate-bounce" />
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-emerald-300">
                          {t(`لديك ${totalPassengerActiveCount} مشوار / رحلة نشطة حالياً ⚡`, `You have ${totalPassengerActiveCount} active ride(s) in progress ⚡`)}
                        </h4>
                        <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
                          نشط الآن
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed">
                        {t('يمكنك متابعة حالة الكابتن الحية، تتبع المسار، أو إلغاء الرحلة بضغطة زر واحدة.', 'Track live captain status, follow GPS route, or cancel your ride with one click.')}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('active_rides')}
                    className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-[11px] shadow-lg shadow-emerald-950/40 transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>{t('عرض وإدارة وإلغاء الرحلات النشطة 👈', 'View, Manage & Cancel Active Rides 👈')}</span>
                  </button>
                </div>
              )}

              {/* AI-POWERED DYNAMIC COMMERCIAL ADS BANNER - Hidden in intracity mode to prevent duplicates */}
              {isFieldVisible('rateManagement') && travelMode !== 'intracity' && (
                <div className="px-1">
                  <AiAdBanner 
                    userType="passenger" 
                    travelMode={travelMode === 'intracity' ? 'intracity' : 'intercity'} 
                    governorate={loggedPassenger?.governorate || 'عمان'}
                    locationName={loggedPassenger?.governorate || 'عمان'}
                    currentActivity={activeRide ? 'راكب في رحلة سفر بين المدن' : 'راكب يتصفح ويحجز الرحلات التشاركية'}
                  />
                </div>
              )}

              {/* ADAM COMMERCIAL PROMO & ADS CENTER - Hidden in intracity mode so it doesn't cover usage screens */}
              {travelMode !== 'intracity' && (() => {
                const currentAd = commercialAdsList.find(a => a.id === selectedAdId) || commercialAdsList[0];
                if (!currentAd) return null;

                const hasActiveRide = !!activeRide || !!(intraCityRides || []).find(r => r.passengerId === loggedPassenger?.id && r.status !== 'completed' && r.status !== 'cancelled');
                // Determine layout mode based on AI smart optimization
                const isOptimized = aiSmartAdOptimization && (isAnyFieldFocused || hasActiveRide);
                const effectiveMode = isOptimized ? 'compact' : adLayoutMode;

                if (effectiveMode === 'hidden') {
                  return (
                    <div className="bg-slate-950 border border-slate-800/60 p-2 rounded-xl flex justify-between items-center flex-row-reverse text-right font-sans">
                      <div className="flex items-center gap-1.5 flex-row-reverse">
                        <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                        <span className="text-[9px] text-slate-400"> can be shown later</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setAdLayoutMode('standard');
                          setAiSmartAdOptimization(false);
                        }}
                        className="text-[8.5px] text-violet-400 font-black hover:underline cursor-pointer"
                      >
                        إظهار العرض 👁️
                      </button>
                    </div>
                  );
                }

                const hasReminder = !!adReminders[currentAd.id];

                return (
                  <div className={`bg-slate-900 border ${isOptimized ? 'border-violet-500/30' : 'border-slate-850'} rounded-2xl p-3.5 flex flex-col gap-3 shadow-lg text-right font-sans relative overflow-hidden transition-all duration-300`}>
                    <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-l from-violet-600 via-indigo-600 to-amber-500"></div>

                    {/* AI Smart Optimization & Controls Header */}
                    <div className="flex justify-between items-center flex-row flex-wrap-reverse gap-2 border-b border-slate-850 pb-2">
                      {/* Left: AI Mode Badges & Toggles */}
                      <div className="flex items-center gap-1.5 flex-row-reverse">
                        <button
                          type="button"
                          onClick={() => setAiSmartAdOptimization(!aiSmartAdOptimization)}
                          className={`flex items-center gap-1 text-[8.5px] px-2 py-1 rounded-lg font-black transition cursor-pointer border ${
                            aiSmartAdOptimization
                              ? 'bg-violet-950/80 border-violet-500/40 text-violet-300'
                              : 'bg-slate-950 border-slate-800 text-slate-450 hover:border-slate-700'
                          }`}
                          title="تفعيل المطابقة التلقائية لتصغير الإعلان عند استخدام لوحة المفاتيح والخدمات لمنع الحجب"
                        >
                          <Sparkles className={`w-3 h-3 ${aiSmartAdOptimization ? 'text-violet-400 animate-pulse' : 'text-slate-500'}`} />
                          <span>تعديل ذكي بالـ AI: {aiSmartAdOptimization ? 'نشط 🟢' : 'معطل 🔴'}</span>
                        </button>

                        {/* Layout Selector dropdown or quick buttons */}
                        <div className="flex bg-slate-950 border border-slate-850 p-0.5 rounded-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setAdLayoutMode('standard');
                              if (aiSmartAdOptimization) setAiSmartAdOptimization(false);
                            }}
                            className={`text-[8.5px] px-1.5 py-0.5 rounded transition ${adLayoutMode === 'standard' && !aiSmartAdOptimization ? 'bg-slate-850 text-white font-extrabold' : 'text-slate-400'}`}
                          >
                            كامل
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdLayoutMode('compact');
                              if (aiSmartAdOptimization) setAiSmartAdOptimization(false);
                            }}
                            className={`text-[8.5px] px-1.5 py-0.5 rounded transition ${adLayoutMode === 'compact' && !aiSmartAdOptimization ? 'bg-slate-850 text-white font-extrabold' : 'text-slate-400'}`}
                          >
                            مدمج
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdLayoutMode('hidden')}
                            className="text-[8.5px] px-1.5 py-0.5 rounded text-rose-400 hover:bg-rose-950/25 transition"
                          >
                            إخفاء
                          </button>
                        </div>
                      </div>

                      {/* Right: Ad Core Title */}
                      <div className="flex items-center gap-1.5 flex-row-reverse">
                        <Megaphone className="w-3.5 h-3.5 text-violet-400" />
                        <div>
                          <h4 className="text-[10px] font-black text-slate-100 flex items-center gap-1 flex-row-reverse">
                            <span>المركز الترويجي والإعلانات</span>
                            {isOptimized && (
                              <span className="text-[7.5px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.2 rounded font-black animate-pulse">
                                AI تفادَى الحجب ⚡
                              </span>
                            )}
                          </h4>
                        </div>
                      </div>
                    </div>

                    {/* AI Smart Message Context Indicator */}
                    {isOptimized && (
                      <div className="bg-violet-950/20 border border-violet-500/20 p-2 rounded-xl text-[8.5px] text-violet-300 text-right flex items-center gap-1.5 flex-row-reverse">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping shrink-0"></span>
                        <p className="m-0 leading-relaxed font-sans">
                          <strong>مساعد تخطيط ADAM الذكي:</strong> تم تحويل الإعلان تلقائياً للوضع المدمج المبسط لترك المساحة كاملة لحقول تعبئة الخدمات وحسابات التعرفة دون أي حجب!
                        </p>
                      </div>
                    )}

                    {/* Standard Layout Rendering */}
                    {effectiveMode === 'standard' && (
                      <div className="flex flex-col gap-3">
                        {/* Selector dropdown inside Full View */}
                        <div className="flex justify-between items-center flex-row-reverse gap-2">
                          <span className="text-[8.5px] text-slate-400">تصفح الرعايات المعتمدة:</span>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setIsAdDropdownOpen(!isAdDropdownOpen)}
                              className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-[9px] px-2.5 py-1 rounded-lg transition flex items-center gap-1 flex-row-reverse cursor-pointer"
                            >
                              <span className="truncate">{currentAd.title}</span>
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            </button>
                            
                            {isAdDropdownOpen && (
                              <div className="absolute left-0 mt-1 w-52 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-40 p-1 flex flex-col gap-0.5 text-right">
                                {commercialAdsList.map((ad) => (
                                  <button
                                    key={ad.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedAdId(ad.id);
                                      setIsAdDropdownOpen(false);
                                    }}
                                    className={`w-full text-right p-1.5 rounded-lg text-[9.5px] transition flex justify-between items-center flex-row-reverse cursor-pointer ${
                                      selectedAdId === ad.id ? 'bg-violet-600/10 text-violet-300 font-bold border border-violet-500/20' : 'text-slate-350 hover:bg-slate-900'
                                    }`}
                                  >
                                    <span className="truncate">{ad.title}</span>
                                    {adReminders[ad.id] && (
                                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[6.5px] px-1 py-0.1 rounded-full font-black scale-90">⏰</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Image/Video Frame */}
                        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black group h-28">
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
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          )}
                          <div className="absolute top-2 right-2 bg-slate-950/85 backdrop-blur-sm border border-slate-800 text-[7px] font-black text-amber-400 px-1.5 py-0.5 rounded-full shadow z-10">
                            {currentAd.badge}
                          </div>
                          <div className="absolute bottom-2 left-2 bg-slate-950/85 backdrop-blur-sm border border-slate-800 text-[7px] font-bold text-slate-300 px-1.5 py-0.5 rounded-full shadow z-10">
                            {currentAd.timeText}
                          </div>
                        </div>

                        {/* Text info */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center flex-row-reverse gap-2">
                            <h4 className="text-xs font-black text-slate-100">{currentAd.title}</h4>
                            {currentAd.companyName && (
                              <span className="text-[7.5px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-black whitespace-nowrap">
                                🏢 {currentAd.companyName}
                              </span>
                            )}
                          </div>
                          <p className="text-[9.5px] text-slate-350 leading-relaxed">{currentAd.description}</p>
                        </div>

                        {/* Actions Grid */}
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (currentAd.id === 'ad_3' || currentAd.buttonText.includes("محفظتك")) {
                                alert("💳 جاري نقلك لربط المحفظة الإلكترونية واستلام المكافأة فورياً!");
                              } else {
                                alert(`🚀 تم تفعيل العرض الترويجي: [ ${currentAd.title} ] بنجاح لمشوارك القادم!`);
                              }
                            }}
                            className="bg-gradient-to-l from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-[9.5px] py-1.5 px-2.5 rounded-xl transition cursor-pointer text-center shadow"
                          >
                            {currentAd.buttonText}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const updatedReminders = { ...adReminders, [currentAd.id]: !hasReminder };
                              setAdReminders(updatedReminders);
                              if (!hasReminder) {
                                setAdFeedback(`⏰ تم تفعيل تذكيرك بالخصم والعرض الترويجي قبل انتهائه بنجاح!`);
                              } else {
                                setAdFeedback(`✓ تم إلغاء التنبيه والتذكير لهذا العرض.`);
                              }
                            }}
                            className={`border font-bold text-[9px] py-1.5 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                              hasReminder 
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/20' 
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                            }`}
                          >
                            <CalendarDays className="w-3 h-3 text-amber-400" />
                            <span>{hasReminder ? 'إلغاء التذكير ⏰' : 'تذكيري بالعرض ⏰'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Compact Layout Rendering (Preventing obstruction entirely) */}
                    {effectiveMode === 'compact' && (
                      <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl flex items-center justify-between flex-row-reverse text-right gap-2 transition-all">
                        <div className="flex items-center gap-2 flex-row-reverse min-w-0 flex-1">
                          {/* Small ad thumb */}
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-800 shrink-0 bg-black">
                            <img 
                              referrerPolicy="no-referrer"
                              src={currentAd.image} 
                              alt={currentAd.title} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 text-right">
                            <div className="flex items-center gap-1 flex-row-reverse justify-start">
                              <span className="text-[9px] text-amber-400 font-extrabold whitespace-nowrap">{currentAd.badge}</span>
                              <span className="text-[9px] text-slate-450">|</span>
                              <span className="text-[10px] text-slate-100 font-bold truncate">{currentAd.title}</span>
                            </div>
                            <p className="text-[8.5px] text-slate-350 truncate m-0 leading-tight">{currentAd.description}</p>
                          </div>
                        </div>

                        {/* Action buttons inside Compact View */}
                        <div className="flex gap-1.5 shrink-0 flex-row-reverse">
                          <button
                            type="button"
                            onClick={() => {
                              if (currentAd.id === 'ad_3' || currentAd.buttonText.includes("محفظتك")) {
                                alert("💳 جاري نقلك لربط المحفظة الإلكترونية واستلام المكافأة فورياً!");
                              } else {
                                alert(`🚀 تم تفعيل العرض الترويجي: [ ${currentAd.title} ] بنجاح لمشوارك القادم!`);
                              }
                            }}
                            className="bg-violet-650 hover:bg-violet-555 text-white font-extrabold text-[8.5px] px-2 py-1.5 rounded-lg transition shrink-0"
                          >
                            تفعيل ⚡
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              // Manually expand to Standard to inspect details
                              setAdLayoutMode('standard');
                              setAiSmartAdOptimization(false);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[8.5px] px-1.5 py-1 rounded-lg font-bold"
                            title="تكبير الإعلان وعرض التفاصيل"
                          >
                            تفاصيل 👁️
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Feedback Alert if active */}
                    {adFeedback && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] p-1.5 rounded-lg text-center flex justify-between items-center flex-row-reverse mt-0.5">
                        <span>{adFeedback}</span>
                        <button onClick={() => setAdFeedback(null)} className="text-slate-400 hover:text-white text-[9px] font-bold cursor-pointer">✕</button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ADAM AI VOICE VOICE COMMAND CONTROL CENTER */}
              {isFieldVisible('aiServicesStrategy') && (
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950/60 border border-indigo-500/30 rounded-2xl p-3.5 flex flex-col gap-3 shadow-lg text-right font-sans">
                  <div className="flex justify-between items-center flex-row-reverse">
                    <div className="flex items-center gap-1.5 flex-row-reverse">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 animate-pulse">
                        <Mic className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black text-slate-100 flex items-center gap-1 flex-row-reverse">
                          <span>المساعد الصوتي الذكي لآدم</span>
                          <span className="text-[7.5px] bg-indigo-505 text-indigo-200 px-1.5 py-0.2 rounded-full font-bold">نشط 🟢</span>
                        </h4>
                        <p className="text-[8.5px] text-indigo-300">أصدر أوامرك لتفعيل الخدمات، شحن المحافظ، أو كتابة خطوط سيرك فوراً!</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsVoiceOpen(!isVoiceOpen)}
                      className="text-[9.5px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
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

                      {/* Predefined Jordanian Commute Phrases to Satisfy Voice simulator requirement */}
                      <div className="text-right">
                        <span className="text-[8.5px] text-amber-500/90 font-bold block mb-1.5">💡 نماذج المحاكاة والتحكم المعتمدة لآدم (انقر للتجرية التلقائية فوراً):</span>
                        <div className="flex flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleProcessVoiceCommand('التنقل بين سموع /لواء الكورة / اربد الى عمان/ لوء القصبة/الدوار السابع')}
                            className="bg-slate-900 hover:bg-slate-850 text-right p-2 rounded-lg text-[9px] text-slate-300 font-sans border border-slate-800 transition truncate cursor-pointer flex justify-between items-center flex-row-reverse"
                          >
                            <span>🛣️ "التنقل بين سموع /لواء الكورة / اربد الى عمان/ لوء القصبة/الدوار السابع"</span>
                            <span className="text-[8px] text-emerald-400 underline font-bold">تجربة ⚡</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleProcessVoiceCommand('يرجى شحن محفظتي الإلكترونية بقيمة خمسين دينار')}
                            className="bg-slate-900 hover:bg-slate-850 text-right p-2 rounded-lg text-[9px] text-slate-300 font-sans border border-slate-800 transition truncate cursor-pointer flex justify-between items-center flex-row-reverse"
                          >
                            <span>💰 "شحن رصيد المحفظة بقيمة 50 دينار"</span>
                            <span className="text-[8px] text-emerald-400 underline font-bold">تجربة ⚡</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleProcessVoiceCommand('تغيير كلمة المرور الشخصية')}
                            className="bg-slate-900 hover:bg-slate-850 text-right p-2 rounded-lg text-[9px] text-slate-300 font-sans border border-slate-800 transition truncate cursor-pointer flex justify-between items-center flex-row-reverse"
                          >
                            <span>🔒 "افتح صفحة تغيير كلمة السر الأمنية"</span>
                            <span className="text-[8px] text-emerald-400 underline font-bold">تجربة ⚡</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Render dynamic AI-Studio generated widgets */}
              {isFieldVisible('aiDeveloperStudio') && aiPlugins?.filter(p => p.status === 'active' && (p.target === 'passenger' || p.target === 'all')).map(p => (
                <div 
                  key={p.id} 
                  className="transition duration-200"
                >
                  <div dangerouslySetInnerHTML={{ __html: p.htmlCode }} />
                </div>
              ))}

              {/* RENDER MASTER SERVICES NAVIGATION HUB AT TOP OF WORKSPACE */}
              {activeTab === 'request' && !activeRide && (
                <div className="flex flex-col gap-2.5 font-sans mb-1" id="master-services-hub">
                  {/* Cascading / Dropdown Service Filter */}
                  <div className="flex items-center justify-between gap-2 bg-slate-950 border border-slate-800/90 p-2 rounded-2xl shadow-inner">
                    <select
                      value={activeTab === 'scheduled' ? 'scheduled' : isAirportRide ? 'airport' : travelMode}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'scheduled') {
                          setTravelMode('all');
                          setIsAirportRide(false);
                          setActiveTab('scheduled');
                        } else if (val === 'airport') {
                          setTravelMode('intercity');
                          setIsAirportRide(true);
                          setActiveTab('request');
                          setToGov('عمان (Amman)');
                          setToDist('الجيزة');
                          setToVillage('مطار الملكة علياء الدولي (QAIA)');
                        } else if (val === 'intracity') {
                          setTravelMode('intracity');
                          setIsAirportRide(false);
                          setActiveTab('request');
                          clearUrlQueryParams();
                        } else if (val === 'intercity') {
                          setTravelMode('intercity');
                          setIsAirportRide(false);
                          setActiveTab('request');
                          clearUrlQueryParams(['airport', 'flight', 'luggage', 'airport_dir']);
                        } else {
                          setTravelMode('all');
                          setIsAirportRide(false);
                          setActiveTab('request');
                          clearUrlQueryParams();
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 cursor-pointer text-right shadow"
                      id="select-service-category"
                    >
                      <option value="all">✨ جميع الخدمات (عرض شامل مفتوح)</option>
                      <option value="intracity">🏢 رحلات داخل المدينة (تكسي فوري ومباشر)</option>
                      <option value="intercity">🚗 رحلات بين المحافظات (تكسي تجميعي اقتصادي)</option>
                      <option value="airport">✈️ رحلات المطار VIP (مطار الملكة علياء الدولي)</option>
                      <option value="scheduled">⏰ الرحلات المجدولة (حجز مسبق)</option>
                    </select>
                    <span className="text-xs font-bold text-slate-300 whitespace-nowrap">🔽 نوع الخدمة:</span>
                  </div>

                  {/* 4 Quick Category Action Cards */}
                  <div className="grid grid-cols-4 gap-1.5 bg-slate-950 border border-slate-800 p-1.5 rounded-2xl shadow-inner">
                    <button
                      type="button"
                      id="tab-service-all"
                      onClick={() => {
                        setTravelMode('all');
                        setIsAirportRide(false);
                        clearUrlQueryParams();
                        setSuccessRequestMsg('✨ تم تفعيل عرض جميع الخدمات في منظومة آدم');
                        setTimeout(() => setSuccessRequestMsg(''), 3000);
                      }}
                      className={`py-2 px-1 rounded-xl font-bold font-sans transition-all text-[10px] cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        travelMode === 'all'
                          ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-1 ring-amber-400'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      <span className="text-xs">✨</span>
                      <span>جميع الخدمات</span>
                    </button>

                    <button
                      type="button"
                      id="tab-service-intercity"
                      onClick={() => {
                        setTravelMode('intercity');
                        setIsAirportRide(false);
                        clearUrlQueryParams(['airport', 'flight', 'luggage', 'airport_dir']);
                        setSuccessRequestMsg('');
                      }}
                      className={`py-2 px-1 rounded-xl font-bold font-sans transition-all text-[10px] cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        travelMode === 'intercity' && !isAirportRide
                          ? 'bg-emerald-500 text-slate-950 shadow-md font-black ring-1 ring-emerald-400'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      <span className="text-xs">🚗</span>
                      <span>بين المدن</span>
                    </button>

                    <button
                      type="button"
                      id="tab-service-intracity"
                      onClick={() => {
                        setTravelMode('intracity');
                        setIsAirportRide(false);
                        clearUrlQueryParams();
                        setSuccessRequestMsg('🏢 تم الانتقال إلى خدمة التنقل المباشر داخل المدينة');
                        setTimeout(() => setSuccessRequestMsg(''), 3000);
                      }}
                      className={`py-2 px-1 rounded-xl font-bold font-sans transition-all text-[10px] cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        travelMode === 'intracity'
                          ? 'bg-indigo-600 text-white shadow-md font-black ring-1 ring-indigo-400'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      <span className="text-xs">🏢</span>
                      <span>داخل المدينة</span>
                    </button>

                    <button
                      type="button"
                      id="tab-service-airport"
                      onClick={() => {
                        setTravelMode('intercity');
                        setIsAirportRide(true);
                        setToGov('عمان (Amman)');
                        setToDist('الجيزة');
                        setToVillage('مطار الملكة علياء الدولي (QAIA)');
                        setSuccessRequestMsg('✈️ تم تفعيل فئة رحلات المطار VIP وتعيين الوجهة لمطار الملكة علياء الدولي');
                        setTimeout(() => setSuccessRequestMsg(''), 4000);
                      }}
                      className={`py-2 px-1 rounded-xl font-bold font-sans transition-all text-[10px] cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        isAirportRide
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md font-black ring-1 ring-purple-400'
                          : 'text-purple-300 hover:text-white hover:bg-purple-950/40'
                      }`}
                    >
                      <span className="text-xs">✈️</span>
                      <span>المطار VIP</span>
                    </button>
                  </div>

                  {/* ALL SERVICES HUB BANNER WHEN travelMode === 'all' */}
                  {travelMode === 'all' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3 flex flex-col gap-2.5 shadow-lg"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                          نظام الخدمات المفتوح ⚡
                        </span>
                        <h4 className="text-xs font-bold text-slate-200 font-sans flex items-center gap-1.5">
                          <span>قائمة خدمات منظومة آدم</span>
                          <span>🌐</span>
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div 
                          onClick={() => {
                            setTravelMode('intercity');
                            setIsAirportRide(false);
                          }}
                          className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 hover:border-emerald-400 cursor-pointer transition-all flex flex-col gap-1 text-right"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">متاح الآن</span>
                            <span className="text-sm">🚗</span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-100">رحلات بين المحافظات</div>
                          <div className="text-[9px] text-slate-400">تكسي تجميعي اقتصادي ذكي مع مشاركة الأجرة</div>
                        </div>

                        <div 
                          onClick={() => {
                            setTravelMode('intracity');
                            setIsAirportRide(false);
                          }}
                          className="p-2.5 rounded-xl bg-slate-950/80 border border-indigo-500/30 hover:border-indigo-400 cursor-pointer transition-all flex flex-col gap-1 text-right"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold">فوري وسريع</span>
                            <span className="text-sm">🏢</span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-100">رحلات داخل المدينة</div>
                          <div className="text-[9px] text-slate-400">طلب سيارة خاصة وفورية مباشرة داخل شوارع مدينتك</div>
                        </div>

                        <div 
                          onClick={() => {
                            setTravelMode('intercity');
                            setIsAirportRide(true);
                            setToGov('عمان (Amman)');
                            setToDist('الجيزة');
                            setToVillage('مطار الملكة علياء الدولي (QAIA)');
                          }}
                          className="p-2.5 rounded-xl bg-slate-950/80 border border-purple-500/30 hover:border-purple-400 cursor-pointer transition-all flex flex-col gap-1 text-right"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold">VIP فاخر</span>
                            <span className="text-sm">✈️</span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-100">رحلات المطار الدولي</div>
                          <div className="text-[9px] text-slate-400">توصيل واستقبال من وإلى مطار الملكة علياء مع تعقب الرحلات</div>
                        </div>

                        <div 
                          onClick={() => {
                            setActiveTab('scheduled');
                          }}
                          className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30 hover:border-amber-400 cursor-pointer transition-all flex flex-col gap-1 text-right"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">حجز مسبق</span>
                            <span className="text-sm">⏰</span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-100">الرحلات المجدولة</div>
                          <div className="text-[9px] text-slate-400">حجز مقعد أو سيارة في أوقات ومواعيد قادمة محددة</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* INTRA-CITY WORKSPACE */}
              {(travelMode === 'all' || travelMode === 'intracity') && activeTab === 'request' && !activeRide && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">خدمة فورية مباشرة ⚡</span>
                    <h3 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                      <span>1. رحلات داخل المدينة (تكسي خاص وسريع)</span>
                      <span>🏢</span>
                    </h3>
                  </div>
                  <IntraCityPassengerPanel
                    loggedPassenger={loggedPassenger}
                    settings={settings}
                    t={t}
                    language={language}
                    setLanguage={setLanguage}
                    intraCityRides={intraCityRides}
                    createIntraCityRide={createIntraCityRide}
                    cancelIntraCityRide={cancelIntraCityRide}
                  />
                </div>
              )}

              {/* CURRENT ACTIVE RIDE PANEL (IF ANY ACTIVE) */}
              {travelMode !== 'intracity' && activeRide ? (
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex flex-col gap-3 shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[8px] tracking-wider rounded-br font-bold">
                    <motion.span
                      key={activeRide.status}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="inline-block"
                    >
                      {activeRide.status === 'offered' ? 'قيد التعيين...' : activeRide.status === 'accepted' ? 'تم القبول ✅' : 'قيد الحركة 🚗'}
                    </motion.span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-100 text-right tracking-tight font-sans">
                    تفاصيل رحلة آدم الجارية
                  </h3>

                  {/* LIVE CAPTAIN ARRIVAL ETA & DISTANCE INDICATOR */}
                  <CaptainLiveArrivalIndicator
                    driverName={activeRide.driverName || 'كابتن آدم المعتمد'}
                    driverPhone={activeRide.driverPhone || '0791234567'}
                    carModel={activeRide.carType || 'تويوتا بريوس (Hybrid)'}
                    carPlate={activeRide.carPlate || '34-89024'}
                    pickupLocation={activeRide.fromArea ? activeRide.fromArea.split('-').pop() : 'موقع الإقلال'}
                    dropoffLocation={activeRide.toArea ? activeRide.toArea.split('-').pop() : 'موقع التنزيل'}
                    status={activeRide.status}
                    initialEtaMinutes={4}
                    initialDistanceKm={1.8}
                    onCallCaptain={() => {
                      alert(`📞 جاري الاتصال المباشر بالكابتن ${activeRide.driverName || 'آدم'}`);
                    }}
                    onOpenChat={() => setActiveTab('chat')}
                    t={t}
                  />

                  {/* High fidelity status transition feedback banner */}
                  {activeRide.status === 'accepted' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0, scale: 0.9 }}
                      animate={{ height: 'auto', opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 180, damping: 15 }}
                      className="bg-emerald-950/80 border border-emerald-500/40 rounded-xl p-2.5 flex items-center justify-between flex-row-reverse text-right gap-2 overflow-hidden"
                    >
                      <div className="bg-emerald-500 text-black p-1 rounded-full animate-bounce shrink-0">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 font-sans">
                        <div className="font-extrabold text-[10px] text-emerald-400">🎉 رائع! تم قبول مشوارك</div>
                        <div className="text-[8.5px] text-slate-300 mt-0.5 leading-relaxed">تطابقت التوصيلة وتم توجيه الكابتن إلى موقع الإقلال المعتمد. يرجى التنسيق معه بالاتصال أو غرف الدردشة بالأسفل.</div>
                      </div>
                    </motion.div>
                  )}

                  {/* Security PIN Display Card for Trip Start Verification */}
                  {activeRide.status === 'accepted' && (() => {
                    const ridePin = activeRide.startOtp || (1000 + (Math.abs(activeRide.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % 9000)).toString();
                    return (
                      <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/90 border-2 border-indigo-500/60 p-4 rounded-2xl flex flex-col gap-2.5 shadow-2xl text-right font-sans my-1 relative overflow-hidden animate-fadeIn">
                        <div className="flex justify-between items-center flex-row-reverse border-b border-indigo-500/30 pb-2">
                          <div className="flex items-center gap-2 flex-row-reverse text-indigo-300 font-extrabold text-xs">
                            <ShieldCheck className="w-4 h-4 text-indigo-400 animate-pulse" />
                            <span>🔒 رمز بدء الرحلة والأمان (PIN)</span>
                          </div>
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                            زوّده للكابتن
                          </span>
                        </div>

                        <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans">
                          يرجى تزويد هـذا الرقم المكون من 4 خانات للكابتن عند ركوبك السيارة ليقوم بإدخاله والبدء بالانطلاق بسلامة الله:
                        </p>

                        <div className="flex justify-center items-center gap-2.5 my-1 dir-ltr">
                          {ridePin.split('').map((digit: string, idx: number) => (
                            <div 
                              key={idx}
                              className="w-11 h-13 bg-indigo-600/30 border-2 border-indigo-400 text-indigo-200 font-mono text-2xl font-black rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 tracking-wider"
                            >
                              {digit}
                            </div>
                          ))}
                        </div>

                        <div className="text-[9.5px] text-slate-400 text-center font-sans">
                          ⚡ هذا الرمز خاص برحلتك الحالية لتوثيق سلامة وصول المركبة والبدء الرسمي.
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex flex-col gap-1.5 text-right font-sans text-[11px] text-slate-300">
                    <div>📍 <strong>الاقلال:</strong> {activeRide.fromArea.split('-').pop()}</div>
                    <div>🏁 <strong>الإنزال:</strong> {activeRide.toArea.split('-').pop()}</div>

                    {/* Automatic Map & Route Integration for Google Maps/Waze */}
                    <div className="bg-slate-950/65 border border-indigo-500/15 p-2 rounded-xl flex flex-col gap-1.5 text-right font-sans my-1">
                      <div className="flex justify-between items-center flex-row-reverse">
                        <span className="text-[9px] text-slate-200 font-extrabold flex items-center gap-1 justify-end font-sans">
                          <span>🗺️ الخرائط المدعومة والتتبع التلقائي:</span>
                        </span>
                        <span className="text-[7.5px] text-indigo-400 bg-indigo-950/40 px-1 rounded font-sans">تكامل فوري</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${getGeoCoords(getLocationCoords(activeRide.fromArea).x, getLocationCoords(activeRide.fromArea).y).lat},${getGeoCoords(getLocationCoords(activeRide.fromArea).x, getLocationCoords(activeRide.fromArea).y).lng}&destination=${getGeoCoords(getLocationCoords(activeRide.toArea).x, getLocationCoords(activeRide.toArea).y).lat},${getGeoCoords(getLocationCoords(activeRide.toArea).x, getLocationCoords(activeRide.toArea).y).lng}&travelmode=driving`}
                          target="_blank"
                          rel="no-referrer"
                          className="bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-400 text-indigo-300 hover:text-white py-1.5 rounded-lg text-[9px] font-bold transition flex items-center justify-center gap-1 cursor-pointer text-center"
                        >
                          📍 خرائط قوقل
                        </a>
                        <a
                          href={`https://waze.com/ul?ll=${getGeoCoords(getLocationCoords(activeRide.toArea).x, getLocationCoords(activeRide.toArea).y).lat},${getGeoCoords(getLocationCoords(activeRide.toArea).x, getLocationCoords(activeRide.toArea).y).lng}&navigate=yes`}
                          target="_blank"
                          rel="no-referrer"
                          onClick={(e) => {
                            const fallback = `https://waze.com/ul?ll=${getGeoCoords(getLocationCoords(activeRide.toArea).x, getLocationCoords(activeRide.toArea).y).lat},${getGeoCoords(getLocationCoords(activeRide.toArea).x, getLocationCoords(activeRide.toArea).y).lng}&navigate=yes`;
                            setTimeout(() => { window.open(fallback, '_blank'); }, 200);
                          }}
                          className="bg-amber-500/20 hover:bg-amber-500 border border-amber-500/20 hover:border-amber-400 text-amber-300 hover:text-slate-950 py-1.5 rounded-lg text-[9px] font-bold transition flex items-center justify-center gap-1 cursor-pointer text-center"
                        >
                          🚗 تطبيق ويز
                        </a>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-slate-950/45 p-2 rounded-xl border border-slate-800/60 flex-row-reverse mt-1">
                      <span>👥 <strong>المقاعد المحجوزة:</strong> {currentPassengerRequest?.seatsCount} أشخاص</span>
                      <span className="text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-mono">
                        💵 التكلفة: {(currentPassengerRequest?.seatsCount || 1) * settings.passengerFarePerSeat} د.أ
                      </span>
                    </div>
                  </div>

                  {/* Time estimates */}
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center text-[10px] text-slate-300">
                    <div className="text-right">
                      <div className="text-slate-500 text-[8px]">الوصول المتوقع</div>
                      <div className="font-bold text-emerald-400">{activeRide.etaEnd || '--:--'}</div>
                    </div>
                    <div className="h-6 w-[1px] bg-slate-800"></div>
                    <div className="text-right">
                      <div className="text-slate-500 text-[8px]">الانطلاق الفعلي</div>
                      <div className="font-bold text-emerald-400">{activeRide.etaStart || '--:--'}</div>
                    </div>
                  </div>

                  {/* REAL-TIME LIVE TRACKING ROAD MAP (INTERCITY SPECIFIC) */}
                  <div className="relative w-full h-36 bg-[#04060f] rounded-xl border border-slate-800/80 overflow-hidden flex flex-col justify-between p-2">
                    {/* Top Stats Banner */}
                    <div className="flex justify-between items-center w-full flex-row-reverse text-[9px] font-mono z-10">
                      <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        {t(`رادار GPS نشط (${liveSpeed} كم/س)`, `GPS Live Speed (${liveSpeed} km/h)`)}
                      </span>
                      <span className="text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded flex items-center gap-1 flex-row-reverse">
                        <span>📡 {t('إشارة القمر:', 'Satellite:')}</span>
                        <span className="text-indigo-400 font-black">{gpsSignal === 'excellent' ? 'ممتازة 📶' : gpsSignal === 'stable' ? 'مستقرة 📶' : 'تحديث 🔄'}</span>
                      </span>
                    </div>

                    {/* Interactive Road Line Tracing */}
                    <div className="absolute inset-0 flex items-center justify-center p-3">
                      <svg className="w-full h-full" viewBox="0 0 300 100">
                        {/* Shimmering Route Highway Path */}
                        <path 
                          d="M 25,50 Q 75,10 150,50 T 275,50" 
                          fill="none" 
                          stroke="#1e293b" 
                          strokeWidth="8" 
                          strokeLinecap="round"
                        />
                        <path 
                          d="M 25,50 Q 75,10 150,50 T 275,50" 
                          fill="none" 
                          stroke="#312e81" 
                          strokeWidth="4" 
                          strokeLinecap="round"
                          strokeDasharray="4 4"
                        />
                        <path 
                          d="M 25,50 Q 75,10 150,50 T 275,50" 
                          fill="none" 
                          stroke="#6366f1" 
                          strokeWidth="2" 
                          strokeLinecap="round"
                          strokeDasharray="6 4"
                          className="opacity-80"
                        />

                        {/* Starting Node */}
                        <circle cx="25" cy="50" r="5" fill="#3b82f6" />
                        <circle cx="25" cy="50" r="10" fill="none" stroke="#3b82f6" strokeWidth="1" className="animate-ping" />
                        
                        {/* Ending Node */}
                        <circle cx="275" cy="50" r="5" fill="#10b981" />

                        {/* Moving Car Node along the road spline path */}
                        {(() => {
                          const tVal = liveProgress / 100;
                          let carX = 25 + tVal * 250;
                          let carY = 50;
                          if (tVal < 0.5) {
                            const nt = tVal / 0.5; // 0 to 1
                            const p0x = 25, p0y = 50;
                            const p1x = 75, p1y = 10;
                            const p2x = 150, p2y = 50;
                            carX = (1-nt)*(1-nt)*p0x + 2*(1-nt)*nt*p1x + nt*nt*p2x;
                            carY = (1-nt)*(1-nt)*p0y + 2*(1-nt)*nt*p1y + nt*nt*p2y;
                          } else {
                            const nt = (tVal - 0.5) / 0.5; // 0 to 1
                            const p0x = 150, p0y = 50;
                            const p1x = 212.5, p1y = 90;
                            const p2x = 275, p2y = 50;
                            carX = (1-nt)*(1-nt)*p0x + 2*(1-nt)*nt*p1x + nt*nt*p2x;
                            carY = (1-nt)*(1-nt)*p0y + 2*(1-nt)*nt*p1y + nt*nt*p2y;
                          }

                          return (
                            <g>
                              <circle cx={carX} cy={carY} r="12" fill="url(#radar-glow-intercity)" className="opacity-80" />
                              <circle cx={carX} cy={carY} r="4" fill="#facc15" stroke="#000" strokeWidth="1" />
                              <circle cx={carX} cy={carY} r="8" fill="none" stroke="#facc15" strokeWidth="1" className="animate-ping" />
                            </g>
                          );
                        })()}

                        <defs>
                          <radialGradient id="radar-glow-intercity" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="rgba(250, 204, 21, 0.4)" />
                            <stop offset="100%" stopColor="rgba(250, 204, 21, 0)" />
                          </radialGradient>
                        </defs>
                      </svg>
                    </div>

                    {/* Bottom HUD Labels */}
                    <div className="flex justify-between items-center w-full text-[8.5px] font-sans font-extrabold z-10 px-1 mt-auto">
                      <span className="text-slate-400 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                        <span>🏁 {activeRide.toArea.split('-').pop()}</span>
                      </span>
                      <span className="text-indigo-400 bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-500/20 font-mono">
                        {t(`الموقع: قيد العبور السريع`, `Position: Crossing highway`)}
                      </span>
                      <span className="text-slate-400 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                        <span>📍 {activeRide.fromArea.split('-').pop()}</span>
                      </span>
                    </div>
                  </div>

                  {/* Driver matching details */}
                  {activeRide.driverId ? (
                    (() => {
                      const driverObj = id => { return { fullName: 'كابتن خليل', carType: 'تويوتا بريوس', carPlate: '34-89024', documents: { photo: '' } }; }; // Fallback
                      // Let's retrieve actual driver
                      const actualDriver = activeRide.driverId; // we need full details
                      return (
                        <div className="border-t border-slate-800/80 pt-3 flex flex-row-reverse items-center justify-between">
                          <div className="text-right font-sans text-[10px] text-slate-400">
                            <div className="font-bold text-indigo-300">السائق المكلف بالرحلة</div>
                            <div className="text-slate-300 select-all font-sans my-0.5">السيارة: Toyota Prius [34-89024]</div>
                          </div>
                          <span className="text-emerald-400 text-xs animate-pulse font-sans">معك في الطريق 📱</span>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="border-t border-slate-800/80 pt-2.5 text-center text-[11px] text-indigo-400 flex flex-col items-center gap-1.5 animate-pulse">
                      <span>جاري البحث عـن سائق متاح وتجميع ركاب مقتربين...</span>
                      <div className="w-16 h-1 rounded bg-indigo-500/20 overflow-hidden relative">
                        <div className="h-full bg-indigo-400 w-1/2 rounded absolute left-1/4 animate-bounce"></div>
                      </div>
                    </div>
                  )}

                  {/* ADVANCED SOS & SAFETY CENTER */}
                  <div className="bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 p-3 rounded-xl flex flex-col gap-2 transition text-right mt-1">
                    <div className="flex justify-between items-center flex-row-reverse">
                      <span className="flex items-center gap-1 flex-row-reverse text-[10.5px] font-black text-red-500 font-sans">
                        <span>🚨 لوحة أمان الركاب والاتصال الطارئ (SOS)</span>
                      </span>
                      <span className="bg-red-500/15 text-red-400 text-[8px] px-1.5 py-0.5 rounded font-black uppercase">
                        حماية فورية
                      </span>
                    </div>
                    
                    <p className="text-[9.5px] text-slate-400 leading-normal">
                      هل تواجه ظرفاً طارئاً أو تشعر بعدم الارتياح؟ استخدم خيارات الحماية والاتصال المباشر لإشراك عائلتك أو غرف الطوارئ فوراً.
                    </p>

                    <div className="flex gap-1.5 flex-wrap justify-end mt-1">
                      {/* Share Tracking Link */}
                      <button
                        type="button"
                        onClick={() => {
                          const trackingText = `أهلاً، أنا في طريقي الآن عبر تطبيق قوافل آدم من ${activeRide.fromArea.split('-').pop()} إلى ${activeRide.toArea.split('-').pop()} برحلة تجميعية آمنة. يمكنك تتبع موقعي الفوري هنا: https://track.adamride.com/live/${activeRide.id}`;
                          navigator.clipboard.writeText(trackingText);
                          alert('✓ تم نسخ رابط ورسالة التتبع المباشر لرحلتك! يمكنك لصقها الآن في تطبيق واتساب بالنجاح.');
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-sans text-[9px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 flex-row-reverse cursor-pointer transition shrink-0"
                      >
                        <span>مشاركة التتبع (WhatsApp) 🔗</span>
                      </button>

                      {/* Speed Dial 911 */}
                      <button
                        type="button"
                        onClick={() => {
                          const msg = `☎ سيتم محاكاة اتصال سريع بالدفاع المدني وطوارئ الأمن العام (911)\n\nتفاصيل الإرسال التلقائي لموقعك:\n- اسم الراكب: ${loggedPassenger.fullName}\n- رقم الهاتف: ${loggedPassenger.phone}\n- موقع الانطلاق: ${activeRide.fromArea}\n- المسار: ${activeRide.toArea}\n- رقم الرحلة المكثفة: #${activeRide.id.slice(-6)}`;
                          alert(msg);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white font-sans text-[9px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 flex-row-reverse cursor-pointer transition shrink-0 animate-pulse"
                      >
                        <span>اتصال بالدفاع المدني 911 📞</span>
                      </button>

                      {/* Alert Trusted Contacts */}
                      {loggedPassenger.emergencyContacts && loggedPassenger.emergencyContacts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSosActiveAlert(true);
                            setTimeout(() => setSosActiveAlert(false), 8000);
                          }}
                          className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-sans text-[9px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 flex-row-reverse cursor-pointer transition shrink-0"
                        >
                          <span>إرسال نداء فوري للأقارب 🛡️</span>
                        </button>
                      )}
                    </div>

                    {/* Active alert indicator */}
                    {sosActiveAlert && (
                      <div className="mt-2 bg-red-950/80 border border-red-500/40 p-2 rounded-lg text-[9px] text-red-200 leading-normal">
                        <p className="font-bold flex items-center gap-1 flex-row-reverse text-right">
                          <span>⚠️ نداء استغاثة مباشر قيد الإرسال الآن:</span>
                        </p>
                        <div className="space-y-1 mt-1 text-right">
                          {(loggedPassenger.emergencyContacts || []).map((contact, cIdx) => (
                            <div key={cIdx} className="text-slate-200 flex justify-between flex-row-reverse text-[8.5px]">
                              <span>👤 {contact.name} ({contact.phone})</span>
                              <span className="text-emerald-400 font-bold">✓ تم إرسال رسالة SMS الأمان بنجاح بنظام الأقمار الصناعية</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!loggedPassenger.emergencyContacts || loggedPassenger.emergencyContacts.length === 0 ? (
                      <div className="text-[8px] text-slate-500 text-center mt-1 font-sans">
                        💡 نصيحة أمان: لم تقم بإضافة جهات اتصال طوارئ (أقارب) بعد. انتقل لعلامة تبويب <strong className="text-slate-400">"الإعدادات"</strong> لإضافتهم الآن.
                      </div>
                    ) : null}
                  </div>

                  {/* ACTIVE COMPLETED RATING MODAL POPUP */}
                  {activeRide.status === 'started' && (
                    <div className="border-t border-slate-800/80 pt-3">
                      <p className="text-[10px] text-slate-400 text-right italic leading-relaxed font-sans">
                        تم ركوب المركبة بنجاح، يرجى الانتظار حتى يصل الكابتن إلى الموقع المحدد لإنهاء الرحلة تلقائياً.
                      </p>
                    </div>
                  )}

                  {/* Cancel Ride Action Button */}
                  {activeRide.status !== 'started' ? (
                    <div className="border-t border-slate-800/80 pt-3 mt-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => setCancelModal({
                          isOpen: true,
                          title: 'تأكيد إلغاء طلب الرحلة التجميعي',
                          description: 'هل أنت متأكد من رغبتك في إلغاء هذا المشوار التجميعي؟ سيؤدي هذا الإجراء المباشر إلى إلغاء التجميع التلقائي وتحرير الكابتن والركاب الآخرين فورا.',
                          confirmText: 'نعم، إلغاء المشوار 🚨',
                          onConfirm: () => cancelRideRequest(loggedPassenger.id)
                        })}
                        className="w-full bg-red-950/40 text-red-400 hover:bg-red-900/40 border border-red-500/30 hover:border-red-500/60 py-2 rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>إيقاف وإلغاء طلب الرحلة ❌</span>
                      </button>
                      <p className="text-[9px] text-slate-500 mt-1">تنبيه: سيؤدي الإلغاء إلى إزالتك من التجميع وتحرير السائق فوراً</p>
                    </div>
                  ) : (
                    <div className="border-t border-slate-800/80 pt-3 mt-1.5 text-center bg-slate-950/40 p-3 rounded-xl border border-dashed border-red-500/20 flex flex-col gap-2">
                      <p className="text-[10px] text-amber-400 font-bold leading-normal font-sans">
                        🚗 الرحلة جارية الآن. في حال الطوارئ أو الرغبة بالنزول الفوري:
                      </p>
                      <button
                        type="button"
                        onClick={() => setCancelModal({
                          isOpen: true,
                          title: "تأكيد إلغاء المشوار والنزول الفوري",
                          description: "هل أنت متأكد من رغبتك في إلغاء المشوار الحالي والنزول فوراً؟ سيتم تحرير السائق وإلغاء الرحلة من حسابك.",
                          confirmText: "نعم، إلغاء المشوار فوراً 🚨",
                          onConfirm: () => cancelRideRequest(loggedPassenger.id)
                        })}
                        className="w-full bg-red-950/50 text-red-300 hover:bg-red-900/60 border border-red-500/40 py-2 rounded-xl text-xs font-bold font-sans transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>إلغاء المشوار والنزول الفوري 🚨</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* CREATE TRIP REQUEST MAIN VIEW */
                travelMode !== 'intracity' && activeTab === 'request' && (
                  passengerActiveInterRequest && !showAdditionalRequestForm ? (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-4 flex flex-col gap-3 shadow-xl relative overflow-hidden font-sans text-right"
                    >
                      <div className="absolute top-0 inset-x-0 h-1 bg-amber-500 animate-pulse" />

                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 flex-row-reverse">
                          <span className="text-xs font-black text-slate-100">
                            {passengerActiveInterRequest.isAirportRide ? 'طلب رحلة المطار التجميعي ✈️' : 'طلب رحلة تجميعية بين المحافظات 🚗'}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">#{passengerActiveInterRequest.id.slice(-6)}</span>
                        </div>

                        <span className="text-[9.5px] font-extrabold px-2.5 py-1 rounded-full border bg-amber-500/20 text-amber-400 border-amber-500/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          <span>جاري المطابقة والتجميع مع الكباتن...</span>
                        </span>
                      </div>

                      {/* Route Details Box */}
                      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex items-start gap-2 flex-row-reverse">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                          <div className="flex-1 text-[10.5px]">
                            <span className="text-slate-400 text-[9px] block font-bold">نقطة الانطلاق والإركاب:</span>
                            <strong className="text-slate-100">{passengerActiveInterRequest.fromArea}</strong>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 flex-row-reverse">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                          <div className="flex-1 text-[10.5px]">
                            <span className="text-slate-400 text-[9px] block font-bold">وجهة الوصول المقصودة:</span>
                            <strong className="text-slate-100">{passengerActiveInterRequest.toArea}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Info Summary Grid */}
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-slate-950/60 border border-slate-850 p-2 rounded-xl text-right">
                          <span className="text-slate-400 block text-[9px]">المقاعد المحجوزة:</span>
                          <strong className="text-amber-400 font-bold">{passengerActiveInterRequest.seatsCount} مقاعد</strong>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-850 p-2 rounded-xl text-right">
                          <span className="text-slate-400 block text-[9px]">الأجرة المقدرة:</span>
                          <strong className="text-emerald-400 font-mono font-bold">
                            {passengerActiveInterRequest.isAirportRide && passengerActiveInterRequest.airportFare 
                              ? passengerActiveInterRequest.airportFare.toFixed(2) 
                              : ((passengerActiveInterRequest.seatsCount || 1) * (settings?.passengerFarePerSeat || 3.0)).toFixed(2)} {currency}
                          </strong>
                        </div>
                      </div>

                      {/* Live Radar Pulse Notice */}
                      <div className="p-3 bg-amber-500/10 border border-amber-500/25 text-amber-300 rounded-xl text-[10.5px] text-right flex items-center gap-2 flex-row-reverse">
                        <Compass className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                        <span>طلبك معروض الآن على رادار جميع كباتن التكسي والتجميع على هذا المسار. ستصلك إشعارات فورية ورنين بمجرد قبول كابتن لطلبك.</span>
                      </div>

                      {/* Action Buttons: Cancel & Additional Request */}
                      <div className="flex gap-2 pt-1 flex-row-reverse">
                        <button
                          type="button"
                          onClick={() => {
                            setCancelModal({
                              isOpen: true,
                              title: 'تأكيد إلغاء طلب التجميع',
                              description: `هل أنت متأكد من رغبتك في إلغاء طلب الرحلة (${passengerActiveInterRequest.fromArea} ➔ ${passengerActiveInterRequest.toArea})؟`,
                              confirmText: 'نعم، قم بإلغاء الطلب ❌',
                              onConfirm: () => {
                                cancelRideRequest(loggedPassenger!.id);
                                setSuccessRequestMsg('✓ تم إلغاء طلب الرحلة التجميعية بنجاح.');
                                setTimeout(() => setSuccessRequestMsg(''), 4000);
                              }
                            });
                          }}
                          className="flex-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/40 hover:border-red-500 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>إلغاء وإيقاف طلب الرحلة ❌</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowAdditionalRequestForm(true)}
                          className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>طلب آخر</span>
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                  <div className="flex flex-col gap-3 font-sans">
                    {passengerActiveInterRequest && showAdditionalRequestForm && (
                      <div className="bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-xl flex justify-between items-center flex-row-reverse text-[10.5px]">
                        <span className="text-amber-300 font-bold">لديك طلب تجميع نشط حالياً</span>
                        <button
                          type="button"
                          onClick={() => setShowAdditionalRequestForm(false)}
                          className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-bold text-[9.5px] cursor-pointer"
                        >
                          ← العودة لطلبك النشط
                        </button>
                      </div>
                    )}
                    <h3 className="text-xs font-black text-slate-100 text-right border-b border-slate-800 pb-1 flex justify-end gap-1 items-center">
                      <span>{travelMode === 'all' ? '2. رحلات بين المحافظات والمطار (تكسي تجميعي اقتصادي)' : isAirportRide ? 'حجز رحلة المطار الدولي VIP ✈️' : 'طلب مشوار تجميعي ذكي بين المحافظات 🚗'}</span>
                      <Compass className="w-4 h-4 text-emerald-400" />
                    </h3>

                    {/* Request Mode Switcher */}
                    <div className="flex bg-slate-950 border border-slate-850 p-1 rounded-xl text-xs gap-1.5 mb-1 flex-row-reverse">
                      <button
                        type="button"
                        onClick={() => {
                          setRequestMode('instant');
                          setSuccessRequestMsg('');
                          setErrMessage('');
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-center font-bold font-sans transition-all text-[10px] cursor-pointer ${requestMode === 'instant' ? 'bg-emerald-500 text-black font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        ⚡ طلب فوري الآن
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRequestMode('select_scheduled');
                          setSuccessRequestMsg('');
                          setErrMessage('');
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-center font-bold font-sans transition-all text-[10px] cursor-pointer ${requestMode === 'select_scheduled' ? 'bg-indigo-650 text-white font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        📅 المواعيد المتاحة
                      </button>
                    </div>

                    {draftBannerNotice && (
                      <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 text-[10.5px] text-emerald-300 rounded-xl text-right flex justify-between items-center flex-row-reverse animate-fadeIn">
                        <span>{draftBannerNotice}</span>
                        <button
                          type="button"
                          onClick={() => {
                            resetFromGov();
                            resetFromDist();
                            resetFromVillage();
                            resetToGov();
                            resetToDist();
                            resetToVillage();
                            setIsAirportRide(false);
                            clearUrlQueryParams();
                            if (loggedPassenger?.id) {
                              DraftOrderManager.clearServerDraft(loggedPassenger.id);
                            }
                            setDraftBannerNotice(null);
                          }}
                          className="text-[9px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-2 py-0.5 rounded cursor-pointer transition font-bold"
                        >
                          مسح المسودة 🗑️
                        </button>
                      </div>
                    )}

                    {errMessage && (
                      <div className="p-2 bg-red-900/40 border border-red-800 text-[10px] text-red-400 rounded-lg text-right select-all">
                        {errMessage}
                      </div>
                    )}

                    {successRequestMsg && (
                      <div className="p-2.5 bg-indigo-900/40 border border-indigo-800 text-[11px] text-indigo-300 rounded-lg text-right">
                        {successRequestMsg}
                      </div>
                    )}

                    {requestMode === 'instant' ? (
                      <div className="flex flex-col gap-3">
                        {/* AI ASSISTANCE INPUT */}
                        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/20 p-4 rounded-2xl mb-1 flex flex-col gap-2.5 text-right font-sans">
                          <div className="flex justify-between items-center flex-row-reverse">
                            <div className="flex items-center gap-1.5 flex-row-reverse">
                              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                              <h4 className="text-[11px] font-black text-slate-100">الحجز السريع الذكي بضغطة واحدة (آدم AI) ✨</h4>
                            </div>
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded-full font-bold">بدون فلاتر معقدة</span>
                          </div>
                          <p className="text-[9.5px] text-slate-300 leading-normal">
                            تجنب اختيار المحافظات والألوية والقرى يدوياً! اكتب أو تكلم بكلمات بسيطة لتعبئة النموذج وحساب السعر فوراً (مثال: "بدي أروح من الدوار السابع لعمان لجرش 3 مقاعد بكرة الساعة 5")
                          </p>
                          <div className="flex gap-2 flex-row-reverse">
                            <input
                              type="text"
                              value={aiBookingPromptText}
                              onChange={(e) => setAiBookingPromptText(e.target.value)}
                              placeholder="أين تود الذهاب ومع من ومتى؟ اكتب هنا بالعامية..."
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:border-emerald-500/50 outline-none text-right font-sans"
                            />
                            <button
                              type="button"
                              disabled={isParsingAiBooking}
                              onClick={async () => {
                                if (!aiBookingPromptText.trim()) {
                                  alert("يرجى كتابة تفاصيل مشوارك أولاً.");
                                  return;
                                }
                                try {
                                  setIsParsingAiBooking(true);
                                  const response = await fetch("/api/ai-parse-booking", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      text: aiBookingPromptText,
                                      currentTime: new Date().toISOString()
                                    })
                                  });
                                  const data = await response.json();
                                  if (data.success) {
                                    if (data.fromGov) {
                                      setFromGov(data.fromGov);
                                      const govObj = settings.locations.find(l => l.governorate.startsWith(data.fromGov.split(' ')[0]));
                                      if (govObj) {
                                        const dist = data.fromDist || govObj.districts[0]?.name || "";
                                        setFromDist(dist);
                                        const distObj = govObj.districts.find(d => d.name === dist);
                                        setFromVillage(data.fromVillage || distObj?.villages[0] || "");
                                      }
                                    }
                                    if (data.toGov) {
                                      const govObj = settings.locations.find(l => l.governorate.startsWith(data.toGov.split(' ')[0]));
                                      if (govObj) {
                                        const dist = data.toDist || govObj.districts[0]?.name || "";
                                        setToGov(govObj.governorate);
                                        setToDist(dist);
                                        const distObj = govObj.districts.find(d => d.name === dist);
                                        setToVillage(data.toVillage || distObj?.villages[0] || "");
                                      } else {
                                        setToGov(data.toGov);
                                      }
                                    }
                                    if (data.seats) setCompanionCount(Number(data.seats));
                                    if (data.dateTime) {
                                      // format helper: replace space with T and format correctly
                                      setRequestedTime(data.dateTime.replace(' ', 'T').slice(0, 16));
                                    }
                                    setSuccessRequestMsg(`✨ نجح آدم AI في تحليل طلبك وتعبئة نموذج الحجز تلقائياً! تفضل بمراجعة التفاصيل المعبأة والضغط على "طلب فوري" بالأسفل لتأكيد الحجز.`);
                                    setTimeout(() => setSuccessRequestMsg(''), 7000);
                                  } else {
                                    alert("عذراً، لم نتمكن من فرز المواقع بشكل تلقائي. يرجى ملء الحقول أو صياغة طلبك بطريقة مختلفة.");
                                  }
                                } catch (e) {
                                  console.error(e);
                                  alert("حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.");
                                } finally {
                                  setIsParsingAiBooking(false);
                                }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold px-3 py-1.5 rounded-xl text-xs transition whitespace-nowrap cursor-pointer shrink-0 font-sans shadow"
                            >
                              {isParsingAiBooking ? "جاري التفكيك..." : "تفكيك ذكي وتعبئة ⚡"}
                            </button>
                          </div>
                        </div>

                        <form onSubmit={handleTripRequest} className="flex flex-col gap-3">
                        {/* Quick Favorites Row */}
                        {((loggedPassenger?.favorites && loggedPassenger.favorites.length > 0) || 
                          (loggedPassenger?.favoriteRoutes && loggedPassenger.favoriteRoutes.length > 0)) && (
                          <div className="bg-slate-900 border border-amber-500/15 p-2.5 rounded-2xl flex flex-col gap-2 text-right font-sans">
                            {loggedPassenger.favorites && loggedPassenger.favorites.length > 0 && (
                              <div className="flex flex-col gap-1">
                                <span className="text-[9.5px] font-bold text-amber-400">⭐ الأماكن المفضلة السريعة (تعبئة فردية):</span>
                                <div className="flex flex-wrap gap-1 justify-end">
                                  {loggedPassenger.favorites.map((fav, fIdx) => (
                                    <div key={fIdx} className="bg-slate-950 border border-slate-800/80 rounded-lg p-1 px-1.5 flex items-center gap-1.5 flex-row-reverse hover:border-amber-400/30 transition">
                                      <span className="text-[9px] font-bold text-slate-200">{fav.label}</span>
                                      <div className="flex gap-0.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const parts = fav.address.split(' - ');
                                            if (parts[0]) setFromGov(parts[0]);
                                            if (parts[1]) setFromDist(parts[1]);
                                            if (parts[2]) setFromVillage(parts[2]);
                                          }}
                                          className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 px-1 py-0.5 rounded text-[8px] transition font-black cursor-pointer"
                                          title="تعيين كموقع إقلاع"
                                        >
                                          إقلاع 📍
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const parts = fav.address.split(' - ');
                                            if (parts[0]) setToGov(parts[0]);
                                            if (parts[1]) setToDist(parts[1]);
                                            if (parts[2]) setToVillage(parts[2]);
                                          }}
                                          className="bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white px-1 py-0.5 rounded text-[8px] transition font-black cursor-pointer"
                                          title="تعيين كوجهة وصول"
                                        >
                                          وجهة 🏁
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {loggedPassenger.favoriteRoutes && loggedPassenger.favoriteRoutes.length > 0 && (
                              <div className="flex flex-col gap-1 border-t border-slate-800/50 pt-1.5 mt-0.5">
                                <span className="text-[9.5px] font-bold text-amber-400">⚡ المسارات المفضلة (تعبئة الحقلين معاً بضغطة واحدة):</span>
                                <div className="flex flex-wrap gap-1 justify-end">
                                  {loggedPassenger.favoriteRoutes.map((route, rIdx) => (
                                    <button
                                      key={rIdx}
                                      type="button"
                                      onClick={() => {
                                        const fParts = route.fromAddress.split(' - ');
                                        const tParts = route.toAddress.split(' - ');
                                        if (fParts[0]) setFromGov(fParts[0]);
                                        if (fParts[1]) setFromDist(fParts[1]);
                                        if (fParts[2]) setFromVillage(fParts[2]);
                                        if (tParts[0]) setToGov(tParts[0]);
                                        if (tParts[1]) setToDist(tParts[1]);
                                        if (tParts[2]) setToVillage(tParts[2]);
                                      }}
                                      className="bg-amber-400/10 hover:bg-amber-400 hover:text-slate-950 text-amber-400 border border-amber-400/20 rounded-lg p-1 px-1.5 text-[9px] font-bold transition cursor-pointer"
                                      title="تعبئة المسار كاملاً"
                                    >
                                      🛣️ {route.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* FROM POINT dropdowns */}
                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2.5">
                          <div className="flex justify-between items-center flex-row-reverse mb-0.5">
                            <span className="text-[9px] font-bold text-slate-400 text-right uppercase tracking-wider block">1. مكان الإقلال (من ...)</span>
                            
                            {/* Detect My Location button */}
                            <button
                              type="button"
                              onClick={handleDetectLocation}
                              disabled={detectingLocation}
                              className="text-[9.5px] text-emerald-400 hover:text-emerald-300 font-black bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 rounded-lg py-1 px-2.5 transition duration-150 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              id="btn-detect-my-location"
                            >
                              <span className={detectingLocation ? "animate-spin inline-block w-2.5 h-2.5 border-2 border-emerald-400 border-t-transparent rounded-full" : ""}></span>
                              <span>{detectingLocation ? 'جاري رصد الموقع...' : '🎯 حدد موقعي الآن'}</span>
                            </button>
                          </div>

                          {detectionSuccess && (
                            <div className="p-2 px-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 text-right font-bold flex flex-col gap-0.5 leading-snug animate-fadeIn">
                              {detectionSuccess.split('\n').map((line, idx) => (
                                <div key={idx} className={idx === 0 ? "text-emerald-300 font-extrabold flex items-center justify-start flex-row-reverse gap-1" : "text-emerald-400 font-semibold text-[11px] pr-2"}>
                                  {line}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* 3-Column Location Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-right">
                            {/* Governorate */}
                            <div className="flex flex-col gap-1 text-right">
                              <label className="text-[9px] font-bold text-slate-400">{t('المحافظة', 'Governorate')}</label>
                              <select 
                                required
                                value={fromGov} 
                                onChange={e => { setFromGov(e.target.value); setFromDist(''); setFromVillage(''); setDetectionSuccess(null); }}
                                className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 text-right outline-none cursor-pointer focus:border-indigo-500 w-full font-bold"
                              >
                                <option value="">اختر المحافظة</option>
                                {settings.locations.map((loc, i) => (
                                  <option key={i} value={loc.governorate}>{loc.governorate.split(' ')[0]}</option>
                                ))}
                              </select>
                            </div>

                            {/* District */}
                            <div className="flex flex-col gap-1 text-right">
                              <label className="text-[9px] font-bold text-slate-400">{t('اللواء / المنطقة الإدارية', 'District')}</label>
                              <select 
                                required
                                value={fromDist} 
                                onChange={e => { setFromDist(e.target.value); setFromVillage(''); setDetectionSuccess(null); }}
                                className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 text-right outline-none cursor-pointer focus:border-indigo-500 w-full font-bold disabled:opacity-50"
                              >
                                <option value="">اختر اللواء</option>
                                {(fromProvinceObj?.districts || []).map((dist, i) => (
                                  <option key={i} value={dist.name}>{dist.name.replace('لواء ', '')}</option>
                                ))}
                              </select>
                            </div>

                            {/* Village / Area */}
                            <div className="flex flex-col gap-1 text-right">
                              <label className="text-[9px] font-bold text-slate-400">{t('الحي / القرية / المجمع الدائري', 'Area/Village')}</label>
                              <select 
                                required
                                value={fromVillage} 
                                onChange={e => { setFromVillage(e.target.value); setDetectionSuccess(null); }}
                                className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 text-right outline-none cursor-pointer focus:border-indigo-500 w-full font-bold disabled:opacity-50"
                              >
                                <option value="">اختر القرية / المنطقة</option>
                                {(fromDistrictObj?.villages || []).map((vil, i) => (
                                  <option key={i} value={vil}>{vil}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Interactive Map Preview for Pickup Location */}
                          <div className="mt-2 bg-slate-950/80 border border-slate-850 rounded-xl p-1.5 flex flex-col gap-1.5 overflow-hidden">
                            <div className="flex justify-between items-center flex-row-reverse px-1">
                              <span className="text-[9px] font-bold text-slate-400">خريطة رصد نقطة الإركاب التفاعلية 🗺️</span>
                              <span className="text-[8.5px] text-emerald-400 font-mono">
                                {fromGov ? "📍 تم تحديد موقع" : "👈 انقر لتحديد المحافظة"}
                              </span>
                            </div>

                            <div className="relative w-full h-36 bg-[#060a13] rounded-lg border border-slate-900 overflow-hidden select-none">
                              <svg viewBox="90 50 260 170" className="w-full h-full">
                                <defs>
                                  <pattern id="mini-map-grid" width="12" height="12" patternUnits="userSpaceOnUse">
                                    <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(38, 50, 75, 0.15)" strokeWidth="0.8" />
                                  </pattern>
                                </defs>
                                
                                {/* Grid background */}
                                <rect width="100%" height="100%" fill="url(#mini-map-grid)" />

                                {/* High-speed connecting transport corridors */}
                                <g opacity="0.35">
                                  {/* Amman to Irbid */}
                                  <line x1="200" y1="200" x2="240" y2="80" stroke="#4b5563" strokeWidth="1.5" strokeDasharray="4 3" />
                                  {/* Amman to Zarqa */}
                                  <line x1="200" y1="200" x2="310" y2="160" stroke="#4b5563" strokeWidth="1.5" strokeDasharray="4 3" />
                                  {/* Amman to Balqa */}
                                  <line x1="200" y1="200" x2="130" y2="170" stroke="#4b5563" strokeWidth="1.5" strokeDasharray="4 3" />
                                  {/* Irbid to Zarqa */}
                                  <line x1="240" y1="80" x2="310" y2="160" stroke="#4b5563" strokeWidth="1" strokeDasharray="3 3" />
                                  {/* Balqa to Irbid */}
                                  <line x1="130" y1="170" x2="240" y2="80" stroke="#4b5563" strokeWidth="1" strokeDasharray="3 3" />
                                </g>

                                {/* Interactive Governorate Nodes */}
                                {[
                                  { name: "عمان (Amman)", cx: 200, cy: 200, color: "rgba(59, 130, 246, 0.5)", coreColor: "#3b82f6" },
                                  { name: "إربد (Irbid)", cx: 240, cy: 80, color: "rgba(236, 72, 153, 0.5)", coreColor: "#ec4899" },
                                  { name: "الزرقاء (Zarqa)", cx: 310, cy: 160, color: "rgba(16, 185, 129, 0.5)", coreColor: "#10b981" },
                                  { name: "البلقاء (Balqa)", cx: 130, cy: 170, color: "rgba(245, 158, 11, 0.5)", coreColor: "#f59e0b" }
                                ].map((gov) => {
                                  const isSelected = fromGov === gov.name;
                                  return (
                                    <g key={gov.name} className="cursor-pointer group" onClick={() => handleMapClick(gov.name)}>
                                      {/* Outer Glow ring */}
                                      <circle 
                                        cx={gov.cx} 
                                        cy={gov.cy} 
                                        r={isSelected ? "14" : "10"} 
                                        fill={gov.color} 
                                        opacity={isSelected ? "0.8" : "0.3"} 
                                        className="transition-all duration-350 hover:scale-125"
                                      />
                                      {/* Core point */}
                                      <circle 
                                        cx={gov.cx} 
                                        cy={gov.cy} 
                                        r="4" 
                                        fill={gov.coreColor} 
                                        stroke="#ffffff" 
                                        strokeWidth="1" 
                                      />
                                      {/* Label background for readability */}
                                      <rect 
                                        x={gov.cx - 24} 
                                        y={gov.cy - 18} 
                                        width="48" 
                                        height="10" 
                                        rx="3" 
                                        fill="rgba(4, 8, 19, 0.85)" 
                                        stroke="rgba(255,255,255,0.08)"
                                        strokeWidth="0.5"
                                      />
                                      <text 
                                        x={gov.cx} 
                                        y={gov.cy - 11} 
                                        fill={isSelected ? "#ffffff" : "#cbd5e1"} 
                                        fontSize="6.5" 
                                        textAnchor="middle" 
                                        fontWeight={isSelected ? "black" : "bold"}
                                        className="pointer-events-none select-none font-sans font-medium"
                                      >
                                        {gov.name.split(' ')[0]}
                                      </text>
                                    </g>
                                  );
                                })}

                                {/* Glowing radar & Precise Location Pin */}
                                {(() => {
                                  if (!fromGov) return null;
                                  
                                  const labelStr = fromVillage ? `${fromGov} - ${fromDist} - ${fromVillage}` : (fromDist ? `${fromGov} - ${fromDist}` : fromGov);
                                  const coordinates = getLocationCoords(labelStr);
                                  
                                  return (
                                    <g>
                                      {/* Radar pulse expand circles */}
                                      <circle
                                        cx={coordinates.x}
                                        cy={coordinates.y}
                                        r="18"
                                        fill="none"
                                        stroke="#10b981"
                                        strokeWidth="1.5"
                                        opacity="0.6"
                                        className="animate-ping"
                                        style={{ transformOrigin: `${coordinates.x}px ${coordinates.y}px` }}
                                      />
                                      <circle
                                        cx={coordinates.x}
                                        cy={coordinates.y}
                                        r="8"
                                        fill="rgba(16, 185, 129, 0.25)"
                                        stroke="#10b981"
                                        strokeWidth="1"
                                      />

                                      {/* Precision Target Marker Pin */}
                                      <g transform={`translate(${coordinates.x}, ${coordinates.y - 10})`}>
                                        {/* Drop Shadow */}
                                        <ellipse cx="0" cy="11" rx="3.5" ry="1.5" fill="rgba(0,0,0,0.6)" />
                                        
                                        {/* Classic Pin */}
                                        <path 
                                          d="M0,0 C-4.5,-4.5 -6,-8 -6,-11 C-6,-14.5 -3.5,-17 0,-17 C3.5,-17 6,-14.5 6,-11 C6,-8 4.5,-4.5 0,0 Z" 
                                          fill="#10b981" 
                                          stroke="#ffffff" 
                                          strokeWidth="1.2" 
                                        />
                                        {/* Pin Inner Dot */}
                                        <circle cx="0" cy="-11" r="2" fill="#ffffff" />
                                      </g>
                                    </g>
                                  );
                                })()}
                              </svg>

                              {/* On-Map coordinates overlay info */}
                              <div className="absolute bottom-2 right-2 bg-slate-900/95 border border-slate-800/80 px-2 py-0.5 rounded text-[8px] font-mono text-slate-450 flex items-center gap-1">
                                {fromGov ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-emerald-400 font-bold truncate max-w-[124px]">
                                      {fromVillage || fromDist || fromGov.split(' ')[0]}
                                    </span>
                                    <span className="opacity-60">({getLocationCoords(pickupLocationLabel).x}, {getLocationCoords(pickupLocationLabel).y})</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    <span>بانتظار تحديد موقع...</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Save From Location Inline form */}
                          {fromGov && fromDist && fromVillage && (
                            <div className="mt-2 bg-slate-950/45 p-2 rounded-xl border border-slate-850/80 flex flex-col gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowQuickSaveFromFavForm(!showQuickSaveFromFavForm);
                                  setShowQuickSaveToFavForm(false);
                                }}
                                className="text-[9px] text-amber-400 hover:text-amber-300 font-bold flex items-center justify-end gap-1 cursor-pointer w-full text-right"
                              >
                                <span>⭐ حفظ موقع الإقلال هذا في أماكنك المفضلة</span>
                              </button>
                              {showQuickSaveFromFavForm && (
                                <div className="flex gap-1.5 flex-row-reverse mt-1">
                                  <input
                                    type="text"
                                    placeholder="الاسم المفضل"
                                    value={quickSaveFromLabel}
                                    onChange={e => setQuickSaveFromLabel(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[9.5px] text-slate-100 placeholder-slate-600 focus:border-amber-400 outline-none flex-1 text-right font-sans"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!quickSaveFromLabel.trim()) {
                                        alert('يرجى كتابة اسم الاختصار المفضل');
                                        return;
                                      }
                                      const fullAddress = `${fromGov} - ${fromDist} - ${fromVillage}`;
                                      const existing = loggedPassenger?.favorites || [];
                                      const updated = [...existing, { label: quickSaveFromLabel.trim(), address: fullAddress }];
                                      const res = savePassengerFavorites(loggedPassenger!.id, updated);
                                      if (res.success) {
                                        setSuccessRequestMsg('✓ تم حفظ موقع الإعداد كجهة مفضلة بنجاح!');
                                        setQuickSaveFromLabel('');
                                        setShowQuickSaveFromFavForm(false);
                                        setTimeout(() => setSuccessRequestMsg(''), 4000);
                                      }
                                    }}
                                    className="bg-amber-400 hover:bg-amber-500 text-slate-950 text-[9px] font-extrabold px-3 py-1 rounded cursor-pointer shrink-0 font-sans"
                                  >
                                    حفظ 💾
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* OPTIONAL STOPOVER / WAYPOINT POINT */}
                        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2">
                          <div className="flex justify-between items-center flex-row-reverse">
                            <span className="text-[9.5px] font-bold text-amber-400 text-right flex items-center gap-1">
                              <span>📍 نقطة توقف على الطريق (اختياري / Stopover)</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = !hasStopover;
                                setHasStopover(next);
                                if (!next) {
                                  setStopoverGov('');
                                  setStopoverDist('');
                                  setStopoverVillage('');
                                  setStopoverLandmark('');
                                }
                              }}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                                hasStopover 
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-black' 
                                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                              }`}
                            >
                              {hasStopover ? '✓ محددة (إلغاء)' : '➕ إضافة نقطة توقف'}
                            </button>
                          </div>

                          {hasStopover && (
                            <div className="flex flex-col gap-2 mt-1 bg-slate-950/80 p-2.5 rounded-xl border border-amber-500/30 animate-fadeIn">
                              <span className="text-[8.5px] text-slate-400 text-right">
                                حدد المحافظة واللواء أو المعلم الذي ترغب بالتوقف عنده أثناء المسار:
                              </span>
                              {/* Governorate */}
                              <select 
                                value={stopoverGov} 
                                onChange={e => { setStopoverGov(e.target.value); setStopoverDist(''); setStopoverVillage(''); }}
                                className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-100 text-right outline-none cursor-pointer"
                              >
                                <option value="">-- اختر محافظة نقطة التوقف --</option>
                                {settings.locations.map((loc, i) => (
                                  <option key={i} value={loc.governorate}>{loc.governorate}</option>
                                ))}
                              </select>

                              {/* District */}
                              {stopoverGov && (
                                <select 
                                  value={stopoverDist} 
                                  onChange={e => { setStopoverDist(e.target.value); setStopoverVillage(''); }}
                                  className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-100 text-right outline-none cursor-pointer"
                                >
                                  <option value="">-- اختر لواء نقطة التوقف --</option>
                                  {(stopoverProvinceObj?.districts || []).map((dist, i) => (
                                    <option key={i} value={dist.name}>{dist.name}</option>
                                  ))}
                                </select>
                              )}

                              {/* Village / Area */}
                              {stopoverDist && (
                                <select 
                                  value={stopoverVillage} 
                                  onChange={e => setStopoverVillage(e.target.value)}
                                  className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-100 text-right outline-none cursor-pointer"
                                >
                                  <option value="">-- اختر الحي أو المنطقة --</option>
                                  {(stopoverDistrictObj?.villages || []).map((vil, i) => (
                                    <option key={i} value={vil}>{vil}</option>
                                  ))}
                                </select>
                              )}

                              {/* Stopover Landmark / Note */}
                              <input
                                type="text"
                                placeholder="معلم أو عنوان محدد (مثال: محطة المناصير / صراف البنك الأهلي)"
                                value={stopoverLandmark}
                                onChange={e => setStopoverLandmark(e.target.value)}
                                className="bg-slate-900 border border-slate-800 focus:border-amber-400 rounded-lg px-2 py-1.5 text-[10px] text-slate-100 placeholder-slate-500 outline-none text-right font-sans"
                              />
                            </div>
                          )}
                        </div>

                        {/* TO POINT dropdowns */}
                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2.5">
                          <span className="text-[9px] font-bold text-indigo-400 text-right uppercase tracking-wider block">2. مكان الإنزال (إلى ...)</span>
                          
                          {/* Governorate */}
                          <select 
                            required
                            value={toGov} 
                            onChange={e => { setToGov(e.target.value); setToDist(''); setToVillage(''); }}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-100 text-right outline-none cursor-pointer"
                          >
                            <option value="">-- اختر المحافظة --</option>
                            {settings.locations.map((loc, i) => (
                              <option key={i} value={loc.governorate}>{loc.governorate}</option>
                            ))}
                          </select>

                          {/* District if Governor is chosen */}
                          {toGov && (
                            <select 
                              required
                              value={toDist} 
                              onChange={e => { setToDist(e.target.value); setToVillage(''); }}
                              className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-100 text-right outline-none cursor-pointer"
                            >
                              <option value="">-- اختر اللواء --</option>
                              {(toProvinceObj?.districts || []).map((dist, i) => (
                                <option key={i} value={dist.name}>{dist.name}</option>
                              ))}
                            </select>
                          )}

                          {/* Village if District is chosen */}
                          {toDist && (
                            <select 
                              required
                              value={toVillage} 
                              onChange={e => setToVillage(e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-100 text-right outline-none cursor-pointer"
                            >
                              <option value="">-- اختر القرية / المنطقة --</option>
                              {(toDistrictObj?.villages || []).map((vil, i) => (
                                <option key={i} value={vil}>{vil}</option>
                              ))}
                            </select>
                          )}

                          {/* Quick Save To Location Inline form */}
                          {toGov && toDist && toVillage && (
                            <div className="mt-2 bg-slate-950/45 p-2 rounded-xl border border-slate-850/80 flex flex-col gap-1.55">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowQuickSaveToFavForm(!showQuickSaveToFavForm);
                                  setShowQuickSaveFromFavForm(false);
                                }}
                                className="text-[9px] text-amber-400 hover:text-amber-300 font-bold flex items-center justify-end gap-1 cursor-pointer w-full text-right"
                              >
                                <span>⭐ حفظ وجهة الوصول هذه في أماكنك المفضلة</span>
                              </button>
                              {showQuickSaveToFavForm && (
                                <div className="flex gap-1.5 flex-row-reverse mt-1">
                                  <input
                                    type="text"
                                    placeholder="الاسم المفضل"
                                    value={quickSaveToLabel}
                                    onChange={e => setQuickSaveToLabel(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[9.5px] text-slate-100 placeholder-slate-600 focus:border-amber-400 outline-none flex-1 text-right font-sans"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!quickSaveToLabel.trim()) {
                                        alert('يرجى كتابة اسم الاختصار المفضل');
                                        return;
                                      }
                                      const fullAddress = `${toGov} - ${toDist} - ${toVillage}`;
                                      const existing = loggedPassenger?.favorites || [];
                                      const updated = [...existing, { label: quickSaveToLabel.trim(), address: fullAddress }];
                                      const res = savePassengerFavorites(loggedPassenger!.id, updated);
                                      if (res.success) {
                                        setSuccessRequestMsg('✓ تم حفظ وجهة الوصول كجهة مفضلة بنجاح!');
                                        setQuickSaveToLabel('');
                                        setShowQuickSaveToFavForm(false);
                                        setTimeout(() => setSuccessRequestMsg(''), 4000);
                                      }
                                    }}
                                    className="bg-amber-400 hover:bg-amber-500 text-slate-950 text-[9px] font-extrabold px-3 py-1 rounded cursor-pointer shrink-0 font-sans"
                                  >
                                    حفظ 💾
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* COMPANION COUNT SELECTION */}
                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2">
                          <span className="text-[9px] font-bold text-amber-500 text-right uppercase tracking-wider block">3. عدد المقاعد المطلوبة (أشخاص)</span>
                          <div className="flex justify-between items-center bg-slate-950 border border-slate-800 p-2 rounded-xl">
                            <div className="flex gap-1.5">
                              {[1, 2, 3, 4].map(num => (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => setCompanionCount(num)}
                                  className={`w-7 h-7 rounded-lg text-xs font-bold transition duration-150 ${companionCount === num ? 'bg-amber-500 text-black' : 'bg-slate-900 text-slate-400 hover:text-slate-100'}`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                            <span className="text-xs text-slate-300 font-sans tracking-tight">العدد الكلي</span>
                          </div>
                          <div className="text-[9px] text-slate-500 text-right font-sans flex flex-col gap-0.5 mt-1 border-t border-slate-850 pt-1">
                            <p>* سعر الرحلة للراكب الواحد هو {settings.passengerFarePerSeat} د.أ عن كل مقعد يتم حشره بالرحلة التجميعية.</p>
                            <p className="text-amber-400 font-bold">⚠️ متطلب رصيد: يجب توفر {companionCount} د.أ في محفظتك لتأكيد الطلب (1 د.أ عن كل مقعد). لن يتم خصم الأجرة فوراً، ولكن سيتم اقتطاع 1 د.أ عن كل مقعد في حال قمت بإلغاء الطلب الفوري.</p>
                          </div>
                          <div className="mt-2 text-right">
                            <span className="text-[10px] text-slate-450">رصيد محفظتك الحالي: <strong className="text-indigo-400 font-mono">{loggedPassenger?.balance || 0} د.أ</strong></span>
                          </div>
                          
                          {loggedPassenger && (loggedPassenger.balance ?? 0) < 2 && (
                            <div className="mt-2 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-3 flex flex-col gap-1.5 text-right text-[10px] text-amber-300 relative overflow-hidden shadow-md">
                              <div className="flex items-center justify-end gap-1 font-bold flex-row-reverse text-amber-400 text-xs">
                                <span>⚠️ تنبيه: رصيد محفظتك منخفض جداً!</span>
                              </div>
                              <span className="leading-relaxed">
                                رصيدك الحالي هو <strong>{(loggedPassenger.balance ?? 0).toFixed(2)} د.أ</strong>، وهو أقل من الحد التنبيهي الآمن (2 د.أ). الرجاء شحن رصيد المحفظة لتجنب تعليق أو إلغاء رحلتك وضمان قبول فوري وسريع من الكباتن.
                              </span>
                            </div>
                          )}
                          
                          {/* Airport Trip Option Box */}
                          <div className="mt-3 bg-gradient-to-r from-slate-950 via-indigo-950/60 to-purple-950/50 border-2 border-indigo-500/40 p-3.5 rounded-2xl flex flex-col gap-3 text-right font-sans shadow-xl relative overflow-hidden">
                            <div className="flex items-center justify-between flex-row-reverse">
                              <div className="flex items-center gap-2 flex-row-reverse">
                                <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400 flex items-center justify-center text-lg shadow-inner">
                                  ✈️
                                </div>
                                <div>
                                  <span className="text-xs font-black text-indigo-200 block">فئة رحلات المطار VIP (Airport Express QAIA)</span>
                                  <span className="text-[9px] text-slate-400 block">مخصصة لسيارات حديثة بموديل {settings.airportMinCarModel ?? settings.minCarModel ?? 2021}+ وتسعيرة معتمدة</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextState = !isAirportRide;
                                  setIsAirportRide(nextState);
                                  if (nextState) {
                                    setToGov('عمان (Amman)');
                                    setToDist('الجيزة');
                                    setToVillage('مطار الملكة علياء الدولي (QAIA)');
                                    setSuccessRequestMsg('✈️ تم تفعيل فئة رحلات المطار وتعيين الوجهة تلقائياً إلى مطار الملكة علياء الدولي');
                                    setTimeout(() => setSuccessRequestMsg(''), 4500);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-xl text-[10.5px] font-black transition-all cursor-pointer border flex items-center gap-1.5 shadow ${
                                  isAirportRide
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 shadow-indigo-500/30'
                                    : 'bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border-indigo-500/40'
                                }`}
                              >
                                <span>{isAirportRide ? '✅ مفعل (فئة مطار)' : '✈️ تفعيل طلب مطار'}</span>
                              </button>
                            </div>

                            {isAirportRide && (
                              <div className="bg-indigo-950/80 p-3 rounded-xl border border-indigo-500/30 text-[10px] text-slate-200 leading-relaxed font-sans flex flex-col gap-2.5 animate-fadeIn">
                                {/* Direction Buttons */}
                                <div className="flex gap-2 flex-row-reverse">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAirportTripDirection('to_airport');
                                      setToGov('عمان (Amman)');
                                      setToDist('الجيزة');
                                      setToVillage('مطار الملكة علياء الدولي (QAIA)');
                                    }}
                                    className={`flex-1 py-1.5 px-2 rounded-lg text-[9.5px] font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                                      airportTripDirection === 'to_airport'
                                        ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
                                    }`}
                                  >
                                    🛫 توصيل إلى المطار (QAIA)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAirportTripDirection('from_airport');
                                      setFromGov('عمان (Amman)');
                                      setFromDist('الجيزة');
                                      setFromVillage('مطار الملكة علياء الدولي (QAIA)');
                                    }}
                                    className={`flex-1 py-1.5 px-2 rounded-lg text-[9.5px] font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                                      airportTripDirection === 'from_airport'
                                        ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
                                    }`}
                                  >
                                    🛬 استقبال من المطار (QAIA)
                                  </button>
                                </div>

                                {/* Vehicle & Fare Specs Grid */}
                                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-indigo-500/20 flex flex-col gap-1.5 text-[9.5px]">
                                  <div className="flex items-center justify-between flex-row-reverse border-b border-indigo-500/20 pb-1 font-bold">
                                    <span className="text-amber-300">💵 تسعيرة المطار المحددة مسبقاً في النظام:</span>
                                    <span className="text-emerald-400 font-mono text-xs font-black">{settings.airportRidePrice ?? 25.0} د.أ ثابت</span>
                                  </div>
                                  <div className="flex items-center justify-between flex-row-reverse text-slate-300">
                                    <span>🚘 مواصفات السيارات المؤهلة:</span>
                                    <span className="text-indigo-300 font-bold">موديل {settings.airportMinCarModel ?? settings.minCarModel ?? 2021}+ فما فوق حصراً</span>
                                  </div>
                                  <div className="flex items-center justify-between flex-row-reverse text-slate-400 text-[9px]">
                                    <span>❄️ التكييف والنظافة:</span>
                                    <span className="text-slate-300">تكييف فائق، نظافة استثنائية، سعة أمتعة سفر</span>
                                  </div>
                                  <div className="flex items-center justify-between flex-row-reverse text-slate-400 text-[9px]">
                                    <span>🏢 عمولة المنظومة المقررة:</span>
                                    <span className="text-slate-300 font-mono">{settings.airportCommissionRate ?? 3.0} د.أ</span>
                                  </div>
                                </div>

                                {/* Flight info inputs */}
                                <div className="grid grid-cols-2 gap-2 text-right">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[9px] text-slate-300 font-bold">رقم الرحلة / الطيران (اختياري):</label>
                                    <input
                                      type="text"
                                      value={flightNumberInput}
                                      onChange={(e) => setFlightNumberInput(e.target.value)}
                                      placeholder="مثال: RJ101 أو EK902"
                                      className="bg-slate-950 border border-slate-800 focus:border-indigo-400 rounded-lg p-1.5 text-slate-100 text-[10px] outline-none text-right font-mono"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[9px] text-slate-300 font-bold">عدد حقائب السفر:</label>
                                    <select
                                      value={luggageCountInput}
                                      onChange={(e) => setLuggageCountInput(Number(e.target.value))}
                                      className="bg-slate-950 border border-slate-800 focus:border-indigo-400 rounded-lg p-1.5 text-slate-100 text-[10px] outline-none text-right font-bold"
                                    >
                                      <option value={1}>🧳 حقيبة واحدة (1)</option>
                                      <option value={2}>🧳 حقيبتان (2)</option>
                                      <option value={3}>🧳 3 حقائب سفر</option>
                                      <option value={4}>🧳 4 حقائب أو أكثر</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Promo code block */}
                          <div id="promo-code-section" className="mt-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-right">
                            <label className="block text-slate-300 font-bold font-sans text-[11px] mb-1">🎟️ هل لديك كود خصم ترويجي؟</label>
                            <div className="flex gap-1.5 flex-row-reverse">
                              <input
                                type="text"
                                value={promoCodeInput}
                                onChange={(e) => setPromoCodeInput(e.target.value)}
                                placeholder="أدخل الكود هنا"
                                className="flex-1 bg-slate-900 border border-slate-750 rounded-lg px-2 py-1 text-slate-200 text-[11px] text-center uppercase tracking-wider font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-slate-500"
                              />
                            </div>
                            
                            {/* Available promos hints */}
                            {settings?.systemOffers && settings.systemOffers.filter(o => o.isActive && (o.targetType === 'passenger' || o.targetType === 'both')).length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1 items-center justify-start flex-row-reverse">
                                <span className="text-[9px] text-slate-400 font-bold">خصومات نشطة:</span>
                                {settings.systemOffers.filter(o => o.isActive && (o.targetType === 'passenger' || o.targetType === 'both')).map(o => (
                                  <button
                                    key={o.id}
                                    type="button"
                                    onClick={() => setPromoCodeInput(o.code)}
                                    className="text-[9px] bg-slate-900 border border-slate-800 text-amber-500 hover:text-amber-400 font-mono px-1.5 py-0.5 rounded transition duration-150 flex items-center gap-1"
                                  >
                                    <span>{o.code} ({o.discountType === 'percentage' ? `${o.value}%` : `${o.value}د.أ`})</span>
                                    {o.travelScope === 'intracity' && <span className="text-[7.5px] text-cyan-400">(داخل المدينة)</span>}
                                    {o.travelScope === 'intercity' && <span className="text-[7.5px] text-purple-400">(بين المحافظات)</span>}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Live Fare Estimate Card with Pooling Demand */}
                          {(() => {
                            const est = getLiveFareEstimate();
                            return (
                              <div className="mt-3 bg-slate-950 border border-slate-850 p-3 rounded-2xl flex flex-col gap-2 animate-fade-in text-right">
                                <div className="flex justify-between items-center flex-row-reverse pb-1.5 border-b border-slate-900">
                                  <span className="text-[10.5px] font-extrabold text-amber-500 font-sans">📊 تفصيل تقدير التعرفة الذكية المباشرة</span>
                                  {est.hasRoute && (
                                    <span className="text-[7.5px] font-mono text-slate-500 font-bold">
                                      {est.estimatedDistance} كم / {est.estimatedDuration} دقيقة متوقعة
                                    </span>
                                  )}
                                </div>

                                {est.hasRoute ? (
                                  <div className="flex flex-col gap-1.5 text-[9.5px]">
                                    <div className="flex justify-between flex-row-reverse text-slate-400">
                                      <span>أجرة المقعد القياسية للمسار المحدد:</span>
                                      <span className="font-mono text-slate-200">{est.baseFarePerSeat.toFixed(2)} د.أ</span>
                                    </div>
                                    <div className="flex justify-between flex-row-reverse text-slate-400">
                                      <span>عدد المقاعد المطلوبة:</span>
                                      <span className="font-mono text-slate-200">×{companionCount} مقاعد</span>
                                    </div>
                                    <div className="flex justify-between flex-row-reverse text-slate-300 font-bold">
                                      <span>المجموع الفرعي الأساسي:</span>
                                      <span className="font-mono">{est.rawSubtotal.toFixed(2)} د.أ</span>
                                    </div>

                                    {/* Pooling Demand Section */}
                                    <div className="mt-1.5 bg-slate-900/60 p-2 rounded-xl border border-slate-850/60 flex flex-col gap-1">
                                      <div className="flex justify-between flex-row-reverse items-center">
                                        <span className="text-slate-400">حالة طلب تجميع ركاب المسار حالياً:</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-black ${
                                          est.demandLevel === 'high' ? 'bg-amber-500/20 text-amber-400' :
                                          est.demandLevel === 'medium' ? 'bg-emerald-500/20 text-emerald-400' :
                                          'bg-slate-800 text-slate-450'
                                        }`}>
                                          {est.demandLabel}
                                        </span>
                                      </div>
                                      <div className="text-[8px] text-slate-500 leading-normal">
                                        {est.routeOverlapCount > 0 ? (
                                          <p className="text-emerald-400 font-bold">✓ يوجد ركاب متطابقين معك على نفس المسار الجغرافي حالياً! تم تطبيق خصم المشاركة فوراً لتوفير الكلفة.</p>
                                        ) : (
                                          <p>💡 لم يُرصد ركاب فوريين متطابقين للمسار الآن. سيقوم خوارزم تجميع آدم بتوحيد المشوار مع ركاب إضافيين لتأمين الخصم التلقائي.</p>
                                        )}
                                      </div>
                                      {est.poolingDiscount > 0 && (
                                        <div className="flex justify-between flex-row-reverse text-emerald-400 font-bold mt-0.5 border-t border-slate-850/50 pt-1">
                                          <span>خصم ربط تجميع الركاب (Pooling Demand):</span>
                                          <span className="font-mono">-{est.poolingDiscount.toFixed(2)} د.أ</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Promo Discount Details */}
                                    {est.promoOffer && (
                                      <div className="flex justify-between flex-row-reverse text-indigo-400 font-bold">
                                        <span>كود خصم فعال ({est.promoOffer.code}):</span>
                                        <span className="font-mono">-{est.promoDiscount.toFixed(2)} د.أ</span>
                                      </div>
                                    )}

                                    {/* Final Estimated Total */}
                                    <div className="mt-1.5 pt-1.5 border-t border-slate-850 flex justify-between items-center flex-row-reverse">
                                      <span className="text-xs font-black text-slate-200">التعرفة الإجمالية التقديرية النهائية:</span>
                                      <div className="flex flex-col items-end">
                                        <span className="text-emerald-400 font-black font-mono text-base">{est.finalEstimate.toFixed(2)} د.أ</span>
                                        <span className="text-[7.5px] text-slate-500">* قد يقل المبلغ أكثر عند انضمام ركاب جدد للمركبة</span>
                                      </div>
                                    </div>
                                    
                                    {/* Auto-Recharge Upsell reminder */}
                                    {loggedPassenger && loggedPassenger.balance < est.finalEstimate && (
                                      <div className="mt-1.5 bg-indigo-950/40 border border-indigo-900/40 p-2 rounded-xl text-right text-[8px] text-indigo-300 leading-normal">
                                        💡 رصيدك الحالي {loggedPassenger.balance} د.أ غير كافٍ للرحلة؟ لا تقلق! يمكنك تفعيل ميزة <strong className="text-indigo-400">الشحن التلقائي الذكي (Auto-Recharge)</strong> من المحفظة لضمان شحن رصيدك تلقائياً عند طلب المشوار.
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[9.5px] text-slate-500 text-center py-2 italic leading-relaxed block font-sans">
                                    يرجى تحديد نقطة البداية ونقطة الوصول لعرض تقدير التعرفة الذكية وتطابق ركاب التجميع المباشر.
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Direct match for existing scheduled flights/trips inside instant form */}
                        {fromGov && toGov && (() => {
                          const matches = scheduledTrips.filter(t => 
                            (t.status === 'pending' || t.status === 'accepted') &&
                            t.availableSeats >= companionCount &&
                            t.fromArea.startsWith(fromGov) &&
                            t.toArea.startsWith(toGov)
                          );
                          if (matches.length === 0) return null;
                          return (
                            <div className="bg-gradient-to-br from-indigo-950/70 to-slate-900 border-2 border-indigo-500/30 p-3.5 rounded-2xl text-right animate-fade-in font-sans">
                              <div className="flex justify-between items-center flex-row-reverse mb-1.5 pb-1 border-b border-indigo-900/30">
                                <span className="text-indigo-400 font-extrabold text-[10.5px]">💡 مواعيد مشاركة قائمة ومتاحة فوراً!</span>
                                <span className="bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded text-[7.5px] animate-pulse">ربط فوري فائق ⚡</span>
                              </div>
                              <p className="text-[9px] text-slate-350 leading-relaxed mb-2.5">
                                بدل الانتظار، انضم الآن بكبسة وخصم إضافي إلى الموعد القائم والمقر مع الكباتن والركاب الآخرين:
                              </p>
                              <div className="flex flex-col gap-2">
                                {matches.map(trip => {
                                  const capName = trip.driverName || trip.creatorName || "كابتن آدم معتمد";
                                  return (
                                    <div key={trip.id} className="bg-slate-950/80 border border-indigo-900/40 p-2.5 rounded-xl flex flex-col gap-1 text-[9.5px]">
                                      <div className="flex justify-between items-center flex-row-reverse">
                                        <span className="font-bold text-slate-150">🚕 الملعن/الكابتن: {capName}</span>
                                        <span className="bg-indigo-900/30 border border-indigo-800 text-indigo-400 px-1.5 py-0.2 rounded text-[7.5px] font-bold">
                                          {trip.availableSeats} مقاعد شاغرة
                                        </span>
                                      </div>
                                      <div className="flex justify-between flex-row-reverse items-center mt-0.5">
                                        <span className="text-slate-450 text-[8.5px]">توقيت المغادرة المقر:</span>
                                        <span className="font-mono text-amber-400 font-extrabold text-[9px]">{trip.departureTime}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (window.confirm(`هل تؤكد الانضمام الفوري مع الكابتن ${capName} للمغادرة في الساعة ${trip.departureTime}؟`)) {
                                            const res = bookScheduledTrip(
                                              loggedPassenger!.id,
                                              trip.id,
                                              companionCount,
                                              `${fromGov} - ${fromDist || "لواء القصبة"} - ${fromVillage || "وسط البلد"}`,
                                              `${toGov} - ${toDist || "لواء القصبة"} - ${toVillage || "وسط البلد"}`,
                                              "انضمام ذكي ومباشر من واجهة الطلب الفوري"
                                            );
                                            if (res.success) {
                                              alert(res.msg);
                                              setSchTabMode('my_trips');
                                              setActiveTab('scheduled');
                                            } else {
                                              alert(res.msg);
                                            }
                                          }
                                        }}
                                        className="mt-1.5 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-1.5 rounded-lg text-[9px] cursor-pointer transition shadow border-none outline-none font-sans"
                                      >
                                        احجز مقعدي وانطلق فوراً مع الكابتن 🎫
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}


                        <button 
                          type="submit" 
                          disabled={isSearching}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 font-sans text-black py-3.5 rounded-2xl font-black text-xs shadow-xl shadow-emerald-950/50 border border-emerald-400/40 transition-all duration-150 flex items-center justify-center gap-1.5 uppercase tracking-wide cursor-pointer"
                        >
                          {isSearching ? 'جاري الفحص لجمعكم وتوصيلكم...' : `طلب التوصيل الآن 🚀 (التكلفة المقدرة: ${getLiveFareEstimate().finalEstimate.toFixed(2)} د.أ)`}
                        </button>
                      </form>
                    </div>
                    ) : (
                      /* CHOOSE AVAILABLE TRIP FROM COPN OR ADMIN PANEL */
                      <div className="flex flex-col gap-2.5 max-h-[400px] overflow-y-auto pr-1">
                        <span className="text-[9.5px] text-slate-400 leading-relaxed block text-center mb-1">تصفح وجدولة رحلات السفر المعدة والمقرة، واختر للانضمام مباشرة:</span>

                        {/* Filters System */}
                        <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl flex flex-col gap-2.5 mb-2 text-right">
                          <div className="flex justify-between items-center flex-row-reverse border-b border-slate-900 pb-1.5">
                            <span className="text-[10px] font-bold text-slate-300">🔍 تصفية وبحث المواعيد التفاعلي</span>
                            {(filterGov || filterDist || filterDateFrom || filterDateTo) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterGov('');
                                  setFilterDist('');
                                  setFilterDateFrom('');
                                  setFilterDateTo('');
                                  setSelectedTripIdForBooking(null);
                                }}
                                className="text-[9px] hover:text-red-400 text-slate-400 font-bold transition flex items-center gap-0.5 cursor-pointer"
                              >
                                ❌ إلغاء التصفية العامة
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 flex-row-reverse text-right">
                            {/* Governorate */}
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] text-slate-400 font-sans">المحافظة</span>
                              <select
                                value={filterGov}
                                onChange={e => { setFilterGov(e.target.value); setFilterDist(''); }}
                                className="bg-slate-900 border border-slate-800 rounded px-1 py-1 text-[9px] text-slate-100 text-right outline-none cursor-pointer"
                              >
                                <option value="">الكل</option>
                                {settings.locations.map((loc, i) => (
                                  <option key={i} value={loc.governorate}>{loc.governorate}</option>
                                ))}
                              </select>
                            </div>

                            {/* District */}
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] text-slate-400 font-sans">اللواء</span>
                              <select
                                value={filterDist}
                                disabled={!filterGov}
                                onChange={e => setFilterDist(e.target.value)}
                                className="bg-slate-900 border border-slate-800 rounded px-1 py-1 text-[9px] text-slate-100 text-right outline-none cursor-pointer disabled:opacity-40"
                              >
                                <option value="">الكل</option>
                                {((settings?.locations || DEFAULT_LOCATIONS).find(l => l.governorate === filterGov)?.districts || []).map((dist, i) => (
                                  <option key={i} value={dist.name}>{dist.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* INTERACTIVE DATEPICKER CALENDAR STARTING FROM ACTUAL TODAY */}
                          {(() => {
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
                              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex flex-col gap-1.5 text-right font-sans my-1 text-slate-100">
                                <div className="flex justify-between items-center flex-row-reverse border-b border-slate-850 pb-1.5">
                                  <span className="text-[9.5px] font-bold text-amber-500 flex items-center gap-1">🗓️ التقويم والمدى الزمني الذكي</span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-extrabold text-indigo-400">{monthArName} {currentCalendarYear}</span>
                                    <div className="flex gap-1">
                                      <button 
                                        type="button" 
                                        onClick={handlePrevMonth} 
                                        className="text-[8px] text-slate-400 hover:text-white bg-slate-950 border border-slate-850 px-1 py-0.5 rounded transition"
                                      >
                                        ◀
                                      </button>
                                      <button 
                                        type="button" 
                                        onClick={handleNextMonth} 
                                        className="text-[8px] text-slate-400 hover:text-white bg-slate-950 border border-slate-850 px-1 py-0.5 rounded transition"
                                      >
                                        ▶
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-7 text-center border-b border-slate-850 pb-1 flex-row-reverse">
                                  {weekDaysAr.map((wd, i) => (
                                    <span key={i} className="text-[8px] font-bold text-slate-500">{wd}</span>
                                  ))}
                                </div>

                                <div className="grid grid-cols-7 text-center gap-1 flex-row-reverse">
                                  {daysArr.map((day, idx) => {
                                    if (day === null) return <div key={`empty-${idx}`} className="h-5"></div>;

                                    const formattedDate = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    
                                    // Range logic representation
                                    const isStart = filterDateFrom === formattedDate;
                                    const isEnd = filterDateTo === formattedDate;
                                    const isInRange = filterDateFrom && filterDateTo && formattedDate >= filterDateFrom && formattedDate <= filterDateTo;
                                    
                                    const tripsOnDay = scheduledTrips.filter(t => {
                                      const matchesCreatorOrPassenger = t.creatorId === loggedPassenger?.id || t.passengers.some(p => p.passengerId === loggedPassenger?.id);
                                      const matchesOtherFilters = (t.status === 'pending' || t.status === 'accepted') && t.availableSeats > 0 && t.creatorId !== loggedPassenger?.id;
                                      const isTargetMode = schTabMode === 'my_trips' ? matchesCreatorOrPassenger : matchesOtherFilters;
                                      return isTargetMode && t.departureTime.startsWith(formattedDate);
                                    });

                                    let cellClass = "hover:bg-slate-800 text-slate-300";
                                    if (isStart || isEnd) {
                                      cellClass = "bg-amber-500 text-slate-950 font-black rounded-md shadow-sm";
                                    } else if (isInRange) {
                                      cellClass = "bg-indigo-950/60 text-indigo-300 border border-indigo-900/30 rounded-md";
                                    }

                                    return (
                                      <button
                                        key={`day-btn-${day}`}
                                        type="button"
                                        onClick={() => {
                                          if (!filterDateFrom) {
                                            setFilterDateFrom(formattedDate);
                                            setFilterDateTo('');
                                          } else if (filterDateFrom && !filterDateTo) {
                                            if (formattedDate < filterDateFrom) {
                                              setFilterDateFrom(formattedDate);
                                            } else {
                                              setFilterDateTo(formattedDate);
                                            }
                                          } else {
                                            setFilterDateFrom(formattedDate);
                                            setFilterDateTo('');
                                          }
                                          setSelectedTripIdForBooking(null); // reset selected card
                                        }}
                                        className={`h-5 text-[9px] font-mono rounded transition flex flex-col justify-center items-center relative cursor-pointer ${cellClass}`}
                                      >
                                        <span>{day}</span>
                                        {tripsOnDay.length > 0 && (
                                          <span className={`w-1 h-1 rounded-full absolute bottom-0.5 ${isStart || isEnd ? 'bg-slate-950' : 'bg-emerald-400'}`}></span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Quick filter presets inside calendar */}
                                <div className="flex flex-wrap gap-1 justify-center mt-1 flex-row-reverse border-t border-slate-850 pt-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const todayStr = new Date().toISOString().substring(0, 10);
                                      setFilterDateFrom(todayStr);
                                      setFilterDateTo(todayStr);
                                      setSelectedTripIdForBooking(null);
                                    }}
                                    className="bg-emerald-950 border border-emerald-900/60 text-emerald-400 font-sans text-[8px] font-bold px-2 py-0.5 rounded transition hover:bg-emerald-900"
                                  >
                                    📅 رحلات اليوم الفعلي
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const today = new Date();
                                      const nextWeek = new Date();
                                      nextWeek.setDate(today.getDate() + 7);
                                      setFilterDateFrom(today.toISOString().substring(0, 10));
                                      setFilterDateTo(nextWeek.toISOString().substring(0, 10));
                                      setSelectedTripIdForBooking(null);
                                    }}
                                    className="bg-indigo-950 border border-indigo-900/60 text-indigo-300 font-sans text-[8px] font-bold px-2 py-0.5 rounded transition hover:bg-indigo-900"
                                  >
                                    📆 الأسبوع القادم
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFilterDateFrom('');
                                      setFilterDateTo('');
                                      setSelectedTripIdForBooking(null);
                                    }}
                                    className="bg-slate-950 border border-slate-800 text-slate-400 font-sans text-[8px] font-bold px-2 py-0.5 rounded transition hover:bg-slate-800"
                                  >
                                    ❌ مسح التاريخ
                                  </button>
                                </div>

                                {filterDateFrom && (
                                  <div className="text-[8.5px] font-medium text-amber-500 text-center mt-0.5 font-sans">
                                    📌 المدى المحدد: <span className="font-mono text-white">{filterDateFrom}</span> {filterDateTo ? <>إلى <span className="font-mono text-white">{filterDateTo}</span></> : '(اختر يوم آخر لتحديد المدى)'}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {(() => {
                          const activeTrips = scheduledTrips
                            .filter(t => (t.status === 'pending' || t.status === 'accepted') && t.availableSeats > 0 && t.creatorId !== loggedPassenger?.id)
                            .filter(t => {
                              if (filterGov && !t.fromArea.includes(filterGov) && !t.toArea.includes(filterGov)) return false;
                              if (filterDist && !t.fromArea.includes(filterDist) && !t.toArea.includes(filterDist)) return false;
                              const tripDate = t.departureTime.substring(0, 10);
                              if (filterDateFrom && tripDate < filterDateFrom) return false;
                              if (filterDateTo && tripDate > filterDateTo) return false;
                              return true;
                            });
                          if (activeTrips.length === 0) {
                            return (
                              <div className="text-center italic text-slate-500 text-[10px] py-10 font-sans">
                                لا توجد حالياً رحلات مجدولة معلنة تطابق التصفية. يمكنك الإعلان عن موعد بالذهاب لتبويب "جدولة ومواعيد".
                              </div>
                            );
                          }
                          return activeTrips.map(trip => {
                            const isDriverCreated = trip.creatorType === 'driver';
                            const hasCaptain = trip.driverId || isDriverCreated;
                            const pathFrom = trip.fromArea.split('-').pop()?.trim() || trip.fromArea;
                            const pathTo = trip.toArea.split('-').pop()?.trim() || trip.toArea;
                            const isSelected = selectedTripIdForBooking === trip.id;

                            return (
                              <motion.div 
                                key={trip.id} 
                                onClick={() => setSelectedTripIdForBooking(isSelected ? null : trip.id)}
                                whileHover={{ scale: 1.015, y: -2 }}
                                whileTap={{ scale: 0.995 }}
                                className={`bg-gradient-to-br text-right rounded-2xl p-3 flex flex-col gap-2 relative transition-all duration-300 cursor-pointer ${
                                  isSelected 
                                    ? 'from-[#1c1810] to-[#0a0805] border-amber-500 ring-1 ring-amber-500/50 shadow-md shadow-amber-950/20' 
                                    : 'from-[#0c1224] to-[#05070e] border-slate-800/80 hover:border-slate-700/90 hover:shadow-lg'
                                }`}
                              >
                                {isSelected && (
                                  <div className="absolute top-1.5 left-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[7.5px] px-2 py-0.5 rounded-full animate-bounce">
                                    ⚡ تم تحديد الرحلة الحالية
                                  </div>
                                )}
                                <div className="flex justify-between items-center border-b border-slate-800/60 pb-1.5 flex-row-reverse">
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-100 block">
                                      {trip.creatorType === 'driver' ? `كابتن: ${trip.creatorName}` : trip.creatorType === 'admin' ? `الإدارة السريعة: ${trip.creatorName}` : `الراكب المنشئ: ${trip.creatorName}`}
                                    </span>
                                    <span className="text-[8px] text-slate-500 font-mono mt-0.5 block">#ID: {trip.id.split('_').pop()}</span>
                                  </div>
                                  <div className="bg-indigo-550 border border-indigo-400 text-white px-2 py-0.5 rounded text-[8px] font-black tracking-wide shadow-md">
                                    {trip.availableSeats} مقاعد متاحة
                                  </div>
                                </div>

                                <div className="text-[10px] text-slate-300 leading-normal flex flex-col gap-1">
                                  <div className="flex justify-between flex-row-reverse items-center">
                                    <strong className="text-slate-400">الإنطلاق (من):</strong>
                                    <span className="text-slate-100">{pathFrom}</span>
                                  </div>
                                  <div className="flex justify-between flex-row-reverse items-center">
                                    <strong className="text-indigo-400">الوجهة (إلى):</strong>
                                    <span className="text-indigo-300">{pathTo}</span>
                                  </div>
                                  <div className="flex justify-between flex-row-reverse items-center border-t border-slate-850/60 pt-1 mt-0.5">
                                    <strong className="text-amber-500">موعد المغادرة:</strong>
                                    <span className="font-mono text-amber-400 flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-amber-400 inline" />
                                      {trip.departureTime}
                                    </span>
                                  </div>
                                </div>

                                <div className="bg-slate-950/80 p-1.5 rounded-lg border border-slate-850 text-[9px] text-slate-350 leading-relaxed">
                                  {hasCaptain ? (
                                    <div>
                                      🚕 كابتن الرحلة: <strong className="text-slate-100">{trip.driverName || trip.creatorName}</strong> <br/>
                                      <span>التواصل المباشر: مخفي للخصوصية 💬 (استخدم غرف الدردشة)</span>
                                    </div>
                                  ) : (
                                    <div className="text-amber-400 flex items-center gap-1 flex-row-reverse font-sans">
                                      <span>⚠️ بانتظار تعيين كابتن للرحلة وتثبيتها من إدارة آدم</span>
                                      <span className="bg-amber-950 border border-amber-900 text-[7px] text-amber-300 px-1 py-0.2 rounded font-extrabold">متاح للحجز المسبق ⚡</span>
                                    </div>
                                  )}
                                </div>

                                {(() => {
                                  const joinedCount = trip.passengers.length;
                                  const totalCapacity = trip.seatsCount;
                                  const joinedSeats = trip.seatsCount - trip.availableSeats;
                                  const isUserJoined = loggedPassenger ? trip.passengers.some(p => p.passengerId === loggedPassenger.id) : false;

                                  return (
                                    <div 
                                      onClick={(e) => e.stopPropagation()} 
                                      className="bg-slate-950/60 p-2 rounded-xl border border-slate-850/60 flex flex-col gap-1.5 mt-1"
                                    >
                                      <div className="flex justify-between items-center flex-row-reverse gap-3">
                                        <div className="flex flex-col gap-1 flex-1 text-right">
                                          <div className="flex justify-between items-center flex-row-reverse text-[9.5px]">
                                            <span className="text-slate-400 font-bold flex items-center gap-1 flex-row-reverse">
                                              <Users className="w-3.5 h-3.5 text-indigo-400" />
                                              مجموعة التشاركية (Pooling Group):
                                            </span>
                                            <span className="font-mono text-slate-200 font-bold bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800 text-[8.5px]">
                                              {joinedSeats} / {totalCapacity} مقاعد محجوزة
                                            </span>
                                          </div>
                                          {/* Real-time progress bar of joined passengers vs capacity */}
                                          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800 mt-1">
                                            <div 
                                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
                                              style={{ width: `${Math.min(100, (joinedSeats / totalCapacity) * 100)}%` }}
                                            />
                                          </div>
                                        </div>

                                        {/* Dynamic SVG Progress Ring */}
                                        {(() => {
                                          const percentage = totalCapacity > 0 ? (joinedSeats / totalCapacity) * 100 : 0;
                                          const radius = 22;
                                          const stroke = 3.5;
                                          const normalizedRadius = radius - stroke * 2;
                                          const circumference = normalizedRadius * 2 * Math.PI;
                                          const strokeDashoffset = circumference - (percentage / 100) * circumference;

                                          return (
                                            <div className="relative flex items-center justify-center w-11 h-11 flex-shrink-0 bg-slate-900/80 rounded-full border border-slate-800 shadow-inner">
                                              <svg className="w-full h-full transform -rotate-90">
                                                <circle
                                                  className="text-slate-800/85 stroke-current"
                                                  strokeWidth={stroke}
                                                  fill="transparent"
                                                  r={normalizedRadius}
                                                  cx={radius}
                                                  cy={radius}
                                                />
                                                <motion.circle
                                                  className={`${
                                                    percentage >= 100 
                                                      ? 'text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.4)]' 
                                                      : percentage >= 75 
                                                      ? 'text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.4)]' 
                                                      : 'text-indigo-400 drop-shadow-[0_0_4px_rgba(129,140,248,0.4)]'
                                                  } stroke-current`}
                                                  strokeWidth={stroke}
                                                  strokeDasharray={`${circumference} ${circumference}`}
                                                  initial={{ strokeDashoffset: circumference }}
                                                  animate={{ strokeDashoffset }}
                                                  transition={{ duration: 0.6, ease: 'easeOut' }}
                                                  fill="transparent"
                                                  r={normalizedRadius}
                                                  cx={radius}
                                                  cy={radius}
                                                />
                                              </svg>
                                              <span className="absolute text-[8px] font-black font-mono text-slate-100 flex flex-col items-center leading-none">
                                                <span>{Math.round(percentage)}%</span>
                                              </span>
                                            </div>
                                          );
                                        })()}
                                      </div>

                                      <div className="flex justify-between items-center flex-row-reverse gap-2">
                                        <span className="text-[8.5px] text-slate-400">
                                          {joinedCount > 0 ? `👥 انضم ${joinedCount} من الركاب حالياً` : '💤 لا يوجد ركاب منضمين بعد'}
                                        </span>
                                        
                                        <div className="flex gap-1.5 items-center">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const shareText = `تفضل بالانضمام إلينا في هذه الرحلة التشاركية المميزة عبر قوافل آدم! 🚗\n📍 من: ${pathFrom}\n📍 إلى: ${pathTo}\n⏰ موعد المغادرة: ${trip.departureTime}\n👥 المقاعد المحجوزة: ${joinedSeats} من ${totalCapacity}\n⚡ المقاعد الشاغرة المتبقية: ${trip.availableSeats}\nانضم إلينا الآن من خلال تطبيق وموقع قوافل آدم!`;
                                              
                                              if (navigator.share) {
                                                navigator.share({
                                                  title: 'مشاركة الرحلة التشاركية - قوافل آدم',
                                                  text: shareText
                                                }).catch(() => {
                                                  navigator.clipboard.writeText(shareText);
                                                  alert('✓ تم نسخ تفاصيل وموقع الرحلة لطلب الانضمام! يمكنك لصقها الآن ومشاركتها مع أصدقائك بنجاح.');
                                                });
                                              } else {
                                                navigator.clipboard.writeText(shareText);
                                                alert('✓ تم نسخ تفاصيل وموقع الرحلة لطلب الانضمام! يمكنك لصقها الآن ومشاركتها مع أصدقائك بنجاح.');
                                              }
                                            }}
                                            className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/30 transition cursor-pointer flex items-center gap-1 flex-row-reverse shadow-sm"
                                          >
                                            <Share2 className="w-3 h-3" />
                                            مشاركة الرحلة
                                          </button>

                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (!loggedPassenger) {
                                                alert("⚠️ يرجى تسجيل الدخول أولاً كراكب للانضمام إلى مجموعة التشاركية!");
                                                return;
                                              }
                                              if (isUserJoined) {
                                                const res = cancelPassengerSeatReservation(trip.id, loggedPassenger.id);
                                                if (res.success) {
                                                  alert("ℹ️ تم إلغاء انضمامك من مجموعة التشاركية للرحلة بنجاح.");
                                                } else {
                                                  alert(`❌ فشل إلغاء الانضمام: ${res.msg}`);
                                                }
                                              } else {
                                                if (trip.availableSeats < 1) {
                                                  alert("⚠️ عذراً، لا توجد مقاعد شاغرة متوفرة في هذه الرحلة.");
                                                  return;
                                                }
                                                const res = bookScheduledTrip(loggedPassenger.id, trip.id, 1, '', '', 'انضمام مباشر من مجموعة التشاركية');
                                                if (res.success) {
                                                  alert("🎉 تهانينا! تم انضمامك لمجموعة التشاركية بنجاح بمقعد واحد. يمكنك تخصيص المحطات وملاحظاتك عند تحديد الكرت بالكامل.");
                                                } else {
                                                  alert(`❌ فشل الانضمام: ${res.msg}`);
                                                }
                                              }
                                            }}
                                            className={`px-3 py-1 rounded-lg text-[9px] font-black transition cursor-pointer flex items-center gap-1 flex-row-reverse border shadow-sm ${
                                              isUserJoined 
                                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30' 
                                                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/30'
                                            }`}
                                          >
                                            {isUserJoined ? (
                                              <>
                                                <UserMinus className="w-3 h-3" />
                                                مغادرة المجموعة
                                              </>
                                            ) : (
                                              <>
                                                <UserPlus className="w-3 h-3" />
                                                الانضمام للمجموعة 👥
                                              </>
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {(() => {
                                  const driverIdToQuery = trip.driverId || (trip.creatorType === 'driver' ? trip.creatorId : null);
                                  const driverDetails = driverIdToQuery ? drivers.find(d => d.id === driverIdToQuery) : null;
                                  
                                  const carDesc = driverDetails 
                                    ? `${driverDetails.carType} (${driverDetails.carClass || 'فئة صالون'})` 
                                    : (hasCaptain ? 'كيا فورتي / هيونداي أفانتي' : 'بانتظار تعيين المركبة من إدارة آدم');
                                  
                                  const plateDesc = driverDetails?.carPlate || (hasCaptain ? '70-9432 / فحص أمان آدم' : 'قيد التنسيق والتدقيق الجاري');
                                  
                                  const departureHour = trip.departureTime.split(' ').pop() || '08:00';
                                  const pickupEstimate = hasCaptain 
                                    ? `خلال 10 - 15 دقيقة قبل المغادرة المحددة (${departureHour})` 
                                    : 'سيتم تحديده فور تأكيد كابتن الرحلة المعتمد';

                                  return (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={isSelected ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                                      className="overflow-hidden"
                                    >
                                      <div className="bg-indigo-950/20 border border-indigo-900/35 rounded-xl p-2.5 flex flex-col gap-1.5 text-right mt-1">
                                        <div className="text-[10px] text-indigo-400 font-extrabold flex items-center justify-between flex-row-reverse pb-1.5 border-b border-indigo-950/50">
                                          <span className="flex items-center gap-1 flex-row-reverse">
                                            <Car className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                                            تفاصيل المركبة والرحلة (تفاصيل إضافية 📋)
                                          </span>
                                          <span className="text-[7.5px] bg-indigo-500/10 px-1.5 py-0.5 rounded text-indigo-300 font-mono">Adam Secured</span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-1.5 text-[9px] mt-1">
                                          <div className="flex justify-between flex-row-reverse items-center bg-slate-950/30 p-1.5 rounded border border-slate-850/40">
                                            <span className="text-slate-400 font-semibold flex items-center gap-1 flex-row-reverse">
                                              <Car className="w-3 h-3 text-slate-500" />
                                              الموديل ونوع المركبة:
                                            </span>
                                            <span className="text-slate-200 font-bold">{carDesc}</span>
                                          </div>

                                          <div className="flex justify-between flex-row-reverse items-center bg-slate-950/30 p-1.5 rounded border border-slate-850/40">
                                            <span className="text-slate-400 font-semibold flex items-center gap-1 flex-row-reverse">
                                              <Fingerprint className="w-3 h-3 text-slate-500" />
                                              رقم لوحة السيارة الفيدرالي:
                                            </span>
                                            <span className="text-slate-200 font-mono font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900">{plateDesc}</span>
                                          </div>

                                          <div className="flex justify-between flex-row-reverse items-center bg-slate-950/30 p-1.5 rounded border border-slate-850/40">
                                            <span className="text-slate-400 font-semibold flex items-center gap-1 flex-row-reverse">
                                              <Timer className="w-3 h-3 text-slate-500" />
                                              موعد ركوب الركاب المتوقع:
                                            </span>
                                            <span className="text-amber-400 font-bold">{pickupEstimate}</span>
                                          </div>

                                          {driverDetails && (
                                            <div className="flex justify-between flex-row-reverse items-center bg-slate-950/30 p-1.5 rounded border border-slate-850/40">
                                              <span className="text-slate-400 font-semibold flex items-center gap-1 flex-row-reverse">
                                                <Star className="w-3 h-3 text-amber-400" />
                                                تقييم الكابتن وسجل رحلاته:
                                              </span>
                                              <span className="text-amber-300 font-bold">⭐ {driverDetails.ratingAverage || '4.9'} ({driverDetails.tripsCount || 10} رحلة ناجحة)</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })()}

                                {/* Click to expand tip text */}
                                {!isSelected && (
                                  <div className="text-center text-[8.5px] text-indigo-400/80 hover:text-indigo-350 font-bold mt-1 font-sans">
                                    ✨ اضغط على كرت الرحلة لتحديدها وإظهار خيارات زر الحجز 🎟️
                                  </div>
                                )}

                                {/* BOOKING OPTIONS AND BUTTONS FADE-IN IMMEDIATELY UPON SELECTING THE TRIP */}
                                {isSelected && (
                                  <div 
                                    onClick={(e) => e.stopPropagation()} // prevent collapsing
                                    className="pt-2 mt-1 border-t border-slate-800/60 flex flex-col gap-2 transition duration-200"
                                  >
                                    <div className="flex items-center justify-between flex-row-reverse gap-2">
                                      <div className="flex items-center gap-1.5 flex-row-reverse">
                                        <span className="text-[10px] text-slate-400">كم مقعداً ترغب في حجزه؟</span>
                                        <select
                                          value={seatsToBookMap[trip.id] || 1}
                                          onChange={(e) => setSeatsToBookMap({
                                            ...seatsToBookMap,
                                            [trip.id]: parseInt(e.target.value)
                                          })}
                                          className="bg-slate-950 border border-slate-800 text-slate-100 text-[10.5px] rounded px-1.5 py-0.5 font-bold focus:outline-none focus:border-indigo-500 font-sans"
                                        >
                                          {Array.from({ length: trip.availableSeats }, (_, i) => i + 1).map((n) => (
                                            <option className="bg-slate-950" key={n} value={n}>
                                              {n} {n === 1 ? 'مقعد واحد' : `${n} مقاعد`}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>

                                    {/* Custom User-Routing requests for scheduled trips */}
                                    <div className="w-full mt-1.5 p-2 bg-slate-950/40 border border-slate-850 rounded-xl flex flex-col gap-1.5 text-right font-sans mb-1 text-slate-100">
                                      <div className="text-[10px] font-bold text-indigo-400 pb-0.5 border-b border-indigo-950 flex justify-between items-center flex-row-reverse">
                                        <span>🎯 تخصيص محطات الراكب الخاصة (اختياري)</span>
                                        <span className="text-[8px] bg-indigo-500/10 text-indigo-300 font-mono px-1 rounded border border-indigo-500/20">AI Co-pilot Ready</span>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                        <div className="flex flex-col gap-0.5" dir="rtl">
                                          <span className="text-[8px] text-slate-400">موقع صعود مفضل للالتقاط</span>
                                          <input
                                            type="text"
                                            value={schPickupMap[trip.id] || ""}
                                            onChange={(e) => setSchPickupMap({ ...schPickupMap, [trip.id]: e.target.value })}
                                            placeholder="بوابة الجامعة الأردنية / صرح الشهيد"
                                            className="bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-[9px] text-slate-200 outline-none focus:border-indigo-500 font-sans text-right placeholder-slate-500"
                                          />
                                        </div>
                                        <div className="flex flex-col gap-0.5" dir="rtl">
                                          <span className="text-[8px] text-slate-400">موقع نزول مخصص للوصول</span>
                                          <input
                                            type="text"
                                            value={schDropoffMap[trip.id] || ""}
                                            onChange={(e) => setSchDropoffMap({ ...schDropoffMap, [trip.id]: e.target.value })}
                                            placeholder="تفاصيل: إشارات البلد / الدوار السابع"
                                            className="bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-[9px] text-slate-200 outline-none focus:border-indigo-500 font-sans text-right placeholder-slate-500"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex flex-col gap-0.5" dir="rtl">
                                        <span className="text-[8px] text-slate-400">ملاحظات وشروط خاصة (مثال: أمتعة زائدة، حركة كبار السن)</span>
                                        <input
                                          type="text"
                                          value={schNoteMap[trip.id] || ""}
                                          onChange={(e) => setSchNoteMap({ ...schNoteMap, [trip.id]: e.target.value })}
                                          placeholder="أحمل حقيبتين سفر كبار، أريد التحرك في الوقت تماماً..."
                                          className="bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-[9px] text-slate-200 outline-none focus:border-indigo-500 font-sans text-right placeholder-slate-500"
                                        />
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const chosenSeats = seatsToBookMap[trip.id] || 1;
                                        const res = bookScheduledTrip(
                                          loggedPassenger!.id,
                                          trip.id,
                                          chosenSeats,
                                          schPickupMap[trip.id] || '',
                                          schDropoffMap[trip.id] || '',
                                          schNoteMap[trip.id] || ''
                                        );
                                        if (res.success) {
                                          alert(res.msg);
                                          setSuccessRequestMsg(res.msg);
                                          setRequestMode('instant');
                                          setActiveTab('scheduled');
                                          setSchTabMode('my_trips');
                                          setSelectedTripIdForBooking(null);
                                        } else {
                                          alert(res.msg);
                                        }
                                      }}
                                      className="bg-emerald-500 hover:bg-emerald-405 text-black font-extrabold w-full text-center py-2.5 rounded-xl text-[10.5px] cursor-pointer transition shadow-md flex items-center justify-center gap-1 border-none outline-none"
                                    >
                                      <span>تأكيد وحجز مقعد بالموعد المختار الآن 🎟️</span>
                                    </button>
                                  </div>
                                )}
                              </motion.div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                  )
                )
              )}

              {/* ACTIVE RIDES TAB */}
              {activeTab === 'active_rides' && (
                <div className="flex flex-col gap-4 font-sans text-right" dir="rtl">
                  {/* Header */}
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-emerald-400" />
                        <span>{t('الرحلات والمشاوير النشطة الحالية', 'Active Rides & Live Trips')}</span>
                      </h3>
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                        {totalPassengerActiveCount} {t('نشطة', 'active')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('request')}
                      className="text-[9.5px] font-bold text-slate-400 hover:text-emerald-400 transition bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{t('طلب مشوار جديد', 'Request New Ride')}</span>
                    </button>
                  </div>

                  {totalPassengerActiveCount === 0 ? (
                    <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3 text-slate-400">
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-full text-slate-500">
                        <Compass className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200 mb-1">{t('لا توجد مشاوير أو رحلات نشطة حالياً', 'No Active Rides or Bookings Currently')}</h4>
                        <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                          {t('يمكنك طلب تاكسي فوري داخل محافظتك أو حجز مقعدك في رحلات التجميع والسفر المجدولة بين المحافظات الآن.', 'You can request an instant local taxi or book your seat in intercity pooled trips now.')}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setActiveTab('request')}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-lg shadow-emerald-950/30 transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>{t('طلب مشوارك الفوري الآن 🚕', 'Request Your Instant Ride Now 🚕')}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* SECTION 1: INTRACITY LOCAL RIDES */}
                      {passengerActiveIntraRides.length > 0 && (
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 border-b border-slate-850 pb-1">
                            <span className="flex items-center gap-1 text-emerald-400">
                              <span>🚕</span>
                              <span>{t('مشاوير تاكسي المحافظات الفورية', 'Instant Local Taxi Rides')} ({passengerActiveIntraRides.length})</span>
                            </span>
                            <span className="text-[8.5px] text-slate-500 font-mono">نظام التوجيه المباشر</span>
                          </div>

                          {passengerActiveIntraRides.map((ride) => {
                            const isAccepted = ride.status === 'accepted';
                            const isStarted = ride.status === 'started';
                            const isPending = ride.status === 'pending';

                            return (
                              <motion.div
                                key={ride.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-950/90 border-2 border-emerald-500/40 hover:border-emerald-500/70 rounded-2xl p-4 shadow-xl flex flex-col gap-3 relative overflow-hidden font-sans transition-all"
                              >
                                {/* Top Accent Bar */}
                                <div className={`absolute top-0 inset-x-0 h-1 ${
                                  isStarted ? 'bg-emerald-500' : isAccepted ? 'bg-indigo-500 animate-pulse' : 'bg-amber-500'
                                }`} />

                                {/* Header & Status */}
                                <div className="flex justify-between items-center flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-100 flex items-center gap-1">
                                      <span>مشوار تاكسي مباشر</span>
                                      <span className="text-[9px] text-slate-500 font-mono">#{ride.id.slice(-6)}</span>
                                    </span>
                                  </div>

                                  <span className={`text-[9.5px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                                    isStarted 
                                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse' 
                                      : isAccepted 
                                      ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40 animate-pulse' 
                                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                  }`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                                    <span>
                                      {isStarted 
                                        ? t('🟢 انطلقت الرحلة - في الطريق إلى الوجهة', '🟢 Ride In Progress') 
                                        : isAccepted 
                                        ? t('🔵 تم قبول المشوار - الكابتن متوجه إليك', '🔵 Captain En Route') 
                                        : t('🟡 جاري البحث والمطابقة مع أقرب كابتن...', '🟡 Searching for nearby Captain...')}
                                    </span>
                                  </span>
                                </div>

                                {/* Route Details */}
                                <div className="bg-slate-900/80 border border-slate-850 rounded-xl p-3 flex flex-col gap-2">
                                  <div className="flex items-start gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                                    <div className="flex-1 text-[10.5px]">
                                      <span className="text-slate-400 text-[9px] block font-bold">{t('نقطة الإقلال والالتقاء:', 'Pickup Point:')}</span>
                                      <strong className="text-slate-100">{ride.pickupName}</strong>
                                    </div>
                                  </div>

                                  {ride.waypoints && ride.waypoints.length > 0 && (
                                    <div className="flex flex-col gap-1 pr-4 border-r border-indigo-500/30 mr-1 my-0.5">
                                      {ride.waypoints.map((wp, wIdx) => (
                                        <div key={wIdx} className="text-[9.5px] text-indigo-300 flex items-center gap-1.5">
                                          <span>🛑</span>
                                          <span>{wp.name}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <div className="flex items-start gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                                    <div className="flex-1 text-[10.5px]">
                                      <span className="text-slate-400 text-[9px] block font-bold">{t('وجهة الوصول المقصودة:', 'Dropoff Destination:')}</span>
                                      <strong className="text-slate-100">{ride.dropoffName}</strong>
                                    </div>
                                  </div>
                                </div>

                                {/* Price & Payment Info */}
                                <div className="flex justify-between items-center bg-slate-900/60 border border-slate-850 rounded-xl p-2.5">
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    <span className="text-slate-400">{t('طريقة الدفع:', 'Payment:')}</span>
                                    <span className={`font-bold ${ride.paymentMethod === 'cash' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                      {ride.paymentMethod === 'cash' ? '💵 نقدي (كاش)' : '💳 محفظة رقمية'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-400 text-[9px]">{t('الأجرة الإجمالية:', 'Fare:')}</span>
                                    <span className="text-emerald-400 font-mono font-black text-sm">
                                      {ride.price.toFixed(2)} {currency}
                                    </span>
                                  </div>
                                </div>

                                {/* Assigned Captain Info (if accepted or started) */}
                                {(isAccepted || isStarted) && ride.driverName && (
                                  <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-xl p-3 flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 font-bold text-xs">
                                          👤
                                        </div>
                                        <div>
                                          <div className="text-[11px] font-bold text-slate-100">{ride.driverName}</div>
                                          <div className="text-[9px] text-slate-400 font-mono">كابتن تاكسي معتمد</div>
                                        </div>
                                      </div>

                                      {ride.driverPhone && (
                                        <a
                                          href={`tel:${ride.driverPhone}`}
                                          className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                                        >
                                          <Phone className="w-3 h-3" />
                                          <span>{ride.driverPhone}</span>
                                        </a>
                                      )}
                                    </div>

                                    {ride.startOtp && (
                                      <div className="flex justify-between items-center bg-slate-950/80 border border-indigo-500/30 px-3 py-1.5 rounded-lg">
                                        <span className="text-[9px] text-slate-400 font-bold">🔐 رمز الأمان لبدء الرحلة (OTP):</span>
                                        <span className="font-mono font-black text-sm text-indigo-400 tracking-widest bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/40">
                                          {ride.startOtp}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* ACTION BUTTONS: CANCEL & LIVE MAP */}
                                <div className="flex gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCancelModal({
                                        isOpen: true,
                                        title: 'تأكيد إلغاء المشوار الفوري',
                                        description: `هل أنت متأكد من رغبتك في إلغاء المشوار (${ride.pickupName} ➔ ${ride.dropoffName})؟`,
                                        confirmText: 'نعم، قم بإلغاء المشوار الآن',
                                        onConfirm: () => {
                                          cancelIntraCityRide(ride.id, 'passenger');
                                          alert('تم إلغاء مشوار التاكسي بنجاح وتحرير طلبك.');
                                        }
                                      });
                                    }}
                                    className="flex-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/40 hover:border-red-500 py-2 rounded-xl text-[10.5px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>{t('إلغاء المشوار ❌', 'Cancel Ride ❌')}</span>
                                  </button>

                                  <a
                                    href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(ride.pickupName)}&destination=${encodeURIComponent(ride.dropoffName)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 py-2 rounded-xl text-[10.5px] font-bold transition flex items-center justify-center gap-1"
                                  >
                                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>{t('المسار على الخريطة', 'Map Route')}</span>
                                  </a>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}

                      {/* SECTION 2: INTERCITY POOLED RIDES / REQUESTS */}
                      {(passengerActiveInterRide || passengerActiveInterRequest) && (
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 border-b border-slate-850 pb-1">
                            <span className="flex items-center gap-1 text-indigo-400">
                              <span>🛣️</span>
                              <span>{t('رحلات التجميع الذكي بين المحافظات', 'Intercity Smart Pooling Rides')}</span>
                            </span>
                            <span className="text-[8.5px] text-slate-500 font-mono">سفر بين المدن</span>
                          </div>

                          {passengerActiveInterRide ? (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-slate-950/90 border-2 border-indigo-500/40 hover:border-indigo-500/70 rounded-2xl p-4 shadow-xl flex flex-col gap-3 relative overflow-hidden font-sans transition-all"
                            >
                              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-indigo-500 to-purple-600" />

                              <div className="flex justify-between items-center flex-wrap gap-2">
                                <span className="text-xs font-black text-slate-100">
                                  رحلة تجميعية مشتركة #{passengerActiveInterRide.id.slice(-6)}
                                </span>
                                <span className="text-[9.5px] font-extrabold px-2.5 py-1 rounded-full border bg-indigo-500/20 text-indigo-400 border-indigo-500/40 animate-pulse">
                                  {passengerActiveInterRide.status === 'started' ? '🟢 انطلقت الرحلة' : '🔵 الكابتن في الطريق'}
                                </span>
                              </div>

                              <div className="bg-slate-900/80 border border-slate-850 rounded-xl p-3 flex flex-col gap-1 text-[10.5px]">
                                <div>من: <strong className="text-slate-100">{passengerActiveInterRide.fromArea}</strong></div>
                                <div>إلى: <strong className="text-slate-100">{passengerActiveInterRide.toArea}</strong></div>
                              </div>

                              {passengerActiveInterRide.startOtp && (
                                <div className="flex justify-between items-center bg-slate-900/60 border border-slate-850 px-3 py-1.5 rounded-lg">
                                  <span className="text-[9px] text-slate-400 font-bold">🔐 رمز الأمان (OTP):</span>
                                  <span className="font-mono font-black text-sm text-indigo-400 tracking-widest bg-indigo-950 px-2 py-0.5 rounded border border-indigo-500/30">
                                    {passengerActiveInterRide.startOtp}
                                  </span>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setCancelModal({
                                    isOpen: true,
                                    title: 'تأكيد إلغاء الرحلة التجميعية',
                                    description: `هل ترغب بالتأكيد في إلغاء طلب السفر التجميعي (${passengerActiveInterRide.fromArea} ➔ ${passengerActiveInterRide.toArea})؟`,
                                    confirmText: 'نعم، إلغاء الرحلة',
                                    onConfirm: () => {
                                      cancelRideRequest(loggedPassenger!.id);
                                      alert('تم إلغاء حجز الرحلة بنجاح.');
                                    }
                                  });
                                }}
                                className="w-full bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/40 py-2 rounded-xl text-[10.5px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{t('إلغاء الرحلة التجميعية ❌', 'Cancel Pooled Ride ❌')}</span>
                              </button>
                            </motion.div>
                          ) : passengerActiveInterRequest ? (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-slate-950/90 border-2 border-amber-500/40 hover:border-amber-500/70 rounded-2xl p-4 shadow-xl flex flex-col gap-3 relative overflow-hidden font-sans transition-all"
                            >
                              <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />

                              <div className="flex justify-between items-center flex-wrap gap-2">
                                <span className="text-xs font-black text-slate-100">
                                  طلب تجميع مقاعد #{passengerActiveInterRequest.id.slice(-6)}
                                </span>
                                <span className="text-[9.5px] font-extrabold px-2.5 py-1 rounded-full border bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse">
                                  🟡 قيد التجميع والمطابقة الذكية
                                </span>
                              </div>

                              <div className="bg-slate-900/80 border border-slate-850 rounded-xl p-3 flex flex-col gap-1 text-[10.5px]">
                                <div>المسار: <strong className="text-slate-100">{passengerActiveInterRequest.fromArea} ➔ {passengerActiveInterRequest.toArea}</strong></div>
                                <div>المقاعد المحجوزة: <strong className="text-amber-400 font-bold">{passengerActiveInterRequest.seatsCount} أشخاص</strong></div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setCancelModal({
                                    isOpen: true,
                                    title: 'تأكيد إلغاء طلب التجميع',
                                    description: `هل ترغب في إلغاء طلب التجميع (${passengerActiveInterRequest.fromArea} ➔ ${passengerActiveInterRequest.toArea})؟`,
                                    confirmText: 'نعم، إلغاء الطلب',
                                    onConfirm: () => {
                                      cancelRideRequest(loggedPassenger!.id);
                                      alert('تم إلغاء طلب الرحلة التجميعية.');
                                    }
                                  });
                                }}
                                className="w-full bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/40 py-2 rounded-xl text-[10.5px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{t('إلغاء طلب التجميع ❌', 'Cancel Pooling Request ❌')}</span>
                              </button>
                            </motion.div>
                          ) : null}
                        </div>
                      )}

                      {/* SECTION 3: SCHEDULED TRIPS BOOKINGS */}
                      {passengerActiveScheduledBookings.length > 0 && (
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 border-b border-slate-850 pb-1">
                            <span className="flex items-center gap-1 text-amber-400">
                              <span>📅</span>
                              <span>{t('حجوزات الرحلات والقوافل المجدولة', 'Scheduled Trips Bookings')} ({passengerActiveScheduledBookings.length})</span>
                            </span>
                            <span className="text-[8.5px] text-slate-500 font-mono">مواعيد مسبقة</span>
                          </div>

                          {passengerActiveScheduledBookings.map((trip) => {
                            const myPassengerRecord = trip.passengers.find(p => p.passengerId === loggedPassenger?.id);
                            const bookedSeats = myPassengerRecord?.seatsCount || 1;

                            return (
                              <motion.div
                                key={trip.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-950/90 border-2 border-amber-500/40 hover:border-amber-500/70 rounded-2xl p-4 shadow-xl flex flex-col gap-3 relative overflow-hidden font-sans transition-all"
                              >
                                <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />

                                <div className="flex justify-between items-center flex-wrap gap-2">
                                  <span className="text-xs font-black text-slate-100">
                                    رحلة مجدولة: {trip.fromGovernorate} ➔ {trip.toGovernorate}
                                  </span>
                                  <span className="text-[9.5px] font-extrabold px-2.5 py-1 rounded-full border bg-amber-500/20 text-amber-400 border-amber-500/40">
                                    ⏰ {trip.departureTime ? trip.departureTime.replace('T', ' ') : 'موعد محدد'}
                                  </span>
                                </div>

                                <div className="bg-slate-900/80 border border-slate-850 rounded-xl p-3 flex flex-col gap-1 text-[10.5px]">
                                  <div>المسار: <strong className="text-slate-100">{trip.fromDistrict || trip.fromGovernorate} ➔ {trip.toDistrict || trip.toGovernorate}</strong></div>
                                  <div>عدد المقاعد المحجوزة: <strong className="text-amber-400 font-bold">{bookedSeats} مقاعد</strong></div>
                                  <div>الأجرة لكل راكب: <strong className="text-emerald-400 font-mono font-bold">{trip.passengerFare.toFixed(2)} {currency}</strong></div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setCancelModal({
                                      isOpen: true,
                                      title: 'تأكيد إلغاء حجز المقعد المجدول',
                                      description: `هل ترغب بالتأكيد في إلغاء حجزك في الرحلة المجدولة (${trip.fromGovernorate} ➔ ${trip.toGovernorate})؟`,
                                      confirmText: 'نعم، قم بإلغاء الحجز',
                                      onConfirm: () => {
                                        cancelPassengerSeatReservation(trip.id, loggedPassenger!.id);
                                        alert('تم إلغاء حجز المقعد بنجاح.');
                                      }
                                    });
                                  }}
                                  className="w-full bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/40 py-2 rounded-xl text-[10.5px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{t('إلغاء حجز المقعد ❌', 'Cancel Seat Booking ❌')}</span>
                                </button>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* RIDE HISTORY TAB */}
              {activeTab === 'history' && (
                <div className="flex flex-col gap-3 font-sans">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 flex-row-reverse">
                    <h3 className="text-xs font-bold text-slate-200 flex justify-end gap-1 items-center">
                      <span>{t('تاريخ رحلات آدم المنقضية', 'Adam Trip History Archive')}</span>
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
                    const intercityRides = rides.filter(r => r.status === 'completed' && r.requests.some(req => req.passengerId === loggedPassenger.id));
                    const intracityRidesList = (intraCityRides || []).filter(r => r.status === 'completed' && r.passengerId === loggedPassenger.id);

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
                          {t('لا توجد رحلات مطابقة في أرشيفك حالياً.', 'No matching trips found in your archive.')}
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col gap-3 h-[380px] overflow-y-auto pr-1">
                        {combined.map((trip, idx) => {
                          if (trip.type === 'intercity') {
                            const ride = trip.data;
                            const matchingReq = ride.requests.find((r: any) => r.passengerId === loggedPassenger.id);
                            const seats = matchingReq?.seatsCount || 1;
                            const price = seats * settings.passengerFarePerSeat;
                            
                            // Find driver details if available
                            const driverDetails = drivers.find(d => d.id === ride.driverId);
                            const isDriverRated = !!ride.driverRating;

                            return (
                              <div key={`inter-${ride.id}-${idx}`} className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col gap-2 text-right relative overflow-hidden transition hover:border-slate-800">
                                <div className="absolute top-0 left-0 bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-br-lg text-[8px] font-bold">
                                  {t('بين المحافظات 🚌', 'Intercity 🚌')}
                                </div>
                                
                                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 flex-row-reverse">
                                  <span className="font-mono">{ride.endTime || ride.startTime || t('منتهية', 'Completed')}</span>
                                  <span className="bg-slate-900 px-2 py-0.5 rounded text-indigo-300 font-bold">
                                    {t(`شامل دمج ${seats} مقاعد`, `Pooled ${seats} seats`)}
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

                                {/* Driver Info Card section */}
                                <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-900/80 text-[10px] space-y-1 mt-1 text-right">
                                  <div className="text-slate-400 font-bold flex justify-between flex-row-reverse">
                                    <span>{t('معلومات الكابتن:', 'Captain Information:')}</span>
                                    <span className="text-indigo-400 font-bold">{driverDetails?.fullName || (ride.driverId ? t('كابتن آدم التشاركي', 'Adam Co-Captain') : t('قيد التعيين', 'Assigned soon'))}</span>
                                  </div>
                                  {driverDetails && (
                                    <div className="text-slate-300 font-mono flex justify-between flex-row-reverse">
                                      <span>{driverDetails.phone}</span>
                                      <span className="bg-amber-400/10 text-amber-400 px-1 py-0.2 rounded text-[9px] font-bold">
                                        {driverDetails.carType} | {driverDetails.carPlate}
                                      </span>
                                    </div>
                                  )}
                                  <div className="text-slate-400 flex justify-between flex-row-reverse font-sans mt-0.5">
                                    <span>{t('تكلفة المقاعد الإجمالية:', 'Total Seats Cost:')}</span>
                                    <span className="text-emerald-400 font-bold font-mono">{price.toFixed(2)} {t('د.أ', 'JOD')}</span>
                                  </div>
                                </div>

                                {/* Rating Section */}
                                <div className="mt-1 border-t border-slate-900 pt-2">
                                  {isDriverRated ? (
                                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2 text-right">
                                      <div className="flex items-center gap-1.5 justify-end text-[10px] text-amber-400 font-bold flex-row-reverse">
                                        <div className="flex text-amber-400">
                                          {Array.from({ length: ride.driverRating.rating }).map((_, i) => (
                                            <span key={i}>★</span>
                                          ))}
                                          {Array.from({ length: 5 - ride.driverRating.rating }).map((_, i) => (
                                            <span key={i} className="text-slate-700">★</span>
                                          ))}
                                        </div>
                                        <span>{t('تقييمك لمشوار الكابتن:', 'Your feedback for the captain:')}</span>
                                      </div>
                                      {ride.driverRating.note && (
                                        <p className="text-[10px] text-slate-400 italic mt-0.5">
                                          "{ride.driverRating.note}"
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      {ratingTripId === ride.id ? (
                                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-2 mt-1 animate-fade-in">
                                          <div className="flex items-center justify-between flex-row-reverse">
                                            <span className="text-[10.5px] font-bold text-slate-300">{t('اختر التقييم (1 - 5 نجوم):', 'Star Rating (1 - 5 Stars):')}</span>
                                            <div className="flex gap-1 flex-row-reverse">
                                              {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                  key={star}
                                                  type="button"
                                                  onClick={() => setRatingVal(star)}
                                                  className="text-lg transition-transform focus:scale-125 cursor-pointer"
                                                >
                                                  <span className={star <= ratingVal ? "text-amber-400" : "text-slate-700"}>★</span>
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                          <div className="space-y-1">
                                            <div className="flex gap-1 items-center">
                                              <input
                                                type="text"
                                                value={ratingNote}
                                                onChange={(e) => setRatingNote(e.target.value)}
                                                placeholder={t('تعليق اختياري أو ملاحظة صوتية مباشرة...', 'Optional feedback or live voice note...')}
                                                className="w-full bg-slate-950 text-[10px] p-2 rounded-lg border border-slate-850 outline-none text-right transition focus:border-indigo-500"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                                                  if (!SpeechRec) {
                                                    alert("متصفحك لا يدعم خاصية تحويل الكلام الصوتي إلى نص مباشرة.");
                                                    return;
                                                  }
                                                  const recognition = new SpeechRec();
                                                  recognition.lang = 'ar-JO';
                                                  recognition.onstart = () => alert("🎙️ جارٍ الاستماع لملاحظتك الصوتية باللغة العربية...");
                                                  recognition.onresult = (event: any) => {
                                                    const transcript = event.results[0][0].transcript;
                                                    setRatingNote(prev => prev ? `${prev} ${transcript}` : transcript);
                                                  };
                                                  recognition.onerror = () => alert("تعذر التقاط الصوت، يرجى المحاولة مرة أخرى.");
                                                  recognition.start();
                                                }}
                                                title="تسجيل ملاحظة صوتية (تحويل الكلام إلى نص)"
                                                className="bg-slate-850 hover:bg-slate-800 border border-slate-700 text-amber-400 p-2 rounded-lg cursor-pointer transition shrink-0 flex items-center justify-center shadow-inner text-[10px]"
                                              >
                                                🎙️ صوتي
                                              </button>
                                            </div>
                                            <div className="flex gap-1 flex-row-reverse text-[9.5px]">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  submitRating(ride.id, 'passenger', loggedPassenger.id, ratingVal, ratingNote);
                                                  setRatingTripId(null);
                                                  setRatingNote('');
                                                  setRatingVal(5);
                                                }}
                                                className="bg-amber-500 hover:bg-amber-600 font-black text-black px-3 py-1 rounded-md cursor-pointer transition"
                                              >
                                                {t('إرسال التقييم', 'Submit')}
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setRatingTripId(null)}
                                                className="bg-slate-800 text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-md cursor-pointer transition"
                                              >
                                                {t('الغاء', 'Cancel')}
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setRatingTripId(ride.id);
                                            setRatingVal(5);
                                            setRatingNote('');
                                          }}
                                          className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold py-1.5 rounded-lg border border-indigo-400/20 text-center transition flex justify-center items-center gap-1 cursor-pointer"
                                        >
                                          <span>{t('تقييم الكابتن والمشوار ⭐', 'Rate Captain & Ride ⭐')}</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          } else {
                            // Intracity Ride
                            const ride = trip.data;
                            const price = ride.price;
                            
                            // Find driver details if available
                            const driverDetails = drivers.find(d => d.id === ride.driverId);
                            const isDriverRated = !!ride.passengerRated;

                            return (
                              <div key={`intra-${ride.id}-${idx}`} className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col gap-2 text-right relative overflow-hidden transition hover:border-slate-800">
                                <div className="absolute top-0 left-0 bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-br-lg text-[8px] font-bold">
                                  {t('داخل المدينة 🚗', 'Intracity 🚗')}
                                </div>
                                
                                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 flex-row-reverse">
                                  <span className="font-mono">{ride.createdAt ? ride.createdAt.substring(0, 16).replace('T',' ') : t('منتهية', 'Completed')}</span>
                                  <span className="bg-slate-900 px-2 py-0.5 rounded text-emerald-300 font-mono font-bold">
                                    {ride.distanceKm} {t('كم', 'km')} | {ride.durationMin} {t('دقيقة', 'min')}
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

                                {/* Driver Info Card section */}
                                <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-900/80 text-[10px] space-y-1 mt-1 text-right">
                                  <div className="text-slate-400 font-bold flex justify-between flex-row-reverse">
                                    <span>{t('معلومات الكابتن:', 'Captain Information:')}</span>
                                    <span className="text-emerald-400 font-bold">{ride.driverName || t('كابتن آدم التوصيل السريع', 'Adam Express Captain')}</span>
                                  </div>
                                  {driverDetails && (
                                    <div className="text-slate-300 font-mono flex justify-between flex-row-reverse">
                                      <span>{driverDetails.phone}</span>
                                      <span className="bg-emerald-400/10 text-emerald-400 px-1 py-0.2 rounded text-[9px] font-bold">
                                        {driverDetails.carType} | {driverDetails.carPlate}
                                      </span>
                                    </div>
                                  )}
                                  <div className="text-slate-400 flex justify-between flex-row-reverse font-sans mt-0.5">
                                    <span>{t('تكلفة المشوار والعداد:', 'Ride Cost & Taximeter:')}</span>
                                    <span className="text-emerald-400 font-bold font-mono">{price.toFixed(2)} {t('د.أ', 'JOD')}</span>
                                  </div>
                                </div>

                                {/* Rating Section */}
                                <div className="mt-1 border-t border-slate-900 pt-2">
                                  {isDriverRated ? (
                                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2 text-right">
                                      <div className="flex items-center gap-1.5 justify-end text-[10px] text-amber-400 font-bold flex-row-reverse">
                                        <div className="flex text-amber-400">
                                          {Array.from({ length: ride.driverRatingVal || 5 }).map((_, i) => (
                                            <span key={i}>★</span>
                                          ))}
                                          {Array.from({ length: 5 - (ride.driverRatingVal || 5) }).map((_, i) => (
                                            <span key={i} className="text-slate-700">★</span>
                                          ))}
                                        </div>
                                        <span>{t('تقييمك لمشوار الكابتن:', 'Your feedback for the captain:')}</span>
                                      </div>
                                      {ride.driverRatingNote && (
                                        <p className="text-[10px] text-slate-400 italic mt-0.5">
                                          "{ride.driverRatingNote}"
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      {ratingTripId === ride.id ? (
                                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-2 mt-1 animate-fade-in">
                                          <div className="flex items-center justify-between flex-row-reverse">
                                            <span className="text-[10.5px] font-bold text-slate-300">{t('اختر التقييم (1 - 5 نجوم):', 'Star Rating (1 - 5 Stars):')}</span>
                                            <div className="flex gap-1 flex-row-reverse">
                                              {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                  key={star}
                                                  type="button"
                                                  onClick={() => setRatingVal(star)}
                                                  className="text-lg transition-transform focus:scale-125 cursor-pointer"
                                                >
                                                  <span className={star <= ratingVal ? "text-amber-400" : "text-slate-700"}>★</span>
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                          <div className="space-y-1">
                                            <div className="flex gap-1 items-center">
                                              <input
                                                type="text"
                                                value={ratingNote}
                                                onChange={(e) => setRatingNote(e.target.value)}
                                                placeholder={t('تعليق اختياري أو ملاحظة صوتية مباشرة...', 'Optional feedback or live voice note...')}
                                                className="w-full bg-slate-950 text-[10px] p-2 rounded-lg border border-slate-850 outline-none text-right transition focus:border-indigo-500"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                                                  if (!SpeechRec) {
                                                    alert("متصفحك لا يدعم خاصية تحويل الكلام الصوتي إلى نص مباشرة.");
                                                    return;
                                                  }
                                                  const recognition = new SpeechRec();
                                                  recognition.lang = 'ar-JO';
                                                  recognition.onstart = () => alert("🎙️ جارٍ الاستماع لملاحظتك الصوتية باللغة العربية...");
                                                  recognition.onresult = (event: any) => {
                                                    const transcript = event.results[0][0].transcript;
                                                    setRatingNote(prev => prev ? `${prev} ${transcript}` : transcript);
                                                  };
                                                  recognition.onerror = () => alert("تعذر التقاط الصوت، يرجى المحاولة مرة أخرى.");
                                                  recognition.start();
                                                }}
                                                title="تسجيل ملاحظة صوتية (تحويل الكلام إلى نص)"
                                                className="bg-slate-850 hover:bg-slate-800 border border-slate-700 text-amber-400 p-2 rounded-lg cursor-pointer transition shrink-0 flex items-center justify-center shadow-inner text-[10px]"
                                              >
                                                🎙️ صوتي
                                              </button>
                                            </div>
                                            <div className="flex gap-1 flex-row-reverse text-[9.5px]">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  rateIntraCityDriver(ride.id, ratingVal, ratingNote);
                                                  setRatingTripId(null);
                                                  setRatingNote('');
                                                  setRatingVal(5);
                                                }}
                                                className="bg-amber-500 hover:bg-amber-600 font-black text-black px-3 py-1 rounded-md cursor-pointer transition"
                                              >
                                                {t('إرسال التقييم', 'Submit')}
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setRatingTripId(null)}
                                                className="bg-slate-800 text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-md cursor-pointer transition"
                                              >
                                                {t('الغاء', 'Cancel')}
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setRatingTripId(ride.id);
                                            setRatingVal(5);
                                            setRatingNote('');
                                          }}
                                          className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold py-1.5 rounded-lg border border-emerald-400/20 text-center transition flex justify-center items-center gap-1 cursor-pointer"
                                        >
                                          <span>{t('تقييم الكابتن والمشوار ⭐', 'Rate Captain & Ride ⭐')}</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}






              {/* LIVE SUPPORT CHAT WITH ADMIN */}
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col min-h-[380px] font-sans">
                  <h3 className="text-xs font-bold text-slate-200 text-right border-b border-slate-800 pb-1 flex justify-end gap-1 items-center mb-2.5">
                    <span>دردشة دعم راكب آدم</span>
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                  </h3>

                  {(() => {
                    const channelId = activeRide ? activeRide.id : 'support_passenger';
                    const channelTitle = activeRide ? `محادثة رحلة آدم الجارية (#${activeRide.id.split('_').pop()})` : 'غرفة دعم ومساعدة راكب آدم المباشر 📞';
                    
                    return (
                      <div className="flex-1 flex flex-col bg-slate-950 rounded-xl overflow-hidden border border-slate-850">
                        <div className="bg-slate-900 border-b border-slate-850 px-3 py-1.5 text-right text-[10px] text-indigo-400 font-bold font-sans">
                          {channelTitle}
                        </div>

                        {/* AI Active Indicator Banner */}
                        <div className="bg-indigo-950/40 border-b border-slate-900 px-3 py-2 text-right text-[9.5px] text-amber-400 font-medium font-sans flex items-center justify-between flex-row-reverse gap-2">
                          <span className="flex items-center gap-1.5 flex-row-reverse">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>آدم AI Bot نشط ويجيبك تلقائياً 🤖</span>
                          </span>
                          <span className="text-indigo-450 text-[8px] font-mono leading-none font-bold uppercase tracking-wider bg-indigo-500/10 px-1.5 py-0.5 rounded">
                            Gemini 3.5 Active
                          </span>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2.5 h-[240px]">
                          {/* Gemini AI Smart Ride Summary */}
                          {activeRide && (
                            <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-3 flex flex-col gap-2 shadow-lg mb-1 animate-fadeIn relative overflow-hidden">
                              <div className="absolute top-0 left-0 bg-indigo-500/10 px-2 py-0.5 rounded-br-lg text-[7/px] font-mono text-indigo-400">
                                AI ASSISTED BRIEFING
                              </div>
                              <div className="flex items-center gap-2 justify-end text-right">
                                <span className="text-[10px] font-bold text-slate-200">ملخص الرحلة الجاري الذكي (Gemini AI Summary)</span>
                                <span className="text-xs">🤖</span>
                              </div>
                              {loadingSummary ? (
                                <div className="flex items-center justify-center gap-2 py-3">
                                  <span className="w-3.5 h-3.5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></span>
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
                                    ? 'بدء المحادثة مع السائق والركاب الآخرين المدمجين معك.' 
                                    : 'أهلاً بك في دعم راكب آدم. نحن متواجدون لمساعدتك وتسريع دمج مشاويرك.'}
                                </p>
                              );
                            }
                            return filtered.map((msg, i) => {
                              const isMine = msg.senderId === loggedPassenger.id;
                              return (
                                <div key={i} className={`flex flex-col max-w-[80%] ${isMine ? 'self-end bg-indigo-600 text-white rounded-l-xl rounded-tr-xl' : 'self-start bg-slate-900 text-slate-300 rounded-r-xl rounded-tl-xl'} p-2 rounded shadow-md text-right`}>
                                  <div className="flex items-center justify-between gap-2 text-[8px] opacity-75 flex-row-reverse w-full">
                                    <span>{msg.senderName} ({msg.sender === 'driver' ? 'كابتن' : msg.sender === 'passenger' ? 'راكب' : 'إدارة'}) • {msg.timestamp}</span>
                                    {!isMine && (
                                      <button
                                        type="button"
                                        onClick={() => handleTranslateChatMessage(msg.id || `msg-${i}`, msg.message)}
                                        disabled={translatingChatMsgId === (msg.id || `msg-${i}`)}
                                        className="text-indigo-400 hover:text-indigo-300 transition font-black flex items-center gap-0.5"
                                      >
                                        {translatingChatMsgId === (msg.id || `msg-${i}`) ? 'جاري الترجمة...' : translatedChatMsgs[msg.id || `msg-${i}`] ? '✓ مترجم' : '✨ ترجمة AI'}
                                      </button>
                                    )}
                                  </div>
                                  <div className="text-xs mt-0.5 select-all leading-normal font-sans">{msg.message}</div>
                                  {translatedChatMsgs[msg.id || `msg-${i}`] && (
                                    <div className="text-[11px] mt-1.5 pt-1.5 border-t border-slate-850 text-indigo-300 font-sans italic leading-relaxed text-right animate-fadeIn">
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
                              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 flex-row-reverse font-bold transition"
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
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10.5px] px-2.5 py-1 rounded-lg font-bold transition"
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

                          <div className="flex flex-wrap gap-1.5 justify-end mt-1 max-h-[85px] overflow-y-auto pr-0.5">
                            {quickReplies.map((reply, idx) => (
                              <div
                                key={idx}
                                className="group flex items-center gap-1 bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/30 text-[10px] text-slate-300 hover:text-indigo-200 p-1 px-2 rounded-full cursor-pointer transition duration-150 relative"
                              >
                                <span 
                                  onClick={() => {
                                    if (loggedPassenger) {
                                      sendChatMessage(channelId, 'passenger', loggedPassenger.id, loggedPassenger.fullName, reply);
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

                        {/* Msg input */}
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!chatText.trim()) return;
                            sendChatMessage(channelId, 'passenger', loggedPassenger.id, loggedPassenger.fullName, chatText);
                            setChatText('');
                          }} 
                          className="border-t border-slate-850 p-2 flex bg-slate-900 gap-1.5"
                        >
                          <button type="submit" className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs flex items-center justify-center">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="text"
                            value={chatText}
                            onChange={e => setChatText(e.target.value)}
                            placeholder={activeRide ? "تواصل مع الإدارة أو السائق..." : "اكتب سؤالك أو استفسارك للدعم..."}
                            className="bg-slate-950 text-xs text-slate-100 p-1.5 px-2 rounded-lg flex-1 outline-none text-right placeholder-slate-650"
                          />
                        </form>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* SCHEDULED RIDES TAB */}
              {activeTab === 'scheduled' && travelMode !== 'intracity' && (
                <div className="flex-1 flex flex-col min-h-[380px] font-sans text-right select-none text-slate-100 overflow-y-auto pr-1">
                  
                  {/* Premium AI Fast Booking Portal */}
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
                            بوابة آدم للحجز الذكي بلمستك السحرية ⚡
                          </span>
                        </div>
                        <span className="bg-violet-900/40 border border-violet-500/30 text-[8.5px] font-black font-mono text-purple-300 py-0.5 px-2 rounded-full uppercase tracking-wider">
                          مدعوم بـ جيميناي AI
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                        عوضاً عن تعقيدات الفلاتر والتقويم، اكتب فقط وجهتك والموعد بعبارة واحدة بسيطة، ليقوم جيميناي بفرز جدول الكباتن وتوصيلك وربطك تلقائياً فورا!
                      </p>

                      {/* Unified Input Form */}
                      <div className="flex gap-1.5 flex-row-reverse mt-1">
                        <input
                          type="text"
                          value={aiFastText}
                          onChange={e => setAiFastText(e.target.value)}
                          placeholder="اكتب وجهة الرحلة أو تفاصيل الحجز..."
                          className="flex-1 bg-slate-950/90 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-slate-100 placeholder-slate-550 focus:border-violet-500/50 outline-none font-sans text-right font-medium shadow-inner"
                        />
                        <button
                          type="button"
                          disabled={aiFastLoading}
                          onClick={() => handleAiFastSubmit()}
                          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-550 text-white font-extrabold px-4 py-2 rounded-2xl text-xs flex items-center justify-center gap-1 cursor-pointer transition shadow-md whitespace-nowrap shrink-0 font-sans border-none"
                        >
                          {aiFastLoading ? "جاري التفكيك..." : "مطابقة ذكية ✨"}
                        </button>
                      </div>

                      {/* Direct Clickable Suggestions */}
                      <div className="flex flex-wrap gap-1 items-center justify-start flex-row-reverse mt-1">
                        <span className="text-[9px] text-slate-450 font-bold font-sans">اقتراحات سريعة بنقرة:</span>
                        {[
                          "مطلوب كابتن عمان إلى الزرقاء غداً 9 صباحاً بـ 3 ركاب",
                          "حجز مقعد عمان للعقبة يوم السبت 8 صباحاً",
                          "بدي أروح من الزرقاء لعمان اليوم الساعة 5 العصر مع مقعد واحد"
                        ].map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setAiFastText(s);
                              handleAiFastSubmit(s);
                            }}
                            className="bg-slate-900 hover:bg-slate-850 hover:border-slate-700 text-[8.5px] text-slate-350 border border-slate-850 px-2.5 py-1 rounded-xl transition duration-150 cursor-pointer font-sans"
                          >
                            ⭐ {s.length > 40 ? s.slice(0, 40) + '...' : s}
                          </button>
                        ))}
                      </div>

                      {/* AI FAST BOOKING FEEDBACK & ONE-CLICK ACTION CARDS */}
                      {aiFastResult && (
                        <div className="mt-3 bg-slate-950/85 border border-indigo-900/30 rounded-2xl p-3 animate-fade-in text-right">
                          {aiFastResult.type === 'error' ? (
                            <div className="text-red-400 font-bold text-[10px]">
                              ⚠️ {aiFastResult.msg}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <p className="text-[10px] text-amber-400 font-extrabold leading-relaxed">
                                {aiFastResult.msg}
                              </p>

                              {/* Details Extracted Badge */}
                              <div className="bg-slate-900 p-2 rounded-xl flex flex-wrap gap-2 justify-end flex-row-reverse text-[9.5px] border border-slate-850 font-sans">
                                <span>📍 من: <strong className="text-slate-100">{aiFastResult.parsedDetails?.fromGov.split(' ')[0]}</strong></span>
                                <span>➔ إلى: <strong className="text-slate-100">{aiFastResult.parsedDetails?.toGov.split(' ')[0]}</strong></span>
                                <span>👥 المقاعد: <strong className="text-amber-400 font-mono font-bold">{aiFastResult.parsedDetails?.seats}</strong></span>
                                <span>📅 الموعد المقترح: <strong className="text-indigo-400 font-mono font-bold">{aiFastResult.parsedDetails?.dateTimeStr.replace('T', ' ')}</strong></span>
                              </div>

                              {aiFastResult.type === 'match' ? (
                                <div className="bg-indigo-950/40 border border-indigo-900/30 p-2.5 rounded-xl flex flex-col gap-1.5 mt-1">
                                  <div className="flex justify-between items-center flex-row-reverse">
                                    <span className="font-bold text-slate-200 text-[10px]">
                                      🚕 كابتن الرحلة المتطابقة: {aiFastResult.matchedTrip.driverName || aiFastResult.matchedTrip.creatorName || "كابتن آدم المعتمد"}
                                    </span>
                                    <span className="text-[7.5px] bg-indigo-900 text-indigo-300 font-black px-1.5 rounded-full uppercase">
                                      مكتمل بنسبة 4/4 قريباً
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const trip = aiFastResult.matchedTrip;
                                      const seats = aiFastResult.parsedDetails?.seats || 1;
                                      const res = bookScheduledTrip(
                                        loggedPassenger!.id,
                                        trip.id,
                                        seats,
                                        `${aiFastResult.parsedDetails?.fromGov} - ${aiFastResult.parsedDetails?.fromDist || "القصبة"} - ${aiFastResult.parsedDetails?.fromVillage || "وسط البلد"}`,
                                        `${aiFastResult.parsedDetails?.toGov} - ${aiFastResult.parsedDetails?.toDist || "القصبة"} - ${aiFastResult.parsedDetails?.toVillage || "وسط البلد"}`,
                                        "حجز فوري ذكي جيميناي نقرة واحدة"
                                      );
                                      if (res.success) {
                                        setSchSuccessMsg(`✓ تم الانضمام والحجز السريع لمقاعدك بالنجاح!`);
                                        alert(res.msg);
                                        setSchTabMode('my_trips');
                                        setAiFastResult(null);
                                        setAiFastText('');
                                      } else {
                                        alert(res.msg);
                                      }
                                    }}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2 rounded-xl text-xs transition cursor-pointer font-sans shadow-md border-none"
                                  >
                                    تأكيد وحجز مقاعدك الفورية الآن 🎟️
                                  </button>
                                </div>
                              ) : (
                                <div className="bg-slate-900 p-2.5 rounded-xl flex flex-col gap-1.5 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const details = aiFastResult.parsedDetails;
                                      if (!details) return;
                                      const fromAddress = `${details.fromGov} - ${details.fromDist || "لواء القصبة"} - ${details.fromVillage || "وسط البلد"}`;
                                      const toAddress = `${details.toGov} - ${details.toDist || "لواء القصبة"} - ${details.toVillage || "وسط البلد"}`;
                                      const res = createPassengerScheduledTrip(
                                        loggedPassenger!.id,
                                        fromAddress,
                                        toAddress,
                                        details.dateTimeStr.replace('T', ' '),
                                        details.seats
                                      );
                                      if (true) {
                                        setSchSuccessMsg(`✓ تم جدولة رحلتك بنجاح ونشر رادار الطلبات للكباتن!`);
                                        setSchTabMode('my_trips');
                                        setAiFastResult(null);
                                        setAiFastText('');
                                      }
                                    }}
                                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-550 text-white font-black py-2 rounded-xl text-xs transition cursor-pointer font-sans shadow-lg border-none"
                                  >
                                    تأكيد تسيير وجدولة رحلتي ونشر الرادار 📡
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
                      className={`flex-1 min-w-[85px] py-1.5 rounded-lg text-center font-bold transition text-[10px] ${schTabMode === 'my_trips' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      مواعيدي {(() => {
                        const count = scheduledTrips.filter(t => t.creatorId === loggedPassenger?.id || t.passengers.some(p => p.passengerId === loggedPassenger?.id)).length;
                        return count > 0 ? `(${count})` : '';
                      })()}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSchTabMode('driver_trips')}
                      className={`flex-1 min-w-[85px] py-1.5 rounded-lg text-center font-bold transition text-[10px] ${schTabMode === 'driver_trips' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      عروض وعقود {(() => {
                        const now = new Date();
                        const yr = now.getFullYear();
                        const mo = String(now.getMonth() + 1).padStart(2, '0');
                        const dy = String(now.getDate()).padStart(2, '0');
                        const hr = String(now.getHours()).padStart(2, '0');
                        const mn = String(now.getMinutes()).padStart(2, '0');
                        const localTimeStr = `${yr}-${mo}-${dy} ${hr}:${mn}`;
                        const count = scheduledTrips.filter(t => 
                          (t.status === 'pending' || t.status === 'accepted') && 
                          t.availableSeats > 0 && 
                          t.creatorId !== loggedPassenger?.id && 
                          t.departureTime >= localTimeStr
                        ).length;
                        return count > 0 ? `(${count})` : '';
                      })()}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSchTabMode('form')}
                      className={`flex-1 min-w-[85px] py-1.5 rounded-lg text-center font-bold transition text-[10px] ${schTabMode === 'form' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      جدولة طلب
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSchTabMode('calendar_sync')}
                      className={`flex-1 min-w-[85px] py-1.5 rounded-lg text-center font-bold transition text-[10px] ${schTabMode === 'calendar_sync' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      تقويم Google 📅
                    </button>
                  </div>

                  {schSuccessMsg && (
                    <div className="p-2 bg-indigo-950/50 border border-indigo-900/40 text-[10px] text-indigo-300 rounded-lg text-right mb-3">
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
                        className={`flex-1 py-1 text-[10px] rounded-lg font-bold transition flex justify-center items-center gap-1 ${schViewFormat === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                      >
                        📋 عرض القائمة
                      </button>
                      <button
                        type="button"
                        onClick={() => setSchViewFormat('calendar')}
                        className={`flex-1 py-1 text-[10px] rounded-lg font-bold transition flex justify-center items-center gap-1 ${schViewFormat === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
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
                          <span className="text-[10.5px] font-extrabold text-indigo-400 font-sans">{monthArName} {currentCalendarYear}</span>
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
                              const matchesCreatorOrPassenger = t.creatorId === loggedPassenger?.id || t.passengers.some(p => p.passengerId === loggedPassenger?.id);
                              const matchesOtherFilters = (t.status === 'pending' || t.status === 'accepted') && t.availableSeats > 0 && t.creatorId !== loggedPassenger?.id;
                              const isTargetMode = schTabMode === 'my_trips' ? matchesCreatorOrPassenger : matchesOtherFilters;
                              
                              const now = new Date();
                              const yr = now.getFullYear();
                              const mo = String(now.getMonth() + 1).padStart(2, '0');
                              const dy = String(now.getDate()).padStart(2, '0');
                              const hr = String(now.getHours()).padStart(2, '0');
                              const mn = String(now.getMinutes()).padStart(2, '0');
                              const localTimeStr = `${yr}-${mo}-${dy} ${hr}:${mn}`;

                              return isTargetMode && t.departureTime.startsWith(formattedDate) && t.departureTime >= localTimeStr;
                            });

                            return (
                              <button
                                key={`day-${day}`}
                                type="button"
                                onClick={() => setCalendarSelectedDate(isSelected ? null : formattedDate)}
                                className={`h-6 text-[9.5px] font-mono rounded-lg transition flex flex-col justify-center items-center relative cursor-pointer ${
                                  isSelected 
                                    ? 'bg-indigo-600 text-white font-black shadow-md' 
                                    : 'hover:bg-slate-800 text-slate-300'
                                }`}
                              >
                                <span>{day}</span>
                                {tripsOnDay.length > 0 && (
                                  <span className={`w-1 h-1 rounded-full absolute bottom-0.5 ${isSelected ? 'bg-white' : 'bg-amber-500'}`}></span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Calendar filter clear indicator */}
                        {calendarSelectedDate && (
                          <div className="flex justify-between items-center bg-slate-900/40 border border-slate-850 p-2 rounded-xl mt-1 flex-row-reverse">
                            <span className="text-[9px] text-indigo-300 font-medium font-sans">📅 تم تصفية اليوم: <strong className="font-mono text-white">{calendarSelectedDate}</strong></span>
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

                  {/* Filters System for Passenger Scheduled Tabs */}
                  {schTabMode !== 'form' && schTabMode !== 'calendar_sync' && (
                    !isFilterExpanded ? (
                      /* Collapsed Search & Filter Bar */
                      <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl mb-3 flex flex-col gap-2 shadow-lg">
                        <div className="flex justify-between items-center flex-row-reverse gap-2">
                          <div className="flex items-center gap-1.5 flex-row-reverse">
                            <span className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[13px] text-indigo-500">🔍</span>
                            <div className="flex flex-col text-right">
                              <span className="text-[10px] font-bold text-slate-200">تصفية وبحث الرحلات المجدولة</span>
                              <span className="text-[8px] text-slate-400 font-sans">
                                {filterGov || filterDist || filterDateFrom || filterDateTo || filterTime || filterAvailableOnly || (filterVehicleType && filterVehicleType !== 'all') ? (
                                  <span className="text-indigo-400 font-bold">
                                    نشط: {[
                                      filterGov && `📍 ${filterGov}`,
                                      filterDist && `🔸 ${filterDist}`,
                                      filterVehicleType !== 'all' && (filterVehicleType === 'ev' ? '⚡ كهرباء' : filterVehicleType === 'hybrid' ? '🔋 هايبرد' : '🚗 سيدان'),
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
                            {(filterGov || filterDist || filterDateFrom || filterDateTo || filterTime || filterAvailableOnly || filterVehicleType !== 'all') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterGov('');
                                  setFilterDist('');
                                  setFilterDateFrom('');
                                  setFilterDateTo('');
                                  setFilterTime('');
                                  setFilterAvailableOnly(false);
                                  setFilterVehicleType('all');
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
                              setFilterVehicleType('all');
                            }}
                            className={`px-2.5 py-1 text-[8.5px] font-bold rounded-full border transition whitespace-nowrap cursor-pointer ${
                              !filterGov && !filterDist && !filterDateFrom && !filterDateTo && !filterTime && !filterAvailableOnly && filterVehicleType === 'all'
                                ? "bg-indigo-600 text-white border-indigo-500 font-black shadow-sm"
                                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300"
                            }`}
                          >
                            🌟 الكل
                          </button>
                          <button
                            type="button"
                            onClick={() => setFilterAirportOnly(!filterAirportOnly)}
                            className={`px-2.5 py-1 text-[8.5px] font-bold rounded-full border transition whitespace-nowrap cursor-pointer ${
                              filterAirportOnly
                                ? "bg-indigo-600 text-white border-indigo-400 font-black shadow-sm"
                                : "bg-slate-900 text-indigo-300 border-indigo-900/40 hover:bg-indigo-950/40"
                            }`}
                          >
                            ✈️ رحلات المطار VIP
                          </button>
                          <button
                            type="button"
                            onClick={() => setFilterVehicleType(filterVehicleType === 'ev' ? 'all' : 'ev')}
                            className={`px-2.5 py-1 text-[8.5px] font-bold rounded-full border transition whitespace-nowrap cursor-pointer ${
                              filterVehicleType === 'ev'
                                ? "bg-emerald-600 text-white border-emerald-500 font-black shadow-sm"
                                : "bg-slate-900 text-emerald-400 border-emerald-900/30 hover:bg-emerald-950/40"
                            }`}
                          >
                            ⚡ كهرباء (EV)
                          </button>
                          <button
                            type="button"
                            onClick={() => setFilterVehicleType(filterVehicleType === 'hybrid' ? 'all' : 'hybrid')}
                            className={`px-2.5 py-1 text-[8.5px] font-bold rounded-full border transition whitespace-nowrap cursor-pointer ${
                              filterVehicleType === 'hybrid'
                                ? "bg-amber-600 text-white border-amber-500 font-black shadow-sm"
                                : "bg-slate-900 text-amber-400 border-amber-900/30 hover:bg-amber-950/40"
                            }`}
                          >
                            🔋 هايبرد
                          </button>
                          <button
                            type="button"
                            onClick={() => setFilterVehicleType(filterVehicleType === 'sedan' ? 'all' : 'sedan')}
                            className={`px-2.5 py-1 text-[8.5px] font-bold rounded-full border transition whitespace-nowrap cursor-pointer ${
                              filterVehicleType === 'sedan'
                                ? "bg-cyan-600 text-white border-cyan-500 font-black shadow-sm"
                                : "bg-slate-900 text-cyan-400 border-cyan-900/30 hover:bg-cyan-950/40"
                            }`}
                          >
                            🚗 سيدان
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
                                ? "bg-indigo-600 text-white border-indigo-500 font-black shadow-sm"
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
                                ? "bg-indigo-600 text-white border-indigo-500 font-black shadow-sm"
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
                                ? "bg-indigo-600 text-white border-indigo-500 font-black shadow-sm"
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
                      <div className="bg-slate-950 border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.05)] p-3.5 rounded-2xl mb-3 flex flex-col gap-3 text-right">
                        {/* Title & Collapse button */}
                        <div className="flex justify-between items-center flex-row-reverse border-b border-slate-900 pb-2">
                          <div className="flex items-center gap-1.5 flex-row-reverse">
                            <span className="text-[13px]">⚙️</span>
                            <span className="text-[10px] font-black text-indigo-400">تخصيص بحث المواعيد المتقدم</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsFilterExpanded(false)}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white text-[8.5px] rounded-lg font-bold transition flex items-center gap-0.5 cursor-pointer"
                          >
                            ✖ إغلاق التصفية
                          </button>
                        </div>

                        {/* Section 1: Vehicle Type Filter */}
                        <div className="bg-slate-900/40 border border-indigo-500/20 p-2.5 rounded-xl flex flex-col gap-2">
                          <span className="text-[9px] text-indigo-300 font-black flex items-center gap-1 flex-row-reverse">
                            <span>🚗 نوع المركبة المطلوبة:</span>
                          </span>
                          <div className="grid grid-cols-4 gap-1.5 text-right font-sans">
                            <button
                              type="button"
                              onClick={() => setFilterVehicleType('all')}
                              className={`py-1.5 px-2 rounded-lg text-[9px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                                filterVehicleType === 'all'
                                  ? "bg-indigo-600 text-white border-indigo-500 font-black shadow-sm"
                                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                              }`}
                            >
                              <span>🌟 الكل</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setFilterVehicleType('ev')}
                              className={`py-1.5 px-2 rounded-lg text-[9px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                                filterVehicleType === 'ev'
                                  ? "bg-emerald-600 text-white border-emerald-500 font-black shadow-sm"
                                  : "bg-slate-900 text-emerald-400 border-emerald-900/30 hover:bg-emerald-950/40"
                              }`}
                            >
                              <span>⚡ كهرباء (EV)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setFilterVehicleType('hybrid')}
                              className={`py-1.5 px-2 rounded-lg text-[9px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                                filterVehicleType === 'hybrid'
                                  ? "bg-amber-600 text-white border-amber-500 font-black shadow-sm"
                                  : "bg-slate-900 text-amber-400 border-amber-900/30 hover:bg-amber-950/40"
                              }`}
                            >
                              <span>🔋 هايبرد</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setFilterVehicleType('sedan')}
                              className={`py-1.5 px-2 rounded-lg text-[9px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                                filterVehicleType === 'sedan'
                                  ? "bg-cyan-600 text-white border-cyan-500 font-black shadow-sm"
                                  : "bg-slate-900 text-cyan-400 border-cyan-900/30 hover:bg-cyan-950/40"
                              }`}
                            >
                              <span>🚗 سيدان</span>
                            </button>
                          </div>
                        </div>

                        {/* Section 2: Geographic Scope */}
                        <div className="bg-slate-900/30 border border-slate-900 p-2 rounded-xl flex flex-col gap-2">
                          <span className="text-[8.5px] text-indigo-500/80 font-bold flex items-center gap-1 flex-row-reverse">
                            <span>📍 النطاق الجغرافي:</span>
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-right">
                            {/* Governorate */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] text-slate-400">المحافظة</span>
                              <select
                                value={filterGov}
                                onChange={e => { setFilterGov(e.target.value); setFilterDist(''); }}
                                className="bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-[9.5px] text-slate-100 text-right outline-none cursor-pointer hover:border-indigo-500/30 transition"
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
                                className="bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-[9.5px] text-slate-100 text-right outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:border-indigo-500/30 transition"
                              >
                                <option value="">الكل (جميع الألوية)</option>
                                {((settings?.locations || DEFAULT_LOCATIONS).find(l => l.governorate === filterGov)?.districts || []).map((dist, i) => (
                                  <option key={i} value={dist.name}>{dist.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Section 3: Timeframe & Dates */}
                        <div className="bg-slate-900/30 border border-slate-900 p-2 rounded-xl flex flex-col gap-2">
                          <span className="text-[8.5px] text-indigo-500/80 font-bold flex items-center gap-1 flex-row-reverse">
                            <span>📅 التوقيت والمواعيد:</span>
                          </span>
                          <div className="grid grid-cols-3 gap-2 text-right font-sans">
                            {/* Date From */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] text-slate-400">من تاريخ</span>
                              <input
                                type="date"
                                value={filterDateFrom}
                                onChange={e => setFilterDateFrom(e.target.value)}
                                className="bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-[9.5px] text-slate-100 text-right outline-none font-mono hover:border-indigo-500/30 transition"
                              />
                            </div>
                            {/* Date To */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] text-slate-400">إلى تاريخ</span>
                              <input
                                type="date"
                                value={filterDateTo}
                                onChange={e => setFilterDateTo(e.target.value)}
                                className="bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-[9.5px] text-slate-100 text-right outline-none font-mono hover:border-indigo-500/30 transition"
                              />
                            </div>
                            {/* Time / Hour */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] text-slate-400">فترة المغادرة</span>
                              <select
                                value={filterTime}
                                onChange={e => setFilterTime(e.target.value)}
                                className="bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-[9.5px] text-slate-100 text-right outline-none cursor-pointer hover:border-indigo-500/30 transition"
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
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold transition cursor-pointer ${
                              filterAvailableOnly 
                                ? 'bg-emerald-600/90 text-white shadow-md' 
                                : 'bg-slate-900 text-slate-400 hover:text-slate-300 border border-slate-850'
                            }`}
                          >
                            <span className="text-[10px]">{filterAvailableOnly ? '🟢' : '⚫'}</span>
                            <span>إظهار الرحلات المتاحة فقط</span>
                          </button>

                          {/* Reset & Apply Buttons */}
                          <div className="flex gap-1">
                            {(filterGov || filterDist || filterDateFrom || filterDateTo || filterTime || filterAvailableOnly || filterVehicleType !== 'all') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterGov('');
                                  setFilterDist('');
                                  setFilterDateFrom('');
                                  setFilterDateTo('');
                                  setFilterTime('');
                                  setFilterAvailableOnly(false);
                                  setFilterVehicleType('all');
                                }}
                                className="px-2.5 py-1 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-950/30 text-[8.5px] rounded-lg font-bold transition cursor-pointer"
                              >
                                تفريغ التصفية
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setIsFilterExpanded(false)}
                              className="px-3 py-1 bg-indigo-600 text-white text-[8.5px] rounded-lg font-bold transition cursor-pointer hover:bg-indigo-700 shadow-md"
                            >
                              تطبيق البحث 🔍
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  {/* MODE 1: BOOKING FORM */}
                  {schTabMode === 'form' && (
                    <div className="flex flex-col gap-3">
                      {/* AI FAST AUTOMATED ONE-CLICK BOOKING CORNER */}
                      <div className="bg-gradient-to-r from-violet-950/50 to-indigo-950/40 border border-violet-500/25 p-3 rounded-2xl text-right font-sans relative overflow-hidden shadow-lg">
                        <div className="absolute top-[-10px] left-[-10px] w-12 h-12 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
                        <div className="flex justify-between items-center flex-row-reverse mb-1.5">
                          <span className="text-[10px] font-black text-violet-300 flex items-center gap-1">
                            ✨ الحجز الذكي بلمسة واحدة بالذكاء الاصطناعي (AI)
                          </span>
                          <span className="text-[8px] bg-violet-600/35 text-violet-200 px-1.5 py-0.5 rounded-md font-bold">بثوانٍ معدودة</span>
                        </div>
                        <p className="text-[8.5px] text-slate-300 leading-normal mb-2">
                          اكتب تفاصيل مشوارك بالعامية أو الفصحى وسيقوم الذكاء الاصطناعي بتعبئة الحقول فوراً (مثال: "بدي أروح من إربد الصريح لعمان الجاردنز بكرة العصر مقعدين").
                        </p>
                        
                        <div className="flex flex-col gap-1.5">
                          <textarea
                            rows={2}
                            value={aiBookingPromptText}
                            onChange={(e) => setAiBookingPromptText(e.target.value)}
                            placeholder="اكتب وجهتك ونوع السفر هنا..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-[10px] text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500 text-right transition font-sans"
                          />
                          <button
                            type="button"
                            onClick={parseAiBookingPrompt}
                            disabled={isParsingAiBooking}
                            className={`w-full font-bold text-[9px] py-1.5 rounded-xl border transition flex justify-center items-center gap-1.5 cursor-pointer shadow-md ${
                              isParsingAiBooking 
                                ? "bg-violet-950/40 text-violet-400 border-violet-500/20" 
                                : "bg-violet-600 hover:bg-violet-550 text-white border-violet-400/20"
                            }`}
                          >
                            {isParsingAiBooking ? (
                              <>
                                <span className="animate-spin inline-block w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full"></span>
                                <span>جاري الاستخلاص الذكي للأحياء والبلدات الأردنية...</span>
                              </>
                            ) : (
                              <>
                                <span>⚡ ملء البيانات تلقائياً بذكاء جيميناي</span>
                              </>
                            )}
                          </button>
                        </div>
                        
                        {aiBookingExplanation && (
                          <div className="mt-2 bg-violet-950/40 border border-violet-500/10 p-1.5 px-2 rounded-lg text-[8.5px] text-violet-200 text-right font-sans animate-fade-in">
                            🤖 {aiBookingExplanation}
                          </div>
                        )}
                      </div>

                      <div className="text-center text-[9px] text-slate-500 font-sans my-1">
                        ─────── أو يمكنك التعبئة المبسطة يدويّاً ───────
                      </div>

                      {/* QUICK INTER-CITY PRESETS ROW */}
                      <div className="bg-slate-900 border border-slate-800/80 p-2.5 rounded-2xl flex flex-col gap-1.5 text-right font-sans">
                        <span className="text-[9.5px] font-black text-indigo-400">⚡ خطوط السفر السريعة الأكثر طلباً (تعبئة بثانية):</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { label: "عمان ↔️ إربد", from: "عمان (Amman)", to: "إربد (Irbid)" },
                            { label: "عمان ↔️ الزرقاء", from: "عمان (Amman)", to: "الزرقاء (Zarqa)" },
                            { label: "عمان ↔️ العقبة", from: "عمان (Amman)", to: "العقبة (Aqaba)" }
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSchFromGov(preset.from);
                                setSchToGov(preset.to);
                                // Set departure to tomorrow 10:00 AM if not set
                                if (!schDateTime) {
                                  const tomorrow = new Date();
                                  tomorrow.setDate(tomorrow.getDate() + 1);
                                  tomorrow.setHours(10, 0, 0, 0);
                                  const localISO = tomorrow.toISOString().substring(0, 16);
                                  setSchDateTime(localISO);
                                }
                              }}
                              className="bg-indigo-950/40 hover:bg-indigo-600 hover:text-white border border-indigo-500/10 hover:border-indigo-500 rounded-xl p-1.5 text-[9.5px] font-bold text-slate-300 transition text-center cursor-pointer"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          setSchSuccessMsg('');
                          
                          if (!schFromGov || !schToGov || !schDateTime) {
                            alert('يرجى تحديد المحافظة للانطلاق والوصول وتاريخ السفر بدقة.');
                            return;
                          }

                          // Automated smart fallbacks to prevent empty complex subfields
                          const fromGovObj = settings.locations.find(l => l.governorate === schFromGov);
                          const toGovObj = settings.locations.find(l => l.governorate === schToGov);

                          const finalFromDist = schFromDist || fromGovObj?.districts[0]?.name || "لواء القصبة";
                          const finalFromVillage = schFromVillage || fromGovObj?.districts[0]?.villages[0] || "وسط البلد";

                          const finalToDist = schToDist || toGovObj?.districts[0]?.name || "لواء القصبة";
                          const finalToVillage = schToVillage || toGovObj?.districts[0]?.villages[0] || "وسط البلد";

                          const fromAddr = `${schFromGov} - ${finalFromDist} - ${finalFromVillage}`;
                          const toAddr = `${schToGov} - ${finalToDist} - ${finalToVillage}`;
                          const formattedTime = schDateTime.replace('T', ' ');
                          
                          const res = createPassengerScheduledTrip(loggedPassenger!.id, fromAddr, toAddr, formattedTime, schSeats);
                          if (res.success) {
                            setSchSuccessMsg(res.msg);
                            setSchTabMode('my_trips');
                            // Clear inputs
                            setSchFromGov(''); setSchFromDist(''); setSchFromVillage('');
                            setSchToGov(''); setSchToDist(''); setSchToVillage('');
                            setSchDateTime('');
                            setAiBookingPromptText('');
                            setAiBookingExplanation('');
                          } else {
                            alert(res.msg);
                          }
                        }}
                        className="flex flex-col gap-3"
                      >
                        {/* Quick Favorites Row for Scheduled Form */}
                        {((loggedPassenger?.favorites && loggedPassenger.favorites.length > 0) || 
                          (loggedPassenger?.favoriteRoutes && loggedPassenger.favoriteRoutes.length > 0)) && (
                          <div className="bg-slate-900 border border-amber-500/15 p-2.5 rounded-2xl flex flex-col gap-2 text-right font-sans">
                            {loggedPassenger.favorites && loggedPassenger.favorites.length > 0 && (
                              <div className="flex flex-col gap-1">
                                <span className="text-[9.5px] font-bold text-amber-400">⭐ الأماكن المفضلة السريعة (تعبئة فردية):</span>
                                <div className="flex flex-wrap gap-1 justify-end">
                                  {loggedPassenger.favorites.map((fav, fIdx) => (
                                    <div key={fIdx} className="bg-slate-950 border border-slate-800/80 rounded-lg p-1 px-1.5 flex items-center gap-1.5 flex-row-reverse hover:border-amber-400/30 transition">
                                      <span className="text-[9px] font-bold text-slate-200">{fav.label}</span>
                                      <div className="flex gap-0.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const parts = fav.address.split(' - ');
                                            if (parts[0]) setSchFromGov(parts[0]);
                                            if (parts[1]) setSchFromDist(parts[1]);
                                            if (parts[2]) setSchFromVillage(parts[2]);
                                          }}
                                          className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 px-1 py-0.5 rounded text-[8px] transition font-black cursor-pointer"
                                          title="تعيين كموقع إقلاع"
                                        >
                                          إقلاع 📍
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const parts = fav.address.split(' - ');
                                            if (parts[0]) setSchToGov(parts[0]);
                                            if (parts[1]) setSchToDist(parts[1]);
                                            if (parts[2]) setSchToVillage(parts[2]);
                                          }}
                                          className="bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white px-1 py-0.5 rounded text-[8px] transition font-black cursor-pointer"
                                          title="تعيين كوجهة وصول"
                                        >
                                          وجهة 🏁
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {loggedPassenger.favoriteRoutes && loggedPassenger.favoriteRoutes.length > 0 && (
                              <div className="flex flex-col gap-1 border-t border-slate-800/50 pt-1.5 mt-0.5">
                                <span className="text-[9.5px] font-bold text-amber-400">⚡ المسارات المفضلة (تعبئة الحقلين معاً بضغطة واحدة):</span>
                                <div className="flex flex-wrap gap-1 justify-end">
                                  {loggedPassenger.favoriteRoutes.map((route, rIdx) => (
                                    <button
                                      key={rIdx}
                                      type="button"
                                      onClick={() => {
                                        const fParts = route.fromAddress.split(' - ');
                                        const tParts = route.toAddress.split(' - ');
                                        if (fParts[0]) setSchFromGov(fParts[0]);
                                        if (fParts[1]) setSchFromDist(fParts[1]);
                                        if (fParts[2]) setSchFromVillage(fParts[2]);
                                        if (tParts[0]) setSchToGov(tParts[0]);
                                        if (tParts[1]) setSchToDist(tParts[1]);
                                        if (tParts[2]) setSchToVillage(tParts[2]);
                                      }}
                                      className="bg-amber-400/10 hover:bg-amber-400 hover:text-slate-950 text-amber-400 border border-amber-400/20 rounded-lg p-1 px-1.5 text-[9px] font-bold transition cursor-pointer"
                                      title="تعبئة المسار كاملاً"
                                    >
                                      🛣️ {route.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* COMPACT CITIES SELECTION */}
                        <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-2xl flex flex-col gap-3 relative">
                          <div className="flex items-center justify-between gap-2 relative">
                            {/* FROM Governorate */}
                            <div className="flex-1 text-right flex flex-col gap-1">
                              <span className="text-[10px] font-black text-indigo-400 mr-1 flex items-center gap-1 justify-end">
                                <MapPin className="w-3 h-3 text-indigo-400" />
                                <span>📍 محطة الانطلاق</span>
                              </span>
                              <select 
                                required
                                value={schFromGov}
                                onChange={e => { 
                                  const gov = e.target.value;
                                  setSchFromGov(gov); 
                                  const govObj = settings.locations.find(l => l.governorate === gov);
                                  const firstDist = govObj?.districts[0]?.name || '';
                                  const firstVil = govObj?.districts[0]?.villages[0] || '';
                                  setSchFromDist(firstDist); 
                                  setSchFromVillage(firstVil); 
                                }}
                                className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-[11px] text-slate-100 text-right outline-none cursor-pointer focus:border-indigo-500 transition-all w-full"
                              >
                                <option value="">-- من وين؟ --</option>
                                {settings.locations.map((loc, i) => (
                                  <option key={i} value={loc.governorate}>{loc.governorate.split(' (')[0]}</option>
                                ))}
                              </select>
                            </div>

                            {/* SWAP BUTTON */}
                            <div className="flex items-center justify-center pt-4">
                              <button
                                type="button"
                                onClick={handleSwapSchLocations}
                                className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:text-indigo-400 text-slate-400 flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-90"
                                title="عكس الاتجاه 🔁"
                              >
                                <ArrowUpDown className="w-4 h-4" />
                              </button>
                            </div>

                            {/* TO Governorate */}
                            <div className="flex-1 text-right flex flex-col gap-1">
                              <span className="text-[10px] font-black text-emerald-400 mr-1 flex items-center gap-1 justify-end">
                                <MapPin className="w-3 h-3 text-emerald-400" />
                                <span>🏁 محطة الوصول</span>
                              </span>
                              <select 
                                required
                                value={schToGov}
                                onChange={e => { 
                                  const gov = e.target.value;
                                  setSchToGov(gov); 
                                  const govObj = settings.locations.find(l => l.governorate === gov);
                                  const firstDist = govObj?.districts[0]?.name || '';
                                  const firstVil = govObj?.districts[0]?.villages[0] || '';
                                  setSchToDist(firstDist); 
                                  setSchToVillage(firstVil); 
                                }}
                                className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-[11px] text-slate-100 text-right outline-none cursor-pointer focus:border-emerald-500 transition-all w-full"
                              >
                                <option value="">-- لوين؟ --</option>
                                {settings.locations.map((loc, i) => (
                                  <option key={i} value={loc.governorate}>{loc.governorate.split(' (')[0]}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* AUTO-SELECTED FEEDBACK BADGES */}
                          {schFromGov && schToGov && (
                            <div className="bg-slate-950/60 p-2 rounded-xl flex flex-wrap gap-1.5 justify-between items-center text-[9px] border border-slate-850">
                              <span className="text-slate-400">📍 المسار التلقائي النشط:</span>
                              <div className="flex gap-1.5 items-center flex-row-reverse">
                                <span className="bg-indigo-950/60 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/20">
                                  {schFromGov.split(' (')[0]} ({schFromDist || 'لواء القصبة'} - {schFromVillage || 'وسط البلد'})
                                </span>
                                <span className="text-slate-500">➡️</span>
                                <span className="bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                  {schToGov.split(' (')[0]} ({schToDist || 'لواء القصبة'} - {schToVillage || 'وسط البلد'})
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* ACCORDION/COLLAPSIBLE FOR ADVANCED/DETAIL AREAS */}
                        {(schFromGov || schToGov) && (
                          <div className="border border-slate-850/60 rounded-xl overflow-hidden bg-slate-900/10">
                            <button
                              type="button"
                              onClick={() => setShowSchAdvancedFields(!showSchAdvancedFields)}
                              className="w-full flex justify-between items-center p-2.5 text-right text-[10px] font-bold text-slate-400 hover:bg-slate-900/40 transition flex-row-reverse outline-none"
                            >
                              <span className="flex items-center gap-1 flex-row-reverse">
                                <Settings className="w-3 h-3 text-indigo-400" />
                                <span>⚙️ تخصيص لواء أو حي معين (اختياري)</span>
                              </span>
                              <span>{showSchAdvancedFields ? '▲ طي تفاصيل الأحياء' : '▼ توسيع للحي الدقيق'}</span>
                            </button>

                            {showSchAdvancedFields && (
                              <div className="p-2.5 pt-0 flex flex-col gap-3.5 border-t border-slate-850/40 bg-slate-950/20 font-sans text-right animate-fade-in">
                                {/* Advanced From Details */}
                                {schFromGov && (
                                  <div className="flex flex-col gap-1.5">
                                    <span className="text-[9px] font-bold text-indigo-400">📍 تفاصيل المغادرة في {schFromGov.split(' (')[0]}:</span>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[8px] text-slate-500 mr-1">اللواء:</span>
                                        <select 
                                          value={schFromDist}
                                          onChange={e => { 
                                            const distName = e.target.value;
                                            setSchFromDist(distName); 
                                            const distObj = schFromProvinceObj?.districts.find(d => d.name === distName);
                                            setSchFromVillage(distObj?.villages[0] || ''); 
                                          }}
                                          className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-[10px] text-slate-100 text-right outline-none cursor-pointer"
                                        >
                                          <option value="">-- اختر اللواء --</option>
                                          {(schFromProvinceObj?.districts || []).map((dist, i) => (
                                            <option key={i} value={dist.name}>{dist.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[8px] text-slate-500 mr-1">القرية/الموقع:</span>
                                        <select 
                                          value={schFromVillage}
                                          onChange={e => setSchFromVillage(e.target.value)}
                                          className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-[10px] text-slate-100 text-right outline-none cursor-pointer"
                                        >
                                          <option value="">-- اختر الحي/الموقع --</option>
                                          {(schFromDistrictObj?.villages || []).map((vil, i) => (
                                            <option key={i} value={vil}>{vil}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Advanced To Details */}
                                {schToGov && (
                                  <div className="flex flex-col gap-1.5">
                                    <span className="text-[9px] font-bold text-emerald-400">🏁 تفاصيل الوصول في {schToGov.split(' (')[0]}:</span>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[8px] text-slate-500 mr-1">اللواء:</span>
                                        <select 
                                          value={schToDist}
                                          onChange={e => { 
                                            const distName = e.target.value;
                                            setSchToDist(distName); 
                                            const distObj = schToProvinceObj?.districts.find(d => d.name === distName);
                                            setSchToVillage(distObj?.villages[0] || ''); 
                                          }}
                                          className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-[10px] text-slate-100 text-right outline-none cursor-pointer"
                                        >
                                          <option value="">-- اختر اللواء --</option>
                                          {(schToProvinceObj?.districts || []).map((dist, i) => (
                                            <option key={i} value={dist.name}>{dist.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[8px] text-slate-500 mr-1">القرية/الموقع:</span>
                                        <select 
                                          value={schToVillage}
                                          onChange={e => setSchToVillage(e.target.value)}
                                          className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-[10px] text-slate-100 text-right outline-none cursor-pointer"
                                        >
                                          <option value="">-- اختر الحي/الموقع --</option>
                                          {(schToDistrictObj?.villages || []).map((vil, i) => (
                                            <option key={i} value={vil}>{vil}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* DATE TIME AND SEATS */}
                        <div className="flex flex-col gap-3 bg-slate-900/20 border border-slate-850 p-3.5 rounded-2xl">
                          <span className="text-[10px] font-black text-indigo-400 flex items-center gap-1 flex-row-reverse">
                            <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                            <span>📅 ميعاد الانطلاق وتوزيع المقاعد:</span>
                          </span>

                          {/* Quick Date Selectors */}
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label: "اليوم", offset: 0 },
                              { label: "غداً", offset: 1 },
                              { label: "بعد غد", offset: 2 }
                            ].map((btn, bIdx) => {
                              const targetDate = new Date();
                              targetDate.setDate(targetDate.getDate() + btn.offset);
                              const targetDateStr = targetDate.toISOString().split('T')[0];
                              const isSelected = schDate === targetDateStr;

                              return (
                                <button
                                  key={bIdx}
                                  type="button"
                                  onClick={() => setSchDate(targetDateStr)}
                                  className={`py-1.5 text-[9.5px] font-bold rounded-lg border transition text-center cursor-pointer ${
                                    isSelected 
                                      ? "bg-indigo-600 text-white border-indigo-500 shadow-md" 
                                      : "bg-slate-950/40 hover:bg-slate-900 text-slate-300 border-slate-800"
                                  }`}
                                >
                                  {btn.label} ({targetDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })})
                                </button>
                              );
                            })}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-1">
                            {/* Date Picker */}
                            <div className="bg-slate-950/60 border border-slate-800 p-2 rounded-xl flex flex-col gap-1 text-right">
                              <span className="text-[8.5px] text-slate-400 flex items-center gap-1 flex-row-reverse">
                                <Calendar className="w-3 h-3 text-indigo-400" />
                                <span>تاريخ السفر:</span>
                              </span>
                              <input 
                                type="date" 
                                required
                                value={schDate}
                                onChange={e => setSchDate(e.target.value)}
                                className="bg-slate-900 text-slate-100 border border-slate-800 rounded p-1.5 text-[10px] outline-none text-right font-mono"
                              />
                            </div>

                            {/* Time Picker */}
                            <div className="bg-slate-950/60 border border-slate-800 p-2 rounded-xl flex flex-col gap-1 text-right">
                              <span className="text-[8.5px] text-slate-400 flex items-center gap-1 flex-row-reverse">
                                <Clock className="w-3 h-3 text-indigo-400" />
                                <span>وقت الانطلاق:</span>
                              </span>
                              <input 
                                type="time" 
                                required
                                value={schTime}
                                onChange={e => setSchTime(e.target.value)}
                                className="bg-slate-900 text-slate-100 border border-slate-800 rounded p-1.5 text-[10px] outline-none text-right font-mono"
                              />
                            </div>

                            {/* Interactive Seats Stepper */}
                            <div className="bg-slate-950/60 border border-slate-800 p-2 rounded-xl flex flex-col gap-1 text-right justify-between">
                              <span className="text-[8.5px] text-slate-400 flex items-center gap-1 flex-row-reverse">
                                <Users className="w-3 h-3 text-indigo-400" />
                                <span>عدد المقاعد المطلوبة:</span>
                              </span>
                              <div className="flex items-center justify-between gap-2 mt-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
                                <button
                                  type="button"
                                  disabled={schSeats >= 4}
                                  onClick={() => setSchSeats(prev => Math.min(4, prev + 1))}
                                  className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer font-bold ${
                                    schSeats >= 4 ? "text-slate-600 bg-slate-950/20" : "bg-indigo-600/25 hover:bg-indigo-600 hover:text-white text-indigo-400"
                                  }`}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-[11px] font-black text-slate-100 min-w-[50px] text-center">
                                  {schSeats} {schSeats === 1 ? "مقعد" : schSeats === 2 ? "مقعدين" : schSeats === 3 ? "3 مقاعد" : "سيارة كاملة"}
                                </span>
                                <button
                                  type="button"
                                  disabled={schSeats <= 1}
                                  onClick={() => setSchSeats(prev => Math.max(1, prev - 1))}
                                  className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer font-bold ${
                                    schSeats <= 1 ? "text-slate-600 bg-slate-950/20" : "bg-indigo-600/25 hover:bg-indigo-600 hover:text-white text-indigo-400"
                                  }`}
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* PREVIEW TICKET BOARDING PASS */}
                        {schFromGov && schToGov && schDateTime && (
                          <div className="mt-1 bg-gradient-to-br from-indigo-950/90 to-slate-950 border border-indigo-500/20 rounded-2xl overflow-hidden text-right font-sans shadow-md animate-fade-in relative">
                            {/* ticket border punches */}
                            <div className="absolute top-1/2 -left-2 w-4 h-4 bg-slate-950 rounded-full border border-indigo-500/10 z-10"></div>
                            <div className="absolute top-1/2 -right-2 w-4 h-4 bg-slate-950 rounded-full border border-indigo-500/10 z-10"></div>
                            
                            <div className="p-3 border-b border-indigo-500/15 border-dashed flex justify-between items-center bg-indigo-900/10">
                              <span className="text-[8px] tracking-widest font-mono text-indigo-400 uppercase">ADAM VIP EXPRESS BOARDING ticket</span>
                              <div className="flex items-center gap-1.5 flex-row-reverse">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                                <span className="text-[8px] text-emerald-400 font-bold font-mono">تذكرة جاهزة للطلب</span>
                              </div>
                            </div>
                            
                            <div className="p-3 flex flex-col gap-2">
                              <div className="flex justify-between items-center flex-row-reverse">
                                <div className="text-right">
                                  <span className="text-[7.5px] text-slate-500 block">نقطة الانطلاق</span>
                                  <span className="text-xs font-black text-indigo-300 block">{schFromGov.split(' (')[0]}</span>
                                  <span className="text-[8.5px] text-slate-400 font-mono block truncate max-w-[120px]">
                                    {schFromDist || "لواء القصبة"} - {schFromVillage || "وسط البلد"}
                                  </span>
                                </div>
                                <div className="text-center px-2">
                                  <span className="text-[12px] text-indigo-500 font-bold">➡️</span>
                                </div>
                                <div className="text-left w-1/2">
                                  <span className="text-[7.5px] text-slate-500 block">نقطة الوصول</span>
                                  <span className="text-xs font-black text-emerald-400 block">{schToGov.split(' (')[0]}</span>
                                  <span className="text-[8.5px] text-slate-400 font-mono block truncate max-w-[120px]">
                                    {schToDist || "لواء القصبة"} - {schToVillage || "وسط البلد"}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-1 border-t border-slate-900 pt-2 text-[9px] mt-1">
                                <div className="flex flex-col text-right">
                                  <span className="text-[7px] text-slate-500">ميعاد السفر</span>
                                  <span className="font-bold text-slate-200 text-[8.5px] leading-tight mt-0.5">{schDateTime.replace('T', ' ')}</span>
                                </div>
                                <div className="flex flex-col text-center">
                                  <span className="text-[7px] text-slate-500">حجم الحجز</span>
                                  <span className="font-bold text-amber-400 text-[8.5px] mt-0.5">{schSeats} {schSeats === 1 ? "مقعد" : "مقاعد"}</span>
                                </div>
                                <div className="flex flex-col text-left">
                                  <span className="text-[7px] text-slate-500">سعر المقعد</span>
                                  <span className="font-bold text-emerald-400 text-[8.5px] mt-0.5">{settings.passengerFarePerSeat.toFixed(2)} د.أ</span>
                                </div>
                              </div>

                              <div className="bg-slate-900/60 p-2 rounded-xl mt-1.5 flex justify-between items-center flex-row-reverse border border-slate-850/80">
                                <span className="text-[9.5px] font-bold text-slate-300">أجرة السفر الكلية التقريبية:</span>
                                <span className="text-[13px] font-extrabold text-emerald-400 font-mono">
                                  {(schSeats * settings.passengerFarePerSeat).toFixed(2)} د.أ
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <button 
                          type="submit"
                          className="mt-1 w-full bg-indigo-650 hover:bg-indigo-605 text-white font-black rounded-xl py-2.5 text-xs flex justify-center items-center gap-1 cursor-pointer transition shadow-xl hover:scale-[1.01] active:scale-[0.99] duration-150"
                        >
                          <Calendar className="w-3.5 h-3.5 text-indigo-200 animate-bounce" />
                          <span>تأكيد الحجز ونشر التذكرة فوراً 🚀</span>
                        </button>
                      </form>
                    </div>
                  )}

                  {/* MODE 0: DAILY PINNED TRIPS SECTION FOR PASSENGERS */}
                  {schTabMode === 'daily_pinned' && (
                    <div className="flex flex-col gap-3.5 animate-fadeIn text-right">
                      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/40 p-4 rounded-2xl shadow-xl shadow-amber-950/10">
                        <div className="flex items-center justify-between flex-row-reverse mb-2">
                          <div className="flex items-center gap-2 flex-row-reverse">
                            <span className="text-2xl">📌</span>
                            <div>
                              <h3 className="text-sm font-black text-amber-300">الرحلات المجدولة اليومية المثبتة (Daily Pinned Trips)</h3>
                              <p className="text-[10px] text-slate-300 mt-0.5">مواعيد نقل معتمدة وثابتة يومياً من إدارة آدم لضمان تنقل موثوق بين المحافظات</p>
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
                              لا توجد حالياً رحلات يومية مثبتة معلنة من الإدارة. يمكنك تصفح التبويبات الأخرى أو طلب رحلة مجدولة خاصة بك.
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {pinnedList.map((trip) => {
                              const isBooked = trip.passengers.some(p => p.passengerId === loggedPassenger?.id);
                              const govFrom = trip.governorateFrom || trip.fromArea.split('-')[0]?.trim() || 'عمان';
                              const govTo = trip.governorateTo || trip.toArea.split('-')[0]?.trim() || 'إربد';
                              const depHour = trip.dailyDepartureHour || trip.departureTime.split(' ')[1] || trip.departureTime || '08:00';
                              const fare = trip.customFare || 3.50;

                              return (
                                <div key={trip.id} className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-3.5 flex flex-col justify-between gap-3 transition shadow-md relative overflow-hidden">
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
                                      <span className="text-[10px] font-bold text-amber-300 mt-1">
                                        💵 {fare} د.أ / مقعد
                                      </span>
                                    </div>
                                  </div>

                                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 flex justify-between items-center flex-row-reverse text-[9.5px]">
                                    <span className="text-slate-300">
                                      👥 الشاغر: <strong className="text-emerald-400 font-mono">{trip.availableSeats} مقاعد</strong>
                                    </span>
                                    <span className="text-slate-300">
                                      👨‍✈️ الكابتن: <strong className={trip.driverName ? 'text-amber-300' : 'text-slate-500 italic'}>{trip.driverName || 'بانتظار قبول كابتن'}</strong>
                                    </span>
                                  </div>

                                  {isBooked ? (
                                    <button disabled className="w-full bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 font-bold py-2 rounded-xl text-xs text-center cursor-default">
                                      ✅ تم تأكيد حجزك في هذه الرحلة
                                    </button>
                                  ) : trip.availableSeats > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm(`هل تؤكد حجز مقعدك في هذه الرحلة اليومية المثبتة للمغادرة الساعة ${depHour} بسعر ${fare} د.أ؟`)) {
                                          const res = bookScheduledTrip(
                                            loggedPassenger!.id,
                                            trip.id,
                                            1,
                                            trip.fromArea,
                                            trip.toArea,
                                            "حجز مباشر من قسم الرحلات اليومية المثبتة"
                                          );
                                          alert(res.msg);
                                        }
                                      }}
                                      className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black py-2 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-950/40 text-center"
                                    >
                                      🎫 حجز مقعد وتأكيد الرحلة الآن
                                    </button>
                                  ) : (
                                    <button disabled className="w-full bg-slate-800/80 text-slate-500 font-bold py-2 rounded-xl text-xs text-center">
                                      🔒 اكتملت المقاعد
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

                  {/* MODE 1.5: MY BOOKED SCHEDULES - LIST VIEW */}
                  {schTabMode === 'my_trips' && schViewFormat === 'list' && (
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] text-slate-400 text-center leading-relaxed block font-sans">مواعيد رحلاتك المجدولة ومقاعدك المحجوزة في نظام آدم:</span>
                      
                      {(() => {
                        const now = new Date();
                        const yr = now.getFullYear();
                        const mo = String(now.getMonth() + 1).padStart(2, '0');
                        const dy = String(now.getDate()).padStart(2, '0');
                        const hr = String(now.getHours()).padStart(2, '0');
                        const mn = String(now.getMinutes()).padStart(2, '0');
                        const localTimeStr = `${yr}-${mo}-${dy} ${hr}:${mn}`;

                        const myBooked = applyUnifiedFilters(scheduledTrips.filter(t => 
                          (t.creatorId === loggedPassenger?.id || 
                           t.passengers.some(p => p.passengerId === loggedPassenger?.id)) &&
                          t.departureTime >= localTimeStr
                        ));
                        
                        if (myBooked.length === 0) {
                          return (
                            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 text-center italic text-slate-500 text-[10.5px] font-sans">
                              لا توجد لديك رحلات مجدولة ومحجوزة حالياً. يمكنك تصفح عروض الكباتن أو استخدام جدولة ذكية بالأعلى لحجز مقعدك فوراً! 🎫
                            </div>
                          );
                        }
                        
                        return myBooked.map(trip => {
                          const myBooking = trip.passengers.find(p => p.passengerId === loggedPassenger?.id);
                          const totalBookedSeats = trip.passengers.reduce((sum, p) => sum + p.seatsCount, 0);
                          const isFull = totalBookedSeats >= 4;
                          const hasConfirmed = myBooking?.confirmed || false;
                          const seatsCount = myBooking?.seatsCount || trip.seatsCount || 1;
                          
                          return (
                            <div key={trip.id} className={`bg-slate-900/90 border ${trip.status === 'completed' ? 'border-emerald-500/40 border-l-4 border-l-emerald-500 shadow-lg shadow-emerald-950/10' : trip.status === 'cancelled' ? 'border-rose-500/30 border-l-4 border-l-rose-500/80 shadow-lg shadow-rose-950/10' : 'border-slate-800'} rounded-2xl p-4 flex flex-col gap-3 text-right shadow-lg relative overflow-hidden`}>
                              {/* Glowing Accent for full/confirmed trip */}
                              {isFull && (
                                <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600"></div>
                              )}
                              
                              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5 flex-row-reverse">
                                <div>
                                  <span className="text-xs font-black text-slate-200 block">
                                    ✈️ رحلة السفر بين المدن المجدولة
                                  </span>
                                  <span className="text-[8px] text-slate-500 font-mono mt-0.5 block">رقم المشوار: #{trip.id.split('_').pop()}</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-row-reverse">
                                  {isFull ? (
                                    <span className="bg-amber-950 border border-amber-500/30 text-amber-400 py-0.5 px-2 rounded-full text-[8.5px] font-black animate-pulse">
                                      👥 مكتملة (٤ ركاب)
                                    </span>
                                  ) : (
                                    <span className="bg-indigo-950 border border-indigo-900 text-indigo-400 py-0.5 px-2 rounded-full text-[8.5px] font-extrabold">
                                      ⏳ قيد تجميع الركاب ({totalBookedSeats}/٤)
                                    </span>
                                  )}
                                  
                                  {trip.status === 'completed' && (
                                    <span className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-400 px-2 py-0.5 rounded-xl text-[8.5px] font-black font-sans flex items-center gap-1 flex-row-reverse shadow-md shadow-emerald-950/40">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                      <span>🟢 مكتملة بنجاح</span>
                                    </span>
                                  )}
                                  {trip.status === 'cancelled' && (
                                    <span className="bg-rose-950/90 border border-rose-500/50 text-rose-400 px-2 py-0.5 rounded-xl text-[8.5px] font-black font-sans flex items-center gap-1 flex-row-reverse shadow-md shadow-rose-950/40">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                      <span>🔴 ملغية</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                                <div className="grid grid-cols-1 gap-1.5 text-[10.5px] text-slate-300 font-sans">
                                  <div>📍 <strong className="text-slate-400">منطقة الانطلاق:</strong> {trip.fromArea}</div>
                                  <div>🏁 <strong className="text-slate-400">وجهة الوصول النهائية:</strong> {trip.toArea}</div>
                                  <div className="flex justify-between items-center flex-row-reverse bg-slate-950/45 p-2 rounded-xl border border-slate-850 mt-1">
                                    <div>📅 <strong className="text-slate-400">موعد السفر والمغادرة:</strong></div>
                                    <div className="font-mono text-amber-400 font-extrabold text-[11px]">{trip.departureTime}</div>
                                  </div>
                                </div>

                                <div className="bg-slate-950/90 border border-slate-850 p-3 rounded-2xl flex flex-col gap-2">
                                  <div className="flex justify-between items-center text-[10px] flex-row-reverse">
                                    <span className="text-slate-400 font-bold">🎫 مقاعدك المحجوزة:</span>
                                    <span className="text-indigo-400 font-black">{seatsCount} مقعد</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] flex-row-reverse">
                                    <span className="text-slate-400 font-bold">🚕 الكابتن السائق:</span>
                                    <span className="text-slate-200 font-extrabold">
                                      {trip.driverName ? `${trip.driverName} (${trip.driverPhone || ''})` : 'لم يتم التعيين بعد (جاري الربط مع النشامى)'}
                                    </span>
                                  </div>
                                </div>

                                {isFull && trip.status !== 'completed' && trip.status !== 'cancelled' && (
                                  <div className="bg-gradient-to-l from-amber-950/45 via-yellow-950/20 to-slate-950 border border-amber-500/35 p-3 rounded-2xl flex flex-col gap-2 animate-fade-in text-right">
                                    <div className="flex items-center gap-1.5 flex-row-reverse">
                                      <span className="text-[12px]">📢</span>
                                      <p className="text-[9.5px] text-amber-300 font-black leading-relaxed">
                                        إشعار تأكيد الموعد: لقد اكتمل النصاب القانوني للرحلة (٤ ركاب) بموعدها المقرر! يرجى تأكيد التزامك بالرحلة للانطلاق فوراً.
                                      </p>
                                    </div>
                                    {hasConfirmed ? (
                                      <div className="bg-slate-950/80 border border-emerald-500/30 p-2.5 rounded-xl text-center flex items-center justify-center gap-1 flex-row-reverse">
                                        <span className="text-emerald-400 text-xs font-black">✓</span>
                                        <span className="text-[9.5px] text-emerald-400 font-black leading-tight">
                                          تم تأكيد التزامك بالموعد بنجاح! تذكر أن إلغاء الرحلة الآن من قبلك سيترتب عليه رسوم إلغاء بقيمة 2.00 د.أ.
                                        </span>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const res = confirmScheduledTripByPassenger(trip.id, loggedPassenger!.id);
                                          if (res.success) alert(res.msg);
                                        }}
                                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2 rounded-xl text-[10px] cursor-pointer transition shadow border-none outline-none font-sans"
                                      >
                                        تأكيد التزامي الفعلي بالرحلة بموعدها ومباركة انطلاق الكابتن 👍
                                      </button>
                                    )}
                                  </div>
                                )}

                                {trip.status !== 'completed' && trip.status !== 'cancelled' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm('هل أنت متأكد من رغبتك بإلغاء حجزك في هذه الرحلة المجدولة؟')) {
                                        const res = cancelScheduledTrip(trip.id, loggedPassenger!.id, 'passenger');
                                        if (res.success) alert(res.msg);
                                      }
                                    }}
                                    className="w-full bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer text-center mt-1"
                                  >
                                    إلغاء حجز المقعد ✕
                                  </button>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
              )}

              {/* WALLET TAB */}
              {activeTab === 'wallet' && loggedPassenger && (
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-right">
                  <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between flex-row-reverse shadow-xl">
                    <div>
                      <span className="text-[10px] text-indigo-300 font-bold block">رصيد محفظة الراكب الإلكترونية</span>
                      <h3 className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                        {loggedPassenger.walletBalance.toFixed(2)} <span className="text-xs text-slate-300">د.أ</span>
                      </h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                      <Wallet className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Wallet Sub Navigation */}
                  <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800 flex-row-reverse gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setActiveWalletSubTab('details')}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition text-center ${activeWalletSubTab === 'details' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      سجل العمليات
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveWalletSubTab('recharge')}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition text-center ${activeWalletSubTab === 'recharge' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      شحن الرصيد
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveWalletSubTab('rewards')}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition text-center ${activeWalletSubTab === 'rewards' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      المكافآت
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveWalletSubTab('pin')}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition text-center ${activeWalletSubTab === 'pin' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      رمز PIN
                    </button>
                  </div>

                  {/* Wallet Subtabs Content */}
                  {activeWalletSubTab === 'details' && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] text-slate-400 font-bold">الحركات المالية الأخيرة:</span>
                      {(() => {
                        const myTx = walletTransactions.filter(t => t.userId === loggedPassenger.id);
                        if (myTx.length === 0) {
                          return (
                            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl text-center text-slate-500 text-xs italic">
                              لا توجد حركات مالية مسجلة بعد.
                            </div>
                          );
                        }
                        return myTx.map(t => (
                          <div key={t.id} className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex items-center justify-between flex-row-reverse text-xs">
                            <div className="text-right">
                              <span className="font-bold text-slate-200 block">{t.description}</span>
                              <span className="text-[9px] text-slate-500 font-mono">{t.timestamp}</span>
                            </div>
                            <span className={`font-mono font-black ${t.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {t.amount >= 0 ? `+${t.amount.toFixed(2)}` : t.amount.toFixed(2)} د.أ
                            </span>
                          </div>
                        ));
                      })()}
                    </div>
                  )}

                  {activeWalletSubTab === 'recharge' && (
                    <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col gap-3 text-right">
                      <span className="text-xs font-black text-slate-200">شحن الرصيد الرقمي الفوري</span>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                        اختر طريقة الشحن المعتمدة في الأردن (CliQ أو البطاقات البنكية) لشحن محفظتك بأمان.
                      </p>
                      <div className="flex flex-col gap-2 mt-1">
                        <label className="text-[10px] text-slate-400">قيمة الشحن (د.أ)</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="مثال: 10"
                          value={rechargeAmount}
                          onChange={e => setRechargeAmount(e.target.value)}
                          className="bg-slate-950/80 border border-slate-800 text-amber-400 font-mono font-black text-lg p-2.5 rounded-xl outline-none text-center"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseFloat(rechargeAmount);
                            if (!val || val <= 0) {
                              alert('يرجى إدخال مبلغ شحن صحيح');
                              return;
                            }
                            addWalletTransaction(
                              loggedPassenger.id,
                              'passenger',
                              'deposit',
                              val,
                              'شحن محفظة إلكترونية عبر CliQ / بطاقة بنكية',
                              'completed',
                              undefined,
                              'cliq'
                            );
                            setRechargeAmount('');
                            alert(`تم شحن ${val.toFixed(2)} د.أ إلى محفظتك بنجاح!`);
                          }}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs transition cursor-pointer shadow mt-1"
                        >
                          تأكيد شحن المحفظة الآن ⚡
                        </button>
                      </div>
                    </div>
                  )}

                  {activeWalletSubTab === 'rewards' && (
                    <PassengerDailyChallengesSection
                      loggedPassenger={loggedPassenger}
                      rides={rides}
                      scheduledTrips={scheduledTrips}
                      intraCityRides={intraCityRides}
                      walletTransactions={walletTransactions}
                      settings={settings}
                      claimChallengeReward={claimChallengeReward}
                      addWalletTransaction={addWalletTransaction}
                    />
                  )}

                  {activeWalletSubTab === 'pin' && (
                    <WalletSecurityDashboard
                      userType="passenger"
                      user={loggedPassenger}
                      onUpdatePin={(pin) => setUserPin(loggedPassenger.id, 'passenger', pin)}
                      onUpdateSecuritySettings={(sec) => updateWalletSecuritySettings(loggedPassenger.id, 'passenger', sec)}
                      themeColor="indigo"
                    />
                  )}
                </div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === 'settings' && loggedPassenger && (
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-right">
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center justify-between flex-row-reverse gap-3">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-amber-500 flex items-center justify-center text-slate-950 font-black text-sm">
                        {loggedPassenger.fullName[0] || 'P'}
                      </div>
                      <div className="text-right">
                        <h4 className="text-xs font-black text-slate-100">{loggedPassenger.fullName}</h4>
                        <span className="text-[9px] text-slate-500 block font-mono">@{loggedPassenger.username}</span>
                      </div>
                    </div>
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full text-[8px] font-bold">
                      حساب راكب موثق
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-slate-300 border-b border-slate-850 pb-1.5 block flex items-center gap-1 flex-row-reverse">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      <span>تحديث الملف الشخصي للراكب</span>
                    </span>

                    {settingsSuccess && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] p-2 rounded-xl font-bold text-center">
                        {settingsSuccess}
                      </div>
                    )}

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const res = updatePassengerProfile(loggedPassenger.id, editName, editPhone, editEmail);
                        if (res.success) {
                          setSettingsSuccess(res.msg);
                          setTimeout(() => setSettingsSuccess(''), 3000);
                        }
                      }}
                      className="flex flex-col gap-3"
                    >
                      <div className="flex flex-col gap-1 text-right">
                        <label className="text-[9px] text-slate-500 pr-1">اسم الراكب</label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="bg-slate-950/60 border border-slate-850 focus:border-indigo-500 text-xs text-slate-100 p-2 rounded-xl outline-none font-sans text-right"
                        />
                      </div>

                      <div className="flex flex-col gap-1 text-right">
                        <label className="text-[9px] text-slate-500 pr-1">رقم الهاتف</label>
                        <input
                          type="tel"
                          required
                          value={editPhone}
                          onChange={e => setEditPhone(e.target.value)}
                          className="bg-slate-950/60 border border-slate-850 focus:border-indigo-500 text-xs text-slate-100 p-2 rounded-xl outline-none font-mono text-left font-bold"
                        />
                      </div>

                      <div className="flex flex-col gap-1 text-right">
                        <label className="text-[9px] text-slate-500 pr-1">البريد الإلكتروني</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={e => setEditEmail(e.target.value)}
                          className="bg-slate-950/60 border border-slate-850 focus:border-indigo-500 text-xs text-slate-100 p-2 rounded-xl outline-none font-mono text-left"
                        />
                      </div>

                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2 rounded-xl text-xs transition cursor-pointer shadow mt-2"
                      >
                        حفظ التعديلات في ملف الراكب 💾
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Navigation Bar */}
            <div className="bg-slate-900 border-t border-slate-800/80 px-2 py-2 flex items-center justify-around z-30 shrink-0">
              {(!settings.uiControls?.hideHomeButton && !settings.uiControls?.hidePassengerHomeButton) ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('request')}
                  className={`flex flex-col items-center gap-1 transition ${activeTab === 'request' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Home className="w-5 h-5" />
                  <span className="text-[10px] font-bold font-sans">الرئيسية</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('request')}
                  className={`flex flex-col items-center gap-1 transition ${activeTab === 'request' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Compass className="w-5 h-5" />
                  <span className="text-[10px] font-bold font-sans">طلب مشوار</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('active_rides')}
                className={`flex flex-col items-center gap-1 transition ${activeTab === 'active_rides' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Car className="w-5 h-5" />
                <span className="text-[10px] font-bold font-sans">رحلاتي</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('scheduled')}
                className={`flex flex-col items-center gap-1 transition ${activeTab === 'scheduled' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Calendar className="w-5 h-5" />
                <span className="text-[10px] font-bold font-sans">المجدولة</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('wallet')}
                className={`flex flex-col items-center gap-1 transition ${activeTab === 'wallet' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Wallet className="w-5 h-5" />
                <span className="text-[10px] font-bold font-sans">المحفظة</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex flex-col items-center gap-1 transition ${activeTab === 'settings' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <User className="w-5 h-5" />
                <span className="text-[10px] font-bold font-sans">الملف الشخصي</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Service Launch Modal */}
      <ServiceLaunchGatedModal
        isOpen={showLaunchGatedModal}
        onClose={() => setShowLaunchGatedModal(false)}
        role="passenger"
        formattedLaunchDate={launchGateInfo.formattedLaunchDate}
        customMessage={launchGateInfo.customMessage}
      />
    </div>
  );
};
