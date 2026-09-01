import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/app-shell";
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
  const { profile } = useGame();
  const owned = new Set(profile.stickers);

  return (
    <Screen title="אלבום מדבקות">
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

      <div className="pb-28">
        {RARITY_ORDER.map((r) => (
          <RaritySection key={r} rarity={r} owned={owned} />
        ))}
      </div>
    </Screen>
  );
}
