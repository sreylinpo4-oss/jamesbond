"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";

import {
  defaultAdminData,
  getAdminDataSnapshot,
  ORDER_STATUSES,
  saveAdminData,
  subscribeToAdminData,
  type AdminOrder,
  type AdminStoreData,
  type DiscountKind,
  type DiscountRule,
  type FulfillmentStatus,
  type InventoryItem,
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
  const data = useSyncExternalStore(
    subscribeToAdminData,
    getAdminDataSnapshot,
    () => defaultAdminData,
  );
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [activeWarehouse, setActiveWarehouse] = useState("phnom-penh");
  const [notice, setNotice] = useState("");
  const [newWarehouseName, setNewWarehouseName] = useState("");
  const [newWarehouseLocation, setNewWarehouseLocation] = useState("");
  const [discountName, setDiscountName] = useState("");
  const [discountKind, setDiscountKind] = useState<DiscountKind>("Coupon");
  const [discountValue, setDiscountValue] = useState("");
  const [minimumQuantity, setMinimumQuantity] = useState("24");
  const [couponCode, setCouponCode] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lowStockItems = useMemo(
    () => data.inventory.filter((item) => totalStock(item) <= item.lowStockThreshold),
    [data.inventory],
  );
  const pendingOrders = data.orders.filter((order) => order.status === "Pending").length;
  const activeDiscounts = data.discounts.filter((discount) => discount.active).length;

  function updateStore(update: (current: AdminStoreData) => AdminStoreData) {
    const next = update(data);
    saveAdminData(next);
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
          const priceText = findValue(row, "price");
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
          if (priceText && Number.isFinite(Number(priceText)) && Number(priceText) >= 0) {
            item.price = Number(priceText);
          }
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
    } catch {
      setNotice("Import failed: could not read that CSV file.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function addWarehouse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newWarehouseName.trim();
    if (!name) return;
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
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
    const rule: DiscountRule = {
      id: `rule-${Date.now()}`,
      name,
      kind: discountKind,
      value,
      ...(["Tiered pricing", "Wholesale tier"].includes(discountKind)
        ? { minimumQuantity: Math.max(1, Math.floor(Number(minimumQuantity) || 1)) }
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
    setNotice(`${name} rule added. It is saved only in this browser demo.`);
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
          Demo data stored in this browser
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

        <div className="admin-demo-notice">
          <strong>Prototype admin panel</strong>
          <span>Changes are saved to this browser only. Connect a secure backend before using real stock, customer orders, discounts, or fulfillment.</span>
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
              Import columns: <code>sku</code>, <code>name</code>, <code>stock</code>, and optional <code>warehouse</code>, <code>price</code>, <code>lowStockThreshold</code>. Stock values replace the count for that product and warehouse. CSV opens in Excel; native <code>.xlsx</code> import/export is not enabled.
            </p>
          </section>
        )}

        {activeSection === "orders" && (
          <section className="admin-section">
            <div className="admin-toolbar">
              <div>
                <span className="mini-label">ORDER & FULFILLMENT MANAGEMENT</span>
                <p>Track the order lifecycle and prepare demo shipping documents.</p>
              </div>
              <span className="admin-result-count">{data.orders.length} demo orders</span>
            </div>
            <article className="admin-panel table-panel">
              <div className="admin-table-scroll">
                <table className="admin-table order-admin-table">
                  <thead>
                    <tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Fulfillment</th></tr>
                  </thead>
                  <tbody>
                    {data.orders.map((order) => (
                      <tr key={order.id}>
                        <td><strong>{order.id}</strong></td>
                        <td><strong>{order.customer}</strong><small className="table-subtext">{order.email}</small></td>
                        <td>{order.date}</td>
                        <td>{order.items.join(", ")}</td>
                        <td>${order.total.toFixed(2)}</td>
                        <td><span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span></td>
                        <td>
                          <div className="fulfillment-actions">
                            <select value={order.status} onChange={(event) => setOrderStatus(order.id, event.target.value as FulfillmentStatus)} aria-label={`Update ${order.id} status`}>
                              {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                            </select>
                            <button type="button" className="admin-button secondary label-button" onClick={() => createShippingLabel(order)}>Shipping label</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
            <p className="admin-help-note">Shipping label files are clearly marked demo-only and are not accepted by carriers. Real fulfillment needs a shipping provider integration.</p>
          </section>
        )}

        {activeSection === "pricing" && (
          <section className="admin-section">
            <div className="admin-toolbar">
              <div>
                <span className="mini-label">PRICING & DISCOUNT RULES</span>
                <p>Manage demo flash sales, wholesale tiers, coupon codes, and bundles.</p>
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
                      <button type="button" className={rule.active ? "rule-toggle active" : "rule-toggle"} onClick={() => toggleDiscount(rule.id)}>
                        {rule.active ? "Active" : "Paused"}
                      </button>
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
                  {(["Wholesale tier", "Tiered pricing"].includes(discountKind)) && (
                    <label>
                      Minimum quantity for this tier
                      <input type="number" min="1" value={minimumQuantity} onChange={(event) => setMinimumQuantity(event.target.value)} placeholder="24" />
                    </label>
                  )}
                  <label>
                    Discount / offer
                    <input value={discountValue} onChange={(event) => setDiscountValue(event.target.value)} placeholder="e.g. 15% off or $5 off" required />
                  </label>
                  {discountKind === "Coupon" && (
                    <label>
                      Coupon code
                      <input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="GARDEN15" />
                    </label>
                  )}
                  <button type="submit" className="admin-button primary">Add pricing rule</button>
                </form>
              </article>
            </div>

            <div className="admin-feature-note">
              <span>✳</span>
              <div><strong>Pricing is a storefront demo.</strong><p>Rules are saved locally here and do not change live checkout prices, coupon validation, or wholesale eligibility.</p></div>
            </div>
          </section>
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
