import { describe, expect, it, vi, afterEach } from "vitest";
import type { Mission, Profile } from "./game-state";
import { lifetimeBaseline, localDate, progressOf, rollMissionPeriods } from "./mission-progress";

const at = new Date(2026, 9, 22, 12);
function profile(): Profile {
  return {
    missionDay: "2026-10-22", missionMonth: "2026-10", dailyAnswers: 7,
    dailyNoMissBest: 5, dailyNoMissCur: 2, dailyClaimed: ["daily"],
    monthlyAnswers: 70, monthlyChests: 3, monthlyClaimed: ["monthly"],
    streakDays: 4, chestsOpened: 8, stickers: [0, 3, 4], coins: 100, hints: 5,
    gameWins: { clouds: 10 }, dayBaseline: {}, monthBaseline: {},
  } as unknown as Profile;
}
const mission = (metric: Mission["metric"]): Mission => ({ id: "test", title: "", goal: 1, metric, gameId: "clouds", reward: {} });
afterEach(() => vi.useRealTimers());

describe("local mission periods", () => {
  it("uses the player's local calendar date, including just after midnight", () => {
    expect(localDate(new Date(2026, 9, 22, 0, 15))).toBe("2026-10-22");
  });
  it("preserves counters and claims within the same local day/month", () => {
    const p = profile();
    expect(rollMissionPeriods(p, at)).toBe(p);
  });
  it("resets only daily counters at local midnight and snapshots lifetime totals", () => {
    const p = profile();
    const next = rollMissionPeriods(p, new Date(2026, 9, 23, 0, 0));
    expect(next.missionDay).toBe("2026-10-23");
    expect([next.dailyAnswers, next.dailyNoMissBest, next.dailyNoMissCur]).toEqual([0, 0, 0]);
    expect(next.dailyClaimed).toEqual([]);
    expect(next.dayBaseline).toEqual(lifetimeBaseline(p));
    expect(next.monthlyAnswers).toBe(70);
    expect(next.monthlyClaimed).toEqual(["monthly"]);
    expect(p.dailyAnswers).toBe(7);
  });
  it("resets day and month at month rollover with new lifetime baselines", () => {
    const p = profile();
    const next = rollMissionPeriods(p, new Date(2026, 10, 1, 0, 0));
    expect(next.missionMonth).toBe("2026-11");
    expect(next.monthlyAnswers).toBe(0);
    expect(next.monthlyChests).toBe(0);
    expect(next.monthlyClaimed).toEqual([]);
    expect(next.monthBaseline).toEqual(lifetimeBaseline(p));
    expect(next.dayBaseline).toEqual(lifetimeBaseline(p));
  });
  it.each(["daily", "monthly"] as const)("counts only new lifetime progress for %s missions", (scope) => {
    vi.useFakeTimers(); vi.setSystemTime(at);
    const p = profile();
    p.dayBaseline = lifetimeBaseline(p); p.monthBaseline = lifetimeBaseline(p);
    expect(progressOf(p, mission("gameWins"), scope)).toBe(0);
    p.gameWins = { clouds: 12 };
    expect(progressOf(p, mission("gameWins"), scope)).toBe(2);
  });
  it.each(["daily", "monthly"] as const)("never returns negative lifetime progress for %s missions", (scope) => {
    vi.useFakeTimers(); vi.setSystemTime(at);
    const p = profile();
    const base = { streakDays: 20, chests: 20, stickers: 20, amazingStickers: 20,
      legendaryStickers: 20, coinsEarned: 500, hintsUsed: 20, "gameWins:clouds": 50 };
    p.dayBaseline = base; p.monthBaseline = base;
    for (const metric of ["streakDays", "stickers", "amazingStickers", "legendaryStickers", "coinsEarned", "hintsUsed", "gameWins"] as const) {
      expect(progressOf(p, mission(metric), scope)).toBe(0);
    }
    expect(progressOf(p, mission("chests"), "daily")).toBe(0);
  });
});