create table if not exists public.order_tracking_updates (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null check (
    status in (
      'Preparing',
      'Shipped',
      'In transit',
      'Out for delivery',
      'Delivered',
      'Delayed'
    )
  ),
  location text not null check (char_length(location) between 1 and 160),
  note text not null default '' check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists order_tracking_updates_order_created_idx
  on public.order_tracking_updates (order_id, created_at desc);

alter table public.order_tracking_updates enable row level security;

drop policy if exists "Customers and admins view order tracking" on public.order_tracking_updates;
create policy "Customers and admins view order tracking"
  on public.order_tracking_updates for select to authenticated
  using (
    exists (
      select 1
      from public.orders
      where orders.id = order_tracking_updates.order_id
        and (
          orders.user_id = (select auth.uid())
          or public.is_store_admin()
        )
    )
  );

drop policy if exists "Admins create order tracking updates" on public.order_tracking_updates;
create policy "Admins create order tracking updates"
  on public.order_tracking_updates for insert to authenticated
  with check (public.is_store_admin());

grant select, insert on public.order_tracking_updates to authenticated;
grant usage, select on sequence public.order_tracking_updates_id_seq to authenticated;

notify pgrst, 'reload schema';
