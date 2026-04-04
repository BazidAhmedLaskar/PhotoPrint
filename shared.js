/* ═══════════════════════════════════════════
   CONFIGURATION
═══════════════════════════════════════════ */
const CONFIG = {
  whatsapp: '918471960713',
  shopName: 'PhotoPrint Pro',
  starterPrintLimit: 10,
};

/* ═══════════════════════════════════════════
   PHOTO SIZES (in mm)
═══════════════════════════════════════════ */
const SIZES = {
  passport: { name: 'Passport', w: 35,  h: 45  },
  stamp:    { name: 'Stamp',    w: 25,  h: 35  },
  aadhaar:  { name: 'Aadhaar',  w: 35,  h: 45  },
  pan:      { name: 'PAN Card', w: 25,  h: 35  },
  visa:     { name: 'Visa',     w: 51,  h: 51  },
};
const A4 = { w: 210, h: 297 };

/* ═══════════════════════════════════════════
   MIX & MATCH TEMPLATES
═══════════════════════════════════════════ */
const MIXTAPE_TEMPLATES = {
  "4 Passports + 4 Stamps": [
    { format: "passport", qty: 4 },
    { format: "stamp", qty: 4 }
  ],
  "8 Passports": [
    { format: "passport", qty: 8 }
  ],
  "8 Stamps": [
    { format: "stamp", qty: 8 }
  ],
  "Custom Mix": []
};

/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */
const state = {
  originalImage: null,
  processedCanvas: null,
  bgRemoved: false,
  currentBgColor: '#ffffff',
  selectedSize: 'passport',
  copies: 8,
  brightness: 100,
  contrast: 100,
  rotation: 0,
  printCount: 0,
  cropOffsetX: 0,
  cropOffsetY: 0,
  cropScale: 1,
  cropDragging: false,
  cropStartX: 0,
  cropStartY: 0,
  // MIX & MATCH STATE
  mixTapeMode: false,
  selectedTemplate: "4 Passports + 4 Stamps",
  uploadedImages: [], // array of { id, canvas, formatType }
  layoutSlots: [], // array of slot assignments: { slotId, imageId, format }
  replicateMode: true // true = 1 image replicates; false = shuffle multiple images
};

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════ */
let toastTimer;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast ' + (type || '');
  setTimeout(() => t.classList.add('show'), 10);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */

/* Mobile Navigation Toggle */
function toggleNavMenu() {
  const navLinks = document.getElementById('navLinks');
  const toggle = document.getElementById('navMenuToggle');
  navLinks.classList.toggle('active');
  toggle.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
}

/* Close menu when clicking a link */
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.getElementById('navLinks');
  if (navLinks) {
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const toggle = document.getElementById('navMenuToggle');
        if (toggle) toggle.textContent = '☰';
      });
    });
  }
});

checkPremium();

// Setup active nav link
function setActiveNav(page) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  const activeLink = document.querySelector(`a[data-page="${page}"]`);
  if (activeLink) activeLink.classList.add('active');
}
