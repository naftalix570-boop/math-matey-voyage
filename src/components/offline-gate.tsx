import type { ReactNode } from "react";
import { useGame } from "@/lib/game-state";
import { useOnline } from "@/lib/use-online";

/**
 * משתמש פרימיום יכול לשחק גם בלי אינטרנט / בלי סים.
 * משתמש רגיל חייב קליטה כדי לשחק.
 */
export function OfflineGate({ children }: { children: ReactNode }) {
  const online = useOnline();
  const { premium } = useGame();

  if (online || premium) return <>{children}</>;

  return (
    <div className="mt-10 rounded-2xl bg-card p-6 text-center shadow-card">
      <div className="text-5xl">📴</div>
      <h2 className="mt-3 text-xl font-bold text-ink">אין חיבור לאינטרנט</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        כדי לשחק צריך קליטה. עם <span className="font-bold text-ink">פרימיום 👑</span> אפשר לשחק גם
        לגמרי אופליין — בלי רשת ובלי סים.
      </p>
      <a
        href="/shop"
        className="mt-4 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 font-bold text-primary-foreground active:scale-95"
      >
        לפרטים על פרימיום
      </a>
    </div>
  );
}

/** באנר קטן שמראה שמשחקים במצב אופליין (פרימיום). */
export function OfflineBadge() {
  const online = useOnline();
  const { premium } = useGame();
  if (online || !premium) return null;
  return (
    <div className="mb-2 rounded-xl bg-sky px-3 py-2 text-center text-sm font-bold text-ink">
      👑 מצב אופליין — הפרימיום שלך מאפשר לשחק בלי אינטרנט
    </div>
  );
}
