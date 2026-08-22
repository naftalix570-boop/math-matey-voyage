import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/app-shell";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "חנות — מסע המתמטיקס" },
      { name: "description", content: "חבילות רמזים, מדבקות ובוסטים במטבעות שצברת." },
      { property: "og:title", content: "חנות — מסע המתמטיקס" },
      { property: "og:description", content: "חבילות רמזים, מדבקות ובוסטים." },
    ],
  }),
  component: () => (
    <Screen title="חנות">
      <p className="pb-28 text-center text-muted-foreground">בקרוב 🛒</p>
    </Screen>
  ),
});
