-- Migration: 20261021000000_promotions_and_discounts.sql
-- Add discount support to orders and provide atomic discount validation

alter table public.orders
  add column if not exists discount_cents integer not null default 0 check (discount_cents >= 0),
  add column if not exists discount_code text;

do $$
declare
  r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.orders'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%total_cents = subtotal_cents + shipping_cents%'
  loop
    execute format('alter table public.orders drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.orders drop constraint if exists orders_total_cents_check;
alter table public.orders add constraint orders_total_cents_check
  check (total_cents = subtotal_cents + shipping_cents - discount_cents and total_cents >= 0);

-- Insert starter promo codes if no discounts exist yet
insert into public.discounts (id, name, kind, value, code, minimum_quantity, active)
values
  ('promo-bloom10', 'Flora VIP 10% Off', 'Coupon', '10%', 'BLOOM10', 1, true),
  ('promo-welcome10', 'Welcome 10% Off', 'Coupon', '10%', 'WELCOME10', 1, true),
  ('promo-glow15', 'Glow Ritual 15% Off', 'Coupon', '15%', 'GLOW15', 2, true),
  ('promo-bundle5', 'Botanical Duo $5 Off', 'Bundle', '$5.00', null, 2, true)
on conflict (id) do nothing;

create or replace function public.validate_discount_code(
  p_code text,
  p_subtotal_cents integer,
  p_item_count integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_discount public.discounts%rowtype;
  v_discount_cents integer := 0;
begin
  if p_code is null or trim(p_code) = '' then
    return jsonb_build_object('valid', false, 'message', 'Please enter a promo code.');
  end if;

  select * into v_discount
  from public.discounts
  where active = true
    and upper(code) = upper(trim(p_code))
  limit 1;

  if not found then
    return jsonb_build_object('valid', false, 'message', 'Promo code is invalid or has expired.');
  end if;

  if p_item_count = 0 then
    return jsonb_build_object(
      'valid', true,
      'code', v_discount.code,
      'name', v_discount.name,
      'kind', v_discount.kind,
      'value', v_discount.value,
      'discount_cents', 0,
      'message', format('%s applied! Discount will calculate when items are in your bag.', v_discount.name)
    );
  end if;

  if v_discount.minimum_quantity is not null and p_item_count < v_discount.minimum_quantity then
    return jsonb_build_object(
      'valid', false,
      'requirement_not_met', true,
      'message', format('This code requires at least %s item(s) in your bag.', v_discount.minimum_quantity)
    );
  end if;

  if v_discount.value like '%!%%' escape '!' then
    v_discount_cents := round(p_subtotal_cents * (trim(trailing '%' from v_discount.value)::numeric / 100.0));
  else
    v_discount_cents := round(trim(leading '$' from v_discount.value)::numeric * 100);
  end if;
  v_discount_cents := least(p_subtotal_cents, greatest(0, coalesce(v_discount_cents, 0)));

  return jsonb_build_object(
    'valid', true,
    'code', v_discount.code,
    'name', v_discount.name,
    'kind', v_discount.kind,
    'value', v_discount.value,
    'discount_cents', v_discount_cents,
    'message', format('%s applied (-$%s)', v_discount.name, trim(to_char(v_discount_cents / 100.0, 'FM999990.00')))
  );
end;
$$;

revoke all on function public.validate_discount_code(text, integer, integer) from public;
grant execute on function public.validate_discount_code(text, integer, integer) to anon, authenticated;

-- Update create_store_order to accept and enforce discount codes
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
  p_delivery_notes text,
  p_discount_code text default null
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
  v_total_quantity integer := 0;
  v_shipping integer;
  v_subtotal bigint := 0;
  v_discount_cents integer := 0;
  v_discount_code text := null;
  v_discount public.discounts%rowtype;
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
      'subtotal_cents', v_order.subtotal_cents,
      'discount_cents', v_order.discount_cents,
      'discount_code', v_order.discount_code,
      'shipping_cents', v_order.shipping_cents,
      'total_cents', v_order.total_cents,
      'payment_method', v_order.payment_method,
      'payment_status', v_order.payment_status
    );
  end if;

  select count(*), count(distinct product_id), coalesce(sum(quantity), 0)
    into v_item_count,
      v_available,
      v_total_quantity
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
    currency, subtotal_cents, shipping_cents, total_cents, discount_cents, discount_code,
    customer_name, customer_email, customer_phone, address_line1, address_line2, city,
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
    0, v_shipping, v_shipping, 0, null, trim(p_customer_name), v_email,
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
      'subtotal_cents', v_order.subtotal_cents,
      'discount_cents', v_order.discount_cents,
      'discount_code', v_order.discount_code,
      'shipping_cents', v_order.shipping_cents,
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

  -- Apply promotion / discount if specified or active
  if p_discount_code is not null and trim(p_discount_code) <> '' then
    select * into v_discount
    from public.discounts
    where active = true
      and upper(code) = upper(trim(p_discount_code))
    limit 1;

    if not found then
      raise exception 'Invalid or expired discount code' using errcode = '22023';
    end if;

    if v_discount.minimum_quantity is not null and v_total_quantity < v_discount.minimum_quantity then
      raise exception 'A minimum of % items is required for discount code %', v_discount.minimum_quantity, v_discount.code using errcode = '22023';
    end if;

    v_discount_code := v_discount.code;
    if v_discount.value like '%!%%' escape '!' then
      v_discount_cents := round(v_subtotal * (trim(trailing '%' from v_discount.value)::numeric / 100.0));
    else
      v_discount_cents := round(trim(leading '$' from v_discount.value)::numeric * 100);
    end if;
  else
    -- Check for automatic discounts (Flash sale or Bundle)
    select * into v_discount
    from public.discounts
    where active = true
      and kind in ('Flash sale', 'Tiered pricing', 'Bundle')
      and (minimum_quantity is null or v_total_quantity >= minimum_quantity)
    order by case when kind = 'Flash sale' then 1 when kind = 'Tiered pricing' then 2 else 3 end
    limit 1;

    if found then
      v_discount_code := coalesce(v_discount.code, v_discount.name);
      if v_discount.value like '%!%%' escape '!' then
        v_discount_cents := round(v_subtotal * (trim(trailing '%' from v_discount.value)::numeric / 100.0));
      else
        v_discount_cents := round(trim(leading '$' from v_discount.value)::numeric * 100);
      end if;
    end if;
  end if;

  v_discount_cents := least(v_subtotal, greatest(0, coalesce(v_discount_cents, 0)));

  update public.orders
  set subtotal_cents = v_subtotal,
      discount_cents = v_discount_cents,
      discount_code = v_discount_code,
      total_cents = v_subtotal + v_shipping - v_discount_cents,
      updated_at = now()
  where id = v_order_id
  returning * into v_order;

  return jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'subtotal_cents', v_order.subtotal_cents,
    'discount_cents', v_order.discount_cents,
    'discount_code', v_order.discount_code,
    'shipping_cents', v_order.shipping_cents,
    'total_cents', v_order.total_cents,
    'payment_method', v_order.payment_method,
    'payment_status', v_order.payment_status
  );
end;
$$;

revoke all on function public.create_store_order(jsonb, uuid, text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.create_store_order(jsonb, uuid, text, text, text, text, text, text, text, text, text, text) to authenticated;

notify pgrst, 'reload schema';
