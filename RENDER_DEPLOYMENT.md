# دليل رفع ونشر منظومة آدم على منصة Render (Render.com Deployment Guide)

تم إعداد المشروع بالكامل ليعمل بسلاسة وتوافق تام مع منصة **Render** السحابية.

---

## ⚡ الطريقة الأولى: الرفع التلقائي عبر Blueprint (بنقرة واحدة - One Click)

يدعم المشروع ملف الإعداد التلقائي `render.yaml` المرفق مع الكود:

1. ادخل إلى لوحة تحكم **[Render Dashboard](https://dashboard.render.com)**.
2. اضغط على زر **New +** ثم اختر **Blueprint**.
3. اربط مستودع GitHub الخاص بالمشروع (`adam-transport-platform` أو `adam-admin-backend-portal`).
4. سيتعرف Render تلقائياً على ملف `render.yaml` ويقوم بإنشاء الخدمة وضبط أوامر البناء والتشغيل فوراً.
5. أضف مفتاح `GEMINI_API_KEY` في قسم **Environment Variables**.
6. اضغط **Apply** وسيبدأ السيرفر بالعمل مباشرة!

---

## 🛠️ الطريقة الثانية: الرفع اليدوي كخدمة ويب (Web Service)

إذا أردت إنشاء الخدمة يدوياً:

1. في لوحة تحكم Render، اضغط على **New +** ثم اختر **Web Service**.
2. اختر مستودع المشروع من حسابك على GitHub.
3. قم بتعبئة الإعدادات التالية:
   - **Name**: `adam-platform`
   - **Language / Runtime**: `Node`
   - **Branch**: `main`
   - **Build Command**: 
     ```bash
     npm install && npm run build
     ```
   - **Start Command**: 
     ```bash
     npm start
     ```
   - **Plan**: `Free` (أو أي خطة مدفوعة حسب رغبتك).

4. **إعدادات المسار الصحي (Health Check Path)**:
   - افتح **Advanced Settings**.
   - في خانة **Health Check Path** ضع: `/api/health` أو `/api/v1/ping`.

5. **المتغيرات البيئية (Environment Variables)**:
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: مفتاح الـ API الخاص بـ Google Gemini (من Google AI Studio).

6. اضغط **Create Web Service**.

---

## 🌐 الروابط ونقاط النهاية بعد النشر على Render

بمجرد اكتمال النشر، ستحصل على رابط فرعي آمن (مثال: `https://adam-platform.onrender.com`):

- **الواجهة الرئيسية**: `https://your-app.onrender.com/`
- **تطبيق الراكب**: `https://your-app.onrender.com/passenger`
- **تطبيق الكابتن**: `https://your-app.onrender.com/driver`
- **لوحة الإدارة و الـ CRM**: `https://your-app.onrender.com/admin`
- **فحص صحة السيرفر**: `https://your-app.onrender.com/api/health`
- **البث اللحظي للخرائط والرحلات**: `wss://your-app.onrender.com/ws/realtime`
- **مزامنة قواعد البيانات**: `https://your-app.onrender.com/api/v1/app-state`

---

## 🔄 إعادة تصدير الحزم المنفصلة
لتحديث مجلدات الحزم المنفصلة الثلاث للراكب والكابتن والإدارة:
```bash
npm run export:packages
```
