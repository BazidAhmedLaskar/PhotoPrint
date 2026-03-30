/* ═══════════════════════════════════════════
   CONFIGURATION
═══════════════════════════════════════════ */
const CONFIG = {
  whatsapp: '919876543210',
  shopName: 'PhotoPrint Pro',
  activationCodes: ['PHOTO500', 'SHOP500', 'PREMIUM2024', 'PHOTOPRO', 'UNLOCK500'],
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
   STATE
═══════════════════════════════════════════ */
const state = {
  isPremium: false,
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
};

/* ═══════════════════════════════════════════
   PREMIUM SYSTEM
═══════════════════════════════════════════ */
function checkPremium() {
  const saved = localStorage.getItem('ppp_premium');
  if (saved && CONFIG.activationCodes.includes(saved)) {
    state.isPremium = true;
  }
  updatePremiumUI();
}

function activatePremium() {
  const code = document.getElementById('activationCode')?.value.trim().toUpperCase();
  const status = document.getElementById('activationStatus');
  if (!code || !CONFIG.activationCodes.includes(code)) {
    if (status) {
      status.textContent = '❌ Invalid code. Contact support on WhatsApp.';
      status.className = 'activation-status status-error';
    }
    showToast('Invalid activation code', 'error');
    return;
  }
  localStorage.setItem('ppp_premium', code);
  state.isPremium = true;
  updatePremiumUI();
  updateActivationUI();
  if (status) {
    status.textContent = '✅ Premium activated! All features unlocked.';
    status.className = 'activation-status status-success';
  }
  showToast('⭐ Premium Activated!', 'success');
}

function deactivatePremium() {
  localStorage.removeItem('ppp_premium');
  state.isPremium = false;
  updatePremiumUI();
  updateActivationUI();
  showToast('Premium removed from this device');
}

function updatePremiumUI() {
  const badge = document.getElementById('premiumBadge');
  const adBanner = document.getElementById('adBanner');
  const upgradeBtn = document.getElementById('upgradeBtn');

  if (state.isPremium) {
    if (badge) badge.classList.add('visible');
    if (adBanner) adBanner.classList.remove('visible');
    if (upgradeBtn) upgradeBtn.style.display = 'none';
  } else {
    if (badge) badge.classList.remove('visible');
    if (adBanner) adBanner.classList.add('visible');
    if (upgradeBtn) upgradeBtn.style.display = 'inline-flex';
  }
  updatePrintCountUI();
}

function updateActivationUI() {
  const sec = document.getElementById('deactivateSection');
  const code = document.getElementById('activationCode');
  if (state.isPremium) {
    if (sec) sec.style.display = 'block';
    if (code) code.value = '';
  } else {
    if (sec) sec.style.display = 'none';
  }
}

function updatePrintCountUI() {
  const el = document.getElementById('printCountInfo');
  const cnt = document.getElementById('toolPrintCount');
  if (!state.isPremium) {
    const rem = CONFIG.starterPrintLimit - state.printCount;
    const msg = `Starter: ${rem} print${rem !== 1 ? 's' : ''} remaining · <a href="premium.html" style="color:var(--orange)">Upgrade for unlimited</a>`;
    if (el) el.innerHTML = msg;
    if (cnt) cnt.textContent = `${rem} prints left`;
  } else {
    if (el) el.textContent = '';
    if (cnt) cnt.textContent = 'Premium · Unlimited prints';
  }
}

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
checkPremium();

// Setup active nav link
function setActiveNav(page) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  const activeLink = document.querySelector(`a[data-page="${page}"]`);
  if (activeLink) activeLink.classList.add('active');
}
