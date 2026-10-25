// POST /api/score  { pid, token, game, score, ms, name }  (contact details are saved only with consent)
const { SEASON, GAMES, points, redis, creds, hash, cleanName, live, send, readJson } = require('../lib/play');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { ok: false, reason: 'method' });
  if (!creds()) return send(res, 503, { ok: false, reason: 'not-configured' });
  try {
    const b = await readJson(req), game = b.game, G = GAMES[game];
    const pid = String(b.pid || ''), token = String(b.token || ''), score = Math.floor(+b.score), ms = Math.floor(+b.ms);
    if (!G || !/^[a-z0-9-]{12,40}$/i.test(pid) || token.length < 16 || !Number.isFinite(score) || !Number.isFinite(ms)) return send(res, 400, { ok: false, reason: 'bad-input' });
    if (!live()) return send(res, 410, { ok: false, reason: 'season-over' });
    if (score < 1 || score > G.max || ms < score * G.minMsPerPoint || ms > 3600000) return send(res, 422, { ok: false, reason: 'implausible' });
    const name = cleanName(b.name), th = hash(token);
    const [saved, gate] = await redis([['HGET', 'pl:' + pid, 'th'], ['SET', 'rl:' + pid, '1', 'NX', 'EX', 6]]);
    if (saved && saved !== th) return send(res, 403, { ok: false, reason: 'not-you' });
    if (gate === null) return send(res, 429, { ok: false, reason: 'slow-down' });
    if (!saved && !name) return send(res, 400, { ok: false, reason: 'name-needed' });
    const prof = ['HSET', 'pl:' + pid, 'th', th, 'seen', Date.now()];
    if (name) prof.push('name', name);
    if (b.consent === true) {
      const em = String(b.email || '').trim().slice(0, 80), ph = String(b.phone || '').replace(/[^\d+]/g, '').slice(0, 15);
      if (em) prof.push('email', em);
      if (ph) prof.push('phone', ph);
      prof.push('consent', new Date().toISOString());
    }
    const [prev] = await redis([['HGET', `bp:${SEASON.id}:${pid}`, game], prof]);
    const best = Math.max(+prev || 0, score), improved = score > (+prev || 0);
    if (improved) {
      await redis([['HSET', `bp:${SEASON.id}:${pid}`, game, score], ['ZADD', `lb:${SEASON.id}:${game}`, score, pid]]);
      const [all] = await redis([['HGETALL', `bp:${SEASON.id}:${pid}`]]);
      let total = 0;
      for (let i = 0; i < all.length; i += 2) if (GAMES[all[i]]) total += points(all[i], +all[i + 1]);
      await redis([['ZADD', `lb:${SEASON.id}:all`, total, pid]]);
    }
    const [r1, n1, r2, n2, tot] = await redis([
      ['ZREVRANK', `lb:${SEASON.id}:${game}`, pid], ['ZCARD', `lb:${SEASON.id}:${game}`],
      ['ZREVRANK', `lb:${SEASON.id}:all`, pid], ['ZCARD', `lb:${SEASON.id}:all`], ['ZSCORE', `lb:${SEASON.id}:all`, pid]
    ]);
    send(res, 200, { ok: true, improved, best, rank: r1 === null ? null : r1 + 1, of: n1, allRank: r2 === null ? null : r2 + 1, allOf: n2, total: +tot || 0 });
  } catch (e) { send(res, 500, { ok: false, reason: 'error' }); }
};
