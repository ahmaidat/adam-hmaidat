import React, { useState } from 'react';
import { useAppState } from '../stateEngine';
import { 
  Settings2, 
  Coins, 
  Plus, 
  Trash2, 
  Check, 
  Landmark, 
  Shuffle, 
  Smartphone, 
  History,
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  Edit,
  Eye,
  EyeOff,
  Key,
  Sparkles,
  Server,
  Zap,
  Send,
  UserCheck
} from 'lucide-react';
import { RouteFareConfig, Employee, PermissionState } from '../types';

export const MasterAdminCrud: React.FC = () => {
  const { 
    settings, 
    saveState, 
    drivers, 
    passengers, 
    requests, 
    rides, 
    messages, 
    scheduledTrips, 
    walletTransactions,
    employees = [],
    addEmployee,
    updateEmployee,
    updateEmployeePermissions,
    toggleEmployeeHide,
    toggleEmployeeStatus,
    deleteEmployee,
    t 
  } = useAppState();

  // Active Sub Tab: 'fares' | 'employees' | 'logs'
  const [activeSubTab, setActiveSubTab] = useState<'fares' | 'employees' | 'logs'>('employees');

  const [logs, setLogs] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('adam_screen_logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem('adam_screen_logs');
        setLogs(stored ? JSON.parse(stored) : []);
      } catch {
        setLogs([]);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Settings State
  const [minModel, setMinModel] = useState(settings.minCarModel || 2021);
  const [comRate, setComRate] = useState(settings.commissionRate || 1.5);
  const [passFare, setPassFare] = useState(settings.passengerFarePerSeat || 3.0);
  const [walletPhone, setWalletPhone] = useState(settings.systemWalletNumber || '0790000100');
  const [cliqPhone, setCliqPhone] = useState(settings.systemCliQPhone || '0799998888');
  const [cliqAlias, setCliqAlias] = useState(settings.systemCliQAlias || 'ADAM.CLIQ');

  // Intracity configs
  const [ratePerKm, setRatePerKm] = useState(settings.intraCityConfig?.ratePerKm ?? 0.29);
  const [ratePerMin, setRatePerMin] = useState(settings.intraCityConfig?.ratePerMin ?? 0.06);
  const [minFare, setMinFare] = useState(settings.intraCityConfig?.minFare ?? 1.50);
  const [commRatePercent, setCommRatePercent] = useState(settings.intraCityConfig?.commissionRatePercent ?? 25);
  const [multiplier, setMultiplier] = useState(settings.intraCityConfig?.activeMultiplier ?? 1.0);

  // New route fare config form
  const [fromGov, setFromGov] = useState('');
  const [fromDist, setFromDist] = useState('');
  const [toGov, setToGov] = useState('');
  const [toDist, setToDist] = useState('');
  const [routeFareVal, setRouteFareVal] = useState(3.0);
  const [routeCommVal, setRouteCommVal] = useState(1.0);

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Employee CRM Form State
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [empFullName, setEmpFullName] = useState('');
  const [empUsername, setEmpUsername] = useState('');
  const [empPassword, setEmpPassword] = useState('123456');
  const [empRoleCat, setEmpRoleCat] = useState<'Admin' | 'Moderator' | 'Support'>('Admin');
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [empRoleFilter, setEmpRoleFilter] = useState<'all' | 'Admin' | 'Moderator' | 'Support'>('all');

  // Granular Permissions Checkboxes
  const [permAllRides, setPermAllRides] = useState(true);
  const [permDrivers, setPermDrivers] = useState(true);
  const [permPassengers, setPermPassengers] = useState(true);
  const [permFinancials, setPermFinancials] = useState(false);
  const [permSettings, setPermSettings] = useState(false);
  const [permLogs, setPermLogs] = useState(false);

  const [empFeedback, setEmpFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [aiEmpPrompt, setAiEmpPrompt] = useState('');
  const [aiEmpFeedback, setAiEmpFeedback] = useState('');

  const handleUpdateAdminSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings = {
      ...settings,
      minCarModel: Number(minModel),
      commissionRate: Number(comRate),
      passengerFarePerSeat: Number(passFare),
      systemWalletNumber: walletPhone,
      systemCliQPhone: cliqPhone,
      systemCliQAlias: cliqAlias,
      intraCityConfig: {
        ratePerKm: Number(ratePerKm),
        ratePerMin: Number(ratePerMin),
        minFare: Number(minFare),
        commissionRatePercent: Number(commRatePercent),
        activeMultiplier: Number(multiplier)
      }
    };

    saveState(drivers, passengers, requests, rides, messages, updatedSettings, scheduledTrips, walletTransactions);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDeleteRoute = (routeId: string) => {
    const currentRoutes = settings.routeFares || [];
    const filtered = currentRoutes.filter(r => r.id !== routeId);
    const updatedSettings = {
      ...settings,
      routeFares: filtered
    };
    saveState(drivers, passengers, requests, rides, messages, updatedSettings, scheduledTrips, walletTransactions);
  };

  const handleAddRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromGov.trim() || !toGov.trim()) {
      alert(t('الرجاء تعبئة المحافظة لبلد الانطلاق والوصول', 'Please specify originating and destination governorates'));
      return;
    }

    const newRoute: RouteFareConfig = {
      id: 'rf_custom_' + Date.now(),
      fromGovernorate: fromGov.trim(),
      fromDistrict: fromDist.trim() || t('جميع الألوية', 'All Districts'),
      toGovernorate: toGov.trim(),
      toDistrict: toDist.trim() || t('جميع الألوية', 'All Districts'),
      passengerFare: Number(routeFareVal),
      commissionRate: Number(routeCommVal)
    };

    const currentRoutes = settings.routeFares || [];
    const updatedSettings = {
      ...settings,
      routeFares: [...currentRoutes, newRoute]
    };

    saveState(drivers, passengers, requests, rides, messages, updatedSettings, scheduledTrips, walletTransactions);
    
    // reset form
    setFromGov('');
    setFromDist('');
    setToGov('');
    setToDist('');
    setRouteFareVal(3.0);
    setRouteCommVal(1.0);
  };

  // Employee Form Submit
  const handleSaveEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empFullName.trim() || !empUsername.trim()) {
      setEmpFeedback({ success: false, msg: 'الرجاء تعبئة اسم الموظف واسم المستخدم بالكامل.' });
      return;
    }

    const permsObj = {
      pendingDrivers: permDrivers,
      activeDrivers: permDrivers,
      passengers: permPassengers,
      allRides: permAllRides,
      scheduledTrips: permAllRides,
      walletApprovals: permFinancials,
      rateManagement: permSettings,
      userFeedbacks: permPassengers,
      aiServicesStrategy: permSettings,
      aiDeveloperStudio: permLogs,
      logs: permLogs,
      auditPayments: permFinancials
    };

    if (editingEmpId) {
      updateEmployee(editingEmpId, {
        fullName: empFullName.trim(),
        username: empUsername.trim().toLowerCase(),
        password: empPassword.trim() || '123456',
        roleCategory: empRoleCat,
        permissions: permsObj
      });
      setEmpFeedback({ success: true, msg: 'تم تحديث بيانات الموظف وصلاحياته بنجاح 💫' });
      setEditingEmpId(null);
    } else {
      const res = addEmployee({
        fullName: empFullName.trim(),
        username: empUsername.trim().toLowerCase(),
        password: empPassword.trim() || '123456',
        roleCategory: empRoleCat,
        permissions: permsObj
      });
      setEmpFeedback(res);
    }

    if (!editingEmpId) {
      setEmpFullName('');
      setEmpUsername('');
      setEmpPassword('123456');
    }
    setTimeout(() => setEmpFeedback(null), 3500);
  };

  const handleEditEmployeeStart = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setEmpFullName(emp.fullName);
    setEmpUsername(emp.username);
    setEmpPassword(emp.password || '123456');
    setEmpRoleCat(emp.roleCategory || 'Admin');
    setPermAllRides(!!emp.permissions?.allRides);
    setPermDrivers(!!emp.permissions?.activeDrivers);
    setPermPassengers(!!emp.permissions?.passengers);
    setPermFinancials(!!emp.permissions?.walletApprovals);
    setPermSettings(!!emp.permissions?.rateManagement);
    setPermLogs(!!emp.permissions?.logs);
  };

  const handleCancelEdit = () => {
    setEditingEmpId(null);
    setEmpFullName('');
    setEmpUsername('');
    setEmpPassword('123456');
  };

  // AI Employee Dispatcher
  const handleAiDispatchEmployee = () => {
    if (!aiEmpPrompt.trim()) return;
    setAiEmpFeedback('🧠 جاري المعالجة بواسطة الذكاء الاصطناعي وإنشاء وتخصيص حساب الموظف...');

    setTimeout(() => {
      let roleCat: 'Admin' | 'Moderator' | 'Support' = 'Admin';
      let full = 'موظف جديد بالذكاء الاصطناعي';
      let user = 'emp_ai_' + Math.floor(Math.random() * 899 + 100);

      if (aiEmpPrompt.includes('دعم')) {
        roleCat = 'Support';
        full = 'سامي الدعم الفني';
        user = 'sami_support';
      } else if (aiEmpPrompt.includes('مالي') || aiEmpPrompt.includes('مشرف')) {
        roleCat = 'Moderator';
        full = 'خالد المشرف المالي';
        user = 'khaled_fin';
      } else if (aiEmpPrompt.includes('عمليات') || aiEmpPrompt.includes('مدير')) {
        roleCat = 'Admin';
        full = 'طارق مدير العمليات';
        user = 'tareq_ops';
      }

      addEmployee({
        fullName: full,
        username: user,
        password: '123',
        roleCategory: roleCat,
        permissions: {
          pendingDrivers: roleCat === 'Admin',
          activeDrivers: roleCat === 'Admin',
          passengers: true,
          allRides: roleCat === 'Admin' || roleCat === 'Support',
          scheduledTrips: roleCat === 'Admin',
          walletApprovals: roleCat === 'Moderator',
          rateManagement: roleCat === 'Admin',
          userFeedbacks: true,
          aiServicesStrategy: roleCat === 'Admin',
          aiDeveloperStudio: roleCat === 'Admin',
          logs: roleCat === 'Admin',
          auditPayments: roleCat === 'Moderator'
        }
      });

      setAiEmpFeedback(`✨ تم بنجاح إنشاء حساب الموظف [${full}] وتعيينه وتطبيق الصلاحيات وتحديث القائمة فورياً!`);
      setAiEmpPrompt('');
      setTimeout(() => setAiEmpFeedback(''), 4500);
    }, 1200);
  };

  // Filtered employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.fullName.toLowerCase().includes(empSearchQuery.toLowerCase()) || 
                          emp.username.toLowerCase().includes(empSearchQuery.toLowerCase());
    const matchesRole = empRoleFilter === 'all' || emp.roleCategory === empRoleFilter;
    return matchesSearch && matchesRole;
  });

  const totalAdmins = employees.filter(e => e.roleCategory === 'Admin').length;
  const totalModerators = employees.filter(e => e.roleCategory === 'Moderator').length;
  const totalSupports = employees.filter(e => e.roleCategory === 'Support').length;

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* SUB TABS HEADER */}
      <div className="bg-[#080c1d] border border-slate-800 p-2 rounded-2xl flex items-center justify-between flex-row-reverse gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-row-reverse">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-100">لوحة التحكم التنفيذية (CRM Admin Central)</h2>
            <p className="text-[10px] text-slate-400">إدارة الموظفين والصلاحيات، تسعير المسارات والضوابط، وسجلات التحكم</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
          <button
            onClick={() => setActiveSubTab('employees')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'employees' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>شاشة الموظفين والصلاحيات ({employees.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('fares')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'fares' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>تسعير المسارات والضوابط</span>
          </button>

          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'logs' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>سجل العمليات ({logs.length})</span>
          </button>
        </div>
      </div>

      {/* SUB TAB 1: EMPLOYEES MANAGEMENT SCREEN */}
      {activeSubTab === 'employees' && (
        <div className="space-y-6">
          
          {/* STATS METRICS SUMMARY */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl text-center space-y-1">
              <div className="text-[10px] font-bold text-slate-400">إجمالي كادر الموظفين</div>
              <div className="text-lg font-black text-slate-100 font-mono">{employees.length} موظف</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl text-center space-y-1">
              <div className="text-[10px] font-bold text-indigo-400">مدراء العمليات (Admin)</div>
              <div className="text-lg font-black text-indigo-300 font-mono">{totalAdmins}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl text-center space-y-1">
              <div className="text-[10px] font-bold text-amber-400">المشرفين الماليين (Moderator)</div>
              <div className="text-lg font-black text-amber-300 font-mono">{totalModerators}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl text-center space-y-1">
              <div className="text-[10px] font-bold text-rose-400">فريق الدعم الفني (Support)</div>
              <div className="text-lg font-black text-rose-300 font-mono">{totalSupports}</div>
            </div>
          </div>

          {/* ADD / EDIT EMPLOYEE FORM & LIST GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* EMPLOYEE FORM */}
            <div className="lg:col-span-5 bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 flex-row-reverse">
                <h3 className="text-xs font-black text-slate-100 flex items-center gap-2 flex-row-reverse">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <span>{editingEmpId ? 'تعديل بيانات وصلاحيات الموظف' : 'تعيين وإضافة موظف جديد'}</span>
                </h3>
                {editingEmpId && (
                  <button
                    onClick={handleCancelEdit}
                    className="text-[10px] text-rose-400 hover:underline font-bold"
                  >
                    إلغاء التعديل ✕
                  </button>
                )}
              </div>

              {empFeedback && (
                <div className={`p-2.5 rounded-lg text-xs font-bold text-center ${empFeedback.success ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
                  {empFeedback.msg}
                </div>
              )}

              <form onSubmit={handleSaveEmployeeSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10.5px] text-slate-400 font-bold mb-1">اسم الموظف الثلاثي:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: عبد الرحمن محمد الزعبي"
                    value={empFullName}
                    onChange={(e) => setEmpFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 text-right"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10.5px] text-slate-400 font-bold mb-1">اسم المستخدم:</label>
                    <input
                      type="text"
                      required
                      placeholder="abed_admin"
                      value={empUsername}
                      onChange={(e) => setEmpUsername(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 text-right font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] text-slate-400 font-bold mb-1">كلمة المرور:</label>
                    <input
                      type="text"
                      placeholder="123456"
                      value={empPassword}
                      onChange={(e) => setEmpPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 text-right font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] text-slate-400 font-bold mb-1">فئة الوظيفة والدور الإداري:</label>
                  <select
                    value={empRoleCat}
                    onChange={(e) => setEmpRoleCat(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 text-right font-bold"
                  >
                    <option value="Admin">🏢 مدير عمليات (Operations Admin)</option>
                    <option value="Moderator">💰 مشرف مالي (Financial Moderator)</option>
                    <option value="Support">🎧 دعم فني (Customer Support)</option>
                  </select>
                </div>

                {/* PERMISSION CHECKBOXES */}
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-850 space-y-2">
                  <div className="text-[10px] text-indigo-300 font-bold pb-1 border-b border-slate-800">
                    منح الصلاحيات التفصيلية للموظف:
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10.5px] text-slate-300">
                    <label className="flex items-center gap-1.5 flex-row-reverse cursor-pointer">
                      <input type="checkbox" checked={permAllRides} onChange={(e) => setPermAllRides(e.target.checked)} className="accent-indigo-500" />
                      <span>تتبع الرحلات والرادار</span>
                    </label>

                    <label className="flex items-center gap-1.5 flex-row-reverse cursor-pointer">
                      <input type="checkbox" checked={permDrivers} onChange={(e) => setPermDrivers(e.target.checked)} className="accent-indigo-500" />
                      <span>إدارة وحظر الكباتن</span>
                    </label>

                    <label className="flex items-center gap-1.5 flex-row-reverse cursor-pointer">
                      <input type="checkbox" checked={permPassengers} onChange={(e) => setPermPassengers(e.target.checked)} className="accent-indigo-500" />
                      <span>إدارة حسابات الركاب</span>
                    </label>

                    <label className="flex items-center gap-1.5 flex-row-reverse cursor-pointer">
                      <input type="checkbox" checked={permFinancials} onChange={(e) => setPermFinancials(e.target.checked)} className="accent-indigo-500" />
                      <span>شحن المحافظ والمالية</span>
                    </label>

                    <label className="flex items-center gap-1.5 flex-row-reverse cursor-pointer">
                      <input type="checkbox" checked={permSettings} onChange={(e) => setPermSettings(e.target.checked)} className="accent-indigo-500" />
                      <span>تعديل إعدادات التسعير</span>
                    </label>

                    <label className="flex items-center gap-1.5 flex-row-reverse cursor-pointer">
                      <input type="checkbox" checked={permLogs} onChange={(e) => setPermLogs(e.target.checked)} className="accent-indigo-500" />
                      <span>مراقبة الـ API والسجلات</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black p-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{editingEmpId ? 'تحديث الموظف والصلاحيات' : 'حفظ الموظف وتفعيل حسابه فوراً'}</span>
                </button>
              </form>
            </div>

            {/* EMPLOYEES TABLE AND SEARCH FILTER */}
            <div className="lg:col-span-7 bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-4">
              
              {/* SEARCH & FILTER BAR */}
              <div className="flex justify-between items-center gap-2 flex-row-reverse flex-wrap">
                <div className="relative flex-1 min-w-[180px]">
                  <input
                    type="text"
                    placeholder="بحث باسم الموظف أو اسم المستخدم..."
                    value={empSearchQuery}
                    onChange={(e) => setEmpSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg pr-8 pl-3 py-1.5 text-xs outline-none focus:border-indigo-500 text-right"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px]">
                  <button
                    onClick={() => setEmpRoleFilter('all')}
                    className={`px-2 py-1 rounded font-bold cursor-pointer ${empRoleFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    الكل
                  </button>
                  <button
                    onClick={() => setEmpRoleFilter('Admin')}
                    className={`px-2 py-1 rounded font-bold cursor-pointer ${empRoleFilter === 'Admin' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    مدير
                  </button>
                  <button
                    onClick={() => setEmpRoleFilter('Moderator')}
                    className={`px-2 py-1 rounded font-bold cursor-pointer ${empRoleFilter === 'Moderator' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}
                  >
                    مشرف
                  </button>
                  <button
                    onClick={() => setEmpRoleFilter('Support')}
                    className={`px-2 py-1 rounded font-bold cursor-pointer ${empRoleFilter === 'Support' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}
                  >
                    دعم
                  </button>
                </div>
              </div>

              {/* EMPLOYEE CARDS & TABLE */}
              <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                {filteredEmployees.map(emp => {
                  let roleBadge = 'bg-indigo-950 text-indigo-300 border-indigo-800';
                  let roleLabel = 'مدير عمليات';
                  if (emp.roleCategory === 'Moderator') {
                    roleBadge = 'bg-amber-950 text-amber-300 border-amber-800';
                    roleLabel = 'مشرف مالي';
                  } else if (emp.roleCategory === 'Support') {
                    roleBadge = 'bg-rose-950 text-rose-300 border-rose-800';
                    roleLabel = 'دعم فني';
                  }

                  const empStatus = emp.status || 'active';
                  let statusBadgeClass = 'bg-emerald-950 text-emerald-300 border-emerald-800';
                  let statusText = 'متصل / نشط 🟢';
                  if (empStatus === 'on_break') {
                    statusBadgeClass = 'bg-amber-950 text-amber-300 border-amber-800';
                    statusText = 'في استراحة ☕';
                  } else if (empStatus === 'inactive') {
                    statusBadgeClass = 'bg-slate-900 text-slate-400 border-slate-700';
                    statusText = 'غير نشط ⚪';
                  }

                  return (
                    <div key={emp.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 hover:border-slate-700 transition">
                      <div className="flex justify-between items-start flex-row-reverse gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-row-reverse flex-wrap">
                            <span className="font-bold text-xs text-slate-100">{emp.fullName}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${roleBadge}`}>
                              {roleLabel}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleEmployeeStatus(emp.id)}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold border cursor-pointer hover:opacity-80 transition ${statusBadgeClass}`}
                              title="انقر لتغيير حالة التواجد والنشاط بضغطة زر"
                            >
                              {statusText}
                            </button>
                            <span className="bg-orange-950/80 text-orange-400 text-[8px] font-mono px-1.5 py-0.5 rounded border border-orange-800/80 flex items-center gap-1">
                              <span>🔥 Firebase Synced</span>
                            </span>
                            {emp.isHidden && (
                              <span className="bg-rose-950 text-rose-400 text-[8px] px-1.5 py-0.2 rounded border border-rose-800">
                                مخفي/معطل
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-3 flex-row-reverse">
                            <span>User: @{emp.username}</span>
                            <span>Pass: {emp.password || '123'}</span>
                            {emp.phone && <span>الهاتف: {emp.phone}</span>}
                          </div>

                          {/* LAST PERFORMED TASK SUMMARY */}
                          <div className="text-[10.5px] bg-slate-900/80 p-1.5 rounded-lg border border-slate-850 text-slate-300 mt-1.5 flex items-center gap-1.5 flex-row-reverse">
                            <span className="text-amber-400 font-bold shrink-0">📋 آخر مهام الموظف:</span>
                            <span className="truncate">{emp.lastActiveTask || 'معالجة ومتابعة الطلبات التشغيلية في النظام'}</span>
                            {emp.lastActiveTime && (
                              <span className="text-[9px] text-slate-500 shrink-0 font-mono">({emp.lastActiveTime})</span>
                            )}
                          </div>
                        </div>

                        {/* ACTION BUTTONS WITH 1-CLICK PERMISSION EDIT */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleEditEmployeeStart(emp)}
                            className="px-2.5 py-1.5 bg-indigo-900/80 text-indigo-200 border border-indigo-700/80 rounded-lg hover:bg-indigo-800 transition cursor-pointer text-[10.5px] font-bold flex items-center gap-1"
                            title="تعديل الصلاحيات والبيانات بضغطة زر"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>تعديل الصلاحيات ⚡</span>
                          </button>

                          <button
                            onClick={() => toggleEmployeeHide(emp.id)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${emp.isHidden ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                            title={emp.isHidden ? 'إظهار وتفعيل' : 'إخفاء وتعطيل'}
                          >
                            {emp.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`هل أنت متأكد من حذف الموظف ${emp.fullName} نهائياً؟`)) {
                                deleteEmployee(emp.id);
                              }
                            }}
                            className="p-1.5 bg-rose-950 text-rose-400 border border-rose-800 rounded-lg hover:bg-rose-900 transition cursor-pointer"
                            title="حذف الموظف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* PERMISSION PILLS */}
                      <div className="flex flex-wrap gap-1 flex-row-reverse text-[8.5px] pt-1 border-t border-slate-900">
                        <span className={`px-1.5 py-0.5 rounded ${emp.permissions?.allRides ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
                          تتبع الرحلات
                        </span>
                        <span className={`px-1.5 py-0.5 rounded ${emp.permissions?.activeDrivers ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
                          إدارة الكباتن
                        </span>
                        <span className={`px-1.5 py-0.5 rounded ${emp.permissions?.passengers ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
                          إدارة الركاب
                        </span>
                        <span className={`px-1.5 py-0.5 rounded ${emp.permissions?.walletApprovals ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
                          الشحن والمالية
                        </span>
                        <span className={`px-1.5 py-0.5 rounded ${emp.permissions?.rateManagement ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
                          تسعير المسارات
                        </span>
                        <span className={`px-1.5 py-0.5 rounded ${emp.permissions?.auditPayments ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
                          التدقيق المحاسبي
                        </span>
                      </div>
                    </div>
                  );
                })}

                {filteredEmployees.length === 0 && (
                  <div className="p-6 text-center text-slate-500 italic text-xs bg-slate-950/60 rounded-xl border border-slate-900">
                    لا يوجد موظفون مطابقون لخيارات البحث أو التصفية الحالية.
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* AI ASSISTANT DISPATCHER */}
          <div className="bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/30 p-3.5 rounded-xl space-y-2">
            <div className="flex justify-between items-center flex-row-reverse text-xs font-black text-indigo-300">
              <span className="flex items-center gap-1.5 flex-row-reverse">
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
                <span>مساعد الذكاء الاصطناعي لاستدعاء وتعيين الموظفين (AI Employee Auto Dispatcher)</span>
              </span>
              <span className="text-[9px] bg-indigo-900/80 px-2 py-0.5 rounded text-indigo-200 border border-indigo-700">
                API GATEWAY CONNECTED: /api/v1/admin/employees
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="اكتب أمراً للذكاء الاصطناعي، مثل: قم بإنشاء حساب موظف دعم جديد باسم سامي منحه كافة صلاحيات المتابعة..."
                value={aiEmpPrompt}
                onChange={(e) => setAiEmpPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiDispatchEmployee()}
                className="flex-1 bg-slate-950/90 text-slate-200 border border-indigo-500/40 text-xs rounded-lg px-3 py-2 outline-none focus:border-amber-400 text-right"
              />
              <button
                onClick={handleAiDispatchEmployee}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إنشاء وتعيين بالذكاء الاصطناعي 🚀</span>
              </button>
            </div>

            {aiEmpFeedback && (
              <div className="text-[10.5px] font-bold text-amber-300 bg-amber-950/60 border border-amber-800/60 p-2 rounded-lg text-right">
                {aiEmpFeedback}
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUB TAB 2: FARES AND RATES CONFIGURATION */}
      {activeSubTab === 'fares' && (
        <div className="space-y-6">
          
          {/* Settings Form */}
          <form onSubmit={handleUpdateAdminSettings} className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60 justify-end">
              <h3 className="text-sm font-bold text-slate-100">{t('تعديل الرسوم والضوابط العامة للرحلات المشتركة الأردنية', 'Edit Rates & Regulations for Jordanian App pooled rides')}</h3>
              <Settings2 className="w-4 h-4 text-indigo-400" />
            </div>

            {/* Saved Status Banner */}
            {saveSuccess && (
              <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-lg p-2.5 text-xs text-emerald-400 font-bold text-center">
                {t('✓ تم حفظ وإقران كافة تعديلات لوحة التحكم والأسعار بنجاح في ذاكرة النظام!', '✓ All system rates and configurations successfully saved & live-updated!')}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">{t('سنة الصنع الأدنى للمركبات بالتطبيق (موديل):', 'Minimum Allowed Car Production Model Year:')}</label>
                <input 
                  type="number"
                  value={minModel}
                  onChange={(e) => setMinModel(e.target.value)}
                  className="w-full bg-[#05070e] text-slate-200 border border-slate-850 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-right"
                  min="2010"
                  max="2027"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">{t('تسعيرة عمولة المنصة لكل راكب / حافلة (د.أ):', 'System Commission Fee Per Seat (JD):')}</label>
                <input 
                  type="number" 
                  step="0.05"
                  value={comRate}
                  onChange={(e) => setComRate(e.target.value)}
                  className="w-full bg-[#05070e] text-slate-200 border border-slate-850 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-right"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">{t('الأجرة العامة للراكب لكل مقعد افتراضي (د.أ):', 'Standard General Fare Per Passenger Seat (JD):')}</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={passFare}
                  onChange={(e) => setPassFare(e.target.value)}
                  className="w-full bg-[#05070e] text-slate-200 border border-slate-850 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-right"
                />
              </div>
            </div>

            {/* Central Wallets Info */}
            <div className="bg-[#05070e]/80 p-3 rounded-lg border border-slate-850/60 mt-3">
              <p className="text-[10px] text-indigo-400 font-bold mb-2">💰 {t('بوابات شحن المحفظة المركزية (مدفوعات كليك ومحافظ الأردن):', 'System Central Wallet Details (CliQ & Local Wallets):')}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] text-slate-400 mb-1">{t('رقم محفظة نظام آدم المركزي لزين/أمنية:', 'Adam Central Wallet Mobile Number:')}</label>
                  <input 
                    type="text" 
                    value={walletPhone}
                    onChange={(e) => setWalletPhone(e.target.value)}
                    className="w-full bg-[#0a0f24] text-slate-200 border border-slate-800 rounded px-2.5 py-1 text-xs text-right"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 mb-1">{t('رقم هاتف CliQ لاستقبال التحويلات:', 'CliQ Phone Number for top-ups:')}</label>
                  <input 
                    type="text" 
                    value={cliqPhone}
                    onChange={(e) => setCliqPhone(e.target.value)}
                    className="w-full bg-[#0a0f24] text-slate-200 border border-slate-800 rounded px-2.5 py-1 text-xs text-right"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 mb-1">{t('اسم مستعار CliQ Alias للتحقق:', 'System CliQ Alias Name:')}</label>
                  <input 
                    type="text" 
                    value={cliqAlias}
                    onChange={(e) => setCliqAlias(e.target.value)}
                    className="w-full bg-[#0a0f24] text-slate-200 border border-slate-800 rounded px-2.5 py-1 text-xs text-right"
                  />
                </div>
              </div>
            </div>

            {/* Taxi / Intra-city parameters */}
            <div className="bg-[#05070e]/80 p-3 rounded-lg border border-slate-850/60 mt-3 space-y-3">
              <p className="text-[10px] text-amber-500 font-bold flex items-center justify-end gap-1">
                <span>🚕 {t('إعدادات تسعير تاكسي عداد وتوصيل المدينة (Intra-city Ride Fare):', 'Dynamic Taxi Meter & Intra-city Ride Pricing Parameters:')}</span>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[9px] text-slate-400 mb-1">{t('سعر العداد لكل كم (د.أ):', 'Rate Per Kilometer (JD):')}</label>
                  <input 
                    type="number" step="0.01" value={ratePerKm} onChange={(e) => setRatePerKm(e.target.value)}
                    className="w-full bg-[#0a0f24] text-slate-200 border border-slate-850 rounded px-2 py-1 text-xs text-center"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 mb-1">{t('سعر دقيقة الانتظار (د.أ):', 'Rate Per Minute (JD):')}</label>
                  <input 
                    type="number" step="0.01" value={ratePerMin} onChange={(e) => setRatePerMin(e.target.value)}
                    className="w-full bg-[#0a0f24] text-slate-200 border border-slate-850 rounded px-2 py-1 text-xs text-center"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 mb-1">{t('أدنى قيمة لفتحة العداد (د.أ):', 'Minimum Fare Limit (JD):')}</label>
                  <input 
                    type="number" step="0.05" value={minFare} onChange={(e) => setMinFare(e.target.value)}
                    className="w-full bg-[#0a0f24] text-slate-200 border border-slate-850 rounded px-2 py-1 text-xs text-center"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 mb-1">{t('نسبة عمولة المنصة %:', 'Company Commission %:')}</label>
                  <input 
                    type="number" value={commRatePercent} onChange={(e) => setCommRatePercent(e.target.value)}
                    className="w-full bg-[#0a0f24] text-slate-200 border border-slate-850 rounded px-2 py-1 text-xs text-center"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[9px] text-slate-400 mb-1">{t('مضاعف الحوافز والذروة:', 'Demand Multiplier:')}</label>
                  <input 
                    type="number" step="0.1" value={multiplier} onChange={(e) => setMultiplier(e.target.value)}
                    className="w-full bg-[#0a0f24] text-slate-200 border border-slate-850 rounded px-2 py-1 text-xs text-center"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-start">
              <button 
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t('حفظ الرسوم والتحديث الفوري', 'Save Administrative Rates & Settings')}</span>
              </button>
            </div>
          </form>

          {/* Governorate Routes rates CRUD */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60 justify-end">
              <span className="text-xs font-bold text-slate-100">{t('تسعيرة مسارات المحافظات المخصصة والألوية الإقليمية', 'Governorate Routes & Custom Regional Tariffs')}</span>
              <Landmark className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* New Route Form */}
              <form onSubmit={handleAddRoute} className="lg:col-span-1 bg-[#05070e]/60 p-3 rounded-lg border border-slate-850 space-y-3">
                <h4 className="text-[11px] text-indigo-300 font-bold">{t('📂 إنشاء تعرفة مسار محافظة جديد:', 'Create Custom Governorate Route:')}</h4>
                
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[9px] text-slate-400 mb-1">{t('من محافظة المبدأ (مثال: عمان):', 'From Governorate:')}</label>
                    <input 
                      type="text" required placeholder="عمان (Amman)" value={fromGov} onChange={(e) => setFromGov(e.target.value)}
                      className="w-full bg-[#0a0f24] border border-slate-800 rounded p-1.5 text-[11px] text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 mb-1">{t('لواء البدء الاختياري (مثال: الجامعة):', 'From District Name:')}</label>
                    <input 
                      type="text" placeholder="الجامعة" value={fromDist} onChange={(e) => setFromDist(e.target.value)}
                      className="w-full bg-[#0a0f24] border border-slate-800 rounded p-1.5 text-[11px] text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 mb-1">{t('إلى محافظة جهة الوصول (مثال: العقبة):', 'To Destination Governorate:')}</label>
                    <input 
                      type="text" required placeholder="العقبة (Aqaba)" value={toGov} onChange={(e) => setToGov(e.target.value)}
                      className="w-full bg-[#0a0f24] border border-slate-800 rounded p-1.5 text-[11px] text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 mb-1">{t('لواء نهاية المسار المخصص:', 'To District Name:')}</label>
                    <input 
                      type="text" placeholder="العقبة" value={toDist} onChange={(e) => setToDist(e.target.value)}
                      className="w-full bg-[#0a0f24] border border-slate-800 rounded p-1.5 text-[11px] text-right"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-400 mb-1">{t('أجرة المقعد (د.أ):', 'Seat Price (JD):')}</label>
                      <input 
                        type="number" step="0.25" placeholder="Fare" value={routeFareVal} onChange={(e) => setRouteFareVal(Number(e.target.value))}
                        className="w-full bg-[#0a0f24] border border-slate-800 rounded p-1 text-[11px] text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 mb-1">{t('عمولة المقعد:', 'Fee commission:')}</label>
                      <input 
                        type="number" step="0.25" placeholder="Fees" value={routeCommVal} onChange={(e) => setRouteCommVal(Number(e.target.value))}
                        className="w-full bg-[#0a0f24] border border-slate-800 rounded p-1 text-[11px] text-center"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold p-1.5 pb-2 rounded text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('إدراج تسعيرة مسار جديد', 'Insert Inter-city Route')}</span>
                </button>
              </form>

              {/* Existing Routes table */}
              <div className="lg:col-span-2 overflow-x-auto">
                <table className="w-full text-xs text-right whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-955 text-slate-400 border-b border-slate-800">
                      <th className="p-2 font-bold">{t('مسار السفر', 'Travel Route')}</th>
                      <th className="p-2 font-bold text-center">{t('الأجرة / المقعد', 'Fare per seat')}</th>
                      <th className="p-2 font-bold text-center">{t('عمولة آدم', 'System Comm')}</th>
                      <th className="p-2 font-bold text-left">{t('إجراءات', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {(settings.routeFares || []).map((route) => (
                      <tr key={route.id} className="hover:bg-slate-900/30">
                        <td className="p-2">
                          <div className="font-bold text-slate-200">
                            {route.fromGovernorate} 
                            {route.fromDistrict ? ` (${route.fromDistrict})` : ''} 
                            <span className="text-amber-500 mx-1">➔</span> 
                            {route.toGovernorate} 
                            {route.toDistrict ? ` (${route.toDistrict})` : ''}
                          </div>
                        </td>
                        <td className="p-2 text-center text-emerald-400 font-bold font-mono">{route.passengerFare.toFixed(2)} د.أ</td>
                        <td className="p-2 text-center text-indigo-300 font-mono">{route.commissionRate.toFixed(2)} د.أ</td>
                        <td className="p-2 text-left">
                          <button 
                            onClick={() => handleDeleteRoute(route.id)}
                            className="p-1 text-red-400 hover:bg-red-950/40 rounded transition cursor-pointer"
                            title={t('حذف المسار', 'Delete Route')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(settings.routeFares || []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500 italic">
                          {t('لا توجد تسعيرات مسارات مخصصة. سيتم اعتماد التسعيرة العامة للأردنية.', 'No specific route tariffs configured. Relying on default flat rates across regions.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 3: AUDIT LOGS */}
      {activeSubTab === 'logs' && (
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 flex-row-reverse">
            <div className="flex items-center gap-2 justify-end flex-row-reverse">
              <h3 className="text-sm font-bold text-slate-100">{t('سجل عمليات التحكم وتحديث شاشات المنصة (CRM Log)', 'App Screen Configuration & CRUD Change Logs')}</h3>
              <History className="w-4 h-4 text-indigo-400 animate-pulse" />
            </div>
            
            {logs.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm(t('هل أنت متأكد من مسح كافة سجلات شاشات الكنترول نهائياً؟', 'Are you sure you want to permanently clear all configuration event logs?'))) {
                    localStorage.removeItem('adam_screen_logs');
                    setLogs([]);
                  }
                }}
                className="px-2.5 py-1 rounded bg-red-955 text-red-400 hover:bg-red-900/20 border border-red-900/35 text-[10px] font-bold transition cursor-pointer"
              >
                {t('مسح السجل 🗑️', 'Clear Logs 🗑️')}
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right whitespace-normal">
              <thead>
                <tr className="bg-slate-950/20 text-slate-400 border-b border-slate-850">
                  <th className="p-2.5 font-bold text-center w-[160px]">{t('التوقيت والزمن', 'Timestamp')}</th>
                  <th className="p-2.5 font-bold text-center w-[120px]">{t('نوع الإجراء', 'Action Type')}</th>
                  <th className="p-2.5 font-bold text-right">{t('تفاصيل العملية والتحديث', 'Modification Detail')}</th>
                  <th className="p-2.5 font-bold text-center w-[100px] font-mono">{t('معرف الشاشة', 'Screen ID')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60">
                {logs.map((log) => {
                  let badgeClass = '';
                  let badgeLabel = '';
                  switch (log.action) {
                    case 'add':
                      badgeClass = 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/40';
                      badgeLabel = t('إضافة شاشة', 'Add Screen');
                      break;
                    case 'delete':
                      badgeClass = 'bg-red-950/80 text-red-400 border border-red-900/40';
                      badgeLabel = t('حذف / تعطيل', 'Hide / Disable');
                      break;
                    case 'rename':
                      badgeClass = 'bg-indigo-950/80 text-indigo-400 border border-indigo-900/40';
                      badgeLabel = t('تغيير اسم', 'Rename');
                      break;
                    case 'hide':
                      badgeClass = 'bg-slate-800/80 text-slate-350 border border-slate-750';
                      badgeLabel = t('إخفاء', 'Hide');
                      break;
                    case 'show':
                      badgeClass = 'bg-sky-950/80 text-sky-400 border border-sky-900/40';
                      badgeLabel = t('إظهار', 'Show');
                      break;
                    case 'reset':
                      badgeClass = 'bg-amber-950/80 text-amber-400 border border-amber-900/40';
                      badgeLabel = t('ضبط المصنع', 'Reset Default');
                      break;
                    default:
                      badgeClass = 'bg-slate-900 text-slate-400 border border-slate-800';
                      badgeLabel = log.action;
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-900/20 font-sans transition">
                      <td className="p-2.5 text-center text-[10px] text-slate-400 font-mono" dir="ltr">
                        {log.timestamp}
                      </td>
                      <td className="p-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-medium text-slate-200">
                        <div>{t(log.detailsAr, log.detailsEn)}</div>
                      </td>
                      <td className="p-2 text-center text-[10px] text-indigo-300 font-mono select-all">
                        {log.screenId.substring(0, 14)}
                      </td>
                    </tr>
                  );
                })}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500 italic">
                      {t('سجل شاشات المنصة نظيف ولا توجد عمليات حجب أو هندسة تخطيط حالية.', 'The configuration history log is currently empty. No screen CRUD operations have been performed yet.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
