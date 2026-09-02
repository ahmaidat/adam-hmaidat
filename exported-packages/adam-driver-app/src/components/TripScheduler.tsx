import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAppState } from '../stateEngine';
import { DEFAULT_LOCATIONS } from '../locationData';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Clock, 
  Sparkles, 
  User, 
  Check, 
  Plus, 
  Minus,
  Briefcase,
  AlertCircle,
  Trash2
} from 'lucide-react';

interface TripSchedulerProps {
  onSuccess?: (msg: string) => void;
}

export const TripScheduler: React.FC<TripSchedulerProps> = ({ onSuccess }) => {
  const { 
    createAdminScheduledTrip, 
    generateHourlyScheduledTrips,
    clearEmptyAutoScheduledTrips,
    drivers, 
    language,
    t 
  } = useAppState();

  // Mode: Single trip vs Auto Recurring Sequential Trips
  const [scheduleMode, setScheduleMode] = useState<'single' | 'auto_recurring'>('auto_recurring');

  // Auto recurring configuration states
  const [autoSpan, setAutoSpan] = useState<'today' | '2days' | 'week' | 'month' | 'year'>('2days');
  const [autoInterval, setAutoInterval] = useState<number>(10);
  const [autoIs24, setAutoIs24] = useState<boolean>(false);
  const [autoStartHour, setAutoStartHour] = useState<number>(6);
  const [autoEndHour, setAutoEndHour] = useState<number>(22);
  const [autoBiDir, setAutoBiDir] = useState<boolean>(true);

  // Address parts for From (الانطلاق)
  const [fromGov, setFromGov] = useState<string>('عمان (Amman)');
  const [fromDist, setFromDist] = useState<string>('');
  const [fromVillage, setFromVillage] = useState<string>('');

  // Address parts for To (الوصول)
  const [toGov, setToGov] = useState<string>('إربد (Irbid)');
  const [toDist, setToDist] = useState<string>('');
  const [toVillage, setToVillage] = useState<string>('');

  // AI Integration states
  const [fromGovDistricts, setFromGovDistricts] = useState<{ name: string, villages: string[] }[]>([]);
  const [toGovDistricts, setToGovDistricts] = useState<{ name: string, villages: string[] }[]>([]);
  const [fromLoading, setFromLoading] = useState<boolean>(false);
  const [toLoading, setToLoading] = useState<boolean>(false);

  const [isFromDistManual, setIsFromDistManual] = useState<boolean>(false);
  const [isFromVillageManual, setIsFromVillageManual] = useState<boolean>(false);
  const [isToDistManual, setIsToDistManual] = useState<boolean>(false);
  const [isToVillageManual, setIsToVillageManual] = useState<boolean>(false);

  const [aiSourceFrom, setAiSourceFrom] = useState<string>('');
  const [aiSourceTo, setAiSourceTo] = useState<string>('');

  React.useEffect(() => {
    let active = true;

    // Set instant local fallback from DEFAULT_LOCATIONS
    const localGov = DEFAULT_LOCATIONS.find(l => l.governorate === fromGov);
    if (localGov && localGov.districts) {
      setFromGovDistricts(localGov.districts);
      if (localGov.districts.length > 0) {
        setFromDist(localGov.districts[0].name);
        if (localGov.districts[0].villages.length > 0) {
          setFromVillage(localGov.districts[0].villages[0]);
        } else {
          setFromVillage('');
        }
      } else {
        setFromDist('');
        setFromVillage('');
      }
    }

    const fetchFromDistricts = async () => {
      setFromLoading(true);
      setAiSourceFrom('');
      try {
        const response = await fetch('/api/get-areas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ governorate: fromGov })
        });
        const data = await response.json();
        if (active && data.success && data.districts && data.districts.length > 0) {
          setFromGovDistricts(data.districts);
          setAiSourceFrom(data.source === 'gemini-ai' ? 'ذكاء اصطناعي' : 'خريطة مدمجة');
          setIsFromDistManual(false);
          setIsFromVillageManual(false);

          if (data.districts.length > 0) {
            setFromDist(data.districts[0].name);
            if (data.districts[0].villages.length > 0) {
              setFromVillage(data.districts[0].villages[0]);
            } else {
              setFromVillage('');
            }
          } else {
            setFromDist('');
            setFromVillage('');
          }
        }
      } catch (err) {
        console.error("Error fetching districts for From:", err);
      } finally {
        if (active) setFromLoading(false);
      }
    };
    fetchFromDistricts();
    return () => { active = false; };
  }, [fromGov]);

  React.useEffect(() => {
    let active = true;

    // Set instant local fallback from DEFAULT_LOCATIONS
    const localGov = DEFAULT_LOCATIONS.find(l => l.governorate === toGov);
    if (localGov && localGov.districts) {
      setToGovDistricts(localGov.districts);
      if (localGov.districts.length > 0) {
        setToDist(localGov.districts[0].name);
        if (localGov.districts[0].villages.length > 0) {
          setToVillage(localGov.districts[0].villages[0]);
        } else {
          setToVillage('');
        }
      } else {
        setToDist('');
        setToVillage('');
      }
    }

    const fetchToDistricts = async () => {
      setToLoading(true);
      setAiSourceTo('');
      try {
        const response = await fetch('/api/get-areas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ governorate: toGov })
        });
        const data = await response.json();
        if (active && data.success && data.districts && data.districts.length > 0) {
          setToGovDistricts(data.districts);
          setAiSourceTo(data.source === 'gemini-ai' ? 'ذكاء اصطناعي' : 'خريطة مدمجة');
          setIsToDistManual(false);
          setIsToVillageManual(false);

          if (data.districts.length > 0) {
            setToDist(data.districts[0].name);
            if (data.districts[0].villages.length > 0) {
              setToVillage(data.districts[0].villages[0]);
            } else {
              setToVillage('');
            }
          } else {
            setToDist('');
            setToVillage('');
          }
        }
      } catch (err) {
        console.error("Error fetching districts for To:", err);
      } finally {
        if (active) setToLoading(false);
      }
    };
    fetchToDistricts();
    return () => { active = false; };
  }, [toGov]);

  const handleFromDistChange = (value: string) => {
    if (value === '__manual__') {
      setIsFromDistManual(true);
      setFromDist('');
      setFromVillage('');
      setIsFromVillageManual(true);
    } else {
      setIsFromDistManual(false);
      setFromDist(value);
      const foundDist = fromGovDistricts.find(d => d.name === value);
      if (foundDist && foundDist.villages.length > 0) {
        setIsFromVillageManual(false);
        setFromVillage(foundDist.villages[0]);
      } else {
        setIsFromVillageManual(true);
        setFromVillage('');
      }
    }
  };

  const handleFromVillageChange = (value: string) => {
    if (value === '__manual__') {
      setIsFromVillageManual(true);
      setFromVillage('');
    } else {
      setIsFromVillageManual(false);
      setFromVillage(value);
    }
  };

  const handleToDistChange = (value: string) => {
    if (value === '__manual__') {
      setIsToDistManual(true);
      setToDist('');
      setToVillage('');
      setIsToVillageManual(true);
    } else {
      setIsToDistManual(false);
      setToDist(value);
      const foundDist = toGovDistricts.find(d => d.name === value);
      if (foundDist && foundDist.villages.length > 0) {
        setIsToVillageManual(false);
        setToVillage(foundDist.villages[0]);
      } else {
        setIsToVillageManual(true);
        setToVillage('');
      }
    }
  };

  const handleToVillageChange = (value: string) => {
    if (value === '__manual__') {
      setIsToVillageManual(true);
      setToVillage('');
    } else {
      setIsToVillageManual(false);
      setToVillage(value);
    }
  };

  // Trip details
  const [depTime, setDepTime] = useState<string>('');
  const [seatsCount, setSeatsCount] = useState<number>(4);
  const [customFare, setCustomFare] = useState<string>('');
  const [customComm, setCustomComm] = useState<string>('');
  const [driverId, setDriverId] = useState<string>('');
  const [isPinnedDaily, setIsPinnedDaily] = useState<boolean>(false);

  // Message & Error states
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Helpers to quickly set time
  const setQuickTime = (hoursToAdd: number) => {
    const d = new Date();
    d.setHours(d.getHours() + hoursToAdd);
    // Format to local datetime-local value: YYYY-MM-DDTHH:MM
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    setDepTime(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
  };

  const setTomorrowTime = (hour: number) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hour, 0, 0, 0);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(hour).padStart(2, '0');
    setDepTime(`${yyyy}-${mm}-${dd}T${hh}:00`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fromDist.trim() || !fromVillage.trim() || !toDist.trim() || !toVillage.trim()) {
      setErrorMsg('يرجى تحديد تفاصيل الانطلاق والوصول الجغرافية بدقة لهذا المسار!');
      return;
    }

    const fareVal = customFare ? Number(customFare) : undefined;
    const commVal = customComm ? Number(customComm) : undefined;

    // Build area strings exactly matching system pattern
    const fullFromArea = `${fromGov} - ${fromDist.trim()} - ${fromVillage.trim()}`;
    const fullToArea = `${toGov} - ${toDist.trim()} - ${toVillage.trim()}`;

    // Handle Auto Recurring Sequential Generation
    if (scheduleMode === 'auto_recurring') {
      const res = generateHourlyScheduledTrips({
        overrideSpan: autoSpan,
        overrideInterval: autoInterval,
        is24Hours: autoIs24,
        hourStart: autoStartHour,
        hourEnd: autoEndHour,
        targetRouteFrom: fullFromArea,
        targetRouteTo: fullToArea,
        govFrom: fromGov,
        distFrom: fromDist.trim(),
        govTo: toGov,
        distTo: toDist.trim(),
        customFare: fareVal,
        isBiDirectional: autoBiDir,
        useAiEngine: true
      });

      if (res.success) {
        setSuccessMsg(res.msg);
        if (onSuccess) onSuccess(res.msg);
      } else {
        setErrorMsg(res.msg);
      }
      return;
    }

    // Single Trip Mode
    if (!depTime) {
      setErrorMsg('يرجى تحديد تاريخ ووقت المغادرة الفعلي للرحلة الفردية!');
      return;
    }

    if (seatsCount < 1 || seatsCount > 50) {
      setErrorMsg('عدد المقاعد يجب أن يكون بين 1 و 50 مقعداً!');
      return;
    }

    const formattedDepTime = depTime.replace('T', ' ');

    const res = createAdminScheduledTrip(
      fullFromArea,
      fullToArea,
      formattedDepTime,
      fareVal,
      commVal,
      driverId || null,
      isPinnedDaily,
      false, // aiGenerated = false
      fromGov,
      fromDist.trim(),
      toGov,
      toDist.trim(),
      seatsCount
    );

    if (res.success) {
      const msg = `تم بنجاح جدولة ونشر الرحلة المركزية بـ (${seatsCount}) مقاعد!`;
      setSuccessMsg(msg);
      if (onSuccess) onSuccess(msg);

      // Reset form fields
      setFromDist('');
      setFromVillage('');
      setToDist('');
      setToVillage('');
      setDepTime('');
      setSeatsCount(4);
      setCustomFare('');
      setCustomComm('');
      setDriverId('');
      setIsPinnedDaily(false);

      setTimeout(() => setSuccessMsg(''), 5000);
    } else {
      setErrorMsg(res.msg || 'فشلت عملية إنشاء الرحلة المجدولة.');
    }
  };

  // Live preview data
  const selectedDriverName = driverId ? (drivers.find(d => d.id === driverId)?.fullName || 'الكابتن المعين') : 'انتظار كابتن معتمد';
  const displayFrom = fromDist && fromVillage ? `${fromGov.split(' ')[0]} (لواء ${fromDist} - ${fromVillage})` : 'نقطة الانطلاق...';
  const displayTo = toDist && toVillage ? `${toGov.split(' ')[0]} (لواء ${toDist} - ${toVillage})` : 'نقطة الوصول...';
  const displayTime = depTime ? depTime.replace('T', ' ') : 'مثال: 2026-07-15 14:30';

  return (
    <div className="bg-slate-900 border border-indigo-500/30 p-5 rounded-2xl flex flex-col gap-5 text-right font-sans shadow-xl relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center flex-col-reverse md:flex-row-reverse border-b border-slate-800 pb-3 gap-3">
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end flex-row-reverse">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="bg-indigo-600/10 border border-indigo-500/30 text-[9px] font-black text-indigo-400 py-0.5 px-2 rounded-full uppercase tracking-wider">
              لوحة التحكم المتقدمة
            </span>
          </div>
          <h4 className="text-sm font-black text-slate-100 mt-1">جدولة الرحلات المركزية الذكية (Trip Scheduler Pro)</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">صمم ونشر رحلات تجميعية دقيقة بالمقاعد والتوقيت لخدمة الكباتن والركاب فوراً</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 text-[11px] text-emerald-300 rounded-xl text-right font-bold flex items-center justify-end gap-2 flex-row-reverse animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-950/50 border border-rose-500/30 text-[11px] text-rose-300 rounded-xl text-right font-bold flex items-center justify-end gap-2 flex-row-reverse">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Input Form Fields (Lg: 7 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 flex flex-col gap-4">
          
          {/* SCHEDULE MODE SWITCHER */}
          <div className="bg-slate-950/60 border border-slate-800 p-2 rounded-xl flex gap-2 text-right">
            <button
              type="button"
              onClick={() => setScheduleMode('auto_recurring')}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                scheduleMode === 'auto_recurring' 
                  ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white shadow-md' 
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>⚡ توليد متكرر تلقائي لهذا المسار (عداد الدقائق)</span>
            </button>
            <button
              type="button"
              onClick={() => setScheduleMode('single')}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                scheduleMode === 'single' 
                  ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md' 
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>📅 إدراج رحلة فردية بموعد محدد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* FROM AREA (نقطة الانطلاق) */}
            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col gap-3 relative">
              <div className="flex items-center gap-1.5 justify-end flex-row-reverse border-b border-slate-800/60 pb-1.5">
                <div className="flex items-center gap-1 flex-row-reverse">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] font-bold text-amber-500">📍 نقطة الانطلاق والتحرك الأولى</span>
                </div>
                {aiSourceFrom && (
                  <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-400 py-0.5 px-1.5 rounded-full flex items-center gap-0.5 font-bold animate-pulse">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    {aiSourceFrom}
                  </span>
                )}
              </div>
              
              <div className="flex flex-col gap-1 text-right">
                <span className="text-[9px] text-slate-400">المحافظة</span>
                <select
                  value={fromGov}
                  onChange={e => setFromGov(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition cursor-pointer"
                >
                  <option value="عمان (Amman)">عمان (Amman)</option>
                  <option value="إربد (Irbid)">إربد (Irbid)</option>
                  <option value="الزرقاء (Zarqa)">الزرقاء (Zarqa)</option>
                  <option value="البلقاء (Balqa)">البلقاء (Balqa)</option>
                  <option value="الكرك (Karak)">الكرك (Karak)</option>
                  <option value="العقبة (Aqaba)">العقبة (Aqaba)</option>
                  <option value="المفرق (Mafraq)">المفرق (Mafraq)</option>
                  <option value="جرش (Jerash)">جرش (Jerash)</option>
                  <option value="عجلون (Ajloun)">عجلون (Ajloun)</option>
                  <option value="مادبا (Madaba)">مادبا (Madaba)</option>
                  <option value="الطفيلة (Tafilah)">الطفيلة (Tafilah)</option>
                  <option value="معان (Ma'an)">معان (Ma'an)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 text-right">
                <div className="flex justify-between items-center">
                  {isFromDistManual ? (
                    <button
                      type="button"
                      onClick={() => handleFromDistChange(fromGovDistricts[0]?.name || '')}
                      className="text-[9px] text-amber-400 hover:underline cursor-pointer"
                    >
                      🔄 العودة للقائمة الذكية
                    </button>
                  ) : (
                    <span className="text-[8px] text-slate-500">تم جلبها عبر الـ AI</span>
                  )}
                  <span className="text-[9px] text-slate-400">اللواء أو المنطقة الكبرى</span>
                </div>
                {fromLoading ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-400 text-center animate-pulse">
                    📡 جاري استحضار الألوية بالذكاء الاصطناعي...
                  </div>
                ) : isFromDistManual ? (
                  <input
                    type="text"
                    value={fromDist}
                    onChange={e => setFromDist(e.target.value)}
                    placeholder="اللواء أو المنطقة الكبرى"
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 text-right outline-none focus:border-amber-500 transition"
                    required
                  />
                ) : (
                  <select
                    value={fromDist}
                    onChange={e => handleFromDistChange(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition cursor-pointer"
                  >
                    {fromGovDistricts.map((dist, idx) => (
                      <option key={idx} value={dist.name}>{dist.name}</option>
                    ))}
                    <option value="__manual__">➕ كتابة لواء آخر يدوياً...</option>
                  </select>
                )}
              </div>

              <div className="flex flex-col gap-1 text-right">
                <div className="flex justify-between items-center">
                  {isFromVillageManual && !isFromDistManual ? (
                    <button
                      type="button"
                      onClick={() => {
                        const found = fromGovDistricts.find(d => d.name === fromDist);
                        if (found && found.villages.length > 0) {
                          handleFromVillageChange(found.villages[0]);
                        }
                      }}
                      className="text-[9px] text-amber-400 hover:underline cursor-pointer"
                    >
                      🔄 العودة للمقترحات الذكية
                    </button>
                  ) : !isFromDistManual ? (
                    <span className="text-[8px] text-slate-500">تكامل فوري بالذكاء الاصطناعي</span>
                  ) : null}
                  <span className="text-[9px] text-slate-400">القرية أو الحي التفصيلي</span>
                </div>
                {fromLoading ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-400 text-center animate-pulse">
                    📡 جاري تحميل الأحياء...
                  </div>
                ) : isFromVillageManual ? (
                  <input
                    type="text"
                    value={fromVillage}
                    onChange={e => setFromVillage(e.target.value)}
                    placeholder="القرية أو الحي"
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 text-right outline-none focus:border-amber-500 transition"
                    required
                  />
                ) : (
                  <select
                    value={fromVillage}
                    onChange={e => handleFromVillageChange(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition cursor-pointer"
                  >
                    {(fromGovDistricts.find(d => d.name === fromDist)?.villages || []).map((village, idx) => (
                      <option key={idx} value={village}>{village}</option>
                    ))}
                    <option value="__manual__">➕ كتابة قرية/حي آخر يدوياً...</option>
                  </select>
                )}
              </div>
            </div>

            {/* TO AREA (نقطة الوصول) */}
            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col gap-3 relative">
              <div className="flex items-center gap-1.5 justify-end flex-row-reverse border-b border-slate-800/60 pb-1.5">
                <div className="flex items-center gap-1 flex-row-reverse">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px] font-bold text-indigo-400">🏁 وجهة الوصول والنزول النهائية</span>
                </div>
                {aiSourceTo && (
                  <span className="text-[8px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 py-0.5 px-1.5 rounded-full flex items-center gap-0.5 font-bold animate-pulse">
                    <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                    {aiSourceTo}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1 text-right">
                <span className="text-[9px] text-slate-400">المحافظة</span>
                <select
                  value={toGov}
                  onChange={e => setToGov(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-400 transition cursor-pointer"
                >
                  <option value="عمان (Amman)">عمان (Amman)</option>
                  <option value="إربد (Irbid)">إربد (Irbid)</option>
                  <option value="الزرقاء (Zarqa)">الزرقاء (Zarqa)</option>
                  <option value="البلقاء (Balqa)">البلقاء (Balqa)</option>
                  <option value="الكرك (Karak)">الكرك (Karak)</option>
                  <option value="العقبة (Aqaba)">العقبة (Aqaba)</option>
                  <option value="المفرق (Mafraq)">المفرق (Mafraq)</option>
                  <option value="جرش (Jerash)">جرش (Jerash)</option>
                  <option value="عجلون (Ajloun)">عجلون (Ajloun)</option>
                  <option value="مادبا (Madaba)">مادبا (Madaba)</option>
                  <option value="الطفيلة (Tafilah)">الطفيلة (Tafilah)</option>
                  <option value="معان (Ma'an)">معان (Ma'an)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 text-right">
                <div className="flex justify-between items-center">
                  {isToDistManual ? (
                    <button
                      type="button"
                      onClick={() => handleToDistChange(toGovDistricts[0]?.name || '')}
                      className="text-[9px] text-indigo-400 hover:underline cursor-pointer"
                    >
                      🔄 العودة للقائمة الذكية
                    </button>
                  ) : (
                    <span className="text-[8px] text-slate-500">تم جلبها عبر الـ AI</span>
                  )}
                  <span className="text-[9px] text-slate-400">اللواء أو المنطقة الكبرى</span>
                </div>
                {toLoading ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-400 text-center animate-pulse">
                    📡 جاري استحضار الألوية بالذكاء الاصطناعي...
                  </div>
                ) : isToDistManual ? (
                  <input
                    type="text"
                    value={toDist}
                    onChange={e => setToDist(e.target.value)}
                    placeholder="اللواء أو المنطقة الكبرى"
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 text-right outline-none focus:border-indigo-400 transition"
                    required
                  />
                ) : (
                  <select
                    value={toDist}
                    onChange={e => handleToDistChange(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-400 transition cursor-pointer"
                  >
                    {toGovDistricts.map((dist, idx) => (
                      <option key={idx} value={dist.name}>{dist.name}</option>
                    ))}
                    <option value="__manual__">➕ كتابة لواء آخر يدوياً...</option>
                  </select>
                )}
              </div>

              <div className="flex flex-col gap-1 text-right">
                <div className="flex justify-between items-center">
                  {isToVillageManual && !isToDistManual ? (
                    <button
                      type="button"
                      onClick={() => {
                        const found = toGovDistricts.find(d => d.name === toDist);
                        if (found && found.villages.length > 0) {
                          handleToVillageChange(found.villages[0]);
                        }
                      }}
                      className="text-[9px] text-indigo-400 hover:underline cursor-pointer"
                    >
                      🔄 العودة للمقترحات الذكية
                    </button>
                  ) : !isToDistManual ? (
                    <span className="text-[8px] text-slate-500">تكامل فوري بالذكاء الاصطناعي</span>
                  ) : null}
                  <span className="text-[9px] text-slate-400">القرية أو الحي التفصيلي</span>
                </div>
                {toLoading ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-400 text-center animate-pulse">
                    📡 جاري تحميل الأحياء...
                  </div>
                ) : isToVillageManual ? (
                  <input
                    type="text"
                    value={toVillage}
                    onChange={e => setToVillage(e.target.value)}
                    placeholder="القرية أو الحي"
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 text-right outline-none focus:border-indigo-400 transition"
                    required
                  />
                ) : (
                  <select
                    value={toVillage}
                    onChange={e => handleToVillageChange(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-400 transition cursor-pointer"
                  >
                    {(toGovDistricts.find(d => d.name === toDist)?.villages || []).map((village, idx) => (
                      <option key={idx} value={village}>{village}</option>
                    ))}
                    <option value="__manual__">➕ كتابة قرية/حي آخر يدوياً...</option>
                  </select>
                )}
              </div>
            </div>
          </div>
          <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-xl flex flex-col gap-4">
            
            {scheduleMode === 'auto_recurring' ? (
              <div className="flex flex-col gap-3 border-b border-slate-800/60 pb-3">
                <div className="flex justify-between items-center flex-row-reverse">
                  <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5 flex-row-reverse">
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>⚙️ إعدادات التوليد المتسلسل التلقائي للمسار المختار</span>
                  </span>
                  <span className="text-[9px] text-slate-400">تغطية تكرار ذكية بدون تعارض</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* RECURRENCE SPAN */}
                  <div className="flex flex-col gap-1 text-right">
                    <label className="text-[10px] font-bold text-slate-300">📅 نطاق ومدى الجدولة والتكرار</label>
                    <select
                      value={autoSpan}
                      onChange={e => setAutoSpan(e.target.value as any)}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                    >
                      <option value="today">🗓️ يومي (توليد رحلات اليوم فقط)</option>
                      <option value="2days">🗓️ يومين متتاليين (اليوم وغداً - افتراضي)</option>
                      <option value="week">🗓️ أسبوعي (جدولة 7 أيام متتالية)</option>
                      <option value="month">🗓️ شهري (جدولة 30 يوماً مقبلة)</option>
                      <option value="year">🗓️ سنوي (جدولة 365 يوماً تلقائية)</option>
                    </select>
                  </div>

                  {/* MINUTE INTERVAL COUNTER */}
                  <div className="flex flex-col gap-1 text-right">
                    <label className="text-[10px] font-bold text-slate-300">⏱️ العداد الفاصل (رحلة كل X دقيقة)</label>
                    <select
                      value={autoInterval}
                      onChange={e => setAutoInterval(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                    >
                      <option value={10}>⚡ كل 10 دقائق (كثافة فائقة ومطلوبة)</option>
                      <option value={15}>⏱️ كل 15 دقيقة (ربع ساعة)</option>
                      <option value={20}>⏱️ كل 20 دقيقة</option>
                      <option value={30}>⏱️ كل 30 دقيقة (نصف ساعة)</option>
                      <option value={45}>⏱️ كل 45 دقيقة</option>
                      <option value={60}>⏱️ كل 60 دقيقة (ساعة كاملة)</option>
                    </select>
                  </div>
                </div>

                {/* OPERATING HOURS & BIDIRECTIONAL TOGGLE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                  <div className="flex flex-col gap-1 text-right">
                    <label className="text-[10px] font-bold text-slate-300">🕒 ساعات التغطية اليومية</label>
                    <div className="flex items-center gap-2 mt-0.5">
                      <button
                        type="button"
                        onClick={() => setAutoIs24(!autoIs24)}
                        className={`py-1.5 px-3 rounded-lg text-[10px] font-bold transition border cursor-pointer ${
                          autoIs24 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {autoIs24 ? '🌐 24 ساعة (24/7)' : '⏰ من 06:00 إلى 22:00'}
                      </button>
                      {!autoIs24 && (
                        <div className="flex items-center gap-1 text-xs font-mono text-slate-300 dir-ltr">
                          <input 
                            type="number" 
                            min={0} 
                            max={23} 
                            value={autoStartHour} 
                            onChange={e => setAutoStartHour(Number(e.target.value))}
                            className="w-10 bg-slate-900 border border-slate-800 rounded text-center p-1" 
                          />
                          <span>-</span>
                          <input 
                            type="number" 
                            min={0} 
                            max={23} 
                            value={autoEndHour} 
                            onChange={e => setAutoEndHour(Number(e.target.value))}
                            className="w-10 bg-slate-900 border border-slate-800 rounded text-center p-1" 
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BI-DIRECTIONAL OPTION */}
                  <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg flex items-center justify-end self-end">
                    <label className="flex items-center gap-2 flex-row-reverse cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoBiDir}
                        onChange={e => setAutoBiDir(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                      />
                      <div className="text-right flex flex-col">
                        <span className="text-[10px] font-bold text-emerald-400">🔄 توليد الرحلات بالاتجاهين العكسيين</span>
                        <span className="text-[8.5px] text-slate-400">إنشاء مواعيد بالاتجاه [A ➔ B] والاتجاه العكسي [B ➔ A]</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              /* DEPARTURE TIME SELECTION FOR SINGLE TRIP */
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center flex-row-reverse">
                  <label className="text-[10px] font-bold text-slate-300 flex items-center gap-1 flex-row-reverse">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>📅 موعد وانطلاق الرحلة الفردية</span>
                  </label>
                  <span className="text-[8.5px] text-slate-400">أو حدد توقيتاً سريعاً أدناه:</span>
                </div>
                
                <input
                  type="datetime-local"
                  value={depTime}
                  onChange={e => setDepTime(e.target.value)}
                  className="bg-slate-900 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 text-right cursor-pointer"
                />

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap gap-1.5 justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => setQuickTime(2)}
                    className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-[9px] py-1 px-2.5 rounded-md text-slate-300 cursor-pointer transition font-mono"
                  >
                    ⏱️ بعد ساعتين
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickTime(4)}
                    className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-[9px] py-1 px-2.5 rounded-md text-slate-300 cursor-pointer transition font-mono"
                  >
                    ⏱️ بعد 4 ساعات
                  </button>
                  <button
                    type="button"
                    onClick={() => setTomorrowTime(8)}
                    className="bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-900/40 text-[9px] py-1 px-2.5 rounded-md text-indigo-300 cursor-pointer transition font-mono"
                  >
                    🌅 غداً 08:00 صباحاً
                  </button>
                  <button
                    type="button"
                    onClick={() => setTomorrowTime(15)}
                    className="bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-900/40 text-[9px] py-1 px-2.5 rounded-md text-indigo-300 cursor-pointer transition font-mono"
                  >
                    🌆 غداً 03:00 عصراً
                  </button>
                </div>
              </div>
            )}

            {/* SEATS COUNT SELECTOR & PRICES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-1 border-t border-slate-800/60 pt-3">
              
              {/* SEATS COUNT (عدد المقاعد بدقة) */}
              <div className="flex flex-col gap-1 text-right">
                <label className="text-[9.5px] font-bold text-slate-300 flex items-center gap-1 justify-end flex-row-reverse">
                  <Users className="w-3.5 h-3.5 text-amber-500" />
                  <span>👥 عدد المقاعد المتاحة للرحلة</span>
                </label>
                
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1 justify-between max-w-[150px] self-end mt-1">
                  <button
                    type="button"
                    disabled={seatsCount <= 1}
                    onClick={() => setSeatsCount(prev => prev - 1)}
                    className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-black text-amber-400 px-2 font-mono">{seatsCount}</span>
                  <button
                    type="button"
                    disabled={seatsCount >= 50}
                    onClick={() => setSeatsCount(prev => prev + 1)}
                    className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* TICKET FARE (أجرة الراكب) */}
              <div className="flex flex-col gap-1 text-right">
                <label className="text-[9.5px] font-bold text-slate-300 flex items-center gap-1 justify-end flex-row-reverse">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>💰 أجرة الراكب المخصصة (د.أ)</span>
                </label>
                <input
                  type="number"
                  step="0.10"
                  value={customFare}
                  onChange={e => setCustomFare(e.target.value)}
                  placeholder="أجرة تلقائية بناءً على المحافظة"
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono text-center outline-none focus:border-emerald-500 transition mt-1"
                />
              </div>

              {/* COMMISSION RATE (عمولة المنصة) */}
              <div className="flex flex-col gap-1 text-right">
                <label className="text-[9.5px] font-bold text-slate-300 flex items-center gap-1 justify-end flex-row-reverse">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  <span>💼 عمولة المنصة المخصصة (د.أ)</span>
                </label>
                <input
                  type="number"
                  step="0.10"
                  value={customComm}
                  onChange={e => setCustomComm(e.target.value)}
                  placeholder="العمولة التلقائية العامة"
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono text-center outline-none focus:border-indigo-400 transition mt-1"
                />
              </div>

            </div>

            {/* ASSIGN DRIVER PREEMPTIVELY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800/60 pt-3">
              <div className="flex flex-col gap-1 text-right">
                <span className="text-[9.5px] font-bold text-slate-300">🚕 تعيين الكابتن مسبقاً للرحلة (اختياري)</span>
                <select
                  value={driverId}
                  onChange={e => setDriverId(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition cursor-pointer mt-1"
                >
                  <option value="">-- اتركه متاحاً للتوافق والتقديم الذاتي للكباتن --</option>
                  {drivers.filter(d => d.status === 'approved').map(d => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} (التغطية: {d.governorate.split(' ')[0]})
                    </option>
                  ))}
                </select>
              </div>

              {/* DAILY PIN */}
              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex items-center justify-end self-end mt-1">
                <label className="flex items-center gap-2 flex-row-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinnedDaily}
                    onChange={e => setIsPinnedDaily(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                  />
                  <div className="text-right flex flex-col">
                    <span className="text-[10px] font-bold text-amber-400">📌 تثبيت كرحلة يومية متكررة ثابتة</span>
                    <span className="text-[8.5px] text-slate-400">تظهر تلقائياً كل يوم بنفس التوقيت لحجز مستمر</span>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* SUBMIT BUTTON & ROUTE PURGE BUTTONS */}
          <div className="flex flex-col gap-2 mt-1">
            <button
              type="submit"
              className={`w-full text-white font-black py-3 rounded-xl text-xs cursor-pointer shadow-lg transition text-center uppercase tracking-wide flex items-center justify-center gap-2 flex-row-reverse ${
                scheduleMode === 'auto_recurring'
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 shadow-emerald-950/30'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 shadow-indigo-900/30'
              }`}
            >
              {scheduleMode === 'auto_recurring' ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>🚀 إدراج وتوليد جدول رحلات هذا المسار بـ عداد (كل {autoInterval} دقائق) ⚡</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>نشر وجدولة هذه الرحلة الفردية فوراً في النظام الموحد ⚡</span>
                </>
              )}
            </button>

            {/* ROUTE CLEAR & ALL CLEAR CONTROL BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  const fullFrom = `${fromGov} - ${fromDist.trim()} - ${fromVillage.trim()}`;
                  const fullTo = `${toGov} - ${toDist.trim()} - ${toVillage.trim()}`;
                  if (confirm(`هل تريد مسح وتصفية الرحلات المجدولة التلقائية الشاغرة لهذا المسار تحديداً:\n[${fullFrom}] ➔ [${fullTo}]؟`)) {
                    const res = clearEmptyAutoScheduledTrips(fullFrom, fullTo);
                    setSuccessMsg(res.msg);
                    if (onSuccess) onSuccess(res.msg);
                    setTimeout(() => setSuccessMsg(''), 6000);
                  }
                }}
                className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 text-rose-300 font-bold py-2 px-3 rounded-xl text-[10px] transition cursor-pointer flex items-center justify-center gap-1.5 flex-row-reverse"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>🗑️ مسح وإلغاء رحلات هذا المسار المحددة</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('هل تريد مسح وتصفية جميع الرحلات المجدولة التلقائية الشاغرة لكل المسارات والمحافظات؟')) {
                    const res = clearEmptyAutoScheduledTrips();
                    setSuccessMsg(res.msg);
                    if (onSuccess) onSuccess(res.msg);
                    setTimeout(() => setSuccessMsg(''), 6000);
                  }
                }}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 font-bold py-2 px-3 rounded-xl text-[10px] transition cursor-pointer flex items-center justify-center gap-1.5 flex-row-reverse"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>🗑️ مسح وإلغاء كافة الرحلات التلقائية لجميع المسارات</span>
              </button>
            </div>
          </div>
        </form>

        {/* Live Preview Card & Info Panel (Lg: 5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 h-full">
          {/* Card Info Box */}
          <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col gap-2">
            <span className="text-xs font-bold text-indigo-400 text-right">📋 بطاقة معاينة الرحلة المباشرة (Live Preview)</span>
            <p className="text-[9.5px] text-slate-400 text-right leading-relaxed">
              هذا هو المظهر الدقيق الذي سيظهر للركاب والكباتن في قائمة "مواعيد وجدولة رحلات" فور النشر والجدولة.
            </p>
          </div>

          {/* Actual Live Card Layout simulating the real UI cards */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-indigo-500/25 p-4.5 rounded-2xl shadow-xl flex flex-col gap-3.5 text-right font-sans border-r-4 border-r-indigo-500">
            <div className="flex justify-between items-start flex-row-reverse">
              <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[9.5px] font-black py-0.5 px-2 rounded-md font-mono tracking-wide">
                رحلة إدارة آدم
              </span>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                <Clock className="w-3 h-3 text-indigo-400" />
                <span>{displayTime}</span>
              </div>
            </div>

            {/* Locations Route */}
            <div className="flex flex-col gap-2 relative pr-3">
              {/* Connecting line */}
              <div className="absolute right-1.5 top-2.5 bottom-2.5 w-0.5 bg-slate-800 border-r border-dashed border-slate-700"></div>

              {/* Source */}
              <div className="flex items-start gap-2 flex-row-reverse z-10">
                <span className="w-3 h-3 rounded-full bg-amber-500 border-2 border-slate-900 shrink-0 mt-0.5"></span>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-300">منطقة الانطلاق والتحرك</div>
                  <div className="text-[11px] font-black text-slate-100 mt-0.5">{displayFrom}</div>
                </div>
              </div>

              {/* Destination */}
              <div className="flex items-start gap-2 flex-row-reverse z-10">
                <span className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-slate-900 shrink-0 mt-0.5"></span>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-300">وجهة النزول والوصول</div>
                  <div className="text-[11px] font-black text-slate-100 mt-0.5">{displayTo}</div>
                </div>
              </div>
            </div>

            {/* Capacity & Price Row */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-850">
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block">المقاعد المتاحة</span>
                <span className="text-xs font-black text-amber-400 font-mono">
                  {seatsCount} / {seatsCount} مقاعد 👥
                </span>
              </div>
              <div className="text-right border-r border-slate-800 pr-2.5">
                <span className="text-[9px] text-slate-400 block">تكلفة المقعد</span>
                <span className="text-xs font-black text-emerald-400 font-mono">
                  {customFare ? `${Number(customFare).toFixed(2)} د.أ` : 'تلقائي حسب المسافة 💵'}
                </span>
              </div>
            </div>

            {/* Driver Assigned Card */}
            <div className="flex items-center gap-1.5 justify-end text-[10px] text-slate-400 border-t border-slate-800/60 pt-2 flex-row-reverse">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>الكابتن المعين: <strong className="text-slate-200">{selectedDriverName}</strong></span>
              {isPinnedDaily && (
                <span className="mr-auto bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8.5px] px-1.5 py-0.5 rounded-md font-bold">
                  📌 متكرر يومياً
                </span>
              )}
            </div>
          </div>

          {/* Quick Informational Tips */}
          <div className="bg-indigo-950/15 border border-indigo-900/30 p-3.5 rounded-xl text-right flex flex-col gap-2 text-indigo-300 text-[10px] mt-auto">
            <span className="font-bold flex items-center justify-end gap-1.5 flex-row-reverse">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>تعليمات وتفاصيل الجدولة الدقيقة 💡</span>
            </span>
            <ul className="list-disc pr-4 flex flex-col gap-1 text-slate-300">
              <li>المقاعد المتاحة يتم تتبعها بالعداد الذكي للركاب والكباتن.</li>
              <li>عند جدولة رحلة مع تعيين كابتن مسبقاً، تذهب الرحلة لقائمة رحلاته فوراً كرحلة مقبولة ومعتمدة.</li>
              <li>في حال عدم التعيين، تظهر فوراً لجميع الكباتن المصادقين في المحافظات المعنية ليقوموا بالتقديم عليها.</li>
              <li>يمكن تعديل الأسعار يدوياً لكل مقعد للتوافق مع مواسم الطلب المرتفع.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
