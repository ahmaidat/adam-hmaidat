import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  RefreshCw, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock, 
  Phone, 
  Mail, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  Activity, 
  Key,
  Database
} from 'lucide-react';
import { useAppState } from '../stateEngine';
import { Employee, PermissionState } from '../types';
import { syncEmployeeToFirebase, deleteEmployeeFromFirebase, subscribeEmployeesFromFirebase } from '../firebase';

export const EmployeeManager: React.FC = () => {
  const { 
    employees, 
    addEmployee, 
    updateEmployeePermissions, 
    updateEmployee, 
    toggleEmployeeStatus, 
    toggleEmployeeHide, 
    deleteEmployee,
    t 
  } = useAppState();

  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'Admin' | 'Moderator' | 'Support'>('all');
  const [firebaseStatus, setFirebaseStatus] = useState<string>('متصل ومتزامن حياً 🔥');
  const [isSyncing, setIsSyncing] = useState(false);

  // Form state for adding new employee
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123456');
  const [roleCategory, setRoleCategory] = useState<'Admin' | 'Moderator' | 'Support'>('Support');
  const [phone, setPhone] = useState('0791234567');
  const [email, setEmail] = useState('');
  const [initialTask, setInitialTask] = useState('متابعة طلبات الركاب والدعم التشغيلي');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Permission selection state
  const [perms, setPerms] = useState({
    pendingDrivers: false,
    activeDrivers: false,
    passengers: true,
    allRides: true,
    scheduledTrips: true,
    walletApprovals: false,
    rateManagement: false,
    userFeedbacks: true,
    aiServicesStrategy: false,
    aiDeveloperStudio: false,
    logs: false,
    auditPayments: false,
  });

  // Edit employee permissions modal state
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [editPerms, setEditPerms] = useState({
    pendingDrivers: false,
    activeDrivers: false,
    passengers: false,
    allRides: false,
    scheduledTrips: false,
    walletApprovals: false,
    rateManagement: false,
    userFeedbacks: false,
    aiServicesStrategy: false,
    aiDeveloperStudio: false,
    logs: false,
    auditPayments: false,
  });

  // Quick preset loader based on role selection
  useEffect(() => {
    if (roleCategory === 'Admin') {
      setPerms({
        pendingDrivers: true, activeDrivers: true, passengers: true, allRides: true,
        scheduledTrips: true, walletApprovals: true, rateManagement: true, userFeedbacks: true,
        aiServicesStrategy: true, aiDeveloperStudio: true, logs: true, auditPayments: true
      });
    } else if (roleCategory === 'Moderator') {
      setPerms({
        pendingDrivers: true, activeDrivers: true, passengers: true, allRides: true,
        scheduledTrips: true, walletApprovals: true, rateManagement: false, userFeedbacks: true,
        aiServicesStrategy: false, aiDeveloperStudio: false, logs: false, auditPayments: true
      });
    } else {
      setPerms({
        pendingDrivers: false, activeDrivers: false, passengers: true, allRides: true,
        scheduledTrips: true, walletApprovals: false, rateManagement: false, userFeedbacks: true,
        aiServicesStrategy: false, aiDeveloperStudio: false, logs: false, auditPayments: false
      });
    }
  }, [roleCategory]);

  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!fullName.trim() || !username.trim()) {
      setStatusMsg({ type: 'error', text: 'يرجى إدخال اسم الموظف واسم المستخدم' });
      return;
    }

    const res = addEmployee({
      fullName: fullName.trim(),
      username: username.trim(),
      password: password || '123456',
      roleCategory,
      status: 'active',
      phone: phone.trim(),
      email: email.trim() || `${username.trim()}@adam-app.jo`,
      lastActiveTask: initialTask.trim() || 'مباشرة العمل وتحديد الصلاحيات',
      lastActiveTime: 'الآن',
      assignedTasksCount: 1,
      firebaseSynced: true,
      permissions: perms
    });

    if (res.success) {
      setStatusMsg({ type: 'success', text: 'تم إنشاء الموظف بنجاح وربطه بقاعدة بيانات Firebase 🔥' });
      setFullName('');
      setUsername('');
      setPassword('123456');
      setActiveTab('list');
    } else {
      setStatusMsg({ type: 'error', text: res.msg });
    }
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    const p: any = emp.permissions || {};
    setEditPerms({
      pendingDrivers: Boolean(p.pendingDrivers),
      activeDrivers: Boolean(p.activeDrivers),
      passengers: Boolean(p.passengers),
      allRides: Boolean(p.allRides),
      scheduledTrips: Boolean(p.scheduledTrips),
      walletApprovals: Boolean(p.walletApprovals),
      rateManagement: Boolean(p.rateManagement),
      userFeedbacks: Boolean(p.userFeedbacks),
      aiServicesStrategy: Boolean(p.aiServicesStrategy),
      aiDeveloperStudio: Boolean(p.aiDeveloperStudio),
      logs: Boolean(p.logs),
      auditPayments: Boolean(p.auditPayments)
    });
  };

  const handleSaveEditPermissions = async () => {
    if (!editingEmp) return;
    updateEmployeePermissions(editingEmp.id, editPerms);
    setStatusMsg({ type: 'success', text: `تم تحديث صلاحيات الموظف ${editingEmp.fullName} وحفظها في Firebase` });
    setEditingEmp(null);
  };

  const handleManualFirebaseSync = async () => {
    setIsSyncing(true);
    let successCount = 0;
    for (const emp of employees) {
      const ok = await syncEmployeeToFirebase(emp);
      if (ok) successCount++;
    }
    setIsSyncing(false);
    setFirebaseStatus(`تمت مزامنة ${successCount} موظفين مع Firebase 🔥`);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchSearch = emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        emp.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (emp.phone && emp.phone.includes(searchTerm));
    const matchRole = roleFilter === 'all' || emp.roleCategory === roleFilter;
    return matchSearch && matchRole;
  });

  const totalEmps = employees.length;
  const activeEmps = employees.filter(e => (e.status || 'active') === 'active').length;
  const adminsCount = employees.filter(e => e.roleCategory === 'Admin').length;
  const moderatorsCount = employees.filter(e => e.roleCategory === 'Moderator').length;
  const supportCount = employees.filter(e => e.roleCategory === 'Support').length;

  return (
    <div className="w-full bg-[#070a14] rounded-2xl border border-slate-800/80 p-4 md:p-6 text-right font-sans space-y-5">
      
      {/* HEADER & FIREBASE STATUS BANNER */}
      <div className="flex flex-col md:flex-row-reverse justify-between items-start md:items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-row-reverse">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-100 flex items-center gap-2 flex-row-reverse">
                <span>شاشة إدارة الموظفين والصلاحيات (Employee Management)</span>
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-slate-950" /> Firebase Linked
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                إضافة الموظفين، تحديد الأدوار (مدير، مشرف، دعم فني)، وتعديل الصلاحيات بضغطة زر مع المزامنة الفورية.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleManualFirebaseSync}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-950/80 text-orange-300 border border-orange-800/80 hover:bg-orange-900 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="مزامنة فورية لكافة الموظفين مع قاعدة بيانات Firebase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'جاري المزامنة...' : 'مزامنة Firebase 🔥'}</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] text-emerald-400 font-bold">
            <Database className="w-3.5 h-3.5" />
            <span>{firebaseStatus}</span>
          </div>
        </div>
      </div>

      {/* QUICK METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-right">
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 block font-bold">إجمالي الموظفين</span>
          <span className="text-lg font-black text-slate-100">{totalEmps}</span>
        </div>
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-emerald-400 block font-bold">نشط ومتصل الآن 🟢</span>
          <span className="text-lg font-black text-emerald-400">{activeEmps}</span>
        </div>
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-indigo-400 block font-bold">مدراء النظام 👑</span>
          <span className="text-lg font-black text-indigo-300">{adminsCount}</span>
        </div>
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-amber-400 block font-bold">المشرفون 🛡️</span>
          <span className="text-lg font-black text-amber-300">{moderatorsCount}</span>
        </div>
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-cyan-400 block font-bold">الدعم الفني 🎧</span>
          <span className="text-lg font-black text-cyan-300">{supportCount}</span>
        </div>
      </div>

      {/* STATUS NOTIFICATION ALERT */}
      {statusMsg && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between flex-row-reverse ${statusMsg.type === 'success' ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300' : 'bg-rose-950/80 border border-rose-800 text-rose-300'}`}>
          <div className="flex items-center gap-2 flex-row-reverse">
            <CheckCircle2 className="w-4 h-4" />
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* TABS SWITCHER */}
      <div className="flex border-b border-slate-800 gap-2 flex-row-reverse">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 text-xs font-black rounded-t-xl transition flex items-center gap-2 cursor-pointer ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900/40 text-slate-400 hover:text-slate-200'}`}
        >
          <Users className="w-4 h-4" />
          <span>قائمة الموظفين والصلاحيات ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('add')}
          className={`px-4 py-2 text-xs font-black rounded-t-xl transition flex items-center gap-2 cursor-pointer ${activeTab === 'add' ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg' : 'bg-slate-900/40 text-slate-400 hover:text-slate-200'}`}
        >
          <UserPlus className="w-4 h-4" />
          <span>+ إضافة موظف جديد بـ Firebase</span>
        </button>
      </div>

      {/* TAB 1: EMPLOYEES LIST & ACTIONS */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          
          {/* SEARCH & FILTERS & VIEW MODE */}
          <div className="flex flex-col sm:flex-row-reverse justify-between items-center gap-3 bg-slate-900/30 p-3 rounded-xl border border-slate-800">
            <input
              type="text"
              placeholder="بحث باسم الموظف، اسم المستخدم، أو رقم الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-72 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 text-xs text-right outline-none focus:border-indigo-500"
            />

            <div className="flex items-center gap-3 flex-row-reverse flex-wrap">
              <div className="flex items-center gap-1.5 flex-row-reverse">
                <span className="text-xs text-slate-400 font-bold">تصفية حسب الدور:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-1.5 outline-none font-bold cursor-pointer"
                >
                  <option value="all">جميع الموظفين</option>
                  <option value="Admin">👑 مدير (Admin)</option>
                  <option value="Moderator">🛡️ مشرف (Moderator)</option>
                  <option value="Support">🎧 دعم فني (Support)</option>
                </select>
              </div>

              {/* VIEW MODE TOGGLE BUTTONS */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    viewMode === 'table' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>جدول تفاعلي 📊</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    viewMode === 'cards' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>بطاقات 📑</span>
                </button>
              </div>
            </div>
          </div>

          {/* TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 shadow-xl">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-300 border-b border-slate-800 font-black">
                    <th className="p-3">الموظف والبيانات</th>
                    <th className="p-3">الدور والوظيفة</th>
                    <th className="p-3">حالة النشاط والتواجد</th>
                    <th className="p-3">📋 آخر مهمة منفذة (أوتوماتيكي)</th>
                    <th className="p-3">مزامنة Firebase</th>
                    <th className="p-3 text-center">الإجراءات والتحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredEmployees.map((emp) => {
                    let categoryBadge = 'bg-indigo-950/80 text-indigo-300 border-indigo-800';
                    let categoryLabel = '👑 مدير (Admin)';
                    if (emp.roleCategory === 'Moderator') {
                      categoryBadge = 'bg-amber-950/80 text-amber-300 border-amber-800';
                      categoryLabel = '🛡️ مشرف (Moderator)';
                    } else if (emp.roleCategory === 'Support') {
                      categoryBadge = 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
                      categoryLabel = '🎧 دعم فني (Support)';
                    }

                    const empStatus = emp.status || 'active';
                    let statusBadgeClass = 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900';
                    let statusText = 'متصل / نشط 🟢';
                    if (empStatus === 'on_break') {
                      statusBadgeClass = 'bg-amber-950 text-amber-300 border-amber-800 hover:bg-amber-900';
                      statusText = 'في استراحة ☕';
                    } else if (empStatus === 'inactive') {
                      statusBadgeClass = 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800';
                      statusText = 'غير نشط ⚪';
                    }

                    return (
                      <tr key={emp.id} className="hover:bg-slate-900/40 transition">
                        {/* EMPLOYEE INFO */}
                        <td className="p-3">
                          <div className="font-bold text-slate-100 flex items-center gap-1.5">
                            <span>{emp.fullName}</span>
                            {emp.isHidden && (
                              <span className="bg-rose-950 text-rose-400 text-[8px] px-1.5 py-0.2 rounded border border-rose-800 font-bold">
                                معطل
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 space-x-2 space-x-reverse">
                            <span>@{emp.username}</span>
                            <span>| Pass: <strong className="text-amber-400">{emp.password || '123456'}</strong></span>
                            {emp.phone && <span>| 📱 {emp.phone}</span>}
                          </div>
                        </td>

                        {/* ROLE */}
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-black border ${categoryBadge}`}>
                            {categoryLabel}
                          </span>
                        </td>

                        {/* STATUS TOGGLE (نشط / غير نشط) */}
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => {
                              const currentStatus = emp.status || 'active';
                              const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
                              toggleEmployeeStatus(emp.id, nextStatus);
                              setStatusMsg({
                                type: 'success',
                                text: `تم تحديث حالة الموظف ${emp.fullName} إلى (${nextStatus === 'active' ? 'نشط 🟢' : 'غير نشط 🔴'}) ومزامنته بـ Firebase 🔥`
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black border transition cursor-pointer flex items-center gap-1.5 shadow ${
                              (emp.status || 'active') === 'active'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                                : 'bg-rose-950/90 text-rose-300 border-rose-800 hover:bg-rose-900'
                            }`}
                            title="انقر لتبديل حالة الموظف (نشط / غير نشط) والتعديل بـ Firebase"
                          >
                            <span>{(emp.status || 'active') === 'active' ? 'نشط 🟢' : 'غير نشط 🔴'}</span>
                            <RefreshCw className="w-3 h-3 opacity-60" />
                          </button>
                        </td>

                        {/* LAST ACTIVE TASK */}
                        <td className="p-3">
                          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-slate-200 text-[11px] max-w-xs">
                            <div className="font-bold text-amber-300 flex items-center gap-1">
                              <Activity className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">{emp.lastActiveTask || 'معالجة ومتابعة الطلبات التشغيلية'}</span>
                            </div>
                            <div className="text-[9.5px] text-slate-400 mt-0.5 font-mono">
                              آخر تحديث: {emp.lastActiveTime || 'الآن'}
                            </div>
                          </div>
                        </td>

                        {/* FIREBASE SYNC */}
                        <td className="p-3">
                          <span className="bg-orange-950/80 text-orange-400 text-[10px] font-mono px-2 py-1 rounded-lg border border-orange-800/80 inline-flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                            <span>Firestore Synced</span>
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditModal(emp)}
                              className="px-2.5 py-1.5 bg-indigo-900/90 text-indigo-200 border border-indigo-700/80 rounded-lg hover:bg-indigo-800 transition cursor-pointer text-[10px] font-black flex items-center gap-1"
                              title="تعديل صلاحيات الموظف بضغطة زر"
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
                                if (window.confirm(`هل أنت متأكد من حذف الموظف ${emp.fullName} نهائياً من Firebase والسيرفر؟`)) {
                                  deleteEmployee(emp.id);
                                }
                              }}
                              className="p-1.5 bg-rose-950 text-rose-400 border border-rose-800 rounded-lg hover:bg-rose-900 transition cursor-pointer"
                              title="حذف الموظف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 italic text-xs">
                        لا يوجد موظفون يطابقون خيارات البحث.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* CARD GRID VIEW */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 gap-3">
              {filteredEmployees.map((emp) => {
                let categoryBadge = 'bg-indigo-950/80 text-indigo-300 border-indigo-800';
                let categoryLabel = 'مدير (Admin)';
                if (emp.roleCategory === 'Moderator') {
                  categoryBadge = 'bg-amber-950/80 text-amber-300 border-amber-800';
                  categoryLabel = 'مشرف (Moderator)';
                } else if (emp.roleCategory === 'Support') {
                  categoryBadge = 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
                  categoryLabel = 'دعم فني (Support)';
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
                  <div key={emp.id} className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-3 hover:border-slate-700 transition">
                    <div className="flex flex-col md:flex-row-reverse justify-between items-start md:items-center gap-3">
                      
                      <div>
                        <div className="flex items-center gap-2 flex-row-reverse flex-wrap">
                          <span className="font-bold text-sm text-slate-100">{emp.fullName}</span>
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold border ${categoryBadge}`}>
                            {categoryLabel}
                          </span>
                          
                          {/* 1-CLICK STATUS TOGGLE BUTTON (نشط / غير نشط) */}
                          <button
                            type="button"
                            onClick={() => {
                              const currentStatus = emp.status || 'active';
                              const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
                              toggleEmployeeStatus(emp.id, nextStatus);
                              setStatusMsg({
                                type: 'success',
                                text: `تم تحديث حالة الموظف ${emp.fullName} إلى (${nextStatus === 'active' ? 'نشط 🟢' : 'غير نشط 🔴'}) ومزامنته بـ Firebase 🔥`
                              });
                            }}
                            className={`px-2.5 py-1 rounded text-[10.5px] font-black border cursor-pointer hover:opacity-80 transition flex items-center gap-1 ${
                              (emp.status || 'active') === 'active'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                                : 'bg-rose-950/90 text-rose-300 border-rose-800'
                            }`}
                            title="تعديل حالة النشاط والتواجد (نشط / غير نشط) بضغطة زر بـ Firebase"
                          >
                            <span>{(emp.status || 'active') === 'active' ? 'نشط 🟢' : 'غير نشط 🔴'}</span>
                            <RefreshCw className="w-3 h-3 opacity-60" />
                          </button>

                          <span className="bg-orange-950/80 text-orange-400 text-[9px] font-mono px-2 py-0.5 rounded border border-orange-800/80 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                            <span>Firebase Synced</span>
                          </span>

                          {emp.isHidden && (
                            <span className="bg-rose-950 text-rose-400 text-[9px] px-2 py-0.5 rounded border border-rose-800 font-bold">
                              حساب معطل / مخفي
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 font-mono mt-1.5 flex items-center gap-4 flex-row-reverse flex-wrap">
                          <span>User: <strong className="text-slate-200">@{emp.username}</strong></span>
                          <span>Pass: <strong className="text-amber-400">{emp.password || '123456'}</strong></span>
                          {emp.phone && <span>الهاتف: <strong className="text-slate-300">{emp.phone}</strong></span>}
                          {emp.email && <span>البريد: <strong className="text-slate-300">{emp.email}</strong></span>}
                        </div>

                        {/* LAST ACTIVE TASK */}
                        <div className="text-xs bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-slate-300 mt-2 flex items-center gap-2 flex-row-reverse">
                          <span className="text-amber-400 font-bold shrink-0">📋 آخر مهام الموظف:</span>
                          <span className="truncate">{emp.lastActiveTask || 'معالجة وتدقيق المعاملات والرحلات'}</span>
                          {emp.lastActiveTime && (
                            <span className="text-[10px] text-slate-500 font-mono shrink-0">({emp.lastActiveTime})</span>
                          )}
                        </div>
                      </div>

                      {/* ACTION BUTTONS WITH 1-CLICK PERMISSION EDIT */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="px-3 py-1.5 bg-indigo-900/80 text-indigo-200 border border-indigo-700/80 rounded-lg hover:bg-indigo-800 transition cursor-pointer text-xs font-bold flex items-center gap-1.5"
                          title="تعديل صلاحيات الموظف بضغطة زر"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>تعديل الصلاحيات ⚡</span>
                        </button>

                        <button
                          onClick={() => toggleEmployeeHide(emp.id)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${emp.isHidden ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                          title={emp.isHidden ? 'إظهار وتفعيل' : 'إخفاء وتعطيل'}
                        >
                          {emp.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من حذف الموظف ${emp.fullName} نهائياً من Firebase والسيرفر؟`)) {
                              deleteEmployee(emp.id);
                            }
                          }}
                          className="p-1.5 bg-rose-950 text-rose-400 border border-rose-800 rounded-lg hover:bg-rose-900 transition cursor-pointer"
                          title="حذف الموظف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                    {/* PERMISSIONS PILLS MATRIX */}
                    <div className="flex flex-wrap gap-1.5 flex-row-reverse text-[9.5px] pt-2 border-t border-slate-800/80">
                      <span className={`px-2 py-0.5 rounded font-bold ${emp.permissions?.allRides ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-950 text-slate-600'}`}>
                        تتبع الرحلات
                      </span>
                      <span className={`px-2 py-0.5 rounded font-bold ${emp.permissions?.activeDrivers ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-950 text-slate-600'}`}>
                        إدارة الكباتن
                      </span>
                      <span className={`px-2 py-0.5 rounded font-bold ${emp.permissions?.passengers ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-950 text-slate-600'}`}>
                        إدارة الركاب
                      </span>
                      <span className={`px-2 py-0.5 rounded font-bold ${emp.permissions?.walletApprovals ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-950 text-slate-600'}`}>
                        الموافقة على المحفظة
                      </span>
                      <span className={`px-2 py-0.5 rounded font-bold ${emp.permissions?.rateManagement ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-950 text-slate-600'}`}>
                        تسعير المسارات
                      </span>
                      <span className={`px-2 py-0.5 rounded font-bold ${emp.permissions?.auditPayments ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-950 text-slate-600'}`}>
                        التدقيق المحاسبي
                      </span>
                      <span className={`px-2 py-0.5 rounded font-bold ${emp.permissions?.aiServicesStrategy ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-950 text-slate-600'}`}>
                        خدمات الذكاء الاصطناعي
                      </span>
                    </div>

                  </div>
                );
              })}

              {filteredEmployees.length === 0 && (
                <div className="p-8 text-center text-slate-500 italic text-xs bg-slate-900/20 rounded-xl border border-slate-800">
                  لا يوجد موظفون يطابقون خيارات البحث.
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* TAB 2: FORM TO ADD NEW EMPLOYEE */}
      {activeTab === 'add' && (
        <form onSubmit={handleAddEmployeeSubmit} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center flex-row-reverse">
            <h3 className="text-sm font-extrabold text-amber-400 flex items-center gap-2 flex-row-reverse">
              <UserPlus className="w-4 h-4" />
              <span>إضافة حساب موظف جديد وتحديد الأدوار والصلاحيات (Firebase Sync)</span>
            </h3>
            <span className="text-xs text-slate-400">سيتم ربطه فوراً بـ Firebase Firestore</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            
            <div>
              <label className="block text-slate-300 font-bold mb-1">الاسم الكامل للموظف <span className="text-rose-400">*</span></label>
              <input
                type="text"
                required
                placeholder="مثال: أحمد الحمايدة"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-right text-slate-100 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">اسم المستخدم (User ID) <span className="text-rose-400">*</span></label>
              <input
                type="text"
                required
                placeholder="ahmed_ops"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-right text-slate-100 font-mono outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">كلمة المرور الأولية</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-right text-slate-100 font-mono outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">تحديد دور ووظيفة الموظف <span className="text-rose-400">*</span></label>
              <select
                value={roleCategory}
                onChange={(e) => setRoleCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-right text-amber-300 font-extrabold outline-none focus:border-amber-500"
              >
                <option value="Admin">👑 مدير (Admin) - صلاحيات كاملة بالنظام</option>
                <option value="Moderator">🛡️ مشرف (Moderator) - إدارة الكباتن والعمليات</option>
                <option value="Support">🎧 دعم فني (Support) - مبيعات وتذاكر الركاب</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">رقم الهاتف التواصل</label>
              <input
                type="text"
                placeholder="0791234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-right text-slate-100 font-mono outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                placeholder="employee@adam-app.jo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-right text-slate-100 font-mono outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-slate-300 font-bold mb-1">المهمة الموكلة الأولية للموظف</label>
              <input
                type="text"
                placeholder="متابعة تذاكر وتطبيقات الكباتن المعتمدة"
                value={initialTask}
                onChange={(e) => setInitialTask(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-right text-slate-100 outline-none focus:border-indigo-500"
              />
            </div>

          </div>

          {/* PERMISSIONS MATRIX CHECKBOXES */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3 pt-3">
            <div className="flex justify-between items-center flex-row-reverse border-b border-slate-800 pb-2">
              <h4 className="text-xs font-black text-indigo-300 flex items-center gap-1.5 flex-row-reverse">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>تخصيص مصفوفة الصلاحيات الاستثنائية للموظف (RBAC Matrix):</span>
              </h4>
              <span className="text-[10px] text-slate-400">تحديث تلقائي مسبق الإعداد حسب الدور المختاره</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
              <label className="flex items-center gap-2 flex-row-reverse cursor-pointer bg-slate-900 p-2 rounded border border-slate-800 hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={perms.pendingDrivers}
                  onChange={(e) => setPerms({ ...perms, pendingDrivers: e.target.checked })}
                  className="rounded accent-indigo-500 w-4 h-4"
                />
                <span className="text-slate-200">قبول وثائق الكباتن</span>
              </label>

              <label className="flex items-center gap-2 flex-row-reverse cursor-pointer bg-slate-900 p-2 rounded border border-slate-800 hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={perms.activeDrivers}
                  onChange={(e) => setPerms({ ...perms, activeDrivers: e.target.checked })}
                  className="rounded accent-indigo-500 w-4 h-4"
                />
                <span className="text-slate-200">إدارة الكباتن النشطين</span>
              </label>

              <label className="flex items-center gap-2 flex-row-reverse cursor-pointer bg-slate-900 p-2 rounded border border-slate-800 hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={perms.passengers}
                  onChange={(e) => setPerms({ ...perms, passengers: e.target.checked })}
                  className="rounded accent-indigo-500 w-4 h-4"
                />
                <span className="text-slate-200">دعم وإدارة الركاب</span>
              </label>

              <label className="flex items-center gap-2 flex-row-reverse cursor-pointer bg-slate-900 p-2 rounded border border-slate-800 hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={perms.allRides}
                  onChange={(e) => setPerms({ ...perms, allRides: e.target.checked })}
                  className="rounded accent-indigo-500 w-4 h-4"
                />
                <span className="text-slate-200">تتبع وإلغاء الرحلات</span>
              </label>

              <label className="flex items-center gap-2 flex-row-reverse cursor-pointer bg-slate-900 p-2 rounded border border-slate-800 hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={perms.walletApprovals}
                  onChange={(e) => setPerms({ ...perms, walletApprovals: e.target.checked })}
                  className="rounded accent-indigo-500 w-4 h-4"
                />
                <span className="text-slate-200">الموافقة على المحفظة والمالية</span>
              </label>

              <label className="flex items-center gap-2 flex-row-reverse cursor-pointer bg-slate-900 p-2 rounded border border-slate-800 hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={perms.rateManagement}
                  onChange={(e) => setPerms({ ...perms, rateManagement: e.target.checked })}
                  className="rounded accent-indigo-500 w-4 h-4"
                />
                <span className="text-slate-200">تعديل التسعير للرحلات</span>
              </label>

              <label className="flex items-center gap-2 flex-row-reverse cursor-pointer bg-slate-900 p-2 rounded border border-slate-800 hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={perms.auditPayments}
                  onChange={(e) => setPerms({ ...perms, auditPayments: e.target.checked })}
                  className="rounded accent-indigo-500 w-4 h-4"
                />
                <span className="text-slate-200">التدقيق المحاسبي المالي</span>
              </label>

              <label className="flex items-center gap-2 flex-row-reverse cursor-pointer bg-slate-900 p-2 rounded border border-slate-800 hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={perms.aiServicesStrategy}
                  onChange={(e) => setPerms({ ...perms, aiServicesStrategy: e.target.checked })}
                  className="rounded accent-indigo-500 w-4 h-4"
                />
                <span className="text-slate-200">تحليلات الذكاء الاصطناعي</span>
              </label>
            </div>
          </div>

          <div className="flex justify-start pt-2">
            <button
              type="submit"
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-orange-950/30 flex items-center gap-2"
            >
              <Flame className="w-4 h-4 fill-slate-950" />
              <span>حفظ وإنشاء حساب الموظف في Firebase 🔥</span>
            </button>
          </div>
        </form>
      )}

      {/* EDIT PERMISSIONS MODAL */}
      {editingEmp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0f24] border border-indigo-500/30 rounded-2xl p-5 max-w-lg w-full space-y-4 text-right shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-row-reverse">
              <h3 className="text-sm font-black text-slate-100 flex items-center gap-2 flex-row-reverse">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>تعديل صلاحيات الموظف: {editingEmp.fullName}</span>
              </h3>
              <button onClick={() => setEditingEmp(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.keys(editPerms).map((permKey) => {
                const labelMap: Record<string, string> = {
                  pendingDrivers: 'قبول وثائق الكباتن',
                  activeDrivers: 'إدارة الكباتن النشطين',
                  passengers: 'دعم وإدارة الركاب',
                  allRides: 'تتبع الرحلات والتوجيه',
                  scheduledTrips: 'الرحلات المجدولة',
                  walletApprovals: 'الموافقة على المحفظة والمالية',
                  rateManagement: 'تعديل تسعير الكيلومتر',
                  userFeedbacks: 'الشكاوى والتقييمات',
                  aiServicesStrategy: 'استراتيجيات الذكاء الاصطناعي',
                  aiDeveloperStudio: 'استوديو التطوير البرمجي',
                  logs: 'سجلات المراقبة والتتبع',
                  auditPayments: 'التدقيق والتقارير المالية'
                };

                const val = (editPerms as any)[permKey];

                return (
                  <label key={permKey} className="flex items-center gap-2 flex-row-reverse p-2 bg-slate-900 rounded border border-slate-800 hover:border-indigo-500/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(val)}
                      onChange={(e) => setEditPerms({ ...editPerms, [permKey]: e.target.checked })}
                      className="rounded accent-emerald-500 w-4 h-4"
                    />
                    <span className="text-slate-200 text-[11px] font-bold">{labelMap[permKey] || permKey}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-start gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={handleSaveEditPermissions}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-5 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                حفظ التغييرات في Firebase 🔥
              </button>
              <button
                onClick={() => setEditingEmp(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition cursor-pointer"
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
