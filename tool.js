/* ═══════════════════════════════════════════
   MIX & MATCH TEMPLATES
═══════════════════════════════════════════ */
const MIXTAPE_TEMPLATES = {
  "4 Passports + 4 Stamps": [
    { name: "Passport", format: "passport", qty: 4 },
    { name: "Stamp", format: "stamp", qty: 4 }
  ],
  "8 Passports": [
    { name: "Passport", format: "passport", qty: 8 }
  ],
  "8 Stamps": [
    { name: "Stamp", format: "stamp", qty: 8 }
  ],
  "Custom Mix": [
    { name: "Passport", format: "passport", qty: 1 },
    { name: "Passport", format: "passport", qty: 1 },
    { name: "Passport", format: "passport", qty: 1 },
    { name: "Passport", format: "passport", qty: 1 },
    { name: "Passport", format: "passport", qty: 1 },
    { name: "Passport", format: "passport", qty: 1 },
    { name: "Passport", format: "passport", qty: 1 },
    { name: "Passport", format: "passport", qty: 1 }
  ]
};

/* ═══════════════════════════════════════════
   IMAGE UPLOAD
═══════════════════════════════════════════ */
let removeBgApiKey = localStorage.getItem('ppp_removebg_key') || '4btiRFSh8FEp3PQ5dhbgJeER';

function initToolUI() {
  updatePremiumUI();
  const input = document.getElementById('photoInput');
  if (input && !input._bound) {
    input._bound = true;
    input.addEventListener('change', handleUpload);
  }
  const sizeSelect = document.getElementById('sizeSelect');
  if (sizeSelect && !sizeSelect._bound) {
    sizeSelect._bound = true;
    sizeSelect.addEventListener('change', () => {
      state.selectedSize = sizeSelect.value;
      if (state.originalImage) generateLayout();
    });
  }
  // Mix & Match input
  const mixtapeInput = document.getElementById('mixtapePhotoInput');
  if (mixtapeInput && !mixtapeInput._bound) {
    mixtapeInput._bound = true;
    mixtapeInput.addEventListener('change', handleMixtapeUpload);
  }
  // Initialize mixtape template dropdown
  const mixtapeDropdown = document.getElementById('mixtapeTemplateSelect');
  if (mixtapeDropdown && !mixtapeDropdown._bound) {
    mixtapeDropdown._bound = true;
    mixtapeDropdown.value = state.selectedTemplate;
  }
}

function handleUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      state.originalImage = img;
      state.processedCanvas = null;
      state.bgRemoved = false;
      showUploadPreview(img.src);
      generateLayout();
      showToast('Photo uploaded!', 'success');
      document.getElementById('restoreBgBtn').disabled = false;
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function showUploadPreview(src) {
  const prev = document.getElementById('uploadPreview');
  const placeholder = document.getElementById('uploadPlaceholder');
  prev.src = src;
  prev.style.display = 'block';
  placeholder.style.display = 'none';
}

/* ═══════════════════════════════════════════
   COPIES CONTROL
═══════════════════════════════════════════ */
function adjustCopies(delta) {
  const size = SIZES[state.selectedSize];
  const maxFit = calcMaxFit(size);
  state.copies = Math.max(1, Math.min(maxFit, state.copies + delta));
  document.getElementById('copiesNum').textContent = state.copies;
  document.getElementById('maxCopiesInfo').textContent = `/ ${maxFit} max`;
  if (state.originalImage) generateLayout();
}

function calcMaxFit(size) {
  const margin = 5, gap = 2;
  const cols = Math.floor((A4.w - 2 * margin + gap) / (size.w + gap));
  const rows = Math.floor((A4.h - 2 * margin + gap) / (size.h + gap));
  return Math.max(1, cols * rows);
}

/* ═══════════════════════════════════════════
   BACKGROUND REMOVAL (remove.bg API)
═══════════════════════════════════════════ */
function removeBackground() {
  if (!state.originalImage) { showToast('Upload a photo first', 'error'); return; }
  
  if (!removeBgApiKey) {
    showToast('Please set up your remove.bg API key', 'error');
    document.getElementById('apiKeyModal').classList.add('open');
    return;
  }

  const btn = document.getElementById('removeBgBtn');
  btn.textContent = '⏳ Processing...';
  btn.disabled = true;

  try {
    const src = state.originalImage;
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = src.naturalWidth;
    tmpCanvas.height = src.naturalHeight;
    const ctx = tmpCanvas.getContext('2d');

    const b = state.brightness / 100;
    ctx.filter = `brightness(${b}) contrast(${state.contrast / 100})`;
    ctx.save();
    if (state.rotation !== 0) {
      ctx.translate(tmpCanvas.width/2, tmpCanvas.height/2);
      ctx.rotate(state.rotation * Math.PI / 180);
      ctx.translate(-tmpCanvas.width/2, -tmpCanvas.height/2);
    }
    ctx.drawImage(src, 0, 0);
    ctx.restore();

    const imageData = tmpCanvas.toDataURL('image/png');
    
    const formData = new FormData();
    fetch(imageData)
      .then(res => res.blob())
      .then(blob => {
        formData.append('image_file', blob);
        return fetch('https://api.remove.bg/v1.0/removebg', {
          method: 'POST',
          headers: {
            'X-API-Key': removeBgApiKey
          },
          body: formData
        });
      })
      .then(res => {
        if (!res.ok) {
          if (res.status === 403 || res.status === 401) {
            throw new Error('Invalid API key. Please enter a valid remove.bg API key.');
          }
          throw new Error('API Error: ' + res.statusText);
        }
        return res.blob();
      })
      .then(blob => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const resultImg = new Image();
          resultImg.onload = () => {
            const resultCanvas = document.createElement('canvas');
            resultCanvas.width = resultImg.width;
            resultCanvas.height = resultImg.height;
            const rCtx = resultCanvas.getContext('2d');

            rCtx.fillStyle = state.currentBgColor;
            rCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
            rCtx.drawImage(resultImg, 0, 0);

            state.processedCanvas = resultCanvas;
            state.bgRemoved = true;
            generateLayout();
            showToast('Background removed!', 'success');
            btn.textContent = '✂️ Remove Background';
            btn.disabled = false;
          };
          resultImg.src = e.target.result;
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => {
        console.error(err);
        showToast('Error: ' + err.message, 'error');
        btn.textContent = '✂️ Remove Background';
        btn.disabled = false;
      });
  } catch(e) {
    console.error(e);
    showToast('Error processing image: ' + e.message, 'error');
    btn.textContent = '✂️ Remove Background';
    btn.disabled = false;
  }
}

/* ═══════════════════════════════════════════
   API KEY SETUP
═══════════════════════════════════════════ */
function saveApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (!key) {
    showToast('Please enter an API key', 'error');
    return;
  }
  removeBgApiKey = key;
  localStorage.setItem('ppp_removebg_key', key);
  document.getElementById('apiKeyModal').classList.remove('open');
  showToast('API key saved!', 'success');
}

function skipApiKeySetup() {
  document.getElementById('apiKeyModal').classList.remove('open');
  showToast('Background removal requires an API key', '');
}

function restoreBackground() {
  state.processedCanvas = null;
  state.bgRemoved = false;
  generateLayout();
  showToast('Restored original');
}

/* ═══════════════════════════════════════════
   BACKGROUND COLOR
═══════════════════════════════════════════ */
function setBgColor(color, el) {
  state.currentBgColor = color;
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  if (state.bgRemoved && state.originalImage) removeBackground();
  else if (state.originalImage) generateLayout();
}

function setBgColorCustom(color) {
  state.currentBgColor = color;
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  if (state.bgRemoved && state.originalImage) removeBackground();
  else if (state.originalImage) generateLayout();
}

/* ═══════════════════════════════════════════
   EDITS
═══════════════════════════════════════════ */
function applyEdits() {
  const b = document.getElementById('slBright').value;
  const c = document.getElementById('slContrast').value;
  const r = document.getElementById('slRotation').value;
  state.brightness = parseInt(b);
  state.contrast = parseInt(c);
  state.rotation = parseInt(r);
  document.getElementById('valBright').textContent = b + '%';
  document.getElementById('valContrast').textContent = c + '%';
  document.getElementById('valRotation').textContent = r + '°';
  if (state.originalImage) generateLayout();
}

function resetEdits() {
  state.brightness = 100; state.contrast = 100; state.rotation = 0;
  document.getElementById('slBright').value = 100;
  document.getElementById('slContrast').value = 100;
  document.getElementById('slRotation').value = 0;
  applyEdits();
}

/* ═══════════════════════════════════════════
   A4 LAYOUT GENERATION
═══════════════════════════════════════════ */
function generateLayout() {
  if (!state.originalImage) return;

  const size = SIZES[state.selectedSize];
  const DPI = 96;
  const MM2PX = DPI / 25.4;

  const a4W = Math.round(A4.w * MM2PX);
  const a4H = Math.round(A4.h * MM2PX);
  const margin = Math.round(5 * MM2PX);
  const gap = Math.round(2 * MM2PX);
  const photoW = Math.round(size.w * MM2PX);
  const photoH = Math.round(size.h * MM2PX);

  const cols = Math.floor((a4W - 2 * margin + gap) / (photoW + gap));
  const rows = Math.floor((a4H - 2 * margin + gap) / (photoH + gap));
  const maxFit = cols * rows;
  const count = Math.min(state.copies, maxFit);

  document.getElementById('copiesNum').textContent = state.copies;
  document.getElementById('maxCopiesInfo').textContent = `/ ${maxFit} max`;

  const canvas = document.getElementById('a4Canvas');
  const ctx = canvas.getContext('2d');

  const displayW = 480, displayH = 679;
  const scale = Math.min(displayW / a4W, displayH / a4H);
  canvas.width = Math.round(a4W * scale);
  canvas.height = Math.round(a4H * scale);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const srcCanvas = getSourceCanvas();

  const m = margin * scale;
  const g = gap * scale;
  const pw = photoW * scale;
  const ph = photoH * scale;

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = m + col * (pw + g);
    const y = m + row * (ph + g);
    ctx.drawImage(srcCanvas, x, y, pw, ph);
  }

  document.getElementById('a4Placeholder').style.display = 'none';
  canvas.style.display = 'block';
}

function getSourceCanvas() {
  if (state.processedCanvas) {
    const tmp = document.createElement('canvas');
    tmp.width = state.processedCanvas.width;
    tmp.height = state.processedCanvas.height;
    const ctx = tmp.getContext('2d');
    ctx.filter = `brightness(${state.brightness/100}) contrast(${state.contrast/100})`;
    ctx.save();
    if (state.rotation !== 0) {
      ctx.translate(tmp.width/2, tmp.height/2);
      ctx.rotate(state.rotation * Math.PI/180);
      ctx.translate(-tmp.width/2, -tmp.height/2);
    }
    ctx.drawImage(state.processedCanvas, 0, 0);
    ctx.restore();
    return tmp;
  }

  const img = state.originalImage;
  const tmp = document.createElement('canvas');
  tmp.width = img.naturalWidth;
  tmp.height = img.naturalHeight;
  const ctx = tmp.getContext('2d');
  ctx.fillStyle = state.currentBgColor;
  ctx.fillRect(0, 0, tmp.width, tmp.height);
  ctx.filter = `brightness(${state.brightness/100}) contrast(${state.contrast/100})`;
  ctx.save();
  if (state.rotation !== 0) {
    ctx.translate(tmp.width/2, tmp.height/2);
    ctx.rotate(state.rotation * Math.PI/180);
    ctx.translate(-tmp.width/2, -tmp.height/2);
  }
  ctx.drawImage(img, 0, 0);
  ctx.restore();
  return tmp;
}

/* ═══════════════════════════════════════════
   PRINT
═══════════════════════════════════════════ */
function doPrint() {
  if (state.mixTapeMode) {
    doPrintMixtape();
    return;
  }
  
  if (!state.originalImage) { showToast('Upload a photo first', 'error'); return; }
  if (!state.isPremium && state.printCount >= CONFIG.starterPrintLimit) {
    showToast('Print limit reached. Upgrade to Premium!', 'error');
    window.location.href = 'premium.html';
    return;
  }

  const size = SIZES[state.selectedSize];
  const DPI = 300;
  const MM2PX = DPI / 25.4;
  const a4W = Math.round(A4.w * MM2PX);
  const a4H = Math.round(A4.h * MM2PX);
  const margin = Math.round(5 * MM2PX);
  const gap = Math.round(2 * MM2PX);
  const photoW = Math.round(size.w * MM2PX);
  const photoH = Math.round(size.h * MM2PX);
  const cols = Math.floor((a4W - 2*margin + gap) / (photoW + gap));
  const rows = Math.floor((a4H - 2*margin + gap) / (photoH + gap));
  const count = Math.min(state.copies, cols * rows);

  const printCanvas = document.createElement('canvas');
  printCanvas.width = a4W;
  printCanvas.height = a4H;
  const ctx = printCanvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, a4W, a4H);

  const srcCanvas = getSourceCanvas();
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = margin + col * (photoW + gap);
    const y = margin + row * (photoH + gap);
    ctx.drawImage(srcCanvas, x, y, photoW, photoH);
  }

  const dataURL = printCanvas.toDataURL('image/jpeg', 0.95);
  const printWin = window.open('', '_blank', 'width=800,height=900');
  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print - ${state.selectedSize} photos</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { margin: 0; size: A4 portrait; }
        body { margin: 0; padding: 0; }
        img { width: 210mm; height: 297mm; display: block; }
      </style>
    </head>
    <body>
      <img src="${dataURL}" onload="window.print();setTimeout(()=>window.close(),500)">
    </body>
    </html>
  `);
  printWin.document.close();

  if (!state.isPremium) {
    state.printCount++;
    updatePrintCountUI();
  }
  showToast('Print dialog opened!', 'success');
}

/* ═══════════════════════════════════════════
   CROP TOOL
═══════════════════════════════════════════ */
let cropImg = null;
let cropCanvas, cropCtx;

function openCropModal() {
  if (!state.originalImage) { showToast('Upload a photo first', 'error'); return; }
  state.cropOffsetX = 0;
  state.cropOffsetY = 0;
  state.cropScale = 1;
  document.getElementById('cropZoom').value = 100;
  document.getElementById('cropZoomVal').textContent = '100%';

  document.getElementById('cropModal').classList.add('open');

  cropCanvas = document.getElementById('cropCanvas');
  cropCtx = cropCanvas.getContext('2d');
  const container = document.getElementById('cropContainer');
  cropCanvas.width = container.clientWidth;
  cropCanvas.height = container.clientHeight;

  cropImg = state.processedCanvas || state.originalImage;
  drawCrop();
  setupCropDrag();
}

function drawCrop() {
  if (!cropCtx) return;
  const W = cropCanvas.width, H = cropCanvas.height;
  cropCtx.clearRect(0, 0, W, H);
  cropCtx.fillStyle = '#1a1a2e';
  cropCtx.fillRect(0, 0, W, H);

  const size = SIZES[state.selectedSize];
  const aspect = size.w / size.h;
  const drawH = H * state.cropScale;
  const drawW = drawH * (cropImg.naturalWidth || cropImg.width) / (cropImg.naturalHeight || cropImg.height);

  const x = (W - drawW) / 2 + state.cropOffsetX;
  const y = (H - drawH) / 2 + state.cropOffsetY;

  cropCtx.drawImage(cropImg, x, y, drawW, drawH);

  const cropW = Math.min(W * 0.7, H * 0.7 * aspect);
  const cropH = cropW / aspect;
  const cx = (W - cropW) / 2, cy = (H - cropH) / 2;

  cropCtx.fillStyle = 'rgba(0,0,0,0.5)';
  cropCtx.fillRect(0, 0, W, cy);
  cropCtx.fillRect(0, cy + cropH, W, H - cy - cropH);
  cropCtx.fillRect(0, cy, cx, cropH);
  cropCtx.fillRect(cx + cropW, cy, W - cx - cropW, cropH);

  cropCtx.strokeStyle = '#2B73FF';
  cropCtx.lineWidth = 2;
  cropCtx.strokeRect(cx, cy, cropW, cropH);

  cropCtx.strokeStyle = 'rgba(43,115,255,0.4)';
  cropCtx.lineWidth = 0.5;
  cropCtx.beginPath();
  cropCtx.moveTo(cx + cropW/3, cy); cropCtx.lineTo(cx + cropW/3, cy + cropH);
  cropCtx.moveTo(cx + cropW*2/3, cy); cropCtx.lineTo(cx + cropW*2/3, cy + cropH);
  cropCtx.moveTo(cx, cy + cropH/3); cropCtx.lineTo(cx + cropW, cy + cropH/3);
  cropCtx.moveTo(cx, cy + cropH*2/3); cropCtx.lineTo(cx + cropW, cy + cropH*2/3);
  cropCtx.stroke();
}

function updateCropZoom(val) {
  state.cropScale = val / 100;
  document.getElementById('cropZoomVal').textContent = val + '%';
  drawCrop();
}

function setupCropDrag() {
  if (cropCanvas._cropBound) return;
  cropCanvas._cropBound = true;

  cropCanvas.addEventListener('mousedown', e => {
    state.cropDragging = true;
    state.cropStartX = e.clientX - state.cropOffsetX;
    state.cropStartY = e.clientY - state.cropOffsetY;
  });
  cropCanvas.addEventListener('mousemove', e => {
    if (!state.cropDragging) return;
    state.cropOffsetX = e.clientX - state.cropStartX;
    state.cropOffsetY = e.clientY - state.cropStartY;
    drawCrop();
  });
  cropCanvas.addEventListener('mouseup', () => state.cropDragging = false);
  cropCanvas.addEventListener('mouseleave', () => state.cropDragging = false);

  cropCanvas.addEventListener('touchstart', e => {
    state.cropDragging = true;
    state.cropStartX = e.touches[0].clientX - state.cropOffsetX;
    state.cropStartY = e.touches[0].clientY - state.cropOffsetY;
  });
  cropCanvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!state.cropDragging) return;
    state.cropOffsetX = e.touches[0].clientX - state.cropStartX;
    state.cropOffsetY = e.touches[0].clientY - state.cropStartY;
    drawCrop();
  }, { passive: false });
  cropCanvas.addEventListener('touchend', () => state.cropDragging = false);
}

function applyCrop() {
  if (!cropCtx) return;
  const W = cropCanvas.width, H = cropCanvas.height;
  const size = SIZES[state.selectedSize];
  const aspect = size.w / size.h;
  const cropW = Math.min(W * 0.7, H * 0.7 * aspect);
  const cropH = cropW / aspect;
  const cx = (W - cropW) / 2, cy = (H - cropH) / 2;

  const outputCanvas = document.createElement('canvas');
  const outW = Math.round(size.w * 10), outH = Math.round(size.h * 10);
  outputCanvas.width = outW;
  outputCanvas.height = outH;
  const oCtx = outputCanvas.getContext('2d');
  oCtx.fillStyle = state.currentBgColor;
  oCtx.fillRect(0, 0, outW, outH);
  oCtx.drawImage(cropCanvas, cx, cy, cropW, cropH, 0, 0, outW, outH);

  state.processedCanvas = outputCanvas;

  const previewSrc = outputCanvas.toDataURL();
  document.getElementById('uploadPreview').src = previewSrc;

  closeCropModal();
  generateLayout();
  showToast('Crop applied!', 'success');
}

function closeCropModal() {
  document.getElementById('cropModal').classList.remove('open');
}

/* ═══════════════════════════════════════════
   RESET
═══════════════════════════════════════════ */
function resetAll() {
  state.originalImage = null;
  state.processedCanvas = null;
  state.bgRemoved = false;
  state.brightness = 100;
  state.contrast = 100;
  state.rotation = 0;
  state.copies = 8;
  state.uploadedImages = [];
  state.layoutSlots = [];

  document.getElementById('uploadPreview').style.display = 'none';
  document.getElementById('uploadPlaceholder').style.display = 'block';
  document.getElementById('photoInput').value = '';
  document.getElementById('mixtapePhotoInput').value = '';
  document.getElementById('a4Canvas').style.display = 'none';
  document.getElementById('a4Placeholder').style.display = 'flex';
  document.getElementById('slBright').value = 100;
  document.getElementById('slContrast').value = 100;
  document.getElementById('slRotation').value = 0;
  document.getElementById('valBright').textContent = '100%';
  document.getElementById('valContrast').textContent = '100%';
  document.getElementById('valRotation').textContent = '0°';
  document.getElementById('copiesNum').textContent = 8;
  document.getElementById('restoreBgBtn').disabled = true;
  
  if (state.mixTapeMode) {
    renderMixtapeSlots();
  }

  showToast('Reset done');
}

/* ═══════════════════════════════════════════
   MIX & MATCH MODE
═══════════════════════════════════════════ */
function switchMode(mode, btn) {
  state.mixTapeMode = (mode === 'mixtape');
  
  // Update button states
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('mode-btn-active'));
  btn.classList.add('mode-btn-active');
  
  // Show/hide UI sections
  const simpleVisible = !state.mixTapeMode;
  document.getElementById('sizeSelect').parentElement.parentElement.style.display = simpleVisible ? 'block' : 'none';
  document.querySelector('.copies-control').parentElement.parentElement.style.display = simpleVisible ? 'block' : 'none';
  document.getElementById('mixtapeTemplateSection').style.display = state.mixTapeMode ? 'block' : 'none';
  document.getElementById('mixtapeImageSlots').style.display = state.mixTapeMode ? 'block' : 'none';
  document.getElementById('cropBtn').style.display = simpleVisible ? 'inline-flex' : 'none';
  
  if (state.mixTapeMode) {
    state.uploadedImages = [];
    state.layoutSlots = [];
    selectMixtapeTemplate(state.selectedTemplate);
    // Sync dropdown to reflect the selected template
    const dropdown = document.getElementById('mixtapeTemplateSelect');
    if (dropdown) {
      dropdown.value = state.selectedTemplate;
    }
  } else {
    state.originalImage = null;
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('uploadPreview').style.display = 'none';
  }
  
  showToast(`Switched to ${mode === 'simple' ? 'Simple' : 'Mix & Match'} mode`);
}

function selectMixtapeTemplate(templateName) {
  state.selectedTemplate = templateName;
  state.uploadedImages = [];
  state.layoutSlots = [];
  
  const templateDef = MIXTAPE_TEMPLATES[templateName];
  if (!templateDef) return;
  
  // Generate layout slots based on template
  let slotId = 0;
  templateDef.forEach(item => {
    for (let i = 0; i < item.qty; i++) {
      state.layoutSlots.push({
        slotId: slotId,
        imageId: null,
        format: item.format
      });
      slotId++;
    }
  });
  
  // Sync dropdown to reflect selection
  const dropdown = document.getElementById('mixtapeTemplateSelect');
  if (dropdown && dropdown.value !== templateName) {
    dropdown.value = templateName;
  }
  
  renderMixtapeSlots();
  showToast(`Template: ${templateName} (${state.layoutSlots.length} slots)`);
}

function renderMixtapeSlots() {
  const container = document.getElementById('mixtapeSlotsList');
  container.innerHTML = '';
  
  state.layoutSlots.forEach(slot => {
    const slotDiv = document.createElement('div');
    slotDiv.className = 'mixtape-slot';
    slotDiv.title = `${SIZES[slot.format].name} (${SIZES[slot.format].w}×${SIZES[slot.format].h}mm)`;
    
    if (slot.imageId !== null) {
      const img = state.uploadedImages.find(u => u.id === slot.imageId);
      if (img) {
        slotDiv.style.backgroundImage = `url(${img.canvas.toDataURL()})`;
        slotDiv.style.backgroundSize = 'cover';
        slotDiv.style.backgroundPosition = 'center';
      }
    }
    
    slotDiv.onclick = () => {
      // Allow reordering: click slot to pick which uploaded image to use
      if (state.uploadedImages.length === 0) {
        showToast('Upload images first', 'error');
        document.getElementById('mixtapePhotoInput').click();
      } else if (state.uploadedImages.length === 1) {
        slot.imageId = state.uploadedImages[0].id;
        renderMixtapeSlots();
        generateMixtapeLayout();
      } else {
        // Multi-image: show picker or cycle
        const currentIdx = state.uploadedImages.findIndex(u => u.id === slot.imageId);
        const nextIdx = (currentIdx + 1) % state.uploadedImages.length;
        slot.imageId = state.uploadedImages[nextIdx].id;
        renderMixtapeSlots();
        generateMixtapeLayout();
      }
    };
    
    container.appendChild(slotDiv);
  });
}

function handleMixtapeUpload(e) {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;
  
  let loaded = 0;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // Convert image to canvas for processing
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = state.currentBgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        state.uploadedImages.push({
          id: Date.now() + Math.random(),
          canvas: canvas
        });
        
        loaded++;
        if (loaded === files.length) {
          // All images loaded
          if (state.uploadedImages.length === 1) {
            // Single image: auto-replicate to all slots
            state.layoutSlots.forEach(slot => slot.imageId = state.uploadedImages[0].id);
          } else {
            // Multiple images: shuffle into slots (round-robin)
            state.layoutSlots.forEach((slot, idx) => {
              slot.imageId = state.uploadedImages[idx % state.uploadedImages.length].id;
            });
          }
          renderMixtapeSlots();
          generateMixtapeLayout();
          showToast(`Loaded ${state.uploadedImages.length} image(s)`, 'success');
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function generateMixtapeLayout() {
  if (state.layoutSlots.length === 0 || state.uploadedImages.length === 0) {
    document.getElementById('a4Placeholder').style.display = 'flex';
    document.getElementById('a4Canvas').style.display = 'none';
    return;
  }
  
  const DPI = 96;
  const MM2PX = DPI / 25.4;
  const a4W = Math.round(A4.w * MM2PX);
  const a4H = Math.round(A4.h * MM2PX);
  const margin = Math.round(5 * MM2PX);
  const gap = Math.round(2 * MM2PX);
  
  const canvas = document.getElementById('a4Canvas');
  const ctx = canvas.getContext('2d');
  
  const displayW = 480, displayH = 679;
  const scale = Math.min(displayW / a4W, displayH / a4H);
  canvas.width = Math.round(a4W * scale);
  canvas.height = Math.round(a4H * scale);
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const m = margin * scale;
  const g = gap * scale;
  
  // Calculate grid layout, trying to fit all slots
  // Simple approach: arrange sequentially, stacking by format type
  let xPos = m, yPos = m, maxRowHeight = 0;
  
  state.layoutSlots.forEach((slot, idx) => {
    const size = SIZES[slot.format];
    const photoW = Math.round(size.w * MM2PX * scale);
    const photoH = Math.round(size.h * MM2PX * scale);
    
    // Check if we need to wrap to next row
    if (xPos + photoW + m > canvas.width && idx > 0) {
      xPos = m;
      yPos += maxRowHeight + g;
      maxRowHeight = 0;
    }
    
    // Draw the image in this slot
    if (slot.imageId !== null) {
      const srcImg = state.uploadedImages.find(u => u.id === slot.imageId);
      if (srcImg) {
        ctx.drawImage(srcImg.canvas, xPos, yPos, photoW, photoH);
      }
    } else {
      // Empty slot: draw dashed border
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(xPos, yPos, photoW, photoH);
      ctx.setLineDash([]);
    }
    
    xPos += photoW + g;
    maxRowHeight = Math.max(maxRowHeight, photoH);
    
    // Break if we've exceeded A4 height
    if (yPos + maxRowHeight + m > canvas.height) {
      return; // Stop rendering further slots
    }
  });
  
  document.getElementById('a4Placeholder').style.display = 'none';
  canvas.style.display = 'block';
}

function doPrintMixtape() {
  if (state.layoutSlots.length === 0 || state.uploadedImages.length === 0) {
    showToast('Set up your layout first', 'error');
    return;
  }
  
  if (!state.isPremium && state.printCount >= CONFIG.starterPrintLimit) {
    showToast('Print limit reached. Upgrade to Premium!', 'error');
    window.location.href = 'premium.html';
    return;
  }
  
  const DPI = 300;
  const MM2PX = DPI / 25.4;
  const a4W = Math.round(A4.w * MM2PX);
  const a4H = Math.round(A4.h * MM2PX);
  const margin = Math.round(5 * MM2PX);
  const gap = Math.round(2 * MM2PX);
  
  const canvas = document.createElement('canvas');
  canvas.width = a4W;
  canvas.height = a4H;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, a4W, a4H);
  
  let xPos = margin, yPos = margin, maxRowHeight = 0;
  
  state.layoutSlots.forEach((slot, idx) => {
    const size = SIZES[slot.format];
    const photoW = Math.round(size.w * MM2PX);
    const photoH = Math.round(size.h * MM2PX);
    
    if (xPos + photoW + margin > a4W && idx > 0) {
      xPos = margin;
      yPos += maxRowHeight + gap;
      maxRowHeight = 0;
    }
    
    if (slot.imageId !== null) {
      const srcImg = state.uploadedImages.find(u => u.id === slot.imageId);
      if (srcImg) {
        ctx.drawImage(srcImg.canvas, xPos, yPos, photoW, photoH);
      }
    }
    
    xPos += photoW + gap;
    maxRowHeight = Math.max(maxRowHeight, photoH);
    
    if (yPos + maxRowHeight + margin > a4H) return;
  });
  
  const dataURL = canvas.toDataURL('image/jpeg', 0.95);
  const printWin = window.open('', '_blank', 'width=800,height=900');
  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print - Mix & Match</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { margin: 0; size: A4 portrait; }
        body { margin: 0; padding: 0; }
        img { width: 210mm; height: 297mm; display: block; }
      </style>
    </head>
    <body>
      <img src="${dataURL}" onload="window.print();setTimeout(()=>window.close(),500)">
    </body>
    </html>
  `);
  printWin.document.close();
  
  if (!state.isPremium) {
    state.printCount++;
    updatePrintCountUI();
  }
  showToast('Print dialog opened!', 'success');
}

/* ═══════════════════════════════════════════
   MIX & MATCH MODE
═══════════════════════════════════════════ */
function switchMode(mode, btn) {
  state.mixTapeMode = (mode === 'mixtape');
  
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('mode-btn-active'));
  btn.classList.add('mode-btn-active');
  
  const simpleVisible = !state.mixTapeMode;
  document.getElementById('sizeSelect').parentElement.parentElement.style.display = simpleVisible ? 'block' : 'none';
  document.querySelector('.copies-control').parentElement.parentElement.style.display = simpleVisible ? 'block' : 'none';
  document.getElementById('mixtapeTemplateSection').style.display = state.mixTapeMode ? 'block' : 'none';
  document.getElementById('mixtapeImageSlots').style.display = state.mixTapeMode ? 'block' : 'none';
  
  if (state.mixTapeMode) {
    state.uploadedImages = [];
    state.layoutSlots = [];
    selectMixtapeTemplate(state.selectedTemplate);
    const dropdown = document.getElementById('mixtapeTemplateSelect');
    if (dropdown) dropdown.value = state.selectedTemplate;
    renderMixtapeSlots();
  } else {
    state.originalImage = null;
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('uploadPreview').style.display = 'none';
  }
  
  showToast(`Switched to ${mode === 'simple' ? 'Simple' : 'Mix & Match'} mode`);
}

function selectMixtapeTemplate(templateName) {
  state.selectedTemplate = templateName;
  state.uploadedImages = [];
  state.layoutSlots = [];
  
  const templateDef = MIXTAPE_TEMPLATES[templateName];
  if (!templateDef) return;
  
  let slotId = 0;
  templateDef.forEach(item => {
    for (let i = 0; i < item.qty; i++) {
      state.layoutSlots.push({
        slotId: slotId,
        imageId: null,
        format: item.format
      });
      slotId++;
    }
  });
  
  const dropdown = document.getElementById('mixtapeTemplateSelect');
  if (dropdown && dropdown.value !== templateName) {
    dropdown.value = templateName;
  }
  
  renderMixtapeSlots();
  generateMixtapeLayout();
}

function renderMixtapeSlots() {
  const slotsList = document.getElementById('mixtapeSlotsList');
  if (!slotsList) return;
  
  slotsList.innerHTML = '';
  
  state.layoutSlots.forEach((slot, idx) => {
    const slotEl = document.createElement('div');
    const format = SIZES[slot.format] || SIZES.passport;
    const img = state.uploadedImages.find(img => img.id === slot.imageId);
    
    slotEl.style.cssText = `
      aspect-ratio: ${format.w}/${format.h};
      background: ${img ? 'no-repeat center/cover' : 'var(--surface)'};
      border: 1px solid var(--border);
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    `;
    
    if (img && img.canvas) {
      slotEl.style.backgroundImage = `url(${img.canvas.toDataURL()})`;
    }
    
    slotEl.innerHTML = `
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.7rem;color:var(--muted);text-align:center;padding:4px;background:${img ? 'transparent' : 'rgba(0,0,0,0.3)'}">
        ${img ? '' : `<span>${SIZES[slot.format]?.name || slot.format}<br><small>Click to upload</small></span>`}
      </div>
    `;
    
    slotEl.addEventListener('click', () => {
      document.getElementById('mixtapePhotoInput').click();
      window._currentSlotIdx = idx;
    });
    
    slotsList.appendChild(slotEl);
  });
}

function handleMixtapeUpload(e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  
  let loaded = 0;
  files.forEach((file, fileIdx) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const imgId = Date.now() + fileIdx;
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        state.uploadedImages.push({ id: imgId, canvas, format: null });
        
        // Auto-assign to next empty slot or to clicked slot
        const currentSlot = window._currentSlotIdx !== undefined ? state.layoutSlots[window._currentSlotIdx] : null;
        if (currentSlot && !currentSlot.imageId) {
          currentSlot.imageId = imgId;
          window._currentSlotIdx = undefined;
        } else {
          for (let slot of state.layoutSlots) {
            if (!slot.imageId) {
              slot.imageId = imgId;
              break;
            }
          }
        }
        
        loaded++;
        if (loaded === files.length) {
          renderMixtapeSlots();
          generateMixtapeLayout();
          showToast(`${files.length} image(s) uploaded!`, 'success');
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function generateMixtapeLayout() {
  const canvas = document.getElementById('a4Canvas');
  if (!canvas) return;
  
  const DPI = 96;
  const MM2PX = DPI / 25.4;
  const a4W = Math.round(A4.w * MM2PX);
  const a4H = Math.round(A4.h * MM2PX);
  const margin = Math.round(5 * MM2PX);
  const gap = Math.round(2 * MM2PX);
  
  const displayW = 480, displayH = 679;
  const scale = Math.min(displayW / a4W, displayH / a4H);
  canvas.width = Math.round(a4W * scale);
  canvas.height = Math.round(a4H * scale);
  
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw all slots
  let x = margin * scale, y = margin * scale;
  let colCount = 0;
  const maxCols = 4;
  
  state.layoutSlots.forEach(slot => {
    const format = SIZES[slot.format] || SIZES.passport;
    const photoW = Math.round(format.w * MM2PX) * scale;
    const photoH = Math.round(format.h * MM2PX) * scale;
    
    if (colCount >= maxCols) {
      colCount = 0;
      y += photoH + gap * scale;
      x = margin * scale;
    }
    
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(x, y, photoW, photoH);
    
    const img = state.uploadedImages.find(img => img.id === slot.imageId);
    if (img && img.canvas) {
      ctx.drawImage(img.canvas, x, y, photoW, photoH);
    }
    
    x += photoW + gap * scale;
    colCount++;
  });
  
  document.getElementById('a4Placeholder').style.display = 'none';
  canvas.style.display = 'block';
}

function doPrintMixtape() {
  if (!state.layoutSlots.length || !state.uploadedImages.length) {
    showToast('Upload images first', 'error');
    return;
  }
  
  const DPI = 300;
  const MM2PX = DPI / 25.4;
  const a4W = Math.round(A4.w * MM2PX);
  const a4H = Math.round(A4.h * MM2PX);
  const margin = Math.round(5 * MM2PX);
  const gap = Math.round(2 * MM2PX);
  
  const printCanvas = document.createElement('canvas');
  printCanvas.width = a4W;
  printCanvas.height = a4H;
  const ctx = printCanvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, a4W, a4H);
  
  let x = margin, y = margin;
  let colCount = 0;
  const maxCols = 4;
  
  state.layoutSlots.forEach(slot => {
    const format = SIZES[slot.format] || SIZES.passport;
    const photoW = Math.round(format.w * MM2PX);
    const photoH = Math.round(format.h * MM2PX);
    
    if (colCount >= maxCols) {
      colCount = 0;
      y += photoH + gap;
      x = margin;
    }
    
    const img = state.uploadedImages.find(img => img.id === slot.imageId);
    if (img && img.canvas) {
      ctx.drawImage(img.canvas, x, y, photoW, photoH);
    }
    
    x += photoW + gap;
    colCount++;
  });
  
  const dataURL = printCanvas.toDataURL('image/jpeg', 0.95);
  const printWin = window.open('', '_blank', 'width=800,height=900');
  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print - Mix & Match</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { margin: 0; size: A4 portrait; }
        body { margin: 0; padding: 0; }
        img { width: 210mm; height: 297mm; display: block; }
      </style>
    </head>
    <body>
      <img src="${dataURL}" onload="window.print();setTimeout(()=>window.close(),500)">
    </body>
    </html>
  `);
  printWin.document.close();
  showToast('Print dialog opened!', 'success');
}

// Init on page load
window.addEventListener('DOMContentLoaded', () => {
  initToolUI();
  setActiveNav('tool');
  const cropModal = document.getElementById('cropModal');
  if (cropModal) {
    cropModal.addEventListener('click', function(e) {
      if (e.target === this) closeCropModal();
    });
  }
  const apiKeyModal = document.getElementById('apiKeyModal');
  if (apiKeyModal) {
    apiKeyModal.addEventListener('click', function(e) {
      if (e.target === this) skipApiKeySetup();
    });
  }
});
