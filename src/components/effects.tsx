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
