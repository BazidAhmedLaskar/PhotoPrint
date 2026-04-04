/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */
const toolState = {
  images: [], // Array of {id, src, img, size, copies, brightness, contrast, rotation, processed, cropX, cropY, cropScale}
  currentBgColor: '#ffffff',
  selectedImageId: null, // Currently selected image for preview
  brightness: 100,
  contrast: 100,
  rotation: 0,
  cropOffsetX: 0,
  cropOffsetY: 0,
  cropScale: 1,
  cropDragging: false,
  cropStartX: 0,
  cropStartY: 0,
  cropCurrentImageIndex: null, // Track which image is being cropped
};

let removeBgApiKey = localStorage.getItem('ppp_removebg_key') || '4btiRFSh8FEp3PQ5dhbgJeER';
let tempPreviewTimeout = null;

/* ═══════════════════════════════════════════
   CAPACITY CALCULATION
═══════════════════════════════════════════ */
function calculateTotalCapacity() {
  let totalUsed = 0;
  toolState.images.forEach(img => {
    totalUsed += img.copies;
  });

  const maxCapacity = 30; // Max photos on A4
  return { used: totalUsed, max: maxCapacity, percent: Math.min(100, Math.round((totalUsed / maxCapacity) * 100)) };
}

function updateCapacity() {
  updateCapacityDisplay();
}

function updateCapacityDisplay() {
  const cap = calculateTotalCapacity();
  document.getElementById('capacityUsed').textContent = cap.used;
  document.getElementById('capacityTotal').textContent = cap.max;
  document.getElementById('capacityPercent').textContent = cap.percent + '%';
  
  const fill = document.getElementById('capacityFill');
  fill.style.width = cap.percent + '%';
  
  if (cap.percent >= 100) {
    fill.style.background = '#FF5050';
  } else if (cap.percent >= 80) {
    fill.style.background = '#FF9500';
  } else {
    fill.style.background = 'var(--blue)';
  }
}

/* ═══════════════════════════════════════════
   IMAGE UPLOAD
═══════════════════════════════════════════ */
function handleMultiImageUpload(e) {
  const files = e.target.files;
  if (!files) return;

  let filesProcessed = 0;
  const totalFiles = files.length;

  Array.from(files).forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => {
        console.warn('Failed to load image:', file.name);
        filesProcessed++;
      };
      img.onload = () => {
        // Use unique ID: currentTime + unique index per batch
        const id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const wasFirst = toolState.images.length === 0;
        
        toolState.images.push({
          id,
          src: ev.target.result,
          img,
          size: 'passport',
          copies: 1,
          brightness: 100,
          contrast: 100,
          rotation: 0,
          processed: null,
          cropX: 0,
          cropY: 0,
          cropScale: 1.0, // Full image by default
        });
        
        // Auto-select first image only
        if (wasFirst) {
          toolState.selectedImageId = id;
          selectImage(id);
        }
        
        filesProcessed++;
        
        // Update UI after all files are loaded
        if (filesProcessed === totalFiles) {
          renderImagesList();
          updateCapacityDisplay();
          generatePreview();
          showToast(`Added ${totalFiles} image${totalFiles > 1 ? 's' : ''}`, 'success');
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Reset input
  document.getElementById('photoInput').value = '';
}

function renderImagesList() {
  const list = document.getElementById('imagesList');
  list.innerHTML = '';

  if (toolState.images.length === 0) {
    return;
  }

  toolState.images.forEach((imgObj, idx) => {
    const item = document.createElement('div');
    item.className = 'image-list-item';
    if (imgObj.id === toolState.selectedImageId) {
      item.classList.add('active');
    }
    
    const sizeCapacity = calculateSizeCapacity(imgObj.size);
    const isOverCapacity = imgObj.copies > sizeCapacity;
    
    item.innerHTML = `
      <div class="image-list-item-header" onclick="selectImage('${imgObj.id}')">
        <img src="${imgObj.src}" alt="Photo ${idx + 1}" class="image-list-thumbnail">
        <div class="image-list-info">
          <div class="image-list-title">Photo ${idx + 1}</div>
          <div class="image-list-meta">${imgObj.copies}× ${SIZES[imgObj.size].name}</div>
        </div>
        <div class="image-list-remove" onclick="event.stopPropagation(); removeImage('${imgObj.id}')">✕</div>
      </div>
      <div class="image-list-controls">
        <select class="form-select" style="font-size:.75rem" onchange="updateImageSize('${imgObj.id}', this.value)">
          <option value="passport" ${imgObj.size === 'passport' ? 'selected' : ''}>Passport (35×45)</option>
          <option value="stamp" ${imgObj.size === 'stamp' ? 'selected' : ''}>Stamp (25×35)</option>
          <option value="aadhaar" ${imgObj.size === 'aadhaar' ? 'selected' : ''}>Aadhaar (35×45)</option>
          <option value="pan" ${imgObj.size === 'pan' ? 'selected' : ''}>PAN (25×35)</option>
          <option value="visa" ${imgObj.size === 'visa' ? 'selected' : ''}>Visa (51×51)</option>
        </select>
        <div class="copies-control" style="margin-top:6px">
          <button class="copies-btn" onclick="updateImageCopies('${imgObj.id}', -1)">−</button>
          <input type="number" min="1" max="50" value="${imgObj.copies}" onchange="updateImageCopies('${imgObj.id}', parseInt(this.value) - ${imgObj.copies})" style="width:40px;padding:4px;background:var(--card);border:1px solid var(--border);border-radius:4px;color:var(--text);text-align:center;font-size:.8rem">
          <button class="copies-btn" onclick="updateImageCopies('${imgObj.id}', 1)">+</button>
          <span style="font-size:.7rem;color:var(--muted);margin-left:auto">${isOverCapacity ? '⚠️ Over' : 'Max: ' + sizeCapacity}</span>
        </div>
      </div>
    `;
    
    list.appendChild(item);
  });
  
  // Scroll to view selected image
  const activeItem = list.querySelector('.image-list-item.active');
  if (activeItem) {
    activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function selectImage(id) {
  toolState.selectedImageId = id;
  const img = toolState.images.find(i => i.id === id);
  if (img) {
    // Update sliders to match this image's values
    document.getElementById('slBright').value = img.brightness;
    document.getElementById('valBright').textContent = img.brightness + '%';
    
    document.getElementById('slContrast').value = img.contrast;
    document.getElementById('valContrast').textContent = img.contrast + '%';
    
    document.getElementById('slRotation').value = img.rotation;
    document.getElementById('valRotation').textContent = img.rotation + '°';
    
    // Update global size selector to match this image's size
    const sizeSelect = document.getElementById('sizeSelect');
    if (sizeSelect) {
      sizeSelect.value = img.size;
    }
    
    showTempPreview(img);
    renderImagesList();
  }
}

function updateImageSize(id, size) {
  const img = toolState.images.find(i => i.id === id);
  if (img) {
    img.size = size;
    updateCapacityDisplay();
    generatePreview();
    renderImagesList();
  }
}

function updateImageCopies(id, delta) {
  const img = toolState.images.find(i => i.id === id);
  if (img) {
    const maxCopies = 50;
    img.copies = Math.max(1, Math.min(maxCopies, img.copies + delta));
    updateCapacityDisplay();
    generatePreview();
    renderImagesList();
  }
}

function calculateSizeCapacity(size) {
  const sizeInfo = SIZES[size];
  const margin = 5, gap = 2;
  const cols = Math.floor((A4.w - 2 * margin + gap) / (sizeInfo.w + gap));
  const rows = Math.floor((A4.h - 2 * margin + gap) / (sizeInfo.h + gap));
  return cols * rows;
}

function removeImage(id) {
  toolState.images = toolState.images.filter(img => img.id !== id);
  if (toolState.selectedImageId === id) {
    toolState.selectedImageId = toolState.images.length > 0 ? toolState.images[0].id : null;
  }
  renderImagesList();
  updateCapacityDisplay();
  generatePreview();
  if (toolState.selectedImageId) {
    const img = toolState.images.find(i => i.id === toolState.selectedImageId);
    if (img) showTempPreview(img);
  }
  showToast('Image removed', '');
}

/* ═══════════════════════════════════════════
   IMAGE PREVIEW
═══════════════════════════════════════════ */
function showImagePreview(imgObj) {
  const container = document.getElementById('imagePreviewContainer');
  const placeholder = document.getElementById('previewPlaceholder');
  const previewCanvas = document.getElementById('previewCanvas');
  const previewImage = document.getElementById('previewImage');
  const previewStats = document.getElementById('previewStats');
  
  // Generate preview with current edits (including crop)
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = imgObj.img.naturalWidth;
  tmpCanvas.height = imgObj.img.naturalHeight;
  const ctx = tmpCanvas.getContext('2d');

  // Apply edits
  const b = imgObj.brightness / 100;
  const c = imgObj.contrast / 100;
  ctx.filter = `brightness(${b}) contrast(${c})`;
  ctx.save();
  if (imgObj.rotation !== 0) {
    ctx.translate(tmpCanvas.width / 2, tmpCanvas.height / 2);
    ctx.rotate(imgObj.rotation * Math.PI / 180);
    ctx.translate(-tmpCanvas.width / 2, -tmpCanvas.height / 2);
  }
  ctx.drawImage(imgObj.img, 0, 0);
  ctx.restore();

  if (placeholder) placeholder.style.display = 'none';
  previewImage.src = tmpCanvas.toDataURL();
  previewImage.style.display = 'block';
  previewCanvas.style.display = 'none';

  const sizeInfo = SIZES[imgObj.size];
  const hasCrop = imgObj.cropX !== 0 || imgObj.cropY !== 0 || imgObj.cropScale !== 1.0;
  previewStats.innerHTML = `
    <strong>${sizeInfo.name}</strong><br>
    ${sizeInfo.w}×${sizeInfo.h} mm<br>
    Copies: ${imgObj.copies}
    ${hasCrop ? '<br><span style="color:var(--orange)">✂️ Cropped</span>' : ''}
  `;
}

function clearImagePreview() {
  const placeholder = document.getElementById('previewPlaceholder');
  const previewImage = document.getElementById('previewImage');
  const previewCanvas = document.getElementById('previewCanvas');
  const previewStats = document.getElementById('previewStats');
  
  if (placeholder) placeholder.style.display = 'block';
  previewImage.style.display = 'none';
  previewCanvas.style.display = 'none';
  previewStats.innerHTML = 'No image selected';
}

/* ═══════════════════════════════════════════
   BACKGROUND REMOVAL
═══════════════════════════════════════════ */
function removeBackground() {
  if (toolState.images.length === 0) {
    showToast('Add images first', 'error');
    return;
  }

  if (!removeBgApiKey) {
    showToast('Please set up your remove.bg API key', 'error');
    document.getElementById('apiKeyModal').classList.add('open');
    return;
  }

  const btn = document.getElementById('removeBgBtn');
  btn.textContent = '⏳ Processing...';
  btn.disabled = true;

  let processed = 0;
  toolState.images.forEach((imgObj) => {
    processImageWithRemoveBg(imgObj, () => {
      processed++;
      if (processed === toolState.images.length) {
        generatePreview();
        showToast('All backgrounds removed!', 'success');
        btn.textContent = '✂️ Remove Background';
        btn.disabled = false;
      }
    });
  });
}

function processImageWithRemoveBg(imgObj, callback) {
  try {
    const src = imgObj.img;
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = src.naturalWidth;
    tmpCanvas.height = src.naturalHeight;
    const ctx = tmpCanvas.getContext('2d');

    const b = toolState.brightness / 100;
    ctx.filter = `brightness(${b}) contrast(${toolState.contrast / 100})`;
    ctx.save();
    if (toolState.rotation !== 0) {
      ctx.translate(tmpCanvas.width / 2, tmpCanvas.height / 2);
      ctx.rotate(toolState.rotation * Math.PI / 180);
      ctx.translate(-tmpCanvas.width / 2, -tmpCanvas.height / 2);
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
        if (!res.ok) throw new Error('API Error');
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

            rCtx.fillStyle = toolState.currentBgColor;
            rCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
            rCtx.drawImage(resultImg, 0, 0);

            imgObj.processed = resultCanvas;
            callback();
          };
          resultImg.src = e.target.result;
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => {
        console.error(err);
        callback();
      });
  } catch (e) {
    console.error(e);
    callback();
  }
}

function restoreBackground() {
  toolState.images.forEach(img => img.processed = null);
  generatePreview();
  showToast('Backgrounds restored', '');
}

/* ═══════════════════════════════════════════
   BACKGROUND COLOR
═══════════════════════════════════════════ */
function setBgColor(color, el) {
  toolState.currentBgColor = color;
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  generatePreview();
}

function setBgColorCustom(color) {
  toolState.currentBgColor = color;
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  generatePreview();
}

/* ═══════════════════════════════════════════
   IMAGE EDITS (Per-Image)
═══════════════════════════════════════════ */
function applyEdits() {
  if (!toolState.selectedImageId) return;
  
  const img = toolState.images.find(i => i.id === toolState.selectedImageId);
  if (!img) return;
  
  const b = document.getElementById('slBright').value;
  const c = document.getElementById('slContrast').value;
  const r = document.getElementById('slRotation').value;
  
  img.brightness = parseInt(b);
  img.contrast = parseInt(c);
  img.rotation = parseInt(r);
  
  document.getElementById('valBright').textContent = b + '%';
  document.getElementById('valContrast').textContent = c + '%';
  document.getElementById('valRotation').textContent = r + '°';
  
  generatePreview();
  
  // Show temp preview
  showTempPreview(img);
}

function resetEdits() {
  if (!toolState.selectedImageId) return;
  
  const img = toolState.images.find(i => i.id === toolState.selectedImageId);
  if (!img) return;
  
  img.brightness = 100;
  img.contrast = 100;
  img.rotation = 0;
  
  document.getElementById('slBright').value = 100;
  document.getElementById('slContrast').value = 100;
  document.getElementById('slRotation').value = 0;
  
  applyEdits();
}

function adjustSlider(id, delta) {
  const slider = document.getElementById(id);
  let newVal = parseInt(slider.value) + delta;
  newVal = Math.max(slider.min, Math.min(slider.max, newVal));
  slider.value = newVal;
  applyEdits();
}

function showTempPreview(imgObj) {
  // Clear previous timeout
  if (tempPreviewTimeout) clearTimeout(tempPreviewTimeout);
  
  // Generate preview with current edits
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = imgObj.img.naturalWidth;
  tmpCanvas.height = imgObj.img.naturalHeight;
  const ctx = tmpCanvas.getContext('2d');

  // Apply edits
  const b = imgObj.brightness / 100;
  const c = imgObj.contrast / 100;
  ctx.filter = `brightness(${b}) contrast(${c})`;
  ctx.save();
  if (imgObj.rotation !== 0) {
    ctx.translate(tmpCanvas.width / 2, tmpCanvas.height / 2);
    ctx.rotate(imgObj.rotation * Math.PI / 180);
    ctx.translate(-tmpCanvas.width / 2, -tmpCanvas.height / 2);
  }
  ctx.drawImage(imgObj.img, 0, 0);
  ctx.restore();

  // Show the temp preview
  const tempDiv = document.getElementById('tempEditPreview');
  const tempImg = document.getElementById('tempPreviewImg');
  const tempStats = document.getElementById('tempPreviewStats');
  tempImg.src = tmpCanvas.toDataURL();
  const sizeInfo = SIZES[imgObj.size];
  const hasCrop = imgObj.cropX !== 0 || imgObj.cropY !== 0 || imgObj.cropScale !== 1.0;
  tempStats.innerHTML = `${sizeInfo.name} • ${imgObj.copies}× ${hasCrop ? '✂️' : ''}`;
  tempDiv.style.display = 'flex';

  // Hide after 1 second
  tempPreviewTimeout = setTimeout(() => {
    tempDiv.style.display = 'none';
    tempPreviewTimeout = null;
  }, 1000);
}

/* ═══════════════════════════════════════════
   A4 PREVIEW GENERATION
═══════════════════════════════════════════ */
function generatePreview() {
  if (toolState.images.length === 0) {
    document.getElementById('a4Canvas').style.display = 'none';
    document.getElementById('a4Placeholder').style.display = 'flex';
    document.getElementById('previewInfo').textContent = '📌 Add photos to see preview';
    return;
  }

  const DPI = 96;
  const MM2PX = DPI / 25.4;

  const a4W = Math.round(A4.w * MM2PX);
  const a4H = Math.round(A4.h * MM2PX);
  const margin = Math.round(5 * MM2PX);
  const gap = Math.round(2 * MM2PX);

  // Display preview
  const displayW = 480, displayH = 679;
  const scale = Math.min(displayW / a4W, displayH / a4H);
  const canvas = document.getElementById('a4Canvas');
  canvas.width = Math.round(a4W * scale);
  canvas.height = Math.round(a4H * scale);

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Calculate layout with per-image sizes
  let totalUsed = 0;
  let positions = [];
  let currentY = margin;
  let currentX = margin;
  let rowHeight = 0;
  let maxInRow = 0;

  for (let imgIdx = 0; imgIdx < toolState.images.length; imgIdx++) {
    const imgObj = toolState.images[imgIdx];
    const size = SIZES[imgObj.size];
    const photoW = Math.round(size.w * MM2PX);
    const photoH = Math.round(size.h * MM2PX);

    // Try to fit copies of this image
    for (let copy = 0; copy < imgObj.copies; copy++) {
      if (currentX + photoW + margin > a4W) {
        // Move to next row
        currentX = margin;
        currentY += rowHeight + gap;
        rowHeight = 0;
      }

      if (currentY + photoH + margin > a4H) {
        // Out of space on A4
        break;
      }

      positions.push({
        imgIdx,
        x: currentX,
        y: currentY,
        w: photoW,
        h: photoH,
      });

      currentX += photoW + gap;
      rowHeight = Math.max(rowHeight, photoH);
      totalUsed++;

      if (currentX > maxInRow) maxInRow = currentX;
    }
  }

  // Draw grid reference
  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  ctx.lineWidth = 1;
  const m = margin * scale;
  const g = gap * scale;

  positions.forEach(pos => {
    const sx = pos.x * scale;
    const sy = pos.y * scale;
    const sw = pos.w * scale;
    const sh = pos.h * scale;
    ctx.strokeRect(sx, sy, sw, sh);
  });

  // Draw images
  positions.forEach(pos => {
    const imgObj = toolState.images[pos.imgIdx];
    const srcCanvas = getImageCanvas(imgObj);
    const sx = pos.x * scale;
    const sy = pos.y * scale;
    const sw = pos.w * scale;
    const sh = pos.h * scale;
    ctx.drawImage(srcCanvas, sx, sy, sw, sh);
  });

  document.getElementById('a4Placeholder').style.display = 'none';
  canvas.style.display = 'block';

  const cap = calculateTotalCapacity();
  if (totalUsed < cap.used) {
    document.getElementById('previewInfo').innerHTML = `
      ⚠️ <strong>Warning!</strong> A4 full at ${totalUsed} photos | 
      Total configured: ${cap.used} |
      ✂️ Reduce copies to fit all
    `;
  } else {
    document.getElementById('previewInfo').innerHTML = `
      ✅ <strong>${totalUsed} photos</strong> arranged on A4 | 
      All images will fit perfectly!
    `;
  }
}

function getImageCanvas(imgObj) {
  const img = imgObj.img;
  const tmp = document.createElement('canvas');
  tmp.width = img.naturalWidth;
  tmp.height = img.naturalHeight;
  const ctx = tmp.getContext('2d');

  ctx.fillStyle = toolState.currentBgColor;
  ctx.fillRect(0, 0, tmp.width, tmp.height);
  ctx.filter = `brightness(${imgObj.brightness / 100}) contrast(${imgObj.contrast / 100})`;
  ctx.save();
  
  // Apply rotation first
  if (imgObj.rotation !== 0) {
    ctx.translate(tmp.width / 2, tmp.height / 2);
    ctx.rotate(imgObj.rotation * Math.PI / 180);
    ctx.translate(-tmp.width / 2, -tmp.height / 2);
  }
  
  // Apply crop if it exists
  if (imgObj.cropScale && imgObj.cropScale !== 1.0) {
    // cropScale is zoom level (0.5-3.0)
    // cropOffsetX/Y are pixel offsets in the crop canvas
    // We need to convert visual crop coordinates back to source image coordinates
    
    const cropScale = imgObj.cropScale;
    const zoomWidth = img.naturalWidth * cropScale;
    const zoomHeight = img.naturalHeight * cropScale;
    
    // The visible area in the crop canvas is roughly centered
    // The offset tells us where the zoomed image is positioned
    // Convert offset from canvas coordinates to source image coordinates
    const srcCropX = -imgObj.cropX / cropScale;
    const srcCropY = -imgObj.cropY / cropScale;
    const srcCropW = tmp.width / cropScale;
    const srcCropH = tmp.height / cropScale;
    
    // Clamp to image bounds
    const clampX = Math.max(0, Math.min(srcCropX, img.naturalWidth - srcCropW));
    const clampY = Math.max(0, Math.min(srcCropY, img.naturalHeight - srcCropH));
    const clampW = Math.min(srcCropW, img.naturalWidth - clampX);
    const clampH = Math.min(srcCropH, img.naturalHeight - clampY);
    
    ctx.drawImage(img, clampX, clampY, clampW, clampH, 0, 0, tmp.width, tmp.height);
  } else {
    ctx.drawImage(img, 0, 0);
  }
  
  ctx.restore();

  return tmp;
}

/* ═══════════════════════════════════════════
   PRINT
═══════════════════════════════════════════ */
function doPrint() {
  if (toolState.images.length === 0) {
    showToast('Add images first', 'error');
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

  // Layout images on A4
  let currentX = margin;
  let currentY = margin;
  let rowHeight = 0;
  let totalCount = 0;

  for (let imgIdx = 0; imgIdx < toolState.images.length; imgIdx++) {
    const imgObj = toolState.images[imgIdx];
    const size = SIZES[imgObj.size];
    const photoW = Math.round(size.w * MM2PX);
    const photoH = Math.round(size.h * MM2PX);

    // Draw copies of this image
    for (let copy = 0; copy < imgObj.copies; copy++) {
      if (currentX + photoW + margin > a4W) {
        // Move to next row
        currentX = margin;
        currentY += rowHeight + gap;
        rowHeight = 0;
      }

      if (currentY + photoH + margin > a4H) {
        // Out of space on A4
        break;
      }

      const srcCanvas = getImageCanvas(imgObj);
      ctx.drawImage(srcCanvas, currentX, currentY, photoW, photoH);
      totalCount++;

      currentX += photoW + gap;
      rowHeight = Math.max(rowHeight, photoH);
    }
  }

  const dataURL = printCanvas.toDataURL('image/jpeg', 0.95);
  const printWin = window.open('', '_blank', 'width=800,height=900');
  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print - Photos</title>
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

/* ═══════════════════════════════════════════
   CROP TOOL
═══════════════════════════════════════════ */
let cropImg = null;
let cropCanvas, cropCtx;

function openCropModal() {
  if (toolState.images.length === 0) {
    showToast('Add images first', 'error');
    return;
  }

  // Start with currently selected image or first image
  const selectedImg = toolState.images.find(i => i.id === toolState.selectedImageId);
  const startIndex = selectedImg ? toolState.images.indexOf(selectedImg) : 0;
  toolState.cropCurrentImageIndex = startIndex;

  document.getElementById('cropModal').classList.add('open');

  cropCanvas = document.getElementById('cropCanvas');
  cropCtx = cropCanvas.getContext('2d');
  const container = document.getElementById('cropContainer');
  cropCanvas.width = container.clientWidth;
  cropCanvas.height = container.clientHeight;

  loadCropImage(toolState.cropCurrentImageIndex);
  setupCropDrag();
  updateCropNavigation();
}

function loadCropImage(idx) {
  if (idx < 0 || idx >= toolState.images.length) return;
  
  toolState.cropCurrentImageIndex = idx;
  const imgObj = toolState.images[idx];
  cropImg = imgObj.img;
  
  // Load existing crop settings for this image
  toolState.cropOffsetX = imgObj.cropX || 0;
  toolState.cropOffsetY = imgObj.cropY || 0;
  toolState.cropScale = imgObj.cropScale || 1.0;
  
  document.getElementById('cropZoom').value = Math.round(toolState.cropScale * 100);
  document.getElementById('cropZoomVal').textContent = Math.round(toolState.cropScale * 100) + '%';
  
  drawCrop();
  updateCropNavigation();
}

function updateCropNavigation() {
  const totalImages = toolState.images.length;
  const currentIdx = toolState.cropCurrentImageIndex + 1;
  const navInfo = document.getElementById('cropNavInfo');
  if (navInfo) {
    navInfo.textContent = `Image ${currentIdx} of ${totalImages}`;
  }
  
  const nextBtn = document.getElementById('cropNextBtn');
  const prevBtn = document.getElementById('cropPrevBtn');
  if (prevBtn) prevBtn.disabled = toolState.cropCurrentImageIndex === 0;
  if (nextBtn) nextBtn.disabled = toolState.cropCurrentImageIndex === totalImages - 1;
}

function nextCropImage() {
  saveCropForCurrentImage();
  loadCropImage(toolState.cropCurrentImageIndex + 1);
}

function prevCropImage() {
  saveCropForCurrentImage();
  loadCropImage(toolState.cropCurrentImageIndex - 1);
}

function saveCropForCurrentImage() {
  if (toolState.cropCurrentImageIndex !== null && toolState.images[toolState.cropCurrentImageIndex]) {
    const imgObj = toolState.images[toolState.cropCurrentImageIndex];
    imgObj.cropX = toolState.cropOffsetX;
    imgObj.cropY = toolState.cropOffsetY;
    imgObj.cropScale = toolState.cropScale;
  }
}

function drawCrop() {
  if (!cropCtx || !cropImg) return;
  const W = cropCanvas.width, H = cropCanvas.height;
  cropCtx.clearRect(0, 0, W, H);
  cropCtx.fillStyle = '#1a1a2e';
  cropCtx.fillRect(0, 0, W, H);

  // Get current image's size
  const currentImg = toolState.images[toolState.cropCurrentImageIndex];
  const size = SIZES[currentImg.size];
  const aspect = size.w / size.h;
  const drawH = H * toolState.cropScale;
  const drawW = drawH * (cropImg.naturalWidth || cropImg.width) / (cropImg.naturalHeight || cropImg.height);

  const x = (W - drawW) / 2 + toolState.cropOffsetX;
  const y = (H - drawH) / 2 + toolState.cropOffsetY;

  cropCtx.drawImage(cropImg, x, y, drawW, drawH);

  const cropW = Math.min(W * 0.7, H * 0.7 * aspect);
  const cropH = cropW / aspect;
  const cx = (W - cropW) / 2, cy = (H - cropH) / 2;

  // Dark overlay outside frame
  cropCtx.fillStyle = 'rgba(0,0,0,0.6)';
  cropCtx.fillRect(0, 0, W, cy);
  cropCtx.fillRect(0, cy + cropH, W, H - cy - cropH);
  cropCtx.fillRect(0, cy, cx, cropH);
  cropCtx.fillRect(cx + cropW, cy, W - cx - cropW, cropH);

  // Blue frame
  cropCtx.strokeStyle = '#2B73FF';
  cropCtx.lineWidth = 3;
  cropCtx.strokeRect(cx, cy, cropW, cropH);

  // Grid lines
  cropCtx.strokeStyle = 'rgba(43,115,255,0.5)';
  cropCtx.lineWidth = 1;
  cropCtx.beginPath();
  cropCtx.moveTo(cx + cropW / 3, cy);
  cropCtx.lineTo(cx + cropW / 3, cy + cropH);
  cropCtx.moveTo(cx + cropW * 2 / 3, cy);
  cropCtx.lineTo(cx + cropW * 2 / 3, cy + cropH);
  cropCtx.moveTo(cx, cy + cropH / 3);
  cropCtx.lineTo(cx + cropW, cy + cropH / 3);
  cropCtx.moveTo(cx, cy + cropH * 2 / 3);
  cropCtx.lineTo(cx + cropW, cy + cropH * 2 / 3);
  cropCtx.stroke();
}

function updateCropZoom(val) {
  toolState.cropScale = val / 100;
  document.getElementById('cropZoomVal').textContent = val + '%';
  drawCrop();
}

function applyCrop() {
  saveCropForCurrentImage();
  generatePreview();
  showTempPreview(toolState.images[toolState.cropCurrentImageIndex]);
  closeCropModal();
  showToast('Crop applied!', 'success');
}

function closeCropModal() {
  document.getElementById('cropModal').classList.remove('open');
  toolState.cropCurrentImageIndex = null;
}

function setupCropDrag() {
  if (cropCanvas._cropBound) return;
  cropCanvas._cropBound = true;

  cropCanvas.addEventListener('mousedown', e => {
    toolState.cropDragging = true;
    toolState.cropStartX = e.clientX - toolState.cropOffsetX;
    toolState.cropStartY = e.clientY - toolState.cropOffsetY;
  });
  
  cropCanvas.addEventListener('mousemove', e => {
    if (!toolState.cropDragging) return;
    toolState.cropOffsetX = e.clientX - toolState.cropStartX;
    toolState.cropOffsetY = e.clientY - toolState.cropStartY;
    drawCrop();
  });
  
  cropCanvas.addEventListener('mouseup', () => (toolState.cropDragging = false));
  cropCanvas.addEventListener('mouseleave', () => (toolState.cropDragging = false));
  
  // Scroll/wheel zoom
  cropCanvas.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newScale = Math.max(0.5, Math.min(3.0, toolState.cropScale + delta));
    document.getElementById('cropZoom').value = Math.round(newScale * 100);
    updateCropZoom(Math.round(newScale * 100));
  }, { passive: false });
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
}

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  updateCapacity();
  setActiveNav('tool');

  // Handle global size selector - applies to currently selected image
  const sizeSelect = document.getElementById('sizeSelect');
  if (sizeSelect) {
    sizeSelect.addEventListener('change', (e) => {
      if (toolState.selectedImageId) {
        const img = toolState.images.find(i => i.id === toolState.selectedImageId);
        if (img) {
          img.size = e.target.value;
          updateCapacityDisplay();
          generatePreview();
          renderImagesList();
          showToast(`Size changed to ${SIZES[img.size].name}`, 'success');
        }
      } else {
        showToast('Please select an image first', 'error');
        sizeSelect.value = 'passport';
      }
    });
  }

  document.getElementById('cropModal').addEventListener('click', function (e) {
    if (e.target === this) closeCropModal();
  });

  document.getElementById('apiKeyModal').addEventListener('click', function (e) {
    if (e.target === this) skipApiKeySetup();
  });

  checkPremium();
});
