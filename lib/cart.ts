const CART_KEY = "floralyn-cart";

export type CartState = Record<number, number>;

export function getCart(): CartState {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const saved = window.localStorage.getItem(CART_KEY);
    return saved ? (JSON.parse(saved) as CartState) : {};
  } catch {
    return {};
  }
}

export function saveCart(cart: CartState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
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
