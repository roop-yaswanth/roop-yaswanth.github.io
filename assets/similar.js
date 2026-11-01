// More like this, home page only: pick one of the nine films and the row shows CineMatch's own first four
// suggestions for it, from the data the build inlines. The old picks lift away, the new ones rise in turn once
// their posters have decoded, and a pointer resting on a film fetches its posters early. Reduced motion swaps
// them in place. The build renders the default pick, so the row is complete without this script.
(() => {
  const root = document.querySelector('[data-similar]');
  if (!root) return;
  const data = JSON.parse(root.querySelector('[data-similar-data]').textContent);
  const reduced = () => document.documentElement.dataset.reduceMotion === 'true';
  const seeds = [...root.querySelectorAll('[data-seed]')];
  const name = root.querySelector('.similar-seed');
  const cards = [...root.querySelectorAll('.similar-results li')];
  const status = root.querySelector('[data-similar-status]');
  const sizes = cards[0].querySelector('img').sizes;
  const fetched = new Set();
  const preload = key => {
    if (fetched.has(key)) return;
    fetched.add(key);
    data[key].films.forEach(film => { const img = new Image(); img.sizes = sizes; img.srcset = film.srcset; });
  };
  let current = root.querySelector('[aria-pressed="true"]').dataset.seed, turn = 0;
  const fill = key => {
    name.textContent = data[key].title;
    data[key].films.forEach((film, i) => {
      const img = cards[i].querySelector('img');
      img.srcset = film.srcset; img.src = film.src;
      cards[i].querySelector('strong').textContent = film.title;
      cards[i].querySelector('span').textContent = film.meta;
    });
  };
  const pick = button => {
    const key = button.dataset.seed;
    if (key === current) return;
    current = key;
    const mine = ++turn;
    seeds.forEach(seed => seed.setAttribute('aria-pressed', String(seed === button)));
    status.textContent = `If you loved ${data[key].title}, CineMatch suggests ${data[key].films.map(f => f.title).join(', ')}.`;
    if (reduced()) { root.classList.remove('is-leaving', 'is-entering'); fill(key); return; }
    root.classList.add('is-leaving');
    setTimeout(() => {
      if (mine !== turn) return;
      fill(key);
      const ready = cards.map(card => card.querySelector('img').decode().catch(() => {}));
      Promise.race([Promise.all(ready), new Promise(done => setTimeout(done, 450))]).then(() => {
        if (mine !== turn) return;
        root.classList.add('is-entering');
        root.classList.remove('is-leaving');
        void root.offsetWidth;
        root.classList.remove('is-entering');
      });
    }, 170);
  };
  seeds.forEach(seed => {
    seed.addEventListener('click', () => pick(seed));
    seed.addEventListener('pointerenter', () => preload(seed.dataset.seed));
    seed.addEventListener('focus', () => preload(seed.dataset.seed));
  });
  fetched.add(current);
  // On phones the films scroll sideways; start with the chosen one in view, beside the suggestions it explains.
  const strip = root.querySelector('.similar-seeds'), chosen = root.querySelector('[aria-pressed="true"]');
  if (strip.scrollWidth > strip.clientWidth) strip.scrollLeft += chosen.getBoundingClientRect().left - strip.getBoundingClientRect().left - parseFloat(getComputedStyle(strip).paddingLeft);
})();
