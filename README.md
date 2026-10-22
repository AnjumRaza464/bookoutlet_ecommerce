# BNB Book Outlet

An online bookstore for Matric (Classes 9–10) and Intermediate (Classes 11–12) textbooks, guides, notes and past papers in Pakistan.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · Prisma 7 · Neon PostgreSQL · Vitest · Vercel

## Features

**Storefront**
- Homepage modelled on the reference brand's layout: contact bar, logo and search, category navbar, hero slider, intro, shop-by-class cards, category range, featured books, stats strip, discount banner, new arrivals and a boards list.
- Catalogue with search and filters for class, level, category, board, subject, publisher, price and in-stock, plus sorting and pagination.
- Book detail pages with stock status, quantity picker, wishlist and related books.
- Cart stored in the browser and always re-priced by the server. Coupons, and free delivery over Rs. 3,000.
- Checkout with saved Pakistani addresses (province list, 03XXXXXXXXX mobile validation, 5-digit postal code).
- Customer accounts: registration, login, profile, password change, address book, order history, order detail and payment, and cancelling unpaid pending orders.
- Public order tracking by order number plus the mobile number used at checkout.
- SEO: per-page metadata, canonical URLs, `sitemap.xml`, `robots.txt`, Open Graph image, Product/BookStore JSON-LD. Images are optimised (AVIF/WebP).

**Payments**
- **Easypaisa (online):** Mobile Account REST flow (`initiate-ma-transaction`, then `inquire-transaction`). An order is marked **paid only after a server-side inquiry** confirms `PAID` for the same order ID and the exact amount. There is also an IPN endpoint protected by a secret key. If credentials are not set, this option is shown as *Unavailable* and cannot be selected.
- **Manual Easypaisa transfer:** clearly labelled as manual. The customer sends money to the store account and submits the TID. Staff approve or reject it in the admin panel.
- **Cash on Delivery:** staff mark the cash as collected.
- No payment is ever simulated.

**Admin dashboard (`/admin`, STAFF and ADMIN roles)**
- Dashboard KPIs, recent orders and low-stock alerts.
- Books: list and search, inline price/discount/stock/visibility edits, full editor, create, delete (books with sales are archived instead).
- Inventory: low-stock and out-of-stock views, stock value.
- Categories, subjects, boards and publishers: full CRUD; deletion is blocked while books still use them.
- Discounts: per-book discount % and coupon codes (percent/fixed, minimum order, usage limits, date window).
- Orders: filters, status workflow with allowed transitions only, courier and tracking number, manual payment review, Easypaisa re-verification, COD collection, refunds. Cancelling returns stock.
- Customers: spend and order counts. Role changes and account disabling are ADMIN only.
- Sales reports: daily chart, top books, breakdowns by payment method, class and province, and CSV export.

**Security**
- Database-backed sessions: a random token in an httpOnly, SameSite=Lax, Secure cookie, with only its SHA-256 hash stored. Passwords use bcrypt (cost 12).
- Role-based access is checked in every admin page and Route Handler. `proxy.ts` is only an early redirect, not the real check.
- Same-origin check on every state-changing API request. All input is validated with Zod. Order lookups return 404 to anyone who isn't the owner.
- All prices, coupons and shipping are calculated on the server from the database. Stock is reserved atomically (`UPDATE … WHERE stock >= qty`) inside a transaction, so concurrent checkouts can't oversell.
- Rate limiting on login, registration, tracking and payment endpoints (per instance), security headers, and CSV formula-injection protection.

## Local setup

Requirements: Node.js 20+ and a Neon PostgreSQL database.

```bash
npm install                      # also runs `prisma generate`
cp .env.example .env             # fill in DATABASE_URL, DIRECT_URL, ADMIN_* (already done in this repo's .env)
npm run db:deploy                # apply migrations (or `npm run db:migrate` while developing)
npm run db:seed                  # boards, subjects, categories, publishers, sample books, coupons, admin user
npm run dev                      # http://localhost:3000
```

Sign in at `/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` to reach `/admin`. Change the password from **My account** after the first login.

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop, build, serve |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm test` | Unit tests (pricing, validation, Easypaisa client and verification, catalogue, reports) |
| `npm run test:db` | Integration tests against the database: stock reservation, concurrent checkout, coupons, cancellation and restock, manual payment review |
| `npm run db:migrate` | Create and apply a migration in development |
| `npm run db:deploy` | Apply pending migrations (production) |
| `npm run db:seed` | Seed data (safe to re-run) |
| `npm run db:studio` | Prisma Studio |

## Deploying to Vercel + Neon

1. Push the repository to GitHub, GitLab or Bitbucket and import it in Vercel. The framework is detected as Next.js.
2. In **Project → Settings → Environment Variables**, add every variable from `.env.example`:
   - `DATABASE_URL`: the Neon **pooled** URL. `DIRECT_URL`: the Neon **direct** URL.
   - `NEXT_PUBLIC_SITE_URL`: your production domain, e.g. `https://bnbbookoutlet.pk`.
   - `EASYPAISA_IPN_SECRET`: a long random string.
   - The Easypaisa and manual-transfer values.
   - Tip: point **Preview** deployments at a separate Neon branch so previews never migrate or touch production data.
3. Deploy. Vercel runs the `vercel-build` script automatically: `prisma generate && prisma migrate deploy && next build`. Migrations therefore apply on every deploy.
4. Seed once against production, from your machine with the production env vars: `npm run db:seed`.
5. Add your domain in Vercel and update `NEXT_PUBLIC_SITE_URL`.

The `/api/payments/easypaisa/initiate` function sets `maxDuration = 120`, because the Easypaisa MA call waits for the customer to approve on their phone. On the Vercel Hobby plan, check that your function duration limit allows this.

## Enabling Easypaisa online payments

1. Apply for an Easypaisa merchant (Easypay) account and request **REST API (MA transactions)** integration. Easypaisa issues a **Store ID**, **API username/password**, your **merchant account number**, and the integration guide with sandbox and production endpoints.
2. Set `EASYPAISA_STORE_ID`, `EASYPAISA_USERNAME`, `EASYPAISA_PASSWORD` and `EASYPAISA_ACCOUNT_NUM`. Keep `EASYPAISA_ENV=sandbox` until sandbox testing passes, then switch to `production`.
3. Compare the endpoint paths and field names in `src/lib/easypaisa.ts` against the guide Easypaisa gives you. The client uses `/v4/initiate-ma-transaction` and `/v4/inquire-transaction` with a Base64 `Credentials` header. If your guide uses a different base URL, set `EASYPAISA_API_BASE_URL`.
4. Give Easypaisa your IPN URL: `https://<domain>/api/payments/easypaisa/ipn?key=<EASYPAISA_IPN_SECRET>`.
5. Run a sandbox payment end to end. Then check the admin order page: the payment record shows the gateway response, and the order becomes **Paid** only after the inquiry confirms it.

Until then, checkout offers **Manual Easypaisa transfer** (set `MANUAL_EASYPAISA_ACCOUNT_NUMBER` / `MANUAL_EASYPAISA_ACCOUNT_TITLE` to your real account) and **Cash on Delivery**.

## Project structure

```
prisma/                 schema, migrations, seed
src/app/(store)/        storefront pages (home, books, cart, checkout, account, track, …)
src/app/admin/          admin dashboard
src/app/api/            Route Handlers (auth, cart, orders, payments, wishlist, admin/*)
src/lib/                db, auth, pricing, orders, easypaisa, catalog, validation, reports
src/components/         UI (brand, layout, books, cart, admin, shadcn ui)
src/proxy.ts            early auth redirects for /account, /checkout, /admin
tests/                  Vitest unit and DB integration tests
```

## Notes

- The seed creates sample catalogue entries with generated typographic covers. Replace prices, stock and descriptions with your real data, and add cover image URLs from your own or authorised photos. Supported hosts are Cloudinary, Vercel Blob, Unsplash and Imgur, plus `IMAGE_HOSTS`.
- Contact details, phone numbers and social links in `src/lib/constants.ts` and the footer are placeholders. Update them before launch.
- The rate limiter is in-memory per server instance. For strict limits across regions, back it with Upstash Redis.
