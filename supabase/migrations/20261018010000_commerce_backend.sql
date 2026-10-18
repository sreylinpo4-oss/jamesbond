create table if not exists public.products (
  id integer primary key,
  name text not null,
  category text not null,
  sku text not null unique,
  price_cents integer not null check (price_cents >= 0),
  description text not null,
  detail text not null,
  image_url text not null,
  tag text not null,
  benefits text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.warehouses (
  id text primary key,
  name text not null,
  location text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory (
  product_id integer not null references public.products(id) on delete restrict,
  warehouse_id text not null references public.warehouses(id) on delete restrict,
  quantity integer not null default 0 check (quantity >= 0),
  low_stock_threshold integer not null default 0 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now(),
  primary key (product_id, warehouse_id)
);

create table if not exists public.store_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  idempotency_key uuid not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method text not null
    check (payment_method in ('aba_payway', 'cash_on_delivery')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'cancelled', 'refunded', 'cod_due')),
  payment_transaction_id text unique,
  currency text not null default 'USD' check (currency in ('USD', 'KHR')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null check (shipping_cents >= 0),
  total_cents integer not null check (total_cents = subtotal_cents + shipping_cents),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  address_line1 text not null,
  address_line2 text not null default '',
  city text not null,
  postal_code text not null default '',
  country text not null,
  delivery_notes text not null default '',
  payment_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id integer not null references public.products(id) on delete restrict,
  sku text not null,
  product_name text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0 and quantity <= 99),
  line_total_cents integer generated always as (unit_price_cents * quantity) stored
);

create table if not exists public.inventory_movements (
  id bigint generated always as identity primary key,
  product_id integer not null references public.products(id) on delete restrict,
  warehouse_id text not null references public.warehouses(id) on delete restrict,
  order_id uuid references public.orders(id) on delete set null,
  changed_by uuid references auth.users(id) on delete set null,
  quantity_delta integer not null check (quantity_delta <> 0),
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.discounts (
  id text primary key,
  name text not null,
  kind text not null check (
    kind in ('Flash sale', 'Tiered pricing', 'Wholesale tier', 'Coupon', 'Bundle')
  ),
  value text not null,
  code text unique,
  minimum_quantity integer check (minimum_quantity is null or minimum_quantity > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);
create index if not exists orders_status_created_idx
  on public.orders (status, created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists inventory_movements_product_created_idx
  on public.inventory_movements (product_id, created_at desc);
create index if not exists discounts_active_idx on public.discounts (active);

insert into public.warehouses (id, name, location)
values ('main', 'Main warehouse', 'Primary fulfillment location')
on conflict (id) do nothing;

insert into public.store_settings (key, value)
values
  ('shipping_cents', '800'::jsonb),
  ('currency', '"USD"'::jsonb)
on conflict (key) do nothing;

insert into public.products
  (id, name, category, sku, price_cents, description, detail, image_url, tag, benefits)
values
  (1, 'Dew Drop Serum', 'Serums', 'FL-001', 2800,
   'A lightweight glow-boosting daily serum.',
   'A silky, fast-absorbing serum that floods skin with hydration and gives you that fresh, dewy finish without heaviness.',
   'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=85',
   'BESTSELLER', array['Plumps skin', 'Deep hydration', 'Soft-focus glow']),
  (2, 'Cloud Milk Cleanser', 'Cleansers', 'FL-002', 2200,
   'A gentle, creamy cleanse for every morning.',
   'A soft, milky cleanser that melts away the day while staying comforting and balanced for sensitive skin.',
   'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=800&q=85',
   'DAILY ESSENTIAL', array['Non-stripping', 'Barrier-friendly', 'Morning reset']),
  (3, 'Petal Soft Moisturizer', 'Moisturizers', 'FL-003', 3200,
   'Comforting moisture with a soft, dewy finish.',
   'Nourishing and lightweight enough for daily wear, this cream leaves skin soft, calm, and comfortable all day long.',
   'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=85',
   'CUSTOMER LOVE', array['Comforting moisture', 'Velvety finish', 'Everyday balance']),
  (4, 'Green Garden Face Oil', 'Serums', 'FL-004', 3500,
   'A silky finishing oil for your evening ritual.',
   'A grounding blend of botanical oils that seals in hydration and leaves skin feeling lush, nourished, and rested.',
   'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=85',
   'BOTANICAL BLEND', array['Seals in moisture', 'Radiant finish', 'Evening ritual']),
  (5, 'Rosewater Mist', 'Essentials', 'FL-005', 1800,
   'A refreshing facial mist for a little reset.',
   'A delicate spray that refreshes, hydrates, and brings a moment of calm to your skin between steps or throughout the day.',
   'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=800&q=85',
   'FRESH PICK', array['Instant refresh', 'Hydration boost', 'Travel-friendly']),
  (6, 'Velvet Night Cream', 'Moisturizers', 'FL-006', 3800,
   'A rich night cream for your bedtime routine.',
   'This rich overnight cream supports skin while you rest, helping you wake up comfortable, smooth, and beautifully rested.',
   'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?auto=format&fit=crop&w=800&q=85',
   'NIGHT RITUAL', array['Overnight repair', 'Silky texture', 'Restorative comfort'])
on conflict (id) do nothing;

insert into public.inventory (product_id, warehouse_id, quantity, low_stock_threshold)
select id, 'main', 0, 12 from public.products
on conflict (product_id, warehouse_id) do nothing;

create or replace function public.is_store_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_store_admin() from public, anon;
grant execute on function public.is_store_admin() to authenticated;

alter table public.products enable row level security;
alter table public.warehouses enable row level security;
alter table public.inventory enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.discounts enable row level security;

drop policy if exists "Active products are public" on public.products;
create policy "Active products are public"
  on public.products for select to anon, authenticated using (active);
drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
  on public.products for all to authenticated
  using (public.is_store_admin()) with check (public.is_store_admin());

drop policy if exists "Admins manage warehouses" on public.warehouses;
create policy "Admins manage warehouses"
  on public.warehouses for all to authenticated
  using (public.is_store_admin()) with check (public.is_store_admin());

drop policy if exists "Admins manage inventory" on public.inventory;
create policy "Admins manage inventory"
  on public.inventory for all to authenticated
  using (public.is_store_admin()) with check (public.is_store_admin());

drop policy if exists "Admins manage store settings" on public.store_settings;
create policy "Admins manage store settings"
  on public.store_settings for all to authenticated
  using (public.is_store_admin()) with check (public.is_store_admin());

drop policy if exists "Customers and admins view orders" on public.orders;
create policy "Customers and admins view orders"
  on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or public.is_store_admin());
drop policy if exists "Admins update orders" on public.orders;
create policy "Admins update orders"
  on public.orders for update to authenticated
  using (public.is_store_admin()) with check (public.is_store_admin());

drop policy if exists "Customers and admins view order items" on public.order_items;
create policy "Customers and admins view order items"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and (orders.user_id = (select auth.uid()) or public.is_store_admin())
    )
  );

drop policy if exists "Admins view inventory movements" on public.inventory_movements;
create policy "Admins view inventory movements"
  on public.inventory_movements for select to authenticated
  using (public.is_store_admin());
drop policy if exists "Admins create inventory movements" on public.inventory_movements;
create policy "Admins create inventory movements"
  on public.inventory_movements for insert to authenticated
  with check (public.is_store_admin() and changed_by = (select auth.uid()));

drop policy if exists "Admins manage discounts" on public.discounts;
create policy "Admins manage discounts"
  on public.discounts for all to authenticated
  using (public.is_store_admin()) with check (public.is_store_admin());

create or replace function public.prevent_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and coalesce(auth.role(), '') <> 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'Modifying user role is restricted';
  end if;
  return new;
end;
$$;

create or replace function public.set_store_admin(p_user_id uuid, p_is_admin boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'Only the service role can change store administrator access'
      using errcode = '42501';
  end if;

  update public.profiles
  set role = case when p_is_admin then 'admin' else 'customer' end
  where id = p_user_id;

  if not found then
    raise exception 'Profile not found';
  end if;
end;
$$;

revoke all on function public.set_store_admin(uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.set_store_admin(uuid, boolean) to service_role;

create or replace function public.sync_admin_store(p_store jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry jsonb;
  v_stock jsonb;
  v_warehouse_id text;
  v_product_id integer;
  v_quantity integer;
  v_threshold integer;
  v_price_cents integer;
  v_previous_quantity integer;
  v_order_status text;
  v_current_order_status text;
  v_payment_status text;
begin
  if not public.is_store_admin() then
    raise exception 'Store administrator access required' using errcode = '42501';
  end if;
  if p_store is null
     or jsonb_typeof(p_store->'warehouses') <> 'array'
     or jsonb_typeof(p_store->'inventory') <> 'array'
     or jsonb_typeof(p_store->'orders') <> 'array'
     or jsonb_typeof(p_store->'discounts') <> 'array'
     or jsonb_array_length(p_store->'warehouses') > 100
     or jsonb_array_length(p_store->'inventory') > 1000
     or jsonb_array_length(p_store->'orders') > 10000
     or jsonb_array_length(p_store->'discounts') > 1000 then
    raise exception 'Invalid store data' using errcode = '22023';
  end if;

  for v_entry in select value from jsonb_array_elements(p_store->'warehouses')
  loop
    v_warehouse_id := v_entry->>'id';
    if v_warehouse_id is null or v_warehouse_id !~ '^[a-z0-9-]{1,80}$'
       or nullif(trim(v_entry->>'name'), '') is null
       or length(v_entry->>'name') > 120 then
      raise exception 'Invalid warehouse details' using errcode = '22023';
    end if;

    insert into public.warehouses (id, name, location, active)
    values (
      v_warehouse_id,
      trim(v_entry->>'name'),
      left(coalesce(v_entry->>'location', ''), 160),
      true
    )
    on conflict (id) do update
    set name = excluded.name, location = excluded.location, active = true;
  end loop;

  insert into public.inventory (product_id, warehouse_id)
  select product.id, warehouse.id
  from public.products as product
  cross join public.warehouses as warehouse
  where warehouse.active
  on conflict (product_id, warehouse_id) do nothing;

  for v_entry in select value from jsonb_array_elements(p_store->'inventory')
  loop
    v_product_id := (v_entry->>'productId')::integer;
    v_price_cents := round((v_entry->>'price')::numeric * 100)::integer;
    v_threshold := (v_entry->>'lowStockThreshold')::integer;
    if v_price_cents < 0 or v_price_cents > 100000000
       or v_threshold < 0 or v_threshold > 10000000
       or jsonb_typeof(v_entry->'stockByWarehouse') <> 'object' then
      raise exception 'Invalid product inventory values' using errcode = '22023';
    end if;

    update public.products set price_cents = v_price_cents, updated_at = now()
    where id = v_product_id;
    if not found then
      raise exception 'Product not found' using errcode = '22023';
    end if;

    for v_warehouse_id, v_stock in
      select key, value
      from jsonb_each(v_entry->'stockByWarehouse')
    loop
      v_quantity := (v_stock #>> '{}')::integer;
      if v_quantity < 0 or v_quantity > 10000000 then
        raise exception 'Invalid stock quantity' using errcode = '22023';
      end if;

      select quantity into v_previous_quantity
      from public.inventory
      where product_id = v_product_id and warehouse_id = v_warehouse_id
      for update;
      if not found then
        raise exception 'Inventory warehouse not found' using errcode = '22023';
      end if;

      update public.inventory
      set quantity = v_quantity,
          low_stock_threshold = v_threshold,
          updated_at = now()
      where product_id = v_product_id and warehouse_id = v_warehouse_id;

      if v_previous_quantity <> v_quantity then
        insert into public.inventory_movements (
          product_id, warehouse_id, changed_by, quantity_delta, reason
        )
        values (
          v_product_id, v_warehouse_id, auth.uid(),
          v_quantity - v_previous_quantity, 'Admin inventory adjustment'
        );
      end if;
    end loop;
  end loop;

  for v_entry in select value from jsonb_array_elements(p_store->'orders')
  loop
    v_order_status := lower(v_entry->>'status');
    if v_order_status not in ('pending', 'processing', 'shipped', 'delivered', 'cancelled') then
      raise exception 'Invalid order status' using errcode = '22023';
    end if;

    select status, payment_status
    into v_current_order_status, v_payment_status
    from public.orders
    where order_number = v_entry->>'id'
    for update;

    if found then
      if v_order_status in ('processing', 'shipped', 'delivered')
         and v_payment_status not in ('paid', 'cod_due') then
        raise exception 'An unpaid order cannot be fulfilled' using errcode = '22023';
      end if;
      if (v_current_order_status in ('cancelled', 'delivered')
            and v_order_status <> v_current_order_status)
         or (v_order_status = 'cancelled'
            and v_current_order_status <> 'cancelled')
         or (v_current_order_status = 'pending'
            and v_order_status not in ('pending', 'processing'))
         or (v_current_order_status = 'processing'
            and v_order_status not in ('processing', 'shipped'))
         or (v_current_order_status = 'shipped'
            and v_order_status not in ('shipped', 'delivered')) then
        raise exception 'Invalid order status transition' using errcode = '22023';
      end if;

      update public.orders
      set status = v_order_status, updated_at = now()
      where order_number = v_entry->>'id';
    end if;
  end loop;

  for v_entry in select value from jsonb_array_elements(p_store->'discounts')
  loop
    if v_entry->>'kind' not in (
      'Flash sale', 'Tiered pricing', 'Wholesale tier', 'Coupon', 'Bundle'
    ) or nullif(trim(v_entry->>'name'), '') is null
       or nullif(trim(v_entry->>'value'), '') is null then
      raise exception 'Invalid discount rule' using errcode = '22023';
    end if;

    insert into public.discounts (
      id, name, kind, value, code, minimum_quantity, active, updated_at
    )
    values (
      v_entry->>'id',
      left(trim(v_entry->>'name'), 120),
      v_entry->>'kind',
      left(trim(v_entry->>'value'), 80),
      nullif(upper(trim(v_entry->>'code')), ''),
      nullif(v_entry->>'minimumQuantity', '')::integer,
      coalesce((v_entry->>'active')::boolean, false),
      now()
    )
    on conflict (id) do update
    set name = excluded.name,
        kind = excluded.kind,
        value = excluded.value,
        code = excluded.code,
        minimum_quantity = excluded.minimum_quantity,
        active = excluded.active,
        updated_at = now();
  end loop;
end;
$$;

revoke all on function public.sync_admin_store(jsonb)
  from public, anon;
grant execute on function public.sync_admin_store(jsonb) to authenticated;

create or replace function public.create_store_order(
  p_items jsonb,
  p_idempotency_key uuid,
  p_payment_method text,
  p_customer_name text,
  p_customer_phone text,
  p_address_line1 text,
  p_address_line2 text,
  p_city text,
  p_postal_code text,
  p_country text,
  p_delivery_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_item_count integer;
  v_shipping integer;
  v_subtotal bigint := 0;
  v_order_id uuid;
  v_order_number text := 'FL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  v_item record;
  v_product public.products%rowtype;
  v_available bigint;
  v_remaining integer;
  v_stock record;
  v_order public.orders%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_payment_method not in ('aba_payway', 'cash_on_delivery') then
    raise exception 'Unsupported payment method' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 50 then
    raise exception 'The bag must contain between 1 and 50 products' using errcode = '22023';
  end if;
  if p_customer_name is null or length(trim(p_customer_name)) not between 2 and 120
     or p_customer_phone is null or length(trim(p_customer_phone)) not between 6 and 24
     or p_address_line1 is null or length(trim(p_address_line1)) not between 3 and 200
     or p_city is null or length(trim(p_city)) not between 2 and 100
     or p_country is null or length(trim(p_country)) not between 2 and 100 then
    raise exception 'Delivery information is incomplete or invalid' using errcode = '22023';
  end if;

  select email into v_email from auth.users where id = v_user_id;
  if v_email is null then
    raise exception 'A verified account email is required' using errcode = '22023';
  end if;

  select * into v_order
  from public.orders
  where user_id = v_user_id and idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object(
      'id', v_order.id,
      'order_number', v_order.order_number,
      'total_cents', v_order.total_cents,
      'payment_method', v_order.payment_method,
      'payment_status', v_order.payment_status
    );
  end if;

  select count(*), count(distinct product_id)
    into v_item_count,
      v_available
  from jsonb_to_recordset(p_items) as item(product_id integer, quantity integer);
  if v_item_count = 0 or v_item_count <> v_available then
    raise exception 'Bag contains duplicate or invalid product entries' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_items) as item(product_id integer, quantity integer)
    where product_id is null or quantity is null or quantity < 1 or quantity > 99
  ) then
    raise exception 'Product quantities must be between 1 and 99' using errcode = '22023';
  end if;

  select coalesce((value #>> '{}')::integer, 800) into v_shipping
  from public.store_settings where key = 'shipping_cents';
  v_shipping := coalesce(v_shipping, 800);

  insert into public.orders (
    order_number, user_id, idempotency_key, status, payment_method, payment_status,
    payment_transaction_id,
    currency, subtotal_cents, shipping_cents, total_cents, customer_name,
    customer_email, customer_phone, address_line1, address_line2, city,
    postal_code, country, delivery_notes
  )
  values (
    v_order_number,
    v_user_id, p_idempotency_key, 'pending', p_payment_method,
    case when p_payment_method = 'cash_on_delivery' then 'cod_due' else 'pending' end,
    case when p_payment_method = 'aba_payway'
      then v_order_number
      else null end,
    coalesce((select value #>> '{}' from public.store_settings where key = 'currency'), 'USD'),
    0, v_shipping, v_shipping, trim(p_customer_name), v_email,
    trim(p_customer_phone), trim(p_address_line1), coalesce(trim(p_address_line2), ''),
    trim(p_city), coalesce(trim(p_postal_code), ''), trim(p_country),
    left(coalesce(trim(p_delivery_notes), ''), 1000)
  )
  on conflict (user_id, idempotency_key) do nothing
  returning id, order_number into v_order_id, v_order_number;

  if v_order_id is null then
    select * into v_order from public.orders
    where user_id = v_user_id and idempotency_key = p_idempotency_key;
    return jsonb_build_object(
      'id', v_order.id,
      'order_number', v_order.order_number,
      'total_cents', v_order.total_cents,
      'payment_method', v_order.payment_method,
      'payment_status', v_order.payment_status
    );
  end if;

  for v_item in
    select product_id, quantity
    from jsonb_to_recordset(p_items) as item(product_id integer, quantity integer)
    order by product_id
  loop
    select * into v_product
    from public.products
    where id = v_item.product_id and active
    for share;
    if not found then
      raise exception 'A selected product is no longer available' using errcode = '22023';
    end if;

    perform 1 from public.inventory
    where product_id = v_item.product_id
    order by warehouse_id
    for update;

    select coalesce(sum(quantity), 0) into v_available
    from public.inventory where product_id = v_item.product_id;
    if v_available < v_item.quantity then
      raise exception 'Insufficient stock for %', v_product.name using errcode = 'P0001';
    end if;

    insert into public.order_items (
      order_id, product_id, sku, product_name, unit_price_cents, quantity
    )
    values (
      v_order_id, v_product.id, v_product.sku, v_product.name,
      v_product.price_cents, v_item.quantity
    );
    v_subtotal := v_subtotal + (v_product.price_cents::bigint * v_item.quantity);

    v_remaining := v_item.quantity;
    for v_stock in
      select warehouse_id, quantity
      from public.inventory
      where product_id = v_item.product_id and quantity > 0
      order by warehouse_id
      for update
    loop
      exit when v_remaining <= 0;
      update public.inventory
      set quantity = quantity - least(quantity, v_remaining),
          updated_at = now()
      where product_id = v_item.product_id
        and warehouse_id = v_stock.warehouse_id;
      insert into public.inventory_movements (
        product_id, warehouse_id, order_id, quantity_delta, reason
      )
      values (
        v_item.product_id, v_stock.warehouse_id, v_order_id,
        -least(v_stock.quantity, v_remaining), 'Order stock reservation'
      );
      v_remaining := v_remaining - least(v_stock.quantity, v_remaining);
    end loop;
  end loop;

  update public.orders
  set subtotal_cents = v_subtotal,
      total_cents = v_subtotal + v_shipping,
      updated_at = now()
  where id = v_order_id
  returning * into v_order;

  return jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'total_cents', v_order.total_cents,
    'payment_method', v_order.payment_method,
    'payment_status', v_order.payment_status
  );
end;
$$;

create or replace function public.finalize_payway_order(
  p_transaction_id text,
  p_gateway_status text,
  p_paid_cents integer,
  p_payment_reference text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_movement record;
begin
  select * into v_order
  from public.orders
  where payment_transaction_id = p_transaction_id
  for update;

  if not found or v_order.payment_method <> 'aba_payway' then
    return false;
  end if;

  if v_order.payment_status in ('paid', 'failed', 'cancelled', 'refunded') then
    return v_order.payment_status = 'paid'
      and p_gateway_status = 'APPROVED'
      and v_order.total_cents = p_paid_cents;
  end if;

  if p_gateway_status = 'APPROVED' and v_order.total_cents = p_paid_cents then
    update public.orders
    set status = 'processing',
        payment_status = 'paid',
        payment_reference = left(coalesce(p_payment_reference, ''), 100),
        paid_at = now(),
        updated_at = now()
    where id = v_order.id;
    return true;
  end if;

  if p_gateway_status not in ('APPROVED', 'PENDING') then
    update public.orders
    set status = 'cancelled',
        payment_status = case
          when p_gateway_status = 'CANCELLED' then 'cancelled'
          else 'failed'
        end,
        updated_at = now()
    where id = v_order.id;

    for v_movement in
      select product_id, warehouse_id, -sum(quantity_delta)::integer as quantity
      from public.inventory_movements
      where order_id = v_order.id and quantity_delta < 0
      group by product_id, warehouse_id
    loop
      update public.inventory
      set quantity = quantity + v_movement.quantity,
          updated_at = now()
      where product_id = v_movement.product_id
        and warehouse_id = v_movement.warehouse_id;
      insert into public.inventory_movements (
        product_id, warehouse_id, order_id, quantity_delta, reason
      )
      values (
        v_movement.product_id, v_movement.warehouse_id, v_order.id,
        v_movement.quantity, 'Release unpaid order stock'
      );
    end loop;
    return false;
  end if;

  update public.orders
  set payment_status = 'failed',
      status = 'cancelled',
      updated_at = now()
  where id = v_order.id;
  return false;
end;
$$;

create or replace function public.expire_unpaid_store_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_movement record;
  v_expired integer := 0;
begin
  for v_order in
    select * from public.orders
    where payment_method = 'aba_payway'
      and payment_status = 'pending'
      and created_at < now() - interval '30 minutes'
    order by created_at
    for update skip locked
  loop
    update public.orders
    set status = 'cancelled',
        payment_status = 'cancelled',
        updated_at = now()
    where id = v_order.id;

    for v_movement in
      select product_id, warehouse_id, -sum(quantity_delta)::integer as quantity
      from public.inventory_movements
      where order_id = v_order.id and quantity_delta < 0
      group by product_id, warehouse_id
    loop
      update public.inventory
      set quantity = quantity + v_movement.quantity,
          updated_at = now()
      where product_id = v_movement.product_id
        and warehouse_id = v_movement.warehouse_id;
      insert into public.inventory_movements (
        product_id, warehouse_id, order_id, quantity_delta, reason
      )
      values (
        v_movement.product_id, v_movement.warehouse_id, v_order.id,
        v_movement.quantity, 'Release expired payment reservation'
      );
    end loop;

    v_expired := v_expired + 1;
  end loop;
  return v_expired;
end;
$$;

revoke all on function public.create_store_order(
  jsonb, uuid, text, text, text, text, text, text, text, text, text
) from public, anon;
grant execute on function public.create_store_order(
  jsonb, uuid, text, text, text, text, text, text, text, text, text
) to authenticated;
revoke all on function public.finalize_payway_order(text, text, integer, text)
  from public, anon, authenticated;
revoke all on function public.expire_unpaid_store_orders()
  from public, anon, authenticated;
grant execute on function public.finalize_payway_order(text, text, integer, text)
  to service_role;
grant execute on function public.expire_unpaid_store_orders()
  to service_role;

grant select on public.products to anon, authenticated;
grant select, insert, update, delete on public.products, public.warehouses,
  public.inventory, public.store_settings to authenticated;
grant select on public.orders, public.order_items to authenticated;
revoke update on public.orders from authenticated;
grant update (status) on public.orders to authenticated;
grant select, insert on public.inventory_movements to authenticated;
grant select, insert, update, delete on public.discounts to authenticated;
