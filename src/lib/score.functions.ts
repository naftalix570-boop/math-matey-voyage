import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ================= הגנה על הניקוד =================
   השרת הוא הסמכות היחידה לניקוד שמוצג בטבלת המובילים.
   המכשיר שולח מנה אחת (עד 30 תשובות) כל 30 שניות, עם מזהה מנה לשליחה חוזרת בטוחה. */

/** מקסימום תשובות במנה אחת */
const MAX_BATCH = 30;
/** חלון בדיקה (ms) ומקסימום תשובות בתוכו — עודף נחתך */
const WINDOW_MS = 60_000;
export const MAX_PER_WINDOW = 90;
/** כמה חריגות באותה שעה מסמנות חשד */
const STRIKE_HOUR_MS = 3_600_000;
export const STRIKES_FOR_SUSPICIOUS = 6;
/** כמה מזהי מנות אחרונים נשמרים לכל שחקן */
const RECENT_BATCHES = 50;

type Batch = { correct: number; answered: number; batchId: string };

function cleanBatch(input: unknown): Batch {
  const raw = (input ?? {}) as Record<string, unknown>;
  const answered = Math.floor(Number(raw["answered"] ?? 0));
  const correct = Math.floor(Number(raw["correct"] ?? 0));
  if (!Number.isFinite(answered) || !Number.isFinite(correct)) {
    throw new Error("bad batch");
  }
  const id = typeof raw["batchId"] === "string" ? raw["batchId"].slice(0, 64) : "";
  return {
    answered: Math.max(0, Math.min(MAX_BATCH, answered)),
    correct: Math.max(0, Math.min(MAX_BATCH, correct)),
    batchId: /^[A-Za-z0-9-]{8,64}$/.test(id) ? id : "",
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
  recent_batches?: string[] | null;
  strike_hour?: string | null;
  strikes?: number | null;
};

/** מחשב את השורה החדשה אחרי מנת תשובות. null = מנה שכבר טופלה */
export function applyBatch(row: Row, batch: Batch) {
  const recent = row.recent_batches ?? [];
  if (batch.batchId && recent.includes(batch.batchId)) return null;

  const now = Date.now();
  const windowStart = new Date(row.window_start).getTime();
  const fresh = !Number.isFinite(windowStart) || now - windowStart > WINDOW_MS;
  const before = fresh ? 0 : row.window_answers;
  const room = Math.max(0, MAX_PER_WINDOW - before);

  const impossible = batch.correct > batch.answered;
  const answered = impossible ? 0 : Math.min(batch.answered, room);
  const correct = Math.min(batch.correct, answered);
  const exceeded = impossible || batch.answered > room;

  const strikeStart = new Date(row.strike_hour ?? 0).getTime();
  const sameHour = Number.isFinite(strikeStart) && now - strikeStart <= STRIKE_HOUR_MS;
  let strikes = sameHour ? (row.strikes ?? 0) : 0;
  let strikeHour = sameHour ? strikeStart : now;
  if (exceeded) {
    strikes += 1;
    if (!sameHour) strikeHour = now;
  }

  return {
    score: row.score + correct,
    answered: row.answered + answered,
    suspicious: row.suspicious || strikes >= STRIKES_FOR_SUSPICIOUS,
    window_start: new Date(fresh ? now : windowStart).toISOString(),
    window_answers: before + answered,
    recent_batches: batch.batchId ? [...recent, batch.batchId].slice(-RECENT_BATCHES) : recent,
    strike_hour: new Date(strikeHour).toISOString(),
    strikes,
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

const ROW_COLS = "score, answered, suspicious, window_start, window_answers, recent_batches, strike_hour, strikes";

async function clientIp(): Promise<string> {
  try {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const h =
      getRequestHeader("cf-connecting-ip") ||
      getRequestHeader("x-real-ip") ||
      getRequestHeader("x-forwarded-for") ||
      "";
    return h.split(",")[0]?.trim() || "unknown";
  } catch {
    return "unknown";
  }
}

/** מספר אירועים מסוג נתון בחלון זמן */
async function countEvents(kind: string, key: string, windowMs: number) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count } = await supabaseAdmin
    .from("rate_events")
    .select("id", { count: "exact", head: true })
    .eq("kind", kind)
    .eq("key", key)
    .gt("created_at", since);
  return count ?? 0;
}

async function addEvent(kind: string, key: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("rate_events").insert({ kind, key });
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/* ---------- שחקנים רשומים ---------- */

export const submitAnswers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(cleanBatch)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: existing } = await supabaseAdmin
      .from("player_scores")
      .select(ROW_COLS)
      .eq("user_id", userId)
      .maybeSingle();

    const current = (existing as Row | null) ?? EMPTY_ROW;
    const next = applyBatch(current, data);
    if (!next) return { score: current.score, suspicious: current.suspicious, duplicate: true };
    const { error } = await supabaseAdmin
      .from("player_scores")
      .upsert({ user_id: userId, ...next }, { onConflict: "user_id" });
    if (error) throw new Error("score update failed");

    // הניקוד המוצג בטבלה מגיע מהשרת בלבד
    await supabaseAdmin.from("profiles").update({ score: next.score }).eq("user_id", userId);

    return { score: next.score, suspicious: next.suspicious, duplicate: false };
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

export const claimAlbumTrophies = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { worldId: number }) => {
    if (!Number.isInteger(input.worldId) || input.worldId < 0 || input.worldId > 4) {
      throw new Error("עולם לא תקין");
    }
    return { worldId: input.worldId };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: score, error } = await supabaseAdmin.rpc("claim_album_trophies", {
      _user_id: context.userId, _world_id: data.worldId,
    });
    if (error) throw new Error("לא ניתן לשמור את פרס העולם כרגע");
    return { score: score ?? 0 };
  });

/* ---------- שחקני קוד (בלי התחברות) ---------- */

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomString(len: number) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** עד 5 יצירות שחקן אורח לשעה לכל כתובת IP */
const GUEST_CREATE_PER_HOUR = 5;

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
    const ip = await clientIp();
    if ((await countEvents("guest_create", ip, 3_600_000)) >= GUEST_CREATE_PER_HOUR) {
      throw new Error("too many guest players");
    }
    const secret = randomString(24);
    for (let attempt = 0; attempt < 6; attempt++) {
      const code = `MATH-${randomString(10)}`;
      const { error } = await supabaseAdmin.from("guest_players").insert({
        code,
        secret,
        display_name: data.name,
        icon: data.icon,
        country: data.country,
      });
      if (!error) {
        await addEvent("guest_create", ip);
        return { code, secret };
      }
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
  if (!data || !secret || data.secret !== secret) return null;
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
        ...(next ?? {}),
        display_name: data.name,
        icon: data.icon,
        country: data.country,
        data: data.data as never,
      })
      .eq("code", data.code);
    if (error) return { ok: false as const, score: row.score };
    return {
      ok: true as const,
      score: next ? next.score : row.score,
      suspicious: next ? next.suspicious : row.suspicious,
      duplicate: !next,
    };
  });

/** שחזור התקדמות במכשיר אחר לפי קוד + סוד */
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
      data: JSON.stringify(row.data ?? {}),
    };
  });

const PIN_TTL_MS = 10 * 60_000;
const FAIL_WINDOW_MS = 15 * 60_000;
const MAX_FAILS = 5;

/** המכשיר הישן מבקש PIN חד-פעמי בן 6 ספרות (בתוקף 10 דקות) */
export const guestRequestPin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => guestAuth((input ?? {}) as Record<string, unknown>))
  .handler(async ({ data }) => {
    const row = await loadGuest(data.code, data.secret);
    if (!row || row.claimed_by) return { ok: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const n = new Uint32Array(1);
    crypto.getRandomValues(n);
    const pin = String((n[0] ?? 0) % 1_000_000).padStart(6, "0");
    const expiresAt = new Date(Date.now() + PIN_TTL_MS).toISOString();
    const { error } = await supabaseAdmin.from("guest_transfer_pins").upsert(
      { code: data.code, pin_hash: await sha256(`${data.code}:${pin}`), expires_at: expiresAt },
      { onConflict: "code" },
    );
    if (error) return { ok: false as const };
    return { ok: true as const, pin, expiresAt };
  });

/** מעבר מכשיר: קוד + PIN חד-פעמי. מייצר סוד חדש ומבטל את הישן */
export const guestTransfer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const raw = (input ?? {}) as Record<string, unknown>;
    return {
      code: cleanText(raw["code"], "", 16).toUpperCase(),
      pin: cleanText(raw["pin"], "", 6).replace(/\D/g, ""),
    };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip = await clientIp();
    if (
      (await countEvents("transfer_fail_code", data.code, FAIL_WINDOW_MS)) >= MAX_FAILS ||
      (await countEvents("transfer_fail_ip", ip, FAIL_WINDOW_MS)) >= MAX_FAILS
    ) {
      return { ok: false as const, locked: true };
    }
    const fail = async () => {
      await addEvent("transfer_fail_code", data.code);
      await addEvent("transfer_fail_ip", ip);
      return { ok: false as const, locked: false };
    };
    if (!data.code || data.pin.length !== 6) return fail();

    const { data: pinRow } = await supabaseAdmin
      .from("guest_transfer_pins")
      .select("pin_hash, expires_at")
      .eq("code", data.code)
      .maybeSingle();
    if (
      !pinRow ||
      new Date(pinRow.expires_at).getTime() < Date.now() ||
      pinRow.pin_hash !== (await sha256(`${data.code}:${data.pin}`))
    ) {
      return fail();
    }
    // מחיקה מותנית אטומית: רק בקשה אחת יכולה לצרוך את ה-PIN.
    const { data: consumed, error: consumeError } = await supabaseAdmin
      .from("guest_transfer_pins")
      .delete()
      .eq("code", data.code)
      .eq("pin_hash", pinRow.pin_hash)
      .gt("expires_at", new Date().toISOString())
      .select("code")
      .maybeSingle();
    if (consumeError || !consumed) return fail();

    const secret = randomString(24);
    const { data: row, error } = await supabaseAdmin
      .from("guest_players")
      .update({ secret })
      .eq("code", data.code)
      .is("claimed_by", null)
      .select("*")
      .maybeSingle();
    if (error || !row) return { ok: false as const, locked: false };
    return {
      ok: true as const,
      secret,
      score: row.score,
      name: row.display_name,
      icon: row.icon,
      country: row.country,
      data: JSON.stringify(row.data ?? {}),
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
      .select(ROW_COLS)
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

    return { ok: true as const, score, data: JSON.stringify(row.data ?? {}) };
  });
