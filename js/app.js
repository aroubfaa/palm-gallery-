/* ══════════════════════════════════════════════
   Palm Gallery v5 — app.js
   API  : Unsplash  https://api.unsplash.com
   Key  : faAreE1kD53Cnvb90c1cXD8qumqnP8fXGi7mDU7MOpQ
   ──────────────────────────────────────────────
   Events used:
     1. click     – pills, buttons, modal close
     2. keyup     – search on Enter + live clear-X
     3. keydown   – Escape closes modal / clears input
     4. dblclick  – open detail modal on card
     5. scroll    – navbar solid on scroll
══════════════════════════════════════════════ */


/* ─────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────── */
const API_KEY  = 'ovEx00Zvg6A5FccusYvo1JiDNWIiErbl6KDlpGYJ6voZwrBAOEAmMQX2';
const API_BASE = 'https://api.pexels.com/v1';


/* ─────────────────────────────────────────────
   STATE
───────────────────────────────────────────── */
const state = {
  query      : 'date palm tree',
  page       : 1,
  perPage    : 20,
  totalPages : 1,
  isLoading  : false,
  colHeights : [0, 0, 0, 0],   // track masonry column heights
};


/* ─────────────────────────────────────────────
   DOM REFS
───────────────────────────────────────────── */
const navbar       = document.getElementById('navbar');
const searchInput  = document.getElementById('searchInput');
const clearInput   = document.getElementById('clearInput');
const searchBtn    = document.getElementById('searchBtn');
const clearBtn     = document.getElementById('clearBtn');
const statusMsg    = document.getElementById('statusMsg');
const gallerySection = document.getElementById('gallerySection');
const galleryTitle = document.getElementById('galleryTitle');
const galleryCount = document.getElementById('galleryCount');
const loadMoreWrap = document.getElementById('loadMoreWrap');
const modal        = document.getElementById('modal');
const modalBackdrop= document.getElementById('modalBackdrop');
const modalClose   = document.getElementById('modalClose');
const modalBody    = document.getElementById('modalBody');
const cols         = [
  document.getElementById('col0'),
  document.getElementById('col1'),
  document.getElementById('col2'),
  document.getElementById('col3'),
];


/* ─────────────────────────────────────────────
   EVENT 1: click — Pill selection
───────────────────────────────────────────── */
document.getElementById('pillRow').addEventListener('click', (e) => {
  const pill = e.target.closest('.pill');
  if (!pill) return;
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  pill.classList.add('active');
  searchInput.value = pill.dataset.q;
  updateClearX();
  startFresh(pill.dataset.q);
});


/* ─────────────────────────────────────────────
   EVENT 1: click — Search button
───────────────────────────────────────────── */
searchBtn.addEventListener('click', () => {
  const q = searchInput.value.trim();
  if (!q) { showStatus('⚠️ Please type a search term — e.g. "date palm" or "palm sunset".', 'error'); return; }
  startFresh(q);
});


/* ─────────────────────────────────────────────
   EVENT 1: click — Clear all
───────────────────────────────────────────── */
clearBtn.addEventListener('click', () => clearAll(true));


/* ─────────────────────────────────────────────
   EVENT 1: click — Clear ✕ inside input
───────────────────────────────────────────── */
clearInput.addEventListener('click', () => {
  searchInput.value = '';
  clearInput.classList.add('hidden');
  searchInput.focus();
});


/* ─────────────────────────────────────────────
   EVENT 1: click — Modal close
───────────────────────────────────────────── */
modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);


/* ─────────────────────────────────────────────
   EVENT 2: keyup — Enter to search + live clear-X
───────────────────────────────────────────── */
searchInput.addEventListener('keyup', (e) => {
  updateClearX();
  if (e.key === 'Enter') {
    const q = searchInput.value.trim();
    if (!q) { showStatus('⚠️ Please type a palm search term.', 'error'); return; }
    startFresh(q);
  }
});

function updateClearX() {
  searchInput.value.length > 0
    ? clearInput.classList.remove('hidden')
    : clearInput.classList.add('hidden');
}


/* ─────────────────────────────────────────────
   EVENT 3: keydown — Escape key
───────────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!modal.classList.contains('hidden')) {
      closeModal();
    } else {
      searchInput.value = '';
      updateClearX();
      hideStatus();
    }
  }
});


/* ─────────────────────────────────────────────
   EVENT 5: scroll — Navbar becomes solid
───────────────────────────────────────────── */
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});


/* ─────────────────────────────────────────────
   START FRESH — reset and search
───────────────────────────────────────────── */
function startFresh(query) {
  state.query = query;
  state.page  = 1;
  clearAll(false);
  fetchPhotos();
}


/* ─────────────────────────────────────────────
   FETCH PHOTOS — AJAX to Unsplash API
   Displays:
     1. Photo title / alt description
     2. Photographer name
     3. Location (city + country)
     4. Likes count
     5. Date published
     + description, download link, full image
───────────────────────────────────────────── */
async function fetchPhotos() {
  if (state.isLoading) return;
  state.isLoading = true;

  showStatus('🌴 Loading palm photography…', 'loading');
  showSkeletons();

  /* Pexels API — works from file:// with no CORS issues */
  const url =
    `${API_BASE}/search` +
    `?query=${encodeURIComponent(state.query)}` +
    `&page=${state.page}` +
    `&per_page=${state.perPage}`;

  try {
    /* ── AJAX call ── */
    const res = await fetch(url, {
      headers: {
        'Authorization': API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);

    const data = await res.json();
    removeSkeletons();

    if (!data.photos || data.photos.length === 0) {
      renderEmpty();
      showStatus('🔍 No photos found. Try: "date palm", "palm riyadh", or "tropical palm".', 'error');
      state.isLoading = false;
      return;
    }

    state.totalPages = Math.ceil(data.total_results / state.perPage);

    /* Show gallery */
    gallerySection.classList.remove('hidden');
    galleryTitle.textContent = `"${state.query}"`;
    galleryCount.textContent = `${data.total_results.toLocaleString()} photos`;

    /* Build masonry cards */
    data.photos.forEach((photo, i) => {
      const card = buildCard(photo, i);
      const shortest = state.colHeights.indexOf(Math.min(...state.colHeights));
      cols[shortest].appendChild(card);
      const approxH = 300 / (photo.width / photo.height);
      state.colHeights[shortest] += approxH + 16;
    });

    hideStatus();
    buildLoadMore();

  } catch (err) {
    removeSkeletons();
    showStatus(`❌ Could not load photos. Check your internet connection. (${err.message})`, 'error');
  }

  state.isLoading = false;
}


/* ─────────────────────────────────────────────
   BUILD CARD — dynamic DOM creation
   5 data fields from Unsplash API:
     1. alt_description  — photo title
     2. user.name        — photographer name
     3. location         — city + country
     4. likes            — like count
     5. created_at       — publish date
───────────────────────────────────────────── */
function buildCard(photo, index) {

  /* ── Extract Pexels API data ── */
  const title        = photo.alt
    ? cap(photo.alt)
    : 'Palm Tree';
  const photographer = photo.photographer        ?? 'Unknown Photographer';
  const userLink     = photo.photographer_url    ?? '#';
  const location     = photo.photographer_url
    ? `Photographed by ${photographer}`
    : 'Location unknown';
  const likes        = '—';   // Pexels doesn't expose likes publicly
  const date         = '—';   // Pexels doesn't expose date in search
  const description  = photo.alt ?? 'A stunning palm tree photograph.';
  const thumbURL     = photo.src?.large          ?? photo.src?.medium ?? '';
  const fullURL      = photo.src?.original       ?? photo.src?.large  ?? '';
  const downloadURL  = photo.url                 ?? '#';
  const color        = photo.avg_color           ?? '#c8c0b0';
  const w            = photo.width               ?? 1;
  const h            = photo.height              ?? 1;

  /* ── Build card element ── */
  const card          = document.createElement('div');
  card.className      = 'photo-card';
  card.style.animationDelay = `${(index % 8) * 0.06}s`;
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${title} by ${photographer}, double-click for details`);

  /* Image */
  const img        = document.createElement('img');
  img.src          = thumbURL;
  img.alt          = title;
  img.loading      = 'lazy';
  img.style.backgroundColor = color;
  img.style.aspectRatio = `${w} / ${h}`;
  img.onerror = () => { img.style.minHeight = '200px'; };

  /* Photographer badge — always visible */
  const likesEl      = document.createElement('div');
  likesEl.className  = 'card-likes';
  likesEl.innerHTML  = `📷 ${photographer}`;

  /* Hover overlay */
  const overlay      = document.createElement('div');
  overlay.className  = 'card-overlay';
  overlay.innerHTML  = `
    <h3 class="card-title">${title}</h3>
    <p class="card-photographer">📷 ${photographer}</p>
    <div class="card-chips-overlay">
      <span class="chip-overlay">🌴 Palm Photography</span>
      <span class="chip-overlay">📸 Pexels</span>
    </div>
    <p class="card-dbl">Double-click for full details</p>
  `;

  card.appendChild(img);
  card.appendChild(likesEl);
  card.appendChild(overlay);

  /* ── EVENT 4: dblclick — open modal ── */
  card.addEventListener('dblclick', () => {
    openModal({ title, photographer, userLink, location, likes, date, description, fullURL, downloadURL, color });
  });

  return card;
}


/* ─────────────────────────────────────────────
   MODAL
───────────────────────────────────────────── */
function openModal({ title, photographer, userLink, location, likes, date, description, fullURL, downloadURL, color }) {
  modalBody.innerHTML = `
    ${fullURL
      ? `<img src="${fullURL}" alt="${title}" class="modal-full-img" onerror="this.outerHTML='<div class=modal-placeholder>🌴</div>'">`
      : `<div class="modal-placeholder" style="background:${color}">🌴</div>`
    }
    <div class="modal-body-content">
      <h2 class="modal-photo-title">${title}</h2>
      <p class="modal-photo-desc">${description}</p>
      <div class="modal-info-grid">
        <div class="modal-info-box">
          <div class="info-lbl">📷 Photographer</div>
          <div class="info-val">${photographer}</div>
        </div>
        <div class="modal-info-box">
          <div class="info-lbl">📍 Profile</div>
          <div class="info-val"><a href="${userLink}" target="_blank" style="color:var(--forest)">View on Pexels →</a></div>
        </div>
        <div class="modal-info-box">
          <div class="info-lbl">🌿 Category</div>
          <div class="info-val">Palm Tree Photography</div>
        </div>
        <div class="modal-info-box">
          <div class="info-lbl">📸 Source</div>
          <div class="info-val">Pexels</div>
        </div>
        <div class="modal-info-box">
          <div class="info-lbl">🔍 Search</div>
          <div class="info-val">${state.query}</div>
        </div>
        <div class="modal-info-box">
          <div class="info-lbl">✅ License</div>
          <div class="info-val">Free to use</div>
        </div>
      </div>
      <div class="modal-btns">
        <a href="${userLink}" target="_blank" rel="noopener" class="modal-btn btn-view">
          👤 View Photographer
        </a>
        <a href="${downloadURL}" target="_blank" rel="noopener" class="modal-btn btn-download">
          🔗 View on Pexels
        </a>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}


/* ─────────────────────────────────────────────
   CLEAR ALL — DOM removal
───────────────────────────────────────────── */
function clearAll(resetInput = true) {
  /* ── Remove all cards from every column ── DOM REMOVAL ✅ */
  cols.forEach(col => {
    while (col.firstChild) col.removeChild(col.firstChild);
  });
  /* Reset column heights */
  state.colHeights = [0, 0, 0, 0];

  /* Remove load more button ── DOM REMOVAL ✅ */
  while (loadMoreWrap.firstChild) loadMoreWrap.removeChild(loadMoreWrap.firstChild);

  gallerySection.classList.add('hidden');
  hideStatus();

  if (resetInput) {
    searchInput.value = '';
    updateClearX();
    searchInput.focus();
  }
}


/* ─────────────────────────────────────────────
   LOAD MORE — dynamic button
───────────────────────────────────────────── */
function buildLoadMore() {
  /* Remove old ── DOM REMOVAL ✅ */
  while (loadMoreWrap.firstChild) loadMoreWrap.removeChild(loadMoreWrap.firstChild);

  if (state.page < state.totalPages) {
    /* Create new ── DOM CREATION ✅ */
    const btn       = document.createElement('button');
    btn.className   = 'btn-load-more';
    btn.textContent = 'Load More Photos';
    btn.addEventListener('click', () => {
      state.page++;
      fetchPhotos();
    });
    loadMoreWrap.appendChild(btn);
  }
}


/* ─────────────────────────────────────────────
   SKELETON LOADERS
───────────────────────────────────────────── */
function showSkeletons() {
  gallerySection.classList.remove('hidden');
  const heights = [220, 300, 180, 260, 320, 200, 240, 290];
  heights.forEach((h, i) => {
    const sk       = document.createElement('div');
    sk.className   = 'skeleton-card';
    sk.dataset.sk  = 'true';
    const ph       = document.createElement('div');
    ph.className   = 'sk-photo';
    ph.style.height = `${h}px`;
    sk.appendChild(ph);
    cols[i % 4].appendChild(sk);
  });
}

function removeSkeletons() {
  document.querySelectorAll('[data-sk="true"]').forEach(el => el.remove());
}


/* ─────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────── */
function renderEmpty() {
  gallerySection.classList.remove('hidden');
  const wrap       = document.createElement('div');
  wrap.className   = 'empty-state';
  wrap.innerHTML   = `
    <div class="empty-icon">🌴</div>
    <h3 class="empty-title">No photos found</h3>
    <p class="empty-sub">Try searching "date palm", "palm riyadh", or "tropical palm sunset"</p>
  `;
  cols[0].appendChild(wrap);
}


/* ─────────────────────────────────────────────
   STATUS HELPERS
───────────────────────────────────────────── */
function showStatus(msg, type = 'loading') {
  statusMsg.textContent = msg;
  statusMsg.className   = `status-msg ${type}`;
  statusMsg.classList.remove('hidden');
}
function hideStatus() { statusMsg.classList.add('hidden'); }


/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function cap(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}


/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
window.addEventListener('load', () => {
  searchInput.value = state.query;
  fetchPhotos();
});
