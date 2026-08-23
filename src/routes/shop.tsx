import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/app-shell";
import { useGame } from "@/lib/game-state";
import { stickerForSlot } from "@/lib/stickers";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "חנות — מסע המתמטיקס" },
      { name: "description", content: "חבילות רמזים, מדבקות ובוסטים במטבעות שצברת." },
      { property: "og:title", content: "חנות — מסע המתמטיקס" },
      { property: "og:description", content: "חבילות רמזים, מדבקות ובוסטים." },
    ],
  }),
  component: ShopPage,
});

type Item = {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  price: number;
};

const ITEMS: Item[] = [
  { id: "hint1", title: "רמז אחד", desc: "עוזר בתרגיל קשה", emoji: "💡", price: 10 },
  { id: "hint5", title: "חבילת 5 רמזים", desc: "משתלם יותר!", emoji: "🎁", price: 40 },
  { id: "sticker", title: "מדבקת הפתעה", desc: "מדבקה אקראית לאלבום", emoji: "🎟️", price: 60 },
  { id: "double", title: "כפל מטבעות שעה", desc: "פי 2 מטבעות למשך שעה", emoji: "⏩", price: 80 },
  { id: "premium", title: "פרימיום ליום", desc: "רמזים ללא הגבלה 24 שעות", emoji: "👑", price: 150 },
];

function ShopPage() {
  const { profile, spendCoins, update, grantSticker, sound, premium, doubling } = useGame();
  const [msg, setMsg] = useState<string | null>(null);

  const buy = (item: Item) => {
    if (!spendCoins(item.price)) {
      sound("wrong");
      setMsg("אין מספיק מטבעות 😅 שחקו עוד כדי לצבור!");
      return;
    }
    sound("correct");
    if (item.id === "hint1") update((p) => ({ hints: p.hints + 1 }));
    if (item.id === "hint5") update((p) => ({ hints: p.hints + 5 }));
    if (item.id === "sticker") {
      const slot = grantSticker();
      setMsg(
        slot == null
          ? "האלבום מלא! 🎉"
          : `קיבלת מדבקה: ${stickerForSlot(slot).emoji} ${stickerForSlot(slot).name}`,
      );
      return;
    }
    if (item.id === "double")
      update((p) => ({
        boosts: { ...p.boosts, doubleUntil: Math.max(Date.now(), p.boosts.doubleUntil) + 3600000 },
      }));
    if (item.id === "premium")
      update((p) => ({
        boosts: { ...p.boosts, premiumUntil: Math.max(Date.now(), p.boosts.premiumUntil) + 86400000 },
      }));
    setMsg(`הקנייה הושלמה: ${item.title} ✅`);
  };

  return (
    <Screen title="חנות">
      <div className="mt-2 flex items-center justify-center gap-3 text-lg font-bold text-ink">
        <span className="rounded-full bg-card px-4 py-1 shadow-card">🪙 {profile.coins}</span>
        <span className="rounded-full bg-card px-4 py-1 shadow-card">💡 {profile.hints}</span>
      </div>

      {(premium || doubling) && (
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm font-bold">
          {premium && (
            <span className="rounded-full bg-warning px-3 py-1 text-white">👑 פרימיום פעיל</span>
          )}
          {doubling && (
            <span className="rounded-full bg-success px-3 py-1 text-white">⏩ כפל מטבעות פעיל</span>
          )}
        </div>
      )}

      {msg && (
        <p className="mt-3 rounded-2xl bg-card p-3 text-center font-bold text-ink shadow-card">
          {msg}
        </p>
      )}

      <div className="mt-4 grid gap-3 pb-28">
        {ITEMS.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card"
          >
            <span className="text-4xl">{item.emoji}</span>
            <div className="flex-1">
              <p className="text-lg font-bold text-ink">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
            <button
              onClick={() => buy(item)}
              className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground active:scale-95"
            >
              🪙 {item.price}
            </button>
          </div>
        ))}
      </div>
    </Screen>
  );
}
