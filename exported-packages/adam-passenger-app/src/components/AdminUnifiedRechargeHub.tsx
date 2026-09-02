import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Users, 
  UserCheck, 
  Search, 
  DollarSign, 
  CreditCard, 
  Sparkles, 
  Lock, 
  FileText, 
  Building2, 
  X,
  Smartphone,
  Layers,
  ArrowUpDown,
  TrendingUp,
  CheckSquare,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppState } from '../stateEngine';
import { Driver, Passenger, WalletTransaction } from '../types';

export type RechargeTargetScope = 
  | 'single_driver' 
  | 'single_passenger' 
  | 'selected_drivers' 
  | 'selected_passengers' 
  | 'all_drivers' 
  | 'all_passengers' 
  | 'everyone';

interface AdminUnifiedRechargeHubProps {
  onSuccess?: (summary: { count: number; totalAmount: number; names: string[] }) => void;
  defaultScope?: RechargeTargetScope;
  preSelectedUserId?: string;
  preSelectedUserType?: 'driver' | 'passenger';
}

export const AdminUnifiedRechargeHub: React.FC<AdminUnifiedRechargeHubProps> = ({
  onSuccess,
  defaultScope = 'single_driver',
  preSelectedUserId,
  preSelectedUserType
}) => {
  const { 
    drivers, 
    passengers, 
    walletTransactions, 
    saveState, 
    settings, 
    requests, 
    rides, 
    messages, 
    scheduledTrips 
  } = useAppState();

  // Target Mode
  const [targetScope, setTargetScope] = useState<RechargeTargetScope>(() => {
    if (preSelectedUserType === 'driver') return 'single_driver';
    if (preSelectedUserType === 'passenger') return 'single_passenger';
    return defaultScope;
  });

  // Single Selection
  const [singleDriverId, setSingleDriverId] = useState<string>(
    preSelectedUserType === 'driver' && preSelectedUserId ? preSelectedUserId : (drivers[0]?.id || '')
  );
  const [singlePassengerId, setSinglePassengerId] = useState<string>(
    preSelectedUserType === 'passenger' && preSelectedUserId ? preSelectedUserId : (passengers[0]?.id || '')
  );

  // Multi Selection
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);
  const [selectedPassengerIds, setSelectedPassengerIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Financial inputs
  const [amount, setAmount] = useState<number>(10.0);
  const [paymentChannel, setPaymentChannel] = useState<'wallet' | 'cliq' | 'bank' | 'cash' | 'admin_bonus'>('cliq');
  const [reasonPreset, setReasonPreset] = useState<string>('custom');
  const [customReason, setCustomReason] = useState<string>('شحن وتغذية رصيد نقدي معتمد من الإدارة');
  const [referenceCode, setReferenceCode] = useState<string>('');

  // Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isExplicitlyConfirmed, setIsExplicitlyConfirmed] = useState<boolean>(false);
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<{
    count: number;
    totalAmount: number;
    names: string[];
    timestamp: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Quick Preset Reasons
  const REASON_PRESETS = [
    { id: 'custom', label: '✍️ سبب مخصص', text: 'شحن وتغذية رصيد نقدي معتمد من الإدارة' },
    { id: 'deposit_cash', label: '💵 استلام كاش في المكتب', text: 'إيداع نقدي مقبوض في المركز الرئيسي لشركة آدم' },
    { id: 'deposit_cliq', label: '⚡ حوالة كليك الفورية', text: 'تأكيد قيد حوالة CliQ في حساب الشركة البنكي' },
    { id: 'deposit_wallet', label: '📱 محفظة رقمية (Zain/Orange)', text: 'تأكيد تحويل محفظة إلكترونية لحساب الشركة' },
    { id: 'bonus_welcome', label: '🎁 رصيد ترحيبي وتشجيعي', text: 'منحة رصيد مجاني ترحيبي من إدارة المنظومة' },
    { id: 'compensation', label: '🛡️ تعويض وإعادة تسوية', text: 'تسوية وإعادة رصيد تعويضي عن رحلة ملغاة' },
  ];

  // Pre-calculated target lists
  const approvedDrivers = useMemo(() => drivers.filter(d => d.status !== 'blocked'), [drivers]);
  const approvedPassengers = useMemo(() => passengers.filter(p => p.status !== 'blocked'), [passengers]);

  // Target beneficiaries calculation
  const targetBeneficiaries = useMemo(() => {
    const list: { id: string; name: string; phone: string; type: 'driver' | 'passenger'; currentBalance: number }[] = [];

    if (targetScope === 'single_driver') {
      const d = drivers.find(drv => drv.id === singleDriverId);
      if (d) list.push({ id: d.id, name: d.fullName, phone: d.phone, type: 'driver', currentBalance: d.balance || 0 });
    } else if (targetScope === 'single_passenger') {
      const p = passengers.find(psg => psg.id === singlePassengerId);
      if (p) list.push({ id: p.id, name: p.fullName, phone: p.phone, type: 'passenger', currentBalance: p.balance || 0 });
    } else if (targetScope === 'selected_drivers') {
      selectedDriverIds.forEach(id => {
        const d = drivers.find(drv => drv.id === id);
        if (d) list.push({ id: d.id, name: d.fullName, phone: d.phone, type: 'driver', currentBalance: d.balance || 0 });
      });
    } else if (targetScope === 'selected_passengers') {
      selectedPassengerIds.forEach(id => {
        const p = passengers.find(psg => psg.id === id);
        if (p) list.push({ id: p.id, name: p.fullName, phone: p.phone, type: 'passenger', currentBalance: p.balance || 0 });
      });
    } else if (targetScope === 'all_drivers') {
      approvedDrivers.forEach(d => {
        list.push({ id: d.id, name: d.fullName, phone: d.phone, type: 'driver', currentBalance: d.balance || 0 });
      });
    } else if (targetScope === 'all_passengers') {
      approvedPassengers.forEach(p => {
        list.push({ id: p.id, name: p.fullName, phone: p.phone, type: 'passenger', currentBalance: p.balance || 0 });
      });
    } else if (targetScope === 'everyone') {
      approvedDrivers.forEach(d => {
        list.push({ id: d.id, name: d.fullName, phone: d.phone, type: 'driver', currentBalance: d.balance || 0 });
      });
      approvedPassengers.forEach(p => {
        list.push({ id: p.id, name: p.fullName, phone: p.phone, type: 'passenger', currentBalance: p.balance || 0 });
      });
    }

    return list;
  }, [targetScope, singleDriverId, singlePassengerId, selectedDriverIds, selectedPassengerIds, drivers, passengers, approvedDrivers, approvedPassengers]);

  const totalCalculatedRecharge = targetBeneficiaries.length * amount;

  // Filtered lists for multi-select
  const filteredDriversForSelection = useMemo(() => {
    if (!searchQuery.trim()) return approvedDrivers;
    const q = searchQuery.toLowerCase();
    return approvedDrivers.filter(d => d.fullName.toLowerCase().includes(q) || d.phone.includes(q) || d.city?.toLowerCase().includes(q));
  }, [approvedDrivers, searchQuery]);

  const filteredPassengersForSelection = useMemo(() => {
    if (!searchQuery.trim()) return approvedPassengers;
    const q = searchQuery.toLowerCase();
    return approvedPassengers.filter(p => p.fullName.toLowerCase().includes(q) || p.phone.includes(q));
  }, [approvedPassengers, searchQuery]);

  const handleToggleSelectAllDrivers = () => {
    if (selectedDriverIds.length === filteredDriversForSelection.length) {
      setSelectedDriverIds([]);
    } else {
      setSelectedDriverIds(filteredDriversForSelection.map(d => d.id));
    }
  };

  const handleToggleSelectAllPassengers = () => {
    if (selectedPassengerIds.length === filteredPassengersForSelection.length) {
      setSelectedPassengerIds([]);
    } else {
      setSelectedPassengerIds(filteredPassengersForSelection.map(p => p.id));
    }
  };

  const handleOpenConfirmModal = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage('⚠️ يرجى إدخال مبلغ شحن صحيح أكبر من الصفر.');
      return;
    }

    if (targetBeneficiaries.length === 0) {
      setErrorMessage('⚠️ يرجى تحديد مستخدم واحد على الأقل لشحن رصيده.');
      return;
    }

    setIsExplicitlyConfirmed(false);
    setAdminPinInput('');
    setShowConfirmModal(true);
  };

  const handleExecuteConfirmedRecharge = () => {
    if (!isExplicitlyConfirmed) {
      alert('⚠️ يرجى تفعيل خيار التأكيد والموافقة على زيادة الرصيد قبل المتابعة.');
      return;
    }

    setIsExecuting(true);

    setTimeout(() => {
      const activeReason = customReason.trim() || 'شحن رصيد إداري معتمد';
      const refFormatted = referenceCode.trim() || `ADM-TOPUP-${Date.now().toString().slice(-6)}`;
      const timestampFormatted = new Date().toISOString().replace('T', ' ').substring(0, 16);

      const targetDriverMap = new Map<string, number>();
      const targetPassengerMap = new Map<string, number>();

      targetBeneficiaries.forEach(b => {
        if (b.type === 'driver') {
          targetDriverMap.set(b.id, amount);
        } else {
          targetPassengerMap.set(b.id, amount);
        }
      });

      // 1. Update Drivers balances
      const updatedDrivers = drivers.map(d => {
        if (targetDriverMap.has(d.id)) {
          const added = targetDriverMap.get(d.id) || 0;
          return { ...d, balance: Math.max(0, (d.balance || 0) + added) };
        }
        return d;
      });

      // 2. Update Passengers balances
      const updatedPassengers = passengers.map(p => {
        if (targetPassengerMap.has(p.id)) {
          const added = targetPassengerMap.get(p.id) || 0;
          return { ...p, balance: Math.max(0, (p.balance || 0) + added) };
        }
        return p;
      });

      // 3. Create Wallet Transactions with full audit metadata
      const newTransactions: WalletTransaction[] = targetBeneficiaries.map((b, idx) => ({
        id: `tx_topup_${b.type}_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
        userId: b.id,
        userType: b.type,
        type: 'deposit',
        amount: amount,
        walletNumber: `${paymentChannel === 'cliq' ? 'CliQ' : paymentChannel === 'wallet' ? 'e-Wallet' : paymentChannel === 'cash' ? 'CASH' : 'ADMIN'}: ${activeReason}`,
        timestamp: timestampFormatted,
        status: 'completed',
        paymentMethod: paymentChannel === 'admin_bonus' ? 'wallet' : paymentChannel,
        country: 'JO'
      }));

      const updatedWalletTransactions = [...newTransactions, ...walletTransactions];

      // 4. Save state & localStorage
      saveState(
        updatedDrivers,
        updatedPassengers,
        requests,
        rides,
        messages,
        settings,
        scheduledTrips,
        updatedWalletTransactions
      );

      localStorage.setItem('adam_drivers', JSON.stringify(updatedDrivers));
      localStorage.setItem('adam_passengers', JSON.stringify(updatedPassengers));
      localStorage.setItem('adam_wallet_transactions', JSON.stringify(updatedWalletTransactions));

      setIsExecuting(false);
      setShowConfirmModal(false);

      const result = {
        count: targetBeneficiaries.length,
        totalAmount: totalCalculatedRecharge,
        names: targetBeneficiaries.map(b => b.name),
        timestamp: timestampFormatted
      };

      setExecutionResult(result);

      if (onSuccess) {
        onSuccess(result);
      }
    }, 600);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 md:p-6 rounded-2xl flex flex-col gap-6 text-right font-sans relative overflow-hidden shadow-2xl">
      {/* Decorative background glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-slate-800 pb-4 gap-3">
        <div className="flex items-center gap-3 flex-row-reverse">
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
            <Wallet className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-100 flex items-center justify-end gap-2 leading-tight">
              <span>مركز شحن وتغذية محافظ الكباتن والركاب المعتمد</span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              إيداع فوري وزيادة مباشرة في رصيد الكابتن أو الراكب مع التأكيد الإجرائي وتوثيق القيد في التقرير المالي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300">
          <span className="text-emerald-400 font-bold">● نظام التغذية الفورية v4.0</span>
          <span>|</span>
          <span>العملة: د.أ (JOD)</span>
        </div>
      </div>

      {/* Execution Success Banner */}
      <AnimatePresence>
        {executionResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-950/70 border border-emerald-500/40 rounded-2xl text-emerald-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-lg"
          >
            <div className="flex items-center gap-3 flex-row-reverse">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-black text-white">
                  🎉 تم تأكيد وتنفيذ الشحن بنجاح وإيداع ({executionResult.totalAmount.toFixed(2)} د.أ) في محافظ ({executionResult.count}) مستفيد!
                </h4>
                <p className="text-[11px] text-emerald-300/80 mt-0.5">
                  تم تحديث الأرصدة فوراً وتوثيق الحركات المحاسبية في سجل المدفوعات والتقارير النقدية.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setExecutionResult(null)}
              className="bg-emerald-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs hover:bg-emerald-400 transition cursor-pointer self-end md:self-center whitespace-nowrap"
            >
              تم ومتابعة العمليات ✖
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center justify-between flex-row-reverse">
          <div className="flex items-center gap-2 flex-row-reverse">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-white text-sm">✖</button>
        </div>
      )}

      {/* Main Recharge Configuration Form */}
      <form onSubmit={handleOpenConfirmModal} className="flex flex-col gap-6">
        {/* Step 1: Target Audience Selection */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-black text-slate-200 flex items-center gap-2 flex-row-reverse">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>1. تحديد المستفيد أو الشريحة المستهدفة لزيادة الرصيد:</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              { id: 'single_driver', label: '🚗 كابتن محدد', badge: 'فردي', color: 'emerald' },
              { id: 'single_passenger', label: '👥 راكب محدد', badge: 'فردي', color: 'indigo' },
              { id: 'selected_drivers', label: '🚗 كباتن معينين', badge: `${selectedDriverIds.length}`, color: 'emerald' },
              { id: 'selected_passengers', label: '👥 ركاب معينين', badge: `${selectedPassengerIds.length}`, color: 'indigo' },
              { id: 'all_drivers', label: '👑 جميع الكباتن', badge: `${approvedDrivers.length}`, color: 'emerald' },
              { id: 'all_passengers', label: '🌟 جميع الركاب', badge: `${approvedPassengers.length}`, color: 'indigo' },
              { id: 'everyone', label: '⚡ الكل (كباتن وركاب)', badge: `${approvedDrivers.length + approvedPassengers.length}`, color: 'amber' }
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setTargetScope(opt.id as any);
                  setErrorMessage('');
                }}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                  targetScope === opt.id
                    ? opt.color === 'emerald'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                      : opt.color === 'indigo'
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/10'
                      : 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span>{opt.label}</span>
                <span className="text-[9.5px] px-1.5 py-0.2 rounded-full font-mono bg-slate-900 border border-slate-800 text-slate-400">
                  {opt.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 1.1: Contextual User Selection UI */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
          {/* 1. Single Driver Selection */}
          {targetScope === 'single_driver' && (
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-emerald-400">اختر كابتن الأسطول لزيادة رصيده:</label>
              <select
                value={singleDriverId}
                onChange={e => setSingleDriverId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-100 outline-none"
              >
                {drivers.map(drv => (
                  <option key={drv.id} value={drv.id}>
                    {drv.fullName} | 📱 {drv.phone} | 💰 الرصيد الحالي: {(drv.balance || 0).toFixed(2)} د.أ ({drv.city || 'الأردن'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2. Single Passenger Selection */}
          {targetScope === 'single_passenger' && (
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-indigo-400">اختر الراكب لزيادة رصيده:</label>
              <select
                value={singlePassengerId}
                onChange={e => setSinglePassengerId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-100 outline-none"
              >
                {passengers.map(psg => (
                  <option key={psg.id} value={psg.id}>
                    {psg.fullName} | 📱 {psg.phone} | 💰 الرصيد الحالي: {(psg.balance || 0).toFixed(2)} د.أ
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3. Selected Drivers Multi-Selection */}
          {targetScope === 'selected_drivers' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <span className="text-xs font-bold text-emerald-400">حدد الكباتن المعنيين بالشحن:</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    تم تحديد {selectedDriverIds.length} من أصل {filteredDriversForSelection.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleToggleSelectAllDrivers}
                    className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1"
                  >
                    {selectedDriverIds.length === filteredDriversForSelection.length ? <CheckSquare className="w-3 h-3 text-emerald-400" /> : <Square className="w-3 h-3" />}
                    <span>{selectedDriverIds.length === filteredDriversForSelection.length ? 'إلغاء تحديد الكل' : 'تحديد جميع المعروضين'}</span>
                  </button>
                </div>
              </div>

              {/* Search filter */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="🔍 تصفية بالاسم، الهاتف، أو المدينة..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 text-right pr-3"
                />
              </div>

              {/* Checkboxes scroll list */}
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 p-2 flex flex-col gap-1 bg-slate-900/50">
                {filteredDriversForSelection.map(drv => {
                  const isChecked = selectedDriverIds.includes(drv.id);
                  return (
                    <label
                      key={drv.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition flex-row-reverse text-xs ${
                        isChecked ? 'bg-emerald-500/15 border border-emerald-500/30 text-white' : 'hover:bg-slate-850 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-row-reverse">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedDriverIds([...selectedDriverIds, drv.id]);
                            } else {
                              setSelectedDriverIds(selectedDriverIds.filter(id => id !== drv.id));
                            }
                          }}
                          className="w-4 h-4 accent-emerald-500 cursor-pointer"
                        />
                        <span className="font-bold">{drv.fullName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({drv.phone})</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-slate-400">الرصيد:</span>
                        <span className="font-bold text-emerald-400">{(drv.balance || 0).toFixed(2)} د.أ</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Selected Passengers Multi-Selection */}
          {targetScope === 'selected_passengers' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <span className="text-xs font-bold text-indigo-400">حدد الركاب المعنيين بالشحن:</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                    تم تحديد {selectedPassengerIds.length} من أصل {filteredPassengersForSelection.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleToggleSelectAllPassengers}
                    className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1"
                  >
                    {selectedPassengerIds.length === filteredPassengersForSelection.length ? <CheckSquare className="w-3 h-3 text-indigo-400" /> : <Square className="w-3 h-3" />}
                    <span>{selectedPassengerIds.length === filteredPassengersForSelection.length ? 'إلغاء تحديد الكل' : 'تحديد جميع المعروضين'}</span>
                  </button>
                </div>
              </div>

              {/* Search filter */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="🔍 تصفية بالاسم أو الهاتف..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500 text-right pr-3"
                />
              </div>

              {/* Checkboxes scroll list */}
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 p-2 flex flex-col gap-1 bg-slate-900/50">
                {filteredPassengersForSelection.map(psg => {
                  const isChecked = selectedPassengerIds.includes(psg.id);
                  return (
                    <label
                      key={psg.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition flex-row-reverse text-xs ${
                        isChecked ? 'bg-indigo-500/15 border border-indigo-500/30 text-white' : 'hover:bg-slate-850 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-row-reverse">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedPassengerIds([...selectedPassengerIds, psg.id]);
                            } else {
                              setSelectedPassengerIds(selectedPassengerIds.filter(id => id !== psg.id));
                            }
                          }}
                          className="w-4 h-4 accent-indigo-500 cursor-pointer"
                        />
                        <span className="font-bold">{psg.fullName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({psg.phone})</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-slate-400">الرصيد:</span>
                        <span className="font-bold text-indigo-400">{(psg.balance || 0).toFixed(2)} د.أ</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. All Drivers / All Passengers / Everyone Summary Card */}
          {(targetScope === 'all_drivers' || targetScope === 'all_passengers' || targetScope === 'everyone') && (
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center flex-row-reverse">
              <div className="flex items-center gap-2 flex-row-reverse text-xs font-bold text-slate-200">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>
                  {targetScope === 'all_drivers' && `سيتم شحن وإيداع الرصيد لجميع كباتن الأسطول النشطين (${approvedDrivers.length} كابتن)`}
                  {targetScope === 'all_passengers' && `سيتم شحن وإيداع الرصيد لجميع الركاب والعملاء المسجلين (${approvedPassengers.length} راكب)`}
                  {targetScope === 'everyone' && `سيتم شحن وإيداع الرصيد للجميع (${approvedDrivers.length} كابتن + ${approvedPassengers.length} راكب = ${approvedDrivers.length + approvedPassengers.length} مستخدم)`}
                </span>
              </div>
              <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-2.5 py-1 rounded-lg font-mono">
                جاهز للتنفيذ الجماعي
              </span>
            </div>
          )}
        </div>

        {/* Step 2: Amount, Payment Method, and Reason */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Amount Column */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <label className="text-xs font-black text-slate-200 flex items-center gap-2 flex-row-reverse">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>2. قيمة المبلغ المراد إيداعه لكل مستخدم (د.أ):</span>
            </label>

            <div className="flex flex-col gap-2">
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={amount}
                  onChange={e => setAmount(Math.max(0.5, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-lg font-black text-emerald-400 font-mono text-center outline-none transition"
                  required
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">
                  JOD / د.أ
                </span>
              </div>

              {/* Quick Amount Pills */}
              <div className="grid grid-cols-5 gap-1.5">
                {[2, 5, 10, 20, 50].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`py-1.5 rounded-lg border text-xs font-mono font-bold transition cursor-pointer ${
                      amount === val
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    +{val} د.أ
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Method & Reason Column */}
          <div className="md:col-span-7 flex flex-col gap-3">
            <label className="text-xs font-black text-slate-200 flex items-center gap-2 flex-row-reverse">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              <span>3. قناة التحصيل/الإيداع والبيان المحاسبي:</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'cliq', label: '⚡ كليك الفوري (CliQ)' },
                { id: 'wallet', label: '📱 محفظة (e-Wallet)' },
                { id: 'bank', label: '🏦 حساب بنكي (Bank)' },
                { id: 'cash', label: '💵 استلام كاش (Cash)' },
                { id: 'admin_bonus', label: '🎁 منحة إدارية ترويجية' }
              ].map(ch => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setPaymentChannel(ch.id as any)}
                  className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                    paymentChannel === ch.id
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>

            {/* Statement / Reason Preset Selector */}
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex justify-between items-center flex-row-reverse">
                <span className="text-[10px] text-slate-400 font-bold">بيان القيد المالي المسجل في السجل:</span>
                <select
                  value={reasonPreset}
                  onChange={e => {
                    const found = REASON_PRESETS.find(p => p.id === e.target.value);
                    setReasonPreset(e.target.value);
                    if (found) setCustomReason(found.text);
                  }}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2 py-1 text-[10px] outline-none font-sans"
                >
                  {REASON_PRESETS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="بيان الشحن الذي يظهر في كشف حساب المحفظة..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-100 outline-none text-right"
                required
              />
            </div>
          </div>
        </div>

        {/* Live Calculation & Pre-Execution Card */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 flex-row-reverse">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">عدد المستفيدين المحددين:</span>
              <span className="text-lg font-black text-white font-mono">{targetBeneficiaries.length} مستخدم</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">المبلغ لكل حساب:</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{amount.toFixed(2)} د.أ</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <span className="text-[10px] text-amber-400 font-bold block">إجمالي المبلغ المزمع ضخه:</span>
              <span className="text-xl font-black text-amber-300 font-mono">{totalCalculatedRecharge.toFixed(2)} د.أ</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={targetBeneficiaries.length === 0}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black py-3.5 px-7 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/20 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>مراجعة وتأكيد عملية الشحن وزيادة الرصيد 💰</span>
          </button>
        </div>
      </form>

      {/* DEDICATED RECHARGE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-700 max-w-xl w-full rounded-2xl p-6 shadow-2xl text-right flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center flex-row-reverse pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">تأكيد عملية شحن وتغذية الرصيد الإداري</h3>
                    <p className="text-[10px] text-slate-400">يرجى مراجعة تفاصيل العملية والموافقة الإجرائية قبل تحرير الرصيد</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">عدد المستفيدين</span>
                  <span className="text-base font-black text-white">{targetBeneficiaries.length}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">قيمة الشحن للفرد</span>
                  <span className="text-base font-black text-emerald-400">{amount.toFixed(2)} د.أ</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-400 block font-sans font-bold">إجمالي المبلغ المقيد</span>
                  <span className="text-base font-black text-amber-300">{totalCalculatedRecharge.toFixed(2)} د.أ</span>
                </div>
              </div>

              {/* Beneficiaries Preview Table */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center flex-row-reverse text-[11px] text-slate-400">
                  <span className="font-bold">قائمة المستفيدين والزيادة المتوقعة:</span>
                  <span>عرض {Math.min(targetBeneficiaries.length, 5)} من أصل {targetBeneficiaries.length}</span>
                </div>

                <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-right text-xs font-sans border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] text-slate-400 font-bold bg-slate-900">
                        <th className="p-2.5 text-right">المستفيد</th>
                        <th className="p-2.5 text-center">الرصيد الحالي</th>
                        <th className="p-2.5 text-center">الزيادة</th>
                        <th className="p-2.5 text-left">الرصيد بعد الشحن</th>
                      </tr>
                    </thead>
                    <tbody>
                      {targetBeneficiaries.slice(0, 15).map((b, i) => (
                        <tr key={b.id || i} className="border-b border-slate-850 hover:bg-slate-900/40">
                          <td className="p-2.5 font-bold text-slate-200">
                            <div>{b.name}</div>
                            <div className="text-[9px] text-slate-500 font-mono">{b.phone} ({b.type === 'driver' ? 'كابتن' : 'راكب'})</div>
                          </td>
                          <td className="p-2.5 text-center font-mono text-slate-400">
                            {b.currentBalance.toFixed(2)} د.أ
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-emerald-400">
                            +{amount.toFixed(2)} د.أ
                          </td>
                          <td className="p-2.5 text-left font-mono font-black text-teal-300">
                            {(b.currentBalance + amount).toFixed(2)} د.أ
                          </td>
                        </tr>
                      ))}
                      {targetBeneficiaries.length > 15 && (
                        <tr>
                          <td colSpan={4} className="p-2 text-center text-[10px] text-slate-500 font-sans">
                            + وعدد {targetBeneficiaries.length - 15} مستخدمين آخرين مشمولين في هذه العملية
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transaction Statement Info */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5 text-xs text-slate-300">
                <div className="flex justify-between flex-row-reverse">
                  <span className="text-slate-400">قناة التحصيل:</span>
                  <span className="font-bold text-indigo-300 font-mono">
                    {paymentChannel === 'cliq' ? 'كليك الفوري (CliQ)' : paymentChannel === 'wallet' ? 'محفظة إلكترونية (e-Wallet)' : paymentChannel === 'cash' ? 'استلام كاش نقدي' : 'إيداع إداري'}
                  </span>
                </div>
                <div className="flex justify-between flex-row-reverse">
                  <span className="text-slate-400">بيان القيد:</span>
                  <span className="font-medium text-slate-200">{customReason}</span>
                </div>
              </div>

              {/* EXPLICIT CONFIRMATION FIELD (حقل التأكيد الإجرائي الإلزامي) */}
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl flex flex-col gap-3">
                <label className="flex items-start gap-3 flex-row-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isExplicitlyConfirmed}
                    onChange={e => setIsExplicitlyConfirmed(e.target.checked)}
                    className="w-5 h-5 mt-0.5 accent-emerald-500 cursor-pointer rounded"
                  />
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-300 block">
                      ☑️ حقل تأكيد العملية: أقرّ بمطابقة واستلام المبلغ وأؤكد زيادة رصيد المحفظة فورياً
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block leading-relaxed">
                      بالنقر على هذا الخيار، سيتم تحديث أرصدة المستفيدين وتوثيق حركة الإيداع في التقرير المالي الرسمي لشركة آدم.
                    </span>
                  </div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isExecuting}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs transition cursor-pointer"
                >
                  إلغاء وتعديل ✖
                </button>

                <button
                  type="button"
                  onClick={handleExecuteConfirmedRecharge}
                  disabled={!isExplicitlyConfirmed || isExecuting}
                  className="flex-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isExecuting ? (
                    <span>جاري تحرير وإيداع الرصيد فوراً...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تأكيد تنفيذ الشحن وزيادة الرصيد فوراً 🚀</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
