/* The Paper Garage — automobile theme page */
(function () {
  const { $, $$, url, inr, card, stage, sfx, playSfx, add, reward, toast, confetti, honk, rev, snd, reduce, byId, hrefOf, state } = DIYcore;
  const cars = DIY.cars;
  const hasG = !!window.gsap && !!window.ScrollTrigger && !reduce;
  if (window.gsap && window.Flip) gsap.registerPlugin(Flip);
  const opt = (sel = '') => cars.map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${c.name}</option>`).join('');
  const heart = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 3.2 4.5 6.9 4.5c2.2 0 3.6 1.2 5.1 3 1.5-1.8 2.9-3 5.1-3 3.7 0 6 3.8 4.5 7.3C19.5 16.4 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  const hideChars = el => { if (hasG && el) gsap.set(el.querySelectorAll('.c'), { opacity: 0 }); };

  /* =========================================================
     ENTRY — the paper garage, the door opens by itself
     ========================================================= */
  const entryCar = byId('lamborghini-aventador-lbwk');
  DIYscene.build($('#entryScene'), 'garage', { seed: 3, over: .06 });
  $('#entryCar').innerHTML = stage(entryCar, { full: true, eager: true, alt: 'White Lamborghini Aventador LBWK papercraft model parked in the garage' });
  $('#entrySfx').innerHTML = sfx(entryCar.shout, { face: entryCar.face, dark: true });
  hideChars($('#entrySfx'));
  $('#entryCar').addEventListener('click', e => honk(entryCar, e.clientX, e.clientY - 40));
  $('#entryRev').addEventListener('click', e => {
    honk(entryCar, e.clientX, e.clientY - 50);
    document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake');
  });

  function openDoor() {
    const door = $('#shutter');
    if (!hasG) { door.remove(); return; }
    // never wait long for the car photo: a short decode window, then up it goes
    const img = $('#entryCar img'), ready = img && img.decode ? Promise.race([img.decode().catch(() => {}), new Promise(r => setTimeout(r, 300))]) : Promise.resolve();
    ready.then(() => requestAnimationFrame(lift));
    function lift() {
    snd.fx('shutter', { vol: .9, dur: 1.3, fout: .4 });
    gsap.timeline({ onComplete: () => { door.remove(); snd.car(entryCar, { wait: 9000, dur: 4.5 }); } })
      .to('.shutter__in', { y: -5, duration: .05, repeat: 1, yoyo: true, ease: 'none', force3D: true })
      .to(door, { yPercent: -10, duration: .18, ease: 'power2.out', force3D: true })
      .to(door, { yPercent: -101, duration: .7, ease: 'power3.inOut', force3D: true })
      .fromTo('#flash', { opacity: 0 }, { opacity: 1, duration: .1, repeat: 3, yoyo: true, ease: 'none' }, '-=.55')
      .from('.entry__copy > *', { y: 40, opacity: 0, stagger: .07, duration: .8, ease: 'power3.out' }, '-=.7')
      .from('#entryCar .stg__fit', { x: () => innerWidth * .3, duration: 1.2, ease: 'expo.out' }, '<')
      .add(() => playSfx($('#entrySfx .sfx')), '-=.5');
    }
  }
  openDoor();

  /* ---------- countdown (ends Sunday night) ---------- */
  const end = (() => { const d = new Date(); d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7)); d.setHours(23, 59, 59, 0); return d; })();
  const pad = v => String(v).padStart(2, '0');
  const tick = () => {
    const s = Math.max(0, (end - Date.now()) / 1000 | 0), u = { d: s / 86400 | 0, h: (s % 86400) / 3600 | 0, m: (s % 3600) / 60 | 0, s: s % 60 };
    $$('#clock b').forEach(b => b.textContent = pad(u[b.dataset.u]));
  };
  tick(); setInterval(tick, 1000);

  /* =========================================================
     THE HALLS — three chapters, five bays each, walked sideways
     ========================================================= */
  const bayHtml = (c, ch) => `
    <article class="panel bay" id="bay-${c.bay}" data-id="${c.id}" data-face="${c.face}">
      <i class="bay__floor" aria-hidden="true"></i>
      <i class="bay__pillar" aria-hidden="true"><b>${c.bay}</b></i>
      <div class="bay__head">
        <span class="mono bay__kick">${ch.name} · Bay ${c.bay}</span>
        <span class="mono bay__make">${c.make} · ${c.tag}</span>
        <h2 class="bay__title">${c.model}${c.sub ? `<small>${c.sub}</small>` : ''}</h2>
        <p class="bay__line">${c.line}</p>
        <p class="bay__note serif">“${c.note}”</p>
      </div>
      <div class="bay__foot">
        <div class="bay__spec"><span>${c.scale} scale</span><span>${c.pages} A4 sheets</span><span>${c.level}</span><span>~${c.buildHours}h build</span></div>
        <div class="bay__buy"><b>${inr(c.salePrice)}</b><s>${inr(c.price)}</s><em>−${c.deal}%</em></div>
        <div class="bay__cta">
          <a class="btn btn--acid" href="${hrefOf(c)}">View the kit <span class="arr">→</span></a>
          <button class="btn btn--ghost" data-add="${c.id}">Add to bag</button>
          <button class="rnd" data-wish="${c.id}" aria-pressed="${state.wish.includes(c.id)}" aria-label="Save ${c.name}">${heart}</button>
        </div>
      </div>
      <div class="dock">
        <span class="dock__sign display" aria-hidden="true">Bay ${c.bay}</span>
        <i class="dock__beacon" aria-hidden="true"></i>
        <div class="dock__hole">
          <div class="dock__in" aria-hidden="true"><span class="dock__wall display">${c.model}</span><i class="dock__cone"></i><i class="dock__deck"></i></div>
          <div class="bay__car" data-honk="${c.id}" data-cursor="Rev it">${stage(c, { full: true })}</div>
          <div class="dock__door" aria-hidden="true"><span class="mono">Bay ${c.bay} Â· ${c.make}</span><i></i></div>
        </div>
        <i class="dock__glow" aria-hidden="true"></i>
        <i class="dock__bump dock__bump--l" aria-hidden="true"></i><i class="dock__bump dock__bump--r" aria-hidden="true"></i>
        <div class="bay__sfx">${sfx(c.shout, { face: c.face, dark: true })}</div>
      </div>
    </article>`;

  $('#hallList').innerHTML = DIY.chapters.map(ch => {
    const list = cars.filter(c => c.ch === ch.id);
    return `
    <section class="hall" id="hall-${ch.id}" data-theme="${ch.theme}">
      <div class="hall__pin">
        <div class="hall__scene"></div>
        <div class="hall__track">
          <div class="panel hall__intro">
            <span class="hall__no" aria-hidden="true">${ch.no}</span>
            <span class="mono">The paper garage / chapter ${ch.no}</span>
            <h2 class="display">${ch.name}</h2>
            <p>${ch.line}</p>
            <div class="hall__list">${list.map(c => `<a href="#bay-${c.bay}" data-jump="${c.bay}"><img src="${url(c.thumb)}" alt="" loading="lazy">${c.model}</a>`).join('')}</div>
            <span class="mono hall__scroll">Keep scrolling — the bays roll past →</span>
          </div>
          ${list.map(c => bayHtml(c, ch)).join('')}
        </div>
        <div class="wrap hall__hud mono"><span>${ch.no} · ${ch.name}</span><div class="hall__bar"><i></i></div><span class="hall__count"><b>00</b> / 05</span></div>
      </div>
    </section>`;
  }).join('');
  // on phones and portrait tablets the dock sits right under each bay's heading (names can run to two lines)
  const stacked = matchMedia('(max-width: 900px), (max-aspect-ratio: 4/5)');
  function fitDocks() {
    $$('.bay').forEach(b => {
      if (!stacked.matches) return b.style.removeProperty('--dock-top');
      const h = $('.bay__head', b); b.style.setProperty('--dock-top', (h.offsetTop + h.offsetHeight + 14) + 'px');
    });
  }
  fitDocks();
  addEventListener('resize', () => { clearTimeout(fitDocks.t); fitDocks.t = setTimeout(fitDocks, 100); });
  document.fonts && document.fonts.ready.then(fitDocks);
  $('#dirLinks').innerHTML = cars.map((c, i) => `<a href="#bay-${c.bay}" class="${i % 5 === 0 && i ? 'ch' : ''}" data-jump="${c.bay}" aria-label="Bay ${c.bay}: ${c.name}">${c.bay}<img src="${url(c.thumb)}" alt="" loading="lazy"></a>`).join('');
  $$('.bay__sfx').forEach(hideChars);

  // honk: tap any parked car
  document.addEventListener('click', e => {
    const h = e.target.closest('[data-honk]'); if (!h) return;
    const c = byId(h.dataset.honk);
    honk(c, e.clientX, e.clientY - 40);
    if (window.gsap) gsap.fromTo(h.querySelector('.stg__img'), { y: 0 }, { keyframes: [{ y: -14, rotation: -1.2, duration: .12 }, { y: 0, rotation: 0, duration: .5, ease: 'bounce.out' }] });
  });

  // lights switch
  $('#lights').addEventListener('click', e => {
    const off = document.body.classList.toggle('lights-off');
    e.currentTarget.setAttribute('aria-pressed', !off);
    e.currentTarget.innerHTML = `Lights <b>${off ? 'off' : 'on'}</b>`;
    toast(off ? 'Lights off. Night shift engaged.' : 'Lights back on.', off ? '🌙' : '💡');
  });

  const dirLinks = $$('#dirLinks a');
  const setActive = i => {
    dirLinks.forEach((a, k) => a.classList.toggle('on', k === i));
    const a = dirLinks[i]; if (a) a.parentNode.scrollTo({ left: a.offsetLeft - a.parentNode.clientWidth / 2, behavior: 'smooth' });
  };

  const hallST = {};
  // a parked car speaks once the bay is lit; a fast scroll past several bays only voices the one you stop at
  let speakT = 0;
  const speak = c => { clearTimeout(speakT); speakT = setTimeout(() => snd.car(c, { dur: 3.6, fout: .9 }), 280); };
  if (hasG) {
    const depths = { sky: .02, far: .22, near: .5, mid: .5, ground: 1, props: 1.12 };
    $$('.hall').forEach((hall, h) => {
      const pin = $('.hall__pin', hall), track = $('.hall__track', hall);
      const travel = () => track.scrollWidth - innerWidth;
      const scn = DIYscene.build($('.hall__scene', hall), hall.dataset.theme, { seed: 20 + h * 7, over: .04, travel, depths });
      const bar = $('.hall__bar i', hall), count = $('.hall__count b', hall);
      const tween = gsap.to(track, {
        x: () => -travel(), ease: 'none',
        scrollTrigger: {
          trigger: pin, start: 'top top', end: () => '+=' + travel(), pin: true, scrub: .6, invalidateOnRefresh: true,
          onUpdate: s => { bar.style.width = s.progress * 100 + '%'; count.textContent = pad(Math.min(5, Math.round(s.progress * 5))); }
        }
      });
      hallST[hall.id] = tween.scrollTrigger;
      scn.layers.forEach(L => gsap.to(L.el, { x: () => -L.depth * travel(), ease: 'none', scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + travel(), scrub: .6, invalidateOnRefresh: true } }));

      $$('.bay', hall).forEach(b => {
        const i = cars.findIndex(c => c.id === b.dataset.id), car = cars[i];
        const dir = b.dataset.face === 'l' ? 1 : -1; // nose-left cars roll in from the right, nose-right from the left
        const ST = (start, end, more) => ({ trigger: b, containerAnimation: tween, start, end, scrub: true, ...more });
        gsap.fromTo($('.dock__door', b), { yPercent: 0 }, { yPercent: -100, ease: 'power1.inOut', scrollTrigger: ST('left 78%', 'left 30%', { onToggle: s => b.classList.toggle('is-moving', s.isActive) }) });
        gsap.fromTo($('.bay__car .stg__fit', b), { x: () => dir * innerWidth * .5 }, { x: 0, ease: 'power2.out', scrollTrigger: ST('left 62%', 'left 14%') });
        gsap.from([$('.bay__head', b), $('.bay__foot', b)], { x: -50, opacity: 0, stagger: .1, ease: 'power2.out', scrollTrigger: ST('left 80%', 'left 35%') }); // sideways, so text never dips into the dock
        const sx = $('.bay__sfx .sfx', b);
        const on = () => { b.classList.add('lit'); playSfx(sx); speak(car); }, off = () => { b.classList.remove('lit'); hideChars(sx.parentNode); };
        ScrollTrigger.create({ trigger: b, containerAnimation: tween, start: 'left 30%', end: 'right 0%', onEnter: on, onEnterBack: on, onLeave: off, onLeaveBack: off });
        ScrollTrigger.create({ trigger: b, containerAnimation: tween, start: 'left 50%', end: 'right 50%', onToggle: s => s.isActive && setActive(i) });
      });
      gsap.from($$('.hall__intro > *', hall), { y: 50, opacity: 0, stagger: .08, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: hall, start: 'top 60%' } });
    });
  } else {
    $('#halls').classList.add('halls--static');
    $$('.hall').forEach((hall, h) => DIYscene.build($('.hall__scene', hall), hall.dataset.theme, { seed: 20 + h * 7 }));
  }

  // jump to any bay (lineup bar + chapter lists)
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-jump]'); if (!a) return;
    const b = $('#bay-' + a.dataset.jump), hall = b && b.closest('.hall'); if (!hall) return;
    const st = hallST[hall.id];
    if (!st) return;
    e.preventDefault(); e.stopPropagation();
    const panels = $('.hall__track', hall).children.length, p = [...$('.hall__track', hall).children].indexOf(b);
    const y = st.start + (st.end - st.start) * p / (panels - 1);
    window.lenis ? lenis.scrollTo(y, { duration: 1.2 }) : window.scrollTo({ top: y, behavior: 'smooth' });
  }, true);

  /* =========================================================
     THE COLLECTIONS: the same five curated shelves as the shop
     ========================================================= */
  $('#grid').innerHTML = DIYcore.shelves();
  $('#colIndex').innerHTML = DIY.collections.map(k => `<a href="#col-${k.id}" style="--c:${k.color}"><b>${k.no}</b>${k.name}</a>`).join('');

  /* =========================================================
     SCRATCH CARD
     ========================================================= */
  (() => {
    const cv = $('#scratchCanvas'), box = $('#scratch');
    let ctx, done = false, drawing = false;
    if (state.rewards.scratch) { cv.remove(); return; }
    const paint = () => {
      const r = box.getBoundingClientRect(), dpr = devicePixelRatio || 1;
      cv.width = r.width * dpr; cv.height = r.height * dpr;
      ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
      const g = ctx.createLinearGradient(0, 0, r.width, r.height);
      g.addColorStop(0, '#b9b8b0'); g.addColorStop(.5, '#efece3'); g.addColorStop(1, '#a1a098');
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = g; ctx.fillRect(0, 0, r.width, r.height);
      ctx.fillStyle = '#20211e'; ctx.font = '700 15px "Space Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillText('SCRATCH ME ✳', r.width / 2, r.height / 2 - 4);
      ctx.font = '400 11px "Space Mono", monospace'; ctx.fillText('drag to reveal', r.width / 2, r.height / 2 + 16);
      ctx.globalCompositeOperation = 'destination-out';
    };
    const scratch = e => { if (!drawing || done) return; const r = cv.getBoundingClientRect(); ctx.beginPath(); ctx.arc(e.clientX - r.left, e.clientY - r.top, 20, 0, Math.PI * 2); ctx.fill(); };
    const check = () => {
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data; let clear = 0;
      for (let i = 3; i < d.length; i += 64) if (d[i] === 0) clear++;
      if (clear / (d.length / 64) > .45 && !done) {
        done = true;
        window.gsap ? gsap.to(cv, { opacity: 0, duration: .5, onComplete: () => cv.remove() }) : cv.remove();
        const r = box.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2, 40);
        reward('scratch', 2, 'Scratch card');
      }
    };
    requestAnimationFrame(paint);
    addEventListener('resize', () => !done && paint());
    cv.addEventListener('pointerdown', e => { drawing = true; cv.setPointerCapture(e.pointerId); scratch(e); });
    cv.addEventListener('pointermove', scratch);
    cv.addEventListener('pointerup', () => { drawing = false; check(); });
  })();

  /* =========================================================
     GARAGE BUILDER
     ========================================================= */
  (() => {
    let bays = [null, null, null];
    $('#lot').innerHTML = cars.map(c => `<button data-c="${c.id}" aria-pressed="false">${stage(c, { shadow: false, alt: '' })}<span>${c.name}</span><small>${inr(c.salePrice)}</small></button>`).join('');
    function render(animIdx) {
      $$('.bay3').forEach((b, i) => {
        const c = bays[i] && byId(bays[i]);
        b.classList.toggle('full', !!c);
        b.innerHTML = `<span class="mono">Bay 0${i + 1}</span>` + (c ? `${stage(c)}<button class="rmv" data-rm="${i}" aria-label="Remove ${c.name}">×</button>` : '');
        if (c && i === animIdx && window.gsap) gsap.fromTo(b.querySelector('.stg__fit'), { x: c.face === 'l' ? 260 : -260, opacity: 0 }, { x: 0, opacity: 1, duration: .9, ease: 'expo.out' });
      });
      $$('#lot button').forEach(b => b.setAttribute('aria-pressed', bays.includes(b.dataset.c)));
      const chosen = bays.filter(Boolean).map(byId), k = chosen.length;
      const sale = chosen.reduce((s, c) => s + c.salePrice, 0), mrp = chosen.reduce((s, c) => s + c.price, 0);
      const pct = k >= 3 ? 12 : k === 2 ? 5 : 0, final = sale * (1 - pct / 100);
      $('#bPrice').textContent = inr(final);
      $('#bMrp').textContent = k ? inr(mrp) : '';
      $('#bOff').hidden = !k; $('#bOff').textContent = k ? `−${Math.round((1 - final / mrp) * 100)}% total` : '';
      $('#bHint').textContent = k === 0 ? 'Park 3 cars to unlock the full 12%.' : k === 1 ? 'Nice. Park one more for an extra 5%.' : k === 2 ? 'One more bay to go for 12% off.' : `Garage complete. You save ${inr(mrp - final)}.`;
      $('#bAdd').disabled = !k;
    }
    $('#lot').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const id = b.dataset.c, at = bays.indexOf(id);
      if (at >= 0) { bays[at] = null; render(); return; }
      const free = bays.indexOf(null);
      if (free < 0) { toast('Garage full — remove a car first.', '🅿'); return; }
      bays[free] = id; render(free);
    });
    $('#bays3').addEventListener('click', e => { const r = e.target.closest('[data-rm]'); if (r) { bays[+r.dataset.rm] = null; render(); } });
    $('#bClear').addEventListener('click', () => { bays = [null, null, null]; render(); });
    $('#bAdd').addEventListener('click', e => { bays.filter(Boolean).forEach(id => add(id, 1, e.currentTarget, true)); toast('Your whole garage is in the bag.', '🏁'); confetti(e.clientX, e.clientY, 40); });
    render();
  })();

  /* =========================================================
     QUIZ
     ========================================================= */
  (() => {
    const qs = [
      ['Pick a Saturday night.', [['Neon-lit car meet in a parking garage', 'jdm'], ['Track day. Helmet on. No small talk', 'track'], ['A quiet drive somewhere expensive', 'luxury'], ['Replaying a racing game from 2005', 'gaming']]],
      ['Your build style?', [['Fast and loose — vibes over precision', 'tuner'], ['Patient perfectionist. Every crease crisp', 'hyper'], ['Old-school methods. Classic cool', 'classic'], ['Whatever wins, honestly', 'track']]],
      ['Choose a soundtrack.', [['Eurobeat at max volume', 'jdm'], ['A V12 and nothing else', 'hyper'], ['Jazz, a fireplace, maybe a monocle', 'luxury'], ['The racing-game menu theme, obviously', 'gaming']]]
    ];
    let step = 0, picks = [];
    const box = $('#quizCard');
    function render() {
      if (step < qs.length) {
        const [q, opts] = qs[step];
        box.innerHTML = `<div class="quiz__dots">${qs.map((_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div><p class="quiz__q">${q}</p><div class="quiz__opts">${opts.map(([t, v]) => `<button data-v="${v}">${t}</button>`).join('')}</div>`;
        if (window.gsap) gsap.from('.quiz__opts button', { x: 40, opacity: 0, stagger: .06, duration: .5, ease: 'power3.out' });
        return;
      }
      const tally = {}; picks.forEach(p => tally[p] = (tally[p] || 0) + 1);
      const c = cars.map(c => ({ c, s: c.groups.reduce((s, g) => s + (tally[g] || 0), 0) + Math.random() * .5 })).sort((a, b) => b.s - a.s)[0].c;
      box.innerHTML = `<div class="quiz__res"><span class="mono">You are…</span>${stage(c, { full: true })}${sfx(c.shout, { face: c.face })}<h3>${c.name}</h3><p>${c.slang.toLowerCase()} energy. ${c.note}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><a class="btn btn--orange" href="${hrefOf(c)}">Meet your car</a><button class="btn btn--ghost" id="quizAgain">Retake</button></div></div>`;
      if (window.gsap) { gsap.from('.quiz__res .stg__fit', { x: c.face === 'l' ? 300 : -300, opacity: 0, duration: 1, ease: 'expo.out' }); playSfx($('.quiz__res .sfx'), { delay: .5 }); }
      const r = box.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + 80, 40);
      reward('quiz', 1, 'Car personality quiz');
      $('#quizAgain').onclick = () => { step = 0; picks = []; render(); };
    }
    box.addEventListener('click', e => { const b = e.target.closest('.quiz__opts button'); if (!b) return; picks.push(b.dataset.v); step++; render(); });
    render();
  })();

  /* =========================================================
     SPEC LAB — compare + scale
     ========================================================= */
  $$('.lab__tabs button').forEach(b => b.addEventListener('click', () => {
    $$('.lab__tabs button').forEach(x => x.setAttribute('aria-selected', x === b));
    $('#paneCmp').hidden = b.dataset.lab !== 'cmp'; $('#paneSize').hidden = b.dataset.lab !== 'size';
    b.dataset.lab === 'size' ? renderRuler() : renderCmp();
  }));
  let ca = 'bmw-m3-gtr', cb = 'mitsubishi-evo-8-nfs-most-wanted';
  function renderCmp() {
    const side = (id, sel) => `${stage(byId(sel))}<h3>${byId(sel).name}</h3><select class="gp-select" id="${id}" aria-label="Choose car">${opt(sel)}</select>`;
    $('#cmpA').innerHTML = side('selA', ca); $('#cmpB').innerHTML = side('selB', cb);
    $('#selA').onchange = e => { ca = e.target.value; renderCmp(); };
    $('#selB').onchange = e => { cb = e.target.value; renderCmp(); };
    const A = byId(ca), B = byId(cb);
    const rows = [['Price', A.salePrice, B.salePrice, inr, 'low'], ['Discount', A.deal, B.deal, v => v + '%', 'high'], ['Length', A.length, B.length, v => v + ' mm', 'high'], ['A4 sheets', A.pages, B.pages, v => v, 'high'], ['Est. build', A.buildHours, B.buildHours, v => v + ' h', 'low'], ['Model year', A.year, B.year, v => v, 'high']];
    $('#cmpBars').innerHTML = rows.map(([l, x, y, f, better]) => {
      const max = Math.max(x, y) || 1, lx = better === 'high' ? x >= y : x <= y, ly = better === 'high' ? y >= x : y <= x;
      return `<div class="cbar"><div class="cbar__l"><i class="${lx ? 'win' : ''}" data-w="${x / max * 100}">${f(x)}</i></div><span>${l}</span><div class="cbar__r"><i class="${ly ? 'win' : ''}" data-w="${y / max * 100}">${f(y)}</i></div></div>`;
    }).join('');
    requestAnimationFrame(() => requestAnimationFrame(() => $$('#cmpBars i').forEach(i => i.style.width = Math.max(28, i.dataset.w) + '%')));
  }
  $('#scalePick').innerHTML = opt('devel-sixteen');
  function renderRuler() {
    const c = byId($('#scalePick').value), max = 320;
    const things = [['A4 sheet (long side)', 297], ['Smartphone', 150], ['Coffee mug', 95], ['Credit card', 86]];
    $('#ruler').innerHTML = `<div class="rrow car"><span>${c.name}</span><div class="rbar"><i data-w="${c.length / max * 100}">${c.length} mm</i></div></div>` +
      things.map(([nm, v]) => `<div class="rrow"><span>${nm}</span><div class="rbar"><i data-w="${v / max * 100}">${v} mm</i></div></div>`).join('') +
      `<div class="ruler__ticks"><span class="mono">0 — 320 mm</span><div></div></div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => $$('#ruler i').forEach(i => i.style.width = i.dataset.w + '%')));
  }
  $('#scalePick').addEventListener('change', renderRuler);
  renderCmp();

  /* ---------- bag bar (phones) ---------- */
  document.addEventListener('diy:cart', e => {
    const t = e.detail;
    $('#dockTotal').textContent = inr(t.total);
    $('#dockCount').textContent = `${t.count} item${t.count === 1 ? '' : 's'}${t.bundlePct ? ` · bundle −${t.bundlePct}%` : ''}`;
    $('#bagbar').classList.toggle('on', t.count > 0);
  });
  document.dispatchEvent(new CustomEvent('diy:cart', { detail: DIYcore.totals() }));

  if (!hasG) return;

  /* ---------- reveal the rest ---------- */
  $$('.shead h2, .quiz__h, .credit h2, .racer h2').forEach(h => gsap.from(h, { y: 60, opacity: 0, rotate: 2, duration: 1, ease: 'power4.out', scrollTrigger: { trigger: h, start: 'top 88%' } }));
  gsap.from('.ticket', { rotateX: -70, y: 60, opacity: 0, transformPerspective: 800, transformOrigin: 'top center', stagger: .1, duration: 1, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.tickets', start: 'top 85%' } });
  $$('.shelf').forEach(s => {
    gsap.from($('.shelf__hd', s).children, { y: 40, opacity: 0, stagger: .08, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 88%', once: true } });
    gsap.from($$('.kit', s), { y: 60, opacity: 0, stagger: .07, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: $('.shelf__row', s), start: 'top 92%', once: true } });
  });
  gsap.from('.quiz__card', { rotate: 6, y: 80, opacity: 0, duration: 1, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.quiz__card', start: 'top 85%' } });
  gsap.from('.bay3', { y: 60, opacity: 0, stagger: .1, duration: .8, scrollTrigger: { trigger: '#bays3', start: 'top 85%' } });
  gsap.from('.credit__in img', { scale: 0, rotate: -180, duration: 1.2, ease: 'back.out(2)', scrollTrigger: { trigger: '.credit', start: 'top 80%' } });

  addEventListener('load', () => {
    ScrollTrigger.refresh();
    if (location.hash) { const t = $(location.hash); if (t) setTimeout(() => window.lenis ? lenis.scrollTo(t, { immediate: true }) : t.scrollIntoView(), 150); }
  });
})();
