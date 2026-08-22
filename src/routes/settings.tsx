import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/app-shell";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "הגדרות — מסע המתמטיקס" },
      { name: "description", content: "שם השחקן, צלילים ורמת קושי." },
      { property: "og:title", content: "הגדרות — מסע המתמטיקס" },
      { property: "og:description", content: "שם השחקן, צלילים ורמת קושי." },
    ],
  }),
  component: () => (
    <Screen title="הגדרות">
      <p className="pb-28 text-center text-muted-foreground">בקרוב ⚙️</p>
    </Screen>
  ),
});
