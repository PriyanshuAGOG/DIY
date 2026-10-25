// GET /api/winners  with header  x-admin-key: <ADMIN_KEY>
// The top of the all-round board WITH contact details (only for players who consented), for the owner only.
const { SEASON, redis, creds, send } = require('../lib/play');

module.exports = async (req, res) => {
  const key = process.env.ADMIN_KEY;
  if (!key || req.headers['x-admin-key'] !== key) return send(res, 401, { ok: false, reason: 'unauthorised' });
  if (!creds()) return send(res, 503, { ok: false, reason: 'not-configured' });
  try {
    const [flat] = await redis([['ZREVRANGE', `lb:${SEASON.id}:all`, 0, 9, 'WITHSCORES']]);
    const ids = [], pts = [];
    for (let i = 0; i < flat.length; i += 2) { ids.push(flat[i]); pts.push(+flat[i + 1]); }
    const rows = ids.length ? await redis(ids.map(id => ['HGETALL', 'pl:' + id])) : [];
    const winners = ids.map((id, i) => {
      const o = {}; for (let k = 0; k < rows[i].length; k += 2) o[rows[i][k]] = rows[i][k + 1];
      return { rank: i + 1, points: pts[i], prize: (SEASON.prizes[i] || {}).title || null, name: o.name, email: o.email || null, phone: o.phone || null, contactConsent: o.consent || null };
    });
    send(res, 200, { ok: true, season: SEASON.name, winners });
  } catch (e) { send(res, 500, { ok: false, reason: 'error' }); }
};
