// Hobbies: three endless loops, home page only. Each plays only while on screen and the tab is visible; a
// tap skips ahead and names what is now showing. Reduced motion keeps each one still, and a tap still steps
// through. The reduced-motion choice comes from app.js, which mirrors it on <html> and announces changes.
(() => {
  const shelf = document.querySelector('[data-feed]');
  if (!shelf) return;
  const reduced = () => document.documentElement.dataset.reduceMotion === 'true';
  const hobbyStatus = document.querySelector('.hobby-status');
  const setImage = (img, srcset) => { img.srcset = srcset; img.src = srcset.split(' ')[0]; };
  const preload = (srcset, sizes) => { const img = new Image(); img.sizes = sizes; img.srcset = srcset; };
  const restartBar = stage => { stage.classList.remove('is-running'); void stage.offsetWidth; if (!reduced()) stage.classList.add('is-running'); };
  const hobbyViews = {
    anime(stage, items) {
      const art = stage.querySelector('.tv-art'), title = stage.querySelector('.tv-title');
      const next = stage.querySelector('.tv-next strong'), poster = stage.querySelector('.tv-next img');
      return {
        show(n, items) {
          const a = items[n], b = items[(n + 1) % items.length];
          const swap = () => { setImage(art, a.art); title.textContent = a.title; next.textContent = b.title; setImage(poster, b.poster); stage.classList.remove('is-cut', 'is-next'); };
          if (reduced()) swap(); else { stage.classList.add('is-cut'); setTimeout(swap, 180); }
          preload(b.art, art.sizes); preload(b.poster, poster.sizes);
          stage.setAttribute('aria-label', `Anime, now playing ${a.title}. Skip to the next one.`);
          return a.title;
        },
        tick(t, dur) { stage.classList.toggle('is-next', t > dur * .62); }
      };
    },
    music(stage, items) {
      const cover = stage.querySelector('.player-cover'), track = stage.querySelector('.player-track'), artist = stage.querySelector('.player-artist');
      return {
        show(n, items) {
          const a = items[n];
          const swap = () => { setImage(cover, a.cover); track.textContent = a.track; artist.textContent = a.artist; };
          if (reduced() || !cover.animate) swap();
          else cover.animate([{transform: 'none', opacity: 1}, {transform: 'translateX(-14px) scale(.96)', opacity: 0}], {duration: 170, easing: 'ease-in'}).finished
            .then(() => { swap(); cover.animate([{transform: 'translateX(14px) scale(.96)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 420, easing: 'cubic-bezier(.2,.9,.3,1.15)'}); });
          preload(items[(n + 1) % items.length].cover, cover.sizes);
          stage.setAttribute('aria-label', `Music, now playing ${a.track} by ${a.artist}. Skip to the next song.`);
          return `${a.track}, ${a.artist}`;
        },
        tick() {}
      };
    },
    tinkering(stage, items) {
      const title = stage.querySelector('.keynote-title'), marks = stage.querySelector('.keynote-marks');
      return {
        show(n) {
          const a = items[n], swap = () => { title.textContent = a.title; marks.innerHTML = a.marks; };
          if (reduced() || !title.animate) swap();
          else Promise.all([title, marks].map(el => el.animate([{opacity: 1, transform: 'none'}, {opacity: 0, transform: 'translateY(-8px)'}], {duration: 200, easing: 'ease-in', fill: 'forwards'}).finished))
            .then(() => { swap(); [title, marks].forEach((el, i) => el.animate([{opacity: 0, transform: 'translateY(10px)', filter: 'blur(4px)'}, {opacity: 1, transform: 'none', filter: 'none'}], {duration: 560, delay: i * 90, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards'})); });
          stage.setAttribute('aria-label', `Tinkering, now on stage: ${a.title} Show the next one.`);
          return a.title;
        },
        tick() {}
      };
    }
  };
  let feed = null;
  const loadFeed = () => feed ||= fetch(shelf.dataset.feed).then(r => r.json()).catch(() => null);
  document.querySelectorAll('[data-hobby]').forEach(stage => {
    let items = null, view = null;
    const dur = parseFloat(getComputedStyle(stage).getPropertyValue('--dur')) * 1000 || 4000;
    let n = 0, started = 0, frame = 0, onScreen = false;
    const ready = () => items ? Promise.resolve(true) : loadFeed().then(data => {
      if (!data || items) return !!items;
      items = data[stage.dataset.hobby]; view = hobbyViews[stage.dataset.hobby](stage, items); return true;
    });
    const advance = () => { n = (n + 1) % items.length; const name = view.show(n, items); started = performance.now(); restartBar(stage); return name; };
    const loop = now => {
      frame = 0;
      if (!onScreen || document.hidden || reduced()) return;
      const t = now - started;
      if (t >= dur) advance(); else view.tick(t, dur);
      frame = requestAnimationFrame(loop);
    };
    const run = () => { stage.classList.toggle('is-live', onScreen && !reduced()); if (!frame && onScreen && !reduced()) { started = performance.now(); restartBar(stage); frame = requestAnimationFrame(loop); } };
    stage.addEventListener('click', () => ready().then(ok => { if (!ok) return; const name = advance(); if (hobbyStatus) hobbyStatus.textContent = `Now showing ${name}.`; }));
    if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; ready().then(ok => { if (ok) run(); }); }, {threshold: .4}).observe(stage);
    document.addEventListener('visibilitychange', () => { if (items) run(); });
    document.addEventListener('motionchange', () => { if (reduced()) { stage.classList.remove('is-running', 'is-live', 'is-next'); } if (items) run(); });
  });
})();
