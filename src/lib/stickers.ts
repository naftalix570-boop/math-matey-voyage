/** שלוש רמות מדבקות: נדיר (1) · מדהים (2) · אגדי (3) */
export type Rarity = "rare" | "amazing" | "legendary";

export type StickerDef = { emoji: string; name: string; rarity: Rarity };

export const RARITY_ORDER: Rarity[] = ["rare", "amazing", "legendary"];

export const RARITY_LABEL: Record<Rarity, string> = {
  rare: "נדיר",
  amazing: "מדהים",
  legendary: "אגדי",
};

export const RARITY_LEVEL: Record<Rarity, number> = {
  rare: 1,
  amazing: 2,
  legendary: 3,
};

/** רקע הכרטיס לפי דרגה */
export const RARITY_CARD: Record<Rarity, string> = {
  rare: "bg-gradient-to-b from-sky to-card border-primary/30",
  amazing: "bg-gradient-to-b from-progress/25 to-card border-progress/50",
  legendary: "bg-gradient-to-b from-gold/40 to-card border-warning/60 shadow-glow",
};

/** תג הדרגה */
export const RARITY_CLASS: Record<Rarity, string> = {
  rare: "bg-primary text-primary-foreground",
  amazing: "bg-progress text-white",
  legendary: "bg-warning text-warning-foreground",
};

export const RARITY_EMOJI: Record<Rarity, string> = {
  rare: "🔹",
  amazing: "💜",
  legendary: "👑",
};

export const STICKERS: StickerDef[] = [
  { emoji: "🍎", name: "תפוח", rarity: "rare" },
  { emoji: "⭐", name: "כוכב", rarity: "rare" },
  { emoji: "🍦", name: "גלידה", rarity: "rare" },
  { emoji: "🚀", name: "רקטה", rarity: "amazing" },
  { emoji: "🦕", name: "דינוזאור", rarity: "legendary" },
  { emoji: "🐱", name: "חתול", rarity: "rare" },
  { emoji: "🍌", name: "בננה", rarity: "rare" },
  { emoji: "🎈", name: "בלון", rarity: "rare" },
  { emoji: "🐞", name: "פרת משה", rarity: "rare" },
  { emoji: "🍩", name: "דונאט", rarity: "rare" },
  { emoji: "🐬", name: "דולפין", rarity: "amazing" },
  { emoji: "🎨", name: "צבעים", rarity: "rare" },
  { emoji: "🏀", name: "כדורסל", rarity: "rare" },
  { emoji: "🦄", name: "חד קרן", rarity: "amazing" },
  { emoji: "🐉", name: "דרקון", rarity: "legendary" },
  { emoji: "👑", name: "כתר", rarity: "legendary" },
  { emoji: "🌈", name: "קשת", rarity: "amazing" },
  { emoji: "🛸", name: "צלחת מעופפת", rarity: "amazing" },
  { emoji: "🐧", name: "פינגווין", rarity: "rare" },
  { emoji: "🍕", name: "פיצה", rarity: "rare" },
  { emoji: "⚡", name: "ברק", rarity: "amazing" },
  { emoji: "🏆", name: "גביע", rarity: "legendary" },
  { emoji: "🐢", name: "צב", rarity: "rare" },
  { emoji: "🌻", name: "חמנייה", rarity: "rare" },
  { emoji: "🎸", name: "גיטרה", rarity: "rare" },
  { emoji: "🦊", name: "שועל", rarity: "rare" },
  { emoji: "🐳", name: "לווייתן", rarity: "amazing" },
  { emoji: "💎", name: "יהלום", rarity: "legendary" },
  { emoji: "🍉", name: "אבטיח", rarity: "rare" },
  { emoji: "🎃", name: "דלעת", rarity: "rare" },
  { emoji: "🐝", name: "דבורה", rarity: "rare" },
  { emoji: "🚂", name: "רכבת", rarity: "rare" },
  { emoji: "🪐", name: "שבתאי", rarity: "amazing" },
  { emoji: "🧸", name: "דובי", rarity: "rare" },
  { emoji: "🍭", name: "סוכרייה", rarity: "rare" },
];

/** 70 slots mapped to sticker definitions */
export const ALBUM_SIZE = 70;

export function stickerForSlot(slot: number): StickerDef {
  return STICKERS[slot % STICKERS.length] as StickerDef;
}

export const ALL_SLOTS = Array.from({ length: ALBUM_SIZE }, (_, i) => i);

export function slotsByRarity(rarity: Rarity) {
  return ALL_SLOTS.filter((i) => stickerForSlot(i).rarity === rarity);
}

/* ============ עולמות האלבום ============
   האלבום מחולק לעולמות. כל עולם נפתח רק אחרי שהעולם שלפניו הושלם,
   והשלמתו מעניקה פרס גדול (פעם אחת). ככל שמתקדמים — קשה יותר והפרס גדול יותר. */

export type AlbumWorld = {
  id: number;
  name: string;
  emoji: string;
  /** תיאור קצר */
  subtitle: string;
  slots: number[];
  reward: {
    coins: number;
    hints: number;
    trophies: number;
    chest?: "regular" | "amazing" | "legendary";
    chestCount?: number;
    icon?: string;
    title: string;
  };
};

const WORLD_META = [
  { name: "עולם ההתחלה", emoji: "🌱", subtitle: "הצעדים הראשונים באוסף" },
  { name: "עולם החיות", emoji: "🐾", subtitle: "אוסף שדורש התמדה" },
  { name: "עולם החלל", emoji: "🚀", subtitle: "כאן זה כבר מאתגר" },
  { name: "עולם האש", emoji: "🔥", subtitle: "רק אספנים רציניים" },
  { name: "עולם האגדות", emoji: "👑", subtitle: "הפסגה של האלבום" },
] as const;

const WORLD_REWARDS: AlbumWorld["reward"][] = [
  { coins: 300, hints: 3, trophies: 10, title: "אספן מתחיל" },
  { coins: 800, hints: 5, trophies: 30, chest: "regular", chestCount: 1, title: "אספן מנוסה" },
  { coins: 2000, hints: 8, trophies: 80, chest: "amazing", chestCount: 1, title: "חוקר החלל" },
  {
    coins: 5000,
    hints: 12,
    trophies: 200,
    chest: "legendary",
    chestCount: 1,
    icon: "🔥",
    title: "אלוף האש",
  },
  {
    coins: 15000,
    hints: 25,
    trophies: 500,
    chest: "legendary",
    chestCount: 2,
    icon: "👑",
    title: "אגדת האלבום",
  },
];

const WORLD_COUNT = WORLD_META.length;
const WORLD_SLOTS = Math.ceil(ALBUM_SIZE / WORLD_COUNT);

export const ALBUM_WORLDS: AlbumWorld[] = WORLD_META.map((meta, i) => ({
  id: i,
  name: meta.name,
  emoji: meta.emoji,
  subtitle: meta.subtitle,
  slots: ALL_SLOTS.slice(i * WORLD_SLOTS, (i + 1) * WORLD_SLOTS),
  reward: WORLD_REWARDS[i] as AlbumWorld["reward"],
}));

export function worldProgress(world: AlbumWorld, owned: Set<number>) {
  const have = world.slots.filter((s) => owned.has(s)).length;
  return { have, total: world.slots.length, done: have === world.slots.length };
}

/** עולם פתוח אם הוא הראשון, או אם העולם שלפניו הושלם */
export function isWorldUnlocked(index: number, owned: Set<number>): boolean {
  if (index <= 0) return true;
  const prev = ALBUM_WORLDS[index - 1] as AlbumWorld;
  return worldProgress(prev, owned).done;
}
