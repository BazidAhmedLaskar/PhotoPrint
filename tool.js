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
  borderThickness: 0,
  borderColor: '#000000',
  cropOffsetX: 0,
  cropOffsetY: 0,
  cropScale: 1,
  cropDragging: false,
  cropStartX: 0,
  cropStartY: 0,
  cropCurrentImageIndex: null, // Track which image is being cropped
};

let removeBgApiKey = localStorage.getItem('ppp_removebg_key') || 'gA5srFMY2fHjL2D7xkVSint2';
let autoAdjustAspect = false;

/* ═══════════════════════════════════════════
   MULTIPLE API KEY MANAGEMENT
═══════════════════════════════════════════ */
let apiKeysList = []; // Array of {id, key, nickname, createdAt}
let activeKeyId = null; // ID of currently active key

function loadApiKeysList() {
  try {
    const saved = localStorage.getItem('ppp_api_keys_list');
    const activeId = localStorage.getItem('ppp_active_key_id');
    
    if (saved) {
      apiKeysList = JSON.parse(saved);
    } else {
      // Initialize with default key if no keys exist
      apiKeysList = [];
    }
    
    activeKeyId = activeId || null;
  } catch (e) {
    console.error('Error loading API keys:', e);
    apiKeysList = [];
  }
}

function saveApiKeysList() {
  try {
    localStorage.setItem('ppp_api_keys_list', JSON.stringify(apiKeysList));
    localStorage.setItem('ppp_active_key_id', activeKeyId || '');
  } catch (e) {
    console.error('Error saving API keys:', e);
  }
}

function addApiKey(key, nickname = '') {
  if (!key || key.trim().length < 20) {
    return { success: false, error: 'API key must be at least 20 characters' };
  }

  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const keyObj = {
    id,
    key: key.trim(),
    nickname: nickname.trim() || `API Key ${apiKeysList.length + 1}`,
    createdAt: new Date().toISOString()
  };

  apiKeysList.push(keyObj);
  
  // Set as active if it's the first key
  if (!activeKeyId) {
    activeKeyId = id;
    removeBgApiKey = keyObj.key;
  }
  
  saveApiKeysList();
  renderApiKeysList();
  return { success: true, id };
}

function removeApiKey(id) {
  const index = apiKeysList.findIndex(k => k.id === id);
  if (index === -1) return false;

  apiKeysList.splice(index, 1);
  
  // If removed key was active, set the first key as active
  if (activeKeyId === id) {
    if (apiKeysList.length > 0) {
      activeKeyId = apiKeysList[0].id;
      removeBgApiKey = apiKeysList[0].key;
    } else {
      activeKeyId = null;
      removeBgApiKey = 'gA5srFMY2fHjL2D7xkVSint2'; // Reset to default
    }
  }
  
  saveApiKeysList();
  renderApiKeysList();
  return true;
}

function setActiveKey(id) {
  const keyObj = apiKeysList.find(k => k.id === id);
  if (!keyObj) return false;

  activeKeyId = id;
  removeBgApiKey = keyObj.key;
  saveApiKeysList();
  renderApiKeysList();
  showToast(`✓ Switched to: ${keyObj.nickname}`, 'success');
  return true;
}

function editApiKeyNickname(id, newNickname) {
  const keyObj = apiKeysList.find(k => k.id === id);
  if (!keyObj) return false;

  keyObj.nickname = newNickname.trim() || keyObj.nickname;
  saveApiKeysList();
  renderApiKeysList();
  return true;
}

function renderApiKeysList() {
  const container = document.getElementById('savedKeysList');
  if (!container) return;

  if (apiKeysList.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:.75rem;padding:20px">No keys saved yet</div>';
    return;
  }

  let html = '';
  apiKeysList.forEach(keyObj => {
    const isActive = activeKeyId === keyObj.id;
    const keyPreview = keyObj.key.substring(0, 8) + '...' + keyObj.key.substring(keyObj.key.length - 4);
    const createdDate = new Date(keyObj.createdAt).toLocaleDateString();
    
    html += `
      <div style="background:${isActive ? 'rgba(76,175,80,.15)' : 'rgba(255,255,255,.1)'};border:1px solid ${isActive ? 'rgba(76,175,80,.3)' : 'rgba(0,0,0,.1)'};border-radius:6px;padding:8px;margin-bottom:6px;font-size:.75rem">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="flex:1">
            <div style="font-weight:600;color:${isActive ? '#4CAF50' : 'var(--text)'}">${isActive ? '✓ ' : ''}${keyObj.nickname}</div>
            <div style="color:var(--muted);font-size:.7rem;margin-top:2px">${keyPreview} · Added ${createdDate}</div>
          </div>
          <div style="display:flex;gap:4px">
            ${!isActive ? `<button style="padding:4px 8px;background:var(--blue);color:white;border:none;border-radius:4px;cursor:pointer;font-size:.7rem" onclick="setActiveKey('${keyObj.id}')">Use</button>` : '<span style="padding:4px 8px;background:var(--green);color:white;border-radius:4px;font-size:.7rem">Active</span>'}
            <button style="padding:4px 8px;background:var(--orange);color:white;border:none;border-radius:4px;cursor:pointer;font-size:.7rem" onclick="openEditKeyDialog('${keyObj.id}', '${keyObj.nickname}')">Edit</button>
            <button style="padding:4px 8px;background:#c00;color:white;border:none;border-radius:4px;cursor:pointer;font-size:.7rem" onclick="if(confirm('Delete this key?')) { removeApiKey('${keyObj.id}'); }">Delete</button>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function openAddKeyDialog() {
  document.getElementById('addKeyModal').classList.add('open');
  document.getElementById('addKeyTitle').textContent = 'Add New API Key';
  document.getElementById('keyNickname').value = '';
  document.getElementById('newKeyInput').value = '';
  document.getElementById('newKeyInput').type = 'password';
  document.getElementById('showNewKey').checked = false;
  document.getElementById('newKeyTestStatus').style.display = 'none';
  document.getElementById('addKeyErrorMsg').style.display = 'none';
  document.getElementById('newKeyInput').focus();
}

function openEditKeyDialog(id, nickname) {
  // For now, we'll only allow editing nickname
  // Show a simple dialog
  const newNickname = prompt('Edit key nickname:', nickname);
  if (newNickname !== null) {
    editApiKeyNickname(id, newNickname);
    showToast('✓ Key nickname updated', 'success');
  }
}

function closeAddKeyModal() {
  document.getElementById('addKeyModal').classList.remove('open');
}

function toggleNewKeyVisibility() {
  const input = document.getElementById('newKeyInput');
  const checkbox = document.getElementById('showNewKey');
  input.type = checkbox.checked ? 'text' : 'password';
}

function saveNewApiKey() {
  const nickname = document.getElementById('keyNickname').value.trim();
  const key = document.getElementById('newKeyInput').value.trim();
  const errorMsg = document.getElementById('addKeyErrorMsg');
  const errorText = document.getElementById('addKeyErrorText');

  // Validation
  if (!key) {
    errorText.textContent = 'Please enter an API key';
    errorMsg.style.display = 'block';
    return;
  }

  if (key.length < 20) {
    errorText.textContent = 'API key appears invalid (too short). Check your remove.bg API key format';
    errorMsg.style.display = 'block';
    return;
  }

  if (!/^[a-zA-Z0-9]+$/.test(key)) {
    errorText.textContent = 'API key contains invalid characters';
    errorMsg.style.display = 'block';
    return;
  }

  // Check for duplicates
  if (apiKeysList.some(k => k.key === key)) {
    errorText.textContent = 'This API key is already saved';
    errorMsg.style.display = 'block';
    return;
  }

  // Add the key
  const result = addApiKey(key, nickname);
  if (result.success) {
    errorMsg.style.display = 'none';
    closeAddKeyModal();
    showToast('✓ API Key saved successfully!', 'success');
  } else {
    errorText.textContent = result.error;
    errorMsg.style.display = 'block';
  }
}

async function testNewApiKey() {
  const key = document.getElementById('newKeyInput').value.trim();
  
  if (!key) {
    showToast('❌ Please enter an API key first', 'error');
    return;
  }

  if (key.length < 20) {
    showToast('❌ API key too short', 'error');
    return;
  }

  const statusDiv = document.getElementById('newKeyTestStatus');
  const statusText = document.getElementById('newKeyTestStatusText');
  statusDiv.style.display = 'block';
  statusText.textContent = '🧪 Testing API key...';

  try {
    // Create a small test image
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(50, 50, 100, 100);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) reject(new Error('Failed to create image blob'));
        else resolve(blob);
      }, 'image/jpeg', 0.95);
    });

    const formData = new FormData();
    formData.append('image_file', blob, 'test.jpg');
    formData.append('type', 'auto');
    formData.append('format', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-API-Key': key },
      body: formData
    });

    if (response.status === 401) {
      statusDiv.style.background = 'rgba(244, 67, 54, 0.15)';
      statusDiv.style.borderColor = 'rgba(244, 67, 54, 0.3)';
      statusDiv.style.color = '#F44336';
      statusText.textContent = '❌ Invalid API key';
      return;
    }

    if (!response.ok) {
      statusDiv.style.background = 'rgba(244, 67, 54, 0.15)';
      statusDiv.style.borderColor = 'rgba(244, 67, 54, 0.3)';
      statusDiv.style.color = '#F44336';
      statusText.textContent = `❌ API Error (${response.status})`;
      return;
    }

    statusDiv.style.background = 'rgba(76, 175, 80, 0.15)';
    statusDiv.style.borderColor = 'rgba(76, 175, 80, 0.3)';
    statusDiv.style.color = '#4CAF50';
    statusText.textContent = '✓ API key is valid!';
  } catch (error) {
    statusDiv.style.background = 'rgba(244, 67, 54, 0.15)';
    statusDiv.style.borderColor = 'rgba(244, 67, 54, 0.3)';
    statusDiv.style.color = '#F44336';
    statusText.textContent = '❌ Connection error - check internet';
  }
}

/* ═════════════════════════════════════════════════════════════════
   BORDER DRAWING HELPER
═════════════════════════════════════════════════════════════════ */
function drawBorder(ctx, x, y, w, h, thickness, color) {
  // Draw crisp, perfect border using fillRect instead of strokeRect
  // This avoids anti-aliasing issues with strokeRect
  ctx.fillStyle = color;
  // Top border
  ctx.fillRect(x, y, w, thickness);
  // Bottom border
  ctx.fillRect(x, y + h - thickness, w, thickness);
  // Left border
  ctx.fillRect(x, y + thickness, thickness, h - 2 * thickness);
  // Right border
  ctx.fillRect(x + w - thickness, y + thickness, thickness, h - 2 * thickness);
}

function drawBorderScaled(ctx, x, y, w, h, thickness, color, scale = 1) {
  // Draw crisp border with scale support (for preview canvas)
  const scaledThickness = thickness * scale;
  const scaledX = x * scale;
  const scaledY = y * scale;
  const scaledW = w * scale;
  const scaledH = h * scale;
  ctx.fillStyle = color;
  // Top border
  ctx.fillRect(scaledX, scaledY, scaledW, scaledThickness);
  // Bottom border
  ctx.fillRect(scaledX, scaledY + scaledH - scaledThickness, scaledW, scaledThickness);
  // Left border
  ctx.fillRect(scaledX, scaledY + scaledThickness, scaledThickness, scaledH - 2 * scaledThickness);
  // Right border
  ctx.fillRect(scaledX + scaledW - scaledThickness, scaledY + scaledThickness, scaledThickness, scaledH - 2 * scaledThickness);
}

/* ═══════════════════════════════════════════
   CAPACITY CALCULATION
═══════════════════════════════════════════ */
function calculateTotalCapacity() {
  let totalUsed = 0;
  toolState.images.forEach(img => {
    totalUsed += img.copies;
  });

  const maxCapacity = 40; // Max photos on A4
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
  if (!files || files.length === 0) return;

  let filesProcessed = 0;
  const totalFiles = files.length;

  Array.from(files).forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => {
        console.warn('Failed to load image:', file.name);
        filesProcessed++;
        if (filesProcessed === totalFiles) {
          renderImagesList();
          updateCapacityDisplay();
          generatePreview();
          showToast(`Added ${totalFiles} image${totalFiles > 1 ? 's' : ''}`, 'success');
        }
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
          customWidth: 413,
          customHeight: 531,
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
    reader.onerror = () => {
      console.error('FileReader error for file:', idx);
      filesProcessed++;
      if (filesProcessed === totalFiles) {
        renderImagesList();
        updateCapacityDisplay();
        generatePreview();
        showToast('Error loading some images', 'error');
      }
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

  const borderThickness = toolState.borderThickness || 0;
  const borderColor = toolState.borderColor || '#000000';

  toolState.images.forEach((imgObj, idx) => {
    const item = document.createElement('div');
    item.className = 'image-slot';
    
    if (borderThickness > 0) {
      item.style.border = borderThickness + 'px solid ' + borderColor;
    } else {
      item.style.border = '2px dashed var(--border)';
    }
    item.style.cursor = 'pointer';
    item.style.position = 'relative';
    item.style.aspectRatio = '1';
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.justifyContent = 'center';
    item.style.borderRadius = 'var(--r)';
    item.style.background = 'var(--surface)';
    item.onclick = () => selectImage(imgObj.id);
    
    const sizeCapacity = calculateSizeCapacity(imgObj.size);
    const isOverCapacity = imgObj.copies > sizeCapacity;
    
    item.innerHTML = `
      <img src="${imgObj.src}" alt="Photo ${idx + 1}" style="width:100%;height:100%;object-fit:cover;border-radius:calc(var(--r) - 2px)">
      <div style="position:absolute;top:-8px;right:-8px;width:24px;height:24px;background:var(--orange);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:.8rem;cursor:pointer;opacity:0.7;transition:.2s;z-index:10" onclick="event.stopPropagation(); removeImage('${imgObj.id}')">✕</div>
      <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.5);color:white;font-size:.7rem;padding:4px;text-align:center;border-radius:0 0 calc(var(--r) - 2px) calc(var(--r) - 2px)">${imgObj.copies}× ${SIZES[imgObj.size].name}</div>
    `;
    
    list.appendChild(item);
  });
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
    
    // Show and update selected image controls
    const controlsDiv = document.getElementById('selectedImageControls');
    controlsDiv.style.display = 'block';
    
    // Update size selector
    const sizeSelect = document.getElementById('imgSizeSelect');
    const customInputs = document.getElementById('imgCustomSizeInputs');
    
    // Check if this is a custom size
    if (img.size.startsWith('custom_')) {
      sizeSelect.value = 'custom';
      customInputs.style.display = 'block';
      document.getElementById('imgCustomWidth').value = img.customWidth || 413;
      document.getElementById('imgCustomHeight').value = img.customHeight || 531;
      // Reset checkbox to unchecked when selecting (user can check if needed)
      document.getElementById('imgAutoAdjustAspect').checked = false;
    } else {
      sizeSelect.value = img.size;
      customInputs.style.display = 'none';
    }
    
    // Update copies input
    const copiesInput = document.getElementById('imgCopiesInput');
    copiesInput.value = img.copies;
    
    // Update capacity info
    const sizeCapacity = calculateSizeCapacity(img.size);
    const status = img.copies > sizeCapacity ? '⚠️ Over capacity' : `Max: ${sizeCapacity}`;
    document.getElementById('imgCapacityInfo').textContent = status;
    
    // Show image preview
    showImagePreview(img);
    renderImagesList();
  }
}

function updateImageSize(id, size) {
  const img = toolState.images.find(i => i.id === id);
  if (img) {
    // Show/hide custom size inputs
    const customInputs = document.getElementById('imgCustomSizeInputs');
    if (size === 'custom') {
      customInputs.style.display = 'block';
      document.getElementById('imgCustomWidth').value = img.customWidth || 413;
      document.getElementById('imgCustomHeight').value = img.customHeight || 531;
      const customSizeKey = `custom_${img.id}`;
      img.size = customSizeKey;
      if (!SIZES[customSizeKey]) {
        SIZES[customSizeKey] = {
          name: `Custom (${img.customWidth || 413}×${img.customHeight || 531} px)`,
          w: Math.round((img.customWidth || 413) * 25.4 / 300),
          h: Math.round((img.customHeight || 531) * 25.4 / 300),
        };
      }
    } else {
      customInputs.style.display = 'none';
      img.size = size;
    }
    
    // Update capacity info
    const sizeCapacity = calculateSizeCapacity(img.size);
    const status = img.copies > sizeCapacity ? '⚠️ Over capacity' : `Max: ${sizeCapacity}`;
    document.getElementById('imgCapacityInfo').textContent = status;
    
    updateCapacityDisplay();
    generatePreview();
    renderImagesList();
  }
}

function updateImageCustomSize() {
  const img = toolState.images.find(i => i.id === toolState.selectedImageId);
  if (img && img.size.startsWith('custom_')) {
    const widthPx = parseInt(document.getElementById('imgCustomWidth').value);
    const heightPx = parseInt(document.getElementById('imgCustomHeight').value);
    
    // Handle auto-adjust aspect ratio
    const autoAdjust = document.getElementById('imgAutoAdjustAspect').checked;
    if (autoAdjust && img.img) {
      const aspectRatio = img.img.naturalWidth / img.img.naturalHeight;
      const newHeight = Math.round(widthPx / aspectRatio);
      document.getElementById('imgCustomHeight').value = newHeight;
      img.customHeight = newHeight;
    } else {
      img.customHeight = heightPx;
    }
    
    img.customWidth = widthPx;
    
    // Update the image's custom size in SIZES for this specific image
    const customSizeKey = `custom_${img.id}`;
    SIZES[customSizeKey] = {
      name: `Custom (${widthPx}×${img.customHeight} px)`,
      w: Math.round(widthPx * 25.4 / 300), // Convert px to mm at 300 DPI
      h: Math.round(img.customHeight * 25.4 / 300),
    };
    img.size = customSizeKey;
    
    // Update capacity info
    const sizeCapacity = calculateSizeCapacity(customSizeKey);
    const status = img.copies > sizeCapacity ? '⚠️ Over capacity' : `Max: ${sizeCapacity}`;
    document.getElementById('imgCapacityInfo').textContent = status;
    
    updateCapacityDisplay();
    generatePreview();
    renderImagesList();
  }
}

function toggleImageAutoAdjust() {
  const autoAdjust = document.getElementById('imgAutoAdjustAspect').checked;
  const img = toolState.images.find(i => i.id === toolState.selectedImageId);
  if (autoAdjust && img && img.img) {
    const aspectRatio = img.img.naturalWidth / img.img.naturalHeight;
    const currentWidth = parseInt(document.getElementById('imgCustomWidth').value);
    const newHeight = Math.round(currentWidth / aspectRatio);
    document.getElementById('imgCustomHeight').value = newHeight;
    updateImageCustomSize();
  }
}

function updateImageCopies(id, delta) {
  const img = toolState.images.find(i => i.id === id);
  if (img) {
    const maxCopies = 50;
    img.copies = Math.max(1, Math.min(maxCopies, img.copies + delta));
    
    // Update copies input
    const copiesInput = document.getElementById('imgCopiesInput');
    if (copiesInput) copiesInput.value = img.copies;
    
    // Update capacity info
    const sizeCapacity = calculateSizeCapacity(img.size);
    const status = img.copies > sizeCapacity ? '⚠️ Over capacity' : `Max: ${sizeCapacity}`;
    document.getElementById('imgCapacityInfo').textContent = status;
    
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
  showToast('Image removed', '');
}

/* ═══════════════════════════════════════════
   IMAGE PREVIEW
═══════════════════════════════════════════ */
function showImagePreview(imgObj) {
  const placeholder = document.getElementById('previewPlaceholder');
  const previewCanvas = document.getElementById('previewCanvas');
  const previewImage = document.getElementById('previewImage');
  const previewStats = document.getElementById('previewStats');

  const srcCanvas = getImageCanvas(imgObj);
  if (srcCanvas && srcCanvas.width > 0 && srcCanvas.height > 0) {
    previewCanvas.width = srcCanvas.width;
    previewCanvas.height = srcCanvas.height;
    const ctx = previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    ctx.drawImage(srcCanvas, 0, 0);
    previewCanvas.style.display = 'block';
    previewImage.style.display = 'none';
  } else {
    previewImage.src = imgObj.src;
    previewImage.style.display = 'block';
    previewCanvas.style.display = 'none';
  }

  if (placeholder) placeholder.style.display = 'none';

  const sizeInfo = SIZES[imgObj.size] || {
    name: imgObj.customWidth && imgObj.customHeight ? `Custom (${imgObj.customWidth}×${imgObj.customHeight} px)` : 'Custom',
    w: imgObj.customWidth ? Math.round(imgObj.customWidth * 25.4 / 300) : '',
    h: imgObj.customHeight ? Math.round(imgObj.customHeight * 25.4 / 300) : ''
  };
  const hasCrop = imgObj.cropRegionW || imgObj.cropX !== 0 || imgObj.cropY !== 0 || imgObj.cropScale !== 1.0;
  const sizeText = sizeInfo.w && sizeInfo.h ? `${sizeInfo.w}×${sizeInfo.h} mm` : `${imgObj.customWidth}×${imgObj.customHeight} px`;
  previewStats.innerHTML = `
    <strong>${sizeInfo.name}</strong><br>
    ${sizeText}<br>
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
   BACKGROUND REMOVAL WITH API
═══════════════════════════════════════════ */

function removeBackground() {
  if (toolState.images.length === 0) {
    showToast('❌ No images added. Please add images first to remove background.', 'error');
    return;
  }

  // Check if API key exists
  if (!isApiKeyConfigured()) {
    showToast('⚠️ No API key found. Please configure your remove.bg API key to continue.', 'error');
    setTimeout(() => {
      openApiKeyModal();
    }, 500);
    return;
  }

  const btn = document.getElementById('removeBgBtn');
  const restoreBtn = document.getElementById('restoreBgBtn');
  
  btn.textContent = '⏳ Processing...';
  btn.disabled = true;
  restoreBtn.disabled = true;

  let processed = 0;
  let failed = 0;
  
  toolState.images.forEach((imgObj, idx) => {
    processImageWithRemoveBg(imgObj, (success) => {
      processed++;
      if (!success) failed++;
      
      document.getElementById('previewInfo').textContent = `⏳ Processing ${processed}/${toolState.images.length}...`;
      
      if (processed === toolState.images.length) {
        btn.textContent = '✂️ Remove Background';
        btn.disabled = false;
        
        if (failed === 0) {
          generatePreview();
          showToast('✓ All backgrounds removed!', 'success');
          restoreBtn.disabled = false;
        } else if (failed === toolState.images.length) {
          showToast(`❌ Failed to remove all backgrounds. Check your API key.`, 'error');
        } else {
          generatePreview();
          showToast(`⚠️ Removed ${processed - failed} of ${toolState.images.length} backgrounds`, 'warning');
          restoreBtn.disabled = false;
        }
        document.getElementById('previewInfo').textContent = `📌 ${processed} images processed`;
      }
    });
  });
}

async function processImageWithRemoveBg(imgObj, callback) {
  try {
    // Get the image as blob/file
    const blob = await canvasToBlob(imgObj.img);
    
    if (!blob) {
      showToast('❌ Failed to process image', 'error');
      callback(false);
      return;
    }

    // Send to remove.bg API
    const formData = new FormData();
    formData.append('image_file', blob);
    formData.append('type', 'auto');
    formData.append('format', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-API-Key': removeBgApiKey
      },
      body: formData
    });

    // Handle API errors with proper error messages
    if (response.status === 401) {
      showToast('❌ Invalid API key! Please check and re-enter.', 'error');
      openApiKeyModal();
      callback(false);
      return;
    }
    
    if (response.status === 400) {
      showToast('❌ Bad Request - Invalid image format. Try a different image.', 'error');
      callback(false);
      return;
    }
    
    if (response.status === 402) {
      showToast('⚠️ Quota exceeded! No more API credits this month.', 'error');
      callback(false);
      return;
    }
    
    if (response.status === 403) {
      showToast('❌ Forbidden! API key validation failed.', 'error');
      callback(false);
      return;
    }
    
    if (response.status === 429) {
      showToast('⏳ Rate limited! Too many requests. Try again in a moment.', 'error');
      callback(false);
      return;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', response.status, errorText);
      showToast(`❌ API Error (${response.status}): Remove.bg service error. Try again later.`, 'error');
      callback(false);
      return;
    }

    // Process successful response
    const resultBlob = await response.blob();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const resultImg = new Image();
        resultImg.onload = () => {
          try {
            // Store the transparent image directly, don't bake in the background color
            // This allows dynamic background color changes
            imgObj.processed = resultImg;
            callback(true);
          } catch (e) {
            console.error('Error processing PNG:', e);
            showToast('❌ Error processing image result', 'error');
            callback(false);
          }
        };
        
        resultImg.onerror = () => {
          console.error('Failed to load API result image');
          showToast('❌ Error loading API result', 'error');
          callback(false);
        };
        
        resultImg.src = e.target.result;
      } catch (e) {
        console.error('Error in FileReader onload:', e);
        callback(false);
      }
    };
    
    reader.onerror = () => {
      console.error('FileReader error');
      showToast('❌ Error reading image data', 'error');
      callback(false);
    };
    
    reader.readAsDataURL(resultBlob);
    
  } catch (error) {
    console.error('Network or processing error:', error);
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      showToast('❌ Network error! Check your internet connection.', 'error');
    } else if (error.message.includes('CORS')) {
      showToast('❌ CORS error! Try again or contact support.', 'error');
    } else {
      showToast(`❌ Error: ${error.message}`, 'error');
    }
    
    callback(false);
  }
}

// Helper function to convert image to blob
function canvasToBlob(imgElement) {
  return new Promise((resolve) => {
    try {
      const width = imgElement.naturalWidth || imgElement.width || 0;
      const height = imgElement.naturalHeight || imgElement.height || 0;
      
      if (width === 0 || height === 0) {
        console.error('Image has invalid dimensions:', width, 'x', height);
        resolve(null);
        return;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgElement, 0, 0);
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png', 0.95);
    } catch (e) {
      console.error('Error converting image:', e);
      resolve(null);
    }
  });
}

function restoreBackground() {
  toolState.images.forEach(img => img.processed = null);
  generatePreview();
  showToast('✓ Backgrounds restored', '');
  document.getElementById('removeBgBtn').disabled = false;
  document.getElementById('restoreBgBtn').disabled = true;
}

/* ═══════════════════════════════════════════
   API KEY MANAGEMENT
═══════════════════════════════════════════ */

/**
 * Check if remove.bg API key is configured
 * @returns {boolean} true if API key is configured, false otherwise
 */
function isApiKeyConfigured() {
  return removeBgApiKey && removeBgApiKey.trim().length > 0;
}

function openApiKeyModal() {
  const modal = document.getElementById('apiKeyModal');
  if (modal) {
    // Load and render saved API keys
    loadApiKeysList();
    renderApiKeysList();
    
    // Pre-fill with saved API key if exists
    if (removeBgApiKey) {
      document.getElementById('apiKeyInput').value = removeBgApiKey;
      // Show status indicator
      document.getElementById('apiStatusInfo').style.display = 'block';
    } else {
      document.getElementById('apiStatusInfo').style.display = 'none';
      document.getElementById('apiKeyInput').value = '';
    }
    
    // Hide all status messages when opening
    document.getElementById('apiErrorMsg').style.display = 'none';
    document.getElementById('apiTestStatus').style.display = 'none';
    document.getElementById('apiSavedMsg').style.display = 'none';
    
    modal.classList.add('open');
    // Don't show overlay click close for this modal
    modal.onclick = (e) => {
      if (e.target === modal) return; // Prevent close
    };
  }
}

function closeApiKeyModal() {
  const modal = document.getElementById('apiKeyModal');
  if (modal) {
    modal.classList.remove('open');
  }
  // Clear error message
  document.getElementById('apiErrorMsg').style.display = 'none';
  document.getElementById('apiTestStatus').style.display = 'none';
  document.getElementById('apiSavedMsg').style.display = 'none';
}

function toggleApiKeyVisibility() {
  const input = document.getElementById('apiKeyInput');
  const checkbox = document.getElementById('showApiKey');
  if (checkbox.checked) {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
}

async function testApiKey() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  
  if (!apiKey) {
    showApiTestError('❌ Please enter an API key first');
    return;
  }

  if (apiKey.length < 20) {
    showApiTestError('❌ API key appears to be invalid (too short). remove.bg keys are usually 20+ characters.');
    return;
  }

  const statusDiv = document.getElementById('apiTestStatus');
  const statusText = document.getElementById('apiTestStatusText');
  statusDiv.style.display = 'block';
  statusText.textContent = '🧪 Testing API key...';

  try {
    // Create a small test image - ensure high quality
    const canvas = document.createElement('canvas');
    canvas.width = 200;  // Slightly larger for better quality
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // Draw a test pattern
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(50, 50, 100, 100);
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(75, 75, 50, 50);

    // Create blob with high quality
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'));
          } else {
            resolve(blob);
          }
        },
        'image/jpeg',  // Use JPEG instead of PNG for better compatibility
        0.95  // High quality
      );
    });

    if (!blob || blob.size === 0) {
      showApiTestError('❌ Failed to create test image - Please try again');
      return;
    }

    const formData = new FormData();
    formData.append('image_file', blob, 'test.jpg');  // Add filename
    formData.append('type', 'auto');
    formData.append('format', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey
      },
      body: formData
    });

    if (response.status === 401) {
      showApiTestError('❌ Unauthorized - API key is invalid. Check your key at remove.bg/api');
      return;
    }

    if (response.status === 400) {
      showApiTestError('❌ Bad Request - The test image may be invalid. Try using a different image format.');
      return;
    }

    if (response.status === 402) {
      showApiTestError('⚠️ Quota exceeded - Your API monthly limit is used up. Upgrade your plan at remove.bg');
      return;
    }

    if (response.status === 403) {
      showApiTestError('❌ Forbidden - Your account may be restricted. Check your remove.bg account');
      return;
    }

    if (!response.ok) {
      showApiTestError(`❌ API Error (${response.status}) - Service error. Please try again later.`);
      return;
    }

    statusDiv.style.background = 'rgba(76, 175, 80, 0.15)';
    statusDiv.style.borderColor = 'rgba(76, 175, 80, 0.3)';
    statusDiv.style.color = '#4CAF50';
    statusText.textContent = '✓ API key is valid and working!';
    
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      showApiTestError('❌ Network error - Check your internet connection');
    } else if (error.message.includes('timeout')) {
      showApiTestError('❌ Request timeout - remove.bg server is slow, try again');
    } else {
      showApiTestError(`❌ Error: ${error.message}`);
    }
  }
}

function showApiTestError(message) {
  const statusDiv = document.getElementById('apiTestStatus');
  const statusText = document.getElementById('apiTestStatusText');
  statusDiv.style.display = 'block';
  statusDiv.style.background = 'rgba(244, 67, 54, 0.15)';
  statusDiv.style.borderColor = 'rgba(244, 67, 54, 0.3)';
  statusDiv.style.color = '#f44336';
  statusText.textContent = message;
}

function saveApiKey() {
  const inputKey = document.getElementById('apiKeyInput').value.trim();
  const errorMsg = document.getElementById('apiErrorMsg');
  const errorText = document.getElementById('apiErrorText');

  // Validation
  if (!inputKey) {
    errorText.textContent = 'Please enter an API key';
    errorMsg.style.display = 'block';
    return;
  }

  if (inputKey.length < 20) {
    errorText.textContent = 'API key appears invalid (too short). Check your remove.bg API key format at remove.bg/api';
    errorMsg.style.display = 'block';
    return;
  }

  // Check for common API key patterns (remove.bg keys are typically 20+ chars)
  if (!/^[a-zA-Z0-9]+$/.test(inputKey)) {
    errorText.textContent = 'API key contains invalid characters. API keys should only contain letters and numbers.';
    errorMsg.style.display = 'block';
    return;
  }

  // Save to localStorage
  try {
    localStorage.setItem('ppp_removebg_key', inputKey);
    removeBgApiKey = inputKey;
    
    // Also add to the keys list if not duplicate
    if (!apiKeysList.some(k => k.key === inputKey)) {
      addApiKey(inputKey, 'API Key ' + new Date().toLocaleDateString());
    } else {
      // Make it active if it already exists
      const existing = apiKeysList.find(k => k.key === inputKey);
      if (existing) {
        setActiveKey(existing.id);
      }
    }
    
    // Show success message
    errorMsg.style.display = 'none';
    document.getElementById('apiTestStatus').style.display = 'none';
    const savedMsg = document.getElementById('apiSavedMsg');
    savedMsg.style.display = 'block';
    
    // Show status indicator
    document.getElementById('apiStatusInfo').style.display = 'block';

    setTimeout(() => {
      savedMsg.style.display = 'none';
      closeApiKeyModal();
      showToast('✓ API Key saved successfully! You can now remove backgrounds.', 'success');
    }, 1500);
    
  } catch (e) {
    errorText.textContent = 'Failed to save API key: ' + e.message;
    errorMsg.style.display = 'block';
  }
}

function clearApiKey() {
  if (confirm('Are you sure? This will remove your saved API key.')) {
    localStorage.removeItem('ppp_removebg_key');
    removeBgApiKey = null;
    document.getElementById('apiKeyInput').value = '';
    showToast('API key removed', '');
    closeApiKeyModal();
  }
}

function toggleAlternativeApis() {
  const list = document.getElementById('alternativeApisList');
  const text = document.getElementById('altApiToggleText');
  
  if (list.style.display === 'none') {
    list.style.display = 'grid';
    text.textContent = 'Hide Alternative APIs';
  } else {
    list.style.display = 'none';
    text.textContent = 'Show Alternative APIs';
  }
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
  
  // Update image preview panel
  showImagePreview(img);
  generatePreview();
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


/* ═══════════════════════════════════════════
   A4 PREVIEW GENERATION
═══════════════════════════════════════════ */
function generatePreview() {
  if (toolState.images.length === 0) {
    const canvas = document.getElementById('a4Canvas');
    const placeholder = document.getElementById('a4Placeholder');
    canvas.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
    document.getElementById('previewInfo').textContent = '📌 Add photos to see preview';
    return;
  }

  const DPI = 96;
  const MM2PX = DPI / 25.4;

  const a4W = Math.round(A4.w * MM2PX);
  const a4H = Math.round(A4.h * MM2PX);
  const margin = Math.round(5 * MM2PX);
  const gap = Math.round(2 * MM2PX); // 2mm gap between images

  // Display preview
  const displayW = 480, displayH = 679;
  const scale = Math.min(displayW / a4W, displayH / a4H);
  const canvas = document.getElementById('a4Canvas');
  
  let canvasW = Math.round(a4W * scale);
  let canvasH = Math.round(a4H * scale);
  
  // Safety: ensure minimum canvas size
  if (canvasW < 100) canvasW = 480;
  if (canvasH < 100) canvasH = 679;
  
  canvas.width = canvasW;
  canvas.height = canvasH;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Failed to get canvas 2D context');
    return;
  }
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Calculate layout with per-image sizes
  let totalUsed = 0;
  let positions = [];
  let currentY = margin; // Start from top with margin
  let currentX = margin; // Start from left with margin
  let rowHeight = 0;
  let maxInRow = 0;

  for (let imgIdx = 0; imgIdx < toolState.images.length; imgIdx++) {
    const imgObj = toolState.images[imgIdx];
    const size = SIZES[imgObj.size];
    const photoW = Math.round(size.w * MM2PX);
    const photoH = Math.round(size.h * MM2PX);

    // Try to fit copies of this image
    for (let copy = 0; copy < imgObj.copies; copy++) {
      if (currentX + photoW > a4W - margin) {
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
    try {
      const imgObj = toolState.images[pos.imgIdx];
      const srcCanvas = getImageCanvas(imgObj);
      if (srcCanvas && srcCanvas.width > 0 && srcCanvas.height > 0) {
        const sx = pos.x * scale;
        const sy = pos.y * scale;
        const sw = pos.w * scale;
        const sh = pos.h * scale;
        ctx.drawImage(srcCanvas, sx, sy, sw, sh);
      }
    } catch (e) {
      console.error('Error drawing image:', e);
    }
  });

  // Draw borders
  if (toolState.borderThickness > 0) {
    positions.forEach(pos => {
      drawBorderScaled(ctx, pos.x, pos.y, pos.w, pos.h, toolState.borderThickness, toolState.borderColor, scale);
    });
  }

  document.getElementById('a4Placeholder').style.display = 'none';
  canvas.style.display = 'block';
  
  // Force canvas to be visible and ensure it's rendered
  if (canvas.parentElement) {
    canvas.parentElement.style.display = 'flex';
  }
  
  // Force reflow to ensure canvas is rendered
  canvas.offsetHeight;

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
  let srcImage = imgObj.processed || imgObj.img;
  
  // Get correct dimensions for both Image and Canvas elements
  const imgWidth = srcImage.naturalWidth || srcImage.width || 0;
  const imgHeight = srcImage.naturalHeight || srcImage.height || 0;
  
  // Safety check: ensure image is loaded
  if (!srcImage || imgWidth === 0 || imgHeight === 0) {
    console.warn('Image not properly loaded:', imgObj.id);
    return document.createElement('canvas'); // Return empty canvas
  }
  
  // Check if this image has a crop region saved
  const hasCropRegion = imgObj.cropRegionW && imgObj.cropRegionH;
  
  let canvasWidth = imgWidth;
  let canvasHeight = imgHeight;
  let srcX = 0, srcY = 0, srcW = imgWidth, srcH = imgHeight;
  
  if (hasCropRegion) {
    // Use the saved crop region
    srcX = imgObj.cropRegionX || 0;
    srcY = imgObj.cropRegionY || 0;
    srcW = imgObj.cropRegionW || imgWidth;
    srcH = imgObj.cropRegionH || imgHeight;
    
    canvasWidth = srcW;
    canvasHeight = srcH;
  }
  
  const tmp = document.createElement('canvas');
  tmp.width = canvasWidth;
  tmp.height = canvasHeight;
  const ctx = tmp.getContext('2d');

  if (!ctx) {
    console.error('Failed to get 2D context');
    return tmp;
  }

  // If this is a processed image, apply background color first
  if (imgObj.processed) {
    ctx.fillStyle = toolState.currentBgColor;
    ctx.fillRect(0, 0, tmp.width, tmp.height);
  }
  
  // Apply filters (brightness, contrast)
  ctx.filter = `brightness(${imgObj.brightness / 100}) contrast(${imgObj.contrast / 100})`;
  ctx.save();
  
  // Apply rotation
  if (imgObj.rotation !== 0) {
    ctx.translate(tmp.width / 2, tmp.height / 2);
    ctx.rotate(imgObj.rotation * Math.PI / 180);
    ctx.translate(-tmp.width / 2, -tmp.height / 2);
  }
  
  // Draw the image (or cropped portion)
  if (hasCropRegion) {
    // Draw only the cropped region
    ctx.drawImage(srcImage, srcX, srcY, srcW, srcH, 0, 0, canvasWidth, canvasHeight);
  } else {
    // Draw the whole image
    ctx.drawImage(srcImage, 0, 0);
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
  const gap = Math.round(2 * MM2PX); // 2mm gap between images

  const printCanvas = document.createElement('canvas');
  printCanvas.width = a4W;
  printCanvas.height = a4H;
  const ctx = printCanvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, a4W, a4H);

  // Layout images on A4
  let currentX = margin; // Start from left with margin
  let currentY = margin; // Start from top with margin
  let rowHeight = 0;
  let totalCount = 0;

  for (let imgIdx = 0; imgIdx < toolState.images.length; imgIdx++) {
    const imgObj = toolState.images[imgIdx];
    const size = SIZES[imgObj.size];
    const photoW = Math.round(size.w * MM2PX);
    const photoH = Math.round(size.h * MM2PX);

    // Draw copies of this image
    for (let copy = 0; copy < imgObj.copies; copy++) {
      if (currentX + photoW > a4W - margin) {
        // Move to next row
        currentX = margin;
        currentY += rowHeight + gap;
        rowHeight = 0;
      }

      if (currentY + photoH > a4H - margin) {
        // Out of space on A4
        break;
      }

      const srcCanvas = getImageCanvas(imgObj);
      ctx.drawImage(srcCanvas, currentX, currentY, photoW, photoH);
      
      // Draw border if any - use same thickness as preview
      if (toolState.borderThickness > 0) {
        drawBorder(ctx, currentX, currentY, photoW, photoH, Math.max(1, toolState.borderThickness), toolState.borderColor);
      }
      
      totalCount++;

      currentX += photoW + gap;
      rowHeight = Math.max(rowHeight, photoH);
    }
  }

  const dataURL = printCanvas.toDataURL('image/jpeg', 0.95);
  const printWin = window.open('', '_blank', 'width=900,height=1000');
  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>PhotoPrint Output - Print</title>
      <style>
        * { margin: 0; padding: 0; }
        @page { margin: 0; size: A4 portrait; }
        body { margin: 0; padding: 0; }
        img { width: 210mm; height: 297mm; display: block; }
      </style>
    </head>
    <body>
      <img src="${dataURL}" alt="PhotoPrint Output" onload="window.print();setTimeout(()=>window.close(),500)">
    </body>
    </html>
  `);
  printWin.document.close();
  showToast('✓ Print dialog opening...', 'success');
}

function openNewPage() {
  if (toolState.images.length === 0) {
    showToast('Add images first', 'error');
    return;
  }

  const DPI = 300;
  const MM2PX = DPI / 25.4;
  const a4W = Math.round(A4.w * MM2PX);
  const a4H = Math.round(A4.h * MM2PX);
  const margin = Math.round(5 * MM2PX);
  const gap = Math.round(2 * MM2PX); // 2mm gap between images

  const pageCanvas = document.createElement('canvas');
  pageCanvas.width = a4W;
  pageCanvas.height = a4H;
  const ctx = pageCanvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, a4W, a4H);

  // Layout images on A4
  let currentX = margin; // Start from left with margin
  let currentY = margin; // Start from top with margin
  let rowHeight = 0;

  for (let imgIdx = 0; imgIdx < toolState.images.length; imgIdx++) {
    const imgObj = toolState.images[imgIdx];
    const size = SIZES[imgObj.size];
    const photoW = Math.round(size.w * MM2PX);
    const photoH = Math.round(size.h * MM2PX);

    for (let copy = 0; copy < imgObj.copies; copy++) {
      if (currentX + photoW > a4W - margin) {
        currentX = margin;
        currentY += rowHeight + gap;
        rowHeight = 0;
      }

      if (currentY + photoH > a4H - margin) {
        break;
      }

      const srcCanvas = getImageCanvas(imgObj);
      ctx.drawImage(srcCanvas, currentX, currentY, photoW, photoH);
      
      // Draw border if any - use same thickness as preview
      if (toolState.borderThickness > 0) {
        drawBorder(ctx, currentX, currentY, photoW, photoH, Math.max(1, toolState.borderThickness), toolState.borderColor);
      }
      
      currentX += photoW + gap;
      rowHeight = Math.max(rowHeight, photoH);
    }
  }

  const dataURL = pageCanvas.toDataURL('image/jpeg', 0.95);
  const newTab = window.open('', '_blank');
  newTab.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>PhotoPrint - New Page</title>
      <style>
        * { margin: 0; padding: 0; }
        @page { margin: 0; size: A4 portrait; }
        body { margin: 0; padding: 0; }
        img { width: 210mm; height: 297mm; display: block; }
      </style>
    </head>
    <body>
      <img src="${dataURL}" alt="PhotoPrint Output">
    </body>
    </html>
  `);
  newTab.document.close();
  showToast('✓ New page opened', 'success');
}

function downloadImage() {
  if (toolState.images.length === 0) {
    showToast('Add images first', 'error');
    return;
  }

  const DPI = 300;
  const MM2PX = DPI / 25.4;
  const a4W = Math.round(A4.w * MM2PX);
  const a4H = Math.round(A4.h * MM2PX);
  const margin = Math.round(5 * MM2PX);
  const gap = Math.round(2 * MM2PX); // 2mm gap between images

  const dlCanvas = document.createElement('canvas');
  dlCanvas.width = a4W;
  dlCanvas.height = a4H;
  const ctx = dlCanvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, a4W, a4H);

  // Layout images on A4
  let currentX = margin; // Start from left with margin
  let currentY = margin; // Start from top with margin
  let rowHeight = 0;

  for (let imgIdx = 0; imgIdx < toolState.images.length; imgIdx++) {
    const imgObj = toolState.images[imgIdx];
    const size = SIZES[imgObj.size];
    const photoW = Math.round(size.w * MM2PX);
    const photoH = Math.round(size.h * MM2PX);

    for (let copy = 0; copy < imgObj.copies; copy++) {
      if (currentX + photoW > a4W - margin) {
        currentX = margin;
        currentY += rowHeight + gap;
        rowHeight = 0;
      }

      if (currentY + photoH > a4H - margin) {
        break;
      }

      const srcCanvas = getImageCanvas(imgObj);
      ctx.drawImage(srcCanvas, currentX, currentY, photoW, photoH);
      
      // Draw border if any - use same thickness as preview
      if (toolState.borderThickness > 0) {
        drawBorder(ctx, currentX, currentY, photoW, photoH, Math.max(1, toolState.borderThickness), toolState.borderColor);
      }
      
      currentX += photoW + gap;
      rowHeight = Math.max(rowHeight, photoH);
    }
  }

  const link = document.createElement('a');
  link.href = dlCanvas.toDataURL('image/jpeg', 0.95);
  link.download = 'PhotoPrint_' + new Date().getTime() + '.jpg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('⬇️ Downloaded!', 'success');
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

  console.log('Opening crop modal with', toolState.images.length, 'images');

  // Start with currently selected image or first image
  const selectedImg = toolState.images.find(i => i.id === toolState.selectedImageId);
  const startIndex = selectedImg ? toolState.images.indexOf(selectedImg) : 0;
  toolState.cropCurrentImageIndex = startIndex;

  const modalEl = document.getElementById('cropModal');
  if (!modalEl) {
    console.error('Crop modal element not found');
    showToast('Error: Crop modal UI not found', 'error');
    return;
  }

  modalEl.classList.add('open');

  // Use a small delay to ensure modal is rendered before setting up canvas
  setTimeout(() => {
    cropCanvas = document.getElementById('cropCanvas');
    if (!cropCanvas) {
      console.error('Crop canvas element not found');
      showToast('Error: Crop canvas not found', 'error');
      return;
    }

    cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) {
      console.error('Failed to get 2D context');
      showToast('Error: Failed to initialize crop tool', 'error');
      return;
    }

    const container = document.getElementById('cropContainer');
    if (!container) {
      console.error('Crop container not found');
      showToast('Error: Crop container not found', 'error');
      return;
    }

    // Set canvas size to match container
    const rect = container.getBoundingClientRect();
    const width = Math.max(300, container.offsetWidth || rect.width || 400);
    const height = container.offsetHeight || rect.height || 320;
    
    cropCanvas.width = width;
    cropCanvas.height = height;

    console.log('Crop canvas initialized:', cropCanvas.width, 'x', cropCanvas.height);

    // Clear any previous event listeners flag
    cropCanvas._cropBound = false;
    
    // Load the image
    loadCropImage(toolState.cropCurrentImageIndex);
    
    // Setup drag/pan/zoom handling
    setupCropDrag();
    
    // Update navigation buttons
    updateCropNavigation();
  }, 50);
}

function loadCropImage(idx) {
  if (idx < 0 || idx >= toolState.images.length) {
    console.warn('Invalid image index:', idx);
    return;
  }
  
  toolState.cropCurrentImageIndex = idx;
  const imgObj = toolState.images[idx];
  
  console.log('Loading crop image at index:', idx, 'ID:', imgObj.id);
  
  // Use processed image if available (background removed), otherwise use original
  const sourceImage = imgObj.processed || imgObj.img;
  
  if (!sourceImage) {
    console.error('No image found at index', idx);
    return;
  }

  // Set the global cropImg variable
  cropImg = sourceImage;
  
  // Reset crop state for new image (crop happens fresh each time)
  toolState.cropOffsetX = 0;
  toolState.cropOffsetY = 0;
  toolState.cropScale = 1.0;
  
  // Reset zoom slider
  const cropZoom = document.getElementById('cropZoom');
  const cropZoomVal = document.getElementById('cropZoomVal');
  if (cropZoom) {
    cropZoom.value = 100;
  }
  if (cropZoomVal) {
    cropZoomVal.textContent = '100%';
  }
  
  // Draw immediately
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
  if (toolState.cropCurrentImageIndex === null || !toolState.images[toolState.cropCurrentImageIndex]) {
    return;
  }
  
  const imgObj = toolState.images[toolState.cropCurrentImageIndex];
  const sourceImage = imgObj.processed || imgObj.img;
  
  if (!sourceImage || !cropCanvas) {
    return;
  }
  
  const imgWidth = sourceImage.naturalWidth || sourceImage.width || 0;
  const imgHeight = sourceImage.naturalHeight || sourceImage.height || 0;
  
  if (imgWidth === 0 || imgHeight === 0) {
    return;
  }
  
  // Get current crop modal canvas dimensions and crop frame
  const W = cropCanvas.width;
  const H = cropCanvas.height;
  const aspect = imgWidth / imgHeight;
  
  // Calculate crop frame dimensions (must match drawCrop())
  const cropW = Math.min(W * 0.7, H * 0.7 * aspect);
  const cropH = cropW / aspect;
  const cx = (W - cropW) / 2;  // Frame center X
  const cy = (H - cropH) / 2;  // Frame center Y
  
  // Current image drawing position on canvas
  const scaledWidth = imgWidth * toolState.cropScale;
  const scaledHeight = imgHeight * toolState.cropScale;
  const drawX = (W - scaledWidth) / 2 + toolState.cropOffsetX;
  const drawY = (H - scaledHeight) / 2 + toolState.cropOffsetY;
  
  // Calculate which part of the image is within the crop frame
  // Convert frame coordinates to image coordinates
  const frameLeftX = (cx - drawX) / toolState.cropScale;
  const frameTopY = (cy - drawY) / toolState.cropScale;
  const frameRightX = frameLeftX + (cropW / toolState.cropScale);
  const frameBottomY = frameTopY + (cropH / toolState.cropScale);
  
  // Clamp to image bounds
  const cropImageX = Math.max(0, Math.floor(frameLeftX));
  const cropImageY = Math.max(0, Math.floor(frameTopY));
  const cropImageW = Math.min(imgWidth - cropImageX, Math.ceil(frameRightX - frameLeftX));
  const cropImageH = Math.min(imgHeight - cropImageY, Math.ceil(frameBottomY - frameTopY));
  
  // Store the crop region (in original image coordinates)
  imgObj.cropRegionX = cropImageX;
  imgObj.cropRegionY = cropImageY;
  imgObj.cropRegionW = cropImageW;
  imgObj.cropRegionH = cropImageH;
  
  console.log('Saved crop region:', {x: cropImageX, y: cropImageY, w: cropImageW, h: cropImageH});
}

function drawCrop() {
  // Validate all requirements
  if (!cropCanvas || !cropCtx || !cropImg) {
    console.warn('drawCrop: Missing requirements - canvas:', !!cropCanvas, 'ctx:', !!cropCtx, 'img:', !!cropImg);
    return;
  }
  
  const W = cropCanvas.width;
  const H = cropCanvas.height;
  
  if (W === 0 || H === 0) {
    console.warn('drawCrop: Invalid canvas size:', W, 'x', H);
    return;
  }

  // Get image dimensions - try both naturalWidth/Height and width/height
  let imgWidth = 0, imgHeight = 0;
  
  if (cropImg.naturalWidth) {
    imgWidth = cropImg.naturalWidth;
    imgHeight = cropImg.naturalHeight;
  } else if (cropImg.width) {
    imgWidth = cropImg.width;
    imgHeight = cropImg.height;
  }
  
  console.log('drawCrop - Canvas:', W, 'x', H, 'Image:', imgWidth, 'x', imgHeight);
  
  if (imgWidth === 0 || imgHeight === 0) {
    console.warn('drawCrop: Image not ready - dimensions are 0');
    // Draw loading placeholder
    cropCtx.fillStyle = '#1a1a2e';
    cropCtx.fillRect(0, 0, W, H);
    cropCtx.fillStyle = '#666';
    cropCtx.font = '16px Arial';
    cropCtx.textAlign = 'center';
    cropCtx.textBaseline = 'middle';
    cropCtx.fillText('Loading image...', W / 2, H / 2);
    return;
  }

  // Get current image object
  const currentImg = toolState.images[toolState.cropCurrentImageIndex];
  if (!currentImg) {
    console.error('drawCrop: Current image not found at index', toolState.cropCurrentImageIndex);
    return;
  }
  
  // Get size information
  const size = SIZES[currentImg.size];
  if (!size) {
    console.warn('drawCrop: Size not found for', currentImg.size, '- using default');
  }
  
  const aspect = size ? (size.w / size.h) : (imgWidth / imgHeight);

  // Calculate draw dimensions
  const drawH = H * toolState.cropScale;
  const drawW = drawH * imgWidth / imgHeight;

  const x = (W - drawW) / 2 + toolState.cropOffsetX;
  const y = (H - drawH) / 2 + toolState.cropOffsetY;

  // Clear and fill background
  cropCtx.fillStyle = '#1a1a2e';
  cropCtx.fillRect(0, 0, W, H);

  // Draw the image
  try {
    cropCtx.drawImage(cropImg, x, y, drawW, drawH);
  } catch (e) {
    console.error('drawCrop: Error drawing image:', e);
    return;
  }

  // Calculate crop frame dimensions
  const cropW = Math.min(W * 0.7, H * 0.7 * aspect);
  const cropH = cropW / aspect;
  const cx = (W - cropW) / 2;
  const cy = (H - cropH) / 2;

  // Dark overlay outside crop frame
  cropCtx.fillStyle = 'rgba(0,0,0,0.6)';
  cropCtx.fillRect(0, 0, W, cy);
  cropCtx.fillRect(0, cy + cropH, W, H - cy - cropH);
  cropCtx.fillRect(0, cy, cx, cropH);
  cropCtx.fillRect(cx + cropW, cy, W - cx - cropW, cropH);

  // Blue frame border
  cropCtx.strokeStyle = '#2B73FF';
  cropCtx.lineWidth = 3;
  cropCtx.strokeRect(cx, cy, cropW, cropH);

  // Grid lines
  cropCtx.strokeStyle = 'rgba(43,115,255,0.5)';
  cropCtx.lineWidth = 1;
  cropCtx.beginPath();
  // Vertical lines
  cropCtx.moveTo(cx + cropW / 3, cy);
  cropCtx.lineTo(cx + cropW / 3, cy + cropH);
  cropCtx.moveTo(cx + cropW * 2 / 3, cy);
  cropCtx.lineTo(cx + cropW * 2 / 3, cy + cropH);
  // Horizontal lines
  cropCtx.moveTo(cx, cy + cropH / 3);
  cropCtx.lineTo(cx + cropW, cy + cropH / 3);
  cropCtx.moveTo(cx, cy + cropH * 2 / 3);
  cropCtx.lineTo(cx + cropW, cy + cropH * 2 / 3);
  cropCtx.stroke();
}

function updateCropZoom(val) {
  toolState.cropScale = val / 100;
  const cropZoomVal = document.getElementById('cropZoomVal');
  if (cropZoomVal) {
    cropZoomVal.textContent = val + '%';
  }
  drawCrop();
}

function applyCrop() {
  saveCropForCurrentImage();
  generatePreview();
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

  // Mouse events for desktop
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
  
  // Touch events for mobile
  let initialDistance = 0;
  let initialScale = 1;
  
  cropCanvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      // Single touch - start dragging
      toolState.cropDragging = true;
      const touch = e.touches[0];
      toolState.cropStartX = touch.clientX - toolState.cropOffsetX;
      toolState.cropStartY = touch.clientY - toolState.cropOffsetY;
    } else if (e.touches.length === 2) {
      // Two touches - start pinch zoom
      toolState.cropDragging = false; // Disable dragging during pinch
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      initialScale = toolState.cropScale;
    }
  });
  
  cropCanvas.addEventListener('touchmove', e => {
    e.preventDefault(); // Prevent scrolling
    
    if (e.touches.length === 1 && toolState.cropDragging) {
      // Single touch - dragging
      const touch = e.touches[0];
      toolState.cropOffsetX = touch.clientX - toolState.cropStartX;
      toolState.cropOffsetY = touch.clientY - toolState.cropStartY;
      drawCrop();
    } else if (e.touches.length === 2) {
      // Two touches - pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (initialDistance > 0) {
        const scale = (currentDistance / initialDistance) * initialScale;
        toolState.cropScale = Math.max(0.5, Math.min(3.0, scale));
        const cropZoomSlider = document.getElementById('cropZoom');
        if (cropZoomSlider) {
          cropZoomSlider.value = Math.round(toolState.cropScale * 100);
        }
        const cropZoomVal = document.getElementById('cropZoomVal');
        if (cropZoomVal) {
          cropZoomVal.textContent = Math.round(toolState.cropScale * 100) + '%';
        }
        drawCrop();
      }
    }
  });
  
  cropCanvas.addEventListener('touchend', e => {
    if (e.touches.length === 0) {
      toolState.cropDragging = false;
    }
  });
  
  // Scroll/wheel zoom for desktop
  cropCanvas.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newScale = Math.max(0.5, Math.min(3.0, toolState.cropScale + delta));
    const cropZoomSlider = document.getElementById('cropZoom');
    if (cropZoomSlider) {
      cropZoomSlider.value = Math.round(newScale * 100);
    }
    updateCropZoom(Math.round(newScale * 100));
  }, { passive: false });
}

/* ═══════════════════════════════════════════
   API KEY SETUP
═══════════════════════════════════════════ */
function skipApiKeySetup() {
  document.getElementById('apiKeyModal').classList.remove('open');
}

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  updateCapacity();
  setActiveNav('tool');
  loadApiKeysList(); // Load saved API keys on page load

  // Handle global size selector - applies to currently selected image
  const sizeSelect = document.getElementById('sizeSelect');
  if (sizeSelect) {
    sizeSelect.addEventListener('change', (e) => {
      const customInputs = document.getElementById('customSizeInputs');
      if (e.target.value === 'custom') {
        customInputs.style.display = 'block';
        updateCustomSize(); // Apply custom size when selected
      } else {
        customInputs.style.display = 'none';
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
      }
    });
  }

  document.getElementById('cropModal').addEventListener('click', function (e) {
    if (e.target === this) closeCropModal();
  });

  document.getElementById('apiKeyModal').addEventListener('click', function (e) {
    if (e.target === this) skipApiKeySetup();
  });

});

function toggleAutoAdjust() {
  autoAdjustAspect = document.getElementById('autoAdjustAspect').checked;
  if (autoAdjustAspect && toolState.selectedImageId) {
    const img = toolState.images.find(i => i.id === toolState.selectedImageId);
    if (img) {
      const aspectRatio = img.img.naturalWidth / img.img.naturalHeight;
      // Update height based on current width
      const currentWidth = parseInt(document.getElementById('customWidth').value);
      const newHeight = Math.round(currentWidth / aspectRatio);
      document.getElementById('customHeight').value = newHeight;
      updateCustomSize();
    }
  }
}

function updateBorder() {
  const thickness = parseInt(document.getElementById('slBorder').value);
  toolState.borderThickness = thickness;
  document.getElementById('valBorder').textContent = thickness + 'px';
  renderImagesList();
  generatePreview();
}

function updateBorderColor() {
  const color = document.getElementById('borderColor').value;
  toolState.borderColor = color;
  renderImagesList();
  generatePreview();
}

function adjustBorder(delta) {
  const slider = document.getElementById('slBorder');
  let newVal = parseInt(slider.value) + delta;
  newVal = Math.max(slider.min, Math.min(slider.max, newVal));
  slider.value = newVal;
  updateBorder();
}

function updateCustomSize() {
  const widthPx = parseInt(document.getElementById('customWidth').value);
  let heightPx = parseInt(document.getElementById('customHeight').value);
  
  // If auto-adjust is on and we have a selected image, maintain aspect ratio
  if (autoAdjustAspect && toolState.selectedImageId) {
    const img = toolState.images.find(i => i.id === toolState.selectedImageId);
    if (img) {
      const aspectRatio = img.img.naturalWidth / img.img.naturalHeight;
      // Determine which input was changed last (simple way: if width changed, adjust height)
      // For simplicity, always adjust height based on width when auto-adjust is on
      const newHeight = Math.round(widthPx / aspectRatio);
      document.getElementById('customHeight').value = newHeight;
      // Update heightPx
      heightPx = newHeight;
    }
  }
  
  // Convert px to mm at 300 DPI
  const pxToMm = 25.4 / 300;
  const widthMm = Math.round(widthPx * pxToMm);
  const heightMm = Math.round(heightPx * pxToMm);
  
  // Update SIZES
  SIZES.custom = {
    name: `Custom (${widthPx}×${heightPx} px)`,
    w: widthMm,
    h: heightMm
  };
  
  // Set all images to custom size
  toolState.images.forEach(img => {
    img.size = 'custom';
  });
  
  // Update UI
  const sizeSelect = document.getElementById('sizeSelect');
  sizeSelect.value = 'custom';
  document.getElementById('customSizeInputs').style.display = 'block';
  
  updateCapacityDisplay();
  generatePreview();
  renderImagesList();
  showToast(`All images set to custom size ${widthPx}×${heightPx} px`, 'success');
}
