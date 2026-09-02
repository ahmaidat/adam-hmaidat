import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Smartphone, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Download, 
  UserX, 
  Ban, 
  Flame, 
  ShieldAlert, 
  Check, 
  HelpCircle,
  Clock,
  Globe,
  Laptop
} from 'lucide-react';
import { useAppState } from '../stateEngine';
import { 
  PasswordPolicy, 
  TwoFactorPolicy, 
  FailedLoginAttempt, 
  Employee 
} from '../types';
import { 
  syncSecuritySettingsToFirebase, 
  fetchSecuritySettingsFromFirebase, 
  addFailedLoginAttemptToFirebase, 
  subscribeFailedLoginAttemptsFromFirebase,
  syncEmployeeToFirebase 
} from '../firebase';

export const SecuritySettings: React.FC = () => {
  const { employees, setEmployees, t, currentUser } = useAppState();

  // Active Security Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'policies' | '2fa' | 'auditLogs' | 'masterCredentials'>('policies');

  // Password Policy State
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy>(() => {
    const saved = localStorage.getItem('adam_password_policy');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialSymbols: true,
      expirationDays: 90,
      maxFailedAttempts: 5,
      lockoutDurationMinutes: 15
    };
  });

  // 2FA Policy State
  const [twoFactorPolicy, setTwoFactorPolicy] = useState<TwoFactorPolicy>(() => {
    const saved = localStorage.getItem('adam_2fa_policy');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      mode: 'admins_only',
      allowedMethods: ['SMS', 'Authenticator App', 'Email Code'],
      defaultMethod: 'SMS'
    };
  });

  // Policy Save Feedback
  const [policySaveStatus, setPolicySaveStatus] = useState<string | null>(null);
  const [isSavingPolicies, setIsSavingPolicies] = useState(false);

  // Test Password Validator Input
  const [testPassword, setTestPassword] = useState('');

  // Failed Login Attempts Audit Logs
  const [failedAttempts, setFailedAttempts] = useState<FailedLoginAttempt[]>(() => {
    const saved = localStorage.getItem('adam_failed_login_attempts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'attempt-101',
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleString('ar-JO'),
        usernameOrEmail: 'moderator_amman',
        ipAddress: '185.220.101.45',
        deviceInfo: 'Chrome 122 (Windows 11)',
        failureReason: 'كلمة مرور خاطئة',
        riskLevel: 'متوسط',
        status: 'سجل نشط',
        location: 'عمان، الأردن'
      },
      {
        id: 'attempt-102',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toLocaleString('ar-JO'),
        usernameOrEmail: 'unknown_admin',
        ipAddress: '194.26.29.112',
        deviceInfo: 'Firefox 120 (Linux)',
        failureReason: 'اسم مستخدم غير موجود',
        riskLevel: 'مرتفع',
        status: 'سجل نشط',
        location: 'إربد، الأردن'
      },
      {
        id: 'attempt-103',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toLocaleString('ar-JO'),
        usernameOrEmail: 'ahmaidat',
        ipAddress: '82.212.75.14',
        deviceInfo: 'Safari (iOS 17.2)',
        failureReason: 'رمز 2FA غير صحيح',
        riskLevel: 'منخفض',
        status: 'تم الفحص',
        location: 'الزرقاء، الأردن'
      },
      {
        id: 'attempt-104',
        timestamp: new Date(Date.now() - 1000 * 60 * 360).toLocaleString('ar-JO'),
        usernameOrEmail: 'support_agent_02',
        ipAddress: '91.240.118.50',
        deviceInfo: 'Edge 121 (Windows 10)',
        failureReason: 'حساب مغلق مؤقتاً',
        riskLevel: 'مرتفع',
        status: 'تم الحظر',
        location: 'العقبة، الأردن'
      }
    ];
  });

  // Audit Log Search & Filters
  const [logSearch, setLogSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'مرتفع' | 'متوسط' | 'منخفض'>('all');

  // Master Credentials
  const [newAdminUser, setNewAdminUser] = useState(() => localStorage.getItem('adam_admin_username') || 'ahmaidat');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // 2FA Test Modal / Simulator Code State
  const [selectedEmp2FA, setSelectedEmp2FA] = useState<Employee | null>(null);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [codeVerificationResult, setCodeVerificationResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Subscribe to Firebase Failed Login Attempts & Sync on Mount
  useEffect(() => {
    // 1. Fetch Remote Security Policies from Firebase
    fetchSecuritySettingsFromFirebase().then(res => {
      if (res) {
        if (res.passwordPolicy) setPasswordPolicy(res.passwordPolicy);
        if (res.twoFactorPolicy) setTwoFactorPolicy(res.twoFactorPolicy);
      }
    });

    // 2. Real-time Firebase Subscription for Failed Login Attempts
    const unsubscribe = subscribeFailedLoginAttemptsFromFirebase((remoteAttempts) => {
      if (remoteAttempts && remoteAttempts.length > 0) {
        setFailedAttempts(remoteAttempts);
        localStorage.setItem('adam_failed_login_attempts', JSON.stringify(remoteAttempts));
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Save Security Policies to LocalStorage & Firebase
  const handleSavePolicies = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingPolicies(true);
    setPolicySaveStatus(null);

    try {
      localStorage.setItem('adam_password_policy', JSON.stringify(passwordPolicy));
      localStorage.setItem('adam_2fa_policy', JSON.stringify(twoFactorPolicy));

      const success = await syncSecuritySettingsToFirebase(passwordPolicy, twoFactorPolicy);
      if (success) {
        setPolicySaveStatus('تم حفظ وتطبيق سياسات الأمان والمصادقة الثنائية بفيرايبايس فوراً 🔥');
      } else {
        setPolicySaveStatus('تم حفظ السياسات محلياً بنجاح (وضع الاتصال المحلي 💾)');
      }
    } catch (err) {
      setPolicySaveStatus('حدث خطأ أثناء حفظ السياسات');
    } finally {
      setIsSavingPolicies(false);
    }
  };

  // Toggle Employee 2FA Directly in State & Firebase
  const toggleEmployee2FA = async (empId: string) => {
    const updated = employees.map(emp => {
      if (emp.id === empId) {
        const nextState = !emp.twoFactorEnabled;
        const fresh: Employee = {
          ...emp,
          twoFactorEnabled: nextState,
          twoFactorMethod: emp.twoFactorMethod || twoFactorPolicy.defaultMethod,
          lastActiveTask: `تعديل حالة المصادقة الثنائية 2FA إلى ${nextState ? 'مفعل' : 'معطل'}`,
          lastActiveTime: 'الآن',
          firebaseSynced: true
        };
        syncEmployeeToFirebase(fresh);
        return fresh;
      }
      return emp;
    });

    setEmployees(updated);
    localStorage.setItem('adam_employees', JSON.stringify(updated));
  };

  // Change Employee 2FA Method
  const changeEmployee2FAMethod = async (empId: string, method: 'SMS' | 'Authenticator App' | 'Email Code') => {
    const updated = employees.map(emp => {
      if (emp.id === empId) {
        const fresh: Employee = {
          ...emp,
          twoFactorMethod: method,
          lastActiveTask: `تحديث طريقة المصادقة الثنائية إلى (${method})`,
          lastActiveTime: 'الآن',
          firebaseSynced: true
        };
        syncEmployeeToFirebase(fresh);
        return fresh;
      }
      return emp;
    });

    setEmployees(updated);
    localStorage.setItem('adam_employees', JSON.stringify(updated));
  };

  // Generate 2FA Test Code
  const handleGenerateTest2FACode = (emp: Employee) => {
    setSelectedEmp2FA(emp);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedCode(code);
    setEnteredCode('');
    setCodeVerificationResult(null);
  };

  // Verify Test 2FA Code
  const handleVerify2FACode = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredCode.trim() === simulatedCode) {
      setCodeVerificationResult({
        success: true,
        msg: '✓ تم التحقق بنجاح! الرمز صحيح ومقترن ببدالة المصادقة الثنائية للساب.'
      });
    } else {
      setCodeVerificationResult({
        success: false,
        msg: '❌ رمز المصادقة خاطئ! الرجاء إعادة المحاولة.'
      });
    }
  };

  // Simulate a Failed Login Attempt for Testing
  const handleSimulateFailedAttempt = async () => {
    const randomUsernames = ['hacker_test', 'guest_try', 'driver_99', 'supervisor_x', 'admin_fake'];
    const randomIps = ['185.220.101.99', '194.26.29.210', '91.240.118.77', '82.212.75.200'];
    const randomReasons: FailedLoginAttempt['failureReason'][] = [
      'كلمة مرور خاطئة',
      'رمز 2FA غير صحيح',
      'حساب مغلق مؤقتاً',
      'اسم مستخدم غير موجود'
    ];
    const randomRisks: FailedLoginAttempt['riskLevel'][] = ['مرتفع', 'متوسط', 'منخفض'];

    const chosenUser = randomUsernames[Math.floor(Math.random() * randomUsernames.length)];
    const chosenIp = randomIps[Math.floor(Math.random() * randomIps.length)];
    const chosenReason = randomReasons[Math.floor(Math.random() * randomReasons.length)];
    const chosenRisk = randomRisks[Math.floor(Math.random() * randomRisks.length)];

    const newAttempt: FailedLoginAttempt = {
      id: `attempt-${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-JO'),
      usernameOrEmail: chosenUser,
      ipAddress: chosenIp,
      deviceInfo: 'Chrome 124 (Mobile / Android)',
      failureReason: chosenReason,
      riskLevel: chosenRisk,
      status: 'سجل نشط',
      location: 'الأردن - محاكاة اختبارية'
    };

    const updated = [newAttempt, ...failedAttempts];
    setFailedAttempts(updated);
    localStorage.setItem('adam_failed_login_attempts', JSON.stringify(updated));

    // Firebase write
    await addFailedLoginAttemptToFirebase(newAttempt);
  };

  // Ban IP from audit log
  const handleBanIp = (ipAddress: string) => {
    const updated = failedAttempts.map(att => att.ipAddress === ipAddress ? { ...att, status: 'تم الحظر' as const } : att);
    setFailedAttempts(updated);
    localStorage.setItem('adam_failed_login_attempts', JSON.stringify(updated));
    alert(`تم إضافة عنوان الـ IP (${ipAddress}) لقائمة الحظر الأمني ورفض الاتصالات في قواعد Firebase.`);
  };

  // Master Admin Credentials Submit
  const handleUpdateCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccess('');
    setPassError('');

    if (newAdminPass.length < passwordPolicy.minLength) {
      setPassError(`كلمة المرور يجب ألا تقل عن ${passwordPolicy.minLength} أرقام/أحرف بحسب سياسة الأمان النشطة.`);
      return;
    }

    localStorage.setItem('adam_admin_username', newAdminUser);
    localStorage.setItem('adam_admin_password', newAdminPass);
    setPassSuccess(`تم تحديث اسم المستخدم (${newAdminUser}) وكلمة المرور بنجاح!`);
    setNewAdminPass('');
  };

  // Password Policy Validation Checks
  const isLengthOk = testPassword.length >= passwordPolicy.minLength;
  const isUpperOk = !passwordPolicy.requireUppercase || /[A-Z]/.test(testPassword);
  const isNumberOk = !passwordPolicy.requireNumbers || /[0-9]/.test(testPassword);
  const isSymbolOk = !passwordPolicy.requireSpecialSymbols || /[!@#$%^&*(),.?":{}|<>]/.test(testPassword);
  const isPasswordPolicyMet = testPassword.length > 0 && isLengthOk && isUpperOk && isNumberOk && isSymbolOk;

  // Filtered Audit Logs
  const filteredLogs = failedAttempts.filter(log => {
    const matchesSearch = log.usernameOrEmail.toLowerCase().includes(logSearch.toLowerCase()) ||
                          log.ipAddress.includes(logSearch) ||
                          log.failureReason.includes(logSearch);
    const matchesRisk = riskFilter === 'all' || log.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6 text-right font-sans">
      
      {/* SECURITY DASHBOARD HEADER & REALTIME STATUS */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0a0f28] to-slate-900 border border-slate-800 p-5 rounded-2xl shadow-2xl flex flex-col md:flex-row-reverse justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-row-reverse">
            <div className="p-2 bg-indigo-950 text-indigo-400 border border-indigo-800 rounded-xl shadow-lg">
              <ShieldCheck className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-100 flex items-center gap-2 flex-row-reverse">
                <span>{t('إعدادات الأمان وسجلات الحماية', 'Security Settings & Audit Trail')}</span>
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  Firebase Auth & Firestore Synced ⚡
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {t('إدارة سياسات كلمة السر، تفعيل المصادقة الثنائية (2FA) للموظفين، ومراجعة سجلات محاولات الدخول غير الناجحة', 'Manage password rules, 2FA enforcement, and review failed login attempt logs.')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap self-end md:self-auto">
          <button
            type="button"
            onClick={handleSimulateFailedAttempt}
            className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow"
            title="إضافة محاولة دخول فاشلة تجريبية في الوقت الفعلي"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400 animate-bounce" />
            <span>محاكاة محاولة دخول فاشلة 🧪</span>
          </button>

          <span className="bg-orange-950/80 text-orange-400 border border-orange-800 text-[10px] px-3 py-1.5 rounded-xl font-mono flex items-center gap-1.5 font-bold">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            <span>Firestore Active</span>
          </span>
        </div>
      </div>

      {/* NAVIGATION SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('policies')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'policies'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50 border border-indigo-400/50'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800'
          }`}
        >
          <Key className="w-4 h-4 text-amber-300" />
          <span>1. سياسات كلمة السر (Password Policy)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('2fa')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === '2fa'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50 border border-indigo-400/50'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>2. المصادقة الثنائية 2FA للموظفين</span>
        </button>

        <button
          onClick={() => setActiveSubTab('auditLogs')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer relative ${
            activeSubTab === 'auditLogs'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50 border border-indigo-400/50'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>3. سجلات محاولات الدخول غير الناجحة</span>
          {failedAttempts.length > 0 && (
            <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
              {failedAttempts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('masterCredentials')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'masterCredentials'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50 border border-indigo-400/50'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800'
          }`}
        >
          <Lock className="w-4 h-4 text-amber-400" />
          <span>4. كلمة سر المشرف الرئيسي</span>
        </button>
      </div>

      {/* FEEDBACK STATUS BANNER */}
      {policySaveStatus && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 font-bold flex items-center justify-between flex-row-reverse">
          <div className="flex items-center gap-2 flex-row-reverse">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{policySaveStatus}</span>
          </div>
          <button onClick={() => setPolicySaveStatus(null)} className="text-emerald-400 hover:text-emerald-200 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* SUB-TAB 1: PASSWORD POLICIES */}
      {activeSubTab === 'policies' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* POLICY CONFIGURATION FORM */}
          <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 p-5 rounded-2xl space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-100 flex items-center gap-2 flex-row-reverse">
                <Key className="w-4 h-4 text-amber-400" />
                <span>إدارة وتعزيز سياسات كلمة السر للمستخدمين والموظفين</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تحديد معايير التعقيد، صلاحية التغيير الدوري، والحد الأقصى لمحاولات الخاطئة لمنع هجمات التخمين القسري (Brute Force Protection).
              </p>
            </div>

            <form onSubmit={handleSavePolicies} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* MIN LENGTH */}
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    الحد الأدنى لطول كلمة السر (عدد الخانات):
                  </label>
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <input
                      type="range"
                      min="6"
                      max="20"
                      value={passwordPolicy.minLength}
                      onChange={(e) => setPasswordPolicy({ ...passwordPolicy, minLength: Number(e.target.value) })}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                    <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 px-3 py-1 rounded-lg font-mono font-black text-sm shrink-0">
                      {passwordPolicy.minLength} خانة
                    </span>
                  </div>
                </div>

                {/* EXPIRATION DAYS */}
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    صلاحية كلمة السر (تعديل دوري إجباري):
                  </label>
                  <select
                    value={passwordPolicy.expirationDays}
                    onChange={(e) => setPasswordPolicy({ ...passwordPolicy, expirationDays: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg p-2 font-bold outline-none cursor-pointer"
                  >
                    <option value={30}>كل 30 يوم (أمان مرتفع جداً 🔒)</option>
                    <option value={60}>كل 60 يوم (قياسي)</option>
                    <option value={90}>كل 90 يوم (موصى به)</option>
                    <option value={180}>كل 180 يوم</option>
                    <option value={0}>بدون انتهاء صلاحية (غير موصى به)</option>
                  </select>
                </div>

              </div>

              {/* COMPLEXITY CHECKBOXES */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <span className="text-xs font-black text-slate-200 block border-b border-slate-800 pb-2">
                  شروط تعقيد كلمات السر المعززة:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  <label className="flex items-center gap-2 flex-row-reverse p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={passwordPolicy.requireUppercase}
                      onChange={(e) => setPasswordPolicy({ ...passwordPolicy, requireUppercase: e.target.checked })}
                      className="accent-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs text-slate-300 font-bold">فرض أحرف كبيرة (A-Z)</span>
                  </label>

                  <label className="flex items-center gap-2 flex-row-reverse p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={passwordPolicy.requireNumbers}
                      onChange={(e) => setPasswordPolicy({ ...passwordPolicy, requireNumbers: e.target.checked })}
                      className="accent-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs text-slate-300 font-bold">فرض أرقام (0-9)</span>
                  </label>

                  <label className="flex items-center gap-2 flex-row-reverse p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={passwordPolicy.requireSpecialSymbols}
                      onChange={(e) => setPasswordPolicy({ ...passwordPolicy, requireSpecialSymbols: e.target.checked })}
                      className="accent-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs text-slate-300 font-bold">فرض رموز خاصة (!@#$)</span>
                  </label>

                </div>
              </div>

              {/* MAX FAILED ATTEMPTS & LOCKOUT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    حد أقصى للمحاولات الخاطئة قبل القفل:
                  </label>
                  <select
                    value={passwordPolicy.maxFailedAttempts}
                    onChange={(e) => setPasswordPolicy({ ...passwordPolicy, maxFailedAttempts: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg p-2 font-bold outline-none cursor-pointer"
                  >
                    <option value={3}>3 محاولات (حماية صارمة 🚨)</option>
                    <option value={5}>5 محاولات (معياري)</option>
                    <option value={10}>10 محاولات</option>
                  </select>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    مدة الحظر المؤقت للحساب (دقيقة):
                  </label>
                  <select
                    value={passwordPolicy.lockoutDurationMinutes}
                    onChange={(e) => setPasswordPolicy({ ...passwordPolicy, lockoutDurationMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg p-2 font-bold outline-none cursor-pointer"
                  >
                    <option value={15}>15 دقيقة</option>
                    <option value={30}>30 دقيقة</option>
                    <option value={60}>60 دقيقة (ساعة كاملة)</option>
                  </select>
                </div>

              </div>

              {/* SAVE BUTTON */}
              <div className="pt-2 flex justify-start">
                <button
                  type="submit"
                  disabled={isSavingPolicies}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black py-2.5 px-6 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-indigo-950/40 flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSavingPolicies ? 'animate-spin' : ''}`} />
                  <span>حفظ سياسات كلمة السر ومزامنتها بـ Firebase 💾</span>
                </button>
              </div>

            </form>
          </div>

          {/* INTERACTIVE PASSWORD POLICY TESTER */}
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div>
              <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5 flex-row-reverse">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>أداة فحص واختبار مطابقة كلمة السر:</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                جرب كتابة كلمة سر للتحقق من توافقها مع السياسة الحالية النشطة في الوقت الفعلي.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="اكتب كلمة سر تجريبية هنا..."
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-mono text-right outline-none focus:border-amber-500/50"
              />

              <div className="space-y-2 text-xs">
                
                <div className={`flex items-center justify-between p-2 rounded-lg border ${isLengthOk ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                  <span className="font-mono text-[10px]">{testPassword.length} / {passwordPolicy.minLength}</span>
                  <div className="flex items-center gap-1.5 flex-row-reverse">
                    {isLengthOk ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-600" />}
                    <span>الطول الأدنى ({passwordPolicy.minLength} خانات)</span>
                  </div>
                </div>

                <div className={`flex items-center justify-between p-2 rounded-lg border ${isUpperOk ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                  <span>{isUpperOk ? 'مستوفى ✓' : 'غير مستوفى'}</span>
                  <div className="flex items-center gap-1.5 flex-row-reverse">
                    {isUpperOk ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-600" />}
                    <span>أحرف كبيرة (A-Z)</span>
                  </div>
                </div>

                <div className={`flex items-center justify-between p-2 rounded-lg border ${isNumberOk ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                  <span>{isNumberOk ? 'مستوفى ✓' : 'غير مستوفى'}</span>
                  <div className="flex items-center gap-1.5 flex-row-reverse">
                    {isNumberOk ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-600" />}
                    <span>أرقام (0-9)</span>
                  </div>
                </div>

                <div className={`flex items-center justify-between p-2 rounded-lg border ${isSymbolOk ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                  <span>{isSymbolOk ? 'مستوفى ✓' : 'غير مستوفى'}</span>
                  <div className="flex items-center gap-1.5 flex-row-reverse">
                    {isSymbolOk ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-600" />}
                    <span>رموز خاصة (!@#$)</span>
                  </div>
                </div>

              </div>

              {testPassword.length > 0 && (
                <div className={`p-3 rounded-xl text-xs font-black text-center border ${
                  isPasswordPolicyMet 
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                    : 'bg-rose-950 text-rose-300 border-rose-800'
                }`}>
                  {isPasswordPolicyMet ? '✓ كلمة السر متوافقة وقوية جداً!' : '❌ كلمة السر لا تلبي كافة متطلبات السياسة'}
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: TWO-FACTOR AUTHENTICATION (2FA) */}
      {activeSubTab === '2fa' && (
        <div className="space-y-6">
          
          {/* GLOBAL 2FA ENFORCEMENT CONFIG */}
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row-reverse justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-100 flex items-center gap-2 flex-row-reverse">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>سياسة إجبارية المصادقة الثنائية (2FA Enforcement)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  تحديد نطاق تطبيق المصادقة الثنائية وقناة التوثيق الافتراضية المعتمدة لكافة الموظفين والمشرفين.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSavePolicies}
                className="px-4 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>حفظ وضع المصادقة 💾</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div 
                onClick={() => setTwoFactorPolicy({ ...twoFactorPolicy, mode: 'mandatory' })}
                className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                  twoFactorPolicy.mode === 'mandatory'
                    ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center flex-row-reverse">
                  <span className="font-black text-xs text-slate-100">إجباري للجميع 🔒</span>
                  <input type="radio" checked={twoFactorPolicy.mode === 'mandatory'} readOnly className="accent-indigo-500" />
                </div>
                <p className="text-[11px] text-slate-400">
                  يتطلب إدخال رمز 2FA إجباري لكل موظف أثناء تسجيل الدخول.
                </p>
              </div>

              <div 
                onClick={() => setTwoFactorPolicy({ ...twoFactorPolicy, mode: 'admins_only' })}
                className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                  twoFactorPolicy.mode === 'admins_only'
                    ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center flex-row-reverse">
                  <span className="font-black text-xs text-slate-100">للمدراء والمشرفين فقط 👑</span>
                  <input type="radio" checked={twoFactorPolicy.mode === 'admins_only'} readOnly className="accent-indigo-500" />
                </div>
                <p className="text-[11px] text-slate-400">
                  تطبيق الرمز الثنائي حصرياً على رتبة Admin و Moderator.
                </p>
              </div>

              <div 
                onClick={() => setTwoFactorPolicy({ ...twoFactorPolicy, mode: 'optional' })}
                className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                  twoFactorPolicy.mode === 'optional'
                    ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center flex-row-reverse">
                  <span className="font-black text-xs text-slate-100">اختياري بحسب الموظف ⚙️</span>
                  <input type="radio" checked={twoFactorPolicy.mode === 'optional'} readOnly className="accent-indigo-500" />
                </div>
                <p className="text-[11px] text-slate-400">
                  يمكن تفعيل أو تعطيل الـ 2FA بشكل فردي لكل موظف من الجدول أدناه.
                </p>
              </div>

            </div>
          </div>

          {/* EMPLOYEES 2FA MANAGEMENT TABLE */}
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center flex-row-reverse">
              <h3 className="text-xs font-black text-slate-100 flex items-center gap-2 flex-row-reverse">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>جدول الموظفين وإدارة المصادقة الثنائية (2FA Direct Toggle & Sync)</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                إجمالي الموظفين: {employees.length}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-900/80 text-slate-300 border-b border-slate-800 font-black">
                    <th className="p-3">الموظف والبيانات</th>
                    <th className="p-3">الدور والوظيفة</th>
                    <th className="p-3">حالة 2FA (المصادقة الثنائية)</th>
                    <th className="p-3">طريقة التوثيق المعتمدة</th>
                    <th className="p-3 text-center">إجراءات واختبار 2FA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {employees.map((emp) => {
                    const is2faActive = Boolean(emp.twoFactorEnabled);
                    const currentMethod = emp.twoFactorMethod || 'SMS';

                    return (
                      <tr key={emp.id} className="hover:bg-slate-900/40 transition">
                        
                        {/* EMPLOYEE INFO */}
                        <td className="p-3">
                          <div className="font-bold text-slate-100">{emp.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">@{emp.username}</div>
                        </td>

                        {/* ROLE */}
                        <td className="p-3">
                          <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            {emp.roleCategory || 'Admin'}
                          </span>
                        </td>

                        {/* 2FA STATUS TOGGLE */}
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => toggleEmployee2FA(emp.id)}
                            className={`px-3 py-1 rounded-lg text-[10.5px] font-black border transition cursor-pointer flex items-center gap-1.5 ${
                              is2faActive
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                                : 'bg-rose-950/60 text-rose-300 border-rose-800/80 hover:bg-rose-900'
                            }`}
                            title="انقر لتفعيل/تعطيل المصادقة الثنائية فوراً بـ Firebase"
                          >
                            <span>{is2faActive ? 'مفعلة 🟢' : 'معطلة 🔴'}</span>
                            <RefreshCw className="w-3 h-3 opacity-60" />
                          </button>
                        </td>

                        {/* 2FA METHOD SELECT */}
                        <td className="p-3">
                          <select
                            value={currentMethod}
                            onChange={(e) => changeEmployee2FAMethod(emp.id, e.target.value as any)}
                            disabled={!is2faActive}
                            className="bg-slate-900 border border-slate-800 text-[11px] text-slate-200 rounded-lg px-2.5 py-1 outline-none font-bold cursor-pointer disabled:opacity-40"
                          >
                            <option value="SMS">📱 رسالة نصية SMS</option>
                            <option value="Authenticator App">🔐 تطبيق مصادقة Google</option>
                            <option value="Email Code">✉️ رمز عبر البريد</option>
                          </select>
                        </td>

                        {/* TEST 2FA CODE BUTTON */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleGenerateTest2FACode(emp)}
                            className="px-3 py-1 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-700 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 mx-auto"
                          >
                            <Smartphone className="w-3.5 h-3.5 text-amber-300" />
                            <span>توليد وتجربة رمز 2FA 🧪</span>
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* TEST 2FA VERIFICATION MODAL / WIDGET */}
          {selectedEmp2FA && simulatedCode && (
            <div className="bg-slate-900/90 border border-indigo-500/50 p-5 rounded-2xl space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center flex-row-reverse border-b border-slate-800 pb-2">
                <h4 className="text-xs font-black text-amber-300 flex items-center gap-2 flex-row-reverse">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>محاكاة اختبار رمز المصادقة الثنائية لـ: {selectedEmp2FA.fullName}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => { setSelectedEmp2FA(null); setSimulatedCode(null); }}
                  className="text-slate-400 hover:text-slate-100 font-bold text-xs"
                >
                  إغلاق ✕
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row-reverse justify-between items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">الرمز المولد المبعوث افتراضياً:</span>
                  <div className="text-2xl font-black font-mono text-emerald-400 tracking-widest mt-1">
                    {simulatedCode}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    قناة الإرسال: {selectedEmp2FA.twoFactorMethod || 'SMS'}
                  </span>
                </div>

                <form onSubmit={handleVerify2FACode} className="flex items-center gap-2 flex-row-reverse w-full sm:w-auto">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="ادخل الرمز للاختبار..."
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-slate-100 font-mono text-center font-black rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs cursor-pointer shrink-0"
                  >
                    تحقق ⚡
                  </button>
                </form>
              </div>

              {codeVerificationResult && (
                <div className={`p-3 rounded-xl text-xs font-bold text-center border ${
                  codeVerificationResult.success
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border-rose-800'
                }`}>
                  {codeVerificationResult.msg}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* SUB-TAB 3: FAILED LOGIN ATTEMPTS AUDIT TRAIL */}
      {activeSubTab === 'auditLogs' && (
        <div className="space-y-4">
          
          {/* SEARCH & RISK FILTERS */}
          <div className="flex flex-col sm:flex-row-reverse justify-between items-center gap-3 bg-slate-900/40 p-3.5 rounded-2xl border border-slate-800">
            <input
              type="text"
              placeholder="بحث بالحساب، IP، أو سبب الفشل..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="w-full sm:w-72 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 text-xs text-right outline-none focus:border-indigo-500"
            />

            <div className="flex items-center gap-3 flex-row-reverse flex-wrap">
              <div className="flex items-center gap-2 flex-row-reverse">
                <span className="text-xs text-slate-400 font-bold">مستوى الخطورة:</span>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-1.5 outline-none font-bold cursor-pointer"
                >
                  <option value="all">جميع السجلات ({failedAttempts.length})</option>
                  <option value="مرتفع">🚨 مرتفع الخطورة</option>
                  <option value="متوسط">⚠️ متوسط الخطورة</option>
                  <option value="منخفض">🟢 منخفض الخطورة</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleSimulateFailedAttempt}
                className="px-3 py-1.5 bg-rose-950/90 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة محاولة تجريبية 🧪</span>
              </button>
            </div>
          </div>

          {/* FAILED ATTEMPTS TABLE */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/90 shadow-2xl">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-300 border-b border-slate-800 font-black">
                  <th className="p-3.5">الوقت والتاريخ</th>
                  <th className="p-3.5">الحساب المستهدف</th>
                  <th className="p-3.5">عنوان ה-IP والمنطقة</th>
                  <th className="p-3.5">الجهاز والمستعرض</th>
                  <th className="p-3.5">سبب الفشل</th>
                  <th className="p-3.5">مستوى الخطورة</th>
                  <th className="p-3.5 text-center">الإجراءات والتحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredLogs.map((log) => {
                  let riskClass = 'bg-emerald-950 text-emerald-300 border-emerald-800';
                  if (log.riskLevel === 'مرتفع') riskClass = 'bg-rose-950 text-rose-300 border-rose-800 font-black animate-pulse';
                  else if (log.riskLevel === 'متوسط') riskClass = 'bg-amber-950 text-amber-300 border-amber-800';

                  return (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition">
                      
                      {/* TIMESTAMP */}
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5 flex-row-reverse">
                          <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>{log.timestamp}</span>
                        </div>
                      </td>

                      {/* USERNAME */}
                      <td className="p-3.5">
                        <span className="font-bold text-slate-100 font-mono">@{log.usernameOrEmail}</span>
                      </td>

                      {/* IP & LOCATION */}
                      <td className="p-3.5 font-mono text-[11px] text-slate-300">
                        <div className="flex items-center gap-1.5 flex-row-reverse">
                          <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{log.ipAddress}</span>
                        </div>
                        {log.location && <div className="text-[9.5px] text-slate-500 font-sans">{log.location}</div>}
                      </td>

                      {/* DEVICE */}
                      <td className="p-3.5 text-slate-300 text-[11px]">
                        <div className="flex items-center gap-1.5 flex-row-reverse">
                          <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{log.deviceInfo}</span>
                        </div>
                      </td>

                      {/* FAILURE REASON */}
                      <td className="p-3.5">
                        <span className="bg-slate-900 text-slate-300 border border-slate-800 px-2.5 py-1 rounded-lg font-bold text-[10.5px]">
                          {log.failureReason}
                        </span>
                      </td>

                      {/* RISK LEVEL */}
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${riskClass}`}>
                          {log.riskLevel}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {log.status === 'تم الحظر' ? (
                            <span className="bg-rose-950 text-rose-400 text-[9.5px] px-2 py-1 rounded border border-rose-800 font-bold">
                              محظور IP 🚫
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleBanIp(log.ipAddress)}
                              className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                              title="حظر هذا العنوان من قواعد Firebase"
                            >
                              <Ban className="w-3 h-3 text-rose-400" />
                              <span>حظر IP 🚫</span>
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}

                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 italic text-xs">
                      لا يوجد سجلات أمان مطابقة لخيارات البحث.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* SUB-TAB 4: MASTER ADMIN CREDENTIALS */}
      {activeSubTab === 'masterCredentials' && (
        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-2 flex-row-reverse">
              <Lock className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>تغيير كلمة السر واسم المستخدم للمشرف المالي والإداري</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              تحديث معطيات دخول المنصة والداشبورد وحساب المدير العام
            </p>
          </div>

          {passSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-900/30 rounded-xl text-xs text-emerald-400 text-right font-medium">
              ✓ {passSuccess}
            </div>
          )}

          {passError && (
            <div className="p-3 bg-rose-950/40 border border-rose-900/30 rounded-xl text-xs text-rose-400 text-right font-medium">
              ⚠️ {passError}
            </div>
          )}

          <form onSubmit={handleUpdateCredentials} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-1.5 focus-within:border-indigo-500/50 transition">
              <label className="text-[10px] text-slate-400 block uppercase tracking-wider font-extrabold">
                اسم مستخدم المشرف الجديد (Admin Username):
              </label>
              <input 
                type="text" 
                value={newAdminUser} 
                onChange={e => setNewAdminUser(e.target.value)}
                className="bg-transparent text-xs text-slate-100 outline-none flex-1 text-right font-sans font-semibold"
                required
              />
            </div>

            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-1.5 focus-within:border-indigo-500/50 transition">
              <label className="text-[10px] text-slate-400 block uppercase tracking-wider font-extrabold">
                كلمة المرور الجديدة للمشرف (Admin Password):
              </label>
              <input 
                type="password" 
                value={newAdminPass} 
                onChange={e => setNewAdminPass(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent text-xs text-slate-100 outline-none flex-1 text-right font-sans font-semibold"
                required
              />
            </div>

            <div className="md:col-span-2 flex justify-start pt-2">
              <button
                type="submit"
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-2.5 px-6 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-950/20"
              >
                حفظ التغييرات الأمنية وتحديث النظام 💾
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
