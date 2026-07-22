/* ============================================================
   BIOGAS PROJECT — script.js
   ============================================================ */

/* --------------------------------------------------------
   1. MOBILE NAVIGATION
   -------------------------------------------------------- */
const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.getElementById('site-nav');

function closeMenu() {
  siteNav.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation menu');
}

menuToggle.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
});

siteNav.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') closeMenu();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && siteNav.classList.contains('is-open')) closeMenu();
});

window.addEventListener('resize', () => {
  if (window.innerWidth >= 680) closeMenu();
});


/* --------------------------------------------------------
   2. CALCULATOR
   -------------------------------------------------------- */
const wasteInput = document.getElementById('waste-kg');
const peopleInput = document.getElementById('people');
const gasOut     = document.getElementById('gas-out');
const cookOut    = document.getElementById('cook-out');

function updateCalc() {
  const kg      = parseFloat(wasteInput.value) || 0;
  const gasM3   = kg * 0.04;                // 0.04 m³ per kg
  const hours   = gasM3 * 0.43;             // 0.43 cooking hrs per m³
  gasOut.textContent  = gasM3.toFixed(2)  + ' m³';
  cookOut.textContent = hours.toFixed(2)  + ' hrs';
}

wasteInput.addEventListener('input', updateCalc);
peopleInput.addEventListener('input', updateCalc);
updateCalc(); // run on load


/* --------------------------------------------------------
   3. PHOTO GALLERY
   -------------------------------------------------------- */

// --- State ---
// Each item: { src: dataURL, caption: string }
let photos = [];
let pendingFiles = []; // queue of File objects waiting for captions
let pendingIndex = 0;  // which file we're currently captioning
let lightboxIndex = 0;

// --- Element refs ---
const uploadZone    = document.getElementById('upload-zone');
const fileInput     = document.getElementById('file-input');
const captionRow    = document.getElementById('caption-row');
const captionInput  = document.getElementById('caption-input');
const captionConfirm = document.getElementById('caption-confirm');
const captionCancel = document.getElementById('caption-cancel');
const galleryGrid   = document.getElementById('gallery-grid');
const galleryEmpty  = document.getElementById('gallery-empty');
const lightbox      = document.getElementById('lightbox');
const lbImg         = document.getElementById('lb-img');
const lbCaption     = document.getElementById('lb-caption');
const lbClose       = document.getElementById('lb-close');
const lbPrev        = document.getElementById('lb-prev');
const lbNext        = document.getElementById('lb-next');


/* --- Click on upload zone opens file picker --- */
uploadZone.addEventListener('click', () => fileInput.click());

/* --- Drag-and-drop styling --- */
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  handleFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
});

/* --- File input change --- */
fileInput.addEventListener('change', () => {
  handleFiles(Array.from(fileInput.files));
  fileInput.value = ''; // reset so same file can be re-uploaded
});

/* --- Queue files and start captioning flow --- */
function handleFiles(files) {
  if (!files.length) return;
  pendingFiles = files;
  pendingIndex = 0;
  showCaptionPrompt();
}

function showCaptionPrompt() {
  if (pendingIndex >= pendingFiles.length) {
    // All done
    captionRow.style.display = 'none';
    captionInput.value = '';
    pendingFiles = [];
    return;
  }
  const file = pendingFiles[pendingIndex];
  captionInput.placeholder = `Caption for "${file.name}" (optional)`;
  captionInput.value = '';
  captionRow.style.display = 'flex';
  captionInput.focus();
}

function commitCurrentPhoto() {
  const file = pendingFiles[pendingIndex];
  const caption = captionInput.value.trim();
  const reader = new FileReader();
  reader.onload = (e) => {
    photos.push({ src: e.target.result, caption });
    renderGallery();
  };
  reader.readAsDataURL(file);
  pendingIndex++;
  showCaptionPrompt();
}

captionConfirm.addEventListener('click', commitCurrentPhoto);
captionCancel.addEventListener('click', () => {
  pendingIndex++;
  showCaptionPrompt();
});
captionInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') commitCurrentPhoto();
  if (e.key === 'Escape') { pendingIndex++; showCaptionPrompt(); }
});


/* --- Render gallery grid --- */
function renderGallery() {
  // Clear everything except the empty state element
  Array.from(galleryGrid.children).forEach(child => {
    if (child !== galleryEmpty) galleryGrid.removeChild(child);
  });

  if (photos.length === 0) {
    galleryEmpty.style.display = '';
    return;
  }

  galleryEmpty.style.display = 'none';

  photos.forEach((photo, idx) => {
    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', photo.caption || `Photo ${idx + 1}`);

    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.caption || `Project photo ${idx + 1}`;

    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    if (photo.caption) {
      const cap = document.createElement('span');
      cap.className = 'card-caption';
      cap.textContent = photo.caption;
      overlay.appendChild(cap);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'card-delete';
    delBtn.setAttribute('aria-label', 'Remove photo');
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      photos.splice(idx, 1);
      renderGallery();
    });

    card.appendChild(img);
    card.appendChild(overlay);
    card.appendChild(delBtn);

    // Open lightbox on click / Enter key
    card.addEventListener('click', () => openLightbox(idx));
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter') openLightbox(idx); });

    galleryGrid.appendChild(card);
  });
}


/* --------------------------------------------------------
   4. LIGHTBOX
   -------------------------------------------------------- */
function openLightbox(idx) {
  lightboxIndex = idx;
  showLightboxPhoto();
  lightbox.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  lbClose.focus();
}

function closeLightbox() {
  lightbox.style.display = 'none';
  document.body.style.overflow = '';
}

function showLightboxPhoto() {
  const photo = photos[lightboxIndex];
  lbImg.src = photo.src;
  lbImg.alt = photo.caption || `Photo ${lightboxIndex + 1}`;
  lbCaption.textContent = photo.caption || '';
  lbPrev.style.visibility = lightboxIndex > 0 ? 'visible' : 'hidden';
  lbNext.style.visibility = lightboxIndex < photos.length - 1 ? 'visible' : 'hidden';
}

lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', () => { if (lightboxIndex > 0) { lightboxIndex--; showLightboxPhoto(); } });
lbNext.addEventListener('click', () => { if (lightboxIndex < photos.length - 1) { lightboxIndex++; showLightboxPhoto(); } });

// Keyboard navigation inside lightbox
lightbox.addEventListener('keydown', (e) => {
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowLeft')   { if (lightboxIndex > 0) { lightboxIndex--; showLightboxPhoto(); } }
  if (e.key === 'ArrowRight')  { if (lightboxIndex < photos.length - 1) { lightboxIndex++; showLightboxPhoto(); } }
});

// Click backdrop (not the image) to close
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});
