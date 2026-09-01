export type Op = "add" | "sub" | "mul" | "div";

export type Question = {
  a: number;
  b: number;
  op: Op;
  text: string;
  answer: number;
  options: number[];
};

export const OP_SIGN: Record<Op, string> = {
  add: "+",
  sub: "−",
  mul: "×",
  div: "÷",
};

export const OP_NAME: Record<Op, string> = {
  add: "חיבור",
  sub: "חיסור",
  mul: "כפל",
  div: "חילוק",
};

const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

export const MAX_LEVEL = 10000;

/**
 * דירוג קושי עדין: 10,000 שלבים, כל שלב מוסיף מעט.
 * הקושי גדל בהדרגה ומתייצב בשלבים הגבוהים.
 */
function rangeFor(level: number) {
  const l = Math.max(1, Math.min(MAX_LEVEL, Math.round(level)));
  // התחלה קלה מאוד ועלייה איטית: שלב 1 = מספרים עד 5, שלב 10 ≈ עד 20
  const t = Math.log10(l + 1) / Math.log10(MAX_LEVEL + 1); // 0..1
  const max = Math.round(5 + Math.pow(t, 4) * 9995);
  const mulMax = Math.round(2 + Math.pow(t, 4.5) * 998);
  const digits = Math.min(4, 1 + Math.floor(Math.pow(t, 2) * 4));
  return { max: Math.max(5, max), mulMax: Math.max(2, mulMax), digits };
}


export function levelRangeLabel(level: number) {
  const { max, mulMax } = rangeFor(level);
  return `מספרים עד ${max.toLocaleString("he-IL")} · כפל עד ${mulMax.toLocaleString("he-IL")}`;
}

export function makeQuestion(level: number, op?: Op, optionCount = 3): Question {
  const { max, mulMax } = rangeFor(level);
  const chosen: Op = op ?? pick<Op>(["add", "sub", "mul", "div"]);
  let a = 0;
  let b = 0;
  let answer = 0;

  if (chosen === "add") {
    a = rnd(1, max);
    b = rnd(1, max);
    answer = a + b;
  } else if (chosen === "sub") {
    a = rnd(2, max);
    b = rnd(1, Math.max(1, max));
    // באג חיסור: המספר הראשון תמיד הגדול — התוצאה תמיד חיובית
    if (b > a) {
      const tmp = a;
      a = b;
      b = tmp;
    }
    if (a === b) b = Math.max(1, b - 1);
    answer = a - b;
  } else if (chosen === "mul") {
    a = rnd(2, mulMax);
    b = rnd(2, Math.max(2, Math.min(mulMax, Math.ceil(mulMax / 2))));
    answer = a * b;
  } else {
    b = rnd(2, Math.max(2, Math.min(20, mulMax)));
    answer = rnd(2, Math.max(2, Math.min(40, mulMax)));
    a = b * answer;
  }

  return {
    a,
    b,
    op: chosen,
    text: `${a} ${OP_SIGN[chosen]} ${b}`,
    answer,
    options: makeOptions(answer, optionCount),
  };
}

export function makeOptions(answer: number, count = 3): number[] {
  const set = new Set<number>([answer]);
  let guard = 0;
  while (set.size < count && guard++ < 300) {
    const delta = rnd(1, Math.max(3, Math.round(answer * 0.25) + 2));
    const candidate = Math.random() < 0.5 ? answer - delta : answer + delta;
    if (candidate > 0 && candidate !== answer) set.add(candidate);
  }
  while (set.size < count) set.add(answer + set.size);
  return [...set].sort(() => Math.random() - 0.5);
}

/** מצב "נכון / לא נכון" — מציגים תרגיל עם תשובה והמשתמש מחליט */
export type TrueFalseQuestion = { text: string; shown: number; isTrue: boolean };

export function makeTrueFalse(level: number): TrueFalseQuestion {
  const q = makeQuestion(level);
  const isTrue = Math.random() < 0.5;
  let shown = q.answer;
  if (!isTrue) {
    const delta = rnd(1, Math.max(2, Math.round(q.answer * 0.2) + 2));
    shown = Math.random() < 0.5 ? Math.max(1, q.answer - delta) : q.answer + delta;
    if (shown === q.answer) shown = q.answer + 1;
  }
  return { text: `${q.text} = ${shown}`, shown, isTrue: shown === q.answer };
}

export type StoryQuestion = { text: string; answer: number; options: number[] };

export function makeStory(level: number): StoryQuestion {
  const names = ["רוני", "דני", "מאיה", "יובל", "נועה", "איתי"];
  const items = ["תפוחים", "עפרונות", "בלונים", "מדבקות", "סוכריות", "כדורים"];
  const name = pick(names);
  const item = pick(items);
  const q = makeQuestion(level);
  const templates: Record<Op, string> = {
    add: `ל${name} יש ${q.a} ${item}. קיבל/ה עוד ${q.b}. כמה יש עכשיו?`,
    sub: `ל${name} יש ${q.a} ${item}. נתן/ה ${q.b} לחבר. כמה נשאר?`,
    mul: `ל${name} יש ${q.a} שקיות, בכל שקית ${q.b} ${item}. כמה יש בסך הכל?`,
    div: `ל${name} יש ${q.a} ${item} ורוצה לחלק אותם שווה בשווה ל-${q.b} חברים. כמה יקבל כל אחד?`,
  };
  return { text: templates[q.op], answer: q.answer, options: q.options };
}

export type TriviaQuestion = { text: string; answer: string; options: string[] };

export function makeTrivia(level: number): TriviaQuestion {
  const kind = pick(["bigger", "missing", "compare"]);
  if (kind === "bigger") {
    const a = makeQuestion(level).answer;
    let b = a;
    while (b === a) b = makeQuestion(level).answer;
    const opts = [String(a), String(b)].sort(() => Math.random() - 0.5);
    return { text: "איזה מספר גדול יותר?", answer: String(Math.max(a, b)), options: opts };
  }
  if (kind === "missing") {
    const q = makeQuestion(level, pick<Op>(["add", "sub"]));
    return {
      text: `${q.a} ${OP_SIGN[q.op]} ? = ${q.answer}`,
      answer: String(q.b),
      options: makeOptions(q.b, 4).map(String),
    };
  }
  const q1 = makeQuestion(level);
  let q2 = makeQuestion(level);
  while (q2.answer === q1.answer) q2 = makeQuestion(level);
  const winner = q1.answer > q2.answer ? q1 : q2;
  return {
    text: "איזה תרגיל נותן תוצאה גדולה יותר?",
    answer: winner.text,
    options: [q1.text, q2.text].sort(() => Math.random() - 0.5),
  };
}

export function hintFor(q: { a: number; b: number; op: Op; answer: number }): string {
  switch (q.op) {
    case "add":
      return `תוסיף ${q.b} ל-${q.a}. אפשר לספור קדימה: ${q.a} ... ${q.answer}.`;
    case "sub":
      return `תוריד ${q.b} מ-${q.a}. אפשר לספור אחורה עד ${q.answer}.`;
    case "mul":
      return `${q.a} × ${q.b} זה ${q.a} ועוד ${q.a}, ${q.b} פעמים = ${q.answer}.`;
    case "div":
      return `כמה פעמים ${q.b} נכנס ב-${q.a}? התשובה ${q.answer}.`;
  }
}
