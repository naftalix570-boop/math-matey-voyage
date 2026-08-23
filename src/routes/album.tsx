import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/app-shell";
import { useGame } from "@/lib/game-state";
import { ALBUM_SIZE, RARITY_CLASS, RARITY_LABEL, stickerForSlot } from "@/lib/stickers";

export const Route = createFileRoute("/album")({
  head: () => ({
    meta: [
      { title: "אלבום מדבקות — מסע המתמטיקס" },
      { name: "description", content: "אוספים 70 מדבקות בזכות תשובות נכונות במשחקי החשבון." },
      { property: "og:title", content: "אלבום מדבקות — מסע המתמטיקס" },
      { property: "og:description", content: "70 מדבקות לאיסוף בזכות תרגול חשבון." },
    ],
  }),
  component: AlbumPage,
});

function AlbumPage() {
  const { profile } = useGame();
  const owned = new Set(profile.stickers);

  return (
    <Screen title="אלבום מדבקות">
      <p className="text-center text-sm text-muted-foreground">
        {owned.size} מתוך {ALBUM_SIZE} · עוד {Math.max(0, 30 - profile.correctSinceSticker)} תשובות
        נכונות למדבקה הבאה
      </p>
      <div className="mt-4 grid grid-cols-4 gap-2 pb-28">
        {Array.from({ length: ALBUM_SIZE }, (_, i) => {
          const s = stickerForSlot(i);
          const has = owned.has(i);
          return (
            <div
              key={i}
              className={
                "flex flex-col items-center rounded-2xl p-2 shadow-card " +
                (has ? "bg-card" : "bg-muted opacity-60")
              }
            >
              <span className="text-3xl">{has ? s.emoji : "❔"}</span>
              <span className="mt-1 text-[11px] font-bold text-ink">{has ? s.name : "נעול"}</span>
              {has && (
                <span className={"mt-1 rounded-full px-2 text-[10px] " + RARITY_CLASS[s.rarity]}>
                  {RARITY_LABEL[s.rarity]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Screen>
  );
}
