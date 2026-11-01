import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  token: "Bearer test-session", role: true, ip: "203.0.113.7",
  getUser: vi.fn(), rpc: vi.fn(),
}));
vi.mock("@tanstack/react-start/server", () => ({ getRequestHeader: (name: string) =>
  name === "authorization" ? mocks.token : name === "cf-connecting-ip" ? mocks.ip : undefined,
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({
  from: () => {
    const chain = { select: () => chain, eq: () => chain,
      maybeSingle: async () => ({ data: mocks.role ? { id: "admin-role" } : null, error: null }) };
    return chain;
  },
}) }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {
  auth: { getUser: mocks.getUser }, rpc: mocks.rpc,
  from: () => {
    const chain = { select: () => chain, eq: () => chain,
      maybeSingle: async () => ({ data: mocks.role ? { id: "admin-role" } : null, error: null }) };
    return chain;
  },
} }));
import { ADMIN_FAILURE, authorizeAdmin, matchesAdminCode } from "./admin-security.server";

const longCode = "a-secure-admin-code-123456789";
const config = { url: "https://test.invalid", key: "test-key" };
beforeEach(() => {
  mocks.token = "Bearer test-session"; mocks.role = true;
  mocks.getUser.mockReset().mockResolvedValue({ data: { user: { id: "verified-user" } }, error: null });
  mocks.rpc.mockReset().mockImplementation(async (_name, args) => ({ data: args._valid, error: null }));
});
it("requires at least 20 characters even when a short code matches", () => {
  expect(matchesAdminCode("short", "short")).toBe(false);
  expect(matchesAdminCode("a".repeat(19), "a".repeat(19))).toBe(false);
  expect(matchesAdminCode("a".repeat(20), "a".repeat(20))).toBe(true);
});
it("compares equal-size hashes and rejects mismatches of any length", () => {
  expect(matchesAdminCode(longCode, longCode)).toBe(true);
  expect(matchesAdminCode(longCode + "x", longCode)).toBe(false);
  expect(matchesAdminCode(undefined, longCode)).toBe(false);
});
it("requires a verified signed-in admin and invokes the atomic attempt guard", async () => {
  await authorizeAdmin(longCode, longCode, config);
  expect(mocks.getUser).toHaveBeenCalledWith("test-session");
  expect(mocks.rpc).toHaveBeenCalledWith("authorize_admin_attempt", { _key: "203.0.113.7", _valid: true });
});
it("returns the same generic error for missing identity, missing role and wrong code", async () => {
  mocks.token = "";
  await expect(authorizeAdmin(longCode, longCode, config)).rejects.toThrow(ADMIN_FAILURE);
  mocks.token = "Bearer test-session"; mocks.role = false;
  await expect(authorizeAdmin(longCode, longCode, config)).rejects.toThrow(ADMIN_FAILURE);
  mocks.role = true;
  await expect(authorizeAdmin("incorrect", longCode, config)).rejects.toThrow(ADMIN_FAILURE);
});
it("fails closed if rate storage fails or blocks an otherwise valid admin", async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: { message: "offline" } });
  await expect(authorizeAdmin(longCode, longCode, config)).rejects.toThrow(ADMIN_FAILURE);
  mocks.rpc.mockResolvedValue({ data: false, error: null });
  await expect(authorizeAdmin(longCode, longCode, config)).rejects.toThrow(ADMIN_FAILURE);
});