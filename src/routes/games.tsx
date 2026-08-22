import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/app-shell";
import { GAMES } from "@/lib/games";

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
  return (
    <Screen title="משחקים">
      <div className="grid grid-cols-2 gap-3 pb-28">
        {GAMES.map((g) => (
          <div key={g.id} className="rounded-2xl bg-card p-4 text-center shadow-card">
            <div className="text-3xl">{g.emoji}</div>
            <p className="mt-1 font-bold text-ink">{g.title}</p>
            <p className="text-xs text-muted-foreground">{g.desc}</p>
          </div>
        ))}
      </div>
    </Screen>
  );
}
