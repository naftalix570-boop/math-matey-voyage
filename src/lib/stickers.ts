export type Rarity = "poor" | "common" | "good" | "epic";

export type StickerDef = { emoji: string; name: string; rarity: Rarity };

export const RARITY_LABEL: Record<Rarity, string> = {
  poor: "רגילה",
  common: "בינונית",
  good: "טובה",
  epic: "אגדית",
};

export const RARITY_CLASS: Record<Rarity, string> = {
  poor: "bg-muted text-foreground",
  common: "bg-sky text-white",
  good: "bg-success text-white",
  epic: "bg-warning text-white",
};

export const STICKERS: StickerDef[] = [
  { emoji: "🍎", name: "תפוח", rarity: "poor" },
  { emoji: "⭐", name: "כוכב", rarity: "common" },
  { emoji: "🍦", name: "גלידה", rarity: "common" },
  { emoji: "🚀", name: "רקטה", rarity: "good" },
  { emoji: "🦕", name: "דינוזאור", rarity: "epic" },
  { emoji: "🐱", name: "חתול", rarity: "poor" },
  { emoji: "🍌", name: "בננה", rarity: "poor" },
  { emoji: "🎈", name: "בלון", rarity: "poor" },
  { emoji: "🐞", name: "פרת משה", rarity: "poor" },
  { emoji: "🍩", name: "דונאט", rarity: "common" },
  { emoji: "🐬", name: "דולפין", rarity: "common" },
  { emoji: "🎨", name: "צבעים", rarity: "common" },
  { emoji: "🏀", name: "כדורסל", rarity: "common" },
  { emoji: "🦄", name: "חד קרן", rarity: "good" },
  { emoji: "🐉", name: "דרקון", rarity: "epic" },
  { emoji: "👑", name: "כתר", rarity: "epic" },
  { emoji: "🌈", name: "קשת", rarity: "good" },
  { emoji: "🛸", name: "צלחת מעופפת", rarity: "good" },
  { emoji: "🐧", name: "פינגווין", rarity: "poor" },
  { emoji: "🍕", name: "פיצה", rarity: "common" },
  { emoji: "⚡", name: "ברק", rarity: "good" },
  { emoji: "🏆", name: "גביע", rarity: "epic" },
  { emoji: "🐢", name: "צב", rarity: "poor" },
  { emoji: "🌻", name: "חמנייה", rarity: "poor" },
  { emoji: "🎸", name: "גיטרה", rarity: "common" },
  { emoji: "🦊", name: "שועל", rarity: "common" },
  { emoji: "🐳", name: "לווייתן", rarity: "good" },
  { emoji: "💎", name: "יהלום", rarity: "epic" },
  { emoji: "🍉", name: "אבטיח", rarity: "poor" },
  { emoji: "🎃", name: "דלעת", rarity: "common" },
  { emoji: "🐝", name: "דבורה", rarity: "poor" },
  { emoji: "🚂", name: "רכבת", rarity: "common" },
  { emoji: "🪐", name: "שבתאי", rarity: "good" },
  { emoji: "🧸", name: "דובי", rarity: "poor" },
  { emoji: "🍭", name: "סוכרייה", rarity: "poor" },
];

/** 70 slots (7x10) mapped to sticker definitions */
export const ALBUM_SIZE = 70;

export function stickerForSlot(slot: number): StickerDef {
  return STICKERS[slot % STICKERS.length] as StickerDef;
}
