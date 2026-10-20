/* Shared navigation, footer, and WhatsApp join flow. */
async function initGlobalComponents() {
  try {
    const [navResponse, footerResponse] = await Promise.all([
      fetch('/components/navbar.html'), fetch('/components/footer.html')
    ]);
    const header = document.getElementById('navbar-placeholder');
    const footer = document.getElementById('footer-placeholder');
    if (navResponse.ok && header) {
      header.innerHTML = await navResponse.text();
      initMobileMenu();
      header.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        if (new URL(link.href).pathname === location.pathname && !new URL(link.href).hash) link.setAttribute('aria-current', 'page');
      });
    }
    if (footerResponse.ok && footer) {
      footer.innerHTML = await footerResponse.text();
      initWhatsappLogic();
    }
  } catch (error) { console.error('Unable to load shared components:', error); }
}

function initMobileMenu() {
  const nav = document.querySelector('#navbar-placeholder .navbar');
  const toggle = nav?.querySelector('.mobile-menu-toggle');
  const menu = nav?.querySelector('.mobile-menu');
  if (!toggle || !menu) return;
  menu.id = 'site-mobile-menu';
  toggle.setAttribute('aria-label', 'Toggle navigation');
  toggle.setAttribute('aria-controls', menu.id);
  function setOpen(open) {
    menu.classList.toggle('active', open);
    toggle.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', String(open));
  }
  setOpen(false);
  toggle.addEventListener('click', () => setOpen(!menu.classList.contains('active')));
  menu.addEventListener('click', event => { if (event.target.closest('a')) setOpen(false); });
  document.addEventListener('click', event => { if (!nav.contains(event.target)) setOpen(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.classList.contains('active')) { setOpen(false); toggle.focus(); }
  });
}

// Load Cloudflare only when someone opens the join dialog.
let turnstileLoader;
function loadWhatsappTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (turnstileLoader) return turnstileLoader;
  turnstileLoader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    let settled = false;
    const finish = error => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      delete window.onWhatsappTurnstileReady;
      if (error) {
        script.remove();
        turnstileLoader = undefined;
        reject(error);
      } else {
        resolve(window.turnstile);
      }
    };
    const timer = setTimeout(() => finish(new Error('Verification did not load')), 15000);
    window.onWhatsappTurnstileReady = () => finish();
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onWhatsappTurnstileReady';
    script.async = true;
    script.onerror = () => finish(new Error('Verification did not load'));
    document.head.appendChild(script);
  });
  return turnstileLoader;
}

function initWhatsappLogic() {
  const modal = document.getElementById('whatsappSecurityModal');
  if (!modal) return;
  const close = modal.querySelector('#closeWhatsappModal');
  const retry = modal.querySelector('#retryWhatsappVerification');
  const container = modal.querySelector('#whatsappTurnstile');
  const status = modal.querySelector('#whatsapp-status');
  const display = modal.querySelector('#whatsappActualLinkDisplay');
  const link = modal.querySelector('#whatsappFinalLink');
  const dialog = modal.querySelector('[role="dialog"]');
  let returnFocus;
  let previousOverflow;
  let widgetId;
  let attempt = 0;
  let controller;

  function clearInvite() {
    display.hidden = true;
    link.removeAttribute('href');
  }
  function removeWidget() {
    if (widgetId !== undefined) {
      window.turnstile?.remove(widgetId);
      widgetId = undefined;
    }
    container.replaceChildren();
  }
  function current(id) {
    return id === attempt && !modal.classList.contains('hidden');
  }
  function fail(id, message) {
    if (!current(id)) return;
    controller?.abort();
    attempt++; // Discard any late callbacks or verification response.
    clearInvite();
    removeWidget();
    status.textContent = message;
    retry.hidden = false;
    dialog.removeAttribute('aria-busy');
  }
  async function verify(token, id) {
    if (!current(id) || controller) return;
    status.textContent = 'Checking your verification...';
    dialog.setAttribute('aria-busy', 'true');
    const request = new AbortController();
    controller = request;
    const timeout = setTimeout(() => request.abort(), 15000);
    try {
      const response = await fetch(modal.dataset.verificationEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        credentials: 'omit',
        cache: 'no-store',
        signal: request.signal
      });
      if (!response.ok) throw new Error('Verification failed');
      const result = await response.json();
      const invite = new URL(result.url);
      if (invite.origin !== 'https://chat.whatsapp.com' || !/^\/[A-Za-z0-9_-]+$/.test(invite.pathname) || invite.search || invite.hash) {
        throw new Error('Invalid invite');
      }
      if (!current(id)) return;
      link.href = invite.href;
      display.hidden = false;
      status.textContent = "You're all set. See you on the trails!";
      dialog.removeAttribute('aria-busy');
      link.focus();
    } catch {
      fail(id, "We couldn't complete the check. Please try again, or contact the team.");
    } finally {
      clearTimeout(timeout);
      if (controller === request) controller = undefined;
    }
  }
  async function startVerification() {
    const id = ++attempt;
    controller?.abort();
    controller = undefined;
    clearInvite();
    removeWidget();
    retry.hidden = true;
    status.textContent = 'Loading a quick security check...';
    dialog.removeAttribute('aria-busy');
    try {
      const turnstile = await loadWhatsappTurnstile();
      if (!current(id)) return;
      status.textContent = 'Complete the check below to get your invite.';
      widgetId = turnstile.render(container, {
        sitekey: modal.dataset.turnstileSitekey,
        action: 'whatsapp_join',
        theme: 'light',
        size: container.clientWidth < 300 ? 'compact' : 'flexible',
        'response-field': false,
        callback: token => verify(token, id),
        'error-callback': () => { fail(id, "The check couldn't load. Please try again."); return true; },
        'expired-callback': () => fail(id, 'Your check expired. Please try again.'),
        'timeout-callback': () => fail(id, 'The check timed out. Please try again.')
      });
    } catch {
      fail(id, "The security check couldn't load. Please try again, or contact the team.");
    }
  }
  function closeModal() {
    attempt++;
    controller?.abort();
    controller = undefined;
    removeWidget();
    clearInvite();
    modal.classList.add('hidden');
    dialog.removeAttribute('aria-busy');
    document.body.style.overflow = previousOverflow || '';
    returnFocus?.focus();
  }
  document.querySelectorAll('[data-whatsapp-trigger="true"], #stickyWhatsappTrigger, #initialWhatsappTrigger').forEach(trigger => {
    trigger.addEventListener('click', event => {
      event.preventDefault();
      if (!modal.classList.contains('hidden')) return;
      returnFocus = trigger;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      modal.classList.remove('hidden');
      close.focus();
      startVerification();
    });
  });
  close.addEventListener('click', closeModal);
  retry.addEventListener('click', startVerification);
  modal.querySelector('[data-whatsapp-overlay-backdrop]')?.addEventListener('click', closeModal);
  document.addEventListener('keydown', event => {
    if (modal.classList.contains('hidden')) return;
    if (event.key === 'Escape') { event.preventDefault(); closeModal(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('button, a[href], iframe, [tabindex="0"]')].filter(element => element.getClientRects().length && !element.disabled);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
}

document.addEventListener('DOMContentLoaded', initGlobalComponents);
