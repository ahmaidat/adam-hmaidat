import React, { useEffect, useRef, useState } from 'react';
import { useAppState } from '../stateEngine';
import { getLocationCoords, getCanvasCoordsFromGeo, getGeoCoords } from '../locationData';
import { Compass, Flame, Info, MapPin, Navigation, Orbit, Sparkles, Sliders, Map, Zap, Check, Radar, AlertTriangle, ShieldAlert, Satellite, Locate, Radio, RefreshCw } from 'lucide-react';
import * as d3 from 'd3';

interface Point {
  x: number;
  y: number;
}

export interface SpeedCamera {
  id: string;
  name: string;
  type: 'fixed' | 'mobile';
  x: number;
  y: number;
  speedLimit: number;
  governorate: string;
  isActive: boolean;
}

const INITIAL_SPEED_CAMERAS: SpeedCamera[] = [
  // Amman (عمان)
  { id: 'rad-amman-1', name: 'رادار طريق المطار الدولي - جسر مادبا', type: 'fixed', x: 190, y: 240, speedLimit: 100, governorate: 'عمان (Amman)', isActive: true },
  { id: 'rad-amman-2', name: 'رادار شارع الملكة رانيا - قرب الجامعة الأردنية', type: 'fixed', x: 195, y: 170, speedLimit: 70, governorate: 'عمان (Amman)', isActive: true },
  { id: 'rad-amman-3', name: 'رادار متحرك شارع الاستقلال - نزول المسلخ', type: 'mobile', x: 220, y: 190, speedLimit: 80, governorate: 'عمان (Amman)', isActive: true },
  { id: 'rad-amman-4', name: 'رادار شارع المطار - جسر الصحابة', type: 'fixed', x: 185, y: 220, speedLimit: 100, governorate: 'عمان (Amman)', isActive: true },
  { id: 'rad-amman-5', name: 'رادار متحرك ممر عمان التنموي (شارع الـ١٠٠)', type: 'mobile', x: 275, y: 230, speedLimit: 100, governorate: 'عمان (Amman)', isActive: true },

  // Irbid (إربد)
  { id: 'rad-irbid-1', name: 'رادار طريق إربد عمان السريع - جسر جرش', type: 'fixed', x: 220, y: 140, speedLimit: 100, governorate: 'إربد (Irbid)', isActive: true },
  { id: 'rad-irbid-2', name: 'رادار شارع الثلاثين - قرب جامعة اليرموك', type: 'fixed', x: 235, y: 75, speedLimit: 60, governorate: 'إربد (Irbid)', isActive: true },
  { id: 'rad-irbid-3', name: 'رادار متحرك طريق إربد الحصن', type: 'mobile', x: 245, y: 110, speedLimit: 80, governorate: 'إربد (Irbid)', isActive: true },

  // Zarqa (الزرقاء)
  { id: 'rad-zarqa-1', name: 'رادار أوتوستراد عمان - الزرقاء - قرب الرصيفة', type: 'fixed', x: 260, y: 180, speedLimit: 90, governorate: 'الزرقاء (Zarqa)', isActive: true },
  { id: 'rad-zarqa-2', name: 'رادار شارع مكة المكرمة (حزام الزرقاء)', type: 'fixed', x: 300, y: 150, speedLimit: 80, governorate: 'الزرقاء (Zarqa)', isActive: true },
  { id: 'rad-zarqa-3', name: 'رادار متحرك طريق الزرقاء المفرق الدولي', type: 'mobile', x: 330, y: 130, speedLimit: 100, governorate: 'الزرقاء (Zarqa)', isActive: true },

  // Balqa (البلقاء / السلط)
  { id: 'rad-balqa-1', name: 'رادار طريق السلط الدائري - جسر عين الباشا', type: 'fixed', x: 160, y: 185, speedLimit: 80, governorate: 'البلقاء (Balqa)', isActive: true },
  { id: 'rad-balqa-2', name: 'رادار شارع السرو الرئيسي - نزول السلط', type: 'fixed', x: 145, y: 190, speedLimit: 70, governorate: 'البلقاء (Balqa)', isActive: true },
  { id: 'rad-balqa-3', name: 'رادار متحرك طريق السلط وادي شعيب', type: 'mobile', x: 110, y: 210, speedLimit: 60, governorate: 'البلقاء (Balqa)', isActive: true }
];

// Perpendicular offset midpoint generator to produce curved path control points
function getControlPoint(p0: Point, p2: Point, curveStrength: number): Point {
  const dx = p2.x - p0.x;
  const dy = p2.y - p0.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) return p0;

  // Derive perpendicular vector for a stable side offset
  const px = -dy / length;
  const py = dx / length;
  
  const mx = (p0.x + p2.x) / 2;
  const my = (p0.y + p2.y) / 2;
  
  // Custom curvature offset scaling
  const offset = length * curveStrength;
  return {
    x: mx + px * offset,
    y: my + py * offset
  };
}

// Quadratic Bezier interpolation formula to track smooth curves
function getBezierPoint(p0: Point, p1: Point, p2: Point, t: number): Point {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  
  return {
    x: uu * p0.x + 2 * u * t * p1.x + tt * p2.x,
    y: uu * p0.y + 2 * u * t * p1.y + tt * p2.y
  };
}

export const LiveMap: React.FC = () => {
  const { drivers, rides, requests, settings } = useAppState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showRouteHeat, setShowRouteHeat] = useState(true);
  const [showRadars, setShowRadars] = useState(true);
  const [activeWarnings, setActiveWarnings] = useState<{ driverName: string, radarName: string, speedLimit: number }[]>([]);
  const [geoPrivacyActive, setGeoPrivacyActive] = useState(() => {
    return localStorage.getItem('adam_geo_privacy_shield') !== 'false';
  });

  // Curved Route Visualization & Interactive States
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [curveStrength, setCurveStrength] = useState<number>(0.22);
  const [showAllRoutes, setShowAllRoutes] = useState<boolean>(true);
  const [glowIntensity, setGlowIntensity] = useState<'normal' | 'strong'>('strong');
  const [isTracerHubExpanded, setIsTracerHubExpanded] = useState<boolean>(true);

  // Jordanian Speed Camera & Radar State variables
  const [speedCameras, setSpeedCameras] = useState<SpeedCamera[]>(INITIAL_SPEED_CAMERAS);
  const [showFixedCameras, setShowFixedCameras] = useState(true);
  const [showMobileCameras, setShowMobileCameras] = useState(true);
  const [selectedGovFilter, setSelectedGovFilter] = useState<string>('all');
  const [placementMode, setPlacementMode] = useState(false);
  const [placementLimit, setPlacementLimit] = useState<number>(90);
  const [placementGov, setPlacementGov] = useState<string>('عمان (Amman)');
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [flashRadarId, setFlashRadarId] = useState<string | null>(null);
  const [isRadarHubExpanded, setIsRadarHubExpanded] = useState<boolean>(true);

  // 🛰️ Real-time Device Geolocation Telemetry States
  const [deviceGps, setDeviceGps] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    speed: number;
    heading: number;
    updatedAt: Date;
    isReal: boolean;
  } | null>(null);
  const [gpsSyncCount, setGpsSyncCount] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsRefreshing, setGpsRefreshing] = useState(false);
  const [showDeviceLocation, setShowDeviceLocation] = useState(true);

  // 🛰️ Real-time Geolocation continuous tracking & periodic verification for LiveMap
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsError('المتصفح أو الجهاز لا يدعم Geolocation');
      return;
    }

    let watchId: number | null = null;

    const handleSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy, speed, heading } = pos.coords;
      setDeviceGps({
        lat: latitude,
        lng: longitude,
        accuracy: Math.round(accuracy || 0),
        speed: speed ? Math.round(speed * 3.6) : 0,
        heading: heading ? Math.round(heading) : 0,
        updatedAt: new Date(),
        isReal: true
      });
      setGpsError(null);
      setGpsSyncCount(c => c + 1);
    };

    const handleError = (err: GeolocationPositionError) => {
      console.warn('LiveMap GPS check:', err.message);
      setGpsError(err.message);
    };

    try {
      watchId = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
    } catch (e) {
      console.warn('LiveMap watchPosition error:', e);
    }

    // Periodic heartbeat verification every 5 seconds to guarantee active GPS updates
    const pollInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 6000 }
      );
    }, 5000);

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      clearInterval(pollInterval);
    };
  }, []);

  const refreshGpsNow = () => {
    if (!('geolocation' in navigator)) return;
    setGpsRefreshing(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed, heading } = pos.coords;
        setDeviceGps({
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy || 0),
          speed: speed ? Math.round(speed * 3.6) : 0,
          heading: heading ? Math.round(heading) : 0,
          updatedAt: new Date(),
          isReal: true
        });
        setGpsError(null);
        setGpsRefreshing(false);
        setLogs(prev => [
          `🛰️ تم قفل وتحديث موقع الـ GPS الفعلي للجهاز بنجاح (${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°) بدقة ±${Math.round(accuracy)}م`,
          ...prev
        ]);
      },
      (err) => {
        setGpsError(err.message);
        setGpsRefreshing(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
    );
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!placementMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 440;
    const clickY = ((e.clientY - rect.top) / rect.height) * 400;

    const newCam: SpeedCamera = {
      id: `rad-custom-${Date.now()}`,
      name: `رادار متحرك ${placementLimit} كم/س (${placementGov.split(' ')[0]})`,
      type: 'mobile',
      x: Math.round(clickX),
      y: Math.round(clickY),
      speedLimit: placementLimit,
      governorate: placementGov,
      isActive: true
    };

    setSpeedCameras(prev => [...prev, newCam]);
    setPlacementMode(false);
    setMousePos(null);

    // Add immediate feedback log
    setLogs(prev => [
      `📡 إبلاغ سريع: تم تثبيت رادار متحرك جديد في محافظة ${placementGov.split(' ')[0]} بسرعة ${placementLimit} كم/س.`,
      ...prev
    ]);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!placementMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 440;
    const y = ((e.clientY - rect.top) / rect.height) * 400;
    setMousePos({ x: Math.round(x), y: Math.round(y) });
  };

  const handleCanvasMouseLeave = () => {
    setMousePos(null);
  };

  // Dynamic D3 coordinates converter mapping Jordan-level distances
  const getDistanceKm = (p1: Point, p2: Point) => {
    const pixels = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    return Math.round(pixels * 0.42); // conversion factor
  };

  const routesToRender = React.useMemo(() => {
    const activeReqs = requests.filter(r => r.status === 'pending' || r.status === 'pooling');
    const activeRidesList = rides.filter(r => r.status === 'started' || r.status === 'pooling' || r.status === 'offered');
    
    interface RenderRoute {
      id: string;
      type: 'ride' | 'request';
      label: string;
      from: string;
      to: string;
      fromC: Point;
      toC: Point;
      color: string;
      details: string;
      distanceKm: number;
      savedFuelPercent: number;
      driverName?: string;
      isPooledPath?: boolean;
      pointsSeq?: { x: number; y: number; label: string; name?: string }[];
    }

    const list: RenderRoute[] = [];

    activeRidesList.forEach(ride => {
      const fromC = getLocationCoords(ride.fromArea);
      const toC = getLocationCoords(ride.toArea);
      const driver = drivers.find(d => d.id === ride.driverId);
      
      let fX = fromC.x;
      let fY = fromC.y;
      let tX = toC.x;
      let tY = toC.y;
      if (geoPrivacyActive) {
        const hashVal = ride.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        fX += ((hashVal % 12) - 6);
        fY += (((hashVal >> 1) % 12) - 6);
        tX += (((hashVal >> 2) % 12) - 6);
        tY += (((hashVal >> 3) % 12) - 6);
      }

      const passengerCount = ride.requests.reduce((sum, req) => sum + req.seatsCount, 0);

      // Build sequential points for pooled route if there are passenger requests
      const pointsSeq: { x: number; y: number; label: string; name?: string }[] = [];
      const hasRequests = ride.requests && ride.requests.length >= 1;
      
      if (hasRequests) {
        pointsSeq.push({ x: fX, y: fY, label: 'بداية الرحلة' });
        ride.requests.forEach((req, idx) => {
          const reqC = getLocationCoords(req.fromArea);
          let rx = reqC.x;
          let ry = reqC.y;
          if (geoPrivacyActive) {
            const hashVal = req.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            rx += ((hashVal % 16) - 8);
            ry += (((hashVal >> 2) % 16) - 8);
          }
          pointsSeq.push({
            x: rx,
            y: ry,
            label: `نقطة التقاط ${idx + 1}`,
            name: req.passengerName.split(' ')[0]
          });
        });
        pointsSeq.push({ x: tX, y: tY, label: 'الوجهة النهائية' });
      }

      list.push({
        id: ride.id,
        type: 'ride',
        label: `رحلة كابتن ${driver ? driver.fullName.split(' ')[0] : 'آدم'}`,
        from: ride.fromArea,
        to: ride.toArea,
        fromC: { x: fX, y: fY },
        toC: { x: tX, y: tY },
        color: '#38bdf8', 
        details: `تجميع ${passengerCount}/4 ركاب • جاري السير بآدم`,
        distanceKm: getDistanceKm(fromC, toC),
        savedFuelPercent: passengerCount > 1 ? (passengerCount - 1) * 22 : 0,
        driverName: driver?.fullName,
        isPooledPath: hasRequests,
        pointsSeq: hasRequests ? pointsSeq : undefined
      });
    });

    activeReqs.forEach(req => {
      if (req.rideId && activeRidesList.some(r => r.id === req.rideId && r.status === 'started')) {
        return; 
      }
      
      const fromC = getLocationCoords(req.fromArea);
      const toC = getLocationCoords(req.toArea);

      let fX = fromC.x;
      let fY = fromC.y;
      let tX = toC.x;
      let tY = toC.y;
      if (geoPrivacyActive) {
        const hashVal = req.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        fX += ((hashVal % 16) - 8);
        fY += (((hashVal >> 2) % 16) - 8);
        tX += (((hashVal >> 3) % 16) - 8);
        tY += (((hashVal >> 4) % 16) - 8);
      }

      list.push({
        id: req.id,
        type: 'request',
        label: `طلب الراكب ${req.passengerName.split(' ')[0]}`,
        from: req.fromArea,
        to: req.toArea,
        fromC: { x: fX, y: fY },
        toC: { x: tX, y: tY },
        color: '#f43f5e', 
        details: `طلب ${req.seatsCount} مقاعد • بالانتظار للتعميد`,
        distanceKm: getDistanceKm(fromC, toC),
        savedFuelPercent: 0
      });
    });

    // Fallback static demonstration paths to illustrate D3 curves at all times
    if (list.length === 0) {
      list.push({
        id: 'demo-amman-irbid',
        type: 'ride',
        label: 'ممر الشمال السريع (خط محاكاة)',
        from: 'عمان (Amman)',
        to: 'إربد (Irbid)',
        fromC: { x: 200, y: 200 },
        toC: { x: 240, y: 80 },
        color: '#38bdf8',
        details: 'ممر الشمال السريع لآدم • ترقب تعميد حقيقي',
        distanceKm: 76,
        savedFuelPercent: 44
      });
      list.push({
        id: 'demo-amman-zarqa',
        type: 'request',
        label: 'ممر الزرقاء السريع (خط محاكاة)',
        from: 'عمان (Amman)',
        to: 'الزرقاء (Zarqa)',
        fromC: { x: 200, y: 200 },
        toC: { x: 310, y: 160 },
        color: '#f43f5e',
        details: 'مسار رصيفة-ياجوز التجميعي لآدم',
        distanceKm: 28,
        savedFuelPercent: 35
      });
      list.push({
        id: 'demo-pooled-trip',
        type: 'ride',
        label: 'مسار رحلة تجميعية ذكية (توضيحي)',
        from: 'السلط (Salt)',
        to: 'الزرقاء (Zarqa)',
        fromC: { x: 130, y: 170 }, // Salt
        toC: { x: 310, y: 160 }, // Zarqa
        color: '#fbbf24',
        details: 'مسار مجمع تلسكوبي لـ ٣ ركاب بالتوالي',
        distanceKm: 45,
        savedFuelPercent: 62,
        isPooledPath: true,
        pointsSeq: [
          { x: 130, y: 170, label: 'بداية الرحلة (السلط)' },
          { x: 200, y: 200, label: 'نقطة التقاط ١ (عمان)', name: 'أحمد' },
          { x: 230, y: 160, label: 'نقطة التقاط ٢ (تلاع العلي)', name: 'رانية' },
          { x: 310, y: 160, label: 'الوجهة النهائية (الزرقاء)' }
        ]
      });
    }

    return list;
  }, [requests, rides, drivers, geoPrivacyActive]);

  useEffect(() => {
    const handlePrivacyChange = () => {
      setGeoPrivacyActive(localStorage.getItem('adam_geo_privacy_shield') !== 'false');
    };
    window.addEventListener('adam_privacy_changed', handlePrivacyChange);
    return () => {
      window.removeEventListener('adam_privacy_changed', handlePrivacyChange);
    };
  }, []);

  // Simulation effect -> animate active rides moving
  const [ticker, setTicker] = useState(0);
  useEffect(() => {
    const handle = setInterval(() => {
      setTicker(t => t + 1);
    }, 150);
    return () => clearInterval(handle);
  }, []);

  // Update animated logs
  useEffect(() => {
    const newLogs: string[] = [];
    
    // Check if any driver is currently close to any speed camera/radar
    const currentWarnings: { driverName: string, radarName: string, speedLimit: number }[] = [];
    drivers.forEach(driver => {
      if (driver.isOnline && driver.activeRideId) {
        speedCameras.forEach(cam => {
          const dist = Math.sqrt((driver.currentLocation.x - cam.x) ** 2 + (driver.currentLocation.y - cam.y) ** 2);
          if (dist < 35) {
            currentWarnings.push({
              driverName: driver.fullName,
              radarName: cam.name,
              speedLimit: cam.speedLimit
            });
          }
        });
      }
    });

    setActiveWarnings(currentWarnings);

    if (currentWarnings.length > 0) {
      currentWarnings.forEach(w => {
        newLogs.push(`⚠️ رادار نشط: كابتن [${w.driverName.split(' ')[0]}] يقترب من [${w.radarName}] - الالتزام بالسرعة: ${w.speedLimit} كم/س!`);
      });
    }

    // Add active pooling news
    const pendingReqs = requests.filter(r => r.status === 'pending');
    if (pendingReqs.length > 0) {
      newLogs.push(`🔄 جاري فحص ${pendingReqs.length} طلبات ركاب بالانتظار للدمج والتجميع...`);
    }

    const poolingRides = rides.filter(r => r.status === 'pooling');
    poolingRides.forEach(r => {
      const seats = r.requests.reduce((sum, req) => sum + req.seatsCount, 0);
      newLogs.push(`📦 مجمع آدم نشط: رحلة من [${r.fromArea}] إلى [${r.toArea}] بركاب عدد ${seats}/4 مقاعد.`);
    });

    const offeredRides = rides.filter(r => r.status === 'offered');
    offeredRides.forEach(r => {
      newLogs.push(`⚡ عرض تمهيدي: جاري عرض طلب تجميع ${r.fromArea} إلى السائق الكابتن المتاح.`);
    });

    const activeRides = rides.filter(r => r.status === 'started');
    activeRides.forEach(r => {
      newLogs.push(`🚗 رحلة منطلقة حالياً: كابتن آدم يتجه بالركاب من ${r.fromArea} إلى ${r.toArea}.`);
    });

    const completed = rides.filter(r => r.status === 'completed');
    if (completed.length > 0) {
      const last = completed[completed.length - 1];
      newLogs.push(`✅ الرحلة الأخيرة مكتملة: تم خصم ${last.commissionCharged} د.أ عمولة تجميع من الكابتن.`);
    }

    if (newLogs.length === 0) {
      newLogs.push("🟢 جميع السيارات في حالة تأهب واستقبال للطلبات...");
      newLogs.push("📍 حدد الإدارة، وأطلق طلباً من هواتف الركاب لبدء المحاكاة التفاعلية.");
    }

    setLogs(newLogs.slice(-6)); // Last 6 events
  }, [requests, rides, drivers, speedCameras]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw grid
    ctx.fillStyle = '#0f172a'; // Deep Navy Slate
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid Lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Filter active requests (exclude completed and cancelled)
    const activeReqs = requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled');

    // Aggregate demand per governorate
    const AmmanSeats = activeReqs
      .filter(r => r.fromArea.includes("عمان") || r.fromArea.includes("سابع") || r.fromArea.includes("جبيهة") || r.fromArea.includes("تلاع") || r.fromArea.includes("عبدلي"))
      .reduce((sum, r) => sum + r.seatsCount, 0);

    const IrbidSeats = activeReqs
      .filter(r => r.fromArea.includes("إربد") || r.fromArea.includes("حصن") || r.fromArea.includes("صريح") || r.fromArea.includes("إيدون"))
      .reduce((sum, r) => sum + r.seatsCount, 0);

    const ZarqaSeats = activeReqs
      .filter(r => r.fromArea.includes("زرقاء") || r.fromArea.includes("رصيفة") || r.fromArea.includes("رشيد") || r.fromArea.includes("ياجوز"))
      .reduce((sum, r) => sum + r.seatsCount, 0);

    const BalqaSeats = activeReqs
      .filter(r => r.fromArea.includes("سلط") || r.fromArea.includes("بلقاء") || r.fromArea.includes("عين الباشا") || r.fromArea.includes("صافوط"))
      .reduce((sum, r) => sum + r.seatsCount, 0);

    // Draw Heatmap Overlay if enabled
    if (showHeatmap) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen'; // Glowing overlap blending mode

      const govCentersData = [
        { x: 200, y: 200, count: AmmanSeats },
        { x: 240, y: 80, count: IrbidSeats },
        { x: 310, y: 160, count: ZarqaSeats },
        { x: 130, y: 170, count: BalqaSeats }
      ];

      // 1. Governorate-level big macro density clouds
      govCentersData.forEach(gc => {
        if (gc.count === 0) return;

        // Radius grows based on count of active passenger seats requested
        const radius = 35 + Math.min(gc.count * 15, 80);

        // Map density count to proper heat colors
        let coreColor = 'rgba(16, 185, 129, 0.4)';  // Low density (Green)
        let midColor = 'rgba(16, 185, 129, 0.15)';
        
        if (gc.count >= 5) {
          coreColor = 'rgba(239, 68, 68, 0.5)';     // High density (Raging Red Heat)
          midColor = 'rgba(239, 68, 68, 0.2)';
        } else if (gc.count >= 3) {
          coreColor = 'rgba(245, 158, 11, 0.45)';   // Medium density (Amber Heat)
          midColor = 'rgba(245, 158, 11, 0.18)';
        }

        const grad = ctx.createRadialGradient(gc.x, gc.y, 0, gc.x, gc.y, radius);
        grad.addColorStop(0, coreColor);
        grad.addColorStop(0.4, midColor);
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(gc.x, gc.y, radius, 0, 2 * Math.PI);
        ctx.fill();
      });

      // 2. Micro-level localized request hot spots
      activeReqs.forEach(req => {
        const coords = getLocationCoords(req.fromArea);
        const radius = 18 + Math.min(req.seatsCount * 6, 35);

        const grad = ctx.createRadialGradient(coords.x, coords.y, 0, coords.x, coords.y, radius);
        grad.addColorStop(0, 'rgba(249, 115, 22, 0.35)'); // Precision orange core
        grad.addColorStop(0.4, 'rgba(249, 115, 22, 0.1)');
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, radius, 0, 2 * Math.PI);
        ctx.fill();
      });

      ctx.restore();
    }

    // Draw Frequent/Popular Route Heat Corridors
    if (showRouteHeat) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen'; // Screen blend to overlay glows elegantly

      const frequentCorridors = [
        { from: { x: 200, y: 200 }, to: { x: 310, y: 160 }, fromLabel: "عمان", toLabel: "الزرقاء", basePopularity: 82, nameAr: "عمان ↔ الزرقاء", nameEn: "Amman ↔ Zarqa" },
        { from: { x: 200, y: 200 }, to: { x: 240, y: 80 }, fromLabel: "عمان", toLabel: "إربد", basePopularity: 75, nameAr: "عمان ↔ إربد", nameEn: "Amman ↔ Irbid" },
        { from: { x: 200, y: 200 }, to: { x: 130, y: 170 }, fromLabel: "عمان", toLabel: "البلقاء", basePopularity: 48, nameAr: "عمان ↔ السلط", nameEn: "Amman ↔ Salt" },
        { from: { x: 310, y: 160 }, to: { x: 240, y: 80 }, fromLabel: "الزرقاء", toLabel: "إربد", basePopularity: 38, nameAr: "الزرقاء ↔ إربد", nameEn: "Zarqa ↔ Irbid" }
      ];

      frequentCorridors.forEach(c => {
        // Count active matching requests or rides in this corridor to boost intensity dynamically
        const matchingReqsCount = requests.filter(r => 
          (r.fromArea.includes(c.fromLabel) && r.toArea.includes(c.toLabel)) ||
          (r.fromArea.includes(c.toLabel) && r.toArea.includes(c.fromLabel))
        ).length;

        const matchingRidesCount = rides.filter(r => 
          (r.fromArea.includes(c.fromLabel) && r.toArea.includes(c.toLabel)) ||
          (r.fromArea.includes(c.toLabel) && r.toArea.includes(c.fromLabel))
        ).length;

        const dynamicIntensity = c.basePopularity + (matchingReqsCount * 12) + (matchingRidesCount * 15);
        
        const p0 = c.from;
        const p2 = c.to;
        const p1 = getControlPoint(p0, p2, curveStrength);

        // Render stacked lines with glowing warm colors to make a pristine neon heat corridor overlay
        const maxThickness = 12 + Math.min(dynamicIntensity * 0.15, 40);
        const steps = 5;

        for (let i = 1; i <= steps; i++) {
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);

          const thickness = (maxThickness / steps) * (steps - i + 1) * 1.8;
          ctx.lineWidth = thickness;

          let opacity = 0.015 + 0.035 * (i / steps);
          if (dynamicIntensity > 95) {
            ctx.strokeStyle = `rgba(239, 68, 68, ${opacity})`; // Highly active - Hot Ruby Red
          } else if (dynamicIntensity > 70) {
            ctx.strokeStyle = `rgba(249, 115, 22, ${opacity})`; // High demand - Fire Orange
          } else {
            ctx.strokeStyle = `rgba(245, 158, 11, ${opacity})`; // Warm Gold Amber
          }
          ctx.stroke();
        }

        // Animated heatmap flow particles indicating real-time matching density
        const waveSpeed = 0.006;
        const phase1 = ((ticker * waveSpeed) % 1.0);
        const phase2 = (((ticker + 40) * waveSpeed) % 1.0);

        [phase1, phase2].forEach(pState => {
          const pt = getBezierPoint(p0, p1, p2, pState);
          
          // Glow around particle
          const radG = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 9);
          if (dynamicIntensity > 92) {
            radG.addColorStop(0, 'rgba(239, 68, 68, 0.65)');
            radG.addColorStop(1, 'rgba(239, 68, 68, 0)');
          } else {
            radG.addColorStop(0, 'rgba(249, 115, 22, 0.65)');
            radG.addColorStop(1, 'rgba(249, 115, 22, 0)');
          }
          ctx.fillStyle = radG;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 9, 0, 2 * Math.PI);
          ctx.fill();

          // Small core particle
          ctx.fillStyle = dynamicIntensity > 92 ? '#ef4444' : '#f97316';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.5, 0, 2 * Math.PI);
          ctx.fill();
        });
      });

      ctx.restore();
    }

    // Draw Governorate Centers as glowing nodes
    const govCenters = [
      { name: "عمان (Amman)", coords: { x: 200, y: 200 }, color: '#3b82f6' },
      { name: "إربد (Irbid)", coords: { x: 240, y: 80 }, color: '#ec4899' },
      { name: "الزرقاء (Zarqa)", coords: { x: 310, y: 160 }, color: '#10b981' },
      { name: "البلقاء (Balqa)", coords: { x: 130, y: 170 }, color: '#f59e0b' }
    ];

    // Connect them with communication corridors/highways
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    // Connect Amman with Irbid, Zarqa, and Balqa
    ctx.moveTo(200, 200); ctx.lineTo(240, 80);
    ctx.moveTo(200, 200); ctx.lineTo(310, 160);
    ctx.moveTo(200, 200); ctx.lineTo(130, 170);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Draw glow circles for centers
    govCenters.forEach(gov => {
      // Glow
      const grad = ctx.createRadialGradient(gov.coords.x, gov.coords.y, 2, gov.coords.x, gov.coords.y, 25);
      grad.addColorStop(0, `${gov.color}44`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(gov.coords.x, gov.coords.y, 25, 0, 2 * Math.PI);
      ctx.fill();

      // Core point
      ctx.fillStyle = gov.color;
      ctx.beginPath();
      ctx.arc(gov.coords.x, gov.coords.y, 6, 0, 2 * Math.PI);
      ctx.fill();

      // Border ring
      ctx.strokeStyle = '#ffffffaa';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(gov.coords.x, gov.coords.y, 9, 0, 2 * Math.PI);
      ctx.stroke();

      // Label (Arabic)
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px Cairo, Tajawal, sans-serif';
      ctx.textAlign = 'center';

      const isAmman = gov.name.includes("عمان");
      const isIrbid = gov.name.includes("إربد");
      const isZarqa = gov.name.includes("الزرقاء");
      const isBalqa = gov.name.includes("البلقاء");
      const seatCount = isAmman ? AmmanSeats : isIrbid ? IrbidSeats : isZarqa ? ZarqaSeats : BalqaSeats;
      const demandLabel = showHeatmap && seatCount > 0 ? ` (${seatCount})` : '';

      ctx.fillText(`${gov.name.split(' ')[0]}${demandLabel}`, gov.coords.x, gov.coords.y - 14);
    });

    // Draw pending passenger requests waiting to be picked up
    requests.forEach(req => {
      if (req.status === 'pending' || req.status === 'pooling') {
        const coords = getLocationCoords(req.fromArea);
        
        let drawX = coords.x;
        let drawY = coords.y;
        
        // Obfuscate if privacy shield is active
        if (geoPrivacyActive) {
          const hashVal = req.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
          drawX += ((hashVal % 16) - 8);
          drawY += (((hashVal >> 2) % 16) - 8);
        }

        // Pulsing Ring for passenger request
        const pulseRadius = 10 + (ticker % 10);
        ctx.strokeStyle = geoPrivacyActive ? '#818cf844' : '#ef444455';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(drawX, drawY, pulseRadius, 0, 2 * Math.PI);
        ctx.stroke();

        // Pin Point
        ctx.fillStyle = geoPrivacyActive ? '#6366f1' : '#ef4444';
        ctx.beginPath();
        ctx.arc(drawX, drawY, 5, 0, 2 * Math.PI);
        ctx.fill();

        // Labels
        ctx.fillStyle = geoPrivacyActive ? '#c7d2fe' : '#fca5a5';
        ctx.font = '9px system-ui';
        ctx.fillText(`👤 ${req.passengerName.split(' ')[0]} (${req.seatsCount})`, drawX, drawY + 15);
      }
    });

    // Draw Drivers on map
    drivers.forEach(driver => {
      const isFree = !driver.activeRideId;
      const isOnline = driver.isOnline;
      const isLicExpired = driver.licenseExpiry < new Date().toISOString().split('T')[0];
      const hasRealGps = !!(driver.currentLocation?.lat && driver.currentLocation?.lng);

      let drawX = driver.currentLocation.x;
      let drawY = driver.currentLocation.y;

      // If driver has real GPS coordinates, convert them to 2D canvas coordinates
      if (hasRealGps) {
        const realCanvas = getCanvasCoordsFromGeo(driver.currentLocation.lat!, driver.currentLocation.lng!);
        drawX = realCanvas.x;
        drawY = realCanvas.y;
      }

      // Obfuscate coordinates dynamically with a stable offset per driver ID ONLY if privacy shield is active
      if (geoPrivacyActive) {
        const hashVal = driver.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        drawX += ((hashVal % 16) - 8);
        drawY += (((hashVal >> 2) % 16) - 8);
      }

      if (!isOnline && isFree) {
        // Gray node for offline drivers
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(drawX, drawY, 6, 0, 2 * Math.PI);
        ctx.fill();
        return;
      }

      // Live driver with beautiful neon theme
      const driverColor = isLicExpired ? '#ef4444' : isFree ? '#10b981' : '#3b82f6';
      
      // GPS Satellite Lock ring if real GPS is connected
      if (hasRealGps) {
        const gpsPulse = 14 + (ticker % 8);
        ctx.strokeStyle = '#06b6d488';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(drawX, drawY, gpsPulse, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Halo Ring / Obfuscated Shield
      ctx.strokeStyle = geoPrivacyActive ? 'rgba(99, 102, 241, 0.25)' : `${driverColor}33`;
      ctx.lineWidth = geoPrivacyActive ? 3.5 : 1.5;
      ctx.beginPath();
      ctx.arc(drawX, drawY, geoPrivacyActive ? 16 : 12, 0, 2 * Math.PI);
      ctx.stroke();

      // Pointer icon (Simulating car angle orientation)
      ctx.fillStyle = geoPrivacyActive ? '#6366f1' : (hasRealGps ? '#06b6d4' : driverColor);
      ctx.beginPath();
      ctx.arc(drawX, drawY, 6, 0, 2 * Math.PI);
      ctx.fill();

      // Name & GPS status label
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '10px Cairo, Tajawal, sans-serif';
      const gpsTag = hasRealGps ? '🛰️' : '🚕';
      ctx.fillText(`${gpsTag} ${driver.fullName.split(' ')[0]}`, drawX, drawY - 10);

      // Status Indicator dot (or Shield check icon if privacy active)
      ctx.fillStyle = geoPrivacyActive ? '#a5b4fc' : (driver.balance <= 0 ? '#f59e0b' : '#10b981');
      ctx.beginPath();
      ctx.arc(drawX + 8, drawY + 8, 3.5, 0, 2 * Math.PI);
      ctx.fill();

      if (hasRealGps && driver.currentLocation.speed && driver.currentLocation.speed > 0) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = '8px monospace';
        ctx.fillText(`${driver.currentLocation.speed} km/h`, drawX, drawY + 18);
      }
    });

    // 🛰️ Draw Device Real GPS Location on Canvas
    if (deviceGps && showDeviceLocation) {
      const devCanvas = getCanvasCoordsFromGeo(deviceGps.lat, deviceGps.lng);
      const devX = devCanvas.x;
      const devY = devCanvas.y;

      // Accuracy ring in meters (mapped to canvas radius)
      const accPx = Math.max(10, Math.min(50, Math.round((deviceGps.accuracy / 100) * 25)));
      ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(devX, devY, accPx, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Pulsing radar ripple
      const devPulse = 10 + (ticker % 12);
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(devX, devY, devPulse, 0, 2 * Math.PI);
      ctx.stroke();

      // Center Pin
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(devX, devY, 7, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(devX, devY, 3, 0, 2 * Math.PI);
      ctx.fill();

      // Device GPS Label Banner
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9.5px Cairo, Tajawal, sans-serif';
      ctx.fillText(`📍 موقع جهازك الفعلي (±${deviceGps.accuracy}م)`, devX, devY - 14);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.fillText(`${deviceGps.lat.toFixed(4)}, ${deviceGps.lng.toFixed(4)}`, devX, devY + 16);
    }

    // Draw Live Travels for Active Rides
    rides.forEach(ride => {
      if (ride.status === 'started' && ride.driverId) {
        const driver = drivers.find(d => d.id === ride.driverId);
        if (!driver) return;

        const fromC = getLocationCoords(ride.fromArea);
        const toC = getLocationCoords(ride.toArea);

        let drawFromX = fromC.x;
        let drawFromY = fromC.y;
        let drawToX = toC.x;
        let drawToY = toC.y;

        if (geoPrivacyActive) {
          const hashVal = ride.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
          drawFromX += ((hashVal % 12) - 6);
          drawFromY += (((hashVal >> 1) % 12) - 6);
          drawToX += (((hashVal >> 2) % 12) - 6);
          drawToY += (((hashVal >> 3) % 12) - 6);
        }

        const hasRequests = ride.requests && ride.requests.length >= 1;

        if (hasRequests) {
          const pointsSeq: Point[] = [];
          pointsSeq.push({ x: drawFromX, y: drawFromY });

          ride.requests.forEach((req, idx) => {
            const reqC = getLocationCoords(req.fromArea);
            let rx = reqC.x;
            let ry = reqC.y;
            if (geoPrivacyActive) {
              const hashVal = req.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
              rx += ((hashVal % 16) - 8);
              ry += (((hashVal >> 2) % 16) - 8);
            }
            pointsSeq.push({ x: rx, y: ry });
          });

          pointsSeq.push({ x: drawToX, y: drawToY });

          const totalSegments = pointsSeq.length - 1;
          const speed = 0.008; // slower for multi-point pooled trip
          const journeyPercent = ((ticker * speed) % 1.0);
          
          const scaledPercent = journeyPercent * totalSegments;
          const activeSegmentIdx = Math.min(Math.floor(scaledPercent), totalSegments - 1);
          const segmentPercent = scaledPercent - activeSegmentIdx;
          
          const activeP0 = pointsSeq[activeSegmentIdx];
          const activeP2 = pointsSeq[activeSegmentIdx + 1];
          const activeP1 = getControlPoint(activeP0, activeP2, curveStrength);
          const bPoint = getBezierPoint(activeP0, activeP1, activeP2, segmentPercent);
          
          let curX = bPoint.x;
          let curY = bPoint.y;

          // Drive there
          driver.currentLocation.x = Math.round(curX);
          driver.currentLocation.y = Math.round(curY);

          // Draw the sequential path segments
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 2;
          for (let i = 0; i < pointsSeq.length - 1; i++) {
            const segP0 = pointsSeq[i];
            const segP2 = pointsSeq[i + 1];
            const segP1 = getControlPoint(segP0, segP2, curveStrength);

            ctx.strokeStyle = geoPrivacyActive ? 'rgba(129, 140, 248, 0.45)' : '#fbbf24aa';
            ctx.beginPath();
            ctx.moveTo(segP0.x, segP0.y);
            ctx.quadraticCurveTo(segP1.x, segP1.y, segP2.x, segP2.y);
            ctx.stroke();
          }
          ctx.setLineDash([]); // Reset

          // Draw passenger pickup nodes
          for (let i = 1; i < pointsSeq.length - 1; i++) {
            const pt = pointsSeq[i];
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
            ctx.fill();

            // Ring
            ctx.strokeStyle = '#ffffffaa';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 7, 0, 2 * Math.PI);
            ctx.stroke();
          }

          // Draw animated vehicle on route
          ctx.fillStyle = geoPrivacyActive ? '#818cf8' : '#fbbf24';
          ctx.beginPath();
          ctx.arc(curX, curY, 8, 0, 2 * Math.PI);
          ctx.fill();

          // Overlay symbol
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 8px system-ui';
          ctx.fillText("Adam", curX, curY + 3);

          ctx.fillStyle = geoPrivacyActive ? '#c7d2fe' : '#fbbf24';
          ctx.font = '9px Tajawal, sans-serif';
          ctx.fillText(`🚗 مسار تجميع مكرر لـ (${ride.requests.length}) ركاب`, curX, curY - 14);

        } else {
          // Draw curved progress path line matching the SVG using d3-equivalent quadratic Bezier math
          const p0 = { x: drawFromX, y: drawFromY };
          const p2 = { x: drawToX, y: drawToY };
          const p1 = getControlPoint(p0, p2, curveStrength);

          ctx.strokeStyle = geoPrivacyActive ? 'rgba(99, 102, 241, 0.35)' : '#38bdf888';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
          ctx.stroke();
          ctx.setLineDash([]); // Reset

          // Calculate simulated moving position along curve
          const speed = 0.015;
          const journeyPercent = ((ticker * speed) % 1.0);
          const bPoint = getBezierPoint(p0, p1, p2, journeyPercent);
          
          let curX = bPoint.x;
          let curY = bPoint.y;

          // Drive there
          driver.currentLocation.x = Math.round(curX);
          driver.currentLocation.y = Math.round(curY);

          // Draw animated vehicle on route
          ctx.fillStyle = geoPrivacyActive ? '#818cf8' : '#38bdf8';
          ctx.beginPath();
          ctx.arc(curX, curY, 8, 0, 2 * Math.PI);
          ctx.fill();

          // Overlay symbol
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 8px system-ui';
          ctx.fillText("Adam", curX, curY + 3);

          ctx.fillStyle = geoPrivacyActive ? '#c7d2fe' : '#93c5fd';
          ctx.font = '9px Tajawal, sans-serif';
          ctx.fillText(`🚗 رحلة تجميعية نشطة (${ride.requests.reduce((sum, r) => sum + r.seatsCount, 0)} ركاب)`, curX, curY - 14);
        }
      }
    });

    // Draw Speed Cameras / Radars if enabled
    if (showRadars) {
      speedCameras.forEach(cam => {
        // Apply filters
        if (cam.type === 'fixed' && !showFixedCameras) return;
        if (cam.type === 'mobile' && !showMobileCameras) return;
        if (selectedGovFilter !== 'all' && cam.governorate !== selectedGovFilter) return;
        if (!cam.isActive) return;

        const isMobile = cam.type === 'mobile';
        const isFlashed = cam.id === flashRadarId;

        // Pulsing range indicating radar active zone
        const pulseColor = isFlashed 
          ? 'rgba(251, 191, 36, 0.6)' 
          : isMobile 
            ? 'rgba(245, 158, 11, 0.3)' 
            : 'rgba(239, 68, 68, 0.25)';
        
        const radarPulse = (isFlashed ? 22 : 14) + (ticker % 6) * (isMobile || isFlashed ? 1.5 : 1);
        
        ctx.strokeStyle = pulseColor;
        ctx.lineWidth = isFlashed ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.arc(cam.x, cam.y, radarPulse, 0, 2 * Math.PI);
        ctx.stroke();

        // Extra outer circle for mobile radars to simulate spinning radar sweeping waves
        if (isMobile || isFlashed) {
          ctx.strokeStyle = isFlashed ? 'rgba(251, 191, 36, 0.15)' : 'rgba(245, 158, 11, 0.15)';
          ctx.beginPath();
          ctx.arc(cam.x, cam.y, 25, 0, 2 * Math.PI);
          ctx.stroke();

          ctx.save();
          ctx.translate(cam.x, cam.y);
          ctx.rotate((ticker * (isFlashed ? 0.15 : 0.08)) % (2 * Math.PI));
          ctx.strokeStyle = isFlashed ? 'rgba(251, 191, 36, 0.5)' : 'rgba(245, 158, 11, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(25, 0);
          ctx.stroke();
          ctx.restore();
        }

        // Inner glowing radial gradient for radar
        const grad = ctx.createRadialGradient(cam.x, cam.y, 1, cam.x, cam.y, 14);
        if (isFlashed) {
          grad.addColorStop(0, 'rgba(251, 191, 36, 0.55)');
          grad.addColorStop(1, 'transparent');
        } else if (isMobile) {
          grad.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
          grad.addColorStop(1, 'transparent');
        } else {
          grad.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
          grad.addColorStop(1, 'transparent');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cam.x, cam.y, 14, 0, 2 * Math.PI);
        ctx.fill();

        // Core camera point
        ctx.fillStyle = isFlashed ? '#fbbf24' : isMobile ? '#f59e0b' : '#ef4444'; // Gold, Orange, or Red
        ctx.beginPath();
        ctx.arc(cam.x, cam.y, isFlashed ? 6.5 : 5, 0, 2 * Math.PI);
        ctx.fill();

        // White/Gold border ring
        ctx.strokeStyle = isFlashed ? '#fbbf24' : '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cam.x, cam.y, isFlashed ? 8.5 : 7, 0, 2 * Math.PI);
        ctx.stroke();

        // Radar Speed limit label (Arabic display)
        ctx.fillStyle = isFlashed ? '#fde047' : '#f8fafc';
        ctx.font = isFlashed ? 'bold 10px Tajawal, Cairo, sans-serif' : 'bold 9px Tajawal, Cairo, sans-serif';
        ctx.textAlign = 'center';
        
        const typeEmoji = isMobile ? '📡' : '📸';
        ctx.fillText(`${typeEmoji} رادار ${cam.speedLimit} كم/س`, cam.x, cam.y - (isFlashed ? 15 : 12));
        
        // Also draw small location name
        ctx.fillStyle = isFlashed ? '#fbbf24' : '#94a3b8';
        ctx.font = '7px Tajawal, Cairo, sans-serif';
        ctx.fillText(cam.name.split(' ')[1] || cam.name, cam.x, cam.y + (isFlashed ? 17 : 14));
      });
    }

    // Draw Placement Mode Guide on canvas
    if (placementMode && mousePos) {
      ctx.save();
      // Pulsing orange placement radius
      const pulseRad = 20 + (ticker % 4) * 2;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, 25, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, pulseRad, 0, 2 * Math.PI);
      ctx.stroke();

      // Crosshair lines
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(mousePos.x - 10, mousePos.y);
      ctx.lineTo(mousePos.x + 10, mousePos.y);
      ctx.moveTo(mousePos.x, mousePos.y - 10);
      ctx.lineTo(mousePos.x, mousePos.y + 10);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 9.5px Tajawal, Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`📡 انقر لزراعة رادار متحرك (${placementLimit} كم/س)`, mousePos.x, mousePos.y - 32);
      ctx.restore();
    }

  }, [
    drivers, rides, requests, ticker, showHeatmap, showRouteHeat, showRadars, geoPrivacyActive, curveStrength,
    speedCameras, showFixedCameras, showMobileCameras, selectedGovFilter, placementMode, mousePos, placementLimit, placementGov, flashRadarId,
    deviceGps, showDeviceLocation
  ]);

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] border border-[#1e293b] rounded-2xl overflow-hidden shadow-2xl">
      {/* Map Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0f172a] to-[#0b1329] border-b border-[#1e293b] flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Orbit className="w-5 h-5 text-emerald-400 animate-spin-slow" />
          <h2 className="text-sm font-semibold text-slate-100 font-sans tracking-tight">محاكي الخريطة الحية والتجميع التلقائي</h2>
        </div>
        <div className="flex items-center gap-3.5 flex-wrap">
          {/* Flame styled premium toggle filter button */}
          <button 
            type="button"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition duration-150 border cursor-pointer select-none outline-none ${
              showHeatmap 
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25 shadow-sm shadow-[#f59e0b11]' 
                : 'bg-slate-900 text-slate-450 border-slate-800 hover:text-slate-300 hover:bg-slate-850'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
            <span>كثافة المحافظات 🔥</span>
          </button>

          {/* High-demand frequent routes heatmap toggle */}
          <button 
            type="button"
            onClick={() => setShowRouteHeat(!showRouteHeat)}
            className={`px-3 py-1 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition duration-150 border cursor-pointer select-none outline-none ${
              showRouteHeat 
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25 shadow-sm shadow-[#f43f5e11]' 
                : 'bg-slate-900 text-slate-450 border-slate-800 hover:text-slate-300 hover:bg-slate-850'
            }`}
          >
            <Map className={`w-3.5 h-3.5 ${showRouteHeat ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
            <span>ممرات الطلب الساخنة 🗺️</span>
          </button>

          {/* Radar & speed cameras checking toggle */}
          <button 
            type="button"
            onClick={() => setShowRadars(!showRadars)}
            className={`px-3 py-1 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition duration-150 border cursor-pointer select-none outline-none ${
              showRadars 
                ? 'bg-orange-500/15 text-orange-400 border-orange-500/30 hover:bg-orange-500/25 shadow-sm shadow-[#f9731611]' 
                : 'bg-slate-900 text-slate-450 border-slate-800 hover:text-slate-300 hover:bg-slate-850'
            }`}
          >
            <Radar className={`w-3.5 h-3.5 ${showRadars ? 'text-orange-400 animate-pulse' : 'text-slate-500'}`} />
            <span>كاميرات الرادارات 📸</span>
          </button>

          <div className="flex gap-3 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1 bg-slate-950/40 px-2 py-0.5 rounded border border-slate-850">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span> كابتن متاح
            </span>
            <span className="flex items-center gap-1 bg-slate-950/40 px-2 py-0.5 rounded border border-slate-850">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block"></span> رحلة منطلقة
            </span>
            <span className="flex items-center gap-1 flex-row-reverse bg-slate-950/40 px-2 py-0.5 rounded border border-slate-850">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block"></span> طلب راكب
            </span>
          </div>
        </div>
      </div>

      {/* 🛰️ Live GPS & Geolocation Engine Status Bar */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-[#080d1a] border-b border-slate-850/80 text-xs flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Device GPS telemetry pill */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-lg">
            <div className="relative flex items-center justify-center">
              <span className={`w-2.5 h-2.5 rounded-full ${deviceGps ? 'bg-cyan-400' : 'bg-amber-400'} inline-block`}></span>
              <span className={`absolute w-4 h-4 rounded-full ${deviceGps ? 'bg-cyan-400/40 animate-ping' : ''}`}></span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="text-slate-400 font-sans font-medium">GPS الجهاز الفعلي:</span>
              {deviceGps ? (
                <span className="text-cyan-300 font-bold">
                  {deviceGps.lat.toFixed(4)}°N, {deviceGps.lng.toFixed(4)}°E (±{deviceGps.accuracy}م)
                </span>
              ) : (
                <span className="text-amber-300 font-sans">جاري التحقق من الإشارة...</span>
              )}
            </div>
          </div>

          {/* Real GPS Connected Drivers Badge */}
          {(() => {
            const realGpsCount = drivers.filter(d => d.currentLocation?.lat && d.currentLocation?.lng).length;
            return (
              <div className="flex items-center gap-1.5 bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 px-2.5 py-1 rounded-lg text-[11px] font-sans">
                <Satellite className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>كباتن الـ GPS الحقيقي المتصلين: <strong>{realGpsCount}</strong></span>
              </div>
            );
          })()}
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Device Location Visibility on canvas */}
          <button
            type="button"
            onClick={() => setShowDeviceLocation(!showDeviceLocation)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-bold flex items-center gap-1.5 transition border cursor-pointer ${
              showDeviceLocation 
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/25' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <Locate className="w-3 h-3" />
            <span>موقع الجهاز {showDeviceLocation ? 'معروض 📍' : 'مخفي'}</span>
          </button>

          {/* Periodic & Instant GPS Sync Refresh Button */}
          <button
            type="button"
            onClick={refreshGpsNow}
            disabled={gpsRefreshing}
            className="px-2.5 py-1 rounded-lg text-[11px] font-sans font-bold flex items-center gap-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:bg-slate-850 hover:border-cyan-500/30 transition cursor-pointer disabled:opacity-50"
            title="فحص فوري وتحديث دوري للإحداثيات الحقيقية"
          >
            <RefreshCw className={`w-3 h-3 text-cyan-400 ${gpsRefreshing ? 'animate-spin' : ''}`} />
            <span>{gpsRefreshing ? 'جاري المزامنة...' : 'مزامنة GPS الآن'}</span>
          </button>
        </div>
      </div>

      {/* Main Map Visual Canvas with D3 Curved SVG Paths Overlay */}
      <div className="relative flex-1 bg-[#0b0f1a] overflow-hidden min-h-[365px] flex items-center justify-center">
        <canvas 
          ref={canvasRef} 
          width={440} 
          height={400} 
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
          className={`w-full h-full max-w-full block ${placementMode ? 'cursor-crosshair' : ''}`}
          style={{ objectFit: 'cover' }}
        />

        {/* Real-time Radar Alerts overlay */}
        {activeWarnings.length > 0 && showRadars && (
          <div className="absolute top-4 left-4 right-4 z-20 flex flex-col gap-2 pointer-events-none animate-bounce">
            {activeWarnings.map((warning, idx) => (
              <div 
                key={idx} 
                className="bg-red-950/90 border border-red-500/50 text-red-200 px-4 py-2 rounded-xl text-xs font-sans font-bold flex items-center justify-between shadow-lg shadow-red-950/50 backdrop-blur-md"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
                  <span>تنبيه اقتراب رادار: الكابتن {warning.driverName.split(' ')[0]} يقترب من {warning.radarName}</span>
                </div>
                <span className="bg-red-500/20 border border-red-500/40 text-red-300 px-2 py-0.5 rounded-full font-mono text-[10px]">
                  السرعة: {warning.speedLimit} كم/س
                </span>
              </div>
            ))}
          </div>
        )}

        {/* --- D3 Curved SVG Paths Overlay --- */}
        <svg
          viewBox="0 0 440 400"
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ objectFit: 'cover' }}
        >
          <defs>
            {/* Glowing filter effects */}
            <filter id="glow-route-strong" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-route-normal" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            {/* Gradient Definitions */}
            <linearGradient id="gradient-ride" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="gradient-request" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#be123c" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="gradient-selected" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="1.0" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="1.0" />
            </linearGradient>
          </defs>

          {routesToRender.map(route => {
            const p0 = route.fromC;
            const p2 = route.toC;
            const isSelected = selectedRouteId === route.id;
            const shouldRender = showAllRoutes || isSelected;

            if (!shouldRender) return null;

            const filterId = glowIntensity === 'strong' ? 'url(#glow-route-strong)' : 'url(#glow-route-normal)';

            if (route.isPooledPath && route.pointsSeq && route.pointsSeq.length > 2) {
              const points = route.pointsSeq;
              const totalSegments = points.length - 1;
              const speedMultiplier = 0.008; // slower since it's a long multi-point trip
              const journeyPercent = ((ticker * speedMultiplier) % 1.0);
              
              // Find the active segment for the traveler
              const scaledPercent = journeyPercent * totalSegments;
              const activeSegmentIdx = Math.min(Math.floor(scaledPercent), totalSegments - 1);
              const segmentPercent = scaledPercent - activeSegmentIdx;
              
              const activeP0 = points[activeSegmentIdx];
              const activeP2 = points[activeSegmentIdx + 1];
              const activeP1 = getControlPoint(activeP0, activeP2, curveStrength);
              const travelerPos = getBezierPoint(activeP0, activeP1, activeP2, segmentPercent);
              
              const strokeColor = isSelected 
                ? 'url(#gradient-selected)' 
                : '#f59e0b'; // Premium Gold/Amber for pooled routes
              
              const strokeWidth = isSelected ? 4 : 2.5;

              return (
                <g key={route.id} className="transition-all duration-300">
                  {/* Draw each segment with unique curves */}
                  {points.map((pt, idx) => {
                    if (idx === points.length - 1) return null;
                    const segP0 = pt;
                    const segP2 = points[idx + 1];
                    const segP1 = getControlPoint(segP0, segP2, curveStrength);
                    
                    const segPathObj = d3.path();
                    segPathObj.moveTo(segP0.x, segP0.y);
                    segPathObj.quadraticCurveTo(segP1.x, segP1.y, segP2.x, segP2.y);
                    const segDPath = segPathObj.toString();
                    
                    if (!segDPath) return null;

                    return (
                      <g key={idx}>
                        {isSelected && (
                          <path
                            d={segDPath}
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth={8}
                            strokeOpacity={0.25}
                            filter={filterId}
                          />
                        )}
                        <path
                          d={segDPath}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                          strokeDasharray={idx < points.length - 2 ? "5 3" : "2 2"} // custom style for pickup segments vs final leg
                          filter={isSelected ? 'url(#glow-route-strong)' : filterId}
                        />
                      </g>
                    );
                  })}

                  {/* Draw intermediate pickup points / sequence badges */}
                  {points.map((pt, idx) => {
                    const isStart = idx === 0;
                    const isEnd = idx === points.length - 1;
                    const isPickup = !isStart && !isEnd;

                    return (
                      <g key={idx} transform={`translate(${pt.x}, ${pt.y})`}>
                        {isStart ? (
                          <>
                            <circle r={5} fill="#38bdf8" />
                            <circle r={8} fill="none" stroke="#38bdf8" strokeWidth={1} className="animate-pulse" />
                          </>
                        ) : isEnd ? (
                          <>
                            <circle r={5} fill="#10b981" />
                          </>
                        ) : (
                          <>
                            {/* Glowing pickup node with badge */}
                            <circle r={7} fill="#fbbf24" />
                            <circle r={10} fill="none" stroke="#fbbf24" strokeWidth={1.5} className="animate-ping" style={{ animationDuration: '3s' }} />
                            
                            {/* Sequence number inside */}
                            <text
                              y={3}
                              textAnchor="middle"
                              fill="#0f172a"
                              fontSize="8.5px"
                              fontWeight="bold"
                              fontFamily="sans-serif"
                            >
                              {idx}
                            </text>

                            {/* Passenger Name Label above */}
                            <text
                              y={-12}
                              textAnchor="middle"
                              fill="#fde047"
                              fontSize="8.5px"
                              fontWeight="black"
                              fontFamily="Tajawal, sans-serif"
                            >
                              {pt.name ? `👤 التقاط ${pt.name}` : `📍 نقطة تجميع`}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}

                  {/* Running Vehicle along the entire pooled curve */}
                  <g transform={`translate(${travelerPos.x}, ${travelerPos.y})`}>
                    <circle
                      cx={0}
                      cy={0}
                      r={7 + (ticker % 4) * 2}
                      fill="none"
                      stroke={isSelected ? '#fbbf24' : '#fbbf24'}
                      strokeWidth={1}
                      strokeOpacity={0.4}
                    />
                    <circle
                      cx={0}
                      cy={0}
                      r={4.5}
                      fill="#ffffff"
                    />
                  </g>
                </g>
              );
            }

            // Generate SVG path definition using D3's path serializer for quadratic Bezier curves
            const pathObj = d3.path();
            pathObj.moveTo(p0.x, p0.y);
            const p1 = getControlPoint(p0, p2, curveStrength);
            pathObj.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
            const dPath = pathObj.toString();

            if (!dPath) return null;

            // Intersecting dynamic traveling speed ticker
            const speedMultiplier = route.type === 'ride' ? 0.015 : 0.01;
            const journeyPercent = ((ticker * speedMultiplier) % 1.0);
            const travelerPos = getBezierPoint(p0, p1, p2, journeyPercent);

            const isRide = route.type === 'ride';
            const strokeColor = isSelected 
              ? 'url(#gradient-selected)' 
              : isRide 
                ? 'url(#gradient-ride)' 
                : 'url(#gradient-request)';
            
            const strokeWidth = isSelected ? 4 : 2;

            return (
              <g key={route.id} className="transition-all duration-300">
                {/* Highlight Glow Underlayer */}
                {isSelected && (
                  <path
                    d={dPath}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={8}
                    strokeOpacity={0.25}
                    filter={filterId}
                  />
                )}

                {/* Primary Animated curved path */}
                <path
                  d={dPath}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isSelected ? "10 3" : isRide ? "7 5" : "3 3"}
                  filter={isSelected ? 'url(#glow-route-strong)' : filterId}
                  className="transition-all duration-500"
                />

                {/* Terminus Endpoints */}
                <circle cx={p0.x} cy={p0.y} r={isSelected ? 4.5 : 3} fill={isRide ? '#38bdf8' : '#f43f5e'} className="animate-pulse" />
                <circle cx={p2.x} cy={p2.y} r={isSelected ? 4.5 : 3} fill={isSelected ? '#fbbf24' : '#10b981'} />

                {/* Running Particle along the D3 curved curve */}
                <g transform={`translate(${travelerPos.x}, ${travelerPos.y})`}>
                  {/* Expanding halo ripple */}
                  <circle
                    cx={0}
                    cy={0}
                    r={6 + (ticker % 4) * 2}
                    fill="none"
                    stroke={isSelected ? '#fbbf24' : isRide ? '#38bdf8' : '#f43f5e'}
                    strokeWidth={1}
                    strokeOpacity={0.3}
                  />
                  {/* Glowing center particle */}
                  <circle
                    cx={0}
                    cy={0}
                    r={3.5}
                    fill={isSelected ? '#fbbf24' : isRide ? '#bae6fd' : '#fecdd3'}
                  />
                </g>
              </g>
            );
          })}
        </svg>

        {/* --- Interactive D3 Route Tracer Panel (Top-Left) --- */}
        <div className="absolute top-4 left-4 bg-slate-900/95 border border-slate-800 p-2.5 rounded-lg text-[10px] text-slate-300 font-sans max-w-[215px] flex flex-col gap-1.5 backdrop-blur-md z-20 shadow-xl">
          <button
            type="button"
            onClick={() => setIsTracerHubExpanded(!isTracerHubExpanded)}
            className="font-bold border-b border-slate-800 pb-1 text-sky-400 text-xs flex items-center justify-between gap-1 w-full text-right outline-none cursor-pointer"
          >
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>مستكشف المسارات المنحنية (D3)</span>
            </span>
            <span className="text-slate-500 text-[8px]">{isTracerHubExpanded ? '▽' : '▷'}</span>
          </button>

          {isTracerHubExpanded && (
            <div className="flex flex-col gap-2">
              <span className="text-[8.5px] text-slate-405 leading-relaxed text-right block">
                اختر أي من المسارات الفعالة أو المحاكاة حالياً لعرض وتعديل المنحنى الرابط باستخدام مولد المسارات D3:
              </span>

              {/* Curvature adjustment slider */}
              <div className="bg-slate-950/55 p-1.5 rounded border border-slate-850 flex flex-col gap-1 text-right">
                <div className="flex justify-between items-center flex-row-reverse text-[8px]">
                  <span className="text-slate-400 font-bold">تقوس المسار البيني:</span>
                  <span className="font-mono text-sky-400 font-black">{Math.round(curveStrength * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.45"
                  step="0.05"
                  value={curveStrength}
                  onChange={e => setCurveStrength(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>

              {/* Toggles */}
              <div className="flex justify-between items-center flex-row-reverse text-[8px] bg-slate-955/40 p-1 rounded border border-slate-850/50">
                <span className="text-slate-400">رسم كافة المسارات معاً</span>
                <input
                  type="checkbox"
                  checked={showAllRoutes}
                  onChange={e => setShowAllRoutes(e.target.checked)}
                  className="rounded bg-slate-800 border-none cursor-pointer text-sky-600 focus:ring-0"
                />
              </div>

              <div className="flex justify-between items-center flex-row-reverse text-[8px] bg-slate-955/40 p-1 rounded border border-slate-850/50">
                <span className="text-slate-400">وهج راداري فائق</span>
                <button
                  type="button"
                  onClick={() => setGlowIntensity(g => g === 'strong' ? 'normal' : 'strong')}
                  className={`px-1 rounded text-[7px] font-bold ${glowIntensity === 'strong' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}
                >
                  {glowIntensity === 'strong' ? 'نشط 🔥' : 'هادئ ❄️'}
                </button>
              </div>

              {/* Route listing selection */}
              <div className="border-t border-slate-800 pt-1 flex flex-col gap-1 max-h-[110px] overflow-y-auto scrollbar-thin">
                <span className="text-[8px] font-bold text-slate-400 text-right">اختر مساراً للمعاينة والبيانات:</span>
                {routesToRender.map(route => {
                  const isSelected = selectedRouteId === route.id;
                  const isDemo = route.id.startsWith('demo-');
                  return (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => setSelectedRouteId(isSelected ? null : route.id)}
                      className={`w-full text-right p-1.5 rounded transition text-[8.5px] border flex items-center justify-between flex-row-reverse ${
                        isSelected 
                          ? 'bg-gradient-to-l from-slate-850 to-slate-900 border-amber-500/50 text-amber-300' 
                          : 'bg-slate-950/40 border-slate-850 hover:bg-slate-850/50 text-slate-350'
                      }`}
                    >
                      <span className="flex items-center gap-1 flex-row-reverse truncate max-w-[130px]">
                        <span className={`w-1.5 h-1.5 rounded-full ${route.type === 'ride' ? 'bg-sky-400' : 'bg-rose-500'}`}></span>
                        <span className="font-bold truncate">{route.label}</span>
                      </span>
                      <span className="text-[7.5px] font-mono shrink-0 px-1 bg-slate-900/60 rounded">
                        {route.from.split(' ')[0]} ➔ {route.to.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Highlight route details and efficiency metrics */}
              {selectedRouteId && (
                (() => {
                  const r = routesToRender.find(route => route.id === selectedRouteId);
                  if (!r) return null;
                  return (
                    <div className="border-t border-slate-850 pt-2 flex flex-col gap-1 text-[8.5px] bg-slate-950/80 p-1.5 rounded border border-slate-800 text-right animate-fade-in">
                      <div className="font-bold text-amber-400 mb-0.5 border-b border-slate-900 pb-0.5">📊 إحصائيات تقرير المسار والوفر:</div>
                      <div className="flex justify-between flex-row-reverse text-slate-350">
                        <span>المسافة المباشرة:</span>
                        <span className="font-mono text-slate-200">{r.distanceKm} كم</span>
                      </div>
                      <div className="flex justify-between flex-row-reverse text-slate-350">
                        <span>الزمن التقريبي:</span>
                        <span className="font-mono text-slate-200">{Math.round(r.distanceKm * 1.3)} دقيقة</span>
                      </div>
                      {r.savedFuelPercent > 0 && (
                        <div className="flex justify-between flex-row-reverse text-emerald-400 font-bold">
                          <span>توفر وقود التجميع السريع:</span>
                          <span className="font-mono">%{r.savedFuelPercent}</span>
                        </div>
                      )}
                      <div className="text-[7.5px] text-slate-400 mt-1 leading-relaxed">
                        • مسار انسيابي فائق المرونة معمد تلقائياً وفق خوارزميات آدم لترشيد الاستهلاك.
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>

        {geoPrivacyActive && (
          <div className="absolute bottom-4 right-4 bg-indigo-950/90 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-[9px] text-indigo-300 font-sans flex items-center gap-1.5 backdrop-blur-md shadow-lg animate-pulse z-20">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full inline-block"></span>
            <span>🛡️ تشفير الموقع الجغرافي نشط (GPS Encrypted)</span>
          </div>
        )}

        {/* --- Jordan Live Speed Cameras & Radar Panel (Bottom-Left) --- */}
        <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-slate-800 p-2.5 rounded-lg text-[10px] text-slate-300 font-sans w-[235px] flex flex-col gap-1.5 backdrop-blur-md z-20 shadow-xl max-h-[300px] overflow-hidden">
          <button
            type="button"
            onClick={() => setIsRadarHubExpanded(!isRadarHubExpanded)}
            className="font-bold border-b border-slate-800 pb-1 text-orange-400 text-xs flex items-center justify-between gap-1 w-full text-right outline-none cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Radar className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
              <span>رادارات وكاميرات الأردن الحية 📸</span>
            </span>
            <span className="text-slate-500 text-[8px]">{isRadarHubExpanded ? '▽' : '▷'}</span>
          </button>

          {isRadarHubExpanded && (
            <div className="flex flex-col gap-2 overflow-y-auto pr-0.5 scrollbar-thin flex-1 max-h-[250px]">
              {/* Type Filtering switches */}
              <div className="bg-slate-950/60 p-1.5 rounded border border-slate-850 flex flex-col gap-1 text-right">
                <span className="text-[8.5px] font-bold text-slate-400">تصفية أنواع أجهزة الرادار:</span>
                
                <label className="flex items-center justify-between flex-row-reverse text-[8px] cursor-pointer hover:text-slate-200 select-none">
                  <span className="flex items-center gap-1.5">
                    <span>كاميرات ثابتة 📸</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showFixedCameras}
                    onChange={e => setShowFixedCameras(e.target.checked)}
                    className="rounded bg-slate-800 border-none cursor-pointer text-orange-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between flex-row-reverse text-[8px] cursor-pointer hover:text-slate-200 select-none">
                  <span className="flex items-center gap-1.5">
                    <span>رادارات متحركة (دوريات) 📡</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showMobileCameras}
                    onChange={e => setShowMobileCameras(e.target.checked)}
                    className="rounded bg-slate-800 border-none cursor-pointer text-orange-500 focus:ring-0"
                  />
                </label>
              </div>

              {/* Governorate Filtering drop-down */}
              <div className="flex justify-between items-center flex-row-reverse text-[8.5px] bg-slate-950/60 p-1.5 rounded border border-slate-850">
                <span className="text-slate-400 font-bold shrink-0">المحافظة:</span>
                <select
                  value={selectedGovFilter}
                  onChange={e => setSelectedGovFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 text-[8px] rounded px-1 py-0.5 outline-none cursor-pointer"
                >
                  <option value="all">كل المحافظات 🇯🇴</option>
                  <option value="عمان (Amman)">عمان</option>
                  <option value="إربد (Irbid)">إربد</option>
                  <option value="الزرقاء (Zarqa)">الزرقاء</option>
                  <option value="البلقاء (Balqa)">البلقاء (السلط)</option>
                </select>
              </div>

              {/* Report/Place Mobile Radar */}
              <div className="bg-slate-950/60 p-2 rounded border border-slate-850 flex flex-col gap-1.5 text-right">
                <div className="font-bold text-orange-400 text-[8.5px] flex items-center justify-end gap-1">
                  <span>الإبلاغ الفوري عن رادار متحرك 📡</span>
                </div>

                <div className="flex justify-between items-center gap-1 flex-row-reverse">
                  <span className="text-slate-400 text-[8px]">السرعة:</span>
                  <select
                    value={placementLimit}
                    onChange={e => setPlacementLimit(parseInt(e.target.value))}
                    className="bg-slate-900 border border-slate-800 text-slate-300 text-[8px] rounded px-1 py-0.5 outline-none cursor-pointer flex-1"
                  >
                    <option value={60}>60 كم/س</option>
                    <option value={70}>70 كم/س</option>
                    <option value={80}>80 كم/س</option>
                    <option value={90}>90 كم/س</option>
                    <option value={100}>100 كم/س</option>
                    <option value={110}>110 كم/س</option>
                    <option value={120}>120 كم/س</option>
                  </select>
                </div>

                <div className="flex justify-between items-center gap-1 flex-row-reverse">
                  <span className="text-slate-400 text-[8px]">الموقع:</span>
                  <select
                    value={placementGov}
                    onChange={e => setPlacementGov(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-slate-300 text-[8px] rounded px-1 py-0.5 outline-none cursor-pointer flex-1"
                  >
                    <option value="عمان (Amman)">عمان</option>
                    <option value="إربد (Irbid)">إربد</option>
                    <option value="الزرقاء (Zarqa)">الزرقاء</option>
                    <option value="البلقاء (Balqa)">البلقاء</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setPlacementMode(!placementMode)}
                  className={`w-full py-1 rounded text-[8.5px] font-bold transition duration-150 flex items-center justify-center gap-1 cursor-pointer select-none outline-none ${
                    placementMode 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
                      : 'bg-orange-500/20 text-orange-300 border border-orange-500/40 hover:bg-orange-500/35'
                  }`}
                >
                  <MapPin className="w-3 h-3 text-orange-400" />
                  <span>{placementMode ? 'إلغاء التحديد (انقر الخريطة)' : 'تحديد موقع الرادار على الخريطة 📍'}</span>
                </button>
              </div>

              {/* Mini feed of speed cameras */}
              <div className="flex flex-col gap-1 border-t border-slate-850 pt-1.5">
                <span className="text-[8px] font-bold text-slate-400 text-right block mb-0.5">قائمة الرادارات النشطة بالمنطقة:</span>
                <div className="flex flex-col gap-1 max-h-[85px] overflow-y-auto scrollbar-thin">
                  {speedCameras
                    .filter(cam => {
                      if (cam.type === 'fixed' && !showFixedCameras) return false;
                      if (cam.type === 'mobile' && !showMobileCameras) return false;
                      if (selectedGovFilter !== 'all' && cam.governorate !== selectedGovFilter) return false;
                      return cam.isActive;
                    })
                    .map(cam => {
                      const isFlashed = cam.id === flashRadarId;
                      return (
                        <button
                          key={cam.id}
                          type="button"
                          onMouseEnter={() => setFlashRadarId(cam.id)}
                          onMouseLeave={() => setFlashRadarId(null)}
                          onClick={() => {
                            setFlashRadarId(cam.id);
                            setTimeout(() => setFlashRadarId(null), 3000);
                          }}
                          className={`w-full text-right p-1 rounded transition text-[7.5px] border flex items-center justify-between flex-row-reverse ${
                            isFlashed 
                              ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 font-bold' 
                              : 'bg-slate-950/40 border-slate-850/40 hover:bg-slate-850/30 text-slate-400'
                          }`}
                        >
                          <span className="truncate max-w-[125px] flex items-center gap-1 flex-row-reverse">
                            <span>{cam.type === 'mobile' ? '📡' : '📸'}</span>
                            <span className="truncate">{cam.name}</span>
                          </span>
                          <span className="font-mono bg-slate-900 px-1 rounded shrink-0">
                            {cam.speedLimit} كم/س
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-800 p-2.5 rounded-lg text-[10px] text-slate-300 font-sans max-w-[200px] flex flex-col gap-1.5 backdrop-blur-md z-20">
          <div className="font-bold border-b border-slate-800 pb-1 text-emerald-400 text-xs flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" />
            <span>خادم التجميع المركزي</span>
          </div>
          <div>• سعة المركبة: 4 مقاعد كحد أقصى</div>
          <div>• يتم دمج الركاب ذوي نفس المسار المتقارب</div>
          <div>• يتم تكليف أقرب سائق متاح وتملك رصيداً</div>
          <div>• أجرة المقعد للراكب الواحد: {settings.passengerFarePerSeat} د.أ</div>
          <div>• عمولة آدم لكل راكب تجميعي: {settings.commissionRate} د.أ</div>
          
          {showHeatmap && (
            <div className="border-t border-slate-800 pt-1.5 mt-0.5 flex flex-col gap-1 text-[9px] text-slate-400">
              <div className="font-bold text-amber-500 mb-0.5 text-right">🔥 دليل كثافة الطلبات النشطة:</div>
              <div className="flex items-center gap-1 justify-end">
                <span>طلب خفيف (١-٢ مقعد)</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 border border-emerald-500/80 inline-block"></span>
              </div>
              <div className="flex items-center gap-1 justify-end">
                <span>طلب متوسط (٣-٤ مقاعد)</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40 border border-amber-500/80 inline-block"></span>
              </div>
              <div className="flex items-center gap-1 justify-end">
                <span>طلب كثيف (٥+ مقاعد)</span>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/40 border border-red-500/80 inline-block"></span>
              </div>
            </div>
          )}

          {showRouteHeat && (
            <div className="border-t border-slate-800 pt-1.5 mt-1.5 flex flex-col gap-1 text-[9px] text-slate-400">
              <div className="font-bold text-rose-500 mb-0.5 text-right">🗺️ تنبؤات ممرات التجميع الساخنة:</div>
              {(() => {
                const frequentCorridors = [
                  { fromLabel: "عمان", toLabel: "الزرقاء", basePopularity: 82 },
                  { fromLabel: "عمان", toLabel: "إربد", basePopularity: 75 },
                  { fromLabel: "عمان", toLabel: "البلقاء", basePopularity: 48 }
                ];
                return frequentCorridors.map(c => {
                  const matchingReqsCount = requests.filter(r => 
                    (r.fromArea.includes(c.fromLabel) && r.toArea.includes(c.toLabel)) ||
                    (r.fromArea.includes(c.toLabel) && r.toArea.includes(c.fromLabel))
                  ).length;
                  const matchingRidesCount = rides.filter(r => 
                    (r.fromArea.includes(c.fromLabel) && r.toArea.includes(c.toLabel)) ||
                    (r.fromArea.includes(c.toLabel) && r.toArea.includes(c.fromLabel))
                  ).length;

                  const loadScore = c.basePopularity + (matchingReqsCount * 12) + (matchingRidesCount * 15);
                  const isRuby = loadScore > 95;
                  
                  return (
                    <div key={`${c.fromLabel}-${c.toLabel}`} className="flex justify-between items-center bg-slate-950/45 p-1 rounded border border-slate-850/50 flex-row-reverse text-[8px]">
                      <span className="text-slate-300 font-bold">{c.fromLabel} ↔ {c.toLabel === "البلقاء" ? "السلط" : c.toLabel}</span>
                      <span className={`px-1 rounded-[3px] text-[7.5px] font-bold ${
                        isRuby 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : loadScore > 75 
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/25' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                      }`}>
                        {isRuby ? 'كثيف جداً 🔥' : loadScore > 75 ? 'مرتفع ⚡' : 'نشط 📈'}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Terminal Live Matching Logs */}
      <div className="p-4 bg-black border-t border-[#1e293b] font-mono select-none">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-zinc-900 text-[10px] text-emerald-500 tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span>سجل معالجة الطلبات الفوري لبرنامج آدم الذكي</span>
          </span>
          <span>LIVE TRACKER</span>
        </div>
        <div className="flex flex-col gap-1 h-[95px] overflow-y-auto text-xs text-slate-300 scrollbar-thin">
          {logs.map((log, index) => (
            <div key={index} className="flex gap-2 animate-fade-in text-right flex-row-reverse">
              <span className="text-emerald-500 font-bold shrink-0">◀</span>
              <span className="flex-1 select-all">{log}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
