import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 1200 -> 1.2K, 3400000 -> 3.4M */
export function fmtNum(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    const v = n / 1_000_000;
    return `${(abs % 1_000_000 === 0 ? v.toFixed(0) : v.toFixed(1)).replace(/\.0$/, "")}M`;
  }
  if (abs >= 1000) {
    const v = n / 1000;
    return `${(abs % 1000 === 0 ? v.toFixed(0) : v.toFixed(1)).replace(/\.0$/, "")}K`;
  }
  return String(n);
}
