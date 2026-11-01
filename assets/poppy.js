// Poppy, on every page: the googly eyes as a character (after Poppy Li of Mythic Quest, with some of Kalki's
// Bujji). On the home page she lifts out of the name's o's when it scrolls away and perches beside the header's
// name, flying home when it returns; elsewhere she starts on the perch. She watches, blinks, pulls faces and
// ponders the page in a speech bubble, from lines in src/poppy/*.txt (assets/poppy-*.json). Lines are visual
// only; reduced motion keeps her home and quiet. DESIGN_SYSTEM.md (Components, Poppy) has the details.
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
.poppy .googly{transition:scale .4s var(--spring)}
.poppy .googly::after{transition:transform .16s ease}
.poppy .googly::before{content:'';position:absolute;z-index:1;inset:-1px;background:currentColor;transform:scaleY(0);transform-origin:bottom;transition:transform .2s ease}
.x-wink .googly+.googly::after{transform:scaleY(1)}
.x-zoom .googly+.googly{scale:1.4}
.x-zoom .googly:first-child::after,.x-squint .googly::after,.x-side .googly::after{transform:scaleY(.48)}
.x-wide .googly{scale:1.18}
.x-shy .googly{scale:.86}
.x-happy .googly::before{transform:scaleY(.42)}
.x-grumpy .googly::after{transform:scaleY(.44) rotate(16deg)}
.x-grumpy .googly+.googly::after,.x-sad .googly::after{transform:scaleY(.42) rotate(-15deg)}
.x-sad .googly+.googly::after{transform:scaleY(.42) rotate(15deg)}
.x-sleepy .googly::after{transform:scaleY(.62);transition-duration:.6s}
.x-suspicious .googly::after{transform:scaleY(.56)}
.x-boggle .googly:first-child{scale:.8}
.x-boggle .googly+.googly{scale:1.25}
.poppy .googly-pair{transition:rotate .45s var(--spring)}
.x-tilt .googly-pair{rotate:-13deg}
.x-nod .googly-pair{animation:poppy-nod .75s ease-in-out}
.x-no .googly-pair{animation:poppy-no .75s ease-in-out}
.x-bounce .googly-pair{animation:poppy-bounce .85s var(--spring)}
@keyframes poppy-nod{25%,75%{translate:0 4px}50%{translate:0 -1px}}
@keyframes poppy-no{20%,60%{translate:-4px 0}40%,80%{translate:4px 0}}
@keyframes poppy-bounce{20%,60%{translate:0 -8px}40%,80%{translate:0 0}}
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
    if (pose) return pupils.forEach((p, i) => { p.style.setProperty('--gx', `${pose[i][0] * 3}px`); p.style.setProperty('--gy', `${pose[i][1] * 3.6}px`); });
    pupils.forEach((p, i) => {
      const ex = x + (i ? 1 : -1) * SIZE * .295 * s, dx = tx - ex, dy = ty - y, d = Math.hypot(dx, dy) || 1, m = Math.min(1, d / 140) / s;
      p.style.setProperty('--gx', `${(dx / d * m * 3).toFixed(2)}px`);
      p.style.setProperty('--gy', `${(dy / d * m * 3.6).toFixed(2)}px`);
    });
  };
  const aimSoon = () => { if (!aimFrame) aimFrame = requestAnimationFrame(() => { aimFrame = 0; aim(); }); };
  const look = (el, ms = 2600) => { watch = el; watchUntil = now() + ms; aimSoon(); };

  // Faces. Lids, scale and a pupil pose per expression; the roll walks the pupils over the top.
  const POSES = {up: [-.35, -1], side: [1, .1], sad: [0, 1], happy: [0, -.3], shy: [-.6, 1], suspicious: [1, 0], down: [0, 1], sleepy: [0, .6]};
  const ring = [[0, -1], [.7, -.7], [1, 0], [.7, .7], [0, 1], [-.7, .7], [-1, 0], [-.7, -.7]];
  const SEQ = {roll: [[-1, 0], [-.7, -.8], [0, -1], [.7, -.8], [1, 0]], spin: ring.concat(ring)};
  let face = '', pose = null, faceTimer = 0;
  const dizzy = () => { poppy.classList.add('is-dizzy'); setTimeout(() => poppy.classList.remove('is-dizzy'), 900); };
  const hop = () => { poppy.classList.remove('is-poked'); void poppy.offsetWidth; poppy.classList.add('is-poked'); };
  const express = (name, ms = 1800) => {
    if (!name || dozing || mode === 'off' || mode === 'home') return;
    if (name === 'dizzy') return dizzy();
    if (name === 'hop') return hop();
    clearTimeout(faceTimer);
    poppy.classList.remove('x-' + face);
    poppy.classList.add('x-' + name);
    face = name;
    const turn = Math.random() < .5 ? -1 : 1, p = POSES[name];
    const flip = name === 'side' || name === 'suspicious' ? turn : 1;
    pose = name === 'cross' ? [[1, 0], [-1, 0]] : p ? [[p[0] * flip, p[1]], [p[0] * flip, p[1]]] : null;
    if (SEQ[name]) SEQ[name].forEach((q, i) => setTimeout(() => { if (face === name) { pose = [q, q]; aim(); } }, i * (name === 'spin' ? 70 : 120)));
    if (name === 'blink2') [0, 280].forEach(t => setTimeout(() => { poppy.classList.add('is-blinking'); setTimeout(() => poppy.classList.remove('is-blinking'), 120); }, t));
    aim();
    faceTimer = setTimeout(() => { poppy.classList.remove('x-' + name); face = ''; pose = null; aimSoon(); }, ms);
  };
  // A line without a face of its own gets one from its wording.
  const guess = line => /Kidding|Shh|won’t tell|Don’t tell|secret/i.test(line) ? 'wink'
    : /^(Ow|Ouch|Rude|Hey[.!]|Watch it|Excuse|Very mature|Not the face|Stop)/.test(line) ? 'grumpy'
    : /^(Yes|Agreed|Exactly|Correct|Good call|Smart)/.test(line) ? 'nod'
    : /^(No[.!]|Nope|Not that|Don’t|Please don’t)/.test(line) ? 'no'
    : /^(Finally|Yay|Wheee|Woo)|!$/.test(line) && Math.random() < .5 ? 'bounce'
    : /[Ss]uspicious|Hovering|[Ii]nspect|Detective/.test(line) ? 'suspicious'
    : /[Dd]izzy|[Ss]pinning|[Ss]tars/.test(line) ? 'spin'
    : /\?$/.test(line) ? ['zoom', 'up', 'tilt'][Math.floor(Math.random() * 3)]
    : /Interesting|Curious|Hm\b/.test(line) ? 'tilt'
    : /tired|[Ss]leep|[Nn]ap/.test(line) ? 'sleepy'
    : /[Ll]ove|Wow|Perfect|Gorgeous|Yes!|favourite|Finally|Swoon/.test(line) ? 'happy'
    : /^(Whoa|Oh!|Wait|Wheee)/.test(line) ? 'wide'
    : /Hmm|[Pp]onder|[Tt]hinking|wonder/.test(line) ? 'up'
    : /lonely|[Mm]iss you|I’ll miss|sulk/.test(line) ? 'sad'
    : '';

  // Speech. Answers to the visitor (pokes, clicks, copying) wait 1.5 seconds since the last line, hovers 4.5,
  // everything else 7; a sortie flies home once the bubble is gone.
  let pools = {}, faces = {}, used = new Set(), lastSaid = -1e9, lastSortie = -1e9, hideTimer = 0;
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
    let tag = '', line = pick(key).replace(/\s*\{([a-z]+)\}$/, (_, t) => { tag = t; return ''; });
    const ms = Math.min(5200, 1700 + line.length * 55);
    lastSaid = now();
    bubble.textContent = line;
    bubble.classList.add('is-showing');
    placeBubble();
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hush, ms);
    express(tag || faces[key] || guess(line), ms);
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
  const hooks = {hover: [], click: [], open: [], play: [], pause: []}, pending = new Map(), done = new Set(), seenAt = {};
  const seen = new IntersectionObserver(entries => entries.forEach(entry => {
    const key = entry.target.dataset.poppySeen;
    if (!entry.isIntersecting) pending.delete(key);
    else if (!done.has(key)) pending.set(key, entry.target);
    else if (now() - seenAt[key] > 90000 && cool('revisit', 60000)) fire('revisit', entry.target, 0, true);
  }) || trySeen(), {rootMargin: '0px 0px -40% 0px'});
  const trySeen = () => {
    for (const [key, el] of [...pending].reverse()) {
      if (fire(key, el, 0, true)) { done.add(key); seenAt[key] = now(); pending.delete(key); }
      return;
    }
  };
  const wire = list => list.forEach(([key, on, sel, lines, look]) => {
    pools[key] = (pools[key] || []).concat(lines);
    if (look && !faces[key]) faces[key] = look;
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
    if (shakes.length >= 6 && cool('shake', 20000)) { shakes = []; dizzy(); fire('shake', null, 1); }
  }, {passive: true});
  addEventListener('scroll', () => {
    wake();
    const t = now(), v = (scrollY - lastY) / Math.max(1, t - lastT) * 1000;
    lastY = scrollY; lastT = t; lastScroll = t;
    if (mode === 'off' || mode === 'home') return;
    aimSoon();
    fast = Math.abs(v) > 3200 ? fast + 1 : 0;
    if (fast > 2 && cool('fling', 15000)) { dizzy(); fire(v > 0 ? 'scroll-fast-down' : 'scroll-fast-up', null, 1); }
    if (Math.abs(v) < 600) { readSince ||= t; if (t - readSince > 25000 && cool('reading', 180000)) fire('reading'); } else readSince = 0;
    if (innerHeight + scrollY >= root.scrollHeight - 40 && cool('bottom', 600000)) fire('bottom', null, 1);
    if (scrollY < 40 && deep && page !== 'home' && cool('top', 60000)) fire('top', null, 1);
    if (scrollY > 1500) deep = true;
  }, {passive: true});
  poppy.addEventListener('click', () => {
    pokes = pokes.filter(t => now() - t < 6000).concat(now());
    hop();
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
  addEventListener('keydown', event => {
    if (event.key === 'Tab') { if (cool('keyboard', 600000)) fire('keyboard', null, 1); }
    else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') { if (cool('find', 60000)) fire('find', null, 1); }
    else if (event.key === 'Escape' && !root.classList.contains('trailer-open') && cool('escape', 30000)) fire('escape', null, 1);
  });
  document.addEventListener('contextmenu', () => { if (cool('right-click', 60000)) fire('right-click', null, 1); });
  document.addEventListener('dblclick', event => { if (!event.target.closest?.('a, button, input, summary, .poppy') && cool('double-click', 30000)) fire('double-click', null, 1); });
  let empties = [];
  document.addEventListener('click', event => {
    if (event.target.closest?.('a, button, summary, input, label, video, img, figure, details, [data-seed], .poppy')) return;
    empties = empties.filter(t => now() - t < 4000).concat(now());
    if (empties.length >= 3 && cool('click-empty', 30000)) { empties = []; fire('click-empty', null, 1); }
  });
  addEventListener('hashchange', () => { let el = null; try { el = document.querySelector(location.hash); } catch (_) {} if (cool('jump', 15000)) fire('jump', el, 1); });
  addEventListener('pageshow', event => { if (event.persisted) { lastSaid = -1e9; fire('back-forward', null, 1); } });
  addEventListener('offline', () => { lastSaid = -1e9; fire('offline', null, 1); });
  addEventListener('online', () => { lastSaid = -1e9; fire('online', null, 1); });
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
  const IDLE = ['wink', 'zoom', 'up', 'side', 'squint', 'happy', 'roll', 'cross', 'nod', 'tilt', 'boggle', 'blink2', 'spin', 'suspicious', 'bounce', 'down'];
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
    if (!dozing && !face && !bubble.classList.contains('is-showing') && Math.random() < .07) express(IDLE[Math.floor(Math.random() * IDLE.length)], 1400);
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
  const get = url => url ? fetch(url).then(r => r.json()) : Promise.resolve([]);
  const load = () => Promise.all([get(script.dataset.pageLines), get(script.dataset.lines)]).then(([mine, all]) => { wire(mine); wire(all); }).catch(() => {});
  (window.requestIdleCallback || (f => setTimeout(f, 1500)))(load, {timeout: 2500});
  start();
})();
