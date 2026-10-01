import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { isEnabled } from "@/lib/app-version";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { redeemPromoCode } from "@/lib/admin.functions";
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
import { cn, fmtNum } from "@/lib/utils";
import { useMidnightCountdown } from "@/lib/daily";

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
  // החנות מוחבאת זמנית (FEATURES.shop=false) — כל גישה ישירה מופנית לבית
  if (!isEnabled("shop")) return <Navigate to="/" />;
  const { t } = useI18n();
  const { profile, spendCoins, update, grantSticker, sound, premium, doubling, openChest, linked } =
    useGame();
  const [tab, setTab] = useState<"coins" | "money">("coins");
  const [msg, setMsg] = useState<string | null>(null);
  const countdown = useMidnightCountdown();
  const [chestReward, setChestReward] = useState<ChestReward | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  const [promoErr, setPromoErr] = useState<string | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const redeem = useServerFn(redeemPromoCode);

  const submitPromo = async () => {
    sound("click");
    setPromoErr(null);
    setPromoMsg(null);
    if (!linked) {
      setPromoErr("צריך להתחבר לחשבון כדי לממש קוד מתנה");
      return;
    }
    setPromoBusy(true);
    try {
      const res = await redeem({ data: { promo: promoInput } });
      const n = res.amount;
      if (res.rewardType === "coins") update((p) => ({ coins: p.coins + n }));
      else if (res.rewardType === "hints") update((p) => ({ hints: p.hints + n }));
      else if (res.rewardType === "trophies") update((p) => ({ trophies: p.trophies + n }));
      else if (res.rewardType === "chest")
        update((p) => ({ chestInv: { ...p.chestInv, regular: p.chestInv.regular + n } }));
      else if (res.rewardType === "stickers") for (let i = 0; i < n; i++) grantSticker();
      const labels: Record<string, string> = {
        coins: "🪙 מטבעות",
        hints: "💡 רמזים",
        chest: "🎁 תיבות",
        trophies: "🏆 גביעים",
        stickers: "🌟 מדבקות",
      };
      setPromoMsg(`יש! קיבלתם ${n} ${labels[res.rewardType]}`);
      setPromoInput("");
      sound("win");
    } catch (e) {
      setPromoErr(e instanceof Error ? e.message : "קוד שגוי");
      sound("wrong");
    }
    setPromoBusy(false);
  };

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
        <span className="rounded-full bg-card px-4 py-1 shadow-card">🪙 {fmtNum(profile.coins)}</span>
        <span className="rounded-full bg-card px-4 py-1 shadow-card">💡 {fmtNum(profile.hints)}</span>
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

      {isEnabled("payments") && (<div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
        {(
          [
            { id: "coins", label: "🪙 מטבעות" },
            ...(isEnabled("payments") ? [{ id: "money", label: "💳 כסף" } as const] : []),
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
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 pb-28">
          <p className="font-bold text-ink">🎁 התיבות שלי</p>
          {profile.chests > 0 ? (
            <div className="rounded-2xl bg-sky p-4 text-center shadow-card">
              <p className="text-lg font-bold text-ink">תיבה יומית חינם</p>
              <p className="text-sm">תיבה אחת חינם בכל יום — לא נצברת.</p>
              <button
                onClick={() => openOwned("regular", "free")}
                className="mt-3 h-12 w-full rounded-xl bg-warning text-lg font-bold text-warning-foreground shadow-pop active:scale-95"
              >
                פתחו תיבה חינם 📦
              </button>
            </div>
          ) : (
            <p className="rounded-2xl bg-card p-3 text-center text-sm font-bold text-muted-foreground shadow-card">
              🕒 התיבה היומית הבאה בעוד {countdown}
            </p>
          )}
          {(["regular", "amazing", "legendary"] as ChestKind[]).map((k) => {
            const count = profile.chestInv[k];
            if (count <= 0) return null;
            return (
              <div key={`inv-${k}`} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
                <span className="text-4xl">{CHESTS[k].emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-ink">
                    {CHESTS[k].title} <span className="text-sm">×{count}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">תיבה שקיבלת — מוכנה לפתיחה</p>
                </div>
                <button
                  onClick={() => openOwned(k, "inv")}
                  className="shrink-0 rounded-xl bg-success px-4 py-2 font-bold text-white active:scale-95"
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
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-ink">{CHESTS[k].title}</p>
                <p className="text-sm text-muted-foreground">{CHESTS[k].desc}</p>
              </div>
              <button
                onClick={() => buyChest(k)}
                className="shrink-0 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground active:scale-95"
              >
                🪙 {fmtNum(CHESTS[k].price)}
              </button>
            </div>
          ))}


          <p className="mt-2 font-bold text-ink">רמזים</p>
          {HINT_PACKS.map((h) => (
            <div key={h.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
              <span className="text-4xl">{h.emoji}</span>
              <div className="min-w-0 flex-1">
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
                className="shrink-0 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground active:scale-95"
              >
                🪙 {fmtNum(h.price)}
              </button>
            </div>
          ))}

          <p className="mt-2 font-bold text-ink">גלגל מזל</p>
          <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
            <span className="text-4xl">🎡</span>
            <div className="min-w-0 flex-1">
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
              className="shrink-0 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground active:scale-95"
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
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-ink">
                    {ticket.title} {owned > 0 && <span className="text-sm">×{owned}</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">{ticket.desc}</p>
                </div>
                {ticket.price != null ? (
                  <button
                    onClick={() => buyTicket(t, ticket.price!)}
                    className="shrink-0 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground active:scale-95"
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
            <div className="min-w-0 flex-1">
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
              className="shrink-0 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground active:scale-95"
            >
              🪙 60
            </button>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
            <span className="text-4xl">⏩</span>
            <div className="min-w-0 flex-1">
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
              className="shrink-0 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground active:scale-95"
            >
              🪙 100
            </button>

          </div>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <label htmlFor="promo" className="text-lg font-bold text-ink">
            🎟️ קוד מתנה
          </label>
          <p className="text-sm text-muted-foreground">קיבלתם קוד? הכניסו אותו כאן וקבלו את הפרס.</p>
          <div className="mt-2 flex gap-2">
            <input
              id="promo"
              dir="ltr"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              maxLength={16}
              placeholder="FREECOINS"
              className="h-12 min-w-0 flex-1 rounded-xl border-2 border-muted bg-background px-3 text-lg text-ink outline-none focus:border-primary"
            />
            <button
              disabled={promoBusy}
              onClick={() => void submitPromo()}
              className="h-12 rounded-xl bg-primary px-4 font-bold text-primary-foreground active:scale-95 disabled:opacity-60"
            >
              מימוש
            </button>
          </div>
          {promoMsg && <p className="mt-2 font-bold text-success">{promoMsg}</p>}
          {promoErr && <p className="mt-2 font-bold text-destructive">{promoErr}</p>}
        </section>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 pb-28">
          <p className="rounded-2xl bg-sky p-3 text-center font-bold text-ink shadow-card">
            🚧 בקרוב – חנות נפתחת
          </p>
          {MONEY_ITEMS.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-2xl bg-muted p-4 opacity-70 shadow-card"
            >
              <span className="text-4xl grayscale">{item.emoji}</span>
              <div className="min-w-0 flex-1">
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
