import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/app-shell";
import { useI18n } from "@/lib/i18n";

import { useGame } from "@/lib/game-state";
import {
  ALBUM_SIZE,
  RARITY_CARD,
  RARITY_CLASS,
  RARITY_EMOJI,
  RARITY_LABEL,
  RARITY_LEVEL,
  RARITY_ORDER,
  slotsByRarity,
  stickerForSlot,
  type Rarity,
} from "@/lib/stickers";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/album")({
  head: () => ({
    meta: [
      { title: "אלבום מדבקות — מסע המתמטיקס" },
      {
        name: "description",
        content: "אלבום מדבקות בשלוש דרגות: נדיר, מדהים ואגדי — אוספים בזכות תרגילים נכונים.",
      },
      { property: "og:title", content: "אלבום מדבקות — מסע המתמטיקס" },
      { property: "og:description", content: "נדיר · מדהים · אגדי — 70 מדבקות לאיסוף." },
    ],
  }),
  component: AlbumPage,
});

function StickerCard({ slot, owned }: { slot: number; owned: boolean }) {
  const s = stickerForSlot(slot);
  return (
    <div
      className={cn(
        "relative flex flex-col items-center overflow-hidden rounded-2xl border-2 p-2 text-center",
        owned ? RARITY_CARD[s.rarity] : "border-dashed border-border bg-muted/60",
      )}
    >
      {owned && s.rarity === "legendary" && (
        <span className="holo-shine pointer-events-none absolute inset-0" />
      )}
      <span className={cn("text-3xl", !owned && "opacity-30 grayscale")}>
        {owned ? s.emoji : "❔"}
      </span>
      <span className="mt-1 text-[11px] font-bold text-ink">{owned ? s.name : "נעול"}</span>
      <span className="mt-0.5 text-[10px] text-muted-foreground">#{slot + 1}</span>
    </div>
  );
}

function RaritySection({ rarity, owned }: { rarity: Rarity; owned: Set<number> }) {
  const slots = slotsByRarity(rarity);
  const have = slots.filter((s) => owned.has(s)).length;
  const pct = Math.round((have / slots.length) * 100);
  return (
    <section className="mt-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-sm",
              RARITY_CLASS[rarity],
            )}
          >
            {RARITY_LEVEL[rarity]}
          </span>
          {RARITY_EMOJI[rarity]} {RARITY_LABEL[rarity]}
        </h2>
        <span className="text-sm font-bold text-muted-foreground">
          {have}/{slots.length}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", RARITY_CLASS[rarity])}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {slots.map((slot) => (
          <StickerCard key={slot} slot={slot} owned={owned.has(slot)} />
        ))}
      </div>
    </section>
  );
}

function AlbumPage() {
  const { t } = useI18n();
  const { profile } = useGame();
  const owned = new Set(profile.stickers);
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);
  const rarity = RARITY_ORDER[page] as Rarity;

  const go = (delta: number) => {
    const next = page + delta;
    if (next < 0 || next >= RARITY_ORDER.length) return;
    setDir(delta);
    setPage(next);
  };

  return (
    <Screen title={t("title.album")}>
      <div className="mt-2 rounded-2xl bg-card p-4 text-center shadow-card">
        <p className="text-2xl font-bold text-ink">
          {owned.size} / {ALBUM_SIZE}
        </p>
        <p className="text-sm text-muted-foreground">
          עוד {Math.max(0, 30 - profile.correctSinceSticker)} תשובות נכונות למדבקה הבאה
        </p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-progress transition-all"
            style={{ width: `${Math.round((owned.size / ALBUM_SIZE) * 100)}%` }}
          />
        </div>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-3xl border-4 border-nav/20 bg-card p-4 pb-8 shadow-card">
        <div
          key={rarity}
          className={cn("origin-right", dir > 0 ? "animate-page-turn" : "animate-page-turn-back")}
        >
          <RaritySection rarity={rarity} owned={owned} />
        </div>

        {/* אזורי לחיצה להעברת דף — צמודים לצדדים, בגובה כל הדף */}
        {page > 0 && (
          <button
            aria-label="הדף הקודם"
            onClick={() => go(-1)}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center bg-gradient-to-l from-nav/10 to-transparent text-2xl active:bg-nav/20"
          >
            <span className="rounded-full bg-card/90 px-2 py-3 shadow-card">👉</span>
          </button>
        )}
        {page < RARITY_ORDER.length - 1 && (
          <button
            aria-label="הדף הבא"
            onClick={() => go(1)}
            className="absolute inset-y-0 left-0 flex w-12 items-center justify-center bg-gradient-to-r from-nav/10 to-transparent text-2xl active:bg-nav/20"
          >
            <span className="rounded-full bg-card/90 px-2 py-3 shadow-card">👈</span>
          </button>
        )}

        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
          {RARITY_ORDER.map((r, i) => (
            <button
              key={r}
              aria-label={r}
              onClick={() => go(i - page)}
              className={cn("size-2.5 rounded-full", i === page ? "bg-primary" : "bg-muted")}
            />
          ))}
        </div>
      </div>

      <div className="pb-28" />

    </Screen>
  );
}

