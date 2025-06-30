document.addEventListener('DOMContentLoaded', async function() {
  const calendarEl = document.getElementById('calendar');
  const events = await loadEvents();

  function chooseInitialView() {
    return window.innerWidth < 600 ? 'timeGridDay' : 'timeGridWeek';
  }

  const calendar = new FullCalendar.Calendar(calendarEl, {
    timeZone: 'local',
    initialView: chooseInitialView(),
    firstDay: 1,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: events,
    eventDidMount: function(info) {
      const type = info.event.extendedProps.type;
const colors = {
  // 🧭 Core recurring event — bold & recognizable
  "Community Run": "#D72638", // Strong red — stands out, weekly visibility

  // 🏁 Performance & challenge events — bold complementary greens
  "Race": "#007F5F",          // Deep green
  "Long Run": "#2B9348",      // Forest green, lighter
  "Weekend Run": "#55A630",   // Fresh green

  // 🧠 Learning & structured development — complementary blues
  "Workshop": "#3A86FF",      // Vivid blue
  "Course": "#4361EE",        // Slightly softer blue
  "Yoga": "#7209B7",          // Deep purple (wellness)

  // 🎒 Social and informal events — warm oranges/pinks
  "Hike": "#F4A261",          // Earthy orange
  "Social Event": "#F28482",  // Coral/salmon, friendly tone

  // 🛣️ Flat terrain & bikes — distinct and modern
  "Flat Run": "#FFB703",      // Bright yellow-orange
  "Road Bike": "#118AB2",     // Ocean blue
  "Gravel Bike": "#06D6A0",   // Fresh teal
  "Mountainbike": "#EF476F",  // Bold magenta-red

  // ❄️ Winter/mountain
  "Skitour": "#6C757D"        // Muted alpine gray
};
      info.el.style.backgroundColor = colors[type] || '#666';
      info.el.style.color = 'white';
      info.el.style.border = 'none';
      info.el.style.borderRadius = '6px';
    },
    eventContent: function(arg) {
      const props = arg.event.extendedProps;
      return {
        html: `
          <div class="fc-event-title">${arg.event.title}</div>
          <div class="subline">${props.startingPlace || ''} • ${props.description || ''}</div>
        `
      };
    },
    eventClick: function(info) {
      info.jsEvent.preventDefault();
      const props = info.event.extendedProps;

      document.getElementById('modalTitle').textContent = info.event.title;
      document.getElementById('modalDescription').textContent = props.description || 'No description';
const formattedStart = formatDateTime(info.event.start);
let formattedDate = `Start: ${formattedStart}`;

if (info.event.end) {
  const formattedEnd = formatDateTime(info.event.end);
  formattedDate += ` | End: ${formattedEnd}`;
}

document.getElementById('modalDate').textContent = formattedDate;
document.getElementById('modalStartingPlace').textContent = props.startingPlace || 'Starting place unknown';

      document.getElementById('modalLevel').textContent = props.level || 'All levels';
      document.getElementById('modalPrice').textContent = props.price || 'Free';
      const modalLink = document.getElementById('modalLink');
if (props.link && props.link.trim() !== '') {
  modalLink.href = props.link;
  modalLink.style.display = 'inline'; // show link if valid
} else {
  modalLink.style.display = 'none';   // hide link if missing
}

      document.getElementById('eventModal').classList.add('show');

    }
  });

  calendar.render();

  // ✅ Responsiveness bij resize
  window.addEventListener('resize', () => {
    const newView = chooseInitialView();
    const currentView = calendar.view.type;
    if (newView !== currentView) {
      calendar.changeView(newView);
    }
  });

  // Modal sluiting
document.querySelector('.modal .close').addEventListener('click', () => {
  document.getElementById('eventModal').classList.remove('show');
});

document.getElementById('eventModal').addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    document.getElementById('eventModal').classList.remove('show');
  }
});
});



