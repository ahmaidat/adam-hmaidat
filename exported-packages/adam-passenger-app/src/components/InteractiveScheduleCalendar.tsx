import React, { useState } from 'react';
import { ScheduledTrip, Driver } from '../types';
import { 
  Calendar as CalendarIcon, Clock, MapPin, Users, UserCheck, 
  AlertCircle, GripVertical, CheckCircle2, ChevronRight, ChevronLeft, 
  Trash2, Edit3, Sparkles, Filter, Inbox, Pin, UserPlus, X, Save 
} from 'lucide-react';

interface InteractiveScheduleCalendarProps {
  scheduledTrips: ScheduledTrip[];
  drivers: Driver[];
  updateScheduledTripTime: (tripId: string, newTime: string) => void;
  assignScheduledTripDriver: (tripId: string, driverId: string | null) => void;
  deleteScheduledTripByAdmin: (tripId: string) => void;
  toggleScheduledTripDailyPin: (tripId: string) => void;
}

export const InteractiveScheduleCalendar: React.FC<InteractiveScheduleCalendarProps> = ({
  scheduledTrips,
  drivers,
  updateScheduledTripTime,
  assignScheduledTripDriver,
  deleteScheduledTripByAdmin,
  toggleScheduledTripDailyPin
}) => {
  // Helper to get local date strings YYYY-MM-DD
  const formatDateStr = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDateStr(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = formatDateStr(tomorrowDate);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewDaysCount, setViewDaysCount] = useState<1 | 2>(2); // 1 day or 2 days side by side
  const [filterGov, setFilterGov] = useState<string>('all');
  const [draggedTripId, setDraggedTripId] = useState<string | null>(null);
  const [dragOverSlotKey, setDragOverSlotKey] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [showFloatingTray, setShowFloatingTray] = useState<boolean>(false);

  // Quick Edit Modal State
  const [activeModalTrip, setActiveModalTrip] = useState<ScheduledTrip | null>(null);
  const [modalDateInput, setModalDateInput] = useState<string>('');
  const [modalTimeInput, setModalTimeInput] = useState<string>('');
  const [modalDriverId, setModalDriverId] = useState<string>('');

  // Parse trip date & time
  const parseTripDateTime = (depTime: string) => {
    if (!depTime) return { date: todayStr, hour: 12, min: 0, rawTime: '12:00' };
    let clean = depTime.replace('T', ' ');
    
    let targetDate = todayStr;
    if (clean.includes('اليوم')) targetDate = todayStr;
    else if (clean.includes('غداً') || clean.includes('غدا')) targetDate = tomorrowStr;
    else {
      const dMatch = clean.match(/^\d{4}-\d{2}-\d{2}/);
      if (dMatch) targetDate = dMatch[0];
    }

    const tMatch = clean.match(/(\d{1,2}):(\d{2})/);
    let hour = 12;
    let min = 0;
    let rawTime = '12:00';
    if (tMatch) {
      hour = parseInt(tMatch[1], 10);
      min = parseInt(tMatch[2], 10);
      rawTime = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    }

    return { date: targetDate, hour, min, rawTime };
  };

  // Approved drivers for dropdown
  const approvedDrivers = drivers.filter(d => d.status === 'approved');

  // Next day for 2-day view
  const getNextDateStr = (baseDateStr: string): string => {
    const d = new Date(baseDateStr);
    d.setDate(d.getDate() + 1);
    return formatDateStr(d);
  };

  const activeDates = viewDaysCount === 1 ? [selectedDate] : [selectedDate, getNextDateStr(selectedDate)];

  // Filter trips by Governorate/Area
  const govFilteredTrips = scheduledTrips.filter(t => {
    if (filterGov === 'all') return true;
    return t.fromArea.includes(filterGov) || t.toArea.includes(filterGov) || (t.governorateFrom && t.governorateFrom.includes(filterGov));
  });

  // Separate trips belonging to activeDates vs floating / other dates
  const displayedTripsMap: { [dateStr: string]: { [hourBucket: number]: ScheduledTrip[] } } = {};
  activeDates.forEach(d => {
    displayedTripsMap[d] = {};
    for (let h = 0; h <= 23; h++) {
      displayedTripsMap[d][h] = [];
    }
  });

  const floatingTrips: ScheduledTrip[] = [];

  govFilteredTrips.forEach(trip => {
    if (trip.status === 'cancelled') return; // Skip cancelled in calendar grid
    const { date, hour } = parseTripDateTime(trip.departureTime);
    if (displayedTripsMap[date]) {
      displayedTripsMap[date][hour]?.push(trip);
    } else {
      floatingTrips.push(trip);
    }
  });

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, trip: ScheduledTrip) => {
    e.dataTransfer.setData('text/plain', trip.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTripId(trip.id);
  };

  const handleDragOver = (e: React.DragEvent, slotKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlotKey !== slotKey) {
      setDragOverSlotKey(slotKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverSlotKey(null);
  };

  const handleDrop = (e: React.DragEvent, targetDateStr: string, targetHour: number, targetMin: number) => {
    e.preventDefault();
    setDragOverSlotKey(null);
    setDraggedTripId(null);

    const tripId = e.dataTransfer.getData('text/plain');
    if (!tripId) return;

    const targetTimeStr = `${String(targetHour).padStart(2, '0')}:${String(targetMin).padStart(2, '0')}`;
    const fullNewDepTime = `${targetDateStr} ${targetTimeStr}`;

    updateScheduledTripTime(tripId, fullNewDepTime);

    // Show instant toast
    setToastMsg(`⚡ تم تحديث موعد الرحلة إلى ${fullNewDepTime} وحفظه في قاعدة البيانات لحظياً`);
    setTimeout(() => setToastMsg(''), 4500);
  };

  // Open Edit Modal
  const openEditModal = (trip: ScheduledTrip) => {
    const { date, rawTime } = parseTripDateTime(trip.departureTime);
    setActiveModalTrip(trip);
    setModalDateInput(date);
    setModalTimeInput(rawTime);
    setModalDriverId(trip.driverId || '');
  };

  // Save Edit Modal
  const saveModalChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalTrip) return;

    const fullNewTime = `${modalDateInput} ${modalTimeInput}`;
    updateScheduledTripTime(activeModalTrip.id, fullNewTime);
    if ((activeModalTrip.driverId || '') !== modalDriverId) {
      const res = assignScheduledTripDriver(activeModalTrip.id, modalDriverId || null);
      if (res && !res.success) {
        alert(res.msg);
        return;
      }
    }

    setToastMsg(`✅ تم حفظ تعديلات الرحلة وحالتها بنجاح`);
    setTimeout(() => setToastMsg(''), 4000);
    setActiveModalTrip(null);
  };

  // Hours list (6 AM to 11 PM) plus Early Morning
  const hourRows = Array.from({ length: 18 }, (_, i) => i + 6);

  return (
    <div className="flex flex-col gap-5 text-right font-sans relative" dir="rtl">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-6 py-3 rounded-2xl shadow-2xl border border-emerald-400 flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
          <span className="text-xs font-black tracking-wide">{toastMsg}</span>
        </div>
      )}

      {/* TOP COMMAND BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
              <span>واجهة التقويم التفاعلي لضبط مواعيد الرحلات اليومية</span>
              <span className="bg-emerald-500/15 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">Drag & Drop Live</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">اسحب بطاقة أي رحلة وأفلتها في أي خانة زمنية لتعديل موعدها وتحديث الحالة بقاعدة البيانات لحظياً</p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-3 justify-end w-full md:w-auto">
          {/* View Mode */}
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setViewDaysCount(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${viewDaysCount === 1 ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
            >
              يوم واحد بالتفصيل
            </button>
            <button
              onClick={() => setViewDaysCount(2)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${viewDaysCount === 2 ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
            >
              يومين متتاليين (اليوم والغد)
            </button>
          </div>

          {/* Gov Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterGov}
              onChange={e => setFilterGov(e.target.value)}
              className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer font-bold"
            >
              <option value="all" className="bg-slate-950">جميع الخطوط والمحافظات</option>
              <option value="عمان" className="bg-slate-950">عمان (Amman)</option>
              <option value="إربد" className="bg-slate-950">إربد (Irbid)</option>
              <option value="الزرقاء" className="bg-slate-950">الزرقاء (Zarqa)</option>
              <option value="العقبة" className="bg-slate-950">العقبة (Aqaba)</option>
              <option value="السلط" className="bg-slate-950">البلقاء / السلط</option>
              <option value="الكرك" className="bg-slate-950">الكرك (Karak)</option>
            </select>
          </div>
        </div>
      </div>

      {/* DATE NAVIGATION BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900/80 border border-slate-800 px-4 py-3 rounded-2xl gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(formatDateStr(d));
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl transition cursor-pointer"
            title="اليوم السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value || todayStr)}
            className="bg-slate-950 border border-slate-750 rounded-xl px-3 py-1.5 text-xs font-mono text-amber-400 font-bold outline-none cursor-pointer"
          />

          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(formatDateStr(d));
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl transition cursor-pointer"
            title="اليوم التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Jumps */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-bold">الانتقال السريع:</span>
          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${selectedDate === todayStr ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            اليوم ({todayStr})
          </button>
          <button
            onClick={() => setSelectedDate(tomorrowStr)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${selectedDate === tomorrowStr ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            غداً ({tomorrowStr})
          </button>
        </div>
      </div>

      {/* FLOATING / OTHER DATES TRAY (If any) */}
      {floatingTrips.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-3 flex flex-col gap-2.5 transition-all">
          <div 
            onClick={() => setShowFloatingTray(!showFloatingTray)}
            className="flex justify-between items-center cursor-pointer select-none"
          >
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
              <Inbox className="w-4 h-4 text-amber-400" />
              <span>📥 رحلات من تواريخ أخرى أو غير معينة بالتقويم المعروض ({floatingTrips.length} رحلة)</span>
              <span className="text-[9.5px] text-slate-400 font-normal hidden sm:inline">— يمكنك سحب أي رحلة من هنا وإفلاتها في جدول اليوم والغد لجدولتها فوراً</span>
            </div>
            <span className="text-xs text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
              {showFloatingTray ? '▲ إخفاء البطاقات' : '▼ إظهار البطاقات'}
            </span>
          </div>

          {showFloatingTray && (
            <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              {floatingTrips.map(trip => renderTripCard(trip, true))}
            </div>
          )}
        </div>
      )}

      {/* CALENDAR COLUMNS GRID */}
      <div className={`grid grid-cols-1 ${viewDaysCount === 2 ? 'lg:grid-cols-2' : ''} gap-6`}>
        {activeDates.map(dateStr => {
          const isTodayColumn = dateStr === todayStr;
          return (
            <div key={dateStr} className="bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
              {/* Day Column Header */}
              <div className={`p-3.5 border-b border-slate-800 flex justify-between items-center ${isTodayColumn ? 'bg-gradient-to-r from-emerald-950/50 to-slate-900 border-b-emerald-500/30' : 'bg-slate-950'}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isTodayColumn ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'}`} />
                  <h4 className="text-sm font-black text-slate-100 font-mono">
                    {dateStr}
                  </h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isTodayColumn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                    {isTodayColumn ? 'اليوم الحالي' : dateStr === tomorrowStr ? 'الغد المجدول' : 'يوم لاحق'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {Object.values(displayedTripsMap[dateStr] || {}).flat().length} رحلة مبرمجة
                </span>
              </div>

              {/* TIMELINE ROWS */}
              <div className="divide-y divide-slate-800/80 max-h-[720px] overflow-y-auto pr-1">
                {/* 00:00 - 05:30 Early Bucket */}
                {renderHourRow(dateStr, 0, '00:00 - 05:30 (فجر وباكر)', [0,1,2,3,4,5])}

                {/* Standard Hours 6 to 23 */}
                {hourRows.map(hr => renderHourRow(dateStr, hr, `${String(hr).padStart(2, '0')}:00`, [hr]))}
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK EDIT MODAL */}
      {activeModalTrip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-amber-500 rounded-2xl w-full max-w-lg p-5 shadow-2xl relative text-right flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-black text-slate-100">الضبط اليدوي الدقيق للرحلة المجدولة</h4>
              </div>
              <button
                onClick={() => setActiveModalTrip(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveModalChanges} className="flex flex-col gap-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">معرف الرحلة (ID):</span>
                  <span className="font-mono text-amber-400 font-bold">{activeModalTrip.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">منشئ الرحلة:</span>
                  <span className="font-bold text-slate-200">{activeModalTrip.creatorName}</span>
                </div>
              </div>

              {/* Route Display */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400">المسار والاتجاه:</span>
                <div className="bg-slate-800/60 p-2 rounded-lg text-xs font-bold text-slate-200 flex items-center gap-2 justify-end">
                  <span>{activeModalTrip.fromArea}</span>
                  <ChevronLeft className="w-4 h-4 text-amber-400" />
                  <span>{activeModalTrip.toArea}</span>
                </div>
              </div>

              {/* Date & Exact Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400">تاريخ الانطلاق:</span>
                  <input
                    type="date"
                    required
                    value={modalDateInput}
                    onChange={e => setModalDateInput(e.target.value)}
                    className="bg-slate-950 border border-slate-750 text-slate-100 p-2 rounded-xl text-xs font-mono outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400">الوقت الدقيق (بالدقيقة):</span>
                  <input
                    type="time"
                    required
                    value={modalTimeInput}
                    onChange={e => setModalTimeInput(e.target.value)}
                    className="bg-slate-950 border border-slate-750 text-slate-100 p-2 rounded-xl text-xs font-mono outline-none focus:border-amber-500 text-center"
                  />
                </div>
              </div>

              {/* Assign Driver */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400">الكابتن المسؤول (تعيين مباشر):</span>
                <select
                  value={modalDriverId}
                  onChange={e => setModalDriverId(e.target.value)}
                  className="bg-slate-950 border border-slate-750 text-slate-100 p-2 rounded-xl text-xs outline-none focus:border-amber-500"
                >
                  <option value="">-- بلا كابتن (شاغر للتوافق الآلي) --</option>
                  {approvedDrivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} — رقم الهاتف: {d.phone} ({d.governorate.split(' ')[0]})
                    </option>
                  ))}
                </select>
              </div>

              {/* Daily Pin */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleScheduledTripDailyPin(activeModalTrip.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activeModalTrip.isPinnedDaily ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{activeModalTrip.isPinnedDaily ? 'مثبتة كمسار يومي دائم' : 'تثبيت كمسار يومي ثابت'}</span>
                </button>
                <span className="text-[10px] text-slate-400 max-w-[220px] leading-tight">الرحلة المثبتة تتجدد تلقائياً بنفس الساعة كل يوم لخدمة الركاب</span>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('هل أنت متأكد من حذف هذه الرحلة المجدولة نهائياً؟')) {
                      deleteScheduledTripByAdmin(activeModalTrip.id);
                      setActiveModalTrip(null);
                    }
                  }}
                  className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-600/40 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف الموعد</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModalTrip(null)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ وتحديث الموعد</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Render Hour Timeline Row
  function renderHourRow(dateStr: string, displayHr: number, label: string, matchingHours: number[]) {
    const dayMap = displayedTripsMap[dateStr] || {};
    const tripsInRow: ScheduledTrip[] = [];
    matchingHours.forEach(h => {
      if (dayMap[h]) tripsInRow.push(...dayMap[h]);
    });

    // Split trips into :00 bucket vs :30 bucket
    const bucket00: ScheduledTrip[] = [];
    const bucket30: ScheduledTrip[] = [];

    tripsInRow.forEach(t => {
      const { min } = parseTripDateTime(t.departureTime);
      if (min >= 30) bucket30.push(t);
      else bucket00.push(t);
    });

    const slotKey00 = `${dateStr}_${displayHr}:00`;
    const slotKey30 = `${dateStr}_${displayHr}:30`;

    const isHover00 = dragOverSlotKey === slotKey00;
    const isHover30 = dragOverSlotKey === slotKey30;

    return (
      <div key={`${dateStr}_${displayHr}`} className="flex flex-col sm:flex-row items-stretch min-h-[72px] bg-slate-950/40 hover:bg-slate-900/40 transition">
        {/* Hour Badge */}
        <div className="w-full sm:w-28 bg-slate-950 p-2.5 flex sm:flex-col items-center justify-between sm:justify-center border-b sm:border-b-0 sm:border-l border-slate-800 shrink-0 select-none">
          <div className="flex items-center gap-1.5 text-amber-400 font-mono font-black text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{label}</span>
          </div>
          <span className="text-[9px] text-slate-500 font-sans mt-0.5 hidden sm:inline">
            {tripsInRow.length > 0 ? `${tripsInRow.length} رحلات` : 'شاغر'}
          </span>
        </div>

        {/* DROP ZONE :00 */}
        <div
          onDragOver={e => handleDragOver(e, slotKey00)}
          onDragLeave={handleDragLeave}
          onDrop={e => handleDrop(e, dateStr, displayHr, 0)}
          className={`flex-1 p-2 border-l border-slate-800/60 transition-all flex flex-col gap-2 relative min-h-[64px] ${
            isHover00 ? 'bg-emerald-950/40 border-2 border-emerald-400 shadow-inner scale-[1.01] z-10 rounded-xl' : ''
          }`}
        >
          <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono select-none mb-0.5">
            <span>{displayHr === 0 ? 'باكر/فجر' : `${String(displayHr).padStart(2, '0')}:00`}</span>
            {isHover00 && <span className="text-emerald-400 font-bold animate-pulse">⬇️ أفلِت لضبط الموعد هنا</span>}
          </div>

          <div className="flex flex-col gap-2">
            {bucket00.map(t => renderTripCard(t))}
            {bucket00.length === 0 && !isHover00 && (
              <div className="h-10 border border-dashed border-slate-800/80 rounded-xl flex items-center justify-center text-[10px] text-slate-600 font-mono">
                + إفلات في :00
              </div>
            )}
          </div>
        </div>

        {/* DROP ZONE :30 (Only for standard hours >= 6) */}
        {displayHr >= 6 && (
          <div
            onDragOver={e => handleDragOver(e, slotKey30)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, dateStr, displayHr, 30)}
            className={`flex-1 p-2 transition-all flex flex-col gap-2 relative min-h-[64px] ${
              isHover30 ? 'bg-emerald-950/40 border-2 border-emerald-400 shadow-inner scale-[1.01] z-10 rounded-xl' : ''
            }`}
          >
            <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono select-none mb-0.5">
              <span>{`${String(displayHr).padStart(2, '0')}:30`}</span>
              {isHover30 && <span className="text-emerald-400 font-bold animate-pulse">⬇️ أفلِت لضبط الموعد هنا</span>}
            </div>

            <div className="flex flex-col gap-2">
              {bucket30.map(t => renderTripCard(t))}
              {bucket30.length === 0 && !isHover30 && (
                <div className="h-10 border border-dashed border-slate-800/80 rounded-xl flex items-center justify-center text-[10px] text-slate-600 font-mono">
                  + إفلات في :30
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Draggable Trip Card inside calendar slot
  function renderTripCard(trip: ScheduledTrip, isCompact = false) {
    const isDragging = draggedTripId === trip.id;
    const { rawTime } = parseTripDateTime(trip.departureTime);
    const hasDriver = !!trip.driverId || trip.creatorType === 'driver';

    return (
      <div
        key={trip.id}
        draggable
        onDragStart={e => handleDragStart(e, trip)}
        onClick={() => openEditModal(trip)}
        className={`bg-slate-900 border transition-all rounded-xl p-2.5 flex flex-col gap-1.5 cursor-grab active:cursor-grabbing hover:border-amber-500/60 shadow-md select-none group relative ${
          isDragging ? 'opacity-30 border-dashed border-amber-400 scale-95' : 'border-slate-750 hover:shadow-lg'
        } ${isCompact ? 'min-w-[210px] shrink-0' : 'w-full'}`}
      >
        {/* Top Header */}
        <div className="flex justify-between items-center text-[10px]">
          <div className="flex items-center gap-1 font-mono text-amber-400 font-black">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{rawTime}</span>
          </div>

          <div className="flex items-center gap-1">
            {trip.isPinnedDaily && (
              <span className="bg-amber-500/15 text-amber-300 text-[8.5px] px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold" title="مسار يومي ثابت">
                📌 يومي
              </span>
            )}
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
              trip.creatorType === 'admin' ? 'bg-amber-500/10 text-amber-400' : trip.creatorType === 'driver' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
            }`}>
              {trip.creatorType === 'admin' ? 'تلقائي' : trip.creatorType === 'driver' ? 'كابتن' : 'راكب'}
            </span>
          </div>
        </div>

        {/* Route */}
        <div className="text-xs font-black text-slate-100 flex items-center gap-1 truncate max-w-full">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate" title={`${trip.fromArea} ➔ ${trip.toArea}`}>
            {trip.fromArea.split('-')[0]} ➔ {trip.toArea.split('-')[0]}
          </span>
        </div>

        {/* Driver & Seats info */}
        <div className="flex justify-between items-center pt-1 border-t border-slate-800/80 text-[9.5px]">
          <div className={`flex items-center gap-1 font-bold truncate ${hasDriver ? 'text-emerald-400' : 'text-amber-400/90 animate-pulse'}`}>
            <UserCheck className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[110px]">
              {trip.driverName || (trip.creatorType === 'driver' ? trip.creatorName : '⚠️ شاغر (بلا كابتن)')}
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded">
            <Users className="w-3 h-3 text-slate-500" />
            <span>{trip.availableSeats}/{trip.seatsCount} مقاعد</span>
          </div>
        </div>

        {/* Hover Quick Hint */}
        <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition bg-slate-950 text-amber-400 p-1 rounded-lg border border-slate-800">
          <GripVertical className="w-3 h-3" />
        </div>
      </div>
    );
  }
};
