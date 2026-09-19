import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/app-shell";
import { Logo, Confetti } from "@/components/effects";
import { PlacementTest } from "@/components/mini-games";
import { useGame, EVENTS, nextEventChange, ICONS } from "@/lib/game-state";
import { weeklyChallenge } from "@/lib/games";
import { ALBUM_SIZE } from "@/lib/stickers";
import { useOnline } from "@/lib/use-online";
import { useI18n } from "@/lib/i18n";
import { cn, fmtNum } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "מסע המתמטיקס — לומדים חשבון בכיף" },
      {
        name: "description",
        content:
          "משחקי חשבון לילדים בעברית: חיבור, חיסור, כפל וחילוק עם מדבקות, מטבעות ושלבים מתקדמים.",
      },
      { property: "og:title", content: "מסע המתמטיקס — לומדים חשבון בכיף" },
      {
        property: "og:description",
        content: "15 משחקי חשבון לילדים עם אלבום מדבקות, מטבעות ושלבים.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { profile, ready, update, sound, premium, event } = useGame();
  const { t } = useI18n();
  const [mode, setMode] = useState<"welcome" | "test">("welcome");
  const [name, setName] = useState("");
  const [iconPicker, setIconPicker] = useState(false);
  const online = useOnline();

  if (!ready) return <div className="min-h-screen bg-background" />;

  if (!profile.onboarded) {
    return (
      <Screen back={false} nav={false}>
        {mode === "welcome" ? (
          <div className="flex flex-col items-center gap-4 pt-10 text-center">
            <Logo size={130} bounce={1} />
            <h1 className="text-3xl font-bold text-ink">{t("app.name")}</h1>
            <p className="text-muted-foreground">{t("home.tagline")}</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("home.namePlaceholder")}
              className="h-12 w-full rounded-xl border border-input bg-card px-4 text-center text-lg"
            />
            <button
              onClick={() => {
                sound("click");
                if (name.trim()) update({ name: name.trim() });
                setMode("test");
              }}
              className="h-14 w-full rounded-xl bg-primary text-xl font-bold text-primary-foreground shadow-pop active:scale-95"
            >
              {t("home.start")}
            </button>
            <button
              onClick={() => {
                sound("click");
                update({
                  onboarded: true,
                  guest: true,
                  name: name.trim() || `אורח/ת ${profile.userId}`,
                });
              }}
              className="h-12 w-full rounded-xl bg-card text-lg font-bold text-ink shadow-card active:scale-95"
            >
              {t("home.guest")}
            </button>
            <button
              onClick={() => {
                sound("click");
                update({ onboarded: true, ...(name.trim() ? { name: name.trim() } : {}) });
              }}
              className="flex h-11 w-full items-center justify-center text-sm text-muted-foreground underline"
            >
              {t("home.skipTest")}
            </button>
          </div>
        ) : (
          <div className="pt-6">
            <h2 className="mb-3 text-center text-xl font-bold text-ink">
              {t("home.testTitle")}
            </h2>
            <PlacementTest
              onDone={(level) => {
                sound("levelup");
                update({ level, onboarded: true });
              }}
            />
          </div>
        )}
      </Screen>
    );
  }

  const weekly = weeklyChallenge();
  const pct = Math.round((profile.history.slice(-40).filter(Boolean).length / 40) * 100);
  const showRating = profile.correctSinceRating >= 10 && !profile.rated;

  return (
    <Screen back={false}>
      <Confetti show={false} />
      {showRating && <RatingCard />}

      <div className="flex items-center justify-between pt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound("click");
              setIconPicker(true);
            }}
            aria-label="בחירת אימוג'י פרופיל"
            className="relative flex size-14 items-center justify-center rounded-full bg-card text-3xl shadow-card active:scale-95"
          >
            {profile.icon}
            <span className="absolute -bottom-1 -left-1 rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              ✏️
            </span>
          </button>
          <div>
            <p className="text-sm text-muted-foreground">{t("common.hello")}</p>
            <h1 className="flex items-center gap-1 text-2xl font-bold text-ink">
              {profile.name}
              {premium && <span title="פרימיום">👑</span>}
            </h1>
          </div>
        </div>
        <Logo size={72} />
      </div>

      {iconPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-nav/50 p-4"
          onClick={() => setIconPicker(false)}
        >
          <div
            className="animate-pop w-full max-w-sm rounded-3xl bg-card p-5 shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-bold text-ink">בחרו אימוג'י פרופיל</p>
            <p className="text-sm text-muted-foreground">
              אימוג'ים נעולים נפתחים מתיבות ומפרסים — אספו עוד! ({profile.icons.length}/
              {ICONS.length})
            </p>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {ICONS.map((ic) => {
                const owned = profile.icons.includes(ic.emoji);
                const active = profile.icon === ic.emoji;
                return (
                  <button
                    key={ic.id}
                    disabled={!owned}
                    aria-label={`אימוג'י ${ic.emoji}`}
                    onClick={() => {
                      sound("click");
                      update({ icon: ic.emoji });
                      setIconPicker(false);
                    }}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-xl text-2xl transition-all",
                      active ? "bg-primary/15 ring-2 ring-primary" : "bg-muted",
                      !owned && "opacity-40",
                    )}
                  >
                    {owned ? ic.emoji : "🔒"}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setIconPicker(false)}
              className="mt-4 h-11 w-full rounded-xl bg-primary font-bold text-primary-foreground active:scale-95"
            >
              סגירה
            </button>
          </div>
        </div>
      )}


      {!online && (
        <div className="mt-3 rounded-xl bg-sky px-3 py-2 text-center text-sm font-bold text-ink">
          {premium ? t("offline.premium") : t("offline.free")}
        </div>
      )}

      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <Stat emoji="🏆" label={t("stat.trophies")} value={profile.trophies} />
        <Stat emoji="🪙" label={t("stat.coins")} value={profile.coins} />
        <Stat emoji="💡" label={t("stat.hints")} value={premium ? "∞" : profile.hints} />
        <Stat emoji="🔥" label={t("stat.streak")} value={profile.streakDays} />
      </div>

      <div className="mt-4 rounded-2xl bg-card p-4 shadow-card">
        <div className="flex justify-between font-bold text-ink">
          <span>{t("common.stage")} {profile.level}</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-progress transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("home.solvedOf", { a: profile.totalCorrect, b: profile.totalAnswered })}
        </p>
      </div>

      <Link
        to="/play/$gameId"
        params={{ gameId: "topic" }}
        onClick={() => sound("click")}
        className="mt-4 flex h-16 w-full items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-pop active:scale-95"
      >
        {t("common.play")}
      </Link>

      {profile.guest && (
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-sky px-4 py-3 font-bold text-ink shadow-card active:scale-95"
        >
          {t("home.saveCloud")}
        </Link>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Tile to="/streak" emoji="🔥" label={t("tile.streak")} />
        <Tile to="/missions" emoji="🗒️" label={t("tile.missions")} />
        <Tile to="/progress" emoji="📊" label={t("tile.progress")} />
      </div>


      {profile.weeklyDone !== weekly.weekKey && (
        <div className="mt-4 rounded-2xl bg-sky p-4 shadow-card">
          <p className="font-bold text-ink">{t("home.weekly")}</p>
          <p className="text-sm">{weekly.text}</p>
          <Link
            to="/play/$gameId"
            params={{ gameId: "weekly" }}
            className="mt-3 flex h-11 items-center justify-center rounded-xl bg-warning font-bold text-warning-foreground active:scale-95"
          >
            {t("home.toChallenge")}
          </Link>
        </div>
      )}

      <Link
        to="/album"
        onClick={() => sound("click")}
        className="mt-4 block rounded-2xl bg-card p-4 text-center shadow-card active:scale-95"
      >
        <p className="font-bold text-ink">{t("home.albumTitle")}</p>
        <p className="text-sm text-muted-foreground">
          {t("home.albumSub", {
            a: profile.stickers.length,
            b: ALBUM_SIZE,
            c: 30 - profile.correctSinceSticker,
          })}
        </p>
      </Link>

      <EventCard />

      <div className="pb-28" />
    </Screen>
  );
}

function EventCard() {
  const { event, sound } = useGame();
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const next = nextEventChange();
  const dateStr = next.toLocaleDateString(lang === "he" ? "he-IL" : lang, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mt-4 rounded-2xl bg-card p-4 shadow-card">
      <button
        type="button"
        onClick={() => {
          sound("click");
          setOpen((o) => !o);
        }}
        className="w-full text-right"
      >
        <p className="font-bold text-ink">
          {event.emoji} {t("home.event")} — {event.title}
          <span className="mr-1 text-xs text-muted-foreground">{open ? "▲" : "▼"}</span>
        </p>
        <p className="text-sm text-muted-foreground">{event.desc}</p>
      </button>
      {open && (
        <div className="mt-3 border-t border-muted pt-3">
          <p className="text-sm font-bold text-ink">{t("home.eventChange", { d: dateStr })}</p>
          <p className="mt-1 mb-2 text-xs text-muted-foreground">{t("home.eventAll")}</p>
          <div className="grid gap-2">
            {EVENTS.map((ev) => (
              <div
                key={ev.week}
                className={
                  ev.week === event.week
                    ? "rounded-xl bg-sky p-2"
                    : "rounded-xl bg-muted/60 p-2"
                }
              >
                <p className="text-sm font-bold text-ink">
                  {ev.emoji} {ev.title}
                  {ev.week === event.week && (
                    <span className="mr-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                      {t("home.eventActive")}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{ev.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RatingCard() {
  const { update, sound } = useGame();
  const { t } = useI18n();
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  if (sent)
    return (
      <div className="mt-3 rounded-2xl bg-card p-4 text-center shadow-card">
        <p className="font-bold text-ink">{t("home.rateThanks")}</p>
      </div>
    );

  const low = stars > 0 && stars <= 3;

  return (
    <div className="mt-3 rounded-2xl bg-card p-4 shadow-card">
      <p className="text-center font-bold text-ink">{t("home.rateQ")}</p>
      <div className="mt-2 flex justify-center gap-1 text-3xl">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            aria-label={`${s} כוכבים`}
            onClick={() => {
              sound("click");
              setStars(s);
            }}
            className="active:scale-90"
          >
            {s <= stars ? "⭐" : "☆"}
          </button>
        ))}
      </div>

      {stars > 0 && (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("home.rateMore")}
            className="mt-3 w-full rounded-xl border-2 border-muted bg-background p-3 text-sm text-ink outline-none focus:border-primary"
            rows={3}
          />
          {low ? (
            <a
              href={`mailto:feedback@math-journey.app?subject=${encodeURIComponent(
                `דירוג ${stars} כוכבים`,
              )}&body=${encodeURIComponent(text)}`}
              onClick={() => {
                update({ rated: true, correctSinceRating: 0 });
                setSent(true);
              }}
              className="mt-3 flex h-12 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground"
            >
              {t("home.rateSend")}
            </a>
          ) : (
            <button
              onClick={() => {
                update({ rated: true, correctSinceRating: 0 });
                setSent(true);
              }}
              className="mt-3 h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground active:scale-95"
            >
              {t("home.rateStore")}
            </button>
          )}
        </>
      )}

      <button
        onClick={() => update({ correctSinceRating: 0 })}
        className="mt-2 w-full text-xs text-muted-foreground underline"
      >
        {t("common.later")}
      </button>
    </div>
  );
}

function Stat({ emoji, label, value }: { emoji: string; label: string; value: number | string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl bg-card p-3 shadow-card">
      <div className="text-2xl">{emoji}</div>
      <div className="truncate text-lg font-bold text-ink tabular-nums">
        {typeof value === "number" ? fmtNum(value) : value}
      </div>
      <div className="truncate text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Tile({
  to,
  emoji,
  label,
}: {
  to:
    | "/games"
    | "/album"
    | "/shop"
    | "/chests"
    | "/progress"
    | "/settings"
    | "/wheel"
    | "/streak"
    | "/missions"
    | "/leaderboard";
  emoji: string;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center rounded-2xl bg-card p-3 shadow-card active:scale-95"
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-sm font-bold text-ink">{label}</span>
    </Link>
  );
}
