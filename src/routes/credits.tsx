import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/app-shell";

export const Route = createFileRoute("/credits")({
  head: () => ({
    meta: [
      { title: "קרדיטים ורישיונות — מסע המתמטיקה" },
      { name: "description", content: "ספריות ושירותי צד שלישי שבהם משתמשת אפליקציית מסע המתמטיקה." },
      { property: "og:title", content: "קרדיטים ורישיונות — מסע המתמטיקה" },
      { property: "og:description", content: "ספריות ושירותי צד שלישי שבהם משתמשת אפליקציית מסע המתמטיקה." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreditsPage,
});

const ITEMS: { name: string; by: string; license: string }[] = [
  { name: "React", by: "Meta Platforms, Inc.", license: "MIT" },
  { name: "TanStack Router / Start / Query", by: "Tanner Linsley", license: "MIT" },
  { name: "Tailwind CSS", by: "Tailwind Labs, Inc.", license: "MIT" },
  { name: "Lucide Icons", by: "Lucide Contributors", license: "ISC" },
  { name: "Supabase JS", by: "Supabase, Inc.", license: "MIT" },
  { name: "Capacitor", by: "Ionic / Drifty Co.", license: "MIT" },
  { name: "Zod", by: "Colin McDonnell", license: "MIT" },
  { name: "Noto Sans Hebrew (Google Fonts)", by: "Google LLC", license: "SIL Open Font License 1.1" },
  { name: "Lovable Cloud", by: "Lovable", license: "שירות אחסון, התחברות ומסד נתונים" },
];

function CreditsPage() {
  return (
    <Screen title="📚 קרדיטים">
      <section className="mt-3 grid gap-2 rounded-2xl bg-card p-4 shadow-card">
        {ITEMS.map((i) => (
          <div key={i.name} className="rounded-xl bg-muted p-3">
            <p className="font-bold text-ink" dir="ltr">{i.name}</p>
            <p className="text-sm text-muted-foreground">
              <span dir="ltr">© {i.by}</span> · {i.license}
            </p>
          </div>
        ))}
        <p className="mt-1 text-xs text-muted-foreground">
          כל הזכויות ברכיבי צד שלישי שמורות לבעליהם, בהתאם לרישיון של כל רכיב.
        </p>
      </section>
      <div className="pb-28" />
    </Screen>
  );
}
