export type Topic = {
  id: string;
  title: string;
  emoji: string;
  text: string;
  example: string;
};

export const TOPICS: Topic[] = [
  {
    id: "add",
    title: "חיבור",
    emoji: "➕",
    text: "חיבור זה לחבר מספרים ביחד.",
    example: "3 + 2 = 5",
  },
  {
    id: "sub",
    title: "חיסור",
    emoji: "➖",
    text: "חיסור זה לקחת מספר אחד מהשני.",
    example: "5 − 2 = 3",
  },
  {
    id: "mul",
    title: "כפל",
    emoji: "✖️",
    text: "כפל זה חיבור חוזר.",
    example: "3 × 4 = 3+3+3+3 = 12",
  },
  {
    id: "div",
    title: "חילוק",
    emoji: "➗",
    text: "חילוק זה לחלק שווה בשווה.",
    example: "12 ÷ 3 = 4",
  },
  {
    id: "order",
    title: "סדר פעולות",
    emoji: "🔢",
    text: "קודם סוגריים, אחר כך כפל וחילוק, ואחר כך חיבור וחיסור.",
    example: "2 + 3 × 4 = 2 + 12 = 14",
  },
  {
    id: "frac",
    title: "שברים",
    emoji: "🍕",
    text: "שבר זה חלק ממשהו שלם.",
    example: "½ + ½ = 1",
  },
];

export const topicById = (id: string) => TOPICS.find((t) => t.id === id);
