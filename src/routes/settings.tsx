import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Screen } from "@/components/app-shell";
import { ICONS, useGame } from "@/lib/game-state";
import { MAX_LEVEL } from "@/lib/math";
import { cn, fmtNum } from "@/lib/utils";
import { useI18n, LANGS } from "@/lib/i18n";
import { verifyAdminCode } from "@/lib/admin.functions";
import { APP_VERSION } from "@/lib/app-version";
import { downloadBackup, parseBackup } from "@/lib/profile-storage";


export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "הגדרות — מסע המתמטיקס" },
      { name: "description", content: "שם השחקן, צלילים ורמת קושי." },
      { property: "og:title", content: "הגדרות — מסע המתמטיקס" },
      { property: "og:description", content: "שם השחקן, צלילים ורמת קושי." },
    ],
  }),
  component: SettingsPage,
});

const COUNTRIES = [
  { code: "IL", name: "ישראל 🇮🇱" },
  { code: "US", name: "ארצות הברית 🇺🇸" },
  { code: "GB", name: "בריטניה 🇬🇧" },
  { code: "DE", name: "גרמניה 🇩🇪" },
  { code: "FR", name: "צרפת 🇫🇷" },
  { code: "ES", name: "ספרד 🇪🇸" },
  { code: "BR", name: "ברזיל 🇧🇷" },
  { code: "AE", name: "איחוד האמירויות 🇦🇪" },
  { code: "CA", name: "קנדה 🇨🇦" },
  { code: "AU", name: "אוסטרליה 🇦🇺" },
];

function SettingsPage() {
  const { profile, update, sound, reset, linked, authEmail, cloudSyncing, importProfile } =
    useGame();
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const current = LANGS.find((l) => l.code === lang);

  const [adminInput, setAdminInput] = useState("");
  const [adminMsg, setAdminMsg] = useState<string | null>(null);
  const checkAdmin = useServerFn(verifyAdminCode);

  const submitAdmin = async () => {
    sound("click");
    setAdminMsg(null);
    try {
      const res = await checkAdmin({ data: { code: adminInput } });
      if (!res.ok) {
        setAdminMsg("קוד שגוי");
        sound("wrong");
        return;
      }
      sessionStorage.setItem("math-journey:admin", adminInput.trim());
      void navigate({ to: "/admin" });
    } catch {
      setAdminMsg("קוד שגוי");
    }
  };

  return (
    <Screen title={t("title.settings")}>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)] gap-3 pb-28">

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">{t("settings.language")}</p>
          <button
            onClick={() => {
              sound("click");
              setLangOpen(true);
            }}
            className="mt-3 flex h-12 w-full items-center justify-between rounded-xl bg-muted px-4 font-bold text-ink active:scale-95"
          >
            <span>
              {current?.flag} {current?.label}
            </span>
            <span className="text-muted-foreground">▾</span>
          </button>
        </section>

        {langOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4"
            onClick={() => setLangOpen(false)}
          >
            <div
              className="animate-pop mb-20 w-full max-w-sm rounded-3xl bg-card p-4 shadow-pop"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-center text-lg font-bold text-ink">{t("settings.language")}</p>
              <div className="mt-3 grid gap-2">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      sound("click");
                      setLang(l.code);
                      setLangOpen(false);
                    }}
                    className={cn(
                      "flex h-12 items-center gap-3 rounded-xl px-4 text-base font-bold transition-all",
                      lang === l.code ? "bg-primary/15 text-ink ring-2 ring-primary" : "bg-muted text-ink",
                    )}
                  >
                    <span className="text-xl">{l.flag}</span>
                    {l.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setLangOpen(false)}
                className="mt-3 h-11 w-full rounded-xl bg-muted font-bold text-ink active:scale-95"
              >
                {t("settings.cancel")}
              </button>
            </div>
          </div>
        )}

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">{t("settings.account")}</p>
          {linked ? (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                מחובר כ-<span dir="ltr" className="font-bold text-ink">{authEmail}</span> — ההתקדמות
                נשמרת בענן ומסתנכרנת בין מכשירים.
              </p>
              <p className="mt-2 text-sm font-bold text-success" aria-live="polite">
                {cloudSyncing ? "☁️ שומר עכשיו…" : "✅ ההתקדמות שמורה בחשבון"}
              </p>
              <div className="mt-3 grid gap-2">
                <Link
                  to="/auth"
                  search={{ mode: "signin" }}
                  className="flex h-11 items-center justify-center rounded-xl bg-muted font-bold text-ink active:scale-95"
                >
                  🔄 החלפת חשבון
                </Link>
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="flex h-11 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground shadow-pop active:scale-95"
                >
                  ➕ פתיחת חשבון חדש
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                {profile.guest ? "חשבון אורח — ההתקדמות נשמרת רק במכשיר הזה." : "לא מחובר."} קשרו
                חשבון כדי לא לאבד התקדמות בהחלפת מכשיר.
              </p>
              <div className="mt-3 grid gap-2">
                <Link
                  to="/auth"
                  search={{ mode: "signin" }}
                  className="flex h-11 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground shadow-pop active:scale-95"
                >
                  {t("settings.link")}
                </Link>
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="flex h-11 items-center justify-center rounded-xl bg-muted font-bold text-ink active:scale-95"
                >
                  ➕ פתיחת חשבון חדש
                </Link>
              </div>
            </>
          )}
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <label htmlFor="country" className="text-lg font-bold text-ink">
            {t("settings.country")}
          </label>
          <select
            id="country"
            value={profile.country}
            onChange={(e) => update({ country: e.target.value })}
            className="mt-2 w-full rounded-xl border-2 border-muted bg-background p-3 text-lg text-ink outline-none focus:border-primary"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <label htmlFor="name" className="text-lg font-bold text-ink">
            {t("settings.playerName")}
          </label>
          <input
            id="name"
            value={profile.name}
            onChange={(e) => update({ name: e.target.value })}
            maxLength={20}
            className="mt-2 w-full rounded-xl border-2 border-muted bg-background p-3 text-lg text-ink outline-none focus:border-primary"
          />
        </section>

        <section className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-card">
          <div>
            <p className="text-lg font-bold text-ink">{t("settings.sounds")}</p>
            <p className="text-sm text-muted-foreground">{t("settings.soundsSub")}</p>
          </div>
          <button
            role="switch"
            aria-checked={profile.soundOn}
            aria-label="הפעלת צלילים"
            onClick={() => {
              update((p) => ({ soundOn: !p.soundOn }));
              sound("click");
            }}
            className={cn(
              "h-9 w-16 rounded-full p-1 transition-colors",
              profile.soundOn ? "bg-success" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "block size-7 rounded-full bg-card shadow-card transition-transform",
                profile.soundOn ? "translate-x-0" : "-translate-x-7",
              )}
            />
          </button>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">{t("settings.icon")}</p>
          <p className="text-sm text-muted-foreground">{t("settings.iconSub")}</p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {ICONS.map((ic) => {
              const owned = profile.icons.includes(ic.emoji);
              const active = profile.icon === ic.emoji;
              return (
                <button
                  key={ic.id}
                  disabled={!owned}
                  aria-label={`אייקון ${ic.emoji}`}
                  onClick={() => {
                    sound("click");
                    update({ icon: ic.emoji });
                  }}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-xl text-2xl transition-all",
                    active ? "bg-primary/15 ring-2 ring-primary" : "bg-muted",
                    !owned && "opacity-40 grayscale",
                  )}
                >
                  {owned ? ic.emoji : "🔒"}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">{t("settings.myRank")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            🏆 {fmtNum(profile.trophies)} גביעים
            {profile.guest && " · חשבון אורח"}
          </p>
          <Link
            to="/leaderboard"
            className="mt-3 flex h-11 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground active:scale-95"
          >
            {t("settings.viewRank")}
          </Link>
        </section>


        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">{t("settings.difficulty")}</p>
          <p className="text-sm text-muted-foreground">
            השלב מתעדכן אוטומטית לפי ההצלחות שלך (מתוך {MAX_LEVEL.toLocaleString("he-IL")}), אבל אפשר לשנות ידנית.
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              onClick={() => update((p) => ({ level: Math.max(1, p.level - 1) }))}
              className="size-12 rounded-xl bg-muted text-2xl font-bold text-ink active:scale-95"
              aria-label="הורדת שלב"
            >
              −
            </button>
            <span className="text-3xl font-bold text-ink">{profile.level.toLocaleString("he-IL")}</span>
            <button
              onClick={() => update((p) => ({ level: Math.min(MAX_LEVEL, p.level + 1) }))}
              className="size-12 rounded-xl bg-muted text-2xl font-bold text-ink active:scale-95"
              aria-label="העלאת שלב"
            >
              +
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">{t("settings.reset")}</p>
          <p className="text-sm text-muted-foreground">{t("settings.resetSub")}</p>
          {confirming ? (
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => {
                  reset();
                  setConfirming(false);
                }}
                className="flex-1 rounded-xl bg-destructive px-4 py-3 font-bold text-destructive-foreground active:scale-95"
              >
                {t("settings.resetYes")}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-xl bg-muted px-4 py-3 font-bold text-ink active:scale-95"
              >
                {t("settings.cancel")}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="mt-3 w-full rounded-xl bg-muted px-4 py-3 font-bold text-ink active:scale-95"
            >
              {t("settings.resetBtn")}
            </button>
          )}
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">💾 גיבוי ושחזור</p>
          <p className="text-sm text-muted-foreground">
            אפשר לשמור קובץ גיבוי של ההתקדמות ולשחזר אותו בכל מכשיר. שחזור רק מוסיף — שום דבר לא נמחק.
          </p>
          <div className="mt-3 grid gap-2">
            <button
              onClick={() => {
                sound("click");
                downloadBackup(profile);
                setBackupMsg("✅ קובץ הגיבוי ירד למכשיר");
              }}
              className="h-11 rounded-xl bg-primary font-bold text-primary-foreground active:scale-95"
            >
              ⬇️ הורדת קובץ גיבוי
            </button>
            <label className="flex h-11 cursor-pointer items-center justify-center rounded-xl bg-muted font-bold text-ink active:scale-95">
              ⬆️ שחזור מקובץ
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  const data = parseBackup(await file.text());
                  if (!data) {
                    setBackupMsg("❌ הקובץ לא תקין");
                    sound("wrong");
                    return;
                  }
                  importProfile(data);
                  setBackupMsg("✅ ההתקדמות שוחזרה");
                }}
              />
            </label>
          </div>
          {backupMsg && <p className="mt-2 font-bold text-ink">{backupMsg}</p>}
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-lg font-bold text-ink">ℹ️ עוד</p>
          <div className="mt-3 grid gap-2">
            <Link
              to="/profile"
              className="flex h-11 items-center justify-center rounded-xl bg-muted font-bold text-ink active:scale-95"
            >
              👤 הפרופיל שלי
            </Link>
            <Link
              to="/privacy"
              className="flex h-11 items-center justify-center rounded-xl bg-muted font-bold text-ink active:scale-95"
            >
              🔒 מדיניות פרטיות
            </Link>
            <Link
              to="/terms"
              className="flex h-11 items-center justify-center rounded-xl bg-muted font-bold text-ink active:scale-95"
            >
              📄 תנאי שימוש
            </Link>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">גרסה {APP_VERSION}</p>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <label htmlFor="admincode" className="text-lg font-bold text-ink">
            🔐 קוד מנהל
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="admincode"
              dir="ltr"
              type="password"
              value={adminInput}
              onChange={(e) => setAdminInput(e.target.value)}
              maxLength={40}
              className="h-12 flex-1 rounded-xl border-2 border-muted bg-background px-3 text-lg text-ink outline-none focus:border-primary"
            />
            <button
              onClick={() => void submitAdmin()}
              className="h-12 rounded-xl bg-muted px-4 font-bold text-ink active:scale-95"
            >
              אימות
            </button>
          </div>
          {adminMsg && <p className="mt-2 font-bold text-destructive">{adminMsg}</p>}
        </section>
      </div>
    </Screen>
  );
}
