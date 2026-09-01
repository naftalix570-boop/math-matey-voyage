import { useEffect, useState } from "react";

export function Confetti({ show, duration = 2200 }: { show: boolean; duration?: number }) {
  const [on, setOn] = useState(show);
  useEffect(() => {
    setOn(show);
    if (!show) return;
    const t = setTimeout(() => setOn(false), duration);
    return () => clearTimeout(t);
  }, [show, duration]);

  if (!on) return null;
  const colors = ["var(--gold)", "var(--primary)", "var(--success)", "var(--warning)", "var(--progress)"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="absolute top-0 block size-2.5 rounded-[2px]"
          style={{
            left: `${(i * 37) % 100}%`,
            backgroundColor: colors[i % colors.length],
            animation: `confetti-fall ${1.2 + (i % 7) * 0.18}s linear ${(i % 10) * 0.08}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

export function Sparkles({ trigger }: { trigger: number }) {
  if (!trigger) return null;
  return (
    <div key={trigger} className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className="absolute text-xl"
          style={
            {
              "--dx": `${Math.cos((i / 8) * Math.PI * 2) * 70}px`,
              "--dy": `${Math.sin((i / 8) * Math.PI * 2) * 70}px`,
              animation: "spark-fly 0.6s ease-out forwards",
            } as React.CSSProperties
          }
        >
          ✨
        </span>
      ))}
    </div>
  );
}

export function Logo({ size = 96, bounce = 0 }: { size?: number; bounce?: number }) {
  return (
    <div
      key={bounce}
      className={bounce ? "animate-bounce-up" : undefined}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
        <circle cx="50" cy="50" r="46" fill="var(--sky)" stroke="var(--primary)" strokeWidth="4" />
        <path
          d="M50 20l8.5 19.5L79 42l-15 14 4 21-18-10-18 10 4-21-15-14 20.5-2.5z"
          fill="var(--gold)"
          stroke="var(--warning)"
          strokeWidth="2"
        />
        <text x="50" y="88" textAnchor="middle" fontSize="16" fill="var(--ink)" fontWeight="bold">
          + − × ÷
        </text>
      </svg>
    </div>
  );
}

/** אנימציית פתיחת תיבה — רעידה, פיצוץ אור וחשיפת פרסים */
export function ChestOpenOverlay({
  emoji,
  title,
  items,
  onClose,
}: {
  emoji: string;
  title: string;
  items: { key: string; label: string; highlight?: boolean }[];
  onClose: () => void;
}) {
  const [stage, setStage] = useState<"shake" | "open">("shake");
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setStage("open"), 1100);
    return () => clearTimeout(t);
  }, []);

  const left = items.length - shown;
  const current = shown > 0 ? items[shown - 1] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-5 backdrop-blur-sm">
      <Confetti show={stage === "open"} />
      <div className="relative w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-card">
        {stage === "open" && (
          <span className="absolute top-4 left-4 rounded-full bg-muted px-3 py-1 text-xs font-bold text-ink">
            {left > 0 ? `נשארו עוד ${left}` : "נשארו עוד 0"}
          </span>
        )}
        <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
          {stage === "open" && (
            <span
              className="animate-rays absolute inset-[-40%] rounded-full opacity-60"
              style={{
                background:
                  "conic-gradient(var(--gold) 0 10deg, transparent 10deg 30deg, var(--gold) 30deg 40deg, transparent 40deg 60deg, var(--gold) 60deg 70deg, transparent 70deg 90deg, var(--gold) 90deg 100deg, transparent 100deg 120deg, var(--gold) 120deg 130deg, transparent 130deg 150deg, var(--gold) 150deg 160deg, transparent 160deg 180deg, var(--gold) 180deg 190deg, transparent 190deg 210deg, var(--gold) 210deg 220deg, transparent 220deg 240deg, var(--gold) 240deg 250deg, transparent 250deg 270deg, var(--gold) 270deg 280deg, transparent 280deg 300deg, var(--gold) 300deg 310deg, transparent 310deg 330deg, var(--gold) 330deg 340deg, transparent 340deg 360deg)",
                maskImage: "radial-gradient(circle, transparent 30%, black 45%, transparent 72%)",
              }}
            />
          )}
          <span
            className={
              "relative text-7xl " +
              (stage === "shake" ? "animate-chest-shake" : "animate-chest-burst")
            }
          >
            {emoji}
          </span>
          {stage === "open" && <Sparkles trigger={shown + 1} />}
        </div>

        <p className="mt-3 text-xl font-bold text-ink">
          {stage === "shake" ? "פותחים..." : title}
        </p>

        {stage === "open" && (
          <>
            <div className="mt-4 flex min-h-24 items-center justify-center">
              {current ? (
                <div
                  key={current.key}
                  className={
                    "animate-reveal w-full rounded-2xl px-4 py-5 text-2xl font-bold " +
                    (current.highlight
                      ? "bg-warning text-warning-foreground"
                      : "bg-muted text-ink")
                  }
                >
                  {current.label}
                </div>
              ) : (
                <p className="text-muted-foreground">לחצו כדי לגלות מה קיבלתם 👆</p>
              )}
            </div>

            {shown > 0 && (
              <div className="mt-2 flex justify-center gap-1">
                {items.map((it, i) => (
                  <span
                    key={it.key}
                    className={
                      "size-2 rounded-full " + (i < shown ? "bg-primary" : "bg-muted")
                    }
                  />
                ))}
              </div>
            )}

            <button
              onClick={() => (left > 0 ? setShown((s) => s + 1) : onClose())}
              className="mt-5 h-12 w-full rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-pop active:scale-95"
            >
              {left > 0 ? (shown === 0 ? "גלה את הפרס 🎁" : `הבא (${left}) 👉`) : "מגניב! 🎉"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

