import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Layers, 
  Network, 
  Table, 
  FileCode, 
  Code, 
  Copy, 
  Check, 
  Search, 
  Filter, 
  Sparkles, 
  RefreshCw, 
  Download, 
  Key, 
  Link as LinkIcon, 
  Server, 
  ShieldCheck, 
  Cpu, 
  List, 
  ArrowRight, 
  Eye, 
  Zap, 
  CheckCircle2,
  Share2,
  HardDrive
} from 'lucide-react';
import { useAppState } from '../stateEngine';

interface FieldDef {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  fkTarget?: string;
  required?: boolean;
  description: string;
  enum?: string[];
}

interface EntityDef {
  id: string;
  name: string;
  nameAr: string;
  category: 'users' | 'trips' | 'finance' | 'admin' | 'system';
  color: string;
  icon: string;
  description: string;
  firestoreCollection: string;
  fields: FieldDef[];
}

const ENTITIES_SCHEMA: EntityDef[] = [
  {
    id: 'Driver',
    name: 'Driver',
    nameAr: 'جدول الكباتن والسائقين',
    category: 'users',
    color: 'from-amber-500 to-yellow-600',
    icon: '🚘',
    description: 'بيانات الكابتن، المستندات، نوع السيارة، الموقع ورصيد المحفظة',
    firestoreCollection: '/drivers',
    fields: [
      { name: 'id', type: 'VARCHAR(64)', isPk: true, required: true, description: 'معرف الكابتن الفريد (UUID)' },
      { name: 'username', type: 'VARCHAR(50)', required: true, description: 'اسم المستخدم لتسجيل الدخول' },
      { name: 'fullName', type: 'VARCHAR(100)', required: true, description: 'الاسم الكامل للكابتن' },
      { name: 'phone', type: 'VARCHAR(20)', required: true, description: 'رقم الهاتف الخلوي' },
      { name: 'email', type: 'VARCHAR(100)', required: false, description: 'البريد الإلكتروني' },
      { name: 'carType', type: 'VARCHAR(50)', required: true, description: 'نوع وطراز السيارة' },
      { name: 'carClass', type: 'VARCHAR(50)', required: true, description: 'فئة السيارة (تكسي / خاص / سفريات)' },
      { name: 'carPlate', type: 'VARCHAR(30)', required: true, description: 'رقم اللوحة المرورية' },
      { name: 'carModel', type: 'INTEGER', required: true, description: 'سنة الصنع (مثلاً 2023)' },
      { name: 'governorate', type: 'VARCHAR(100)', required: true, description: 'المحافظة الرئيسية للنقل' },
      { name: 'district', type: 'VARCHAR(100)', required: true, description: 'اللواء / المنطقة' },
      { name: 'status', type: 'ENUM', required: true, enum: ['pending', 'approved', 'blocked'], description: 'حالة اعتماد الحساب الإدارية' },
      { name: 'isOnline', type: 'BOOLEAN', required: true, description: 'حالة الاتصال والجاهزية لاستقبال الطلبات' },
      { name: 'balance', type: 'DECIMAL(10,3)', required: true, description: 'رصيد المحفظة بالدينار الأردني' },
      { name: 'ratingAverage', type: 'DECIMAL(3,2)', required: true, description: 'متوسط تقييمات الركاب' },
      { name: 'tripsCount', type: 'INTEGER', required: true, description: 'إجمالي عدد الرحلات المنجزة' },
      { name: 'activeRideId', type: 'VARCHAR(64)', isFk: true, fkTarget: 'PooledRide.id', description: 'معرف الرحلة النشطة الحالية' },
      { name: 'workScope', type: 'ENUM', required: false, enum: ['local', 'intercity', 'both'], description: 'نطاق العمل (محلي / بين المحافظات / كلاهما)' }
    ]
  },
  {
    id: 'Passenger',
    name: 'Passenger',
    nameAr: 'جدول الركاب والمستخدمين',
    category: 'users',
    color: 'from-emerald-500 to-teal-600',
    icon: '👤',
    description: 'حسابات الركاب، العناوين المفضلة، وسائط الدفع ورصيد المحفظة',
    firestoreCollection: '/passengers',
    fields: [
      { name: 'id', type: 'VARCHAR(64)', isPk: true, required: true, description: 'معرف الراكب الفريد (UUID)' },
      { name: 'username', type: 'VARCHAR(50)', required: true, description: 'اسم المستخدم لتسجيل الدخول' },
      { name: 'fullName', type: 'VARCHAR(100)', required: true, description: 'الاسم الكامل للراكب' },
      { name: 'phone', type: 'VARCHAR(20)', required: true, description: 'رقم الهاتف الخلوي' },
      { name: 'email', type: 'VARCHAR(100)', required: false, description: 'البريد الإلكتروني' },
      { name: 'status', type: 'ENUM', required: true, enum: ['pending', 'approved', 'blocked'], description: 'حالة الحساب الإدارية' },
      { name: 'balance', type: 'DECIMAL(10,3)', required: true, description: 'رصيد المحفظة بالدينار الأردني' },
      { name: 'ratingAverage', type: 'DECIMAL(3,2)', required: true, description: 'متوسط تقييم الكابتن للراكب' },
      { name: 'tripsCount', type: 'INTEGER', required: true, description: 'إجمالي الرحلات المحجوزة' },
      { name: 'activeRideId', type: 'VARCHAR(64)', isFk: true, fkTarget: 'RideRequest.id', description: 'معرف طلب الرحلة النشط حالياً' }
    ]
  },
  {
    id: 'RideRequest',
    name: 'RideRequest',
    nameAr: 'جدول طلبات الرحلات (بين المحافظات)',
    category: 'trips',
    color: 'from-cyan-500 to-blue-600',
    icon: '📍',
    description: 'طلبات الانطلاق المحجوزة من قبل الركاب للتجميع أو الحجز المباشر',
    firestoreCollection: '/rideRequests',
    fields: [
      { name: 'id', type: 'VARCHAR(64)', isPk: true, required: true, description: 'معرف الطلب الفريد' },
      { name: 'passengerId', type: 'VARCHAR(64)', isFk: true, fkTarget: 'Passenger.id', required: true, description: 'معرف الراكب صاحب الطلب' },
      { name: 'passengerName', type: 'VARCHAR(100)', required: true, description: 'اسم الراكب للتواصل' },
      { name: 'passengerPhone', type: 'VARCHAR(20)', required: true, description: 'رقم هاتف الراكب' },
      { name: 'fromArea', type: 'VARCHAR(200)', required: true, description: 'منطقة ومحافظة الانطلاق' },
      { name: 'toArea', type: 'VARCHAR(200)', required: true, description: 'منطقة ومحافظة الوصول' },
      { name: 'seatsCount', type: 'INTEGER', required: true, description: 'عدد المقاعد المحجوزة (1 - 4)' },
      { name: 'status', type: 'ENUM', required: true, enum: ['pending', 'pooling', 'offered', 'accepted', 'started', 'completed', 'cancelled'], description: 'حالة الطلب التشغيلية' },
      { name: 'rideId', type: 'VARCHAR(64)', isFk: true, fkTarget: 'PooledRide.id', description: 'معرف الرحلة المجمعة المقترنة بها' },
      { name: 'appliedPromo', type: 'VARCHAR(50)', required: false, description: 'كود التخفيض أو الخصم المستعمل' },
      { name: 'discountAmount', type: 'DECIMAL(10,3)', required: false, description: 'قيمة خصم العرض بالدينار الأردني' }
    ]
  },
  {
    id: 'PooledRide',
    name: 'PooledRide',
    nameAr: 'جدول الرحلات المجمعة (Smart Pooling)',
    category: 'trips',
    color: 'from-indigo-500 to-purple-600',
    icon: '🚌',
    description: 'مجموعة طلبات ركاب مدمجة في مركبة كابتن واحدة بين المدن والمحافظات',
    firestoreCollection: '/pooledRides',
    fields: [
      { name: 'id', type: 'VARCHAR(64)', isPk: true, required: true, description: 'معرف الرحلة المجمعة' },
      { name: 'driverId', type: 'VARCHAR(64)', isFk: true, fkTarget: 'Driver.id', description: 'معرف الكابتن منفذ الرحلة' },
      { name: 'fromArea', type: 'VARCHAR(200)', required: true, description: 'خط السير: نقطة البداية' },
      { name: 'toArea', type: 'VARCHAR(200)', required: true, description: 'خط السير: الوجهة النهائية' },
      { name: 'status', type: 'ENUM', required: true, enum: ['pooling', 'offered', 'accepted', 'started', 'completed'], description: 'الحالة الحالية للرحلة المجمعة' },
      { name: 'startTime', type: 'TIMESTAMP', description: 'توقيت بدء تحرك الرحلة' },
      { name: 'endTime', type: 'TIMESTAMP', description: 'توقيت اكتمال وصول الرحلة' },
      { name: 'commissionCharged', type: 'DECIMAL(10,3)', required: true, description: 'إجمالي اقتطاع عمولة الشركة' }
    ]
  },
  {
    id: 'IntraCityRide',
    name: 'IntraCityRide',
    nameAr: 'جدول الرحلات الداخلية (Uber-style Direct Taxi)',
    category: 'trips',
    color: 'from-orange-500 to-amber-600',
    icon: '🚕',
    description: 'رحلات التاكسي المباشرة داخل المحافظة بحساب المسافة والعداد الذكي',
    firestoreCollection: '/intraCityRides',
    fields: [
      { name: 'id', type: 'VARCHAR(64)', isPk: true, required: true, description: 'معرف الرحلة الداخلية' },
      { name: 'passengerId', type: 'VARCHAR(64)', isFk: true, fkTarget: 'Passenger.id', required: true, description: 'معرف الراكب' },
      { name: 'driverId', type: 'VARCHAR(64)', isFk: true, fkTarget: 'Driver.id', description: 'معرف الكابتن الموجه له الطلب' },
      { name: 'pickupName', type: 'VARCHAR(200)', required: true, description: 'اسم نقطة الركوب والتحميل' },
      { name: 'dropoffName', type: 'VARCHAR(200)', required: true, description: 'اسم نقطة التنزيل والوصول' },
      { name: 'distanceKm', type: 'DECIMAL(6,2)', required: true, description: 'المسافة المحسوبة بالكم' },
      { name: 'durationMin', type: 'INTEGER', required: true, description: 'الوقت المتوقع بالدقائق' },
      { name: 'price', type: 'DECIMAL(10,3)', required: true, description: 'أجرة الرحلة الإجمالية بالدينار' },
      { name: 'commission', type: 'DECIMAL(10,3)', required: true, description: 'عمولة تطبيق الشركة' },
      { name: 'paymentMethod', type: 'ENUM', required: true, enum: ['cash', 'wallet'], description: 'وسيلة الدفع (نقدي / محفظة)' },
      { name: 'status', type: 'ENUM', required: true, enum: ['pending', 'accepted', 'started', 'completed', 'cancelled'], description: 'حالة طلب التاكسي المباشر' }
    ]
  },
  {
    id: 'ScheduledTrip',
    name: 'ScheduledTrip',
    nameAr: 'جدول الرحلات المجدولة واليومية (Daily Fixed Trips)',
    category: 'trips',
    color: 'from-violet-500 to-fuchsia-600',
    icon: '📅',
    description: 'جدول مواعيد الرحلات الثابتة والمجدولة مع إمكانية التثبيت اليومي الآلي',
    firestoreCollection: '/scheduledTrips',
    fields: [
      { name: 'id', type: 'VARCHAR(64)', isPk: true, required: true, description: 'معرف الموعد الفريد' },
      { name: 'creatorId', type: 'VARCHAR(64)', required: true, description: 'معرف المنشئ (كابتن أو راكب أو إدارة)' },
      { name: 'creatorType', type: 'ENUM', required: true, enum: ['driver', 'passenger', 'admin'], description: 'نوع الحساب منشئ الرحلة' },
      { name: 'fromArea', type: 'VARCHAR(200)', required: true, description: 'مكان الانطلاق المعتمد' },
      { name: 'toArea', type: 'VARCHAR(200)', required: true, description: 'مكان الوصول المعتمد' },
      { name: 'departureTime', type: 'VARCHAR(30)', required: true, description: 'تاريخ وساعة السفر (YYYY-MM-DD HH:MM)' },
      { name: 'seatsCount', type: 'INTEGER', required: true, description: 'إجمالي المقاعد الشاغرة المتاحة' },
      { name: 'availableSeats', type: 'INTEGER', required: true, description: 'المقاعد المتبقية للحجز' },
      { name: 'status', type: 'ENUM', required: true, enum: ['pending', 'accepted', 'completed', 'cancelled'], description: 'حالة الحجز الجدولي' },
      { name: 'driverId', type: 'VARCHAR(64)', isFk: true, fkTarget: 'Driver.id', description: 'معرف الكابتن المعين للموعد' },
      { name: 'isPinnedDaily', type: 'BOOLEAN', required: false, description: 'رحلة ثابتة يومياً وتتكرر تلقائياً' },
      { name: 'aiGenerated', type: 'BOOLEAN', required: false, description: 'مولدة بواسطة الذكاء الاصطناعي الذكي' }
    ]
  },
  {
    id: 'WalletTransaction',
    name: 'WalletTransaction',
    nameAr: 'جدول المعاملات المالية والسجل الحسابي',
    category: 'finance',
    color: 'from-emerald-600 to-green-700',
    icon: '💰',
    description: 'سجل إيداعات الحسابات، السحوبات، اقتطاع العمولات ودفع الأجور',
    firestoreCollection: '/walletTransactions',
    fields: [
      { name: 'id', type: 'VARCHAR(64)', isPk: true, required: true, description: 'معرف السند الحسابي الفريد' },
      { name: 'userId', type: 'VARCHAR(64)', isFk: true, fkTarget: 'Driver.id / Passenger.id', required: true, description: 'معرف المستخدم صاحب الحساب' },
      { name: 'userType', type: 'ENUM', required: true, enum: ['driver', 'passenger'], description: 'نوع صاحب الحساب' },
      { name: 'type', type: 'ENUM', required: true, enum: ['deposit', 'withdraw', 'fare_payment', 'commission_deduction', 'cancel_fee'], description: 'طبيعة الحركة المالية' },
      { name: 'amount', type: 'DECIMAL(10,3)', required: true, description: 'المبلغ المالي بالدينار الأردني' },
      { name: 'paymentMethod', type: 'ENUM', required: false, enum: ['wallet', 'cliq', 'bank', 'cash'], description: 'قناة التحصيل والتغذية المالية' },
      { name: 'status', type: 'ENUM', required: true, enum: ['completed', 'pending', 'failed'], description: 'حالة الاعتماد المالي للسند' },
      { name: 'timestamp', type: 'TIMESTAMP', required: true, description: 'تاريخ وساعة القيد المالي' }
    ]
  },
  {
    id: 'ChatMessage',
    name: 'ChatMessage',
    nameAr: 'جدول المحادثات الفورية والدردشة',
    category: 'system',
    color: 'from-blue-500 to-indigo-600',
    icon: '💬',
    description: 'رسائل التواصل بين الركاب والكباتن وغرفة عمليات الدعم الإداري',
    firestoreCollection: '/chatMessages',
    fields: [
      { name: 'id', type: 'VARCHAR(64)', isPk: true, required: true, description: 'معرف الرسالة' },
      { name: 'rideId', type: 'VARCHAR(64)', isFk: true, fkTarget: 'PooledRide.id / IntraCityRide.id', required: true, description: 'معرف الرحلة المرتبطة بالرسالة' },
      { name: 'sender', type: 'ENUM', required: true, enum: ['admin', 'driver', 'passenger'], description: 'جهة إرسال الرسالة' },
      { name: 'senderId', type: 'VARCHAR(64)', required: true, description: 'معرف مرسل الرسالة' },
      { name: 'senderName', type: 'VARCHAR(100)', required: true, description: 'اسم المرسل الظاهر' },
      { name: 'message', type: 'TEXT', required: true, description: 'نص الرسالة المكتوبة' },
      { name: 'timestamp', type: 'TIMESTAMP', required: true, description: 'توقيت الإرسال' }
    ]
  },
  {
    id: 'Employee',
    name: 'Employee',
    nameAr: 'جدول الموظفين وصلاحيات RBAC',
    category: 'admin',
    color: 'from-rose-500 to-pink-600',
    icon: '👮‍♂️',
    description: 'حسابات الموظفين، فئات الأدوار، وصلاحيات التحكم البرمجية',
    firestoreCollection: '/employees',
    fields: [
      { name: 'id', type: 'VARCHAR(64)', isPk: true, required: true, description: 'معرف الموظف' },
      { name: 'fullName', type: 'VARCHAR(100)', required: true, description: 'اسم الموظف الكامل' },
      { name: 'username', type: 'VARCHAR(50)', required: true, description: 'اسم دخول النظام' },
      { name: 'roleCategory', type: 'ENUM', required: true, enum: ['Admin', 'Moderator', 'Support'], description: 'تصنيف الموظف في الإدارة' },
      { name: 'status', type: 'ENUM', required: true, enum: ['active', 'inactive', 'on_break'], description: 'حالة الدوام الحالية' },
      { name: 'lastActiveTask', type: 'VARCHAR(200)', description: 'أخر مهمة أو إجراء قام به الموظف' },
      { name: 'permissions', type: 'JSONB', description: 'مصفوفة الصلاحيات التفصيلية (RBAC Matrix)' }
    ]
  },
  {
    id: 'SystemOffer',
    name: 'SystemOffer',
    nameAr: 'جدول العروض والأكواد الترويجية',
    category: 'admin',
    color: 'from-purple-500 to-pink-600',
    icon: '🏷️',
    description: 'أكواد الخصم والحوافز للركاب والكباتن المعتمدة من الإدارة',
    firestoreCollection: '/systemOffers',
    fields: [
      { name: 'id', type: 'VARCHAR(64)', isPk: true, required: true, description: 'معرف العرض' },
      { name: 'code', type: 'VARCHAR(50)', required: true, description: 'كود التخفيض (مثل ADAM20)' },
      { name: 'title', type: 'VARCHAR(100)', required: true, description: 'عنوان أو اسم الحملة الترويجية' },
      { name: 'targetType', type: 'ENUM', required: true, enum: ['passenger', 'driver'], description: 'الفئة المستهدفة بالخصم' },
      { name: 'discountType', type: 'ENUM', required: true, enum: ['percentage', 'fixed'], description: 'نوع الخصم (نسبة مئوية / مبلغ ثابت)' },
      { name: 'value', type: 'DECIMAL(10,2)', required: true, description: 'قيمة الخصم أو البونص' },
      { name: 'isActive', type: 'BOOLEAN', required: true, description: 'حالة تفعيل الكود للجمهور' },
      { name: 'usageCount', type: 'INTEGER', required: true, description: 'عدد مرات الاستخدام المسجلة' }
    ]
  }
];

export const ErDiagramStudio: React.FC = () => {
  const { drivers, passengers, rides, scheduledTrips } = useAppState();
  const [selectedEntityId, setSelectedEntityId] = useState<string>('Driver');
  const [activeTab, setActiveTab] = useState<'er_graph' | 'data_dictionary' | 'sql_export' | 'json_blueprint'>('er_graph');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Active records counts for metrics dashboard
  const activeCounts = useMemo(() => {
    return {
      Driver: drivers?.length || 0,
      Passenger: passengers?.length || 0,
      RideRequest: passengers?.filter(p => p.activeRideId)?.length || 0,
      PooledRide: rides?.length || 0,
      IntraCityRide: rides?.length || 0,
      ScheduledTrip: scheduledTrips?.length || 0,
      WalletTransaction: (drivers?.length || 0) + (passengers?.length || 0),
      ChatMessage: 12,
      Employee: 4,
      SystemOffer: 3
    };
  }, [drivers, passengers, rides, scheduledTrips]);

  // Filtered schema entities
  const filteredEntities = useMemo(() => {
    return ENTITIES_SCHEMA.filter(ent => {
      const matchesCat = categoryFilter === 'all' || ent.category === categoryFilter;
      const matchesSearch = ent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            ent.nameAr.includes(searchTerm) ||
                            ent.description.includes(searchTerm);
      return matchesCat && matchesSearch;
    });
  }, [categoryFilter, searchTerm]);

  const selectedEntity = useMemo(() => {
    return ENTITIES_SCHEMA.find(e => e.id === selectedEntityId) || ENTITIES_SCHEMA[0];
  }, [selectedEntityId]);

  // SQL DDL Generator
  const generatedSqlCode = useMemo(() => {
    let sql = `-- ==========================================================\n`;
    sql += `-- AUTOMATED DATABASE SCHEMA GENERATOR (PostgreSQL Dialect)\n`;
    sql += `-- Generated on: ${new Date().toISOString()}\n`;
    sql += `-- Target App: Captain Express Intercity & Direct Taxi\n`;
    sql += `-- ==========================================================\n\n`;

    ENTITIES_SCHEMA.forEach(ent => {
      sql += `-- Table: ${ent.name} (${ent.nameAr})\n`;
      sql += `CREATE TABLE IF NOT EXISTS public.${ent.name.toLowerCase()}s (\n`;
      const fieldLines = ent.fields.map(f => {
        let line = `  ${f.name.padEnd(20)} ${f.type.padEnd(16)}`;
        if (f.isPk) line += ' PRIMARY KEY';
        if (f.required && !f.isPk) line += ' NOT NULL';
        return line;
      });
      sql += fieldLines.join(',\n');
      
      // Foreign keys
      const fkFields = ent.fields.filter(f => f.isFk && f.fkTarget);
      if (fkFields.length > 0) {
        sql += `,\n  -- Foreign Key Constraints\n`;
        const fkLines = fkFields.map(f => {
          const [targetTable, targetCol] = (f.fkTarget || '').split('.');
          return `  CONSTRAINT fk_${f.name} FOREIGN KEY (${f.name}) REFERENCES public.${targetTable.toLowerCase()}s(${targetCol || 'id'}) ON DELETE SET NULL`;
        });
        sql += fkLines.join(',\n');
      }

      sql += `\n);\n\n`;
    });

    return sql;
  }, []);

  // Firebase Blueprint JSON Output
  const generatedBlueprintJson = useMemo(() => {
    const blueprintObj: any = {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "Captain Express Database Blueprint",
      description: "Full Entity-Relationship and Firestore schema definition",
      entities: {},
      firestore: {}
    };

    ENTITIES_SCHEMA.forEach(ent => {
      const propsObj: any = {};
      const requiredFields: string[] = [];

      ent.fields.forEach(f => {
        propsObj[f.name] = {
          type: f.type.includes('INTEGER') || f.type.includes('DECIMAL') ? 'number' : 
                f.type === 'BOOLEAN' ? 'boolean' : 'string',
          description: f.description
        };
        if (f.enum) propsObj[f.name].enum = f.enum;
        if (f.required) requiredFields.push(f.name);
      });

      blueprintObj.entities[ent.name] = {
        title: ent.name,
        description: ent.description,
        type: 'object',
        properties: propsObj,
        required: requiredFields
      };

      blueprintObj.firestore[`${ent.firestoreCollection}/{id}`] = {
        schema: { $ref: `#/entities/${ent.name}` },
        description: ent.nameAr
      };
    });

    return JSON.stringify(blueprintObj, null, 2);
  }, []);

  const handleCopyCode = (text: string, formatName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatName);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 p-4 sm:p-6 font-sans dir-rtl text-right">
      {/* HEADER BAR */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mb-6 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-100">مستكشف قواعد البيانات ونموذج ER Diagram</h1>
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Live Relational Schema
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              الهيكلية الشاملة لجداول النظام والعلاقات بين الكباتن والركاب والحجوزات والمعاملات المالية
            </p>
          </div>
        </div>

        {/* METRICS QUICK STATS */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-850">
          <div className="px-3 py-1.5 text-center border-l border-slate-850">
            <div className="text-[10px] text-slate-400">إجمالي الجداول</div>
            <div className="text-sm font-black text-amber-400">{ENTITIES_SCHEMA.length} Tables</div>
          </div>
          <div className="px-3 py-1.5 text-center border-l border-slate-850">
            <div className="text-[10px] text-slate-400">إجمالي الحقول</div>
            <div className="text-sm font-black text-emerald-400">
              {ENTITIES_SCHEMA.reduce((sum, e) => sum + e.fields.length, 0)} Columns
            </div>
          </div>
          <div className="px-3 py-1.5 text-center">
            <div className="text-[10px] text-slate-400">محرك المزامنة</div>
            <div className="text-sm font-black text-cyan-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Firestore ABAC
            </div>
          </div>
        </div>
      </div>

      {/* VIEW TABS & FILTERS */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 mb-6">
        {/* MAIN VIEW TABS */}
        <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('er_graph')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'er_graph' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>مخطط العلاقات ER Diagram</span>
          </button>

          <button
            onClick={() => setActiveTab('data_dictionary')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'data_dictionary' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>قاموس الحقول (Data Dictionary)</span>
          </button>

          <button
            onClick={() => setActiveTab('sql_export')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'sql_export' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>تصدير SQL (PostgreSQL DDL)</span>
          </button>

          <button
            onClick={() => setActiveTab('json_blueprint')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'json_blueprint' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>مخطط Firebase Blueprint JSON</span>
          </button>
        </div>

        {/* SEARCH & CATEGORY FILTER */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
            <input 
              type="text"
              placeholder="بحث في الجداول الحقول..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500 transition"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none cursor-pointer focus:border-amber-500"
          >
            <option value="all">📁 جميع القطاعات</option>
            <option value="users">👤 المستخدمين والكباتن</option>
            <option value="trips">🚕 الرحلات والتوصيل</option>
            <option value="finance">💰 المحفظة والمالية</option>
            <option value="admin">👮‍♂️ الإدارة والصلاحيات</option>
            <option value="system">💬 النظام والدردشة</option>
          </select>
        </div>
      </div>

      {/* TAB 1: VISUAL RELATIONAL ER DIAGRAM GRAPH */}
      {activeTab === 'er_graph' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: INTERACTIVE ENTITY CARDS CANVAS */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>انقر على الجدول لاستعراض التفاصيل والعلاقات المباشرة:</span>
              </span>
              <span className="text-[11px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-850">
                عرض {filteredEntities.length} من {ENTITIES_SCHEMA.length} جدول
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredEntities.map((entity) => {
                const isSelected = entity.id === selectedEntityId;
                const fkCount = entity.fields.filter(f => f.isFk).length;
                const recordCount = (activeCounts as any)[entity.id] || 0;

                return (
                  <div
                    key={entity.id}
                    onClick={() => setSelectedEntityId(entity.id)}
                    className={`bg-slate-900/90 border rounded-2xl p-4 cursor-pointer transition-all duration-200 relative overflow-hidden group hover:border-amber-500/50 ${
                      isSelected 
                        ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xl shadow-amber-500/5' 
                        : 'border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    {/* TOP ACCENT DECORATION */}
                    <div className={`h-1.5 w-full absolute top-0 right-0 bg-gradient-to-r ${entity.color}`} />

                    <div className="flex justify-between items-start gap-2 mt-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-2 bg-slate-950 rounded-xl border border-slate-800">{entity.icon}</span>
                        <div>
                          <h3 className="text-base font-black text-slate-100 group-hover:text-amber-400 transition">
                            {entity.name}
                          </h3>
                          <span className="text-[11px] text-slate-400 block font-medium">{entity.nameAr}</span>
                        </div>
                      </div>

                      <span className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-lg text-[10px] font-mono text-amber-400">
                        {recordCount} سجلات
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                      {entity.description}
                    </p>

                    {/* FIELDS BADGES SUMMARY */}
                    <div className="mt-4 pt-3 border-t border-slate-850/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Key className="w-3 h-3 text-amber-400" />
                        <span>PK: id</span>
                      </span>

                      {fkCount > 0 && (
                        <span className="flex items-center gap-1 text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                          <LinkIcon className="w-3 h-3" />
                          <span>{fkCount} Foreign Keys</span>
                        </span>
                      )}

                      <span className="font-mono text-slate-500">{entity.firestoreCollection}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: SELECTED ENTITY INSPECTOR & RELATIONSHIP LINKAGE */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sticky top-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2.5 bg-slate-950 rounded-2xl border border-slate-800">{selectedEntity.icon}</span>
                  <div>
                    <h2 className="text-lg font-black text-amber-400">{selectedEntity.name}</h2>
                    <span className="text-xs text-slate-400">{selectedEntity.nameAr}</span>
                  </div>
                </div>

                <span className="bg-slate-950 px-2.5 py-1 rounded-lg text-xs font-mono border border-slate-800 text-slate-300">
                  {selectedEntity.firestoreCollection}
                </span>
              </div>

              <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-850 mb-4 leading-relaxed">
                {selectedEntity.description}
              </p>

              {/* RELATIONAL DEPENDENCIES */}
              <div className="mb-5">
                <h4 className="text-xs font-bold text-slate-200 mb-2.5 flex items-center gap-1.5">
                  <Network className="w-4 h-4 text-cyan-400" />
                  <span>الروابط والعلاقات المباشرة (Foreign Key Links):</span>
                </h4>

                <div className="space-y-2">
                  {selectedEntity.fields.filter(f => f.isFk).length === 0 ? (
                    <div className="bg-slate-950/60 p-3 rounded-xl text-[11px] text-slate-500 text-center border border-slate-850">
                      لا توجد علاقات مفاتيح أجنبية (Root Primary Entity)
                    </div>
                  ) : (
                    selectedEntity.fields.filter(f => f.isFk).map((f, i) => (
                      <div key={i} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="font-mono text-amber-300">{f.name}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                        <span className="font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/30">
                          {f.fkTarget}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* COLUMNS FIELD LIST */}
              <div>
                <h4 className="text-xs font-bold text-slate-200 mb-2.5 flex items-center gap-1.5">
                  <List className="w-4 h-4 text-amber-400" />
                  <span>قائمة الحقول والأنواع ({selectedEntity.fields.length}):</span>
                </h4>

                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                  {selectedEntity.fields.map((f, idx) => (
                    <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-850/80 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {f.isPk && <Key className="w-3 h-3 text-amber-400" />}
                          {f.isFk && <LinkIcon className="w-3 h-3 text-cyan-400" />}
                          <span className="font-mono text-xs font-bold text-slate-100">{f.name}</span>
                          {f.required && <span className="text-rose-400 text-[10px]">*</span>}
                        </div>
                        <span className="font-mono text-[10px] text-amber-400 bg-amber-950/30 px-1.5 py-0.5 rounded">
                          {f.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATA DICTIONARY TABLE */}
      {activeTab === 'data_dictionary' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-amber-400">قاموس قواعد البيانات الشامل (Data Dictionary)</h2>
              <p className="text-xs text-slate-400 mt-1">
                تفاصيل حقول ومواصفات البيانات لجميع الكيانات المعتمدة في نظام Captain Express
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {filteredEntities.map((ent) => (
              <div key={ent.id} className="bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden">
                <div className="bg-slate-900/80 p-4 border-b border-slate-850 flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{ent.icon}</span>
                    <div>
                      <h3 className="text-base font-black text-slate-100">{ent.name} ({ent.nameAr})</h3>
                      <span className="text-xs text-slate-400">{ent.description}</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-amber-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                    {ent.firestoreCollection}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900/40 text-slate-400 border-b border-slate-850 font-bold">
                      <tr>
                        <th className="p-3">اسم الحقل (Column)</th>
                        <th className="p-3">نوع البيانات (Data Type)</th>
                        <th className="p-3">المفتاح (Key)</th>
                        <th className="p-3">إجباري (Required)</th>
                        <th className="p-3">الوصف والوظيفة التشغيلية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {ent.fields.map((f, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50 transition">
                          <td className="p-3 font-mono font-bold text-amber-300">{f.name}</td>
                          <td className="p-3 font-mono text-cyan-400">{f.type}</td>
                          <td className="p-3">
                            {f.isPk && <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold">PRIMARY KEY</span>}
                            {f.isFk && <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded text-[10px] font-bold">FK: {f.fkTarget}</span>}
                            {!f.isPk && !f.isFk && <span className="text-slate-600">-</span>}
                          </td>
                          <td className="p-3">
                            {f.required ? (
                              <span className="text-rose-400 font-bold">نعم (Required)</span>
                            ) : (
                              <span className="text-slate-500">اختياري</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-300">{f.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SQL POSTGRESQL EXPORT */}
      {activeTab === 'sql_export' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-black text-amber-400">تصدير مخطط SQL (PostgreSQL DDL)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                كود إنشاء الجداول القياسي الجاهز للتطبيق على قواعد بيانات PostgreSQL أو Cloud SQL
              </p>
            </div>

            <button
              onClick={() => handleCopyCode(generatedSqlCode, 'SQL')}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition shadow-lg"
            >
              {copiedFormat === 'SQL' ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4 text-slate-950" />}
              <span>{copiedFormat === 'SQL' ? 'تم نسخ SQL بنجاح!' : 'نسخ كود SQL DDL'}</span>
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed max-h-[600px] overflow-y-auto">
            <pre>{generatedSqlCode}</pre>
          </div>
        </div>
      )}

      {/* TAB 4: FIREBASE BLUEPRINT JSON EXPORT */}
      {activeTab === 'json_blueprint' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-black text-amber-400">مخطط Firebase Blueprint JSON</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                الملف المعياري الوسيط لدوران وتأمين Firestore Security Rules ومطابقة الكيانات
              </p>
            </div>

            <button
              onClick={() => handleCopyCode(generatedBlueprintJson, 'JSON')}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition shadow-lg"
            >
              {copiedFormat === 'JSON' ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4 text-slate-950" />}
              <span>{copiedFormat === 'JSON' ? 'تم نسخ JSON Blueprint!' : 'نسخ JSON Blueprint'}</span>
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-xs text-amber-300 overflow-x-auto leading-relaxed max-h-[600px] overflow-y-auto">
            <pre>{generatedBlueprintJson}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErDiagramStudio;
