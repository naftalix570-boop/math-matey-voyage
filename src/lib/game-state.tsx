import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ALBUM_SIZE, stickerForSlot, type Rarity } from "./stickers";
import { MAX_LEVEL } from "./math";
import { playSound } from "./sfx";
import { supabase } from "@/integrations/supabase/client";

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
    rarity: "rare",
    price: 150,
    desc: "מוסיף 24 שעות הגנה על הרצף",
  },
  restore: {
    title: "שובר רצף",
    emoji: "🔁",
    rarity: "amazing",
    price: 400,
    desc: "משחזר רצף שנשבר",
  },
  luck: {
    title: "מזל",
    emoji: "🍀",
    rarity: "legendary",
    price: null,
    desc: "מכפיל סיכויים למדבקות נדירות (לא נמכר)",
  },
  skip: {
    title: "דילוג על שלב",
    emoji: "⏭️",
    rarity: "amazing",
    price: null,
    desc: "דילוג על שלב קשה (לא נמכר)",
  },
};

export const ICONS = [
  { id: "star", emoji: "⭐", rarity: "rare" as Rarity },
  { id: "cat", emoji: "🐱", rarity: "rare" as Rarity },
  { id: "ball", emoji: "⚽", rarity: "rare" as Rarity },
  { id: "robot", emoji: "🤖", rarity: "rare" as Rarity },
  { id: "rocket", emoji: "🚀", rarity: "amazing" as Rarity },
  { id: "ninja", emoji: "🥷", rarity: "amazing" as Rarity },
  { id: "unicorn", emoji: "🦄", rarity: "amazing" as Rarity },
  { id: "dragon", emoji: "🐉", rarity: "legendary" as Rarity },
  { id: "crown", emoji: "👑", rarity: "legendary" as Rarity },
  { id: "alien", emoji: "👽", rarity: "legendary" as Rarity },
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
  /** תיבות חינם יומיות (מקסימום 1 ליום) */
  chests: number;
  lastChestDay: string;
  chestsOpened: number;
  /** מלאי תיבות שהתקבלו ממשימות / רצף / חנות */
  chestInv: Record<"regular" | "amazing" | "legendary", number>;
  tickets: Tickets;
  /** גביעים — אחד על כל תרגיל שנפתר נכון */
  trophies: number;
  /** ניצחונות לפי משחק */
  gameWins: Record<string, number>;
  /** משחקים שכבר ראו את מסך ההסבר */
  seenGames: string[];

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
  /** ISO country code for national leaderboard */
  country: string;
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
  chestInv: { regular: 0, amazing: 0, legendary: 0 },
  tickets: { shield: 0, restore: 0, luck: 0, skip: 0 },
  trophies: 0,
  gameWins: {},
  seenGames: [],
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
  country: "IL",
};

/** ניקוד הדירוג — מספר הגביעים (גביע על כל תרגיל שנפתר נכון) */
export const scoreOf = (p: Profile) => p.trophies || p.totalCorrect;


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

/** כל האיוונטים במחזור */
export const EVENTS: EventInfo[] = [
  { week: 0, title: "תיבה יומית חינם", desc: "כל יום תיבה רגילה חינם", emoji: "📦" },
  { week: 1, title: "גלגל מזל חינם יומי", desc: "סיבוב חינם כל יום", emoji: "🎡" },
  { week: 2, title: "כפל מטבעות", desc: "×2 מטבעות ב-5 התרגילים הראשונים ביום", emoji: "⏩" },
  { week: 3, title: "בונוס רצף", desc: "35 מטבעות בונוס בלחיצת הרצף", emoji: "🔥" },
];

/** תחילת שבוע האיוונט — מוצאי שבת, כלומר יום ראשון ב-00:00 שעון מקומי */
function eventWeekStart(now: Date): Date {
  const s = new Date(now);
  s.setHours(0, 0, 0, 0);
  s.setDate(s.getDate() - s.getDay()); // יום ראשון
  return s;
}

/** מתחלף במוצאי שבת ב-00:00 — מחזור של 4 שבועות */
export function currentEvent(now = Date.now()): EventInfo {
  const start = eventWeekStart(new Date(now));
  const idx = ((Math.floor(start.getTime() / 604800000) % 4) + 4) % 4;
  return EVENTS[idx] as EventInfo;
}

/** תאריך החלפת האיוונט הבא (מוצאי שבת ב-00:00 מקומי) */
export function nextEventChange(now = new Date()): Date {
  const next = eventWeekStart(now);
  next.setDate(next.getDate() + 7);
  return next;
}

/* ---------------- missions ---------------- */

export type MissionMetric =
  | "answers"
  | "nomiss"
  | "chests"
  | "streakDays"
  | "stickers"
  | "amazingStickers"
  | "legendaryStickers"
  | "coinsEarned"
  | "hintsUsed"
  | "gameWins";


export type Mission = {
  id: string;
  title: string;
  desc?: string;
  goal: number;
  metric: MissionMetric;
  /** מזהה משחק — למשימות מסוג gameWins */
  gameId?: string;
  reward: { coins?: number; hints?: number; chest?: ChestKind; ticket?: TicketId; title?: string };
  premiumOnly?: boolean;
};

export const DAILY_MISSIONS: Mission[] = [
  {
    id: "d15",
    title: "15 תרגילים היום",
    desc: "חימום יומי",
    goal: 15,
    metric: "answers",
    reward: { coins: 25 },
  },
  {
    id: "d40",
    title: "40 תרגילים היום",
    desc: "יום של אימון רציני",
    goal: 40,
    metric: "answers",
    reward: { coins: 60, hints: 1 },
  },
  {
    id: "d-nomiss25",
    title: "25 תרגילים ברצף ללא טעות",
    desc: "דיוק מלא",
    goal: 25,
    metric: "nomiss",
    reward: { coins: 80, ticket: "shield" },
  },
  {
    id: "d-win3",
    title: "3 ניצחונות ב״מסלול עננים״",
    goal: 3,
    metric: "gameWins",
    gameId: "clouds",
    reward: { coins: 50, hints: 1 },
  },
  {
    id: "d-nomiss45",
    title: "45 תרגילים ברצף ללא טעות",
    desc: "משימת אלופים",
    goal: 45,
    metric: "nomiss",
    reward: { chest: "regular", ticket: "skip" },
  },
  {
    id: "d-nomiss10",
    title: "10 תרגילים ברצף ללא טעות",
    desc: "התחלה נקייה",
    goal: 10,
    metric: "nomiss",
    reward: { coins: 20 },
  },
  {
    id: "d-80",
    title: "80 תרגילים היום",
    desc: "יום כוח של ממש",
    goal: 80,
    metric: "answers",
    reward: { coins: 120, hints: 2 },
  },
  {
    id: "d-win-memory2",
    title: "2 ניצחונות ב״זיכרון חשבוני״",
    goal: 2,
    metric: "gameWins",
    gameId: "memory",
    reward: { coins: 40, hints: 1 },
  },
  {
    id: "d-win-flash2",
    title: "2 ניצחונות ב״אתגר מהירות״",
    goal: 2,
    metric: "gameWins",
    gameId: "flash",
    reward: { coins: 45 },
  },
];

/** 10 משימות חודשיות קשות — פרסים מעורבים, רק אחת מעניקה תיבה אגדית */
export const MONTHLY_MISSIONS: Mission[] = [
  {
    id: "m-ans-800",
    title: "800 תרגילים החודש",
    desc: "מרתון של ממש",
    goal: 800,
    metric: "answers",
    reward: { coins: 250 },
  },
  {
    id: "m-hints",
    title: "משימת הרמזים — 1,500 תרגילים",
    desc: "פרס: 10 רמזים",
    goal: 1500,
    metric: "answers",
    reward: { hints: 10 },
  },
  {
    id: "m-shield",
    title: "משימת המגן — 20 ימי רצף",
    desc: "פרס: מגן רצף 🛡️",
    goal: 20,
    metric: "streakDays",
    reward: { ticket: "shield", coins: 100 },
  },
  {
    id: "m-restore",
    title: "משימת השחזור — 2,000 תרגילים",
    desc: "פרס: שובר שחזור רצף 🔁",
    goal: 2000,
    metric: "answers",
    reward: { ticket: "restore", coins: 150 },
  },
  {
    id: "m-nomiss-60",
    title: "60 תרגילים ברצף ללא טעות",
    desc: "דיוק מושלם",
    goal: 60,
    metric: "nomiss",
    reward: { coins: 200, hints: 5 },
  },
  {
    id: "m-stickers-3",
    title: "לאסוף 3 מדבקות מדהימות 💜",
    desc: "לא פשוט להשיג",
    goal: 3,
    metric: "amazingStickers",
    reward: { ticket: "skip", coins: 120 },
  },
  {
    id: "m-stickers-legend-2",
    title: "לאסוף 2 מדבקות אגדיות 👑",
    desc: "המשימה הכי נדירה בחודש",
    goal: 2,
    metric: "legendaryStickers",
    reward: { chest: "amazing", ticket: "luck" },
  },
  {
    id: "m-chest-40",
    title: "לפתוח 40 תיבות החודש",
    desc: "פרס: תיבה רגילה",
    goal: 40,
    metric: "chests",
    reward: { chest: "regular", coins: 100 },
  },
  {
    id: "m-fort-20",
    title: "20 ניצחונות ב״הגנת המבצר״",
    goal: 20,
    metric: "gameWins",
    gameId: "fort",
    reward: { hints: 8, coins: 120 },
  },
  {
    id: "m-legendary",
    title: "🏆 המשימה האגדית — 3,000 תרגילים",
    desc: "הפרס היחיד של תיבה אגדית בחודש",
    goal: 3000,
    metric: "answers",
    reward: { chest: "legendary", title: "אגדה חיה", coins: 300 },
  },
  {
    id: "m-tower-15",
    title: "15 ניצחונות ב״מגדל המספרים״",
    desc: "לבנות את המגדל שוב ושוב",
    goal: 15,
    metric: "gameWins",
    gameId: "tower",
    reward: { coins: 150, hints: 5 },
  },
  {
    id: "m-time-25",
    title: "25 ניצחונות ב״קרב מול הזמן״",
    desc: "מהירים ומדויקים",
    goal: 25,
    metric: "gameWins",
    gameId: "time-battle",
    reward: { coins: 250, ticket: "luck" },
  },
  {
    id: "m-stickers-10",
    title: "לאסוף 10 מדבקות לאלבום",
    desc: "האוסף גדל",
    goal: 10,
    metric: "stickers",
    reward: { coins: 100, hints: 3 },
  },
  {
    id: "m-nomiss-100",
    title: "100 תרגילים ברצף ללא טעות",
    desc: "רק לגאוני דיוק",
    goal: 100,
    metric: "nomiss",
    reward: { chest: "amazing", coins: 250 },
  },
  {
    id: "m-chest-80",
    title: "לפתוח 80 תיבות החודש",
    desc: "צייד תיבות אמיתי",
    goal: 80,
    metric: "chests",
    reward: { chest: "amazing", coins: 150 },
  },
];

/* ---------------- streak rewards ---------------- */

export const STREAK_CYCLE = 30;

export type StreakReward = {
  coins: number;
  hints: number;
  ticket: TicketId | null;
  chest: ChestKind | null;
  emoji: string;
  label: string;
};

/** תגמול הרצף ליום מסוים — מעורבב: מטבעות, רמזים, שוברים, ותיבה מדהימה פעם ב-30 יום */
export function streakReward(day: number): StreakReward {
  const coins = 10 + Math.min(60, day * 2);
  const d = ((day - 1) % STREAK_CYCLE) + 1;
  if (d === STREAK_CYCLE)
    return {
      coins,
      hints: 3,
      ticket: null,
      chest: "amazing",
      emoji: "🎁",
      label: "תיבה מדהימה!",
    };
  if (d % 15 === 0)
    return { coins, hints: 0, ticket: "restore", chest: null, emoji: "🔁", label: "שובר רצף" };
  if (d % 10 === 0)
    return { coins, hints: 0, ticket: "shield", chest: null, emoji: "🛡️", label: "מגן רצף" };
  if (d % 7 === 0)
    return { coins, hints: 0, ticket: "skip", chest: null, emoji: "⏭️", label: "דילוג על שלב" };
  if (d % 5 === 0)
    return { coins, hints: 3, ticket: null, chest: null, emoji: "💡", label: "3 רמזים" };
  if (d % 3 === 0)
    return { coins, hints: 1, ticket: null, chest: null, emoji: "💡", label: "רמז + מטבעות" };
  return { coins, hints: 0, ticket: null, chest: null, emoji: "🪙", label: `${coins} מטבעות` };
}

/* ---------------- worlds ---------------- */

export const WORLD_SIZE = 25;

const WORLD_NAMES = [
  "עולם המתחילים",
  "עמק החיבור",
  "יער החיסור",
  "מגדל הכפל",
  "מערת החילוק",
  "אי המספרים",
  "מדבר התרגילים",
  "הרי האלופים",
  "ממלכת הגאונים",
  "גלקסיית החשבון",
];

export const worldOf = (level: number) => Math.max(1, Math.floor((level - 1) / WORLD_SIZE) + 1);

export function worldInfo(world: number) {
  const name = WORLD_NAMES[(world - 1) % WORLD_NAMES.length] as string;
  const cycle = Math.floor((world - 1) / WORLD_NAMES.length);
  return {
    world,
    title: cycle > 0 ? `${name} ${cycle + 1}` : name,
    from: (world - 1) * WORLD_SIZE + 1,
    to: world * WORLD_SIZE,
    emoji: ["🌱", "➕", "➖", "✖️", "➗", "🏝️", "🏜️", "⛰️", "👑", "🌌"][(world - 1) % 10] as string,
  };
}



type Ctx = {
  profile: Profile;
  ready: boolean;
  update: (patch: Partial<Profile> | ((p: Profile) => Partial<Profile>)) => void;
  recordAnswer: (correct: boolean, op?: string) => { sticker: number | null; levelUp: boolean };
  addCoins: (n: number) => void;
  spendCoins: (n: number) => boolean;
  useHint: () => boolean;
  grantSticker: () => number | null;
  /** src: "free" = תיבה יומית · "inv" = מהמלאי · "coins" = קנייה במטבעות */
  openChest: (kind: ChestKind, src?: "free" | "inv" | "coins") => ChestReward | null;
  recordGameWin: (gameId: string) => void;
  markGameSeen: (gameId: string) => void;
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
  /** cloud account */
  linked: boolean;
  authEmail: string | null;
  authUid: string | null;
  syncNow: () => Promise<boolean>;
  cloudSyncing: boolean;
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
    const roll = Math.random() * (lucky ? 0.75 : 1);
    const rarity: Rarity = roll < 0.68 ? "rare" : roll < 0.93 ? "amazing" : "legendary";
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
      parsed.chestInv = { ...defaultProfile.chestInv, ...(parsed.chestInv ?? {}) };
      parsed.gameWins = { ...(parsed.gameWins ?? {}) };
      parsed.seenGames = parsed.seenGames ?? [];
      if (!parsed.trophies) parsed.trophies = parsed.totalCorrect;
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
        // תיבה יומית חינם רק באיוונט התיבה היומית (או לפרימיום) — פרס אחד לאיוונט
        parsed.chests =
          currentEvent().week === 0 || Date.now() < parsed.boosts.premiumUntil ? 1 : 0;
      } else {
        parsed.chests = Math.min(1, parsed.chests);
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

  /* ---------------- cloud sync ---------------- */

  const [authUid, setAuthUid] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const pulledRef = useRef<string | null>(null);
  const authUidRef = useRef<string | null>(null);
  const profileRef = useRef(profile);
  const syncQueueRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const LAST_UID_KEY = "math-journey:last-uid";

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const setCurrentUser = useCallback((uid: string | null, email: string | null) => {
    authUidRef.current = uid;
    setAuthUid(uid);
    setAuthEmail(email);
  }, []);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setCurrentUser(data.session?.user.id ?? null, data.session?.user.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        if (event === "SIGNED_OUT") {
          pulledRef.current = null;
          // אחרי התנתקות מתחילים מפרופיל אורח נקי — לא נשארים עם הנתונים של החשבון הקודם
          setProfile((p) => ({ ...defaultProfile, soundOn: p.soundOn, guest: true }));
        }
        setCurrentUser(session?.user.id ?? null, session?.user.email ?? null);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [setCurrentUser]);

  // משיכת פרופיל מהענן בכניסה — הענן תמיד גובר; חשבון חדש מתחיל נקי
  useEffect(() => {
    if (!authUid || !ready || pulledRef.current === authUid) return;
    let prevUid: string | null = null;
    try {
      prevUid = localStorage.getItem(LAST_UID_KEY);
    } catch {
      /* ignore */
    }
    let cancelled = false;
    const loadCloudProfile = async () => {
      const { data: rows, error } = await supabase.rpc("get_my_profile");
      if (cancelled || authUidRef.current !== authUid) return;
      if (error) {
        console.error("profile load failed", error);
        window.setTimeout(() => {
          if (!cancelled && authUidRef.current === authUid) void loadCloudProfile();
        }, 2000);
        return;
      }
      const data = Array.isArray(rows) ? rows[0] : null;
      if (data?.data && typeof data.data === "object" && Object.keys(data.data).length) {
        const cloud = data.data as Partial<Profile>;
        setProfile((p) => ({
          ...defaultProfile,
          ...cloud,
          tickets: { ...defaultProfile.tickets, ...(cloud.tickets ?? {}) },
          boosts: { ...defaultProfile.boosts, ...(cloud.boosts ?? {}) },
          name: data.display_name || cloud.name || p.name,
          icon: data.icon || cloud.icon || p.icon,
          country: data.country || "IL",
          guest: false,
        }));
      } else if (prevUid && prevUid !== authUid) {
        // חשבון חדש שאין לו נתונים בענן — לא מעבירים אליו את ההתקדמות של החשבון הקודם
        setProfile((p) => ({
          ...defaultProfile,
          soundOn: p.soundOn,
          name: data?.display_name || defaultProfile.name,
          icon: data?.icon || defaultProfile.icon,
          country: data?.country || "IL",
          guest: false,
        }));
      } else {
        // קישור ראשון של התקדמות אורח לחשבון
        setProfile((p) => ({ ...p, guest: false }));
      }
      try {
        localStorage.setItem(LAST_UID_KEY, authUid);
      } catch {
        /* ignore */
      }
      pulledRef.current = authUid;
    };
    void loadCloudProfile();
    return () => {
      cancelled = true;
    };
  }, [authUid, ready]);

  const syncNow = useCallback(async (): Promise<boolean> => {
    const uid = authUidRef.current;
    if (!uid || pulledRef.current !== uid) return false;
    setCloudSyncing(true);
    const request = syncQueueRef.current.catch(() => false).then(async () => {
      if (authUidRef.current !== uid || pulledRef.current !== uid) return false;
      const snapshot = profileRef.current;
      const { error } = await supabase.rpc("sync_my_profile", {
        _display_name: snapshot.name,
        _icon: snapshot.icon,
        _country: snapshot.country,
        _score: scoreOf(snapshot),
        _data: JSON.parse(JSON.stringify(snapshot)),
      });
      if (error) console.error("profile sync failed", error);
      return !error;
    });
    syncQueueRef.current = request;
    try {
      return await request;
    } finally {
      if (syncQueueRef.current === request) setCloudSyncing(false);
    }
  }, []);

  // דחיפת שינויים לענן (debounce) — רק אחרי שהפרופיל של החשבון הנוכחי נטען
  useEffect(() => {
    if (!authUid || !ready || pulledRef.current !== authUid) return;
    const t = setTimeout(() => {
      void syncNow();
    }, 350);
    return () => clearTimeout(t);
  }, [authUid, ready, profile, syncNow]);

  // ניסיון שמירה נוסף כשהאפליקציה עוברת לרקע או נסגרת.
  useEffect(() => {
    if (!authUid || pulledRef.current !== authUid) return;
    const saveWhenHidden = () => {
      if (document.visibilityState === "hidden") void syncNow();
    };
    const saveBeforeClose = () => void syncNow();
    document.addEventListener("visibilitychange", saveWhenHidden);
    window.addEventListener("pagehide", saveBeforeClose);
    window.addEventListener("online", saveBeforeClose);
    return () => {
      document.removeEventListener("visibilitychange", saveWhenHidden);
      window.removeEventListener("pagehide", saveBeforeClose);
      window.removeEventListener("online", saveBeforeClose);
    };
  }, [authUid, syncNow]);

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

  const openChest = useCallback<Ctx["openChest"]>((kind, src = "coins") => {
    const cfg = CHESTS[kind];
    let reward: ChestReward | null = null;
    setProfile((p) => {
      if (src === "free" && (kind !== "regular" || p.chests <= 0)) return p;
      if (src === "inv" && p.chestInv[kind] <= 0) return p;
      if (src === "coins" && p.coins < cfg.price) return p;
      const lucky = p.tickets.luck > 0;
      // התיבה היומית החינמית פשוטה יותר — פחות מהתיבה הרגילה
      const daily = src === "free";
      const coins = daily
        ? rnd(10, 40)
        : kind === "regular"
          ? rnd(20, 100)
          : kind === "amazing"
            ? rnd(100, 300)
            : rnd(300, 700);
      const hints = daily
        ? rnd(0, 1)
        : kind === "regular"
          ? rnd(1, 3)
          : kind === "amazing"
            ? rnd(4, 8)
            : rnd(8, 15);
      const count = daily
        ? 1
        : kind === "regular"
          ? rnd(2, 3)
          : kind === "amazing"
            ? rnd(3, 5)
            : rnd(4, 8);
      const guaranteed: Rarity | undefined =
        kind === "amazing" ? "amazing" : kind === "legendary" ? "legendary" : undefined;
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
        coins: p.coins - (src === "coins" ? cfg.price : 0) + coins,
        hints: p.hints + hints,
        chests: src === "free" ? p.chests - 1 : p.chests,
        chestInv:
          src === "inv" ? { ...p.chestInv, [kind]: p.chestInv[kind] - 1 } : p.chestInv,
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

  const recordGameWin = useCallback<Ctx["recordGameWin"]>((gameId) => {
    setProfile((p) => ({
      ...p,
      gameWins: { ...p.gameWins, [gameId]: (p.gameWins[gameId] ?? 0) + 1 },
    }));
  }, []);

  const markGameSeen = useCallback<Ctx["markGameSeen"]>((gameId) => {
    setProfile((p) =>
      p.seenGames.includes(gameId) ? p : { ...p, seenGames: [...p.seenGames, gameId] },
    );
  }, []);


  const claimStreak = useCallback<Ctx["claimStreak"]>(() => {
    const today = todayKey();
    let out: { coins: number } | null = null;
    setProfile((p) => {
      if (p.streakClaimedDay === today) return p;
      const ev = currentEvent();
      const bonus = ev.week === 3 || Date.now() < p.boosts.premiumUntil ? 35 : 0;
      const r = streakReward(Math.max(1, p.streakDays));
      const coins = r.coins + bonus;
      out = { coins };
      return {
        ...p,
        streakClaimedDay: today,
        coins: p.coins + coins,
        hints: p.hints + r.hints,
        chestInv: r.chest
          ? { ...p.chestInv, [r.chest]: p.chestInv[r.chest] + 1 }
          : p.chestInv,
        tickets: r.ticket ? { ...p.tickets, [r.ticket]: p.tickets[r.ticket] + 1 } : p.tickets,
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

  const progressOf = (p: Profile, m: Mission, scope: "daily" | "monthly") => {
    switch (m.metric) {
      case "answers":
        return scope === "daily" ? p.dailyAnswers : p.monthlyAnswers;
      case "nomiss":
        return p.dailyNoMissBest;
      case "chests":
        return p.monthlyChests;
      case "streakDays":
        return p.streakDays;
      case "stickers":
        return p.stickers.length;
      case "amazingStickers":
        return p.stickers.filter((s) => stickerForSlot(s).rarity === "amazing").length;
      case "legendaryStickers":
        return p.stickers.filter((s) => stickerForSlot(s).rarity === "legendary").length;

      case "gameWins":
        return p.gameWins[m.gameId ?? ""] ?? 0;
      case "coinsEarned":
        return p.coins;
      case "hintsUsed":
        return p.hints;
      default:
        return 0;
    }
  };

  const missionProgress = useCallback<Ctx["missionProgress"]>(
    (m) => progressOf(profile, m, DAILY_MISSIONS.includes(m) ? "daily" : "monthly"),
    [profile],
  );

  const claimMission = useCallback<Ctx["claimMission"]>((m, scope) => {
    let ok = false;
    setProfile((p) => {
      const claimed = scope === "daily" ? p.dailyClaimed : p.monthlyClaimed;
      if (claimed.includes(m.id)) return p;
      if (progressOf(p, m, scope) < m.goal) return p;
      ok = true;
      const month = monthKey();
      const canLegendary =
        m.reward.chest !== "legendary" ||
        Date.now() < p.boosts.premiumUntil ||
        p.lastLegendaryMonth !== month;
      const gotChest = m.reward.chest && canLegendary ? m.reward.chest : null;
      return {
        ...p,
        coins: p.coins + (m.reward.coins ?? 0),
        hints: p.hints + (m.reward.hints ?? 0),
        chestInv: gotChest
          ? { ...p.chestInv, [gotChest]: p.chestInv[gotChest] + 1 }
          : p.chestInv,
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
        if (acc >= 0.9) {
          level = Math.min(MAX_LEVEL, level + step * 2);
          levelUp = true;
        } else if (acc >= 0.8) {
          level = Math.min(MAX_LEVEL, level + step);
          levelUp = true;
        } else if (acc < 0.4) {
          level = Math.max(1, level - step * 2);
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
      // מטבעות: מטבע אחד לכל תשובה נכונה (×2 עם בוסט כפל מטבעות)
      const gain = correct ? (boosted ? 2 : 1) : 0;



      return {
        ...p,
        history,
        level,
        currentStreakCorrect,
        bestStreakCorrect: Math.max(p.bestStreakCorrect, currentStreakCorrect),
        totalCorrect,
        trophies: p.trophies + (correct ? 1 : 0),
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

  const spendCoins = useCallback((n: number) => {
    const current = profileRef.current;
    if (current.coins < n) return false;
    const next = { ...current, coins: Math.max(0, current.coins - n) };
    profileRef.current = next;
    setProfile(next);
    return true;
  }, []);

  const useHint = useCallback(() => {
    const current = profileRef.current;
    if (Date.now() < current.boosts.premiumUntil) return true;
    if (current.hints <= 0) return false;
    const next = { ...current, hints: Math.max(0, current.hints - 1) };
    profileRef.current = next;
    setProfile(next);
    return true;
  }, []);

  const reset = useCallback(() => {
    const current = profileRef.current;
    const fresh: Profile = {
      ...defaultProfile,
      lastDay: todayKey(),
      userId: rnd(3, 999),
      // שומרים על הזהות בלוח המובילים, מאפסים את ההתקדמות
      name: current.name,
      icon: current.icon,
      country: current.country,
      soundOn: current.soundOn,
      guest: current.guest,
    };
    profileRef.current = fresh;
    setProfile(fresh);
    void syncNow();
  }, [syncNow]);

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
      recordGameWin,
      markGameSeen,
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
      linked: !!authUid,
      authEmail,
      authUid,
      syncNow,
      cloudSyncing,
    }),
    [
      authUid,
      authEmail,
      cloudSyncing,
      profile,
      ready,
      now,
      syncNow,
      update,
      recordAnswer,
      addCoins,
      spendCoins,
      useHint,
      grantSticker,
      openChest,
      recordGameWin,
      markGameSeen,
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
