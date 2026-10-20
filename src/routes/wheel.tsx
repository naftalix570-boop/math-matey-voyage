import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/app-shell";
import { useI18n } from "@/lib/i18n";
import { Confetti } from "@/components/effects";
import { todayKey, useGame, type WheelPrize } from "@/lib/game-state";
import { isEnabled } from "@/lib/app-version";

export const Route = createFileRoute("/wheel")({
  head: () => ({
    meta: [
      { title: "גלגל המזל — מסע המתמטיקס" },
      { name: "description", content: "סובבו את גלגל המזל וזכו במטבעות, רמזים, מדבקות ואייקונים." },
      { property: "og:title", content: "גלגל המזל — מסע המתמטיקס" },
      { property: "og:description", content: "סובבו וזכו בפרסים!" },
    ],
  }),
  component: WheelPage,
});

function WheelPage() {
  const { t } = useI18n();
  const { profile, spinWheel, sound, premium, event } = useGame();
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState<WheelPrize | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const freeToday = profile.lastFreeSpin !== todayKey() && (event.week === 1 || premium);

  const spin = (free: boolean) => {
    sound("click");
    setSpinning(true);
    setPrize(null);
    setMsg(null);
    setTimeout(() => {
      const p = spinWheel(free);
      setSpinning(false);
      if (!p) {
        sound("wrong");
        setMsg("אין סיבובים זמינים — אפשר לקנות 3 סיבובים ב-600 מטבעות 🪙");
        return;
      }
      sound("levelup");
      setPrize(p);
    }, 1200);
  };

  return (
    <Screen title={t("title.wheel")}>
      <Confetti show={!!prize} />
      <div className="mt-2 flex items-center justify-center gap-3 text-lg font-bold text-ink">
        <span className="rounded-full bg-card px-4 py-1 shadow-card">🪙 {profile.coins}</span>
        <span className="rounded-full bg-card px-4 py-1 shadow-card">🎡 {profile.spins} סיבובים</span>
      </div>

      <div className="mt-6 text-center">
        <div
          className={
            "inline-block text-9xl transition-transform " +
            (spinning ? "animate-spin" : "")
          }
          style={spinning ? { animationDuration: "0.6s" } : undefined}
        >
          🎡
        </div>
        {prize && (
          <div className="animate-pop mx-auto mt-4 max-w-xs rounded-2xl bg-card p-4 shadow-card">
            <p className="text-4xl">{prize.emoji}</p>
            <p className="mt-1 text-xl font-bold text-ink">{prize.label}</p>
          </div>
        )}
        {msg && (
          <p className="mx-auto mt-4 max-w-xs rounded-2xl bg-card p-3 font-bold text-ink shadow-card">
            {msg}
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-3 pb-28">
        {freeToday && (
          <button
            onClick={() => spin(true)}
            disabled={spinning}
            className="h-14 w-full rounded-2xl bg-warning text-xl font-bold text-warning-foreground shadow-pop active:scale-95"
          >
            🎁 סיבוב חינם יומי!
          </button>
        )}
        <button
          onClick={() => spin(false)}
          disabled={spinning || profile.spins <= 0}
          className={
            "h-14 w-full rounded-2xl text-xl font-bold active:scale-95 " +
            (profile.spins > 0
              ? "bg-primary text-primary-foreground shadow-pop"
              : "bg-muted text-muted-foreground")
          }
        >
          {profile.spins > 0 ? `סובבו! (נשארו ${profile.spins})` : "אין סיבובים"}
        </button>
        {isEnabled("shop") && (
          <Link
            to="/shop"
            onClick={() => sound("click")}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-shop text-lg font-bold text-white active:scale-95"
          >
            🛒 לקנות סיבובים בחנות
          </Link>
        )}

        <p className="text-center text-xs text-muted-foreground">
          {event.week === 1
            ? "🎉 איוונט השבוע: סיבוב חינם כל יום!"
            : premium
              ? "👑 פרימיום: סיבוב חינם כל יום!"
              : "סיבוב חינם יומי מגיע באיוונט גלגל המזל או עם פרימיום"}
        </p>
      </div>
    </Screen>
  );
}
