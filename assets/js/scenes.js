/* Do It Yar — paper diorama scenes, drawn in code (low-poly, brand colours, folded-paper shading).
   Each scene is a stack of SVG layers sized to the screen's exact proportions, so nothing stretches. */
(function () {
  const H = 900;
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const P = pts => pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const poly = (pts, fill, extra = '') => `<polygon points="${P(pts)}" fill="${fill}" ${extra}/>`;
  const drop = (pts, a = .14, dx = 5, dy = 7) => poly(pts.map(([x, y]) => [x + dx, y + dy]), `rgba(0,0,0,${a})`);
  const ngon = (cx, cy, r, n = 8, rot = Math.PI / 8) => Array.from({ length: n }, (_, k) => [cx + r * Math.cos(rot + k * 2 * Math.PI / n), cy + r * Math.sin(rot + k * 2 * Math.PI / n)]);
  const star4 = (cx, cy, r, fill, o = 1) => poly([[cx, cy - r], [cx + r * .28, cy - r * .28], [cx + r, cy], [cx + r * .28, cy + r * .28], [cx, cy + r], [cx - r * .28, cy + r * .28], [cx - r, cy], [cx - r * .28, cy - r * .28]], fill, `opacity="${o}"`);

  // folded-paper mountain: a lit face and a shaded face
  function peak(x, w, py, light, dark, cap) {
    const px = x + w * .5;
    let s = drop([[x, H], [px, py], [x + w, H]], .1);
    s += poly([[x, H], [px, py], [px, H]], light) + poly([[px, py], [x + w, H], [px, H]], dark);
    if (cap) s += poly([[px - w * .09, py + w * .14], [px, py], [px + w * .07, py + w * .12], [px, py + w * .08]], cap);
    return s;
  }
  function cloud(x, y, sc) {
    const parts = [[-88, 12, 58], [-30, -22, 76], [38, -4, 64], [96, 16, 46]];
    let s = `<g transform="translate(${x.toFixed(0)},${y.toFixed(0)}) scale(${sc.toFixed(2)})">`;
    parts.forEach(([cx, cy, r]) => { s += poly(ngon(cx, cy + 9, r), 'rgba(0,0,0,.06)'); });
    parts.forEach(([cx, cy, r]) => { const g = ngon(cx, cy, r); s += poly(g, '#fffdf8') + poly([g[0], g[1], g[2], g[3], [cx, cy]], '#efe9dd'); });
    return s + '</g>';
  }
  function house(x, gy, sc, rnd) {
    const w = 64 * sc, h = 54 * sc, d = 22 * sc, roof = 40 * sc;
    const roofs = [['#ff7d3f', '#e2581c'], ['#c6c3ff', '#a8a2f2'], ['#f6c3d4', '#e3a2b8']][Math.floor(rnd() * 3)];
    let s = drop([[x, gy], [x + w + d, gy], [x + w + d, gy - h], [x, gy - h]], .12);
    s += poly([[x + w, gy], [x + w + d, gy - 8 * sc], [x + w + d, gy - h - 8 * sc], [x + w, gy - h]], '#e7dbc6');
    s += poly([[x, gy], [x + w, gy], [x + w, gy - h], [x, gy - h]], '#fbf5e8');
    s += poly([[x - 6 * sc, gy - h], [x + w / 2, gy - h - roof], [x + w / 2, gy - h]], roofs[0]) + poly([[x + w / 2, gy - h - roof], [x + w + 6 * sc, gy - h], [x + w / 2, gy - h]], roofs[1]);
    s += poly([[x + w + 6 * sc, gy - h], [x + w / 2, gy - h - roof], [x + w / 2 + d, gy - h - roof - 8 * sc], [x + w + d + 4 * sc, gy - h - 8 * sc]], roofs[1], 'opacity=".85"');
    s += `<rect x="${(x + w * .38).toFixed(1)}" y="${(gy - h * .48).toFixed(1)}" width="${(w * .24).toFixed(1)}" height="${(h * .48).toFixed(1)}" fill="#20211e"/>`;
    s += `<rect x="${(x + w * .1).toFixed(1)}" y="${(gy - h * .78).toFixed(1)}" width="${(w * .18).toFixed(1)}" height="${(w * .18).toFixed(1)}" fill="#c5ef41"/>`;
    return s;
  }
  function tree(x, gy, sc) {
    const r = 26 * sc;
    let s = `<rect x="${(x - 3 * sc).toFixed(1)}" y="${(gy - 34 * sc).toFixed(1)}" width="${(6 * sc).toFixed(1)}" height="${(34 * sc).toFixed(1)}" fill="#20211e"/>`;
    const g = ngon(x, gy - 34 * sc - r * .8, r, 7, -Math.PI / 2);
    s += poly(g.map(([a, b]) => [a + 4, b + 6]), 'rgba(0,0,0,.12)') + poly(g, '#c9ef55') + poly([g[0], g[1], g[2], g[3], [x, gy - 34 * sc - r * .8]], '#a7cf33');
    return s;
  }
  function building(x, w, h, base, fill, side, rnd, lit) {
    let s = poly([[x, base], [x + w, base], [x + w, base - h], [x, base - h]], fill);
    s += poly([[x + w - 10, base], [x + w, base], [x + w, base - h], [x + w - 10, base - h + 6]], side);
    const cols = Math.max(1, Math.floor((w - 20) / 26)), rows = Math.max(1, Math.floor((h - 40) / 34));
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      if (rnd() > lit) continue;
      const col = ['#c5ef41', '#ff7d3f', '#f7f5ef', '#c6c3ff'][Math.floor(rnd() * 4)];
      s += `<rect x="${(x + 12 + c * 26).toFixed(0)}" y="${(base - h + 22 + r * 34).toFixed(0)}" width="11" height="15" fill="${col}" opacity="${(.55 + rnd() * .4).toFixed(2)}"/>`;
    }
    return s;
  }
  function tool(kind, x, y, s) {
    const T = `transform="translate(${x},${y}) scale(${s})"`;
    if (kind === 'scissors') return `<g ${T}><circle cx="-18" cy="40" r="15" fill="none" stroke="#ff641f" stroke-width="7"/><circle cx="18" cy="40" r="15" fill="none" stroke="#ff641f" stroke-width="7"/><polygon points="-10,28 4,-60 10,-58 2,30" fill="#d9d6cf"/><polygon points="10,28 -4,-60 -10,-58 -2,30" fill="#bfbcb4"/><circle cx="0" cy="22" r="4" fill="#20211e"/></g>`;
    if (kind === 'ruler') { let t = ''; for (let i = 0; i < 12; i++) t += `<rect x="${-8 + (i % 2 ? 4 : 0)}" y="${-70 + i * 12}" width="${i % 2 ? 4 : 8}" height="2" fill="#20211e"/>`; return `<g ${T}><rect x="-8" y="-76" width="22" height="152" rx="3" fill="#c5ef41"/>${t}</g>`; }
    if (kind === 'pencil') return `<g ${T}><polygon points="-9,-60 9,-60 9,48 -9,48" fill="#ff7d3f"/><polygon points="0,-60 9,-60 9,48 0,48" fill="#e2581c"/><polygon points="-9,48 9,48 0,74" fill="#f2d4a8"/><polygon points="-3,66 3,66 0,74" fill="#20211e"/><rect x="-9" y="-74" width="18" height="14" fill="#f6c3d4"/></g>`;
    if (kind === 'glue') return `<g ${T}><rect x="-20" y="-30" width="40" height="78" rx="8" fill="#f7f5ef"/><rect x="-20" y="-6" width="40" height="26" fill="#c6c3ff"/><polygon points="-8,-30 8,-30 3,-56 -3,-56" fill="#ff641f"/></g>`;
    if (kind === 'knife') return `<g ${T}><rect x="-7" y="-20" width="14" height="80" rx="4" fill="#20211e"/><rect x="-7" y="-20" width="14" height="10" fill="#c5ef41"/><polygon points="-6,-20 6,-20 0,-62" fill="#d9d6cf"/></g>`;
    return '';
  }

  /* ------------------------- themes ------------------------- */
  const themes = {
    dream: {
      layers: [['clouds', .05], ['far', .1], ['mid', .2], ['road', .3], ['front', .5]],
      clouds(W, r) { let s = ''; const n = Math.max(4, Math.round(W / 420)); for (let i = 0; i < n; i++) s += cloud((i + .5) / n * W + (r() - .5) * 140, 90 + r() * 230, .55 + r() * .6); return s; },
      far(W, r) {
        let s = '', x = -160;
        while (x < W + 160) { const w = 300 + r() * 260; s += peak(x, w, 560 + r() * 60, '#e7e4ff', '#d3cff9'); x += w * .55; }
        x = -100;
        while (x < W + 100) { const w = 280 + r() * 300; const py = 430 + r() * 150; s += peak(x, w, py, '#d4d0ff', '#b4adf1', py < 520 ? '#fffdf8' : null); x += w * .62; }
        return s;
      },
      mid(W, r) {
        const gy = x => 600 + Math.sin(x / 300) * 22 + Math.sin(x / 97) * 6;
        const pts = []; for (let x = -20; x <= W + 140; x += 120) pts.push([x, gy(x)]);
        let s = poly([[-20, H], ...pts, [W + 140, H]].map(([x, y]) => [x, y + 8]), 'rgba(0,0,0,.08)');
        s += poly([[-20, H], ...pts, [W + 140, H]], '#bfe9d3');
        for (let i = 0; i < pts.length - 1; i += 2) s += poly([pts[i], pts[i + 1], [pts[i + 1][0], H]], '#a9dec5');
        let x = 60 + r() * 120;
        while (x < W - 60) {
          if (r() < .55) s += house(x, gy(x) + 6, .8 + r() * .5, r);
          else { s += tree(x, gy(x) + 4, .8 + r() * .6); s += tree(x + 46, gy(x + 46) + 4, .6 + r() * .4); }
          x += 220 + r() * 260;
        }
        return s;
      },
      road(W) {
        // a deep road: the hero's words sit on its left, the car drives on its right, and the whole car (rear wheels too) is on tarmac
        let s = `<rect x="0" y="606" width="${W}" height="40" fill="#9bd6bd"/><rect x="0" y="636" width="${W}" height="${H - 636}" fill="#2a2b28"/><rect x="0" y="636" width="${W}" height="6" fill="#f7f5ef"/>`;
        for (let x = Math.round(W * .5); x < W; x += 120) s += `<rect x="${x}" y="872" width="64" height="7" fill="#c5ef41"/>`;
        return s;
      },
      front(W, r) {
        let s = '';
        const tuft = (x0, span, flip) => {
          for (let i = 0; i < 9; i++) {
            const bx = x0 + (flip ? -1 : 1) * (i / 8) * span, top = 650 + r() * 140, lean = (r() - .5) * 60;
            const col = ['#ff7d3f', '#c5ef41', '#9bd6bd', '#ff641f'][i % 4];
            s += poly([[bx - 16, H + 4], [bx + lean, top], [bx + 18, H + 4]], col) + poly([[bx + lean, top], [bx + 18, H + 4], [bx + 2, H + 4]], 'rgba(0,0,0,.12)');
          }
          for (let i = 0; i < 3; i++) {
            const fx = x0 + (flip ? -1 : 1) * (40 + i * 70 + r() * 30), fy = 700 + r() * 80;
            s += `<rect x="${fx - 2}" y="${fy}" width="4" height="${H - fy}" fill="#20211e"/>`;
            const g = ngon(fx, fy, 22, 6, 0);
            s += poly(g.map(([a, b]) => [a + 3, b + 5]), 'rgba(0,0,0,.14)') + poly(g, i % 2 ? '#f6c3d4' : '#fffdf8') + poly(ngon(fx, fy, 8, 6, 0), '#ff641f');
          }
        };
        // only the right edge gets grass: the bottom-left is kept clear for the hero's words
        tuft(W + 10, 200, true);
        for (let i = 0; i < 6; i++) s += star4(W * (.25 + r() * .5), 110 + r() * 200, 6 + r() * 8, i % 2 ? '#ff641f' : '#c5ef41', .9);
        return s;
      }
    },

    city: {
      layers: [['sky', .03], ['far', .1], ['near', .22], ['ground', .38], ['props', .55]],
      sky(W, r) {
        let s = ''; for (let i = 0; i < W / 26; i++) s += star4(r() * W, 30 + r() * 420, 1.5 + r() * 4, '#f7f5ef', (.25 + r() * .6).toFixed(2));
        const mx = W * .8, my = 170, m = ngon(mx, my, 70, 10);
        s += `<circle cx="${mx}" cy="${my}" r="130" fill="#c6c3ff" opacity=".08"/>` + poly(m, '#f7f2df') + poly([m[0], m[1], m[2], m[3], m[4], [mx, my]], '#e7e0c6');
        s += poly(ngon(mx - 20, my - 14, 12, 7), '#e2dac0') + poly(ngon(mx + 22, my + 18, 8, 7), '#e2dac0');
        return s;
      },
      far(W, r) { let s = '', x = -40; while (x < W) { const w = 70 + r() * 110, h = 200 + r() * 260; s += building(x, w, h, 790, '#2b2846', '#24213c', r, .16); x += w + 6 + r() * 20; } return s; },
      near(W, r) {
        let s = '', x = -60;
        while (x < W) {
          const w = 120 + r() * 130, h = 300 + r() * 280;
          s += drop([[x, 790], [x + w, 790], [x + w, 790 - h], [x, 790 - h]], .18, 8, 0) + building(x, w, h, 790, '#373160', '#2e2952', r, .22);
          if (r() < .35) { const by = 790 - h + 30 + r() * 80, bw = Math.min(w - 30, 110); s += `<rect x="${x + 15}" y="${by}" width="${bw}" height="34" rx="4" fill="#20211e" stroke="${r() < .5 ? '#c5ef41' : '#ff641f'}" stroke-width="3"/><rect x="${x + 25}" y="${by + 12}" width="${bw - 20}" height="4" fill="#c6c3ff" opacity=".8"/><rect x="${x + 25}" y="${by + 20}" width="${(bw - 20) * .6}" height="4" fill="#c6c3ff" opacity=".5"/>`; }
          if (r() < .5) s += `<rect x="${x + w * .6}" y="${790 - h - 50}" width="3" height="50" fill="#20211e"/><circle cx="${x + w * .6 + 1.5}" cy="${790 - h - 52}" r="4" fill="#ff641f"/>`;
          x += w + 30 + r() * 80;
        }
        return s;
      },
      ground(W) {
        let s = `<rect x="0" y="780" width="${W}" height="${H - 780}" fill="#1a1922"/><rect x="0" y="780" width="${W}" height="10" fill="#4a4566"/>`;
        for (let x = 20; x < W; x += 140) s += `<rect x="${x}" y="846" width="70" height="7" fill="#c5ef41" opacity=".85"/>`;
        return s;
      },
      props(W, r) {
        let s = '';
        for (let x = 180; x < W; x += 520 + r() * 200) s += `<circle cx="${x + 34}" cy="600" r="90" fill="#ffcf8a" opacity=".07"/><rect x="${x - 4}" y="590" width="8" height="200" fill="#121311"/><polygon points="${x - 4},592 ${x + 46},584 ${x + 46},596 ${x - 4},600" fill="#121311"/><polygon points="${x + 24},596 ${x + 52},596 ${x + 46},606 ${x + 30},606" fill="#ffd78f"/>`;
        return s;
      }
    },

    circuit: {
      layers: [['sky', .03], ['far', .1], ['mid', .22], ['ground', .38], ['props', .55]],
      sky(W) { const sx = W * .68, sy = 600, g = ngon(sx, sy, 170, 14); return `<circle cx="${sx}" cy="${sy}" r="260" fill="#fff1cf" opacity=".25"/>` + poly(g, '#ff641f') + poly(g.slice(0, 8).concat([[sx, sy]]), '#ff7d3f'); },
      far(W, r) { let s = '', x = -100; while (x < W + 100) { const w = 360 + r() * 300; s += peak(x, w, 590 + r() * 70, '#cf9fc9', '#b583b3'); x += w * .6; } return s; },
      mid(W, r) {
        let s = '', x = 40;
        while (x < W) {
          const w = 520 + r() * 240, h = 170 + r() * 70, base = 760;
          s += drop([[x, base], [x + w, base], [x + w, base - h], [x, base - h]], .2, 8, 0);
          for (let t = 0; t < 4; t++) { const ty = base - (t + 1) * h / 4; s += poly([[x + t * 16, ty + h / 4], [x + w - t * 16, ty + h / 4], [x + w - t * 16, ty], [x + t * 16, ty]], t % 2 ? '#34352f' : '#2d2e2a'); for (let k = 0; k < (w - 40) / 13; k++) if (r() < .72) s += `<circle cx="${(x + 20 + t * 16 + k * 13).toFixed(0)}" cy="${(ty + 12).toFixed(0)}" r="3.4" fill="${['#ff641f', '#c5ef41', '#c6c3ff', '#f7f5ef', '#b9ecd7', '#f6c3d4'][Math.floor(r() * 6)]}"/>`; }
          for (let k = 0; k < w; k += 40) s += poly([[x + k, base - h - 6], [x + k + 40, base - h - 6], [x + k + 46, base - h - 34], [x + k + 6, base - h - 34]], k % 80 ? '#f7f5ef' : '#ff641f');
          const tx = x + w + 60;
          s += `<rect x="${tx}" y="${base - 360}" width="8" height="360" fill="#20211e"/><rect x="${tx - 34}" y="${base - 384}" width="76" height="30" fill="#20211e"/>`;
          for (let k = 0; k < 4; k++) s += `<rect x="${tx - 28 + k * 18}" y="${base - 378}" width="12" height="18" fill="#fff4cf"/>`;
          s += `<circle cx="${tx + 4}" cy="${base - 370}" r="80" fill="#fff4cf" opacity=".12"/>`;
          for (let f = 0; f < 3; f++) { const fx = x + 60 + f * (w / 3); s += `<rect x="${fx}" y="${base - h - 120}" width="4" height="90" fill="#20211e"/>` + poly([[fx + 4, base - h - 120], [fx + 54, base - h - 104], [fx + 4, base - h - 88]], ['#c5ef41', '#ff641f', '#c6c3ff'][f]); }
          x += w + 200 + r() * 120;
        }
        return s;
      },
      ground(W) {
        let s = `<rect x="0" y="788" width="${W}" height="${H - 788}" fill="#2a2b27"/><rect x="0" y="806" width="${W}" height="5" fill="#f7f5ef"/>`;
        for (let x = 0; x < W; x += 60) s += `<rect x="${x}" y="760" width="60" height="28" fill="${(x / 60) % 2 ? '#f7f5ef' : '#e3342f'}"/>`;
        for (let x = 120; x < W; x += 420) s += `<polyline points="${x},856 ${x},830 ${x + 90},830" fill="none" stroke="#f7f5ef" stroke-width="5" opacity=".7"/>`;
        return s;
      },
      props(W, r) {
        let s = '';
        for (let x = 260; x < W; x += 680 + r() * 220) {
          for (let k = 0; k < 3; k++) { const cy = 870 - k * 30; s += `<ellipse cx="${x}" cy="${cy}" rx="36" ry="16" fill="#191a17"/><ellipse cx="${x}" cy="${cy - 4}" rx="36" ry="14" fill="#2a2b27"/><path d="M${x - 30},${cy - 6} q30,10 60,0" stroke="${k % 2 ? '#ff641f' : '#f7f5ef'}" stroke-width="3" fill="none"/>`; }
          s += poly([[x + 90, 892], [x + 110, 840], [x + 130, 892]], '#ff641f') + `<rect x="${x + 100}" y="862" width="20" height="7" fill="#f7f5ef"/>`;
        }
        return s;
      }
    },

    vault: {
      layers: [['far', .08], ['mid', .18], ['ground', .34], ['props', .5]],
      defs: `<defs><radialGradient id="vw" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".28"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></radialGradient><linearGradient id="vb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2d6" stop-opacity=".26"/><stop offset="1" stop-color="#fff2d6" stop-opacity="0"/></linearGradient><linearGradient id="vr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".08"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>`,
      far(W) { let s = ''; for (let x = 40; x < W; x += 420) { const w = 300; s += `<path d="M${x},790 V380 A${w / 2},${w / 2} 0 0 1 ${x + w},380 V790 Z" fill="#1d1813" stroke="#d6b27a" stroke-width="3"/><path d="M${x + 24},790 V390 A${w / 2 - 24},${w / 2 - 24} 0 0 1 ${x + w - 24},390 V790 Z" fill="url(#vw)"/>`; } return s; },
      mid(W) { let s = ''; for (let x = 190; x < W; x += 420) s += poly([[x - 16, 0], [x + 16, 0], [x + 190, 790], [x - 190, 790]], 'url(#vb)'); return s; },
      ground(W) { return `<rect x="0" y="790" width="${W}" height="${H - 790}" fill="#19140f"/><rect x="0" y="790" width="${W}" height="3" fill="#d6b27a"/><rect x="0" y="794" width="${W}" height="70" fill="url(#vr)"/>`; },
      props(W, r) {
        let s = '';
        for (let x = 120; x < W; x += 300) { s += `<rect x="${x - 4}" y="800" width="8" height="86" fill="#d6b27a"/><circle cx="${x}" cy="798" r="9" fill="#e9c98e"/><rect x="${x - 16}" y="884" width="32" height="8" rx="3" fill="#b8925a"/>`; if (x + 300 < W) s += `<path d="M${x},816 Q${x + 150},866 ${x + 300},816" stroke="#8c2433" stroke-width="8" fill="none" stroke-linecap="round"/>`; }
        for (let x = 210; x < W; x += 420 + r() * 120) { const y = 120 + r() * 160; s += `<rect x="${x - .75}" y="0" width="1.5" height="${y}" fill="#d6b27a" opacity=".6"/>` + star4(x, y + 18, 18, '#e2c084') + poly([[x, y], [x + 5, y + 13], [x, y + 36], [x - 5, y + 23]], '#c49a55'); }
        return s;
      }
    },

    garage: {
      layers: [['far', .06], ['mid', .14], ['ground', .26]],
      far(W, r) {
        let s = '';
        for (let x = 0; x < W; x += 170) s += `<rect x="${x}" y="0" width="170" height="${H}" fill="${(x / 170) % 2 ? '#1b1c19' : '#1e1f1b'}"/><rect x="${x}" y="0" width="2" height="${H}" fill="#151613"/>`;
        const px = W * .5, pw = W * .44, py = 64, ph = 200;
        s += `<rect x="${px + 8}" y="${py + 10}" width="${pw}" height="${ph}" fill="rgba(0,0,0,.35)"/><rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="#2b2c27"/>`;
        for (let gx = px + 20; gx < px + pw - 10; gx += 26) for (let gy = py + 20; gy < py + ph - 10; gy += 26) s += `<circle cx="${gx}" cy="${gy}" r="2.6" fill="#1a1b18"/>`;
        const kinds = ['scissors', 'ruler', 'pencil', 'glue', 'knife', 'scissors', 'pencil'];
        kinds.forEach((k, i) => { s += tool(k, px + 60 + i * (pw - 100) / (kinds.length - 1), py + ph / 2, 1.05); });
        s += `<rect x="${px}" y="${py + ph + 30}" width="${pw}" height="10" fill="#3a3b36"/>`;
        for (let i = 0; i < 5; i++) { const bx = px + 30 + i * (pw / 5), bw = 70 + r() * 40, bh = 50 + r() * 40; s += `<rect x="${bx}" y="${py + ph + 30 - bh}" width="${bw}" height="${bh}" fill="${['#c9a77a', '#b8946a', '#d8bb92'][i % 3]}"/><rect x="${bx}" y="${py + ph + 30 - bh + bh * .45}" width="${bw}" height="6" fill="#20211e" opacity=".25"/>`; }
        return s;
      },
      mid(W) {
        let s = '';
        for (let x = 60; x < W; x += 420) s += `<rect x="${x}" y="34" width="260" height="10" rx="5" fill="#f7f5ef"/><rect x="${x - 20}" y="44" width="300" height="60" fill="#f7f5ef" opacity=".04"/>`;
        [0, W - 60].forEach(x => { s += `<rect x="${x}" y="0" width="60" height="${H}" fill="#232420"/>`; for (let y = 620; y < H; y += 40) s += poly([[x, y], [x + 60, y - 30], [x + 60, y - 10], [x, y + 20]], '#c5ef41', 'opacity=".85"'); });
        return s;
      },
      ground(W) {
        let s = `<defs><linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#262722"/><stop offset="1" stop-color="#121311"/></linearGradient></defs><rect x="0" y="620" width="${W}" height="${H - 620}" fill="url(#gf)"/><rect x="0" y="620" width="${W}" height="3" fill="#3a3b36"/>`;
        const bx = W * .52, bw = W * .44;
        s += `<polygon points="${bx + 40},628 ${bx + bw - 40},628 ${bx + bw + 30},${H} ${bx - 30},${H}" fill="none" stroke="#c5ef41" stroke-width="5" opacity=".75"/>`;
        s += `<text x="${bx + bw / 2}" y="${H - 18}" text-anchor="middle" font-family="Archivo Black, Arial Black, sans-serif" font-size="120" fill="none" stroke="#c5ef41" stroke-width="2.5" opacity=".35">01</text>`;
        return s;
      }
    },

    // a kid's bedroom, popped up out of the hero's orange: wall, shelf, floor + rug, foreground
    room: {
      layers: [['wall', .04], ['shelf', .1], ['floor', .16], ['front', .32]],
      wall(W, r) {
        const port = W < 1000;
        let s = poly([[0, -60], [W, -60], [W, 712], [0, 712]], '#ff7a33');
        for (let x = 0; x < W; x += 84) s += `<rect x="${x}" y="-60" width="42" height="772" fill="rgba(255,255,255,.05)"/>`;
        for (let y = 70, k = 0; y < 680; y += 92, k++) for (let x = (k % 2) * 42 + 21; x < W; x += 84) s += star4(x, y, 6, '#fff3e0', .3);
        // the ceiling edge, so the room reads as a paper box once the camera rises out of it
        s += poly([[0, -60], [W, -60], [W, 16], [0, 16]], '#e2581c') + poly([[0, 16], [W, 16], [W, 24], [0, 24]], 'rgba(0,0,0,.12)');
        // bunting
        const n = Math.max(6, Math.round(W / 74)), pts = [];
        for (let i = 0; i <= n; i++) pts.push([i / n * W, 38 + Math.sin(i / n * Math.PI) * (port ? 34 : 64)]);
        s += `<polyline points="${P(pts)}" fill="none" stroke="#20211e" stroke-width="2"/>`;
        for (let i = 0; i < n; i++) {
          const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], f = [[x0 + 6, y0 + 2], [x1 - 6, y1 + 2], [(x0 + x1) / 2, (y0 + y1) / 2 + 46]];
          s += drop(f, .12, 3, 5) + poly(f, ['#c5ef41', '#c6c3ff', '#fffdf8', '#f6c3d4', '#20211e', '#b9ecd7'][i % 6]);
        }
        // the night window
        const ww = port ? 210 : 330, wh = port ? 180 : 270, wx = port ? W - ww - 34 : W * .56, wy = port ? 330 : 128; // on phones it sits below the headline
        s += drop([[wx - 16, wy - 16], [wx + ww + 16, wy - 16], [wx + ww + 16, wy + wh + 16], [wx - 16, wy + wh + 16]], .16, 7, 10);
        s += poly([[wx - 16, wy - 16], [wx + ww + 16, wy - 16], [wx + ww + 16, wy + wh + 16], [wx - 16, wy + wh + 16]], '#fbf5e8');
        s += poly([[wx, wy], [wx + ww, wy], [wx + ww, wy + wh], [wx, wy + wh]], '#24254f') + poly([[wx, wy + wh * .55], [wx + ww, wy + wh * .4], [wx + ww, wy + wh], [wx, wy + wh]], '#2e3063');
        for (let i = 0; i < 9; i++) s += star4(wx + 18 + r() * (ww - 36), wy + 16 + r() * (wh * .6), 3 + r() * 5, '#ffe58a', .9);
        const mx = wx + ww * .72, my = wy + wh * .3, mr = Math.min(ww, wh) * .14;
        s += poly(ngon(mx, my, mr, 12), '#fffdf8') + poly(ngon(mx + mr * .45, my - mr * .2, mr * .86, 12), '#24254f');
        s += poly([[wx + ww / 2 - 5, wy], [wx + ww / 2 + 5, wy], [wx + ww / 2 + 5, wy + wh], [wx + ww / 2 - 5, wy + wh]], '#fbf5e8') + poly([[wx, wy + wh / 2 - 5], [wx + ww, wy + wh / 2 - 5], [wx + ww, wy + wh / 2 + 5], [wx, wy + wh / 2 + 5]], '#fbf5e8');
        // curtains
        s += poly([[wx - 46, wy - 30], [wx + 22, wy - 30], [wx - 4, wy + wh + 40], [wx - 60, wy + wh + 40]], '#c5ef41') + poly([[wx - 14, wy - 30], [wx + 22, wy - 30], [wx - 4, wy + wh + 40], [wx - 24, wy + wh + 40]], '#a7cf33');
        s += poly([[wx + ww - 22, wy - 30], [wx + ww + 46, wy - 30], [wx + ww + 60, wy + wh + 40], [wx + ww + 4, wy + wh + 40]], '#c5ef41') + poly([[wx + ww - 22, wy - 30], [wx + ww + 14, wy - 30], [wx + ww + 24, wy + wh + 40], [wx + ww + 4, wy + wh + 40]], '#a7cf33');
        if (!port) {
          // a poster of the dream car, taped up a little crooked
          const px = Math.min(W - 230, wx + ww + 110), py = 170;
          s += `<g transform="rotate(4 ${px + 85} ${py + 60})">${drop([[px, py], [px + 170, py], [px + 170, py + 124], [px, py + 124]], .16, 6, 8)}${poly([[px, py], [px + 170, py], [px + 170, py + 124], [px, py + 124]], '#fffdf8')}${poly([[px + 10, py + 10], [px + 160, py + 10], [px + 160, py + 92], [px + 10, py + 92]], '#20211e')}`;
          s += poly([[px + 30, py + 78], [px + 44, py + 58], [px + 92, py + 50], [px + 120, py + 58], [px + 142, py + 66], [px + 142, py + 80]], '#ff641f') + poly([[px + 62, py + 56], [px + 78, py + 46], [px + 100, py + 48], [px + 108, py + 56]], '#24254f');
          s += poly(ngon(px + 56, py + 82, 9, 8), '#fffdf8') + poly(ngon(px + 122, py + 82, 9, 8), '#fffdf8');
          s += `<text x="${px + 85}" y="${py + 113}" text-anchor="middle" font-family="Archivo Black, Arial Black, sans-serif" font-size="15" fill="#20211e">DREAM CAR</text>`;
          s += poly([[px + 64, py - 10], [px + 106, py - 8], [px + 104, py + 8], [px + 62, py + 6]], 'rgba(238,226,190,.85)') + '</g>';
        }
        s += poly([[0, 688], [W, 688], [W, 712], [0, 712]], '#fbf5e8') + poly([[0, 706], [W, 706], [W, 712], [0, 712]], 'rgba(0,0,0,.1)');
        return s;
      },
      shelf(W, r) {
        if (W < 1000) return '';
        const x0 = Math.min(W * .76, W - 360), x1 = x0 + 300, y = 470;
        let s = drop([[x0, y], [x1, y], [x1, y + 16], [x0, y + 16]], .16, 4, 8) + poly([[x0, y], [x1, y], [x1, y + 16], [x0, y + 16]], '#c9925a') + poly([[x0, y + 12], [x1, y + 12], [x1, y + 16], [x0, y + 16]], '#a8743f');
        let bx = x0 + 18;
        ['#ff641f', '#c6c3ff', '#20211e', '#c5ef41', '#f6c3d4'].forEach((c, i) => { const bw = 18 + r() * 10, bh = 58 + r() * 34; s += poly([[bx, y], [bx + bw, y], [bx + bw, y - bh], [bx, y - bh]], c) + poly([[bx + bw - 5, y], [bx + bw, y], [bx + bw, y - bh], [bx + bw - 5, y - bh]], 'rgba(0,0,0,.14)'); bx += bw + 3; });
        const gx = bx + 60, gr = 34; // a globe
        s += poly([[gx - 4, y], [gx + 4, y], [gx + 4, y - 22], [gx - 4, y - 22]], '#20211e') + poly(ngon(gx, y - 22 - gr, gr, 10), '#b9ecd7') + poly([[gx - 20, y - 70], [gx + 6, y - 78], [gx + 14, y - 52], [gx - 10, y - 46]], '#c5ef41') + poly([[gx - gr - 2, y - 22 - gr], [gx - gr + 4, y - 22 - gr], [gx + gr + 2, y - 26], [gx + gr - 4, y - 26]], 'rgba(0,0,0,.18)');
        const tx = gx + 60; // a little paper rocket, the first one ever built
        s += poly([[tx, y], [tx + 26, y], [tx + 26, y - 50], [tx + 13, y - 76], [tx, y - 50]], '#fffdf8') + poly([[tx + 13, y - 76], [tx + 26, y - 50], [tx + 26, y], [tx + 13, y]], '#e7dbc6') + poly([[tx, y - 14], [tx - 10, y], [tx, y]], '#ff641f') + poly([[tx + 26, y - 14], [tx + 36, y], [tx + 26, y]], '#ff641f');
        return s;
      },
      floor(W, r) {
        const g = rugGeo(W);
        let s = poly([[0, 712], [W, 712], [W, H], [0, H]], '#e9b27e') + poly([[0, 712], [W, 712], [W, 730], [0, 730]], 'rgba(0,0,0,.08)');
        for (let i = -16; i <= 16; i++) s += `<line x1="${(g.cx + i * 70).toFixed(0)}" y1="712" x2="${(g.cx + i * 250).toFixed(0)}" y2="${H}" stroke="rgba(120,70,30,.13)" stroke-width="2"/>`;
        const oval = k => ngon(g.cx, g.cy, g.rx * k, 30).map(([x, y]) => [x, g.cy + (y - g.cy) * .26]);
        s += drop(oval(1), .14, 6, 10) + poly(oval(1), '#c6c3ff') + poly(oval(.8), '#b4adf1') + poly(oval(.55), '#d9d6ff') + poly(oval(.3), '#c6c3ff');
        return s;
      },
      front(W, r) {
        const port = W < 1000;
        let s = '';
        if (!port) { // the bed you were meant to be sleeping in
          const bx = -40, bw = Math.min(W * .26, 460), by = 640;
          s += drop([[bx, by], [bx + bw, by], [bx + bw + 20, H], [bx, H]], .16, 8, -6);
          s += poly([[bx, by - 30], [bx + bw, by - 30], [bx + bw, H], [bx, H]], '#c9925a') + poly([[bx, by - 6], [bx + bw - 10, by - 18], [bx + bw - 10, by + 40], [bx, by + 52]], '#fbf5e8');
          s += poly([[bx, by + 20], [bx + bw * .7, by + 2], [bx + bw, by + 30], [bx + bw, H], [bx, H]], '#c5ef41') + poly([[bx + bw * .7, by + 2], [bx + bw, by + 30], [bx + bw, H], [bx + bw * .8, H]], '#a7cf33');
          s += poly([[bx + 30, by - 40], [bx + 150, by - 52], [bx + 170, by - 10], [bx + 40, by + 4]], '#fffdf8') + poly([[bx + 150, by - 52], [bx + 170, by - 10], [bx + 158, by - 6]], '#e7dbc6');
          // the lamp on the nightstand
          const lx = W - 120;
          s += drop([[lx - 70, 650], [lx + 70, 650], [lx + 70, H], [lx - 70, H]], .14, -8, 6) + poly([[lx - 70, 650], [lx + 70, 650], [lx + 70, H], [lx - 70, H]], '#fbf5e8') + poly([[lx + 50, 650], [lx + 70, 650], [lx + 70, H], [lx + 50, H]], '#e7dbc6');
          s += poly([[lx - 6, 650], [lx + 6, 650], [lx + 6, 560], [lx - 6, 560]], '#20211e') + poly([[lx - 54, 560], [lx + 54, 560], [lx + 30, 486], [lx - 30, 486]], '#f6c3d4') + poly([[lx + 10, 560], [lx + 54, 560], [lx + 30, 486], [lx + 6, 486]], '#e3a2b8');
          s += poly([[lx - 54, 560], [lx + 54, 560], [lx + 150, 700], [lx - 150, 700]], 'rgba(255,244,214,.16)');
        }
        // crayons and a paper plane, dropped where the mission was planned
        const g = rugGeo(W), cols = ['#ff641f', '#c5ef41', '#c6c3ff', '#20211e', '#f6c3d4'];
        for (let i = 0; i < 5; i++) {
          const cx = g.cx - g.rx * (port ? .9 : 1.2) + i * 26 + r() * 10, cy = 860 + r() * 22, a = -.5 + r();
          const pts = [[-26, -5], [20, -5], [30, 0], [20, 5], [-26, 5]].map(([x, y]) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);
          s += drop(pts, .14, 2, 4) + poly(pts, cols[i]);
        }
        const fx = g.cx + g.rx * (port ? .55 : 1.1), fy = 862;
        s += drop([[fx, fy], [fx + 78, fy - 18], [fx + 30, fy + 12]], .14, 3, 6) + poly([[fx, fy], [fx + 78, fy - 18], [fx + 30, fy + 12]], '#fffdf8') + poly([[fx + 30, fy + 12], [fx + 78, fy - 18], [fx + 36, fy + 2]], '#e7dbc6');
        return s;
      }
    },

    // the night the rocket flies into: deep paper sky, planets, a lot of crayon stars
    night: {
      layers: [['deep', .02], ['planets', .08], ['stars', .14]],
      deep(W) {
        let s = poly([[0, 0], [W, 0], [W, H], [0, H]], '#1c1d3b');
        [[0, '#232449'], [.34, '#272953'], [.62, '#2c2e5f']].forEach(([k, c]) => { s += poly([[0, H * k + 140], [W * .5, H * k + 90], [W, H * k + 150], [W, H], [0, H]], c); });
        return s;
      },
      planets(W, r) {
        const port = W < 1000;
        const px = port ? W * .78 : W * .82, py = port ? 160 : 210, pr = port ? 46 : 74;
        let s = poly(ngon(px + 6, py + 9, pr, 14), 'rgba(0,0,0,.25)') + poly(ngon(px, py, pr, 14), '#c6c3ff') + poly([...ngon(px, py, pr, 14).slice(0, 7), [px, py]], '#b4adf1');
        s += poly([[px - pr * 1.9, py + pr * .25], [px + pr * 1.9, py - pr * .35], [px + pr * 1.9, py - pr * .2], [px - pr * 1.9, py + pr * .42]], '#fffdf8');
        const mx = port ? W * .16 : W * .12, my = port ? 120 : 150, mr = port ? 30 : 46;
        s += poly(ngon(mx, my, mr, 12), '#fffdf8') + poly(ngon(mx + mr * .4, my - mr * .2, mr * .82, 12), '#1c1d3b');
        s += poly(ngon(port ? W * .1 : W * .9, port ? 760 : 700, port ? 18 : 26, 9), '#ff7d3f') + poly(ngon(port ? W * .86 : W * .2, port ? 820 : 760, port ? 12 : 16, 8), '#c5ef41');
        return s;
      },
      stars(W, r) {
        let s = '';
        const n = Math.round(W / 22);
        for (let i = 0; i < n; i++) s += star4(r() * W, r() * H, 2 + r() * 7, r() > .7 ? '#ffe58a' : '#fffdf8', .5 + r() * .5);
        const cs = [[W * .3, 140], [W * .36, 110], [W * .42, 150], [W * .47, 120], [W * .52, 160]];
        s += `<polyline points="${P(cs)}" fill="none" stroke="#fffdf8" stroke-width="2" stroke-dasharray="6 8" opacity=".5"/>` + cs.map(([x, y]) => star4(x, y, 9, '#ffe58a')).join('');
        return s;
      }
    }
  };
  // where the rug sits (in scene units); the cardboard box is parked on its centre
  function rugGeo(W) { const port = W < 1000; return { cx: port ? W * .5 : W * .66, cy: port ? 822 : 800, rx: port ? W * .4 : Math.min(W * .2, 360) }; }
  // the rug's centre on screen for a scene element of this size (layers are drawn `over` wider, centred)
  function rugAt(cw, ch, over = .08) { const W = Math.round(H * cw * (1 + over) / ch), g = rugGeo(W), k = cw * (1 + over) / W; return { x: g.cx * k - cw * over / 2, y: g.cy * ch / H, rx: g.rx * k }; }

  /* ---------- build a layered scene inside an element ---------- */
  function build(el, theme, o = {}) {
    const T = themes[theme]; if (!T) return null;
    const seed = o.seed || 7, over = o.over ?? .08;
    const travelOf = () => typeof o.travel === 'function' ? o.travel() : (o.travel || 0);
    el.classList.add('scn', 'scn--' + theme);
    // `own` is private to the scene; callers get a copy they may extend with their own parallax movers
    const own = T.layers.map(([name, depth]) => {
      if (o.depths && o.depths[name] != null) depth = o.depths[name];
      const d = document.createElement('div');
      d.className = 'scn__l scn__l--' + name; d.dataset.depth = depth;
      el.append(d);
      return { el: d, name, depth };
    });
    const layers = own.slice();
    function draw() {
      const cw = el.clientWidth || innerWidth, ch = el.clientHeight || innerHeight, travel = travelOf();
      own.forEach((L, i) => {
        const w = cw * (1 + over) + L.depth * travel;
        const W = Math.round(H * w / ch);
        const r = rng(seed * 31 + i * 101);
        L.el.style.width = w + 'px';
        L.el.style.left = (-cw * over / 2) + 'px';
        L.el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMinYMax meet" width="100%" height="100%" aria-hidden="true">${T.defs || ''}${T[L.name](W, r)}</svg>`;
      });
    }
    draw();
    let rt; const ro = new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(draw, 160); });
    ro.observe(el);
    return { layers, draw, theme };
  }

  // pointer parallax for a built scene (desktop only)
  function parallax(scene, area, amt = 60) {
    if (!window.gsap || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const movers = scene.layers.map(L => ({ x: gsap.quickTo(L.el, 'x', { duration: 1, ease: 'power3' }), y: gsap.quickTo(L.el, 'y', { duration: 1, ease: 'power3' }), d: L.depth, yd: L.yDepth ?? L.depth }));
    // one layout read when the pointer arrives, one update per frame at most (no layout thrash on fast mice)
    let r = null, ev = null, queued = false;
    area.addEventListener('pointerenter', () => { r = area.getBoundingClientRect(); });
    addEventListener('scroll', () => { r = null; }, { passive: true });
    area.addEventListener('pointermove', e => {
      ev = e; if (queued) return; queued = true;
      requestAnimationFrame(() => {
        queued = false; r = r || area.getBoundingClientRect();
        const mx = (ev.clientX - r.left) / r.width - .5, my = (ev.clientY - r.top) / r.height - .5;
        movers.forEach(m => { m.x(-mx * amt * m.d * 2); m.y(-my * amt * m.yd); });
      });
    });
  }

  window.DIYscene = { build, parallax, themes, rugAt };
})();
