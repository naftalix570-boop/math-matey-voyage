import { defineConfig } from "vitest/config";

// Keep pure unit tests independent of the application's SSR/Worker plugins.
export default defineConfig({
  test: { include: ["src/lib/mission-progress.test.ts", "src/lib/score-reconcile.test.ts", "src/lib/account.functions.test.ts"] },
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
});