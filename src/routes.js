import { Router } from 'express';
import crypto from 'node:crypto';
import { MAIN, LOOK, ALIKE, ARRIVALS, CATALOG, SUBS, SEED_REVIEWS, getProduct, pub, stateOf, applyProductOverride, registerProduct } from './products.js';
import { add, update, list, find } from './store.js';
import * as v from './validate.js';
import * as paystack from './paystack.js';
import { supabase } from './supabase.js';
import { TRACKING_STATUSES, initialTracking, updateTracking, subscribe, publish } from './tracking.js';

const r = Router();
const shippingFee = () => Number(process.env.SHIPPING_FEE || 0);
const referralReward = () => Number(process.env.REFERRAL_REWARD || 1000);
const origin = () => (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0];
const adminOnly = (req, res, next) => (process.env.ADMIN_KEY && req.get('x-admin-key') === process.env.ADMIN_KEY ? next() : res.status(401).json({ error: 'Unauthorized' }));
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

r.get('/health', (_req, res) => res.json({ ok: true }));

const cfg = () => ({ shippingFee: shippingFee(), paystack: paystack.paystackEnabled(), pickup: 'Kurudu, Abuja FCT' });
r.get('/config', (_req, res) => res.json(cfg()));
r.get('/home', (_req, res) => res.json({ arrivals: ARRIVALS }));

const authUnavailable = (res) => res.status(503).json({ error: 'Accounts are not available right now. Please try again later.' });
const userRole = (user) => user.user_metadata?.role || (process.env.ADMIN_EMAIL && user.email?.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase() ? 'admin' : 'customer');
const authResult = (session, user) => ({ token: session.access_token, user: { id: user.id, email: user.email, name: user.user_metadata?.name || user.user_metadata?.full_name || '', full_name: user.user_metadata?.full_name || user.user_metadata?.name || '', role: userRole(user), branch_id: user.user_metadata?.branch_id || null, branch_name: user.user_metadata?.branch_name || null } });
const getUser = async (req) => {
  if (!supabase) return null;
  const token = String(req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const result = await supabase.auth.getUser(token);
  return result.error ? null : result.data.user;
};
const requireUser = wrap(async (req, res, next) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Sign in required.' });
  req.user = user;
  next();
});
const requireStaff = wrap(async (req, res, next) => {
  const user = await getUser(req);
  if (!user || !['admin', 'staff'].includes(userRole(user))) return res.status(401).json({ error: 'Staff sign in required.' });
  req.user = user;
  req.role = userRole(user);
  next();
});
const requireAdmin = wrap(async (req, res, next) => {
  const user = await getUser(req);
  if (!user || userRole(user) !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  req.user = user;
  req.role = 'admin';
  next();
});
const ownsOrder = (order, user) => order && (order.userId === user.id || order.customer?.email?.toLowerCase() === user.email?.toLowerCase());
const publicTracking = (order) => ({
  orderNo: order.orderNo,
  trackingId: order.trackingId,
  status: order.status,
  total: order.total,
  delivery: order.delivery,
  tracking: order.tracking || initialTracking(order.status, order.createdAt)
});
const productOverridesReady = list('products')
  .then((rows) => rows.filter((row) => !row.archived).forEach((row) => {
    applyProductOverride(row);
    if (!getProduct(row.slug)) registerProduct(row);
  }))
  .catch((error) => console.error('Could not load product overrides:', error.message));

r.post('/auth/register', wrap(async (req, res) => {
  if (!supabase) return authUnavailable(res);
  const { data, error } = v.authCredentials(req.body);
  if (error) return res.status(400).json({ error });
  const created = await supabase.auth.admin.createUser({ email: data.email, password: data.password, email_confirm: true, user_metadata: { name: data.name } });
  if (created.error) return res.status(400).json({ error: created.error.message });
  const signedIn = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
  if (signedIn.error) return res.status(502).json({ error: 'Account created, but sign-in failed. Please sign in again.' });
  res.status(201).json(authResult(signedIn.data.session, signedIn.data.user));
}));

r.post('/auth/login', wrap(async (req, res) => {
  if (!supabase) return authUnavailable(res);
  const { data, error } = v.authCredentials({ ...req.body, name: 'Account' });
  if (error) return res.status(400).json({ error });
  const signedIn = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
  if (signedIn.error) return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.json(authResult(signedIn.data.session, signedIn.data.user));
}));

r.get('/auth/me', wrap(async (req, res) => {
  if (!supabase) return authUnavailable(res);
  const token = String(req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Sign in required.' });
  const result = await supabase.auth.getUser(token);
  if (result.error) return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  res.json({ user: authResult({ access_token: '' }, result.data.user).user });
}));

r.get('/branches', requireStaff, (_req, res) => res.json([{ id: 1, name: 'Kurudu, Abuja' }]));
r.get('/branches/summary', requireAdmin, wrap(async (_req, res) => {
  const [users, products, orders] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    list('products'),
    list('orders')
  ]);
  if (users.error) throw new Error(`Could not load staff: ${users.error.message}`);
  res.json([{ id: 1, name: 'Kurudu, Abuja', staff: users.data.users.filter((user) => user.user_metadata?.role === 'staff').length, products: products.filter((product) => !product.archived).length, revenue_today: orders.filter((order) => order.status === 'completed').reduce((sum, order) => sum + Number(order.total || 0), 0) }]);
}));

r.get('/staff', requireAdmin, wrap(async (_req, res) => {
  const result = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (result.error) throw new Error(`Could not load staff: ${result.error.message}`);
  res.json(result.data.users.filter((user) => user.user_metadata?.role === 'staff').map((user) => ({
    id: user.id,
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
    email: user.email,
    active: !user.banned_until,
    last_login: user.last_sign_in_at,
    branch_id: user.user_metadata?.branch_id || 1
  })));
}));

r.get('/staff/all', requireAdmin, wrap(async (req, res) => {
  const result = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (result.error) throw new Error(`Could not load staff: ${result.error.message}`);
  res.json(result.data.users.filter((user) => user.user_metadata?.role === 'staff').map((user) => ({
    id: user.id,
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
    email: user.email,
    branch_id: user.user_metadata?.branch_id || 1
  })));
}));

r.post('/staff', requireAdmin, wrap(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const fullName = String(req.body?.full_name || '').trim().slice(0, 100);
  const password = String(req.body?.password || '');
  if (!/^\S+@\S+\.\S+$/.test(email) || fullName.length < 2 || password.length < 8) return res.status(400).json({ error: 'Name, valid email, and password of at least 8 characters are required.' });
  const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { role: 'staff', full_name: fullName, name: fullName, branch_id: 1, branch_name: 'Kurudu, Abuja' } });
  if (created.error) return res.status(400).json({ error: created.error.message });
  res.status(201).json({ id: created.data.user.id, email, full_name: fullName, active: true, email_sent: false, email_message: 'Share the staff login credentials securely.' });
}));

r.patch('/staff/:id', requireAdmin, wrap(async (req, res) => {
  const current = await supabase.auth.admin.getUserById(req.params.id);
  if (current.error || current.data.user?.user_metadata?.role !== 'staff') return res.status(404).json({ error: 'Staff member not found.' });
  const metadata = { ...current.data.user.user_metadata };
  if (req.body?.branch_id !== undefined) metadata.branch_id = req.body.branch_id ? Number(req.body.branch_id) : null;
  if (req.body?.active !== undefined) {
    const updated = await supabase.auth.admin.updateUserById(req.params.id, { ban_duration: req.body.active ? 'none' : '876000h', user_metadata: metadata });
    if (updated.error) throw new Error(`Could not update staff: ${updated.error.message}`);
  } else if (req.body?.password) {
    if (String(req.body.password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    const updated = await supabase.auth.admin.updateUserById(req.params.id, { password: String(req.body.password), user_metadata: metadata });
    if (updated.error) throw new Error(`Could not update staff: ${updated.error.message}`);
  } else {
    const updated = await supabase.auth.admin.updateUserById(req.params.id, { user_metadata: metadata });
    if (updated.error) throw new Error(`Could not update staff: ${updated.error.message}`);
  }
  res.json({ ok: true });
}));

r.get('/catalog', wrap(async (req, res) => {
  await productOverridesReady;
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
}));

r.get('/products/:slug', wrap(async (req, res) => {
  await productOverridesReady;
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

const inventoryProduct = (item) => ({
  id: item.id || item.slug,
  slug: item.slug,
  name: item.name,
  category: item.category || 'clothing',
  price: Number(item.price) || 0,
  stock: Number(item.inventoryStock ?? (stateOf(item) === 'out' ? 0 : 1)),
  image_url: item.image_url || item.img || null
});

r.get('/products', requireStaff, wrap(async (_req, res) => {
  await productOverridesReady;
  const stored = (await list('products')).filter((item) => !item.archived);
  const storedSlugs = new Set(stored.map((item) => item.slug));
  const catalogue = CATALOG.filter((item) => !storedSlugs.has(item.slug)).map(inventoryProduct);
  res.json([...stored.map(inventoryProduct), ...catalogue]);
}));

r.post('/products', requireAdmin, wrap(async (req, res) => {
  const name = String(req.body?.name || '').trim().slice(0, 120);
  const category = String(req.body?.category || 'clothing').trim().slice(0, 60);
  const price = Number(req.body?.price);
  const inventoryStock = Number(req.body?.stock);
  const imageUrl = req.body?.image_url == null ? null : String(req.body.image_url).slice(0, 2_800_000);
  if (name.length < 2 || !Number.isFinite(price) || price < 0 || !Number.isInteger(inventoryStock) || inventoryStock < 0) {
    return res.status(400).json({ error: 'Name, non-negative price, and whole-number stock are required.' });
  }
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${crypto.randomBytes(3).toString('hex')}`;
  const row = await add('products', { slug, name, category, price, inventoryStock, image_url: imageUrl, colors: ['black'] });
  registerProduct(row);
  res.status(201).json(inventoryProduct(row));
}));

r.put('/products/:id', requireAdmin, wrap(async (req, res) => {
  const price = Number(req.body?.price);
  const inventoryStock = Number(req.body?.stock);
  if (!Number.isFinite(price) || price < 0 || !Number.isInteger(inventoryStock) || inventoryStock < 0) return res.status(400).json({ error: 'Price and stock are invalid.' });
  const current = await find('products', (item) => item.id === req.params.id || item.slug === req.params.id);
  if (!current) return res.status(404).json({ error: 'Product not found.' });
  const row = await update('products', (item) => item.id === current.id, { price, inventoryStock, image_url: req.body?.image_url == null ? current.image_url || null : String(req.body.image_url).slice(0, 2_800_000) });
  applyProductOverride(row);
  res.json(inventoryProduct(row));
}));

r.delete('/products/:id', requireAdmin, wrap(async (req, res) => {
  const current = await find('products', (item) => item.id === req.params.id || item.slug === req.params.id);
  if (!current) return res.status(404).json({ error: 'Product not found.' });
  const removed = await update('products', (item) => item.id === current.id, { archived: true });
  res.json({ ok: true, product: inventoryProduct(removed) });
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
  await productOverridesReady;
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Sign in required before checkout.' });
  const { data, error } = v.order(req.body, shippingFee());
  if (error) return res.status(400).json({ error });
  if (data.payment === 'paystack' && !paystack.paystackEnabled()) return res.status(503).json({ error: 'Online payment is not available right now. Choose Pay at Store or try again later.' });
  const orderNo = 'RK-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const trackingId = 'RT-' + crypto.randomBytes(5).toString('hex').toUpperCase();
  const referralCode = String(req.body.referralCode || '').trim().toUpperCase();
  const status = data.payment === 'store' ? 'awaiting_store_payment' : 'pending_payment';
  const row = await add('orders', { userId: user.id, orderNo, trackingId, ...data, ...(referralCode.match(/^RK-[A-Z0-9]{8}$/) ? { referralCode } : {}), status, tracking: initialTracking(status), ...(data.payment === 'store' ? { holdUntil: new Date(Date.now() + 48 * 36e5).toISOString() } : {}) });
  if (data.payment === 'store') return res.status(201).json({ orderNo, trackingId, total: data.total, pickup: true, holdUntil: row.holdUntil });
  try {
    const t = await paystack.initialize({ email: data.customer.email, amountNaira: data.total, reference: orderNo, callbackUrl: `${origin()}/`, metadata: { orderId: row.id } });
    res.status(201).json({ orderNo, trackingId, total: data.total, authorizationUrl: t.authorization_url });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'Could not start payment. Please try again.' });
  }
}));

r.get('/orders/mine', requireUser, wrap(async (req, res) => {
  const orders = (await list('orders')).filter((order) => order.userId === req.user.id || order.customer?.email?.toLowerCase() === req.user.email?.toLowerCase());
  res.json({ orders });
}));

r.get('/orders/incoming', requireStaff, wrap(async (_req, res) => {
  const orders = (await list('orders'))
    .filter((order) => !['pending_payment', 'cancelled', 'completed'].includes(order.status))
    .map((order) => ({ ...order, tracking: order.tracking || initialTracking(order.status, order.createdAt) }));
  res.json({ orders });
}));

r.patch('/orders/:orderNo/status', requireStaff, wrap(async (req, res) => {
  const { status, location, eta, note } = req.body || {};
  if (!TRACKING_STATUSES.includes(status)) return res.status(400).json({ error: `status must be one of ${TRACKING_STATUSES.join(', ')}` });
  const current = await find('orders', (order) => order.orderNo === req.params.orderNo);
  if (!current) return res.status(404).json({ error: 'Order not found.' });
  const row = await update('orders', (order) => order.orderNo === req.params.orderNo, {
    status,
    processedBy: req.user.id,
    tracking: updateTracking(current.tracking, status, { location, eta, note })
  });
  publish(row.trackingId, publicTracking(row));
  res.json(row);
}));

r.get('/orders/track/:trackingId', requireUser, wrap(async (req, res) => {
  const order = await find('orders', (item) => item.trackingId === req.params.trackingId);
  if (!ownsOrder(order, req.user)) return res.status(404).json({ error: 'Tracking record not found.' });
  res.json(publicTracking(order));
}));

r.get('/orders/track/:trackingId/stream', requireUser, async (req, res, next) => {
  try {
    const order = await find('orders', (item) => item.trackingId === req.params.trackingId);
    if (!ownsOrder(order, req.user)) return res.status(404).json({ error: 'Tracking record not found.' });
    res.status(200).set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    res.flushHeaders();
    res.write(`event: tracking.updated\ndata: ${JSON.stringify(publicTracking(order))}\n\n`);
    const unsubscribe = subscribe(order.trackingId, res);
    const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), 25000);
    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  } catch (error) {
    next(error);
  }
});

r.get('/referrals', requireUser, wrap(async (req, res) => {
  const code = `RK-${req.user.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  const referred = (await list('orders')).filter((order) => order.referralCode === code && order.status === 'paid');
  res.json({ code, completed: referred.length, earned: referred.length * referralReward() });
}));

async function markPaidIfValid(tx) {
  const order = await find('orders', (o) => o.orderNo === tx.reference);
  if (!order) return null;
  if (tx.status === 'success' && tx.amount === order.total * 100 && tx.currency === 'NGN') {
    if (order.status === 'paid') return order;
    const next = await update('orders', (o) => o.orderNo === tx.reference, { status: 'paid', paidAt: new Date().toISOString(), tracking: updateTracking(order.tracking, 'paid') });
    publish(next.trackingId, publicTracking(next));
    return next;
  }
  return order;
}

r.get('/orders/verify/:reference', wrap(async (req, res) => {
  if (!paystack.paystackEnabled()) return res.status(503).json({ error: 'Payments unavailable' });
  const tx = await paystack.verify(req.params.reference);
  const order = await markPaidIfValid(tx);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ orderNo: order.orderNo, trackingId: order.trackingId, status: order.status, total: order.total });
}));

r.post('/webhooks/paystack', wrap(async (req, res) => {
  if (!paystack.validSignature(req.rawBody, req.get('x-paystack-signature'))) return res.sendStatus(401);
  if (req.body?.event === 'charge.success') await markPaidIfValid(req.body.data);
  res.sendStatus(200);
}));

r.get('/admin/orders', adminOnly, wrap(async (_req, res) => res.json(await list('orders'))));
r.get('/admin/products', adminOnly, wrap(async (_req, res) => {
  await productOverridesReady;
  res.json([MAIN, ...CATALOG.filter((product) => product.slug !== MAIN.slug)].map((product) => ({ ...product, colors: undefined })));
}));
r.patch('/admin/products/:slug', adminOnly, wrap(async (req, res) => {
  await productOverridesReady;
  const product = [MAIN, ...CATALOG].find((item) => item.slug === req.params.slug);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  const allowed = ['name', 'price', 'compareAt', 'category', 'sub', 'kicker', 'spec', 'stock'];
  const patch = {};
  for (const key of allowed) {
    if (req.body?.[key] !== undefined) patch[key] = key === 'price' || key === 'compareAt' ? Number(req.body[key]) : req.body[key];
  }
  if (patch.price !== undefined && (!Number.isFinite(patch.price) || patch.price < 0)) return res.status(400).json({ error: 'Price must be a non-negative number.' });
  if (patch.compareAt !== undefined && (!Number.isFinite(patch.compareAt) || patch.compareAt < 0)) return res.status(400).json({ error: 'Compare-at price must be a non-negative number.' });
  if (patch.stock !== undefined && !['in', 'low', 'out'].includes(patch.stock)) return res.status(400).json({ error: 'Stock must be in, low or out.' });
  Object.assign(product, patch);
  await update('products', (item) => item.slug === product.slug, patch) || await add('products', { slug: product.slug, ...patch });
  res.json({ product: { ...product, colors: undefined } });
}));
r.get('/admin/subscribers', adminOnly, wrap(async (_req, res) => res.json(await list('subscribers'))));
r.post('/admin/outreach', adminOnly, wrap(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const subject = String(req.body?.subject || '').trim().slice(0, 160);
  const message = String(req.body?.message || '').trim().slice(0, 2000);
  if (!/^\S+@\S+\.\S+$/.test(email) || !subject || !message) return res.status(400).json({ error: 'Customer email, subject and message are required.' });
  const row = await add('outreach', { email, subject, message, status: 'queued' });
  res.status(201).json({ outreach: row, mailto: `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}` });
}));
r.get('/admin/reviews', adminOnly, wrap(async (_req, res) => res.json(await list('reviews'))));
r.post('/admin/reviews/:id/approve', adminOnly, wrap(async (req, res) => {
  const row = await update('reviews', (x) => x.id === req.params.id, { approved: true });
  row ? res.json(row) : res.status(404).json({ error: 'Not found' });
}));
r.post('/admin/orders/:orderNo/status', adminOnly, wrap(async (req, res) => {
  const { status, location, eta, note } = req.body || {};
  if (!TRACKING_STATUSES.includes(status)) return res.status(400).json({ error: `status must be one of ${TRACKING_STATUSES.join(', ')}` });
  if (location !== undefined && (location === null || typeof location !== 'object' || typeof location.label !== 'string' || location.label.length > 120)) {
    return res.status(400).json({ error: 'location must be an object with a label of 120 characters or fewer.' });
  }
  if (eta !== undefined && eta !== null && (typeof eta !== 'string' || Number.isNaN(Date.parse(eta)))) return res.status(400).json({ error: 'eta must be an ISO date or null.' });
  if (note !== undefined && note !== null && (typeof note !== 'string' || note.length > 300)) return res.status(400).json({ error: 'note must be 300 characters or fewer.' });
  const current = await find('orders', (order) => order.orderNo === req.params.orderNo);
  if (!current) return res.status(404).json({ error: 'Not found' });
  const row = await update('orders', (o) => o.orderNo === req.params.orderNo, {
    status,
    tracking: updateTracking(current.tracking, status, { location, eta, note })
  });
  publish(row.trackingId, publicTracking(row));
  res.json(row);
}));

export default r;
