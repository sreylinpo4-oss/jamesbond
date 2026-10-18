# Floralyn Skin

Floralyn Skin is a Next.js storefront with Supabase authentication and a Supabase-backed commerce API.

## Local setup

1. Install Node.js 20.9 or later and dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project. Keep every value not prefixed with `NEXT_PUBLIC_` server-side; never commit `.env.local`.
3. Apply every SQL file in `supabase/migrations` in timestamp order, including the auth schema before the commerce backend, using the Supabase SQL editor or Supabase CLI.
4. Create or sign in to the account that should manage the store. Find its user UUID in Supabase Authentication, then promote it from the SQL editor:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = 'YOUR_AUTH_USER_UUID';
   ```

   The profile role trigger restricts role changes to the project database administrator.
5. Add real inventory quantities at **Admin → Inventory**. Seed quantities are intentionally zero, so checkout is unavailable until stock is entered.
6. Start the application:

   ```bash
   npm run dev
   ```

## Payments and scheduled cleanup

- Configure `SUPABASE_SERVICE_ROLE_KEY`, `PAYWAY_MERCHANT_ID`, and `PAYWAY_API_KEY` as server-only deployment secrets. Set `PAYWAY_ENV=sandbox` for testing; switch to `production` only with production ABA PayWay credentials.
- Set `NEXT_PUBLIC_SITE_URL` to the deployed HTTPS origin. Configure the matching origin/return URLs in the PayWay merchant portal.
- Orders reserve stock atomically when created. ABA callbacks are checked server-to-server before a payment is marked paid. Set a strong random `CRON_SECRET` and schedule an authenticated `POST` to `/api/cron/expire-orders` at least every 10 minutes, sending `Authorization: Bearer <CRON_SECRET>`, so expired unpaid orders release reserved stock.
- Test the complete payment and callback flow in PayWay sandbox before accepting live payments. The database migration and payment flow must be applied and tested against the target Supabase and ABA accounts; local builds alone do not verify them.

## Current scope

The admin dashboard reads and writes inventory, warehouse, order-status, and promotion records through authenticated Supabase endpoints. Promotion rules are stored but are not yet applied to checkout pricing. Catalog browsing still uses the storefront's bundled product list; checkout pricing and availability are independently enforced against database products and inventory.

Run `npm run lint` and `npm run build` to validate the application.
