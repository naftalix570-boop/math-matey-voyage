import type { ReactNode } from "react";

/** מצב טעינה אחיד */
export function LoadingState({ label = "טוען…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12" role="status" aria-live="polite">
      <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      <p className="font-bold text-muted-foreground">{label}</p>
    </div>
  );
}

/** מצב שגיאה עם כפתור ניסיון חוזר */
export function ErrorState({
  title = "לא הצלחנו לטעון",
  hint = "בדקו את החיבור לאינטרנט ונסו שוב.",
  onRetry,
}: {
  title?: string;
  hint?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 text-center shadow-card">
      <span className="text-4xl">📡</span>
      <p className="text-lg font-bold text-ink">{title}</p>
      <p className="text-sm text-muted-foreground">{hint}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 h-12 w-full max-w-xs rounded-xl bg-primary font-bold text-primary-foreground active:scale-95"
        >
          נסה שוב
        </button>
      )}
    </div>
  );
}

/** מצב "אין נתונים" */
export function EmptyState({
  emoji = "✨",
  title,
  hint,
  children,
}: {
  emoji?: string;
  title: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-6 text-center shadow-card">
      <span className="text-4xl">{emoji}</span>
      <p className="text-lg font-bold text-ink">{title}</p>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}
