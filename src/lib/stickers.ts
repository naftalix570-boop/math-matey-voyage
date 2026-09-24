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

/* ============ 5 עולמות × 100 מדבקות ============
   כל עולם הוא אלבום שלם של 100 מדבקות עם נושא משלו.
   העולם הראשון משתמש במדבקות המקוריות, כך שכל מה שכבר נאסף נשמר במקומו. */

export const WORLD_SIZE = 100;
export const ALBUM_SIZE = WORLD_SIZE * 5;
/** מדבקה על כל X תשובות נכונות */
export const STICKER_EVERY = 20;

const W = (list: string, rarity: Rarity): StickerDef[] =>
  list.split(",").map((pair) => {
    const [emoji, name] = pair.split(":");
    return { emoji: emoji as string, name: name as string, rarity };
  });

const WORLD_STICKERS: StickerDef[][] = [
  STICKERS,
  [
    ...W("🐶:כלב,🐭:עכבר,🐹:אוגר,🐰:ארנב,🐻:דוב,🐼:פנדה,🐨:קואלה,🐯:נמר,🦁:אריה,🐮:פרה,🐷:חזיר,🐸:צפרדע,🐵:קוף,🐔:תרנגולת,🐤:אפרוח,🦆:ברווז,🦉:ינשוף,🐴:סוס,🐗:חזיר בר,🐺:זאב,🦋:פרפר,🐌:חילזון,🐙:תמנון,🦀:סרטן,🐠:דג", "rare"),
    ...W("🦒:ג'ירפה,🦓:זברה,🐘:פיל,🦛:היפופוטם,🦘:קנגורו,🦥:עצלן,🦦:לוטרה,🦩:פלמינגו,🦚:טווס,🦜:תוכי", "amazing"),
    ...W("🦈:כריש,🐅:טיגריס,🦅:עיט,🐊:תנין", "legendary"),
  ],
  [
    ...W("🌙:ירח,☀️:שמש,🌟:כוכב זוהר,☄️:שביט,🌍:כדור הארץ,🔭:טלסקופ,📡:צלחת לוויין,🌌:גלקסיה,🌑:ירח חדש,🌕:ירח מלא,🌠:כוכב נופל,🛰️:לוויין,👾:חייזר,🧑‍🚀:אסטרונאוט,🌒:סהר", "rare"),
    ...W("🪐:שבתאי,🚀:רקטה,🛸:עב\"ם,👽:חוצן,🌎:אמריקה מהחלל,🌏:אסיה מהחלל,🌖:ירח דועך", "amazing"),
    ...W("🌞:שמש זוהרת,💫:סחרחורת כוכבים,🕳️:חור שחור", "legendary"),
  ],
  [
    ...W("🔥:אש,🌋:הר געש,🧨:זיקוק,🎆:זיקוקים,🎇:נצנוץ,🕯️:נר,🌶️:פלפל חריף,🥵:חם,☀️:חום,🍳:מחבת,🏮:פנס,🧯:מטף,🚒:כבאית,🪵:בול עץ,🍖:על האש", "rare"),
    ...W("☄️:מטאור,💥:פיצוץ,⚡:ברק,🐲:ראש דרקון,🦂:עקרב,🌅:שקיעה,🔆:בוהק", "amazing"),
    ...W("🐉:דרקון אש,🐦‍🔥:עוף החול,👹:שד אש", "legendary"),
  ],
  [
    ...W("🧚:פיה,🧞:ג'יני,🧙:קוסם,🪄:שרביט,🏰:טירה,🗡️:חרב,🛡️:מגן,📜:מגילה,🔮:כדור בדולח,🧝:שדון,🧜:בת ים,🍄:פטרייה קסומה,🗝️:מפתח עתיק,🏹:קשת וחץ,⚔️:חרבות", "rare"),
    ...W("🦄:חד קרן,🧌:טרול,🐲:דרקון קטן,🧛:ערפד,🪽:כנפיים,💍:טבעת,🏺:כד עתיק", "amazing"),
    ...W("👑:כתר האגדה,💎:יהלום הנצח,🏆:גביע האלופים", "legendary"),
  ],
];

export function stickerForSlot(slot: number): StickerDef {
  const world = Math.min(4, Math.max(0, Math.floor(slot / WORLD_SIZE)));
  const list = WORLD_STICKERS[world] as StickerDef[];
  return list[(slot % WORLD_SIZE) % list.length] as StickerDef;
}

export const ALL_SLOTS = Array.from({ length: ALBUM_SIZE }, (_, i) => i);

export function slotsByRarity(rarity: Rarity) {
  return ALL_SLOTS.filter((i) => stickerForSlot(i).rarity === rarity);
}

/* ============ עולמות האלבום ============ */

export type AlbumWorld = {
  id: number;
  name: string;
  emoji: string;
  subtitle: string;
  /** מחלקות עיצוב לכל עולם */
  theme: string;
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
  { name: "עולם ההתחלה", emoji: "🌱", subtitle: "100 מדבקות ראשונות באוסף", theme: "bg-gradient-to-b from-sky to-card border-primary/40" },
  { name: "עולם החיות", emoji: "🐾", subtitle: "100 חיות מכל העולם", theme: "bg-gradient-to-b from-progress/25 to-card border-progress/50" },
  { name: "עולם החלל", emoji: "🚀", subtitle: "100 פלאי היקום", theme: "bg-gradient-to-b from-primary/25 to-card border-primary/60" },
  { name: "עולם האש", emoji: "🔥", subtitle: "100 מדבקות לוהטות", theme: "bg-gradient-to-b from-warning/35 to-card border-warning/60" },
  { name: "עולם האגדות", emoji: "👑", subtitle: "100 אגדות — הפסגה", theme: "bg-gradient-to-b from-gold/45 to-card border-warning/70" },
] as const;

const WORLD_REWARDS: AlbumWorld["reward"][] = [
  { coins: 2000, hints: 10, trophies: 100, chest: "regular", chestCount: 2, title: "אספן מתחיל" },
  { coins: 5000, hints: 20, trophies: 300, chest: "amazing", chestCount: 2, icon: "🐾", title: "מלך החיות" },
  { coins: 12000, hints: 35, trophies: 800, chest: "legendary", chestCount: 2, icon: "🚀", title: "חוקר החלל" },
  { coins: 30000, hints: 60, trophies: 2000, chest: "legendary", chestCount: 4, icon: "🔥", title: "אלוף האש" },
  { coins: 100000, hints: 150, trophies: 6000, chest: "legendary", chestCount: 10, icon: "👑", title: "אגדת האלבום" },
];

export const ALBUM_WORLDS: AlbumWorld[] = WORLD_META.map((meta, i) => ({
  id: i,
  name: meta.name,
  emoji: meta.emoji,
  subtitle: meta.subtitle,
  theme: meta.theme,
  slots: ALL_SLOTS.slice(i * WORLD_SIZE, (i + 1) * WORLD_SIZE),
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

/** מדבקות שנפתחו לאיסוף: רק עולמות פתוחים */
export function collectableSlots(owned: Set<number>): number[] {
  return ALBUM_WORLDS.filter((_, i) => isWorldUnlocked(i, owned)).flatMap((w) => w.slots);
}
