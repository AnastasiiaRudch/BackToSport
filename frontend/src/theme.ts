// ShoulderReady — Dark-First Utility theme tokens
export const colors = {
  surface: "#0F1115",
  onSurface: "#FFFFFF",
  surfaceSecondary: "#1A1D24",
  onSurfaceSecondary: "#A0A5B5",
  surfaceTertiary: "#252A34",
  onSurfaceTertiary: "#8A8F9E",

  brand: "#ccff00",
  brandPrimary: "#ccff00",
  onBrandPrimary: "#000000",
  brandSecondary: "#b3cc00",
  brandTertiary: "#333C14",
  onBrandTertiary: "#ccff00",

  success: "#00E676",
  onSuccess: "#000000",
  warning: "#FFEA00",
  onWarning: "#000000",
  error: "#FF1744",
  onError: "#FFFFFF",
  info: "#00E5FF",
  onInfo: "#000000",

  border: "#2A2F3A",
  borderStrong: "#3A4150",
  divider: "#1F232B",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const fonts = {
  displayBold: "Rajdhani-Bold",
  displaySemi: "Rajdhani-SemiBold",
  displayMedium: "Rajdhani-Medium",
  textRegular: "IBMPlexSans-Regular",
  textMedium: "IBMPlexSans-Medium",
  textSemi: "IBMPlexSans-SemiBold",
};

export const fontAssets = {
  "Rajdhani-Bold": require("@/assets/fonts/Rajdhani-Bold.ttf"),
  "Rajdhani-SemiBold": require("@/assets/fonts/Rajdhani-SemiBold.ttf"),
  "Rajdhani-Medium": require("@/assets/fonts/Rajdhani-Medium.ttf"),
  "IBMPlexSans-Regular": require("@/assets/fonts/IBMPlexSans-Regular.ttf"),
  "IBMPlexSans-Medium": require("@/assets/fonts/IBMPlexSans-Medium.ttf"),
  "IBMPlexSans-SemiBold": require("@/assets/fonts/IBMPlexSans-SemiBold.ttf"),
};

export function zoneColor(zone?: string | null) {
  if (zone === "green") return colors.success;
  if (zone === "yellow") return colors.warning;
  if (zone === "red") return colors.error;
  return colors.onSurfaceSecondary;
}

export function zoneLabel(zone?: string | null) {
  if (zone === "green") return "Зелёная зона";
  if (zone === "yellow") return "Жёлтая зона";
  if (zone === "red") return "Красная зона";
  return "—";
}
