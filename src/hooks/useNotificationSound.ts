import { useCallback, useRef, useState, useEffect } from "react";

const MUTE_KEY = "tempmail_notification_muted";

// Simple notification sound using Web Audio API
export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem(MUTE_KEY) === "true";
  });

  // Persist mute state
  useEffect(() => {
    localStorage.setItem(MUTE_KEY, isMuted.toString());
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const playSound = useCallback(() => {
    if (isMuted) return;
    
    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      // Resume context if suspended (required by browsers)
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Create oscillator for a pleasant notification tone
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Pleasant two-tone notification (like a soft "ding-ding")
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, now); // A5
      oscillator.frequency.setValueAtTime(1108.73, now + 0.1); // C#6

      // Envelope for smooth sound
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gainNode.gain.linearRampToValueAtTime(0.1, now + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.12);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.25);

      oscillator.start(now);
      oscillator.stop(now + 0.25);
    } catch (error) {
      console.log("Could not play notification sound:", error);
    }
  }, [isMuted]);

  return { playSound, isMuted, toggleMute };
}
