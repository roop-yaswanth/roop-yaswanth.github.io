(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('enhanced');
  const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let userReduces = false;
  try { userReduces = localStorage.getItem('roop.reduceMotion') === 'true'; } catch (_) {}
  const motionCallbacks = [];
  let restartFrame = 0;
  const motionButton = document.querySelector('.motion-toggle');
  const camera = document.querySelector('.poster-camera');
  const intro = document.querySelector('.cinema-intro');
  const identity = document.querySelector('.identity-intro');
  const portrait = document.querySelector('.portrait-card');
  const portraitDetails = document.querySelector('.portrait-details');
  const scrollScenes = [...document.querySelectorAll('[data-scroll-scene]')];
  let cinemaSeen = false;
  const reduced = () => userReduces || systemMotion.matches;
  function finishIntro() {
    root.classList.remove('intro-playing', 'intro-paused');
  }
  function playIntro() {
    if (!camera || reduced()) return;
    cancelAnimationFrame(restartFrame);
    root.classList.remove('intro-playing', 'intro-paused');
    // One frame resets the CSS animation before it starts.
    restartFrame = requestAnimationFrame(() => {
      restartFrame = requestAnimationFrame(() => {
        if (reduced()) return;
        root.classList.add('intro-playing');
      });
    });
  }
  function applyMotion() {
    root.dataset.reduceMotion = String(reduced());
    if (motionButton) {
      motionButton.hidden = false;
      motionButton.setAttribute('aria-pressed', String(reduced()));
      motionButton.disabled = systemMotion.matches;
      motionButton.textContent = systemMotion.matches ? 'Reduced motion follows your system' : userReduces ? 'Reduced motion is on' : 'Reduce motion';
    }
    if (reduced()) {
      cancelAnimationFrame(restartFrame);
      finishIntro();
      identity?.classList.remove('identity-arriving');
      portrait?.style.removeProperty('--look-x');
      portrait?.style.removeProperty('--look-angle');
    }
    motionCallbacks.forEach(callback => callback());
    document.dispatchEvent(new Event('motionchange'));
    scheduleSceneUpdate();
  }
  motionButton?.addEventListener('click', () => {
    userReduces = !userReduces;
    try { localStorage.setItem('roop.reduceMotion', String(userReduces)); } catch (_) {}
    applyMotion();
  });
  systemMotion.addEventListener('change', applyMotion);
  camera?.addEventListener('animationend', event => {
    if (event.target === camera && event.animationName === 'camera-reveal') finishIntro();
  });

  // Decorative scroll response follows ordinary document scrolling. No wheel/touch interception.
  let sceneFrame = 0;
  function updateScenes() {
    sceneFrame = 0;
    if (reduced()) {
      intro?.style.setProperty('--scroll', '0');
      scrollScenes.forEach(el => el.style.setProperty('--progress', '1'));
      return;
    }
    if (intro) {
      const box = intro.getBoundingClientRect();
      const range = Math.max(1, box.height - innerHeight + 65);
      const progress = Math.max(0, Math.min(1, (65 - box.top) / range));
      intro.style.setProperty('--scroll', progress.toFixed(4));
    }
    scrollScenes.forEach(el => {
      const box = el.getBoundingClientRect();
      if (box.bottom < 0 || box.top > innerHeight) return;
      const progress = Math.max(0, Math.min(1, (innerHeight - box.top) / (innerHeight * .65)));
      el.style.setProperty('--progress', progress.toFixed(4));
    });
  }
  function scheduleSceneUpdate() {
    if (!sceneFrame) sceneFrame = requestAnimationFrame(updateScenes);
  }
  if (intro || scrollScenes.length) {
    addEventListener('scroll', scheduleSceneUpdate, {passive:true});
    addEventListener('resize', scheduleSceneUpdate, {passive:true});
  }
  applyMotion();
  // CineMatch is the second scene. Start its reveal when it is actually reached,
  // not while the visitor is reading the personal introduction above it.
  if (camera && intro && 'IntersectionObserver' in window) {
    const cinemaObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting) && !cinemaSeen) {
        cinemaSeen = true;
        if (!reduced()) playIntro();
        cinemaObserver.disconnect();
      }
    }, {threshold: 0, rootMargin: '0px 0px -35% 0px'});
    cinemaObserver.observe(intro);
  }

  // A finite arrival, followed by a small pointer response confined to the art.
  // The title, links and biography never move or wait for a reveal.
  if (identity && !reduced() && !location.hash) {
    identity.classList.add('identity-arriving');
    identity.addEventListener('animationend', event => {
      if (event.animationName === 'portrait-arrive') identity.classList.remove('identity-arriving');
    });
  }
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  // Googly pupils, loose inside each o. They chase the cursor with a wobbly lag, go cross-eyed and
  // curious when it comes close, flinch from a poke, get dizzy when the pointer is shaken, roll after a
  // few idle seconds, jiggle when the page scrolls and spin when the name is tapped. They also blink,
  // doze off when nothing happens, notice when you leave and come back, follow keyboard focus and
  // selections, and get more flustered the more they are spun. The simulation sleeps whenever the
  // pupils settle.
  const pupils = [...document.querySelectorAll('.eye-pupil')];
  const nameHeading = pupils[0]?.closest('h1');
  if (nameHeading) {
    // The second pupil is the curious one: left alone it holds a glance up and out (the mark's expression).
    const balls = pupils.map((el, i) => ({el, x: 0, y: 0, vx: 0, vy: 0, s: 1, tx: 0, ty: 0, k: 0, g: 1, damp: .9, scale: 1, rest: i ? [.7, -.55] : null}));
    const eye = {cx: .2775, cy: .625, w: .25, h: .34, p: .14};
    let frame = 0, last = 0, lastTop = null, lastSpeed = 0, unit = 16, rx = 1, ry = 1;
    let pointer = null, dizzyUntil = 0, startleUntil = 0, boredTimer = 0, quipAt = -Infinity, lastSign = 0, turns = [];
    let idleTimer = 0, snoreTimer = 0, awayTimer = 0, asleep = false, away = false, pressed = false, hiddenAt = 0, spins = [], swirl = 0, swirlAngle = null, swirlAt = 0;
    const quip = document.createElement('span'), anchor = document.createElement('span');
    quip.className = 'eye-quip'; anchor.className = 'eye-quip-anchor'; anchor.setAttribute('aria-hidden', 'true');
    anchor.append(quip); pupils[pupils.length - 1].parentElement.append(anchor);
    quip.addEventListener('animationend', () => quip.classList.remove('is-showing'));
    const onScreen = () => { const box = nameHeading.getBoundingClientRect(); return box.bottom > 0 && box.top < innerHeight; };
    // Quips wait their turn, except for moments that answer something the visitor just did.
    const say = (lines, urgent = false) => {
      const now = performance.now();
      if ((!urgent && now - quipAt < 4000) || !onScreen()) return;
      quipAt = now; quip.textContent = lines[Math.floor(Math.random() * lines.length)];
      quip.classList.remove('is-showing'); void quip.offsetWidth; quip.classList.add('is-showing');
    };
    // Fit the eye to the counter of the o as actually rendered, so any system font gets a snug pupil.
    const fit = () => {
      const letter = pupils[0].parentElement, style = getComputedStyle(letter), size = 200;
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = size * 2;
      const ctx = canvas.getContext('2d', {willReadFrequently: true});
      if (!ctx) return;
      ctx.font = `${style.fontStyle} ${style.fontWeight} ${size}px ${style.fontFamily}`;
      const ox = size / 2, base = size * 1.4, m = ctx.measureText('o');
      ctx.fillText('o', ox, base);
      const data = ctx.getImageData(0, 0, size * 2, size * 2).data;
      const ink = (i, j) => data[(j * size * 2 + i) * 4 + 3] > 127;
      const mx = Math.round(ox + (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2);
      const my = Math.round(base - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
      if (ink(mx, my)) return;
      let l = mx, r = mx, t = my, b = my;
      while (l > 0 && !ink(l - 1, my)) l--;
      while (r < size * 2 && !ink(r + 1, my)) r++;
      const cx = Math.round((l + r) / 2);
      while (t > 0 && !ink(cx, t - 1)) t--;
      while (b < size * 2 && !ink(cx, b + 1)) b++;
      const probe = document.createElement('span');
      probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
      letter.append(probe);
      const baseline = (probe.getBoundingClientRect().top - letter.getBoundingClientRect().top) / parseFloat(style.fontSize);
      probe.remove();
      Object.assign(eye, {cx: (cx - ox) / size, cy: baseline - (base - (t + b) / 2) / size, w: (r - l + 1) / size, h: (b - t + 1) / size});
      eye.p = Math.min(eye.w * .54, eye.h * .42);
      ['cx', 'cy', 'w', 'h', 'p'].forEach(key => nameHeading.style.setProperty(`--eye-${key}`, `${eye[key].toFixed(4)}em`));
    };
    const measure = () => {
      unit = parseFloat(getComputedStyle(pupils[0].parentElement).fontSize) || 16;
      rx = Math.max(.5, ((eye.w - eye.p) / 2 - .01) * unit); ry = Math.max(.5, ((eye.h - eye.p) / 2 - .01) * unit);
    };
    const rest = () => {
      cancelAnimationFrame(frame); frame = 0; lastTop = null; pointer = null;
      balls.forEach(b => { const hold = b.rest && !asleep; Object.assign(b, {x: hold ? b.rest[0] * rx : 0, y: hold ? b.rest[1] * ry : ry, vx: 0, vy: 0, s: 1}); ['x', 'y', 's'].forEach(key => b.el.style.removeProperty(`--eye-${key}`)); });
    };
    const tick = now => {
      const dt = Math.min(.04, (now - last) / 1000 || 1 / 60); last = now;
      const box = nameHeading.getBoundingClientRect();
      if (box.bottom < 0 || box.top > innerHeight) { rest(); return; }
      // When scrolling accelerates the name, the pupils lag behind it.
      const speed = lastTop === null ? 0 : (box.top - lastTop) / dt;
      const shove = lastTop === null ? 0 : Math.max(-unit * 300, Math.min(unit * 300, (speed - lastSpeed) / dt));
      lastTop = box.top; lastSpeed = speed;
      const dizzy = now < dizzyUntil, gaze = pointer && !dizzy;
      let close = 0;
      balls.forEach(b => {
        // Dozing or dizzy, even the curious pupil gives in to gravity.
        const hold = !gaze && !dizzy && !asleep && b.rest;
        Object.assign(b, {tx: hold ? b.rest[0] * rx : 0, ty: hold ? b.rest[1] * ry : 0, k: hold ? 220 : 0, g: gaze ? .15 : hold ? 0 : dizzy ? .25 : 1, damp: gaze || hold ? 4 : .9, scale: now < startleUntil ? .66 : 1});
        if (!gaze) return;
        const letter = b.el.parentElement.getBoundingClientRect();
        const dx = pointer.x - (letter.left + eye.cx * unit), dy = pointer.y - (letter.top + eye.cy * unit), dist = Math.hypot(dx, dy) || 1;
        // Far away they glance; close up they stare, pupils wide. Inside the eye they flinch away.
        const poke = dist < unit * .2, reach = poke ? -1 : .6 + .4 * Math.min(1, dist / (unit * 3));
        Object.assign(b, {tx: dx / dist * rx * reach, ty: dy / dist * ry * reach, k: 340});
        if (poke) { b.scale = .7; say(['Hey!', 'Ow.', 'Rude.']); }
        else if (dist < unit * .9) { b.scale = Math.max(b.scale, 1.2); close++; }
      });
      if (close === balls.length) say(['Too close.', 'Personal space?']);
      const steps = Math.ceil(dt * 240), h = dt / steps;
      for (let s = 0; s < steps; s++) balls.forEach((b, i) => {
        b.vx += b.k * (b.tx - b.x) * h; b.vy += (unit * 22 * b.g - shove * .35 + b.k * (b.ty - b.y)) * h;
        if (dizzy) { const r = Math.hypot(b.x, b.y) || 1, turn = (i ? -1 : 1) * unit * 3.5 * h; b.vx -= b.y / r * turn; b.vy += b.x / r * turn; }
        const drag = Math.exp(-b.damp * h); b.vx *= drag; b.vy *= drag;
        b.x += b.vx * h; b.y += b.vy * h;
        const q = Math.hypot(b.x / rx, b.y / ry);
        if (q <= 1) return;
        b.x /= q; b.y /= q;
        // The rim is the counter's ellipse: bounce hard knocks off it, roll gentle contact along it.
        let nx = b.x / (rx * rx), ny = b.y / (ry * ry);
        const n = Math.hypot(nx, ny); nx /= n; ny /= n;
        const vn = b.vx * nx + b.vy * ny;
        if (vn > 0) { const bounce = vn > unit * .4 ? 1.45 : 1; b.vx -= bounce * vn * nx; b.vy -= bounce * vn * ny; }
        const roll = Math.exp(-1.5 * h); b.vx *= roll; b.vy *= roll;
      });
      balls.forEach(b => {
        b.s += (b.scale - b.s) * (1 - Math.exp(-14 * dt));
        b.el.style.setProperty('--eye-x', `${b.x.toFixed(2)}px`); b.el.style.setProperty('--eye-y', `${b.y.toFixed(2)}px`); b.el.style.setProperty('--eye-s', b.s.toFixed(3));
      });
      const still = Math.abs(shove) < unit && !dizzy && now >= startleUntil && balls.every(b => Math.hypot(b.vx, b.vy) < unit * .12 && Math.abs(b.s - b.scale) < .01);
      const settled = still && balls.every(b => b.k ? Math.hypot(b.tx - b.x, b.ty - b.y) < .3 : b.y > ry * .97);
      frame = settled ? 0 : requestAnimationFrame(tick);
      if (settled && !gaze) rest();
    };
    const wake = () => { if (!frame && !reduced()) { measure(); last = performance.now(); frame = requestAnimationFrame(tick); } };
    // After a few idle seconds the eyes give up on the cursor and roll.
    const bore = delay => {
      clearTimeout(boredTimer);
      boredTimer = setTimeout(() => {
        if (!pointer) return;
        pointer = null;
        balls.forEach(b => { const r = Math.hypot(b.x, b.y) || 1; b.vx += b.y / r * unit * 9; b.vy -= b.x / r * unit * 9; });
        say(['Still there?', 'Hello?', '…']); wake();
      }, delay);
    };
    const blink = (times = 1) => {
      if (reduced() || asleep) return;
      nameHeading.classList.remove('is-blinking'); void nameHeading.offsetWidth;
      nameHeading.style.setProperty('--blinks', times); nameHeading.classList.add('is-blinking');
    };
    nameHeading.addEventListener('animationend', event => { if (event.animationName === 'eye-blink') nameHeading.classList.remove('is-blinking'); });
    const blinkLater = () => {
      setTimeout(() => { if (!document.hidden && onScreen()) blink(Math.random() < .2 ? 2 : 1); blinkLater(); }, 2500 + Math.random() * 4500);
    };
    const look = (x, y, hold) => { pointer = {x, y}; bore(hold); wake(); };
    // Any sign of life resets the doze timer, and wakes them with a start if they had dropped off.
    const nudge = () => {
      clearTimeout(idleTimer);
      if (asleep) {
        asleep = false; clearInterval(snoreTimer); nameHeading.classList.remove('is-drowsy');
        startleUntil = performance.now() + 420; balls.forEach(b => { b.vy -= unit * 9; });
        say(['Huh? I’m up!', 'Wasn’t sleeping.'], true); blink(2); wake();
      }
      idleTimer = setTimeout(() => {
        if (reduced() || document.hidden || !onScreen()) return;
        asleep = true; pointer = null; nameHeading.classList.add('is-drowsy');
        say(['Zzz…'], true); wake();
        snoreTimer = setInterval(() => say(['Zzz…', 'zzz…'], true), 7000);
      }, 25000);
    };
    // Back at the name after exploring below it, they call back to the last thing the visitor dug into:
    // every research topic opened, the MRI scan paused and replayed, a run of anime skipped. Reaching Contact
    // without any of that still earns the old line. One callback a visit, kept only in memory.
    const contact = document.querySelector('#contact'), topics = document.querySelectorAll('.research-item');
    const opened = new Set(), tries = {mri: 0, anime: 0};
    const callbacks = {research: ['More questions?'], mri: ['Looking closely.'], anime: ['One more episode?'], contact: ['Read it all?', 'Thorough. I like it.']};
    let callback = 0, explored = '';
    const explore = kind => { explored = kind; if (!callback && !onScreen()) callback = 1; };
    document.addEventListener('toggle', event => {
      if (event.target.matches?.('.research-item') && event.target.open && opened.add(event.target).size === topics.length) explore('research');
    }, true);
    document.addEventListener('click', event => {
      if (event.target.closest?.('.volume-play') && ++tries.mri > 1) explore('mri');
      if (event.target.closest?.('[data-hobby="anime"]') && ++tries.anime > 2) explore('anime');
    }, true);
    addEventListener('scroll', () => {
      nudge(); wake();
      if (callback > 1 || reduced()) return;
      const box = nameHeading.getBoundingClientRect();
      if (!callback) { if (!onScreen() && contact?.getBoundingClientRect().top < innerHeight * .8) callback = 1; }
      else if (box.top > (document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0) + 20 && box.bottom < innerHeight) { callback = 2; say(callbacks[explored || 'contact'], true); }
    }, {passive: true});
    document.addEventListener('keydown', nudge);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { hiddenAt = performance.now(); return; }
      if (reduced() || !hiddenAt || performance.now() - hiddenAt < 4000) return;
      hiddenAt = 0; balls.forEach(b => { b.vy -= unit * 10; });
      say(['You’re back!', 'Missed you.', 'Oh, hi again.'], true); blink(2); nudge(); wake();
    });
    // When the cursor leaves the window they keep staring at where it went, then wonder about it.
    document.addEventListener('mouseout', event => {
      if (event.relatedTarget || reduced()) return;
      clearTimeout(awayTimer);
      awayTimer = setTimeout(() => { away = true; say(['Where’d you go?', 'Come back…'], true); }, 1400);
    });
    // Keyboard focus and text selections get looked at, and a copy gets a comment.
    document.addEventListener('focusin', event => {
      if (reduced() || !event.target.matches?.(':focus-visible')) return;
      const r = event.target.getBoundingClientRect(); look(r.left + r.width / 2, r.top + r.height / 2, 2500);
    });
    document.addEventListener('selectionchange', () => {
      const selection = getSelection();
      if (reduced() || pressed || !selection?.rangeCount || selection.isCollapsed) return;
      const r = selection.getRangeAt(0).getBoundingClientRect();
      if (r.width) { look(r.left + r.width / 2, r.top + r.height / 2, 2500); nudge(); }
    });
    document.addEventListener('copy', () => { if (!reduced()) { say(['Good taste.', 'Take it, it’s yours.', 'Copied. Wise.'], true); blink(); } });
    addEventListener('pointerup', () => { pressed = false; }, {passive: true});
    addEventListener('resize', () => { measure(); if (!frame) rest(); }, {passive: true});
    document.addEventListener('pointermove', event => {
      if (reduced() || event.pointerType !== 'mouse') return;
      pointer = {x: event.clientX, y: event.clientY};
      clearTimeout(awayTimer);
      if (away) { away = false; say(['There you are!', 'Oh, welcome back.'], true); }
      nudge();
      // Circling the name drags their gaze round and round until they lose it.
      const [a, b] = pupils.map(el => el.parentElement.getBoundingClientRect());
      const mx = (a.left + b.right) / 2, my = (a.top + a.bottom) / 2;
      const swirlNow = performance.now(), angle = Math.atan2(pointer.y - my, pointer.x - mx);
      if (Math.hypot(pointer.x - mx, pointer.y - my) > unit * 5 || swirlNow - swirlAt > 400 || swirlAngle === null) swirl = 0;
      else swirl += Math.atan2(Math.sin(angle - swirlAngle), Math.cos(angle - swirlAngle));
      swirlAngle = angle; swirlAt = swirlNow;
      if (Math.abs(swirl) > Math.PI * 4) { swirl = 0; dizzyUntil = swirlNow + 2200; say(['Round and round…', 'Make it stop!'], true); }
      // Shaking the pointer from side to side makes them dizzy.
      const sign = Math.sign(event.movementX), t = performance.now();
      if (Math.abs(event.movementX) > 7 && sign !== lastSign) { lastSign = sign; turns = turns.filter(at => t - at < 700); turns.push(t); }
      if (turns.length >= 5) { turns = []; dizzyUntil = t + 1700; say(['Whoa…', 'Easy there.', 'So dizzy.']); }
      bore(6000); wake();
    }, {passive: true});
    document.addEventListener('pointerdown', event => {
      if (reduced()) return;
      pressed = true; nudge();
      if (nameHeading.contains(event.target)) {
        balls.forEach(b => { const angle = Math.random() * Math.PI * 2; b.vx += Math.cos(angle) * unit * 20; b.vy += Math.sin(angle) * unit * 20; });
        // Each quick spin gets a little more flustered than the last.
        const now = performance.now(); spins = spins.filter(at => now - at < 1600); spins.push(now);
        const lines = [['Wheee!'], ['Again!', 'Wheee!!'], ['Okay, okay!'], ['Seeing stars…', 'I need a minute.']];
        if (spins.length >= 4) dizzyUntil = now + 2400;
        say(lines[Math.min(spins.length, 4) - 1], spins.length > 1);
      } else {
        // A click anywhere startles them; on touch they look where you tapped.
        startleUntil = performance.now() + 380;
        balls.forEach(b => { b.vy -= unit * 6; });
        if (event.pointerType !== 'mouse') { pointer = {x: event.clientX, y: event.clientY}; bore(1800); }
      }
      wake();
    }, {passive: true});
    motionCallbacks.push(() => {
      if (!reduced()) return;
      asleep = false; clearInterval(snoreTimer); clearTimeout(idleTimer);
      nameHeading.classList.remove('is-drowsy', 'is-blinking'); rest();
    });
    fit(); measure(); rest(); blinkLater(); nudge();
    // On arrival the pupils drop from the top of each o and settle.
    if (!reduced() && !location.hash) { balls.forEach((b, i) => { b.y = -ry; b.vx = (i ? -1 : 1) * unit * 1.5; }); wake(); }
  }
  // The portrait turns when the pointer rests on it for a moment, or on a click, tap or key. One class
  // drives both faces with transitions, so a turn can reverse midway. A click that lands just as a hover
  // turn begins confirms it instead of undoing it, and a turn started by a click stays until dismissed.
  const portraitSummary = portraitDetails?.querySelector('summary');
  const TURN_MS = 700, REST_MS = 200, CONFIRM_MS = 650;
  let dismissHover = false, restTimer = 0, closeTimer = 0, pinned = false, hoverTurnedAt = -Infinity;
  const turned = () => portraitDetails.classList.contains('is-turned');
  const setTurned = on => {
    clearTimeout(restTimer); clearTimeout(closeTimer);
    portraitSummary.setAttribute('aria-label', on ? 'About Roop. Turn back to the portrait.' : 'About Roop. Turn the portrait over.');
    if (on) {
      if (!portraitDetails.open) { portraitDetails.open = true; void portraitDetails.offsetWidth; }
      portraitDetails.classList.add('is-turned');
      return;
    }
    pinned = false;
    portraitDetails.classList.remove('is-turned');
    if (reduced()) portraitDetails.open = false;
    else closeTimer = setTimeout(() => { if (!turned()) portraitDetails.open = false; }, TURN_MS);
  };
  if (portraitDetails) {
    portraitDetails.classList.add('is-js');
    portraitSummary.addEventListener('click', event => {
      event.preventDefault();
      if (turned() && performance.now() - hoverTurnedAt > CONFIRM_MS) { setTurned(false); dismissHover = true; return; }
      setTurned(true);
      pinned = true;
    });
    portraitDetails.addEventListener('pointerenter', () => {
      if (!finePointer.matches || dismissHover || turned()) return;
      restTimer = setTimeout(() => { hoverTurnedAt = performance.now(); setTurned(true); }, REST_MS);
    });
    portraitDetails.addEventListener('pointerleave', () => {
      dismissHover = false;
      clearTimeout(restTimer);
      if (finePointer.matches && !pinned && turned()) setTurned(false);
    });
    document.addEventListener('pointerdown', event => {
      if (turned() && !portraitDetails.contains(event.target)) setTurned(false);
    });
    portraitDetails.addEventListener('focusout', () => {
      requestAnimationFrame(() => {
        if (turned() && !portraitDetails.contains(document.activeElement) && !portraitDetails.matches(':hover')) setTurned(false);
      });
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !turned()) return;
      setTurned(false);
      dismissHover = true;
      if (portraitDetails.contains(document.activeElement)) portraitSummary.focus();
    });
  }

  // Explicit playback only. Manual navigation, leaving the viewport or reduced motion stop it.
  document.querySelectorAll('[data-gallery]').forEach(gallery => {
    const nav = gallery.querySelector('.gallery-nav');
    const tabs = [...nav.querySelectorAll('[data-gallery-target]')];
    const panels = tabs.map(tab => document.getElementById(tab.dataset.galleryTarget));
    if (panels.some(panel => !panel)) return;
    const play = gallery.querySelector('.gallery-play');
    const track = gallery.querySelector('.gallery-panels');
    const stage = document.createElement('div'); stage.className = 'gallery-stage';
    track.before(stage); stage.append(track);
    const neighbors = [-1, 1].map(step => {
      const button = document.createElement('button'); button.type = 'button';
      button.className = `gallery-neighbor ${step < 0 ? 'neighbor-before' : 'neighbor-after'}`;
      button.tabIndex = -1; button.setAttribute('aria-hidden', 'true');
      const image = document.createElement('img'); image.alt = ''; image.decoding = 'async';
      button.append(image); stage.append(button);
      button.addEventListener('click', () => { stop(); show(current + step); });
      return {button, image, step};
    });
    let current = 0, timer = 0, playing = false;
    nav.setAttribute('role', 'tablist');
    const stop = () => {
      clearTimeout(timer); playing = false; gallery.dataset.playing = 'false';
      play.setAttribute('aria-label', 'Play slideshow'); play.title = 'Play slideshow';
    };
    // A ribbon, not a flash: the new screen slides in from the side it was waiting on while the old one
    // moves into the neighbouring slot. Each piece animates from where the ribbon was before the change.
    const glide = {duration: 720, easing: 'cubic-bezier(.32,.72,0,1)'};
    let gliding = [];
    const slide = dir => {
      gliding.forEach(animation => animation.cancel());
      const panel = panels[current], image = panel.querySelector('.gallery-image'), caption = panel.querySelector('figcaption');
      const [before, after] = neighbors.map(({button}) => button);
      const gap = after.getBoundingClientRect().left - image.getBoundingClientRect().left;
      const shift = `translateX(${dir * gap}px)`, entering = dir > 0 ? after : before, leaving = dir > 0 ? before : after;
      image.style.transformOrigin = dir > 0 ? 'left center' : 'right center';
      gliding = [
        image.animate([{transform: `${shift} scale(.94)`, opacity: .7}, {transform: 'none', opacity: 1}], glide),
        leaving.animate([{transform: `${shift} scale(1)`, opacity: 1}, {transform: 'scale(.94)', opacity: .7}], glide),
        entering.animate([{transform: `${shift} scale(.94)`}, {transform: 'scale(.94)'}], glide),
        caption.animate([{opacity: 0, transform: 'translateY(6px)'}, {opacity: 1, transform: 'none'}], {duration: 420, delay: 260, easing: 'ease-out', fill: 'backwards'})
      ];
      gliding[0].finished.then(() => { image.style.transformOrigin = ''; }, () => {});
    };
    const show = (index, focus = false, dir = Math.sign(index - current)) => {
      current = (index + tabs.length) % tabs.length;
      tabs.forEach((tab, i) => {
        const active = i === current;
        tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
        panels[i].hidden = !active; panels[i].classList.toggle('is-selected', active);
      });
      neighbors.forEach(({button, image, step}) => {
        const index = (current + step + tabs.length) % tabs.length;
        const source = panels[index].querySelector('img');
        image.src = source.src; image.srcset = source.srcset; image.sizes = '(max-width: 760px) 75vw, 950px';
        image.width = source.width; image.height = source.height;
        button.setAttribute('aria-label', `${step < 0 ? 'Previous' : 'Next'} screen: ${tabs[index].getAttribute('aria-label')}`);
      });
      if (focus) tabs[current].focus();
      if (dir && !reduced() && Element.prototype.animate) slide(dir);
    };
    const schedule = () => { timer = setTimeout(() => { if (!playing) return; show(current + 1); schedule(); }, 6500); };
    play.hidden = false;
    play.addEventListener('click', () => {
      if (playing) { stop(); return; }
      if (reduced()) return;
      playing = true; gallery.dataset.playing = 'true';
      play.setAttribute('aria-label', 'Pause slideshow'); play.title = 'Pause slideshow'; schedule();
    });
    for (const [selector, step] of [['.gallery-prev', -1], ['.gallery-next', 1]]) {
      const button = gallery.querySelector(selector); button.hidden = false;
      button.addEventListener('click', () => { stop(); show(current + step); });
    }
    tabs.forEach((tab, index) => {
      tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', panels[index].id);
      panels[index].setAttribute('role', 'tabpanel'); panels[index].setAttribute('aria-labelledby', tab.id);
      tab.addEventListener('click', event => { event.preventDefault(); stop(); show(index); });
      tab.addEventListener('keydown', event => {
        let next = index;
        if (event.key === 'ArrowRight') next = index + 1;
        else if (event.key === 'ArrowLeft') next = index - 1;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else if (event.key !== ' ') return;
        event.preventDefault(); stop(); show(next, true);
      });
    });
    let gesture = null;
    stage.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') gesture = {x:event.clientX,y:event.clientY}; }, {passive:true});
    stage.addEventListener('pointerup', event => {
      if (!gesture) return;
      const dx=event.clientX-gesture.x, dy=event.clientY-gesture.y; gesture=null;
      if (Math.abs(dx)>55 && Math.abs(dx)>Math.abs(dy)*1.4) { stop(); show(current+(dx<0?1:-1)); }
    }, {passive:true});
    stage.addEventListener('pointercancel', () => { gesture=null; });
    gallery.addEventListener('pointerenter', stop);
    gallery.addEventListener('focusin', event => { if (event.target !== play) stop(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) stop();
    }).observe(gallery);
    const sync = () => { play.disabled = reduced(); if (reduced()) stop(); };
    motionCallbacks.push(sync); sync();
    const fromHash = tabs.findIndex(tab => tab.hash === location.hash);
    gallery.dataset.ready = 'true'; show(fromHash < 0 ? 0 : fromHash, false, 0);
  });
  // SoundVector in one gesture: a song plays, the songs that sound like it queue up behind it, and the
  // queue plays through and comes back to the top. It runs once; the resting queue is the page.
  const queue = document.querySelector('[data-queue]');
  if (queue && 'IntersectionObserver' in window) {
    const rows = [...queue.children];
    let timers = [];
    const current = n => rows.forEach((row, i) => row.classList.toggle('is-current', i === n));
    const enter = (row, sweep) => { row.style.setProperty('--sweep', `${sweep}ms`); row.classList.add('is-in'); };
    const settle = () => {
      timers.forEach(clearTimeout); timers = [];
      queue.classList.remove('is-armed'); rows.forEach(row => { row.classList.remove('is-in'); row.style.removeProperty('--sweep'); }); current(0);
    };
    const beats = [[250, () => { enter(rows[0], 700); current(0); }], ...rows.slice(1).map((row, i) => [1250 + i * 200, () => enter(row, 380)]),
      ...[1, 2, 3, 4, 0].map((n, i) => [2900 + i * 600, () => current(n)]), [6000, settle]];
    if (!reduced()) {
      queue.classList.add('is-armed'); current(-1);
      const watch = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        watch.disconnect();
        beats.forEach(([at, run]) => timers.push(setTimeout(() => reduced() ? settle() : run(), at)));
      }, {threshold: .6});
      watch.observe(queue);
    }
    motionCallbacks.push(() => { if (reduced()) settle(); });
  }

  // A link to a research topic, from the hero's index or elsewhere, opens it.
  const openTarget = () => {
    const target = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && target.matches('details')) target.open = true;
  };
  addEventListener('hashchange', openTarget); openTarget();

  // Figures roll into place once, like an odometer, the first time they are read. A plain copy stays
  // available to assistive technology; the reels are decorative and stop on the real digits.
  const figures = [...document.querySelectorAll('.project-highlights dt, .education-grade strong, .entry-gpa, .flow-weight')];
  if (figures.length && 'IntersectionObserver' in window) {
    const reel = [...'0123456789'.repeat(3)].join('\n');
    const spoken = node => node.nodeType === Node.TEXT_NODE ? node.textContent
      : node.getAttribute('aria-hidden') === 'true' ? '' : [...node.childNodes].map(spoken).join('');
    const odometers = figures.map(figure => {
      const group = figure.closest('dl');
      const index = figures.filter(other => other.closest('dl') === group).indexOf(figure);
      const label = document.createElement('span');
      label.className = 'visually-hidden'; label.textContent = spoken(figure).replace(/\s+/g, ' ').trim();
      const visual = document.createElement('span');
      visual.className = 'odometer'; visual.setAttribute('aria-hidden', 'true');
      visual.append(...figure.childNodes);
      visual.querySelectorAll('.visually-hidden').forEach(el => el.remove());
      const texts = [], walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) if (!walker.currentNode.parentElement.closest('.metric-arrow')) texts.push(walker.currentNode);
      texts.forEach((text, number) => {
        const count = text.textContent.replace(/\D/g, '').length;
        const fragment = document.createDocumentFragment();
        let seen = 0;
        for (const char of text.textContent) {
          if (!/\d/.test(char)) { fragment.append(char); continue; }
          // Like an odometer, the rightmost digits travel furthest.
          const turns = Math.max(0, 2 - (count - 1 - seen++));
          const cell = document.createElement('span'), sizer = document.createElement('span'), strip = document.createElement('span');
          cell.className = 'odo-digit'; sizer.className = 'odo-sizer'; strip.className = 'odo-reel';
          sizer.textContent = char; strip.textContent = reel;
          cell.style.setProperty('--n', turns * 10 + Number(char));
          cell.style.setProperty('--dur', `${1050 + turns * 280}ms`);
          cell.style.setProperty('--delay', `${index * 140 + number * 420 + seen * 45}ms`);
          cell.append(sizer, strip); fragment.append(cell);
        }
        text.replaceWith(fragment);
      });
      visual.style.setProperty('--arrow-delay', `${index * 140 + 300}ms`);
      figure.replaceChildren(label, visual);
      const cell = visual.querySelector('.odo-digit');
      if (cell) visual.style.setProperty('--lhe', (cell.getBoundingClientRect().height / parseFloat(getComputedStyle(cell).fontSize)).toFixed(4));
      if (!reduced()) visual.classList.add('is-armed');
      return visual;
    });
    const counter = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      counter.unobserve(entry.target);
      const visual = entry.target.querySelector('.odometer');
      if (visual.classList.contains('is-armed')) visual.classList.replace('is-armed', 'is-rolling');
    }), {threshold: .6, rootMargin: '0px 0px -8% 0px'});
    figures.filter(figure => !figure.closest('.architecture-flow')).forEach(figure => counter.observe(figure));
    motionCallbacks.push(() => { if (reduced()) odometers.forEach(visual => visual.classList.remove('is-armed', 'is-rolling')); });
  }

  // CineMatch's pipeline mixes on arrival: both signals run into late fusion, the weights roll in,
  // and the shortlist lands.
  const flow = document.querySelector('.case-page .architecture-flow');
  if (flow && !reduced() && 'IntersectionObserver' in window) {
    const settle = () => flow.classList.remove('is-armed', 'is-mixing');
    flow.classList.add('is-armed');
    const watch = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      watch.disconnect();
      if (!flow.classList.replace('is-armed', 'is-mixing')) return;
      setTimeout(() => flow.querySelectorAll('.odometer.is-armed').forEach(visual => visual.classList.replace('is-armed', 'is-rolling')), 700);
      setTimeout(settle, 2600);
    }, {threshold: .45});
    watch.observe(flow);
    motionCallbacks.push(() => { if (reduced()) settle(); });
  }

  // EdgeWriter proofreads its own line: one word arrives misspelled and corrects itself in place.
  const proofread = document.querySelector('.proofread');
  if (proofread && !reduced() && 'IntersectionObserver' in window) {
    const settle = () => proofread.classList.remove('is-armed', 'is-fixing');
    proofread.classList.add('is-armed');
    const watch = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      watch.disconnect();
      setTimeout(() => { if (proofread.classList.replace('is-armed', 'is-fixing')) setTimeout(settle, 1000); }, 900);
    }, {threshold: 1, rootMargin: '0px 0px -15% 0px'});
    watch.observe(proofread);
    motionCallbacks.push(() => { if (reduced()) settle(); });
  }

  // "language" says it in a few others before it settles: once on arrival, again when pointed at or tapped.
  const polyglot = document.querySelector('.polyglot');
  if (polyglot && Element.prototype.animate) {
    const words = ['langue', 'idioma', 'भाषा', '言語', 'Sprache', 'language'];
    const step = (el, frames, duration, easing) => el.animate(frames, {duration, easing}).finished.catch(() => {});
    let speaking = false;
    const speak = async () => {
      if (speaking || reduced()) return;
      speaking = true;
      const voice = document.createElement('span');
      voice.className = 'polyglot-voice'; voice.setAttribute('aria-hidden', 'true');
      polyglot.append(voice); polyglot.classList.add('is-speaking');
      for (const word of words) {
        if (reduced()) break;
        if (voice.textContent) await step(voice, {opacity: [1, 0], transform: ['none', 'translateY(-.3em)']}, 150, 'ease-in');
        voice.textContent = word;
        await step(voice, {opacity: [0, 1], transform: ['translateY(.35em)', 'none']}, 380, 'cubic-bezier(.2,.9,.3,1.2)');
        if (word !== 'language') await new Promise(done => setTimeout(done, 160));
      }
      voice.remove(); polyglot.classList.remove('is-speaking'); speaking = false;
    };
    setTimeout(speak, 1100);
    polyglot.addEventListener('pointerenter', speak);
    polyglot.addEventListener('click', speak);
  }

  // Resume skill groups rise into place, one after another, the first time the section is reached.
  const skillGrid = document.querySelector('[data-skill-grid]');
  if (skillGrid && !reduced() && 'IntersectionObserver' in window) {
    const settle = () => skillGrid.classList.remove('is-armed', 'is-shown');
    skillGrid.classList.add('is-armed');
    const rise = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      rise.disconnect();
      if (skillGrid.classList.replace('is-armed', 'is-shown')) setTimeout(settle, 2000);
    }, {threshold: .2});
    rise.observe(skillGrid);
    motionCallbacks.push(() => { if (reduced()) settle(); });
  }

  // Resume moments, on the home page's resume section, each played over a finished page: hairlines draw
  // as sections arrive, certification badges stamp down and skill icons bounce when poked.
  const resume = document.querySelector('.resume-page, .resume-block');
  if (resume && !reduced() && 'IntersectionObserver' in window) {
    const once = (targets, play, options) => {
      const io = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { io.unobserve(entry.target); play(entry.target); }
      }), options);
      targets.forEach(target => io.observe(target));
    };
    const later = (el, name, ms) => setTimeout(() => el.classList.remove(name), ms);
    const sections = [...resume.querySelectorAll('.resume-section:not(.resume-choose)')];
    sections.forEach(section => section.classList.add('is-armed'));
    once(sections, section => { section.classList.replace('is-armed', 'is-drawing'); later(section, 'is-drawing', 1200); }, {rootMargin: '0px 0px -12% 0px'});
    const certs = [...resume.querySelectorAll('.cert')];
    certs.forEach(cert => cert.classList.add('is-armed'));
    once(certs, cert => setTimeout(() => { cert.classList.replace('is-armed', 'is-stamped'); later(cert, 'is-stamped', 700); }, certs.indexOf(cert) * 220), {threshold: .6});
    resume.querySelectorAll('.skill-tools li').forEach(tool => {
      tool.addEventListener('pointerdown', () => {
        if (reduced()) return;
        tool.classList.remove('is-boing'); void tool.offsetWidth; tool.classList.add('is-boing');
      });
      tool.addEventListener('animationend', event => { if (event.animationName === 'tool-boing') tool.classList.remove('is-boing'); });
    });
    motionCallbacks.push(() => {
      if (!reduced()) return;
      resume.querySelectorAll('.is-armed, .is-drawing, .is-stamped').forEach(el => el.classList.remove('is-armed', 'is-drawing', 'is-stamped'));
    });
  }

  // Research sketches draw themselves each time a topic opens. The gripper scene needs a path, so it
  // runs on a short script timeline; the other two are CSS. Every resting state is the finished drawing.
  const easeInOut = x => x < .5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2;
  // The cobots move by two-link inverse kinematics: the hand stays pointing down, the wrist sits a fixed
  // drop above the fingertips, and the elbow takes the higher of its two solutions, as over a table.
  const arms = sketch => {
    const path = sketch.querySelector('.sk-path'), length = path.getTotalLength();
    const rigs = [...sketch.querySelectorAll('.sk-arm')].map(g => {
      const [sx, sy, l1, l2, drop] = g.dataset.rig.split(' ').map(Number), q = s => g.querySelector(s);
      return {g, sx, sy, l1, l2, drop, upper: q('.sk-upper').children, fore: q('.sk-fore').children, wrist: q('.sk-wrist').children,
        elbow: q('.sk-j-elbow'), joint: q('.sk-j-wrist'), hand: q('.sk-hand'), home: [...g.querySelectorAll('line, .sk-j-elbow, .sk-j-wrist, .sk-hand')].map(el => [el, el.getAttribute('x1') ? ['x1', 'y1', 'x2', 'y2'].map(k => el.getAttribute(k)) : el.getAttribute('transform')])};
    });
    const [a, b] = rigs;
    const line = (lines, x1, y1, x2, y2) => [...lines].forEach(l => { l.setAttribute('x1', x1.toFixed(1)); l.setAttribute('y1', y1.toFixed(1)); l.setAttribute('x2', x2.toFixed(1)); l.setAttribute('y2', y2.toFixed(1)); });
    const pose = (r, f) => {
      const p = path.getPointAtLength(f * length), wx = p.x, wy = p.y - r.drop;
      const d = Math.min(r.l1 + r.l2 - .01, Math.hypot(wx - r.sx, wy - r.sy)), base = Math.atan2(wy - r.sy, wx - r.sx);
      const bend = Math.acos((r.l1 ** 2 + d ** 2 - r.l2 ** 2) / (2 * r.l1 * d));
      const [ex, ey] = [base - bend, base + bend].map(t => [r.sx + r.l1 * Math.cos(t), r.sy + r.l1 * Math.sin(t)]).sort((m, n) => m[1] - n[1])[0];
      line(r.upper, r.sx, r.sy, ex, ey); line(r.fore, ex, ey, wx, wy); line(r.wrist, wx, wy, wx, wy + 10);
      r.elbow.setAttribute('transform', `translate(${ex.toFixed(1)} ${ey.toFixed(1)})`);
      r.joint.setAttribute('transform', `translate(${wx.toFixed(1)} ${wy.toFixed(1)})`);
      r.hand.setAttribute('transform', `translate(${wx.toFixed(1)} ${(wy + 10).toFixed(1)})`);
    };
    const dots = [...sketch.querySelectorAll('.sk-dots circle')].map((dot, i, all) => ({
      dot, at: i / (all.length - 1), ax: +dot.dataset.ax, ay: +dot.dataset.ay, bx: +dot.getAttribute('cx'), by: +dot.getAttribute('cy')
    }));
    const move = mix => dots.forEach(({dot, ax, ay, bx, by}) => { dot.setAttribute('cx', (ax + (bx - ax) * mix).toFixed(1)); dot.setAttribute('cy', (ay + (by - ay) * mix).toFixed(1)); });
    let frame = 0;
    const rest = () => {
      cancelAnimationFrame(frame); frame = 0;
      sketch.classList.remove('is-demo'); move(1);
      rigs.forEach(r => { r.home.forEach(([el, v]) => Array.isArray(v) ? ['x1', 'y1', 'x2', 'y2'].forEach((k, i) => el.setAttribute(k, v[i])) : el.setAttribute('transform', v)); r.g.style.removeProperty('opacity'); r.hand.classList.remove('is-open'); });
      dots.forEach(({dot}) => dot.style.removeProperty('opacity'));
    };
    const play = () => {
      rest();
      const start = performance.now();
      sketch.classList.add('is-demo'); b.hand.classList.add('is-open'); b.g.style.opacity = '0'; a.g.style.opacity = '1'; move(0); pose(b, 0);
      const tick = now => {
        const t = now - start;
        // The UR5e demonstrates at an even pace, leaving waypoints behind its fingertips.
        const fa = easeInOut(Math.min(1, t / 1500));
        pose(a, fa);
        if (t > 1500) a.g.style.opacity = String(Math.max(0, 1 - (t - 1500) / 300));
        dots.forEach(({dot, at}) => { dot.style.opacity = fa >= at - .001 ? '1' : '0'; });
        // The waypoints are resampled, crowding toward the grasp for the second hand.
        if (t > 1800) { sketch.classList.remove('is-demo'); move(easeInOut(Math.min(1, (t - 1800) / 600))); }
        // The Franka follows the new timing, one waypoint per equal slice of time, so it slows on approach.
        if (t > 2400) { b.g.style.opacity = '1'; pose(b, 1 - (1 - Math.min(1, (t - 2400) / 1600)) ** 1.7); }
        if (t > 4000) b.hand.classList.remove('is-open');
        if (t > 4300) { pose(a, 0); a.g.style.opacity = String(.32 * Math.min(1, (t - 4300) / 300)); }
        if (t < 4600) frame = requestAnimationFrame(tick); else rest();
      };
      frame = requestAnimationFrame(tick);
    };
    return {play, rest};
  };
  document.querySelectorAll('.research-item').forEach(item => {
    const sketch = item.querySelector('.research-panel .research-sketch');
    if (!sketch) return;
    const scene = sketch.classList.contains('sketch-grippers') ? arms(sketch) : null;
    const stop = () => { sketch.classList.remove('is-drawn'); scene?.rest(); };
    item.addEventListener('toggle', () => {
      stop();
      if (!item.open || reduced()) return;
      void sketch.getBoundingClientRect();
      sketch.classList.add('is-drawn'); scene?.play();
    });
    motionCallbacks.push(() => { if (reduced()) stop(); });
  });

  // Googly pairs beyond the hero follow the pointer and blink now and then. On the 404 they search first,
  // then settle on the way home; the sign-off winks when it is reached. Reduced motion keeps them still.
  const pairs = [...document.querySelectorAll('.googly-pair')];
  if (pairs.length) {
    const eyes = pairs.flatMap(pair => [...pair.querySelectorAll('.googly')]);
    const look = (x, y) => eyes.forEach(eye => {
      const r = eye.getBoundingClientRect(), dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 160) * r.width * .2;
      eye.style.setProperty('--gx', `${dx / d * k}px`); eye.style.setProperty('--gy', `${dy / d * k}px`);
    });
    const blink = (pair, times = 1) => { if (reduced()) return; for (let i = 0; i < times; i++) setTimeout(() => { pair.classList.add('is-blinking'); setTimeout(() => pair.classList.remove('is-blinking'), 120); }, i * 260); };
    let searching = false;
    addEventListener('pointermove', event => { if (!reduced() && !searching) look(event.clientX, event.clientY); }, {passive: true});
    pairs.forEach(pair => setInterval(() => { if (!document.hidden && Math.random() < .45) blink(pair); }, 3400));
    const lost = document.querySelector('.googly-lost'), home = document.querySelector('.not-found .text-link');
    if (lost && home && !reduced()) {
      searching = true;
      const r = lost.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const spots = [[-1, -.5], [1, -.7], [-.9, .6], [1, .4], [0, -1]];
      spots.forEach(([x, y], i) => setTimeout(() => look(cx + x * 420, cy + y * 320), 300 + i * 520));
      setTimeout(() => { const a = home.getBoundingClientRect(); look(a.left + a.width / 2, a.top + a.height / 2); blink(lost); searching = false; }, 400 + spots.length * 520);
    }
    const signOff = document.querySelector('.sign-off .googly-pair');
    if (signOff && 'IntersectionObserver' in window) new IntersectionObserver((entries, watch) => {
      if (!entries[0].isIntersecting) return; watch.disconnect(); setTimeout(() => blink(signOff, 2), 400);
    }, {threshold: 1}).observe(signOff);
  }

  // Bulls and Cows plays one tiny game the first time it is read: three scored guesses crack 4271.
  const code = document.querySelector('.code-break');
  if (code && 'IntersectionObserver' in window) {
    const tiles = [...code.querySelectorAll('b')], score = code.querySelector('.code-score'), guesses = code.dataset.guesses.split(' '), secret = guesses[guesses.length - 1];
    const show = (guess, flip) => {
      let bulls = 0, cows = 0;
      [...guess].forEach((digit, i) => {
        const bull = digit === secret[i], cow = !bull && secret.includes(digit);
        bulls += bull; cows += cow;
        tiles[i].textContent = digit; tiles[i].className = bull ? 'is-bull' : cow ? 'is-cow' : '';
        if (flip && tiles[i].animate) tiles[i].animate([{transform: 'rotateX(90deg)'}, {transform: 'none'}], {duration: 360, delay: i * 70, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'backwards'});
      });
      score.textContent = bulls === 4 ? '4 bulls' : `${bulls} bull${bulls === 1 ? '' : 's'}, ${cows} cow${cows === 1 ? '' : 's'}`;
    };
    if (!reduced()) {
      tiles.forEach(tile => { tile.textContent = ''; tile.className = ''; }); score.textContent = '';
      new IntersectionObserver((entries, watch) => {
        if (!entries[0].isIntersecting) return; watch.disconnect();
        guesses.forEach((guess, i) => setTimeout(() => show(guess, !reduced()), 300 + i * 1100));
      }, {threshold: 1}).observe(code);
    }
    motionCallbacks.push(() => { if (reduced()) show(secret, false); });
  }

  // The hero arrow bobs twice after a few idle seconds at the top of the page, once per visit.
  const explore = document.querySelector('.primary-link[href="#work"]');
  if (explore && !reduced()) {
    const nudge = setTimeout(() => { if (scrollY < 40 && !reduced()) explore.classList.add('is-nudging'); }, 3500);
    addEventListener('scroll', () => clearTimeout(nudge), {once: true, passive: true});
    explore.addEventListener('animationend', () => explore.classList.remove('is-nudging'));
  }

  // Case-study contents: a quiet rail beside the story on wide screens, marking the section being read.
  const contents = document.querySelector('.case-contents');
  if (contents) {
    const links = [...contents.querySelectorAll('a')];
    const sections = links.map(link => document.querySelector(link.hash));
    const header = document.querySelector('.site-header');
    const measure = () => root.style.setProperty('--page-offset', `${header.getBoundingClientRect().height + 20}px`);
    let frame = 0;
    const track = () => {
      frame = 0;
      let active = 0;
      sections.forEach((section, i) => { if (section && section.getBoundingClientRect().top <= innerHeight * .4) active = i; });
      links.forEach((link, i) => { if (i === active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(track); };
    addEventListener('scroll', schedule, {passive: true});
    addEventListener('resize', () => { measure(); schedule(); }, {passive: true});
    measure(); track();
  }

  // A damped spring gives larger surfaces weight without tying them to scroll speed.
  // Content stays visible if animation, observers or JavaScript are unavailable.
  const surfaceAnimations = new Set();
  const settleFrames = Array.from({length: 61}, (_, i) => {
    const t = i / 60 * .65;
    const damping = 10, frequency = 13;
    const displacement = Math.exp(-damping * t) * (Math.cos(frequency * t) + damping / frequency * Math.sin(frequency * t));
    return {transform: `translateY(${i === 60 ? 0 : displacement * 22}px)`, offset: i / 60};
  });
  if ('IntersectionObserver' in window && Element.prototype.animate) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (reduced()) return;
        const animation = entry.target.animate(settleFrames, {duration: 650, easing: 'linear'});
        surfaceAnimations.add(animation);
        animation.finished.catch(() => {}).finally(() => surfaceAnimations.delete(animation));
      });
    }, {threshold: .15});
    document.querySelectorAll('.case-product .gallery-panels, .case-page .result-panel').forEach(el => observer.observe(el));
  }
  motionCallbacks.push(() => { if (reduced()) surfaceAnimations.forEach(animation => animation.cancel()); });

  // Reveals: text blocks rise into place on the gentle spring the first time they're read, a beat apart
  // when several arrive together, and the big section titles come into focus. Figures marked data-play
  // run their own CSS sequence instead. Only what starts below the first screen is armed, so nothing
  // already in view flickers; print shows it all.
  const rising = '.cinema-story > :not([data-play]), .sound-story > :not([data-play]), .mri-heading > p, .mri-more, .research-opening > p, .research-item, .other-work > h2, .other-work article, .hobbies-heading > p, .contact-section > p:not(.sign-off), .case-section-title, .case-prose > :not([data-play]), .chapter-intro > *, .system-section .container > :is(.chapter-label, h2, .system-lead), .decisions-grid > div, .product-principles > div, .evaluation-section > :is(.chapter-label, h2), .evaluation-intro > *, .research-intro > *, .engineering-grid > article, .methodology, .case-next > div, .case-next-actions';
  const kinds = [
    {selector: rising, armed: 'rise-armed', playing: 'is-rising', last: 'translate'},
    {selector: '#sound-title, #mri-title, #research-title, #resume-title, #hobbies-title, #contact-title', armed: 'focus-armed', playing: 'is-focusing', last: 'scale'},
  ];
  if ('IntersectionObserver' in window && !reduced()) {
    const armed = new Map();
    const settle = event => {
      const el = event.currentTarget, kind = armed.get(el);
      if (event.propertyName !== kind.last) return;
      el.removeEventListener('transitionend', settle);
      el.classList.remove(kind.playing);
      el.style.removeProperty('--rise-delay');
      armed.delete(el);
    };
    const observer = new IntersectionObserver(entries => {
      let beat = 0;
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target, kind = armed.get(el);
        observer.unobserve(el);
        if (!kind) {
          armed.delete(el);
          el.classList.replace('play-armed', 'is-playing');
          return;
        }
        el.style.setProperty('--rise-delay', Math.min(beat++, 5) * 85 + 'ms');
        el.addEventListener('transitionend', settle);
        el.classList.add(kind.playing);
        el.classList.remove(kind.armed);
      });
    }, {rootMargin: '0px 0px -8% 0px'});
    document.querySelectorAll(`${kinds.map(kind => kind.selector)}, [data-play]`).forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight || el.style.viewTransitionName) return;
      const kind = kinds.find(kind => el.matches(kind.selector));
      el.classList.add(kind ? kind.armed : 'play-armed');
      armed.set(el, kind);
      observer.observe(el);
    });
    motionCallbacks.push(() => {
      if (!reduced()) return;
      armed.forEach((kind, el) => { observer.unobserve(el); el.classList.remove('play-armed', ...kinds.map(kind => kind.armed)); });
      armed.clear();
    });
  }

  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#primary-nav');
  const compact = matchMedia('(max-width: 560px)');
  const closeMenu = (restoreFocus = false) => {
    menu?.setAttribute('aria-expanded', 'false');
    if (menu) menu.textContent = 'Menu';
    if (nav) nav.dataset.open = 'false';
    if (restoreFocus) menu?.focus();
  };
  const syncMenu = () => { if (menu) menu.hidden = !compact.matches; closeMenu(); };
  syncMenu(); compact.addEventListener('change', syncMenu);
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? 'Close' : 'Menu';
    nav.dataset.open = String(open);
  });
  nav?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (menu?.getAttribute('aria-expanded') === 'true' && !event.target.closest('.nav-wrap')) closeMenu();
  });
  document.addEventListener('focusin', event => {
    if (menu?.getAttribute('aria-expanded') === 'true' && !event.target.closest('.nav-wrap')) closeMenu();
  });
  document.querySelectorAll('.copy-email').forEach(button => {
    if (!navigator.clipboard?.writeText) return;
    button.hidden = false;
    button.addEventListener('click', async () => {
      const status = document.querySelector('.copy-status');
      button.disabled = true;
      try {
        await navigator.clipboard.writeText(button.dataset.email);
        if (status) status.textContent = 'Email address copied.';
      } catch (_) {
        if (status) status.textContent = 'Could not copy. Select the address above, or open the email link.';
      } finally { button.disabled = false; }
    });
  });
})();
