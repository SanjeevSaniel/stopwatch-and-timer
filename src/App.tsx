import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { THEMES } from "./utils/theme";
import { AppThemeConfig, HistoryItem, TimerPreset } from "./types";
import StopwatchView from "./components/StopwatchView";
import TimerView from "./components/TimerView";
import HistoryLog from "./components/HistoryLog";
import { playTap, setSoundEnabled } from "./utils/audio";
import { 
  Clock, 
  Timer, 
  Palette,
  CheckCircle2,
  Bookmark,
  TrendingUp,
  Flame,
  Target,
  BookOpen,
  Sparkles,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Dumbbell,
  Sun,
  Moon
} from "lucide-react";

const DEFAULT_PRESETS: TimerPreset[] = [
  { id: "p1", label: "Pomodoro Focus", hours: 0, minutes: 25, seconds: 0, category: "work" },
  { id: "p2", label: "Short Break", hours: 0, minutes: 5, seconds: 0, category: "break" },
  { id: "p3", label: "Long Break", hours: 0, minutes: 15, seconds: 0, category: "break" },
  { id: "p4", label: "Deep Workout", hours: 0, minutes: 10, seconds: 0, category: "fitness" },
  { id: "p5", label: "Gym HIIT Round", hours: 0, minutes: 1, seconds: 30, category: "fitness" },
];

export default function App() {
  const [theme, setTheme] = useState<AppThemeConfig>(THEMES[0]);
  const [activeTab, setActiveTab] = useState<"stopwatch" | "timer">("stopwatch");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Presets and Volume Audio Settings States
  const [customPresets, setCustomPresets] = useState<TimerPreset[]>([]);
  const [newPresetLabel, setNewPresetLabel] = useState("");
  const [newPresetH, setNewPresetH] = useState(0);
  const [newPresetM, setNewPresetM] = useState(25);
  const [newPresetS, setNewPresetS] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activePreset, setActivePreset] = useState<TimerPreset | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Split-Screen Side Toggles States
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  // Sync isSoundEnabled state to global sound synth
  useEffect(() => {
    setSoundEnabled(isSoundEnabled);
  }, [isSoundEnabled]);

  // Resize Listener to handle responsive screen boundaries automatically
  useEffect(() => {
    const checkViewportLimit = () => {
      const isMobileTablet = window.innerWidth < 1024;
      if (isMobileTablet) {
        setIsLeftSidebarOpen(false);
        setIsRightSidebarOpen(false);
      } else {
        setIsLeftSidebarOpen(true);
        // Keep right sidebar closed by default on desktop, respecting user preference
      }
    };
    
    checkViewportLimit();
    window.addEventListener("resize", checkViewportLimit);
    return () => window.removeEventListener("resize", checkViewportLimit);
  }, []);

  // Load history & presets from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("timing_history_logs");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load timing history", e);
    }

    try {
      const savedThemeId = localStorage.getItem("timing_active_theme");
      if (savedThemeId) {
        const found = THEMES.find(t => t.id === savedThemeId);
        if (found) setTheme(found);
      }
    } catch (e) {
      // Ignored
    }

    try {
      const savedSound = localStorage.getItem("timing_sound_enabled");
      if (savedSound !== null) {
        setIsSoundEnabled(savedSound === "true");
      }
    } catch (e) {}

    try {
      const savedMode = localStorage.getItem("timing_ui_mode");
      if (savedMode !== null) {
        setIsDarkMode(savedMode === "dark");
      }
    } catch (e) {}

    try {
      const savedPresets = localStorage.getItem("timer_custom_presets");
      if (savedPresets) {
        setCustomPresets(JSON.parse(savedPresets));
      }
    } catch (e) {
      console.error("Failed to load custom presets", e);
    }
  }, []);

  const saveHistory = (updated: HistoryItem[] | ((prev: HistoryItem[]) => HistoryItem[])) => {
    setHistory((prev) => {
      const next = typeof updated === "function" ? updated(prev) : updated;
      try {
        localStorage.setItem("timing_history_logs", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to store history logs in localStorage", e);
      }
      return next;
    });
  };

  const saveCustomPresets = (updated: TimerPreset[] | ((prev: TimerPreset[]) => TimerPreset[])) => {
    setCustomPresets((prev) => {
      const next = typeof updated === "function" ? updated(prev) : updated;
      try {
        localStorage.setItem("timer_custom_presets", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to store custom presets in localStorage", e);
      }
      return next;
    });
  };

  const handleClearHistory = () => {
    saveHistory([]);
    showToast("Activity logs directory cleared");
  };

  const handleRemoveHistoryItem = (id: string) => {
    saveHistory(prev => prev.filter(item => item.id !== id));
    showToast("Session log removed");
  };

  const handleThemeChange = (selected: AppThemeConfig) => {
    playTap();
    setTheme(selected);
    try {
      localStorage.setItem("timing_active_theme", selected.id);
    } catch (e) {
      // Ignored
    }
  };

  const handleToggleSound = () => {
    playTap();
    const nextVal = !isSoundEnabled;
    setIsSoundEnabled(nextVal);
    try {
      localStorage.setItem("timing_sound_enabled", nextVal.toString());
    } catch (e) {}
  };

  const handleToggleMode = () => {
    playTap();
    const nextVal = !isDarkMode;
    setIsDarkMode(nextVal);
    try {
      localStorage.setItem("timing_ui_mode", nextVal ? "dark" : "light");
    } catch (e) {}
  };

  const handleStopwatchComplete = (durationMs: number, lapCount: number) => {
    const item: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: "stopwatch",
      label: "Stopwatch Interval",
      duration: durationMs,
      timestamp: Date.now(),
      details: lapCount > 0 ? `${lapCount} recorded laps` : "No laps split",
    };
    saveHistory(prev => [item, ...prev]);
    showToast("Stopwatch timing logged successfully!");
  };

  const handleTimerComplete = (durationMs: number, label: string) => {
    const item: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: "timer",
      label: label || "Countdown Timer",
      duration: durationMs,
      timestamp: Date.now(),
      details: "Timer finished successfully",
    };
    saveHistory(prev => [item, ...prev]);
    showToast("Timer focus session completed & logged!");
  };

  // Create custom preset item State actions
  const handleCreateCustomPreset = (e: React.FormEvent) => {
    e.preventDefault();
    playTap();
    if (newPresetH === 0 && newPresetM === 0 && newPresetS === 0) return;
    
    const label = newPresetLabel.trim() || `My ${newPresetH ? newPresetH+"h " : ""}${newPresetM}m Preset`;
    const newPreset: TimerPreset = {
      id: Math.random().toString(36).substring(2, 9),
      label,
      hours: newPresetH,
      minutes: newPresetM,
      seconds: newPresetS,
      category: "custom",
    };

    saveCustomPresets(prev => [newPreset, ...prev]);
    showToast("Custom preset saved!");
    setNewPresetLabel("");
    setNewPresetH(0);
    setNewPresetM(25);
    setNewPresetS(0);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playTap();
    saveCustomPresets(prev => prev.filter(p => p.id !== id));
    showToast("Preset removed");
  };

  const handleApplyPreset = (preset: TimerPreset) => {
    playTap();
    setActivePreset(preset);
    setActiveTab("timer"); // Switch context to Timer tab instantly for premium flow
    
    // Auto-collapse sidebars on small screens to give full focus to active timer
    if (window.innerWidth < 1024) {
      setIsLeftSidebarOpen(false);
    }
  };

  // Stats calculation
  const totalTrackedMs = history.reduce((acc, curr) => acc + curr.duration, 0);
  const stopwatchCount = history.filter(h => h.type === "stopwatch").length;
  const timerCount = history.filter(h => h.type === "timer").length;

  const formatTotalTime = (ms: number) => {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60) % 60;
    const hours = Math.floor(secs / 3600);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    if (mins > 0) {
      return `${mins}m ${secs % 60}s`;
    }
    return `${secs}s`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "work": return <BookOpen size={13} className="text-amber-400" />;
      case "break": return <Sparkles size={13} className="text-teal-400" />;
      case "fitness": return <Dumbbell size={13} className="text-rose-400" />;
      default: return <Clock size={13} className="text-cyan-400" />;
    }
  };

  return (
    <div id="workspace-root" className={`h-screen max-h-screen w-screen overflow-hidden flex flex-col relative select-none selection:bg-zinc-800 selection:text-white transition-colors duration-500 ${
      isDarkMode ? "bg-[#07080a] text-zinc-100" : "bg-[#f8fafc] text-slate-800"
    }`}>
      
      {/* Background ambient decorative blurs centered dynamically */}
      <div className={`absolute top-0 left-0 w-full h-80 pointer-events-none ${
        isDarkMode ? "bg-radial-gradient from-zinc-900/30 via-transparent to-transparent" : "bg-radial-gradient from-slate-200/40 via-transparent to-transparent"
      }`} />
      <div 
        className="absolute top-[-250px] left-[15%] w-[550px] h-[550px] rounded-full blur-[150px] pointer-events-none transition-all duration-1000"
        style={{ 
          backgroundColor: theme.accentColor,
          opacity: isDarkMode ? 0.05 : 0.08
        }}
      />
      <div 
        className="absolute bottom-[-150px] right-[15%] w-[400px] h-[400px] rounded-full blur-[130px] pointer-events-none transition-all duration-1000"
        style={{ 
          backgroundColor: theme.accentColor,
          opacity: isDarkMode ? 0.03 : 0.05
        }}
      />

      {/* Top Header Navigation Control Bar */}
      <header id="studio-header" className={`h-16 flex-shrink-0 flex items-center justify-between px-6 border-b transition-colors duration-500 ${
        isDarkMode 
          ? "bg-[#07080a]/90 border-zinc-900/60 text-zinc-100 z-30 select-none backdrop-blur-md" 
          : "bg-white/95 border-slate-205 shadow-sm text-slate-800 z-30 select-none backdrop-blur-md"
      }`}>
        
        {/* Logo / Branding */}
        <div className="flex items-center gap-2.5">
          <div 
            className={`p-1.5 rounded-xl border flex items-center justify-center transition-all duration-500 ${
              isDarkMode ? "bg-[#0a0c10] text-zinc-100" : "bg-slate-50 text-slate-900 border-slate-200"
            }`}
            style={{ borderColor: isDarkMode ? `${theme.accentColor}25` : `${theme.accentColor}35` }}
          >
            <Clock className="w-5 h-5 animate-spin-slow" style={{ color: theme.accentColor }} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-base font-extrabold tracking-tight transition-colors duration-500 ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}>Chronos</span>
            <span className={`font-light text-xs tracking-wider ${
              isDarkMode ? "text-zinc-650" : "text-slate-400"
            }`}>/ STUDIO</span>
          </div>
        </div>

        {/* Dynamic Studio Core Control Center Buttons */}
        <div className="flex items-center gap-2.5">
          
          {/* Toggle LEFT (Presets) Panel Control */}
          <button
            id="presets-sidebar-toggle"
            onClick={() => { playTap(); setIsLeftSidebarOpen(!isLeftSidebarOpen); }}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
              isLeftSidebarOpen 
                ? isDarkMode ? "bg-zinc-900 text-white shadow-sm" : "bg-slate-100 border border-slate-250 text-slate-900 shadow-sm"
                : isDarkMode ? "bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30" : "bg-transparent text-slate-500 hover:text-slate-805 hover:bg-slate-105"
            }`}
            title="Toggle Presets Drawer"
          >
            <Bookmark size={13} style={{ color: isLeftSidebarOpen ? theme.accentColor : undefined }} />
            <span className="hidden md:inline">Presets</span>
            <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
              isLeftSidebarOpen 
                ? isDarkMode ? "bg-zinc-950/80 text-zinc-400" : "bg-slate-200 text-slate-600" 
                : isDarkMode ? "bg-zinc-900/60 text-zinc-500" : "bg-slate-101 text-slate-400"
            }`}>
              {DEFAULT_PRESETS.length + customPresets.length}
            </span>
          </button>

          {/* Toggle RIGHT (History Logs) Panel Control */}
          <button
            id="history-sidebar-toggle"
            onClick={() => { playTap(); setIsRightSidebarOpen(!isRightSidebarOpen); }}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
              isRightSidebarOpen 
                ? isDarkMode ? "bg-zinc-900 text-white shadow-sm" : "bg-slate-100 border border-slate-250 text-slate-900 shadow-sm"
                : isDarkMode ? "bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30" : "bg-transparent text-slate-500 hover:text-slate-805 hover:bg-slate-105"
            }`}
            title="Toggle Logs Drawer"
          >
            <TrendingUp size={13} style={{ color: isRightSidebarOpen ? theme.accentColor : undefined }} />
            <span className="hidden md:inline">History Logs</span>
            <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
              isRightSidebarOpen 
                ? isDarkMode ? "bg-zinc-950/80 text-zinc-400" : "bg-slate-200 text-slate-600" 
                : isDarkMode ? "bg-zinc-900/60 text-zinc-500" : "bg-slate-101 text-slate-400"
            }`}>
              {history.length}
            </span>
          </button>

          {/* Vertical divider */}
          <div className={`h-5 w-px ${isDarkMode ? "bg-zinc-900" : "bg-slate-205"}`} />

          {/* Sound Control Slider Indicator */}
          <button 
            id="volume-sound-toggle"
            onClick={handleToggleSound}
            className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
              isDarkMode 
                ? "text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900/30" 
                : "text-slate-450 hover:text-slate-750 hover:bg-slate-105"
            }`}
            title={isSoundEnabled ? "Mute focus timer alarms" : "Unmute clocks ticking"}
          >
            {isSoundEnabled ? <Volume2 size={13} style={{ color: theme.accentColor }} /> : <VolumeX size={13} />}
          </button>

          {/* Magic UI Theme Toggle Button with beautiful Spring morph rotation */}
          <button 
            id="theme-mode-toggle"
            onClick={handleToggleMode}
            className={`relative p-2.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden ${
              isDarkMode 
                ? "bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:text-yellow-400 hover:border-zinc-800" 
                : "bg-white border-slate-200 text-slate-500 hover:text-violet-600 hover:border-slate-300 shadow-sm"
            }`}
            title={isDarkMode ? "Switch to Soothing Light Mode" : "Switch to Deep Dark Mode"}
          >
            <div className="relative w-3.5 h-3.5 flex items-center justify-center">
              <AnimatePresence mode="wait" initial={false}>
                {isDarkMode ? (
                  <motion.div
                    key="moon"
                    initial={{ rotate: -90, scale: 0, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: 90, scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 14 }}
                    className="absolute flex items-center justify-center"
                  >
                    <Moon size={13} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sun"
                    initial={{ rotate: 90, scale: 0, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: -90, scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 14 }}
                    className="absolute flex items-center justify-center"
                  >
                    <Sun size={13} className="text-amber-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </button>

          {/* Elegant Palette Wheel Theme Picker Deck */}
          <div 
            className={`border rounded-xl p-1.5 flex items-center gap-1.5 transition-colors duration-500 ${
              isDarkMode ? "bg-[#0a0c10]/80 border-zinc-900/60" : "bg-slate-50 border-slate-200 shadow-sm"
            }`}
          >
            {THEMES.map((t) => {
              const isSelected = theme.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t)}
                  className={`relative w-4.5 h-4.5 rounded-full cursor-pointer flex items-center justify-center transition-all duration-350 hover:scale-115 active:scale-95
                    ${isSelected ? isDarkMode ? "ring-2 ring-white/50" : "ring-2 ring-slate-800/50" : "grayscale-[20%] text-transparent"}`}
                  title={t.name}
                  style={{ backgroundColor: t.accentColor }}
                >
                  {isSelected && (
                    <CheckCircle2 size={8} className={`${isDarkMode ? "text-zinc-950" : "text-white"} font-bold`} />
                  )}
                </button>
              );
            })}
          </div>

        </div>

      </header>

      {/* Main Workspace Frame Area */}
      <div id="studio-workspace" className="flex-1 flex w-full overflow-hidden relative">

        {/* Backdrop overlay for absolute drawer on Mobile when open */}
        <div
          className={`absolute inset-0 bg-black/60 z-10 lg:hidden transition-opacity duration-300 ${
            (isLeftSidebarOpen || isRightSidebarOpen) ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => {
            setIsLeftSidebarOpen(false);
            setIsRightSidebarOpen(false);
          }}
        />

        {/* LEFT COLLAPSED SIDEBAR: Focus Presets panel */}
        <AnimatePresence>
          {isLeftSidebarOpen && (
            <motion.aside
              id="presets-drawer-panel"
              initial={{ x: -290, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -290, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 210 }}
              className={`absolute lg:static inset-y-0 left-0 w-80 h-full flex flex-col flex-shrink-0 border-r backdrop-blur-xl lg:backdrop-blur-none z-20 overflow-hidden transition-colors duration-500 ${
                isDarkMode 
                  ? "bg-[#0a0c10]/95 lg:bg-[#07080a]/30 border-zinc-900/80 text-zinc-100" 
                  : "bg-white/95 lg:bg-white/30 border-slate-205/80 text-slate-800"
              }`}
            >
              <div className={`p-4 border-b flex items-center justify-between ${
                isDarkMode ? "border-zinc-900/60" : "border-slate-150"
              }`}>
                <span className={`text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 ${
                  isDarkMode ? "text-zinc-250" : "text-slate-600"
                }`}>
                  <Bookmark size={13} style={{ color: theme.accentColor }} />
                  Presets Workspace
                </span>
                <button
                  onClick={() => setIsLeftSidebarOpen(false)}
                  className={`lg:hidden p-1 rounded-md transition-all ${
                    isDarkMode 
                      ? "text-zinc-550 hover:text-zinc-350 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900" 
                      : "text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <ChevronLeft size={13} />
                </button>
              </div>

              {/* Scrollable list content */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 select-none">
                
                {/* System sets Section */}
                <div className="flex flex-col gap-1.5">
                  <span className={`text-[9px] font-bold tracking-widest uppercase pl-1 ${
                    isDarkMode ? "text-[#556070]" : "text-slate-400"
                  }`}>STOCK TIMING INTERVALS</span>
                  <div className="flex flex-col gap-1 pr-0.5">
                    {DEFAULT_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleApplyPreset(preset)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all duration-150 text-xs cursor-pointer group ${
                          isDarkMode 
                            ? "bg-zinc-950/35 border-zinc-900/70 text-zinc-300 hover:border-zinc-850 hover:bg-zinc-900/10" 
                            : "bg-white border-slate-200/50 text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-2 max-w-[70%]">
                          <span className={`p-1 rounded block ${isDarkMode ? "bg-[#07080a]" : "bg-slate-100"}`}>
                            {getCategoryIcon(preset.category)}
                          </span>
                          <span className={`font-semibold transition-colors truncate ${
                            isDarkMode ? "group-hover:text-white text-zinc-300" : "group-hover:text-slate-900 text-slate-700"
                          }`}>{preset.label}</span>
                        </div>
                        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                          isDarkMode ? "text-zinc-400 bg-zinc-900/80" : "text-slate-500 bg-slate-100"
                        }`}>
                          {preset.hours > 0 ? `${preset.hours}h ` : ""}{preset.minutes}m
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom saves List */}
                <div className={`flex flex-col gap-1.5 pt-3 border-t ${
                  isDarkMode ? "border-zinc-900/50" : "border-slate-150"
                }`}>
                  <span className={`text-[9px] font-bold tracking-widest uppercase pl-1 ${
                    isDarkMode ? "text-[#556070]" : "text-slate-400"
                  }`}>MY CUSTOM SAVES</span>
                  <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto pr-0.5">
                    {customPresets.length === 0 ? (
                      <div className={`py-4 text-center border border-dashed rounded-xl text-[10px] leading-normal ${
                        isDarkMode ? "border-zinc-900 text-zinc-650" : "border-slate-200 text-slate-400"
                      }`}>
                        No custom presets saved.
                        <br />
                        Use the form below to add sets.
                      </div>
                    ) : (
                      customPresets.map((preset) => (
                        <div
                          key={preset.id}
                          onClick={() => handleApplyPreset(preset)}
                          className={`flex items-center justify-between p-2 rounded-xl border transition-all text-xs cursor-pointer group ${
                            isDarkMode 
                              ? "bg-zinc-950/35 border-zinc-900 hover:border-zinc-850 hover:bg-zinc-900/10 text-zinc-350" 
                              : "bg-white border-slate-200/55 hover:border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-2 max-w-[70%]">
                            <span className={`p-1 rounded ${isDarkMode ? "bg-[#07080a] text-cyan-400" : "bg-slate-100 text-[#a855f7]"}`}>
                              <Clock size={12} />
                            </span>
                            <span className={`font-semibold truncate transition-colors ${
                              isDarkMode ? "group-hover:text-white" : "group-hover:text-slate-900"
                            }`}>
                              {preset.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`font-mono text-[9px] px-1 rounded ${
                              isDarkMode ? "text-zinc-450 bg-zinc-900" : "text-slate-500 bg-slate-100"
                            }`}>
                              {preset.hours > 0 ? `${preset.hours}h ` : ""}{preset.minutes}m
                            </span>
                            <button
                              onClick={(e) => handleDeletePreset(preset.id, e)}
                              className="p-1 rounded text-zinc-550 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="Delete preset"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Create Custom Preset Card Form */}
                <form 
                  onSubmit={handleCreateCustomPreset} 
                  className={`flex flex-col gap-2 pt-3 border-t mt-auto p-3 rounded-2xl border ${
                    isDarkMode 
                      ? "border-zinc-900/60 bg-[#0a0c10]/40 text-zinc-200" 
                      : "border-slate-200 bg-slate-50/50 text-slate-700 shadow-sm"
                  }`}
                >
                  <span className={`text-[9px] font-bold tracking-widest uppercase ${
                    isDarkMode ? "text-zinc-400" : "text-slate-500"
                  }`}>Save Dial Timing Preset</span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Name (e.g. Green Tea)"
                      value={newPresetLabel}
                      onChange={(e) => setNewPresetLabel(e.target.value)}
                      className={`px-2.5 py-2 rounded-xl text-[11px] focus:outline-none flex-1 font-semibold ${
                        isDarkMode 
                          ? "bg-zinc-950 border border-zinc-900 text-zinc-200 focus:border-zinc-700/65 placeholder:text-zinc-650" 
                          : "bg-white border border-slate-205 text-slate-800 focus:border-slate-350 placeholder:text-slate-400"
                      }`}
                    />
                  </div>
                  <div className={`grid grid-cols-3 gap-1.5 text-[10px] ${
                    isDarkMode ? "text-zinc-400" : "text-slate-500"
                  }`}>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase mb-0.5">HR</span>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={newPresetH}
                        onChange={(e) => setNewPresetH(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                        className={`px-2 py-1.5 rounded-lg text-center text-xs font-mono font-bold focus:outline-none ${
                          isDarkMode ? "bg-zinc-950 border border-zinc-900 text-zinc-300" : "bg-white border border-slate-205 text-slate-800"
                        }`}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase mb-0.5">MI</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={newPresetM}
                        onChange={(e) => setNewPresetM(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className={`px-2 py-1.5 rounded-lg text-center text-xs font-mono font-bold focus:outline-none ${
                          isDarkMode ? "bg-zinc-950 border border-zinc-900 text-zinc-300" : "bg-white border border-slate-205 text-slate-800"
                        }`}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase mb-0.5">SE</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={newPresetS}
                        onChange={(e) => setNewPresetS(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className={`px-2 py-1.5 rounded-lg text-center text-xs font-mono font-bold focus:outline-none ${
                          isDarkMode ? "bg-zinc-950 border border-zinc-900 text-zinc-300" : "bg-white border border-slate-205 text-slate-800"
                        }`}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={newPresetH === 0 && newPresetM === 0 && newPresetS === 0}
                    className={`mt-1.5 w-full py-2 rounded-xl font-bold transition-all text-xs cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1 border ${
                      isDarkMode 
                        ? "bg-zinc-900 hover:bg-[#12141a] text-zinc-200 border-zinc-850 hover:border-zinc-750" 
                        : "bg-[#07080a] hover:bg-zinc-900 text-white border-zinc-950 hover:border-zinc-800 shadow-sm"
                    }`}
                    title="Save custom preset configuration"
                  >
                    <Plus size={12} />
                    Add Set Preset
                  </button>
                </form>

              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* CENTER MAIN TIMER VIEW CANVAS */}
        <div id="workspace-center" className="flex-1 h-full flex flex-col justify-between items-center p-6 relative overflow-y-auto">
          
          {/* Subtle Accent Glow around layout panel */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full opacity-[0.03] pointer-events-none blur-3xl transition-all duration-1000"
            style={{ backgroundColor: theme.accentColor }}
          />

          {/* View Segment switcher bar */}
          <div className="w-full max-w-[260px]">
            <div className={`p-1.5 rounded-2xl flex items-center gap-1.5 shadow-xl w-full border ${
              isDarkMode ? "bg-[#0c0d12]/90 border-transparent" : "bg-slate-100/90 border-slate-205"
            }`}>
              
              {/* Stopwatch option button */}
              <button
                id="tab-stopwatch-trigger"
                onClick={() => { playTap(); setActiveTab("stopwatch"); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer
                  ${activeTab === "stopwatch"
                    ? isDarkMode 
                      ? "bg-zinc-900 text-white shadow-md font-semibold" 
                      : "bg-white text-slate-900 border border-slate-200 shadow-sm font-semibold"
                    : isDarkMode 
                      ? "text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900/20" 
                      : "text-slate-450 hover:text-slate-700 hover:bg-slate-200/50"}`}
              >
                <Clock size={11} className={activeTab === "stopwatch" ? "animate-spin" : ""} style={{ animationDuration: "12s" }} />
                Stopwatch
              </button>

              {/* Timer option button */}
              <button
                id="tab-timer-trigger"
                onClick={() => { playTap(); setActiveTab("timer"); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer
                  ${activeTab === "timer"
                    ? isDarkMode 
                      ? "bg-zinc-900 text-white shadow-md font-semibold" 
                      : "bg-white text-slate-900 border border-slate-200 shadow-sm font-semibold"
                    : isDarkMode 
                      ? "text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900/20" 
                      : "text-slate-450 hover:text-slate-705 hover:bg-slate-200/50"}`}
              >
                <Timer size={11} />
                Timer
              </button>

            </div>
          </div>

          {/* Core Panel component active trigger loop */}
          <div className="w-full flex-1 flex items-center justify-center py-4">
            <AnimatePresence mode="wait">
              {activeTab === "stopwatch" ? (
                <motion.div
                  key="stopwatch"
                  initial={{ opacity: 0, scale: 0.98, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="w-full flex justify-center"
                >
                  <StopwatchView 
                    theme={theme} 
                    onSessionComplete={handleStopwatchComplete} 
                    isDarkMode={isDarkMode}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="timer"
                  initial={{ opacity: 0, scale: 0.98, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="w-full flex justify-center"
                >
                  <TimerView 
                    theme={theme} 
                    onSessionComplete={handleTimerComplete}
                    activePreset={activePreset}
                    onPresetApplied={() => setActivePreset(null)}
                    isSoundEnabled={isSoundEnabled}
                    isDarkMode={isDarkMode}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Floating interactive telemetry bar */}
          <div 
            id="telemetry-bar-banner"
            className={`flex items-center justify-center gap-7 px-5 py-3.5 border rounded-2xl backdrop-blur-md shadow-lg select-none max-w-full overflow-x-auto transition-colors duration-500 ${
              isDarkMode 
                ? "bg-zinc-950/70 border-zinc-900/80 text-zinc-400" 
                : "bg-white/90 border-slate-200 text-slate-600 shadow-md"
            }`}
            style={{ 
              boxShadow: isDarkMode 
                ? `inset 0 1px 0 0 rgba(255, 255, 255, 0.01), 0 8px 24px -10px rgba(0, 0, 0, 0.5)`
                : `none`
            }}
          >
            <div className="flex items-center gap-2 flex-shrink-0">
              <TrendingUp size={13} className="text-violet-400" />
              <span className={`text-[9px] font-extrabold uppercase tracking-wider ${isDarkMode ? "text-zinc-500" : "text-slate-400"}`}>Total Focus:</span>
              <span className={`text-xs font-bold font-mono ${isDarkMode ? "text-zinc-350" : "text-slate-800"}`}>{formatTotalTime(totalTrackedMs)}</span>
            </div>
            <div className={`h-4 w-px flex-shrink-0 ${isDarkMode ? "bg-zinc-900" : "bg-slate-200"}`} />
            <div className="flex items-center gap-2 flex-shrink-0">
              <Flame size={13} className="text-emerald-400" />
              <span className={`text-[9px] font-extrabold uppercase tracking-wider ${isDarkMode ? "text-zinc-500" : "text-slate-400"}`}>Stopwatch Laps:</span>
              <span className={`text-xs font-bold font-mono ${isDarkMode ? "text-zinc-350" : "text-slate-800"}`}>{stopwatchCount}</span>
            </div>
            <div className={`h-4 w-px flex-shrink-0 ${isDarkMode ? "bg-zinc-900" : "bg-slate-200"}`} />
            <div className="flex items-center gap-2 flex-shrink-0">
              <Target size={13} className="text-cyan-400" />
              <span className={`text-[9px] font-extrabold uppercase tracking-wider ${isDarkMode ? "text-zinc-500" : "text-slate-400"}`}>Timer Completed:</span>
              <span className={`text-xs font-bold font-mono ${isDarkMode ? "text-zinc-350" : "text-slate-800"}`}>{timerCount}</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLLAPSED SIDEBAR: History log list */}
        <AnimatePresence>
          {isRightSidebarOpen && (
            <motion.aside
              id="history-drawer-panel"
              initial={{ x: 290, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 290, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 210 }}
              className={`absolute lg:static inset-y-0 right-0 w-85 h-full flex flex-col flex-shrink-0 border-l backdrop-blur-xl lg:backdrop-blur-none z-20 overflow-hidden transition-colors duration-500 ${
                isDarkMode 
                  ? "bg-[#0a0c10]/95 lg:bg-[#07080a]/30 border-zinc-900/80 text-zinc-100" 
                  : "bg-white/95 lg:bg-white/30 border-slate-205/80 text-slate-850"
              }`}
            >
              <div className={`p-4 border-b flex items-center justify-between ${
                isDarkMode ? "border-zinc-900/60" : "border-slate-150"
              }`}>
                <span className={`text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 ${
                  isDarkMode ? "text-zinc-250" : "text-slate-600"
                }`}>
                  <TrendingUp size={13} className="text-[#a855f7]" />
                  Activity Log Panel
                </span>
                <button
                  onClick={() => setIsRightSidebarOpen(false)}
                  className={`lg:hidden p-1 rounded-md transition-all ${
                    isDarkMode 
                      ? "text-zinc-550 hover:text-zinc-350 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900" 
                      : "text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <ChevronRight size={13} />
                </button>
              </div>

              {/* Scrollable list of history item widgets */}
              <div className="flex-1 p-4 flex flex-col min-h-0 select-none">
                <HistoryLog
                  theme={theme}
                  items={history}
                  onClearHistory={handleClearHistory}
                  onRemoveItem={handleRemoveHistoryItem}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Compact brand text inside drawer footer */}
              <div className={`p-4 border-t text-center text-[9px] font-medium ${
                isDarkMode ? "border-zinc-900/60 text-zinc-650" : "border-slate-150 text-slate-400 font-bold"
              }`}>
                CHRONOS STUDIO RECORD BOARD
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Animated Toast Notification system */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl border flex items-center gap-2 z-50 shadow-lg text-xs font-semibold ${
                isDarkMode 
                  ? "bg-zinc-950/95 border-zinc-900/65 text-zinc-200" 
                  : "bg-white/95 border-slate-205 text-slate-800 shadow-slate-100"
              }`}
              style={{
                boxShadow: isDarkMode
                  ? `0 10px 25px -5px rgba(0,0,0,0.5), 0 0 10px ${theme.accentColor}10`
                  : `0 10px 25px -5px rgba(15,23,42,0.06), 0 0 10px ${theme.accentColor}15`
              }}
            >
              <div 
                className="w-1.5 h-1.5 rounded-full animate-pulse" 
                style={{ backgroundColor: theme.accentColor }} 
              />
              <span>{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
