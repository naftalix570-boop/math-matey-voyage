import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Screen } from "@/components/app-shell";
import { QuizGame, type QuizItem, type QuizVariant } from "@/components/quiz";
import { BuilderGame, FlashGame, LineMatchGame, MemoryGame } from "@/components/mini-games";
import { useGame } from "@/lib/game-state";
import { gameById, weeklyChallenge } from "@/lib/games";
import {
  hintFor,
  makeQuestion,
  makeStory,
  makeTrivia,
  OP_NAME,
  type Op,
} from "@/lib/math";

export const Route = createFileRoute("/play/$gameId")({
  loader: ({ params }) => {
    const game = gameById(params.gameId);
    if (!game) throw notFound();
    return { game };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "משחק לא נמצא" }, { name: "robots", content: "noindex" }] };
    }
    const t = `${loaderData.game.title} — מסע המתמטיקס`;
    return {
      meta: [
        { title: t },
        { name: "description", content: loaderData.game.desc },
        { property: "og:title", content: t },
        { property: "og:description", content: loaderData.game.desc },
      ],
    };
  },
  component: PlayPage,
});

const TOPIC_IDS: Record<Op, string> = { add: "add", sub: "sub", mul: "mul", div: "div" };

function quizItem(level: number, op?: Op, options = 3): QuizItem {
  const q = makeQuestion(level, op, options);
  return {
    display: `${q.text} = ?`,
    answer: q.answer,
    options: q.options,
    hint: hintFor(q),
    op: q.op,
    topicId: TOPIC_IDS[q.op],
  };
}

function PlayPage() {
  const { game } = Route.useLoaderData();
  const { profile, update } = useGame();
  const level = profile.level;
  const [op, setOp] = useState<Op | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted)
    return (
      <Screen title={game.title}>
        <div className="mt-10 text-center text-4xl">{game.emoji}</div>
      </Screen>
    );


  if (game.id === "memory") return <Screen title={game.title}><MemoryGame /></Screen>;
  if (game.id === "line-match") return <Screen title={game.title}><LineMatchGame /></Screen>;
  if (game.id === "builder") return <Screen title={game.title}><BuilderGame /></Screen>;
  if (game.id === "flash") return <Screen title={game.title}><FlashGame /></Screen>;

  if (game.id === "topic" && !op) {
    return (
      <Screen title={game.title}>
        <p className="mt-2 text-center text-muted-foreground">איזה נושא נתרגל היום?</p>
        <div className="mt-4 grid grid-cols-2 gap-3 pb-28">
          {(["add", "sub", "mul", "div"] as Op[]).map((o) => (
            <button
              key={o}
              onClick={() => setOp(o)}
              className="rounded-2xl bg-card p-6 text-xl font-bold text-ink shadow-card active:scale-95"
            >
              {OP_NAME[o]}
            </button>
          ))}
        </div>
      </Screen>
    );
  }

  const weekly = weeklyChallenge();

  const variantMap: Partial<Record<string, QuizVariant>> = {
    clouds: "clouds",
    tower: "tower",
    fort: "fort",
    chain: "chain",
    superbrain: "superbrain",
  };

  const variant = variantMap[game.id] ?? "plain";
  const timerSec = game.id === "time-battle" ? 10 : 0;
  const count = game.id === "tower" ? 10 : game.id === "weekly" ? weekly.goal : 10;

  const makeItem = (index: number, prevAnswer: number | null): QuizItem => {
    if (game.id === "story") {
      const s = makeStory(level);
      return {
        display: s.text,
        answer: s.answer,
        options: s.options,
        hint: "קראו שוב את הסיפור וחשבו איזו פעולה מתאימה.",
      };
    }
    if (game.id === "trivia") {
      const t = makeTrivia(level);
      return { display: t.text, answer: t.answer, options: t.options, hint: "חשבו על כל צד בנפרד." };
    }
    if (game.id === "chain" && prevAnswer != null && index > 0) {
      const q = makeQuestion(level, "add");
      const answer = prevAnswer + q.b;
      return {
        display: `${prevAnswer} + ${q.b} = ?`,
        answer,
        options: [answer, answer + 2, Math.max(1, answer - 3)].sort(() => Math.random() - 0.5),
        hint: `מוסיפים ${q.b} לתוצאה הקודמת.`,
        op: "add",
        topicId: "add",
      };
    }
    return quizItem(level, op ?? undefined);
  };

  return (
    <Screen title={game.title}>
      <QuizGame
        makeItem={makeItem}
        count={count}
        timerSec={timerSec}
        variant={variant}
        {...(op ? { topicId: TOPIC_IDS[op] } : {})}
        onDone={(r) => {
          if (game.id === "weekly" && r.correct >= weekly.goal * 0.8) {
            update({ weeklyDone: weekly.weekKey });
          }
        }}
      />
    </Screen>
  );
}
