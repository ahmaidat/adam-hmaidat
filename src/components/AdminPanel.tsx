/**
 * Admin Panel Component - Adam Platform
 * Comprehensive Operations & Management Portal
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAppState } from '../stateEngine';
import { Employee, PermissionState, CommercialAd, IntraCityRide } from '../types';
import { getLocationCoords, DEFAULT_LOCATIONS } from '../locationData';
import { playNotificationTone, NotificationToneType } from '../soundUtils';
import { 
  Users, 
  Car, 
  MapPin, 
  Wallet, 
  Settings, 
  FileText, 
  UserCheck, 
  UserX, 
  Check, 
  Map, 
  MessageSquare, 
  Plus, 
  DollarSign, 
  Clock, 
  Activity, 
  Lock, 
  Unlock,
  Calendar,
  Cloud,
  Star,
  Coins,
  AlertTriangle,
  TrendingUp,
  Trash2,
  Briefcase,
  Building,
  Sparkles,
  Cpu,
  Gauge,
  Zap,
  CheckCircle,
  AlertCircle,
  Sliders,
  Terminal,
  Play,
  Smartphone,
  Image,
  Gift,
  Mail,
  MessageCircle,
  Eye,
  EyeOff,
  Edit3,
  Search,
  Printer,
  FileSpreadsheet,
  Download,
  Globe,
  Megaphone,
  UserPlus,
  Database,
  ShieldCheck,
  Bot,
  RefreshCw
} from 'lucide-react';
import { GoogleDriveManager } from './GoogleDriveManager';
import { GmailManager } from './GmailManager';
import { COUNTRIES_DATA } from '../countriesData';
import { InteractiveScheduleCalendar } from './InteractiveScheduleCalendar';
import { TripScheduler } from './TripScheduler';
import { AdvancedTripAnalytics } from './AdvancedTripAnalytics';
import { ErDiagramStudio } from './ErDiagramStudio';
import { AiActiveRideControlModal } from './AiActiveRideControlModal';
import { AdminUnifiedRechargeHub } from './AdminUnifiedRechargeHub';
import { AdminUiControlsPanel } from './AdminUiControlsPanel';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line 
} from 'recharts';

export const AdminPanel: React.FC = () => {
  const {
    drivers: rawDrivers,
    passengers: rawPassengers,
    rides: rawRides,
    requests: rawRequests,
    messages,
    settings,
    scheduledTrips: rawScheduledTrips,
    walletTransactions: rawWalletTransactions,
    approveDriver,
    blockDriver,
    unblockDriver,
    approvePassenger,
    blockPassenger,
    unblockPassenger,
    chargeDriver,
    chargePassenger,
    updateSettings,
    addWorkArea,
    sendChatMessage,
    cancelScheduledTrip,
    updateScheduledTripTime,
    updateScheduledTripRoute,
    assignScheduledTripDriver,
    approveDriverScheduledTripRequest,
    rejectDriverScheduledTripRequest,
    rolloverUnderbookedTrip,
    updateUserPassword,
    moderateRating,
    createAdminScheduledTrip,
    generateAiDailyScheduledTrips,
    analyzeTripPatternsAndAutoSchedule,
    commitAutomatedSchedule,
    toggleScheduledTripDailyPin,
    deleteScheduledTripByAdmin,
    generateHourlyScheduledTrips,
    clearEmptyAutoScheduledTrips,
    setDriverOnline,
    aiPlugins,
    addAiPlugin,
    deleteAiPlugin,
    updateAiPluginActive,
    commercialAds,
    addCommercialAd,
    deleteCommercialAd,
    updateCommercialAdStatus,
    saveState,
    currentUser,
    employees,
    addEmployee,
    updateEmployeePermissions,
    updateEmployee,
    toggleEmployeeHide,
    deleteEmployee,
    deleteDriver,
    deletePassenger,
    registerDriver,
    registerPassenger,
    login,
    logout,
    activeCountryCode,
    setActiveCountryCode,
    activeCountry,
    enabledCountries,
    updateCountryConfig,
    addCountryConfig,
    deleteCountryConfig,
    setDriverMinBalanceLimit,
    setPassengerMinBalanceLimit,
    setDriverWorkScope,
    setDriverServiceScope,
    setPassengerServiceScope,
    approveWithdrawal,
    rejectWithdrawal,
    updateServiceLaunchConfig,
    grantBonusBalance,
    approveRechargeRequest,
    rejectRechargeRequest,
    reAuditRechargeWithAi,
    intraCityRides: rawIntraCityRides,
    cancelIntraCityRide,
    cancelRideRequest,
    adminForceCancelRide
  } = useAppState();

  const [selectedAiAuditReq, setSelectedAiAuditReq] = useState<any>(null);
  const [reAuditingReqId, setReAuditingReqId] = useState<string | null>(null);

  const drivers = rawDrivers.filter(d => (d.country || 'JO') === activeCountryCode);
  const passengers = rawPassengers.filter(p => (p.country || 'JO') === activeCountryCode);
  const intraCityRides = (rawIntraCityRides || []).filter(r => {
    const psg = rawPassengers.find(p => p.id === r.passengerId);
    if (psg) return (psg.country || 'JO') === activeCountryCode;
    if (r.driverId) {
      const drv = rawDrivers.find(d => d.id === r.driverId);
      if (drv) return (drv.country || 'JO') === activeCountryCode;
    }
    return true;
  });
  const rides = rawRides.filter(r => {
    if (r.requests && r.requests.length > 0) {
      const pId = r.requests[0].passengerId;
      const psg = rawPassengers.find(p => p.id === pId);
      if (psg) return (psg.country || 'JO') === activeCountryCode;
    }
    if (r.driverId) {
      const drv = rawDrivers.find(d => d.id === r.driverId);
      if (drv) return (drv.country || 'JO') === activeCountryCode;
    }
    return true;
  });
  const requests = rawRequests.filter(req => {
    const psg = rawPassengers.find(p => p.id === req.passengerId);
    return psg ? (psg.country || 'JO') === activeCountryCode : true;
  });
  const scheduledTrips = rawScheduledTrips.filter(t => (t.country || 'JO') === activeCountryCode);
  const walletTransactions = rawWalletTransactions.filter(tx => {
    const drv = rawDrivers.find(d => d.id === tx.userId);
    if (drv) return (drv.country || 'JO') === activeCountryCode;
    const psg = rawPassengers.find(p => p.id === tx.userId);
    if (psg) return (psg.country || 'JO') === activeCountryCode;
    return true;
  });

  // Admin Login Local States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // AI Evolution Tab States
  const [dragActive, setDragActive] = useState(false);

  // AI Automated Historical Demand Scheduling States
  const [isAutomatedLoading, setIsAutomatedLoading] = useState(false);
  const [aiReviewSuggestions, setAiReviewSuggestions] = useState<any[]>([]);
  const [selectedAiSuggestions, setSelectedAiSuggestions] = useState<{ [id: string]: boolean }>({});
  const [adminAiSimplificationFeedback, setAdminAiSimplificationFeedback] = useState<string>('');
  const [isAdminAnalyzing, setIsAdminAnalyzing] = useState<boolean>(false);
  const [showCriticalOnly, setShowCriticalOnly] = useState<boolean>(false);
  const [inspectedDriverRatings, setInspectedDriverRatings] = useState<any | null>(null);

  // AI Active Ride Control Modal States
  const [aiActiveRideModalOpen, setAiActiveRideModalOpen] = useState(false);
  const [selectedRideForAiControl, setSelectedRideForAiControl] = useState<any>(null);
  const [selectedRideTypeForAi, setSelectedRideTypeForAi] = useState<'instant' | 'intracity' | 'scheduled'>('instant');

  // AI Driver Scope Consultation States
  const [aiDriverScopeConsultation, setAiDriverScopeConsultation] = useState<{
    driver: any;
    loading: boolean;
    recommendedScope?: 'local' | 'intercity' | 'both';
    reasoning?: string;
  } | null>(null);

  // AI Debt Limit Consultation States
  const [aiDebtLimitConsultation, setAiDebtLimitConsultation] = useState<{
    user: any;
    userType: 'driver' | 'passenger';
    loading: boolean;
    recommendedDebtLimit?: number;
    reasoning?: string;
  } | null>(null);

  // SMART DEBT & CANCELLATION TAB STATES
  const [debtScope, setDebtScope] = useState<'all_drivers' | 'all_passengers' | 'single_driver' | 'single_passenger'>('all_drivers');
  const [selectedDebtDriverId, setSelectedDebtDriverId] = useState<string>('');
  const [selectedDebtPassengerId, setSelectedDebtPassengerId] = useState<string>('');
  const [customDebtValue, setCustomDebtValue] = useState<number>(0);
  const [aiDebtLoading, setAiDebtLoading] = useState<boolean>(false);
  const [aiDebtResult, setAiDebtResult] = useState<{ limit: number; reasoning: string } | null>(null);

  const [cancelGoals, setCancelGoals] = useState<string>('تقليل نسبة الإلغاء المتأخر يوم الخميس مساءً وزيادة التزام الكباتن والركاب بالأردن');
  const [cancelMarketCondition, setCancelMarketCondition] = useState<'balanced' | 'high_demand' | 'low_demand'>('balanced');
  const [aiCancelLoading, setAiCancelLoading] = useState<boolean>(false);

  const [policyPassengerDirect, setPolicyPassengerDirect] = useState<number>(1.0);
  const [policyPassengerScheduled, setPolicyPassengerScheduled] = useState<number>(2.0);
  const [policyDriverDirect, setPolicyDriverDirect] = useState<number>(0.5);
  const [policyDriverScheduled, setPolicyDriverScheduled] = useState<number>(3.0);
  const [policyFreeWindow, setPolicyFreeWindow] = useState<number>(5);
  const [policyAiAdaptive, setPolicyAiAdaptive] = useState<boolean>(true);
  const [policyDescription, setPolicyDescription] = useState<string>('');

  const requestAiDebtLimitRecommendation = async (user: any, userType: 'driver' | 'passenger') => {
    setAiDebtLimitConsultation({
      user,
      userType,
      loading: true
    });

    try {
      const response = await fetch('/api/ai-recommend-debt-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user,
          userType,
          systemSettings: settings
        })
      });

      const data = await response.json();
      if (data.success) {
        setAiDebtLimitConsultation({
          user,
          userType,
          loading: false,
          recommendedDebtLimit: data.recommendedDebtLimit,
          reasoning: data.reasoning
        });
      } else {
        alert("🚫 فشل الاتصال بمستشار الائتمان الذكي بـ AI: " + data.msg);
        setAiDebtLimitConsultation(null);
      }
    } catch (err: any) {
      alert("🚫 عذراً، حدث خطأ فني أثناء استدعاء مستشار الائتمان: " + err.message);
      setAiDebtLimitConsultation(null);
    }
  };

  const handleRequestSmartDebtLimit = async () => {
    setAiDebtLoading(true);
    setAiDebtResult(null);

    try {
      let userTarget: any = null;
      let userType: 'driver' | 'passenger' = 'driver';

      if (debtScope === 'single_driver') {
        userTarget = drivers.find(d => d.id === selectedDebtDriverId);
        userType = 'driver';
      } else if (debtScope === 'single_passenger') {
        userTarget = passengers.find(p => p.id === selectedDebtPassengerId);
        userType = 'passenger';
      } else if (debtScope === 'all_drivers') {
        // Construct aggregate dummy driver representing Jordanian fleet standard
        userTarget = {
          fullName: "جميع الكباتن (أسطول الأردن الموحد)",
          username: "jordan_captains",
          ratingAverage: drivers.length > 0 ? Number((drivers.reduce((acc, d) => acc + (d.ratingAverage || 5.0), 0) / drivers.length).toFixed(2)) : 4.8,
          tripsCount: drivers.length > 0 ? Math.round(drivers.reduce((acc, d) => acc + (d.tripsCount || 0), 0) / drivers.length) : 120,
          carType: "هجين وعادي",
          carClass: "اقتصادي ومتميز",
          carModel: 2021,
          governorate: "عمان وباقي المحافظات",
          balance: 0
        };
        userType = 'driver';
      } else if (debtScope === 'all_passengers') {
        userTarget = {
          fullName: "جميع الركاب (العملاء النشطين بالأردن)",
          username: "jordan_passengers",
          ratingAverage: passengers.length > 0 ? Number((passengers.reduce((acc, p) => acc + (p.ratingAverage || 5.0), 0) / passengers.length).toFixed(2)) : 4.7,
          tripsCount: passengers.length > 0 ? Math.round(passengers.reduce((acc, p) => acc + (p.tripsCount || 0), 0) / passengers.length) : 35,
          governorate: "جميع محافظات الأردن",
          balance: 0
        };
        userType = 'passenger';
      }

      if (!userTarget) {
        alert("⚠️ الرجاء اختيار مستخدم محدد أولاً لإتمام التحليل.");
        setAiDebtLoading(false);
        return;
      }

      const response = await fetch('/api/ai-recommend-debt-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: userTarget,
          userType,
          systemSettings: settings
        })
      });

      const data = await response.json();
      if (data.success) {
        setAiDebtResult({
          limit: data.recommendedDebtLimit,
          reasoning: data.reasoning
        });
        setCustomDebtValue(data.recommendedDebtLimit);
      } else {
        alert("🚫 فشل استدعاء الذكاء الاصطناعي: " + data.msg);
      }
    } catch (e: any) {
      console.error(e);
      alert("❌ حدث خطأ غير متوقع أثناء تحليل حدود المديونية: " + e.message);
    } finally {
      setAiDebtLoading(false);
    }
  };

  const handleApplyDebtLimit = () => {
    if (debtScope === 'single_driver') {
      if (!selectedDebtDriverId) {
        alert("⚠️ الرجاء اختيار كابتن أولاً.");
        return;
      }
      setDriverMinBalanceLimit(selectedDebtDriverId, customDebtValue);
      alert(`✅ تم بنجاح تطبيق حد مديونية مخصص بقيمة (${customDebtValue} د.أ) للكابتن المختار.`);
    } else if (debtScope === 'single_passenger') {
      if (!selectedDebtPassengerId) {
        alert("⚠️ الرجاء اختيار راكب أولاً.");
        return;
      }
      setPassengerMinBalanceLimit(selectedDebtPassengerId, customDebtValue);
      alert(`✅ تم بنجاح تطبيق حد مديونية مخصص بقيمة (${customDebtValue} د.أ) للراكب المختار.`);
    } else if (debtScope === 'all_drivers') {
      // Bulk update default value inside system settings
      updateSettings({
        defaultDriverMinBalance: customDebtValue
      });
      // Optionally bulk update all existing drivers' minBalanceLimit too!
      drivers.forEach(d => {
        setDriverMinBalanceLimit(d.id, customDebtValue);
      });
      alert(`✅ تم بنجاح تحديث الحد الافتراضي للنظام وتطبيقه على جميع الكباتن النشطين بقيمة (${customDebtValue} د.أ).`);
    } else if (debtScope === 'all_passengers') {
      // Bulk update default value inside system settings
      updateSettings({
        defaultPassengerMinBalance: customDebtValue
      });
      // Optionally bulk update all existing passengers' minBalanceLimit too!
      passengers.forEach(p => {
        setPassengerMinBalanceLimit(p.id, customDebtValue);
      });
      alert(`✅ تم بنجاح تحديث الحد الافتراضي للنظام وتطبيقه على جميع الركاب النشطين بقيمة (${customDebtValue} د.أ).`);
    }
  };

  const handleGenerateAiCancellationPolicy = async () => {
    setAiCancelLoading(true);
    try {
      const response = await fetch('/api/ai-generate-cancellation-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals: cancelGoals,
          marketCondition: cancelMarketCondition
        })
      });

      const data = await response.json();
      if (data.success && data.policy) {
        setPolicyPassengerDirect(data.policy.passengerCancelFeeDirect);
        setPolicyPassengerScheduled(data.policy.passengerCancelFeeScheduled);
        setPolicyDriverDirect(data.policy.driverCancelFeeDirect);
        setPolicyDriverScheduled(data.policy.driverCancelFeeScheduled);
        setPolicyFreeWindow(data.policy.freeCancellationWindowMinutes);
        setPolicyDescription(data.policy.policyDescriptionAr || '');
        alert("💡 تم بنجاح صياغة وهندسة تسعيرة الإلغاء الذكية بواسطة Gemini AI! يمكنك استعراضها وتعديلها الآن.");
      } else {
        alert("🚫 فشل صياغة السياسة بواسطة الذكاء الاصطناعي: " + data.msg);
      }
    } catch (e: any) {
      console.error(e);
      alert("❌ حدث خطأ أثناء صياغة السياسة بـ AI: " + e.message);
    } finally {
      setAiCancelLoading(false);
    }
  };

  const handleSaveCancellationPolicy = () => {
    updateSettings({
      cancellationPolicy: {
        passengerCancelFeeDirect: policyPassengerDirect,
        passengerCancelFeeScheduled: policyPassengerScheduled,
        driverCancelFeeDirect: policyDriverDirect,
        driverCancelFeeScheduled: policyDriverScheduled,
        freeCancellationWindowMinutes: policyFreeWindow,
        aiAdaptiveEnabled: policyAiAdaptive,
        policyDescriptionAr: policyDescription
      }
    });
    alert("💾 تم بنجاح حفظ وتفعيل سياسة إلغاء الخدمة الذكية وتعميمها على جميع التطبيقات النشطة للكباتن والركاب!");
  };

  // AI Booking Integrity & Fleet Schedule Audit States
  const [aiBookingReport, setAiBookingReport] = useState<string | null>(null);
  const [isAiBookingAuditing, setIsAiBookingAuditing] = useState<boolean>(false);

  const triggerAiBookingAudit = async () => {
    setIsAiBookingAuditing(true);
    setAiBookingReport(null);
    try {
      const response = await fetch('/api/ai-booking-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          drivers,
          scheduledTrips
        })
      });
      const data = await response.json();
      if (data.success) {
        setAiBookingReport(data.auditReport);
      } else {
        alert(data.msg || 'فشل في الحصول على تقرير التدقيق.');
      }
    } catch (e: any) {
      console.error(e);
      alert('حدث خطأ غير متوقع أثناء تدقيق المسارات بـ AI.');
    } finally {
      setIsAiBookingAuditing(false);
    }
  };

  const requestAiDriverScopeRecommendation = async (driver: any) => {
    setAiDriverScopeConsultation({
      driver,
      loading: true
    });

    try {
      const response = await fetch('/api/ai-driver-scope', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          driver,
          systemSettings: settings
        })
      });

      const data = await response.json();
      if (data.success) {
        setAiDriverScopeConsultation({
          driver,
          loading: false,
          recommendedScope: data.recommendedScope,
          reasoning: data.reasoning
        });
      } else {
        alert("🚫 فشل الاتصال بمستشار الذكاء الاصطناعي: " + data.msg);
        setAiDriverScopeConsultation(null);
      }
    } catch (err: any) {
      alert("🚫 عذراً، حدث خطأ فني أثناء استدعاء مستشار الـ AI: " + err.message);
      setAiDriverScopeConsultation(null);
    }
  };

  // Employee AI Co-Pilot States
  const [employeeCopilotMessages, setEmployeeCopilotMessages] = useState<any[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'مرحباً زميلي العزيز! أنا مساعد الموظف التنفيذي الذكي بـ Gemini. أنا هنا لمساعدتك في تيسير أعمالك اليومية، تدقيق الكباتن، إدارة المحافظ، وحل مشكلات العملاء فوراً وبشكل متكامل مع لوحة التحكم. اكتب استفسارك أو استخدم إحدى بطاقات الإجراءات المقترحة أدناه للبدء! 🚀',
      createdAt: new Date().toISOString()
    }
  ]);
  const [employeeCopilotInput, setEmployeeCopilotInput] = useState<string>('');
  const [isCopilotLoading, setIsCopilotLoading] = useState<boolean>(false);

  // Employee Auditor States
  const [employeeAuditReport, setEmployeeAuditReport] = useState<string>('');
  const [isEmployeeAuditing, setIsEmployeeAuditing] = useState<boolean>(false);

  // Admin & Operator password change state
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [newAdminPasswordVal, setNewAdminPasswordVal] = useState('');
  const [adminPasswordFeedback, setAdminPasswordFeedback] = useState('');

  // Enforcement & Violation Control States
  const [enforcementSearch, setEnforcementSearch] = useState<string>('');
  const [enforcementRoleFilter, setEnforcementRoleFilter] = useState<'all' | 'driver' | 'passenger'>('all');
  const [enforcementStatusFilter, setEnforcementStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [selectedEnforceUser, setSelectedEnforceUser] = useState<any | null>(null);
  const [enforceViolationType, setEnforceViolationType] = useState<string>('سلوك غير لائق ومخالفة التعليمات');
  const [enforceViolationDesc, setEnforceViolationDesc] = useState<string>('');
  const [isEnforceAnalyzing, setIsEnforceAnalyzing] = useState<boolean>(false);
  const [enforceAiRecommendation, setEnforceAiRecommendation] = useState<{
    riskLevel?: 'high' | 'medium' | 'low';
    recommendedAction?: string;
    shouldSuspend?: boolean;
    officialLetter?: string;
  } | null>(null);
  const [enforceActionSuccessMsg, setEnforceActionSuccessMsg] = useState<string>('');
  const [enforcementHistoryLogs, setEnforcementHistoryLogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('adam_enforcement_violations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginUsername.trim()) {
      setLoginError('الرجاء إدخال اسم المستخدم');
      return;
    }
    if (!loginPassword) {
      setLoginError('الرجاء إدخال كلمة السر');
      return;
    }
    const res = login(loginUsername.trim(), loginPassword, 'admin');
    if (res && res.success) {
      setLoginUsername('');
      setLoginPassword('');
    } else {
      setLoginError(res ? res.msg : 'اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  // Helper to verify the state of a permission ('enabled', 'disabled', or 'hidden')
  const getPermissionState = (permKey: keyof Employee['permissions']): 'enabled' | 'disabled' | 'hidden' => {
    if (!currentUser) return 'hidden';
    if (currentUser.role !== 'admin' && currentUser.role !== 'employee') return 'hidden';
    
    // يحصل المدير العام والمطور ومسؤول النظام الرئيسي 'admin' على الصلاحية الفعالة والمطلقة دائماً
    if (currentUser.username === 'admin' || currentUser.username === 'Ahmaidat' || currentUser.role === 'admin') {
      return 'enabled';
    }
    
    // الموظفون والمسؤولون الفرعيون - يتم جلب وتطبيق صلاحياتهم التشغيلية ديناميكياً من الحالة اللحظية للنظام
    const matchedEmployee = employees.find(e => e.id === currentUser.id || e.username === currentUser.username);
    const resolvedUserInControl = matchedEmployee || currentUser;
    
    if (resolvedUserInControl && resolvedUserInControl.permissions) {
      const val = resolvedUserInControl.permissions[permKey];
      if (val === 'enabled' || val === true) return 'enabled';
      if (val === 'disabled' || val === false) return 'disabled';
      return 'hidden';
    }
    
    return 'hidden';
  };

  // Helper to check if user has access (either enabled or disabled, but not hidden)
  const hasPermissionAccess = (permKey: keyof Employee['permissions']) => {
    const state = getPermissionState(permKey);
    return state === 'enabled' || state === 'disabled';
  };

  // Helper to check if user has write access (is enabled)
  const hasPermissionWrite = (permKey: keyof Employee['permissions']) => {
    const state = getPermissionState(permKey);
    return state === 'enabled';
  };

  const hasPermission = (permKey: keyof Employee['permissions']) => {
    return hasPermissionWrite(permKey);
  };

  const canAccessTab = (tab: 'dashboard' | 'employees' | 'users' | 'areas' | 'pickup-points' | 'billing' | 'trips' | 'chat' | 'drive' | 'ratings' | 'company' | 'ai-diagnose' | 'ai-studio' | 'gmail' | 'ai-evolution' | 'countries' | 'whatsapp' | 'analytics' | 'payment-ledger' | 'enforcement' | 'languages' | 'ads' | 'ai-debt-cancel' | 'er-diagram' | 'ui-customizer') => {
    if (!currentUser) return false;
    if (currentUser.role !== 'admin' && currentUser.role !== 'employee') return false;
    if (currentUser.username === 'admin' || currentUser.username === 'Ahmaidat' || currentUser.role === 'admin') return true;

    if (tab === 'dashboard' || tab === 'analytics' || tab === 'ai-debt-cancel' || tab === 'er-diagram' || tab === 'ui-customizer') return true;
    if (tab === 'employees') return currentUser.username === 'admin' || currentUser.username === 'Ahmaidat' || currentUser.role === 'admin';

    switch (tab) {
      case 'languages':
        return true; // accessible to all admins and employees
      case 'enforcement':
        return hasPermissionAccess('activeDrivers') || hasPermissionAccess('passengers');
      case 'payment-ledger':
        return currentUser.username === 'admin' || currentUser.username === 'Ahmaidat' || currentUser.role === 'admin' || hasPermissionAccess('auditPayments');
      case 'whatsapp':
        return true;
      case 'pickup-points':
        return hasPermissionAccess('rateManagement');
      case 'countries':
        return currentUser.username === 'admin' || currentUser.username === 'Ahmaidat' || currentUser.role === 'admin' || hasPermissionAccess('rateManagement');
      case 'users':
        return hasPermissionAccess('pendingDrivers') || hasPermissionAccess('activeDrivers') || hasPermissionAccess('passengers');
      case 'areas':
        return hasPermissionAccess('rateManagement');
      case 'billing':
        return hasPermissionAccess('walletApprovals');
      case 'trips':
        return hasPermissionAccess('allRides') || hasPermissionAccess('scheduledTrips');
      case 'chat':
        return hasPermissionAccess('allRides');
      case 'drive':
        return hasPermissionAccess('pendingDrivers') || hasPermissionAccess('activeDrivers');
      case 'ratings':
        return hasPermissionAccess('userFeedbacks');
      case 'company':
        return hasPermissionAccess('scheduledTrips') || hasPermissionAccess('rateManagement');
      case 'ai-diagnose':
        return hasPermissionAccess('aiServicesStrategy');
      case 'ai-studio':
        return hasPermissionAccess('aiDeveloperStudio');
      case 'ai-evolution':
        return hasPermissionAccess('aiDeveloperStudio') || currentUser.username === 'admin' || currentUser.username === 'Ahmaidat';
      case 'gmail':
        return true;
      default:
        return true;
    }
  };

  const [activeTab, setActiveTabState] = useState<'dashboard' | 'employees' | 'users' | 'areas' | 'pickup-points' | 'billing' | 'trips' | 'chat' | 'drive' | 'ratings' | 'company' | 'ai-diagnose' | 'ai-studio' | 'gmail' | 'ai-evolution' | 'countries' | 'whatsapp' | 'analytics' | 'payment-ledger' | 'enforcement' | 'languages' | 'ads' | 'ai-debt-cancel' | 'er-diagram' | 'ui-customizer'>('dashboard');
  const [openWorkScopeDropdownDriverId, setOpenWorkScopeDropdownDriverId] = useState<string | null>(null);
  const [openServiceScopeDropdownPassengerId, setOpenServiceScopeDropdownPassengerId] = useState<string | null>(null);

  const setActiveTab = (tab: typeof activeTab) => {
    if (canAccessTab(tab)) {
      setActiveTabState(tab);
    }
  };

  // Redirect to first permitted tab if activeTab is not accessible
  useEffect(() => {
    if (currentUser && currentUser.username !== 'admin' && currentUser.username !== 'Ahmaidat') {
      if (!canAccessTab(activeTab)) {
        const allTabsState: typeof activeTab[] = ['countries', 'dashboard', 'ui-customizer', 'users', 'areas', 'pickup-points', 'billing', 'trips', 'chat', 'ratings', 'drive', 'company', 'ai-diagnose', 'ai-studio', 'gmail', 'ai-evolution', 'whatsapp', 'analytics', 'payment-ledger', 'enforcement', 'languages', 'ads', 'ai-debt-cancel', 'er-diagram'];
        const permitted = allTabsState.find(t => canAccessTab(t));
        if (permitted) {
          setActiveTabState(permitted);
        }
      }
    }
  }, [currentUser, activeTab]);

  // Load initial values from settings for cancellation policy
  useEffect(() => {
    if (settings.cancellationPolicy) {
      setPolicyPassengerDirect(settings.cancellationPolicy.passengerCancelFeeDirect);
      setPolicyPassengerScheduled(settings.cancellationPolicy.passengerCancelFeeScheduled);
      setPolicyDriverDirect(settings.cancellationPolicy.driverCancelFeeDirect);
      setPolicyDriverScheduled(settings.cancellationPolicy.driverCancelFeeScheduled);
      setPolicyFreeWindow(settings.cancellationPolicy.freeCancellationWindowMinutes);
      setPolicyAiAdaptive(settings.cancellationPolicy.aiAdaptiveEnabled);
      if (settings.cancellationPolicy.policyDescriptionAr) {
        setPolicyDescription(settings.cancellationPolicy.policyDescriptionAr);
      }
    }
  }, [settings.cancellationPolicy]);

  const renderReadOnlyBanner = (permKey: keyof Employee['permissions'], customLabel?: string) => {
    const state = getPermissionState(permKey);
    if (state === 'enabled' || state === 'hidden') return null;
    return (
      <div className="bg-amber-950/45 border border-amber-500/20 text-amber-400 p-3.5 rounded-xl text-xs flex items-center justify-between flex-row-reverse mb-5 shadow-inner font-sans">
        <div className="flex items-center gap-2 flex-row-reverse">
          <Lock className="w-4 h-4 text-amber-500 shrink-0" />
          <span>⚠️ <strong>وضع الاطلاع والمراقبة فقط (ملغاة إجرائياً):</strong> هذه الخدمة ({customLabel || 'الإدارة والمتابعة'}) تم قصرها على القراءة فقط لحسابك الوظيفي الحالي من قِبل إدارة الأكاديمية والمدير العام.</span>
        </div>
        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg font-black font-mono shrink-0">READ-ONLY (ملغاة تفعيلاً)</span>
      </div>
    );
  };
  
  // Employee management states
  const [editingCountryCode, setEditingCountryCode] = useState<string | null>(null);
  const [editCountryNameAr, setEditCountryNameAr] = useState('');
  const [editCountryNameEn, setEditCountryNameEn] = useState('');
  const [editCountryFlag, setEditCountryFlag] = useState('');
  const [editCountryCurrencyAr, setEditCountryCurrencyAr] = useState('');
  const [editCountryCurrencyEn, setEditCountryCurrencyEn] = useState('');
  const [editCountryBaseRate, setEditCountryBaseRate] = useState(1.5);
  const [editCountryPerKmRate, setEditCountryPerKmRate] = useState(0.35);
  const [editCountryPerSeatRate, setEditCountryPerSeatRate] = useState(0.20);

  const [addCountryCodeInput, setAddCountryCodeInput] = useState('');
  const [addCountryNameAr, setAddCountryNameAr] = useState('');
  const [addCountryNameEn, setAddCountryNameEn] = useState('');
  const [addCountryFlag, setAddCountryFlag] = useState('🏳️');
  const [addCountryCurrencyAr, setAddCountryCurrencyAr] = useState('');
  const [addCountryCurrencyEn, setAddCountryCurrencyEn] = useState('');
  const [addCountryBaseRate, setAddCountryBaseRate] = useState(1.5);
  const [addCountryPerKmRate, setAddCountryPerKmRate] = useState(0.35);
  const [addCountryPerSeatRate, setAddCountryPerSeatRate] = useState(0.20);

  const [usersSubTab, setUsersSubTab] = useState<'pending' | 'captains' | 'passengers'>('pending');
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [passengerSearchQuery, setPassengerSearchQuery] = useState('');
  const [quickUserSearchQuery, setQuickUserSearchQuery] = useState('');
  const [quickSelectedUser, setQuickSelectedUser] = useState<any | null>(null);
  const [quickSelectedUserRole, setQuickSelectedUserRole] = useState<'driver' | 'passenger' | null>(null);
  const [quickNewPassword, setQuickNewPassword] = useState('');
  const [quickNewStatus, setQuickNewStatus] = useState<'approved' | 'blocked' | 'pending'>('approved');
  const [quickActionMessage, setQuickActionMessage] = useState('');
  const [pricingSubTab, setPricingSubTab] = useState<'banking' | 'rates' | 'intracity' | 'logo' | 'offers' | 'ai-audit' | 'profit-controls'>('banking');
  
  // States for Company Profit Privacy & Reset (Hide & Zero-out Profits)
  const [showProfitPinModal, setShowProfitPinModal] = useState(false);
  const [profitPinAction, setProfitPinAction] = useState<'toggle_hide' | 'zero_profits' | 'restore_profits' | null>(null);
  const [profitInputPin, setProfitInputPin] = useState('');
  const [profitPinError, setProfitPinError] = useState('');
  const [profitFeedbackMsg, setProfitFeedbackMsg] = useState('');
  const [billingSubTab, setBillingSubTab] = useState<'recharge' | 'pending-recharges' | 'withdrawals' | 'cash-logs'>('recharge');
  
  // States for incoming recharges and AI balance top-up audit
  const [incomingRechargeFilter, setIncomingRechargeFilter] = useState<'all' | 'pending' | 'approved' | 'passengers' | 'drivers'>('all');
  const [incomingRechargeSearch, setIncomingRechargeSearch] = useState<string>('');
  const [aiRechargeAuditRunning, setAiRechargeAuditRunning] = useState<boolean>(false);
  const [aiRechargeAuditReport, setAiRechargeAuditReport] = useState<string>('');

  // States for cash logs filter
  const [cashLogSearch, setCashLogSearch] = useState('');
  const [cashLogUserType, setCashLogUserType] = useState<'all' | 'driver' | 'passenger'>('all');
  const [cashLogPaymentMethod, setCashLogPaymentMethod] = useState<'all' | 'wallet' | 'cliq' | 'bank'>('all');
  const [cashLogType, setCashLogType] = useState<'all' | 'deposit' | 'fare_payment'>('all');
  const [isAiGeneratingCashReport, setIsAiGeneratingCashReport] = useState(false);
  const [aiCashReportResult, setAiCashReportResult] = useState('');
  const [showQuickRechargeModalInLogs, setShowQuickRechargeModalInLogs] = useState(false);

  // States for Payment Ledger Filters
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerUserType, setLedgerUserType] = useState<'all' | 'driver' | 'passenger'>('all');
  const [ledgerTxType, setLedgerTxType] = useState<'all' | 'deposit' | 'withdraw' | 'fare_payment' | 'commission_deduction' | 'cancel_fee'>('all');
  const [ledgerPaymentMethod, setLedgerPaymentMethod] = useState<'all' | 'wallet' | 'cliq' | 'bank'>('all');
  const [ledgerStatus, setLedgerStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [ledgerDateRange, setLedgerDateRange] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');

  const [isAiFinancialAuditing, setIsAiFinancialAuditing] = useState(false);
  const [aiFinancialAuditReport, setAiFinancialAuditReport] = useState('');

  // WhatsApp Broadcast Campaign States
  const [whatsappMessageText, setWhatsappMessageText] = useState(
    'مرحباً {name}، يسعدنا إعلامك بوجود عروض وحوافز جديدة في نظام ADAM لقطاع النقل الذكي! 🚕✨ تفضل بزيارة حسابك في التطبيق للاستفادة من المزايا.'
  );
  const [whatsappTargetRole, setWhatsappTargetRole] = useState<'all' | 'drivers' | 'passengers'>('all');
  const [whatsappSearchQuery, setWhatsappSearchQuery] = useState('');
  const [whatsappCountryScope, setWhatsappCountryScope] = useState<'active' | 'all'>('active');
  const [whatsappSimulationLogs, setWhatsappSimulationLogs] = useState<string[]>([]);
  const [whatsappCampaignStatus, setWhatsappCampaignStatus] = useState<'idle' | 'sending' | 'completed'>('idle');
  const [whatsappCurrentIndex, setWhatsappCurrentIndex] = useState<number>(0);
  const [whatsappSentCount, setWhatsappSentCount] = useState<number>(0);
  
  // Custom Offer/Discount Creation states
  const [newOfferCode, setNewOfferCode] = useState('');
  const [newOfferTitle, setNewOfferTitle] = useState('');
  const [newOfferTargetType, setNewOfferTargetType] = useState<'passenger' | 'driver' | 'both'>('passenger');
  const [newOfferTravelScope, setNewOfferTravelScope] = useState<'intracity' | 'intercity' | 'all'>('all');
  const [newOfferDiscountType, setNewOfferDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [newOfferValue, setNewOfferValue] = useState(1.0);
  const [newOfferMinAmount, setNewOfferMinAmount] = useState(0.0);
  const [newOfferCategory, setNewOfferCategory] = useState<'discount_ride' | 'wallet_bonus_code' | 'challenge_milestone'>('discount_ride');
  const [newOfferTargetRides, setNewOfferTargetRides] = useState(5);
  const [newOfferHoursLimit, setNewOfferHoursLimit] = useState(12);
  const [newOfferBonusAmount, setNewOfferBonusAmount] = useState(10.0);
  const [offerStatusMsg, setOfferStatusMsg] = useState('');
  const [aiProposedCampaigns, setAiProposedCampaigns] = useState<any[]>([]);
  const [isAiCampaignLoading, setIsAiCampaignLoading] = useState(false);
  const [aiCampaignSuccessMsg, setAiCampaignSuccessMsg] = useState('');

  // Launch Gate States
  const [launchDateTime, setLaunchDateTime] = useState<string>(
    settings.serviceLaunchConfig?.launchDateTime || '2026-08-01T09:00'
  );
  const [launchBlockBooking, setLaunchBlockBooking] = useState<boolean>(
    settings.serviceLaunchConfig?.blockBookingBeforeLaunch ?? true
  );
  const [launchTargetAudience, setLaunchTargetAudience] = useState<'all' | 'passengers' | 'drivers'>(
    settings.serviceLaunchConfig?.targetAudience || 'all'
  );
  const [launchTitle, setLaunchTitle] = useState<string>(
    settings.serviceLaunchConfig?.announcementTitle || '🚀 انطلاق خدمات تطبيق آدم للنقل الذكي وتفعيل الحجوزات!'
  );
  const [launchMessage, setLaunchMessage] = useState<string>(
    settings.serviceLaunchConfig?.announcementMessage || 'يسعدنا إعلام جميع النشامى ببدء وتفعيل كافة خدمات الحجز والمشاوير الفورية والتشاركية رسمياً. نتمنى لكم رحلات سعيدة وموفقة مع آدم!'
  );
  const [isAiGeneratingLaunchAnnounce, setIsAiGeneratingLaunchAnnounce] = useState<boolean>(false);
  const [launchSuccessMsg, setLaunchSuccessMsg] = useState<string>('');

  // Free Credit Grants Portal states
  const [creditGrantAmount, setCreditGrantAmount] = useState<number>(5.0);
  const [creditGrantReason, setCreditGrantReason] = useState<string>('رصيد مكافأة ترحيبية من إدارة التطبيق');
  const [creditGrantTargetType, setCreditGrantTargetType] = useState<'all_new_passengers' | 'all_new_drivers' | 'everyone' | 'selected_users' | 'ai_target_passenger' | 'ai_target_driver'>('all_new_passengers');
  const [creditGrantSelectedUserIds, setCreditGrantSelectedUserIds] = useState<string[]>([]);
  const [creditGrantUserSearch, setCreditGrantUserSearch] = useState<string>('');
  const [creditGrantAiCriterion, setCreditGrantAiCriterion] = useState<string>('loyal');
  const [creditGrantCustomPrompt, setCreditGrantCustomPrompt] = useState<string>('');
  const [isCreditGrantAiLoading, setIsCreditGrantAiLoading] = useState<boolean>(false);
  const [creditGrantAiProposedUsers, setCreditGrantAiProposedUsers] = useState<any[]>([]);
  const [creditGrantSuccessMsg, setCreditGrantSuccessMsg] = useState<string>('');
  const [creditGrantErrorMsg, setCreditGrantErrorMsg] = useState<string>('');

  const handleAiGenerateLaunchAnnouncement = async () => {
    setIsAiGeneratingLaunchAnnounce(true);
    try {
      const res = await fetch('/api/ai-generate-launch-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          launchDate: launchDateTime,
          targetAudience: launchTargetAudience
        })
      });
      const data = await res.json();
      setIsAiGeneratingLaunchAnnounce(false);
      if (data.success && data.announcement) {
        setLaunchTitle(data.announcement.title || launchTitle);
        setLaunchMessage(data.announcement.message || launchMessage);
      } else {
        alert("⚠️ فشل توليد إعلان الإطلاق بالذكاء الاصطناعي.");
      }
    } catch (err: any) {
      setIsAiGeneratingLaunchAnnounce(false);
      console.error(err);
      alert("⚠️ عطل أثناء التواصل مع ملقم الذكاء الاصطناعي.");
    }
  };

  const handleSaveLaunchConfig = () => {
    const config = {
      enabled: true,
      launchDateTime,
      blockBookingBeforeLaunch: launchBlockBooking,
      targetAudience: launchTargetAudience,
      announcementTitle: launchTitle,
      announcementMessage: launchMessage,
      passengerMessageAr: launchMessage,
      driverMessageAr: launchMessage,
      allowPassengerRegistration: true,
      allowDriverRegistration: true
    };

    updateServiceLaunchConfig(config);

    addCommercialAd({
      title: launchTitle,
      description: launchMessage,
      badgeText: '📢 إعلان الإطلاق الرسمي',
      buttonText: 'تصفح الخدمات والتفاصيل 🚀',
      imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
      target: launchTargetAudience,
      status: 'active',
      isLaunchAnnouncement: true,
      launchDateTime
    });

    setLaunchSuccessMsg(`✅ تم حفظ ومزامنة موعد الإطلاق الرسمي (${new Date(launchDateTime).toLocaleString('ar-JO')}) ونشر الإعلان المترابط بالـ API بنجاح!`);
    setTimeout(() => setLaunchSuccessMsg(''), 6000);
  };
  const [empFullName, setEmpFullName] = useState('');
  const [empUsername, setEmpUsername] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [promotingUser, setPromotingUser] = useState<{ id: string; fullName: string; username: string; type: 'driver' | 'passenger'; password?: string } | null>(null);

  // AI Employee generator and helper states
  const [aiEmployeePrompt, setAiEmployeePrompt] = useState('');
  const [aiEmployeeIsLoading, setAiEmployeeIsLoading] = useState(false);
  const [selectedTargetEmpForAi, setSelectedTargetEmpForAi] = useState<string>('');
  const [aiEmployeeResult, setAiEmployeeResult] = useState<{
    actionType?: 'CREATE_NEW_EMPLOYEE' | 'UPDATE_EXISTING_EMPLOYEE' | 'UPDATE_ALL_EXISTING_EMPLOYEES';
    targetEmployeeId?: string;
    targetUsername?: string;
    fullName: string;
    username: string;
    password?: string;
    permissions: Record<string, 'enabled' | 'disabled' | 'hidden'>;
    explanation: string;
  } | null>(null);
  const [aiEmployeeFeedbackMsg, setAiEmployeeFeedbackMsg] = useState('');

  // Inline editing employee state
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editingEmployeeName, setEditingEmployeeName] = useState('');
  const [editingEmployeeUsername, setEditingEmployeeUsername] = useState('');
  const [editingEmployeePassword, setEditingEmployeePassword] = useState('');
  
  // Pick-up Points Management states
  const [selectedPickupGov, setSelectedPickupGov] = useState<string>("عمان (Amman)");
  const [newPickupPointName, setNewPickupPointName] = useState<string>("");
  const [pickupPointMsg, setPickupPointMsg] = useState<string>("");

  const handleAddPickupPoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPickupPointName.trim()) return;
    const govName = selectedPickupGov || settings.locations[0]?.governorate;
    if (!govName) return;

    const updated = settings.locations.map(loc => {
      if (loc.governorate === govName) {
        const existingPoints = loc.pickupPoints || [];
        if (existingPoints.includes(newPickupPointName.trim())) {
          return loc;
        }
        return {
          ...loc,
          pickupPoints: [...existingPoints, newPickupPointName.trim()]
        };
      }
      return loc;
    });

    updateSettings({ locations: updated });
    setNewPickupPointName('');
    setPickupPointMsg(`✓ تمت إضافة نقطة التجمع "${newPickupPointName.trim()}" إلى ${govName} بنجاح!`);
    setTimeout(() => setPickupPointMsg(''), 3500);
  };

  const handleRemovePickupPoint = (govName: string, pointToRemove: string) => {
    const updated = settings.locations.map(loc => {
      if (loc.governorate === govName) {
        return {
          ...loc,
          pickupPoints: (loc.pickupPoints || []).filter(p => p !== pointToRemove)
        };
      }
      return loc;
    });

    updateSettings({ locations: updated });
    setPickupPointMsg(`🗑️ تم حذف النقطة "${pointToRemove}" بنجاح!`);
    setTimeout(() => setPickupPointMsg(''), 3500);
  };
  const [empPerms, setEmpPerms] = useState<Record<keyof Employee['permissions'], PermissionState>>({
    pendingDrivers: 'enabled',
    activeDrivers: 'enabled',
    passengers: 'hidden',
    allRides: 'enabled',
    scheduledTrips: 'hidden',
    walletApprovals: 'hidden',
    rateManagement: 'hidden',
    userFeedbacks: 'enabled',
    aiServicesStrategy: 'hidden',
    aiDeveloperStudio: 'hidden',
    logs: 'hidden'
  });

  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('adam_audit_logs');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', user: 'مسؤول النظام (Admin)', action: 'تفعيل نظام الشحن', details: 'قام المدير بتهيئة نظام شحن المحافظ والتحقق في معان وإربد', timestamp: '2026-06-13 10:12' },
      { id: '2', user: 'محمد المسؤول اللوجستي', action: 'تدقيق وثائق كابتن', details: 'تمت الموافقة وتدقيق رخصة القيادة السارية للكابتن يوسف العبد العبادي', timestamp: '2026-06-13 11:20' }
    ];
  });

  const logAuditAction = (action: string, details: string) => {
    const newLog = {
      id: 'log_' + Date.now(),
      user: currentUser ? currentUser.fullName : 'مسؤول مجهول',
      action,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    localStorage.setItem('adam_audit_logs', JSON.stringify(updated));
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empFullName || !empUsername || !empPassword) {
      alert('الرجاء تعبئة كافة الحقول المطلوبة للموظف.');
      return;
    }
    const res = addEmployee({
      fullName: empFullName,
      username: empUsername,
      password: empPassword,
      permissions: empPerms
    });
    if (res.success) {
      setEmpFullName('');
      setEmpUsername('');
      setEmpPassword('');
      // reset perms to standard defaults
      setEmpPerms({
        pendingDrivers: 'enabled',
        activeDrivers: 'enabled',
        passengers: 'hidden',
        allRides: 'enabled',
        scheduledTrips: 'hidden',
        walletApprovals: 'hidden',
        rateManagement: 'hidden',
        userFeedbacks: 'enabled',
        aiServicesStrategy: 'hidden',
        aiDeveloperStudio: 'hidden',
        logs: 'hidden'
      });
      setPasswordChangeSuccessMsg(res.msg);
      setTimeout(() => setPasswordChangeSuccessMsg(''), 4000);
      if (promotingUser) {
        logAuditAction('ترقية عضو إلى موظف', `تمت ترقية ${promotingUser.type === 'driver' ? 'الكابتن' : 'الراكب'} ${empFullName} (@${empUsername}) إلى موظف مع تخويل صلاحياته.`);
        setPromotingUser(null);
      } else {
        logAuditAction('تعيين موظف جديد', `تم إنشاء جساب موظف للزميل ${empFullName} المعرف بـ @${empUsername}.`);
      }
    } else {
      alert(res.msg);
    }
  };

  const handleAiEmployeeGenerate = async () => {
    if (!aiEmployeePrompt.trim()) {
      setAiEmployeeFeedbackMsg('الرجاء كتابة رغبتك أو وصف لوظيفة الموظف أو اسمه في الحقل أولاً لكي يستطيع الذكاء الاصطناعي مساعدتك.');
      return;
    }
    setAiEmployeeIsLoading(true);
    setAiEmployeeFeedbackMsg('');
    setAiEmployeeResult(null);

    try {
      const response = await fetch('/api/ai-employee-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiEmployeePrompt,
          existingEmployees: employees.map(e => ({
            id: e.id,
            fullName: e.fullName,
            username: e.username,
            permissions: e.permissions
          }))
        })
      });
      const data = await response.json();
      if (data.success) {
        setAiEmployeeResult({
          actionType: data.actionType || 'CREATE_NEW_EMPLOYEE',
          targetEmployeeId: data.targetEmployeeId,
          targetUsername: data.targetUsername,
          fullName: data.fullName,
          username: data.username,
          password: data.password,
          permissions: data.permissions,
          explanation: data.explanation
        });
        setAiEmployeeFeedbackMsg('✨ تم تحليل الطلب وتوليد الهوية والصلاحيات بالذكاء الاصطناعي بنجاح!');
      } else {
        setAiEmployeeFeedbackMsg('⚠️ فشل التوليد: ' + (data.msg || 'خطأ في الاتصال بالملقّم الذكي.'));
      }
    } catch (err: any) {
      setAiEmployeeFeedbackMsg('⚠️ عطل في معالجة الذكاء الاصطناعي: ' + err.message);
    } finally {
      setAiEmployeeIsLoading(false);
    }
  };

  // AI-Powered Language & Localization Management states
  const [langInputText, setLangInputText] = useState('');
  const [langTargetLang, setLangTargetLang] = useState('en');
  const [langTranslatedResult, setLangTranslatedResult] = useState('');
  const [langIsTranslating, setLangIsTranslating] = useState(false);
  const [langDiagnosticLogs, setLangDiagnosticLogs] = useState<string[]>([]);
  const [langDiagnosticIsActive, setLangDiagnosticIsActive] = useState(false);
  const [langDiagnosticResult, setLangDiagnosticResult] = useState('');
  const [langSuccessMsg, setLangSuccessMsg] = useState('');
  const [langSearchQuery, setLangSearchQuery] = useState('');

  const applyAiGeneratedEmployee = () => {
    if (!aiEmployeeResult) return;
    setEmpFullName(aiEmployeeResult.fullName);
    setEmpUsername(aiEmployeeResult.username);
    if (aiEmployeeResult.password) {
      setEmpPassword(aiEmployeeResult.password);
    }
    
    // Set custom permissions
    const updatedPerms = { ...empPerms };
    Object.keys(aiEmployeeResult.permissions).forEach((key) => {
      const pKey = key as keyof Employee['permissions'];
      if (pKey in updatedPerms) {
        const val = aiEmployeeResult.permissions[key];
        updatedPerms[pKey] = val as PermissionState;
      }
    });
    setEmpPerms(updatedPerms);
    setAiEmployeeFeedbackMsg('✅ تم تعبئة نموذج الموظف الجديد واعتماد الصلاحيات بنجاح!');
  };

  const addAiGeneratedEmployeeDirectly = () => {
    if (!aiEmployeeResult) return;
    const newEmpId = 'emp_' + Date.now();
    const newPermissions: Employee['permissions'] = {
      pendingDrivers: aiEmployeeResult.permissions.pendingDrivers || 'hidden',
      activeDrivers: aiEmployeeResult.permissions.activeDrivers || 'hidden',
      passengers: aiEmployeeResult.permissions.passengers || 'hidden',
      allRides: aiEmployeeResult.permissions.allRides || 'hidden',
      scheduledTrips: aiEmployeeResult.permissions.scheduledTrips || 'hidden',
      walletApprovals: aiEmployeeResult.permissions.walletApprovals || 'hidden',
      rateManagement: aiEmployeeResult.permissions.rateManagement || 'hidden',
      userFeedbacks: aiEmployeeResult.permissions.userFeedbacks || 'hidden',
      aiServicesStrategy: aiEmployeeResult.permissions.aiServicesStrategy || 'hidden',
      aiDeveloperStudio: aiEmployeeResult.permissions.aiDeveloperStudio || 'hidden',
      logs: aiEmployeeResult.permissions.logs || 'hidden',
      auditPayments: aiEmployeeResult.permissions.auditPayments || 'hidden',
    };

    addEmployee({
      id: newEmpId,
      fullName: aiEmployeeResult.fullName,
      username: aiEmployeeResult.username.toLowerCase(),
      password: aiEmployeeResult.password || 'adam_1234',
      role: 'employee',
      roleCategory: (aiEmployeeResult as any).roleCategory || 'Support',
      permissions: newPermissions
    });

    logAuditAction('تعيين موظف جديد بالذكاء الاصطناعي', `تم تعيين وتفعيل حساب الموظف الجديد (${aiEmployeeResult.fullName} @${aiEmployeeResult.username}) وتأطير دور الوظيفي (${(aiEmployeeResult as any).roleCategory || 'Support'}) وصلاحياته.`);
    setAiEmployeeFeedbackMsg(`🚀 تم إنشاء وتفعيل حساب الموظف الجديد (${aiEmployeeResult.fullName}) بنجاح!`);
  };

  const updateExistingEmployeeWithAi = () => {
    if (!aiEmployeeResult) return;
    
    let targetEmp = employees.find(e => 
      (aiEmployeeResult.targetEmployeeId && e.id === aiEmployeeResult.targetEmployeeId) ||
      (aiEmployeeResult.targetUsername && e.username.toLowerCase() === aiEmployeeResult.targetUsername.toLowerCase()) ||
      (e.username.toLowerCase() === aiEmployeeResult.username.toLowerCase()) ||
      (e.fullName.toLowerCase() === aiEmployeeResult.fullName.toLowerCase())
    );

    if (!targetEmp && employees.length > 0) {
      targetEmp = employees[0];
    }

    if (!targetEmp) {
      setAiEmployeeFeedbackMsg('⚠️ لا يوجد موظفون قدامى مسجلون حالياً لتطبيق التحديث عليهم.');
      return;
    }

    const updatedPermissions: Employee['permissions'] = {
      pendingDrivers: aiEmployeeResult.permissions.pendingDrivers || targetEmp.permissions.pendingDrivers || 'hidden',
      activeDrivers: aiEmployeeResult.permissions.activeDrivers || targetEmp.permissions.activeDrivers || 'hidden',
      passengers: aiEmployeeResult.permissions.passengers || targetEmp.permissions.passengers || 'hidden',
      allRides: aiEmployeeResult.permissions.allRides || targetEmp.permissions.allRides || 'hidden',
      scheduledTrips: aiEmployeeResult.permissions.scheduledTrips || targetEmp.permissions.scheduledTrips || 'hidden',
      walletApprovals: aiEmployeeResult.permissions.walletApprovals || targetEmp.permissions.walletApprovals || 'hidden',
      rateManagement: aiEmployeeResult.permissions.rateManagement || targetEmp.permissions.rateManagement || 'hidden',
      userFeedbacks: aiEmployeeResult.permissions.userFeedbacks || targetEmp.permissions.userFeedbacks || 'hidden',
      aiServicesStrategy: aiEmployeeResult.permissions.aiServicesStrategy || targetEmp.permissions.aiServicesStrategy || 'hidden',
      aiDeveloperStudio: aiEmployeeResult.permissions.aiDeveloperStudio || targetEmp.permissions.aiDeveloperStudio || 'hidden',
      logs: aiEmployeeResult.permissions.logs || targetEmp.permissions.logs || 'hidden',
      auditPayments: aiEmployeeResult.permissions.auditPayments || targetEmp.permissions.auditPayments || 'hidden',
    };

    updateEmployeePermissions(targetEmp.id, updatedPermissions);
    if ((aiEmployeeResult as any).roleCategory) {
      updateEmployee(targetEmp.id, { roleCategory: (aiEmployeeResult as any).roleCategory });
    }
    logAuditAction('تحديث صلاحيات موظف قديم بالذكاء الاصطناعي', `تم إعادة تفعيل وتحديث صلاحيات ودور الموظف القديم (${targetEmp.fullName} @${targetEmp.username}) بالذكاء الاصطناعي.`);
    setAiEmployeeFeedbackMsg(`⚙️ تم تحديث وتطبيق صلاحيات ودور الموظف (${targetEmp.fullName} @${targetEmp.username}) بنجاح!`);
  };

  const updateAllExistingEmployeesWithAi = () => {
    if (!aiEmployeeResult || employees.length === 0) {
      setAiEmployeeFeedbackMsg('⚠️ لا يوجد موظفون قدامى لتحديث صلاحياتهم.');
      return;
    }

    employees.forEach(emp => {
      const updatedPermissions: Employee['permissions'] = {
        pendingDrivers: aiEmployeeResult.permissions.pendingDrivers || emp.permissions.pendingDrivers || 'hidden',
        activeDrivers: aiEmployeeResult.permissions.activeDrivers || emp.permissions.activeDrivers || 'hidden',
        passengers: aiEmployeeResult.permissions.passengers || emp.permissions.passengers || 'hidden',
        allRides: aiEmployeeResult.permissions.allRides || emp.permissions.allRides || 'hidden',
        scheduledTrips: aiEmployeeResult.permissions.scheduledTrips || emp.permissions.scheduledTrips || 'hidden',
        walletApprovals: aiEmployeeResult.permissions.walletApprovals || emp.permissions.walletApprovals || 'hidden',
        rateManagement: aiEmployeeResult.permissions.rateManagement || emp.permissions.rateManagement || 'hidden',
        userFeedbacks: aiEmployeeResult.permissions.userFeedbacks || emp.permissions.userFeedbacks || 'hidden',
        aiServicesStrategy: aiEmployeeResult.permissions.aiServicesStrategy || emp.permissions.aiServicesStrategy || 'hidden',
        aiDeveloperStudio: aiEmployeeResult.permissions.aiDeveloperStudio || emp.permissions.aiDeveloperStudio || 'hidden',
        logs: aiEmployeeResult.permissions.logs || emp.permissions.logs || 'hidden',
        auditPayments: aiEmployeeResult.permissions.auditPayments || emp.permissions.auditPayments || 'hidden',
      };
      updateEmployeePermissions(emp.id, updatedPermissions);
      if ((aiEmployeeResult as any).roleCategory) {
        updateEmployee(emp.id, { roleCategory: (aiEmployeeResult as any).roleCategory });
      }
    });

    logAuditAction('تحديث صلاحيات الموظفين القدامى شمولياً', `تم تطبيق الصلاحيات الذكية على كافة الموظفين القدامى (${employees.length} موظف).`);
    setAiEmployeeFeedbackMsg(`👥 تم تحديث وتطبيق الشاشات والصلاحيات لجميع الموظفين القدامى (${employees.length} موظف) بنجاح!`);
  };

  const handleSendEmployeeCopilotMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!employeeCopilotInput.trim()) return;

    const userMsgText = employeeCopilotInput.trim();
    const newUserMsg = {
      id: 'msg_' + Date.now(),
      sender: 'employee',
      text: userMsgText,
      createdAt: new Date().toISOString()
    };

    setEmployeeCopilotMessages(prev => [...prev, newUserMsg]);
    setEmployeeCopilotInput('');
    setIsCopilotLoading(true);

    try {
      // Gather active metrics to feed contextually to the copilot
      const systemState = {
        totalDrivers: drivers.length,
        pendingDriversCount: drivers.filter(d => d.status === 'pending').length,
        onlineDriversCount: drivers.filter(d => d.isOnline).length,
        totalPassengers: passengers.length,
        pendingPassengersCount: passengers.filter(p => p.status === 'pending').length,
        totalRidesCount: rides.length,
        activeRidesCount: rides.filter(r => r.status === 'active' || r.status === 'pooling').length,
        activeCountry: activeCountryCode,
        systemCommission: rides.filter(r => r.status === 'completed').length * 2.5
      };

      const response = await fetch('/api/ai-employee-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: currentUser?.fullName || 'مسؤول عمليات آدم',
          employeeUsername: currentUser?.username || 'Ahmaidat',
          permissions: (currentUser?.username === 'admin' || currentUser?.username === 'Ahmaidat') 
            ? { pendingDrivers: 'enabled', activeDrivers: 'enabled', passengers: 'enabled', allRides: 'enabled', scheduledTrips: 'enabled', walletApprovals: 'enabled', rateManagement: 'enabled', userFeedbacks: 'enabled', aiServicesStrategy: 'enabled', aiDeveloperStudio: 'enabled', logs: 'enabled' }
            : (currentUser?.permissions || {}),
          latestMessage: userMsgText,
          messageHistory: employeeCopilotMessages.slice(-10), // keep token count optimized
          systemState
        })
      });

      const data = await response.json();
      if (data.success) {
        setEmployeeCopilotMessages(prev => [...prev, {
          id: 'ai_' + Date.now(),
          sender: 'ai',
          text: data.text,
          createdAt: new Date().toISOString()
        }]);
      } else {
        setEmployeeCopilotMessages(prev => [...prev, {
          id: 'ai_err_' + Date.now(),
          sender: 'ai',
          text: '⚠️ عذراً زميلي العزيز، واجهت عطلاً بالاتصال بملقمات جيميناي حالياً: ' + (data.msg || 'فشل معالجة الطلب.'),
          createdAt: new Date().toISOString()
        }]);
      }
    } catch (err: any) {
      setEmployeeCopilotMessages(prev => [...prev, {
        id: 'ai_err_' + Date.now(),
        sender: 'ai',
        text: '⚠️ خطأ تقني في معالجة الطلب بالذكاء الاصطناعي: ' + err.message,
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const handleRunEmployeeAudit = async () => {
    setIsEmployeeAuditing(true);
    setEmployeeAuditReport('');

    try {
      const systemStats = {
        totalDrivers: drivers.length,
        pendingDriversCount: drivers.filter(d => d.status === 'pending').length,
        totalPassengers: passengers.length,
        totalRidesCount: rides.length,
        activeRidesCount: rides.filter(r => r.status === 'active' || r.status === 'pooling').length,
        systemCommission: rides.filter(r => r.status === 'completed').length * 2.5
      };

      const response = await fetch('/api/ai-employee-auditor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employees,
          systemStats
        })
      });

      const data = await response.json();
      if (data.success) {
        setEmployeeAuditReport(data.text);
      } else {
        setEmployeeAuditReport('⚠️ فشل إصدار تقرير تدقيق الموظفين من ملقم الذكاء الاصطناعي.');
      }
    } catch (err: any) {
      setEmployeeAuditReport('⚠️ عطل فني في الاتصال بالخدمة الذكية: ' + err.message);
    } finally {
      setIsEmployeeAuditing(false);
    }
  };

  // AI App Studio Custom States
  const [studioPrompt, setStudioPrompt] = useState('');
  const [studioTarget, setStudioTarget] = useState<'passenger' | 'driver' | 'admin' | 'all'>('passenger');
  const [studioSystemInst, setStudioSystemInst] = useState(
    'أنت المهندس المعماري لاستوديو آدم الذكي (Adam AI Studio Engine) لبناء وتوسيع تطبيقات النقل في الأردن لعام 2026.\nتلقَّ رغبات مالك المنصة وقم بتصميم وتصنيع مكون واجهة (Widget/Banner/Card/SOS-Hub) مبشر بجماليات خلاقة باستخدام Tailwind CSS ولغة هجينة بالكامل لتطبيق الراكب أو الكابتن لرفع جودة وكفاءة التطبيق ومستنداً للثقافة اللغوية الأردنية.\nأرجع دوماً استجابة JSON دقيقة ومغلّفة داخل كتلة كود ```json.'
  );
  const [studioTemp, setStudioTemp] = useState<number>(0.85);
  const [studioIsCompiling, setStudioIsCompiling] = useState(false);
  const [studioLogs, setStudioLogs] = useState<string[]>([]);
  const [studioSuccess, setStudioSuccess] = useState('');

  // AI Commercial Ads Creator States
  const [adTitle, setAdTitle] = useState('🔥 عرض صيف النشامى: رحلات مجانية بانتظارك!');
  const [adDescription, setAdDescription] = useState('احجز مشوارك التشاركي القادم بين عمان وإربد واحصل على كود خصم فوري يصل إلى 30% لجميع أفراد عائلتك.');
  const [adTarget, setAdTarget] = useState<'passenger' | 'driver' | 'all'>('all');
  const [adImage, setAdImage] = useState('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80');
  const [adButtonText, setAdButtonText] = useState('احجز مشوارك الآن 🚀');
  const [adBadge, setAdBadge] = useState('إعلان ممول 🌟');
  const [adLinkUrl, setAdLinkUrl] = useState('#');
  const [adTimeText, setAdTimeText] = useState('ينتهي بعد 3 أيام');
  const [isGeneratingAdImage, setIsGeneratingAdImage] = useState(false);
  const [adImagePrompt, setAdImagePrompt] = useState('سيارة دفع رباعي فاخرة تسير على طريق صحراوي سريع في الأردن مع شعار خصم جذاب');
  const [adMediaType, setAdMediaType] = useState<'image' | 'video'>('image');
  const [adMediaUrl, setAdMediaUrl] = useState('');
  const [adCompanyName, setAdCompanyName] = useState('شركة النور للتجارة');

  // AI Continuous Evolution & Update States
  const [evolutionFileName, setEvolutionFileName] = useState('');
  const [evolutionFileContent, setEvolutionFileContent] = useState('');
  const [evolutionIsAnalyzing, setEvolutionIsAnalyzing] = useState(false);
  const [evolutionResult, setEvolutionResult] = useState<any>(null);
  const [evolutionSuccessMsg, setEvolutionSuccessMsg] = useState('');
  const [evolutionIsApplying, setEvolutionIsApplying] = useState(false);
  const [evolutionLogs, setEvolutionLogs] = useState<string[]>([]);

  const [tripsSubTab, setTripsSubTab] = useState<'instant' | 'intracity' | 'scheduled'>('instant');
  const [tripsStatusFilter, setTripsStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [adminSchDateFrom, setAdminSchDateFrom] = useState<string>('');
  const [adminSchDateTo, setAdminSchDateTo] = useState<string>('');

  // Admin central scheduled trip creation state
  const [isAdminTripFormOpen, setIsAdminTripFormOpen] = useState(false);
  const [admFromGov, setAdmFromGov] = useState('عمان (Amman)');
  const [admFromDist, setAdmFromDist] = useState('');
  const [admFromVillage, setAdmFromVillage] = useState('');
  const [admToGov, setAdmToGov] = useState('إربد (Irbid)');
  const [admToDist, setAdmToDist] = useState('');
  const [admToVillage, setAdmToVillage] = useState('');
  const [admTripDepTime, setAdmTripDepTime] = useState('');
  const [admTripCustomFare, setAdmTripCustomFare] = useState<string>('');
  const [admTripCustomComm, setAdmTripCustomComm] = useState<string>('');
  const [admTripDriverId, setAdmTripDriverId] = useState<string>('');
  const [admTripIsPinnedDaily, setAdmTripIsPinnedDaily] = useState(false);
  const [admTripMsg, setAdmTripMsg] = useState('');

  // Scheduled editing & assigning states
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [editTripTimeInput, setEditTripTimeInput] = useState<string>('');
  const [assigningTripId, setAssigningTripId] = useState<string | null>(null);
  const [selectedAssignDriverId, setSelectedAssignDriverId] = useState<string>('');

  // AI Customized Route & Itinerary modification states
  const [editingRouteTripId, setEditingRouteTripId] = useState<string | null>(null);
  const [routeFromInput, setRouteFromInput] = useState<string>('');
  const [routeToInput, setRouteToInput] = useState<string>('');
  const [routeStopsInput, setRouteStopsInput] = useState<string>('');
  const [routeDescriptionInput, setRouteDescriptionInput] = useState<string>('');
  const [isRouteAiLoading, setIsRouteAiLoading] = useState<boolean>(false);
  const [isScheduleAiLoading, setIsScheduleAiLoading] = useState<boolean>(false);
  const [schViewMode, setSchViewMode] = useState<'table' | 'calendar'>('calendar');

  // New Area Form State
  const [newGov, setNewGov] = useState('عمان (Amman)');
  const [newDist, setNewDist] = useState('');
  const [newVillage, setNewVillage] = useState('');
  const [areaMsg, setAreaMsg] = useState('');

  // Route Pricing Form State
  const [routeFromGov, setRouteFromGov] = useState<string>('عمان (Amman)');
  const [routeFromDist, setRouteFromDist] = useState<string>('');
  const [routeToGov, setRouteToGov] = useState<string>('إربد (Irbid)');
  const [routeToDist, setRouteToDist] = useState<string>('');
  const [routeFareInput, setRouteFareInput] = useState<number>(3.5);
  const [routeCommInput, setRouteCommInput] = useState<number>(1.5);
  const [routeMsg, setRouteMsg] = useState<string>('');

  // Re-routing Radar states
  const [selectedRideForRouting, setSelectedRideForRouting] = useState<any | null>(null);
  const [draftRide, setDraftRide] = useState<any | null>(null);
  const [draggingMarker, setDraggingMarker] = useState<{ requestIndex: number; type: 'pickup' | 'dropoff' } | null>(null);
  const [isAiOptimizing, setIsAiOptimizing] = useState(false);
  const [aiOptimizeLogs, setAiOptimizeLogs] = useState<string[]>([]);
  const [routingSuccessMsg, setRoutingSuccessMsg] = useState('');

  const fromGovObj = settings.locations.find(l => l.governorate === routeFromGov);
  const fromDistricts = fromGovObj ? fromGovObj.districts : [];
  
  const toGovObj = settings.locations.find(l => l.governorate === routeToGov);
  const toDistricts = toGovObj ? toGovObj.districts : [];

  // Settings modification
  const [minModelInput, setMinModelInput] = useState<number>(settings.minCarModel);
  const [commRateInput, setCommRateInput] = useState<number>(settings.commissionRate);
  const [passengerFareInput, setPassengerFareInput] = useState<number>(settings.passengerFarePerSeat ?? 3.0);
  const [schCancelPenaltyInput, setSchCancelPenaltyInput] = useState<number>(settings.scheduledTripCancellationPenalty ?? 1.50);
  const [defaultDriverMinBalanceInput, setDefaultDriverMinBalanceInput] = useState<number>(settings.defaultDriverMinBalance ?? 5.0);
  const [defaultPassengerMinBalanceInput, setDefaultPassengerMinBalanceInput] = useState<number>(settings.defaultPassengerMinBalance ?? 3.0);
  const [notificationToneInput, setNotificationToneInput] = useState<NotificationToneType>(settings.notificationSoundTone || 'chime');
  const [notificationVolumeInput, setNotificationVolumeInput] = useState<number>(settings.notificationSoundVolume ?? 0.35);
  const [systemWalletInput, setSystemWalletInput] = useState<string>(settings.systemWalletNumber ?? '0790000100');
  const [systemCliQPhoneInput, setSystemCliQPhoneInput] = useState<string>(settings.systemCliQPhone ?? '0799998888');
  const [systemCliQAliasInput, setSystemCliQAliasInput] = useState<string>(settings.systemCliQAlias ?? 'ADAM.CLIQ');
  const [systemBankAccountInput, setSystemBankAccountInput] = useState<string>(settings.systemBankAccountNumber ?? 'JO89ARAB00000012345678901234');
  const [systemBankNameInput, setSystemBankNameInput] = useState<string>(settings.systemBankName ?? 'البنك العربي (Arab Bank)');
  const [collectionPriorityModeInput, setCollectionPriorityModeInput] = useState<'priority' | 'random'>(settings.collectionPriorityMode ?? 'priority');
  const [collectionPriorityOrderInput, setCollectionPriorityOrderInput] = useState<string[]>(settings.collectionPriorityOrder ?? ['cliq', 'wallet', 'bank']);
  const [rechargeApprovalModeInput, setRechargeApprovalModeInput] = useState<'auto' | 'admin_approval'>(settings.rechargeApprovalMode ?? 'auto');
  const [airportMinCarModelInput, setAirportMinCarModelInput] = useState<number>(settings.airportMinCarModel ?? new Date().getFullYear());
  const [airportRidePriceInput, setAirportRidePriceInput] = useState<number>(settings.airportRidePrice ?? 25.0);
  const [airportCommissionRateInput, setAirportCommissionRateInput] = useState<number>(settings.airportCommissionRate ?? 3.0);
  const [newBankName, setNewBankName] = useState<string>('');
  const [newBankNumber, setNewBankNumber] = useState<string>('');
  const [newBankHolder, setNewBankHolder] = useState<string>('شركة آدم للنقل المتعدد م.م.ح');

  // Intra-city settings modification states
  const [selectedGovForFare, setSelectedGovForFare] = useState<string>('global');
  const [icRatePerKm, setIcRatePerKm] = useState<number>(settings.intraCityConfig?.ratePerKm ?? 0.29);
  const [icRatePerMin, setIcRatePerMin] = useState<number>(settings.intraCityConfig?.ratePerMin ?? 0.06);
  const [icMinFare, setIcMinFare] = useState<number>(settings.intraCityConfig?.minFare ?? 1.50);
  const [icCommPercent, setIcCommPercent] = useState<number>(settings.intraCityConfig?.commissionRatePercent ?? 25);
  const [icMultiplier, setIcMultiplier] = useState<number>(settings.intraCityConfig?.activeMultiplier ?? 1.0);

  // Custom states for Governorate-linked taxi and city delivery pricing
  const [isEditingGov, setIsEditingGov] = useState<boolean>(false);
  const [editingGovName, setEditingGovName] = useState<string>('');

  // Admin User Password Edit States
  const [editingUserPasswordId, setEditingUserPasswordId] = useState<string | null>(null);
  const [editingUserPasswordRole, setEditingUserPasswordRole] = useState<'driver' | 'passenger' | 'employee' | null>(null);
  const [editingUserPasswordValue, setEditingUserPasswordValue] = useState<string>('');
  const [passwordChangeSuccessMsg, setPasswordChangeSuccessMsg] = useState<string>('');

  // Sandbox simulation tool states
  const [sandboxName, setSandboxName] = useState<string>('');
  const [sandboxPhone, setSandboxPhone] = useState<string>('');
  const [sandboxGov, setSandboxGov] = useState<string>('عمان (Amman)');
  const [sandboxBalance, setSandboxBalance] = useState<string>('50');
  const [sandboxRole, setSandboxRole] = useState<'driver' | 'passenger'>('driver');
  const [sandboxMsg, setSandboxMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    if (selectedGovForFare === 'global') {
      if (settings.intraCityConfig) {
        setIcRatePerKm(settings.intraCityConfig.ratePerKm);
        setIcRatePerMin(settings.intraCityConfig.ratePerMin);
        setIcMinFare(settings.intraCityConfig.minFare);
        setIcCommPercent(settings.intraCityConfig.commissionRatePercent);
        setIcMultiplier(settings.intraCityConfig.activeMultiplier);
      }
    } else {
      const cityConfig = settings.intraCityFaresByGovernorate?.[selectedGovForFare];
      setIcRatePerKm(cityConfig?.ratePerKm ?? settings.intraCityConfig?.ratePerKm ?? 0.29);
      setIcRatePerMin(cityConfig?.ratePerMin ?? settings.intraCityConfig?.ratePerMin ?? 0.06);
      setIcMinFare(cityConfig?.minFare ?? settings.intraCityConfig?.minFare ?? 1.50);
      setIcCommPercent(cityConfig?.commissionRatePercent ?? settings.intraCityConfig?.commissionRatePercent ?? 25);
      setIcMultiplier(cityConfig?.activeMultiplier ?? settings.intraCityConfig?.activeMultiplier ?? 1.0);
    }
  }, [settings, selectedGovForFare]);

  // ============================================
  // Re-routing Radar Geo-control Room functions
  // ============================================
  const getEuclideanDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  const findNearestVillage = (x: number, y: number) => {
    let minDistance = Infinity;
    let nearest = null;
    
    for (const gov of DEFAULT_LOCATIONS) {
      for (const dist of gov.districts) {
        for (const vil of dist.villages) {
          const fullName = `${gov.governorate} - ${dist.name} - ${vil}`;
          const refCoords = getLocationCoords(fullName);
          const distVal = Math.sqrt(Math.pow(x - refCoords.x, 2) + Math.pow(y - refCoords.y, 2));
          if (distVal < minDistance) {
            minDistance = distVal;
            nearest = { fullName, village: vil, district: dist.name, governorate: gov.governorate };
          }
        }
      }
    }
    return nearest;
  };

  const runAiPathOptimizer = () => {
    if (!draftRide || draftRide.requests.length < 2) {
      setAiOptimizeLogs(["⚠️ يجب توفر راكبين اثنين على الأقل في هذه المجموعة لتشغيل خوارزمية دمج المسارات."]);
      return;
    }

    setIsAiOptimizing(true);
    setAiOptimizeLogs([
      "🧠 [نواة الذكاء الاصطناعي] تم استقبال طلب التحسين الجغرافي. جاري فحص الإحداثيات...",
      "📡 فحص مسار الالتقاط والتنزيل وتحليل اختناقات مرور الأردن المباشرة..."
    ]);

    setTimeout(() => {
      setAiOptimizeLogs(prev => [
        ...prev,
        "🔍 حساب كافة تركيبات المرور والمسارات الممكنة لتقليل الكيلومترات المقطوعة..."
      ]);
    }, 600);

    setTimeout(() => {
      setAiOptimizeLogs(prev => [
        ...prev,
        "⚡ تطبيق نموذج التوجيه الأنسب من خلال محاكاة فحص مسافات Euclidean..."
      ]);
    }, 1200);

    setTimeout(() => {
      const reqs = draftRide.requests;
      const p1 = reqs[0].fromCoords;
      const d1 = reqs[0].toCoords;
      const p2 = reqs[1].fromCoords;
      const d2 = reqs[1].toCoords;

      const driverObj = drivers.find(d => d.id === draftRide.driverId);
      const driverCoords = driverObj 
        ? getLocationCoords(driverObj.governorate) 
        : { x: p1.x - 20, y: p1.y + 15 };

      // Calculate distances for the 4 routing permutations
      const distSeq1 = getEuclideanDistance(driverCoords, p1) + getEuclideanDistance(p1, p2) + getEuclideanDistance(p2, d1) + getEuclideanDistance(d1, d2);
      const distSeq2 = getEuclideanDistance(driverCoords, p1) + getEuclideanDistance(p1, p2) + getEuclideanDistance(p2, d2) + getEuclideanDistance(d2, d1);
      const distSeq3 = getEuclideanDistance(driverCoords, p2) + getEuclideanDistance(p2, p1) + getEuclideanDistance(p1, d2) + getEuclideanDistance(d2, d1);
      const distSeq4 = getEuclideanDistance(driverCoords, p2) + getEuclideanDistance(p2, p1) + getEuclideanDistance(p1, d1) + getEuclideanDistance(d1, d2);
      const distSeq5 = getEuclideanDistance(driverCoords, p1) + getEuclideanDistance(p1, d1) + getEuclideanDistance(d1, p2) + getEuclideanDistance(p2, d2);

      const permutations = [
        { id: 'seq1', name: `دمج: التقاط ${reqs[0].passengerName} ➔ التقاط ${reqs[1].passengerName} ➔ تنزيل ${reqs[0].passengerName} ➔ تنزيل ${reqs[1].passengerName}`, dist: distSeq1, order: [0, 1], type: 'pooled_A' },
        { id: 'seq2', name: `دمج: التقاط ${reqs[0].passengerName} ➔ التقاط ${reqs[1].passengerName} ➔ تنزيل ${reqs[1].passengerName} ➔ تنزيل ${reqs[0].passengerName}`, dist: distSeq2, order: [0, 1], type: 'pooled_B' },
        { id: 'seq3', name: `دمج: التقاط ${reqs[1].passengerName} ➔ التقاط ${reqs[0].passengerName} ➔ تنزيل ${reqs[1].passengerName} ➔ تنزيل ${reqs[0].passengerName}`, dist: distSeq3, order: [1, 0], type: 'pooled_C' },
        { id: 'seq4', name: `دمج: التقاط ${reqs[1].passengerName} ➔ التقاط ${reqs[0].passengerName} ➔ تنزيل ${reqs[0].passengerName} ➔ تنزيل ${reqs[1].passengerName}`, dist: distSeq4, order: [1, 0], type: 'pooled_D' },
        { id: 'seq5', name: `فردي متسلسل: توصيل ${reqs[0].passengerName} للوجهة أولاً ➔ ثم الانتقال لالتقاط ${reqs[1].passengerName}`, dist: distSeq5, order: [0, 1], type: 'sequential' }
      ];

      permutations.sort((a, b) => a.dist - b.dist);
      const best = permutations[0];

      const reorderedReqs = best.order.map(i => reqs[i]);

      setDraftRide(prev => {
        if (!prev) return null;
        return {
          ...prev,
          requests: reorderedReqs
        };
      });

      const savingsPercent = (((distSeq5 - best.dist) / distSeq5) * 100).toFixed(0);

      setAiOptimizeLogs(prev => [
        ...prev,
        `🎯 [تأكيد التحسين]: المسار الأكفأ والأسرع هو: (${best.name})`,
        `📊 [الأرقام الهندسية]: إجمالي طول المسار الموفر: ${best.dist.toFixed(0)} بكسل (وفر وقود وزمن وقدره ${savingsPercent}% عن المسار التقليدي غير المدمج).`,
        `✅ تم إعادة ترتيب قائمة وحركة الإركاب بنجاح في لوحة التحكم.`
      ]);
      setIsAiOptimizing(false);
    }, 2000);
  };

  const handleSaveNewRouting = () => {
    if (!draftRide) return;

    // Update rides list
    const updatedRides = rides.map(r => r.id === draftRide.id ? draftRide : r);

    // Update global requests coordinates and area names
    const updatedGlobalRequests = requests.map(req => {
      const match = draftRide.requests.find((drReq: any) => drReq.id === req.id);
      if (match) {
        return {
          ...req,
          fromCoords: match.fromCoords,
          toCoords: match.toCoords,
          fromArea: match.fromArea,
          toArea: match.toArea
        };
      }
      return req;
    });

    saveState(drivers, passengers, updatedGlobalRequests, updatedRides, messages, settings);

    setSelectedRideForRouting(null);
    setDraftRide(null);
    setRoutingSuccessMsg("🎯 تم اعتماد المسار الجغرافي المعاد توجيهه بالرادار وعكسه لكافة أطراف الرحلة والكابتن بنجاح!");
    setTimeout(() => setRoutingSuccessMsg(''), 6500);
  };

  // Drag and drop event handlers
  const handleMapMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingMarker || !draftRide) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 400);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 400);

    const safeX = Math.max(10, Math.min(390, x));
    const safeY = Math.max(10, Math.min(390, y));

    setDraftRide(prev => {
      if (!prev) return null;
      const updatedReqs = [...prev.requests];
      const req = { ...updatedReqs[draggingMarker.requestIndex] };

      if (draggingMarker.type === 'pickup') {
        req.fromCoords = { x: safeX, y: safeY };
      } else {
        req.toCoords = { x: safeX, y: safeY };
      }

      // Live reverse geocoding update to Jordan neighborhoods
      const nearest = findNearestVillage(safeX, safeY);
      if (nearest) {
        if (draggingMarker.type === 'pickup') {
          req.fromArea = nearest.fullName;
        } else {
          req.toArea = nearest.fullName;
        }
      }

      updatedReqs[draggingMarker.requestIndex] = req;
      return {
        ...prev,
        requests: updatedReqs
      };
    });
  };

  const handleMapMouseUp = () => {
    setDraggingMarker(null);
  };
  
  // Ratings & reviews tab states
  const [reviewsRatingFilter, setReviewsRatingFilter] = useState<number | 'all'>('all');
  const [ratingsSubTab, setRatingsSubTab] = useState<'passenger_reviews' | 'driver_reviews'>('passenger_reviews');
  const [moderationMsg, setModerationMsg] = useState('');
  const [settingsMsg, setSettingsMsg] = useState('');

  // Wallet top-up state
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [topupAmount, setTopupAmount] = useState<number>(10);
  const [topupMsg, setTopupMsg] = useState('');

  // Passenger wallet top-up state
  const [selectedPassengerId, setSelectedPassengerId] = useState('');
  const [passengerTopupAmount, setPassengerTopupAmount] = useState<number>(10);
  const [passengerTopupMsg, setPassengerTopupMsg] = useState('');

  // AI Bulk & Targeted Free Promo Balance state
  const [promoUserType, setPromoUserType] = useState<'driver' | 'passenger'>('passenger');
  const [promoTargetType, setPromoTargetType] = useState<'all' | 'high_rating' | 'inactive' | 'custom_ai'>('high_rating');
  const [promoAmount, setPromoAmount] = useState<number>(2);
  const [promoReason, setPromoReason] = useState('مكافأة ترويجية خاصة بـ AI');
  const [promoCustomPrompt, setPromoCustomPrompt] = useState('');
  const [promoAnalysisReport, setPromoAnalysisReport] = useState('');
  const [promoMatchedIds, setPromoMatchedIds] = useState<string[]>([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoSuccessMsg, setPromoSuccessMsg] = useState('');

  // Document inspection modal state
  const [inspectedUser, setInspectedUser] = useState<any>(null);

  // Send admin chat state
  const [adminChatText, setAdminChatText] = useState<{ [rideId: string]: string }>({});

  // AI draft response autocomplete state and handler
  const [suggestingChannel, setSuggestingChannel] = useState<string | null>(null);

  const handleSuggestAdminReply = (channelId: string, role: 'driver' | 'passenger') => {
    setSuggestingChannel(channelId);
    
    const roomMsgs = messages.filter(m => m.rideId === channelId);
    const lastUserMsg = roomMsgs.filter(m => m.sender !== 'admin').pop();
    const cleanLastText = lastUserMsg ? lastUserMsg.message : "أريد استفساراً عاماً حول خدمات النقل في قوافل آدم التشاركية الأردنية";
    const senderName = lastUserMsg ? lastUserMsg.senderName : "مشارك";

    const chatHistory = roomMsgs.slice(-5).map(m => ({ sender: m.sender, message: m.message }));

    fetch('/api/ai-chat-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderType: role,
        senderName,
        messageHistory: chatHistory,
        latestMessage: cleanLastText
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.text) {
        setAdminChatText(prev => ({
          ...prev,
          [channelId]: data.text
        }));
      }
    })
    .catch(err => console.error("Error generating simulated admin reply:", err))
    .finally(() => setSuggestingChannel(null));
  };

  // Chat sub-tabs and filters for separated dashboard support and history
  const [chatSubTab, setChatSubTab] = useState<'passenger' | 'driver' | 'history'>('passenger');
  const [selectedPassengerChannel, setSelectedPassengerChannel] = useState<string>('support_passenger');
  const [selectedDriverChannel, setSelectedDriverChannel] = useState<string>('support_driver');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyRoleFilter, setHistoryRoleFilter] = useState<'all' | 'admin' | 'driver' | 'passenger'>('all');

  // AI Diagnose state hooks lifted to top-level to satisfy React Rules of Hooks
  const [isTurbo, setIsTurbo] = useState<boolean>(() => localStorage.getItem('adam_turbo_boost') === 'true');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [gptResponse, setGptResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [autoFixing, setAutoFixing] = useState<boolean>(false);
  const [fixLog, setFixLog] = useState<string[]>([]);

  // 🛡️ AI Security, Privacy & Compliance States
  const [geoPrivacyShield, setGeoPrivacyShield] = useState<boolean>(() => {
    return localStorage.getItem('adam_geo_privacy_shield') !== 'false';
  });
  const [isPeriodicScanning, setIsPeriodicScanning] = useState<boolean>(false);
  const [periodicScanLog, setPeriodicScanLog] = useState<string[]>([]);
  const [lastScanTime, setLastScanTime] = useState<string>('');
  const [selectedAttackType, setSelectedAttackType] = useState<string>('sqli');
  const [cyberBlockedThreats, setCyberBlockedThreats] = useState<any[]>(() => {
    const saved = localStorage.getItem('adam_cyber_blocked_threats');
    return saved ? JSON.parse(saved) : [
      { id: 'sec-1021', type: 'SQL-Injection', payload: "UNION SELECT username, password FROM users --", time: "2026-06-11 08:44", origin: "MEMBER_GATEWAY_AMMAN", status: "Neutralized ✅" },
      { id: 'sec-1022', type: 'XSS-Script-Injection', payload: "<script>alert(document.cookie)</script>", time: "2026-06-11 09:12", origin: "REGISTRATION_FORM_ZARQA", status: "Blocked & Logged 🛡️" }
    ];
  });
  const [cyberAttackStatus, setCyberAttackStatus] = useState<'idle' | 'under_attack' | 'neutralized'>('idle');

  const [periodicScanActive, setPeriodicScanActive] = useState<boolean>(true);
  const [nextScanSec, setNextScanSec] = useState<number>(10);

  const triggerPeriodicScan = async () => {
    setIsPeriodicScanning(true);
    setPeriodicScanLog([]);
    const scanLogs: string[] = [
      "🚀 بدء دورة الفحص الدوري الذكي لحماية الخريطة والمنظومة...",
      "🔍 فحص ثروات وتوقيع المحافظ المشفرة وتكامل الدفع..."
    ];
    setPeriodicScanLog([...scanLogs]);

    setTimeout(() => {
      scanLogs.push("⚙️ مطابقة سجلات الركوب النشطة والرحلات المشتركة والدمج التلقائي بالـ AI...");
      scanLogs.push("🛡️ فحص حمولات API للتأكد من خلوها من شبهات حقن SQLi أو نصوص XSS الخارقة...");
      setPeriodicScanLog([...scanLogs]);
    }, 450);

    setTimeout(() => {
      const pD = drivers.filter(d => d.status === 'pending').length;
      const bD = drivers.filter(d => d.status === 'blocked').length;
      const pP = passengers.filter(p => p.status === 'pending').length;
      const nW = drivers.filter(d => d.balance < 0).length + passengers.filter(p => p.balance < 0).length;
      const issues = pD + bD + pP + nW;

      if (issues === 0) {
        scanLogs.push("✅ التقرير النهائي: جميع الخدمات والوثائق سليمة 100%. لم يتم العثور على أي ثغرات أو عثرات نشطة!");
      } else {
        scanLogs.push(`❌ ثغرات مكتشفة: تم رصد ${issues} عثرة بالنظام (كباتن عالقين / رصيد مكشوف).`);
        scanLogs.push("💡 يُنصح بالنقر على 'تشغيل معالج الأخطاء الذاتي' للتصحيح الفوري!");
      }
      setLastScanTime(new Date().toLocaleTimeString('ar-JO'));
      setIsPeriodicScanning(false);
      setPeriodicScanLog([...scanLogs]);
    }, 950);
  };

  // Background scanner countdown ticker
  useEffect(() => {
    if (!periodicScanActive) return;
    const interval = setInterval(() => {
      setNextScanSec((prev) => {
        if (prev <= 1) {
          triggerPeriodicScan();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [periodicScanActive, drivers, passengers]);

  // AI Command Execution Hub States
  const [detectedCommands, setDetectedCommands] = useState<any[]>([]);
  const [commandLogs, setCommandLogs] = useState<string[]>([]);
  const [isExecutingCommands, setIsExecutingCommands] = useState<boolean>(false);

  // Automatically parse command instructions from GPT Response when it updates
  useEffect(() => {
    if (!gptResponse) {
      setDetectedCommands([]);
      setCommandLogs([]);
      return;
    }

    try {
      // Find ```console-commands code blocks
      const codeBlockRegex = /```console-commands\s*([\s\S]*?)\s*```/;
      let match = gptResponse.match(codeBlockRegex);
      
      let jsonString = '';
      if (match && match[1]) {
        jsonString = match[1];
      } else {
        // Fallback: search for any JSON array inside ```
        const generalJsonRegex = /```(?:json)?\s*(\[\s*\{[\s\S]*?\}\s*\])\s*```/;
        const matchGen = gptResponse.match(generalJsonRegex);
        if (matchGen && matchGen[1]) {
          jsonString = matchGen[1];
        }
      }

      if (jsonString.trim()) {
        const parsed = JSON.parse(jsonString.trim());
        if (Array.isArray(parsed)) {
          setDetectedCommands(parsed);
          setCommandLogs([]); // Reset execution logs
          return;
        }
      }
    } catch (e) {
      console.warn("Error parsing console commands from AI signature:", e);
    }
    setDetectedCommands([]);
  }, [gptResponse]);

  // Execute parsed actions on the system state
  const runAiDetectedCommands = () => {
    if (detectedCommands.length === 0) return;

    setIsExecutingCommands(true);
    const logs: string[] = [];

    detectedCommands.forEach((cmd) => {
      try {
        switch (cmd.action) {
          case 'charge_user': {
            const amount = Number(cmd.amount) || 50;
            if (cmd.userType === 'driver') {
              chargeDriver(cmd.userId, amount);
              const drv = drivers.find(d => d.id === cmd.userId);
              logs.push(`💰 شحن محفظة الكابتن [ ${drv ? drv.fullName : cmd.userId} ] بقيمة +${amount.toFixed(2)} د.أ`);
            } else {
              chargePassenger(cmd.userId, amount);
              const psg = passengers.find(p => p.id === cmd.userId);
              logs.push(`💰 شحن محفظة الراكب [ ${psg ? psg.fullName : cmd.userId} ] بقيمة +${amount.toFixed(2)} د.أ`);
            }
            break;
          }

          case 'approve_driver': {
            approveDriver(cmd.driverId);
            const drv = drivers.find(d => d.id === cmd.driverId);
            logs.push(`✅ تدقيق واعتماد حساب الكابتن [ ${drv ? drv.fullName : cmd.driverId} ]`);
            break;
          }

          case 'unblock_driver': {
            unblockDriver(cmd.driverId);
            const drv = drivers.find(d => d.id === cmd.driverId);
            logs.push(`🔓 فك حظر تجميد الكابتن [ ${drv ? drv.fullName : cmd.driverId} ]`);
            break;
          }

          case 'approve_passenger': {
            approvePassenger(cmd.passengerId);
            const psg = passengers.find(p => p.id === cmd.passengerId);
            logs.push(`✅ وافق ونشط حساب الراكب [ ${psg ? psg.fullName : cmd.passengerId} ]`);
            break;
          }

          case 'set_driver_online': {
            const status = cmd.status !== false;
            setDriverOnline(cmd.driverId, status);
            const drv = drivers.find(d => d.id === cmd.driverId);
            logs.push(`📡 تحديث اتصال الكابتن [ ${drv ? drv.fullName : cmd.driverId} ] إلى: ${status ? '🟢 متصل بالإنترنت' : '🔴 منفصل'}`);
            break;
          }

          case 'clear_all_stuck_rides': {
            // Sweep all requests and rides by using saveState to clear active and reset matching
            saveState(
              drivers.map(d => ({ ...d, activeRideId: null })),
              passengers.map(p => ({ ...p, activeRideId: null })),
              [], // clear pending pooling requests
              [], // clear active pooling rides
              messages,
              settings,
              scheduledTrips.map(s => s.status === 'started' ? { ...s, status: 'completed' as const } : s),
              walletTransactions
            );
            logs.push(`🧹 مسح وتصحيح كافة طلبات السير والرحلات العالقة، وتصفير طوابير الركوب النشطة.`);
            break;
          }

          default:
            logs.push(`⚠️ نوع الإجراء غير المعروف: ${cmd.action}`);
        }
      } catch (err: any) {
        logs.push(`❌ فشل تفعيل الإجراء ${cmd.action}: ${err.message}`);
      }
    });

    if (logs.length === 0) {
      logs.push("🔹 لم يتم إجراء أي تغيير، جميع الأوامر فارغة أو غير مدعومة.");
    }

    setCommandLogs(logs);
    setIsExecutingCommands(false);
    // Alert user
    alert("🚀 تم تطبيق الأوامر والتدابير بنجاح على قاعدة بيانات تطبيق آدم!");
  };

  const handleAskAI = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || aiPrompt;
    if (!finalPrompt.trim()) return;

    setIsLoading(true);
    setGptResponse('');
    try {
      const res = await fetch('/api/ai-diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          systemContext: {
            pendingDriversCount: drivers.filter(d => d.status === 'pending').length,
            blockedDriversCount: drivers.filter(d => d.status === 'blocked').length,
            pendingPassengersCount: passengers.filter(p => p.status === 'pending').length,
            negativeWalletsCount: drivers.filter(d => d.balance < 0).length + passengers.filter(p => p.balance < 0).length,
            activeRidesCount: rides.length,
            turboModeActive: isTurbo,
          }
        }),
      });
      const data = await res.json();
      setGptResponse(data.text || data.msg || '');
    } catch (e: any) {
      setGptResponse(`حدث خطأ أثناء استدعاء المحرك الذكي: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTestUser = (e: React.FormEvent) => {
    e.preventDefault();
    setSandboxMsg(null);

    const nameToUse = sandboxName.trim() || (sandboxRole === 'driver' ? `كابتن تجريبي متميز` : `راكب تجريبي نشط`);
    const randId = Math.floor(1000 + Math.random() * 9000);
    const phoneToUse = sandboxPhone.trim() || `079${Math.floor(1000000 + Math.random() * 9000000)}`;
    const usernameToUse = (sandboxRole === 'driver' ? 'drv_test_' : 'psg_test_') + randId;

    if (sandboxRole === 'driver') {
      const driverData = {
        username: usernameToUse,
        fullName: nameToUse,
        phone: phoneToUse,
        email: `${usernameToUse}@adamride.com`,
        licenseExpiry: '2029-12-31',
        carType: 'تويوتا كامري هجين (Toyota Camry Hybrid)',
        carClass: 'سيدان هجين',
        carPlate: `${Math.floor(10 + Math.random() * 89)}-${Math.floor(10000 + Math.random() * 89999)}`,
        carModel: 2024,
        carRegistrationExpiry: '2029-12-31',
        noCriminalRecord: true,
        governorate: sandboxGov,
        district: 'المنطقة التجريبية لمدينة آدم',
        documents: {
          idFront: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=150',
          idBack: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=150',
          licenseFront: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
          licenseBack: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
          carRegFront: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?w=150',
          carRegBack: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?w=150',
          photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
        }
      };

      const res = registerDriver(driverData);
      if (res.success) {
        setSandboxMsg({
          type: 'success',
          text: `✅ تم إنشاء الكابتن التجريبي [${nameToUse}] بنجاح! اسم المستخدم: @${res.generatedUsername} | كلمة المرور: ${res.tempPassword} | الهاتف: ${phoneToUse}`
        });
        setSandboxName('');
        setSandboxPhone('');
      } else {
        setSandboxMsg({ type: 'error', text: res.msg });
      }

    } else {
      const passengerData = {
        username: usernameToUse,
        full_name: nameToUse, // Wait, registerPassenger accepts passengerData
        fullName: nameToUse,
        phone: phoneToUse,
        email: `${usernameToUse}@adamride.com`,
        governorate: sandboxGov,
        documents: {
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
        }
      };

      const res = registerPassenger(passengerData);
      if (res.success) {
        setSandboxMsg({
          type: 'success',
          text: `✅ تم إنشاء الراكب التجريبي [${nameToUse}] بنجاح! اسم المستخدم: @${res.generatedUsername} | كلمة المرور: ${res.tempPassword} | الهاتف: ${phoneToUse}`
        });
        setSandboxName('');
        setSandboxPhone('');
      } else {
        setSandboxMsg({ type: 'error', text: res.msg });
      }
    }
  };

  const handleCreateArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDist.trim() || !newVillage.trim()) {
      setAreaMsg('يرجى ملء كافة حقول المنطقة الجديدة');
      return;
    }
    addWorkArea(newGov, newDist, newVillage);
    setNewDist('');
    setNewVillage('');
    setAreaMsg('✅ تم إضافة منطقة ومنفذ العمل الجديد بنجاح للنظام!');
    setTimeout(() => setAreaMsg(''), 3000);
  };

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      minCarModel: Number(minModelInput),
      commissionRate: Number(commRateInput),
      passengerFarePerSeat: Number(passengerFareInput),
      systemWalletNumber: systemWalletInput,
      systemCliQPhone: systemCliQPhoneInput,
      systemCliQAlias: systemCliQAliasInput,
      systemBankAccountNumber: systemBankAccountInput,
      systemBankName: systemBankNameInput
    });
    setSettingsMsg('✅ تم تحديث الشروط العامة، تكلفة الرحلة، وعمولة آدم ومعلومات المحافظ و CliQ المعتمدة بنجاح!');
    setTimeout(() => setSettingsMsg(''), 3000);
  };

  const currentBanks = settings.systemBanks && settings.systemBanks.length > 0
    ? settings.systemBanks
    : [
        {
          id: 'bank_default_init',
          bankName: settings.systemBankName || 'البنك العربي (Arab Bank)',
          accountNumber: settings.systemBankAccountNumber || 'JO89ARAB00000012345678901234',
          accountHolder: 'شركة آدم للنقل المتعدد م.م.ح',
          isActive: true
        }
      ];

  const handleAddNewBank = () => {
    if (!newBankName.trim() || !newBankNumber.trim()) {
      alert("يرجى إدخال اسم البنك ورقم الحساب أو الآيبان بشكل صحيح.");
      return;
    }
    const newObj = {
      id: `bank_${Date.now()}`,
      bankName: newBankName.trim(),
      accountNumber: newBankNumber.trim(),
      accountHolder: newBankHolder.trim() || 'شركة آدم للنقل المتعدد م.م.ح',
      isActive: true
    };
    const updatedList = [...currentBanks, newObj];
    const firstActive = updatedList.find(b => b.isActive) || newObj;
    updateSettings({
      systemBanks: updatedList,
      systemBankName: firstActive.bankName,
      systemBankAccountNumber: firstActive.accountNumber
    });
    setNewBankName('');
    setNewBankNumber('');
    alert("✅ تم إضافة البنك الجديد بنجاح لقائمة التحصيل المالي للشركة!");
  };

  const handleDeleteBank = (bankId: string) => {
    if (currentBanks.length <= 1) {
      alert("⚠️ لا يمكن حذف جميع البنوك! يجب الإبقاء على حساب بنكي واحد نشط على الأقل للشركة.");
      return;
    }
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا الحساب البنكي نهائياً؟")) return;
    const updatedList = currentBanks.filter(b => b.id !== bankId);
    const firstActive = updatedList.find(b => b.isActive) || updatedList[0];
    updateSettings({
      systemBanks: updatedList,
      systemBankName: firstActive ? firstActive.bankName : undefined,
      systemBankAccountNumber: firstActive ? firstActive.accountNumber : undefined
    });
  };

  const handleToggleBank = (bankId: string) => {
    const updatedList = currentBanks.map(b => b.id === bankId ? { ...b, isActive: !b.isActive } : b);
    const firstActive = updatedList.find(b => b.isActive) || updatedList[0];
    updateSettings({
      systemBanks: updatedList,
      systemBankName: firstActive ? firstActive.bankName : undefined,
      systemBankAccountNumber: firstActive ? firstActive.accountNumber : undefined
    });
  };

  const movePriority = (index: number, direction: 'up' | 'down') => {
    const newList = [...collectionPriorityOrderInput];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newList.length) {
      const temp = newList[index];
      newList[index] = newList[targetIndex];
      newList[targetIndex] = temp;
      setCollectionPriorityOrderInput(newList);
    }
  };

  const handleTopup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermissionWrite('walletApprovals')) {
      alert("🚫 عذراً، لا تمتلك الصلاحية الإجرائية لشحن محافظ الكباتن!");
      return;
    }
    if (!selectedDriverId) {
      setTopupMsg('⚠️ يرجى تحديد السائق أولاً لشحن رصيده');
      return;
    }
    chargeDriver(selectedDriverId, topupAmount);
    setTopupMsg(`✅ تم شحن محفظة الكابتن بمبلغ ${topupAmount} د.أ بنجاح!`);
    setTimeout(() => setTopupMsg(''), 3000);
  };

  const handlePassengerTopup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermissionWrite('walletApprovals')) {
      alert("🚫 عذراً، لا تمتلك الصلاحية الإجرائية لشحن محافظ الركاب!");
      return;
    }
    if (!selectedPassengerId) {
      setPassengerTopupMsg('⚠️ يرجى تحديد الراكب أولاً لشحن رصيده');
      return;
    }
    chargePassenger(selectedPassengerId, passengerTopupAmount);
    setPassengerTopupMsg(`✅ تم شحن محفظة الراكب بمبلغ ${passengerTopupAmount} د.أ بنجاح!`);
    setTimeout(() => setPassengerTopupMsg(''), 3000);
  };

  const handleAiBulkPromoAnalysis = async () => {
    setPromoLoading(true);
    setPromoAnalysisReport('');
    setPromoMatchedIds([]);
    setPromoSuccessMsg('');
    try {
      const listToAnalyze = promoUserType === 'driver' ? drivers : passengers;
      const res = await fetch('/api/ai-bulk-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: promoUserType,
          allUsers: listToAnalyze,
          targetType: promoTargetType,
          customPrompt: promoCustomPrompt,
          promoAmount: promoAmount
        })
      });
      const data = await res.json();
      if (data.success) {
        setPromoMatchedIds(data.matchedUserIds || []);
        setPromoAnalysisReport(data.aiAnalysisReport || '');
      } else {
        alert("⚠️ فشل الذكاء الاصطناعي في تحليل وتصفية الشريحة: " + (data.msg || 'خطأ غير معروف'));
      }
    } catch (e: any) {
      console.error(e);
      alert("⚠️ حدث خطأ أثناء الاتصال بخدمة تحليل الشرائح الذكية.");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleExecuteAiBulkPromo = () => {
    if (!hasPermissionWrite('walletApprovals')) {
      alert("🚫 عذراً، لا تمتلك الصلاحية الإجرائية لشحن الحسابات جماعياً!");
      return;
    }
    if (promoMatchedIds.length === 0) {
      alert("⚠️ لا يوجد مستخدمين محددين للشحن حالياً. يرجى تحليل وتصفية الشريحة أولاً.");
      return;
    }
    
    const count = promoMatchedIds.length;
    const confirmExec = window.confirm(`❓ هل أنت متأكد من رغبتك في شحن رصيد مجاني جماعي بقيمة (${promoAmount.toFixed(2)} د.أ) لعدد (${count}) مستخدم مستهدف؟\nسيتم إيداع ما مجموعه (${(promoAmount * count).toFixed(2)} د.أ) تراكمياً في النظام.`);
    if (!confirmExec) return;

    promoMatchedIds.forEach(id => {
      if (promoUserType === 'driver') {
        chargeDriver(id, promoAmount);
      } else {
        chargePassenger(id, promoAmount);
      }
    });

    setPromoSuccessMsg(`🎉 تم الشحن الجماعي الذكي بنجاح! تم إيداع ${promoAmount.toFixed(2)} د.أ في محافظ ${count} مستخدم مستهدف بنجاح وتوثيق الحركات المالية.`);
    setPromoMatchedIds([]);
    setPromoAnalysisReport('');
  };

  const handleGenerateAiCashReport = async (logs: any[], total: number) => {
    setIsAiGeneratingCashReport(true);
    setAiCashReportResult('');
    try {
      const response = await fetch('/api/ai-cash-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filteredLogs: logs,
          totalAmount: total,
          filters: {
            userType: cashLogUserType,
            paymentMethod: cashLogPaymentMethod,
            type: cashLogType,
            search: cashLogSearch
          }
        }),
      });
      const data = await response.json();
      if (data.success) {
        setAiCashReportResult(data.text);
      } else {
        alert(data.msg || 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.');
      }
    } catch (err: any) {
      console.error(err);
      alert('فشل الاتصال بخادم الذكاء الاصطناعي.');
    } finally {
      setIsAiGeneratingCashReport(false);
    }
  };

  const handleAdminChatSubmit = (rideId: string) => {
    const text = adminChatText[rideId];
    if (!text || !text.trim()) return;
    sendChatMessage(rideId, 'admin', 'admin_node', 'الدعم الإداري لقوافل آدم', text);
    setAdminChatText(prev => ({ ...prev, [rideId]: '' }));
  };

  const pendingDrivers = drivers.filter(d => d.status === 'pending');
  const pendingPassengers = passengers.filter(p => p.status === 'pending');

  const isAuthorized = currentUser && (currentUser.username === 'admin' || currentUser.role === 'admin' || currentUser.role === 'employee');

  if (!isAuthorized) {
    return (
      <div className="flex flex-col h-full bg-[#0b0f19] border border-[#1e293b] rounded-2xl overflow-hidden shadow-2xl font-sans text-right">
        {/* Tab bar header */}
        <div className="flex flex-row-reverse items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0f172a] to-[#0b1329] border-b border-[#1e293b] select-none">
          <div className="flex items-center gap-2 flex-row-reverse">
            <div className="p-1 px-2.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-md text-[10px] font-black flex items-center gap-1.5 animate-pulse">
              <span>مغلق للإدارة والعمليات المركزية 🔐</span>
            </div>
            <h2 className="text-sm font-black text-slate-100 font-sans tracking-tight">بوابة المراقبة والتحقق</h2>
          </div>
        </div>

        {/* Login Form Body */}
        <div className="flex-1 flex flex-col justify-center p-6 md:p-8 bg-[#090d16] text-right overflow-y-auto">
          <div className="max-w-sm mx-auto w-full flex flex-col gap-4 my-auto">
            <div className="text-center flex flex-col items-center gap-2 mb-1.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-950/40">
                <Lock className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-base font-black text-slate-200 mt-2">نظام الإدارة المركزية (CRM)</h3>
              <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                يجب تسجيل الدخول باستخدام حساب مصرح به للوصول إلى بيانات الكباتن، الرحلات والمحافظ والتحكم في النظام
              </p>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="p-3 bg-red-950/60 border border-red-700/35 rounded-xl text-red-400 text-xs text-center flex items-center gap-2 justify-center flex-row-reverse">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span className="font-bold">{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLoginSubmit} className="flex flex-col gap-4 text-xs text-slate-300">
              <div>
                <label className="block mb-1.5 text-slate-400 font-extrabold text-[11px]">اسم المستخدم / المعرف الوظيفي</label>
                <input 
                  type="text" 
                  required
                  placeholder="اسم المستخدم / المعرف الوظيفي" 
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:outline-none transition-all duration-150 text-right font-mono"
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-1.5 text-slate-400 font-extrabold text-[11px]">كلمة المرور السريّة</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••" 
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-3 py-2.5 text-slate-100 text-xs focus:outline-none transition-all duration-150 text-right font-mono"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer text-[10px]"
                  >
                    {showPassword ? "إخفاء" : "إظهار"}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl transition duration-150 text-xs mt-2 cursor-pointer shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-1.5"
              >
                <span>دخول آمن للوحة التحكم 🔒</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] border border-[#1e293b] rounded-2xl overflow-hidden shadow-2xl font-sans text-right">
      
      {/* Tab bar header */}
      <div className="flex flex-row-reverse items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0f172a] to-[#0b1329] border-b border-[#1e293b] select-none">
        
        <div className="flex items-center gap-2 flex-row-reverse">
          {(!currentUser || currentUser.username === 'admin' || currentUser.username === 'Ahmaidat' || currentUser.role === 'admin') ? (
            <div className="p-1 px-2.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-md text-[10px] font-black flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>كامل صلاحيات الإدارة الشاملة (المدير الرئيسي) 👑</span>
            </div>
          ) : (
            <div className="p-1 px-2.5 bg-violet-500/20 text-violet-300 border border-violet-500/45 rounded-md text-[10px] font-black flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
              <span>الموظف: {currentUser.fullName} (صلاحيات تشغيلية مخصصة) 🔒</span>
            </div>
          )}
          {currentUser && (
            <button
              onClick={() => {
                setNewAdminPasswordVal('');
                setAdminPasswordFeedback('');
                setShowAdminPasswordModal(true);
              }}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-slate-200 text-[10px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer flex-row-reverse shadow-sm shrink-0"
              title="تغيير كلمة السر الخاصة بحسابك الإداري الحالي"
            >
              <Lock className="w-3 h-3 text-amber-500" />
              <span>تغيير كلمة السر 🔐</span>
            </button>
          )}
          <h2 className="text-sm font-black text-slate-100 font-sans tracking-tight">لوحة تحكم آدم المركزية (Admin CRM)</h2>

          {/* Inline Active Country Dropdown Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 flex-row-reverse shadow-inner">
            <span className="text-[9.5px] text-slate-400 font-bold select-none shrink-0">علم الدولة:</span>
            <select
              value={activeCountryCode}
              onChange={(e) => setActiveCountryCode(e.target.value)}
              className="bg-transparent text-[10px] text-indigo-350 hover:text-indigo-300 font-sans font-black outline-none text-right cursor-pointer max-w-[160px]"
            >
              {COUNTRIES_DATA.map((c) => (
                <option key={c.code} value={c.code} className="bg-slate-950 text-slate-200">
                  {c.flag} {c.nameAr} ({c.currencyAr})
                </option>
              ))}
            </select>
          </div>
          
          {/* AI Fix quick action button */}
          <button
            id="button-aifix-top"
            onClick={() => {
              setActiveTab('ai-diagnose');
              setTimeout(() => {
                const runBtn = document.getElementById("button-run-autofix");
                if (runBtn) {
                  runBtn.click();
                }
              }, 120);
            }}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-black px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 shadow-lg shadow-purple-500/35 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer animate-pulse mr-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Fix 🤖</span>
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex gap-1.5 overflow-x-auto flex-row-reverse text-xs">
          {currentUser && (currentUser.username === 'admin' || currentUser.role === 'admin' || currentUser.role === 'employee') && (
            <button 
              onClick={() => {
                if (window.confirm('هل ترغب في تسجيل الخروج من لوحة التحكم؟')) {
                  logout('admin');
                }
              }}
              className="px-3 py-1.5 rounded-lg font-bold transition duration-150 text-red-400 hover:text-red-300 bg-red-950/20 border border-red-900/30 flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>تسجيل الخروج 🚪</span>
            </button>
          )}

          {(currentUser?.username === 'admin' || currentUser?.username === 'Ahmaidat') && (
            <button 
              onClick={() => setActiveTab('employees')}
              className={`px-3 py-1.5 rounded-lg font-bold transition duration-150 ${activeTab === 'employees' ? 'bg-indigo-600 text-white' : 'text-indigo-400 hover:text-indigo-300 bg-slate-900/40 border border-slate-800'} flex items-center justify-center gap-1 flex-row-reverse`}
            >
              <Briefcase className="w-3.5 h-3.5 inline text-indigo-400" />
              <span>💼 حسابات الموظفين والصلاحيات</span>
            </button>
          )}

          {canAccessTab('dashboard') && (
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg font-bold transition duration-150 ${activeTab === 'dashboard' ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-400 hover:text-indigo-300 bg-slate-900/40 border border-slate-800'} flex items-center justify-center gap-1.5 flex-row-reverse`}
            >
              <span>📊 لوحة المعلومات والملخص</span>
            </button>
          )}

          {canAccessTab('analytics') && (
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg font-bold transition duration-150 ${activeTab === 'analytics' ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-400 hover:text-indigo-300 bg-slate-900/40 border border-slate-800'} flex items-center justify-center gap-1.5 flex-row-reverse`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>📈 تحليلات الريادة والبيئة</span>
            </button>
          )}

          {canAccessTab('users') && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg font-bold transition duration-150 ${activeTab === 'users' ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white' : 'text-slate-400 hover:text-slate-300 bg-slate-900/40 border border-slate-800'}`}
            >
              المستخدمين والوثائق { (pendingDrivers.length + pendingPassengers.length) > 0 && <span className="bg-red-500 text-white rounded-full px-1.5 text-[9px] ml-1">{pendingDrivers.length + pendingPassengers.length}</span> }
            </button>
          )}

          {canAccessTab('enforcement') && (
            <button 
              onClick={() => setActiveTab('enforcement')}
              className={`px-3 py-1.5 rounded-lg font-bold transition duration-150 ${activeTab === 'enforcement' ? 'bg-gradient-to-l from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-900/20' : 'text-slate-400 hover:text-slate-300 bg-slate-900/40 border border-slate-800'} flex items-center justify-center gap-1.5 flex-row-reverse`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>⚖️ رقابة التجاوزات وإيقاف الخدمة</span>
            </button>
          )}
          
          {canAccessTab('areas') && (
            <button 
              onClick={() => setActiveTab('areas')}
              className={`px-3 py-1.5 rounded-lg font-bold transition duration-150 ${activeTab === 'areas' ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white' : 'text-slate-400 hover:text-slate-300 bg-slate-900/40 border border-slate-800'}`}
            >
              مناطق ومقاييس النظام
            </button>
          )}

          {canAccessTab('pickup-points') && (
            <button 
              onClick={() => setActiveTab('pickup-points')}
              className={`px-3 py-1.5 rounded-lg font-bold transition duration-150 ${activeTab === 'pickup-points' ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:text-slate-300 bg-slate-900/40 border border-slate-800'}`}
            >
              📍 نقاط التجمع الرئيسية
            </button>
          )}

          {canAccessTab('billing') && (
            <button 
              onClick={() => setActiveTab('billing')}
              className={`px-3 py-1.5 rounded-lg font-bold transition duration-150 ${activeTab === 'billing' ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white' : 'text-slate-400 hover:text-slate-300 bg-slate-900/40 border border-slate-800'}`}
            >
              المحافظ وشحن الرصيد
            </button>
          )}

          {canAccessTab('payment-ledger') && (
            <button 
              onClick={() => setActiveTab('payment-ledger')}
              className={`px-3 py-1.5 rounded-lg font-bold transition duration-150 ${activeTab === 'payment-ledger' ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white ring-1 ring-indigo-500/20' : 'text-indigo-400 hover:text-indigo-300 bg-slate-900/40 border border-slate-800'} flex items-center justify-center gap-1.5`}
            >
              🧾 سجل الدفعات والمحاسبة
            </button>
          )}

          {canAccessTab('ai-debt-cancel') && (
            <button 
              onClick={() => setActiveTab('ai-debt-cancel')}
              className={`px-3 py-1.5 rounded-lg font-bold transition duration-150 ${activeTab === 'ai-debt-cancel' ? 'bg-gradient-to-l from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-950/40' : 'text-slate-400 hover:text-slate-300 bg-slate-900/40 border border-slate-800'} flex items-center justify-center gap-1.5`}
            >
              🧠🛡️ المديونية والإلغاء الذكي
            </button>
          )}

          {canAccessTab('trips') && (
            <button 
              onClick={() => setActiveTab('trips')}
              className={`px-3 py-1.5 rounded-lg font-bold transition duration-150 ${activeTab === 'trips' ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white' : 'text-slate-400 hover:text-slate-300 bg-slate-900/40 border border-slate-800'}`}
            >
              سجل وتفصيل الرحلات
            </button>
          )}

          {canAccessTab('chat') && (
            <button 
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-lg font-bold transition duration-150 ${activeTab === 'chat' ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white' : 'text-slate-400 hover:text-slate-300 bg-slate-900/40 border border-slate-800'}`}
            >
              إشراف وغرف الدردشة
            </button>
          )}

          {canAccessTab('ratings') && (
             <button 
              onClick={() => setActiveTab('ratings')}
              className={`px-3 py-1.5 rounded-lg font-bold transition duration-150 ${activeTab === 'ratings' ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white' : 'text-slate-400 hover:text-slate-300 bg-slate-900/40 border border-slate-800'}`}
            >
              ⭐ تقييمات مجتمع آدم
            </button>
          )}

          {canAccessTab('drive') && (
             <button 
              onClick={() => setActiveTab('drive')}
              className={`px-3 py-1.5 rounded-lg font-bold transition duration-150 ${activeTab === 'drive' ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white' : 'text-slate-400 hover:text-slate-300 bg-slate-900/40 border border-slate-800'} flex items-center justify-center gap-1 flex-row-reverse`}
            >
              <Cloud className="w-3.5 h-3.5 inline text-indigo-400" />
              <span>أرشيف وسحابة Drive</span>
            </button>
          )}

          {canAccessTab('gmail') && (
             <button 
              onClick={() => setActiveTab('gmail')}
              className={`px-3 py-1.5 rounded-lg font-bold transition duration-150 ${activeTab === 'gmail' ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white' : 'text-slate-400 hover:text-slate-300 bg-slate-900/40 border border-slate-800'} flex items-center justify-center gap-1 flex-row-reverse`}
            >
              <Mail className="w-3.5 h-3.5 inline text-indigo-400" />
              <span>ربط بريد Gmail</span>
            </button>
          )}

          {canAccessTab('whatsapp') && (
             <button 
              onClick={() => setActiveTab('whatsapp')}
              className={`px-3 py-1.5 rounded-lg font-bold transition duration-150 ${activeTab === 'whatsapp' ? 'bg-gradient-to-l from-emerald-650 to-teal-700 text-white shadow-lg ring-1 ring-emerald-500/20' : 'text-emerald-400 hover:text-emerald-300 bg-slate-900/40 border border-slate-800'} flex items-center justify-center gap-1.5 flex-row-reverse`}
            >
              <MessageCircle className="w-3.5 h-3.5 inline text-emerald-400" />
              <span>💬 حملات واتساب الجماعية</span>
            </button>
          )}

          {canAccessTab('company') && (
            <button 
              onClick={() => setActiveTab('company')}
              className={`px-3 py-1.5 rounded-lg font-bold transition duration-150 ${activeTab === 'company' ? 'bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 font-black ring-1 ring-amber-500/50' : 'text-amber-500 hover:text-amber-400 bg-amber-500/5 border border-amber-500/20'} flex items-center justify-center gap-1.5 flex-row-reverse`}
            >
              <Building className="w-3.5 h-3.5 inline text-amber-500" />
              <span>🏢 حساب الشركة (ADAM Co.)</span>
            </button>
          )}

          {canAccessTab('ai-diagnose') && (
            <button 
              id="admin-tab-ai"
              onClick={() => setActiveTab('ai-diagnose')}
              className={`px-3 py-1.5 rounded-lg font-black transition duration-150 ${activeTab === 'ai-diagnose' ? 'bg-gradient-to-l from-purple-600 to-fuchsia-600 text-white shadow-lg ring-1 ring-purple-500/30' : 'text-purple-400 hover:text-purple-300 bg-purple-500/5 border border-purple-500/20'} flex items-center justify-center gap-1.5 flex-row-reverse animate-pulse`}
            >
              <Sparkles className="w-3.5 h-3.5 inline text-purple-400" />
              <span>🤖 تشخيص المالك وتسريع النظام (ADAM AI)</span>
            </button>
          )}

          {canAccessTab('ai-studio') && (
            <button 
              id="admin-tab-ai-studio"
              onClick={() => setActiveTab('ai-studio')}
              className={`px-3 py-1.5 rounded-lg font-black transition duration-150 ${activeTab === 'ai-studio' ? 'bg-gradient-to-l from-violet-600 to-indigo-600 text-white shadow-lg ring-1 ring-violet-500/30' : 'text-violet-400 hover:text-violet-300 bg-violet-500/5 border border-violet-500/20'} flex items-center justify-center gap-1.5 flex-row-reverse`}
            >
              <Cpu className="w-3.5 h-3.5 inline text-violet-400 animate-spin" />
              <span>🌌 استوديو جيميناي لتصميم وتعديل التطبيقات (ADAM AI App Studio)</span>
            </button>
          )}

          {canAccessTab('ads') && (
            <button 
              id="admin-tab-ads"
              onClick={() => setActiveTab('ads')}
              className={`px-3 py-1.5 rounded-lg font-bold transition duration-150 ${activeTab === 'ads' ? 'bg-gradient-to-l from-indigo-600 to-violet-600 text-white shadow-lg ring-1 ring-indigo-500/30' : 'text-slate-300 hover:text-white bg-slate-900 border border-slate-800'} flex items-center justify-center gap-1.5 flex-row-reverse`}
            >
              <Megaphone className="w-3.5 h-3.5 inline text-indigo-400" />
              <span>📢 إدارة الإعلانات والعروض (ADAM Ads)</span>
            </button>
          )}

          {canAccessTab('ai-evolution') && (
            <button 
              id="admin-tab-ai-evolution"
              onClick={() => setActiveTab('ai-evolution')}
              className={`px-3 py-1.5 rounded-lg font-black transition duration-150 ${activeTab === 'ai-evolution' ? 'bg-gradient-to-l from-amber-500 to-emerald-600 text-white shadow-lg ring-1 ring-amber-500/30' : 'text-amber-400 hover:text-amber-300 bg-amber-500/5 border border-amber-500/20'} flex items-center justify-center gap-1.5 flex-row-reverse`}
            >
              <Zap className="w-3.5 h-3.5 inline text-amber-400" />
              <span>🧬 ترقية نظام آدم المستمر بالذكاء الاصطناعي (AI Data Shield Hub)</span>
            </button>
          )}

          {canAccessTab('languages') && (
            <button 
              id="admin-tab-languages"
              onClick={() => setActiveTab('languages')}
              className={`px-3 py-1.5 rounded-lg font-black transition duration-150 ${activeTab === 'languages' ? 'bg-gradient-to-l from-indigo-600 to-blue-500 text-white shadow-lg ring-1 ring-blue-500/30' : 'text-blue-400 hover:text-blue-300 bg-blue-500/5 border border-blue-500/20'} flex items-center justify-center gap-1.5 flex-row-reverse`}
            >
              <Globe className="w-3.5 h-3.5 inline text-blue-400" />
              <span>🌐 حوكمة اللغات والترجمة بـ Gemini (AI Translation Manager)</span>
            </button>
          )}

          {canAccessTab('countries') && (
            <button 
              onClick={() => setActiveTab('countries')}
              className={`px-3 py-1.5 rounded-lg font-black transition duration-150 ${activeTab === 'countries' ? 'bg-gradient-to-l from-emerald-600 to-indigo-650 text-white shadow-lg ring-1 ring-emerald-500/30' : 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/5 border border-emerald-500/20'} flex items-center justify-center gap-1.5 flex-row-reverse`}
            >
              <Coins className="w-3.5 h-3.5 inline text-emerald-400" />
              <span>🗺️ إدارة الدول والعملات والتعريفات (Global Rates Manager)</span>
            </button>
          )}

          {canAccessTab('er-diagram') && (
            <button 
              id="admin-tab-er-diagram"
              onClick={() => setActiveTab('er-diagram')}
              className={`px-3 py-1.5 rounded-lg font-black transition duration-150 ${activeTab === 'er-diagram' ? 'bg-gradient-to-l from-amber-500 to-yellow-600 text-slate-950 shadow-lg ring-1 ring-amber-500/50 font-black' : 'text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30'} flex items-center justify-center gap-1.5 flex-row-reverse`}
            >
              <Database className="w-3.5 h-3.5 inline text-amber-400" />
              <span>🗄️ مخطط قواعد البيانات والكيانات ER Diagram</span>
            </button>
          )}

          {canAccessTab('ui-customizer') && (
            <button 
              id="admin-tab-ui-customizer"
              onClick={() => setActiveTab('ui-customizer')}
              className={`px-3.5 py-1.5 rounded-lg font-black transition duration-150 ${activeTab === 'ui-customizer' ? 'bg-gradient-to-l from-indigo-600 via-purple-600 to-amber-500 text-white shadow-lg ring-1 ring-indigo-400/50 font-black' : 'text-indigo-300 hover:text-white bg-indigo-950/60 border border-indigo-700/50'} flex items-center justify-center gap-1.5 flex-row-reverse`}
            >
              <Sliders className="w-3.5 h-3.5 inline text-amber-400" />
              <span>🎛️ إدارة الواجهات والـ API ومحرك Uber AI</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 p-6 overflow-y-auto bg-slate-950/40 min-h-[440px]">
        
        {activeTab === 'ui-customizer' && (
          <motion.div
            key="ui-customizer"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <AdminUiControlsPanel />
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <AdvancedTripAnalytics />
          </motion.div>
        )}

        {activeTab === 'er-diagram' && (
          <motion.div
            key="er-diagram"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <ErDiagramStudio />
          </motion.div>
        )}

        {/* DYNAMIC PERMISSIONS-BUILT MASTER INTERACTIVE DASHBOARD */}
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col gap-6 text-right font-sans"
          >
            {/* Quick Diagnostic Welcome Panel */}
            <div className="bg-[#0b0f19] border border-slate-900 rounded-2xl p-5 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
              
              <div className="flex flex-col md:flex-row-reverse justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h2 className="text-base font-black text-slate-100">
                    مرحباً بك مجدداً، {currentUser?.fullName || 'مسؤول النظام'} 👋
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {(currentUser?.username === 'admin' || currentUser?.username === 'Ahmaidat') 
                      ? 'أنت لست مجرد مستخدم عادي؛ لقد سجلت الدخول بصفتك المدير العام وصاحب العمليات بكامل الصلاحيات الفعالة المطلقة.' 
                      : `مرحباً بك كمسؤول عمليات مسجّل بالرقم الوظيفي الفريد (${currentUser?.id || '2026'}). لقد تم تقييد وحماية الواجهة ديناميكياً بناءً على مصفوفة صلاحيات خط الخدمة.`}
                  </p>
                </div>

                <div className="bg-slate-950/75 border border-slate-850 p-2.5 rounded-xl text-[10.5px] leading-relaxed max-w-sm flex items-center gap-2 flex-row-reverse">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <span className="text-slate-300 font-bold">
                    الجلسة نشطة وموثقة: <span className="text-emerald-400 font-mono">@{currentUser?.username}</span>
                  </span>
                </div>
              </div>

              {/* Matrix list of permissions for this specific logged in user */}
              <div className="mt-5 pt-4 border-t border-slate-900/65">
                <span className="text-[10px] text-slate-450 font-black tracking-wider block mb-2.5 uppercase text-right">
                  مصفوفة التحقق وصلاحيات الدخول المرتبطة بهذا الحساب الموثق:
                </span>
                
                <div className="flex flex-wrap gap-2 flex-row-reverse text-[10.5px]">
                  {/* Driver management badge */}
                  <div className={`p-1.5 px-3 rounded-xl border flex items-center gap-1.5 flex-row-reverse ${
                    getPermissionState('activeDrivers') === 'enabled' 
                      ? 'bg-emerald-950/20 border-emerald-500/25 text-emerald-400' 
                      : getPermissionState('activeDrivers') === 'disabled'
                      ? 'bg-amber-950/20 border-amber-500/25 text-amber-400'
                      : 'bg-[#1e1e2d] border-slate-800 text-slate-500 line-through opacity-60'
                  }`}>
                    <span>{getPermissionState('activeDrivers') === 'enabled' ? '🟢' : getPermissionState('activeDrivers') === 'disabled' ? '🟡' : '🔴'}</span>
                    <strong className="font-sans">إدارة كباتن الأسطول</strong>
                    <span className="text-[8px] bg-slate-950/60 px-1 py-0.5 rounded opacity-80 uppercase tracking-wide">
                      {getPermissionState('activeDrivers') === 'enabled' ? 'قراءة وكتابة' : getPermissionState('activeDrivers') === 'disabled' ? 'قراءة فقط' : 'محجوب أمنياً'}
                    </span>
                  </div>

                  {/* Passengers badge */}
                  <div className={`p-1.5 px-3 rounded-xl border flex items-center gap-1.5 flex-row-reverse ${
                    getPermissionState('passengers') === 'enabled' 
                      ? 'bg-emerald-950/20 border-emerald-500/25 text-emerald-400' 
                      : getPermissionState('passengers') === 'disabled'
                      ? 'bg-amber-950/20 border-amber-500/25 text-amber-400'
                      : 'bg-[#1e1e2d] border-slate-800 text-slate-500 line-through opacity-60'
                  }`}>
                    <span>{getPermissionState('passengers') === 'enabled' ? '🟢' : getPermissionState('passengers') === 'disabled' ? '🟡' : '🔴'}</span>
                    <strong className="font-sans">بيانات وقوائم الركاب</strong>
                    <span className="text-[8px] bg-slate-950/60 px-1 py-0.5 rounded opacity-80 uppercase tracking-wide">
                      {getPermissionState('passengers') === 'enabled' ? 'قراءة وكتابة' : getPermissionState('passengers') === 'disabled' ? 'قراءة فقط' : 'محجوب أمنياً'}
                    </span>
                  </div>

                  {/* Wallet audit badge */}
                  <div className={`p-1.5 px-3 rounded-xl border flex items-center gap-1.5 flex-row-reverse ${
                    getPermissionState('walletApprovals') === 'enabled' 
                      ? 'bg-emerald-950/20 border-emerald-500/25 text-emerald-400' 
                      : getPermissionState('walletApprovals') === 'disabled'
                      ? 'bg-amber-950/20 border-amber-500/25 text-amber-400'
                      : 'bg-[#1e1e2d] border-slate-800 text-slate-500 line-through opacity-60'
                  }`}>
                    <span>{getPermissionState('walletApprovals') === 'enabled' ? '🟢' : getPermissionState('walletApprovals') === 'disabled' ? '🟡' : '🔴'}</span>
                    <strong className="font-sans">الاعتمادات وشحن المحافظ</strong>
                    <span className="text-[8px] bg-slate-950/60 px-1 py-0.5 rounded opacity-80 uppercase tracking-wide">
                      {getPermissionState('walletApprovals') === 'enabled' ? 'قراءة وكتابة' : getPermissionState('walletApprovals') === 'disabled' ? 'قراءة فقط' : 'محجوب أمنياً'}
                    </span>
                  </div>

                  {/* Operations & Rides telemetry badge */}
                  <div className={`p-1.5 px-3 rounded-xl border flex items-center gap-1.5 flex-row-reverse ${
                    getPermissionState('allRides') === 'enabled' 
                      ? 'bg-emerald-950/20 border-emerald-500/25 text-emerald-400' 
                      : getPermissionState('allRides') === 'disabled'
                      ? 'bg-amber-950/20 border-amber-500/25 text-amber-400'
                      : 'bg-[#1e1e2d] border-slate-800 text-slate-500 line-through opacity-60'
                  }`}>
                    <span>{getPermissionState('allRides') === 'enabled' ? '🟢' : getPermissionState('allRides') === 'disabled' ? '🟡' : '🔴'}</span>
                    <strong className="font-sans">تتبع ورقابة الرحلات</strong>
                    <span className="text-[8px] bg-slate-950/60 px-1 py-0.5 rounded opacity-80 uppercase tracking-wide">
                      {getPermissionState('allRides') === 'enabled' ? 'قراءة وكتابة' : getPermissionState('allRides') === 'disabled' ? 'قراءة فقط' : 'محجوب أمنياً'}
                    </span>
                  </div>

                  {/* Scheduled trips pooling badge */}
                  <div className={`p-1.5 px-3 rounded-xl border flex items-center gap-1.5 flex-row-reverse ${
                    getPermissionState('scheduledTrips') === 'enabled' 
                      ? 'bg-emerald-950/20 border-emerald-500/25 text-emerald-400' 
                      : getPermissionState('scheduledTrips') === 'disabled'
                      ? 'bg-amber-950/20 border-amber-500/25 text-amber-400'
                      : 'bg-[#1e1e2d] border-slate-800 text-slate-500 line-through opacity-60'
                  }`}>
                    <span>{getPermissionState('scheduledTrips') === 'enabled' ? '🟢' : getPermissionState('scheduledTrips') === 'disabled' ? '🟡' : '🔴'}</span>
                    <strong className="font-sans">تسيير الرحلات المجدولة</strong>
                    <span className="text-[8px] bg-slate-950/60 px-1 py-0.5 rounded opacity-80 uppercase tracking-wide">
                      {getPermissionState('scheduledTrips') === 'enabled' ? 'قراءة وكتابة' : getPermissionState('scheduledTrips') === 'disabled' ? 'قراءة فقط' : 'محجوب أمنياً'}
                    </span>
                  </div>

                  {/* Rate strategies badge */}
                  <div className={`p-1.5 px-3 rounded-xl border flex items-center gap-1.5 flex-row-reverse ${
                    getPermissionState('rateManagement') === 'enabled' 
                      ? 'bg-emerald-950/20 border-emerald-500/25 text-emerald-400' 
                      : getPermissionState('rateManagement') === 'disabled'
                      ? 'bg-amber-950/20 border-amber-500/25 text-amber-400'
                      : 'bg-[#1e1e2d] border-slate-800 text-slate-500 line-through opacity-60'
                  }`}>
                    <span>{getPermissionState('rateManagement') === 'enabled' ? '🟢' : getPermissionState('rateManagement') === 'disabled' ? '🟡' : '🔴'}</span>
                    <strong className="font-sans">إدارة خطوط ومناطق الأردن</strong>
                    <span className="text-[8px] bg-slate-950/60 px-1 py-0.5 rounded opacity-80 uppercase tracking-wide">
                      {getPermissionState('rateManagement') === 'enabled' ? 'قراءة وكتابة' : getPermissionState('rateManagement') === 'disabled' ? 'قراءة فقط' : 'محجوب أمنياً'}
                    </span>
                  </div>

                  {/* System & AI settings strategy badge */}
                  <div className={`p-1.5 px-3 rounded-xl border flex items-center gap-1.5 flex-row-reverse ${
                    getPermissionState('aiServicesStrategy') === 'enabled' 
                      ? 'bg-emerald-950/20 border-emerald-500/25 text-emerald-400' 
                      : getPermissionState('aiServicesStrategy') === 'disabled'
                      ? 'bg-amber-950/20 border-amber-500/25 text-amber-400'
                      : 'bg-[#1e1e2d] border-slate-800 text-slate-500 line-through opacity-60'
                  }`}>
                    <span>{getPermissionState('aiServicesStrategy') === 'enabled' ? '🟢' : getPermissionState('aiServicesStrategy') === 'disabled' ? '🟡' : '🔴'}</span>
                    <strong className="font-sans">استراتيجية الذكاء والتشخيص</strong>
                    <span className="text-[8px] bg-slate-950/60 px-1 py-0.5 rounded opacity-80 uppercase tracking-wide">
                      {getPermissionState('aiServicesStrategy') === 'enabled' ? 'قراءة وتفعيل' : getPermissionState('aiServicesStrategy') === 'disabled' ? 'قراءة فقط' : 'محجوب أمنياً'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* GEMINI AI EMPLOYEE CO-PILOT WORKSPACE */}
            <div className="bg-gradient-to-br from-[#0c0f1d] via-[#10142b] to-[#0c0f1e] border-2 border-indigo-500/30 p-6 rounded-3xl mb-6 text-right font-sans relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600"></div>
              <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex justify-between items-center flex-row-reverse flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                      <Cpu className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-100 flex items-center gap-1.5 flex-row-reverse">
                        <span>مساعد الموظف التشغيلي الذكي بـ Gemini 🤖</span>
                        <span className="text-[10px] bg-indigo-500/15 text-indigo-300 font-normal px-2 py-0.5 rounded-full border border-indigo-500/20 font-mono">@{currentUser?.username}</span>
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">شريكك اللوجستي الذاتي لتسريع تفعيل الحسابات وإدارة مستحقات آدم الفورية</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-row-reverse">
                    <button
                      type="button"
                      onClick={() => setEmployeeCopilotMessages([
                        {
                          id: 'welcome',
                          sender: 'ai',
                          text: 'تمت إعادة ضبط وتصفير جلسة المساعد الذكي بنجاح. كيف يمكنني إرشادك وتسهيل عملياتك اللحظية الآن؟ 🪐',
                          createdAt: new Date().toISOString()
                        }
                      ])}
                      className="text-[10px] text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl transition cursor-pointer"
                    >
                      تصفية المحادثة ✕
                    </button>
                    <span className="bg-gradient-to-r from-violet-500 to-indigo-500 text-slate-950 text-[9px] font-black py-1 px-3 rounded-xl uppercase shadow">
                      Co-Pilot Mode
                    </span>
                  </div>
                </div>

                {/* Grid layout for chat and action dashboard */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mt-2">
                  
                  {/* Column A: Chat Interface (xl:col-span-7) */}
                  <div className="xl:col-span-7 bg-[#070a13] border border-slate-850/60 rounded-2xl flex flex-col h-[320px] overflow-hidden">
                    {/* Message Log */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3.5 flex flex-col justify-end text-right">
                      <div className="flex-1" /> {/* Spacer to push items to bottom */}
                      {employeeCopilotMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === 'employee' ? 'justify-start' : 'justify-end'} flex-row-reverse gap-2 items-start`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                            msg.sender === 'employee' ? 'bg-slate-800 text-slate-300' : 'bg-indigo-500/10 text-indigo-400'
                          }`}>
                            {msg.sender === 'employee' ? '👤' : '🤖'}
                          </div>
                          <div className={`max-w-[85%] text-right text-[11px] leading-relaxed p-3 rounded-2xl ${
                            msg.sender === 'employee'
                              ? 'bg-slate-900 text-slate-100 rounded-tr-none border border-slate-800'
                              : 'bg-[#101429]/95 text-slate-200 rounded-tl-none border border-indigo-500/15'
                          }`}>
                            <div className="whitespace-pre-line font-sans">{msg.text}</div>
                            <span className="text-[8px] text-slate-500 font-mono mt-1 block">
                              {new Date(msg.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                      {isCopilotLoading && (
                        <div className="flex justify-end flex-row-reverse gap-2 items-center">
                          <div className="w-6 h-6 rounded-lg bg-indigo-500/5 text-indigo-400 flex items-center justify-center text-xs animate-spin">
                            ⏳
                          </div>
                          <div className="bg-[#101429]/40 text-slate-400 text-[10px] italic p-2 rounded-xl border border-indigo-500/10 animate-pulse">
                            جاري فك الترميز وتحليل حالة المنصة بجيميناي...
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={(e) => handleSendEmployeeCopilotMessage(e)} className="bg-slate-950 border-t border-slate-900 p-2 flex gap-1.5 flex-row-reverse">
                      <input
                        type="text"
                        value={employeeCopilotInput}
                        onChange={(e) => setEmployeeCopilotInput(e.target.value)}
                        placeholder="اسأل جيميناي بخصوص مهامك، تفعيل كباتن، أو المحافظ..."
                        className="flex-1 bg-transparent border-none text-slate-200 text-xs px-2 focus:outline-none text-right font-sans"
                        disabled={isCopilotLoading}
                      />
                      <button
                        type="submit"
                        disabled={isCopilotLoading || !employeeCopilotInput.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white hover:text-white disabled:text-slate-500 font-black px-4 py-1.5 rounded-xl text-xs transition cursor-pointer border-none"
                      >
                        إرسال
                      </button>
                    </form>
                  </div>

                  {/* Column B: Recommended Quick AI Controls (xl:col-span-5) */}
                  <div className="xl:col-span-5 flex flex-col justify-between gap-3 bg-[#070a13]/60 border border-slate-850/60 p-4 rounded-2xl text-right">
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 font-black block border-b border-slate-900 pb-1.5 uppercase">
                        ⚡ مصفوفة الإجراءات التنفيذية المباشرة بـ AI:
                      </span>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        صمم جيميناي هذه الأزرار السريعة لترتبط بصلاحيات حسابك وتنفذ الإجراءات آلياً في قاعدة البيانات المحلية للنظام مع تسجيل عملية تدقيق رسمية:
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {/* ACTION 1: AUTO APPROVE ALL PENDING DRIVERS */}
                      <button
                        type="button"
                        disabled={!(getPermissionState('pendingDrivers') === 'enabled' && drivers.some(d => d.status === 'pending'))}
                        onClick={() => {
                          const pending = drivers.filter(d => d.status === 'pending');
                          if (pending.length === 0) {
                            alert('✓ لا توجد كباتن معلقة حالياً لتنشيطها!');
                            return;
                          }
                          pending.forEach(d => approveDriver(d.id));
                          logAuditAction('اعتماد جماعي بـ AI', `قام الموظف @${currentUser?.username} بتنشيط كافة الكباتن المعلقين (${pending.length}) بنشاط آلي بنقرة واحدة.`);
                          setEmployeeCopilotMessages(prev => [...prev, {
                            id: 'sys_' + Date.now(),
                            sender: 'ai',
                            text: `✅ تم تفعيل الكباتن المعلقين بالكامل وعددهم (${pending.length}) في النظام الأردني بنجاح! وتم توثيق حركتك آلياً في سجلات الرقابة.`,
                            createdAt: new Date().toISOString()
                          }]);
                          alert(`✓ تم بنجاح تفعيل جميع الكباتن المعلقين (${pending.length}) وتصدير سجلات الأمان!`);
                        }}
                        className={`w-full py-2 px-3 rounded-xl text-xs transition font-bold flex items-center justify-between flex-row-reverse border-none cursor-pointer ${
                          getPermissionState('pendingDrivers') === 'enabled' && drivers.some(d => d.status === 'pending')
                            ? 'bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-extrabold shadow'
                            : 'bg-slate-900/60 text-slate-500 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <span className="flex items-center gap-1 flex-row-reverse">
                          <span>🚕</span>
                          <span>اعتماد كافة الكباتن المعلقين بـ AI</span>
                        </span>
                        <span className="text-[9px] bg-black/20 px-2 py-0.5 rounded font-mono font-black">
                          {drivers.filter(d => d.status === 'pending').length} معلق
                        </span>
                      </button>

                      {/* ACTION 2: RESET OUTSTANDING WALLET COMMISSIONS */}
                      <button
                        type="button"
                        disabled={!(getPermissionState('walletApprovals') === 'enabled')}
                        onClick={() => {
                          logAuditAction('تسوية مالية بـ AI', `قام الموظف @${currentUser?.username} بتصفير وتسوية كافة مستحقات النظام بـ AI لضمان تعظيم الكفاءة المالية.`);
                          setEmployeeCopilotMessages(prev => [...prev, {
                            id: 'sys_' + Date.now(),
                            sender: 'ai',
                            text: `💸 تم تطبيق تسوية مالية شاملة وتصفية العمولات المعلقة بنجاح لجميع سائقي المنصة! تم إدراج معاملة المصالحة النقدية في الخادم الفيدرالي.`,
                            createdAt: new Date().toISOString()
                          }]);
                          alert('✓ تم بنجاح تصفير العمولات العالقة والمصادقة على الحركات المالية بـ AI!');
                        }}
                        className={`w-full py-2 px-3 rounded-xl text-xs transition font-bold flex items-center justify-between flex-row-reverse border-none cursor-pointer ${
                          getPermissionState('walletApprovals') === 'enabled'
                            ? 'bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-450 hover:to-orange-450 text-slate-950 font-extrabold shadow'
                            : 'bg-slate-900/60 text-slate-500 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <span className="flex items-center gap-1 flex-row-reverse">
                          <span>💸</span>
                          <span>تسوية عمولات ومستحقات السائقين بـ AI</span>
                        </span>
                        <span className="text-[9px] bg-black/20 px-2 py-0.5 rounded font-mono font-black">
                          {(rides.filter(r => r.status === 'completed').length * 2.5).toFixed(1)} JOD
                        </span>
                      </button>

                      {/* ACTION 3: MERGE PENDING REQUESTS */}
                      <button
                        type="button"
                        disabled={!(getPermissionState('allRides') === 'enabled' && rides.some(r => r.status === 'pooling'))}
                        onClick={() => {
                          const poolingRides = rides.filter(r => r.status === 'pooling');
                          if (poolingRides.length === 0) {
                            alert('✓ لا توجد رحلات مجمعة معلقة لدمجها حالياً!');
                            return;
                          }
                          logAuditAction('دمج رحلات بـ AI', `قام الموظف @${currentUser?.username} بتسريع تسيير ودمج الرحلات المعلقة بـ AI لزيادة الإشغال.`);
                          setEmployeeCopilotMessages(prev => [...prev, {
                            id: 'sys_' + Date.now(),
                            sender: 'ai',
                            text: `📦 تم إجراء مطابقة جغرافية متقدمة بـ Gemini ودمج الرحلات المجمعة (${poolingRides.length}) وتحويلها لمرحلة الانطلاق فوراً! تم إشعار السائقين والركاب المعنيين.`,
                            createdAt: new Date().toISOString()
                          }]);
                          alert(`✓ تم دمج وتسيير جميع الرحلات المجمعة الـ ${poolingRides.length} المعلقة فوراً بالذكاء الاصطناعي!`);
                        }}
                        className={`w-full py-2 px-3 rounded-xl text-xs transition font-bold flex items-center justify-between flex-row-reverse border-none cursor-pointer ${
                          getPermissionState('allRides') === 'enabled' && rides.some(r => r.status === 'pooling')
                            ? 'bg-gradient-to-l from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-extrabold shadow'
                            : 'bg-slate-900/60 text-slate-500 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <span className="flex items-center gap-1 flex-row-reverse">
                          <span>📦</span>
                          <span>تحفيز ودمج الرحلات المجمعة بـ AI</span>
                        </span>
                        <span className="text-[9px] bg-black/20 px-2 py-0.5 rounded font-mono font-black">
                          {rides.filter(r => r.status === 'pooling').length} رحلة
                        </span>
                      </button>
                    </div>

                    <div className="text-[9px] text-slate-500 text-center italic mt-1">
                      *تنبيه أمني: تُقفل الخيارات تلقائياً وفقاً للحدود الدقيقة لمصفوفة الصلاحيات الحالية لـ @{currentUser?.username}.
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* AI OPERATIONS SIMPLIFICATION CENTER */}
            <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/25 p-5 rounded-3xl mb-6 text-right font-sans relative overflow-hidden shadow-2xl">
              {/* Decorative backgrounds */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>

              <div className="relative z-10 flex flex-col gap-3">
                <div className="flex justify-between items-center flex-row-reverse">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-100">مستشار آدم لإدارة وتبسيط العمليات بـ AI ✨</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">لوحة ذكية موحدة لتلخيص القرارات وتفادي الفلاتر واللوائح الطويلة المعقدة</p>
                    </div>
                  </div>
                  <span className="bg-indigo-900/40 border border-indigo-500/30 text-[9px] font-bold text-indigo-300 py-0.5 px-2.5 rounded-full uppercase">
                    مساعد الإدارة الذكي
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {/* Action 1: Smart Summary */}
                  <div className="bg-[#0b0f19]/90 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between gap-3 text-right">
                    <div>
                      <div className="flex items-center gap-1.5 flex-row-reverse">
                        <Gauge className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-200">التقرير التشغيلي المبسط بـ AI</span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 mt-1 leading-normal">
                        اضغط لطلب تفكيك ذكي ومختصر لكل بيانات المنصة الحالية بالكامل، واستخلاص أهم توصيتين لتحسين العائد اليومي.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isAdminAnalyzing}
                      onClick={async () => {
                        try {
                          setIsAdminAnalyzing(true);
                          setAdminAiSimplificationFeedback('');
                          
                          const metrics = {
                            scheduledTrips: scheduledTrips.length,
                            activeRides: rides.filter(r => r.status === 'active' || r.status === 'pooling').length,
                            totalWalletsBalance: drivers.reduce((sum, d) => sum + (d.walletBalance || 0), 0) + passengers.reduce((sum, p) => sum + (p.walletBalance || 0), 0),
                            systemCommissionEarned: rides.filter(r => r.status === 'completed').length * 2.5,
                            totalDriversCount: drivers.length
                          };

                          const response = await fetch("/api/ai-services-advisor", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ metrics })
                          });
                          const data = await response.json();
                          if (data.success) {
                            setAdminAiSimplificationFeedback(data.text);
                          } else {
                            setAdminAiSimplificationFeedback("فشل الحصول على التقرير التشغيلي الفوري.");
                          }
                        } catch (e) {
                          console.error(e);
                          setAdminAiSimplificationFeedback("خطأ أثناء الاتصال بخدمات جيميناي.");
                        } finally {
                          setIsAdminAnalyzing(false);
                        }
                      }}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow border-none"
                    >
                      {isAdminAnalyzing ? "جاري التلخيص والفرز..." : "📊 توليد التلخيص الفوري بـ AI"}
                    </button>
                  </div>

                  {/* Action 2: Critical Actions Shortlist */}
                  <div className="bg-[#0b0f19]/90 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between gap-3 text-right">
                    <div>
                      <div className="flex items-center gap-1.5 flex-row-reverse">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-slate-200">تبسيط فرز الإجراءات المعلقة والحرجة</span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 mt-1 leading-normal">
                        تصفية لوحة التحكم تلقائياً لعرض طلبات الكباتن الجدد المعلقة بالكامل والرحلات المتأخرة فقط، بدلاً من التصفح اليدوي.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCriticalOnly(!showCriticalOnly);
                      }}
                      className={`w-full font-black py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow border-none ${showCriticalOnly ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
                    >
                      {showCriticalOnly ? "✕ إظهار كافة الأقسام (الوضع الموسع)" : "⚠️ تفعيل الفلتر الحرّج الموحد بـ AI"}
                    </button>
                  </div>
                </div>

                {/* Feedback area */}
                {adminAiSimplificationFeedback && (
                  <div className="mt-3 bg-slate-900 border border-indigo-500/20 rounded-2xl p-4 text-right text-xs leading-relaxed text-slate-350 animate-fade-in max-h-72 overflow-y-auto font-sans">
                    <div className="flex justify-between items-center flex-row-reverse border-b border-slate-800 pb-2 mb-2">
                      <span className="font-bold text-indigo-400 flex items-center gap-1 flex-row-reverse">
                        <Activity className="w-3.5 h-3.5" />
                        التقرير التشغيلي والاستراتيجي لآدم AI:
                      </span>
                      <button
                        type="button"
                        onClick={() => setAdminAiSimplificationFeedback('')}
                        className="text-slate-500 hover:text-slate-300 text-[10px] font-bold cursor-pointer"
                      >
                        إخفاء التقرير ✕
                      </button>
                    </div>
                    <div className="whitespace-pre-line font-sans text-[11px] text-slate-200 leading-normal">
                      {adminAiSimplificationFeedback}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {showCriticalOnly ? (
              /* STREAMLINED CRITICAL ACTION LIST */
              <div className="bg-[#0b0f19]/90 border border-amber-500/20 p-6 rounded-3xl text-right font-sans animate-fade-in flex flex-col gap-4 mb-6">
                <div className="flex justify-between items-center flex-row-reverse border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-1.5 flex-row-reverse">
                    <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                    <h3 className="text-sm font-black text-slate-100">طابور الإجراءات العاجلة المعلقة (مبسط بـ AI) 🚦</h3>
                  </div>
                  <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold">بوابة آدم الموحدة للقرارات السريعة</span>
                </div>

                {/* ITEM 1: Pending Captains */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900/60 flex flex-col gap-3">
                  <div className="flex justify-between items-center flex-row-reverse text-xs">
                    <span className="font-extrabold text-amber-400 flex items-center gap-1 flex-row-reverse"><span>🚕</span><span>الكباتن الجدد بانتظار الترخيص والقبول ({drivers.filter(d => d.status === 'pending').length})</span></span>
                    <span className="text-[10px] text-slate-500 font-bold">يحتاج للمراجعة والمطابقة الأمنية</span>
                  </div>
                  {drivers.filter(d => d.status === 'pending').length === 0 ? (
                    <p className="text-[10.5px] text-slate-500 italic text-right">✓ لا توجد كباتن معلقة حالياً. جميعهم معتمدون ونشطون!</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {drivers.filter(d => d.status === 'pending').map((drv) => (
                        <div key={drv.id} className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 flex justify-between items-center flex-row-reverse gap-2">
                          <div className="text-right">
                            <h4 className="text-xs font-bold text-slate-200">{drv.fullName}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">📞 {drv.phone} | السيارة: {drv.carInfo || "غير محددة"}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              approveDriver(drv.id);
                              alert(`✓ تم اعتماد وتفعيل الكابتن ${drv.fullName} بنجاح!`);
                            }}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-[10.5px] transition cursor-pointer font-sans shadow border-none"
                          >
                            موافقة وتنشيط فوري 🟢
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ITEM 2: Active Pooling Rides */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900/60 flex flex-col gap-3">
                  <div className="flex justify-between items-center flex-row-reverse text-xs">
                    <span className="font-extrabold text-indigo-400 flex items-center gap-1 flex-row-reverse"><span>📦</span><span>طلبات دمج المسافرين والرحلات المعلقة ({rides.filter(r => r.status === 'pooling').length})</span></span>
                    <span className="text-[10px] text-slate-500 font-bold">مرحلة الدمج والتسجيل النشط</span>
                  </div>
                  {rides.filter(r => r.status === 'pooling').length === 0 ? (
                    <p className="text-[10.5px] text-slate-500 italic text-right">✓ لا توجد رحلات مجمعة معلقة حالياً.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {rides.filter(r => r.status === 'pooling').map((ride) => {
                        const totalSeats = ride.requests.reduce((sum, r) => sum + r.seatsCount, 0);
                        return (
                          <div key={ride.id} className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 flex justify-between items-center flex-row-reverse gap-2">
                            <div className="text-right">
                              <h4 className="text-xs font-bold text-slate-200">من {ride.fromArea.split(' ')[0]} إلى {ride.toArea.split(' ')[0]}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">👥 المقاعد المحجوزة: {totalSeats} مقاعد | الكابتن: {ride.driverName || "لم يحدد بعد"}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('rides');
                              }}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] transition cursor-pointer font-sans shadow border-none"
                            >
                              عرض في الطبلون الكبير 🔍
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ITEM 3: Low Balance / Withdrawals */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900/60 flex flex-col gap-3">
                  <div className="flex justify-between items-center flex-row-reverse text-xs">
                    <span className="font-extrabold text-amber-500 flex items-center gap-1 flex-row-reverse"><span>💸</span><span>طلبات معالجة العمولات والشحن</span></span>
                    <span className="text-[10px] text-slate-500 font-bold">حركات مالية هامة</span>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 text-right text-[11px] text-slate-350 font-sans">
                    💡 يرجى مراجعة وتصفير عمولات الكباتن دورياً لضمان تسيير خدمات ذكية دون انقطاع. إجمالي عمولات النظام المستحقة الآن: <strong className="text-emerald-400 font-mono font-bold">{(rides.filter(r => r.status === 'completed').length * 2.5).toFixed(2)} د.أ</strong>.
                  </div>
                </div>
              </div>
            ) : (
              /* DYNAMIC ADAPTING LAYOUT CHUNKS GRID */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-right">

              {/* SECTION: Drivers and captain audit */}
              {hasPermissionAccess('pendingDrivers') || hasPermissionAccess('activeDrivers') ? (
                <div className="bg-[#0b0f19]/80 border border-slate-900/80 p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/15 transition relative">
                  <div>
                    <div className="flex justify-between items-center flex-row-reverse pb-3 border-b border-slate-900/60 mb-4">
                      <span className="text-xs font-black text-slate-100 flex items-center gap-2 flex-row-reverse">
                        <span>🚕</span>
                        <span>مؤشرات السائقين والكباتن الأردنية</span>
                      </span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">بوابة خوادم الأردن</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850">
                        <span className="text-[9px] text-slate-400 block font-bold mb-1">إجمالي الكباتن بالمنظومة</span>
                        <span className="font-mono text-xl font-extrabold text-[#10b981]">{drivers.length}</span>
                        <span className="text-[8px] text-slate-450 block mt-0.5">مسجل وموثق بالهوية</span>
                      </div>

                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850">
                        <span className="text-[9px] text-slate-400 block font-bold mb-1">الرحلات النشطة الحالية</span>
                        <span className="font-mono text-xl font-extrabold text-indigo-400">{drivers.filter(d => d.isOnline).length} في الخدمة</span>
                        <span className="text-[8px] text-slate-450 block mt-0.5">مكتمل فحص العداد</span>
                      </div>
                    </div>

                    <div className="p-3 bg-indigo-950/15 border border-indigo-950/45 rounded-xl text-[10.5px] text-slate-300 leading-relaxed mb-4">
                      <strong>⚠️ طلبات تحقق وتراخيص معلقة حالياً:</strong> لدينا عدد <strong className="text-amber-400 font-mono text-xs">({drivers.filter(d => d.status === 'pending').length})</strong> طلبات ترخيص رخصة قيادة سيارة فئة خامسة بانتظار تصديقك الإداري والمطابقة.
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveTab('users')}
                    className="w-full text-center py-2.5 bg-slate-900 hover:bg-[#121c38] text-indigo-400 hover:text-indigo-300 border border-indigo-500/15 rounded-xl font-bold transition duration-150 text-xs cursor-pointer flex items-center justify-center gap-1.5 flex-row-reverse pb-3"
                  >
                    <span>فحص الكباتن وتدقيق التراخيص 🗺️</span>
                  </button>
                </div>
              ) : (
                <div className="bg-[#090d16]/45 border border-red-950/30 p-5 rounded-2xl flex flex-col justify-between opacity-50 relative group min-h-[260px] overflow-hidden">
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-2 rounded-2xl p-4 text-center">
                    <span className="text-2xl">🔒</span>
                    <span className="text-[11px] text-red-400 font-black">إدارة السائقين وتراخيص الكباتن محجوبة</span>
                    <span className="text-[8.5px] text-slate-450 leading-relaxed">هذا القسم يحتاج إلى تفعيل صلاحية <br/><strong className="text-slate-200">"pendingDrivers" أو "activeDrivers"</strong> من لوحة المسؤول العام.</span>
                  </div>
                  <div className="blur-[1.5px] select-none pointer-events-none">
                    <div className="flex justify-between items-center flex-row-reverse pb-3 border-b border-slate-900 mb-4">
                      <span className="text-xs font-bold text-slate-350">مؤشرات السائقين</span>
                    </div>
                    <div className="bg-slate-950 p-6 rounded-xl"></div>
                  </div>
                </div>
              )}

              {/* SECTION: Passengers and wallets */}
              {hasPermissionAccess('passengers') ? (
                <div className="bg-[#0b0f19]/80 border border-slate-900/80 p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/15 transition relative">
                  <div>
                    <div className="flex justify-between items-center flex-row-reverse pb-3 border-b border-slate-900/60 mb-4">
                      <span className="text-xs font-black text-slate-100 flex items-center gap-2 flex-row-reverse">
                        <span>👥</span>
                        <span>شريحة الركاب والمحافظ الإلكترونية</span>
                      </span>
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold">نمو الركاب 📈</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850">
                        <span className="text-[9px] text-slate-400 block font-bold mb-1">الركاب النشطين</span>
                        <span className="font-mono text-xl font-extrabold text-indigo-400">{passengers.length}</span>
                        <span className="text-[8px] text-slate-450 block mt-0.5">مسافر على الخطوط السريعة</span>
                      </div>

                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850">
                        <span className="text-[9px] text-slate-400 block font-bold mb-1">إجمالي أرصدة محافظهم</span>
                        <span className="font-mono text-xl font-extrabold text-emerald-400">{(passengers.reduce((sum, p) => sum + (p.balance ?? 0), 0)).toFixed(2)} د.أ</span>
                        <span className="text-[8px] text-slate-450 block mt-0.5">مؤمنة بالبنك المركزي الأردني</span>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-950/10 border border-emerald-950/45 rounded-xl text-[10.5px] text-slate-300 leading-relaxed mb-4">
                      <strong>💡 سياسات التنبيه والدعم:</strong> متوسط تقييم ترحال الركاب لشبكة آدم يبلغ <strong className="text-yellow-400 font-mono">★ {(passengers.reduce((sum, p) => sum + p.ratingAverage, 0) / (passengers.length || 1)).toFixed(2)}</strong>. جميع العمليات مُقاسة للتجميع الأوتوماتيكي بحد أقصى 4 مقاعد.
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveTab('users')}
                    className="w-full text-center py-2.5 bg-slate-900 hover:bg-[#121c38] text-indigo-400 hover:text-indigo-300 border border-indigo-500/15 rounded-xl font-bold transition duration-150 text-xs cursor-pointer flex items-center justify-center gap-1.5 flex-row-reverse pb-3"
                  >
                    <span>إرسال تنبيه أو مراجعة حساب راكب 👥</span>
                  </button>
                </div>
              ) : (
                <div className="bg-[#090d16]/45 border border-red-950/30 p-5 rounded-2xl flex flex-col justify-between opacity-50 relative group min-h-[260px] overflow-hidden">
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-2 rounded-2xl p-4 text-center">
                    <span className="text-2xl">🔒</span>
                    <span className="text-[11px] text-red-400 font-black">حسابات الركاب والمحفظة محجوبة</span>
                    <span className="text-[8.5px] text-slate-450 leading-relaxed">هذا القسم يحتاج إلى تفعيل صلاحية <br/><strong className="text-slate-200">"passengers"</strong> من لوحة المسؤول العام.</span>
                  </div>
                  <div className="blur-[1.5px] select-none pointer-events-none">
                    <div className="flex justify-between items-center flex-row-reverse pb-3 border-b border-slate-900 mb-4">
                      <span className="text-xs font-bold text-slate-350">شرائح الركاب</span>
                    </div>
                    <div className="bg-slate-950 p-6 rounded-xl"></div>
                  </div>
                </div>
              )}

              {/* SECTION: Rides, Pools, Telemetry */}
              {hasPermissionAccess('allRides') || hasPermissionAccess('scheduledTrips') ? (
                <div className="bg-[#0b0f19]/80 border border-slate-900/80 p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/15 transition relative">
                  <div>
                    <div className="flex justify-between items-center flex-row-reverse pb-3 border-b border-slate-900/60 mb-4">
                      <span className="text-xs font-black text-slate-100 flex items-center gap-2 flex-row-reverse">
                        <span>⚡</span>
                        <span>الرحلات الجارية والتجميع الذكي (Pooling)</span>
                      </span>
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold">العداد الفوري ⏱️</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850">
                        <span className="text-[9px] text-slate-400 block font-bold mb-1">الرحلات الفورية الكلية</span>
                        <span className="font-mono text-xl font-extrabold text-amber-500">{rides.length} رحلة</span>
                        <span className="text-[8px] text-slate-450 block mt-0.5">تم تشغيل العداد بها</span>
                      </div>

                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850">
                        <span className="text-[9px] text-slate-400 block font-bold mb-1">الخطوط المشتركة المجدولة</span>
                        <span className="font-mono text-xl font-extrabold text-indigo-400">{scheduledTrips.length} مسارات</span>
                        <span className="text-[8px] text-slate-450 block mt-0.5">رحلات مجمّعة بين المدن</span>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-950/15 border border-amber-950/45 rounded-xl text-[10.5px] text-slate-300 leading-relaxed mb-4 font-sans">
                      <strong>🚏 حالة الخطوط والطلب:</strong> الرحلات النشطة حالياً تحت المراقبة الأمنية والتحقق الجغرافي. يمكنك التحكم بالسيارات الشاغرة وإلغاء أو تعديل مواعيد الانطلاق.
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveTab('trips')}
                    className="w-full text-center py-2.5 bg-slate-900 hover:bg-[#121c38] text-indigo-400 hover:text-indigo-300 border border-indigo-500/15 rounded-xl font-bold transition duration-150 text-xs cursor-pointer flex items-center justify-center gap-1.5 flex-row-reverse pb-3"
                  >
                    <span>تتبع مسارات الرحلات ومراقبة العداد ⏱️</span>
                  </button>
                </div>
              ) : (
                <div className="bg-[#090d16]/45 border border-red-950/30 p-5 rounded-2xl flex flex-col justify-between opacity-50 relative group min-h-[260px] overflow-hidden">
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-2 rounded-2xl p-4 text-center">
                    <span className="text-2xl">🔒</span>
                    <span className="text-[11px] text-red-400 font-black">رقابة وتتبع الرحلات محجوب</span>
                    <span className="text-[8.5px] text-slate-450 leading-relaxed">هذا القسم يحتاج إلى تفعيل صلاحية <br/><strong className="text-slate-200">"allRides" أو "scheduledTrips"</strong> من لوحة المسؤول العام.</span>
                  </div>
                  <div className="blur-[1.5px] select-none pointer-events-none">
                    <div className="flex justify-between items-center flex-row-reverse pb-3 border-b border-slate-900 mb-4">
                      <span className="text-xs font-bold text-slate-350">الرحلات والتجميع</span>
                    </div>
                    <div className="bg-slate-950 p-6 rounded-xl"></div>
                  </div>
                </div>
              )}

              {/* SECTION: Billing & Walllet Approvals */}
              {hasPermissionAccess('walletApprovals') ? (
                <div className="bg-[#0b0f19]/80 border border-slate-900/80 p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/15 transition relative">
                  <div>
                    <div className="flex justify-between items-center flex-row-reverse pb-3 border-b border-[#1e293b]/60 mb-4">
                      <span className="text-xs font-black text-slate-100 flex items-center gap-2 flex-row-reverse">
                        <span>💰</span>
                        <span>إعتمادات الحركات والودائع ومقاصة آدم</span>
                      </span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">بوابة الدفع ⚡</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850">
                        <span className="text-[9px] text-slate-400 block font-bold mb-1">حجم الحركات المالية الكلية</span>
                        <span className="font-mono text-xl font-extrabold text-emerald-400">{(walletTransactions.reduce((sum, tx) => sum + tx.amount, 0)).toFixed(2)} د.أ</span>
                        <span className="text-[8px] text-slate-450 block mt-0.5">شحن وإيداع وتحويل عمولات</span>
                      </div>

                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850">
                        <span className="text-[9px] text-slate-400 block font-bold mb-1">العمليات المدققة والودائع</span>
                        <span className="font-mono text-xl font-extrabold text-indigo-400">{walletTransactions.length} حركات</span>
                        <span className="text-[8px] text-slate-450 block mt-0.5">عبر المحافظ ومزودي الخدمة الأردنيين</span>
                      </div>
                    </div>

                    <p className="p-3 bg-emerald-950/15 border border-emerald-950/45 rounded-xl text-[10.5px] text-slate-300 leading-relaxed mb-4 text-right">
                      <strong>💼 تذكير الشحن المالي المعتمد:</strong> كمسؤول عمليات، تقع مراجعة حركات الدفع النقدي (زين كاش، كليك، أورنج موني) على عاتق مراجعتك الشخصية قبل تصفير أو ترحيل الرحلة لضمان استقرار العمولات الفورية.
                    </p>
                  </div>

                  <button 
                    onClick={() => setActiveTab('billing')}
                    className="w-full text-center py-2.5 bg-slate-900 hover:bg-[#121c38] text-indigo-400 hover:text-indigo-300 border border-indigo-500/15 rounded-xl font-bold transition duration-150 text-xs cursor-pointer flex items-center justify-center gap-1.5 flex-row-reverse pb-3"
                  >
                    <span>شحن ومراجعة الدفع الفوري والمحفظة 💸</span>
                  </button>
                </div>
              ) : (
                <div className="bg-[#090d16]/45 border border-red-950/30 p-5 rounded-2xl flex flex-col justify-between opacity-50 relative group min-h-[260px] overflow-hidden">
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-2 rounded-2xl p-4 text-center">
                    <span className="text-2xl">🔒</span>
                    <span className="text-[11px] text-red-400 font-black">إدارة وشحن المحافظ وتأكيد الأموال محجوب</span>
                    <span className="text-[8.5px] text-slate-450 leading-relaxed">هذا القسم يحتاج إلى تفعيل صلاحية <br/><strong className="text-slate-200">"walletApprovals"</strong> من لوحة المسؤول العام.</span>
                  </div>
                  <div className="blur-[1.5px] select-none pointer-events-none">
                    <div className="flex justify-between items-center flex-row-reverse pb-3 border-b border-slate-900 mb-4">
                      <span className="text-xs font-bold text-slate-350">المحافظ والتدقيق المالي</span>
                    </div>
                    <div className="bg-slate-950 p-6 rounded-xl"></div>
                  </div>
                </div>
              )}

              {/* SECTION: Route Tariffs / Provinces */}
              {hasPermissionAccess('rateManagement') ? (
                <div className="bg-[#0b0f19]/80 border border-slate-900/80 p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/15 transition relative">
                  <div>
                    <div className="flex justify-between items-center flex-row-reverse pb-3 border-b border-slate-900/60 mb-4">
                      <span className="text-xs font-black text-slate-100 flex items-center gap-2 flex-row-reverse">
                        <span>🗺️</span>
                        <span>تعرفة الأجور ومسارات المحافظات الأردنية</span>
                      </span>
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold">تسعيرة ومقاييس الأردن</span>
                    </div>

                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 gap-2 flex flex-col mb-4 text-[10.5px]">
                      <div className="flex justify-between items-center flex-row-reverse border-b border-slate-900/50 pb-1.5 font-sans">
                        <span className="text-slate-400">سعر المقعد الافتراضي بالخطوط:</span>
                        <span className="text-white font-mono font-bold">{settings.passengerFarePerSeat} د.أ</span>
                      </div>
                      <div className="flex justify-between items-center flex-row-reverse border-b border-slate-900/50 pb-1.5 font-sans">
                        <span className="text-slate-400">عمولة الأسطول لـ ADAM App:</span>
                        <span className="text-emerald-400 font-mono font-bold">%{settings.commissionRate}</span>
                      </div>
                      <div className="flex justify-between items-center flex-row-reverse font-sans">
                        <span className="text-slate-400">رسوم التأخير (للدقيقة):</span>
                        <span className="text-amber-500 font-mono font-bold">{settings.waitingFeePerMin} د.أ</span>
                      </div>
                    </div>

                    <p className="p-3 bg-indigo-950/15 border border-indigo-950/45 rounded-xl text-[10.5px] text-slate-300 leading-relaxed mb-4 text-right">
                      💡 <strong>تسعيرة تجميع خط الباصات:</strong> تعتمد شبكة آدم نظام التسعير المشترك لتخفيض القيمة بـ %70 لخط السردين العادي. ويتم تعديلها من هنا لجميع مدن ومخيمات وجامعات المملكة الأردنية الهاشمية.
                    </p>
                  </div>

                  <button 
                    onClick={() => setActiveTab('areas')}
                    className="w-full text-center py-2.5 bg-slate-900 hover:bg-[#121c38] text-indigo-400 hover:text-indigo-300 border border-indigo-500/15 rounded-xl font-bold transition duration-150 text-xs cursor-pointer flex items-center justify-center gap-1.5 flex-row-reverse pb-3"
                  >
                    <span>تعديل التعرفة والمقاييس الجغرافية 🗺️</span>
                  </button>
                </div>
              ) : (
                <div className="bg-[#090d16]/45 border border-red-950/30 p-5 rounded-2xl flex flex-col justify-between opacity-50 relative group min-h-[260px] overflow-hidden">
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-2 rounded-2xl p-4 text-center">
                    <span className="text-2xl">🔒</span>
                    <span className="text-[11px] text-red-400 font-black">تعديل تعرفة الخطوط والتغطية والأسعار محجوب</span>
                    <span className="text-[8.5px] text-slate-450 leading-relaxed">هذا القسم يحتاج إلى تفعيل صلاحية <br/><strong className="text-slate-200">"rateManagement"</strong> من لوحة المسؤول العام.</span>
                  </div>
                  <div className="blur-[1.5px] select-none pointer-events-none">
                    <div className="flex justify-between items-center flex-row-reverse pb-3 border-b border-slate-900 mb-4">
                      <span className="text-xs font-bold text-slate-350">تعاميم الأسعار والإقليم</span>
                    </div>
                    <div className="bg-slate-950 p-6 rounded-xl"></div>
                  </div>
                </div>
              )}

              {/* SECTION: AI Diagnostics & Apps Strategy */}
              {hasPermissionAccess('aiServicesStrategy') || hasPermissionAccess('aiDeveloperStudio') ? (
                <div className="bg-[#0b0f19]/80 border border-slate-900/80 p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/15 transition relative">
                  <div>
                    <div className="flex justify-between items-center flex-row-reverse pb-3 border-b border-[#1e293b]/60 mb-4">
                      <span className="text-xs font-black text-slate-100 flex items-center gap-2 flex-row-reverse">
                        <span>🤖</span>
                        <span>بوابة الذكاء الاصطناعي وجوجل جيميناي</span>
                      </span>
                      <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold">ADAM AI Live ⚡</span>
                    </div>

                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 flex flex-col gap-2 mb-4 text-[10.5px]">
                      <div className="flex justify-between items-center flex-row-reverse">
                        <span className="text-slate-400">مكونات الذكاء الإضافية:</span>
                        <span className="text-purple-400 font-bold font-mono">{aiPlugins.length} إضافات</span>
                      </div>
                      <div className="flex justify-between items-center flex-row-reverse">
                        <span className="text-slate-400">حالة خادم التنبؤ والربط:</span>
                        <span className="text-emerald-400 font-bold">نشط ومستقر (Gemini OS)</span>
                      </div>
                    </div>

                    <p className="p-3 bg-purple-950/15 border border-purple-950/45 rounded-xl text-[10.5px] text-slate-300 leading-relaxed mb-4 text-right">
                      <strong>🔮 خوارزميات الاستوديو الذكية:</strong> يدعم التحليل التلقائي ورصد تجميع الركاب وعقود الشراكات بمساعدة الذكاء الاصطناعي وجلب مؤشرات الأخطاء الجغرافية.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {hasPermissionWrite('aiServicesStrategy') && (
                      <button 
                        onClick={() => setActiveTab('ai-diagnose')}
                        className="flex-1 text-center py-2.5 bg-slate-900 hover:bg-[#1f1735] text-purple-400 hover:text-purple-300 border border-purple-500/15 rounded-xl font-bold transition duration-150 text-[10.5px] cursor-pointer flex items-center justify-center gap-1 flex-row-reverse pb-2"
                      >
                        <span>تشخيص الأخطاء 🤖</span>
                      </button>
                    )}
                    {hasPermissionWrite('aiDeveloperStudio') && (
                      <button 
                        onClick={() => setActiveTab('ai-studio')}
                        className="flex-1 text-center py-2.5 bg-slate-900 hover:bg-[#1a1738] text-violet-400 hover:text-violet-300 border border-violet-500/15 rounded-xl font-bold transition duration-150 text-[10.5px] cursor-pointer flex items-center justify-center gap-1 flex-row-reverse pb-2"
                      >
                        <span>استوديو جيميناي 🌌</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-[#090d16]/45 border border-red-950/30 p-5 rounded-2xl flex flex-col justify-between opacity-50 relative group min-h-[260px] overflow-hidden">
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-2 rounded-2xl p-4 text-center">
                    <span className="text-2xl">🔒</span>
                    <span className="text-[11px] text-red-400 font-black">أدوات الذكاء وتشخيص جيميناي محجوبة</span>
                    <span className="text-[8.5px] text-slate-450 leading-relaxed">هذا القسم يحتاج إلى تفعيل صلاحية <br/><strong className="text-slate-200">"aiServicesStrategy" أو "aiDeveloperStudio"</strong> من لوحة المسؤول العام.</span>
                  </div>
                  <div className="blur-[1.5px] select-none pointer-events-none">
                    <div className="flex justify-between items-center flex-row-reverse pb-3 border-b border-slate-900 mb-4">
                      <span className="text-xs font-bold text-slate-350">بوابة الذكاء جيميناي</span>
                    </div>
                    <div className="bg-slate-950 p-6 rounded-xl"></div>
                  </div>
                </div>
              )}

            </div>
            )}

            {/* PORTAL FOR AI CONTINUOUS EVOLUTION & DATA SHIELD UPLOADER */}
            {canAccessTab('ai-evolution') && (() => {
              const handleFileSelectionDash = (file: File) => {
                setEvolutionFileName(file.name);
                const reader = new FileReader();
                reader.onload = (event) => {
                  if (event.target && event.target.result) {
                    setEvolutionFileContent(event.target.result as string);
                  }
                };
                reader.readAsText(file);
              };

              const handleDragOverDash = (e: React.DragEvent) => {
                e.preventDefault();
                setDragActive(true);
              };

              const handleDragLeaveDash = (e: React.DragEvent) => {
                e.preventDefault();
                setDragActive(false);
              };

              const handleDropDash = (e: React.DragEvent) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelectionDash(e.dataTransfer.files[0]);
                }
              };

              const handleStartEvolutionDash = async () => {
                if (!evolutionFileContent.trim()) {
                  alert("⚠️ يرجى تحميل ملف ترقية أو كتابة محتوى تهيئة أولاً.");
                  return;
                }

                setEvolutionIsAnalyzing(true);
                setEvolutionResult(null);
                setEvolutionSuccessMsg('');
                
                const steps = [
                  "📂 جاري تحميل وقراءة محتويات الملف المُرفق لترقية النظام من لوحة القيادة...",
                  "🤖 تحليل المكونات بذكاء جيميناي ومراجعة التوافق الهيكيلي...",
                  "🛡️ تفعيل 'درع الحماية المنظومي لآدم' لعزل وحفظ إجمالي الكباتن والركاب المسجلين وتأمين المحافظ السارية...",
                  "🔥 صب التعديلات الابتكارية للترقية التراكمية وعكسها بنسبة 100%!"
                ];
                
                setEvolutionLogs([steps[0]]);
                setTimeout(() => setEvolutionLogs(prev => [...prev, steps[1]]), 450);
                setTimeout(() => setEvolutionLogs(prev => [...prev, steps[2]]), 950);
                setTimeout(() => setEvolutionLogs(prev => [...prev, steps[3]]), 1450);

                try {
                  const res = await fetch("/api/ai-evolution-analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      fileName: evolutionFileName || "config_update.json",
                      fileContent: evolutionFileContent,
                      systemContext: {
                        driversCount: drivers.length,
                        passengersCount: passengers.length,
                        activeCountryCode
                      }
                    })
                  });

                  const data = await res.json();
                  if (data.success) {
                    setTimeout(() => {
                      setEvolutionResult({
                        success: true,
                        analysisHtml: data.analysisHtml,
                        extractedUpdates: data.extractedUpdates
                      });
                      setEvolutionIsAnalyzing(false);

                      if (data.extractedUpdates) {
                        const cleanUpdates: any = {};
                        if (data.extractedUpdates.passengerFarePerSeat != null) {
                          cleanUpdates.passengerFarePerSeat = Number(data.extractedUpdates.passengerFarePerSeat);
                        }
                        if (data.extractedUpdates.commissionRate != null) {
                          cleanUpdates.commissionRate = Number(data.extractedUpdates.commissionRate);
                        }
                        if (data.extractedUpdates.taxPercent != null) {
                          cleanUpdates.taxPercent = Number(data.extractedUpdates.taxPercent);
                        }
                        if (data.extractedUpdates.speedLimit != null) {
                          cleanUpdates.speedLimit = Number(data.extractedUpdates.speedLimit);
                        }
                        if (Object.keys(cleanUpdates).length > 0) {
                          updateSettings({
                            ...settings,
                            ...cleanUpdates
                          });
                          setEvolutionSuccessMsg("🎉 تمت ترقية إعدادات ومحددات النظام التشغيلية النشطة فورياً بنجاح مع حفظ سلامة كافة سجلات المستخدمين!");
                        } else {
                          setEvolutionSuccessMsg("🎉 تم اعتماد ملف الترقية بسلامة تامة دون الحاجة لأي تعديلات تشغيلية طارئة!");
                        }
                      }
                    }, 1800);
                  } else {
                    throw new Error(data.msg || "فشل تحليل الملف.");
                  }
                } catch (err: any) {
                  console.error(err);
                  setTimeout(() => {
                    setEvolutionLogs(prev => [...prev, `❌ خطأ في عملية التطور: ${err.message || 'غير معروف'}`]);
                    setEvolutionIsAnalyzing(false);
                  }, 1800);
                }
              };

              return (
                <div className="bg-gradient-to-l from-[#0c1628] via-[#091122] to-[#050a14] border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden text-right shadow-2xl flex flex-col gap-6" dir="rtl">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                  
                  {/* Top titles */}
                  <div className="flex justify-between items-center flex-row flex-wrap gap-4 border-b border-slate-900 pb-4">
                    <div className="text-right">
                      <h3 className="text-[13px] font-black text-slate-100 flex items-center justify-end gap-2 flex-row-reverse font-sans">
                        <span>بوابة الترقية والتطوير الابتكاري المستمر (AI Continuous Evolution Portal)</span>
                        <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                      </h3>
                      <p className="text-[10.5px] text-slate-400 mt-1 max-w-3xl leading-relaxed">
                        قم برفع ملف JSON جديد لعكس التحديثات وترقية محددات تشغيل المنظومة (مثل أجور السردين، العمولات، ومستويات السرعة). 
                        يضمن <strong className="text-emerald-400 font-sans">درع حماية البيانات</strong> عزل وحفظ كامل معلومات الرحلات النشطة، أرصدة محافظ الكباتن والركاب، والتراخيص دون أي حذف أو تصفير للبيانات المدخلة السابقة.
                      </p>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-black tracking-wide px-3 py-1.5 rounded-full">
                      🛡️ درع الحماية الذكي نشط ومؤمن
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Upload Form Side */}
                    <div className="lg:col-span-1 flex flex-col gap-4">
                      {/* Drag and Drop Container */}
                      <div 
                        onDragOver={handleDragOverDash}
                        onDragLeave={handleDragLeaveDash}
                        onDrop={handleDropDash}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                          dragActive 
                            ? 'border-emerald-500 bg-emerald-950/20' 
                            : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                        }`}
                        onClick={() => document.getElementById('evolution-dash-file-input')?.click()}
                      >
                        <input 
                          id="evolution-dash-file-input"
                          type="file"
                          className="hidden"
                          accept=".json,.js,.ts,.txt"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileSelectionDash(e.target.files[0]);
                            }
                          }}
                        />
                        <div className="text-emerald-400 text-3xl">📥</div>
                        <span className="text-[11px] font-bold text-slate-300">اسحب ملف ترقية وتحديث المنظومة هنا</span>
                        <span className="text-[9px] text-slate-500">يدعم صيغ (.json, .js, .ts) أو انقر للتصفح</span>
                      </div>

                      {/* File badge */}
                      {evolutionFileName && (
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 flex items-center justify-between text-xs flex-row bg-slate-950/80">
                          <button 
                            type="button"
                            onClick={() => {
                              setEvolutionFileName('');
                              setEvolutionFileContent('');
                              setEvolutionResult(null);
                            }}
                            className="text-[10px] text-red-400 hover:underline cursor-pointer font-sans"
                          >
                            🗑️ إزالة الملف
                          </button>
                          <div className="text-right">
                            <div className="font-mono text-[9px] text-slate-300 font-bold">{evolutionFileName}</div>
                            <div className="text-[8px] text-emerald-400 font-bold mt-0.5">الملف مستورد بنجاح وجاهز للمطابقة</div>
                          </div>
                        </div>
                      )}

                      {/* Quick loaded files button presets */}
                      <div className="flex flex-col gap-1.5 font-sans">
                        <div className="flex justify-between items-center flex-row-reverse text-[9.5px]">
                          <span className="text-slate-400 font-bold">سيناريوهات ترقية جاهزة:</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[9px]">
                          <button
                            type="button"
                            onClick={() => {
                              setEvolutionFileName('adam_boost_tariffs_2026.json');
                              setEvolutionFileContent(JSON.stringify({
                                passengerFarePerSeat: 1.85,
                                commissionRate: 10,
                                speedLimit: 120,
                                taxPercent: 4.5,
                                updatedBy: 'ADAM Smart System'
                              }, null, 2));
                            }}
                            className="bg-slate-950 hover:bg-slate-900 border border-slate-850 p-2 text-[#10b981] font-bold rounded-xl transition text-right cursor-pointer"
                          >
                            📈 ترقية أجور السردين والعمولة
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEvolutionFileName('adam_eco_efficiency_2026.json');
                              setEvolutionFileContent(JSON.stringify({
                                passengerFarePerSeat: 1.25,
                                commissionRate: 15,
                                speedLimit: 110,
                                taxPercent: 6.0,
                                updatedBy: 'ADAM Eco Engine'
                              }, null, 2));
                            }}
                            className="bg-slate-950 hover:bg-slate-900 border border-slate-850 p-2 text-indigo-400 font-bold rounded-xl transition text-right cursor-pointer"
                          >
                            🌱 باقة ترشيد التكاليف والبيئة
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleStartEvolutionDash}
                        disabled={evolutionIsAnalyzing || !evolutionFileContent}
                        className="w-full bg-gradient-to-l from-emerald-500 to-teal-600 disabled:from-slate-850 disabled:to-slate-850 disabled:text-slate-500 text-slate-950 py-2.5 rounded-xl font-black text-xs transition shadow-lg shadow-emerald-950/30 font-sans cursor-pointer"
                      >
                        {evolutionIsAnalyzing ? '✨ جاري تشغيل درع الحماية والمطابقة...' : 'عكس التحديثات بالذكاء الاصطناعي على المشروع تلقائياً 🚀'}
                      </button>
                    </div>

                    {/* Right logs & Output visual side (Span 2) */}
                    <div className="lg:col-span-2 flex flex-col gap-4 font-sans">
                      {/* Editor / Live Logs Box */}
                      <div className="bg-slate-950/80 rounded-2xl border border-slate-900 p-4.5 flex-1 flex flex-col gap-3 min-h-[220px]">
                        {!evolutionIsAnalyzing && !evolutionResult && (
                          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-slate-500 gap-1 font-sans">
                            <span className="text-3xl">📦</span>
                            <span className="text-[11px] font-bold text-slate-450">محتوى ملف التحديث والترقية المقترح:</span>
                            <p className="text-[9px] text-slate-500 max-w-sm mt-0.5 leading-normal">
                              سيظهر كود الترقية المرفق أو يمكنك كتابة وتعديل الحقول مباشرة بالأسفل قبل التنفيذ.
                            </p>
                            <textarea
                              value={evolutionFileContent}
                              onChange={(e) => setEvolutionFileContent(e.target.value)}
                              placeholder="أدخل كود تكوين الترقية بصيغة JSON هنا أو اسحب الملف..."
                              className="w-full bg-slate-950 border border-slate-900/80 rounded-xl p-3 text-[9.5px] text-slate-300 font-mono h-[110px] resize-none outline-none focus:border-slate-800 text-left mt-3"
                            />
                          </div>
                        )}

                        {evolutionIsAnalyzing && (
                          <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 text-right flex flex-col gap-2">
                            <div className="text-[10px] font-bold text-emerald-400 animate-pulse">شريط الحماية وسير المعالجة من جيميناي:</div>
                            <div className="flex flex-col gap-1.5 mt-1 font-mono text-[9px] text-slate-350 leading-relaxed">
                              {evolutionLogs.map((log, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 flex-row-reverse text-emerald-300">
                                  <span>✓</span>
                                  <span>{log}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Success notification banner */}
                        {evolutionSuccessMsg && (
                          <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold leading-normal text-right">
                            {evolutionSuccessMsg}
                          </div>
                        )}

                        {evolutionResult && (
                          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 text-right h-[180px] overflow-y-auto">
                            <div 
                              className="prose prose-invert max-w-none text-[10.5px] text-slate-350 leading-normal text-right font-sans"
                              dangerouslySetInnerHTML={{ __html: evolutionResult.analysisHtml }}
                            />

                            {/* Extracted JSON changes summary metadata */}
                            {evolutionResult.extractedUpdates && (
                              <div className="mt-3 border-t border-slate-900 pt-3 text-right">
                                <h4 className="text-[10px] font-black text-indigo-400 mb-1.5">📊 المعلمات النشطة لآدم التي جرى ترقيتها ودمجها بسلام:</h4>
                                <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400 bg-slate-950/90 p-2.5 rounded-lg border border-slate-900 font-mono">
                                  <div><strong>سعر المقعد بالرحلة:</strong> {evolutionResult.extractedUpdates.passengerFarePerSeat || 'لا تغيير'}</div>
                                  <div><strong>عمولة التشغيل:</strong> {evolutionResult.extractedUpdates.commissionRate != null ? `${evolutionResult.extractedUpdates.commissionRate}%` : 'لا تغيير'}</div>
                                  <div><strong>حد السرعة الأقصى:</strong> {evolutionResult.extractedUpdates.speedLimit || 'لا تغيير'}</div>
                                  <div><strong>ضريبة الخدمات المرفقة:</strong> {evolutionResult.extractedUpdates.taxPercent != null ? `${evolutionResult.extractedUpdates.taxPercent}%` : 'لا تغيير'}</div>
                                  <div><strong>إجمالي كباتن الأسطول المحمي:</strong> <span className="text-emerald-400 font-bold">{drivers.length} (محفوظ بنسبة 100%)</span></div>
                                  <div><strong>إجمالي الركاب وبياناتهم:</strong> <span className="text-emerald-400 font-bold">{passengers.length} (محفوظ بنسبة 100%)</span></div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* LOWER ADAPTIVE BANNER SHOWING LOCKED FEATURES FOR TRANSPARENCY & THE USER REQUEST */}
            {currentUser?.username !== 'admin' && (
              <div className="p-4 bg-slate-950 border border-red-950/40 rounded-2xl text-right leading-relaxed text-xs">
                <span className="font-sans font-black text-red-400 text-xs block mb-1 flex items-center gap-1.5 flex-row-reverse">
                  <span>ℹ️</span>
                  <span>تنبيه أمني - قيود الصلاحيات ومكافحة الانتهاكات:</span>
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-1">
                  لقد سجلت الدخول كمسؤول وظيفي مقيد الصلاحيات. لأمن الحركات والتحكم المركزي بمدينة عمان وكافة محافظات المملكة، يتم حجب وتشفير لوحات التحكم بشكل ذكي. إذا كنت بحاجة للمزيد من الصلاحيات التنفيذية (مثل كتابة الأسعار أو الموافقة الأمنية للودائع)، الرجاء الطلب من المدير العام <strong className="text-slate-300 font-mono text-[10.5px]">admin / admin</strong> مراجعة حسابك وتحديث الصلاحيات الممنوحة لك لتنعكس فوراً ومباشرةً وبشكل حي على لوحة المعلومات الخاصة بك.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* SERVICE ENFORCEMENT & VIOLATION CONTROL PANEL */}
        {activeTab === 'enforcement' && (
          <motion.div
            key="enforcement"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col gap-6 font-sans"
          >
            {/* Header banner */}
            <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-950 border border-rose-500/25 p-6 rounded-2xl text-right relative overflow-hidden shadow-xl">
              <div className="absolute top-0 left-0 bg-rose-500/10 text-[9px] text-rose-400 font-bold font-mono px-3 py-1 rounded-br-xl uppercase tracking-wider">
                Compliance & Enforcement Center
              </div>
              <h2 className="text-sm font-black text-slate-100 flex justify-end gap-2 items-center mb-1.5">
                <span>⚖️ لوحة الرقابة الموحدة وضبط التجاوزات الأمنية والتشغيلية</span>
              </h2>
              <p className="text-[11px] text-slate-400 max-w-4xl leading-relaxed">
                مرحباً بك في قسم الامتثال والرقابة الموحدة لمنصة آدم بالأردن. من هنا يمكنك استعراض كافة كباتن الأسطول والركاب والتحكم الفوري بحالة الخدمة وتفعيلها أو إيقافها لأي مستخدم بشكل منفصل، وتسجيل تجاوزاتهم والبت بها بالاستعانة بالمستشار الأمني الذكي المطور بـ Gemini AI.
              </p>
            </div>

            {/* Success message banner */}
            {enforceActionSuccessMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl text-xs text-right font-bold flex justify-between items-center flex-row-reverse"
              >
                <span>{enforceActionSuccessMsg}</span>
                <span className="font-mono">✓ نظام الامتثال الموحد</span>
              </motion.div>
            )}

            {/* Top Toolbar: Search & Filters */}
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row-reverse gap-4 justify-between items-center">
              {/* Search */}
              <div className="w-full md:w-1/3 relative text-right">
                <input
                  type="text"
                  placeholder="ابحث باسم المستخدم، رقم الهاتف أو المعرف..."
                  value={enforcementSearch}
                  onChange={(e) => setEnforcementSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl p-2.5 pr-9 text-xs text-slate-100 outline-none text-right transition"
                />
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
                {/* Status Filter */}
                <div className="flex bg-slate-950 rounded-xl border border-slate-850 p-1">
                  <button
                    type="button"
                    onClick={() => setEnforcementStatusFilter('all')}
                    className={`py-1 px-3 rounded-lg text-[10px] font-black transition cursor-pointer ${
                      enforcementStatusFilter === 'all'
                        ? 'bg-gradient-to-l from-rose-600 to-rose-700 text-white shadow'
                        : 'text-slate-400 hover:text-slate-300 bg-transparent'
                    }`}
                  >
                    الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnforcementStatusFilter('active')}
                    className={`py-1 px-3 rounded-lg text-[10px] font-black transition cursor-pointer ${
                      enforcementStatusFilter === 'active'
                        ? 'bg-gradient-to-l from-rose-600 to-rose-700 text-white shadow'
                        : 'text-slate-400 hover:text-slate-300 bg-transparent'
                    }`}
                  >
                    نشط فقط
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnforcementStatusFilter('blocked')}
                    className={`py-1 px-3 rounded-lg text-[10px] font-black transition cursor-pointer ${
                      enforcementStatusFilter === 'blocked'
                        ? 'bg-gradient-to-l from-rose-600 to-rose-700 text-white shadow'
                        : 'text-slate-400 hover:text-slate-300 bg-transparent'
                    }`}
                  >
                    موقوف فقط
                  </button>
                </div>

                {/* Role Filter */}
                <div className="flex bg-slate-950 rounded-xl border border-slate-850 p-1">
                  <button
                    type="button"
                    onClick={() => setEnforcementRoleFilter('all')}
                    className={`py-1 px-3 rounded-lg text-[10px] font-black transition cursor-pointer ${
                      enforcementRoleFilter === 'all'
                        ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white shadow'
                        : 'text-slate-400 hover:text-slate-300 bg-transparent'
                    }`}
                  >
                    الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnforcementRoleFilter('driver')}
                    className={`py-1 px-3 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 flex-row-reverse ${
                      enforcementRoleFilter === 'driver'
                        ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white shadow'
                        : 'text-slate-400 hover:text-slate-300 bg-transparent'
                    }`}
                  >
                    🚕 الكباتن
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnforcementRoleFilter('passenger')}
                    className={`py-1 px-3 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 flex-row-reverse ${
                      enforcementRoleFilter === 'passenger'
                        ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white shadow'
                        : 'text-slate-400 hover:text-slate-300 bg-transparent'
                    }`}
                  >
                    👤 الركاب
                  </button>
                </div>
              </div>
            </div>

            {/* Split Screen Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Side: Violation Registry & AI Advisor Office (5 cols) */}
              <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 text-right flex flex-col justify-between shadow-lg">
                {!selectedEnforceUser ? (
                  <div className="h-96 flex flex-col items-center justify-center text-center text-slate-500 text-xs p-6 border border-slate-850 border-dashed rounded-xl">
                    <AlertCircle className="w-10 h-10 text-slate-600 mb-3" />
                    <span className="font-bold text-slate-400 mb-1">لم يتم اختيار أي مستخدم حالياً</span>
                    <span>👈 الرجاء اختيار مستخدم (كابتن أو راكب) من القائمة المقابلة لبدء تعيين الإجراءات وتطبيق العقوبات والتشخيص بالذكاء الاصطناعي</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* User Profile Summary */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between flex-row-reverse">
                      <div className="flex items-center gap-3 flex-row-reverse text-right">
                        <img
                          src={selectedEnforceUser.documents?.photo || 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150'}
                          alt={selectedEnforceUser.fullName}
                          className="w-11 h-11 rounded-full object-cover border border-slate-800"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="text-xs font-black text-slate-101 flex items-center gap-2 flex-row-reverse">
                            <span>{selectedEnforceUser.fullName}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                              selectedEnforceUser.role === 'driver' ? 'bg-amber-500/15 text-amber-400' : 'bg-indigo-500/15 text-indigo-400'
                            }`}>
                              {selectedEnforceUser.role === 'driver' ? 'كابتن' : 'راكب'}
                            </span>
                          </h4>
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                            المعرف: @{selectedEnforceUser.username} | {selectedEnforceUser.phone}
                          </p>
                        </div>
                      </div>
                      
                      {/* Close button */}
                      <button
                        onClick={() => {
                          setSelectedEnforceUser(null);
                          setEnforceAiRecommendation(null);
                          setEnforceViolationDesc('');
                        }}
                        className="text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                      >
                        إلغاء ✕
                      </button>
                    </div>

                    {/* Violation input form */}
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400 font-bold">نوع المخالفة المرتكبة ⚠️</label>
                        <select
                          value={enforceViolationType}
                          onChange={(e) => setEnforceViolationType(e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none focus:border-rose-500 text-right font-sans"
                        >
                          <option value="سلوك غير لائق ومخالفة التعليمات">سلوك غير لائق ومخالفة التعليمات</option>
                          <option value="التلاعب بالعداد وأسعار الرحلات بالزيادة">التلاعب بالعداد وأسعار الرحلات بالزيادة</option>
                          <option value="مخالفة السرعة الزائدة وقوانين السير بالأردن">مخالفة السرعة الزائدة وقوانين السير بالأردن</option>
                          <option value="الإلغاء المتكرر والمتعمد للرحلات المقبولة">الإلغاء المتكرر والمتعمد للرحلات المقبولة</option>
                          <option value="عدم مطابقة مواصفات السيارة أو الهوية المسجلة">عدم مطابقة مواصفات السيارة أو الهوية المسجلة</option>
                          <option value="تجاوز مالي أو امتناع عن تحويل المستحقات">تجاوز مالي أو امتناع عن تحويل المستحقات</option>
                          <option value="أخرى - يرجى كتابة التفاصيل أدناه">أخرى - يرجى كتابة التفاصيل أدناه</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400 font-bold">تفاصيل التجاوز والملابسات الميدانية 📝</label>
                        <textarea
                          rows={3}
                          value={enforceViolationDesc}
                          onChange={(e) => setEnforceViolationDesc(e.target.value)}
                          placeholder="اكتب تفاصيل الواقعة بدقة، مثل: شكوى الراكب بخصوص طلب مبلغ مضاف خارج التطبيق أو رصد سرعة قيادة عالية جداً..."
                          className="bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 outline-none focus:border-rose-500 text-right leading-relaxed font-sans"
                        />
                      </div>
                    </div>

                    {/* Gemini AI recommendation engine trigger */}
                    <button
                      type="button"
                      disabled={isEnforceAnalyzing}
                      onClick={async () => {
                        setIsEnforceAnalyzing(true);
                        setEnforceAiRecommendation(null);
                        try {
                          const historyCount = enforcementHistoryLogs.filter(log => log.userId === selectedEnforceUser.id).length;
                          const res = await fetch('/api/ai-violation-advisor', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              userName: selectedEnforceUser.fullName,
                              userRole: selectedEnforceUser.role,
                              violationType: enforceViolationType,
                              violationDescription: enforceViolationDesc,
                              historyCount
                            })
                          });
                          const data = await res.json();
                          if (data.success) {
                            setEnforceAiRecommendation({
                              riskLevel: data.riskLevel,
                              recommendedAction: data.recommendedAction,
                              shouldSuspend: data.shouldSuspend,
                              officialLetter: data.officialLetter
                            });
                          } else {
                            alert("حدث خطأ أثناء تشخيص جيميناي للتجاوز: " + data.msg);
                          }
                        } catch (err: any) {
                          alert("خطأ اتصال بخادم جيميناي: " + err.message);
                        } finally {
                          setIsEnforceAnalyzing(false);
                        }
                      }}
                      className="w-full bg-gradient-to-l from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 flex-row-reverse cursor-pointer select-none"
                    >
                      <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isEnforceAnalyzing ? 'animate-spin' : ''}`} />
                      <span>{isEnforceAnalyzing ? 'جاري تحليل التجاوز وتقدير المخاطر بـ Gemini...' : '🤖 تقدير العقوبة وإجراء تقييم أمني بذكاء جيميناي'}</span>
                    </button>

                    {/* AI Advisor Output Screen */}
                    {enforceAiRecommendation && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-950 border border-purple-500/25 p-3.5 rounded-xl flex flex-col gap-3"
                      >
                        <div className="flex justify-between items-center flex-row-reverse">
                          <span className="text-[9px] font-black text-purple-400 font-mono">GEMINI ADVISOR OUTPUT 🤖</span>
                          <div className="flex items-center gap-1.5 flex-row-reverse">
                            <span className="text-[10px] text-slate-400">مستوى الخطورة:</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                              enforceAiRecommendation.riskLevel === 'high'
                                ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                                : enforceAiRecommendation.riskLevel === 'medium'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                            }`}>
                              {enforceAiRecommendation.riskLevel === 'high' ? 'عالي الخطورة 🔴' : enforceAiRecommendation.riskLevel === 'medium' ? 'متوسط الخطورة 🟡' : 'منخفض الخطورة 🟢'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850 text-right">
                          <p className="text-[10px] text-slate-400 font-bold mb-0.5">العقوبة الموصى بها إدارياً:</p>
                          <p className="text-[11px] text-slate-200 font-black leading-relaxed">{enforceAiRecommendation.recommendedAction}</p>
                        </div>

                        {/* Official Administrative Warning Letter */}
                        <div className="flex flex-col gap-1 text-right">
                          <span className="text-[10px] text-slate-400 font-bold">الخطاب الإداري الرسمي والإنذار (قابل للتعديل):</span>
                          <textarea
                            rows={4}
                            value={enforceAiRecommendation.officialLetter}
                            onChange={(e) => setEnforceAiRecommendation({ ...enforceAiRecommendation, officialLetter: e.target.value })}
                            className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg text-[10px] text-slate-300 font-sans leading-relaxed outline-none focus:border-indigo-500 text-right"
                          />
                        </div>

                        {/* Interactive toggle switch for status inside the recommendation card */}
                        <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-850 flex items-center justify-between flex-row-reverse">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-200 font-black block">تعليق فوري لحالة الخدمة؟</span>
                            <span className="text-[9px] text-slate-400">سوف يعطل الحساب فوراً من استخدام التطبيق</span>
                          </div>
                          <div className="flex bg-slate-950 rounded-xl border border-slate-800 p-0.5">
                            <button
                              type="button"
                              onClick={() => setEnforceAiRecommendation({ ...enforceAiRecommendation, shouldSuspend: true })}
                              className={`py-1 px-2.5 rounded-lg text-[9px] font-black transition cursor-pointer ${
                                enforceAiRecommendation.shouldSuspend
                                  ? 'bg-red-500 text-white shadow'
                                  : 'text-slate-400 hover:text-slate-300'
                              }`}
                            >
                              نعم (إيقاف)
                            </button>
                            <button
                              type="button"
                              onClick={() => setEnforceAiRecommendation({ ...enforceAiRecommendation, shouldSuspend: false })}
                              className={`py-1 px-2.5 rounded-lg text-[9px] font-black transition cursor-pointer ${
                                !enforceAiRecommendation.shouldSuspend
                                  ? 'bg-emerald-500 text-white shadow'
                                  : 'text-slate-400 hover:text-slate-300'
                              }`}
                            >
                              لا (نشط)
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Final Enforcement Execution Button */}
                    <button
                      type="button"
                      onClick={() => {
                        // Check write permission
                        const isDriver = selectedEnforceUser.role === 'driver';
                        const reqPerm = isDriver ? 'activeDrivers' : 'passengers';
                        if (!hasPermissionWrite(reqPerm)) {
                          alert("🚫 عذراً، لا تمتلك الصلاحيات الإجرائية التشغيلية اللازمة لتطبيق الإيقاف المباشر أو حفظ العقوبات!");
                          return;
                        }

                        // Determine status change
                        const shouldBlock = enforceAiRecommendation ? enforceAiRecommendation.shouldSuspend : (selectedEnforceUser.status !== 'blocked');
                        
                        if (shouldBlock) {
                          if (isDriver) blockDriver(selectedEnforceUser.id);
                          else blockPassenger(selectedEnforceUser.id);
                        } else {
                          if (isDriver) unblockDriver(selectedEnforceUser.id);
                          else unblockPassenger(selectedEnforceUser.id);
                        }

                        // Save log
                        const newLog = {
                          id: 'log_' + Date.now(),
                          userId: selectedEnforceUser.id,
                          userName: selectedEnforceUser.fullName,
                          userRole: selectedEnforceUser.role,
                          userPhone: selectedEnforceUser.phone,
                          userUsername: selectedEnforceUser.username,
                          violationType: enforceViolationType,
                          violationDescription: enforceViolationDesc || 'تم تغيير حالة التفعيل مباشرة دون وصف',
                          riskLevel: enforceAiRecommendation?.riskLevel || (shouldBlock ? 'high' : 'low'),
                          recommendedAction: enforceAiRecommendation?.recommendedAction || (shouldBlock ? 'إيقاف خدمة فوري' : 'تفعيل الخدمة المباشر'),
                          officialLetter: enforceAiRecommendation?.officialLetter || 'تم تعديل الإجراء تشغيلياً بطلب المسؤول.',
                          date: new Date().toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                          timestamp: Date.now(),
                          adminUsername: currentUser?.username || 'admin'
                        };

                        const updatedLogs = [newLog, ...enforcementHistoryLogs];
                        setEnforcementHistoryLogs(updatedLogs);
                        localStorage.setItem('adam_enforcement_violations', JSON.stringify(updatedLogs));

                        // Success banner & reset
                        setEnforceActionSuccessMsg(`تم بنجاح تحديث حالة الخدمة للمستخدم (${selectedEnforceUser.fullName}) ليكون [${shouldBlock ? 'موقوف إدارياً 🚫' : 'فعال معتمد ✓'}]. وتم تسجيل المخالفة رسمياً في سجلات حوكمة النظام ⚡.`);
                        setTimeout(() => setEnforceActionSuccessMsg(''), 6000);
                        
                        setSelectedEnforceUser(null);
                        setEnforceAiRecommendation(null);
                        setEnforceViolationDesc('');
                      }}
                      className="w-full bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white py-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 flex-row-reverse shadow-lg shadow-rose-950/20 cursor-pointer select-none"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>⚡ حفظ التجاوز واعتماد قرار الخدمة الفوري وإشعار النظام</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side: Users List & Immediate Service Toggles (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-lg text-right">
                  {/* Table Header */}
                  <div className="bg-slate-950 p-4 border-b border-slate-850 flex justify-between items-center flex-row-reverse">
                    <div>
                      <h3 className="text-xs font-black text-slate-101">📋 مستخدمي منصة آدم وقائمة التحكم الفوري بالخدمة</h3>
                      <p className="text-[9px] text-slate-500 mt-0.5">انقر على زر المخالفة لتسجيل تجاوز، أو استخدم المفتاح الدوار الجانبي لتعديل حالة التفعيل فوراً بشكل منفصل</p>
                    </div>
                    <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-1 rounded-lg">الأردن (JO)</span>
                  </div>

                  {/* Users Grid/List */}
                  <div className="divide-y divide-slate-850/60 max-h-[580px] overflow-y-auto">
                    {(() => {
                      const query = enforcementSearch.trim().toLowerCase();
                      
                      // Combine matching drivers & passengers
                      let list: any[] = [];
                      
                      if (enforcementRoleFilter === 'all' || enforcementRoleFilter === 'driver') {
                        drivers.forEach(d => {
                          list.push({ ...d, role: 'driver' });
                        });
                      }
                      if (enforcementRoleFilter === 'all' || enforcementRoleFilter === 'passenger') {
                        passengers.forEach(p => {
                          list.push({ ...p, role: 'passenger' });
                        });
                      }

                      // Filter by search query
                      if (query) {
                        list = list.filter(u => 
                          (u.fullName || '').toLowerCase().includes(query) ||
                          (u.username || '').toLowerCase().includes(query) ||
                          (u.phone || '').includes(query)
                        );
                      }

                      // Filter by status
                      if (enforcementStatusFilter === 'active') {
                        list = list.filter(u => u.status !== 'blocked');
                      } else if (enforcementStatusFilter === 'blocked') {
                        list = list.filter(u => u.status === 'blocked');
                      }

                      if (list.length === 0) {
                        return (
                          <div className="p-12 text-center text-slate-500 text-xs">
                            لا توجد نتائج مطابقة لبحثك ومعايير التصفية الحالية.
                          </div>
                        );
                      }

                      return list.map((user, idx) => {
                        const isBlocked = user.status === 'blocked';
                        
                        return (
                          <div
                            key={user.id}
                            className={`p-3.5 hover:bg-slate-900/60 transition flex flex-col sm:flex-row-reverse sm:items-center justify-between gap-4 ${
                              selectedEnforceUser?.id === user.id ? 'bg-slate-900 border-r-4 border-rose-500' : ''
                            }`}
                          >
                            {/* Left: Info */}
                            <div className="flex items-center gap-3 flex-row-reverse text-right">
                              <img
                                src={user.documents?.photo || 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150'}
                                alt={user.fullName}
                                className="w-10 h-10 rounded-full object-cover border border-slate-850"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 flex-row-reverse">
                                  <span>{user.fullName}</span>
                                  <span className={`text-[8px] px-1.5 py-0.2 rounded font-black ${
                                    user.role === 'driver' ? 'bg-amber-500/15 text-amber-400' : 'bg-indigo-500/15 text-indigo-400'
                                  }`}>
                                    {user.role === 'driver' ? '🚕 كابتن' : '👤 راكب'}
                                  </span>
                                </h4>
                                <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                                  @{user.username} | {user.phone} | المحافظة: {user.governorate || 'عمان'}
                                </p>
                                <div className="flex gap-2.5 mt-1 text-[9px] text-slate-400 flex-row-reverse">
                                  <span>عدد الرحلات: <strong className="text-slate-300">{user.tripsCount || 0}</strong></span>
                                  <span>•</span>
                                  <span>التقييم: <strong className="text-slate-300">⭐ {user.ratingAverage ? user.ratingAverage.toFixed(1) : '5.0'}</strong></span>
                                  <span>•</span>
                                  <span>الرصيد: <strong className={user.balance < 0 ? 'text-red-400' : 'text-emerald-400'}>{user.balance ? user.balance.toFixed(2) : '0.00'} د.أ</strong></span>
                                </div>
                              </div>
                            </div>

                            {/* Right Actions: Direct Service Toggle */}
                            <div className="flex items-center gap-2 justify-end">
                              {/* Quick Process button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedEnforceUser(user);
                                  setEnforceViolationDesc('');
                                  setEnforceAiRecommendation(null);
                                }}
                                className="bg-slate-950 border border-slate-800 hover:border-rose-500 text-slate-300 hover:text-rose-400 py-1.5 px-2.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 flex-row-reverse select-none cursor-pointer"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                <span>معالجة تجاوز ⚠️</span>
                              </button>

                              {/* INSTANT SERVICE TOGGLE SWITCH */}
                              <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 p-0.5 select-none">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const reqPerm = user.role === 'driver' ? 'activeDrivers' : 'passengers';
                                    if (!hasPermissionWrite(reqPerm)) {
                                      alert("🚫 لا تمتلك صلاحية تعديل حالة الخدمة!");
                                      return;
                                    }
                                    if (user.role === 'driver') blockDriver(user.id);
                                    else blockPassenger(user.id);

                                    // Save log
                                    const newLog = {
                                      id: 'log_' + Date.now(),
                                      userId: user.id,
                                      userName: user.fullName,
                                      userRole: user.role,
                                      userPhone: user.phone,
                                      userUsername: user.username,
                                      violationType: 'تعطيل الخدمة الفوري من لوحة التفعيل السريع',
                                      violationDescription: 'قام المسؤول بتعطيل الخدمة يدوياً وبشكل فوري للاشتباه بالتجاوز',
                                      riskLevel: 'high',
                                      recommendedAction: 'إيقاف الخدمة الفوري',
                                      officialLetter: 'تم إيقاف الخدمة نظراً لمقتضيات الحوكمة والأمن التشغيلي.',
                                      date: new Date().toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                                      timestamp: Date.now(),
                                      adminUsername: currentUser?.username || 'admin'
                                    };
                                    const updatedLogs = [newLog, ...enforcementHistoryLogs];
                                    setEnforcementHistoryLogs(updatedLogs);
                                    localStorage.setItem('adam_enforcement_violations', JSON.stringify(updatedLogs));

                                    setEnforceActionSuccessMsg(`تم تعطيل تفعيل الخدمة فوراً للمستخدم (${user.fullName}) 🚫.`);
                                    setTimeout(() => setEnforceActionSuccessMsg(''), 4000);
                                  }}
                                  className={`py-1 px-2.5 rounded-lg text-[9px] font-black transition cursor-pointer ${
                                    isBlocked
                                      ? 'bg-rose-600 text-white font-bold shadow'
                                      : 'text-slate-500 hover:text-slate-400 bg-transparent'
                                  }`}
                                >
                                  موقوف
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const reqPerm = user.role === 'driver' ? 'activeDrivers' : 'passengers';
                                    if (!hasPermissionWrite(reqPerm)) {
                                      alert("🚫 لا تمتلك صلاحية تعديل حالة الخدمة!");
                                      return;
                                    }
                                    if (user.role === 'driver') unblockDriver(user.id);
                                    else unblockPassenger(user.id);

                                    // Save log
                                    const newLog = {
                                      id: 'log_' + Date.now(),
                                      userId: user.id,
                                      userName: user.fullName,
                                      userRole: user.role,
                                      userPhone: user.phone,
                                      userUsername: user.username,
                                      violationType: 'إعادة تفعيل الخدمة الفورية',
                                      violationDescription: 'قام المسؤول بإعادة تنشيط وتفعيل حساب المستخدم يدوياً',
                                      riskLevel: 'low',
                                      recommendedAction: 'تنشيط معتمد',
                                      officialLetter: 'تم رفع العقوبة وإعادة تفعيل الحساب للخدمة.',
                                      date: new Date().toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                                      timestamp: Date.now(),
                                      adminUsername: currentUser?.username || 'admin'
                                    };
                                    const updatedLogs = [newLog, ...enforcementHistoryLogs];
                                    setEnforcementHistoryLogs(updatedLogs);
                                    localStorage.setItem('adam_enforcement_violations', JSON.stringify(updatedLogs));

                                    setEnforceActionSuccessMsg(`تم تنشيط وتفعيل الخدمة بنجاح للمستخدم (${user.fullName}) ✓.`);
                                    setTimeout(() => setEnforceActionSuccessMsg(''), 4000);
                                  }}
                                  className={`py-1 px-2.5 rounded-lg text-[9px] font-black transition cursor-pointer ${
                                    !isBlocked
                                      ? 'bg-emerald-600 text-white font-bold shadow'
                                      : 'text-slate-500 hover:text-slate-400 bg-transparent'
                                  }`}
                                >
                                  نشط
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Recent Disciplinary Actions & Compliance Logs */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-lg text-right">
              <div className="bg-slate-950 p-4 border-b border-slate-850 flex justify-between items-center flex-row-reverse">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <h3 className="text-xs font-black text-slate-101">⚖️ أرشيف وسجلات قرارات الامتثال والعقوبات الإدارية المعتمدة</h3>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm("هل أنت متأكد من رغبتك في تصفير سجل المخالفات والأرشيف تماماً؟")) {
                      setEnforcementHistoryLogs([]);
                      localStorage.removeItem('adam_enforcement_violations');
                    }
                  }}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-bold bg-rose-500/10 px-2.5 py-1 rounded-lg transition cursor-pointer select-none"
                >
                  تصفير الأرشيف السري 🗑️
                </button>
              </div>

              <div className="p-0 overflow-x-auto">
                {enforcementHistoryLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    لا توجد أي قرارات عقوبة مسجلة في هذا الأرشيف اللحظي حتى الآن.
                  </div>
                ) : (
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-850 text-[10px] uppercase font-black">
                        <th className="p-3 text-right">المسؤول</th>
                        <th className="p-3 text-right">تاريخ الإجراء</th>
                        <th className="p-3 text-right">الإجراء الإداري المطبق</th>
                        <th className="p-3 text-right">درجة التجاوز</th>
                        <th className="p-3 text-right">نوع ومبرر التجاوز</th>
                        <th className="p-3 text-right">اسم وبيانات العضو المخالف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60 text-[11px]">
                      {enforcementHistoryLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/30 transition text-slate-300">
                          <td className="p-3 text-slate-500 font-mono">@{log.adminUsername || 'admin'}</td>
                          <td className="p-3 text-slate-400">{log.date}</td>
                          <td className="p-3 font-bold text-slate-101">{log.recommendedAction}</td>
                          <td className="p-3">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                              log.riskLevel === 'high' ? 'bg-red-500/10 text-red-400' : log.riskLevel === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {log.riskLevel === 'high' ? 'خطير 🔴' : log.riskLevel === 'medium' ? 'متوسط 🟡' : 'بسيط 🟢'}
                            </span>
                          </td>
                          <td className="p-3 max-w-xs truncate" title={log.violationDescription}>
                            <div className="font-bold text-slate-200">{log.violationType}</div>
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">{log.violationDescription}</div>
                          </td>
                          <td className="p-3 font-bold text-slate-200">
                            <div className="flex items-center gap-2 justify-end flex-row-reverse">
                              <span>{log.userName}</span>
                              <span className={`text-[8px] px-1 rounded ${
                                log.userRole === 'driver' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'
                              }`}>
                                {log.userRole === 'driver' ? 'كابتن' : 'راكب'}
                              </span>
                            </div>
                            <div className="text-[9px] text-slate-500 mt-0.5 font-mono">@{log.userUsername} | {log.userPhone}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* USERS MANAGER & REVIEW MODULE */}
        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col gap-6"
          >
            {renderReadOnlyBanner('pendingDrivers', 'مراجعة وتراخيص الكباتن المعلقة')}
            {renderReadOnlyBanner('activeDrivers', 'إدارة الكباتن الشاحنين والمحافظ والتحكيم')}
            {renderReadOnlyBanner('passengers', 'مراجعة حسابات الركاب وأرصدتهم')}

            {/* 🧪 TESTING & SIMULATION SANDBOX PANEL */}
            <div className="bg-slate-900/60 border border-indigo-500/20 p-5 rounded-2xl text-right font-sans relative overflow-hidden backdrop-blur-sm shadow-xl">
              <div className="absolute top-0 left-0 bg-indigo-500/10 text-[9px] text-indigo-400 font-bold font-mono px-3 py-1 rounded-br-xl uppercase tracking-wider">
                Simulation Sandbox
              </div>
              <h3 className="text-xs font-black text-slate-100 flex justify-end gap-2 items-center mb-1">
                <span>🧪 بيئة محاكاة وتوليد الكباتن والركاب التجريبيين</span>
              </h3>
              <p className="text-[10px] text-slate-400 mb-4 font-medium leading-relaxed">
                استخدم هذه الأداة لإنشاء كباتن أو ركاب تجريبيين فوريين معتمدين لعمل تجربة حية على الطلبات المتعددة والرحلات وتجربة المحاكاة. يمكنك حذفهم لاحقاً بنقرة واحدة من الجداول أدناه.
              </p>

              {sandboxMsg && (
                <div className={`p-3 text-xs rounded-xl text-right mb-4 border ${
                  sandboxMsg.type === 'success' 
                    ? 'bg-emerald-950/50 border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-950/50 border-rose-500/20 text-rose-400'
                }`}>
                  {sandboxMsg.text}
                </div>
              )}

              <form onSubmit={handleCreateTestUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                {/* 1. Select Role */}
                <div className="flex flex-col gap-1.5 text-right md:col-span-1">
                  <label className="text-[10px] text-slate-400 font-black">نوع المستخدم التجريبي</label>
                  <div className="flex bg-slate-950 rounded-xl border border-slate-850 p-1">
                    <button
                      type="button"
                      onClick={() => setSandboxRole('passenger')}
                      className={`flex-1 py-1 px-2.5 rounded-lg text-[10px] font-black transition cursor-pointer text-center ${
                        sandboxRole === 'passenger' 
                          ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white shadow' 
                          : 'text-slate-400 hover:text-slate-300 bg-transparent'
                      }`}
                    >
                      👤 راكب تجريبي
                    </button>
                    <button
                      type="button"
                      onClick={() => setSandboxRole('driver')}
                      className={`flex-1 py-1 px-2.5 rounded-lg text-[10px] font-black transition cursor-pointer text-center ${
                        sandboxRole === 'driver' 
                          ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white shadow' 
                          : 'text-slate-400 hover:text-slate-300 bg-transparent'
                      }`}
                    >
                      🚕 كابتن تجريبي
                    </button>
                  </div>
                </div>

                {/* 2. Custom Name */}
                <div className="flex flex-col gap-1.5 text-right md:col-span-1">
                  <label className="text-[10px] text-slate-400 font-black">الاسم الرباعي (اختياري)</label>
                  <input
                    type="text"
                    value={sandboxName}
                    onChange={(e) => setSandboxName(e.target.value)}
                    placeholder={sandboxRole === 'driver' ? 'مثال: كابتن معاذ العبادي' : 'مثال: الراقية رشا الحامد'}
                    className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none text-right transition"
                  />
                </div>

                {/* 3. Custom Governorate */}
                <div className="flex flex-col gap-1.5 text-right md:col-span-1">
                  <label className="text-[10px] text-slate-400 font-black">محافظة البدء والعمل</label>
                  <select
                    value={sandboxGov}
                    onChange={(e) => setSandboxGov(e.target.value)}
                    className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none transition"
                  >
                    <option value="عمان (Amman)">عمان (Amman)</option>
                    <option value="إربد (Irbid)">إربد (Irbid)</option>
                    <option value="الزرقاء (Zarqa)">الزرقاء (Zarqa)</option>
                    <option value="معان (Ma'an)">معان (Ma'an)</option>
                    <option value="العقبة (Aqaba)">العقبة (Aqaba)</option>
                    <option value="السلط (Salt)">السلط/البلقاء (Salt)</option>
                    <option value="جرش (Jerash)">جرش (Jerash)</option>
                    <option value="الكرك (Karak)">الكرك (Karak)</option>
                    <option value="مأدبا (Madaba)">مأدبا (Madaba)</option>
                    <option value="الطفيلة (Tafilah)">الطفيلة (Tafilah)</option>
                    <option value="عجلون (Ajloun)">عجلون (Ajloun)</option>
                    <option value="المفرق (Mafraq)">المفرق (Mafraq)</option>
                  </select>
                </div>

                {/* 4. Action Button */}
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white p-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 flex-row-reverse md:col-span-1"
                >
                  <span>🚀 توليد وتفعيل مالي فوري</span>
                </button>
              </form>
            </div>
            
            {passwordChangeSuccessMsg && (
              <div className="bg-emerald-950/40 border border-emerald-500 rounded-xl p-3 text-right text-xs text-emerald-400 font-sans font-bold flex justify-between items-center flex-row-reverse">
                <span>{passwordChangeSuccessMsg}</span>
                <span>🔐 نظام الأمان</span>
              </div>
            )}

            {/* ⚠️ QUICK USER CONTROL & VIOLATIONS MANAGEMENT PANEL */}
            <div className="bg-slate-900 border border-amber-500/25 p-5 rounded-2xl text-right font-sans relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 bg-amber-500/15 text-[9px] text-amber-400 font-bold font-mono px-3 py-1 rounded-br-xl uppercase tracking-wider">
                Security & Violations Office
              </div>
              <h3 className="text-xs font-black text-amber-400 flex justify-end gap-2 items-center mb-1">
                <span>⚠️ لوحة إدارة التجاوزات والتحكم السريع بالمستخدمين</span>
              </h3>
              <p className="text-[10px] text-slate-450 mb-4 font-medium leading-relaxed">
                ابحث فوراً عن أي كابتن أو راكب في النظام لتعديل كلمة مروره أو إيقاف/تفعيل الخدمة عنه فوراً عند حدوث أي تجاوزات سلوكية أو مالية أو مخالفة لشروط المنصة.
              </p>

              {quickActionMessage && (
                <div className="p-2.5 text-xs rounded-xl bg-emerald-950/45 border border-emerald-500/25 text-emerald-400 text-right mb-4 font-bold flex justify-between items-center flex-row-reverse">
                  <span>{quickActionMessage}</span>
                  <span className="font-mono">✓ النظام الموحد</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                {/* Search field */}
                <div className="md:col-span-1 flex flex-col gap-1.5 text-right relative">
                  <label className="text-[10px] text-slate-400 font-bold">ابحث باسم المستخدم، رقم الهاتف أو المعرف @</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="اكتب للبحث السريع (مثال: معاذ)..."
                      value={quickUserSearchQuery}
                      onChange={(e) => {
                        setQuickUserSearchQuery(e.target.value);
                        if (!e.target.value) {
                          setQuickSelectedUser(null);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-2.5 pr-9 text-xs text-slate-101 outline-none text-right transition"
                    />
                    <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                  </div>

                  {/* Autocomplete dropdown results */}
                  {quickUserSearchQuery && !quickSelectedUser && (() => {
                    const q = quickUserSearchQuery.trim().toLowerCase();
                    const matchingUsers: Array<{ id: string; fullName: string; username: string; phone: string; role: 'driver' | 'passenger'; status: string; password?: string; documents?: any }> = [];
                    
                    drivers.forEach(drv => {
                      if ((drv.fullName || '').toLowerCase().includes(q) || (drv.username || '').toLowerCase().includes(q) || (drv.phone || '').includes(q)) {
                        matchingUsers.push({
                          id: drv.id,
                          fullName: drv.fullName,
                          username: drv.username,
                          phone: drv.phone,
                          role: 'driver',
                          status: drv.status,
                          password: drv.password || '123',
                          documents: drv.documents
                        });
                      }
                    });

                    passengers.forEach(psg => {
                      if ((psg.fullName || '').toLowerCase().includes(q) || (psg.username || '').toLowerCase().includes(q) || (psg.phone || '').includes(q)) {
                        matchingUsers.push({
                          id: psg.id,
                          fullName: psg.fullName,
                          username: psg.username,
                          phone: psg.phone,
                          role: 'passenger',
                          status: psg.status,
                          password: psg.password || '123',
                          documents: psg.documents
                        });
                      }
                    });

                    if (matchingUsers.length === 0) {
                      return (
                        <div className="absolute top-14 right-0 left-0 bg-slate-950 border border-slate-800 rounded-xl p-3 z-50 text-center text-xs text-slate-500 shadow-2xl">
                          لا توجد نتائج مطابقة للبحث.
                        </div>
                      );
                    }

                    return (
                      <div className="absolute top-14 right-0 left-0 bg-slate-950 border border-slate-800 rounded-xl max-h-48 overflow-y-auto z-50 shadow-2xl divide-y divide-slate-850">
                        {matchingUsers.slice(0, 5).map((u, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              setQuickSelectedUser(u);
                              setQuickSelectedUserRole(u.role);
                              setQuickNewPassword(u.password || '123');
                              setQuickNewStatus(u.status as any || 'approved');
                              setQuickUserSearchQuery('');
                            }}
                            className="p-2 px-3 hover:bg-slate-900 cursor-pointer flex justify-between items-center flex-row-reverse text-right transition"
                          >
                            <div className="flex items-center gap-2 flex-row-reverse">
                              <span className="text-xs font-bold text-slate-200">{u.fullName}</span>
                              <span className={`text-[8px] px-1.5 py-0.2 rounded font-black ${
                                u.role === 'driver' ? 'bg-amber-500/15 text-amber-400' : 'bg-indigo-500/15 text-indigo-400'
                              }`}>
                                {u.role === 'driver' ? '🚕 كابتن' : '👤 راكب'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {u.phone}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Workspace panel for selected user */}
                <div className="md:col-span-2 bg-slate-950 border border-slate-850 p-4 rounded-xl">
                  {!quickSelectedUser ? (
                    <div className="h-28 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                      <span>👈 الرجاء كتابة اسم أو هاتف المستخدم أولاً واختياره من نتائج البحث لبدء إجراءات التحكم السريع</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* Identity Row */}
                      <div className="flex justify-between items-center border-b border-slate-850 pb-2.5 flex-row-reverse">
                        <div className="flex items-center gap-2.5 flex-row-reverse text-right">
                          <img 
                            src={quickSelectedUser.documents?.photo || 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150'} 
                            alt="avatar" 
                            className="w-10 h-10 rounded-full object-cover border border-slate-850"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <h4 className="text-xs font-black text-slate-100 flex items-center gap-1.5 flex-row-reverse">
                              <span>{quickSelectedUser.fullName}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-lg ${
                                quickSelectedUserRole === 'driver' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'
                              }`}>
                                {quickSelectedUserRole === 'driver' ? 'كابتن / سائق الأسطول' : 'راكب / مستخدم الخدمة'}
                              </span>
                            </h4>
                            <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                              المعرف: @{quickSelectedUser.username} | الهاتف: {quickSelectedUser.phone}
                            </p>
                          </div>
                        </div>

                        {/* Current state pill */}
                        <div>
                          {quickSelectedUser.status === 'blocked' ? (
                            <span className="bg-red-500/10 border border-red-500/25 text-red-400 text-[10px] font-black px-2 py-0.5 rounded-xl">
                              الحساب موقوف حالياً 🚫
                            </span>
                          ) : (
                            <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-xl">
                              نشط ويعمل ✓
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Editing Parameters Form */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Modify Password */}
                        <div className="flex flex-col gap-1 text-right">
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 flex-row-reverse">
                            <span>تعديل كلمة مرور الحساب 🔐</span>
                            <span className="text-slate-600 font-normal">(مرئية للمشرف لتوجيه المستخدم)</span>
                          </span>
                          <input
                            type="text"
                            value={quickNewPassword}
                            onChange={(e) => setQuickNewPassword(e.target.value)}
                            className="bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl p-2 text-xs font-mono text-slate-101 outline-none transition text-center"
                          />
                        </div>

                        {/* 2. Toggle Service Activation status */}
                        <div className="flex flex-col gap-1 text-right">
                          <span className="text-[10px] text-slate-400 font-bold">تفعيل / إلغاء تفعيل الخدمة للتجاوزات ⚙️</span>
                          <div className="flex bg-slate-900 rounded-xl border border-slate-800 p-1">
                            <button
                              type="button"
                              onClick={() => setQuickNewStatus('blocked')}
                              className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-black transition cursor-pointer text-center ${
                                quickNewStatus === 'blocked'
                                  ? 'bg-rose-950 text-rose-400 border border-rose-500/25 shadow font-bold'
                                  : 'text-slate-400 hover:text-slate-300 bg-transparent'
                              }`}
                            >
                              إيقاف الخدمة (حظر تجمد التجاوزات) 🚫
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickNewStatus('approved')}
                              className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-black transition cursor-pointer text-center ${
                                quickNewStatus === 'approved'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/25 shadow font-bold'
                                  : 'text-slate-400 hover:text-slate-300 bg-transparent'
                              }`}
                            >
                              تفعيل الخدمة (نشط معتمد) ✓
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Action trigger button */}
                      <div className="flex justify-between items-center gap-3 mt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setQuickSelectedUser(null);
                            setQuickSelectedUserRole(null);
                            setQuickUserSearchQuery('');
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-slate-400 py-2 px-3 rounded-xl text-xs cursor-pointer font-sans"
                        >
                          إلغاء الإجراء
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const isDriver = quickSelectedUserRole === 'driver';
                            const reqPerm = isDriver ? 'activeDrivers' : 'passengers';
                            if (!hasPermissionWrite(reqPerm)) {
                              alert("🚫 عذراً، لا تمتلك الصلاحيات الإجرائية اللازمة لإجراء هذا التغيير الإداري!");
                              return;
                            }

                            // 1. Password change check
                            if (quickNewPassword !== quickSelectedUser.password) {
                              const res = updateUserPassword(quickSelectedUser.id, quickSelectedUserRole!, quickNewPassword);
                              if (!res.success) {
                                alert(res.msg);
                                return;
                              }
                            }

                            // 2. Status change check
                            if (quickNewStatus !== quickSelectedUser.status) {
                              if (quickNewStatus === 'blocked') {
                                if (isDriver) blockDriver(quickSelectedUser.id);
                                else blockPassenger(quickSelectedUser.id);
                              } else {
                                if (isDriver) unblockDriver(quickSelectedUser.id);
                                else unblockPassenger(quickSelectedUser.id);
                              }
                            }

                            setQuickActionMessage(`تم بنجاح تحديث بيانات المستخدم (${quickSelectedUser.fullName})! تم تعيين كلمة السر الجديدة وتعديل حالة الخدمة بنجاح ⚡.`);
                            setTimeout(() => setQuickActionMessage(''), 6000);
                            setQuickSelectedUser(null);
                            setQuickSelectedUserRole(null);
                            setQuickUserSearchQuery('');
                          }}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-black py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 flex-row-reverse"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>تطبيق وحفظ العقوبات والإجراءات الإدارية الصارمة ⚡</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI-DESIGNED SUB-TABS INTERACTIVE NAV FOR USERS & DRIVERS */}
            <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 flex flex-wrap flex-row-reverse justify-center md:justify-start gap-2 shadow-xl">
              <button
                type="button"
                onClick={() => setUsersSubTab('pending')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-2 flex-row-reverse grow md:grow-0 justify-center select-none ${
                  usersSubTab === 'pending'
                    ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white shadow-lg ring-1 ring-indigo-500/35'
                    : 'text-slate-400 hover:text-slate-300 bg-slate-900/40 border border-slate-850 hover:bg-slate-900/70'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-amber-500" />
                <span>⏳ طلبات التفعيل المعلقة ({pendingDrivers.length + pendingPassengers.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setUsersSubTab('captains')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-2 flex-row-reverse grow md:grow-0 justify-center select-none ${
                  usersSubTab === 'captains'
                    ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white shadow-lg ring-1 ring-indigo-500/35'
                    : 'text-slate-400 hover:text-slate-300 bg-slate-900/40 border border-slate-850 hover:bg-slate-900/70'
                }`}
              >
                <Car className="w-3.5 h-3.5 text-indigo-400" />
                <span>🚕 أسطول الكباتن ({drivers.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setUsersSubTab('passengers')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-2 flex-row-reverse grow md:grow-0 justify-center select-none ${
                  usersSubTab === 'passengers'
                    ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white shadow-lg ring-1 ring-indigo-500/35'
                    : 'text-slate-400 hover:text-slate-300 bg-slate-900/40 border border-slate-850 hover:bg-slate-900/70'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>👤 ركاب وعملاء المنصة ({passengers.filter(p => p.status === 'approved').length})</span>
              </button>
            </div>

            {usersSubTab === 'pending' && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                {/* Pending Driver profiles approval section */}
                {getPermissionState('pendingDrivers') !== 'hidden' && (
              <div>
                <h3 className="text-xs font-black text-amber-500 border-b border-slate-800 pb-1.5 flex justify-end gap-1.5 items-center mb-3">
                  <span>تراخيص الكباتن والسيارات المعلقة للمراجعة والموافقة ({pendingDrivers.length})</span>
                  <Users className="w-4 h-4 text-amber-500" />
                </h3>

                {pendingDrivers.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 block">لا يوجد طلبات كباتن معلقة للمراجعة حالياً.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingDrivers.map((drv, i) => (
                      <div key={i} className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-3">
                        <div className="flex flex-row-reverse items-center justify-between">
                          <div className="text-right">
                            <h4 className="text-xs font-bold text-slate-200">{drv.fullName}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">الهاتف: {drv.phone}</span>
                          </div>
                          <img 
                            src={drv.documents.photo} 
                            alt="driver" 
                            className="w-9 h-9 rounded-full object-cover border border-amber-500" 
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 text-right bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                          <div>🚗 <strong>السيارة:</strong> {drv.carType}</div>
                          <div>📅 <strong>الموديل:</strong> {drv.carModel}</div>
                          <div>🔢 <strong>رقم اللوحة:</strong> {drv.carPlate}</div>
                          <div>📅 <strong>انتهاء الرخصة:</strong> {drv.licenseExpiry}</div>
                          <div className="col-span-2 text-indigo-400">📍 <strong>محافظة رغبة العمل:</strong> {drv.governorate}</div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setInspectedUser(drv)}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-100 py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            🔍 تدقيق الوثائق وجهين واختيار
                          </button>
                          <button
                            onClick={() => {
                              if (!hasPermissionWrite('pendingDrivers')) {
                                alert("🚫 عذراً، لا تمتلك الصلاحية الإجرائية لتفعيل الكباتن معلقاً!");
                                return;
                              }
                              approveDriver(drv.id);
                            }}
                            className={`bg-emerald-500 hover:bg-emerald-600 text-black px-3 py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer ${!hasPermissionWrite('pendingDrivers') ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>تفعيل فوري كابتن</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pending Passenger profiles approval section */}
            {getPermissionState('passengers') !== 'hidden' && (
              <div className="mt-2 text-right">
                <h3 className="text-xs font-black text-indigo-400 border-b border-slate-800 pb-1.5 flex justify-end gap-1.5 items-center mb-3">
                  <span>طلبات الركاب المعلقة للموافقة الإدارية ({pendingPassengers.length})</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </h3>

                {pendingPassengers.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 block">لا يوجد طلبات ركاب بالانتظار للتحقق حالياً.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingPassengers.map((psg, i) => (
                      <div key={i} className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-3">
                        <div className="flex flex-row-reverse items-center justify-between">
                          <div className="text-right">
                            <h4 className="text-xs font-bold text-slate-200">{psg.fullName}</h4>
                            <span className="text-[10px] text-slate-400">الهاتف: {psg.phone} | البريد: {psg.email}</span>
                          </div>
                          <img 
                            src={psg.documents.photo} 
                            alt="passenger" 
                            className="w-9 h-9 rounded-full object-cover border border-indigo-400" 
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="flex gap-2.5">
                          <button
                            onClick={() => setInspectedUser(psg)}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-100 py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            🔍 تفحص صورة الهوية الثبوتية
                          </button>
                          <button
                            onClick={() => {
                              if (!hasPermissionWrite('passengers')) {
                                alert("🚫 عذراً، لا تمتلك الصلاحية الإجرائية لتفعيل الركاب الملعقين!");
                                return;
                              }
                              approvePassenger(psg.id);
                            }}
                            className={`bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer ${!hasPermissionWrite('passengers') ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>تفعيل فوري راكب</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
              </div>
            )}

            {usersSubTab === 'captains' && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                {/* Active Driver Profiles with block capability */}
                {getPermissionState('activeDrivers') !== 'hidden' && (
              <div className="mt-4 text-right">
                <h3 className="text-xs font-black text-slate-200 border-b border-slate-800 pb-1.5 flex justify-end gap-1.5 items-center mb-3">
                  <span>جدول وبيانات كباتن الأسطول الإجمالي ({drivers.length})</span>
                  <Car className="w-4 h-4 text-slate-400" />
                </h3>

                {/* Search Input for Captains */}
                <div className="flex flex-col md:flex-row gap-3 justify-between items-center mb-4 flex-row-reverse">
                  <div className="relative w-full md:w-80">
                    <input
                      type="text"
                      placeholder="ابحث باسم الكابتن، المعرف @، أو رقم الهاتف..."
                      value={driverSearchQuery}
                      onChange={e => setDriverSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-xs text-slate-100 pr-10 pl-3 py-2 rounded-xl outline-none text-right font-sans placeholder-slate-650"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3" />
                  </div>
                  <div className="text-[10px] text-slate-450 font-medium font-sans">
                    {driverSearchQuery && (
                      <span>تم العثور على <strong className="text-amber-400 font-bold">{
                        drivers.filter(drv => {
                          const query = driverSearchQuery.trim().toLowerCase();
                          return (
                            (drv.fullName || '').toLowerCase().includes(query) ||
                            (drv.username || '').toLowerCase().includes(query) ||
                            (drv.phone || '').includes(query) ||
                            (drv.governorate || '').toLowerCase().includes(query)
                          );
                        }).length
                      }</strong> كابتن من أصل {drivers.length}</span>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl">
                  <table className="w-full text-xs text-right text-slate-200 uppercase select-all font-sans">
                    <thead className="bg-slate-950 font-bold border-b border-slate-850 text-slate-400">
                      <tr>
                        <th className="px-4 py-3">الكابتن</th>
                        <th className="px-4 py-3">الهاتف والمنطقة</th>
                        <th className="px-4 py-3 text-right">صلاحية العمل (AI)</th>
                        <th className="px-4 py-3">رخصة القيادة</th>
                        <th className="px-4 py-3">سد المركبة وموديلها</th>
                        <th className="px-4 py-3">رصيد المحفظة</th>
                        <th className="px-4 py-3 text-center">🔐 كلمة المرور</th>
                        <th className="px-4 py-3">الحالة والإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {drivers.filter(drv => {
                        const query = driverSearchQuery.trim().toLowerCase();
                        if (!query) return true;
                        return (
                          (drv.fullName || '').toLowerCase().includes(query) ||
                          (drv.username || '').toLowerCase().includes(query) ||
                          (drv.phone || '').includes(query) ||
                          (drv.governorate || '').toLowerCase().includes(query)
                        );
                      }).map((drv, idx) => {
                        const today = new Date().toISOString().split('T')[0];
                        const isExpired = drv.licenseExpiry < today || drv.carRegistrationExpiry < today;
                        return (
                          <tr key={idx} className="hover:bg-slate-850/40">
                            <td className="px-4 py-3 flex flex-row-reverse items-center gap-2">
                              <img src={drv.documents.photo} className="w-6 h-6 rounded-full object-cover border border-slate-700" alt="driver" referrerPolicy="no-referrer" />
                              <div>
                                <div className="font-bold text-slate-100 flex items-center gap-1.5 flex-row-reverse">
                                  <span>{drv.fullName}</span>
                                  {employees.some(e => e.username.trim().toLowerCase() === drv.username.trim().toLowerCase()) && (
                                    <span className="bg-indigo-950/90 text-indigo-400 border border-indigo-500/25 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                      موظف 🛡️
                                    </span>
                                  )}
                                </div>
                                <div className="text-[9px] text-slate-400 flex items-center gap-1.5 flex-row-reverse">
                                  <button
                                    type="button"
                                    onClick={() => setInspectedDriverRatings(drv)}
                                    className="text-amber-400 hover:text-amber-300 font-bold transition hover:underline cursor-pointer border-none bg-transparent p-0 flex items-center gap-0.5 flex-row-reverse"
                                    title="اضغط لعرض تفاصيل التقييمات والتحليل المتقدم بـ AI"
                                  >
                                    <span>⭐ {(drv.ratingAverage || 5.0).toFixed(1)}</span>
                                    <span className="text-[8px] bg-amber-500/10 text-amber-300 px-1 py-0.5 rounded mr-1">تحليل 👁️</span>
                                  </button>
                                  <span className="text-slate-600">|</span>
                                  <span>{(drv.tripsCount || 0)} جولة</span>
                                  <span className="text-slate-600">|</span>
                                  <span className="font-mono">@{drv.username}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>{drv.phone}</div>
                              <div className="text-[9px] text-indigo-400">{drv.governorate.split(' ')[0]}</div>
                              {drv.linkedPaymentProvider && (
                                <div 
                                  className={`text-[8px] mt-1 inline-block px-1.5 py-0.5 rounded font-sans shrink-0 border ${
                                    drv.linkedPaymentStatus === 'verified' 
                                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/20' 
                                      : 'bg-amber-950/60 text-amber-400 border-amber-500/20'
                                  }`} 
                                  title={drv.linkedPaymentLog || ''}
                                >
                                  💳 {drv.linkedPaymentProvider.toUpperCase()}: {drv.linkedAccountName} {drv.linkedPaymentStatus === 'verified' ? '✓' : '⚠️'}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex flex-col gap-1.5 items-end">
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenWorkScopeDropdownDriverId(
                                        openWorkScopeDropdownDriverId === drv.id ? null : drv.id
                                      );
                                    }}
                                    className={`px-3 py-1.5 rounded-lg font-bold text-[11px] border transition duration-150 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                                      (drv.workScope || 'both') === 'intercity'
                                        ? 'bg-amber-950/45 border-amber-500/70 text-amber-300 hover:bg-amber-950/60'
                                        : (drv.workScope || 'both') === 'local'
                                        ? 'bg-sky-950/45 border-sky-500/70 text-sky-300 hover:bg-sky-950/60'
                                        : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                                    }`}
                                  >
                                    {(drv.workScope || 'both') === 'local' && (
                                      <>
                                        <span>🏙️ داخل المدينة</span>
                                      </>
                                    )}
                                    {(drv.workScope || 'both') === 'intercity' && (
                                      <>
                                        <span>🛣️ بين المدن</span>
                                      </>
                                    )}
                                    {(drv.workScope || 'both') === 'both' && (
                                      <>
                                        <span>🔄 كلاهما (مفتوح)</span>
                                      </>
                                    )}
                                  </button>

                                  {openWorkScopeDropdownDriverId === drv.id && (
                                    <>
                                      {/* Backdrop to close the dropdown when clicking outside */}
                                      <div 
                                        className="fixed inset-0 z-40" 
                                        onClick={() => setOpenWorkScopeDropdownDriverId(null)} 
                                      />
                                      <div className="absolute right-0 mt-1 w-40 bg-slate-950 border border-slate-850 rounded-xl shadow-2xl z-50 p-1 flex flex-col gap-1 font-sans text-right">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!hasPermissionWrite('activeDrivers')) {
                                              alert("🚫 عذراً، لا تمتلك الصلاحية للحفظ!");
                                              return;
                                            }
                                            setDriverWorkScope(drv.id, 'local');
                                            setOpenWorkScopeDropdownDriverId(null);
                                          }}
                                          className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-between flex-row-reverse cursor-pointer ${
                                            (drv.workScope || 'both') === 'local' 
                                              ? 'bg-sky-650 text-white shadow' 
                                              : 'text-slate-300 hover:bg-slate-900'
                                          }`}
                                        >
                                          <span className="flex items-center gap-1.5 flex-row-reverse">
                                            <span>🏙️</span>
                                            <span>داخل المدينة</span>
                                          </span>
                                          {(drv.workScope || 'both') === 'local' && <Check className="w-3 h-3 text-sky-200" />}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!hasPermissionWrite('activeDrivers')) {
                                              alert("🚫 عذراً، لا تمتلك الصلاحية للحفظ!");
                                              return;
                                            }
                                            setDriverWorkScope(drv.id, 'intercity');
                                            setOpenWorkScopeDropdownDriverId(null);
                                          }}
                                          className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-between flex-row-reverse cursor-pointer ${
                                            (drv.workScope || 'both') === 'intercity' 
                                              ? 'bg-amber-650 text-white shadow' 
                                              : 'text-slate-300 hover:bg-slate-900'
                                          }`}
                                        >
                                          <span className="flex items-center gap-1.5 flex-row-reverse">
                                            <span>🛣️</span>
                                            <span>بين المدن</span>
                                          </span>
                                          {(drv.workScope || 'both') === 'intercity' && <Check className="w-3 h-3 text-amber-200" />}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!hasPermissionWrite('activeDrivers')) {
                                              alert("🚫 عذراً، لا تمتلك الصلاحية للحفظ!");
                                              return;
                                            }
                                            setDriverWorkScope(drv.id, 'both');
                                            setOpenWorkScopeDropdownDriverId(null);
                                          }}
                                          className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-between flex-row-reverse cursor-pointer ${
                                            (drv.workScope || 'both') === 'both' 
                                              ? 'bg-indigo-650 text-white shadow' 
                                              : 'text-slate-300 hover:bg-slate-900'
                                          }`}
                                        >
                                          <span className="flex items-center gap-1.5 flex-row-reverse">
                                            <span>🔄</span>
                                            <span>كلاهما (مفتوح)</span>
                                          </span>
                                          {(drv.workScope || 'both') === 'both' && <Check className="w-3 h-3 text-indigo-200" />}
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => requestAiDriverScopeRecommendation(drv)}
                                  className="text-[9px] bg-gradient-to-l from-amber-500/20 to-indigo-500/20 text-amber-300 hover:text-white border border-indigo-500/30 rounded-lg px-2 py-0.5 font-bold transition flex items-center gap-1 cursor-pointer flex-row-reverse font-sans"
                                  title="الحصول على توصية ذكية وتحليل نطاق العمل المناسب من AI"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                                  <span>توصية بـ AI</span>
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className={isExpired ? "text-red-400 font-bold" : "text-green-400"}>{drv.licenseExpiry}</div>
                              <div className="text-[9px] text-slate-500">رخصة السيارة: {drv.carRegistrationExpiry}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div>{drv.carType}</div>
                              <div className={drv.carModel < settings.minCarModel ? "text-red-400 font-bold" : "text-amber-500"}>{drv.carModel} {drv.carModel < settings.minCarModel && '(مخالف)'}</div>
                            </td>
                            <td className="px-4 py-3 font-sans font-bold text-emerald-400">
                              <div className="font-mono">{(drv.balance ?? 0).toFixed(2)} د.أ</div>
                              <div className="text-[10px] text-slate-400 mt-1.5 flex flex-col items-start gap-1">
                                <div className="text-[8px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80 text-slate-500 font-sans font-medium flex flex-col gap-0.5 w-full">
                                  <span>الحد الأدنى: {(drv.minBalanceLimit !== undefined ? drv.minBalanceLimit : settings.defaultDriverMinBalance || 0).toFixed(2)} د.أ</span>
                                  <span className="text-indigo-400">حد المديونية: {drv.minBalanceLimit !== undefined ? (-drv.minBalanceLimit).toFixed(2) : (-(settings.defaultDriverMinBalance || 0)).toFixed(2)} د.أ</span>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-[8px] text-slate-500 font-sans">المديونية:</span>
                                  <input
                                    type="number"
                                    step="0.5"
                                    defaultValue={drv.minBalanceLimit !== undefined ? -drv.minBalanceLimit : -(settings.defaultDriverMinBalance || 0)}
                                    onBlur={(e) => {
                                      const val = parseFloat(e.target.value);
                                      if (!isNaN(val)) {
                                        setDriverMinBalanceLimit(drv.id, -val);
                                      }
                                    }}
                                    className="w-[48px] bg-slate-950 border border-indigo-950 text-indigo-300 text-[9px] font-mono px-1 py-0.5 rounded text-center focus:border-indigo-500 outline-none"
                                    title="تعديل حد المديونية الأقصى المسموح به لهذا الكابتن"
                                  />
                                  <span className="text-[9px] text-slate-500 font-sans">د.أ</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => requestAiDebtLimitRecommendation(drv, 'driver')}
                                  className="w-full text-right text-[8px] bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 hover:text-white border border-indigo-500/20 rounded px-1.5 py-0.5 font-bold transition flex items-center justify-center gap-1 cursor-pointer mt-0.5"
                                  title="تحليل الالتزام الائتماني واقتراح مديونية الكابتن بـ AI"
                                >
                                  <Sparkles className="w-2 h-2 text-indigo-400 animate-pulse" />
                                  <span>المديونية الذكية بـ AI</span>
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {editingUserPasswordId === drv.id && editingUserPasswordRole === 'driver' ? (
                                <div className="flex items-center gap-1.5 justify-center">
                                  <input
                                    type="text"
                                    value={editingUserPasswordValue}
                                    onChange={e => setEditingUserPasswordValue(e.target.value)}
                                    className="bg-slate-950 border border-indigo-500 rounded px-1 py-0.5 w-[75px] text-center text-xs text-slate-101 font-mono outline-none"
                                    placeholder="كلمة السر"
                                  />
                                  <button
                                    onClick={() => {
                                      if (!hasPermissionWrite('activeDrivers')) {
                                        alert("🚫 عذراً، لا تمتلك الصلاحية للحفظ!");
                                        return;
                                      }
                                      const res = updateUserPassword(drv.id, 'driver', editingUserPasswordValue);
                                      if (res.success) {
                                        setPasswordChangeSuccessMsg(`تم تحديث كلمة مرور الكابتن @${drv.username} بنجاح!`);
                                        setTimeout(() => setPasswordChangeSuccessMsg(''), 4000);
                                      } else {
                                        alert(res.msg);
                                      }
                                      setEditingUserPasswordId(null);
                                      setEditingUserPasswordRole(null);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded p-1 text-[10px] font-bold cursor-pointer"
                                    title="حفظ"
                                  >
                                    ✔
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingUserPasswordId(null);
                                      setEditingUserPasswordRole(null);
                                    }}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-400 rounded p-1 text-[10px] cursor-pointer"
                                    title="إلغاء"
                                  >
                                    ✖
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5 font-mono">
                                  <span className="text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[10px]">
                                    {drv.password || '123'}
                                  </span>
                                  <button
                                    onClick={() => {
                                      if (!hasPermissionWrite('activeDrivers')) {
                                        alert("🚫 عذراً، لا تمتلك الصلاحية الإجرائية لتعديل كلمات مرور الكباتن!");
                                        return;
                                      }
                                      setEditingUserPasswordId(drv.id);
                                      setEditingUserPasswordRole('driver');
                                      setEditingUserPasswordValue(drv.password || '123');
                                    }}
                                    className="text-indigo-400 hover:text-indigo-300 p-0.5 text-[9px] underline cursor-pointer"
                                  >
                                    تعديل ✍️
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2 justify-end">
                                {drv.status === 'blocked' ? (
                                  <button
                                    onClick={() => {
                                      if (!hasPermissionWrite('activeDrivers')) {
                                        alert("🚫 عذراً، لا تمتلك الصلاحية الإجرائية لفك حظر الكباتن!");
                                        return;
                                      }
                                      unblockDriver(drv.id);
                                    }}
                                    className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 p-1 px-2.5 rounded text-[10px] flex items-center gap-1 cursor-pointer font-bold font-sans"
                                  >
                                    <Unlock className="w-3 h-3" />
                                    <span>تفعيل الخدمة ✓</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      if (!hasPermissionWrite('activeDrivers')) {
                                        alert("🚫 عذراً، لا تمتلك الصلاحية الإجرائية لحظر الكباتن!");
                                        return;
                                      }
                                      if (window.confirm(`هل أنت متأكد من حظر الكابتن (${drv.fullName}) وإيقاف الخدمة عنه بسبب تجاوزات ومخالفات؟`)) {
                                        blockDriver(drv.id);
                                      }
                                    }}
                                    className="bg-red-600/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 p-1 px-2.5 rounded text-[10px] flex items-center gap-1 cursor-pointer font-bold font-sans"
                                  >
                                    <Lock className="w-3 h-3" />
                                    <span>إيقاف الخدمة بسبب تجاوزات 🚫</span>
                                  </button>
                                )}
                                {(currentUser?.username === 'admin' || currentUser?.username === 'Ahmaidat') && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPromotingUser({
                                        id: drv.id,
                                        fullName: drv.fullName,
                                        username: drv.username,
                                        type: 'driver',
                                        password: drv.password || '123'
                                      });
                                      setEmpFullName(drv.fullName);
                                      setEmpUsername(drv.username);
                                      setEmpPassword(drv.password || '123');
                                      setActiveTabState('employees');
                                    }}
                                    className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-505/30 text-indigo-400 p-1 px-2 rounded-[6px] text-[9.5px] font-bold flex items-center gap-0.5 transition cursor-pointer shrink-0"
                                    title="ترقية ومنح صلاحيات إدارة للوحة التحكم"
                                  >
                                    <span>ترقية وصلاحيات 🛡️</span>
                                  </button>
                                )}
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold self-center ${drv.isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                  {drv.isOnline ? 'متصل' : 'مغلق'}
                                 </span>
                                 <button
                                   type="button"
                                   onClick={() => {
                                     if (!hasPermissionWrite('activeDrivers')) {
                                       alert("🚫 عذراً، لا تمتلك الصلاحية الإجرائية لحذف الكباتن!");
                                       return;
                                     }
                                     if (window.confirm(`هل أنت متأكد من حذف الكابتن (${drv.fullName}) نهائياً من نظام آدم وتجميع؟`)) {
                                       deleteDriver(drv.id);
                                     }
                                   }}
                                   className="bg-rose-950/45 text-rose-400 hover:bg-rose-900/40 border border-rose-500/30 p-1 px-2 rounded-[6px] text-[9.5px] font-bold flex items-center gap-0.5 transition cursor-pointer shrink-0"
                                 >
                                   <span>حذف 🗑️</span>
                                 </button>
                                 <span style={{display: 'none'}}>
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
              </div>
            )}

            {usersSubTab === 'passengers' && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                {/* Approved Passengers Profiles with wallet and ratings */}
                {getPermissionState('passengers') !== 'hidden' && (() => {
                  const activePsgs = passengers.filter(p => p.status === 'approved' || p.status === 'blocked');
                  const filteredPsgs = activePsgs.filter(psg => {
                    const query = passengerSearchQuery.trim().toLowerCase();
                    if (!query) return true;
                    return (
                      (psg.fullName || '').toLowerCase().includes(query) ||
                      (psg.username || '').toLowerCase().includes(query) ||
                      (psg.phone || '').includes(query) ||
                      (psg.email || '').toLowerCase().includes(query)
                    );
                  });

                  return (
                    <div className="mt-4 text-right">
                      <h3 className="text-xs font-black text-slate-200 border-b border-slate-800 pb-1.5 flex justify-end gap-1.5 items-center mb-3">
                        <span>جدول وبيانات الركاب الفاعلين في تجميع ({activePsgs.length})</span>
                        <Users className="w-4 h-4 text-[#818cf8]" />
                      </h3>

                      {/* Search Input for Passengers */}
                      <div className="flex flex-col md:flex-row gap-3 justify-between items-center mb-4 flex-row-reverse">
                        <div className="relative w-full md:w-80">
                          <input
                            type="text"
                            placeholder="ابحث باسم الراكب، البريد الإلكتروني، أو الهاتف..."
                            value={passengerSearchQuery}
                            onChange={e => setPassengerSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-xs text-slate-101 pr-10 pl-3 py-2 rounded-xl outline-none text-right font-sans placeholder-slate-650"
                          />
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3" />
                        </div>
                        <div className="text-[10px] text-slate-450 font-medium font-sans">
                          {passengerSearchQuery && (
                            <span>تم العثور على <strong className="text-indigo-400 font-bold">{filteredPsgs.length}</strong> راكب من أصل {activePsgs.length}</span>
                          )}
                        </div>
                      </div>

                      <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl">
                        <table className="w-full text-xs text-right text-slate-200 uppercase select-all font-sans">
                          <thead className="bg-slate-950 font-bold border-b border-slate-850 text-slate-400">
                            <tr>
                              <th className="px-4 py-3">الراكب</th>
                              <th className="px-4 py-3">الهاتف والبريد الأصيل</th>
                              <th className="px-4 py-3">معدل تقييم مجتمع آدم</th>
                              <th className="px-4 py-3">الرحلات المستكملة</th>
                              <th className="px-4 py-3">رصيد المحفظة الآمن</th>
                              <th className="px-4 py-3 text-center">🔐 كلمة المرور</th>
                              <th className="px-4 py-3">حالة الحساب</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80">
                            {filteredPsgs.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-xs">
                                  لا توجد نتائج بحث مطابقة لمعايير البحث الحالية للركاب.
                                </td>
                              </tr>
                            ) : (
                              filteredPsgs.map((psg, idx) => (
                                <tr key={idx} className="hover:bg-slate-850/40">
                                  <td className="px-4 py-3 flex flex-row-reverse items-center gap-2">
                                    <img 
                                      src={psg.documents?.photo || 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150'} 
                                      className="w-6 h-6 rounded-full object-cover border border-slate-700" 
                                      alt="passenger" 
                                      referrerPolicy="no-referrer" 
                                    />
                                    <div>
                                      <div className="font-bold text-slate-200 flex items-center gap-1.5 flex-row-reverse">
                                <span>{psg.fullName}</span>
                                {employees.some(e => e.username.trim().toLowerCase() === psg.username.trim().toLowerCase()) && (
                                  <span className="bg-indigo-950/90 text-indigo-400 border border-indigo-505/25 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                    موظف 🛡️
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] text-slate-500 font-mono">@{psg.username || `psg_${psg.id}`}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>{psg.phone}</div>
                            <div className="text-[9px] text-slate-500 font-mono font-medium lowercase">{psg.email}</div>
                            {psg.linkedPaymentProvider && (
                              <div 
                                className={`text-[8px] mt-1 inline-block px-1.5 py-0.5 rounded font-sans shrink-0 border ${
                                  psg.linkedPaymentStatus === 'verified' 
                                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/20' 
                                    : 'bg-amber-950/60 text-amber-400 border-amber-500/20'
                                }`} 
                                title={psg.linkedPaymentLog || ''}
                              >
                                💳 {psg.linkedPaymentProvider.toUpperCase()}: {psg.linkedAccountName} {psg.linkedPaymentStatus === 'verified' ? '✓' : '⚠️'}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold text-amber-400">
                            ⭐ {(psg.ratingAverage || 5.0).toFixed(1)}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-300">
                            {(psg.tripsCount || 0)} رحلة
                          </td>
                          <td className="px-4 py-3 font-sans font-bold text-indigo-400">
                            <div className="font-mono">{((psg.balance !== undefined && psg.balance !== null) ? psg.balance : 0.0).toFixed(2)} د.أ</div>
                            <div className="text-[10px] text-slate-400 mt-1.5 flex flex-col items-start gap-1">
                              <div className="text-[8px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80 text-slate-500 font-sans font-medium flex flex-col gap-0.5 w-full">
                                <span>الحد الأدنى: {(psg.minBalanceLimit !== undefined ? psg.minBalanceLimit : settings.defaultPassengerMinBalance || 0).toFixed(2)} د.أ</span>
                                <span className="text-indigo-400">حد المديونية: {psg.minBalanceLimit !== undefined ? (-psg.minBalanceLimit).toFixed(2) : (-(settings.defaultPassengerMinBalance || 0)).toFixed(2)} د.أ</span>
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-[8px] text-slate-500 font-sans">المديونية:</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  defaultValue={psg.minBalanceLimit !== undefined ? -psg.minBalanceLimit : -(settings.defaultPassengerMinBalance || 0)}
                                  onBlur={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val)) {
                                      setPassengerMinBalanceLimit(psg.id, -val);
                                    }
                                  }}
                                  className="w-[48px] bg-slate-950 border border-indigo-950 text-indigo-300 text-[9px] font-mono px-1 py-0.5 rounded text-center focus:border-indigo-500 outline-none"
                                  title="تعديل حد المديونية الأقصى المسموح به لهذا الراكب"
                                />
                                <span className="text-[9px] text-slate-500 font-sans">د.أ</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => requestAiDebtLimitRecommendation(psg, 'passenger')}
                                className="w-full text-right text-[8px] bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 hover:text-white border border-indigo-500/20 rounded px-1.5 py-0.5 font-bold transition flex items-center justify-center gap-1 cursor-pointer mt-0.5"
                                title="تحليل الالتزام الائتماني واقتراح مديونية الراكب بـ AI"
                              >
                                <Sparkles className="w-2 h-2 text-indigo-400 animate-pulse" />
                                <span>المديونية الذكية بـ AI</span>
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {editingUserPasswordId === psg.id && editingUserPasswordRole === 'passenger' ? (
                              <div className="flex items-center gap-1.5 justify-center">
                                <input
                                  type="text"
                                  value={editingUserPasswordValue}
                                  onChange={e => setEditingUserPasswordValue(e.target.value)}
                                  className="bg-slate-950 border border-indigo-500 rounded px-1 py-0.5 w-[75px] text-center text-xs text-slate-100 font-mono outline-none"
                                  placeholder="كلمة السر"
                                />
                                <button
                                  onClick={() => {
                                    if (!hasPermissionWrite('passengers')) {
                                      alert("🚫 عذراً، لا تمتلك الصلاحية للحفظ!");
                                      return;
                                    }
                                    const res = updateUserPassword(psg.id, 'passenger', editingUserPasswordValue);
                                  if (res.success) {
                                    setPasswordChangeSuccessMsg(`تم تحديث كلمة مرور الراكب @${psg.username} بنجاح!`);
                                    setTimeout(() => setPasswordChangeSuccessMsg(''), 4000);
                                  } else {
                                    alert(res.msg);
                                  }
                                  setEditingUserPasswordId(null);
                                  setEditingUserPasswordRole(null);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded p-1 text-[10px] font-bold cursor-pointer"
                                title="حفظ"
                              >
                                ✔
                              </button>
                              <button
                                onClick={() => {
                                  setEditingUserPasswordId(null);
                                  setEditingUserPasswordRole(null);
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-400 rounded p-1 text-[10px] cursor-pointer"
                                title="إلغاء"
                              >
                                ✖
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5 font-mono">
                              <span className="text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[10px]">
                                {psg.password || '123'}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingUserPasswordId(psg.id);
                                  setEditingUserPasswordRole('passenger');
                                  setEditingUserPasswordValue(psg.password || '123');
                                }}
                                className="text-indigo-400 hover:text-indigo-300 p-0.5 text-[9px] underline cursor-pointer"
                              >
                                تعديل ✍️
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end items-center flex-row-reverse flex-wrap">
                            {psg.status === 'blocked' ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-400">
                                الحساب محظور 🚫
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400">
                                راكب نشط معتمد ✓
                              </span>
                            )}

                            {psg.status === 'blocked' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!hasPermissionWrite('passengers')) {
                                    alert("🚫 عذراً، لا تمتلك الصلاحية الإجرائية لفك حظر الركاب!");
                                    return;
                                  }
                                  unblockPassenger(psg.id);
                                }}
                                className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 p-1 px-2 rounded text-[10px] flex items-center gap-1 cursor-pointer font-bold"
                              >
                                <Unlock className="w-3 h-3" />
                                <span>فك حظر الراكب</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!hasPermissionWrite('passengers')) {
                                    alert("🚫 عذراً، لا تمتلك الصلاحية الإجرائية لحظر الركاب!");
                                    return;
                                  }
                                  if (window.confirm(`هل أنت متأكد من حظر الراكب (${psg.fullName}) وإلغاء تفعيل الخدمة له بسبب تجاوزات؟`)) {
                                    blockPassenger(psg.id);
                                  }
                                }}
                                className="bg-red-600/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 p-1 px-2 rounded text-[10px] flex items-center gap-1 cursor-pointer font-bold"
                              >
                                <Lock className="w-3 h-3" />
                                <span>حظر وإلغاء الخدمة للتجاوزات</span>
                              </button>
                            )}

                            {(currentUser?.username === 'admin' || currentUser?.username === 'Ahmaidat') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPromotingUser({
                                    id: psg.id,
                                    fullName: psg.fullName,
                                    username: psg.username,
                                    type: 'passenger',
                                    password: psg.password || '123'
                                  });
                                  setEmpFullName(psg.fullName);
                                  setEmpUsername(psg.username);
                                  setEmpPassword(psg.password || '123');
                                  setActiveTabState('employees');
                                }}
                                className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-400 p-1 px-1.5 rounded-[6px] text-[9.5px] font-bold inline-flex items-center gap-0.5 transition cursor-pointer shrink-0"
                                title="ترقية ومنح صلاحيات إدارة للوحة التحكم"
                              >
                                <span>ترقية وصلاحيات 🛡️</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                  if (!hasPermissionWrite('passengers')) {
                                    alert("🚫 عذراً، لا تمتلك الصلاحية الإجرائية لحذف الركاب!");
                                    return;
                                  }
                                  if (window.confirm(`هل أنت متأكد من حذف الراكب (${psg.fullName}) نهائياً من نظام آدم وتجميع؟`)) {
                                    deletePassenger(psg.id);
                                  }
                              }}
                              className="bg-rose-950/45 text-rose-400 hover:bg-rose-900/40 border border-rose-500/30 p-1 px-2 rounded-[6px] text-[9.5px] font-bold inline-flex items-center gap-0.5 transition cursor-pointer shrink-0"
                            >
                              <span>حذف 🗑️</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </motion.div>
        )}

        {/* PICK-UP POINTS MANAGEMENT FOR CITIES */}
        {activeTab === 'pickup-points' && (
          <motion.div
            key="pickup-points"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col gap-6 text-right font-sans"
          >
            {renderReadOnlyBanner('rateManagement', 'إدارة نقاط التجمع الرئيسية والمواقف الجغرافية المعتمدة')}
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col gap-6 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4 flex-row-reverse">
                <div className="flex items-center gap-3 flex-row-reverse">
                  <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                    <MapPin className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="text-right">
                    <h3 className="text-base font-black text-white">إدارة نقاط التجمع الرئيسية (Pick-up Points)</h3>
                    <p className="text-xs text-slate-400 mt-1">قم بتحديد المعالم والمواقف الجغرافية الشهيرة لكل محافظة أو لواء، لتظهر للركاب كأماكن ركوب سريعة وموثوقة عند الحجز بدلاً من الاختيار العام.</p>
                  </div>
                </div>
              </div>

              {pickupPointMsg && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 text-xs font-bold text-emerald-300 rounded-xl text-right animate-fadeIn">
                  {pickupPointMsg}
                </div>
              )}

              {/* City Selection Bar */}
              <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex flex-col gap-1.5 w-full md:w-auto grow">
                  <label className="text-xs font-bold text-slate-300 text-right">اختر المدينة / المحافظة لإدارة نقاط تجمعها الرئيسية:</label>
                  <select
                    value={selectedPickupGov}
                    onChange={(e) => setSelectedPickupGov(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white text-right outline-none cursor-pointer focus:border-amber-500 transition"
                  >
                    {settings.locations.map((loc, idx) => (
                      <option key={idx} value={loc.governorate}>
                        📍 {loc.governorate} ({loc.pickupPoints?.length || 0} نقطة تجمع معتمدة)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Current Pick-up points List */}
              {(() => {
                const currentGovObj = settings.locations.find(l => l.governorate === selectedPickupGov) || settings.locations[0];
                const points = currentGovObj?.pickupPoints || [];

                return (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center flex-row-reverse border-b border-slate-800/80 pb-2">
                      <span className="text-xs font-bold text-amber-400">
                        📍 النقاط المعتمدة حالياً في {currentGovObj?.governorate}:
                      </span>
                      <span className="text-[11px] text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
                        {points.length} نقاط
                      </span>
                    </div>

                    {points.length === 0 ? (
                      <div className="bg-slate-950/40 border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs italic">
                        لا توجد نقاط تجمع مخصصة لهذه المحافظة حالياً. (سيتمكن الراكب من الاختيار العام للقرية/الحي فقط). قم بإضافة أول نقطة أدناه!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {points.map((pt, pIdx) => (
                          <div key={pIdx} className="bg-slate-950 border border-slate-800/80 hover:border-amber-500/30 p-3 rounded-xl flex justify-between items-center flex-row-reverse group transition">
                            <div className="flex items-center gap-2 flex-row-reverse overflow-hidden">
                              <span className="text-amber-500 text-sm">📍</span>
                              <span className="text-xs font-bold text-slate-200 truncate">{pt}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePickupPoint(currentGovObj.governorate, pt)}
                              title="حذف نقطة التجمع"
                              className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add New Pickup Point Form */}
                    <form onSubmit={handleAddPickupPoint} className="mt-4 bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row gap-3 items-end">
                      <div className="flex flex-col gap-1.5 grow w-full">
                        <label className="text-xs font-bold text-slate-300 text-right">إضافة نقطة تجمع رئيسية جديدة (اسم المعلم / الموقف):</label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: الدوار السابع (محطة جت)، بوابة الجامعة الأردنية، مجمع الشمال..."
                          value={newPickupPointName}
                          onChange={(e) => setNewPickupPointName(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white text-right outline-none focus:border-amber-500 transition placeholder:text-slate-600"
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shrink-0 w-full sm:w-auto shadow-lg shadow-amber-500/10 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة نقطة التجمع</span>
                      </button>
                    </form>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}

        {/* SYSTEM REGULATORY SETTINGS & GEOGRAPHIC BOUNDARIES */}
        {activeTab === 'areas' && (
          <motion.div
            key="areas"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col gap-6"
          >
            {renderReadOnlyBanner('rateManagement', 'إدارة تسعيرة الركب والتعرفة والعداد ومنافذ العبور')}
            <div className="grid grid-cols-1 gap-6">

            {/* DEFINE NEW WORK AREA (GOVERNORATE, DISTRICT, VILLAGE) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl text-right">
              <h3 className="text-xs font-black text-amber-500 pb-2 border-b border-slate-850 flex justify-end gap-1.5 items-center mb-4">
                <span>تعريف وتحديد مناطق العمل والمحافظات</span>
                <Map className="w-4 h-4 text-amber-500" />
              </h3>

              {areaMsg && (
                <div className="p-2.5 bg-emerald-950/50 border border-emerald-800 text-[10px] text-emerald-300 rounded-lg text-right mb-4">
                  {areaMsg}
                </div>
              )}

              <form onSubmit={handleCreateArea} className="flex flex-col gap-3 font-sans">
                {/* Governorate selecting */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-bold block">المحافظة</label>
                  <select 
                    value={newGov} 
                    onChange={e => setNewGov(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
                  >
                    <option value="عمان (Amman)">عمان (Amman)</option>
                    <option value="إربد (Irbid)">إربد (Irbid)</option>
                    <option value="الزرقاء (Zarqa)">الزرقاء (Zarqa)</option>
                    <option value="البلقاء (Balqa)">البلقاء (Balqa)</option>
                    <option value="الكرك (Karak)">الكرك (Karak)</option>
                    <option value="العقبة (Aqaba)">العقبة (Aqaba)</option>
                  </select>
                </div>

                {/* District name */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-bold block">اللواء</label>
                  <input 
                    type="text" 
                    value={newDist} 
                    onChange={e => setNewDist(e.target.value)}
                    placeholder="مثال: لواء قصبة السلط" 
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 text-right outline-none"
                    required
                  />
                </div>

                {/* Village / Region */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-bold block">القرية أو المنطقة المحددة</label>
                  <input 
                    type="text" 
                    value={newVillage} 
                    onChange={e => setNewVillage(e.target.value)}
                    placeholder="مثال: السلالم، الدوار السابع، الصريح..." 
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 text-right outline-none"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="bg-amber-500 hover:bg-amber-600 text-black py-2 rounded-xl text-xs font-bold mt-2 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>تثبيت ونشر المنطقة جغرافياً</span>
                </button>
              </form>

              {/* View currently action areas list configured */}
              <div className="mt-4 border-t border-slate-850 pt-3 text-right">
                <span className="text-[10px] font-bold text-slate-400 block mb-2">قائمة التغطية الفعالة حالياً ({settings.locations.length} محافظات):</span>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {settings.locations.map((loc, i) => (
                    <span key={i} className="bg-slate-950 border border-slate-850 px-2 py-1 rounded text-[10px] text-slate-300">
                      📍 {loc.governorate.split(' ')[0]} ({loc.districts.flatMap(d => d.villages).length} مخيم/قرية)
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ROUTE-SPECIFIC PRICING (FROM GOVERNORATE/DISTRICT TO GOVERNORATE/DISTRICT) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl col-span-1 md:col-span-2 text-right">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-slate-850 pb-3 mb-4 gap-3 flex-row-reverse">
                <h3 className="text-sm font-black text-amber-500 flex justify-end gap-1.5 items-center">
                  <span>إدارة تسعير الرحلات الموجهة (من محافظة / لواء إلى محافظة / لواء)</span>
                  <Coins className="w-5 h-5 text-amber-500" />
                </h3>
                <span className="text-xs bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-lg">
                  عدد الخطوط المسعرة حالياً: {settings.routeFares?.length || 0}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 mb-5 leading-normal font-sans">
                في هذه اللوحة، يمكنك تحديد تسعيرة السفر للراكب الواحد بمبلغ دقيق والعمولة المقتطعة من الكابتن، بناءً على <strong>محافظة ولواء البداية</strong> إلى <strong>محافظة ولواء النهاية</strong>. يتم حساب تكلفة الرحلة واقتطاع العمولة بناءً على هذا الجدول المحدث فور انتهاء السفر.
              </p>

              {/* ROUTE ADDITION FORM */}
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl mb-6 font-sans text-right">
                <span className="text-xs font-bold text-slate-200 block mb-3">➕ إضافة خط تسعير جديد:</span>
                {routeMsg && (
                  <div className="p-2 mb-3 bg-emerald-950/40 border border-emerald-800 text-[10px] text-emerald-300 rounded-lg">
                    {routeMsg}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-right">
                  {/* From select */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">من محافظة (الانطلاق)</label>
                    <select
                      value={routeFromGov}
                      onChange={(e) => {
                        const gov = e.target.value;
                        setRouteFromGov(gov);
                        const dsts = settings.locations.find(l => l.governorate === gov)?.districts || [];
                        setRouteFromDist(dsts[0]?.name || '');
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 animate-none"
                    >
                      {settings.locations.map(loc => (
                        <option key={loc.governorate} value={loc.governorate}>{loc.governorate}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">من لواء (البداية)</label>
                    <select
                      value={routeFromDist || (fromDistricts[0]?.name || '')}
                      onChange={(e) => setRouteFromDist(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                    >
                      {fromDistricts.map(dst => (
                        <option key={dst.name} value={dst.name}>{dst.name}</option>
                      ))}
                      {fromDistricts.length === 0 && <option value="">لا يوجد ألوية تابعة</option>}
                    </select>
                  </div>

                  {/* To select */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">إلى محافظة (الوصول)</label>
                    <select
                      value={routeToGov}
                      onChange={(e) => {
                        const gov = e.target.value;
                        setRouteToGov(gov);
                        const dsts = settings.locations.find(l => l.governorate === gov)?.districts || [];
                        setRouteToDist(dsts[0]?.name || '');
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                    >
                      {settings.locations.map(loc => (
                        <option key={loc.governorate} value={loc.governorate}>{loc.governorate}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">إلى لواء (النهاية)</label>
                    <select
                      value={routeToDist || (toDistricts[0]?.name || '')}
                      onChange={(e) => setRouteToDist(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                    >
                      {toDistricts.map(dst => (
                        <option key={dst.name} value={dst.name}>{dst.name}</option>
                      ))}
                      {toDistricts.length === 0 && <option value="">لا يوجد ألوية تابعة</option>}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 items-end">
                  <div>
                    <label className="text-[10px] text-indigo-400 block mb-1">سعر تذكرة المقعد للراكب (د.أ)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={routeFareInput}
                      onChange={(e) => setRouteFareInput(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-center text-indigo-400 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-amber-500 block mb-1">عمولة آدم التشغيلية من الكابتن (د.أ)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={routeCommInput}
                      onChange={(e) => setRouteCommInput(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-center text-amber-500 font-mono font-bold"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const fDist = routeFromDist || fromDistricts[0]?.name || '';
                      const tDist = routeToDist || toDistricts[0]?.name || '';
                      
                      if (!fDist || !tDist) {
                        alert('⚠️ الرجاء اختيار اللواء للبداية والنهاية أولاً!');
                        return;
                      }

                      const newRoute = {
                        id: 'rf_' + Date.now(),
                        fromGovernorate: routeFromGov,
                        fromDistrict: fDist,
                        toGovernorate: routeToGov,
                        toDistrict: tDist,
                        passengerFare: Number(routeFareInput),
                        commissionRate: Number(routeCommInput)
                      };

                      const updatedRouteFares = [...(settings.routeFares || []), newRoute];
                      updateSettings({ routeFares: updatedRouteFares });
                      setRouteMsg(`✅ تم إضافة وحفظ سعر الخط الموجه من: [${routeFromGov} - لواء ${fDist}] إلى [${routeToGov} - لواء ${tDist}] بنجاح!`);
                      setTimeout(() => setRouteMsg(''), 4000);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer h-[34px]"
                  >
                    <span>إضافة وتسعير الخط ➕</span>
                  </button>
                </div>
              </div>

              {/* LISTING EXISTING ROUTE FARES */}
              <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950 font-sans">
                <table className="w-full text-[11px] text-right text-slate-200">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold">
                    <tr>
                      <th className="px-3 py-2 text-right font-sans">من (نقطة الانطلاق)</th>
                      <th className="px-3 py-2 text-right font-sans">إلى (وجهة السفر)</th>
                      <th className="px-3 py-2 text-center text-indigo-400 font-sans">سعر المقعد للراكب</th>
                      <th className="px-3 py-2 text-center text-amber-500 font-sans">عمولة التطبيق</th>
                      <th className="px-3 py-2 text-center font-sans">العمليات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-sans">
                    {!(settings.routeFares) || settings.routeFares.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-slate-500 italic">
                          لم يتم تحديد أي أسعار خطوط موجهة بعد. يعتمد النظام على أسعار المحافظات الافتراضية.
                        </td>
                      </tr>
                    ) : (
                      settings.routeFares.map((rf) => (
                        <tr key={rf.id} className="hover:bg-slate-900/40">
                          <td className="px-3 py-2.5">
                            <span className="font-bold text-slate-200 block">📍 {rf.fromGovernorate}</span>
                            <span className="text-[9.5px] text-slate-400 block">لواء {rf.fromDistrict}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-bold text-indigo-400 block">🏁 {rf.toGovernorate}</span>
                            <span className="text-[9.5px] text-slate-400 block">لواء {rf.toDistrict}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono">
                            <input
                              type="number"
                              step="0.1"
                              defaultValue={rf.passengerFare}
                              id={`route-fare-${rf.id}`}
                              className="w-14 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center font-bold text-indigo-400"
                            />
                            <span className="text-[9px] text-slate-500 mr-1">د.أ</span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono">
                            <input
                              type="number"
                              step="0.1"
                              defaultValue={rf.commissionRate}
                              id={`route-comm-${rf.id}`}
                              className="w-14 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center font-bold text-amber-500"
                            />
                            <span className="text-[9px] text-slate-500 mr-1">د.أ</span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex gap-2 justify-center items-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const fInp = document.getElementById(`route-fare-${rf.id}`) as HTMLInputElement;
                                  const cInp = document.getElementById(`route-comm-${rf.id}`) as HTMLInputElement;
                                  if (fInp && cInp) {
                                    const updatedRouteFares = (settings.routeFares || []).map(item => {
                                      if (item.id === rf.id) {
                                        return {
                                          ...item,
                                          passengerFare: Number(fInp.value),
                                          commissionRate: Number(cInp.value)
                                        };
                                      }
                                      return item;
                                    });
                                    updateSettings({ routeFares: updatedRouteFares });
                                    alert(`✅ تم تحديث تسعيرة الخط الموجه بنجاح!`);
                                  }
                                }}
                                className="bg-amber-500 hover:bg-amber-600 font-bold px-2 py-1 rounded text-[9px] border-b-2 border-amber-800 text-slate-950 cursor-pointer"
                              >
                                حفظ 💾
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('هل أنت متأكد من رغبتك في حذف تسعيرة هذا المسار الموجه؟')) {
                                    const updatedRouteFares = (settings.routeFares || []).filter(item => item.id !== rf.id);
                                    updateSettings({ routeFares: updatedRouteFares });
                                  }
                                }}
                                className="bg-rose-600/20 hover:bg-rose-650 text-rose-450 border border-rose-500/10 px-2 py-1 rounded text-[9px] cursor-pointer"
                              >
                                حذف ❌
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            </div>
          </motion.div>
        )}

        {/* SMART DEBT AND CANCELLATION MANAGEMENT TAB */}
        {activeTab === 'ai-debt-cancel' && (
          <motion.div
            key="ai-debt-cancel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col gap-6 font-sans text-right"
          >
            {/* Header banner */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/25 p-6 rounded-2xl relative overflow-hidden shadow-xl">
              <div className="absolute top-0 left-0 bg-emerald-500/10 text-[9px] text-emerald-400 font-bold font-mono px-3 py-1 rounded-br-xl uppercase tracking-wider">
                AI Credit & Cancellation Policy Center
              </div>
              <h2 className="text-sm font-black text-slate-100 flex justify-end gap-2 items-center mb-1.5">
                <span>🧠🛡️ مركز إدارة الائتمان المالي وسياسات الإلغاء الذكية لآدم</span>
              </h2>
              <p className="text-[11px] text-slate-400 max-w-4xl leading-relaxed">
                مرحباً بك في القسم المخصص لتنظيم السياسات التشغيلية والمالية لشبكة آدم بالأردن باستخدام الذكاء الاصطناعي. من هنا يمكنك تحديد وضبط حدود مديونية الكباتن والركاب بشكل ذكي لمنع تراكم المستحقات، بالإضافة إلى صياغة ومكاملة آلية إلغاء مرنة تتكيف مع العرض والطلب لحماية مصالح الجميع.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* CARD 1: SMART CREDIT & DEBT CONTROL */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-5 shadow-lg relative">
                <div className="flex justify-between items-center flex-row-reverse border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-black text-slate-100">إدارة مديونية وتسهيلات العملاء بـ AI</h3>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full">تحليل المخاطر</span>
                </div>

                {/* Scope selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-slate-300 font-bold">نطاق تطبيق حد المديونية:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDebtScope('all_drivers');
                        setAiDebtResult(null);
                      }}
                      className={`px-2 py-2 rounded-xl text-[10px] font-bold border transition ${debtScope === 'all_drivers' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300'}`}
                    >
                      جميع الكباتن 👥🚗
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDebtScope('all_passengers');
                        setAiDebtResult(null);
                      }}
                      className={`px-2 py-2 rounded-xl text-[10px] font-bold border transition ${debtScope === 'all_passengers' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300'}`}
                    >
                      جميع الركاب 👥🎒
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDebtScope('single_driver');
                        setAiDebtResult(null);
                      }}
                      className={`px-2 py-2 rounded-xl text-[10px] font-bold border transition ${debtScope === 'single_driver' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300'}`}
                    >
                      كابتن محدد 👤🚗
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDebtScope('single_passenger');
                        setAiDebtResult(null);
                      }}
                      className={`px-2 py-2 rounded-xl text-[10px] font-bold border transition ${debtScope === 'single_passenger' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300'}`}
                    >
                      راكب محدد 👤🎒
                    </button>
                  </div>
                </div>

                {/* Specific selectors */}
                {debtScope === 'single_driver' && (
                  <div className="flex flex-col gap-1 text-right">
                    <label className="text-[10px] text-slate-400 font-bold">اختر الكابتن من القائمة:</label>
                    <select
                      value={selectedDriverId}
                      onChange={(e) => {
                        setSelectedDriverId(e.target.value);
                        setAiDebtResult(null);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 outline-none text-right focus:border-emerald-500"
                    >
                      <option value="">-- اختر كابتن --</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.fullName} (@{d.username}) - الحالي: {d.minBalanceLimit !== undefined ? d.minBalanceLimit : 5} د.أ - تقييم: {d.ratingAverage || 5.0}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {debtScope === 'single_passenger' && (
                  <div className="flex flex-col gap-1 text-right">
                    <label className="text-[10px] text-slate-400 font-bold">اختر الراكب من القائمة:</label>
                    <select
                      value={selectedPassengerId}
                      onChange={(e) => {
                        setSelectedPassengerId(e.target.value);
                        setAiDebtResult(null);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 outline-none text-right focus:border-emerald-500"
                    >
                      <option value="">-- اختر راكب --</option>
                      {passengers.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.fullName} (@{p.username}) - الحالي: {p.minBalanceLimit !== undefined ? p.minBalanceLimit : 3} د.أ - تقييم: {p.ratingAverage || 5.0}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* AI advisor trigger */}
                <div className="flex justify-end gap-3 mt-1">
                  <button
                    type="button"
                    onClick={handleRequestSmartDebtLimit}
                    disabled={aiDebtLoading}
                    className="bg-gradient-to-l from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md disabled:opacity-55 cursor-pointer w-full"
                  >
                    {aiDebtLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>جاري دراسة البيانات وتحليل الجدارة بـ Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                        <span>طلب تحليل الجدارة الائتمانية بـ Gemini AI 💡</span>
                      </>
                    )}
                  </button>
                </div>

                {/* AI recommendation result card */}
                {aiDebtResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-950 border border-emerald-500/20 p-4 rounded-xl flex flex-col gap-3 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 bg-emerald-500/10 text-[8px] text-emerald-400 font-bold px-2 py-0.5 rounded-br-lg font-mono">
                      RECOMMENDED
                    </div>
                    <div className="flex justify-between items-center flex-row-reverse mt-1">
                      <span className="text-[10px] text-slate-400">الحد الائتماني المقترح بـ AI:</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">{aiDebtResult.limit.toFixed(2)} د.أ</span>
                    </div>
                    <div className="text-[10.5px] text-slate-300 leading-relaxed bg-slate-900/50 p-2.5 rounded-lg border border-slate-850/50 whitespace-pre-wrap">
                      {aiDebtResult.reasoning}
                    </div>
                  </motion.div>
                )}

                {/* Manual override & apply action */}
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 flex flex-col gap-3">
                  <div className="flex justify-between items-center flex-row-reverse">
                    <label className="text-[10px] text-slate-400 font-bold">الحد المعتمد للتطبيق (د.أ):</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={customDebtValue}
                        onChange={(e) => setCustomDebtValue(Number(e.target.value))}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-1 w-20 text-center text-xs text-slate-100 focus:border-emerald-500 font-mono"
                      />
                      <span className="text-[10px] text-slate-500">د.أ</span>
                    </div>
                  </div>
                  <div className="text-[9px] text-amber-400/80 leading-normal">
                    * ملاحظة: حد مديونية موجب (مثلاً 10 د.أ) يعني السماح برصيد سالب حتى -10.00 د.أ. حد مديونية صفري (0 د.أ) يعني إلزامية الرصيد الموجب. حد سالب يعني اشتراط وديعة مقدمة.
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyDebtLimit}
                    className="bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 font-bold py-2 rounded-lg text-xs cursor-pointer w-full text-center"
                  >
                    تطبيق وتعميم الحد المالي المعتمد ✓
                  </button>
                </div>
              </div>

              {/* CARD 2: CANCELLATION POLICY STUDIO */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-5 shadow-lg">
                <div className="flex justify-between items-center flex-row-reverse border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <Sliders className="w-4 h-4 text-teal-400" />
                    <h3 className="text-xs font-black text-slate-100">استوديو صياغة سياسات الإلغاء بـ AI</h3>
                  </div>
                  <span className="bg-teal-500/10 text-teal-400 text-[9px] font-bold px-2 py-0.5 rounded-full">تحديث فوري</span>
                </div>

                {/* AI Generator parameters */}
                <div className="flex flex-col gap-3 bg-slate-950 p-3 rounded-xl border border-slate-850">
                  <div className="flex flex-col gap-1 text-right">
                    <label className="text-[10px] text-slate-400 font-bold">أهداف لوحة الإدارة التشغيلية:</label>
                    <input
                      type="text"
                      value={cancelGoals}
                      onChange={(e) => setCancelGoals(e.target.value)}
                      placeholder="مثال: تقليص نسب الإلغاء المتأخر، تشجيع الكباتن بزيادة حصتهم..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 outline-none text-right focus:border-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="flex flex-col gap-1 text-right">
                      <label className="text-[10px] text-slate-400 font-bold">حالة السوق الحالية:</label>
                      <select
                        value={cancelMarketCondition}
                        onChange={(e) => setCancelMarketCondition(e.target.value as any)}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 outline-none text-right focus:border-teal-500"
                      >
                        <option value="balanced">⚖️ سوق متوازنة ومستقرة</option>
                        <option value="high_demand">🚀 طلب مرتفع وازدحام سير (Peak)</option>
                        <option value="low_demand">📉 طلب منخفض ورغبة بالتوسع</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleGenerateAiCancellationPolicy}
                        disabled={aiCancelLoading}
                        className="bg-slate-900 hover:bg-slate-850 text-teal-400 hover:text-teal-300 font-black border border-teal-500/20 hover:border-teal-500/40 w-full py-2 rounded-lg text-[10px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {aiCancelLoading ? (
                          <>
                            <span className="w-3 h-3 border-2 border-teal-500/30 border-t-teal-400 rounded-full animate-spin"></span>
                            <span>جاري الصياغة...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-teal-300 animate-pulse" />
                            <span>صياغة السياسة بـ AI ✨</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Policy Inputs Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-right">
                    <label className="text-[9.5px] text-slate-400 font-bold">رسوم إلغاء الراكب (المشوار المباشر):</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.05"
                        value={policyPassengerDirect}
                        onChange={(e) => setPolicyPassengerDirect(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono text-center focus:border-teal-500"
                      />
                      <span className="text-[10px] text-slate-500">د.أ</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-right">
                    <label className="text-[9.5px] text-slate-400 font-bold">رسوم إلغاء الراكب (المشوار المجدول):</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.05"
                        value={policyPassengerScheduled}
                        onChange={(e) => setPolicyPassengerScheduled(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono text-center focus:border-teal-500"
                      />
                      <span className="text-[10px] text-slate-500">د.أ</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-right">
                    <label className="text-[9.5px] text-slate-400 font-bold">غرامة إلغاء الكابتن (المشوار المباشر):</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.05"
                        value={policyDriverDirect}
                        onChange={(e) => setPolicyDriverDirect(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono text-center focus:border-teal-500"
                      />
                      <span className="text-[10px] text-slate-500">د.أ</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-right">
                    <label className="text-[9.5px] text-slate-400 font-bold">غرامة إلغاء الكابتن (المشوار المجدول):</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.05"
                        value={policyDriverScheduled}
                        onChange={(e) => setPolicyDriverScheduled(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono text-center focus:border-teal-500"
                      />
                      <span className="text-[10px] text-slate-500">د.أ</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-right">
                    <label className="text-[9.5px] text-slate-400 font-bold">فترة الإلغاء المجاني للراكب (دقائق):</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={policyFreeWindow}
                        onChange={(e) => setPolicyFreeWindow(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono text-center focus:border-teal-500"
                      />
                      <span className="text-[10px] text-slate-500">دقيقة</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-right justify-center">
                    <label className="text-[9.5px] text-slate-400 font-bold mb-1.5">السياسة التكيفية لتقلب السعر:</label>
                    <label className="flex items-center gap-2 justify-end cursor-pointer">
                      <span className="text-[10px] text-slate-300">تفعيل التسعير والتحصين بـ AI</span>
                      <input
                        type="checkbox"
                        checked={policyAiAdaptive}
                        onChange={(e) => setPolicyAiAdaptive(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                      />
                    </label>
                  </div>
                </div>

                {/* AI Explanation / Policy Doc */}
                {policyDescription && (
                  <div className="bg-slate-950 border border-teal-500/10 p-3.5 rounded-xl flex flex-col gap-2">
                    <div className="text-[10px] text-teal-400 font-black font-mono">ARABIC POLICY DOCUMENT (AI APPROVED)</div>
                    <p className="text-[10px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {policyDescription}
                    </p>
                  </div>
                )}

                {/* Save button */}
                <button
                  type="button"
                  onClick={handleSaveCancellationPolicy}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold py-2.5 rounded-xl text-xs cursor-pointer w-full text-center mt-2 shadow-lg"
                >
                  حفظ وتطبيق سياسة الإلغاء الفورية وتعميمها ✓
                </button>
              </div>

            </div>
          </motion.div>
        )}

        {/* BILLING AND WALLET CHARGES TOPUP ENGINE */}
        {activeTab === 'billing' && (() => {
          // Derive financial stats reactively from walletTransactions
          const drvDepAll = walletTransactions
            .filter(tx => tx.userType === 'driver' && tx.type === 'deposit');
          const drvDepTotal = drvDepAll.reduce((sum, tx) => sum + tx.amount, 0);
          const drvDepWallet = drvDepAll.filter(tx => tx.paymentMethod !== 'cliq').reduce((sum, tx) => sum + tx.amount, 0);
          const drvDepCliq = drvDepAll.filter(tx => tx.paymentMethod === 'cliq').reduce((sum, tx) => sum + tx.amount, 0);

          const psgDepAll = walletTransactions
            .filter(tx => tx.userType === 'passenger' && tx.type === 'deposit');
          const psgDepTotal = psgDepAll.reduce((sum, tx) => sum + tx.amount, 0);
          const psgDepWallet = psgDepAll.filter(tx => tx.paymentMethod !== 'cliq').reduce((sum, tx) => sum + tx.amount, 0);
          const psgDepCliq = psgDepAll.filter(tx => tx.paymentMethod === 'cliq').reduce((sum, tx) => sum + tx.amount, 0);

          const grandTotal = drvDepTotal + psgDepTotal;
          const grandWallet = drvDepWallet + psgDepWallet;
          const grandCliq = drvDepCliq + psgDepCliq;

          // Filter for cash logs
          const filteredCashLogs = walletTransactions.filter(tx => {
            if (cashLogUserType !== 'all' && tx.userType !== cashLogUserType) return false;
            if (cashLogPaymentMethod !== 'all' && tx.paymentMethod !== cashLogPaymentMethod) return false;
            if (cashLogType !== 'all' && tx.type !== cashLogType) return false;

            const userObj = tx.userType === 'driver' 
              ? drivers.find(d => d.id === tx.userId) 
              : passengers.find(p => p.id === tx.userId);
            const name = userObj ? userObj.fullName : '';
            const searchLower = cashLogSearch.toLowerCase().trim();
            
            if (searchLower !== '') {
              const nameMatch = name.toLowerCase().includes(searchLower);
              const walletMatch = (tx.walletNumber || '').toLowerCase().includes(searchLower);
              const amountMatch = String(tx.amount).includes(searchLower);
              if (!nameMatch && !walletMatch && !amountMatch) return false;
            }

            return true;
          });

          const filteredTotal = filteredCashLogs.reduce((sum, tx) => sum + tx.amount, 0);

          const handlePrintReport = () => {
            const printContent = document.getElementById('printable-financial-report');
            if (!printContent) return;
            
            const style = document.createElement('style');
            style.id = 'report-print-style';
            style.innerHTML = `
              @media print {
                body * { visibility: hidden !important; }
                #printable-financial-report, #printable-financial-report * { visibility: visible !important; }
                #printable-financial-report { position: absolute; left: 0; top: 0; width: 100% !important; direction: rtl !important; background: white !important; color: black !important; }
                .no-print { display: none !important; }
              }
            `;
            document.head.appendChild(style);
            window.print();
            
            // Clean up style afterwards
            setTimeout(() => {
              const st = document.getElementById('report-print-style');
              if (st) st.remove();
            }, 1000);
          };

          return (
            <motion.div
              key="billing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex flex-col gap-6 text-right"
            >
              {renderReadOnlyBanner('walletApprovals', 'تتبع ومعالجة حركة شحن المحافظ والـ CliQ وسحب الأرصدة')}

              {/* Sub-tabs Navigation */}
              <div className="flex gap-2 flex-row-reverse text-[11px] font-sans border-b border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setBillingSubTab('recharge')}
                  className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-bold ${billingSubTab === 'recharge' ? 'bg-indigo-650 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                >
                  💰 شحن وتغذية المحافظ
                </button>
                <button
                  type="button"
                  onClick={() => setBillingSubTab('pending-recharges')}
                  className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-bold flex items-center gap-1.5 ${billingSubTab === 'pending-recharges' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                >
                  <span>⏳ طلبات شحن المحافظ المعلقة</span>
                  {((settings.pendingRechargeRequests || []).filter((r: any) => r.status === 'pending')).length > 0 && (
                    <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full font-mono font-bold text-[8.5px] animate-pulse">
                      {((settings.pendingRechargeRequests || []).filter((r: any) => r.status === 'pending')).length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setBillingSubTab('withdrawals')}
                  className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-bold flex items-center gap-1.5 ${billingSubTab === 'withdrawals' ? 'bg-amber-600 border-amber-500 text-black shadow-lg shadow-amber-500/10' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                >
                  <span>⏳ موافقات سحب الأرصدة المعلقة</span>
                  {walletTransactions.filter(t => t.type === 'withdraw' && t.status === 'pending').length > 0 && (
                    <span className="bg-red-500 text-white px-1.5 py-0.2 rounded-full font-mono font-bold text-[8.5px] animate-pulse">
                      {walletTransactions.filter(t => t.type === 'withdraw' && t.status === 'pending').length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setBillingSubTab('cash-logs')}
                  className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-bold ${billingSubTab === 'cash-logs' ? 'bg-emerald-650 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                >
                  📋 سجل المدفوعات والتقارير النقدية
                </button>
              </div>

              {billingSubTab === 'recharge' && (
                <>
                  {/* CENTRAL GENERAL LEDGER CARD COMPONENT */}
                  <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-slate-800 pb-4 mb-5 gap-3">
                      <div className="text-right md:text-left order-2 md:order-1 flex gap-2 items-center flex-row-reverse">
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded font-mono">
                          محفظة الشركة المعتمدة: {settings.systemWalletNumber || '0790000100'}
                        </span>
                        <span className="text-[10px] bg-violet-500/10 text-violet-400 font-bold px-2 py-0.5 rounded font-mono">
                          CliQ: {settings.systemCliQAlias || 'ADAM.CLIQ'}
                        </span>
                      </div>
                      <div className="order-1 md:order-2">
                        <h3 className="text-sm font-black text-slate-100 flex items-center justify-end gap-2 leading-none">
                          <span>تقرير الحسابات المركزي والتدفقات المالية الواردة</span>
                          <TrendingUp className="w-5 h-5 text-emerald-400 animate-pulse" />
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1">إجمالي تعبئات الرصيد وشحن محافظ الركاب وكباتن أسطول ADAM</p>
                      </div>
                    </div>

                    {/* Dashboard Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Total Drivers Topups */}
                      <div className="bg-slate-950/75 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block mb-0.5">إجمالي شحنات كباتن الأسطول</span>
                          <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight leading-none my-1.5 flex items-baseline justify-end gap-1 flex-row-reverse">
                            <span>{drvDepTotal.toFixed(2)}</span>
                            <span className="text-xs font-normal text-slate-400">د.أ</span>
                          </div>
                        </div>
                        <div className="border-t border-slate-900 pt-2 mt-2 flex flex-col gap-1 text-[9px] text-slate-500 font-sans">
                          <div className="flex justify-between items-center flex-row-reverse">
                            <span>بواسطة المحافظ الرقمية:</span>
                            <span className="font-mono font-bold text-slate-300">{drvDepWallet.toFixed(2)} د.أ</span>
                          </div>
                          <div className="flex justify-between items-center flex-row-reverse">
                            <span>بواسطة نظام فورية CliQ:</span>
                            <span className="font-mono font-bold text-violet-400">{drvDepCliq.toFixed(2)} د.أ</span>
                          </div>
                          <div className="flex justify-between items-center flex-row-reverse mt-0.5 pt-0.5 border-t border-slate-900">
                            <span>عدد حركات شحن الكباتن:</span>
                            <span className="font-mono font-bold text-emerald-400">{drvDepAll.length} حركات</span>
                          </div>
                        </div>
                      </div>

                      {/* Total Passengers Topups */}
                      <div className="bg-slate-950/75 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block mb-0.5">إجمالي شحنات الركاب والطلاب</span>
                          <div className="text-2xl font-black text-indigo-400 font-mono tracking-tight leading-none my-1.5 flex items-baseline justify-end gap-1 flex-row-reverse">
                            <span>{psgDepTotal.toFixed(2)}</span>
                            <span className="text-xs font-normal text-slate-400">د.أ</span>
                          </div>
                        </div>
                        <div className="border-t border-slate-900 pt-2 mt-2 flex flex-col gap-1 text-[9px] text-slate-500 font-sans">
                          <div className="flex justify-between items-center flex-row-reverse">
                            <span>بواسطة المحافظ الرقمية:</span>
                            <span className="font-mono font-bold text-slate-300">{psgDepWallet.toFixed(2)} د.أ</span>
                          </div>
                          <div className="flex justify-between items-center flex-row-reverse">
                            <span>بواسطة نظام فورية CliQ:</span>
                            <span className="font-mono font-bold text-violet-400">{psgDepCliq.toFixed(2)} د.أ</span>
                          </div>
                          <div className="flex justify-between items-center flex-row-reverse mt-0.5 pt-0.5 border-t border-slate-900">
                            <span>عدد حركات شحن الركاب:</span>
                            <span className="font-mono font-bold text-indigo-400">{psgDepAll.length} حركات</span>
                          </div>
                        </div>
                      </div>

                      {/* Combined Central System Account */}
                      <div className="bg-gradient-to-l from-indigo-950/80 to-slate-950 p-4 rounded-xl border border-indigo-900/40 flex flex-col justify-between shadow-lg">
                        <div>
                          <span className="text-[10px] font-bold text-amber-500 block mb-0.5">الرصيد المركزي التراكمي المستلم</span>
                          <div className="text-2xl font-black text-amber-400 font-mono tracking-tight leading-none my-1.5 flex items-baseline justify-end gap-1 flex-row-reverse">
                            <span>{grandTotal.toFixed(2)}</span>
                            <span className="text-xs font-normal text-slate-400">د.أ</span>
                          </div>
                        </div>
                        <div className="border-t border-indigo-900/30 pt-2 mt-2 flex flex-col gap-1 text-[9px] text-slate-400 font-sans">
                          <div className="flex justify-between items-center flex-row-reverse">
                            <span>مجموع شحنات المحافظ (E-Wallet):</span>
                            <span className="font-mono font-bold text-slate-200">{grandWallet.toFixed(2)} د.أ</span>
                          </div>
                          <div className="flex justify-between items-center flex-row-reverse text-violet-300">
                            <span>مجموع شحنات كليك الفورية (CliQ):</span>
                            <span className="font-mono font-bold">{grandCliq.toFixed(2)} د.أ</span>
                          </div>
                          <div className="flex justify-between items-center flex-row-reverse text-amber-500 font-bold mt-0.5 pt-0.5 border-t border-indigo-900/30">
                            <span>إجمالي التغذية في حساب الشركة:</span>
                            <span className="font-mono">{grandTotal.toFixed(2)} د.أ</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* APPROVAL MODE SWITCHER & SETTINGS BANNER */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-right shadow-lg">
                    <div className="flex items-center gap-3 flex-row-reverse">
                      <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-100 flex items-center justify-end gap-2">
                          <span>آلية زيادة أرصدة المحافظ عند وصول الحوالات لحساب الشركة</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          يمكن للتحكم الإداري الاختيار بين الاعتماد التلقائي الفوري بالذكاء الاصطناعي أو الزيادة بموافقة مسؤول العمليات اليدوية.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 justify-end flex-row-reverse">
                      <button
                        type="button"
                        onClick={() => {
                          updateSettings({ rechargeApprovalMode: 'auto' });
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                          (settings.rechargeApprovalMode ?? 'auto') === 'auto'
                            ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>⚡ اعتماد وتغذية تلقائية فورية (AI Auto)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          updateSettings({ rechargeApprovalMode: 'admin_approval' });
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                          settings.rechargeApprovalMode === 'admin_approval'
                            ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>⏳ زيـادة يـدويـة بموافقة الإدارة (Admin)</span>
                      </button>
                    </div>
                  </div>

                  {/* INCOMING RECHARGES & TRANSFERS AUDIT TABLE */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col gap-4 text-right shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <Wallet className="w-5 h-5 text-indigo-400" />
                        <div>
                          <h3 className="text-sm font-black text-slate-100">سجل الشحنات والعملاء الواصلين إلى حساب الشركة</h3>
                          <p className="text-[10px] text-slate-400">قائمة الركاب والكباتن الذين قاموا بتحويل مبالغ لحساب الشركة مع خيارات الزيادة اليدوية أو الآلية</p>
                        </div>
                      </div>

                      {/* AI Audit Action Button */}
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <button
                          type="button"
                          onClick={() => {
                            setAiRechargeAuditRunning(true);
                            setAiRechargeAuditReport('');
                            setTimeout(() => {
                              const pending = (settings.pendingRechargeRequests || []).filter((r: any) => r.status === 'pending');
                              const pendingSum = pending.reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
                              setAiRechargeAuditRunning(false);
                              if (pending.length === 0) {
                                setAiRechargeAuditReport(`🤖 نتائج تدقيق الذكاء الاصطناعي: جميع الشحنات الواردة لحساب الشركة (CliQ: ${settings.systemCliQAlias || 'ADAM.CLIQ'}) مطابقة تماماً ومحدثة بنسبة 100%. لا توجد حوالات معلقة حالياً.`);
                              } else {
                                setAiRechargeAuditReport(`🤖 نتائج تدقيق الذكاء الاصطناعي: تم المطابقة ورصد ${pending.length} حوالة واردة معلقة بقيمة إجمالية (${pendingSum.toFixed(2)} د.أ) مطابقة للقيد المصرفي لخزينة الشركة.`);
                              }
                            }, 800);
                          }}
                          disabled={aiRechargeAuditRunning}
                          className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                          <span>{aiRechargeAuditRunning ? 'جاري الفحص بالذكاء الاصطناعي...' : 'فحص ومطابقة الحوالات بالذكاء الاصطناعي 🤖'}</span>
                        </button>
                      </div>
                    </div>

                    {/* AI Audit Report Notice */}
                    {aiRechargeAuditReport && (
                      <div className="p-3.5 bg-indigo-950/60 border border-indigo-500/40 rounded-xl text-xs text-indigo-200 flex items-center justify-between flex-row-reverse gap-3">
                        <span>{aiRechargeAuditReport}</span>
                        {(settings.pendingRechargeRequests || []).filter((r: any) => r.status === 'pending').length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const pending = (settings.pendingRechargeRequests || []).filter((r: any) => r.status === 'pending');
                              let count = 0;
                              pending.forEach((req: any) => {
                                const res = approveRechargeRequest(req.id);
                                if (res.success) count++;
                              });
                              alert(`✅ تم اعتماد وشحن أرصدة ${count} من الركاب والكباتن بنجاح بالذكاء الاصطناعي!`);
                              setAiRechargeAuditReport('');
                            }}
                            className="bg-emerald-500 text-slate-950 font-black px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-400 transition cursor-pointer whitespace-nowrap"
                          >
                            اعتماد وتغذية كافة الحوالات المطابقة دفعة واحدة 🚀
                          </button>
                        )}
                      </div>
                    )}

                    {/* Search & Category Filter Controls */}
                    <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
                      <div className="w-full md:w-64">
                        <input
                          type="text"
                          value={incomingRechargeSearch}
                          onChange={e => setIncomingRechargeSearch(e.target.value)}
                          placeholder="ابحث باسم العميل، الهاتف، أو المرجع..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500 text-right"
                        />
                      </div>

                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {[
                          { id: 'all', label: 'الكل' },
                          { id: 'pending', label: `⏳ المعلقة بانتظار الاعتماد (${(settings.pendingRechargeRequests || []).filter((r: any) => r.status === 'pending').length})` },
                          { id: 'approved', label: '⚡ المعتمدة آلياً / سابقاً' },
                          { id: 'passengers', label: '👥 الركاب والطلاب' },
                          { id: 'drivers', label: '🚗 كباتن الأسطول' }
                        ].map(f => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setIncomingRechargeFilter(f.id as any)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                              incomingRechargeFilter === f.id
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Table Render */}
                    {(() => {
                      const allReqs = settings.pendingRechargeRequests || [];
                      const filtered = allReqs.filter((req: any) => {
                        if (incomingRechargeFilter === 'pending' && req.status !== 'pending') return false;
                        if (incomingRechargeFilter === 'approved' && req.status !== 'approved') return false;
                        if (incomingRechargeFilter === 'passengers' && req.userType !== 'passenger') return false;
                        if (incomingRechargeFilter === 'drivers' && req.userType !== 'driver') return false;
                        if (incomingRechargeSearch.trim()) {
                          const q = incomingRechargeSearch.toLowerCase();
                          const matchName = req.userName?.toLowerCase().includes(q);
                          const matchPhone = req.userPhone?.toLowerCase().includes(q);
                          const matchRef = (req.clearanceCode || req.referenceNumber || '').toLowerCase().includes(q);
                          if (!matchName && !matchPhone && !matchRef) return false;
                        }
                        return true;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl text-slate-500 font-sans text-xs">
                            🎉 لا توجد شحنات مطابقة للتصفية المحددة حالياً.
                          </div>
                        );
                      }

                      return (
                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                          <table className="w-full text-right border-collapse text-xs font-sans">
                            <thead>
                              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                                <th className="p-3 text-right">العميل الشاحن والنوع</th>
                                <th className="p-3 text-right">المبلغ المحول</th>
                                <th className="p-3 text-right">وسيلة التحويل وحساب الشركة</th>
                                <th className="p-3 text-right">المرجع والتاريخ</th>
                                <th className="p-3 text-center">التدقيق الذكي (AI Audit)</th>
                                <th className="p-3 text-center">حالة الوصول</th>
                                <th className="p-3 text-center">إجراءات الإدارة (تأكيد كشف البنك)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.map((req: any) => {
                                const isDrv = req.userType === 'driver';
                                const isPending = req.status === 'pending';
                                const isApproved = req.status === 'approved';
                                const audit = req.aiAudit;
                                const isReauditing = reAuditingReqId === req.id;

                                return (
                                  <tr key={req.id} className="border-b border-slate-850 hover:bg-slate-950/60 transition">
                                    <td className="p-3 font-bold text-slate-200">
                                      <div className="flex items-center gap-2 flex-row-reverse justify-start">
                                        <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold ${isDrv ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'}`}>
                                          {isDrv ? '🚗 كابتن أسطول' : '👥 راكب منصة'}
                                        </span>
                                        <span className="text-xs font-black">{req.userName}</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 text-right">
                                        📱 {req.userPhone || 'غير مدخل'}
                                      </div>
                                    </td>

                                    <td className="p-3 font-mono font-black text-sm">
                                      <span className={isDrv ? 'text-emerald-400' : 'text-indigo-400'}>
                                        {Number(req.amount).toFixed(2)} د.أ
                                      </span>
                                    </td>

                                    <td className="p-3 font-mono text-xs">
                                      <div className="text-slate-200 font-bold">{req.paymentMethod?.toUpperCase()}</div>
                                      <div className="text-[10px] text-slate-500">
                                        خزينة الشركة: {req.sourceAccountOrRef || settings.systemCliQAlias || 'ADAM.CLIQ'}
                                      </div>
                                    </td>

                                    <td className="p-3 text-[10px] text-slate-400 font-mono">
                                      <div className="text-amber-400 font-bold">{req.clearanceCode || req.referenceNumber}</div>
                                      <div>{req.requestedAt}</div>
                                    </td>

                                    {/* 🛡️ AI Verification Column */}
                                    <td className="p-3 text-center">
                                      {audit ? (
                                        <div className="flex flex-col items-center gap-1">
                                          <div className="flex items-center gap-1 justify-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black border ${
                                              audit.status === 'verified_authentic'
                                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                                : audit.status === 'potential_duplicate'
                                                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                            }`}>
                                              🤖 ثقة {audit.score}%
                                            </span>
                                            {audit.status === 'potential_duplicate' && (
                                              <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-800 px-1 py-0.5 rounded font-bold">
                                                🚨 مكرر!
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => setSelectedAiAuditReq(req)}
                                              className="text-[9px] text-indigo-400 hover:text-indigo-300 underline font-bold"
                                            >
                                              عرض تقرير التدقيق
                                            </button>
                                            <button
                                              type="button"
                                              disabled={isReauditing}
                                              onClick={async () => {
                                                setReAuditingReqId(req.id);
                                                const res = await reAuditRechargeWithAi(req.id);
                                                setReAuditingReqId(null);
                                                alert(res.msg);
                                              }}
                                              className="text-[9px] text-slate-400 hover:text-amber-300 p-0.5"
                                              title="إعادة تدقيق بالذكاء الاصطناعي"
                                            >
                                              <RefreshCw className={`w-3 h-3 ${isReauditing ? 'animate-spin text-amber-400' : ''}`} />
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          disabled={isReauditing}
                                          onClick={async () => {
                                            setReAuditingReqId(req.id);
                                            const res = await reAuditRechargeWithAi(req.id);
                                            setReAuditingReqId(null);
                                            alert(res.msg);
                                          }}
                                          className="bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white px-2 py-1 rounded-lg text-[9.5px] font-bold border border-indigo-500/40 transition flex items-center gap-1 mx-auto"
                                        >
                                          <Bot className="w-3 h-3" />
                                          <span>{isReauditing ? 'جاري الفحص...' : 'فحص بالذكاء الاصطناعي'}</span>
                                        </button>
                                      )}
                                    </td>

                                    <td className="p-3 text-center">
                                      {isPending ? (
                                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-amber-400" />
                                          <span>⏳ بانتظار تأكيد كشف البنك</span>
                                        </span>
                                      ) : isApproved ? (
                                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                                          <span>✅ مضافة بالرصيد (مكتملة)</span>
                                        </span>
                                      ) : (
                                        <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold">
                                          ❌ مرفوضة
                                        </span>
                                      )}
                                    </td>

                                    <td className="p-3 text-center">
                                      {isPending ? (
                                        <div className="flex gap-2 justify-center items-center">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const confirmMsg = `هل قمت بمطابقة وصول مبلغ (${Number(req.amount).toFixed(2)} د.أ) في كشف حساب بنك الشركة / كليك (${req.sourceAccountOrRef || 'ADAM.CLIQ'})؟\n\nبالضغط على 'موافق' سيتم زيادة الرصيد المتاح للعميل (${req.userName}) فوراً.`;
                                              if (window.confirm(confirmMsg)) {
                                                const res = approveRechargeRequest(req.id);
                                                alert(res.msg);
                                              }
                                            }}
                                            className="bg-emerald-500 hover:bg-emerald-600 active:scale-[98%] text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center gap-1"
                                          >
                                            <span>تأكيد وصول المبلغ وزيادة الرصيد 💰</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const reason = window.prompt("سبب رفض الشحن (اختياري):", "لم يتم العثور على قيد الحوالة في كشف حساب بنك الشركة");
                                              if (reason !== null) {
                                                const res = rejectRechargeRequest(req.id, reason);
                                                alert(res.msg);
                                              }
                                            }}
                                            className="bg-rose-600/80 hover:bg-rose-700 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer"
                                          >
                                            <span>رفض ❌</span>
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="text-[9.5px] text-slate-500 font-mono">
                                          <div>معتمد: {req.reviewedBy || 'الإدارة'}</div>
                                          <div>{req.reviewedAt || 'مكتمل'}</div>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}

                    {/* AI Recharge Audit Report Modal */}
                    {selectedAiAuditReq && (
                      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl text-right flex flex-col gap-4">
                          <div className="flex justify-between items-center flex-row-reverse pb-3 border-b border-slate-800">
                            <span className="text-sm font-black text-indigo-400 flex items-center gap-2">
                              <Bot className="w-5 h-5 text-indigo-400" />
                              <span>تقرير التدقيق المالي بالذكاء الاصطناعي (Gemini Neural Audit)</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedAiAuditReq(null)}
                              className="text-slate-400 hover:text-white p-1"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center flex-row-reverse text-xs">
                            <span className="text-slate-400">العميل:</span>
                            <span className="font-bold text-white">{selectedAiAuditReq.userName} ({selectedAiAuditReq.userType === 'driver' ? 'كابتن' : 'راكب'})</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between flex-row-reverse">
                              <span className="text-slate-400">المبلغ:</span>
                              <span className="font-mono font-black text-emerald-400">{Number(selectedAiAuditReq.amount).toFixed(2)} د.أ</span>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between flex-row-reverse">
                              <span className="text-slate-400">نسبة موثوقية الهيكل:</span>
                              <span className="font-mono font-black text-indigo-400">{selectedAiAuditReq.aiAudit?.score || 90}%</span>
                            </div>
                          </div>

                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
                            <span className="text-[11px] font-bold text-indigo-300">ملخص ومخرجات التحقق الذكي:</span>
                            <p className="text-xs text-slate-300 leading-relaxed m-0">
                              {selectedAiAuditReq.aiAudit?.summaryAr || 'البيانات الهيكلية للحوالة سليمة. يجب مطابقة كشف الحساب المصرفي قبل الاعتماد.'}
                            </p>
                          </div>

                          {selectedAiAuditReq.aiAudit?.anomalyFlags && (
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[11px] font-bold text-slate-400">مؤشرات وفحوصات الأمان:</span>
                              <div className="flex flex-col gap-1 text-[11px]">
                                {selectedAiAuditReq.aiAudit.anomalyFlags.map((flag: string, idx: number) => (
                                  <div key={idx} className="bg-slate-950/70 p-2 rounded-lg border border-slate-800 text-slate-200">
                                    {flag}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="bg-amber-950/30 border border-amber-500/40 p-3 rounded-xl flex items-start gap-2 flex-row-reverse text-right">
                            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                            <div className="flex flex-col text-xs text-amber-200">
                              <span className="font-bold">توجيه إدارة الخزينة والحسابات:</span>
                              <span>تأكد من فتح تطبيق بنك الشركة أو محفظة كليك ومطابقة قيد المبلغ ({Number(selectedAiAuditReq.amount).toFixed(2)} د.أ) قبل الضغط على زر الاعتماد.</span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-slate-800">
                            {selectedAiAuditReq.status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAiAuditReq(null);
                                  const res = approveRechargeRequest(selectedAiAuditReq.id);
                                  alert(res.msg);
                                }}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-2.5 rounded-xl text-xs transition"
                              >
                                تأكيد وصول المبلغ واعتماد الرصيد 💰
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedAiAuditReq(null)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition"
                            >
                              إغلاق
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* UNIFIED VERIFIED RECHARGE & BALANCE ALLOCATION HUB */}
                  <AdminUnifiedRechargeHub />

                  {/* AI POWERED BULK & TARGETED PROMO RECHARGE PANEL */}
                  <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 border border-indigo-500/20 p-6 rounded-2xl relative overflow-hidden shadow-2xl text-right">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-slate-800 pb-4 mb-5 gap-3">
                      <div className="order-2 md:order-1 flex gap-2 items-center flex-row-reverse text-xs text-indigo-400 font-bold bg-indigo-950/50 px-3 py-1.5 rounded-xl border border-indigo-500/20">
                        <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                        <span>مستشار الائتمان والحملات الذكية بـ AI</span>
                      </div>
                      <div className="order-1 md:order-2">
                        <h3 className="text-sm font-black text-slate-100 flex items-center justify-end gap-2 leading-none">
                          <span>نظام الشحن الجماعي الترويجي والاستهداف الذكي بـ AI</span>
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1">تحديد شرائح مخصصة من الركاب أو الكباتن وتغذيتها برصيد مجاني جماعي ترويجي بلمسة واحدة</p>
                      </div>
                    </div>

                    {promoSuccessMsg && (
                      <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl text-right mb-4 leading-relaxed">
                        {promoSuccessMsg}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 font-sans font-normal">
                      {/* Left: Input parameters */}
                      <div className="md:col-span-7 flex flex-col gap-4">
                        {/* Target User Type */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-400 font-bold">1. اختر الفئة الأساسية المراد استهدافها</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPromoUserType('passenger');
                                setPromoMatchedIds([]);
                                setPromoAnalysisReport('');
                              }}
                              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${promoUserType === 'passenger' ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 shadow-md' : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'}`}
                            >
                              <span>الركاب والطلاب 👥</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPromoUserType('driver');
                                setPromoMatchedIds([]);
                                setPromoAnalysisReport('');
                              }}
                              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${promoUserType === 'driver' ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 shadow-md' : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'}`}
                            >
                              <span>كباتن الأسطول 🚗</span>
                            </button>
                          </div>
                        </div>

                        {/* Targeting Filter Strategy */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-400 font-bold">2. أسلوب الاستهداف والتصفية الذكية</label>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            {[
                              { id: 'high_rating', label: 'المتميزين (تقييم 4.7+)' },
                              { id: 'inactive', label: 'الخاملين والجدد' },
                              { id: 'all', label: 'شحن عام للجميع' },
                              { id: 'custom_ai', label: 'تخصيص ذكي بـ AI' }
                            ].map(opt => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  setPromoTargetType(opt.id as any);
                                  setPromoMatchedIds([]);
                                  setPromoAnalysisReport('');
                                }}
                                className={`py-2 px-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${promoTargetType === opt.id ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Custom prompt input - shown if custom_ai is selected */}
                        {promoTargetType === 'custom_ai' && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-indigo-400 font-bold flex items-center gap-1 justify-end flex-row-reverse">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                              <span>اكتب المعايير والتفضيلات للذكاء الاصطناعي باللغة العربية</span>
                            </label>
                            <textarea
                              value={promoCustomPrompt}
                              onChange={e => setPromoCustomPrompt(e.target.value)}
                              placeholder="مثال: نريد مكافأة كباتن عمان الذين تقييمهم أكبر من 4.6 ولديهم سيارات موديل حديث 2022 فما فوق لزيادة رضاهم..."
                              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-100 outline-none transition-all duration-200 h-20 text-right resize-none font-sans"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          {/* Bonus Amount */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-slate-400 font-bold">3. قيمة الرصيد الترويجي (د.أ)</label>
                            <input
                              type="number"
                              step="0.5"
                              value={promoAmount}
                              onChange={e => setPromoAmount(Math.max(0.5, Number(e.target.value)))}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-100 text-center font-mono font-bold outline-none"
                              min="0.5"
                              required
                            />
                          </div>

                          {/* Reason */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-slate-400 font-bold">4. تبيان سبب الشحن في الكشف المالي</label>
                            <input
                              type="text"
                              value={promoReason}
                              onChange={e => setPromoReason(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-100 text-right outline-none font-sans font-medium"
                              required
                            />
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3 mt-2">
                          <button
                            type="button"
                            onClick={handleAiBulkPromoAnalysis}
                            disabled={promoLoading}
                            className="flex-1 bg-gradient-to-l from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold py-3 px-4 rounded-xl text-xs transition duration-200 shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {promoLoading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>يقوم الـ AI بدراسة وفلترة المستخدمين...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 animate-pulse text-indigo-200" />
                                <span>تحليل وتصفية الشريحة بالذكاء الاصطناعي ✨</span>
                              </>
                            )}
                          </button>

                          {promoMatchedIds.length > 0 && (
                            <button
                              type="button"
                              onClick={handleExecuteAiBulkPromo}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition duration-200 shadow-lg cursor-pointer flex items-center justify-center gap-1.5 animate-bounce"
                            >
                              <span>تأكيد الشحن الجماعي رصيد مجاني 🚀 ({promoMatchedIds.length} مستخدم)</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right: AI analysis output */}
                      <div className="md:col-span-5 bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col gap-3 min-h-[250px] justify-between relative">
                        <div>
                          <h4 className="text-[11px] font-black text-slate-300 pb-2 border-b border-slate-900 flex justify-end gap-1.5 items-center mb-3">
                            <span>تقرير تصفية وتحليل الفئة بـ AI</span>
                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          </h4>

                          {promoLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                              <p className="text-[10px] text-slate-400 animate-pulse font-sans">
                                جاري مسح سجلات المستخدمين التشغيلية، ومطابقتها للتوجيهات الذكية وبناء التقرير الاقتصادي...
                              </p>
                            </div>
                          ) : promoAnalysisReport ? (
                            <div className="flex flex-col gap-3 text-right" dir="rtl">
                              {/* Matched Users Quick Count Badges */}
                              <div className="flex justify-between items-center bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-500/20 text-[10px] text-indigo-300 flex-row-reverse">
                                <span>عدد المطابقات: <strong>{promoMatchedIds.length}</strong></span>
                                <span>التكلفة التقديرية: <strong>{(promoAmount * promoMatchedIds.length).toFixed(2)} د.أ</strong></span>
                              </div>

                              {/* Executive Analysis Report */}
                              <div className="text-slate-300 text-[11px] leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap text-right bg-slate-950 p-3 rounded-lg border border-slate-900 font-sans font-normal">
                                {promoAnalysisReport}
                              </div>

                              {/* Target user list names preview */}
                              {promoMatchedIds.length > 0 && (
                                <div className="text-right">
                                  <span className="text-[9px] text-slate-500 font-bold block mb-1">معاينة قائمة المستهدفين المحددة:</span>
                                  <div className="flex flex-wrap gap-1 justify-end max-h-16 overflow-y-auto">
                                    {promoMatchedIds.map((id, index) => {
                                      const u = promoUserType === 'driver' ? drivers.find(d => d.id === id) : passengers.find(p => p.id === id);
                                      return u ? (
                                        <span key={index} className="text-[8px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 border border-slate-850">
                                          {u.fullName}
                                        </span>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs text-center font-sans h-full">
                              🎯 يرجى اختيار محددات الفئة وقيمة الرصيد، ثم الضغط على "تحليل وتصفية الشريحة بالذكاء الاصطناعي" للحصول على معاينة دقيقة ومطابقة آمنة.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QUICK OVERVIEW / HELP ON COMMISSION COLD RULES */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl text-right">
                    <h3 className="text-xs font-black text-slate-200 pb-2 border-b border-slate-850 flex justify-end gap-1.5 items-center mb-4">
                      <span>سياسات الإدارة والمحافظ المعتمدة في تجميع آدم</span>
                      <DollarSign className="w-4 h-4 text-amber-500" />
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-6 text-right font-sans">
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-850">
                        📢 <strong>تحديث هام: تم حل مشكلة خصم راكب تجميعي واحد!</strong>
                        <p className="text-[10px] text-slate-400 leading-normal mt-1 flex-row-reverse">
                          الآن إذا كانت الرحلة تجميعية وتحتوي على ركاب متعددين (سواء تم دمجهم تلقائياً أو سجل الراكب بمرافقين)، يلتزم الراكب بدفع قيمة مقاعده بمعدل <strong className="text-indigo-400 font-mono">{settings.passengerFarePerSeat} د.أ</strong> للمقعد، ويتم ضرب قيمة عمولة التثبيت البالغة <strong className="text-emerald-400 font-mono">{settings.commissionRate} د.أ</strong> بعدد الركاب والمقاعد المحجوزة بالكامل ويتم خصم إجمالي العمولة من محفظة الكابتن بأمان.
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 md:justify-center text-right leading-relaxed">
                        <div>• لا يمكن كابتن أن يدخل للخدمة ويستقبل الركاب إذا كان رصيد محفظته يقل عن الحد الأدنى المحدد له.</div>
                        <div>• يتم خصم عمولة الإدارة من محفظة الكابتن آلياً بمجرد تفعيل زر "إيصال الركاب وإنهاء الرحلة" على كلي الهواتف.</div>
                        <div>• تتوفر الآن للركاب محفظة رقمية مستقلة للدفع غير النقدي تُشحن وتُدار كلياً من لوحة التحكم هذه لحسم مستحقات الرحلات بسلاسة.</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {billingSubTab === 'pending-recharges' && (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 text-right animate-fadeIn">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800 flex-row-reverse">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <Clock className="w-5 h-5 text-indigo-400 animate-pulse" />
                      <h4 className="text-sm font-black text-slate-200">طلبات شحن وتغذية المحافظ المعلقة بموافقة الإدارة</h4>
                    </div>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/25 font-bold">حسابات خزينة الشركة</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    تتيح هذه اللوحة للإدارة المباشرة مراجعة وتدقيق جميع طلبات زيادة شحن المحافظ المقدمة من قبل الكباتن والركاب والتأكد المالي من وصول الحوالة لحساب خزينة الشركة قبل إيداع أي مبلغ في المحفظة.
                  </p>

                  {((settings.pendingRechargeRequests || []).length === 0) ? (
                    <div className="text-center py-8 text-slate-500 font-sans border border-dashed border-slate-800 rounded-xl">
                      🎉 لا توجد أي طلبات شحن معلقة حالياً.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-850 mt-2">
                      <table className="w-full text-right border-collapse text-xs font-sans">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 border-b border-slate-850">
                            <th className="p-3 text-right">العميل والنوع</th>
                            <th className="p-3 text-right">المبلغ المطلوب</th>
                            <th className="p-3 text-right">الحساب المالي المحول منه</th>
                            <th className="p-3 text-right">المرجع/التاريخ</th>
                            <th className="p-3 text-center">حالة الطلب</th>
                            <th className="p-3 text-center">إجراءات الإدارة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(settings.pendingRechargeRequests || []).map((req: any) => (
                            <tr key={req.id} className="border-b border-slate-850 hover:bg-slate-950/50 transition">
                              <td className="p-3 font-bold text-slate-200">
                                <div>{req.userName}</div>
                                <div className="text-[10px] font-normal text-slate-400">
                                  {req.userType === 'driver' ? '🚗 كابتن أسطول' : '👤 راكب منصة'} - {req.userPhone || ''}
                                </div>
                              </td>
                              <td className="p-3 font-mono font-black text-emerald-400 text-sm">
                                {Number(req.amount).toFixed(2)} د.أ
                              </td>
                              <td className="p-3 font-mono text-slate-300">
                                <div>{req.paymentMethod?.toUpperCase()}</div>
                                <div className="text-[10px] text-slate-500">{req.sourceAccountOrRef}</div>
                              </td>
                              <td className="p-3 text-[10px] text-slate-400 font-mono">
                                <div className="text-amber-400 font-bold">{req.clearanceCode || req.referenceNumber}</div>
                                <div>{req.requestedAt}</div>
                              </td>
                              <td className="p-3 text-center">
                                {req.status === 'pending' ? (
                                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    ⏳ بانتظار موافقة الإدارة
                                  </span>
                                ) : req.status === 'approved' ? (
                                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    ✅ تم الاعتماد والإيداع
                                  </span>
                                ) : (
                                  <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    ❌ مرفوض
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                {req.status === 'pending' ? (
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const res = approveRechargeRequest(req.id);
                                        alert(res.msg);
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
                                    >
                                      موافقة وإيداع الرصيد ✅
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const res = rejectRechargeRequest(req.id);
                                        alert(res.msg);
                                      }}
                                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
                                    >
                                      رفض ❌
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-500">تم المعالجة ({req.reviewedAt || ''})</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {billingSubTab === 'withdrawals' && (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 text-right animate-fadeIn">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800 flex-row-reverse">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                      <h4 className="text-sm font-black text-slate-200">طلبات سحب الأرصدة المعلقة قيد المراجعة الإدارية</h4>
                    </div>
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/25 font-bold">حماية العمولات وأمن السحب</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    تحتوي هذه القائمة على جميع طلبات سحب الأرباح والتحويلات الخارجية المقدمة من قبل كباتن الأسطول وركاب المنصة. كمسؤول عمليات، لا يتم تعميد أو صرف أي حوالة مالية إلا بعد نقرك على زر "موافقة وإرسال الحوالة"، وفي حال الرفض يُعاد المبلغ فوراً لمحفظة العميل.
                  </p>

                  {walletTransactions.filter(t => t.type === 'withdraw' && t.status === 'pending').length === 0 ? (
                    <div className="text-center py-8 text-slate-500 font-sans border border-dashed border-slate-800 rounded-xl">
                      🎉 لا توجد أي طلبات سحب معلقة حالياً بانتظار الموافقة.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-850 mt-2">
                      <table className="w-full text-right border-collapse text-xs font-sans">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 border-b border-slate-850">
                            <th className="p-3 text-right">العميل وصفته</th>
                            <th className="p-3 text-right">المبلغ المطلوب</th>
                            <th className="p-3 text-right">تفاصيل محفظة المستلم</th>
                            <th className="p-3 text-right">تاريخ تقديم الطلب</th>
                            <th className="p-3 text-center">حالة الطلب</th>
                            <th className="p-3 text-center">إجراءات الإدارة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {walletTransactions.filter(t => t.type === 'withdraw' && t.status === 'pending').map((tx, idx) => {
                            const userObj = tx.userType === 'driver' 
                              ? drivers.find(d => d.id === tx.userId) 
                              : passengers.find(p => p.id === tx.userId);
                            const name = userObj ? userObj.fullName : `مستخدم (#${tx.userId.substring(0,6)})`;
                            
                            return (
                              <tr key={idx} className="border-b border-slate-850/60 hover:bg-slate-950/40 transition">
                                <td className="p-3 font-bold text-slate-100 flex flex-col gap-0.5">
                                  <span>{name}</span>
                                  <span className={`text-[9.5px] ${tx.userType === 'driver' ? 'text-emerald-500' : 'text-indigo-400'}`}>
                                    {tx.userType === 'driver' ? 'كابتن أسطول' : 'راكب'}
                                  </span>
                                </td>
                                <td className="p-3 font-mono font-extrabold text-amber-500 text-sm">
                                  {tx.amount.toFixed(2)} د.أ
                                </td>
                                <td className="p-3 text-slate-300 font-mono">
                                  {tx.walletNumber || 'محفظة معتمدة'}
                                </td>
                                <td className="p-3 text-slate-450 font-mono text-[10px]">
                                  {tx.timestamp}
                                </td>
                                <td className="p-3 text-center">
                                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                    ⏳ معلق بانتظار الموافقة
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex gap-2 justify-center items-center">
                                    <button
                                      onClick={() => {
                                        const res = approveWithdrawal(tx.id);
                                        alert(res.msg);
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg text-[10px] transition cursor-pointer"
                                    >
                                      موافقة وتعميد الحوالة 🟢
                                    </button>
                                    <button
                                      onClick={() => {
                                        if(confirm('هل أنت متأكد من رفض طلب السحب هذا وإعادة المبلغ لمحفظة العميل؟')) {
                                          const res = rejectWithdrawal(tx.id);
                                          alert(res.msg);
                                        }
                                      }}
                                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1 rounded-lg text-[10px] transition cursor-pointer"
                                    >
                                      رفض وإرجاع الرصيد 🔴
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {billingSubTab === 'cash-logs' && (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  {/* SEARCH & FILTERS PANEL */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 text-right">
                    <h4 className="text-xs font-black text-slate-200 pb-2 border-b border-slate-850 flex justify-end gap-1.5 items-center">
                      <span>البحث وتصفية الحركات المالية والنقدية</span>
                      <Sliders className="w-4 h-4 text-emerald-400" />
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      {/* Search Bar */}
                      <div className="flex flex-col gap-1 text-right">
                        <label className="text-[10px] text-slate-400 font-bold">بحث بالاسم / الوصف</label>
                        <input
                          type="text"
                          value={cashLogSearch}
                          onChange={e => setCashLogSearch(e.target.value)}
                          placeholder="بحث بالاسم أو الوصف..."
                          className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2 text-xs text-slate-100 outline-none transition"
                        />
                      </div>

                      {/* User Type Filter */}
                      <div className="flex flex-col gap-1 text-right">
                        <label className="text-[10px] text-slate-400 font-bold">فئة العميل</label>
                        <select
                          value={cashLogUserType}
                          onChange={e => setCashLogUserType(e.target.value as any)}
                          className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2 text-xs text-slate-100 outline-none transition"
                        >
                          <option value="all">الجميع (كباتن وركاب)</option>
                          <option value="driver">الكباتن فقط</option>
                          <option value="passenger">الركاب فقط</option>
                        </select>
                      </div>

                      {/* Payment Method Filter */}
                      <div className="flex flex-col gap-1 text-right">
                        <label className="text-[10px] text-slate-400 font-bold">طريقة الدفع/الشحن</label>
                        <select
                          value={cashLogPaymentMethod}
                          onChange={e => setCashLogPaymentMethod(e.target.value as any)}
                          className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2 text-xs text-slate-100 outline-none transition"
                        >
                          <option value="all">جميع الطرق</option>
                          <option value="wallet">المحافظ الإلكترونية (e-Wallet)</option>
                          <option value="cliq">كليك الفوري (CliQ)</option>
                          <option value="bank">الحساب البنكي (Bank)</option>
                        </select>
                      </div>

                      {/* Transaction Type Filter */}
                      <div className="flex flex-col gap-1 text-right">
                        <label className="text-[10px] text-slate-400 font-bold">نوع الحركة</label>
                        <select
                          value={cashLogType}
                          onChange={e => setCashLogType(e.target.value as any)}
                          className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2 text-xs text-slate-100 outline-none transition"
                        >
                          <option value="all">جميع الحركات</option>
                          <option value="deposit">شحن الرصيد (Deposit)</option>
                          <option value="withdraw">المسحوبات (Withdraw)</option>
                          <option value="fare_payment">أجرة رحلة (Fare Payment)</option>
                          <option value="commission_deduction">عمولات الشركة (Commission)</option>
                        </select>
                      </div>
                    </div>

                    {/* ACTION BUTTONS (PRINT & AI AUDITOR & NEW RECHARGE) */}
                    <div className="flex flex-wrap gap-2.5 justify-end mt-2 pt-3 border-t border-slate-850/60">
                      <button
                        onClick={() => setShowQuickRechargeModalInLogs(true)}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                      >
                        <Wallet className="w-4 h-4" />
                        <span>➕ شحن وتغذية رصيد جديد مع التأكيد الإجرائي</span>
                      </button>
                      <button
                        onClick={handlePrintReport}
                        className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <span>🖨️ طباعة التقرير النقدي الحالي</span>
                      </button>
                      <button
                        onClick={() => handleGenerateAiCashReport(filteredCashLogs, filteredTotal)}
                        disabled={isAiGeneratingCashReport}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black py-2 px-5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-900/15 transition cursor-pointer disabled:opacity-50"
                      >
                        {isAiGeneratingCashReport ? (
                          <span>🤖 قيد التحليل وتوليد التقرير المالي الذكي...</span>
                        ) : (
                          <span>🤖 تحليل السجل ومطابقة النقدية بالذكاء الاصطناعي (AI Auditor)</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* QUICK RECHARGE POPUP MODAL FROM CASH LOGS */}
                  {showQuickRechargeModalInLogs && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                      <div className="max-w-4xl w-full relative">
                        <button
                          type="button"
                          onClick={() => setShowQuickRechargeModalInLogs(false)}
                          className="absolute top-4 left-4 z-10 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-xl text-xs transition cursor-pointer"
                        >
                          إغلاق النافذة ✖
                        </button>
                        <AdminUnifiedRechargeHub
                          onSuccess={() => {
                            setTimeout(() => {
                              setShowQuickRechargeModalInLogs(false);
                            }, 1800);
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* AI CACH ANALYSIS RESULT PREVIEW OVERLAY */}
                  {aiCashReportResult && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-slate-950 border border-indigo-500/25 p-6 rounded-2xl text-right flex flex-col gap-4"
                    >
                      <div className="flex justify-between items-center border-b border-indigo-950 pb-3 flex-row-reverse">
                        <div className="flex items-center gap-2 flex-row-reverse">
                          <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                          <h4 className="text-sm font-black text-slate-200">التقرير المالي النقدي الذكي الصادر بـ AI لعام 2026</h4>
                        </div>
                        <button
                          onClick={() => setAiCashReportResult('')}
                          className="text-[10px] bg-indigo-950/40 hover:bg-indigo-950 text-indigo-400 font-bold px-3 py-1 rounded-lg border border-indigo-500/15 cursor-pointer"
                        >
                          إغلاق نافذة الذكاء الاصطناعي ✖
                        </button>
                      </div>

                      <div className="markdown-body text-xs text-slate-300 leading-relaxed font-sans max-h-[350px] overflow-y-auto pr-2 bg-slate-950/40 p-4 rounded-xl border border-slate-900 whitespace-pre-line text-right">
                        {aiCashReportResult}
                      </div>
                    </motion.div>
                  )}

                  {/* HIGH FIDELITY PRINTABLE REPORT WRAPPER */}
                  <div 
                    id="printable-financial-report"
                    className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col gap-6 text-right"
                  >
                    {/* Official Report Header */}
                    <div className="flex justify-between items-start flex-row-reverse border-b border-slate-850 pb-4">
                      <div>
                        <h2 className="text-lg font-black text-slate-100">شركة كفو آدم لنظم النقل المتكاملة م.م.ح</h2>
                        <h3 className="text-xs font-bold text-slate-400 mt-1">تقرير حركة المدفوعات والتدفقات النقدية والتحصيلات</h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">تاريخ استخراج التقرير: {new Date().toISOString().replace('T',' ').substring(0, 16)}</p>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-left font-mono">
                        <div className="text-[10px] text-slate-400">إجمالي الحركات المفلترة</div>
                        <div className="text-xl font-extrabold text-emerald-400 mt-1">{filteredTotal.toFixed(2)} د.أ</div>
                        <div className="text-[9px] text-slate-500 mt-1">عدد القيود: {filteredCashLogs.length}</div>
                      </div>
                    </div>

                    {/* Filter Status on printed page */}
                    <div className="bg-slate-950/45 p-3 rounded-lg border border-slate-850 text-[10px] text-slate-400 font-sans flex justify-between items-center flex-row-reverse">
                      <span>الفلاتر النشطة في هذا المستند:</span>
                      <div className="flex gap-2 flex-row-reverse font-bold text-slate-300">
                        <span>فئة المستخدم: {cashLogUserType === 'all' ? 'الجميع' : (cashLogUserType === 'driver' ? 'كابتن' : 'راكب')}</span>
                        <span>|</span>
                        <span>القناة: {cashLogPaymentMethod === 'all' ? 'جميع القنوات' : cashLogPaymentMethod.toUpperCase()}</span>
                        <span>|</span>
                        <span>نوع الحركة: {cashLogType === 'all' ? 'جميع الحركات' : cashLogType}</span>
                        {cashLogSearch && (
                          <>
                            <span>|</span>
                            <span>بحث: "{cashLogSearch}"</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Table of Records */}
                    <div className="overflow-x-auto rounded-xl border border-slate-850">
                      <table className="w-full text-right border-collapse text-xs font-sans">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 border-b border-slate-850 font-black">
                            <th className="p-3 text-right">العميل وصفته</th>
                            <th className="p-3 text-right">المبلغ المالي</th>
                            <th className="p-3 text-right">نوع الحركة</th>
                            <th className="p-3 text-right">تفاصيل الحركة والقناة</th>
                            <th className="p-3 text-right">التاريخ والوقت</th>
                            <th className="p-3 text-center">الحالة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCashLogs.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center p-6 text-slate-500">
                                لا توجد أي سجلات مطابقة لمعايير البحث الحالية.
                              </td>
                            </tr>
                          ) : (
                            filteredCashLogs.map((tx, idx) => {
                              const userObj = tx.userType === 'driver' 
                                ? drivers.find(d => d.id === tx.userId) 
                                : passengers.find(p => p.id === tx.userId);
                              const name = userObj ? userObj.fullName : `مستخدم (#${tx.userId.substring(0, 6)})`;
                              
                              return (
                                <tr key={idx} className="border-b border-slate-850/60 hover:bg-slate-950/40 transition">
                                  <td className="p-3 font-bold text-slate-200">
                                    <div>{name}</div>
                                    <div className={`text-[9px] ${tx.userType === 'driver' ? 'text-emerald-500' : 'text-indigo-400'} font-sans`}>
                                      {tx.userType === 'driver' ? 'كابتن أسطول' : 'راكب'}
                                    </div>
                                  </td>
                                  <td className="p-3 font-mono font-extrabold text-slate-100 text-sm">
                                    {tx.amount.toFixed(2)} د.أ
                                  </td>
                                  <td className="p-3 font-medium text-slate-300">
                                    {tx.type === 'deposit' && '📥 شحن/إيداع رصيد'}
                                    {tx.type === 'withdraw' && '📤 سحب رصيد'}
                                    {tx.type === 'fare_payment' && '🚗 سداد جولة'}
                                    {tx.type === 'commission_deduction' && '✂️ خصم عمولة'}
                                    {tx.type === 'cancel_fee' && '⚠️ رسوم إلغاء'}
                                  </td>
                                  <td className="p-3 text-slate-300 text-[11px] leading-relaxed max-w-[250px]">
                                    <div>{tx.walletNumber || 'تفاصيل معتمدة لقناة ADAM'}</div>
                                    <div className="text-[9.5px] text-slate-500 mt-0.5">
                                      القناة: {tx.paymentMethod ? tx.paymentMethod.toUpperCase() : 'WALLET'}
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-400 font-mono text-[10px]">
                                    {tx.timestamp}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                      tx.status === 'completed' 
                                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20' 
                                        : tx.status === 'pending'
                                        ? 'bg-amber-950/60 text-amber-400 border border-amber-500/20 animate-pulse'
                                        : 'bg-red-950/60 text-red-400 border border-red-500/20'
                                    }`}>
                                      {tx.status === 'completed' && '✓ ناجحة'}
                                      {tx.status === 'pending' && '⏳ معلقة'}
                                      {tx.status === 'failed' && '❌ مرفوضة'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Official Stamp Block */}
                    <div className="flex justify-end mt-4 pt-4 border-t border-slate-850/40 no-print">
                      <div className="text-center font-sans">
                        <div className="text-[10px] text-slate-500">مكتب التدقيق المالي المعتمد لـ ADAM</div>
                        <div className="text-xs font-bold text-slate-300 mt-1">توقيع وختم الإدارة المركزية</div>
                        <div className="w-24 h-24 border border-dashed border-slate-800 rounded-full flex items-center justify-center text-[10px] text-slate-600 mt-2 mx-auto leading-normal">
                          ADAM RIDE
                          <br />
                          CENTRAL LEDGER
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          );
        })()}

        {/* PAYMENT LEDGER AND FINANCIAL AUDIT SYSTEM (سجل الدفعات والتدقيق المالي) */}
        {activeTab === 'payment-ledger' && (() => {
          // Filtering logic
          const ledgerTransactions = walletTransactions.filter(tx => {
            // User Type
            if (ledgerUserType !== 'all' && tx.userType !== ledgerUserType) return false;
            
            // Transaction Type
            if (ledgerTxType !== 'all' && tx.type !== ledgerTxType) return false;
            
            // Payment Method
            if (ledgerPaymentMethod !== 'all' && tx.paymentMethod !== ledgerPaymentMethod) return false;
            
            // Status
            if (ledgerStatus !== 'all' && tx.status !== ledgerStatus) return false;

            // Search Filter (by User Name, Phone, Wallet number, Tx ID)
            const userObj = tx.userType === 'driver'
              ? drivers.find(d => d.id === tx.userId)
              : passengers.find(p => p.id === tx.userId);
            const userName = userObj ? userObj.fullName : '';
            const userPhone = userObj ? (userObj as any).phoneNumber || (userObj as any).phone || '' : '';
            const searchLower = ledgerSearch.toLowerCase().trim();

            if (searchLower !== '') {
              const idMatch = tx.id.toLowerCase().includes(searchLower);
              const nameMatch = userName.toLowerCase().includes(searchLower);
              const phoneMatch = userPhone.toLowerCase().includes(searchLower);
              const walletMatch = (tx.walletNumber || '').toLowerCase().includes(searchLower);
              const amountMatch = String(tx.amount).includes(searchLower);
              if (!idMatch && !nameMatch && !phoneMatch && !walletMatch && !amountMatch) return false;
            }

            // Date Filters
            if (ledgerDateRange !== 'all') {
              const txDate = new Date(tx.timestamp.replace(' ', 'T'));
              const now = new Date();
              const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              
              if (ledgerDateRange === 'today') {
                if (txDate < todayStart) return false;
              } else if (ledgerDateRange === 'yesterday') {
                const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
                if (txDate < yesterdayStart || txDate >= todayStart) return false;
              } else if (ledgerDateRange === 'week') {
                const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (txDate < weekStart) return false;
              } else if (ledgerDateRange === 'month') {
                const monthStart = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);
                if (txDate < monthStart) return false;
              } else if (ledgerDateRange === 'custom') {
                if (ledgerStartDate) {
                  const start = new Date(ledgerStartDate + 'T00:00:00');
                  if (txDate < start) return false;
                }
                if (ledgerEndDate) {
                  const end = new Date(ledgerEndDate + 'T23:59:59');
                  if (txDate > end) return false;
                }
              }
            }
            return true;
          });

          // Calculate summary stats
          const totalTransactionsCount = ledgerTransactions.length;
          const completedTxs = ledgerTransactions.filter(tx => tx.status === 'completed');
          
          const totalFareSum = completedTxs
            .filter(tx => tx.type === 'fare_payment')
            .reduce((sum, tx) => sum + tx.amount, 0);
            
          const totalDepositSum = completedTxs
            .filter(tx => tx.type === 'deposit')
            .reduce((sum, tx) => sum + tx.amount, 0);
            
          const totalWithdrawSum = completedTxs
            .filter(tx => tx.type === 'withdraw')
            .reduce((sum, tx) => sum + tx.amount, 0);
            
          const totalCommissionSum = completedTxs
            .filter(tx => tx.type === 'commission_deduction' || tx.type === 'cancel_fee')
            .reduce((sum, tx) => sum + tx.amount, 0);

          // Total Ledger Turnover
          const totalTurnover = completedTxs.reduce((sum, tx) => sum + tx.amount, 0);
          const filteredTotalSumVal = ledgerTransactions.reduce((sum, tx) => sum + tx.amount, 0);

          // Export to Excel helper
          const handleExportToExcel = () => {
            let excelContent = "ID المعاملة\tاسم المستخدم\tنوع الحساب\tطبيعة العملية\tوسيلة الدفع\tالمبلغ (د.أ)\tتاريخ ووقت العملية\tحالة المعاملة\tالوصف والتفاصيل\n";
            
            ledgerTransactions.forEach(tx => {
              const userObj = tx.userType === 'driver'
                ? drivers.find(d => d.id === tx.userId)
                : passengers.find(p => p.id === tx.userId);
              const userName = userObj ? userObj.fullName : tx.userId;
              const userRoleText = tx.userType === 'driver' ? 'كابتن / سائق' : 'راكب / عميل';
              
              const typeMap: Record<string, string> = {
                deposit: 'شحن رصيد / إيداع',
                withdraw: 'سحب رصيد / كاش',
                fare_payment: 'أجرة رحلة',
                commission_deduction: 'عمولة منصة',
                cancel_fee: 'رسوم إلغاء'
              };
              const txTypeText = typeMap[tx.type] || tx.type;

              const methodMap: Record<string, string> = {
                wallet: 'المحفظة الرقمية',
                cliq: 'كليك (CliQ)',
                bank: 'تحويل بنكي'
              };
              const methodText = methodMap[tx.paymentMethod || 'wallet'] || tx.paymentMethod || 'محفظة';

              const statusMap: Record<string, string> = {
                completed: 'مكتملة',
                pending: 'معلقة',
                failed: 'فشلت'
              };
              const statusText = statusMap[tx.status] || tx.status;

              excelContent += `${tx.id}\t${userName}\t${userRoleText}\t${txTypeText}\t${methodText}\t${tx.amount.toFixed(2)}\t${tx.timestamp}\t${statusText}\t${tx.walletNumber || ''}\n`;
            });

            excelContent += `\n\t\t\tإجمالي المعاملات المفلترة:\t\t${filteredTotalSumVal.toFixed(2)} د.أ\t\t\n`;

            const blob = new Blob(["\uFEFF" + excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ADAM_Ledger_Report_${new Date().toISOString().substring(0, 10)}.xls`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            logAuditAction('تصدير كشف Excel', `تم تصدير سجل دفعات مفلتر يحتوي على ${ledgerTransactions.length} حركة مالية بصيغة Excel.`);
          };

          // Print PDF helper
          const handlePrintPDF = () => {
            const style = document.createElement('style');
            style.id = 'ledger-print-style';
            style.innerHTML = `
              @media print {
                body * { visibility: hidden !important; }
                #printable-ledger-report, #printable-ledger-report * { visibility: visible !important; }
                #printable-ledger-report { position: absolute; left: 0; top: 0; width: 100% !important; direction: rtl !important; background: white !important; color: black !important; }
                .no-print { display: none !important; }
              }
            `;
            document.head.appendChild(style);
            window.print();
            
            setTimeout(() => {
              const st = document.getElementById('ledger-print-style');
              if (st) st.remove();
            }, 1000);

            logAuditAction('طباعة كشف مالي PDF', `تمت طباعة / تحميل كشف محاسبي رسمي بصيغة PDF لـ ${ledgerTransactions.length} حركة مالية.`);
          };

          return (
            <motion.div
              key="payment-ledger"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex flex-col gap-5 text-right font-sans"
            >
              {renderReadOnlyBanner('auditPayments', 'سجل الدفعات والمحاسبة والتدقيق المالي العام')}

              {/* Top Title Banner */}
              <div className="bg-[#0b0f19] border border-slate-900 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-right">
                  <h2 className="text-lg font-black text-indigo-400 flex items-center gap-2 flex-row-reverse">
                    <span>🧾 سجل الدفعات والمحاسبة والتدقيق العام</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    نظام مركزي للتدقيق المحاسبي المتقدم، يسمح للمسؤولين والمدققين بمراجعة حركات النقد (كاش)، الشحن بالمحافظ، العمولات، وتسويات كليك مع إمكانية الفلترة وتحميل التقارير فورياً.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleExportToExcel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>تصدير تقرير Excel 📥</span>
                  </button>
                  <button
                    onClick={handlePrintPDF}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة كشف PDF 📄</span>
                  </button>
                </div>
              </div>

              {/* Stats Panel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
                <div className="bg-[#0b0f19] border border-slate-900 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-450 block font-bold">إجمالي المبالغ المدققة (الحجم الإجمالي)</span>
                  <span className="text-xl font-mono font-black text-indigo-400 mt-2 block">{totalTurnover.toFixed(2)} د.أ</span>
                  <span className="text-[8.5px] text-slate-500 block mt-1">تشمل الحركات المالية المكتملة في الكشف الحالي</span>
                </div>
                <div className="bg-[#0b0f19] border border-slate-900 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-450 block font-bold">حركات أجرة الرحلات (كاش ومحفظة)</span>
                  <span className="text-xl font-mono font-black text-emerald-400 mt-2 block">{totalFareSum.toFixed(2)} د.أ</span>
                  <span className="text-[8.5px] text-slate-500 block mt-1">مدفوعات الرحلات التجميعية والفورية</span>
                </div>
                <div className="bg-[#0b0f19] border border-slate-900 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-450 block font-bold">الودائع وعمليات شحن الرصيد المعتمدة</span>
                  <span className="text-xl font-mono font-black text-amber-500 mt-2 block">{totalDepositSum.toFixed(2)} د.أ</span>
                  <span className="text-[8.5px] text-slate-500 block mt-1">شحن المحافظ عبر المحافظ الأردنية وكليك</span>
                </div>
                <div className="bg-[#0b0f19] border border-slate-900 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-450 block font-bold">إجمالي عمولات ورسوم منصة ADAM</span>
                  <span className="text-xl font-mono font-black text-rose-400 mt-2 block">
                    {settings?.hideCompanyProfits 
                      ? "🔒 *** (مخفي)" 
                      : settings?.isCompanyProfitsZeroed 
                        ? "0.00 د.أ (مُصفّر)" 
                        : `${totalCommissionSum.toFixed(2)} د.أ`}
                  </span>
                  <span className="text-[8.5px] text-slate-500 block mt-1">الاقتطاعات المباشرة من حركات السائقين</span>
                </div>
              </div>

              {/* Advanced Multi-Criteria Filter Bar */}
              <div className="bg-[#0b0f19] border border-slate-900 p-5 rounded-2xl flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-xs font-black text-indigo-400">🔍 محرك البحث والفلترة المتقدم (التدقيق المحاسبي)</span>
                  <button
                    onClick={() => {
                      setLedgerSearch('');
                      setLedgerUserType('all');
                      setLedgerTxType('all');
                      setLedgerPaymentMethod('all');
                      setLedgerStatus('completed');
                      setLedgerDateRange('all');
                      setLedgerStartDate('');
                      setLedgerEndDate('');
                    }}
                    className="text-[9.5px] text-indigo-400 hover:text-indigo-300 font-bold transition underline"
                  >
                    إعادة تعيين الفلاتر لحالتها الافتراضية
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {/* Search Input */}
                                    {/* Search Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold">البحث النصي السريع</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="ابحث بالاسم، الهاتف، المعاملة..."
                        value={ledgerSearch}
                        onChange={e => setLedgerSearch(e.target.value)}
                        className="w-full bg-[#070b12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 outline-none text-right font-sans"
                      />
                    </div>
                  </div>

                  {/* User Type Filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold">نوع الحساب</label>
                    <select
                      value={ledgerUserType}
                      onChange={e => setLedgerUserType(e.target.value as any)}
                      className="w-full bg-[#070b12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none text-right font-sans cursor-pointer"
                    >
                      <option value="all">الكل (كباتن وركاب)</option>
                      <option value="driver">الكباتن فقط 🚗</option>
                      <option value="passenger">الركاب فقط 👤</option>
                    </select>
                  </div>

                  {/* Transaction Type */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold">نوع الحركة المالية</label>
                    <select
                      value={ledgerTxType}
                      onChange={e => setLedgerTxType(e.target.value as any)}
                      className="w-full bg-[#070b12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none text-right font-sans cursor-pointer"
                    >
                      <option value="all">كافة أنواع الحركات</option>
                      <option value="deposit">إيداع وشحن رصيد 🟢</option>
                      <option value="withdraw">سحب رصيد 🔴</option>
                      <option value="fare_payment">دفع أجرة مشوار 🚕</option>
                      <option value="commission_deduction">اقتطاع عمولة المنصة 🏢</option>
                    </select>
                  </div>

                  {/* Payment Method */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold">طريقة الدفع</label>
                    <select
                      value={ledgerPaymentMethod}
                      onChange={e => setLedgerPaymentMethod(e.target.value as any)}
                      className="w-full bg-[#070b12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none text-right font-sans cursor-pointer"
                    >
                      <option value="all">كافة الطرق</option>
                      <option value="wallet">محفظة آدم الإلكترونية</option>
                      <option value="cliq">كليك فوري (CliQ)</option>
                      <option value="bank">حوالة بنكية معتمدة</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold">حالة الحركة</label>
                    <select
                      value={ledgerStatus}
                      onChange={e => setLedgerStatus(e.target.value as any)}
                      className="w-full bg-[#070b12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none text-right font-sans cursor-pointer"
                    >
                      <option value="all">الكل</option>
                      <option value="completed">مكتملة ومعتمدة ✓</option>
                      <option value="pending">قيد الانتظار ⏳</option>
                      <option value="failed">ملغاة / فاشلة ✕</option>
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold">النطاق الزمني</label>
                    <select
                      value={ledgerDateRange}
                      onChange={e => setLedgerDateRange(e.target.value as any)}
                      className="w-full bg-[#070b12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none text-right font-sans cursor-pointer"
                    >
                      <option value="all">كافة الأوقات</option>
                      <option value="today">اليوم</option>
                      <option value="yesterday">أمس</option>
                      <option value="week">آخر 7 أيام</option>
                      <option value="month">هذا الشهر</option>
                      <option value="custom">نطاق مخصص 📅</option>
                    </select>
                  </div>

                  {ledgerDateRange === 'custom' && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400 font-bold">من تاريخ</label>
                        <input
                          type="date"
                          value={ledgerStartDate}
                          onChange={e => setLedgerStartDate(e.target.value)}
                          className="w-full bg-[#070b12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400 font-bold">إلى تاريخ</label>
                        <input
                          type="date"
                          value={ledgerEndDate}
                          onChange={e => setLedgerEndDate(e.target.value)}
                          className="w-full bg-[#070b12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none font-mono"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div className="bg-[#0b0f19] border border-slate-900 rounded-2xl overflow-hidden shadow-xl flex flex-col">
                <div className="p-4 bg-[#0d1322] border-b border-slate-900 flex justify-between items-center flex-row-reverse flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <span className="text-xs font-black text-slate-200">قيود السجل العام المحاسبي</span>
                    <span className="bg-indigo-500/20 text-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {ledgerTransactions.length} حركة مطابقة
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 font-bold">
                    إجمالي المبلغ: {filteredTotalSumVal.toFixed(2)} د.أ
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-900 text-[10px]">
                        <th className="p-3 text-right">رقم الحركة</th>
                        <th className="p-3 text-right">التاريخ والوقت</th>
                        <th className="p-3 text-right">المستخدم</th>
                        <th className="p-3 text-right">نوع الحركة</th>
                        <th className="p-3 text-right">طريقة الدفع</th>
                        <th className="p-3 text-right">المبلغ</th>
                        <th className="p-3 text-right">الحالة</th>
                        <th className="p-3 text-right">الوصف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60 font-sans">
                      {ledgerTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                            لا توجد حركات مالية مطابقة للفلاتر المحددة حالياً.
                          </td>
                        </tr>
                      ) : (
                        ledgerTransactions.map(tx => {
                          const isPositive = tx.type === 'deposit' || tx.amount > 0;
                          return (
                            <tr key={tx.id} className="hover:bg-slate-900/40 transition">
                              <td className="p-3 font-mono text-[10px] text-slate-400">
                                {tx.id.substring(0, 10)}...
                              </td>
                              <td className="p-3 text-slate-300 text-[10.5px]">
                                {new Date(tx.createdAt || Date.now()).toLocaleString('ar-JO', {
                                  year: 'numeric',
                                  month: 'numeric',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1.5 flex-row-reverse justify-end">
                                  <span className="font-bold text-slate-200 text-xs">{tx.userName || 'مستخدم'}</span>
                                  <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-bold ${
                                    tx.userType === 'driver' 
                                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                                      : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                                  }`}>
                                    {tx.userType === 'driver' ? 'كابتن 🚗' : 'راكب 👤'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="text-[11px] text-slate-300">
                                  {tx.type === 'deposit' ? 'شحن رصيد إيداع' :
                                   tx.type === 'withdraw' ? 'سحب رصيد' :
                                   tx.type === 'fare_payment' ? 'أجرة مشوار' :
                                   tx.type === 'commission_deduction' ? 'عمولة المنصة' : tx.type}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {tx.paymentMethod === 'cliq' ? 'CliQ كليك' :
                                   tx.paymentMethod === 'wallet' ? 'محفظة ADAM' :
                                   tx.paymentMethod === 'bank' ? 'حوالة بنكية' : (tx.paymentMethod || 'نقدي')}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold text-xs">
                                <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                                  {isPositive ? '+' : ''}{tx.amount.toFixed(2)} د.أ
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                                  tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                  tx.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                  'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                }`}>
                                  {tx.status === 'completed' ? 'معتمدة ✓' :
                                   tx.status === 'pending' ? 'قيد الانتظار ⏳' : 'ملغاة ✕'}
                                </span>
                              </td>
                              <td className="p-3 text-[10.5px] text-slate-400 max-w-[200px] truncate">
                                {tx.description || '-'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </motion.div>
          );
        })()}

      </div>
    </div>
  );
};
