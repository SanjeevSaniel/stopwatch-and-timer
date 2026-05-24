export type AppThemeId = "emerald" | "ruby" | "indigo" | "amber" | "rose" | "cyan";

export interface AppThemeConfig {
  id: AppThemeId;
  name: string;
  primary: string;      // Tailwind class e.g., "text-emerald-400"
  primaryBg: string;    // Tailwind class e.g., "bg-emerald-500/10"
  primaryBorder: string;// Tailwind class e.g., "border-emerald-500/30"
  accentColor: string;  // Hex color or specific color for gradient / canvas e.g. "#10b981"
  glowShadow: string;   // Tailwind box shadow e.g., "shadow-emerald-500/20"
  gradient: string;     // Tailwind gradient e.g., "from-emerald-500 to-teal-500"
}

export interface Lap {
  id: string;
  index: number;
  lapTime: number;      // Duration of this specific lap in ms
  overallTime: number;  // Total elapsed time in ms when recorded
}

export interface TimerPreset {
  id: string;
  label: string;
  hours: number;
  minutes: number;
  seconds: number;
  category: "work"|"break"|"fitness"|"custom";
}

export interface HistoryItem {
  id: string;
  type: "stopwatch" | "timer";
  label: string;
  duration: number;     // Elapsed duration in ms
  timestamp: number;    // UTC Timestamp
  details?: string;     // Additional info, e.g., number of laps, preset name
}
