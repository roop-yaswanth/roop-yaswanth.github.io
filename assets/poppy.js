// Poppy, on every page: the googly eyes as a character, after Poppy Li of Mythic Quest with a little of Bujji
// from Kalki 2898 AD. On the home page she lives in the name's o's. When the name scrolls away she lifts out of
// them, like a drone leaving its suit, and flies up to perch beside the header's name; when the name comes back
// she flies home and the o's get their eyes again. On other pages she starts on the perch. She never stops
// watching: her pupils follow the pointer or whatever was just touched, she blinks, bobs, hops when poked and
// dozes when left alone. Now and then she flies out beside a section and ponders it in a speech bubble.
// Her lines live in src/poppy/*.txt; the build gathers them into assets/poppy.json, fetched once the page has
// settled, and each pool names the moment it answers. She speaks at most every few seconds, sooner when
// answering something the visitor just did, and never repeats a line until a pool runs dry. Lines are visual
// only (aria-hidden), like the eyes' quips. Reduced motion keeps her home and quiet; print and no-JS show the
// name's own eyes.
(() => {
  const script = document.currentScript, root = document.documentElement, page = script.dataset.page;
  const brand = document.querySelector('.brand'), header = document.querySelector('.site-header');
  if (!brand || !header || !window.IntersectionObserver) return;
  const name = document.querySelector('.identity-heading h1');
  const letters = name ? [...name.querySelectorAll('.eye-letter')] : [];
  const reduced = () => root.dataset.reduceMotion === 'true';
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const now = () => performance.now();
  const SIZE = 34, W = SIZE * 1.15, H = SIZE * .6, OUT = 1.3; // the pair: two .56em eyes and a .03em gap

  const style = document.createElement('style');
  style.textContent = `.poppy{position:fixed;left:0;top:0;z-index:45;font-size:${SIZE}px;line-height:1;color:#171717;cursor:pointer;opacity:0;visibility:hidden;transition:opacity .25s,visibility 0s .25s}
.poppy.is-out{opacity:1;visibility:visible;transition:opacity .15s}
.poppy .googly-pair{display:flex;animation:poppy-bob 3.4s ease-in-out infinite}
.poppy .googly i{width:.2em;height:.2em}
.poppy.is-flying .googly-pair{animation:none}
.poppy.is-poked .googly-pair{animation:poppy-hop .5s var(--spring)}
.poppy.is-dizzy .googly-pair{animation:poppy-dizzy .9s ease-in-out}
.poppy.is-dozing .googly::after{transform:scaleY(.55);transition-duration:.9s}
.trailer-open .poppy,.trailer-open .poppy-say{visibility:hidden}
@keyframes poppy-bob{50%{translate:0 -2px}}
@keyframes poppy-hop{40%{translate:0 -8px;scale:1.15}}
@keyframes poppy-dizzy{25%{rotate:-14deg}50%{rotate:11deg}75%{rotate:-6deg}}
.poppy-say{position:fixed;left:0;top:0;z-index:46;max-width:min(280px,calc(100vw - 24px));margin:0;padding:.5em .9em;border-radius:14px;background:#171717;color:#fff;font-size:13.5px;font-weight:550;line-height:1.3;letter-spacing:0;pointer-events:none;opacity:0;scale:.7;transition:opacity .18s,scale .35s var(--spring)}
.poppy-say.is-showing{opacity:1;scale:1}
.poppy-say::after{content:'';position:absolute;left:var(--tail,50%);border:6px solid transparent;translate:-50% 0}
.poppy-say.is-below::after{bottom:100%;border-bottom-color:#171717}
.poppy-say.is-above::after{top:100%;border-top-color:#171717}
.eye-letter::before,.eye-pupil{transition:opacity .15s}
.is-poppy-out .eye-letter::before,.is-poppy-out .eye-pupil{opacity:0}
@media print{.poppy,.poppy-say{display:none}.is-poppy-out .eye-letter::before,.is-poppy-out .eye-pupil{opacity:1}}`;
  document.head.append(style);
  const poppy = document.createElement('div'), bubble = document.createElement('p');
  poppy.className = 'poppy'; bubble.className = 'poppy-say';
  poppy.setAttribute('aria-hidden', 'true'); bubble.setAttribute('aria-hidden', 'true');
  poppy.innerHTML = '<span class="googly-pair"><span class="googly"><i></i></span><span class="googly"><i></i></span></span>';
  document.body.append(poppy, bubble);
  const pupils = [...poppy.querySelectorAll('i')];

  // Where she is, where she's going. mode: off, home (docked in the name), homing, perch or sortie.
  let mode = 'off', x = 0, y = 0, s = 1, vx = 0, vy = 0, vs = 0, frame = 0, last = 0, focus = null, atHome = false;
  const top = () => header.getBoundingClientRect().bottom;
  const perch = () => { const b = brand.getBoundingClientRect(); return {x: b.right + 14 + W / 2, y: b.top + b.height / 2, s: 1}; };
  const home = () => {
    const st = getComputedStyle(name), cx = parseFloat(st.getPropertyValue('--eye-cx')) || .2775, cy = parseFloat(st.getPropertyValue('--eye-cy')) || .625;
    const [a, b] = letters.map(l => { const r = l.getBoundingClientRect(), f = parseFloat(getComputedStyle(l).fontSize); return [r.left + cx * f, r.top + cy * f]; });
    return {x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, s: Math.hypot(b[0] - a[0], b[1] - a[1]) / (SIZE * .59)};
  };
  // Beside the thing she's pondering: in the margin past its column when there's room, else just above it.
  const beside = el => {
    const r = el.getBoundingClientRect(), col = (el.closest('.section-width, .container') || el).getBoundingClientRect();
    const w = W * OUT, h = H * OUT, t = top();
    if (r.bottom < t + 30 || r.top > innerHeight - 30) return null;
    const y = Math.min(Math.max(r.top + h, t + h + 18), innerHeight - h - 50);
    if (col.right + 24 + w <= innerWidth - 12) return {x: col.right + 24 + w / 2, y, s: OUT};
    if (col.left - 24 - w >= 12) return {x: col.left - 24 - w / 2, y, s: OUT};
    return {x: innerWidth - w / 2 - 14, y: Math.max(r.top - h / 2 - 10, t + h / 2 + 12), s: OUT};
  };
  const spot = () => mode === 'homing' ? home() : mode === 'sortie' ? beside(focus) || perch() : perch();

  const place = () => {
    const tilt = Math.max(-16, Math.min(16, vx * .025));
    poppy.style.transform = `translate(${x - W / 2}px,${y - H / 2}px) scale(${s}) rotate(${tilt}deg)`;
    if (bubble.classList.contains('is-showing')) placeBubble();
  };
  // A spring toward the spot, slightly underdamped so she overshoots and settles like the rest of the site.
  const tick = t => {
    const dt = Math.min(.032, (t - last) / 1000), to = spot();
    last = t;
    vx += (170 * (to.x - x) - 17 * vx) * dt; vy += (170 * (to.y - y) - 17 * vy) * dt; vs += (170 * (to.s - s) - 17 * vs) * dt;
    x += vx * dt; y += vy * dt; s += vs * dt;
    place(); aim();
    const still = Math.abs(to.x - x) + Math.abs(to.y - y) < .6 && Math.abs(vx) + Math.abs(vy) < 6 && Math.abs(to.s - s) < .004;
    poppy.classList.toggle('is-flying', !still);
    if (still && mode === 'homing') return dock();
    frame = still && mode === 'perch' ? 0 : requestAnimationFrame(tick);
  };
  const run = () => { if (!frame && mode !== 'off' && mode !== 'home') { last = now(); frame = requestAnimationFrame(tick); } };
  const fly = to => { mode = to; run(); };
  const show = () => { poppy.classList.add('is-out'); place(); aim(); };
  const dock = () => {
    cancelAnimationFrame(frame); frame = 0; mode = 'home';
    poppy.classList.remove('is-out', 'is-flying', 'is-dozing'); hush();
    name.classList.remove('is-poppy-out');
  };
  const launch = () => {
    if (mode !== 'home' && mode !== 'homing') return;
    // From the o's when they're on screen; arriving on a page already scrolled past them, she drops onto the perch.
    if (mode === 'home') {
      const from = home(), p = perch();
      ({x, y, s} = from.y > -40 ? from : {x: p.x, y: p.y - 36, s: .4});
      vx = vy = vs = 0; name.classList.add('is-poppy-out'); show();
    }
    fly('perch');
    greet() || (cool('launch', 20000) && fire('launch', null, 1));
  };
  const goHome = () => {
    if (mode === 'off' || mode === 'home') return;
    if (Math.random() < .4 && cool('return', 20000)) fire('return', null, 1);
    fly('homing');
  };

  // Gaze: each pupil looks from its own eye at the pointer, at whatever she was just told to watch, or down
  // the page; up close they cross. Both pupils share one direction otherwise, never the hero's mixed glance.
  let pointer = null, watch = null, watchUntil = 0, aimFrame = 0, dozing = false;
  const aim = () => {
    let tx = innerWidth / 2, ty = innerHeight * .65;
    if (watch && now() < watchUntil && watch.isConnected) { const r = watch.getBoundingClientRect(); tx = r.left + r.width / 2; ty = r.top + Math.min(r.height / 2, 120); }
    else if (pointer) [tx, ty] = pointer;
    if (dozing) { tx = x; ty = y + 400; }
    pupils.forEach((p, i) => {
      const ex = x + (i ? 1 : -1) * SIZE * .295 * s, dx = tx - ex, dy = ty - y, d = Math.hypot(dx, dy) || 1, m = Math.min(1, d / 140) / s;
      p.style.setProperty('--gx', `${(dx / d * m * 3).toFixed(2)}px`);
      p.style.setProperty('--gy', `${(dy / d * m * 3.6).toFixed(2)}px`);
    });
  };
  const aimSoon = () => { if (!aimFrame) aimFrame = requestAnimationFrame(() => { aimFrame = 0; aim(); }); };
  const look = (el, ms = 2600) => { watch = el; watchUntil = now() + ms; aimSoon(); };

  // Speech. Answers to the visitor (pokes, clicks, copying) wait 1.5 seconds since the last line, hovers 4.5,
  // everything else 7; a sortie flies home once the bubble is gone.
  let pools = {}, used = new Set(), lastSaid = -1e9, lastSortie = -1e9, hideTimer = 0;
  try { used = new Set(JSON.parse(sessionStorage.getItem('poppy.used') || '[]')); } catch (_) {}
  const GAP = [7000, 1500, 4500];
  const can = (key, urgency = 0) => pools[key]?.length && mode !== 'off' && mode !== 'home' && !reduced() && !document.hidden && !root.classList.contains('trailer-open') && now() - lastSaid >= GAP[urgency];
  const pick = key => {
    const list = pools[key], fresh = list.filter(l => !used.has(l));
    if (!fresh.length) list.forEach(l => used.delete(l));
    const pool = fresh.length ? fresh : list, line = pool[Math.floor(Math.random() * pool.length)];
    used.add(line);
    try { sessionStorage.setItem('poppy.used', JSON.stringify([...used].slice(-900))); } catch (_) {}
    return line;
  };
  const placeBubble = () => {
    const bw = bubble.offsetWidth, bh = bubble.offsetHeight, half = H * s / 2;
    const below = mode === 'perch' || y - half - bh - 14 < top();
    const left = Math.min(Math.max(x - bw / 2, 10), innerWidth - bw - 10);
    bubble.classList.toggle('is-below', below); bubble.classList.toggle('is-above', !below);
    bubble.style.setProperty('--tail', `${Math.min(Math.max(x - left, 16), bw - 16)}px`);
    bubble.style.translate = `${left}px ${below ? y + half + 10 : y - half - 10 - bh}px`;
  };
  const hush = () => {
    bubble.classList.remove('is-showing');
    if (mode === 'sortie') setTimeout(() => { if (mode === 'sortie' && !bubble.classList.contains('is-showing')) fly('perch'); }, 500);
  };
  // Say a line from a pool. With an element she looks at it, and a click, an opened topic or a section coming
  // into view can send her out beside it, at most every 12 seconds.
  const fire = (key, el, urgency = 0, out = false) => {
    if (!can(key, urgency)) return false;
    const line = pick(key);
    lastSaid = now();
    bubble.textContent = line;
    bubble.classList.add('is-showing');
    placeBubble();
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hush, Math.min(5200, 1700 + line.length * 55));
    if (el) {
      look(el, 3200);
      if (out && mode === 'perch' && now() - lastSortie > 12000 && beside(el)) { focus = el; lastSortie = now(); fly('sortie'); }
    }
    return true;
  };
  const greet = () => {
    try { if (sessionStorage.getItem('poppy.hello')) return false; } catch (_) { return false; }
    const d = new Date(), h = d.getHours(), weekend = d.getDay() % 6 === 0 && Math.random() < .4;
    const key = weekend ? 'hello-weekend' : h < 5 || h >= 22 ? 'hello-night' : h < 12 ? 'hello-morning' : h < 17 ? 'hello-afternoon' : 'hello-evening';
    if (!fire(key, null, 1)) return false;
    try { sessionStorage.setItem('poppy.hello', '1'); } catch (_) {}
    return true;
  };

  // The pools name their moments: seen (the first time it scrolls into view), hover, click, open (a
  // disclosure), play and pause. Pools with no moment are played below by name.
  const hooks = {hover: [], click: [], open: [], play: [], pause: []}, pending = new Map(), done = new Set();
  const seen = new IntersectionObserver(entries => entries.forEach(entry => {
    const key = entry.target.dataset.poppySeen;
    if (entry.isIntersecting) pending.set(key, entry.target); else pending.delete(key);
  }) || trySeen(), {rootMargin: '0px 0px -40% 0px'});
  const trySeen = () => {
    for (const [key, el] of [...pending].reverse()) {
      if (fire(key, el, 0, true)) { done.add(key); pending.delete(key); seen.unobserve(el); }
      return;
    }
  };
  const wire = list => list.forEach(([key, on, sel, lines]) => {
    pools[key] = (pools[key] || []).concat(lines);
    if (on === 'seen') {
      let el = null;
      try { el = document.querySelector(sel); } catch (_) {}
      if (el && !el.dataset.poppySeen) { el.dataset.poppySeen = key; seen.observe(el); }
    } else if (on) hooks[on].push([key, sel]);
  });
  const match = (on, target, each) => hooks[on].forEach(([key, sel]) => {
    let el = null;
    try { el = target.closest?.(sel) || null; } catch (_) {}
    if (el) each(key, el);
  });
  const cooled = {};
  const cool = (key, ms) => { if (now() - (cooled[key] || -1e9) < ms) return false; cooled[key] = now(); return true; };
  const hover = event => match('hover', event.target, (key, el) => { look(el); if (can(key, 2) && cool(key, 25000)) fire(key, el, 2); });
  document.addEventListener('pointerover', event => { if (fine.matches) hover(event); });
  document.addEventListener('focusin', hover);
  document.addEventListener('click', event => match('click', event.target, (key, el) => { if (can(key, 1) && cool(key, 8000)) fire(key, el, 1, true); }), true);
  // On touch there's no pointer to follow, so she looks at whatever was just touched.
  document.addEventListener('pointerdown', event => { if (!fine.matches && event.target.closest) look(event.target.closest('a, button, figure, section') || event.target, 1800); });
  document.addEventListener('toggle', event => { if (event.target.open) match('open', event.target, (key, el) => fire(key, el, 1, true)); }, true);
  ['play', 'pause'].forEach(type => document.addEventListener(type, event => match(type, event.target, (key, el) => {
    const r = el.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight && cool(key, 20000)) fire(key, el, 1);
  }), true));

  // Taste, on the home page: after every third film picked in More like this, a read on the picks.
  const picks = [], kinds = {'your-name': 'animation', 'spirited-away': 'animation', 'spider-verse': 'animation', 'sita-ramam': 'telugu', 'rrr': 'telugu', 'dangal': 'india', 'the-matrix': 'action', 'mad-max': 'action', 'parasite': 'korean'};
  const langs = {'your-name': 'ja', 'spirited-away': 'ja', 'spider-verse': 'en', 'sita-ramam': 'te', 'rrr': 'te', 'dangal': 'hi', 'the-matrix': 'en', 'mad-max': 'en', 'parasite': 'ko'};
  let clicks = [];
  document.addEventListener('click', event => {
    const seed = event.target.closest?.('[data-seed]')?.dataset.seed;
    if (!seed) return;
    clicks = clicks.filter(t => now() - t < 6000).concat(now());
    if (clicks.length >= 5 && cool('picks-rapid', 30000)) { lastSaid = -1e9; fire('picks-rapid', null, 1); return; }
    if (!picks.includes(seed)) picks.push(seed);
    if (picks.length % 3) return;
    const recent = picks.slice(-3), count = kind => recent.filter(p => kinds[p] === kind || (kind === 'india' && kinds[p] === 'telugu') || (kind === 'action' && p === 'rrr')).length;
    const taste = count('telugu') >= 2 ? 'telugu' : count('animation') >= 2 ? 'animation' : count('india') >= 2 ? 'india' : count('action') >= 2 ? 'action' : new Set(recent.map(p => langs[p])).size >= 3 ? 'worldwide' : 'mixed';
    lastSaid = -1e9;
    fire(`taste-${taste}`, document.querySelector('.similar-results'), 1);
  });

  // Always on: input wakes her, speed makes her dizzy, quiet makes her doze, and a quiet visitor who is still
  // reading gets the odd thought of her own.
  let lastInput = now(), lastScroll = 0, idleSaid = false, lastY = scrollY, lastT = now(), fast = 0, readSince = 0, deep = false, pokes = [], shakes = [], lastDir = 0, lastPX = 0;
  const wake = () => {
    lastInput = now(); idleSaid = false;
    if (dozing) { dozing = false; poppy.classList.remove('is-dozing'); lastSaid = -1e9; fire('wake', null, 1); aimSoon(); }
  };
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(type => addEventListener(type, wake, {passive: true}));
  addEventListener('pointermove', event => {
    wake();
    if (!fine.matches || mode === 'off' || mode === 'home') return;
    pointer = [event.clientX, event.clientY]; aimSoon();
    if (Math.hypot(event.clientX - x, event.clientY - y) < 56 && cool('near', 20000)) fire('near', null, 1);
    const dir = Math.sign(event.clientX - lastPX);
    if (dir && dir !== lastDir && Math.abs(event.clientX - lastPX) > 6) { shakes = shakes.filter(t => now() - t < 700).concat(now()); lastDir = dir; }
    lastPX = event.clientX;
    if (shakes.length >= 6 && cool('shake', 20000)) { shakes = []; poppy.classList.add('is-dizzy'); setTimeout(() => poppy.classList.remove('is-dizzy'), 900); fire('shake', null, 1); }
  }, {passive: true});
  addEventListener('scroll', () => {
    wake();
    const t = now(), v = (scrollY - lastY) / Math.max(1, t - lastT) * 1000;
    lastY = scrollY; lastT = t; lastScroll = t;
    if (mode === 'off' || mode === 'home') return;
    aimSoon();
    fast = Math.abs(v) > 3200 ? fast + 1 : 0;
    if (fast > 2 && cool('fling', 15000)) { poppy.classList.add('is-dizzy'); setTimeout(() => poppy.classList.remove('is-dizzy'), 900); fire(v > 0 ? 'scroll-fast-down' : 'scroll-fast-up', null, 1); }
    if (Math.abs(v) < 600) { readSince ||= t; if (t - readSince > 25000 && cool('reading', 180000)) fire('reading'); } else readSince = 0;
    if (innerHeight + scrollY >= root.scrollHeight - 40 && cool('bottom', 600000)) fire('bottom', null, 1);
    if (scrollY < 40 && deep && page !== 'home' && cool('top', 60000)) fire('top', null, 1);
    if (scrollY > 1500) deep = true;
  }, {passive: true});
  poppy.addEventListener('click', () => {
    pokes = pokes.filter(t => now() - t < 6000).concat(now());
    poppy.classList.remove('is-poked'); void poppy.offsetWidth; poppy.classList.add('is-poked');
    lastSaid = -1e9;
    fire(pokes.length >= 4 ? 'poke-many' : 'poke', null, 1);
  });
  poppy.addEventListener('animationend', event => { if (event.animationName === 'poppy-hop') poppy.classList.remove('is-poked'); });
  let left = 0;
  document.addEventListener('mouseout', event => { if (!event.relatedTarget && fine.matches) { left = now(); pointer = null; aimSoon(); if (cool('pointer-leave', 30000)) fire('pointer-leave', null, 1); } });
  document.addEventListener('mouseover', event => { if (!event.relatedTarget && left && now() - left > 2500 && cool('pointer-return', 30000)) fire('pointer-return', null, 1); left = 0; });
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenAt = now();
    else if (hiddenAt && now() - hiddenAt > 4000) { lastSaid = -1e9; fire('away-back', null, 1); }
  });
  let selTimer = 0;
  document.addEventListener('selectionchange', () => {
    clearTimeout(selTimer);
    selTimer = setTimeout(() => { if (String(getSelection()).trim().length >= 15 && cool('select', 30000)) fire('select', null, 1); }, 700);
  });
  document.addEventListener('copy', () => { lastSaid = -1e9; fire('copy', null, 1); });
  let sizeTimer = 0;
  addEventListener('resize', () => { run(); clearTimeout(sizeTimer); sizeTimer = setTimeout(() => { if (cool('resize', 60000)) fire('resize', null, 1); }, 600); });
  new MutationObserver(() => {
    const open = root.classList.contains('trailer-open');
    if (!open && poppy.dataset.trailer) { delete poppy.dataset.trailer; setTimeout(() => { lastSaid = -1e9; fire('trailer-back', null, 1); }, 700); }
    if (open) poppy.dataset.trailer = '1';
  }).observe(root, {attributes: true, attributeFilter: ['class']});
  const blink = () => setTimeout(() => {
    if (!dozing && mode !== 'home') { poppy.classList.add('is-blinking'); setTimeout(() => poppy.classList.remove('is-blinking'), 130); }
    blink();
  }, 2500 + Math.random() * 4500);
  blink();
  const ambient = ['ambient', 'ambient', 'ambient', 'doubt', 'credit', 'boss', 'snack'];
  const started = now();
  setInterval(() => {
    if (mode === 'off' || mode === 'home' || document.hidden) return;
    const quiet = now() - lastInput;
    if (!dozing && quiet > 40000) { dozing = true; poppy.classList.add('is-dozing'); aim(); lastSaid = -1e9; fire('doze', null, 1); }
    else if (dozing) { if (now() - lastSaid > 9000) fire('doze', null, 1); }
    else if (quiet > 12000 && !idleSaid) idleSaid = fire('idle');
    else if (now() - started > 240000 && cool('long-visit', 1e9)) fire('long-visit');
    else if (now() - started > 720000 && cool('very-long-visit', 1e9)) fire('very-long-visit');
    else if (pending.size) trySeen();
    else if (quiet < 15000 && now() - lastScroll > 3000 && now() - lastSaid > 38000) fire(ambient[Math.floor(Math.random() * ambient.length)]);
  }, 2500);

  // Start, and stop for reduced motion: she goes home (or away) at once and keeps quiet.
  const hasHome = name && letters.length === 2;
  let watching = false;
  const start = () => {
    if (reduced()) return;
    if (hasHome) {
      mode = 'home';
      if (watching) { if (!atHome) launch(); return; }
      watching = true;
      new IntersectionObserver(([entry]) => { atHome = entry.isIntersecting; atHome ? goHome() : launch(); }, {rootMargin: `-${header.offsetHeight + 24}px 0px 0px 0px`, threshold: 1}).observe(letters[1]);
      return;
    }
    const p = perch();
    x = p.x; y = p.y - 36; s = .4; vx = vy = vs = 0;
    mode = 'perch'; show(); run();
    setTimeout(() => greet() || (Math.random() < .6 && fire('arrive', null, 1)), 900);
  };
  document.addEventListener('motionchange', () => {
    if (!reduced()) { if (mode === 'off') start(); return; }
    cancelAnimationFrame(frame); frame = 0; hush(); dozing = false;
    poppy.classList.remove('is-out', 'is-dozing', 'is-flying');
    if (name) name.classList.remove('is-poppy-out');
    mode = 'off';
  });
  const load = () => fetch(script.dataset.lines).then(r => r.json()).then(data => { wire(data[page] || []); wire(data['*'] || []); }).catch(() => {});
  (window.requestIdleCallback || (f => setTimeout(f, 1500)))(load, {timeout: 2500});
  start();
})();
