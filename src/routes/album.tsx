import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/app-shell";
import { useI18n } from "@/lib/i18n";

import { useGame } from "@/lib/game-state";
import {
  ALBUM_SIZE,
  ALBUM_WORLDS,
  STICKER_EVERY,
  RARITY_CARD,
  RARITY_CLASS,
  RARITY_LABEL,
  isWorldUnlocked,
  stickerForSlot,
  worldProgress,
  type AlbumWorld,
} from "@/lib/stickers";
import { cn, fmtNum } from "@/lib/utils";

export const Route = createFileRoute("/album")({
  head: () => ({
    meta: [
      { title: "אלבום מדבקות — מסע המתמטיקס" },
      {
        name: "description",
        content:
          "אלבום מדבקות בחמישה עולמות — כל עולם שמשלימים פותח את הבא ומעניק פרס ענק.",
      },
      { property: "og:title", content: "אלבום מדבקות — מסע המתמטיקס" },
      { property: "og:description", content: "5 עולמות · 500 מדבקות · פרסי ענק להשלמת עולם." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlbumPage,
});

function StickerCard({ slot, owned, hidden }: { slot: number; owned: boolean; hidden: boolean }) {
  const s = stickerForSlot(slot);
  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col items-center overflow-hidden rounded-xl border-2 p-1 text-center",
        owned ? RARITY_CARD[s.rarity] : "border-dashed border-border bg-muted/60",
      )}
    >
      {owned && s.rarity === "legendary" && (
        <span className="holo-shine pointer-events-none absolute inset-0" />
      )}
      <span className={cn("text-2xl", !owned && "opacity-30 grayscale")}>
        {owned ? s.emoji : hidden ? "🔒" : "❔"}
      </span>
      <span className="mt-0.5 w-full truncate text-[9px] font-bold text-ink">
        {owned ? s.name : hidden ? "נעול" : RARITY_LABEL[s.rarity]}
      </span>
      <span className="text-[9px] text-muted-foreground">#{(slot % 100) + 1}</span>
    </div>
  );
}

function RewardLine({ reward }: { reward: AlbumWorld["reward"] }) {
  const parts = [
    `🪙 ${fmtNum(reward.coins)}`,
    `💡 ${reward.hints}`,
    `🏆 ${fmtNum(reward.trophies)}`,
    reward.chest
      ? `${reward.chest === "legendary" ? "🟣" : reward.chest === "amazing" ? "🔵" : "🟠"} ${reward.chestCount ?? 1} תיבות`
      : null,
    reward.icon ? `${reward.icon} סמל בלעדי` : null,
  ].filter(Boolean) as string[];
  return <p className="text-sm font-bold text-ink">{parts.join(" · ")}</p>;
}

function AlbumPage() {
  const { t } = useI18n();
  const { profile, claimAlbumWorld, sound } = useGame();
  const owned = new Set(profile.stickers);
  const claimed = new Set(profile.albumWorlds100 ?? []);
  const [page, setPage] = useState(() => {
    const idx = ALBUM_WORLDS.findIndex((w) => !worldProgress(w, owned).done);
    return idx < 0 ? ALBUM_WORLDS.length - 1 : idx;
  });
  const [dir, setDir] = useState(1);
  const [prize, setPrize] = useState<AlbumWorld["reward"] | null>(null);

  const world = ALBUM_WORLDS[page] as AlbumWorld;
  const unlocked = isWorldUnlocked(page, owned);
  const prog = worldProgress(world, owned);
  const canClaim = prog.done && !claimed.has(world.id);

  const go = (delta: number) => {
    const next = page + delta;
    if (next < 0 || next >= ALBUM_WORLDS.length) return;
    setDir(delta);
    setPage(next);
  };

  const claim = () => {
    const r = claimAlbumWorld(world.id);
    if (r) {
      sound("win");
      setPrize(r);
    }
  };

  return (
    <Screen title={t("title.album")}>
      <div className="mt-2 rounded-2xl bg-card p-4 text-center shadow-card">
        <p className="text-2xl font-bold text-ink">
          {owned.size} / {ALBUM_SIZE}
        </p>
        <p className="text-sm text-muted-foreground">
          עוד {Math.max(0, STICKER_EVERY - profile.correctSinceSticker)} תשובות נכונות למדבקה הבאה
        </p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-progress transition-all"
            style={{ width: `${Math.round((owned.size / ALBUM_SIZE) * 100)}%` }}
          />
        </div>
        {(profile.albumTitles ?? []).length > 0 && (
          <p className="mt-2 text-sm font-bold text-ink">
            תארים: {(profile.albumTitles ?? []).join(" · ")}
          </p>
        )}
      </div>

      {/* בורר עולמות */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {ALBUM_WORLDS.map((w, i) => {
          const p = worldProgress(w, owned);
          const open = isWorldUnlocked(i, owned);
          return (
            <button
              key={w.id}
              onClick={() => go(i - page)}
              className={cn(
                "flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-sm font-bold active:scale-95",
                i === page ? "bg-primary text-primary-foreground" : "bg-card text-ink shadow-card",
              )}
            >
              <span>{open ? w.emoji : "🔒"}</span>
              <span>
                {p.have}/{p.total}
              </span>
              {p.done && <span>✅</span>}
            </button>
          );
        })}
      </div>

      <div className={cn("relative mt-3 overflow-hidden rounded-3xl border-4 p-4 pb-8 shadow-card", world.theme)}>
        <div
          key={world.id}
          className={cn("origin-right", dir > 0 ? "animate-page-turn" : "animate-page-turn-back")}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="min-w-0 truncate text-lg font-bold text-ink">
              {unlocked ? world.emoji : "🔒"} {world.name}
            </h2>
            <span className="shrink-0 text-sm font-bold text-muted-foreground">
              {prog.have}/{prog.total}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{world.subtitle}</p>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", RARITY_CLASS["amazing"])}
              style={{ width: `${Math.round((prog.have / prog.total) * 100)}%` }}
            />
          </div>

          {/* כרטיס פרס העולם */}
          <div
            className={cn(
              "mt-3 rounded-2xl border-2 p-3",
              canClaim
                ? "border-warning bg-gold/30 shadow-glow"
                : claimed.has(world.id)
                  ? "border-progress/50 bg-progress/10"
                  : "border-muted bg-muted/50",
            )}
          >
            <p className="font-bold text-ink">
              🎁 פרס השלמת העולם · תואר «{world.reward.title}»
            </p>
            <div className="mt-1">
              <RewardLine reward={world.reward} />
            </div>
            {claimed.has(world.id) ? (
              <p className="mt-2 font-bold text-progress">✅ הפרס נגבה</p>
            ) : canClaim ? (
              <button
                onClick={claim}
                className="mt-2 h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground shadow-pop active:scale-95"
              >
                קבלו את הפרס!
              </button>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                חסרות עוד {prog.total - prog.have} מדבקות בעולם הזה
              </p>
            )}
          </div>

          <div className="mt-3 grid grid-cols-5 gap-1.5 px-6">
            {world.slots.map((slot) => (
              <StickerCard
                key={slot}
                slot={slot}
                owned={owned.has(slot)}
                hidden={!unlocked}
              />
            ))}
          </div>
        </div>

        {/* אזורי לחיצה להעברת דף */}
        {page > 0 && (
          <button
            aria-label="העולם הקודם"
            onClick={() => go(-1)}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center bg-gradient-to-l from-nav/10 to-transparent text-2xl active:bg-nav/20"
          >
            <span className="rounded-full bg-card/90 px-2 py-3 shadow-card">👉</span>
          </button>
        )}
        {page < ALBUM_WORLDS.length - 1 && (
          <button
            aria-label="העולם הבא"
            onClick={() => go(1)}
            className="absolute inset-y-0 left-0 flex w-12 items-center justify-center bg-gradient-to-r from-nav/10 to-transparent text-2xl active:bg-nav/20"
          >
            <span className="rounded-full bg-card/90 px-2 py-3 shadow-card">👈</span>
          </button>
        )}
      </div>

      <div className="pb-28" />

      {prize && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
          dir="rtl"
        >
          <div className="w-full max-w-sm rounded-3xl bg-card p-5 text-center shadow-card">
            <p className="text-5xl">🎉</p>
            <p className="mt-2 text-xl font-bold text-ink">השלמתם עולם!</p>
            <p className="text-sm text-muted-foreground">התואר «{prize.title}» שלכם</p>
            <div className="mt-3 rounded-2xl bg-muted p-3">
              <RewardLine reward={prize} />
            </div>
            <button
              onClick={() => setPrize(null)}
              className="mt-4 h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground shadow-pop active:scale-95"
            >
              מעולה!
            </button>
          </div>
        </div>
      )}
    </Screen>
  );
}
