import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/app-shell";
import { useI18n } from "@/lib/i18n";
import {
  CHESTS,
  TICKETS,
  useGame,
  type ChestKind,
  type ChestReward,
  type TicketId,
} from "@/lib/game-state";
import { stickerForSlot } from "@/lib/stickers";
import { ChestOpenOverlay } from "@/components/effects";
import { rewardItems } from "@/lib/chest-rewards";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "חנות — מסע המתמטיקס" },
      { name: "description", content: "חבילות רמזים, תיבות, כרטיסים ובוסטים במטבעות שצברת." },
      { property: "og:title", content: "חנות — מסע המתמטיקס" },
      { property: "og:description", content: "חבילות רמזים, תיבות, כרטיסים ובוסטים." },
    ],
  }),
  component: ShopPage,
});

function remaining(until: number) {
  const ms = Math.max(0, until - Date.now());
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h} שע' ו-${m} דק'` : `${m} דק'`;
}

const HINT_PACKS = [
  { id: "h5", title: "5 רמזים", emoji: "💡", price: 350, money: 2.9, hints: 5 },
  { id: "h15", title: "15 רמזים", emoji: "🎁", price: 600, money: 4.9, hints: 15 },
  { id: "h40", title: "40 רמזים", emoji: "🎁", price: 1500, money: 8.9, hints: 40 },
];

const MONEY_ITEMS = [
  ...(["regular", "amazing", "legendary"] as ChestKind[]).map((k) => ({
    id: `m-${k}`,
    title: CHESTS[k].title,
    desc: CHESTS[k].desc,
    emoji: CHESTS[k].emoji,
    money: CHESTS[k].money,
  })),
  ...HINT_PACKS.map((h) => ({
    id: `m-${h.id}`,
    title: h.title,
    desc: "חבילת רמזים",
    emoji: h.emoji,
    money: h.money,
  })),
  { id: "m-wheel", title: "גלגל מזל — 3 סיבובים", desc: "3 סיבובים בגלגל המזל", emoji: "🎡", money: 3.9 },
  {
    id: "m-prem-m",
    title: "פרימיום חודשי",
    desc: "אינסוף רמזים · כפל מטבעות · תיבה יומית · גלגל חינם · 35 מטבעות בונוס ברצף · 👑 ליד השם · תיבה אגדית חינם בחודש",
    emoji: "👑",
    money: 24.9,
  },
  {
    id: "m-prem-y",
    title: "פרימיום שנתי",
    desc: "כל ההטבות לשנה שלמה — מתחדש אוטומטית",
    emoji: "👑",
    money: 119.9,
  },
];

function ShopPage() {
  const { t } = useI18n();
  const { profile, spendCoins, update, grantSticker, sound, premium, doubling, openChest } =
    useGame();
  const [tab, setTab] = useState<"coins" | "money">("coins");
  const [msg, setMsg] = useState<string | null>(null);
  const [chestReward, setChestReward] = useState<ChestReward | null>(null);

  const buy = (id: string, price: number, apply: () => string) => {
    if (!spendCoins(price)) {
      sound("wrong");
      setMsg("אין מספיק מטבעות 😅 שחקו עוד כדי לצבור!");
      return;
    }
    sound("correct");
    setMsg(apply());
  };

  const buyChest = (kind: ChestKind) => {
    const r = openChest(kind, "coins");
    if (!r) {
      sound("wrong");
      setMsg("אין מספיק מטבעות 😅 שחקו עוד כדי לצבור!");
      return;
    }
    sound("levelup");
    setChestReward(r);
    setMsg(null);
  };

  const openOwned = (kind: ChestKind, src: "free" | "inv") => {
    const r = openChest(kind, src);
    if (!r) {
      sound("wrong");
      setMsg(src === "free" ? "התיבה היומית כבר נפתחה — חוזרים מחר! 🕒" : "אין לך תיבה כזו במלאי");
      return;
    }
    sound("levelup");
    setChestReward(r);
    setMsg(null);
  };


  const buyTicket = (t: TicketId, price: number) =>
    buy(`t-${t}`, price, () => {
      update((p) => ({ tickets: { ...p.tickets, [t]: p.tickets[t] + 1 } }));
      return `נרכש כרטיס ${TICKETS[t].title} ${TICKETS[t].emoji}`;
    });

  return (
    <Screen title={t("title.shop")}>
      <div className="mt-2 flex items-center justify-center gap-3 text-lg font-bold text-ink">
        <span className="rounded-full bg-card px-4 py-1 shadow-card">🪙 {profile.coins}</span>
        <span className="rounded-full bg-card px-4 py-1 shadow-card">💡 {profile.hints}</span>
      </div>

      {(premium || doubling) && (
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm font-bold">
          {premium && (
            <span className="rounded-full bg-warning px-3 py-1 text-white">
              👑 פרימיום פעיל — נשאר {remaining(profile.boosts.premiumUntil)}
            </span>
          )}
          {doubling && profile.boosts.doubleUntil > Date.now() && (
            <span className="rounded-full bg-success px-3 py-1 text-white">
              ⏩ כפל מטבעות — נשאר {remaining(profile.boosts.doubleUntil)}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
        {(
          [
            { id: "coins", label: "🪙 מטבעות" },
            { id: "money", label: "💳 כסף" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => {
              sound("click");
              setTab(t.id);
            }}
            className={cn(
              "h-11 rounded-xl text-lg font-bold transition-colors",
              tab === t.id ? "bg-card text-ink shadow-card" : "text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-nav/50 p-6"
          onClick={() => setMsg(null)}
        >
          <div className="animate-pop w-full max-w-xs rounded-3xl bg-card p-6 text-center shadow-pop">
            <p className="text-4xl">🪙</p>
            <p className="mt-2 text-lg font-bold text-ink">{msg}</p>
            <button
              onClick={() => setMsg(null)}
              className="mt-4 h-11 w-full rounded-xl bg-primary font-bold text-primary-foreground active:scale-95"
            >
              הבנתי
            </button>
          </div>
        </div>
      )}


      {chestReward && (
        <ChestOpenOverlay
          emoji={CHESTS[chestReward.kind].emoji}
          title={`נפתחה ${CHESTS[chestReward.kind].title}!`}
          items={rewardItems(chestReward)}
          onClose={() => setChestReward(null)}
        />
      )}

      {tab === "coins" ? (
        <div className="mt-4 grid gap-3 pb-28">
          <p className="font-bold text-ink">🎁 התיבות שלי</p>
          <div className="rounded-2xl bg-sky p-4 text-center shadow-card">
            <p className="text-lg font-bold text-ink">תיבה יומית חינם</p>
            <p className="text-sm">תיבה אחת חינם בכל יום — לא נצברת.</p>
            <button
              onClick={() => openOwned("regular", "free")}
              disabled={profile.chests <= 0}
              className={cn(
                "mt-3 h-12 w-full rounded-xl text-lg font-bold active:scale-95",
                profile.chests > 0
                  ? "bg-warning text-warning-foreground shadow-pop"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {profile.chests > 0 ? "פתחו תיבה חינם 📦" : "חזרו מחר 🕒"}
            </button>
          </div>
          {(["regular", "amazing", "legendary"] as ChestKind[]).map((k) => {
            const count = profile.chestInv[k];
            if (count <= 0) return null;
            return (
              <div key={`inv-${k}`} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
                <span className="text-4xl">{CHESTS[k].emoji}</span>
                <div className="flex-1">
                  <p className="text-lg font-bold text-ink">
                    {CHESTS[k].title} <span className="text-sm">×{count}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">תיבה שקיבלת — מוכנה לפתיחה</p>
                </div>
                <button
                  onClick={() => openOwned(k, "inv")}
                  className="rounded-xl bg-success px-4 py-2 font-bold text-white active:scale-95"
                >
                  פתחו
                </button>
              </div>
            );
          })}

          <p className="mt-2 font-bold text-ink">קניית תיבות</p>
          {(["regular", "amazing", "legendary"] as ChestKind[]).map((k) => (
            <div key={k} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
              <span className="text-4xl">{CHESTS[k].emoji}</span>
              <div className="flex-1">
                <p className="text-lg font-bold text-ink">{CHESTS[k].title}</p>
                <p className="text-sm text-muted-foreground">{CHESTS[k].desc}</p>
              </div>
              <button
                onClick={() => buyChest(k)}
                className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground active:scale-95"
              >
                🪙 {CHESTS[k].price.toLocaleString("he-IL")}
              </button>
            </div>
          ))}


          <p className="mt-2 font-bold text-ink">רמזים</p>
          {HINT_PACKS.map((h) => (
            <div key={h.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
              <span className="text-4xl">{h.emoji}</span>
              <div className="flex-1">
                <p className="text-lg font-bold text-ink">{h.title}</p>
                <p className="text-sm text-muted-foreground">עוזר בתרגילים קשים</p>
              </div>
              <button
                onClick={() =>
                  buy(h.id, h.price, () => {
                    update((p) => ({ hints: p.hints + h.hints }));
                    return `נוספו ${h.hints} רמזים ✅`;
                  })
                }
                className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground active:scale-95"
              >
                🪙 {h.price.toLocaleString("he-IL")}
              </button>
            </div>
          ))}

          <p className="mt-2 font-bold text-ink">גלגל מזל</p>
          <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
            <span className="text-4xl">🎡</span>
            <div className="flex-1">
              <p className="text-lg font-bold text-ink">3 סיבובים</p>
              <p className="text-sm text-muted-foreground">אין הגבלה על סיבובים בתשלום</p>
            </div>
            <button
              onClick={() =>
                buy("wheel3", 600, () => {
                  update((p) => ({ spins: p.spins + 3 }));
                  return "נוספו 3 סיבובים לגלגל המזל 🎡";
                })
              }
              className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground active:scale-95"
            >
              🪙 600
            </button>
          </div>
          <Link
            to="/wheel"
            className="flex h-12 items-center justify-center rounded-2xl bg-sky font-bold text-ink shadow-card active:scale-95"
          >
            🎡 לסובב את גלגל המזל ({profile.spins})
          </Link>


          <p className="mt-2 font-bold text-ink">כרטיסים</p>
          {(Object.keys(TICKETS) as TicketId[]).map((t) => {
            const ticket = TICKETS[t];
            const owned = profile.tickets[t];
            return (
              <div
                key={t}
                className={cn(
                  "flex items-center gap-3 rounded-2xl p-4 shadow-card",
                  ticket.price == null ? "bg-muted opacity-70" : "bg-card",
                )}
              >
                <span className="text-4xl">{ticket.emoji}</span>
                <div className="flex-1">
                  <p className="text-lg font-bold text-ink">
                    {ticket.title} {owned > 0 && <span className="text-sm">×{owned}</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">{ticket.desc}</p>
                </div>
                {ticket.price != null ? (
                  <button
                    onClick={() => buyTicket(t, ticket.price!)}
                    className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground active:scale-95"
                  >
                    🪙 {ticket.price}
                  </button>
                ) : (
                  <span className="rounded-xl bg-muted px-3 py-2 text-sm font-bold text-muted-foreground">
                    לא נמכר
                  </span>
                )}
              </div>
            );
          })}

          <p className="mt-2 font-bold text-ink">עוד</p>
          <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
            <span className="text-4xl">🎟️</span>
            <div className="flex-1">
              <p className="text-lg font-bold text-ink">מדבקת הפתעה</p>
              <p className="text-sm text-muted-foreground">מדבקה אקראית לאלבום</p>
            </div>
            <button
              onClick={() =>
                buy("sticker", 60, () => {
                  const slot = grantSticker();
                  return slot == null
                    ? "האלבום מלא! 🎉"
                    : `קיבלת מדבקה: ${stickerForSlot(slot).emoji} ${stickerForSlot(slot).name}`;
                })
              }
              className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground active:scale-95"
            >
              🪙 60
            </button>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
            <span className="text-4xl">⏩</span>
            <div className="flex-1">
              <p className="text-lg font-bold text-ink">כפל מטבעות שעה</p>
              <p className="text-sm text-muted-foreground">פי 2 מטבעות למשך שעה</p>
            </div>
            <button
              onClick={() =>
                buy("double", 100, () => {
                  update((p) => ({
                    boosts: {
                      ...p.boosts,
                      doubleUntil: Math.max(Date.now(), p.boosts.doubleUntil) + 3600000,
                    },
                  }));
                  return "כפל מטבעות פעיל לשעה! ⏩";
                })
              }
              className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground active:scale-95"
            >
              🪙 100
            </button>

          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 pb-28">
          <p className="rounded-2xl bg-sky p-3 text-center font-bold text-ink shadow-card">
            🚧 בקרוב – חנות נפתחת
          </p>
          {MONEY_ITEMS.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-2xl bg-muted p-4 opacity-70 shadow-card"
            >
              <span className="text-4xl grayscale">{item.emoji}</span>
              <div className="flex-1">
                <p className="text-lg font-bold text-ink">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <button
                disabled
                className="cursor-not-allowed rounded-xl bg-muted px-3 py-2 text-sm font-bold text-muted-foreground"
              >
                ₪{item.money.toFixed(2)}
                <br />
                בעתיד יפתח
              </button>
            </div>
          ))}
        </div>
      )}
    </Screen>
  );
}
