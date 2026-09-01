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
