import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen } from "@/components/app-shell";
import { ICONS, useGame } from "@/lib/game-state";
import { cn, fmtNum } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "הפרופיל שלי — מסע המתמטיקס" },
      { name: "description", content: "שם, אימוג׳י, מדינה, סטטיסטיקות וסטטוס שמירה בענן." },
      { property: "og:title", content: "הפרופיל שלי — מסע המתמטיקס" },
      { property: "og:description", content: "כל הנתונים שלי במקום אחד." },
    ],
  }),
  component: ProfilePage,
});

function Stat({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl bg-card p-3 text-center shadow-card">
      <div className="text-2xl">{emoji}</div>
      <div className="truncate text-xl font-bold tabular-nums text-ink">{value}</div>
      <div className="truncate text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function ProfilePage() {
  const { profile, update, sound, linked, authEmail, cloudSyncing, syncNow } = useGame();

  return (
    <Screen title="הפרופיל שלי">
      <div className="mt-2 grid gap-3 pb-28">
        <section className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
          <span className="text-4xl">{profile.icon}</span>
          <div className="min-w-0 flex-1">
            <input
              value={profile.name}
              onChange={(e) => update({ name: e.target.value })}
              maxLength={20}
              aria-label="שם השחקן"
              className="w-full rounded-xl border-2 border-muted bg-background p-2 text-lg font-bold text-ink outline-none focus:border-primary"
            />
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {linked ? authEmail : profile.guest ? "חשבון אורח — נשמר במכשיר בלבד" : "לא מחובר"}
            </p>
          </div>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">האימוג׳י שלי</p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {ICONS.map((ic) => {
              const owned = profile.icons.includes(ic.emoji);
              const active = profile.icon === ic.emoji;
              return (
                <button
                  key={ic.id}
                  disabled={!owned}
                  aria-label={`אייקון ${ic.emoji}`}
                  onClick={() => {
                    sound("click");
                    update({ icon: ic.emoji });
                  }}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-xl text-2xl transition-all",
                    active ? "bg-primary/15 ring-2 ring-primary" : "bg-muted",
                    !owned && "opacity-40 grayscale",
                  )}
                >
                  {owned ? ic.emoji : "🔒"}
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-3 gap-2">
          <Stat emoji="🏆" label="גביעים" value={fmtNum(profile.trophies)} />
          <Stat emoji="🪙" label="מטבעות" value={fmtNum(profile.coins)} />
          <Stat emoji="💡" label="רמזים" value={fmtNum(profile.hints)} />
          <Stat emoji="🎯" label="שלב" value={fmtNum(profile.level)} />
          <Stat emoji="✅" label="תשובות נכונות" value={fmtNum(profile.totalCorrect)} />
          <Stat emoji="🎴" label="מדבקות" value={fmtNum(profile.stickers.length)} />
        </div>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">שמירה בענן</p>
          <p className="mt-1 text-sm font-bold text-success" aria-live="polite">
            {!linked
              ? "⚠️ לא מחובר — ההתקדמות נשמרת רק במכשיר"
              : cloudSyncing
                ? "☁️ שומר עכשיו…"
                : "✅ ההתקדמות שמורה בחשבון"}
          </p>
          <div className="mt-3 grid gap-2">
            {linked ? (
              <button
                onClick={() => {
                  sound("click");
                  void syncNow();
                }}
                className="h-11 rounded-xl bg-primary font-bold text-primary-foreground active:scale-95"
              >
                שמור עכשיו
              </button>
            ) : (
              <Link
                to="/auth"
                search={{ mode: "signin" }}
                className="flex h-11 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground active:scale-95"
              >
                התחברות לשמירה בענן
              </Link>
            )}
            <Link
              to="/settings"
              className="flex h-11 items-center justify-center rounded-xl bg-muted font-bold text-ink active:scale-95"
            >
              להגדרות ולגיבוי
            </Link>
          </div>
        </section>
      </div>
    </Screen>
  );
}
