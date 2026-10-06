import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ALBUM_WORLDS,
  STICKER_EVERY,
  collectableSlots,
  stickerForSlot,
  worldProgress,
  type AlbumWorld,
  type Rarity,
} from "./stickers";
import { MAX_LEVEL } from "./math";
import { playSound } from "./sfx";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import {
  createGuestPlayer,
  guestClaim,
  guestSync,
  guestTransfer,
  submitAnswers,
} from "./score.functions";
import { PROFILE_SCHEMA_VERSION } from "./app-version";
import { hasProgress, mergeProfiles } from "./profile-storage";

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
    price: 500,
    desc: "מכפיל סיכויים למדבקות נדירות — פועל אוטומטית בפתיחת התיבה הבאה",
  },
  skip: {
    title: "דילוג על שלב",
    emoji: "⏭️",
    rarity: "amazing",
    price: 250,
    desc: "דילוג על תרגיל קשה — כפתור ליד הרמז",
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
  /** שלב ההצטרפות נשמר כדי שחזרה מהתחברות תמשיך למבחן המיקום */
  onboardingStep: "name" | "auth" | "test";
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
  /** עולמות אלבום שכבר נגבה עליהם הפרס */
  albumWorlds: number[];
  /** תארים שהושגו מהשלמת עולמות */
  albumTitles: string[];
  /** גרסת מבנה הנתונים — מאפשרת עדכוני גרסה בלי לאבד התקדמות */
  schemaVersion: number;
  /** עולמות אלבום (100 מדבקות) שנגבה עליהם הפרס */
  albumWorlds100: number[];
  /** נתוני הורים: לפי נושא */
  topicStats: Record<string, { a: number; c: number }>;
  /** זמן משחק כולל בשניות */
  playSeconds: number;
  /** יומן יומי: תשובות, נכונות, שניות */
  dayLog: Record<string, { a: number; c: number; s: number }>;
  /** קוד הורים (4 ספרות) */
  parentCode: string;
  /** קוד אישי לשחקן בלי התחברות */
  guestCode: string;
  guestSecret: string;
};

const KEY = "math-journey-v1";

const todayKey = () => new Date().toISOString().slice(0, 10);
const monthKey = () => new Date().toISOString().slice(0, 7);

const defaultProfile: Profile = {
  onboarded: false,
  onboardingStep: "name",
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
  albumWorlds: [],
  albumTitles: [],
  schemaVersion: PROFILE_SCHEMA_VERSION,
  albumWorlds100: [],
  topicStats: {},
  playSeconds: 0,
  dayLog: {},
  parentCode: "",
  guestCode: "",
  guestSecret: "",
};

function trimDayLog(log: Profile["dayLog"]) {
  const keys = Object.keys(log).sort().slice(-30);
  return Object.fromEntries(keys.map((k) => [k, log[k] as { a: number; c: number; s: number }]));
}

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
    desc: "100-300 מטבעות · 4-8 רמזים · 5-7 מדבקות (לפחות 1 מדהימה)",
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
  /** שימוש בכרטיס (מזל / דילוג / מגן / שחזור) — מחזיר false אם אין */
  useTicket: (id: TicketId) => boolean;
  grantSticker: () => number | null;
  /** src: "free" = תיבה יומית · "inv" = מהמלאי · "coins" = קנייה במטבעות */
  openChest: (kind: ChestKind, src?: "free" | "inv" | "coins") => ChestReward | null;
  recordGameWin: (gameId: string) => void;
  markGameSeen: (gameId: string) => void;
  claimStreak: () => { coins: number } | null;
  /** גביית פרס השלמת עולם באלבום — פעם אחת לכל עולם */
  claimAlbumWorld: (worldId: number) => AlbumWorld["reward"] | null;
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
  restoreFromCode: (code: string) => Promise<boolean>;
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
  return collectableSlots(new Set(owned)).filter(
    (i) => !owned.includes(i) && (!rarity || stickerForSlot(i).rarity === rarity),
  );
}

// סיכויי נדירות לפי סוג התיבה: [נדיר, מדהים, אגדי]
const RARITY_ODDS: Record<"regular" | "amazing" | "legendary", [number, number]> = {
  regular: [0.9, 0.99],
  amazing: [0.55, 0.93],
  legendary: [0.3, 0.75],
};

function drawStickers(owned: number[], count: number, guaranteed?: Rarity, lucky = false, tier: "regular" | "amazing" | "legendary" = "regular") {
  const picked: number[] = [];
  const take = (rarity?: Rarity) => {
    const pool = freeSlots([...owned, ...picked], rarity);
    if (!pool.length) return;
    picked.push(pool[Math.floor(Math.random() * pool.length)] as number);
  };
  if (guaranteed) take(guaranteed);
  while (picked.length < count) {
    // מזל 🍀 מכפיל את הסיכוי למדבקות מדהימות ואגדיות
    const roll = Math.random();
    const [a, b] = RARITY_ODDS[tier];
    // מזל 🍀 מקטין את הסיכוי לנדיר רגיל לחצי
    const ra = lucky ? a / 2 : a;
    const rb = lucky ? ra + (b - a) * 1.5 : b;
    const rarity: Rarity = roll < ra ? "rare" : roll < rb ? "amazing" : "legendary";
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
    // איפוס כללי (השקה מחדש): מוחק נתונים מקומיים ומנתק את כולם פעם אחת
    try {
      const RESET_EPOCH = "2026-10-02";
      if (localStorage.getItem("mj:reset-epoch") !== RESET_EPOCH) {
        for (const k of Object.keys(localStorage)) {
          if (k.startsWith("math-journey") || k.startsWith("sb-")) localStorage.removeItem(k);
        }
        localStorage.setItem("mj:reset-epoch", RESET_EPOCH);
        void supabase.auth.signOut({ scope: "local" });
      }
    } catch {
      /* ignore */
    }
    try {
      const raw = localStorage.getItem(KEY);
      const parsed: Profile = raw
        ? { ...defaultProfile, ...(JSON.parse(raw) as Partial<Profile>) }
        : { ...defaultProfile, userId: rnd(3, 999) };
      parsed.tickets = { ...defaultProfile.tickets, ...(parsed.tickets ?? {}) };
      parsed.chestInv = { ...defaultProfile.chestInv, ...(parsed.chestInv ?? {}) };
      parsed.gameWins = { ...(parsed.gameWins ?? {}) };
      parsed.seenGames = parsed.seenGames ?? [];
      parsed.topicStats = parsed.topicStats ?? {};
      parsed.dayLog = parsed.dayLog ?? {};
      parsed.albumWorlds100 = parsed.albumWorlds100 ?? [];
      if (!parsed.trophies) parsed.trophies = parsed.totalCorrect;
      // עדכון גרסה משלים שדות חדשים בלבד — אף שדה קיים לא נמחק ולא מתאפס
      parsed.schemaVersion = PROFILE_SCHEMA_VERSION;
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
        setProfile((p) => {
          const name = data.display_name || cloud.name || p.name;
          // חשבון קיים עם שם — לא מחזירים אותו למסך ההרשמה
          const onboarded =
            Boolean(cloud.onboarded) ||
            (prevUid === authUid && p.onboarded) ||
            (Boolean(name) && name !== defaultProfile.name);
          return {
            ...defaultProfile,
            ...cloud,
            tickets: { ...defaultProfile.tickets, ...(cloud.tickets ?? {}) },
            boosts: { ...defaultProfile.boosts, ...(cloud.boosts ?? {}) },
            name,
            icon: data.icon || cloud.icon || p.icon,
            country: data.country || "IL",
            guest: false,
            onboarded,
            onboardingStep: onboarded ? "test" : (cloud.onboardingStep ?? "name"),
          };
        });
      } else if (prevUid && prevUid !== authUid) {
        // חשבון חדש שאין לו נתונים בענן
        setProfile((p) => {
          const fresh: Profile = {
            ...defaultProfile,
            soundOn: p.soundOn,
            name: data?.display_name || defaultProfile.name,
            icon: data?.icon || defaultProfile.icon,
            country: data?.country || "IL",
            guest: false,
          };
          // התקדמות אורח עוברת לחשבון החדש; התקדמות של חשבון אחר לא עוברת
          return p.guest && (hasProgress(p) || p.onboardingStep !== "name")
            ? mergeProfiles(fresh, p)
            : fresh;
        });
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

  /* ---------------- ניקוד מאומת בשרת + קוד אישי ---------------- */
  const PENDING_KEY = "math-journey:pending-answers";
  const pendingRef = useRef({ answered: 0, correct: 0 });
  const flushTimer = useRef<number | null>(null);
  const flushingRef = useRef(false);
  const submitAnswersFn = useServerFn(submitAnswers);
  const guestSyncFn = useServerFn(guestSync);
  const createGuestFn = useServerFn(createGuestPlayer);
  const guestClaimFn = useServerFn(guestClaim);
  const guestTransferFn = useServerFn(guestTransfer);

  const savePending = useCallback(() => {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(pendingRef.current));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (raw) {
        const v = JSON.parse(raw) as { answered?: number; correct?: number };
        pendingRef.current = { answered: Number(v.answered) || 0, correct: Number(v.correct) || 0 };
      }
    } catch {
      /* ignore */
    }
  }, []);

  const flushAnswers = useCallback(async () => {
    if (flushingRef.current || !navigator.onLine) return;
    const p = profileRef.current;
    const uid = authUidRef.current;
    if (!uid && !p.guestCode) return;
    flushingRef.current = true;
    try {
      while (true) {
        const pend = pendingRef.current;
        const batch = { answered: Math.min(120, pend.answered), correct: Math.min(120, pend.correct, Math.min(120, pend.answered)) };
        const cur = profileRef.current;
        if (uid) {
          if (!batch.answered) break;
          await submitAnswersFn({ data: batch });
        } else {
          const res = await guestSyncFn({
            data: {
              code: cur.guestCode,
              secret: cur.guestSecret,
              name: cur.name,
              icon: cur.icon,
              country: cur.country,
              data: JSON.parse(JSON.stringify({ ...cur, guestSecret: "" })),
              batch,
            },
          });
          if (!res.ok) break;
        }
        pendingRef.current = {
          answered: Math.max(0, pendingRef.current.answered - batch.answered),
          correct: Math.max(0, pendingRef.current.correct - batch.correct),
        };
        savePending();
        if (pendingRef.current.answered <= 0) break;
      }
    } catch (e) {
      console.error("score submit failed", e);
    } finally {
      flushingRef.current = false;
    }
  }, [submitAnswersFn, guestSyncFn, savePending]);

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) window.clearTimeout(flushTimer.current);
    flushTimer.current = window.setTimeout(() => void flushAnswers(), 2500);
  }, [flushAnswers]);

  useEffect(() => {
    const onOnline = () => void flushAnswers();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flushAnswers]);

  // שחקן בלי התחברות מקבל קוד אישי ונרשם לטבלת המובילים
  useEffect(() => {
    // רק מי שבחר במפורש "קוד אישי בלי התחברות" — לא בזמן שההתחברות עוד נטענת
    if (!ready || authUid || !profile.guest || !profile.onboarded || profile.guestCode) return;
    let cancelled = false;
    const t = window.setTimeout(async () => {
      if (authUidRef.current) return;
      try {
        const r = await createGuestFn({
          data: { name: profile.name, icon: profile.icon, country: profile.country },
        });
        if (cancelled || authUidRef.current) return;
        setProfile((p) => (p.guestCode ? p : { ...p, guestCode: r.code, guestSecret: r.secret }));
        // מעבירים את ההתקדמות הקיימת כנקודת פתיחה (עם תקרות השרת)
        window.setTimeout(() => void flushAnswers(), 500);
      } catch (e) {
        console.error("guest code failed", e);
      }
    }, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [ready, authUid, profile.onboarded, profile.guestCode, profile.name, profile.icon, profile.country, createGuestFn, flushAnswers]);

  // אחרי התחברות — ממזגים את הקוד האישי לחשבון
  useEffect(() => {
    if (!authUid || pulledRef.current !== authUid) return;
    const p = profileRef.current;
    if (!p.guestCode || !p.guestSecret) {
      void flushAnswers();
      return;
    }
    void (async () => {
      try {
        await flushAnswers();
        await guestClaimFn({ data: { code: p.guestCode, secret: p.guestSecret } });
      } catch (e) {
        console.error("guest claim failed", e);
      }
      setProfile((cur) => ({ ...cur, guestCode: "", guestSecret: "" }));
    })();
  }, [authUid, cloudSyncing, guestClaimFn, flushAnswers]);

  // שם/סמל של שחקן קוד מתעדכנים בטבלה
  useEffect(() => {
    if (authUid || !profile.guestCode) return;
    const t = window.setTimeout(() => void flushAnswers(), 1500);
    return () => window.clearTimeout(t);
  }, [authUid, profile.guestCode, profile.name, profile.icon, profile.country, flushAnswers]);

  const restoreFromCode = useCallback(
    async (code: string): Promise<boolean> => {
      try {
        const r = await guestTransferFn({ data: { code: code.trim().toUpperCase() } });
        if (!r.ok) return false;
        const cloud = JSON.parse(r.data || "{}") as Partial<Profile>;
        setProfile((p) => {
          const incoming: Profile = {
            ...defaultProfile,
            ...cloud,
            tickets: { ...defaultProfile.tickets, ...(cloud.tickets ?? {}) },
            boosts: { ...defaultProfile.boosts, ...(cloud.boosts ?? {}) },
            chestInv: { ...defaultProfile.chestInv, ...(cloud.chestInv ?? {}) },
            name: r.name,
            icon: r.icon,
            country: r.country,
            guestCode: code.trim().toUpperCase(),
            guestSecret: r.secret,
            onboarded: true,
            guest: p.guest,
          };
          return hasProgress(p) ? { ...mergeProfiles(incoming, p), guestCode: incoming.guestCode, guestSecret: r.secret } : incoming;
        });
        return true;
      } catch {
        return false;
      }
    },
    [guestTransferFn],
  );

  // זמן משחק (לנתוני הורים) — סופרים רק כשהמסך גלוי
  useEffect(() => {
    if (!ready) return;
    const t = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const dk = todayKey();
      setProfile((p) => {
        const dl = p.dayLog?.[dk] ?? { a: 0, c: 0, s: 0 };
        return {
          ...p,
          playSeconds: (p.playSeconds ?? 0) + 30,
          dayLog: trimDayLog({ ...(p.dayLog ?? {}), [dk]: { ...dl, s: dl.s + 30 } }),
        };
      });
    }, 30000);
    return () => window.clearInterval(t);
  }, [ready]);

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
          ? rnd(0, 2)
          : kind === "amazing"
            ? rnd(4, 8)
            : rnd(8, 15);
      const count = daily
        ? rnd(1, 2)
        : kind === "regular"
          ? rnd(1, 3)
          : kind === "amazing"
            ? rnd(5, 7)
            : rnd(8, 11);
      const guaranteed: Rarity | undefined =
        kind === "amazing" ? "amazing" : kind === "legendary" ? "legendary" : undefined;
      const picked = drawStickers(p.stickers, count, guaranteed, lucky, daily ? "regular" : kind);

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
      const r = Math.random();
      const ticket: TicketId | null = daily
        ? null
        : kind === "legendary"
          ? r < 0.45 ? "luck" : r < 0.9 ? "skip" : "shield"
          : kind === "amazing"
            ? r < 0.2 ? "luck" : r < 0.45 ? "skip" : r < 0.6 ? "shield" : null
            : r < 0.06 ? "luck" : r < 0.16 ? "skip" : null;

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
        tickets: (() => {
          const base = lucky ? { ...p.tickets, luck: p.tickets.luck - 1 } : { ...p.tickets };
          if (ticket) base[ticket] = base[ticket] + 1;
          return base;
        })(),
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

  const claimAlbumWorld = useCallback<Ctx["claimAlbumWorld"]>((worldId) => {
    let out: AlbumWorld["reward"] | null = null;
    setProfile((p) => {
      const world = ALBUM_WORLDS[worldId];
      if (!world) return p;
      if ((p.albumWorlds100 ?? []).includes(worldId)) return p;
      if (!worldProgress(world, new Set(p.stickers)).done) return p;
      const r = world.reward;
      out = r;
      const chestInv = r.chest
        ? { ...p.chestInv, [r.chest]: p.chestInv[r.chest] + (r.chestCount ?? 1) }
        : p.chestInv;
      return {
        ...p,
        albumWorlds100: [...(p.albumWorlds100 ?? []), worldId],
        albumTitles: Array.from(new Set([...(p.albumTitles ?? []), r.title])),
        coins: p.coins + r.coins,
        hints: p.hints + r.hints,
        trophies: p.trophies + r.trophies,
        chestInv,
        icons: r.icon && !p.icons.includes(r.icon) ? [...p.icons, r.icon] : p.icons,
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
      if (correctSinceSticker >= STICKER_EVERY) {
        correctSinceSticker -= STICKER_EVERY;
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



      const topic = op || "other";
      const ts = p.topicStats?.[topic] ?? { a: 0, c: 0 };
      const dk = todayKey();
      const dl = p.dayLog?.[dk] ?? { a: 0, c: 0, s: 0 };
      return {
        ...p,
        topicStats: { ...(p.topicStats ?? {}), [topic]: { a: ts.a + 1, c: ts.c + (correct ? 1 : 0) } },
        dayLog: trimDayLog({ ...(p.dayLog ?? {}), [dk]: { ...dl, a: dl.a + 1, c: dl.c + (correct ? 1 : 0) } }),
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
    pendingRef.current = {
      answered: pendingRef.current.answered + 1,
      correct: pendingRef.current.correct + (correct ? 1 : 0),
    };
    savePending();
    scheduleFlush();
    return { sticker, levelUp };
  }, [savePending, scheduleFlush]);

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

  const useTicket = useCallback((id: TicketId) => {
    const current = profileRef.current;
    if ((current.tickets[id] ?? 0) <= 0) return false;
    const next = {
      ...current,
      tickets: { ...current.tickets, [id]: current.tickets[id] - 1 },
    };
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
      useTicket,
      grantSticker,
      openChest,
      recordGameWin,
      markGameSeen,
      claimStreak,
      claimAlbumWorld,
      spinWheel,
      claimMission,
      missionProgress,
      unlockAchievement,
      sound,
      reset,
      restoreFromCode,
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
      useTicket,
      grantSticker,
      openChest,
      recordGameWin,
      markGameSeen,
      claimStreak,
      claimAlbumWorld,
      spinWheel,
      claimMission,
      missionProgress,
      unlockAchievement,
      sound,
      reset,
      restoreFromCode,
    ],
  );

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export function useGame() {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
