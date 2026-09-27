import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isNativeApp, NATIVE_APP_SCHEME, SITE_URL } from "@/lib/native";
import { Screen } from "@/components/app-shell";
import { Logo } from "@/components/effects";
import { useGame } from "@/lib/game-state";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode:
      search["mode"] === "signin" || search["mode"] === "signup"
        ? (search["mode"] as "signin" | "signup")
        : undefined,
    onboarding:
      search["onboarding"] === true || search["onboarding"] === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "התחברות — מסע המתמטיקס" },
      { name: "description", content: "התחברו עם גוגל או אימייל כדי לשמור את ההתקדמות בענן." },
      { property: "og:title", content: "התחברות — מסע המתמטיקס" },
      { property: "og:description", content: "שמירת התקדמות בענן ומעבר בין מכשירים." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { profile, update, sound, linked, authEmail, syncNow, cloudSyncing } = useGame();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onboarding = search.onboarding || (!profile.onboarded && profile.onboardingStep === "auth");

  const continueToTest = () => {
    update({ onboardingStep: "test" });
    void navigate({ to: "/" });
  };

  // שמירה מיידית של ההתקדמות לענן לפני יציאה/החלפת חשבון
  const saveToCloud = syncNow;

  const endSession = async () => {
    sound("click");
    setBusy(true);
    setError(null);
    setMessage(null);
    const ok = await saveToCloud();
    if (!ok) {
      setError("לא הצלחנו לשמור את ההתקדמות — לא התנתקנו כדי שלא תאבדו דבר");
      setBusy(false);
      return false;
    }
    await supabase.auth.signOut();
    setBusy(false);
    return true;
  };

  const switchAccount = async () => {
    const ok = await endSession();
    if (!ok) return;
    setMode("signin");
    setEmail("");
    setPassword("");
    if (ok) setMessage("ההתקדמות נשמרה ✅ אפשר להתחבר עם חשבון אחר — הנתונים יחכו לכם בחשבון הקודם");
  };

  const createNewAccount = async () => {
    const ok = await endSession();
    if (!ok) return;
    setMode("signup");
    setEmail("");
    setPassword("");
    if (ok) setMessage("ההתקדמות נשמרה ✅ עכשיו אפשר לפתוח חשבון חדש");
  };

  // באפליקציה: התחברות גוגל נפתחת בדפדפן המערכת (גוגל חוסם WebView),
  // ובסיום חוזרת לאפליקציה עם deep link שמעביר את הסשן.
  const signInGoogleNative = async () => {
    sound("click");
    setError(null);
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: `${SITE_URL}/auth?native=1` });
  };

  const signInGoogle = async () => {
    if (isNativeApp()) {
      void signInGoogleNative();
      return;
    }
    sound("click");
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError("ההתחברות עם גוגל נכשלה — נסו שוב");
    // אם redirected — הדפדפן כבר בדרך לגוגל
  };

  // דף זה נפתח בדפדפן החיצוני עם ?native=1 — ברגע שיש סשן מחזירים אותו לאפליקציה.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isNativeApp()) return;
    if (new URLSearchParams(window.location.search).get("native") !== "1") return;
    let done = false;
    const handoff = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session || done) return;
      done = true;
      window.location.href =
        `${NATIVE_APP_SCHEME}://auth#access_token=${encodeURIComponent(session.access_token)}` +
        `&refresh_token=${encodeURIComponent(session.refresh_token)}`;
    };
    void handoff();
    const { data: sub } = supabase.auth.onAuthStateChange(() => void handoff());
    return () => sub.subscription.unsubscribe();
  }, []);


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
            {onboarding && (
              <button
                onClick={continueToTest}
                className="mt-3 h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground shadow-pop active:scale-95"
              >
                המשך למבחן המיקום
              </button>
            )}
            <button
              disabled={busy}
              onClick={() => void switchAccount()}
              className={`${onboarding ? "mt-2 bg-muted text-ink" : "mt-3 bg-primary text-primary-foreground shadow-pop"} h-12 w-full rounded-xl font-bold active:scale-95 disabled:opacity-50`}
            >
              {busy || cloudSyncing ? "שומרים בענן…" : "🔄 החלפת חשבון"}
            </button>
            <button
              disabled={busy}
              onClick={() => void createNewAccount()}
              className="mt-2 w-full rounded-xl bg-muted px-4 py-3 font-bold text-ink active:scale-95 disabled:opacity-50"
            >
              ➕ פתיחת חשבון חדש
            </button>
            <button
              disabled={busy}
              onClick={() => void endSession()}
              className="mt-2 w-full rounded-xl border-2 border-muted px-4 py-3 font-bold text-muted-foreground active:scale-95 disabled:opacity-50"
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
            <button
              onClick={async () => {
                sound("click");
                setError(null);
                const r = await lovable.auth.signInWithOAuth("apple", {
                  redirect_uri: window.location.origin,
                });
                if (r.error) setError("ההתחברות עם Apple נכשלה — נסו שוב");
              }}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-lg font-bold text-background shadow-card active:scale-95"
            >
              <span className="text-2xl"></span> המשך עם Apple
            </button>

            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-px flex-1 bg-muted" />
              <span className="text-sm">או עם אימייל</span>
              <div className="h-px flex-1 bg-muted" />
            </div>

            <section className="rounded-2xl bg-card p-4 shadow-card">
              <div className="mb-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode("signup")}
                  className={`rounded-xl px-3 py-2 font-bold ${
                    mode === "signup" ? "bg-primary text-primary-foreground" : "bg-muted text-ink"
                  }`}
                >
                  חשבון חדש
                </button>
                <button
                  onClick={() => setMode("signin")}
                  className={`rounded-xl px-3 py-2 font-bold ${
                    mode === "signin" ? "bg-primary text-primary-foreground" : "bg-muted text-ink"
                  }`}
                >
                  יש לי חשבון
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
                {busy ? "רגע…" : mode === "signup" ? "יצירת חשבון חדש" : "התחברות"}
              </button>
            </section>

            <button
              onClick={() => {
                sound("click");
                update({ guest: true, onboardingStep: "test" });
                void navigate({ to: "/" });
              }}
              className="h-11 text-center text-sm text-muted-foreground underline"
            >
              המשך עם קוד אישי בלי התחברות
            </button>
          </>
        )}
      </div>
    </Screen>
  );
}
