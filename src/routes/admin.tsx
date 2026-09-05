import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Screen } from "@/components/app-shell";
import {
  createPromoCode,
  deletePromoCode,
  listAdminUsers,
  listPromoCodes,
  type RewardType,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "ניהול — מסע המתמטיקס" },
      { name: "description", content: "מסך ניהול: שחקנים וקודי קידום." },
      { property: "og:title", content: "ניהול — מסע המתמטיקס" },
      { property: "og:description", content: "מסך ניהול: שחקנים וקודי קידום." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const REWARD_LABELS: Record<RewardType, string> = {
  coins: "🪙 מטבעות",
  hints: "💡 רמזים",
  chest: "🎁 תיבות",
  trophies: "🏆 גביעים",
  stickers: "🌟 מדבקות",
};

type UserRow = Awaited<ReturnType<typeof listAdminUsers>>[number];
type CodeRow = Awaited<ReturnType<typeof listPromoCodes>>[number];

function AdminPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState<string | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rewardType, setRewardType] = useState<RewardType>("coins");
  const [amount, setAmount] = useState(10);
  const [maxUses, setMaxUses] = useState(10);
  const [custom, setCustom] = useState("");

  const fetchUsers = useServerFn(listAdminUsers);
  const fetchCodes = useServerFn(listPromoCodes);
  const addCode = useServerFn(createPromoCode);
  const removeCode = useServerFn(deletePromoCode);

  useEffect(() => {
    const saved = sessionStorage.getItem("math-journey:admin");
    if (!saved) {
      void navigate({ to: "/settings" });
      return;
    }
    setCode(saved);
  }, [navigate]);

  useEffect(() => {
    if (!code) return;
    void (async () => {
      try {
        const [u, c] = await Promise.all([
          fetchUsers({ data: { code } }),
          fetchCodes({ data: { code } }),
        ]);
        setUsers(u);
        setCodes(c);
      } catch (e) {
        setError(e instanceof Error ? e.message : "שגיאה");
      }
    })();
  }, [code, fetchUsers, fetchCodes]);

  const create = async () => {
    if (!code) return;
    setBusy(true);
    setError(null);
    try {
      await addCode({ data: { code, rewardType, amount, maxUses, custom } });
      setCustom("");
      setCodes(await fetchCodes({ data: { code } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה");
    }
    setBusy(false);
  };

  const drop = async (promo: string) => {
    if (!code) return;
    await removeCode({ data: { code, promo } });
    setCodes(await fetchCodes({ data: { code } }));
  };

  return (
    <Screen title="מסך ניהול">
      <div className="mt-2 grid gap-3 pb-28">
        {error && (
          <p className="rounded-xl bg-destructive/10 p-3 text-center font-bold text-destructive">
            {error}
          </p>
        )}

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">צור קוד קידום חדש</p>
          <div className="mt-3 grid gap-2">
            <select
              value={rewardType}
              onChange={(e) => setRewardType(e.target.value as RewardType)}
              className="h-12 rounded-xl border-2 border-muted bg-background px-3 text-ink"
              aria-label="סוג פרס"
            >
              {(Object.keys(REWARD_LABELS) as RewardType[]).map((r) => (
                <option key={r} value={r}>
                  {REWARD_LABELS[r]}
                </option>
              ))}
            </select>
            <label className="text-sm font-bold text-muted-foreground" htmlFor="amount">
              כמות
            </label>
            <input
              id="amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="h-12 rounded-xl border-2 border-muted bg-background px-3 text-ink"
            />
            <label className="text-sm font-bold text-muted-foreground" htmlFor="uses">
              מספר שימושים
            </label>
            <input
              id="uses"
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              className="h-12 rounded-xl border-2 border-muted bg-background px-3 text-ink"
            />
            <label className="text-sm font-bold text-muted-foreground" htmlFor="custom">
              קוד מותאם (אופציונלי)
            </label>
            <input
              id="custom"
              dir="ltr"
              value={custom}
              onChange={(e) => setCustom(e.target.value.toUpperCase())}
              placeholder="FREECOINS"
              className="h-12 rounded-xl border-2 border-muted bg-background px-3 text-ink"
            />
            <button
              disabled={busy}
              onClick={() => void create()}
              className="h-12 rounded-xl bg-primary font-bold text-primary-foreground shadow-pop active:scale-95 disabled:opacity-60"
            >
              {busy ? "יוצר…" : "➕ צור קוד"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">קודים קיימים</p>
          <div className="mt-3 grid gap-2">
            {codes.length === 0 && (
              <p className="text-sm text-muted-foreground">עדיין אין קודים.</p>
            )}
            {codes.map((c) => (
              <div key={c.code} className="flex items-center gap-2 rounded-xl bg-muted p-3">
                <div className="flex-1">
                  <p dir="ltr" className="text-left font-bold text-ink">
                    {c.code}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {REWARD_LABELS[c.reward_type as RewardType]} × {c.amount} · נוצל {c.uses}/
                    {c.max_uses}
                  </p>
                </div>
                <button
                  onClick={() => void navigator.clipboard?.writeText(c.code)}
                  className="rounded-lg bg-card px-3 py-2 text-sm font-bold text-ink active:scale-95"
                >
                  העתק
                </button>
                <button
                  onClick={() => void drop(c.code)}
                  className="rounded-lg bg-destructive px-3 py-2 text-sm font-bold text-destructive-foreground active:scale-95"
                >
                  מחק
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">שחקנים ({users.length})</p>
          <div className="mt-3 grid gap-2">
            {users.map((u) => (
              <div key={u.userId} className="rounded-xl bg-muted p-3">
                <p className="font-bold text-ink">
                  {u.icon} {u.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  🏆 {u.trophies} · 🪙 {u.coins} · 💡 {u.hints} · 🎁 {u.chests}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Screen>
  );
}
