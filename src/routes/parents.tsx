import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/app-shell";
import { EmptyState } from "@/components/states";
import { ACHIEVEMENTS, useGame } from "@/lib/game-state";
import { cn, fmtNum } from "@/lib/utils";

export const Route = createFileRoute("/parents")({
  head: () => ({
    meta: [
      { title: "אזור הורים — מסע המתמטיקס" },
      { name: "description", content: "התקדמות הילד לפי נושאים, נקודות קושי, זמן משחק והישגים." },
      { property: "og:title", content: "אזור הורים — מסע המתמטיקס" },
      { property: "og:description", content: "מעקב הורים אחרי הלמידה." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ParentsPage,
});

const TOPICS: Record<string, { name: string; emoji: string }> = {
  add: { name: "חיבור", emoji: "➕" },
  sub: { name: "חיסור", emoji: "➖" },
  mul: { name: "כפל", emoji: "✖️" },
  div: { name: "חילוק", emoji: "➗" },
  other: { name: "תרגילים משולבים", emoji: "🧩" },
};

const mins = (s: number) => (s < 60 ? `${s} שנ׳` : `${Math.round(s / 60)} דק׳`);

function ParentsPage() {
  const { profile } = useGame();

  const topics = Object.entries(profile.topicStats ?? {}).filter(([, v]) => v.a > 0);
  const weak = [...topics]
    .filter(([, v]) => v.a >= 5)
    .sort((a, b) => a[1].c / a[1].a - b[1].c / b[1].a)
    .slice(0, 2);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10);
    return { d, v: profile.dayLog?.[d] ?? { a: 0, c: 0, s: 0 } };
  });
  const today = days[13]!.v.s;
  const week = days.slice(7).reduce((s, x) => s + x.v.s, 0);
  const active = Object.values(profile.dayLog ?? {}).filter((v) => v.a > 0 || v.s > 0).length;
  const maxC = Math.max(1, ...days.map((x) => x.v.c));

  return (
    <Screen title="אזור הורים">
      <div className="mt-2 grid gap-3 pb-28">
        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">📚 התקדמות לפי נושאים</p>
          {topics.length === 0 ? (
            <EmptyState emoji="📭" title="עוד אין נתונים" hint="הנתונים יופיעו אחרי כמה תרגילים." />
          ) : (
            <div className="mt-2 grid gap-2">
              {topics.map(([k, v]) => {
                const pct = Math.round((v.c / v.a) * 100);
                const t = TOPICS[k] ?? { name: k, emoji: "🔢" };
                return (
                  <div key={k}>
                    <div className="flex justify-between text-sm font-bold text-ink">
                      <span>
                        {t.emoji} {t.name}
                      </span>
                      <span>
                        {fmtNum(v.a)} תרגילים · {pct}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", pct >= 80 ? "bg-success" : pct >= 60 ? "bg-warning" : "bg-destructive")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">🎯 נקודות קושי</p>
          {weak.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">צריך לפחות 5 תרגילים בנושא כדי לזהות קושי.</p>
          ) : (
            weak.map(([k, v]) => (
              <p key={k} className="mt-1 text-sm text-ink">
                {TOPICS[k]?.emoji} <b>{TOPICS[k]?.name ?? k}</b> — {Math.round((v.c / v.a) * 100)}% הצלחה.
                {v.c / v.a < 0.8 ? " מומלץ לתרגל עוד כמה דקות ביום." : " מצוין, להמשיך כך!"}
              </p>
            ))
          )}
        </section>

        <section className="grid grid-cols-2 gap-2">
          {[
            ["⏱️", "היום", mins(today)],
            ["📅", "השבוע", mins(week)],
            ["📊", "ממוצע ליום", mins(Math.round(week / 7))],
            ["🔥", "ימים פעילים", fmtNum(active)],
          ].map(([e, l, v]) => (
            <div key={l} className="rounded-2xl bg-card p-3 text-center shadow-card">
              <div className="text-2xl">{e}</div>
              <div className="text-lg font-bold text-ink">{v}</div>
              <div className="text-xs text-muted-foreground">{l}</div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">📈 תשובות נכונות — 14 ימים</p>
          <div className="mt-3 flex h-28 items-end gap-1" dir="ltr">
            {days.map((x) => (
              <div key={x.d} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary"
                  style={{ height: `${Math.max(2, (x.v.c / maxC) * 96)}px` }}
                  title={`${x.d}: ${x.v.c}`}
                />
                <span className="text-[9px] text-muted-foreground">{x.d.slice(8)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">🏅 הישגים</p>
          <p className="mt-1 text-sm text-ink">
            רצף: {profile.streakDays} ימים · מדבקות: {fmtNum(profile.stickers.length)} · גביעים:{" "}
            {fmtNum(profile.trophies)} · שלב {fmtNum(profile.level)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ACHIEVEMENTS.filter((a) => profile.achievements.includes(a.id)).map((a) => (
              <span key={a.id} className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-ink">
                {a.emoji} {a.title}
              </span>
            ))}
          </div>
        </section>

        <button
          onClick={() => {
            update({ parentCode: "" });
            setOpen(false);
            setPin("");
          }}
          className="h-11 rounded-xl bg-muted font-bold text-ink active:scale-95"
        >
          איפוס קוד ההורים
        </button>
      </div>
    </Screen>
  );
}
