import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { chestLuck } from "./chest-luck";
import { makeMatchingQuestions, makeQuestion } from "./math";
import { ALBUM_WORLDS, collectableSlots, worldProgress } from "./stickers";

describe("chest luck selection", () => {
  test("an unselected purchased ticket is preserved", () => {
    assert.deepEqual(chestLuck(2, false), { active: false, remaining: 2 });
  });
  test("selection spends exactly one ticket", () => {
    assert.deepEqual(chestLuck(2, true), { active: true, remaining: 1 });
  });
  test("no ticket cannot activate luck", () => {
    assert.deepEqual(chestLuck(0, true), { active: false, remaining: 0 });
  });
});

test("20 stickers do not fill the 100-sticker first world", () => {
  const owned = new Set(Array.from({ length: 20 }, (_, i) => i));
  const world = ALBUM_WORLDS[0];
  if (!world) throw new Error("Missing first world");
  assert.deepEqual(worldProgress(world, owned), { have: 20, total: 100, done: false });
  assert.equal(collectableSlots(owned).filter((slot) => !owned.has(slot)).length, 80);
});

test("line and memory boards have no duplicate results", () => {
  for (const count of [4, 6]) {
    for (let i = 0; i < 50; i++) {
      const questions = makeMatchingQuestions(1, count);
      assert.equal(questions.length, count);
      assert.equal(new Set(questions.map((q) => q.answer)).size, count);
    }
  }
});

test("division keeps dividend first and only generates exact integer answers", () => {
  for (let i = 0; i < 100; i++) {
    const q = makeQuestion(100, "div");
    assert.equal(q.a / q.b, q.answer);
    assert.ok(q.a > q.b);
    assert.equal(Number.isInteger(q.answer), true);
  }
});