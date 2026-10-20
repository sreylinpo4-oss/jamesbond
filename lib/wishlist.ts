import { useSyncExternalStore } from "react";
import { useHasHydrated } from "@/lib/hydration";

const WISHLIST_KEY = "floralyn-wishlist";
const emptyWishlist: number[] = [];
const wishlistListeners = new Set<() => void>();
let cachedWishlistJson: string | null | undefined;
let cachedWishlist: number[] = emptyWishlist;

function readWishlist(json: string | null): number[] {
  try {
    return json ? (JSON.parse(json) as number[]) : emptyWishlist;
  } catch {
    return emptyWishlist;
  }
}

function getWishlistSnapshot(): number[] {
  if (typeof window === "undefined") return emptyWishlist;

  let json: string | null;
  try {
    json = window.localStorage.getItem(WISHLIST_KEY);
  } catch {
    json = null;
  }

  if (json !== cachedWishlistJson) {
    cachedWishlistJson = json;
    cachedWishlist = readWishlist(json);
  }
  return cachedWishlist;
}

function getServerWishlistSnapshot(): number[] {
  return emptyWishlist;
}

function subscribeToWishlist(listener: () => void) {
  wishlistListeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === WISHLIST_KEY || event.key === null) {
      cachedWishlistJson = undefined;
      listener();
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    wishlistListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function notifyWishlistChanged() {
  for (const listener of wishlistListeners) listener();
}

export function useWishlist(): number[] {
  const wishlist = useSyncExternalStore(
    subscribeToWishlist,
    getWishlistSnapshot,
    getServerWishlistSnapshot,
  );

  return useHasHydrated() ? wishlist : emptyWishlist;
}

export function getWishlist(): number[] {
  return getWishlistSnapshot();
}

export function saveWishlist(items: number[]) {
  if (typeof window === "undefined") return;
  const json = JSON.stringify(items);
  window.localStorage.setItem(WISHLIST_KEY, json);
  cachedWishlistJson = json;
  cachedWishlist = items;
  notifyWishlistChanged();
}

export function toggleWishlist(productId: number) {
  const current = getWishlist();
  const next = current.includes(productId)
    ? current.filter((item) => item !== productId)
    : [...current, productId];

  saveWishlist(next);
  return next;
}
