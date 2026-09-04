import { useEffect, useSyncExternalStore } from "react";

/** נעילת יציאה — משחקים שאסור לצאת מהם באמצע */
let locked = false;
let message = "אי אפשר לצאת באמצע המשחק ⏱️";
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function isExitLocked() {
  return locked;
}

export function exitLockMessage() {
  return message;
}

export function useExitLocked() {
  return useSyncExternalStore(
    subscribe,
    () => locked,
    () => false,
  );
}

/** נועל יציאה כל עוד `active` דלוק */
export function useExitLock(active: boolean, msg?: string) {
  useEffect(() => {
    if (!active) return;
    locked = true;
    if (msg) message = msg;
    emit();
    const beforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      locked = false;
      window.removeEventListener("beforeunload", beforeUnload);
      emit();
    };
  }, [active, msg]);
}
