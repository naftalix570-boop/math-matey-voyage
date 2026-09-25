import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/app-shell";
import { useI18n } from "@/lib/i18n";
import { ChestOpenOverlay } from "@/components/effects";
import { CHESTS, useGame, type ChestKind, type ChestReward } from "@/lib/game-state";
import { rewardItems } from "@/lib/chest-rewards";
import { useMidnightCountdown } from "@/lib/daily";

export const Route = createFileRoute("/chests")({
  head: () => ({
    meta: [
      { title: "תיבות אוצר — מסע המתמטיקס" },
      {
        name: "description",
        content: "פותחים תיבות אוצר ומקבלים מטבעות, רמזים, מדבקות ובוסטים במסע המתמטיקס.",
      },
      { property: "og:title", content: "תיבות אוצר — מסע המתמטיקס" },
      { property: "og:description", content: "תיבה רגילה, מדהימה ואגדית — פרסים בכל פתיחה." },
    ],
  }),
  component: ChestsPage,
});

const KINDS: ChestKind[] = ["regular", "amazing", "legendary"];

function ChestsPage() {
  const { t } = useI18n();
  const { profile, openChest, sound, premium } = useGame();
  const [reward, setReward] = useState<ChestReward | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const countdown = useMidnightCountdown();

  const open = (kind: ChestKind, src: "free" | "inv") => {
    const r = openChest(kind, src);
    if (!r) {
      sound("wrong");
      setMsg(src === "free" ? "התיבה היומית כבר נפתחה — חוזרים מחר! 🕒" : "אין לך תיבה כזו במלאי");
      return;
    }
    sound("levelup");
    setMsg(null);
    setReward(r);
  };

  return (
    <Screen title={t("title.chests")}>
      {reward && (
        <ChestOpenOverlay
          emoji={CHESTS[reward.kind].emoji}
          title={`נפתחה ${CHESTS[reward.kind].title}!`}
          items={rewardItems(reward)}
          onClose={() => setReward(null)}
        />
      )}

      <div className="mt-2 flex items-center justify-center gap-3 text-lg font-bold text-ink">
        <span className="rounded-full bg-card px-4 py-1 shadow-card">🪙 {profile.coins}</span>
        <span className="rounded-full bg-card px-4 py-1 shadow-card">💡 {profile.hints}</span>
        <span className="rounded-full bg-card px-4 py-1 shadow-card">🍀 {profile.tickets.luck}</span>
        <span className="rounded-full bg-card px-4 py-1 shadow-card">⏭️ {profile.tickets.skip}</span>
      </div>
      {profile.tickets.luck > 0 && (
        <p className="mt-2 text-center text-sm font-bold text-success">
          🍀 מזל פעיל! בתיבה הבאה הסיכוי למדבקות נדירות מוכפל
        </p>
      )}

      {profile.chests > 0 ? (
        <div className="mt-4 rounded-2xl bg-sky p-4 text-center shadow-card">
          <p className="text-lg font-bold text-ink">🎉 תיבה יומית חינם</p>
          <p className="text-sm">
            תיבה קטנה אחת ביום — קצת מטבעות ו-1-2 מדבקות (פשוטה יותר מהתיבה הרגילה).
            {premium && " 👑 פרימיום: זמינה כל יום!"}
          </p>
          <button
            onClick={() => open("regular", "free")}
            className="mt-3 h-12 w-full rounded-xl bg-warning text-lg font-bold text-warning-foreground shadow-pop active:scale-95"
          >
            פתחו תיבה חינם 📦
          </button>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-card p-3 text-center text-sm font-bold text-muted-foreground shadow-card">
          🕒 התיבה היומית הבאה בעוד {countdown}
        </p>
      )}

      {msg && (
        <p className="mt-3 rounded-2xl bg-card p-3 text-center font-bold text-ink shadow-card">
          {msg}
        </p>
      )}

      <h2 className="mt-6 text-lg font-bold text-ink">🎒 התיבות שלי</h2>
      <p className="text-sm text-muted-foreground">תיבות שקיבלת ממשימות, מהרצף היומי ומהחנות</p>
      <div className="mt-2 grid gap-3">
        {KINDS.map((kind) => {
          const c = CHESTS[kind];
          const count = profile.chestInv[kind];
          return (
            <div key={kind} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
              <span className="text-4xl">{c.emoji}</span>
              <div className="flex-1">
                <p className="text-lg font-bold text-ink">
                  {c.title} {count > 0 && <span className="text-sm">×{count}</span>}
                </p>
                <p className="text-sm text-muted-foreground">{c.desc}</p>
              </div>
              <button
                onClick={() => open(kind, "inv")}
                disabled={count <= 0}
                className={
                  "rounded-xl px-4 py-2 font-bold active:scale-95 " +
                  (count > 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground")
                }
              >
                {count > 0 ? "פתחו" : "אין"}
              </button>
            </div>
          );
        })}
      </div>

      <Link
        to="/shop"
        className="mt-4 flex h-14 items-center justify-center rounded-2xl bg-shop text-lg font-bold text-white shadow-pop active:scale-95"
      >
        🛒 לקנות תיבות בחנות
      </Link>
      <p className="mt-3 pb-28 text-center text-xs text-muted-foreground">
        פתחתם עד היום {profile.chestsOpened} תיבות
      </p>
    </Screen>
  );
}
