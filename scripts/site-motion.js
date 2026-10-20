/* Small, scroll-linked details. Reading, maps, and forms stay still. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 768px)');
  const seen = new WeakSet();
  let photos = [];
  let queued = false;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .06 });

  function refresh() {
    document.querySelectorAll('[data-reveal]').forEach((element, index) => {
      if (seen.has(element)) return;
      seen.add(element);
      // Never hide content that is already on screen when enhancement starts.
      if (reduced.matches || element.getBoundingClientRect().top < innerHeight) return;
      element.classList.add('will-reveal');
      element.style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * 65}ms`);
      observer.observe(element);
    });
    photos = [...document.querySelectorAll('[data-drift]')];
    schedule();
  }
  function render() {
    queued = false;
    photos.forEach(photo => {
      const rect = photo.getBoundingClientRect();
      const limit = Math.min(28, rect.height * .075);
      const drift = reduced.matches || !desktop.matches ? 0 : Math.max(-limit, Math.min(limit, (innerHeight / 2 - rect.top - rect.height / 2) * .075));
      photo.style.setProperty('--drift', `${drift.toFixed(1)}px`);
    });
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(render);
  }
  reduced.addEventListener('change', () => {
    if (reduced.matches) document.querySelectorAll('.will-reveal').forEach(element => element.classList.add('is-visible'));
    schedule();
  });
  desktop.addEventListener('change', schedule);
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('load', schedule, { once: true });
  document.addEventListener('routes:updated', refresh);

  document.querySelectorAll('.faq-list details').forEach(details => {
    details.addEventListener('toggle', () => {
      if (details.open && !reduced.matches) details.querySelector('p')?.animate([
        { opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 260, easing: 'ease-out' });
    });
  });
  const grid = document.getElementById('calendarGrid');
  if (grid) {
    const agenda = document.getElementById('mobileListView');
    // One animation for the completed month render, rather than per-day movement.
    new MutationObserver(() => {
      if (reduced.matches) return;
      const target = grid.getClientRects().length ? grid : agenda;
      target.getAnimations().forEach(animation => animation.cancel());
      target.animate([{ opacity: .4, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 320, easing: 'ease-out' });
    }).observe(grid, { childList: true });
  }
  refresh();
})();
