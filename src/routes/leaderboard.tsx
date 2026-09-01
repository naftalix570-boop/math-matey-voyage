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

const MEDAL_BG = ["bg-warning/25", "bg-muted", "bg-warning/10"];

function LeaderboardPage() {
  const { profile, linked, authUid } = useGame();
  const [tab, setTab] = useState<"world" | "country">("world");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setMyRank(null);
    void (async () => {
      let q = supabase
        .from("profiles")
        .select("user_id, display_name, icon, country, score")
        .order("score", { ascending: false })
        .limit(100);
      if (tab === "country") q = q.eq("country", profile.country);
      const { data } = await q;
      if (cancelled) return;
      const list = (data ?? []) as Row[];
      setRows(list);

      // המיקום המדויק שלי — גם אם אני מחוץ ל-100 הראשונים
      let cq = supabase
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .gt("score", profile.trophies);
      if (tab === "country") cq = cq.eq("country", profile.country);
      const { count } = await cq;
      if (cancelled) return;
      setMyRank((count ?? 0) + 1);
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, linked, authUid, profile.country, profile.trophies]);

  const me: Row = {
    user_id: authUid ?? "me",
    display_name: profile.name,
    icon: profile.icon,
    country: profile.country,
    score: profile.trophies,
  };
  const list = rows
    ? [...(rows.some((r) => r.user_id === me.user_id) ? rows : [...rows, me])].sort(
        (a, b) => b.score - a.score,
      )
    : null;
  const inTop = list?.some((r) => r.user_id === me.user_id && list.indexOf(r) < 100) ?? false;

  return (
    <Screen title="🏆 דירוג האלופים">
      <div className="mt-2 grid gap-3 pb-40">
        {/* עולמי / ארצי — הכי למעלה */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTab("world")}
            className={cn(
              "rounded-xl px-3 py-3 text-lg font-bold",
              tab === "world" ? "bg-primary text-primary-foreground shadow-pop" : "bg-card text-ink shadow-card",
            )}
          >
            🌍 עולמי
          </button>
          <button
            onClick={() => setTab("country")}
            className={cn(
              "rounded-xl px-3 py-3 text-lg font-bold",
              tab === "country" ? "bg-primary text-primary-foreground shadow-pop" : "bg-card text-ink shadow-card",
            )}
          >
            📍 ארצי
          </button>
        </div>

        {list === null ? (
          <p className="py-10 text-center text-muted-foreground">טוען דירוג…</p>
        ) : (
          <div className="grid gap-2">
            {list.slice(0, 100).map((r, i) => {
              const isMe = r.user_id === me.user_id;
              return (
                <div
                  key={r.user_id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl p-3 shadow-card",
                    isMe ? "bg-primary/15 ring-2 ring-primary" : "bg-card",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full text-lg font-bold text-ink",
                      MEDAL_BG[i] ?? "bg-sky",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="text-2xl">{r.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-ink">
                      {r.display_name}
                      {isMe && " (את/ה)"}
                    </p>
                    {tab === "world" && <p className="text-xs text-muted-foreground">{r.country}</p>}
                  </div>
                  <span className="font-bold text-primary">
                    🏆 {r.score.toLocaleString("he-IL")}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {!linked && (
          <Link
            to="/auth"
            className="flex h-12 items-center justify-center rounded-xl bg-secondary font-bold text-secondary-foreground active:scale-95"
          >
            התחברות — כדי לשמור את המקום שלך בענן
          </Link>
        )}
      </div>

      {/* השורה שלי — תמיד למטה */}
      <div className="fixed inset-x-0 bottom-16 z-30 px-4">
        <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl bg-nav p-3 text-nav-foreground shadow-pop">
          <span className="text-2xl">{profile.icon}</span>
          <div className="flex-1">
            <p className="font-bold">{profile.name}</p>
            <p className="text-xs opacity-80">
              {myRank == null
                ? "מחשב מיקום…"
                : inTop
                  ? `${tab === "world" ? "טופ עולמי" : "טופ ארצי"} #${myRank}`
                  : `לא בטופ 100 — המקום שלך ${tab === "world" ? "בעולם" : "בארץ"}: #${myRank}`}
            </p>
          </div>
          <span className="font-bold">🏆 {profile.trophies.toLocaleString("he-IL")}</span>
        </div>
      </div>
    </Screen>
  );
}

