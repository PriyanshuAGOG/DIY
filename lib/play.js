// Shared server code for the Paper Arcade: season settings, score rules and a tiny Redis client.
// Storage is Upstash Redis (free). Connect it to the Vercel project (Storage -> Upstash Redis) and these
// variables appear on their own: KV_REST_API_URL + KV_REST_API_TOKEN. Set ADMIN_KEY yourself for the winners page.
const crypto = require('crypto');

const SEASON = {
  id: 's1',
  name: 'Season 01 · The Paper Cup',
  ends: '2026-12-01T23:59:59+05:30',
  prizes: [
    { rank: 1, title: 'Flat 25% off', note: 'on your whole order' },
    { rank: 2, title: 'Flat ₹200 off', note: 'on your order' },
    { rank: 3, title: 'Flat ₹100 off', note: 'on your order' }
  ]
};

// score -> points (capped at 1000 per game, so one game can't decide the all-round board),
// and what a human can plausibly do (max score, and the fastest time per point)
const GAMES = {
  stack: { name: 'Stack the Sheets', k: 25, max: 120, minMsPerPoint: 420 },
  plane: { name: 'Paper Plane Dash', k: 20, max: 400, minMsPerPoint: 850 },
  fold: { name: 'Fold Sequence', k: 40, max: 60, minMsPerPoint: 900 }
};
const points = (game, score) => Math.min(1000, Math.round(score * GAMES[game].k));

function creds() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}
async function redis(commands) {
  const c = creds(); if (!c) throw Object.assign(new Error('not-configured'), { code: 'not-configured' });
  const r = await fetch(c.url + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + c.token, 'Content-Type': 'application/json' }, body: JSON.stringify(commands) });
  if (!r.ok) throw new Error('redis ' + r.status);
  return (await r.json()).map(x => { if (x.error) throw new Error(x.error); return x.result; });
}
const hash = t => crypto.createHash('sha256').update(String(t)).digest('hex');
const cleanName = s => String(s || '').replace(/[^\p{L}\p{N} _.\-]/gu, '').trim().slice(0, 18);
const live = () => Date.now() < new Date(SEASON.ends).getTime();

function send(res, code, body) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}
async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = []; let n = 0;
  for await (const c of req) { chunks.push(c); n += c.length; if (n > 8000) break; }
  try { return JSON.parse(Buffer.concat(chunks).toString() || '{}'); } catch (e) { return {}; }
}
module.exports = { SEASON, GAMES, points, redis, creds, hash, cleanName, live, send, readJson };
