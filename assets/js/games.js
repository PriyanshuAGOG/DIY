/* Do It Yar — The Procrastination Station (6 mini-games + modal) */
(function () {
  const { $, $$, url, reward, toast, confetti, state } = DIYcore;
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  let cleanup = null;
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  let timers = [];

  const games = [
    { id: 'pairs', no: '01 / Paper pairs', title: 'Same same. But different.', blurb: 'Eight cards. Four pairs. One mildly competitive you.', cta: 'Test your memory', bg: 'var(--acid)', art: '? ✳ ?', pct: 2, run: pairs },
    { id: 'catch', no: '02 / Catch the chaos', title: 'Catch feelings? Nah. Catch this.', blurb: '20 seconds. One very restless star. Hit 15 taps to win.', cta: 'Let’s get tapping', bg: 'var(--orange)', art: '✳', pct: 2, run: catcher },
    { id: 'quest', no: '03 / Creative side quest', title: 'A tiny idea. A happy accident.', blurb: 'Get a random prompt. Make something imperfect.', cta: 'Give me a side quest', bg: 'var(--purple)', art: 'what<br>if?', pct: 1, run: quest },
    { id: 'ttt', no: '04 / Tic-tac-whoa', title: 'Three in a row. Zero chill.', blurb: 'You vs the studio bot. Outthink it — or at least force a draw.', cta: 'Your move', bg: 'var(--mint)', art: 'X O<br>O X', pct: 2, run: ttt },
    { id: 'echo', no: '05 / Colour echo', title: 'Watch it. Remember it.', blurb: 'Follow the colour sequence. Reach round five for a reward.', cta: 'Find your rhythm', bg: '#f6c3d4', art: '1 2<br>3 4', pct: 2, run: echo },
    { id: 'blink', no: '06 / Don’t blink', title: 'Fast hands. Happy brain.', blurb: 'Wait for mint. Tap under 400ms. No pressure. Okay, a little.', cta: 'Test your reflex', bg: 'var(--paper)', art: 'NOW.', pct: 2, run: blink }
  ];

  function renderGrid() {
    const grid = $('#arcadeGrid'); if (!grid) return;
    grid.innerHTML = games.map(g => `
      <button class="gcard" data-game="${g.id}" style="--bg:${g.bg}" data-cursor="Play">
        ${state.rewards[g.id] ? `<span class="chip gcard__won">✓ +${g.pct}% won</span>` : ''}
        <span class="mono">${g.no}</span>
        <div class="gcard__art">${g.art}</div>
        <h3>${g.title}</h3>
        <p>${g.blurb}</p>
        <span class="gcard__go"><span>${g.cta}</span><span>↗</span></span>
      </button>`).join('');
  }

  function openGame(id) {
    const g = games.find(x => x.id === id); if (!g) return;
    closeGame(true);
    $('#gmNo').textContent = g.no + ` · win = ${g.pct}% off`;
    $('#gmTitle').textContent = g.title;
    $('#gmBody').innerHTML = '';
    $('#gm').classList.add('on');
    if (window.lenis) lenis.stop();
    document.body.style.overflow = 'hidden';
    cleanup = g.run($('#gmBody'), () => win(g));
    setTimeout(() => $('#gmClose').focus(), 50);
  }
  function closeGame(silent) {
    timers.forEach(clearTimeout); timers = [];
    if (cleanup) { cleanup(); cleanup = null; }
    if (silent) return;
    $('#gm').classList.remove('on');
    if (window.lenis) lenis.start();
    document.body.style.overflow = '';
  }
  function win(g) {
    const r = $('#gmBody').getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + r.height / 2, 60);
    reward(g.id, g.pct, g.no.split('/ ')[1]);
    renderGrid();
  }

  /* 01 — pairs */
  function pairs(body, done) {
    const pics = shuffle(DIY.cars).slice(0, 4).map(c => c.thumb);
    const deck = shuffle([...pics, ...pics]);
    let open = [], moves = 0, matched = 0, lock = false;
    body.innerHTML = `<div class="gstat"><span>Moves: <b id="pm">0</b></span><span>Pairs: <b id="pp">0</b>/4</span></div>
      <div class="pairs">${deck.map((p, i) => `<button class="pair" data-i="${i}" aria-label="Card ${i + 1}"><span class="front">✳</span><span class="back"><img src="${url(p)}" alt="A paper car" style="object-fit:contain;padding:10%"></span></button>`).join('')}</div>
      <p class="gmsg" id="pmsg">Flip two. Find twins.</p>`;
    $$('.pair', body).forEach(c => c.addEventListener('click', () => {
      if (lock || c.classList.contains('flip') || c.classList.contains('done')) return;
      c.classList.add('flip'); open.push(c);
      if (open.length < 2) return;
      moves++; $('#pm').textContent = moves;
      const [a, b] = open;
      if (deck[a.dataset.i] === deck[b.dataset.i]) {
        a.classList.add('done'); b.classList.add('done'); open = []; matched++;
        $('#pp').textContent = matched;
        if (window.gsap) gsap.fromTo([a, b], { scale: 1.12 }, { scale: 1, duration: .5, ease: 'back.out(3)' });
        if (matched === 4) { $('#pmsg').textContent = `All four in ${moves} moves. Memory: certified.`; done(); }
      } else {
        lock = true;
        later(() => { a.classList.remove('flip'); b.classList.remove('flip'); open = []; lock = false; }, 750);
      }
    }));
  }

  /* 02 — catch the chaos */
  function catcher(body, done) {
    let score = 0, t = 20, running = false, iv;
    body.innerHTML = `<div class="gstat"><span>Taps: <b id="cs">0</b></span><span>Time: <b id="ct">20</b>s</span></div>
      <div class="arena" id="arena"><button class="star" id="star" style="left:50%;top:50%" aria-label="Catch the star">✳</button></div>
      <p class="gmsg" id="cmsg">Tap the star to start.</p>`;
    const star = $('#star'), arena = $('#arena');
    const move = () => { star.style.left = (10 + Math.random() * 80) + '%'; star.style.top = (12 + Math.random() * 76) + '%'; };
    star.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (t <= 0) return;
      if (!running) {
        running = true; $('#cmsg').textContent = 'Go go go!';
        iv = setInterval(() => {
          t--; $('#ct').textContent = t;
          if (t > 0 && Math.random() < .5) move();
          if (t <= 0) {
            clearInterval(iv); star.disabled = true;
            $('#cmsg').textContent = score >= 15 ? `${score} taps. Chaos caught.` : `${score} taps. Need 15 — close the modal and try again.`;
            if (score >= 15) done();
          }
        }, 1000);
      }
      score++; $('#cs').textContent = score;
      if (window.gsap) gsap.fromTo(star, { scale: .7, rotate: 0 }, { scale: 1, rotate: 180, duration: .3 });
      move();
    });
    return () => clearInterval(iv);
  }

  /* 03 — side quest */
  function quest(body, done) {
    const prompts = ['Fold a paper hat for your favourite mug.', 'Make an origami boat. Sail it in a bowl.', 'Draw your pet as a low-poly creature.', 'Cut a snowflake with exactly six arms.', 'Build a paper tower taller than your phone.', 'Make a tiny paper crown for a houseplant.', 'Sketch a car with only triangles.', 'Turn a receipt into a fortune teller.', 'Make a bookmark that looks like a monster.', 'Fold a paper plane. Name it. Launch it.', 'Design a sticker for your future self.', 'Make a mini paper garage for a toy car.'];
    let cur = '';
    body.innerHTML = `<div class="quest" id="qq">Press the button.<br>Accept destiny.</div>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:16px;flex-wrap:wrap">
        <button class="btn" id="qroll">🎲 Roll a side quest</button>
        <button class="btn btn--ghost" id="qdone" disabled>I did it ✓</button></div>
      <p class="gmsg" id="qmsg"></p>`;
    $('#qroll').onclick = () => {
      let n = 0;
      const spin = setInterval(() => {
        $('#qq').textContent = prompts[Math.random() * prompts.length | 0];
        if (++n > 12) { clearInterval(spin); cur = prompts[Math.random() * prompts.length | 0]; $('#qq').textContent = cur; $('#qdone').disabled = false; if (window.gsap) gsap.fromTo('#qq', { rotate: -3, scale: .95 }, { rotate: 0, scale: 1, ease: 'elastic.out(1,.4)', duration: .9 }); }
      }, 60);
    };
    $('#qdone').onclick = () => { $('#qmsg').textContent = 'Honour system accepted. Proud of you.'; $('#qdone').disabled = true; done(); };
  }

  /* 04 — tic-tac-whoa (bot plays perfect 75% of the time) */
  function ttt(body, done) {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    let b = Array(9).fill(''), over = false;
    body.innerHTML = `<div class="ttt">${b.map((_, i) => `<button data-c="${i}" aria-label="Cell ${i + 1}"></button>`).join('')}</div>
      <p class="gmsg" id="tmsg">You are X. Go.</p><div style="text-align:center;margin-top:10px"><button class="btn btn--sm btn--ghost" id="treset">New round</button></div>`;
    const cells = $$('.ttt button', body);
    const winner = s => { for (const l of lines) if (s[l[0]] && s[l[0]] === s[l[1]] && s[l[1]] === s[l[2]]) return l; return s.every(Boolean) ? 'draw' : null; };
    const mm = (s, me) => {
      const w = winner(s);
      if (w === 'draw') return { score: 0 };
      if (w) return { score: s[w[0]] === 'O' ? 1 : -1 };
      let best = { score: me ? -2 : 2 };
      s.forEach((v, i) => { if (v) return; s[i] = me ? 'O' : 'X'; const r = mm(s, !me); s[i] = ''; if (me ? r.score > best.score : r.score < best.score) best = { score: r.score, i }; });
      return best;
    };
    const draw = () => cells.forEach((c, i) => { c.textContent = b[i]; c.className = b[i] === 'X' ? 'x1' : b[i] === 'O' ? 'o1' : ''; c.disabled = !!b[i] || over; });
    const end = () => {
      const w = winner(b); if (!w) return false;
      over = true;
      if (w === 'draw') { $('#tmsg').textContent = 'Draw. The bot respects you now.'; done(); }
      else { w.forEach(i => cells[i].classList.add('win')); if (b[w[0]] === 'X') { $('#tmsg').textContent = 'You beat the bot. Unhinged. Amazing.'; done(); } else $('#tmsg').textContent = 'Bot wins. It’s been practising. New round?'; }
      draw(); w !== 'draw' && w.forEach(i => cells[i].classList.add('win'));
      return true;
    };
    cells.forEach(c => c.addEventListener('click', () => {
      if (over || b[c.dataset.c]) return;
      b[c.dataset.c] = 'X'; draw(); if (end()) return;
      $('#tmsg').textContent = 'Bot is thinking…';
      later(() => {
        const free = b.map((v, i) => v ? -1 : i).filter(i => i >= 0);
        const i = Math.random() < .75 ? mm(b, true).i : free[Math.random() * free.length | 0];
        b[i] = 'O'; draw(); if (!end()) $('#tmsg').textContent = 'Your move.';
      }, 420);
    }));
    $('#treset').onclick = () => { b = Array(9).fill(''); over = false; $('#tmsg').textContent = 'You are X. Go.'; draw(); };
  }

  /* 05 — colour echo */
  function echo(body, done) {
    const cols = ['var(--orange)', 'var(--acid)', 'var(--purple)', 'var(--mint)'];
    let seq = [], step = 0, listening = false, round = 0, won = false;
    body.innerHTML = `<div class="gstat"><span>Round: <b id="er">0</b></span><span>Goal: 5</span></div>
      <div class="echo">${cols.map((c, i) => `<button data-p="${i}" style="--c:${c}" aria-label="Pad ${i + 1}">${i + 1}</button>`).join('')}</div>
      <div style="text-align:center;margin-top:14px"><button class="btn" id="estart">Start</button></div><p class="gmsg" id="emsg"></p>`;
    const pads = $$('.echo button', body);
    const flash = (i, ms = 380) => { pads[i].classList.add('lit'); later(() => pads[i].classList.remove('lit'), ms); };
    const play = () => {
      listening = false; step = 0; round++; $('#er').textContent = round;
      seq.push(Math.random() * 4 | 0);
      $('#emsg').textContent = 'Watch…';
      seq.forEach((p, k) => later(() => flash(p), 600 + k * 560));
      later(() => { listening = true; $('#emsg').textContent = 'Your turn.'; }, 600 + seq.length * 560);
    };
    pads.forEach(p => p.addEventListener('click', () => {
      if (!listening) return;
      const i = +p.dataset.p; flash(i, 200);
      if (i !== seq[step]) { listening = false; $('#emsg').textContent = `Oops. You reached round ${round}. Start again?`; seq = []; round = 0; $('#estart').hidden = false; return; }
      if (++step === seq.length) {
        listening = false;
        if (round >= 5 && !won) { won = true; $('#emsg').textContent = 'Round five! Rhythm unlocked. Keep going for glory.'; done(); }
        later(play, 900);
      }
    }));
    $('#estart').onclick = () => { $('#estart').hidden = true; seq = []; round = 0; play(); };
  }

  /* 06 — don't blink */
  function blink(body, done) {
    let state = 'idle', t0 = 0, best = Infinity, to;
    body.innerHTML = `<div class="blink idle" id="bz" role="button" tabindex="0">Tap to start</div>
      <div class="gstat" style="margin-top:12px"><span>Best: <b id="bb">—</b></span><span>Win under 400ms</span></div><p class="gmsg" id="bmsg"></p>`;
    const z = $('#bz');
    const hit = e => {
      e.preventDefault();
      if (state === 'idle' || state === 'result') {
        state = 'wait'; z.className = 'blink'; z.textContent = 'Wait for mint…';
        to = later(() => { state = 'go'; z.className = 'blink go'; z.textContent = 'NOW!'; t0 = performance.now(); }, 1200 + Math.random() * 2400);
      } else if (state === 'wait') {
        clearTimeout(to); state = 'result'; z.className = 'blink idle'; z.textContent = 'Too soon! Tap to retry';
      } else if (state === 'go') {
        const ms = Math.round(performance.now() - t0); best = Math.min(best, ms);
        state = 'result'; z.className = 'blink idle'; z.textContent = `${ms} ms`;
        $('#bb').textContent = best + ' ms';
        $('#bmsg').textContent = ms < 400 ? 'Lightning. Tap to go again.' : 'Decent. Under 400 wins. Tap to retry.';
        if (ms < 400) done();
      }
    };
    z.addEventListener('pointerdown', hit);
    z.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') hit(e); });
  }

  // wire up
  renderGrid();
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-game]'); if (g) openGame(g.dataset.game);
    if (e.target.closest('#gmClose') || e.target.id === 'gm') closeGame();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#gm').classList.contains('on')) closeGame(); });
  document.addEventListener('diy:rewards', renderGrid);
  window.DIYgames = { games, openGame };
})();
