import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ALBUM_SIZE } from "./stickers";
import { MAX_LEVEL } from "./math";
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
  chests: number;
  lastChestDay: string;
  chestsOpened: number;
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
  chests: 1,
  lastChestDay: "",
  chestsOpened: 0,
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
  { id: "chest5", title: "פתחת 5 תיבות", emoji: "🎁" },
];

export type ChestKind = "wood" | "silver" | "gold";

export const CHESTS: Record<ChestKind, { title: string; emoji: string; price: number; desc: string }> = {
  wood: { title: "תיבת עץ", emoji: "📦", price: 50, desc: "מטבעות ורמזים" },
  silver: { title: "תיבת כסף", emoji: "🎁", price: 120, desc: "פרס גדול יותר + סיכוי למדבקה" },
  gold: { title: "תיבת זהב", emoji: "🏆", price: 250, desc: "מדבקה מובטחת + בוסט" },
};

export type ChestReward = {
  coins: number;
  hints: number;
  sticker: number | null;
  boost: "double" | "premium" | null;
  kind: ChestKind;
};

type Ctx = {
  profile: Profile;
  ready: boolean;
  update: (patch: Partial<Profile> | ((p: Profile) => Partial<Profile>)) => void;
  recordAnswer: (correct: boolean, op?: string) => { sticker: number | null; levelUp: boolean };
  addCoins: (n: number) => void;
  spendCoins: (n: number) => boolean;
  useHint: () => boolean;
  grantSticker: () => number | null;
  openChest: (kind: ChestKind, free?: boolean) => ChestReward | null;
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
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);

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
        if (parsed.lastChestDay !== today) {
          parsed.lastChestDay = today;
          parsed.chests = parsed.chests + 1;
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

  const openChest = useCallback<Ctx["openChest"]>((kind, free = false) => {
    const cfg = CHESTS[kind];
    let reward: ChestReward | null = null;
    setProfile((p) => {
      if (free ? p.chests <= 0 : p.coins < cfg.price) return p;
      const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
      const coins = kind === "wood" ? rnd(20, 70) : kind === "silver" ? rnd(60, 170) : rnd(150, 400);
      const hints = kind === "wood" ? rnd(0, 2) : kind === "silver" ? rnd(1, 4) : rnd(3, 6);
      const wantsSticker = kind === "gold" || (kind === "silver" && Math.random() < 0.5) || Math.random() < 0.2;
      const free_slots = Array.from({ length: ALBUM_SIZE }, (_, i) => i).filter(
        (i) => !p.stickers.includes(i),
      );
      const slot =
        wantsSticker && free_slots.length
          ? (free_slots[Math.floor(Math.random() * free_slots.length)] as number)
          : null;
      const boost: ChestReward["boost"] =
        kind === "gold" ? (Math.random() < 0.5 ? "premium" : "double") : kind === "silver" && Math.random() < 0.4 ? "double" : null;

      reward = { coins, hints, sticker: slot, boost, kind };

      const achievements = [...p.achievements];
      if (p.chestsOpened + 1 >= 5 && !achievements.includes("chest5")) achievements.push("chest5");

      return {
        ...p,
        coins: p.coins - (free ? 0 : cfg.price) + coins,
        hints: p.hints + hints,
        chests: free ? p.chests - 1 : p.chests,
        chestsOpened: p.chestsOpened + 1,
        stickers: slot == null ? p.stickers : [...p.stickers, slot],
        achievements,
        boosts: {
          doubleUntil:
            boost === "double" ? Math.max(Date.now(), p.boosts.doubleUntil) + 3600000 : p.boosts.doubleUntil,
          premiumUntil:
            boost === "premium" ? Math.max(Date.now(), p.boosts.premiumUntil) + 86400000 : p.boosts.premiumUntil,
        },
      };
    });
    return reward;
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
        if (last40.length === 40 && last40.filter(Boolean).length >= 30 && level < MAX_LEVEL) {
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
        const now = Date.now();
        const boosted = now < p.boosts.doubleUntil || now < p.boosts.premiumUntil;
        const gain = correct ? (boosted ? 2 : 1) : 0;

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
      openChest,
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
      openChest,
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
