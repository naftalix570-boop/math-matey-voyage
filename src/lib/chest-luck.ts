/** A luck ticket is spent only when explicitly selected for a successful opening. */
export function chestLuck(available: number, selected: boolean) {
  const active = selected && available > 0;
  return { active, remaining: available - (active ? 1 : 0) };
}