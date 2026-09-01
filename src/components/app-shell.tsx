import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft, Home, Gamepad2, Trophy, ShoppingCart, Settings } from "lucide-react";
import { useGame } from "@/lib/game-state";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", key: "nav.home", icon: Home },
  { to: "/games", key: "nav.games", icon: Gamepad2 },
  { to: "/shop", key: "nav.shop", icon: ShoppingCart },
  { to: "/leaderboard", key: "nav.top", icon: Trophy },
  { to: "/settings", key: "nav.settings", icon: Settings },
] as const;



export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { sound } = useGame();
  const { t } = useI18n();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-lg justify-around bg-nav px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-nav-foreground">
      {NAV.map(({ to, key, icon: Icon }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={() => sound("click")}
            className={cn(
              "flex w-full flex-col items-center gap-0.5 rounded-lg py-1 text-[12px] transition-colors",
              active ? "font-bold text-gold" : "text-nav-foreground/70",
            )}
          >
            <Icon className="size-5" strokeWidth={active ? 2.6 : 2} />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}

export function BackButton({ to }: { to?: string }) {
  const router = useRouter();
  const { sound } = useGame();
  const { t } = useI18n();
  return (
    <button
      type="button"
      aria-label={t("common.back")}
      onClick={() => {
        sound("click");
        if (to) router.navigate({ to });
        else router.history.back();
      }}
      className="flex size-10 items-center justify-center rounded-full text-primary transition-transform active:scale-90"
    >
      <ArrowLeft className="size-7" />
    </button>
  );
}

export function Screen({
  title,
  children,
  back = true,
  right,
  nav = true,
}: {
  title?: string;
  children: ReactNode;
  back?: boolean;
  right?: ReactNode;
  nav?: boolean;
}) {
  const { dir } = useI18n();
  return (
    <div dir={dir} className="mx-auto min-h-screen max-w-lg bg-background">
      <div className="animate-page screen-pad">
        {(back || title) && (
          <header className="sticky top-0 z-30 -mx-4 flex items-center gap-2 bg-background/90 px-2 py-2 backdrop-blur">
            <div className="order-last">{back && <BackButton />}</div>
            {title && (
              <h1 className="flex-1 text-center text-[22px] font-bold text-ink">{title}</h1>
            )}
            <div className="size-10">{right}</div>
          </header>
        )}
        {children}
      </div>
      {nav && <BottomNav />}
    </div>
  );
}
