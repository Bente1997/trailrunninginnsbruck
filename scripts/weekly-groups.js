(() => {
  const section = document.getElementById('weekly-groups');
  if (!section) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 768px)');
  const track = section.querySelector('.group-track');
  const cards = [...track.querySelectorAll('.group-card')];
  function gentleScroller(rail) {
    let animation;
    let settleTimer;
    function settle() {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => rail.classList.remove('is-scrolling'), 220);
    }
    function cancel() {
      cancelAnimationFrame(animation);
      settle();
    }
    rail.addEventListener('pointerdown', cancel, { passive: true });
    rail.addEventListener('wheel', event => {
      // Preserve vertical page scrolling and browser zoom gestures.
      if (event.ctrlKey || event.defaultPrevented) return;
      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      if (!horizontal && !event.shiftKey) return;
      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rail.clientWidth : 1;
      const delta = (horizontal ? event.deltaX : event.deltaY) * scale * .4;
      const limit = rail.scrollWidth - rail.clientWidth;
      if (!delta || limit <= 2 || (delta < 0 && rail.scrollLeft <= 0) || (delta > 0 && rail.scrollLeft >= limit - 1)) return;
      event.preventDefault();
      cancelAnimationFrame(animation);
      rail.classList.add('is-scrolling');
      rail.scrollLeft += delta;
      settle();
    }, { passive: false });
    return target => {
      cancelAnimationFrame(animation);
      clearTimeout(settleTimer);
      const start = rail.scrollLeft;
      const end = Math.max(0, Math.min(target, rail.scrollWidth - rail.clientWidth));
      rail.classList.add('is-scrolling');
      if (reduced.matches) {
        rail.scrollLeft = end;
        rail.classList.remove('is-scrolling');
        return;
      }
      const began = performance.now();
      function step(now) {
        const progress = Math.min(1, (now - began) / 900);
        const eased = (1 - Math.cos(Math.PI * progress)) / 2;
        rail.scrollLeft = start + (end - start) * eased;
        if (progress < 1) animation = requestAnimationFrame(step);
        else settle();
      }
      animation = requestAnimationFrame(step);
    };
  }
  const scrollGroups = gentleScroller(track);
  const trails = cards.map(card => {
    const path = card.querySelector('.group-trail-line');
    return { card, path, dot: card.querySelector('.group-trail-dot'), length: path.getTotalLength() };
  });
  const controls = section.querySelector('.group-controls');
  const previous = controls.querySelector('[data-group-prev]');
  const next = controls.querySelector('[data-group-next]');
  const position = controls.querySelector('[data-group-position]');
  let queued = false;
  const clamp = value => Math.max(0, Math.min(1, value));

  function render() {
    queued = false;
    const rect = track.getBoundingClientRect();
    const progress = reduced.matches ? 1 : clamp((innerHeight - rect.top) / (innerHeight + rect.height) * 1.5);
    trails.forEach(({ card, path, dot, length }, index) => {
      const distance = length * progress;
      path.style.strokeDasharray = String(length);
      path.style.strokeDashoffset = String(length - distance);
      const point = path.getPointAtLength(distance);
      dot.setAttribute('cx', point.x);
      dot.setAttribute('cy', point.y);
      const lift = reduced.matches || !desktop.matches ? 0 : (progress - .5) * (index === 1 ? -20 : 16);
      card.style.setProperty('--ticket-lift', `${lift.toFixed(1)}px`);
    });
    const overflow = track.scrollWidth > track.clientWidth + 2;
    controls.hidden = !overflow;
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    const step = cards[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap);
    const current = Math.min(cards.length, Math.round(track.scrollLeft / step) + 1);
    const label = `${current} / ${cards.length}`;
    if (position.textContent !== label) position.textContent = label;
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(render);
  }
  function move(direction) {
    const step = cards[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap);
    scrollGroups(track.scrollLeft + direction * step);
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });
  track.addEventListener('scroll', schedule, { passive: true });
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('load', schedule, { once: true });
  reduced.addEventListener('change', schedule);
  desktop.addEventListener('change', schedule);
  render();

  const feed = section.querySelector('.past-runs');
  const runTrack = feed.querySelector('.past-runs-track');
  const scrollRuns = gentleScroller(runTrack);
  const runCards = [...runTrack.querySelectorAll('.past-run')];
  const runToolbar = feed.querySelector('.past-runs-toolbar');
  const runPosition = feed.querySelector('[data-run-position]');
  const runToggle = feed.querySelector('[data-run-toggle]');
  const mouse = matchMedia('(hover: hover) and (pointer: fine)');
  const rotationDelay = 5000;
  let rotationTimer;
  let inView = false;
  let hovered = false;
  let focused = false;
  let userPaused = false;
  let rotationDirection = 1;

  function runStep() {
    return runCards[0].offsetWidth + parseFloat(getComputedStyle(runTrack).columnGap);
  }
  function currentRun() {
    return Math.max(0, Math.min(runCards.length - 1, Math.round(runTrack.scrollLeft / runStep())));
  }
  function updateRunControls() {
    runToolbar.hidden = runCards.length < 2;
    runToggle.hidden = !desktop.matches || !mouse.matches || reduced.matches;
    runToggle.textContent = userPaused ? 'Play' : 'Pause';
    runToggle.setAttribute('aria-label', userPaused ? 'Resume automatic rotation' : 'Pause automatic rotation');
    runPosition.setAttribute('aria-live', focused || userPaused ? 'polite' : 'off');
    const index = currentRun();
    const label = `${runCards[index].dataset.group} \u00b7 ${index + 1} / ${runCards.length}`;
    if (runPosition.textContent !== label) runPosition.textContent = label;
  }
  function stopRotation() { clearTimeout(rotationTimer); }
  function scheduleRotation() {
    stopRotation();
    if (runCards.length < 2 || !inView || hovered || focused || userPaused || document.hidden || !document.hasFocus() || !desktop.matches || !mouse.matches || reduced.matches) return;
    rotationTimer = setTimeout(() => {
      // Reverse at the ends so every automatic transition moves just one card.
      if (currentRun() === runCards.length - 1) rotationDirection = -1;
      else if (currentRun() === 0) rotationDirection = 1;
      moveRun(rotationDirection, false);
      scheduleRotation();
    }, rotationDelay);
  }
  function pauseForInteraction() {
    userPaused = true;
    stopRotation();
    updateRunControls();
  }
  function moveRun(direction, manual = true) {
    if (manual) pauseForInteraction();
    const index = (currentRun() + direction + runCards.length) % runCards.length;
    scrollRuns(index * runStep());
  }
  feed.querySelector('[data-run-prev]').addEventListener('click', () => moveRun(-1));
  feed.querySelector('[data-run-next]').addEventListener('click', () => moveRun(1));
  runToggle.addEventListener('click', () => {
    userPaused = !userPaused;
    if (!userPaused) focused = false; // Explicit Play can resume after keyboard interaction.
    updateRunControls();
    scheduleRotation();
  });
  runTrack.addEventListener('scroll', updateRunControls, { passive: true });
  runTrack.addEventListener('pointerdown', pauseForInteraction, { passive: true });
  runTrack.addEventListener('wheel', pauseForInteraction, { passive: true });
  feed.addEventListener('pointerenter', () => { hovered = true; stopRotation(); });
  feed.addEventListener('pointerleave', () => { hovered = false; scheduleRotation(); });
  feed.addEventListener('focusin', () => { focused = true; stopRotation(); updateRunControls(); });
  feed.addEventListener('focusout', event => {
    focused = feed.contains(event.relatedTarget);
    updateRunControls();
    scheduleRotation();
  });
  document.addEventListener('click', event => {
    const example = event.target.closest('.group-example');
    if (example && runCards.some(card => `#${card.id}` === example.getAttribute('href'))) pauseForInteraction();
  });
  document.addEventListener('visibilitychange', scheduleRotation);
  addEventListener('blur', stopRotation);
  addEventListener('focus', scheduleRotation);
  function refreshRuns() { updateRunControls(); scheduleRotation(); }
  addEventListener('resize', refreshRuns, { passive: true });
  reduced.addEventListener('change', refreshRuns);
  desktop.addEventListener('change', refreshRuns);
  mouse.addEventListener('change', refreshRuns);
  new IntersectionObserver(entries => {
    inView = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .35);
    scheduleRotation();
  }, { threshold: [0, .35] }).observe(runTrack);
  updateRunControls();
  runTrack.addEventListener('keydown', event => {
    if (event.target !== runTrack || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    moveRun(event.key === 'ArrowRight' ? 1 : -1);
  });
  feed.querySelector('.past-runs-hint').hidden = runTrack.querySelectorAll('.past-run').length < 2;
  function prepareFrames() {
    runTrack.querySelectorAll('iframe').forEach(frame => {
      if (frame.dataset.prepared) return;
      frame.dataset.prepared = 'true';
      const group = frame.closest('.past-run').dataset.group;
      frame.title = group ? `Past ${group} group run on Strava` : 'Past DNA Trails community run on Strava';
      frame.loading = frame.closest('.past-run') === runCards[0] ? 'eager' : 'lazy';
      const status = frame.closest('.past-run').querySelector('.strava-status');
      frame.addEventListener('load', () => { status.textContent = ''; }, { once: true });
    });
  }
  new MutationObserver(prepareFrames).observe(runTrack, { childList: true, subtree: true });
  function loadStrava() {
    const script = document.createElement('script');
    script.src = 'https://strava-embeds.com/embed.js';
    script.async = true;
    script.addEventListener('error', () => {
      runTrack.querySelectorAll('.strava-status').forEach(status => {
        status.textContent = 'Strava could not load here. You can still open the run below.';
      });
    }, { once: true });
    document.body.append(script);
  }
  // Give the initial page resources priority, then load Strava before visitors scroll here.
  if (document.readyState === 'complete') {
    loadStrava();
  } else {
    window.addEventListener('load', loadStrava, { once: true });
  }
})();
