/**
 * עזרי שמירה בטוחה של נתוני המשתמש ומיזוג התקדמות אורח לחשבון.
 * אף פונקציה כאן לא מוחקת שדות קיימים — רק משלימה ומאחדת.
 */
import type { Profile } from "./game-state";
import { PROFILE_SCHEMA_VERSION } from "./app-version";

/** האם לפרופיל יש התקדמות אמיתית ששווה לשמור */
export function hasProgress(p: Partial<Profile> | null | undefined): boolean {
  if (!p) return false;
  return (
    (p.totalAnswered ?? 0) > 0 ||
    (p.trophies ?? 0) > 0 ||
    (p.coins ?? 0) > 0 ||
    (p.stickers?.length ?? 0) > 0 ||
    (p.level ?? 1) > 1
  );
}

const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));
const maxNum = (a: unknown, b: unknown) =>
  Math.max(typeof a === "number" ? a : 0, typeof b === "number" ? b : 0);

/**
 * מיזוג שתי גרסאות של פרופיל — לכל שדה נשמר הערך ה"עשיר" יותר.
 * `base` הוא פרופיל הבסיס (החשבון), `extra` נתונים נוספים שמצטרפים אליו (האורח).
 */
export function mergeProfiles(base: Profile, extra: Partial<Profile>): Profile {
  const merged: Profile = { ...base, ...({} as Partial<Profile>) };

  merged.coins = maxNum(base.coins, extra.coins);
  merged.hints = maxNum(base.hints, extra.hints);
  merged.level = Math.max(1, maxNum(base.level, extra.level));
  merged.trophies = maxNum(base.trophies, extra.trophies);
  merged.totalCorrect = maxNum(base.totalCorrect, extra.totalCorrect);
  merged.totalAnswered = maxNum(base.totalAnswered, extra.totalAnswered);
  merged.bestStreakCorrect = maxNum(base.bestStreakCorrect, extra.bestStreakCorrect);
  merged.streakDays = maxNum(base.streakDays, extra.streakDays);
  merged.bestFlash = maxNum(base.bestFlash, extra.bestFlash);
  merged.chestsOpened = maxNum(base.chestsOpened, extra.chestsOpened);
  merged.spins = maxNum(base.spins, extra.spins);
  merged.chests = Math.min(1, maxNum(base.chests, extra.chests));

  merged.stickers = uniq([...(base.stickers ?? []), ...(extra.stickers ?? [])]);
  merged.icons = uniq([...(base.icons ?? []), ...(extra.icons ?? [])]);
  merged.achievements = uniq([...(base.achievements ?? []), ...(extra.achievements ?? [])]);
  merged.seenTopics = uniq([...(base.seenTopics ?? []), ...(extra.seenTopics ?? [])]);
  merged.seenGames = uniq([...(base.seenGames ?? []), ...(extra.seenGames ?? [])]);
  merged.albumWorlds100 = uniq([...(base.albumWorlds100 ?? []), ...(extra.albumWorlds100 ?? [])]);
  merged.albumWorlds = uniq([...(base.albumWorlds ?? []), ...(extra.albumWorlds ?? [])]);
  merged.albumTitles = uniq([...(base.albumTitles ?? []), ...(extra.albumTitles ?? [])]);

  merged.tickets = { ...base.tickets };
  for (const key of Object.keys(merged.tickets) as (keyof Profile["tickets"])[]) {
    merged.tickets[key] = maxNum(base.tickets?.[key], extra.tickets?.[key]);
  }
  merged.chestInv = { ...base.chestInv };
  for (const key of Object.keys(merged.chestInv) as (keyof Profile["chestInv"])[]) {
    merged.chestInv[key] = maxNum(base.chestInv?.[key], extra.chestInv?.[key]);
  }
  merged.gameWins = { ...(base.gameWins ?? {}) };
  for (const [game, wins] of Object.entries(extra.gameWins ?? {})) {
    merged.gameWins[game] = maxNum(merged.gameWins[game], wins);
  }
  merged.boosts = {
    doubleUntil: maxNum(base.boosts?.doubleUntil, extra.boosts?.doubleUntil),
    premiumUntil: maxNum(base.boosts?.premiumUntil, extra.boosts?.premiumUntil),
  };

  merged.onboarded = base.onboarded || Boolean(extra.onboarded);
  const steps: Profile["onboardingStep"][] = ["name", "auth", "test"];
  const baseStep = base.onboardingStep ?? "name";
  const extraStep = extra.onboardingStep ?? "name";
  merged.onboardingStep =
    steps.indexOf(extraStep) > steps.indexOf(baseStep) ? extraStep : baseStep;
  merged.schemaVersion = PROFILE_SCHEMA_VERSION;
  return merged;
}

