function formatDateTime(isoString) {
  const date = new Date(isoString);
  const optionsDate = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/Amsterdam'
  };
  const optionsTime = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Amsterdam'
  };

  const formattedDate = date.toLocaleDateString('en-US', optionsDate);
  const formattedTime = date.toLocaleTimeString('en-US', optionsTime);

  return `${formattedDate} at ${formattedTime}`;
}


document.addEventListener('DOMContentLoaded', async function () {
  const container = document.getElementById('cardsContainer');
  const wrapper = document.getElementById('event-cards');

  if (!container || !wrapper) return;
  if (typeof loadEvents !== 'function') {
    console.error('❌ loadEvents() niet beschikbaar');
    return;
  }

  const organizer = wrapper.getAttribute('data-organizer');
  console.log('🔎 Organizer filter:', organizer);

  try {
    const allEvents = await loadEvents();
    const today = new Date().toISOString().split('T')[0];

    const filtered = allEvents
      .filter(e => {
        const isFuture = (e.start || '').split('T')[0] >= today;
        const matchesOrganizer = e.extendedProps?.organizer === organizer;
        return isFuture && matchesOrganizer;
      })
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 3);

    if (filtered.length === 0) {
      container.innerHTML = `<p class="text-gray-500">Geen aankomende events voor ${organizer}.</p>`;
      return;
    }

    filtered.forEach(event => {
      const { title, start, end, url, extendedProps } = event;
      const {
        description,
        type,
        distance,
        startingPlace,
        level,
        price
      } = extendedProps || {};

      const card = document.createElement('div');
      card.className = 'border border-gray-200 rounded-lg p-6 hover:shadow-xl transition-shadow duration-300';

      card.innerHTML = `
        <h3 class="text-xl font-semibold text-gray-900 mb-2">${title || ''}</h3>
        <p class="text-gray-600 mb-3">${formatDateTime(start) || ''}.</p>
        <p class="text-gray-600 mb-3">${description || ''}</p>
        <ul class="text-sm text-gray-700 space-y-1">
          ${type ? `<li><strong class="font-medium">Type:</strong> ${type}</li>` : ''}
          ${distance ? `<li><strong class="font-medium">Distance:</strong> ${distance}</li>` : ''}
          ${level ? `<li><strong class="font-medium">Level:</strong> ${level}</li>` : ''}
          ${startingPlace ? `<li><strong class="font-medium">Start Location:</strong> ${startingPlace}</li>` : ''}
        </ul>
        ${url ? `<a href="${url}" target="_blank" class="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium">Register here&rarr;</a>` : ''}
      `;
      container.appendChild(card);
    });

  } catch (err) {
    console.error('❌ Fout bij laden of filteren:', err);
  }
});
