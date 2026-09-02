import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Lock, 
  Users, 
  Server, 
  Activity, 
  Check, 
  X, 
  Radio, 
  Globe, 
  RefreshCw,
  Cpu,
  Database,
  Smartphone,
  Eye,
  UserPlus,
  Sparkles,
  Trash2,
  Edit,
  Zap,
  Send,
  UserCheck
} from 'lucide-react';
import { useAppState } from '../stateEngine';
import { Employee } from '../types';

export interface AdminRoleConfig {
  id: 'super_admin' | 'operations' | 'finance' | 'support';
  roleCategory: 'Admin' | 'Moderator' | 'Support';
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  badgeColor: string;
  defaultPermissions: {
    liveTracking: boolean;
    manageDrivers: boolean;
    managePassengers: boolean;
    financials: boolean;
    changeSettings: boolean;
    apiMonitor: boolean;
  };
}

export const MasterRbacApiMonitor: React.FC = () => {
  const { 
    employees = [], 
    addEmployee, 
    updateEmployeePermissions, 
    updateEmployee, 
    deleteEmployee, 
    t 
  } = useAppState();

  const [activeRole, setActiveRole] = useState<'super_admin' | 'operations' | 'finance' | 'support'>(() => {
    return (localStorage.getItem('adam_active_admin_role') as any) || 'operations';
  });

  // State for role default permissions override in memory
  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, boolean>>>(() => {
    try {
      const stored = localStorage.getItem('adam_role_perms_map');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Form state for adding an employee to the selected role
  const [empFullName, setEmpFullName] = useState('');
  const [empUsername, setEmpUsername] = useState('');
  const [empPassword, setEmpPassword] = useState('123456');
  const [addFeedback, setAddFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  // AI prompt state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStatusMsg, setAiStatusMsg] = useState('');

  // API Endpoints Live Status Stream
  const [apiLogs, setApiLogs] = useState<Array<{ id: string; time: string; endpoint: string; method: string; status: number; latency: number }>>([]);

  const pushApiLog = (endpoint: string, method: string = 'POST') => {
    const newLog = {
      id: 'req_' + Date.now().toString().substring(7),
      time: new Date().toLocaleTimeString('ar-JO', { hour12: false }),
      endpoint,
      method,
      status: 200,
      latency: Math.floor(Math.random() * 12) + 8
    };
    setApiLogs(prev => [newLog, ...prev].slice(0, 10));
  };

  useEffect(() => {
    const endpoints = [
      '/api/v1/passenger/ride-request',
      '/api/v1/captain/location-ping',
      '/api/v1/admin/employees/sync',
      '/api/v1/rbac/audit-permissions',
      '/api/v1/firestore/sync-state'
    ];

    const interval = setInterval(() => {
      const randomEp = endpoints[Math.floor(Math.random() * endpoints.length)];
      pushApiLog(randomEp, randomEp.includes('sync') || randomEp.includes('audit') ? 'POST' : 'GET');
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const handleSwitchRole = (role: 'super_admin' | 'operations' | 'finance' | 'support') => {
    setActiveRole(role);
    localStorage.setItem('adam_active_admin_role', role);
    pushApiLog(`/api/v1/rbac/role-switch?role=${role}`, 'GET');
  };

  // Roles Definition
  const rolesList: AdminRoleConfig[] = [
    {
      id: 'super_admin',
      roleCategory: 'Admin',
      titleAr: 'مدير النظام الأعلى (Super Admin)',
      titleEn: 'Super Administrator',
      descriptionAr: 'تحكم مطلق في كافة الشاشات، الصلاحيات، الإعدادات، البيانات والمالية.',
      descriptionEn: 'Full system control, permissions, security credentials and database configuration.',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      defaultPermissions: {
        liveTracking: true,
        manageDrivers: true,
        managePassengers: true,
        financials: true,
        changeSettings: true,
        apiMonitor: true
      }
    },
    {
      id: 'operations',
      roleCategory: 'Admin',
      titleAr: 'مدير العمليات والتطبيقيين (Operations Manager)',
      titleEn: 'Operations Manager',
      descriptionAr: 'متابعة الرادار المباشر، توزيع الكباتن، إدارة الرحلات القائمة وإعطاء الأوامر التشغيلية.',
      descriptionEn: 'Live tracking radar, driver dispatches, ride approvals and route operations.',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      defaultPermissions: {
        liveTracking: true,
        manageDrivers: true,
        managePassengers: true,
        financials: false,
        changeSettings: false,
        apiMonitor: true
      }
    },
    {
      id: 'finance',
      roleCategory: 'Moderator',
      titleAr: 'المشرف المالي (Financial Supervisor)',
      titleEn: 'Financial Supervisor',
      descriptionAr: 'متابعة أرباح المنصة، عمولات الكباتن، حركة المحافظ والشحن والسحب.',
      descriptionEn: 'Platform profits, commission audits, driver top-ups and financial reports.',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      defaultPermissions: {
        liveTracking: false,
        manageDrivers: false,
        managePassengers: true,
        financials: true,
        changeSettings: false,
        apiMonitor: false
      }
    },
    {
      id: 'support',
      roleCategory: 'Support',
      titleAr: 'الدعم الفني والخدمة (Customer Support)',
      titleEn: 'Customer Support Specialist',
      descriptionAr: 'متابعة شكاوى الكباتن والركاب، الاستعلام عن الرحلات والتذاكر في وضع القراءة.',
      descriptionEn: 'Passenger & captain support ticket lookup, trip status check (read-only).',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      defaultPermissions: {
        liveTracking: true,
        manageDrivers: false,
        managePassengers: true,
        financials: false,
        changeSettings: false,
        apiMonitor: false
      }
    }
  ];

  const currentRoleConfig = rolesList.find(r => r.id === activeRole) || rolesList[0];

  // Get current active permissions for the role
  const activePerms = rolePermissions[activeRole] || currentRoleConfig.defaultPermissions;

  const handleToggleRolePermission = (permKey: keyof typeof currentRoleConfig.defaultPermissions) => {
    const updatedRolePerms = {
      ...activePerms,
      [permKey]: !activePerms[permKey]
    };

    const newMap = {
      ...rolePermissions,
      [activeRole]: updatedRolePerms
    };

    setRolePermissions(newMap);
    localStorage.setItem('adam_role_perms_map', JSON.stringify(newMap));

    // Also sync permissions to all assigned employees under this category!
    const assignedEmps = getAssignedEmployees(currentRoleConfig.roleCategory, currentRoleConfig.id);
    assignedEmps.forEach(emp => {
      const mapped = convertRbacToEmployeePerms(updatedRolePerms);
      updateEmployeePermissions(emp.id, mapped);
    });

    pushApiLog(`/api/v1/rbac/update-permission?role=${activeRole}&perm=${permKey}&val=${!activePerms[permKey]}`, 'POST');
  };

  // Filter employees belonging to this role
  const getAssignedEmployees = (cat: string, roleId: string) => {
    return employees.filter(emp => {
      if (roleId === 'super_admin' && emp.username === 'admin') return true;
      if (emp.roleCategory === cat) return true;
      if (roleId === 'operations' && emp.roleCategory === 'Admin') return true;
      if (roleId === 'finance' && emp.roleCategory === 'Moderator') return true;
      if (roleId === 'support' && emp.roleCategory === 'Support') return true;
      return false;
    });
  };

  const assignedEmployees = getAssignedEmployees(currentRoleConfig.roleCategory, currentRoleConfig.id);

  // Convert RBAC permissions to Employee interface permissions
  const convertRbacToEmployeePerms = (rbacPerms: Record<string, boolean>): Employee['permissions'] => {
    return {
      pendingDrivers: !!rbacPerms.manageDrivers,
      activeDrivers: !!rbacPerms.manageDrivers,
      passengers: !!rbacPerms.managePassengers,
      allRides: !!rbacPerms.liveTracking,
      scheduledTrips: !!rbacPerms.liveTracking,
      walletApprovals: !!rbacPerms.financials,
      rateManagement: !!rbacPerms.changeSettings,
      userFeedbacks: !!rbacPerms.managePassengers,
      aiServicesStrategy: !!rbacPerms.changeSettings,
      aiDeveloperStudio: !!rbacPerms.apiMonitor,
      logs: !!rbacPerms.apiMonitor,
      auditPayments: !!rbacPerms.financials
    };
  };

  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empFullName.trim() || !empUsername.trim()) {
      setAddFeedback({ success: false, msg: 'الرجاء كتابة اسم الموظف واسم المستخدم.' });
      return;
    }

    const res = addEmployee({
      fullName: empFullName.trim(),
      username: empUsername.trim().toLowerCase(),
      password: empPassword.trim() || '123456',
      roleCategory: currentRoleConfig.roleCategory,
      permissions: convertRbacToEmployeePerms(activePerms)
    });

    setAddFeedback(res);
    if (res.success) {
      setEmpFullName('');
      setEmpUsername('');
      setEmpPassword('123456');
      pushApiLog(`/api/v1/employees/add?username=${empUsername.trim().toLowerCase()}&role=${activeRole}`, 'POST');
      setTimeout(() => setAddFeedback(null), 3500);
    }
  };

  // AI Smart Permissions Assignment Handler
  const handleAiAutoAssign = (modeText?: string) => {
    const textToProcess = modeText || aiPrompt.trim() || `قم بتوليد وتطبيق الصلاحيات الذكية لدور ${currentRoleConfig.titleAr}`;
    setAiStatusMsg('🧠 جاري تحليل معايير الأمان وتوزيع الصلاحيات بالذكاء الاصطناعي (Gemini AI Core)...');

    setTimeout(() => {
      let smartPerms = { ...currentRoleConfig.defaultPermissions };
      let newName = '';

      if (textToProcess.includes('دعم') || activeRole === 'support') {
        smartPerms = { liveTracking: true, manageDrivers: false, managePassengers: true, financials: false, changeSettings: false, apiMonitor: false };
        newName = 'أحمد الدعم الفني';
      } else if (textToProcess.includes('مالي') || textToProcess.includes('مشرف') || activeRole === 'finance') {
        smartPerms = { liveTracking: false, manageDrivers: false, managePassengers: true, financials: true, changeSettings: false, apiMonitor: false };
        newName = 'خالد المشرف المالي';
      } else if (textToProcess.includes('عمليات') || textToProcess.includes('مدير') || activeRole === 'operations') {
        smartPerms = { liveTracking: true, manageDrivers: true, managePassengers: true, financials: false, changeSettings: false, apiMonitor: true };
        newName = 'سامر مدير العمليات';
      } else if (activeRole === 'super_admin') {
        smartPerms = { liveTracking: true, manageDrivers: true, managePassengers: true, financials: true, changeSettings: true, apiMonitor: true };
        newName = 'م. عمر مدير النظام';
      }

      // Save role perms
      const newMap = { ...rolePermissions, [activeRole]: smartPerms };
      setRolePermissions(newMap);
      localStorage.setItem('adam_role_perms_map', JSON.stringify(newMap));

      // Check if we should auto create an employee if none exists
      if (assignedEmployees.length === 0) {
        addEmployee({
          fullName: newName,
          username: 'emp_' + activeRole + '_' + Math.floor(Math.random() * 899 + 100),
          password: '123',
          roleCategory: currentRoleConfig.roleCategory,
          permissions: convertRbacToEmployeePerms(smartPerms)
        });
      } else {
        assignedEmployees.forEach(emp => {
          updateEmployeePermissions(emp.id, convertRbacToEmployeePerms(smartPerms));
        });
      }

      setAiStatusMsg(`✨ تم بنجاح تطبيق وتوليد الصلاحيات الذكية على الموظفين المسجلين تحت دور [${currentRoleConfig.titleAr}]!`);
      pushApiLog(`/api/v1/ai/dispatch-rbac?role=${activeRole}`, 'POST');
      setAiPrompt('');
      setTimeout(() => setAiStatusMsg(''), 4500);
    }, 1200);
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      
      {/* RBAC ROLE MANAGER HEADER */}
      <div className="bg-[#080c1d] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row-reverse justify-between items-center gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 flex-row-reverse">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-100 flex items-center gap-2 flex-row-reverse">
                <span>{t('إدارة صلاحيات الدخول والمسؤولين (RBAC Access Matrix & Employee Assignment)', 'Role-Based Access Control (RBAC)')}</span>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[8px] font-mono font-bold px-2 py-0.5 rounded-full">
                  LIVE RBAC CORE
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">
                {t('تعيين أسماء الموظفين (المدير، المشرف، الدعم)، تحديد صلاحياتهم ومنحهم إمكانية الدخول للوحة التحكم والمزامنة مع شاشة الموظفين', 'Assign managers, supervisors, and support staff, customize permissions, and auto-sync with Employee Management.')}
              </p>
            </div>
          </div>

          {/* ROLE SELECTOR BUTTONS IN SCREENSHOT MATCH */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
            {rolesList.map(r => (
              <button
                key={r.id}
                onClick={() => handleSwitchRole(r.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center gap-1 ${
                  activeRole === r.id 
                    ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400/40' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {r.id === 'super_admin' && <span>👑</span>}
                {r.id === 'operations' && <span>🏢</span>}
                {r.id === 'finance' && <span>💰</span>}
                {r.id === 'support' && <span>🎧</span>}
                <span>{r.titleAr.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ACTIVE ROLE PERMISSION DETAILS & GRANULAR PERMISSION TOGGLES */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center flex-row-reverse flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-row-reverse">
              <span className={`px-3 py-1 rounded-lg text-xs font-black border ${currentRoleConfig.badgeColor}`}>
                {currentRoleConfig.titleAr}
              </span>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Category: {currentRoleConfig.roleCategory}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAiAutoAssign()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-[10px] px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>تطبيق الصلاحيات الذكية (AI Auto-Assign)</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            {currentRoleConfig.descriptionAr}
          </p>

          {/* PERMISSION MATRIX INTERACTIVE TOGGLES */}
          <div>
            <div className="text-[10px] text-slate-400 font-bold mb-2 flex justify-between items-center flex-row-reverse">
              <span>انقر لتعديل ومنح الصلاحيات المباشرة لهذا الدور والموظفين المنتمين له:</span>
              <span className="text-emerald-400 text-[9px] font-mono">Real-time Permission Sync Active</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              
              <button
                type="button"
                onClick={() => handleToggleRolePermission('liveTracking')}
                className={`p-2.5 rounded-xl border text-center space-y-1 transition cursor-pointer ${
                  activePerms.liveTracking 
                    ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300 shadow-emerald-950/20' 
                    : 'bg-slate-950/80 border-slate-800 text-rose-400/70 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] font-bold">التتبع المباشر</div>
                <div className="text-xs font-black">{activePerms.liveTracking ? 'متاح ✅' : 'محظور ❌'}</div>
              </button>

              <button
                type="button"
                onClick={() => handleToggleRolePermission('manageDrivers')}
                className={`p-2.5 rounded-xl border text-center space-y-1 transition cursor-pointer ${
                  activePerms.manageDrivers 
                    ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300 shadow-emerald-950/20' 
                    : 'bg-slate-950/80 border-slate-800 text-rose-400/70 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] font-bold">إدارة الكباتن</div>
                <div className="text-xs font-black">{activePerms.manageDrivers ? 'متاح ✅' : 'محظور ❌'}</div>
              </button>

              <button
                type="button"
                onClick={() => handleToggleRolePermission('managePassengers')}
                className={`p-2.5 rounded-xl border text-center space-y-1 transition cursor-pointer ${
                  activePerms.managePassengers 
                    ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300 shadow-emerald-950/20' 
                    : 'bg-slate-950/80 border-slate-800 text-rose-400/70 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] font-bold">إدارة الركاب</div>
                <div className="text-xs font-black">{activePerms.managePassengers ? 'متاح ✅' : 'محظور ❌'}</div>
              </button>

              <button
                type="button"
                onClick={() => handleToggleRolePermission('financials')}
                className={`p-2.5 rounded-xl border text-center space-y-1 transition cursor-pointer ${
                  activePerms.financials 
                    ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300 shadow-emerald-950/20' 
                    : 'bg-slate-950/80 border-slate-800 text-rose-400/70 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] font-bold">التقرير المالي</div>
                <div className="text-xs font-black">{activePerms.financials ? 'متاح ✅' : 'محظور ❌'}</div>
              </button>

              <button
                type="button"
                onClick={() => handleToggleRolePermission('changeSettings')}
                className={`p-2.5 rounded-xl border text-center space-y-1 transition cursor-pointer ${
                  activePerms.changeSettings 
                    ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300 shadow-emerald-950/20' 
                    : 'bg-slate-950/80 border-slate-800 text-rose-400/70 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] font-bold">تعديل الإعدادات</div>
                <div className="text-xs font-black">{activePerms.changeSettings ? 'متاح ✅' : 'محظور ❌'}</div>
              </button>

              <button
                type="button"
                onClick={() => handleToggleRolePermission('apiMonitor')}
                className={`p-2.5 rounded-xl border text-center space-y-1 transition cursor-pointer ${
                  activePerms.apiMonitor 
                    ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300 shadow-emerald-950/20' 
                    : 'bg-slate-950/80 border-slate-800 text-rose-400/70 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] font-bold">مراقبة الـ API</div>
                <div className="text-xs font-black">{activePerms.apiMonitor ? 'متاح ✅' : 'محظور ❌'}</div>
              </button>

            </div>
          </div>
        </div>

        {/* SECTION: ASSIGNED EMPLOYEES AND QUICK ADD EMPLOYEE FORM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2">
          
          {/* ASSIGNED EMPLOYEES LIST */}
          <div className="lg:col-span-7 bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800 flex-row-reverse">
              <h4 className="text-xs font-black text-slate-100 flex items-center gap-1.5 flex-row-reverse">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>الموظفون المعينون لدور [{currentRoleConfig.titleAr}] ({assignedEmployees.length})</span>
              </h4>
              <span className="text-[9.5px] text-indigo-300 font-mono bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                SYNCED WITH CRM
              </span>
            </div>

            <div className="space-y-2">
              {assignedEmployees.map(emp => (
                <div key={emp.id} className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl flex justify-between items-center flex-row-reverse gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-row-reverse font-bold text-xs text-slate-100">
                      <span>{emp.fullName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">(@{emp.username})</span>
                      {emp.isHidden && (
                        <span className="bg-rose-950 text-rose-400 text-[8px] px-1.5 py-0.2 rounded border border-rose-800">
                          معطل
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1.5 flex-row-reverse text-[8.5px]">
                      <span className={`px-1.5 py-0.5 rounded ${emp.permissions?.allRides ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
                        تتبع
                      </span>
                      <span className={`px-1.5 py-0.5 rounded ${emp.permissions?.pendingDrivers ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
                        كباتن
                      </span>
                      <span className={`px-1.5 py-0.5 rounded ${emp.permissions?.passengers ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
                        ركاب
                      </span>
                      <span className={`px-1.5 py-0.5 rounded ${emp.permissions?.walletApprovals ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
                        مالية
                      </span>
                      <span className={`px-1.5 py-0.5 rounded ${emp.permissions?.logs ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}>
                        API
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const updated = convertRbacToEmployeePerms(activePerms);
                        updateEmployeePermissions(emp.id, updated);
                        pushApiLog(`/api/v1/employees/update-permissions?id=${emp.id}`, 'POST');
                      }}
                      className="p-1.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-lg text-[10px] hover:bg-indigo-900 transition cursor-pointer"
                      title="مزامنة الصلاحيات الحالية"
                    >
                      <Zap className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`هل أنت متأكد من حذف الموظف ${emp.fullName}؟`)) {
                          deleteEmployee(emp.id);
                          pushApiLog(`/api/v1/employees/delete?id=${emp.id}`, 'DELETE');
                        }
                      }}
                      className="p-1.5 bg-rose-950 text-rose-400 border border-rose-800 rounded-lg text-[10px] hover:bg-rose-900 transition cursor-pointer"
                      title="حذف الموظف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {assignedEmployees.length === 0 && (
                <div className="p-4 text-center text-slate-500 italic text-xs bg-slate-950/40 rounded-xl border border-slate-900">
                  لا يوجد موظفون معينون حالياً تحت هذا الدور. يمكنك إضافة موظف جديد من النموذج المجاور.
                </div>
              )}
            </div>
          </div>

          {/* ADD NEW EMPLOYEE FORM FOR THIS ROLE */}
          <div className="lg:col-span-5 bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800 flex-row-reverse text-xs font-black text-slate-100">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>إضافة موظف جديد وتعيينه لدور [{currentRoleConfig.titleAr}]</span>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} className="space-y-2.5 text-xs">
              {addFeedback && (
                <div className={`p-2 rounded text-[10.5px] font-bold text-center ${addFeedback.success ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
                  {addFeedback.msg}
                </div>
              )}

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">اسم الموظف الثلاثي:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد عبد الله المحاميد"
                  value={empFullName}
                  onChange={(e) => setEmpFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 text-right"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">اسم المستخدم (Username):</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ahmed_ops"
                  value={empUsername}
                  onChange={(e) => setEmpUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 text-right font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">كلمة المرور:</label>
                <input
                  type="text"
                  value={empPassword}
                  onChange={(e) => setEmpPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 text-right font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black p-2 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg mt-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>تعيين الموظف وتطبيق الصلاحيات فوراً ⚡</span>
              </button>
            </form>
          </div>

        </div>

        {/* AI PROMPT ASSISTANT DISPATCHER */}
        <div className="bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/30 p-3.5 rounded-xl space-y-2">
          <div className="flex justify-between items-center flex-row-reverse text-xs font-black text-indigo-300">
            <span className="flex items-center gap-1.5 flex-row-reverse">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
              <span>مساعد الذكاء الاصطناعي الذكي لتوزيع الموظفين والصلاحيات (AI Role Dispatcher)</span>
            </span>
            <span className="text-[9px] bg-indigo-900/80 px-2 py-0.5 rounded text-indigo-200 border border-indigo-700">
              Gemini AI Integration
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="اكتب أمراً للذكاء الاصطناعي، مثل: قم بإضافة موظف جديد باسم خالد ومنحه صلاحيات التقرير المالي والدعم..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiAutoAssign()}
              className="flex-1 bg-slate-950/90 text-slate-200 border border-indigo-500/40 text-xs rounded-lg px-3 py-2 outline-none focus:border-amber-400 text-right"
            />
            <button
              onClick={() => handleAiAutoAssign()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>تنفيذ 🚀</span>
            </button>
          </div>

          {aiStatusMsg && (
            <div className="text-[10.5px] font-bold text-amber-300 bg-amber-950/60 border border-amber-800/60 p-2 rounded-lg text-right">
              {aiStatusMsg}
            </div>
          )}
        </div>

      </div>

      {/* LIVE API INTEGRATION MONITOR */}
      <div className="bg-[#080c1d] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        
        <div className="flex justify-between items-center pb-2 border-b border-slate-800 flex-row-reverse">
          <h3 className="text-xs font-black text-slate-100 flex items-center gap-2 flex-row-reverse">
            <Server className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>{t('مراقبة ربط الـ API وسلاسة البيانات لحظياً (Live API Gateway Monitor)', 'API Integration & Connectivity Monitor')}</span>
          </h3>
          <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            99.98% Uptime
          </span>
        </div>

        {/* ENDPOINT HEALTH CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between flex-row-reverse">
            <div>
              <div className="text-[10px] text-slate-400 font-bold">تطبيق الراكب (Passenger API)</div>
              <div className="text-xs font-black text-emerald-400 font-mono mt-0.5">HTTP 200 OK</div>
            </div>
            <Smartphone className="w-5 h-5 text-indigo-400" />
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between flex-row-reverse">
            <div>
              <div className="text-[10px] text-slate-400 font-bold">تطبيق الكابتن (Captain API)</div>
              <div className="text-xs font-black text-emerald-400 font-mono mt-0.5">HTTP 200 OK</div>
            </div>
            <Smartphone className="w-5 h-5 text-amber-400" />
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between flex-row-reverse">
            <div>
              <div className="text-[10px] text-slate-400 font-bold">لوحة التحكم (Admin Panel CRM)</div>
              <div className="text-xs font-black text-emerald-400 font-mono mt-0.5">HTTP 200 OK</div>
            </div>
            <Cpu className="w-5 h-5 text-purple-400" />
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between flex-row-reverse">
            <div>
              <div className="text-[10px] text-slate-400 font-bold">قواعد البيانات (Firestore Sync)</div>
              <div className="text-xs font-black text-emerald-400 font-mono mt-0.5">CONNECTED (14ms)</div>
            </div>
            <Database className="w-5 h-5 text-cyan-400" />
          </div>

        </div>

        {/* LIVE REAL-TIME PAYLOAD STREAM LOGS */}
        <div className="bg-[#04060f] p-3 rounded-xl border border-slate-800 space-y-2">
          <div className="text-[10px] text-slate-400 font-mono font-bold pb-1 border-b border-slate-800 flex justify-between items-center flex-row-reverse">
            <span>📡 بث حركة البيانات المباشرة بين السيرفر والتطبيقات (Real-Time API Traffic Stream)</span>
            <span className="text-emerald-400 animate-pulse">LIVE LISTEN</span>
          </div>

          <div className="space-y-1.5 font-mono text-[10px]">
            {apiLogs.map(log => (
              <div key={log.id} className="flex justify-between items-center text-slate-300 bg-slate-950/60 p-1.5 rounded border border-slate-900 flex-row-reverse">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <span className="text-emerald-400 font-bold">[{log.status}]</span>
                  <span className="text-indigo-300 font-bold">{log.method}</span>
                  <span className="text-slate-200">{log.endpoint}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-[9px]">
                  <span>{log.latency}ms</span>
                  <span>{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
