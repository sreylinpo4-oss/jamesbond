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
  | "Cancelled";

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

export const ORDER_STATUSES: Exclude<FulfillmentStatus, "Cancelled">[] = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
];
