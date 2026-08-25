import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ALBUM_SIZE, stickerForSlot, type Rarity } from "./stickers";
import { MAX_LEVEL } from "./math";
import { playSound } from "./sfx";

export type Boosts = {
  /** epoch ms until which coins are doubled */
  doubleUntil: number;
  /** epoch ms until which premium is active */
  premiumUntil: number;
};

export type TicketId = "shield" | "restore" | "luck" | "skip";

export type Tickets = Record<TicketId, number>;

export const TICKETS: Record<
  TicketId,
  { title: string; emoji: string; rarity: Rarity; price: number | null; desc: string }
> = {
  shield: {
    title: "מגן רצף",
    emoji: "🛡️",
    rarity: "poor",
    price: 150,
    desc: "מוסיף 24 שעות הגנה על הרצף",
  },
  restore: {
    title: "שובר רצף",
    emoji: "🔁",
    rarity: "good",
    price: 400,
    desc: "משחזר רצף שנשבר",
  },
  luck: {
    title: "מזל",
    emoji: "🍀",
    rarity: "epic",
    price: null,
    desc: "מכפיל סיכויים למדבקות נדירות (לא נמכר)",
  },
  skip: {
    title: "דילוג על שלב",
    emoji: "⏭️",
    rarity: "good",
    price: null,
    desc: "דילוג על שלב קשה (לא נמכר)",
  },
};

export const ICONS = [
  { id: "star", emoji: "⭐", rarity: "poor" as Rarity },
  { id: "cat", emoji: "🐱", rarity: "poor" as Rarity },
  { id: "ball", emoji: "⚽", rarity: "poor" as Rarity },
  { id: "robot", emoji: "🤖", rarity: "common" as Rarity },
  { id: "rocket", emoji: "🚀", rarity: "common" as Rarity },
  { id: "ninja", emoji: "🥷", rarity: "good" as Rarity },
  { id: "unicorn", emoji: "🦄", rarity: "good" as Rarity },
  { id: "dragon", emoji: "🐉", rarity: "epic" as Rarity },
  { id: "crown", emoji: "👑", rarity: "epic" as Rarity },
  { id: "alien", emoji: "👽", rarity: "epic" as Rarity },
];

export type Profile = {
  onboarded: boolean;
  guest: boolean;
  userId: number;
  name: string;
  icon: string;
  icons: string[];
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
  tickets: Tickets;
  /** streak */
  streakClaimedDay: string;
  streakShieldUntil: number;
  /** lucky wheel */
  spins: number;
  lastFreeSpin: string;
  /** missions */
  missionDay: string;
  dailyAnswers: number;
  dailyNoMissBest: number;
  dailyNoMissCur: number;
  dailyClaimed: string[];
  missionMonth: string;
  monthlyAnswers: number;
  monthlyChests: number;
  monthlyClaimed: string[];
  lastLegendaryMonth: string;
  /** rating */
  correctSinceRating: number;
  rated: boolean;
};

const KEY = "math-journey-v1";

const todayKey = () => new Date().toISOString().slice(0, 10);
const monthKey = () => new Date().toISOString().slice(0, 7);

const defaultProfile: Profile = {
  onboarded: false,
  guest: false,
  userId: 3,
  name: "אלוף/ה",
  icon: "⭐",
  icons: ["⭐"],
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
  tickets: { shield: 0, restore: 0, luck: 0, skip: 0 },
  streakClaimedDay: "",
  streakShieldUntil: 0,
  spins: 0,
  lastFreeSpin: "",
  missionDay: todayKey(),
  dailyAnswers: 0,
  dailyNoMissBest: 0,
  dailyNoMissCur: 0,
  dailyClaimed: [],
  missionMonth: monthKey(),
  monthlyAnswers: 0,
  monthlyChests: 0,
  monthlyClaimed: [],
  lastLegendaryMonth: "",
  correctSinceRating: 0,
  rated: false,
};

export type Achievement = { id: string; title: string; emoji: string };

export const ACHIEVEMENTS: Achievement[] = [
  { id: "ex100", title: "100 תרגילים", emoji: "💯" },
  { id: "days7", title: "7 ימים רצוף", emoji: "🔥" },
  { id: "row10", title: "10 נכון ברצף", emoji: "🎯" },
  { id: "lvl5", title: "שלב 5", emoji: "🚀" },
  { id: "mulmaster", title: "מומחה לכפל", emoji: "✖️" },
  { id: "divmaster", title: "מומחה לחילוק", emoji: "➗" },
  { id: "st10", title: "10 מדבקות", emoji: "🏅" },
  { id: "flash", title: "סיים אתגר מהירות", emoji: "⚡" },
  { id: "chest5", title: "פתחת 5 תיבות", emoji: "🎁" },
];

/* ---------------- chests ---------------- */

export type ChestKind = "regular" | "amazing" | "legendary";

export const CHESTS: Record<
  ChestKind,
  { title: string; emoji: string; price: number; money: number; desc: string }
> = {
  regular: {
    title: "תיבה רגילה",
    emoji: "📦",
    price: 400,
    money: 4.9,
    desc: "20-100 מטבעות · 1-3 רמזים · 2-3 מדבקות רגילות",
  },
  amazing: {
    title: "תיבה מדהימה",
    emoji: "🎁",
    price: 1500,
    money: 7.9,
    desc: "100-300 מטבעות · 4-8 רמזים · 3-5 מדבקות (לפחות 1 מדהימה)",
  },
  legendary: {
    title: "תיבה אגדית",
    emoji: "🏆",
    price: 3500,
    money: 11.9,
    desc: "300-700 מטבעות · 8-15 רמזים · 4-8 מדבקות (לפחות 1 אגדית)",
  },
};

export type ChestReward = {
  coins: number;
  hints: number;
  stickers: number[];
  boost: "double" | "premium" | null;
  rarePremium: boolean;
  ticket: TicketId | null;
  kind: ChestKind;
};

/* ---------------- events ---------------- */

export type EventInfo = { week: number; title: string; desc: string; emoji: string };

/** מתחלף במוצאי שבת — מחזור של 4 שבועות */
export function currentEvent(now = Date.now()): EventInfo {
  const week = Math.floor((now + 86400000) / (7 * 86400000)) % 4;
  const list: EventInfo[] = [
    { week: 0, title: "תיבה יומית חינם", desc: "כל יום תיבה רגילה חינם", emoji: "📦" },
    { week: 1, title: "גלגל מזל חינם יומי", desc: "סיבוב חינם כל יום", emoji: "🎡" },
    { week: 2, title: "כפל מטבעות", desc: "×2 מטבעות ב-5 התרגילים הראשונים ביום", emoji: "⏩" },
    { week: 3, title: "בונוס רצף", desc: "35 מטבעות בונוס בלחיצת הרצף", emoji: "🔥" },
  ];
  return list[week] as EventInfo;
}

/* ---------------- missions ---------------- */

export type Mission = {
  id: string;
  title: string;
  goal: number;
  metric: "answers" | "nomiss" | "chests" | "streakDays";
  reward: { coins?: number; hints?: number; chest?: ChestKind; ticket?: TicketId; title?: string };
  premiumOnly?: boolean;
};

export const DAILY_MISSIONS: Mission[] = [
  { id: "d10", title: "10 תרגילים", goal: 10, metric: "answers", reward: { coins: 20, hints: 1 } },
  { id: "d15", title: "15 תרגילים ללא טעות", goal: 15, metric: "nomiss", reward: { coins: 40, hints: 2 } },
  { id: "d20", title: "20 תרגילים ללא טעות", goal: 20, metric: "nomiss", reward: { chest: "legendary" } },
];

export const MONTHLY_MISSIONS: Mission[] = [
  { id: "m300", title: "300 תרגילים החודש", goal: 300, metric: "answers", reward: { coins: 100, hints: 5 } },
  {
    id: "m500",
    title: "500 תרגילים החודש",
    goal: 500,
    metric: "answers",
    reward: { chest: "legendary", coins: 200, hints: 10 },
  },
  {
    id: "p30",
    title: "פתיחת 30 תיבות",
    goal: 30,
    metric: "chests",
    reward: { ticket: "restore", coins: 100 },
    premiumOnly: true,
  },
  {
    id: "p35",
    title: "35 ימי רצף",
    goal: 35,
    metric: "streakDays",
    reward: { chest: "legendary", title: "אלוף הרצף" },
    premiumOnly: true,
  },
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
  openChest: (kind: ChestKind, free?: boolean) => ChestReward | null;
  claimStreak: () => { coins: number } | null;
  spinWheel: (free: boolean) => WheelPrize | null;
  claimMission: (m: Mission, scope: "daily" | "monthly") => boolean;
  missionProgress: (m: Mission) => number;
  unlockAchievement: (id: string) => void;
  sound: (kind: Parameters<typeof playSound>[0]) => void;
  reset: () => void;
  premium: boolean;
  doubling: boolean;
  event: EventInfo;
};

export type WheelPrize = {
  label: string;
  emoji: string;
  coins?: number;
  hints?: number;
  sticker?: number | null;
  ticket?: TicketId;
  icon?: string;
};

const GameCtx = createContext<Ctx | null>(null);

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

function freeSlots(owned: number[], rarity?: Rarity) {
  return Array.from({ length: ALBUM_SIZE }, (_, i) => i).filter(
    (i) => !owned.includes(i) && (!rarity || stickerForSlot(i).rarity === rarity),
  );
}

function drawStickers(owned: number[], count: number, guaranteed?: Rarity, lucky = false) {
  const picked: number[] = [];
  const take = (rarity?: Rarity) => {
    const pool = freeSlots([...owned, ...picked], rarity);
    if (!pool.length) return;
    picked.push(pool[Math.floor(Math.random() * pool.length)] as number);
  };
  if (guaranteed) take(guaranteed);
  while (picked.length < count) {
    const roll = Math.random() * (lucky ? 0.7 : 1);
    const rarity: Rarity = roll < 0.5 ? "poor" : roll < 0.8 ? "common" : roll < 0.95 ? "good" : "epic";
    const before = picked.length;
    take(rarity);
    if (picked.length === before) {
      take();
      if (picked.length === before) break;
    }
  }
  return picked;
}

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
      const parsed: Profile = raw
        ? { ...defaultProfile, ...(JSON.parse(raw) as Partial<Profile>) }
        : { ...defaultProfile, userId: rnd(3, 999) };
      parsed.tickets = { ...defaultProfile.tickets, ...(parsed.tickets ?? {}) };
      const today = todayKey();
      if (parsed.lastDay !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const protectedStreak = Date.now() < parsed.streakShieldUntil;
        parsed.streakDays =
          parsed.lastDay === yesterday || protectedStreak ? parsed.streakDays + 1 : 1;
        parsed.lastDay = today;
      }
      if (parsed.lastChestDay !== today) {
        parsed.lastChestDay = today;
        const ev = currentEvent();
        const bonus = ev.week === 0 || Date.now() < parsed.boosts.premiumUntil ? 2 : 1;
        parsed.chests = parsed.chests + bonus;
      }
      if (parsed.missionDay !== today) {
        parsed.missionDay = today;
        parsed.dailyAnswers = 0;
        parsed.dailyNoMissBest = 0;
        parsed.dailyNoMissCur = 0;
        parsed.dailyClaimed = [];
      }
      if (parsed.missionMonth !== monthKey()) {
        parsed.missionMonth = monthKey();
        parsed.monthlyAnswers = 0;
        parsed.monthlyChests = 0;
        parsed.monthlyClaimed = [];
      }
      setProfile(parsed);
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
      const free = freeSlots(p.stickers);
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
      const lucky = p.tickets.luck > 0;
      const coins =
        kind === "regular" ? rnd(20, 100) : kind === "amazing" ? rnd(100, 300) : rnd(300, 700);
      const hints = kind === "regular" ? rnd(1, 3) : kind === "amazing" ? rnd(4, 8) : rnd(8, 15);
      const count = kind === "regular" ? rnd(2, 3) : kind === "amazing" ? rnd(3, 5) : rnd(4, 8);
      const guaranteed: Rarity | undefined =
        kind === "amazing" ? "good" : kind === "legendary" ? "epic" : undefined;
      const picked = drawStickers(p.stickers, count, guaranteed, lucky);

      // פרימיום נדיר — 1 ל-10,000 בתיבה אגדית
      const rarePremium = kind === "legendary" && Math.random() < 1 / 10000;
      const boost: ChestReward["boost"] =
        rarePremium || kind === "legendary"
          ? Math.random() < 0.5
            ? "premium"
            : "double"
          : kind === "amazing" && Math.random() < 0.4
            ? "double"
            : null;
      const ticket: TicketId | null =
        kind === "legendary" && Math.random() < 0.5
          ? Math.random() < 0.5
            ? "luck"
            : "skip"
          : kind === "amazing" && Math.random() < 0.25
            ? "shield"
            : null;

      reward = { coins, hints, stickers: picked, boost, rarePremium, ticket, kind };

      const achievements = [...p.achievements];
      if (p.chestsOpened + 1 >= 5 && !achievements.includes("chest5")) achievements.push("chest5");

      const premiumAdd = rarePremium ? 86400000 : boost === "premium" ? 86400000 : 0;

      return {
        ...p,
        coins: p.coins - (free ? 0 : cfg.price) + coins,
        hints: p.hints + hints,
        chests: free ? p.chests - 1 : p.chests,
        chestsOpened: p.chestsOpened + 1,
        monthlyChests: p.monthlyChests + 1,
        stickers: [...p.stickers, ...picked],
        tickets: ticket ? { ...p.tickets, [ticket]: p.tickets[ticket] + 1 } : p.tickets,
        achievements,
        boosts: {
          doubleUntil:
            boost === "double" ? Math.max(Date.now(), p.boosts.doubleUntil) + 3600000 : p.boosts.doubleUntil,
          premiumUntil: premiumAdd
            ? Math.max(Date.now(), p.boosts.premiumUntil) + premiumAdd
            : p.boosts.premiumUntil,
        },
      };
    });
    return reward;
  }, []);

  const claimStreak = useCallback<Ctx["claimStreak"]>(() => {
    const today = todayKey();
    let out: { coins: number } | null = null;
    setProfile((p) => {
      if (p.streakClaimedDay === today) return p;
      const ev = currentEvent();
      const bonus = ev.week === 3 || Date.now() < p.boosts.premiumUntil ? 35 : 0;
      const base = 10 + Math.min(50, p.streakDays * 2);
      const coins = base + bonus;
      out = { coins };
      const day = p.streakDays % 20;
      const hints = day % 5 === 0 ? 2 : 0;
      const ticket: TicketId | null = day % 10 === 0 ? "shield" : null;
      const chest = day === 0 ? 1 : 0;
      return {
        ...p,
        streakClaimedDay: today,
        coins: p.coins + coins,
        hints: p.hints + hints,
        chests: p.chests + chest,
        tickets: ticket ? { ...p.tickets, [ticket]: p.tickets[ticket] + 1 } : p.tickets,
      };
    });
    return out;
  }, []);

  const spinWheel = useCallback<Ctx["spinWheel"]>((free) => {
    let out: WheelPrize | null = null;
    setProfile((p) => {
      const today = todayKey();
      const ev = currentEvent();
      const freeAllowed =
        free && p.lastFreeSpin !== today && (ev.week === 1 || Date.now() < p.boosts.premiumUntil);
      if (!freeAllowed && p.spins <= 0) return p;

      const roll = Math.random();
      let prize: WheelPrize;
      if (roll < 0.4) prize = { label: `${rnd(20, 120)} מטבעות`, emoji: "🪙", coins: rnd(20, 120) };
      else if (roll < 0.65) prize = { label: `${rnd(1, 4)} רמזים`, emoji: "💡", hints: rnd(1, 4) };
      else if (roll < 0.85) {
        const slots = freeSlots(p.stickers);
        const slot = slots.length ? (slots[Math.floor(Math.random() * slots.length)] as number) : null;
        prize = { label: "מדבקה", emoji: "🎟️", sticker: slot };
      } else if (roll < 0.95) prize = { label: TICKETS.shield.title, emoji: "🛡️", ticket: "shield" };
      else {
        const locked = ICONS.filter((i) => !p.icons.includes(i.emoji));
        const ic = locked.length ? (locked[Math.floor(Math.random() * locked.length)] as (typeof ICONS)[number]) : null;
        prize = ic
          ? { label: "אייקון חדש", emoji: ic.emoji, icon: ic.emoji }
          : { label: "300 מטבעות", emoji: "🪙", coins: 300 };
      }
      out = prize;
      return {
        ...p,
        spins: freeAllowed ? p.spins : p.spins - 1,
        lastFreeSpin: freeAllowed ? today : p.lastFreeSpin,
        coins: p.coins + (prize.coins ?? 0),
        hints: p.hints + (prize.hints ?? 0),
        stickers: prize.sticker != null ? [...p.stickers, prize.sticker] : p.stickers,
        icons: prize.icon ? [...p.icons, prize.icon] : p.icons,
        tickets: prize.ticket
          ? { ...p.tickets, [prize.ticket]: p.tickets[prize.ticket] + 1 }
          : p.tickets,
      };
    });
    return out;
  }, []);

  const missionProgress = useCallback<Ctx["missionProgress"]>(
    (m) => {
      switch (m.metric) {
        case "answers":
          return DAILY_MISSIONS.includes(m) ? profile.dailyAnswers : profile.monthlyAnswers;
        case "nomiss":
          return profile.dailyNoMissBest;
        case "chests":
          return profile.monthlyChests;
        case "streakDays":
          return profile.streakDays;
      }
    },
    [profile],
  );

  const claimMission = useCallback<Ctx["claimMission"]>((m, scope) => {
    let ok = false;
    setProfile((p) => {
      const claimed = scope === "daily" ? p.dailyClaimed : p.monthlyClaimed;
      if (claimed.includes(m.id)) return p;
      const prog =
        m.metric === "answers"
          ? scope === "daily"
            ? p.dailyAnswers
            : p.monthlyAnswers
          : m.metric === "nomiss"
            ? p.dailyNoMissBest
            : m.metric === "chests"
              ? p.monthlyChests
              : p.streakDays;
      if (prog < m.goal) return p;
      ok = true;
      const month = monthKey();
      const canLegendary =
        m.reward.chest !== "legendary" ||
        Date.now() < p.boosts.premiumUntil ||
        p.lastLegendaryMonth !== month;
      return {
        ...p,
        coins: p.coins + (m.reward.coins ?? 0),
        hints: p.hints + (m.reward.hints ?? 0),
        chests: p.chests + (m.reward.chest && canLegendary ? 1 : 0),
        lastLegendaryMonth:
          m.reward.chest === "legendary" && canLegendary ? month : p.lastLegendaryMonth,
        tickets: m.reward.ticket
          ? { ...p.tickets, [m.reward.ticket]: p.tickets[m.reward.ticket] + 1 }
          : p.tickets,
        dailyClaimed: scope === "daily" ? [...p.dailyClaimed, m.id] : p.dailyClaimed,
        monthlyClaimed: scope === "monthly" ? [...p.monthlyClaimed, m.id] : p.monthlyClaimed,
      };
    });
    return ok;
  }, []);

  const unlockAchievement = useCallback((id: string) => {
    setProfile((p) =>
      p.achievements.includes(id)
        ? p
        : { ...p, achievements: [...p.achievements, id], coins: p.coins + 3 },
    );
  }, []);

  const recordAnswer = useCallback<Ctx["recordAnswer"]>((correct, op) => {
    if (op && correct) opStats.current[op] = (opStats.current[op] ?? 0) + 1;
    let sticker: number | null = null;
    let levelUp = false;

    setProfile((p) => {
      const history = [...p.history, correct].slice(-200);
      let level = p.level;

      // מערכת שלבים חכמה: כל 10 תרגילים בודקים אחוז הצלחה
      const total = p.totalAnswered + 1;
      if (total % 10 === 0) {
        const last10 = history.slice(-10);
        const acc = last10.filter(Boolean).length / last10.length;
        const step = Math.max(1, Math.round(level * 0.01));
        if (acc >= 0.8) {
          level = Math.min(MAX_LEVEL, level + step * 3);
          levelUp = true;
        } else if (acc < 0.4) {
          level = Math.max(1, level - step * 2);
        } else {
          level = Math.min(MAX_LEVEL, level + Math.max(1, Math.round(step / 2)));
        }
      }

      const currentStreakCorrect = correct ? p.currentStreakCorrect + 1 : 0;
      const dailyNoMissCur = correct ? p.dailyNoMissCur + 1 : 0;
      const totalCorrect = p.totalCorrect + (correct ? 1 : 0);
      let correctSinceSticker = p.correctSinceSticker + (correct ? 1 : 0);
      let stickers = p.stickers;
      if (correctSinceSticker >= 30) {
        correctSinceSticker -= 30;
        const free = freeSlots(stickers);
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
      if (total >= 100) add("ex100");
      if (p.streakDays >= 7) add("days7");
      if (currentStreakCorrect >= 10) add("row10");
      if (level >= 5) add("lvl5");
      if ((opStats.current["mul"] ?? 0) >= 30) add("mulmaster");
      if ((opStats.current["div"] ?? 0) >= 30) add("divmaster");
      if (stickers.length >= 10) add("st10");

      const coinsFromAch = (achievements.length - p.achievements.length) * 3;
      const nowMs = Date.now();
      const ev = currentEvent(nowMs);
      const eventDouble = ev.week === 2 && p.dailyAnswers < 5;
      const boosted =
        nowMs < p.boosts.doubleUntil || nowMs < p.boosts.premiumUntil || eventDouble;
      const gain = correct ? (boosted ? 2 : 1) : 0;

      return {
        ...p,
        history,
        level,
        currentStreakCorrect,
        bestStreakCorrect: Math.max(p.bestStreakCorrect, currentStreakCorrect),
        totalCorrect,
        totalAnswered: total,
        dailyAnswers: p.dailyAnswers + 1,
        monthlyAnswers: p.monthlyAnswers + 1,
        dailyNoMissCur,
        dailyNoMissBest: Math.max(p.dailyNoMissBest, dailyNoMissCur),
        correctSinceRating: correct ? p.correctSinceRating + 1 : p.correctSinceRating,
        correctSinceSticker,
        stickers,
        achievements,
        coins: p.coins + gain + coinsFromAch,
      };
    });
    return { sticker, levelUp };
  }, []);

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
    setProfile({ ...defaultProfile, lastDay: todayKey(), userId: rnd(3, 999) });
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
      claimStreak,
      spinWheel,
      claimMission,
      missionProgress,
      unlockAchievement,
      sound,
      reset,
      premium: (now || Date.now()) < profile.boosts.premiumUntil,
      doubling:
        (now || Date.now()) < profile.boosts.doubleUntil ||
        (now || Date.now()) < profile.boosts.premiumUntil,
      event: currentEvent(now || Date.now()),
    }),
    [
      profile,
      ready,
      now,
      update,
      recordAnswer,
      addCoins,
      spendCoins,
      useHint,
      grantSticker,
      openChest,
      claimStreak,
      spinWheel,
      claimMission,
      missionProgress,
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
