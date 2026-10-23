/* Do It Yar — shared runtime: chrome, cart, wishlist, rewards, components, motion, easter eggs */
(function () {
  const ROOT = document.body.dataset.root || '';
  const PAGE = document.body.dataset.page || '';
  const DARK = document.body.dataset.theme === 'dark';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const url = p => ROOT + p;
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const byId = id => DIY.all.find(p => p.id === id);
  const imgOf = p => url(p.thumb);
  const priceOf = p => p.salePrice || p.price;
  const hrefOf = p => url(p.href);

  if (window.gsap) ['ScrollTrigger', 'Flip', 'MotionPathPlugin', 'Draggable', 'InertiaPlugin', 'SplitText'].forEach(n => window[n] && gsap.registerPlugin(window[n]));

  /* ---------- storage (never trusted to exist) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('diy.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('diy.' + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  const state = {
    cart: store.get('cart', []).filter(l => byId(l.id)),
    wish: store.get('wish', []).filter(byId),
    rewards: store.get('rewards', {})
  };
  const save = () => { store.set('cart', state.cart); store.set('wish', state.wish); store.set('rewards', state.rewards); };

  /* =========================================================
     COMPONENTS
     ========================================================= */
  const heartSvg = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 3.2 4.5 6.9 4.5c2.2 0 3.6 1.2 5.1 3 1.5-1.8 2.9-3 5.1-3 3.7 0 6 3.8 4.5 7.3C19.5 16.4 12 21 12 21z" fill="none" stroke-width="2"/></svg>';

  // a car standing on a floor; --ar is the trimmed image's aspect, so every car lands on the same line.
  // the cutouts carry their own studio floor shadow, so the drawn ellipse is opt-in now
  function stage(p, o = {}) {
    return `<div class="stg ${o.cls || ''}" style="--ar:${p.ar}">
      <div class="stg__fit">${o.shadow ? '<span class="stg__shadow"></span>' : ''}<img class="stg__img" src="${url(o.full ? p.cut : p.thumb)}" alt="${o.alt ?? p.name + ' papercraft model'}" ${o.eager ? '' : 'loading="lazy"'} width="800" height="${Math.round(800 / p.ar)}" draggable="false"></div>
    </div>`;
  }

  // product card: the whole card opens the kit; heart, bag and buy-now work right on the card
  const bagSvg = '<svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
  function card(p, o = {}) {
    const wished = state.wish.includes(p.id);
    return `
    <article class="kit ${o.dark ? 'kit--dark' : ''}" data-id="${p.id}" style="--face:${p.face === 'l' ? -1 : 1};--acc:${p.accent}">
      <a class="kit__link" href="${hrefOf(p)}" aria-label="${p.name} — view kit"></a>
      <div class="kit__media"><span class="kit__no">${p.bay} · ${p.scale}</span>${p.deal ? `<span class="kit__tag">−${p.deal}%</span>` : ''}${stage(p)}<span class="kit__shout" aria-hidden="true">${p.shout}</span></div>
      <button class="kit__heart" data-wish="${p.id}" aria-pressed="${wished}" aria-label="Save ${p.name} to your wishlist">${heartSvg}</button>
      <div class="kit__body">
        <span class="kit__make">${p.make} · ${p.tag}</span>
        <h3 class="kit__name">${p.model}${p.sub ? ' ' + p.sub : ''}</h3>
        <div class="kit__price"><b>${inr(priceOf(p))}</b>${p.deal ? `<s>${inr(p.price)}</s>` : ''}</div>
        <div class="kit__btns">
          <button class="kit__add" data-add="${p.id}" aria-label="Add ${p.name} to bag">${bagSvg}<span>Add to bag</span></button>
          <button class="kit__buy" data-buy="${p.id}" aria-label="Buy ${p.name} now">Buy now</button>
        </div>
      </div>
    </article>`;
  }

  // the catalogue as curated shelves: a numbered header, the set deal, then its cards with room to breathe
  function shelves(o = {}) {
    return DIY.collections.map(k => `
    <section class="shelf ${o.dark ? 'shelf--dark' : ''}" id="col-${k.id}" style="--c:${k.color}" aria-labelledby="colh-${k.id}">
      <header class="shelf__hd">
        <span class="shelf__no display" aria-hidden="true">${k.no}</span>
        <div class="shelf__txt"><span class="mono">Collection ${k.no} · ${k.list.length} kits</span><h3 class="display" id="colh-${k.id}">${k.name}</h3><p>${k.line}</p></div>
        <div class="shelf__deal"><span class="mono">The whole set · ${k.pct}% off</span><div><b>${inr(k.price)}</b><s>${inr(k.mrp)}</s></div><button class="btn btn--sm" data-set="${k.id}">Add all ${k.list.length} <span class="arr">→</span></button></div>
      </header>
      <div class="shelf__row" style="--n:${k.list.length}">${k.list.map(p => card(p, { dark: o.dark })).join('')}</div>
    </section>`).join('');
  }

  // kinetic sound word: echoes trail behind the car (opposite to the way it faces)
  const chars = t => [...t].map(ch => `<span class="c">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
  function sfx(text, o = {}) {
    const dir = o.face === 'r' ? -1 : 1;
    return `<span class="sfx ${o.dark ? 'sfx--dark' : ''} ${o.cls || ''}" style="--dir:${dir}${o.size ? ';font-size:' + o.size : ''}" aria-hidden="true">
      <span class="sfx__e e3">${chars(text)}</span><span class="sfx__e e2">${chars(text)}</span><span class="sfx__e e1">${chars(text)}</span><span class="sfx__m">${chars(text)}</span></span>`;
  }
  function playSfx(el, o = {}) {
    if (!el || !window.gsap || reduce) return;
    const dir = parseFloat(getComputedStyle(el).getPropertyValue('--dir')) || 1;
    const tl = gsap.timeline({ delay: o.delay || 0 });
    tl.fromTo(el.querySelectorAll('.sfx__m .c'), { xPercent: dir * 140, opacity: 0, skewX: dir * -25 }, { xPercent: 0, opacity: 1, skewX: 0, duration: .55, stagger: .035, ease: 'power3.out' })
      .fromTo(el.querySelectorAll('.sfx__e .c'), { xPercent: dir * 220, opacity: 0 }, { xPercent: 0, opacity: 1, duration: .7, stagger: .02, ease: 'power3.out' }, .08);
    return tl;
  }
  function hideSfx(el) { if (el && window.gsap) gsap.to(el.querySelectorAll('.c'), { opacity: 0, duration: .2 }); }

  // a sound word that pops where you clicked, then floats away
  function pop(text, x, y, o = {}) {
    if (!window.gsap) return;
    const b = document.createElement('div');
    b.className = 'pop';
    b.style.left = x + 'px'; b.style.top = y + 'px';
    b.innerHTML = sfx(text, { face: o.face, size: o.size });
    document.body.append(b);
    const m = b.querySelectorAll('.sfx__m .c'), e = b.querySelectorAll('.sfx__e .c');
    gsap.timeline({ onComplete: () => b.remove() })
      .from(m, { y: 40, rotation: () => gsap.utils.random(-18, 18), opacity: 0, duration: .45, stagger: .03, ease: 'back.out(3)' })
      .from(e, { opacity: 0, x: (o.face === 'r' ? -30 : 30), duration: .4, stagger: .015 }, .1)
      .to(b, { y: -50, opacity: 0, duration: .6, ease: 'power2.in' }, '+=.55');
  }

  /* ---------- chrome ---------- */
  function chrome() {
    const tick = '<span>LESS SCROLLING. MORE MAKING. <b>✳</b> THE PAPER GARAGE IS OPEN — 15 MACHINES <b>✳</b> RACE YOUR FRIENDS IN THE PAPER GRAND PRIX <b>✳</b> FREE SHIPPING OVER ₹1,499 <b>✳</b> PSST… THIS SITE HAS SECRETS <b>✳</b></span>';
    const top = document.createElement('div');
    top.innerHTML = `
      <a class="skip" href="#main">Skip to content</a>
      <div class="topbar" role="note"><div class="topbar__track">${tick}${tick}</div></div>
      <header class="hdr ${DARK ? 'hdr--dark' : ''}" id="hdr">
        <div class="wrap hdr__in">
          <a class="hdr__logo" id="logo" href="${url('')}index.html" aria-label="Do It Yar home"><img src="${url('assets/img/logo.webp')}" alt="Do It Yar" width="64" height="64"></a>
          <nav class="hdr__nav" aria-label="Primary">
            <a href="${url('store/')}index.html" ${PAGE === 'store' ? 'aria-current="page"' : ''}><span>Shop<sup>${DIY.all.length}</sup></span></a>
            <a class="live" href="${url('cars/automobiles/')}index.html" ${PAGE === 'cars' ? 'aria-current="page"' : ''}><span>Paper garage</span></a>
            <a href="${url('race/')}index.html" ${PAGE === 'race' ? 'aria-current="page"' : ''}><span>Grand Prix</span></a>
            <a href="${url('')}index.html#arcade"><span>Our chaos</span></a>
          </nav>
          <div class="hdr__act">
            <button class="hdr__snd" data-sound aria-pressed="true" aria-label="Sound is on: tap to mute"><i></i><i></i><i></i><i></i></button>
            <button class="hdr__spark" data-confetti aria-label="Make a little chaos"><span>✳</span></button>
            <button data-open="wish"><span class="lbl">Wishlist</span><span class="sr">Wishlist</span><span class="count" id="wishCount">0</span></button>
            <button data-open="bag"><span class="lbl">Bag</span><span class="sr">Bag</span><span class="count" id="bagCount">0</span></button>
            <button class="burger" aria-label="Menu" aria-expanded="false" id="burger"><i></i></button>
          </div>
        </div>
      </header>
      <nav class="mnav" id="mnav" aria-label="Mobile">
        <div>
          <a class="big" href="${url('cars/automobiles/')}index.html">Paper garage</a>
          <a class="big" href="${url('store/')}index.html">Shop all 15</a>
          <a class="big" href="${url('race/')}index.html">Grand Prix</a>
          <a class="big" href="${url('')}index.html#arcade">Our chaos</a>
        </div>
        <p class="mono">Do It Yar / paper with main character energy</p>
      </nav>`;
    document.body.prepend(...top.children);

    const rest = document.createElement('div');
    rest.innerHTML = `
      <div class="scrim" id="scrim"></div>
      <aside class="drawer" id="drawer" aria-label="Bag and wishlist" aria-hidden="true">
        <div class="drawer__hd"><h3 id="drawerTitle">Your bag</h3><button class="x" data-close aria-label="Close">✕</button></div>
        <div class="drawer__tabs" role="tablist">
          <button role="tab" data-tab="bag" aria-selected="true">Bag</button>
          <button role="tab" data-tab="wish" aria-selected="false">Wishlist</button>
        </div>
        <div class="drawer__list" id="drawerList"></div>
        <div class="drawer__ft" id="drawerFt"></div>
      </aside>
      <div class="toasts" id="toasts" aria-live="polite"></div>
      <div class="cursor" id="cursor"><span></span></div>
      <div class="tx" id="tx" aria-hidden="true"></div>
      <div class="lead" id="lead" role="dialog" aria-modal="true" aria-labelledby="leadTitle" aria-hidden="true">
        <div class="lead__card">
          <button class="x lead__x" data-lead-close aria-label="Close">✕</button>
          <div class="lead__cars" id="leadCars" aria-hidden="true"></div>
          <div class="lead__body" id="leadBody">
            <span class="mono">Pre-launch · the garage opens soon</span>
            <h3 class="display" id="leadTitle">Thank you for wanting these!</h3>
            <p class="lead__lead">Sales aren’t live yet. Leave your details and we’ll message you the second they are, with your picks saved.</p>
            <form class="lead__form" id="leadForm" novalidate>
              <label><span>Your name</span><input name="name" autocomplete="name" maxlength="60" required></label>
              <label><span>Phone (WhatsApp is perfect)</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" required></label>
              <label><span>Email</span><input name="email" type="email" autocomplete="email" maxlength="80" required></label>
              <input class="lead__hp" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true">
              <p class="lead__err" id="leadErr" role="alert"></p>
              <button class="btn btn--orange" type="submit" id="leadGo">Notify me when it’s live <span class="arr">→</span></button>
              <p class="lead__fine mono">Only used to tell you about the launch. No spam, pinky promise.</p>
            </form>
          </div>
          <div class="lead__done" id="leadDone" hidden>
            <b class="display">You’re on the list.</b>
            <p>We’ll ping you the moment the sale goes live. Your picks are saved in your bag till then.</p>
            <button class="btn btn--ghost" data-lead-close>Keep exploring</button>
          </div>
        </div>
      </div>`;
    document.body.append(...rest.children);
    $('#drawer').inert = true; $('#lead').inert = true; // closed panels can't hold focus

    const ftr = $('#footer');
    if (ftr) ftr.outerHTML = `
      <footer class="ftr">
        <div class="wrap">
          <div class="ftr__grid">
            <div>
              <img src="${url('assets/img/logo.webp')}" alt="" width="84" height="84" style="width:84px">
              <p style="max-width:40ch;margin-top:16px">Flat paper. Your hands. The dream car you drew in the back of your notebook — now you can actually build it.</p>
              <form class="ftr__news" id="newsForm">
                <label class="sr" for="news">Email</label>
                <input id="news" name="email" type="email" autocomplete="email" maxlength="80" required placeholder="you@curious.com" aria-describedby="newsStatus">
                <input class="lead__hp" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true">
                <button class="btn btn--orange" type="submit">Join the club</button>
              </form>
              <p class="ftr__news-status" id="newsStatus" role="status" aria-live="polite"></p>
            </div>
            <div><h4>THE GARAGE</h4><ul>
              <li><a href="${url('cars/automobiles/')}index.html">Paper garage</a></li>
              <li><a href="${url('store/')}index.html">All 15 kits</a></li>
              <li><a href="${url("store/")}index.html#col-jdm">JDM legends</a></li>
              <li><a href="${url("store/")}index.html#col-flex">Hypercars</a></li></ul></div>
            <div><h4>PLAY</h4><ul>
              <li><a href="${url('race/')}index.html">Paper Grand Prix</a></li>
              <li><a href="${url('race/')}index.html?mode=online">Race a friend online</a></li>
              <li><a href="${url('')}index.html#arcade">Procrastination station</a></li>
              <li><a href="${url('cars/automobiles/')}index.html#quiz">Which car are you?</a></li></ul></div>
            <div><h4>HELP</h4><ul>
              <li><a href="${url('')}index.html#faq">FAQs</a></li>
              <li><a href="${url('')}index.html#how">How it works</a></li>
              <li><a href="mailto:hello@doityar.in">hello@doityar.in</a></li></ul></div>
          </div>
          <div class="ftr__legal"><span>© ${new Date().getFullYear()} Do It Yar. Perfectly imperfect.</span><span>Physical DIY kits designed and printed by Do It Yar.</span></div>
          <details class="credits"><summary class="mono">Sound credits: the real engines behind the noise</summary>
            <ul>${DIY.cars.map(c => c.snd ? `<li><b>${c.name}</b>: <a href="${c.snd.url}" target="_blank" rel="noopener">${c.snd.rec}</a> by ${c.snd.by}, ${c.snd.lic}${c.snd.exact ? ' (this exact car)' : ` <i>(stand-in: ${c.snd.why})</i>`}. Trimmed and levelled.</li>` : '').join('')}
            ${DIY.fxCredits.map(x => `<li><a href="${x.url}" target="_blank" rel="noopener">${x.rec}</a> by ${x.by}, ${x.lic}</li>`).join('')}</ul></details>
        </div>
        <div class="tz" id="tz" aria-label="Easter egg: keep scrolling at the very bottom to tear the word">
          <div class="tz__hint"><span class="mono" id="tzHint">You reached the end. Or did you? Keep scrolling ↓</span></div>
          <div class="tz__word" id="tzWord" aria-hidden="true"><span class="tz__half" id="tzTop">DIYMAXXXXXING</span><span class="tz__half" id="tzBot">DIYMAXXXXXING</span></div>
          <div class="tz__prize"><b>You tore it.<br>10% off is yours.</b><span class="mono">Auto-applied in your bag · or use code</span><code>DIYMAXXXXXING10</code><button class="btn btn--ghost btn--sm" id="tzAgain">Tear it again (for fun)</button></div>
        </div>
      </footer>`;
  }

  /* ---------- pricing ---------- */
  function totals() {
    const lines = state.cart.map(l => ({ ...l, p: byId(l.id) })).filter(l => l.p);
    const mrp = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
    const sub = lines.reduce((s, l) => s + priceOf(l.p) * l.qty, 0);
    const carCount = lines.reduce((s, l) => s + l.qty, 0);
    const bundlePct = carCount >= 3 ? 12 : carCount === 2 ? 5 : 0;
    const bundle = sub * bundlePct / 100;
    const rewardPct = rewardTotal();
    const reward = (sub - bundle) * rewardPct / 100;
    const after = sub - bundle - reward;
    const ship = after === 0 || after >= 1499 ? 0 : 99;
    return { lines, mrp, sub, carCount, bundlePct, bundle, rewardPct, reward, ship, total: after + ship, count: carCount };
  }
  function rewardTotal() { return Math.min(10, Object.values(state.rewards).reduce((s, v) => s + v, 0)); }

  /* ---------- cart / wish ---------- */
  function add(id, qty = 1, el, quiet) {
    const p = byId(id); if (!p) return;
    const line = state.cart.find(l => l.id === id);
    line ? line.qty += qty : state.cart.push({ id, qty });
    save(); sync(); bump('#bagCount');
    if (el) flyTo(el, '#bagCount', url(p.thumb));
    if (!quiet) toast(`${p.name} is parked in your bag.`, '🏁', 'View bag', () => open('bag'));
  }
  function setQty(id, qty) {
    const line = state.cart.find(l => l.id === id); if (!line) return;
    line.qty = qty; if (qty <= 0) state.cart = state.cart.filter(l => l.id !== id);
    save(); sync(); renderDrawer();
  }
  function wish(id) {
    const on = !state.wish.includes(id);
    state.wish = on ? [...state.wish, id] : state.wish.filter(x => x !== id);
    save(); sync(); bump('#wishCount');
    $$(`[data-wish="${id}"]`).forEach(b => { b.setAttribute('aria-pressed', on); if (on && window.gsap) gsap.fromTo(b, { scale: .6, rotate: -30 }, { scale: 1, rotate: 0, ease: 'elastic.out(1,.4)', duration: .8 }); });
    if (on) toast('Saved to your dream garage.', '♥');
    if ($('#drawer').classList.contains('on')) renderDrawer();
  }
  function reward(game, pct, label) {
    const before = rewardTotal();
    state.rewards[game] = Math.max(state.rewards[game] || 0, pct);
    save(); sync();
    const after = rewardTotal();
    if (after > before) toast(`+${after - before}% unlocked: ${label}. ${after}% off is waiting in your bag.`, '🏆');
    else if (before >= 10) toast(`${label}! Your reward jar is already full: 10% off.`, '🏆');
    document.dispatchEvent(new CustomEvent('diy:rewards'));
  }
  function sync() {
    const t = totals();
    $('#bagCount').textContent = t.count;
    $('#wishCount').textContent = state.wish.length;
    document.dispatchEvent(new CustomEvent('diy:cart', { detail: t }));
  }
  function bump(sel) { const el = $(sel); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  function flyTo(fromEl, toSel, src) {
    if (reduce || !window.gsap) return;
    const a = fromEl.getBoundingClientRect(), b = $(toSel).getBoundingClientRect();
    const img = document.createElement('img');
    img.src = src;
    Object.assign(img.style, { position: 'fixed', left: a.left + a.width / 2 - 60 + 'px', top: a.top + a.height / 2 - 30 + 'px', width: '120px', height: '60px', objectFit: 'contain', zIndex: 260, pointerEvents: 'none', filter: 'drop-shadow(0 8px 8px rgba(0,0,0,.35))' });
    document.body.append(img);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    gsap.timeline({ onComplete: () => img.remove() })
      .to(img, { x: dx, duration: .85, ease: 'power2.inOut' }, 0)
      .to(img, { y: dy, duration: .85, ease: 'back.in(1.4)' }, 0)
      .to(img, { scale: .15, duration: .85, ease: 'power1.in' }, 0);
  }

  /* ---------- drawer ---------- */
  let tab = 'bag', drawerReturn = null;
  function restoreFocus(el) {
    const target = el && el.isConnected && el.matches('a[href],button,input,select,textarea,[tabindex]') && !el.closest('[inert], [hidden]') ? el : $('[data-open="bag"]');
    if (target) target.focus({ preventScroll: true });
  }
  function open(which) {
    if (!$('#drawer').classList.contains('on')) drawerReturn = document.activeElement;
    tab = which; renderDrawer();
    $('#drawer').classList.add('on'); $('#drawer').setAttribute('aria-hidden', 'false'); $('#drawer').inert = false; $('#scrim').classList.add('on');
    lockScroll(true);
    setTimeout(() => { if ($('#drawer').classList.contains('on')) $('#drawer .x').focus(); }, 50);
  }
  function closeAll() {
    const drawer = $('#drawer');
    if (drawer.contains(document.activeElement)) restoreFocus(drawerReturn);
    drawer.classList.remove('on'); drawer.inert = true; drawer.setAttribute('aria-hidden', 'true');
    $('#scrim').classList.remove('on');
    document.documentElement.classList.remove('menu-open'); $('#burger').setAttribute('aria-expanded', 'false');
    document.dispatchEvent(new CustomEvent('diy:close'));
    lockScroll(false);
  }
  function lockScroll(on) { if (window.lenis) on ? lenis.stop() : lenis.start(); document.body.style.overflow = on ? 'hidden' : ''; }

  function renderDrawer() {
    $('#drawerTitle').textContent = tab === 'bag' ? 'Your bag' : 'Dream garage';
    $$('#drawer [data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === tab));
    const list = $('#drawerList'), ft = $('#drawerFt');
    if (tab === 'wish') {
      const items = state.wish.map(byId).filter(Boolean);
      list.innerHTML = items.length ? items.map(p => `
        <div class="line"><a href="${hrefOf(p)}"><img src="${url(p.thumb)}" alt=""></a><div><h4>${p.name}</h4><small>${inr(priceOf(p))} · ${p.level}</small><br><button class="rm" data-wish="${p.id}">Remove</button></div>
        <button class="pcard__add" data-add="${p.id}">Add</button></div>`).join('')
        : `<div class="empty"><div class="big">Your dream<br>garage is<br>empty.</div><p>Tap the heart on any car that makes you go “hmm, maybe”.</p></div>`;
      ft.innerHTML = `<a class="btn" href="${url('cars/automobiles/')}index.html">Walk the garage <span class="arr">→</span></a>`;
      return;
    }
    const t = totals();
    list.innerHTML = t.lines.length ? t.lines.map(l => `
      <div class="line"><a href="${hrefOf(l.p)}"><img src="${url(l.p.thumb)}" alt=""></a>
        <div><h4>${l.p.name}</h4><small>${inr(priceOf(l.p))}${l.p.deal ? ` <s>${inr(l.p.price)}</s>` : ''}</small>
          <div class="qty"><button data-qty="${l.id}" data-d="-1" aria-label="Decrease">−</button><span>${l.qty}</span><button data-qty="${l.id}" data-d="1" aria-label="Increase">+</button></div></div>
        <button class="rm" data-qty="${l.id}" data-d="-999">Remove</button></div>`).join('')
      : `<div class="empty"><div class="big">Your garage<br>is suspiciously<br>empty.</div><p>Fifteen machines are idling. So is your weekend.</p></div>`;
    const toFree = Math.max(0, 1499 - (t.sub - t.bundle - t.reward));
    const nextBundle = t.carCount === 1 ? 'Add 1 more car for an extra 5% garage bundle.' : t.carCount === 2 ? 'Add 1 more car to jump to 12% off.' : 'Garage bundle maxed: 12% off. Absolute legend.';
    ft.innerHTML = t.lines.length ? `
      <div class="hint">${toFree > 0 ? `You’re <b>${inr(toFree)}</b> away from free shipping.` : '<b>Free shipping unlocked.</b> Nice.'}</div>
      <div class="progress"><i style="width:${Math.min(100, (1 - toFree / 1499) * 100)}%"></i></div>
      <div class="hint">🏎 ${nextBundle}</div>
      <div class="row"><span>Subtotal</span><span>${t.mrp > t.sub ? `<s style="color:#8a8a83">${inr(t.mrp)}</s> ` : ''}${inr(t.sub)}</span></div>
      ${t.bundle ? `<div class="row"><span>Garage bundle (${t.bundlePct}%)</span><span class="save">−${inr(t.bundle)}</span></div>` : ''}
      ${t.reward ? `<div class="row"><span>Chaos Club rewards (${t.rewardPct}%)</span><span class="save">−${inr(t.reward)}</span></div>` : `<div class="hint">🎮 Play the games and find the secrets: up to 10% off.</div>`}
      <div class="row"><span>Shipping</span><span>${t.ship ? inr(t.ship) : 'Free'}</span></div>
      <div class="row total"><span>Total</span><span>${inr(t.total)}</span></div>
      <button class="btn" data-checkout>Checkout <span class="arr">→</span></button>`
      : `<a class="btn" href="${url('cars/automobiles/')}index.html">Walk the paper garage <span class="arr">→</span></a>`;
  }

  /* ---------- toast ---------- */
  function toast(msg, icon = '✳', action, fn) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<i>${icon}</i><span style="flex:1">${msg}</span>${action ? `<button class="chip">${action}</button>` : ''}`;
    if (action) $('button', t).onclick = () => { fn(); t.remove(); };
    $('#toasts').append(t);
    if (window.gsap) gsap.from(t, { y: 30, opacity: 0, duration: .5, ease: 'back.out(2)' });
    setTimeout(() => window.gsap ? gsap.to(t, { y: 20, opacity: 0, duration: .4, onComplete: () => t.remove() }) : t.remove(), 3400);
  }

  /* ---------- confetti + party poppers ---------- */
  const COLORS = ['#ff641f', '#c5ef41', '#b9ecd7', '#c6c3ff', '#f7f5ef', '#f6c3d4', '#20211e'];
  function confetti(x = innerWidth / 2, y = innerHeight / 2, n = 36, o = {}) {
    if (!o.quiet) snd.fx('squeak', { vol: .7, rate: .9 + Math.random() * .4 }); // every little burst of confetti squeaks
    if (reduce || !window.gsap) return;
    const ang = o.angle ?? null, spread = o.spread ?? 360, power = o.power ?? 1;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i');
      s.className = 'shard' + (i % 3 === 0 ? ' strip' : '');
      s.style.background = COLORS[i % COLORS.length];
      document.body.append(s);
      const a = (ang === null ? Math.random() * 360 : ang + (Math.random() - .5) * spread) * Math.PI / 180;
      const v = (140 + Math.random() * 320) * power;
      gsap.set(s, { x, y });
      gsap.timeline({ onComplete: () => s.remove() })
        .to(s, { x: x + Math.cos(a) * v, y: y + Math.sin(a) * v, rotation: gsap.utils.random(-540, 540), rotationX: gsap.utils.random(0, 360), duration: .9, ease: 'power3.out' })
        .to(s, { y: '+=' + (innerHeight * gsap.utils.random(.5, .9)), x: '+=' + gsap.utils.random(-80, 80), rotation: '+=' + gsap.utils.random(-360, 360), opacity: 0, duration: gsap.utils.random(1.4, 2.4), ease: 'power1.in' }, '-=.25');
    }
  }
  function poppers() {
    const h = innerHeight, w = innerWidth;
    // Synthesized pops and fizz only: these volleys cannot include recorded vocals.
    [0, 350, 700].forEach((d, k) => setTimeout(() => {
      snd.party(k);
      confetti(0, h, 70, { angle: -58, spread: 34, power: 2.3, quiet: 1 });
      confetti(w, h, 70, { angle: -122, spread: 34, power: 2.3, quiet: 1 });
      if (k === 1) confetti(w / 2, h * .55, 90, { quiet: 1 });
    }, d));
  }

  /* =========================================================
     SOUND — real engine recordings, one car at a time, plus paper and garage effects.
     Browsers only allow audio after the visitor has clicked, tapped or typed on the site,
     so anything that wants to play before that waits for the first gesture (or is dropped).
     ========================================================= */
  const snd = (() => {
    let ac = null, master, carBus, fxBus, live = null, token = 0, queued = null;
    let on = store.get('sound', true);
    const bufs = {}, wait = {};
    let dec = null; // decoding never needs permission, so clips can load before the first click
    const decoder = () => dec || (dec = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 1, 44100));
    function ctx() {
      if (ac || !window.AudioContext && !window.webkitAudioContext) return ac;
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        const lim = ac.createDynamicsCompressor(); lim.threshold.value = -8; lim.ratio.value = 6; lim.attack.value = .003; lim.release.value = .2; lim.connect(ac.destination);
        master = ac.createGain(); master.gain.value = on ? 1 : 0; master.connect(lim);
        carBus = ac.createGain(); carBus.gain.value = .85; carBus.connect(master);
        fxBus = ac.createGain(); fxBus.gain.value = .5; fxBus.connect(master);
      } catch (e) { ac = null; }
      return ac;
    }
    // may we make noise right now? (running, or inside a click/tap/keypress that can start it)
    function allowed() {
      const c = ctx(); if (!c || !on) return false;
      if (c.state === 'running') return true;
      const ua = navigator.userActivation;
      if (!ua || ua.isActive) { c.resume().catch(() => {}); return true; }
      return false;
    }
    function load(name) {
      if (bufs[name]) return Promise.resolve(bufs[name]);
      if (!wait[name]) wait[name] = fetch(url('assets/sound/' + name + '.mp3?v=7')).then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status))
        .then(b => new Promise((res, rej) => decoder().decodeAudioData(b, res, rej))).then(b => (bufs[name] = b)).catch(() => { wait[name] = null; return null; });
      return wait[name];
    }
    function play(name, o = {}) {
      const c = ctx(); if (!c) return;
      const my = o.car ? ++token : 0;
      const start = buf => {
        if (!buf) { o.fallback && o.fallback(); return; }
        if ((o.car && my !== token) || !on) return;
        const t = c.currentTime + .01, g = c.createGain(), src = c.createBufferSource();
        const vol = o.vol ?? 1, off = Math.min(o.at || 0, buf.duration - .1), dur = Math.min(o.dur || buf.duration, buf.duration - off);
        src.buffer = buf; src.playbackRate.value = o.rate || 1;
        if (o.loop) { src.loop = true; src.loopStart = .35; src.loopEnd = buf.duration - .8; }
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + (o.fin ?? .03));
        if (!o.loop) { g.gain.setValueAtTime(vol, t + Math.max(.05, dur - (o.fout ?? .35))); g.gain.linearRampToValueAtTime(0, t + dur); }
        src.connect(g); g.connect(o.bus || fxBus);
        o.loop ? src.start(t, off) : src.start(t, off, dur + .05);
        const h = {
          src, g,
          stop(f = .25) { try { const n = c.currentTime; g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(g.gain.value, n); g.gain.linearRampToValueAtTime(0, n + f); src.stop(n + f + .03); } catch (e) {} },
          rate(r, s = .08) { try { src.playbackRate.setTargetAtTime(r, c.currentTime, s); } catch (e) {} },
          vol(v, s = .05) { try { g.gain.setTargetAtTime(v, c.currentTime, s); } catch (e) {} }
        };
        if (o.car) { if (live) live.stop(.25); live = h; document.body.classList.add('snd-live'); src.onended = () => { if (live === h) { live = null; document.body.classList.remove('snd-live'); } }; }
        o.onstart && o.onstart(h);
      };
      bufs[name] ? start(bufs[name]) : load(name).then(start);
    }
    function flush() { const q = queued; queued = null; if (q && performance.now() - q.t < q.win) q.fn(); }
    // a car speaks: crossfades out whatever car was talking, so two engines never pile up
    function car(p, o = {}) {
      p = typeof p === 'string' ? byId(p) : p; if (!p || !on) return;
      const go = () => play('car-' + p.id, { car: 1, bus: carBus, vol: (p.vol || 1) * (o.vol ?? 1), dur: o.dur, fout: o.fout ?? .6, fallback: o.synth === false ? null : () => rev(p, true) });
      if (allowed()) { queued = null; go(); return true; }
      if (o.wait) { queued = { fn: go, t: performance.now(), win: o.wait }; ac && ac.resume().then(flush, () => {}); }
      return false;
    }
    function fx(name, o = {}) { if (!allowed()) return; play('ui-' + name, { bus: fxBus, ...o }); }
    function party(volley = 0) {
      if (!allowed()) return;
      const t = ac.currentTime + .01;
      // Short, filtered noise bursts with a sharp attack, followed by falling confetti fizz.
      const burst = (at, len, vol, freq) => {
        const b = ac.createBuffer(1, Math.ceil(ac.sampleRate * len), ac.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ac.createBufferSource(), filter = ac.createBiquadFilter(), gain = ac.createGain();
        src.buffer = b; filter.type = 'bandpass'; filter.frequency.value = freq; filter.Q.value = .65;
        gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(vol, at + .002); gain.gain.exponentialRampToValueAtTime(.001, at + len);
        src.connect(filter); filter.connect(gain); gain.connect(fxBus);
        src.start(at); src.stop(at + len);
        src.onended = () => { src.disconnect(); filter.disconnect(); gain.disconnect(); };
      };
      burst(t, .14, .8, 1500 + volley * 250);
      burst(t + .075, .09, .45, 2400);
      burst(t + .03, .65, .15, 5500);
    }
    // a paper swish, synthesised (cheap, and it plays on the click that starts a transition)
    // the chaos button: a different silly horn every press
    function horn() { const [n, v] = [['horn-toodoo', .45], ['horn-honky', 2.2], ['horn-triple', .85]][Math.random() * 3 | 0]; fx(n, { vol: v, rate: .92 + Math.random() * .2 }); }
    function swish(len = .4, vol = .5, f0 = 500, f1 = 3200) {
      if (!allowed()) return;
      const t = ac.currentTime + .01, n = Math.round(ac.sampleRate * len), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const s = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = b; bp.type = 'bandpass'; bp.Q.value = 1.1; bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + len);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + len * .55); g.gain.exponentialRampToValueAtTime(.001, t + len);
      s.connect(bp); bp.connect(g); g.connect(fxBus); s.start(t); s.stop(t + len + .02);
    }
    function engine(p, o = {}) { // for the race: loops the car's clip and lets the caller bend its pitch
      p = typeof p === 'string' ? byId(p) : p; if (!p || !allowed()) return;
      play('car-' + p.id, { bus: carBus, loop: true, fin: .15, vol: (p.vol || 1) * (o.vol ?? 1), rate: o.rate || 1, onstart: o.onstart });
    }
    function beep(f = 880, len = .15, vol = .35) { // start lights
      if (!allowed()) return;
      const t = ac.currentTime + .005, o = ac.createOscillator(), g = ac.createGain();
      o.type = 'square'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.setValueAtTime(vol, t + len * .7); g.gain.exponentialRampToValueAtTime(.001, t + len);
      o.connect(g); g.connect(fxBus); o.start(t); o.stop(t + len + .02);
    }
    function stopCar(f = .3) { queued = null; token++; if (live) live.stop(f); }
    function set(v) {
      on = v; store.set('sound', v);
      if (ac) master.gain.setTargetAtTime(v ? 1 : 0, ac.currentTime, .05);
      if (!v) stopCar(.15);
      $$('[data-sound]').forEach(b => { b.setAttribute('aria-pressed', v); b.setAttribute('aria-label', v ? 'Sound is on: tap to mute' : 'Sound is off: tap to unmute'); });
      document.body.classList.toggle('snd-off', !v);
    }
    ['pointerdown', 'keydown', 'touchend'].forEach(ev => addEventListener(ev, () => { const c = ctx(); if (c && on && c.state !== 'running') c.resume().then(flush, () => {}); else if (queued) flush(); }, { capture: true, passive: true }));
    return { car, fx, party, horn, swish, beep, engine, load, stopCar, set, allowed, ctx, get on() { return on; }, get bus() { return carBus; } };
  })();

  /* ---------- engine synth: only a fallback now, for a clip that cannot load ---------- */
  function noise(at, len, vol, freq = 800, swell = false) {
    const actx = snd.ctx(), n = actx.sampleRate * len, buf = actx.createBuffer(1, n, actx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = actx.createBufferSource(); src.buffer = buf;
    const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = .8;
    const g = actx.createGain();
    g.gain.setValueAtTime(swell ? 0 : vol, at);
    if (swell) g.gain.linearRampToValueAtTime(vol, at + len * .5);
    g.gain.exponentialRampToValueAtTime(.001, at + len);
    src.connect(bp); bp.connect(g); g.connect(snd.bus); src.start(at); src.stop(at + len + .02);
  }
  function rev(id, synthOnly) {
    const p = typeof id === 'string' ? byId(id) : id;
    if (!synthOnly && p && snd.car(p)) return;
    const r = (p && p.rev) || { base: 80, peak: 300, dur: 1.3, pops: 2 };
    if (!snd.allowed()) return;
    const actx = snd.ctx();
    const t = actx.currentTime + .02, d = r.dur;
    const out = actx.createGain(); out.gain.value = r.quiet ? .04 : .16; out.connect(snd.bus);
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 5;
    lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(r.quiet ? 700 : 2600, t + d * .45); lp.frequency.linearRampToValueAtTime(450, t + d);
    lp.connect(out);
    const env = actx.createGain(); env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(.8, t + .08); env.gain.setValueAtTime(.8, t + d * .72); env.gain.exponentialRampToValueAtTime(.001, t + d);
    env.connect(lp);
    [['sawtooth', 1], ['sawtooth', 1.012], ['square', .5]].forEach(([type, m]) => {
      const o = actx.createOscillator(); o.type = type;
      o.frequency.setValueAtTime(r.base * m, t);
      o.frequency.exponentialRampToValueAtTime(r.peak * m, t + d * .45);
      if (r.shift) { o.frequency.setValueAtTime(r.peak * m * .7, t + d * .47); o.frequency.exponentialRampToValueAtTime(r.peak * m * .95, t + d * .62); }
      o.frequency.exponentialRampToValueAtTime(r.base * m * 1.1, t + d);
      o.connect(env); o.start(t); o.stop(t + d + .05);
    });
    const lfo = actx.createOscillator(), lg = actx.createGain();
    lfo.frequency.setValueAtTime(r.brap ? 12 : 26, t); lfo.frequency.linearRampToValueAtTime(r.brap ? 30 : 80, t + d * .45);
    lg.gain.value = r.brap ? .55 : .3; lfo.connect(lg); lg.connect(env.gain); lfo.start(t); lfo.stop(t + d);
    for (let i = 0; i < (r.pops || 0); i++) noise(t + d * .76 + i * .085, .05, .45, 700);
    if (r.flutter) for (let i = 0; i < 6; i++) noise(t + d * .78 + i * .04, .028, .22, 2600);
    if (r.whoosh || r.quiet) noise(t, d, r.quiet ? .08 : .3, r.quiet ? 1400 : 900, true);
  }
  // rev + its sound word at a point
  function honk(p, x, y) { rev(p); pop(p.shout, x, y, { face: p.face }); }

  /* =========================================================
     PAGE TRANSITIONS — every page is a sheet of paper.
     Leaving: the sheet lands over the page. Arriving: it gets cut by scissors, torn in two,
     or unzipped; the garage gets its roller door. The cover is hidden with visibility (never a
     parked transform), the head script lifts it after 5 s no matter what, and bfcache resets it.
     ========================================================= */
  const TXK = 'diy.tx', TYPES = ['cut', 'tear', 'zip'];
  const isGarage = path => /\/cars\/automobiles\//.test(path);
  const scissorsSvg = `<svg class="tx__scissors" viewBox="0 0 120 100" aria-hidden="true">
    <g class="blade blade--b"><path d="M30 64 L46 50" stroke="#20211e" stroke-width="7" stroke-linecap="round"/><circle cx="21" cy="73" r="13" fill="none" stroke="#c5ef41" stroke-width="7"/><circle cx="21" cy="73" r="13" fill="none" stroke="#20211e" stroke-width="1.6"/><path d="M42 45 L117 51 L44 56 Z" fill="#dcdad2" stroke="#20211e" stroke-width="2.2" stroke-linejoin="round"/></g>
    <g class="blade blade--a"><path d="M30 36 L46 50" stroke="#20211e" stroke-width="7" stroke-linecap="round"/><circle cx="21" cy="27" r="13" fill="none" stroke="#20211e" stroke-width="7"/><path d="M42 55 L117 49 L44 44 Z" fill="#f2f0ea" stroke="#20211e" stroke-width="2.2" stroke-linejoin="round"/></g>
    <circle cx="46" cy="50" r="3.6" fill="#20211e"/></svg>`;
  const zipSvg = `<svg class="tx__zip" viewBox="0 0 40 92" aria-hidden="true"><path d="M3 2 H37 L33 30 Q20 38 7 30 Z" fill="#dcdad2" stroke="#20211e" stroke-width="2.4" stroke-linejoin="round"/><rect x="13" y="26" width="14" height="62" rx="7" fill="#20211e"/><rect x="17" y="66" width="6" height="14" rx="3" fill="#ff641f"/></svg>`;
  let txTl = null, txSafe = 0, arrived = null, leaving = false, revealDone;
  // pages wait on this before their own intro (a loader, a door), so two transitions never play on top of each other
  const revealed = new Promise(r => { revealDone = r; });
  const tx = () => $('#tx');
  function seed() { return 1 + (Math.random() * 1e6 | 0); }
  // the line the sheet comes apart along: straight (cut), ragged (tear) or interlocking teeth (zip)
  function seam(type, W, H, s) {
    const R = () => (s = s * 16807 % 2147483647) / 2147483647, pts = [];
    if (type === 'cut') for (let i = 0; i <= 48; i++) pts.push([i / 48 * W, H / 2]);
    else if (type === 'tear') { const n = Math.max(24, Math.round(H / 20)); for (let i = 0; i <= n; i++) pts.push([W / 2 + (R() - .5) * 30 + Math.sin(i * .8) * 7, i / n * H]); }
    else { const t = Math.max(9, Math.min(15, W / 80)), d = t * .48; for (let y = -t, k = 0; y < H + t; y += t, k++) { const x = W / 2 + (k % 2 ? d : -d); pts.push([x, y], [x, y + t]); } }
    return pts;
  }
  // clip both halves; open(pos) says how far apart they are at that point along the seam
  function clip(pts, axis, W, H, open, fibre = 0) {
    const a = [], b = [], f = v => v.toFixed(1) + 'px';
    for (const [x, y] of pts) {
      let g = open ? open(axis === 'y' ? y : x) : 0;
      if (fibre && g > .5) g -= fibre; // torn paper shows a white fibrous lip just past the coloured edge
      if (axis === 'y') { a.push(f(x - g) + ' ' + f(y)); b.push(f(x + g) + ' ' + f(y)); }
      else { a.push(f(x) + ' ' + f(y - g)); b.push(f(x) + ' ' + f(y + g)); }
    }
    return axis === 'y'
      ? [`polygon(0 -40px, ${a.join(',')}, 0 ${H + 40}px)`, `polygon(${W}px -40px, ${b.join(',')}, ${W}px ${H + 40}px)`]
      : [`polygon(-40px 0, ${W + 40}px 0, ${a.reverse().join(',')})`, `polygon(-40px ${H}px, ${W + 40}px ${H}px, ${b.reverse().join(',')})`];
  }
  function txBuild(type, s) {
    const el = tx(), W = innerWidth, H = innerHeight, logo = `<img src="${url('assets/img/logo.webp')}" alt="">`;
    const note = { cut: '✂ — cut along the dotted line — ✂', tear: 'tear here ↓', zip: '' }[type] || '';
    el.dataset.type = type;
    const lip = type === 'tear' ? '<div class="tx__w"></div>' : '';
    el.innerHTML = type === 'shutter'
      ? `<div class="tx__h tx__h--a"><div class="tx__p">${logo}</div></div>`
      : `<div class="tx__h tx__h--a">${lip}<div class="tx__p">${logo}</div></div><div class="tx__h tx__h--b">${lip}<div class="tx__p">${logo}</div></div>
         ${type === 'cut' ? '<i class="tx__dash"></i>' : ''}${note ? `<span class="tx__note">${note}</span>` : ''}
         ${type === 'cut' ? `<div class="tx__tool">${scissorsSvg}</div>` : type === 'zip' ? `<div class="tx__tool">${zipSvg}</div>` : ''}`;
    const st = { type, W, H, axis: type === 'cut' ? 'x' : 'y', pts: type === 'shutter' ? null : seam(type, W, H, s) };
    if (st.pts) { const [ca, cb] = clip(st.pts, st.axis, W, H); $$('.tx__h--a .tx__p, .tx__h--a .tx__w', el).forEach(x => x.style.clipPath = ca); $$('.tx__h--b .tx__p, .tx__h--b .tx__w', el).forEach(x => x.style.clipPath = cb); }
    const tool = $('.tx__tool', el);
    if (tool && type === 'cut') gsap.set(tool, { x: -tool.offsetWidth * 1.2, y: H / 2 - tool.offsetHeight / 2 });
    if (tool && type === 'zip') gsap.set(tool, { x: W / 2 - tool.offsetWidth / 2, y: -tool.offsetHeight });
    el.classList.add('on');
    return st;
  }
  function txOff() {
    clearTimeout(txSafe); leaving = false; revealDone();
    if (txTl) { txTl.kill(); txTl = null; }
    const el = tx(); if (!el) return;
    el.classList.remove('on'); el.innerHTML = ''; el.removeAttribute('data-type');
    document.documentElement.removeAttribute('data-tx');
  }
  // the sheet lands over the page, then we go
  function leave(href) {
    if (reduce || !window.gsap) { location.href = href; return; }
    if (leaving) return; leaving = true; // a double click never stacks two sheets
    const type = isGarage(new URL(href, location.href).pathname) || PAGE === 'cars' ? 'shutter' : (() => {
      let n = 0; try { n = +sessionStorage.getItem('diy.txn') || 0; sessionStorage.setItem('diy.txn', n + 1); } catch (e) {}
      return TYPES[n % TYPES.length];
    })();
    const s = seed();
    try { sessionStorage.setItem(TXK, JSON.stringify({ type, s, t: Date.now() })); } catch (e) {}
    if (txTl) txTl.kill();
    const st = txBuild(type, s), el = tx(), halves = $$('.tx__h', el), tool = $('.tx__tool', el);
    snd.stopCar(.35);
    let gone = false;
    const go = () => { if (gone) return; gone = true; location.href = href; clearTimeout(txSafe); txSafe = setTimeout(txOff, 4000); }; // if the browser stays (download, cancel), uncover
    txSafe = setTimeout(go, 1100); // a throttled or busy tab never holds the click hostage
    if (type === 'shutter') {
      snd.fx('shutter-shut', { vol: .9 });
      txTl = gsap.timeline({ onComplete: go })
        .fromTo(halves, { yPercent: -100 }, { yPercent: 0, duration: .4, ease: 'power2.in' })
        .to(halves, { yPercent: -1.6, duration: .06, ease: 'power1.out' }).to(halves, { yPercent: 0, duration: .1, ease: 'bounce.out' });
      return;
    }
    snd.swish(.42, .55);
    txTl = gsap.timeline({ onComplete: go })
      .fromTo(halves, { yPercent: type === 'tear' ? 100 : -100, rotation: type === 'tear' ? 2 : -2 }, { yPercent: 0, rotation: 0, duration: .46, ease: 'power3.in' });
    if (type === 'cut') txTl.to(tool, { x: -tool.offsetWidth * .35, duration: .22, ease: 'back.out(2)' }).add(() => snd.fx('snip', { vol: .8, dur: .45 }), '<');
    if (type === 'zip') txTl.to(tool, { y: 4, duration: .22, ease: 'back.out(2.4)' });
  }
  // arriving: if the last page left under a sheet, the head script already put it up; take it apart
  function arrive() {
    let rec = null; try { rec = JSON.parse(sessionStorage.getItem(TXK) || 'null'); sessionStorage.removeItem(TXK); } catch (e) {}
    const html = document.documentElement;
    if (!rec || Date.now() - rec.t > 15000 || reduce || !window.gsap || !TYPES.concat('shutter').includes(rec.type)) { html.removeAttribute('data-tx'); revealDone(); return; }
    arrived = rec.type;
    // the garage has its own roller door in the hero, it takes over from here
    if (rec.type === 'shutter' && PAGE === 'cars') { html.removeAttribute('data-tx'); revealDone(); return; }
    const st = txBuild(rec.type, rec.s); html.removeAttribute('data-tx');
    txSafe = setTimeout(txOff, 4000); // hard cap: the cover never outstays its welcome, even in a throttled tab
    const run = () => requestAnimationFrame(() => requestAnimationFrame(() => reveal(st)));
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', run, { once: true }) : run();
  }
  function reveal(st) {
    const el = tx(), A = $('.tx__h--a', el), B = $('.tx__h--b', el), pa = $('.tx__h--a .tx__p', el), pb = B && $('.tx__h--b .tx__p', el), tool = $('.tx__tool', el), { W, H, type } = st;
    txTl = gsap.timeline({ delay: .08, onComplete: txOff });
    if (type === 'shutter') {
      snd.fx('shutter', { vol: .85, dur: 1.5, fout: .5 });
      txTl.to(A, { y: -5, duration: .05, repeat: 1, yoyo: true, ease: 'none' })
        .to(A, { yPercent: -100, duration: .6, ease: 'power3.inOut' });
      return;
    }
    const len = st.axis === 'y' ? H : W, pr = { p: 0 };
    const wa = $('.tx__h--a .tx__w', el), wb = B && $('.tx__h--b .tx__w', el);
    const paint = (lead, slope, cap) => {
      const L = pr.p * (len + lead), open = pos => pos < L ? Math.min(cap, (L - pos) * slope) : 0;
      const [ca, cb] = clip(st.pts, st.axis, W, H, open); pa.style.clipPath = ca; pb.style.clipPath = cb;
      if (wa) { const [fa, fb] = clip(st.pts, st.axis, W, H, open, 3.5); wa.style.clipPath = fa; wb.style.clipPath = fb; }
    };
    $('.tx__note', el) && txTl.to($('.tx__note', el), { opacity: 0, duration: .2 }, 0);
    if (type === 'cut') {
      const tw = tool.offsetWidth, a = $('.blade--a', tool), b = $('.blade--b', tool);
      snd.fx('scissors', { vol: .9, dur: .95, fout: .25 });
      txTl.to(pr, { p: 1, duration: .7, ease: 'power1.inOut', onUpdate: () => { paint(tw * .4, .03, 8); gsap.set(tool, { x: pr.p * (W + tw * .4) - tw * .35 }); gsap.set($('.tx__dash', el), { scaleX: 1 - pr.p }); } }, 0)
        .fromTo(a, { rotation: 0 }, { rotation: -15, svgOrigin: '46 50', duration: .085, repeat: 7, yoyo: true, ease: 'sine.inOut' }, 0)
        .fromTo(b, { rotation: 0 }, { rotation: 15, svgOrigin: '46 50', duration: .085, repeat: 7, yoyo: true, ease: 'sine.inOut' }, 0)
        .to(tool, { x: W + tw, duration: .2, ease: 'power2.in' })
        .to(A, { yPercent: -62, rotation: -3, duration: .7, ease: 'power3.inOut' }, '-=.15')
        .to(B, { yPercent: 62, rotation: 2.4, duration: .7, ease: 'power3.inOut' }, '<');
    } else if (type === 'tear') {
      snd.fx('tear', { vol: 1, dur: 1.1, fout: .3 });
      txTl.to(pr, { p: 1, duration: .38, ease: 'power2.in', onUpdate: () => paint(H * .1, .06, 12) }, 0)
        .to(A, { xPercent: -64, yPercent: 5, rotation: -9, duration: .75, ease: 'power2.in' }, .3)
        .to(B, { xPercent: 64, yPercent: 7, rotation: 8, duration: .75, ease: 'power2.in' }, .3);
    } else {
      const th = tool.offsetHeight;
      snd.fx('zip-b', { vol: 1, fout: .2 });
      txTl.to(pr, { p: 1, duration: .62, ease: 'power1.in', onUpdate: () => { paint(th, .32, W * .7); gsap.set(tool, { y: pr.p * (H + th) - th * .2 }); } }, 0)
        .to(A, { xPercent: -70, rotation: -5, duration: .5, ease: 'power2.in' }, .48)
        .to(B, { xPercent: 70, rotation: 5, duration: .5, ease: 'power2.in' }, .48);
    }
  }
  function go(href) { leave(href); }
  const txDebug = { build: txBuild, reveal: st => (reveal(st), txTl), off: txOff }; // for testing the sheets frame by frame

  /* ---------- motion: smooth scroll, header, cursor, magnetic, page transitions ---------- */
  function motion() {
    if (!reduce && window.Lenis) {
      window.lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      if (window.gsap) { lenis.on('scroll', () => window.ScrollTrigger && ScrollTrigger.update()); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
      else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
    }
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download')) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin) return;
      if (u.pathname === location.pathname && u.hash) {
        const t = document.querySelector(u.hash); if (!t) return;
        e.preventDefault(); closeAll();
        window.lenis ? lenis.scrollTo(t, { offset: -($('#hdr').offsetHeight + 24) }) : t.scrollIntoView({ behavior: 'smooth' }); // land below the fixed header
        return;
      }
      if (u.pathname === location.pathname && u.search === location.search) return;
      if (reduce || !window.gsap) return;
      e.preventDefault();
      leave(u.href);
    });
    arrive();
    // back/forward cache: never come back to a page that is still covered
    addEventListener('pageshow', e => { if (e.persisted) txOff(); });

    let last = 0;
    addEventListener('scroll', () => {
      const y = scrollY, h = $('#hdr');
      if (!document.documentElement.classList.contains('menu-open')) { const hide = y > last && y > 300; h.classList.toggle('is-hidden', hide); document.body.classList.toggle('hdr-hidden', hide); }
      last = y;
    }, { passive: true });

    const c = $('#cursor');
    if (matchMedia('(hover: hover) and (pointer: fine)').matches && window.gsap) {
      const xTo = gsap.quickTo(c, 'x', { duration: .25, ease: 'power3' }), yTo = gsap.quickTo(c, 'y', { duration: .25, ease: 'power3' });
      addEventListener('pointermove', e => { xTo(e.clientX); yTo(e.clientY); });
      document.addEventListener('pointerover', e => {
        const t = e.target.closest('[data-cursor]'); const label = t && t.dataset.cursor;
        c.classList.toggle('big', !!label); $('span', c).textContent = label || '';
      });
    } else c.remove();

    if (!reduce && window.gsap && matchMedia('(hover: hover)').matches) {
      $$('[data-magnetic]').forEach(el => {
        el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .25, duration: .4, ease: 'power3' }); });
        el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: .8, ease: 'elastic.out(1,.35)' }));
      });
    }
  }

  /* =========================================================
     EASTER EGGS (global)
     ========================================================= */
  function eggs() {
    /* 1 — the footer stretch-and-tear */
    const tz = $('#tz');
    if (tz) {
      const word = $('#tzWord'), top = $('#tzTop'), bot = $('#tzBot');
      const n = 26, pts = [];
      for (let i = 0; i <= n; i++) pts.push([i / n * 100, 50 + (i % 2 ? 9 : -9) + (Math.random() * 6 - 3)]);
      const edge = pts.slice().reverse().map(([x, y]) => `${x.toFixed(1)}% ${y.toFixed(1)}%`).join(',');
      top.style.clipPath = `polygon(0 -40%, 100% -40%, ${edge})`;
      bot.style.clipPath = `polygon(0 140%, 100% 140%, ${edge})`;
      let pull = 0, lastIn = 0, torn = false, ty = 0, holdIv;
      const atBottom = () => innerHeight + scrollY >= document.documentElement.scrollHeight - 8;
      const hints = ['You reached the end. Or did you? Keep scrolling ↓', 'Hmm. It’s stretching…', 'It’s getting thin. Keep going!', 'Almost torn. Don’t you dare stop!'];
      const paint = () => {
        if (window.gsap) {
          gsap.set(word, { scaleY: 1 + pull * 1.9, scaleX: 1 - pull * .06, x: pull > .7 ? gsap.utils.random(-3, 3) : 0 });
          gsap.set(top, { y: -pull * 4 }); gsap.set(bot, { y: pull * 4 });
        } else word.style.transform = `scaleY(${1 + pull * 1.9})`;
        $('#tzHint').textContent = hints[Math.min(3, Math.floor(pull * 4))];
      };
      const feed = v => { if (torn) return; pull = Math.min(1, pull + v); lastIn = performance.now(); paint(); if (pull >= 1) tear(); };
      const decay = () => { if (!torn && pull > 0 && performance.now() - lastIn > 260) { pull = Math.max(0, pull - .025); paint(); } requestAnimationFrame(decay); };
      requestAnimationFrame(decay);
      addEventListener('wheel', e => { if (e.deltaY > 0 && atBottom()) feed(Math.min(e.deltaY, 120) * .0012); }, { passive: true });
      addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, { passive: true });
      addEventListener('touchmove', e => { const y = e.touches[0].clientY, dy = ty - y; ty = y; if (dy > 0 && atBottom()) feed(dy * .0045); }, { passive: true });
      addEventListener('keydown', e => { if (['ArrowDown', 'PageDown', 'End', ' '].includes(e.key) && atBottom() && !(e.target.closest && e.target.closest('input,textarea,select,button'))) feed(.09); });
      word.style.pointerEvents = 'auto';
      word.addEventListener('pointerdown', () => { holdIv = setInterval(() => feed(.03), 40); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => word.addEventListener(ev, () => clearInterval(holdIv)));
      function tear() {
        torn = true; clearInterval(holdIv);
        snd.swish(.22, .35, 2200, 650); // a paper rip without a voice recording
        tz.classList.add('torn');
        const H = tz.offsetHeight;
        if (window.gsap) {
          gsap.timeline()
            .to(word, { scaleY: 1, scaleX: 1, x: 0, duration: .25, ease: 'power4.out' })
            .to(top, { y: -H * .62, x: -40, rotate: -6, duration: 1.2, ease: 'power3.out' }, '<.05')
            .to(bot, { y: H * .5, x: 60, rotate: 9, opacity: .25, duration: 1.2, ease: 'power3.in' }, '<')
            .from('.tz__prize > *', { y: 40, opacity: 0, stagger: .08, duration: .7, ease: 'back.out(2)' }, '<.2');
        }
        poppers();
        reward('tear', 10, 'You tore DIYMAXXXXXING');
      }
      $('#tzAgain').addEventListener('click', () => {
        tz.classList.remove('torn'); torn = false; pull = 0; paint();
        if (window.gsap) gsap.to([top, bot], { x: 0, y: 0, rotate: 0, opacity: 1, duration: .8, ease: 'elastic.out(1,.5)' });
      });
    }

    /* 2 — type "vroom" anywhere: a car drives across your screen, nose first */
    let typed = '';
    addEventListener('keydown', e => {
      if (e.isComposing || typeof e.key !== 'string' || e.target.closest && e.target.closest('input,textarea,select,[contenteditable="true"]')) return;
      typed = (typed + (e.key.length === 1 ? e.key.toLowerCase() : '')).slice(-12);
      if (typed.endsWith('vroom')) { typed = ''; driveBy(); }
      if (typed.endsWith('yaar')) { typed = ''; pop('DO IT, YAAR!', innerWidth / 2, innerHeight / 2); confetti(innerWidth / 2, innerHeight / 2, 50); }
    });
    function driveBy() {
      const p = DIY.cars[Math.random() * DIY.cars.length | 0];
      const im = document.createElement('img');
      im.src = url(p.thumb); im.alt = '';
      Object.assign(im.style, { position: 'fixed', bottom: '3vh', left: 0, width: 'min(40vw, 520px)', zIndex: 265, pointerEvents: 'none', filter: 'drop-shadow(0 20px 14px rgba(0,0,0,.4))' });
      document.body.append(im);
      rev(p);
      if (window.gsap) {
        const goesLeft = p.face === 'l';
        gsap.fromTo(im, { x: goesLeft ? '110vw' : '-60vw', skewX: goesLeft ? 8 : -8 }, { x: goesLeft ? '-60vw' : '110vw', skewX: goesLeft ? 14 : -14, duration: 1.8, ease: 'power2.in', onComplete: () => im.remove() });
        setTimeout(() => pop(p.shout, innerWidth * .5, innerHeight * .6, { face: p.face }), 500);
      } else im.remove();
      reward('vroom', 1, 'You typed VROOM');
    }

    /* 3 — click the logo 5 times fast (a single click still goes home after a beat) */
    let clicks = 0, ct;
    $('#logo').addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const href = e.currentTarget.href;
      clicks++; clearTimeout(ct);
      ct = setTimeout(() => { if (clicks && clicks < 5) go(href); clicks = 0; }, 380);
      if (clicks === 5) {
        clicks = 0; clearTimeout(ct);
        if (window.gsap) gsap.fromTo('#logo', { rotate: 0 }, { rotate: 720, duration: 1.2, ease: 'power4.out' });
        for (let i = 0; i < 6; i++) setTimeout(() => confetti(Math.random() * innerWidth, -20, 30, { angle: 90, spread: 60, power: .6 }), i * 120);
        pop('PAPER RAIN!', innerWidth / 2, innerHeight * .4);
        reward('logo', 1, 'Logo spinner');
      }
    });

    /* 4 — the Konami code */
    const code = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
    let ki = 0;
    addEventListener('keydown', e => {
      if (e.isComposing || typeof e.key !== 'string' || e.target.closest && e.target.closest('input,textarea,select,[contenteditable="true"]')) return;
      const k = e.key.toLowerCase(); // browser autofill and IMEs can fire key-less events
      ki = k === code[ki] ? ki + 1 : (k === code[0] ? 1 : 0);
      if (ki === code.length) { ki = 0; poppers(); pop('CHEAT CODE!', innerWidth / 2, innerHeight / 2); reward('konami', 2, 'Secret code'); }
    });

    /* 5 — leave the tab */
    const title = document.title;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) document.title = 'come back, the glue is drying 🥺';
      else { document.title = 'you’re back ✳ ' + title; setTimeout(() => document.title = title, 2200); }
    });

    /* 6 — a note for the curious ones who open devtools */
    try { console.log('%cDO IT YAR%c\nYou opened devtools. Respect.\nType “vroom” on any page. Try the Konami code. And never stop scrolling at the bottom.', 'font:900 32px Arial Black;color:#ff641f', 'font:14px monospace;color:#888'); } catch (e) {}
  }

  /* Both forms use the inbox's existing Web3Forms public form key.
     This is a browser-safe form identifier, not an email account credential. */
  const LEADS_TO = 'chat.priyanshuag@gmail.com';
  const LEADS_KEY = '79149bda-c2e2-41d5-a1fc-996e8922dfb1';
  let leadFlush = null;
  const savedLeads = store.get('leadq', []);
  const pendingLeads = Array.isArray(savedLeads) ? savedLeads : [];
  async function sendLead(body) {
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const r = await fetch('https://api.web3forms.com/submit', {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(Object.entries(body).filter(([k]) => k[0] !== '_')), access_key: LEADS_KEY, subject: body._subject, from_name: 'Do It Yar website', botcheck: false })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !(j.success === true || j.success === 'true')) throw new Error(r.status === 429 ? 'Too many requests. Please try again in a few minutes.' : 'We couldn’t send your details. Please try again or email us directly.');
      return true;
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('Sending timed out. Please check your connection and try again.');
      throw e;
    } finally { clearTimeout(timeout); }
  }
  function flushLeads() {
    if (leadFlush) return leadFlush;
    leadFlush = (async () => {
      while (pendingLeads.length) {
        await sendLead(pendingLeads[0]);
        pendingLeads.shift(); store.set('leadq', pendingLeads);
      }
      return true;
    })().finally(() => { leadFlush = null; });
    return leadFlush;
  }
  function queueLead(body) {
    // Repeated clicks after a failed attempt retry the same submission.
    const same = pendingLeads.find(p => p.email === body.email && p.phone === body.phone && p._subject === body._subject);
    if (!same) pendingLeads.push({ ...body, 'submission id': crypto.randomUUID(), 'submitted at': new Date().toISOString() });
    store.set('leadq', pendingLeads);
    return flushLeads();
  }
  function deliveryError(el, error) {
    el.textContent = error && error.message && error.name !== 'TypeError' ? error.message + ' ' : 'We couldn’t send your details. Check your connection and try again. ';
    const a = document.createElement('a'); a.href = 'mailto:' + LEADS_TO; a.textContent = 'Email us directly'; el.append(a);
  }
  addEventListener('online', () => flushLeads().catch(() => {}));
  let leadCtx = {}, leadReturn = null;
  function lead(o = {}) {
    leadReturn = $('#drawer').classList.contains('on') ? drawerReturn : document.activeElement;
    leadCtx = o; // where the wish came from (which button, which car) travels with the lead
    closeAll();
    const t = totals(), picks = t.lines.length ? t.lines : state.wish.map(id => ({ p: byId(id), qty: 1 })).filter(l => l.p);
    $('#leadCars').innerHTML = picks.slice(0, 3).map(l => `<i>${stage(l.p, { alt: '' })}</i>`).join('');
    $('#leadTitle').textContent = picks.length === 1 ? `The ${picks[0].p.model} is almost yours.` : picks.length ? `${picks.reduce((s, l) => s + l.qty, 0)} machines. Excellent taste.` : 'Thank you for wanting these!';
    $('#leadBody').hidden = false; $('#leadDone').hidden = true; $('#leadErr').textContent = '';
    const el = $('#lead'); el.classList.add('on'); el.setAttribute('aria-hidden', 'false'); el.inert = false; lockScroll(true);
    if (window.gsap && !reduce) {
      gsap.fromTo('.lead__card', { y: 40, scale: .94, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: .55, ease: 'back.out(1.6)' });
      gsap.from('#leadCars i', { x: 90, opacity: 0, stagger: .08, duration: .8, ease: 'expo.out', delay: .1 });
    }
    snd.swish(.3, .4, 700, 3200);
    setTimeout(() => { if (el.classList.contains('on')) $('#leadForm [name="name"]').focus(); }, 150);
  }
  function leadClose() { const el = $('#lead'); if (!el.classList.contains('on')) return; if (el.contains(document.activeElement)) restoreFocus(leadReturn); el.classList.remove('on'); el.inert = true; el.setAttribute('aria-hidden', 'true'); lockScroll(false); }
  function leadForm() {
    const f = $('#leadForm'), err = $('#leadErr'), go = $('#leadGo'), label = go.firstChild.textContent;
    f.addEventListener('submit', async e => {
      e.preventDefault();
      if (go.disabled) return;
      const v = Object.fromEntries(new FormData(f));
      const name = (v.name || '').trim(), phone = (v.phone || '').replace(/[^\d+]/g, ''), email = (v.email || '').trim();
      const bad = name.length < 2 ? ['name', 'Tell us your name, so we know who to cheer for.']
        : !/^\+?\d{10,13}$/.test(phone) ? ['phone', 'That phone number looks short: 10 digits, or with +91.']
        : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? ['email', 'That email doesn’t look quite right.'] : null;
      if (bad) { err.textContent = bad[1]; f.elements[bad[0]].focus(); return; }
      if (v._honey) return; // only a bot fills the invisible field
      err.textContent = ''; go.disabled = true; go.firstChild.textContent = 'Sending… ';
      // everything about the wish is read from the bag and wishlist: the visitor only types name, phone and email.
      // one row per car keeps the inbox easy to tally (which kits are most wanted)
      const t = totals(), wl = state.wish.map(byId).filter(Boolean), trig = leadCtx.car && byId(leadCtx.car);
      const shelfOf = p => (DIY.collections.find(k => k.id !== 'first' && k.cars.includes(p.id)) || {}).name || '';
      const body = { name, phone, email };
      t.lines.forEach((l, i) => { body[`car ${i + 1}`] = `${l.p.name} × ${l.qty}  (${inr(priceOf(l.p) * l.qty)} · ${shelfOf(l.p)} · ${l.p.sku})`; });
      Object.assign(body, {
        'kits in bag': t.lines.length ? `${t.count} kit${t.count > 1 ? 's' : ''}: ${t.lines.map(l => l.p.model).join(', ')}` : 'none',
        'bag total': t.lines.length ? `${inr(t.total)} (bundle −${t.bundlePct}%, rewards −${t.rewardPct}%)` : '—',
        'wishlist': wl.length ? wl.map(p => p.name).join(', ') : 'none',
        'clicked': leadCtx.via ? `${leadCtx.via}${trig ? ': ' + trig.name : ''}` : 'Checkout',
        'page': location.pathname,
        _subject: `New lead: ${name} · ${t.lines.length ? t.lines.map(l => l.p.model).join(', ') : wl.length ? 'wishlist ' + wl.map(p => p.model).join(', ') : 'just curious'}`,
        _template: 'table', _captcha: 'false'
      });
      try { await queueLead(body); }
      catch (error) { deliveryError(err, error); return; }
      finally { go.disabled = false; go.firstChild.textContent = label; }
      store.set('lead', 1); f.reset();
      if ($('#leadBody').contains(document.activeElement)) $('#lead .lead__x').focus();
      $('#leadBody').hidden = true; $('#leadDone').hidden = false;
      if ($('#lead').classList.contains('on')) $('#leadDone button').focus();
      const r = $('.lead__card').getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + 80, 60);
      if (window.gsap && !reduce) gsap.from('#leadDone > *', { y: 24, opacity: 0, stagger: .08, duration: .5, ease: 'back.out(2)' });
    });
    $$('[data-lead-close]').forEach(b => b.addEventListener('click', leadClose));
    $('#lead').addEventListener('click', e => { if (e.target.id === 'lead') leadClose(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') leadClose(); });
  }

  // a card's button says thanks, and its car does a happy little hop
  function added(btn) {
    const kit = btn.closest('.kit');
    if (btn.classList.contains('kit__add')) { btn.classList.add('is-done'); clearTimeout(btn._t); btn._t = setTimeout(() => btn.classList.remove('is-done'), 1500); }
    if (kit && window.gsap && !reduce) gsap.fromTo($('.stg__img', kit), { y: 0 }, { keyframes: [{ y: -16, rotation: kit.style.getPropertyValue('--face') === '1' ? -2 : 2, duration: .14, ease: 'power2.out' }, { y: 0, rotation: 0, duration: .5, ease: 'bounce.out' }] });
    snd.swish(.14, .3, 1400, 5000);
  }

  /* ---------- events ---------- */
  function events() {
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-add],[data-buy],[data-set],[data-wish],[data-open],[data-close],[data-tab],[data-qty],[data-checkout],[data-confetti],[data-rev],[data-sound],#burger,#scrim');
      if (!t) return;
      if (t.dataset.add) { e.preventDefault(); add(t.dataset.add, 1, t); if ($('#drawer').classList.contains('on')) renderDrawer(); added(t); }
      else if (t.dataset.buy) { e.preventDefault(); add(t.dataset.buy, 1, t, true); added(t); setTimeout(() => lead({ via: 'Buy now', car: t.dataset.buy }), 450); }
      else if (t.dataset.set) {
        e.preventDefault(); const k = DIY.collections.find(x => x.id === t.dataset.set); if (!k) return;
        k.list.forEach((p, i) => add(p.id, 1, i ? null : t, true));
        toast(`Parked ${k.list.map(p => p.model).join(', ')}. ${k.pct}% set bundle applied.`, '🏁', 'View bag', () => open('bag'));
        const r = t.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top, 30);
      }
      else if (t.dataset.wish) { e.preventDefault(); wish(t.dataset.wish); }
      else if (t.dataset.rev) { e.preventDefault(); const r = t.getBoundingClientRect(); honk(byId(t.dataset.rev), r.left + r.width / 2, r.top - 30); }
      else if (t.hasAttribute('data-sound')) { snd.set(!snd.on); if (snd.on) snd.swish(.22, .35, 900, 4000); toast(snd.on ? 'Sound on. Every car has its real voice now.' : 'Muted. The cars will sulk quietly.', snd.on ? '🔊' : '🔇'); }
      else if (t.dataset.open) open(t.dataset.open);
      else if (t.dataset.tab) { tab = t.dataset.tab; renderDrawer(); }
      else if (t.dataset.qty) { const l = state.cart.find(x => x.id === t.dataset.qty); setQty(t.dataset.qty, (l ? l.qty : 0) + +t.dataset.d); }
      else if (t.hasAttribute('data-checkout')) lead({ via: 'Checkout' });
      else if (t.hasAttribute('data-confetti')) { snd.horn(); confetti(e.clientX, e.clientY, 36, { quiet: 1 }); }
      else if (t.id === 'burger') { const on = document.documentElement.classList.toggle('menu-open'); t.setAttribute('aria-expanded', on); lockScroll(on); }
      else if (t.hasAttribute('data-close') || t.id === 'scrim') closeAll();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
    $$('#mnav a').forEach(a => a.addEventListener('click', () => closeAll()));
    const nf = $('#newsForm');
    if (nf) nf.addEventListener('submit', async e => {
      e.preventDefault();
      const button = $('button', nf), status = $('#newsStatus'), email = $('#news').value.trim();
      if (button.disabled || $('[name="_honey"]', nf).value || !nf.reportValidity()) return;
      button.disabled = true; status.textContent = 'Sending…';
      try {
        await queueLead({ email, 'request': 'Chaos Club launch updates', 'page': location.pathname, _subject: 'New Chaos Club signup: ' + email });
        status.textContent = 'You’re on the list. We’ll email you when the garage opens.'; nf.reset();
      } catch (error) { deliveryError(status, error); }
      finally { button.disabled = false; }
    });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const panel = $('#lead.on') || $('#drawer.on'); if (!panel) return;
      const focusable = $$('a[href],button,input,select,textarea,[tabindex="0"]', panel).filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length && !el.closest('[hidden], [inert]'));
      const first = focusable[0], last = focusable[focusable.length - 1]; if (!first) return;
      if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    });
  }

  chrome();
  events();
  leadForm();
  sync();
  snd.set(snd.on);
  motion();
  eggs();

  window.DIYcore = { ROOT, url, inr, card, shelves, stage, sfx, playSfx, hideSfx, pop, burst: pop, honk, add, wish, reward, rewardTotal, toast, confetti, poppers, rev, snd, go, lead, arrived, revealed, _tx: txDebug, open, closeAll, lockScroll, totals, state, store, byId, imgOf, priceOf, hrefOf, reduce, $, $$ };
})();
