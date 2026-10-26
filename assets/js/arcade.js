/* Do It Yar — the arcade's shared bits: the player (handle + private token), best scores, and posting a score.
   Used by the Play hub and by the Grand Prix, so a race result lands on the same leaderboard as every other game. */
(function () {
  const { url, store } = DIYcore;
  // points per game: score x k, capped at 1000 (kept in step with lib/play.js)
  const PTS = { stack: 25, plane: 20, fold: 40, race: 1.4 };
  const raceScore = ms => Math.round((9000 - ms) / 4); // 9.0 s = 0, 6.5 s = 625, every tenth of a second is 25 points
  const pts = (g, s) => Math.min(1000, Math.round(s * PTS[g]));
  const rid = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => b.toString(16).padStart(2, '0')).join('');
  const cleanName = s => String(s || '').replace(/[^\p{L}\p{N} _.\-]/gu, '').trim().slice(0, 18);

  let P = store.get('player', null);
  if (!P || !P.pid) { P = { pid: 'p' + rid(10), token: rid(16), name: '', email: '', phone: '', consent: false }; store.set('player', P); }
  const savePlayer = () => store.set('player', P);
  const BEST = store.get('playbest', {});
  const saveBest = (g, s) => { if (s > (BEST[g] || 0)) { BEST[g] = s; store.set('playbest', BEST); return true; } return false; };

  const api = async (path, opts) => {
    const r = await fetch(new URL(url('api/' + path), location.href), opts);
    return { status: r.status, body: await r.json().catch(() => ({})) };
  };

  // posts one score and returns a sentence for the player; never throws
  async function submit(game, score, ms) {
    const body = { pid: P.pid, token: P.token, game, score, ms, name: P.name };
    if (P.consent) { body.consent = true; body.email = P.email; body.phone = P.phone; }
    try {
      const { body: r } = await api('score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (r.ok) {
        if (r.allRank && r.allRank <= 3) { DIYcore.haptic('win'); DIYcore.confetti(innerWidth / 2, innerHeight * .3, 80); }
        return `${r.improved ? 'New best on the board. ' : 'Your best is still ' + r.best + '. '}#${r.rank} of ${r.of} in this game · #${r.allRank} all-round with ${r.total} pts${r.allRank <= 3 ? ' (prize zone!)' : ''}.`;
      }
      if (r.reason === 'not-configured') return 'Saved on this device. The global leaderboard switches on very soon, and your best score will count.';
      if (r.reason === 'slow-down') return 'That was quick. Wait a few seconds between posted scores.';
      if (r.reason === 'implausible') return 'That score looked too fast to be human, so it wasn’t posted.';
      if (r.reason === 'season-over') return 'The season has ended. Thanks for playing!';
      if (r.reason === 'not-you') return 'This handle belongs to another device. Pick a different handle on your player card.';
      return 'Couldn’t reach the leaderboard. Your score is saved on this device.';
    } catch (e) { return 'You seem to be offline. Your score is saved on this device.'; }
  }
  window.DIYarcade = { raceScore, P, PTS, pts, cleanName, savePlayer, BEST, saveBest, api, submit };
})();
