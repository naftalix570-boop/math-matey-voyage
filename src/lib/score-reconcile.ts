/** Server acknowledgements are absolute totals, never additional rewards. */
export function raisedTrophies(local: number, server: number): number {
  return Number.isFinite(server) ? Math.max(local, server) : local;
}