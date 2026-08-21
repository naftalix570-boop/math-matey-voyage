import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ALBUM_SIZE } from "./stickers";
import { playSound } from "./sfx";

export type Boosts = {
  /** epoch ms until which coins are doubled */
  doubleUntil: number;
  /** epoch ms until which premium is active */
  premiumUntil: number;
};

export type Profile = {
  onboarded: boolean;
  name: string;
  coins: number;
  hints: number;
  level: number;
  streakDays: number;
  lastDay: string;
  totalCorrect: number;
  totalAnswered: number;
  correctSinceSticker: number;
  bestStreakCorrect: number;
  currentStreakCorrect: number;
  history: boolean[];
  stickers: number[];
  achievements: string[];
  seenTopics: string[];
  soundOn: boolean;
  bestFlash: number;
  weeklyDone: string;
  subscribed: boolean;
  boosts: Boosts;
};

const KEY = "math-journey-v1";

const todayKey = () => new Date().toISOString().slice(0, 10);

const defaultProfile: Profile = {
  onboarded: false,
  name: "אלוף/ה",
  coins: 120,
  hints: 3,
  level: 1,
  streakDays: 1,
  lastDay: todayKey(),
  totalCorrect: 0,
  totalAnswered: 0,
  correctSinceSticker: 0,
  bestStreakCorrect: 0,
  currentStreakCorrect: 0,
  history: [],
  stickers: [],
  achievements: [],
  seenTopics: [],
  soundOn: true,
  bestFlash: 0,
  weeklyDone: "",
  subscribed: false,
  boosts: { doubleUntil: 0, premiumUntil: 0 },
};

export type Achievement = { id: string; title: string; emoji: string };

export const ACHIEVEMENTS: Achievement[] = [
  { id: "ex100", title: "100 תרגילים", emoji: "💯" },
  { id: "days7", title: "7 ימים רצוף", emoji: "🔥" },
  { id: "row10", title: "10 נכון ברצף", emoji: "🎯" },
  { id: "lvl5", title: "5 רמות", emoji: "🚀" },
  { id: "mulmaster", title: "מומחה לכפל", emoji: "✖️" },
  { id: "divmaster", title: "מומחה לחילוק", emoji: "➗" },
  { id: "st10", title: "10 מדבקות", emoji: "🏅" },
  { id: "flash", title: "סיים אתגר בזק", emoji: "⚡" },
];

type Ctx = {
  profile: Profile;
  ready: boolean;
  update: (patch: Partial<Profile> | ((p: Profile) => Partial<Profile>)) => void;
  recordAnswer: (correct: boolean, op?: string) => { sticker: number | null; levelUp: boolean };
  addCoins: (n: number) => void;
  spendCoins: (n: number) => boolean;
  useHint: () => boolean;
  grantSticker: () => number | null;
  unlockAchievement: (id: string) => void;
  sound: (kind: Parameters<typeof playSound>[0]) => void;
  reset: () => void;
  premium: boolean;
  doubling: boolean;
};

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [ready, setReady] = useState(false);
  const opStats = useRef<Record<string, number>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = { ...defaultProfile, ...(JSON.parse(raw) as Partial<Profile>) };
        const today = todayKey();
        if (parsed.lastDay !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          parsed.streakDays = parsed.lastDay === yesterday ? parsed.streakDays + 1 : 1;
          parsed.lastDay = today;
        }
        setProfile(parsed);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(profile));
    } catch {
      /* storage full */
    }
  }, [profile, ready]);

  const update: Ctx["update"] = useCallback((patch) => {
    setProfile((p) => ({ ...p, ...(typeof patch === "function" ? patch(p) : patch) }));
  }, []);

  const sound = useCallback(
    (kind: Parameters<typeof playSound>[0]) => playSound(kind, profile.soundOn),
    [profile.soundOn],
  );

  const grantSticker = useCallback((): number | null => {
    let granted: number | null = null;
    setProfile((p) => {
      const free = Array.from({ length: ALBUM_SIZE }, (_, i) => i).filter(
        (i) => !p.stickers.includes(i),
      );
      if (!free.length) return p;
      const slot = free[Math.floor(Math.random() * free.length)] as number;
      granted = slot;
      return { ...p, stickers: [...p.stickers, slot] };
    });
    return granted;
  }, []);

  const unlockAchievement = useCallback((id: string) => {
    setProfile((p) =>
      p.achievements.includes(id)
        ? p
        : { ...p, achievements: [...p.achievements, id], coins: p.coins + 3 },
    );
  }, []);

  const recordAnswer = useCallback<Ctx["recordAnswer"]>(
    (correct, op) => {
      if (op && correct) opStats.current[op] = (opStats.current[op] ?? 0) + 1;
      let sticker: number | null = null;
      let levelUp = false;

      setProfile((p) => {
        const history = [...p.history, correct].slice(-40);
        let level = p.level;
        const last40 = history.slice(-40);
        const last20 = history.slice(-20);
        if (last40.length === 40 && last40.filter(Boolean).length >= 30 && level < 10) {
          level += 1;
          levelUp = true;
        } else if (last20.length === 20 && last20.filter((x) => !x).length >= 15 && level > 1) {
          level -= 1;
        }
        const currentStreakCorrect = correct ? p.currentStreakCorrect + 1 : 0;
        const totalCorrect = p.totalCorrect + (correct ? 1 : 0);
        let correctSinceSticker = p.correctSinceSticker + (correct ? 1 : 0);
        let stickers = p.stickers;
        if (correctSinceSticker >= 30) {
          correctSinceSticker -= 30;
          const free = Array.from({ length: ALBUM_SIZE }, (_, i) => i).filter(
            (i) => !stickers.includes(i),
          );
          if (free.length) {
            const slot = free[Math.floor(Math.random() * free.length)] as number;
            sticker = slot;
            stickers = [...stickers, slot];
          }
        }
        const achievements = [...p.achievements];
        const add = (id: string) => {
          if (!achievements.includes(id)) achievements.push(id);
        };
        if (p.totalAnswered + 1 >= 100) add("ex100");
        if (p.streakDays >= 7) add("days7");
        if (currentStreakCorrect >= 10) add("row10");
        if (level >= 5) add("lvl5");
        if ((opStats.current["mul"] ?? 0) >= 30) add("mulmaster");
        if ((opStats.current["div"] ?? 0) >= 30) add("divmaster");
        if (stickers.length >= 10) add("st10");

        const coinsFromAch = (achievements.length - p.achievements.length) * 3;
        const gain = correct ? (Date.now() < p.boosts.doubleUntil ? 2 : 1) : 0;

        return {
          ...p,
          history,
          level,
          currentStreakCorrect,
          bestStreakCorrect: Math.max(p.bestStreakCorrect, currentStreakCorrect),
          totalCorrect,
          totalAnswered: p.totalAnswered + 1,
          correctSinceSticker,
          stickers,
          achievements,
          coins: p.coins + gain + coinsFromAch,
        };
      });
      return { sticker, levelUp };
    },
    [],
  );

  const addCoins = useCallback((n: number) => {
    setProfile((p) => ({ ...p, coins: p.coins + n }));
  }, []);

  const spendCoins = useCallback(
    (n: number) => {
      if (profile.coins < n) return false;
      setProfile((p) => ({ ...p, coins: Math.max(0, p.coins - n) }));
      return true;
    },
    [profile.coins],
  );

  const useHint = useCallback(() => {
    if (Date.now() < profile.boosts.premiumUntil) return true;
    if (profile.hints <= 0) return false;
    setProfile((p) => ({ ...p, hints: Math.max(0, p.hints - 1) }));
    return true;
  }, [profile.hints, profile.boosts.premiumUntil]);

  const reset = useCallback(() => {
    setProfile({ ...defaultProfile, lastDay: todayKey() });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      profile,
      ready,
      update,
      recordAnswer,
      addCoins,
      spendCoins,
      useHint,
      grantSticker,
      unlockAchievement,
      sound,
      reset,
      premium: Date.now() < profile.boosts.premiumUntil,
      doubling: Date.now() < profile.boosts.doubleUntil,
    }),
    [
      profile,
      ready,
      update,
      recordAnswer,
      addCoins,
      spendCoins,
      useHint,
      grantSticker,
      unlockAchievement,
      sound,
      reset,
    ],
  );

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export function useGame() {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
