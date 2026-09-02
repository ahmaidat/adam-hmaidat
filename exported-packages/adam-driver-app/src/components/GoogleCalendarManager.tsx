import React, { useState, useEffect } from 'react';
import { useAppState } from '../stateEngine';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  RefreshCw, 
  LogOut, 
  Key, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle, 
  Check, 
  ExternalLink,
  Settings,
  Power,
  Info,
  UserCheck
} from 'lucide-react';

interface GoogleCalendarManagerProps {
  userType: 'driver' | 'passenger';
  userId: string;
}

export function GoogleCalendarManager({ userType, userId }: GoogleCalendarManagerProps) {
  const { scheduledTrips } = useAppState();

  // Authentication states
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('adam_calendar_token');
  });
  const [clientId, setClientId] = useState<string>(() => {
    return localStorage.getItem('adam_calendar_client_id') || '4185729690054-mockclientid.apps.googleusercontent.com';
  });
  const [customTokenInput, setCustomTokenInput] = useState('');

  // Local synced map: tripId -> Google Event ID
  const [syncedTrips, setSyncedTrips] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('adam_calendar_synced_trips');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Bulk and action states
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(() => {
    return localStorage.getItem('adam_calendar_autosync') === 'true';
  });

  // Extract hash parameter token if redirected from Google OAuth login
  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get('access_token');
        const state = params.get('state');
        
        if (token && state === 'adam_calendar_auth_context') {
          setAccessToken(token);
          localStorage.setItem('adam_calendar_token', token);
          setApiSuccess('تم الاتصال بـ Google Calendar وتفويض الصلاحيات بنجاح! 📆🟢');
          
          // Clean the URL hash
          window.location.hash = '';
        }
      }
    } catch (e) {
      console.error('Error parsing Google OAuth hash:', e);
    }
  }, []);

  // Sync state changes back to localStorage
  useEffect(() => {
    localStorage.setItem('adam_calendar_synced_trips', JSON.stringify(syncedTrips));
  }, [syncedTrips]);

  // Listen to external updates to sync states across components
  useEffect(() => {
    const handleSyncedUpdate = () => {
      try {
        const stored = localStorage.getItem('adam_calendar_synced_trips');
        setSyncedTrips(stored ? JSON.parse(stored) : {});
      } catch (e) {
        console.error('Error handling sync update event:', e);
      }
    };

    const handleAutoSyncUpdate = () => {
      setAutoSync(localStorage.getItem('adam_calendar_autosync') === 'true');
    };

    window.addEventListener('adam_calendar_synced_updated', handleSyncedUpdate);
    window.addEventListener('adam_calendar_autosync_updated', handleAutoSyncUpdate);

    return () => {
      window.removeEventListener('adam_calendar_synced_updated', handleSyncedUpdate);
      window.removeEventListener('adam_calendar_autosync_updated', handleAutoSyncUpdate);
    };
  }, []);

  // Keep track of autosync toggle
  const handleToggleAutoSync = () => {
    const nextVal = !autoSync;
    setAutoSync(nextVal);
    localStorage.setItem('adam_calendar_autosync', String(nextVal));
    if (nextVal) {
      setApiSuccess('تم تفعيل المزامنة التلقائية. سيتم جدولة رحلاتك المقبولة فوراً في تقويم Google! 🟢📆');
    }
    window.dispatchEvent(new Event('adam_calendar_autosync_updated'));
  };

  // Google OAuth 2.0 Client-side Implicit Flow Setup
  const handleGoogleLogin = () => {
    setApiError(null);
    setApiSuccess(null);

    if (!clientId.trim()) {
      setApiError('يرجى أولاً حفظ معرف العميل Client ID في حقل الإعدادات للبدء.');
      return;
    }

    const redirectUri = window.location.origin;
    // Request calendars and events permissions
    const scopes = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
      `client_id=${encodeURIComponent(clientId.trim())}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `include_granted_scopes=true&` +
      `state=adam_calendar_auth_context`;

    setApiSuccess('جاري الانتقال لوحدة التحقق وتسجيل الدخول الآمن من Google Google Auth...');
    setTimeout(() => {
      window.location.href = authUrl;
    }, 1200);
  };

  // Submit manual token (Playground-friendly option)
  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);

    if (!customTokenInput.trim()) {
      setApiError('يرجى نسخ رمز الوصول Access Token بشكل صحيح للاتصال.');
      return;
    }

    const token = customTokenInput.trim();
    setAccessToken(token);
    localStorage.setItem('adam_calendar_token', token);
    setCustomTokenInput('');
    setApiSuccess('تم تطبيق رمز الاتصال وحفظه محلياً في التطبيق بنجاح! 🟢');
  };

  // Disconnect/Logout of Calendar integration
  const handleDisconnect = () => {
    setAccessToken(null);
    localStorage.removeItem('adam_calendar_token');
    setApiSuccess('تم تعطيل ميزة المزامنة وقطع الاتصال بـ Google Calendar بنجاح ✅');
    setApiError(null);
  };

  // Helper: filter current user's trips
  const myTrips = scheduledTrips.filter(t => {
    if (userType === 'passenger') {
      return t.creatorId === userId || t.passengers.some(p => p.passengerId === userId);
    } else {
      return t.driverId === userId || t.creatorId === userId;
    }
  }).filter(t => t.status !== 'cancelled'); // Don't sync cancelled ones

  // Helper utility to convert 'YYYY-MM-DD HH:MM' departureTime to ISO string format 'YYYY-MM-DDTHH:MM:00'
  const convertToIso = (depTimeStr: string) => {
    try {
      const sanitized = depTimeStr.trim().replace(' ', 'T');
      if (sanitized.includes('T')) {
        return `${sanitized}:00`;
      }
      return sanitized;
    } catch {
      return new Date().toISOString();
    }
  };

  // Helper: Get end time (+1 hour by default)
  const getEndTimeIso = (depTimeStr: string) => {
    try {
      const isoStr = convertToIso(depTimeStr);
      const date = new Date(isoStr);
      date.setHours(date.getHours() + 1); // default 1 hour duration
      return date.toISOString().substring(0, 19);
    } catch {
      return new Date().toISOString();
    }
  };

  // Sync a single trip to Google Calendar API
  const syncTripToGoogle = async (tripId: string) => {
    if (!accessToken) {
      setApiError('يرجى تسجيل الدخول للتقويم أولاً لمزامنة الرحلات.');
      return;
    }

    const trip = myTrips.find(t => t.id === tripId);
    if (!trip) {
      setApiError('الرحلة المطلوبة غير موجودة.');
      return;
    }

    setActionLoading(tripId);
    setApiError(null);
    setApiSuccess(null);

    const isExistingEvent = syncedTrips[tripId];
    const endpoint = isExistingEvent 
      ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${isExistingEvent}`
      : `https://www.googleapis.com/calendar/v3/calendars/primary/events`;

    const method = isExistingEvent ? 'PUT' : 'POST';

    const cleanFrom = trip.fromArea.split(' - ').slice(-1)[0] || trip.fromArea;
    const cleanTo = trip.toArea.split(' - ').slice(-1)[0] || trip.toArea;

    const eventData = {
      summary: `🚕 رحلة تشاركية مجدولة: ${cleanFrom} ➔ ${cleanTo}`,
      location: `مكان التقاط: ${trip.fromArea} | مكان النزول: ${trip.toArea}`,
      description: `تفاصيل رحلتك المجدولة من تطبيق آدم التشاركي الذكي:\n\n` + 
        `• من: ${trip.fromArea}\n` +
        `• إلى: ${trip.toArea}\n` +
        `• وقت المغادرة: ${trip.departureTime}\n` +
        `• الكابتن: ${trip.driverName || 'بانتظار قبول الرحلة'}\n` +
        `• الركاب: ${trip.passengers.map(p => `${p.fullName} (${p.seatsCount} مقعد)`).join(', ') || 'لا يوجد ركاب آخرين حالياً'}\n\n` +
        `تمت المزامنة الآلية من تطبيق آدم بموافقتك 🚀`,
      start: {
        dateTime: convertToIso(trip.departureTime),
        timeZone: 'Asia/Amman'
      },
      end: {
        dateTime: getEndTimeIso(trip.departureTime),
        timeZone: 'Asia/Amman'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'popup', minutes: 120 }
        ]
      }
    };

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          handleDisconnect();
          throw new Error('منتهية الصلاحية (401 - Unauthorized). لقد تم فصل الجلسة لحمايتك، يرجى إعادة الاتصال بـ Google Calendar.');
        }
        const errRes = await response.json().catch(() => ({}));
        throw new Error(errRes?.error?.message || `خطأ استجابة السيرفر: ${response.status}`);
      }

      const resData = await response.json();
      const eventId = resData.id;

      setSyncedTrips(prev => ({
        ...prev,
        [tripId]: eventId
      }));

      setApiSuccess(`تمت مزامنة الرحلة [#${tripId.split('_').pop()}] بنجاح، وظهورها على تقويمك الخاص! 🎉📅`);
    } catch (err: any) {
      setApiError(err.message || 'فشلت المزامنة مع بوابة Google Calendar APIs.');
    } finally {
      setActionLoading(null);
    }
  };

  // Sync All eligible scheduled trips to Google Calendar
  const syncAllTrips = async () => {
    if (!accessToken) return;
    setLoading(true);
    setApiError(null);
    setApiSuccess(null);

    let successCount = 0;
    let failCount = 0;

    for (const trip of myTrips) {
      try {
        const isExistingEvent = syncedTrips[trip.id];
        const endpoint = isExistingEvent 
          ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${isExistingEvent}`
          : `https://www.googleapis.com/calendar/v3/calendars/primary/events`;

        const method = isExistingEvent ? 'PUT' : 'POST';

        const cleanFrom = trip.fromArea.split(' - ').slice(-1)[0] || trip.fromArea;
        const cleanTo = trip.toArea.split(' - ').slice(-1)[0] || trip.toArea;

        const eventData = {
          summary: `🚕 رحلة تشاركية مجدولة: ${cleanFrom} ➔ ${cleanTo}`,
          location: `مكان التقاط: ${trip.fromArea} | مكان النزول: ${trip.toArea}`,
          description: `تفاصيل رحلتك المجدولة من تطبيق آدم التشاركي الذكي:\n\n` + 
            `• من: ${trip.fromArea}\n` +
            `• إلى: ${trip.toArea}\n` +
            `• وقت المغادرة: ${trip.departureTime}\n` +
            `• الكابتن: ${trip.driverName || 'بانتظار قبول الرحلة'}\n` +
            `تمت المزامنة الآلية من تطبيق آدم 🚀`,
          start: {
            dateTime: convertToIso(trip.departureTime),
            timeZone: 'Asia/Amman'
          },
          end: {
            dateTime: getEndTimeIso(trip.departureTime),
            timeZone: 'Asia/Amman'
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 30 }
            ]
          }
        };

        const response = await fetch(endpoint, {
          method: method,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        });

        if (response.ok) {
          const resData = await response.json();
          setSyncedTrips(prev => ({
            ...prev,
            [trip.id]: resData.id
          }));
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setLoading(false);
    if (successCount > 0) {
      setApiSuccess(`تمت المزامنة الجماعية! تمت جدولة وتأكيد ${successCount} رحلة في تقويم Google بنجاح 🟢`);
    } else if (failCount > 0) {
      setApiError(`لم تنجح المزامنة لـ ${failCount} رحلات. تأكد من سلامة الصلاحيات.`);
    }
  };

  // Run autosync on mount if enabled
  useEffect(() => {
    if (accessToken && autoSync && myTrips.length > 0) {
      // Small timeout to prevent blocking mount rendering
      const timer = setTimeout(() => {
        syncAllTrips();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [accessToken, autoSync]);

  return (
    <div id="google-calendar-manager-root" className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 text-right flex flex-col gap-4 font-sans select-none text-slate-100">
      
      {/* BRAND HEADER */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-row-reverse">
        <div className="flex items-center gap-2 flex-row-reverse">
          <div className="bg-indigo-600/10 border border-indigo-500/30 p-2 rounded-2xl">
            <Calendar className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-100">بوابة ربط مزامنة تقويم Google (Google Calendar)</h3>
            <p className="text-[9px] text-slate-500 mt-0.5">مزامنة تلقائية وذكية لجميع مشاويرك ورحلاتك في تطبيق آدم مع تقويم هاتفك</p>
          </div>
        </div>
        {accessToken && (
          <button 
            type="button"
            onClick={handleDisconnect}
            className="bg-red-500/10 hover:bg-red-500 hover:text-black border border-red-500/20 px-2 py-1 rounded-xl text-[9px] font-bold text-red-400 cursor-pointer transition flex items-center gap-1 flex-row-reverse"
          >
            <LogOut className="w-3 h-3 text-red-400" />
            <span>قطع الاتصال</span>
          </button>
        )}
      </div>

      {/* API FEEDBACK TOASTS */}
      {apiSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-900/50 text-emerald-300 text-[10px] rounded-2xl flex items-center gap-2 flex-row-reverse text-right leading-relaxed animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{apiSuccess}</span>
        </div>
      )}

      {apiError && (
        <div className="p-3 bg-red-950/60 border border-red-900/50 text-red-300 text-[10px] rounded-2xl flex items-center gap-2 flex-row-reverse text-right leading-relaxed animate-pulse">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* AUTHENTICATION CONSOLE AND CONNECTION PORTALS */}
      {!accessToken ? (
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col gap-3">
          <div className="flex items-start gap-2 flex-row-reverse">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              تقوم هذه الميزة بالاتصال الآمن والمباشر بـ Google Calendar API على جهازك لتصدير كافة مواعيد رحلاتك بشكل مرمز وجميل. يتطلب الاتصال تزويد مفتاح العميل Client ID أو تسجيل الدخول السريع.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1 text-right">
            {/* Google Login Center */}
            <div className="border border-slate-850 p-3 rounded-2xl bg-slate-900/40 flex flex-col justify-between">
              <div>
                <span className="text-[9.5px] font-bold text-slate-300 flex items-center gap-1 flex-row-reverse mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  تسجيل الدخول السريع وآمن OAuth 2.0
                </span>
                <p className="text-[8.5px] text-slate-500 mb-4 leading-relaxed">
                  سيوجهك التطبيق إلى بوابات Google لتفويض مشاوير "آدم" للوصول لتقويمك بأمان.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] text-slate-400">معرف تطبيق Google (Google Client ID):</span>
                  <input 
                    type="text" 
                    value={clientId} 
                    onChange={e => {
                      setClientId(e.target.value);
                      localStorage.setItem('adam_calendar_client_id', e.target.value);
                    }}
                    placeholder="4185729690054-xxx..."
                    className="bg-slate-950 text-slate-100 border border-slate-850 rounded px-2 py-1 text-[9px] font-mono outline-none text-right placeholder-slate-600 focus:border-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full bg-indigo-600 hover:bg-indigo-550 text-white font-extrabold rounded-xl py-2 text-[10px] cursor-pointer transition shadow-md flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>تسجيل الدخول والتفويض بقنوات Google 📲</span>
                </button>
              </div>
            </div>

            {/* Manual Token playground input */}
            <form onSubmit={handleManualTokenSubmit} className="border border-slate-850 p-3 rounded-2xl bg-slate-900/40 flex flex-col justify-between">
              <div>
                <span className="text-[9.5px] font-bold text-slate-300 flex items-center gap-1 flex-row-reverse mb-1">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  مطورين / ربط مستندات يدوي (Access Token)
                </span>
                <p className="text-[8.5px] text-slate-500 mb-4 leading-relaxed">
                  مفيد عند استخدام بيئات تجريبية مثل Google Developer Playground أو لمن يفضل تجاوز المتصفحات.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] text-slate-400">رمز الوصول (OAuth Access Token):</span>
                  <input 
                    type="password" 
                    value={customTokenInput}
                    onChange={e => setCustomTokenInput(e.target.value)}
                    placeholder="ya29.a0AfB_..." 
                    className="bg-slate-950 text-slate-100 border border-slate-850 rounded px-2 py-1 text-[9px] font-mono outline-none text-right placeholder-slate-600 focus:border-amber-500"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-850 text-amber-400 font-extrabold rounded-xl py-2 text-[10px] cursor-pointer transition flex items-center justify-center gap-1"
                >
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>تطبيق وحفظ رمز الوصول محلياً</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          
          {/* USER CONTROL PANEL WITH AUTOSYNC TOGGLE */}
          <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-3 flex-row-reverse text-right">
            <div className="flex items-center gap-2 flex-row-reverse text-right">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
              <div>
                <span className="text-[10px] font-bold text-indigo-300 block">🟢 متصل بنجاح مع Google Calendar API</span>
                <span className="text-[8px] text-slate-400">جميع الصلاحيات جاهزة لكتابة وتحديث مواعيد الرحلات.</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Auto Sync Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleAutoSync}
                className={`px-3 py-1.5 rounded-xl font-bold text-[9px] transition cursor-pointer flex items-center gap-1.5 border ${
                  autoSync 
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950' 
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Power className="w-3 h-3" />
                <span>المزامنة التلقائية: {autoSync ? 'مفعلة ⏱️' : 'يدوية ⚙️'}</span>
              </button>

              <button
                type="button"
                onClick={syncAllTrips}
                disabled={loading || myTrips.length === 0}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-extrabold text-[9.5px] px-3.5 py-1.5 rounded-xl cursor-pointer transition shadow-md flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>مزامنة جماعية ({myTrips.length}) رحلات</span>
              </button>
            </div>
          </div>

          {/* LIST OF TRIPS FOR SYNCING */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-350 block mb-1">📋 مواعيد وجولاتك التشاركية المؤهلة للمزامنة:</span>
            
            {myTrips.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                <Calendar className="w-8 h-8 text-slate-600 mx-auto opacity-30 mb-2" />
                <span className="text-[9.5px] text-slate-500 block">لا يوجد لديك أي رحلات مجدولة نشطة أو قائمة حالياً للمزامنة.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                {myTrips.map(trip => {
                  const isSynced = syncedTrips[trip.id];
                  const hasCaptain = trip.driverId || trip.creatorType === 'driver';
                  const isCreator = trip.creatorId === userId;

                  return (
                    <div 
                      key={trip.id} 
                      className={`p-3 rounded-2xl text-right bg-slate-950/80 border transition-all duration-200 flex flex-col gap-2 ${
                        isSynced ? 'border-emerald-500/10 hover:border-emerald-500/20' : 'border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center flex-row-reverse border-b border-slate-900 pb-1.5">
                        <div className="flex items-center gap-1.5 flex-row-reverse">
                          <span className="text-[10px] font-bold text-slate-100 font-sans">
                            {trip.creatorName} [#{trip.id.split('_').pop()}]
                          </span>
                          {isCreator && (
                            <span className="text-[7.5px] bg-indigo-950 border border-indigo-900 text-indigo-300 font-semibold px-1 rounded">أنت المنشئ ⭐</span>
                          )}
                        </div>

                        <div>
                          {isSynced ? (
                            <span className="bg-emerald-950/80 border border-emerald-900/50 text-emerald-400 font-extrabold text-[8px] px-2 py-0.5 rounded-full flex items-center gap-1 flex-row-reverse">
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                              <span>مجدولة بالتقويم 🟢</span>
                            </span>
                          ) : (
                            <span className="bg-amber-950/80 border border-amber-900/50 text-amber-500 font-semibold text-[8px] px-2 py-0.5 rounded-full">
                              غير حية بالتقويم ⚪
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[9.5px] text-slate-350">
                        <div className="flex items-center gap-1 flex-row-reverse">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400/80 shrink-0" />
                          <span><strong>من:</strong> {trip.fromArea.split(' - ').slice(-2).join(' - ')}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-row-reverse">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400/80 shrink-0" />
                          <span><strong>إلى:</strong> {trip.toArea.split(' - ').slice(-2).join(' - ')}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-row-reverse">
                          <Clock className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                          <span className="font-mono"><strong>التوقيت:</strong> {trip.departureTime}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-row-reverse">
                          <UserCheck className="w-3.5 h-3.5 text-sky-400/80 shrink-0" />
                          <span>
                            <strong>الكابتن:</strong> {trip.driverName || 'معلقة (بانتظار التقاط كابتن)'}
                          </span>
                        </div>
                      </div>

                      {/* ACTIONS TO SYNC */}
                      <div className="flex justify-end pt-1 border-t border-slate-900 mt-0.5">
                        <button
                          type="button"
                          onClick={() => syncTripToGoogle(trip.id)}
                          disabled={actionLoading !== null}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[9px] transition cursor-pointer flex items-center gap-1 text-center justify-center ${
                            isSynced 
                              ? 'bg-slate-900 hover:bg-slate-850 text-emerald-400 border border-emerald-950 hover:border-emerald-900' 
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none shadow-md'
                          }`}
                        >
                          {actionLoading === trip.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-inherit" />
                          ) : isSynced ? (
                            <RefreshCw className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Calendar className="w-3 h-3 text-slate-950" />
                          )}
                          <span>{isSynced ? 'تحديث وتزامُن البيانات 🔄' : 'مزامنة مع تقويمي الخاص ➕'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
