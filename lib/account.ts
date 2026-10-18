export type AccountProfile = {
  fullName: string;
  email: string;
  phone: string;
  provider: "Email" | "Phone" | "Google" | "Facebook" | "Apple";
};

export type StoredAddress = {
  id: string;
  label: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  country: string;
  postalCode: string;
};

export type StoredPaymentMethod = {
  id: string;
  label: string;
  brand: string;
  last4: string;
  expiry: string;
  type: "Card" | "Digital wallet";
};

export type NotificationPreference = {
  key: "sms" | "email" | "push";
  label: string;
  enabled: boolean;
};

const PROFILE_KEY = "floralyn-account-profile";
const PROFILE_CHANGE_EVENT = "floralyn:account-profile-change";

export const demoAddresses: StoredAddress[] = [
  {
    id: "home",
    label: "Home",
    name: "Nadia Smith",
    line1: "16 Lotus Lane",
    city: "Phnom Penh",
    country: "Cambodia",
    postalCode: "12000",
  },
  {
    id: "work",
    label: "Office",
    name: "Nadia Smith",
    line1: "88 Riverfront Avenue",
    line2: "Unit 4A",
    city: "Phnom Penh",
    country: "Cambodia",
    postalCode: "12205",
  },
];

export const demoPaymentMethods: StoredPaymentMethod[] = [
  {
    id: "visa-1",
    label: "Primary card",
    brand: "Visa",
    last4: "4242",
    expiry: "08/28",
    type: "Card",
  },
  {
    id: "aba-1",
    label: "ABA wallet",
    brand: "ABA KHQR",
    last4: "QR",
    expiry: "—",
    type: "Digital wallet",
  },
];

export const defaultProfile: AccountProfile = {
  fullName: "Nadia Smith",
  email: "nadiasmith@example.com",
  phone: "+855 12 345 678",
  provider: "Email",
};

export function getAccountProfile(): AccountProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(PROFILE_KEY);
    return parseAccountProfile(saved);
  } catch {
    return null;
  }
}

export function parseAccountProfile(saved: string | null): AccountProfile | null {
  if (!saved) return null;

  try {
    return JSON.parse(saved) as AccountProfile;
  } catch {
    return null;
  }
}

export function subscribeAccountProfile(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PROFILE_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PROFILE_CHANGE_EVENT, onStoreChange);
  };
}

export function getAccountProfileSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PROFILE_KEY);
}

export function saveAccountProfile(profile: AccountProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event(PROFILE_CHANGE_EVENT));
}

export function clearAccountProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PROFILE_KEY);
  window.dispatchEvent(new Event(PROFILE_CHANGE_EVENT));
}

export function getNotificationPreferences(): NotificationPreference[] {
  const defaults: NotificationPreference[] = [
    { key: "sms", label: "SMS alerts", enabled: true },
    { key: "email", label: "Email updates", enabled: true },
    { key: "push", label: "Push reminders", enabled: false },
  ];

  if (typeof window === "undefined") return defaults;

  try {
    const saved = window.localStorage.getItem("floralyn-notifications");
    if (!saved) return defaults;

    const parsed = JSON.parse(saved) as NotificationPreference[];
    return parsed.length ? parsed : defaults;
  } catch {
    return defaults;
  }
}

export function saveNotificationPreferences(preferences: NotificationPreference[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("floralyn-notifications", JSON.stringify(preferences));
}
