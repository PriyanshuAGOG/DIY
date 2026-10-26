/* Paper Arcade — three score games, a season leaderboard and the prize campaign.
   Scores are posted to /api/score (Vercel + Upstash). If that isn't connected yet, everything keeps working
   on this device and the board says so, instead of breaking. */
(function () {
  const { $, $$, url, toast, confetti, snd, haptic, store, TOUCH } = DIYcore;

  /* ---------- the campaign (the server holds the real copy; this is what shows before it answers) ---------- */
  let SEASON = {
    id: 's1', name: 'Season 01 · The Paper Cup', ends: '2026-12-01T23:59:59+05:30',
    prizes: [{ rank: 1, title: 'Flat 25% off', note: 'on your whole order' }, { rank: 2, title: 'Flat ₹200 off', note: 'on your order' }, { rank: 3, title: 'Flat ₹100 off', note: 'on your order' }]
  };
  // the player, best scores and score posting are shared with the Grand Prix (arcade.js)
  const { P, pts, cleanName, savePlayer, BEST, saveBest, submit, api } = DIYarcade;
  const rid = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => b.toString(16).padStart(2, '0')).join('');

  /* ---------- tiny helpers: seeded randomness (so a challenge is the same course for both players) ---------- */
  const hashSeed = s => { let h = 1779033703; for (const c of String(s)) { h = Math.imul(h ^ c.charCodeAt(0), 3432918353); h = h << 13 | h >>> 19; } return h >>> 0; };
  const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const newSeed = () => rid(3);
  const mkCanvas = (stage, W, H) => {
    const cv = document.createElement('canvas'), d = Math.min(devicePixelRatio || 1, TOUCH ? 1.5 : 2);
    cv.width = Math.round(W * d); cv.height = Math.round(H * d); stage.append(cv);
    const g = cv.getContext('2d'); g.scale(d, d); return g;
  };
  const paper = (g, W, H) => { g.fillStyle = '#f3efe6'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(32,33,30,.05)'; g.lineWidth = 1; g.beginPath(); for (let y = 30; y < H; y += 30) { g.moveTo(0, y); g.lineTo(W, y); } g.stroke(); };
  const loop = fn => { let id = 0, last = performance.now(), dead = false; const f = t => { if (dead) return; fn(Math.min(.033, (t - last) / 1000), t); last = t; id = requestAnimationFrame(f); }; id = requestAnimationFrame(f); return () => { dead = true; cancelAnimationFrame(id); }; };

  /* =========================================================
     GAME 1 · STACK THE SHEETS: drop each sheet on the one below; what hangs over is cut off
     ========================================================= */
  function stackGame(stage, ctx) {
    const W = 360, H = 600, BH = 24, g = mkCanvas(stage, W, H), COL = ['#ff641f', '#c5ef41', '#c6c3ff', '#b9ecd7', '#f6c3d4', '#fffdf8'], c0 = hashSeed(ctx.seed) % 6;
    const layers = [{ x: 80, w: 200, c: c0 }];
    let cur = { x: 0, w: 200, dir: 1, c: (c0 + 1) % 6 }, score = 0, combo = 0, cam = 0, dead = false, pieces = [], floats = [];
    const speed = () => Math.min(400, 150 + score * 6);
    const baseY = () => H - 90 + cam;
    function drop() {
      if (dead) return; ctx.started();
      const top = layers[layers.length - 1], lo = Math.max(cur.x, top.x), hi = Math.min(cur.x + cur.w, top.x + top.w), ov = hi - lo;
      if (ov <= 2) { dead = true; pieces.push({ x: cur.x, w: cur.w, y: -(layers.length) * BH, vy: 0, c: cur.c, r: 0, vr: .8 }); snd.beep(120, .3, .25); haptic('warn'); setTimeout(() => ctx.over(score), 800); return; }
      let note = '';
      if (Math.abs(cur.x - top.x) <= 5) { cur.x = top.x; cur.w = top.w; combo++; note = combo > 2 ? 'PERFECT x' + combo : 'PERFECT'; if (combo >= 3) cur.w = Math.min(200, cur.w + 8); haptic('pop'); snd.beep(520 + combo * 40, .12, .25); }
      else {
        combo = 0; const cutL = lo - cur.x, cutR = cur.x + cur.w - hi;
        if (cutL > 0) pieces.push({ x: cur.x, w: cutL, y: -layers.length * BH, vy: 0, c: cur.c, r: 0, vr: -.5 });
        if (cutR > 0) pieces.push({ x: hi, w: cutR, y: -layers.length * BH, vy: 0, c: cur.c, r: 0, vr: .5 });
        cur.x = lo; cur.w = ov; haptic('tick'); snd.beep(260 + score * 12, .07, .2);
      }
      layers.push({ x: cur.x, w: cur.w, c: cur.c }); score++; ctx.score(score);
      if (note) floats.push({ t: note, y: -layers.length * BH, life: 0 });
      const fromLeft = score % 2 === 0; cur = { x: fromLeft ? 0 : W - cur.w, w: cur.w, dir: fromLeft ? 1 : -1, c: (cur.c + 1) % 6 };
    }
    const stop = loop(dt => {
      if (!dead) { cur.x += cur.dir * speed() * dt; if (cur.x < 0) { cur.x = 0; cur.dir = 1; } if (cur.x + cur.w > W) { cur.x = W - cur.w; cur.dir = -1; } }
      const want = Math.max(0, (layers.length - 7) * BH); cam += (want - cam) * Math.min(1, dt * 6);
      paper(g, W, H);
      const draw = (x, w, y, c, a = 1) => { g.globalAlpha = a; g.fillStyle = 'rgba(32,33,30,.16)'; g.fillRect(x + 5, y + 6, w, BH); g.fillStyle = COL[c]; g.fillRect(x, y, w, BH); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x, y, w, 6); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x, y + BH - 5, w, 5); g.strokeStyle = '#20211e'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 2, BH - 2); g.globalAlpha = 1; };
      layers.forEach((L, i) => { const y = baseY() - i * BH; if (y > -BH && y < H) draw(L.x, L.w, y, L.c); });
      if (!dead) draw(cur.x, cur.w, baseY() - layers.length * BH, cur.c);
      pieces = pieces.filter(p => { p.vy += 1500 * dt; p.y += p.vy * dt; return baseY() + p.y < H + 60; });
      pieces.forEach(p => { const y = baseY() + p.y; g.save(); g.translate(p.x + p.w / 2, y + BH / 2); g.rotate(p.r += p.vr * dt); g.translate(-p.w / 2, -BH / 2); g.globalAlpha = .9; g.fillStyle = COL[p.c]; g.fillRect(0, 0, p.w, BH); g.strokeStyle = '#20211e'; g.lineWidth = 2; g.strokeRect(1, 1, p.w - 2, BH - 2); g.restore(); });
      floats = floats.filter(f => (f.life += dt) < .9);
      floats.forEach(f => { g.globalAlpha = 1 - f.life / .9; g.fillStyle = '#20211e'; g.font = '400 22px "Archivo Black", Arial Black, sans-serif'; g.textAlign = 'center'; g.fillText(f.t, W / 2, baseY() + f.y - 20 - f.life * 40); g.globalAlpha = 1; });
    });
    return { tap: drop, destroy: stop };
  }

  /* =========================================================
     GAME 2 · PAPER PLANE DASH: tap to flap, glide between rolled-paper pillars
     ========================================================= */
  function planeGame(stage, ctx) {
    const W = 360, H = 600, g = mkCanvas(stage, W, H), rnd = ctx.rng, PX = 96, PW = 54, SPACING = 210;
    let y = 290, vy = 0, rot = 0, score = 0, started = false, dead = false, t = 0, pillars = [], dist = 0, spin = 0;
    const gap = () => Math.max(138, 186 - score * 1.1), spd = () => 140 + Math.min(70, score * 2.2);
    const spawn = x => { const gp = gap(); pillars.push({ x, gy: 70 + gp / 2 + rnd() * (H - 140 - gp - 30), gp, passed: false }); };
    spawn(W + 120); while (pillars[pillars.length - 1].x < W + 400) spawn(pillars[pillars.length - 1].x + SPACING);
    function flap() { if (dead) return; if (!started) { started = true; ctx.started(); } vy = -430; haptic('tick'); snd.beep(700, .04, .12); }
    const hitRect = (rx, ry, rw, rh) => { const cx = Math.max(rx, Math.min(PX, rx + rw)), cy = Math.max(ry, Math.min(y, ry + rh)); return (PX - cx) ** 2 + (y - cy) ** 2 < 11 * 11; };
    const stop = loop(dt => {
      t += dt;
      if (!started) y = 290 + Math.sin(t * 4) * 9;
      else if (!dead) {
        vy = Math.min(620, vy + 1500 * dt); y += vy * dt; rot += ((Math.max(-.6, Math.min(.9, vy / 520))) - rot) * Math.min(1, dt * 10);
        const s = spd() * dt; dist += s; pillars.forEach(p => p.x -= s);
        if (pillars[0].x < -PW - 10) pillars.shift(); while (pillars[pillars.length - 1].x < W + 100) spawn(pillars[pillars.length - 1].x + SPACING);
        pillars.forEach(p => { if (!p.passed && p.x + PW < PX - 11) { p.passed = true; score++; ctx.score(score); haptic('tick'); snd.beep(880 + (score % 6) * 60, .07, .18); } });
        if (y > H - 30 || y < 6 || pillars.some(p => hitRect(p.x, 0, PW, p.gy - p.gp / 2) || hitRect(p.x, p.gy + p.gp / 2, PW, H))) { dead = true; haptic('warn'); snd.beep(110, .3, .25); setTimeout(() => ctx.over(score), 650); }
      } else { vy = Math.min(900, vy + 1700 * dt); y = Math.min(H - 24, y + vy * dt); spin += dt * 9; }
      paper(g, W, H);
      g.fillStyle = 'rgba(32,33,30,.07)'; for (let i = 0; i < 4; i++) { const cx = ((i * 190 - dist * (.3 + i * .08)) % (W + 160) + W + 160) % (W + 160) - 80, cy = 70 + i * 110; g.beginPath(); g.ellipse(cx, cy, 46, 15, 0, 0, 6.3); g.ellipse(cx + 26, cy - 8, 28, 13, 0, 0, 6.3); g.fill(); }
      pillars.forEach(p => {
        const top = p.gy - p.gp / 2, bot = p.gy + p.gp / 2;
        const tube = (x, y0, h, capY) => { g.fillStyle = 'rgba(32,33,30,.16)'; g.fillRect(x + 5, y0 + 5, PW, h); g.fillStyle = '#ff641f'; g.fillRect(x, y0, PW, h); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x + 6, y0, 8, h); g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(x + PW - 10, y0, 10, h); g.strokeStyle = '#20211e'; g.lineWidth = 2; g.strokeRect(x + 1, y0 + 1, PW - 2, h - 2); g.fillStyle = '#c5ef41'; g.fillRect(x - 5, capY, PW + 10, 16); g.strokeRect(x - 4, capY + 1, PW + 8, 14); };
        tube(p.x, -4, top + 4, top - 16); tube(p.x, bot, H - bot, bot);
      });
      g.fillStyle = '#20211e'; g.fillRect(0, H - 24, W, 24); g.fillStyle = '#c5ef41'; for (let x = -((dist * 1) % 40); x < W; x += 40) g.fillRect(x, H - 14, 22, 4);
      g.save(); g.translate(PX, y); g.rotate(dead ? spin : rot);
      g.fillStyle = 'rgba(32,33,30,.18)'; g.beginPath(); g.moveTo(-20 + 4, 4); g.lineTo(22 + 4, -5); g.lineTo(-6 + 4, 12); g.closePath(); g.fill();
      g.fillStyle = '#fffdf8'; g.strokeStyle = '#20211e'; g.lineWidth = 2; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-22, -9); g.lineTo(24, 0); g.lineTo(-22, 9); g.lineTo(-12, 0); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#e7dbc6'; g.beginPath(); g.moveTo(-12, 0); g.lineTo(24, 0); g.lineTo(-22, 9); g.closePath(); g.fill(); g.stroke(); g.restore();
      if (!started) { g.fillStyle = 'rgba(32,33,30,.7)'; g.font = '400 14px "Space Mono", monospace'; g.textAlign = 'center'; g.fillText('TAP TO FLAP', W / 2, H / 2 + 90); }
    });
    return { tap: flap, destroy: stop };
  }

  /* =========================================================
     GAME 3 · FOLD SEQUENCE: watch the paper tiles, repeat them, one longer each round
     ========================================================= */
  function foldGame(stage, ctx) {
    const COL = ['#ff641f', '#c5ef41', '#c6c3ff', '#b9ecd7'], NOTE = [330, 392, 494, 587], rnd = ctx.rng;
    stage.innerHTML = `<div class="fold">${COL.map((c, i) => `<button type="button" style="--c:${c}" data-i="${i}" aria-label="Tile ${i + 1}"></button>`).join('')}<span class="fold__msg" id="foldMsg">Watch…</span></div>`;
    const tiles = $$('.fold button', stage), msg = $('#foldMsg', stage), seq = [], timers = [];
    let round = 0, idx = 0, accept = false, dead = false;
    const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); };
    const flash = (i, ms) => { tiles[i].classList.add('lit'); snd.beep(NOTE[i], ms / 1000, .22); later(() => tiles[i].classList.remove('lit'), ms); };
    function next() {
      if (dead) return; round++; idx = 0; accept = false; seq.push(rnd() * 4 | 0); msg.textContent = 'Watch…'; tiles.forEach(t => t.disabled = true);
      const on = Math.max(210, 460 - round * 16), off = 150; let at = 650;
      seq.forEach(i => { later(() => flash(i, on), at); at += on + off; });
      later(() => { accept = true; msg.textContent = 'Your turn'; tiles.forEach(t => t.disabled = false); haptic('tick'); }, at);
    }
    function press(i) {
      if (!accept || dead) return; flash(i, 160); haptic('tick');
      if (i !== seq[idx]) { dead = true; accept = false; msg.textContent = 'Oops'; haptic('warn'); snd.beep(110, .3, .25); later(() => ctx.over(round - 1), 700); return; }
      if (++idx === seq.length) { accept = false; ctx.score(round); msg.textContent = 'Nice!'; haptic('pop'); later(next, 700); }
    }
    stage.addEventListener('pointerdown', e => { const b = e.target.closest('.fold button'); if (b) { e.preventDefault(); press(+b.dataset.i); } });
    ctx.started(); next();
    return { tap() {}, noTap: true, destroy() { dead = true; timers.forEach(clearTimeout); } };
  }

  const ART = {
    stack: '<svg viewBox="0 0 200 140" aria-hidden="true"><g stroke="#20211e" stroke-width="3" stroke-linejoin="round"><rect x="30" y="102" width="140" height="26" fill="#fffdf8"/><rect x="42" y="76" width="116" height="26" fill="#c6c3ff"/><rect x="56" y="50" width="92" height="26" fill="#b9ecd7"/><rect x="74" y="24" width="64" height="26" fill="#ff641f"/></g><path d="M150 12 l4 10 10 1 -8 7 3 10 -9 -6 -9 6 3 -10 -8 -7 10 -1Z" fill="#20211e"/></svg>',
    plane: '<svg viewBox="0 0 200 140" aria-hidden="true"><g stroke="#20211e" stroke-width="3" stroke-linejoin="round"><rect x="20" y="70" width="34" height="70" fill="#ff641f"/><rect x="14" y="62" width="46" height="14" fill="#c5ef41"/><rect x="146" y="0" width="34" height="56" fill="#ff641f"/><rect x="140" y="48" width="46" height="14" fill="#c5ef41"/><path d="M62 40 L134 62 L62 84 L82 62Z" fill="#fffdf8"/><path d="M82 62 L134 62 L62 84Z" fill="#e7dbc6"/></g></svg>',
    race: '<svg viewBox="0 0 200 140" aria-hidden="true"><rect x="34" y="12" width="6" height="120" fill="#20211e"/><path d="M40 18 H162 V86 H40Z" fill="#fffdf8"/><g fill="#20211e"><rect x="40" y="18" width="20" height="17"/><rect x="81" y="18" width="20" height="17"/><rect x="121" y="18" width="20" height="17"/><rect x="60" y="35" width="21" height="17"/><rect x="101" y="35" width="20" height="17"/><rect x="141" y="35" width="21" height="17"/><rect x="40" y="52" width="20" height="17"/><rect x="81" y="52" width="20" height="17"/><rect x="121" y="52" width="20" height="17"/><rect x="60" y="69" width="21" height="17"/><rect x="101" y="69" width="20" height="17"/><rect x="141" y="69" width="21" height="17"/></g><path d="M40 18 H162 V86 H40Z" fill="none" stroke="#20211e" stroke-width="3"/></svg>',
    fold: '<svg viewBox="0 0 200 140" aria-hidden="true"><g stroke="#20211e" stroke-width="3" stroke-linejoin="round"><rect x="34" y="12" width="64" height="56" rx="10" fill="#ff641f"/><rect x="104" y="12" width="64" height="56" rx="10" fill="#c5ef41"/><rect x="34" y="74" width="64" height="56" rx="10" fill="#c6c3ff"/><rect x="104" y="74" width="64" height="56" rx="10" fill="#b9ecd7"/></g><path d="M34 12 H98 L34 68Z" fill="rgba(255,255,255,.4)"/></svg>'
  };
  const GAMES = [
    { id: 'stack', no: '01', name: 'Stack the Sheets', unit: 'layers', color: 'var(--acid)', blurb: 'Drop each sheet on the last. Whatever hangs over is cut off, and a perfect landing keeps your width. How high can you go?', hint: 'Tap anywhere (or press Space) to drop the sheet', mount: stackGame },
    { id: 'plane', no: '02', name: 'Paper Plane Dash', unit: 'pillars', color: 'var(--purple)', blurb: 'Tap to flap and glide through the gaps between rolled-paper pillars. It speeds up, and so does your heartbeat.', hint: 'Tap anywhere (or press Space) to flap', mount: planeGame },
    { id: 'fold', no: '03', name: 'Fold Sequence', unit: 'rounds', color: 'var(--mint)', blurb: 'Watch the paper tiles light up, then repeat the pattern. One longer every round. Trust your ears as much as your eyes.', hint: 'Watch first, then tap the tiles in the same order', mount: foldGame },
    { id: 'race', no: '04', name: 'Paper Grand Prix', unit: 'speed pts', color: 'var(--orange)', href: 'race/index.html', blurb: 'Launch on green, shift in the green, beat the studio bot. The faster your finish, the more points you bank. Every paper car drives the same.' }
  ];
  const G = id => GAMES.find(x => x.id === id);

  /* ---------- the cup: clock + prizes ---------- */
  function renderCup() {
    $('#seasonName').textContent = SEASON.name;
    $('#prizes').innerHTML = SEASON.prizes.map(p => `<li><i>${p.rank}</i><div><b>${p.title}</b><small>${p.note}</small></div></li>`).join('');
  }
  function tick() {
    const s = Math.max(0, (new Date(SEASON.ends) - Date.now()) / 1000 | 0), u = { d: s / 86400 | 0, h: s % 86400 / 3600 | 0, m: s % 3600 / 60 | 0, s: s % 60 }, pad = v => String(v).padStart(2, '0');
    $$('#seasonClock b').forEach(b => b.textContent = pad(u[b.dataset.u]));
  }

  /* ---------- game cards ---------- */
  function renderGames() {
    $('#gameGrid').innerHTML = GAMES.map(g => {
      const inner = `
        <div class="pg__art">${ART[g.id]}</div>
        <div class="pg__txt"><span class="mono">Game ${g.no}</span><h3>${g.name}</h3><p>${g.blurb}</p></div>
        <div class="pg__foot"><div class="pg__best"><span class="mono">Your best</span><b data-best="${g.id}">${BEST[g.id] || '—'}</b></div><span class="pg__go">${g.href ? 'Race' : 'Play'} <span class="arr">→</span></span></div>`;
      return g.href ? `<a class="pg" href="${url(g.href)}" style="--c:${g.color}" data-cursor="Race">${inner}</a>` : `<button class="pg" data-g="${g.id}" style="--c:${g.color}" data-cursor="Play">${inner}</button>`;
    }).join('');
  }
  const paintBest = () => GAMES.forEach(g => { const el = $(`[data-best="${g.id}"]`); if (el) el.textContent = BEST[g.id] || '—'; });

  /* ---------- the arena ---------- */
  const arena = $('#arena'), stage = $('#arenaStage'), over = $('#arenaOver');
  arena.inert = true;
  let cur = null, tStart = 0, challenge = null, lastFocus = null;

  function openGame(id, o = {}) {
    const g = G(id); if (!g) return;
    closeGame(true);
    lastFocus = document.activeElement;
    const seed = o.seed || newSeed();
    $('#arenaKick').textContent = `Game ${g.no}`; $('#arenaTitle').textContent = g.name; $('#arenaScore').textContent = '0';
    $('#arenaHint').textContent = o.beat ? `${o.by || 'A friend'} scored ${o.beat}. Beat it!` : g.hint;
    over.hidden = true; stage.innerHTML = ''; tStart = performance.now();
    arena.inert = false; arena.classList.add('on'); arena.setAttribute('aria-hidden', 'false'); DIYcore.lockScroll(true);
    cur = { g, seed, done: false, score: 0, beat: o.beat || 0, by: o.by };
    const ctx = {
      seed, rng: mulberry(hashSeed(seed)),
      started: () => { if (!cur.began) { cur.began = true; tStart = performance.now(); } },
      score: n => { cur.score = n; $('#arenaScore').textContent = n; },
      over: n => finish(n)
    };
    cur.inst = g.mount(stage, ctx);
    snd.swish(.25, .3, 600, 2600);
    setTimeout(() => $('#arenaClose').focus({ preventScroll: true }), 60);
  }
  function closeGame(silent) {
    if (cur && cur.inst) cur.inst.destroy();
    cur = null; stage.innerHTML = '';
    if (!arena.classList.contains('on')) return;
    if (arena.contains(document.activeElement)) document.activeElement.blur();
    arena.classList.remove('on'); arena.setAttribute('aria-hidden', 'true'); arena.inert = true; DIYcore.lockScroll(false);
    if (!silent) { loadBoard(tab); lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true }); }
  }

  async function finish(score) {
    if (!cur || cur.done) return; cur.done = true;
    const g = cur.g, ms = Math.max(1, Math.round(performance.now() - tStart)), first = score > (BEST[g.id] || 0);
    if (cur.inst) cur.inst.destroy();
    $('#overKick').textContent = g.name; $('#overScore').textContent = score;
    const line = $('#overLine'); over.hidden = false; $('#overName').hidden = true;
    if (score < 1) { line.textContent = 'No score this time. Give it another go.'; return; }
    if (first) { saveBest(g.id, score); paintBest(); haptic('win'); confetti(innerWidth / 2, innerHeight * .35, 50, { quiet: 1 }); }
    const beat = cur.beat ? (score > cur.beat ? `You beat ${cur.by || 'your friend'}'s ${cur.beat}! ` : score === cur.beat ? `A tie with ${cur.by || 'your friend'}. ` : `${cur.by || 'Your friend'} had ${cur.beat}. `) : '';
    const post = async () => {
      line.textContent = beat + 'Posting your score…';
      const res = await submit(g.id, score, ms);
      line.textContent = beat + res;
    };
    if (!P.name) {
      line.textContent = beat + (first ? 'New personal best! ' : '') + 'Pick a handle to join the leaderboard.';
      const f = $('#overName'); f.hidden = false; f.name.value = '';
      f.onsubmit = e => { e.preventDefault(); const n = cleanName(f.name.value); if (n.length < 2) { f.name.focus(); return; } P.name = n; savePlayer(); fillPlayerForm(); f.hidden = true; post(); };
      setTimeout(() => f.name.focus({ preventScroll: true }), 80);
    } else post();
  }

  $('#gameGrid').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) openGame(b.dataset.g); });
  $('#arenaClose').addEventListener('click', () => closeGame());
  $('#overAgain').addEventListener('click', () => cur && openGame(cur.g.id));
  $('#overBoard').addEventListener('click', e => { e.preventDefault(); closeGame(); const t = $('#board'); window.lenis ? lenis.scrollTo(t, { offset: -90 }) : t.scrollIntoView({ behavior: 'smooth' }); });
  $('#overShare').addEventListener('click', async () => {
    if (!cur) return;
    const u = new URL(location.href); u.search = ''; u.hash = ''; u.searchParams.set('g', cur.g.id); u.searchParams.set('seed', cur.seed); u.searchParams.set('beat', cur.score); u.searchParams.set('by', P.name || 'A friend');
    const text = `I scored ${cur.score} in ${cur.g.name} at the Do It Yar Paper Arcade. Same course for you. Beat me:`;
    try { if (navigator.share) await navigator.share({ title: 'Paper Arcade challenge', text, url: u.href }); else { await navigator.clipboard.writeText(text + ' ' + u.href); toast('Challenge link copied. Send it to a friend.', '🎮'); } } catch (er) {}
  });
  addEventListener('keydown', e => {
    if (!arena.classList.contains('on')) return;
    if (e.key === 'Escape') return closeGame();
    if ((e.code === 'Space' || e.key === 'Enter' || e.key === 'ArrowUp') && cur && !cur.done && !(e.target.closest && e.target.closest('input,button'))) { e.preventDefault(); cur.inst && !cur.inst.noTap && cur.inst.tap(); }
  });
  stage.addEventListener('pointerdown', e => { if (cur && !cur.done && cur.inst && !cur.inst.noTap) { e.preventDefault(); cur.inst.tap(); } });

  /* ---------- player card ---------- */
  const pf = $('#playerForm'), pm = $('#playerMsg');
  function fillPlayerForm() { pf.name.value = P.name || ''; pf.email.value = P.email || ''; pf.phone.value = P.phone || ''; pf.consent.checked = !!P.consent; }
  pf.addEventListener('submit', e => {
    e.preventDefault();
    const name = cleanName(pf.name.value), email = pf.email.value.trim(), phone = pf.phone.value.replace(/[^\d+]/g, '');
    const bad = name.length < 2 ? 'Pick a handle with at least 2 characters.' : email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? 'That email doesn’t look right.' : phone && !/^\+?\d{10,13}$/.test(phone) ? 'That phone number looks short: 10 digits, or with +91.' : (email || phone) && !pf.consent.checked ? 'Tick the box so we’re allowed to contact you if you win.' : '';
    pm.classList.toggle('bad', !!bad); if (bad) { pm.textContent = bad; return; }
    P.name = name; P.email = email; P.phone = phone; P.consent = !!(pf.consent.checked && (email || phone)); savePlayer();
    pm.textContent = P.consent ? 'Saved. You’re prize-eligible ✓' : 'Saved ✓ (add an email or phone to be prize-eligible)'; haptic('pop');
    pf.name.value = name;
  });
  fillPlayerForm();

  /* ---------- leaderboard ---------- */
  let tab = 'all', boardSeq = 0;
  const TABS = [{ id: 'all', label: 'All-round' }, ...GAMES.map(g => ({ id: g.id, label: g.name }))];
  $('#boardTabs').innerHTML = TABS.map(t => `<button role="tab" data-t="${t.id}" aria-selected="${t.id === tab}">${t.label}</button>`).join('');
  $('#boardTabs').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (!b) return; tab = b.dataset.t; $$('#boardTabs button').forEach(x => x.setAttribute('aria-selected', x === b)); haptic('tick'); loadBoard(tab); });
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const unit = id => id === 'all' ? 'pts' : G(id).unit;

  function paintRows(id, rows, me, note) {
    const box = $('#rows');
    if (!rows.length) { box.innerHTML = `<li class="pl-empty"><b>${note ? 'Be the first.' : 'No scores yet.'}</b><span>${note || 'Play a game and your name goes up here first.'}</span></li>`; return; }
    const row = (r, i) => `<li class="pl-row${r.me ? ' me' : ''}"><b>${r.rank}</b><span class="pl-row__name">${esc(r.name)}</span>${id === 'all' && r.rank <= 3 && SEASON.prizes[r.rank - 1] ? `<span class="pl-row__prize">${esc(SEASON.prizes[r.rank - 1].title)}</span>` : '<span></span>'}<span class="pl-row__score">${r.score}<small class="mono"> ${unit(id)}</small></span></li>`;
    box.innerHTML = rows.map(row).join('') + (me && !rows.some(r => r.me) ? `<li class="pl-row me"><b>${me.rank}</b><span class="pl-row__name">${esc(P.name || 'You')}</span><span></span><span class="pl-row__score">${me.score}<small class="mono"> ${unit(id)}</small></span></li>` : '');
  }
  async function loadBoard(id) {
    const my = ++boardSeq, box = $('#rows'), note = $('#boardNote');
    box.innerHTML = '<li class="pl-row pl-row--skel"></li>'.repeat(6); // never an empty box while it loads
    let online = false;
    try {
      const { body: r } = await api(`leaderboard?game=${id}&limit=25&pid=${encodeURIComponent(P.pid)}`);
      if (my !== boardSeq) return;
      if (r.ok) { online = true; if (r.season) { SEASON = r.season; renderCup(); } paintRows(id, r.board, r.me); note.textContent = `${r.total} player${r.total === 1 ? '' : 's'} this season. The all-round board adds up your best points in every game.`; }
    } catch (e) {}
    if (my !== boardSeq || online) return;
    // not connected (or offline): show this device's own scores, honestly labelled
    const local = id === 'all' ? GAMES.reduce((s, g) => s + (BEST[g.id] ? pts(g.id, BEST[g.id]) : 0), 0) : BEST[id] || 0;
    paintRows(id, local ? [{ rank: 1, name: P.name || 'You', score: local, me: true }] : [], null, 'The global leaderboard switches on very soon. Your scores are saved on this device and will count.');
    note.textContent = 'Showing this device only for now.';
  }

  /* ---------- a friend's challenge link ---------- */
  function readChallenge() {
    const q = new URLSearchParams(location.search), g = G(q.get('g')); if (!g) return;
    const seed = (q.get('seed') || '').slice(0, 12), beat = Math.max(0, parseInt(q.get('beat')) || 0), by = cleanName(q.get('by')) || 'A friend';
    challenge = { g, seed, beat, by };
    const el = $('#challenge'); el.hidden = false;
    el.innerHTML = `<div><span class="mono">Challenge</span><br><b>${esc(by)} scored ${beat} in ${esc(g.name)}.</b></div><button class="btn" type="button" id="chPlay">Beat it <span class="arr">→</span></button>`;
    $('#chPlay').addEventListener('click', () => openGame(g.id, { seed, beat, by }));
  }

  renderCup(); renderGames(); readChallenge(); tick(); setInterval(tick, 1000); loadBoard('all');
  if (window.gsap && window.ScrollTrigger && !DIYcore.reduce) {
    DIYcore.revealed.then(() => {
      gsap.from('.pl-hero h1, .pl-hero__copy > *', { y: 40, opacity: 0, stagger: .08, duration: .8, ease: 'power3.out', clearProps: 'transform,opacity' });
      gsap.from('.pl-cup', { y: 60, opacity: 0, rotate: 5, duration: 1, ease: 'back.out(1.3)', clearProps: 'transform,opacity' });
    });
    gsap.set('.pg', { opacity: 1 });
    ScrollTrigger.batch('.pg, .pl-rules article', { start: 'top 92%', once: true, onEnter: b => gsap.from(b, { y: 50, opacity: 0, stagger: .08, duration: .7, ease: 'power3.out', clearProps: 'transform,opacity' }) });
  }
})();
