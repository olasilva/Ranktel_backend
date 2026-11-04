import { Router } from 'express';
import crypto from 'node:crypto';
import { MAIN, LOOK, ALIKE, ARRIVALS, CATALOG, SUBS, SEED_REVIEWS, getProduct, pub, stateOf } from './products.js';
import { add, update, list, find } from './store.js';
import * as v from './validate.js';
import * as paystack from './paystack.js';

const r = Router();
const shippingFee = () => Number(process.env.SHIPPING_FEE || 0);
const origin = () => (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0];
const adminOnly = (req, res, next) => (process.env.ADMIN_KEY && req.get('x-admin-key') === process.env.ADMIN_KEY ? next() : res.status(401).json({ error: 'Unauthorized' }));
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

r.get('/health', (_req, res) => res.json({ ok: true }));

const cfg = () => ({ shippingFee: shippingFee(), paystack: paystack.paystackEnabled(), pickup: 'Kurudu, Abuja FCT' });
r.get('/config', (_req, res) => res.json(cfg()));
r.get('/home', (_req, res) => res.json({ arrivals: ARRIVALS }));

r.get('/catalog', (req, res) => {
  const cat = String(req.query.category || 'clothing');
  if (!['clothing', 'shoes', 'bags', 'accessories', 'sale'].includes(cat)) return res.status(400).json({ error: 'Unknown category' });
  const all = (cat === 'sale' ? CATALOG.filter((i) => i.compareAt) : CATALOG.filter((i) => i.category === cat));
  const sub = String(req.query.sub || '');
  let rows = all.filter((i) => (!sub || i.sub === sub) && (req.query.inStock !== '1' || stateOf(i) !== 'out'));
  const sort = String(req.query.sort || 'newest');
  rows = [...rows].sort(sort === 'price-asc' ? (a, b) => a.price - b.price : sort === 'price-desc' ? (a, b) => b.price - a.price : (a, b) => b.drop - a.drop);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 1), 24);
  const pages = Math.max(Math.ceil(rows.length / limit), 1);
  const page = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), pages);
  const subs = (SUBS[cat] || []).map(([id, label]) => ({ id, label, count: all.filter((i) => i.sub === id).length })).filter((s) => s.count > 0);
  res.json({ items: rows.slice((page - 1) * limit, page * limit).map(pub), total: rows.length, categoryTotal: all.length, page, pages, subs });
});

r.get('/products/:slug', wrap(async (req, res) => {
  const product = getProduct(req.params.slug);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.slug !== MAIN.slug) {
    const same = CATALOG.filter((i) => i.category === CATALOG.find((x) => x.slug === product.slug).category && i.slug !== product.slug).slice(0, 4);
    return res.json({ product, reviews: [], related: { alike: same.map((i) => ({ slug: i.slug, tag: i.kicker, series: i.spec || '', name: i.name, price: i.price, img: i.img })) }, config: cfg() });
  }
  const stored = (await list('reviews')).filter((x) => x.approved);
  const reviews = [...stored, ...SEED_REVIEWS].sort((a, b) => b.createdAt - a.createdAt || 0).slice(0, 9);
  res.json({ product, reviews, related: { look: LOOK, alike: ALIKE }, config: cfg() });
}));

r.post('/newsletter', wrap(async (req, res) => {
  const { data, error } = v.email(req.body?.email);
  if (error) return res.status(400).json({ error });
  if (!(await find('subscribers', (x) => x.email === data))) await add('subscribers', { email: data });
  res.status(201).json({ ok: true, message: 'You are on the list. Watch your inbox for private drops.' });
}));

r.post('/reviews', wrap(async (req, res) => {
  const { data, error } = v.review(req.body);
  if (error) return res.status(400).json({ error });
  await add('reviews', { ...data, verified: false, approved: false });
  res.status(201).json({ ok: true, message: 'Thank you. Your appraisal will appear once approved.' });
}));

r.post('/orders', wrap(async (req, res) => {
  const { data, error } = v.order(req.body, shippingFee());
  if (error) return res.status(400).json({ error });
  if (data.payment === 'paystack' && !paystack.paystackEnabled()) return res.status(503).json({ error: 'Online payment is not available right now. Choose Pay at Store or try again later.' });
  const orderNo = 'RK-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const row = await add('orders', { orderNo, ...data, status: data.payment === 'store' ? 'awaiting_store_payment' : 'pending_payment', ...(data.payment === 'store' ? { holdUntil: new Date(Date.now() + 48 * 36e5).toISOString() } : {}) });
  if (data.payment === 'store') return res.status(201).json({ orderNo, total: data.total, pickup: true, holdUntil: row.holdUntil });
  try {
    const t = await paystack.initialize({ email: data.customer.email, amountNaira: data.total, reference: orderNo, callbackUrl: `${origin()}/`, metadata: { orderId: row.id } });
    res.status(201).json({ orderNo, total: data.total, authorizationUrl: t.authorization_url });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'Could not start payment. Please try again.' });
  }
}));

async function markPaidIfValid(tx) {
  const order = await find('orders', (o) => o.orderNo === tx.reference);
  if (!order) return null;
  if (tx.status === 'success' && tx.amount === order.total * 100 && tx.currency === 'NGN') {
    return order.status === 'paid' ? order : update('orders', (o) => o.orderNo === tx.reference, { status: 'paid', paidAt: new Date().toISOString() });
  }
  return order;
}

r.get('/orders/verify/:reference', wrap(async (req, res) => {
  if (!paystack.paystackEnabled()) return res.status(503).json({ error: 'Payments unavailable' });
  const tx = await paystack.verify(req.params.reference);
  const order = await markPaidIfValid(tx);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ orderNo: order.orderNo, status: order.status, total: order.total });
}));

r.post('/webhooks/paystack', wrap(async (req, res) => {
  if (!paystack.validSignature(req.rawBody, req.get('x-paystack-signature'))) return res.sendStatus(401);
  if (req.body?.event === 'charge.success') await markPaidIfValid(req.body.data);
  res.sendStatus(200);
}));

r.get('/admin/orders', adminOnly, wrap(async (_req, res) => res.json(await list('orders'))));
r.get('/admin/subscribers', adminOnly, wrap(async (_req, res) => res.json(await list('subscribers'))));
r.get('/admin/reviews', adminOnly, wrap(async (_req, res) => res.json(await list('reviews'))));
r.post('/admin/reviews/:id/approve', adminOnly, wrap(async (req, res) => {
  const row = await update('reviews', (x) => x.id === req.params.id, { approved: true });
  row ? res.json(row) : res.status(404).json({ error: 'Not found' });
}));
r.post('/admin/orders/:orderNo/status', adminOnly, wrap(async (req, res) => {
  const allowed = ['paid', 'ready_for_pickup', 'shipped', 'completed', 'cancelled'];
  if (!allowed.includes(req.body?.status)) return res.status(400).json({ error: `status must be one of ${allowed.join(', ')}` });
  const row = await update('orders', (o) => o.orderNo === req.params.orderNo, { status: req.body.status });
  row ? res.json(row) : res.status(404).json({ error: 'Not found' });
}));

export default r;
