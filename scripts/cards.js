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

  // Use the same loadSources function from the calendar
  if (typeof loadSources !== 'function') {
    console.error('❌ loadSources() not available');
    return;
  }

  try {
    const allEvents = await loadSources();
    const now = new Date();
    
    const filtered = allEvents
      .filter(e => {
        // Filter events that haven't ended yet
        return e.end && new Date(e.end) >= now;
      })
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 3);
    
    if (filtered.length === 0) {
      container.innerHTML = `<p class="text-gray-500">No upcoming events.</p>`;
      return;
    }
    
    filtered.forEach(event => {
      const { title, start, end, type, organizer, startplek, beschrijving, bookingUrl, teacher } = event;
      
      const card = document.createElement('div');
      card.className = 'border border-gray-200 rounded-lg p-6 hover:shadow-xl transition-shadow duration-300';
      
      const startDate = new Date(start);
      const endDate = new Date(end);
      const dateStr = startDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      const timeStr = `${startDate.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', hour12: false})} – ${endDate.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', hour12: false})}`;
      
      card.innerHTML = `
        <h3 class="text-xl font-semibold text-gray-900 mb-2">${title || ''}</h3>
        <p class="text-gray-600 mb-1">${dateStr}</p>
        <p class="text-gray-600 mb-3">${timeStr}</p>
        ${beschrijving ? `<p class="text-gray-600 mb-3">${beschrijving}</p>` : ''}
        <ul class="text-sm text-gray-700 space-y-1">
          ${organizer ? `<li><strong class="font-medium">Organizer:</strong> ${organizer}</li>` : ''}
          ${type ? `<li><strong class="font-medium">Type:</strong> ${type}</li>` : ''}
          ${startplek ? `<li><strong class="font-medium">Location:</strong> ${startplek}</li>` : ''}
        </ul>
        ${bookingUrl ? `<a href="${bookingUrl}" target="_blank" class="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium">Register here &rarr;</a>` : ''}
      `;
      
      container.appendChild(card);
    });
  } catch (err) {
    console.error('❌ Error loading events:', err);
  }
});
