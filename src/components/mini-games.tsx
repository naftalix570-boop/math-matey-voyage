import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/lib/game-state";
import { cn } from "@/lib/utils";
import { Confetti, Logo } from "@/components/effects";
import { makeOptions, makeQuestion, OP_SIGN, pick, type Op } from "@/lib/math";
import { ResultScreen, type QuizResult } from "@/components/quiz";

/* ---------------- Memory: match exercise to answer ---------------- */

type Card = { id: number; pairId: number; label: string };

export function MemoryGame() {
  const { profile, recordAnswer, sound } = useGame();
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [done, setDone] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);

  const build = useMemo(
    () => () => {
      const pairs = Array.from({ length: 6 }, (_, i) => makeQuestion(profile.level, undefined, 2));
      const list: Card[] = [];
      pairs.forEach((q, i) => {
        list.push({ id: i * 2, pairId: i, label: q.text });
        list.push({ id: i * 2 + 1, pairId: i, label: String(q.answer) });
      });
      return list.sort(() => Math.random() - 0.5);
    },
    [profile.level],
  );

  useEffect(() => {
    setCards(build());
  }, [build]);

  const restart = () => {
    setCards(build());
    setFlipped([]);
    setDone([]);
    setMoves(0);
    setResult(null);
  };

  const flip = (card: Card) => {
    if (flipped.length === 2 || flipped.includes(card.id) || done.includes(card.pairId)) return;
    sound("click");
    const next = [...flipped, card.id];
    setFlipped(next);
    if (next.length !== 2) return;
    setMoves((m) => m + 1);
    const [a, b] = next.map((id) => cards.find((c) => c.id === id)!);
    const hit = a && b && a.pairId === b.pairId;
    recordAnswer(!!hit, "mul");
    setTimeout(() => {
      if (hit) {
        sound("correct");
        const nextDone = [...done, a.pairId];
        setDone(nextDone);
        if (nextDone.length === 6) {
          sound("win");
          setResult({ correct: 6, total: 6, levelUp: false });
        }
      } else {
        sound("wrong");
      }
      setFlipped([]);
    }, 650);
  };

  if (result) return <ResultScreen {...result} onAgain={restart} />;

  return (
    <div className="pt-2">
      <Confetti show={done.length === 6} />
      <p className="mb-3 text-center font-bold text-ink">
        זוגות שנמצאו: {done.length}/6 · ניסיונות: {moves}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {cards.map((c) => {
          const open = flipped.includes(c.id) || done.includes(c.pairId);
          return (
            <button
              key={c.id}
              onClick={() => flip(c)}
              className={cn(
                "flex h-20 items-center justify-center rounded-xl text-xl font-bold transition-transform active:scale-95",
                done.includes(c.pairId)
                  ? "bg-success text-success-foreground"
                  : open
                    ? "bg-sky text-ink"
                    : "bg-primary text-primary-foreground",
              )}
            >
              {open ? c.label : "🃏"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Line match: tap exercise then its answer ---------------- */

export function LineMatchGame() {
  const { profile, recordAnswer, sound } = useGame();
  const [round, setRound] = useState(0);
  const [pairs, setPairs] = useState(() => buildPairs(profile.level));
  const [picked, setPicked] = useState<number | null>(null);
  const [solved, setSolved] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);

  function buildPairs(level: number) {
    const qs = Array.from({ length: 4 }, () => makeQuestion(level, undefined, 2));
    return {
      left: qs.map((q, i) => ({ i, text: q.text })),
      right: qs.map((q, i) => ({ i, text: String(q.answer) })).sort(() => Math.random() - 0.5),
    };
  }

  const restart = () => {
    setPairs(buildPairs(profile.level));
    setPicked(null);
    setSolved([]);
    setCorrect(0);
    setRound(0);
    setResult(null);
  };

  const chooseRight = (i: number) => {
    if (picked === null || solved.includes(i)) return;
    const hit = picked === i;
    recordAnswer(hit);
    sound(hit ? "correct" : "wrong");
    if (hit) {
      const nextSolved = [...solved, i];
      setSolved(nextSolved);
      setCorrect((c) => c + 1);
      if (nextSolved.length === 4) {
        if (round >= 2) {
          setResult({ correct: correct + 1, total: 12, levelUp: false });
        } else {
          setTimeout(() => {
            setRound((r) => r + 1);
            setPairs(buildPairs(profile.level));
            setSolved([]);
          }, 500);
        }
      }
    }
    setPicked(null);
  };

  if (result) return <ResultScreen {...result} onAgain={restart} />;

  return (
    <div className="pt-2">
      <p className="mb-3 text-center font-bold text-ink">סבב {round + 1}/3 — חבר תרגיל לתשובה</p>
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-2">
          {pairs.left.map((l) => (
            <button
              key={l.i}
              disabled={solved.includes(l.i)}
              onClick={() => {
                sound("click");
                setPicked(l.i);
              }}
              className={cn(
                "h-14 rounded-xl text-xl font-bold active:scale-95",
                solved.includes(l.i)
                  ? "bg-success text-success-foreground"
                  : picked === l.i
                    ? "bg-warning text-warning-foreground"
                    : "bg-primary text-primary-foreground",
              )}
            >
              {l.text}
            </button>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          {pairs.right.map((r) => (
            <button
              key={r.i}
              disabled={solved.includes(r.i)}
              onClick={() => chooseRight(r.i)}
              className={cn(
                "h-14 rounded-xl text-xl font-bold active:scale-95",
                solved.includes(r.i)
                  ? "bg-success text-success-foreground"
                  : "bg-sky text-ink",
              )}
            >
              {r.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Builder: build an exercise, then answer it ---------------- */

export function BuilderGame() {
  const { profile, recordAnswer, sound } = useGame();
  const [a, setA] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [b, setB] = useState<number | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [answer, setAnswer] = useState<number | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);

  const numbers = useMemo(
    () => Array.from({ length: 6 }, () => 1 + Math.floor(Math.random() * (3 + profile.level * 2))),
    [profile.level, round],
  );
  const ops: Op[] = ["add", "sub", "mul"];

  useEffect(() => {
    if (a === null || b === null || op === null) return;
    const value = op === "add" ? a + b : op === "sub" ? a - b : a * b;
    setAnswer(value);
    setOptions(makeOptions(value, 3));
  }, [a, b, op]);

  const reset = () => {
    setA(null);
    setB(null);
    setOp(null);
    setAnswer(null);
    setOptions([]);
    setChosen(null);
  };

  const answerIt = (value: number) => {
    if (chosen !== null || answer === null) return;
    setChosen(value);
    const hit = value === answer;
    recordAnswer(hit, op ?? undefined);
    sound(hit ? "correct" : "wrong");
    if (hit) setCorrect((c) => c + 1);
    setTimeout(() => {
      if (round >= 7) {
        setResult({ correct: correct + (hit ? 1 : 0), total: 8, levelUp: false });
      } else {
        setRound((r) => r + 1);
        reset();
      }
    }, 900);
  };

  if (result)
    return (
      <ResultScreen
        {...result}
        onAgain={() => {
          setResult(null);
          setRound(0);
          setCorrect(0);
          reset();
        }}
      />
    );

  return (
    <div className="pt-2">
      <p className="mb-3 text-center font-bold text-ink">תרגיל {round + 1}/8 — בנה תרגיל משלך</p>
      <div className="flex min-h-20 items-center justify-center gap-2 rounded-2xl bg-sky p-4 text-3xl font-bold text-ink shadow-card">
        <span>{a ?? "?"}</span>
        <span>{op ? OP_SIGN[op] : "?"}</span>
        <span>{b ?? "?"}</span>
        <span>=</span>
        <span>?</span>
      </div>

      {answer === null ? (
        <>
          <p className="mt-4 text-center font-bold">בחר מספרים</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {numbers.map((n, i) => (
              <button
                key={i}
                onClick={() => {
                  sound("click");
                  if (a === null) setA(n);
                  else if (op !== null && b === null) setB(n);
                }}
                className="h-12 rounded-xl bg-primary text-xl font-bold text-primary-foreground active:scale-95"
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-4 text-center font-bold">בחר פעולה</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {ops.map((o) => (
              <button
                key={o}
                onClick={() => {
                  sound("click");
                  if (a !== null) setOp(o);
                }}
                className="h-12 rounded-xl bg-warning text-2xl font-bold text-warning-foreground active:scale-95"
              >
                {OP_SIGN[o]}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mt-3 flex justify-center">
            <Logo size={64} bounce={correct} />
          </div>
          <div className="mt-2 grid gap-3">
            {options.map((o) => (
              <button
                key={o}
                onClick={() => answerIt(o)}
                className={cn(
                  "h-14 rounded-xl text-2xl font-bold active:scale-95",
                  chosen !== null && o === answer
                    ? "bg-success text-success-foreground"
                    : chosen === o
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-primary text-primary-foreground",
                )}
              >
                {o}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Flash: 60 second sprint ---------------- */

export function FlashGame() {
  const { profile, update, recordAnswer, sound, unlockAchievement } = useGame();
  const [time, setTime] = useState(60);
  const [score, setScore] = useState(0);
  const [q, setQ] = useState(() => makeQuestion(profile.level, undefined, 3));
  const [over, setOver] = useState(false);

  useEffect(() => {
    if (over) return;
    if (time <= 0) {
      setOver(true);
      sound("win");
      unlockAchievement("flash");
      update((p) => ({ bestFlash: Math.max(p.bestFlash, score) }));
      return;
    }
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [time, over, score, sound, update, unlockAchievement]);

  const answer = (value: number) => {
    const hit = value === q.answer;
    recordAnswer(hit, q.op);
    sound(hit ? "correct" : "wrong");
    if (hit) setScore((s) => s + 1);
    setQ(makeQuestion(profile.level, undefined, 3));
  };

  if (over)
    return (
      <div className="animate-pop mt-8 flex flex-col items-center gap-4 text-center">
        <Confetti show />
        <Logo size={110} bounce={1} />
        <h2 className="text-2xl font-bold text-ink">⚡ סיימת!</h2>
        <p className="text-lg">
          פתרת <span className="font-bold text-success">{score}</span> תרגילים ב-60 שניות
        </p>
        <p className="text-muted-foreground">שיא אישי: {Math.max(profile.bestFlash, score)}</p>
        <button
          onClick={() => {
            setOver(false);
            setScore(0);
            setTime(60);
            setQ(makeQuestion(profile.level, undefined, 3));
          }}
          className="h-12 w-full rounded-xl bg-primary text-lg font-bold text-primary-foreground active:scale-95"
        >
          שחק שוב
        </button>
      </div>
    );

  return (
    <div className="pt-2">
      <div className="mb-3 flex justify-between font-bold text-ink">
        <span>⚡ ניקוד: {score}</span>
        <span className={cn(time <= 10 && "text-destructive")}>⏱️ {time}</span>
      </div>
      <div className="flex min-h-32 items-center justify-center rounded-2xl bg-sky p-6 text-4xl font-bold text-ink shadow-card">
        {q.text}
      </div>
      <div className="mt-4 grid gap-3">
        {q.options.map((o) => (
          <button
            key={o}
            onClick={() => answer(o)}
            className="h-14 rounded-xl bg-primary text-2xl font-bold text-primary-foreground active:scale-95"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Placement test ---------------- */

export function PlacementTest({ onDone }: { onDone: (level: number) => void }) {
  const { sound } = useGame();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState(1);
  const [q, setQ] = useState(() => makeQuestion(1, undefined, 3));
  const [correct, setCorrect] = useState(0);

  const answer = (value: number) => {
    const hit = value === q.answer;
    sound(hit ? "correct" : "wrong");
    const nextLevel = hit ? Math.min(10, level + 1) : Math.max(1, level - 1);
    const nextCorrect = correct + (hit ? 1 : 0);
    if (step >= 9) {
      onDone(Math.max(1, Math.min(10, Math.round(1 + nextCorrect * 0.9))));
      return;
    }
    setCorrect(nextCorrect);
    setLevel(nextLevel);
    setStep((s) => s + 1);
    setQ(makeQuestion(nextLevel, pick<Op>(["add", "sub", "mul", "div"]), 3));
  };

  return (
    <div className="pt-2">
      <p className="mb-2 text-center font-bold text-ink">שאלה {step + 1} מתוך 10</p>
      <div className="mx-auto mb-4 h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-success transition-all"
          style={{ width: `${((step + 1) / 10) * 100}%` }}
        />
      </div>
      <div className="flex min-h-32 items-center justify-center rounded-2xl bg-sky p-6 text-4xl font-bold text-ink shadow-card">
        {q.text}
      </div>
      <div className="mt-4 grid gap-3">
        {q.options.map((o) => (
          <button
            key={o}
            onClick={() => answer(o)}
            className="h-14 rounded-xl bg-primary text-2xl font-bold text-primary-foreground active:scale-95"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
