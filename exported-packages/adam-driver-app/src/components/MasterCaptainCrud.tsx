import React, { useState, useEffect } from 'react';
import { useAppState } from '../stateEngine';
import { Driver, DEFAULT_JORDAN_VEHICLES } from '../types';
import { UserCheck, ShieldAlert, BadgePlus, Trash2, Edit3, Check, X, ShieldCheck, Car, Coins } from 'lucide-react';

export const MasterCaptainCrud: React.FC = () => {
  const { drivers, passengers, requests, rides, messages, settings, scheduledTrips, walletTransactions, saveState, t, enabledCountries } = useAppState();

  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // AI-powered vehicle dropdown state
  const [vehicleData, setVehicleData] = useState<{ name: string, models: string[] }[]>(DEFAULT_JORDAN_VEHICLES);
  const [editBrandSel, setEditBrandSel] = useState<string>('');
  const [editModelSel, setEditModelSel] = useState<string>('');
  const [addBrandSel, setAddBrandSel] = useState<string>('');
  const [addModelSel, setAddModelSel] = useState<string>('');

  useEffect(() => {
    fetch('/api/get-vehicles')
      .then(res => {
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return null;
        return res.json().catch(() => null);
      })
      .then(data => {
        if (data && data.success && data.brands && data.brands.length > 0) {
          setVehicleData(data.brands);
        }
      })
      .catch(() => {
        // Keep default vehicles gracefully
      });
  }, []);

  // Edit states
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPlate, setEditPlate] = useState('');
  const [editCarType, setEditCarType] = useState('');
  const [editCarModel, setEditCarModel] = useState(2023);
  const [editLicenseExpiry, setEditLicenseExpiry] = useState('');
  const [editRegistrationExpiry, setEditRegistrationExpiry] = useState('');
  const [editNoCriminal, setEditNoCriminal] = useState(true);
  const [editStatus, setEditStatus] = useState<'pending' | 'approved' | 'blocked'>('approved');
  const [editBalance, setEditBalance] = useState(20.0);
  const [editIsOnline, setEditIsOnline] = useState(false);
  const [editGov, setEditGov] = useState('عمان');
  const [editCountry, setEditCountry] = useState('JO');

  // Add states
  const [addUsername, setAddUsername] = useState('');
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('079');
  const [addEmail, setAddEmail] = useState('');
  const [addCarType, setAddCarType] = useState('');
  const [addPlate, setAddPlate] = useState('');
  const [addCarModel, setAddCarModel] = useState(2024);
  const [addGov, setAddGov] = useState('عمان (Amman)');
  const [addCountry, setAddCountry] = useState('JO');

  const [showAddForm, setShowAddForm] = useState(false);

  const handleEditClick = (driver: Driver) => {
    setEditingDriverId(driver.id);
    setEditName(driver.fullName);
    setEditPhone(driver.phone);
    setEditEmail(driver.email);
    setEditPlate(driver.carPlate);
    setEditCarType(driver.carType);
    setEditCarModel(driver.carModel);
    setEditLicenseExpiry(driver.licenseExpiry);
    setEditRegistrationExpiry(driver.carRegistrationExpiry);
    setEditNoCriminal(driver.noCriminalRecord);
    setEditStatus(driver.status);
    setEditBalance(driver.balance);
    setEditIsOnline(driver.isOnline);
    setEditGov(driver.governorate);
    setEditCountry(driver.country || 'JO');

    // Try matching brand and model in loaded vehicleData
    let matchedBrand = '';
    let matchedModel = '';
    if (vehicleData && vehicleData.length > 0) {
      for (const b of vehicleData) {
        if (b.models.includes(driver.carType)) {
          matchedBrand = b.name;
          matchedModel = driver.carType;
          break;
        }
      }
      if (!matchedBrand) {
        for (const b of vehicleData) {
          const found = b.models.find(m => 
            m.toLowerCase().includes(driver.carType.toLowerCase()) || 
            driver.carType.toLowerCase().includes(m.toLowerCase())
          );
          if (found) {
            matchedBrand = b.name;
            matchedModel = found;
            break;
          }
        }
      }
    }

    if (matchedBrand) {
      setEditBrandSel(matchedBrand);
      setEditModelSel(matchedModel);
    } else {
      setEditBrandSel('custom');
      setEditModelSel('custom');
    }
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      alert(t('الرجاء إدخال الاسم الكامل للكابتن!', 'Please enter full driver name!'));
      return;
    }

    const updated = drivers.map(d => {
      if (d.id === id) {
        return {
          ...d,
          fullName: editName.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim(),
          carPlate: editPlate.trim(),
          carType: editCarType.trim(),
          carModel: Number(editCarModel),
          licenseExpiry: editLicenseExpiry,
          carRegistrationExpiry: editRegistrationExpiry,
          noCriminalRecord: editNoCriminal,
          status: editStatus,
          balance: Number(editBalance),
          isOnline: editIsOnline,
          governorate: editGov,
          country: editCountry
        };
      }
      return d;
    });

    saveState(updated, passengers, requests, rides, messages, settings, scheduledTrips, walletTransactions);
    setEditingDriverId(null);
    setSuccessMsg(t('✓ تم تعديل بيانات ملف الكابتن وحفظ التعديلات حياً!', '✓ Successfully modified and live-saved Captain profile parameters!'));
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeleteDriver = (id: string, name: string) => {
    if (window.confirm(t(`هل أنت متأكد من رغبتك بالمسح النهائي للكابتن "${name}" من النظام بشكل كامل؟`, `Are you sure you want to permanently delete Captain "${name}" from the system?`))) {
      const filtered = drivers.filter(d => d.id !== id);
      saveState(filtered, passengers, requests, rides, messages, settings, scheduledTrips, walletTransactions);
      setSuccessMsg(t('تم حذف ملف الكابتن بنجاح', 'Captain deleted successfully'));
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!addUsername.trim() || !addName.trim()) {
      setErrorMsg(t('يرجى كتابة اسم المستخدم والاسم الكامل!', 'Please provide username and full name!'));
      return;
    }

    const exists = drivers.some(d => d.username.toLowerCase() === addUsername.trim().toLowerCase());
    if (exists) {
      setErrorMsg(t('اسم المستخدم للكابتن هذا مستخدم سابقاً!', 'This Captain username is already taken!'));
      return;
    }

    const newDriver: Driver = {
      id: 'drv_' + Date.now(),
      username: addUsername.trim().toLowerCase(),
      fullName: addName.trim(),
      phone: addPhone.trim(),
      email: addEmail.trim() || `${addUsername}@gmail.com`,
      licenseExpiry: '2029-12-31',
      carType: addCarType.trim() || 'كيا سيراتو (Kia Cerato)',
      carClass: 'سيدان هجين (Comfort)',
      carPlate: addPlate.trim() || '44-98442',
      carModel: Number(addCarModel),
      carRegistrationExpiry: '2029-12-31',
      noCriminalRecord: true,
      governorate: addGov,
      district: 'امتداد قصبة عمان',
      status: 'approved',
      isOnline: false,
      balance: 15.0,
      country: addCountry,
      currentLocation: { x: 200, y: 200, name: 'الدوار السابع' },
      activeRideId: null,
      ratingAverage: 5.0,
      tripsCount: 0,
      documents: {
        idFront: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=150',
        idBack: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=150',
        licenseFront: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
        licenseBack: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
        carRegFront: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?w=150',
        carRegBack: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?w=150',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      }
    };

    saveState([...drivers, newDriver], passengers, requests, rides, messages, settings, scheduledTrips, walletTransactions);
    
    // reset form
    setAddUsername('');
    setAddName('');
    setAddPhone('079');
    setAddCarType('');
    setAddPlate('');
    setAddCarModel(2024);
    setAddCountry('JO');
    setShowAddForm(false);
    setSuccessMsg(t('✓ تم تسجيل وإدراج كابتن جديد بنجاح في النظام!', '✓ Successfully created new custom Captain!'));
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* Messages */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold p-3 rounded-lg text-xs text-center">
          {successMsg}
        </div>
      )}

      {/* Button to show Add Form */}
      <div className="flex justify-between items-center bg-slate-900/10 p-2 border-b border-slate-800">
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
        >
          <BadgePlus className="w-3.5 h-3.5" />
          <span>{showAddForm ? t('إلغاء الإضافة', 'Cancel Add') : t('إضافة كابتن محاكي جديد 🚕', 'Add New Simulated Captain 🚕')}</span>
        </button>
        <span className="text-xs font-bold text-slate-300">
          {t(`عدد الكباتن حالياً: ${drivers.length} كابتن`, `Total Captains Active: ${drivers.length}`)}
        </span>
      </div>

      {/* Add New Captain Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-[#0c142c]/70 p-4 rounded-xl border border-amber-500/25 space-y-4">
          <h3 className="text-xs font-black text-amber-400 flex items-center justify-end gap-1.5 border-b border-slate-800 pb-2">
            <span>{t('إضافة كابتن محاكي جديد للأردن (تأكيد التسجيل الفوري)', 'Register a New Simulated Captain with Live State')}</span>
            <Car className="w-4 h-4" />
          </h3>

          {errorMsg && (
            <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-xs p-2 rounded text-center">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">{t('اسم مستخدم الكابتن (للدخول):', 'Driver Username (for login):')}</label>
              <input 
                type="text" required placeholder="مثال: sameer_d" value={addUsername} onChange={(e) => setAddUsername(e.target.value)}
                className="w-full bg-[#05070e] border border-slate-800 rounded p-2 text-right"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{t('الاسم الكامل الثلاثي:', 'Driver Full Name:')}</label>
              <input 
                type="text" required placeholder="مثال: سمير عبد الفتاح المومني" value={addName} onChange={(e) => setAddName(e.target.value)}
                className="w-full bg-[#05070e] border border-slate-800 rounded p-2 text-right"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{t('رقم الموبايل الأردني (07X):', 'Jordan Mobile Phone (07X):')}</label>
              <input 
                type="text" required value={addPhone} onChange={(e) => setAddPhone(e.target.value)}
                className="w-full bg-[#05070e] border border-slate-800 rounded p-2 text-right"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{t('موديل وسنة صنع المركبة:', 'Car Production Year:')}</label>
              <input 
                type="number" required value={addCarModel} onChange={(e) => setAddCarModel(Number(e.target.value))}
                className="w-full bg-[#05070e] border border-slate-800 rounded p-2 text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="md:col-span-2 bg-[#05070e]/40 p-2 rounded-lg border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-bold text-amber-400 block">🤖 {t('تكامل الذكاء الاصطناعي لاختيار المركبة:', 'AI-Powered Vehicle Selection:')}</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-0.5 text-[10px]">{t('الماركة / الشركة المصنعة:', 'Car Brand:')}</label>
                  <select 
                    value={addBrandSel} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setAddBrandSel(val);
                      if (val !== 'custom' && val !== '') {
                        const bObj = vehicleData.find(b => b.name === val);
                        if (bObj && bObj.models.length > 0) {
                          setAddModelSel(bObj.models[0]);
                          setAddCarType(bObj.models[0]);
                        }
                      } else {
                        setAddModelSel('custom');
                        setAddCarType('');
                      }
                    }}
                    className="w-full bg-[#05070e] border border-slate-800 rounded p-1.5 text-slate-200 text-right text-[11px]"
                  >
                    <option value="">-- {t('اختر ماركة السيارة', 'Select Car Brand')} --</option>
                    {vehicleData.map(brand => (
                      <option key={brand.name} value={brand.name}>{brand.name}</option>
                    ))}
                    <option value="custom">✍️ {t('كتابة يدوية / أخرى', 'Custom / Manual Entry')}</option>
                  </select>
                </div>

                {addBrandSel && addBrandSel !== 'custom' && (
                  <div>
                    <label className="block text-slate-400 mb-0.5 text-[10px]">{t('موديل وطراز المركبة:', 'Car Model:')}</label>
                    <select 
                      value={addModelSel} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setAddModelSel(val);
                        if (val !== 'custom') {
                          setAddCarType(val);
                        }
                      }}
                      className="w-full bg-[#05070e] border border-slate-800 rounded p-1.5 text-slate-200 text-right text-[11px]"
                    >
                      {vehicleData.find(b => b.name === addBrandSel)?.models.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                      <option value="custom">✍️ {t('طراز مخصص آخر', 'Other custom model')}</option>
                    </select>
                  </div>
                )}
              </div>

              {(addBrandSel === 'custom' || addModelSel === 'custom') && (
                <div className="pt-1">
                  <label className="block text-slate-400 mb-0.5 text-[10px]">{t('اسم وطراز المركبة اليدوي:', 'Manual Car Brand/Model:')}</label>
                  <input 
                    type="text" 
                    value={addCarType} 
                    onChange={(e) => setAddCarType(e.target.value)} 
                    placeholder="مثال: تويوتا بريوس (Toyota Prius)"
                    className="w-full bg-[#05070e] border border-slate-800 rounded p-1.5 text-slate-200 text-right text-[11px]"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{t('رقم لوحة المركبة وجمركها الأردني:', 'License Plate Number:')}</label>
              <input 
                type="text" placeholder="مثال: 12-89234" value={addPlate} onChange={(e) => setAddPlate(e.target.value)}
                className="w-full bg-[#05070e] border border-slate-800 rounded p-2 text-right"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{t('المحافظة المركزية للعمل والتحميل:', 'Operation Governorate Place:')}</label>
              <select 
                value={addGov} onChange={(e) => setAddGov(e.target.value)}
                className="w-full bg-[#05070e] border border-slate-800 rounded p-2 text-right text-slate-350"
              >
                <option value="عمان (Amman)">عمان (Amman)</option>
                <option value="إربد (Irbid)">إربد (Irbid)</option>
                <option value="الزرقاء (Zarqa)">الزرقاء (Zarqa)</option>
                <option value="العقبة (Aqaba)">العقبة (Aqaba)</option>
                <option value="البلقاء (Salt)">البلقاء (Salt)</option>
                <option value="جرش (Jerash)">جرش (Jerash)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{t('الدولة المحددة للكابتن للعمل:', 'Driver Active Country:')}</label>
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

          <button 
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-4 py-2 rounded-lg font-bold text-xs"
          >
            {t('تأكيد تسجيل الكابتن وإرسال المستندات للقبول', 'Approve Registration!')}
          </button>
        </form>
      )}

      {/* Directory List / Card Edits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {drivers.map(driver => (
          <div key={driver.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 transition-all space-y-3">
            
            {/* Driver title info */}
            <div className="flex justify-between items-start flex-row-reverse border-b border-slate-850 pb-2">
              <div className="flex items-center gap-2 flex-row-reverse">
                <img 
                  src={driver.documents.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                  alt={driver.fullName} 
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full object-cover border border-slate-750" 
                />
                <div className="text-right">
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1 justify-end flex-row-reverse">
                    <span>{driver.fullName}</span>
                    <span className="text-[10px] text-slate-500">(@{driver.username})</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">📱 {driver.phone} • {driver.governorate}</p>
                </div>
              </div>

              {/* Status flags */}
              <div className="flex flex-col items-start gap-1">
                <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${
                  driver.status === 'approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                  driver.status === 'blocked' ? 'bg-red-950 text-red-400 border border-red-900' :
                  'bg-amber-950 text-amber-400 border border-amber-900'
                }`}>
                  {driver.status === 'approved' ? t('نشط ومقبول', 'Active') : driver.status === 'blocked' ? t('محظور', 'Blocked') : t('تحت المراجعة', 'Pending')}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${driver.isOnline ? 'bg-indigo-950 text-indigo-400' : 'bg-slate-950 text-slate-500'}`}>
                  {driver.isOnline ? t('متصل رادار وبث', 'Online 📡') : t('غير متصل', 'Offline')}
                </span>
              </div>
            </div>

            {/* If currently editing this card, render full inputs */}
            {editingDriverId === driver.id ? (
              <div className="bg-[#05070e] p-3 rounded-lg border border-slate-800 space-y-3 text-xs">
                <p className="text-[10px] text-indigo-400 font-black border-b border-slate-900 pb-1">⚙️ {t('تحرير حقول كابتن حافلات وتاكسي آدم:', 'Edit Fields for this Driver Account:')}</p>
                
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="block text-slate-400 mb-0.5">{t('الاسم بالكامل:', 'Full Name:')}</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-[#0c142c] border border-slate-700/80 rounded px-2 py-1 text-slate-200 text-right"/>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">{t('رقم الهاتف:', 'Phone:')}</label>
                    <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full bg-[#0c142c] border border-slate-700/80 rounded px-2 py-1 text-slate-200 text-right"/>
                  </div>
                  
                  <div>
                    <label className="block text-slate-400 mb-0.5">{t('البريد الإلكتروني:', 'Email:')}</label>
                    <input type="text" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full bg-[#0c142c] border border-slate-700/80 rounded px-2 py-1 text-slate-200 text-right"/>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">{t('رقم اللوحة الأردنية:', 'Car Plate:')}</label>
                    <input type="text" value={editPlate} onChange={(e) => setEditPlate(e.target.value)} className="w-full bg-[#0c142c] border border-slate-700/80 rounded px-2 py-1 text-slate-200 text-right"/>
                  </div>

                  <div className="col-span-2 bg-[#080d1a] p-2 rounded-lg border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-amber-400 block">🤖 {t('تكامل الذكاء الاصطناعي لاختيار المركبة:', 'AI-Powered Vehicle Selection:')}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 mb-0.5 text-[10px]">{t('الماركة / الشركة المصنعة:', 'Car Brand:')}</label>
                        <select 
                          value={editBrandSel} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditBrandSel(val);
                            if (val !== 'custom' && val !== '') {
                              const bObj = vehicleData.find(b => b.name === val);
                              if (bObj && bObj.models.length > 0) {
                                setEditModelSel(bObj.models[0]);
                                setEditCarType(bObj.models[0]);
                              }
                            } else {
                              setEditModelSel('custom');
                            }
                          }}
                          className="w-full bg-[#0c142c] border border-slate-700/80 rounded px-2 py-1 text-slate-200 text-right text-[11px]"
                        >
                          <option value="">-- {t('اختر ماركة السيارة', 'Select Car Brand')} --</option>
                          {vehicleData.map(brand => (
                            <option key={brand.name} value={brand.name}>{brand.name}</option>
                          ))}
                          <option value="custom">✍️ {t('كتابة يدوية / أخرى', 'Custom / Manual Entry')}</option>
                        </select>
                      </div>

                      {editBrandSel && editBrandSel !== 'custom' && (
                        <div>
                          <label className="block text-slate-400 mb-0.5 text-[10px]">{t('موديل وطراز المركبة:', 'Car Model:')}</label>
                          <select 
                            value={editModelSel} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditModelSel(val);
                              if (val !== 'custom') {
                                setEditCarType(val);
                              }
                            }}
                            className="w-full bg-[#0c142c] border border-slate-700/80 rounded px-2 py-1 text-slate-200 text-right text-[11px]"
                          >
                            {vehicleData.find(b => b.name === editBrandSel)?.models.map(model => (
                              <option key={model} value={model}>{model}</option>
                            ))}
                            <option value="custom">✍️ {t('طراز مخصص آخر', 'Other custom model')}</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {(editBrandSel === 'custom' || editModelSel === 'custom') && (
                      <div className="pt-1">
                        <label className="block text-slate-400 mb-0.5 text-[10px]">{t('اسم وطراز المركبة اليدوي:', 'Manual Car Brand/Model:')}</label>
                        <input 
                          type="text" 
                          value={editCarType} 
                          onChange={(e) => setEditCarType(e.target.value)} 
                          placeholder="مثال: تويوتا بريوس (Toyota Prius)"
                          className="w-full bg-[#0c142c] border border-slate-700/80 rounded px-2 py-1 text-slate-200 text-right text-[11px]"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">{t('سنة الإنتاج (سنة):', 'Production Model Year:')}</label>
                    <input type="number" value={editCarModel} onChange={(e) => setEditCarModel(Number(e.target.value))} className="w-full bg-[#0c142c] border border-slate-700/80 rounded px-2 py-1 text-slate-200 text-right"/>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-0.5">{t('تاريخ انتهاء رخصة الكابتن:', 'License Expiry:')}</label>
                    <input type="date" value={editLicenseExpiry} onChange={(e) => setEditLicenseExpiry(e.target.value)} className="w-full bg-[#0c142c] border border-slate-700/80 rounded px-1 py-1 text-slate-200 text-[10px] text-right"/>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">{t('تاريخ انتهاء ترخيص السيارة:', 'Car Registration Expiry:')}</label>
                    <input type="date" value={editRegistrationExpiry} onChange={(e) => setEditRegistrationExpiry(e.target.value)} className="w-full bg-[#0c142c] border border-slate-700/80 rounded px-1 py-1 text-slate-200 text-[10px] text-right"/>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-0.5">{t('رصيد المحفظة الافتراضي (د.أ):', 'Wallet Balance (JD):')}</label>
                    <input type="number" val={editBalance} value={editBalance} onChange={(e) => setEditBalance(Number(e.target.value))} className="w-full bg-[#0c142c] border border-slate-700/80 rounded px-2 py-1 text-slate-200 text-right"/>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">{t('المحافظة:', 'Governorate:')}</label>
                    <input type="text" value={editGov} onChange={(e) => setEditGov(e.target.value)} className="w-full bg-[#0c142c] border border-slate-700/80 rounded px-2 py-1 text-slate-200 text-right"/>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-[#0c142c] p-2 rounded gap-2 text-[10px]">
                  <label className="flex items-center gap-1 flex-row-reverse text-slate-300">
                    <input 
                      type="checkbox" 
                      checked={editNoCriminal} 
                      onChange={(e) => setEditNoCriminal(e.target.checked)}
                      className="cursor-pointer"
                    />
                    <span>{t('✓ خلو من السوابق العدلية والأحكام بالأمن العام', 'No criminal records certified')}</span>
                  </label>

                  <label className="flex items-center gap-1 flex-row-reverse text-slate-300">
                    <input 
                      type="checkbox" 
                      checked={editIsOnline} 
                      onChange={(e) => setEditIsOnline(e.target.checked)}
                      className="cursor-pointer"
                    />
                    <span>{t('متصل الآن بالبث الفوري', 'Is Online Active')}</span>
                  </label>
                </div>

                <div className="flex flex-wrap gap-4 border-t border-slate-900 pt-2">
                  <div className="flex gap-2 items-center">
                    <label className="text-slate-400 text-[10px]">{t('حالة رخصة النظام وطبيعة التتبع:', 'System Account Status:')}</label>
                    <select 
                      value={editStatus} 
                      onChange={(e: any) => setEditStatus(e.target.value)}
                      className="bg-[#0c142c] border border-slate-700 text-slate-200 rounded px-2 py-1 text-[11px] text-right"
                    >
                      <option value="approved">{t('مقبول ومفعل (Approved)', 'Approved')}</option>
                      <option value="pending">{t('موقوف قيد المراجعة (Pending Reviews)', 'Pending')}</option>
                      <option value="blocked">{t('محظور وموقف الرابط (Blocked)', 'Blocked')}</option>
                    </select>
                  </div>
                  <div className="flex gap-2 items-center">
                    <label className="text-slate-400 text-[10px]">{t('تعديل دولة الكابتن واستثنائها:', 'Driver Override Country:')}</label>
                    <select 
                      value={editCountry} 
                      onChange={(e) => setEditCountry(e.target.value)}
                      className="bg-[#0c142c] border border-slate-700 text-slate-200 rounded px-2 py-1 text-[11px] text-right"
                    >
                      {enabledCountries.map(c => (
                        <option key={c.code} value={c.code}>{c.flag} {c.nameAr} ({c.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Confirm buttons */}
                <div className="flex gap-2 justify-start pt-1">
                  <button 
                    type="button" onClick={() => handleSaveEdit(driver.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded-md text-xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('حفظ التعديل للذاكرة', 'Commit Changes')}</span>
                  </button>
                  <button 
                    type="button" onClick={() => setEditingDriverId(null)}
                    className="bg-slate-850 hover:bg-slate-800 text-slate-300 px-3 py-1 rounded-md text-xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{t('إلغاء', 'Cancel')}</span>
                  </button>
                </div>

              </div>
            ) : (
              /* View mode stats list of variables */
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-[#05070e]/50 p-2.5 rounded-lg text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[9px]">{t('صنف وسنة مركبة السفر:', 'Car & Model:')}</span>
                    <span className="font-bold text-slate-200">🚗 {driver.carType} ({driver.carModel})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">{t('المحفظة والعداد (د.أ):', 'Wallet Current Balance:')}</span>
                    <span className="font-bold text-indigo-400 font-mono">💵 {driver.balance.toFixed(2)} JD</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">{t('لوحة الترخيص:', 'License Plate Number:')}</span>
                    <span className="font-mono text-amber-500 font-semibold">🎫 {driver.carPlate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">{t('الدولة النشطة للكابتن للعمل:', 'Driver Active Country:')}</span>
                    <span className="font-bold text-slate-200">
                      {(() => {
                        const c = enabledCountries.find(x => x.code === driver.country);
                        return c ? `${c.flag} ${c.nameAr} (${c.code})` : `🇯🇴 الأردن (JO)`;
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">{t('خلو سوابق عدلية:', 'Clear Criminal Record:')}</span>
                    <span className="font-semibold text-emerald-400">🛡️ {driver.noCriminalRecord ? t('موجود خلو كويّس', 'Certified Clear') : t('ناقص / مرفوض', 'Pending document')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">{t('انتهاء رخصة القيادة:', 'License Valid Until:')}</span>
                    <span className="font-mono text-[10px] text-slate-300">📅 {driver.licenseExpiry}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">{t('رحلات الكابتن والتقييم:', 'Rides Count & Stars:')}</span>
                    <span className="font-bold">⭐ {driver.ratingAverage.toFixed(1)} ({driver.tripsCount} {t('رحلة', 'runs')})</span>
                  </div>
                </div>

                {/* Edit & Delete row buttons */}
                <div className="flex gap-2 justify-start items-center">
                  <button 
                    onClick={() => handleEditClick(driver)}
                    className="bg-indigo-950 hover:bg-slate-800 text-indigo-300 px-3 py-1 rounded-lg border border-indigo-900/60 transition flex items-center gap-1 cursor-pointer text-[10px] font-bold"
                  >
                    <Edit3 className="w-3 h-3 text-indigo-400" />
                    <span>{t('تعديل كل الحقول والبيانات', 'Modify All Fields')}</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteDriver(driver.id, driver.fullName)}
                    className="text-red-400 hover:bg-red-955 px-2 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer text-[10px]"
                    title={t('حذف الكابتن', 'Delete Driver')}
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
