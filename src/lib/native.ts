// עזרי Capacitor — בטוחים לשימוש גם בדפדפן וגם ב-SSR.

export const NATIVE_APP_SCHEME = "mathjourney";
export const SITE_URL = "https://math-matey-voyage.lovable.app";

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export function nativePlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined") return "web";
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  const platform = cap?.getPlatform?.() ?? "web";
  return platform === "ios" || platform === "android" ? platform : "web";
}
