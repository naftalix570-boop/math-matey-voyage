import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/app-shell";
import { Logo, Confetti } from "@/components/effects";
import { PlacementTest } from "@/components/mini-games";
import { useGame } from "@/lib/game-state";
import { weeklyChallenge } from "@/lib/games";
import { ALBUM_SIZE } from "@/lib/stickers";
import { useOnline } from "@/lib/use-online";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "מסע המתמטיקס — לומדים חשבון בכיף" },
      {
        name: "description",
        content:
          "משחקי חשבון לילדים בעברית: חיבור, חיסור, כפל וחילוק עם מדבקות, מטבעות ושלבים מתקדמים.",
      },
      { property: "og:title", content: "מסע המתמטיקס — לומדים חשבון בכיף" },
      {
        property: "og:description",
        content: "15 משחקי חשבון לילדים עם אלבום מדבקות, מטבעות ושלבים.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { profile, ready, update, sound, premium, event } = useGame();
  const [mode, setMode] = useState<"welcome" | "test">("welcome");
  const [name, setName] = useState("");
  const online = useOnline();

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
                update({
                  onboarded: true,
                  guest: true,
                  name: name.trim() || `אורח/ת ${profile.userId}`,
                });
              }}
              className="h-12 w-full rounded-xl bg-card text-lg font-bold text-ink shadow-card active:scale-95"
            >
              🎮 התחל לשחק (ללא הרשמה)
            </button>
            <button
              onClick={() => {
                sound("click");
                update({ onboarded: true, ...(name.trim() ? { name: name.trim() } : {}) });
              }}
              className="text-sm text-muted-foreground underline"
            >
              דלג על מבחן השלב
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
  const showRating = profile.correctSinceRating >= 10 && !profile.rated;

  return (
    <Screen back={false}>
      <Confetti show={false} />
      {showRating && <RatingCard />}

      <div className="flex items-center justify-between pt-3">
        <div>
          <p className="text-sm text-muted-foreground">שלום,</p>
          <h1 className="flex items-center gap-1 text-2xl font-bold text-ink">
            <span>{profile.icon}</span>
            {profile.name}
            {premium && <span title="פרימיום">👑</span>}
          </h1>
        </div>
        <Logo size={72} />
      </div>

      {!online && (
        <div className="mt-3 rounded-xl bg-sky px-3 py-2 text-center text-sm font-bold text-ink">
          {premium
            ? "👑 אין רשת — אבל הפרימיום מאפשר לך לשחק אופליין"
            : "📴 אין קליטה — נדרש חיבור כדי לשחק (פרימיום משחק גם אופליין)"}
        </div>
      )}

      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <Stat emoji="🏆" label="גביעים" value={profile.trophies} />
        <Stat emoji="🪙" label="מטבעות" value={profile.coins} />
        <Stat emoji="💡" label="רמזים" value={premium ? "∞" : profile.hints} />
        <Stat emoji="🔥" label="רצף" value={profile.streakDays} />
      </div>

      <div className="mt-4 rounded-2xl bg-card p-4 shadow-card">
        <div className="flex justify-between font-bold text-ink">
          <span>שלב {profile.level}</span>
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

      {profile.guest && (
        <Link
          to="/auth"
          className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-sky px-4 py-3 font-bold text-ink shadow-card active:scale-95"
        >
          ☁️ שמור את ההתקדמות בענן — קישור חשבון
        </Link>
      )}

      <div className="mt-3 grid grid-cols-4 gap-2">
        <Tile to="/album" emoji="📗" label="אלבום" />
        <Tile to="/streak" emoji="🔥" label="רצף" />
        <Tile to="/missions" emoji="🗒️" label="משימות" />
        <Tile to="/progress" emoji="📊" label="התקדמות" />
      </div>


      {profile.weeklyDone !== weekly.weekKey && (
        <div className="mt-4 rounded-2xl bg-sky p-4 shadow-card">
          <p className="font-bold text-ink">📅 אתגר השבוע</p>
          <p className="text-sm">{weekly.text}</p>
          <Link
            to="/play/$gameId"
            params={{ gameId: "weekly" }}
            className="mt-3 flex h-11 items-center justify-center rounded-xl bg-warning font-bold text-warning-foreground active:scale-95"
          >
            לאתגר
          </Link>
        </div>
      )}

      <Link
        to="/album"
        onClick={() => sound("click")}
        className="mt-4 block rounded-2xl bg-card p-4 text-center shadow-card active:scale-95"
      >
        <p className="font-bold text-ink">📗 אלבום המדבקות</p>
        <p className="text-sm text-muted-foreground">
          {profile.stickers.length} מתוך {ALBUM_SIZE} מדבקות · עוד {30 - profile.correctSinceSticker}{" "}
          תשובות נכונות למדבקה הבאה
        </p>
      </Link>

      <div className="mt-4 rounded-2xl bg-card p-4 shadow-card">
        <p className="font-bold text-ink">
          {event.emoji} איוונט השבוע — {event.title}
        </p>
        <p className="text-sm text-muted-foreground">{event.desc}</p>
      </div>

      <div className="pb-28" />
    </Screen>
  );
}

function RatingCard() {
  const { update, sound } = useGame();
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  if (sent)
    return (
      <div className="mt-3 rounded-2xl bg-card p-4 text-center shadow-card">
        <p className="font-bold text-ink">תודה על המשוב! 💚</p>
      </div>
    );

  const low = stars > 0 && stars <= 3;

  return (
    <div className="mt-3 rounded-2xl bg-card p-4 shadow-card">
      <p className="text-center font-bold text-ink">איך היה לך עד עכשיו?</p>
      <div className="mt-2 flex justify-center gap-1 text-3xl">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            aria-label={`${s} כוכבים`}
            onClick={() => {
              sound("click");
              setStars(s);
            }}
            className="active:scale-90"
          >
            {s <= stars ? "⭐" : "☆"}
          </button>
        ))}
      </div>

      {stars > 0 && (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="רוצה לספר לנו עוד? (לא חובה)"
            className="mt-3 w-full rounded-xl border-2 border-muted bg-background p-3 text-sm text-ink outline-none focus:border-primary"
            rows={3}
          />
          {low ? (
            <a
              href={`mailto:feedback@math-journey.app?subject=${encodeURIComponent(
                `דירוג ${stars} כוכבים`,
              )}&body=${encodeURIComponent(text)}`}
              onClick={() => {
                update({ rated: true, correctSinceRating: 0 });
                setSent(true);
              }}
              className="mt-3 flex h-12 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground"
            >
              שליחת משוב
            </a>
          ) : (
            <button
              onClick={() => {
                update({ rated: true, correctSinceRating: 0 });
                setSent(true);
              }}
              className="mt-3 h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground active:scale-95"
            >
              ⭐ לדרג אותנו בחנות
            </button>
          )}
        </>
      )}

      <button
        onClick={() => update({ correctSinceRating: 0 })}
        className="mt-2 w-full text-xs text-muted-foreground underline"
      >
        אחר כך
      </button>
    </div>
  );
}

function Stat({ emoji, label, value }: { emoji: string; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-card p-3 shadow-card">
      <div className="text-2xl">{emoji}</div>
      <div className="text-xl font-bold text-ink">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Tile({
  to,
  emoji,
  label,
}: {
  to:
    | "/games"
    | "/album"
    | "/shop"
    | "/chests"
    | "/progress"
    | "/settings"
    | "/wheel"
    | "/streak"
    | "/missions"
    | "/leaderboard";
  emoji: string;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center rounded-2xl bg-card p-3 shadow-card active:scale-95"
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-sm font-bold text-ink">{label}</span>
    </Link>
  );
}
