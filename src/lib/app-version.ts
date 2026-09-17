/**
 * גרסת האפליקציה ויכולות (feature flags).
 * כאן מרכזים את מספר הגרסה ואת ההדלקה/כיבוי של פיצ'רים עתידיים,
 * כדי שאפשר יהיה להוסיף תשלומים/פרסומות/תוכן בלי לשכתב את האפליקציה.
 */

export const APP_VERSION = "1.0.0";

/** גרסת מבנה נתוני המשתמש. מעלים ב-1 רק כשמוסיפים שדות — לעולם לא מוחקים שדות. */
export const PROFILE_SCHEMA_VERSION = 1;

export const FEATURES = {
  /** רכישות בתוך האפליקציה — יידלק בגרסה עתידית */
  payments: false,
  /** פרסומות — יידלק בגרסה עתידית */
  ads: false,
  /** מנויים — יידלק בגרסה עתידית */
  subscriptions: false,
  /** גיבוי וייצוא של ההתקדמות */
  backup: true,
  /** לוח מובילים עולמי וארצי */
  leaderboard: true,
  /** מסך ניהול */
  admin: true,
} as const;

export type FeatureName = keyof typeof FEATURES;

export const isEnabled = (name: FeatureName) => FEATURES[name];
