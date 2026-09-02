import React, { useState } from 'react';
import { AppProvider, useAppState } from './stateEngine';
import { AdminPanel } from './components/AdminPanel';
import { MasterScreenDashboard, ScreenConfig } from './components/MasterScreenDashboard';
import { LiveMap } from './components/LiveMap';
import { ShieldCheck, LayoutDashboard, Sliders, MapPin, Sparkles, Terminal } from 'lucide-react';

const adminScreens: ScreenConfig[] = [
  {
    id: 'admin',
    titleAr: "لوحة آدم التحكم (Control Panel Adam- CRM)",
    titleEn: "Control Panel Adam- CRM",
    descriptionAr: "إدارة تراخيص الكباتن والمحفظة، تتبع العمولات والرحلات القائمة وتجميع حافلات آدم بذكاء",
    descriptionEn: "Comprehensive administration console to manage drivers, wallets, system metrics, rates & helpdesk",
    isVisible: true,
    role: 'admin',
    gridSpan: 'medium',
    accentColor: 'indigo'
  },
  {
    id: 'map',
    titleAr: "خريطة التتبع الجغرافية الحيّة (Live GPS Tracker)",
    titleEn: "Live Interactive GPS Tracking Map (Live GPS Tracker)",
    descriptionAr: "تعقب متزامن على الخارطة لمواقع المركبات والعداد الذكي ونشاط التجميع الفوري في المحافظات",
    descriptionEn: "Live real-time geographic viewport showing active pooling runs, driver locations and matching coordinates",
    isVisible: true,
    role: 'all',
    gridSpan: 'small',
    accentColor: 'emerald'
  }
];

function StandaloneAdminInner() {
  const { t, language } = useAppState();
  const [activeTab, setActiveTab] = useState<'crm' | 'dashboard' | 'map'>('crm');

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200" dir="rtl">
      {/* Top Professional Navigation Bar for Admin Portal */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl border border-indigo-400/30">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                منظومة آدم | لوحة التحكم والداشبورد الإداري
              </h1>
              <span className="bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                Web Portal (CRM & Live Ops)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              إدارة الكباتن والمحافظ، تتبع الرحلات المباشرة والتشاركية والتحليلات السحابية
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-950/80 border border-slate-800 p-1 rounded-2xl shadow-inner">
          <button
            onClick={() => setActiveTab('crm')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'crm'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            لوحة الإدارة و CRM
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            الداشبورد والمراقبة
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'map'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            الرادار والخريطة الحيّة
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="p-3 sm:p-6 max-w-[1700px] mx-auto">
        {activeTab === 'crm' && (
          <div className="animate-fade-in">
            <AdminPanel />
          </div>
        )}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <MasterScreenDashboard initialScreens={adminScreens} isSuperAdminView={true} />
          </div>
        )}
        {activeTab === 'map' && (
          <div className="animate-fade-in rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl bg-slate-900/60 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  خريطة التتبع الفوري لنشاط أسطول آدم
                </h2>
                <p className="text-xs text-slate-400">
                  مزامنة حية لمواقع الكباتن النشطين والرحلات القائمة عبر Firebase Firestore
                </p>
              </div>
            </div>
            <div className="h-[750px] rounded-2xl overflow-hidden border border-slate-800">
              <LiveMap />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export function StandaloneAdmin() {
  return (
    <AppProvider>
      <StandaloneAdminInner />
    </AppProvider>
  );
}

export default StandaloneAdmin;
