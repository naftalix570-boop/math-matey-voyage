import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Screen } from "@/components/app-shell";
import { CURRENT_VERSION, LATEST_VERSION, RELEASE_NOTES, PLAY_URL, hasUpdate, markUpdateSeen } from "@/lib/updates";

export const Route = createFileRoute("/updates")({
  head: () => ({
    meta: [
      { title: "עדכונים — מסע המתמטיקה" },
      { name: "description", content: "בדיקת גרסה ועדכונים לאפליקציית מסע המתמטיקה." },
      { property: "og:title", content: "עדכונים — מסע המתמטיקה" },
      { property: "og:description", content: "בדיקת גרסה ועדכונים לאפליקציית מסע המתמטיקה." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UpdatesPage,
});

function UpdatesPage() {
  const update = hasUpdate();
  useEffect(() => markUpdateSeen(), []);
  return (
    <Screen title="🔄 עדכונים">
      <section className="mt-3 rounded-2xl bg-card p-4 text-center shadow-card">
        <p className="text-sm text-muted-foreground">גרסה נוכחית</p>
        <p className="text-2xl font-bold text-ink" dir="ltr">v{CURRENT_VERSION}</p>
      </section>
      {update ? (
        <section className="mt-3 rounded-2xl bg-card p-4 shadow-card">
          <p className="text-xl font-bold text-ink">🆕 עדכון חדש זמין!</p>
          <p className="mt-1 text-muted-foreground">
            גרסה חדשה: <span dir="ltr">v{LATEST_VERSION}</span>
          </p>
          <p className="mt-3 font-bold text-ink">מה חדש:</p>
          <ul className="mt-1 grid gap-1">
            {RELEASE_NOTES.map((n) => (
              <li key={n}>• {n}</li>
            ))}
          </ul>
          <a
            href={PLAY_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex h-12 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground active:scale-95"
          >
            🔄 עדכון עכשיו
          </a>
        </section>
      ) : (
        <section className="mt-3 rounded-2xl bg-card p-4 text-center shadow-card">
          <p className="text-xl font-bold text-ink">✅ אין עדכונים חדשים</p>
          <p className="mt-1 text-muted-foreground">אתם משתמשים בגרסה העדכנית ביותר.</p>
        </section>
      )}
      <div className="pb-28" />
    </Screen>
  );
}
