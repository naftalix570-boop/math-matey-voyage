import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, HelpCircle, Lightbulb, Timer } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useGame } from "@/lib/game-state";
import { cn } from "@/lib/utils";
import { Confetti, Logo, Sparkles } from "@/components/effects";
import { TOPICS } from "@/lib/explanations";

export type QuizItem = {
  display: string;
  answer: string | number;
  options: (string | number)[];
  hint: string;
  op?: string;
  topicId?: string;
};

export type QuizVariant = "plain" | "clouds" | "tower" | "fort" | "chain" | "superbrain";

export type QuizResult = {
  correct: number;
  total: number;
  levelUp: boolean;
  coinsStart?: number;
};

/** ספירה מונפשת של מספר מ-0 עד value */
function useCountUp(value: number, ms = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (value <= 0) return setN(0);
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / ms);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p >= 1) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [value, ms]);
  return n;
}


export function TopicHelpSheet({
  topicId,
  open,
  onClose,
}: {
  topicId?: string | undefined;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  const topics = topicId ? TOPICS.filter((t) => t.id === topicId) : TOPICS;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4" dir="rtl">
      <div className="animate-pop w-full max-w-lg rounded-2xl bg-card p-5 shadow-card">
        <h3 className="mb-3 text-xl font-bold text-ink">{t("quiz.explain")}</h3>
        <div className="space-y-3">
          {topics.map((t) => (
            <div key={t.id} className="rounded-xl bg-sky p-3">
              <p className="font-bold text-ink">
                {t.emoji} {t.title}
              </p>
              <p className="text-sm">{t.text}</p>
              <p className="mt-1 font-bold text-primary">{t.example}</p>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 h-12 w-full rounded-xl bg-primary text-lg font-bold text-primary-foreground active:scale-95"
        >
          {t("common.gotIt")}
        </button>
      </div>
    </div>
  );
}

function Toast({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="animate-pop fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm rounded-xl bg-nav px-4 py-3 text-center text-nav-foreground">
      {text}
    </div>
  );
}

export function ResultScreen({
  correct,
  total,
  levelUp,
  coinsStart,
  onAgain,
}: QuizResult & { onAgain: () => void }) {
  const { profile } = useGame();
  const { t } = useI18n();
  const success = correct >= Math.ceil(total * 0.6);
  const coinsEarned = Math.max(0, profile.coins - (coinsStart ?? profile.coins));
  const coinsAnim = useCountUp(coinsEarned);
  const trophyAnim = useCountUp(correct);
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const text = `🎉 ${profile.name} פתר ${correct}/${total} נכון במסע המתמטיקס! שלב ${profile.level} עם ${profile.trophies} גביעים 🏆 בואו לשחק!`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "מסע המתמטיקס", text });
        return;
      } catch {
        /* cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      prompt("העתיקו ושתפו:", text);
    }
  };
  return (
    <div className="animate-pop mt-8 flex flex-col items-center gap-4 text-center">
      <Confetti show={success} />
      <Logo size={110} bounce={1} />
      <h2 className="text-2xl font-bold text-ink">
        {success ? t("quiz.great") : t("quiz.almost")}
      </h2>
      <p className="text-lg">{t("quiz.correctOf", { a: correct, b: total })}</p>

      <div className="grid w-full grid-cols-2 gap-3">
        <div className="animate-bounce-up rounded-2xl bg-card p-4 shadow-card">
          <div className="text-3xl">🪙</div>
          <div className="text-2xl font-bold text-ink">+{coinsAnim}</div>
          <div className="text-xs text-muted-foreground">{t("stat.coins")}</div>
        </div>
        <div className="animate-bounce-up rounded-2xl bg-card p-4 shadow-card">
          <div className="text-3xl">🏆</div>
          <div className="text-2xl font-bold text-ink">+{trophyAnim}</div>
          <div className="text-xs text-muted-foreground">{t("stat.trophies")}</div>
        </div>
      </div>

      {levelUp && (
        <div className="rounded-xl bg-sky px-4 py-3 font-bold text-ink">
          {t("quiz.levelUp")}
        </div>
      )}
      <p className="text-muted-foreground">
        {success ? t("quiz.encourageGood") : t("quiz.encourageBad")}
      </p>
      <div className="flex w-full flex-col gap-2">
        <button
          onClick={share}
          className="h-12 w-full rounded-xl bg-warning text-lg font-bold text-warning-foreground active:scale-95"
        >
          {copied ? t("quiz.copied") : t("quiz.share")}
        </button>

        <button
          onClick={onAgain}
          className="h-12 w-full rounded-xl bg-primary text-lg font-bold text-primary-foreground active:scale-95"
        >
          {t("common.playAgain")}
        </button>
        <Link
          to="/games"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-secondary text-lg font-bold text-secondary-foreground active:scale-95"
        >
          {t("common.gamesList")}
        </Link>
      </div>
    </div>
  );
}

export function QuizGame({
  makeItem,
  count = 10,
  timerSec = 10,
  hearts: heartsMax = 3,
  variant = "plain",
  topicId,
  gameId,
  onDone,
}: {
  makeItem: (index: number, prevAnswer: number | null) => QuizItem;
  count?: number;
  timerSec?: number;
  hearts?: number;
  variant?: QuizVariant;
  topicId?: string;
  gameId?: string;
  onDone?: (r: QuizResult) => void;
}) {
  const { profile, recordAnswer, useHint, sound, premium, recordGameWin } = useGame();
  const [index, setIndex] = useState(0);
  const [item, setItem] = useState<QuizItem>(() => makeItem(0, null));
  const [correct, setCorrect] = useState(0);
  const [hearts, setHearts] = useState(heartsMax);
  const [time, setTime] = useState(timerSec);
  const [toast, setToast] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [chosen, setChosen] = useState<string | number | null>(null);
  const [sparks, setSparks] = useState(0);
  const [bounce, setBounce] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [hidden, setHidden] = useState(variant === "superbrain");
  const [towers, setTowers] = useState(variant === "fort" ? 3 : 0);
  const [finished, setFinished] = useState<QuizResult | null>(null);
  const levelUpRef = useRef(false);
  const coinsStartRef = useRef(profile.coins);


  const showToast = useCallback((text: string, ms = 2000) => {
    setToast(text);
    setTimeout(() => setToast(null), ms);
  }, []);

  const finish = useCallback(
    (finalCorrect: number) => {
      const res = {
        correct: finalCorrect,
        total: count,
        levelUp: levelUpRef.current,
        coinsStart: coinsStartRef.current,
      };

      const won = finalCorrect >= count * 0.8;
      sound(finalCorrect >= count * 0.6 ? "win" : "click");
      if (won && gameId) recordGameWin(gameId);
      setFinished(res);
      onDone?.(res);
    },
    [count, onDone, sound, gameId, recordGameWin],
  );

  const nextQuestion = useCallback(
    (nextIndex: number, prev: number | null, currentCorrect: number) => {
      if (nextIndex >= count) {
        finish(currentCorrect);
        return;
      }
      setIndex(nextIndex);
      setItem(makeItem(nextIndex, prev));
      setChosen(null);
      setLocked(false);
      setHintText(null);
      setTime(timerSec);
      if (variant === "superbrain") setHidden(false);
    },
    [count, finish, makeItem, timerSec, variant],
  );

  // superbrain: hide the exercise after 3 seconds
  useEffect(() => {
    if (variant !== "superbrain" || finished) return;
    setHidden(false);
    const t = setTimeout(() => setHidden(true), 3000);
    return () => clearTimeout(t);
  }, [index, variant, finished]);

  const handleAnswer = useCallback(
    (value: string | number | null) => {
      if (locked || finished) return;
      setLocked(true);
      setChosen(value);
      const isCorrect = value !== null && String(value) === String(item.answer);
      const { levelUp } = recordAnswer(isCorrect, item.op);
      if (levelUp) levelUpRef.current = true;
      const nextCorrect = correct + (isCorrect ? 1 : 0);

      if (isCorrect) {
        sound("correct");
        setSparks((s) => s + 1);
        setBounce((b) => b + 1);
        setCorrect(nextCorrect);
        setWrongStreak(0);
        if (variant === "fort") setTowers((t) => Math.min(5, t + 1));
        if (variant === "tower") setTowers((t) => t + 1);
      } else {
        sound("wrong");
        const ws = wrongStreak + 1;
        setWrongStreak(ws);
        showToast(
          value === null
            ? `⏰ נגמר הזמן! התשובה הנכונה היא ${item.answer}`
            : `❌ אופס! התשובה הנכונה היא ${item.answer}`,
        );
        if (ws >= 3) setTimeout(() => setShowHelp(true), 800);
        if (variant === "fort" || variant === "tower") setTowers((t) => t - 1);
        if (variant === "chain") {
          setTimeout(() => finish(nextCorrect), 1200);
          return;
        }
        if (heartsMax > 0) {
          const left = hearts - 1;
          setHearts(left);
          if (left <= 0) {
            setTimeout(() => finish(nextCorrect), 1200);
            return;
          }
        }
        if (variant === "tower" && towers - 1 < 0) {
          setTimeout(() => finish(nextCorrect), 1200);
          return;
        }
      }

      setTimeout(
        () => nextQuestion(index + 1, Number(item.answer), nextCorrect),
        isCorrect ? 650 : 1400,
      );
    },
    [
      locked,
      finished,
      item,
      recordAnswer,
      correct,
      sound,
      variant,
      wrongStreak,
      showToast,
      heartsMax,
      hearts,
      towers,
      nextQuestion,
      index,
      finish,
    ],
  );

  // timer
  useEffect(() => {
    if (!timerSec || locked || finished) return;
    if (time <= 0) {
      handleAnswer(null);
      return;
    }
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [time, timerSec, locked, finished, handleAnswer]);

  const onHint = () => {
    if (hintText) return;
    if (!useHint()) {
      showToast("💡 אין כרגע רמזים. תוכל לרכוש חבילה בחנות!", 3000);
      return;
    }
    sound("click");
    setHintText(item.hint);
  };

  const restart = () => {
    levelUpRef.current = false;
    coinsStartRef.current = profile.coins;

    setFinished(null);
    setCorrect(0);
    setHearts(heartsMax);
    setTowers(variant === "fort" ? 3 : 0);
    setWrongStreak(0);
    nextQuestion(0, null, 0);
  };

  const board = useMemo(() => {
    if (variant === "clouds")
      return (
        <div className="mb-3 flex flex-row-reverse items-center justify-center gap-1 text-2xl">
          {Array.from({ length: count }).map((_, i) => (
            <span key={i} className={i < correct ? "opacity-100" : "opacity-30"}>
              {i === correct ? "🧑‍🚀" : "☁️"}
            </span>
          ))}
        </div>
      );
    if (variant === "tower")
      return (
        <div className="mb-3 flex flex-col-reverse items-center gap-0.5">
          {Array.from({ length: Math.max(0, towers) }).map((_, i) => (
            <div key={i} className="h-3 w-24 rounded bg-warning" />
          ))}
          <p className="mt-1 text-sm text-muted-foreground">קומות: {Math.max(0, towers)} / 10</p>
        </div>
      );
    if (variant === "fort")
      return (
        <div className="mb-3 text-center text-2xl">
          🏰 {Array.from({ length: Math.max(0, towers) }).map((_, i) => <span key={i}>🛡️</span>)}
        </div>
      );
    return null;
  }, [variant, correct, count, towers]);

  if (finished) return <ResultScreen {...finished} onAgain={restart} />;

  return (
    <div className="relative pt-2">
      <div className="mb-3 flex items-center justify-between text-sm font-bold text-ink">
        <span>
          {index + 1} / {count}
        </span>
        {heartsMax > 0 && (
          <span className="flex gap-0.5">
            {Array.from({ length: heartsMax }).map((_, i) => (
              <Heart
                key={i}
                className={cn("size-5", i < hearts ? "fill-destructive text-destructive" : "text-muted")}
              />
            ))}
          </span>
        )}
        {timerSec > 0 && (
          <span className={cn("flex items-center gap-1", time <= 3 && "text-destructive")}>
            <Timer className="size-4" />
            {time}
          </span>
        )}
      </div>

      {board}

      <div className="relative flex min-h-32 items-center justify-center rounded-2xl bg-sky p-6 text-center shadow-card">
        <Sparkles trigger={sparks} />
        <p className="text-3xl font-bold text-ink">
          {hidden ? "🧠 מה הייתה התשובה?" : item.display}
        </p>
      </div>

      <div className="mt-3 flex justify-center">
        <Logo size={64} bounce={bounce} />
      </div>

      <div className="mt-2 grid gap-3">
        {item.options.map((opt) => {
          const isRight = String(opt) === String(item.answer);
          const state = locked && (isRight ? "right" : String(opt) === String(chosen) ? "wrong" : "");
          return (
            <button
              key={String(opt)}
              disabled={locked}
              onClick={() => handleAnswer(opt)}
              className={cn(
                "h-14 rounded-xl text-2xl font-bold transition-transform active:scale-95",
                state === "right" && "bg-success text-success-foreground",
                state === "wrong" && "animate-shake bg-destructive text-destructive-foreground",
                !state && "bg-primary text-primary-foreground",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {hintText && (
        <div className="animate-pop mt-3 rounded-xl bg-warning/15 p-3 text-center font-bold text-ink">
          💡 {hintText}
        </div>
      )}

      <div className="mt-4 flex justify-center gap-3">
        <button
          onClick={onHint}
          className="flex h-11 items-center gap-2 rounded-xl bg-warning px-4 font-bold text-warning-foreground active:scale-95"
        >
          <Lightbulb className="size-5" /> {t("quiz.hint")} ({premium ? "∞" : profile.hints})
        </button>
        <button
          onClick={() => setShowHelp(true)}
          aria-label="עזרה"
          className="flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground active:scale-95"
        >
          <HelpCircle className="size-6" />
        </button>
      </div>

      <TopicHelpSheet
        open={showHelp}
        topicId={topicId ?? item.topicId}
        onClose={() => setShowHelp(false)}
      />
      <Toast text={toast} />
    </div>
  );
}
