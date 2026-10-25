// GET /api/leaderboard?game=all|stack|plane|fold&limit=25&pid=<player id>
const { SEASON, GAMES, redis, creds, send } = require('../lib/play');

module.exports = async (req, res) => {
  if (!creds()) return send(res, 503, { ok: false, reason: 'not-configured', season: SEASON });
  try {
    const u = new URL(req.url, 'http://x'), game = u.searchParams.get('game') || 'all';
    if (game !== 'all' && !GAMES[game]) return send(res, 400, { ok: false, reason: 'bad-game' });
    const limit = Math.max(3, Math.min(50, +u.searchParams.get('limit') || 25)), pid = (u.searchParams.get('pid') || '').slice(0, 40);
    const key = `lb:${SEASON.id}:${game}`;
    const [flat, total, myRank, myScore] = await redis([
      ['ZREVRANGE', key, 0, limit - 1, 'WITHSCORES'], ['ZCARD', key],
      pid ? ['ZREVRANK', key, pid] : ['ECHO', ''], pid ? ['ZSCORE', key, pid] : ['ECHO', '']
    ]);
    const ids = [], scores = [];
    for (let i = 0; i < flat.length; i += 2) { ids.push(flat[i]); scores.push(+flat[i + 1]); }
    const names = ids.length ? await redis(ids.map(id => ['HGET', 'pl:' + id, 'name'])) : [];
    const board = ids.map((id, i) => ({ rank: i + 1, name: names[i] || 'Player', score: scores[i], me: id === pid }));
    const me = pid && myRank !== null && myRank !== '' ? { rank: +myRank + 1, score: +myScore } : null;
    send(res, 200, { ok: true, season: SEASON, game, total: +total, board, me });
  } catch (e) { send(res, 500, { ok: false, reason: 'error' }); }
};
