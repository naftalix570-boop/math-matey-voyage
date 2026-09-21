import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Screen } from "@/components/app-shell";
import { SITE_URL } from "@/lib/native";
import {
  createPromoCode,
  deletePromoCode,
  getAdminUser,
  grantToUser,
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
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [rewardType, setRewardType] = useState<RewardType>("coins");
  const [amount, setAmount] = useState(10);
  const [maxUses, setMaxUses] = useState(10);
  const [custom, setCustom] = useState("");
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getAdminUser>> | null>(null);
  const [grantType, setGrantType] = useState<RewardType>("coins");
  const [grantAmount, setGrantAmount] = useState(10);
  const [grantMsg, setGrantMsg] = useState<string | null>(null);

  const fetchUsers = useServerFn(listAdminUsers);
  const fetchCodes = useServerFn(listPromoCodes);
  const addCode = useServerFn(createPromoCode);
  const removeCode = useServerFn(deletePromoCode);
  const fetchUser = useServerFn(getAdminUser);
  const grant = useServerFn(grantToUser);

  const openUser = async (u: UserRow) => {
    if (!code) return;
    setSelected(u);
    setDetail(null);
    setGrantMsg(null);
    try {
      setDetail(await fetchUser({ data: { code, userId: u.userId } }));
    } catch (e) {
      setGrantMsg(e instanceof Error ? e.message : "שגיאה");
    }
  };

  const applyGrant = async (type: RewardType, value: number) => {
    if (!code || !selected || !Number.isFinite(value) || value === 0) return;
    setGrantMsg(null);
    setBusy(true);
    try {
      await grant({
        data: { code, userId: selected.userId, rewardType: type, amount: value },
      });
      const fresh = await fetchUser({ data: { code, userId: selected.userId } });
      setDetail(fresh);
      const list = await fetchUsers({ data: { code } });
      setUsers(list);
      const updated = list.find((r) => r.userId === selected.userId);
      if (updated) setSelected(updated);
      setGrantMsg(`✅ ${value > 0 ? "נוספו" : "הופחתו"} ${Math.abs(value)} · ${REWARD_LABELS[type]}`);
    } catch (e) {
      setGrantMsg(e instanceof Error ? e.message : "שגיאה");
    }
    setBusy(false);
  };

  const submitGrant = () => applyGrant(grantType, grantAmount);

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
                  onClick={() => void shareCode(c.code)}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground active:scale-95"
                >
                  שלח
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
              <button
                key={u.userId}
                onClick={() => void openUser(u)}
                className="rounded-xl bg-muted p-3 text-right active:scale-95">
                <p className="font-bold text-ink">
                  {u.icon} {u.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  🏆 {u.trophies} · 🪙 {u.coins} · 💡 {u.hints} · 🎁 {u.chests}
                </p>
              </button>
            ))}
          </div>
        </section>
      </div>

        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-3"
            dir="rtl"
          >
            <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-ink">
                  {selected.icon} {selected.name}
                </p>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg bg-muted px-3 py-2 font-bold text-ink"
                >
                  סגור
                </button>
              </div>

              {!detail ? (
                <p className="mt-3 text-muted-foreground">טוען…</p>
              ) : (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <Info label="גביעים" value={String(selected.trophies)} />
                    <Info label="מטבעות" value={String(selected.coins)} />
                    <Info label="רמזים" value={String(selected.hints)} />
                    <Info label="תיבות" value={String(selected.chests)} />
                    <Info label="מדינה" value={detail.country} />
                    <Info
                      label="שלב"
                      value={String((detail.data as Record<string, unknown>)?.["level"] ?? 1)}
                    />
                    <Info
                      label="מדבקות"
                      value={String(
                        (((detail.data as Record<string, unknown>)?.["stickers"] as number[]) ?? [])
                          .length,
                      )}
                    />
                    <Info
                      label="תרגילים נכונים"
                      value={String(
                        (detail.data as Record<string, unknown>)?.["totalCorrect"] ?? 0,
                      )}
                    />
                    <Info
                      label="התחיל לשחק"
                      value={String(
                        (detail.data as Record<string, unknown>)?.["firstDay"] ??
                          (detail.data as Record<string, unknown>)?.["lastDay"] ??
                          "—",
                      )}
                    />
                    <Info
                      label="פעילות אחרונה"
                      value={new Date(detail.updated_at).toLocaleDateString("he-IL")}
                    />
                  </div>

                  <p className="mt-4 font-bold text-ink">כפתורים מהירים</p>
                  <div className="mt-2 grid gap-2">
                    {(Object.keys(REWARD_LABELS) as RewardType[]).map((r) => (
                      <div key={r} className="flex items-center gap-2 rounded-xl bg-muted p-2">
                        <span className="min-w-0 flex-1 truncate font-bold text-ink">
                          {REWARD_LABELS[r]}
                        </span>
                        {[-10, -1, 1, 10].map((step) => (
                          <button
                            key={step}
                            disabled={busy}
                            onClick={() => void applyGrant(r, step)}
                            className={`h-11 min-w-11 rounded-lg px-2 text-sm font-bold active:scale-95 disabled:opacity-50 ${
                              step > 0
                                ? "bg-primary text-primary-foreground"
                                : "bg-destructive text-destructive-foreground"
                            }`}
                          >
                            {step > 0 ? `+${step}` : step}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 font-bold text-ink">כמות מותאמת (מינוס = הפחתה)</p>
                  <div className="mt-2 grid gap-2">
                    <select
                      value={grantType}
                      onChange={(e) => setGrantType(e.target.value as RewardType)}
                      className="h-12 rounded-xl border-2 border-muted bg-background px-3 text-ink"
                      aria-label="סוג"
                    >
                      {(Object.keys(REWARD_LABELS) as RewardType[]).map((r) => (
                        <option key={r} value={r}>
                          {REWARD_LABELS[r]}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={grantAmount}
                      onChange={(e) => setGrantAmount(Number(e.target.value))}
                      className="h-12 rounded-xl border-2 border-muted bg-background px-3 text-ink"
                      aria-label="כמות"
                    />
                    <button
                      onClick={() => void submitGrant()}
                      className="h-12 rounded-xl bg-primary font-bold text-primary-foreground active:scale-95"
                    >
                      עדכן שחקן
                    </button>
                    {grantMsg && <p className="font-bold text-ink">{grantMsg}</p>}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
    </Screen>
  );
}

async function shareCode(promo: string) {
  const link = `${SITE_URL}/?promo=${encodeURIComponent(promo)}`;
  const text = `🎁 קיבלת מתנה במסע המתמטיקס! לחצו על הקישור וקבלו אותה מיד:\n${link}`;
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
  if (nav.share) {
    try {
      await nav.share({ title: "מתנה במסע המתמטיקס", text, url: link });
      return;
    } catch {
      /* המשתמש ביטל — נמשיך לאפשרויות הידניות */
    }
  }
  const choice = window.prompt(
    "בחרו שליחה: הקלידו 1 לוואטסאפ, 2 לאימייל, 3 להעתקת הקישור",
    "1",
  );
  if (choice === "1") window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  else if (choice === "2")
    window.open(
      `mailto:?subject=${encodeURIComponent("מתנה במסע המתמטיקס")}&body=${encodeURIComponent(text)}`,
    );
  else if (choice === "3") await navigator.clipboard?.writeText(link);
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-bold text-ink">{value}</p>
    </div>
  );
}
