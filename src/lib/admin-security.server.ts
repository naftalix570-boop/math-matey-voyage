import { createHash, timingSafeEqual } from "node:crypto";
import { getRequestHeader } from "@tanstack/react-start/server";
import { isIP } from "node:net";
import { ADMIN_MIN_CODE_LENGTH, trustedClientIp } from "./security-rules";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const ADMIN_FAILURE = "לא ניתן לאמת הרשאת ניהול";

export function matchesAdminCode(supplied: unknown, expected: string): boolean {
  const candidate = typeof supplied === "string" && supplied.length <= 1024 ? supplied.trim() : "";
  const left = createHash("sha256").update(candidate).digest();
  const right = createHash("sha256").update(expected).digest();
  const matches = timingSafeEqual(left, right);
  return matches && expected.length >= ADMIN_MIN_CODE_LENGTH && candidate.length >= ADMIN_MIN_CODE_LENGTH;
}

export async function authorizeAdmin(code: unknown, expected: string, config?: { url: string; key: string }): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const token = getRequestHeader("authorization")?.replace(/^Bearer /i, "");
  let roleAllowed = false;
  if (token) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data.user && config?.url && config.key) {
      // Role lookup is performed with the verified caller's bearer and RLS, never as service_role.
      const caller = createClient<Database>(config.url, config.key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: role, error: roleError } = await caller.from("user_roles")
        .select("id").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
      roleAllowed = !roleError && Boolean(role);
    }
  }
  const candidateIp = trustedClientIp(getRequestHeader);
  const ip = isIP(candidateIp) ? candidateIp : "unknown";
  // The SQL operation serializes attempts, stores failed attempts, and fails closed.
  const valid = matchesAdminCode(code, expected) && roleAllowed;
  const { data: allowed, error } = await supabaseAdmin.rpc("authorize_admin_attempt", {
    _key: ip, _valid: valid,
  });
  if (error || !allowed) throw new Error(ADMIN_FAILURE);
}