import { expect, it } from "vitest";
import { raisedTrophies } from "./score-reconcile";

it.each([[10, 20, 20], [20, 10, 20], [20, 20, 20], [0, 7, 7], [7, 0, 7]])(
  "reconciles local %s and server %s to %s without summing", (local, server, expected) => {
    expect(raisedTrophies(local, server)).toBe(expected);
  },
);
it.each([NaN, Infinity, -Infinity])("ignores non-finite server totals: %s", (server) => {
  expect(raisedTrophies(17, server)).toBe(17);
});