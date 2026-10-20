(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 768px)');
  let cards = [];
  const leaders = [...document.querySelectorAll('.leader-card')];
  const leadersSection = document.querySelector('.leaders-section');
  const leadersHeading = document.querySelector('.leaders-heading');
  const smoothStep = value => {
    const progress = Math.max(0, Math.min(1, value));
    return progress * progress * (3 - 2 * progress);
  };
  let framePending = false;
  function render() {
    framePending = false;
    const height = window.innerHeight;
    const animate = !motion.matches && desktop.matches;
    if (leadersSection && leadersHeading) {
      let opacity = 1;
      if (animate) {
        const sectionRect = leadersSection.getBoundingClientRect();
        const headingRect = leadersHeading.getBoundingClientRect();
        const entrance = smoothStep((height - headingRect.top) / (height * .35));
        const progress = (height * .5 - sectionRect.top) / Math.max(1, sectionRect.height);
        // Let visitors read the introduction, then soften it as the portraits pass.
        const fade = smoothStep((progress - .1) / .65);
        opacity = entrance * (1 - fade);
      }
      leadersHeading.style.setProperty('--leaders-heading-opacity', opacity.toFixed(3));
    }
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const offset = animate ? Math.max(-45, Math.min(45, (height / 2 - rect.top - rect.height / 2) * .12)) : 0;
      card.style.setProperty('--photo-offset', `${offset.toFixed(1)}px`);
    });
    leaders.forEach((card, index) => {
      // Measure static layout so animation does not feed back into itself.
      const stack = card.parentElement;
      const top = stack.getBoundingClientRect().top + card.offsetTop;
      const offset = animate ? Math.max(-55, Math.min(55, (height / 2 - top) * (index % 2 ? .065 : .035))) : 0;
      card.style.setProperty('--leader-offset', `${offset.toFixed(1)}px`);
    });
  }
  function scheduleRender() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(render);
  }
  function refresh() {
    cards = [...document.querySelectorAll('.run-photo')];
    scheduleRender();
  }
  document.addEventListener('homepage:events-ready', refresh);
  window.addEventListener('scroll', scheduleRender, { passive: true });
  window.addEventListener('resize', scheduleRender, { passive: true });
  motion.addEventListener('change', scheduleRender);
  desktop.addEventListener('change', scheduleRender);
  window.addEventListener('load', scheduleRender, { once: true });

  refresh();
})();
