import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/app-shell";
import { Logo } from "@/components/effects";
import { useGame } from "@/lib/game-state";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "התחברות — מסע המתמטיקס" },
      { name: "description", content: "התחברו עם גוגל או אימייל כדי לשמור את ההתקדמות בענן." },
      { property: "og:title", content: "התחברות — מסע המתמטיקס" },
      { property: "og:description", content: "שמירת התקדמות בענן ומעבר בין מכשירים." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { sound, linked, authEmail, update } = useGame();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signInGoogle = async () => {
    sound("click");
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError("ההתחברות עם גוגל נכשלה — נסו שוב");
    // אם redirected — הדפדפן כבר בדרך לגוגל
  };

  const submitEmail = async () => {
    if (!email.trim() || password.length < 6) {
      setError("אימייל תקין וסיסמה של 6 תווים לפחות");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        if (data.session) {
          sound("levelup");
          void navigate({ to: "/" });
        } else {
          setMessage("נשלח מייל אישור — לחצו על הקישור במייל ואז התחברו ✉️");
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        sound("levelup");
        void navigate({ to: "/" });
      }
    } catch {
      setError(
        mode === "signup"
          ? "לא הצלחנו ליצור חשבון — ייתכן שהאימייל כבר רשום"
          : "אימייל או סיסמה שגויים",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={linked ? "החשבון שלי" : "התחברות ושמירת התקדמות"}>
      <div className="mt-2 grid gap-3 pb-28">
        <div className="flex flex-col items-center gap-2 pt-2 text-center">
          <Logo size={80} />
          <p className="text-sm text-muted-foreground">
            חשבון מחובר שומר את המטבעות, המדבקות והשלבים בענן — ומאפשר לשחק מכל מכשיר ☁️
          </p>
        </div>

        {linked ? (
          <section className="rounded-2xl bg-card p-4 text-center shadow-card">
            <p className="text-lg font-bold text-ink">✅ החשבון מחובר</p>
            <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
              {authEmail}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              ההתקדמות נשמרת אוטומטית בענן בכל שינוי — אפשר להחליף חשבון בלי לאבד כלום.
            </p>
            <button
              disabled={busy}
              onClick={() => void switchAccount()}
              className="mt-3 h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground shadow-pop active:scale-95 disabled:opacity-50"
            >
              {busy ? "שומרים בענן…" : "🔄 החלפת חשבון"}
            </button>
            <button
              disabled={busy}
              onClick={() => void endSession()}
              className="mt-2 w-full rounded-xl bg-muted px-4 py-3 font-bold text-ink active:scale-95 disabled:opacity-50"
            >
              התנתקות
            </button>
            {message && <p className="mt-2 text-sm font-bold text-success">{message}</p>}
            {error && <p className="mt-2 text-sm font-bold text-destructive">{error}</p>}
          </section>

        ) : (
          <>
            <button
              onClick={() => void signInGoogle()}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-card text-lg font-bold text-ink shadow-card active:scale-95"
            >
              <span className="text-2xl">🌐</span> המשך עם Google
            </button>

            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-px flex-1 bg-muted" />
              <span className="text-sm">או עם אימייל</span>
              <div className="h-px flex-1 bg-muted" />
            </div>

            <section className="rounded-2xl bg-card p-4 shadow-card">
              <div className="mb-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode("signin")}
                  className={`rounded-xl px-3 py-2 font-bold ${
                    mode === "signin" ? "bg-primary text-primary-foreground" : "bg-muted text-ink"
                  }`}
                >
                  התחברות
                </button>
                <button
                  onClick={() => setMode("signup")}
                  className={`rounded-xl px-3 py-2 font-bold ${
                    mode === "signup" ? "bg-primary text-primary-foreground" : "bg-muted text-ink"
                  }`}
                >
                  הרשמה
                </button>
              </div>
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full rounded-xl border-2 border-muted bg-background p-3 text-ink outline-none focus:border-primary"
              />
              <input
                type="password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="סיסמה (6 תווים לפחות)"
                className="mt-2 w-full rounded-xl border-2 border-muted bg-background p-3 text-ink outline-none focus:border-primary"
              />
              {error && <p className="mt-2 text-sm font-bold text-destructive">{error}</p>}
              {message && <p className="mt-2 text-sm font-bold text-success">{message}</p>}
              <button
                disabled={busy}
                onClick={() => void submitEmail()}
                className="mt-3 h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground shadow-pop active:scale-95 disabled:opacity-50"
              >
                {busy ? "רגע…" : mode === "signup" ? "יצירת חשבון" : "התחברות"}
              </button>
            </section>

            <Link
              to="/"
              className="text-center text-sm text-muted-foreground underline"
            >
              המשך כאורח/ת — ההתקדמות תישמר רק במכשיר הזה
            </Link>
          </>
        )}
      </div>
    </Screen>
  );
}
