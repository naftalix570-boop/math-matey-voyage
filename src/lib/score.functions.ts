import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ================= הגנה על הניקוד =================
   השרת הוא הסמכות היחידה לניקוד שמוצג בטבלת המובילים.
   המכשיר שולח מנות של תשובות, והשרת מוסיף גביעים רק לפי כללי המשחק. */

/** מקסימום תשובות במנה אחת */
const MAX_BATCH = 120;
/** חלון בדיקה (ms) ומקסימום תשובות בתוכו */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 200;

type Batch = { correct: number; answered: number };

function cleanBatch(input: unknown): Batch {
  const raw = (input ?? {}) as Record<string, unknown>;
  const answered = Math.floor(Number(raw["answered"] ?? 0));
  const correct = Math.floor(Number(raw["correct"] ?? 0));
  if (!Number.isFinite(answered) || !Number.isFinite(correct)) {
    throw new Error("bad batch");
  }
  return {
    answered: Math.max(0, Math.min(MAX_BATCH, answered)),
    correct: Math.max(0, Math.min(MAX_BATCH, correct)),
  };
}

function cleanText(value: unknown, fallback: string, max = 40): string {
  const s = typeof value === "string" ? value.trim().slice(0, max) : "";
  return s || fallback;
}

type Row = {
  score: number;
  answered: number;
  suspicious: boolean;
  window_start: string;
  window_answers: number;
};

/** מחשב את השורה החדשה אחרי מנת תשובות, כולל תקרות ודגל חשד */
function applyBatch(row: Row, batch: Batch) {
  const now = Date.now();
  const windowStart = new Date(row.window_start).getTime();
  const fresh = !Number.isFinite(windowStart) || now - windowStart > WINDOW_MS;
  const windowAnswers = (fresh ? 0 : row.window_answers) + batch.answered;

  // יותר מדי תשובות בזמן קצר, או יותר נכונות מתשובות — חשוד
  const cheating = batch.correct > batch.answered || windowAnswers > MAX_PER_WINDOW;
  const allowed = cheating ? 0 : Math.min(batch.correct, batch.answered);

  return {
    score: row.score + allowed,
    answered: row.answered + (cheating ? 0 : batch.answered),
    suspicious: row.suspicious || cheating,
    window_start: new Date(fresh ? now : windowStart).toISOString(),
    window_answers: windowAnswers,
    updated_at: new Date().toISOString(),
  };
}

const EMPTY_ROW: Row = {
  score: 0,
  answered: 0,
  suspicious: false,
  window_start: new Date(0).toISOString(),
  window_answers: 0,
};

/* ---------- שחקנים רשומים ---------- */

export const submitAnswers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(cleanBatch)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: existing } = await supabaseAdmin
      .from("player_scores")
      .select("score, answered, suspicious, window_start, window_answers")
      .eq("user_id", userId)
      .maybeSingle();

    const next = applyBatch((existing as Row | null) ?? EMPTY_ROW, data);
    const { error } = await supabaseAdmin
      .from("player_scores")
      .upsert({ user_id: userId, ...next }, { onConflict: "user_id" });
    if (error) throw new Error("score update failed");

    // הניקוד המוצג בטבלה מגיע מהשרת בלבד
    await supabaseAdmin.from("profiles").update({ score: next.score }).eq("user_id", userId);

    return { score: next.score, suspicious: next.suspicious };
  });

export const getMyScore = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("player_scores")
      .select("score, suspicious")
      .eq("user_id", context.userId)
      .maybeSingle();
    return { score: data?.score ?? 0, suspicious: data?.suspicious ?? false };
  });

/* ---------- שחקני קוד (בלי התחברות) ---------- */

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomString(len: number) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export const createGuestPlayer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const raw = (input ?? {}) as Record<string, unknown>;
    return {
      name: cleanText(raw["name"], "שחקן"),
      icon: cleanText(raw["icon"], "⭐", 8),
      country: cleanText(raw["country"], "IL", 4),
    };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const secret = randomString(24);
    for (let attempt = 0; attempt < 6; attempt++) {
      const code = `MATH-${randomString(4)}`;
      const { error } = await supabaseAdmin.from("guest_players").insert({
        code,
        secret,
        display_name: data.name,
        icon: data.icon,
        country: data.country,
      });
      if (!error) return { code, secret };
    }
    throw new Error("could not create code");
  });

const guestAuth = (raw: Record<string, unknown>) => ({
  code: cleanText(raw["code"], "", 16).toUpperCase(),
  secret: cleanText(raw["secret"], "", 64),
});

async function loadGuest(code: string, secret: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("guest_players")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (!data || data.secret !== secret) return null;
  return data;
}

/** שמירת פרטי שחקן קוד + מנת תשובות (הניקוד נקבע בשרת) */
export const guestSync = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const raw = (input ?? {}) as Record<string, unknown>;
    return {
      ...guestAuth(raw),
      name: cleanText(raw["name"], "שחקן"),
      icon: cleanText(raw["icon"], "⭐", 8),
      country: cleanText(raw["country"], "IL", 4),
      data: (raw["data"] ?? {}) as Record<string, unknown>,
      batch: cleanBatch(raw["batch"] ?? {}),
    };
  })
  .handler(async ({ data }) => {
    const row = await loadGuest(data.code, data.secret);
    if (!row) return { ok: false as const, score: 0 };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const next = applyBatch(row as unknown as Row, data.batch);
    const { error } = await supabaseAdmin
      .from("guest_players")
      .update({
        ...next,
        display_name: data.name,
        icon: data.icon,
        country: data.country,
        data: data.data,
      })
      .eq("code", data.code);
    if (error) return { ok: false as const, score: row.score };
    return { ok: true as const, score: next.score, suspicious: next.suspicious };
  });

/** שחזור התקדמות במכשיר אחר לפי קוד */
export const guestRestore = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => guestAuth((input ?? {}) as Record<string, unknown>))
  .handler(async ({ data }) => {
    const row = await loadGuest(data.code, data.secret);
    if (!row) return { ok: false as const };
    return {
      ok: true as const,
      score: row.score,
      name: row.display_name,
      icon: row.icon,
      country: row.country,
      data: row.data as Record<string, unknown>,
    };
  });

/** מעבר מכשיר: הקוד לבדו מספיק, אך מייצר סוד חדש ומבטל את הישן */
export const guestTransfer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ({
    code: cleanText(((input ?? {}) as Record<string, unknown>)["code"], "", 16).toUpperCase(),
  }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const secret = randomString(24);
    const { data: row, error } = await supabaseAdmin
      .from("guest_players")
      .update({ secret })
      .eq("code", data.code)
      .is("claimed_by", null)
      .select("*")
      .maybeSingle();
    if (error || !row) return { ok: false as const };
    return {
      ok: true as const,
      secret,
      score: row.score,
      name: row.display_name,
      icon: row.icon,
      country: row.country,
      data: row.data as Record<string, unknown>,
    };
  });

/** מיזוג שחקן קוד לחשבון אחרי התחברות */
export const guestClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => guestAuth((input ?? {}) as Record<string, unknown>))
  .handler(async ({ data, context }) => {
    const row = await loadGuest(data.code, data.secret);
    if (!row || row.claimed_by) return { ok: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: mine } = await supabaseAdmin
      .from("player_scores")
      .select("score, answered, suspicious, window_start, window_answers")
      .eq("user_id", userId)
      .maybeSingle();

    const current = (mine as Row | null) ?? EMPTY_ROW;
    const score = Math.max(current.score, row.score);
    await supabaseAdmin.from("player_scores").upsert(
      {
        user_id: userId,
        score,
        answered: Math.max(current.answered, row.answered),
        suspicious: current.suspicious || row.suspicious,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    await supabaseAdmin.from("profiles").update({ score }).eq("user_id", userId);
    await supabaseAdmin.from("guest_players").update({ claimed_by: userId }).eq("code", data.code);

    return { ok: true as const, score, data: row.data as Record<string, unknown> };
  });
