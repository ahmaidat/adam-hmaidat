// Helper module for Web Audio API notification sounds with Safari/iOS Auto-Resume support
export type NotificationToneType = 
  | 'chime' 
  | 'bell' 
  | 'digital_radar' 
  | 'synth_ding' 
  | 'taxi_horn' 
  | 'cyber_pulse' 
  | 'marimba' 
  | 'urgent_ping';

// Persistent shared AudioContext for Safari to avoid hitting max AudioContext limit (WebKit limit of ~4-6 contexts)
let sharedAudioCtx: AudioContext | null = null;

export function unlockAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }
    
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function getSharedAudioContext(): AudioContext | null {
  return unlockAudioContext();
}

// Global user-gesture listener to immediately unlock Web Audio on iOS / Safari first touch/click
if (typeof window !== 'undefined') {
  const handleInteractionUnlock = () => {
    const ctx = unlockAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener('touchstart', handleInteractionUnlock, { passive: true });
  window.addEventListener('touchend', handleInteractionUnlock, { passive: true });
  window.addEventListener('pointerdown', handleInteractionUnlock, { passive: true });
  window.addEventListener('click', handleInteractionUnlock, { passive: true });
}

let incomingRideInterval: any = null;

export function startIncomingRideAlarm(volume: number = 0.9) {
  stopIncomingRideAlarm();
  try {
    // 1. Unlock audio context immediately
    const ctx = unlockAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // 2. Play urgent initial alarm tone
    playNotificationTone('urgent_ping', volume);

    // 3. Spoken voice alert as audible accessibility fallback
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('طلب مشوار جديد وارد كابتن');
        utterance.lang = 'ar-JO';
        utterance.rate = 1.1;
        utterance.volume = Math.min(1.0, volume);
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // Speech synthesis optional fallback
    }

    // 4. Vibration alert
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([500, 200, 500, 200, 700]);
      } catch {}
    }
    
    // 5. Loop ringing alarm every 1.2s alternating tones for high perceptibility
    let tick = 0;
    incomingRideInterval = setInterval(() => {
      tick++;
      const toneToPlay = tick % 2 === 0 ? 'bell' : 'urgent_ping';
      playNotificationTone(toneToPlay, volume);

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([400, 150, 400]);
        } catch {}
      }
    }, 1200);
  } catch (e) {
    console.warn('Error starting incoming ride alarm:', e);
  }
}

export function stopIncomingRideAlarm() {
  if (incomingRideInterval) {
    clearInterval(incomingRideInterval);
    incomingRideInterval = null;
  }
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(0); } catch {}
  }
}

export function playNotificationTone(tone: NotificationToneType | string = 'chime', volume: number = 0.3) {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    
    const safeVol = Math.max(0.05, Math.min(1.0, volume));

    if (tone === 'bell') {
      // Royal Bell Alert: crisp high bell frequencies
      const notes = [659.25, 880, 1046.5]; // E5, A5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
        gain.gain.linearRampToValueAtTime(safeVol, ctx.currentTime + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.45);
      });
    } else if (tone === 'digital_radar') {
      // Digital Radar Pulse: fast high-tech pings
      const freqs = [1200, 1600, 2000, 2400];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(safeVol * 0.9, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.18);
      });
    } else if (tone === 'synth_ding') {
      // Fast Synth Ding: dual chord ding
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      gain.gain.setValueAtTime(safeVol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.38);
      osc2.stop(ctx.currentTime + 0.38);
    } else if (tone === 'taxi_horn') {
      // Friendly Taxi Double Beep (Beep-Beep)
      [0, 0.18].forEach(startOffset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime + startOffset); // A4
        gain.gain.setValueAtTime(0, ctx.currentTime + startOffset);
        gain.gain.linearRampToValueAtTime(safeVol * 0.5, ctx.currentTime + startOffset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startOffset);
        osc.stop(ctx.currentTime + startOffset + 0.14);
      });
    } else if (tone === 'cyber_pulse') {
      // Cyber Energy sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(safeVol * 0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.32);
    } else if (tone === 'marimba') {
      // Gentle Marimba notes: G4, B4, D5, G5
      const marimbaNotes = [392.00, 493.88, 587.33, 783.99];
      marimbaNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(safeVol * 0.8, ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.28);
      });
    } else if (tone === 'urgent_ping') {
      // Urgent Rapid Alert (Triple High Ping)
      [0, 0.08, 0.16].forEach(startOffset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, ctx.currentTime + startOffset); // A6
        gain.gain.setValueAtTime(safeVol, ctx.currentTime + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startOffset);
        osc.stop(ctx.currentTime + startOffset + 0.08);
      });
    } else {
      // 'chime' (default): Gentle Harmonic Chime
      const chimeNotes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      chimeNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.1);
        gain.gain.linearRampToValueAtTime(safeVol * 0.9, ctx.currentTime + idx * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.38);
      });
    }
  } catch (e) {
    console.warn('Failed to play audio notification tone:', e);
  }
}
