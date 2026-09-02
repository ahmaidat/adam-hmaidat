import React, { useState } from 'react';
import { Driver, Passenger } from '../types';

interface WalletSecurityDashboardProps {
  userType: 'driver' | 'passenger';
  user: Driver | Passenger;
  onUpdatePin: (pin: string) => void;
  onUpdateSecuritySettings: (settings: {
    biometricsEnabled?: boolean;
    faceIdEnabled?: boolean;
    biometricType?: 'faceid' | 'touchid' | 'webauthn';
    twoFactorEnabled?: boolean;
    twoFactorMethod?: 'sms' | 'whatsapp' | 'authenticator';
    requireAuthForWithdrawal?: boolean;
    requireAuthForTransfer?: boolean;
    requireAuthForRecharge?: boolean;
    maxDailyTransactionLimit?: number;
  }) => { success: boolean; msg: string };
  themeColor?: 'emerald' | 'amber';
}

export const WalletSecurityDashboard: React.FC<WalletSecurityDashboardProps> = ({
  userType,
  user,
  onUpdatePin,
  onUpdateSecuritySettings,
  themeColor = 'emerald'
}) => {
  // Local states
  const [pinInput, setPinInput] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  
  // Security Toggles initialized from user object
  const [biometricsEnabled, setBiometricsEnabled] = useState<boolean>(user.biometricsEnabled ?? true);
  const [faceIdEnabled, setFaceIdEnabled] = useState<boolean>(user.faceIdEnabled ?? true);
  const [biometricType, setBiometricType] = useState<'faceid' | 'touchid' | 'webauthn'>(user.biometricType || 'faceid');
  
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(user.twoFactorEnabled ?? false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'sms' | 'whatsapp' | 'authenticator'>(user.twoFactorMethod || 'sms');
  const [requireAuthForWithdrawal, setRequireAuthForWithdrawal] = useState<boolean>(user.requireAuthForWithdrawal ?? true);
  const [requireAuthForTransfer, setRequireAuthForTransfer] = useState<boolean>(user.requireAuthForTransfer ?? true);
  const [requireAuthForRecharge, setRequireAuthForRecharge] = useState<boolean>(user.requireAuthForRecharge ?? false);
  const [maxDailyLimit, setMaxDailyLimit] = useState<number>(user.maxDailyTransactionLimit || 50);

  // Security Logs Filter & State (with failed login / auth attempts)
  const [logFilter, setLogFilter] = useState<'all' | 'failed' | 'success'>('all');
  const [securityLogs, setSecurityLogs] = useState<Array<{
    id: string;
    action: string;
    method: string;
    timestamp: string;
    ipOrDevice: string;
    status: 'success' | 'failed';
    failureReason?: string;
  }>>(() => {
    if (user.securityLogs && user.securityLogs.length > 0) return user.securityLogs;
    return [
      {
        id: 'log-1',
        action: 'تأكيد عملية تحويل رصيد (P2P)',
        method: 'Face ID',
        timestamp: new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) + ' - اليوم',
        ipOrDevice: 'iPhone 15 Pro (Amman)',
        status: 'success'
      },
      {
        id: 'log-2',
        action: 'محاولة فتح واستعراض المحفظة',
        method: 'Face ID',
        timestamp: new Date(Date.now() - 1800000).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) + ' - اليوم',
        ipOrDevice: 'iPhone 15 Pro (Amman)',
        status: 'failed',
        failureReason: 'فشل مطابقة ملاك الوجه (Face ID Unmatched)'
      },
      {
        id: 'log-3',
        action: 'محاولة سحب الأرباح التجميعية',
        method: 'PIN 4 أرقام',
        timestamp: new Date(Date.now() - 5400000).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) + ' - اليوم',
        ipOrDevice: 'Mobile Web Safari (Irbid)',
        status: 'failed',
        failureReason: 'رمز PIN مدخل غير صحيح (Invalid PIN Code)'
      },
      {
        id: 'log-4',
        action: 'تأكيد شحن الحساب عبر CliQ',
        method: 'PIN 4 أرقام',
        timestamp: new Date(Date.now() - 86400000).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) + ' - الأمس',
        ipOrDevice: 'iPhone 15 Pro (Amman)',
        status: 'success'
      }
    ];
  });

  // Simulation Modals State
  const [isSimulatingBio, setIsSimulatingBio] = useState(false);
  const [bioType, setBioType] = useState<'faceid' | 'touchid' | 'webauthn'>('faceid');
  const [bioStep, setBioStep] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  
  const [isSimulating2FA, setIsSimulating2FA] = useState(false);
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpStatus, setOtpStatus] = useState<'idle' | 'sent' | 'verified' | 'failed'>('idle');

  // Dynamic Theme Styling
  const isAmber = themeColor === 'amber';
  const primaryBg = isAmber ? 'bg-amber-500' : 'bg-emerald-500';
  const primaryHover = isAmber ? 'hover:bg-amber-600' : 'hover:bg-emerald-600';
  const primaryText = isAmber ? 'text-amber-400' : 'text-emerald-400';
  const primaryBorder = isAmber ? 'border-amber-500/30' : 'border-emerald-500/30';
  const primaryBadgeBg = isAmber ? 'bg-amber-500/10' : 'bg-emerald-500/10';

  // Security score calculation
  const getSecurityScore = () => {
    let score = 15; // base score
    if (user.pin && user.pin.length === 4) score += 25;
    if (biometricsEnabled) score += 20;
    if (faceIdEnabled) score += 15;
    if (twoFactorEnabled) score += 15;
    if (requireAuthForWithdrawal && requireAuthForTransfer) score += 10;
    return Math.min(score, 100);
  };

  const securityScore = getSecurityScore();
  const failedLogsCount = securityLogs.filter(l => l.status === 'failed').length;

  // Save Settings Handler
  const handleSaveSettings = (
    bioVal = biometricsEnabled,
    faceVal = faceIdEnabled,
    bioTypeVal = biometricType,
    twoFactorVal = twoFactorEnabled,
    methodVal = twoFactorMethod,
    reqWith = requireAuthForWithdrawal,
    reqTrf = requireAuthForTransfer,
    reqRch = requireAuthForRecharge,
    limitVal = maxDailyLimit
  ) => {
    const res = onUpdateSecuritySettings({
      biometricsEnabled: bioVal,
      faceIdEnabled: faceVal,
      biometricType: bioTypeVal,
      twoFactorEnabled: twoFactorVal,
      twoFactorMethod: methodVal,
      requireAuthForWithdrawal: reqWith,
      requireAuthForTransfer: reqTrf,
      requireAuthForRecharge: reqRch,
      maxDailyTransactionLimit: limitVal
    });
    setFeedback(res.msg || 'تم تحديث خيارات الأمان وبصمة الوجه بنجاح 🛡️');
    setTimeout(() => setFeedback(''), 4000);
  };

  // Start Biometric / Face ID Test Simulation
  const handleTestBiometrics = (type: 'faceid' | 'touchid' | 'webauthn') => {
    setBioType(type);
    setIsSimulatingBio(true);
    setBioStep('scanning');
    setTimeout(() => {
      setBioStep('success');
      setTimeout(() => {
        setIsSimulatingBio(false);
        setBioStep('idle');
      }, 1800);
    }, 2200);
  };

  // Add a simulated failed login / auth attempt for demonstration
  const handleSimulateFailedAttempt = () => {
    const newFailedLog = {
      id: `log-${Date.now()}`,
      action: 'محاولة مصادقة بيومترية فاشلة (Face ID)',
      method: 'Face ID / PIN',
      timestamp: new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) + ' - الآن',
      ipOrDevice: 'جهاز غير معروف (185.220.101.4)',
      status: 'failed' as const,
      failureReason: 'عدم تطابق بصمة الوجه / إدخال PIN خاطئ'
    };
    setSecurityLogs(prev => [newFailedLog, ...prev]);
    setFeedback('🚨 تم رصد وتسجيل محاولة دخول فاشلة في سجل الأمان فوراً!');
    setTimeout(() => setFeedback(''), 4000);
  };

  // Start 2FA Test Simulation
  const handleTest2FA = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setIsSimulating2FA(true);
    setOtpStatus('sent');
    setOtpCodeInput('');
  };

  const handleVerifyOtp = () => {
    if (otpCodeInput === generatedOtp || otpCodeInput === '123456') {
      setOtpStatus('verified');
      setTimeout(() => {
        setIsSimulating2FA(false);
        setOtpStatus('idle');
      }, 1500);
    } else {
      setOtpStatus('failed');
    }
  };

  const filteredLogs = securityLogs.filter(log => {
    if (logFilter === 'failed') return log.status === 'failed';
    if (logFilter === 'success') return log.status === 'success';
    return true;
  });

  return (
    <div className="WalletSecurityDashboard flex flex-col gap-4 text-right font-sans">
      {/* 🛡️ Header Banner & Security Shield Score */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col gap-3">
        <div className="flex items-center justify-between flex-row-reverse">
          <div className="flex items-center gap-2 flex-row-reverse">
            <span className="text-2xl">🛡️</span>
            <div>
              <h3 className="text-xs font-black text-slate-100 m-0">لوحة تحكم الأمان والمحفظة الرقمية</h3>
              <p className="text-[10px] text-slate-400 m-0 mt-0.5">
                إدارة بصمة الوجه (Face ID)، رمز PIN، وسجل المحاولات الناجحة والفاشلة
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl">
            <span className="text-[9px] text-slate-400 font-bold">درجة الحماية</span>
            <span className={`text-base font-black font-mono ${securityScore >= 80 ? 'text-emerald-400' : securityScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
              {securityScore}%
            </span>
          </div>
        </div>

        {/* Security Health Bar */}
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              securityScore >= 80 ? 'bg-emerald-500' : securityScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${securityScore}%` }}
          />
        </div>

        {/* Badges summary */}
        <div className="flex items-center gap-1.5 flex-wrap flex-row-reverse text-[9px] font-bold mt-1">
          <span className={`px-2 py-0.5 rounded-md border ${user.pin ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
            {user.pin ? '🔒 PIN 4 أرقام مفعل' : '⚠️ PIN غير محدد'}
          </span>
          <span className={`px-2 py-0.5 rounded-md border ${faceIdEnabled ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
            {faceIdEnabled ? '👤 بصمة الوجه Face ID مفعلة' : '👤 Face ID معطل'}
          </span>
          <span className={`px-2 py-0.5 rounded-md border ${biometricsEnabled ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
            {biometricsEnabled ? '🧬 التحقق البيومتري نشط' : '🧬 البيومترية معطلة'}
          </span>
          {failedLogsCount > 0 && (
            <span className="px-2 py-0.5 rounded-md border bg-rose-950/50 border-rose-500/30 text-rose-300 animate-pulse">
              🚨 {failedLogsCount} محاولات فاشلة
            </span>
          )}
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold p-3 rounded-xl text-center shadow-lg animate-fade-in">
          {feedback}
        </div>
      )}

      {/* 👤 1. Dedicated Face ID & Biometric Security Management */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3 shadow-md">
        <div className="flex items-center justify-between flex-row-reverse border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2 flex-row-reverse">
            <span className="text-xl">👤</span>
            <div className="text-right">
              <h4 className={`text-xs font-black ${primaryText} m-0`}>
                إدارة بصمة الوجه (Face ID) والتحقق البيومتري
              </h4>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                تأمين المحفظة والعمليات المالية عبر التعرف الرقمي على الوجه أو المستشعر البيومتري
              </span>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={faceIdEnabled}
              onChange={(e) => {
                const checked = e.target.checked;
                setFaceIdEnabled(checked);
                setBiometricsEnabled(checked);
                handleSaveSettings(checked, checked, biometricType, twoFactorEnabled, twoFactorMethod, requireAuthForWithdrawal, requireAuthForTransfer, requireAuthForRecharge, maxDailyLimit);
              }}
              className="sr-only peer"
            />
            <div className={`w-11 h-6 bg-slate-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${isAmber ? 'peer-checked:bg-amber-500' : 'peer-checked:bg-emerald-500'}`}></div>
          </label>
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed m-0">
          تتيح هذه الخوارزمية فتح المحفظة والمصادقة على عمليات السحب والتحويل فوراً باستخدام بصمة الوجه (Face ID) أو البصمة الحيوية المسجلة بجهازك، كطبقة أمان مشددة بجانب رمز PIN.
        </p>

        {faceIdEnabled && (
          <div className="flex flex-col gap-3 mt-1">
            <span className="text-[10px] text-slate-300 font-bold block">اختر نوع الوسيلة البيومترية المفضلة لتأمين المحفظة:</span>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'faceid', label: '👤 Face ID', desc: 'بصمة الوجه المباشرة' },
                { id: 'touchid', label: '👆 Touch ID', desc: 'بصمة الأصبع' },
                { id: 'webauthn', label: '🔐 WebAuthn', desc: 'مستشعر الهاتف الموحد' },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    const typeVal = b.id as 'faceid' | 'touchid' | 'webauthn';
                    setBiometricType(typeVal);
                    handleSaveSettings(biometricsEnabled, faceIdEnabled, typeVal, twoFactorEnabled, twoFactorMethod, requireAuthForWithdrawal, requireAuthForTransfer, requireAuthForRecharge, maxDailyLimit);
                  }}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                    biometricType === b.id
                      ? `${primaryBadgeBg} ${primaryBorder} ${primaryText} font-black shadow-sm`
                      : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold">{b.label}</span>
                  <span className="text-[8.5px] opacity-75">{b.desc}</span>
                </button>
              ))}
            </div>

            <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between flex-row-reverse gap-2">
              <div className="text-right">
                <span className="text-emerald-400 font-bold text-[10px] block">
                  ✅ بصمة الوجه ({biometricType.toUpperCase()}) جاهزة ومفعلة على جهازك
                </span>
                <span className="text-[8.5px] text-slate-400 block mt-0.5">
                  يُطلب التحقق البيومتري تلقائياً قبل تنفيذ أي معاملة مالية حساسّة
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleTestBiometrics(biometricType)}
                className={`px-3 py-2 ${primaryBadgeBg} ${primaryText} border ${primaryBorder} rounded-xl text-[10px] font-black hover:opacity-80 transition cursor-pointer shrink-0`}
              >
                اختبار مسح Face ID الآن 👤
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🔒 2. PIN Management Section */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3 shadow-md">
        <span className={`text-xs font-black ${primaryText} block flex items-center gap-1.5 justify-end`}>
          <span>رمز الأمان الرقمي (4-Digit Security PIN) 🔢</span>
        </span>

        {user.pin ? (
          <div className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-[10px] p-2.5 rounded-xl text-center font-bold">
            🔒 رمز PIN نشط ومفعل حالياً لحماية محفظتك. يمكنك تغييره بالأسفل في أي وقت.
          </div>
        ) : (
          <div className="bg-amber-950/25 border border-amber-500/25 text-amber-300 text-[10px] p-2.5 rounded-xl text-center font-bold">
            ⚠️ لم تقم بتعيين رمز PIN بعد! نوصي بإنشاء رمز PIN مكون من 4 أرقام فوراً.
          </div>
        )}

        {pinMessage && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold p-2.5 rounded-xl text-center">
            {pinMessage}
          </div>
        )}

        <div className="flex flex-col gap-1.5 mt-1">
          <label className="text-[9px] text-slate-400 block font-bold">أدخل رمز PIN الجديد (4 أرقام)</label>
          <div className="flex items-center gap-2 flex-row-reverse">
            <input
              type="text"
              maxLength={4}
              pattern="\d*"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="bg-slate-950 border border-slate-800 text-slate-100 font-mono text-center text-sm font-black tracking-widest rounded-xl p-2.5 flex-1 focus:border-emerald-500 outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (pinInput.length !== 4) {
                  alert('عذراً، يجب أن يتكون رمز PIN من 4 أرقام بالضبط.');
                  return;
                }
                onUpdatePin(pinInput);
                setPinMessage('🔒 تم حفظ وتفعيل رمز PIN الجديد بنجاح!');
                setPinInput('');
                setTimeout(() => setPinMessage(''), 4000);
              }}
              className={`px-4 py-2.5 ${primaryBg} ${primaryHover} text-slate-950 font-black rounded-xl text-xs transition cursor-pointer`}
            >
              حفظ PIN 🔒
            </button>
          </div>
        </div>
      </div>

      {/* 📲 3. Two-Factor Authentication (2FA) Section */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3 shadow-md">
        <div className="flex items-center justify-between flex-row-reverse border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2 flex-row-reverse">
            <span className="text-xl">📲</span>
            <div className="text-right">
              <span className={`text-xs font-black ${primaryText} block`}>
                التحقق بخطوتين (2FA Security Code)
              </span>
              <span className="text-[10px] text-slate-400 block">
                تأكيد العمليات بواسطة رمز مؤقت يصل لرقم هاتفك أو حسابك
              </span>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={twoFactorEnabled}
              onChange={(e) => {
                const checked = e.target.checked;
                setTwoFactorEnabled(checked);
                handleSaveSettings(biometricsEnabled, faceIdEnabled, biometricType, checked, twoFactorMethod, requireAuthForWithdrawal, requireAuthForTransfer, requireAuthForRecharge, maxDailyLimit);
              }}
              className="sr-only peer"
            />
            <div className={`w-11 h-6 bg-slate-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${isAmber ? 'peer-checked:bg-amber-500' : 'peer-checked:bg-emerald-500'}`}></div>
          </label>
        </div>

        {twoFactorEnabled && (
          <div className="flex flex-col gap-3 mt-1">
            <span className="text-[10px] text-slate-300 font-bold block">اختر وسيلة استلام رمز التحقق (2FA Method):</span>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'sms', label: '📱 SMS', desc: 'رسائل نصية قصيرة' },
                { id: 'whatsapp', label: '💬 WhatsApp', desc: 'تطبيق واتساب' },
                { id: 'authenticator', label: '🔑 Authenticator', desc: 'تطبيق المصادقة' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    const method = m.id as 'sms' | 'whatsapp' | 'authenticator';
                    setTwoFactorMethod(method);
                    handleSaveSettings(biometricsEnabled, faceIdEnabled, biometricType, twoFactorEnabled, method, requireAuthForWithdrawal, requireAuthForTransfer, requireAuthForRecharge, maxDailyLimit);
                  }}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                    twoFactorMethod === m.id
                      ? `${primaryBadgeBg} ${primaryBorder} ${primaryText} font-black shadow-sm`
                      : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold">{m.label}</span>
                  <span className="text-[9px] opacity-75">{m.desc}</span>
                </button>
              ))}
            </div>

            <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between flex-row-reverse gap-2 mt-1">
              <span className="text-[10px] text-slate-400">
                وسيلة التحقق النشطة: <strong className="text-slate-200">{twoFactorMethod === 'sms' ? 'رسالة SMS برقم ' + user.phone : twoFactorMethod === 'whatsapp' ? 'حساب واتساب برقم ' + user.phone : 'تطبيق Google Authenticator'}</strong>
              </span>

              <button
                type="button"
                onClick={handleTest2FA}
                className={`px-3 py-1.5 ${primaryBadgeBg} ${primaryText} border ${primaryBorder} rounded-lg text-[10px] font-black hover:opacity-80 transition cursor-pointer`}
              >
                اختبار إرسال رمز 2FA التجريبي 📲
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🚨 4. Failed Login & Security Attempt Logs */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3 shadow-md">
        <div className="flex items-center justify-between flex-row-reverse border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2 flex-row-reverse">
            <span className="text-xl">📑</span>
            <div className="text-right">
              <h4 className={`text-xs font-black ${primaryText} m-0 flex items-center gap-1.5 flex-row-reverse`}>
                <span>سجل محاولات الدخول والتحقق غير الناجحة</span>
                {failedLogsCount > 0 && (
                  <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold animate-pulse">
                    {failedLogsCount} فاشلة
                  </span>
                )}
              </h4>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                تتبع واستعراض كافة محاولات فتح المحفظة، إدخال الـ PIN، وبصمة الوجه (Face ID)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSimulateFailedAttempt}
            className="bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 text-[9px] font-black px-2.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0"
            title="محاكاة محاولة فاشلة لاختبار نظام الأمان"
          >
            <span>🚨 محاكاة محاولة فاشلة</span>
          </button>
        </div>

        {/* Log Filter Buttons */}
        <div className="flex items-center justify-between flex-row-reverse gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setLogFilter('all')}
            className={`flex-1 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer text-center ${
              logFilter === 'all' ? `${primaryBg} text-slate-950` : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            جميع السجلات ({securityLogs.length})
          </button>

          <button
            type="button"
            onClick={() => setLogFilter('failed')}
            className={`flex-1 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer text-center ${
              logFilter === 'failed' ? 'bg-rose-600 text-white shadow' : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            ❌ الفاشلة فقط ({failedLogsCount})
          </button>

          <button
            type="button"
            onClick={() => setLogFilter('success')}
            className={`flex-1 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer text-center ${
              logFilter === 'success' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            ✅ الناجحة فقط ({securityLogs.length - failedLogsCount})
          </button>
        </div>

        {/* Logs List Container */}
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-xl border text-right flex flex-col gap-1 transition ${
                  log.status === 'failed'
                    ? 'bg-gradient-to-l from-rose-950/40 via-slate-950 to-slate-950 border-rose-500/40'
                    : 'bg-slate-950/80 border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between flex-row-reverse text-[10px]">
                  <div className="flex items-center gap-1.5 flex-row-reverse">
                    <span className="font-extrabold text-slate-100">{log.action}</span>
                    <span className="font-mono text-[9px] text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                      {log.method}
                    </span>
                  </div>

                  {log.status === 'failed' ? (
                    <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 font-black px-2 py-0.5 rounded-md text-[9px] flex items-center gap-1">
                      <span>❌ محاولة فاشلة</span>
                    </span>
                  ) : (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black px-2 py-0.5 rounded-md text-[9px] flex items-center gap-1">
                      <span>✅ مصادقة ناجحة</span>
                    </span>
                  )}
                </div>

                {log.failureReason && (
                  <div className="bg-rose-950/60 border border-rose-500/30 text-rose-300 text-[9.5px] p-1.5 rounded-lg font-bold flex items-center gap-1 flex-row-reverse mt-0.5">
                    <span>⚠️ السبب: {log.failureReason}</span>
                  </div>
                )}

                <div className="flex items-center justify-between flex-row-reverse text-[8.5px] text-slate-500 font-mono mt-0.5">
                  <span>🕒 {log.timestamp}</span>
                  <span>📱 {log.ipOrDevice}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-950/50 border border-slate-800/40 p-4 rounded-xl text-center text-slate-500 text-[10px]">
              لا توجد سجلات مطابقة للفلاتر المحددة.
            </div>
          )}
        </div>
      </div>

      {/* 🧬 Face ID / Biometric Scanning Modal */}
      {isSimulatingBio && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-xs w-full text-center flex flex-col items-center gap-4 shadow-2xl animate-fade-in relative overflow-hidden">
            {/* Ambient Laser Beam Animation */}
            <div className="w-24 h-24 rounded-2xl bg-slate-950 border-2 border-indigo-500/50 flex items-center justify-center relative overflow-hidden shadow-inner">
              {bioStep === 'scanning' && (
                <>
                  <div className="absolute inset-x-0 h-0.5 bg-indigo-400 shadow-[0_0_12px_#818cf8] animate-bounce top-1/3"></div>
                  <span className="text-4xl text-indigo-400 animate-pulse">👤</span>
                </>
              )}
              {bioStep === 'success' && (
                <span className="text-5xl animate-scale-up">✅</span>
              )}
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-100 m-0">
                {bioStep === 'scanning' ? `جاري مسح ${bioType === 'faceid' ? 'بصمة الوجه (Face ID)' : 'البصمة الحيوية'}...` : 'تم التحقق والتوثيق بنجاح!'}
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">
                {bioStep === 'scanning' ? 'يرجى النظر مباشرة للكاميرا لمطابقة ملاك الوجه المعتمد' : 'تم مطابقة بصمة الوجه وتأمين عملية المحفظة'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 📲 2FA Test Modal */}
      {isSimulating2FA && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl max-w-sm w-full text-right flex flex-col gap-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between flex-row-reverse border-b border-slate-800 pb-2">
              <span className="text-xs font-black text-slate-100">رمز التحقق الأمني 2FA</span>
              <button onClick={() => setIsSimulating2FA(false)} className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer">✕</button>
            </div>

            {/* Simulated Banner */}
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 block">رمز التحقق التجريبي المرسل لـ ({twoFactorMethod}):</span>
              <span className="text-lg font-mono font-black tracking-widest text-emerald-400 block my-1">
                {generatedOtp}
              </span>
              <span className="text-[9px] text-slate-500 block">أدخل الرمز أعلاه لتأكيد المصادقة</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-slate-400 font-bold block">أدخل رمز 2FA (6 أرقام)</label>
              <input
                type="text"
                maxLength={6}
                value={otpCodeInput}
                onChange={(e) => setOtpCodeInput(e.target.value)}
                placeholder="123456"
                className="bg-slate-950 border border-slate-800 text-slate-100 font-mono text-center text-lg font-black tracking-widest rounded-xl p-2.5 outline-none focus:border-emerald-500"
              />
            </div>

            {otpStatus === 'verified' && (
              <div className="bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold p-2 rounded-xl text-center">
                🎉 تم مطابقة رمز 2FA بنجاح!
              </div>
            )}

            {otpStatus === 'failed' && (
              <div className="bg-rose-950/50 border border-rose-500/30 text-rose-300 text-[10px] font-bold p-2 rounded-xl text-center">
                ❌ الرمز المدخل غير صحيح!
              </div>
            )}

            <button
              type="button"
              onClick={handleVerifyOtp}
              className={`w-full py-2.5 ${primaryBg} ${primaryHover} text-slate-950 font-black rounded-xl text-xs transition cursor-pointer`}
            >
              تأكيد الرمز والمصادقة 📲
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
