// routes.js
    const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSwyagCABpIe1kW1TdvPgtHbrS-V-MbSYZacFRw-lsIVrNtOsrRznVo5lw5pJ_i6YK79AYMWSE3JqlD/pub?gid=2063366174&single=true&output=csv';
;
let allRoutes = [];

Papa.parse(sheetURL, {
  download: true,
  header: true,
  complete: function(results) {
    allRoutes = results.data.filter(row => row["Route Name"]);
    populateFilters(allRoutes);
    renderRoutes(allRoutes);
    attachFilterListeners();
  }
});

function getCheckedValues(className) {
  return Array.from(document.querySelectorAll(`.${className}:checked`)).map(cb => cb.value);
}

function filterRoutes() {
  const selectedRegions = getCheckedValues("region-filter");
  const selectedTypes = getCheckedValues("type-filter");
  const selectedLengths = getCheckedValues("length-filter");
  const selectedElevations = getCheckedValues("elev-filter");

  return allRoutes.filter(route => {
    const regionMatch = selectedRegions.length === 0 || selectedRegions.includes(route["Region"]);
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(route["Route Type"]);

    const dist = parseFloat(route["Distance (km)"]?.replace(',', '.')) || 0;
    const elev = parseInt(route["Elevation (m)"]) || 0;

    const lengthMatch =
      selectedLengths.length === 0 ||
      selectedLengths.some(range =>
        (range === "short" && dist < 5) ||
        (range === "medium" && dist >= 5 && dist <= 10) ||
        (range === "long" && dist > 10)
      );

    const elevMatch =
      selectedElevations.length === 0 ||
      selectedElevations.some(level =>
        (level === "low" && elev < 300) ||
        (level === "medium" && elev >= 300 && elev <= 600) ||
        (level === "high" && elev > 600)
      );

    return regionMatch && typeMatch && lengthMatch && elevMatch;
  });
}

function populateFilters(data) {
  const regionSet = new Set();
  const typeSet = new Set();

  data.forEach(route => {
    if (route["Region"]) regionSet.add(route["Region"]);
    if (route["Route Type"]) typeSet.add(route["Route Type"]);
  });

  populateCheckboxList("regionCheckboxes", regionSet, "region-filter");
  populateCheckboxList("typeCheckboxes", typeSet, "type-filter");
  populateStaticCheckboxList("lengthCheckboxes", [
    { value: "short", label: "< 5 km" },
    { value: "medium", label: "5 - 10 km" },
    { value: "long", label: "> 10 km" },
  ], "length-filter");
  populateStaticCheckboxList("elevCheckboxes", [
    { value: "low", label: "< 300 m" },
    { value: "medium", label: "300 - 600 m" },
    { value: "high", label: "> 600 m" },
  ], "elev-filter");
}

function populateCheckboxList(containerId, valuesSet, className) {
  const container = document.getElementById(containerId);
  let i = 0;
  valuesSet.forEach(value => {
    const id = `${className}-${i++}`;
    container.innerHTML += `
      <li>
        <div class="flex items-center p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600">
          <input id="${id}" type="checkbox" value="${value}" class="${className} w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm">
          <label for="${id}" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">${value}</label>
        </div>
      </li>`;
  });
}

function populateStaticCheckboxList(containerId, items, className) {
  const container = document.getElementById(containerId);
  items.forEach((item, i) => {
    const id = `${className}-${i}`;
    container.innerHTML += `
      <li>
        <div class="flex items-center p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600">
          <input id="${id}" type="checkbox" value="${item.value}" class="${className} w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm">
          <label for="${id}" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">${item.label}</label>
        </div>
      </li>`;
  });
}

function attachFilterListeners() {
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const filtered = filterRoutes();
      renderRoutes(filtered);
    });
  });
}

function renderRoutes(routes) {
  const container = document.getElementById("routesContainer");
  container.innerHTML = "";

  routes.forEach(route => {
    const card = document.createElement("div");
    card.className = "bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition duration-300 flex flex-col";

    const name = route["Route Name"];
    const region = route["Region"];
    const dist = route["Distance (km)"];
    const elev = route["Elevation (m)"];
    const type = route["Route Type"];
    const desc = route["Description"];
    const img = route["Image URL"];
    const mapLink = route["Map Link"];
    const embed = route["Embed Code"];
    const submittedBy = route["Submitted By"];

    card.innerHTML = `
      ${img ? `<img src="${img}" alt="${name}" class="w-full h-48 object-cover">` : ''}
      <div class="p-4 flex-grow">
        <h3 class="text-xl font-bold mb-1 text-gray-900">${name}</h3>
        <p class="text-sm text-gray-500 mb-2">${region || ''} • ${dist || '?'} km • ${elev || '?'} m D+ • ${type || ''}</p>
        <p class="text-sm text-gray-700 mb-3">${desc || ''}</p>
    `;

    if (embed && embed.includes('<iframe')) {
      card.innerHTML += `<div class="mt-3">${embed}</div>`;
    } else if (mapLink) {
      card.innerHTML += `
        <a href="${mapLink}" target="_blank" class="inline-block mt-3 text-blue-600 hover:underline font-semibold">
          View Route
        </a>
      `;
    }

    if (submittedBy) {
      card.innerHTML += `<p class="text-xs text-gray-400 mt-3">Submitted by: ${submittedBy}</p>`;
    }

    card.innerHTML += `</div>`;
    container.appendChild(card);
  });
}



