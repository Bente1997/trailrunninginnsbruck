/* Keep each conversation connected to the opportunity that inspired it. */
(() => {
  const choice = document.getElementById('partner-opportunity');
  document.querySelectorAll('[data-opportunity]').forEach(link => {
    link.addEventListener('click', () => {
      choice.value = link.dataset.opportunity;
      choice.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
})();
