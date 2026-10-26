/* Paper Grand Prix — vs bot, same-screen duel, and online races with a friend (peer-to-peer) */
(function () {
  const { $, $$, url, reward, toast, confetti, pop, snd, byId, store, reduce } = DIYcore;
  const cars = DIY.cars;
  const hasG = !!window.gsap;
  const params = new URLSearchParams(location.search);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const now = () => performance.now() / 1000;

  /* ---------- the driving model (identical for every car: timing wins, not wallets) ---------- */
  const RATE = [.95, .78, .64, .54, .46];      // how fast the needle climbs in each gear
  const TOP = [.085, .125, .16, .19, .215];     // track lengths per second at full revs
  const ZONE = [.74, .9];                        // the green shift window
  const DIFF = { chill: { sd: .14, react: [.32, .5] }, pro: { sd: .07, react: [.2, .3] }, legend: { sd: .028, react: [.15, .2] } };
  const sim = () => ({ x: 0, v: 0, g: 0, rpm: 0, launched: false, t: null, perfect: 0, react: null, early: false, hold: 0, bog: 0, boost: 0, tx: 0 });

  let mode = 'bot', diff = 'pro', phase = 'idle', goAt = 0, raf = 0, last = 0, sims = { A: sim(), B: sim() }, bot = null, lightsT = [];
  const validCar = id => byId(id) ? id : 'nissan-skyline-r35';
  const P = { A: { car: validCar(store.get('raceA', 'nissan-skyline-r35')), name: 'You' }, B: { car: validCar(store.get('raceB', 'mazda-787b')), name: 'Studio bot' } };

  /* =========================================================
     UI: slots, picker, modes
     ========================================================= */
  function setCar(slot, id) {
    const c = byId(validCar(id));
    P[slot].car = c.id;
    $('#slotCar' + slot).innerHTML = `<img src="${url(c.side)}" alt="${c.name} side profile" width="960" height="340">`;
    $('#slotName' + slot).textContent = c.name;
    const img = $('#car' + slot);
    img.alt = c.name;
    img.onload = () => { measure(); place(); };
    img.src = url(c.side);
    if (slot === 'A' || mode !== 'online') store.set('race' + slot, c.id);
    if (slot === 'A' && conn) send({ type: 'car', car: c.id });
  }
  let pickFor = 'A';
  function openPicker(slot) {
    pickFor = slot;
    $('#pickTitle').textContent = slot === 'A' ? 'Pick your ride' : mode === 'duel' ? 'Player 2, pick your ride' : 'Pick the bot’s ride';
    $('#pickGrid').innerHTML = cars.map(c => `<button data-c="${c.id}" aria-pressed="${P[slot].car === c.id}"><img src="${url(c.side)}" alt="" loading="lazy"><b>${c.model}${c.sub ? ' ' + c.sub : ''}</b><span>${c.make} · ${c.tag}</span></button>`).join('');
    $('#picker').classList.add('on'); DIYcore.lockScroll(true);
    setTimeout(() => $('#pickClose').focus(), 50);
  }
  const closePicker = () => { $('#picker').classList.remove('on'); DIYcore.lockScroll(false); };
  $('#pickGrid').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (!b) return; setCar(pickFor, b.dataset.c); closePicker(); });
  $('#pickClose').addEventListener('click', closePicker);
  $('#picker').addEventListener('click', e => { if (e.target.id === 'picker') closePicker(); });
  $$('[data-pick]').forEach(b => b.addEventListener('click', () => { if (phase === 'count' || phase === 'go') return; openPicker(b.dataset.pick); }));

  $$('#diff button').forEach(b => b.addEventListener('click', () => { diff = b.dataset.d; $$('#diff button').forEach(x => x.setAttribute('aria-checked', x === b)); }));

  function setMode(m) {
    if (phase === 'count' || phase === 'go') abort();
    mode = m;
    $$('.rx-modes button').forEach(b => b.setAttribute('aria-selected', b.dataset.mode === m));
    const bt = m === 'bot', du = m === 'duel', on = m === 'online';
    $('#diff').hidden = !bt;
    $('#pickB').hidden = on;
    $('#lobby').hidden = !on;
    $('#goBtn').hidden = on;
    $('#hudB .shift').hidden = !du;
    $('#whoB').textContent = bt ? 'Studio bot' : du ? 'Player 2' : (conn ? 'Your friend' : 'Waiting for a friend…');
    $('#hudBName').textContent = bt ? 'BOT' : du ? 'P2' : 'FRIEND';
    $('#tagB').textContent = bt ? 'BOT' : du ? 'P2' : 'FRIEND';
    $('#hudA .shift small').textContent = du ? 'A / tap' : 'Space / A / tap';
    $('#keysHint').textContent = du ? 'Player 1 presses A, player 2 presses L (or tap your SHIFT button). Launch on green, then shift in the green.' : on ? 'Create a room, send the link, both hit ready. The lights start together on both screens.' : 'Tap SHIFT (or press Space) to launch on green, then every time the needle hits the green.';
    P.B.name = bt ? 'Studio bot' : du ? 'Player 2' : P.B.name;
    if (on && params.get('room') && !conn && !peer) join(params.get('room'));
    const u = new URL(location.href); u.searchParams.set('mode', m); if (m !== 'online') u.searchParams.delete('room'); history.replaceState(null, '', u);
  }
  $$('.rx-modes button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

  /* =========================================================
     TRACK geometry + rendering (cars face left: start on the right, finish on the left)
     ========================================================= */
  const G = { A: { w: 0 }, B: { w: 0 }, sx: 0, fx: 0 };
  function measure() {
    const tr = $('#track').getBoundingClientRect();
    ['A', 'B'].forEach(id => { G[id].w = $('#car' + id).getBoundingClientRect().width; });
    const cw = Math.max(G.A.w, G.B.w) || tr.width * .2;
    G.fx = Math.round(tr.width * .03 + 16);
    G.sx = Math.round(tr.width - cw - 18);
    const t = $('#track');
    t.style.setProperty('--sx', G.sx + 'px'); t.style.setProperty('--fx', G.fx + 'px');
    $('.track__start').style.left = G.sx + 'px';
    $('.track__marks').innerHTML = [.25, .5, .75].map(p => `<i style="left:${Math.round(G.sx - (G.sx - G.fx) * p)}px"><span>${p === .25 ? '¼' : p === .5 ? '½' : '¾'}</span></i>`).join('');
  }
  function place() {
    ['A', 'B'].forEach(id => {
      const s = sims[id], left = G.sx - s.x * (G.sx - G.fx);
      const shake = (phase === 'go' && s.launched && s.t == null) ? Math.sin(performance.now() / 28 + (id === 'A' ? 0 : 2)) * Math.min(2, s.v * 14) : 0;
      $('#car' + id).style.transform = `translate3d(${left.toFixed(1)}px, ${shake.toFixed(2)}px, 0)`;
    });
  }
  function tach(id) {
    const s = sims[id], box = $('#hud' + id);
    box.querySelector('.needle').style.transform = `rotate(${(-90 + s.rpm * 180).toFixed(1)}deg)`;
    box.querySelector('.gear').textContent = s.launched ? s.g + 1 : '–';
  }
  function label(id, text, bad) {
    const box = $('#hud' + id); box.querySelector('.q').textContent = text;
    box.querySelector('.q').style.color = bad ? '#ff7d3f' : '';
    const r = $('#car' + id).getBoundingClientRect();
    if (r.width && !reduce) pop(text + (bad ? '' : '!'), r.left + r.width * .35, r.top - 8, { size: 'clamp(18px, 2vw, 30px)' });
  }
  function puff(id) {
    if (!hasG || reduce) return;
    const lane = $('#lane' + id), car = $('#car' + id), lr = lane.getBoundingClientRect(), cr = car.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
      const p = document.createElement('i'); p.className = 'puff';
      p.style.left = (cr.right - lr.left - 18) + 'px'; p.style.top = (cr.bottom - lr.top - 22) + 'px';
      lane.append(p);
      gsap.fromTo(p, { scale: .3, opacity: .9 }, { x: rand(20, 90), y: rand(-30, 4), scale: rand(1.2, 2.4), opacity: 0, duration: rand(.6, 1.1), ease: 'power2.out', onComplete: () => p.remove() });
    }
  }

  /* =========================================================
     ENGINES: each car's real recording, looped, its pitch riding the rev needle.
     Yours sits up front in the mix; the rival is quieter so the two never turn into mush.
     ========================================================= */
  const ENG = { A: null, B: null };
  const engVol = id => mode === 'duel' ? .75 : id === 'A' ? 1 : .4;
  function engineOn(id) {
    if (ENG[id]) return;
    const ph = ENG[id] = { stop() { this.dead = 1; }, rate() {}, vol() {} }; // a placeholder while the clip decodes, so we never start two
    snd.engine(byId(P[id].car), { vol: engVol(id), rate: .8, onstart: h => { if (ENG[id] !== ph || ph.dead) return h.stop(.05); ENG[id] = h; } });
  }
  function engineOff(id, f = .9) { if (ENG[id]) { ENG[id].stop(f); ENG[id] = null; } }
  function engines() {
    ['A', 'B'].forEach(id => {
      const e = ENG[id], s = sims[id];
      if (!e && s.launched && s.t == null && phase === 'go') return engineOn(id);
      if (!e) return;
      if (s.t != null) return engineOff(id, 1.4);
      e.rate(.74 + s.rpm * .5 + s.g * .035, .05);
    });
  }

  /* =========================================================
     RACE
     ========================================================= */
  function quality(r) { if (r >= ZONE[0] && r <= ZONE[1]) return 'perfect'; if ((r >= .6 && r < ZONE[0]) || (r > ZONE[1] && r < .99)) return 'good'; return r >= .99 ? 'late' : 'early'; }
  function press(id) {
    const s = sims[id]; if (!s || s.t != null) return;
    if (phase === 'count') { if (!s.early) { s.early = true; s.hold = .6; label(id, 'JUMP START', true); } return; }
    if (phase !== 'go') return;
    const t = now();
    if (!s.launched) {
      if (t < goAt + s.hold) return;
      s.launched = true; s.react = t - goAt; s.rpm = .35;
      if (s.react < .25 && !s.early) { s.boost = .9; label(id, 'GREAT LAUNCH'); } else label(id, 'LAUNCH');
      puff(id);
      engineOn(id);
      return;
    }
    if (s.g >= 4) return;
    const q = quality(s.rpm);
    s.g++; s.rpm = { perfect: .55, good: .45, late: .5, early: .28 }[q];
    if (q === 'early') s.bog = .35;
    if (q === 'perfect') { s.perfect++; s.boost = .3; }
    label(id, q.toUpperCase(), q === 'early' || q === 'late');
    const e = ENG[id]; if (e) { e.vol(engVol(id) * .3, .012); setTimeout(() => e.vol(engVol(id), .05), q === 'early' ? 240 : 110); } // the lift off the throttle on every shift
  }
  function step(s, dt) {
    if (!s.launched || s.t != null) return;
    let rate = RATE[s.g]; if (s.bog > 0) { s.bog -= dt; rate *= .5; }
    s.rpm = Math.min(1, s.rpm + dt * rate);
    let target = TOP[s.g] * (.3 + .7 * s.rpm);
    if (s.rpm >= 1) target *= .9;
    if (s.boost > 0) { s.boost -= dt; target *= 1.07; }
    s.v += (target - s.v) * Math.min(1, dt * 3.2);
    s.x = Math.min(1, s.x + s.v * dt);
    if (s.x >= 1) { s.t = now() - goAt; if (mode === 'online' && s === sims.A) send({ type: 'fin', t: s.t, perfect: s.perfect, react: s.react }); }
  }
  function botThink() {
    const s = sims.B; if (!bot || s.t != null) return;
    if (!s.launched) { if (now() >= goAt + bot.react) press('B'); }
    else if (s.g < 4 && s.rpm >= bot.shiftAt[s.g]) press('B');
  }

  function lights(on) { $('#lights').style.opacity = on ? 1 : 0; }
  function startRace(green) {
    cancelAnimationFrame(raf); lightsT.forEach(clearTimeout); lightsT = [];
    sims = { A: sim(), B: sim() };
    measure(); place(); tach('A'); tach('B');
    $$('.tachbox .q').forEach(q => q.textContent = '');
    phase = 'count';
    $('#goBtn').disabled = true; $('#raceMsg').textContent = 'Wait for green…'; $('#trackMsg').textContent = '';
    if (mode === 'bot') { const D = DIFF[diff]; bot = { react: rand(...D.react), shiftAt: [0, 1, 2, 3].map(() => clamp(.82 + gauss() * D.sd, .55, 1)) }; } else bot = null;
    const bulbs = $$('#lights i'); bulbs.forEach(b => b.className = '');
    lights(true);
    ['A', 'B'].forEach(id => { engineOff(id, .2); snd.load('car-' + P[id].car); });
    bulbs.forEach((b, i) => lightsT.push(setTimeout(() => { b.className = 'r'; snd.beep(560, .14); }, 500 + i * 600)));
    lightsT.push(setTimeout(() => {
      bulbs.forEach(b => b.className = 'g'); snd.beep(1120, .42);
      phase = 'go'; goAt = now(); $('#raceMsg').textContent = 'GO GO GO!';
      lightsT.push(setTimeout(() => lights(false), 700));
    }, 500 + 2 * 600 + 600 + green * 1000));
    last = performance.now(); raf = requestAnimationFrame(loop);
  }
  let sendT = 0;
  function loop(ts) {
    const dt = Math.min(.05, (ts - last) / 1000); last = ts;
    if (phase === 'go') {
      // fixed small steps keep the physics identical on fast and slow screens
      let rem = dt; while (rem > 0) { const h = Math.min(rem, 1 / 120); step(sims.A, h); if (mode !== 'online') step(sims.B, h); rem -= h; }
      if (mode === 'bot') botThink();
      if (mode === 'online') {
        const s = sims.B; s.x += (s.tx - s.x) * Math.min(1, dt * 10);
        if (ts - sendT > 66 && conn) { sendT = ts; send({ type: 'pos', x: +sims.A.x.toFixed(4), g: sims.A.g, rpm: +sims.A.rpm.toFixed(3), l: sims.A.launched }); }
      }
      const doneA = sims.A.t != null, doneB = sims.B.t != null, timeout = now() - goAt > 20;
      if ((doneA && doneB) || timeout) return finish();
    }
    place(); tach('A'); tach('B'); engines();
    raf = requestAnimationFrame(loop);
  }
  function abort() { engineOff('A', .3); engineOff('B', .3); cancelAnimationFrame(raf); lightsT.forEach(clearTimeout); phase = 'idle'; lights(false); $('#goBtn').disabled = false; $('#raceMsg').textContent = 'Lights out and away we go.'; }
  function finish() {
    phase = 'done'; cancelAnimationFrame(raf); place(); engineOff('A', 1.2); engineOff('B', 1.2);
    $('#goBtn').disabled = false; $('#goBtn').textContent = 'Race again 🏁';
    const a = sims.A, b = sims.B;
    const ta = a.t ?? Infinity, tb = b.t ?? Infinity;
    const youWin = ta < tb, tie = Math.abs(ta - tb) < .005;
    const nameA = mode === 'duel' ? 'Player 1' : 'You', nameB = P.B.name;
    const fmt = t => Number.isFinite(t) ? t.toFixed(2) + 's' : 'DNF';
    $('#resKick').textContent = mode === 'bot' ? `Vs studio bot · ${diff}` : mode === 'duel' ? 'Same-screen duel' : 'Online race';
    $('#resTitle').textContent = tie ? 'Photo finish!' : mode === 'duel' ? (youWin ? 'Player 1 wins!' : 'Player 2 wins!') : youWin ? 'You win!' : `${nameB} wins.`;
    const row = (n, s, t, win) => `<div class="res__row ${win ? 'win' : ''}"><span><b>${n}</b><br><small>${byId(P[s === a ? 'A' : 'B'].car).name}</small></span><small>${s.perfect}/4 perfect · react ${s.react != null ? s.react.toFixed(2) + 's' : '—'}</small><b>${fmt(t)}</b></div>`;
    $('#resRows').innerHTML = row(nameA, a, ta, youWin && !tie) + row('', b, tb, !youWin && !tie);
    $('#resRows').querySelectorAll('.res__row b')[2].textContent = nameB; // names from a friend are shown as plain text
    $('#res').classList.add('on');
    $('#raceMsg').textContent = tie ? 'Dead heat.' : youWin ? 'Chequered flag. Paper never felt so fast.' : 'So close. Shift in the green.';
    if (youWin && !tie) { const r = $('#track').getBoundingClientRect(); confetti(r.left + 80, r.top + r.height / 2, 70); }
    if (mode === 'bot' && youWin && !tie) reward('race', 2, `Beat the ${diff} bot`);
    lastResult = { win: youWin && !tie, time: fmt(ta), car: byId(P.A.car).name, opp: nameB };
    leaderboardLine(ta);
  }
  let lastResult = null;

  // a solo race against the bot counts on the Paper Arcade season leaderboard (time -> score, worked out on the server too)
  function leaderboardLine(t) {
    const el = $('#resLb'), A = window.DIYarcade; if (!el || !A) return;
    el.innerHTML = '';
    if (mode !== 'bot') { el.textContent = 'Races against the studio bot count toward the season leaderboard.'; return; }
    if (!Number.isFinite(t)) return;
    const ms = Math.round(t * 1000), score = A.raceScore(ms);
    if (ms > 9000 || score < 1) { el.textContent = 'Finish in under 9 seconds to score on the leaderboard.'; return; }
    A.saveBest('race', score);
    const post = async () => { el.textContent = 'Posting your time to the leaderboard...'; el.textContent = score + ' pts. ' + await A.submit('race', score, ms); };
    if (A.P.name) { post(); return; }
    el.innerHTML = '<span>Pick a handle to put <b>' + t.toFixed(2) + 's</b> on the leaderboard:</span><form class="res__name"><input name="n" maxlength="18" placeholder="Your handle" autocomplete="nickname" required><button class="btn btn--acid btn--sm" type="submit">Post</button></form>';
    const f = $('.res__name', el); f.addEventListener('submit', e => { e.preventDefault(); const n = A.cleanName(f.n.value); if (n.length < 2) return; A.P.name = n; A.savePlayer(); post(); });
  }

  $('#goBtn').addEventListener('click', () => { if (phase === 'count' || phase === 'go') return; startRace(rand(.3, .9)); });
  $('#rematch').addEventListener('click', () => {
    $('#res').classList.remove('on');
    if (mode === 'online') { meReady = false; remoteReady = false; send({ type: 'rematch' }); updateLobby(); }
    else startRace(rand(.3, .9));
  });
  $('#resClose').addEventListener('click', () => { $('#res').classList.remove('on'); if (mode === 'online') { meReady = false; send({ type: 'ready', v: false }); updateLobby(); } });
  $('#resShare').addEventListener('click', async () => {
    if (!lastResult) return;
    const link = location.origin + location.pathname;
    const text = `I ${lastResult.win ? 'beat' : 'raced'} ${lastResult.opp} in the Paper Grand Prix — ${lastResult.time} in the ${lastResult.car}. Your turn:`;
    try { if (navigator.share) await navigator.share({ title: 'Paper Grand Prix', text, url: link }); else { await navigator.clipboard.writeText(text + ' ' + link); toast('Result copied. Go brag.', '📋'); } } catch (e) {}
  });

  // controls: buttons + keys
  $$('.shift').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); press(b.dataset.player); }));
  addEventListener('keydown', e => {
    if (e.repeat || (e.target.closest && e.target.closest('input,textarea,select'))) return;
    const racing = phase === 'count' || phase === 'go';
    const hit = id => { const b = $(`.shift[data-player="${id}"]`); b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 90); };
    if (mode === 'duel') {
      if (e.code === 'KeyA') { press('A'); hit('A'); }
      if (e.code === 'KeyL') { press('B'); hit('B'); }
      if (racing && e.code === 'Space') e.preventDefault();
    } else if (e.code === 'Space' || e.code === 'KeyA') {
      if (racing) { e.preventDefault(); press('A'); hit('A'); }
    }
  });
  addEventListener('resize', () => { measure(); place(); });

  /* =========================================================
     ONLINE — PeerJS (WebRTC data channel), loaded only when needed
     ========================================================= */
  let peer = null, conn = null, role = null, roomCode = '', meReady = false, remoteReady = false, rtt = 80;
  const PEER_ID = c => 'doityar-gp-' + c.toLowerCase();
  const myName = () => ($('#myName').value.trim() || 'Racer').slice(0, 16);
  const cleanName = n => String(n || '').slice(0, 16).replace(/[^\p{L}\p{N} _.\-]/gu, '').trim() || 'Friend';
  $('#myName').value = store.get('raceName', '');
  $('#myName').addEventListener('change', () => { store.set('raceName', myName()); if (conn) send({ type: 'name', name: myName() }); });
  const setState = html => { $('#lobbyState').innerHTML = html; };
  function loadPeer() {
    return new Promise((res, rej) => {
      if (window.Peer) return res();
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
      s.onload = () => res(); s.onerror = () => rej(new Error('peerjs'));
      document.head.append(s);
    });
  }
  const code4 = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.random() * 31 | 0]).join('');
  function destroyPeer() { try { if (conn) conn.close(); if (peer) peer.destroy(); } catch (e) {} peer = null; conn = null; }
  function send(m) { try { if (conn && conn.open) conn.send(m); } catch (e) {} }
  function onPeerError(err) {
    const t = err && err.type;
    if (t === 'unavailable-id' && role === 'host') return host();
    if (t === 'peer-unavailable') return setState('No room with that code. Check it with your friend and try again.');
    setState('Couldn’t reach the matchmaking server. Try again in a moment — or race on the same screen.');
  }
  async function host() {
    setState('Opening your room…');
    try { await loadPeer(); } catch (e) { return onPeerError(); }
    destroyPeer(); role = 'host'; roomCode = code4();
    peer = new Peer(PEER_ID(roomCode));
    peer.on('open', () => {
      const link = `${location.origin}${location.pathname}?mode=online&room=${roomCode}`;
      $('#roomCode').textContent = roomCode; $('#share').hidden = false;
      $('#waLink').href = 'https://wa.me/?text=' + encodeURIComponent(`Race me in the Paper Grand Prix! ${link}`);
      $('#shareLink').hidden = !navigator.share;
      $('#copyLink').onclick = async () => { try { await navigator.clipboard.writeText(link); toast('Invite link copied. Send it to your friend.', '📋'); } catch (e) { prompt('Copy this link:', link); } };
      $('#shareLink').onclick = () => navigator.share({ title: 'Paper Grand Prix', text: 'Race me in the Paper Grand Prix!', url: link }).catch(() => {});
      setState(`Room <b>${roomCode}</b> is open. Waiting for your friend to join…`);
    });
    peer.on('connection', c => { if (conn) { c.close(); return; } wire(c); });
    peer.on('error', onPeerError);
  }
  async function join(code) {
    code = String(code).toUpperCase().trim();
    if (!/^[A-Z0-9]{4}$/.test(code)) return setState('Room codes are 4 characters, like <b>K7QX</b>.');
    setState(`Finding room <b>${code}</b>…`);
    try { await loadPeer(); } catch (e) { return onPeerError(); }
    destroyPeer(); role = 'guest'; roomCode = code; $('#joinCode').value = code;
    peer = new Peer();
    peer.on('open', () => wire(peer.connect(PEER_ID(code), { reliable: true })));
    peer.on('error', onPeerError);
  }
  function wire(c) {
    conn = c;
    c.on('open', () => {
      send({ type: 'hello', name: myName(), car: P.A.car });
      send({ type: 'ping', t: performance.now() });
      $('#readyBtn').hidden = false; meReady = false; remoteReady = false;
      $('#whoB').textContent = 'Your friend';
      updateLobby();
    });
    c.on('data', onMsg);
    c.on('close', () => { conn = null; if (phase === 'count' || phase === 'go') abort(); $('#readyBtn').hidden = true; setState('Your friend left the room. Create a new room to race again.'); });
    c.on('error', () => setState('The connection dropped. Create a new room and try again.'));
  }
  function updateLobby() {
    if (!conn) return;
    $('#readyBtn').textContent = meReady ? 'Not ready' : 'I’m ready';
    const fn = P.B.name;
    const msg = document.createElement('span');
    msg.textContent = `${fn} is in the room${remoteReady ? ' and ready' : ''}. `;
    setState(''); $('#lobbyState').append(msg, Object.assign(document.createElement('b'), { textContent: meReady && remoteReady ? 'Starting…' : meReady ? 'Waiting for them…' : 'Pick your car, then hit ready.' }));
    if (role === 'host' && meReady && remoteReady && phase !== 'count' && phase !== 'go') {
      const green = rand(.3, .9);
      send({ type: 'start', green });
      setTimeout(() => startRace(green), Math.max(0, rtt / 2));
    }
  }
  $('#readyBtn').addEventListener('click', () => { meReady = !meReady; send({ type: 'ready', v: meReady }); updateLobby(); });
  $('#hostBtn').addEventListener('click', () => { store.set('raceName', myName()); host(); });
  $('#joinBtn').addEventListener('click', () => { store.set('raceName', myName()); join($('#joinCode').value); });
  $('#joinCode').addEventListener('keydown', e => { if (e.key === 'Enter') join(e.target.value); });
  function onMsg(m) {
    if (!m || typeof m !== 'object') return;
    switch (m.type) {
      case 'hello': P.B.name = cleanName(m.name); setCar('B', validCar(m.car)); $('#nameA').textContent = myName(); updateLobby(); break;
      case 'name': P.B.name = cleanName(m.name); updateLobby(); break;
      case 'car': setCar('B', validCar(m.car)); break;
      case 'ready': remoteReady = !!m.v; updateLobby(); break;
      case 'start': if (role === 'guest' && typeof m.green === 'number') startRace(clamp(m.green, .2, 1.2)); break;
      case 'pos': if (phase === 'go' || phase === 'count') { const s = sims.B; s.tx = clamp(+m.x || 0, 0, 1); s.g = clamp(m.g | 0, 0, 4); s.rpm = clamp(+m.rpm || 0, 0, 1); s.launched = !!m.l; } break;
      case 'fin': { const s = sims.B; s.t = clamp(+m.t || 0, 0, 60); s.perfect = clamp(m.perfect | 0, 0, 4); s.react = m.react == null ? null : clamp(+m.react, 0, 5); s.tx = 1; s.x = 1; break; }
      case 'ping': send({ type: 'pong', t: m.t }); break;
      case 'pong': rtt = clamp(performance.now() - (+m.t || 0), 0, 1000); break;
      case 'rematch': $('#res').classList.remove('on'); meReady = false; remoteReady = false; updateLobby(); break;
    }
  }
  addEventListener('beforeunload', destroyPeer);

  /* ---------- boot ---------- */
  setCar('A', P.A.car); setCar('B', P.B.car);
  setMode(params.get('mode') === 'online' || params.get('room') ? 'online' : params.get('mode') === 'duel' ? 'duel' : 'bot');
  measure(); place(); tach('A'); tach('B');
  if (hasG && !reduce) {
    gsap.from('.rx-hero__copy > *', { y: 40, opacity: 0, stagger: .08, duration: .9, ease: 'power3.out' });
    gsap.from('.rx-modes button', { x: 40, opacity: 0, stagger: .08, duration: .8, ease: 'power3.out', delay: .2 });
    gsap.from('.lane__car', { opacity: 0, stagger: .15, duration: 1, ease: 'power2.out', delay: .3 });
  }
})();
