import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Box,
  Clock,
  Compass,
  MapPin,
  Layers,
  Zap,
  Activity,
  Sliders,
  CheckCircle,
  TrendingUp,
  RotateCw,
  Navigation,
  DollarSign,
  Car,
  Maximize2,
  Minimize2,
  Cpu
} from 'lucide-react';

interface AiSpatial5DViewProps {
  userType: 'driver' | 'passenger';
  governorate?: string;
  locationName?: string;
  currentActivity?: string;
  coords?: { lat: number; lng: number };
  onApplyFields?: (fields: {
    pickup?: string;
    destination?: string;
    fare?: number;
    vehicleClass?: string;
  }) => void;
  onClose?: () => void;
  className?: string;
}

export const AiSpatial5DView: React.FC<AiSpatial5DViewProps> = ({
  userType,
  governorate = 'عمان',
  locationName = 'الدوار السابع',
  currentActivity = '',
  coords,
  onApplyFields,
  onClose,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'3d' | '4d' | '5d'>('5d');
  const [timeOffsetMinutes, setTimeOffsetMinutes] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isOrbiting, setIsOrbiting] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const carMeshRef = useRef<THREE.Group | null>(null);

  // Default coordinates if none provided
  const currentCoords = coords || { lat: 31.9539, lng: 35.9106 };

  // Fetch 5D AI Analytics
  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/spatial-5d-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType,
          governorate,
          locationName,
          currentActivity,
          coords: currentCoords,
          timeOffsetMinutes
        })
      });
      const data = await res.json();
      if (data.success && data.analytics) {
        setAnalytics(data.analytics);
      }
    } catch (e) {
      console.error("Failed to load 5D analytics", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [userType, governorate, locationName, timeOffsetMinutes]);

  // Setup Three.js 3D Viewport Scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth || 600;
    const height = canvasRef.current.clientHeight || 320;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f172a, 0.03);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 15, 25);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x10b981, 2);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x0ea5e9, 3, 50);
    pointLight.position.set(-10, 10, -10);
    scene.add(pointLight);

    // 5. Holographic 3D Grid
    const gridHelper = new THREE.GridHelper(50, 25, 0x10b981, 0x334155);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // 6. Holographic Car / Vehicle Mesh Group
    const carGroup = new THREE.Group();
    
    // Body
    const bodyGeo = new THREE.BoxGeometry(2.4, 1.0, 4.5);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      wireframe: true,
      emissive: 0x059669,
      emissiveIntensity: 0.6
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.8;
    carGroup.add(bodyMesh);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.8, 0.8, 2.2);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      wireframe: true,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8
    });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(0, 1.6, -0.2);
    carGroup.add(cabinMesh);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
    const wheelMat = new THREE.MeshBasicMaterial({ color: 0x64748b, wireframe: true });
    
    const w1 = new THREE.Mesh(wheelGeo, wheelMat);
    w1.rotation.z = Math.PI / 2;
    w1.position.set(-1.3, 0.4, 1.5);
    carGroup.add(w1);

    const w2 = w1.clone();
    w2.position.set(1.3, 0.4, 1.5);
    carGroup.add(w2);

    const w3 = w1.clone();
    w3.position.set(-1.3, 0.4, -1.5);
    carGroup.add(w3);

    const w4 = w1.clone();
    w4.position.set(1.3, 0.4, -1.5);
    carGroup.add(w4);

    scene.add(carGroup);
    carMeshRef.current = carGroup;

    // 7. Laser Trajectory Line
    const pathPoints = [];
    for (let i = -20; i <= 20; i += 2) {
      pathPoints.push(new THREE.Vector3(i, 0.1, Math.sin(i * 0.3) * 6));
    }
    const pathGeo = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const pathMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    const trajectoryLine = new THREE.Line(pathGeo, pathMat);
    scene.add(trajectoryLine);

    // 8. Holographic Waypoint Pins
    const pinGeo = new THREE.ConeGeometry(0.8, 2, 8);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true });
    const pin = new THREE.Mesh(pinGeo, pinMat);
    pin.rotation.x = Math.PI;
    pin.position.set(12, 1.5, Math.sin(12 * 0.3) * 6);
    scene.add(pin);

    // 9. Animation Loop
    let animationFrameId: number;
    let angle = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (carGroup) {
        // Move car along 4D trajectory offset
        const carX = -10 + (timeOffsetMinutes * 0.8) % 25;
        carGroup.position.x = carX;
        carGroup.position.z = Math.sin(carX * 0.3) * 6;
        carGroup.rotation.y = -Math.cos(carX * 0.3) * 0.5;
      }

      if (isOrbiting && camera) {
        angle += 0.005;
        camera.position.x = Math.sin(angle) * 22;
        camera.position.z = Math.cos(angle) * 22;
        camera.lookAt(0, 2, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!canvasRef.current || !renderer || !camera) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, [timeOffsetMinutes, isOrbiting]);

  const handleApplyToApp = () => {
    if (!analytics?.contextual5D?.recommendedFields) return;
    const rec = analytics.contextual5D.recommendedFields;

    if (onApplyFields) {
      onApplyFields({
        pickup: rec.suggestedPickup,
        destination: rec.suggestedDestination,
        fare: rec.estimatedBaseFareJod,
        vehicleClass: rec.recommendedVehicleClass
      });
    }

    setAppliedNotification('✨ تم تطبيق حقول الذكاء الاصطناعي خماسية الأبعاد بنجاح على الشاشة الرئيسية!');
    setTimeout(() => setAppliedNotification(null), 4000);
  };

  const c5d = analytics?.contextual5D;
  const s3d = analytics?.spatial3D;
  const t4d = analytics?.temporal4D;

  return (
    <div className={`relative bg-slate-950 text-white rounded-2xl border border-slate-800/90 shadow-2xl overflow-hidden my-3 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none my-0 flex flex-col justify-between' : ''} ${className}`}>
      
      {/* Header Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 space-x-reverse">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                رادار العرض الخماسي الأبعاد الذكي (5D Spatial AI Viewport)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                {userType === 'driver' ? 'واجهة الكابتن 🚕' : 'واجهة الراكب 👤'}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center space-x-1.5 space-x-reverse mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{governorate} • {locationName}</span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-300 dir-ltr font-mono text-[11px]">
                {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
              </span>
            </p>
          </div>
        </div>

        {/* Tab Selector & Controls */}
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1 space-x-reverse text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('3d')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 space-x-reverse cursor-pointer ${
                activeTab === '3d' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D الفضاء</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('4d')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 space-x-reverse cursor-pointer ${
                activeTab === '4d' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>4D الزمن</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('5d')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 space-x-reverse cursor-pointer ${
                activeTab === '5d' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>5D السلوك والحقول</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? 'تصغير' : 'ملء الشاشة'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 transition-colors cursor-pointer text-xs font-bold"
            >
              إغلاق
            </button>
          )}
        </div>
      </div>

      {/* Main 3D / 4D Canvas Viewport */}
      <div className="relative w-full h-[280px] sm:h-[340px] bg-slate-950 overflow-hidden border-b border-slate-800">
        <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

        {/* Floating Holographic Controls Overlay */}
        <div className="absolute top-3 right-3 z-10 flex flex-col space-y-2">
          <button
            type="button"
            onClick={() => setIsOrbiting(!isOrbiting)}
            className={`p-2 rounded-xl text-xs font-bold border flex items-center space-x-1.5 space-x-reverse transition-all cursor-pointer backdrop-blur-md ${
              isOrbiting
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900/80 text-slate-400 border-slate-700'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isOrbiting ? 'animate-spin' : ''}`} />
            <span>دوران الكاميرا 3D</span>
          </button>

          <div className="bg-slate-900/80 backdrop-blur-md p-2 rounded-xl border border-slate-800 text-[11px] space-y-1">
            <div className="text-slate-400 flex items-center justify-between">
              <span>الارتفاع (Elevation):</span>
              <span className="font-mono text-emerald-400 font-bold">{s3d?.elevationMeters || 850}m</span>
            </div>
            <div className="text-slate-400 flex items-center justify-between">
              <span>درجة الاتجاه (Heading):</span>
              <span className="font-mono text-sky-400 font-bold">{s3d?.headingDegrees || 145}°</span>
            </div>
            <div className="text-slate-400 flex items-center justify-between">
              <span>مستوى الثقة AI:</span>
              <span className="font-mono text-amber-400 font-bold">{c5d?.aiConfidence || '97%'}</span>
            </div>
          </div>
        </div>

        {/* 4D Temporal Timeline Controller Bar */}
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 space-x-reverse w-full sm:w-auto">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-extrabold text-white whitespace-nowrap">
              محاكاة الزمن 4D:
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800 dir-ltr">
              +{timeOffsetMinutes} min
            </span>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse w-full sm:w-1/2">
            <span className="text-[10px] text-slate-400 font-mono">الآن</span>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={timeOffsetMinutes}
              onChange={(e) => setTimeOffsetMinutes(Number(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 font-mono">+30د</span>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse text-xs shrink-0">
            <span className="text-slate-300 flex items-center space-x-1 space-x-reverse">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>السرعة:</span>
              <strong className="text-white font-mono">{t4d?.projectedSpeedKmh || 45} km/h</strong>
            </span>
            <span className="text-slate-300 flex items-center space-x-1 space-x-reverse">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>انسيابية الطريق:</span>
              <strong className="text-emerald-400 font-mono">{t4d?.trafficFluidityScore || 85}%</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Applied Notification Alert */}
      <AnimatePresence>
        {appliedNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-900/90 border-b border-emerald-500 text-emerald-200 px-4 py-2.5 text-xs font-bold flex items-center space-x-2 space-x-reverse"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{appliedNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Panels: 3D / 4D / 5D Contextual Smart Fields */}
      <div className="p-4 bg-slate-950 space-y-4">
        {isLoading ? (
          <div className="py-8 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-400">
              جاري تحليل الأبعاد الخمسة ومسح موقعك بالذكاء الاصطناعي...
            </p>
          </div>
        ) : (
          <>
            {/* 5D Contextual Intent & Smart Auto-Fields */}
            {activeTab === '5d' && (
              <div className="space-y-4">
                {/* Intent Prediction Banner */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-800/60 flex items-start space-x-3 space-x-reverse">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider block mb-0.5">
                      التنبؤ بالنية والسلوك الذكي (5D Contextual Intent):
                    </span>
                    <p className="text-xs font-bold text-slate-200 leading-relaxed">
                      {c5d?.intentPrediction}
                    </p>
                  </div>
                </div>

                {/* Dynamic Smart 3D Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  
                  {/* Field 1: Pickup */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1 space-x-reverse">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>حقل الانطلاق الذكي (Pickup):</span>
                    </span>
                    <h4 className="text-xs font-extrabold text-white truncate">
                      {c5d?.recommendedFields?.suggestedPickup || locationName}
                    </h4>
                    <p className="text-[10px] text-slate-400">مقترح تلقائياً بناءً على إحداثياتك</p>
                  </div>

                  {/* Field 2: Destination */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1 space-x-reverse">
                      <Navigation className="w-3.5 h-3.5 text-sky-400" />
                      <span>حقل الوجهة المتوقعة (Destination):</span>
                    </span>
                    <h4 className="text-xs font-extrabold text-white truncate">
                      {c5d?.recommendedFields?.suggestedDestination || 'غير محدد'}
                    </h4>
                    <p className="text-[10px] text-slate-400">توقع الذكاء الاصطناعي لوجهتك التالية</p>
                  </div>

                  {/* Field 3: Fare Estimate */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1 space-x-reverse">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                      <span>حقل تقدير الأجرة (AI Fare):</span>
                    </span>
                    <h4 className="text-xs font-extrabold text-emerald-400">
                      {c5d?.recommendedFields?.estimatedBaseFareJod || 3.0} د.أ{' '}
                      <span className="text-[10px] text-slate-400">
                        (مُعامل الطلب: x{c5d?.recommendedFields?.suggestedSurgeFactor || 1.0})
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400">حساب ديناميكي بالمسافة والوقت</p>
                  </div>

                  {/* Field 4: Vehicle Class */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1 space-x-reverse">
                      <Car className="w-3.5 h-3.5 text-purple-400" />
                      <span>فئة المركبة الموصى بها:</span>
                    </span>
                    <h4 className="text-xs font-extrabold text-white truncate">
                      {c5d?.recommendedFields?.recommendedVehicleClass || 'هجين اقتصادي'}
                    </h4>
                    <p className="text-[10px] text-slate-400">مثالي لحالة الطرق المجاورة</p>
                  </div>

                </div>

                {/* Holographic Hologram Prompts & Apply Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {c5d?.holographicPrompts?.map((promptText: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-900 text-emerald-300 border border-emerald-900/60 px-2.5 py-1 rounded-lg flex items-center space-x-1 space-x-reverse"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>{promptText}</span>
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyToApp}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 space-x-reverse shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer shrink-0"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>تعبئة وتطبيق الحقول الذكية بضغطة واحدة ✨</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3D Spatial Details Tab */}
            {activeTab === '3d' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-extrabold text-emerald-400 flex items-center space-x-1.5 space-x-reverse">
                    <Box className="w-4 h-4" />
                    <span>المعالم الجغرافية القريبة (3D Points):</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {s3d?.spatialPointsOfInterest?.map((poi: any, idx: number) => (
                      <li key={idx} className="flex justify-between items-center bg-slate-950 p-2 rounded-lg">
                        <span>{poi.name}</span>
                        <span className="text-emerald-400 font-mono text-[11px]">{poi.distanceKm} كم</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-extrabold text-sky-400 flex items-center space-x-1.5 space-x-reverse">
                    <Compass className="w-4 h-4" />
                    <span>معلمات الفضاء والعمق:</span>
                  </h4>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span>الارتفاع عن سطح البحر:</span>
                      <strong className="text-white font-mono">{s3d?.elevationMeters || 850}m</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span>عدد طبقات العمق المائي/البري:</span>
                      <strong className="text-white font-mono">{s3d?.depthLayersCount || 5} طبقات</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-extrabold text-purple-400 flex items-center space-x-1.5 space-x-reverse">
                    <Layers className="w-4 h-4" />
                    <span>الطقس وسلامة الطريق:</span>
                  </h4>
                  <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg leading-relaxed">
                    {c5d?.environmentalRiskIndex || 'حالة ممتازة ومناسبة تماماً لجميع فئات المركبات.'}
                  </p>
                </div>
              </div>
            )}

            {/* 4D Temporal Timeline Tab */}
            {activeTab === '4d' && (
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-extrabold text-emerald-400 flex items-center space-x-2 space-x-reverse">
                  <Clock className="w-4 h-4" />
                  <span>محاكاة خط الزمن والتدهور التدريجي للمسافة (4D Time Trajectory):</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-lg space-y-1">
                    <span className="text-slate-400 text-[11px]">الوقت المتوقع للوصول (ETA):</span>
                    <h3 className="text-base font-extrabold text-emerald-400 font-mono">
                      {t4d?.projectedEtaMinutes || 10} دقيقة
                    </h3>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg space-y-1">
                    <span className="text-slate-400 text-[11px]">مُعامل تلاشي الازدحام الزمن (Decay):</span>
                    <h3 className="text-base font-extrabold text-sky-400 font-mono">
                      {t4d?.timeDecayFactor || '98%'}
                    </h3>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg space-y-1">
                    <span className="text-slate-400 text-[11px]">سرعة التدفق المقترحة:</span>
                    <h3 className="text-base font-extrabold text-amber-400 font-mono">
                      {t4d?.projectedSpeedKmh || 45} كم / ساعة
                    </h3>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};
