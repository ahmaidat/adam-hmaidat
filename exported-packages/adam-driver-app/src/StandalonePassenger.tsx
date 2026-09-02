import React from 'react';
import { AppProvider, useAppState } from './stateEngine';
import { PassengerApp } from './components/PassengerApp';
import { PwaInstallBanner } from './components/PwaInstallBanner';

function StandalonePassengerInner() {
  const { language, t } = useAppState();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-rose-500/30 selection:text-rose-200" dir="rtl">
      {/* Dynamic PWA installation trigger */}
      <PwaInstallBanner />

      {/* Direct Full-Screen Passenger Application */}
      <main className="w-full min-h-screen">
        <PassengerApp />
      </main>
    </div>
  );
}

export function StandalonePassenger() {
  return (
    <AppProvider>
      <StandalonePassengerInner />
    </AppProvider>
  );
}

export default StandalonePassenger;
