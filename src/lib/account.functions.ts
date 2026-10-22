import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** No user id is accepted from the client: the verified caller is the target. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const token = getRequestHeader("authorization")?.replace(/^Bearer /, "");
    if (!token) throw new Error("נדרשת התחברות מחדש לפני מחיקת החשבון");
    const { data, error } = await context.supabase.auth.getUser(token);
    if (error || data.user?.id !== context.userId) {
      throw new Error("נדרשת התחברות מחדש לפני מחיקת החשבון");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;
    const { data: guests, error: guestError } = await supabaseAdmin
      .from("guest_players").select("code").eq("claimed_by", uid);
    if (guestError) throw new Error("לא ניתן למחוק את החשבון כרגע. נסו שוב");
    const codes = (guests ?? []).map((guest) => guest.code);
    if (codes.length) {
      const { error: pinError } = await supabaseAdmin.from("guest_transfer_pins").delete().in("code", codes);
      if (pinError) throw new Error("לא ניתן למחוק את החשבון כרגע. נסו שוב");
      const { error: rateError } = await supabaseAdmin.from("rate_events").delete()
        .eq("kind", "transfer_fail_code").in("key", codes);
      if (rateError) throw new Error("לא ניתן למחוק את החשבון כרגע. נסו שוב");
    }
    const { error: linkError } = await supabaseAdmin.from("guest_players").delete().eq("claimed_by", uid);
    if (linkError) throw new Error("לא ניתן למחוק את החשבון כרגע. נסו שוב");
    for (const table of ["admin_grants", "album_world_claims", "promo_redemptions", "player_scores", "profiles"] as const) {
      const { error: deleteError } = await supabaseAdmin.from(table).delete().eq("user_id", uid);
      if (deleteError) throw new Error("לא ניתן להשלים את מחיקת החשבון. נסו שוב");
    }
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (authError) throw new Error("לא ניתן להשלים את מחיקת החשבון. נסו שוב");
    return { ok: true };
  });