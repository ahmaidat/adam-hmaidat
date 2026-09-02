# لوحة تحكم وعمليات آدم المركزية + السيرفر السحابي (Adam Admin Portal & Cloud Backend)
> Central Cloud Run & Node.js Express server, Real-Time WebSockets, RBAC Admin CRM, and AI Dispatcher API.

## 🚀 التشغيل المباشر (Quick Start)
```bash
# تثبيت التبعيات
npm install

# التشغيل في وضع التطوير المحلي
npm run dev

# بناء حزمة الإنتاج
npm run build
```



## 🔗 الربط والتزامن مع السيرفر والـ API
يتصل التطبيق مباشرة بنقاط النهاية المركزية وقنوات الـ Real-Time WebSocket عبر الباكيند الموحد:
- `/api/v1/app-state`: مزامنة البيانات وحالة النظام.
- `/ws/realtime`: البث المباشر للإحداثيات وتتبع المركبات والرحلات التشاركية.
