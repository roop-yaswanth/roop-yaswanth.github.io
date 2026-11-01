// The MRI scan plays slice by slice while it is in view and stops when it leaves. The poster is a finished
// frame, so the figure reads without scripts; this swaps the native controls for one play/pause button.
// Reduced motion never starts it, but the button still plays it on request. Home page only.
(() => {
  const figure = document.querySelector('[data-volume]');
  if (!figure) return;
  const video = figure.querySelector('video'), button = figure.querySelector('.volume-play'), label = button.querySelector('span');
  const reduced = () => document.documentElement.dataset.reduceMotion === 'true';
  let visible = false, choice = null;  // the visitor's play or pause; until then motion settings decide
  const sync = () => {
    if (visible && !document.hidden && (choice ?? !reduced())) video.play().catch(() => {});
    else video.pause();
  };
  const show = () => {
    const playing = !video.paused;
    figure.dataset.playing = String(playing);
    label.textContent = playing ? 'Pause' : 'Play';
    button.setAttribute('aria-label', playing ? 'Pause the scan' : 'Play the scan');
  };
  video.controls = false;
  button.hidden = false;
  video.addEventListener('play', show);
  video.addEventListener('pause', show);
  button.addEventListener('click', () => {
    choice = video.paused;
    if (choice) video.play().catch(() => {}); else video.pause();
  });
  show();
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, {threshold: .35}).observe(video);
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('motionchange', () => { choice = null; sync(); });
})();
