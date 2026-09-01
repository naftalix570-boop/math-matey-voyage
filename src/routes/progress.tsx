import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/app-shell";
import { ACHIEVEMENTS, WORLD_SIZE, useGame, worldInfo, worldOf } from "@/lib/game-state";
import { MAX_LEVEL } from "@/lib/math";
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
          <span className="text-lg font-bold text-ink">
            שלב {profile.level.toLocaleString("he-IL")}
          </span>
          <span className="text-sm text-muted-foreground">
            מתוך {MAX_LEVEL.toLocaleString("he-IL")}
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, Math.max(3, (profile.level / MAX_LEVEL) * 100))}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          עוד {toSticker} תשובות נכונות עד המדבקה הבאה 🎟️
        </p>
      </section>

      <h2 className="mt-6 text-xl font-bold text-ink">🗺️ העולמות שלך</h2>
      <p className="text-xs text-muted-foreground">
        כל עולם = {WORLD_SIZE} שלבים. אפשר תמיד לחזור לעולמות קודמים כדי להתאמן.
      </p>
      <div className="mt-2 grid gap-2">
        {Array.from({ length: 5 }, (_, i) => worldOf(profile.level) - 2 + i)
          .filter((w) => w >= 1)
          .map((w) => {
            const info = worldInfo(w);
            const cur = w === worldOf(profile.level);
            const done = w < worldOf(profile.level);
            return (
              <div
                key={w}
                className={cn(
                  "flex items-center gap-3 rounded-2xl p-3 shadow-card",
                  cur ? "bg-primary/15 ring-2 ring-primary" : done ? "bg-card" : "bg-muted/60",
                )}
              >
                <span className="text-2xl">{done ? "✅" : info.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-ink">
                    עולם {w} · {info.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    שלבים {info.from.toLocaleString("he-IL")}–{info.to.toLocaleString("he-IL")}
                  </p>
                </div>
                {cur && <span className="text-xs font-bold text-primary">כאן אתם עכשיו</span>}
              </div>
            );
          })}
      </div>


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
