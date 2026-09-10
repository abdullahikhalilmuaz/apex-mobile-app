export const colors = {
  gradientStart: "#0f0c29",
  gradientMid: "#302b63",
  gradientEnd: "#24243e",
  primary: "#667eea",
  primaryDark: "#764ba2",
  accent: "#a78bfa",
  pink: "#f472b6",
  white: "#ffffff",
  text: "#ffffff",
  textMuted: "rgba(255,255,255,0.7)",
  textDim: "rgba(255,255,255,0.5)",
  textFaint: "rgba(255,255,255,0.3)",
  glassBg: "rgba(255,255,255,0.08)",
  glassBorder: "rgba(255,255,255,0.15)",
  success: "#34d399",
  successBg: "rgba(52,211,153,0.2)",
  error: "#f87171",
  errorBg: "rgba(239,68,68,0.2)",
  warning: "#fbbf24",
  warningBg: "rgba(251,191,36,0.2)",
  info: "#60a5fa",
  infoBg: "rgba(96,165,250,0.2)",
};

export const gradients = {
  main: [colors.primary, colors.primaryDark] as const,
  background: [colors.gradientStart, colors.gradientMid, colors.gradientEnd] as const,
  text: [colors.primary, colors.accent] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};