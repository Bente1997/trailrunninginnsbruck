// URLs van de drie tabs (vervang met je eigen publicatie-URLs)
const recurringURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSAyBf4cwkXSOi5zz36U-r9uuV8KroW60CEbkEXQ8vuoCL60kT3Zbg9hKwQFVUJfBl_Ttln1WW9roqS/pub?gid=0&single=true&output=csv';
const cancelledURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSAyBf4cwkXSOi5zz36U-r9uuV8KroW60CEbkEXQ8vuoCL60kT3Zbg9hKwQFVUJfBl_Ttln1WW9roqS/pub?gid=816969004&single=true&output=csv';
const singlesURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSAyBf4cwkXSOi5zz36U-r9uuV8KroW60CEbkEXQ8vuoCL60kT3Zbg9hKwQFVUJfBl_Ttln1WW9roqS/pub?gid=1664013408&single=true&output=csv';

function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const cols = line.split(',');
    const data = {};
    headers.forEach((header, i) => data[header.trim()] = cols[i]?.trim());
    return data;
  });
}

function padTime(t) {
  const parts = (t || '').split(':');
  return parts.map(p => p.padStart(2, '0')).join(':');
}

function generateRecurringEvents(recurringData, cancelledData, rangeStart, rangeEnd) {
  const events = [];
  const exceptionMap = new Map();
  cancelledData.forEach(c => {
    const key = `${c['Title']}_${c['Date']}_${c['Organizer']}`;
    exceptionMap.set(key, c);
  });

  recurringData.forEach(event => {
    const startDate = new Date(event['Date']);
    const originalEndDate = event['EndDate'] ? new Date(event['EndDate']) : new Date(event['Date']);
    const diffDays = Math.round((originalEndDate - startDate) / (1000 * 60 * 60 * 24));
    const endDate = new Date(rangeEnd);
    const interval = event['Recurrence'] === 'Weekly' ? 7 : 30;

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + interval)) {
      const dateStr = date.toISOString().split('T')[0];

      // Bereken nieuwe einddatum voor deze recurrence
      const recurrenceEnd = new Date(date);
      recurrenceEnd.setDate(recurrenceEnd.getDate() + diffDays);
      const endDateStr = recurrenceEnd.toISOString().split('T')[0];

      const key = `${event['Title']}_${dateStr}_${event['Organizer']}`;
      const exception = exceptionMap.get(key);

      let eventTime = padTime(event['Time']);
      let endTime = padTime(event['EndTime']);

      if (exception) {
        if (exception['Exception Type'] === 'Cancelled') continue;
        if (exception['Exception Type'] === 'Time Change' && exception['Remark']) {
          eventTime = padTime(exception['Remark']);
        }
      }

      events.push({
        title: event['Title'],
        start: `${dateStr}T${eventTime}`,
        end: `${endDateStr}T${endTime}`,
        url: event['Link'],
        extendedProps: {
          type: event['Type'],
          organizer: event['Organizer'],
          level: event['Level'],
          price: event['Price'],
          description: event['Description'],
          startingPlace: event['StartingPlace']
        }
      });
    }
  });

  return events;
}


function generateSingleEvents(singleData) {
  return singleData.map(event => ({
    title: event['Title'],
    start: `${event['Date']}T${padTime(event['Time'])}`,
    end: event['EndDate'] ? `${event['EndDate']}T${padTime(event['EndTime'])}` : null,
    url: event['Link'],
    extendedProps: {
      type: event['Type'],
      organizer: event['Organizer'],
      level: event['Level'],
      price: event['Price'],
      description: event['Description'],
      startingPlace: event['StartingPlace']
    }
  }));
}

window.loadEvents = async function () {
  const [recurringCSV, cancelledCSV, singlesCSV] = await Promise.all([
    fetch(recurringURL + '&cachebuster=' + Date.now()).then(res => res.text()),
    fetch(cancelledURL + '&cachebuster=' + Date.now()).then(res => res.text()),
    fetch(singlesURL + '&cachebuster=' + Date.now()).then(res => res.text())
  ]);

  const recurringData = parseCSV(recurringCSV);
  const cancelledData = parseCSV(cancelledCSV);
  const singleData = parseCSV(singlesCSV);

  const rangeStart = new Date();
  const rangeEnd = new Date();
  rangeEnd.setMonth(rangeEnd.getMonth() + 3);

  const recurringEvents = generateRecurringEvents(recurringData, cancelledData, rangeStart, rangeEnd);
  const singleEvents = generateSingleEvents(singleData);

      console.log("ALL GENERATED RECURRING EVENTS:", recurringEvents); // <-- Add this line
    console.log("ALL GENERATED SINGLE EVENTS:", singleEvents); // <-- And this one


  return [...recurringEvents, ...singleEvents];
};

