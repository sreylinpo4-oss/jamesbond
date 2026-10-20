import { useSyncExternalStore } from "react";
import { useHasHydrated } from "@/lib/hydration";

const CART_KEY = "floralyn-cart";

export type CartState = Record<number, number>;

const emptyCart: CartState = Object.freeze({});
const cartListeners = new Set<() => void>();
let cachedCartJson: string | null | undefined;
let cachedCart: CartState = emptyCart;

function readCart(json: string | null): CartState {
  try {
    return json ? (JSON.parse(json) as CartState) : emptyCart;
  } catch {
    return emptyCart;
  }
}

function getCartSnapshot(): CartState {
  if (typeof window === "undefined") return emptyCart;

  let json: string | null;
  try {
    json = window.localStorage.getItem(CART_KEY);
  } catch {
    json = null;
  }

  if (json !== cachedCartJson) {
    cachedCartJson = json;
    cachedCart = readCart(json);
  }
  return cachedCart;
}

function getServerCartSnapshot(): CartState {
  return emptyCart;
}

function subscribeToCart(listener: () => void) {
  cartListeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === CART_KEY || event.key === null) {
      cachedCartJson = undefined;
      listener();
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    cartListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function notifyCartChanged() {
  for (const listener of cartListeners) listener();
}

export function useCart(): CartState {
  const cart = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    getServerCartSnapshot,
  );

  return useHasHydrated() ? cart : emptyCart;
}

export function getCart(): CartState {
  return getCartSnapshot();
}

export function saveCart(cart: CartState) {
  if (typeof window === "undefined") {
    return;
  }

  const json = JSON.stringify(cart);
  window.localStorage.setItem(CART_KEY, json);
  cachedCartJson = json;
  cachedCart = cart;
  notifyCartChanged();
}

export function addToCart(productId: number) {
  const cart = getCart();
  const nextCart = {
    ...cart,
    [productId]: (cart[productId] || 0) + 1,
  };

  saveCart(nextCart);
  return nextCart;
}

export function changeCartQuantity(productId: number, amount: number) {
  const cart = getCart();
  const quantity = (cart[productId] || 0) + amount;
  const nextCart = { ...cart };

  if (quantity <= 0) {
    delete nextCart[productId];
  } else {
    nextCart[productId] = quantity;
  }

  saveCart(nextCart);
  return nextCart;
}

export function clearCart() {
  saveCart({});
}

export function getCartCount(cart: CartState = getCart()) {
  return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
}
