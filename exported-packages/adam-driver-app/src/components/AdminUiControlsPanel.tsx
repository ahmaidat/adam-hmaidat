import React, { useState } from 'react';
import { useAppState } from '../stateEngine';
import { 
  Sliders, 
  Eye, 
  EyeOff, 
  Smartphone, 
  Compass, 
  Zap, 
  Radio, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  RefreshCw, 
  Save, 
  Sparkles, 
  Navigation, 
  ShieldCheck, 
  History, 
  CalendarClock, 
  Wallet, 
  MessageSquare, 
  Megaphone, 
  Mic, 
  Link, 
  Copy, 
  ExternalLink,
  MapPin,
  TowerControl
} from 'lucide-react';
import { DynamicUiControls, UberAiDispatchConfig } from '../types';

export const AdminUiControlsPanel: React.FC = () => {
  const { settings, updateSettings } = useAppState();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Current UI controls state from settings with robust defaults
  const uiControls: DynamicUiControls = settings?.uiControls || {
    hideHomeButton: true,
    hideBottomNavBar: false,
    hidePassengerHistory: false,
    hidePassengerOtp: false,
    hidePassengerScheduled: false,
    hidePassengerWallet: false,
    hidePassengerChat: false,
    hidePassengerAds: false,
    hidePassengerVoiceAi: false,
    hideDriverHistory: false,
    hideDriverOtp: false,
    hideDriverScheduled: false,
    hideDriverWallet: false,
    hideDriverChat: false,
    hideDriverAds: false,
    hideDriverVoiceAi: false
  };

  // Uber AI Dispatch config with robust defaults
  const uberAiDispatch: UberAiDispatchConfig = settings?.uberAiDispatch || {
    enabled: true,
    cellularTriangulationEnabled: true,
    autoMatchingRadiusKm: 5,
    requestTimeoutSeconds: 30,
    aiSurgePricingMultiplier: 1.0,
    autoReassignNextDriver: true
  };

  const handleToggleUiControl = (key: keyof DynamicUiControls) => {
    const updated = {
      ...uiControls,
      [key]: !uiControls[key]
    };
    updateSettings({ uiControls: updated });
    triggerSaveFeedback('تم تحديث إعدادات واجهة المستخدم وحفظها سحابياً في Firebase');
  };

  const handleUpdateUberDispatch = (patch: Partial<UberAiDispatchConfig>) => {
    const updated = {
      ...uberAiDispatch,
      ...patch
    };
    updateSettings({ uberAiDispatch: updated });
    triggerSaveFeedback('تم تحديث محرك الذكاء الاصطناعي لطلب واستقبال الرحلات وحفظه في Firebase');
  };

  const triggerSaveFeedback = (msg: string) => {
    setIsSaving(true);
    setSaveSuccessMsg(msg);
    setTimeout(() => {
      setIsSaving(false);
    }, 800);
    setTimeout(() => {
      setSaveSuccessMsg('');
    }, 4000);
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://asz-62356896831.europe-west2.run.app';
  
  const systemLinks = [
    {
      id: 'passenger',
      title: 'تطبيق الراكب المستقل (Passenger App)',
      desc: 'واجهة الراكب المستقلة لطلب وتتبع الرحلات بدون أي عناصر إدارية',
      url: `${originUrl}/?app=passenger`,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400'
    },
    {
      id: 'captain',
      title: 'تطبيق الكابتن المستقل (Captain App)',
      desc: 'واجهة السائق والكابتن لاستقبال الطلبات وتأكيد رمز الأمان والتوثيق',
      url: `${originUrl}/?app=captain`,
      color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400'
    },
    {
      id: 'admin',
      title: 'لوحة التحكم المركزية (Admin CRM)',
      desc: 'بوابة الإدارة الشاملة، المشرفين، المحافظ، وتخصيص الواجهات والـ API',
      url: `${originUrl}/?app=admin`,
      color: 'from-indigo-500/20 to-blue-500/10 border-indigo-500/30 text-indigo-400'
    },
    {
      id: 'dashboard',
      title: 'داشبورد المؤشرات والعمليات (Operations Dashboard)',
      desc: 'شاشة الرقابة الحية، الأسطول، مؤشرات الطلب، وإحصائيات الرحلات',
      url: `${originUrl}/?app=dashboard`,
      color: 'from-purple-500/20 to-fuchsia-500/10 border-purple-500/30 text-purple-400'
    }
  ];

  const handleCopyLink = (url: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(id);
      setTimeout(() => setCopiedLink(null), 2500);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-right font-sans" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2 flex-row-reverse">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <span>التحكم المركزي بالواجهات ومحرك Uber AI للرحلات (Dynamic UI & Uber AI Dispatch)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              إدارة مرئية وتحكم ديناميكي كامل في ظهور أو إخفاء أيقونات وقوائم تطبيقات الكابتن والراكب، مع إدارة محرك التوزيع الذكي للرحلات وتحديد المواقع عبر أبراج الاتصالات، مع المزامنة السحابية المباشرة في Firebase.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-2 rounded-xl border border-indigo-500/30 self-stretch md:self-auto justify-between">
            <span className="text-[11px] text-slate-300 font-bold flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              المزامنة السحابية Firebase:
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">متصلة لحظياً ⚡</span>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="mt-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Grid of 3 Main Control Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SECTION 1: DYNAMIC UI ICONS & NAVIGATION CONTROLS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-2 flex-row-reverse">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>إدارة الأيقونات والقوائم الديناميكية (Dynamic UI Toggles)</span>
            </h3>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-lg font-bold">
              تطبيق فوري
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            يمكنك تفعيل أو إخفاء أي عنصر في واجهات التطبيقات. يتم حفظ التعديلات في Firebase لتنعكس فوراً لدى جميع المستخدمين دون الحاجة لتحديث الصفحة.
          </p>

          {/* Core Home Button Control */}
          <div className="bg-gradient-to-r from-amber-950/30 via-slate-950 to-slate-950 border border-amber-500/40 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Navigation className="w-3.5 h-3.5 text-amber-400" />
                <span>إخفاء أيقونة وزر الرئيسية (Home Button)</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {uiControls.hideHomeButton ? 'مخفية حالياً من تطبيق الراكب والكابتن لمنع الخروج' : 'ظاهرة ومفعلة في الواجهات'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleToggleUiControl('hideHomeButton')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition duration-150 flex items-center gap-1.5 cursor-pointer shadow-md ${
                uiControls.hideHomeButton 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {uiControls.hideHomeButton ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>مخفية 🚫</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>مفعلة الظهور 👁️</span>
                </>
              )}
            </button>
          </div>

          {/* Passenger App UI Elements */}
          <div className="flex flex-col gap-2 mt-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>عناصر وقوائم تطبيق الراكب (Passenger App):</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Passenger History */}
              <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-200">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span>سجل مشوارك</span>
                </div>
                <button
                  onClick={() => handleToggleUiControl('hidePassengerHistory')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                    uiControls.hidePassengerHistory ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {uiControls.hidePassengerHistory ? 'مخفي' : 'ظاهر'}
                </button>
              </div>

              {/* Passenger OTP */}
              <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>رمز الأمان (OTP)</span>
                </div>
                <button
                  onClick={() => handleToggleUiControl('hidePassengerOtp')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                    uiControls.hidePassengerOtp ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {uiControls.hidePassengerOtp ? 'مخفي' : 'ظاهر'}
                </button>
              </div>

              {/* Passenger Scheduled */}
              <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-200">
                  <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
                  <span>جدولة المواعيد</span>
                </div>
                <button
                  onClick={() => handleToggleUiControl('hidePassengerScheduled')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                    uiControls.hidePassengerScheduled ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {uiControls.hidePassengerScheduled ? 'مخفي' : 'ظاهر'}
                </button>
              </div>

              {/* Passenger Wallet */}
              <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-200">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>المحفظة الرقمية</span>
                </div>
                <button
                  onClick={() => handleToggleUiControl('hidePassengerWallet')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                    uiControls.hidePassengerWallet ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {uiControls.hidePassengerWallet ? 'مخفي' : 'ظاهر'}
                </button>
              </div>

              {/* Passenger Chat */}
              <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-200">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span>الدردشة الفورية</span>
                </div>
                <button
                  onClick={() => handleToggleUiControl('hidePassengerChat')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                    uiControls.hidePassengerChat ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {uiControls.hidePassengerChat ? 'مخفي' : 'ظاهر'}
                </button>
              </div>

              {/* Passenger Ads Banner */}
              <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-200">
                  <Megaphone className="w-3.5 h-3.5 text-purple-400" />
                  <span>إعلانات وعروض AI</span>
                </div>
                <button
                  onClick={() => handleToggleUiControl('hidePassengerAds')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                    uiControls.hidePassengerAds ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {uiControls.hidePassengerAds ? 'مخفي' : 'ظاهر'}
                </button>
              </div>
            </div>
          </div>

          {/* Captain App UI Elements */}
          <div className="flex flex-col gap-2 mt-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>عناصر وقوائم تطبيق الكابتن (Captain App):</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Driver History */}
              <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-200">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span>جدول وسجل الرحلات</span>
                </div>
                <button
                  onClick={() => handleToggleUiControl('hideDriverHistory')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                    uiControls.hideDriverHistory ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {uiControls.hideDriverHistory ? 'مخفي' : 'ظاهر'}
                </button>
              </div>

              {/* Driver OTP */}
              <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>تأكيد رمز الأمان (OTP)</span>
                </div>
                <button
                  onClick={() => handleToggleUiControl('hideDriverOtp')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                    uiControls.hideDriverOtp ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {uiControls.hideDriverOtp ? 'مخفي' : 'ظاهر'}
                </button>
              </div>

              {/* Driver Scheduled */}
              <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-200">
                  <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
                  <span>مواعيد الحجوزات</span>
                </div>
                <button
                  onClick={() => handleToggleUiControl('hideDriverScheduled')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                    uiControls.hideDriverScheduled ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {uiControls.hideDriverScheduled ? 'مخفي' : 'ظاهر'}
                </button>
              </div>

              {/* Driver Wallet */}
              <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-200">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>محفظة الكابتن والعمولات</span>
                </div>
                <button
                  onClick={() => handleToggleUiControl('hideDriverWallet')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                    uiControls.hideDriverWallet ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {uiControls.hideDriverWallet ? 'مخفي' : 'ظاهر'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: UBER-STYLE AI DISPATCH & MOBILE CELLULAR TRIANGULATION */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-2 flex-row-reverse">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>محرك Uber AI للرحلات وتحديد الموقع الخلوي (Uber-Style AI Engine)</span>
            </h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-lg font-bold">
              Gemini + Cellular API
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            تشغيل آلية طلب واستقبال الرحلات الشبيهة بـ Uber بالذكاء الاصطناعي مع استخدام مزودي خدمات الموبايل والشبكات الخلوية لتحديد الموقع اللحظي للراكب والكابتن بدقة، دون الحاجة لبناء أي شاشات إضافية.
          </p>

          <div className="space-y-3">
            {/* Toggle Uber AI Dispatch Engine */}
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>تفعيل محرك التوزيع الذكي للرحلات (Uber-Style Dispatch)</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  مطابقة تلقائية بالذكاء الاصطناعي بين أقرب كابتن نشط والراكب
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleUpdateUberDispatch({ enabled: !uberAiDispatch.enabled })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  uberAiDispatch.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {uberAiDispatch.enabled ? 'مفعل 🟢' : 'معطل ⚪'}
              </button>
            </div>

            {/* Mobile Cellular Provider & Triangulation Geolocation */}
            <div className="bg-slate-950 border border-indigo-500/30 p-3 rounded-xl flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <TowerControl className="w-3.5 h-3.5 text-indigo-400" />
                  <span>تحديد الموقع عبر مزود خدمات الموبايل (Cellular Assisted GPS)</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  استخدام شبكات زين وأورنج وأمنية لتعزيز دقة تحديد الموقع في الأماكن المغلقة
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleUpdateUberDispatch({ cellularTriangulationEnabled: !uberAiDispatch.cellularTriangulationEnabled })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  uberAiDispatch.cellularTriangulationEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {uberAiDispatch.cellularTriangulationEnabled ? 'نشط 📶' : 'معطل ⚪'}
              </button>
            </div>

            {/* Matching Radius & Dispatch Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>نطاق بحث أقرب كابتن:</span>
                  <span className="text-emerald-400 font-mono">{uberAiDispatch.autoMatchingRadiusKm || 5} كم</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="1"
                  value={uberAiDispatch.autoMatchingRadiusKm || 5}
                  onChange={(e) => handleUpdateUberDispatch({ autoMatchingRadiusKm: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>مهلة استجابة الكابتن (ثواني):</span>
                  <span className="text-amber-400 font-mono">{uberAiDispatch.requestTimeoutSeconds || 30} ث</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={uberAiDispatch.requestTimeoutSeconds || 30}
                  onChange={(e) => handleUpdateUberDispatch({ requestTimeoutSeconds: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Auto Reassign */}
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                  <span>التمرير التلقائي للكابتن التالي عند عدم الاستجابة</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  توجيه طلب الراكب فوراً لأقرب كابتن بديل لتقليل زمن الانتظار
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleUpdateUberDispatch({ autoReassignNextDriver: !uberAiDispatch.autoReassignNextDriver })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  uberAiDispatch.autoReassignNextDriver ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {uberAiDispatch.autoReassignNextDriver ? 'مفعل ⚡' : 'معطل ⚪'}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 3: DIRECT SYSTEM LINKS WITH INSTANT CLOUD SYNC & NO CACHE RELIANCE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
        <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-2 flex-row-reverse">
              <Link className="w-4 h-4 text-indigo-400" />
              <span>روابط النظام المباشرة والمستقلة (Direct Cloud System URLs)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              روابط مباشرة تفتح فوراً بدون الحاجة لـ (Ctrl+F5) وتنعكس عليها جميع التعديلات السحابية والـ API لحظياً.
            </p>
          </div>

          <div className="text-[11px] text-indigo-300 bg-indigo-950/60 border border-indigo-800/40 px-3 py-1.5 rounded-xl font-bold">
            ☁️ الربط السحابي + Firebase + REST API
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {systemLinks.map((item) => (
            <div 
              key={item.id}
              className={`bg-gradient-to-l ${item.color} border rounded-xl p-4 flex flex-col justify-between gap-3 shadow-md`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-100">{item.title}</h4>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-slate-300 hover:text-white transition"
                    title="فتح في نافذة جديدة"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-[10.5px] text-slate-300 mt-1 leading-relaxed">{item.desc}</p>
              </div>

              <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-slate-400 truncate dir-ltr select-all">
                  {item.url}
                </span>

                <button
                  type="button"
                  onClick={() => handleCopyLink(item.url, item.id)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[10px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedLink === item.id ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>نسخ الرابط</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
