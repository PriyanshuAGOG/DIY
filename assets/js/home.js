/* Do It Yar — home: one continuous motion from a paper dream to the garage */
(function () {
  const { $, $$, url, inr, stage, sfx, playSfx, honk, snd, add, reward, toast, confetti, pop, state, reduce, byId, hrefOf } = DIYcore;
  const hasG = !!window.gsap && !!window.ScrollTrigger;
  const cars = DIY.cars;
  const hero = byId('ferrari-f40');
  const sup = byId('toyota-supra-mk5');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* =========================================================
     1 · THE PAPER DREAM — scene, title letters, car
     ========================================================= */
  const dream = DIYscene.build($('#dreamScene'), 'dream', { seed: 11, over: .12 });
  const L = n => dream.layers.find(l => l.name === n).el;
  const carBox = $('#dreamCar');
  carBox.style.aspectRatio = hero.ar;
  carBox.innerHTML = stage(hero, { full: true, eager: true, alt: 'Red Ferrari F40 papercraft model on a paper road' });
  $$('#dreamTitle .w').forEach(w => { w.innerHTML = [...w.textContent].map(ch => `<span class="c">${ch}</span>`).join(''); });

  const honkHero = () => {
    const r = carBox.getBoundingClientRect();
    honk(hero, r.left + r.width * .55, r.top + r.height * .05);
    if (hasG) gsap.fromTo(carBox.querySelector('.stg__fit'), { y: 0 }, { keyframes: [{ y: -10, rotation: -.8, duration: .12 }, { y: 0, rotation: 0, duration: .5, ease: 'bounce.out' }] });
  };
  carBox.addEventListener('click', honkHero);
  carBox.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); honkHero(); } });

  /* ---------- loader ---------- */
  function loader(done) {
    const el = $('#loader');
    if (!el || !hasG || reduce) { if (el) el.remove(); return done(); }
    // arriving through a paper transition: that sheet is the loader; the counter never plays underneath it
    if (DIYcore.arrived) { el.remove(); try { sessionStorage.setItem('diy.seen', '1'); } catch (e) {} DIYcore.revealed.then(done); return; }
    let seen = false; try { seen = sessionStorage.getItem('diy.seen') === '1'; sessionStorage.setItem('diy.seen', '1'); } catch (e) {}
    if (window.lenis) lenis.stop();
    const min = seen ? 350 : 1300, t0 = performance.now(), total = 2; let loaded = 0, finished = false;
    const im = new Image(); im.onload = im.onerror = () => loaded++; im.src = url(hero.cut);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => loaded++);
    const finish = () => {
      if (finished) return; finished = true;
      gsap.timeline({ onComplete: () => el.remove() })
        .to('#ldNum', { yPercent: -40, opacity: 0, duration: .35, ease: 'power2.in' })
        .to(el, { yPercent: -100, duration: .9, ease: 'power4.inOut' }, '-=.1')
        .add(() => { if (window.lenis) lenis.start(); done(); }, '-=.55');
    };
    setTimeout(finish, 6000);
    (function tick() {
      if (finished) return;
      const v = Math.min((performance.now() - t0) / min, loaded / total);
      $('#ldNum').textContent = String(Math.round(v * 100)).padStart(2, '0');
      $('#ldBar').style.width = v * 100 + '%';
      v >= 1 ? finish() : requestAnimationFrame(tick);
    })();
  }

  /* ---------- pop-up book intro ---------- */
  function intro() {
    startPlane();
    if (!hasG || reduce) return;
    [L('far'), L('mid'), L('road'), L('front')].forEach(el => gsap.set(el, { transformOrigin: '50% 100%', transformPerspective: 1400 }));
    gsap.timeline({ defaults: { ease: 'back.out(1.4)' } })
      .from('#sun', { scale: 0, rotation: -120, duration: 1.2, ease: 'back.out(2)' }, 0)
      .from(L('clouds'), { yPercent: -25, opacity: 0, duration: 1.3, ease: 'power3.out' }, 0)
      .from(L('far'), { rotationX: -86, duration: 1.1 }, .1)
      .from('#dreamTitle .c', { rotationX: -95, opacity: 0, duration: .9, stagger: .035, ease: 'back.out(2.2)' }, .25)
      .from(L('mid'), { rotationX: -86, duration: 1.1 }, .35)
      .from(L('road'), { rotationX: -80, duration: 1 }, .5)
      .from(L('front'), { rotationX: -86, duration: 1.1 }, .6)
      .from('#dreamCar .stg__fit', { x: () => innerWidth * .75, skewX: 10, duration: 1.5, ease: 'expo.out' }, .85)
      .add(() => snd.car(hero, { dur: 4, vol: .8 }), .8) // only if sound is already unlocked (you clicked your way here)
      .from('#dreamUi > *', { y: 30, opacity: 0, stagger: .08, duration: .7, ease: 'power3.out' }, 1.05)
      .from('#dreamHint', { opacity: 0, duration: .6 }, 1.6);
  }

  function startPlane() {
    if (!hasG || !window.MotionPathPlugin || reduce) return;
    gsap.to('#plane', { duration: 8, repeat: -1, repeatDelay: 1.5, ease: 'power1.inOut', motionPath: { path: '#planePath', align: '#planePath', alignOrigin: [.5, .5], autoRotate: true } });
  }

  // pointer parallax: every paper layer at its own depth
  // the car's wrapper is driven by scroll, its stage by the pointer, its inner fit by the intro: three owners, never a tug-of-war
  // Tires and road share a fixed vertical baseline; the sky can still move in depth.
  dream.layers.filter(l => ['road', 'front'].includes(l.name)).forEach(l => l.yDepth = 0);
  dream.layers.push({ el: $('#dreamTitle'), depth: .08 }, { el: $('#sun'), depth: .03 }, { el: carBox.querySelector('.stg'), depth: .34, yDepth: 0 });
  DIYscene.parallax(dream, $('.dream__pin'), 46);

  /* =========================================================
     2..4 · rendered pieces
     ========================================================= */
  // remember when: the bedroom diorama, the night sky behind it, and the box parked on the rug
  const room = DIYscene.build($('#childRoom'), 'room', { seed: 17, over: .08 });
  const sky = DIYscene.build($('#childSky'), 'night', { seed: 23, over: .06 });
  const parkBox = () => {
    const el = $('#childRoom'), b = $('.launch'), g = DIYscene.rugAt(el.clientWidth, el.clientHeight, .08), s = b.offsetWidth;
    b.style.left = (g.x - s / 2) + 'px'; b.style.top = (g.y - s * .96) + 'px';
  };
  parkBox(); new ResizeObserver(parkBox).observe($('#childRoom'));
  DIYscene.parallax(room, $('.child__pin'), 26); DIYscene.parallax(sky, $('.child__pin'), 18);
  if (!hasG || reduce) $('.child').classList.add('child--static');

  // how: the sheet becomes a Supra
  $('#howFinal').style.aspectRatio = sup.ar;
  $('#howFinal').innerHTML = stage(sup, { full: true });
  $('#howSfx').innerHTML = sfx(sup.shout, { face: sup.face });

  // garage carousel
  const ring = $('#cfRing');
  ring.innerHTML = cars.map((c, i) => `<div class="cf__item" data-i="${i}" role="group" aria-label="${c.name}">${stage(c, { alt: c.name + ' papercraft model' })}</div>`).join('');
  const items = $$('.cf__item', ring);
  let f = 0, idx = -1, spacing = 400, cfSnd = 0;
  // a showroom, not a pile: one car on the plinth, one waiting either side, the rest out of sight
  function layout(fv) {
    items.forEach((el, i) => {
      const o = i - fv, a = Math.abs(o);
      if (a > 2.3) { el.style.opacity = 0; el.style.visibility = 'hidden'; return; }
      const x = Math.sign(o) * (a <= 1 ? a * spacing : spacing + (a - 1) * spacing * .5);
      const s = a <= 1 ? 1 - a * .44 : .56 - (a - 1) * .14;
      el.style.visibility = '';
      el.style.transform = `translate3d(${x.toFixed(1)}px,0,${(-Math.min(a, 2) * 300).toFixed(1)}px) rotateY(${Math.max(-18, Math.min(18, -o * 14)).toFixed(2)}deg) scale(${s.toFixed(3)})`;
      el.style.opacity = (a <= 1 ? 1 - a * .5 : Math.max(0, .5 - (a - 1) * .5)).toFixed(3);
      el.style.zIndex = 100 - Math.round(a * 10);
      el.style.pointerEvents = a > 1.5 ? 'none' : '';
    });
  }
  function sizeItems() {
    const st = $('#cfStage').getBoundingClientRect(), narrow = innerWidth < 760;
    const iw = Math.max(240, Math.min(st.width * (narrow ? .98 : .44), st.height * 1.7, 980)); // car + plinth always fit the stage height
    $('.cf').style.setProperty('--iw', iw + 'px');
    spacing = narrow ? innerWidth * .8 : Math.max(iw * .82, Math.min(innerWidth * .38, iw * .95)); // neighbours never touch the hero car
    layout(f);
  }
  function setInfo(i) {
    if (i === idx) return; idx = i;
    const c = cars[i];
    $('#cfMake').textContent = `${c.make} / ${c.tag}`;
    $('#cfModel').textContent = c.model + (c.sub ? ' ' + c.sub : '');
    $('#cfPrice').textContent = inr(c.salePrice);
    $('#cfMrp').textContent = inr(c.price);
    $('#cfName').textContent = c.model;
    $('#cfNow').textContent = c.bay;
    $('#cfView').href = hrefOf(c);
    $('#cfSfx').innerHTML = sfx(c.shout, { face: c.face, dark: true });
    playSfx($('#cfSfx .sfx'));
    // the car you stop on speaks (softly); flicking past several only voices the last one
    clearTimeout(cfSnd); cfSnd = setTimeout(() => { if (idx === i && cfST && cfST.isActive) snd.car(c, { vol: .6, dur: 2.8, fout: .8 }); }, 420);
    if (hasG && !reduce) {
      gsap.fromTo(['#cfMake', '#cfModel', '.cf__price'], { y: 14, opacity: 0 }, { y: 0, opacity: 1, stagger: .05, duration: .45, ease: 'power3.out', overwrite: true });
      gsap.fromTo('#cfName', { opacity: 0, scale: .94 }, { opacity: 1, scale: 1, duration: .7, ease: 'power3.out', overwrite: true });
    }
  }
  let cfST = null;
  function goTo(i) {
    i = Math.max(0, Math.min(cars.length - 1, i));
    if (cfST && window.lenis) lenis.scrollTo(cfST.start + (cfST.end - cfST.start) * i / (cars.length - 1), { duration: .9 });
    else if (cfST) window.scrollTo({ top: cfST.start + (cfST.end - cfST.start) * i / (cars.length - 1), behavior: 'smooth' });
    else { f = i; layout(f); setInfo(i); }
  }
  $('#cfPrev').addEventListener('click', () => goTo(idx - 1));
  $('#cfNext').addEventListener('click', () => goTo(idx + 1));
  $('#cfAdd').addEventListener('click', e => add(cars[idx].id, 1, e.currentTarget));
  ring.addEventListener('click', e => {
    const it = e.target.closest('.cf__item'); if (!it) return;
    const i = +it.dataset.i;
    i === idx ? $('#cfView').click() : goTo(i);
  });
  addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input,textarea,select')) return;
    const r = $('.cf__pin').getBoundingClientRect();
    if (r.top > innerHeight * .5 || r.bottom < innerHeight * .5) return;
    if (e.key === 'ArrowRight') goTo(idx + 1);
    if (e.key === 'ArrowLeft') goTo(idx - 1);
  });
  // touch: swipe the stage sideways to change car (the page still scrolls vertically)
  {
    let sx = null, sy = 0; const stg = $('#cfStage');
    stg.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; sx = e.clientX; sy = e.clientY; });
    addEventListener('pointerup', e => { if (sx == null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null; if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) goTo(idx + (dx < 0 ? 1 : -1)); });
    addEventListener('pointercancel', () => { sx = null; });
  }
  sizeItems(); setInfo(0);
  addEventListener('resize', () => { clearTimeout(window.__cfR); window.__cfR = setTimeout(sizeItems, 120); });

  /* =========================================================
     5..8 · manifesto, club, eggs
     ========================================================= */
  const quests = [
    ['pop', 'Press the certified chaos button 10 times', 1],
    ['star', 'Find the tiny star hiding in the FAQ', 1, true],
    ['logo', 'Our logo gets dizzy if you click it fast enough', 1, true],
    ['vroom', 'Type a certain car noise on your keyboard', 1, true],
    ['konami', 'An old-school cheat code still works here', 2, true],
    ['tear', 'The footer has a breaking point. Keep scrolling.', 10, true],
    ['scratch', 'Scratch the mystery card in the paper garage', 2],
    ['race', 'Beat the studio bot in the Paper Grand Prix', 2],
    ['quiz', 'Take the “Which car are you?” quiz', 1],
    ...DIYgames.games.map(g => [g.id, `Win “${g.no.split('/ ')[1]}”`, g.pct])
  ];
  const named = { star: 'Found the hidden star', logo: 'Made the logo dizzy', vroom: 'Typed VROOM', konami: 'Entered the cheat code', tear: 'Tore DIYMAXXXXXING' };
  function renderClub() {
    $('#quests').innerHTML = quests.map(([id, label, pct, secret]) => {
      const done = !!state.rewards[id];
      return `<li class="${done ? 'done' : secret ? 'secret' : ''}"><i>${done ? '✓' : secret ? '?' : ''}</i><span>${done && secret ? named[id] : secret ? `<b>Secret:</b> ${label}` : label}</span><small>+${pct}%</small></li>`;
    }).join('');
    const pct = DIYcore.rewardTotal();
    $('#jarFill').style.height = pct * 10 + '%';
    $('#jarPct').textContent = pct + '%';
  }
  renderClub();
  document.addEventListener('diy:rewards', renderClub);
  // phones: only three quests show; one button folds out the rest (and back)
  {
    const btn = $('#questsMore'), list = $('#quests'), mq = matchMedia('(max-width: 760px)');
    const paint = () => { const open = list.classList.contains('open'); btn.hidden = !mq.matches; btn.setAttribute('aria-expanded', open); btn.firstChild.textContent = open ? 'Fold them away ' : `Show all ${quests.length} quests `; $('.arr', btn).textContent = open ? 'â†‘' : 'â†“'; };
    btn.addEventListener('click', () => { list.classList.toggle('open'); paint(); if (window.ScrollTrigger) ScrollTrigger.refresh(); if (window.gsap && list.classList.contains('open')) gsap.from($$('#quests li:nth-child(n+4)'), { y: 16, opacity: 0, stagger: .03, duration: .4, ease: 'power2.out' }); });
    mq.addEventListener('change', paint); paint();
  }

  $('#hiddenStar').addEventListener('click', e => { e.preventDefault(); confetti(e.clientX, e.clientY, 40); pop('YOU FOUND ME!', e.clientX, e.clientY - 40, { size: '28px' }); reward('star', 1, 'Hidden star'); });

  let presses = 0;
  $('#chaosBtn').addEventListener('click', e => {
    presses++;
    document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake');
    snd.horn(); confetti(e.clientX, e.clientY, 24, { quiet: 1 });
    const lines = ['Chaos certified.', 'Again? Bold.', 'The paper is vibrating.', 'Somewhere, a glue stick sighed.', 'You absolute menace.', 'Okay this is fun.', 'The studio bot is concerned.', 'Two more…', 'One more…'];
    if (presses < 10) toast(lines[presses - 1] || 'Chaos.', '✳');
    if (presses === 10) { pop('MAXIMUM CHAOS!', e.clientX, e.clientY - 80); reward('pop', 1, 'Chaos button'); }
  });

  if (!hasG || reduce) { loader(() => {}); return; }

  /* =========================================================
     GSAP — the single continuous motion
     ========================================================= */
  loader(intro);

  // background morphs between chapters; header follows the ink
  const setTheme = sec => {
    gsap.to('#bgfx', { backgroundColor: sec.dataset.bg, duration: .8, ease: 'power2.out', overwrite: true });
    const light = sec.dataset.ink === 'light';
    $('#hdr').classList.toggle('hdr--dark', light);
    $('.trail').classList.toggle('trail--light', light);
  };
  $$('main > section[data-bg]').forEach(sec => ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', refreshPriority: -1, onToggle: s => s.isActive && setTheme(sec) }));
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => gsap.set('#trailPlane', { y: s.progress * Math.max(0, $('.trail').clientHeight - 26) }) });

  // 1 · dive into the dream; the sun swallows the screen
  const sunCover = () => {
    const r = $('#sun').getBoundingClientRect(), pr = $('.dream__pin').getBoundingClientRect();
    const cx = r.left + r.width / 2 - pr.left, cy = r.top + r.height / 2 - pr.top;
    const far = Math.max(Math.hypot(cx, cy), Math.hypot(pr.width - cx, cy), Math.hypot(cx, pr.height - cy), Math.hypot(pr.width - cx, pr.height - cy));
    return far / (r.width / 2) * 1.08;
  };
  [L('front'), L('road'), L('mid'), L('far')].forEach(el => gsap.set(el, { transformOrigin: '50% 100%' }));
  gsap.timeline({ scrollTrigger: { trigger: '.dream__pin', start: 'top top', end: '+=150%', pin: true, scrub: .8, invalidateOnRefresh: true } })
    .to(['#dreamUi', '#dreamHint'], { opacity: 0, y: 30, duration: .12 }, 0)
    .to(carBox, { x: () => -innerWidth * 1.15, skewX: 12, duration: .42, ease: 'power2.in' }, .03)
    .to(L('front'), { scale: 2, yPercent: 32, duration: .6, ease: 'none' }, 0)
    .to(L('road'), { scale: 1.5, yPercent: 26, duration: .6, ease: 'none' }, 0)
    .to(L('mid'), { scale: 1.28, yPercent: 14, duration: .6, ease: 'none' }, 0)
    .to(L('far'), { scale: 1.12, yPercent: 6, duration: .6, ease: 'none' }, 0)
    .to(L('clouds'), { yPercent: -16, duration: .6, ease: 'none' }, 0)
    .to('#dreamTitle', { yPercent: -70, scale: 1.1, opacity: 0, duration: .38, ease: 'none' }, .04)
    .to('#planeSvg', { opacity: 0, duration: .15 }, .25)
    .set('#sun', { zIndex: 11 }, .46)
    .to('#sun', { scale: sunCover, duration: .5, ease: 'power2.in' }, .48)
    .to('.dream__handoff', { opacity: 1, duration: .1, ease: 'none' }, .88);

  // 2 · remember when: the bedroom pops up out of the sun's orange, the box lands on the rug, 3·2·1,
  //     and the camera rides the rocket up through the ceiling into a paper night sky
  {
    const L2 = n => room.layers.find(l => l.name === n).el, S = () => $('.launch').offsetWidth, CH = () => $('#childRoom').clientHeight;
    const smoke = $('#lSmoke'), sl = smoke.getTotalLength(), count = $$('#lCount b'), names = ['wall', 'shelf', 'floor', 'front'];
    gsap.set(smoke, { strokeDasharray: sl, strokeDashoffset: sl });
    gsap.set('#cube', { rotationX: -24, rotationY: -36 });
    gsap.set('#rocket', { xPercent: -50, y: () => S() * .2 }); // tucked inside the box (nothing pokes out below it)
    names.forEach(n => gsap.set(L2(n), { transformOrigin: '50% 100%', transformPerspective: 1400 }));
    // the night only exists once the rocket leaves; the box only once it falls in. Until then it's all the sun's orange
    gsap.set(['#childSky', '.launch'], { autoAlpha: 0 });
    let launched = false, tIgn = .6, tLift = .65, tNight = .8;
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.child__pin', start: 'top top', end: '+=340%', pin: true, scrub: .8, invalidateOnRefresh: true,
      onUpdate: s => {
        const p = s.progress;
        $('.child').classList.toggle('ignite', p > tIgn && p < tNight + .1);
        if (p > tLift && !launched && s.direction > 0) snd.swish(1.8, .7, 80, 1600); // the rumble, once per lift-off
        launched = p > tLift;
        const night = p > tNight; $('#hdr').classList.toggle('hdr--dark', night); $('.trail').classList.toggle('trail--light', night);
      } } })
      // the pop-up: wall, shelf, floor and bed fold up one after another, like the hero's paper book
      .from(L2('wall'), { rotationX: -88, duration: .5, ease: 'back.out(1.3)' }, 0)
      .from(L2('shelf'), { rotationX: -88, duration: .42, ease: 'back.out(1.5)' }, .12)
      .from(L2('floor'), { rotationX: -88, duration: .42, ease: 'back.out(1.2)' }, .2)
      .from(L2('front'), { rotationX: -88, duration: .42, ease: 'back.out(1.5)' }, .3)
      .from('.child__in .mono', { y: 20, opacity: 0, duration: .3 }, .1)
      .from('#childQ .ln > span', { yPercent: 115, stagger: .12, duration: .4, ease: 'power3.out' }, .14)
      // the box drops onto the rug, squashes, wiggles, pops its flaps
      .set('.launch', { autoAlpha: 1 }, .62)
      .from('#box3d', { y: () => -innerHeight * .9, rotation: -14, duration: .45, ease: 'power2.in' }, .62)
      .from('#lShadow', { scale: .2, opacity: 0, duration: .45, ease: 'power2.in' }, '<')
      .to('#box3d', { keyframes: [{ scaleY: .86, scaleX: 1.08, duration: .08 }, { scaleY: 1, scaleX: 1, duration: .2, ease: 'back.out(3)' }] }, '>')
      .to('#cube', { keyframes: [{ rotationZ: 3, duration: .06 }, { rotationZ: -3, duration: .06 }, { rotationZ: 2, duration: .06 }, { rotationZ: 0, duration: .06 }] }, '>.08')
      .to('.flap--f', { '--a': '-38deg', duration: .3, ease: 'back.out(2)' }, '>')
      .to('.flap--b', { '--a': '-30deg', duration: .3, ease: 'back.out(2)' }, '<.05')
      .to('.flap--l', { '--a': '-26deg', duration: .3, ease: 'back.out(2)' }, '<.05')
      .to('.flap--r', { '--a': '-42deg', duration: .3, ease: 'back.out(2)' }, '<.05')
      .to('#rocket', { y: () => -S() * .3, duration: .4, ease: 'back.out(1.6)' }, '>')
      .to('#childQ em', { backgroundSize: '100% .16em', duration: .3, ease: 'none' }, '<')
      .fromTo(count, { opacity: 0, scale: .4 }, { opacity: 1, scale: 1, duration: .1, stagger: .16, ease: 'back.out(3)' }, '>')
      .to(count, { opacity: 0, scale: 1.6, duration: .08, stagger: .16 }, '<.1')
      .addLabel('ign', '>-.05')
      .to('.rocket__flame', { scaleY: 1, duration: .1 }, 'ign')
      .to('#cube', { keyframes: [{ x: -3, duration: .03 }, { x: 3, duration: .03 }, { x: -2, duration: .03 }, { x: 0, duration: .03 }] }, 'ign')
      // lift-off, and the camera follows it up: near things fall away faster (yPercent, so the pointer parallax keeps its own y)
      .addLabel('lift', 'ign+=.14')
      // the rocket climbs out, then holds its place on screen while the room falls away beneath it (camera locked on), then it's gone
      .to('#rocket', { y: () => -CH() * .5, rotationZ: 3, duration: .3, ease: 'power2.in' }, 'lift')
      .to('#rocket', { y: () => -CH() * (1.32 + .5), duration: 1.2, ease: 'power2.inOut' }, 'lift+=.25')
      .to(smoke, { strokeDashoffset: () => sl * .22, duration: 1.45, ease: 'power1.inOut' }, 'lift') // the trail ends at the rocket, not past it
      .to(L2('wall'), { yPercent: 104, duration: 1.2, ease: 'power2.inOut' }, 'lift+=.25')
      .to(L2('shelf'), { yPercent: 118, duration: 1.2, ease: 'power2.inOut' }, '<')
      .to(L2('floor'), { yPercent: 132, duration: 1.2, ease: 'power2.inOut' }, '<')
      .to('.launch', { y: () => CH() * 1.32, duration: 1.2, ease: 'power2.inOut' }, '<')
      .to(L2('front'), { yPercent: 165, duration: 1.2, ease: 'power2.inOut' }, '<')
      .to('.child__in', { y: () => CH() * .8, opacity: 0, duration: .9, ease: 'power2.in' }, '<')
      .set('#childSky', { autoAlpha: 1 }, '<')
      .fromTo('#childSky', { yPercent: -18 }, { yPercent: 0, duration: 1.2, ease: 'power2.out' }, '<')
      .addLabel('night', '>-.35')
      .to('#rocket', { y: () => -CH() * 3.4, duration: .55, ease: 'power3.in' }, 'night')
      .to(smoke, { strokeDashoffset: 0, duration: .55, ease: 'power3.in' }, 'night')
      .to('.launch__smoke', { opacity: 0, duration: .35 }, 'night+=.3')
      .from('#childA > *', { y: 40, opacity: 0, stagger: .12, duration: .5, ease: 'power3.out' }, 'night+=.15')
      .to({}, { duration: .45 });
    const D = tl.duration(); tIgn = tl.labels.ign / D; tLift = tl.labels.lift / D; tNight = tl.labels.night / D;
  }

  // 3 · flat to folded — the sheet becomes a Supra
  {
    const steps = $$('#howSteps li');
    const setStep = n => { steps.forEach((s, i) => s.classList.toggle('on', i === n)); $('#howCount').textContent = '0' + (n + 1); };
    gsap.timeline({ scrollTrigger: { trigger: '.how__pin', start: 'top top', end: '+=' + Math.round(innerHeight * 2.6), pin: true, scrub: .8, onUpdate: s => setStep(Math.min(4, Math.floor(s.progress * 5))) } })
      .fromTo('#sheet', { rotateX: 55, rotateZ: -8, y: 60 }, { rotateX: 0, rotateZ: -2, y: 0, duration: 1 })
      .to('#scissors', { opacity: 1, duration: .1 })
      .to('#scissors', { keyframes: [{ left: '60%', top: '12%' }, { left: '70%', top: '50%' }, { left: '15%', top: '55%' }, { left: '55%', top: '85%' }], duration: 1.2, ease: 'none' })
      .fromTo('.sheet .cutlines polygon', { strokeDashoffset: 0 }, { strokeDashoffset: -120, stroke: '#ff641f', duration: 1.2, ease: 'none' }, '<')
      .to('.sheet .pc', { x: i => [-14, 14, -14, 14, 0][i], y: i => [-10, -10, 6, 6, 14][i], duration: .6 }, '-=.6')
      .to('#scissors', { opacity: 0, duration: .1 })
      .to('.sheet .pc', { rotateY: i => [55, -55, 40, -40, 0][i], rotateX: i => [0, 0, 20, 20, 60][i], transformPerspective: 400, duration: 1, stagger: .1 })
      .to('.sheet .glue circle', { opacity: 1, scale: 1.4, stagger: .12, duration: .3, ease: 'back.out(3)' })
      .to('.sheet .glue circle', { scale: 1, duration: .3 })
      .to('#sheet', { scale: .6, rotateZ: 8, opacity: 0, duration: .8 })
      .fromTo('#howFinal', { x: '-60%', opacity: 0, skewX: -12 }, { x: '0%', opacity: 1, skewX: 0, duration: 1, ease: 'expo.out' }, '<.2')
      .fromTo('#howSfx .sfx__m .c', { xPercent: -140, opacity: 0 }, { xPercent: 0, opacity: 1, stagger: .05, duration: .5 }, '-=.4')
      .fromTo('#howSfx .sfx__e .c', { xPercent: -220, opacity: 0 }, { xPercent: 0, opacity: 1, stagger: .03, duration: .5 }, '<.1');
  }

  // 4 · the garage carousel is driven by scroll. Each car holds the plinth for most of its stretch and the
  //     hand-over is quick (no empty stage between two cars); when you stop scrolling it settles on the nearest car
  const hold = v => { const i = Math.floor(v), t = v - i, e = t < .3 ? 0 : t > .7 ? 1 : (t - .3) / .4; return i + e * e * (3 - 2 * e); };
  cfST = ScrollTrigger.create({
    trigger: '.cf__pin', start: 'top top', end: () => '+=' + Math.round((cars.length - 1) * innerHeight * .34), pin: true, scrub: true, invalidateOnRefresh: true,
    onUpdate: s => { const raw = s.progress * (cars.length - 1); f = hold(raw); layout(f); setInfo(Math.round(f)); $('#cfBar').style.width = s.progress * 100 + '%'; gsap.set('#cfName', { xPercent: -50 - (f - Math.round(f)) * 18 }); },
    onRefresh: () => sizeItems()
  });
  {
    let snapT = 0;
    const settle = () => {
      if (!cfST.isActive) return;
      const n = cars.length - 1, i = Math.round(cfST.progress * n), y = cfST.start + (cfST.end - cfST.start) * i / n;
      if (Math.abs(scrollY - y) > 2) window.lenis ? lenis.scrollTo(y, { duration: .6 }) : window.scrollTo({ top: y, behavior: 'smooth' });
    };
    const idle = () => { clearTimeout(snapT); snapT = setTimeout(settle, 180); };
    window.lenis ? lenis.on('scroll', idle) : addEventListener('scroll', idle, { passive: true });
  }
  gsap.from('#cfRing', { y: 120, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.cf', start: 'top 70%' } });

  // 5 · manifesto words fill in
  {
    const el = $('#manifestoBig');
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
    gsap.to('#manifestoBig .w', { color: '#20211e', stagger: .1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
    gsap.from('.chaos-btn', { scale: 0, rotate: -90, duration: 1, ease: 'back.out(2)', scrollTrigger: { trigger: '.chaos-btn', start: 'top 90%' } });
  }

  // 6..8 · reveal the rest
  $$('.shead h2, .club h2, .faq__h').forEach(h => gsap.from(h, { y: 60, opacity: 0, rotate: 2, duration: 1, ease: 'power4.out', scrollTrigger: { trigger: h, start: 'top 88%' } }));
  gsap.from('.gp-banner', { y: 80, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.gp-banner', start: 'top 88%' } });
  gsap.from('.gcard', { y: 100, opacity: 0, rotate: i => (i % 2 ? 4 : -4), stagger: .08, duration: 1, ease: 'back.out(1.2)', scrollTrigger: { trigger: '#arcadeGrid', start: 'top 85%' } });
  gsap.from('.jar__glass', { y: 80, rotate: 10, opacity: 0, duration: 1.2, ease: 'elastic.out(1,.6)', scrollTrigger: { trigger: '.jar', start: 'top 85%' } });
  gsap.from('.quests li', { x: -30, opacity: 0, stagger: .03, duration: .5, scrollTrigger: { trigger: '#quests', start: 'top 85%' } });

  addEventListener('load', () => {
    ScrollTrigger.refresh();
    if (location.hash) { const t = $(location.hash); if (t) setTimeout(() => window.lenis ? lenis.scrollTo(t, { immediate: true }) : t.scrollIntoView(), 150); }
  });
})();
