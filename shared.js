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
  passport: { name: 'Passport', w: 30,  h: 40  },
  stamp:    { name: 'Stamp',    w: 25,  h: 35  },
  aadhaar:  { name: 'Aadhaar',  w: 35,  h: 45  },
  pan:      { name: 'PAN Card', w: 25,  h: 35  },
  visa:     { name: 'Visa',     w: 51,  h: 51  },
  custom:   { name: 'Custom',   w: 35,  h: 45  },
};
const A4 = { w: 210, h: 297 };

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
  toggle.classList.toggle('active');
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
        if (toggle) {
          toggle.classList.remove('active');
          toggle.textContent = '☰';
        }
      });
    });
  }

  // Check if offline on initial load
  if (!navigator.onLine) {
    showToast('📵 You are offline - using cached content', 'warning');
  }

  registerServiceWorker();
});

let swRefreshing = false;

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then(reg => {
        console.log('Service worker registered:', reg.scope);

        if (reg.waiting) {
          showToast('New version available. Reloading now...', 'success');
          window.location.reload();
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('Website update installed. Reloading now...', 'success');
            }
          });
        });
      })
      .catch(err => console.warn('Service worker registration failed:', err));

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (swRefreshing) return;
      swRefreshing = true;
      window.location.reload();
    });
  }
}

window.addEventListener('online', () => showToast('Online: background removal is available.', 'success'));
window.addEventListener('offline', () => showToast('Offline: background removal will not work.', 'warning'));

// Setup active nav link
function setActiveNav(page) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  const activeLink = document.querySelector(`a[data-page="${page}"]`);
  if (activeLink) activeLink.classList.add('active');
}
