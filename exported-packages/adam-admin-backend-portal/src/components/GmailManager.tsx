import React, { useState, useEffect } from 'react';
import { useAppState } from '../stateEngine';
import { 
  Mail, 
  Send, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  FileText, 
  Key, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  Inbox, 
  UserCheck, 
  LogOut,
  Info,
  ChevronDown,
  User,
  Clock,
  MapPin,
  FileCheck
} from 'lucide-react';

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  body?: string;
}

export function GmailManager() {
  const { rides, drivers, passengers, scheduledTrips, currentUser } = useAppState();

  // Authentication states
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('adam_gmail_token');
  });
  const [clientId, setClientId] = useState<string>(() => {
    return localStorage.getItem('adam_gmail_client_id') || '4185729690054-mockclientid.apps.googleusercontent.com';
  });
  const [customTokenInput, setCustomTokenInput] = useState('');
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  
  // API functional states
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // Email Builder states
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailTemplate, setEmailTemplate] = useState<'custom' | 'pooling_info' | 'scheduled_trip' | 'invoice'>('pooling_info');
  const [emailBody, setEmailBody] = useState('');
  
  // Selected Entity References
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedRideId, setSelectedRideId] = useState('');

  // Selected Member Info for Template Fields
  const selectedPassenger = passengers.find(p => p.id === selectedRecipientId);
  const selectedDriver = drivers.find(d => d.id === selectedRecipientId);
  const targetName = selectedPassenger?.fullName || selectedDriver?.fullName || 'عضو آدم الكريم (Adam User)';
  const targetPhone = selectedPassenger?.phone || selectedDriver?.phone || '07XXXXXXXX';

  // Parse token from implicit OAuth redirect hash
  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get('access_token');
        const state = params.get('state');
        if (token && state === 'adam_gmail_auth_context') {
          setAccessToken(token);
          localStorage.setItem('adam_gmail_token', token);
          setApiSuccess('تم الاتصال بحساب Gmail الخاص بك بنجاح عبر بوابة Google OAuth 🟢');
          // Clear URL hash to clean up browser address bar
          window.location.hash = '';
        }
      }
    } catch (e) {
      console.error('Error parsing hash:', e);
    }
  }, []);

  // Fetch email/profile info and messages on launch or token change
  useEffect(() => {
    if (accessToken) {
      fetchGmailProfile();
      fetchRecentMessages();
    } else {
      setConnectedEmail(null);
      setMessages([]);
    }
  }, [accessToken]);

  // Sync email template contents when states change
  useEffect(() => {
    regenerateTemplateContent();
  }, [emailTemplate, selectedRecipientId, selectedTripId, selectedRideId]);

  // Google OAuth 2.0 Client-side Implicit Flow login for Gmail Scopes
  const handleGoogleLogin = () => {
    setApiError(null);
    setApiSuccess(null);
    
    if (!clientId.trim()) {
      setApiError('يرجى إدخال معرف عميل OAuth Client ID من منصة Google Cloud أولاً.');
      return;
    }

    const redirectUri = window.location.origin;
    // Request full Gmail access for read/write/send
    const scopes = 'https://mail.google.com/';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
      `client_id=${encodeURIComponent(clientId.trim())}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `include_granted_scopes=true&` +
      `state=adam_gmail_auth_context`;

    setApiSuccess('جاري توجيهك إلى صفحة تسجيل دخول Google الآمنة لتفعيل بوابة البريد للمنظومة...');
    setTimeout(() => {
      window.location.href = authUrl;
    }, 1200);
  };

  const handleSaveClientId = (id: string) => {
    setClientId(id);
    localStorage.setItem('adam_gmail_client_id', id);
  };

  // Manual token input submission (super useful for Google OAuth Playground)
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
    localStorage.setItem('adam_gmail_token', token);
    setCustomTokenInput('');
    setApiSuccess('تم تطبيق رمز الاتصال بالبريد وحفظه محلياً بنجاح! 🟢');
  };

  const handleDisconnect = () => {
    setAccessToken(null);
    localStorage.removeItem('adam_gmail_token');
    setConnectedEmail(null);
    setMessages([]);
    setApiSuccess('تم تسجيل الخروج وقطع الاتصال ببريد Gmail بنجاح ✅');
    setApiError(null);
  };

  // Fetch the authentic user Gmail profile info
  const fetchGmailProfile = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConnectedEmail(data.emailAddress);
      } else if (res.status === 401) {
        handleDisconnect();
      }
    } catch (e) {
      console.error('Error fetching Gmail profile:', e);
    }
  };

  // Fetch recent messages matching pooling/adam query
  const fetchRecentMessages = async () => {
    if (!accessToken) return;
    setLoading(true);
    setApiError(null);
    try {
      // Fetch messages with query "adam OR rpooling OR ride OR trip"
      const res = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8&q=Subject:(adam+OR+pooling+OR+ride+OR+trip+OR+تشارك)',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      if (!res.ok) {
        if (res.status === 401) {
          handleDisconnect();
          throw new Error('انتهت صلاحية رمز الاتصال بالبريد (401).');
        }
        const err = await res.json();
        throw new Error(err.error?.message || 'فشل استرجاع صندوق البريد.');
      }

      const data = await res.json();
      const messageList = data.messages || [];
      
      // Fetch full details of each message in parallel
      const detailedMessages = await Promise.all(
        messageList.map(async (msg: { id: string }) => {
          try {
            const detailRes = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (!detailRes.ok) return null;
            const detail = await detailRes.json();
            
            // Extract headers
            const headers = detail.payload.headers || [];
            const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(بدون عنوان)';
            const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'غير معروف';
            const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || 'غير معروف';
            const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

            return {
              id: detail.id,
              threadId: detail.threadId,
              snippet: detail.snippet || '',
              subject,
              from,
              to,
              date,
            };
          } catch (e) {
            return null;
          }
        })
      );

      setMessages(detailedMessages.filter(m => m !== null) as GmailMessage[]);
    } catch (err: any) {
      setApiError(err.message || 'حدث خطأ غير متوقع في جلب صندوق وارد Gmail.');
    } finally {
      setLoading(false);
    }
  };

  // Helper parser/generator to pre-fill template text as beautiful HTML tables
  const regenerateTemplateContent = () => {
    if (emailTemplate === 'pooling_info') {
      setEmailSubject(`🚗 تفاصيل مشوار التجميع الجاري - تطبيق آدم التشاركي الذكي`);
      
      const matchedRideIdx = rides.findIndex(r => r.id === selectedRideId);
      const ride = rides[matchedRideIdx >= 0 ? matchedRideIdx : 0] || rides[0];
      const fromSpot = ride?.fromArea?.split('-')?.pop()?.trim() || 'عمان';
      const toSpot = ride?.toArea?.split('-')?.pop()?.trim() || 'إربد';
      const passengersList = ride?.requests?.map(r => `<li>👥 ${r.passengerName} (المقاعد: ${r.seatsCount})</li>`).join('') || '<li>👥 لم يتم انضمام ركاب إضافيين بعد</li>';
      const totalFare = ride?.requests?.reduce((acc, r) => acc + (r.seatsCount * 3.5), 0) || 3.5;

      setEmailBody(`
        <div style="direction: rtl; text-align: right; font-family: 'Inter', system-ui, sans-serif; background-color: #0b1528; color: #f8fafc; padding: 25px; border-radius: 12px; max-width: 550px; border: 1px solid #1e293b;">
          <h2 style="color: #6366f1; margin-top: 0; font-size: 18px; border-bottom: 2px solid #1e293b; padding-bottom: 12px;">🚕 تفاصيل وتحديثات رحلتك التشاركية الجارية</h2>
          <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">أهلاً بك <strong>${targetName}</strong>،</p>
          <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">يسعدنا إعلامك ببدء تجميع رحلتك الذكية على خطوط المملكة الأردنية. تفاصيل المسار:</p>
          
          <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 15px; margin: 15px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #cbd5e1;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #818cf8;">منطقة البداية:</td>
                <td style="padding: 6px 0; text-align: left;">${fromSpot}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #818cf8;">الوجهة المقصودة:</td>
                <td style="padding: 6px 0; text-align: left;">${toSpot}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #818cf8;">تقدير الأجرة الإجمالية:</td>
                <td style="padding: 6px 0; text-align: left; font-weight: bold; color: #10b981;">${totalFare.toFixed(2)} د.أ</td>
              </tr>
            </table>
          </div>

          <div style="margin: 15px 0;">
            <p style="font-size: 12px; font-weight: bold; color: #818cf8; margin-bottom: 5px;">👥 الركاب المسجلين بالسيارة:</p>
            <ul style="font-size: 12px; color: #94a3b8; margin: 0; padding-right: 20px;">
              ${passengersList}
            </ul>
          </div>

          <p style="font-size: 11px; color: #64748b; line-height: 1.5; margin-top: 20px;">* يرجى العلم بأن نظام آدم يقوم بالربط وموازنة الأحمال آلياً لتخفيف نفقة السولار/البنزين بنسبة تصل إلى 70% للجميع.</p>
          <div style="text-align: center; margin-top: 20px; border-top: 1px solid #1e293b; padding-top: 15px;">
            <span style="font-size: 11px; color: #4f46e5; font-weight: bold;">فريق آدم التشاركي - الأردن 🤝</span>
          </div>
        </div>
      `);
    } else if (emailTemplate === 'scheduled_trip') {
      setEmailSubject(`🔔 تذكير: اقتراب انطلاق رحلتك المجدولة - ADAM JO`);
      
      const trip = scheduledTrips.find(t => t.id === selectedTripId) || scheduledTrips[0];
      const fromArea = trip?.fromArea?.split('-')?.pop()?.trim() || 'عُمان';
      const toArea = trip?.toArea?.split('-')?.pop()?.trim() || 'إربد';
      const time = trip?.departureTime || 'اليوم';
      const passengersCount = trip?.passengers?.length || 0;
      const capName = trip?.driverId ? trip.driverName : 'جاري البحث عن كابتن';

      setEmailBody(`
        <div style="direction: rtl; text-align: right; font-family: 'Inter', system-ui, sans-serif; background-color: #020617; color: #f1f5f9; padding: 25px; border-radius: 12px; max-width: 550px; border: 1px solid #1e1b4b;">
          <h2 style="color: #4f46e5; margin-top: 0; font-size: 17px; border-bottom: 2px solid #1e1b4b; padding-bottom: 12px; text-shadow: 0 0 10px rgba(79, 70, 229, 0.2);">⏰ تنبيه باقتراب رحلتك المجدولة</h2>
          <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">ـ الزميل <strong>${targetName}</strong>،</p>
          <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">نود تذكيرك بأن رحلتك المجدولة عبر ADAM على وشك الانطلاق. تفاصيل الرحلة:</p>
          
          <div style="background-color: #0b0f19; border: 1px solid #311042; border-radius: 8px; padding: 15px; margin: 15px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #e2e8f0;">
              <tr>
                <td style="padding: 6px 0; color: #a5b4fc; font-weight: bold;">تاريخ اللقاء والوقت:</td>
                <td style="padding: 6px 0; text-align: left; font-weight: bold; color: #fbbf24;">${time}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #a5b4fc; font-weight: bold;">من خط السير:</td>
                <td style="padding: 6px 0; text-align: left;">${fromArea}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #a5b4fc; font-weight: bold;">وصولاً إلى:</td>
                <td style="padding: 6px 0; text-align: left;">${toArea}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #a5b4fc; font-weight: bold;">الكابتن المكلف:</td>
                <td style="padding: 6px 0; text-align: left; color: #fb923c;">${capName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #a5b4fc; font-weight: bold;">الركاب المسجلين:</td>
                <td style="padding: 6px 0; text-align: left;">${passengersCount} ركاب</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin-top: 15px;">⚠️ يرجى الترفق ومراعاة مواعيد النقل العام والتأكد من مطابقة بيانات السيارة ورقم اللوحة الأردنية قبل الصعود.</p>
          <div style="text-align: center; margin-top: 20px; border-top: 1px solid #1e1b4b; padding-top: 15px;">
            <span style="font-size: 11px; color: #6366f1; font-weight: bold;">منصة النقل الذكي آدم الأردن 🏛️</span>
          </div>
        </div>
      `);
    } else if (emailTemplate === 'invoice') {
      setEmailSubject(`🧾 فاتورة الرحلة المكتملة وكشف عمولة منصة آدم - رقم: ${Math.floor(Math.random() * 900000 + 100000)}`);
      
      const ride = rides.find(r => r.status === 'completed') || rides[0];
      const fare = 3.50;
      const comm = ride?.commissionCharged || 0.50;

      setEmailBody(`
        <div style="direction: rtl; text-align: right; font-family: 'Inter', system-ui, sans-serif; background-color: #ffffff; color: #1e293b; padding: 25px; border-radius: 12px; max-width: 550px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4f46e5; margin: 0; font-size: 22px;">🧾 فاتورة رحلة ADAM ائتمانية</h1>
            <span style="font-size: 10px; color: #64748b;">رقم الفاتورة: ADAM-${Math.floor(Math.random() * 900000 + 100000)}</span>
          </div>

          <p style="font-size: 13px; line-height: 1.6; color: #334155;">السيد/السيادة: <strong>${targetName}</strong>،</p>
          <p style="font-size: 13px; line-height: 1.6; color: #334155;">نشكرك على استخدام تطبيق النقل التشاركي آدم. فيما يلي الكشف المالي لرحلتك المنجزة:</p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px;">
            <thead>
              <tr style="border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 8px 10px; text-align: right; font-weight: bold; color: #1e293b;">البيان والخدمة</th>
                <th style="padding: 8px 10px; text-align: left; font-weight: bold; color: #1e293b;">القيمة</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px; color: #475569;">تذكرة حجز المقعد التشاركي الأساسية</td>
                <td style="padding: 10px; text-align: left; font-weight: bold;">${fare.toFixed(2)} د.أ</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px; color: #475569;">ضريبة وعمولة إدارة البوابة الإلكترونية المنظمة</td>
                <td style="padding: 10px; text-align: left; font-weight: bold;">${comm.toFixed(2)} د.أ</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
                <td style="padding: 10px; font-weight: bold; color: #4f46e5;">المجموع الصافي المدفوع من المحفظة</td>
                <td style="padding: 10px; text-align: left; font-weight: bold; color: #10b981;">${(fare + comm).toFixed(2)} دينار أردني</td>
              </tr>
            </tbody>
          </table>

          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; font-size: 11px; color: #15803d; line-height: 1.5; margin: 15px 0;">
            ✅ تم تسديد الفاتورة بالكامل من خلال الرصيد المربوط بالمحفظة الإلكترونية لآدم، ولا داعي للدفع النقدي إلى الكابتن.
          </div>

          <div style="text-align: center; margin-top: 25px; border-top: 1px solid #f1f5f9; padding-top: 15px; font-size: 11px; color: #94a3b8;">
            شكراً لثقتك بآدم الأردن &bull; www.adamjo.org
          </div>
        </div>
      `);
    } else {
      // Keep custom body unmodified
    }
  };

  // Trigger real sending of the parsed/composed email via Gmail API
  const handleSendGmailEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    
    if (!recipientEmail.trim()) {
      setApiError('يرجى تحديد عنوان البريد الإلكتروني للمستلم قبل الإرسال.');
      return;
    }
    if (!emailSubject.trim()) {
      setApiError('يرجى تعيين موضوع البريد الإلكتروني للعنوان.');
      return;
    }
    if (!emailBody.trim()) {
      setApiError('يرجى كتابة محتوى البريد الإلكتروني للرسالة.');
      return;
    }

    // Ask for explicit user confirmation as strictly mandated by Task Lifecycle & Security Rules
    const confirmed = window.confirm(`هل أنت متأكد من رغبتك في إرسال هذا البريد الإلكتروني رسمياً عبر بريدك المتصل بـ Gmail إلى: ${recipientEmail}؟`);
    if (!confirmed) return;

    setActionLoading('sending_mail');
    setApiError(null);
    setApiSuccess(null);

    try {
      // 1. Build RAW MIME message
      const rawBody = makeRawEmail(recipientEmail.trim(), emailSubject.trim(), emailBody.trim());

      // 2. Call Gmail message send endpoint
      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw: rawBody }),
        }
      );

      if (!response.ok) {
        const errDetail = await response.json();
        throw new Error(errDetail.error?.message || 'فشل إرسال البريد عبر Gmail API.');
      }

      setApiSuccess(`🎉 تم إرسال البريد الإلكتروني للمستفيد [${recipientEmail}] بنجاح تام وبشكل مباشر من خوادم Google Gmail!`);
      
      // Auto reload inbox after 1 second
      setTimeout(() => {
        fetchRecentMessages();
      }, 1000);
      
      // Clear composer or clean state
      setSelectedRecipientId('');
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'فشل إرسال الرسالة الإلكترونية عبر البريد.');
    } finally {
      setActionLoading(null);
    }
  };

  // Precise Base64url Encoder for MIME Emails
  const makeRawEmail = (to: string, subject: string, bodyText: string) => {
    // Escape string cleanly for Unicode inclusion (Arabic compatibility)
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    
    const str = [
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      bodyText
    ].join('\r\n');

    // Convert MIME string to Base64url format
    const base64 = btoa(unescape(encodeURIComponent(str)));
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  // Pull emails of passengers/drivers on dropdown change
  const handleRecipientSelectionChange = (userId: string) => {
    setSelectedRecipientId(userId);
    const pass = passengers.find(p => p.id === userId);
    const drv = drivers.find(d => d.id === userId);
    
    if (pass) {
      setRecipientEmail(pass.email);
    } else if (drv) {
      setRecipientEmail(drv.email);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl flex flex-col gap-6 text-right font-sans" dir="rtl">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-row-reverse justify-start">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-100">منظومة الربط البريدي Gmail الذكية للرحلات</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">أرسل فواتير الرحلات، تذكيرات الموعد، وتنبيهات الكباتن والركاب المسجلين تلقائياً عبر Gmail.</p>
            </div>
          </div>
        </div>

        {/* CONNECTION STATE PILL */}
        <div className="flex items-center gap-2 flex-row-reverse leading-none">
          {accessToken ? (
            <div className="flex items-center gap-2 flex-row-reverse bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-400 font-extrabold text-[10px] leading-none">
                {connectedEmail ? `متصل: ${connectedEmail}` : 'متصل بالبريد'}
              </span>
              <button 
                type="button" 
                onClick={handleDisconnect}
                className="text-[10px] text-red-400 hover:text-red-300 mr-2 border-r border-slate-750 pr-2 cursor-pointer font-bold"
                title="قطع الاتصال من سحابة Google"
              >
                قطع الاتصال
              </button>
            </div>
          ) : (
            <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full px-3 py-1.5 text-[9px] font-bold">
              🔴 بريد المنظومة غير متصل حالياً
            </span>
          )}
        </div>
      </div>

      {/* ERROR & SUCCESS MESSAGES */}
      {apiError && (
        <div className="bg-rose-955/40 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-xs flex items-center gap-3 flex-row-reverse shadow-inner">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span className="leading-relaxed font-sans">{apiError}</span>
        </div>
      )}
      {apiSuccess && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-xs flex items-center gap-3 flex-row-reverse shadow-inner">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="leading-relaxed font-sans">{apiSuccess}</span>
        </div>
      )}

      {/* NO ACCESS TOKEN - OAUTH CONFIGURATION INTERFACE */}
      {!accessToken && (
        <div className="p-8 bg-slate-950/50 rounded-2xl border border-slate-850 flex flex-col items-center text-center gap-5 justify-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-indigo-500/5 flex items-center justify-center text-indigo-400 border border-indigo-500/10">
            <Key className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100">تحتاج المنظومة إلى تفويض الوصول إلى بريدك Gmail</h4>
            <p className="text-[10.5px] text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
              لتفعيل خدمة إرسال فواتير الرحلات وتنبيهات الركاب المجدولة آلياً عبر Gmail الفعلي، يرجى تهيئة OAuth أو استخدام رمز تشغيل Access Token مسبق الصنع من Playground.
            </p>
          </div>

          {/* OAUTH INTEGRATION FLOW */}
          <div className="w-full flex flex-col gap-3 max-w-sm mt-3 pt-3 border-t border-slate-900">
            <div className="text-right">
              <label className="text-[10px] text-slate-400 font-bold block mb-1">معرف عميل OAuth Client ID (اختياري / إعدادات Google Developer):</label>
              <input 
                type="text"
                value={clientId}
                onChange={(e) => handleSaveClientId(e.target.value)}
                className="w-full px-3 py-2 text-center text-xs bg-slate-900 border border-slate-800 rounded-xl text-indigo-400 focus:outline-none focus:border-indigo-600 font-mono transition"
                placeholder="4185729690054-xxx.apps.googleusercontent.com"
              />
            </div>
            
            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-500 transition-all rounded-xl py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-indigo-900/10 shadow-lg"
            >
              <ExternalLink className="w-4 h-4" />
              <span>الاتصال الآمن مع Google Gmail OAuth 🚀</span>
            </button>
          </div>

          {/* FAST-ACCESS TOKEN (PLAYGROUND BACKUP METHOD) */}
          <form onSubmit={handleManualTokenSubmit} className="w-full max-w-sm mt-4 p-4 rounded-xl bg-slate-900/60 border border-indigo-950/40 text-right flex flex-col gap-2.5">
            <span className="text-[10px] text-indigo-400 font-extrabold flex items-center gap-1.5 flex-row-reverse">
              <Info className="w-3.5 h-3.5 shrink-0" />
              طريقة سريعة: الاتصال المباشر عبر رمز Access Token
            </span>
            <p className="text-[8.5px] text-slate-500 leading-normal">
              هل تواجه قيوداً في إعدادات شاشات Google؟ انسخ رمز الوصول المؤقت من <strong>Google OAuth Playground</strong> وضعه هنا فوراً لبدء المحاكاة الحقيقية!
            </p>
            <div className="flex gap-2">
              <button 
                type="submit"
                className="px-3 bg-indigo-650 text-white font-bold text-xs hover:bg-indigo-550 transition rounded-lg shrink-0 cursor-pointer"
              >
                ربط وحفظ
              </button>
              <input 
                type="password"
                value={customTokenInput}
                onChange={(e) => setCustomTokenInput(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-left text-xs font-mono text-emerald-400 placeholder:text-slate-650 placeholder:text-right placeholder:text-[9.5px]"
                placeholder="ضع رمز ya29.Glxxxxxxx هنا..."
              />
            </div>
          </form>
        </div>
      )}

      {/* CONNECTED EXPERIENCE - ACTIONS WORKSPACE */}
      {accessToken && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* RIGHT PART: OUTBOX & TEMPLATES CAMPAIGN CAMPAIGN (COL-SPA-8) */}
          <div className="lg:col-span-8 bg-slate-950/40 border border-slate-850 p-5 rounded-2xl flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3 flex-row-reverse justify-between">
              <span className="text-xs font-extrabold text-indigo-400 flex items-center gap-2 flex-row-reverse">
                <Send className="w-4 h-4" />
                إنشاء وإرسال حملة بريدية / إشعار رحلة مباشر
              </span>
              <span className="text-[9.5px] text-slate-500 font-mono leading-none">تعبئة ديناميكية ذكية</span>
            </div>

            <form onSubmit={handleSendGmailEmail} className="flex flex-col gap-4">
              
              {/* ROW 1: RECIPIENT SELECT BOX & MANUAL EMAIL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* SELECT REGISTERED PASSENGER/DRIVER */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 font-bold block">1. اختر العضو المستفيد المسجل لملء بياناته:</label>
                  <select 
                    value={selectedRecipientId}
                    onChange={(e) => handleRecipientSelectionChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 font-sans"
                  >
                    <option value="">-- تصفح الركاب والكباتن --</option>
                    <optgroup label="👥 الركاب النشطين بالأردن">
                      {passengers.map(p => (
                        <option key={p.id} value={p.id}>👤 {p.fullName} (راكب / {p.email})</option>
                      ))}
                    </optgroup>
                    <optgroup label="🚕 كباتن الطرقات المسجلين">
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>🚕 الكابتن: {d.fullName} ({d.email})</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* MANUAL RECIPIENT EMAIL */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 font-bold block">أو عبر بريد إلكتروني مباشر للمستلم:</label>
                  <div className="relative">
                    <input 
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 pr-8 text-xs font-mono text-left focus:outline-none focus:border-indigo-600"
                      placeholder="username@domain.com"
                    />
                    <div className="absolute top-2.5 right-2 text-slate-500 pointer-events-none">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

              </div>

              {/* ROW 2: REFERENCE OBJECTS SELECT FOR RIDES OR SCHEDULED TRIPS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/30 p-3.5 rounded-xl border border-slate-900">
                
                {/* MATCH WITH SCHEDULED TRIP */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10.5px] text-indigo-400 font-bold block flex items-center gap-1 flex-row-reverse">
                    <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    ربط مع رحلة مجدولة (Scheduled Trip):
                  </label>
                  <select
                    value={selectedTripId}
                    onChange={(e) => {
                      setSelectedTripId(e.target.value);
                      setEmailTemplate('scheduled_trip');
                    }}
                    className="w-full bg-slate-950 border border-slate-850 text-slate-300 rounded-xl px-3 py-1.5 text-[11px] focus:outline-none"
                  >
                    <option value="">-- اختر رحلة مجدولة للتذكير --</option>
                    {scheduledTrips.map(t => (
                      <option key={t.id} value={t.id}>
                        🗓️ {t.departureTime} | {t.fromArea.split('-').pop()} ➔ {t.toArea.split('-').pop()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* MATCH WITH ACTIVE POOLED RIDES */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10.5px] text-indigo-400 font-bold block flex items-center gap-1 flex-row-reverse">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    ربط مع مشوار تجميعي جاري (Active Ride):
                  </label>
                  <select
                    value={selectedRideId}
                    onChange={(e) => {
                      setSelectedRideId(e.target.value);
                      setEmailTemplate('pooling_info');
                    }}
                    className="w-full bg-slate-950 border border-slate-855 text-slate-300 rounded-xl px-3 py-1.5 text-[11px] focus:outline-none"
                  >
                    <option value="">-- اختر الرحلات النشطة للفوترة/تحديث --</option>
                    {rides.map(r => (
                      <option key={r.id} value={r.id}>
                        🚗 {r.status === 'completed' ? '✓ مكتمل' : '⏳ جاري'} | {r.fromArea.split('-').pop()} ➔ {r.toArea.split('-').pop()} ({r.requests.length} ركاب)
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* ROW 3: CHOOSE TEMPLATE & SUBJECT */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col md:flex-row gap-3">
                  
                  {/* SELECT TEMPLATE PRESET */}
                  <div className="w-full md:w-1/3 flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold block">2. قالب البريد التلقائي:</label>
                    <select
                      value={emailTemplate}
                      onChange={(e) => setEmailTemplate(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs font-sans focus:outline-none focus:border-indigo-600"
                    >
                      <option value="pooling_info">🚗 معلومات وتحديث رحلتك الجارية (Pooling Info)</option>
                      <option value="scheduled_trip">⏰ تذكير بموعد الرحلة المجدولة (Trip Reminder)</option>
                      <option value="invoice">🧾 فاتورة وكشف عمولة الرحلة (Completed Invoice)</option>
                      <option value="custom">✍️ بريد مخصص فارغ (Custom Plain Email)</option>
                    </select>
                  </div>

                  {/* SUBJECT INPUT */}
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold block">موضوع الرسالة (Subject Line):</label>
                    <input 
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
                      placeholder="موضوع الرسالة الإلكترونية..."
                    />
                  </div>

                </div>

                {/* TEMPLATE PARAMETERS PREVIEW CHIPS */}
                <div className="flex flex-wrap gap-2 items-center text-[9px] text-slate-500 bg-slate-950/40 p-2.5 rounded-lg">
                  <span className="font-extrabold text-slate-400">🏷️ المتغيرات الآلية المضافة للقالب:</span>
                  <span className="bg-indigo-950/50 border border-indigo-900/30 text-indigo-400 font-mono px-1.5 py-0.5 rounded">{"{{NAME}}"} = {targetName}</span>
                  <span className="bg-indigo-950/50 border border-indigo-900/30 text-indigo-400 font-mono px-1.5 py-0.5 rounded">{"{{PHONE}}"} = {targetPhone}</span>
                </div>

              </div>

              {/* EMAIL BODY EDITOR (HTML CONTAINER) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold block">محتوى البريد وتصميم الرسالة (HTML/PlainText Editor):</label>
                <textarea 
                  rows={10}
                  value={emailBody}
                  onChange={(e) => {
                    setEmailBody(e.target.value);
                    if (emailTemplate !== 'custom') {
                      setEmailTemplate('custom');
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-2xl p-4 text-xs font-mono text-left focus:outline-none focus:border-indigo-600 leading-relaxed max-h-[300px]"
                  placeholder="<h2>اكتب محتوى الرسالة هنا...</h2>"
                />
              </div>

              {/* ACTION SEND BUTTON */}
              <div className="border-t border-slate-900 pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={actionLoading === 'sending_mail'}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-505 text-white flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-900/10 disabled:opacity-40 cursor-pointer"
                >
                  {actionLoading === 'sending_mail' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>جاري إرسال البريد عبر Gmail...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-white" />
                      <span>إرسال البريد الإلكتروني الفعلي الآن عبر Gmail 🚀</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* LEFT PART: GMAIL CAMPAIGN ARCHIVE / INBOX (COL-SPAN-4) */}
          <div className="lg:col-span-4 bg-slate-950/40 border border-slate-850 p-5 rounded-2xl flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <button 
                type="button" 
                onClick={fetchRecentMessages}
                disabled={loading}
                className="text-slate-400 hover:text-white transition-all text-xs font-sans cursor-pointer flex items-center gap-1 flex-row-reverse"
                title="تحديث قائمة الرسائل"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
                <span>تحديث صندوق الوارد</span>
              </button>
              <span className="text-xs font-extrabold text-indigo-400 flex items-center gap-1.5 flex-row-reverse pb-0.5">
                <Inbox className="w-4 h-4 text-indigo-400" />
                آخر مراسلات ADAM
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-[10px] text-slate-500 font-sans italic">جاري مراجعة البريد الإلكتروني...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16 text-slate-600 text-[10.5px] italic leading-relaxed font-sans">
                📨 لم يتم رصد أي استفسارات أو فواتير بريدية مرسلة لـ "ADAM" حالياً.<br />
                <span className="text-[8.5px] mt-1.5 block text-slate-500">أرسل فاتورتك الأولى لتظهر في الأرشيف المباشر هنا!</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[450px] overflow-y-auto pr-1">
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-850 hover:bg-slate-900 transition text-right flex flex-col gap-1.5 relative group"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[8px] text-slate-500 font-mono shrink-0">
                        {msg.date ? new Date(msg.date).toLocaleDateString('ar-JO', { month: 'short', day: 'numeric' }) : ''}
                      </span>
                      <span className="text-[10.5px] font-extrabold text-slate-250 leading-tight block truncate ml-1 font-sans">
                        {msg.subject}
                      </span>
                    </div>

                    <div className="text-[9px] text-indigo-400 font-sans flex flex-col gap-0.2">
                      <span className="truncate">المرسل: {msg.from}</span>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-normal line-clamp-2 pr-0.5 font-sans mt-1">
                      {msg.snippet}
                    </p>

                    <div className="pt-2 border-t border-slate-900/50 flex justify-between items-center text-[9px]">
                      <a 
                        href={`https://mail.google.com/mail/u/0/#inbox/${msg.id}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold font-sans cursor-pointer hover:underline"
                      >
                        📂 فتح في Gmail
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <span className="text-[8px] text-slate-600 font-mono">ID: {msg.id.substring(0, 8)}...</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 text-right">
              <span className="text-[9.5px] text-indigo-400 font-black flex items-center gap-1.5 flex-row-reverse mb-1">
                <FileCheck className="w-3.5 h-3.5 shrink-0" />
                تحسس البريد الوارد الذكي
              </span>
              <p className="text-[8.5px] text-slate-500 leading-relaxed font-sans">
                يعمل الفهرس التلقائي بالبحث في صندوق بريدك عن الرسائل التي تحمل الكلمات المفتاحية لمشاوير آدم لتسهيل الأرشفة وحفظ حقوق الكباتن بشكل مركزي.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* FOOTER GENERAL SECURITY ADVISE */}
      <div className="text-center border-t border-slate-850 pt-4 flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-500 gap-2">
        <span className="font-sans">&copy; ٢٠٢٦ منظومة آدم التشاركية الذكية للمملكة الأردنية الهاشمية - كود بريدي معتمد</span>
        <span className="bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-[9px] font-medium text-slate-400">
          🔒 حماية البيانات: تتم كافة العمليات والوصول لـ Gmail محلياً من متصفح العميل الخاص بك دون تخزين أو تمرير أي كلمات سرية.
        </span>
      </div>

    </div>
  );
}
