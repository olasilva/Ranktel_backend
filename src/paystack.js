import crypto from 'node:crypto';
const BASE = 'https://api.paystack.co';
const key = () => process.env.PAYSTACK_SECRET_KEY;
export const paystackEnabled = () => Boolean(key());
async function call(path, opts = {}) {
  const res = await fetch(BASE + path, { ...opts, headers: { Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json' } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.status) throw new Error(json.message || 'Paystack request failed');
  return json.data;
}
export const initialize = ({ email, amountNaira, reference, callbackUrl, metadata }) =>
  call('/transaction/initialize', { method: 'POST', body: JSON.stringify({ email, amount: amountNaira * 100, reference, currency: 'NGN', callback_url: callbackUrl, metadata }) });
export const verify = (reference) => call(`/transaction/verify/${encodeURIComponent(reference)}`);
export function validSignature(rawBody, signature) {
  if (!key() || !signature || !rawBody) return false;
  const hash = crypto.createHmac('sha512', key()).update(rawBody).digest('hex');
  const a = Buffer.from(hash), b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
