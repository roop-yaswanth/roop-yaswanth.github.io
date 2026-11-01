// The one-minute cut, home page only: a silent trailer for visitors short on time. The hero's button opens a
// full-screen dialog built from the page's <template data-trailer-cut>: the name with the hero's own eyes, each
// project's use, build, novelty and results beside a real piece of this page (the CineMatch posters, the
// SoundVector queue, the MRI scan), the research, the smaller projects, then education, certifications and
// skills with the resume and contact. Each shot's data-time sets its seconds and the last one holds. Pause, Next
// and Close stay visible, a tap or the arrow keys step, Space pauses and Escape leaves. With reduced motion the
// shots cut without moving and the scan keeps its still frame. The button stays hidden without this script,
// so the page never offers what it can't play.
(() => {
  const button = document.querySelector('[data-trailer]');
  const cut = document.querySelector('[data-trailer-cut]');
  if (!button || !cut || typeof HTMLDialogElement !== 'function') return;
  const reduced = () => document.documentElement.dataset.reduceMotion === 'true';
  let dialog, shots, timing, total, video, pause, next, status, index = 0, elapsed = 0, last = 0, frame = 0, paused = false, refocus = true;

  const build = () => {
    dialog = document.createElement('dialog');
    dialog.className = 'trailer';
    dialog.setAttribute('aria-label', button.textContent.trim());
    dialog.innerHTML = `<div class="trailer-stage"></div>
    <div class="trailer-bar" aria-hidden="true"><i></i></div>
    <button class="trailer-close" type="button">Close</button>
    <div class="trailer-controls"><button type="button" data-pause autofocus>Pause</button><button type="button" data-next>Next</button></div>
    <p class="visually-hidden" aria-live="polite"></p>`;
    const stage = dialog.querySelector('.trailer-stage');
    stage.append(cut.content.cloneNode(true));
    document.body.append(dialog);
    shots = [...stage.querySelectorAll('.trailer-shot')];
    timing = shots.map(shot => parseFloat(shot.dataset.time) || 0);
    total = timing.reduce((a, b) => a + b, 0);
    pause = dialog.querySelector('[data-pause]');
    next = dialog.querySelector('[data-next]');
    status = dialog.querySelector('[aria-live]');
    // The eyes are the hero's o's, fitted by app.js to the font as rendered; the trailer borrows that fit.
    const name = document.querySelector('.identity-heading h1');
    if (name) ['cx', 'cy', 'w', 'h', 'p'].forEach(key => dialog.style.setProperty(`--eye-${key}`, getComputedStyle(name).getPropertyValue(`--eye-${key}`)));
    // The art is the page's own: the film posters, the queue cloned finished, the same scan file, the skills grid.
    const slot = key => stage.querySelector(`[data-slot="${key}"]`);
    const posters = [...document.querySelectorAll('.film-poster img')].map(img => `<img src="${img.currentSrc || img.src}" alt="" width="240" height="360">`).join('');
    slot('posters').innerHTML = `<div>${posters}${posters}</div>`;
    const queue = document.querySelector('.sound-queue')?.cloneNode(true);
    if (queue) {
      queue.removeAttribute('role'); queue.removeAttribute('aria-label'); queue.removeAttribute('data-queue');
      queue.classList.remove('is-armed');
      queue.querySelectorAll('.queue-row').forEach((row, i) => { row.className = 'queue-row' + (i ? '' : ' is-current'); row.style.setProperty('--r', i); });
      queue.querySelectorAll('.queue-wave span').forEach(bar => bar.style.removeProperty('transition-delay'));
      slot('queue').append(queue);
    }
    video = stage.querySelector('video');
    const source = document.querySelector('.mri-volume video');
    if (source) { video.poster = source.poster; video.src = source.currentSrc || source.getAttribute('src'); }
    document.querySelectorAll('.skill-group').forEach(group => {
      const line = document.createElement('p'), title = document.createElement('b');
      title.textContent = group.querySelector('h4').textContent;
      line.append(title, ' ' + [...group.querySelectorAll('.skill-tools span')].map(tool => tool.textContent).join(', '));
      slot('skills').append(line);
    });

    pause.addEventListener('click', () => setPaused(!paused));
    next.addEventListener('click', () => show(index === shots.length - 1 ? 0 : index + 1));
    dialog.querySelector('.trailer-close').addEventListener('click', () => dialog.close());
    dialog.querySelectorAll('[data-leave]').forEach(link => link.addEventListener('click', () => { refocus = false; dialog.close(); }));
    stage.addEventListener('click', event => {
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
    document.addEventListener('motionchange', () => { if (reduced()) video.pause(); else if (dialog.open && onScan() && !paused) video.play().catch(() => {}); });
  };

  const onScan = () => shots[index].contains(video);
  const before = i => timing.slice(0, i).reduce((a, b) => a + b, 0);
  const paint = () => dialog.style.setProperty('--p', Math.min(1, (before(index) + elapsed) / total).toFixed(4));
  const setPaused = value => {
    paused = value;
    pause.textContent = paused ? 'Play' : 'Pause';
    dialog.classList.toggle('is-paused', paused);
    if (onScan() && !reduced()) paused ? video.pause() : video.play().catch(() => {});
  };
  const show = i => {
    index = i; elapsed = 0;
    shots.forEach((shot, n) => shot.classList.toggle('is-on', n === index));
    shots[index].scrollTop = 0;
    if (onScan() && !reduced() && !paused) { video.currentTime = 0; video.play().catch(() => {}); } else video.pause();
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
