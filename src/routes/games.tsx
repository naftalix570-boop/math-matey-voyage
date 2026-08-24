import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen } from "@/components/app-shell";
import { GAMES } from "@/lib/games";
import { useGame } from "@/lib/game-state";

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "משחקים — מסע המתמטיקס" },
      { name: "description", content: "14 משחקי חשבון מהנים לילדים: כפל, חילוק, חיבור וחיסור." },
      { property: "og:title", content: "משחקים — מסע המתמטיקס" },
      { property: "og:description", content: "14 משחקי חשבון מהנים לילדים." },
    ],
  }),
  component: GamesPage,
});

function GamesPage() {
  const { sound } = useGame();
  return (
    <Screen title="משחקים">
      <div className="grid grid-cols-2 gap-3 pb-28">
        {GAMES.map((g) => (
          <Link
            key={g.id}
            to="/play/$gameId"
            params={{ gameId: g.id }}
            onClick={() => sound("click")}
            className="rounded-2xl bg-card p-4 text-center shadow-card transition-transform active:scale-95"
          >
            <div className="text-3xl">{g.emoji}</div>
            <p className="mt-1 font-bold text-ink">{g.title}</p>
            <p className="text-xs text-muted-foreground">{g.desc}</p>
          </Link>
        ))}
      </div>
    </Screen>
  );
}

