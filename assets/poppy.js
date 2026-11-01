// Poppy, on every page: the googly eyes as a character (after Poppy Li of Mythic Quest, with some of Kalki's
// Bujji). On the home page she lives in the name's o's and talks from there, and lifts out when the name
// scrolls away to perch beside the header's name, flying home when it returns; elsewhere she starts on the
// perch. A Tag along switch beside the header's name lets her follow the visitor down the page. She watches, blinks, pulls faces and ponders the page in a speech
// bubble, from lines in src/poppy/*.txt (assets/poppy-*.json). Lines are visual only; reduced motion keeps her
// home and quiet. DESIGN_SYSTEM.md (Components, Poppy) has the details.
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
.poppy.is-visiting{pointer-events:none}
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
.poppy-say.is-new{animation:poppy-pop .32s var(--spring)}
@keyframes poppy-pop{from{scale:.86}}
.poppy-say::after{content:'';position:absolute;left:var(--tail,50%);border:6px solid transparent;translate:-50% 0}
.poppy-say.is-below::after{bottom:100%;border-bottom-color:#171717}
.poppy-say.is-above::after{top:100%;border-top-color:#171717}
.eye-letter::before,.eye-pupil{transition:opacity .15s}
.is-poppy-out .eye-letter::before,.is-poppy-out .eye-pupil{opacity:0}
.poppy-follow{display:inline-flex;align-items:center;gap:8px;min-height:44px;margin:0 auto 0 -14px;padding:0;background:none;border:0;font-size:13px;color:var(--muted);white-space:nowrap}
.poppy-follow:hover,.poppy-follow[aria-pressed="true"]{color:var(--ink)}
.poppy-switch{position:relative;display:block;width:30px;height:17px;border:1px solid currentColor;border-radius:9px;transition:background .25s,border-color .25s}
.poppy-switch .googly{position:absolute;left:1px;top:1px;font-size:23px;color:var(--ink);transition:translate .4s var(--spring)}
.poppy-switch .googly i{--gx:-2px;--gy:1px}
.poppy-follow[aria-pressed="true"] .poppy-switch{background:var(--ink);border-color:var(--ink)}
.poppy-follow[aria-pressed="true"] .poppy-switch .googly{translate:13px 0}
.poppy-follow[aria-pressed="true"] .poppy-switch .googly i{--gx:2px;--gy:-1px}
@media(max-width:560px){.poppy-follow{margin-left:14px}}
@media(min-width:561px) and (max-width:640px){.poppy-follow-label{display:none}}
@media print{.poppy,.poppy-say{display:none}.is-poppy-out .eye-letter::before,.is-poppy-out .eye-pupil{opacity:1}}`;
  document.head.append(style);
  const poppy = document.createElement('div'), bubble = document.createElement('p');
  poppy.className = 'poppy'; bubble.className = 'poppy-say';
  poppy.setAttribute('aria-hidden', 'true'); bubble.setAttribute('aria-hidden', 'true');
  poppy.innerHTML = '<span class="googly-pair"><span class="googly"><i></i></span><span class="googly"><i></i></span></span>';
  document.body.append(poppy, bubble);
  const pupils = [...poppy.querySelectorAll('i')];
  // Tag along. Off (the default) she keeps to the name or her perch just past this switch and comments from
  // there; on, she goes out beside whatever she's talking about. The choice is kept for next time.
  let follow = false;
  try { follow = localStorage.getItem('poppy.follow') === '1'; } catch (_) {}
  const toggle = document.createElement('button');
  toggle.type = 'button'; toggle.className = 'poppy-follow'; toggle.hidden = true; toggle.setAttribute('aria-pressed', follow);
  toggle.innerHTML = '<span class="poppy-switch" aria-hidden="true"><span class="googly"><i></i></span></span><span class="poppy-follow-label">Tag along</span>';
  brand.after(toggle);
  toggle.addEventListener('click', () => {
    follow = !follow; toggle.setAttribute('aria-pressed', follow);
    try { localStorage.setItem('poppy.follow', follow ? '1' : '0'); } catch (_) {}
    if (!follow && mode === 'sortie') fly(atHome ? 'homing' : 'perch');
    say(follow ? 'follow-on' : 'follow-off', null, 3);
  });

  // Where she is, where she's going. mode: off, home (docked in the name), homing, perch or sortie: out beside
  // a section she's pondering, staying while it's in view, or close above something the visitor points at,
  // for one line.
  let mode = 'off', x = 0, y = 0, s = 1, vx = 0, vy = 0, vs = 0, frame = 0, last = 0, focus = null, close = false, atHome = false;
  const top = () => header.getBoundingClientRect().bottom;
  const perch = () => { const b = (toggle.offsetParent ? toggle : brand).getBoundingClientRect(); return {x: b.right + 14 + W / 2, y: b.top + b.height / 2, s: 1}; };
  const home = () => {
    const st = getComputedStyle(name), cx = parseFloat(st.getPropertyValue('--eye-cx')) || .2775, cy = parseFloat(st.getPropertyValue('--eye-cy')) || .625;
    const [a, b] = letters.map(l => { const r = l.getBoundingClientRect(), f = parseFloat(getComputedStyle(l).fontSize); return [r.left + cx * f, r.top + cy * f]; });
    return {x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, s: Math.hypot(b[0] - a[0], b[1] - a[1]) / (SIZE * .59)};
  };
  // Beside the thing she's pondering: in the margin past its column when there's room, else just above it.
  const beside = el => {
    const r = el.getBoundingClientRect(), col = (el.closest('.section-width, .container') || el).getBoundingClientRect();
    const w = W * OUT, h = H * OUT, t = top(), low = innerHeight - h - 50;
    if (r.bottom < t + 30 || r.top > innerHeight - 30) return null;
    const y = Math.min(Math.max(r.top + h, t + h + 18), low);
    if (col.right + 24 + w <= innerWidth - 12) return {x: col.right + 24 + w / 2, y, s: OUT};
    if (col.left - 24 - w >= 12) return {x: col.left - 24 - w / 2, y, s: OUT};
    return {x: innerWidth - w / 2 - 14, y: Math.min(Math.max(r.top - h / 2 - 10, t + h / 2 + 12), low), s: OUT};
  };
  // Close above the thing the visitor points at, by its right end, kept clear of the header.
  const near = el => {
    const r = el.getBoundingClientRect(), t = top();
    if (r.bottom < t + 10 || r.top > innerHeight - 10) return null;
    return {x: Math.min(Math.max(r.right - W / 2 - 6, W / 2 + 12), innerWidth - W / 2 - 12), y: Math.min(Math.max(r.top - H / 2 - 8, t + H / 2 + 8), innerHeight - H / 2 - 12), s: 1};
  };
  const spot = () => {
    if (mode === 'sortie') { const at = focus?.isConnected && (close ? near(focus) : beside(focus)); if (at) return at; mode = atHome ? 'homing' : 'perch'; }
    return mode === 'homing' ? home() : perch();
  };

  const place = () => {
    const tilt = Math.max(-16, Math.min(16, vx * .025));
    poppy.style.transform = `translate(${x - W / 2}px,${y - H / 2}px) scale(${s}) rotate(${tilt}deg)`;
    if (showing()) placeBubble();
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
    poppy.classList.toggle('is-visiting', mode === 'sortie' && close);
    // Home, she finishes her sentence before settling into the name.
    if (still && mode === 'homing' && !showing()) return dock();
    frame = still && mode === 'perch' ? 0 : requestAnimationFrame(tick);
  };
  const run = () => { if (!frame && mode !== 'off' && mode !== 'home') { last = now(); frame = requestAnimationFrame(tick); } };
  const fly = to => { mode = to; run(); };
  const show = () => { poppy.classList.add('is-out'); place(); aim(); };
  const dock = () => {
    cancelAnimationFrame(frame); frame = 0; mode = 'home'; dozing = false;
    poppy.classList.remove('is-out', 'is-flying', 'is-dozing', 'is-visiting'); hush();
    name.classList.remove('is-poppy-out');
  };
  const leave = () => { ({x, y, s} = home()); vx = vy = vs = 0; name.classList.add('is-poppy-out'); show(); };
  const launch = () => {
    if (mode !== 'home' && mode !== 'homing') return;
    // From the o's when they're on screen; arriving on a page already scrolled past them, she drops onto the perch.
    if (mode === 'home') {
      const p = perch();
      leave();
      if (y < -40) { x = p.x; y = p.y - 36; s = .4; }
    }
    fly('perch');
    if (!greet() && Math.random() < .7) once('launch', 6000, 'launch');
  };
  const goHome = () => {
    if (mode === 'off' || mode === 'home') return;
    if (Math.random() < .7) once('return', 6000, 'return');
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

  // Speech. She answers what the visitor does as it happens. A line holds the bubble until it has been read
  // (half a second plus 40 ms a character, at most 2.2 seconds), then the next thing may take it; something
  // more pressing waits at most 0.7 seconds, the next section while the page is still scrolling 0.9, a poke or
  // a copy 0.3, and a line whose subject has gone (the pointer moved on, the section scrolled away) only 0.4. A line that has to wait queues and is dropped if
  // it's stale by then. Docked in the name she speaks from the o's; with nothing happening she ponders what's
  // in view, two and a half seconds after her last line ends.
  const CHAT = 2500;
  let pools = {}, faces = {}, used = new Set(), lastSaid = -1e9, lastEnd = -1e9, cur = null, queued = null, hideTimer = 0, flushTimer = 0, flushAt = 0;
  try { used = new Set(JSON.parse(sessionStorage.getItem('poppy.used') || '[]')); } catch (_) {}
  const showing = () => bubble.classList.contains('is-showing');
  const able = key => pools[key]?.length && mode !== 'off' && !reduced() && !document.hidden && !root.classList.contains('trailer-open') && !(mode === 'home' && document.querySelector('.eye-quip.is-showing'));
  // Priority: 0 a thought of her own, 1 something coming into view, 2 something the visitor did, 3 a direct answer.
  const wait = pri => {
    if (!showing()) return pri ? 0 : lastEnd + CHAT - now();
    if (!pri) return Infinity;
    const skim = pri === 1 && cur.pri === 1 && now() - lastScroll < 400;
    return (pri > 2 ? 300 : !cur.ok() ? 400 : pri > cur.pri || skim ? Math.min(cur.hold, pri > cur.pri ? 700 : 900) : cur.hold) - (now() - cur.at);
  };
  const pick = key => {
    const list = pools[key], fresh = list.filter(l => !used.has(l));
    if (!fresh.length) list.forEach(l => used.delete(l));
    const pool = fresh.length ? fresh : list, line = pool[Math.floor(Math.random() * pool.length)];
    used.add(line);
    try { sessionStorage.setItem('poppy.used', JSON.stringify([...used].slice(-900))); } catch (_) {}
    return line;
  };
  // Docked, the bubble clears the letters' cap height, where the name's own quips appear.
  const placeBubble = () => {
    const at = mode === 'home' ? home() : {x, y, s};
    const bw = bubble.offsetWidth, bh = bubble.offsetHeight, half = mode === 'home' ? parseFloat(getComputedStyle(letters[0]).fontSize) * .45 : H * at.s / 2;
    const below = mode === 'perch' || at.y - half - bh - 14 < top() - (mode === 'home' ? 8 : 0);
    const left = Math.min(Math.max(at.x - bw / 2, 10), innerWidth - bw - 10);
    bubble.classList.toggle('is-below', below); bubble.classList.toggle('is-above', !below);
    bubble.style.setProperty('--tail', `${Math.min(Math.max(at.x - left, 16), bw - 16)}px`);
    bubble.style.translate = `${left}px ${below ? at.y + half + 10 : at.y - half - 10 - bh}px`;
  };
  const hush = () => {
    clearTimeout(hideTimer);
    if (showing()) lastEnd = now();
    bubble.classList.remove('is-showing'); cur = null;
    // A close look ends with its line: back to the name or the perch.
    if (mode === 'sortie' && close) setTimeout(() => { if (mode === 'sortie' && close && !showing()) fly(atHome ? 'homing' : 'perch'); }, 350);
    flush();
  };
  // Tagging along, out to something: close above it for a line (hopping out of the name if need be), or beside
  // it in the margin while it's in view.
  const go = (el, closeBy) => {
    if (!follow || mode === 'home' && !closeBy || !(closeBy ? near(el) : beside(el))) return;
    focus = el; close = closeBy;
    if (mode === 'home') leave();
    fly('sortie');
  };
  const speak = (key, el, pri, visit, ok) => {
    let tag = '', line = pick(key).replace(/\s*\{([a-z]+)\}$/, (_, t) => { tag = t; return ''; });
    const ms = Math.min(5200, 1700 + line.length * 55), again = showing();
    lastSaid = now(); cur = {pri, ok, at: lastSaid, hold: Math.min(2200, 500 + line.length * 40)};
    if (el && visit) go(el, visit === 'near');
    bubble.textContent = line;
    bubble.classList.remove('is-new');
    if (again) { void bubble.offsetWidth; bubble.classList.add('is-new'); }
    bubble.classList.add('is-showing');
    placeBubble();
    hideTimer = setTimeout(hush, ms);
    express(tag || faces[key] || guess(line), ms);
    // She looks at what she's talking about, reading its figures or bars one by one.
    if (el) {
      look(el, 3200);
      const marks = [...el.querySelectorAll('.bar-row strong, .project-highlights dt, .results-table tbody tr')].slice(0, 6);
      if (marks.length > 1) marks.forEach((m, i) => setTimeout(() => look(m, 1000), 350 + i * 450));
    }
  };
  // Say a line from a pool now, or queue it; ok() says whether it's still worth saying, and worth finishing.
  const say = (key, el = null, pri = 2, visit = '', ok = null, at = now()) => {
    if (!able(key)) return false;
    ok ||= () => !el || onScreen(el);
    const ms = wait(pri);
    if (ms <= 0) { clearTimeout(hideTimer); speak(key, el, pri, visit, ok); return true; }
    if (ms === Infinity || queued && queued.pri > pri) return false;
    queued = {key, el, pri, visit, ok, at}; later(ms);
    return true;
  };
  const later = ms => {
    if (flushTimer && flushAt <= now() + ms) return;
    clearTimeout(flushTimer); flushAt = now() + ms;
    flushTimer = setTimeout(() => { flushTimer = 0; flush(); }, ms);
  };
  const flush = () => {
    const q = queued; queued = null;
    if (q && now() - q.at < 5000 && q.ok()) say(q.key, q.el, q.pri, q.visit, q.ok, q.at);
    if (!queued) trySeen();
  };
  // A cooldown starts only when its line is said or queued, so a busy moment never loses it.
  const cooled = {};
  const once = (ck, ms, key, el = null, pri = 2, visit = '') => {
    if (now() - (cooled[ck] || -1e9) < ms || !say(key, el, pri, visit)) return false;
    cooled[ck] = now(); return true;
  };
  const hello = () => greet() || say('arrive');
  const greet = () => {
    try { if (sessionStorage.getItem('poppy.hello')) return false; } catch (_) { return false; }
    const d = new Date(), h = d.getHours(), weekend = d.getDay() % 6 === 0 && Math.random() < .4;
    const key = weekend ? 'hello-weekend' : h < 5 || h >= 22 ? 'hello-night' : h < 12 ? 'hello-morning' : h < 17 ? 'hello-afternoon' : 'hello-evening';
    if (!say(key)) return false;
    try { sessionStorage.setItem('poppy.hello', '1'); } catch (_) {}
    return true;
  };

  // The pools name their moments: seen (when it reaches the middle of the screen), hover, click, open (a
  // disclosure), play and pause. Pools with no moment are played below by name.
  const hooks = {hover: [], click: [], open: [], play: [], pause: []}, pending = new Map(), done = new Set(), seenAt = {}, watched = [];
  const seen = new IntersectionObserver(entries => entries.forEach(entry => {
    const key = entry.target.dataset.poppySeen;
    if (!entry.isIntersecting) pending.delete(key);
    else if (!done.has(key)) pending.set(key, entry.target);
    else if (now() - seenAt[key] > 90000) once('revisit', 20000, 'revisit', entry.target, 1, 'beside');
  }) || trySeen(), {rootMargin: '-35% 0px -35% 0px'});
  const onScreen = el => { const r = el.getBoundingClientRect(); return r.bottom > top() && r.top < innerHeight; };
  // Seen means its top has come up to the middle of the view below the header, or it's anywhere on screen
  // once the page is at its bottom (the last screen never gets that far). Nothing counts mid-flick. Something
  // scrolled past before its turn is dropped, and said if it comes back.
  const bottom = () => innerHeight + scrollY >= root.scrollHeight - 40;
  const central = el => { const r = el.getBoundingClientRect(); return r.top < (top() + innerHeight) / 2 + 24 && r.bottom > innerHeight * .3 || bottom() && onScreen(el); };
  // The newest arrival speaks first; the others keep while they're still in the middle band.
  const trySeen = () => {
    if (now() - lastScroll < 150 && Math.abs(scrollV) > 1800) return later(200);
    for (const [key, el] of [...pending].reverse()) {
      if (!onScreen(el)) { pending.delete(key); continue; }
      if (!central(el) || !able(key)) continue;
      const ms = wait(1);
      if (ms > 0) return ms < Infinity && later(ms);
      clearTimeout(hideTimer); speak(key, el, 1, 'beside', () => onScreen(el));
      done.add(key); seenAt[key] = now(); pending.delete(key);
      return;
    }
  };
  // The last screen of a page never reaches the reading line, so at the bottom whatever is in view counts.
  const sweep = () => watched.forEach(el => { if (!done.has(el.dataset.poppySeen) && onScreen(el)) pending.set(el.dataset.poppySeen, el); });
  const wire = list => list.forEach(([key, on, sel, lines, look]) => {
    pools[key] = (pools[key] || []).concat(lines);
    if (look && !faces[key]) faces[key] = look;
    if (on === 'seen') {
      let el = null;
      try { el = document.querySelector(sel); } catch (_) {}
      if (el && !el.dataset.poppySeen) { el.dataset.poppySeen = key; watched.push(el); seen.observe(el); }
    } else if (on) hooks[on].push([key, sel]);
  });
  // The hook nearest the target wins: a figure before the panel it sits in, and among equals the page's own
  // lines before the shared ones.
  const find = (on, target) => {
    let best = [];
    for (const [key, sel] of hooks[on]) {
      let el = null;
      try { el = target.closest?.(sel) || null; } catch (_) {}
      if (el && (!best[1] || best[1] !== el && best[1].contains(el))) best = [key, el];
    }
    return best;
  };
  // She reads the pointer's heading a tenth of a second ahead: when it slows toward something she has a line
  // for, her eyes get there first, and the line comes the moment it lands. Any other hover counts after 0.15
  // seconds at rest, so passing over things on the way stays quiet. She hops over and says it there; the same
  // thing again within three seconds gets a look, not a line.
  let hoverEl = null, hoverTimer = 0, coming = null, px = 0, py = 0, pt = 0, speed = 0;
  const heard = new WeakMap();
  const fresh = (el, ms) => now() - (heard.get(el) || -1e9) > ms;
  const hover = (target, delay) => {
    const [key, el] = find('hover', target);
    if (el === hoverEl) return;
    hoverEl = el; clearTimeout(hoverTimer);
    if (el) hoverTimer = setTimeout(() => {
      look(el);
      if (fresh(el, 3000) && say(key, el, 2, 'near', () => hoverEl === el)) heard.set(el, now());
    }, el === coming ? 0 : delay);
  };
  const ahead = event => {
    const t = now(), dt = t - pt;
    if (dt < 40) return;
    const v = Math.hypot(event.clientX - px, event.clientY - py) / dt;
    const fx = event.clientX + (event.clientX - px) / dt * 100, fy = event.clientY + (event.clientY - py) / dt * 100;
    px = event.clientX; py = event.clientY; pt = t;
    const slowing = v < speed * .85 || v < .25;
    speed = v;
    if (!slowing || dt > 200) return;
    const el = find('hover', document.elementFromPoint(Math.max(0, Math.min(innerWidth - 1, fx)), Math.max(0, Math.min(innerHeight - 1, fy))) || root)[1];
    if (el && el !== hoverEl && el !== coming) { coming = el; look(el, 900); }
  };
  document.addEventListener('pointerover', event => { if (fine.matches) hover(event.target, 150); });
  document.addEventListener('focusin', event => hover(event.target, 0));
  // A click speaks as the button goes down, not up; keys and taps speak on the click itself.
  const clicked = target => {
    const [key, el] = find('click', target);
    if (el && fresh(el, 1500) && say(key, el, 2, 'near')) heard.set(el, now());
  };
  document.addEventListener('pointerdown', event => { if (event.pointerType === 'mouse' && !event.button) clicked(event.target); }, true);
  document.addEventListener('click', event => clicked(event.target), true);
  // On touch there's no pointer to follow, so she looks at whatever was just touched, and tapping something
  // that isn't a link or a click moment is the closest thing to hovering it.
  document.addEventListener('pointerdown', event => {
    if (fine.matches || !event.target.closest) return;
    look(event.target.closest('a, button, figure, section') || event.target, 1800);
    if (event.target.closest('a[href]:not([href^="#"])') || find('click', event.target)[1]) return;
    hoverEl = null; hover(event.target, 0);
  });
  document.addEventListener('toggle', event => { const [key, el] = event.target.open ? find('open', event.target) : []; if (el) say(key, el, 2, 'beside'); }, true);
  ['play', 'pause'].forEach(type => document.addEventListener(type, event => { const [key, el] = find(type, event.target); if (el && onScreen(el)) once(key, 4000, key, el); }, true));

  // Taste, on the home page: after every third film picked in More like this, a read on the picks.
  const picks = [], kinds = {'your-name': 'animation', 'spirited-away': 'animation', 'spider-verse': 'animation', 'sita-ramam': 'telugu', 'rrr': 'telugu', 'dangal': 'india', 'the-matrix': 'action', 'mad-max': 'action', 'parasite': 'korean'};
  const langs = {'your-name': 'ja', 'spirited-away': 'ja', 'spider-verse': 'en', 'sita-ramam': 'te', 'rrr': 'te', 'dangal': 'hi', 'the-matrix': 'en', 'mad-max': 'en', 'parasite': 'ko'};
  let clicks = [];
  document.addEventListener('click', event => {
    const seed = event.target.closest?.('[data-seed]')?.dataset.seed;
    if (!seed) return;
    clicks = clicks.filter(t => now() - t < 6000).concat(now());
    if (clicks.length >= 5 && once('picks-rapid', 30000, 'picks-rapid', null, 3)) return;
    if (!picks.includes(seed)) picks.push(seed);
    if (picks.length % 3) return;
    const recent = picks.slice(-3), count = kind => recent.filter(p => kinds[p] === kind || (kind === 'india' && kinds[p] === 'telugu') || (kind === 'action' && p === 'rrr')).length;
    const taste = count('telugu') >= 2 ? 'telugu' : count('animation') >= 2 ? 'animation' : count('india') >= 2 ? 'india' : count('action') >= 2 ? 'action' : new Set(recent.map(p => langs[p])).size >= 3 ? 'worldwide' : 'mixed';
    say(`taste-${taste}`, document.querySelector('.similar-results'));
  });

  // Always on: input wakes her, a quick scroll gets a compliment and a fling makes her dizzy, quiet makes her doze, and a visitor who is still
  // reading hears her ponder.
  let lastInput = now(), lastScroll = 0, scrollV = 0, idleSaid = false, lastY = scrollY, lastT = now(), fast = 0, quick = 0, readSince = 0, deep = false, pokes = [], shakes = [], lastDir = 0, lastPX = 0;
  const wake = () => {
    lastInput = now(); idleSaid = false;
    if (dozing) { dozing = false; poppy.classList.remove('is-dozing'); say('wake', null, 3); aimSoon(); }
  };
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(type => addEventListener(type, wake, {passive: true}));
  addEventListener('pointermove', event => {
    wake();
    if (!fine.matches || mode === 'off') return;
    ahead(event);
    if (mode === 'home') return;
    pointer = [event.clientX, event.clientY]; aimSoon();
    if (Math.hypot(event.clientX - x, event.clientY - y) < 56 && !(mode === 'sortie' && close)) once('near', 8000, 'near');
    const dir = Math.sign(event.clientX - lastPX);
    if (dir && dir !== lastDir && Math.abs(event.clientX - lastPX) > 6) { shakes = shakes.filter(t => now() - t < 700).concat(now()); lastDir = dir; }
    lastPX = event.clientX;
    if (shakes.length >= 6 && once('shake', 8000, 'shake')) { shakes = []; dizzy(); }
  }, {passive: true});
  addEventListener('scroll', () => {
    wake();
    const t = now(), v = (scrollY - lastY) / Math.max(1, t - lastT) * 1000;
    lastY = scrollY; lastT = t; lastScroll = t; scrollV = v;
    if (pending.size) trySeen();
    if (mode === 'home' && showing()) placeBubble();
    if (mode === 'off' || mode === 'home') return;
    aimSoon();
    fast = Math.abs(v) > 3200 ? fast + 1 : 0;
    quick = Math.abs(v) > 1500 ? quick + 1 : 0;
    if (fast > 2 && once('fling', 6000, v > 0 ? 'scroll-fast-down' : 'scroll-fast-up')) { dizzy(); cooled.quick = now(); }
    else if (quick > 3 && !fast) once('quick', 7000, v > 0 ? 'scroll-quick' : 'scroll-quick-up');
    if (Math.abs(v) < 600) { readSince ||= t; if (t - readSince > 25000) once('reading', 90000, 'reading', null, 0); } else readSince = 0;
    if (bottom()) { sweep(); trySeen(); once('bottom', 60000, 'bottom', null, 1); }
    if (scrollY < 40 && deep && page !== 'home') once('top', 20000, 'top');
    if (scrollY > 1500) deep = true;
  }, {passive: true});
  poppy.addEventListener('click', () => {
    pokes = pokes.filter(t => now() - t < 6000).concat(now());
    hop();
    say(pokes.length >= 4 ? 'poke-many' : 'poke', null, 3);
  });
  poppy.addEventListener('animationend', event => { if (event.animationName === 'poppy-hop') poppy.classList.remove('is-poked'); });
  // The name's own quips (app.js) speak from the same spot, so docked she gives way to them.
  document.addEventListener('animationstart', event => { if (mode === 'home' && showing() && event.target.classList?.contains('eye-quip')) hush(); });
  let left = 0;
  document.addEventListener('mouseout', event => { if (!event.relatedTarget && fine.matches) { left = now(); pointer = null; aimSoon(); once('pointer-leave', 8000, 'pointer-leave'); } });
  document.addEventListener('mouseover', event => { if (!event.relatedTarget && left && now() - left > 2500) once('pointer-return', 8000, 'pointer-return'); left = 0; });
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenAt = now();
    else if (hiddenAt && now() - hiddenAt > 4000) say('away-back', null, 3);
  });
  let selTimer = 0;
  document.addEventListener('selectionchange', () => {
    clearTimeout(selTimer);
    selTimer = setTimeout(() => { if (String(getSelection()).trim().length >= 15) once('select', 8000, 'select'); }, 700);
  });
  document.addEventListener('copy', () => say('copy', null, 3));
  addEventListener('keydown', event => {
    if (event.key === 'Tab') once('keyboard', 120000, 'keyboard');
    else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') once('find', 20000, 'find');
    else if (event.key === 'Escape' && !root.classList.contains('trailer-open')) once('escape', 10000, 'escape');
  });
  document.addEventListener('contextmenu', () => once('right-click', 15000, 'right-click'));
  document.addEventListener('dblclick', event => { if (!event.target.closest?.('a, button, input, summary, .poppy')) once('double-click', 10000, 'double-click'); });
  let empties = [];
  document.addEventListener('click', event => {
    if (event.target.closest?.('a, button, summary, input, label, video, img, figure, details, [data-seed], .poppy')) return;
    empties = empties.filter(t => now() - t < 4000).concat(now());
    if (empties.length >= 3 && once('click-empty', 10000, 'click-empty')) empties = [];
  });
  addEventListener('hashchange', () => { let el = null; try { el = document.querySelector(location.hash); } catch (_) {} once('jump', 4000, 'jump', el); });
  addEventListener('pageshow', event => { if (event.persisted) say('back-forward', null, 3); });
  addEventListener('offline', () => say('offline', null, 3));
  addEventListener('online', () => say('online', null, 3));
  let sizeTimer = 0;
  addEventListener('resize', () => { run(); clearTimeout(sizeTimer); sizeTimer = setTimeout(() => once('resize', 15000, 'resize'), 600); });
  new MutationObserver(() => {
    const open = root.classList.contains('trailer-open');
    if (!open && poppy.dataset.trailer) { delete poppy.dataset.trailer; setTimeout(() => say('trailer-back', null, 3), 700); }
    if (open) poppy.dataset.trailer = '1';
  }).observe(root, {attributes: true, attributeFilter: ['class']});
  const blink = () => setTimeout(() => {
    if (!dozing && mode !== 'home') { poppy.classList.add('is-blinking'); setTimeout(() => poppy.classList.remove('is-blinking'), 130); }
    blink();
  }, 2500 + Math.random() * 4500);
  blink();
  // Pondering: another thought on the part of the page in view that she has already remarked on, while its
  // pool lasts, and now and then something of her own.
  const ambient = ['ambient', 'ambient', 'ambient', 'doubt', 'credit', 'boss', 'snack'];
  const thought = {};
  const ponder = () => {
    if (wait(0) > 0) return;
    const mid = innerHeight / 2, gap = r => r.top > mid ? r.top - mid : r.bottom < mid ? mid - r.bottom : 0;
    let best = null, score = innerHeight * .3;
    for (const el of watched) {
      if (!done.has(el.dataset.poppySeen)) continue;
      const g = gap((el.closest('section') || el).getBoundingClientRect()) * 2 + gap(el.getBoundingClientRect()) * .1;
      if (g < score) { score = g; best = el; }
    }
    const key = best?.dataset.poppySeen;
    if (key && (thought[key] || 0) < pools[key].length - 1 && Math.random() < .75) { thought[key] = (thought[key] || 0) + 1; say(key, best, 0, 'beside'); }
    else say(ambient[Math.floor(Math.random() * ambient.length)], null, 0);
  };
  const IDLE = ['wink', 'zoom', 'up', 'side', 'squint', 'happy', 'roll', 'cross', 'nod', 'tilt', 'boggle', 'blink2', 'spin', 'suspicious', 'bounce', 'down'];
  const started = now();
  setInterval(() => {
    if (mode === 'off' || document.hidden) return;
    const quiet = now() - lastInput, docked = mode === 'home';
    if (!docked && !dozing && quiet > 40000) { dozing = true; poppy.classList.add('is-dozing'); aim(); say('doze', null, 3); }
    else if (dozing) { if (now() - lastSaid > 9000) say('doze', null, 0); }
    else if (quiet > 12000 && !idleSaid) idleSaid = say('idle', null, 0);
    else if (now() - started > 240000 && once('long-visit', 1e9, 'long-visit', null, 0)) return;
    else if (now() - started > 720000 && once('very-long-visit', 1e9, 'very-long-visit', null, 0)) return;
    else {
      if (pending.size) trySeen();
      if (quiet < 30000 && now() - lastScroll > 1200) ponder();
    }
    if (!docked && !dozing && !face && !showing() && Math.random() < .03) express(IDLE[Math.floor(Math.random() * IDLE.length)], 1400);
  }, 1000);

  // Lines load at once, at low priority, so she has them before the visitor does anything; then she says
  // hello, from the name if she's in it.
  const get = url => url ? fetch(url, {priority: 'low'}).then(r => r.json()) : Promise.resolve([]);
  const loaded = Promise.all([get(script.dataset.pageLines), get(script.dataset.lines)]).then(([mine, all]) => { wire(mine); wire(all); }).catch(() => {});
  loaded.then(() => { if (page === 'home' && lastSaid < 0) hello(); });

  // Start, and stop for reduced motion: she goes home (or away) at once and keeps quiet.
  const hasHome = name && letters.length === 2;
  let watching = false;
  const start = () => {
    if (reduced()) return;
    toggle.hidden = false;
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
    loaded.then(() => setTimeout(hello, 400));
  };
  document.addEventListener('motionchange', () => {
    if (!reduced()) { if (mode === 'off') start(); return; }
    cancelAnimationFrame(frame); frame = 0; hush(); dozing = false;
    poppy.classList.remove('is-out', 'is-dozing', 'is-flying', 'is-visiting');
    if (name) name.classList.remove('is-poppy-out');
    mode = 'off'; toggle.hidden = true;
  });
  start();
})();
