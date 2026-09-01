import { useEffect, useState } from "react";

/** ספירה לאחור עד חצות המקומי, בפורמט HH:MM:SS. */
export function useMidnightCountdown() {
  const [text, setText] = useState("");

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 0);
      const ms = Math.max(0, next.getTime() - now.getTime());
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setText(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, []);

  return text;
}
