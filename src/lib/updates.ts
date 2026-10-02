/**
 * ניהול גרסאות ועדכונים.
 * לשחרור גרסה: מעדכנים CURRENT_VERSION. כדי להודיע על גרסה חדשה בחנות: מעדכנים LATEST_VERSION ו-RELEASE_NOTES.
 */
export const CURRENT_VERSION = "1.32";
export const LATEST_VERSION = "1.32";
export const RELEASE_NOTES = ["✨ תכונה חדשה", "🐛 תיקוני תקלות", "⚡ שיפורי ביצועים"];
export const PLAY_PACKAGE = "com.mathjourney.app";
export const PLAY_URL = `https://play.google.com/store/apps/details?id=${PLAY_PACKAGE}`;
export const CONTACT_EMAIL = "feedback@math-journey.app";

const SEEN_KEY = "mj:update-seen";

const num = (v: string) => v.split(".").map(Number);
export function isNewer(a: string, b: string) {
  const x = num(a), y = num(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0);
  }
  return false;
}
export const hasUpdate = () => isNewer(LATEST_VERSION, CURRENT_VERSION);
export function showUpdateDot() {
  if (!hasUpdate()) return false;
  try {
    return localStorage.getItem(SEEN_KEY) !== LATEST_VERSION;
  } catch {
    return true;
  }
}
export function markUpdateSeen() {
  try {
    localStorage.setItem(SEEN_KEY, LATEST_VERSION);
  } catch {
    /* ignore */
  }
}
