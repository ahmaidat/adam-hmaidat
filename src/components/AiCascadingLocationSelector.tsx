import React, { useState, useEffect } from 'react';
import { MapPin, Sparkles, Navigation, Layers, Building, ChevronDown, Check, RefreshCw, AlertCircle, Cpu, Crosshair } from 'lucide-react';
import { DEFAULT_LOCATIONS } from '../locationData';
import { AiSpatial5DView } from './AiSpatial5DView';

export interface LocationCascadeSelection {
  governorate: string;
  district: string;
  neighborhood: string;
  street: string;
  formattedAddress: string;
}

interface AiCascadingLocationSelectorProps {
  label?: string;
  placeholder?: string;
  initialValue?: string;
  onSelect: (selection: LocationCascadeSelection) => void;
  compactMode?: boolean;
  className?: string;
  userType?: 'driver' | 'passenger';
}

export const AiCascadingLocationSelector: React.FC<AiCascadingLocationSelectorProps> = ({
  label = "تحديد الموقع الجغرافي الذكي متسلسل المستويات",
  placeholder = "اختر المسار الجغرافي...",
  initialValue = "",
  onSelect,
  compactMode = false,
  className = "",
  userType = "passenger"
}) => {
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('عمان (Amman)');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('');
  const [selectedStreet, setSelectedStreet] = useState<string>('');
  const [customStreet, setCustomStreet] = useState<string>('');
  const [show5DModal, setShow5DModal] = useState<boolean>(false);

  // Lists state
  const [governorates, setGovernorates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [streets, setStreets] = useState<string[]>([]);

  // AI loading and status
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string>('');
  const [aiEnhancedLevel, setAiEnhancedLevel] = useState<string | null>(null);

  // Initialize governorates on mount
  useEffect(() => {
    const govList = DEFAULT_LOCATIONS.map(l => l.governorate);
    setGovernorates(govList);
    if (govList.length > 0 && !selectedGovernorate) {
      setSelectedGovernorate(govList[0]);
    }
  }, []);

  // Update Districts whenever Governorate changes
  useEffect(() => {
    if (!selectedGovernorate) {
      setDistricts([]);
      return;
    }

    const govObj = DEFAULT_LOCATIONS.find(l => l.governorate === selectedGovernorate || l.governorate.includes(selectedGovernorate));
    if (govObj && govObj.districts && govObj.districts.length > 0) {
      const distNames = govObj.districts.map(d => d.name);
      setDistricts(distNames);
      setSelectedDistrict(distNames[0] || '');
    } else {
      // Fetch via AI if not found locally
      fetchAiCascade('districts', selectedGovernorate);
    }
    setSelectedNeighborhood('');
    setSelectedStreet('');
    setCustomStreet('');
  }, [selectedGovernorate]);

  // Update Neighborhoods whenever District changes
  useEffect(() => {
    if (!selectedGovernorate || !selectedDistrict) {
      setNeighborhoods([]);
      return;
    }

    const govObj = DEFAULT_LOCATIONS.find(l => l.governorate === selectedGovernorate || l.governorate.includes(selectedGovernorate));
    const distObj = govObj?.districts.find(d => d.name === selectedDistrict);

    if (distObj && distObj.villages && distObj.villages.length > 0) {
      setNeighborhoods(distObj.villages);
      setSelectedNeighborhood(distObj.villages[0] || '');
    } else {
      // Auto fetch neighborhoods using AI
      fetchAiCascade('neighborhoods', selectedGovernorate, selectedDistrict);
    }
    setSelectedStreet('');
    setCustomStreet('');
  }, [selectedDistrict]);

  // Update Streets whenever Neighborhood changes
  useEffect(() => {
    if (!selectedGovernorate || !selectedDistrict || !selectedNeighborhood) {
      setStreets([]);
      return;
    }

    const govObj = DEFAULT_LOCATIONS.find(l => l.governorate === selectedGovernorate || l.governorate.includes(selectedGovernorate));
    const distObj = govObj?.districts.find(d => d.name === selectedDistrict);

    if (distObj && distObj.streets && distObj.streets[selectedNeighborhood]) {
      setStreets(distObj.streets[selectedNeighborhood]);
      setSelectedStreet(distObj.streets[selectedNeighborhood][0] || '');
    } else {
      // Fetch streets automatically via AI
      fetchAiCascade('streets', selectedGovernorate, selectedDistrict, selectedNeighborhood);
    }
  }, [selectedNeighborhood]);

  // Function to call Gemini AI API for cascading geography
  const fetchAiCascade = async (
    requestType: 'districts' | 'neighborhoods' | 'streets',
    gov: string,
    dist: string = '',
    neigh: string = ''
  ) => {
    setIsLoadingAi(true);
    setAiStatusMessage(`جاري جلب ${requestType === 'districts' ? 'الألوية' : requestType === 'neighborhoods' ? 'الأحياء والمناطق' : 'الشوارع والمعالم'} بالذكاء الاصطناعي... 🤖✨`);
    setAiEnhancedLevel(requestType);

    try {
      const res = await fetch('/api/ai-location-cascade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          governorate: gov,
          district: dist,
          neighborhood: neigh,
          requestType: requestType
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        if (requestType === 'districts' && Array.isArray(json.data.districts)) {
          setDistricts(json.data.districts);
          if (json.data.districts.length > 0) setSelectedDistrict(json.data.districts[0]);
        } else if (requestType === 'neighborhoods' && Array.isArray(json.data.neighborhoods)) {
          setNeighborhoods(json.data.neighborhoods);
          if (json.data.neighborhoods.length > 0) setSelectedNeighborhood(json.data.neighborhoods[0]);
        } else if (requestType === 'streets' && Array.isArray(json.data.streets)) {
          setStreets(json.data.streets);
          if (json.data.streets.length > 0) setSelectedStreet(json.data.streets[0]);
        }
        setAiStatusMessage(`تم جلب وتكامل القوائم بنجاح ✨`);
      }
    } catch (err) {
      console.error("AI Location fetch failed:", err);
      setAiStatusMessage(`تعذر الاتصال بـ AI، جاري استخدام محرك الموقع المحلي`);
    } finally {
      setIsLoadingAi(false);
      setTimeout(() => setAiStatusMessage(''), 3000);
    }
  };

  // Generate full formatted string
  const activeStreet = customStreet.trim() ? customStreet.trim() : selectedStreet;
  const formattedAddress = [
    selectedGovernorate,
    selectedDistrict ? ` لواء ${selectedDistrict.replace(/^لواء\s*/, '')}` : '',
    selectedNeighborhood ? ` حي ${selectedNeighborhood.replace(/^حي\s*/, '')}` : '',
    activeStreet ? ` ${activeStreet}` : ''
  ].filter(Boolean).join(' - ');

  // Emit state to parent component
  const handleConfirmSelection = () => {
    onSelect({
      governorate: selectedGovernorate,
      district: selectedDistrict,
      neighborhood: selectedNeighborhood,
      street: activeStreet,
      formattedAddress: formattedAddress
    });
  };

  // 5D AI Spatial Auto-Fill Field Handler
  const handle5dSpatialAutoFill = async () => {
    setIsLoadingAi(true);
    setAiStatusMessage('جاري استدعاء المسح خماسي الأبعاد (5D Spatial AI) لتعبئة الحقول بذكاء...');
    try {
      const res = await fetch('/api/ai/spatial-5d-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType,
          governorate: selectedGovernorate,
          locationName: selectedNeighborhood || selectedDistrict || selectedGovernorate,
          currentActivity: 'تعبئة حقول المسار والجغرافيا الذكية'
        })
      });
      const data = await res.json();
      if (data.success && data.analytics?.contextual5D?.recommendedFields) {
        const rec = data.analytics.contextual5D.recommendedFields;
        if (rec.suggestedPickup) {
          setCustomStreet(rec.suggestedPickup);
        }
        setAiStatusMessage('✨ تم تطبيق التعبئة التلقائية خماسية الأبعاد بنجاح على هذا الحقل!');
      }
    } catch (err) {
      console.error("5D Auto fill failed", err);
      setAiStatusMessage('تم استدعاء النمط المحلي للتعبئة الجغرافية 📍');
    } finally {
      setIsLoadingAi(false);
      setTimeout(() => setAiStatusMessage(''), 3500);
    }
  };

  return (
    <div className={`bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-3 sm:p-4 text-right ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2 flex-row-reverse flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-row-reverse">
          <div className="p-1.5 bg-indigo-950/70 border border-indigo-500/40 text-indigo-400 rounded-lg">
            <Layers className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-100 flex items-center gap-1 flex-row-reverse">
              <span>{label}</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-extrabold border border-indigo-500/30">
                ذكاء اصطناعي 5D ✨
              </span>
            </h4>
            <p className="text-[9.5px] text-slate-400">تصفح وتسلسل هرمي كامل: المحافظة ➔ اللواء ➔ الحي ➔ الشارع</p>
          </div>
        </div>

        {/* Action Buttons: 5D AI Field Buttons */}
        <div className="flex items-center gap-1.5 flex-row-reverse">
          {/* 5D Field Auto-Fill */}
          <button
            type="button"
            onClick={handle5dSpatialAutoFill}
            disabled={isLoadingAi}
            className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold transition cursor-pointer disabled:opacity-50"
            title="تعبئة حقل الموقع بالمسح خماسي الأبعاد تلقائياً"
          >
            <Crosshair className="w-3 h-3 text-emerald-400" />
            <span>تعبئة 5D 🛰️</span>
          </button>

          {/* 5D Radar Modal Trigger */}
          <button
            type="button"
            onClick={() => setShow5DModal(true)}
            className="bg-indigo-950/80 hover:bg-indigo-900/90 border border-indigo-500/40 text-indigo-200 text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold transition cursor-pointer"
            title="فتح رادار التحليل خماسي الأبعاد الذكي"
          >
            <Cpu className="w-3 h-3 text-indigo-400" />
            <span>رادار 5D 🌌</span>
          </button>

          {/* AI refresh button */}
          <button
            type="button"
            onClick={() => fetchAiCascade('streets', selectedGovernorate, selectedDistrict, selectedNeighborhood)}
            disabled={isLoadingAi}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 font-bold transition cursor-pointer disabled:opacity-50"
            title="استدعاء الذكاء الاصطناعي لإعادة جلب واستكمال الشوارع والأحياء"
          >
            <Sparkles className={`w-3 h-3 text-amber-400 ${isLoadingAi ? 'animate-spin' : ''}`} />
            <span>توليد 🪄</span>
          </button>
        </div>
      </div>

      {/* AI Status Banner */}
      {aiStatusMessage && (
        <div className="mb-3 p-2 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-[10px] text-indigo-300 flex items-center gap-2 justify-end flex-row-reverse">
          <RefreshCw className="w-3 h-3 animate-spin text-indigo-400 shrink-0" />
          <span>{aiStatusMessage}</span>
        </div>
      )}

      {/* Grid of 4 Cascading Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        
        {/* LEVEL 1: المحافظة */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-extrabold text-slate-300 flex items-center justify-between flex-row-reverse">
            <span>1. المحافظة 🏙️</span>
            <span className="text-[9px] text-slate-500 font-normal">المستوى الأول</span>
          </label>
          <div className="relative">
            <select
              value={selectedGovernorate}
              onChange={(e) => setSelectedGovernorate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-2 text-xs text-slate-100 font-bold outline-none cursor-pointer appearance-none text-right pr-3 pl-7 transition"
            >
              {governorates.map((gov) => (
                <option key={gov} value={gov} className="bg-slate-950 text-slate-100">
                  {gov}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* LEVEL 2: اللواء */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-extrabold text-slate-300 flex items-center justify-between flex-row-reverse">
            <span className="flex items-center gap-1 flex-row-reverse">
              <span>2. اللواء / القضاء 🏛️</span>
              {aiEnhancedLevel === 'districts' && <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1 rounded">AI</span>}
            </span>
            <span className="text-[9px] text-slate-500 font-normal">المستوى الثاني</span>
          </label>
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={districts.length === 0}
              className="w-full bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-2 text-xs text-slate-100 font-bold outline-none cursor-pointer appearance-none text-right pr-3 pl-7 transition disabled:opacity-50"
            >
              {districts.length === 0 ? (
                <option value="">لا توجد ألوية معرفة</option>
              ) : (
                districts.map((dist) => (
                  <option key={dist} value={dist} className="bg-slate-950 text-slate-100">
                    {dist}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* LEVEL 3: الحي / المنطقة */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-extrabold text-slate-300 flex items-center justify-between flex-row-reverse">
            <span className="flex items-center gap-1 flex-row-reverse">
              <span>3. الحي / المنطقة 🏡</span>
              {aiEnhancedLevel === 'neighborhoods' && <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1 rounded">AI</span>}
            </span>
            <span className="text-[9px] text-slate-500 font-normal">المستوى الثالث</span>
          </label>
          <div className="relative">
            <select
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              disabled={neighborhoods.length === 0}
              className="w-full bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-2 text-xs text-slate-100 font-bold outline-none cursor-pointer appearance-none text-right pr-3 pl-7 transition disabled:opacity-50"
            >
              {neighborhoods.length === 0 ? (
                <option value="">لا توجد أحياء مسجلة</option>
              ) : (
                neighborhoods.map((neigh) => (
                  <option key={neigh} value={neigh} className="bg-slate-950 text-slate-100">
                    {neigh}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* LEVEL 4: الشارع / المعلم */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-extrabold text-slate-300 flex items-center justify-between flex-row-reverse">
            <span className="flex items-center gap-1 flex-row-reverse">
              <span>4. الشارع / المعلم 🛣️</span>
              {aiEnhancedLevel === 'streets' && <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1 rounded">AI</span>}
            </span>
            <span className="text-[9px] text-slate-500 font-normal">المستوى الرابع</span>
          </label>
          <div className="relative">
            <select
              value={selectedStreet}
              onChange={(e) => {
                setSelectedStreet(e.target.value);
                setCustomStreet('');
              }}
              disabled={streets.length === 0}
              className="w-full bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-2 text-xs text-slate-100 font-bold outline-none cursor-pointer appearance-none text-right pr-3 pl-7 transition disabled:opacity-50"
            >
              {streets.length === 0 ? (
                <option value="">اختر أو اكتب الشارع أدناه</option>
              ) : (
                streets.map((st) => (
                  <option key={st} value={st} className="bg-slate-950 text-slate-100">
                    {st}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

      </div>

      {/* Custom Street Input Option */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row gap-2 items-center justify-between">
        <div className="w-full sm:w-2/3 flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-indigo-500/50 transition">
          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={customStreet}
            onChange={(e) => setCustomStreet(e.target.value)}
            placeholder="أو اكتب اسم الشارع / المعلم الفرعي هنا مباشرة..."
            className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 outline-none text-right font-semibold"
          />
        </div>

        <button
          type="button"
          onClick={handleConfirmSelection}
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black px-4 py-2 rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95 shrink-0"
        >
          <Check className="w-3.5 h-3.5 text-indigo-300" />
          <span>اعتماد العنوان المتسلسل 📍</span>
        </button>
      </div>

      {/* Live Formatted Output Preview */}
      <div className="mt-2.5 p-2 bg-slate-950/80 border border-slate-850 rounded-xl flex items-center justify-between text-[11px] text-slate-300 flex-row-reverse">
        <div className="flex items-center gap-1.5 flex-row-reverse overflow-hidden text-ellipsis whitespace-nowrap">
          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="font-extrabold text-indigo-300 shrink-0">العنوان المكتمل:</span>
          <span className="text-slate-200 font-bold text-[10.5px] truncate">{formattedAddress || 'لم يتم اختيار المسار بعد'}</span>
        </div>
      </div>

      {/* 5D AI Spatial Radar Modal Overlay */}
      {show5DModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto dir-rtl">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <AiSpatial5DView
              userType={userType}
              governorate={selectedGovernorate}
              locationName={selectedNeighborhood || selectedDistrict || selectedGovernorate}
              currentActivity="تحليل المسار خماسي الأبعاد من خلال حقل الموقع الذكي"
              onApplyFields={(fields) => {
                if (fields.pickup) setCustomStreet(fields.pickup);
                setShow5DModal(false);
              }}
              onClose={() => setShow5DModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
