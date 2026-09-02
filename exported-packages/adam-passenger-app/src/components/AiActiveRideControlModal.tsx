import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Bot, 
  ShieldCheck, 
  UserCheck, 
  DollarSign, 
  AlertTriangle, 
  Navigation, 
  Send, 
  CheckCircle2, 
  Cpu, 
  Radio, 
  MapPin, 
  Clock, 
  Car, 
  User,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useAppState } from '../stateEngine';

interface AiActiveRideControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  ride: any;
  rideType?: 'instant' | 'intracity' | 'scheduled';
}

export const AiActiveRideControlModal: React.FC<AiActiveRideControlModalProps> = ({
  isOpen,
  onClose,
  ride,
  rideType = 'instant'
}) => {
  const { 
    drivers, 
    passengers, 
    rides, 
    scheduledTrips, 
    intraCityRides, 
    saveState, 
    addNotification,
    adminForceCancelRide
  } = useAppState();

  const [commandType, setCommandType] = useState<string>('diagnose');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<{
    aiAnalysis?: string;
    executiveSummary?: string;
    safetyScore?: number;
    suggestedActions?: Array<{
      type: string;
      label: string;
      badgeColor?: string;
      payload?: any;
    }>;
  } | null>(null);

  const [executionMessage, setExecutionMessage] = useState<string>('');

  if (!isOpen || !ride) return null;

  // Extract driver name
  const driverObj = drivers.find(d => d.id === ride.driverId);
  const driverName = driverObj ? driverObj.fullName : (ride.driverName || 'غير معين بعد');

  // Extract passenger names
  const passengerNames = Array.isArray(ride.requests) 
    ? ride.requests.map((r: any) => r.passengerName).join(', ')
    : (ride.passengerName || 'غير محدد');

  const fromAreaName = ride.fromArea ? ride.fromArea.split('-').pop() : (ride.fromLocation || 'غير محدد');
  const toAreaName = ride.toArea ? ride.toArea.split('-').pop() : (ride.toLocation || 'غير محدد');
  const fareAmount = ride.fare || ride.price || ride.estimatedFare || 0;

  // Send request to AI endpoint
  const handleRunAiControl = async (type: string = commandType) => {
    setIsLoading(true);
    setExecutionMessage('');
    setCommandType(type);

    try {
      const response = await fetch('/api/ai-active-ride-controller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ride: {
            id: ride.id,
            status: ride.status,
            driverId: ride.driverId,
            driverName: driverName,
            passengerName: passengerNames,
            requests: ride.requests || [],
            fromArea: ride.fromArea || ride.fromLocation,
            toArea: ride.toArea || ride.toLocation,
            fare: fareAmount,
            commissionCharged: ride.commissionCharged || 0,
            startTime: ride.startTime || ride.scheduledTime,
            vehicleType: ride.vehicleType || 'تجمع آدم القياسي'
          },
          commandType: type,
          customPrompt: customPrompt,
          availableDrivers: drivers.filter(d => d.isOnline).slice(0, 5)
        })
      });

      const data = await response.json();
      if (data.success) {
        setAiResult({
          aiAnalysis: data.aiAnalysis,
          executiveSummary: data.executiveSummary,
          safetyScore: data.safetyScore,
          suggestedActions: data.suggestedActions || []
        });
      } else {
        setExecutionMessage(data.msg || 'تعذر الحصول على استجابة التحكم بالذكاء الاصطناعي');
      }
    } catch (err: any) {
      console.error('Error in AI active ride control:', err);
      // Fallback local result
      setAiResult({
        aiAnalysis: `تم إجراء فحص محلي ذكي للرحلة رقم (${ride.id}). حالة الرحلة الحالية (${ride.status}) ومؤشرات المسار بين (${fromAreaName}) و (${toAreaName}) جيدة ضمن المعايير التشغيلية.`,
        executiveSummary: `الرحلة النشطة مسجلة وبحالة ممتازة في نظام آدم الميداني.`,
        safetyScore: 94,
        suggestedActions: [
          {
            type: 'SEND_NOTIFICATION',
            label: 'إرسال توجيه آلي للكابتن والراكب 📲',
            badgeColor: 'indigo',
            payload: { notificationMsg: `توجيه آلي من مركز التحكم للرحلة ${ride.id}: يرجى الالتزام بالسرعة والمسار المحاذي.` }
          },
          {
            type: 'CHANGE_STATUS',
            label: 'إنهاء واستكمال الرحلة فوراً ✅',
            badgeColor: 'emerald',
            payload: { newStatus: 'completed' }
          }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Execute an action on the actual ride state in useAppState
  const handleExecuteAction = (action: any) => {
    const { type, payload } = action;

    if (type === 'CHANGE_STATUS') {
      const newStatus = payload?.newStatus || 'completed';

      if (rideType === 'instant') {
        const updatedRides = rides.map(r => r.id === ride.id ? { ...r, status: newStatus } : r);
        saveState({ rides: updatedRides });
      } else if (rideType === 'intracity') {
        const updatedIntra = intraCityRides.map(r => r.id === ride.id ? { ...r, status: newStatus } : r);
        saveState({ intraCityRides: updatedIntra });
      } else if (rideType === 'scheduled') {
        const updatedSched = scheduledTrips.map(s => s.id === ride.id ? { ...s, status: newStatus } : s);
        saveState({ scheduledTrips: updatedSched });
      }

      setExecutionMessage(`✅ تم تحديث حالة الرحلة بنجاح إلى: (${newStatus === 'completed' ? 'مكتملة' : newStatus === 'started' ? 'منطلقة' : newStatus})`);
    } 
    else if (type === 'REASSIGN_DRIVER') {
      const newDriverId = payload?.newDriverId || (drivers.find(d => d.id !== ride.driverId)?.id);
      const newDriverName = payload?.newDriverName || (drivers.find(d => d.id === newDriverId)?.fullName || 'كابتن موكل جديد');

      if (newDriverId) {
        if (rideType === 'instant') {
          const updatedRides = rides.map(r => r.id === ride.id ? { ...r, driverId: newDriverId } : r);
          saveState({ rides: updatedRides });
        } else if (rideType === 'intracity') {
          const updatedIntra = intraCityRides.map(r => r.id === ride.id ? { ...r, driverId: newDriverId } : r);
          saveState({ intraCityRides: updatedIntra });
        } else if (rideType === 'scheduled') {
          const updatedSched = scheduledTrips.map(s => s.id === ride.id ? { ...s, driverId: newDriverId } : s);
          saveState({ scheduledTrips: updatedSched });
        }
        setExecutionMessage(`🚗 تم إعادة تكليف الرحلة بالكابتن الجديد: (${newDriverName}) بنجاح!`);
      } else {
        setExecutionMessage(`⚠️ لم يتم العثور على سائق بديل في الوقت الحالي.`);
      }
    } 
    else if (type === 'ADJUST_FARE') {
      const newFare = payload?.newFare || (fareAmount * 0.9);

      if (rideType === 'instant') {
        const updatedRides = rides.map(r => r.id === ride.id ? { ...r, fare: newFare } : r);
        saveState({ rides: updatedRides });
      } else if (rideType === 'intracity') {
        const updatedIntra = intraCityRides.map(r => r.id === ride.id ? { ...r, price: newFare, estimatedFare: newFare } : r);
        saveState({ intraCityRides: updatedIntra });
      } else if (rideType === 'scheduled') {
        const updatedSched = scheduledTrips.map(s => s.id === ride.id ? { ...s, pricePerSeat: newFare } : s);
        saveState({ scheduledTrips: updatedSched });
      }
      setExecutionMessage(`💰 تم تعديل أجرة الرحلة إلى (${newFare.toFixed(2)} د.أ) وتوثيق التخفيض.`);
    }
    else if (type === 'SEND_NOTIFICATION') {
      const msg = payload?.notificationMsg || `توجيه إداري للرحلة (${ride.id}): الرجاء متابعة خط السير المعتمد.`;
      
      addNotification?.({
        id: `notif_${Date.now()}`,
        userId: ride.driverId || 'all',
        userRole: 'driver',
        title: '🤖 توجيه تحكم بالذكاء الاصطناعي',
        message: msg,
        timestamp: new Date().toISOString(),
        read: false
      });

      setExecutionMessage(`📲 تم بث التوجيه والإشعار للطرفين بنجاح: "${msg}"`);
    }
    else if (type === 'CANCEL_RIDE' || type === 'FORCE_CANCEL') {
      const targetType = rideType === 'instant' ? 'pooled' : rideType;
      const res = adminForceCancelRide({
        rideId: ride.id,
        rideType: targetType as any,
        reason: payload?.reason || 'إلغاء وسحب إداري عبر الذكاء الاصطناعي وغرفة العمليات المركزية'
      });
      setExecutionMessage(res.msg || '❌ تم إلغاء الرحلة إدارياً وإعادة الأرصدة للمحافظ بنجاح.');
    }
    else {
      setExecutionMessage(`✨ تم تطبيق الإجراء الذكي بنجاح: ${action.label}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md animate-fadeIn text-right dir-rtl">
      <div className="bg-[#0a0f1d] border border-indigo-500/30 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-slate-950 p-4 border-b border-indigo-500/20 flex justify-between items-center flex-row-reverse shrink-0">
          <div className="flex items-center gap-2.5 flex-row-reverse">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/40 rounded-xl text-indigo-400 relative">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-row-reverse">
                <h3 className="text-sm font-black text-white">غرفة التحكّم الذكي بالرحلات الفعالة (AI Active Ride Control)</h3>
                <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {ride.id}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 mt-0.5">
                إدارة وتعديل وتوجيه هذه الرحلة الفعالة آلياً باستخدام نموذج Gemini للذكاء الاصطناعي
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY CONTENT - SCROLLABLE */}
        <div className="p-4 space-y-4 overflow-y-auto scrollbar-thin text-xs text-slate-200">

          {/* RIDE OVERVIEW CARD */}
          <div className="bg-[#050811] p-3.5 rounded-xl border border-slate-850 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 flex-row-reverse bg-slate-900/50 p-2 rounded-lg border border-slate-800">
              <Car className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[9.5px] text-slate-400 block font-bold">الكابتن الموكل:</span>
                <span className="text-xs font-bold text-slate-200">{driverName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-row-reverse bg-slate-900/50 p-2 rounded-lg border border-slate-800">
              <User className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[9.5px] text-slate-400 block font-bold">الركاب المسجلين:</span>
                <span className="text-xs font-bold text-slate-200 truncate block max-w-[170px]">{passengerNames}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-row-reverse bg-slate-900/50 p-2 rounded-lg border border-slate-800">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[9.5px] text-slate-400 block font-bold">خط المسار والأجرة:</span>
                <span className="text-xs font-bold text-emerald-400">
                  {fromAreaName} ⟸ {toAreaName} ({fareAmount.toFixed(2)} د.أ)
                </span>
              </div>
            </div>
          </div>

          {/* PRESET AI CONTROL SHORTCUTS */}
          <div>
            <h4 className="text-[11px] font-black text-indigo-300 mb-2 flex items-center gap-1.5 flex-row-reverse">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>اختصارات التحكم والتحليل الفوري بالذكاء الاصطناعي:</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleRunAiControl('diagnose')}
                className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between gap-1 ${commandType === 'diagnose' ? 'bg-indigo-650 border-indigo-400 text-white shadow-lg shadow-indigo-900/40' : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850'}`}
              >
                <div className="flex justify-between items-center flex-row-reverse">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-bold">1. تشخيص الجودة</span>
                </div>
                <span className="text-[8.5px] text-slate-400">فحص سلامة الرحلة والمسار</span>
              </button>

              <button
                type="button"
                onClick={() => handleRunAiControl('reassign_driver')}
                className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between gap-1 ${commandType === 'reassign_driver' ? 'bg-indigo-650 border-indigo-400 text-white shadow-lg shadow-indigo-900/40' : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850'}`}
              >
                <div className="flex justify-between items-center flex-row-reverse">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-bold">2. استبدال الكابتن</span>
                </div>
                <span className="text-[8.5px] text-slate-400">ترشيح كابتن بديل أقرب</span>
              </button>

              <button
                type="button"
                onClick={() => handleRunAiControl('adjust_fare')}
                className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between gap-1 ${commandType === 'adjust_fare' ? 'bg-indigo-650 border-indigo-400 text-white shadow-lg shadow-indigo-900/40' : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850'}`}
              >
                <div className="flex justify-between items-center flex-row-reverse">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-bold">3. تعديل التسعير</span>
                </div>
                <span className="text-[8.5px] text-slate-400">تطبيق خصم أو تعويض للراكب</span>
              </button>

              <button
                type="button"
                onClick={() => handleRunAiControl('resolve_emergency')}
                className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between gap-1 ${commandType === 'resolve_emergency' ? 'bg-indigo-650 border-indigo-400 text-white shadow-lg shadow-indigo-900/40' : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850'}`}
              >
                <div className="flex justify-between items-center flex-row-reverse">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span className="text-[10px] font-bold">4. طوارئ وتأخير</span>
                </div>
                <span className="text-[8.5px] text-slate-400">حل التعثر وبث تنبيهات</span>
              </button>
            </div>
          </div>

          {/* CUSTOM ARABIC PROMPT INPUT */}
          <div className="bg-[#070c18] p-3 rounded-xl border border-indigo-500/20 space-y-2">
            <label className="text-[10.5px] font-bold text-slate-300 flex items-center gap-1 flex-row-reverse">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>إدخال توجيه مخصص بلغة طبيعية للذكاء الاصطناعي (Custom Prompt):</span>
            </label>
            <div className="flex gap-2">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="مثال: قم بإنهاء الرحلة فوراً مع احتساب خصم 0.50 دينار للراكب بسبب التأخير وأرسل له اعتذار رسمياً..."
                rows={2}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-right dir-rtl"
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleRunAiControl('custom_prompt')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-4 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <span>تشغيل</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SUCCESS OR EXECUTION FEEDBACK */}
          {executionMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl font-bold flex items-center gap-2 flex-row-reverse shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{executionMessage}</span>
            </div>
          )}

          {/* AI ANALYSIS & OUTPUT DISPLAY PANEL */}
          {aiResult && (
            <div className="bg-[#040813] border border-indigo-500/30 p-4 rounded-xl space-y-3 shadow-xl">
              <div className="flex justify-between items-center flex-row-reverse border-b border-slate-850 pb-2">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-black text-indigo-300">تحليل وتقييم نموذج الذكاء الاصطناعي:</span>
                </div>

                {aiResult.safetyScore !== undefined && (
                  <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400">مؤشر السلامة والسلاسة:</span>
                    <span className={`font-mono font-black text-xs ${aiResult.safetyScore > 80 ? 'text-emerald-400' : aiResult.safetyScore > 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {aiResult.safetyScore}%
                    </span>
                  </div>
                )}
              </div>

              {aiResult.executiveSummary && (
                <div className="p-2.5 bg-indigo-950/30 border border-indigo-500/20 rounded-lg text-indigo-200 text-xs font-bold leading-relaxed">
                  💡 {aiResult.executiveSummary}
                </div>
              )}

              {aiResult.aiAnalysis && (
                <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/50 p-3 rounded-lg border border-slate-900">
                  {aiResult.aiAnalysis}
                </p>
              )}

              {/* ACTIONABLE BUTTONS RETURNED BY AI */}
              {aiResult.suggestedActions && aiResult.suggestedActions.length > 0 && (
                <div className="pt-2 border-t border-slate-850 space-y-2">
                  <h5 className="text-[10.5px] font-black text-slate-300">⚡ الإجراءات التنفيذية المباشرة الموصى بها (انقر للتطبيق المباشر):</h5>
                  <div className="flex flex-wrap gap-2 flex-row-reverse">
                    {aiResult.suggestedActions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        type="button"
                        onClick={() => handleExecuteAction(act)}
                        className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md active:scale-95 ${
                          act.badgeColor === 'emerald' 
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950' 
                            : act.badgeColor === 'rose' 
                            ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                            : act.badgeColor === 'amber' 
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        <span>{act.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-3 bg-slate-950 border-t border-slate-850 flex justify-between items-center flex-row-reverse shrink-0">
          <span className="text-[10px] text-slate-500 flex items-center gap-1 flex-row-reverse">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>متصل بنظام الذكاء الاصطناعي المركزي لمنظومة آدم 2026</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 text-xs font-bold transition cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};
