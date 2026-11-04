import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { supabase } from './supabase.js';
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const file = (n) => path.join(dir, `${n}.json`);
let q = Promise.resolve();
async function read(n) { try { return JSON.parse(await fs.readFile(file(n), 'utf8')); } catch { return []; } }
const run = (fn) => { const p = q.then(fn); q = p.catch(() => {}); return p; };
const tableNames = new Set(['orders', 'reviews', 'subscribers']);
const table = (n) => {
  if (!tableNames.has(n)) throw new Error(`Unknown store collection: ${n}`);
  return n;
};
const fromSupabase = (row) => ({ ...row.data, id: row.id, createdAt: row.created_at });
const addRemote = async (n, rec) => {
  const { data, error } = await supabase.from(table(n)).insert({ data: rec }).select('id, created_at, data').single();
  if (error) throw new Error(`Supabase insert failed for ${n}: ${error.message}`);
  return fromSupabase(data);
};
const listRemote = async (n) => {
  const { data, error } = await supabase.from(table(n)).select('id, created_at, data').order('created_at', { ascending: false });
  if (error) throw new Error(`Supabase read failed for ${n}: ${error.message}`);
  return data.map(fromSupabase);
};
const updateRemote = async (n, match, patch) => {
  const rows = await listRemote(n);
  const row = rows.find(match);
  if (!row) return null;
  const next = { ...row, ...patch };
  delete next.id;
  delete next.createdAt;
  const { data, error } = await supabase.from(table(n)).update({ data: next }).eq('id', row.id).select('id, created_at, data').single();
  if (error) throw new Error(`Supabase update failed for ${n}: ${error.message}`);
  return fromSupabase(data);
};
export const add = (n, rec) => run(async () => {
  if (supabase) return addRemote(n, rec);
  const rows = await read(n);
  const row = { id: randomUUID(), createdAt: new Date().toISOString(), ...rec };
  rows.push(row); await fs.writeFile(file(n), JSON.stringify(rows, null, 2)); return row;
});
export const update = (n, match, patch) => run(async () => {
  if (supabase) return updateRemote(n, match, patch);
  const rows = await read(n); const row = rows.find(match);
  if (!row) return null;
  Object.assign(row, patch); await fs.writeFile(file(n), JSON.stringify(rows, null, 2)); return row;
});
export const list = (n) => run(() => supabase ? listRemote(n) : read(n));
export const find = async (n, match) => (await list(n)).find(match) || null;
