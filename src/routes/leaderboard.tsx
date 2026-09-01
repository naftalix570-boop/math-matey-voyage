import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Screen } from "@/components/app-shell";
import { useGame } from "@/lib/game-state";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "דירוג עולמי — מסע המתמטיקס" },
      { name: "description", content: "טבלת המובילים העולמית והארצית של מסע המתמטיקס." },
      { property: "og:title", content: "דירוג עולמי — מסע המתמטיקס" },
      { property: "og:description", content: "מי האלופים בחשבון? הדירוג העולמי והארצי." },
    ],
  }),
  component: LeaderboardPage,
});

type Row = {
  user_id: string;
  display_name: string;
  icon: string;
  country: string;
  score: number;
};

const MEDALS = ["🥇", "🥈", "🥉"];

function LeaderboardPage() {
  const { profile, linked, authUid } = useGame();
  const [tab, setTab] = useState<"world" | "country">("world");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    if (!linked) return;
    let cancelled = false;
    setRows(null);
    setMyRank(null);
    void (async () => {
      let q = supabase
        .from("profiles")
        .select("user_id, display_name, icon, country, score")
        .order("score", { ascending: false })
        .limit(50);
      if (tab === "country") q = q.eq("country", profile.country);
      const { data } = await q;
      if (cancelled) return;
      const list = (data ?? []) as Row[];
      setRows(list);
      if (authUid) {
        const idx = list.findIndex((r) => r.user_id === authUid);
        setMyRank(idx >= 0 ? idx + 1 : null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, linked, authUid, profile.country]);

  return (
    <Screen title="🏆 דירוג האלופים">
      <div className="mt-2 grid gap-3 pb-28">
        <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
          <span className="text-3xl">{profile.icon}</span>
          <div className="flex-1">
            <p className="font-bold text-ink">{profile.name}</p>
            <p className="text-sm text-muted-foreground">הניקוד שלך מתעדכן בכל תרגיל נכון</p>
          </div>
          <span className="text-xl font-bold text-ink">🏆 {profile.trophies}</span>
        </div>
        {!linked ? (

          <section className="rounded-2xl bg-card p-5 text-center shadow-card">
            <p className="text-4xl">☁️</p>
            <p className="mt-2 text-lg font-bold text-ink">הדירוג פתוח לשחקנים מחוברים</p>
            <p className="mt-1 text-sm text-muted-foreground">
              התחברו כדי לשמור את ההתקדמות בענן ולהתחרות מול שחקנים מכל העולם.
            </p>
            <Link
              to="/auth"
              className="mt-4 flex h-12 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground shadow-pop active:scale-95"
            >
              התחברות / הרשמה
            </Link>
          </section>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTab("world")}
                className={cn(
                  "rounded-xl px-3 py-2 font-bold",
                  tab === "world" ? "bg-primary text-primary-foreground" : "bg-card text-ink shadow-card",
                )}
              >
                🌍 עולמי
              </button>
              <button
                onClick={() => setTab("country")}
                className={cn(
                  "rounded-xl px-3 py-2 font-bold",
                  tab === "country" ? "bg-primary text-primary-foreground" : "bg-card text-ink shadow-card",
                )}
              >
                📍 ארצי
              </button>
            </div>

            {myRank && (
              <div className="rounded-xl bg-gold/20 px-4 py-2 text-center font-bold text-ink">
                המקום שלך: #{myRank} 🎉
              </div>
            )}

            {rows === null ? (
              <p className="py-10 text-center text-muted-foreground">טוען דירוג…</p>
            ) : (
              (() => {
                const me: Row = {
                  user_id: authUid ?? "me",
                  display_name: profile.name,
                  icon: profile.icon,
                  country: profile.country,
                  score: profile.trophies,
                };
                const list = rows.some((r) => r.user_id === me.user_id) ? rows : [...rows, me];
                list.sort((a, b) => b.score - a.score);
                return (

              <div className="grid gap-2">
                {rows.map((r, i) => (
                  <div
                    key={r.user_id}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl p-3 shadow-card",
                      r.user_id === authUid ? "bg-primary/15 ring-2 ring-primary" : "bg-card",
                    )}
                  >
                    <span className="w-8 text-center text-lg font-bold text-ink">
                      {MEDALS[i] ?? `#${i + 1}`}
                    </span>
                    <span className="text-2xl">{r.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold text-ink">
                        {r.display_name}
                        {r.user_id === authUid && " (את/ה)"}
                      </p>
                      {tab === "world" && (
                        <p className="text-xs text-muted-foreground">{r.country}</p>
                      )}
                    </div>
                    <span className="font-bold text-primary">🏆 {r.score.toLocaleString("he-IL")}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground">
              הניקוד מחושב משלבים, תשובות נכונות, רצפים ומדבקות.
            </p>
          </>
        )}
      </div>
    </Screen>
  );
}
