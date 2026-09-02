import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Car, 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Upload, 
  Smartphone, 
  FileText, 
  Sparkles, 
  Globe, 
  Phone, 
  Mail, 
  Check, 
  KeyRound,
  ShieldCheck,
  Zap,
  UserPlus,
  LogIn,
  ExternalLink,
  Navigation,
  Compass,
  Cpu,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useAppState } from '../stateEngine';
import { ApiService } from '../services/api';

const FALLBACK_JORDAN_LOCATIONS = [
  {
    governorate: 'عمان (Amman)',
    districts: [
      { name: 'لواء قصبة عمان', villages: ['جبل عمان', 'اللويبدة', 'وسط البلد', 'الشميساني'] },
      { name: 'لواء الجامعة', villages: ['الجبيهة', 'صويلح', 'تلاع العلي', 'خلدا'] },
      { name: 'لواء وادي السير', villages: ['بيادر وادي السير', 'عبدون', 'دير غبار', 'أم أذينة'] }
    ]
  },
  {
    governorate: 'إربد (Irbid)',
    districts: [
      { name: 'لواء قصبة إربد', villages: ['الحي الشرقي', 'الحي الغربي', 'شارع الجامعة', 'ايدون'] },
      { name: 'لواء بني عبيد', villages: ['الحصن', 'الصريح', 'النعيمة'] }
    ]
  },
  {
    governorate: 'الزرقاء (Zarqa)',
    districts: [
      { name: 'لواء قصبة الزرقاء', villages: ['الزرقاء الجديدة', 'حي معصوم', 'حي رمزي'] },
      { name: 'لواء الرصيفة', villages: ['الجبل الشمالي', 'جبل الأمير فيصل'] }
    ]
  },
  {
    governorate: 'العقبة (Aqaba)',
    districts: [
      { name: 'لواء قصبة العقبة', villages: ['المنطقة التجارية', 'الشاطئ الجنوبي', 'تالا بيه'] }
    ]
  }
];

interface UnifiedAuthPortalProps {
  initialMode?: 'login' | 'register';
  initialRegRole?: 'passenger' | 'driver';
  onLoginSuccess?: (role: 'passenger' | 'driver' | 'admin', user: any) => void;
  onNavigateHome?: () => void;
}

export const UnifiedAuthPortal: React.FC<UnifiedAuthPortalProps> = ({
  initialMode = 'login',
  initialRegRole = 'passenger',
  onLoginSuccess,
  onNavigateHome
}) => {
  const { 
    t, 
    language, 
    setLanguage, 
    login, 
    registerPassenger, 
    registerDriver, 
    approvePassenger,
    approveDriver,
    passengers,
    drivers,
    settings, 
    activeCountryCode,
    setActiveCountryCode
  } = useAppState();

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>(initialMode);
  // Reg Role: 'passenger' | 'driver'
  const [regRole, setRegRole] = useState<'passenger' | 'driver'>(initialRegRole);

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  
  // AI Intelligence States
  const [aiClassification, setAiClassification] = useState<{
    role: 'passenger' | 'driver' | 'admin';
    confidence: number;
    arabicRoleName: string;
    welcomeMessage: string;
    suggestedService: string;
    targetView: 'passenger' | 'driver' | 'admin';
    quickActions?: string[];
    aiTip?: string;
  } | null>(null);
  const [isClassifyingAi, setIsClassifyingAi] = useState(false);
  const debounceTimerRef = useRef<any>(null);

  // AI Transition state
  const [aiTransitioning, setAiTransitioning] = useState<{
    active: boolean;
    roleName: string;
    serviceName: string;
    progress: number;
  } | null>(null);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotFeedback, setForgotFeedback] = useState('');

  // Passenger Registration States
  const [pFullName, setPFullName] = useState('');
  const [pUsername, setPUsername] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pPassword, setPPassword] = useState('');
  const [pGov, setPGov] = useState('عمان (Amman)');
  const [pDist, setPDist] = useState('');
  const [pVillage, setPVillage] = useState('');
  const [pPhoto, setPPhoto] = useState<string>('');
  const [pIdFront, setPIdFront] = useState<string>('');

  // Driver Registration States
  const [dFullName, setDFullName] = useState('');
  const [dUsername, setDUsername] = useState('');
  const [dPhone, setDPhone] = useState('');
  const [dEmail, setDEmail] = useState('');
  const [dGov, setDGov] = useState('عمان (Amman)');
  const [dDist, setDDist] = useState('');
  const [dLicenseExpiry, setDLicenseExpiry] = useState('');
  const [dBrand, setDBrand] = useState('تويوتا');
  const [dModel, setDModel] = useState('بريوس هجين (Prius)');
  const [dCustomModel, setDCustomModel] = useState('');
  const [dYear, setDYear] = useState('2022');
  const [dPlate, setDPlate] = useState('');
  const [dColor, setDColor] = useState('أبيض لؤلؤي');
  const [dLicenseDoc, setDLicenseDoc] = useState('');
  const [dCarLicenseDoc, setDCarLicenseDoc] = useState('');
  const [dNonConvictionDoc, setDNonConvictionDoc] = useState('');

  // Registration Result Modal
  const [regResult, setRegResult] = useState<{
    show: boolean;
    role: 'passenger' | 'driver';
    success: boolean;
    title: string;
    msg: string;
    tempPassword?: string;
    username?: string;
    aiLog?: string;
    registeredId?: string;
  } | null>(null);

  const locationsList = settings?.locations || FALLBACK_JORDAN_LOCATIONS;

  // Selected Province object for passenger
  const pProvinceObj = locationsList.find(l => l.governorate === pGov);
  const pDistricts = pProvinceObj?.districts || [];
  const pDistObj = pDistricts.find(d => d.name === pDist);
  const pVillages = pDistObj?.villages || [];

  // Selected Province object for driver
  const dProvinceObj = locationsList.find(l => l.governorate === dGov);
  const dDistricts = dProvinceObj?.districts || [];

  // Vehicle Brands dataset
  const VEHICLE_BRANDS = [
    { name: 'تويوتا', models: ['بريوس هجين (Prius)', 'كامري (Camry)', 'كورولا (Corolla)', 'راف فور (RAV4)', 'يارس (Yaris)'] },
    { name: 'هيونداي', models: ['سوناتا هجين (Sonata)', 'النترا (Elantra)', 'ايونيك كهرباء (Ioniq)', 'اكسنت (Accent)', 'توسان (Tucson)'] },
    { name: 'كيا', models: ['نيرو هجين (Niro)', 'اوبتيما / K5', 'سيراتو (Cerato)', 'بيكانتو (Picanto)', 'سبورتاج (Sportage)'] },
    { name: 'نيسان', models: ['ليف كهرباء (Leaf)', 'صني (Sunny)', 'سنترا (Sentra)', 'كيكس (Kicks)'] },
    { name: 'تسلا', models: ['Model 3', 'Model Y', 'Model S'] },
    { name: 'مرسيدس بنز', models: ['E-Class', 'C-Class', 'EQE Electric'] },
    { name: 'بي واي دي (BYD)', models: ['سونغ بلس (Song Plus)', 'اتول ثري (Atto 3)', 'هان (Han EV)'] },
    { name: 'أخرى / كتابة يدوية', models: ['مخصص'] }
  ];

  // AI live classification hook with debounce
  useEffect(() => {
    const raw = loginIdentifier.trim();
    if (!raw) {
      setAiClassification(null);
      setIsClassifyingAi(false);
      return;
    }

    // Local instant hint heuristics while waiting for AI API
    const rawLower = raw.toLowerCase();
    if (rawLower === 'ahmaidat' || rawLower === 'admin') {
      setAiClassification({
        role: 'admin',
        confidence: 0.99,
        arabicRoleName: 'مدير المنظومة والعمليات',
        welcomeMessage: 'مرحباً بمدير المنظومة، جاهز لفتح لوحة التحكم المركزية والرقابة',
        suggestedService: 'لوحة التحكم والعمليات السحابية (Admin CRM)',
        targetView: 'admin',
        quickActions: ['إدارة الأسطول', 'مراقبة الرادار', 'التسويات المالية'],
        aiTip: 'تأكد من إدخال كلمة المرور الإدارية للمصادقة'
      });
    } else if (rawLower.startsWith('drv_') || rawLower.includes('driver') || rawLower === 'khalil') {
      setAiClassification({
        role: 'driver',
        confidence: 0.98,
        arabicRoleName: 'كابتن معتمد',
        welcomeMessage: 'أهلاً بك كابتن! جاهزون لفتح رادار استقبال الطلبات والعداد الذكي',
        suggestedService: 'تطبيق الكابتن واستقبال طلبات الركاب الفورية والمجدولة',
        targetView: 'driver',
        quickActions: ['استقبال الطلبات', 'العداد الرقمي', 'محفظة الكابتن'],
        aiTip: 'سيتم توجيهك فوراً لتطبيق الكابتن وبدء استلام الرحلات'
      });
    } else if (rawLower.startsWith('psg_') || rawLower.includes('passenger') || rawLower === 'ahmad') {
      setAiClassification({
        role: 'passenger',
        confidence: 0.98,
        arabicRoleName: 'راكب معتمد',
        welcomeMessage: 'أهلاً بك راكب آدم! جاهز لفتح خدمات حجز التكسي والرحلات المشتركة',
        suggestedService: 'تطبيق الراكب وحجز التكسي الفوري والرحلات بين المحافظات',
        targetView: 'passenger',
        quickActions: ['طلب تكسي فوري', 'رحلات بين المحافظات', 'تكسي سيدات', 'المحفظة'],
        aiTip: 'سيتم نقلك فوراً إلى شاشة الراكب مع خريطة التتبع المباشر'
      });
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      setIsClassifyingAi(true);
      try {
        const res = await ApiService.classifyAuthWithAi(raw, activeCountryCode);
        if (res && res.success && res.classification) {
          setAiClassification(res.classification);
        }
      } catch (err) {
        // Fallback to heuristic
      } finally {
        setIsClassifyingAi(false);
      }
    }, 350);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [loginIdentifier, activeCountryCode]);

  // Handle Unified Login Submission with AI Intelligent Role-Based Routing
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');

    if (!loginIdentifier.trim()) {
      setLoginError('يرجى إدخال اسم المستخدم أو رقم الهاتف أو البريد الإلكتروني');
      return;
    }
    if (!loginPassword) {
      setLoginError('يرجى إدخال كلمة المرور');
      return;
    }

    setLoginLoading(true);
    setTimeout(() => {
      const res = login(loginIdentifier.trim(), loginPassword, 'auto');
      setLoginLoading(false);

      if (res.success && res.role) {
        const targetRole = res.role;
        const targetServiceName = 
          targetRole === 'passenger' ? 'تطبيق وخدمات الراكب (حجز التكسي والرحلات المشتركة)' :
          targetRole === 'driver' ? 'تطبيق وخدمات الكابتن (رادار الطلبات والعداد الذكي)' :
          'لوحة التحكم والعمليات السحابية (Admin CRM)';

        setLoginSuccess(res.msg);

        // Show AI Transition animation
        setAiTransitioning({
          active: true,
          roleName: targetRole === 'passenger' ? 'الراكب 👤' : targetRole === 'driver' ? 'الكابتن 🚕' : 'مدير النظام 🛡️',
          serviceName: targetServiceName,
          progress: 100
        });

        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(res.role, res.user);
          }
        }, 900);
      } else {
        setLoginError(res.msg || 'فشل تسجيل الدخول. يرجى التحقق من البيانات المدخلة.');
      }
    }, 350);
  };

  // Quick fill helper for testing
  const handleQuickFill = (type: 'passenger' | 'driver' | 'admin') => {
    if (type === 'passenger') {
      setLoginIdentifier('ahmad');
      setLoginPassword('123');
    } else if (type === 'driver') {
      setLoginIdentifier('khalil');
      setLoginPassword('123');
    } else if (type === 'admin') {
      setLoginIdentifier('ahmaidat');
      setLoginPassword('Adam@202099');
    }
  };

  // Handle Passenger Registration Submission
  const handlePassengerReg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pFullName.trim() || !pUsername.trim() || !pPhone.trim() || !pPassword) {
      alert('يرجى تعبئة كافة الحقول الإلزامية لتسجيل الراكب');
      return;
    }

    const passengerData = {
      fullName: pFullName.trim(),
      username: pUsername.trim().toLowerCase(),
      phone: pPhone.trim(),
      email: pEmail.trim() || `${pUsername.trim()}@adam.jo`,
      password: pPassword,
      governorate: pGov,
      district: pDist || (pDistricts[0]?.name || ''),
      village: pVillage || '',
      country: activeCountryCode,
      documents: {
        photo: pPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        idFront: pIdFront || ''
      }
    };

    const res = registerPassenger(passengerData);
    if (res.success) {
      // Find created passenger
      const createdPsg = passengers.find(p => p.username === passengerData.username) || { id: 'psg_' + Date.now() };

      setRegResult({
        show: true,
        role: 'passenger',
        success: true,
        title: 'تم إنشاء حساب الراكب بنجاح 👤',
        msg: res.msg,
        tempPassword: res.tempPassword,
        username: res.generatedUsername,
        aiLog: res.aiLog,
        registeredId: (createdPsg as any).id
      });
      // Pre-fill login
      setLoginIdentifier(passengerData.username);
      setLoginPassword(passengerData.password);
    } else {
      alert(res.msg);
    }
  };

  // Handle Driver Registration Submission
  const handleDriverReg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dFullName.trim() || !dUsername.trim() || !dPhone.trim() || !dLicenseExpiry) {
      alert('يرجى تعبئة كافة الحقول الإلزامية ومعلومات الترخيص');
      return;
    }

    const effectiveCarModel = dBrand === 'أخرى / كتابة يدوية' || dModel === 'مخصص' 
      ? (dCustomModel.trim() || 'مركبة كابتن خاصة') 
      : `${dBrand} ${dModel} (${dYear})`;

    const driverData = {
      fullName: dFullName.trim(),
      username: dUsername.trim().toLowerCase(),
      phone: dPhone.trim(),
      email: dEmail.trim() || `${dUsername.trim()}@adam.jo`,
      governorate: dGov,
      district: dDist || (dDistricts[0]?.name || ''),
      carType: effectiveCarModel,
      carModel: effectiveCarModel,
      carPlate: dPlate.trim() || '44-99881',
      carColor: dColor,
      licenseExpiry: dLicenseExpiry,
      country: activeCountryCode,
      documents: {
        driverLicense: dLicenseDoc || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400',
        carLicense: dCarLicenseDoc || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
        nonConviction: dNonConvictionDoc || 'approved'
      }
    };

    const res = registerDriver(driverData);
    if (res.success) {
      const createdDrv = drivers.find(d => d.username === driverData.username) || { id: 'drv_' + Date.now() };

      setRegResult({
        show: true,
        role: 'driver',
        success: true,
        title: 'تم تقديم طلب انضمام الكابتن بنجاح 🚕',
        msg: res.msg,
        tempPassword: res.tempPassword,
        username: res.generatedUsername,
        aiLog: res.aiLog,
        registeredId: (createdDrv as any).id
      });
      // Pre-fill login
      setLoginIdentifier(driverData.username);
      if (res.tempPassword) setLoginPassword(res.tempPassword);
    } else {
      alert(res.msg);
    }
  };

  // Instant AI Activation & Launch from Registration Modal
  const handleInstantActivationAndLaunch = (role: 'passenger' | 'driver', username?: string, password?: string, id?: string) => {
    if (role === 'passenger') {
      if (id) approvePassenger(id);
      const res = login(username || loginIdentifier, password || loginPassword || '123', 'passenger');
      setRegResult(null);
      if (res.success && onLoginSuccess) {
        onLoginSuccess('passenger', res.user);
      }
    } else if (role === 'driver') {
      if (id) approveDriver(id);
      const res = login(username || loginIdentifier, password || loginPassword || '123', 'driver');
      setRegResult(null);
      if (res.success && onLoginSuccess) {
        onLoginSuccess('driver', res.user);
      }
    }
  };

  // Simulated Document Upload Handler
  const handleFileUpload = (setter: (url: string) => void) => {
    const dummyUrls = [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'
    ];
    const picked = dummyUrls[Math.floor(Math.random() * dummyUrls.length)];
    setter(picked);
  };

  return (
    <div className="min-h-screen bg-[#060814] text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white relative overflow-hidden" dir="rtl">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Bar with Language & Country info */}
      <header className="w-full max-w-5xl mx-auto px-4 py-4 flex justify-between items-center border-b border-slate-900 z-10">
        <div className="flex items-center gap-2">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1 transition cursor-pointer font-bold"
            >
              <span>الرئيسية</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-[11px] text-indigo-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>بوابة منظومة آدم الموحدة 🇯🇴</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={activeCountryCode}
            onChange={(e) => setActiveCountryCode(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 font-bold outline-none cursor-pointer"
          >
            <option value="JO">🇯🇴 الأردن (JOD)</option>
            <option value="SA">🇸🇦 السعودية (SAR)</option>
            <option value="EG">🇪🇬 مصر (EGP)</option>
            <option value="AE">🇦🇪 الإمارات (AED)</option>
          </select>

          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>{language === 'ar' ? 'English' : 'عربي'}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-xl mx-auto px-4 py-6 md:py-10 flex-1 flex flex-col justify-center relative z-10">
        
        {/* Main Card */}
        <div className="bg-[#0b1024]/95 border border-indigo-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm relative">
          
          {/* Header Title */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 p-0.5 shadow-lg shadow-indigo-500/20 mb-3 flex items-center justify-center">
              <div className="w-full h-full bg-[#070b1a] rounded-2xl flex items-center justify-center">
                <Zap className="w-7 h-7 text-amber-400 fill-amber-400/20" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
              منظومة <span className="bg-gradient-to-l from-amber-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">آدم للنقل الذكي</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium leading-relaxed">
              بوابة الدخول الذكية الموحدة: يتعرف النظام تلقائياً على نوع الحساب ويفتح الخدمات المخصصة فوراً
            </p>
          </div>

          {/* Top Auth Mode Tabs Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setLoginError('');
                setLoginSuccess('');
              }}
              className={`py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول الموحد 🔑</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setLoginError('');
                setLoginSuccess('');
              }}
              className={`py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'register'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-lg shadow-amber-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>إنشاء حساب جديد ✨</span>
            </button>
          </div>

          {/* ======================= TAB 1: UNIFIED LOGIN FORM WITH AI INTELLIGENCE ======================= */}
          {authMode === 'login' && (
            <div className="space-y-4">
              
              {/* Dynamic AI Auto-Detection & Destination Preview Card */}
              {aiClassification ? (
                <div className={`p-3.5 rounded-2xl border transition-all text-right ${
                  aiClassification.role === 'passenger' 
                    ? 'bg-indigo-950/50 border-indigo-500/40 text-indigo-200' 
                    : aiClassification.role === 'driver'
                    ? 'bg-amber-950/50 border-amber-500/40 text-amber-200'
                    : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                }`}>
                  <div className="flex items-center justify-between flex-row-reverse mb-1.5">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                        aiClassification.role === 'passenger' ? 'bg-indigo-500/20 text-indigo-300' :
                        aiClassification.role === 'driver' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-rose-500/20 text-rose-300'
                      }`}>
                        {aiClassification.role === 'passenger' ? '👤' : aiClassification.role === 'driver' ? '🚕' : '🛡️'}
                      </div>
                      <div>
                        <span className="text-xs font-black block text-white">
                          تم التعرف بالذكاء الاصطناعي: {aiClassification.arabicRoleName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-row-reverse">
                      {isClassifyingAi && <span className="animate-spin w-2.5 h-2.5 border-2 border-indigo-400 border-t-transparent rounded-full" />}
                      <span className="text-[10px] bg-slate-900/80 px-2 py-0.5 rounded-full font-mono font-bold text-slate-300">
                        {(aiClassification.confidence * 100).toFixed(0)}% دقة
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center gap-1.5 flex-row-reverse font-bold text-slate-200">
                      <Cpu className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>الخدمات التي ستفتح لك فور تسجيل الدخول:</span>
                    </div>
                    <p className="text-[10.5px] text-slate-300 pr-5 leading-relaxed">
                      {aiClassification.suggestedService}
                    </p>
                    {aiClassification.quickActions && aiClassification.quickActions.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1 justify-end">
                        {aiClassification.quickActions.map((act, i) => (
                          <span key={i} className="text-[9px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded-md border border-slate-800">
                            ✓ {act}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-indigo-950/40 border border-indigo-500/20 p-3 rounded-2xl flex items-center justify-between flex-row-reverse text-right">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-[11px] text-indigo-300 font-bold">
                      أدخل اسم المستخدم أو الهاتف وسيقوم الذكاء الاصطناعي بتوجيهك لخدماتك آلياً
                    </span>
                  </div>
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md font-mono font-bold">
                    AI Auto-Routing
                  </span>
                </div>
              )}

              {loginError && (
                <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300 text-right flex items-start gap-2 flex-row-reverse leading-relaxed font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 text-right flex items-start gap-2 flex-row-reverse leading-relaxed font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{loginSuccess}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {/* Username / Phone / Email input */}
                <div className="bg-slate-900/90 border border-slate-800 focus-within:border-indigo-500/80 rounded-2xl p-3 flex flex-col gap-1 text-right transition">
                  <label className="text-[10px] text-slate-400 font-bold block pr-1">
                    اسم المستخدم / رقم الهاتف / البريد الإلكتروني
                  </label>
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="مثال: ahmad أو khalil أو 0791234567"
                      className="bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none flex-1 font-sans text-right"
                    />
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                </div>

                {/* Password input */}
                <div className="bg-slate-900/90 border border-slate-800 focus-within:border-indigo-500/80 rounded-2xl p-3 flex flex-col gap-1 text-right transition">
                  <div className="flex justify-between items-center flex-row-reverse">
                    <label className="text-[10px] text-slate-400 font-bold block pr-1">
                      كلمة المرور الأمنية
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      {showPassword ? (
                        <>
                          <span>إخفاء</span>
                          <EyeOff className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          <span>إظهار</span>
                          <Eye className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none flex-1 font-mono text-right"
                    />
                    <Lock className="w-4 h-4 text-slate-500" />
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-between items-center text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(true);
                      setForgotFeedback('');
                      setForgotPhone('');
                    }}
                    className="text-[10.5px] text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer"
                  >
                    نسيت كلمة السر؟ استعدها آلياً عبر SMS 📲
                  </button>
                </div>

                {/* Submit Login Button */}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm py-3.5 rounded-2xl transition duration-150 cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {loginLoading ? (
                    <span className="animate-spin w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>
                        {aiClassification 
                          ? `تسجيل الدخول وفتح ${aiClassification.arabicRoleName} 🚀` 
                          : 'تسجيل الدخول الذكي للخدمات 🚀'}
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Preset Demo Accounts */}
              <div className="mt-6 pt-4 border-t border-slate-900">
                <span className="text-[10px] text-slate-400 font-bold block text-center mb-2.5">
                  🧪 حسابات تجريبية سريعة بنقرة واحدة (One-Click Auto-Fill & Launch):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('passenger')}
                    className="bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 p-2.5 rounded-xl text-center transition cursor-pointer group"
                  >
                    <span className="text-xs block font-bold text-indigo-300 group-hover:text-indigo-200">👤 راكب آدم</span>
                    <span className="text-[9px] text-slate-400 font-mono">ahmad / 123</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill('driver')}
                    className="bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 p-2.5 rounded-xl text-center transition cursor-pointer group"
                  >
                    <span className="text-xs block font-bold text-amber-300 group-hover:text-amber-200">🚕 كابتن آدم</span>
                    <span className="text-[9px] text-slate-400 font-mono">khalil / 123</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin')}
                    className="bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 p-2.5 rounded-xl text-center transition cursor-pointer group"
                  >
                    <span className="text-xs block font-bold text-rose-300 group-hover:text-rose-200">🛡️ مدير نظام</span>
                    <span className="text-[9px] text-slate-400 font-mono">ahmaidat</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB 2: UNIFIED REGISTRATION FORM ======================= */}
          {authMode === 'register' && (
            <div className="space-y-4">
              {/* Role Picker for Registration */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setRegRole('passenger')}
                  className={`py-2 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    regRole === 'passenger'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>تسجيل راكب 👤</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('driver')}
                  className={`py-2 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    regRole === 'driver'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>تسجيل كابتن 🚕</span>
                </button>
              </div>

              {/* Sub-form: Passenger Registration */}
              {regRole === 'passenger' && (
                <form onSubmit={handlePassengerReg} className="space-y-3">
                  <div className="bg-indigo-950/30 border border-indigo-500/20 p-2.5 rounded-xl text-right">
                    <span className="text-[11px] text-indigo-300 font-bold block">
                      👤 تسجيل حساب راكب جديد للاستفادة من رحلات التكسي والتشارك
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-right">
                      <label className="text-[9px] text-slate-400 font-bold block">الاسم الكامل *</label>
                      <input
                        type="text"
                        required
                        value={pFullName}
                        onChange={(e) => setPFullName(e.target.value)}
                        placeholder="مثال: أحمد حميدات"
                        className="bg-transparent text-xs text-slate-100 outline-none w-full text-right"
                      />
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-right">
                      <label className="text-[9px] text-slate-400 font-bold block">اسم المستخدم بالإنجليزية *</label>
                      <input
                        type="text"
                        required
                        value={pUsername}
                        onChange={(e) => setPUsername(e.target.value)}
                        placeholder="ahmad_2026"
                        className="bg-transparent text-xs text-slate-100 outline-none w-full font-mono text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-right">
                      <label className="text-[9px] text-slate-400 font-bold block">رقم الهاتف الخلوي *</label>
                      <input
                        type="tel"
                        required
                        value={pPhone}
                        onChange={(e) => setPPhone(e.target.value)}
                        placeholder="0791234567"
                        className="bg-transparent text-xs text-slate-100 outline-none w-full font-mono text-right"
                      />
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-right">
                      <label className="text-[9px] text-slate-400 font-bold block">كلمة المرور *</label>
                      <input
                        type="password"
                        required
                        value={pPassword}
                        onChange={(e) => setPPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-transparent text-xs text-slate-100 outline-none w-full font-mono text-right"
                      />
                    </div>
                  </div>

                  {/* Province / District Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-right">
                      <label className="text-[9px] text-slate-400 font-bold block">المحافظة</label>
                      <select
                        value={pGov}
                        onChange={(e) => {
                          setPGov(e.target.value);
                          setPDist('');
                          setPVillage('');
                        }}
                        className="bg-transparent text-xs text-slate-100 outline-none w-full text-right cursor-pointer"
                      >
                        {locationsList.map((loc, idx) => (
                          <option key={idx} value={loc.governorate} className="bg-slate-900 text-slate-100">
                            {loc.governorate}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-right">
                      <label className="text-[9px] text-slate-400 font-bold block">اللواء / الحي</label>
                      <select
                        value={pDist}
                        onChange={(e) => {
                          setPDist(e.target.value);
                          setPVillage('');
                        }}
                        className="bg-transparent text-xs text-slate-100 outline-none w-full text-right cursor-pointer"
                      >
                        {pDistricts.map((d, idx) => (
                          <option key={idx} value={d.name} className="bg-slate-900 text-slate-100">
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs py-3 rounded-2xl transition cursor-pointer shadow-lg shadow-indigo-600/20 mt-2"
                  >
                    إنشاء حساب الراكب وتأكيد الانضمام 👤🚀
                  </button>
                </form>
              )}

              {/* Sub-form: Driver Registration */}
              {regRole === 'driver' && (
                <form onSubmit={handleDriverReg} className="space-y-3">
                  <div className="bg-amber-950/30 border border-amber-500/20 p-2.5 rounded-xl text-right">
                    <span className="text-[11px] text-amber-300 font-bold block">
                      🚕 تسجيل كابتن جديد والانضمام لأسطول تكسي وقوافل آدم
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-right">
                      <label className="text-[9px] text-slate-400 font-bold block">الاسم الكامل للكابتن *</label>
                      <input
                        type="text"
                        required
                        value={dFullName}
                        onChange={(e) => setDFullName(e.target.value)}
                        placeholder="مثال: خليل سالم"
                        className="bg-transparent text-xs text-slate-100 outline-none w-full text-right"
                      />
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-right">
                      <label className="text-[9px] text-slate-400 font-bold block">اسم المستخدم بالإنجليزية *</label>
                      <input
                        type="text"
                        required
                        value={dUsername}
                        onChange={(e) => setDUsername(e.target.value)}
                        placeholder="khalil_driver"
                        className="bg-transparent text-xs text-slate-100 outline-none w-full font-mono text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-right">
                      <label className="text-[9px] text-slate-400 font-bold block">رقم الهاتف الخلوي *</label>
                      <input
                        type="tel"
                        required
                        value={dPhone}
                        onChange={(e) => setDPhone(e.target.value)}
                        placeholder="0781234567"
                        className="bg-transparent text-xs text-slate-100 outline-none w-full font-mono text-right"
                      />
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-right">
                      <label className="text-[9px] text-slate-400 font-bold block">تاريخ انتهاء رخصة القيادة *</label>
                      <input
                        type="date"
                        required
                        value={dLicenseExpiry}
                        onChange={(e) => setDLicenseExpiry(e.target.value)}
                        className="bg-transparent text-xs text-slate-100 outline-none w-full text-right cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Vehicle Information */}
                  <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl space-y-2">
                    <span className="text-[10px] text-amber-400 font-bold block text-right">
                      🚘 بيانات المركبة والترخيص:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-right">
                      <div>
                        <label className="text-[8.5px] text-slate-400 block">ماركة المركبة</label>
                        <select
                          value={dBrand}
                          onChange={(e) => {
                            setDBrand(e.target.value);
                            const brandObj = VEHICLE_BRANDS.find(b => b.name === e.target.value);
                            if (brandObj && brandObj.models[0]) {
                              setDModel(brandObj.models[0]);
                            }
                          }}
                          className="bg-slate-950 border border-slate-800 text-xs text-slate-200 p-1.5 rounded-lg w-full outline-none"
                        >
                          {VEHICLE_BRANDS.map((b, i) => (
                            <option key={i} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[8.5px] text-slate-400 block">موديل / طراز</label>
                        <select
                          value={dModel}
                          onChange={(e) => setDModel(e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-xs text-slate-200 p-1.5 rounded-lg w-full outline-none"
                        >
                          {(VEHICLE_BRANDS.find(b => b.name === dBrand)?.models || ['مخصص']).map((m, i) => (
                            <option key={i} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[8.5px] text-slate-400 block">سنة الصنع</label>
                        <input
                          type="text"
                          value={dYear}
                          onChange={(e) => setDYear(e.target.value)}
                          placeholder="2022"
                          className="bg-slate-950 border border-slate-800 text-xs text-slate-200 p-1.5 rounded-lg w-full outline-none font-mono text-center"
                        />
                      </div>

                      <div>
                        <label className="text-[8.5px] text-slate-400 block">لون المركبة</label>
                        <input
                          type="text"
                          value={dColor}
                          onChange={(e) => setDColor(e.target.value)}
                          placeholder="أبيض"
                          className="bg-slate-950 border border-slate-800 text-xs text-slate-200 p-1.5 rounded-lg w-full outline-none text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Documents Checklist & Uploads */}
                  <div className="border border-dashed border-amber-500/30 bg-slate-950/40 p-3 rounded-2xl space-y-2">
                    <span className="text-[10px] text-amber-300 font-bold block">
                      🗂️ التراخيص والمستندات الرسمية للمراجعة الإدارية:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleFileUpload(setDLicenseDoc)}
                        className="bg-slate-900 hover:bg-slate-850 border border-slate-800 p-2 rounded-xl text-center cursor-pointer transition"
                      >
                        <span className="block font-bold text-slate-300">رخصة القيادة</span>
                        <span className="text-[9px] text-amber-400">
                          {dLicenseDoc ? '✓ تم الإرفاق' : '📁 رفع صورة'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleFileUpload(setDCarLicenseDoc)}
                        className="bg-slate-900 hover:bg-slate-850 border border-slate-800 p-2 rounded-xl text-center cursor-pointer transition"
                      >
                        <span className="block font-bold text-slate-300">رخصة المركبة</span>
                        <span className="text-[9px] text-amber-400">
                          {dCarLicenseDoc ? '✓ تم الإرفاق' : '📁 رفع صورة'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3 rounded-2xl transition cursor-pointer shadow-lg shadow-amber-500/20 mt-2"
                  >
                    تقديم طلب انضمام الكابتن والتدقيق الإداري 🚕📄
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ======================= AI TRANSITION SCREEN ======================= */}
      {aiTransitioning && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1024] border border-indigo-500/50 rounded-3xl max-w-md w-full p-8 text-center shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative w-16 h-16 mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 p-0.5 animate-spin">
                <div className="w-full h-full bg-[#070b1a] rounded-2xl" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-amber-400 animate-pulse" />
              </div>
            </div>

            <div>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-bold">
                🤖 الذكاء الاصطناعي لمنظومة آدم
              </span>
              <h3 className="text-lg font-black text-white mt-2">
                جارٍ فتح خدمات {aiTransitioning.roleName}...
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {aiTransitioning.serviceName}
              </p>
            </div>

            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full animate-[pulse_1s_infinite] w-full" />
            </div>
          </div>
        </div>
      )}

      {/* ======================= REGISTRATION SUCCESS MODAL WITH INSTANT AI ACTIVATION ======================= */}
      {regResult && regResult.show && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1024] border border-indigo-500/40 rounded-3xl max-w-md w-full p-6 text-right shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-white">{regResult.title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{regResult.msg}</p>
            </div>

            {regResult.role === 'passenger' && (
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1 font-mono text-center">
                <span className="text-slate-400 text-[10px] block">بيانات الدخول لحساب الراكب:</span>
                <div className="text-indigo-300 font-bold">اسم المستخدم: {regResult.username}</div>
                {regResult.tempPassword && (
                  <div className="text-slate-400 text-[10px]">كلمة المرور: {regResult.tempPassword}</div>
                )}
              </div>
            )}

            {regResult.role === 'driver' && (
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/30 text-xs space-y-1.5 text-right">
                <span className="text-amber-400 font-bold block text-[11px]">
                  ⏳ تنبيه التدقيق الإداري:
                </span>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  تم رفع بياناتك بنجاح للوحة التحكم. سيقوم فريق إدارة آدم بمراجعة تراخيصك والموافقة على تفعيل الحساب.
                </p>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleInstantActivationAndLaunch(regResult.role, regResult.username, regResult.tempPassword, regResult.registeredId)}
                className="w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 text-slate-950 font-black py-3 rounded-2xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                <span>تفعيل الحساب فوراً بالذكاء الاصطناعي وفتح التطبيق 🚀</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRegResult(null);
                  setAuthMode('login');
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer"
              >
                الانتقال لشاشة الدخول الموحدة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= FORGOT PASSWORD MODAL ======================= */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1024] border border-indigo-500/40 rounded-3xl max-w-md w-full p-6 text-right shadow-2xl space-y-4">
            <div className="flex justify-between items-center flex-row-reverse border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 flex-row-reverse">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <span>استعادة كلمة المرور آلياً عبر SMS 📲</span>
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              أدخل رقم هاتفك المسجل وسيقوم نظام آدم بإرسال رسالة SMS تحتوي على بيانات دخولك وكلمة المرور المشفرة فوراً.
            </p>

            {forgotFeedback && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold">
                {forgotFeedback}
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-1">
              <label className="text-[9px] text-slate-400 block font-bold">رقم الهاتف الخلوي</label>
              <input
                type="tel"
                value={forgotPhone}
                onChange={(e) => setForgotPhone(e.target.value)}
                placeholder="مثال: 0791234567"
                className="bg-transparent text-xs text-slate-100 outline-none font-mono text-right"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!forgotPhone.trim()) {
                    alert('يرجى إدخال رقم الهاتف');
                    return;
                  }
                  setForgotFeedback(`تم إرسال رسالة SMS فورية إلى الرقم ${forgotPhone} تحتوي على رمز الدخول وكلمة المرور المشفرة.`);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                إرسال كلمة المرور عبر SMS 🚀
              </button>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="bg-slate-900 hover:bg-slate-800 text-slate-400 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
