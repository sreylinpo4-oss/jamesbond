const WISHLIST_KEY = "floralyn-wishlist";

export function getWishlist(): number[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = window.localStorage.getItem(WISHLIST_KEY);
    return saved ? (JSON.parse(saved) as number[]) : [];
  } catch {
    return [];
  }
}

export function saveWishlist(items: number[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
}

export function toggleWishlist(productId: number) {
  const current = getWishlist();
  const next = current.includes(productId)
    ? current.filter((item) => item !== productId)
    : [...current, productId];

  saveWishlist(next);
  return next;
}
