import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen } from "@/components/app-shell";
import { GAMES } from "@/lib/games";
import { useGame, DAILY_MISSIONS, MONTHLY_MISSIONS } from "@/lib/game-state";
import { useI18n, GAME_I18N } from "@/lib/i18n";

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
  const { sound, profile, missionProgress } = useGame();
  const { t, lang } = useI18n();
  const claimed = [...profile.dailyClaimed, ...profile.monthlyClaimed];
  const activeByGame = [...DAILY_MISSIONS, ...MONTHLY_MISSIONS]
    .filter((m) => m.gameId && !claimed.includes(m.id))
    .reduce<Record<string, typeof DAILY_MISSIONS>>((acc, m) => {
      (acc[m.gameId as string] ??= []).push(m);
      return acc;
    }, {});

  return (
    <Screen title={t("title.games")}>
      <div className="grid grid-cols-2 gap-3 pb-28">
        {GAMES.map((g) => {
          const missions = activeByGame[g.id] ?? [];
          const txt = GAME_I18N[lang]?.[g.id] ?? { title: g.title, desc: g.desc };
          return (
            <Link
              key={g.id}
              to="/play/$gameId"
              params={{ gameId: g.id }}
              onClick={() => sound("click")}
              className="relative rounded-2xl bg-card p-4 text-center shadow-card transition-transform active:scale-95"
            >
              {missions.length > 0 && (
                <span className="absolute top-2 left-2 rounded-full bg-warning px-2 py-0.5 text-[10px] font-bold text-warning-foreground">
                  🗒️ משימה
                </span>
              )}
              <div className="text-3xl">{g.emoji}</div>
              <p className="mt-1 font-bold text-ink">{txt.title}</p>
              <p className="text-xs text-muted-foreground">{txt.desc}</p>
              {missions.length > 0 && (
                <p className="mt-1 rounded-lg bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                  יש לך משימה: {missions[0]!.title} (
                  {Math.min(missionProgress(missions[0]!), missions[0]!.goal)}/
                  {missions[0]!.goal})
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </Screen>
  );
}

