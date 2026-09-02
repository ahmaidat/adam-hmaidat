import React, { useState } from 'react';
import { useAppState } from '../stateEngine';
import { Passenger } from '../types';
import { User, Trash2, Edit3, Check, X, BadgePlus, Coins, ShieldCheck, Mail, Phone } from 'lucide-react';

export const MasterPassengerCrud: React.FC = () => {
  const { passengers, drivers, requests, rides, messages, settings, scheduledTrips, walletTransactions, saveState, t, enabledCountries } = useAppState();

  const [editingPassengerId, setEditingPassengerId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Edit states
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editStatus, setEditStatus] = useState<'pending' | 'approved'>('approved');
  const [editBalance, setEditBalance] = useState(30.0);
  const [editCountry, setEditCountry] = useState('JO');
  const [editServiceScope, setEditServiceScope] = useState<'all' | 'intracity' | 'intercity' | 'scheduled'>('all');
  const [editAllowedServices, setEditAllowedServices] = useState<('intracity' | 'intercity' | 'scheduled')[]>(['intracity', 'intercity', 'scheduled']);

  // Add states
  const [addUsername, setAddUsername] = useState('');
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('079');
  const [addEmail, setAddEmail] = useState('');
  const [addBalance, setAddBalance] = useState(25.0);
  const [addCountry, setAddCountry] = useState('JO');
  const [addServiceScope, setAddServiceScope] = useState<'all' | 'intracity' | 'intercity' | 'scheduled'>('all');
  const [addAllowedServices, setAddAllowedServices] = useState<('intracity' | 'intercity' | 'scheduled')[]>(['intracity', 'intercity', 'scheduled']);

  const [showAddForm, setShowAddForm] = useState(false);

  const handleEditClick = (psg: Passenger) => {
    setEditingPassengerId(psg.id);
    setEditName(psg.fullName);
    setEditPhone(psg.phone);
    setEditEmail(psg.email);
    setEditStatus(psg.status);
    setEditBalance(psg.balance);
    setEditCountry(psg.country || 'JO');
    setEditServiceScope(psg.serviceScope || 'all');
    setEditAllowedServices(psg.allowedServices && psg.allowedServices.length > 0 ? psg.allowedServices : ['intracity', 'intercity', 'scheduled']);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      alert(t('من فضلك ادخل اسم الراكب الكامل', 'Please enter passenger full name'));
      return;
    }

    const updated = passengers.map(p => {
      if (p.id === id) {
        return {
          ...p,
          fullName: editName.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim(),
          status: editStatus,
          balance: Number(editBalance),
          country: editCountry,
          serviceScope: editServiceScope,
          allowedServices: editAllowedServices
        };
      }
      return p;
    });

    saveState(drivers, updated, requests, rides, messages, settings, scheduledTrips, walletTransactions);
    setEditingPassengerId(null);
    setSuccessMsg(t('✓ تم تحديث وحفظ بيانات الراكب وصلاحيات الخدمات بنجاح!', '✓ Successfully saved and live-updated Passenger details!'));
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeletePassenger = (id: string, name: string) => {
    if (window.confirm(t(`هل انت متأكد من رغبتك بالمسح النهائي لملف الراكب "${name}"؟`, `Delete Passenger record "${name}" from the system permanently?`))) {
      const filtered = passengers.filter(p => p.id !== id);
      saveState(drivers, filtered, requests, rides, messages, settings, scheduledTrips, walletTransactions);
      setSuccessMsg(t('تم حذف ملف الراكب بنجاح', 'Passenger deleted successfully'));
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!addUsername.trim() || !addName.trim()) {
      setErrorMsg(t('يرجى كتابة اسم المستخدم والاسم الكامل!', 'Please specify both username and full name'));
      return;
    }

    const exists = passengers.some(p => p.username.toLowerCase() === addUsername.trim().toLowerCase());
    if (exists) {
      setErrorMsg(t('اسم المستخدم هذا للراكب مسجل بالمنظومة مسبقاً!', 'This passenger username already exists!'));
      return;
    }

    const newPassenger: Passenger = {
      id: 'psg_' + Date.now(),
      username: addUsername.trim().toLowerCase(),
      fullName: addName.trim(),
      phone: addPhone.trim(),
      email: addEmail.trim() || `${addUsername}@gmail.com`,
      status: 'approved',
      currentLocation: { x: 195, y: 185, name: 'الدوار السابع' },
      activeRideId: null,
      ratingAverage: 5.0,
      tripsCount: 0,
      balance: Number(addBalance),
      country: addCountry,
      serviceScope: addServiceScope,
      allowedServices: addAllowedServices,
      documents: {
        idFront: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=150',
        idBack: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=150',
        photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150'
      }
    };

    saveState(drivers, [...passengers, newPassenger], requests, rides, messages, settings, scheduledTrips, walletTransactions);
    
    // clear form
    setAddUsername('');
    setAddName('');
    setAddPhone('079');
    setAddEmail('');
    setAddBalance(25.0);
    setAddCountry('JO');
    setShowAddForm(false);
    setSuccessMsg(t('✓ تم تسجيل وإدراج الراكب الجديد بنجاح في النظام!', '✓ Successfully created new simulated Passenger!'));
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold p-3 rounded-lg text-xs text-center animate-pulse">
          {successMsg}
        </div>
      )}

      {/* Action Header */}
      <div className="flex justify-between items-center bg-slate-900/10 p-2 border-b border-slate-800">
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
        >
          <BadgePlus className="w-3.5 h-3.5" />
          <span>{showAddForm ? t('إلغاء الإضافة', 'Cancel Add') : t('إضافة راكب جديد لتجريب محاكاة الطلبات 👤', 'Add Simulated Passenger 👤')}</span>
        </button>
        <span className="text-xs font-bold text-slate-350">
          {t(`عدد ركاب ومسافري آدم: ${passengers.length} راكب`, `Total Registered Passengers: ${passengers.length}`)}
        </span>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-[#0c142c]/70 p-4 rounded-xl border border-rose-500/20 space-y-4">
          <h3 className="text-xs font-black text-rose-400 flex items-center justify-end gap-1.5 border-b border-slate-800 pb-2">
            <span>{t('إدراج وتسجيل راكب جديد للنظام فورا', 'Register a New Passenger with Trial Wallet')}</span>
            <User className="w-4 h-4 text-rose-400" />
          </h3>

          {errorMsg && (
            <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-xs p-2 rounded text-center">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">{t('اسم مستخدم الراكب (للدخول):', 'Passenger Username:')}</label>
              <input 
                type="text" required placeholder="مثال: custom_passenger" value={addUsername} onChange={(e) => setAddUsername(e.target.value)}
                className="w-full bg-[#05070e] border border-slate-800 rounded p-2 text-right"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{t('اسم الراكب الكامل بالهوية:', 'Passenger Full Name:')}</label>
              <input 
                type="text" required placeholder="مثال: ياسمين عمر حجاوي" value={addName} onChange={(e) => setAddName(e.target.value)}
                className="w-full bg-[#05070e] border border-slate-800 rounded p-2 text-right"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{t('رقم الموبايل للتواصل:', 'Contact Mobile Phone:')}</label>
              <input 
                type="text" required value={addPhone} onChange={(e) => setAddPhone(e.target.value)}
                className="w-full bg-[#05070e] border border-slate-800 rounded p-2 text-right"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{t('رصيد المحفظة المبدئي:', 'Initial Wallet Balance:')}</label>
              <input 
                type="number" required value={addBalance} onChange={(e) => setAddBalance(Number(e.target.value))}
                className="w-full bg-[#05070e] border border-slate-800 rounded p-2 text-right"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{t('الدولة المحددة للراكب:', 'Passenger Country:')}</label>
              <select 
                value={addCountry} 
                onChange={(e) => setAddCountry(e.target.value)}
                className="w-full bg-[#05070e] border border-slate-800 rounded p-2 text-right text-slate-350"
              >
                {enabledCountries.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.nameAr} ({c.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Service Permissions for Passenger */}
          <div className="bg-[#05070e]/60 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="text-[11px] font-bold text-rose-400">🛡️ {t('صلاحيات ونطاق الخدمات الممنوحة للراكب:', 'Allowed Services for Passenger:')}</span>
              <span className="text-[10px] text-slate-400 font-sans">
                {addServiceScope === 'all' ? '✨ جميع الخدمات' : addServiceScope === 'intracity' ? '🏢 داخل المدينة' : addServiceScope === 'intercity' ? '🛣️ بين المحافظات' : '⏰ رحلات مجدولة'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setAddServiceScope('all');
                  setAddAllowedServices(['intracity', 'intercity', 'scheduled']);
                }}
                className={`p-2 rounded-lg border text-center font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  addServiceScope === 'all'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>✨</span>
                <span>جميع الخدمات</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAddServiceScope('intracity');
                  setAddAllowedServices(['intracity']);
                }}
                className={`p-2 rounded-lg border text-center font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  addServiceScope === 'intracity'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🏢</span>
                <span>داخل المدينة</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAddServiceScope('intercity');
                  setAddAllowedServices(['intercity']);
                }}
                className={`p-2 rounded-lg border text-center font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  addServiceScope === 'intercity'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🛣️</span>
                <span>بين المحافظات</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAddServiceScope('scheduled');
                  setAddAllowedServices(['scheduled']);
                }}
                className={`p-2 rounded-lg border text-center font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  addServiceScope === 'scheduled'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>⏰</span>
                <span>رحلات مجدولة</span>
              </button>
            </div>
          </div>

          <button 
            type="submit"
            className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg font-bold text-xs cursor-pointer"
          >
            {t('تأكيد وإدراج الراكب', 'Confirm & Insert Passenger')}
          </button>
        </form>
      )}

      {/* Directory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {passengers.map(psg => (
          <div key={psg.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 transition-all space-y-3">
            
            <div className="flex justify-between items-start flex-row-reverse border-b border-slate-850 pb-2">
              <div className="flex items-center gap-2 flex-row-reverse">
                <img 
                  src={psg.documents.photo || 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150'} 
                  alt={psg.fullName} 
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full object-cover border border-slate-750" 
                />
                <div className="text-right">
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1 justify-end flex-row-reverse">
                    <span>{psg.fullName}</span>
                    <span className="text-[10px] text-slate-500">(@{psg.username})</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">📱 {psg.phone}</p>
                </div>
              </div>

              <span className="text-[9px] px-2 py-0.5 rounded font-black uppercase bg-rose-950/40 text-rose-400 border border-rose-900">
                {t('تم التدقيق والمصادقة', 'Approved')}
              </span>
            </div>

            {editingPassengerId === psg.id ? (
              <div className="bg-[#05070e] p-3 rounded-lg border border-slate-800 space-y-3 text-xs">
                <p className="text-[10px] text-rose-400 font-black border-b border-slate-900 pb-1">⚙️ {t('تعديل حقول ملف الراكب وحساب المحفظة:', 'Edit Passenger Fields:')}</p>
                
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="block text-slate-400 mb-0.5">{t('الاسم بالكامل:', 'Full Name:')}</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-[#0c142c] border border-slate-700/85 rounded px-2 py-1 text-slate-200 text-right"/>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">{t('رقم الهاتف للتواصل:', 'Phone:')}</label>
                    <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full bg-[#0c142c] border border-slate-700/85 rounded px-2 py-1 text-slate-200 text-right"/>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">{t('البريد الإلكتروني للراكب:', 'Email:')}</label>
                    <input type="text" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full bg-[#0c142c] border border-slate-700/85 rounded px-2 py-1 text-slate-200 text-right"/>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">{t('رصيد المحفظة الحالي (د.أ):', 'Wallet Balance (JD):')}</label>
                    <input type="number" value={editBalance} onChange={(e) => setEditBalance(Number(e.target.value))} className="w-full bg-[#0c142c] border border-slate-700/85 rounded px-2 py-1 text-slate-200 text-right"/>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 border-t border-slate-900 pt-2">
                  <div className="flex gap-2 items-center">
                    <label className="text-slate-400 text-[10px]">{t('حالة حساب الراكب الأردني:', 'Account Verification status:')}</label>
                    <select 
                      value={editStatus} 
                      onChange={(e: any) => setEditStatus(e.target.value)}
                      className="bg-[#0c142c] border border-slate-700 text-slate-200 rounded px-2 py-1 text-[11px] text-right"
                    >
                      <option value="approved">{t('مفعل وتدقيق هوية كامل (Verified)', 'Verified')}</option>
                      <option value="pending">{t('تحت المراجعة والتدقيق الهوياتي (Pending)', 'Pending')}</option>
                    </select>
                  </div>
                  <div className="flex gap-2 items-center">
                    <label className="text-slate-400 text-[10px]">{t('تعديل الدولة واستثنائها:', 'Override Country:')}</label>
                    <select 
                      value={editCountry} 
                      onChange={(e: any) => setEditCountry(e.target.value)}
                      className="bg-[#0c142c] border border-slate-700 text-slate-200 rounded px-2 py-1 text-[11px] text-right"
                    >
                      {enabledCountries.map(c => (
                        <option key={c.code} value={c.code}>{c.flag} {c.nameAr} ({c.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Edit Service Permissions for Passenger */}
                <div className="bg-[#080d1a] p-2.5 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center flex-row-reverse">
                    <span className="text-[11px] font-bold text-rose-400">🛡️ {t('صلاحيات ونطاق الخدمات الممنوحة للراكب:', 'Service Permissions:')}</span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      {editServiceScope === 'all' ? '✨ جميع الخدمات' : editServiceScope === 'intracity' ? '🏢 داخل المدينة' : editServiceScope === 'intercity' ? '🛣️ بين المحافظات' : '⏰ رحلات مجدولة'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setEditServiceScope('all');
                        setEditAllowedServices(['intracity', 'intercity', 'scheduled']);
                      }}
                      className={`p-1.5 rounded-lg border text-center font-bold text-[11px] transition cursor-pointer flex items-center justify-center gap-1 ${
                        editServiceScope === 'all'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>✨</span>
                      <span>جميع الخدمات</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditServiceScope('intracity');
                        setEditAllowedServices(['intracity']);
                      }}
                      className={`p-1.5 rounded-lg border text-center font-bold text-[11px] transition cursor-pointer flex items-center justify-center gap-1 ${
                        editServiceScope === 'intracity'
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>🏢</span>
                      <span>داخل المدينة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditServiceScope('intercity');
                        setEditAllowedServices(['intercity']);
                      }}
                      className={`p-1.5 rounded-lg border text-center font-bold text-[11px] transition cursor-pointer flex items-center justify-center gap-1 ${
                        editServiceScope === 'intercity'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>🛣️</span>
                      <span>بين المحافظات</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditServiceScope('scheduled');
                        setEditAllowedServices(['scheduled']);
                      }}
                      className={`p-1.5 rounded-lg border text-center font-bold text-[11px] transition cursor-pointer flex items-center justify-center gap-1 ${
                        editServiceScope === 'scheduled'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>⏰</span>
                      <span>رحلات مجدولة</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 justify-start pt-1">
                  <button 
                    type="button" onClick={() => handleSaveEdit(psg.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded text-xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('حفظ التغييرات', 'Save Changes')}</span>
                  </button>
                  <button 
                    type="button" onClick={() => setEditingPassengerId(null)}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-3 py-1 rounded text-xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{t('إلغاء التعديل', 'Cancel')}</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 md:grid-cols-2 gap-2 bg-[#05070e]/40 p-2.5 rounded-lg text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[9px]">{t('رصيد المحفظة الفعلي:', 'Wallet Balance:')}</span>
                    <span className="font-extrabold text-emerald-400 font-mono">💵 {psg.balance.toFixed(2)} JD</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">{t('البريد الإلكتروني المخدم:', 'Email address:')}</span>
                    <span className="font-medium text-slate-200">{psg.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">{t('تعداد الرحلات والتقييم:', 'Total Rides completed:')}</span>
                    <span className="font-bold">⭐ {psg.ratingAverage.toFixed(1)} ({psg.tripsCount} {t('رحلات تشاركية', 'joined')})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">{t('معرف الكابتن / النشاط:', 'Active Ride ID:')}</span>
                    <span className="text-slate-400 font-mono text-[10px]">{psg.activeRideId || t('مستقر وبلا طلبات', 'No active pooled runs')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">{t('الدولة النشطة للراكب:', 'Active Country:')}</span>
                    <span className="font-bold text-slate-200">
                      {(() => {
                        const c = enabledCountries.find(x => x.code === psg.country);
                        return c ? `${c.flag} ${c.nameAr} (${c.code})` : `🇯🇴 الأردن (JO)`;
                      })()}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-850 flex items-center justify-between flex-row-reverse col-span-2">
                    <span className="text-[10px] font-bold text-rose-400">🛡️ {t('الخدمات المتاحة للراكب:', 'Allowed Services:')}</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-rose-950/50 border border-rose-500/30 text-rose-300">
                      {psg.serviceScope === 'intracity' ? '🏢 داخل المدينة فقط' : psg.serviceScope === 'intercity' ? '🛣️ بين المحافظات فقط' : psg.serviceScope === 'scheduled' ? '⏰ رحلات مجدولة فقط' : '✨ جميع الخدمات (مفتوح)'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 justify-start items-center pt-1">
                  <button 
                    onClick={() => handleEditClick(psg)}
                    className="bg-indigo-950 hover:bg-slate-800 text-indigo-300 px-3 py-1 rounded border border-indigo-900/60 transition flex items-center gap-1 cursor-pointer text-[10px]"
                  >
                    <Edit3 className="w-3 h-3 text-indigo-400" />
                    <span>{t('تحرير حقول الراكب والمالية', 'Edit Wallet & Fields')}</span>
                  </button>
                  <button 
                    onClick={() => handleDeletePassenger(psg.id, psg.fullName)}
                    className="text-red-400 hover:bg-red-955 px-2 py-1 rounded transition flex items-center gap-1 cursor-pointer text-[10px]"
                    title={t('حذف الراكب', 'Delete Passenger')}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{t('مسح السجل', 'Delete Record')}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

    </div>
  );
};
