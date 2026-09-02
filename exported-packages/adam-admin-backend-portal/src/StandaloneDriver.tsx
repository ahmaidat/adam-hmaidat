import React from 'react';
import { AppProvider, useAppState } from './stateEngine';
import { DriverApp } from './components/DriverApp';
import { PwaInstallBanner } from './components/PwaInstallBanner';

function StandaloneDriverInner() {
  const { language, t } = useAppState();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-amber-500/30 selection:text-amber-200" dir="rtl">
      {/* Dynamic PWA installation trigger */}
      <PwaInstallBanner />

      {/* Direct Full-Screen Captain/Driver Application */}
      <main className="w-full min-h-screen">
        <DriverApp />
      </main>
    </div>
  );
}

export function StandaloneDriver() {
  return (
    <AppProvider>
      <StandaloneDriverInner />
    </AppProvider>
  );
}

export default StandaloneDriver;
