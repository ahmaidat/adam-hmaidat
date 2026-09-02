# تطبيق آدم الكابتن (Adam Captain App)
> Standalone Driver & Captain Application for Google Play and App Store with GPS tracking, wallet ledger, and smart dispatcher.

## 🚀 التشغيل المباشر (Quick Start)
```bash
# تثبيت التبعيات
npm install

# التشغيل في وضع التطوير المحلي
npm run dev

# بناء حزمة الإنتاج
npm run build
```


## 📱 تحويل ونشر التطبيق على Google Play و App Store
```bash
# مزامنة ملفات الويب مع بيئة الأندرويد والآيفون
npm run build
npx cap sync

# فتح المشروع في Android Studio لتوليد حزمة AAB
npx cap open android

# فتح المشروع في Xcode لتوليد حزمة IPA
npx cap open ios
```


## 🔗 الربط والتزامن مع السيرفر والـ API
يتصل التطبيق مباشرة بنقاط النهاية المركزية وقنوات الـ Real-Time WebSocket عبر الباكيند الموحد:
- `/api/v1/app-state`: مزامنة البيانات وحالة النظام.
- `/ws/realtime`: البث المباشر للإحداثيات وتتبع المركبات والرحلات التشاركية.
