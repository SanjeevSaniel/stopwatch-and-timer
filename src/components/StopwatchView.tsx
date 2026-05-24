import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Flag, Trash2, Calendar, Trophy, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Lap, AppThemeConfig } from "../types";
import { playTap } from "../utils/audio";

interface StopwatchViewProps {
  theme: AppThemeConfig;
  onSessionComplete: (durationMs: number, lapCount: number) => void;
  isDarkMode?: boolean;
}

export default function StopwatchView({ theme, onSessionComplete, isDarkMode = true }: StopwatchViewProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [laps, setLaps] = useState<Lap[]>([]);

  // Timekeepers
  const startTimestampRef = useRef<number | null>(null);
  const elapsedBeforePauseRef = useRef<number>(0);
  const requestIdRef = useRef<number | null>(null);

  // For the sweeping dial circle
  const seconds = (elapsedTime / 1000) % 60;
  const progressRatio = seconds / 60;

  // Precision Update Loop
  const updateTimer = () => {
    if (startTimestampRef.current !== null) {
      const now = Date.now();
      const currentDelta = now - startTimestampRef.current;
      setElapsedTime(elapsedBeforePauseRef.current + currentDelta);
    }
    requestIdRef.current = requestAnimationFrame(updateTimer);
  };

  const handleStart = () => {
    playTap();
    if (!isRunning) {
      startTimestampRef.current = Date.now();
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    playTap();
    if (isRunning) {
      if (startTimestampRef.current !== null) {
        elapsedBeforePauseRef.current += Date.now() - startTimestampRef.current;
      }
      setIsRunning(false);
      startTimestampRef.current = null;
    }
  };

  const handleReset = () => {
    playTap();
    // Prompt to log if elapsed > 0
    if (elapsedTime > 0) {
      onSessionComplete(elapsedTime, laps.length);
    }
    
    setIsRunning(false);
    setElapsedTime(0);
    setLaps([]);
    startTimestampRef.current = null;
    elapsedBeforePauseRef.current = 0;
  };

  const handleAddLap = () => {
    playTap();
    const lastLapSum = laps.length > 0 ? laps[0].overallTime : 0;
    const currentLapTime = elapsedTime - lastLapSum;

    const newLap: Lap = {
      id: Math.random().toString(36).substring(2, 9),
      index: laps.length + 1,
      lapTime: currentLapTime,
      overallTime: elapsedTime,
    };

    // Prepend to show the latest lap first in the scroll view
    setLaps([newLap, ...laps]);
  };

  // Clear ticks on unmount
  useEffect(() => {
    if (isRunning) {
      requestIdRef.current = requestAnimationFrame(updateTimer);
    } else {
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
    }
    return () => {
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
    };
  }, [isRunning]);

  // Format elapsed time (HH:MM:SS:CC)
  const formatTimeParts = (ms: number) => {
    const totalCentis = Math.floor(ms / 10);
    const centis = totalCentis % 100;
    const secs = Math.floor(ms / 1000) % 60;
    const mins = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60));

    return {
      hours: hours.toString().padStart(2, "0"),
      minutes: mins.toString().padStart(2, "0"),
      seconds: secs.toString().padStart(2, "0"),
      centiseconds: centis.toString().padStart(2, "0"),
    };
  };

  const parts = formatTimeParts(elapsedTime);

  // Analyze laps to find min / max lap counts
  const getLapPerformance = () => {
    if (laps.length <= 1) return { minId: "", maxId: "" };
    
    let minLap = laps[0];
    let maxLap = laps[0];

    laps.forEach(lap => {
      if (lap.lapTime < minLap.lapTime) minLap = lap;
      if (lap.lapTime > maxLap.lapTime) maxLap = lap;
    });

    return { minId: minLap.id, maxId: maxLap.id };
  };

  const { minId: fastestLapId, maxId: slowestLapId } = getLapPerformance();

  const formatLapDuration = (ms: number) => {
    const parts = formatTimeParts(ms);
    if (ms >= 3600000) {
      return `${parts.hours}:${parts.minutes}:${parts.seconds}.${parts.centiseconds}`;
    }
    return `${parts.minutes}:${parts.seconds}.${parts.centiseconds}`;
  };

  // Calculate circular stroke details
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div id="stopwatch-container" className="flex flex-col items-center gap-8 w-full max-w-2xl">
      {/* Circle Dial Section */}
      <div className="relative flex items-center justify-center w-80 h-80 select-none">
        
        {/* Ambient Glow Aura */}
        <div 
          className="absolute inset-0 rounded-full transition-all duration-1000 opacity-20 blur-2xl" 
          style={{ 
            backgroundColor: theme.accentColor,
            transform: isRunning ? "scale(1.05)" : "scale(1)"
          }}
        />

        {/* Outer Metronomic Progress Circle */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          {/* Base Track */}
          <circle
            cx="160"
            cy="160"
            r={radius}
            className={isDarkMode ? "stroke-zinc-800/60 fill-transparent" : "stroke-slate-200 fill-transparent"}
            strokeWidth="3"
          />
          {/* Moving Sweeper Track */}
          <motion.circle
            cx="160"
            cy="160"
            r={radius}
            className="fill-transparent stroke-current transition-colors duration-500"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ color: theme.accentColor }}
          />

          {/* Ticks representation around outer deck */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = 160 + (radius - 8) * Math.sin(angle);
            const y1 = 160 - (radius - 8) * Math.cos(angle);
            const x2 = 160 + (radius + 2) * Math.sin(angle);
            const y2 = 160 - (radius + 2) * Math.cos(angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={i % 3 === 0 ? "stroke-zinc-500" : "stroke-zinc-700"}
                strokeWidth={i % 3 === 0 ? 2 : 1.5}
              />
            );
          })}
        </svg>

        {/* Center Digital Displays */}
        <div className="flex flex-col items-center justify-center z-10 w-full text-center">
          <span className={`text-xs font-semibold tracking-widest uppercase ${isDarkMode ? "text-zinc-500" : "text-slate-500"}`}>STOPWATCH</span>
          
          {/* Huge Numeric Value (Using monospaced metrics to ensure static element layout) */}
          <div className={`flex items-baseline justify-center font-mono font-bold font-tabular mt-2 select-all leading-none ${isDarkMode ? "text-zinc-100" : "text-slate-850"}`}>
            {parseInt(parts.hours) > 0 && (
              <>
                <span className="text-4xl sm:text-5xl">{parts.hours}</span>
                <span className="text-zinc-500 text-3xl sm:text-4xl mx-0.5">:</span>
              </>
            )}
            <span className="text-5xl sm:text-6xl">{parts.minutes}</span>
            <span className="text-theme-accent text-4xl sm:text-5xl mx-0.5" style={{ color: theme.accentColor }}>:</span>
            <span className="text-5xl sm:text-6xl">{parts.seconds}</span>
            <span className={`text-2xl sm:text-3xl ml-1 font-medium ${isDarkMode ? "text-zinc-550" : "text-slate-450"}`}>.{parts.centiseconds}</span>
          </div>

          {/* Stats quick deck */}
          <div className="flex items-center gap-3 mt-4 text-xs">
            <span className={`px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${
              isDarkMode ? "bg-zinc-800/80 border-zinc-700/60 text-zinc-405" : "bg-slate-100 border-slate-250 text-slate-650"
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {laps.length} Laps
            </span>
            {laps.length > 0 && (
              <span className={isDarkMode ? "text-zinc-500" : "text-slate-500"}>
                Avg: {formatLapDuration(elapsedTime / laps.length)}
              </span>
            )}
          </div>
        </div>

        {/* Floating Accent Point sweep */}
        <div
          className="absolute w-2.5 h-2.5 rounded-full shadow-lg transition-transform"
          style={{
            backgroundColor: theme.accentColor,
            boxShadow: `0 0 12px ${theme.accentColor}`,
            left: `${160 + radius * Math.cos((progressRatio * 360 - 90) * Math.PI / 180) - 5}px`,
            top: `${160 + radius * Math.sin((progressRatio * 360 - 90) * Math.PI / 180) - 5}px`,
          }}
        />
      </div>

      {/* Control Actions Panel */}
      <div id="stopwatch-actions" className="flex items-center justify-center gap-4 w-full px-4">
        {/* Reset / Complete Trigger Button */}
        <button
          id="btn-stopwatch-reset"
          onClick={handleReset}
          disabled={elapsedTime === 0}
          className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-semibold border transition-all duration-300 w-32 cursor-pointer 
            ${elapsedTime > 0 
              ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white" 
              : "opacity-40 bg-zinc-950 border-zinc-900 text-zinc-600 cursor-not-allowed"}`}
        >
          <RotateCcw size={18} />
          Reset
        </button>

        {/* Principal Dynamic Action Button */}
        {isRunning ? (
          <button
            id="btn-stopwatch-pause"
            onClick={handlePause}
            className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-lg text-black hover:scale-105 active:scale-95 flex-1 max-w-[170px] cursor-pointer"
            style={{
              backgroundColor: "#f59e0b", // Yellow/Amber pause accent
              boxShadow: "0 4px 14px rgba(245, 158, 11, 0.2)"
            }}
          >
            <Pause size={20} className="fill-current" />
            Pause
          </button>
        ) : (
          <button
            id="btn-stopwatch-start"
            onClick={handleStart}
            className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-lg text-black hover:scale-105 active:scale-95 flex-1 max-w-[170px] cursor-pointer"
            style={{
              backgroundColor: theme.accentColor,
              boxShadow: `0 4px 16px ${theme.glowShadow}`
            }}
          >
            <Play size={20} className="fill-current" />
            {elapsedTime > 0 ? "Resume" : "Start"}
          </button>
        )}

        {/* Lap Record Trigger Button */}
        <button
          id="btn-stopwatch-lap"
          onClick={handleAddLap}
          disabled={!isRunning}
          className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-semibold border transition-all duration-300 w-32 cursor-pointer
            ${isRunning 
              ? `bg-zinc-900 ${theme.primary} ${theme.primaryBorder} hover:bg-zinc-800/80` 
              : "opacity-40 bg-zinc-950 border-zinc-900 text-zinc-600 cursor-not-allowed"}`}
        >
          <Flag size={18} />
          Lap
        </button>
      </div>

      {/* Laps Splitting Presentation Table */}
      <AnimatePresence>
        {laps.length > 0 && (
          <motion.div
            id="stopwatch-laps-wrapper"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-zinc-900/45 border border-zinc-800/70 rounded-3xl p-5 backdrop-blur-md flex flex-col gap-3 shadow-inner"
          >
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <span className="text-zinc-400 font-semibold flex items-center gap-2 text-sm">
                <Flag size={15} style={{ color: theme.accentColor }} />
                Lap Splits History
              </span>
              <button
                id="btn-clear-laps-list"
                onClick={() => { playTap(); setLaps([]); }}
                className="text-xs font-semibold text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-zinc-850 cursor-pointer"
              >
                <Trash2 size={13} />
                Clear
              </button>
            </div>

            {/* Header Columns */}
            <div className="grid grid-cols-3 text-xs font-medium tracking-wider text-zinc-500 uppercase px-2 py-1">
              <span>Lap</span>
              <span className="text-right">Lap Duration</span>
              <span className="text-right">Split Time</span>
            </div>

            {/* List entries */}
            <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
              {laps.map((lap) => {
                const isFastest = lap.id === fastestLapId && laps.length > 1;
                const isSlowest = lap.id === slowestLapId && laps.length > 1;
                
                return (
                  <div
                    key={lap.id}
                    className={`grid grid-cols-3 items-center rounded-xl p-3 text-sm font-mono font-tabular border transition-all duration-200
                      ${isFastest 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" 
                        : isSlowest 
                          ? "bg-red-500/10 border-red-500/20 text-red-300" 
                          : "bg-zinc-950/40 border-zinc-900 hover:border-zinc-800/55 text-zinc-300"}`}
                  >
                    <span className="font-semibold flex items-center gap-1.5 text-zinc-400">
                      #{lap.index.toString().padStart(2, "0")}
                      {isFastest && (
                        <Trophy size={13} className="text-emerald-400 inline-block fill-emerald-500/20" />
                      )}
                      {isSlowest && (
                        <AlertCircle size={13} className="text-red-400 inline-block fill-red-500/20" />
                      )}
                    </span>
                    <span className={`text-right ${isFastest ? "font-bold" : ""}`}>
                      {formatLapDuration(lap.lapTime)}
                    </span>
                    <span className="text-right text-zinc-400">
                      {formatLapDuration(lap.overallTime)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Fastest/Slowest summary helper to encourage professional visual analysis */}
            {laps.length > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40 inline-block" />
                  Fastest Lap
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/40 inline-block" />
                  Slowest Lap
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
