// The 30-second cut, home page only: a silent trailer for visitors short on time. The hero's button opens a
// full-screen dialog that cuts through real pieces of this page, one line each: the CineMatch posters, the
// SoundVector queue, the MRI scan, the research topics, then the resume and contact. Shots advance on a timer;
// Pause, Next and Close stay visible, a tap or the arrow keys step, Space pauses and Escape leaves. With reduced
// motion the shots cut without moving and the scan keeps its still frame. The button stays hidden without this
// script, so the page never offers what it can't play.
(() => {
  const button = document.querySelector('[data-trailer]');
  if (!button || typeof HTMLDialogElement !== 'function') return;
  const reduced = () => document.documentElement.dataset.reduceMotion === 'true';
  const eyes = '<span class="googly-pair" aria-hidden="true"><span class="googly"><i></i></span><span class="googly"><i></i></span></span>';
  const timing = [3.5, 6, 6, 6, 5.5, 0]; // seconds per shot; the last one holds
  const total = timing.reduce((a, b) => a + b, 0);
  let dialog, shots, video, pause, next, status, index = 0, elapsed = 0, last = 0, frame = 0, paused = false, refocus = true;

  const build = () => {
    const posters = [...document.querySelectorAll('.film-poster img')].map(img => `<img src="${img.currentSrc || img.src}" alt="" width="240" height="360">`).join('');
    const resume = document.querySelector('.resume-download')?.getAttribute('href') || '/resume/';
    dialog = document.createElement('dialog');
    dialog.className = 'trailer';
    dialog.setAttribute('aria-label', 'The 30-second cut');
    dialog.innerHTML = `<div class="trailer-stage">
      <section class="trailer-shot shot-name"><p class="trailer-name">R${eyes}p Yaswanth</p><p class="trailer-sub">Research engineer at the University of Florida.</p></section>
      <section class="trailer-shot shot-cinema"><div class="trailer-reel" aria-hidden="true"><div>${posters}${posters}</div></div><p class="trailer-kicker">CineMatch</p><p class="trailer-line">1.37M movie titles.<br>Searched by meaning.</p><p class="trailer-sub">Movie discovery across languages.</p></section>
      <section class="trailer-shot shot-sound"><div class="trailer-queue" aria-hidden="true"></div><p class="trailer-kicker">SoundVector</p><p class="trailer-line">Your next song.<br>With a reason.</p><p class="trailer-sub">Music discovery shaped by your listening, across 899K tracks.</p></section>
      <section class="trailer-shot shot-mri"><figure class="trailer-scan" aria-hidden="true"><video muted loop playsinline preload="auto"></video><figcaption><span>Ground truth</span><span>Rebuilt</span><span>Error</span></figcaption></figure><p class="trailer-kicker">MRI super-resolution</p><p class="trailer-line">A missing slice, rebuilt.</p><p class="trailer-sub">28.18 dB, SwinIR’s mean reconstruction score across 8,587 test slices.</p></section>
      <section class="trailer-shot shot-research"><p class="trailer-kicker">Now, at UF’s Smart Autonomy Lab</p><p class="trailer-line"><span>Binary code similarity.</span><span>Cross-embodiment robot learning.</span><span>Vision-language-action systems.</span></p></section>
      <section class="trailer-shot shot-end"><p class="trailer-eyes">${eyes}</p><p class="trailer-line">Research engineer.<br>From model to product.</p><p class="trailer-actions"><a class="trailer-primary" href="${resume}">Download resume</a><a href="#contact" data-leave>Get in touch</a><a href="#work" data-leave>See the work</a></p></section>
    </div>
    <div class="trailer-bar" aria-hidden="true"><i></i></div>
    <button class="trailer-close" type="button">Close</button>
    <div class="trailer-controls"><button type="button" data-pause autofocus>Pause</button><button type="button" data-next>Next</button></div>
    <p class="visually-hidden" aria-live="polite"></p>`;
    document.body.append(dialog);
    shots = [...dialog.querySelectorAll('.trailer-shot')];
    pause = dialog.querySelector('[data-pause]');
    next = dialog.querySelector('[data-next]');
    status = dialog.querySelector('[aria-live]');
    // The queue and the scan are the page's own: the queue is cloned finished, the scan plays the same file.
    const queue = document.querySelector('.sound-queue')?.cloneNode(true);
    if (queue) {
      queue.removeAttribute('role'); queue.removeAttribute('aria-label'); queue.removeAttribute('data-queue');
      queue.classList.remove('is-armed');
      queue.querySelectorAll('.queue-row').forEach((row, i) => { row.className = 'queue-row' + (i ? '' : ' is-current'); row.style.setProperty('--r', i); });
      queue.querySelectorAll('.queue-wave span').forEach(bar => bar.style.removeProperty('transition-delay'));
      dialog.querySelector('.trailer-queue').append(queue);
    }
    video = dialog.querySelector('video');
    const source = document.querySelector('.mri-volume video');
    if (source) { video.poster = source.poster; video.src = source.currentSrc || source.getAttribute('src'); }

    pause.addEventListener('click', () => setPaused(!paused));
    next.addEventListener('click', () => show(index === shots.length - 1 ? 0 : index + 1));
    dialog.querySelector('.trailer-close').addEventListener('click', () => dialog.close());
    dialog.querySelectorAll('[data-leave]').forEach(link => link.addEventListener('click', () => { refocus = false; dialog.close(); }));
    dialog.querySelector('.trailer-stage').addEventListener('click', event => {
      if (!event.target.closest('a, button') && index < shots.length - 1) show(index + 1);
    });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight' && index < shots.length - 1) show(index + 1);
      else if (event.key === 'ArrowLeft' && index > 0) show(index - 1);
      else if (event.key === ' ' && !event.target.closest('a, button')) setPaused(!paused);
      else return;
      event.preventDefault();
    });
    dialog.addEventListener('close', () => {
      cancelAnimationFrame(frame); video.pause();
      document.documentElement.classList.remove('trailer-open');
      if (refocus) button.focus({preventScroll: true});
      refocus = true;
    });
    document.addEventListener('motionchange', () => { if (reduced()) video.pause(); else if (dialog.open && index === 3 && !paused) video.play().catch(() => {}); });
  };

  const before = i => timing.slice(0, i).reduce((a, b) => a + b, 0);
  const paint = () => dialog.style.setProperty('--p', Math.min(1, (before(index) + elapsed) / total).toFixed(4));
  const setPaused = value => {
    paused = value;
    pause.textContent = paused ? 'Play' : 'Pause';
    dialog.classList.toggle('is-paused', paused);
    if (index === 3 && !reduced()) paused ? video.pause() : video.play().catch(() => {});
  };
  const show = i => {
    index = i; elapsed = 0;
    shots.forEach((shot, n) => shot.classList.toggle('is-on', n === index));
    if (index === 3 && !reduced() && !paused) { video.currentTime = 0; video.play().catch(() => {}); } else video.pause();
    next.textContent = index === shots.length - 1 ? 'Replay' : 'Next';
    status.textContent = shots[index].innerText.replace(/\s+/g, ' ').trim();
    paint();
  };
  const tick = now => {
    frame = requestAnimationFrame(tick);
    const step = Math.min(.1, (now - last) / 1000);
    last = now;
    if (paused || !timing[index]) return;
    elapsed += step; paint();
    if (elapsed >= timing[index]) show(index + 1);
  };
  const open = () => {
    if (!dialog) build();
    document.documentElement.classList.add('trailer-open');
    dialog.showModal();
    setPaused(false); show(0);
    cancelAnimationFrame(frame);
    last = performance.now(); frame = requestAnimationFrame(tick);
  };

  button.hidden = false;
  button.addEventListener('click', open);
})();
