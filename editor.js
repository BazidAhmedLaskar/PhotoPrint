// ==========================================
// PHOTOPRINT ADVANCED PHOTO EDITOR
// Full-featured web-based image editor
// ==========================================

class PhotoEditor {
  constructor() {
    this.canvas = document.getElementById('mainCanvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.originalImage = null;
    this.currentImage = null;
    this.baseImage = null;
    
    // State management
    this.state = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      exposure: 0,
      sharpness: 0,
      warmth: 0,
      rotation: 0,
      flipH: false,
      flipV: false,
      currentFilter: 'original'
    };

    // History for undo/redo
    this.history = [];
    this.historyIndex = -1;

    // Crop state
    this.cropMode = false;
    this.cropArea = null;
    this.cropRatio = 'free';

    // Initialize
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadTheme();
    this.setupDragDrop();
  }

  setupEventListeners() {
    // Upload
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');

    uploadArea.addEventListener('click', () => imageInput.click());
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files.length) this.loadImage(files[0]);
    });

    imageInput.addEventListener('change', (e) => {
      if (e.target.files.length) this.loadImage(e.target.files[0]);
    });

    // Brightness, Contrast, Saturation, etc.
    document.getElementById('brightness').addEventListener('input', (e) => {
      this.state.brightness = parseInt(e.target.value);
      document.getElementById('brightnessValue').textContent = e.target.value + '%';
      this.render();
    });

    document.getElementById('contrast').addEventListener('input', (e) => {
      this.state.contrast = parseInt(e.target.value);
      document.getElementById('contrastValue').textContent = e.target.value + '%';
      this.render();
    });

    document.getElementById('saturation').addEventListener('input', (e) => {
      this.state.saturation = parseInt(e.target.value);
      document.getElementById('saturationValue').textContent = e.target.value + '%';
      this.render();
    });

    document.getElementById('exposure').addEventListener('input', (e) => {
      this.state.exposure = parseInt(e.target.value);
      document.getElementById('exposureValue').textContent = e.target.value;
      this.render();
    });

    document.getElementById('sharpness').addEventListener('input', (e) => {
      this.state.sharpness = parseInt(e.target.value);
      document.getElementById('sharpnessValue').textContent = e.target.value + '%';
      this.render();
    });

    document.getElementById('warmth').addEventListener('input', (e) => {
      this.state.warmth = parseInt(e.target.value);
      document.getElementById('warmthValue').textContent = e.target.value;
      this.render();
    });

    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.currentFilter = btn.dataset.filter;
        this.render();
      });
    });

    // Transform
    document.getElementById('rotateLeft').addEventListener('click', () => {
      this.state.rotation = (this.state.rotation - 90) % 360;
      this.render();
    });

    document.getElementById('rotateRight').addEventListener('click', () => {
      this.state.rotation = (this.state.rotation + 90) % 360;
      this.render();
    });

    document.getElementById('flipH').addEventListener('click', () => {
      this.state.flipH = !this.state.flipH;
      this.render();
    });

    document.getElementById('flipV').addEventListener('click', () => {
      this.state.flipV = !this.state.flipV;
      this.render();
    });

    // Crop
    document.getElementById('enableCrop').addEventListener('click', () => {
      this.enableCropMode();
    });

    document.getElementById('cropRatio').addEventListener('change', (e) => {
      this.cropRatio = e.target.value;
    });

    document.getElementById('applyResize').addEventListener('click', () => {
      const width = parseInt(document.getElementById('resizeWidth').value);
      const height = parseInt(document.getElementById('resizeHeight').value);
      if (width && height && this.currentImage) {
        this.resize(width, height);
        this.showToast('Image resized successfully!');
      } else {
        this.showToast('Please enter valid width and height', 'error');
      }
    });

    // Export
    document.getElementById('downloadJPG').addEventListener('click', () => {
      this.download('jpg');
    });

    document.getElementById('downloadPNG').addEventListener('click', () => {
      this.download('png');
    });

    // Undo/Redo/Reset
    document.getElementById('undoBtn').addEventListener('click', () => {
      this.undo();
    });

    document.getElementById('redoBtn').addEventListener('click', () => {
      this.redo();
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      if (confirm('Reset all edits?')) {
        this.reset();
      }
    });

    // Before/After
    document.getElementById('beforeAfter').addEventListener('click', () => {
      this.toggleBeforeAfter();
    });

    // Student Features
    document.getElementById('passportMaker').addEventListener('click', () => {
      this.showPassportModal();
    });

    document.getElementById('compressImage').addEventListener('click', () => {
      this.showCompressModal();
    });

    document.getElementById('resizeForForms').addEventListener('click', () => {
      this.showResizeFormsModal();
    });

    // Modal handlers
    document.getElementById('applyPassport').addEventListener('click', () => {
      this.generatePassportPhotos();
    });

    document.getElementById('closePassportModal').addEventListener('click', () => {
      document.getElementById('passportModal').style.display = 'none';
    });

    document.getElementById('applyCompress').addEventListener('click', () => {
      const targetSize = parseInt(document.getElementById('targetSize').value);
      this.compressImage(targetSize);
    });

    document.getElementById('closeCompressModal').addEventListener('click', () => {
      document.getElementById('compressModal').style.display = 'none';
    });

    document.getElementById('closeResizeFormsModal').addEventListener('click', () => {
      document.getElementById('resizeFormsModal').style.display = 'none';
    });

    document.querySelectorAll('.size-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const size = parseInt(btn.dataset.size);
        this.resizeForForms(size);
        document.getElementById('resizeFormsModal').style.display = 'none';
      });
    });

    // Comparison slider
    if (document.querySelector('.comparison-slider-handle')) {
      this.setupComparisonSlider();
    }
  }

  setupDragDrop() {
    // Already handled in event listeners
  }

  loadImage(file) {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.originalImage = img;
          this.currentImage = img;
          this.baseImage = img;
          this.fitCanvasToImage();
          this.reset();
          this.showToast('Image loaded successfully!');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.showToast('Please select a valid image file', 'error');
    }
  }

  fitCanvasToImage() {
    if (!this.currentImage) return;
    const img = this.currentImage;
    
    // Adjust canvas display size (NOT the actual canvas dimensions to avoid clearing the canvas)
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (!canvasWrapper) return;
    
    const maxWidth = canvasWrapper.clientWidth;
    const maxHeight = canvasWrapper.clientHeight;
    
    const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
    this.canvas.style.width = (img.width * scale) + 'px';
    this.canvas.style.height = (img.height * scale) + 'px';
  }

  render() {
    if (!this.baseImage) return;

    // Set canvas size
    this.canvas.width = this.baseImage.width;
    this.canvas.height = this.baseImage.height;

    // Apply transformations
    this.ctx.save();
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);

    // Apply rotation
    this.ctx.rotate((this.state.rotation * Math.PI) / 180);

    // Apply flips
    this.ctx.scale(
      this.state.flipH ? -1 : 1,
      this.state.flipV ? -1 : 1
    );

    this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);

    // Get image data
    this.ctx.drawImage(this.baseImage, 0, 0);
    let imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.restore();

    // Apply filters and adjustments
    imageData = this.applyAdjustments(imageData);
    imageData = this.applyFilter(imageData, this.state.currentFilter);
    imageData = this.applySharpness(imageData);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.putImageData(imageData, 0, 0);

    this.fitCanvasToImage();
  }

  applyAdjustments(imageData) {
    const data = imageData.data;
    const brightness = this.state.brightness / 100;
    const contrast = this.state.contrast / 100;
    const saturation = this.state.saturation / 100;
    const exposure = this.state.exposure / 100;
    const warmth = this.state.warmth;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Brightness
      r *= brightness;
      g *= brightness;
      b *= brightness;

      // Contrast
      r = (r - 128) * contrast + 128;
      g = (g - 128) * contrast + 128;
      b = (b - 128) * contrast + 128;

      // Exposure
      r += 50 * exposure;
      g += 50 * exposure;
      b += 50 * exposure;

      // Warmth
      r += warmth * 0.5;
      b -= warmth * 0.5;

      // Saturation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * saturation;
      g = gray + (g - gray) * saturation;
      b = gray + (b - gray) * saturation;

      // Clamp values
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    return imageData;
  }

  applyFilter(imageData, filterName) {
    const data = imageData.data;

    switch (filterName) {
      case 'grayscale':
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = data[i + 1] = data[i + 2] = gray;
        }
        break;

      case 'sepia':
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
          data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
          data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
        }
        break;

      case 'vintage':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.1);
          data[i + 2] = Math.max(0, data[i + 2] * 0.9);
          if (Math.random() > 0.99) {
            data[i + 3] = Math.max(0, data[i + 3] * 0.95);
          }
        }
        break;

      case 'cool':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.max(0, data[i] * 0.9);
          data[i + 2] = Math.min(255, data[i + 2] * 1.1);
        }
        break;

      case 'warm':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.1);
          data[i + 2] = Math.max(0, data[i + 2] * 0.9);
        }
        break;

      case 'highcontrast':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = data[i] > 128 ? 255 : 0;
          data[i + 1] = data[i + 1] > 128 ? 255 : 0;
          data[i + 2] = data[i + 2] > 128 ? 255 : 0;
        }
        break;

      case 'invert':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i];
          data[i + 1] = 255 - data[i + 1];
          data[i + 2] = 255 - data[i + 2];
        }
        break;
    }

    return imageData;
  }

  applySharpness(imageData) {
    if (this.state.sharpness === 0) return imageData;

    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const sharpness = this.state.sharpness / 100;

    // Simple sharpening filter
    for (let i = width * 4; i < data.length - width * 4; i += 4) {
      if ((i / 4) % width === 0 || (i / 4) % width === width - 1) continue;

      const center = i;
      const neighbors = [
        data[i - 4], data[i + 1 - 4], data[i + 2 - 4],
        data[i - 4 * width], data[i + 1 - 4 * width], data[i + 2 - 4 * width],
        data[i + 4], data[i + 1 + 4], data[i + 2 + 4],
        data[i + 4 * width], data[i + 1 + 4 * width], data[i + 2 + 4 * width]
      ];

      const avg = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;

      data[center] = Math.min(255, data[center] + (data[center] - avg) * sharpness);
      data[center + 1] = Math.min(255, data[center + 1] + (data[center + 1] - avg) * sharpness);
      data[center + 2] = Math.min(255, data[center + 2] + (data[center + 2] - avg) * sharpness);
    }

    return imageData;
  }

  enableCropMode() {
    if (!this.currentImage) {
      this.showToast('Please load an image first', 'error');
      return;
    }

    this.cropMode = !this.cropMode;
    const overlay = document.getElementById('cropOverlay');
    
    if (this.cropMode) {
      overlay.style.display = 'block';
      this.setupCropHandlers();
      this.showToast('Click and drag to crop. Double-click to apply.');
    } else {
      overlay.style.display = 'none';
    }
  }

  setupCropHandlers() {
    const overlay = document.getElementById('cropOverlay');
    const canvas = this.canvas;
    let startX, startY, endX, endY;
    let isDrawing = false;

    overlay.addEventListener('mousedown', (e) => {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
    });

    overlay.addEventListener('mousemove', (e) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      endX = e.clientX - rect.left;
      endY = e.clientY - rect.top;
      this.drawCropArea(startX, startY, endX, endY);
    });

    overlay.addEventListener('mouseup', () => {
      isDrawing = false;
    });

    overlay.addEventListener('dblclick', () => {
      if (this.cropArea) {
        this.applyCrop(this.cropArea);
        this.cropMode = false;
        overlay.style.display = 'none';
      }
    });
  }

  drawCropArea(x1, y1, x2, y2) {
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);

    this.cropArea = { x, y, width, height };
  }

  applyCrop(area) {
    const { x, y, width, height } = area;
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = width;
    croppedCanvas.height = height;
    const croppedCtx = croppedCanvas.getContext('2d');

    croppedCtx.drawImage(
      this.canvas,
      x, y, width, height,
      0, 0, width, height
    );

    this.baseImage = new Image();
    this.baseImage.onload = () => {
      this.fitCanvasToImage();
      this.render();
      this.saveToHistory();
      this.showToast('Image cropped successfully!');
    };
    this.baseImage.src = croppedCanvas.toDataURL();
  }

  resize(newWidth, newHeight) {
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = newWidth;
    resizedCanvas.height = newHeight;
    const resizedCtx = resizedCanvas.getContext('2d');

    resizedCtx.drawImage(this.canvas, 0, 0, newWidth, newHeight);

    this.baseImage = new Image();
    this.baseImage.onload = () => {
      this.fitCanvasToImage();
      this.render();
      this.saveToHistory();
    };
    this.baseImage.src = resizedCanvas.toDataURL();
  }

  reset() {
    this.state = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      exposure: 0,
      sharpness: 0,
      warmth: 0,
      rotation: 0,
      flipH: false,
      flipV: false,
      currentFilter: 'original'
    };

    // Reset sliders
    document.getElementById('brightness').value = 100;
    document.getElementById('contrast').value = 100;
    document.getElementById('saturation').value = 100;
    document.getElementById('exposure').value = 0;
    document.getElementById('sharpness').value = 0;
    document.getElementById('warmth').value = 0;

    // Update displays
    document.getElementById('brightnessValue').textContent = '100%';
    document.getElementById('contrastValue').textContent = '100%';
    document.getElementById('saturationValue').textContent = '100%';
    document.getElementById('exposureValue').textContent = '0';
    document.getElementById('sharpnessValue').textContent = '0%';
    document.getElementById('warmthValue').textContent = '0';

    // Reset filter buttons
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-filter="original"]').classList.add('active');

    this.baseImage = this.originalImage;
    this.history = [];
    this.historyIndex = -1;

    if (this.baseImage) {
      this.render();
    }
  }

  saveToHistory() {
    const canvas = document.createElement('canvas');
    canvas.width = this.canvas.width;
    canvas.height = this.canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.canvas, 0, 0);

    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(canvas.toDataURL());
    this.historyIndex++;
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const imageData = this.history[this.historyIndex];
      this.loadFromDataURL(imageData);
      this.showToast('Undo successful');
    } else {
      this.showToast('Nothing to undo', 'error');
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const imageData = this.history[this.historyIndex];
      this.loadFromDataURL(imageData);
      this.showToast('Redo successful');
    } else {
      this.showToast('Nothing to redo', 'error');
    }
  }

  loadFromDataURL(dataURL) {
    const img = new Image();
    img.onload = () => {
      this.canvas.width = img.width;
      this.canvas.height = img.height;
      this.ctx.drawImage(img, 0, 0);
      this.fitCanvasToImage();
    };
    img.src = dataURL;
  }

  toggleBeforeAfter() {
    if (!this.baseImage) {
      this.showToast('Please load an image first', 'error');
      return;
    }

    const comparisonContainer = document.getElementById('comparisonContainer');
    const canvasWrapper = document.querySelector('.canvas-wrapper');

    if (comparisonContainer.style.display === 'none') {
      canvasWrapper.style.display = 'none';
      comparisonContainer.style.display = 'flex';

      // Draw before image
      const beforeCanvas = document.getElementById('beforeCanvas');
      beforeCanvas.width = this.originalImage.width;
      beforeCanvas.height = this.originalImage.height;
      const beforeCtx = beforeCanvas.getContext('2d');
      beforeCtx.drawImage(this.originalImage, 0, 0);

      // Draw after image
      const afterCanvas = document.getElementById('afterCanvas');
      afterCanvas.width = this.canvas.width;
      afterCanvas.height = this.canvas.height;
      const afterCtx = afterCanvas.getContext('2d');
      afterCtx.drawImage(this.canvas, 0, 0);

      this.showToast('Drag the slider to compare');
    } else {
      canvasWrapper.style.display = 'flex';
      comparisonContainer.style.display = 'none';
      this.showToast('Comparison closed');
    }
  }

  setupComparisonSlider() {
    const slider = document.querySelector('.comparison-slider-handle');
    const container = document.querySelector('.comparison-container');
    let isSliding = false;

    slider.addEventListener('mousedown', () => {
      isSliding = true;
    });

    document.addEventListener('mouseup', () => {
      isSliding = false;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isSliding) return;

      const rect = container.getBoundingClientRect();
      let x = e.clientX - rect.left;
      x = Math.max(0, Math.min(x, rect.width));

      const percentage = (x / rect.width) * 100;
      slider.style.left = percentage + '%';
      document.querySelector('.comparison-img-2').style.clipPath = 
        `inset(0 ${100 - percentage}% 0 0)`;
    });
  }

  download(format) {
    if (!this.canvas) {
      this.showToast('No image to download', 'error');
      return;
    }

    const quality = parseFloat(document.getElementById('quality').value);
    const link = document.createElement('a');
    link.href = this.canvas.toDataURL(`image/${format}`, quality);
    link.download = `photo_${Date.now()}.${format}`;
    link.click();
    this.showToast(`Downloaded as ${format.toUpperCase()}`);
  }

  generatePassportPhotos() {
    const layout = document.querySelector('input[name="passportLayout"]:checked').value;
    const cols = parseInt(layout);
    const rows = Math.ceil(8 / cols);

    // A4 size in pixels (210x297mm at 96 DPI)
    const a4Width = 794; // 210mm
    const a4Height = 1123; // 297mm

    const passportCanvas = document.createElement('canvas');
    passportCanvas.width = a4Width;
    passportCanvas.height = a4Height;
    const passportCtx = passportCanvas.getContext('2d');

    // White background
    passportCtx.fillStyle = 'white';
    passportCtx.fillRect(0, 0, a4Width, a4Height);

    // Passport photo size: 35x45mm
    const photoWidth = 131; // 35mm in pixels
    const photoHeight = 169; // 45mm in pixels

    const padding = 10;
    const photoPerPage = cols * rows;

    for (let i = 0; i < photoPerPage; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = padding + col * (photoWidth + padding);
      const y = padding + row * (photoHeight + padding);

      passportCtx.drawImage(this.canvas, x, y, photoWidth, photoHeight);
      passportCtx.strokeStyle = '#999';
      passportCtx.lineWidth = 0.5;
      passportCtx.strokeRect(x, y, photoWidth, photoHeight);
    }

    const link = document.createElement('a');
    link.href = passportCanvas.toDataURL('image/png');
    link.download = `passport_photos_${Date.now()}.png`;
    link.click();

    document.getElementById('passportModal').style.display = 'none';
    this.showToast('Passport photo layout downloaded!');
  }

  compressImage(targetSizeKB) {
    if (!this.canvas) {
      this.showToast('No image to compress', 'error');
      return;
    }

    let quality = 0.95;
    let dataURL;

    do {
      dataURL = this.canvas.toDataURL('image/jpeg', quality);
      const sizeInBytes = dataURL.length * 0.75;
      const sizeInKB = sizeInBytes / 1024;

      if (sizeInKB <= targetSizeKB || quality <= 0.1) {
        const img = new Image();
        img.onload = () => {
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          this.ctx.drawImage(img, 0, 0);
          this.fitCanvasToImage();
          this.baseImage = img;

          const link = document.createElement('a');
          link.href = dataURL;
          link.download = `compressed_${Date.now()}.jpg`;
          link.click();

          document.getElementById('compressModal').style.display = 'none';
          this.showToast(`Compressed to ~${Math.round(sizeInKB)}KB`);
        };
        img.src = dataURL;
        break;
      }

      quality -= 0.05;
    } while (quality > 0);
  }

  resizeForForms(targetSizeKB) {
    if (!this.canvas) {
      this.showToast('No image to resize', 'error');
      return;
    }

    let scale = 1;
    let dataURL;

    do {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.canvas.width * scale;
      tempCanvas.height = this.canvas.height * scale;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(this.canvas, 0, 0, tempCanvas.width, tempCanvas.height);

      dataURL = tempCanvas.toDataURL('image/jpeg', 0.85);
      const sizeInBytes = dataURL.length * 0.75;
      const sizeInKB = sizeInBytes / 1024;

      if (sizeInKB <= targetSizeKB || scale <= 0.1) {
        const img = new Image();
        img.onload = () => {
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          this.ctx.drawImage(img, 0, 0);
          this.fitCanvasToImage();

          const link = document.createElement('a');
          link.href = dataURL;
          link.download = `resized_${targetSizeKB}kb_${Date.now()}.jpg`;
          link.click();

          this.showToast(`Resized to ~${Math.round(sizeInKB)}KB`);
        };
        img.src = dataURL;
        break;
      }

      scale -= 0.05;
    } while (scale > 0.1);
  }

  showPassportModal() {
    if (!this.originalImage) {
      this.showToast('Please load an image first', 'error');
      return;
    }
    document.getElementById('passportModal').style.display = 'block';
  }

  showCompressModal() {
    if (!this.originalImage) {
      this.showToast('Please load an image first', 'error');
      return;
    }
    document.getElementById('compressModal').style.display = 'block';
  }

  showResizeFormsModal() {
    if (!this.originalImage) {
      this.showToast('Please load an image first', 'error');
      return;
    }
    document.getElementById('resizeFormsModal').style.display = 'block';
  }

  showToast(message, type = 'success') {
    // Use shared.js showToast function for consistency with other pages
    const toastStyle = type === 'error' ? 'error' : (type === 'warning' ? 'warning' : 'success');
    
    // Map to shared function if available, otherwise use local implementation
    if (typeof showToast === 'function') {
      showToast(message, toastStyle);
    } else {
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = message;
        toast.style.background = type === 'error' ? '#e74c3c' : '#27ae60';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
      }
    }
  }

  toggleTheme() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
  }

  loadTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.body.classList.add('dark-theme');
    }
  }
}

// Initialize editor on page load
document.addEventListener('DOMContentLoaded', () => {
  new PhotoEditor();
});
