import { useEffect, useState } from "react";
import { useGame } from "@/lib/game-state";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

/**
 * מסך פתיחה — מוצג עד שההתקדמות נטענה מהמכשיר, ואז נעלם בהדרגה.
 */
export function Splash() {
  const { ready } = useGame();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setHidden(true), 450);
    return () => clearTimeout(t);
  }, [ready]);

  if (hidden) return null;

  return (
    <div
      aria-hidden={ready}
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-background transition-opacity duration-300",
        ready ? "pointer-events-none opacity-0" : "opacity-100",
      )}
    >
      <img
        src={logo}
        alt="מסע המתמטיקס"
        width={128}
        height={128}
        className="size-32 animate-pop rounded-3xl object-contain shadow-pop"
      />
      <p className="text-xl font-bold text-ink">מסע המתמטיקס</p>
      <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  );
}
