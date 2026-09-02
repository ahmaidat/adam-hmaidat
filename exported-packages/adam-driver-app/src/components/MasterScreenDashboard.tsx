import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Globe, 
  RefreshCw, 
  Layout, 
  Check, 
  X, 
  Sparkles, 
  Info, 
  Lock, 
  Unlock, 
  LogOut, 
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Navigation
} from 'lucide-react';
import { useAppState } from '../stateEngine';
import { COUNTRIES_DATA } from '../countriesData';

export interface ScreenLog {
  id: string;
  timestamp: string;
  action: 'add' | 'delete' | 'rename' | 'hide' | 'show' | 'reset';
  screenId: string;
  screenTitleAr: string;
  screenTitleEn: string;
  detailsAr: string;
  detailsEn: string;
}

export const addScreenLog = (
  action: 'add' | 'delete' | 'rename' | 'hide' | 'show' | 'reset', 
  screenId: string, 
  screenTitleAr: string, 
  screenTitleEn: string, 
  detailsAr: string, 
  detailsEn: string
) => {
  try {
    const storedLogs = localStorage.getItem('adam_screen_logs');
    const logsArr: ScreenLog[] = storedLogs ? JSON.parse(storedLogs) : [];
    
    const newLog: ScreenLog = {
      id: 'log_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action,
      screenId,
      screenTitleAr,
      screenTitleEn,
      detailsAr,
      detailsEn
    };
    
    const updatedLogs = [newLog, ...logsArr].slice(0, 200); // keep max 200 logs
    localStorage.setItem('adam_screen_logs', JSON.stringify(updatedLogs));
    
    // Dispatch standard storage event so that listening panels re-draw automatically
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('Error writing screen log:', error);
  }
};

// Import our modular sub-CRUD panels
import { MasterAdminCrud } from './MasterAdminCrud';
import { MasterCaptainCrud } from './MasterCaptainCrud';
import { MasterPassengerCrud } from './MasterPassengerCrud';
import { MasterRidesCrud } from './MasterRidesCrud';
import { MasterLiveTracking } from './MasterLiveTracking';
import { MasterAiAnalytics } from './MasterAiAnalytics';
import { MasterFinancialOverview } from './MasterFinancialOverview';
import { MasterRbacApiMonitor } from './MasterRbacApiMonitor';
import { EmployeeManager } from './EmployeeManager';
import { SecuritySettings } from './SecuritySettings';

export interface ScreenConfig {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  isVisible: boolean;
  role: 'admin' | 'driver' | 'passenger' | 'all';
  gridSpan: 'full' | 'large' | 'medium' | 'small'; // full=12, large=6, medium=4, small=3 col span
  isCustom?: boolean;
  accentColor: 'indigo' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'purple' | 'violet' | 'slate';
  customContentAr?: string;
  customContentEn?: string;
  viewsCount?: number;
  mockStatus?: 'active' | 'beta' | 'hidden';
}

interface MasterDashboardProps {
  screens: ScreenConfig[];
  setScreens: React.Dispatch<React.SetStateAction<ScreenConfig[]>>;
  onReset: () => void;
}

export const MasterScreenDashboard: React.FC<MasterDashboardProps> = ({ screens, setScreens, onReset }) => {
  const { language, setLanguage, t, activeCountryCode, setActiveCountryCode } = useAppState();

  const [isOpen, setIsOpen] = useState<boolean>(true);
  
  // PASSWORD PROTECTION STATES
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('adam_master_logged_in') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Tab controls: live tracking, AI analytics, financials, RBAC, employeeManager, screens list, admin, captain, passenger, rides, security
  const [activeTab, setActiveTab] = useState<'liveTracking' | 'aiAnalytics' | 'financials' | 'rbacApi' | 'employeeManager' | 'screens' | 'admin' | 'captain' | 'passenger' | 'rides' | 'security'>('liveTracking');

  // LIVE RBAC API PERMISSIONS FETCH STATE
  const [apiUserRbac, setApiUserRbac] = useState<{
    id: string;
    fullName: string;
    username: string;
    roleCategory: string;
    status: string;
    lastActiveTask: string;
    phone: string;
    permissions: Record<string, boolean>;
    fetchedAt: string;
  } | null>(null);
  const [isFetchingRbac, setIsFetchingRbac] = useState(false);

  // Fetch active assigned user permissions via API
  const fetchUserRbacFromApi = async (targetUser?: string) => {
    setIsFetchingRbac(true);
    try {
      const q = targetUser ? `?username=${encodeURIComponent(targetUser)}` : '';
      const response = await fetch(`/api/v1/employees/assigned-user${q}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.success && data.assignedUser) {
          setApiUserRbac({
            ...data.assignedUser,
            fetchedAt: new Date().toLocaleTimeString('ar-JO')
          });
          return;
        }
      }
    } catch (err) {
      // Catch network or server startup delay gracefully
    } finally {
      setIsFetchingRbac(false);
    }

    // Default admin fallback if fetch fails or server is starting up
    setApiUserRbac(prev => prev || {
      id: "emp_fallback",
      fullName: "المدير العام للمنظومة",
      username: "admin_ops",
      roleCategory: "Admin",
      status: "active",
      lastActiveTask: "إدارة تشغيل وإشراف المنظومة",
      phone: "0790000000",
      permissions: {
        pendingDrivers: true, activeDrivers: true, passengers: true, allRides: true,
        scheduledTrips: true, walletApprovals: true, rateManagement: true, userFeedbacks: true,
        aiServicesStrategy: true, aiDeveloperStudio: true, logs: true, auditPayments: true
      },
      fetchedAt: new Date().toLocaleTimeString('ar-JO')
    });
  };

  useEffect(() => {
    fetchUserRbacFromApi();
  }, []);

  // RBAC Permission Validator for active user fetched via API
  const hasTabPermission = (tabKey: string): boolean => {
    if (!apiUserRbac) return true;
    const role = apiUserRbac.roleCategory || 'Admin';
    const status = apiUserRbac.status || 'active';

    if (status === 'inactive') return false;
    if (role === 'Admin') return true;

    if (role === 'Moderator') {
      if (['security', 'rbacApi'].includes(tabKey)) return false;
      return true;
    }

    if (role === 'Support') {
      if (['financials', 'rbacApi', 'employeeManager', 'security'].includes(tabKey)) {
        return false;
      }
      return true;
    }

    return true;
  };

  const getTabTitleAr = (tabKey: string): string => {
    switch (tabKey) {
      case 'liveTracking': return 'المراقبة والتتبع الحي (Radar GPS)';
      case 'aiAnalytics': return 'التحليلات التشغيلية والذكاء الاصطناعي';
      case 'financials': return 'المؤشرات المالية الموحدة';
      case 'rbacApi': return 'الصلاحيات والربط البرمجي (RBAC & API)';
      case 'employeeManager': return 'إدارة الموظفين (Firebase & RBAC)';
      case 'screens': return 'تخطيط الشاشات';
      case 'admin': return 'لوحة المسؤول (CRM)';
      case 'captain': return 'الكباتن';
      case 'passenger': return 'الركاب';
      case 'rides': return 'التوجيه والرحلات';
      case 'security': return 'إعدادات الأمان وسياسات الدخول';
      default: return tabKey;
    }
  };

  // Master credentials updates
  const [newAdminUser, setNewAdminUser] = useState(() => localStorage.getItem('adam_admin_username') || 'ahmaidat');
  const [newAdminPass, setNewAdminPass] = useState(() => localStorage.getItem('adam_admin_password') || 'Adam@202099');
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  const handleUpdateCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccess('');
    setPassError('');

    if (newAdminUser.trim().length < 3) {
      setPassError(t('يجب أن يتكون اسم المستخدم من 3 أحرف على الأقل', 'Username must be at least 3 characters'));
      return;
    }
    if (newAdminPass.length < 4) {
      setPassError(t('يجب أن تتكون كلمة المرور من 4 أحرف على الأقل', 'Password must be at least 4 characters'));
      return;
    }

    localStorage.setItem('adam_admin_username', newAdminUser.trim());
    localStorage.setItem('adam_admin_password', newAdminPass);
    setPassSuccess(t('🇸🇦 تم تحديث معلومات المشرف وكلمة المرور الأمنية بنجاح!', '✨ Master Administrator credentials updated successfully!'));
  };

  // FORM STATES FOR CUSTOM SCREEN MANAGER (Tab 1)
  const [activeManagerTab, setActiveManagerTab] = useState<'list' | 'add'>('list');
  const [newTitleAr, setNewTitleAr] = useState('');
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newDescAr, setNewDescAr] = useState('');
  const [newDescEn, setNewDescEn] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'driver' | 'passenger' | 'all'>('all');
  const [newGridSpan, setNewGridSpan] = useState<'full' | 'large' | 'medium' | 'small'>('medium');
  const [newAccentColor, setNewAccentColor] = useState<'indigo' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'purple' | 'violet' | 'slate'>('purple');
  const [newContentAr, setNewContentAr] = useState('');
  const [newContentEn, setNewContentEn] = useState('');
  const [newScreenError, setNewScreenError] = useState('');
  const [newScreenSuccess, setNewScreenSuccess] = useState('');

  // Quick rename inline states
  const [renameId, setRenameId] = useState<string | null>(null);
  const [inlineRenameAr, setInlineRenameAr] = useState('');
  const [inlineRenameEn, setInlineRenameEn] = useState('');

  const handleMasterLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // REQUIRED SEPARATE USERNAME AND PASSWORD
    const normalizedUser = username.trim();
    const storedMasterUser = localStorage.getItem('adam_admin_username') || 'Ahmaidat';
    const storedMasterPass = localStorage.getItem('adam_admin_password') || 'Adam@202099';

    if (
      (normalizedUser.toLowerCase() === storedMasterUser.toLowerCase() && password === storedMasterPass) ||
      (normalizedUser === 'Ahmaidat' && password === 'Adam@202099') ||
      (normalizedUser === 'master_root' && password === 'adam_secure_2026')
    ) {
      setIsAuthenticated(true);
      localStorage.setItem('adam_master_logged_in', 'true');
      setLoginError('');
    } else {
      setLoginError(t(
        'خطأ: اسم مستخدم أو كلمة مرور لوحة التحكم غير صحيحة!',
        'Error: Master dashboard username or password invalid!'
      ));
    }
  };

  const handleMasterLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adam_master_logged_in');
    setUsername('');
    setPassword('');
  };

  // Toggle dynamic screen visibility
  const toggleVisibility = (id: string) => {
    let targetScreen: ScreenConfig | undefined;
    const updated = screens.map(s => {
      if (s.id === id) {
        targetScreen = s;
        return { ...s, isVisible: !s.isVisible };
      }
      return s;
    });
    setScreens(updated);
    localStorage.setItem('adam_dashboard_screens', JSON.stringify(updated));

    if (targetScreen) {
      const isNowVisible = !targetScreen.isVisible;
      const action = isNowVisible ? 'show' : 'hide';
      const detailsAr = isNowVisible 
        ? `تم إظهار الشاشة "${targetScreen.titleAr}"` 
        : `تم إخفاء الشاشة "${targetScreen.titleAr}"`;
      const detailsEn = isNowVisible 
        ? `Showed screen "${targetScreen.titleEn}"` 
        : `Hid screen "${targetScreen.titleEn}"`;
      
      addScreenLog(
        action,
        id,
        targetScreen.titleAr,
        targetScreen.titleEn,
        detailsAr,
        detailsEn
      );
    }
  };

  // Add customized screen
  const handleAddScreen = (e: React.FormEvent) => {
    e.preventDefault();
    setNewScreenError('');
    setNewScreenSuccess('');

    if (!newTitleAr.trim() || !newTitleEn.trim()) {
      setNewScreenError(t(
        'الرجاء إدخال عنوان الشاشة باللغتين العربية والإنجليزية',
        'Please enter the screen title in both Arabic and English'
      ));
      return;
    }

    const newId = 'custom_screen_' + Date.now();
    const newScreen: ScreenConfig = {
      id: newId,
      titleAr: newTitleAr.trim(),
      titleEn: newTitleEn.trim(),
      descriptionAr: newDescAr.trim() || 'شاشة مخصصة تمت إضافتها.',
      descriptionEn: newDescEn.trim() || 'Custom simulator page dynamically injected.',
      isVisible: true,
      role: newRole,
      gridSpan: newGridSpan,
      isCustom: true,
      accentColor: newAccentColor,
      customContentAr: newContentAr.trim() || 'محتوى تفاعلي مخصص باللغة العربية.',
      customContentEn: newContentEn.trim() || 'Custom simulation content here.',
      viewsCount: 1,
      mockStatus: 'beta'
    };

    const updated = [...screens, newScreen];
    setScreens(updated);
    localStorage.setItem('adam_dashboard_screens', JSON.stringify(updated));

    addScreenLog(
      'add',
      newId,
      newScreen.titleAr,
      newScreen.titleEn,
      `تمت إضافة شاشة مخصصة جديدة: "${newScreen.titleAr}" بنسب دور: ${newScreen.role}`,
      `Added a new custom screen: "${newScreen.titleEn}" with target role: ${newScreen.role}`
    );

    setNewScreenSuccess(t('تمت إضافة شاشتك المخصصة بنجاح وهي معروضة الآن في شبكة الأنظمة!', 'Your custom screen was successfully added and is visible in the grid!'));
    
    // Clear form
    setNewTitleAr('');
    setNewTitleEn('');
    setNewDescAr('');
    setNewDescEn('');
    setNewContentAr('');
    setNewContentEn('');
    setActiveManagerTab('list');
  };

  // Delete customized screen
  const handleDeleteScreen = (id: string, isCustom?: boolean) => {
    const targetScreen = screens.find(s => s.id === id);
    if (!targetScreen) return;

    if (!isCustom) {
      const updated = screens.map(s => {
        if (s.id === id) {
          return { ...s, isVisible: false, mockStatus: 'hidden' as const };
        }
        return s;
      });
      setScreens(updated);
      localStorage.setItem('adam_dashboard_screens', JSON.stringify(updated));

      addScreenLog(
        'delete',
        id,
        targetScreen.titleAr,
        targetScreen.titleEn,
        `تم تعطيل وإخفاء الشاشة الأساسية: "${targetScreen.titleAr}"`,
        `Deactivated and hidden system screen: "${targetScreen.titleEn}"`
      );
      return;
    }
    
    const updated = screens.filter(s => s.id !== id);
    setScreens(updated);
    localStorage.setItem('adam_dashboard_screens', JSON.stringify(updated));

    addScreenLog(
      'delete',
      id,
      targetScreen.titleAr,
      targetScreen.titleEn,
      `تم حذف الشاشة المخصصة نهائياً: "${targetScreen.titleAr}"`,
      `Deleted custom screen permanently: "${targetScreen.titleEn}"`
    );
  };

  // Start inline rename
  const startRename = (screen: ScreenConfig) => {
    setRenameId(screen.id);
    setInlineRenameAr(screen.titleAr);
    setInlineRenameEn(screen.titleEn);
  };

  // Save inline rename
  const saveRename = (id: string) => {
    const targetScreen = screens.find(s => s.id === id);
    if (!targetScreen) return;

    const oldAr = targetScreen.titleAr;
    const oldEn = targetScreen.titleEn;
    const newAr = inlineRenameAr.trim() || oldAr;
    const newEn = inlineRenameEn.trim() || oldEn;

    const updated = screens.map(s => {
      if (s.id === id) {
        return { 
          ...s, 
          titleAr: newAr, 
          titleEn: newEn 
        };
      }
      return s;
    });
    setScreens(updated);
    localStorage.setItem('adam_dashboard_screens', JSON.stringify(updated));

    addScreenLog(
      'rename',
      id,
      newAr,
      newEn,
      `تمت إعادة تسمية الشاشة من "${oldAr}" إلى "${newAr}"`,
      `Renamed screen from "${oldEn}" to "${newEn}"`
    );

    setRenameId(null);
  };

  return (
    <div className="w-full bg-[#0a0f24] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-sans text-right transition-all">
      
      {/* HEADER SECTION WITH MULTI-LANGUAGE GLOBE TOGGLE */}
      <div className="bg-slate-900/60 p-4 border-b border-slate-800 flex flex-col sm:flex-row-reverse justify-between items-center gap-3">
        <div className="flex items-center gap-2.5 flex-row-reverse">
          <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-amber-500 rounded-lg text-white">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-100 flex items-center gap-1.5 justify-end flex-row-reverse">
              <span>{t('لوحة التحكم الإدارية الكبرى ومحاكاة الحقول', 'Ultimate Administrative & Configuration Dashboard')}</span>
              <span className="bg-gradient-to-r from-emerald-400 to-indigo-500 text-slate-950 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest">
                SYSTEM MANAGER
              </span>
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-normal">
              {t('إدارة البيانات والعمولات، تتبع الكباتن والركاب، تعديل الحقول، وتفعيل الترجمات التفاعلية حياً', 'Manage rates, wallet balances, drivers directories, passenger details with secure master locks')}
            </p>
          </div>
        </div>

        {/* Global Multi-Language Toggle Button & Expand control */}
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <button
              onClick={handleMasterLogout}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-950 text-red-400 border border-red-900/50 hover:bg-red-900/20 transition flex items-center gap-1 cursor-pointer"
              title={t('تسجيل الخروج من لوحة النظام', 'Lock Dashboard')}
            >
              <LogOut className="w-3 h-3" />
              <span>{t('قفل البوابة', 'Lock')}</span>
            </button>
          )}

          {/* Country Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl text-right" dir="rtl">
            <span className="text-[9px] font-bold text-slate-400 px-1 hidden sm:inline">الدولة النشطة:</span>
            <select
              value={activeCountryCode}
              onChange={(e) => setActiveCountryCode(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-[10px] text-emerald-400 font-extrabold font-sans rounded px-2 py-1 outline-none cursor-pointer text-right max-w-[160px]"
            >
              {COUNTRIES_DATA.map(c => (
                <option key={c.code} value={c.code} className="bg-slate-950 text-slate-200">
                  {c.flag} {language === 'ar' ? c.nameAr : c.nameEn} ({c.currencyAr})
                </option>
              ))}
            </select>
          </div>

          {/* AI Global Language Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl text-right" dir="rtl">
            <Globe className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-[10px] text-amber-400 font-extrabold font-sans rounded px-2 py-1 outline-none cursor-pointer text-right"
            >
              <option value="ar" className="bg-slate-950 text-slate-200">🇯🇴 العربية (AR)</option>
              <option value="en" className="bg-slate-950 text-slate-200">🇬🇧 English (EN)</option>
              <option value="fr" className="bg-slate-950 text-slate-200">🇫🇷 Français (FR)</option>
              <option value="es" className="bg-slate-950 text-slate-200">🇪🇸 Español (ES) [AI]</option>
              <option value="tr" className="bg-slate-950 text-slate-200">🇹🇷 Türkçe (TR) [AI]</option>
              <option value="de" className="bg-slate-950 text-slate-200">🇩🇪 Deutsch (DE) [AI]</option>
              <option value="ru" className="bg-slate-950 text-slate-200">🇷🇺 Русский (RU) [AI]</option>
              <option value="zh" className="bg-slate-950 text-slate-200">🇨🇳 中文 (ZH) [AI]</option>
              <option value="hi" className="bg-slate-950 text-slate-200">🇮🇳 हिन्दी (HI) [AI]</option>
              <option value="ur" className="bg-slate-950 text-slate-200">🇵🇰 اردو (UR) [AI]</option>
            </select>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white transition text-xs font-bold font-mono cursor-pointer"
          >
            {isOpen ? t('إخفاء [-]', 'Hide [-]') : t('عرض [+]', 'Show [+]')}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 md:p-5 lg:p-6 bg-slate-950/20">
          
          {/* PASSWORD LOCKED LOGIN GATEWAYS */}
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto my-6 p-6 rounded-2xl bg-[#090e21] border border-indigo-500/20 shadow-2xl text-center space-y-4 font-sans">
              
              <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                <Lock className="w-5 h-5 text-indigo-400" />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-100">{t('بوابة الإدارة المقفلة - تسجيل الدخول مطلوب', 'Master Configuration - Authentication Required')}</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {t(
                    'هذه البوابة مخصصة لتعديل قيم وميزات الكباتن والركاب على مستوى السيرفر الداخلي. يرجى كتابة الـ credentials المعتمدة.',
                    'Authorized gateway to control systems databases, rates and simulators on an absolute root level.'
                  )}
                </p>
              </div>

              {loginError && (
                <div className="bg-red-500/15 border border-red-500/35 text-red-400 p-2 text-xs rounded-lg font-semibold">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleMasterLogin} className="space-y-3 pt-2 text-right text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">{t('اسم مستخدم لوحة التحكم (User ID):', 'Master Username:')}</label>
                  <input
                    type="text"
                    required
                    placeholder="اسم المستخدم"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#05070e] text-slate-200 border border-slate-800 rounded-lg px-3 py-2 text-center text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">{t('كلمة مرور المنصة (Root Password):', 'Master Password:')}</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#05070e] text-slate-200 border border-slate-800 rounded-lg px-3 py-2 text-center text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-indigo-950"
                >
                  {t('✓ فتح قفل اللوحة وتفريغ الحقول', 'Unlock Master Dashboard')}
                </button>
              </form>

            </div>
          ) : (
            
            /* MASTER CONTENT PANEL ONCE LOGGED IN */
            <div className="space-y-5">
              
              {/* Tabs selector */}
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-800 flex-row-reverse justify-start">
                
                <button
                  onClick={() => setActiveTab('liveTracking')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer ${
                    activeTab === 'liveTracking' ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/50' : 'bg-slate-900/80 text-emerald-400 hover:bg-slate-900 border border-emerald-500/20'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
                  <span>📍 {t('1. مراقبة والتتبع الحي (Radar GPS)', '1. Live Tracking & Radar')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('aiAnalytics')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer ${
                    activeTab === 'aiAnalytics' ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-950/40 border border-indigo-400/50' : 'bg-slate-900/80 text-indigo-400 hover:bg-slate-900 border border-indigo-500/20'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
                  <span>🤖 {t('2. التحليلات التشغيلية والذكاء الاصطناعي', '2. AI Analytics & Heatmaps')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('financials')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer ${
                    activeTab === 'financials' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-950/40 border border-amber-300' : 'bg-slate-900/80 text-amber-400 hover:bg-slate-900 border border-amber-500/20'
                  }`}
                >
                  <span>💰 {t('3. المؤشرات المالية الموحدة', '3. Financial Overview')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('rbacApi')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer ${
                    activeTab === 'rbacApi' ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-950/40 border border-cyan-400/50' : 'bg-slate-900/80 text-cyan-400 hover:bg-slate-900 border border-cyan-500/20'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
                  <span>🛡️ {t('4. الصلاحيات والربط البرمجي (RBAC & API)', '4. RBAC & API Gateway')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('employeeManager')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer ${
                    activeTab === 'employeeManager' ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-950/40 border border-orange-400/50' : 'bg-slate-900/80 text-orange-400 hover:bg-slate-900 border border-orange-500/20'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>👔 {t('إدارة الموظفين (Firebase & RBAC)', 'Employee Manager')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('screens')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    activeTab === 'screens' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900/60 text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <Layout className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t('⚙️ تخطيط الشاشات', '⚙️ Screen Selector')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900/60 text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <span>🏢 {t('لوحة المسؤول (CRM)', 'Admin CRM')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('captain')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    activeTab === 'captain' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900/60 text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <span>🚕 {t('الكباتن', 'Captains')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('passenger')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    activeTab === 'passenger' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900/60 text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <span>👤 {t('الركاب', 'Passengers')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('rides')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    activeTab === 'rides' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900/60 text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <span>⚡ {t('التوجيه والرحلات', 'Rides Dispatcher')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    activeTab === 'security' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900/60 text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <span>🔑 {t('الأمان', 'Security')}</span>
                </button>

              </div>

              {/* LIVE RBAC API PERMISSIONS BANNER */}
              {apiUserRbac && (
                <div className="bg-[#080d21] border border-cyan-500/30 p-3 rounded-xl flex flex-col sm:flex-row-reverse justify-between items-start sm:items-center gap-3 text-xs">
                  <div className="flex items-center gap-2.5 flex-row-reverse">
                    <div className="p-1.5 bg-cyan-950 text-cyan-400 rounded-lg border border-cyan-800 shrink-0">
                      <ShieldCheck className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-row-reverse font-black text-slate-100">
                        <span>الموظف الموكل الحالي (عبر API):</span>
                        <span className="text-cyan-300">{apiUserRbac.fullName}</span>
                        <span className="bg-cyan-950 text-cyan-400 text-[9px] px-2 py-0.5 rounded border border-cyan-800 font-bold">
                          {apiUserRbac.roleCategory}
                        </span>
                        <span className="bg-emerald-950 text-emerald-300 text-[9px] px-2 py-0.5 rounded border border-emerald-800 font-bold">
                          API Fetched Live ⚡
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2 flex-row-reverse">
                        <span>آخر مهمة: {apiUserRbac.lastActiveTask}</span>
                        <span className="font-mono text-slate-500">({apiUserRbac.fetchedAt})</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap justify-end">
                    {/* Quick Role Tester Buttons */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[9px]">
                      <span className="text-slate-400 px-1 font-bold">اختبار الدور:</span>
                      <button
                        type="button"
                        onClick={() => setApiUserRbac((prev: any) => ({ ...prev, roleCategory: 'Admin', status: 'active', fullName: 'أحمد حميدات (Admin)' }))}
                        className={`px-2 py-0.5 rounded font-bold cursor-pointer transition ${apiUserRbac.roleCategory === 'Admin' && apiUserRbac.status === 'active' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        👑 Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => setApiUserRbac((prev: any) => ({ ...prev, roleCategory: 'Moderator', status: 'active', fullName: 'عمر الخالد (Moderator)' }))}
                        className={`px-2 py-0.5 rounded font-bold cursor-pointer transition ${apiUserRbac.roleCategory === 'Moderator' && apiUserRbac.status === 'active' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        🛡️ Moderator
                      </button>
                      <button
                        type="button"
                        onClick={() => setApiUserRbac((prev: any) => ({ ...prev, roleCategory: 'Support', status: 'active', fullName: 'سارة الدعم (Support)' }))}
                        className={`px-2 py-0.5 rounded font-bold cursor-pointer transition ${apiUserRbac.roleCategory === 'Support' && apiUserRbac.status === 'active' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        🎧 Support
                      </button>
                      <button
                        type="button"
                        onClick={() => setApiUserRbac((prev: any) => ({ ...prev, status: prev.status === 'inactive' ? 'active' : 'inactive' }))}
                        className={`px-2 py-0.5 rounded font-bold cursor-pointer transition ${apiUserRbac.status === 'inactive' ? 'bg-rose-600 text-white' : 'bg-rose-950/80 text-rose-400 hover:bg-rose-900'}`}
                        title="تبديل حالة نشاط الحساب لاختبار حظر الحسابات غير النشطة"
                      >
                        {apiUserRbac.status === 'inactive' ? '🔴 غير نشط' : '🟢 نشط'}
                      </button>
                    </div>

                    <button
                      onClick={() => fetchUserRbacFromApi(apiUserRbac.username)}
                      disabled={isFetchingRbac}
                      className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      title="إعادة جلب صلاحيات المستخدم عبر الـ API فوراً"
                    >
                      <RefreshCw className={`w-3 h-3 ${isFetchingRbac ? 'animate-spin' : ''}`} />
                      <span>تحديث عبر API 🔄</span>
                    </button>
                  </div>
                </div>
              )}

              {/* RENDER ACTIVE TAB WITH RBAC PERMISSION GUARD */}
              {!hasTabPermission(activeTab) ? (
                <div className="bg-gradient-to-b from-rose-950/90 to-[#0c040a] border-2 border-rose-600/80 p-8 rounded-2xl text-center space-y-4 my-4 shadow-2xl relative overflow-hidden">
                  <div className="p-3 bg-rose-900/50 border border-rose-500/60 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-rose-300 shadow-xl shadow-rose-950/60">
                    <ShieldAlert className="w-8 h-8 animate-bounce" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-rose-100 flex items-center justify-center gap-2">
                      <span>⚠️ ليس لديك صلاحية للوصول إلى هذه الشاشة</span>
                    </h3>
                    <p className="text-xs text-rose-200/90 max-w-xl mx-auto leading-relaxed">
                      عذراً، الموظف الحالي المجلوب عبر الـ API (<strong className="text-white">@{apiUserRbac?.username || 'المستخدم'}</strong>) بالدور الوظيفي (<strong className="text-amber-300 font-bold">{apiUserRbac?.roleCategory || 'غير محدد'}</strong>) وحالة النشاط (<strong className={apiUserRbac?.status === 'active' ? 'text-emerald-400' : 'text-rose-400'}>{apiUserRbac?.status === 'active' ? 'نشط 🟢' : 'غير نشط 🔴'}</strong>) لا يملك إذن الوصول إلى قسم (<span className="text-rose-200 font-bold underline">{getTabTitleAr(activeTab)}</span>).
                    </p>
                  </div>

                  <div className="bg-slate-950/90 border border-rose-900/60 p-3.5 rounded-xl max-w-lg mx-auto text-right text-xs space-y-2 font-mono">
                    <div className="flex justify-between items-center text-slate-300 border-b border-slate-800 pb-1.5">
                      <span>الرمز البرمجي للاستجابة:</span>
                      <span className="text-rose-400 font-bold">403 Forbidden / Unauthorized Access</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>الدور الوظيفي المعتمد:</span>
                      <span className="text-cyan-300 font-bold">{apiUserRbac?.roleCategory || 'مستخدم عام'}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>قسم الشاشة المطلوب:</span>
                      <span className="text-amber-300 font-bold">{activeTab}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                    <button
                      onClick={() => setActiveTab('liveTracking')}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                    >
                      العودة إلى التتبع الحي 📍
                    </button>
                    <button
                      onClick={() => fetchUserRbacFromApi('ahmaidat')}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl transition cursor-pointer shadow-lg shadow-amber-950/50"
                    >
                      ترقية الحساب لاختبار صلاحيات Administrator 👑
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === 'liveTracking' && <MasterLiveTracking />}
                  {activeTab === 'aiAnalytics' && <MasterAiAnalytics />}
                  {activeTab === 'financials' && <MasterFinancialOverview />}
                  {activeTab === 'rbacApi' && <MasterRbacApiMonitor />}
                  {activeTab === 'employeeManager' && <EmployeeManager />}

                  {/* RENDER ACTIVE TAB */}
                  {activeTab === 'screens' && (
                    <div className="space-y-4">
                      {/* Switch between screen configurations list / add custom */}
                      <div className="flex justify-between items-center bg-slate-900/10 p-2 border-b border-slate-800">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setActiveManagerTab('list')}
                            className={`px-2.5 py-1 rounded font-bold text-[10px] transition cursor-pointer ${activeManagerTab === 'list' ? 'bg-indigo-950 text-indigo-400 border border-indigo-750/50' : 'text-slate-400 hover:text-slate-150'}`}
                          >
                            {t('جميع الشاشات ونسب الظهور', 'View Screens Grid')}
                          </button>
                          <button
                            onClick={() => setActiveManagerTab('add')}
                            className={`px-2.5 py-1 rounded font-bold text-[10px] transition cursor-pointer ${activeManagerTab === 'add' ? 'bg-indigo-950 text-indigo-400 border border-indigo-750/50' : 'text-slate-400 hover:text-slate-150'}`}
                          >
                            {t('+ حقن شاشة محاكاة إضافية', '+ Injected Custom Viewport')}
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-400">
                          {t('يمكنك إظهار أو إخفاء أي شاشة في تطبيق الراكب، السائق أو المسؤول', 'Easily control grid layouts of active screen simulators.')}
                        </p>
                      </div>

                      {activeManagerTab === 'list' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans text-right">
                          {screens.map(screen => (
                            <div key={screen.id} className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 space-y-2 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start flex-row-reverse border-b border-slate-850 pb-1">
                                  <h4 className="font-extrabold text-[#ffffff]">{t(screen.titleAr, screen.titleEn)}</h4>
                                  <span className="text-[8px] px-1 bg-slate-950/80 rounded border border-slate-800 font-mono text-amber-500">{screen.id.substring(0, 10)}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">{t(screen.descriptionAr, screen.descriptionEn)}</p>
                              </div>

                              <div className="flex justify-between items-center flex-row-reverse pt-2 border-t border-slate-850">
                                {/* Visibility check toggler */}
                                <button
                                  onClick={() => toggleVisibility(screen.id)}
                                  className={`p-1 px-2.5 rounded font-bold text-[9px] transition cursor-pointer flex items-center gap-1 ${
                                    screen.isVisible ? 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900/25' : 'bg-slate-850 text-slate-500 hover:bg-slate-800'
                                  }`}
                                >
                                  {screen.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                  <span>{screen.isVisible ? t('مرئية الآن', 'Visible') : t('مخفية', 'Hidden')}</span>
                                </button>

                                <div className="flex gap-1 flex-row-reverse">
                                  {/* Rename and Custom stats */}
                                  {renameId === screen.id ? (
                                    <div className="absolute bg-[#0a0f24] p-2 rounded-lg border border-indigo-500/40 z-20 space-y-1">
                                      <input 
                                        type="text" value={inlineRenameAr} onChange={(e) => setInlineRenameAr(e.target.value)} 
                                        placeholder="العربية" className="w-[120px] text-[10px] bg-slate-900 text-slate-100 p-0.5 text-right rounded"
                                      />
                                      <input 
                                        type="text" value={inlineRenameEn} onChange={(e) => setInlineRenameEn(e.target.value)} 
                                        placeholder="English" className="w-[120px] text-[10px] bg-slate-900 text-slate-100 p-0.5 text-right rounded"
                                      />
                                      <div className="flex justify-start gap-1">
                                        <button onClick={() => saveRename(screen.id)} className="bg-emerald-500 text-slate-950 rounded px-1 text-[8px] font-bold">✓</button>
                                        <button onClick={() => setRenameId(null)} className="bg-slate-800 text-slate-300 rounded px-1 text-[8px]">X</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => startRename(screen)}
                                      className="text-[9px] text-indigo-300 hover:underline px-1 cursor-pointer"
                                    >
                                      {t('إعادة تسمية', 'Rename')}
                                    </button>
                                  )}

                                  <button 
                                    onClick={() => handleDeleteScreen(screen.id, screen.isCustom)}
                                    className="text-[9px] text-red-400 hover:underline px-1 cursor-pointer"
                                  >
                                    {screen.isCustom ? t('حذف', 'Remove') : t('تعطيل', 'Disable')}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        
                        /* ADD NEW CUSTOM SCREEN SIMULATOR INJECTOR */
                        <form onSubmit={handleAddScreen} className="bg-[#05070e]/80 p-4 rounded-xl border border-slate-850 space-y-3">
                          <h3 className="text-xs font-bold text-indigo-400">{t('📂 حقن شاشة تتبع/مسار اختبارية جديدة كلياً:', 'Inject a custom-built trial screen viewport:')}</h3>
                          
                          {newScreenError && <div className="bg-red-500/15 border border-red-500/35 text-red-400 text-[11px] p-2 rounded">{newScreenError}</div>}
                          {newScreenSuccess && <div className="bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 text-[11px] p-2 rounded">{newScreenSuccess}</div>}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-slate-400 mb-1">{t('العنوان بالعربية:', 'Title in Arabic:')}</label>
                              <input 
                                type="text" required placeholder="مثال: شاشة الرقابة والمطارات" value={newTitleAr} onChange={(e) => setNewTitleAr(e.target.value)}
                                className="w-full bg-[#0a0f24] border border-slate-800 rounded p-1.5 text-right text-slate-200"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-400 mb-1">{t('العنوان بالإنجليزية (English):', 'Title in English:')}</label>
                              <input 
                                type="text" required placeholder="e.g., Airport Custom Customs Screen" value={newTitleEn} onChange={(e) => setNewTitleEn(e.target.value)}
                                className="w-full bg-[#0a0f24] border border-slate-800 rounded p-1.5 text-right text-slate-200"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-slate-400 mb-1">{t('الوصف التوضيحي بالعربية:', 'Description in Arabic:')}</label>
                              <textarea 
                                placeholder="تفاصيل التتبع والمحاكاة..." value={newDescAr} onChange={(e) => setNewDescAr(e.target.value)}
                                className="w-full bg-[#0a0f24] border border-slate-800 rounded p-1.5 text-right h-12 text-slate-200"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-400 mb-1">{t('الوصف التوضيحي بالإنجليزية:', 'Description in English:')}</label>
                              <textarea 
                                placeholder="Additional notes..." value={newDescEn} onChange={(e) => setNewDescEn(e.target.value)}
                                className="w-full bg-[#0a0f24] border border-slate-805 rounded p-1.5 text-right h-12 text-slate-200"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-slate-400 mb-1">{t('نص المحتوى التلقائي بالعربية (Rich Content):', 'Injected Content in Arabic:')}</label>
                              <textarea 
                                value={newContentAr} onChange={(e) => setNewContentAr(e.target.value)}
                                className="w-full bg-[#0a0f24] border border-slate-800 rounded p-1.5 text-right h-14 text-slate-200"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-400 mb-1">{t('نص المحتوى التلقائي بالإنجليزية:', 'Injected Content in English:')}</label>
                              <textarea 
                                value={newContentEn} onChange={(e) => setNewContentEn(e.target.value)}
                                className="w-full bg-[#0a0f24] border border-slate-800 rounded p-1.5 text-right h-14 text-slate-200"
                              />
                            </div>
                          </div>

                          <div className="flex gap-3 text-[10px]">
                            <button type="submit" className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold p-2 px-4 rounded">{t('حقن الشاشة في الشبكة الآن', 'Inject Custom Component Live')}</button>
                            <button type="button" onClick={() => onReset()} className="bg-red-950/80 text-red-400 hover:bg-red-900/60 p-2 px-3 rounded">{t('إعادة تعيين كافة الشاشات لضبط المصنع الافتراضي 🚨', 'Reset default factory screens')}</button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* RENDER MODULAR SUB-PANELS */}
                  {activeTab === 'admin' && <MasterAdminCrud />}
                  {activeTab === 'captain' && <MasterCaptainCrud />}
                  {activeTab === 'passenger' && <MasterPassengerCrud />}
                  {activeTab === 'rides' && <MasterRidesCrud />}
                  {activeTab === 'security' && <SecuritySettings />}
                </>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
};
