import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/app-shell";
import { ICONS, useGame } from "@/lib/game-state";
import { MAX_LEVEL } from "@/lib/math";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "הגדרות — מסע המתמטיקס" },
      { name: "description", content: "שם השחקן, צלילים ורמת קושי." },
      { property: "og:title", content: "הגדרות — מסע המתמטיקס" },
      { property: "og:description", content: "שם השחקן, צלילים ורמת קושי." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, update, sound, reset } = useGame();
  const [confirming, setConfirming] = useState(false);

  return (
    <Screen title="הגדרות">
      <div className="mt-2 grid gap-3 pb-28">
        <section className="rounded-2xl bg-card p-4 shadow-card">
          <label htmlFor="name" className="text-lg font-bold text-ink">
            שם השחקן/ית
          </label>
          <input
            id="name"
            value={profile.name}
            onChange={(e) => update({ name: e.target.value })}
            maxLength={20}
            className="mt-2 w-full rounded-xl border-2 border-muted bg-background p-3 text-lg text-ink outline-none focus:border-primary"
          />
        </section>

        <section className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-card">
          <div>
            <p className="text-lg font-bold text-ink">צלילים</p>
            <p className="text-sm text-muted-foreground">אפקטים קוליים במשחקים</p>
          </div>
          <button
            role="switch"
            aria-checked={profile.soundOn}
            aria-label="הפעלת צלילים"
            onClick={() => {
              update((p) => ({ soundOn: !p.soundOn }));
              sound("click");
            }}
            className={cn(
              "h-9 w-16 rounded-full p-1 transition-colors",
              profile.soundOn ? "bg-success" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "block size-7 rounded-full bg-card shadow-card transition-transform",
                profile.soundOn ? "translate-x-0" : "-translate-x-7",
              )}
            />
          </button>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">האייקון שלי</p>
          <p className="text-sm text-muted-foreground">
            אייקונים נוספים נפתחים בגלגל המזל ובתיבות.
          </p>
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

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">מזהה משתמש</p>
          <p className="mt-1 text-sm text-muted-foreground">
            מספר השחקן/ית שלך: <span className="font-bold text-ink">#{profile.userId}</span>
            {profile.guest && " · חשבון אורח"}
          </p>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">שלב הקושי</p>
          <p className="text-sm text-muted-foreground">
            השלב מתעדכן אוטומטית לפי ההצלחות שלך (מתוך {MAX_LEVEL.toLocaleString("he-IL")}), אבל אפשר לשנות ידנית.
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              onClick={() => update((p) => ({ level: Math.max(1, p.level - 1) }))}
              className="size-12 rounded-xl bg-muted text-2xl font-bold text-ink active:scale-95"
              aria-label="הורדת שלב"
            >
              −
            </button>
            <span className="text-3xl font-bold text-ink">{profile.level.toLocaleString("he-IL")}</span>
            <button
              onClick={() => update((p) => ({ level: Math.min(MAX_LEVEL, p.level + 1) }))}
              className="size-12 rounded-xl bg-muted text-2xl font-bold text-ink active:scale-95"
              aria-label="העלאת שלב"
            >
              +
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">התחלה מחדש</p>
          <p className="text-sm text-muted-foreground">
            מוחק את כל ההתקדמות, המדבקות והמטבעות.
          </p>
          {confirming ? (
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => {
                  reset();
                  setConfirming(false);
                }}
                className="flex-1 rounded-xl bg-destructive px-4 py-3 font-bold text-destructive-foreground active:scale-95"
              >
                כן, למחוק הכול
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-xl bg-muted px-4 py-3 font-bold text-ink active:scale-95"
              >
                ביטול
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="mt-3 w-full rounded-xl bg-muted px-4 py-3 font-bold text-ink active:scale-95"
            >
              איפוס התקדמות
            </button>
          )}
        </section>
      </div>
    </Screen>
  );
}
