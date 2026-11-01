import { z } from "zod";

export const MAX_SAVE_BYTES = 64 * 1024;
export const ADMIN_MIN_CODE_LENGTH = 20;
export const ADMIN_FAILURE_LIMIT = 5;
export const ADMIN_GLOBAL_FAILURE_LIMIT = 100;
export const ADMIN_FAILURE_WINDOW_MS = 15 * 60_000;
export const RATE_RETENTION_MS = 2 * 24 * 60 * 60_000;

const forbiddenWords = new Set([
  "fuck", "fucking", "shit", "bitch", "cunt", "asshole", "motherfucker",
  "זין", "זונה", "זונות", "כוס", "כוסית", "כוסעמק", "מניאק", "מנייק", "שרמוטה",
]);

export function isSafeDisplayName(value: string): boolean {
  const normalized = value.normalize("NFKC").toLowerCase()
    .replace(/[\u0591-\u05c7\u200b-\u200f\u202a-\u202e\u2060-\u206f]/g, "");
  if (/[\x00-\x1f\x7f]/.test(normalized)) return false;
  if (/(?:https?:|www\.|mailto:|@|[a-z0-9][a-z0-9-]*\.(?:[a-z]{2,}|ישראל)(?:\b|\/))/i.test(normalized)) return false;
  if ((normalized.match(/\d/g) ?? []).length >= 7) return false;
  const words = normalized.split(/[^a-z\u05d0-\u05ea]+/).filter(Boolean);
  return !words.some((word) => forbiddenWords.has(word));
}

export const displayNameSchema = z.string().trim().min(1).max(40)
  .refine(isSafeDisplayName, "בחרו שם אחר בלי מילים פוגעניות, קישורים או מספר טלפון");

const counter = z.number().finite().int().min(0).max(Number.MAX_SAFE_INTEGER);
const text = z.string().max(200);
const date = z.string().max(20);
const strings = z.array(text).max(500);
const counters = z.record(z.string().max(64), counter);
const optionalFields = {
  onboarded: z.boolean(), onboardingStep: z.enum(["name", "auth", "test"]), guest: z.boolean(),
  userId: counter, name: z.string().max(40), icon: z.string().max(16), icons: strings,
  coins: counter, hints: counter, level: counter, streakDays: counter, lastDay: date,
  totalCorrect: counter, totalAnswered: counter, correctSinceSticker: counter,
  bestStreakCorrect: counter, currentStreakCorrect: counter, history: z.array(z.boolean()).max(200),
  stickers: z.array(z.number().int().min(0).max(499)).max(500), achievements: strings,
  seenTopics: strings, soundOn: z.boolean(), bestFlash: counter, weeklyDone: date,
  subscribed: z.boolean(), boosts: z.object({ doubleUntil: counter, premiumUntil: counter }).partial().strict(),
  chests: counter, lastChestDay: date, chestsOpened: counter,
  chestInv: z.object({ regular: counter, amazing: counter, legendary: counter }).partial().strict(),
  tickets: z.object({ shield: counter, restore: counter, luck: counter, skip: counter }).partial().strict(),
  trophies: counter, gameWins: counters, seenGames: strings, streakClaimedDay: date,
  streakShieldUntil: counter, spins: counter, lastFreeSpin: date, missionDay: date,
  dailyAnswers: counter, dailyNoMissBest: counter, dailyNoMissCur: counter, dailyClaimed: strings,
  missionMonth: date, monthlyAnswers: counter, monthlyChests: counter, monthlyClaimed: strings,
  lastLegendaryMonth: date, correctSinceRating: counter, rated: z.boolean(), country: z.string().max(4),
  albumWorlds: z.array(counter).max(500), albumTitles: strings, schemaVersion: counter,
  albumWorlds100: z.array(z.number().int().min(0).max(4)).max(5),
  topicStats: z.record(z.string().max(64), z.object({ a: counter, c: counter }).strict()),
  playSeconds: counter,
  dayLog: z.record(z.string().max(10), z.object({ a: counter, c: counter, s: counter }).strict()),
  parentCode: z.string().max(4), guestCode: z.string().max(16), guestSecret: z.string().max(64),
  monthBaseline: counters, dayBaseline: counters, opCorrect: counters,
};
const guestSaveSchema = z.object(optionalFields).partial().strict();

export function validateGuestSave(input: unknown): Record<string, unknown> {
  let encoded: string;
  try { encoded = JSON.stringify(input); } catch { throw new Error("שמירה לא תקינה"); }
  if (!encoded || new TextEncoder().encode(encoded).byteLength > MAX_SAVE_BYTES) {
    throw new Error("השמירה גדולה מדי");
  }
  const parsed = guestSaveSchema.parse(input);
  // Never persist the bearer credential inside the cloud-save JSON.
  const { guestSecret: _secret, ...save } = parsed;
  return save;
}

/** No fallback to headers a caller can supply. A missing platform header shares a conservative quota. */
export function trustedClientIp(readHeader: (name: string) => string | undefined): string {
  const value = readHeader("cf-connecting-ip")?.trim();
  if (!value || value.length > 45 || value.includes(",")) return "unknown";
  const ipv4 = value.split(".");
  if (ipv4.length === 4 && ipv4.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)) {
    return ipv4.map(Number).join(".");
  }
  // Full syntax validation uses the server runtime's isIP before quota use.
  return /^[0-9a-f:]+$/i.test(value) && value.includes(":") ? value.toLowerCase() : "unknown";
}