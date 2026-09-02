# 🚀 دليل تشغيل ونشر وتفريغ منظومة آدم الذكية للنقل (Adam Smart Mobility)
## حزم المنظومة الثلاث المترابطة (Web Portal CRM + Captain App + Passenger App)

تتكون المنظومة من **3 ملفات وحزم رئيسية مترابطة بشكل كامل وفوري** عبر:
* **Firebase Firestore**: المزامنة اللحظية للبيانات، مواقع المركبات، حالة الرادار، والمحافظ.
* **Gemini AI (Artificial Intelligence)**: المساعد الصوتي، الترجمة التلقائية، التحليل الذكي للتقييمات، وتوزيع الطلبات الجغرافية.
* **REST & WebSocket APIs**: خادم Backend موحد يربط الـ 3 تطبيقات ببعضها عبر الإنترنت في كافة المتصفحات وأنظمة التشغيل (Android و iOS و Web).

---

## 📁 تفصيل الحزم والملفات الثلاثة (The 3 Interconnected Artifacts):

### 1️⃣ لوحة التحكم + الداشبورد (صفحة إلكترونية ويب - Web Portal CRM & Operations Dashboard)
* **المسار ونقطة الدخول**: `/admin.html` أو `/admin` أو `/?view=admin`
* **طبيعة العمل**: صفحة ويب إلكترونية متطورة مخصصة للإدارة والعمليات المركزية.
* **التوافق**: تعمل بسلاسة فائقة وسرعة على كافة المتصفحات (Google Chrome, Safari, Apple WebKit, Mozilla Firefox, Microsoft Edge) وعلى الشاشات الكبيرة وأجهزة التابلت والكمبيوتر.
* **الميزات**:
  - تدقيق وثائق ورخص وهوية الكباتن مع التحليل الذكي بالذكاء الاصطناعي.
  - شحن وتعديل أرصدة المحافظ وإصدار كشوفات الحسابات.
  - خريطة الرادار المباشر وتتبع المركبات والرحلات الجارية.
  - محمي بنظام أمان وتسجيل دخول فيدرالي موثوق (RBAC).

---

### 2️⃣ تطبيق الكابتن (Captain / Driver App - Android & iOS Stores)
* **المسار ونقطة الدخول**: `/driver.html` أو `/driver` أو `/?view=driver`
* **طبيعة العمل**: تطبيق هاتف ذكي مستقل تماماً موجه للسائقين، مجهز للرفع على **Google Play** و **Apple App Store**.
* **ملف التكوين الأصلي**: `capacitor.config.driver.json` و `public/manifest-driver.json`
* **معرف الحزمة (App ID)**: `com.adamride.driver`
* **الميزات**:
  - استقبال طلبات الركاب الفورية والتشاركية عبر رادار الخريطة.
  - تشغيل العداد الإلكتروني التلقائي لحساب المسافة والتعرفة.
  - واجهة رفع الوثائق والهوية ورخصة القيادة للتدقيق.
  - أوامر المساعد الصوتي بالذكاء الاصطناعي أثناء القيادة الآمنة.
  - خالٍ تماماً من أي روابط أو أزرار تؤدي للداشبورد الإداري وفقاً للضوابط الصارمة.

---

### 3️⃣ تطبيق الراكب (Passenger App - Android & iOS Stores)
* **المسار ونقطة الدخول**: `/passenger.html` أو `/passenger` أو `/?view=passenger`
* **طبيعة العمل**: تطبيق هاتف ذكي مستقل تماماً موجه لعموم الركاب، مجهز للرفع على **Google Play** و **Apple App Store**.
* **ملف التكوين الأصلي**: `capacitor.config.passenger.json` و `public/manifest-passenger.json`
* **معرف الحزمة (App ID)**: `com.adamride.passenger`
* **الميزات**:
  - طلب مشاوير التوصيل الفوري ومسارات التجميع التشاركي (حتى 4 ركاب).
  - حجز رحلات المطار المجدولة ورحلات المحافظات.
  - محفظة إلكترونية ذكية، شحن رصيد، كوبونات خصم، والدفع كاش أو رصيد.
  - تقييم الكباتن والمحادثة الفورية المباشرة وتتبع خط سير الكابتن خطوة بخطوة.
  - خالٍ تماماً من أي روابط أو أزرار تؤدي للداشبورد الإداري.

---

## 🛠️ خطوات بناء ورفع التطبيقات على المتاجر (Build & Deploy Instructions)

### 📲 أولاً: بناء حزمة تطبيق الراكب (Passenger App for Stores)
```bash
# 1. تثبيت الحزم وبناء ملفات التطبيق
npm run build

# 2. نسخ إعدادات حزمة الراكب
cp capacitor.config.passenger.json capacitor.config.json

# 3. مزامنة أندرويد و iOS
npx cap sync android
npx cap sync ios

# 4. فتح مشروع Android Studio لإنشاء ملف APK / AAB لـ Google Play
npx cap open android

# 5. فتح مشروع Xcode لإنشاء ملف IPA لـ Apple App Store / TestFlight
npx cap open ios
```

### 🚕 ثانياً: بناء حزمة تطبيق الكابتن (Captain App for Stores)
```bash
# 1. تثبيت الحزم وبناء ملفات التطبيق
npm run build

# 2. نسخ إعدادات حزمة الكابتن
cp capacitor.config.driver.json capacitor.config.json

# 3. مزامنة أندرويد و iOS
npx cap sync android
npx cap sync ios

# 4. فتح مشروع Android Studio لإنشاء ملف APK / AAB لـ Google Play
npx cap open android

# 5. فتح مشروع Xcode لإنشاء ملف IPA لـ Apple App Store / TestFlight
npx cap open ios
```

### 🌐 ثالثاً: استضافة لوحة التحكم والداشبورد على الويب
* يمكن نشر المشروع على أي خادم ويب (Cloud Run, Vercel, Firebase Hosting, VPS Nginx).
* يتم توجيه إدارة العمليات عبر الرابط المباشر: `https://your-domain.com/admin.html`
* يتم تسجيل الدخول ببيانات الإدارة المحمية.

---

## 🔗 الترابط اللحظي (Real-Time Interconnection):
* عند قيام الراكب بطلب رحلة في **تطبيق الراكب**، تظهر فوراً على رادار **تطبيق الكابتن** مع إشعار صوتي، ويتم تسجيل وتتبع مسار الرحلة مباشرة في **لوحة التحكم والداشبورد**.
* عند تقييم الكابتن أو إنهاء الرحلة، تتحدث المحفظة ونقاط الولاء فوراً في جميع الأطراف عبر Firebase Firestore والـ Backend API.
