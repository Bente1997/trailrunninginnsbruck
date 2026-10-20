(() => {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('message-box');
  const button = form.querySelector('[type="submit"]');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    const original = button.innerHTML;
    button.disabled = true;
    button.textContent = 'Sending your message...';
    form.setAttribute('aria-busy', 'true');
    status.hidden = true;
    try {
      const response = await fetch(form.action, {
        method: form.method, body: new FormData(form), headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000)
      });
      if (!response.ok) throw new Error('Message could not be sent');
      status.dataset.state = 'success';
      status.textContent = 'Thanks for saying hello! Your message has been sent. We will be in touch.';
      form.reset();
    } catch {
      status.dataset.state = 'error';
      status.textContent = 'Your message could not be sent. Please try again, or email trailsdna@gmail.com. Your message is still here.';
    } finally {
      status.hidden = false;
      form.setAttribute('aria-busy', 'false');
      button.disabled = false;
      button.innerHTML = original;
    }
  });
})();
