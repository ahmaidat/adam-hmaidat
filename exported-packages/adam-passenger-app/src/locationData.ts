import { LocationConfig } from './types';
import { getCountryLocationCoords } from './countriesData';

export const DEFAULT_LOCATIONS: LocationConfig[] = [
  {
    governorate: "عمان (Amman)",
    pickupPoints: ["الدوار السابع (محطة جت)", "بوابة الجامعة الأردنية", "مجمع الشمال (طبربور)", "دوار الداخلية"],
    districts: [
      {
        name: "لواء قصبة عمان",
        villages: ["جبل عمان", "العبدلي", "الدوار السابع", "جبل اللويبدة", "وسط البلد", "الشميساني"],
        streets: {
          "جبل عمان": ["شارع الرينبو", "شارع الدوار الأول", "شارع الدوار الثاني", "شارع عمر بن الخطاب", "شارع الكلية العلمية الإسلامية"],
          "العبدلي": ["شارع الملك حسين", "شارع سليمان النابلسي", "مجمع العبدلي الجديد", "شارع البوليفارد", "شارع الاستقلال"],
          "الدوار السابع": ["شارع زهران", "شارع عبد الله غوشة", "دوار السابع (محطة جت)", "شارع العمال", "شارع إبراهيم قطان"],
          "جبل اللويبدة": ["شارع الشريعة", "شارع كلية الشريعة", "ميدان باريس", "شارع الباعونية", "شارع ضرار بن الأزور"],
          "وسط البلد": ["شارع الفيصل", "شارع السعادة", "شارع الرضا", "شارع قريش (سوق السكر)", "شارع بسمان", "شارع الهاشمي"],
          "الشميساني": ["شارع الشميساني الرئيسي", "شارع الثقافة", "شارع الشريف عبد الحميد شرف", "شارع عبد الرحيم الواكد", "شارع الملكة نور"]
        }
      },
      {
        name: "لواء الجامعة",
        villages: ["الجبيهة", "تلاع العلي", "صويلح", "أبو نصير", "ضاحية الرشيد", "شفا بدران", "خلدا"],
        streets: {
          "الجبيهة": ["شارع الجامعة الأردنية", "شارع أحمد الطراونة", "شارع الوفاق", "شارع الزيتونة", "مجمع الباص السريع"],
          "تلاع العلي": ["شارع وصفي التل (الجاردنز)", "شارع المدينة المنورة", "شارع خليل السالم", "دوار الواحة", "شارع سوق السلطان"],
          "صويلح": ["شارع عمان-السلط", "شارع صويلح الرئيسي", "دوار صويلح", "شارع الملك عبد الله الأول", "شارع ميسلون"],
          "أبو نصير": ["شارع أبو نصير الرئيسي", "شارع مجمع الدوائر", "شارع مدرسة ابن تيمية"],
          "ضاحية الرشيد": ["شارع الأميرة ثروت", "شارع ابن معصوم", "شارع الأكاديمية", "شارع الضحاك بن قيس"],
          "شفا بدران": ["شارع شفا بدران الرئيسي", "شارع الكوم", "شارع مرج الفرس"],
          "خلدا": ["شارع أسرار", "شارع دابوق", "دوار الكيلو", "شارع الملكة رانيا العبدالله"]
        }
      },
      {
        name: "لواء ماركا",
        villages: ["ماركا الشمالية", "ماركا الجنوبية", "طارق", "صالحية العابد", "النصر"],
        streets: {
          "ماركا الشمالية": ["شارع المطار القديم", "شارع الحزام الدائري", "شارع نادي السباق", "شارع المستودعات"],
          "ماركا الجنوبية": ["شارع اليرموك", "شارع ماركا الجنوبية العام", "شارع الحرية"],
          "طارق": ["شارع طبربور الرئيسي", "شارع مجمع الشمال", "شارع الأقصى", "شارع الشهيد"],
          "صالحية العابد": ["شارع صالحية العابد الرئيسي", "شارع القرية"],
          "النصر": ["شارع النصر الرئيسي", "شارع الأمير حسن"]
        }
      },
      {
        name: "لواء القويسمة",
        villages: ["القويسمة", "أبو علندا", "الجويدة", "خريبة السوق"],
        streets: {
          "القويسمة": ["شارع اليرموك", "شارع الحزام", "شارع ستاد الملك عبد الله", "شارع ناعور القديم"],
          "أبو علندا": ["شارع أبو علندا الرئيسي", "شارع سحاب", "شارع أهل الكهف"],
          "الجويدة": ["شارع مادبا القديم", "شارع الجويدة العام"],
          "خريبة السوق": ["شارع خريبة السوق العام", "شارع الحرية"]
        }
      },
      {
        name: "لواء وادي السير",
        villages: ["بيادر وادي السير", "عبدون", "الصويفية", "وادي السير البلد"],
        streets: {
          "بيادر وادي السير": ["شارع البيادر الرئيسي", "شارع الصناعة", "شارع حسني صوبر", "شارع عطا علي"],
          "عبدون": ["شارع عبدون الشمالي", "دوار عبدون", "شارع دمشق", "شارع القاهرة"],
          "الصويفية": ["شارع الوكالات", "شارع الحمراء", "شارع باريس", "شارع الأميرة عالية"],
          "وادي السير البلد": ["شارع البلدية الرئيسي", "شارع عراق الأمير"]
        }
      },
      {
        name: "لواء الجيزة",
        villages: ["مطار الملكة علياء الدولي (QAIA)", "الجيزة البلد", "أم الرصاص"],
        streets: {
          "مطار الملكة علياء الدولي (QAIA)": ["شارع صالة القادمون", "شارع صالة المغادرون", "طريق المطار السريع", "ساحة المواقف الرئيسية"],
          "الجيزة البلد": ["شارع الجيزة الرئيسي", "شارع القلعة القديمة"],
          "أم الرصاص": ["شارع الآثار البيزنطية", "طريق أم الرصاص"]
        }
      }
    ]
  },
  {
    governorate: "إربد (Irbid)",
    pickupPoints: ["مجمع عمان الجديد", "بوابة جامعة اليرموك الشمالية", "دوار الثقافة", "مجمع الأغوار الجديد"],
    districts: [
      {
        name: "لواء قصبة إربد",
        villages: ["وسط البلد (إربد)", "حي الجامعة", "الحصن", "الصريح", "إيدون", "بشرى", "البارحة", "حي الروضة"],
        streets: {
          "وسط البلد (إربد)": ["شارع الهاشمي", "شارع السينما", "شارع فلسطين", "شارع بغداد", "شارع الشهيد وصفي التل", "شارع الملك حسين"],
          "حي الجامعة": ["شارع شفيق ارشيدات (شارع الجامعة)", "شارع الثلاثين", "شارع اليرموك التجاري", "دوار الثقافة", "دوار النسيم"],
          "الحصن": ["شارع الحصن الرئيسي", "شارع كنيسة الروم", "دوار الحصن", "شارع المدارس الحصن"],
          "الصريح": ["شارع الصريح العام", "شارع المدارس", "دوار الصريح", "شارع الأمير الحسن"],
          "إيدون": ["شارع إيدون الرئيسي", "دوار إيدون", "شارع مستشفى إربد التخصصي", "شارع الزيتون", "شارع المستشفى التعليمي"],
          "بشرى": ["شارع بشرى الرئيسي", "طريق سال العام", "شارع المدارس بشرى"],
          "البارحة": ["شارع البارحة الرئيسي", "شارع اليرموك", "طريق وادي الغفر"],
          "حي الروضة": ["شارع الروضة الرئيسي", "شارع القدس (إربد)", "دوار القبة", "شارع الهاشمية"]
        }
      },
      {
        name: "لواء بني عبيد",
        villages: ["النعيمة", "شطنا", "كتم", "كفر يوبا", "مخيم الشهيد عزمي المفتي"],
        streets: {
          "النعيمة": ["شارع النعيمة العام", "شارع الجامعة (إربد-عمان)", "شارع المثلث"],
          "شطنا": ["شارع شطنا التراثي", "طريق الحصن"],
          "كتم": ["شارع كتم الرئيسي", "شارع المدرسة"],
          "كفر يوبا": ["شارع كفر يوبا الرئيسي", "طريق دير أبي سعيد"],
          "مخيم الشهيد عزمي المفتي": ["شارع السوق الرئيسي", "شارع المركز الصحي"]
        }
      },
      {
        name: "لواء الرمثا",
        villages: ["الرمثا", "جامعة العلوم والتكنولوجيا (JUST)", "البويضة", "الشجرة", "الطرة"],
        streets: {
          "الرمثا": ["شارع الرمثا التجاري", "شارع الجمرك القديم", "شارع المجمع", "شارع الملك فيصل"],
          "جامعة العلوم والتكنولوجيا (JUST)": ["بوابة التكنولوجيا الرئيسية", "شارع مستشفى الملك المؤسس", "شارع السكن الجامعي"],
          "البويضة": ["شارع البويضة الرئيسي", "طريق إربد-الرمثا"],
          "الشجرة": ["شارع الشجرة العام", "طريق الطرة"],
          "الطرة": ["شارع الطرة الرئيسي", "شارع البلدية"]
        }
      }
    ]
  },
  {
    governorate: "الزرقاء (Zarqa)",
    pickupPoints: ["مجمع الزرقاء الجديد", "دوار الجيش", "الشارع التجاري 36"],
    districts: [
      {
        name: "لواء قصبة الزرقاء",
        villages: ["الوسط التجاري", "الزرقاء الجديدة", "حي معصوم", "وادي الحجر", "الجبل الأبيض", "حي الضباط"],
        streets: {
          "الوسط التجاري": ["شارع الجيش", "شارع السعادة", "شارع باب الواد", "شارع الملك فيصل", "شارع شاكر"],
          "الزرقاء الجديدة": ["شارع 36 التجاري", "شارع 16", "شارع المكرامات", "شارع الفلاتر", "دوار معصوم"],
          "حي معصوم": ["شارع معصوم الرئيسي", "شارع مكة المكرمة (الزرقاء)", "شارع القدس", "دوار حي معصوم"],
          "وادي الحجر": ["شارع وادي الحجر الرئيسي", "شارع المصفاة", "شارع مصانع الغزل"],
          "الجبل الأبيض": ["شارع الجبل الأبيض العام", "شارع خالد بن الوليد"],
          "حي الضباط": ["شارع الضباط الرئيسي", "شارع المدارس العسكرية"]
        }
      },
      {
        name: "لواء الرصيفة",
        villages: ["حي الرشيد", "الجبل الشمالي", "ياجوز", "عوجان", "المشيرفة"],
        streets: {
          "حي الرشيد": ["شارع الرصيفة الرئيسي", "شارع ياجوز السريع", "دوار حي الرشيد"],
          "الجبل الشمالي": ["شارع الجبل الشمالي العام", "شارع مدرسة ابن حزم"],
          "ياجوز": ["شارع ياجوز الرئيسي", "طريق عمان-الرصيفة السريع"],
          "عوجان": ["شارع عوجان الرئيسي", "شارع محطة القطار"],
          "المشيرفة": ["شارع المشيرفة العام", "شارع الملك حسين (الرصيفة)"]
        }
      }
    ]
  },
  {
    governorate: "البلقاء (Balqa)",
    pickupPoints: ["مجمع السلط الرئيسي", "دوار جامعة البلقاء التطبيقية", "مثلث عين الباشا"],
    districts: [
      {
        name: "لواء قصبة السلط",
        villages: ["بلدية السلط", "السلالم", "العيزرية", "شفا العامرية", "اليحودية", "الخندق", "جامعة البلقاء التطبيقية"],
        streets: {
          "بلدية السلط": ["شارع الميدان", "شارع الخضر", "شارع اليرموك", "شارع الحمام التراثي", "شارع الإسكافية"],
          "السلالم": ["شارع السلالم الرئيسي", "شارع الستين الدائري", "شارع مطل السلط"],
          "العيزرية": ["شارع العيزرية العام", "شارع مدرسة السلط الثانوية"],
          "شفا العامرية": ["شارع العامرية الرئيسي", "شارع السرو العام"],
          "جامعة البلقاء التطبيقية": ["بوابة الجامعة الرئيسية", "شارع الإسكان الجامعي", "دوار العلوم"]
        }
      },
      {
        name: "لواء عين الباشا",
        villages: ["عين الباشا", "مخيم البقعة", "صافوط", "أم الدنانير"],
        streets: {
          "عين الباشا": ["شارع عين الباشا الرئيسي", "طريق صافوط السريع", "شارع البلدية"],
          "مخيم البقعة": ["شارع السوق الرئيسي (البقعة)", "شارع القدس", "شارع النادي"],
          "صافوط": ["شارع صافوط العام", "شارع طريق صويلح-جرش السريع"],
          "أم الدنانير": ["شارع أم الدنانير الرئيسي", "طريق سد الكفرين"]
        }
      }
    ]
  },
  {
    governorate: "المفرق (Mafraq)",
    pickupPoints: ["مجمع سفريات المفرق", "بوابة جامعة آل البيت"],
    districts: [
      {
        name: "لواء قصبة المفرق",
        villages: ["المفرق البلد", "حي الحسين", "حي الضباط", "الغدير الأخضر", "جامعة آل البيت"],
        streets: {
          "المفرق البلد": ["شارع المفرق الرئيسي", "شارع الجيش", "شارع البلدية", "شارع الشهداء"],
          "حي الحسين": ["شارع حي الحسين العام", "شارع مدرسة اليرموك"],
          "حي الضباط": ["شارع الضباط الرئيسي", "شارع الدفاع المدني"],
          "الغدير الأخضر": ["شارع الغدير العام", "طريق رحاب"],
          "جامعة آل البيت": ["بوابة آل البيت الرئيسية", "شارع السكن الداخلي"]
        }
      }
    ]
  },
  {
    governorate: "جرش (Jerash)",
    pickupPoints: ["مجمع جرش الجديد", "بوابة الآثار والساحة البيضاوية"],
    districts: [
      {
        name: "لواء قصبة جرش",
        villages: ["جرش البلد", "سوف", "الكفير", "مرصع", "ساكب"],
        streets: {
          "جرش البلد": ["شارع الآثار الرومانية", "شارع باب عمان", "شارع البلدية", "شارع الشهداء جرش"],
          "سوف": ["شارع سوف الرئيسي", "طريق عجلون"],
          "الكفير": ["شارع الكفير العام", "شارع المدارس"],
          "ساكب": ["شارع ساكب الرئيسي", "طريق محمية الغزلان"]
        }
      }
    ]
  },
  {
    governorate: "عجلون (Ajloun)",
    pickupPoints: ["مجمع عجلون للمركبات", "قلعة عجلون التاريخية"],
    districts: [
      {
        name: "لواء قصبة عجلون",
        villages: ["عجلون البلد", "عنجرة", "عين جنا", "محنا", "اشتفينا (التلفريك)"],
        streets: {
          "عجلون البلد": ["شارع القلعة", "شارع المقلب", "شارع الكنيسة البيزنطية", "شارع المحكمة"],
          "عنجرة": ["شارع عنجرة الرئيسي", "شارع سيدة الجبل"],
          "عين جنا": ["شارع عين جنا العام", "طريق القلعة"],
          "اشتفينا (التلفريك)": ["شارع محطة تلفريك عجلون", "شارع غابات اشتفينا"]
        }
      }
    ]
  },
  {
    governorate: "مأدبا (Madaba)",
    pickupPoints: ["مجمع مأدبا الغربي", "كنيسة الخارطة والفسيفساء", "دوار المحافظة"],
    districts: [
      {
        name: "لواء قصبة مأدبا",
        villages: ["مأدبا البلد", "ماعين", "الفيصلية", "جرينة", "حنينا"],
        streets: {
          "مأدبا البلد": ["شارع الفسيفساء السياحي", "شارع الملك طلال", "شارع كنيسة الخارطة", "شارع البتراء"],
          "ماعين": ["شارع حمامات ماعين السياحي", "طريق زرقاء ماعين"],
          "الفيصلية": ["شارع جبل نيبو", "شارع الفيصلية العام"],
          "حنينا": ["شارع حنينا الرئيسي", "شارع مدارس الروم"]
        }
      }
    ]
  },
  {
    governorate: "الكرك (Karak)",
    pickupPoints: ["مجمع الكرك الجديد (الثنية)", "بوابة قلعة الكرك", "مجمع مؤتة"],
    districts: [
      {
        name: "لواء قصبة الكرك",
        villages: ["الكرك البلد", "الثنية", "المرج", "الشهابية", "زحوم"],
        streets: {
          "الكرك البلد": ["شارع قلعة الكرك", "شارع الملك حسين", "شارع الميدان الكرك", "شارع الخضر الكرك"],
          "الثنية": ["شارع الثنية الرئيسي", "شارع مجمع الدوائر الحكومية", "شارع جامعة مؤتة الجديد"],
          "المرج": ["شارع المرج العام", "شارع المستشفى العسكري"],
          "الشهابية": ["شارع الشهابية الرئيسي", "طريق الغوير"]
        }
      },
      {
        name: "لواء المزار الجنوبي",
        villages: ["المزار الجنوبي", "مؤتة (جامعة مؤتة)", "الطيبة"],
        streets: {
          "المزار الجنوبي": ["شارع أضرحة الصحابة الشهداء", "شارع المزار الرئيسي"],
          "مؤتة (جامعة مؤتة)": ["بوابة جامعة مؤتة الرئيسية (السيف)", "شارع مؤتة التجاري", "شارع الشهداء"],
          "الطيبة": ["شارع الطيبة العام", "شارع المدارس"]
        }
      }
    ]
  },
  {
    governorate: "الطفيلة (Tafilah)",
    pickupPoints: ["مجمع الطفيلة العام", "دوار جامعة الطفيلة التقنية"],
    districts: [
      {
        name: "لواء قصبة الطفيلة",
        villages: ["الطفيلة البلد", "العين البيضاء", "بصيرا", "عيمة", "العيص (جامعة الطفيلة)"],
        streets: {
          "الطفيلة البلد": ["شارع الطفيلة الرئيسي", "شارع القلعة العثمانية", "شارع الشهداء الطفيلة"],
          "العين البيضاء": ["شارع العين البيضاء العام", "طريق بصيرا"],
          "بصيرا": ["شارع بصيرا الرئيسي", "شارع الآثار الأدومية"],
          "العيص (جامعة الطفيلة)": ["شارع جامعة الطفيلة التقنية", "شارع الإسكان الجامعي"]
        }
      }
    ]
  },
  {
    governorate: "معان (Ma'an)",
    pickupPoints: ["مجمع سفريات معان", "دوار عرار", "مركز زوار البتراء"],
    districts: [
      {
        name: "لواء قصبة معان",
        villages: ["معان البلد", "بسطة", "أذرح", "جامعة الحسين بن طلال"],
        streets: {
          "معان البلد": ["شارع فلسطين (معان)", "شارع قصر الملك عبد الله الأول", "شارع البلدية معان"],
          "جامعة الحسين بن طلال": ["بوابة جامعة الحسين الرئيسية", "شارع طريق أذرح", "شارع السكن الجامعي"],
          "أذرح": ["شارع أذرح التاريخي", "شارع القلعة"]
        }
      },
      {
        name: "لواء البتراء",
        villages: ["وادي موسى (البتراء)", "الطيبة الجنوبية", "أم صيحون"],
        streets: {
          "وادي موسى (البتراء)": ["شارع السياحة الرئيسي", "شارع مركز الزوار", "شارع السيك المؤدي للخزنة", "شارع فندق موفنبيك"],
          "الطيبة الجنوبية": ["شارع الطيبة العام", "طريق الراجف"],
          "أم صيحون": ["شارع أم صيحون الرئيسي", "طريق البيضا (البتراء الصغيرة)"]
        }
      }
    ]
  },
  {
    governorate: "العقبة (Aqaba)",
    pickupPoints: ["مجمع العقبة الجديد", "ساحة الثورة العربية الكبرى", "دوار الشريف حسين"],
    districts: [
      {
        name: "لواء قصبة العقبة",
        villages: ["العقبة البلد", "الشاطئ الجنوبي", "المنطقة السكنية العاشرة", "حي الرمال", "وادي رم", "تالابيه (Tala Bay)"],
        streets: {
          "العقبة البلد": ["شارع الكورنيش والواجهة البحرية", "شارع بيت الشريف حسين", "شارع الملك حسين التجاري", "شارع بغداد (العقبة)", "شارع الفاروق"],
          "الشاطئ الجنوبي": ["شارع الشاطئ الجنوبي الرئيسي", "شارع ميناء الحاويات", "شارع المتنزه البحري"],
          "المنطقة السكنية العاشرة": ["شارع العاشرة الرئيسي", "شارع المدارس العاشرة", "دوار العاشر"],
          "حي الرمال": ["شارع الرمال العام", "شارع الفنادق الوسطى"],
          "وادي رم": ["شارع المخيمات السياحية", "طريق الديسة العام", "شارع مركز زوار وادي رم"],
          "تالابيه (Tala Bay)": ["شارع منتجع تالابيه الرئيسي", "شارع المارينا واليخوت"]
        }
      }
    ]
  }
];

// Helper to get hierarchical streets strictly for a selected governorate, district, and village
export function getStreetsForVillageHierarchy(
  govName?: string | null,
  distName?: string | null,
  villageName?: string | null,
  customLocations?: LocationConfig[]
): string[] {
  if (!govName) return [];
  const locationsList = customLocations || DEFAULT_LOCATIONS;
  const govShort = govName.split(' ')[0].trim();
  
  const govObj = locationsList.find(l => 
    l.governorate === govName || 
    l.governorate.startsWith(govShort) || 
    govName.startsWith(l.governorate.split(' ')[0].trim())
  );
  if (!govObj) return [];

  if (distName) {
    const distObj = govObj.districts?.find(d => 
      d.name === distName || 
      d.name.includes(distName) || 
      distName.includes(d.name)
    );

    if (distObj) {
      if (villageName && distObj.streets && distObj.streets[villageName]) {
        return distObj.streets[villageName];
      }

      // Check if any key matches partially
      if (villageName && distObj.streets) {
        for (const [vKey, streetsArr] of Object.entries(distObj.streets)) {
          if (villageName.includes(vKey) || vKey.includes(villageName)) {
            return streetsArr;
          }
        }
      }

      // If no specific village street map, collect all streets from this district
      if (distObj.streets) {
        const allDistStreets = Object.values(distObj.streets).flat();
        if (allDistStreets.length > 0) {
          return Array.from(new Set(allDistStreets));
        }
      }
    }
  }

  // Fallback to all streets in this governorate if needed
  const allGovStreets: string[] = [];
  govObj.districts?.forEach(d => {
    if (d.streets) {
      Object.values(d.streets).forEach(stArr => {
        allGovStreets.push(...stArr);
      });
    }
  });

  if (allGovStreets.length > 0) {
    return Array.from(new Set(allGovStreets));
  }

  // Safe fallback specifically for that governorate
  return [
    `شارع الملك حسين (${govShort})`,
    `الشارع الدائري الرئيسي (${govShort})`,
    `شارع البلدية والمعالم (${govShort})`
  ];
}

export async function fetchAiLocationCascade(
  governorate: string,
  district: string = '',
  neighborhood: string = '',
  requestType: 'districts' | 'neighborhoods' | 'streets' | 'full_hierarchy' = 'full_hierarchy'
) {
  try {
    const res = await fetch('/api/ai-location-cascade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ governorate, district, neighborhood, requestType })
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.error("Error fetching AI location cascade:", err);
    return { success: false, msg: String(err) };
  }
}

// Helper to get coordinates for any location to render on a simulated map
export function getLocationCoords(locationName: string | undefined | null): { x: number; y: number } {
  const code = localStorage.getItem('adam_active_country') || 'JO';
  return getCountryLocationCoords(locationName, code);
}

export function hasGeographicMatch(locationName: string | undefined | null): boolean {
  const safeName = typeof locationName === 'string' ? locationName : '';
  if (!safeName) return false;
  
  const keywords = [
    "عمان", "سابع", "جبيهة", "تلاع", "عبدلي", "amman",
    "إربد", "حصن", "صريح", "إيدون", "irbid",
    "زرقاء", "رصيفة", "رشيد", "ياجوز", "zarqa",
    "سلط", "بلقاء", "عين الباشا", "صافوط", "balqa", "salt",
    "مفرق", "رويشد", "mafraq",
    "جرش", "سوف", "jerash",
    "عجلون", "كفرنجة", "ajloun",
    "مأدبا", "ماعين", "madaba",
    "كرك", "مزار", "مؤتة", "karak",
    "طفيلة", "حسا", "بصيرا", "tafilah",
    "معان", "بتراء", "شوبك", "وادي موسى", "ma'an",
    "عقبة", "قويرة", "رم", "aqaba"
  ];
  
  return keywords.some(keyword => safeName.toLowerCase().includes(keyword.toLowerCase()));
}

// Converts simulated map coordinates (x, y) to approximate Jordanian Latitude and Longitude for high-fidelity navigation
export function getGeoCoords(x: number, y: number): { lat: number; lng: number } {
  const lat = 33.0 - ((y - 70) * 3.5) / 340;
  const lng = 35.3 + ((x - 100) * 3.2) / 250;
  return { lat, lng };
}

// Converts real-world Jordanian Latitude and Longitude back to 2D canvas coordinates (x, y)
export function getCanvasCoordsFromGeo(lat: number, lng: number): { x: number; y: number } {
  const y = 70 + ((33.0 - lat) * 340) / 3.5;
  const x = 100 + ((lng - 35.3) * 250) / 3.2;
  return {
    x: Math.max(50, Math.min(380, Math.round(x))),
    y: Math.max(50, Math.min(420, Math.round(y)))
  };
}

// Precise coordinates map of major Jordanian locations & neighborhoods
export const JORDAN_AREAS_COORDS: {
  governorate: string;
  district: string;
  village: string;
  defaultStreet?: string;
  lat: number;
  lng: number;
}[] = [
  // عمان - Amman
  { governorate: "عمان (Amman)", district: "لواء قصبة عمان", village: "الدوار السابع", defaultStreet: "شارع زهران", lat: 31.9539, lng: 35.8643 },
  { governorate: "عمان (Amman)", district: "لواء قصبة عمان", village: "العبدلي", defaultStreet: "شارع الملك حسين", lat: 31.9632, lng: 35.9135 },
  { governorate: "عمان (Amman)", district: "لواء قصبة عمان", village: "جبل عمان", defaultStreet: "شارع الرينبو", lat: 31.9520, lng: 35.9220 },
  { governorate: "عمان (Amman)", district: "لواء قصبة عمان", village: "جبل اللويبدة", defaultStreet: "شارع الشريعة", lat: 31.9610, lng: 35.9250 },
  { governorate: "عمان (Amman)", district: "لواء قصبة عمان", village: "وسط البلد", defaultStreet: "شارع فيصل", lat: 31.9515, lng: 35.9334 },
  { governorate: "عمان (Amman)", district: "لواء قصبة عمان", village: "الشميساني", defaultStreet: "شارع الثقافة", lat: 31.9720, lng: 35.8980 },
  { governorate: "عمان (Amman)", district: "لواء الجامعة", village: "الجبيهة", defaultStreet: "شارع الجامعة الأردنية", lat: 32.0150, lng: 35.8690 },
  { governorate: "عمان (Amman)", district: "لواء الجامعة", village: "تلاع العلي", defaultStreet: "شارع وصفي التل (الجاردنز)", lat: 31.9960, lng: 35.8520 },
  { governorate: "عمان (Amman)", district: "لواء الجامعة", village: "خلدا", defaultStreet: "دوار الكيلو", lat: 31.9980, lng: 35.8420 },
  { governorate: "عمان (Amman)", district: "لواء الجامعة", village: "صويلح", defaultStreet: "دوار صويلح", lat: 32.0300, lng: 35.8400 },
  { governorate: "عمان (Amman)", district: "لواء الجامعة", village: "أبو نصير", defaultStreet: "شارع أبو نصير الرئيسي", lat: 32.0520, lng: 35.8650 },
  { governorate: "عمان (Amman)", district: "لواء الجامعة", village: "ضاحية الرشيد", defaultStreet: "شارع الأميرة ثروت", lat: 32.0080, lng: 35.8780 },
  { governorate: "عمان (Amman)", district: "لواء الجامعة", village: "شفا بدران", defaultStreet: "شارع شفا بدران الرئيسي", lat: 32.0650, lng: 35.8900 },
  { governorate: "عمان (Amman)", district: "لواء وادي السير", village: "عبدون", defaultStreet: "شارع عبدون الشمالي", lat: 31.9450, lng: 35.8850 },
  { governorate: "عمان (Amman)", district: "لواء وادي السير", village: "الصويفية", defaultStreet: "شارع الوكالات", lat: 31.9560, lng: 35.8680 },
  { governorate: "عمان (Amman)", district: "لواء وادي السير", village: "بيادر وادي السير", defaultStreet: "شارع البيادر الرئيسي", lat: 31.9480, lng: 35.8400 },
  { governorate: "عمان (Amman)", district: "لواء وادي السير", village: "وادي السير البلد", defaultStreet: "شارع البلدية الرئيسي", lat: 31.9500, lng: 35.8200 },
  { governorate: "عمان (Amman)", district: "لواء ماركا", village: "طارق", defaultStreet: "شارع طبربور الرئيسي", lat: 32.0020, lng: 35.9450 },
  { governorate: "عمان (Amman)", district: "لواء ماركا", village: "ماركا الشمالية", defaultStreet: "شارع نادي السباق", lat: 31.9860, lng: 35.9900 },
  { governorate: "عمان (Amman)", district: "لواء ماركا", village: "ماركا الجنوبية", defaultStreet: "شارع اليرموك", lat: 31.9700, lng: 35.9800 },
  { governorate: "عمان (Amman)", district: "لواء ماركا", village: "النصر", defaultStreet: "شارع النصر الرئيسي", lat: 31.9600, lng: 35.9550 },
  { governorate: "عمان (Amman)", district: "لواء القويسمة", village: "القويسمة", defaultStreet: "شارع ستاد الملك عبد الله", lat: 31.9100, lng: 35.9300 },
  { governorate: "عمان (Amman)", district: "لواء القويسمة", village: "أبو علندا", defaultStreet: "شارع أهل الكهف", lat: 31.9050, lng: 35.9650 },
  { governorate: "عمان (Amman)", district: "لواء القويسمة", village: "الجويدة", defaultStreet: "شارع مادبا القديم", lat: 31.8900, lng: 35.9350 },
  { governorate: "عمان (Amman)", district: "لواء القويسمة", village: "خريبة السوق", defaultStreet: "شارع خريبة السوق العام", lat: 31.8750, lng: 35.9150 },
  { governorate: "عمان (Amman)", district: "لواء الجيزة", village: "مطار الملكة علياء الدولي (QAIA)", defaultStreet: "طريق المطار السريع", lat: 31.7225, lng: 35.9930 },
  
  // إربد - Irbid
  { governorate: "إربد (Irbid)", district: "لواء قصبة إربد", village: "وسط البلد (إربد)", defaultStreet: "شارع الهاشمي", lat: 32.5568, lng: 35.8469 },
  { governorate: "إربد (Irbid)", district: "لواء قصبة إربد", village: "حي الجامعة", defaultStreet: "شارع شفيق ارشيدات (شارع الجامعة)", lat: 32.5350, lng: 35.8550 },
  { governorate: "إربد (Irbid)", district: "لواء قصبة إربد", village: "الحصن", defaultStreet: "شارع الحصن الرئيسي", lat: 32.4850, lng: 35.8750 },
  { governorate: "إربد (Irbid)", district: "لواء قصبة إربد", village: "الصريح", defaultStreet: "شارع الصريح العام", lat: 32.5050, lng: 35.8850 },
  { governorate: "إربد (Irbid)", district: "لواء قصبة إربد", village: "إيدون", defaultStreet: "شارع إيدون الرئيسي", lat: 32.5200, lng: 35.8600 },
  { governorate: "إربد (Irbid)", district: "لواء قصبة إربد", village: "بشرى", defaultStreet: "شارع بشرى الرئيسي", lat: 32.5650, lng: 35.8900 },
  { governorate: "إربد (Irbid)", district: "لواء قصبة إربد", village: "البارحة", defaultStreet: "شارع البارحة الرئيسي", lat: 32.5700, lng: 35.8350 },
  { governorate: "إربد (Irbid)", district: "لواء قصبة إربد", village: "حي الروضة", defaultStreet: "شارع الروضة الرئيسي", lat: 32.5600, lng: 35.8600 },
  { governorate: "إربد (Irbid)", district: "لواء الرمثا", village: "الرمثا", defaultStreet: "شارع الرمثا التجاري", lat: 32.5590, lng: 36.0070 },
  { governorate: "إربد (Irbid)", district: "لواء الرمثا", village: "جامعة العلوم والتكنولوجيا (JUST)", defaultStreet: "بوابة التكنولوجيا الرئيسية", lat: 32.4950, lng: 35.9900 },
  { governorate: "إربد (Irbid)", district: "لواء بني عبيد", village: "النعيمة", defaultStreet: "شارع النعيمة العام", lat: 32.4500, lng: 35.8900 },
  
  // الزرقاء - Zarqa
  { governorate: "الزرقاء (Zarqa)", district: "لواء قصبة الزرقاء", village: "الوسط التجاري", defaultStreet: "شارع الجيش", lat: 32.0728, lng: 36.0880 },
  { governorate: "الزرقاء (Zarqa)", district: "لواء قصبة الزرقاء", village: "الزرقاء الجديدة", defaultStreet: "شارع 36 التجاري", lat: 32.0850, lng: 36.0700 },
  { governorate: "الزرقاء (Zarqa)", district: "لواء قصبة الزرقاء", village: "حي معصوم", defaultStreet: "شارع مكة المكرمة (الزرقاء)", lat: 32.0650, lng: 36.0950 },
  { governorate: "الزرقاء (Zarqa)", district: "لواء قصبة الزرقاء", village: "وادي الحجر", defaultStreet: "شارع وادي الحجر الرئيسي", lat: 32.0550, lng: 36.0800 },
  { governorate: "الزرقاء (Zarqa)", district: "لواء قصبة الزرقاء", village: "الجبل الأبيض", defaultStreet: "شارع الجبل الأبيض العام", lat: 32.0750, lng: 36.0950 },
  { governorate: "الزرقاء (Zarqa)", district: "لواء الرصيفة", village: "حي الرشيد", defaultStreet: "شارع الرصيفة الرئيسي", lat: 32.0180, lng: 36.0460 },
  { governorate: "الزرقاء (Zarqa)", district: "لواء الرصيفة", village: "الجبل الشمالي", defaultStreet: "شارع الجبل الشمالي العام", lat: 32.0250, lng: 36.0350 },
  { governorate: "الزرقاء (Zarqa)", district: "لواء الرصيفة", village: "ياجوز", defaultStreet: "شارع ياجوز السريع", lat: 32.0200, lng: 35.9800 },
  
  // البلقاء - Balqa
  { governorate: "البلقاء (Balqa)", district: "لواء قصبة السلط", village: "بلدية السلط", defaultStreet: "شارع الميدان", lat: 32.0392, lng: 35.7272 },
  { governorate: "البلقاء (Balqa)", district: "لواء قصبة السلط", village: "السلالم", defaultStreet: "شارع الستين الدائري", lat: 32.0450, lng: 35.7150 },
  { governorate: "البلقاء (Balqa)", district: "لواء قصبة السلط", village: "العيزرية", defaultStreet: "شارع العيزرية العام", lat: 32.0420, lng: 35.7350 },
  { governorate: "البلقاء (Balqa)", district: "لواء قصبة السلط", village: "جامعة البلقاء التطبيقية", defaultStreet: "بوابة الجامعة الرئيسية", lat: 32.0500, lng: 35.7250 },
  { governorate: "البلقاء (Balqa)", district: "لواء عين الباشا", village: "عين الباشا", defaultStreet: "شارع عين الباشا الرئيسي", lat: 32.0600, lng: 35.8200 },
  { governorate: "البلقاء (Balqa)", district: "لواء عين الباشا", village: "مخيم البقعة", defaultStreet: "شارع السوق الرئيسي (البقعة)", lat: 32.0750, lng: 35.8350 },
  { governorate: "البلقاء (Balqa)", district: "لواء عين الباشا", village: "صافوط", defaultStreet: "شارع صافوط العام", lat: 32.0450, lng: 35.8300 },
  
  // جرش - Jerash
  { governorate: "جرش (Jerash)", district: "لواء قصبة جرش", village: "جرش البلد", defaultStreet: "شارع الآثار الرومانية", lat: 32.2723, lng: 35.8914 },
  { governorate: "جرش (Jerash)", district: "لواء قصبة جرش", village: "سوف", defaultStreet: "شارع سوف الرئيسي", lat: 32.3100, lng: 35.8600 },
  
  // عجلون - Ajloun
  { governorate: "عجلون (Ajloun)", district: "لواء قصبة عجلون", village: "عجلون البلد", defaultStreet: "شارع القلعة", lat: 32.3327, lng: 35.7517 },
  { governorate: "عجلون (Ajloun)", district: "لواء قصبة عجلون", village: "عنجرة", defaultStreet: "شارع عنجرة الرئيسي", lat: 32.3150, lng: 35.7650 },
  { governorate: "عجلون (Ajloun)", district: "لواء قصبة عجلون", village: "اشتفينا (التلفريك)", defaultStreet: "شارع محطة تلفريك عجلون", lat: 32.3600, lng: 35.7700 },
  
  // مأدبا - Madaba
  { governorate: "مأدبا (Madaba)", district: "لواء قصبة مأدبا", village: "مأدبا البلد", defaultStreet: "شارع الفسيفساء السياحي", lat: 31.7196, lng: 35.7942 },
  { governorate: "مأدبا (Madaba)", district: "لواء قصبة مأدبا", village: "ماعين", defaultStreet: "شارع حمامات ماعين السياحي", lat: 31.6800, lng: 35.7300 },
  { governorate: "مأدبا (Madaba)", district: "لواء قصبة مأدبا", village: "الفيصلية", defaultStreet: "شارع جبل نيبو", lat: 31.7300, lng: 35.7400 },
  
  // الكرك - Karak
  { governorate: "الكرك (Karak)", district: "لواء قصبة الكرك", village: "الكرك البلد", defaultStreet: "شارع قلعة الكرك", lat: 31.1853, lng: 35.7048 },
  { governorate: "الكرك (Karak)", district: "لواء قصبة الكرك", village: "الثنية", defaultStreet: "شارع الثنية الرئيسي", lat: 31.1700, lng: 35.7300 },
  { governorate: "الكرك (Karak)", district: "لواء المزار الجنوبي", village: "مؤتة (جامعة مؤتة)", defaultStreet: "بوابة جامعة مؤتة الرئيسية (السيف)", lat: 31.0900, lng: 35.7100 },
  
  // الطفيلة - Tafilah
  { governorate: "الطفيلة (Tafilah)", district: "لواء قصبة الطفيلة", village: "الطفيلة البلد", defaultStreet: "شارع الطفيلة الرئيسي", lat: 30.8375, lng: 35.6042 },
  { governorate: "الطفيلة (Tafilah)", district: "لواء قصبة الطفيلة", village: "العين البيضاء", defaultStreet: "شارع العين البيضاء العام", lat: 30.8100, lng: 35.6200 },
  { governorate: "الطفيلة (Tafilah)", district: "لواء قصبة الطفيلة", village: "العيص (جامعة الطفيلة)", defaultStreet: "شارع جامعة الطفيلة التقنية", lat: 30.8500, lng: 35.6200 },
  
  // معان - Ma'an
  { governorate: "معان (Ma'an)", district: "لواء قصبة معان", village: "معان البلد", defaultStreet: "شارع فلسطين (معان)", lat: 30.1927, lng: 35.7360 },
  { governorate: "معان (Ma'an)", district: "لواء البتراء", village: "وادي موسى (البتراء)", defaultStreet: "شارع السياحة الرئيسي", lat: 30.3216, lng: 35.4801 },
  
  // العقبة - Aqaba
  { governorate: "العقبة (Aqaba)", district: "لواء قصبة العقبة", village: "العقبة البلد", defaultStreet: "شارع الكورنيش والواجهة البحرية", lat: 29.5321, lng: 35.0063 },
  { governorate: "العقبة (Aqaba)", district: "لواء قصبة العقبة", village: "الشاطئ الجنوبي", defaultStreet: "شارع الشاطئ الجنوبي الرئيسي", lat: 29.4300, lng: 34.9750 },
  { governorate: "العقبة (Aqaba)", district: "لواء قصبة العقبة", village: "وادي رم", defaultStreet: "شارع المخيمات السياحية", lat: 29.5750, lng: 35.4200 },
  { governorate: "العقبة (Aqaba)", district: "لواء قصبة العقبة", village: "تالابيه (Tala Bay)", defaultStreet: "شارع منتجع تالابيه الرئيسي", lat: 29.3900, lng: 34.9800 },
  
  // المفرق - Mafraq
  { governorate: "المفرق (Mafraq)", district: "لواء قصبة المفرق", village: "المفرق البلد", defaultStreet: "شارع المفرق الرئيسي", lat: 32.3430, lng: 36.2080 },
  { governorate: "المفرق (Mafraq)", district: "لواء قصبة المفرق", village: "جامعة آل البيت", defaultStreet: "بوابة آل البيت الرئيسية", lat: 32.3500, lng: 36.2300 }
];

// Helper to calculate exact distance in KM between two GPS coordinates
export function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 🎯 High-Precision Real GPS Geolocation & Reverse Geocode Resolver
export async function getPreciseCurrentLocation(): Promise<{
  success: boolean;
  lat: number;
  lng: number;
  governorate: string;
  district: string;
  village: string;
  street: string;
  landmark: string;
  formattedAddress: string;
  msg: string;
  source: 'gps_live' | 'reverse_geocode' | 'nearest_centroid' | 'error';
}> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return {
      success: false,
      lat: 31.9539,
      lng: 35.8643,
      governorate: "عمان (Amman)",
      district: "لواء قصبة عمان",
      village: "الدوار السابع",
      street: "شارع زهران",
      landmark: "الدوار السابع (محطة جت)",
      formattedAddress: "عمان - لواء قصبة عمان - الدوار السابع - شارع زهران",
      msg: "⚠️ جهازك لا يدعم خاصية تحديد الموقع الجغرافي (GPS)",
      source: 'error'
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy || 10);

        // 1. Find the mathematically nearest known Jordanian district and village
        let closestArea = JORDAN_AREAS_COORDS[0];
        let minDistance = calculateHaversineKm(lat, lng, closestArea.lat, closestArea.lng);

        for (const area of JORDAN_AREAS_COORDS) {
          const dist = calculateHaversineKm(lat, lng, area.lat, area.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closestArea = area;
          }
        }

        let detectedGov = closestArea.governorate;
        let detectedDistrict = closestArea.district;
        let detectedNeighborhood = closestArea.village;
        let detectedStreet = closestArea.defaultStreet || "";

        // 2. Perform live reverse geocoding to retrieve actual neighborhood, street, and address
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar&zoom=18`, {
            headers: { 'Accept-Language': 'ar' },
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            
            // Detect City / Governorate
            const cityName = addr.city || addr.town || addr.municipality || addr.state || addr.county || "";
            if (cityName.includes("إربد")) detectedGov = "إربد (Irbid)";
            else if (cityName.includes("الزرقاء")) detectedGov = "الزرقاء (Zarqa)";
            else if (cityName.includes("السلط") || cityName.includes("البلقاء")) detectedGov = "البلقاء (Balqa)";
            else if (cityName.includes("العقبة")) detectedGov = "العقبة (Aqaba)";
            else if (cityName.includes("جرش")) detectedGov = "جرش (Jerash)";
            else if (cityName.includes("عجلون")) detectedGov = "عجلون (Ajloun)";
            else if (cityName.includes("مأدبا")) detectedGov = "مأدبا (Madaba)";
            else if (cityName.includes("الكرك")) detectedGov = "الكرك (Karak)";
            else if (cityName.includes("الطفيلة")) detectedGov = "الطفيلة (Tafilah)";
            else if (cityName.includes("معان")) detectedGov = "معان (Ma'an)";
            else if (cityName.includes("المفرق")) detectedGov = "المفرق (Mafraq)";
            else if (cityName.includes("عمان")) detectedGov = "عمان (Amman)";

            // Check if district belongs to this gov
            const govObj = DEFAULT_LOCATIONS.find(l => l.governorate === detectedGov);
            if (govObj) {
              const addrDistrict = addr.city_district || addr.district || addr.county || "";
              const matchedDist = govObj.districts.find(d => 
                addrDistrict && (d.name.includes(addrDistrict) || addrDistrict.includes(d.name.replace('لواء ', '')))
              );
              if (matchedDist) {
                detectedDistrict = matchedDist.name;
              } else if (!detectedDistrict.includes(govObj.governorate.split(' ')[0])) {
                detectedDistrict = govObj.districts[0]?.name || detectedDistrict;
              }

              // Check neighborhood / village
              const addrNeigh = addr.neighbourhood || addr.suburb || addr.quarter || addr.residential || addr.village || addr.town || "";
              const currentDistObj = govObj.districts.find(d => d.name === detectedDistrict) || govObj.districts[0];
              if (currentDistObj) {
                const matchedVillage = currentDistObj.villages.find(v => 
                  addrNeigh && (v.includes(addrNeigh) || addrNeigh.includes(v))
                );
                if (matchedVillage) {
                  detectedNeighborhood = matchedVillage;
                } else if (currentDistObj.villages.length > 0 && !currentDistObj.villages.includes(detectedNeighborhood)) {
                  detectedNeighborhood = currentDistObj.villages[0];
                }
              }
            }

            if (addr.road) {
              detectedStreet = addr.road;
            }
          }
        } catch {
          // Graceful fallback to closestArea computed from GPS coordinates
        }

        // Final verification that street belongs to village hierarchy
        const streetsForArea = getStreetsForVillageHierarchy(detectedGov, detectedDistrict, detectedNeighborhood, DEFAULT_LOCATIONS);
        if (!detectedStreet || (!detectedStreet.startsWith('شارع') && !detectedStreet.startsWith('دوار') && !detectedStreet.startsWith('طريق'))) {
          if (streetsForArea.length > 0) {
            detectedStreet = streetsForArea[0];
          }
        }

        // Store detected state in localStorage for persistent intra-city boundary protection
        try {
          localStorage.setItem('adam_passenger_detected_gov', detectedGov);
          localStorage.setItem('adam_passenger_detected_dist', detectedDistrict);
          localStorage.setItem('adam_passenger_detected_village', detectedNeighborhood);
          localStorage.setItem('adam_passenger_detected_street', detectedStreet);
          localStorage.setItem('adam_passenger_detected_lat', String(lat));
          localStorage.setItem('adam_passenger_detected_lng', String(lng));
        } catch {
          // LocalStorage fallback
        }

        const govShort = detectedGov.split(' ')[0];
        const formattedAddress = `${govShort} - ${detectedDistrict} - ${detectedNeighborhood}${detectedStreet ? ` - ${detectedStreet}` : ''}`;
        const msg = `🎯 تم رصد موقعك الفعلي بدقة (دقة ±${accuracy}م):\n📍 ${formattedAddress}\n🌐 إحداثيات: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        resolve({
          success: true,
          lat,
          lng,
          governorate: detectedGov,
          district: detectedDistrict,
          village: detectedNeighborhood,
          street: detectedStreet,
          landmark: `موقع حي (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          formattedAddress,
          msg,
          source: 'gps_live'
        });
      },
      (error) => {
        let errorMsg = "⚠️ يرجى السماح للمتصفح بالوصول إلى الموقع الجغرافي (GPS) لرصد موقعك الفعلي الدقيق.";
        if (error.code === error.TIMEOUT) {
          errorMsg = "⏱️ استغرق رصد الـ GPS وقتاً طويلاً. يمكنك اختيار محافظتك ومنطقتك من القوائم.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "📡 تعذر الحصول على إشارة GPS حالياً. يرجى تفعيل الموقع أو اختيار منطقتك.";
        }

        const savedGov = localStorage.getItem('adam_passenger_detected_gov') || "عمان (Amman)";
        const savedDist = localStorage.getItem('adam_passenger_detected_dist') || "لواء قصبة عمان";
        const savedVillage = localStorage.getItem('adam_passenger_detected_village') || "الدوار السابع";
        const savedStreet = localStorage.getItem('adam_passenger_detected_street') || "شارع زهران";
        const savedLat = Number(localStorage.getItem('adam_passenger_detected_lat')) || 31.9539;
        const savedLng = Number(localStorage.getItem('adam_passenger_detected_lng')) || 35.8643;

        resolve({
          success: false,
          lat: savedLat,
          lng: savedLng,
          governorate: savedGov,
          district: savedDist,
          village: savedVillage,
          street: savedStreet,
          landmark: savedVillage,
          formattedAddress: `${savedGov.split(' ')[0]} - ${savedDist} - ${savedVillage} - ${savedStreet}`,
          msg: errorMsg,
          source: 'error'
        });
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 3000 
      }
    );
  });
}


