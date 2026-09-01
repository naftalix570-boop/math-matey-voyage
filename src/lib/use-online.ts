import { useEffect, useState } from "react";

/** האם יש חיבור לרשת (אחרי הידרציה בלבד). */
export function useOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    const t = setInterval(sync, 5000);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      clearInterval(t);
    };
  }, []);

  return online;
}

/** רישום ה-service worker כדי שהמשחק יעבוד גם ללא רשת. */
export function registerOfflineWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}
