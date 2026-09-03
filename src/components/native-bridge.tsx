import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp, NATIVE_APP_SCHEME } from "@/lib/native";

/**
 * מאזין ל-deep link שחוזר מהדפדפן החיצוני אחרי התחברות גוגל
 * (mathjourney://auth#access_token=...&refresh_token=...) ומגדיר את הסשן באפליקציה.
 * בדפדפן רגיל הרכיב לא עושה כלום.
 */
export function NativeBridge() {
  useEffect(() => {
    if (!isNativeApp()) return;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const [{ App }, { Browser }, { StatusBar, Style }, { SplashScreen }] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/browser"),
        import("@capacitor/status-bar"),
        import("@capacitor/splash-screen"),
      ]);

      try {
        await StatusBar.setStyle({ style: Style.Light });
      } catch {
        /* iOS/emulator may not support it */
      }
      void SplashScreen.hide();

      const handle = await App.addListener("appUrlOpen", ({ url }) => {
        if (!url.startsWith(`${NATIVE_APP_SCHEME}://`)) return;
        void Browser.close().catch(() => undefined);
        const fragment = url.includes("#") ? url.slice(url.indexOf("#") + 1) : "";
        const params = new URLSearchParams(fragment);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          void supabase.auth.setSession({ access_token, refresh_token });
        }
      });

      const backHandle = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) window.history.back();
        else void App.exitApp();
      });

      cleanup = () => {
        void handle.remove();
        void backHandle.remove();
      };
    })();

    return () => cleanup?.();
  }, []);

  return null;
}
