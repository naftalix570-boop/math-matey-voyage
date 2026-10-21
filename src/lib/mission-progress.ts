import type { Mission, Profile } from "./game-state";
import { stickerForSlot } from "./stickers";

export const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function lifetimeBaseline(p: Profile): Record<string, number> {
  const b: Record<string, number> = {
    streakDays: p.streakDays,
    chests: p.chestsOpened,
    stickers: p.stickers.length,
    amazingStickers: p.stickers.filter((s) => stickerForSlot(s).rarity === "amazing").length,
    legendaryStickers: p.stickers.filter((s) => stickerForSlot(s).rarity === "legendary").length,
    coinsEarned: p.coins,
    hintsUsed: p.hints,
  };
  for (const [game, wins] of Object.entries(p.gameWins ?? {})) b[`gameWins:${game}`] = wins;
  return b;
}

export function rollMissionPeriods(p: Profile, date = new Date()): Profile {
  const day = localDate(date);
  const month = day.slice(0, 7);
  let next = p;
  if (p.missionDay !== day) {
    next = { ...next, missionDay: day, dailyAnswers: 0, dailyNoMissBest: 0,
      dailyNoMissCur: 0, dailyClaimed: [], dayBaseline: lifetimeBaseline(p) };
  }
  if (p.missionMonth !== month) {
    next = { ...next, missionMonth: month, monthlyAnswers: 0, monthlyChests: 0,
      monthlyClaimed: [], monthBaseline: lifetimeBaseline(p) };
  }
  return next;
}

export function progressOf(p: Profile, m: Mission, scope: "daily" | "monthly") {
  p = rollMissionPeriods(p);
  const base = (scope === "daily" ? p.dayBaseline : p.monthBaseline) ?? {};
  const sub = (key: string, value: number) => Math.max(0, value - (base[key] ?? 0));
  switch (m.metric) {
    case "answers": return scope === "daily" ? p.dailyAnswers : p.monthlyAnswers;
    case "nomiss": return p.dailyNoMissBest;
    case "chests": return scope === "daily" ? sub("chests", p.chestsOpened) : p.monthlyChests;
    case "streakDays": return sub("streakDays", p.streakDays);
    case "stickers": return sub("stickers", p.stickers.length);
    case "amazingStickers": return sub("amazingStickers", p.stickers.filter((s) => stickerForSlot(s).rarity === "amazing").length);
    case "legendaryStickers": return sub("legendaryStickers", p.stickers.filter((s) => stickerForSlot(s).rarity === "legendary").length);
    case "gameWins": return sub(`gameWins:${m.gameId ?? ""}`, p.gameWins[m.gameId ?? ""] ?? 0);
    case "coinsEarned": return sub("coinsEarned", p.coins);
    case "hintsUsed": return sub("hintsUsed", p.hints);
    default: return 0;
  }
}