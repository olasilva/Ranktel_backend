# Ranktel – Backend (Node.js + Express)

    cp .env.example .env     # set ADMIN_KEY, CLIENT_ORIGIN, PAYSTACK_SECRET_KEY
    npm install
    npm run dev              # http://localhost:5000

Apply all SQL files in `supabase/migrations` to the connected Supabase project.
If the project already had a `products` table, apply `003_products_data_compatibility.sql`
as well; `CREATE TABLE IF NOT EXISTS` does not add columns to an existing table.

## API
- GET  /api/config                      shipping fee, Paystack on/off, pickup location
- GET  /api/home                        new arrivals for the home page
- GET  /api/catalog?category=clothing|shoes|bags|accessories|sale&sub=&inStock=1&sort=newest|price-asc|price-desc&page=1&limit=8
- GET  /api/products/:slug              product (any catalogue slug), reviews + related (Baggi only has reviews), config
- POST /api/newsletter                  { email } (stores the subscriber; sending the 10% code/email is not wired yet)
- POST /api/reviews                     { name, location?, size?, rating, title, body }  (held until approved)
- POST /api/orders                      { items:[{slug,color,size,qty}], customer:{name,phone,email,address?,city?}, delivery:"pickup"|"ship", payment:"paystack"|"store" }
- GET  /api/orders/verify/:reference    confirms a Paystack payment and marks the order paid
- GET  /api/orders/track/:trackingId    authenticated live-tracking snapshot for the buyer
- GET  /api/orders/track/:trackingId/stream authenticated SSE stream for tracking updates
- POST /api/webhooks/paystack           set this URL in the Paystack dashboard (signature verified)
- Admin (header x-admin-key): GET /api/admin/orders, GET /api/admin/reviews, POST /api/admin/reviews/:id/approve, POST /api/admin/orders/:orderNo/status

Admin status updates accept `status`, and optionally `location: { label }`, `eta` (ISO date), and `note`.
Allowed tracking statuses are `paid`, `processing`, `ready_for_pickup`, `shipped`, `in_transit`,
`out_for_delivery`, `completed`, and `cancelled`. Buyers receive the current state and history
through the snapshot endpoint and immediately receive changes over Server-Sent Events.

## Admin and staff inventory

Set `ADMIN_EMAIL` to the Supabase email used for the admin dashboard. That account
must have `role: "admin"` in its Supabase user metadata (the email is also accepted
as the admin fallback). Staff accounts are created from the dashboard and receive
`role: "staff"` automatically. Set the Vercel frontend variable `VITE_API_URL`
to the deployed Render API origin, without a trailing slash.

Admin and staff use `/api/products` for shared inventory. Products created by an
admin are stored in Supabase and are added to the customer storefront catalogue.
Incoming customer orders are available at `/api/orders/incoming`; staff can update
their processing status at `/api/orders/:orderNo/status`.

Prices and stock are read from src/products.js on the server; the browser cannot change them.
Orders and reviews are saved in data/*.json (swap src/store.js for a real database in production).
The catalogue lives in src/products.js (add a product by adding one line). Pay at Store orders are held for 48 hours (holdUntil on the order).
Policy text, care text and the size chart in src/products.js are placeholders: replace them with Ranktel's real ones.
