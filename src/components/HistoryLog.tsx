import React from "react";
import { History, Trash2, Calendar, Trophy as TrophyIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { HistoryItem, AppThemeConfig } from "../types";
import { playTap } from "../utils/audio";

interface HistoryLogProps {
  theme: AppThemeConfig;
  items: HistoryItem[];
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
  isDarkMode?: boolean;
}

export default function HistoryLog({ theme, items, onClearHistory, onRemoveItem, isDarkMode = true }: HistoryLogProps) {
  
  const formatDurationReadable = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const totalSecs = Math.floor(ms / 1000);
    const s = totalSecs % 60;
    const m = Math.floor(totalSecs / 60) % 65;
    const h = Math.floor(totalSecs / 3600);

    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);

    return parts.join(" ");
  };

  const getRelativeTimeString = (timestamp: number) => {
    const parsedDate = new Date(timestamp);
    const now = new Date();
    
    // Check if today
    if (parsedDate.toDateString() === now.toDateString()) {
      return `Today at ${parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Check if yesterday
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (parsedDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    return parsedDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + " at " + parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      id="history-container" 
      className={`w-full h-full flex flex-col border rounded-3xl backdrop-blur-md overflow-hidden transition-all duration-300 ${
        isDarkMode 
          ? "bg-[#0a0c10]/40 shadow-xl" 
          : "bg-white/85 shadow-md"
      }`}
      style={{ 
        borderColor: isDarkMode ? `${theme.accentColor}20` : `${theme.accentColor}35`,
        boxShadow: isDarkMode 
          ? `0 10px 30px -10px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.02), 0 0 25px ${theme.accentColor}04`
          : `0 8px 20px -6px rgba(15, 23, 42, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.8), 0 0 15px ${theme.accentColor}08`
      }}
    >
      {/* Header section - static layout */}
      <div 
        className={`flex items-center justify-between p-4.5 border-b select-none transition-colors duration-300 ${
          isDarkMode 
            ? "border-zinc-900/60 bg-zinc-950/20" 
            : "border-slate-150 bg-slate-50/50"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div 
            className={`p-1.5 border rounded-lg flex items-center justify-center transition-all duration-300 ${
              isDarkMode ? "bg-zinc-950 border-zinc-900/60" : "bg-white border-slate-200 shadow-sm"
            }`}
            style={{ borderColor: isDarkMode ? `${theme.accentColor}15` : `${theme.accentColor}25` }}
          >
            <History size={14} style={{ color: theme.accentColor }} />
          </div>
          <div>
            <h3 className={`text-xs font-bold flex items-center gap-1.5 transition-colors duration-300 ${
              isDarkMode ? "text-zinc-200" : "text-slate-800"
            }`}>
              Logs Directory
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold transition-colors ${
                isDarkMode ? "bg-zinc-900/90 text-zinc-500" : "bg-slate-200/80 text-slate-500"
              }`}>
                {items.length}
              </span>
            </h3>
            <p className={`text-[9px] font-medium transition-colors ${
              isDarkMode ? "text-zinc-500" : "text-slate-450"
            }`}>Recorded stopwatch & timer intervals</p>
          </div>
        </div>
        
        {items.length > 0 && (
          <button
            id="btn-clear-history"
            onClick={() => { playTap(); onClearHistory(); }}
            className={`text-[9px] font-extrabold tracking-wider uppercase transition-all flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer border ${
              isDarkMode
                ? "text-zinc-500 hover:text-red-400 hover:bg-zinc-900 border-transparent hover:border-zinc-800/60"
                : "text-slate-500 hover:text-red-600 hover:bg-red-50/50 border-transparent hover:border-red-100"
            }`}
          >
            <Trash2 size={10} />
            Reset Log
          </button>
        )}
      </div>

      {/* Full-panel timing metrics listing with independent y-scroll */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0 bg-transparent">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 flex flex-col items-center justify-center py-12 text-center gap-2 select-none"
            >
              <TrophyIcon size={24} className={isDarkMode ? "stroke-zinc-800 opacity-60" : "stroke-slate-300 opacity-80"} />
              <span className={`text-xs font-semibold ${isDarkMode ? "text-zinc-500" : "text-slate-550"}`}>Workspace Logs Empty</span>
              <span className={`text-[10px] max-w-[200px] leading-relaxed ${isDarkMode ? "text-zinc-650" : "text-slate-400"}`}>
                Complete timers or stamp stopwatch splits to instantly log active metrics into this panel.
              </span>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-1.5 w-full">
              {items.map((item, index) => {
                const isStopwatch = item.type === "stopwatch";
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index * 0.015, 0.15) } }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-205 text-xs group ${
                      isDarkMode 
                        ? "bg-zinc-950/45 text-zinc-100 hover:bg-zinc-950 hover:border-zinc-850" 
                        : "bg-white text-slate-800 hover:bg-slate-50/80 hover:border-slate-300 shadow-sm"
                    }`}
                    style={{ borderColor: isDarkMode ? "rgba(24, 24, 27, 0.4)" : "rgba(226, 232, 240, 0.8)" }}
                  >
                    <div className="flex items-center gap-2 max-w-[65%] min-w-0">
                      <div className="relative flex-shrink-0">
                        <span className={`block h-1.5 w-1.5 rounded-full ${isStopwatch ? "bg-emerald-400" : "bg-cyan-400"}`} />
                        <span className={`absolute inset-0 inline-flex h-full w-full rounded-full opacity-40 animate-ping ${isStopwatch ? "bg-emerald-500" : "bg-cyan-500"}`} style={{ animationDuration: "3.5s" }} />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className={`font-semibold truncate text-[11px] transition-colors duration-300 ${
                          isDarkMode ? "text-zinc-300" : "text-slate-705"
                        }`} title={item.label}>
                          {item.label}
                        </span>
                        <span className={`text-[9px] flex items-center gap-1 mt-0.5 transition-colors duration-300 ${
                          isDarkMode ? "text-zinc-550" : "text-slate-400"
                        }`}>
                          <Calendar size={8} />
                          {getRelativeTimeString(item.timestamp)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right font-mono font-tabular flex-shrink-0">
                      <span 
                        className={`font-bold tracking-tight text-[10px] px-2 py-1 rounded-lg border transition-all ${
                          isDarkMode 
                            ? "text-zinc-200 bg-zinc-900/95 border-zinc-950/80" 
                            : "text-slate-700 bg-slate-50 border-slate-200"
                        }`}
                      >
                        {formatDurationReadable(item.duration)}
                      </span>
                      <button
                        onClick={() => { playTap(); onRemoveItem(item.id); }}
                        className={`p-1 rounded transition-all opacity-0 group-hover:opacity-100 cursor-pointer ${
                          isDarkMode 
                            ? "text-zinc-650 hover:text-red-400 hover:bg-red-500/10" 
                            : "text-slate-400 hover:text-red-500 hover:bg-red-50"
                        }`}
                        title="Delete record"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
