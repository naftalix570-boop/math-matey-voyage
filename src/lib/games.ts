export type GameId =
  | "line-match"
  | "truefalse"
  | "flash"
  | "clouds"
  | "memory"
  | "time-battle"
  | "topic"
  | "weekly"
  | "trivia"
  | "superbrain"
  | "chain"
  | "tower"
  | "fort"
  | "builder"
  | "story";

export type GameDef = {
  id: GameId;
  title: string;
  emoji: string;
  desc: string;
};

export const GAMES: GameDef[] = [
  { id: "line-match", title: "התאמת קו", emoji: "🪢", desc: "מושכים קו מהתרגיל לתשובה" },
  { id: "truefalse", title: "נכון / לא נכון", emoji: "✅", desc: "מוצג תרגיל עם תשובה — אתם מחליטים" },
  { id: "flash", title: "אתגר מהירות", emoji: "⚡", desc: "60 שניות – כמה שיותר תרגילים" },
  { id: "clouds", title: "מסלול עננים", emoji: "☁️", desc: "קופצים ענן קדימה בכל תשובה נכונה" },
  { id: "memory", title: "זיכרון חשבוני", emoji: "🃏", desc: "מוצאים זוגות של תרגיל ותשובה" },
  { id: "time-battle", title: "קרב מול הזמן", emoji: "⏱️", desc: "10 שניות לכל תרגיל" },
  { id: "topic", title: "ברירת נושא", emoji: "🎯", desc: "בוחרים נושא ומתאמנים" },
  { id: "weekly", title: "אתגר שבועי", emoji: "📅", desc: "אתגר חדש כל שבוע" },
  { id: "trivia", title: "טריוויה חשבונית", emoji: "❓", desc: "שאלות השוואה והשלמה" },
  { id: "superbrain", title: "סופר מוח", emoji: "🧠", desc: "התרגיל נעלם – עונים מהזיכרון" },
  { id: "chain", title: "אתגר שרשרת", emoji: "🔗", desc: "כל תוצאה מובילה לתרגיל הבא" },
  { id: "tower", title: "מגדל המספרים", emoji: "🏗️", desc: "בונים מגדל של 10 קומות" },
  { id: "fort", title: "הגנת המבצר", emoji: "🏰", desc: "שומרים על המגנים" },
  { id: "builder", title: "בונה התרגילים", emoji: "🧩", desc: "בונים תרגיל ומנחשים תוצאה" },
  { id: "story", title: "סיפור חשבוני", emoji: "📖", desc: "פותרים בעיות מילוליות" },
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);

export function weeklyChallenge() {
  const now = new Date();
  const week = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 86400000),
  );
  const list = [
    "לפתור 20 תרגילים ברצף בלי טעות",
    "לפתור 15 תרגילי כפל נכון",
    "לסיים 12 תרגילים עם לכל היותר טעות אחת",
    "לפתור 18 תרגילי חיבור וחיסור נכון",
  ];
  const goals = [20, 15, 12, 18];
  const idx = week % list.length;
  return {
    weekKey: `${now.getFullYear()}-W${week}`,
    text: list[idx] as string,
    goal: goals[idx] as number,
  };
}
