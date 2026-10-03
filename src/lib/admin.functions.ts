import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type RewardType = "coins" | "hints" | "chest" | "trophies" | "stickers";

const REWARDS: RewardType[] = ["coins", "hints", "chest", "trophies", "stickers"];

function checkAdmin(code: unknown) {
  const expected = process.env["ADMIN_CODE"] ?? "";
  if (typeof code !== "string" || !expected || code.trim() !== expected) {
    throw new Error("קוד שגוי");
  }
}

export const verifyAdminCode = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data }) => {
    const expected = process.env["ADMIN_CODE"] ?? "";
    return { ok: Boolean(expected) && data.code.trim() === expected };
  });

export const listAdminUsers = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data }) => {
    checkAdmin(data.code);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, icon, country, score, data")
      .order("score", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => {
      const d = (r.data ?? {}) as Record<string, unknown>;
      const inv = (d["chestInv"] ?? {}) as Record<string, number>;
      const chests =
        Number(d["chests"] ?? 0) +
        Object.values(inv).reduce((a, b) => a + Number(b ?? 0), 0);
      return {
        userId: r.user_id,
        name: r.display_name || "שחקן",
        icon: r.icon || "⭐",
        country: r.country || "IL",
        trophies: Number(d["trophies"] ?? r.score ?? 0),
        coins: Number(d["coins"] ?? 0),
        hints: Number(d["hints"] ?? 0),
        chests,
      };
    });
  });

export const listPromoCodes = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data }) => {
    checkAdmin(data.code);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("promo_codes")
      .select("code, reward_type, amount, max_uses, uses, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const randomCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++)
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
};

export const createPromoCode = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      code: string;
      rewardType: RewardType;
      amount: number;
      maxUses: number;
      custom?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    checkAdmin(data.code);
    if (!REWARDS.includes(data.rewardType)) throw new Error("פרס לא תקין");
    const amount = Math.max(1, Math.min(100000, Math.floor(data.amount)));
    const maxUses = Math.max(1, Math.min(100000, Math.floor(data.maxUses)));
    const custom = (data.custom ?? "").trim().toUpperCase().slice(0, 16);
    if (custom && !/^[A-Z0-9]+$/.test(custom)) throw new Error("קוד יכול להכיל אותיות ומספרים בלבד");
    const promo = custom || randomCode();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("promo_codes").insert({
      code: promo,
      reward_type: data.rewardType,
      amount,
      max_uses: maxUses,
    });
    if (error) throw new Error(error.code === "23505" ? "הקוד כבר קיים" : error.message);
    return { code: promo, rewardType: data.rewardType, amount, maxUses };
  });

export const deletePromoCode = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; promo: string }) => input)
  .handler(async ({ data }) => {
    checkAdmin(data.code);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("promo_codes")
      .delete()
      .eq("code", data.promo);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const redeemPromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { promo: string }) => input)
  .handler(async ({ data, context }) => {
    const promo = data.promo.trim().toUpperCase().slice(0, 16);
    if (!promo) throw new Error("הכניסו קוד");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("promo_codes")
      .select("code, reward_type, amount, max_uses, uses")
      .eq("code", promo)
      .maybeSingle();
    if (!row) throw new Error("קוד שגוי");
    if (row.uses >= row.max_uses) throw new Error("הקוד נוצל במלואו");

    const { error: insErr } = await supabaseAdmin
      .from("promo_redemptions")
      .insert({ code: promo, user_id: context.userId });
    if (insErr) {
      if (insErr.code === "23505") throw new Error("כבר מימשתם את הקוד הזה");
      throw new Error(insErr.message);
    }
    await supabaseAdmin
      .from("promo_codes")
      .update({ uses: row.uses + 1 })
      .eq("code", promo);

    return { rewardType: row.reward_type as RewardType, amount: row.amount };
  });

export const getAdminUser = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; userId: string }) => input)
  .handler(async ({ data }) => {
    checkAdmin(data.code);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, icon, country, score, data, updated_at")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("משתמש לא נמצא");
    return row;
  });

export const grantToUser = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { code: string; userId: string; rewardType: RewardType; amount: number }) => input,
  )
  .handler(async ({ data }) => {
    checkAdmin(data.code);
    if (!REWARDS.includes(data.rewardType)) throw new Error("פרס לא תקין");
    const amount = Math.round(data.amount);
    if (!Number.isFinite(amount) || amount === 0) throw new Error("כמות לא תקינה");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // נשמר כמענק ממתין; המכשיר של השחקן מוסיף אותו להתקדמות (כדי שהשמירה המקומית לא תדרוס)
    const { error } = await supabaseAdmin
      .from("admin_grants")
      .insert({ user_id: data.userId, reward_type: data.rewardType, amount });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
