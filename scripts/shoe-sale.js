/**
 * DNA Trails Shoe Sale
 * Loads shoe inventory from a published Google Sheet CSV/TSV.
 */

const SHEET_URL = document.body.dataset.sheetUrl || '';
const SHOE_ASSET_BASE = '/assets/shoes';
const FALLBACK_IMAGE = '/assets/logos/placeholder.svg';

let products = [];

const productsGrid = document.getElementById('productsGrid');
const noResults = document.getElementById('noResults');
const noResultsMessage = document.getElementById('noResultsMessage');
const filterSize = document.getElementById('filterSize');
const filterType = document.getElementById('filterType');
const filterCondition = document.getElementById('filterCondition');
const filterPrice = document.getElementById('filterPrice');
const priceValue = document.getElementById('priceValue');
const resetFilters = document.getElementById('resetFilters');
const filtersToggle = document.getElementById('filtersToggle');
const filtersContent = document.getElementById('filtersContent');

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  init();
});

function setupEventListeners() {
  filterSize.addEventListener('change', applyFilters);
  filterType.addEventListener('change', applyFilters);
  filterCondition.addEventListener('change', applyFilters);
  filterPrice.addEventListener('input', (event) => {
    priceValue.textContent = event.target.value;
    applyFilters();
  });
  resetFilters.addEventListener('click', resetAllFilters);
  filtersToggle.addEventListener('click', toggleFilters);
}

async function init() {
  if (!SHEET_URL) {
    renderConfigMessage(
      'Set a published Google Sheet CSV URL in body[data-sheet-url] to load the shoe inventory.'
    );
    return;
  }

  try {
    const sheetText = await fetchSheetData(withCacheBuster(SHEET_URL));
    products = parseProductSheet(sheetText);
    rebuildFilterOptions(products);
    syncPriceFilter(products);
    renderProducts(products);
  } catch (error) {
    console.error('Error loading shoe inventory:', error);
    renderConfigMessage('The shoe inventory could not be loaded from the configured Google Sheet.');
  }
}

function toggleFilters() {
  filtersToggle.classList.toggle('active');
  filtersContent.classList.toggle('active');
}

function withCacheBuster(url) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}cachebuster=${Date.now()}`;
}

async function fetchSheetData(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Sheet load failed with status ${response.status}`);
  }
  return response.text();
}

function parseDelimitedText(text, delimiter = ',') {
  const rows = [];
  let index = 0;
  let field = '';
  let row = [];
  let inQuotes = false;

  function pushField() {
    row.push(field);
    field = '';
  }

  function pushRow() {
    rows.push(row);
    row = [];
  }

  while (index < text.length) {
    const character = text[index];

    if (inQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        inQuotes = false;
        index += 1;
        continue;
      }

      field += character;
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = true;
      index += 1;
      continue;
    }

    if (character === delimiter) {
      pushField();
      index += 1;
      continue;
    }

    if (character === '\n') {
      pushField();
      pushRow();
      index += 1;
      continue;
    }

    if (character === '\r') {
      index += 1;
      continue;
    }

    field += character;
    index += 1;
  }

  if (field !== '' || row.length) {
    pushField();
    pushRow();
  }

  if (rows.length === 0) {
    return { header: [], records: [] };
  }

  const header = rows[0].map((cell) => cell.trim());
  const records = rows
    .slice(1)
    .filter((record) => record.some((cell) => (cell || '').trim() !== ''));

  return { header, records };
}

function normalizeHeader(header) {
  return (header || '').trim().toLowerCase();
}

function rowToObject(header, row) {
  const record = {};

  for (let i = 0; i < header.length; i += 1) {
    record[normalizeHeader(header[i])] = (row[i] || '').trim();
  }

  return record;
}

function detectDelimiter(text) {
  const firstLine = String(text || '').split(/\r?\n/, 1)[0] || '';
  return firstLine.includes('\t') ? '\t' : ',';
}

function parseProductSheet(sheetText) {
  const delimiter = detectDelimiter(sheetText);
  const { header, records } = parseDelimitedText(sheetText, delimiter);

  return records
    .map((row, index) => toProduct(rowToObject(header, row), index))
    .filter(Boolean);
}

function toProduct(record, index) {
  const typeRaw = record.type || '';
  const sizeRaw = record.size || '';
  const originalPriceRaw = record['price-original'] || '';
  const soldPriceRaw = record['price-sold'] || '';
  const conditionRaw = record.condition || '';
  const statusRaw = record.status || '';

  if (!typeRaw && !sizeRaw && !originalPriceRaw && !soldPriceRaw) {
    return null;
  }

  const images = [record.photo1, record.photo2, record.photo3]
    .filter(Boolean)
    .map(resolveShoeAssetPath);

  const originalPrice = parsePrice(originalPriceRaw);
  const soldPrice = parsePrice(soldPriceRaw);
  const displayPrice = soldPrice || originalPrice;
  const type = normalizeToken(typeRaw);
  const condition = normalizeToken(conditionRaw);
  const status = normalizeToken(statusRaw);

  return {
    id: `${type || 'shoe'}-${sizeRaw || 'na'}-${index}`,
    title: typeRaw || 'Shoe',
    type,
    typeLabel: typeRaw || 'Shoe',
    sizeLabel: sizeRaw || 'N/A',
    condition,
    conditionLabel: conditionRaw || 'Unknown',
    status,
    statusLabel: statusRaw || 'Available',
    originalPrice,
    soldPrice,
    displayPrice,
    images: images.length ? images : [FALLBACK_IMAGE]
  };
}

function parsePrice(value) {
  if (typeof value === 'number') {
    return value;
  }

  const normalized = String(value || '')
    .replace(/[^\d.,-]/g, '')
    .replace(',', '.');

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveShoeAssetPath(fileName) {
  return `${SHOE_ASSET_BASE}/${encodePathSegment(fileName)}`;
}

function encodePathSegment(path) {
  return String(path || '')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function rebuildFilterOptions(allProducts) {
  const sizes = Array.from(
    new Set(allProducts.map((product) => product.sizeLabel).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const types = Array.from(
    new Set(allProducts.map((product) => product.typeLabel).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const conditions = Array.from(
    new Set(allProducts.map((product) => product.conditionLabel).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  filterSize.innerHTML = ['<option value="">All Sizes</option>']
    .concat(sizes.map((size) => `<option value="${escapeHtml(size)}">${escapeHtml(size)}</option>`))
    .join('');

  filterType.innerHTML = ['<option value="">All Types</option>']
    .concat(types.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`))
    .join('');

  filterCondition.innerHTML = ['<option value="">All Conditions</option>']
    .concat(
      conditions.map(
        (condition) => `<option value="${escapeHtml(condition)}">${escapeHtml(condition)}</option>`
      )
    )
    .join('');
}

function syncPriceFilter(allProducts) {
  const maxProductPrice = Math.max(...allProducts.map((product) => product.displayPrice), 0);
  const roundedMaxPrice = Math.max(50, Math.ceil(maxProductPrice / 10) * 10);

  filterPrice.max = String(roundedMaxPrice);
  filterPrice.value = String(roundedMaxPrice);
  priceValue.textContent = String(roundedMaxPrice);
}

function applyFilters() {
  const size = filterSize.value;
  const type = filterType.value;
  const condition = filterCondition.value;
  const maxPrice = parsePrice(filterPrice.value);

  const filteredProducts = products.filter((product) => (
    (!size || product.sizeLabel === size) &&
    (!type || product.typeLabel === type) &&
    (!condition || product.conditionLabel === condition) &&
    product.displayPrice <= maxPrice
  ));

  renderProducts(filteredProducts);
}

function resetAllFilters() {
  filterSize.value = '';
  filterType.value = '';
  filterCondition.value = '';
  syncPriceFilter(products);
  renderProducts(products);
}

function renderProducts(productsToShow) {
  if (!productsToShow.length) {
    productsGrid.innerHTML = '';
    noResultsMessage.textContent = 'No shoes match your filters. Try adjusting your criteria.';
    noResults.classList.remove('hidden');
    return;
  }

  noResults.classList.add('hidden');
  productsGrid.innerHTML = productsToShow
    .map((product) => createProductCard(product))
    .join('');

  productsToShow.forEach((product) => {
    setupCarousel(product.id, product.images);
  });
}

function renderConfigMessage(message) {
  productsGrid.innerHTML = '';
  noResultsMessage.textContent = message;
  noResults.classList.remove('hidden');
}

function createProductCard(product) {
  const actionText = product.status === 'sold' ? 'Sold Out' : 'Contact';
  const actionDisabled = product.status === 'sold' ? 'disabled' : '';
  const actionHref = product.status === 'sold' ? '#' : '/contact/';

  return `
    <div class="product-card" data-product-id="${escapeHtml(product.id)}">
      <div class="product-image-container" tabindex="0" aria-label="${escapeHtml(product.title)} gallery">
        <img
          src="${escapeHtml(product.images[0])}"
          alt="${escapeHtml(`${product.title} size ${product.sizeLabel}`)}"
          class="product-image"
          data-carousel="${escapeHtml(product.id)}"
        >

        <div class="carousel-controls">
          <button class="carousel-btn" type="button" data-action="prev" data-product="${escapeHtml(product.id)}">←</button>
          <button class="carousel-btn" type="button" data-action="next" data-product="${escapeHtml(product.id)}">→</button>
        </div>

        <div class="carousel-indicators">
          ${product.images.map((_, index) => `
            <div class="indicator ${index === 0 ? 'active' : ''}" data-product="${escapeHtml(product.id)}" data-slide="${index}"></div>
          `).join('')}
        </div>
      </div>

      <div class="product-info">
        <div class="product-header">
          <h3 class="product-model">${escapeHtml(product.title)}</h3>
          <p class="product-type">Dynafit</p>
        </div>

        <div class="product-details">
          <div class="detail-item">
            <span class="detail-label">Size</span>
            <span class="detail-value">${escapeHtml(product.sizeLabel)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Condition</span>
            <span class="detail-value">${escapeHtml(product.conditionLabel)}</span>
          </div>
        </div>

        <div class="status-badge status-${escapeHtml(product.status || 'available')}">
          <span>${escapeHtml(formatStatus(product.statusLabel))}</span>
        </div>

        <div class="product-footer">
          <div class="product-pricing">
            ${product.originalPrice && product.originalPrice !== product.displayPrice ? `
              <div class="product-price-original">${formatPrice(product.originalPrice)}</div>
            ` : ''}
            <div class="product-price">${formatPrice(product.displayPrice)}</div>
          </div>
          <a class="product-action ${actionDisabled}" href="${actionHref}">${actionText}</a>
        </div>
      </div>
    </div>
  `;
}

function setupCarousel(productId, images) {
  const imageElement = document.querySelector(`[data-carousel="${CSS.escape(productId)}"]`);

  if (!imageElement) {
    return;
  }

  const container = imageElement.closest('.product-image-container');
  const indicators = container.querySelectorAll(`.indicator[data-product="${CSS.escape(productId)}"]`);
  const prevButton = container.querySelector(`button[data-product="${CSS.escape(productId)}"][data-action="prev"]`);
  const nextButton = container.querySelector(`button[data-product="${CSS.escape(productId)}"][data-action="next"]`);
  let currentIndex = 0;

  if (images.length <= 1) {
    if (prevButton) prevButton.style.display = 'none';
    if (nextButton) nextButton.style.display = 'none';
    return;
  }

  function updateCarousel(index) {
    currentIndex = (index + images.length) % images.length;
    imageElement.src = images[currentIndex];

    indicators.forEach((indicator, indicatorIndex) => {
      indicator.classList.toggle('active', indicatorIndex === currentIndex);
    });
  }

  prevButton.addEventListener('click', (event) => {
    event.stopPropagation();
    updateCarousel(currentIndex - 1);
  });

  nextButton.addEventListener('click', (event) => {
    event.stopPropagation();
    updateCarousel(currentIndex + 1);
  });

  indicators.forEach((indicator, indicatorIndex) => {
    indicator.addEventListener('click', () => {
      updateCarousel(indicatorIndex);
    });
  });

  container.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      updateCarousel(currentIndex - 1);
    }

    if (event.key === 'ArrowRight') {
      updateCarousel(currentIndex + 1);
    }
  });
}

function formatStatus(status) {
  const normalized = String(status || '').trim();
  if (!normalized) {
    return 'Available';
  }

  return normalized
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function formatPrice(price) {
  return new Intl.NumberFormat('de-AT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(price || 0);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
