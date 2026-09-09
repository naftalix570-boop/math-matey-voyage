import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { redeemPromoCode } from "@/lib/admin.functions";
import { useGame } from "@/lib/game-state";

const PENDING_KEY = "math-journey:pending-promo";

const LABELS: Record<string, string> = {
  coins: "🪙 מטבעות",
  hints: "💡 רמזים",
  chest: "🎁 תיבות",
  trophies: "🏆 גביעים",
  stickers: "🌟 מדבקות",
};

/** קולט קישור מתנה (?promo=CODE) ומממש אותו אוטומטית ברגע שיש חשבון מחובר. */
export function PromoAutoRedeem() {
  const { ready, linked, update, grantSticker, sound } = useGame();
  const redeem = useServerFn(redeemPromoCode);
  const [pending, setPending] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const working = useRef(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get("promo");
    if (fromUrl) {
      localStorage.setItem(PENDING_KEY, fromUrl.trim().toUpperCase().slice(0, 16));
      url.searchParams.delete("promo");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
    setPending(localStorage.getItem(PENDING_KEY));
  }, []);

  useEffect(() => {
    if (!pending || !ready || !linked || working.current) return;
    working.current = true;
    void (async () => {
      try {
        const res = await redeem({ data: { promo: pending } });
        const n = res.amount;
        if (res.rewardType === "coins") update((p) => ({ coins: p.coins + n }));
        else if (res.rewardType === "hints") update((p) => ({ hints: p.hints + n }));
        else if (res.rewardType === "trophies") update((p) => ({ trophies: p.trophies + n }));
        else if (res.rewardType === "chest")
          update((p) => ({ chestInv: { ...p.chestInv, regular: p.chestInv.regular + n } }));
        else if (res.rewardType === "stickers") for (let i = 0; i < n; i++) grantSticker();
        setMsg(`🎉 קיבלתם ${n} ${LABELS[res.rewardType] ?? ""}`);
        sound("win");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "הקוד לא תקין");
        sound("wrong");
      }
      localStorage.removeItem(PENDING_KEY);
      setPending(null);
      working.current = false;
    })();
  }, [pending, ready, linked, redeem, update, grantSticker, sound]);

  const close = () => {
    setMsg(null);
    setErr(null);
  };

  if (msg || err) {
    return (
      <div className="fixed inset-x-0 top-3 z-[60] flex justify-center px-3" dir="rtl">
        <button
          onClick={close}
          className={`w-full max-w-sm rounded-2xl px-4 py-3 text-center font-bold shadow-card ${
            err ? "bg-destructive text-destructive-foreground" : "bg-success text-background"
          }`}
        >
          {msg ?? err}
        </button>
      </div>
    );
  }

  if (pending && ready && !linked) {
    return (
      <div className="fixed inset-x-0 top-3 z-[60] flex justify-center px-3" dir="rtl">
        <Link
          to="/auth"
          className="w-full max-w-sm rounded-2xl bg-primary px-4 py-3 text-center font-bold text-primary-foreground shadow-card"
        >
          🎁 יש לכם מתנה ממתינה — התחברו כדי לקבל אותה
        </Link>
      </div>
    );
  }

  return null;
}
