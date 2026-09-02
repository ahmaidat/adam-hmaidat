import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../stateEngine';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Navigation, 
  Calendar, 
  User, 
  Truck, 
  DollarSign, 
  CheckCircle, 
  ArrowRightLeft, 
  Info, 
  Terminal, 
  Wand2, 
  ArrowDownCircle, 
  Plus, 
  Trash2,
  MapPin,
  TrendingUp,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { getLocationCoords } from '../locationData';
import { AiActiveRideControlModal } from './AiActiveRideControlModal';

export const MasterRidesCrud: React.FC = () => {
  const { 
    requests, 
    rides, 
    scheduledTrips, 
    drivers, 
    passengers, 
    messages, 
    settings, 
    walletTransactions, 
    saveState, 
    createRequest,
    acceptRide,
    startRide,
    endRide,
    createIntraCityRide,
    acceptIntraCityRide,
    startIntraCityRide,
    endIntraCityRide,
    setDriverOnline,
    chargeDriver,
    chargePassenger,
    bookScheduledTrip,
    createAdminScheduledTrip,
    assignScheduledTripDriver,
    approveDriverScheduledTripRequest,
    intraCityRides,
    t 
  } = useAppState();

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // AI Active Ride Control Modal States
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedRideForAi, setSelectedRideForAi] = useState<any>(null);
  const [selectedTypeForAi, setSelectedTypeForAi] = useState<'instant' | 'intracity' | 'scheduled'>('instant');
  const [activeTab, setActiveTab] = useState<'instant_ride' | 'scheduled_trip' | 'database_tables'>('instant_ride');

  // --- SIMULATION RUNTIME STATES ---
  const [simStep, setSimStep] = useState<number>(0); // 0 = Idle, 1 = Placed, 2 = Accepted, 3 = Started, 4 = Completed
  const [simIsIntraCity, setSimIsIntraCity] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [simProgress, setSimProgress] = useState<number>(0);

  // Setup options
  const [simPassengerId, setSimPassengerId] = useState<string>('psg_ahmad');
  const [simDriverId, setSimDriverId] = useState<string>('drv_khalil');
  const [simFromArea, setSimFromArea] = useState<string>('عمان (Amman)-لواء قصبة عمان-الدوار السابع');
  const [simToArea, setSimToArea] = useState<string>('مطار الملكة علياء الدولي (Queen Alia Airport)');
  const [simSeats, setSimSeats] = useState<number>(1);
  const [simFare, setSimFare] = useState<number>(3.50);

  // Scheduled trip specific simulator states
  const [scheduledSimStep, setScheduledSimStep] = useState<number>(0); // 0 = Idle, 1 = Scheduled Posted, 2 = Passenger Booked, 3 = Driver Assigned & Executed
  const [simScheduledTripId, setSimScheduledTripId] = useState<string>('');
  
  // Ref for timer
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Predefined locations list for simulator dropdown
  const PRESET_PLACES = [
    { name: 'عمان (Amman)-لواء قصبة عمان-الدوار السابع', nameLoc: 'الدوار السابع' },
    { name: 'عمان (Amman)-لواء قصبة عمان-العبدلي', nameLoc: 'العبدلي' },
    { name: 'عمان (Amman)-لواء قصبة عمان-محيط الدوار الخامس', nameLoc: 'الدوار الخامس' },
    { name: 'الزرقاء (Zarqa)-لواء قصبة الزرقاء-الوسط التجاري', nameLoc: 'الوسط التجاري الزرقاء' },
    { name: 'إربد (Irbid)-لواء قصبة إربد-شارع جامعة اليرموك', nameLoc: 'محيط اليرموك' },
    { name: 'مطار الملكة علياء الدولي (Queen Alia Airport)', nameLoc: 'مطار الملكة علياء' },
    { name: 'العقبة (Aqaba)-لواء قصبة العقبة-محيط الشاطئ الشمالي', nameLoc: 'شواطئ العقبة' },
    { name: 'سحاب (Sahab)-لواء سحاب-منطقة المدينة الصناعية', nameLoc: 'المدينة الصناعية سحاب' },
    { name: 'السلط (Salt)-لواء قصبة السلط-شارع الستين', nameLoc: 'موقع مطل الستين بالسلط' }
  ];

  // System status alerts check
  useEffect(() => {
    // Keep logs updated with real events
    addLog(`[النظام] تم تجهيز لوحة التحكم التشغيلية المتكاملة لعام 2026. الكباتن المتصلون بالأردُن: ${drivers.filter(d => d.isOnline).length} | طلبات الركاب النشطة: ${requests.length}.`);
  }, []);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString('ar-JO', { hour12: false });
    setSimLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 100));
  };

  const clearLogs = () => {
    setSimLogs([]);
    addLog('تم تخليص وتنظيف سجل المحاكاة المباشر.');
  };

  // --- GEMINI AI ASSISTANT INTELLI-FILL ---
  const [isAiPrefilling, setIsAiPrefilling] = useState(false);

  const handleAiPrefill = async () => {
    setIsAiPrefilling(true);
    addLog('🧠 جاري إرسال طلب تجميع السلوك الذكي من نموذج Gemini 3.5 لملء سيناريو تجريبي واقعي...');
    
    try {
      // Create a creative prompt to get a fully populated Jordanian scenario
      const systemContext = {
        available_cities: PRESET_PLACES.map(p => p.name),
        drivers_names: drivers.map(d => d.fullName),
        passengers_names: passengers.map(p => p.fullName)
      };

      const prompt = `أنت في نظام محاكاة سيارات وتوصيل تشاركي في الأردن اسمه "آدم".
الرجاء تعبئة وتوليد واختيار تفاصيل سيناريو رحلة تشاركية أردنية حقيقية بشكل ممتاز من خيارات النظام الحالية:
الأماكن المتوفرة: ${JSON.stringify(PRESET_PLACES.map(p => p.name))}
الركاب المتوفرون: ${JSON.stringify(passengers.map(p => ({ id: p.id, name: p.fullName })))}
الكباتن المتوفرون: ${JSON.stringify(drivers.map(d => ({ id: d.id, name: d.fullName })))}

قم بإرجاع كائن JSON حصراً بالتنسيق التالي ودون كود مارك داون إضافي:
{
  "passengerId": "معرف الراكب المختار",
  "driverId": "معرف الكابتن المختار",
  "fromArea": "أحد الأماكن المتوفرة كنقطة انطلاق بالتفصيل",
  "toArea": "أحد الأماكن المتوفرة كوجهة بالتفصيل",
  "seats": "عدد مقاعد عشوائي بين 1 و 3",
  "fare": "سعر مقترح مناسب للرحلة بالدينار الأردني بين 2.0 و 9.5",
  "isIntraCity": "boolean عشوائي لمعرفة هل التوصيل داخل المدينة أم بين مدينتين",
  "reason": "جملة تبرير تسويقية مضحكة بالعامية الأردنية توضح سبب الرحلة والسيناريو المختار"
}`;

      const res = await fetch('/api/ai-diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemContext })
      });
      
      const data = await res.json();
      
      if (data.success && data.text) {
        // Clean markdown backticks if any
        let cleanText = data.text.trim();
        if (cleanText.startsWith('```json')) cleanText = cleanText.substring(7);
        if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3);
        
        try {
          const parsed = JSON.parse(cleanText.trim());
          
          if (parsed.fromArea) setSimFromArea(parsed.fromArea);
          if (parsed.toArea) setSimToArea(parsed.toArea);
          if (parsed.passengerId) setSimPassengerId(parsed.passengerId);
          if (parsed.driverId) setSimDriverId(parsed.driverId);
          if (parsed.seats) setSimSeats(Number(parsed.seats));
          if (parsed.fare) setSimFare(Number(parsed.fare));
          setSimIsIntraCity(parsed.isIntraCity ?? false);
          
          addLog(`✨ [Gemini AI] تم توليد السيناريو بنجاح! السبب المختار: "${parsed.reason || 'المشوار مستعجل!'}"`);
          setSuccessMsg(t('تم ملء الحقول بالذكاء الاصطناعي بنجاح!', 'AI smart scenario generated successfully!'));
          setTimeout(() => setSuccessMsg(''), 4000);
        } catch (e) {
          throw new Error('فشل تحليل استجابة الذكاء الاصطناعي كـ JSON');
        }
      } else {
        // Fallback local smart prefiller if Gemini key is not configured
        runLocalFallbackPrefill();
      }
    } catch (err: any) {
      console.warn("AI Prefill exception:", err);
      runLocalFallbackPrefill();
    } finally {
      setIsAiPrefilling(false);
    }
  };

  const runLocalFallbackPrefill = () => {
    // Smart local generator
    const randomP = passengers[Math.floor(Math.random() * passengers.length)] || { id: 'psg_ahmad', fullName: 'أحمد العبادي الأكرم' };
    const randomD = drivers[Math.floor(Math.random() * drivers.length)] || { id: 'drv_khalil', fullName: 'خليل كابتن المطار الشهم' };
    
    const randomFrom = PRESET_PLACES[Math.floor(Math.random() * 4)]; // First 4
    let randomTo = PRESET_PLACES[4 + Math.floor(Math.random() * 5)]; // Next ones
    if (randomFrom.name === randomTo.name) {
      randomTo = PRESET_PLACES[PRESET_PLACES.length - 1];
    }

    const seatsRandom = Math.floor(Math.random() * 3) + 1;
    const randomFare = Number((3 + Math.random() * 6).toFixed(1));
    const randomLocal = Math.random() > 0.5;

    setSimPassengerId(randomP.id);
    setSimDriverId(randomD.id);
    setSimFromArea(randomFrom.name);
    setSimToArea(randomTo.name);
    setSimSeats(seatsRandom);
    setSimFare(randomFare);
    setSimIsIntraCity(randomLocal);

    addLog(`⚙️ [محاكي ذكي محلي] تم توليد مشوار تجريبي سريع: من "${randomFrom.nameLoc}" إلى "${randomTo.nameLoc}" للراكب ${randomP.fullName}.`);
    setSuccessMsg(t('تم توليد سيناريو محلي متميز!', 'Smart local scenario prefilled!'));
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // --- AUTOMATIC CYCLE PLAYBACK EXECUTION ---

  // Handle Autoplay triggers
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayIntervalRef.current = setInterval(() => {
        handleNextStep();
      }, 3500);
    } else {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    }

    return () => {
      if (autoPlayIntervalRef.current) clearInterval(autoPlayIntervalRef.current);
    };
  }, [isAutoPlaying, simStep, activeTab, scheduledSimStep]);

  const handleNextStep = () => {
    if (activeTab === 'instant_ride') {
      executeInstantStep();
    } else {
      executeScheduledStep();
    }
  };

  // --- SECNARIO A: INSTANT RIDE STEP BY STEP ---
  const executeInstantStep = () => {
    const selectedPassenger = passengers.find(p => p.id === simPassengerId);
    const selectedDriver = drivers.find(d => d.id === simDriverId);

    if (!selectedPassenger) {
      addLog('❌ خطأ المحاكاة: يرجى تسجيل أو تحديد راكب آدم سليم للمتابعة.');
      setIsAutoPlaying(false);
      return;
    }
    if (!selectedDriver) {
      addLog('❌ خطأ المحاكاة: يرجى تحديد كابتن معتمد لبدء استقبال التوصيل.');
      setIsAutoPlaying(false);
      return;
    }

    // STEP 0 -> Step 1: Place Request & Secure E-Wallet Guarantee
    if (simStep === 0) {
      addLog(`[الخطوة 1/4] 👤 محاكاة طلب الراكب: جاري تفعيل الحساب وشحن رصيد الراكب "${selectedPassenger.fullName}" (الحالي: ${selectedPassenger.balance} د.أ) لضمان الدفع والبدء...`);
      
      // Auto-charge passenger balance if less than required
      if (selectedPassenger.balance < simSeats * 1.0 + simFare) {
        chargePassenger(selectedPassenger.id, 15.0);
        addLog(`💳 تم تزويد محفظة الراكب تكميلياً بـ +15.00 د.أ لاجتياز قيود ضمان الإلغاء الأردنية.`);
      }

      // Auto-charge driver balance if less than 5 JD to prevent online error
      if (selectedDriver.balance <= 0) {
        chargeDriver(selectedDriver.id, 10.0);
        addLog(`💳 تم تزويد محفظة الكابتن تكميلياً بـ +10.00 د.أ لتجاوز حد العمولات المتراكمة.`);
      }

      // Set driver online so he can capture the ride properly
      if (!selectedDriver.isOnline) {
        setDriverOnline(selectedDriver.id, true);
        addLog(`🚕 تم تفعيل الكابتن "${selectedDriver.fullName}" متصلاً وجاهزاً لاستقبال الركوب.`);
      }

      // Create request
      if (simIsIntraCity) {
        const pickCoords = getLocationCoords(simFromArea);
        const dropCoords = getLocationCoords(simToArea);
        const res = createIntraCityRide(
          selectedPassenger.id,
          simFromArea,
          simToArea,
          6.8, // distance in km
          12,  // duration
          simFare,
          simFare * 0.20, // commission 20%
          pickCoords,
          dropCoords
        );
        if (res.success && res.ride) {
          addLog(`✓ [طلب مباشر] تم إطلاق طلب توصيل فوري محلي بنجاح بالمعرف المحجوز: (#${res.ride.id.substring(0, 8)})`);
        } else {
          addLog(`❌ تعذر طلب المشوار المباشر: ${res.msg}`);
          setIsAutoPlaying(false);
          return;
        }
      } else {
        const res = createRequest(selectedPassenger.id, simFromArea, simToArea, simSeats);
        if (res.success) {
          addLog(`✓ [طلب تشاركي] تم إطلاق طلب تجميع والبحث عن مسار تجميع نشط.`);
        } else {
          addLog(`❌ تعذر إتمام التشاركي: ${res.msg}`);
          setIsAutoPlaying(false);
          return;
        }
      }

      setSimStep(1);
      setSimProgress(0);
      return;
    }

    // Step 1 -> Step 2: Driver Acceptance & Sonar GPS Target Locking
    if (simStep === 1) {
      addLog(`[الخطوة 2/4] 🔍 فحص ومحاكاة قبول الكابتن: جاري فرز الكباتن المتاحين وتكليف كابتن "${selectedDriver.fullName}" بالاستجابة...`);

      if (simIsIntraCity) {
        // Find pending intra city ride
        const activeLocal = intraCityRides.find(r => r.passengerId === selectedPassenger.id && r.status === 'pending');
        if (activeLocal) {
          acceptIntraCityRide(activeLocal.id, selectedDriver.id);
          addLog(`🚕 كلاكيت! قبل الكابتن "${selectedDriver.fullName}" الرحلة المباشرة بنجاح وهو في طريقه للتحميل الآن.`);
          setSimStep(2);
        } else {
          addLog(`⚠️ لم نجد طلباً معلقاً مباشراً للراكب، جاري البحث ثانية...`);
        }
      } else {
        // Find matching pooling ride
        const matchedRide = rides.find(r => r.status === 'pooling' && r.requests.some(req => req.passengerId === selectedPassenger.id));
        if (matchedRide) {
          acceptRide(matchedRide.id, selectedDriver.id);
          addLog(`🚕 كلاكيت! قبل كابينات تجميع آدم الكابتن الشهم "${selectedDriver.fullName}" مشوار التجميع بنجاح.`);
          setSimStep(2);
        } else {
          // If not created because of pooling delay, let's look in requests to force match
          const reqItem = requests.find(r => r.passengerId === selectedPassenger.id && r.status === 'pending');
          if (reqItem) {
            addLog(`⚡ جاري معالجة وتفويج الطلب المتأخر يدوياً...`);
            // force status change so is visible
            reqItem.status = 'pooling';
          } else {
            addLog(`⚠️ بانتظار تشكيل سيارات تجميع كافية على الخريطة الأردنية...`);
          }
        }
      }
      return;
    }

    // Step 2 -> Step 3: Start Journey & Smooth Map Movement Simulation
    if (simStep === 2) {
      addLog(`[الخطوة 3/4] 🛣️ انطلاق حركة السيارة: الكابتن "${selectedDriver.fullName}" يؤكد ركوب المسافرين وبدء العداد الجغرافي المباشر...`);

      if (simIsIntraCity) {
        const activeLocal = intraCityRides.find(r => r.passengerId === selectedPassenger.id && r.status === 'accepted');
        if (activeLocal) {
          startIntraCityRide(activeLocal.id);
          addLog(`🚀 انطلقت المركبة الآن! المسار نشط جغرافياً على الخريطة الرقمية لعمان.`);
          setSimStep(3);
          simulateGPSCoordinatesMovement();
        } else {
          addLog(`⚠️ لم نجد رحلة مقبولة قيد التحضير للكابتن.`);
        }
      } else {
        const matchedRide = rides.find(r => r.driverId === selectedDriver.id && r.status === 'accepted');
        if (matchedRide) {
          startRide(matchedRide.id);
          addLog(`🚀 انطلقت الرحلة المشتركة التشاركية بين المدن! ننبه الكابتن لالتزام السرعة القانونية.`);
          setSimStep(3);
          simulateGPSCoordinatesMovement();
        } else {
          addLog(`⚠️ لم نجد رحلة مقبولة لخط السير التشاركي.`);
        }
      }
      return;
    }

    // Step 3 -> Step 4: End Journey, Transfer Money & Automatic Rating
    if (simStep === 3) {
      if (simProgress < 100) {
        addLog(`🚚 جاري الملاحة ونقل المركبة... التقدم الحالي: ${simProgress}% مكتمل ويقترب للنزول.`);
        // Let interval run coordinates helper
        return;
      }

      addLog(`[الخطوة 4/4] 🏁 الإنزال وتأكيد المحفظة: الكابتن "${selectedDriver.fullName}" يؤكد إتمام الرحلة ومغادرة الركاب...`);

      if (simIsIntraCity) {
        const activeLocal = intraCityRides.find(r => r.passengerId === selectedPassenger.id && r.status === 'started');
        if (activeLocal) {
          endIntraCityRide(activeLocal.id);
          addLog(`✓ تم إتمام التوصيل وتوزيع الحساب بنجاح! تم اقتطاع (${simFare} د.أ) للربح وحسم عمولة الشركة.`);
          setSimStep(4);
          setIsAutoPlaying(false);
          setSuccessMsg('🏆 اكتملت عملية المحاكاة التلقائية للرحلة الفورية بنجاح!');
        }
      } else {
        const matchedRide = rides.find(r => r.driverId === selectedDriver.id && r.status === 'started');
        if (matchedRide) {
          endRide(matchedRide.id);
          addLog(`✓ تم تفريغ الركاب وإنهاء حافلة التجميع بنجاح وتحويل العمولات للمحفظة المركزية.`);
          setSimStep(4);
          setIsAutoPlaying(false);
          setSuccessMsg('🏆 اكتملت عملية تجميع الركاب والسفر بين المحافظات بنجاح!');
        }
      }
      
      return;
    }

    // Finished
    if (simStep === 4) {
      resetInstantRideSimulation();
    }
  };

  const simulateGPSCoordinatesMovement = () => {
    setSimProgress(10);
    let currentPrg = 10;
    const interval = setInterval(() => {
      currentPrg += 30;
      if (currentPrg >= 100) {
        currentPrg = 100;
        clearInterval(interval);
      }
      setSimProgress(currentPrg);
      addLog(`📍 [تحديث GPS المركبة]: تحرك السيارة في الطريق العام... مستوى الإنجاز جغرافياً: ${currentPrg}%`);
    }, 1000);
  };

  const resetInstantRideSimulation = () => {
    // Clear lists if needed or just reset steps
    setSimStep(0);
    setSimProgress(0);
    setIsAutoPlaying(false);
    addLog('🔄 تم تصفير وإعادة تعيين خطوط محاكاة الرحلات الفورية للبدء من جديد.');
  };

  // --- SCENARIO B: SCHEDULED TRIP STEP BY STEP ---
  const executeScheduledStep = () => {
    const selectedPassenger = passengers.find(p => p.id === simPassengerId);
    const selectedDriver = drivers.find(d => d.id === simDriverId);

    if (!selectedPassenger) {
      addLog('❌ خطأ المحاكاة المجدولة: يرجى اختيار راكب.');
      setIsAutoPlaying(false);
      return;
    }
    if (!selectedDriver) {
      addLog('❌ خطأ المحاكاة المجدولة: يرجى اختيار سائق.');
      setIsAutoPlaying(false);
      return;
    }

    // Step 0 -> Step 1: Create Scheduled Ticket from Admin Panel
    if (scheduledSimStep === 0) {
      addLog(`[الخطوة 1/3] 📅 إنشاء تذكرة الرحلة المجدولة: إطلاق مسار معتمد بين المحافظات (${simFromArea.split('-').pop()} ➔ ${simToArea.split('-').pop()}) لعام 2026...`);
      
      const departureTomorrow = "2026-06-15 14:00";
      const res = createAdminScheduledTrip(
        simFromArea,
        simToArea,
        departureTomorrow,
        simFare, // Custom price per seat
        1.5,      // Custom commission
        null      // Left unassigned for captains to apply
      );

      if (res.success) {
        // Find the newly created scheduled trip
        const created = scheduledTrips.find(t => t.fromArea === simFromArea && t.toArea === simToArea && t.status === 'pending');
        if (created) {
          setSimScheduledTripId(created.id);
          addLog(`✓ تم تعميم ونشر تذكرة مشوار تجميعي مجدول معلق بالرقم: (#${created.id.substring(0, 8)})`);
          setScheduledSimStep(1);
        } else {
          // Fallback if not easily filtered
          setSimScheduledTripId(scheduledTrips[scheduledTrips.length - 1]?.id || 'sch_trip_1');
          setScheduledSimStep(1);
        }
      } else {
        addLog(`❌ فشل النشر: ${res.msg}`);
        setIsAutoPlaying(false);
      }
      return;
    }

    // Step 1 -> Step 2: Passenger Books Seat on the Scheduled Trip
    if (scheduledSimStep === 1) {
      addLog(`[الخطوة 2/3] 🪑 حجز مقاعد تجميع التذكرة: الراكب "${selectedPassenger.fullName}" يشتري مقعداً من المقاعد الـ 4 المتاحة للتفويج المجدول...`);
      
      // Charge balance if low
      if (selectedPassenger.balance < simFare) {
        chargePassenger(selectedPassenger.id, 10);
        addLog('💳 تم تغذية محفظة الراكب لمنع رفض الحجز المالي.');
      }

      const tripIdToBook = simScheduledTripId || (scheduledTrips[scheduledTrips.length - 1]?.id);
      if (tripIdToBook) {
        const res = bookScheduledTrip(selectedPassenger.id, tripIdToBook, 1);
        if (res.success) {
          addLog(`✓ تم تأكيد وحجز مقعد المسافر ذكياً! المقاعد المتبقية بالتذكرة المجدولة: 3 مقاعد.`);
          setScheduledSimStep(2);
        } else {
          addLog(`❌ تعذر حجز المقعد: ${res.msg}`);
          setIsAutoPlaying(false);
        }
      } else {
         addLog('❌ لم يتم العثور على مشوار نشط للحجز فيه.');
         setIsAutoPlaying(false);
      }
      return;
    }

    // Step 2 -> Step 3: Assign Captain & Complete Trip
    if (scheduledSimStep === 2) {
      addLog(`[الخطوة 3/3] 🚕 تكليف وتعييد كابتن التجميع: يتم تحويل وحفظ المشوار للكابتن "${selectedDriver.fullName}" لإجراء التوصيل وإقفال التذكرة...`);

      const tripIdToFinalize = simScheduledTripId || (scheduledTrips[scheduledTrips.length - 1]?.id);
      if (tripIdToFinalize) {
        // Assign driver
        assignScheduledTripDriver(tripIdToFinalize, selectedDriver.id);
        addLog(`🤝 تم إسناد المهمة للكابتن "${selectedDriver.fullName}" بنجاح.`);

        // To make simulation complete, we can automatically mark the status as accepted / completed in administrative database
        const trip = scheduledTrips.find(t => t.id === tripIdToFinalize);
        if (trip) {
          trip.status = 'completed';
          addLog(`🏁 تم وصول مركبة الكابتن بسلام وتحصيل إيرادات المشوار وتأكيد سلامة الركاب!`);
          setScheduledSimStep(0);
          setIsAutoPlaying(false);
          setSuccessMsg('🏆 تم إنجاز وتجربة المشوار المجدول بالكامل بنجاح مالي مذهل!');
        }
      } else {
        addLog('❌ تعذر إيجاد التذكرة لإسنادها.');
        setIsAutoPlaying(false);
      }
      return;
    }
  };

  const resetScheduledSimulation = () => {
    setScheduledSimStep(0);
    setSimScheduledTripId('');
    setIsAutoPlaying(false);
    addLog('🔄 تم تصفير حقول ومستندات محاكاة التذاكر المجدولة بنجاح.');
  };

  // Standard database status operations
  const handleClearAll = () => {
    if (window.confirm(t(
      'هل أنت متأكد من تصفير كافة طلبات الركاب النشطة والرحلات المشتركة ومسحها من الذاكرة؟',
      'Are you sure you want to purge all active ride requests and ongoing pooled runs?'
    ))) {
      saveState(drivers, passengers, [], [], [], settings, [], walletTransactions);
      setSuccessMsg(t('تم تصفير كافة الطلبات والرحلات والتذاكر المجدولة!', 'Purged all active rides & requests!'));
      setSimStep(0);
      setScheduledSimStep(0);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* Dynamic Error & Success top alert strips */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold p-3.5 rounded-xl text-xs text-center animate-pulse flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 font-bold p-3.5 rounded-xl text-xs text-center flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* --- PREMIUM WORKFLOW SIMULATOR WRAPPER --- */}
      <div className="bg-slate-900/35 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        
        {/* Navigation and headers */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2.5 flex-row-reverse">
            <div className="p-1.5 bg-indigo-500/15 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-100 uppercase tracking-wide">🔬 مركز محاكاة المشاوير والأرصدة بالذكاء الاصطناعي (AI Cycle Playback)</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">قم بعمل تجربة اوتوماتيكية كاملة وفحص السيناريوهات التفاعلية مع تحديث مباشر في شاشات الكباتن والركاب</p>
            </div>
          </div>

          <div className="flex gap-1.5 bg-slate-950/80 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => { setActiveTab('instant_ride'); setIsAutoPlaying(false); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${activeTab === 'instant_ride' ? 'bg-indigo-650 text-white' : 'text-slate-450 hover:text-slate-200'}`}
            >
              <Navigation className="w-3 h-3 text-emerald-400" />
              <span>محاكاة الرحلات الفورية</span>
            </button>
            <button
              onClick={() => { setActiveTab('scheduled_trip'); setIsAutoPlaying(false); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${activeTab === 'scheduled_trip' ? 'bg-indigo-650 text-white' : 'text-slate-450 hover:text-slate-200'}`}
            >
              <Calendar className="w-3 h-3 text-indigo-400" />
              <span>محاكاة السفر المجدول</span>
            </button>
            <button
              onClick={() => { setActiveTab('database_tables'); setIsAutoPlaying(false); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${activeTab === 'database_tables' ? 'bg-indigo-650 text-white' : 'text-slate-450 hover:text-slate-200'}`}
            >
              <Terminal className="w-3 h-3 text-amber-500" />
              <span>سجلات وقاعدة البيانات</span>
            </button>
          </div>
        </div>

        <div className="p-5 md:p-6 space-y-5">
          
          {/* INTERACTIVE FORM VALUES ACCESSIBLE TO BOTH SCENARIOS */}
          {activeTab !== 'database_tables' && (
            <div className="p-4 bg-[#060a1c] border border-slate-800/80 rounded-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-[10px] font-bold text-slate-400">⚙️ ضبط وتجهيز الراكب والوجهة وقيم التوصيل (قنوات ديناميكية)</span>
                <button
                  type="button"
                  disabled={isAiPrefilling}
                  onClick={handleAiPrefill}
                  className="bg-amber-500 hover:bg-amber-600 font-extrabold text-slate-950 px-2.5 py-1 rounded-lg text-[9px] cursor-pointer flex items-center gap-1 transition shadow-lg shadow-amber-950/20 shrink-0"
                >
                  <Wand2 className="w-3.5 h-3.5 text-slate-950 animate-bounce" />
                  <span>{isAiPrefilling ? 'جاري الفهم بالـ AI...' : 'تعبئة عينات ذكية بالذكاء الاصطناعي (AI Generation)'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-right">
                {/* Passenger details */}
                <div className="space-y-1">
                  <label className="text-[10.5px] text-slate-400 font-bold block">👤 الراكب المشتري (Passenger):</label>
                  <select
                    value={simPassengerId}
                    onChange={(e) => setSimPassengerId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 cursor-pointer text-xs"
                  >
                    {passengers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} - (محفظة: {p.balance.toFixed(1)} د.أ)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Driver details */}
                <div className="space-y-1">
                  <label className="text-[10.5px] text-slate-400 font-bold block">🚕 الكابتن الموصى به (Captain):</label>
                  <select
                    value={simDriverId}
                    onChange={(e) => setSimDriverId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 cursor-pointer text-xs"
                  >
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} - ({d.isOnline ? '🟢 متصل' : '⚪ غير متصل'} / رصيد: {d.balance.toFixed(1)} د.أ)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Total seats count setup */}
                <div className="space-y-1">
                  <label className="text-[10.5px] text-slate-400 font-bold block">🪑 المقاعد المطلوبة للتفويج دقة:</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSimSeats(s)}
                        className={`flex-1 p-1.5 rounded-lg font-mono text-center font-bold text-xs border cursor-pointer transition ${simSeats === s ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-right pt-2 border-t border-slate-800/40">
                {/* Pickup point dropdown preset */}
                <div className="space-y-1">
                  <label className="text-[10.5px] text-slate-400 font-bold block">📍 نقطة الانطلاق الجغرافي (From):</label>
                  <select
                    value={simFromArea}
                    onChange={(e) => setSimFromArea(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 cursor-pointer text-xs"
                  >
                    {PRESET_PLACES.map((p, idx) => (
                      <option key={idx} value={p.name}>{p.nameLoc}</option>
                    ))}
                  </select>
                </div>

                {/* Dropoff point dropdown preset */}
                <div className="space-y-1">
                  <label className="text-[10.5px] text-slate-400 font-bold block">🏁 وجهة النزول النهائية (To):</label>
                  <select
                    value={simToArea}
                    onChange={(e) => setSimToArea(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 cursor-pointer text-xs"
                  >
                    {PRESET_PLACES.map((p, idx) => (
                      <option key={idx} value={p.name}>{p.nameLoc}</option>
                    ))}
                  </select>
                </div>

                {/* Fare custom setup */}
                <div className="space-y-1">
                  <label className="text-[10.5px] text-slate-400 font-bold block">💵 قيمة مشوار/مقعد الركوب الافتراضي:</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="1.5"
                      max="20"
                      value={simFare}
                      onChange={(e) => setSimFare(parseFloat(e.target.value) || 3.50)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 px-3 text-slate-200 text-xs text-left"
                    />
                    <span className="absolute top-2 left-3 text-[10px] text-slate-500 font-bold pointer-events-none">د.أ (JD)</span>
                  </div>
                </div>
              </div>

              {activeTab === 'instant_ride' && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/20 text-xs justify-end flex-row-reverse">
                  <input
                    type="checkbox"
                    id="simIntraToggle"
                    checked={simIsIntraCity}
                    onChange={(e) => setSimIsIntraCity(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-500 bg-slate-900 border-slate-800 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="simIntraToggle" className="text-slate-350 cursor-pointer select-none font-medium text-[10.5px]">
                    نوع المشوار الفوري: <span className="text-amber-400 font-extrabold">{simIsIntraCity ? '🚕 مباشر محلي داخل المدينة (Intra-city)' : '🛣️ تجميع تشاركي بين المحافظات (Inter-city)'}</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* --- VIEWPORT TAB 1: INSTANT RIDE PLAYBACK --- */}
          {activeTab === 'instant_ride' && (
            <div className="space-y-6">
              
              {/* PLAYBACK VISUAL CONTROLS */}
              <div className="bg-[#05070e] p-4 rounded-xl border border-slate-800/80">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 flex-row-reverse text-right">
                  <div>
                    <h4 className="text-xs font-black text-slate-200 flex items-center gap-1 justify-end flex-row-reverse">
                      <span>الخطوات المبرمجة للمشوار الفوري (Instant Ride Execution Hub)</span>
                      <span className="bg-emerald-500 text-slate-950 px-1 py-0.5 rounded text-[8.5px] font-bold">عمر المحاكاة: 2026</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">شغّل المشوار بخطوة واحدة أو اضغط تشغيل لمشاهدة دورة حياة الطلب كاملة تلقائياً في ثوانٍ معدودة</p>
                  </div>

                  {/* Play Buttons */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow ${isAutoPlaying ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:opacity-90 font-black'}`}
                    >
                      {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-slate-950" />}
                      <span>{isAutoPlaying ? 'إيقاف المحاكاة مؤقتاً' : 'تشغيل المحاكاة التلقائية الكاملة'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={isAutoPlaying || simStep === 4}
                      className="bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>⏭️ خطوة تالية يدوياً</span>
                    </button>

                    <button
                      type="button"
                      onClick={resetInstantRideSimulation}
                      className="bg-red-950 text-red-400 hover:bg-red-900/40 border border-red-900/30 p-2 rounded-xl transition cursor-pointer"
                      title="تصفير المحاكي"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Steps visual track bar */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
                  
                  {/* Step 0: Idle */}
                  <div className={`p-2.5 rounded-lg border text-center transition flex flex-col justify-between ${simStep === 0 ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300' : 'bg-slate-900/30 border-slate-850 text-slate-500'}`}>
                    <span className="text-[9px] font-bold block mb-1">المرحلة الأساسية</span>
                    <span className="text-xs font-extrabold flex items-center justify-center gap-1">
                      <span>⚙️ جاهز للبدء</span>
                    </span>
                    <span className="text-[8.5px] mt-1 block leading-normal">تجهيز الرصيد والبيانات</span>
                  </div>

                  {/* Step 1: Placed */}
                  <div className={`p-2.5 rounded-lg border text-center transition flex flex-col justify-between ${simStep === 1 ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300' : simStep > 1 ? 'bg-emerald-950/25 border-emerald-900/35 text-emerald-500' : 'bg-slate-900/30 border-slate-850 text-slate-500'}`}>
                    <span className="text-[9px] font-bold block mb-1 font-mono">STEP 01</span>
                    <span className="text-xs font-extrabold flex items-center justify-center gap-1">
                      {simStep > 1 ? '✓' : ''} <span>👤 طلب الركوب</span>
                    </span>
                    <span className="text-[8.5px] mt-1 block leading-normal">إنشاء الطلب وحبس الضمان</span>
                  </div>

                  {/* Step 2: Accepted */}
                  <div className={`p-2.5 rounded-lg border text-center transition flex flex-col justify-between ${simStep === 2 ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300' : simStep > 2 ? 'bg-emerald-950/25 border-emerald-900/35 text-emerald-500' : 'bg-slate-900/30 border-slate-850 text-slate-500'}`}>
                    <span className="text-[9px] font-bold block mb-1 font-mono">STEP 02</span>
                    <span className="text-xs font-extrabold flex items-center justify-center gap-1">
                      {simStep > 2 ? '✓' : ''} <span>🚕 قبول الكابتن</span>
                    </span>
                    <span className="text-[8.5px] mt-1 block leading-normal">قفل الطلب وتعييد السائق</span>
                  </div>

                  {/* Step 3: Started */}
                  <div className={`p-2.5 rounded-lg border text-center transition flex flex-col justify-between ${simStep === 3 ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300 font-bold' : simStep > 3 ? 'bg-emerald-950/25 border-emerald-900/35 text-emerald-500' : 'bg-slate-900/30 border-slate-850 text-slate-500'}`}>
                    <span className="text-[9px] font-bold block mb-1 font-mono">STEP 03</span>
                    <span className="text-xs font-extrabold flex items-center justify-center gap-1">
                      {simStep > 3 ? '✓' : ''} <span>🚀 رحلة جارية</span>
                    </span>
                    {simStep === 3 && (
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1 border border-slate-800">
                        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${simProgress}%` }} />
                      </div>
                    )}
                    <span className="text-[8.5px] mt-1 block leading-normal">محاكاة التحرك والعداد</span>
                  </div>

                  {/* Step 4: Completed */}
                  <div className={`p-2.5 rounded-lg border text-center transition flex flex-col justify-between ${simStep === 4 ? 'bg-emerald-950 border-emerald-500 text-emerald-400 font-bold' : 'bg-slate-900/30 border-slate-850 text-slate-500'}`}>
                    <span className="text-[9px] font-bold block mb-1 font-mono">STEP 04</span>
                    <span className="text-xs font-extrabold flex items-center justify-center gap-1">
                      <span>🏁 الإنزال واكتملت</span>
                    </span>
                    <span className="text-[8.5px] mt-1 block leading-normal">توزيع المستحقات والتقييم</span>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* --- VIEWPORT TAB 2: SCHEDULED TRIP PLAYBACK --- */}
          {activeTab === 'scheduled_trip' && (
            <div className="space-y-6">
              
              {/* SCHEDULED PLAYBACK VISUAL CONTROLS */}
              <div className="bg-[#05070e] p-4 rounded-xl border border-slate-800/80">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 flex-row-reverse text-right">
                  <div>
                    <h4 className="text-xs font-black text-slate-200 flex items-center gap-1 justify-end flex-row-reverse">
                      <span>إحراز حافلات السفر المجدولة تفصيلاً (Scheduled Trip Run)</span>
                      <span className="bg-indigo-500 text-slate-950 px-1 py-0.5 rounded text-[8.5px] font-bold">بين المحافظات</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">تبدأ بنشر تذكرة مشوار للسيرفر، مروراً بحجز تذاكر الركاب، وصولاً لإسناد مركبة وتأكيد الوصول بسلام</p>
                  </div>

                  {/* Play Buttons */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow ${isAutoPlaying ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-gradient-to-r from-indigo-500 to-indigo-650 text-white hover:opacity-90 font-black'}`}
                    >
                      {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-white" />}
                      <span>{isAutoPlaying ? 'إيقاف المحاكاة مؤقتاً' : 'تشغيل المحاكاة التلقائية الكاملة'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={isAutoPlaying}
                      className="bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <span>⏭️ خطوة تالية يدوياً</span>
                    </button>

                    <button
                      type="button"
                      onClick={resetScheduledSimulation}
                      className="bg-red-950 text-red-400 hover:bg-red-900/40 border border-red-900/30 p-2 rounded-xl transition cursor-pointer"
                      title="تصفير المحاكي المجدول"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Steps visual scheduled track bar */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-6">
                  
                  {/* Step 0: Idle */}
                  <div className={`p-2.5 rounded-lg border text-center transition flex flex-col justify-between ${scheduledSimStep === 0 ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300' : 'bg-slate-900/30 border-slate-850 text-slate-500'}`}>
                    <span className="text-[9px] font-bold block mb-1 font-mono">PRE-START</span>
                    <span className="text-xs font-extrabold flex items-center justify-center gap-1">
                      <span>⚙️ خمول المحاكاة</span>
                    </span>
                    <span className="text-[8.5px] mt-1 block leading-normal">تجهيز نقطة السفر بين المحافظات</span>
                  </div>

                  {/* Step 1: Placed trip */}
                  <div className={`p-2.5 rounded-lg border text-center transition flex flex-col justify-between ${scheduledSimStep === 1 ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300' : scheduledSimStep > 1 ? 'bg-emerald-950/25 border-emerald-900/35 text-emerald-500' : 'bg-slate-900/30 border-slate-850 text-slate-500'}`}>
                    <span className="text-[9px] font-bold block mb-1 font-mono">STAGE 01</span>
                    <span className="text-xs font-extrabold flex items-center justify-center gap-1">
                      {scheduledSimStep > 1 ? '✓' : ''} <span>📅 نشر تذكرة الرحلة</span>
                    </span>
                    <span className="text-[8.5px] mt-1 block leading-normal">إنشاء التذكرة المبرمجة بالمعرض</span>
                  </div>

                  {/* Step 2: Booked */}
                  <div className={`p-2.5 rounded-lg border text-center transition flex flex-col justify-between ${scheduledSimStep === 2 ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300' : scheduledSimStep > 2 ? 'bg-emerald-950/25 border-emerald-900/35 text-emerald-500' : 'bg-slate-900/30 border-slate-850 text-slate-500'}`}>
                    <span className="text-[9px] font-bold block mb-1 font-mono">STAGE 02</span>
                    <span className="text-xs font-extrabold flex items-center justify-center gap-1">
                      {scheduledSimStep > 2 ? '✓' : ''} <span>🪑 قييد وحجز مع الركاب</span>
                    </span>
                    <span className="text-[8.5px] mt-1 block leading-normal">حجز مقعد المسافر وتناقص المتوفر</span>
                  </div>

                  {/* Step 3: Assigned */}
                  <div className={`p-2.5 rounded-lg border text-center transition flex flex-col justify-between ${scheduledSimStep === 3 ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300' : 'bg-slate-900/30 border-slate-850 text-slate-500'}`}>
                    <span className="text-[9px] font-bold block mb-1 font-mono">STAGE 03</span>
                    <span className="text-xs font-extrabold flex items-center justify-center gap-1">
                      <span>🏆 تكليف الكابتن والإنزال</span>
                    </span>
                    <span className="text-[8.5px] mt-1 block leading-normal">إتمام التوصيل وتوزيع الحساب</span>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* --- CONSOLE OUTPUT FOR THE EXPERIMENTAL ENGINE --- */}
          {(activeTab === 'instant_ride' || activeTab === 'scheduled_trip') && (
            <div className="bg-[#03050c] border border-slate-850 rounded-xl overflow-hidden font-mono text-[11px]">
              <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-850 flex justify-between items-center text-slate-400">
                <button
                  onClick={clearLogs}
                  className="text-[9px] text-[#fbbf24] hover:underline cursor-pointer"
                >
                  مسح المخرجات
                </button>
                <span className="text-[10px] font-bold tracking-widest flex items-center gap-1.5 flex-row-reverse">
                  <span>📟 سجل تتبع أحداث السيرفر (Live Simulator Logs)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </span>
              </div>
              <div className="p-3.5 h-[160px] overflow-y-auto space-y-1.5 text-right font-mono text-slate-300 leading-relaxed scrollbar-thin">
                {simLogs.map((log, i) => (
                  <div key={i} className={`pb-1 border-b border-slate-950/40 ${log.includes('❌') ? 'text-red-400' : log.includes('✓') ? 'text-emerald-400' : log.includes('✨') ? 'text-amber-400' : 'text-slate-350'}`}>
                    {log}
                  </div>
                ))}
                {simLogs.length === 0 && (
                  <span className="text-slate-600 block text-center py-8 italic font-sans text-xs">لا يوجد وقائع تتبع للمحاكاة حتى الآن. انقر على تشغيل المحاكاة التلقائية لبدء رصد الحقول حياً.</span>
                )}
              </div>
            </div>
          )}

          {/* --- VIEWPORT TAB 3: OLD STATIC CRM AND RAW TABLES --- */}
          {activeTab === 'database_tables' && (
            <div className="space-y-6 animate-fade-in text-right">
              
              {/* Database Purge controller */}
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-3">
                <button 
                  onClick={handleClearAll}
                  className="bg-red-950/80 text-red-400 hover:bg-red-900/60 border border-red-500/30 font-black px-4 py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('تصفير ومسح كافة الرحلات وبث الطلبات النشطة', 'Zero-out & Clear All Active Runs')}</span>
                </button>

                <div className="text-right">
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1 justify-end flex-row-reverse">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span>{t('تصفير وتنقيب محاكاة قواعد البيانات والطلبات بضغطة واحدة:', 'Zero-out/Purge Live Simulation Runs in one click:')}</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t('تطهير كافة الرحلات والعدادات وحافلات التجميع النشطة لتجريب دورة حياة جديدة.', 'Wipe out all database co-riding runs to start a fresh simulation cycle from scratch.')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Active Ride Requests Queue */}
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 space-y-3">
                  <h3 className="text-xs font-bold text-slate-100 pb-2 border-b border-slate-800/60 flex items-center gap-1 justify-end flex-row-reverse">
                    <Navigation className="w-4 h-4 text-rose-400" />
                    <span>{t('طابور طلبات ركاب ومسافري آدم التشاركية النشطة', 'Live Passenger Commute Requests Queue')}</span>
                  </h3>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {requests.map(req => (
                      <div key={req.id} className="bg-[#05070e] p-3 rounded-lg border border-slate-850 space-y-2 text-xs">
                        <div className="flex justify-between items-center flex-row-reverse">
                          <span className="font-bold text-slate-200">👤 {req.passengerName}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                            req.status === 'pending' ? 'bg-amber-950 text-amber-400' :
                            req.status === 'pooling' ? 'bg-indigo-950 text-indigo-400' :
                            req.status === 'completed' ? 'bg-emerald-950 text-emerald-400' :
                            'bg-slate-950 text-slate-400'
                          }`}>
                            {req.status}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-400">
                          📍 {req.fromArea.split('-').pop()} ➔ {req.toArea.split('-').pop()} • 👥 {req.seatsCount} {t('مقعد مطلوب', 'seat(s)')}
                        </p>
                      </div>
                    ))}
                    {requests.length === 0 && (
                      <p className="text-[11px] text-slate-500 text-center italic py-4">{t('لا توجد طلبات كبائن أو حافلات ركوب نشطة في هذا الوقت.', 'No active passenger ride requests in queue.')}</p>
                    )}
                  </div>
                </div>

                {/* Co-riding active rides */}
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 space-y-3">
                  <h3 className="text-xs font-bold text-slate-100 pb-2 border-b border-slate-800/60 flex items-center gap-1 justify-end flex-row-reverse">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>{t('الرحلات المشتركة النشطة جغرافياً (تجميع حافلات)', 'Ongoing Jointly Pooled Vehicle Runs')}</span>
                  </h3>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {rides.map(r => (
                      <div key={r.id} className="bg-[#05070e] p-3 rounded-lg border border-slate-850 space-y-2 text-xs">
                        <div className="flex justify-between items-center flex-row-reverse">
                          <span className="font-bold text-amber-400">🚕 {t('رقم حافلة الرحلة:', 'Pooled Run ID:')} {r.id.substring(0, 8)}</span>
                          <span className="font-bold bg-indigo-950 text-indigo-400 px-1 py-0.5 rounded text-[9px] uppercase font-mono">
                            {r.status}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-300 leading-relaxed font-semibold">
                          🛣️ {r.fromArea.split('-').pop()} ➔ {r.toArea.split('-').pop()}
                        </p>
                        <div className="flex justify-between items-center flex-row-reverse pt-1">
                          <p className="text-[9px] text-slate-450">
                            👥 {t('عدد الركاب المدمجين:', 'Pooled passengers size:')} {r.requests.length} {t('ركاب', 'passengers')}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRideForAi(r);
                              setSelectedTypeForAi('instant');
                              setAiModalOpen(true);
                            }}
                            className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded text-[9.5px] font-bold cursor-pointer transition flex items-center gap-1"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-indigo-400 animate-pulse" />
                            <span>تحكم بالذكاء الاصطناعي 🤖</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    {rides.length === 0 && (
                      <p className="text-[11px] text-slate-500 text-center italic py-4">{t('لا توجد رحلات مدمّجة نشطة على شوارع الأردن حالياً.', 'No live pooled active runs currently moving on Jordan roads.')}</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Scheduled commute trips list */}
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 space-y-3">
                <h3 className="text-xs font-bold text-slate-100 pb-2 border-b border-slate-800/60 flex items-center gap-1 justify-end flex-row-reverse">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>{t('إدارة وتتبع تذاكر الرحلات المجدولة والمسارات المسبقة', 'Scheduled Inter-city Commutes & Direct Tickets')}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto">
                  {scheduledTrips.map(trip => (
                    <div key={trip.id} className="bg-[#05070e] p-3 rounded-lg border border-slate-850 space-y-2 text-xs">
                      <div className="flex justify-between items-center flex-row-reverse">
                        <span className="font-bold text-indigo-300">📅 {trip.creatorName} ({trip.creatorType})</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          trip.status === 'pending' ? 'bg-amber-950 text-amber-400' :
                          trip.status === 'accepted' ? 'bg-emerald-950 text-emerald-400' :
                          'bg-slate-950 text-slate-500'
                        }`}>
                          {trip.status}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-300">
                        🚀 {trip.fromArea.split('-').pop()} ➔ {trip.toArea.split('-').pop()} • {trip.departureTime}
                        <br />
                        🪑 {t('عدد المقاعد المتوفرة:', 'Available Seats remainder:')} {trip.availableSeats} / {trip.seatsCount}
                      </p>
                    </div>
                  ))}
                  {scheduledTrips.length === 0 && (
                    <div className="col-span-2 text-center text-slate-500 italic py-4">
                      {t('لا توجد تذاكر رحلات مجدولة مسجلة في هذا الأوان.', 'No registered scheduled trips.')}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* AI ACTIVE RIDE CONTROL MODAL */}
      <AiActiveRideControlModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        ride={selectedRideForAi}
        rideType={selectedTypeForAi}
      />

    </div>
  );
};
