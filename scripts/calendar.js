document.addEventListener('DOMContentLoaded', async function() {
  const calendarEl = document.getElementById('calendar');
  const events = await loadEvents();

  function chooseInitialView() {
    return window.innerWidth < 600 ? 'listMonth' : 'dayGridMonth';
  }

  function chooseHeaderToolbar() {
    if (window.innerWidth < 600) {
      return {
        left: 'prev,next',
        center: 'title',
        right: 'dayGridMonth,listMonth'
      };
    } else {
      return {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,listMonth,timeGridDay'
      };
    }
  }

  const calendar = new FullCalendar.Calendar(calendarEl, {
    timeZone: 'local',
    initialView: chooseInitialView(),
    firstDay: 1,
    headerToolbar: chooseHeaderToolbar(),
    dayMaxEvents: true,
    events: events,
    eventDidMount: function(info) {
      const type = info.event.extendedProps.type;
      const colors = {
        "Community Run": "#D72638",
        "Race": "#007F5F",
        "Long Run": "#2B9348",
        "Weekend Run": "#55A630",
        "Workshop": "#3A86FF",
        "Course": "#4361EE",
        "Yoga": "#7209B7",
        "Hike": "#F4A261",
        "Social Event": "#F28482",
        "Flat Run": "#FFB703",
        "Road Bike": "#118AB2",
        "Gravel Bike": "#06D6A0",
        "Mountainbike": "#EF476F",
        "Skitour": "#6C757D"
      };
      info.el.style.backgroundColor = colors[type] || '#666';
      info.el.style.color = 'white';
      info.el.style.border = 'none';
      info.el.style.borderRadius = '6px';
    },
eventContent: function(arg) {
  const props = arg.event.extendedProps;
  if (calendar.view.type.startsWith('list')) {
    return {
      html: `<div class="fc-event-title">${arg.event.title}</div>`
    };
  } else {
    return {
      html: `
        <div class="custom-event-content">
          <div class="fc-event-title">${arg.event.title}</div>
          <div class="subline">${props.startingPlace || ''}</div>
        </div>
      `
    };
  }
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
        modalLink.style.display = 'inline';
      } else {
        modalLink.style.display = 'none';
      }
      document.getElementById('eventModal').classList.add('show');
    }
  });

  calendar.render();

  window.addEventListener('resize', () => {
    const newView = chooseInitialView();
    const currentView = calendar.view.type;
    const newToolbar = chooseHeaderToolbar();
    
    if (newView !== currentView) {
      calendar.changeView(newView);
    }
    
    calendar.setOption('headerToolbar', newToolbar);
  });

  document.querySelector('.modal .close').addEventListener('click', () => {
    document.getElementById('eventModal').classList.remove('show');
  });

  document.getElementById('eventModal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      document.getElementById('eventModal').classList.remove('show');
    }
  });
});