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

export const TRACKING_STATUSES = [
  "Preparing",
  "Shipped",
  "In transit",
  "Out for delivery",
  "Delivered",
  "Delayed",
] as const;

export type TrackingStatus = (typeof TRACKING_STATUSES)[number];

export type OrderTrackingUpdate = {
  status: TrackingStatus;
  location: string;
  note: string;
  createdAt: string;
};

export type AdminOrder = {
  id: string;
  customer: string;
  email: string;
  date: string;
  total: number;
  status: FulfillmentStatus;
  items: string[];
  trackingUpdates: OrderTrackingUpdate[];
  paymentMethod?: string;
  paymentStatus?: string;
  discountCode?: string;
  discountCents?: number;
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
