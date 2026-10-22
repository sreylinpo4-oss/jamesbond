"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import {
  ORDER_STATUSES,
  TRACKING_STATUSES,
  type AdminOrder,
  type AdminStoreData,
  type DiscountKind,
  type DiscountRule,
  type FulfillmentStatus,
  type InventoryItem,
  type OrderTrackingUpdate,
  type TrackingStatus,
  type Warehouse,
} from "@/lib/admin-store";

type AdminSection = "overview" | "inventory" | "orders" | "pricing";

const sectionNames: Record<AdminSection, string> = {
  overview: "Overview",
  inventory: "Inventory",
  orders: "Orders & fulfillment",
  pricing: "Pricing & discounts",
};

const discountKinds: DiscountKind[] = [
  "Flash sale",
  "Tiered pricing",
  "Wholesale tier",
  "Coupon",
  "Bundle",
];

const emptyStoreData: AdminStoreData = {
  warehouses: [],
  inventory: [],
  orders: [],
  discounts: [],
};

function totalStock(item: InventoryItem) {
  return Object.values(item.stockByWarehouse).reduce((sum, quantity) => sum + quantity, 0);
}

function makeCsv(data: AdminStoreData) {
  const rows: (string | number)[][] = [
    ["sku", "name", "price", "stock", "lowStockThreshold", "warehouse"],
  ];

  data.inventory.forEach((item) => {
    data.warehouses.forEach((warehouse) => {
      rows.push([
        item.sku,
        item.name,
        item.price,
        item.stockByWarehouse[warehouse.id] ?? 0,
        item.lowStockThreshold,
        warehouse.name,
      ]);
    });
  });

  return rows
    .map((row) =>
      row
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\r\n");
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  row.push(value);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
}

function downloadBlob(content: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminPage() {
  const [data, setData] = useState<AdminStoreData>(emptyStoreData);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [activeWarehouse, setActiveWarehouse] = useState("");
  const [notice, setNotice] = useState("");
  const [newWarehouseName, setNewWarehouseName] = useState("");
  const [newWarehouseLocation, setNewWarehouseLocation] = useState("");
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>("Preparing");
  const [trackingLocation, setTrackingLocation] = useState("");
  const [trackingNote, setTrackingNote] = useState("");
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const [discountName, setDiscountName] = useState("");
  const [discountKind, setDiscountKind] = useState<DiscountKind>("Coupon");
  const [discountValue, setDiscountValue] = useState("");
  const [minimumQuantity, setMinimumQuantity] = useState("24");
  const [couponCode, setCouponCode] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const persistedData = useRef<AdminStoreData>(emptyStoreData);
  const saveRevision = useRef(0);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let isActive = true;

    async function loadStore() {
      try {
        const response = await fetch("/api/admin/store", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok || !result.data) {
          throw new Error(result.error || "Store data could not be loaded.");
        }
        if (!isActive) return;
        const loadedData = result.data as AdminStoreData;
        persistedData.current = loadedData;
        setData(loadedData);
        setActiveWarehouse(loadedData.warehouses[0]?.id ?? "");
        setLoadError("");
      } catch (error) {
        if (!isActive) return;
        setLoadError(
          error instanceof Error ? error.message : "Store data could not be loaded.",
        );
      } finally {
        if (isActive) setIsLoaded(true);
      }
    }

    void loadStore();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !hasChanges) return;

    const revision = saveRevision.current;
    const snapshot = data;
    const timer = window.setTimeout(() => {
      saveQueue.current = saveQueue.current.then(async () => {
        if (revision !== saveRevision.current) return;
        try {
          const response = await fetch("/api/admin/store", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ store: snapshot }),
          });
          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || "Store changes could not be saved.");
          }
          if (revision === saveRevision.current) {
            persistedData.current = snapshot;
            setHasChanges(false);
            setNotice("Store changes saved to the database.");
          }
        } catch (error) {
          if (revision !== saveRevision.current) return;
          setData(persistedData.current);
          setHasChanges(false);
          setNotice(
            error instanceof Error
              ? `${error.message} Your unsaved changes were reverted.`
              : "Store changes could not be saved. Your unsaved changes were reverted.",
          );
        }
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [data, hasChanges, isLoaded]);

  const lowStockItems = useMemo(
    () => data.inventory.filter((item) => totalStock(item) <= item.lowStockThreshold),
    [data.inventory],
  );
  const pendingOrders = data.orders.filter((order) => order.status === "Pending").length;
  const activeDiscounts = data.discounts.filter((discount) => discount.active).length;

  function updateStore(update: (current: AdminStoreData) => AdminStoreData) {
    const next = update(data);
    saveRevision.current += 1;
    setData(next);
    setHasChanges(true);
  }

  function setStock(productId: number, warehouseId: string, quantity: number) {
    const safeQuantity = Math.max(0, Math.floor(quantity));
    updateStore((current) => ({
      ...current,
      inventory: current.inventory.map((item) =>
        item.productId === productId
          ? {
              ...item,
              stockByWarehouse: {
                ...item.stockByWarehouse,
                [warehouseId]: safeQuantity,
              },
            }
          : item,
      ),
    }));
  }

  function setThreshold(productId: number, threshold: number) {
    updateStore((current) => ({
      ...current,
      inventory: current.inventory.map((item) =>
        item.productId === productId
          ? { ...item, lowStockThreshold: Math.max(0, Math.floor(threshold)) }
          : item,
      ),
    }));
  }

  function setOrderStatus(orderId: string, status: FulfillmentStatus) {
    updateStore((current) => ({
      ...current,
      orders: current.orders.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    }));
  }

  function toggleTrackingForm(order: AdminOrder) {
    if (trackingOrderId === order.id) {
      setTrackingOrderId(null);
      return;
    }

    setTrackingOrderId(order.id);
    setTrackingStatus(order.trackingUpdates[0]?.status ?? "Preparing");
    setTrackingLocation("");
    setTrackingNote("");
  }

  async function saveTrackingUpdate(event: FormEvent<HTMLFormElement>, order: AdminOrder) {
    event.preventDefault();
    setIsSavingTracking(true);
    try {
      const response = await fetch("/api/admin/orders/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: order.id,
          status: trackingStatus,
          location: trackingLocation,
          note: trackingNote,
        }),
      });
      const result: unknown = await response.json();
      if (!result || typeof result !== "object") {
        throw new Error("The shipment service returned an invalid response.");
      }
      const resultData = result as { error?: unknown; update?: OrderTrackingUpdate };
      const update = resultData.update;
      if (!response.ok || !update) {
        throw new Error(
          typeof resultData.error === "string"
            ? resultData.error
            : "The shipment update could not be saved.",
        );
      }

      setData((current) => {
        const next = {
          ...current,
          orders: current.orders.map((currentOrder) =>
            currentOrder.id === order.id
              ? {
                  ...currentOrder,
                  trackingUpdates: [
                    update,
                    ...currentOrder.trackingUpdates,
                  ],
                }
              : currentOrder,
          ),
        };
        persistedData.current = next;
        return next;
      });
      setTrackingOrderId(null);
      setTrackingLocation("");
      setTrackingNote("");
      setNotice(`Tracking update saved for ${order.id}.`);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "The shipment update could not be saved.",
      );
    } finally {
      setIsSavingTracking(false);
    }
  }

  function createShippingLabel(order: AdminOrder) {
    const label = [
      "FLORALYN SKIN · DEMO SHIPPING LABEL",
      `Order: ${order.id}`,
      `Recipient: ${order.customer}`,
      `Email: ${order.email}`,
      `Contents: ${order.items.join(", ")}`,
      "",
      "DEMO ONLY — this is not a carrier label or a valid shipping document.",
    ].join("\n");
    downloadBlob(label, `${order.id.toLowerCase()}-demo-label.txt`, "text/plain");
    setNotice(`Demo shipping label downloaded for ${order.id}; it is not valid for carrier use.`);
  }

  async function importWorkbook(file: File) {
    try {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setNotice("Import failed: use a CSV file. Excel-compatible CSV works; native .xlsx files are not supported here.");
        return;
      }

      const parsedRows = parseCsv(await file.text());
      const [headers, ...csvRows] = parsedRows;
      if (!headers || csvRows.length === 0) {
        setNotice("Import failed: the CSV has no product rows.");
        return;
      }

      const normalizedHeaders = headers.map((header) => header.trim().toLowerCase().replace(/^\uFEFF/, ""));
      const rows = csvRows.map((values) =>
        Object.fromEntries(normalizedHeaders.map((header, index) => [header, values[index] ?? ""])),
      );
      const findValue = (row: Record<string, string>, column: string) => {
        return row[column.toLowerCase()]?.trim() ?? "";
      };

      let imported = 0;
      const skipped: string[] = [];

      updateStore((current) => {
        const inventory = current.inventory.map((item) => ({ ...item, stockByWarehouse: { ...item.stockByWarehouse } }));
        const warehouseByName = new Map(
          current.warehouses.map((warehouse) => [warehouse.name.trim().toLowerCase(), warehouse.id]),
        );

        rows.forEach((row, index) => {
          const sku = findValue(row, "sku");
          const name = findValue(row, "name");
          const stockText = findValue(row, "stock");
          const thresholdText = findValue(row, "lowStockThreshold");
          const warehouseName = findValue(row, "warehouse");
          const item = inventory.find(
            (entry) =>
              (sku && entry.sku.toLowerCase() === sku.toLowerCase()) ||
              (name && entry.name.toLowerCase() === name.toLowerCase()),
          );

          if (!item || stockText === "" || !Number.isFinite(Number(stockText)) || Number(stockText) < 0) {
            skipped.push(`row ${index + 2}: product or non-negative stock value is invalid`);
            return;
          }

          const warehouseId = warehouseName
            ? warehouseByName.get(warehouseName.toLowerCase())
            : current.warehouses[0]?.id;
          if (!warehouseId) {
            skipped.push(`row ${index + 2}: warehouse "${warehouseName}" was not found`);
            return;
          }

          item.stockByWarehouse[warehouseId] = Math.floor(Number(stockText));
          if (thresholdText && Number.isFinite(Number(thresholdText)) && Number(thresholdText) >= 0) {
            item.lowStockThreshold = Math.floor(Number(thresholdText));
          }
          imported += 1;
        });

        return { ...current, inventory };
      });

      setNotice(
        `Imported ${imported} row${imported === 1 ? "" : "s"}.` +
          (skipped.length ? ` Skipped ${skipped.length}: ${skipped.slice(0, 3).join("; ")}.` : ""),
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `Import failed: ${error.message}`
          : "Import failed: could not read that CSV file.",
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function addWarehouse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newWarehouseName.trim();
    if (!name) return;
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${crypto.randomUUID().slice(0, 8)}`;
    const warehouse: Warehouse = {
      id,
      name,
      location: newWarehouseLocation.trim() || "New distribution location",
    };
    updateStore((current) => ({
      ...current,
      warehouses: [...current.warehouses, warehouse],
      inventory: current.inventory.map((item) => ({
        ...item,
        stockByWarehouse: { ...item.stockByWarehouse, [id]: 0 },
      })),
    }));
    setActiveWarehouse(id);
    setNewWarehouseName("");
    setNewWarehouseLocation("");
    setNotice(`${name} warehouse added with zero opening stock.`);
  }

  function addDiscount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = discountName.trim();
    const value = discountValue.trim();
    if (!name || !value) return;
    if (discountKind === "Coupon" && !couponCode.trim()) {
      setNotice("Please enter a coupon code for coupon promotions.");
      return;
    }
    const minQty = Math.max(1, Math.floor(Number(minimumQuantity) || 1));
    const rule: DiscountRule = {
      id: `rule-${crypto.randomUUID()}`,
      name,
      kind: discountKind,
      value,
      ...(["Tiered pricing", "Wholesale tier", "Bundle"].includes(discountKind) || (discountKind === "Coupon" && Number(minimumQuantity) > 1)
        ? { minimumQuantity: minQty }
        : {}),
      ...(discountKind === "Coupon" && couponCode.trim()
        ? { code: couponCode.trim().toUpperCase() }
        : {}),
      active: true,
    };
    updateStore((current) => ({ ...current, discounts: [rule, ...current.discounts] }));
    setDiscountName("");
    setDiscountValue("");
    setMinimumQuantity("24");
    setCouponCode("");
    setNotice(`${name} rule added.`);
  }

  function deleteDiscount(ruleId: string) {
    updateStore((current) => ({
      ...current,
      discounts: current.discounts.filter((rule) => rule.id !== ruleId),
    }));
    setNotice("Promotion rule removed.");
  }

  function toggleDiscount(ruleId: string) {
    updateStore((current) => ({
      ...current,
      discounts: current.discounts.map((rule) =>
        rule.id === ruleId ? { ...rule, active: !rule.active } : rule,
      ),
    }));
  }

  function exportCsv() {
    downloadBlob(`\uFEFF${makeCsv(data)}`, "floralyn-inventory.csv", "text/csv;charset=utf-8");
    setNotice("Excel-compatible inventory CSV exported.");
  }

  const selectedWarehouse = data.warehouses.find((warehouse) => warehouse.id === activeWarehouse);

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand">
          <span className="brand-mark">✳</span>
          <span>FLORALYN<small>STORE ADMIN</small></span>
        </Link>
        <div className="admin-nav-label">MANAGEMENT</div>
        <nav className="admin-nav" aria-label="Store management">
          {(Object.keys(sectionNames) as AdminSection[]).map((section) => (
            <button
              type="button"
              key={section}
              className={activeSection === section ? "admin-nav-item active" : "admin-nav-item"}
              onClick={() => setActiveSection(section)}
            >
              <span>{section === "overview" ? "⌂" : section === "inventory" ? "▦" : section === "orders" ? "↗" : "◇"}</span>
              {sectionNames[section]}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <span className="admin-online-mark" />
          Live database
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="eyebrow">FLORALYN SKIN · STORE MANAGEMENT</div>
            <h1>{sectionNames[activeSection]}</h1>
          </div>
          <div className="admin-topbar-actions">
            <Link href="/" className="text-link">View storefront ↗</Link>
            <span className="admin-avatar">FS</span>
          </div>
        </header>

        {!isLoaded ? (
          <div className="admin-demo-notice" role="status">Loading live store data…</div>
        ) : loadError ? (
          <div className="admin-demo-notice" role="alert">
            <strong>Store data unavailable</strong>
            <span>{loadError}</span>
          </div>
        ) : (
          <>
                <div className="admin-demo-notice">
              <strong>{hasChanges ? "Saving store changes…" : "Connected to store database"}</strong>
                  <span>Inventory, fulfillment, and promotion rules are saved to Supabase.</span>
            </div>

        {activeSection === "overview" && (
          <section className="admin-section">
            <div className="admin-metric-grid">
              <article className="admin-metric">
                <span>Total products</span>
                <strong>{data.inventory.length}</strong>
                <small>Tracked in the demo catalog</small>
              </article>
              <article className={lowStockItems.length ? "admin-metric warning-metric" : "admin-metric"}>
                <span>Low stock alerts</span>
                <strong>{lowStockItems.length}</strong>
                <small>{lowStockItems.length ? "Review items needing replenishment" : "All products above threshold"}</small>
              </article>
              <article className="admin-metric">
                <span>Pending orders</span>
                <strong>{pendingOrders}</strong>
                <small>Waiting for processing</small>
              </article>
              <article className="admin-metric">
                <span>Active discount rules</span>
                <strong>{activeDiscounts}</strong>
                <small>Across coupons, tiers and offers</small>
              </article>
            </div>

            <div className="admin-content-grid">
              <article className="admin-panel">
                <div className="admin-panel-heading">
                  <div>
                    <span className="mini-label">ATTENTION NEEDED</span>
                    <h2>Low stock alerts</h2>
                  </div>
                  <button type="button" className="admin-link-button" onClick={() => setActiveSection("inventory")}>Manage stock ↗</button>
                </div>
                {lowStockItems.length ? (
                  <div className="admin-alert-list">
                    {lowStockItems.map((item) => (
                      <div className="admin-alert-row" key={item.productId}>
                        <span className="alert-dot" />
                        <div><strong>{item.name}</strong><small>{item.sku}</small></div>
                        <span className="stock-badge critical">{totalStock(item)} left</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="admin-empty-inline">No products are below their alert threshold.</p>
                )}
              </article>

              <article className="admin-panel">
                <div className="admin-panel-heading">
                  <div>
                    <span className="mini-label">FULFILLMENT</span>
                    <h2>Latest orders</h2>
                  </div>
                  <button type="button" className="admin-link-button" onClick={() => setActiveSection("orders")}>View all ↗</button>
                </div>
                <div className="admin-simple-list">
                  {data.orders.slice(0, 4).map((order) => (
                    <div className="admin-simple-row" key={order.id}>
                      <div><strong>{order.id}</strong><small>{order.customer}</small></div>
                      <span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span>
                      <strong>${order.total.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <article className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="mini-label">WAREHOUSE NETWORK</span>
                  <h2>Stock by location</h2>
                </div>
                <button type="button" className="admin-link-button" onClick={() => setActiveSection("inventory")}>Manage locations ↗</button>
              </div>
              <div className="warehouse-card-grid">
                {data.warehouses.map((warehouse) => {
                  const stockCount = data.inventory.reduce(
                    (sum, item) => sum + (item.stockByWarehouse[warehouse.id] ?? 0),
                    0,
                  );
                  return (
                    <div className="warehouse-card" key={warehouse.id}>
                      <span className="warehouse-flower">✿</span>
                      <strong>{warehouse.name}</strong>
                      <small>{warehouse.location}</small>
                      <span>{stockCount} total units</span>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>
        )}

        {activeSection === "inventory" && (
          <section className="admin-section">
            <div className="admin-toolbar">
              <div>
                <span className="mini-label">INVENTORY & STOCK MANAGEMENT</span>
                <p>Update counts by warehouse, set alert levels, or import a workbook.</p>
              </div>
              <div className="admin-toolbar-actions">
                <button type="button" className="admin-button secondary" onClick={exportCsv}>Export CSV / Excel</button>
                <button type="button" className="admin-button primary" onClick={() => fileInputRef.current?.click()}>Import CSV / Excel</button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="visually-hidden"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (file) void importWorkbook(file);
                  }}
                />
              </div>
            </div>

            <article className="admin-panel warehouse-manager">
              <div className="admin-panel-heading">
                <div>
                  <span className="mini-label">MULTI-WAREHOUSE</span>
                  <h2>Locations</h2>
                </div>
                <label className="warehouse-select-label">
                  Editing stock at
                  <select value={activeWarehouse} onChange={(event) => setActiveWarehouse(event.target.value)}>
                    {data.warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                  </select>
                </label>
              </div>
              <form className="warehouse-add-form" onSubmit={addWarehouse}>
                <input value={newWarehouseName} onChange={(event) => setNewWarehouseName(event.target.value)} placeholder="New warehouse name" aria-label="New warehouse name" required />
                <input value={newWarehouseLocation} onChange={(event) => setNewWarehouseLocation(event.target.value)} placeholder="Location / notes" aria-label="Warehouse location notes" />
                <button className="admin-button secondary" type="submit">Add location</button>
              </form>
            </article>

            <article className="admin-panel table-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="mini-label">PRODUCT CATALOG</span>
                  <h2>{selectedWarehouse?.name ?? "Warehouse"} stock</h2>
                </div>
                <span className="admin-result-count">{data.inventory.length} products</span>
              </div>
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr><th>Product</th><th>SKU</th><th>Unit price</th><th>Stock here</th><th>All locations</th><th>Alert at</th><th>Health</th></tr>
                  </thead>
                  <tbody>
                    {data.inventory.map((item) => {
                      const stockHere = item.stockByWarehouse[activeWarehouse] ?? 0;
                      const low = totalStock(item) <= item.lowStockThreshold;
                      return (
                        <tr key={item.productId}>
                          <td><strong>{item.name}</strong></td>
                          <td>{item.sku}</td>
                          <td>${item.price.toFixed(2)}</td>
                          <td><input className="table-number-input" type="number" min="0" value={stockHere} aria-label={`${item.name} stock at ${selectedWarehouse?.name}`} onChange={(event) => setStock(item.productId, activeWarehouse, Number(event.target.value))} /></td>
                          <td>{totalStock(item)}</td>
                          <td><input className="table-number-input threshold-input" type="number" min="0" value={item.lowStockThreshold} aria-label={`${item.name} low stock threshold`} onChange={(event) => setThreshold(item.productId, Number(event.target.value))} /></td>
                          <td><span className={low ? "stock-badge critical" : "stock-badge healthy"}>{low ? "Low stock" : "In stock"}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </article>

            <p className="admin-help-note">
              Import columns: <code>sku</code>, <code>name</code>, <code>stock</code>, and optional <code>warehouse</code> and <code>lowStockThreshold</code>. Prices in the export are informational and are not changed by import. CSV opens in Excel; native <code>.xlsx</code> import/export is not enabled.
            </p>
          </section>
        )}

        {activeSection === "orders" && (
          <section className="admin-section">
            <div className="admin-toolbar">
              <div>
                <span className="mini-label">ORDER & FULFILLMENT MANAGEMENT</span>
                <p>Update each shipment&apos;s status and location for customers to see in their account.</p>
              </div>
              <span className="admin-result-count">{data.orders.length} orders</span>
            </div>
            <article className="admin-panel table-panel">
              <div className="admin-table-scroll">
                <table className="admin-table order-admin-table">
                  <thead>
                    <tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Fulfillment &amp; tracking</th></tr>
                  </thead>
                  <tbody>
                    {data.orders.map((order) => (
                      <tr key={order.id}>
                        <td><strong>{order.id}</strong></td>
                        <td><strong>{order.customer}</strong><small className="table-subtext">{order.email}</small></td>
                        <td>{order.date}</td>
                        <td>{order.items.join(", ")}</td>
                        <td>
                          <strong>${order.total.toFixed(2)}</strong>
                          {order.discountCode && (
                            <small className="table-subtext" style={{ color: "#2d6a4f", display: "block" }}>Promo: {order.discountCode}</small>
                          )}
                          {order.paymentStatus && (
                            <small className="table-subtext" style={{ display: "block" }}>{order.paymentStatus}</small>
                          )}
                        </td>
                        <td><span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span></td>
                        <td>
                          <div className="fulfillment-actions">
                            {order.status === "Cancelled" ? (
                              <span className="status-pill status-cancelled">Cancelled</span>
                            ) : (
                              <select value={order.status} onChange={(event) => setOrderStatus(order.id, event.target.value as FulfillmentStatus)} aria-label={`Update ${order.id} status`}>
                                {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                              </select>
                            )}
                            <button type="button" className="admin-button secondary label-button" onClick={() => createShippingLabel(order)}>Shipping label</button>
                            <div className="tracking-admin">
                              {order.trackingUpdates[0] ? (
                                <p>
                                  <strong>{order.trackingUpdates[0].status}</strong>
                                  <span>{order.trackingUpdates[0].location}</span>
                                  <time dateTime={order.trackingUpdates[0].createdAt}>
                                    {new Date(order.trackingUpdates[0].createdAt).toLocaleString()}
                                  </time>
                                </p>
                              ) : (
                                <p className="tracking-admin-empty">No shipment updates yet</p>
                              )}
                              <button
                                type="button"
                                className="admin-button secondary label-button"
                                onClick={() => toggleTrackingForm(order)}
                              >
                                {trackingOrderId === order.id ? "Close tracking form" : "Update location"}
                              </button>
                              {trackingOrderId === order.id && (
                                <form
                                  className="tracking-update-form"
                                  onSubmit={(event) => void saveTrackingUpdate(event, order)}
                                >
                                  <label>
                                    Shipment status
                                    <select
                                      value={trackingStatus}
                                      onChange={(event) =>
                                        setTrackingStatus(event.target.value as TrackingStatus)
                                      }
                                    >
                                      {TRACKING_STATUSES.map((status) => (
                                        <option key={status} value={status}>{status}</option>
                                      ))}
                                    </select>
                                  </label>
                                  <label>
                                    Current location
                                    <input
                                      value={trackingLocation}
                                      onChange={(event) => setTrackingLocation(event.target.value)}
                                      maxLength={160}
                                      placeholder="e.g. Phnom Penh sorting center"
                                      required
                                    />
                                  </label>
                                  <label>
                                    Note for customer (optional)
                                    <textarea
                                      value={trackingNote}
                                      onChange={(event) => setTrackingNote(event.target.value)}
                                      maxLength={500}
                                      rows={2}
                                      placeholder="Add a short delivery update"
                                    />
                                  </label>
                                  <button
                                    type="submit"
                                    className="admin-button primary"
                                    disabled={isSavingTracking}
                                  >
                                    {isSavingTracking ? "Saving update…" : "Publish update"}
                                  </button>
                                </form>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
            <p className="admin-help-note">Shipment updates are entered manually and appear in the customer&apos;s account order history. Shipping label files are demo-only and are not accepted by carriers.</p>
          </section>
        )}

        {activeSection === "pricing" && (
          <section className="admin-section">
            <div className="admin-toolbar">
              <div>
                <span className="mini-label">PRICING & DISCOUNT RULES</span>
                <p>Manage flash sales, wholesale tiers, coupon codes, and bundles.</p>
              </div>
            </div>

            <div className="pricing-layout">
              <article className="admin-panel">
                <div className="admin-panel-heading">
                  <div><span className="mini-label">CURRENT RULES</span><h2>Offers & pricing</h2></div>
                </div>
                <div className="discount-list">
                  {data.discounts.map((rule) => (
                    <div className="discount-row" key={rule.id}>
                      <div className="discount-icon">{rule.kind === "Coupon" ? "%" : rule.kind === "Bundle" ? "✿" : rule.kind === "Flash sale" ? "✦" : "◇"}</div>
                      <div className="discount-info">
                        <strong>{rule.name}</strong>
                        <span>
                          {rule.kind}
                          {rule.minimumQuantity ? ` · ${rule.minimumQuantity}+ items` : ""}
                          {rule.code ? ` · Code ${rule.code}` : ""}
                        </span>
                      </div>
                      <strong className="discount-value">{rule.value}</strong>
                      <div className="discount-row-actions">
                        <button type="button" className={rule.active ? "rule-toggle active" : "rule-toggle"} onClick={() => toggleDiscount(rule.id)}>
                          {rule.active ? "Active" : "Paused"}
                        </button>
                        <button
                          type="button"
                          className="rule-delete-btn"
                          onClick={() => deleteDiscount(rule.id)}
                          title="Delete promotion"
                          aria-label={`Delete ${rule.name}`}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="admin-panel">
                <div className="admin-panel-heading">
                  <div><span className="mini-label">CREATE A RULE</span><h2>New promotion</h2></div>
                </div>
                <form className="discount-form" onSubmit={addDiscount}>
                  <label>
                    Promotion name
                    <input value={discountName} onChange={(event) => setDiscountName(event.target.value)} placeholder="e.g. Autumn glow event" required />
                  </label>
                  <label>
                    Rule type
                    <select value={discountKind} onChange={(event) => setDiscountKind(event.target.value as DiscountKind)}>
                      {discountKinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
                    </select>
                  </label>
                  {discountKind === "Coupon" && (
                    <label>
                      Coupon code
                      <input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="GARDEN15" required />
                    </label>
                  )}
                  {(["Wholesale tier", "Tiered pricing", "Coupon", "Bundle"].includes(discountKind)) && (
                    <label>
                      Minimum items in bag {discountKind === "Coupon" ? "(optional)" : ""}
                      <input type="number" min="1" value={minimumQuantity} onChange={(event) => setMinimumQuantity(event.target.value)} placeholder="1" />
                    </label>
                  )}
                  <label>
                    Discount / offer
                    <input value={discountValue} onChange={(event) => setDiscountValue(event.target.value)} placeholder="e.g. 15% off or $5 off" required />
                  </label>
                  <button type="submit" className="admin-button primary">Add pricing rule</button>
                </form>
              </article>
            </div>

            <div className="admin-feature-note">
              <span>✳</span>
              <div>
                <strong>Active promotions apply to customer checkout.</strong>
                <p>Saved coupon codes and promotion rules are validated in real-time during bag review, order placement, and PayWay checkout settlement.</p>
              </div>
            </div>
          </section>
        )}
          </>
        )}

        {notice && (
          <div className="admin-toast" role="status">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message">×</button>
          </div>
        )}
      </section>
    </main>
  );
}
