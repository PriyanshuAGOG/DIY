/* Shop — the showroom carousel and the five curated collections */
(function () {
  const { $, $$, url, inr, stage, sfx, playSfx, add, snd, byId, hrefOf, reduce } = DIYcore;
  const hasG = !!window.gsap && !reduce;
  const params = new URLSearchParams(location.search);

  /* =========================================================
     SHOWROOM CAROUSEL
     ========================================================= */
  const feat = ['ferrari-f40', 'bmw-m3-gtr', 'toyota-supra-mk5', 'mazda-787b', 'devel-sixteen'].map(byId);
  const themes = [...new Set(feat.map(c => c.chapter.theme))];
  $('#scenes').innerHTML = themes.map(t => `<div class="show__scene" data-theme="${t}"></div>`).join('');
  themes.forEach((t, k) => DIYscene.parallax(DIYscene.build($(`.show__scene[data-theme="${t}"]`), t, { seed: 40 + k, over: .1 }), $('#show'), 36));
  $('#segs').innerHTML = feat.map((c, i) => `<button class="seg" role="tab" data-i="${i}" aria-selected="false" aria-label="${c.name}"><i><b></b></i><span>${c.model}</span></button>`).join('');

  const DUR = 6.5;
  let cur = -1, busy = false, bar = null, paused = false;
  const titleHtml = c => `<span class="ln"><span>${c.model}</span></span>${c.sub ? `<span class="ln"><span class="sub">${c.sub}</span></span>` : ''}`;
  function fill(c) {
    $('#showKick').textContent = `${c.chapter.name} · Bay ${c.bay} · ${c.make}`;
    $('#showTitle').innerHTML = titleHtml(c);
    $('#showSfx').innerHTML = sfx(c.shout, { face: c.face, dark: true });
    $('#showLine').textContent = c.line;
    $('#showPrice').innerHTML = `<b>${inr(c.salePrice)}</b><s>${inr(c.price)}</s>`;
    $('#showView').href = hrefOf(c);
    $('#showName').textContent = c.model;
    $('#showCar').style.setProperty('--face', c.face === 'l' ? -1 : 1);
  }
  function runBar() {
    if (bar) bar.kill();
    $$('.seg i b').forEach((b, k) => { b.style.width = k < cur ? '100%' : '0%'; });
    if (!hasG) return;
    bar = gsap.fromTo($$('.seg i b')[cur], { width: '0%' }, { width: '100%', duration: DUR, ease: 'none', paused, onComplete: () => go(cur + 1, true) });
  }
  // auto = the carousel moved by itself: it still speaks, just softly (and only once sound is unlocked)
  function go(i, auto) {
    i = (i + feat.length) % feat.length;
    if (i === cur || busy) return;
    const c = feat[i], prev = cur >= 0 ? feat[cur] : null;
    cur = i;
    $$('.show__scene').forEach(s => s.classList.toggle('on', s.dataset.theme === c.chapter.theme));
    $$('.seg').forEach((s, k) => s.setAttribute('aria-selected', k === i));
    if (!hasG || !prev) {
      fill(c); $('#showCar').innerHTML = stage(c, { full: true, eager: true });
      if (hasG) { gsap.from('#showCar .stg__fit', { x: c.face === 'l' ? innerWidth * .6 : -innerWidth * .6, duration: 1.4, ease: 'expo.out' }); playSfx($('#showSfx .sfx'), { delay: .6 }); gsap.from('#showTitle .ln > span', { yPercent: 110, stagger: .08, duration: .9, ease: 'power4.out' }); }
      runBar(); return;
    }
    busy = true;
    const outX = prev.face === 'l' ? -innerWidth * .9 : innerWidth * .9;   // the old car drives away, nose first
    const inX = c.face === 'l' ? innerWidth * .7 : -innerWidth * .7;      // the new one arrives, nose first
    const pre = new Image(); pre.src = url(c.cut);
    gsap.timeline({ onComplete: () => { busy = false; } })
      .to('#showCar .stg__fit', { x: outX, duration: .55, ease: 'power2.in' }, 0)
      .to(['#showTitle .ln > span'], { yPercent: -110, stagger: .04, duration: .4, ease: 'power3.in' }, 0)
      .to(['#showKick', '#showLine', '.show__buy', '#showSfx'], { y: -14, opacity: 0, duration: .3, stagger: .03 }, 0)
      .to('#showName', { xPercent: prev.face === 'l' ? 12 : -12, opacity: 0, duration: .45, ease: 'power2.in' }, 0)
      .add(() => { fill(c); $('#showCar').innerHTML = stage(c, { full: true, eager: true }); })
      .fromTo('#showCar .stg__fit', { x: inX }, { x: 0, duration: 1.1, ease: 'expo.out', immediateRender: false })
      .fromTo('#showTitle .ln > span', { yPercent: 110 }, { yPercent: 0, stagger: .07, duration: .8, ease: 'power4.out' }, '<.05')
      .fromTo(['#showKick', '#showLine', '.show__buy', '#showSfx'], { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .6, stagger: .05, ease: 'power3.out' }, '<.1')
      .fromTo('#showName', { xPercent: c.face === 'l' ? -10 : 10, opacity: 0 }, { xPercent: 0, opacity: 1, duration: .9, ease: 'power3.out' }, '<')
      .add(() => playSfx($('#showSfx .sfx')), '<.3')
      .add(() => snd.car(c, { vol: auto ? .4 : 1, dur: 3.4, fout: .8 }), '<');
    runBar();
  }
  const setPaused = p => { paused = p; if (bar) p ? bar.pause() : bar.resume(); };
  $('#segs').addEventListener('click', e => { const s = e.target.closest('.seg'); if (s) go(+s.dataset.i); });
  $('#showPrev').addEventListener('click', () => go(cur - 1));
  $('#showNext').addEventListener('click', () => go(cur + 1));
  $('#showAdd').addEventListener('click', e => add(feat[cur].id, 1, e.currentTarget));
  $('#show').addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') setPaused(true); });
  $('#show').addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') setPaused(false); });
  document.addEventListener('visibilitychange', () => setPaused(document.hidden));
  // swipe / drag the car to change slides
  let sx = null;
  $('#show').addEventListener('pointerdown', e => { if (e.target.closest('a,button')) return; sx = e.clientX; });
  addEventListener('pointerup', e => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 60) go(cur + (dx < 0 ? 1 : -1)); });
  addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input,textarea,select')) return;
    const r = $('#show').getBoundingClientRect(); if (r.bottom < innerHeight * .4) return;
    if (e.key === 'ArrowRight') go(cur + 1); if (e.key === 'ArrowLeft') go(cur - 1);
  });
  DIYcore.revealed.then(() => go(0)); // the first slide starts once the page-transition sheet has opened, never underneath it

  // the header goes dark over the showroom
  const hdr = $('#hdr');
  const darkHdr = on => hdr.classList.toggle('hdr--dark', on);
  darkHdr(true);
  if (window.ScrollTrigger) ScrollTrigger.create({ trigger: '#show', start: 'top top', end: 'bottom top+=80', onToggle: s => darkHdr(s.isActive), onLeave: () => setPaused(true), onEnterBack: () => setPaused(false) });

  /* =========================================================
     THE COLLECTIONS: five curated shelves instead of one long grid
     ========================================================= */
  $('#grid').innerHTML = DIYcore.shelves();
  $('#colIndex').innerHTML = DIY.collections.map(k => `<a href="#col-${k.id}" style="--c:${k.color}"><b>${k.no}</b>${k.name}</a>`).join('');
  // older links (?v=jdm) and footer links (#col-jdm) both land on the right shelf
  const legacy = { jdm: 'jdm', hyper: 'flex', track: 'track', classic: 'poster', tuner: 'poster', gaming: 'track' }[params.get('v')];
  const target = location.hash.startsWith('#col-') ? location.hash : legacy ? '#col-' + legacy : null;
  if (target) addEventListener('load', () => setTimeout(() => { const t = $(target); if (t) window.lenis ? lenis.scrollTo(t, { offset: -90, immediate: true }) : t.scrollIntoView(); }, 200));
  if (hasG) {
    $$('.shelf').forEach(s => {
      gsap.from($('.shelf__hd', s).children, { y: 40, opacity: 0, stagger: .08, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 88%', once: true } });
      gsap.from($$('.kit', s), { y: 60, opacity: 0, rotation: i => (i % 2 ? 1.5 : -1.5), stagger: .07, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: $('.shelf__row', s), start: 'top 92%', once: true } });
    });
    addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
