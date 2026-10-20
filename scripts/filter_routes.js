/* A single community route feed powers both cards and filters. */
(() => {
  const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSwyagCABpIe1kW1TdvPgtHbrS-V-MbSYZacFRw-lsIVrNtOsrRznVo5lw5pJ_i6YK79AYMWSE3JqlD/pub?gid=2063366174&single=true&output=csv';
  const container = document.getElementById('routesContainer');
  const count = document.getElementById('route-count');
  const filters = document.querySelector('.route-filters');
  let allRoutes = [];
  const photos = [
    {
      src: '/assets/img/responsive/PXL_20241109_090337105.jpg-960.jpg',
      srcset: '/assets/img/responsive/PXL_20241109_090337105.jpg-160.jpg 160w, /assets/img/responsive/PXL_20241109_090337105.jpg-480.jpg 480w, /assets/img/responsive/PXL_20241109_090337105.jpg-960.jpg 960w, /assets/img/responsive/PXL_20241109_090337105.jpg-1600.jpg 1600w',
      width: 960, height: 1275
    },
    {
      src: '/assets/img/responsive/IMG_4709.jpg-960.jpg',
      srcset: '/assets/img/responsive/IMG_4709.jpg-160.jpg 160w, /assets/img/responsive/IMG_4709.jpg-480.jpg 480w, /assets/img/responsive/IMG_4709.jpg-960.jpg 960w, /assets/img/responsive/IMG_4709.jpg-1600.jpg 1600w',
      width: 960, height: 1280
    },
    {
      src: '/assets/img/responsive/Dynafit-T2G-Innsbruck-89.webp-640.webp',
      srcset: '/assets/img/responsive/Dynafit-T2G-Innsbruck-89.webp-320.webp 320w, /assets/img/responsive/Dynafit-T2G-Innsbruck-89.webp-640.webp 640w, /assets/img/responsive/Dynafit-T2G-Innsbruck-89.webp-960.webp 960w',
      width: 640, height: 960
    }
  ];
  const fallbackPhoto = {
    src: '/assets/img/responsive/Dynafit-T2G-Innsbruck-51.webp-640.webp',
    srcset: '/assets/img/responsive/Dynafit-T2G-Innsbruck-51.webp-320.webp 320w, /assets/img/responsive/Dynafit-T2G-Innsbruck-51.webp-640.webp 640w, /assets/img/responsive/Dynafit-T2G-Innsbruck-51.webp-960.webp 960w',
    width: 640, height: 962
  };
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function safeURL(value) {
    try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
    catch { return ''; }
  }
  function embeddedURL(html) {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return safeURL(doc.querySelector('iframe')?.getAttribute('src'));
  }
  function addFilters(id, values, className) {
    const list = document.getElementById(id);
    list.replaceChildren();
    values.forEach((item, index) => {
      const li = document.createElement('li');
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox'; input.value = item.value; input.className = className; input.id = `${className}-${index}`;
      label.htmlFor = input.id;
      label.append(input, document.createTextNode(item.label)); li.append(label); list.append(li);
    });
  }
  const checked = className => [...filters.querySelectorAll(`.${className}:checked`)].map(input => input.value);
  function filteredRoutes() {
    const regions = checked('region-filter');
    const types = checked('type-filter');
    const lengths = checked('length-filter');
    const climbs = checked('elev-filter');
    return allRoutes.filter(route => {
      const distance = parseFloat(String(route['Distance (km)'] || '').replace(',', '.')) || 0;
      const elevation = parseFloat(String(route['Elevation (m)'] || '').replace(',', '.')) || 0;
      return (!regions.length || regions.includes(route.Region))
        && (!types.length || types.includes(route['Route Type']))
        && (!lengths.length || lengths.some(value => value === 'short' ? distance < 5 : value === 'medium' ? distance >= 5 && distance <= 10 : distance > 10))
        && (!climbs.length || climbs.some(value => value === 'low' ? elevation < 300 : value === 'medium' ? elevation >= 300 && elevation <= 600 : elevation > 600));
    });
  }
  function renderRoutes(routes) {
    container.replaceChildren();
    count.textContent = `${routes.length} ${routes.length === 1 ? 'route' : 'routes'}${routes.length !== allRoutes.length ? ` of ${allRoutes.length}` : ''} to explore`;
    if (!routes.length) {
      container.innerHTML = '<p class="events-status">No routes match those filters. Try a different combination or clear the filters.</p>';
    }
    routes.forEach((route, index) => {
      const name = route['Route Name'];
      const image = safeURL(route['Image URL']);
      const photo = photos[allRoutes.indexOf(route) % photos.length];
      const embed = embeddedURL(route['Embed Code']);
      const map = safeURL(route['Map Link']) || (embed ? embed.replace(/\/embed(?=\?|$)/, '') : '');
      const card = document.createElement('article');
      card.className = 'route-card'; card.setAttribute('data-reveal', '');
      card.innerHTML = `
        <div class="page-photo route-photo" data-drift><img src="${escapeHTML(image || photo.src)}" alt="${escapeHTML(image ? name : 'Trail scenery around Innsbruck')}" width="${image ? 1000 : photo.width}" height="${image ? 700 : photo.height}"${image ? '' : ` srcset="${photo.srcset}" sizes="(max-width: 767px) 90vw, 45vw"`} loading="lazy" decoding="async"></div>
        <div class="route-card-copy">
          <span class="eyebrow">${escapeHTML(route.Region || 'Around Innsbruck')} &middot; ${escapeHTML(route['Route Type'] || 'Trail')}</span>
          <h3>${escapeHTML(name)}</h3>
          <dl class="route-metrics"><div><dt>Distance</dt><dd>${escapeHTML(route['Distance (km)'] || '?')} km</dd></div><div><dt>Climbing</dt><dd>${escapeHTML(route['Elevation (m)'] || '?')} m D+</dd></div></dl>
          <p class="route-description">${escapeHTML(route.Description || '')}</p>
          ${map ? `<a class="text-link" href="${escapeHTML(map)}" target="_blank" rel="noopener noreferrer">Open route <span aria-hidden="true">&#8599;</span></a>` : ''}
          ${route['Submitted By'] ? `<p class="route-credit">Shared by ${escapeHTML(route['Submitted By'])}</p>` : ''}
        </div>`;
      if (embed) {
        const wrapper = document.createElement('div'); wrapper.className = 'route-map';
        const iframe = document.createElement('iframe'); iframe.src = embed; iframe.title = `Map of ${name}`;
        iframe.loading = 'lazy'; iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
        wrapper.append(iframe); card.append(wrapper);
      }
      card.querySelector('img').addEventListener('error', event => {
        event.target.sizes = '(max-width: 767px) 90vw, 45vw';
        event.target.srcset = fallbackPhoto.srcset;
        event.target.src = fallbackPhoto.src;
        event.target.width = fallbackPhoto.width;
        event.target.height = fallbackPhoto.height;
        event.target.alt = 'Trail scenery around Innsbruck';
      }, { once: true });
      container.append(card);
    });
    container.setAttribute('aria-busy', 'false');
    document.dispatchEvent(new Event('routes:updated'));
  }
  function showError() {
    container.setAttribute('aria-busy', 'false');
    container.innerHTML = '<p class="events-status">We could not load the routes. Please reload to try again, or <a href="/contact/">get in touch</a> for a suggestion.</p>';
    count.textContent = 'Routes are temporarily unavailable';
  }
  filters.addEventListener('change', () => renderRoutes(filteredRoutes()));
  document.getElementById('resetRoutes').addEventListener('click', () => {
    filters.querySelectorAll('input').forEach(input => { input.checked = false; });
    filters.querySelectorAll('details').forEach(details => { details.open = false; });
    renderRoutes(allRoutes);
  });
  document.addEventListener('click', event => {
    filters.querySelectorAll('details[open]').forEach(details => { if (!details.contains(event.target)) details.open = false; });
  });
  filters.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const details = event.target.closest('details');
    if (details) { details.open = false; details.querySelector('summary').focus(); }
  });
  if (typeof Papa === 'undefined') { showError(); return; }
  const timeout = setTimeout(showError, 15000);
  Papa.parse(sheetURL, {
    download: true, header: true, skipEmptyLines: true,
    complete(results) {
      clearTimeout(timeout);
      allRoutes = results.data.filter(route => route['Route Name']);
      if (!allRoutes.length) { showError(); return; }
      addFilters('regionCheckboxes', [...new Set(allRoutes.map(route => route.Region).filter(Boolean))].sort().map(value => ({value, label:value})), 'region-filter');
      addFilters('typeCheckboxes', [...new Set(allRoutes.map(route => route['Route Type']).filter(Boolean))].sort().map(value => ({value, label:value})), 'type-filter');
      addFilters('lengthCheckboxes', [{value:'short',label:'Under 5 km'},{value:'medium',label:'5 to 10 km'},{value:'long',label:'Over 10 km'}], 'length-filter');
      addFilters('elevCheckboxes', [{value:'low',label:'Under 300 m'},{value:'medium',label:'300 to 600 m'},{value:'high',label:'Over 600 m'}], 'elev-filter');
      renderRoutes(allRoutes);
    },
    error() { clearTimeout(timeout); showError(); }
  });
})();
