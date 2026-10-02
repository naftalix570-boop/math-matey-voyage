import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { CURRENT_VERSION } from "@/lib/updates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "דיווח על תקלה — מסע המתמטיקה" },
      { name: "description", content: "מצאתם בעיה? דווחו לנו ועזרו לשפר את מסע המתמטיקה." },
      { property: "og:title", content: "דיווח על תקלה — מסע המתמטיקה" },
      { property: "og:description", content: "מצאתם בעיה? דווחו לנו ועזרו לשפר את מסע המתמטיקה." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportPage,
});

const TYPES = [
  "🔴 האפליקציה לא עובדת",
  "🧮 בעיה בתרגיל",
  "📊 בעיה בניקוד או בהתקדמות",
  "🎨 בעיית תצוגה",
  "🔊 בעיית שמע",
  "⚙️ בעיה בהגדרות",
  "💡 הצעה לשיפור",
  "❓ אחר",
];

function deviceInfo() {
  const ua = navigator.userAgent;
  const os = /Android [\d.]+/.exec(ua)?.[0] ?? /(iPhone|iPad).*?OS [\d_]+/.exec(ua)?.[0]?.replace(/_/g, ".") ?? (/Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : "אחר");
  const device = /Mobi|Android|iPhone/.test(ua) ? "טלפון" : /iPad|Tablet/.test(ua) ? "טאבלט" : "מחשב";
  return { os: os.slice(0, 60), device };
}

function ReportPage() {
  const [type, setType] = useState("");
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");

  const send = async () => {
    setState("sending");
    const { os, device } = deviceInfo();
    const { error } = await supabase.from("bug_reports").insert({
      category: type,
      description: text.trim().slice(0, 2000),
      app_version: CURRENT_VERSION,
      device,
      os,
    });
    setState(error ? "err" : "ok");
  };

  return (
    <Screen title="🐛 דיווח על תקלה">
      {state === "ok" ? (
        <section className="mt-3 rounded-2xl bg-card p-5 text-center shadow-card">
          <p className="text-xl font-bold text-ink">✅ הדיווח נשלח בהצלחה.</p>
          <p className="mt-1 text-muted-foreground">תודה שעזרת לנו לשפר את האפליקציה!</p>
        </section>
      ) : (
        <section className="mt-3 rounded-2xl bg-card p-4 shadow-card">
          <p className="text-muted-foreground">מצאתם בעיה באפליקציה? עזרו לנו לשפר את Math Journey.</p>
          <p className="mt-3 font-bold text-ink">סוג הדיווח</p>
          <div className="mt-2 grid gap-2">
            {TYPES.map((tp) => (
              <button
                key={tp}
                onClick={() => setType(tp)}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-right font-bold text-ink active:scale-95",
                  type === tp ? "bg-primary/15 ring-2 ring-primary" : "bg-muted",
                )}
              >
                {tp}
              </button>
            ))}
          </div>
          <p className="mt-3 font-bold text-ink">📝 תיאור הבעיה</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            rows={4}
            className="mt-2 w-full rounded-xl border-2 border-muted bg-background p-3 text-ink outline-none focus:border-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">יצורפו אוטומטית רק גרסת האפליקציה, סוג המכשיר ומערכת ההפעלה.</p>
          {state === "err" && (
            <p className="mt-2 font-bold text-destructive">⚠️ לא ניתן לשלוח כרגע. נסה שוב מאוחר יותר.</p>
          )}
          <button
            onClick={() => void send()}
            disabled={!type || !text.trim() || state === "sending"}
            className="mt-3 h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground active:scale-95 disabled:opacity-50"
          >
            📨 שליחת דיווח
          </button>
        </section>
      )}
      <div className="pb-28" />
    </Screen>
  );
}
