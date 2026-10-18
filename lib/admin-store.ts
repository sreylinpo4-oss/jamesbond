import { products } from "@/lib/products";

export type Warehouse = {
  id: string;
  name: string;
  location: string;
};

export type InventoryItem = {
  productId: number;
  sku: string;
  name: string;
  price: number;
  lowStockThreshold: number;
  stockByWarehouse: Record<string, number>;
};

export type FulfillmentStatus =
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Refunded";

export type AdminOrder = {
  id: string;
  customer: string;
  email: string;
  date: string;
  total: number;
  status: FulfillmentStatus;
  items: string[];
};

export type DiscountKind =
  | "Flash sale"
  | "Tiered pricing"
  | "Wholesale tier"
  | "Coupon"
  | "Bundle";

export type DiscountRule = {
  id: string;
  name: string;
  kind: DiscountKind;
  value: string;
  code?: string;
  minimumQuantity?: number;
  active: boolean;
};

export type AdminStoreData = {
  warehouses: Warehouse[];
  inventory: InventoryItem[];
  orders: AdminOrder[];
  discounts: DiscountRule[];
};

export const ORDER_STATUSES: FulfillmentStatus[] = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Refunded",
];

export const defaultAdminData: AdminStoreData = {
  warehouses: [
    { id: "phnom-penh", name: "Phnom Penh", location: "Central fulfillment" },
    { id: "siem-reap", name: "Siem Reap", location: "North distribution" },
    { id: "battambang", name: "Battambang", location: "West stockroom" },
  ],
  inventory: products.map((product, index) => ({
    productId: product.id,
    sku: `FL-${String(product.id).padStart(3, "0")}`,
    name: product.name,
    price: product.price,
    lowStockThreshold: 12,
    stockByWarehouse: {
      "phnom-penh": [8, 32, 17, 5, 21, 14][index],
      "siem-reap": [4, 10, 8, 3, 7, 5][index],
      battambang: [2, 6, 4, 1, 5, 3][index],
    },
  })),
  orders: [
    {
      id: "FL-2407",
      customer: "Nadia Smith",
      email: "nadiasmith@example.com",
      date: "2026-10-16",
      total: 46,
      status: "Processing",
      items: ["Dew Drop Serum × 1", "Rosewater Mist × 1"],
    },
    {
      id: "FL-2406",
      customer: "Amara Lee",
      email: "amara@example.com",
      date: "2026-10-15",
      total: 64,
      status: "Pending",
      items: ["Petal Soft Moisturizer × 2"],
    },
    {
      id: "FL-2405",
      customer: "Sokha Chan",
      email: "sokha@example.com",
      date: "2026-10-14",
      total: 57,
      status: "Shipped",
      items: ["Green Garden Face Oil × 1", "Velvet Night Cream × 1"],
    },
    {
      id: "FL-2404",
      customer: "Mina Park",
      email: "mina@example.com",
      date: "2026-10-12",
      total: 22,
      status: "Delivered",
      items: ["Cloud Milk Cleanser × 1"],
    },
    {
      id: "FL-2403",
      customer: "Lina Vann",
      email: "lina@example.com",
      date: "2026-10-10",
      total: 35,
      status: "Cancelled",
      items: ["Green Garden Face Oil × 1"],
    },
  ],
  discounts: [
    { id: "rule-flash", name: "Weekend botanical glow", kind: "Flash sale", value: "15% off", active: true },
    { id: "rule-wholesale", name: "Wholesale · 24+ items", kind: "Wholesale tier", value: "20% off", minimumQuantity: 24, active: true },
    { id: "rule-tiered", name: "Ritual restock · 6+ items", kind: "Tiered pricing", value: "8% off", minimumQuantity: 6, active: true },
    { id: "rule-coupon", name: "First ritual welcome", kind: "Coupon", value: "10% off", code: "BLOOM10", active: true },
    { id: "rule-bundle", name: "Dew + Cloud routine", kind: "Bundle", value: "$5 off together", active: false },
  ],
};

const ADMIN_DATA_KEY = "floralyn-admin-store";
let clientSnapshot = defaultAdminData;
let hasReadClientSnapshot = false;
const adminStoreListeners = new Set<() => void>();

export function readAdminData(): AdminStoreData {
  if (typeof window === "undefined") return defaultAdminData;

  try {
    const saved = window.localStorage.getItem(ADMIN_DATA_KEY);
    if (!saved) return defaultAdminData;
    return JSON.parse(saved) as AdminStoreData;
  } catch {
    return defaultAdminData;
  }
}

export function getAdminDataSnapshot(): AdminStoreData {
  if (typeof window === "undefined") return defaultAdminData;
  if (!hasReadClientSnapshot) {
    clientSnapshot = readAdminData();
    hasReadClientSnapshot = true;
  }
  return clientSnapshot;
}

export function subscribeToAdminData(listener: () => void) {
  adminStoreListeners.add(listener);
  return () => adminStoreListeners.delete(listener);
}

export function saveAdminData(data: AdminStoreData) {
  if (typeof window === "undefined") return;
  clientSnapshot = data;
  hasReadClientSnapshot = true;
  window.localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(data));
  adminStoreListeners.forEach((listener) => listener());
}
