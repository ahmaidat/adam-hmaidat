export interface LocationPoint {
  x: number;
  y: number;
  name: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  isRealGps?: boolean;
  updatedAt?: string;
}

export interface DriverDocuments {
  idFront: string;
  idBack: string;
  licenseFront: string;
  licenseBack: string;
  carRegFront: string;
  carRegBack: string;
  photo: string;
}

export interface Driver {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  phone: string;
  email: string;
  licenseExpiry: string; // YYYY-MM-DD
  carType: string;
  carClass: string;
  carPlate: string;
  carModel: number; // e.g. 2023
  carRegistrationExpiry: string; // YYYY-MM-DD
  noCriminalRecord: boolean;
  governorate: string;
  district: string;
  documents: DriverDocuments;
  status: 'pending' | 'approved' | 'blocked';
  isOnline: boolean;
  balance: number;
  currentLocation: LocationPoint;
  activeRideId: string | null;
  ratingAverage: number;
  tripsCount: number;
  linkedPaymentProvider?: string;
  linkedAccountName?: string;
  linkedAccountNumber?: string;
  linkedAccountBalance?: number;
  country?: string; // Countries: 'JO' | 'SA' | 'EG' | 'AE'
  pin?: string; // 4-digit security PIN for sensitive financial transactions
  minBalanceLimit?: number; // Minimum balance required to go online or accept rides
  workScope?: 'local' | 'intercity' | 'both'; // 'local' (inside city), 'intercity' (between cities), 'both'
  serviceScope?: 'all' | 'intracity' | 'intercity' | 'scheduled'; // 'all' (جميع الخدمات), 'intracity' (داخل المدينة), 'intercity' (بين المحافظات), 'scheduled' (رحلات مجدولة)
  allowedServices?: ('intracity' | 'intercity' | 'scheduled')[]; // Specific list of allowed services
  biometricsEnabled?: boolean;
  faceIdEnabled?: boolean;
  biometricType?: 'faceid' | 'touchid' | 'webauthn';
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'sms' | 'whatsapp' | 'authenticator';
  requireAuthForWithdrawal?: boolean;
  requireAuthForTransfer?: boolean;
  requireAuthForRecharge?: boolean;
  maxDailyTransactionLimit?: number;
  securityLogs?: { id: string; action: string; method: string; timestamp: string; ipOrDevice: string; status: 'success' | 'failed'; failureReason?: string }[];
}

export interface PassengerDocuments {
  idFront: string;
  idBack: string;
  photo: string;
}

export interface Passenger {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  phone: string;
  email: string;
  documents: PassengerDocuments;
  status: 'pending' | 'approved' | 'blocked';
  currentLocation: LocationPoint;
  activeRideId: string | null;
  ratingAverage: number;
  tripsCount: number;
  balance: number;
  linkedPaymentProvider?: string;
  linkedAccountName?: string;
  linkedAccountNumber?: string;
  linkedAccountBalance?: number;
  additionalLinkedAccounts?: { id: string; provider: string; name: string; number: string; timestamp?: string }[];
  favorites?: { label: string; address: string }[];
  favoriteRoutes?: { label: string; fromAddress: string; toAddress: string }[];
  emergencyContacts?: { name: string; phone: string }[];
  country?: string; // Countries: 'JO' | 'SA' | 'EG' | 'AE'
  pin?: string; // 4-digit security PIN for sensitive financial transactions
  minBalanceLimit?: number; // Minimum balance required to request rides
  serviceScope?: 'all' | 'intracity' | 'intercity' | 'scheduled'; // 'all' (جميع الخدمات), 'intracity' (داخل المدينة), 'intercity' (بين المحافظات), 'scheduled' (رحلات مجدولة)
  allowedServices?: ('intracity' | 'intercity' | 'scheduled')[]; // Specific list of allowed services
  autoRechargeEnabled?: boolean;
  autoRechargeThreshold?: number;
  autoRechargeAmount?: number;
  biometricsEnabled?: boolean;
  faceIdEnabled?: boolean;
  biometricType?: 'faceid' | 'touchid' | 'webauthn';
  isOnline?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'sms' | 'whatsapp' | 'authenticator';
  requireAuthForWithdrawal?: boolean;
  requireAuthForTransfer?: boolean;
  requireAuthForRecharge?: boolean;
  maxDailyTransactionLimit?: number;
  securityLogs?: { id: string; action: string; method: string; timestamp: string; ipOrDevice: string; status: 'success' | 'failed'; failureReason?: string }[];
}

export interface RideRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  fromArea: string;
  toArea: string;
  seatsCount: number; // Number of people (main passenger + companions)
  status: 'pending' | 'pooling' | 'offered' | 'accepted' | 'started' | 'completed' | 'cancelled';
  rideId: string | null; // ID of the PooledRide
  fromCoords: { x: number; y: number };
  toCoords: { x: number; y: number };
  requestedTime?: string; // Specific scheduled time for the ride (optional)
  appliedPromo?: string; // Promotional/Discount code used by this passenger
  discountAmount?: number; // Decided Jordan Dinars discount off passenger fare
  isAirportRide?: boolean; // Whether this request is an airport trip
  airportFare?: number; // Custom fare for airport trip if applicable
  startOtp?: string; // 4-digit verification PIN for trip start
  tipAmount?: number; // Optional driver tip / reward from passenger
  isHiddenByAdmin?: boolean; // Admin privacy / filter flag
  adminCancelledBy?: string;
  adminCancelReason?: string;
  adminCancelAiReport?: any;
}

export interface PooledRide {
  id: string;
  driverId: string | null;
  driverName?: string;
  driverPhone?: string;
  carType?: string;
  carPlate?: string;
  requests: RideRequest[]; // pooled passenger requests (total seatsCount <= 4)
  fromArea: string;
  toArea: string;
  status: 'pooling' | 'offered' | 'accepted' | 'started' | 'completed' | 'cancelled';
  startTime: string | null;
  endTime: string | null;
  appliedDriverPromo?: string; // Promo code used by driver for reduced commission or bonus
  driverCommissionDiscount?: number; // Reduced commission discount value in Jordanian Dinars
  etaStart: string | null; // e.g. "12:30 PM"
  etaEnd: string | null; // e.g. "01:15 PM"
  offeredToDriverId: string | null; // Driver who is currently deciding
  rejectedDriverIds: string[]; // Drivers who rejected this pooled ride offer
  passengerRatings: { [passengerId: string]: { rating: number; note: string } };
  driverRating: { rating: number; note: string; tags?: string[]; sentiment?: 'positive' | 'neutral' | 'negative'; timestamp?: string } | null;
  commissionCharged: number; // Total commission deducted
  startOtp?: string; // 4-digit verification PIN for starting ride
  tipAmount?: number; // Driver reward / tip from passenger
  isHiddenByAdmin?: boolean; // Admin privacy / filter flag
  adminCancelledBy?: string;
  adminCancelReason?: string;
  adminCancelAiReport?: any;
}

export interface ChatMessage {
  id: string;
  rideId: string;
  sender: 'admin' | 'driver' | 'passenger';
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

export interface LocationConfig {
  governorate: string;
  passengerFare?: number;
  commissionRate?: number;
  pickupPoints?: string[]; // Main pick-up points for the city
  districts: {
    name: string;
    villages: string[]; // Neighborhoods / Areas
    streets?: Record<string, string[]>; // Streets/Landmarks per neighborhood
  }[];
}

export interface RouteFareConfig {
  id: string;
  fromGovernorate: string;
  fromDistrict: string;
  toGovernorate: string;
  toDistrict: string;
  passengerFare: number;
  commissionRate: number;
}

export interface IntraCityConfig {
  ratePerKm: number; // e.g. 0.29
  ratePerMin: number; // e.g. 0.06
  minFare: number; // e.g. 1.50
  commissionRatePercent: number; // e.g. 25 for 25%
  activeMultiplier: number; // e.g. 1.0, 1.2, 1.5
}

export interface SystemOffer {
  id: string; // unique ID
  code: string; // promo code, e.g. "ADAM20", "JO50"
  title: string; // e.g. "خصم ركاب", "حافز كابتن"
  targetType: 'passenger' | 'driver' | 'both'; // WHO gets this offer (ركاب، كباتن، الجميع)
  travelScope?: 'intracity' | 'intercity' | 'all'; // النطاق الجغرافي: داخل المدينة، خارج المدينة/بين المحافظات، الكل
  discountType: 'percentage' | 'fixed'; // percentage or flat discount/bonus
  value: number; // e.g. 15 for 15% discount, or 1.50 for 1.50 JD off / bonus
  isActive: boolean;
  minRideAmount?: number; // minimum trip price for apply
  usageCount: number; // use count
  offerCategory?: string; // 'discount_ride' | 'wallet_bonus_code' | 'challenge_milestone'
  targetRidesCount?: number;
  hoursLimit?: number;
  bonusAmount?: number;
}

export interface SystemBank {
  id: string;
  bankName: string;
  accountNumber: string; // IBAN or account number
  accountHolder?: string;
  isActive?: boolean;
}

export interface ServiceLaunchConfig {
  enabled: boolean;
  launchDateTime: string; // ISO format e.g. 2026-09-01T08:00
  targetAudience: 'passenger' | 'driver' | 'all';
  announcementTitle: string;
  announcementBody: string;
  announcementMessage?: string;
  blockBookingBeforeLaunch: boolean;
  passengerMessageAr?: string; // رسالة مخصصة تظهر للركاب
  driverMessageAr?: string; // رسالة مخصصة تظهر للكباتن
  allowPassengerRegistration?: boolean; // السماح بتسجيل الركاب أثناء فترة ما قبل الإطلاق
  allowDriverRegistration?: boolean; // السماح بتسجيل الكباتن أثناء فترة ما قبل الإطلاق
  bannerImage?: string;
  aiGeneratedMsg?: string;
  bonusAmount?: number;
}

export interface AiRechargeAudit {
  score: number; // 0 - 100% integrity confidence score
  status: 'verified_authentic' | 'suspicious' | 'potential_duplicate' | 'needs_admin_check';
  referenceValid: boolean;
  channelMatch: boolean;
  destinationAccountValid: boolean;
  summaryAr: string;
  recommendation: 'approve_funds_verified' | 'manual_bank_check' | 'reject_unverified';
  anomalyFlags: string[];
  auditedAt: string;
  aiModel?: string;
}

export interface PendingRechargeRequest {
  id: string;
  userId: string;
  userType: 'driver' | 'passenger';
  userName: string;
  userPhone?: string;
  amount: number;
  paymentMethod: 'wallet' | 'cliq' | 'bank' | 'card' | 'apple_pay';
  sourceAccountOrRef: string;
  referenceNumber: string;
  clearanceCode?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  aiAudit?: AiRechargeAudit;
}

export interface DynamicUiControls {
  hideHomeButton?: boolean; // إخفاء زر وأيقونة الرئيسية من شريط التنقل
  hidePassengerHomeButton?: boolean; // إخفاء زر الرئيسية في تطبيق الراكب
  hideDriverHomeButton?: boolean; // إخفاء زر الرئيسية في تطبيق الكابتن
  hideWelcomeGreeting?: boolean; // إخفاء الكلمة والعبارة الترحيبية العامة
  hidePassengerWelcomeGreeting?: boolean; // إخفاء الكلمة الترحيبية في تطبيق الراكب
  hideDriverWelcomeGreeting?: boolean; // إخفاء الكلمة الترحيبية في تطبيق الكابتن
  passengerWelcomeText?: string; // نص ترحيبي مخصص للراكب
  driverWelcomeText?: string; // نص ترحيبي مخصص للكابتن
  hideBottomNavBar?: boolean; // إخفاء شريط التنقل السفلي بالكامل
  hidePassengerWallet?: boolean; // إخفاء تبويب محفظة الراكب
  hidePassengerScheduled?: boolean; // إخفاء تبويب الرحلات المجدولة للراكب
  hidePassengerChat?: boolean; // إخفاء تبويب الدردشة للراكب
  hidePassengerOtp?: boolean; // إخفاء رمز الأمان OTP للراكب
  hidePassengerHistory?: boolean; // إخفاء سجل الرحلات للراكب
  hidePassengerAds?: boolean; // إخفاء شريط الإعلانات للراكب
  hidePassengerVoiceAi?: boolean; // إخفاء المساعد الصوتي للراكب
  hidePassengerDirectRide?: boolean; // إخفاء زر التاكسي الفوري
  hidePassengerIntercityRide?: boolean; // إخفاء زر حجز السفر بين المحافظات
  hidePassengerAirportRide?: boolean; // إخفاء زر توصيل المطار
  hideDriverWallet?: boolean; // إخفاء تبويب محفظة الكابتن
  hideDriverScheduled?: boolean; // إخفاء تبويب مواعيد رحلات الكابتن
  hideDriverChat?: boolean; // إخفاء تبويب الدردشة للكابتن
  hideDriverStatus?: boolean; // إخفاء تبويب حالة الكابتن
  hideDriverVoiceAi?: boolean; // إخفاء المساعد الصوتي للكابتن
  hideDriverHistory?: boolean; // إخفاء سجل جدول رحلات الكابتن
  hideDriverOtp?: boolean; // إخفاء رمز الأمان للكابتن
}

export interface UberAiDispatchConfig {
  enabled: boolean; // تفعيل خوارزمية أوبر الذكية لتوزيع واستقبال الطلبات
  searchRadiusKm: number; // نصف قطر البحث عن أقرب كابتن (كم)
  acceptanceTimeoutSec: number; // مهلة قبول الكابتن للطلب قبل تحويله للكابتن التالي (ثواني)
  simulatedCellLocationEnabled: boolean; // استخدام أبراج وشبكات الاتصال لتحديد مكان الراكب والكابتن
  cellularTriangulationEnabled?: boolean; // تمكين التثليث الخلوي لمزودي الخدمات الخلوية (Zain/Orange/Umniah)
  autoMatchingRadiusKm?: number; // مسافة المطابقة التلقائية بـ AI
  requestTimeoutSeconds?: number; // مهلة استقبال الطلب
  autoReassignNextDriver?: boolean; // إعادة التعيين التلقائي للكابتن التالي
  dynamicSurgeEnabled: boolean; // تسعير ديناميكي ذكي حسب كثافة الطلب
  instantCaptainSoundAlert: boolean; // تنبيه صوتي فوري للكابتن عند توفر طلب قريب
  autoReassignOnTimeout: boolean; // إعادة التوجيه التلقائي لأقرب كابتن بديل
}

export interface AdminSettings {
  minCarModel: number; // Default 2021
  commissionRate: number; // Per passenger commission (e.g. 1.5 JD)
  passengerFarePerSeat: number; // Per passenger trip price (e.g. 3.0 JD)
  airportMinCarModel?: number; // Minimum car model for airport requests (defaults to current year e.g. 2026)
  airportRidePrice?: number; // Custom total fare for airport requests (e.g. 25.0 JD)
  airportCommissionRate?: number; // Corporate commission for airport requests (e.g. 3.0 JD)
  locations: LocationConfig[];
  ratingsDisabled?: boolean; // هل تم تعطيل نظام التقييم المتبادل بناءً على طلب العميل والسياسة الإدارية
  rechargeApprovalMode?: 'auto' | 'admin_approval'; // نمط زيادة الرصيد عند الشحن: تلقائي أو بموافقة وتأكيد الإدارة
  pendingRechargeRequests?: PendingRechargeRequest[]; // طلبات الإيداع والشحن المعلقة بانتظار موافقة الإدارة
  systemWalletNumber?: string; // Approved central wallet number for receiving top-ups
  systemCliQPhone?: string; // Approved central phone number for receiving CliQ payments
  systemCliQAlias?: string; // Approved central alias for receiving CliQ payments
  systemBankAccountNumber?: string; // Approved central bank account IBAN/number
  systemBankName?: string; // Approved central bank name
  systemBanks?: SystemBank[]; // Multiple approved bank accounts for corporate financial collection
  systemLogo?: string; // Base64 or URL logo to show in passenger & driver apps
  routeFares?: RouteFareConfig[];
  intraCityConfig?: IntraCityConfig;
  intraCityFaresByGovernorate?: Record<string, IntraCityConfig>;
  hourlySchedulesEnabled?: boolean;
  hourlySchedulesRouteFrom?: string;
  hourlySchedulesRouteTo?: string;
  hourlySchedulesHourStart?: number;
  hourlySchedulesHourEnd?: number;
  hourlySchedulesIs24Hours?: boolean; // خيار التوليد والتشغيل على مدار 24 ساعة (24/7)
  hourlySchedulesDurationSpan?: 'today' | '2days' | 'week' | 'month' | 'year'; // نطاق الأيام لإطلاق الرحلات
  hourlySchedulesIntervalMinutes?: number; // عداد الدقائق لتكرار إطلاق الرحلات (مثلا كل 10 دقائق)
  hourlySchedulesAiOptimization?: boolean; // تفعيل محرك الذكاء الاصطناعي لموازنة الرحلات في ساعات الذروة تلقائيا
  scheduledTripCancellationPenalty?: number; // قيمة غرامة الإلغاء للرحلات المجدولة اليومية (د.أ)
  systemOffers?: SystemOffer[]; // List of administration-defined discounts, offers and promocodes
  defaultDriverMinBalance?: number; // Default minimum balance for drivers
  defaultPassengerMinBalance?: number; // Default minimum balance for passengers
  cancellationPolicy?: CancellationPolicy; // Smart Cancellation Policy
  collectionPriorityMode?: 'priority' | 'random'; // طريقة توجيه واستقبال التحويلات للشركة
  collectionPriorityOrder?: string[]; // ترتيب الأولوية لقنوات التحصيل المالي للشركة (مثل cliq, wallet, bank)
  hideCompanyProfits?: boolean; // خيار إخفاء أرباح وعمولات الشركة بوضع الخصوصية السرية
  isCompanyProfitsZeroed?: boolean; // حالة تصفير أرباح وإيرادات الشركة بقرار إداري
  companyProfitsClearedAt?: string; // تاريخ وساعة تصفير أرباح الشركة
  companyProfitsResetOffset?: number; // قيمة الخصم/المقاصة لتصفير الأرباح المسجلة
  notificationSoundTone?: 'chime' | 'bell' | 'digital_radar' | 'synth_ding' | 'taxi_horn' | 'cyber_pulse' | 'marimba' | 'urgent_ping'; // نغمة إشعارات الطلبات والركاب
  notificationSoundVolume?: number; // مستوى صوت نغمة التنبيه (0.1 - 1.0)
  serviceLaunchConfig?: ServiceLaunchConfig; // إعدادات موعد إطلاق الخدمة وقفل الحجز
  uiControls?: DynamicUiControls; // التحكم الديناميكي بإخفاء وتفعيل الأيقونات والقوائم
  uberAiDispatch?: UberAiDispatchConfig; // محرك أوبر الذكي لطلب واستقبال وتوزيع الرحلات
}

export interface CancellationPolicy {
  passengerCancelFeeDirect: number; // رسوم إلغاء الطلب المباشر للراكب (د.أ)
  passengerCancelFeeScheduled: number; // رسوم إلغاء الحجز المجدول للراكب (د.أ)
  driverCancelFeeDirect: number; // رسوم إلغاء الطلب المباشر للكابتن (د.أ)
  driverCancelFeeScheduled: number; // رسوم إلغاء الرحلة المجدولة للكابتن (د.أ)
  freeCancellationWindowMinutes: number; // فترة الإلغاء المجاني بالدقائق للركاب
  aiAdaptiveEnabled: boolean; // تفعيل السياسة التكيفية الذكية بـ AI
  policyDescriptionAr?: string; // وصف السياسة المعتمدة باللغة العربية بـ AI
}

export interface ScheduledTrip {
  id: string;
  creatorId: string;
  creatorType: 'driver' | 'passenger' | 'admin';
  creatorName: string;
  fromArea: string;
  toArea: string;
  departureTime: string; // Format: YYYY-MM-DD HH:MM
  seatsCount: number; // For passenger-created: requested seats. For driver-created/admin-created: max capacity (e.g. 4)
  availableSeats: number; // Remaining seats for driver/admin-created trips
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  driverId: string | null; // Assisting driver
  driverName: string | null;
  driverPhone: string | null;
  passengers: {
    passengerId: string;
    fullName: string;
    phone: string;
    seatsCount: number;
    bookedAt: string;
    pickupLocation?: string;
    dropoffLocation?: string;
    customNote?: string;
    confirmed?: boolean;
  }[];
  customFare?: number;
  customCommission?: number;
  driverRequests?: {
    driverId: string;
    driverName: string;
    requestedAt: string;
  }[];
  routeStops?: string[];
  aiRouteDescription?: string;
  driverConfirmed?: boolean;
  country?: string; // Countries: 'JO' | 'SA' | 'EG' | 'AE'
  isPinnedDaily?: boolean; // رحلة يومية متكررة ثابتة من الإدارة
  aiGenerated?: boolean; // معبأة آلياً عبر الذكاء الاصطناعي AI
  governorateFrom?: string; // المحافظة
  districtFrom?: string; // اللواء
  governorateTo?: string; // المحافظة الوجهة
  districtTo?: string; // اللواء المقصود
  dailyDepartureHour?: string; // ساعة وتوقيت انطلاق اليومي (HH:MM)
  isHiddenByAdmin?: boolean; // Admin privacy / filter flag
  adminCancelledBy?: string;
  adminCancelReason?: string;
  adminCancelAiReport?: any;
}

export interface AutomatedScheduleSuggestion {
  id: string;
  fromArea: string;
  toArea: string;
  departureTime: string; // YYYY-MM-DD HH:MM
  hour: string; // HH:MM
  fare: number;
  commission: number;
  expectedDemand: string;
  aiReasoning: string;
  govFrom?: string;
  distFrom?: string;
  govTo?: string;
  distTo?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  userType: 'driver' | 'passenger';
  type: 'deposit' | 'withdraw' | 'fare_payment' | 'commission_deduction' | 'cancel_fee';
  amount: number;
  walletNumber?: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod?: 'wallet' | 'cliq' | 'bank' | 'cash' | 'card' | 'apple_pay';
  country?: string; // Countries: 'JO' | 'SA' | 'EG' | 'AE'
}

export const JORDAN_PAYMENT_PROVIDERS = {
  zain: 'زين كاش الأردنية (Zain Cash)',
  orange: 'أورنج موني (Orange Money)',
  umniah: 'أمنية يو-والت (uWallet)',
  dinarak: 'دينارك للدفع الإلكتروني (Dinarak)',
  cliq: 'كليك للتحويل الفوري (CliQ Service)',
  arab_bank: 'البنك العربي (Arab Bank)',
  bank_etihad: 'بنك الاتحاد الأردني (Bank al Etihad)',
  housing_bank: 'بنك الإسكان للتجارة والتمويل (Housing Bank - HBTF)',
  capital_bank: 'كابيتال بنك الأردني (Capital Bank)',
  cairo_amman: 'بنك القاهرة عمان (Cairo Amman Bank)',
  bank_of_jordan: 'بنك الأردن (Bank of Jordan)',
  jordan_kuwait: 'البنك الأردني الكويتي (Jordan Kuwait Bank)',
  jordan_national: 'البنك الأهلي الأردني (Jordan National Bank - Ahli)',
  safwa_islamic: 'بنك صفوة الإسلامي (Safwa Islamic Bank)',
  jordan_islamic: 'البنك الإسلامي الأردني (Jordan Islamic Bank)',
  bank_abc: 'بنك المؤسسة العربية المصرفية (Bank ABC Jordan)',
  ajib: 'بنك الاستثمار العربي الأردني (AJIB)',
  jordan_commercial: 'البنك التجاري الأردني (Jordan Commercial Bank)',
  sgbj: 'بنك سوسيتيه جنرال الأردن (SGBJ)',
  al_rajhi: 'مصرف الراجحي الأردن (Al Rajhi Bank)',
  arab_islamic: 'البنك العربي الإسلامي الدولي (Arab Islamic International Bank)',
  standard_chartered: 'بنك ستاندرد تشارترد (Standard Chartered Jordan)',
  citibank: 'سيتي بنك الأردني (Citibank Jordan)',
  egyptian_arab: 'البنك العقاري المصري العربي (Egyptian Arab Land Bank)',
  rafidain: 'بنك الرافدين العراقي - فرع الأردن (Rafidain Bank)'
} as const;

export type PaymentProviderKey = keyof typeof JORDAN_PAYMENT_PROVIDERS;

export interface DriverBid {
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverPhoto?: string;
  carDescription?: string;
  bidPrice: number;
  commission: number;
  createdAt: string;
}

export interface RideWaypoint {
  id: string;
  name: string; // Landmark / address name
  landmark?: string; // Specific landmark description (ATM, Pharmacy, Cafe...)
  district?: string;
  village?: string;
  street?: string;
  stopFee: number; // Stop fee surcharge (e.g. 0.50 JOD)
  estimatedWaitMin?: number; // Estimated wait time in minutes (e.g. 5 mins)
  coords?: { x: number; y: number };
  note?: string; // Optional passenger note for the driver
  aiRationale?: string;
}

export interface IntraCityRide {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  status: 'pending' | 'accepted' | 'started' | 'completed' | 'cancelled';
  pickupName: string;
  dropoffName: string;
  distanceKm: number;
  durationMin: number;
  price: number;
  commission: number;
  createdAt: string;
  pickupCoords: { x: number; y: number };
  dropoffCoords: { x: number; y: number };
  fromGov?: string;
  fromDist?: string;
  fromVillage?: string;
  toGov?: string;
  toDist?: string;
  toVillage?: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  waypoints?: RideWaypoint[]; // Multi-stop points along the route (Uber-style)
  expectedPrice?: number;
  passengerRated?: boolean;
  driverRatingVal?: number;
  driverRatingNote?: string;
  driverRated?: boolean;
  passengerRatingVal?: number;
  passengerRatingNote?: string;
  country?: string; // Countries: 'JO' | 'SA' | 'EG' | 'AE'
  hasArrived?: boolean; // Driver arrival indicator
  surgeMultiplier?: number; // Dynamic surge multiplier (e.g. 1.25, 1.5)
  driverBids?: DriverBid[]; // Driver bids for price negotiation
  cancellationFee?: number; // Applied cancellation fee
  cancelReason?: string; // Reason for cancellation
  cancelledBy?: 'passenger' | 'driver' | 'system';
  paymentMethod?: 'cash' | 'wallet'; // طريقة الدفع المحددة من الراكب (نقدي / محفظة)
  targetedDriverId?: string | null; // الكابتن الموجه له الطلب حصرياً حالياً
  dispatchQueue?: string[]; // قائمة الكباتن المتاحين مرتبين حسب القرب الجغرافي (أوبر مود)
  dispatchIndex?: number; // مؤشر الكابتن الحالي في السلسلة
  dispatchExpiresAt?: string; // توقيت انتهاء المهلة الممنوحة للكابتن الموجه له الطلب (ISO)
  declinedDriverIds?: string[]; // قائمة الكباتن الذين رفضوا أو تجاوزوا الطلب
  startOtp?: string; // رمز الأمان 4 خانات لبدء الرحلة
  tipAmount?: number; // مكافأة وإكرامية الكابتن من الراكب
  isAirportTrip?: boolean; // هل الرحلة خاصة بمطار الملكة علياء الدولي
  flightNumber?: string; // رقم رحلة الطيران
  luggageCount?: number; // عدد الحقائب
  airportTripDirection?: 'to_airport' | 'from_airport'; // اتجاه رحلة المطار
  isHiddenByAdmin?: boolean; // Admin privacy / filter flag
  adminCancelledBy?: string;
  adminCancelReason?: string;
  adminCancelAiReport?: any;
  driverDismissed?: boolean;
  passengerDismissed?: boolean;
  cashConfirmed?: boolean;
  invoiceClosed?: boolean;
}

export function maskPhoneNumber(phone?: string | null, preserveDigits = 3): string {
  if (!phone) return '079****000';
  const clean = phone.trim();
  if (clean.length < 7) return '079****000';
  const prefix = clean.slice(0, 3);
  const suffix = clean.slice(-preserveDigits);
  return `${prefix}****${suffix}`;
}

export interface AiPlugin {
  id: string;
  target: 'passenger' | 'driver' | 'admin' | 'all';
  title: string;
  description: string;
  htmlCode: string;
  tailwindClasses?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface CommercialAd {
  id: string;
  title: string;
  badge: string;
  description: string;
  image: string;
  buttonText: string;
  timeText: string;
  target: 'passenger' | 'driver' | 'all';
  createdAt: string;
  status: 'active' | 'inactive';
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  companyName?: string;
  isLaunchAnnouncement?: boolean;
  launchDateTime?: string;
  blockServicesUntilLaunch?: boolean;
  bonusAmount?: number;
  bonusTargetGroup?: 'all_new_passengers' | 'all_new_drivers' | 'everyone' | 'selected_users';
  selectedUserIds?: string[];
}

export type PermissionState = 'enabled' | 'disabled' | 'hidden';

export interface Employee {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: 'employee';
  roleCategory?: 'Admin' | 'Moderator' | 'Support';
  status?: 'active' | 'inactive' | 'on_break';
  lastActiveTask?: string;
  lastActiveTime?: string;
  assignedTasksCount?: number;
  phone?: string;
  email?: string;
  firebaseSynced?: boolean;
  assignedTaskDetails?: { taskId: string; title: string; assignedAt: string; status: 'pending' | 'in_progress' | 'completed' };
  isHidden?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'SMS' | 'Authenticator App' | 'Email Code';
  permissions: {
    pendingDrivers: PermissionState | boolean;
    activeDrivers: PermissionState | boolean;
    passengers: PermissionState | boolean;
    allRides: PermissionState | boolean;
    scheduledTrips: PermissionState | boolean;
    walletApprovals: PermissionState | boolean;
    rateManagement: PermissionState | boolean;
    userFeedbacks: PermissionState | boolean;
    aiServicesStrategy: PermissionState | boolean;
    aiDeveloperStudio: PermissionState | boolean;
    logs: PermissionState | boolean;
    auditPayments: PermissionState | boolean;
  };
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialSymbols: boolean;
  expirationDays: number;
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
}

export interface TwoFactorPolicy {
  mode: 'mandatory' | 'optional' | 'admins_only';
  allowedMethods: ('SMS' | 'Authenticator App' | 'Email Code')[];
  defaultMethod: 'SMS' | 'Authenticator App' | 'Email Code';
}

export interface FailedLoginAttempt {
  id: string;
  timestamp: string;
  usernameOrEmail: string;
  ipAddress: string;
  deviceInfo: string;
  failureReason: 'كلمة مرور خاطئة' | 'رمز 2FA غير صحيح' | 'حساب مغلق مؤقتاً' | 'اسم مستخدم غير موجود' | 'محاولة غير مصرحة';
  riskLevel: 'منخفض' | 'متوسط' | 'مرتفع';
  status: 'سجل نشط' | 'تم الحظر' | 'تم الفحص';
  location?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  userType: 'passenger' | 'driver' | 'admin';
  title: string;
  body: string;
  tripId?: string;
  isRead: boolean;
  type: 'trip_reminder' | 'booking_success' | 'general';
  createdAt: string;
}

export const DEFAULT_JORDAN_VEHICLES = [
  {
    name: "تويوتا (Toyota)",
    models: ["تويوتا بريوس (Toyota Prius)", "تويوتا كامري (Toyota Camry)", "تويوتا كورولا (Toyota Corolla)", "تويوتا يارس (Toyota Yaris)", "تويوتا سي-إتش آر (Toyota C-HR)", "تويوتا راف 4 (Toyota RAV4)"]
  },
  {
    name: "هيونداي (Hyundai)",
    models: ["هيونداي أفانتي (Hyundai Avante)", "هيونداي سوناتا (Hyundai Sonata)", "هيونداي إلنترا (Hyundai Elantra)", "هيونداي توسان (Hyundai Tucson)", "هيونداي أيونيك (Hyundai Ioniq)"]
  },
  {
    name: "كيا (Kia)",
    models: ["كيا سيراتو (Kia Cerato)", "كيا فورتي (Kia Forte)", "كيا نيرو (Kia Niro)", "كيا سبورتيج (Kia Sportage)", "كيا أوبتيما (Kia Optima)", "كيا إي-نيرو (Kia e-Niro)", "كيا سبيكترا (Kia Spectra)"]
  },
  {
    name: "تسلا (Tesla)",
    models: ["تسلا موديل 3 (Tesla Model 3)", "تسلا موديل Y (Tesla Model Y)", "تسلا موديل S (Tesla Model S)"]
  },
  {
    name: "بي واي دي (BYD)",
    models: ["بي واي دي يوان بلس (BYD Yuan Plus)", "بي واي دي سونغ (BYD Song)", "بي واي دي هان (BYD Han)", "بي واي دي دولفين (BYD Dolphin)"]
  },
  {
    name: "فولكس فاجن (Volkswagen)",
    models: ["فولكس فاجن ID.4 (Volkswagen ID.4)", "فولكس فاجن ID.6 (Volkswagen ID.6)", "فولكس فاجن ID.3 (Volkswagen ID.3)", "فولكس فاجن جولف (Volkswagen Golf)"]
  },
  {
    name: "شانجان (Changan)",
    models: ["شانجان إي-ستار (Changan E-Star)", "شانجان ألسفن (Changan Alsvin)", "شانجان يوني-كي (Changan Uni-K)"]
  },
  {
    name: "نيسان (Nissan)",
    models: ["نيسان ليف (Nissan Leaf)", "نيسان صني (Nissan Sunny)", "نيسان ألتيما (Nissan Altima)"]
  },
  {
    name: "مرسيدس بنز (Mercedes-Benz)",
    models: ["مرسيدس E200 (Mercedes E200)", "مرسيدس C200 (Mercedes C200)", "مرسيدس EQE (Mercedes EQE)"]
  },
  {
    name: "بي إم دبليو (BMW)",
    models: ["بي إم دبليو الفئة الثالثة (BMW 3 Series)", "بي إم دبليو الفئة الخامسة (BMW 5 Series)", "بي إم دبليو i4 (BMW i4)"]
  }
];

export type AppServiceType = 'intracity' | 'intercity' | 'scheduled';

export const isServiceAllowed = (user: Driver | Passenger | null | undefined, service: AppServiceType): boolean => {
  if (!user) return true;
  if (user.allowedServices && Array.isArray(user.allowedServices) && user.allowedServices.length > 0) {
    return user.allowedServices.includes(service);
  }
  if (!user.serviceScope || user.serviceScope === 'all') {
    return true;
  }
  return user.serviceScope === service;
};

export const getAllowedServicesList = (user: Driver | Passenger | null | undefined): AppServiceType[] => {
  if (!user) return ['intracity', 'intercity', 'scheduled'];
  if (user.allowedServices && Array.isArray(user.allowedServices) && user.allowedServices.length > 0) {
    return user.allowedServices;
  }
  if (!user.serviceScope || user.serviceScope === 'all') {
    return ['intracity', 'intercity', 'scheduled'];
  }
  return [user.serviceScope];
};
