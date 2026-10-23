/* Product page — renders any car from data: gallery, walk-around, what's inside, combos */
(function () {
  const { $, $$, url, inr, card, stage, sfx, playSfx, add, honk, snd, toast, confetti, state, byId, hrefOf, reduce, open } = DIYcore;
  const hasG = !!window.gsap && !reduce;
  const c = byId(document.body.dataset.id); if (!c) return;
  const cars = DIY.cars, i0 = cars.indexOf(c), ch = c.chapter;
  const heart = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 3.2 4.5 6.9 4.5c2.2 0 3.6 1.2 5.1 3 1.5-1.8 2.9-3 5.1-3 3.7 0 6 3.8 4.5 7.3C19.5 16.4 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  /* ---------- buy box ---------- */
  $('#crumb').textContent = c.name;
  $('#ppKick').textContent = `Bay ${c.bay} · ${ch.name}`;
  $('#ppMake').textContent = `${c.make} · ${c.tag}`;
  $('#ppName').innerHTML = `${c.model}${c.sub ? `<small>${c.sub}</small>` : ''}`;
  $('#ppSfx').innerHTML = sfx(c.shout, { face: c.face });
  $('#ppLine').textContent = `${c.line} ${c.description}`;
  $('#ppPrice').innerHTML = `<b>${inr(c.salePrice)}</b><s>${inr(c.price)}</s><span class="gp-off">Save ${inr(c.price - c.salePrice)} · ${c.deal}%</span>`;
  $('#ppSpecs').innerHTML = [['Scale', c.scale], ['Pattern sheets', `${c.pages} × A4, 210 GSM`], ['Built size', c.dims], ['Level', c.level], ['Est. build time', `~${c.buildHours} hours`], ['SKU', c.sku]].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  $('#ppCredit').textContent = `${c.credit} Images are visualisations of a finished build — yours may vary slightly. That’s the charm.` + (c.snd ? ` Engine sound: ${c.snd.rec} by ${c.snd.by} (${c.snd.lic})${c.snd.exact ? '' : `, a stand-in: ${c.snd.why}`}.` : '');
  const wishBtn = $('#ppWish'); wishBtn.dataset.wish = c.id; wishBtn.innerHTML = heart; wishBtn.setAttribute('aria-pressed', state.wish.includes(c.id));
  $('#ppRev').dataset.rev = c.id;
  let qty = 1;
  const setQty = q => { qty = Math.max(1, Math.min(9, q)); $('#qtyN').textContent = qty; $('#ppAdd').innerHTML = `Add to bag — ${inr(c.salePrice * qty)}`; };
  $('#qtyMinus').addEventListener('click', () => setQty(qty - 1));
  $('#qtyPlus').addEventListener('click', () => setQty(qty + 1));
  $('#ppAdd').addEventListener('click', e => add(c.id, qty, e.currentTarget));
  $('#ppBuy').addEventListener('click', e => { add(c.id, qty, e.currentTarget, true); DIYcore.lead(); }); // pre-launch: buying means joining the list
  setQty(1);

  /* =========================================================
     GALLERY — photos (with zoom lens) · walk around · what's inside
     ========================================================= */
  const shots = c.gallery;
  let pi = 0;
  $('#vPhotos').innerHTML = `<img class="pp-photo" id="photo" src="${url(shots[0].src)}" alt="${c.name} — ${shots[0].label}" width="1254" height="1254"><div class="pp-lens" id="lens"></div>
    <button class="pp-arrow prev" id="phPrev" aria-label="Previous photo">←</button><button class="pp-arrow next" id="phNext" aria-label="Next photo">→</button>
    <span class="chip pp-badge" id="phLabel">${shots[0].label}</span>`;
  $('#thumbs').innerHTML = shots.map((s, k) => `<button data-k="${k}" aria-current="${!k}" aria-label="${s.label}"><img src="${url(s.src)}" alt="" loading="lazy"></button>`).join('');
  function showPhoto(k) {
    pi = (k + shots.length) % shots.length;
    const img = $('#photo');
    const swap = () => { img.src = url(shots[pi].src); img.alt = `${c.name} — ${shots[pi].label}`; $('#phLabel').textContent = shots[pi].label; };
    if (hasG) gsap.to(img, { opacity: 0, duration: .18, onComplete: () => { swap(); gsap.to(img, { opacity: 1, duration: .3 }); } }); else swap();
    $$('#thumbs button').forEach((b, j) => b.setAttribute('aria-current', j === pi));
  }
  $('#thumbs').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; setView('photos'); showPhoto(+b.dataset.k); });
  $('#phPrev').addEventListener('click', () => showPhoto(pi - 1));
  $('#phNext').addEventListener('click', () => showPhoto(pi + 1));
  // zoom lens (fine pointers only)
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const st = $('#vPhotos'), lens = $('#lens'), Z = 2.6;
    st.addEventListener('pointermove', e => {
      if (e.target.closest('.pp-arrow')) { lens.style.opacity = 0; return; }
      const r = st.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      lens.style.left = x + 'px'; lens.style.top = y + 'px'; lens.style.opacity = 1;
      lens.style.backgroundImage = `url("${url(shots[pi].src)}")`;
      lens.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
      const lw = lens.offsetWidth / 2;
      lens.style.backgroundPosition = `${-(x * Z - lw)}px ${-(y * Z - lw)}px`;
    });
    st.addEventListener('pointerleave', () => lens.style.opacity = 0);
  }
  // lightbox
  const lb = document.createElement('div');
  lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', 'Photo viewer');
  lb.innerHTML = `<img id="lbImg" alt=""><button class="x" id="lbX" aria-label="Close">✕</button><button class="pp-arrow prev" id="lbPrev" aria-label="Previous">←</button><button class="pp-arrow next" id="lbNext" aria-label="Next">→</button>`;
  document.body.append(lb);
  const lbShow = k => { pi = (k + shots.length) % shots.length; $('#lbImg').src = url(shots[pi].src); $('#lbImg').alt = `${c.name} — ${shots[pi].label}`; };
  $('#photo').addEventListener('click', () => { lbShow(pi); lb.classList.add('on'); DIYcore.lockScroll(true); });
  const lbClose = () => { lb.classList.remove('on'); DIYcore.lockScroll(false); showPhoto(pi); };
  $('#lbX').addEventListener('click', lbClose);
  lb.addEventListener('click', e => { if (e.target === lb) lbClose(); });
  $('#lbPrev').addEventListener('click', () => lbShow(pi - 1));
  $('#lbNext').addEventListener('click', () => lbShow(pi + 1));
  addEventListener('keydown', e => { if (!lb.classList.contains('on')) return; if (e.key === 'Escape') lbClose(); if (e.key === 'ArrowLeft') lbShow(pi - 1); if (e.key === 'ArrowRight') lbShow(pi + 1); });

  // walk around: front ¾ → side → rear ¾, blended as you drag
  const W = $('#vWalk');
  W.innerHTML = `<div class="pp-walk__frames" id="frames">${[0, 1, 2].map(k => `<img src="${url(shots[k].src)}" alt="${c.name} — ${shots[k].label}" style="opacity:${k ? 0 : 1}" loading="lazy">`).join('')}
      <img id="walkTop" src="${url(shots[3].src)}" alt="${c.name} — overhead" style="opacity:0" loading="lazy"><img id="walkDetail" src="${url(shots[4].src)}" alt="${c.name} — paper detail" style="opacity:0" loading="lazy"></div>
    <span class="pp-hint mono" id="walkHint">← drag to walk around →</span>
    <div class="pp-walk__btns"><button id="wTop" aria-pressed="false">Top view</button><button id="wDetail" aria-pressed="false">Close-up</button></div>
    <div class="pp-dial" aria-hidden="true"><svg viewBox="0 0 150 44"><path d="M10,40 A65,65 0 0,1 140,40" fill="none" stroke="#d9d4c8" stroke-width="4" stroke-linecap="round"/><circle id="dialDot" cx="10" cy="40" r="7" fill="#ff641f" stroke="#20211e" stroke-width="2"/></svg><span class="mono" id="dialLbl">Front ¾ · Side · Rear ¾</span></div>`;
  const frames = $$('#frames img').slice(0, 3);
  const walk = { a: 0 };
  function renderWalk() {
    const a = walk.a, base = Math.min(2, Math.floor(a)), f = a - base;
    const ss = x => x <= .3 ? 0 : x >= .7 ? 1 : ((x - .3) / .4) ** 2 * (3 - 2 * (x - .3) / .4);
    // the nearest angle stays solid; the next one crossfades in quickly over it — no double exposures
    frames.forEach((im, k) => { im.style.opacity = k === base ? 1 : k === base + 1 ? ss(f).toFixed(3) : 0; });
    const frac = a - Math.round(a);
    $('#frames').style.transform = `rotateY(${(frac * -9).toFixed(2)}deg) scale(${(1 + Math.abs(frac) * .025).toFixed(3)})`;
    const t = a / 2, ang = Math.PI * (1 - t);
    $('#dialDot').setAttribute('cx', (75 + 65 * Math.cos(ang)).toFixed(1));
    $('#dialDot').setAttribute('cy', (40 - 36 * Math.sin(ang) * 1).toFixed(1));
  }
  let orbit = null, idleT;
  const autoOrbit = () => {
    if (!hasG) return;
    const go = a => ({ a, duration: .9, ease: 'power2.inOut', onUpdate: renderWalk });
    orbit = gsap.timeline({ repeat: -1 }).to(walk, go(1), '+=1.2').to(walk, go(2), '+=1.2').to(walk, go(1), '+=1.2').to(walk, go(0), '+=1.2');
  };
  const stopOrbit = () => { if (orbit) { orbit.kill(); orbit = null; } clearTimeout(idleT); idleT = setTimeout(() => { if (view === 'walk' && !dragging) autoOrbit(); }, 4000); };
  let dragging = false, sx = 0, a0 = 0;
  W.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; dragging = true; sx = e.clientX; a0 = walk.a; W.classList.add('drag'); W.setPointerCapture(e.pointerId); stopOrbit(); $('#walkHint').style.opacity = 0; overlay(null); });
  W.addEventListener('pointermove', e => { if (!dragging) return; walk.a = Math.max(0, Math.min(2, a0 - (e.clientX - sx) / (W.clientWidth * .45))); renderWalk(); });
  const endDrag = () => { if (!dragging) return; dragging = false; W.classList.remove('drag'); if (hasG) gsap.to(walk, { a: Math.round(walk.a * 2) / 2, duration: .4, ease: 'power2.out', onUpdate: renderWalk }); };
  W.addEventListener('pointerup', endDrag); W.addEventListener('pointercancel', endDrag);
  function overlay(which) {
    ['wTop', 'wDetail'].forEach(bid => $('#' + bid).setAttribute('aria-pressed', bid === which));
    $('#walkTop').style.opacity = which === 'wTop' ? 1 : 0;
    $('#walkDetail').style.opacity = which === 'wDetail' ? 1 : 0;
  }
  ['wTop', 'wDetail'].forEach(bid => $('#' + bid).addEventListener('click', () => { stopOrbit(); overlay($('#' + bid).getAttribute('aria-pressed') === 'true' ? null : bid); }));
  renderWalk();

  // what's inside: a 3D fan of the pattern sheets (illustrative)
  const I = $('#vInside');
  const sheetSvg = (k) => {
    const r = rng(c.no * 97 + k * 13); let s = '';
    for (let p = 0; p < 7; p++) {
      const cx = 12 + r() * 76, cy = 12 + r() * 104, rad = 8 + r() * 12, n = 3 + Math.floor(r() * 4);
      const pts = Array.from({ length: n }, (_, j) => { const an = j / n * Math.PI * 2 + r(); return [cx + Math.cos(an) * rad, cy + Math.sin(an) * rad * (1.1 + r() * .4)]; });
      s += `<polygon points="${pts.map(q => q.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="${c.accent}" fill-opacity=".22" stroke="#20211e" stroke-width=".7"/>`;
      s += `<polyline points="${pts.slice(0, 2).map(q => q.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="#20211e" stroke-width=".5" stroke-dasharray="2 1.5"/>`;
      s += `<text x="${cx.toFixed(1)}" y="${(cy + 2).toFixed(1)}" font-size="5" font-family="Space Mono, monospace" text-anchor="middle" fill="#20211e">${k + 1}${String.fromCharCode(65 + p)}</text>`;
    }
    return `<svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMid meet">${s}</svg>`;
  };
  I.innerHTML = `<div class="pp-fan" id="fan">${Array.from({ length: c.pages }, (_, k) => `<div class="pp-sheet" data-k="${k}">${sheetSvg(k)}<span>SHEET ${k + 1}/${c.pages} · ${c.model.toUpperCase()}</span></div>`).join('')}</div>
    <span class="pp-inside__cap mono">Illustration · ${c.pages} × A4 pattern sheets on 210 GSM matte card · drag to fan them out</span>`;
  const sheets = $$('.pp-sheet', I);
  const fan = { s: .35, ry: -24 };
  const renderFan = () => {
    sheets.forEach((sh, k) => {
      const m = k - (sheets.length - 1) / 2;
      sh.style.transform = `translateX(${(m * 26 * fan.s).toFixed(1)}%) translateZ(${(-Math.abs(m) * 30 * fan.s - k * 2).toFixed(1)}px) rotateY(${(m * 14 * fan.s).toFixed(1)}deg) rotateZ(${(m * 4 * fan.s).toFixed(1)}deg)`;
      sh.style.zIndex = 10 + k;
    });
    $('#fan').style.transform = `rotateX(16deg) rotateY(${fan.ry.toFixed(1)}deg)`;
  };
  let fd = false, fx = 0, fs0 = 0, fr0 = 0;
  I.addEventListener('pointerdown', e => { fd = true; fx = e.clientX; fs0 = fan.s; fr0 = fan.ry; I.setPointerCapture(e.pointerId); });
  I.addEventListener('pointermove', e => { if (!fd) return; const dx = (e.clientX - fx) / I.clientWidth; fan.s = Math.max(.15, Math.min(1.2, fs0 + Math.abs(dx) * 1.6)); fan.ry = Math.max(-50, Math.min(30, fr0 + dx * 60)); renderFan(); });
  I.addEventListener('pointerup', () => { fd = false; });
  renderFan();

  // tabs
  let view = 'photos';
  function setView(v) {
    view = v;
    $$('.pp-tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.view === v));
    $('#vPhotos').hidden = v !== 'photos'; W.hidden = v !== 'walk'; I.hidden = v !== 'inside';
    if (v === 'walk') { if (!orbit && !dragging) autoOrbit(); } else if (orbit) { orbit.kill(); orbit = null; }
    if (v === 'inside' && hasG) gsap.fromTo(fan, { s: 0 }, { s: .55, duration: 1.2, ease: 'elastic.out(1,.6)', onUpdate: renderFan });
  }
  $$('.pp-tabs button').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));

  /* =========================================================
     FREQUENTLY BUILT TOGETHER
     ========================================================= */
  const partners = cars.filter(x => x.ch === c.ch && x.id !== c.id).sort((a, b) => Math.abs(a.salePrice - c.salePrice) - Math.abs(b.salePrice - c.salePrice)).slice(0, 2);
  const pick = { [c.id]: true }; partners.forEach(p => pick[p.id] = true);
  function renderTogether() {
    const items = [c, ...partners];
    $('#together').innerHTML = items.map((p, k) => `${k ? '<span class="tg__plus" aria-hidden="true">+</span>' : ''}
      <div class="tg ${pick[p.id] ? '' : 'off'}">
        ${k ? `<label><input type="checkbox" data-tg="${p.id}" ${pick[p.id] ? 'checked' : ''}> Add</label>` : '<label><span class="mono">This kit</span></label>'}
        ${stage(p)}<b>${p.name}</b><small>${inr(p.salePrice)} · ${p.scale}</small>
        ${k ? `<a class="mono" href="${hrefOf(p)}">View kit →</a>` : ''}
      </div>`).join('') + (() => {
      const sel = items.filter(p => pick[p.id]), n = sel.length, pct = n >= 3 ? 12 : n === 2 ? 5 : 0;
      const sale = sel.reduce((s, p) => s + p.salePrice, 0), mrp = sel.reduce((s, p) => s + p.price, 0), tot = sale * (1 - pct / 100);
      return `<div class="tg__sum"><span class="mono">${n} kit${n > 1 ? 's' : ''} · garage bundle ${pct ? '−' + pct + '%' : 'off'}</span><b>${inr(tot)}</b><span><s>${inr(mrp)}</s> <span class="save">You save ${inr(mrp - tot)}</span></span><button class="btn btn--acid" id="tgAdd">Add ${n} to bag</button></div>`;
    })();
    $('#tgAdd').addEventListener('click', e => { items.filter(p => pick[p.id]).forEach(p => add(p.id, 1, e.currentTarget, true)); toast('Bundle parked in your bag.', '🏁', 'View bag', () => open('bag')); confetti(e.clientX, e.clientY, 30); });
  }
  $('#together').addEventListener('change', e => { const t = e.target.closest('[data-tg]'); if (!t) return; pick[t.dataset.tg] = t.checked; renderTogether(); });
  renderTogether();

  /* ---------- garage combos ---------- */
  let combos = DIY.combos.filter(k => k.cars.includes(c.id));
  if (combos.length < 3) combos = combos.concat(DIY.combos.filter(k => !combos.includes(k) && k.list.some(x => x.groups.some(g => c.groups.includes(g))))).slice(0, 3);
  $('#combos').innerHTML = combos.map(k => `
    <article class="combo">
      <div class="combo__cars">${k.list.map(x => stage(x)).join('')}</div>
      <h3>${k.name}</h3><p>${k.line} ${k.list.map(x => x.model).join(' · ')}</p>
      <div class="combo__ft"><span><b>${inr(k.price)}</b><s>${inr(k.mrp)}</s></span><button class="btn btn--paper btn--sm" data-combo="${k.id}">Add combo</button></div>
    </article>`).join('');
  $('#combos').addEventListener('click', e => { const b = e.target.closest('[data-combo]'); if (!b) return; const k = DIY.combos.find(x => x.id === b.dataset.combo); k.cars.forEach(x => add(x, 1, b, true)); toast(`${k.name} combo is in your bag. 12% off applied.`, '🏁', 'View bag', () => open('bag')); });

  /* ---------- build journey ---------- */
  const H = c.buildHours, fmt = h => h < 1 ? `~${Math.round(h * 60)} min` : `~${Math.round(h * 2) / 2}h`;
  $('#journey').innerHTML = [['📄', 'Get ready', .1, 'Lay out the sheets. Meet the pieces.'], ['✂', 'Cut', .35, 'Free the shapes. Follow the lines.'], ['↗', 'Fold', .2, 'Score and fold. It starts to stand.'], ['＋', 'Glue', .3, 'Match the tabs. Let it set.'], ['✳', 'Flex', .05, 'Shelf it. Take all the credit.']]
    .map(([ic, n, f, d]) => `<div class="jstep"><i>${ic}</i><b>${n}</b><small>${fmt(H * f)}</small><p>${d}</p></div>`).join('');

  /* ---------- more from the garage ---------- */
  const more = cars.filter(x => x.id !== c.id).map(x => ({ x, s: x.groups.filter(g => c.groups.includes(g)).length + (x.ch === c.ch ? .5 : 0) })).sort((a, b) => b.s - a.s).slice(0, 4).map(o => o.x);
  $('#more').innerHTML = more.map(x => card(x)).join('');

  /* ---------- prev / next ---------- */
  const prev = cars[(i0 - 1 + cars.length) % cars.length], next = cars[(i0 + 1) % cars.length];
  $('#ppNav').innerHTML = `<a href="${hrefOf(prev)}"><span class="mono">← Bay ${prev.bay}</span><b>${prev.model}</b>${stage(prev)}</a><a href="${hrefOf(next)}"><span class="mono">Bay ${next.bay} →</span><b>${next.model}</b>${stage(next)}</a>`;

  /* ---------- sticky buy bar ---------- */
  $('#sticky').innerHTML = `${stage(c, { shadow: false, alt: '' })}<div><b>${c.name}</b><span>${inr(c.salePrice)} · <s>${inr(c.price)}</s></span></div><button class="btn btn--acid btn--sm" data-add="${c.id}">Add to bag</button>`;
  new IntersectionObserver(([en]) => $('#sticky').classList.toggle('on', !en.isIntersecting && en.boundingClientRect.top < 0)).observe($('#ppCtas'));

  /* ---------- motion ---------- */
  // landing on a car's page: it starts up. If the browser still wants a click first, it plays on that first tap (within 10 s)
  snd.load('car-' + c.id); setTimeout(() => snd.car(c, { wait: 10000, dur: 5, fout: 1 }), DIYcore.arrived ? 700 : 350);

  if (!hasG) return;
  gsap.from('.pp-gal', { y: 40, opacity: 0, duration: 1, ease: 'power3.out' });
  gsap.from('.pp-buy > *', { y: 30, opacity: 0, stagger: .05, duration: .8, ease: 'power3.out', delay: .1 });
  playSfx($('#ppSfx .sfx'), { delay: .5 });
  $$('.pp-sec .shead h2').forEach(h => gsap.from(h, { y: 50, opacity: 0, duration: 1, ease: 'power4.out', scrollTrigger: { trigger: h, start: 'top 88%' } }));
  gsap.from('.tg, .tg__sum', { y: 40, opacity: 0, stagger: .08, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '#together', start: 'top 85%' } });
  gsap.from('.combo', { y: 50, opacity: 0, stagger: .1, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '#combos', start: 'top 85%' } });
  gsap.from('.jstep', { y: 30, opacity: 0, stagger: .08, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: '#journey', start: 'top 85%' } });
  ScrollTrigger.batch('#more .kit', { start: 'top 92%', onEnter: b => gsap.from(b, { y: 50, opacity: 0, stagger: .06, duration: .8, ease: 'power3.out', overwrite: true }) });
})();
