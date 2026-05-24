/**
 * Highly polished Web Audio API Sound Synthesizer
 * Bypasses need for external MP3 file assets.
 * Handles browser interaction policies gracefully.
 */

let audioCtx: AudioContext | null = null;
let isMutedGlobal = false;
let activeLyriaSoundId = "aurora";

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch((err) => console.log("Failed to resume AudioContext", err));
  }
  return audioCtx;
}

/**
 * Configure global muting
 */
export function setSoundEnabled(enabled: boolean) {
  isMutedGlobal = !enabled;
}

/**
 * Configure chosen completion sound ID
 */
export function setSelectedSound(soundId: string) {
  activeLyriaSoundId = soundId;
}

export function getSelectedSound(): string {
  return activeLyriaSoundId;
}

export interface SoundPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const LYRIA_SOUNDS: SoundPreset[] = [
  { id: "aurora", name: "Lyria Aurora Bell", description: "Celestial crystal bell cascade", icon: "✨" },
  { id: "gong", name: "Lyria Mountain Gong", description: "Deep resonant brass zen gong", icon: "🧘" },
  { id: "flute", name: "Lyria Forest Flute", description: "Polished wooden breathing flute", icon: "🍃" },
  { id: "breath", name: "Lyria Ocean Breath", description: "Soothing rising/falling waves", icon: "🌊" },
  { id: "sparkles", name: "Lyria Cosmic Sparkle", description: "Glistening starry drop cascade", icon: "⭐" },
];

/**
 * Core Lyria synthesizer algorithms
 */
export function playLyriaPreset(id: string) {
  if (isMutedGlobal) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const dest = ctx.destination;
    const now = ctx.currentTime;

    switch (id) {
      case "aurora": {
        // Celestial double-tuned bells with high-pitch echoing delay
        const notes = [440.00, 523.25, 659.25, 783.99, 880.00]; // A4, C5, E5, G5, A5 (warmer pentatonic octave)
        notes.forEach((freq, idx) => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gainNode = ctx.createGain();
          
          osc1.type = "sine";
          osc2.type = "sine";
          
          osc1.frequency.setValueAtTime(freq, now + idx * 0.15);
          // 1.5 ratio creates a beautiful fifth harmonic, but we can damp its volume
          osc2.frequency.setValueAtTime(freq * 1.5, now + idx * 0.15);

          filter.type = "lowpass";
          filter.frequency.setValueAtTime(1500, now + idx * 0.15);
          filter.frequency.exponentialRampToValueAtTime(800, now + idx * 0.15 + 0.8);

          gainNode.gain.setValueAtTime(0, now + idx * 0.15);
          gainNode.gain.linearRampToValueAtTime(0.12, now + idx * 0.15 + 0.04); // subtle soft attack
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.8); // longer, warmer decay

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gainNode);
          gainNode.connect(dest);

          osc1.start(now + idx * 0.15);
          osc2.start(now + idx * 0.15);
          osc1.stop(now + idx * 0.15 + 1.9);
          osc2.stop(now + idx * 0.15 + 1.9);
        });
        break;
      }
      case "gong": {
        // Deep resonating Brass bowl containing physical "beating" frequency
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gainNode = ctx.createGain();

        // Dual low frequencies close together create nice sub-harmonic wave interference (110 and 111.2Hz)
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(110.00, now);
        
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(111.20, now);

        filter.type = "lowpass";
        filter.Q.setValueAtTime(8, now);
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + 3.5);

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.35, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 4.0);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(dest);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 4.2);
        osc2.stop(now + 4.2);

        // Add a secondary higher frequency harmonic bell layer 0.05s later to mimic gong hammer
        const hammer = ctx.createOscillator();
        const hammerGain = ctx.createGain();
        hammer.type = "sine";
        hammer.frequency.setValueAtTime(220.00, now + 0.05);
        hammerGain.gain.setValueAtTime(0, now + 0.05);
        hammerGain.gain.linearRampToValueAtTime(0.15, now + 0.08);
        hammerGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
        hammer.connect(hammerGain);
        hammerGain.connect(dest);
        hammer.start(now + 0.05);
        hammer.stop(now + 2.1);
        break;
      }
      case "flute": {
        // Organic wooden flute notes fading softly
        const melody = [523.25, 587.33, 659.25, 783.99, 880.00]; // C5, D5, E5, G5, A5 pentatonic scale
        melody.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.35);

          // Add subtle vibrating frequency (vibrato) for organic wooden feel
          const vibrato = ctx.createOscillator();
          const vibratoGain = ctx.createGain();
          vibrato.frequency.setValueAtTime(6, now + idx * 0.35); // 6 Hz vibrato
          vibratoGain.gain.setValueAtTime(4, now + idx * 0.35);
          vibrato.connect(vibratoGain);
          vibratoGain.connect(osc.frequency);

          filter.type = "lowpass";
          filter.frequency.setValueAtTime(1200, now);

          gainNode.gain.setValueAtTime(0, now + idx * 0.35);
          gainNode.gain.linearRampToValueAtTime(0.15, now + idx * 0.35 + 0.15); // slow soft attack
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.35 + 0.85);

          osc.connect(filter);
          filter.connect(gainNode);
          gainNode.connect(dest);

          vibrato.start(now + idx * 0.35);
          osc.start(now + idx * 0.35);
          
          vibrato.stop(now + idx * 0.35 + 0.9);
          osc.stop(now + idx * 0.35 + 0.9);
        });
        break;
      }
      case "breath": {
        // Calming Ocean Sweep using filtered simulated white noise wave
        const bufferSize = ctx.sampleRate * 4; // 4 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        const gainNode = ctx.createGain();

        filter.type = "bandpass";
        filter.Q.setValueAtTime(1.5, now);
        
        // Modulate bandwidth frequency for simulated rise and fall
        filter.frequency.setValueAtTime(150, now);
        filter.frequency.linearRampToValueAtTime(550, now + 1.8);
        filter.frequency.linearRampToValueAtTime(120, now + 4.0);

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 1.8);
        gainNode.gain.linearRampToValueAtTime(0.0001, now + 4.0);

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(dest);

        source.start(now);
        source.stop(now + 4.0);
        break;
      }
      case "sparkles": {
        // Fast fluttering sparkling high bells
        const stars = [1200, 1600, 2000, 1400, 1800, 2200, 2600];
        stars.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gainNode.gain.setValueAtTime(0, now + idx * 0.08);
          gainNode.gain.linearRampToValueAtTime(0.08, now + idx * 0.08 + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.25);

          osc.connect(gainNode);
          gainNode.connect(dest);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.3);
        });
        break;
      }
    }
  } catch (err) {
    console.warn("Error synthesizing Lyria audios:", err);
  }
}

/**
 * Play a high-quality alert chime when the timer completes.
 */
export function playChimeSuccess() {
  // Directly trigger our currently selected Lyria sound models
  playLyriaPreset(activeLyriaSoundId);
}

/**
 * Play a crisp mechanical tic-toc sound for the countdown.
 * Keeps user deeply engaged inside a soothing ambience!
 */
export function playTick(type: "high" | "low" = "high") {
  if (isMutedGlobal) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const dest = ctx.destination;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    // Soothing warm wood tap frequencies instead of high beeps:
    const freq = type === "high" ? 340 : 270;
    osc.frequency.setValueAtTime(freq, now);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, now);

    // Make it extremely low volume and soft so it is deeply soothing
    gainNode.gain.setValueAtTime(0.012, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(dest);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch (err) {
    // Fail silently
  }
}

/**
 * Play a short subtle button tap sound for click metrics!
 */
export function playTap() {
  if (isMutedGlobal) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const dest = ctx.destination;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    // Sub-bass tactile warm tap:
    osc.frequency.setValueAtTime(130, now);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(180, now);

    gainNode.gain.setValueAtTime(0.015, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(dest);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (err) {
    // Fail silently
  }
}
