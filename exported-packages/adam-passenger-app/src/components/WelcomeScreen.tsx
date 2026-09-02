import React, { useState } from 'react';
import { 
  Car, 
  Smartphone, 
  Shield, 
  Users, 
  Heart, 
  ArrowRight, 
  Activity, 
  MapPin, 
  Star, 
  UserCheck, 
  Link, 
  Copy, 
  Check, 
  ExternalLink, 
  Globe, 
  Download, 
  SmartphoneIcon,
  Laptop,
  CheckCircle2
} from 'lucide-react';
import { useAppState } from '../stateEngine';

interface WelcomeScreenProps {
  onEnterPassenger: () => void;
  onEnterDriver: () => void;
  onEnterDashboard: (targetView?: 'admin' | 'dashboard' | 'simulator') => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onEnterPassenger,
  onEnterDriver,
  onEnterDashboard
}) => {
  const { t, language, setLanguage, drivers, passengers, scheduledTrips, setTravelMode } = useAppState();
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [selectedServiceMode, setSelectedServiceMode] = useState<string>('all');

  const activeCaptains = drivers.filter(d => d.status === 'approved').length;
  const activeRiders = passengers.length;
  const totalRoutes = scheduledTrips.length;

  const handleLaunchService = (mode: string) => {
    if (mode === 'driver' || mode === 'captain') {
      setTravelMode('all');
      onEnterDriver();
    } else if (mode === 'admin') {
      onEnterDashboard('admin');
    } else if (mode === 'dashboard' || mode === 'simulator') {
      onEnterDashboard(mode as any);
    } else if (mode === 'intracity') {
      setTravelMode('intracity');
      onEnterPassenger();
    } else if (mode === 'intercity') {
      setTravelMode('intercity');
      onEnterPassenger();
    } else {
      setTravelMode('all');
      onEnterPassenger();
    }
  };

  const copyReservedLink = (param: string, title: string) => {
    const origin = window.location.origin;
    const fullUrl = `${origin}/${param}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(title);
    setTimeout(() => setCopiedLink(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#060814] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased relative overflow-hidden">
      {/* Background glow meshes */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12 flex-1 flex flex-col justify-center relative z-10 text-right" dir="rtl">
        
        {/* Upper Language & Brand Switcher Header */}
        <div className="flex justify-between items-center flex-row-reverse mb-6 border-b border-slate-900 pb-4">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-400/20 px-4 py-1.5 rounded-full text-xs text-indigo-400 font-extrabold flex-row-reverse select-none">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
            <span>{t('منظومة ASZ / آدم للنقل الذكي وتشارك الرحلات 🇯🇴', 'ASZ / Adam Smart Ride-Pooling Ecosystem 🇯🇴')}</span>
          </div>

          <div className="flex items-center gap-2 flex-row-reverse">
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{language === 'ar' ? 'English Language 🇬🇧' : 'اللغة العربية 🇯🇴'}</span>
            </button>
          </div>
        </div>
        
        {/* Title */}
        <div className="text-center md:text-right mb-6 md:mb-8">
          <h1 className="text-3xl md:text-5.5xl font-black tracking-tight text-white leading-tight font-sans">
            منظومة <span className="bg-gradient-to-l from-amber-400 via-emerald-400 to-indigo-500 bg-clip-text text-transparent">ASZ / آدم للنقل الذكي</span>
          </h1>
          <p className="text-xs md:text-base text-slate-400 max-w-2xl mt-3 leading-relaxed font-medium">
            {t(
              'منصة تشارك رحلات ذكية ومتكاملة مصممة بأعلى معايير الأمان وتضم 4 تطبيقات متزامنة: تطبيق الكابتن، تطبيق الراكب، لوحة التحكم، والداشبورد الموحد.',
              'Integrated smart ride-pooling platform built to highest security standards featuring 4 synchronized modules: Captain App, Passenger App, Admin Panel, and Master Dashboard.'
            )}
          </p>

          {/* Instant Cascading Service Dropdown & Direct Launch Bar */}
          <div className="mt-6 bg-gradient-to-r from-slate-900/95 via-[#0c1228]/95 to-slate-900/95 border border-indigo-500/40 p-3 md:p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <span className="text-xs md:text-sm font-black text-amber-300 whitespace-nowrap">✨ اختر الخدمة للدخول فوراً:</span>
              <span className="text-lg">🚀</span>
            </div>

            <div className="flex flex-1 w-full items-center gap-2">
              <select
                value={selectedServiceMode}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedServiceMode(val);
                  handleLaunchService(val);
                }}
                className="flex-1 bg-slate-950 border-2 border-indigo-500/60 hover:border-indigo-400 text-slate-100 text-xs md:text-sm font-extrabold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer text-right shadow-inner transition"
              >
                <option value="all">✨ تطبيق الراكب - جميع الخدمات (عرض شامل مفتوح)</option>
                <option value="intracity">🏢 تطبيق الراكب - داخل المدينة (تكسي فوري ومباشر)</option>
                <option value="intercity">🚗 تطبيق الراكب - بين المحافظات (تكسي تجميعي اقتصادي)</option>
                <option value="airport">✈️ تطبيق الراكب - مطار الملكة علياء VIP</option>
                <option value="driver">🚕 تطبيق الكابتن والسائق (استقبال الرحلات والعداد)</option>
                <option value="admin">🛡️ لوحة التحكم والإدارة (Admin CRM)</option>
                <option value="dashboard">📊 الداشبورد والتحكم الموحد (Master Dashboard)</option>
              </select>

              <button
                type="button"
                onClick={() => handleLaunchService(selectedServiceMode)}
                className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs md:text-sm px-4 py-2.5 rounded-xl transition cursor-pointer shadow-lg whitespace-nowrap flex items-center gap-1.5"
              >
                <span>دخول فوري ⚡</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-gradient-to-br from-[#0c1226]/90 via-[#090e1d]/90 to-[#04060d]/90 border border-indigo-500/20 p-4 rounded-2xl flex flex-col justify-between hover:border-indigo-400/55 transition-all duration-300">
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="text-[10px] text-indigo-400 font-extrabold tracking-wider">{t('الكباتن النشطين', 'ACTIVE CAPTAINS')}</span>
              <span className="text-lg">🚕</span>
            </div>
            <div className="mt-4 text-right">
              <span className="text-2xl md:text-3.5xl font-black bg-gradient-to-l from-white to-slate-300 bg-clip-text text-transparent font-mono">{activeCaptains}</span>
              <span className="text-[10px] text-emerald-400 block mt-1 font-bold">✓ {t('مرخصين بالكامل', 'Fully Licensed')}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0c1c20]/90 via-[#071318]/90 to-[#03070b]/90 border border-emerald-500/20 p-4 rounded-2xl flex flex-col justify-between hover:border-emerald-450/55 transition-all duration-300">
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="text-[10px] text-emerald-400 font-extrabold tracking-wider">{t('الركاب المسجلين', 'REGISTERED RIDERS')}</span>
              <span className="text-lg">👤</span>
            </div>
            <div className="mt-4 text-right">
              <span className="text-2xl md:text-3.5xl font-black bg-gradient-to-l from-white to-slate-300 bg-clip-text text-transparent font-mono">{activeRiders}</span>
              <span className="text-[10px] text-emerald-400 block mt-1 font-bold">✓ {t('هوية موثقة بقوة', 'ID Verified')}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1d1610]/90 via-[#130f0b]/90 to-[#060403]/90 border border-amber-500/20 p-4 rounded-2xl flex flex-col justify-between hover:border-amber-450/55 transition-all duration-300">
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="text-[10px] text-amber-400 font-extrabold tracking-wider">{t('الرحلات المجدولة', 'SCHEDULED TRIPS')}</span>
              <span className="text-lg">🗺️</span>
            </div>
            <div className="mt-4 text-right">
              <span className="text-2xl md:text-3.5xl font-black bg-gradient-to-l from-white to-slate-300 bg-clip-text text-transparent font-mono">{totalRoutes}</span>
              <span className="text-[10px] text-amber-400 block mt-1 font-bold">✓ {t('تغطية كافة المحافظات', 'All Governorates')}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1f1019]/90 via-[#140a10]/90 to-[#070305]/90 border border-rose-500/20 p-4 rounded-2xl flex flex-col justify-between hover:border-rose-450/55 transition-all duration-300">
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="text-[10px] text-rose-400 font-extrabold tracking-wider">{t('اللغات والتراخيص', 'LANGUAGES & STORES')}</span>
              <span className="text-lg">🌐</span>
            </div>
            <div className="mt-4 text-right">
              <span className="text-xl md:text-2xl font-black text-rose-300 font-sans">AR / EN</span>
              <span className="text-[10px] text-rose-400 block mt-1 font-bold">✓ {t('جاهز للمتاجر والموقع', 'Store & Web Ready')}</span>
            </div>
          </div>
        </div>

        {/* REQUISITION FOUR ARCHITECTURAL LAUNCH PADS */}
        <div className="bg-gradient-to-br from-[#0a0f24] to-[#050814] border border-indigo-500/30 rounded-3xl p-6 md:p-8 mb-12 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row-reverse justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-black mb-1 flex-row-reverse">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>{t('إطلاق المشروع الرسمي - 4 روابط تشغيل وتنزيل المتاجر 🚀', 'Official System Release - 4 Dedicated App Links & Store Direct Downloads 🚀')}</span>
              </div>
              <p className="text-xs text-slate-400">
                {t('يمكنك استخدام الروابط المحجوزة المباشرة أدناه أو تنزيل الحزم لكافة المتاجر (Google Play, Apple App Store, Web App):', 'You can launch via reserved direct URLs or download app packages across all stores (Google Play, Apple App Store, Web):')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-right">
            
            {/* 1. Captain / Driver App Card */}
            <div className="bg-[#0e142c]/90 border border-amber-500/30 rounded-2xl p-5 hover:border-amber-400/60 transition duration-300 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center flex-row-reverse mb-3">
                  <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span>🚕</span>
                    <span>1. {t('تطبيق آدم الكابتن (Captain Adam App)', 'Captain Adam App')}</span>
                  </span>
                  <span className="text-[9px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded font-mono border border-slate-800">
                    AR / EN
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-100 mb-1.5 font-sans">
                  تطبيق آدم الكابتن متاح على كافة المتاجر باللغتين (العربية والإنجليزية)
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                  تنسيق طلبات الركاب التشاركية، تشغيل العداد الإلكتروني التلقائي، الخرائط التفاعلية وتوثيق التراخيص الرسمية.
                </p>
              </div>

              <div className="space-y-2">
                {/* Store download badges */}
                <div className="flex gap-2 flex-wrap flex-row-reverse text-[10px] text-slate-300 font-bold mb-2">
                  <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <SmartphoneIcon className="w-3 h-3 text-emerald-400" /> Google Play
                  </span>
                  <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-indigo-400" /> Apple App Store
                  </span>
                  <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Globe className="w-3 h-3 text-amber-400" /> Web App
                  </span>
                </div>

                <div className="flex gap-2 flex-row-reverse">
                  <button
                    onClick={onEnterDriver}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{t('تشغيل تطبيق آدم الكابتن 🚕', 'Launch Captain Adam App 🚕')}</span>
                  </button>
                  <button
                    onClick={() => copyReservedLink('driver', 'آدم الكابتن')}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 p-2 rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1"
                    title="نسخ رابط الحجز المباشر"
                  >
                    {copiedLink === 'آدم الكابتن' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Passenger App Card */}
            <div className="bg-[#0e142c]/90 border border-rose-500/30 rounded-2xl p-5 hover:border-rose-400/60 transition duration-300 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center flex-row-reverse mb-3">
                  <span className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span>📱</span>
                    <span>2. {t('تطبيق آدم الراكب (Passenger Adam App)', 'Passenger Adam App')}</span>
                  </span>
                  <span className="text-[9px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded font-mono border border-slate-800">
                    AR / EN
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-100 mb-1.5 font-sans">
                  تطبيق آدم الراكب متاح على كافة المتاجر باللغتين (العربية والإنجليزية)
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                  طلب وحجز الرحلات المشتركة بحد أقصى 4 ركاب، شحن المحفظة الرقمية، والدعم الفني الذكي المباشر.
                </p>
              </div>

              <div className="space-y-2">
                {/* Store download badges */}
                <div className="flex gap-2 flex-wrap flex-row-reverse text-[10px] text-slate-300 font-bold mb-2">
                  <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <SmartphoneIcon className="w-3 h-3 text-emerald-400" /> Google Play
                  </span>
                  <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-indigo-400" /> Apple App Store
                  </span>
                  <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Globe className="w-3 h-3 text-rose-400" /> Web App
                  </span>
                </div>

                <div className="flex gap-2 flex-row-reverse">
                  <button
                    onClick={onEnterPassenger}
                    className="flex-1 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{t('تشغيل تطبيق آدم الراكب 📱', 'Launch Passenger Adam App 📱')}</span>
                  </button>
                  <button
                    onClick={() => copyReservedLink('passenger', 'آدم الراكب')}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-rose-400 p-2 rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1"
                    title="نسخ رابط الحجز المباشر"
                  >
                    {copiedLink === 'آدم الراكب' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Control Panel (لوحة التحكم) Reserved Link Card */}
            <div className="bg-[#0e142c]/90 border border-indigo-500/30 rounded-2xl p-5 hover:border-indigo-400/60 transition duration-300 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center flex-row-reverse mb-3">
                  <span className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span>👑</span>
                    <span>3. {t('لوحة آدم التحكم (Control Panel Adam- CRM)', 'Control Panel Adam- CRM')}</span>
                  </span>
                  <span className="text-[9px] text-indigo-400 bg-slate-900 px-2 py-0.5 rounded font-mono border border-slate-800">
                    رابط حجز مباشر
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-100 mb-1.5 font-sans">
                  لوحة آدم التحكم الخاصة بالمسؤولين من خلال حجز رابط مستقل
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                  إدارة تراخيص الكباتن، تدقيق المحافظ والمقبوضات، إدارة الموظفين، وضبط الأسعار والعمولات السيادية.
                </p>
              </div>

              <div className="flex gap-2 flex-row-reverse">
                <button
                  type="button"
                  onClick={() => onEnterDashboard('admin')}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t('دخول لوحة آدم التحكم المباشرة 👑', 'Access Control Panel Adam 👑')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => copyReservedLink('admin', 'لوحة آدم التحكم')}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-400 p-2 rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1"
                  title="نسخ رابط حجز لوحة التحكم"
                >
                  {copiedLink === 'لوحة آدم التحكم' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 4. Dashboard (الداشبورد) Reserved Link Card */}
            <div className="bg-[#0e142c]/90 border border-emerald-500/30 rounded-2xl p-5 hover:border-emerald-400/60 transition duration-300 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center flex-row-reverse mb-3">
                  <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span>📊</span>
                    <span>4. {t('الداشبورد الموحد (Master Dashboard)', 'Master Dashboard')}</span>
                  </span>
                  <span className="text-[9px] text-emerald-400 bg-slate-900 px-2 py-0.5 rounded font-mono border border-slate-800">
                    رابط حجز مباشر
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-100 mb-1.5 font-sans">
                  داشبورد الشاشات الموحد للتحليل الفوري من خلال حجز رابط مستقل
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                  مراقبة التتبع المباشر لمركبات التجميع وحركة الركاب، محاكاة خريطة GPS التفاعلية، وتحليلات التشغيل.
                </p>
              </div>

              <div className="flex gap-2 flex-row-reverse">
                <button
                  type="button"
                  onClick={() => onEnterDashboard('dashboard')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t('دخول الداشبورد الموحد 📊', 'Access Master Dashboard 📊')}</span>
                </button>
                <button
                  onClick={() => copyReservedLink('dashboard', 'الداشبورد')}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 p-2 rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1"
                  title="نسخ رابط حجز الداشبورد"
                >
                  {copiedLink === 'الداشبورد' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

          </div>

          {copiedLink && (
            <div className="mt-4 p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-center text-xs text-emerald-300 font-extrabold animate-fade-in flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>تم نسخ رابط حجز ({copiedLink}) المباشر بنجاح للأنظمة والمشاريع! 📋</span>
            </div>
          )}
        </div>

        {/* Highlight points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gradient-to-br from-[#0e1327] via-[#090d19] to-[#04060d] border border-slate-900 rounded-2xl p-6 text-right">
          <div className="flex gap-3 flex-row-reverse items-start">
            <span className="text-xl">🛡️</span>
            <div>
              <h4 className="text-xs font-black text-slate-200">{t('أمان وحماية قصوى', 'Absolute Safety & SOS')}</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">{t('ربط مباشر بخطوط الطوارئ 911 ونظام تتبع المسار التشاركي وإشعار العائلات الفوري في الأردن بضغطة زر.', 'Direct integration with 911 emergency lines, sharing tracking route maps, and alerting families with one tap.')}</p>
            </div>
          </div>

          <div className="flex gap-3 flex-row-reverse items-start">
            <span className="text-xl">💰</span>
            <div>
              <h4 className="text-xs font-black text-slate-200">{t('محفظة رقمية وتكامل دقيق', 'Cashless Wallets & Integrations')}</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">{t('شحن وسحب فوري عبر المحافظ الخلوية كـ (زين كاش، أمنية) وبوابة كليك (CliQ) ومطابقة الحسابات البنكية بالذكاء الاصطناعي.', 'Instant top-up & withdrawals with Jordan telecom wallets, CliQ gateway, and AI-mapped banking networks.')}</p>
            </div>
          </div>

          <div className="flex gap-3 flex-row-reverse items-start">
            <span className="text-xl">⚡</span>
            <div>
              <h4 className="text-xs font-black text-slate-200">{t('تنبيهات وتتبع فوري حي', 'Real-time Alerts & GPS Tracking')}</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">{t('تنبيهات حالة المشوار التفاعلية مثل (الكابتن في الطريق، وصل الكابتن، تم البدء) مع تتبع حي لمركبة الكابتن على الخريطة.', 'Interactive ride alerts such as "En Route", "Arrived", "In Transit" with smooth live captain car GPS mapping.')}</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-[11px] text-slate-500">
          منظومة ASZ / آدم للنقل الذكي وتشارك الرحلات © 2026
        </div>

      </div>
    </div>
  );
};

