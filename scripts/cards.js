/* Homepage cards use the same live sources as the full calendar. */
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('cardsContainer');
  if (!container) return;
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
  ));
  const safeBookingURL = value => {
    try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
    catch { return ''; }
  };
  const photos = [
    { src: '/assets/img/Dynafit-T2G-Innsbruck-104.webp', alt: 'Runners exploring the trails around Innsbruck' },
    { src: '/assets/img/IMG_4709.jpg', alt: 'Good company on a community trail run' },
    {
      src: '/assets/img/responsive/Dynafit-T2G-Innsbruck-70.jpg-640.jpg',
      srcset: '/assets/img/responsive/Dynafit-T2G-Innsbruck-70.jpg-320.jpg 320w, /assets/img/responsive/Dynafit-T2G-Innsbruck-70.jpg-640.jpg 640w, /assets/img/responsive/Dynafit-T2G-Innsbruck-70.jpg-960.jpg 960w',
      alt: 'DNA Trails runners climbing a forest path together',
      width: 640, height: 962
    }
  ];
  const dateFormat = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Vienna'
  });
  const timeFormat = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Vienna'
  });
  try {
    if (typeof loadSources !== 'function') throw new Error('Calendar feed unavailable');
    let timer;
    let allEvents;
    try {
      allEvents = await Promise.race([
        loadSources(),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Calendar feed timed out')), 15000); })
      ]);
    } finally { clearTimeout(timer); }
    const now = new Date();
    const events = allEvents
      .filter(event => Number.isFinite(+new Date(event.start)) && new Date(event.end) >= now)
      .sort((a, b) => new Date(a.start) - new Date(b.start)).slice(0, 3);
    if (!events.length) {
      container.innerHTML = '<p class="events-status" role="status">No upcoming events to show right now. Check the <a href="/calendar/">full calendar</a> or WhatsApp for the latest plans.</p>';
      return;
    }
    container.innerHTML = events.map((event, index) => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      const bookingURL = safeBookingURL(event.bookingUrl);
      const photo = photos[index];
      return `<article class="run-card" aria-labelledby="run-title-${index}">
        <div class="run-photo"><img src="${photo.src}" alt="${photo.alt}" width="${photo.width || 1000}" height="${photo.height || 900}"${photo.srcset ? ` srcset="${photo.srcset}" sizes="(max-width: 767px) 90vw, 45vw"` : ''} loading="lazy" decoding="async"></div>
        <div class="run-copy">
          <div class="run-date"><time datetime="${start.toISOString()}">${escapeHTML(dateFormat.format(start))} &middot; ${timeFormat.format(start)}</time><span class="run-number" aria-hidden="true">0${index + 1}</span></div>
          <span class="eyebrow">${escapeHTML(event.type || 'Community')}</span>
          <h3 id="run-title-${index}">${escapeHTML(event.title || 'Community run')}</h3>
          <div class="run-description event-description">${EventDescription.render(event.beschrijving || 'Good trails and good company. Join us for a run around Innsbruck.')}</div>
          <dl class="run-details"><div><dt>Meeting point</dt><dd>${escapeHTML(event.startplek || 'See calendar for details')}</dd></div><div><dt>Time &middot; Innsbruck</dt><dd>${timeFormat.format(start)} &ndash; ${timeFormat.format(end)}</dd></div>${event.organizer ? `<div><dt>Hosted by</dt><dd>${escapeHTML(event.organizer)}</dd></div>` : ''}</dl>
          <div class="run-action">${bookingURL
            ? `<a class="text-link" href="${escapeHTML(bookingURL)}" target="_blank" rel="noopener noreferrer">Details &amp; registration <span aria-hidden="true">↗</span></a>`
            : '<span>No registration required</span><a class="text-link" href="/calendar/">View calendar <span aria-hidden="true">↗</span></a>'}</div>
        </div>
      </article>`;
    }).join('');
    document.dispatchEvent(new Event('homepage:events-ready'));
  } catch (error) {
    console.error('Unable to load upcoming events:', error);
    container.innerHTML = '<p class="events-status" role="status">We could not load the upcoming events. Try the <a href="/calendar/">full calendar</a> or our WhatsApp channel for updates.</p>';
  } finally { container.setAttribute('aria-busy', 'false'); }
});
