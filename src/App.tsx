import React, { useState, useEffect } from 'react';
import { AppProvider, useAppState } from './stateEngine';
import { AdminPanel } from './components/AdminPanel';
import { LiveMap } from './components/LiveMap';
import { DriverApp } from './components/DriverApp';
import { PassengerApp } from './components/PassengerApp';
import { MasterScreenDashboard, ScreenConfig, addScreenLog } from './components/MasterScreenDashboard';
import { AppInstallationCenter } from './components/AppInstallationCenter';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { COUNTRIES_DATA } from './countriesData';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AdamVoiceAssistant } from './components/AdamVoiceAssistant';
import { AiAutoTranslator } from './components/AiAutoTranslator';
import { UnifiedAuthPortal } from './components/UnifiedAuthPortal';
import { 
  Car, 
  MapPin, 
  ShieldCheck, 
  Info, 
  UserCheck, 
  Coins, 
  Sliders, 
  Fingerprint, 
  Award,
  CircleDot,
  Play,
  Layers,
  Sparkles,
  Lock,
  Unlock,
  Terminal,
  LogOut,
  Download,
  CheckCircle,
  Smartphone
} from 'lucide-react';

const defaultScreens: ScreenConfig[] = [
  {
    id: 'admin',
    titleAr: "لوحة آدم التحكم (Control Panel Adam- CRM)",
    titleEn: "Control Panel Adam- CRM",
    descriptionAr: "إدارة تراخيص الكباتن والمحفظة، تتبع العمولات والرحلات القائمة وتجميع حافلات آدم بذكاء",
    descriptionEn: "Comprehensive administration console to manage drivers, wallets, system metrics, rates & helpdesk",
    isVisible: true,
    role: 'admin',
    gridSpan: 'medium',
    accentColor: 'indigo'
  },
  {
    id: 'map',
    titleAr: "خريطة التتبع الجغرافية الحيّة (Live GPS Tracker)",
    titleEn: "Live Interactive GPS Tracking Map (Live GPS Tracker)",
    descriptionAr: "تعقب متزامن على الخارطة لمواقع المركبات والعداد الذكي ونشاط التجميع الفوري في محافظات الأردن",
    descriptionEn: "Live real-time geographic viewport showing active pooling runs, driver locations and matching coordinates",
    isVisible: true,
    role: 'all',
    gridSpan: 'small',
    accentColor: 'emerald'
  },
  {
    id: 'passenger',
    titleAr: "تطبيق آدم الراكب (Passenger Adam App)",
    titleEn: "Passenger Adam App",
    descriptionAr: "بوابة هواتف الركاب لطلب مسارات التجميع بحد أقصى 4 ركاب مع شحن المحفظة ومحادثة الدعم الفني",
    descriptionEn: "Passenger mobile workspace to call shared runs, manage personal wallet and real-time support chat",
    isVisible: true,
    role: 'passenger',
    gridSpan: 'medium',
    accentColor: 'rose'
  },
  {
    id: 'driver',
    titleAr: "تطبيق آدم الكابتن (Captain Adam App)",
    titleEn: "Captain Adam App",
    descriptionAr: "بوابة هواتف الكباتن لتنسيق طلبات الركاب المشتركة وتشغيل العداد الإلكتروني والاطلاع على الخرائط",
    descriptionEn: "Driver mobile viewport to accept ride pooling, navigate routes, and start dynamic smart taximeters",
    isVisible: true,
    role: 'driver',
    gridSpan: 'medium',
    accentColor: 'amber'
  }
];

function DashboardContent() {
  const { 
    login, 
    language, 
    t, 
    activeCountryCode, 
    setActiveCountryCode, 
    activeCountry 
  } = useAppState();
  const resolveViewFromLocation = (): 'welcome' | 'passenger' | 'driver' | 'admin' | 'dashboard' | 'simulator' | 'auth' => {
    try {
      const pathname = (window.location.pathname || '').toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const appParam = params.get('app') || params.get('view');

      // 1. Check query parameters ?app= or ?view=
      if (appParam === 'passenger') return 'passenger';
      if (appParam === 'captain' || appParam === 'driver') return 'driver';
      if (appParam === 'control' || appParam === 'admin') return 'admin';
      if (appParam === 'dashboard' || appParam === 'master') return 'dashboard';
      if (appParam === 'all' || appParam === 'simulator') return 'simulator';

      // 2. Check path names
      if (pathname.includes('/auth') || pathname.includes('/login') || pathname.includes('/register')) return 'auth';
      if (pathname.includes('/passenger') || pathname.endsWith('passenger.html')) return 'passenger';
      if (pathname.includes('/driver') || pathname.includes('/captain') || pathname.endsWith('driver.html')) return 'driver';
      if (pathname.includes('/admin') || pathname.includes('/control') || pathname.endsWith('admin.html')) return 'admin';
      if (pathname.includes('/dashboard')) return 'dashboard';
      if (pathname.includes('/simulator')) return 'simulator';

      // 3. Hash routing fallback
      const hash = (window.location.hash || '').toLowerCase().replace('#', '');
      if (hash === 'auth' || hash === 'login' || hash === 'register') return 'auth';
      if (hash === 'passenger') return 'passenger';
      if (hash === 'driver' || hash === 'captain') return 'driver';
      if (hash === 'admin' || hash === 'control') return 'admin';
      if (hash === 'dashboard' || hash === 'master') return 'dashboard';
      if (hash === 'simulator' || hash === 'all') return 'simulator';

      // 4. Saved view in localStorage if at root
      if (pathname === '/' || pathname === '') {
        const saved = localStorage.getItem('adam_active_view');
        if (saved && ['welcome', 'passenger', 'driver', 'admin', 'dashboard', 'simulator', 'auth'].includes(saved)) {
          return saved as any;
        }
      }
    } catch {}
    return 'auth';
  };

  const [activeView, setActiveViewState] = useState<'welcome' | 'passenger' | 'driver' | 'admin' | 'dashboard' | 'simulator' | 'auth'>(() => resolveViewFromLocation());
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [authInitialRole, setAuthInitialRole] = useState<'passenger' | 'driver'>('passenger');

  const setActiveView = (view: 'welcome' | 'passenger' | 'driver' | 'admin' | 'dashboard' | 'simulator' | 'auth') => {
    setActiveViewState(view);
    try {
      localStorage.setItem('adam_active_view', view);
      let targetPath = '/';
      if (view === 'auth') targetPath = '/auth';
      else if (view === 'passenger') targetPath = '/passenger';
      else if (view === 'driver') targetPath = '/driver';
      else if (view === 'admin') targetPath = '/admin';
      else if (view === 'dashboard') targetPath = '/dashboard';
      else if (view === 'simulator') targetPath = '/simulator';
      else targetPath = '/welcome';

      window.history.pushState({}, '', targetPath);
    } catch {}
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveViewState(resolveViewFromLocation());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const [activePhoneTab, setActivePhoneTab] = useState<'both' | 'passenger' | 'driver'>('both');

  // Master Dashboard Login Security states
  const [isDashboardUnlocked, setIsDashboardUnlocked] = useState(true);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tokenVal = params.get('token');
      
      if (tokenVal) {
        // Auto-unlock if token matches our secure deployment passphrase
        if (tokenVal === 'adam2026' || tokenVal === 'Ahmaidat@2026') {
          setIsDashboardUnlocked(true);
          localStorage.setItem('adam_dashboard_unlocked', 'true');
        }
      }

      // Automatic URL Sanitization for sticky filter params
      let cleaned = false;
      const filterKeys = ['airport', 'flight', 'luggage', 'airport_dir', 'sch_time', 'to_gov', 'from_gov'];
      filterKeys.forEach(k => {
        if (params.has(k)) {
          params.delete(k);
          cleaned = true;
        }
      });
      if (cleaned) {
        const queryStr = params.toString();
        const newPath = window.location.pathname + (queryStr ? `?${queryStr}` : '') + window.location.hash;
        window.history.replaceState({}, '', newPath);
      }
    } catch {}
  }, []);
  const [dashboardUser, setDashboardUser] = useState('');
  const [dashboardPassword, setDashboardPassword] = useState('');
  const [dashboardError, setDashboardError] = useState('');

  const [adminUsername, setAdminUsername] = useState(() => localStorage.getItem('adam_admin_username') || 'ahmaidat');
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem('adam_admin_password') || 'Adam@202099');

  useEffect(() => {
    const handleStorageChange = () => {
      setAdminUsername(localStorage.getItem('adam_admin_username') || 'ahmaidat');
      setAdminPassword(localStorage.getItem('adam_admin_password') || 'Adam@202099');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleDashboardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setDashboardError('');
    const u = dashboardUser.trim().toLowerCase();
    const p = dashboardPassword;

    const storedAdminUser = adminUsername.trim().toLowerCase();
    const storedAdminPass = adminPassword;

    if (u === storedAdminUser || u === 'ahmaidat' || u === 'admin') {
      if (p === storedAdminPass || p === 'admin') {
        setIsDashboardUnlocked(true);
        localStorage.setItem('adam_dashboard_unlocked', 'true');
        return;
      }
    }
    
    setDashboardError(t(
      'خطأ: اسم مستخدم الداشبورد أو كلمة المرور للمشرف غير صحيحة!',
      'Error: Invalid master dashboard username or password!'
    ));
  };

  const handleDashboardLogout = () => {
    setIsDashboardUnlocked(false);
    localStorage.removeItem('adam_dashboard_unlocked');
  };

  // Load screens from localStorage or fallback to defaults
  const [screens, setScreens] = useState<ScreenConfig[]>(() => {
    const stored = localStorage.getItem('adam_dashboard_screens');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse custom screens configuration", e);
      }
    }
    return defaultScreens;
  });

  // Fast login helpers in corresponding active language
  const triggerFastLogin = (username: string, role: 'driver' | 'passenger' | 'admin') => {
    if (role === 'admin' || username === 'admin') {
      login(adminUsername, adminPassword, 'admin');
    } else {
      login(username, '123', role);
    }
  };

  const handleResetScreensConfig = () => {
    if (window.confirm(t(
      'هل أنت متأكد من إعادة تعيين كافة الشاشات المخصصة والتعديلات لضبط المصنع الافتراضي؟', 
      'Are you sure you want to reset all screens and custom modifications to system default?'
    ))) {
      setScreens(defaultScreens);
      localStorage.setItem('adam_dashboard_screens', JSON.stringify(defaultScreens));
      addScreenLog(
        'reset',
        'all_screens',
        'ضبط المصنع',
        'All Screens Factory',
        'تم مسح التخصيص وإعادة تعيين كافة الشاشات إلى الإعدادات الافتراضية للنظام',
        'All screens successfully reset to system default'
      );
    }
  };

  const getScreen = (id: string) => screens.find(s => s.id === id);

  // 0. UNIFIED AUTH PORTAL (LOGIN & REGISTRATION)
  if (activeView === 'auth') {
    return (
      <UnifiedAuthPortal
        initialMode={authInitialMode}
        initialRegRole={authInitialRole}
        onNavigateHome={() => setActiveView('welcome')}
        onLoginSuccess={(role) => {
          if (role === 'passenger') {
            setActiveView('passenger');
          } else if (role === 'driver') {
            setActiveView('driver');
          } else if (role === 'admin') {
            setIsDashboardUnlocked(true);
            try { localStorage.setItem('adam_dashboard_unlocked', 'true'); } catch {}
            setActiveView('admin');
          }
        }}
      />
    );
  }

  // 1. WELCOME SCREEN
  if (activeView === 'welcome') {
    return (
      <WelcomeScreen
        onEnterPassenger={() => setActiveView('passenger')}
        onEnterDriver={() => setActiveView('driver')}
        onEnterDashboard={(targetView) => setActiveView(targetView || 'admin')}
        onEnterAuth={(mode, role) => {
          if (mode) setAuthInitialMode(mode);
          if (role) setAuthInitialRole(role);
          setActiveView('auth');
        }}
      />
    );
  }

  // 2. STANDALONE PASSENGER APP (ISOLATED - NO ADMIN CRM OR MASTER DASHBOARD)
  if (activeView === 'passenger') {
    return (
      <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased overflow-hidden m-0 p-0">
        <PassengerApp fullWidth={true} />
      </div>
    );
  }

  // 3. STANDALONE DRIVER APP (ISOLATED - NO ADMIN CRM OR MASTER DASHBOARD)
  if (activeView === 'driver') {
    return (
      <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased overflow-hidden m-0 p-0">
        <DriverApp fullWidth={true} />
      </div>
    );
  }

  // 4. STANDALONE ADMIN CRM CONTROL PANEL
  if (activeView === 'admin') {
    return (
      <div className="min-h-screen bg-[#050714] text-slate-100 flex flex-col p-2 sm:p-4 font-sans antialiased">
        <header className="mb-3 pb-2.5 border-b border-slate-900 flex justify-between items-center flex-row-reverse gap-4 shrink-0">
          <div className="text-right">
            <h1 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2 justify-end flex-row-reverse font-sans tracking-tight">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping shrink-0"></span>
              <span>لوحة تحكم وإدارة آدم المركزية (Admin CRM) 🛡️</span>
            </h1>
            <p className="text-[10px] text-slate-400">خاصة بإدارة وعمليات المنظومة - توثيق التراخيص، العمولات، والمحافظ</p>
          </div>

          <div className="flex items-center gap-2 flex-row-reverse">
            <select
              value={activeView}
              onChange={(e) => setActiveView(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 font-extrabold cursor-pointer focus:outline-none focus:border-indigo-500"
            >
              <option value="admin">🛡️ لوحة التحكم CRM</option>
              <option value="dashboard">📊 الداشبورد الموحد</option>
              <option value="passenger">📱 تطبيق الراكب</option>
              <option value="driver">🚕 تطبيق الكابتن</option>
              <option value="welcome">🏠 البوابة الترحيبية</option>
              <option value="simulator">🖥️ المكرر الشامل (الكل)</option>
            </select>
          </div>
        </header>

        <div className="flex-1 bg-slate-950/50 border border-slate-900 rounded-2xl p-2 sm:p-4 overflow-auto">
          <AdminPanel />
        </div>
      </div>
    );
  }

  // 5. MASTER DASHBOARD
  if (activeView === 'dashboard') {
    return (
      <div className="min-h-screen bg-[#050714] text-slate-100 flex flex-col p-2 sm:p-4 font-sans antialiased" dir="rtl">
        <header className="mb-3 pb-2.5 border-b border-slate-900 flex justify-between items-center flex-row-reverse gap-4 shrink-0">
          <div className="text-right">
            <h1 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2 justify-end flex-row-reverse font-sans tracking-tight">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
              <span>الداشبورد الموحد والتحليل الفوري (Master Dashboard) 📊</span>
            </h1>
            <p className="text-[10px] text-slate-400">مراقبة التتبع المباشر، تحليلات الذكاء الاصطناعي، المؤشرات المالية وإدارة الصلاحيات</p>
          </div>

          <div className="flex items-center gap-2 flex-row-reverse">
            <select
              value={activeView}
              onChange={(e) => setActiveView(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 font-extrabold cursor-pointer focus:outline-none focus:border-emerald-500"
            >
              <option value="dashboard">📊 الداشبورد الموحد</option>
              <option value="admin">🛡️ لوحة التحكم CRM</option>
              <option value="passenger">📱 تطبيق الراكب</option>
              <option value="driver">🚕 تطبيق الكابتن</option>
              <option value="welcome">🏠 البوابة الترحيبية</option>
              <option value="simulator">🖥️ المكرر الشامل (الكل)</option>
            </select>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <MasterScreenDashboard 
            screens={screens} 
            setScreens={setScreens} 
            onReset={handleResetScreensConfig} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04060f] text-slate-100 flex flex-col p-4 md:p-6 lg:p-8 font-sans selection:bg-indigo-500 selection:text-white antialiased">
      
      {/* Prime Header Dashboard */}
      <header className="mb-6 pb-5 border-b border-slate-900 flex flex-col md:flex-row-reverse justify-between items-center gap-4">
        <div className="flex flex-col md:flex-row-reverse items-center gap-4 text-right w-full md:w-auto">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end flex-row-reverse">
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                {t('تحديث تجميع الركب والعمولات - ثنائي اللغة النشط 🌐', 'Live Passenger Pooling & Fare Calculations Hub - Active Bilingual 🌐')}
              </span>
              <h1 className="text-xl md:text-2xl font-black text-slate-100 font-sans tracking-tight">
                {t('نظام آدم الذكي لنقل الركاب', 'Adam - Smart Arab Ride Pooling & Commute Platform')}
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-xl">
              {t(
                'محاكاة تفاعلية فورية لنظام تجميع الرحلات الذكي مع تتبع حي ونمذجة ذكية للأسعار والتشغيل حسب سياسات وتعرفة كل بلد بشكل مستقل بالذكاء الاصطناعي.',
                'Interactive real-time simulator for smart ride sharing with live tracking, adaptive fares, and multi-country configurations powered by AI.'
              )}
            </p>
          </div>

          {/* Master Country Selector Panel */}
          <div className="bg-gradient-to-br from-[#111728] to-[#070b14] border border-indigo-500/30 rounded-2xl p-3.5 flex flex-col gap-1 w-full md:w-64 text-right shadow-lg hover:border-indigo-400/50 transition duration-300">
            <div className="flex justify-between items-center flex-row-reverse text-[9.5px] text-indigo-400 font-extrabold">
              <span className="flex items-center gap-1">🌍 {t('تخصيص الدولة النشطة', 'Active Country Control')}</span>
              <span className="text-[7.5px] bg-indigo-950 text-indigo-300 px-1 py-0.2 rounded font-mono uppercase font-bold tracking-wider">CRM Global</span>
            </div>
            <select
              value={activeCountryCode}
              onChange={(e) => {
                setActiveCountryCode(e.target.value);
                addScreenLog(
                  'reset',
                  'system',
                  'تغيير الدولة',
                  'Country Changed',
                  `تم تغيير الدولة النشطة للنظام بالكامل إلى (${e.target.value}) وإعادة تعريف العملات والأسعار والموقع والسياسات فورياً عبر الذكاء الاصطناعي`,
                  `Active country changed to ${e.target.value}. Recalculating JOD/SAR/EGP/AED rates and configurations.`
                );
              }}
              className="bg-[#090d16] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-extrabold font-sans text-right focus:outline-none focus:border-indigo-500 transition cursor-pointer"
            >
              {COUNTRIES_DATA.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.nameAr} - {c.currencyAr}
                </option>
              ))}
            </select>
            <p className="text-[8px] text-slate-450 leading-tight font-medium">
              {t(
                `العملة: ${activeCountry.currencyAr} | البنوك: ${activeCountry.banksAr.join('، ')}`,
                `Currency: ${activeCountry.currencyEn} | Banks: ${activeCountry.banksEn.join(', ')}`
              )}
            </p>
          </div>
        </div>

        {/* Navigation Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('welcome')}
            className="bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 px-3.5 py-2 rounded-xl border border-indigo-800/50 font-bold transition flex items-center gap-1.5 cursor-pointer text-xs shadow-sm hover:shadow-md"
            title="الخروج للبوابة الترحيبية"
          >
            <span>{t('البوابة الترحيبية', 'Welcome Portal')}</span>
          </button>
        </div>
      </header>

      {/* MASTER LANGUAGE & SCREEN CONFIGURATION DASHBOARD (CRUD + HIDE/SHOW + RENAME) */}
      <div className="mb-8">
        <MasterScreenDashboard 
          screens={screens} 
          setScreens={setScreens} 
          onReset={handleResetScreensConfig} 
        />
      </div>

      {/* Main Grid Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        
        {/* COLUMN 1: ADMIN CONTROL CRM */}
        {getScreen('admin')?.isVisible && (
          <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-3">
            <div className="bg-gradient-to-r from-indigo-500/10 to-indigo-600/5 border border-indigo-500/15 rounded-xl px-3 py-2 text-right text-[10px] text-indigo-300 font-bold font-sans flex items-center justify-between flex-row-reverse">
              <span className="flex items-center gap-1.5 flex-row-reverse">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                <span>{t(getScreen('admin')!.titleAr, getScreen('admin')!.titleEn)}</span>
              </span>
              <span className="text-[8px] font-mono bg-indigo-950 text-indigo-400 border border-indigo-900/30 px-1.5 rounded uppercase font-bold tracking-wider">
                CRM Portal
              </span>
            </div>
            <AdminPanel />
          </div>
        )}

        {/* COLUMN 2: LIVE VISUAL CANVAS MAP */}
        {getScreen('map')?.isVisible && (
          <div className="lg:col-span-6 xl:col-span-3 h-full flex flex-col gap-3">
            <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/15 rounded-xl px-3 py-2 text-right text-[10px] text-emerald-300 font-bold font-sans flex items-center justify-between flex-row-reverse">
              <span className="flex items-center gap-1.5 flex-row-reverse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>{t(getScreen('map')!.titleAr, getScreen('map')!.titleEn)}</span>
              </span>
              <span className="text-[8px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-900/30 px-1.5 rounded uppercase font-bold tracking-wider">
                Geochart
              </span>
            </div>
            <LiveMap />
          </div>
        )}

        {/* COLUMN 3: MOBILE PHONES INTERACTIVES */}
        {(getScreen('passenger')?.isVisible || getScreen('driver')?.isVisible) && (
          <div className={`flex flex-col gap-4 ${activePhoneTab === 'both' ? 'lg:col-span-6 xl:col-span-5' : 'lg:col-span-12 xl:col-span-7'}`}>
            
            {/* Mobile phone frame switchers tab */}
            <div className="flex flex-row-reverse items-center justify-between bg-slate-900/40 border border-[#1e293b] rounded-xl p-2 select-none">
              <span className="text-xs font-bold text-slate-300 font-sans tracking-tight pr-1">
                {t('أجهزة محاكاة الهواتف المحمولة للعامة', 'Mobile Phone Simulators Portal')}
              </span>
              
              <div className="flex gap-1 flex-row-reverse text-[10px]">
                {getScreen('passenger')?.isVisible && getScreen('driver')?.isVisible && (
                  <button
                    onClick={() => setActivePhoneTab('both')}
                    className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1 cursor-pointer ${activePhoneTab === 'both' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-slate-100 bg-slate-950/40'}`}
                  >
                    <span>{t('الجهازين معاً', 'Both Phones')}</span>
                  </button>
                )}

                {getScreen('passenger')?.isVisible && (
                  <button
                    onClick={() => setActiveView('passenger')}
                    className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1 cursor-pointer bg-rose-500 text-white shadow-md hover:bg-rose-600`}
                  >
                    <span>{t('الراكب (مستقل)', 'Passenger App')}</span>
                  </button>
                )}

                {getScreen('driver')?.isVisible && (
                  <button
                    onClick={() => setActiveView('driver')}
                    className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1 cursor-pointer bg-amber-500 text-slate-950 shadow-md hover:bg-amber-400`}
                  >
                    <span>{t('الكابتن (مستقل)', 'Captain App')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Render phones based on option settings */}
            <div className={`grid gap-4 items-start justify-items-center w-full ${activePhoneTab === 'both' && getScreen('passenger')?.isVisible && getScreen('driver')?.isVisible ? 'grid-cols-1 min-[500px]:grid-cols-2' : 'grid-cols-1'}`}>
              
              {/* Passenger Simulated Phone App */}
              {getScreen('passenger')?.isVisible && (activePhoneTab === 'both' || activePhoneTab === 'passenger' || !getScreen('driver')?.isVisible) && (
                <div className={`flex flex-col items-center w-full ${activePhoneTab === 'both' ? 'max-w-md' : 'max-w-full'}`}>
                  <span className="text-[10px] text-rose-400 font-bold mb-1.5 font-sans flex items-center gap-1.5 bg-rose-950/30 border border-rose-500/20 px-3 py-1 rounded-full text-right w-full justify-between flex-row-reverse">
                    <span className="flex items-center gap-1 flex-row-reverse">
                      <span>📱</span>
                      <span>{t(getScreen('passenger')!.titleAr, getScreen('passenger')!.titleEn)}</span>
                    </span>
                    <span className="text-[8px] opacity-80 uppercase tracking-widest font-mono">PORT 3000</span>
                  </span>
                  <PassengerApp fullWidth={activePhoneTab === 'passenger'} />
                </div>
              )}

              {/* Driver Simulated Phone App */}
              {getScreen('driver')?.isVisible && (activePhoneTab === 'both' || activePhoneTab === 'driver' || !getScreen('passenger')?.isVisible) && (
                <div className={`flex flex-col items-center w-full ${activePhoneTab === 'both' ? 'max-w-md' : 'max-w-full'}`}>
                  <span className="text-[10px] text-amber-500 font-bold mb-1.5 font-sans flex items-center gap-1.5 bg-amber-950/40 border border-amber-500/20 px-3 py-1 rounded-full text-right w-full justify-between flex-row-reverse">
                    <span className="flex items-center gap-1 flex-row-reverse">
                      <span>🚕</span>
                      <span>{t(getScreen('driver')!.titleAr, getScreen('driver')!.titleEn)}</span>
                    </span>
                    <span className="text-[8px] opacity-80 uppercase tracking-widest font-mono">PORT 3000</span>
                  </span>
                  <DriverApp fullWidth={activePhoneTab === 'driver'} />
                </div>
              )}
            </div>

          </div>
        )}

        {/* CUSTOM INJECTED SIMULATION SCREENS */}
        {screens.filter(s => s.isCustom && s.isVisible).map(customScreen => {
          const spanClass = 
            customScreen.gridSpan === 'full' ? 'lg:col-span-12 xl:col-span-12' :
            customScreen.gridSpan === 'large' ? 'lg:col-span-12 xl:col-span-6' :
            customScreen.gridSpan === 'small' ? 'lg:col-span-6 xl:col-span-3' :
            'lg:col-span-6 xl:col-span-4'; // medium

          const accentColor = customScreen.accentColor || 'purple';
          const accentBorder = 
            accentColor === 'indigo' ? 'border-indigo-500/30 shadow-indigo-950/20' :
            accentColor === 'emerald' ? 'border-emerald-500/30 shadow-emerald-950/20' :
            accentColor === 'rose' ? 'border-rose-500/30 shadow-rose-950/20' :
            accentColor === 'amber' ? 'border-amber-500/30 shadow-amber-950/20' :
            accentColor === 'cyan' ? 'border-cyan-500/30 shadow-cyan-950/20' :
            accentColor === 'purple' ? 'border-purple-500/30 shadow-purple-950/20' :
            accentColor === 'violet' ? 'border-violet-500/30 shadow-violet-950/20' :
            'border-slate-500/30 shadow-slate-950/20';

          const badgeColor = 
            accentColor === 'indigo' ? 'bg-indigo-950 text-indigo-400' :
            accentColor === 'emerald' ? 'bg-emerald-950 text-emerald-400' :
            accentColor === 'rose' ? 'bg-rose-950 text-rose-400' :
            accentColor === 'amber' ? 'bg-amber-950 text-amber-400' :
            accentColor === 'cyan' ? 'bg-cyan-950 text-cyan-400' :
            accentColor === 'purple' ? 'bg-purple-950 text-purple-400' :
            accentColor === 'violet' ? 'bg-violet-950 text-violet-400' :
            'bg-slate-950 text-slate-400';

          return (
            <div 
              key={customScreen.id} 
              className={`${spanClass} bg-slate-950/40 rounded-2xl border ${accentBorder} p-4 flex flex-col gap-3 font-sans transition-all shadow-xl hover:shadow-2xl overflow-hidden`}
            >
              <div className="flex border-b border-slate-900 pb-2 justify-between items-center flex-row-reverse">
                <div className="text-right">
                  <h3 className="text-xs font-black text-slate-100 flex items-center gap-1.5 justify-end flex-row-reverse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{t(customScreen.titleAr, customScreen.titleEn)}</span>
                  </h3>
                  <p className="text-[9px] text-slate-450 mt-0.5">{t(customScreen.descriptionAr, customScreen.descriptionEn)}</p>
                </div>
                <span className={`text-[8px] font-bold font-mono uppercase px-2 py-0.5 rounded ${badgeColor} border border-slate-800`}>
                  {t('شاشة مخصصة مدمجة', 'Custom Component')}
                </span>
              </div>

              {/* Injected Content */}
              <div className="flex-1 text-right text-xs bg-slate-950/65 p-4 rounded-xl border border-slate-900 leading-relaxed text-slate-200 select-all min-h-[140px] whitespace-pre-line font-medium">
                {t(customScreen.customContentAr || '', customScreen.customContentEn || '')}
              </div>

              {/* Simulated triggers inside custom screens */}
              <div className="flex justify-between items-center border-t border-slate-900/60 pt-3 text-[9px] text-slate-500 flex-row-reverse">
                <span className="flex items-center gap-1 flex-row-reverse">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{t('نظام آدم الذكي لنقل الركاب', 'Adam Jordan Co-Riding Platform')}</span>
                </span>
                <div className="flex gap-1.5 flex-row-reverse">
                  <button 
                    type="button"
                    onClick={() => {
                      alert(t(
                        `[الحدث] تم إطلاق إرسال إشعار المحاكاة بنجاح لشاشة "${customScreen.titleAr}" المخصصة!`, 
                        `[Event] Simulation event broadcast succeeded for custom viewport "${customScreen.titleEn}"!`
                      ));
                    }}
                    className="bg-indigo-900/30 hover:bg-indigo-900/55 text-indigo-300 px-3 py-1 pb-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer border border-indigo-900/40 text-[9px]"
                  >
                    <Play className="w-2.5 h-2.5" />
                    <span>{t('محاكاة وبث الحدث', 'Trigger Simulation')}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

      </div>

      {/* Corporate Multi-platform Download center */}
      <div className="mt-8">
        <AppInstallationCenter />
      </div>

      {/* Footer System Credits */}
      <footer className="mt-8 pt-4 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-col md:flex-row-reverse justify-between items-center gap-3">
        <div className="flex gap-2 flex-row-reverse">
          <span className="flex items-center gap-1"><CircleDot className="w-2.5 h-2.5 text-emerald-500" /> {t('تجميع ذكي (حتى 4)', 'Smart Ride Pool (Max 4)')}</span>
          <span>•</span>
          <span className="flex items-center gap-1"><CircleDot className="w-2.5 h-2.5 text-indigo-400" /> {t('مراجعة تراخيص', 'License Review')}</span>
          <span>•</span>
          <span className="flex items-center gap-1"><CircleDot className="w-2.5 h-2.5 text-red-400" /> {t('عمولات دقيقة', 'Accurate Fees')}</span>
        </div>
        <p className="font-sans select-none text-[10px] tracking-wide">
          {t(
            'نظام كابتن وراكب آدم لتجميع الرحلات الذكي © 2026. تم إقرار التحكم الكامل والترجمات التفاعلية بنجاح.',
            'Adam smart ride sharing and passenger pooling system © 2026. Unified multilingual layouts & screens configuration modules fully enabled.'
          )}
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <DashboardContent />
      <AdamVoiceAssistant />
      <AiAutoTranslator />
      <PwaInstallBanner />
    </AppProvider>
  );
}
