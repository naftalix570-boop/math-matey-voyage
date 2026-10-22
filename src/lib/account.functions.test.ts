import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  handler: undefined as undefined | ((input: { context: { userId: string; supabase: { auth: { getUser: ReturnType<typeof vi.fn> } } } }) => Promise<unknown>),
  calls: [] as Array<{ table: string; column: string; value: unknown }>,
  deleteUser: vi.fn(),
  getUser: vi.fn(),
  failTable: "",
  guests: [{ code: "owned-guest" }],
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({ middleware: () => ({ handler: (handler: typeof mocks.handler) => { mocks.handler = handler; return handler; } }) }),
}));
vi.mock("@tanstack/react-start/server", () => ({ getRequestHeader: () => "Bearer test-token" }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {
  auth: { admin: { deleteUser: mocks.deleteUser } },
  from: (table: string) => {
    let deleting = false;
    const chain = {
      select: () => chain,
      delete: () => { deleting = true; return chain; },
      eq: (column: string, value: unknown) => { mocks.calls.push({ table, column, value }); return chain; },
      in: (column: string, value: unknown) => { mocks.calls.push({ table, column, value }); return chain; },
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({
        data: !deleting && table === "guest_players" ? mocks.guests : null,
        error: table === mocks.failTable ? { message: "failed" } : null,
      })),
    };
    return chain;
  },
} }));
import "./account.functions";

const invoke = () => {
  if (!mocks.handler) throw new Error("Missing server handler");
  return mocks.handler({ context: { userId: "current-user", supabase: { auth: { getUser: mocks.getUser } } } });
};
beforeEach(() => {
  mocks.calls.length = 0; mocks.failTable = "";
  mocks.getUser.mockReset().mockResolvedValue({ data: { user: { id: "current-user" } }, error: null });
  mocks.deleteUser.mockReset().mockResolvedValue({ error: null });
});
it("deletes only verified caller rows and their linked guest data before deleting Auth", async () => {
  mocks.deleteUser.mockImplementation(async (uid) => {
    expect(uid).toBe("current-user");
    expect(mocks.calls.filter((call) => call.column === "user_id").map((call) => call.table))
      .toEqual(["admin_grants", "album_world_claims", "promo_redemptions", "player_scores", "profiles"]);
    return { error: null };
  });
  expect(await invoke()).toEqual({ ok: true });
  expect(mocks.calls.filter((call) => ["user_id", "claimed_by"].includes(call.column)).every((call) => call.value === "current-user")).toBe(true);
  expect(mocks.calls).toContainEqual({ table: "guest_transfer_pins", column: "code", value: ["owned-guest"] });
  expect(mocks.calls).toContainEqual({ table: "rate_events", column: "key", value: ["owned-guest"] });
  expect(mocks.deleteUser).toHaveBeenCalledOnce();
});
it("rejects a different verified identity without deleting any rows", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: { id: "another-user" } }, error: null });
  await expect(invoke()).rejects.toThrow("נדרשת התחברות מחדש");
  expect(mocks.calls).toEqual([]);
  expect(mocks.deleteUser).not.toHaveBeenCalled();
});
it("rejects an expired or deleted session without deleting any rows", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: "unauthorized" } });
  await expect(invoke()).rejects.toThrow("נדרשת התחברות מחדש");
  expect(mocks.calls).toEqual([]);
});
it("does not delete Auth or report success if owned-data deletion fails", async () => {
  mocks.failTable = "album_world_claims";
  await expect(invoke()).rejects.toThrow("לא ניתן להשלים");
  expect(mocks.deleteUser).not.toHaveBeenCalled();
});
it("does not report success if Auth deletion fails", async () => {
  mocks.deleteUser.mockResolvedValue({ error: { message: "failed" } });
  await expect(invoke()).rejects.toThrow("לא ניתן להשלים");
});