import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Building2, Smartphone, CreditCard, Lock, CheckCircle2, FileText, AlertCircle, RefreshCw, Cpu, Layers, DollarSign, Link2, Clock, Check, X } from 'lucide-react';
import { useAppState } from '../stateEngine';

interface WalletRechargeSettlementPanelProps {
  userType: 'passenger' | 'driver';
  user: any;
  onVerifyAndDeposit: (
    userId: string,
    userType: 'driver' | 'passenger',
    amount: number,
    walletNumber?: string,
    paymentMethod?: 'wallet' | 'cliq' | 'bank' | 'card' | 'apple_pay',
    referenceNumber?: string
  ) => Promise<{ success: boolean; msg: string; preAuthCode?: string; clearanceCode?: string; webhookCallbackToken?: string; verificationLog?: string; isPendingAdminApproval?: boolean }>;
  settings: any;
  themeColor?: 'emerald' | 'amber';
  onCompleted?: () => void;
}

export const WalletRechargeSettlementPanel: React.FC<WalletRechargeSettlementPanelProps> = ({
  userType,
  user,
  onVerifyAndDeposit,
  settings,
  themeColor = 'emerald',
  onCompleted
}) => {
  const { linkPaymentMethod } = useAppState();
  const [amount, setAmount] = useState<string>('20.00');
  const [paymentChannel, setPaymentChannel] = useState<'card' | 'cliq' | 'bank' | 'wallet'>('cliq');
  const [sourceRef, setSourceRef] = useState<string>('');
  
  // Pipeline animation / execution state
  const [pipelineStep, setPipelineStep] = useState<'idle' | 'pre_auth' | 'treasury_settlement' | 'ledger_release' | 'completed' | 'pending_approval' | 'failed'>('idle');
  const [preAuthCode, setPreAuthCode] = useState<string>('');
  const [clearanceCode, setClearanceCode] = useState<string>('');
  const [webhookToken, setWebhookToken] = useState<string>('');
  const [auditReport, setAuditReport] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Inline Account Linking Form State
  const [showAccountLinkModal, setShowAccountLinkModal] = useState<boolean>(false);
  const [linkProvider, setLinkProvider] = useState<string>('cliq');
  const [linkName, setLinkName] = useState<string>(user?.fullName || '');
  const [linkNumber, setLinkNumber] = useState<string>(user?.phone || '');
  const [linkSuccessMsg, setLinkSuccessMsg] = useState<string>('');

  const primaryBadgeClass = themeColor === 'amber' ? 'bg-amber-500 text-slate-950 hover:bg-amber-600' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-600';
  const textAccentClass = themeColor === 'amber' ? 'text-amber-400' : 'text-emerald-400';
  const borderAccentClass = themeColor === 'amber' ? 'border-amber-500/30' : 'border-emerald-500/30';

  const isAccountLinked = Boolean(user?.linkedPaymentProvider && user?.linkedAccountNumber);
  const linkedBalance = user?.linkedAccountBalance ?? 100.00;
  const isApprovalManual = settings?.rechargeApprovalMode === 'admin_approval';

  const handleLinkAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkName.trim() || !linkNumber.trim()) {
      alert("يرجى إدخال اسم صاحب الحساب ورقم الحساب/المحفظة بشكل كامل.");
      return;
    }
    linkPaymentMethod(user.id, userType, linkProvider, linkName, linkNumber);
    setLinkSuccessMsg("✅ تم ربط الحساب المالي بنجاح وبدء مطابقة الرصيد المتاح!");
    setTimeout(() => {
      setShowAccountLinkModal(false);
      setLinkSuccessMsg('');
    }, 1200);
  };

  const handleStartRechargePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert("يرجى إدخال مبلغ شحن صحيح أكبر من الصفر.");
      return;
    }

    if (!isAccountLinked) {
      setShowAccountLinkModal(true);
      return;
    }

    if (numAmt > linkedBalance) {
      alert(`⚠️ رصيد حسابك المالي المربوط (${linkedBalance.toFixed(2)} د.أ) غير كافٍ لشحن (${numAmt.toFixed(2)} د.أ). يرجى اختيار مبلغ أقل أو إيداع رصيد بحسابك المربوط أولاً.`);
      return;
    }

    setErrorMessage('');
    // Step 1: Pre-Auth Hold
    setPipelineStep('pre_auth');

    setTimeout(async () => {
      // Step 2: Corporate Treasury Settlement Verification
      setPipelineStep('treasury_settlement');

      const refNum = sourceRef.trim() || `REF-${paymentChannel.toUpperCase()}-${Date.now().toString().slice(-6)}`;
      const result = await onVerifyAndDeposit(
        user.id,
        userType,
        numAmt,
        sourceRef || user?.linkedAccountNumber || 'ADAM_SECURE_PORTAL',
        paymentChannel,
        refNum
      );

      if (result.success) {
        setPreAuthCode(result.preAuthCode || `PREAUTH-${Math.floor(100000 + Math.random() * 900000)}`);
        setClearanceCode(result.clearanceCode || `SETTLE-ADAM-${Date.now().toString().slice(-6)}`);
        setWebhookToken(result.webhookCallbackToken || `WHK-CALLBACK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
        setAuditReport(result.verificationLog || result.msg);

        if (result.isPendingAdminApproval) {
          setPipelineStep('pending_approval');
          if (onCompleted) onCompleted();
        } else {
          // Step 3: Ledger Credit Release
          setPipelineStep('ledger_release');
          setTimeout(() => {
            setPipelineStep('completed');
            if (onCompleted) onCompleted();
          }, 1200);
        }
      } else {
        setPipelineStep('failed');
        setErrorMessage(result.msg || "فشلت عملية التحقق البنكي من قيد الحوالة في حساب الشركة.");
      }
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-4 text-right font-sans">
      {/* Top Protocol Badge Header */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-col gap-2 shadow-md">
        <div className="flex justify-between items-center flex-row-reverse">
          <span className={`text-xs font-black flex items-center gap-1.5 ${textAccentClass}`}>
            <ShieldCheck className="w-4 h-4" />
            <span>نظام الشحن والمقاصة البنكية المعتمد لشركة آدم (ADAM Treasury Clearing Engine)</span>
          </span>
          <span className="text-[9px] bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full font-mono">
            v3.6 Pre-Auth Settlement
          </span>
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed m-0">
          تطبيقاً لأعلى معايير حماية الخزينة ومنع الاحتيال المصرفي: يتم احتجاز المبلغ مسبقاً (Pre-Auth Hold) وتوثيق استقرار الأموال نهائياً في <strong>حساب خزينة شركة آدم المعتمد (ADAM Treasury Account)</strong> قبل تحرير وإضافة أي فلس إلى الرصيد المتاح لمشاويرك.
        </p>

        {/* Company Settings Mode Indicator */}
        <div className="flex items-center justify-between flex-row-reverse bg-slate-950 p-2 rounded-xl border border-slate-800 text-[9.5px]">
          <span className="text-slate-400 font-bold">آلية زيادة الرصيد المعتمدة بالشركة:</span>
          {isApprovalManual ? (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg font-black flex items-center gap-1 dir-rtl">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>موافقة الإدارة وتأكيد الوصول</span>
            </span>
          ) : (
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-lg font-black flex items-center gap-1 dir-rtl">
              <ZapIcon className="w-3 h-3 text-emerald-400" />
              <span>تلقائي فور التأكد بالذكاء الاصطناعي</span>
            </span>
          )}
        </div>

        {/* Linked Financial Account Status Card */}
        <div className={`p-3 rounded-xl border flex flex-col gap-1.5 text-[10px] transition ${isAccountLinked ? 'bg-slate-950 border-emerald-500/30' : 'bg-amber-950/30 border-amber-500/40'}`}>
          <div className="flex justify-between items-center flex-row-reverse">
            <span className="font-extrabold flex items-center gap-1 text-slate-200">
              <Link2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>الحساب المالي المربوط المعتمد للشحن:</span>
            </span>
            {isAccountLinked ? (
              <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                مربوط ومفعل ✅
              </span>
            ) : (
              <span className="bg-amber-500/20 text-amber-300 text-[9px] px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                غير مربوط ⚠️
              </span>
            )}
          </div>

          {isAccountLinked ? (
            <div className="grid grid-cols-2 gap-2 text-[9.5px] bg-slate-900 p-2 rounded-lg border border-slate-800">
              <div className="flex justify-between flex-row-reverse">
                <span className="text-slate-400">مزود الخدمة:</span>
                <span className="text-indigo-300 font-bold">{user.linkedPaymentProvider?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between flex-row-reverse">
                <span className="text-slate-400">رقم الحساب/المحفظة:</span>
                <span className="text-slate-200 font-mono">{user.linkedAccountNumber}</span>
              </div>
              <div className="flex justify-between flex-row-reverse col-span-2 border-t border-slate-800 pt-1">
                <span className="text-slate-400">الرصيد المتاح بالحساب المربوط:</span>
                <span className="text-emerald-400 font-mono font-black">{linkedBalance.toFixed(2)} د.أ</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-amber-200 text-[9px] leading-relaxed m-0">
                حسب الأنظمة المالية لشركة آدم، <strong>لا يمكنك شحن الرصيد</strong> إلا بعد ربط حسابك المالي (كليك / محفظة زين كاش / أورنج ماني / حساب بنكي) لنتمكن من التأكد من توفر الرصيد واقتطاع المبلغ مباشرة.
              </p>
              <button
                type="button"
                onClick={() => setShowAccountLinkModal(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>ربط حسابك المالي المعتمد الآن 🔗</span>
              </button>
            </div>
          )}
        </div>

        {/* Corporate Treasury Account Info Badge */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-1 text-[9.5px]">
          <div className="flex justify-between items-center flex-row-reverse">
            <span className="text-slate-400 font-bold">حساب الخزينة الرئيسي (Corporate Treasury):</span>
            <span className="text-slate-100 font-bold">شركة قوافل آدم للنقل الذكي</span>
          </div>
          <div className="flex justify-between items-center flex-row-reverse">
            <span className="text-slate-400 font-mono">كليك المعتمد (CliQ Alias):</span>
            <span className="text-indigo-400 font-mono font-black select-all">ADAM.COMPANY</span>
          </div>
          <div className="flex justify-between items-center flex-row-reverse">
            <span className="text-slate-400 font-mono">الآيبان البنكي (Corporate IBAN):</span>
            <span className="text-amber-400 font-mono font-bold select-all text-[9px]">JO88CBJO00100000000123456789</span>
          </div>
        </div>
      </div>

      {/* Account Link Form Modal / Slide-down */}
      {showAccountLinkModal && (
        <div className="bg-slate-900 border border-indigo-500/40 p-4 rounded-2xl flex flex-col gap-3 shadow-xl text-right">
          <div className="flex justify-between items-center flex-row-reverse pb-2 border-b border-slate-800">
            <span className="text-xs font-black text-indigo-400 flex items-center gap-1.5">
              <Link2 className="w-4 h-4" />
              <span>ربط الحساب المالي البنكي / المحفظة الإلكترونية</span>
            </span>
            <button
              type="button"
              onClick={() => setShowAccountLinkModal(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {linkSuccessMsg ? (
            <div className="bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-xl text-emerald-400 text-xs font-bold text-center">
              {linkSuccessMsg}
            </div>
          ) : (
            <form onSubmit={handleLinkAccountSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-300 font-bold">اختر نوع الحساب المالي / المحفظة:</label>
                <select
                  value={linkProvider}
                  onChange={e => setLinkProvider(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-indigo-500"
                >
                  <option value="cliq">CliQ - كليك فوري (بوابة البنك المركزي JoPACC)</option>
                  <option value="zain_cash">زين كاش (Zain Cash Mobile Wallet)</option>
                  <option value="orange_money">أورنج ماني (Orange Money Wallet)</option>
                  <option value="arab_bank">البنك العربي (Arab Bank IBAN)</option>
                  <option value="etihad_bank">بنك الاتحاد (Bank Al Etihad IBAN)</option>
                  <option value="card">بطاقة فيزا / ماستركارد (Credit/Debit Card)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-300 font-bold">اسم صاحب الحساب المالي المطابق:</label>
                <input
                  type="text"
                  required
                  value={linkName}
                  onChange={e => setLinkName(e.target.value)}
                  placeholder="الاسم الرباعي المعتمد في البنك/المحفظة"
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-300 font-bold">رقم الحساب / رقم المحفظة / IBAN:</label>
                <input
                  type="text"
                  required
                  value={linkNumber}
                  onChange={e => setLinkNumber(e.target.value)}
                  placeholder="مثال: 0791234567 أو JO88CBJO..."
                  className="bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs rounded-xl p-2.5 outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl text-xs transition mt-1 cursor-pointer"
              >
                تأكيد وربط الحساب المالي الآن 🔒
              </button>
            </form>
          )}
        </div>
      )}

      {/* Main Form & Active Pipeline View */}
      {pipelineStep === 'idle' && (
        <form onSubmit={handleStartRechargePipeline} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-4 shadow-lg">
          <span className="text-xs font-black text-slate-200 block">اختر قناة الشحن وقيمة المبلغ:</span>

          {/* Payment Method Tabs */}
          <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setPaymentChannel('card')}
              className={`py-2 px-1 rounded-lg text-center font-bold text-[9px] flex flex-col items-center gap-1 transition ${paymentChannel === 'card' ? 'bg-indigo-600 text-white font-black shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>بطاقة / e-Wallet</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentChannel('cliq')}
              className={`py-2 px-1 rounded-lg text-center font-bold text-[9px] flex flex-col items-center gap-1 transition ${paymentChannel === 'cliq' ? 'bg-indigo-600 text-white font-black shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>CliQ كليك فوري</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentChannel('bank')}
              className={`py-2 px-1 rounded-lg text-center font-bold text-[9px] flex flex-col items-center gap-1 transition ${paymentChannel === 'bank' ? 'bg-indigo-600 text-white font-black shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>حوالة بنكية</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentChannel('wallet')}
              className={`py-2 px-1 rounded-lg text-center font-bold text-[9px] flex flex-col items-center gap-1 transition ${paymentChannel === 'wallet' ? 'bg-indigo-600 text-white font-black shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>محفظة إلكترونية</span>
            </button>
          </div>

          {/* Quick Amount Selector */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center flex-row-reverse text-[10px] font-bold">
              <label className="text-slate-400">المبلغ المطلوب شحنه (بالدينار الأردني):</label>
              <span className="text-slate-500 text-[9px]">الرصيد المتاح بالحساب المربوط: <strong className="text-emerald-400">{linkedBalance.toFixed(2)} د.أ</strong></span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {['10.00', '20.00', '50.00', '100.00'].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-mono font-black border transition ${amount === amt ? `${primaryBadgeClass} border-transparent` : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'}`}
                >
                  {amt} د.أ
                </button>
              ))}
            </div>

            <input
              type="number"
              required
              step="0.5"
              min="1"
              max="500"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="أدخل مبلغاً آخر..."
              className="mt-1 bg-slate-950 border border-slate-800 text-slate-100 font-mono text-center text-sm font-black rounded-xl p-2.5 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Reference / Source Account Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[9.5px] text-slate-400 font-bold block">
              {paymentChannel === 'card' ? 'رقم بطاقة الدفع أو المحفظة المحول منها (اختياري للإثبات)' :
               paymentChannel === 'cliq' ? 'الاسم المستعار أو رقم المرجع المصرفي للحوالة' :
               'رقم الحساب المصرفي المحول منه أو المرجع البنكي'}
            </label>
            <input
              type="text"
              value={sourceRef}
              onChange={e => setSourceRef(e.target.value)}
              placeholder={paymentChannel === 'cliq' ? 'مثال: ADAM-CLI2026' : 'مثال: JO89ARAB000...'}
              className="bg-slate-950 border border-slate-800 text-slate-200 font-mono text-right text-xs rounded-xl p-2.5 focus:border-indigo-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className={`w-full font-black py-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg ${primaryBadgeClass}`}
          >
            <Lock className="w-4 h-4" />
            <span>تنفيذ طلب الشحن الآمن والاحتجاز المسبق 🛡️</span>
          </button>
        </form>
      )}

      {/* Active Pipeline Execution Steps Modal/Card */}
      {(pipelineStep === 'pre_auth' || pipelineStep === 'treasury_settlement' || pipelineStep === 'ledger_release') && (
        <div className="bg-slate-900 border border-indigo-500/30 p-6 rounded-2xl flex flex-col items-center justify-center gap-5 text-center shadow-2xl py-8">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping"></div>
            <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 animate-spin"></div>
            <Cpu className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto" />
          </div>

          <div className="flex flex-col gap-2 max-w-sm">
            {pipelineStep === 'pre_auth' && (
              <>
                <span className="text-sm font-black text-indigo-400 block">الخطوة 1: طلب العملية والاحتجاز المسبق (Pre-Auth Hold) ⏳</span>
                <p className="text-[10px] text-slate-300 leading-relaxed m-0">
                  تتواصل بوابة المدفوعات مع الحساب المالي المربوط لمعالجة واحتجاز مبلغ ({amount} د.أ) والتأكد من التغطية المالية...
                </p>
              </>
            )}

            {pipelineStep === 'treasury_settlement' && (
              <>
                <span className="text-sm font-black text-amber-400 block">الخطوة 2: المطابقة والتأكد من القيد بخزينة الشركة 🛡️</span>
                <p className="text-[10px] text-slate-300 leading-relaxed m-0">
                  جاري فحص الإشعار المشفّر المباشر بالذكاء الاصطناعي وتأكيد دخول الأموال إلى <strong>حساب خزينة شركة آدم المعتمد (ADAM Treasury Account)</strong>...
                </p>
              </>
            )}

            {pipelineStep === 'ledger_release' && (
              <>
                <span className="text-sm font-black text-emerald-400 block">الخطوة 3: تحديث دفتر الحسابات وتحرير الرصيد 💰</span>
                <p className="text-[10px] text-slate-300 leading-relaxed m-0">
                  تمت المطابقة البنكية بنجاح! جاري إصدار أمر إيداع آلي (Credit Balance) وتحرير الرصيد المتاح محلياً...
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pending Admin Approval Screen */}
      {pipelineStep === 'pending_approval' && (
        <div className="bg-slate-900 border border-amber-500/40 p-5 rounded-2xl flex flex-col gap-4 text-right shadow-2xl">
          <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl flex items-center gap-3 flex-row-reverse">
            <Clock className="w-7 h-7 text-amber-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-black text-amber-400">تم تسجيل طلب الشحن بنجاح (بانتظار موافقة الإدارة) ⏳</span>
              <span className="text-[9.5px] text-slate-300 leading-relaxed">
                وفقاً لإعدادات الخزينة المالية لشركة آدم: تم توثيق واقتطاع المبلغ ({amount} د.أ) وهو الآن قيد مراجعة وتأكيد الإدارة قبل إيداعه بالرصيد المتاح.
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-dashed border-slate-800 flex flex-col gap-2 font-mono text-[9.5px]">
            <div className="flex justify-between items-center flex-row-reverse pb-2 border-b border-slate-900">
              <span className="text-slate-400">رقم المرجع المصرفي المعلق:</span>
              <span className="text-amber-400 font-black">{clearanceCode}</span>
            </div>
            <div className="flex justify-between flex-row-reverse">
              <span className="text-slate-500">حساب الخزينة الموجه إليه:</span>
              <span className="text-slate-200">CliQ: ADAM.COMPANY</span>
            </div>
            <div className="flex justify-between flex-row-reverse">
              <span className="text-slate-500">المبلغ بانتظار الإيداع:</span>
              <span className="text-amber-400 font-bold">{amount} د.أ</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPipelineStep('idle')}
            className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>العودة للوحة المحفظة 🔄</span>
          </button>
        </div>
      )}

      {/* Completion Receipt Screen */}
      {pipelineStep === 'completed' && (
        <div className="bg-slate-900 border border-emerald-500/40 p-5 rounded-2xl flex flex-col gap-4 text-right shadow-2xl">
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl flex items-center gap-3 flex-row-reverse">
            <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-black text-emerald-400">تمت التسوية البنكية وتحرير الرصيد بنجاح! 🟢</span>
              <span className="text-[9.5px] text-slate-300">
                دخل المبلغ ({amount} د.أ) لحساب الشركة المعتمد وتمت زيادة محفظتك فوراً.
              </span>
            </div>
          </div>

          {/* Detailed Settlement Ticket */}
          <div className="bg-slate-950 p-4 rounded-xl border border-dashed border-slate-800 flex flex-col gap-2 font-mono text-[9.5px]">
            <div className="flex justify-between items-center flex-row-reverse pb-2 border-b border-slate-900">
              <span className="text-slate-400">إيصال التسوية المعتمد:</span>
              <span className="text-emerald-400 font-black">{clearanceCode}</span>
            </div>

            <div className="flex justify-between flex-row-reverse">
              <span className="text-slate-500">كود الاحتجاز المسبق (Pre-Auth):</span>
              <span className="text-slate-200">{preAuthCode}</span>
            </div>

            <div className="flex justify-between flex-row-reverse">
              <span className="text-slate-500">حساب الخزينة المستلم:</span>
              <span className="text-amber-300">CliQ: ADAM.COMPANY</span>
            </div>

            <div className="flex justify-between flex-row-reverse">
              <span className="text-slate-500">المبلغ المحرر للرصيد المتاح:</span>
              <span className="text-emerald-400 font-bold">{amount} د.أ</span>
            </div>
          </div>

          {auditReport && (
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-850 text-[9px] text-slate-300 leading-relaxed flex flex-col gap-1">
              <span className="text-amber-400 font-extrabold flex items-center gap-1 flex-row-reverse">
                <FileText className="w-3.5 h-3.5" />
                <span>تقرير التدقيق الآلي البنكي (Adam Treasury Audit Log):</span>
              </span>
              <div className="whitespace-pre-line text-slate-400 font-mono text-[8.5px] bg-slate-900 p-2 rounded border border-slate-800 mt-1">
                {auditReport}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setPipelineStep('idle')}
            className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إجراء عملية شحن جديدة 🔄</span>
          </button>
        </div>
      )}

      {/* Failure Screen */}
      {pipelineStep === 'failed' && (
        <div className="bg-slate-900 border border-rose-500/40 p-5 rounded-2xl flex flex-col gap-4 text-right shadow-2xl">
          <div className="bg-rose-950/40 border border-rose-500/30 p-3 rounded-xl flex items-center gap-3 flex-row-reverse">
            <AlertCircle className="w-7 h-7 text-rose-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-black text-rose-400">فشل التدقيق والتسوية المصرفية ❌</span>
              <span className="text-[9.5px] text-slate-300 leading-relaxed">
                {errorMessage || "لم يتم تأكيد دخول الأموال إلى حساب الخزينة المعتمد لشركة آدم. يرجى التأكد من الحوالة وتكرار المحاولة."}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPipelineStep('idle')}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
          >
            تكرار عملية الشحن والتأكد البنكي 🔄
          </button>
        </div>
      )}
    </div>
  );
};

// Simple helper icon
const ZapIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

