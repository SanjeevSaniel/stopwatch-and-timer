import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Plus, Trash2, Volume2, VolumeX, Sparkles, Clock, Zap, Target, BookOpen, Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TimerPreset, AppThemeConfig } from "../types";
import { 
  playTap, 
  playChimeSuccess, 
  playTick, 
  LYRIA_SOUNDS, 
  playLyriaPreset, 
  getSelectedSound, 
  setSelectedSound 
} from "../utils/audio";

interface TimerViewProps {
  theme: AppThemeConfig;
  onSessionComplete: (durationMs: number, label: string) => void;
  activePreset?: TimerPreset | null;
  onPresetApplied?: () => void;
  isSoundEnabled?: boolean;
  isDarkMode?: boolean;
}

export default function TimerView({ 
  theme, 
  onSessionComplete,
  activePreset = null,
  onPresetApplied,
  isSoundEnabled = true,
  isDarkMode = true
}: TimerViewProps) {
  // Input settings
  const [inputHours, setInputHours] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(25);
  const [inputSeconds, setInputSeconds] = useState(0);

  // Manual Input Direct Digits state
  const [isManualInputMode, setIsManualInputMode] = useState(false);
  const [manualHoursStr, setManualHoursStr] = useState("00");
  const [manualMinutesStr, setManualMinutesStr] = useState("25");
  const [manualSecondsStr, setManualSecondsStr] = useState("00");

  const mInputRef = useRef<HTMLInputElement>(null);
  const sInputRef = useRef<HTMLInputElement>(null);

  // Sound settings
  const [selectedSoundId, setSelectedSoundId] = useState(getSelectedSound());
  const [isAlarmActive, setIsAlarmActive] = useState(false);

  // States
  const [totalDuration, setTotalDuration] = useState(0); // Initial set duration in ms
  const [timeRemaining, setTimeRemaining] = useState(0); // Current remaining in ms
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [currentLabel, setCurrentLabel] = useState("Custom Focus Task");

  // Tracking Ref handles
  const endTimeRef = useRef<number | null>(null);
  const remainingBeforePauseRef = useRef<number | null>(null);
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);

  // Handle external preset updates
  useEffect(() => {
    if (activePreset) {
      handleApplyPreset(activePreset);
      if (onPresetApplied) {
        onPresetApplied();
      }
    }
  }, [activePreset]);

  // Run countdown loop
  const stepTimer = () => {
    if (endTimeRef.current !== null) {
      const now = Date.now();
      const remaining = Math.max(0, endTimeRef.current - now);
      
      setTimeRemaining(remaining);

      // Play continuous ticking click near critical countdown (last 5s)
      if (isSoundEnabled && remaining > 0 && remaining <= 5500) {
        // Tics once per second approximate boundary
        const secs = Math.ceil(remaining / 1000);
        const lastSecs = Math.ceil((remaining + 16) / 1000);
        if (secs !== lastSecs) {
          playTick(secs <= 3 ? "high" : "low");
        }
      }

      if (remaining <= 0) {
        // Timer Completed!
        handleComplete();
        return;
      }
    }
    timerIdRef.current = setTimeout(stepTimer, 50); // High precision tick rate
  };

  const handleStart = () => {
    playTap();
    if (isAlarmActive) {
      setIsAlarmActive(false);
      return;
    }

    if (!isTimerActive) {
      let durationMs = 0;
      if (remainingBeforePauseRef.current !== null) {
        durationMs = remainingBeforePauseRef.current;
      } else {
        const ms = (inputHours * 3600 + inputMinutes * 60 + inputSeconds) * 1000;
        if (ms <= 0) return; // Cannot start 0 duration timer
        durationMs = ms;
        setTotalDuration(ms);
      }

      endTimeRef.current = Date.now() + durationMs;
      setTimeRemaining(durationMs);
      setIsTimerActive(true);
    }
  };

  const handlePause = () => {
    playTap();
    if (isTimerActive) {
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
      remainingBeforePauseRef.current = timeRemaining;
      setIsTimerActive(false);
      endTimeRef.current = null;
    }
  };

  const handleReset = () => {
    playTap();
    if (timerIdRef.current) clearTimeout(timerIdRef.current);
    
    setIsTimerActive(false);
    setIsAlarmActive(false);
    setTimeRemaining(0);
    setTotalDuration(0);
    endTimeRef.current = null;
    remainingBeforePauseRef.current = null;
  };

  const handleComplete = () => {
    if (timerIdRef.current) clearTimeout(timerIdRef.current);
    setIsTimerActive(false);
    setIsAlarmActive(true);
    setTimeRemaining(0);
    endTimeRef.current = null;
    remainingBeforePauseRef.current = null;

    // Trigger Success Audio Chime
    if (isSoundEnabled) {
      playChimeSuccess();
    }

    // Log completion session item
    onSessionComplete(totalDuration, currentLabel);
  };

  // Add 1 minute dynamic utility setup
  const handleAddOneMinute = () => {
    playTap();
    if (isAlarmActive) {
      setIsAlarmActive(false);
      // Reset & load 1 minute
      setTotalDuration(60000);
      setTimeRemaining(60000);
      endTimeRef.current = Date.now() + 60000;
      setIsTimerActive(true);
      return;
    }

    if (isTimerActive && endTimeRef.current !== null) {
      endTimeRef.current += 60000;
      setTotalDuration(prev => prev + 60000);
      setTimeRemaining(prev => prev + 60000);
    } else if (remainingBeforePauseRef.current !== null) {
      remainingBeforePauseRef.current += 60000;
      setTotalDuration(prev => prev + 60000);
      setTimeRemaining(prev => prev + 60000);
    } else {
      // If timer is idle, add to inputs or start immediately
      setInputMinutes(prev => Math.min(prev + 1, 99));
    }
  };

  const handleApplyPreset = (preset: TimerPreset) => {
    playTap();
    handleReset();
    setInputHours(preset.hours);
    setInputMinutes(preset.minutes);
    setInputSeconds(preset.seconds);
    setCurrentLabel(preset.label);
    
    const ms = (preset.hours * 3600 + preset.minutes * 60 + preset.seconds) * 1000;
    setTotalDuration(ms);
    setTimeRemaining(ms);
    
    // Auto-start upon preset touch for dynamic convenience
    endTimeRef.current = Date.now() + ms;
    setIsTimerActive(true);
  };

  const handleClockDoubleClick = () => {
    playTap();
    if (isTimerActive) {
      handlePause();
    }
    
    let targetMs = totalDuration;
    if (timeRemaining > 0) {
      targetMs = timeRemaining;
    } else {
      targetMs = (inputHours * 3600 + inputMinutes * 60 + inputSeconds) * 1000;
    }
    
    const totalSecs = Math.ceil(targetMs / 1000);
    const s = totalSecs % 60;
    const m = Math.floor(totalSecs / 60) % 60;
    const h = Math.floor(totalSecs / 3600);

    setManualHoursStr(h.toString().padStart(2, "0"));
    setManualMinutesStr(m.toString().padStart(2, "0"));
    setManualSecondsStr(s.toString().padStart(2, "0"));
    
    setIsManualInputMode(true);
  };

  const handleSaveManualAndStart = () => {
    playTap();
    const h = Math.min(23, Math.max(0, parseInt(manualHoursStr) || 0));
    const m = Math.min(59, Math.max(0, parseInt(manualMinutesStr) || 0));
    const s = Math.min(59, Math.max(0, parseInt(manualSecondsStr) || 0));

    setInputHours(h);
    setInputMinutes(m);
    setInputSeconds(s);
    
    const ms = (h * 3600 + m * 60 + s) * 1000;
    if (ms > 0) {
      setTotalDuration(ms);
      setTimeRemaining(ms);
      endTimeRef.current = Date.now() + ms;
      setIsTimerActive(true);
      remainingBeforePauseRef.current = null;
    }
    setIsManualInputMode(false);
  };

  const handleSoundSelect = (soundId: string) => {
    setSelectedSoundId(soundId);
    setSelectedSound(soundId);
    playLyriaPreset(soundId);
  };

  // Timer effect controller
  useEffect(() => {
    if (isTimerActive) {
      timerIdRef.current = setTimeout(stepTimer, 50);
    }
    return () => {
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
    };
  }, [isTimerActive]);

  // Clean alarms after 12s automatically so it doesn't loop forever
  useEffect(() => {
    let t: NodeJS.Timeout;
    if (isAlarmActive) {
      t = setTimeout(() => {
        setIsAlarmActive(false);
      }, 15000);
    }
    return () => clearTimeout(t);
  }, [isAlarmActive]);

  // Formatting remaining times (HH:MM:SS)
  const formatCountdown = (ms: number) => {
    const totalSecs = Math.ceil(ms / 1000);
    const s = totalSecs % 60;
    const m = Math.floor(totalSecs / 60) % 60;
    const h = Math.floor(totalSecs / 3600);

    return {
      hours: h.toString().padStart(2, "0"),
      minutes: m.toString().padStart(2, "0"),
      seconds: s.toString().padStart(2, "0"),
      totalSecs,
    };
  };

  const formatTimerInputForDisplay = (h: number, m: number, s: number) => {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const remainingParts = formatCountdown(timeRemaining);

  // SVG circular properties
  const isEditing = totalDuration === 0;
  // Compute percentage remaining
  const progressRatio = totalDuration > 0 ? (timeRemaining / totalDuration) : 1;
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  // Preset Category Styling Helpers
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "work": return <BookOpen size={14} className="text-amber-400" />;
      case "break": return <Sparkles size={14} className="text-teal-400" />;
      case "fitness": return <Dumbbell size={14} className="text-rose-400" />;
      default: return <Clock size={14} className="text-cyan-400" />;
    }
  };

  const handleDismissAlarm = () => {
    playTap();
    setIsAlarmActive(false);
  };

  return (
    <div id="timer-component" className="flex flex-col items-center gap-8 w-full max-w-3xl">
      
      {/* Visual Circle Gauge */}
      <div 
        onDoubleClick={handleClockDoubleClick}
        className="relative flex items-center justify-center w-80 h-80 select-none cursor-pointer"
        title="Double-click to edit countdown digits directly using your keyboard"
      >
        
        {/* Rapid Flash completion alert backdrop with beautiful organic cascading ripples */}
        {isAlarmActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <motion.div
              initial={{ scale: 0.95, opacity: 0.8 }}
              animate={{ scale: 2.3, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
              className="absolute w-72 h-72 rounded-full border border-red-500/40"
              style={{ boxShadow: `0 0 45px rgba(239, 68, 68, 0.25)` }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0.8 }}
              animate={{ scale: 2.3, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut", delay: 0.8 }}
              className="absolute w-72 h-72 rounded-full border"
              style={{ borderColor: `${theme.accentColor}35`, boxShadow: `0 0 45px ${theme.accentColor}20` }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0.8 }}
              animate={{ scale: 2.3, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut", delay: 1.6 }}
              className="absolute w-72 h-72 rounded-full border border-red-500/20"
              style={{ boxShadow: `0 0 45px rgba(239, 68, 68, 0.15)` }}
            />
          </div>
        )}

        {/* Ambient Glow Aura */}
        <div 
          className="absolute inset-0 rounded-full transition-all duration-1000 opacity-20 blur-2xl" 
          style={{ 
            backgroundColor: isAlarmActive ? "#ef4444" : theme.accentColor,
            transform: isTimerActive ? "scale(1.05)" : "scale(1)"
          }}
        />

        {/* Timer SVG Gauge */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle
            cx="160"
            cy="160"
            r={radius}
            className={isDarkMode ? "stroke-zinc-800/60 fill-transparent" : "stroke-slate-200 fill-transparent"}
            strokeWidth="3"
          />
          <motion.circle
            cx="160"
            cy="160"
            r={radius}
            className="fill-transparent stroke-current transition-colors duration-500"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ 
              color: isAlarmActive ? "#ef4444" : theme.accentColor 
            }}
          />
        </svg>

        {/* Dynamic Center Panel */}
        <div className="flex flex-col items-center justify-center z-10 w-full text-center px-6">
          {isAlarmActive ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-1.5"
            >
              <Zap size={32} className="text-red-500 animate-bounce" />
              <span className="text-red-400 text-xs font-bold tracking-widest uppercase">TIMER COMPLETED</span>
              <span className={`text-sm font-medium mt-1 truncate max-w-[200px] ${isDarkMode ? "text-zinc-105" : "text-slate-800"}`} title={currentLabel}>
                {currentLabel}
              </span>
              <button
                id="btn-dismiss-alarm"
                onClick={handleDismissAlarm}
                className="mt-3 px-4 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs select-none shadow-lg cursor-pointer animate-pulse"
              >
                Dismiss Alarm
              </button>
            </motion.div>
          ) : isManualInputMode ? (
            /* Direct Keyboard Manual Entry Input Panel */
            <div className="flex flex-col items-center justify-center">
              <span className={`text-[10px] font-extrabold tracking-widest uppercase flex items-center gap-1.5 mb-2.5 ${
                isDarkMode ? "text-violet-400" : "text-violet-600"
              }`}>
                Manual Digits Entry
              </span>
              <div className="flex items-center gap-1.5 text-zinc-100 font-mono font-bold text-3xl sm:text-4xl">
                {/* Hours input box */}
                <input
                  type="text"
                  maxLength={2}
                  value={manualHoursStr}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setManualHoursStr(clean);
                    if (clean.length === 2 && mInputRef.current) {
                      mInputRef.current.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveManualAndStart();
                    if (e.key === "Escape") setIsManualInputMode(false);
                  }}
                  className={`w-14 text-center text-3xl font-bold font-mono py-1 rounded-xl bg-zinc-950 border ${
                    isDarkMode ? "border-zinc-800 focus:border-violet-500 text-zinc-100" : "border-slate-300 focus:border-violet-500 text-slate-900"
                  }`}
                  placeholder="00"
                  autoFocus
                />
                <span className={isDarkMode ? "text-zinc-700" : "text-slate-450"}>:</span>

                {/* Minutes input box */}
                <input
                  ref={mInputRef}
                  type="text"
                  maxLength={2}
                  value={manualMinutesStr}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setManualMinutesStr(clean);
                    if (clean.length === 2 && sInputRef.current) {
                      sInputRef.current.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveManualAndStart();
                    if (e.key === "Escape") setIsManualInputMode(false);
                  }}
                  className={`w-14 text-center text-3xl font-bold font-mono py-1 rounded-xl bg-zinc-950 border ${
                    isDarkMode ? "border-zinc-800 focus:border-violet-500 text-zinc-100" : "border-slate-300 focus:border-violet-500 text-slate-900"
                  }`}
                  placeholder="25"
                />
                <span className={isDarkMode ? "text-zinc-700" : "text-slate-450"}>:</span>

                {/* Seconds input box */}
                <input
                  ref={sInputRef}
                  type="text"
                  maxLength={2}
                  value={manualSecondsStr}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setManualSecondsStr(clean);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveManualAndStart();
                    if (e.key === "Escape") setIsManualInputMode(false);
                  }}
                  className={`w-14 text-center text-3xl font-bold font-mono py-1 rounded-xl bg-zinc-950 border ${
                    isDarkMode ? "border-zinc-800 focus:border-violet-500 text-zinc-100" : "border-slate-300 focus:border-violet-500 text-slate-900"
                  }`}
                  placeholder="00"
                />
              </div>

              <div className="flex flex-col items-center gap-1.5 mt-4">
                <button
                  type="button"
                  onClick={handleSaveManualAndStart}
                  className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold tracking-wider text-[9px] rounded-lg uppercase select-none cursor-pointer"
                >
                  Save & Start
                </button>
                <button
                  type="button"
                  onClick={() => setIsManualInputMode(false)}
                  className={`text-[8.5px] font-bold tracking-wider uppercase underline ${
                    isDarkMode ? "text-zinc-550 hover:text-zinc-350" : "text-slate-550 hover:text-slate-800"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : isEditing ? (
            /* Idle Input Editor view */
            <div className="flex flex-col items-center justify-center">
              <span className={`text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 mb-2 ${
                isDarkMode ? "text-zinc-500" : "text-slate-500"
              }`}>
                <Target size={13} style={{ color: theme.accentColor }} />
                Set Countdown
              </span>
              
              <div className={`flex items-center gap-1 font-mono font-bold text-3xl sm:text-4xl ${
                isDarkMode ? "text-zinc-100" : "text-slate-800"
              }`}>
                {/* Hours field */}
                <div className="flex flex-col items-center">
                  <button 
                    onClick={() => { playTap(); setInputHours(prev => (prev + 1) % 24); }}
                    className="text-zinc-650 hover:text-zinc-300 text-lg py-0.5 cursor-pointer select-none"
                  >
                    ▲
                  </button>
                  <span className="w-12 text-center">{inputHours.toString().padStart(2, "0")}</span>
                  <button 
                    onClick={() => { playTap(); setInputHours(prev => (prev - 1 + 24) % 24); }}
                    className="text-zinc-650 hover:text-zinc-300 text-lg py-0.5 cursor-pointer select-none"
                  >
                    ▼
                  </button>
                </div>
                <span className={isDarkMode ? "text-zinc-700 pb-5" : "text-slate-350 pb-5"}>:</span>

                {/* Minutes field */}
                <div className="flex flex-col items-center">
                  <button 
                    onClick={() => { playTap(); setInputMinutes(prev => (prev + 1) % 60); }}
                    className="text-zinc-650 hover:text-zinc-300 text-lg py-0.5 cursor-pointer select-none"
                  >
                    ▲
                  </button>
                  <span className="w-12 text-center">{inputMinutes.toString().padStart(2, "0")}</span>
                  <button 
                    onClick={() => { playTap(); setInputMinutes(prev => (prev - 1 + 60) % 60); }}
                    className="text-zinc-650 hover:text-zinc-300 text-lg py-0.5 cursor-pointer select-none"
                  >
                    ▼
                  </button>
                </div>
                <span className={isDarkMode ? "text-zinc-700 pb-5" : "text-slate-350 pb-5"}>:</span>

                {/* Seconds field */}
                <div className="flex flex-col items-center">
                  <button 
                    onClick={() => { playTap(); setInputSeconds(prev => (prev + 1) % 60); }}
                    className="text-zinc-650 hover:text-zinc-300 text-lg py-0.5 cursor-pointer select-none"
                  >
                    ▲
                  </button>
                  <span className="w-12 text-center">{inputSeconds.toString().padStart(2, "0")}</span>
                  <button 
                    onClick={() => { playTap(); setInputSeconds(prev => (prev - 1 + 60) % 60); }}
                    className="text-zinc-650 hover:text-zinc-300 text-lg py-0.5 cursor-pointer select-none"
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* Time Indicators */}
              <div className="flex justify-between w-40 text-[9px] font-bold tracking-wider text-zinc-500 mt-1 uppercase">
                <span className="w-12 text-center">Hours</span>
                <span className="w-12 text-center">Mins</span>
                <span className="w-12 text-center">Secs</span>
              </div>
              
              <span className={`text-[9px] mt-2.5 font-semibold text-zinc-500 opacity-80 ${
                isDarkMode ? "text-zinc-600" : "text-slate-450"
              }`}>
                Double-click clock to type digits
              </span>
            </div>
          ) : (
            /* Running countdown display view */
            <div className="flex flex-col items-center">
              <span className={`text-xs font-semibold tracking-widest uppercase flex items-center gap-1.5 truncate max-w-[200px] ${
                isDarkMode ? "text-zinc-500" : "text-slate-550"
              }`} title={currentLabel}>
                <Clock size={12} className={isTimerActive ? "text-zinc-500 animate-spin" : "text-zinc-550"} style={{ animationDuration: "12s" }} />
                {currentLabel}
              </span>

              {/* Running numbers */}
              <div className={`flex items-baseline font-mono font-bold font-tabular mt-2.5 select-all leading-none ${
                isDarkMode ? "text-zinc-100" : "text-slate-800"
              }`}>
                {parseInt(remainingParts.hours) > 0 && (
                  <>
                    <span className="text-4xl sm:text-5xl">{remainingParts.hours}</span>
                    <span className="text-zinc-550 text-3xl sm:text-4xl mx-0.5">:</span>
                  </>
                )}
                <span className="text-5xl sm:text-6xl">{remainingParts.minutes}</span>
                <span className="text-3xl sm:text-4xl mx-0.5" style={{ color: theme.accentColor }}>:</span>
                <span className="text-5xl sm:text-6xl">{remainingParts.seconds}</span>
              </div>

              {/* Percent completion indicator */}
              <span className={`text-[10px] font-bold mt-3 px-2 py-0.5 rounded-full border ${
                isDarkMode ? "bg-zinc-900 border-zinc-805 text-zinc-500" : "bg-slate-100 border-slate-200 text-slate-500"
              }`}>
                {Math.round(progressRatio * 100)}% Remaining
              </span>
            </div>
          )}
        </div>

        {/* Floating Tick Sweep */}
        {!isEditing && !isAlarmActive && (
          <div
            className="absolute w-2.5 h-2.5 rounded-full shadow-lg transition-transform"
            style={{
              backgroundColor: theme.accentColor,
              boxShadow: `0 0 10px ${theme.accentColor}`,
              left: `${160 + radius * Math.cos((progressRatio * 360 - 90) * Math.PI / 180) - 5}px`,
              top: `${160 + radius * Math.sin((progressRatio * 360 - 90) * Math.PI / 180) - 5}px`,
            }}
          />
        )}
      </div>

      {/* Lyria Soothing Sound Selection Suite */}
      <div className={`w-full max-w-sm rounded-2xl p-3 border flex flex-col gap-2 ${
        isDarkMode ? "bg-zinc-950/45 border-zinc-900/60" : "bg-white/85 border-slate-250/60 shadow-inner"
      }`}>
        <span className={`text-[9.5px] font-bold tracking-widest uppercase flex items-center gap-1.5 ${
          isDarkMode ? "text-zinc-400" : "text-slate-500 font-semibold"
        }`}>
          <Sparkles size={11} style={{ color: theme.accentColor }} />
          Lyria Acoustic Harmonic Alarm Selector
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {LYRIA_SOUNDS.map((sound) => {
            const isActive = selectedSoundId === sound.id;
            return (
              <button
                key={sound.id}
                onClick={() => handleSoundSelect(sound.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10.5px] font-semibold tracking-wide transition-all duration-250 border flex-shrink-0 cursor-pointer ${
                  isActive
                    ? isDarkMode
                      ? "bg-zinc-900 text-white border-zinc-800"
                      : "bg-[#07080a] text-white border-zinc-950"
                    : isDarkMode
                      ? "bg-[#07080a]/65 text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/30"
                      : "bg-slate-50 text-slate-600 border-slate-150 hover:text-slate-800 hover:bg-slate-100/60"
                }`}
                title={sound.description}
              >
                <span className="text-xs">{sound.icon}</span>
                <span>{sound.name.replace("Lyria ", "")}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Control Panel Actions */}
      <div id="timer-actions" className="flex items-center justify-center gap-4 w-full px-4">
        {/* Reset/Cancel Button */}
        <button
          id="btn-timer-reset"
          onClick={handleReset}
          disabled={isEditing && !isAlarmActive}
          className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-semibold border transition-all duration-300 w-32 cursor-pointer
            ${(!isEditing || isAlarmActive)
              ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white"
              : "opacity-40 bg-zinc-950 border-zinc-900 text-zinc-600 cursor-not-allowed"}`}
        >
          <RotateCcw size={18} />
          {isAlarmActive ? "Clear" : "Reset"}
        </button>

        {/* Dynamic Play/Pause */}
        {isEditing ? (
          <button
            id="btn-timer-start-trigger"
            onClick={handleStart}
            disabled={inputHours === 0 && inputMinutes === 0 && inputSeconds === 0}
            className={`flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-lg text-black hover:scale-105 active:scale-95 flex-1 max-w-[170px] cursor-pointer
              ${(inputHours > 0 || inputMinutes > 0 || inputSeconds > 0)
                ? ""
                : "opacity-40 bg-zinc-800 text-zinc-500 cursor-not-allowed"}`}
            style={{
              backgroundColor: (inputHours > 0 || inputMinutes > 0 || inputSeconds > 0) ? theme.accentColor : undefined,
              boxShadow: (inputHours > 0 || inputMinutes > 0 || inputSeconds > 0) ? `0 4px 16px ${theme.glowShadow}` : undefined
            }}
          >
            <Play size={20} className="fill-current" />
            Start
          </button>
        ) : isTimerActive ? (
          <button
            id="btn-timer-pause-trigger"
            onClick={handlePause}
            className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-lg text-black hover:scale-105 active:scale-95 flex-1 max-w-[170px] cursor-pointer"
            style={{
              backgroundColor: "#f59e0b",
              boxShadow: "0 4px 14px rgba(245, 158, 11, 0.2)"
            }}
          >
            <Pause size={20} className="fill-current" />
            Pause
          </button>
        ) : (
          <button
            id="btn-timer-resume-trigger"
            onClick={handleStart}
            className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-lg text-black hover:scale-105 active:scale-95 flex-1 max-w-[170px] cursor-pointer"
            style={{
              backgroundColor: theme.accentColor,
              boxShadow: `0 4px 16px ${theme.glowShadow}`
            }}
          >
            <Play size={20} className="fill-current" />
            Resume
          </button>
        )}

        {/* Add Minute Quick Operation Button */}
        <button
          id="btn-timer-add-minute"
          onClick={handleAddOneMinute}
          className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl font-bold border bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 text-zinc-200 transition-all duration-300 w-32 cursor-pointer"
        >
          <Plus size={16} />
          <span>+1 Min</span>
        </button>
      </div>

    </div>
  );
}
