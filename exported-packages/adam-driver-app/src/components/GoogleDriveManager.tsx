import React, { useState, useEffect } from 'react';
import { useAppState } from '../stateEngine';
import { 
  Cloud, 
  Upload, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  FileText, 
  Key, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  Database, 
  FileSpreadsheet, 
  ShieldCheck, 
  LogOut,
  Info
} from 'lucide-react';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  size?: string;
  webViewLink?: string;
}

export function GoogleDriveManager() {
  const { rides, drivers, passengers, currentUser } = useAppState();

  // Authentication states
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('adam_drive_token');
  });
  const [clientId, setClientId] = useState<string>(() => {
    return localStorage.getItem('adam_drive_client_id') || '4185729690054-mockclientid.apps.googleusercontent.com';
  });
  const [customTokenInput, setCustomTokenInput] = useState('');
  
  // API functional states
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // Parse token from implicit OAuth redirect hash
  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get('access_token');
        if (token) {
          setAccessToken(token);
          localStorage.setItem('adam_drive_token', token);
          setApiSuccess('تم الاتصال بحساب Google Drive بنجاح عبر بوابة OAuth 🟢');
          // Clear URL hash to clean up browser bar
          window.location.hash = '';
        }
      }
    } catch (e) {
      console.error('Error parsing hash:', e);
    }
  }, []);

  // Fetch file list when token changes
  useEffect(() => {
    if (accessToken) {
      fetchDriveFiles();
    } else {
      setFiles([]);
    }
  }, [accessToken]);

  // Persistent ClientID save
  const handleSaveClientId = (id: string) => {
    setClientId(id);
    localStorage.setItem('adam_drive_client_id', id);
  };

  // Google OAuth 2.0 Client-side Implicit Flow login
  const handleGoogleLogin = () => {
    setApiError(null);
    setApiSuccess(null);
    
    if (!clientId.trim()) {
      setApiError('يرجى إدخال معرف العميل Client ID الخاص بـ Google Cloud أولاً.');
      return;
    }

    const redirectUri = window.location.origin;
    const scopes = 'https://www.googleapis.com/auth/drive';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
      `client_id=${encodeURIComponent(clientId.trim())}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `include_granted_scopes=true&` +
      `state=adam_drive_auth_context`;

    // Inform the user, and redirect
    setApiSuccess('جاري توجيهك إلى صفحة تسجيل دخول Google الآمنة...');
    setTimeout(() => {
      window.location.href = authUrl;
    }, 1200);
  };

  // Manual token input submission (super useful for testing with Google OAuth Playground)
  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);

    if (!customTokenInput.trim()) {
      setApiError('الرجاء كتابة رمز الوصول Access Token بشكل صحيح للاتصال.');
      return;
    }

    const token = customTokenInput.trim();
    setAccessToken(token);
    localStorage.setItem('adam_drive_token', token);
    setCustomTokenInput('');
    setApiSuccess('تم تطبيق رمز الاتصال وحفظه محلياً في ذاكرة التطبيق بنجاح! 🟢');
  };

  // Logout/Disconnect
  const handleDisconnect = () => {
    setAccessToken(null);
    localStorage.removeItem('adam_drive_token');
    setFiles([]);
    setApiSuccess('تم إنهاء الجلسة وقطع الاتصال بسحابة Google Drive بنجاح ✅');
    setApiError(null);
  };

  // Fetch list of files created by the application
  const fetchDriveFiles = async () => {
    if (!accessToken) return;
    setLoading(true);
    setApiError(null);

    try {
      // Query files containing 'adam' or listing all files, showing creation date and WebLink
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?pageSize=25&q=name+contains+'adam'+and+trashed%3Dfalse&fields=files(id,name,mimeType,createdTime,size,webViewLink)&orderBy=createdTime+desc`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          handleDisconnect();
          throw new Error('انتهت صلاحية رمز الاتصال بالخادم (401). يرجى تسجيل الدخول مجدداً.');
        }
        const errData = await response.json();
        throw new Error(errData?.error?.message || 'فشل الاتصال بـ Google Drive API');
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err: any) {
      console.error('Fetch Drive Files error:', err);
      setApiError(err.message || 'حدث خطأ غير متوقع أثناء استرجاع الملفات من Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  // Upload JSON Backup of Rides and System Parameters to Drive
  const handleUploadBackupJson = async () => {
    if (!accessToken) return;
    setActionLoading('backup_json');
    setApiError(null);
    setApiSuccess(null);

    try {
      const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').slice(0, 19);
      const fileName = `adam_system_backup_${timestamp}.json`;
      
      const backupData = {
        meta: {
          system: 'Adam Ride Pooling Platform',
          created_at: new Date().toISOString(),
          authorized_operator: currentUser?.fullName || 'مسؤول آدم إداري',
        },
        stats: {
          total_drivers: drivers.length,
          total_passengers: passengers.length,
          total_rides: rides.length,
          active_pooling_rides: rides.filter(r => r.status === 'pooling').length,
          running_rides: rides.filter(r => r.status === 'started' || r.status === 'accepted').length,
          completed_rides: rides.filter(r => r.status === 'completed').length,
          total_collected_commissions: rides.reduce((acc, r) => acc + (r.commissionCharged || 0), 0)
        },
        data: {
          rides,
          drivers: drivers.map(d => ({
            id: d.id,
            fullName: d.fullName,
            phone: d.phone,
            email: d.email,
            carType: d.carType,
            balance: d.balance,
            status: d.status,
            tripsCount: d.tripsCount
          })),
          passengers: passengers.map(p => ({
            id: p.id,
            fullName: p.fullName,
            phone: p.phone,
            email: p.email,
            tripsCount: p.tripsCount
          }))
        }
      };

      // Construct Multi-part upload body
      const metadata = {
        name: fileName,
        mimeType: 'application/json',
        description: 'نسخة احتياطية بيانية تجميعية من قوافل آدم الذكية لحفظ سجلات الركاب والعمولات بالتفصيل.',
      };

      const boundary = 'foo_bar_boundary';
      const multipartBody = 
        `\r\n--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        JSON.stringify(metadata) +
        `\r\n--${boundary}\r\n` +
        `Content-Type: application/json\r\n\r\n` +
        JSON.stringify(backupData, null, 2) +
        `\r\n--${boundary}--`;

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      );

      if (!response.ok) {
        throw new Error('فشل رفع الملف الاحتياطي للدرج. تفقد صلاحيات الرمز.');
      }

      setApiSuccess(`تم إنشاء نسخة احتياطية ذكية شاملة بنجاح باسم "${fileName}" ورفعها مباشرة لـ Google Drive! 💾`);
      await fetchDriveFiles();
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'حدث خطأ أثناء رفع النسخة الاحتياطية.');
    } finally {
      setActionLoading(null);
    }
  };

  // Export Financial CSV ledger report to Drive
  const handleExportLedgerCsv = async () => {
    if (!accessToken) return;
    setActionLoading('export_csv');
    setApiError(null);
    setApiSuccess(null);

    try {
      const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').slice(0, 19);
      const fileName = `adam_financial_ledger_${timestamp}.csv`;

      // Build realistic CSV file content
      let csvContent = '\ufeff'; // UTF-8 BOM representation for Excel Arabic compatibility
      csvContent += 'معرف الرحلة,الكابتن,المرسل والركاب,منطقة الانطلاق,منطقة الوصول,الحالة الجارية,العمولة المقتطعة (دينار),التاريخ والوقت الشامل\r\n';
      
      rides.forEach(ride => {
        const driverName = drivers.find(d => d.id === ride.driverId)?.fullName || '-- لم يقر بعد --';
        const passengerNames = ride.requests.map(r => r.passengerName).join(' + ');
        const departure = ride.fromArea ? ride.fromArea.split('-').pop() : '--';
        const arrival = ride.toArea ? ride.toArea.split('-').pop() : '--';
        const arabicStatus = ride.status === 'completed' ? 'تم الاكتمال' : ride.status === 'started' ? 'بدأت الحركة' : ride.status === 'accepted' ? 'تم القبول' : 'تجميع جاري';
        
        csvContent += `"${ride.id}","${driverName}","${passengerNames}","${departure}","${arrival}","${arabicStatus}","${ride.commissionCharged} JD","${ride.startTime || '--'}"\r\n`;
      });

      // Export statistics totals
      const totalCommissions = rides.reduce((acc, r) => acc + (r.commissionCharged || 0), 0);
      csvContent += `\r\n\r\n,,إجمالي إيراد عمولات منصة آدم,,,,,${totalCommissions} JD\r\n`;

      const metadata = {
        name: fileName,
        mimeType: 'text/csv',
        description: 'تقرير كشف حساب مالي دوري لمخرجات عمولات الركاب المتشاركين عبر شبكة آدم.',
      };

      const boundary = 'csv_boundary_adam';
      const multipartBody = 
        `\r\n--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        JSON.stringify(metadata) +
        `\r\n--${boundary}\r\n` +
        `Content-Type: text/csv; charset=UTF-8\r\n\r\n` +
        csvContent +
        `\r\n--${boundary}--`;

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      );

      if (!response.ok) {
        throw new Error('فشل تصدير جدول البيانات المالي لـ Google Drive.');
      }

      setApiSuccess(`تم تصدير كشف العمولات والحسابات وعلاوات الكباتن كملف CSV باسم "${fileName}" بنجاح! 📊`);
      await fetchDriveFiles();
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'فشل تصدير كشف الحساب المالي.');
    } finally {
      setActionLoading(null);
    }
  };

  // Real Delete function with confirmation check (as per workspace requirement)
  const handleDeleteFile = async (fileId: string, fileName: string) => {
    // Robust safety validation popup as required by specific constraint
    const confirmed = window.confirm(
      `هل أنت متأكد تماماً من رغبتك في حذف ملف الأرشيف السحابي التالي نهائياً من حسابك بالـ Google Drive؟\n\nاسم الملف: ${fileName}\n\nتحذير: هذا الإجراء لا يمكن التراجع عنه وبموجبه سيختفي الملف من السحابة.`
    );
    if (!confirmed) return;

    setActionLoading(`delete_${fileId}`);
    setApiError(null);
    setApiSuccess(null);

    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('فشل في حذف الملف المستهدف. تفقد صلاحيات الحساب.');
      }

      setApiSuccess(`تم حذف ملف الأرشيف السحابي "${fileName}" من Google Drive بنجاح! 🗑`);
      // Update local file array inside list Drive
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'فشل تنفيذ أمر الحذف من السيرفر.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-right font-sans relative overflow-hidden shadow-2xl">
      {/* Decorative ambient backdrop */}
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main title */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4 flex-row-reverse">
        <div className="flex items-center gap-2 flex-row-reverse">
          <div className="bg-indigo-950 p-2 rounded-xl border border-indigo-800/40 text-indigo-400">
            <Cloud className={`w-5 h-5 ${loading ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-100 font-sans">أرشيف سحابة آدم والنسخ الاحتياطي ☁</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">مزامنة الكشوفات المالية والتقارير بموجب حساب Google Drive الخاص بك</p>
          </div>
        </div>

        {accessToken && (
          <div className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-900/40 py-1 px-2.5 rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-400">متصل بالسحابة</span>
          </div>
        )}
      </div>

      {/* Notifications container */}
      {apiError && (
        <div className="bg-red-950/50 border border-red-900/50 p-3 rounded-xl flex items-center gap-2 flex-row-reverse text-right text-[10px] text-red-400 mb-4 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="flex-1 font-sans">{apiError}</span>
        </div>
      )}
      {apiSuccess && (
        <div className="bg-emerald-950/40 border border-emerald-900/50 p-3 rounded-xl flex items-center gap-2 flex-row-reverse text-right text-[10px] text-emerald-400 mb-4 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1 font-sans">{apiSuccess}</span>
        </div>
      )}

      {/* CONNECTION AND CREDENTIALS PANEL */}
      {!accessToken ? (
        <div className="flex flex-col gap-4 bg-slate-950/50 border border-slate-850 p-4 rounded-2xl">
          <div className="text-right text-[10.5px] text-slate-300 leading-relaxed font-sans">
            <p className="font-bold text-indigo-400 pb-1 border-b border-slate-900 mb-1.5 flex justify-end gap-1.5 items-center flex-row-reverse">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>خيارات الاتصال الآمن مع Google Drive:</span>
            </p>
            تطلب بوابة آدم التوثيق المسبق للوصول للحد الأدنى من صلاحيات القراءة والرفع لتصدير ملفات الكشوفات وحفظ السجلات بشكل حقيقي. اختر طريقة الاتصال المناسبة:
          </div>

          {/* Tab 1: Google login flow */}
          <div className="border border-slate-800 p-3 rounded-xl bg-slate-900/30 flex flex-col gap-2.5">
            <div className="flex justify-between items-center text-[10px] flex-row-reverse">
              <span className="font-bold text-slate-200">الخيار الأول: بوابة الدخول التفاعلية (OAuth Flow)</span>
              <span className="text-slate-500 font-mono">Implicit Grant</span>
            </div>

            <div className="flex flex-col gap-1 text-right">
              <label className="text-[9px] text-slate-500">معرف العميل (Client ID):</label>
              <input
                type="text"
                value={clientId}
                onChange={e => handleSaveClientId(e.target.value)}
                placeholder="Google App Client ID..."
                className="bg-slate-950 text-slate-200 border border-slate-800 p-1.5 px-2.5 rounded text-[10px] outline-none font-mono text-left w-full"
              />
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full bg-[#1a73e8] hover:bg-[#155fc0] text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-md"
            >
              {/* Inline SVG conforming with Material specifications */}
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34a853" />
                <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#fbbc05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#ea4335" />
              </svg>
              <span>تسجيل الدخول والتفويض عبر Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2 flex-row-reverse select-none">
            <div className="h-[1px] bg-slate-850 flex-1" />
            <span className="text-[8px] text-slate-600 font-bold">أو</span>
            <div className="h-[1px] bg-slate-850 flex-1" />
          </div>

          {/* Tab 2: Developer Manual Access Token Input - Very robust for sandboxes */}
          <form onSubmit={handleManualTokenSubmit} className="border border-slate-800 p-3 rounded-xl bg-slate-900/30 flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px] flex-row-reverse">
              <span className="font-bold text-slate-200">الخيار الثاني: إدخال رمز الوصول الفوري (Access Token)</span>
              <span className="text-indigo-400 font-bold flex items-center gap-1 font-sans text-[9px]">
                <Key className="w-3 h-3" /> للمطورين
              </span>
            </div>

            <p className="text-[8.5px] text-slate-400">
              يمكنك توليد رمز وصول Drive سريع ومباشر من خلال <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Google OAuth Playground</a> ولصقه فورياً بالأسفل للتشغيل السحابي الحقيقي دون الحاجة لضبط شاشة الموافقة.
            </p>

            <div className="flex gap-1 bg-slate-950 p-1 rounded border border-slate-850">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold px-3 transition cursor-pointer"
              >
                ربط الرمز
              </button>
              <input
                type="text"
                value={customTokenInput}
                onChange={e => setCustomTokenInput(e.target.value)}
                placeholder="ألصق رمز الوصول Access Token الممنوح..."
                className="bg-transparent text-[9.5px] text-slate-100 placeholder-slate-700 text-left font-mono outline-none flex-1 pr-1"
              />
            </div>
          </form>
        </div>
      ) : (
        /* CONNECTED INTERACTIVE CLOUD DASHBOARD */
        <div className="flex flex-col gap-4">
          
          {/* Quick Session Header */}
          <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-2xl flex justify-between items-center flex-row-reverse text-xs">
            <div className="text-right">
              <span className="text-[8px] text-slate-600 block leading-none mb-1">المشغّل المصادق للعمليات</span>
              <strong className="text-slate-200 text-xs">
                {currentUser?.fullName || 'مسؤول آدم إداري'}
              </strong>
            </div>

            <button
              onClick={handleDisconnect}
              className="text-[10px] text-red-400 hover:text-red-300 font-bold bg-slate-900 border border-slate-850 hover:bg-red-955/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition flex-row-reverse"
              title="تسجيل الخروج من Google وسحب رمز المصادقة من الذاكرة"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>قطع الاتصال</span>
            </button>
          </div>

          {/* BACKUP EXPORT TRIGGER BLOCK - REAL API WRITING DESTRUCTIVE/MUTATING CONFIRMATIONS CODES */}
          <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-2xl flex flex-col gap-3 text-right">
            <span className="text-[10px] font-bold text-indigo-400 border-b border-slate-850/50 pb-1.5 block">
              خيار النسخ الاحتياطي اليدوي والتصدير السحابي المباشر
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Back Up 1: JSON System Backup */}
              <button
                onClick={handleUploadBackupJson}
                disabled={actionLoading !== null}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl p-3 flex flex-col items-center gap-2 text-center transition cursor-pointer disabled:opacity-40"
              >
                <div className="bg-indigo-950/80 text-indigo-400 p-2 rounded-lg border border-indigo-900/40">
                  {actionLoading === 'backup_json' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4" />
                  )}
                </div>
                <div className="font-sans">
                  <span className="text-[10.5px] font-bold text-slate-100 block">نسخة احتياطية ذكية (JSON)</span>
                  <span className="text-[8.5px] text-slate-500 mt-0.5 block">أرشفة تفصيلية للرحلات والتوزيع والكتلة</span>
                </div>
              </button>

              {/* Back Up 2: Excel / CSV Ledger */}
              <button
                onClick={handleExportLedgerCsv}
                disabled={actionLoading !== null}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl p-3 flex flex-col items-center gap-2 text-center transition cursor-pointer disabled:opacity-40"
              >
                <div className="bg-emerald-950/80 text-emerald-400 p-2 rounded-lg border border-emerald-900/40">
                  {actionLoading === 'export_csv' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                </div>
                <div className="font-sans">
                  <span className="text-[10.5px] font-bold text-slate-100 block">تصدير جدول الحسابات والعمولات</span>
                  <span className="text-[8.5px] text-slate-500 mt-0.5 block">ملف CSV متوافق مع Excel وجداول البيانات</span>
                </div>
              </button>
            </div>
          </div>

          {/* LIVE FILE MANAGER FROM DRIVE */}
          <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-2xl flex flex-col gap-2.5">
            <div className="flex justify-between items-center border-b border-slate-850/50 pb-1.5 flex-row-reverse">
              <span className="text-[10px] font-bold text-indigo-400">
                سجلات وملفات آدم المرفوعة المحفوظة בסحابتك 📁
              </span>
              <button
                onClick={fetchDriveFiles}
                disabled={loading}
                className="bg-slate-900 hover:bg-slate-800 text-slate-350 p-1 px-2 rounded-lg text-[9px] font-mono flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${loading ? 'animate-spin' : ''}`} />
                <span>تحديث</span>
              </button>
            </div>

            {/* List Table / Loader */}
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
                <RefreshCw className="w-5 h-5 text-indigo-505 animate-spin" />
                <span className="text-[10px] font-sans">جاري سحب قائمة الأرشيف من Google Drive...</span>
              </div>
            ) : files.length === 0 ? (
              <div className="py-10 text-center text-slate-600 text-[10px] leading-relaxed italic flex flex-col items-center gap-1">
                <span>لا يوجد أي نسخ احتياطية أو كشوفات مالية تم رفعها من خلال تطبيق آدم على هذا الحساب بعد.</span>
                <span>اضغط عاليًا لإنشاء ورفع أول نسخة أرشيفية.</span>
              </div>
            ) : (
              <div className="max-h-[170px] overflow-y-auto border border-slate-850 rounded-lg">
                <div className="divide-y divide-slate-850 bg-slate-900">
                  {files.map((file) => {
                    const isCsv = file.mimeType === 'text/csv';
                    const fileFormattedSize = file.size 
                      ? `${(parseInt(file.size) / 1024).toFixed(1)} KB` 
                      : 'N/A';
                    const fileCreatedDate = new Date(file.createdTime).toLocaleDateString('ar-JO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div key={file.id} className="p-2.5 hover:bg-slate-850/30 flex justify-between items-center flex-row-reverse text-right gap-3 transition">
                        {/* File details */}
                        <div className="flex-1 overflow-hidden">
                          <span className="text-[10.5px] font-bold text-slate-200 block truncate flex items-center justify-end gap-1 flex-row-reverse">
                            {isCsv ? (
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            )}
                            <span className="truncate">{file.name}</span>
                          </span>
                          <span className="text-[8.5px] text-slate-500 block font-mono mt-0.5">
                            {fileCreatedDate} • الحجم: {fileFormattedSize}
                          </span>
                        </div>

                        {/* Action controllers */}
                        <div className="flex gap-1.5 shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-slate-950 hover:bg-slate-800 text-indigo-400 p-1.5 rounded-lg border border-slate-850 hover:text-indigo-300 flex items-center gap-1 text-[9px] font-sans transition"
                              title="استعراض وتنزيل الملف على صفحة مستقلة"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteFile(file.id, file.name)}
                            disabled={actionLoading === `delete_${file.id}`}
                            className="bg-slate-950 hover:bg-red-950 hover:text-red-400 text-slate-500 p-1.5 rounded-lg border border-slate-850 hover:border-red-900 transition cursor-pointer"
                            title="حذف هذا الملف نهائياً"
                          >
                            {actionLoading === `delete_${file.id}` ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Block */}
      <div className="mt-4 bg-slate-950 border border-slate-850 p-3 rounded-2xl text-[9px] leading-relaxed text-slate-400 flex gap-2 flex-row-reverse text-right">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <strong>ملاحظة تقنية:</strong> جميع المعالجات والاتصال مع محركات جوجل تتم بالكامل من متصفحك بشكل مباشر وآمن (Client-Side REST Architecture) دون وجود خادم وسيط يحفظ كشوفاتك السرية. تفاصيل صلاحيتك محمية بذاكرة حاسوبك المحلية المؤقتة.
        </div>
      </div>
    </div>
  );
}
