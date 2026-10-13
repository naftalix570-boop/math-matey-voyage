import { describe, expect, test } from "bun:test";
import { chestLuck } from "./chest-luck";
import { makeMatchingQuestions, makeQuestion } from "./math";
import { ALBUM_WORLDS, collectableSlots, worldProgress } from "./stickers";

describe("chest luck selection", () => {
  test("an unselected purchased ticket is preserved", () => {
    expect(chestLuck(2, false)).toEqual({ active: false, remaining: 2 });
  });
  test("selection spends exactly one ticket", () => {
    expect(chestLuck(2, true)).toEqual({ active: true, remaining: 1 });
  });
  test("no ticket cannot activate luck", () => {
    expect(chestLuck(0, true)).toEqual({ active: false, remaining: 0 });
  });
});

test("20 stickers do not fill the 100-sticker first world", () => {
  const owned = new Set(Array.from({ length: 20 }, (_, i) => i));
  const world = ALBUM_WORLDS[0];
  if (!world) throw new Error("Missing first world");
  expect(worldProgress(world, owned)).toEqual({ have: 20, total: 100, done: false });
  expect(collectableSlots(owned).filter((slot) => !owned.has(slot))).toHaveLength(80);
});

test("line and memory boards have no duplicate results", () => {
  for (const count of [4, 6]) {
    for (let i = 0; i < 50; i++) {
      const questions = makeMatchingQuestions(1, count);
      expect(questions).toHaveLength(count);
      expect(new Set(questions.map((q) => q.answer)).size).toBe(count);
    }
  }
});

test("division keeps dividend first and only generates exact integer answers", () => {
  for (let i = 0; i < 100; i++) {
    const q = makeQuestion(100, "div");
    expect(q.a / q.b).toBe(q.answer);
    expect(q.a).toBeGreaterThan(q.b);
    expect(Number.isInteger(q.answer)).toBe(true);
  }
});