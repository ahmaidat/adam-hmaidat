import { LocationConfig } from './types';

export interface CountryConfig {
  code: string; // 'JO' | 'SA' | 'EG' | 'AE'
  nameAr: string;
  nameEn: string;
  flag: string;
  currencyAr: string;
  currencyEn: string;
  telecomsAr: string[];
  telecomsEn: string[];
  banksAr: string[];
  banksEn: string[];
  supportPhone: string;
  speedLimit: number;
  minCarModel: number;
  maxPassengers: number;
  taxPercent: number;
  defaultCommissionRate: number;
  defaultPassengerFarePerSeat: number;
  systemWalletNumber: string;
  systemCliQPhone: string;
  systemCliQAlias: string;
  systemBankAccountNumber: string;
  systemBankName: string;
  locations: LocationConfig[];
  intraCityConfig: {
    ratePerKm: number;
    ratePerMin: number;
    minFare: number;
    commissionRatePercent: number;
    activeMultiplier: number;
  };
  baseRate?: number;
  perKmRate?: number;
  perSeatRate?: number;
}

export const FEATURED_COUNTRIES: CountryConfig[] = [
  {
    code: 'JO',
    nameAr: 'الأردن',
    nameEn: 'Jordan',
    flag: '🇯🇴',
    currencyAr: 'د.أ',
    currencyEn: 'JOD',
    telecomsAr: ['زين الأردن (Zain JO)', 'أورانج الأردن (Orange JO)', 'أمنية (Uminiah)'],
    telecomsEn: ['Zain Jordan', 'Orange Jordan', 'Uminiah'],
    banksAr: ['البنك العربي', 'بنك الإسكان', 'بنك كليك الرديف', 'بنك الاتحاد'],
    banksEn: ['Arab Bank', 'Housing Bank', 'CliQ Instant', 'Bank al Etihad'],
    supportPhone: '+962 6 560 0000',
    speedLimit: 100,
    minCarModel: 2021,
    maxPassengers: 4,
    taxPercent: 16,
    defaultCommissionRate: 1.5,
    defaultPassengerFarePerSeat: 3.0,
    systemWalletNumber: '0790000100',
    systemCliQPhone: '0799998888',
    systemCliQAlias: 'ADAM.CLIQ',
    systemBankAccountNumber: 'JO89ARAB00000012345678901234',
    systemBankName: 'البنك العربي (Arab Bank)',
    intraCityConfig: {
      ratePerKm: 0.29,
      ratePerMin: 0.06,
      minFare: 1.55,
      commissionRatePercent: 25,
      activeMultiplier: 1.0,
    },
    locations: [
      {
        governorate: "عمان (Amman)",
        pickupPoints: ["الدوار السابع (محطة جت)", "بوابة الجامعة الأردنية", "مجمع الشمال (طبربور)", "دوار الداخلية"],
        districts: [
          { name: "لواء قصبة عمان", villages: ["جبل عمان", "العبدلي", "الدوار السابع", "جبل اللويبدة", "وسط البلد"] },
          { name: "لواء الجامعة", villages: ["الجبيهة", "تلاع العلي", "صويلح", "أبو نصير", "ضاحية الرشيد", "شفا بدران"] },
          { name: "لواء ماركا", villages: ["ماركا الشمالية", "ماركا الجنوبية", "طارق", "صالحية العابد", "النصر"] },
          { name: "لواء القويسمة", villages: ["القويسمة", "أبو علندا", "الجويدة", "خريبة السوق"] }
        ]
      },
      {
        governorate: "إربد (Irbid)",
        pickupPoints: ["مجمع عمان الجديد", "بوابة جامعة اليرموك الشمالية", "دوار الثقافة"],
        districts: [
          { name: "لواء قصبة إربد", villages: ["الحصن", "الصريح", "إيدون", "بشرى", "البارحة"] },
          { name: "لواء بني عبيد", villages: ["النعيمة", "شطنا", "كتم", "كفر يوبا"] },
          { name: "لواء الرمثا", villages: ["الرمثا", "البويضة", "الشجرة", "الطرة"] },
          { name: "لواء الكورة", villages: ["دير أبي سعيد", "كفر الماء", "سموع", "جنين الصفا"] }
        ]
      },
      {
        governorate: "الزرقاء (Zarqa)",
        districts: [
          { name: "لواء قصبة الزرقاء", villages: ["الوسط التجاري", "الزرقاء الجديدة", "حي معصوم", "وادي الحجر", "الجبل الأبيض"] },
          { name: "لواء الرصيفة", villages: ["حي الرشيد", "الجبل الشمالي", "ياجوز", "عوجان"] },
          { name: "لواء الهاشمية", villages: ["الهاشمية", "السخنة", "قرية غريسا"] }
        ]
      },
      {
        governorate: "البلقاء (Balqa)",
        districts: [
          { name: "لواء قصبة السلط", villages: ["السلالم", "العيزرية", "شفا العامرية", "بلدية السلط", "اليحودية"] },
          { name: "لواء عين الباشا", villages: ["عين الباشا", "مخيم البقعة", "صافوط", "أم الدنانير"] }
        ]
      }
    ]
  },
  {
    code: 'SA',
    nameAr: 'العربية السعودية',
    nameEn: 'Saudi Arabia',
    flag: '🇸🇦',
    currencyAr: 'ر.س',
    currencyEn: 'SAR',
    telecomsAr: ['إس تي سي (STC)', 'موبايلي (Mobily)', 'زين السعودية (Zain KSA)'],
    telecomsEn: ['stc', 'Mobily', 'Zain KSA'],
    banksAr: ['مصرف الراجحي', 'البنك الأهلي السعودي', 'بنك الرياض', 'إس تي سي باي'],
    banksEn: ['Al Rajhi Bank', 'Saudi National Bank', 'Riyadh Bank', 'stc pay'],
    supportPhone: '+966 9200 00000',
    speedLimit: 120,
    minCarModel: 2022,
    maxPassengers: 4,
    taxPercent: 15,
    defaultCommissionRate: 8.0,
    defaultPassengerFarePerSeat: 20.0,
    systemWalletNumber: '0500001000',
    systemCliQPhone: '0509998888',
    systemCliQAlias: 'ADAM.PAYSA',
    systemBankAccountNumber: 'SA89RIYA00000012345678901234',
    systemBankName: 'مصرف الراجحي (Al Rajhi Bank)',
    intraCityConfig: {
      ratePerKm: 1.80,
      ratePerMin: 0.40,
      minFare: 10.0,
      commissionRatePercent: 20,
      activeMultiplier: 1.0,
    },
    locations: [
      {
        governorate: "منطقة الرياض (Riyadh Region)",
        districts: [
          { name: "بلدية العليا", villages: ["حي العليا", "حي السليمانية", "حي المربع", "حي النخيل"] },
          { name: "بلدية الشفاء", villages: ["حي الشفاء", "حي بدر", "حي الحزم"] }
        ]
      },
      {
        governorate: "منطقة مكة (Makkah Region)",
        districts: [
          { name: "بلدية جدة قصبة", villages: ["حي الحمراء", "حي الروضة", "حي الخالدية", "البلد والتاريخية", "حي النعيم"] },
          { name: "منطقة مكة القدسة", villages: ["حي العزيزية", "حي الشوقية", "حي العوالي", "حي بطحاء قريش"] }
        ]
      },
      {
        governorate: "المنطقة الشرقية (Eastern Province)",
        districts: [
          { name: "بلدية الدمام", villages: ["حي الشاطئ", "حي الزهور", "حي الفيصلية", "حي النور"] }
        ]
      }
    ]
  },
  {
    code: 'EG',
    nameAr: 'جمهورية مصر',
    nameEn: 'Egypt',
    flag: '🇪🇬',
    currencyAr: 'ج.م',
    currencyEn: 'EGP',
    telecomsAr: ['فودافون مصر (Vodafone)', 'اتصالات من إي آند (Etisalat)', 'أورنج مصر (Orange)', 'المصرية للاتصالات (WE)'],
    telecomsEn: ['Vodafone Egypt', 'Etisalat Egypt', 'Orange Egypt', 'WE Egypt'],
    banksAr: ['البنك الأهلي المصري', 'بنك مصر', 'فودافون كاش المعززة', 'بنك CIB'],
    banksEn: ['National Bank of Egypt', 'Banque Misr', 'Vodafone Cash', 'CIB Egypt'],
    supportPhone: '+20 2 19000',
    speedLimit: 90,
    minCarModel: 2018,
    maxPassengers: 4,
    taxPercent: 14,
    defaultCommissionRate: 20.0,
    defaultPassengerFarePerSeat: 60.0,
    systemWalletNumber: '01000002000',
    systemCliQPhone: '01000998888',
    systemCliQAlias: 'ADAM.CASH',
    systemBankAccountNumber: 'EG89MISR00000012345678901234',
    systemBankName: 'البنك الأهلي المصري (NBE)',
    intraCityConfig: {
      ratePerKm: 5.50,
      ratePerMin: 1.20,
      minFare: 20.0,
      commissionRatePercent: 15,
      activeMultiplier: 1.0,
    },
    locations: [
      {
        governorate: "محافظة القاهرة (Cairo)",
        districts: [
          { name: "قسم شرق القاهرة", villages: ["مصر الجديدة", "المعادي", "الزمالك", "التجمع الخامس", "وسط البلد"] }
        ]
      },
      {
        governorate: "محافظة الجيزة (Giza)",
        districts: [
          { name: "قسم الدقي والمهندسين", villages: ["حي الدقي", "حي المهندسين", "شارع الهرم", "فيصل البلد", "الشيخ زايد"] }
        ]
      },
      {
        governorate: "محافظة الإسكندرية (Alexandria)",
        districts: [
          { name: "قسم أول الرمل", villages: ["سموحة الجديدة", "حي جيليم", "حي ميامي", "شاطئ المنتزه", "محرم بك"] }
        ]
      }
    ]
  },
  {
    code: 'AE',
    nameAr: 'الإمارات العربية',
    nameEn: 'United Arab Emirates',
    flag: '🇦🇪',
    currencyAr: 'د.إ',
    currencyEn: 'AED',
    telecomsAr: ['اتصالات من إي آند (e&)', 'دو (du)', 'فيرجن موبايل (Virgin Mobile)'],
    telecomsEn: ['e& UAE', 'du Telecom', 'Virgin Mobile UAE'],
    banksAr: ['بنك الإمارات دبي الوطني', 'بنك أبوظبي الأول', 'بنك دبي الإسلامي', 'رصيد إي آند باي'],
    banksEn: ['Emirates NBD', 'First Abu Dhabi Bank', 'Dubai Islamic Bank', 'e& money'],
    supportPhone: '+971 4 300 0000',
    speedLimit: 120,
    minCarModel: 2023,
    maxPassengers: 4,
    taxPercent: 5,
    defaultCommissionRate: 5.0,
    defaultPassengerFarePerSeat: 15.0,
    systemWalletNumber: '0540001000',
    systemCliQPhone: '0549998888',
    systemCliQAlias: 'ADAM.EPAY',
    systemBankAccountNumber: 'AE89ENBD00000012345678901234',
    systemBankName: 'بنك الإمارات دبي الوطني (ENBD)',
    intraCityConfig: {
      ratePerKm: 2.20,
      ratePerMin: 0.50,
      minFare: 12.0,
      commissionRatePercent: 18,
      activeMultiplier: 1.0,
    },
    locations: [
      {
        governorate: "إمارة دبي (Dubai)",
        districts: [
          { name: "منطقة بردبي", villages: ["حي البرشاء", "منطقة ديرة العريقة", "حي جي بي آر", "المارينا", "وسط دبي داون تاون"] }
        ]
      },
      {
        governorate: "إمارة أبوظبي (Abu Dhabi)",
        districts: [
          { name: "منطقة قصر الحصن", villages: ["حي الخالدية", "شارع المرور", "جزيرة ياس الترفيهية", "كورنيش أبوظبي", "جزيرة السعديات"] }
        ]
      }
    ]
  }
];

const WORLD_COUNTRIES_BASE = [
  { code: 'AF', flag: '🇦🇫', nameAr: 'أفغانستان', nameEn: 'Afghanistan', currencyAr: 'أفغاني', currencyEn: 'AFN' },
  { code: 'AL', flag: '🇦🇱', nameAr: 'ألبانيا', nameEn: 'Albania', currencyAr: 'ليك', currencyEn: 'ALL' },
  { code: 'DZ', flag: '🇩🇿', nameAr: 'الجزائر', nameEn: 'Algeria', currencyAr: 'د.ج', currencyEn: 'DZD' },
  { code: 'AD', flag: '🇦🇩', nameAr: 'أندورا', nameEn: 'Andorra', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'AO', flag: '🇦🇴', nameAr: 'أنغولا', nameEn: 'Angola', currencyAr: 'كوانزا', currencyEn: 'AOA' },
  { code: 'AG', flag: '🇦🇬', nameAr: 'أنتيغوا وبربودا', nameEn: 'Antigua and Barbuda', currencyAr: 'دولار كاريبي', currencyEn: 'XCD' },
  { code: 'AR', flag: '🇦🇷', nameAr: 'الأرجنتين', nameEn: 'Argentina', currencyAr: 'بيزو', currencyEn: 'ARS' },
  { code: 'AM', flag: '🇦🇲', nameAr: 'أرمينيا', nameEn: 'Armenia', currencyAr: 'درام', currencyEn: 'AMD' },
  { code: 'AU', flag: '🇦🇺', nameAr: 'أستراليا', nameEn: 'Australia', currencyAr: 'دولار أسترالي', currencyEn: 'AUD' },
  { code: 'AT', flag: '🇦🇹', nameAr: 'النمسا', nameEn: 'Austria', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'AZ', flag: '🇦🇿', nameAr: 'أذربيجان', nameEn: 'Azerbaijan', currencyAr: 'مانات', currencyEn: 'AZN' },
  { code: 'BS', flag: '🇧🇸', nameAr: 'الباهاما', nameEn: 'Bahamas', currencyAr: 'دولار باهامي', currencyEn: 'BSD' },
  { code: 'BH', flag: '🇧🇭', nameAr: 'البحرين', nameEn: 'Bahrain', currencyAr: 'د.ب', currencyEn: 'BHD' },
  { code: 'BD', flag: '🇧🇩', nameAr: 'بنجلاديش', nameEn: 'Bangladesh', currencyAr: 'تاكا', currencyEn: 'BDT' },
  { code: 'BB', flag: '🇧🇧', nameAr: 'باربادوس', nameEn: 'Barbados', currencyAr: 'دولار باربادوسي', currencyEn: 'BBD' },
  { code: 'BY', flag: '🇧🇾', nameAr: 'بيلاروسيا', nameEn: 'Belarus', currencyAr: 'روبل', currencyEn: 'BYN' },
  { code: 'BE', flag: '🇧🇪', nameAr: 'بلجيكا', nameEn: 'Belgium', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'BZ', flag: '🇧🇿', nameAr: 'بليز', nameEn: 'Belize', currencyAr: 'دولار بليزي', currencyEn: 'BZD' },
  { code: 'BJ', flag: '🇧🇯', nameAr: 'بنين', nameEn: 'Benin', currencyAr: 'فرنك', currencyEn: 'XOF' },
  { code: 'BT', flag: '🇧🇹', nameAr: 'بوتان', nameEn: 'Bhutan', currencyAr: 'نغولترم', currencyEn: 'BTN' },
  { code: 'BO', flag: '🇧🇴', nameAr: 'بوليفيا', nameEn: 'Bolivia', currencyAr: 'بوليفاريو', currencyEn: 'BOB' },
  { code: 'BA', flag: '🇧🇦', nameAr: 'البوسنة والهرسك', nameEn: 'Bosnia and Herzegovina', currencyAr: 'مارك', currencyEn: 'BAM' },
  { code: 'BW', flag: '🇧🇼', nameAr: 'بوتسوانا', nameEn: 'Botswana', currencyAr: 'بولا', currencyEn: 'BWP' },
  { code: 'BR', flag: '🇧🇷', nameAr: 'البرازيل', nameEn: 'Brazil', currencyAr: 'ريال', currencyEn: 'BRL' },
  { code: 'BN', flag: '🇧🇳', nameAr: 'بروناي', nameEn: 'Brunei', currencyAr: 'دولار بروناي', currencyEn: 'BND' },
  { code: 'BG', flag: '🇧🇬', nameAr: 'بلغاريا', nameEn: 'Bulgaria', currencyAr: 'ليف', currencyEn: 'BGN' },
  { code: 'BF', flag: '🇧🇫', nameAr: 'بوركينا فاسو', nameEn: 'Burkina Faso', currencyAr: 'فرنك', currencyEn: 'XOF' },
  { code: 'BI', flag: '🇧🇮', nameAr: 'بوروندي', nameEn: 'Burundi', currencyAr: 'فرنك بوروندي', currencyEn: 'BIF' },
  { code: 'KH', flag: '🇰🇭', nameAr: 'كمبوديا', nameEn: 'Cambodia', currencyAr: 'ريالكمبودي', currencyEn: 'KHR' },
  { code: 'CM', flag: '🇨🇲', nameAr: 'الكاميرون', nameEn: 'Cameroon', currencyAr: 'فرنك', currencyEn: 'XAF' },
  { code: 'CA', flag: '🇨🇦', nameAr: 'كندا', nameEn: 'Canada', currencyAr: 'دولار كندي', currencyEn: 'CAD' },
  { code: 'CV', flag: '🇨🇻', nameAr: 'الرأس الأخضر', nameEn: 'Cape Verde', currencyAr: 'إسكودو', currencyEn: 'CVE' },
  { code: 'CF', flag: '🇨🇫', nameAr: 'جمهورية أفريقيا الوسطى', nameEn: 'Central African Republic', currencyAr: 'فرنك', currencyEn: 'XAF' },
  { code: 'TD', flag: '🇹🇩', nameAr: 'تشاد', nameEn: 'Chad', currencyAr: 'فرنك', currencyEn: 'XAF' },
  { code: 'CL', flag: '🇨🇱', nameAr: 'تشيلي', nameEn: 'Chile', currencyAr: 'بيزو', currencyEn: 'CLP' },
  { code: 'CN', flag: '🇨🇳', nameAr: 'الصين', nameEn: 'China', currencyAr: 'يوان', currencyEn: 'CNY' },
  { code: 'CO', flag: '🇨🇴', nameAr: 'كولومبيا', nameEn: 'Colombia', currencyAr: 'بيزو', currencyEn: 'COP' },
  { code: 'KM', flag: '🇰🇲', nameAr: 'جزر القمر', nameEn: 'Comoros', currencyAr: 'فرنك', currencyEn: 'KMF' },
  { code: 'CG', flag: '🇨🇬', nameAr: 'الكونغو', nameEn: 'Congo', currencyAr: 'فرنك', currencyEn: 'XAF' },
  { code: 'CR', flag: '🇨🇷', nameAr: 'كوستاريكا', nameEn: 'Costa Rica', currencyAr: 'كولون', currencyEn: 'CRC' },
  { code: 'HR', flag: '🇭🇷', nameAr: 'كرواتيا', nameEn: 'Croatia', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'CU', flag: '🇨🇺', nameAr: 'كوبا', nameEn: 'Cuba', currencyAr: 'بيزو كوبي', currencyEn: 'CUP' },
  { code: 'CY', flag: '🇨🇾', nameAr: 'قبرص', nameEn: 'Cyprus', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'CZ', flag: '🇨🇿', nameAr: 'التشيك', nameEn: 'Czech Republic', currencyAr: 'كورونا', currencyEn: 'CZK' },
  { code: 'DK', flag: '🇩🇰', nameAr: 'الدنمارك', nameEn: 'Denmark', currencyAr: 'كرونة', currencyEn: 'DKK' },
  { code: 'DJ', flag: '🇩🇯', nameAr: 'جيبوتي', nameEn: 'Djibouti', currencyAr: 'فرنك', currencyEn: 'DJF' },
  { code: 'DM', flag: '🇩🇲', nameAr: 'دومينيكا', nameEn: 'Dominica', currencyAr: 'دولار كاريبي', currencyEn: 'XCD' },
  { code: 'DO', flag: '🇩🇴', nameAr: 'جمهورية الدومينيكان', nameEn: 'Dominican Republic', currencyAr: 'بيزو', currencyEn: 'DOP' },
  { code: 'EC', flag: '🇪🇨', nameAr: 'الإكوادور', nameEn: 'Ecuador', currencyAr: 'دولار أمريكي', currencyEn: 'USD' },
  { code: 'SV', flag: '🇸🇻', nameAr: 'السلفادور', nameEn: 'El Salvador', currencyAr: 'دولار أمريكي', currencyEn: 'USD' },
  { code: 'GQ', flag: '🇬🇶', nameAr: 'غينيا الاستوائية', nameEn: 'Equatorial Guinea', currencyAr: 'فرنك', currencyEn: 'XAF' },
  { code: 'ER', flag: '🇪🇷', nameAr: 'إريتريا', nameEn: 'Eritrea', currencyAr: 'ناكفا', currencyEn: 'ERN' },
  { code: 'EE', flag: '🇪🇪', nameAr: 'إستونيا', nameEn: 'Estonia', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'SZ', flag: '🇸🇿', nameAr: 'إسواتيني', nameEn: 'Eswatini', currencyAr: 'ليلانغيني', currencyEn: 'SZL' },
  { code: 'ET', flag: '🇪🇹', nameAr: 'إثيوبيا', nameEn: 'Ethiopia', currencyAr: 'بير', currencyEn: 'ETB' },
  { code: 'FJ', flag: '🇫يج', nameAr: 'فيجي', nameEn: 'Fiji', currencyAr: 'دولار فيجي', currencyEn: 'FJD' },
  { code: 'FI', flag: '🇫🇮', nameAr: 'فنلندا', nameEn: 'Finland', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'FR', flag: '🇫🇷', nameAr: 'فرنسا', nameEn: 'France', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'GA', flag: '🇬🇦', nameAr: 'الغابون', nameEn: 'Gabon', currencyAr: 'فرنك', currencyEn: 'XAF' },
  { code: 'GM', flag: '🇬🇲', nameAr: 'غامبيا', nameEn: 'Gambia', currencyAr: 'دالاسي', currencyEn: 'GMD' },
  { code: 'GE', flag: '🇬🇪', nameAr: 'جورجيا', nameEn: 'Georgia', currencyAr: 'لاري', currencyEn: 'GEL' },
  { code: 'DE', flag: '🇩🇪', nameAr: 'ألمانيا', nameEn: 'Germany', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'GH', flag: '🇬🇭', nameAr: 'غانا', nameEn: 'Ghana', currencyAr: 'سيدي', currencyEn: 'GHS' },
  { code: 'GR', flag: '🇬🇷', nameAr: 'اليونان', nameEn: 'Greece', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'GD', flag: '🇬🇩', nameAr: 'غرينادا', nameEn: 'Grenada', currencyAr: 'دولار كاريبي', currencyEn: 'XCD' },
  { code: 'GT', flag: '🇬🇹', nameAr: 'غواتيمالا', nameEn: 'Guatemala', currencyAr: 'كويتزال', currencyEn: 'GTQ' },
  { code: 'GN', flag: '🇬🇳', nameAr: 'غينيا', nameEn: 'Guinea', currencyAr: 'فرنك غيني', currencyEn: 'GNF' },
  { code: 'GW', flag: '🇬🇼', nameAr: 'غينيا بيساو', nameEn: 'Guinea-Bissau', currencyAr: 'فرنك بيساو', currencyEn: 'XOF' },
  { code: 'GY', flag: '🇬🇾', nameAr: 'غويانا', nameEn: 'Guyana', currencyAr: 'دولار غوياني', currencyEn: 'GYD' },
  { code: 'HT', flag: '🇭🇹', nameAr: 'هايتي', nameEn: 'Haiti', currencyAr: 'غورد', currencyEn: 'HTG' },
  { code: 'HN', flag: '🇭🇳', nameAr: 'هندوراس', nameEn: 'Honduras', currencyAr: 'لمبيرا', currencyEn: 'HNL' },
  { code: 'HU', flag: '🇭🇺', nameAr: 'المجر', nameEn: 'Hungary', currencyAr: 'فورينت', currencyEn: 'HUF' },
  { code: 'IS', flag: '🇮🇸', nameAr: 'آيسلندا', nameEn: 'Iceland', currencyAr: 'كرونة آيسلندية', currencyEn: 'ISK' },
  { code: 'IN', flag: '🇮🇳', nameAr: 'الهند', nameEn: 'India', currencyAr: 'روبية', currencyEn: 'INR' },
  { code: 'ID', flag: '🇮🇩', nameAr: 'إندونيسيا', nameEn: 'Indonesia', currencyAr: 'روبية', currencyEn: 'IDR' },
  { code: 'IR', flag: '🇮🇷', nameAr: 'إيران', nameEn: 'Iran', currencyAr: 'ريال إيراني', currencyEn: 'IRR' },
  { code: 'IQ', flag: '🇮🇶', nameAr: 'العراق', nameEn: 'Iraq', currencyAr: 'د.ع', currencyEn: 'IQD' },
  { code: 'IE', flag: '🇮🇪', nameAr: 'أيرلندا', nameEn: 'Ireland', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'IT', flag: '🇮🇹', nameAr: 'إيطاليا', nameEn: 'Italy', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'JM', flag: '🇯🇲', nameAr: 'جامايكا', nameEn: 'Jamaica', currencyAr: 'دولار جامايكي', currencyEn: 'JMD' },
  { code: 'JP', flag: '🇯🇵', nameAr: 'اليابان', nameEn: 'Japan', currencyAr: 'ين', currencyEn: 'JPY' },
  { code: 'KZ', flag: '🇰🇿', nameAr: 'كازاخستان', nameEn: 'Kazakhstan', currencyAr: 'تينغ', currencyEn: 'KZT' },
  { code: 'KE', flag: '🇰🇪', nameAr: 'كينيا', nameEn: 'Kenya', currencyAr: 'شلن كيني', currencyEn: 'KES' },
  { code: 'KI', flag: '🇰🇮', nameAr: 'كيريباتي', nameEn: 'Kiribati', currencyAr: 'دولار أسترالي', currencyEn: 'AUD' },
  { code: 'KP', flag: '🇰🇵', nameAr: 'كوريا الشمالية', nameEn: 'North Korea', currencyAr: 'وون', currencyEn: 'KPW' },
  { code: 'KR', flag: '🇰🇷', nameAr: 'كوريا الجنوبية', nameEn: 'South Korea', currencyAr: 'وون', currencyEn: 'KRW' },
  { code: 'KW', flag: '🇰🇼', nameAr: 'الكويت', nameEn: 'Kuwait', currencyAr: 'د.ك', currencyEn: 'KWD' },
  { code: 'KG', flag: '🇰🇬', nameAr: 'قرغيزستان', nameEn: 'Kyrgyzstan', currencyAr: 'سوم', currencyEn: 'KGS' },
  { code: 'LA', flag: '🇱🇦', nameAr: 'لاوس', nameEn: 'Laos', currencyAr: 'كيب', currencyEn: 'LAK' },
  { code: 'LV', flag: '🇱🇻', nameAr: 'لاتفيا', nameEn: 'Latvia', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'LB', flag: '🇱🇧', nameAr: 'لبنان', nameEn: 'Lebanon', currencyAr: 'ل.ل', currencyEn: 'LBP' },
  { code: 'LS', flag: '🇱🇸', nameAr: 'ليسوتو', nameEn: 'Lesotho', currencyAr: 'لوتي', currencyEn: 'LSL' },
  { code: 'LR', flag: '🇱🇷', nameAr: 'ليبيريا', nameEn: 'Liberia', currencyAr: 'دولار ليبيري', currencyEn: 'LRD' },
  { code: 'LY', flag: '🇱🇾', nameAr: 'ليبيا', nameEn: 'Libya', currencyAr: 'د.ل', currencyEn: 'LYD' },
  { code: 'LI', flag: '🇱🇮', nameAr: 'ليختنشتاين', nameEn: 'Liechtenstein', currencyAr: 'فرنك سويسري', currencyEn: 'CHF' },
  { code: 'LT', flag: '🇱🇹', nameAr: 'ليتوانيا', nameEn: 'Lithuania', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'LU', flag: '🇱🇺', nameAr: 'لوكسمبورغ', nameEn: 'Luxembourg', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'MG', flag: '🇲🇬', nameAr: 'مدغشقر', nameEn: 'Madagascar', currencyAr: 'أرياري', currencyEn: 'MGA' },
  { code: 'MW', flag: '🇲🇼', nameAr: 'ملاوي', nameEn: 'Malawi', currencyAr: 'كواشا', currencyEn: 'MWK' },
  { code: 'MY', flag: '🇲🇾', nameAr: 'ماليزيا', nameEn: 'Malaysia', currencyAr: 'رينغيت', currencyEn: 'MYR' },
  { code: 'MV', flag: '🇲🇻', nameAr: 'جزر المالديف', nameEn: 'Maldives', currencyAr: 'روفية', currencyEn: 'MVR' },
  { code: 'ML', flag: '🇲🇱', nameAr: 'مالي', nameEn: 'Mali', currencyAr: 'فرنك', currencyEn: 'XOF' },
  { code: 'MT', flag: '🇲🇹', nameAr: 'مالطا', nameEn: 'Malta', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'MH', flag: '🇲🇭', nameAr: 'جزر مارشال', nameEn: 'Marshall Islands', currencyAr: 'دولار أمريكي', currencyEn: 'USD' },
  { code: 'MR', flag: '🇲🇷', nameAr: 'موريتانيا', nameEn: 'Mauritania', currencyAr: 'أوقية', currencyEn: 'MRU' },
  { code: 'MU', flag: '🇲🇺', nameAr: 'موريشيوس', nameEn: 'Mauritius', currencyAr: 'روبية موريشية', currencyEn: 'MUR' },
  { code: 'MX', flag: '🇲🇽', nameAr: 'المكسيك', nameEn: 'Mexico', currencyAr: 'بيزو مكسيكي', currencyEn: 'MXN' },
  { code: 'FM', flag: '🇫🇲', nameAr: 'ولايات ميكرونيسيا المتحدة', nameEn: 'Micronesia', currencyAr: 'دولار أمريكي', currencyEn: 'USD' },
  { code: 'MD', flag: '🇲🇩', nameAr: 'مولدوفا', nameEn: 'Moldova', currencyAr: 'ليو', currencyEn: 'MDL' },
  { code: 'MC', flag: '🇲🇨', nameAr: 'موناكو', nameEn: 'Monaco', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'MN', flag: '🇲🇳', nameAr: 'منغوليا', nameEn: 'Mongolia', currencyAr: 'توغروغ', currencyEn: 'MNT' },
  { code: 'ME', flag: '🇲🇪', nameAr: 'الجبل الأسود', nameEn: 'Montenegro', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'MA', flag: '🇲🇦', nameAr: 'المغرب', nameEn: 'Morocco', currencyAr: 'د.م.', currencyEn: 'MAD' },
  { code: 'MZ', flag: '🇲🇿', nameAr: 'موزمبيق', nameEn: 'Mozambique', currencyAr: 'متكال', currencyEn: 'MZN' },
  { code: 'MM', flag: '🇲🇲', nameAr: 'میانمار', nameEn: 'Myanmar', currencyAr: 'كيات', currencyEn: 'MMK' },
  { code: 'NA', flag: '🇳🇦', nameAr: 'ناميبيا', nameEn: 'Namibia', currencyAr: 'دولار ناميبي', currencyEn: 'NAD' },
  { code: 'NR', flag: '🇳🇷', nameAr: 'ناورو', nameEn: 'Nauru', currencyAr: 'دولار أسترالي', currencyEn: 'AUD' },
  { code: 'NP', flag: '🇳🇵', nameAr: 'نيبال', nameEn: 'Nepal', currencyAr: 'روبية نيبالية', currencyEn: 'NPR' },
  { code: 'NL', flag: '🇳🇱', nameAr: 'هولندا', nameEn: 'Netherlands', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'NZ', flag: '🇳🇿', nameAr: 'نيوزيلندا', nameEn: 'New Zealand', currencyAr: 'دولار نيوزيلندي', currencyEn: 'NZD' },
  { code: 'NI', flag: '🇳🇮', nameAr: 'نيكاراجوا', nameEn: 'Nicaragua', currencyAr: 'كوردوبا', currencyEn: 'NIO' },
  { code: 'NE', flag: '🇳🇪', nameAr: 'النيجر', nameEn: 'Niger', currencyAr: 'فرنك', currencyEn: 'XOF font-mono' },
  { code: 'NG', flag: '🇳🇬', nameAr: 'نيجيريا', nameEn: 'Nigeria', currencyAr: 'نايرا', currencyEn: 'NGN' },
  { code: 'MK', flag: '🇲🇰', nameAr: 'مقدونيا الشمالية', nameEn: 'North Macedonia', currencyAr: 'دينار مقدوني', currencyEn: 'MKD' },
  { code: 'NO', flag: '🇳🇴', nameAr: 'النرويج', nameEn: 'Norway', currencyAr: 'كرونة نرويجية', currencyEn: 'NOK' },
  { code: 'OM', flag: '🇴🇲', nameAr: 'عُمان', nameEn: 'Oman', currencyAr: 'ر.ع.', currencyEn: 'OMR' },
  { code: 'PK', flag: '🇵🇰', nameAr: 'باكستان', nameEn: 'Pakistan', currencyAr: 'روبية باكستانية', currencyEn: 'PKR' },
  { code: 'PW', flag: '🇵🇼', nameAr: 'بالاو', nameEn: 'Palau', currencyAr: 'دولار أمريكي', currencyEn: 'USD' },
  { code: 'PS', flag: '🇵🇸', nameAr: 'فلسطين', nameEn: 'Palestine', currencyAr: 'شيكل قسيم', currencyEn: 'ILS' },
  { code: 'PA', flag: '🇵🇦', nameAr: 'بنما', nameEn: 'Panama', currencyAr: 'بالبوا', currencyEn: 'PAB' },
  { code: 'PG', flag: '🇵🇬', nameAr: 'بابوا غينيا الجديدة', nameEn: 'Papua New Guinea', currencyAr: 'كينا', currencyEn: 'PGK' },
  { code: 'PY', flag: '🇵🇾', nameAr: 'باراغواي', nameEn: 'Paraguay', currencyAr: 'غواراني', currencyEn: 'PYG' },
  { code: 'PE', flag: '🇵🇪', nameAr: 'بيرو', nameEn: 'Peru', currencyAr: 'سول', currencyEn: 'PEN' },
  { code: 'PH', flag: '🇵🇭', nameAr: 'الفلبين', nameEn: 'Philippines', currencyAr: 'بيزو فلبيني', currencyEn: 'PHP' },
  { code: 'PL', flag: '🇵🇱', nameAr: 'بولندا', nameEn: 'Poland', currencyAr: 'زلوتي', currencyEn: 'PLN' },
  { code: 'PT', flag: '🇵🇹', nameAr: 'البرتغال', nameEn: 'Portugal', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'QA', flag: '🇶🇦', nameAr: 'قطر', nameEn: 'Qatar', currencyAr: 'ر.ق', currencyEn: 'QAR' },
  { code: 'RO', flag: '🇷🇴', nameAr: 'رومانيا', nameEn: 'Romania', currencyAr: 'ليو روماني', currencyEn: 'RON' },
  { code: 'RU', flag: '🇷🇺', nameAr: 'روسيا', nameEn: 'Russia', currencyAr: 'روبل', currencyEn: 'RUB' },
  { code: 'RW', flag: '🇷🇼', nameAr: 'رواندا', nameEn: 'Rwanda', currencyAr: 'فرنك رواندي', currencyEn: 'RWF' },
  { code: 'KN', flag: '🇰🇳', nameAr: 'سانت كيتس ونيفس', nameEn: 'Saint Kitts and Nevis', currencyAr: 'دولار كاريبي', currencyEn: 'XCD' },
  { code: 'LC', flag: '🇱🇨', nameAr: 'سانت لوسيا', nameEn: 'Saint Lucia', currencyAr: 'دولار كاريبي', currencyEn: 'XCD' },
  { code: 'VC', flag: '🇻🇨', nameAr: 'سانت فينسنت وغرينادين', nameEn: 'Saint Vincent and the Grenadines', currencyAr: 'دولار كاريبي', currencyEn: 'XCD' },
  { code: 'WS', flag: '🇼🇸', nameAr: 'ساموا', nameEn: 'Samoa', currencyAr: 'تالا Samoa', currencyEn: 'WST' },
  { code: 'SM', flag: '🇸🇲', nameAr: 'سان مارينو', nameEn: 'San Marino', currencyAr: 'يورو', currencyEn: 'EUR font-mono' },
  { code: 'ST', flag: '🇸🇹', nameAr: 'ساو تومي وبرينسيب', nameEn: 'Sao Tome and Principe', currencyAr: 'دوبرا', currencyEn: 'STN' },
  { code: 'SN', flag: '🇸🇳', nameAr: 'السنغال', nameEn: 'Senegal', currencyAr: 'فرنك', currencyEn: 'XOF' },
  { code: 'RS', flag: '🇷🇸', nameAr: 'صربيا', nameEn: 'Serbia', currencyAr: 'دينار صربي', currencyEn: 'RSD' },
  { code: 'SC', flag: '🇸🇨', nameAr: 'سيشل', nameEn: 'Seychelles', currencyAr: 'روبية سيشلية', currencyEn: 'SCR' },
  { code: 'SL', flag: '🇸🇱', nameAr: 'سيراليون', nameEn: 'Sierra Leone', currencyAr: 'ليون', currencyEn: 'SLL' },
  { code: 'SG', flag: '🇸🇬', nameAr: 'سنغافورة', nameEn: 'Singapore', currencyAr: 'دولار سنغافوري', currencyEn: 'SGD' },
  { code: 'SK', flag: '🇸🇰', nameAr: 'سلوفاكيا', nameEn: 'Slovakia', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'SI', flag: '🇸🇮', nameAr: 'سلوفينيا', nameEn: 'Slovenia', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'SB', flag: '🇸🇧', nameAr: 'جزر سليمان', nameEn: 'Solomon Islands', currencyAr: 'دولار جزر سليمان', currencyEn: 'SBD' },
  { code: 'SO', flag: '🇸🇴', nameAr: 'الصومال', nameEn: 'Somalia', currencyAr: 'شلن صومالي', currencyEn: 'SOS' },
  { code: 'ZA', flag: '🇿🇦', nameAr: 'جنوب أفريقيا', nameEn: 'South Africa', currencyAr: 'راند', currencyEn: 'ZAR' },
  { code: 'SS', flag: '🇸🇸', nameAr: 'جنوب السودان', nameEn: 'South Sudan', currencyAr: 'جنيه جنوب السودان', currencyEn: 'SSP' },
  { code: 'ES', flag: '🇪🇸', nameAr: 'إسبانيا', nameEn: 'Spain', currencyAr: 'يورو', currencyEn: 'EUR' },
  { code: 'LK', flag: '🇱🇰', nameAr: 'سريلانكا', nameEn: 'Sri Lanka', currencyAr: 'روبية سريلانكية', currencyEn: 'LKR' },
  { code: 'SD', flag: '🇸🇩', nameAr: 'السودان', nameEn: 'Sudan', currencyAr: 'جنيه سوداني', currencyEn: 'SDG' },
  { code: 'SR', flag: '🇸🇷', nameAr: 'سورينام', nameEn: 'Suriname', currencyAr: 'دولار سورينامي', currencyEn: 'SRD' },
  { code: 'SE', flag: '🇸🇪', nameAr: 'السويد', nameEn: 'Sweden', currencyAr: 'كرونة سويدية', currencyEn: 'SEK' },
  { code: 'CH', flag: '🇨🇭', nameAr: 'سويسرا', nameEn: 'Switzerland', currencyAr: 'فرنك سويسري', currencyEn: 'CHF' },
  { code: 'SY', flag: '🇸🇾', nameAr: 'سوريا', nameEn: 'Syria', currencyAr: 'ل.س', currencyEn: 'SYP' },
  { code: 'TJ', flag: '🇹🇯', nameAr: 'طاجيكستان', nameEn: 'Tajikistan', currencyAr: 'ساماني', currencyEn: 'TJS' },
  { code: 'TZ', flag: '🇹🇿', nameAr: 'تنزانيا', nameEn: 'Tanzania', currencyAr: 'شلن تنزاني', currencyEn: 'TZS' },
  { code: 'TH', flag: '🇹🇭', nameAr: 'تايلاند', nameEn: 'Thailand', currencyAr: 'بات تايلاندي', currencyEn: 'THB' },
  { code: 'TL', flag: '🇹🇱', nameAr: 'تيمور الشرقية', nameEn: 'East Timor', currencyAr: 'دولار أمريكي', currencyEn: 'USD' },
  { code: 'TG', flag: '🇹🇬', nameAr: 'توغو', nameEn: 'Togo', currencyAr: 'فرنك', currencyEn: 'XOF' },
  { code: 'TO', flag: '🇹🇬', nameAr: 'تونغا', nameEn: 'Tonga', currencyAr: 'بانغا', currencyEn: 'TOP' },
  { code: 'TT', flag: '🇹🇹', nameAr: 'ترينيداد وتوباغو', nameEn: 'Trinidad and Tobago', currencyAr: 'دولار ترينيداد وتوباغو', currencyEn: 'TTD' },
  { code: 'TN', flag: '🇹🇳', nameAr: 'تونس', nameEn: 'Tunisia', currencyAr: 'د.ت', currencyEn: 'TND' },
  { code: 'TR', flag: '🇹🇷', nameAr: 'تركيا', nameEn: 'Turkey', currencyAr: 'ليرة تركية', currencyEn: 'TRY' },
  { code: 'TM', flag: '🇹🇲', nameAr: 'تركمانستان', nameEn: 'Turkmenistan', currencyAr: 'مانات تركماني', currencyEn: 'TMT' },
  { code: 'TV', flag: '🇹🇻', nameAr: 'توفالو', nameEn: 'Tuvalu', currencyAr: 'دولار أسترالي', currencyEn: 'AUD' },
  { code: 'UG', flag: '🇺🇬', nameAr: 'أوغندا', nameEn: 'Uganda', currencyAr: 'شلن أوغندي', currencyEn: 'UGX' },
  { code: 'UA', flag: '🇺🇦', nameAr: 'أوكرانيا', nameEn: 'Ukraine', currencyAr: 'هري', currencyEn: 'UAH' },
  { code: 'GB', flag: '🇬🇧', nameAr: 'المملكة المتحدة', nameEn: 'United Kingdom', currencyAr: 'جنيه إسترليني', currencyEn: 'GBP' },
  { code: 'US', flag: '🇺🇸', nameAr: 'الولايات المتحدة', nameEn: 'United States', currencyAr: 'دولار أمريكي', currencyEn: 'USD' },
  { code: 'UY', flag: '🇺🇾', nameAr: 'أوروغواي', nameEn: 'Uruguay', currencyAr: 'بيزو أوروغواياني', currencyEn: 'UYU' },
  { code: 'UZ', flag: '🇺🇿', nameAr: 'أوزبكستان', nameEn: 'Uzbekistan', currencyAr: 'سوم أوزبكي', currencyEn: 'UZS' },
  { code: 'VU', flag: '🇻🇺', nameAr: 'فانواتو', nameEn: 'Vanuatu', currencyAr: 'فاتو', currencyEn: 'VUV' },
  { code: 'VE', flag: '🇻🇪', nameAr: 'فنزويلا', nameEn: 'Venezuela', currencyAr: 'بوليفار', currencyEn: 'VES' },
  { code: 'VN', flag: '🇻🇳', nameAr: 'فيتنام', nameEn: 'Vietnam', currencyAr: 'دونغ فيتنامي', currencyEn: 'VND' },
  { code: 'YE', flag: '🇾🇪', nameAr: 'اليمن', nameEn: 'Yemen', currencyAr: 'ر.ي', currencyEn: 'YER' },
  { code: 'ZM', flag: '🇿🇲', nameAr: 'زامبيا', nameEn: 'Zambia', currencyAr: 'كواشا زامبية', currencyEn: 'ZMW' },
  { code: 'ZW', flag: '🇿🇼', nameAr: 'زيمبابوي', nameEn: 'Zimbabwe', currencyAr: 'دولار زيمبابوي', currencyEn: 'ZWL' }
];

const GENERATED_COUNTRIES: CountryConfig[] = WORLD_COUNTRIES_BASE
  .filter(item => !['JO', 'SA', 'EG', 'AE'].includes(item.code))
  .map(item => ({
    code: item.code,
    nameAr: item.nameAr,
    nameEn: item.nameEn,
    flag: item.flag,
    currencyAr: item.currencyAr,
    currencyEn: item.currencyEn,
    telecomsAr: [`شريحة اتصال لـ ${item.nameAr}`, `شبكة إنترنت لـ ${item.nameAr}`],
    telecomsEn: [`${item.nameEn} Telecom 1`, `${item.nameEn} Mobile Network`],
    banksAr: [`البنك الوطني في ${item.nameAr}`, `المحفظة الرقمية لـ ${item.nameAr}`, `بنك كليك الدولي`],
    banksEn: [`${item.nameEn} National Bank`, `${item.nameEn} Digital Wallet`, `CliQ Global Gateway`],
    supportPhone: '+1 234 567 890',
    speedLimit: 120,
    minCarModel: 2020,
    maxPassengers: 4,
    taxPercent: 10,
    defaultCommissionRate: 10.0,
    defaultPassengerFarePerSeat: 5.0,
    systemWalletNumber: '0900000000',
    systemCliQPhone: '0900000011',
    systemCliQAlias: `ADAM.${item.code}PAY`,
    systemBankAccountNumber: `${item.code}89BANK0000001234567890`,
    systemBankName: `بنك الدولة النشط لـ ${item.nameAr}`,
    intraCityConfig: {
      ratePerKm: 1.50,
      ratePerMin: 0.30,
      minFare: 5.0,
      commissionRatePercent: 15,
      activeMultiplier: 1.0,
    },
    locations: [
      {
        governorate: `${item.nameAr} - المنطقة المركزية (${item.nameEn} Main)`,
        districts: [
          { name: "لواء العاصمة المركزية", villages: ["المنطقة الدبلوماسية", "وسط البلد المالي", "المنطقة التجارية", "المجمع السكني الرئيسي"] }
        ]
      }
    ]
  }));

export const COUNTRIES_DATA: CountryConfig[] = [
  ...FEATURED_COUNTRIES,
  ...GENERATED_COUNTRIES
];

export function getCountry(code: string): CountryConfig {
  try {
    return COUNTRIES_DATA.find(c => c?.code === code) || COUNTRIES_DATA[0] || FEATURED_COUNTRIES[0];
  } catch (e) {
    console.error("Error in getCountry", e);
    return FEATURED_COUNTRIES[0];
  }
}

export function getCountryLocations(code: string): LocationConfig[] {
  try {
    return getCountry(code)?.locations || [];
  } catch (e) {
    console.error("Error in getCountryLocations", e);
    return [];
  }
}

// Maps country x,y simulation points so the live GPS tracker adapts beautifully
export function getCountryLocationCoords(locationName: string | undefined | null, countryCode: string): { x: number; y: number } {
  const safeName = typeof locationName === 'string' ? locationName : '';
  const hash = Array.from(safeName).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Base coordinates depend on country to cluster beautifully on the 400x400 map
  if (countryCode === 'JO') {
    if (safeName.includes("عمان") || safeName.includes("سابع") || safeName.includes("جبيهة") || safeName.includes("تلاع") || safeName.includes("عبدلي")) {
      return { x: 180 + (hash % 40), y: 180 + (hash % 30) };
    }
    if (safeName.includes("إربد") || safeName.includes("حصن") || safeName.includes("صريح") || safeName.includes("إيدون")) {
      return { x: 220 + (hash % 40), y: 70 + (hash % 30) };
    }
    if (safeName.includes("زرقاء") || safeName.includes("رصيفة") || safeName.includes("رشيد") || safeName.includes("ياجوز")) {
      return { x: 290 + (hash % 40), y: 150 + (hash % 30) };
    }
    return { x: 110 + (hash % 40), y: 160 + (hash % 30) };
  } else if (countryCode === 'SA') {
    // Saudi coords clustered differently
    if (safeName.includes("الرياض") || safeName.includes("العليا") || safeName.includes("السليمانية") || safeName.includes("النخيل")) {
      return { x: 190 + (hash % 45), y: 200 + (hash % 45) };
    }
    if (safeName.includes("جدة") || safeName.includes("حمراء") || safeName.includes("روضة") || safeName.includes("النعيم")) {
      return { x: 80 + (hash % 40), y: 250 + (hash % 40) };
    }
    if (safeName.includes("الشرقية") || safeName.includes("الدمام") || safeName.includes("الشاطئ")) {
      return { x: 310 + (hash % 50), y: 210 + (hash % 50) };
    }
    return { x: 150 + (hash % 100), y: 150 + (hash % 100) };
  } else if (countryCode === 'EG') {
    // Egypt coords
    if (safeName.includes("القاهرة") || safeName.includes("المعادي") || safeName.includes("الزمالك") || safeName.includes("التجمع")) {
      return { x: 240 + (hash % 40), y: 220 + (hash % 40) };
    }
    if (safeName.includes("الجيزة") || safeName.includes("دقي") || safeName.includes("مهندسين") || safeName.includes("الهرم")) {
      return { x: 210 + (hash % 40), y: 240 + (hash % 40) };
    }
    if (safeName.includes("الإسكندرية") || safeName.includes("سموحة") || safeName.includes("ميامي") || safeName.includes("محرم")) {
      return { x: 140 + (hash % 45), y: 120 + (hash % 45) };
    }
    return { x: 180 + (hash % 80), y: 180 + (hash % 80) };
  } else if (countryCode === 'AE') {
    // UAE coords
    if (safeName.includes("دبي") || safeName.includes("البرشاء") || safeName.includes("المارينا") || safeName.includes("ديرة")) {
      return { x: 280 + (hash % 40), y: 160 + (hash % 45) };
    }
    if (safeName.includes("أبوظبي") || safeName.includes("الخالدية") || safeName.includes("ياس") || safeName.includes("كورنيش")) {
      return { x: 210 + (hash % 45), y: 210 + (hash % 45) };
    }
    return { x: 240 + (hash % 70), y: 180 + (hash % 70) };
  }

  // Base fallback
  return { 
    x: 120 + (hash % 180),
    y: 120 + ((hash * 7) % 180)
  };
}
