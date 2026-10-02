import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen } from "@/components/app-shell";
import { CURRENT_VERSION, CONTACT_EMAIL } from "@/lib/updates";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "אודות — מסע המתמטיקה" },
      { name: "description", content: "מידע על אפליקציית מסע המתמטיקה, גרסה ויצירת קשר." },
      { property: "og:title", content: "אודות — מסע המתמטיקה" },
      { property: "og:description", content: "מידע על אפליקציית מסע המתמטיקה, גרסה ויצירת קשר." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
});

const btn = "flex h-11 items-center justify-center rounded-xl bg-muted font-bold text-ink active:scale-95";

function AboutPage() {
  return (
    <Screen title="ℹ️ אודות">
      <section className="mt-3 grid gap-3 rounded-2xl bg-card p-5 text-center shadow-card">
        <div>
          <p className="text-2xl font-bold text-ink">🎓 Math Journey</p>
          <p className="text-muted-foreground">מסע המתמטיקה</p>
        </div>
        <p><span className="font-bold text-ink">📱 גרסה: </span><span dir="ltr">v{CURRENT_VERSION}</span></p>
        <p><span className="font-bold text-ink">👨‍💻 פותח ונבנה על ידי: </span>נפתלי</p>
        <a href={`mailto:${CONTACT_EMAIL}`} className={btn}>📩 יצירת קשר</a>
        <Link to="/report" className={btn}>🐛 דיווח על תקלה</Link>
        <Link to="/credits" className={btn}>📚 קרדיטים ורישיונות</Link>
      </section>
      <p className="mt-4 px-2 text-center text-[11px] leading-relaxed text-muted-foreground">
        © 2026 כל הזכויות שמורות.
        <br />
        העיצוב, התוכן המקורי והקוד שפותחו עבור Math Journey הם רכושם של בעלי הזכויות, בכפוף לרישיונות של רכיבי צד שלישי.
      </p>
      <div className="pb-28" />
    </Screen>
  );
}
