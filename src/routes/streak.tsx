import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/app-shell";
import { Confetti } from "@/components/effects";
import { streakReward, useGame } from "@/lib/game-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/streak")({
  head: () => ({
    meta: [
      { title: "רצף יומי — מסע המתמטיקס" },
      { name: "description", content: "שמרו על הרצף היומי ואספו תגמולים בכל יום." },
      { property: "og:title", content: "רצף יומי — מסע המתמטיקס" },
      { property: "og:description", content: "שמרו על הרצף ואספו תגמולים." },
    ],
  }),
  component: StreakPage,
});

const todayKey = () => new Date().toISOString().slice(0, 10);

function dayReward(day: number) {
  const r = streakReward(Math.max(1, day));
  return { emoji: r.emoji, label: r.label };
}


function StreakPage() {
  const { profile, claimStreak, sound, premium, event, update } = useGame();
  const [claimed, setClaimed] = useState<number | null>(null);
  const [shieldMsg, setShieldMsg] = useState<string | null>(null);

  const claimedToday = profile.streakClaimedDay === todayKey();
  const shieldActive = Date.now() < profile.streakShieldUntil;
  const bonus = event.week === 3 || premium ? 35 : 0;

  const claim = () => {
    const r = claimStreak();
    if (!r) return;
    sound("levelup");
    setClaimed(r.coins);
  };

  const activateShield = () => {
    if (profile.tickets.shield <= 0) {
      sound("wrong");
      setShieldMsg("אין לך מגן רצף — אפשר לקנות בחנות 🛡️");
      return;
    }
    sound("levelup");
    update((p) => ({
      tickets: { ...p.tickets, shield: p.tickets.shield - 1 },
      streakShieldUntil: Math.max(Date.now(), p.streakShieldUntil) + 7 * 86400000,
    }));
    setShieldMsg("מגן הרצף הופעל לשבוע! 🛡️");
  };

  return (
    <Screen title="רצף יומי">
      <Confetti show={claimed != null} />

      <div className="mt-2 rounded-2xl bg-card p-4 text-center shadow-card">
        <p className="text-5xl">🔥</p>
        <p className="mt-1 text-3xl font-bold text-ink">{profile.streakDays} ימים ברצף</p>
        {shieldActive && (
          <p className="mt-1 text-sm font-bold text-success">🛡️ מגן רצף פעיל</p>
        )}
        {bonus > 0 && (
          <p className="mt-1 text-sm font-bold text-warning">
            {premium ? "👑 פרימיום" : "🎉 איוונט"}: +35 מטבעות בונוס בלחיצה!
          </p>
        )}

        {claimed != null ? (
          <p className="animate-pop mt-3 rounded-xl bg-success px-4 py-3 font-bold text-success-foreground">
            קיבלת {claimed} מטבעות! 🪙
          </p>
        ) : (
          <button
            onClick={claim}
            disabled={claimedToday}
            className={cn(
              "mt-3 h-12 w-full rounded-xl text-lg font-bold active:scale-95",
              claimedToday
                ? "bg-muted text-muted-foreground"
                : "bg-warning text-warning-foreground shadow-pop",
            )}
          >
            {claimedToday ? "נלחץ היום ✅ חזרו מחר" : "לחצו לתגמול היומי 🎁"}
          </button>
        )}
      </div>

      <h2 className="mt-5 text-lg font-bold text-ink">30 הימים הקרובים</h2>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {Array.from({ length: 30 }, (_, i) => {

          const day = profile.streakDays + i;
          const r = dayReward(day);
          const isToday = i === 0;
          const past = false;
          return (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center rounded-xl p-2 text-center shadow-card",
                isToday ? "bg-warning text-warning-foreground" : past ? "bg-success/20" : "bg-card",
              )}
            >
              <span className="text-[10px] font-bold">יום {day}</span>
              <span className="text-xl">{r.emoji}</span>
              <span className="text-[9px] leading-tight">{r.label}</span>
            </div>
          );
        })}
      </div>

      <Link
        to="/missions"
        className="mt-5 flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-pop active:scale-95"
      >
        🎯 למשימות היומיות
      </Link>

      <div className="pb-28" />
    </Screen>
  );
}
