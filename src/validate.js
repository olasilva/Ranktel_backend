import { getProduct } from './products.js';
const s = (v, max) => String(v ?? '').trim().slice(0, max);
const phoneOk = (p) => /^[+\d][\d\s()-]{6,}$/.test(p);
const emailOk = (e) => /^\S+@\S+\.\S+$/.test(e);

export function review(b = {}) {
  const d = { name: s(b.name, 60), location: s(b.location, 60), size: Number(b.size) || null, rating: Math.round(Number(b.rating)), title: s(b.title, 80), body: s(b.body, 800) };
  if (d.name.length < 2) return { error: 'Please enter your name.' };
  if (!(d.rating >= 1 && d.rating <= 5)) return { error: 'Please choose a rating from 1 to 5.' };
  if (d.title.length < 3) return { error: 'Please add a short headline.' };
  if (d.body.length < 15) return { error: 'Please write at least a sentence about the fit and quality.' };
  return { data: d };
}

// Prices always come from the server catalogue, never from the browser.
export function order(b = {}, shippingFee) {
  const c = b.customer || {};
  const customer = { name: s(c.name, 100), phone: s(c.phone, 30), email: s(c.email, 150), address: s(c.address, 250), city: s(c.city, 80) };
  const delivery = b.delivery === 'ship' ? 'ship' : 'pickup';
  const payment = b.payment === 'store' ? 'store' : 'paystack';
  if (customer.name.length < 2) return { error: 'Please enter your name.' };
  if (!phoneOk(customer.phone)) return { error: 'Please enter a valid phone number.' };
  if (!emailOk(customer.email)) return { error: 'Please enter a valid email address.' };
  if (delivery === 'ship' && (customer.address.length < 5 || customer.city.length < 2)) return { error: 'Please enter your delivery address and city.' };
  if (payment === 'store' && delivery !== 'pickup') return { error: 'Pay at Store is only available for Kurudu pickup.' };
  if (!Array.isArray(b.items) || !b.items.length || b.items.length > 20) return { error: 'Your bag is empty.' };
  const items = [];
  for (const it of b.items) {
    const p = getProduct(it.slug);
    if (!p) return { error: 'An item in your bag is no longer available.' };
    const color = p.colors.find((c2) => c2.name === it.color);
    const size = p.sizes.find((z) => String(z.size) === String(it.size));
    const qty = Math.min(Math.max(parseInt(it.qty, 10) || 1, 1), 5);
    if (!color || !size) return { error: `Invalid option for ${p.name}.` };
    if (size.stock < qty) return { error: `${p.name} in size ${size.size} is out of stock or low on stock.` };
    items.push({ slug: p.slug, name: p.name, color: color.label, size: size.size, qty, unitPrice: p.price });
  }
  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.qty, 0);
  const shipping = delivery === 'ship' ? shippingFee : 0;
  return { data: { customer, delivery, payment, items, subtotal, shipping, total: subtotal + shipping } };
}

export const email = (e) => { const x = s(e, 150).toLowerCase(); return emailOk(x) ? { data: x } : { error: 'Please enter a valid email address.' }; };
