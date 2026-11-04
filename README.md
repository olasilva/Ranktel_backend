# Ranktel – Backend (Node.js + Express)

    cp .env.example .env     # set ADMIN_KEY, CLIENT_ORIGIN, PAYSTACK_SECRET_KEY
    npm install
    npm run dev              # http://localhost:5000

## API
- GET  /api/config                      shipping fee, Paystack on/off, pickup location
- GET  /api/home                        new arrivals for the home page
- GET  /api/catalog?category=clothing|shoes|bags|accessories|sale&sub=&inStock=1&sort=newest|price-asc|price-desc&page=1&limit=8
- GET  /api/products/:slug              product (any catalogue slug), reviews + related (Baggi only has reviews), config
- POST /api/newsletter                  { email } (stores the subscriber; sending the 10% code/email is not wired yet)
- POST /api/reviews                     { name, location?, size?, rating, title, body }  (held until approved)
- POST /api/orders                      { items:[{slug,color,size,qty}], customer:{name,phone,email,address?,city?}, delivery:"pickup"|"ship", payment:"paystack"|"store" }
- GET  /api/orders/verify/:reference    confirms a Paystack payment and marks the order paid
- POST /api/webhooks/paystack           set this URL in the Paystack dashboard (signature verified)
- Admin (header x-admin-key): GET /api/admin/orders, GET /api/admin/reviews, POST /api/admin/reviews/:id/approve, POST /api/admin/orders/:orderNo/status

Prices and stock are read from src/products.js on the server; the browser cannot change them.
Orders and reviews are saved in data/*.json (swap src/store.js for a real database in production).
The catalogue lives in src/products.js (add a product by adding one line). Pay at Store orders are held for 48 hours (holdUntil on the order).
Policy text, care text and the size chart in src/products.js are placeholders: replace them with Ranktel's real ones.
