import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Settings, 
  X, 
  HelpCircle, 
  Play, 
  Globe, 
  User, 
  Check, 
  ShieldAlert, 
  Flame, 
  Moon, 
  Radio
} from 'lucide-react';
import { useAppState } from '../stateEngine';

// Sound synthesis using Web Audio API for zero external file dependency
const playAssistantSound = (type: 'wake' | 'listening' | 'done' | 'error') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'wake') {
      // Elegant futuristic double-beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain2.gain.setValueAtTime(0, ctx.currentTime);
      gain2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc2.start();
      
      osc.stop(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.45);
    } else if (type === 'listening') {
      // Gentle invitation tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'done') {
      // Success slide up
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(987.77, ctx.currentTime + 0.18); // B5
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'error') {
      // Error double buzz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.warn("Web Audio API not supported or interaction blocked:", e);
  }
};

export const AdamVoiceAssistant: React.FC = () => {
  const { language, setLanguage, t, activeCountryCode, setActiveCountryCode } = useAppState();

  const isArabicText = (text: string) => {
    return /[\u0600-\u06FF]/.test(text);
  };

  const [isOpen, setIsOpen] = useState(false);
  const [isWakeWordListening, setIsWakeWordListening] = useState(() => {
    return localStorage.getItem('adam_wake_word_active') === 'true';
  });
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [voiceInputLang, setVoiceInputLang] = useState<'auto' | 'ar' | 'en'>(() => {
    return (localStorage.getItem('adam_voice_input_lang') as 'auto' | 'ar' | 'en') || 'auto';
  });
  
  // Statuses: 'sleeping' | 'listening-wake' | 'listening-command' | 'processing' | 'speaking' | 'error'
  const [status, setStatus] = useState<'sleeping' | 'listening-wake' | 'listening-command' | 'processing' | 'speaking' | 'error'>('sleeping');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [lastAction, setLastAction] = useState('');
  
  const [selectedVoiceGender, setSelectedVoiceGender] = useState<'male' | 'female'>('male');
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    localStorage.setItem('adam_voice_input_lang', voiceInputLang);
  }, [voiceInputLang]);

  // Recognition refs to keep alive
  const wakeRecognitionRef = useRef<any>(null);
  const commandRecognitionRef = useRef<any>(null);
  const isTransitioningRef = useRef<boolean>(false);

  // Predefined interactive voice simulation cards for ease of use
  const demoCommands = [
    { text: 'يا آدم افتح محفظتي المالية', label: '💳 فتح المحفظة' },
    { text: 'يا آدم غير لغة التطبيق إلى الإنجليزية', label: '🇬🇧 English Language' },
    { text: 'يا آدم غير لغة التطبيق إلى الفرنسية', label: '🇫🇷 French Language' },
    { text: 'يا آدم اريد حجز رحلة من سموع الكورة إلى عمان', label: '🚗 طلب رحلة ذكية' },
    { text: 'يا آدم افتح إعدادات الحساب', label: '⚙️ صفحة الإعدادات' },
    { text: 'ما هي حافلة تجميع ركاب آدم؟', label: '🤖 استفسار جيميناي' },
    { text: 'يا آدم شغل العداد الذكي', label: '⏱️ تشغيل العداد' }
  ];

  // Speak text using browser speechSynthesis with smart language detection
  const speakText = (text: string) => {
    if (!ttsEnabled || !('speechSynthesis' in window)) return;
    
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const isAr = isArabicText(text);
      // Use the actual text language for correct vocalization
      utterance.lang = isAr ? 'ar-JO' : 'en-US';
      
      // Pitch slightly higher for standard friendliness, Rate slightly slower for deep clarity & gentle wisdom
      utterance.pitch = isAr ? 1.08 : 1.05;
      utterance.rate = isAr ? 0.92 : 0.94;
      
      // Attempt finding corresponding system voice gender if supported
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        let matchingVoice = null;
        if (isAr) {
          matchingVoice = voices.find(v => v.lang.includes('ar') && (selectedVoiceGender === 'male' ? v.name.toLowerCase().includes('male') || v.name.includes('Maged') : v.name.toLowerCase().includes('female') || v.name.includes('Laila')));
          if (!matchingVoice) matchingVoice = voices.find(v => v.lang.includes('ar'));
        } else {
          matchingVoice = voices.find(v => v.lang.includes('en') && (selectedVoiceGender === 'male' ? v.name.toLowerCase().includes('google us english') || v.name.toLowerCase().includes('david') : v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('female')));
        }
        if (matchingVoice) utterance.voice = matchingVoice;
      }
      
      utterance.onstart = () => setStatus('speaking');
      utterance.onend = () => {
        setStatus(isWakeWordListening ? 'listening-wake' : 'sleeping');
      };
      utterance.onerror = () => {
        setStatus(isWakeWordListening ? 'listening-wake' : 'sleeping');
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("speechSynthesis error", err);
    }
  };

  // Main command processing engine using Gemini AI
  const processVoiceCommand = async (command: string) => {
    if (!command || command.trim().length === 0) return;
    
    const isCmdArabic = isArabicText(command);
    
    setStatus('processing');
    setTranscript(command);
    setAiResponse(isCmdArabic ? 'جاري التحليل والربط بخوارزميات آدم... ⚡' : 'Adam is processing your vocal command... ⚡');
    
    try {
      // 1. Check for immediate hardcoded client shortcuts
      const cleanCmd = command.toLowerCase().trim();
      
      let actionExecuted = '';
      
      if (cleanCmd.includes('محفظ') || cleanCmd.includes('wallet') || cleanCmd.includes('رصيد')) {
        // Dispatch custom global event to notify passenger app or driver app
        window.dispatchEvent(new CustomEvent('adam-navigate', { detail: { tab: 'wallet' } }));
        actionExecuted = isCmdArabic ? 'تم فتح المحفظة المالية بنجاح 💳' : 'Opened your central e-wallet portal 💳';
      } 
      else if (cleanCmd.includes('إعداد') || cleanCmd.includes('setting') || cleanCmd.includes('كلمة السر') || cleanCmd.includes('أمان')) {
        window.dispatchEvent(new CustomEvent('adam-navigate', { detail: { tab: 'settings' } }));
        actionExecuted = isCmdArabic ? 'تم توجيهك إلى صفحة إعدادات الأمان والتفضيلات ⚙️' : 'Directed you to settings & security updates ⚙️';
      }
      else if (cleanCmd.includes('رحل') || cleanCmd.includes('حجز') || cleanCmd.includes('مشوار') || cleanCmd.includes('طلب') || cleanCmd.includes('سموع') || cleanCmd.includes('كورة') || cleanCmd.includes('اربد') || cleanCmd.includes('عمان')) {
        // Trigger fast booking fill
        window.dispatchEvent(new CustomEvent('adam-voice-book', { detail: { text: command } }));
        actionExecuted = isCmdArabic ? 'تمت جدولة وتعبئة مسار التجميع التلقائي لآدم بنجاح 🚗' : 'Auto-filled passenger shared pooling route 🚗';
      }
      else if (cleanCmd.includes('عداد') || cleanCmd.includes('تاكسي') || cleanCmd.includes('taximeter') || cleanCmd.includes('شغل')) {
        window.dispatchEvent(new CustomEvent('adam-trigger-taximeter', { detail: { status: 'start' } }));
        actionExecuted = isCmdArabic ? 'تم تفعيل العداد الرقمي الإلكتروني الذكي للكابتن ⏱️' : 'Activated driver electronic dynamic taximeter ⏱️';
      }
      else if (cleanCmd.includes('لغة') || cleanCmd.includes('language') || cleanCmd.includes('انجليزي') || cleanCmd.includes('english')) {
        if (cleanCmd.includes('en') || cleanCmd.includes('انجليز') || cleanCmd.includes('english')) {
          setLanguage('en');
          actionExecuted = 'The system language is now changed to English!';
        } else if (cleanCmd.includes('fr') || cleanCmd.includes('فرنس') || cleanCmd.includes('french')) {
          setLanguage('fr');
          actionExecuted = 'L’interface est maintenant configurée en français!';
        } else {
          setLanguage('ar');
          actionExecuted = 'تمت إعادة لغة المنصة الكاملة إلى لغتنا العربية الفصحى!';
        }
      }
      
      setLastAction(actionExecuted);

      // 2. Call the server Gemini assistant endpoint for natural smart response
      const response = await fetch('/api/ai-voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `The user spoke this command in Adam Ride Sharing App: "${command}". 
          Active Action Executed (if any): "${actionExecuted}". 
          Please write a very short, polite, professional, and friendly response (max 2 sentences) confirming the action or answering their query in a delightful tone. Speak directly to them. 
          CRITICAL language instruction: The user spoke in ${isCmdArabic ? 'Arabic' : 'English'}. You MUST respond exclusively in ${isCmdArabic ? 'Arabic' : 'English'}. Do not mix languages.`
        })
      });

      const data = await response.json();
      if (data.success) {
        setAiResponse(data.text);
        playAssistantSound('done');
        speakText(data.text);
      } else {
        const fallbackMsg = actionExecuted || (isCmdArabic ? "تم استلام أمرك الصوتي وسنقوم بمعالجته فوراً." : "Vocal instruction received successfully.");
        setAiResponse(fallbackMsg);
        playAssistantSound('done');
        speakText(fallbackMsg);
      }

    } catch (err) {
      console.error("AI voice processing error:", err);
      setStatus('error');
      playAssistantSound('error');
    }
  };

  // Launch direct manual command listening session
  const startCommandListening = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert(t("متصفحك لا يدعم التعرف على الصوت. يمكنك النقر على الأوامر الجاهزة لتجربة المحاكاة الذكية.", "Speech recognition not supported in this browser. Please use the quick simulation buttons."));
      return;
    }

    try {
      // Temporarily stop wake word listening if active
      if (wakeRecognitionRef.current) {
        isTransitioningRef.current = true;
        wakeRecognitionRef.current.abort();
      }

      window.speechSynthesis.cancel();
      playAssistantSound('listening');
      setStatus('listening-command');
      setTranscript(t('جاري الاستماع إليك بحرية كاملة... تحدث الآن 🎙️', 'Listening actively... speak now 🎙️'));
      setAiResponse('');
      setLastAction('');

      const rec = new SpeechRec();
      let selectedLang = 'ar-JO';
      if (voiceInputLang === 'en') {
        selectedLang = 'en-US';
      } else if (voiceInputLang === 'ar') {
        selectedLang = 'ar-JO';
      } else {
        // Auto (matches active interface language)
        selectedLang = language === 'en' ? 'en-US' : 'ar-JO';
      }
      rec.lang = selectedLang;
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          processVoiceCommand(text);
        } else {
          setStatus('error');
          playAssistantSound('error');
        }
      };

      rec.onerror = (e: any) => {
        console.error("Command recognition error:", e);
        setStatus('error');
        playAssistantSound('error');
        // Restart wake-word loop if active
        setTimeout(() => {
          isTransitioningRef.current = false;
          if (isWakeWordListening) initWakeWordListening();
        }, 1000);
      };

      rec.onend = () => {
        // Only restart wake word listening if we are not actively processing or speaking
        setTimeout(() => {
          isTransitioningRef.current = false;
          if (isWakeWordListening && status !== 'processing' && status !== 'speaking') {
            initWakeWordListening();
          }
        }, 1200);
      };

      commandRecognitionRef.current = rec;
      rec.start();

    } catch (e) {
      console.error("Start command listening crash:", e);
      setStatus('error');
    }
  };

  // Wake Word "Adam" Background Loop Handler
  const initWakeWordListening = () => {
    if (!isWakeWordListening) return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      if (wakeRecognitionRef.current) {
        wakeRecognitionRef.current.abort();
      }

      const rec = new SpeechRec();
      rec.lang = 'ar-JO'; // Optimized for "آدم" or "أدم" or "يا آدم"
      rec.interimResults = true; // interim is crucial for instant keyword spotting
      rec.continuous = true;

      rec.onstart = () => {
        setStatus('listening-wake');
      };

      rec.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const text = event.results[lastResultIndex][0].transcript.toLowerCase();
        
        // Spotting wake word: "آدم" or "أدم" or "adam" or "يا ادم"
        if (text.includes('آدم') || text.includes('أدم') || text.includes('ادم') || text.includes('adam')) {
          rec.abort(); // stop background spotting
          playAssistantSound('wake');
          
          // Switch automatically to direct command intake
          setTimeout(() => {
            setIsOpen(true);
            startCommandListening();
          }, 400);
        }
      };

      rec.onerror = (e: any) => {
        // Silent restart unless it's a fatal issue
        if (e.error !== 'aborted' && isWakeWordListening && !isTransitioningRef.current) {
          setTimeout(() => {
            if (isWakeWordListening) initWakeWordListening();
          }, 2000);
        }
      };

      rec.onend = () => {
        if (isWakeWordListening && !isTransitioningRef.current) {
          setTimeout(() => {
            if (isWakeWordListening) initWakeWordListening();
          }, 1000);
        }
      };

      wakeRecognitionRef.current = rec;
      rec.start();

    } catch (e) {
      console.warn("Wake word setup failed", e);
    }
  };

  // Watch wake-word setting
  useEffect(() => {
    localStorage.setItem('adam_wake_word_active', isWakeWordListening ? 'true' : 'false');
    if (isWakeWordListening) {
      initWakeWordListening();
    } else {
      setStatus('sleeping');
      if (wakeRecognitionRef.current) {
        wakeRecognitionRef.current.abort();
        wakeRecognitionRef.current = null;
      }
    }

    return () => {
      if (wakeRecognitionRef.current) {
        wakeRecognitionRef.current.abort();
      }
    };
  }, [isWakeWordListening]);

  return (
    <>
      {/* Floating Sparkle / Mic Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Status radar indicator */}
        {isWakeWordListening && status === 'listening-wake' && (
          <div className="bg-slate-900/90 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black text-emerald-400 flex items-center gap-1.5 shadow-lg animate-bounce mr-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>آدم يستمع الآن.. قل "يا آدم"</span>
          </div>
        )}

        <button
          type="button"
          id="adam-global-voice-trigger"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              // Trigger instant prompt
              setTimeout(() => startCommandListening(), 300);
            }
          }}
          className={`relative p-4 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-700 to-indigo-500 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border border-indigo-400/30 group ${
            status === 'listening-command' ? 'ring-4 ring-rose-500/40 animate-pulse' : 'ring-2 ring-indigo-500/20'
          }`}
          title="مساعد آدم الصوتي الذكي (Adam AI Voice Assistant)"
        >
          {status === 'listening-command' ? (
            <Radio className="w-6 h-6 text-rose-300 animate-spin" />
          ) : status === 'processing' ? (
            <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
          ) : (
            <Mic className="w-6 h-6 text-slate-100 group-hover:rotate-12 transition-transform" />
          )}

          {/* Glowing orbital ring */}
          <span className="absolute -inset-0.5 rounded-full bg-indigo-500/20 blur-sm group-hover:bg-indigo-500/40 transition-all"></span>
        </button>
      </div>

      {/* Expandable Siri-Like Voice Panel Console */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col font-sans text-right" dir="rtl">
            
            {/* Header */}
            <div className="bg-gradient-to-l from-indigo-950 to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between flex-row-reverse">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                <div className="text-right">
                  <h3 className="text-sm font-black text-slate-100">مساعد آدم الصوتي الذكي (Adam AI Voice Command)</h3>
                  <p className="text-[10px] text-slate-400 font-bold">مدعوم بالذكاء الاصطناعي وجوجل جيميناي 3.5</p>
                </div>
              </div>
            </div>

            {/* Main Interactive Wave / Display */}
            <div className="p-6 flex flex-col items-center justify-center text-center bg-slate-950/40 min-h-[180px] border-b border-slate-850 relative">
              
              {/* Dynamic Animated Waveform */}
              <div className="flex items-center justify-center gap-1.5 h-12 mb-4">
                {status === 'listening-command' ? (
                  <>
                    <span className="w-1.5 bg-rose-500 rounded-full animate-pulse h-10" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-1.5 bg-indigo-500 rounded-full animate-pulse h-6" style={{ animationDelay: '0.3s' }}></span>
                    <span className="w-1.5 bg-amber-500 rounded-full animate-pulse h-12" style={{ animationDelay: '0.5s' }}></span>
                    <span className="w-1.5 bg-emerald-500 rounded-full animate-pulse h-8" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 bg-rose-500 rounded-full animate-pulse h-10" style={{ animationDelay: '0.4s' }}></span>
                  </>
                ) : status === 'processing' ? (
                  <>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                  </>
                ) : status === 'speaking' ? (
                  <>
                    <span className="w-1.5 bg-emerald-400 rounded-full animate-pulse h-8" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-1.5 bg-indigo-400 rounded-full animate-pulse h-10" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 bg-emerald-400 rounded-full animate-pulse h-6" style={{ animationDelay: '0.3s' }}></span>
                  </>
                ) : (
                  <Mic className="w-8 h-8 text-slate-600" />
                )}
              </div>

              {/* Status Badge */}
              <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border mb-3 ${
                status === 'listening-command' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                status === 'listening-wake' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse' :
                status === 'processing' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                status === 'speaking' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {status === 'listening-command' && '🎙️ جارٍ الاستماع لأمرك الآن...'}
                {status === 'listening-wake' && '🟢 في الانتظار.. قل "يا آدم" لتفعيل الميكروفون تلقائياً'}
                {status === 'processing' && '⚡ جاري التفكير ومطابقة قواعد البيانات بالذكاء الاصطناعي...'}
                {status === 'speaking' && '🔊 يتحدث الآن...'}
                {status === 'sleeping' && '💤 متوقف مؤقتاً'}
                {status === 'error' && '❌ خطأ في التقاط الصوت'}
              </span>

              {/* Transcribed Text */}
              {transcript && (
                <p className="text-slate-200 text-sm font-extrabold max-w-sm mt-1 leading-relaxed">
                  "{transcript}"
                </p>
              )}

              {/* AI response container */}
              {aiResponse && (
                <div className="mt-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl w-full text-right shadow-inner">
                  <span className="text-[9px] text-indigo-400 font-extrabold block mb-1">🤖 رد مساعد آدم الذكي:</span>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                    {aiResponse}
                  </p>
                  {lastAction && (
                    <span className="inline-block mt-2 text-[9.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-md font-black">
                      ⚡ الإجراء المطبق: {lastAction}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Quick Demo Simulator Grid */}
            <div className="p-4 bg-slate-900/60 max-h-[160px] overflow-y-auto">
              <span className="text-[10px] text-slate-500 font-bold block mb-2 text-right">💡 قوالب سريعة لتجربة ذكاء التحكم (انقر للتطبيق الفوري):</span>
              <div className="flex flex-wrap gap-2 justify-start flex-row-reverse">
                {demoCommands.map((demo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      processVoiceCommand(demo.text);
                    }}
                    className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] font-semibold py-1.5 px-2.5 rounded-xl transition hover:border-indigo-500/30 active:scale-95 text-right flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{demo.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Actions and Settings */}
            <div className="p-4 bg-slate-950 border-t border-slate-850 flex items-center justify-between flex-row-reverse gap-3">
              <button
                type="button"
                onClick={startCommandListening}
                disabled={status === 'listening-command' || status === 'processing'}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-2 px-4 rounded-xl transition flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer shadow-md"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>تحدث الآن (أمر جديد)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="text-slate-400 hover:text-white transition flex items-center gap-1 text-xs cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>خيارات المساعد</span>
              </button>
            </div>

            {/* Config Sub-panel */}
            {showConfig && (
              <div className="p-5 bg-slate-900 border-t border-slate-800 text-right space-y-4 text-xs animate-slideUp">
                <div className="flex items-center justify-between flex-row-reverse">
                  <span className="font-bold text-slate-200">الاستماع المستمر لكلمة "يا آدم" (Siri mode)</span>
                  <button
                    type="button"
                    onClick={() => setIsWakeWordListening(!isWakeWordListening)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black border transition ${
                      isWakeWordListening 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                        : 'bg-slate-950 text-slate-500 border-slate-800'
                    }`}
                  >
                    {isWakeWordListening ? 'مفعّل (نشط)' : 'معطّل'}
                  </button>
                </div>

                <div className="flex items-center justify-between flex-row-reverse">
                  <span className="font-bold text-slate-200">نطق الردود بالصوت تلقائياً (TTS)</span>
                  <button
                    type="button"
                    onClick={() => setTtsEnabled(!ttsEnabled)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black border transition ${
                      ttsEnabled 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                        : 'bg-slate-950 text-slate-500 border-slate-800'
                    }`}
                  >
                    {ttsEnabled ? 'مفعّل' : 'معطّل'}
                  </button>
                </div>

                <div className="flex items-center justify-between flex-row-reverse">
                  <span className="font-bold text-slate-200">لغة الإدخال الصوتي والبحث</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setVoiceInputLang('auto')}
                      className={`px-2.5 py-1 rounded border text-[10px] font-bold ${voiceInputLang === 'auto' ? 'bg-indigo-950 text-indigo-400 border-indigo-800' : 'bg-slate-950 text-slate-500 border-slate-850'}`}
                    >
                      تلقائي
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceInputLang('ar')}
                      className={`px-2.5 py-1 rounded border text-[10px] font-bold ${voiceInputLang === 'ar' ? 'bg-indigo-950 text-indigo-400 border-indigo-800' : 'bg-slate-950 text-slate-500 border-slate-850'}`}
                    >
                      العربية
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceInputLang('en')}
                      className={`px-2.5 py-1 rounded border text-[10px] font-bold ${voiceInputLang === 'en' ? 'bg-indigo-950 text-indigo-400 border-indigo-800' : 'bg-slate-950 text-slate-500 border-slate-850'}`}
                    >
                      English
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between flex-row-reverse">
                  <span className="font-bold text-slate-200">نبرة وصوت المساعد الافتراضي</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVoiceGender('male')}
                      className={`px-2.5 py-1 rounded border text-[10px] font-bold ${selectedVoiceGender === 'male' ? 'bg-indigo-950 text-indigo-400 border-indigo-800' : 'bg-slate-950 text-slate-500 border-slate-850'}`}
                    >
                      صوت رجالي لـ "آدم"
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVoiceGender('female')}
                      className={`px-2.5 py-1 rounded border text-[10px] font-bold ${selectedVoiceGender === 'female' ? 'bg-indigo-950 text-indigo-400 border-indigo-800' : 'bg-slate-950 text-slate-500 border-slate-850'}`}
                    >
                      صوت نسائي
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
};
