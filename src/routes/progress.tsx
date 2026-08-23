import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/app-shell";
import { ACHIEVEMENTS, useGame } from "@/lib/game-state";
import { ALBUM_SIZE } from "@/lib/stickers";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "התקדמות — מסע המתמטיקס" },
      { name: "description", content: "מעקב אחרי רמות, הישגים ורצף ימי תרגול." },
      { property: "og:title", content: "התקדמות — מסע המתמטיקס" },
      { property: "og:description", content: "רמות, הישגים ורצף תרגול." },
    ],
  }),
  component: ProgressPage,
});

function Stat({ emoji, label, value }: { emoji: string; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-card p-4 text-center shadow-card">
      <div className="text-3xl">{emoji}</div>
      <div className="mt-1 text-2xl font-bold text-ink">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function ProgressPage() {
  const { profile } = useGame();
  const acc =
    profile.totalAnswered > 0
      ? Math.round((profile.totalCorrect / profile.totalAnswered) * 100)
      : 0;
  const toSticker = Math.max(0, 30 - profile.correctSinceSticker);

  return (
    <Screen title="התקדמות">
      <section className="mt-2 rounded-2xl bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-ink">רמה {profile.level}</span>
          <span className="text-sm text-muted-foreground">מתוך 10</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(profile.level / 10) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          עוד {toSticker} תשובות נכונות עד המדבקה הבאה 🎟️
        </p>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Stat emoji="✅" label="תשובות נכונות" value={profile.totalCorrect} />
        <Stat emoji="🎯" label="אחוז דיוק" value={`${acc}%`} />
        <Stat emoji="🔥" label="ימים ברצף" value={profile.streakDays} />
        <Stat emoji="🏅" label="שיא רצף נכון" value={profile.bestStreakCorrect} />
        <Stat emoji="⚡" label="שיא אתגר בזק" value={profile.bestFlash} />
        <Stat
          emoji="📒"
          label="מדבקות באלבום"
          value={`${profile.stickers.length}/${ALBUM_SIZE}`}
        />
      </div>

      <h2 className="mt-6 text-xl font-bold text-ink">הישגים</h2>
      <div className="mt-2 grid grid-cols-2 gap-3 pb-28">
        {ACHIEVEMENTS.map((a) => {
          const got = profile.achievements.includes(a.id);
          return (
            <div
              key={a.id}
              className={cn(
                "rounded-2xl p-4 text-center shadow-card transition-all",
                got ? "bg-card" : "bg-muted opacity-60",
              )}
            >
              <div className={cn("text-3xl", !got && "grayscale")}>{got ? a.emoji : "🔒"}</div>
              <div className="mt-1 text-sm font-bold text-ink">{a.title}</div>
            </div>
          );
        })}
      </div>
    </Screen>
  );
}
