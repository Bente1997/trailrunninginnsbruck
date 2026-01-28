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

  if (typeof loadSources !== 'function') {
    console.error('❌ loadSources() not available');
    return;
  }

  try {
    const allEvents = await loadSources();
    const now = new Date();
    
    const filtered = allEvents
      .filter(e => e.end && new Date(e.end) >= now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 3);
    
    if (filtered.length === 0) {
      container.innerHTML = `<p class="text-gray-500 text-center col-span-full py-10">No upcoming events scheduled. check back soon!</p>`;
      return;
    }
    
    // Clear container before appending
    container.innerHTML = '';

    filtered.forEach(event => {
      const { title, start, end, type, organizer, startplek, beschrijving, bookingUrl } = event;
      
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      const dateStr = startDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric'
      });
      
      const timeStr = `${startDate.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', hour12: false})} – ${endDate.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', hour12: false})}`;
      
      const card = document.createElement('div');
      // Using the class we defined in the new CSS
      card.className = 'group relative flex flex-col h-full'; 
      
      card.innerHTML = `
        <div class="p-6 flex flex-col h-full">
          <div class="mb-4">
            <span class="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 rounded-full border border-emerald-100">
              ${type || 'Community'}
            </span>
          </div>

          <h3 class="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
            ${title || 'Unnamed Event'}
          </h3>

          <div class="space-y-2 mb-4">
            <div class="flex items-center text-gray-600">
              <i class="far fa-calendar-alt w-5 text-sky-500"></i>
              <span class="ml-2 font-medium">${dateStr}</span>
            </div>
            <div class="flex items-center text-gray-600">
              <i class="far fa-clock w-5 text-sky-500"></i>
              <span class="ml-2">${timeStr}</span>
            </div>
            ${startplek ? `
            <div class="flex items-start text-gray-600">
              <i class="fas fa-map-marker-alt w-5 mt-1 text-sky-500"></i>
              <span class="ml-2 flex-1">${startplek}</span>
            </div>` : ''}
          </div>

          <p class="text-gray-500 text-sm mb-6 flex-grow line-clamp-3">
            ${beschrijving || 'Join us for a great time on the trails around Innsbruck!'}
          </p>

          <div class="mt-auto pt-4 border-t border-gray-50">
            ${bookingUrl ? 
              `<a href="${bookingUrl}" target="_blank" class="flex items-center justify-between w-full py-2 text-blue-600 font-bold hover:translate-x-1 transition-transform duration-200">
                Register Now <i class="fas fa-chevron-right text-sm"></i>
              </a>` : 
              `<span class="text-gray-400 text-sm italic">No registration required</span>`
            }
          </div>
        </div>
      `;
      
      container.appendChild(card);
    });
  } catch (err) {
    console.error('❌ Error loading events:', err);
  }
});