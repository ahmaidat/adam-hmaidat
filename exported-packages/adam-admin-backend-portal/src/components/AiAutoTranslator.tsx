import React, { useEffect } from 'react';
import { useAppState } from '../stateEngine';

const COMMON_FALLBACKS: Record<string, Record<string, string>> = {
  'en': {
    'الكباتن النشطين': 'Active Captains',
    'الركاب المسجلين': 'Registered Riders',
    'الرحلات النشطة': 'Active Dispatches',
    'التحقق الإلكتروني': 'AI Verification',
    'بوابة الراكب والمسافر': 'Passenger Portal',
    'دخول تطبيق الراكب': 'Enter Passenger App',
    'بوابة كابتن تاكسي آدم': 'Captain Portal',
    'دخول تطبيق الكابتن': 'Enter Captain App',
    'بوابة المشرفين والتحكم الموحد': 'Admin & Control Portal',
    'فتح لوحة المشرف والداشبورد الكامل': 'Enter Admin & Dashboard',
    'الرئيسية الترحيبية': 'Welcome Portal',
    '🔒 قفل الداشبورد': '🔒 Lock Dashboard',
    '👑 المدير العام (admin/admin)': '👑 Gen. Manager (admin/admin)',
    '💼 موظف محمد (mohammad/123)': '💼 Employee Mohammad (mohammad/123)',
    '🚕 كابتن خليل (123)': '🚕 Capt. Khalil (123)',
    '🚨 كابتن رائد (123)': '🚨 Capt. Raed (123)',
    '👤 راكب أحمد (123)': '👤 Passenger Ahmad (123)',
    'تخصيص الدولة النشطة': 'Active Country Control',
    'العداد الإلكتروني الذكي': 'Smart Taximeter',
    'الخرائط والمسارات المباشرة': 'Live Maps & Routes',
    'نظام الدفع والمحفظة الرقمية': 'Payment & Digital Wallet',
    'الدعم والمساعدة الذكية بالفيديو والصوت': 'AI Audio & Video Support',
    'لوحة التحكم وإحصائيات الرحلات': 'Control Panel & Stats',
    'تسجيل الدخول لبوابة الداشبورد الشاملة': 'Master Dashboard Login',
    'الرجاء إدخال اسم المستخدم وكلمة المرور المشفرة للتحقق من هوية المشغلين.': 'Please enter username and password to authenticate operators.',
    'اسم مستخدم الداشبورد والمنظومة': 'Dashboard Username',
    'كلمة المرور للتحقق المرتبط': 'Secure Password',
    'الدخول الآمن للداشبورد ومصادقة الترخيص 🔓': 'Secure Authorize & Unlock Dashboard 🔓',
    'منظومة كابتن وراكب آدم مع لوحة تحكم وداشبورد مخصصة ومرنة لمحافظات الأردن © 2026. تطبيقات هواتف محمولة أندرويد و iOS وسطح مكتب متكاملة.': 'Adam passenger, captain, and analytics system © 2026. Custom mobile apps for Android, iOS and Desktop.',
    'بوابات الدخول السريع للاختبار وحسابات الصلاحيات المخصصة:': 'Quick credentials access for testing customized roles:',
    'تسجيل الدخول': 'Sign In',
    'اسم المستخدم': 'Username',
    'كلمة المرور': 'Password',
    'المحفظة': 'Wallet',
    'الرصيد الحالي': 'Current Balance',
    'طلب رحلة': 'Request Ride',
    'إلغاء': 'Cancel',
    'تأكيد': 'Confirm',
    'تعديل الملف الشخصي': 'Edit Profile',
    'الإعدادات': 'Settings',
    'خروج': 'Log Out',
    'تسجيل خروج': 'Log Out',
    'الكابتن': 'Captain',
    'الراكب': 'Passenger',
    'رصيد المحفظة': 'Wallet Balance',
    'حالة العداد': 'Taximeter Status',
    'القيمة التقريبية': 'Estimated Fare',
    'المسافة': 'Distance',
    'الزمن': 'Time',
    'الرحلات المحجوزة': 'Booked Rides',
    'دعم فني': 'Support',
    'محادثة مباشرة': 'Live Chat',
    'محاكاة الرحلة': 'Simulate Trip',
    'الرجاء إدخال اسم المستخدم وكلمة المرور': 'Please enter username and password',
    'أهلاً بك في بوابة الوصول الموحد للأجهزة والمنصات. يرجى مصادقة الوصول لولوج الداشبورد التفاعلي المباشر ومحاكاة الرحلات الفورية بموجب رخص القيادة والأحكام الخاصة بالمشغلين.': 'Welcome to the unified terminal gate for Adam apps and simulators. Authenticate below using high-security master credentials.',
    'بوابة المنظومة الموحدة لآدم لفرز وحماية التراخيص 🔐': 'Unified Enterprise Portal & License Protection Gate 🔐',
    'نظام آدم الذكي لنقل الركاب': 'Adam - Smart Ride Pooling & Transit Ecosystem',
    'أمن وشفافية مطلقة': '100% Safe & Secure',
    'تغطية كافة المحافظات': 'All Governorates Covered',
    'هوية موثقة بقوة': 'ID Verified',
    'مرخصين بالكامل': 'Fully Licensed',
    'اختر واجهة الدخول المفضلة للبدء بالمحاكاة الفورية:': 'Select your preferred entry portal to start instant simulation:'
  },
  'es': {
    'الكباتن النشطين': 'Capitanes Activos',
    'الركاب المسجلين': 'Pasajeros Registrados',
    'الرحلات النشطة': 'Viajes Activos',
    'التحقق الإلكتروني': 'Verificación IA',
    'بوابة الراكب والمسافر': 'Portal de Pasajeros',
    'دخول تطبيق الراكب': 'Entrar App Pasajero',
    'بوابة كابتن تاكسي آدم': 'Portal del Capitán',
    'دخول تطبيق الكابتن': 'Entrar App Capitán',
    'بوابة المشرفين والتحكم الموحد': 'Portal de Administración',
    'فتح لوحة المشرف والداشبورد الكامل': 'Abrir Panel de Control',
    'الرئيسية الترحيبية': 'Portal de Bienvenida',
    '🔒 قفل الداشبورد': '🔒 Bloquear Panel',
    '👑 المدير العام (admin/admin)': '👑 Gte. General (admin/admin)',
    'تخصيص الدولة النشطة': 'Control de País Activo',
    'العداد الإلكتروني الذكي': 'Taxímetro Inteligente',
    'الخرائط والمسارات المباشرة': 'Mapas en Vivo',
    'نظام الدفع والمحفظة الرقمية': 'Pago y Billetera Digital',
    'تسجيل الدخول لبوابة الداشبورد الشاملة': 'Iniciar Sesión en el Panel',
    'اسم مستخدم الداشبورد والمنظومة': 'Usuario del Panel',
    'كلمة المرور للتحقق المرتبط': 'Contraseña de Seguridad',
    'الدخول الآمن للداشبورد ومصادقة الترخيص 🔓': 'Acceso Seguro al Panel 🔓',
    'تسجيل الدخول': 'Iniciar Sesión',
    'اسم المستخدم': 'Usuario',
    'كلمة المرور': 'Contraseña',
    'المحفظة': 'Billetera',
    'الرصيد الحالي': 'Saldo Actual',
    'إلغاء': 'Cancelar',
    'تأكيد': 'Confirmar',
    'خروج': 'Cerrar Sesión',
    'تسجيل خروج': 'Cerrar Sesión'
  },
  'fr': {
    'الكباتن النشطين': 'Capitaines Actifs',
    'الركاب المسجلين': 'Passagers Enregistrés',
    'الرحلات النشطة': 'Trajets Actifs',
    'التحقق الإلكتروني': 'Vérification IA',
    'بوابة الراكب والمسافر': 'Portail Passager',
    'دخول تطبيق الراكب': 'Entrer App Passager',
    'بوابة كابتن تاكسي آدم': 'Portail Capitaine',
    'دخول تطبيق الكابتن': 'Entrer App Capitaine',
    'بوابة المشرفين والتحكم الموحد': 'Portail Admin',
    'فتح لوحة المشرف والداشبورد الكامل': 'Ouvrir le Tableau de Bord',
    'الرئيسية الترحيبية': 'Portail d\'Accueil',
    '🔒 قفل الداشبورد': '🔒 Verrouiller le Tableau',
    '👑 المدير العام (admin/admin)': '👑 Dir. Général (admin/admin)',
    'تخصيص الدولة النشطة': 'Contrôle du Pays Actif',
    'تسجيل الدخول لبوابة الداشبورد الشاملة': 'Connexion Tableau de Bord',
    'اسم مستخدم الداشبورد والمنظومة': 'Identifiant',
    'كلمة المرور للتحقق المرتبط': 'Mot de passe sécurisé',
    'الدخول الآمن للداشبورد ومصادقة الترخيص 🔓': 'Accès Sécurisé 🔓',
    'تسجيل الدخول': 'Connexion',
    'اسم المستخدم': 'Nom d\'utilisateur',
    'كلمة المرور': 'Mot de passe',
    'المحفظة': 'Portefeuille',
    'الرصيد الحالي': 'Solde Actuel',
    'إلغاء': 'Annuler',
    'تأكيد': 'Confirmer',
    'خروج': 'Déconnexion',
    'تسجيل خروج': 'Déconnexion'
  },
  'tr': {
    'الكباتن النشطين': 'Aktif Kaptanlar',
    'الركاب المسجلين': 'Kayıtlı Yolcular',
    'الرحلات النشطة': 'Aktif Seferler',
    'التحقق الإلكتروني': 'Yapay Zeka Doğrulama',
    'بوابة الراكب والمسافر': 'Yolcu Portalı',
    'دخول تطبيق الراكب': 'Yolcu Uygulamasına Gir',
    'بوابة كابتن تاكسي آدم': 'Kaptan Portalı',
    'دخول تطبيق الكابتن': 'Kaptan Uygulamasına Gir',
    'بوابة المشرفين والتحكم الموحد': 'Yönetici Portalı',
    'فتح لوحة المشرف والداشبورد الكامل': 'Yönetici Panelini Aç',
    'الرئيسية الترحيبية': 'Karşılama Portalı',
    '🔒 قفل الداشبورد': '🔒 Paneli Kilitle',
    '👑 المدير العام (admin/admin)': '👑 Genel Müdür (admin/admin)',
    'تخصيص الدولة النشطة': 'Aktif Ülke Kontrolü',
    'تسجيل الدخول لبوابة الداشبورد الشاملة': 'Yönetici Girişi',
    'اسم مستخدم الداشبورد والمنظومة': 'Kullanıcı Adı',
    'كلمة المرور للتحقق المرتبط': 'Güvenli Şifre',
    'الدخول الآمن للداشبورد ومصادقة الترخيص 🔓': 'Güvenli Giriş Yap 🔓',
    'تسجيل الدخول': 'Giriş Yap',
    'اسم المستخدم': 'Kullanıcı Adı',
    'كلمة المرور': 'Şifre',
    'المحفظة': 'Cüzdan',
    'الرصيد الحالي': 'Mevcut Bakiye',
    'إلغاء': 'İptal',
    'تأكيد': 'Onayla',
    'خروج': 'Çıkış Yap',
    'تسجيل خروج': 'Çıkış Yap'
  }
};

function translateNode(
  node: Node,
  language: string,
  aiTranslations: Record<string, Record<string, string>>,
  translateViaAI: (text: string, targetLang: string) => Promise<void>
) {
  const parent = node.parentElement;
  if (parent) {
    const tagName = parent.tagName.toLowerCase();
    if (
      tagName === 'script' ||
      tagName === 'style' ||
      tagName === 'code' ||
      tagName === 'pre' ||
      tagName === 'svg'
    ) {
      return;
    }
    if (
      parent.closest('.notranslate') ||
      parent.closest('.leaflet-container') ||
      parent.closest('#live-map')
    ) {
      return;
    }
  }

  const value = node.nodeValue || '';
  const trimmed = value.trim();
  if (!trimmed) return;

  // Skip purely numeric, symbols, or single emojis
  if (/^[\d\s\W\p{Emoji}]+$/u.test(trimmed)) {
    return;
  }

  // Retrieve or store original text
  if (!(node as any)._origText) {
    (node as any)._origText = trimmed;
  }

  const orig = (node as any)._origText;

  if (language === 'ar') {
    if (node.nodeValue !== orig) {
      node.nodeValue = orig;
    }
    return;
  }

  // Look for translation in local fallbacks or dynamic AI cache
  const translated = COMMON_FALLBACKS[language]?.[orig] || aiTranslations[language]?.[orig];

  if (translated) {
    if (node.nodeValue !== translated) {
      node.nodeValue = value.replace(orig, translated);
    }
  } else {
    // Trigger background AI translation
    translateViaAI(orig, language);
  }
}

function translateAttributes(
  el: Element,
  language: string,
  aiTranslations: Record<string, Record<string, string>>,
  translateViaAI: (text: string, targetLang: string) => Promise<void>
) {
  if (
    el.tagName.toLowerCase() === 'script' ||
    el.tagName.toLowerCase() === 'style' ||
    el.closest('.notranslate')
  ) {
    return;
  }

  const placeholder = el.getAttribute('placeholder');
  if (placeholder) {
    const trimmed = placeholder.trim();
    if (trimmed && !/^[\d\s\W\p{Emoji}]+$/u.test(trimmed)) {
      if (!(el as any)._origPlaceholder) {
        (el as any)._origPlaceholder = trimmed;
      }
      const orig = (el as any)._origPlaceholder;

      if (language === 'ar') {
        if (el.getAttribute('placeholder') !== orig) {
          el.setAttribute('placeholder', orig);
        }
      } else {
        const translated = COMMON_FALLBACKS[language]?.[orig] || aiTranslations[language]?.[orig];
        if (translated) {
          if (el.getAttribute('placeholder') !== translated) {
            el.setAttribute('placeholder', translated);
          }
        } else {
          translateViaAI(orig, language);
        }
      }
    }
  }
}

export function AiAutoTranslator() {
  const { language, aiTranslations, translateViaAI } = useAppState();

  useEffect(() => {
    // Run an initial translation scan immediately
    const runScan = () => {
      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walk.nextNode())) {
        translateNode(node, language, aiTranslations, translateViaAI);
      }

      // Also scan all inputs/textareas with placeholders
      const inputs = document.querySelectorAll('input[placeholder], textarea[placeholder]');
      inputs.forEach(input => {
        translateAttributes(input, language, aiTranslations, translateViaAI);
      });
    };

    runScan();

    // Use MutationObserver to observe DOM changes and translate newly added nodes instantly
    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldScan = true;
          break;
        } else if (mutation.type === 'characterData') {
          const node = mutation.target;
          if (node.nodeType === Node.TEXT_NODE) {
            const val = node.nodeValue || '';
            const orig = (node as any)._origText;
            if (
              orig &&
              val !== orig &&
              val !== (aiTranslations[language]?.[orig] || COMMON_FALLBACKS[language]?.[orig])
            ) {
              // Node was programmatically modified by React; capture new original text
              (node as any)._origText = val;
              shouldScan = true;
            }
          }
        }
      }

      if (shouldScan) {
        runScan();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [language, aiTranslations, translateViaAI]);

  return null;
}
