import React, { useState, useEffect } from 'react';
import { getLocationCoords, getGeoCoords } from '../locationData';
import { Power, MapPin, Navigation, Compass, ShieldAlert, Phone, Check, X, AlertTriangle, Route, Star, Mic, MicOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppState } from '../stateEngine';
import { AiAdBanner } from './AiAdBanner';
import { AiSpatial5DView } from './AiSpatial5DView';
import { playNotificationTone } from '../soundUtils';

interface IntraCityDriverPanelProps {
  loggedDriver: any;
  settings: any;
  t: (ar: string, en: string) => string;
  language: string;
  setLanguage: (lang: string) => void;
  intraCityRides: any[];
  acceptIntraCityRide: (rideId: string, driverId: string) => { success: boolean; msg: string };
  declineIntraCityRide?: (rideId: string, driverId: string) => { success: boolean; msg: string };
  startIntraCityRide: (rideId: string) => { success: boolean; msg: string };
  endIntraCityRide: (rideId: string) => { success: boolean; msg: string };
  cancelIntraCityRide: (rideId: string, role: 'passenger' | 'driver') => { success: boolean; msg: string };
  setDriverOnline: (driverId: string, isOnline: boolean) => void;
  updateDriverLocation?: (driverId: string, location: { x: number; y: number; name: string }) => void;
}

export const IntraCityDriverPanel: React.FC<IntraCityDriverPanelProps> = ({
  loggedDriver,
  settings,
  t,
  language,
  setLanguage,
  intraCityRides,
  acceptIntraCityRide,
  declineIntraCityRide,
  startIntraCityRide,
  endIntraCityRide,
  cancelIntraCityRide,
  setDriverOnline,
  updateDriverLocation
}) => {
  const { rateIntraCityPassenger, dismissCompletedRideInvoice } = useAppState();

  const [nowTime, setNowTime] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [dismissedRideIds, setDismissedRideIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('adam_dismissed_completed_invoices_driver') || '[]');
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

  // Find if there is a recently completed intra-city ride that is NOT yet rated or dismissed by this driver
  const unratedCompletedRide = intraCityRides.find(
    r => r.driverId === loggedDriver.id &&
         r.status === 'completed' &&
         !r.driverRated &&
         !r.driverDismissed &&
         !r.invoiceClosed &&
         !dismissedRideIds.includes(r.id) &&
         !isOldRide(r)
  );

  const handleCloseInvoice = (rideId: string) => {
    setDismissedRideIds(prev => [...prev, rideId]);
    dismissCompletedRideInvoice(rideId, 'driver');
    if (!loggedDriver.isOnline) {
      setDriverOnline(loggedDriver.id, true);
    }
  };

  const [cashConfirmedForRide, setCashConfirmedForRide] = useState<{ [rideId: string]: boolean }>({});
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [ratingComment, setRatingComment] = useState<string>('');

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
                role: 'driver'
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
          "الراكب دقيق جداً وملتزم بموقع الإقلال والدفع تم بسلاسة وبأدب كامل.",
          "The passenger was very precise, committed to the pickup location, and paid smoothly and politely."
        );
        setRatingComment(prev => prev ? `${prev} ${simulatedText}` : simulatedText);
        setIsTranscribing(false);
      }, 1500);
    }
    setIsRecording(false);
  };

  // Find current driver's active local ride
  const activeLocalRide = intraCityRides.find(
    r => r.driverId === loggedDriver.id && r.status !== 'completed' && r.status !== 'cancelled'
  );

  // Retrieve pending local ride requests ordered by proximity to current driver location
  const driverCoords = loggedDriver?.currentLocation || { x: 150, y: 150 };
  const pendingRequests = intraCityRides
    .filter(r => r.status === 'pending')
    .map(r => {
      const dx = (r.pickupCoords?.x ?? 150) - driverCoords.x;
      const dy = (r.pickupCoords?.y ?? 150) - driverCoords.y;
      const distUnits = Math.hypot(dx, dy);
      const distFromDriverKm = Math.max(0.2, Math.round((distUnits / 12) * 10) / 10);
      return {
        ...r,
        distUnits,
        distFromDriverKm
      };
    })
    .sort((a, b) => a.distUnits - b.distUnits);

  const [errMsg, setErrMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [ignoredRides, setIgnoredRides] = useState<string[]>([]);
  
  // Automated simulation of major roads and traffic congestion indicators on radar
  const [trafficState, setTrafficState] = useState<any[]>([
    { id: 'st1', nameAr: 'شارع الملك عبدالله الثاني', nameEn: 'King Abdullah II St', dense: true, load: 85, x1: 110, y1: 120, x2: 290, y2: 280, isCurve: false },
    { id: 'st2', nameAr: 'شارع وصفي التل (الجاردنز)', nameEn: 'Wasfi Al-Tal St (Gardens)', dense: false, load: 30, x1: 105, y1: 150, x2: 295, y2: 150, isCurve: false },
    { id: 'st3', nameAr: 'شارع مكة والمنافذ الرئيسية', nameEn: 'Mecca Street & Main Outlets', dense: true, load: 92, x1: 105, y1: 220, x2: 295, y2: 220, isCurve: false },
    { id: 'st4', nameAr: 'طريق وادي صقرة باتجاه الدوار', nameEn: 'Wadi Saqra towards Circle', dense: false, load: 45, d: 'M 120 180 Q 200 120 280 235', isCurve: true },
    { id: 'st5', nameAr: 'شارع المدينة المنورة الرئيسي', nameEn: 'Al-Madina Al-Munawara St', dense: true, load: 78, d: 'M 155 110 Q 140 200 185 295', isCurve: true }
  ]);

  useEffect(() => {
    // Dynamic traffic shifting simulation loop to keep indicators organic
    const trafficInterval = setInterval(() => {
      setTrafficState(prev => prev.map(street => {
        const delta = Math.floor(Math.random() * 21) - 10; // fluctuate -10% to +10%
        let newLoad = Math.max(15, Math.min(100, street.load + delta));
        return {
          ...street,
          load: newLoad,
          dense: newLoad > 65
        };
      }));
    }, 10000);
    return () => clearInterval(trafficInterval);
  }, []);
  
  const [confirmStart, setConfirmStart] = useState<boolean>(false);
  const [confirmCancel, setConfirmCancel] = useState<boolean>(false);
  const [confirmEnd, setConfirmEnd] = useState<boolean>(false);
  const [otpInput, setOtpInput] = useState<string>('');

  // Auto-launch deep navigation states
  const [autoLaunchMapPref, setAutoLaunchMapPref] = useState<'none' | 'google' | 'waze'>(() => {
    return (localStorage.getItem('adam_auto_launch_map') as any) || 'none';
  });
  const [lastAutoLaunchedRideId, setLastAutoLaunchedRideId] = useState<string | null>(null);
  const [autoLaunchStatusMsg, setAutoLaunchStatusMsg] = useState<string>('');

  useEffect(() => {
    setConfirmStart(false);
    setConfirmCancel(false);
    setConfirmEnd(false);
    setOtpInput('');
  }, [activeLocalRide?.status]);

  // Automated Integration Listener: Open unified route maps app on acceptance
  useEffect(() => {
    if (activeLocalRide && activeLocalRide.status === 'accepted') {
      if (lastAutoLaunchedRideId !== activeLocalRide.id && autoLaunchMapPref !== 'none') {
        setLastAutoLaunchedRideId(activeLocalRide.id);
        const pGeo = getGeoCoords(activeLocalRide.pickupCoords.x, activeLocalRide.pickupCoords.y);
        const dGeo = getGeoCoords(activeLocalRide.dropoffCoords.x, activeLocalRide.dropoffCoords.y);
        
        let launchPath = '';
        let appName = '';
        if (autoLaunchMapPref === 'google') {
          launchPath = `https://www.google.com/maps/dir/?api=1&origin=${pGeo.lat},${pGeo.lng}&destination=${dGeo.lat},${dGeo.lng}&travelmode=driving&dir_action=navigate`;
          appName = 'خرائط Google (مسار موحد)';
        } else if (autoLaunchMapPref === 'waze') {
          launchPath = `https://waze.com/ul?ll=${dGeo.lat},${dGeo.lng}&navigate=yes`;
          appName = 'تطبيق Waze';
        }

        if (launchPath) {
          setAutoLaunchStatusMsg(`🚨 جاري تحويلك تلقائياً إلى ${appName} لمسار الرحلة الكامل...`);
          setTimeout(() => {
            window.open(launchPath, '_blank');
            setAutoLaunchStatusMsg('');
          }, 1500);
        }
      }
    }
  }, [activeLocalRide?.id, activeLocalRide?.status, autoLaunchMapPref, lastAutoLaunchedRideId]);

  const [isTurbo, setIsTurbo] = useState<boolean>(() => localStorage.getItem('adam_turbo_boost') === 'true');
  useEffect(() => {
    const handleTurboChange = () => {
      setIsTurbo(localStorage.getItem('adam_turbo_boost') === 'true');
    };
    window.addEventListener('adam_turbo_changed', handleTurboChange);
    return () => window.removeEventListener('adam_turbo_changed', handleTurboChange);
  }, []);

  const [recentRequestsAlert, setRecentRequestsAlert] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const nowPending = intraCityRides.filter(r => r.status === 'pending');
    let hasUpdates = false;
    const newAlerts = { ...recentRequestsAlert };
    nowPending.forEach(req => {
      if (newAlerts[req.id] === undefined) {
        newAlerts[req.id] = true;
        hasUpdates = true;
        setTimeout(() => {
          setRecentRequestsAlert(prev => ({ ...prev, [req.id]: false }));
        }, 6000);
      }
    });
    if (hasUpdates) {
      setRecentRequestsAlert(newAlerts);
      if (loggedDriver?.isOnline) {
        playNotificationTone(settings?.notificationSoundTone || 'chime', settings?.notificationSoundVolume ?? 0.4);
      }
    }
  }, [intraCityRides]);

  // WebSockets Live Telemetry Publisher for Driver
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [wsLogs, setWsLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!activeLocalRide || (activeLocalRide.status !== 'accepted' && activeLocalRide.status !== 'started')) {
      setWsConnected(false);
      return;
    }

    setWsConnected(true);
    const initialLog = `🔌 [ADAM-WS] Connected to adam-ws://live-hub.adamride.com/ride/${activeLocalRide.id}`;
    setWsLogs([initialLog]);

    // Update every 5 seconds (or 1 second if turbo is on!)
    const trackingPeriod = isTurbo ? 1000 : 5000;
    const interval = setInterval(() => {
      const capCoords = loggedDriver.currentLocation || { x: 150, y: 150 };
      
      // Post to Node.js backend
      fetch(`/api/ride/${activeLocalRide.id}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x: capCoords.x,
          y: capCoords.y,
          bearing: Math.floor(Math.random() * 360)
        })
      })
      .then(res => res.json())
      .catch(err => console.warn("Location push error:", err));

      // Dispatch WebSockets broadcast message locally
      const wsMessage = {
        type: 'ADAM_WS_LOCATION_UPDATE',
        rideId: activeLocalRide.id,
        x: capCoords.x,
        y: capCoords.y,
        name: capCoords.name || '',
        timestamp: new Date().toLocaleTimeString()
      };

      // Broadcast using a custom window event for instant visual reactive updates
      window.dispatchEvent(new CustomEvent('adam_ws_telemetry', { detail: wsMessage }));

      // Append code log
      setWsLogs(prev => [
        `📤 [WS: OUT] ${JSON.stringify({ x: capCoords.x, y: capCoords.y, timestamp: wsMessage.timestamp })}`,
        ...prev.slice(5)
      ]);

    }, trackingPeriod);

    return () => {
      clearInterval(interval);
      setWsConnected(false);
    };
  }, [activeLocalRide?.id, activeLocalRide?.status, loggedDriver?.currentLocation, isTurbo]);

  // Simulation animation ticker
  const [simTick, setSimTick] = useState<number>(0);
  useEffect(() => {
    const tickTime = isTurbo ? 250 : 1500;
    const interval = setInterval(() => {
      setSimTick(t => (t + 1) % 100);
    }, tickTime);
    return () => clearInterval(interval);
  }, [isTurbo]);

  // AI Co-Pilot & Speed Radar Detector States
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
  const [warnedThreatIds, setWarnedThreatIds] = useState<Set<string>>(new Set());
  const [localSpeedometer, setLocalSpeedometer] = useState<number>(76);
  const [communityThreats, setCommunityThreats] = useState<any[]>([]);

  // Baseline predefined threats along the trip
  const activeLocalRideThreats = React.useMemo(() => {
    if (!activeLocalRide) return [];
    
    const baseline = [
      {
        id: 'fixed-cam-1',
        type: 'fixed_camera',
        nameAr: 'كاميرا مراقبة سرعة ثابتة (شارع المطار)',
        nameEn: 'Fixed Speed Camera (Airport Road)',
        percent: 0.35,
        limit: 80,
        confidence: 100
      },
      {
        id: 'police-patrol-1',
        type: 'police_checkpoint',
        nameAr: 'نقطة تفتيش دورية أمنية مؤقتة (AI تتبع)',
        nameEn: 'Temporary Police Patrol Checkpoint (AI tracked)',
        percent: 0.65,
        limit: 60,
        confidence: 94
      },
      {
        id: 'mobile-radar-1',
        type: 'mobile_radar',
        nameAr: 'رادار سرعة متحرك نشط (موقع مقترح بالذكاء الاصطناعي)',
        nameEn: 'Mobile Speed Radar (AI Predicted Hotspot)',
        percent: 0.82,
        limit: 90,
        confidence: 88
      }
    ];

    return [...baseline, ...communityThreats.filter(t => t.rideId === activeLocalRide.id)];
  }, [activeLocalRide?.id, communityThreats]);

  const handleReportThreat = (type: 'fixed_camera' | 'mobile_radar' | 'police_checkpoint') => {
    if (!activeLocalRide) return;
    const progressPercent = (simTick / 100);
    
    let labelAr = '';
    let labelEn = '';
    let speedLimit = 80;

    if (type === 'fixed_camera') {
      labelAr = 'بلاغ من المجتمع: كاميرا ثابتة نشطة';
      labelEn = 'Community Report: Fixed Camera Active';
      speedLimit = 80;
    } else if (type === 'mobile_radar') {
      labelAr = 'بلاغ من المجتمع: رادار سرعة متحرك';
      labelEn = 'Community Report: Mobile Radar Active';
      speedLimit = 90;
    } else {
      labelAr = 'بلاغ من المجتمع: رصد دورية شرطة';
      labelEn = 'Community Report: Police Checkpoint';
      speedLimit = 60;
    }

    const newThreat = {
      id: `comm-threat-${Date.now()}`,
      rideId: activeLocalRide.id,
      type,
      nameAr: labelAr,
      nameEn: labelEn,
      percent: Math.min(0.95, progressPercent + 0.05), // Place slightly ahead of the driver so they can see it
      limit: speedLimit,
      confidence: 90,
      reportedBy: loggedDriver.fullName || 'كابتن آدم'
    };

    setCommunityThreats(prev => [...prev, newThreat]);
    
    // Play sound or confirm report
    if (isVoiceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('تم تسجيل البلاغ بنجاح وتعميمه على مجتمع السائقين بالذكاء الاصطناعي');
      utterance.lang = 'ar-JO';
      window.speechSynthesis.speak(utterance);
    }
  };

  const getCoordinatesAtPercent = (start: {x: number, y: number}, end: {x: number, y: number}, pct: number) => {
    return {
      x: start.x + (end.x - start.x) * pct,
      y: start.y + (end.y - start.y) * pct
    };
  };

  const getThreatCoords = (threat: any) => {
    if (!activeLocalRide) return { x: 0, y: 0 };
    if (activeLocalRide.status === 'accepted') {
      const capCoords = loggedDriver.currentLocation || { x: 150, y: 150 };
      return getCoordinatesAtPercent(capCoords, activeLocalRide.pickupCoords, threat.percent);
    } else {
      return getCoordinatesAtPercent(activeLocalRide.pickupCoords, activeLocalRide.dropoffCoords, threat.percent);
    }
  };

  // Proximity Alert Detection & Vocal warning trigger
  useEffect(() => {
    if (!activeLocalRide || activeLocalRide.status !== 'started') {
      return;
    }

    const currentProgressPercent = (simTick / 100);

    // Dynamic speedometer fluctuations
    setLocalSpeedometer(prev => {
      const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
      const next = prev + delta;
      return next < 55 ? 65 : next > 105 ? 85 : next;
    });

    // Scan for upcoming threats ahead of us
    const upcomingThreat = activeLocalRideThreats.find(threat => {
      const distance = threat.percent - currentProgressPercent;
      return distance > 0 && distance <= 0.12; // within 12% distance of the path
    });

    if (upcomingThreat) {
      if (!warnedThreatIds.has(upcomingThreat.id)) {
        setWarnedThreatIds(prev => {
          const next = new Set(prev);
          next.add(upcomingThreat.id);
          return next;
        });

        if (isVoiceEnabled && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const speechText = `تحذير من مساعد الذكاء الاصطناعي: اقتراب من ${upcomingThreat.nameAr}. السرعة المحددة ${upcomingThreat.limit} كيلومتر في الساعة. يرجى الانتباه وتخفيف السرعة.`;
          const utterance = new SpeechSynthesisUtterance(speechText);
          utterance.lang = 'ar-JO';
          utterance.rate = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      }
    }
  }, [simTick, activeLocalRide?.id, activeLocalRide?.status, activeLocalRideThreats, isVoiceEnabled, warnedThreatIds]);

  const [isTracking, setIsTracking] = useState<boolean>(false);

  // Auto-enable actual GPS route tracking when ride starts or accepts
  useEffect(() => {
    if (activeLocalRide && (activeLocalRide.status === 'accepted' || activeLocalRide.status === 'started')) {
      setIsTracking(true);
    } else {
      setIsTracking(false);
    }
  }, [activeLocalRide?.id, activeLocalRide?.status]);

  // Periodic tracking timer to update captain coordinates in real-time matching actual movement
  useEffect(() => {
    if (!isTracking || !activeLocalRide) return;

    const tickTime = isTurbo ? 200 : 1000;
    const interval = setInterval(() => {
      const capCoords = loggedDriver.currentLocation || { x: 150, y: 150 };
      const target = activeLocalRide.status === 'accepted'
        ? activeLocalRide.pickupCoords
        : activeLocalRide.dropoffCoords;

      if (!target) return;

      const dx = target.x - capCoords.x;
      const dy = target.y - capCoords.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 4) {
        const stepSize = isTurbo ? 22 : 7; // Stepping movement rate
        const nextX = Math.round(capCoords.x + (dx / dist) * stepSize);
        const nextY = Math.round(capCoords.y + (dy / dist) * stepSize);
        
        if (updateDriverLocation) {
          updateDriverLocation(loggedDriver.id, {
            x: nextX,
            y: nextY,
            name: capCoords.name || 'موقع متحرك'
          });
        }
      }
    }, tickTime);

    return () => clearInterval(interval);
  }, [isTracking, activeLocalRide, loggedDriver.currentLocation, updateDriverLocation, loggedDriver.id, isTurbo]);

  const handleToggleOnline = () => {
    setErrMsg('');
    setSuccessMsg('');
    setDriverOnline(loggedDriver.id, !loggedDriver.isOnline);
  };

  const handleAcceptRide = (rideId: string) => {
    setErrMsg('');
    setSuccessMsg('');
    const res = acceptIntraCityRide(rideId, loggedDriver.id);
    if (res.success) {
      setSuccessMsg(res.msg);
    } else {
      setErrMsg(res.msg);
    }
  };

  const handleDeclineRide = (rideId: string) => {
    setErrMsg('');
    setSuccessMsg('');
    if (declineIntraCityRide) {
      const res = declineIntraCityRide(rideId, loggedDriver.id);
      if (res.success) {
        setSuccessMsg(res.msg);
      } else {
        setErrMsg(res.msg);
      }
    } else {
      setIgnoredRides(prev => [...prev, rideId]);
    }
  };

  const handleStartRide = (rideId: string, customOtp?: string) => {
    setErrMsg('');
    setSuccessMsg('');

    const enteredOtp = (customOtp !== undefined ? customOtp : otpInput).trim();
    if (!enteredOtp) {
      setErrMsg(t(
        '⚠️ يرجى إدخال رمز الأمان (PIN) المكون من 4 أرقام المزود من الراكب لبدء الرحلة!',
        'Please enter the 4-digit security PIN provided by the passenger to start the trip!'
      ));
      return;
    }

    const res = startIntraCityRide(rideId, enteredOtp);
    if (res.success) {
      setSuccessMsg(res.msg);
      setOtpInput('');
      setConfirmStart(false);
    } else {
      setErrMsg(res.msg);
    }
  };

  const handleEndRide = (rideId: string) => {
    setErrMsg('');
    setSuccessMsg('');
    const res = endIntraCityRide(rideId);
    if (res.success) {
      setSuccessMsg(res.msg);
    } else {
      setErrMsg(res.msg);
    }
  };

  // Render Section
  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 font-sans text-right">
      <AiAdBanner 
        userType="driver" 
        travelMode="intracity" 
        governorate={loggedDriver?.governorate || 'عمان'} 
        locationName={loggedDriver?.governorate || 'عمان'}
        currentActivity={loggedDriver?.status === 'online' ? 'كابتن متصل داخل المدينة يستقبل عروض الركاب' : 'كابتن غير متصل يراجع حسابه'}
      />

      {unratedCompletedRide ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-4 flex flex-col gap-4 shadow-xl relative"
        >
          {/* Close / Dismiss Button */}
          <button
            type="button"
            onClick={() => handleCloseInvoice(unratedCompletedRide.id)}
            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer border border-slate-700 z-10"
            title={t('إغلاق الفاتورة', 'Close Invoice')}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex flex-col gap-1 text-center bg-slate-950 p-3 rounded-xl border border-slate-850 pr-8">
            <span className="text-xs text-[#10b981] font-black">{t('✓ اكتمل المشوار المباشر بنجاح', 'Trip Completed Successfully!')}</span>
            <span className="text-[10px] text-slate-400 font-sans">
              {t('تفاصيل الأجرة والحساب المالي للرحلة أدناه - يمكنك إغلاق الفاتورة والمتابعة', 'Fare and financial details - you can close and continue')}
            </span>
          </div>

          {/* Ride Details Summary */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2 text-right">
            <div className="flex justify-between flex-row-reverse text-xs border-b border-slate-850 pb-1.5">
              <span className="text-slate-400">{t('مسار الرحلة:', 'Route:')}</span>
              <span className="font-bold text-slate-200 text-right">
                {unratedCompletedRide.pickupName} ➔ {unratedCompletedRide.dropoffName}
              </span>
            </div>
            <div className="flex justify-between flex-row-reverse text-xs">
              <span className="text-slate-400">{t('الراكب المقيّم:', 'Passenger Rated:')}</span>
              <span className="font-bold text-indigo-400">👤 {unratedCompletedRide.passengerName || t('راكب معتمد لدى آدم', 'Certified Passenger')}</span>
            </div>
          </div>

          {/* Core Feature Requirement 3: Prominent Payment Collection Badge for Driver */}
          <div className="flex flex-col gap-2 font-sans">
            {unratedCompletedRide.paymentMethod === 'cash' ? (
              <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 p-4 rounded-2xl border-2 border-amber-500/80 shadow-lg shadow-amber-950/40 flex flex-col gap-2 text-right">
                <div className="flex justify-between items-center flex-row-reverse border-b border-amber-500/30 pb-2">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 flex-row-reverse">
                    <span>💵 {t('المطلوب تحصيله كاش من الراكب الآن', 'Cash Collection from Passenger')}</span>
                  </span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-bold">
                    {t('قبض نقدي 💵', 'Cash Payment 💵')}
                  </span>
                </div>
                <div className="flex justify-between items-center flex-row-reverse py-1">
                  <span className="text-[11px] text-slate-300 font-medium">
                    {t('استلم هذا المبلغ يداً بيد من الراكب قبل المغادرة:', 'Collect this exact cash amount from passenger:')}
                  </span>
                  <span className="text-2xl font-black text-amber-300 font-mono tracking-tight">
                    {unratedCompletedRide.price.toFixed(2)} <span className="text-xs">{t('د.أ', 'JOD')}</span>
                  </span>
                </div>

                {!cashConfirmedForRide[unratedCompletedRide.id] ? (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCashConfirmedForRide(prev => ({ ...prev, [unratedCompletedRide.id]: true }));
                        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                          const utterance = new SpeechSynthesisUtterance('تم تأكيد استلام المبلغ النقدي بنجاح. يرجى تقييم الراكب أو إغلاق الفاتورة.');
                          utterance.lang = 'ar-JO';
                          window.speechSynthesis.speak(utterance);
                        }
                      }}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs font-sans shadow-lg shadow-amber-500/25 transition active:scale-[98%] cursor-pointer flex items-center justify-center gap-2 animate-pulse mt-1"
                    >
                      <span>💵 {t('استلمت المبلغ النقدي', 'I Received Cash Payment')} ({unratedCompletedRide.price.toFixed(2)} {t('د.أ', 'JD')})</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleCloseInvoice(unratedCompletedRide.id)}
                      className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-bold py-2 rounded-xl text-[11px] transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t('إغلاق الفاتورة والمتابعة للرئيسية', 'Close Invoice & Return to Main Screen')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="bg-emerald-950/40 border border-emerald-500/40 p-2.5 rounded-xl text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1.5 flex-row-reverse">
                      <span>✓ {t('تم تأكيد استلام المبلغ النقدي بنجاح', 'Cash Payment Confirmed Successfully')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCloseInvoice(unratedCompletedRide.id)}
                      className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-bold py-2 rounded-xl text-[11px] transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t('إغلاق الفاتورة والعودة للرئيسية', 'Close Invoice & Return to Main Screen')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 p-4 rounded-2xl border-2 border-emerald-500/80 shadow-lg shadow-emerald-950/40 flex flex-col gap-2 text-right">
                <div className="flex justify-between items-center flex-row-reverse border-b border-emerald-500/30 pb-2">
                  <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5 flex-row-reverse">
                    <span>💳 {t('تم الدفع إلكترونياً بالمحفظة', 'Settled via Digital Wallet')}</span>
                  </span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold">
                    {t('مودع بمحفظتك ✓', 'In Your Wallet ✓')}
                  </span>
                </div>
                <div className="flex justify-between items-center flex-row-reverse py-1">
                  <span className="text-[11px] text-slate-300 font-medium">
                    {t('تم إيداع الأجرة في رصيدك الرقمي (لا تطلب كاش من الراكب):', 'Fare credited to your wallet (Do NOT ask passenger for cash):')}
                  </span>
                  <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                    {unratedCompletedRide.price.toFixed(2)} <span className="text-xs">{t('د.أ', 'JOD')}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Financial Breakdown Grid for Driver */}
            <div className="grid grid-cols-3 gap-2 mt-1 text-center font-sans">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 flex flex-col justify-center">
                <span className="text-[8.5px] text-slate-400 block font-bold">{t('إجمالي الأجرة:', 'Total Fare:')}</span>
                <span className="text-xs font-bold text-slate-200 font-mono mt-0.5">
                  {unratedCompletedRide.price.toFixed(2)} {t('د.أ', 'JD')}
                </span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 flex flex-col justify-center">
                <span className="text-[8.5px] text-rose-400 block font-bold">{t('عمولة المنظومة:', 'App Comm.:')}</span>
                <span className="text-xs font-bold text-rose-400 font-mono mt-0.5">
                  -{(unratedCompletedRide.commission || (unratedCompletedRide.price * 0.15)).toFixed(2)} {t('د.أ', 'JD')}
                </span>
              </div>
              <div className="bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-500/20 flex flex-col justify-center">
                <span className="text-[8.5px] text-emerald-400 block font-black">{t('صافي أرباحك:', 'Net Profit:')}</span>
                <span className="text-xs font-black text-emerald-400 font-mono mt-0.5">
                  {(unratedCompletedRide.price - (unratedCompletedRide.commission || (unratedCompletedRide.price * 0.15))).toFixed(2)} {t('د.أ', 'JD')}
                </span>
              </div>
            </div>
          </div>

          {/* Evaluation Block */}
          {(unratedCompletedRide.paymentMethod !== 'cash' || cashConfirmedForRide[unratedCompletedRide.id]) && (
            <>
              {settings?.ratingsDisabled ? (
                <div className="bg-slate-950/60 p-5 border border-indigo-500/20 rounded-xl text-center flex flex-col gap-3 leading-relaxed mt-1">
                  <span className="text-sm font-black text-indigo-400 flex items-center justify-center gap-1.5 flex-row-reverse">
                    <span>💡 أرشفة التقييمات مفعلة مركزياً</span>
                  </span>
                  <p className="text-[10.5px] text-slate-350">
                    تم تحويل نظام التقييمات المتبادلة للكباتن والركاب إلى نظام التثبيت والأرشفة المركزية الساكنة لتبسيط الخدمة وزيادة سرعة التنفيذ.
                  </p>
                  <div className="text-[9px] text-slate-500 font-mono">
                    لن يظهر خيار تقييم الراكب تماشياً مع سياسة عام 2026.
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col gap-3 items-center text-center mt-1">
                  <span className="text-[11px] font-bold text-slate-200">
                    {t(`كيف تقيم سلوك والتزام هذا الراكب؟`, `How would you rate this passenger's behavior?`)}
                  </span>

                  {/* Stars */}
                  <div className="flex gap-2.5 justify-center py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => {
                          setSelectedStars(star);
                          setSelectedTags([]);
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
                    {selectedStars === 5 && t('محترم جداً وملتزم تماماً (٥/٥)', 'Highly respectful & punctual (5/5)')}
                    {selectedStars === 4 && t('جيد جداً ومتعاون (٤/٥)', 'Very good & co-operative (4/5)')}
                    {selectedStars === 3 && t('مقبول واعتيادي (٣/٥)', 'Acceptable & standard (3/5)')}
                    {selectedStars === 2 && t('تأخر في الصعود أو لم يلتزم بكلامه (٢/٥)', 'Late or poor behavior (2/5)')}
                    {selectedStars === 1 && t('سيء جداً ولا أنصح بالتعاقد معه (١/٥)', 'Extremely bad experience (1/5)')}
                  </div>

                  {/* Tag Selector Pills */}
                  <div className="w-full flex flex-wrap gap-1.5 justify-center mt-2">
                    {(selectedStars >= 4
                      ? ['👍 راكب محترم', '⏱️ ملتزم بالموعد', '🤫 رحلة هادئة', '💬 أسلوب لطيف']
                      : ['⚠️ تأخر بالصعود', '⏱️ غير ملتزم بالوقت', '💬 أسلوب غير لائق', '🚬 محاولة التدخين']
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

                  {/* Comment container with speech voice notes */}
                  <div className="w-full text-right mt-2 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center flex-row-reverse">
                      <label className="text-[10px] text-slate-400 font-bold">{t('ملاحظات وسلوكيات الراكب (اختياري)', 'Passenger Comments (Optional)')}</label>
                      
                      {/* Voice button */}
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
                        placeholder={t('اكتب تفاصيل وإرشادات حول هذا المستخدم لمساعدة الكباتن الآخرين...', 'Write suggestions or record audio with mic to help other drivers...')}
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
                  </div>
                </div>
              )}

              {/* Submit Action & Skip/Close */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (settings?.ratingsDisabled) {
                      rateIntraCityPassenger(unratedCompletedRide.id, 5, 'تخطي تقييم الراكب (معطل من الإدارة)');
                    } else {
                      const tagsPart = selectedTags.length > 0 ? `[وسوم: ${selectedTags.join(', ')}]` : '';
                      const finalComment = [tagsPart, ratingComment].filter(Boolean).join(' ');
                      rateIntraCityPassenger(unratedCompletedRide.id, selectedStars, finalComment);
                    }

                    handleCloseInvoice(unratedCompletedRide.id);

                    setSelectedStars(5);
                    setSelectedTags([]);
                    setRatingComment('');
                  }}
                  className="w-full bg-[#10b981] hover:bg-emerald-600 text-white font-black py-3 rounded-xl text-xs transition duration-150 active:scale-[99%] flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/40"
                >
                  <span>💾 {t('حفظ التقييم وبدء البحث عن مشاوير جديدة 🚀', 'Save Rating & Start Searching for Rides 🚀')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCloseInvoice(unratedCompletedRide.id)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold py-2 rounded-xl text-[11px] transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('تخطي وإغلاق الفاتورة نهائياً', 'Skip & Close Invoice Permanently')}</span>
                </button>
              </div>
            </>
          )}
        </motion.div>
      ) : (
        <>
          {/* 1. ONLINE STATUS SWITCH CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center flex-row-reverse shadow-xl">
        <div className="text-right">
          <h3 className="text-xs font-black text-slate-100">{t('وضعية الاتصال للتنقل الفوري', 'Instant Service Connection')}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {loggedDriver.isOnline 
              ? t('✓ أنت متصل وتستقبل طلبات الركاب الآن', '✓ You are ONLINE and receiving ride requests')
              : t('● أنت غير متصل، لن تظهر في رادارات الركاب القريبين', '● You are OFFLINE. Passengers cannot find you')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleOnline}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 flex-row-reverse cursor-pointer ${
            loggedDriver.isOnline 
              ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20' 
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{loggedDriver.isOnline ? t('متصل', 'ONLINE') : t('غير متصل', 'OFFLINE')}</span>
        </button>
      </div>

      {errMsg && (
        <div className="p-2.5 bg-red-950/40 border border-red-800/40 rounded-xl text-xs text-red-300 text-right font-sans flex items-start gap-1 flex-row-reverse animate-bounce">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{errMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 text-right font-sans">
          {successMsg}
        </div>
      )}

      {/* 2. MAIN WORKSPACE */}
      {activeLocalRide ? (
        /* Driver is Busy on Active Ride */
        <motion.div
          key={`active-local-ride-${activeLocalRide.id}-${activeLocalRide.status}`}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-4 flex flex-col gap-4 shadow-xl"
        >
          
          {/* Header Progress status */}
          <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex-row-reverse">
            <div className="text-right">
              <span className="text-[9px] text-slate-500 block">{t('حالة الرحلة المباشرة الجارية', 'Active Instant Trip Progress')}</span>
              <span className="text-xs font-black text-indigo-400">
                {activeLocalRide.status === 'accepted' && t('🚗 توجه الآن لمكان الإركاب المحدد..', '🚗 Drive to Pickup Point now..')}
                {activeLocalRide.status === 'started' && t('🚀 العداد نشط: على الطريق للتنزيل..', '🚀 Ride Active: en route to dropoff..')}
              </span>
            </div>
            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></span>
          </div>

          {/* Interactive Navigation simulation view */}
          <div id="driver-map-view" className="relative w-full h-44 bg-[#050811] rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-end">
            <svg className="absolute inset-0 w-full h-full select-none" viewBox="100 100 200 200">
              <path d="M 0 150 L 400 150 M 150 0 L 150 400 M 0 200 L 400 200 M 200 0 L 200 400" stroke="rgba(38, 50, 75, 0.12)" strokeWidth="0.8" />

              {/* Driver current coordinates reference */}
              {(() => {
                const capCoords = loggedDriver.currentLocation || { x: 150, y: 150 };
                return (
                  <>
                    {/* Pickup point */}
                    <circle cx={activeLocalRide.pickupCoords.x} cy={activeLocalRide.pickupCoords.y} r="5" fill="#3b82f6" />
                    <circle cx={activeLocalRide.pickupCoords.x} cy={activeLocalRide.pickupCoords.y} r="10" fill="none" stroke="#3b82f6" strokeWidth="1.5" className="animate-ping" />

                    {/* Dropoff point */}
                    <circle cx={activeLocalRide.dropoffCoords.x} cy={activeLocalRide.dropoffCoords.y} r="5" fill="#10b981" />

                    {/* Core trip Route Path (pickup to dropoff) */}
                    <line 
                      x1={activeLocalRide.pickupCoords.x} 
                      y1={activeLocalRide.pickupCoords.y} 
                      x2={activeLocalRide.dropoffCoords.x} 
                      y2={activeLocalRide.dropoffCoords.y} 
                      stroke="#6366f1" 
                      strokeWidth="2.2" 
                      strokeDasharray="4 3" />

                    {/* ⚡ REQUIREMENT 1: Dynamic dispatch path from captain current location to passenger pickup */}
                    {activeLocalRide.status === 'accepted' && (
                      <>
                        {/* Captain starting position node */}
                        <circle cx={capCoords.x} cy={capCoords.y} r="4.5" fill="#fb923c" />
                        <circle cx={capCoords.x} cy={capCoords.y} r="8.5" fill="none" stroke="#fb923c" strokeWidth="1" className="animate-pulse" />
                        
                        {/* Shimmering Route Line linking captain to passenger */}
                        <line 
                          x1={capCoords.x} 
                          y1={capCoords.y} 
                          x2={activeLocalRide.pickupCoords.x} 
                          y2={activeLocalRide.pickupCoords.y} 
                          stroke="#fb923c" 
                          strokeWidth="2.5" 
                          strokeOpacity="0.45"
                        />
                        <line 
                          x1={capCoords.x} 
                          y1={capCoords.y} 
                          x2={activeLocalRide.pickupCoords.x} 
                          y2={activeLocalRide.pickupCoords.y} 
                          stroke="#fb923c" 
                          strokeWidth="1.5" 
                          strokeDasharray="4 3" 
                        />
                      </>
                    )}

                    {/* Blinking Driver dot traveling along the active phase */}
                    {activeLocalRide.status === 'accepted' && (() => {
                      const percent = isTracking ? 0 : (simTick / 100);
                      const drvX = capCoords.x + (activeLocalRide.pickupCoords.x - capCoords.x) * percent;
                      const drvY = capCoords.y + (activeLocalRide.pickupCoords.y - capCoords.y) * percent;
                      return (
                        <g>
                          <circle cx={drvX} cy={drvY} r="8.5" fill="#facc15" className="animate-ping" opacity="0.5" />
                          <circle cx={drvX} cy={drvY} r="7" fill="#facc15" stroke="#ea580c" strokeWidth="1" />
                          <text x={drvX - 3.5} y={drvY + 2.5} fontSize="7.5" fill="#000" fontWeight="bold">🚕</text>
                          
                          {/* Captain YOU Label tag */}
                          <rect x={drvX - 16} y={drvY - 14} width="32" height="9" rx="2" fill="#1e293b" stroke="#ea580c" strokeWidth="0.8" />
                          <text x={drvX} y={drvY - 7.5} fontSize="5.5" fill="#ea580c" fontWeight="black" textAnchor="middle">{t('موقعك', 'YOU')}</text>
                        </g>
                      );
                    })()}

                    {activeLocalRide.status === 'started' && (() => {
                      const percent = isTracking ? 0 : (simTick / 100);
                      const drvX = isTracking 
                        ? capCoords.x 
                        : (activeLocalRide.pickupCoords.x + (activeLocalRide.dropoffCoords.x - activeLocalRide.pickupCoords.x) * percent);
                      const drvY = isTracking 
                        ? capCoords.y 
                        : (activeLocalRide.pickupCoords.y + (activeLocalRide.dropoffCoords.y - activeLocalRide.pickupCoords.y) * percent);
                      return (
                        <g>
                          <circle cx={drvX} cy={drvY} r="8.5" fill="#10b981" className="animate-ping" opacity="0.5" />
                          <circle cx={drvX} cy={drvY} r="7" fill="#facc15" stroke="#10b981" strokeWidth="1" />
                          <text x={drvX - 3.5} y={drvY + 2.5} fontSize="7.5" fill="#000" fontWeight="bold">🚗</text>
                        </g>
                      );
                    })()}

                    {/* Render AI Speed Cameras, Radars, and Police Checkpoints */}
                    {activeLocalRideThreats.map((threat) => {
                      const tc = getThreatCoords(threat);
                      const color = threat.type === 'police_checkpoint' ? '#ef4444' : threat.type === 'fixed_camera' ? '#3b82f6' : '#f59e0b';
                      const emoji = threat.type === 'police_checkpoint' ? '👮' : threat.type === 'fixed_camera' ? '📷' : '⚡';
                      return (
                        <g key={threat.id} transform={`translate(${tc.x}, ${tc.y})`}>
                          <circle cx="0" cy="0" r="11" fill="none" stroke={color} strokeWidth="1" className="animate-ping" opacity="0.6" style={{ animationDuration: '3s' }} />
                          <circle cx="0" cy="0" r="8.5" fill="#0c0f1d" stroke={color} strokeWidth="1.5" />
                          <text x="0" y="2.5" fontSize="7" textAnchor="middle" className="pointer-events-none">{emoji}</text>
                          <title>{threat.nameAr} ({threat.limit} كم/س)</title>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>

            {/* Simulated overlays */}
            <div className="absolute top-2 right-2 bg-slate-950/85 px-2.5 py-1 rounded-lg text-[8px] border border-slate-800 text-slate-300 text-right font-sans">
              📦 {activeLocalRide.pickupName} ➔ 🏁 {activeLocalRide.dropoffName}
            </div>

            {/* Visual map legend for captains */}
            <div className="absolute top-2 left-2 bg-slate-950/90 p-1 rounded border border-slate-800 text-[6.5px] text-slate-400 flex flex-col gap-0.5 text-right font-sans">
              <div>🔵 {t('الراكب (الطلب)', 'Passenger')}</div>
              <div>🟢 {t('هدف التنزيل', 'Dropoff')}</div>
              <div>🟠 {t('مسار قارب الاستجابة', 'Dispatch Path')}</div>
            </div>

            {/* Real-time Tracking overlay trigger button */}
            <div className="absolute bottom-11 right-2 z-20">
              <button
                type="button"
                onClick={() => setIsTracking(!isTracking)}
                className={`px-2.5 py-1.5 rounded-xl text-[9.5px] font-black tracking-wide flex items-center gap-1.5 cursor-pointer transition-all duration-300 font-sans border shadow-lg ${
                  isTracking 
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-emerald-500/25 font-black animate-pulse'
                    : 'bg-indigo-600/95 text-slate-100 border-indigo-500 hover:bg-indigo-500 hover:scale-105'
                }`}
              >
                <Route className={`w-3.5 h-3.5 ${isTracking ? 'animate-spin' : ''}`} />
                <span>
                  {isTracking 
                    ? t('✓ تتبع المسار نشط', '✓ Route Tracking Active') 
                    : t('🗺️ تتبع المسار الفعلي', '🗺️ Track Actual Route')}
                </span>
                {isTracking && (
                  <span className="w-1.5 h-1.5 bg-slate-950 rounded-full animate-ping"></span>
                )}
              </button>
            </div>

            <div className="z-10 bg-gradient-to-t from-slate-950 to-transparent p-2 text-center text-[10px] text-slate-400 font-sans">
              {activeLocalRide.status === 'accepted' && t('مخطط الوصول المباشر نشط حرارياً. توجه لاستلام الراكب عبر الخط البرتقالي.', 'GPS direct pickup route active. Head to the passenger pickup neighborhood along the orange track.')}
              {activeLocalRide.status === 'started' && t('الرحلة مع الراكب في حركة نشطة. قم بإيصاله بأمان وجهز استلام الأجرة.', 'In Transit. Cruise to dropoff destination. Fare calculation locked.')}
            </div>
          </div>

          {/* AI Safety Speed Radar & Police Detector HUD Dashboard */}
          {activeLocalRide.status === 'started' && (
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3 font-sans text-right animate-fadeIn">
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-2.5 flex-row-reverse">
                <div className="flex items-center gap-1.5 flex-row-reverse">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <h3 className="text-xs font-black text-slate-100">
                    {t('مساعد الرادار والسلامة الذكي بـ AI', 'AI Smart Radar & Safety Copilot')}
                  </h3>
                </div>

                {/* Voice alert toggle */}
                <button
                  type="button"
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    isVoiceEnabled 
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                >
                  {isVoiceEnabled ? '🔊 ' + t('صوت نشط', 'Voice Active') : '🔇 ' + t('صامت', 'Muted')}
                </button>
              </div>

              {/* Bento Row: Speedometer + Live Threat Log */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                {/* Visual Speedometer & Threat Alert Indicator */}
                <div className="bg-slate-900/45 border border-slate-800/60 rounded-xl p-3 flex items-center justify-between flex-row-reverse">
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 block uppercase font-mono">
                      {t('سرعة المركبة الفعلية', 'Current Speed')}
                    </span>
                    <div className="flex items-baseline gap-1 flex-row-reverse">
                      <span className={`text-2xl font-black font-mono tracking-tight ${
                        activeLocalRideThreats.some(threat => {
                          const dist = threat.percent - (simTick / 100);
                          return dist > 0 && dist <= 0.12 && localSpeedometer > threat.limit;
                        }) ? 'text-red-500 animate-pulse' : 'text-emerald-400'
                      }`}>
                        {localSpeedometer}
                      </span>
                      <span className="text-[9px] text-slate-400">{t('كم/س', 'km/h')}</span>
                    </div>
                  </div>

                  {/* Icon status */}
                  <div className="flex flex-col items-center justify-center gap-1 bg-slate-950 p-2 rounded-xl border border-slate-800/40 min-w-[90px]">
                    <span className="text-[8px] text-slate-500 block">{t('الحد الأقصى', 'Limit')}</span>
                    {(() => {
                      const upcoming = activeLocalRideThreats.find(t => (t.percent - (simTick / 100)) > 0);
                      const currentLimit = upcoming ? upcoming.limit : 80;
                      const isSpeeding = localSpeedometer > currentLimit;
                      return (
                        <>
                          <span className={`text-xs font-black px-1.5 py-0.5 rounded ${
                            isSpeeding ? 'bg-red-500 text-slate-950 animate-bounce' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {currentLimit} {t('كم/س', 'km/h')}
                          </span>
                          {isSpeeding && (
                            <span className="text-[7.5px] text-red-400 font-bold animate-pulse">
                              ⚠️ {t('هدأ السرعة!', 'Slow Down!')}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* AI Threat Scanner Logs */}
                <div className="bg-slate-900/45 border border-slate-800/60 rounded-xl p-2.5 flex flex-col gap-1 text-[9px] justify-center text-right font-sans">
                  <div className="text-[8px] text-indigo-400 font-mono font-semibold flex justify-between items-center flex-row-reverse mb-1 border-b border-slate-800/30 pb-1">
                    <span>📡 {t('المسح المباشر للطرق', 'LIVE SCANNED FEED')}</span>
                    <span className="text-slate-500">Confidence 96%</span>
                  </div>
                  {(() => {
                    const upcoming = activeLocalRideThreats.find(t => (t.percent - (simTick / 100)) > 0);
                    if (upcoming) {
                      const distancePercent = Math.round((upcoming.percent - (simTick / 100)) * 100);
                      return (
                        <div className="flex flex-col gap-0.5 text-right">
                          <div className="text-slate-200 font-bold flex items-center gap-1 justify-end">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            <span>{upcoming.nameAr}</span>
                          </div>
                          <div className="text-indigo-300">
                            {t(`على بعد حوالي ${(distancePercent * 120).toFixed(0)} متر • السرعة المحددة: ${upcoming.limit} كم/س`, `Approx. ${(distancePercent * 120).toFixed(0)}m ahead • Limit: ${upcoming.limit} km/h`)}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-slate-500 text-center py-1">
                          🟢 {t('الطريق أمامك آمن تماماً ولا توجد رادارات نشطة حالياً', 'Route clear. No threat radars detected ahead.')}
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Community Alert Reporter Tools */}
              <div className="border-t border-slate-850 pt-2 flex flex-col gap-1.5 text-right font-sans">
                <span className="text-[8px] text-slate-500 block">
                  {t('🚨 مجتمع قوافل آدم: اضغط للإبلاغ الفوري وتنبيه السائقين الآخرين في موقعك الحالي:', '🚨 Adam Community: Report Speed Traps at your current GPS spot:')}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleReportThreat('fixed_camera')}
                    className="py-1.5 px-2 bg-blue-950/40 hover:bg-blue-900/35 text-blue-400 hover:text-blue-300 border border-blue-900/50 rounded-lg text-[9px] font-black transition flex items-center justify-center gap-1 cursor-pointer flex-row-reverse"
                  >
                    <span>📷 {t('كاميرا ثابتة', 'Fixed Cam')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReportThreat('mobile_radar')}
                    className="py-1.5 px-2 bg-yellow-950/40 hover:bg-yellow-900/35 text-yellow-400 hover:text-yellow-300 border border-yellow-900/50 rounded-lg text-[9px] font-black transition flex items-center justify-center gap-1 cursor-pointer flex-row-reverse"
                  >
                    <span>⚡ {t('رادار متحرك', 'Mobile Trap')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReportThreat('police_checkpoint')}
                    className="py-1.5 px-2 bg-red-950/40 hover:bg-red-900/35 text-red-400 hover:text-red-300 border border-red-900/50 rounded-lg text-[9px] font-black transition flex items-center justify-center gap-1 cursor-pointer flex-row-reverse"
                  >
                    <span>👮 {t('دورية شرطة', 'Police Check')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick External Map Navigation Launcher */}
          {(() => {
            const pickupGeo = getGeoCoords(activeLocalRide.pickupCoords.x, activeLocalRide.pickupCoords.y);
            const dropoffGeo = getGeoCoords(activeLocalRide.dropoffCoords.x, activeLocalRide.dropoffCoords.y);
            
            const targetGeo = activeLocalRide.status === 'accepted' ? pickupGeo : dropoffGeo;
            const targetName = activeLocalRide.status === 'accepted' ? activeLocalRide.pickupName : activeLocalRide.dropoffName;
            
            return (
              <div id="driver-external-navigation-card" className="bg-slate-950/90 rounded-2xl p-4 border border-indigo-500/20 flex flex-col gap-3 font-sans text-right animate-fadeIn mt-0.5">
                <div className="flex justify-between items-center-reverse flex-row-reverse border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-black text-indigo-400 flex items-center gap-1 flex-row-reverse">
                    <Navigation className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                    {activeLocalRide.status === 'accepted' 
                      ? t('🧭 توجيه خارجي لمكان استلام الراكب', '🧭 Navigate to Active Pickup Location')
                      : t('🧭 توجيه خارجي لموقع التنزيل النهائي', '🧭 Navigate to Grand Final Dropoff Location')}
                  </span>
                  <span className="text-[8px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono font-bold">
                    {activeLocalRide.status === 'accepted' ? t('إحداثيات الاستلام', 'Pickup GPS') : t('إحداثيات التنزيل', 'Dropoff GPS')}
                  </span>
                </div>

                {autoLaunchStatusMsg && (
                  <div className="bg-indigo-950 border border-indigo-500/40 p-2.5 rounded-xl text-center text-[9.5px] text-indigo-300 font-bold animate-pulse leading-normal">
                    {autoLaunchStatusMsg}
                  </div>
                )}
                
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850 text-right text-[9px] text-slate-400 flex flex-col gap-1">
                  <div className="flex justify-between flex-row-reverse">
                    <span>{t('الموقع المحدد:', 'Selected Place:')}</span>
                    <strong className="text-slate-200">{targetName}</strong>
                  </div>
                  <div className="flex justify-between flex-row-reverse font-mono text-[8px] text-slate-500">
                    <span>{t('إحداثيات دقيقة:', 'Exact GPS Coords:')}</span>
                    <strong>{targetGeo.lat.toFixed(6)}, {targetGeo.lng.toFixed(6)}</strong>
                  </div>
                </div>

                {/* Unified Single Map Route Navigation Buttons */}
                <div className="flex flex-col gap-2">
                  <a
                    id="link-google-route-full"
                    href={`https://www.google.com/maps/dir/?api=1&origin=${pickupGeo.lat},${pickupGeo.lng}&destination=${dropoffGeo.lat},${dropoffGeo.lng}&travelmode=driving&dir_action=navigate`}
                    target="_blank"
                    rel="no-referrer"
                    className="w-full bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white py-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer text-center shadow-lg shadow-indigo-950/40"
                  >
                    <span>🗺️ {t('فتح مسار الرحلة الموحد (نقطة الانطلاق + الإنزال على خريطة واحدة)', 'Open Unified Route (Pickup & Dropoff on 1 Map)')}</span>
                  </a>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Google Maps Link with precise turn-by-turn driving route connecting pickup to dropoff */}
                    <a
                      id="link-google-maps-target"
                      href={`https://www.google.com/maps/dir/?api=1&origin=${pickupGeo.lat},${pickupGeo.lng}&destination=${dropoffGeo.lat},${dropoffGeo.lng}&travelmode=driving&dir_action=navigate`}
                      target="_blank"
                      rel="no-referrer"
                      className="bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 hover:text-white py-2.5 rounded-xl text-[10.5px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center shadow-sm"
                    >
                      📍 {t('مسار Google الموحد 🗺️', 'Google Maps Route 🗺️')}
                    </a>

                    {/* Waze Link with destination guidance */}
                    <a
                      id="link-waze-target"
                      href={`https://waze.com/ul?ll=${dropoffGeo.lat},${dropoffGeo.lng}&navigate=yes`}
                      target="_blank"
                      rel="no-referrer"
                      className="bg-amber-500/20 hover:bg-amber-500 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-slate-950 py-2.5 rounded-xl text-[10.5px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center shadow-sm"
                    >
                      🚗 {t('مسار Waze المباشر 🧭', 'Waze App Route 🧭')}
                    </a>
                  </div>
                </div>

                {/* Automation Integration Control */}
                <div className="mt-2 pt-3 border-t border-slate-850 flex flex-col gap-1.5 text-right">
                  <div className="flex justify-between items-center flex-row-reverse text-[9.5px]">
                    <span className="font-extrabold text-indigo-400">⚙️ التوجيه الملاحي التلقائي عند قبول الرحلة (Auto-Launch)</span>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded font-bold">
                      مفعل تلقائياً ⚡
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAutoLaunchMapPref('none');
                        localStorage.setItem('adam_auto_launch_map', 'none');
                      }}
                      className={`py-1.5 rounded-lg text-[9px] font-bold transition border cursor-pointer ${
                        autoLaunchMapPref === 'none'
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-md'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      ❌ {t('معطل (يدوي)', 'Manual')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAutoLaunchMapPref('google');
                        localStorage.setItem('adam_auto_launch_map', 'google');
                      }}
                      className={`py-1.5 rounded-lg text-[9px] font-bold transition border cursor-pointer ${
                        autoLaunchMapPref === 'google'
                          ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-md'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      📍 {t('Google تلقائي', 'Google Auto')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAutoLaunchMapPref('waze');
                        localStorage.setItem('adam_auto_launch_map', 'waze');
                      }}
                      className={`py-1.5 rounded-lg text-[9px] font-bold transition border cursor-pointer ${
                        autoLaunchMapPref === 'waze'
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-md'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      🚗 {t('Waze تلقائي', 'Waze Auto')}
                    </button>
                  </div>
                  <p className="text-[8.5px] text-slate-500 leading-normal">
                    * عند تفعيل الخيار التلقائي، سيقوم آدم بتحويلك بضغطة زر إلى نظام التوجيه الملاحي الفوري بمجرد استقبال وقبول الرحلة لضمان وصول سلس وسريع.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* ADAM WebSockets Secured Gateway UI console */}
          {wsConnected && (
            <div id="driver-ws-telemetry-console" className="bg-slate-950/95 border border-purple-500/20 rounded-xl p-3 flex flex-col gap-2 font-sans animate-fadeIn">
              <div className="flex justify-between items-center flex-row-reverse border-b border-slate-900 pb-1.5">
                <div className="flex items-center gap-1.5 flex-row-reverse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <strong className="text-[10px] text-slate-200">بث الموقع الجغرافي المباشر (Secure WS Enabled)</strong>
                </div>
                <span className="text-[8px] text-purple-400 font-mono font-bold uppercase tracking-wider bg-purple-500/10 px-1.5 py-0.5 rounded">
                  WS BROADCAST ACTIVE
                </span>
              </div>
              <div className="text-[8px] text-slate-500 font-mono select-all text-right">
                URL: adam-ws://live-hub.adamride.com/ride/{activeLocalRide.id}
              </div>
              
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-850/80 font-mono text-[7.5px] text-slate-400 flex flex-col gap-1 max-h-[140px] overflow-y-auto text-right">
                {wsLogs.map((log, idx) => (
                  <div key={idx} className="pb-1 border-b border-slate-950/40 last:border-0 select-all whitespace-pre-wrap">
                    {log}
                  </div>
                ))}
              </div>
              <div className="text-[8px] text-slate-555 flex justify-between flex-row-reverse text-slate-500 font-sans leading-tight">
                <span>تحديث تلقائي: كل {isTurbo ? '1 ثانية (Turbo)' : '5 ثوانٍ'}</span>
                <span>تشفير المسار: معتمد (AES)</span>
              </div>
            </div>
          )}

          {/* Ride Details Summary */}
          <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-800 flex flex-col gap-2.5 font-sans">
            <h4 className="text-xs font-bold text-slate-200 border-b border-slate-800 pb-1.5 lg:text-right">
              {t('تفاصيل التوصيل وحسابات الرصيد', 'Trip Calculations & Ledger Summary')}
            </h4>

            <div className="grid grid-cols-2 gap-2 text-right text-[10px] font-sans">
              <div>
                <span className="text-slate-500 block">{t('الراكب المتصل', 'Passenger Name')}</span>
                <span className="font-bold text-slate-200 block">{activeLocalRide.passengerName}</span>
                <span className="text-slate-400 text-[9.5px] font-mono select-all">📱 {activeLocalRide.passengerPhone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{t('نوع التوصيل الفردي', 'Service Category')}</span>
                <span className="font-bold text-indigo-400 block">{t('إقلال فوري محلي', 'Local Instant Trip')}</span>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 block">{t('مسافة العداد الفعالة', 'Trip Distance')}</span>
                <span className="font-bold text-slate-200 font-mono text-xs">{activeLocalRide.distanceKm} {t('كم', 'KM')}</span>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 block">{t('الزمن المتوقع للحركة', 'Estimated Time')}</span>
                <span className="font-bold text-slate-200 font-mono text-xs">{activeLocalRide.durationMin} {t('دقيقة', 'min')}</span>
              </div>
            </div>

            {/* Financial Calculations breakdowns */}
            <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-850 flex flex-col gap-1.5 text-[10px] text-slate-300 font-sans mt-1">
              <div className="flex justify-between flex-row-reverse">
                <span>{t('إجمالي أجرة المشوار (مخصومة من الراكب):', 'Grand Trip Fare Paid by Passenger:')}</span>
                <strong className="text-emerald-400 font-mono">{activeLocalRide.price.toFixed(2)} د.أ</strong>
              </div>
              <div className="flex justify-between flex-row-reverse text-slate-450">
                <span>{t('عمولة تيسير التطبيق (%25):', 'Adam System Commission (25%):')}</span>
                <strong className="text-red-400 font-mono">-{activeLocalRide.commission.toFixed(2)} د.أ</strong>
              </div>
              <div className="h-[1px] bg-slate-800/80 my-0.5"></div>
              <div className="flex justify-between flex-row-reverse text-emerald-300 font-bold">
                <span>{t('أرباحك الصافية المضافة لمحفظتك:', 'Your Net Earnings Credited to Wallet:')}</span>
                <strong className="text-emerald-400 font-mono text-xs">{(activeLocalRide.price - activeLocalRide.commission).toFixed(2)} د.أ</strong>
              </div>
            </div>

            {/* Multi-step Ride Handler buttons & OTP Verification */}
            {activeLocalRide.status === 'accepted' && (() => {
              const capCoords = loggedDriver.currentLocation || { x: 150, y: 150 };
              const dx = activeLocalRide.pickupCoords.x - capCoords.x;
              const dy = activeLocalRide.pickupCoords.y - capCoords.y;
              const distanceToPassenger = Math.hypot(dx, dy);

              return (
                <div className="flex flex-col gap-2.5 font-sans mt-2">
                  {/* OTP PIN Input Box */}
                  <div className="bg-slate-950/90 border-2 border-indigo-500/50 rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-lg">
                    <div className="flex justify-between items-center flex-row-reverse border-b border-slate-850 pb-1.5">
                      <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5 flex-row-reverse">
                        <span>🔒 {t('رمز أمان بدء الرحلة (PIN من الراكب):', 'Trip Security PIN (From Passenger):')}</span>
                      </span>
                      <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-bold">
                        {t('مطلوب للبدء ⚡', 'Required to Start ⚡')}
                      </span>
                    </div>

                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="••••"
                        className="flex-1 bg-slate-900 border-2 border-indigo-400/60 focus:border-indigo-400 focus:outline-none rounded-xl px-3 py-2.5 text-center text-xl font-mono font-black text-amber-300 tracking-[0.4em] placeholder:text-slate-600 shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => handleStartRide(activeLocalRide.id, otpInput)}
                        disabled={otpInput.trim().length !== 4}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                          otpInput.trim().length === 4
                            ? 'bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 shadow-emerald-500/25 animate-pulse'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <Check className="w-4 h-4 shrink-0" />
                        <span>{t('تحقق وبدء 🏁', 'Verify & Start 🏁')}</span>
                      </button>
                    </div>

                    <p className="text-[9px] text-slate-400 text-right leading-relaxed">
                      {t(
                        '💡 اطلب الرمز المكون من 4 أرقام من شاشة هاتف الراكب عند وصولك وصعوده السيارة لبدء العداد وحساب المسار.',
                        '💡 Ask the passenger for the 4-digit code displayed on their screen to start trip meter and routing.'
                      )}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmCancel(true);
                        setConfirmStart(false);
                      }}
                      className="w-full bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white py-2 rounded-xl text-xs font-bold transition cursor-pointer text-center"
                    >
                      {t('إلغاء قبول الرحلة ✕', 'Cancel Trip Acceptance ✕')}
                    </button>
                  </div>
                </div>
              );
            })()}

             {/* Beautiful Custom Confirmation Modal for Driver */}
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
                         {t('تأكيد إلغاء المشوار الداخلي الفوري', 'Confirm Cancelling Instant Ride')}
                       </h3>
                       <p className="text-[10.5px] text-slate-400 leading-relaxed">
                         {t(
                           'كابتن، هل أنت متأكد من رغبتك في الاعتذار وإلغاء هذا المشوار الفوري؟ قد يؤدي الإلغاء المتكرر بعد القبول إلى الحد من أولوية طلباتك وصحة تقييم حسابك.',
                           'Captain, are you sure you want to cancel this instant trip? Frequent cancellations after acceptance may restrict your account access and health rate.'
                         )}
                       </p>
                     </div>
                     
                     <div className="w-full bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl text-[9.5px] text-red-400 leading-relaxed text-right font-bold">
                       ⚠️ {t('تنبيه أمان السياقة: يرجى الوقوف بمركبتك الآمن تماماً على جانب الطريق الفرعي قبل إجراء هذا الإلغاء لتجنب الحوادث المرورية.', 'Driving Safety: Please stop your vehicle completely and safely on the road shoulder before cancelling to avoid any road hazards.')}
                     </div>

                     <div className="flex gap-2.5 w-full mt-1">
                       <button
                         type="button"
                         onClick={() => setConfirmCancel(false)}
                         className="flex-1 bg-slate-900 hover:bg-[#1a2130] border border-slate-800 text-slate-350 hover:text-slate-200 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                       >
                         {t('الرجوع ومتابعة الرحلة', 'Resume Ride')}
                       </button>
                       <button
                         type="button; submit"
                         onClick={() => {
                           cancelIntraCityRide(activeLocalRide.id, 'driver');
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

            {activeLocalRide.status === 'started' && (
              confirmEnd ? (
                <button
                  type="button"
                  onClick={() => {
                    handleEndRide(activeLocalRide.id);
                    setConfirmEnd(false);
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black py-3 rounded-2xl text-xs font-mono transition active:scale-[98%] flex items-center justify-center gap-1.5 cursor-pointer mt-1 shadow-lg animate-pulse"
                >
                  <Route className="w-4.5 h-4.5" />
                  <span>{t('تأكيد الوصول النهائي وتحصيل الأجرة 🏁', 'Confirm Dropoff & Collect JOD 🏁')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmEnd(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl text-xs font-mono transition active:scale-[98%] flex items-center justify-center gap-1.5 cursor-pointer mt-1 shadow-lg shadow-emerald-650/10"
                >
                  <Route className="w-4.5 h-4.5" />
                  <span>{t('توصيل وإنهاء مشوار الإركاب الفوري 🏁', 'Complete Trip & Collect Fare JOD 🏁')}</span>
                </button>
              )
            )}
          </div>
        </motion.div>
      ) : (
        /* Driver is Free / Online Status Scanning */
        <div className="flex-1 flex flex-col gap-4">
          
          {/* OFFLINE WARNING AND PROMPT */}
          {!loggedDriver.isOnline ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-xl flex flex-col items-center gap-3 font-sans">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                <Compass className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-xs font-bold text-slate-300">
                {t('⚠️ رادار استقبال الطلبات الفورية مطفأ حالياً', '⚠️ Instant ride radar is currently offline')}
              </h4>
              <p className="text-[10.5px] text-slate-500 leading-relaxed max-w-sm">
                {t('يرجى النقر على زر "متصل" الموضح بالأعلى لتنضم للموجة وتظهر للركاب القريبين لتبدأ باستقبال طلبات التوصيل الداخلي.', 'Click "ONLINE" above to bind your coordinates, become visible on nearby passenger radars and start earning local trip fares.')}
              </p>
            </div>
          ) : (
            /* ONLINE & RADAR SCANNING ACTIVE */
            <div className="flex-1 flex flex-col gap-4 font-sans">
              
              {/* Live Traffic Congestion Radar Map Indicator & Control Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
                {/* Dashboard Header */}
                <div className="flex justify-between items-center text-right flex-row-reverse border-b border-slate-800/80 pb-3">
                  <div>
                    <h4 className="text-xs font-black text-slate-100 flex items-center gap-1.5 flex-row-reverse">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
                      </span>
                      <span>{t('رادار مراقبة ازدحام الطرق المباشر', 'Live Road Traffic Congestion Radar')}</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                      {t('بيانات حية ومحاكاة ذكية لحالة السير في الشرايين والمداخل الرئيسية للأردن', 'Real-time simulated traffic conditions in main Jordanian transport veins')}
                    </p>
                  </div>
                  
                  {/* Quick Dynamic Simulation Trigger Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setTrafficState(prev => prev.map(street => {
                        const randomLoad = Math.floor(Math.random() * 81) + 15; // 15% to 95%
                        return {
                          ...street,
                          load: randomLoad,
                          dense: randomLoad > 65
                        };
                      }));
                    }}
                    className="p-1.5 px-2.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-black cursor-pointer transition flex items-center gap-1 flex-row-reverse"
                    title={t('تعديل ومحاكاة عشوائية لحالة الطرق', 'Shuffle simulated road traffic snapshot')}
                  >
                    <span>🔄 {t('تحديث ومحاكاة', 'Simulate Refresh')}</span>
                  </button>
                </div>

                {/* Grid Split Content: SVG Radar Left & Traffic details monitor list Right */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                  
                  {/* Left (or Upper): Immersive circular sweep radar HUD */}
                  <div className="md:col-span-5 bg-[#050811] border border-slate-850 rounded-xl relative overflow-hidden h-44 flex flex-col justify-center items-center">
                    <div className="absolute inset-0 select-none">
                      <svg className="w-full h-full" viewBox="100 100 200 200">
                        {/* Concentric grid circular frames */}
                        <circle cx="200" cy="200" r="30" fill="none" stroke="#101b38" strokeWidth="0.5" />
                        <circle cx="200" cy="200" r="60" fill="none" stroke="#101b38" strokeWidth="0.5" />
                        <circle cx="200" cy="200" r="85" fill="none" stroke="#122c54" strokeWidth="0.6" strokeDasharray="3,3" />
                        
                        {/* Radar grid coordinates */}
                        <line x1="100" y1="200" x2="300" y2="200" stroke="#0e172a" strokeWidth="0.5" />
                        <line x1="200" y1="100" x2="200" y2="300" stroke="#0e172a" strokeWidth="0.5" />

                        {/* RENDER DYNAMIC COGESTION ROAD PATTERNS (RED OR GREEN PATHS WITH INDETERMINISTIC DIRECTIVITY) */}
                        {trafficState.map((street) => {
                          const strokeColor = street.dense ? "#ef4444" : "#10b981";
                          const glowEffect = street.dense ? "drop-shadow-[0_0_3px_#ef4444]" : "drop-shadow-[0_0_3px_#10b981]";
                          
                          if (street.isCurve) {
                            return (
                              <path 
                                key={street.id}
                                d={street.d}
                                fill="none" 
                                stroke={strokeColor} 
                                strokeWidth="2.5" 
                                strokeLinecap="round" 
                                className="transition-all duration-1000"
                                style={{ filter: glowEffect }}
                                opacity="0.85" 
                              />
                            );
                          } else {
                            return (
                              <line 
                                key={street.id}
                                x1={street.x1} 
                                y1={street.y1} 
                                x2={street.x2} 
                                y2={street.y2} 
                                stroke={strokeColor} 
                                strokeWidth="2.5" 
                                strokeLinecap="round" 
                                className="transition-all duration-1000"
                                style={{ filter: glowEffect }}
                                opacity="0.85" 
                              />
                            );
                          }
                        })}

                        {/* Interactive sweeping pulse radar beam */}
                        <circle cx="200" cy="200" r={(simTick % 4) * 23 + 5} fill="none" stroke="#6366f1" strokeWidth="0.6" opacity="0.4" className="transition-all duration-500" />
                        <line 
                          x1="200" 
                          y1="200" 
                          x2="280" 
                          y2="120" 
                          stroke="#6366f1" 
                          strokeWidth="1.2" 
                          className="origin-center" 
                          style={{ transform: `rotate(${simTick * 3.6}deg)` }} 
                        />
                      </svg>
                    </div>

                    {/* Minimalist Live Scanning Status Banner overlay */}
                    <div className="absolute top-2 left-2 bg-slate-950/80 border border-slate-800 rounded-md px-1.5 py-0.5 text-[8px] font-mono text-cyan-400 select-none flex items-center gap-1">
                      <span className="h-1 w-1 bg-cyan-400 rounded-full animate-ping"></span>
                      <span>{t('تحديث النظام: مباشر', 'GPS FEED: LIVE')}</span>
                    </div>

                    <div className="z-10 px-4 mt-auto mb-2 bg-slate-950/90 py-1.5 px-3 rounded-xl border border-slate-800 max-w-[90%] pointer-events-none">
                      <h4 className="text-[10px] font-bold text-indigo-400 flex items-center justify-center gap-1 flex-row-reverse animate-pulse">
                        <span>📡 {t('الرادار نشط والمسح مرئي', 'Radar sweep active')}</span>
                      </h4>
                    </div>
                  </div>

                  {/* Right (or Lower): List of highways with progress bars and dense warning indexes */}
                  <div className="md:col-span-7 flex flex-col justify-between gap-2 text-right">
                    
                    {/* Color Map Guide (Legend) */}
                    <div className="flex gap-4 justify-end text-[9px] font-bold text-slate-400 px-1 border-b border-slate-850 pb-1.5 flex-row-reverse">
                      <span className="flex items-center gap-1 flex-row-reverse">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_4px_#10b981]"></span>
                        <span>{t('طريق سالك (حركة طبيعية)', 'Clear (Normal load)')}</span>
                      </span>
                      <span className="flex items-center gap-1 flex-row-reverse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_4px_#ef4444]"></span>
                        <span>{t('طريق مزدحم جداً (تباطؤ)', 'Congested (High density)')}</span>
                      </span>
                    </div>

                    {/* Streets detailed list */}
                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {trafficState.map((street) => (
                        <div key={street.id} className="bg-slate-950/50 p-2 rounded-lg border border-slate-850/80 hover:bg-slate-950 transition flex flex-col gap-1 text-right">
                          <div className="flex justify-between items-center flex-row-reverse">
                            <span className="text-[10px] font-bold text-slate-200" title={street.nameEn}>{street.nameAr}</span>
                            <span className={`text-[9px] font-mono font-black ${street.dense ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {street.dense ? t('مزدحم جداً ⚠️', 'High Traffic ⚠️') : t('سالك وآمن ✓', 'Smooth Clear ✓')} ({street.load}%)
                            </span>
                          </div>
                          
                          {/* Mini dynamic progress bar tracker */}
                          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                street.dense ? 'bg-gradient-to-l from-rose-500 to-amber-500' : 'bg-gradient-to-l from-[#10b981] to-emerald-400'
                              }`}
                              style={{ width: `${street.load}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-[9px] text-slate-500 italic leading-snug">
                      * {t('يقوم الرادار بمسح الاختناقات بصورة ذكية لمساعدتك على تفادي الطرق المغلقة أو المزدحمة لركوب أسرع للعميل.', 'Radar system tracks blockages to optimize routes, ensuring passenger speed and efficient trip completion.')}
                    </p>
                  </div>

                </div>
              </div>

              {/* PENDING REQUESTS DISPLAY */}
              <div className="flex-1 flex flex-col gap-3 text-right">
                <h4 className="text-xs font-bold text-slate-300 px-1 border-r-2 border-indigo-500 pr-2">
                  {t('طلبات الإرشاد الفوري المتاحة حالياً', 'Available Instant Requests')} ({pendingRequests.filter(r => !ignoredRides.includes(r.id)).length})
                </h4>

                {pendingRequests.filter(r => !ignoredRides.includes(r.id)).length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 italic text-[11px] font-sans">
                    {t('لا توجد طليات إركاب فورية نشطة في المحافظة حالياً. انتظر قليلاً.. 🔎', 'No active instant requests nearby in this governorate. Standby.. 🔎')}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {pendingRequests.filter(r => !ignoredRides.includes(r.id)).map((req, index) => {
                      const isBalanceSufficient = (loggedDriver?.balance ?? 0) >= req.commission;
                      const isNearest = index === 0;
                      const isTargetedToMe = req.targetedDriverId === loggedDriver?.id;
                      const isTargetedToOther = req.targetedDriverId && req.targetedDriverId !== loggedDriver?.id;

                      let secLeft = 20;
                      if (req.dispatchExpiresAt) {
                        const diffMs = new Date(req.dispatchExpiresAt).getTime() - nowTime;
                        secLeft = Math.max(0, Math.ceil(diffMs / 1000));
                      }

                      return (
                        <div key={req.id} className={`bg-slate-900 border rounded-2xl p-4 flex flex-col gap-3 shadow-lg transition ${
                          isTargetedToMe 
                            ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50' 
                            : isNearest 
                            ? 'border-indigo-500/80 shadow-indigo-950/40' 
                            : 'border-slate-800 hover:border-indigo-500/40'
                        }`}>
                          {/* Uber Targeted Banner */}
                          {isTargetedToMe && (
                            <div className="bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-amber-500/10 border border-amber-400/60 p-2.5 rounded-xl flex items-center justify-between text-right font-sans">
                              <div className="flex items-center gap-2 flex-row-reverse">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                </span>
                                <div className="text-[10px] text-amber-200 font-bold">
                                  ⚡ {t('طلب موجه لك حصرياً لأنك الكابتن الأقرب للراكب!', 'Exclusive request targeted to you as nearest driver!')}
                                </div>
                              </div>
                              <span className="bg-black/60 text-amber-300 font-mono font-black text-[11px] px-2.5 py-1 rounded-lg border border-amber-400/40 animate-pulse">
                                ⏰ {secLeft}s
                              </span>
                            </div>
                          )}

                          {isTargetedToOther && (
                            <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl text-[9.5px] text-slate-400 flex items-center justify-between flex-row-reverse font-sans">
                              <span>⏳ {t('الطلب موجه آلياً للكابتن الأقرب للراكب حالياً.. سيصلك تلقائياً إذا تجاوز الكابتن الطلب.', 'Request is currently targeted to nearest captain.. will cascade to you if skipped.')}</span>
                              <span className="font-mono text-[9px] text-slate-500">جاري الانتظار</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-[10px] border-b border-slate-800/80 pb-2 flex-row-reverse font-sans">
                            <div className="flex items-center gap-1.5 flex-row-reverse">
                              <span className="font-bold text-indigo-400">{t('طلب إركاب فوري وارد ⚡', 'Incoming Instant Ride ⚡')}</span>
                              {isNearest && (
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[8.5px] font-bold flex items-center gap-1">
                                  <span>📍 الأقرب لموقعك المباشر ({req.distFromDriverKm} كم)</span>
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 font-mono text-[9px]">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          {/* Travel specs */}
                          <div className="grid grid-cols-2 gap-2 text-right text-[10.5px] font-sans">
                            <div>
                              <span className="text-slate-500 block">{t('نقطة الإركاب', 'Pickup')}</span>
                              <strong className="text-slate-200 block">📍 {req.pickupName}</strong>
                              <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">
                                🚗 يبعد عن موقعك: {req.distFromDriverKm} كم
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">{t('محطة الإنزال', 'Dropoff')}</span>
                              <strong className="text-slate-200 block">🏁 {req.dropoffName}</strong>
                            </div>
                            <div className="pt-1">
                              <span className="text-slate-500 block">{t('مسافة العداد', 'Distance')}</span>
                              <span className="font-bold text-slate-100 font-mono block">{req.distanceKm} كم</span>
                            </div>
                            <div className="pt-1">
                              <span className="text-slate-500 block">{t('الزمن المتوقع', 'Estimated Duration')}</span>
                              <span className="font-bold text-slate-100 font-mono block">{req.durationMin} دقيقة</span>
                            </div>
                          </div>

                          {/* Ledger pricing for driver */}
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex flex-col gap-1.5 text-[10px] text-slate-300 font-sans">
                            <div className="flex justify-between flex-row-reverse">
                              <span>{t('قيمة الأجرة التي سيدفعها الراكب:', 'Passenger Paid Fare:')}</span>
                              <strong className="text-emerald-400 font-mono">{req.price.toFixed(2)} د.أ</strong>
                            </div>
                            <div className="flex justify-between flex-row-reverse text-slate-500">
                              <span>{t('عمولة دعم التطبيق المستقطعة (%25):', 'Company Commission Fee (25%):')}</span>
                              <strong className="text-red-400 font-mono">-{req.commission.toFixed(2)} د.أ</strong>
                            </div>
                            <div className="h-[0.8px] bg-slate-800/60 my-0.5"></div>
                            <div className="flex justify-between flex-row-reverse text-emerald-300 font-bold">
                              <span>{t('ربحك الصافي المتوقع ليدخل محفظتك:', 'Expected Net Deposit Credited to Wallet:')}</span>
                              <strong className="text-emerald-400 font-mono font-bold text-xs">{(req.price - req.commission).toFixed(2)} د.أ</strong>
                            </div>
                          </div>

                          {/* Security warning on safety coverage */}
                          {!isBalanceSufficient && (
                            <div className="p-2.5 bg-red-950/30 border border-red-900/40 rounded-xl text-[9px] text-red-300 flex items-start gap-1 flex-row-reverse leading-relaxed font-sans mt-0.5">
                              <ShieldAlert className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
                              <span>
                                {t(`عفواً! رصيد محفظتك الحالي (${(loggedDriver?.balance ?? 0).toFixed(2)} د.أ) غيّر كافٍ لتغطية عمولة تسيير الرحلة للشركة البالغة (${req.commission.toFixed(2)} د.أ). يرجى شحن محفظة السائق وتجديد الرصيد أولاً لتتمكن من تفعيل وقبول الرحلة المباشرة.`, `Warning! Your current drive wallet (${(loggedDriver?.balance ?? 0).toFixed(2)} JD) is insufficient to cover this trip's commission of (${req.commission.toFixed(2)} JD). Please top up your driver balance first.`)}
                              </span>
                            </div>
                          )}

                          {/* Actions accepted row */}
                          <div className="flex gap-2 font-sans mt-1">
                            <motion.button
                              type="button"
                              onClick={() => handleAcceptRide(req.id)}
                              disabled={!isBalanceSufficient}
                              animate={isBalanceSufficient && (isTargetedToMe || recentRequestsAlert[req.id]) ? {
                                scale: [1, 1.03, 1],
                              } : {}}
                              transition={(isTargetedToMe || recentRequestsAlert[req.id]) ? {
                                duration: 1.0,
                                repeat: Infinity,
                                ease: "easeInOut"
                              } : {}}
                              whileTap={isBalanceSufficient ? { scale: 0.95 } : undefined}
                              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-200 ease-in-out active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                                !isBalanceSufficient
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  : isTargetedToMe
                                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-black border border-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.7)] font-black text-sm'
                                  : recentRequestsAlert[req.id]
                                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] font-black'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }`}
                            >
                              <span>{isTargetedToMe ? t('قبول وتلقي الرحلة فوراً (أوبر) ⚡', 'Accept Exclusive Trip Now ⚡') : t('قبول وتلقي الرحلة فوراً ⚡', 'Accept Trip Now ⚡')}</span>
                              {isBalanceSufficient && (isTargetedToMe || recentRequestsAlert[req.id]) && (
                                <span className="text-[9px] bg-black text-amber-300 px-1.5 py-0.5 rounded-full font-sans font-black mr-1 animate-pulse border border-amber-400/40">
                                  {isTargetedToMe ? t('موجه لك ⚡', 'Targeted ⚡') : t('جديد ⚡', 'New ⚡')}
                                </span>
                              )}
                            </motion.button>

                            <button
                              type="button"
                              onClick={() => handleDeclineRide(req.id)}
                              className="px-3 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 rounded-xl text-[11px] cursor-pointer flex items-center gap-1"
                            >
                              <span>{isTargetedToMe ? t('تجاوز / تمرير للكابتن التالي ⏭️', 'Skip to Next Captain ⏭️') : t('تجاهل', 'Ignore')}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
};
