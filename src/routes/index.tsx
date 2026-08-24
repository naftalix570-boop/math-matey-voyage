import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/app-shell";
import { Logo, Confetti } from "@/components/effects";
import { PlacementTest } from "@/components/mini-games";
import { useGame } from "@/lib/game-state";
import { weeklyChallenge } from "@/lib/games";
import { ALBUM_SIZE } from "@/lib/stickers";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "מסע המתמטיקס — לומדים חשבון בכיף" },
      {
        name: "description",
        content:
          "משחקי חשבון לילדים בעברית: חיבור, חיסור, כפל וחילוק עם מדבקות, מטבעות ורמות מתקדמות.",
      },
      { property: "og:title", content: "מסע המתמטיקס — לומדים חשבון בכיף" },
      {
        property: "og:description",
        content: "14 משחקי חשבון לילדים עם אלבום מדבקות, מטבעות ורמות.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { profile, ready, update, sound } = useGame();
  const [mode, setMode] = useState<"welcome" | "test">("welcome");
  const [name, setName] = useState("");

  if (!ready) return <div className="min-h-screen bg-background" />;

  if (!profile.onboarded) {
    return (
      <Screen back={false} nav={false}>
        {mode === "welcome" ? (
          <div className="flex flex-col items-center gap-4 pt-10 text-center">
            <Logo size={130} bounce={1} />
            <h1 className="text-3xl font-bold text-ink">מסע המתמטיקס</h1>
            <p className="text-muted-foreground">לומדים חשבון בכיף — משחק אחרי משחק 🚀</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="איך קוראים לך?"
              className="h-12 w-full rounded-xl border border-input bg-card px-4 text-center text-lg"
            />
            <button
              onClick={() => {
                sound("click");
                if (name.trim()) update({ name: name.trim() });
                setMode("test");
              }}
              className="h-14 w-full rounded-xl bg-primary text-xl font-bold text-primary-foreground shadow-pop active:scale-95"
            >
              בוא נתחיל! 🎯
            </button>
            <button
              onClick={() => {
                sound("click");
                update({ onboarded: true, ...(name.trim() ? { name: name.trim() } : {}) });
              }}
              className="text-sm text-muted-foreground underline"
            >
              דלג על מבחן הרמה
            </button>
          </div>
        ) : (
          <div className="pt-6">
            <h2 className="mb-3 text-center text-xl font-bold text-ink">
              מבחן רמה קצר — נגלה מאיפה מתחילים
            </h2>
            <PlacementTest
              onDone={(level) => {
                sound("levelup");
                update({ level, onboarded: true });
              }}
            />
          </div>
        )}
      </Screen>
    );
  }

  const weekly = weeklyChallenge();
  const pct = Math.round((profile.history.slice(-40).filter(Boolean).length / 40) * 100);

  return (
    <Screen back={false}>
      <Confetti show={false} />
      <div className="flex items-center justify-between pt-3">
        <div>
          <p className="text-sm text-muted-foreground">שלום,</p>
          <h1 className="text-2xl font-bold text-ink">{profile.name} 👋</h1>
        </div>
        <Logo size={72} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat emoji="🪙" label="מטבעות" value={profile.coins} />
        <Stat emoji="💡" label="רמזים" value={profile.hints} />
        <Stat emoji="🔥" label="רצף ימים" value={profile.streakDays} />
      </div>

      <div className="mt-4 rounded-2xl bg-card p-4 shadow-card">
        <div className="flex justify-between font-bold text-ink">
          <span>רמה {profile.level} מתוך 30</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-progress transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          פתרת {profile.totalCorrect} תרגילים נכון מתוך {profile.totalAnswered}
        </p>
      </div>

      <Link
        to="/play/$gameId"
        params={{ gameId: "topic" }}
        onClick={() => sound("click")}
        className="mt-4 flex h-16 w-full items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-pop active:scale-95"
      >
        ▶️ שחק עכשיו
      </Link>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <Tile to="/games" emoji="🎮" label="משחקים" />
        <Tile to="/chests" emoji="🎁" label="תיבות" />
        <Tile to="/album" emoji="📗" label="אלבום" />
        <Tile to="/shop" emoji="🛒" label="חנות" />
      </div>


      <div className="mt-4 rounded-2xl bg-sky p-4 shadow-card">
        <p className="font-bold text-ink">📅 אתגר השבוע</p>
        <p className="text-sm">{weekly.text}</p>
        <Link
          to="/play/$gameId"
          params={{ gameId: "weekly" }}
          className="mt-3 flex h-11 items-center justify-center rounded-xl bg-warning font-bold text-warning-foreground active:scale-95"
        >
          {profile.weeklyDone === weekly.weekKey ? "הושלם ✅ — שחק שוב" : "לאתגר"}
        </Link>
      </div>

      <div className="mt-4 rounded-2xl bg-card p-4 text-center shadow-card">
        <p className="font-bold text-ink">📗 אלבום המדבקות</p>
        <p className="text-sm text-muted-foreground">
          {profile.stickers.length} מתוך {ALBUM_SIZE} מדבקות · עוד {30 - profile.correctSinceSticker}{" "}
          תשובות נכונות למדבקה הבאה
        </p>
      </div>
    </Screen>
  );
}

function Stat({ emoji, label, value }: { emoji: string; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-card p-3 shadow-card">
      <div className="text-2xl">{emoji}</div>
      <div className="text-xl font-bold text-ink">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Tile({ to, emoji, label }: { to: "/games" | "/album" | "/shop" | "/chests"; emoji: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center rounded-2xl bg-card p-3 shadow-card active:scale-95"
    >
      <span className="text-2xl">{emoji}</span>
      <span className="font-bold text-ink">{label}</span>
    </Link>
  );
}
