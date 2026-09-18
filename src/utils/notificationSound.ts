/**
 * Notification Sound & Haptic Feedback Utility
 * Uses Web Audio API to synthesize a clean, audible notification chime.
 * Works 100% offline, cross-platform on Android, iOS, and PC with zero external audio assets.
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        sharedAudioCtx = new AudioCtxClass();
      }
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

// Automatically unlock audio context on first user interaction (touch, tap, click)
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch {
      // ignore
    }
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('click', unlockAudio);
  };

  window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
  window.addEventListener('pointerdown', unlockAudio, { passive: true, once: true });
  window.addEventListener('click', unlockAudio, { passive: true, once: true });
}

/**
 * Play a clear, audible dual-tone alert chime (E5 -> A5)
 * and trigger gentle haptic vibration on mobile devices.
 */
export function playNotificationSound(): void {
  // 1. Haptic vibration for mobile devices (Pulse-pause-pulse)
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([150, 80, 180]);
    }
  } catch {
    // ignore
  }

  // 2. Synthesize dual-tone chime via Web Audio API
  try {
    const audioCtx = getAudioContext();
    if (!audioCtx) return;

    const playChime = (ctx: AudioContext) => {
      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz) - bright pleasant intro
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.45, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Note 2: A5 (880 Hz) - resonant alert chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.5, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.48);
    };

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => {
        playChime(audioCtx);
      }).catch(() => {});
    } else {
      playChime(audioCtx);
    }
  } catch (e) {
    console.warn('[NotificationSound] Audio chime error:', e);
  }
}
