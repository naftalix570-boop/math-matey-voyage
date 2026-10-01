import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/lib/game-state";
import { cn } from "@/lib/utils";
import { Confetti, Logo } from "@/components/effects";
import { makeOptions, makeQuestion, makeTrueFalse, OP_SIGN, pick, type Op } from "@/lib/math";
import { ResultScreen, type QuizResult } from "@/components/quiz";
import { useExitLock } from "@/lib/exit-lock";

/* ---------------- Memory: match exercise to answer ---------------- */

type Card = { id: number; pairId: number; label: string };

export function MemoryGame() {
  const { profile, recordAnswer, sound } = useGame();
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [done, setDone] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const coinsStart = useRef(profile.coins);

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
    coinsStart.current = profile.coins;
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
          setResult({ correct: 6, total: 6, levelUp: false, coinsStart: coinsStart.current });
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
              <span dir="ltr">{open ? c.label : "🃏"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Line match: drag a real line from exercise to answer ---------------- */

export function LineMatchGame() {
  const { profile, recordAnswer, sound } = useGame();
  const [round, setRound] = useState(0);
  const [pairs, setPairs] = useState(() => buildPairs(profile.level));
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [solved, setSolved] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const coinsStart = useRef(profile.coins);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const nodes = useRef<Record<string, HTMLElement | null>>({});

  function buildPairs(level: number) {
    const qs = Array.from({ length: 4 }, () => makeQuestion(level, undefined, 2));
    return {
      left: qs.map((q, i) => ({ i, text: q.text })),
      right: qs.map((q, i) => ({ i, text: String(q.answer) })).sort(() => Math.random() - 0.5),
    };
  }

  const restart = () => {
    coinsStart.current = profile.coins;
    setPairs(buildPairs(profile.level));
    setDragFrom(null);
    setCursor(null);
    setSolved([]);
    setCorrect(0);
    setRound(0);
    setResult(null);
  };

  const center = (key: string) => {
    const el = nodes.current[key];
    const board = boardRef.current;
    if (!el || !board) return null;
    const r = el.getBoundingClientRect();
    const b = board.getBoundingClientRect();
    return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 };
  };

  const toLocal = (e: { clientX: number; clientY: number }) => {
    const b = boardRef.current?.getBoundingClientRect();
    if (!b) return null;
    return { x: e.clientX - b.left, y: e.clientY - b.top };
  };

  const finishRound = (nextSolved: number[], nextCorrect: number) => {
    if (nextSolved.length < 4) return;
    if (round >= 2) {
      setResult({ correct: nextCorrect, total: 12, levelUp: false, coinsStart: coinsStart.current });
    } else {
      setTimeout(() => {
        setRound((r) => r + 1);
        setPairs(buildPairs(profile.level));
        setSolved([]);
      }, 500);
    }
  };

  const drop = (e: React.PointerEvent) => {
    const from = dragFrom;
    setDragFrom(null);
    setCursor(null);
    if (from === null) return;
    const target = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest("[data-right]") as HTMLElement | null;
    if (!target) return;
    const i = Number(target.dataset["right"]);
    if (solved.includes(i)) return;
    const hit = from === i;
    recordAnswer(hit);
    sound(hit ? "correct" : "wrong");
    if (hit) {
      const nextSolved = [...solved, i];
      const nextCorrect = correct + 1;
      setSolved(nextSolved);
      setCorrect(nextCorrect);
      finishRound(nextSolved, nextCorrect);
    }
  };

  if (result) return <ResultScreen {...result} onAgain={restart} />;

  const liveFrom = dragFrom !== null ? center(`l${dragFrom}`) : null;

  return (
    <div className="pt-2">
      <p className="mb-3 text-center font-bold text-ink">
        סבב {round + 1}/3 — משכו קו מהתרגיל לתשובה
      </p>
      <div
        ref={boardRef}
        className="relative flex touch-none gap-3"
        onPointerMove={(e) => {
          if (dragFrom === null) return;
          const p = toLocal(e);
          if (p) setCursor(p);
        }}
        onPointerUp={drop}
        onPointerCancel={() => {
          setDragFrom(null);
          setCursor(null);
        }}
      >
        <svg className="pointer-events-none absolute inset-0 size-full">
          {solved.map((i) => {
            const a = center(`l${i}`);
            const b = center(`r${i}`);
            if (!a || !b) return null;
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className="stroke-success"
                strokeWidth={4}
                strokeLinecap="round"
              />
            );
          })}
          {liveFrom && cursor && (
            <line
              x1={liveFrom.x}
              y1={liveFrom.y}
              x2={cursor.x}
              y2={cursor.y}
              className="stroke-primary"
              strokeWidth={4}
              strokeDasharray="8 6"
              strokeLinecap="round"
            />
          )}
        </svg>

        <div className="flex flex-1 flex-col gap-2">
          {pairs.left.map((l) => (
            <div
              key={l.i}
              ref={(el) => {
                nodes.current[`l${l.i}`] = el;
              }}
              onPointerDown={(e) => {
                if (solved.includes(l.i)) return;
                (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
                sound("click");
                setDragFrom(l.i);
                const p = toLocal(e);
                if (p) setCursor(p);
              }}
              className={cn(
                "flex h-14 select-none items-center justify-center rounded-xl text-xl font-bold",
                solved.includes(l.i)
                  ? "bg-success text-success-foreground"
                  : dragFrom === l.i
                    ? "bg-warning text-warning-foreground"
                    : "bg-primary text-primary-foreground",
              )}
            >
              <span dir="ltr">{l.text}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          {pairs.right.map((r) => (
            <div
              key={r.i}
              data-right={r.i}
              ref={(el) => {
                nodes.current[`r${r.i}`] = el;
              }}
              className={cn(
                "flex h-14 select-none items-center justify-center rounded-xl text-xl font-bold",
                solved.includes(r.i) ? "bg-success text-success-foreground" : "bg-sky text-ink",
              )}
            >
              {r.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- True / False ---------------- */

export function TrueFalseGame() {
  const { profile, recordAnswer, sound } = useGame();
  const [q, setQ] = useState<{ text: string; isTrue: boolean } | null>(null);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<"ok" | "bad" | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const coinsStart = useRef(profile.coins);

  useEffect(() => {
    setQ(makeTrueFalse(profile.level));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, profile.level]);

  const answer = (choice: boolean) => {
    if (!q || feedback) return;
    const hit = choice === q.isTrue;
    recordAnswer(hit);
    sound(hit ? "correct" : "wrong");
    setFeedback(hit ? "ok" : "bad");
    if (hit) setCorrect((c) => c + 1);
    setTimeout(() => {
      setFeedback(null);
      if (idx >= 9)
        setResult({ correct: correct + (hit ? 1 : 0), total: 10, levelUp: false, coinsStart: coinsStart.current });
      else setIdx((i) => i + 1);
    }, 700);
  };

  if (result)
    return (
      <ResultScreen
        {...result}
        onAgain={() => {
          coinsStart.current = profile.coins;
          setIdx(0);
          setCorrect(0);
          setResult(null);
        }}
      />
    );

  return (
    <div className="pt-4">
      <p className="text-center font-bold text-muted-foreground">תרגיל {idx + 1}/10</p>
      <div dir="ltr"
        className={cn(
          "mt-4 flex h-40 items-center justify-center rounded-2xl text-4xl font-bold shadow-card transition-colors",
          feedback === "ok"
            ? "bg-success text-success-foreground"
            : feedback === "bad"
              ? "bg-destructive text-destructive-foreground"
              : "bg-card text-ink",
        )}
      >
        {q?.text ?? "…"}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 pb-28">
        <button
          onClick={() => answer(true)}
          className="h-20 rounded-2xl bg-success text-2xl font-bold text-success-foreground active:scale-95"
        >
          ✅ נכון
        </button>
        <button
          onClick={() => answer(false)}
          className="h-20 rounded-2xl bg-destructive text-2xl font-bold text-destructive-foreground active:scale-95"
        >
          ❌ לא נכון
        </button>
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
  const coinsStart = useRef(profile.coins);

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
        setResult({ correct: correct + (hit ? 1 : 0), total: 8, levelUp: false, coinsStart: coinsStart.current });
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
      <div dir="ltr" className="flex min-h-20 items-center justify-center gap-2 rounded-2xl bg-sky p-4 text-3xl font-bold text-ink shadow-card">
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

const FLASH_SECONDS = 60;
const FLASH_HEARTS = 10;

export function FlashGame() {
  const { profile, update, recordAnswer, sound, unlockAchievement } = useGame();
  const [deadline, setDeadline] = useState(() => Date.now() + FLASH_SECONDS * 1000);
  const [time, setTime] = useState(FLASH_SECONDS);
  const [hearts, setHearts] = useState(FLASH_HEARTS);
  const [score, setScore] = useState(0);
  const [q, setQ] = useState(() => makeQuestion(profile.level, undefined, 3));
  const [over, setOver] = useState(false);
  const coinsStart = useRef(profile.coins);

  useExitLock(!over, "אי אפשר לצאת באמצע אתגר המהירות ⚡");

  const finish = useRef(false);
  useEffect(() => {
    if (over) return;
    // טיימר מדויק לפי חותמת זמן — לא מתאפס בכל תשובה
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTime(left);
      if (left <= 0 && !finish.current) {
        finish.current = true;
        setOver(true);
      }
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [deadline, over]);

  useEffect(() => {
    if (!over) return;
    sound("win");
    unlockAchievement("flash");
    update((p) => ({ bestFlash: Math.max(p.bestFlash, score) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  const answer = (value: number) => {
    if (over) return;
    const hit = value === q.answer;
    recordAnswer(hit, q.op);
    sound(hit ? "correct" : "wrong");
    if (hit) setScore((s) => s + 1);
    else {
      const left = hearts - 1;
      setHearts(left);
      if (left <= 0) {
        finish.current = true;
        setOver(true);
        return;
      }
    }
    setQ(makeQuestion(profile.level, undefined, 3));
  };

  const restart = () => {
    coinsStart.current = profile.coins;
    finish.current = false;
    setOver(false);
    setScore(0);
    setHearts(FLASH_HEARTS);
    setDeadline(Date.now() + FLASH_SECONDS * 1000);
    setTime(FLASH_SECONDS);
    setQ(makeQuestion(profile.level, undefined, 3));
  };

  if (over)
    return (
      <div className="animate-pop mt-8 flex flex-col items-center gap-4 text-center">
        <Confetti show />
        <Logo size={110} bounce={1} />
        <h2 className="text-2xl font-bold text-ink">⚡ סיימת!</h2>
        <p className="text-lg">
          פתרת <span className="font-bold text-success">{score}</span> תרגילים
          {hearts <= 0 ? " — נגמרו הלבבות 💔" : " ב-60 שניות"}
        </p>
        <p className="text-muted-foreground">שיא אישי: {Math.max(profile.bestFlash, score)}</p>
        <p className="font-bold text-ink">
          🪙 +{Math.max(0, profile.coins - coinsStart.current)} · 🏆 +{score}
        </p>
        <button
          onClick={restart}
          className="h-12 w-full rounded-xl bg-primary text-lg font-bold text-primary-foreground active:scale-95"
        >
          שחק שוב
        </button>
      </div>
    );

  return (
    <div className="pt-2">
      <div className="mb-3 flex items-center justify-between font-bold text-ink">
        <span>⚡ {score}</span>
        <span aria-label={`${hearts} לבבות`}>
          {"❤️".repeat(Math.min(hearts, 5))}
          {hearts > 5 && <span className="text-sm"> ×{hearts}</span>}
        </span>
        <span className={cn(time <= 10 && "text-destructive")}>⏱️ {time}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-200"
          style={{ width: `${(time / FLASH_SECONDS) * 100}%` }}
        />
      </div>
      <div dir="ltr" className="mt-3 flex min-h-32 items-center justify-center rounded-2xl bg-sky p-6 text-4xl font-bold text-ink shadow-card">
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
      <p className="mt-3 pb-28 text-center text-xs text-muted-foreground">
        אי אפשר לצאת עד שהזמן נגמר או שנגמרים הלבבות
      </p>
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
      <div dir="ltr" className="flex min-h-32 items-center justify-center rounded-2xl bg-sky p-6 text-4xl font-bold text-ink shadow-card">
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
