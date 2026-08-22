import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/app-shell";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "התקדמות — מסע המתמטיקס" },
      { name: "description", content: "מעקב אחרי רמות, הישגים ורצף ימי תרגול." },
      { property: "og:title", content: "התקדמות — מסע המתמטיקס" },
      { property: "og:description", content: "רמות, הישגים ורצף תרגול." },
    ],
  }),
  component: () => (
    <Screen title="התקדמות">
      <p className="pb-28 text-center text-muted-foreground">בקרוב 📊</p>
    </Screen>
  ),
});
