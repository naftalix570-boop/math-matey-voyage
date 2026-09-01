import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/app-shell";
import {
  CHESTS,
  DAILY_MISSIONS,
  MONTHLY_MISSIONS,
  TICKETS,
  useGame,
  type Mission,
} from "@/lib/game-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/missions")({
  head: () => ({
    meta: [
      { title: "משימות — מסע המתמטיקס" },
      { name: "description", content: "משימות יומיות וחודשיות עם תגמולים: מטבעות, רמזים ותיבות." },
      { property: "og:title", content: "משימות — מסע המתמטיקס" },
      { property: "og:description", content: "משימות יומיות וחודשיות עם תגמולים." },
    ],
  }),
  component: MissionsPage,
});

function rewardLabel(m: Mission) {
  const parts: string[] = [];
  if (m.reward.coins) parts.push(`🪙 ${m.reward.coins}`);
  if (m.reward.hints) parts.push(`💡 ${m.reward.hints}`);
  if (m.reward.chest) parts.push(`${CHESTS[m.reward.chest].emoji} ${CHESTS[m.reward.chest].title}`);
  if (m.reward.ticket) parts.push(`${TICKETS[m.reward.ticket].emoji} ${TICKETS[m.reward.ticket].title}`);
  if (m.reward.title) parts.push(`🏅 תואר "${m.reward.title}"`);
  return parts.join(" · ");
}

function MissionCard({
  mission,
  scope,
}: {
  mission: Mission;
  scope: "daily" | "monthly";
}) {
  const { profile, missionProgress, claimMission, sound, premium } = useGame();
  const [done, setDone] = useState(false);
  const progress = missionProgress(mission);
  const claimed =
    (scope === "daily" ? profile.dailyClaimed : profile.monthlyClaimed).includes(mission.id) ||
    done;
  const locked = mission.premiumOnly && !premium;
  const pct = Math.min(100, Math.round((progress / mission.goal) * 100));

  const claim = () => {
    if (claimMission(mission, scope)) {
      sound("levelup");
      setDone(true);
    } else {
      sound("wrong");
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-4 shadow-card",
        locked ? "bg-muted opacity-70" : "bg-card",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-bold text-ink">
            {mission.title}
            {mission.premiumOnly && <span className="mr-1">👑</span>}
          </p>
          {mission.desc && <p className="text-xs text-muted-foreground">{mission.desc}</p>}
        </div>
        <span className="shrink-0 text-sm font-bold text-muted-foreground">
          {Math.min(progress, mission.goal).toLocaleString("he-IL")}/
          {mission.goal.toLocaleString("he-IL")}
        </span>
      </div>

      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", claimed ? "bg-success" : "bg-primary")}
          style={{ width: `${claimed ? 100 : pct}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{rewardLabel(mission)}</p>
        {locked ? (
          <span className="rounded-lg bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
            פרימיום בלבד
          </span>
        ) : claimed ? (
          <span className="rounded-lg bg-success px-3 py-1 text-xs font-bold text-success-foreground">
            הושלם ✅
          </span>
        ) : (
          <button
            onClick={claim}
            disabled={progress < mission.goal}
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-bold active:scale-95",
              progress >= mission.goal
                ? "bg-warning text-warning-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            קבלו תגמול
          </button>
        )}
      </div>
    </div>
  );
}

function MissionsPage() {
  return (
    <Screen title="משימות">
      <h2 className="mt-2 text-lg font-bold text-ink">📅 משימות יומיות</h2>
      <div className="mt-2 grid gap-3">
        {DAILY_MISSIONS.map((m) => (
          <MissionCard key={m.id} mission={m} scope="daily" />
        ))}
      </div>

      <h2 className="mt-6 text-lg font-bold text-ink">🗓️ משימות חודשיות</h2>
      <div className="mt-2 grid gap-3 pb-28">
        {MONTHLY_MISSIONS.map((m) => (
          <MissionCard key={m.id} mission={m} scope="monthly" />
        ))}
      </div>
    </Screen>
  );
}
