import { useSyncExternalStore } from "react";
import type { DiscountRule } from "@/lib/admin-store";
import { useHasHydrated } from "@/lib/hydration";

export type DiscountCalculationResult = {
  applicable: boolean;
  discountCents: number;
  message?: string;
};

export type AppliedPromo = {
  code: string;
  name: string;
  discountCents: number;
  message: string;
};

const PROMO_KEY = "floralyn-applied-discount";
const promoListeners = new Set<() => void>();
let cachedPromoJson: string | null | undefined;
let cachedPromo: AppliedPromo | null = null;

function readPromo(json: string | null): AppliedPromo | null {
  try {
    if (!json) return null;
    const parsed = JSON.parse(json);
    return parsed?.code && typeof parsed?.discountCents === "number" ? parsed : null;
  } catch {
    return null;
  }
}

function getPromoSnapshot(): AppliedPromo | null {
  if (typeof window === "undefined") return null;
  let json: string | null;
  try {
    json = window.localStorage.getItem(PROMO_KEY);
  } catch {
    json = null;
  }
  if (json !== cachedPromoJson) {
    cachedPromoJson = json;
    cachedPromo = readPromo(json);
  }
  return cachedPromo;
}

function getServerPromoSnapshot(): AppliedPromo | null {
  return null;
}

function subscribeToPromo(listener: () => void) {
  promoListeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === PROMO_KEY || event.key === null) {
      cachedPromoJson = undefined;
      listener();
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    promoListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function notifyPromoChanged() {
  for (const listener of promoListeners) listener();
}

export function useAppliedPromo(): AppliedPromo | null {
  const promo = useSyncExternalStore(
    subscribeToPromo,
    getPromoSnapshot,
    getServerPromoSnapshot,
  );
  return useHasHydrated() ? promo : null;
}

export function saveAppliedPromo(promo: AppliedPromo | null) {
  if (typeof window === "undefined") return;
  if (!promo) {
    window.localStorage.removeItem(PROMO_KEY);
    cachedPromoJson = null;
    cachedPromo = null;
  } else {
    const json = JSON.stringify(promo);
    window.localStorage.setItem(PROMO_KEY, json);
    cachedPromoJson = json;
    cachedPromo = promo;
  }
  notifyPromoChanged();
}

export function parseDiscountValue(value: string, subtotalCents: number): number {
  const clean = value.trim();
  if (!clean || subtotalCents <= 0) return 0;

  if (clean.endsWith("%")) {
    const percent = parseFloat(clean.slice(0, -1));
    if (isNaN(percent) || percent <= 0) return 0;
    return Math.min(subtotalCents, Math.round((subtotalCents * percent) / 100));
  }

  const numericString = clean.startsWith("$") ? clean.slice(1).trim() : clean;
  const dollars = parseFloat(numericString);
  if (isNaN(dollars) || dollars <= 0) return 0;
  const cents = Math.round(dollars * 100);
  return Math.min(subtotalCents, cents);
}

export function evaluateDiscountRule(
  rule: DiscountRule,
  subtotalCents: number,
  itemCount: number,
  providedCode?: string,
): DiscountCalculationResult {
  if (!rule.active) {
    return { applicable: false, discountCents: 0, message: "Promotion is no longer active." };
  }

  if (rule.kind === "Coupon") {
    if (!providedCode) {
      return { applicable: false, discountCents: 0, message: "Coupon code is required." };
    }
    const normalizedInput = providedCode.trim().toUpperCase();
    const normalizedCode = (rule.code ?? "").trim().toUpperCase();
    if (!normalizedCode || normalizedInput !== normalizedCode) {
      return { applicable: false, discountCents: 0, message: "Invalid coupon code." };
    }
  }

  if (rule.minimumQuantity && itemCount < rule.minimumQuantity) {
    return {
      applicable: false,
      discountCents: 0,
      message: `Requires a minimum of ${rule.minimumQuantity} item${rule.minimumQuantity === 1 ? "" : "s"}.`,
    };
  }

  if (rule.kind === "Bundle" && itemCount < 2) {
    return {
      applicable: false,
      discountCents: 0,
      message: "Bundle discounts require at least 2 items in your bag.",
    };
  }

  const discountCents = parseDiscountValue(rule.value, subtotalCents);
  if (discountCents <= 0) {
    return { applicable: false, discountCents: 0, message: "Discount does not affect order total." };
  }

  return { applicable: true, discountCents };
}
