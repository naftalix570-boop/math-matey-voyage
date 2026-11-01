import { describe, expect, it } from "vitest";
import { isSafeDisplayName, MAX_SAVE_BYTES, trustedClientIp, validateGuestSave } from "./security-rules";

describe("trusted platform address", () => {
  it("does not accept spoofed forwarded-for or real-ip headers", () => {
    const headers: Record<string, string> = { "x-forwarded-for": "1.2.3.4", "x-real-ip": "1.2.3.4" };
    expect(trustedClientIp((name) => headers[name])).toBe("unknown");
  });
  it("uses only the platform-provided address", () => {
    expect(trustedClientIp((name) => name === "cf-connecting-ip" ? "203.0.113.42" : "1.2.3.4")).toBe("203.0.113.42");
  });
  it("rejects comma separated or invalid addresses", () => {
    expect(trustedClientIp(() => "1.2.3.4, 5.6.7.8")).toBe("unknown");
    expect(trustedClientIp(() => "999.0.0.1")).toBe("unknown");
  });
});

describe("guest saves", () => {
  it("enforces a 65536-byte UTF-8 limit", () => {
    expect(MAX_SAVE_BYTES).toBe(65536);
    expect(() => validateGuestSave({ icons: Array(500).fill("א".repeat(100)) })).toThrow("גדולה מדי");
  });
  it("rejects scalar, array, unknown-field and negative-counter saves", () => {
    for (const input of [[], "save", null, { injected: true }, { coins: -1 }, { history: ["true"] }]) {
      expect(() => validateGuestSave(input)).toThrow();
    }
  });
  it("accepts old empty saves and valid profile data without keeping the guest secret", () => {
    expect(validateGuestSave({})).toEqual({});
    expect(validateGuestSave({ coins: 120, stickers: [0, 499], guestSecret: "secret" })).toEqual({ coins: 120, stickers: [0, 499] });
  });
});

describe("child-safe display names", () => {
  it.each(["fuck", "SHIT", "זונה", "מניאק", "זִין", "f\u200buck"])("blocks profanity: %s", (name) => {
    expect(isSafeDisplayName(name)).toBe(false);
  });
  it.each(["https://example.com", "www.example.com", "example.com", "foo@gmail.com", "050-123-4567", "052 123 4567"])("blocks contact details: %s", (name) => {
    expect(isSafeDisplayName(name)).toBe(false);
  });
  it.each(["נפתלי", "שחקן 42", "Alice", "אלוף/ה", "⭐ רוני"])("preserves normal names: %s", (name) => {
    expect(isSafeDisplayName(name)).toBe(true);
  });
});