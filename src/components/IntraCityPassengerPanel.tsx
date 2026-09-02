import React, { useState, useEffect, useRef } from 'react';
import { getLocationCoords, DEFAULT_LOCATIONS, hasGeographicMatch, getGeoCoords, getPreciseCurrentLocation, getCanvasCoordsFromGeo, getStreetsForVillageHierarchy } from '../locationData';
import { MapPin, ArrowLeft, Navigation, ShieldCheck, HelpCircle, Phone, X, RefreshCw, AlertTriangle, Car, Star, Shield, User, Clock, CheckCircle, Mic, MicOff, Sparkles, Layers, DollarSign, Wallet, CreditCard } from 'lucide-react';
import { useAppState } from '../stateEngine';
import { motion } from 'motion/react';
import { AiAdBanner } from './AiAdBanner';
import { AiSpatial5DView } from './AiSpatial5DView';
import { CaptainLiveArrivalIndicator } from './CaptainLiveArrivalIndicator';
import { RideWaypoint } from '../types';
import { playNotificationTone } from '../soundUtils';

interface IntraCityPassengerPanelProps {
  loggedPassenger: any;
  settings: any;
  t: (ar: string, en: string) => string;
  language: string;
  setLanguage: (lang: string) => void;
  intraCityRides: any[];
  createIntraCityRide: (
    passengerId: string,
    pickupName: string,
    dropoffName: string,
    distanceKm: number,
    durationMin: number,
    price: number,
    commission: number,
    pickupCoords: { x: number; y: number },
    dropoffCoords: { x: number; y: number },
    waypoints?: RideWaypoint[],
    paymentMethod?: 'cash' | 'wallet'
  ) => { success: boolean; msg: string; ride: any };
  cancelIntraCityRide: (rideId: string, role: 'passenger' | 'driver') => { success: boolean; msg: string };
}

export const IntraCityPassengerPanel: React.FC<IntraCityPassengerPanelProps> = ({
  loggedPassenger,
  settings,
  t,
  language,
  setLanguage,
  intraCityRides,
  createIntraCityRide,
  cancelIntraCityRide
}) => {
  const { drivers, rateIntraCityDriver, dismissCompletedRideInvoice, forceResetPassengerActiveRide, rides, requests } = useAppState();

  const [dismissedRideIds, setDismissedRideIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('adam_dismissed_completed_invoices_passenger') || '[]');
    } catch {
      return [];
    }
  });

  const isOldRide = (r: any) => {
    if (r.completedAt) {
      const ageMs = Date.now() - new Date(r.completedAt).getTime();
      if (ageMs > 45 * 60 * 1000) return true;
    }
    return false;
  };

  // Find if there is a recently completed intra-city ride that is NOT yet rated or dismissed by this passenger
  const unratedCompletedRide = intraCityRides.find(
    r => r.passengerId === loggedPassenger.id &&
         r.status === 'completed' &&
         !r.passengerRated &&
         !r.passengerDismissed &&
         !r.invoiceClosed &&
         !dismissedRideIds.includes(r.id) &&
         !isOldRide(r)
  );

  const handleClosePassengerInvoice = (rideId: string) => {
    setDismissedRideIds(prev => [...prev, rideId]);
    dismissCompletedRideInvoice(rideId, 'passenger');
  };

  // Find current active intra-city ride
  const activeLocalRide = intraCityRides.find(
    r => r.passengerId === loggedPassenger.id && r.status !== 'completed' && r.status !== 'cancelled'
  );

  // Find any active intercity ride or request for this passenger
  const activeIntercityRide = (rides || []).find(r => 
    r.status !== 'completed' && r.status !== 'cancelled' && 
    (r.requests || []).some(req => req.passengerId === loggedPassenger?.id)
  );
  const activeIntercityRequest = (requests || []).find(req => 
    req.passengerId === loggedPassenger?.id && 
    req.status !== 'cancelled' && req.status !== 'completed'
  );

  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<number>(0);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const durationIntervalRef = React.useRef<any>(null);

  const startVoiceRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        setIsTranscribing(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            const response = await fetch('/api/transcribe-audio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64data,
                mimeType: 'audio/webm',
                role: 'passenger'
              })
            });
            const data = await response.json();
            if (data.success && data.text) {
              setRatingComment(prev => prev ? `${prev} ${data.text}` : data.text);
            }
          };
        } catch (e) {
          console.error("Transcription error:", e);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.warn("Microphone access failed, falling back to simulated speech recording:", err);
      setIsRecording(true);
      setRecordingDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      mediaRecorderRef.current = null;
    }
  };

  const stopVoiceRecording = () => {
    clearInterval(durationIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      setIsRecording(false);
      setIsTranscribing(true);
      setTimeout(() => {
        const simulatedText = t(
          "الرحلة كانت مريحة جداً والكابتن متميز وملتزم بالتسعيرة المحددة وأخلاقه عالية ودقيق.",
          "The ride was very comfortable. The captain was excellent, fair with the price, and has great manners."
        );
        setRatingComment(prev => prev ? `${prev} ${simulatedText}` : simulatedText);
        setIsTranscribing(false);
      }, 1500);
    }
    setIsRecording(false);
  };

  const [detectedPassengerGov, setDetectedPassengerGov] = useState<string>(() => {
    return localStorage.getItem('adam_passenger_detected_gov') || loggedPassenger?.governorate || 'عمان (Amman)';
  });

  const [fromGov, setFromGov] = useState<string>(() => {
    const cachedGov = localStorage.getItem('adam_passenger_detected_gov');
    const pGov = cachedGov || loggedPassenger?.governorate || 'عمان (Amman)';
    const locationsList = settings?.locations || DEFAULT_LOCATIONS;
    const exists = locationsList.some(l => l.governorate === pGov);
    return exists ? pGov : (locationsList[0]?.governorate || 'عمان (Amman)');
  });
  const [isAutoPickup, setIsAutoPickup] = useState<boolean>(true);
  
  // 3-tier locations states for origin & destination
  const [fromDist, setFromDist] = useState<string>(() => localStorage.getItem('adam_passenger_detected_dist') || '');
  const [fromVillage, setFromVillage] = useState<string>(() => localStorage.getItem('adam_passenger_detected_village') || '');
  const [fromStreet, setFromStreet] = useState<string>(() => localStorage.getItem('adam_passenger_detected_street') || '');
  const [fromStreetCustom, setFromStreetCustom] = useState<string>(() => localStorage.getItem('adam_passenger_detected_street') || '');
  const [toDist, setToDist] = useState<string>('');
  const [toVillage, setToVillage] = useState<string>('');
  const [toStreet, setToStreet] = useState<string>('');
  const [toStreetCustom, setToStreetCustom] = useState<string>('');

  const [detectingLocation, setDetectingLocation] = useState<boolean>(false);
  const [detectionSuccess, setDetectionSuccess] = useState<string | null>(null);

  const [errMsg, setErrMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'wallet'>('cash');
  
  const [confirmCancel, setConfirmCancel] = useState<boolean>(false);
  const [sosActiveAlert, setSosActiveAlert] = useState<boolean>(false);

  // Sound notification trigger when active ride status or driver changes
  const prevStatusRef = useRef<string | undefined>(activeLocalRide?.status);
  const prevDriverRef = useRef<string | null | undefined>(activeLocalRide?.driverId);

  useEffect(() => {
    if (activeLocalRide) {
      if (
        (prevStatusRef.current && prevStatusRef.current !== activeLocalRide.status) ||
        (prevDriverRef.current === null && activeLocalRide.driverId)
      ) {
        playNotificationTone(settings?.notificationSoundTone || 'chime');
      }
      prevStatusRef.current = activeLocalRide.status;
      prevDriverRef.current = activeLocalRide.driverId;
    } else {
      prevStatusRef.current = undefined;
      prevDriverRef.current = undefined;
    }
  }, [activeLocalRide?.status, activeLocalRide?.driverId, settings?.notificationSoundTone]);

  useEffect(() => {
    setConfirmCancel(false);
  }, [activeLocalRide?.status]);

  useEffect(() => {
    if (unratedCompletedRide) {
      setSelectedStars(5);
      setRatingComment('');
    }
  }, [unratedCompletedRide?.id]);
  
  // Custom interactive fare adjustments
  const [customDistance, setCustomDistance] = useState<number | null>(null);
  const [customDuration, setCustomDuration] = useState<number | null>(null);
  const [customMultiplier, setCustomMultiplier] = useState<number | null>(null);

  // Multi-stop Waypoints State (نقاط التوقف خلال المشوار)
  const [waypoints, setWaypoints] = useState<RideWaypoint[]>([]);
  const [aiOptimizing, setAiOptimizing] = useState<boolean>(false);
  const [mapClickMode, setMapClickMode] = useState<'waypoint' | 'dropoff' | 'pickup'>('waypoint');
  const [isBuildingAiWaypoint, setIsBuildingAiWaypoint] = useState<boolean>(false);
  const [aiWaypointCategory, setAiWaypointCategory] = useState<string>('all');
  const [activeTargetWaypointId, setActiveTargetWaypointId] = useState<string | null>(null);
  const [detectingWaypointId, setDetectingWaypointId] = useState<string | null>(null);

  // Exact Pickup Notes & High-Precision Location States
  const [pickupExactNote, setPickupExactNote] = useState<string>('');
  const [pickupGeoCoords, setPickupGeoCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Dedicated Airport Express Ride State (طلبات توصيل واستقبال المطار)
  const [isAirportTrip, setIsAirportTrip] = useState<boolean>(false);
  const [airportTripDirection, setAirportTripDirection] = useState<'to_airport' | 'from_airport'>('to_airport');
  const [flightNumberInput, setFlightNumberInput] = useState<string>('');
  const [luggageCountInput, setLuggageCountInput] = useState<number>(2);
  const [rideCategoryTab, setRideCategoryTab] = useState<'standard' | 'airport' | 'multistop'>('standard');

  // Smart Location Autofill State & History Suggestions
  const [showAutofillSuggestions, setShowAutofillSuggestions] = useState<boolean>(true);

  // AI-Powered Smart Filtering & Compact Drive Modes (تصفية الحقول الذكية بالذكاء الاصطناعي)
  const [smartFilterMode, setSmartFilterMode] = useState<'standard' | 'express' | 'driving'>('standard');

  // Compute frequent/recent places from passenger's favorites & trip history
  const pastPassengerRides = React.useMemo(() => {
    return (intraCityRides || []).filter(
      r => r.passengerId === loggedPassenger?.id && (r.status === 'completed' || r.status === 'in_progress')
    );
  }, [intraCityRides, loggedPassenger?.id]);

  const frequentLocations = React.useMemo(() => {
    const map = new Map<string, {
      gov: string;
      dist: string;
      village: string;
      street?: string;
      count: number;
      label: string;
      icon: string;
      type: 'favorite' | 'history';
    }>();

    // 1. Add Saved Favorites
    (loggedPassenger?.favorites || []).forEach(fav => {
      const g = fav.gov || fav.locationName?.split('-')[0]?.trim() || fromGov || 'عمان (Amman)';
      const d = fav.district || fav.locationName?.split('-')[1]?.trim() || 'قصبة عمان';
      const v = fav.village || fav.locationName?.split('-')[2]?.trim() || fav.name;
      map.set(`fav_${fav.id || fav.name}`, {
        gov: g,
        dist: d,
        village: v,
        street: fav.street || fav.name,
        count: 20,
        label: `${fav.name} (${v} - ${d})`,
        icon: fav.name.includes('البيت') || fav.name.includes('منزل') ? '🏠' : fav.name.includes('عمل') || fav.name.includes('مكتب') ? '🏢' : '⭐',
        type: 'favorite'
      });
    });

    // 2. Add Recent Completed Trip Destinations
    pastPassengerRides.forEach(ride => {
      if (ride.toGov && ride.toDist && ride.toVillage) {
        const key = `hist_${ride.toGov}_${ride.toDist}_${ride.toVillage}`;
        const existing = map.get(key);
        map.set(key, {
          gov: ride.toGov,
          dist: ride.toDist,
          village: ride.toVillage,
          street: ride.toStreet || '',
          count: (existing?.count || 0) + 2,
          label: `${ride.toVillage} - ${ride.toDist} (${ride.toGov})`,
          icon: '📍',
          type: 'history'
        });
      }
      if (ride.fromGov && ride.fromDistrict && ride.fromVillage) {
        const keyP = `hist_p_${ride.fromGov}_${ride.fromDistrict}_${ride.fromVillage}`;
        const existingP = map.get(keyP);
        map.set(keyP, {
          gov: ride.fromGov,
          dist: ride.fromDistrict,
          village: ride.fromVillage,
          count: (existingP?.count || 0) + 1,
          label: `${ride.fromVillage} - ${ride.fromDistrict} (${ride.fromGov})`,
          icon: '🛫',
          type: 'history'
        });
      }
    });

    // Fallbacks if empty
    if (map.size === 0) {
      map.set('def_home', {
        gov: 'عمان (Amman)',
        dist: 'قصبة عمان',
        village: 'العبدلي / الشميساني',
        street: 'شارع الملك حسين',
        count: 10,
        label: 'المنزل (عمان - الشميساني)',
        icon: '🏠',
        type: 'favorite'
      });
      map.set('def_work', {
        gov: 'عمان (Amman)',
        dist: 'قصبة عمان',
        village: 'المركز التجاري / الدوار الخامس',
        street: 'شارع زهران',
        count: 8,
        label: 'العمل (عمان - الدوار الخامس)',
        icon: '🏢',
        type: 'favorite'
      });
      map.set('def_univ', {
        gov: 'إربد (Irbid)',
        dist: 'قصبة إربد',
        village: 'حي الجامعة / اليرموك',
        street: 'شارع الجامعة',
        count: 6,
        label: 'جامعة اليرموك (إربد - حي الجامعة)',
        icon: '🎓',
        type: 'favorite'
      });
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [pastPassengerRides, loggedPassenger?.favorites, fromGov]);

  const applySmartAutofill = (
    item: { gov: string; dist: string; village: string; street?: string; label: string },
    mode: 'pickup' | 'dropoff'
  ) => {
    if (mode === 'pickup') {
      setFromGov(item.gov);
      setFromDist(item.dist);
      setFromVillage(item.village);
      setIsAutoPickup(false);
      setDetectionSuccess(`✓ تم التعبئة التلقائية الذكية لمكان الإقلال: ${item.village} (${item.dist})`);
      setTimeout(() => setDetectionSuccess(null), 4000);
    } else {
      setFromGov(item.gov);
      setToDist(item.dist);
      setToVillage(item.village);
      if (item.street) {
        setToStreet(item.street);
        setToStreetCustom(item.street);
      }
      setSuccessMsg(`✓ تم التعبئة التلقائية الذكية لمكان التنزيل: ${item.village} - ${item.dist} ${item.street ? '(' + item.street + ')' : ''}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleAddWaypoint = (customName?: string) => {
    if (waypoints.length >= 4) {
      setErrMsg(t('يمكنك إضافة حتى 4 نقاط توقف كحد أقصى في المشوار الواحد.', 'Maximum 4 stops allowed per ride.'));
      setTimeout(() => setErrMsg(''), 3000);
      return;
    }
    const defaultName = customName || (fromGov ? `${fromGov} - نقطة توقف ${waypoints.length + 1}` : `نقطة توقف ${waypoints.length + 1}`);
    const newWp: RideWaypoint = {
      id: 'wp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: defaultName,
      stopFee: 0.50,
      estimatedWaitMin: 4,
      coords: getLocationCoords(defaultName)
    };
    setWaypoints(prev => [...prev, newWp]);
  };

  const handleRemoveWaypoint = (id: string) => {
    setWaypoints(prev => prev.filter(w => w.id !== id));
  };

  const handleUpdateWaypoint = (id: string, name: string, waitMin?: number, coords?: { x: number; y: number }) => {
    setWaypoints(prev => prev.map(w => w.id === id ? {
      ...w,
      name,
      estimatedWaitMin: waitMin !== undefined ? waitMin : w.estimatedWaitMin,
      coords: coords || w.coords || getLocationCoords(name)
    } : w));
  };

  const handleSetWaypointGpsLocation = async (wpId: string) => {
    setDetectingWaypointId(wpId);
    try {
      const loc = await getPreciseCurrentLocation();
      const canvasCoords = getCanvasCoordsFromGeo(loc.lat, loc.lng);
      const landmarkText = loc.street || loc.village || loc.landmark || 'موقعي الحالي المباشر';
      const formattedName = `${loc.governorate.split(' ')[0]} - ${loc.district} - ${landmarkText}`;
      
      handleUpdateWaypoint(wpId, formattedName, 4, canvasCoords);
      setSuccessMsg(t(
        `📍 تم ربط نقطة التوقف بموقعك الحالي بدقة GPS: (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`,
        `📍 Waypoint linked to your exact GPS location: (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`
      ));
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (e: any) {
      console.warn("Waypoint GPS detection failed:", e);
      setErrMsg(t('تعذر قراءة GPS بدقة لنقطة التوقف، تم استخدام الموقع التقريبي.', 'GPS read failed for stop, using approximate.'));
      setTimeout(() => setErrMsg(''), 3500);
    } finally {
      setDetectingWaypointId(null);
    }
  };

  const handleSetWaypointCategoryPreset = (wpId: string, category: 'atm' | 'pharmacy' | 'cafe' | 'supermarket' | 'gas') => {
    const govShort = fromGov.split(' ')[0] || 'عمان';
    const presets: Record<string, { name: string; landmark: string; offset: { x: number; y: number } }> = {
      atm: { name: `صراف آلي (ATM بنك الإسكان/العربي) - ${govShort}`, landmark: 'صراف آلي سريع', offset: { x: 12, y: -8 } },
      pharmacy: { name: `صيدلية (فارمسي ون / صيدلية المجتمع) - ${govShort}`, landmark: 'صيدلية ومستلزمات', offset: { x: -10, y: 14 } },
      cafe: { name: `كافيه واستراحة درايف ثرو (Drive-thru Cafe) - ${govShort}`, landmark: 'مقهى وقهوة سريعة', offset: { x: 18, y: 10 } },
      supermarket: { name: `سوبرماركت ومواد تموينية (Supermarket) - ${govShort}`, landmark: 'تسوق وبقالة سريعة', offset: { x: -15, y: -12 } },
      gas: { name: `محطة وقود وخدمات سيارات (Gas Station) - ${govShort}`, landmark: 'محطة محروقات', offset: { x: 5, y: 22 } }
    };
    const chosen = presets[category];
    if (!chosen) return;

    const baseCoords = pickupCoords || { x: 200, y: 200 };
    const calculatedCoords = {
      x: Math.max(80, Math.min(320, baseCoords.x + chosen.offset.x)),
      y: Math.max(80, Math.min(320, baseCoords.y + chosen.offset.y))
    };

    handleUpdateWaypoint(wpId, chosen.name, 4, calculatedCoords);
    setSuccessMsg(t(`✅ تم تحديد موقع المعلم (${chosen.landmark}) لنقطة التوقف`, `✅ Stop landmark location set: ${chosen.landmark}`));
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleMoveWaypoint = (index: number, dir: 'up' | 'down') => {
    if ((dir === 'up' && index === 0) || (dir === 'down' && index === waypoints.length - 1)) return;
    const newArr = [...waypoints];
    const targetIdx = dir === 'up' ? index - 1 : index + 1;
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setWaypoints(newArr);
  };

  const handleAiOptimizeWaypoints = () => {
    if (waypoints.length < 2) return;
    setAiOptimizing(true);
    setTimeout(() => {
      const pCoords = pickupCoords;
      const sorted = [...waypoints].sort((a, b) => {
        const aC = a.coords || getLocationCoords(a.name);
        const bC = b.coords || getLocationCoords(b.name);
        const distA = Math.hypot(aC.x - pCoords.x, aC.y - pCoords.y);
        const distB = Math.hypot(bC.x - pCoords.x, bC.y - pCoords.y);
        return distA - distB;
      });
      setWaypoints(sorted);
      setAiOptimizing(false);
      setSuccessMsg(t('✨ تم إعادة ترتيب نقاط التوقف بالذكاء الاصطناعي بنجاح للحصول على أسرع مسار وأقل تكلفة!', '✨ Waypoints reordered by AI for optimal speed and lowest cost!'));
      setTimeout(() => setSuccessMsg(''), 4000);
    }, 600);
  };

  // Retrieve objects safely
  const locationsList = settings?.locations || DEFAULT_LOCATIONS;
  const chosenGovObj = locationsList.find(l => l.governorate === fromGov);
  const fromDistrictObj = chosenGovObj?.districts?.find(d => d.name === fromDist);
  const toDistrictObj = chosenGovObj?.districts?.find(d => d.name === toDist);

  // Derived labels
  const pickup = (fromGov && fromDist && fromVillage) 
    ? `${fromGov} - ${fromDist} - ${fromVillage}${fromStreet ? ` - ${fromStreet}` : ''}` 
    : '';
  const dropoff = (fromGov && toDist && toVillage) 
    ? `${fromGov} - ${toDist} - ${toVillage}${toStreet ? ` - ${toStreet}` : ''}` 
    : '';

  // Dynamic hierarchical streets based on selected Governorate, District, and Village
  const availablePickupStreets = getStreetsForVillageHierarchy(fromGov, fromDist, fromVillage, locationsList);
  const availableDropoffStreets = getStreetsForVillageHierarchy(fromGov, toDist, toVillage, locationsList);

  const handleBuildAiWaypointAtCoords = async (clickX: number, clickY: number) => {
    if (waypoints.length >= 4) {
      setErrMsg(t('يمكنك إضافة حتى 4 نقاط توقف كحد أقصى في المشوار الواحد.', 'Maximum 4 stops allowed per ride.'));
      setTimeout(() => setErrMsg(''), 3000);
      return;
    }

    setIsBuildingAiWaypoint(true);
    try {
      const response = await fetch('/api/ai-build-waypoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup,
          dropoff,
          governorate: fromGov,
          mapCoords: { x: clickX, y: clickY },
          currentWaypoints: waypoints,
          category: aiWaypointCategory
        })
      });

      const data = await response.json();
      if (data.success && data.waypoint) {
        const wpWithCoords: RideWaypoint = {
          ...data.waypoint,
          coords: { x: clickX, y: clickY }
        };
        setWaypoints(prev => [...prev, wpWithCoords]);
        setSuccessMsg(t(
          `🛑 تم بناء نقطة التوقف بالذكاء الاصطناعي: ${data.waypoint.name} (${data.waypoint.landmark})`,
          `🛑 AI built waypoint stop: ${data.waypoint.name} (${data.waypoint.landmark})`
        ));
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        // Fallback local waypoint
        const fallbackWp: RideWaypoint = {
          id: 'wp_' + Date.now(),
          name: `${fromGov || 'عمان'} - نقطة توقف على الطريق (${Math.round(clickX)}, ${Math.round(clickY)})`,
          stopFee: 0.50,
          estimatedWaitMin: 4,
          coords: { x: clickX, y: clickY }
        };
        setWaypoints(prev => [...prev, fallbackWp]);
      }
    } catch (err: any) {
      console.warn("AI build waypoint request error, fallback applied:", err);
      const fallbackWp: RideWaypoint = {
        id: 'wp_' + Date.now(),
        name: `${fromGov || 'عمان'} - نقطة توقف سريعة`,
        stopFee: 0.50,
        estimatedWaitMin: 4,
        coords: { x: clickX, y: clickY }
      };
      setWaypoints(prev => [...prev, fallbackWp]);
    } finally {
      setIsBuildingAiWaypoint(false);
    }
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = 100 + ((e.clientX - rect.left) / rect.width) * 200;
    const clickY = 100 + ((e.clientY - rect.top) / rect.height) * 200;
    
    // If targeting an existing waypoint
    if (activeTargetWaypointId) {
      const geo = getGeoCoords(clickX, clickY);
      const wpName = `${fromGov?.split(' ')[0] || 'عمان'} - موقع محدد بالخريطة (${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)})`;
      handleUpdateWaypoint(activeTargetWaypointId, wpName, 4, { x: clickX, y: clickY });
      setActiveTargetWaypointId(null);
      setSuccessMsg(t(
        `🛑 تم تحديد لوكيشن نقطة التوقف بدقة على الرادار: (${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)})`,
        `🛑 Waypoint stop location pinned on radar: (${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)})`
      ));
      setTimeout(() => setSuccessMsg(''), 4500);
      return;
    }

    if (mapClickMode === 'waypoint') {
      handleBuildAiWaypointAtCoords(clickX, clickY);
      return;
    }

    if (!chosenGovObj) return;
    
    let closestDist = Infinity;
    let detectedDistName = '';
    let detectedVillageName = '';
    
    chosenGovObj?.districts?.forEach(dist => {
      dist?.villages?.forEach(vil => {
        const fullLabel = `${fromGov} - ${dist.name} - ${vil}`;
        const coords = getLocationCoords(fullLabel);
        const distance = Math.sqrt((coords.x - clickX) ** 2 + (coords.y - clickY) ** 2);
        if (distance < closestDist) {
          closestDist = distance;
          detectedDistName = dist.name;
          detectedVillageName = vil;
        }
      });
    });
    
    if (detectedDistName && detectedVillageName) {
      if (mapClickMode === 'pickup') {
        const geo = getGeoCoords(clickX, clickY);
        setPickupGeoCoords(geo);
        setFromDist(detectedDistName);
        setFromVillage(detectedVillageName);
        setIsAutoPickup(false);
        setDetectionSuccess(t(
          `🛫 تم تحديد موقع الانطلاق بدقة من الرادار: لواء ${detectedDistName} - حي ${detectedVillageName} (${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)})`,
          `🛫 Radar pickup selected: ${detectedDistName} - ${detectedVillageName} (${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)})`
        ));
      } else {
        setToDist(detectedDistName);
        setToVillage(detectedVillageName);
        
        const streets = getStreetsForVillageHierarchy(fromGov, detectedDistName, detectedVillageName, locationsList);
        const randomStreet = streets.length > 0 ? streets[0] : t('الشارع العام الرئيسي', 'Main Public Street');
        setToStreet(randomStreet);
        setToStreetCustom('');
        
        setDetectionSuccess(t(
          `🎯 تم تحديد التنزيل عبر الخريطة: لواء ${detectedDistName} - حي ${detectedVillageName} - ${randomStreet.split(' (')[0]}`,
          `🎯 Heat-map selected: ${detectedDistName} - ${detectedVillageName} - ${randomStreet.split(' (')[0]}`
        ));
      }
    }
  };

  // Auto-selection of pickup neighborhood and street based on current governorate
  useEffect(() => {
    if (isAutoPickup && chosenGovObj) {
      const defaultDist = chosenGovObj?.districts?.[0]?.name || '';
      const defaultVillage = chosenGovObj?.districts?.[0]?.villages?.[0] || '';
      const streets = getStreetsForVillageHierarchy(fromGov, defaultDist, defaultVillage, locationsList);
      const defaultStreet = streets[0] || '';
      setFromDist(defaultDist);
      setFromVillage(defaultVillage);
      if (!fromStreet) {
        setFromStreet(defaultStreet);
        setFromStreetCustom(defaultStreet);
      }
    }
  }, [fromGov, isAutoPickup, chosenGovObj]);

  const handleGovChange = (govValue: string) => {
    setFromGov(govValue);
    setErrMsg('');
    setDetectionSuccess(null);
    
    const targetGovObj = locationsList.find(l => l.governorate === govValue);
    if (targetGovObj && targetGovObj.districts?.length > 0) {
      const firstDist = targetGovObj.districts[0];
      const firstVillage = firstDist.villages?.[0] || '';
      const streets = getStreetsForVillageHierarchy(govValue, firstDist.name, firstVillage, locationsList);
      setFromDist(firstDist.name);
      setFromVillage(firstVillage);
      setFromStreet(streets[0] || '');
      setFromStreetCustom(streets[0] || '');
    } else {
      setFromDist('');
      setFromVillage('');
      setFromStreet('');
      setFromStreetCustom('');
    }

    setToDist('');
    setToVillage('');
    setToStreet('');
    setToStreetCustom('');
  };

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    setErrMsg('');
    setDetectionSuccess(null);

    try {
      const loc = await getPreciseCurrentLocation();
      setDetectingLocation(false);

      if (loc) {
        setPickupGeoCoords({ lat: loc.lat, lng: loc.lng });
        if (loc.governorate) {
          setFromGov(loc.governorate);
          setDetectedPassengerGov(loc.governorate);
        }
        if (loc.district) setFromDist(loc.district);
        if (loc.village) setFromVillage(loc.village || loc.street || '');
        
        let streetVal = loc.street;
        if (!streetVal && loc.governorate && loc.district && loc.village) {
          const matchedStreets = getStreetsForVillageHierarchy(loc.governorate, loc.district, loc.village, locationsList);
          if (matchedStreets.length > 0) {
            streetVal = matchedStreets[0];
          }
        }
        if (streetVal) {
          setFromStreet(streetVal);
          setFromStreetCustom(streetVal);
        }

        setIsAutoPickup(false);
        setDetectionSuccess(loc.msg || `✓ تم تحديد موقع انطلاقك الفعلي من مكانك بالزبط بدقة GPS: ${loc.formattedAddress}`);
      }
    } catch (e: any) {
      setDetectingLocation(false);
      setErrMsg(e.message || 'حدث خطأ أثناء رصد إحداثيات موقعك الجغرافي');
    }
  };

  // Initial automatic GPS detection on component mount
  useEffect(() => {
    const hasDetectedBefore = localStorage.getItem('adam_passenger_detected_lat');
    if (!hasDetectedBefore && typeof window !== 'undefined' && 'geolocation' in navigator) {
      handleDetectLocation();
    }
  }, []);

  // Sync back when areas change
  useEffect(() => {
    setCustomDistance(null);
    setCustomDuration(null);
    setCustomMultiplier(null);
  }, [pickup, dropoff, fromGov]);
  
  const [isTurbo, setIsTurbo] = useState<boolean>(() => localStorage.getItem('adam_turbo_boost') === 'true');
  useEffect(() => {
    const handleTurboChange = () => {
      setIsTurbo(localStorage.getItem('adam_turbo_boost') === 'true');
    };
    window.addEventListener('adam_turbo_changed', handleTurboChange);
    return () => window.removeEventListener('adam_turbo_changed', handleTurboChange);
  }, []);

  // WebSockets Real-Time Location Listener for Passenger
  const [lastReceivedCoords, setLastReceivedCoords] = useState<{ x: number, y: number } | null>(null);
  const [wsLogs, setWsLogs] = useState<string[]>([]);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!activeLocalRide || (activeLocalRide.status !== 'accepted' && activeLocalRide.status !== 'started')) {
      setIsWsConnected(false);
      setLastReceivedCoords(null);
      return;
    }

    setIsWsConnected(true);
    const initialLog = `🔌 [ADAM-WS] Connecting to adam-ws://live-hub.adamride.com/ride/${activeLocalRide.id}...`;
    const openLog = `🟢 [ADAM-WS] Channel opened, listening for captain coordinates.`;
    setWsLogs([openLog, initialLog]);

    // WebSocket simulated broadcast listener
    const handleWsTelemetry = (e: Event) => {
      const customVal = (e as CustomEvent).detail;
      if (customVal && customVal.rideId === activeLocalRide.id) {
        setLastReceivedCoords({ x: customVal.x, y: customVal.y });
        setWsLogs(prev => [
          `📥 [WS: IN] Location update received: { x: ${customVal.x}, y: ${customVal.y} } at ${customVal.timestamp || new Date().toLocaleTimeString()}`,
          ...prev.slice(5)
        ]);
      }
    };
    window.addEventListener('adam_ws_telemetry', handleWsTelemetry);

    // Fallback Polling from Express Backend API every 5 seconds
    const pollingInterval = setInterval(() => {
      fetch(`/api/ride/${activeLocalRide.id}/location`)
        .then(res => {
          if (!res.ok) throw new Error("No live location data yet");
          return res.json();
        })
        .then(data => {
          if (data.success && data.location) {
            const loc = data.location;
            setLastReceivedCoords({ x: loc.x, y: loc.y });
            setWsLogs(prev => {
              const currentLog = `📥 [API: GET] REST API fetched driver coordinates: { x: ${loc.x}, y: ${loc.y} }`;
              if (prev[0] && (prev[0].includes(`x: ${loc.x}`) && prev[0].includes(`y: ${loc.y}`))) {
                return prev;
              }
              return [currentLog, ...prev.slice(5)];
            });
          }
        })
        .catch(err => {
          console.warn("REST API polling catch error:", err);
        });
    }, 5000);

    return () => {
      window.removeEventListener('adam_ws_telemetry', handleWsTelemetry);
      clearInterval(pollingInterval);
      setIsWsConnected(false);
    };
  }, [activeLocalRide?.id, activeLocalRide?.status]);
  
  // Animation/map position ticks
  const [simTick, setSimTick] = useState<number>(0);

  // Periodic driver moving simulation if accepted/started
  useEffect(() => {
    const tickTime = isTurbo ? 250 : 1500;
    const interval = setInterval(() => {
      setSimTick(t => (t + 1) % 100);
    }, tickTime);
    return () => clearInterval(interval);
  }, [isTurbo]);

  const govConfig = settings?.intraCityFaresByGovernorate?.[fromGov] || settings?.intraCityConfig;
  const pricing = {
    ratePerKm: govConfig?.ratePerKm ?? 0.29,
    ratePerMin: govConfig?.ratePerMin ?? 0.06,
    minFare: govConfig?.minFare ?? 1.50,
    commissionRatePercent: govConfig?.commissionRatePercent ?? 25,
    activeMultiplier: govConfig?.activeMultiplier ?? 1.0
  };

  // Calculate parameters if both selected (including intermediate waypoints)
  let calculatedDistanceKm = 0;
  let calculatedDurationMin = 0;
  let distanceKm = 0;
  let durationMin = 0;
  let estimatedPrice = 0;
  let estimatedCommission = 0;
  let pickupCoords = { x: 200, y: 200 };
  let dropoffCoords = { x: 220, y: 220 };

  if (pickup && dropoff && pickup !== dropoff) {
    pickupCoords = getLocationCoords(pickup);
    dropoffCoords = getLocationCoords(dropoff);
    
    // Sum route segment distance through waypoints
    let totalUnits = 0;
    const routePoints = [pickupCoords];
    waypoints.forEach(wp => {
      const c = wp.coords || getLocationCoords(wp.name);
      routePoints.push(c);
    });
    routePoints.push(dropoffCoords);

    for (let i = 0; i < routePoints.length - 1; i++) {
      const dx = routePoints[i+1].x - routePoints[i].x;
      const dy = routePoints[i+1].y - routePoints[i].y;
      totalUnits += Math.sqrt(dx * dx + dy * dy);
    }

    // Convert units to simulated real-world kilometers
    calculatedDistanceKm = Number((totalUnits * 0.12 + 1.1).toFixed(2));
    
    // Add estimated wait time at waypoints to duration
    const stopsTotalWaitMin = waypoints.reduce((acc, wp) => acc + (wp.estimatedWaitMin || 4), 0);
    calculatedDurationMin = Number((calculatedDistanceKm * 1.6 + 3 + stopsTotalWaitMin).toFixed(0));
  }

  const hasPickupGeomatch = pickup ? hasGeographicMatch(pickup) : true;
  const hasDropoffGeomatch = dropoff ? hasGeographicMatch(dropoff) : true;
  const hasBothGeomatch = hasPickupGeomatch && hasDropoffGeomatch;

  const activeDistance = customDistance !== null ? customDistance : calculatedDistanceKm;
  const activeDuration = customDuration !== null ? customDuration : calculatedDurationMin;
  const activeMult = customMultiplier !== null ? customMultiplier : pricing.activeMultiplier;

  // Total stop fee surcharge (e.g., 0.50 JOD per stop)
  const totalStopFees = waypoints.reduce((acc, wp) => acc + (wp.stopFee || 0.50), 0);

  // Final Pricing calculation (including multi-stop fee impact & airport fixed pricing)
  if (pickup && dropoff && pickup !== dropoff) {
    if (isAirportTrip) {
      estimatedPrice = settings.airportRidePrice ?? 25.0;
      estimatedCommission = Number((estimatedPrice * (pricing.commissionRatePercent / 100)).toFixed(2));
      distanceKm = Math.max(35, activeDistance);
      durationMin = Math.max(40, activeDuration);
    } else {
      const rawPrice = (pricing.ratePerKm * activeDistance) + (pricing.ratePerMin * activeDuration) + totalStopFees;
      const calculatedFare = Math.max(pricing.minFare, rawPrice) * activeMult;
      estimatedPrice = Number(calculatedFare.toFixed(2));
      estimatedCommission = Number((estimatedPrice * (pricing.commissionRatePercent / 100)).toFixed(2));
      
      distanceKm = activeDistance;
      durationMin = activeDuration;
    }
  }

  const handleRequestRide = (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg('');
    setSuccessMsg('');

    if (!pickup || !dropoff) {
      setErrMsg(t('يرجى اختيار نقطة الإركاب ونقطة التنزيل أولاً!', 'Please choose pickup and dropoff points first!'));
      return;
    }

    // Restriction: Cannot request an intra-city ride in a governorate other than passenger's actual physical governorate
    if (detectedPassengerGov && fromGov && detectedPassengerGov !== fromGov) {
      setErrMsg(
        t(
          `عذراً! موقعك الفعلي المرصود بالـ GPS هو في محافظة (${detectedPassengerGov.split(' ')[0]})، ولا يمكن طلب مشوار داخلي في محافظة (${fromGov.split(' ')[0]}). خدمة "داخل المدينة" مخصصة لمدينتك الفعلية حصراً. يرجى التبديل لمدينتك أو استخدام خدمة النقل بين المحافظات.`,
          `Restriction: Your detected physical location is ${detectedPassengerGov}, but you selected ${fromGov}. Intra-city rides are restricted to your actual current governorate.`
        )
      );
      return;
    }

    if (pickup === dropoff) {
      setErrMsg(t('تطابق غريب! نقطة الانطلاق والوصول متطابقة.', 'Silly coordinate match! Pickup and drop-off cannot be identical.'));
      return;
    }

    const finalPickup = pickupExactNote.trim() ? `${pickup} [📌 ${pickupExactNote.trim()}]` : pickup;
    let finalDropoff = dropoff;
    if (isAirportTrip) {
      const flightInfo = flightNumberInput.trim() ? ` [✈️ رحلة #${flightNumberInput.trim()}]` : '';
      const luggageInfo = luggageCountInput ? ` [🧳 ${luggageCountInput} حقائب]` : '';
      finalDropoff = `${dropoff}${flightInfo}${luggageInfo}`;
    }

    // Call stateEngine create function with waypoints and payment method and airport trip data
    const res = createIntraCityRide(
      loggedPassenger.id,
      finalPickup,
      finalDropoff,
      distanceKm,
      durationMin,
      estimatedPrice,
      estimatedCommission,
      pickupCoords,
      dropoffCoords,
      waypoints,
      selectedPaymentMethod,
      isAirportTrip,
      flightNumberInput,
      luggageCountInput,
      airportTripDirection
    );

    if (res.success) {
      setSuccessMsg(res.msg);
      playNotificationTone(settings?.notificationSoundTone || 'chime');
      setFromDist('');
      setFromVillage('');
      setToDist('');
      setToVillage('');
      setToStreet('');
      setToStreetCustom('');
      setWaypoints([]);
      setPickupExactNote('');
      setPickupGeoCoords(null);
      setIsAirportTrip(false);
      setFlightNumberInput('');
      setRideCategoryTab('standard');
    } else {
      setErrMsg(res.msg);
    }
  };

  // Render Section
  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 font-sans text-right">

      {/* UNRATED COMPLETED RIDE RATING PANEL */}
      {unratedCompletedRide ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 flex flex-col gap-4 shadow-2xl font-sans relative"
        >
          {/* Close / Dismiss Button */}
          <button
            type="button"
            onClick={() => handleClosePassengerInvoice(unratedCompletedRide.id)}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer border border-slate-700 z-10"
            title={t('إغلاق الفاتورة', 'Close Invoice')}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center gap-2 border-b border-slate-800 pb-4 pr-6">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30 text-emerald-400 animate-pulse">
              <CheckCircle className="w-6 h-6 animate-bounce" />
            </div>
            <h3 className="text-sm font-black text-slate-100">{t('🎉 تم إنهاء المشوار بنجاح والوصول بالسلامة', '🎉 Ride Successfully Completed!')}</h3>
            <p className="text-[10px] text-slate-400">
              {t('نشكرك على استخدام تطبيق آدم. تم تسوية الأجرة ويمكنك تقييم الكابتن أو إغلاق الفاتورة فوراً.', 'Thank you for choosing Adam Ride. Fare settled; you can rate captain or close.')}
            </p>
          </div>

          {/* Route details */}
          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-850 flex flex-col gap-2.5">
            <div className="flex justify-between text-right text-[10px] flex-row-reverse">
              <div>
                <span className="text-slate-500 block text-[9px]">{t('منطقة البداية والركوب', 'Pickup Area')}</span>
                <span className="font-bold text-slate-200">{unratedCompletedRide.pickupName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">{t('منطقة الوصول والإنزال', 'Dropoff Area')}</span>
                <span className="font-bold text-slate-200">{unratedCompletedRide.dropoffName}</span>
              </div>
            </div>

            <div className="h-[1px] bg-slate-900"></div>

            <div className="grid grid-cols-2 gap-2 text-right text-[10px] flex-row-reverse">
              <div>
                <span className="text-slate-500 block text-[9px]">{t('اسم الكابتن المقيم', 'Captain Name')}</span>
                <span className="font-bold text-indigo-400">👤 {unratedCompletedRide.driverName || t('كابتن آدم المعتمد', 'Certified Captain')}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">{t('رقم الهاتف والاتصال', 'Phone Number')}</span>
                <span className="font-bold text-slate-300 font-mono text-xs">{unratedCompletedRide.driverPhone || '079XXXXXXX'}</span>
              </div>
            </div>
          </div>

          {/* Core Feature Requirement: Clear Display of Total Amount Due & Payment Method */}
          <div className="flex flex-col gap-2 mt-1 font-sans">
            {unratedCompletedRide.paymentMethod === 'cash' ? (
              <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 p-4 rounded-2xl border-2 border-amber-500/80 shadow-lg shadow-amber-950/30 flex flex-col gap-2 text-right">
                <div className="flex justify-between items-center flex-row-reverse border-b border-amber-500/30 pb-2">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 flex-row-reverse">
                    <span>💵 {t('المبلغ المطلوب دفعه نقداً للكابتن', 'Amount to Pay Captain (Cash)')}</span>
                  </span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-bold">
                    {t('دفع كاش 💵', 'Cash Payment 💵')}
                  </span>
                </div>
                <div className="flex justify-between items-center flex-row-reverse py-1">
                  <span className="text-[11px] text-slate-300 font-medium">
                    {t('يرجى تسليم هذا المبلغ يداً بيد للكابتن عند النزول:', 'Please hand this exact amount in cash to the Captain:')}
                  </span>
                  <span className="text-2xl font-black text-amber-300 font-mono tracking-tight">
                    {unratedCompletedRide.price.toFixed(2)} <span className="text-xs">{t('د.أ', 'JOD')}</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 p-4 rounded-2xl border-2 border-emerald-500/80 shadow-lg shadow-emerald-950/30 flex flex-col gap-2 text-right">
                <div className="flex justify-between items-center flex-row-reverse border-b border-emerald-500/30 pb-2">
                  <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5 flex-row-reverse">
                    <span>💳 {t('تم خصم الأجرة تلقائياً من محفظتك', 'Fare Settled via Digital Wallet')}</span>
                  </span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold">
                    {t('مدفوع إلكترونياً ✓', 'Paid Electronically ✓')}
                  </span>
                </div>
                <div className="flex justify-between items-center flex-row-reverse py-1">
                  <span className="text-[11px] text-slate-300 font-medium">
                    {t('تمت التسوية الرقمية بنجاح (لا تدفع أي مبالغ نقدية للكابتن):', 'Settled from your wallet (Do NOT pay cash to the Captain):')}
                  </span>
                  <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                    {unratedCompletedRide.price.toFixed(2)} <span className="text-xs">{t('د.أ', 'JOD')}</span>
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center flex-row-reverse">
                <span className="text-[9px] text-slate-500 font-bold">{t('الأجرة المتوقعة:', 'Expected Fare:')}</span>
                <span className="text-xs font-bold text-slate-300 font-mono">
                  {(unratedCompletedRide.expectedPrice !== undefined ? unratedCompletedRide.expectedPrice : unratedCompletedRide.price).toFixed(2)} {t('د.أ', 'JD')}
                </span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center flex-row-reverse">
                <span className="text-[9px] text-slate-500 font-bold">{t('حالة الفاتورة:', 'Invoice Status:')}</span>
                <span className="text-xs font-bold text-emerald-400 font-sans">
                  {t('مكتملة ومسواة ✓', 'Settled & Closed ✓')}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Captain Evaluation Section */}
          {settings?.ratingsDisabled ? (
            <div className="bg-slate-950/60 p-5 border border-indigo-500/20 rounded-xl text-center flex flex-col gap-3 leading-relaxed mt-1">
              <span className="text-sm font-black text-indigo-400 flex items-center justify-center gap-1.5 flex-row-reverse">
                <span>💡 أرشفة التقييمات مفعلة مركزياً</span>
              </span>
              <p className="text-[10.5px] text-slate-350">
                تماشياً مع قرار إدارة "آدم" لعام 2026، تم تحويل نظام التقييمات المتبادلة المباشرة لوضع الأرشفة الساكنة لتبسيط الخدمة والارتقاء بسرعة الأداء.
              </p>
              <div className="text-[9px] text-slate-500 font-mono">
                سيتم احتساب جودة التوصيل تلقائياً على خوادم السحابة.
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col gap-3 items-center text-center mt-1">
              <span className="text-[11px] font-bold text-slate-200">
                {t(`كيف تقيم تجربة قيادة وسلوك الكابتن؟`, `How would you rate the Captain's service?`)}
              </span>
              
              {/* Star Buttons Row */}
              <div className="flex gap-2.5 justify-center py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => {
                      setSelectedStars(star);
                      setSelectedTags([]); // Reset tags when star changes to keep positive/negative consistent
                    }}
                    className="p-1 hover:scale-125 transition cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= selectedStars
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                          : 'text-slate-600 hover:text-slate-500'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="text-[10px] font-bold text-amber-400 font-sans">
                {selectedStars === 5 && t('ممتاز جداً ومريح (٥/٥) ⭐⭐⭐⭐⭐', 'Outstanding & Comfortable (5/5) ⭐⭐⭐⭐⭐')}
                {selectedStars === 4 && t('جيد جداً ومعتمد (٤/٥) ⭐⭐⭐⭐', 'Very Good & Recommended (4/5) ⭐⭐⭐⭐')}
                {selectedStars === 3 && t('مقبول واعتيادي (٣/٥) ⭐⭐⭐', 'Acceptable & Average (3/5) ⭐⭐⭐')}
                {selectedStars === 2 && t('يحتاج لتحسين القيادة (٢/٥) ⭐⭐', 'Needs Improvement (2/5) ⭐⭐')}
                {selectedStars === 1 && t('سيء ولا أنصح به (١/٥) ⭐', 'Unsatisfying experience (1/5) ⭐')}
              </div>

              {/* Tag Selector Pills */}
              <div className="w-full flex flex-wrap gap-1.5 justify-center mt-2">
                {(selectedStars >= 4
                  ? ['🚗 سيارة نظيفة', '⏱️ في الوقت', '👮 قيادة آمنة', '💬 أسلوب مهذب', '❄️ مكيف ممتاز']
                  : ['⚠️ قيادة متهورة', '⏱️ تأخر عن الموعد', '🧹 السيارة متسخة', '🚬 تدخين', '❄️ المكيف معطل']
                ).map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                      className={`text-[9px] font-bold px-2.5 py-1 rounded-full border transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Comment block */}
              <div className="w-full text-right mt-2 flex flex-col gap-1.5">
                <div className="flex justify-between items-center flex-row-reverse">
                  <label className="text-[10px] text-slate-400 font-bold">{t('ملاحظات إضافية حول سلوك الكابتن (اختياري)', 'Additional Feedback (Optional)')}</label>
                  
                  {/* Voice control button */}
                  <button
                    type="button"
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold cursor-pointer transition flex-row-reverse ${
                      isRecording 
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse' 
                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-3 h-3 text-rose-400 animate-bounce" /> : <Mic className="w-3 h-3 text-indigo-400" />}
                    <span>
                      {isRecording 
                        ? `${t('تسجيل...', 'Recording...')} (${Math.floor(recordingDuration / 60)}:${String(recordingDuration % 60).padStart(2, '0')})` 
                        : t('🎙️ إملاء صوتي', '🎙️ Speak Review')
                      }
                    </span>
                  </button>
                </div>

                <div className="relative w-full">
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder={t('اكتب تفاصيل تجربتك هنا لمساعدة إدارة آدم في الارتقاء بالخدمة البرية...', 'Write suggestions here to help improve our quality standard...')}
                    className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-100 outline-none text-right transition resize-none h-18 w-full"
                  />
                  
                  {isTranscribing && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-xl flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#10b981] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[#10b981] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[#10b981] animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="text-[10px] text-emerald-400 font-bold font-sans">{t('تحويل الصوت إلى نص بالذكاء...', 'AI Transcribing audio...')}</span>
                    </div>
                  )}
                </div>

                {/* OPTIONAL DRIVER REWARD / TIP SECTION */}
                <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-3 flex flex-col gap-2 text-right dir-rtl my-2 font-sans w-full">
                  <div className="flex justify-between items-center flex-row-reverse">
                    <div className="flex items-center gap-1.5 flex-row-reverse text-amber-300 font-extrabold text-xs">
                      <span>🎁 {t('مكافأة الكابتن (إكرامية / Tip اختيارية)', 'Captain Reward / Tip (Optional)')}</span>
                    </div>
                    <span className="text-[9.5px] text-slate-400">
                      {t('رصيدك:', 'Balance:')} {loggedPassenger?.balance || loggedPassenger?.walletBalance || 0} {t('د.أ', 'JD')}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                    {t('هل ترغب بمنح مكافأة تشجيعية للكابتن تقديرًا لخدمته المتميزة وحسن المعاملة؟', 'Would you like to reward the captain for exceptional service and great hospitality?')}
                  </p>

                  <div className="flex flex-wrap gap-1.5 justify-end my-1">
                    {[
                      { val: 0, label: t('بدون مكافأة', 'No Tip') },
                      { val: 0.5, label: '+ 0.50 د.أ' },
                      { val: 1.0, label: '+ 1.00 د.أ' },
                      { val: 2.0, label: '+ 2.00 د.أ' },
                      { val: 3.0, label: '+ 3.00 د.أ' }
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setTipAmount(item.val)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          tipAmount === item.val
                            ? 'bg-amber-500 text-slate-950 shadow-md font-black scale-105'
                            : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-amber-500/50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {tipAmount > 0 && (
                    <div className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/30 p-2 rounded-lg font-bold text-center animate-fadeIn">
                      ✨ {t(`سيتم تحويل مبلغ (${tipAmount.toFixed(2)} د.أ) مباشرة إلى محفظة الكابتن عند إرسال التقييم.`, `An amount of (${tipAmount.toFixed(2)} JD) will be credited directly to captain wallet.`)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Rating Action Button */}
          <div className="flex flex-col gap-2 pt-1 font-sans">
            <button
              type="button"
              id="btn-submit-passenger-rating"
              onClick={() => {
                if (settings?.ratingsDisabled) {
                  rateIntraCityDriver(unratedCompletedRide.id, 5, 'تخطي التقييم (نظام التقييمات معطل مركزياً)', tipAmount);
                } else {
                  const tagsPart = selectedTags.length > 0 ? `[وسوم: ${selectedTags.join(', ')}]` : '';
                  const finalComment = [tagsPart, ratingComment].filter(Boolean).join(' ');
                  rateIntraCityDriver(unratedCompletedRide.id, selectedStars || 5, finalComment, tipAmount);
                }
                handleClosePassengerInvoice(unratedCompletedRide.id);
                setSelectedStars(5);
                setSelectedTags([]);
                setRatingComment('');
                setTipAmount(0);
              }}
              className="w-full bg-[#10b981] hover:bg-emerald-600 active:scale-[98%] text-white font-black py-3 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/40"
            >
              <span>💾 {settings?.ratingsDisabled ? t('إنهاء المشوار ومتابعة', 'Finish Ride & Continue') : t('تسجيل التقييم وإنهاء المشوار', 'Submit Rating & End Ride')}</span>
            </button>

            <button
              type="button"
              id="btn-skip-passenger-rating"
              onClick={() => {
                rateIntraCityDriver(unratedCompletedRide.id, 5, 'تخطي التقييم (بواسطة الراكب)', 0);
                handleClosePassengerInvoice(unratedCompletedRide.id);
                setSelectedStars(5);
                setSelectedTags([]);
                setRatingComment('');
                setTipAmount(0);
              }}
              className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold py-2 rounded-xl text-[11px] transition duration-150 flex items-center justify-center gap-1 cursor-pointer border border-slate-700/50"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('تخطي التقييم وإغلاق الفاتورة نهائياً', 'Skip Rating & Close Invoice Permanently')}</span>
            </button>
          </div>
        </motion.div>
      ) : activeLocalRide ? (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
          
          {/* Header Status Bar */}
          <motion.div 
            key={activeLocalRide.status}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex-row-reverse"
          >
            <div className="text-right">
              <span className="text-[9px] text-slate-500 block">{t('حالة الطلب المباشر', 'Instant Request Status')}</span>
              <span className="text-xs font-black text-indigo-400">
                {activeLocalRide.status === 'pending' && t('⚡ جاري البحث عن كابتن وإرسال نداءات...', '⚡ Finding Captain & Broadcasting...')}
                {activeLocalRide.status === 'accepted' && t('🚗 كابتن آدم قادم إليك الآن', '🚗 Adam Captain is En Route')}
                {activeLocalRide.status === 'started' && t('🚀 على الطريق نحو التنزيل الجغرافي', '🚀 In Transit to Dropoff')}
              </span>
            </div>
            {activeLocalRide.status === 'pending' && (
              <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-ping"></span>
            )}
            {(activeLocalRide.status === 'accepted' || activeLocalRide.status === 'started') && (
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            )}
          </motion.div>

          {/* Sparkly Status Transition Banner for Local Rides */}
          {activeLocalRide.status === 'accepted' && (
            <motion.div 
              initial={{ height: 0, opacity: 0, y: -8 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="bg-emerald-950/75 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between flex-row-reverse text-right gap-2 overflow-hidden"
            >
              <div className="bg-emerald-500 text-black p-1 rounded-full animate-bounce shrink-0">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 font-sans">
                <div className="font-extrabold text-[10px] text-emerald-400">{t('🎉 تم قبول مشوارك المباشر!', '🎉 Instant Ride Accepted!')}</div>
                <div className="text-[8.5px] text-slate-300 mt-0.5 leading-relaxed">
                  {t('نجح الرادار في توجيه كابتن قريب إليك فوراً. السائق الآن في طريقه بموجب تتبع الخريطة أدناه.', 'The radar has dispatched a nearby captain who is en route based on the GPS map below.')}
                </div>
              </div>
            </motion.div>
          )}

          {/* LIVE CAPTAIN ARRIVAL ETA & DISTANCE INDICATOR FOR INSTANT TAXI RIDES */}
          <CaptainLiveArrivalIndicator
            driverName={activeLocalRide.driverName || 'كابتن آدم التاكسي'}
            driverPhone={activeLocalRide.driverPhone || '0798765432'}
            carModel="تويوتا كامري (تاكسي مميز)"
            carPlate="12-4589"
            pickupLocation={activeLocalRide.pickupName || 'موقع الإقلال المحدد'}
            dropoffLocation={activeLocalRide.dropoffName || 'موقع الوصول'}
            status={activeLocalRide.status}
            initialEtaMinutes={3}
            initialDistanceKm={1.2}
            onCallCaptain={() => {
              alert(`📞 جاري الاتصال المباشر بالكابتن ${activeLocalRide.driverName || 'آدم'}`);
            }}
            onOpenChat={() => {
              alert(`💬 جاري فتح شات المحادثة المباشرة مع الكابتن ${activeLocalRide.driverName || 'آدم'}`);
            }}
            t={t}
          />

          {/* OTP PIN CODE DISPLAY FOR PASSENGER TO GIVE TO DRIVER */}
          {(activeLocalRide.status === 'accepted' || activeLocalRide.status === 'in_progress') && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-amber-950/90 via-slate-950 to-indigo-950/90 border-2 border-amber-500 rounded-2xl p-4 flex flex-col gap-2.5 shadow-2xl shadow-amber-950/40 text-center font-sans"
            >
              <div className="flex items-center justify-between flex-row-reverse border-b border-amber-500/30 pb-2">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 flex-row-reverse">
                  <span>🔒 {t('الرقم السري لبدء المشوار (Start OTP PIN)', 'Trip Security PIN (OTP)')}</span>
                </span>
                <span className="text-[9.5px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-black animate-pulse">
                  {activeLocalRide.status === 'in_progress' ? '✅ تم التحقق من الرمز وبدء الرحلة' : t('زوده للكابتن عند الوصول ⚡', 'Provide to Captain on Arrival ⚡')}
                </span>
              </div>

              <p className="text-[10.5px] text-slate-300 text-right leading-relaxed">
                {t(
                  'يرجى تزويد الكابتن بهذا الرمز المكون من 4 أرقام عند ركوب السيارة لتأكيد الهوية وبدء العداد رسمياً:',
                  'Please provide this 4-digit code to the Captain upon boarding to verify identity and start the ride meter:'
                )}
              </p>

              <div className="bg-slate-950 border-2 border-amber-500/50 py-3 px-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-inner">
                {(() => {
                  const otp = activeLocalRide.startOtp || (1000 + (Math.abs(activeLocalRide.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 9000)).toString();
                  return (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2.5" dir="ltr">
                        {otp.split('').map((digit, idx) => (
                          <span 
                            key={idx} 
                            className="w-12 h-14 bg-gradient-to-b from-amber-500/20 to-amber-950/80 border-2 border-amber-400 text-amber-300 rounded-2xl flex items-center justify-center font-mono text-3xl font-black shadow-lg tracking-tight"
                          >
                            {digit}
                          </span>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(otp);
                            setSuccessMsg(`📋 تم نسخ الرقم السري [${otp}] بنجاح`);
                            setTimeout(() => setSuccessMsg(''), 3000);
                          }
                        }}
                        className="mt-1 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-3 py-1 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>📋 نسخ الرقم السري</span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          )}

          {/* PROMOTIONAL AD BANNER FOR CAPTAIN & TRIP DETAILS */}
          <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-emerald-950/80 border border-indigo-500/40 rounded-xl p-3 flex flex-col gap-2 shadow-xl relative overflow-hidden animate-fadeIn my-1">
            <div className="flex justify-between items-center flex-row-reverse">
              <div className="flex items-center gap-1.5 text-indigo-300 flex-row-reverse font-black text-[10.5px]">
                <Car className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>📢 شريط إعلاني: تفاصيل الكابتن والرحلة المقبولة للراكب</span>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 animate-pulse">
                {activeLocalRide.status === 'accepted' ? 'كابتن متوجه إليك' : 'مشوار نشط'}
              </span>
            </div>
            
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1.5 text-right text-[9.5px] text-slate-200 font-sans">
              <div className="flex justify-between items-center flex-row-reverse border-b border-slate-900 pb-1">
                <span className="text-slate-300">👤 الكابتن: <strong className="text-indigo-300 font-bold">{activeLocalRide.driverName || 'كابتن معتمد'}</strong></span>
                <span className="text-amber-400 font-bold font-mono">📱 {activeLocalRide.driverPhone || '079XXXXXXX'}</span>
              </div>
              <div className="flex justify-between items-center flex-row-reverse pt-0.5">
                <span className="text-slate-300">💳 طريقة الدفع: <strong className={activeLocalRide.paymentMethod === 'cash' ? 'text-emerald-400' : 'text-indigo-400'}>{activeLocalRide.paymentMethod === 'cash' ? '💵 نقدي (كاش)' : '💳 محفظة رقمية'}</strong></span>
                <span className="text-emerald-400 font-mono font-black text-xs">الأجرة: {activeLocalRide.price.toFixed(2)} د.أ</span>
              </div>
            </div>
          </div>

          {/* Simulated Animated Intersections & Coordinates GPS Map */}
          <div className="relative w-full h-44 bg-[#050811] rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-end">
            
            {/* SVG Interactive Tracing */}
            <svg className="absolute inset-0 w-full h-full select-none" viewBox="100 100 200 200">
              <defs>
                <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(99, 102, 241, 0.2)" />
                  <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
                </radialGradient>
              </defs>

              {/* Grid meshes */}
              <path d="M 0 150 L 400 150 M 150 0 L 150 400 M 0 200 L 400 200 M 200 0 L 200 400" stroke="rgba(38, 50, 75, 0.12)" strokeWidth="0.8" />

              {activeLocalRide.status === 'pending' && (
                <>
                  {/* Blinking scanning radar circle centered on pickup location */}
                  <circle cx={activeLocalRide.pickupCoords.x} cy={activeLocalRide.pickupCoords.y} r={(simTick % 4) * 20} fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="1" />
                  <circle cx={activeLocalRide.pickupCoords.x} cy={activeLocalRide.pickupCoords.y} r="65" fill="url(#radar-glow)" />
                  
                  {/* Scattered mock driver dots */}
                  <circle cx={activeLocalRide.pickupCoords.x - 25} cy={activeLocalRide.pickupCoords.y + 15} r="2.5" fill="#facc15" className="animate-pulse" />
                  <circle cx={activeLocalRide.pickupCoords.x + 35} cy={activeLocalRide.pickupCoords.y - 30} r="2.5" fill="#facc15" className="animate-pulse" />
                </>
              )}

              {/* Render Pickup Pin */}
              <circle cx={activeLocalRide.pickupCoords.x} cy={activeLocalRide.pickupCoords.y} r="5" fill="#3b82f6" />
              <circle cx={activeLocalRide.pickupCoords.x} cy={activeLocalRide.pickupCoords.y} r="10" fill="none" stroke="#3b82f6" strokeWidth="1.5" className="animate-ping" />

              {/* Render Dropoff Pin */}
              <circle cx={activeLocalRide.dropoffCoords.x} cy={activeLocalRide.dropoffCoords.y} r="5" fill="#10b981" />
              
              {/* Route connecting line if accepted or started */}
              {(activeLocalRide.status === 'accepted' || activeLocalRide.status === 'started') && (
                <line 
                  x1={activeLocalRide.pickupCoords.x} 
                  y1={activeLocalRide.pickupCoords.y} 
                  x2={activeLocalRide.dropoffCoords.x} 
                  y2={activeLocalRide.dropoffCoords.y} 
                  stroke="#6366f1" 
                  strokeWidth="2" 
                  strokeDasharray="4 3" 
                />
              )}

              {/* Route approach movement tracking line for the passenger (from driver current position to pickup) */}
              {activeLocalRide.status === 'accepted' && (() => {
                let drvX = 0;
                let drvY = 0;
                if (lastReceivedCoords) {
                  drvX = lastReceivedCoords.x;
                  drvY = lastReceivedCoords.y;
                } else {
                  const percent = 1 - (simTick / 100);
                  drvX = activeLocalRide.pickupCoords.x + (activeLocalRide.dropoffCoords.x - activeLocalRide.pickupCoords.x) * percent * 0.4 + 20 * percent;
                  drvY = activeLocalRide.pickupCoords.y + (activeLocalRide.dropoffCoords.y - activeLocalRide.pickupCoords.y) * percent * 0.4 - 15 * percent;
                }
                return (
                  <g>
                    {/* Shimmering orange line tracking driver approach to pickup */}
                    <line 
                      x1={drvX} 
                      y1={drvY} 
                      x2={activeLocalRide.pickupCoords.x} 
                      y2={activeLocalRide.pickupCoords.y} 
                      stroke="#facc15" 
                      strokeWidth="2.5" 
                      strokeOpacity="0.45"
                    />
                    <line 
                      x1={drvX} 
                      y1={drvY} 
                      x2={activeLocalRide.pickupCoords.x} 
                      y2={activeLocalRide.pickupCoords.y} 
                      stroke="#ea580c" 
                      strokeWidth="1.5" 
                      strokeDasharray="3 3" 
                    />
                  </g>
                );
              })()}

              {/* Blinking Driver symbol */}
              {(activeLocalRide.status === 'accepted' || activeLocalRide.status === 'started') && (() => {
                let drvX = 0;
                let drvY = 0;
                let symbol = activeLocalRide.status === 'accepted' ? "🚕" : "🚗";
                let color = activeLocalRide.status === 'accepted' ? "#facc15" : "#38bdf8";

                if (lastReceivedCoords) {
                  drvX = lastReceivedCoords.x;
                  drvY = lastReceivedCoords.y;
                } else {
                  // Fallback Mock formulation if WS not connected yet
                  if (activeLocalRide.status === 'accepted') {
                    const percent = 1 - (simTick / 100);
                    drvX = activeLocalRide.pickupCoords.x + (activeLocalRide.dropoffCoords.x - activeLocalRide.pickupCoords.x) * percent * 0.4 + 20 * percent;
                    drvY = activeLocalRide.pickupCoords.y + (activeLocalRide.dropoffCoords.y - activeLocalRide.pickupCoords.y) * percent * 0.4 - 15 * percent;
                  } else {
                    const percent = simTick / 100;
                    drvX = activeLocalRide.pickupCoords.x + (activeLocalRide.dropoffCoords.x - activeLocalRide.pickupCoords.x) * percent;
                    drvY = activeLocalRide.pickupCoords.y + (activeLocalRide.dropoffCoords.y - activeLocalRide.pickupCoords.y) * percent;
                  }
                }

                return (
                  <g>
                    {lastReceivedCoords && (
                      <circle cx={drvX} cy={drvY} r="12" fill="none" stroke={color} strokeWidth="1" className="animate-ping" />
                    )}
                    <circle cx={drvX} cy={drvY} r="7.5" fill={color} className="shadow-lg" />
                    <text x={drvX - 3.5} y={drvY + 3} fontSize="9" fill="#000" fontWeight="bold">{symbol}</text>
                  </g>
                );
              })()}
            </svg>

            {/* Geographical labels overlay */}
            <div className="absolute top-2 right-2 bg-slate-950/80 px-2 py-1 rounded text-[8px] border border-slate-800 text-slate-300 font-sans text-right">
              📍 {activeLocalRide.pickupName} ➔ 🏁 {activeLocalRide.dropoffName}
            </div>

            {/* Small live banner */}
            <div className="z-10 bg-gradient-to-t from-slate-950 to-transparent p-2 text-center text-[10px] text-slate-400 font-sans">
              {activeLocalRide.status === 'pending' && t('يتم الآن فحص الكباتن القريبين ومحاذاتهم حرارياً بمركبتك...', 'Simulating real-time captain response logs inside governorate bounds...')}
              {activeLocalRide.status === 'accepted' && t('الكابتن متوجه إليك لموقع وباب الإركاب المحدد.', 'Captain has accepted and is heading to your designated pickup neighborhood.')}
              {activeLocalRide.status === 'started' && t('أنت في طريقك وجهتك الآن مع تلميحات أمان المشوار.', 'Safe transit code is active. Comforting carpooling ride underway.')}
            </div>
          </div>

          {/* Ride Details Sheet */}
          <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-800 flex flex-col gap-2.5 font-sans">
            <h4 className="text-xs font-bold text-slate-200 border-b border-slate-800 pb-1.5 skeleton">
              {t('تفاصيل ومحاسبة المشوار الفوري', 'Instant Ride Parameters & Ledger')}
            </h4>

            <div className="grid grid-cols-2 gap-2 text-right text-[10px]">
              <div>
                <span className="text-slate-500 block">{t('نقطة الإركاب الجغرافية', 'Pickup Area')}</span>
                <span className="font-bold text-slate-200">{activeLocalRide.pickupName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{t('محطة الإنزيل النهائية', 'Dropoff Area')}</span>
                <span className="font-bold text-slate-200">{activeLocalRide.dropoffName}</span>
              </div>
              <div className="mt-1">
                <span className="text-slate-500 block">{t('المسافة التقديرية للعداد', 'Trip Distance')}</span>
                <span className="font-bold text-slate-200 font-mono text-xs">{activeLocalRide.distanceKm} {t('كم', 'KM')}</span>
              </div>
              <div className="mt-1">
                <span className="text-slate-500 block">{t('الوقت المتوقع للمشوار', 'Estimated Duration')}</span>
                <span className="font-bold text-slate-200 font-mono text-xs">{activeLocalRide.durationMin} {t('دقيقة', 'min')}</span>
              </div>
            </div>

            {/* Intermediate Waypoints Display */}
            {activeLocalRide.waypoints && activeLocalRide.waypoints.length > 0 && (
              <div className="bg-slate-900/80 border border-indigo-500/30 p-2 rounded-xl flex flex-col gap-1.5 text-right font-sans my-1">
                <span className="text-[10px] text-indigo-300 font-extrabold flex items-center gap-1 justify-end flex-row-reverse">
                  <span>📍 نقاط التوقف المحددة للمسار ({activeLocalRide.waypoints.length}):</span>
                </span>
                <div className="flex flex-col gap-1">
                  {activeLocalRide.waypoints.map((wp, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[9px] text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800 flex-row-reverse">
                      <span className="font-bold text-amber-300">نقطة {idx + 1}: {wp.name}</span>
                      <span className="text-slate-400 font-mono">انتظار ~{wp.estimatedWaitMin || 4} دقائق (+{wp.stopFee.toFixed(2)} د.أ)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Alert Box */}
            <div className="flex justify-between items-center bg-indigo-950/20 p-2.5 border border-indigo-500/20 rounded-xl mt-2 flex-row-reverse font-sans">
              <span className="text-[10px] text-indigo-300 font-bold">{t('إجمالي الأجرة المتوقعة (مقتطعة من المحفظة):', 'Total Estimated Trip Fare (Paid via Wallet):')}</span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                {activeLocalRide.price.toFixed(2)} {t('د.أ', 'JD')}
              </span>
            </div>

            {/* Google Maps & Waze Real-time Unified Route Integration for Passengers */}
            {(() => {
              const startGeo = getGeoCoords(activeLocalRide.pickupCoords.x, activeLocalRide.pickupCoords.y);
              const targetGeo = getGeoCoords(activeLocalRide.dropoffCoords.x, activeLocalRide.dropoffCoords.y);
              const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${startGeo.lat},${startGeo.lng}&destination=${targetGeo.lat},${targetGeo.lng}&travelmode=driving`;
              return (
                <div className="bg-slate-900/65 border border-indigo-500/15 p-2.5 rounded-xl flex flex-col gap-2 text-right font-sans my-1">
                  <div className="flex justify-between items-center flex-row-reverse">
                    <span className="text-[9.5px] text-slate-200 font-extrabold flex items-center gap-1 justify-end font-sans">
                      <span>🗺️ مسار الرحلة الموحد بالخرائط:</span>
                    </span>
                    <span className="text-[7.5px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded font-sans font-bold">نقطتين على خريطة واحدة ✓</span>
                  </div>
                  
                  <a
                    href={gmapsUrl}
                    target="_blank"
                    rel="no-referrer"
                    className="w-full bg-gradient-to-r from-indigo-600/30 to-emerald-600/30 hover:from-indigo-600 hover:to-emerald-600 border border-indigo-500/30 hover:border-emerald-400 text-slate-200 hover:text-white py-2 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    🗺️ {t('فتح مسار الخريطة الموحد (الانطلاق + الوصول على خريطة واحدة)', 'Open Unified Route (Pickup & Dropoff on 1 Map)')}
                  </a>
                </div>
              );
            })()}

            {/* Real-time ETA Countdown Timer Card */}
            {activeLocalRide.status === 'accepted' && (() => {
              const etaMinutes = Math.max(1, Math.floor((1 - (simTick / 100)) * 5) + 1); // goes from 5 down to 1 minute
              const etaSeconds = Math.floor((100 - simTick) * 3.6) % 60; // 0 to 59
              const formattedSecs = etaSeconds < 10 ? `0${etaSeconds}` : etaSeconds;
              return (
                <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex flex-col gap-2 shadow-lg text-center font-sans animate-fadeIn relative overflow-hidden mt-1">
                  {/* Shimmering progress background */}
                  <div className="absolute top-0 right-0 h-1 bg-emerald-500 animate-pulse" style={{ width: `${100 - simTick}%` }}></div>
                  
                  <div className="flex justify-between items-center flex-row-reverse">
                    <div className="flex items-center gap-1.5 flex-row-reverse text-emerald-400">
                      <Clock className="w-4 h-4 animate-spin text-emerald-400" />
                      <span className="text-[10px] font-black">{t('زمن وصول الكابتن المتوقع لموقعك', 'Captain Estimated Arrival Time')}</span>
                    </div>
                    <span className="text-[8px] bg-emerald-505/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold animate-pulse">{t('مباشر', 'LIVE')}</span>
                  </div>
                  
                  <div className="flex flex-col items-center mt-1">
                    <span className="text-3xl font-black text-emerald-400 font-mono tracking-widest leading-none drop-shadow">
                      0{etaMinutes}:{formattedSecs}
                    </span>
                    <span className="text-[9.5px] text-slate-400 mt-1.5 font-sans leading-relaxed">
                      {t('كابتن الرحلة متوجّه لموقع الإركاب وباب بنايتك المحدد الآن. يرجى التجهّز فوراً لالتقاء الكابتن دون تأخير.', 'Captain is navigating to your gate now. Please get ready to meet the captain to ensure a smooth passenger pickup.')}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Security PIN Display Card for Ride Start Verification */}
            {activeLocalRide.status === 'accepted' && (() => {
              const startPin = activeLocalRide.startOtp || (1000 + (Math.abs(activeLocalRide.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % 9000)).toString();
              return (
                <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/90 border-2 border-indigo-500/60 p-4 rounded-2xl flex flex-col gap-2.5 shadow-2xl text-right font-sans my-2 relative overflow-hidden animate-fadeIn">
                  <div className="flex justify-between items-center flex-row-reverse border-b border-indigo-500/30 pb-2">
                    <div className="flex items-center gap-2 flex-row-reverse text-indigo-300 font-extrabold text-xs">
                      <Shield className="w-4 h-4 text-indigo-400 animate-pulse" />
                      <span>🔒 {t('رمز بدء الرحلة والأمان (PIN)', 'Trip Start Security Code (PIN)')}</span>
                    </div>
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                      {t('زوّده للكابتن', 'Provide to Captain')}
                    </span>
                  </div>

                  <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans">
                    {t('يرجى تزويد هـذا الرقم المكون من 4 خانات للكابتن عند ركوب المركبة ليقوم بإدخاله والبدء بإنطلاق المشوار بسلامة الله:', 'Please provide this 4-digit code to the captain upon entering the vehicle to start the ride:')}
                  </p>

                  <div className="flex justify-center items-center gap-2.5 my-1 dir-ltr">
                    {startPin.split('').map((digit: string, idx: number) => (
                      <div 
                        key={idx}
                        className="w-11 h-13 bg-indigo-600/30 border-2 border-indigo-400 text-indigo-200 font-mono text-2xl font-black rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 tracking-wider"
                      >
                        {digit}
                      </div>
                    ))}
                  </div>

                  <div className="text-[9.5px] text-slate-400 text-center font-sans">
                    ⚡ {t('هذا الرمز خاص بمشوارك الحالي لتوثيق سلامة وصول المركبة والبدء الرسمي.', 'This PIN verifies vehicle arrival and official trip start.')}
                  </div>
                </div>
              );
            })()}

            {/* Passenger-Side WebSockets Secure Telemetry Terminal */}
            {isWsConnected && (
              <div id="passenger-ws-telemetry-console" className="bg-slate-950/95 border border-purple-500/25 rounded-2xl p-4 flex flex-col gap-2 font-sans animate-fadeIn mt-1">
                <div className="flex justify-between items-center-reverse flex-row-reverse border-b border-slate-900 pb-1.5">
                  <div className="flex items-center gap-1.5 flex-row-reverse">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <strong className="text-[10px] text-slate-200">بوابة التتبع المباشر (Secure WS Connected)</strong>
                  </div>
                  <span className="text-[8px] text-purple-400 font-mono font-bold uppercase tracking-wider bg-purple-500/10 px-1.5 py-0.5 rounded">
                    SYS WS CHANNEL ACTIVE
                  </span>
                </div>
                
                <div className="text-[8px] text-slate-500 font-mono select-all text-right">
                  BROKER: adam-ws://live-hub.adamride.com/ride/{activeLocalRide.id}
                </div>
                
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-850/80 font-mono text-[7.5px] text-indigo-300 flex flex-col gap-1 max-h-[120px] overflow-y-auto text-right">
                  {wsLogs.map((log, idx) => (
                    <div key={idx} className="pb-1 border-b border-slate-950/40 last:border-0 select-all whitespace-pre-wrap">
                      {log}
                    </div>
                  ))}
                </div>
                
                <div className="text-[8px] flex justify-between flex-row-reverse text-slate-500 font-sans leading-tight">
                  <span>بث جي بي إس: {lastReceivedCoords ? 'متصل ومحدث ٥ ثوانٍ' : 'بانتظار أول حزمة..'}</span>
                  <span>البروتوكول: RFC 6455 compliant client</span>
                </div>
              </div>
            )}

            {/* Driver Contact Block (If assigned) */}
            {activeLocalRide.driverId ? (() => {
              const assignedDriver = drivers?.find(d => d.id === activeLocalRide.driverId);
              const driverPhoto = assignedDriver?.documents?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
              const ratingAvg = assignedDriver?.ratingAverage || 4.9;
              const tripsCount = assignedDriver?.tripsCount || 124;
              const carDescription = assignedDriver ? `${assignedDriver.carType} (${assignedDriver.carClass || ''})` : t('سيدان مريح', 'Comfortable Sedan');
              const carYear = assignedDriver?.carModel || 2023;
              const carPlate = assignedDriver?.carPlate || '70-58135';

              return (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3.5 animate-fadeIn">
                  {/* Captain Profile & Info */}
                  <div className="flex items-start justify-between gap-3 flex-row-reverse">
                    {/* Photo Container */}
                    <div className="relative shrink-0">
                      <img 
                        src={driverPhoto} 
                        alt="Captain photo" 
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500/50 shadow-lg"
                      />
                      <span className="absolute -bottom-1 -right-1 bg-indigo-500 text-white rounded-full p-0.5 border border-slate-950">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {/* Text Details */}
                    <div className="text-right flex-1">
                      <span className="text-[8.5px] bg-indigo-500/15 text-indigo-400 font-extrabold px-2 py-0.5 rounded-full inline-block mb-1">
                        {t('كابتن معـتمـد مـثـبّـت المعايير', 'Verified Premium Captain Assigned')}
                      </span>
                      <h5 className="text-xs font-black text-slate-100 block tracking-tight">
                        {activeLocalRide.driverName || assignedDriver?.fullName}
                      </h5>
                      
                      {/* Star Ratings */}
                      <div className="flex items-center justify-end gap-1 mt-1 flex-row-reverse">
                        <div className="flex items-center gap-0.5 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span className="text-[10px] font-mono font-bold leading-none">{ratingAvg}</span>
                        </div>
                        <span className="text-[9px] text-slate-500">
                          ({tripsCount} {t('رحلة ناجحة', 'successful rides')})
                        </span>
                      </div>

                      <span className="text-[9.5px] text-slate-400 font-mono mt-1 block select-all">
                        📱 {activeLocalRide.driverPhone || assignedDriver?.phone}
                      </span>
                    </div>
                  </div>

                  {/* Car & Vehicle Specifications Card */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800/85 rounded-xl flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-1 flex-row-reverse">
                      <div className="flex items-center gap-1.5 flex-row-reverse">
                        <Car className="w-4 h-4 text-emerald-400" />
                        <span className="text-[9.5px] text-slate-400">{t('مركبة التوصيل المعرّفة للرحلة', 'Assigned Vehicle')}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-sans">
                        {t('الموديل', 'Model')}: <span className="font-mono text-slate-300 font-bold">{carYear}</span>
                      </span>
                    </div>

                    {/* Car Name & Description */}
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-200 block">
                        {carDescription}
                      </span>
                    </div>

                    {/* Jordan Spec Car Plate Representation */}
                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 flex-row-reverse mt-1">
                      <span className="text-[9px] text-slate-500 leading-none">{t('لوحة الترخيص الرسمية للتطابق:', 'License plate registration:')}</span>
                      <div className="bg-amber-400 text-slate-950 font-mono text-[10px] font-extrabold px-2 py-0.5 rounded border border-amber-300 shadow-sm inline-flex items-center justify-center tracking-widest leading-none select-all font-sans">
                        🚗 {carPlate}
                      </div>
                    </div>
                  </div>

                  {/* Contact Trigger Button */}
                  <div className="flex gap-2">
                    <a 
                      href={`tel:${activeLocalRide.driverPhone || assignedDriver?.phone}`} 
                      className="flex-1 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-slate-950 transition duration-150 flex items-center justify-center gap-2 font-bold text-[11px] font-sans cursor-pointer text-center"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{t('اتصل هاتفياً للرد الفوري', 'Phone Call Captain Now')}</span>
                    </a>
                  </div>
                </div>
              );
            })() : (
              <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg text-[10px] text-center">
                ⚠️ {t('بانتظار سائقي التاكسي المتصلين القريبين لقبول ندائك الفوري...', 'Waiting for online captain to accept your local pickup request...')}
              </div>
            )}

            {/* ADVANCED LOCAL SOS & SAFETY CENTER */}
            <div className="bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 p-3 rounded-xl flex flex-col gap-2 transition text-right mt-2 font-sans">
              <div className="flex justify-between items-center flex-row-reverse">
                <span className="flex items-center gap-1 flex-row-reverse text-[10.5px] font-black text-red-500">
                  <span>🚨 لوحة أمان الركاب والاتصال الطارئ (SOS)</span>
                </span>
                <span className="bg-red-500/15 text-red-400 text-[8px] px-1.5 py-0.5 rounded font-black uppercase">
                  حماية فورية
                </span>
              </div>
              
              <p className="text-[9.5px] text-slate-400 leading-normal">
                هل تواجه ظرفاً طارئاً أو تشعر بعدم الارتياح؟ استخدم خيارات الحماية والاتصال المباشر لإشراك عائلتك أو غرف الطوارئ فوراً.
              </p>

              <div className="flex gap-1.5 flex-wrap justify-end mt-1">
                {/* Share Tracking Link */}
                <button
                  type="button"
                  onClick={() => {
                    const trackingText = `أهلاً، أنا في طريقي الآن عبر مشاوير تاكسي آدم المحلية من ${activeLocalRide.pickupName} إلى ${activeLocalRide.dropoffName} بمشوار آمن ومبرمج. يمكنك تتبع موقعي الفوري هنا: https://track.adamride.com/live/${activeLocalRide.id}`;
                    navigator.clipboard.writeText(trackingText);
                    alert('✓ تم نسخ رابط ورسالة التتبع المباشر لرحلتك! يمكنك لصقها الآن في تطبيق واتساب بالنجاح.');
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[9px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 flex-row-reverse cursor-pointer transition shrink-0 border-none"
                >
                  <span>مشاركة التتبع (WhatsApp) 🔗</span>
                </button>

                {/* Speed Dial 911 */}
                <button
                  type="button"
                  onClick={() => {
                    const msg = `☎ سيتم محاكاة اتصال سريع بالدفاع المدني وطوارئ الأمن العام (911)\n\nتفاصيل الإرسال التلقائي لموقعك الجغرافي:\n- اسم الراكب: ${loggedPassenger.fullName}\n- رقم الهاتف: ${loggedPassenger.phone}\n- موقع الانطلاق: ${activeLocalRide.pickupName}\n- تتبع مركبة آدم: Toyota Prius [34-89024]\n- رقم المشوار: #${activeLocalRide.id.slice(-6)}`;
                    alert(msg);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white text-[9px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 flex-row-reverse cursor-pointer transition shrink-0 animate-pulse border-none"
                >
                  <span>اتصال بالدفاع المدني 911 📞</span>
                </button>

                {/* Alert Trusted Contacts */}
                {loggedPassenger.emergencyContacts && loggedPassenger.emergencyContacts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSosActiveAlert(true);
                      setTimeout(() => setSosActiveAlert(false), 8000);
                    }}
                    className="bg-amber-400 hover:bg-amber-500 text-slate-950 text-[9px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 flex-row-reverse cursor-pointer transition shrink-0 border-none"
                  >
                    <span>إرسال نداء فوري للأقارب 🛡️</span>
                  </button>
                )}
              </div>

              {/* Active alert indicator */}
              {sosActiveAlert && (
                <div className="mt-2 bg-red-950/80 border border-red-500/40 p-2 rounded-lg text-[9px] text-red-200 leading-normal">
                  <p className="font-bold flex items-center gap-1 flex-row-reverse text-right">
                    <span>⚠️ نداء استغاثة مباشر قيد الإرسال الآن:</span>
                  </p>
                  <div className="space-y-1 mt-1 text-right">
                    {(loggedPassenger.emergencyContacts || []).map((contact, cIdx) => (
                      <div key={cIdx} className="text-slate-200 flex justify-between flex-row-reverse text-[8.5px]">
                        <span>👤 {contact.name} ({contact.phone})</span>
                        <span className="text-emerald-400 font-bold">✓ تم إرسال رسالة SMS الأمان بنجاح بنظام الأقمار الصناعية</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!loggedPassenger.emergencyContacts || loggedPassenger.emergencyContacts.length === 0 ? (
                <div className="text-[8px] text-slate-500 text-center mt-1">
                  💡 نصيحة أمان: لم تقم بإضافة جهات اتصال طوارئ (أقارب) بعد. انتقل لعلامة تبويب <strong className="text-slate-400">"الإعدادات"</strong> لإضافتهم الآن.
                </div>
              ) : null}
            </div>

            {/* Cancel Button (permitted only if pending or accepted) */}
            {activeLocalRide.status !== 'started' ? (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="w-full bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 mt-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>{t('إلغاء نداء المشوار الفوري', 'Cancel Instant Ride Request')}</span>
              </button>
            ) : (
              <div className="w-full bg-slate-950/40 p-3 rounded-xl border border-dashed border-red-500/25 text-center mt-2.5">
                <p className="text-[10.5px] text-red-400 font-bold font-sans leading-normal">
                  🔒 {t('يمنع إلغاء الرحلة نهائياً بعد صعودك للمركبة وانطلاق الكابتن في المشوار لأسباب تنظيمية.', 'Cancellation is strictly prohibited after joining the vehicle and starting the ride.')}
                </p>
              </div>
            )}

            {/* Beautiful Custom Confirmation Modal */}
            {confirmCancel && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 font-sans text-right animate-fade-in" dir="rtl">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-[#0b0f19] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-l from-red-600 to-amber-500" />
                  
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-500/40 flex items-center justify-center text-red-400 animate-pulse">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    
                    <div className="w-full text-center">
                      <h3 className="text-sm font-black text-slate-100 mb-1.5 leading-relaxed">
                        {t('تأكيد إلغاء نداء المشوار الفوري', 'Confirm Cancelling Instant Pick-Up')}
                      </h3>
                      <p className="text-[10.5px] text-slate-400 leading-relaxed">
                        {t(
                          'هل أنت متأكد من رغبتك في إلغاء هذا النداء الفوري للمشوار الداخلي؟ سيتم تحرير السائق المتجه إليك فوراً ولا يمكن التراجع عن ذلك.',
                          'Are you sure you want to cancel this instant pick-up request? This will immediately free up the captain heading towards you.'
                        )}
                      </p>
                    </div>
                    
                    <div className="w-full bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl text-[9px] text-slate-400 leading-relaxed text-right">
                      ⚠️ {t('تنبيه الأمان والسلامة: يرجى التأكد من أنك في مكان آمن تماماً وتجنب الإلغاءات الخاطئة أثناء التحرك أو تصفح التطبيق الحالي.', 'Safety Warning: Please ensure you are in a safe location and avoid accidental cancellations while moving or browsing.')}
                    </div>

                    <div className="flex gap-2.5 w-full mt-1">
                      <button
                        type="button"
                        onClick={() => setConfirmCancel(false)}
                        className="flex-1 bg-slate-900 hover:bg-[#1a2130] border border-slate-800 text-slate-350 hover:text-slate-200 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        {t('الرجوع للمشوار', 'Back to Ride')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          cancelIntraCityRide(activeLocalRide.id, 'passenger');
                          setConfirmCancel(false);
                        }}
                        className="flex-1 bg-gradient-to-l from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white py-2 rounded-xl text-xs font-black shadow-lg shadow-red-900/20 transition cursor-pointer"
                      >
                        {t('تأكيد الإلغاء 🚨', 'Confirm Cancel 🚨')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      ) : (
        
        /* 2. INSTANT HAIL REQUEST FORM */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 flex-row-reverse">
            <div>
              <h3 className="text-sm font-black text-slate-100 flex items-center justify-end gap-1.5">
                <span>{t('طلب رحلة داخل المدينة', 'Intra-City Ride Request')}</span>
                <MapPin className="w-4.5 h-4.5 text-indigo-400" />
              </h3>
            </div>
            <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-mono font-bold">داخل المدينة</span>
          </div>

          {/* ACTIVE INTERCITY RIDE NOTIFICATION BANNER */}
          {(activeIntercityRide || activeIntercityRequest) && (
            <div className="p-3 bg-gradient-to-r from-amber-950/80 to-indigo-950/80 border-2 border-amber-500/50 rounded-2xl flex flex-col gap-2 text-right animate-fadeIn shadow-lg font-sans">
              <div className="flex justify-between items-center flex-row-reverse">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 flex-row-reverse">
                  <Car className="w-4 h-4 text-amber-400" />
                  <span>🚗 لديك رحلة سفر نشطة حالياً بين المحافظات (#{((activeIntercityRide?.id || activeIntercityRequest?.id) || '').slice(-6)})</span>
                </span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] px-2 py-0.5 rounded-full font-bold">
                  {activeIntercityRide ? (activeIntercityRide.status === 'accepted' ? 'تم القبول ✅' : 'قيد الحركة 🚗') : 'قيد الانتظار ⏳'}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                مسار الرحلة: <strong>{activeIntercityRide ? `${activeIntercityRide.fromArea} ➔ ${activeIntercityRide.toArea}` : `${activeIntercityRequest?.fromArea} ➔ ${activeIntercityRequest?.toArea}`}</strong>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('adam_switch_tab', { detail: 'intercity' }));
                  }}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black py-2 px-3 rounded-xl text-[10.5px] transition cursor-pointer flex items-center justify-center gap-1 shadow"
                >
                  <span>👁️ الانتقال وتتبع رحلة السفر النشطة</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = forceResetPassengerActiveRide(loggedPassenger.id);
                    setSuccessMsg(res.msg);
                    setErrMsg('');
                    setTimeout(() => setSuccessMsg(''), 4000);
                  }}
                  className="bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold py-2 px-3 rounded-xl text-[10.5px] transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>🔄 إلغاء الرحلة للبدء من جديد</span>
                </button>
              </div>
            </div>
          )}

          {errMsg && (
            <div className="p-3 bg-red-950/60 border-2 border-red-600/60 rounded-2xl text-xs text-red-200 text-right font-sans flex flex-col gap-2 animate-fadeIn shadow-lg">
              <div className="flex items-start gap-2 flex-row-reverse">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="font-bold">{errMsg}</span>
              </div>
              {errMsg.includes('نشطة') && (
                <div className="flex items-center gap-2 mt-1 border-t border-red-800/60 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const res = forceResetPassengerActiveRide(loggedPassenger.id);
                      setSuccessMsg(res.msg);
                      setErrMsg('');
                      setTimeout(() => setSuccessMsg(''), 5000);
                    }}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-2 px-3 rounded-xl text-[11px] transition cursor-pointer flex items-center justify-center gap-1 shadow"
                  >
                    <span>🔄 تصفير وإلغاء الرحلة العالقة فوراً للبدء بطلب جديد</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 text-right font-sans">
              {successMsg}
            </div>
          )}

          {/* TOP SERVICE SELECTOR TABS: CITY TAXI / AIRPORT EXPRESS VIP / MULTI-STOP */}
          <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl flex items-center gap-1.5 shadow-md">
            <button
              type="button"
              onClick={() => {
                setRideCategoryTab('standard');
                setIsAirportTrip(false);
              }}
              className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                rideCategoryTab === 'standard' && !isAirportTrip
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold scale-[1.02]'
                  : 'bg-slate-950/60 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800/80'
              }`}
            >
              <span className="text-base">🚕</span>
              <span>{t('مشوار مدينة عادي', 'City Taxi')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRideCategoryTab('airport');
                setIsAirportTrip(true);
                if (airportTripDirection === 'to_airport') {
                  setToDist('الجيزة');
                  setToVillage('مطار الملكة علياء الدولي (QAIA)');
                  setToStreet('صالة المغادرون - مطار الملكة علياء');
                } else {
                  setFromGov('عمان (Amman)');
                  setFromDist('الجيزة');
                  setFromVillage('مطار الملكة علياء الدولي (QAIA)');
                  setFromStreet('صالة القادمون - مطار الملكة علياء');
                }
                setSuccessMsg('✈️ تم تفعيل طلب مشوار المطار السريع VIP بتسعيرة ثابتة');
                setTimeout(() => setSuccessMsg(''), 4000);
              }}
              className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                isAirportTrip
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 font-extrabold scale-[1.02] border border-indigo-400'
                  : 'bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/60 border border-indigo-500/30'
              }`}
            >
              <span className="text-base">✈️</span>
              <span>{t('مشوار المطار VIP', 'Airport VIP')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRideCategoryTab('multistop');
                if (waypoints.length === 0) {
                  handleAddWaypoint();
                }
              }}
              className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                rideCategoryTab === 'multistop' || waypoints.length > 0
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 font-extrabold scale-[1.02] border border-purple-400'
                  : 'bg-slate-950/60 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800/80'
              }`}
            >
              <span className="text-base">🛑</span>
              <span>{t('مشوار نقاط توقف', 'Multi-Stop')}</span>
            </button>
          </div>

          {/* DEDICATED AIRPORT EXPRESS VIP PANEL */}
          {isAirportTrip && (
            <div className="bg-gradient-to-br from-slate-950 via-indigo-950/80 to-purple-950/80 border-2 border-indigo-500/50 p-4 rounded-2xl flex flex-col gap-3 shadow-xl relative overflow-hidden text-right font-sans animate-fadeIn">
              <div className="flex justify-between items-center flex-row-reverse border-b border-indigo-500/30 pb-2">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <span className="text-2xl">✈️</span>
                  <div>
                    <span className="text-sm font-black text-indigo-100 block">
                      {t('طلب مشوار مطار الملكة علياء الدولي (QAIA VIP)', 'Queen Alia Airport Express VIP')}
                    </span>
                    <span className="text-[10px] text-indigo-300 block">
                      {t(`تسعيرة ثابتة ${settings?.airportRidePrice ?? 25.0} د.أ • سيارات حديثة ${settings?.airportMinCarModel ?? 2021}+ حصراً`, `Fixed Fare ${settings?.airportRidePrice ?? 25.0} JD • Modern Cars ${settings?.airportMinCarModel ?? 2021}+`)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsAirportTrip(false);
                    setRideCategoryTab('standard');
                  }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-300 border border-slate-750 cursor-pointer transition"
                >
                  ✕ {t('إلغاء المطار', 'Cancel')}
                </button>
              </div>

              {/* Trip Direction Switcher */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-bold text-indigo-200 text-right">
                  {t('اتجاه مشوار المطار:', 'Airport Trip Direction:')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAirportTripDirection('to_airport');
                      setToDist('الجيزة');
                      setToVillage('مطار الملكة علياء الدولي (QAIA)');
                      setToStreet('صالة المغادرون - مطار الملكة علياء');
                    }}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-black border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      airportTripDirection === 'to_airport'
                        ? 'bg-indigo-600 text-white border-indigo-300 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-900'
                    }`}
                  >
                    <span>🛫 {t('توصيل إلى المطار (مغادرون)', 'To Airport (Departures)')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAirportTripDirection('from_airport');
                      setFromGov('عمان (Amman)');
                      setFromDist('الجيزة');
                      setFromVillage('مطار الملكة علياء الدولي (QAIA)');
                      setFromStreet('صالة القادمون - مطار الملكة علياء');
                    }}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-black border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      airportTripDirection === 'from_airport'
                        ? 'bg-indigo-600 text-white border-indigo-300 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-900'
                    }`}
                  >
                    <span>🛬 {t('استقبال من المطار (قادمون)', 'From Airport (Arrivals)')}</span>
                  </button>
                </div>
              </div>

              {/* Airport Ride Details: Flight Number & Luggage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-indigo-950/60 p-3 rounded-xl border border-indigo-500/30 text-right">
                <div className="flex flex-col gap-1">
                  <label className="text-[9.5px] text-slate-300 font-bold">
                    {t('رقم الرحلة الجوية / كود الطيران (اختياري):', 'Flight Number / Code (Optional):')}
                  </label>
                  <input
                    type="text"
                    value={flightNumberInput}
                    onChange={(e) => setFlightNumberInput(e.target.value)}
                    placeholder="مثال: RJ-101 أو EK-902"
                    className="bg-slate-950 border border-indigo-500/40 focus:border-indigo-300 rounded-lg p-2 text-slate-100 text-xs outline-none text-right font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9.5px] text-slate-300 font-bold">
                    {t('عدد حقائب السفر الكبيرة:', 'Luggage Bags Count:')}
                  </label>
                  <select
                    value={luggageCountInput}
                    onChange={(e) => setLuggageCountInput(Number(e.target.value))}
                    className="bg-slate-950 border border-indigo-500/40 focus:border-indigo-300 rounded-lg p-2 text-slate-100 text-xs outline-none text-right font-bold cursor-pointer"
                  >
                    <option value={1}>🧳 حقيبة واحدة (1)</option>
                    <option value={2}>🧳 حقيبتان (2)</option>
                    <option value={3}>🧳 3 حقائب كبيرة</option>
                    <option value={4}>🧳 4 حقائب أو أكثر (سيارة واسعة)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-950/90 p-2.5 rounded-xl border border-indigo-500/30 flex-row-reverse text-[10px]">
                <span className="text-slate-300 font-medium">
                  {t('💼 يشمل المساعدة بنقل الأمتعة وانتظار مجاني في صالة المطار', 'Includes luggage handling & free wait time at terminal')}
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-mono font-black text-xs">
                  {settings?.airportRidePrice ?? 25.0} د.أ ثابت
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleRequestRide} className="flex flex-col gap-3 font-sans mt-1">

            {/* PHYSICAL LOCATION INTEGRITY ADVISORY (تنبيه الموقع الفعلي والالتزام بالمدينة) */}
            {detectedPassengerGov && fromGov && detectedPassengerGov !== fromGov && (
              <div className="bg-amber-950/80 border border-amber-500/60 rounded-2xl p-3.5 flex flex-col gap-2 text-right shadow-lg">
                <div className="flex items-center justify-between flex-row-reverse">
                  <span className="text-amber-300 font-bold text-xs flex items-center gap-1.5 flex-row-reverse">
                    <span>⚠️ تنبيه القيود الجغرافية للمدينة</span>
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-200 border border-amber-500/30 px-2 py-0.5 rounded-md font-mono font-bold">
                    موقعك الفعلي: {detectedPassengerGov.split(' ')[0]}
                  </span>
                </div>
                <p className="text-xs text-amber-100 leading-relaxed font-sans">
                  موقعك الفعلي المرصود هو في محافظة <strong>({detectedPassengerGov.split(' ')[0]})</strong>، بينما حددت طلب رحلة داخلية في <strong>({fromGov.split(' ')[0]})</strong>. خدمة "داخل المدينة" مخصصة للتنقل الداخلي داخل مدينتك الفعلية فقط ولا يجوز لراكب في مدينة أن يطلب داخل مدينة أخرى.
                </p>
                <div className="flex flex-wrap items-center gap-2 justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleGovChange(detectedPassengerGov);
                    }}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition shadow cursor-pointer"
                  >
                    🎯 التبديل فوراً إلى مدينتي الفعلية ({detectedPassengerGov.split(' ')[0]})
                  </button>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold px-3 py-1.5 rounded-lg transition border border-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>🔄 إعادة رصد الـ GPS</span>
                  </button>
                </div>
              </div>
            )}

             {/* 1. STARTING POINT SELECTION (مكان الإقلال) */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2.5">
              <div className="flex justify-between items-center flex-row-reverse mb-0.5">
                <span className="text-[9.5px] font-bold text-slate-350 text-right uppercase tracking-wider block">
                  1. {t('مكان الإقلال (من مكانك بالزبط ...)', 'Pickup Location (Exact Spot...)')}
                </span>
                
                <div className="flex items-center gap-1">
                  {/* Map Pinpoint button for Pickup */}
                  <button
                    type="button"
                    onClick={() => {
                      setMapClickMode('pickup');
                      setSuccessMsg(t('🗺️ انقر الآن على الرادار لتثبيت نقطة الانطلاق بدقة', '🗺️ Tap radar now to pin pickup'));
                      setTimeout(() => setSuccessMsg(''), 4000);
                    }}
                    className={`text-[9.5px] font-bold px-2 py-1 rounded-lg transition border cursor-pointer ${
                      mapClickMode === 'pickup'
                        ? 'bg-blue-600 text-white border-blue-400'
                        : 'bg-blue-950/60 text-blue-300 border-blue-500/30 hover:bg-blue-900/60'
                    }`}
                  >
                    <span>🗺️ {t('تحديد على الخريطة', 'Pin on Map')}</span>
                  </button>

                  {/* High Accuracy Geolocation detector */}
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    className="text-[9.5px] text-emerald-400 hover:text-emerald-300 font-black bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 rounded-lg py-1 px-2.5 transition duration-150 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    id="btn-detect-my-location-local"
                  >
                    <span className={detectingLocation ? "animate-spin inline-block w-2.5 h-2.5 border-2 border-emerald-400 border-t-transparent rounded-full" : "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"}></span>
                    <span>{detectingLocation ? 'جاري الرصد...' : '🎯 مكاني الحالي بالزبط'}</span>
                  </button>
                </div>
              </div>

              {detectionSuccess && (
                <div className="p-2 px-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 text-right font-bold flex flex-col gap-0.5 leading-snug animate-fadeIn">
                  {detectionSuccess.split('\n').map((line, idx) => (
                    <div key={idx} className={idx === 0 ? "text-emerald-300 font-extrabold flex items-center justify-start flex-row-reverse gap-1" : "text-emerald-400 font-semibold text-[11px] pr-2"}>
                      {line}
                    </div>
                  ))}
                </div>
              )}

              {pickupGeoCoords && (
                <div className="flex items-center justify-between bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-[9px] text-slate-400 font-mono flex-row-reverse">
                  <span className="text-emerald-400 font-bold">📍 GPS Fix Active</span>
                  <span>Lat: {pickupGeoCoords.lat.toFixed(5)}, Lng: {pickupGeoCoords.lng.toFixed(5)}</span>
                </div>
              )}

              {/* Responsive Auto-Flow Grid for Pickup Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {/* Governorate Select */}
                <div className="flex flex-col gap-1 text-right">
                  <label className="text-[9px] text-slate-400">{t('المحافظة', 'Governorate')}</label>
                  <select
                    required
                    value={fromGov}
                    onFocus={() => setShowAutofillSuggestions(true)}
                    onChange={(e) => handleGovChange(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 text-right outline-none cursor-pointer focus:border-indigo-500 w-full"
                  >
                    <option value="">-- {t('اختر المحافظة', 'Choose Governorate')} --</option>
                    {locationsList.map((loc, i) => (
                      <option key={i} value={loc.governorate}>{loc.governorate}</option>
                    ))}
                  </select>
                </div>

                {/* District Select if Governorate is chosen */}
                {fromGov && (
                  <div className="flex flex-col gap-1 text-right animate-fadeIn">
                    <label className="text-[9px] text-slate-400">{t('اللواء / المنطقة الإدارية', 'District')}</label>
                    <select
                      required
                      value={fromDist}
                      onFocus={() => setShowAutofillSuggestions(true)}
                      onChange={(e) => {
                        const newDist = e.target.value;
                        setFromDist(newDist);
                        const distObj = chosenGovObj?.districts?.find(d => d.name === newDist);
                        const firstVillage = distObj?.villages?.[0] || '';
                        setFromVillage(firstVillage);
                        const streets = getStreetsForVillageHierarchy(fromGov, newDist, firstVillage, locationsList);
                        setFromStreet(streets[0] || '');
                        setFromStreetCustom(streets[0] || '');
                        setIsAutoPickup(false);
                        setDetectionSuccess(null);
                      }}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 text-right outline-none cursor-pointer focus:border-indigo-500 w-full"
                    >
                      <option value="">-- {t('اختر اللواء', 'Choose District')} --</option>
                      {(chosenGovObj?.districts || []).map((dist, i) => (
                        <option key={i} value={dist.name}>{dist.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Village/Neighborhood Select if District is chosen */}
                {fromDist && (
                  <div className="flex flex-col gap-1 text-right animate-fadeIn">
                    <label className="text-[9px] text-slate-400">{t('الحي / القرية / المجمع الدائري', 'Neighborhood / Village')}</label>
                    <select
                      required
                      value={fromVillage}
                      onFocus={() => setShowAutofillSuggestions(true)}
                      onChange={(e) => {
                        const newVillage = e.target.value;
                        setFromVillage(newVillage);
                        const streets = getStreetsForVillageHierarchy(fromGov, fromDist, newVillage, locationsList);
                        setFromStreet(streets[0] || '');
                        setFromStreetCustom(streets[0] || '');
                        setIsAutoPickup(false);
                        setDetectionSuccess(null);
                      }}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 text-right outline-none cursor-pointer focus:border-indigo-500 w-full"
                    >
                      <option value="">-- {t('اختر الحي / المنطقة', 'Choose Neighborhood')} --</option>
                      {(fromDistrictObj?.villages || []).map((vil, i) => (
                        <option key={i} value={vil}>{vil}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Pickup Street & Landmark Select (الشارع أو المعلم بالتفصيل لنقطة الإقلال) */}
              {fromVillage && (
                <div className="flex flex-col gap-1 text-right animate-fadeIn mt-2 pt-2 border-t border-slate-800/80">
                  <label className="text-[9px] text-emerald-400 font-bold block">{t('📍 اسم الشارع / معلم الإقلال التابع للحي المختار', 'Pickup Street Name (Belonging to selected village)')}</label>
                  
                  {/* Select suggestion */}
                  <select
                    value={fromStreet}
                    onFocus={() => setShowAutofillSuggestions(true)}
                    onChange={(e) => {
                      setFromStreet(e.target.value);
                      setFromStreetCustom('');
                    }}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 text-right outline-none cursor-pointer focus:border-emerald-500 mb-2"
                  >
                    <option value="">-- {t('اختر الشارع من شوارع هذا الحي أو اكتبه أدناه', 'Select street from this neighborhood or type custom')} --</option>
                    {(availablePickupStreets.length > 0 ? availablePickupStreets : [
                      `شارع ${fromVillage} الرئيسي`,
                      `طريق ${fromVillage} العام`,
                      `دوار ${fromVillage}`
                    ]).map((st, idx) => (
                      <option key={idx} value={st}>{st}</option>
                    ))}
                  </select>

                  {/* Manual input */}
                  <input
                    type="text"
                    placeholder={t('✍️ أو اكتب اسم الشارع / المعلم المخصص لموقع انطلاقك بدقة', 'Or write a specific pickup street name, building or custom landmark')}
                    value={fromStreetCustom}
                    onFocus={() => setShowAutofillSuggestions(true)}
                    onChange={(e) => {
                      setFromStreetCustom(e.target.value);
                      if (e.target.value) {
                        setFromStreet(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2 text-xs text-slate-200 text-right outline-none font-sans"
                  />
                </div>
              )}

              {/* Exact Doorstep / Building Pickup Note */}
              {fromGov && (
                <div className="flex flex-col gap-1 text-right animate-fadeIn mt-0.5">
                  <label className="text-[9px] text-emerald-400 font-bold flex items-center justify-end gap-1">
                    <span>{t('📍 علامة مميزة لموقع الإقلال من مكانك بالزبط (أمام البوابة، بناية رقم...)', '📍 Exact Spot Note for Captain (Building #, Entrance, Landmark)')}</span>
                  </label>
                  <input
                    type="text"
                    value={pickupExactNote}
                    onChange={(e) => setPickupExactNote(e.target.value)}
                    placeholder={t('مثال: أمام البوابة الرئيسية لمبنى 14، بجانب سوبرماركت الفردوس...', 'e.g. In front of Main Gate, Next to Supermarket...')}
                    className="bg-slate-950 border border-emerald-500/30 focus:border-emerald-500 rounded-lg p-2 text-xs text-slate-100 text-right outline-none font-sans"
                  />
                </div>
              )}
            </div>

            {/* MULTI-STOP WAYPOINTS SECTION (نقاط التوقف خلال المشوار) - ALWAYS AVAILABLE */}
            <div className="bg-slate-900 border border-indigo-500/30 p-3.5 rounded-2xl flex flex-col gap-3 font-sans shadow-md">
              <div className="flex justify-between items-center flex-row-reverse">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <span className="text-base">🛑</span>
                  <span className="text-xs font-bold text-slate-200 text-right">
                    {t('نقاط التوقف خلال المشوار (Stops & Waypoints)', 'Intermediate Stops (Waypoints)')}
                  </span>
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>{waypoints.length} {t('نقاط توقف محددة', 'stops added')}</span>
                </span>
              </div>

              <p className="text-[10px] text-slate-400 text-right leading-relaxed">
                {t('يمكنك إدخال محطات توقف وسيطة في طريقك (صراف آلي، صيدلية، كافيه، بقالة، مول). يمكنك كتابة اسم المكان بدقة أو اختياره من القوائم السريعة.', 'Add stops along the way. Enter the exact stop name or choose from quick shortcuts.')}
              </p>

              {/* Waypoints List */}
              {waypoints.length > 0 && (
                <div className="flex flex-col gap-3 my-1">
                  {waypoints.map((wp, index) => {
                    const isTargetingThis = activeTargetWaypointId === wp.id;
                    const isDetectingGps = detectingWaypointId === wp.id;

                    const curGovObj = (settings?.locations || []).find(l => l.governorate.includes(fromGov.split(' ')[0])) || settings?.locations?.[0];
                    const distList = curGovObj?.districts || [];

                    return (
                    <div 
                      key={wp.id} 
                      className={`bg-slate-950 p-3.5 rounded-2xl border transition-all duration-200 animate-fadeIn flex flex-col gap-3 ${
                        isTargetingThis 
                          ? 'border-purple-500 ring-2 ring-purple-500/40 shadow-xl shadow-purple-950/50' 
                          : 'border-indigo-500/40 hover:border-indigo-500/70 shadow-sm'
                      }`}
                    >
                      {/* Waypoint Header & Reorder Controls */}
                      <div className="flex justify-between items-center flex-row-reverse text-xs border-b border-slate-850 pb-2">
                        <span className="font-extrabold text-indigo-300 flex items-center gap-1.5 flex-row-reverse">
                          <span className="bg-indigo-600 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black shadow">
                            {index + 1}
                          </span>
                          <span className="text-xs font-black">{t(`نقطة توقف ${index + 1}`, `Stop ${index + 1}`)}</span>
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveWaypoint(index, 'up')}
                            disabled={index === 0}
                            className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer text-xs"
                            title={t('تحريك للأعلى', 'Move Up')}
                          >
                            ⬆️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveWaypoint(index, 'down')}
                            disabled={index === waypoints.length - 1}
                            className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer text-xs"
                            title={t('تحريك للأسفل', 'Move Down')}
                          >
                            ⬇️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveWaypoint(wp.id)}
                            className="px-2.5 py-0.5 rounded bg-rose-950/70 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold cursor-pointer transition"
                            title={t('حذف النقطة', 'Delete Stop')}
                          >
                            ✕ {t('حذف', 'Delete')}
                          </button>
                        </div>
                      </div>

                      {/* Waypoint Direct Text Input Field */}
                      <div className="flex flex-col gap-1.5 text-right">
                        <label className="text-[10px] font-bold text-amber-300 flex items-center justify-end gap-1">
                          <span>✍️ {t('اكتب اسم أو عنوان أو معلم نقطة التوقف بدقة:', 'Type exact stop name / landmark / address:')}</span>
                        </label>
                        <input
                          type="text"
                          value={wp.name}
                          onChange={(e) => handleUpdateWaypoint(wp.id, e.target.value)}
                          placeholder={t('مثال: صراف بنك الإسكان شارع الجامعة، صيدلية روحي، كافيه ديميتري...', 'e.g. Arab Bank ATM, Pharmacy, Cafe, Supermarket...')}
                          className="bg-slate-900 border-2 border-indigo-500/50 focus:border-indigo-400 rounded-xl p-3 text-xs text-slate-100 text-right outline-none font-sans shadow-inner"
                          autoFocus={!wp.name}
                        />
                      </div>

                      {/* Quick Category Preset Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 font-bold ml-1">{t('إدراج سريع:', 'Quick Insert:')}</span>
                        <button
                          type="button"
                          onClick={() => handleSetWaypointCategoryPreset(wp.id, 'atm')}
                          className="bg-slate-950 hover:bg-indigo-950 text-slate-200 border border-slate-800 hover:border-indigo-500/50 px-2.5 py-1 rounded-lg transition cursor-pointer font-bold"
                        >
                          🏧 صراف آلي
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetWaypointCategoryPreset(wp.id, 'pharmacy')}
                          className="bg-slate-950 hover:bg-indigo-950 text-slate-200 border border-slate-800 hover:border-indigo-500/50 px-2.5 py-1 rounded-lg transition cursor-pointer font-bold"
                        >
                          💊 صيدلية
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetWaypointCategoryPreset(wp.id, 'cafe')}
                          className="bg-slate-950 hover:bg-indigo-950 text-slate-200 border border-slate-800 hover:border-indigo-500/50 px-2.5 py-1 rounded-lg transition cursor-pointer font-bold"
                        >
                          ☕ كافيه
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetWaypointCategoryPreset(wp.id, 'supermarket')}
                          className="bg-slate-950 hover:bg-indigo-950 text-slate-200 border border-slate-800 hover:border-indigo-500/50 px-2.5 py-1 rounded-lg transition cursor-pointer font-bold"
                        >
                          🛒 بقالة
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetWaypointCategoryPreset(wp.id, 'gas')}
                          className="bg-slate-950 hover:bg-indigo-950 text-slate-200 border border-slate-800 hover:border-indigo-500/50 px-2.5 py-1 rounded-lg transition cursor-pointer font-bold"
                        >
                          ⛽ محطة وقود
                        </button>
                      </div>

                      {/* Dropdown Pickers: Famous Landmarks & Districts */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-right">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-amber-300 font-bold">🏢 معالم ومولات شهيرة:</label>
                          <select
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              const govShort = fromGov.split(' ')[0] || 'عمان';
                              const newName = `${govShort} - ${val}`;
                              handleUpdateWaypoint(wp.id, newName);
                            }}
                            className="bg-slate-950 border border-amber-500/40 focus:border-amber-400 rounded-lg p-2 text-[10.5px] text-amber-200 outline-none text-right font-medium"
                          >
                            <option value="">-- اختر معلماً شهيراً --</option>
                            <option value="مكة مول (Mecca Mall)">🏢 مكة مول (Mecca Mall)</option>
                            <option value="العبدلي مول (Abdali Mall)">🏢 العبدلي مول (Abdali Mall)</option>
                            <option value="سيتي مول (City Mall)">🏢 سيتي مول (City Mall)</option>
                            <option value="تاج مول (Taj Mall)">🏢 تاج مول (Taj Mall)</option>
                            <option value="الجامعة الأردنية (Jordan University)">🎓 الجامعة الأردنية</option>
                            <option value="جامعة العلوم والتكنولوجيا (JUST)">🎓 جامعة العلوم والتكنولوجيا</option>
                            <option value="الجامعة الهاشمية (Hashemite University)">🎓 الجامعة الهاشمية</option>
                            <option value="جامعة اليرموك (Yarmouk University)">🎓 جامعة اليرموك</option>
                            <option value="مستشفى الأردن (Jordan Hospital)">🏥 مستشفى الأردن</option>
                            <option value="مستشفى الاستقلال (Istiklal Hospital)">🏥 مستشفى الاستقلال</option>
                            <option value="المدينة الطبية (King Hussein Medical)">🏥 المدينة الطبية</option>
                            <option value="مطار الملكة علياء الدولي (QAIA)">✈️ مطار الملكة علياء الدولي</option>
                            <option value="دوار الداخلية (Interior Circle)">⭕ دوار الداخلية</option>
                            <option value="الدوار السابع (7th Circle)">⭕ الدوار السابع</option>
                            <option value="محطة صويلح للباص السريع (Sweileh BRT)">🚌 محطة صويلح للباص السريع</option>
                            <option value="بوليفارد العبدلي (The Boulevard)">🌆 بوليفارد العبدلي</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-300 font-bold">📍 اللواء / المنطقة:</label>
                          <select
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              const govShort = fromGov.split(' ')[0] || 'عمان';
                              const newName = `${govShort} - ${val} - (نقطة توقف)`;
                              handleUpdateWaypoint(wp.id, newName);
                            }}
                            className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-[10.5px] text-slate-200 outline-none text-right"
                          >
                            <option value="">-- اختر المنطقة / اللواء --</option>
                            {distList.map(d => (
                              <option key={d.name} value={d.name}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Location Selection Tools (GPS & Map Radar Pin) */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={isDetectingGps}
                          onClick={() => handleSetWaypointGpsLocation(wp.id)}
                          className="bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-[10px] font-black py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                          title={t('تحديد لوكيشن النقطة من موقعي الحالي بالـ GPS', 'Set stop to my GPS location')}
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          <span>{isDetectingGps ? t('جاري الرصد...', 'Detecting...') : t('🎯 موقعي الحالي GPS', 'My GPS Location')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (isTargetingThis) {
                              setActiveTargetWaypointId(null);
                            } else {
                              setActiveTargetWaypointId(wp.id);
                              setMapClickMode('waypoint');
                            }
                          }}
                          className={`border text-[10px] font-black py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                            isTargetingThis 
                              ? 'bg-purple-600 text-white border-purple-300 animate-pulse' 
                              : 'bg-purple-950/80 hover:bg-purple-900 border-purple-500/40 text-purple-300'
                          }`}
                          title={t('انقر على الخريطة لتثبيت موقع هذه النقطة', 'Click map to pin stop')}
                        >
                          <span>🗺️ {isTargetingThis ? t('انقر على الرادار الآن...', 'Click map now...') : t('تحديد على الخريطة', 'Pin on Map')}</span>
                        </button>
                      </div>

                      {/* Wait time & Stop fee tag */}
                      <div className="flex justify-between items-center text-[10px] text-slate-300 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex-row-reverse">
                        <div className="flex items-center gap-1.5 flex-row-reverse">
                          <span className="font-bold">{t('مدة الانتظار المقدرة:', 'Estimated Wait:')}</span>
                          <select
                            value={wp.estimatedWaitMin || 4}
                            onChange={(e) => handleUpdateWaypoint(wp.id, wp.name, parseInt(e.target.value))}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-100 text-right outline-none text-[10px] font-bold"
                          >
                            <option value={2}>⏱️ دقيقتان (2)</option>
                            <option value={4}>⏱️ 4 دقائق</option>
                            <option value={7}>⏱️ 7 دقائق</option>
                            <option value={10}>⏱️ 10 دقائق</option>
                          </select>
                        </div>

                        <span className="text-emerald-400 font-mono font-black bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-xs">
                          +{wp.stopFee.toFixed(2)} {t('د.أ رسوم توقف', 'JD Stop Fee')}
                        </span>
                      </div>
                    </div>
                  );
                  })}

                  {/* AI Route Optimizer Button if 2+ stops */}
                  {waypoints.length >= 2 && (
                    <button
                      type="button"
                      onClick={handleAiOptimizeWaypoints}
                      disabled={aiOptimizing}
                      className="bg-gradient-to-r from-indigo-900/80 to-purple-900/80 hover:from-indigo-800 hover:to-purple-800 border border-indigo-500/50 text-indigo-200 text-xs font-bold py-2.5 px-3 rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Sparkles className={`w-4 h-4 text-indigo-300 ${aiOptimizing ? 'animate-spin' : 'animate-pulse'}`} />
                      <span>{aiOptimizing ? t('جاري تحسين المسار بالذكاء الاصطناعي...', 'AI Optimizing Route...') : t('✨ ترتيب المحطات بالذكاء الاصطناعي (أقصر مسافة وأقل تكلفة)', '✨ AI Route Optimizer')}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Add Waypoint Button */}
              {waypoints.length < 4 && (
                <button
                  type="button"
                  onClick={() => handleAddWaypoint()}
                  className="bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 hover:text-white border-2 border-indigo-500/40 border-dashed rounded-xl py-3 px-4 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <span className="text-lg font-black bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center">+</span>
                  <span>{t('إضافة نقطة توقف جديدة خلال المشوار (حتى 4 محطات)', 'Add New Stop (Up to 4 stops)')}</span>
                </button>
              )}
            </div>

            {/* 2. DESTINATION POINT SELECTION (مكان التنزيل) */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2.5">
              <div className="flex justify-between items-center flex-row-reverse mb-0.5">
                <span className="text-[9.5px] font-bold text-slate-350 text-right uppercase tracking-wider block select-none">
                  2. {t('مكان التنزيل (إلى ...)', 'Dropoff Location (To...)')}
                </span>
                <span className="text-[8.5px] text-indigo-400 font-sans font-bold flex items-center gap-1">
                  <span>🔒 {t('محصور داخل نفس المحافظة', 'Same Governorate Bound')}</span>
                </span>
              </div>

              {/* Responsive Auto-Flow Grid for Dropoff Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {/* Display read-only Governorate bound */}
                <div className="flex flex-col gap-1 text-right">
                  <label className="text-[9px] text-slate-400">{t('المحافظة (مغلقة للتنقل الداخلي)', 'Governorate (Locked)')}</label>
                  <div className="bg-slate-950/60 border border-slate-850 px-3 py-2 rounded-lg text-xs text-slate-400 font-black block text-right select-none w-full">
                    📍 {fromGov || t('بانتظار تحديد مكان الإقلاع', 'Waiting for pickup governorate...')}
                  </div>
                </div>

                {/* District Select for dropoff */}
                {fromGov && (
                  <div className="flex flex-col gap-1 text-right animate-fadeIn">
                    <label className="text-[9px] text-slate-400">{t('اللواء / المنطقة الإدارية', 'Destination District')}</label>
                    <select
                      required
                      value={toDist}
                      onFocus={() => setShowAutofillSuggestions(true)}
                      onChange={(e) => {
                        const newDist = e.target.value;
                        setToDist(newDist);
                        const distObj = chosenGovObj?.districts?.find(d => d.name === newDist);
                        const firstVillage = distObj?.villages?.[0] || '';
                        setToVillage(firstVillage);
                        const streets = getStreetsForVillageHierarchy(fromGov, newDist, firstVillage, locationsList);
                        setToStreet(streets[0] || '');
                        setToStreetCustom(streets[0] || '');
                      }}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 text-right outline-none cursor-pointer focus:border-indigo-500 w-full"
                    >
                      <option value="">-- {t('اختر لواء الوصول', 'Choose Destination District')} --</option>
                      {(chosenGovObj?.districts || []).map((dist, i) => (
                        <option key={i} value={dist.name}>{dist.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Village/Neighborhood select for dropoff */}
                {toDist && (
                  <div className="flex flex-col gap-1 text-right animate-fadeIn">
                    <label className="text-[9px] text-slate-400">{t('الحي / القرية / المجمع الدائري', 'Destination Neighborhood')}</label>
                    <select
                      required
                      value={toVillage}
                      onFocus={() => setShowAutofillSuggestions(true)}
                      onChange={(e) => {
                        const newVillage = e.target.value;
                        setToVillage(newVillage);
                        const streets = getStreetsForVillageHierarchy(fromGov, toDist, newVillage, locationsList);
                        setToStreet(streets[0] || '');
                        setToStreetCustom(streets[0] || '');
                      }}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 text-right outline-none cursor-pointer focus:border-indigo-500 w-full"
                    >
                      <option value="">-- {t('اختر حي الوصول', 'Choose Destination Neighborhood')} --</option>
                      {(toDistrictObj?.villages || []).map((vil, i) => (
                        <option key={i} value={vil}>{vil}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Dropoff Street select (الشارع بالتفصيل) */}
              {toVillage && (
                <div className="flex flex-col gap-1 text-right animate-fadeIn mt-2 pt-2 border-t border-slate-800/80">
                  <label className="text-[9px] text-indigo-400 font-bold block">{t('📍 اسم الشارع / معلم التنزيل التابع للحي المختار', 'Street Name (Belonging to selected village)')}</label>
                  
                  {/* Select suggestion */}
                  <select
                    value={toStreet}
                    onFocus={() => setShowAutofillSuggestions(true)}
                    onChange={(e) => {
                      setToStreet(e.target.value);
                      setToStreetCustom('');
                    }}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 text-right outline-none cursor-pointer focus:border-indigo-500 mb-2"
                  >
                    <option value="">-- {t('اختر الشارع من شوارع حي الوصول أو اكتبه أدناه', 'Select street from this neighborhood or type custom')} --</option>
                    {(availableDropoffStreets.length > 0 ? availableDropoffStreets : [
                      `شارع ${toVillage} الرئيسي`,
                      `طريق ${toVillage} العام`,
                      `دوار ${toVillage}`
                    ]).map((st, idx) => (
                      <option key={idx} value={st}>{st}</option>
                    ))}
                  </select>

                  {/* Manual input */}
                  <input
                    type="text"
                    placeholder={t('✍️ أو اكتب اسم مجمع، شارع أو معلم مخصص لمكان التنزيل', 'Or write a specific street name, building or custom landmark')}
                    value={toStreetCustom}
                    onFocus={() => setShowAutofillSuggestions(true)}
                    onChange={(e) => {
                      setToStreetCustom(e.target.value);
                      if (e.target.value) {
                        setToStreet(e.target.value); // Sync toStreet with typed custom value
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-xs text-slate-200 text-right outline-none font-sans"
                  />
                </div>
              )}
            </div>

            {/* INTERACTIVE GEOGRAPHICAL RADAR HEATMAP (خريطة الأردن الحرارية التفاعلية للتنزيل ونقاط التوقف) */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2.5">
              <div className="flex justify-between items-center flex-row-reverse mb-0.5">
                <span className="text-[9.5px] font-bold text-slate-350 text-right uppercase tracking-wider block">
                  🗺️ {t('الرادار التفاعلي ونقاط التوقف الذكية (انقر على الخريطة لتحديد الموقع)', 'Interactive Radar & Smart Waypoints (Tap map to pin)')}
                </span>
                <span className="text-[8.5px] text-emerald-400 font-mono animate-pulse">📡 {t('مباشر', 'LIVE')}</span>
              </div>

              {/* Map Click Mode Selector */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
                <span className="text-[9px] text-slate-400 font-bold px-1">{t('وضع النقر:', 'Click Mode:')}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMapClickMode('waypoint')}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer flex items-center gap-1 ${
                      mapClickMode === 'waypoint'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-900 text-purple-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>🛑 {t('نقطة توقف ذكية', 'Smart Stop')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapClickMode('dropoff')}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer flex items-center gap-1 ${
                      mapClickMode === 'dropoff'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-900 text-emerald-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>🏁 {t('وجهة التنزيل', 'Dropoff')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapClickMode('pickup')}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer flex items-center gap-1 ${
                      mapClickMode === 'pickup'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-900 text-blue-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>🛫 {t('مكان الانطلاق', 'Pickup')}</span>
                  </button>
                </div>
              </div>

              {/* Category selector when waypoint mode is active */}
              {mapClickMode === 'waypoint' && (
                <div className="flex flex-wrap items-center gap-1 animate-fadeIn bg-purple-950/20 border border-purple-900/40 p-1.5 rounded-xl">
                  <span className="text-[8px] text-purple-300 font-bold">{t('نوع المعلم المطلوب:', 'Stop Category:')}</span>
                  {[
                    { id: 'all', label: t('الكل', 'All') },
                    { id: 'atm', label: t('💳 صراف آلي', '💳 ATM') },
                    { id: 'pharmacy', label: t('💊 صيدلية', '💊 Pharmacy') },
                    { id: 'cafe', label: t('☕ كافيه', '☕ Cafe') },
                    { id: 'bakery', label: t('🥖 مخبز', '🥖 Bakery') },
                    { id: 'gas', label: t('⛽ وقود', '⛽ Gas') }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setAiWaypointCategory(cat.id)}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-semibold transition cursor-pointer ${
                        aiWaypointCategory === cat.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-900 text-slate-300 hover:bg-purple-900/40'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                  {isBuildingAiWaypoint && (
                    <span className="text-[8px] text-amber-300 font-mono animate-pulse mr-auto">
                      ⏳ {t('جاري استدعاء المعلم الجغرافي...', 'Resolving landmark...')}
                    </span>
                  )}
                </div>
              )}

              {/* Graphic container with click support */}
              <div className="relative w-full h-40 bg-[#040712] rounded-xl border border-slate-850 overflow-hidden flex flex-col justify-end">
                <svg 
                  className="absolute inset-0 w-full h-full cursor-crosshair select-none" 
                  viewBox="100 100 200 200"
                  onClick={handleMapClick}
                >
                  <defs>
                    <radialGradient id="heat-glow-red" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(239, 68, 68, 0.35)" />
                      <stop offset="60%" stopColor="rgba(239, 68, 68, 0.08)" />
                      <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                    </radialGradient>
                    <radialGradient id="heat-glow-yellow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(234, 179, 8, 0.25)" />
                      <stop offset="70%" stopColor="rgba(234, 179, 8, 0.05)" />
                      <stop offset="100%" stopColor="rgba(234, 179, 8, 0)" />
                    </radialGradient>
                    <radialGradient id="radar-mesh" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(99, 102, 241, 0.15)" />
                      <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
                    </radialGradient>
                  </defs>

                  {/* Grid meshes */}
                  <path d="M 0 150 L 400 150 M 150 0 L 150 400 M 0 200 L 400 200 M 200 0 L 200 400" stroke="rgba(49, 46, 129, 0.22)" strokeWidth="0.8" />
                  <circle cx="200" cy="200" r="40" fill="none" stroke="rgba(99, 102, 241, 0.08)" strokeWidth="1" />
                  <circle cx="200" cy="200" r="80" fill="none" stroke="rgba(99, 102, 241, 0.04)" strokeWidth="1" />
                  <circle cx="200" cy="200" r="100" fill="url(#radar-mesh)" />

                  {/* Sweeping radar scanner line */}
                  <line 
                    x1="200" y1="200" 
                    x2={200 + 90 * Math.cos((simTick * 3.6 * Math.PI) / 185)} 
                    y2={200 + 90 * Math.sin((simTick * 3.6 * Math.PI) / 185)} 
                    stroke="rgba(99, 102, 241, 0.25)" 
                    strokeWidth="1.2" 
                  />

                  {/* Thermal Hotspot circles */}
                  <g className="opacity-75">
                    <circle cx="190" cy="185" r="30" fill="url(#heat-glow-red)" />
                    <circle cx="190" cy="185" r="1.5" fill="#ef4444" />
                    <circle cx="140" cy="170" r="25" fill="url(#heat-glow-yellow)" />
                    <circle cx="140" cy="170" r="1.5" fill="#eab308" />
                    <circle cx="230" cy="210" r="35" fill="url(#heat-glow-red)" />
                    <circle cx="230" cy="210" r="1.5" fill="#ef4444" />
                  </g>

                  {/* Preloaded governorate locations pins & letters */}
                  {(chosenGovObj?.districts || []).slice(0, 3).map((dist, dIdx) => {
                    return (dist.villages || []).slice(0, 2).map((vil, vIdx) => {
                      const label = `${fromGov} - ${dist.name} - ${vil}`;
                      const coords = getLocationCoords(label);
                      const isPickup = pickup === label;
                      const isDropoff = dropoff.startsWith(label);
                      
                      return (
                        <g key={`${dIdx}-${vIdx}`} className="opacity-80 transition hover:opacity-100">
                          {isPickup && (
                            <>
                              <circle cx={coords.x} cy={coords.y} r="6" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1.5" className="animate-pulse" />
                              <circle cx={coords.x} cy={coords.y} r="2.5" fill="#3b82f6" />
                              <text x={coords.x + 8} y={coords.y + 3} fontSize="7" fill="#60a5fa" fontWeight="semibold" textAnchor="start">📍 {vil}</text>
                            </>
                          )}
                          {isDropoff && (
                            <>
                              <circle cx={coords.x} cy={coords.y} r="6" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                              <circle cx={coords.x} cy={coords.y} r="2.5" fill="#10b981" />
                              <text x={coords.x + 8} y={coords.y + 3} fontSize="7" fill="#34d399" fontWeight="bold" textAnchor="start">🏁 {vil}</text>
                            </>
                          )}
                          {!isPickup && !isDropoff && (
                            <>
                              <circle cx={coords.x} cy={coords.y} r="2" fill="rgba(226, 232, 240, 0.4)" />
                              <text x={coords.x + 6} y={coords.y + 2.5} fontSize="6" fill="rgba(148, 163, 184, 0.4)" textAnchor="start">{vil.slice(0, 6)}</text>
                            </>
                          )}
                        </g>
                      );
                    });
                  })}

                  {/* Waypoints rendered on map */}
                  {waypoints.map((wp, wpIdx) => {
                    const wpCoords = wp.coords || { x: 200 + (wpIdx * 10 - 15), y: 190 + (wpIdx * 8) };
                    return (
                      <g key={wp.id || wpIdx} className="opacity-95">
                        <circle cx={wpCoords.x} cy={wpCoords.y} r="5" fill="#581c87" stroke="#c084fc" strokeWidth="1.5" className="animate-pulse" />
                        <circle cx={wpCoords.x} cy={wpCoords.y} r="2" fill="#e9d5ff" />
                        <text x={wpCoords.x + 7} y={wpCoords.y + 3} fontSize="6.5" fill="#e9d5ff" fontWeight="bold" textAnchor="start">
                          🛑 {wpIdx + 1}. {wp.name.slice(0, 14)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Trail / Path connecting pickup -> waypoints -> dropoff */}
                  {pickup && dropoff && pickup !== dropoff && (
                    <g>
                      {waypoints.length === 0 ? (
                        <>
                          <path 
                            d={`M ${pickupCoords.x} ${pickupCoords.y} L ${dropoffCoords.x} ${dropoffCoords.y}`} 
                            fill="none" 
                            stroke="#818cf8" 
                            strokeWidth="1.5" 
                            strokeDasharray="3 3" 
                            className="animate-pulse"
                          />
                          <line 
                            x1={pickupCoords.x} 
                            y1={pickupCoords.y} 
                            x2={dropoffCoords.x} 
                            y2={dropoffCoords.y} 
                            stroke="#4f46e5" 
                            strokeWidth="1" 
                          />
                        </>
                      ) : (
                        (() => {
                          const pts = [
                            pickupCoords,
                            ...waypoints.map((wp, i) => wp.coords || { x: 200 + (i * 10 - 15), y: 190 + (i * 8) }),
                            dropoffCoords
                          ];
                          const pathD = pts.reduce((acc, p, idx) => idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
                          return (
                            <>
                              <path 
                                d={pathD} 
                                fill="none" 
                                stroke="#c084fc" 
                                strokeWidth="1.5" 
                                strokeDasharray="3 3" 
                                className="animate-pulse"
                              />
                              <path 
                                d={pathD} 
                                fill="none" 
                                stroke="#7c3aed" 
                                strokeWidth="1" 
                              />
                            </>
                          );
                        })()
                      )}
                    </g>
                  )}
                </svg>

                {/* Legend & Quick instruction label */}
                <div className="z-10 bg-slate-950/95 border-t border-slate-900 px-3 py-1 flex justify-between items-center text-[8px] text-slate-400 font-sans flex-row-reverse">
                  <span>🔵 {t('الانطلاق', 'Pickup')}</span>
                  <span>🛑 {t('توقف', 'Stops')}: {waypoints.length}</span>
                  <span>🟢 {t('الوصول', 'Dropoff')}</span>
                  <span>🔺 {t('ازدحام', 'Heat')}</span>
                </div>
              </div>
            </div>

            {/* Final Pricing Display */}
            {pickup && dropoff && pickup !== dropoff ? (
              <div className="bg-[#050811]/90 border border-indigo-500/20 p-3.5 rounded-2xl flex flex-col gap-2.5 animate-fadeIn text-right shadow-md">
                <div className="flex justify-between items-center flex-row-reverse bg-gradient-to-l from-indigo-950/40 to-indigo-900/10 p-3 rounded-xl border border-indigo-500/30">
                  <div className="text-right">
                    <span className="text-[10px] text-indigo-300 font-bold block">{t('المبلغ المتوقع لتكلفة الرحلة:', 'Expected Trip Fare Cost:')}</span>
                    <span className="text-[8.5px] text-slate-400">
                      {t('مسافة مقدرة:', 'Distance:')} {activeDistance.toFixed(1)} {t('كم', 'KM')} • {activeDuration} {t('دقيقة', 'mins')}
                    </span>
                  </div>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    {estimatedPrice.toFixed(2)} {t('د.أ', 'JD')}
                  </span>
                </div>
              </div>
            ) : (
              /* Heatmap Radar placeholder */
              <div className="relative w-full h-32 bg-slate-950/70 border border-slate-900 rounded-2xl overflow-hidden flex flex-col justify-center items-center">
                <svg className="absolute inset-0 w-full h-full select-none" viewBox="100 100 200 200">
                  <circle cx="200" cy="200" r={(simTick % 4) * 25} fill="none" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="1" />
                  <circle cx="160" cy="180" r="2" fill="#10b981" />
                  <circle cx="220" cy="220" r="2" fill="#ec4899" />
                  <circle cx="240" cy="150" r="2" fill="#facc15" />
                </svg>
                <div className="z-10 text-center px-4">
                  <p className="text-[10px] text-slate-400 font-sans">{t('حدد الموقعين لتتبع مسار كباتن الأجرة والتاكسي المتطابقين حرارياً', 'Select pickup and dropoff areas to map coordinates and trigger heat logs')}</p>
                  <p className="text-[8.5px] text-indigo-400 font-sans mt-0.5">{t('الرادار متصل بنجاح مع كباتن الأردن النشطين 🗺️', 'Radar online and communicating with available captains 🗺️')}</p>
                </div>
              </div>
            )}

            {/* Geographic match error handling */}
            {pickup && dropoff && !hasBothGeomatch && (
              <div className="p-2.5 bg-amber-950/20 rounded-xl border border-amber-500/30 text-right mt-1 flex flex-col gap-1">
                <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1 justify-end flex-row-reverse">
                  <span>⚠️ {t('معالجة الإحداثيات التقريبية للموقع المخصص', 'Unmapped geographic coordinates resolved')}</span>
                </span>
                <span className="text-[9px] text-slate-400 block font-sans">
                  {t(
                    'لم يتم العثور على تطابق جغرافي دقيق بالخريطة لبعض المواقع المدخلة مخصصاً. تم تعيين إحداثيات افتراضية ذكية للمسار للمتابعة دون انقطاع، وسيقوم الكابتن بالملاحة وفق العناوين والحي المكتوب.',
                    'Sub-parts of custom names do not match hardcoded map nodes. Intelligent approximate coordinates have been successfully projected. The captain will reach you utilizing the written neighborhood details.'
                  )}
                </span>
                <div className="flex gap-2 justify-end mt-0.5">
                  {!hasPickupGeomatch && (
                    <span className="text-[8px] bg-amber-950 px-1.5 py-0.5 rounded text-amber-400 border border-amber-500/40 font-semibold text-right">
                      {t('نقطة ركوب تقريبية', 'Approx pickup coordinates')}
                    </span>
                  )}
                  {!hasDropoffGeomatch && (
                    <span className="text-[8px] bg-amber-950 px-1.5 py-0.5 rounded text-amber-400 border border-amber-500/40 font-semibold text-right">
                      {t('نقطة تنزيل تقريبية', 'Approx dropoff coordinates')}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* PAYMENT METHOD SELECTION (طريقة الدفع: نقدي / محفظة) */}
            <div className="bg-slate-900 border border-indigo-500/30 p-3 rounded-2xl flex flex-col gap-2 font-sans my-1">
              <div className="flex justify-between items-center flex-row-reverse mb-0.5">
                <span className="text-[10px] font-bold text-slate-200 text-right uppercase tracking-wider block">
                  💳 {t('طريقة الدفع المفضلـة للمشوار', 'Payment Method')}
                </span>
                <span className="text-[9px] text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  {selectedPaymentMethod === 'cash' ? '💵 دفع نقدي (كاش)' : '💳 محفظة آدم الرقمية'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* CASH OPTION */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('cash')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center cursor-pointer ${
                    selectedPaymentMethod === 'cash'
                      ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 flex-row-reverse font-black text-xs">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>نقدي (كاش)</span>
                  </div>
                  <span className="text-[8.5px] leading-tight text-slate-350">
                    ادفع تسعيرة الرحلة للكابتن نقداً عند الوصول. متاح مجاناً حتى لو كان رصيد محفظتك 0 د.أ.
                  </span>
                </button>

                {/* WALLET OPTION */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('wallet')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center cursor-pointer ${
                    selectedPaymentMethod === 'wallet'
                      ? 'bg-indigo-950/70 border-indigo-500 text-indigo-300 shadow-md ring-1 ring-indigo-500/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 flex-row-reverse font-black text-xs">
                    <Wallet className="w-4 h-4 text-indigo-400" />
                    <span>محفظة التطبيق</span>
                  </div>
                  <span className="text-[8.5px] leading-tight text-slate-350">
                    خصم تلقائي لسعر المشوار عند الوصول (يتطلب رصيد كافٍ بمحفظتك).
                  </span>
                </button>
              </div>
            </div>

            {/* Wallet Balance Safety Info */}
            {pickup && dropoff && (
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between flex-row-reverse gap-2">
                <div className="text-right">
                  <span className="text-[8.5px] text-slate-400 block font-sans">{t('رصيد محفظتك المتوفر حالياً', 'Your Available Wallet Balance')}</span>
                  <span className={`text-xs font-black block font-mono ${(loggedPassenger?.balance ?? 0) >= estimatedPrice || selectedPaymentMethod === 'cash' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {(loggedPassenger?.balance ?? 0).toFixed(2)} {t('د.أ', 'JD')}
                  </span>
                </div>
                {selectedPaymentMethod === 'cash' ? (
                  <span className="text-[9px] text-emerald-400 font-sans self-center bg-emerald-950/30 border border-emerald-900/40 px-2 py-0.5 rounded-lg">
                    ✓ {t('مؤهل للطلب نقداً (كاش)', 'Cash Payment Allowed')}
                  </span>
                ) : (loggedPassenger?.balance ?? 0) < estimatedPrice ? (
                  <span className="text-[9px] text-red-400 font-sans self-center bg-red-950/30 border border-red-900/40 px-2 py-0.5 rounded-lg">
                    ⚠️ {t('الرصيد غير كافٍ للدفع بالمحفظة (اختر كاش)', 'Low Wallet Balance')}
                  </span>
                ) : (
                  <span className="text-[9px] text-emerald-400 font-sans self-center bg-emerald-950/30 border border-emerald-900/40 px-2 py-0.5 rounded-lg">
                    ✓ {t('رصيد المحفظة كافٍ', 'Wallet Balance Verified')}
                  </span>
                )}
              </div>
            )}

            {/* Giant Action Button */}
            <button
              type="submit"
              disabled={!pickup || !dropoff || (selectedPaymentMethod === 'wallet' && (loggedPassenger?.balance ?? 0) < estimatedPrice)}
              className={`w-full font-black py-4 rounded-2xl text-xs transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                (!pickup || !dropoff || (selectedPaymentMethod === 'wallet' && (loggedPassenger?.balance ?? 0) < estimatedPrice))
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : isAirportTrip
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white shadow-indigo-600/40 border border-indigo-300 animate-pulse'
                  : waypoints.length > 0
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white shadow-purple-600/40 border border-purple-300'
                  : 'bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-extrabold shadow-amber-500/30 border border-amber-400'
              }`}
            >
              {isAirportTrip ? (
                <>
                  <span className="text-base">✈️</span>
                  <span className="text-sm">
                    {t(`تأكيد وطلب مشوار المطار VIP الآن (${(settings?.airportRidePrice ?? 25.0).toFixed(2)} د.أ)`, `Confirm Airport VIP Ride Now (${(settings?.airportRidePrice ?? 25.0).toFixed(2)} JD)`)}
                  </span>
                </>
              ) : waypoints.length > 0 ? (
                <>
                  <span className="text-base">🛑</span>
                  <span className="text-sm">
                    {t(`طلب مشوار مع ${waypoints.length} نقاط توقف (${estimatedPrice.toFixed(2)} د.أ)`, `Request Ride with ${waypoints.length} Stops (${estimatedPrice.toFixed(2)} JD)`)}
                  </span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 shrink-0" />
                  <span className="text-sm">
                    {selectedPaymentMethod === 'cash'
                      ? t(`طلب تاكسي آدم الآن (كاش: ${estimatedPrice.toFixed(2)} د.أ) ⚡`, `Request Adam Taxi Now (Cash: ${estimatedPrice.toFixed(2)} JD) ⚡`)
                      : t(`طلب تاكسي آدم الآن (محفظة: ${estimatedPrice.toFixed(2)} د.أ) ⚡`, `Request Adam Taxi Now (Wallet: ${estimatedPrice.toFixed(2)} JD) ⚡`)}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Safety Shield Info Block */}
      <div className="p-3 bg-[#0a0f1d] border border-blue-900/30 rounded-2xl flex flex-row-reverse gap-3 items-start font-sans">
        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-right">
          <h5 className="text-[10px] font-bold text-slate-200">{t('وثيقة السلامة والأمان لك ولعائلتك', 'Trust & Safe Transit Protocol')}</h5>
          <p className="text-[8.5px] text-slate-400 leading-relaxed mt-0.5">
            {t('كافة الرحلات بالتنقل الفردي مسجلة عبر الأقمار الاصطناعية وتخضع لشروط الترخيص لهيئة تنظيم النقل البري بالأردن.', 'All localized single-passenger rides are logged via satellite systems complying with the Land Transport Regulatory Commission (LTRC) mandate.')}
          </p>
        </div>
      </div>
    </div>
  );
};
