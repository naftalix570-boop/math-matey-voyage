import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/app-shell";
import { Confetti } from "@/components/effects";
import { CHESTS, TICKETS, useGame, type ChestKind, type ChestReward } from "@/lib/game-state";
import { stickerForSlot } from "@/lib/stickers";

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
  const { profile, openChest, sound, premium } = useGame();
  const [reward, setReward] = useState<ChestReward | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [shaking, setShaking] = useState<string | null>(null);

  const open = (kind: ChestKind, free: boolean) => {
    setShaking(kind + free);
    const r = openChest(kind, free);
    setTimeout(() => setShaking(null), 500);
    if (!r) {
      sound("wrong");
      setReward(null);
      setMsg(free ? "אין לך תיבות חינם כרגע — חוזרים מחר! 🕒" : "אין מספיק מטבעות 😅");
      return;
    }
    sound("levelup");
    setMsg(null);
    setReward(r);
  };

  return (
    <Screen title="תיבות אוצר">
      <Confetti show={!!reward} />

      <div className="mt-2 flex items-center justify-center gap-3 text-lg font-bold text-ink">
        <span className="rounded-full bg-card px-4 py-1 shadow-card">🪙 {profile.coins}</span>
        <span className="rounded-full bg-card px-4 py-1 shadow-card">💡 {profile.hints}</span>
      </div>

      <div className="mt-4 rounded-2xl bg-sky p-4 text-center shadow-card">
        <p className="text-lg font-bold text-ink">🎉 תיבה יומית חינם</p>
        <p className="text-sm">
          יש לך {profile.chests} תיבות חינם. תיבה חדשה מחכה כל יום!
          {premium && " 👑 פרימיום: תיבה נוספת כל יום!"}
        </p>
        <button
          onClick={() => open("regular", true)}
          disabled={profile.chests <= 0}
          className={
            "mt-3 h-12 w-full rounded-xl text-lg font-bold active:scale-95 " +
            (profile.chests > 0
              ? "bg-warning text-warning-foreground shadow-pop"
              : "bg-muted text-muted-foreground")
          }
        >
          {profile.chests > 0 ? "פתחו תיבה חינם 📦" : "חזרו מחר 🕒"}
        </button>
      </div>

      {msg && (
        <p className="mt-3 rounded-2xl bg-card p-3 text-center font-bold text-ink shadow-card">
          {msg}
        </p>
      )}

      {reward && (
        <div className="mt-3 animate-page rounded-2xl bg-card p-4 text-center shadow-card">
          <p className="text-4xl">{CHESTS[reward.kind].emoji}</p>
          <p className="mt-1 text-lg font-bold text-ink">מה יצא מהתיבה?</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2 text-sm font-bold">
            <span className="rounded-full bg-muted px-3 py-1">🪙 {reward.coins} מטבעות</span>
            {reward.hints > 0 && (
              <span className="rounded-full bg-muted px-3 py-1">💡 {reward.hints} רמזים</span>
            )}
            {reward.stickers.map((slot) => (
              <span key={slot} className="rounded-full bg-muted px-3 py-1">
                {stickerForSlot(slot).emoji} {stickerForSlot(slot).name}
              </span>
            ))}
            {reward.ticket && (
              <span className="rounded-full bg-muted px-3 py-1">
                {TICKETS[reward.ticket].emoji} כרטיס {TICKETS[reward.ticket].title}
              </span>
            )}
            {reward.boost === "double" && (
              <span className="rounded-full bg-success px-3 py-1 text-white">⏩ כפל מטבעות לשעה</span>
            )}
            {reward.boost === "premium" && !reward.rarePremium && (
              <span className="rounded-full bg-warning px-3 py-1 text-white">👑 פרימיום ליום</span>
            )}
            {reward.rarePremium && (
              <span className="rounded-full bg-warning px-3 py-1 text-white">
                👑 פרימיום נדיר! (1:10,000) ליום שלם
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-3 pb-28">
        {KINDS.map((kind) => {
          const c = CHESTS[kind];
          return (
            <div key={kind} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
              <span className={"text-4xl " + (shaking === kind + "false" ? "animate-bounce" : "")}>
                {c.emoji}
              </span>
              <div className="flex-1">
                <p className="text-lg font-bold text-ink">{c.title}</p>
                <p className="text-sm text-muted-foreground">{c.desc}</p>
              </div>
              <button
                onClick={() => open(kind, false)}
                className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground active:scale-95"
              >
                🪙 {c.price.toLocaleString("he-IL")}
              </button>
            </div>
          );
        })}
        <p className="text-center text-xs text-muted-foreground">
          פתחתם עד היום {profile.chestsOpened} תיבות
        </p>
      </div>
    </Screen>
  );
}
