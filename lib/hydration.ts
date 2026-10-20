import { useSyncExternalStore } from "react";

const hydrationListeners = new Set<() => void>();
let hasHydrated = false;

function subscribeToHydration(listener: () => void) {
  hydrationListeners.add(listener);
  if (!hasHydrated) {
    hasHydrated = true;
    queueMicrotask(() => {
      for (const subscriber of hydrationListeners) subscriber();
    });
  }
  return () => {
    hydrationListeners.delete(listener);
  };
}

function getHydrationSnapshot() {
  return hasHydrated;
}

function getServerHydrationSnapshot() {
  return false;
}

export function useHasHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    getHydrationSnapshot,
    getServerHydrationSnapshot,
  );
}
