import React, { useState } from 'react';
import { 
  Navigation, 
  MapPin, 
  Car, 
  Users, 
  Radio, 
  Eye, 
  Zap, 
  ShieldAlert, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { useAppState } from '../stateEngine';

export const MasterLiveTracking: React.FC = () => {
  const { 
    drivers = [], 
    passengers = [], 
    intraCityRides = [], 
    rides = [], 
    language, 
    t 
  } = useAppState();

  const interCityRides = rides || [];

  const [filterMode, setFilterMode] = useState<'all' | 'captains' | 'passengers' | 'activeRides'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);

  // Filter online drivers
  const onlineDrivers = drivers.filter(d => d.isOnline);
  const busyDrivers = onlineDrivers.filter(d => d.activeRideId);
  const idleDrivers = onlineDrivers.filter(d => !d.activeRideId);

  // Active rides (intra-city and inter-city)
  const activeIntraRides = intraCityRides.filter(r => r.status === 'pending' || r.status === 'accepted' || r.status === 'in_progress' || r.status === 'arrived');
  const activeInterRides = interCityRides.filter(r => r.status === 'searching' || r.status === 'accepted' || r.status === 'in_progress');

  const selectedRide = intraCityRides.find(r => r.id === selectedRideId) || interCityRides.find(r => r.id === selectedRideId);

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      
      {/* TOP SUMMARY METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        
        <div className="bg-[#090d1f] border border-emerald-500/30 p-3.5 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-center flex-row-reverse">
            <span className="text-[10px] text-emerald-400 font-extrabold">{t('الكباتن المتوفرين والنشطين', 'ACTIVE CAPTAINS')}</span>
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between flex-row-reverse">
            <span className="text-2xl font-black text-white font-mono">{onlineDrivers.length}</span>
            <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800/40">
              {idleDrivers.length} {t('شاغر', 'Idle')} | {busyDrivers.length} {t('في مشوار', 'In trip')}
            </span>
          </div>
        </div>

        <div className="bg-[#090d1f] border border-amber-500/30 p-3.5 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-center flex-row-reverse">
            <span className="text-[10px] text-amber-400 font-extrabold">{t('الرحلات الشغالة حالياً', 'ACTIVE RIDES NOW')}</span>
            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between flex-row-reverse">
            <span className="text-2xl font-black text-amber-300 font-mono">
              {activeIntraRides.length + activeInterRides.length}
            </span>
            <span className="text-[10px] text-amber-300 font-bold bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800/40">
              {activeIntraRides.length} {t('داخلية', 'Intra')} | {activeInterRides.length} {t('محافظات', 'Inter')}
            </span>
          </div>
        </div>

        <div className="bg-[#090d1f] border border-indigo-500/30 p-3.5 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-center flex-row-reverse">
            <span className="text-[10px] text-indigo-400 font-extrabold">{t('الركاب المتواجدين بالرادار', 'PASSENGERS RADAR')}</span>
            <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between flex-row-reverse">
            <span className="text-2xl font-black text-indigo-300 font-mono">{passengers.length}</span>
            <span className="text-[10px] text-indigo-300 font-bold bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-800/40">
              {passengers.filter(p => p.activeRideId).length} {t('في طلب نشط', 'Requesting')}
            </span>
          </div>
        </div>

        <div className="bg-[#090d1f] border border-cyan-500/30 p-3.5 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-center flex-row-reverse">
            <span className="text-[10px] text-cyan-400 font-extrabold">{t('حالة رادار GPS والتوجيه', 'RADAR GPS DISPATCH')}</span>
            <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400 animate-pulse">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between flex-row-reverse">
            <span className="text-sm font-black text-emerald-400 flex items-center gap-1 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              LIVE 100%
            </span>
            <span className="text-[10px] text-slate-400 font-mono">0.02s Sync</span>
          </div>
        </div>

      </div>

      {/* RADAR MAP & FILTER BAR */}
      <div className="bg-[#080c1d] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row-reverse justify-between items-center gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 flex-row-reverse">
            <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
              <Navigation className="w-4 h-4 animate-spin" style={{ animationDuration: '10s' }} />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-100 flex items-center gap-2 flex-row-reverse">
                <span>{t('الخريطة التفاعلية التتبعية المباشرة (Live GPS Radar)', 'Live Interactive GPS Radar Map')}</span>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[8px] font-mono font-bold px-2 py-0.5 rounded-full">
                  AUTO-SYNC
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">
                {t('تتبع مواقع الكباتن، نقاط انطلاق الركاب، ومسارات الرحلات الجارية لحظة بلحظة', 'Track real-time GPS locations of drivers, pickup markers, and active ride routes.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-slate-400 font-bold">{t('تصفية العرض:', 'Filter View:')}</span>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${filterMode === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
            >
              {t('الكل', 'All')}
            </button>
            <button
              onClick={() => setFilterMode('captains')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${filterMode === 'captains' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
            >
              🚕 {t('الكباتن', 'Captains')} ({onlineDrivers.length})
            </button>
            <button
              onClick={() => setFilterMode('activeRides')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${filterMode === 'activeRides' ? 'bg-amber-500 text-black font-black' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
            >
              ⚡ {t('الرحلات النشطة', 'Active Trips')} ({activeIntraRides.length + activeInterRides.length})
            </button>
          </div>
        </div>

        {/* INTERACTIVE SIMULATED RADAR MAP CANVAS */}
        <div className="relative w-full h-[320px] bg-[#050814] rounded-xl border border-slate-800/80 overflow-hidden shadow-inner flex items-center justify-center">
          
          {/* Radar grid background effect */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
          
          {/* Concentric radar rings */}
          <div className="absolute w-[280px] h-[280px] border border-emerald-500/10 rounded-full animate-ping pointer-events-none" style={{ animationDuration: '4s' }}></div>
          <div className="absolute w-[180px] h-[180px] border border-indigo-500/15 rounded-full pointer-events-none"></div>
          <div className="absolute w-[90px] h-[90px] border border-amber-500/20 rounded-full pointer-events-none"></div>

          {/* City label overlays */}
          <div className="absolute top-3 right-4 bg-slate-900/80 border border-slate-800 text-[9px] text-slate-300 font-bold px-2 py-1 rounded-lg backdrop-blur font-mono">
            📍 {t('مركز التغطية: عمان / العاصمة وشبكة المحافظات', 'Coverage Center: Amman Hub & Governorates')}
          </div>

          <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-800/80 text-[8.5px] text-slate-400 p-2 rounded-xl backdrop-blur space-y-1">
            <div className="flex items-center gap-1.5 flex-row-reverse">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>كابتن نشط ومتوفر</span>
            </div>
            <div className="flex items-center gap-1.5 flex-row-reverse">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>كابتن في مشوار أو راكب يطلب رحلة</span>
            </div>
            <div className="flex items-center gap-1.5 flex-row-reverse">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
              <span>مسار رحلة نشطة حالياً</span>
            </div>
          </div>

          {/* ONLINE DRIVERS GPS MARKERS */}
          {(filterMode === 'all' || filterMode === 'captains') && onlineDrivers.map((drv, idx) => {
            const posX = drv.currentLocation?.x ? (drv.currentLocation.x % 80) + 10 : (idx * 17 + 25) % 85;
            const posY = drv.currentLocation?.y ? (drv.currentLocation.y % 70) + 15 : (idx * 23 + 20) % 75;
            const isBusy = !!drv.activeRideId;

            return (
              <div
                key={drv.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all duration-500"
                style={{ left: `${posX}%`, top: `${posY}%` }}
                title={`${drv.fullName} - ${drv.carModel} (${drv.city})`}
              >
                <div className={`p-1.5 rounded-full border shadow-lg flex items-center justify-center transition ${
                  isBusy 
                    ? 'bg-amber-500 text-black border-amber-300 shadow-amber-500/40 animate-pulse' 
                    : 'bg-emerald-500 text-black border-emerald-300 shadow-emerald-500/40 hover:scale-125'
                }`}>
                  <Car className="w-3.5 h-3.5" />
                </div>
                
                {/* Driver Tooltip Hover */}
                <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white text-[9.5px] p-2 rounded-xl whitespace-nowrap z-20 shadow-xl font-bold">
                  <div>🚕 {drv.fullName} ({drv.carModel})</div>
                  <div className="text-[8.5px] text-slate-400">{drv.city} | {isBusy ? '⚡ في رحلة' : '✅ متوفر'}</div>
                </div>
              </div>
            );
          })}

          {/* ACTIVE RIDES ROUTE LINES & MARKERS */}
          {(filterMode === 'all' || filterMode === 'activeRides') && activeIntraRides.map((ride, idx) => {
            const startX = ride.pickupCoords ? (ride.pickupCoords.x % 70) + 15 : 30 + idx * 10;
            const startY = ride.pickupCoords ? (ride.pickupCoords.y % 60) + 20 : 40 + idx * 8;
            const endX = ride.dropoffCoords ? (ride.dropoffCoords.x % 70) + 15 : 65 + idx * 5;
            const endY = ride.dropoffCoords ? (ride.dropoffCoords.y % 60) + 20 : 70 - idx * 5;

            return (
              <React.Fragment key={ride.id}>
                {/* SVG Route Line */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line 
                    x1={`${startX}%`} 
                    y1={`${startY}%`} 
                    x2={`${endX}%`} 
                    y2={`${endY}%`} 
                    stroke="#f59e0b" 
                    strokeWidth="2" 
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                </svg>

                {/* Pickup Point */}
                <div 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white p-1 rounded-full border border-indigo-300 shadow-lg text-[9px] font-bold"
                  style={{ left: `${startX}%`, top: `${startY}%` }}
                  title={`انطلاق: ${ride.pickupLocationName}`}
                >
                  <MapPin className="w-3 h-3" />
                </div>

                {/* Dropoff Point */}
                <div 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-black p-1 rounded-full border border-amber-200 shadow-lg text-[9px] font-bold"
                  style={{ left: `${endX}%`, top: `${endY}%` }}
                  title={`وجهة: ${ride.dropoffLocationName}`}
                >
                  📍
                </div>
              </React.Fragment>
            );
          })}

        </div>

      </div>

      {/* LIVE ACTIVE TRIPS REAL-TIME MONITOR TABLE */}
      <div className="bg-[#080c1d] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800 flex-row-reverse">
          <h3 className="text-xs font-black text-slate-100 flex items-center gap-1.5 flex-row-reverse">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>{t('جدول تتبع الرحلات القائمة حياً (داخل المدن وبين المحافظات)', 'Live Active Trips Stream')}</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            {activeIntraRides.length + activeInterRides.length} {t('رحلة نشطة حالياً', 'active trips')}
          </span>
        </div>

        {activeIntraRides.length === 0 && activeInterRides.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            {t('لا توجد رحلات شغالة حالياً في الرادار. يمكنك تجربة عمل طلب من تطبيق الراكب!', 'No active trips currently in progress. Try placing a ride order from Passenger App!')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 font-bold bg-slate-900/50">
                  <th className="p-2.5">كود الرحلة</th>
                  <th className="p-2.5">النوع</th>
                  <th className="p-2.5">اسم الراكب</th>
                  <th className="p-2.5">الكابتن المكتلف</th>
                  <th className="p-2.5">مسار الرحلة (الانطلاق ➔ الوجهة)</th>
                  <th className="p-2.5">السعر والعمولة</th>
                  <th className="p-2.5">الحالة الحالية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {activeIntraRides.map(ride => {
                  const driver = drivers.find(d => d.id === ride.driverId);
                  return (
                    <tr key={ride.id} className="hover:bg-slate-900/40 transition">
                      <td className="p-2.5 font-mono text-[10px] text-indigo-400 font-bold">#{ride.id.substring(0, 8)}</td>
                      <td className="p-2.5 text-[10px]">
                        <span className="bg-indigo-950 text-indigo-300 border border-indigo-800/50 px-2 py-0.5 rounded font-bold">
                          داخلية 🚕
                        </span>
                      </td>
                      <td className="p-2.5 font-bold text-slate-200">{ride.passengerName}</td>
                      <td className="p-2.5">
                        {driver ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1 flex-row-reverse">
                            <span>🚕 {driver.fullName}</span>
                          </span>
                        ) : ride.targetedDriverId ? (
                          <span className="text-amber-400 text-[10px] font-bold">
                            ⏳ موجه لكابتن أقرب
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">جاري التوزيع...</span>
                        )}
                      </td>
                      <td className="p-2.5 text-[11px] text-slate-300">
                        <div className="flex items-center gap-1 flex-row-reverse font-medium">
                          <span className="text-indigo-300 font-bold">{ride.pickupLocationName}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500 rotate-180" />
                          <span className="text-amber-300 font-bold">{ride.dropoffLocationName}</span>
                        </div>
                      </td>
                      <td className="p-2.5 font-mono font-bold text-amber-300">
                        {ride.price} {ride.currency}
                        <span className="text-[9px] text-slate-400 block font-sans">عمولة: {ride.commission}</span>
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ride.status === 'in_progress' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          ride.status === 'accepted' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {ride.status === 'in_progress' ? 'جاري التنفيذ 🚗' :
                           ride.status === 'accepted' ? 'تم القبول ✅' : 'في الانتظار ⏳'}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {activeInterRides.map(ride => {
                  const driver = drivers.find(d => d.id === ride.driverId);
                  return (
                    <tr key={ride.id} className="hover:bg-slate-900/40 transition">
                      <td className="p-2.5 font-mono text-[10px] text-purple-400 font-bold">#{ride.id.substring(0, 8)}</td>
                      <td className="p-2.5 text-[10px]">
                        <span className="bg-purple-950 text-purple-300 border border-purple-800/50 px-2 py-0.5 rounded font-bold">
                          محافظات 🚌
                        </span>
                      </td>
                      <td className="p-2.5 font-bold text-slate-200">{ride.passengerName}</td>
                      <td className="p-2.5 font-bold text-slate-300">{driver ? driver.fullName : 'لم يحدد بعد'}</td>
                      <td className="p-2.5 text-[11px] text-slate-300">
                        <div className="flex items-center gap-1 flex-row-reverse font-medium">
                          <span className="text-purple-300 font-bold">{ride.fromCity}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500 rotate-180" />
                          <span className="text-amber-300 font-bold">{ride.toCity}</span>
                        </div>
                      </td>
                      <td className="p-2.5 font-mono font-bold text-amber-300">
                        {ride.price} {ride.currency}
                      </td>
                      <td className="p-2.5">
                        <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          {ride.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
